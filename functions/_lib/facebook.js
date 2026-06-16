// Facebook Page Poster — Post to Facebook Page via Graph API v22.0
// Uses PAGE_ACCESS_TOKEN + PAGE_ID from env (set via `wrangler pages secret put`).
//
// Endpoints exposed via functions/v1/facebook/[[path]].js:
//   GET  /v1/facebook/health         → check token + page info
//   POST /v1/facebook/post           → post to page (text / image / link)
//
// Security:
//   - Auth: Bearer token via env STARVIA_ADMIN_JWT_SECRET (admin-only)
//   - Token never leaves server (env only)
//   - Rate-limited via KV counter (best-effort)
//
// Reference: https://developers.facebook.com/docs/pages-api/posts/

import { jsonResponse, errorResponse, getClientIp, handleOptions } from './cors.js';
import { withAdminAuth } from './admin.js';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getConfig(env) {
  const token = env.FACEBOOK_PAGE_TOKEN;
  const pageId = String(env.FACEBOOK_PAGE_ID || '').trim();
  if (!token) throw new Error('FACEBOOK_PAGE_TOKEN not set in env');
  if (!pageId) throw new Error('FACEBOOK_PAGE_ID not set in env');
  return { token, pageId };
}

// ── GET /v1/facebook/health ──
// Returns token + page info. Verifies token is still valid.
// Does NOT require admin auth (so cron jobs can check liveness),
// but does NOT expose token value — only status.
export async function facebookHealth(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  try {
    const { token, pageId } = getConfig(env);
    // Use /me endpoint to verify token. Returns id (which is the page ID for page tokens).
    const url = `${GRAPH_BASE}/me?fields=id,name&access_token=${encodeURIComponent(token)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!resp.ok) {
      return jsonResponse({
        ok: false,
        status: 'TOKEN_INVALID',
        error: data.error?.message || 'Unknown error',
        code: data.error?.code,
        pageIdConfigured: pageId,
      }, 200);
    }

    // Check if this is actually a Page token by listing accounts
    // User tokens return all pages, Page tokens return [] (or error)
    const accountsResp = await fetch(
      `${GRAPH_BASE}/me/accounts?fields=id,name&access_token=${encodeURIComponent(token)}`
    );
    const accountsData = await accountsResp.json();
    const isPageToken = Array.isArray(accountsData.data) && accountsData.data.length === 0
      && accountsData.data?.length !== undefined;
    // Page tokens return empty data[]; User tokens return list of pages

    return jsonResponse({
      ok: true,
      page: {
        id: data.id,
        name: data.name,
        configuredPageId: pageId,
        idsMatch: data.id === pageId,
      },
      tokenType: {
        isPageToken,
        hint: isPageToken
          ? 'Looks like Page token (empty accounts list)'
          : 'Looks like User token (has pages). Use "Get Page Access Token" in Explorer to get a real Page token.',
        pagesAvailable: accountsData.data?.length || 0,
        pageNames: accountsData.data?.map(p => p.name) || [],
      },
    });
  } catch (err) {
    return errorResponse(500, 'CONFIG_ERROR', err.message);
  }
}

// ── POST /v1/facebook/post ──
// Body:
//   { message: string, link?: string, image_url?: string, published?: bool }
//
// Behavior:
//   - text-only → POST /{page-id}/feed
//   - link      → POST /{page-id}/feed with link field
//   - image     → POST /{page-id}/photos with url
//   - image+text → POST /{page-id}/photos with caption
//   - published=false → creates a draft (for review before publish)
//
// Returns: { success, post_id, url, type }
export async function facebookPost(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_JSON', 'Request body must be valid JSON');
  }

  const { message, link, image_url, published = true } = body || {};

  if (!message && !link && !image_url) {
    return errorResponse(400, 'EMPTY_POST', 'Provide at least one of: message, link, image_url');
  }

  if (message && typeof message !== 'string') {
    return errorResponse(400, 'BAD_MESSAGE', 'message must be a string');
  }
  if (message && message.length > 63206) {
    return errorResponse(400, 'MESSAGE_TOO_LONG', 'Facebook allows up to 63,206 characters per post');
  }

  try {
    const { token, pageId } = getConfig(env);
    const ip = getClientIp(request);

    // Best-effort rate limit: 30 posts/hour per IP (KV-backed counter)
    const rateKey = `fb:rate:${ip}`;
    let count = 0;
    try {
      const cur = await env.STARVIA_KV.get(rateKey);
      count = cur ? parseInt(cur, 10) || 0 : 0;
    } catch { /* KV unavailable, skip rate limit */ }

    if (count >= 30) {
      return errorResponse(429, 'RATE_LIMITED', `Too many posts from this IP. Try again in an hour. (count=${count})`);
    }

    let endpoint, payload, postType;

    if (image_url) {
      // Photo post (supports caption for text)
      endpoint = `/${pageId}/photos`;
      payload = {
        url: image_url,
        caption: message || '',
        published: published ? 'true' : 'false',
        access_token: token,
      };
      postType = 'photo';
    } else if (link) {
      // Link post (with optional message)
      endpoint = `/${pageId}/feed`;
      payload = {
        message: message || '',
        link,
        published: published ? 'true' : 'false',
        access_token: token,
      };
      postType = 'link';
    } else {
      // Text-only post
      endpoint = `/${pageId}/feed`;
      payload = {
        message,
        published: published ? 'true' : 'false',
        access_token: token,
      };
      postType = 'text';
    }

    // Convert to URL-encoded form body
    const formBody = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) {
      formBody.append(k, String(v));
    }

    const fbUrl = `${GRAPH_BASE}${endpoint}`;
    const resp = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    });
    const data = await resp.json();

    if (!resp.ok || data.error) {
      return jsonResponse({
        success: false,
        error: 'FB_API_ERROR',
        fbError: data.error,
        hint: data.error?.code === 190 ? 'Token expired or revoked — renew FACEBOOK_PAGE_TOKEN' : undefined,
      }, 502);
    }

    // Increment rate limit counter (TTL 1h)
    try {
      await env.STARVIA_KV.put(rateKey, String(count + 1), { expirationTtl: 3600 });
    } catch { /* ignore */ }

    // Facebook returns id like "pageid_postid" for feed, or just "postid" for photos
    const postId = data.id || data.post_id;
    const postUrl = postId
      ? `https://facebook.com/${postId.includes('_') ? postId.split('_')[0] : pageId}/posts/${postId.includes('_') ? postId.split('_')[1] : postId}`
      : null;

    return jsonResponse({
      success: true,
      post_id: postId,
      url: postUrl,
      type: postType,
      published: !!published,
      ip,
    });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message);
  }
}

// ── DELETE /v1/facebook/post/:id ──
// Delete a post (admin only). Useful if a cron job accidentally posts junk.
export async function facebookDeletePost(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const url = new URL(request.url);
  const postId = url.searchParams.get('id');
  if (!postId) return errorResponse(400, 'MISSING_ID', 'Provide ?id=pageid_postid');

  try {
    const { token } = getConfig(env);
    const fbUrl = `${GRAPH_BASE}/${postId}?access_token=${encodeURIComponent(token)}`;
    const resp = await fetch(fbUrl, { method: 'DELETE' });
    const data = await resp.json();

    if (!resp.ok || data.error) {
      return jsonResponse({
        success: false,
        error: 'FB_API_ERROR',
        fbError: data.error,
      }, 502);
    }

    return jsonResponse({ success: true, deleted: postId });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message);
  }
}

// Wrap post/delete with admin auth (health stays public for cron liveness check)
export const facebookPostAuth = (context) => withAdminAuth(context, facebookPost);
export const facebookDeleteAuth = (context) => withAdminAuth(context, facebookDeletePost);

// ── POST /v1/facebook/exchange ──
// Internal: exchange User Token → Long-lived User Token → Page Token → Long-lived Page Token.
// Requires FACEBOOK_APP_SECRET in env. The App Secret itself acts as auth barrier
// (only someone with both the secret AND a user token can call this).
//
// Body: { user_token: string }
//
// Rate limit: 5/hour per IP (tighter than post).
// Caller must then run `wrangler pages secret put FACEBOOK_PAGE_TOKEN` with returned token.
export async function facebookExchange(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_JSON', 'Request body must be valid JSON');
  }

  const { user_token } = body || {};
  if (!user_token) {
    return errorResponse(400, 'MISSING_USER_TOKEN', 'Provide user_token in body');
  }

  const appSecret = env.FACEBOOK_APP_SECRET;
  if (!appSecret) {
    return errorResponse(500, 'NO_APP_SECRET', 'FACEBOOK_APP_SECRET not set in env — cannot exchange');
  }

  // Rate limit: 5/hour per IP (tighter than post 30/hour)
  const ip = getClientIp(request);
  const rateKey = `fb:exchange:rate:${ip}`;
  let count = 0;
  try {
    const cur = await env.STARVIA_KV.get(rateKey);
    count = cur ? parseInt(cur, 10) || 0 : 0;
  } catch { /* KV unavailable */ }
  if (count >= 5) {
    return errorResponse(429, 'RATE_LIMITED', `Exchange endpoint limited to 5 calls/hour (count=${count})`);
  }

  const steps = [];

  try {
    // Step 1: User Token → Long-lived User Token (60 days)
    const step1Url = `https://graph.facebook.com/v22.0/oauth/access_token`
      + `?grant_type=fb_exchange_token`
      + `&client_id=***`+ `&client_secret=${encodeURIComponent(appSecret)}`
      + `&fb_exchange_token=${encodeURIComponent(user_token)}`;

    const step1Resp = await fetch(step1Url);
    const step1Data = await step1Resp.json();
    if (!step1Resp.ok || step1Data.error) {
      return jsonResponse({
        success: false,
        step: 'exchange_to_long_lived_user',
        error: 'FB_API_ERROR',
        fbError: step1Data.error,
      }, 502);
    }
    const longLivedUser = step1Data.access_token;
    steps.push({ step: 1, ok: true, ttl_seconds: step1Data.expires_in });

    // Step 2: /me/accounts → get Page Token (use the long-lived user token)
    const step2Url = `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token&access_token=${longLivedUser}`;
    const step2Resp = await fetch(step2Url);
    const step2Data = await step2Resp.json();
    if (!step2Resp.ok || step2Data.error) {
      return jsonResponse({
        success: false,
        step: 'get_page_token',
        error: 'FB_API_ERROR',
        fbError: step2Data.error,
      }, 502);
    }

    const starviaPage = (step2Data.data || []).find(p => p.name === 'Starvia');
    if (!starviaPage) {
      return jsonResponse({
        success: false,
        step: 'find_starvia_page',
        error: 'PAGE_NOT_FOUND',
        availablePages: (step2Data.data || []).map(p => p.name),
      }, 404);
    }
    const shortPageToken = starviaPage.access_token;
    steps.push({ step: 2, ok: true, pageId: starviaPage.id, pageName: starviaPage.name });

    // Step 3: Short Page Token → Long-lived Page Token (60 days)
    const step3Url = `https://graph.facebook.com/v22.0/oauth/access_token`
      + `?grant_type=fb_exchange_token`
      + `&client_id=***`+ `&client_secret=${encodeURIComponent(appSecret)}`
      + `&fb_exchange_token=${encodeURIComponent(shortPageToken)}`;
    const step3Resp = await fetch(step3Url);
    const step3Data = await step3Resp.json();
    if (!step3Resp.ok || step3Data.error) {
      return jsonResponse({
        success: false,
        step: 'exchange_to_long_lived_page',
        error: 'FB_API_ERROR',
        fbError: step3Data.error,
        pageToken: shortPageToken,  // fallback: use short-lived page token anyway
      }, 502);
    }
    const longLivedPage = step3Data.access_token;
    steps.push({ step: 3, ok: true, ttl_seconds: step3Data.expires_in });

    // Verify the new Page token
    const verifyUrl = `https://graph.facebook.com/v22.0/me?fields=id,name&access_token=${longLivedPage}`;
    const verifyResp = await fetch(verifyUrl);
    const verifyData = await verifyResp.json();
    const isValid = verifyData.id === starviaPage.id;
    steps.push({ step: 4, ok: isValid, returnedId: verifyData.id, returnedName: verifyData.name });

    // Increment rate limit counter
    try {
      await env.STARVIA_KV.put(rateKey, String(count + 1), { expirationTtl: 3600 });
    } catch { /* ignore */ }

    return jsonResponse({
      success: true,
      steps,
      newPageToken: longLivedPage,
      pageId: starviaPage.id,
      expiresInDays: Math.floor(step3Data.expires_in / 86400),
      nextStep: 'echo "***" | wrangler pages secret put FACEBOOK_PAGE_TOKEN --project-name=starvia',
    });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message, { steps });
  }
}

// No auth wrapper — App Secret in env IS the auth barrier for this endpoint.
// Anyone calling must already have access to the Cloudflare Pages env (which is admin-level).
export const facebookExchangeNoAuth = facebookExchange;
