import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const CHUNK_SIZE = 4;

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

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
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

async function sendChunk(baseUrl, apiKeys, internalApiKey) {
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
  return { ok: response.ok, status: response.status, body };
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
  const allPairs = buildApiKeyPairs(entries);

  if (allPairs.length === 0) {
    console.error(`No tenant API key pairs found in ${envFilePath}`);
    process.exit(1);
  }

  console.log(`Found ${allPairs.length} tenant API key pair(s) to update:`);
  for (const { tenantId, apiKey } of allPairs) {
    console.log(`  ${tenantId} -> ${apiKey}`);
  }

  const chunks = chunkArray(allPairs, CHUNK_SIZE);
  console.log(
    `Sending in ${chunks.length} chunk(s) of up to ${CHUNK_SIZE} item(s) each.`,
  );

  const allUpdated = [];
  const allFailed = [];
  let anyRequestFailed = false;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`\nChunk ${i + 1}/${chunks.length}: ${chunk.length} item(s)`);
    const { ok, status, body } = await sendChunk(
      baseUrl,
      chunk,
      internalApiKey,
    );

    console.log(`Response ${status}:`, body);

    if (!ok) {
      anyRequestFailed = true;
      continue;
    }

    if (Array.isArray(body.updated)) {
      allUpdated.push(...body.updated);
    }
    if (Array.isArray(body.failed)) {
      allFailed.push(...body.failed);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Updated: ${allUpdated.length}`);
  console.log(`Failed:  ${allFailed.length}`);

  if (allFailed.length > 0) {
    console.log('Failed details:', allFailed);
  }

  if (anyRequestFailed || allFailed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
