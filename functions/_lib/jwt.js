// JWT helpers using Web Crypto API (Cloudflare Workers / Pages Functions)
// Supports HS256 (HMAC-SHA256) — same algorithm as Node.js `jsonwebtoken`

function base64UrlEncode(input) {
  // input: ArrayBuffer or Uint8Array
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function utf8ToBytes(str) {
  return new TextEncoder().encode(str);
}

function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes);
}

async function getHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    utf8ToBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signHS256(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = base64UrlEncode(utf8ToBytes(JSON.stringify(header)));
  const encPayload = base64UrlEncode(utf8ToBytes(JSON.stringify(payload)));
  const signingInput = `${encHeader}.${encPayload}`;
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, utf8ToBytes(signingInput));
  const encSig = base64UrlEncode(sig);
  return `${signingInput}.${encSig}`;
}

export async function verifyHS256(token, secret) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'TOKEN_MALFORMED' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'TOKEN_MALFORMED' };
  }
  const [encHeader, encPayload, encSig] = parts;
  const signingInput = `${encHeader}.${encPayload}`;
  try {
    const key = await getHmacKey(secret);
    const sigBytes = base64UrlDecode(encSig);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      utf8ToBytes(signingInput)
    );
    if (!valid) return { valid: false, error: 'SIGNATURE_INVALID' };

    const payloadJson = bytesToUtf8(base64UrlDecode(encPayload));
    const payload = JSON.parse(payloadJson);
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'TOKEN_INVALID' };
  }
}

export function extractBearerToken(authorization) {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
