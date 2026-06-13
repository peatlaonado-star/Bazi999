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
    // Use /me endpoint to verify token. Page ID is in env, not the URL.
    const url = `${GRAPH_BASE}/me?fields=id,name,access_token&access_token=${encodeURIComponent(token)}`;
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

    return jsonResponse({
      ok: true,
      page: {
        id: data.id,
        name: data.name,
        configuredPageId: pageId,
        idsMatch: data.id === pageId,
      },
      tokenInfo: data.access_token
        ? { present: true, snippet: data.access_token.slice(0, 8) + '…' }
        : { present: false },
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
