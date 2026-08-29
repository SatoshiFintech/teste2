import dotenv from 'dotenv';

dotenv.config();

function parseAllowedOrigins(raw?: string): string[] {
  if (!raw || raw.trim() === '') {
    return [];
  }

  return raw.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function requireEnv(name: string, value: string | undefined, isProduction: boolean, fallback?: string) {
  const candidate = value?.trim();
  const safeFallback = fallback?.trim();

  if (candidate && candidate.length > 0) {
    if (name === 'JWT_SECRET' && isProduction && candidate.length < 32) {
      throw new Error(`Environment variable ${name} must be at least 32 characters long in production.`);
    }

    return candidate;
  }

  if (!isProduction && safeFallback) {
    return safeFallback;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
const isProduction = nodeEnv === 'production';

const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('Environment variable PORT must be a valid TCP port between 1 and 65535.');
}

const jwtSecret = requireEnv('JWT_SECRET', process.env.JWT_SECRET, isProduction, 'dev-secret-change-me');
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

if (isProduction && allowedOrigins.length === 0) {
  throw new Error('Environment variable ALLOWED_ORIGINS must be set in production with trusted frontend origins.');
}

export const env = {
  port,
  jwtSecret,
  nodeEnv,
  allowedOrigins: isProduction ? allowedOrigins : ['http://localhost:5173', 'http://127.0.0.1:5173'],
};
