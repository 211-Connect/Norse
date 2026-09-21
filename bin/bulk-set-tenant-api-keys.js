import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

function parseEnvFile(filePath) {
  const text = readFileSync(resolve(filePath), 'utf8');
  const entries = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    entries[key] = value.trim();
  }
  return entries;
}

function buildApiKeyPairs(entries) {
  const pairs = [];
  for (const [key, value] of Object.entries(entries)) {
    if (!key.endsWith('_UUID') || !value) continue;
    const stem = key.replace(/^TENANT_/, '').replace(/_UUID$/, '');
    if (!stem) continue;
    const apiKey = entries[`KEY_TENANT_${stem}`];
    if (!apiKey) continue;
    pairs.push({ tenantId: value, apiKey });
  }
  return pairs;
}

function usage() {
  console.error(
    'Usage: node bin/bulk-set-tenant-api-keys.js <baseUrl> <envFilePath>',
  );
  console.error(
    'Example: node bin/bulk-set-tenant-api-keys.js http://localhost:3000 unkey-resources-random.env',
  );
  console.error('INTERNAL_API_KEY env var must also be set.');
}

async function main() {
  const baseUrl = process.argv[2];
  const envFilePath = process.argv[3];

  if (!baseUrl || !envFilePath) {
    usage();
    process.exit(1);
  }

  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (!internalApiKey) {
    console.error('INTERNAL_API_KEY env var is required');
    process.exit(1);
  }

  const entries = parseEnvFile(envFilePath);
  const apiKeys = buildApiKeyPairs(entries);

  if (apiKeys.length === 0) {
    console.error(`No tenant API key pairs found in ${envFilePath}`);
    process.exit(1);
  }

  console.log(`Found ${apiKeys.length} tenant API key pair(s) to update:`);
  for (const { tenantId, apiKey } of apiKeys) {
    console.log(`  ${tenantId} -> ${apiKey}`);
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/tenants/bulk-set-api-keys`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': internalApiKey,
    },
    body: JSON.stringify({ apiKeys }),
  });

  const body = await response.json().catch(() => ({}));
  console.log(`Response ${response.status}:`, body);

  if (!response.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
