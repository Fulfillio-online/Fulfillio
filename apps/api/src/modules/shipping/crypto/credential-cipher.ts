import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const VERSION_PREFIX = 'v1:';

function getEncryptionKey(): Buffer {
  const rawSecret =
    process.env.COURIER_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'fulfillio-default-dev-courier-key-change-in-production';
  return crypto.createHash('sha256').update(rawSecret).digest();
}

export function encryptJson(payload: Record<string, any>): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${VERSION_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptJson<T = Record<string, any>>(ciphertext?: string | null): T {
  if (!ciphertext) return {} as T;
  if (!ciphertext.startsWith(VERSION_PREFIX)) {
    try {
      return JSON.parse(ciphertext) as T;
    } catch {
      return {} as T;
    }
  }

  try {
    const parts = ciphertext.slice(VERSION_PREFIX.length).split(':');
    if (parts.length !== 3) return {} as T;
    const [ivB64, tagB64, dataB64] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(dataB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as T;
  } catch {
    return {} as T;
  }
}

export function encryptString(value?: string | null): string | null {
  if (!value || !value.trim()) return null;
  return encryptJson({ v: value.trim() });
}

export function decryptString(ciphertext?: string | null): string | null {
  if (!ciphertext) return null;
  const obj = decryptJson<{ v?: string }>(ciphertext);
  return typeof obj?.v === 'string' && obj.v.length > 0 ? obj.v : null;
}

export function maskSecret(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= 6) return '••••••';
  return `${trimmed.slice(0, 3)}${'•'.repeat(Math.min(10, trimmed.length - 6))}${trimmed.slice(-3)}`;
}

export function maskCredentialsMap(creds: Record<string, any>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds || {})) {
    if (typeof v === 'string' && v.trim().length > 0) {
      masked[k] = maskSecret(v);
    }
  }
  return masked;
}
