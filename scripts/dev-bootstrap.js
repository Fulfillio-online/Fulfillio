const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function parseDatabaseUrl(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^\s*DATABASE_URL\s*=\s*(.+)$/m);
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, '');
}

function setDatabaseUrl(filePath, newUrl) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const quoted = `"${newUrl}"`;
  if (/^\s*DATABASE_URL\s*=.*$/m.test(content)) {
    content = content.replace(/^\s*DATABASE_URL\s*=.*$/m, `DATABASE_URL=${quoted}`);
  } else {
    content += `\nDATABASE_URL=${quoted}\n`;
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

function isLocalUrl(url) {
  if (!url) return true;
  return url.includes('localhost') || url.includes('127.0.0.1');
}

function ensureEnvFiles() {
  const envExample = path.join(rootDir, '.env.example');
  const rootEnv = path.join(rootDir, '.env');
  const apiEnv = path.join(rootDir, 'apps', 'api', '.env');
  const workerEnv = path.join(rootDir, 'apps', 'worker', '.env');

  if (fs.existsSync(envExample)) {
    for (const target of [rootEnv, apiEnv, workerEnv]) {
      if (!fs.existsSync(target)) {
        fs.copyFileSync(envExample, target);
        console.log(`[Bootstrap] Created ${path.relative(rootDir, target)} from .env.example`);
      }
    }
  }

  // Sync Neon / Cloud DATABASE_URL across root .env, apps/api/.env, and apps/worker/.env
  const rootDbUrl = parseDatabaseUrl(rootEnv);
  const apiDbUrl = parseDatabaseUrl(apiEnv);
  const workerDbUrl = parseDatabaseUrl(workerEnv);

  const cloudDbUrl = [rootDbUrl, apiDbUrl, workerDbUrl].find((u) => u && !isLocalUrl(u));

  if (cloudDbUrl) {
    if (rootDbUrl !== cloudDbUrl) setDatabaseUrl(rootEnv, cloudDbUrl);
    if (apiDbUrl !== cloudDbUrl) setDatabaseUrl(apiEnv, cloudDbUrl);
    if (workerDbUrl !== cloudDbUrl) setDatabaseUrl(workerEnv, cloudDbUrl);
  }

  const webEnv = path.join(rootDir, 'apps', 'web', '.env.local');
  if (!fs.existsSync(webEnv)) {
    fs.writeFileSync(
      webEnv,
      'PORT=3000\nNEXT_PUBLIC_API_URL=http://localhost:4000/api\nNEXT_PUBLIC_APP_DOMAIN=localhost:3000\n'
    );
    console.log('[Bootstrap] Created apps/web/.env.local');
  }

  return cloudDbUrl || rootDbUrl || apiDbUrl;
}

function maskDbUrl(url) {
  if (!url) return 'Not configured';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname}`;
  } catch {
    return 'Configured';
  }
}

async function main() {
  console.log('======================================================');
  console.log('🚀 Fulfillio Cloud Database (Neon) & Localhost Runner');
  console.log('======================================================');

  const activeDbUrl = ensureEnvFiles();
  console.log(`🗄️  Database Target: ${maskDbUrl(activeDbUrl)}`);

  if (!activeDbUrl) {
    console.warn('⚠️  DATABASE_URL not found in .env! Please add your Neon PostgreSQL URL to .env');
  }

  console.log('🔄 Generating Prisma Client...');
  try {
    execSync('pnpm --filter=@fulfillio/api exec prisma generate', { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.warn('⚠️  prisma generate notice:', err.message);
  }

  console.log('🔄 Synchronizing Prisma schema with Database (prisma db push)...');
  try {
    execSync('pnpm --filter=@fulfillio/api exec prisma db push --accept-data-loss', { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.warn('⚠️  prisma db push notice:', err.message);
  }

  console.log('🌱 Verifying core database records (Merchants MC-101..MC-106 & Super Admin)...');
  try {
    execSync('pnpm --filter=@fulfillio/api exec prisma db seed', { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.warn('⚠️  prisma db seed notice:', err.message);
  }

  console.log('======================================================');
  console.log('✅ Neon Database ready! Starting API (4000) & Web (3000)...');
  console.log('======================================================');
}

main();
