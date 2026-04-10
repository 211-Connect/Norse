#!/usr/bin/env tsx
/**
 * bin/setup-umami.ts
 *
 * Creates Umami websites for each Payload tenant, assigns them to a team,
 * and writes the resulting website ID back to tenant.common.umamiWebsiteId.
 *
 * Usage:
 *   pnpm setup-umami --team-name "My Team"
 *   pnpm setup-umami --team-id <umami-team-id>
 *   pnpm setup-umami --team-id <id> --tenant-id <payload-tenant-id>
 *   pnpm setup-umami --team-id <id> --dry-run
 *   pnpm setup-umami --team-id <id> --force   # overwrite existing website IDs
 *
 * Required environment variables (loaded via dotenv-cli):
 *   UMAMI_API_URL      – base URL of the Umami instance (e.g. http://localhost:3000)
 *   UMAMI_USERNAME     – Umami admin username
 *   UMAMI_PASSWORD     – Umami admin password
 *   DATABASE_URI       – Postgres connection string (used by Payload)
 *   PAYLOAD_SECRET     – Payload secret
 */

import { getPayload } from 'payload';
import config from '@payload-config';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  teamId: string | null;
  teamName: string | null;
  tenantId: string | null;
  dryRun: boolean;
  force: boolean;
} {
  const args = argv.slice(2);
  let teamId: string | null = null;
  let teamName: string | null = null;
  let tenantId: string | null = null;
  let dryRun = false;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--team-id':
        teamId = args[++i] ?? null;
        break;
      case '--team-name':
        teamName = args[++i] ?? null;
        break;
      case '--tenant-id':
        tenantId = args[++i] ?? null;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--force':
        force = true;
        break;
      default:
        console.warn(`Unknown argument: ${args[i]}`);
    }
  }

  return { teamId, teamName, tenantId, dryRun, force };
}

// ---------------------------------------------------------------------------
// Umami API helpers
// ---------------------------------------------------------------------------

interface UmamiTeam {
  id: string;
  name: string;
}

interface UmamiWebsite {
  id: string;
  name: string;
  domain: string;
}

async function umamiLogin(
  baseUrl: string,
  username: string,
  password: string,
): Promise<string> {
  console.log('🔐 Logging in to Umami...');
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Umami login failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token)
    throw new Error('Umami login response did not include a token.');

  return data.token;
}

async function umamiListTeams(
  baseUrl: string,
  token: string,
): Promise<UmamiTeam[]> {
  const res = await fetch(`${baseUrl}/api/teams`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to list Umami teams (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { data?: UmamiTeam[] } | UmamiTeam[];
  return Array.isArray(data) ? data : (data.data ?? []);
}

async function umamiListTeamWebsites(
  baseUrl: string,
  token: string,
  teamId: string,
): Promise<UmamiWebsite[]> {
  const res = await fetch(
    `${baseUrl}/api/teams/${teamId}/websites?pageSize=500`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to list team websites (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { data?: UmamiWebsite[] } | UmamiWebsite[];
  return Array.isArray(data) ? data : (data.data ?? []);
}

async function umamiCreateWebsite(
  baseUrl: string,
  token: string,
  name: string,
  domain: string,
  teamId: string,
): Promise<UmamiWebsite> {
  const res = await fetch(`${baseUrl}/api/websites`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ name, domain, teamId }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to create Umami website "${name}" (${res.status}): ${body}`,
    );
  }

  return (await res.json()) as UmamiWebsite;
}

async function umamiAddWebsiteToTeam(
  baseUrl: string,
  token: string,
  teamId: string,
  websiteId: string,
): Promise<void> {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/websites`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ websiteId }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    // 409 = already in team – treat as success
    if (res.status !== 409) {
      throw new Error(
        `Failed to add website ${websiteId} to team ${teamId} (${res.status}): ${body}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const {
    teamId: rawTeamId,
    teamName,
    tenantId,
    dryRun,
    force,
  } = parseArgs(process.argv);

  if (!rawTeamId && !teamName) {
    console.error('❌  Provide either --team-id <id> or --team-name <name>.');
    process.exit(1);
  }

  const umamiApiUrl = process.env.UMAMI_API_URL;
  const umamiUsername = process.env.UMAMI_USERNAME;
  const umamiPassword = process.env.UMAMI_PASSWORD;

  if (!umamiApiUrl || !umamiUsername || !umamiPassword) {
    console.error(
      '❌  Required environment variables missing: UMAMI_API_URL, UMAMI_USERNAME, UMAMI_PASSWORD',
    );
    process.exit(1);
  }

  if (dryRun) console.log('ℹ️  Dry-run mode – no changes will be made.\n');

  // ── Umami auth ──────────────────────────────────────────────────────────
  console.log('🔐 Authenticating with Umami...');
  const token = await umamiLogin(umamiApiUrl, umamiUsername, umamiPassword);

  // ── Resolve team ID ──────────────────────────────────────────────────────
  let teamId = rawTeamId;

  if (!teamId) {
    console.log(`🔍 Looking up team "${teamName}"...`);
    const teams = await umamiListTeams(umamiApiUrl, token);
    const match = teams.find(
      (t) => t.name.toLowerCase() === teamName!.toLowerCase(),
    );

    if (!match) {
      const names = teams.map((t) => `"${t.name}"`).join(', ');
      console.error(
        `❌  Team "${teamName}" not found. Available teams: ${names || '(none)'}`,
      );
      process.exit(1);
    }

    teamId = match.id;
    console.log(`   Found team: "${match.name}" (${teamId})\n`);
  }

  // Pre-fetch existing team websites to detect duplicates by name
  console.log('📋 Fetching existing team websites...');
  const existingTeamWebsites = await umamiListTeamWebsites(
    umamiApiUrl,
    token,
    teamId,
  );
  const existingByName = new Map(
    existingTeamWebsites.map((w) => [w.name.toLowerCase(), w]),
  );
  console.log(
    `   ${existingTeamWebsites.length} website(s) already in team.\n`,
  );

  // ── Payload ──────────────────────────────────────────────────────────────
  console.log('🚀 Connecting to Payload...');
  const payload = await getPayload({ config });

  const query = tenantId
    ? await payload.find({
        collection: 'tenants',
        where: { id: { equals: tenantId } },
        limit: 1,
        overrideAccess: true,
      })
    : await payload.find({
        collection: 'tenants',
        limit: 1000,
        overrideAccess: true,
      });

  if (query.docs.length === 0) {
    console.error(
      tenantId
        ? `❌  Tenant "${tenantId}" not found.`
        : '❌  No tenants found.',
    );
    process.exit(1);
  }

  console.log(`   Found ${query.docs.length} tenant(s).\n`);
  console.log('='.repeat(60));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const tenant of query.docs) {
    const existingWebsiteId = tenant.common?.umamiWebsiteId;

    if (existingWebsiteId && !force) {
      console.log(
        `⏭️  [${tenant.id}] "${tenant.name}" – already has website ID ${existingWebsiteId}, skipping.`,
      );
      skipped++;
      continue;
    }

    // Determine domain: first trusted domain, fallback to tenant id
    const firstDomain = tenant.trustedDomains?.[0]?.domain;
    const domain = firstDomain ?? tenant.id;

    // Check if a website with this name already exists in the team
    const existingWebsite = existingByName.get(tenant.name.toLowerCase());

    let websiteId: string;

    if (existingWebsite) {
      websiteId = existingWebsite.id;
      console.log(
        `♻️  [${tenant.id}] "${tenant.name}" – reusing existing Umami website "${existingWebsite.name}" (${websiteId}).`,
      );
    } else {
      console.log(
        `🌐 [${tenant.id}] "${tenant.name}" – creating Umami website (domain: ${domain})...`,
      );

      if (!dryRun) {
        try {
          const website = await umamiCreateWebsite(
            umamiApiUrl,
            token,
            tenant.name,
            domain,
            teamId,
          );
          websiteId = website.id;

          // Some Umami versions don't add to team on creation – ensure it
          await umamiAddWebsiteToTeam(umamiApiUrl, token, teamId, websiteId);

          console.log(`   ✅ Created website ID: ${websiteId}`);
          // Keep cache up to date for subsequent iterations
          existingByName.set(tenant.name.toLowerCase(), {
            id: websiteId,
            name: tenant.name,
            domain,
          });
        } catch (err) {
          console.error(`   ❌ Failed: ${(err as Error).message}`);
          failed++;
          continue;
        }
      } else {
        console.log(`   [dry-run] Would create website and update tenant.`);
        skipped++;
        continue;
      }
    }

    // ── Update Payload tenant ────────────────────────────────────────────
    if (!dryRun) {
      try {
        await payload.update({
          collection: 'tenants',
          id: tenant.id,
          overrideAccess: true,
          data: {
            common: {
              ...tenant.common,
              umamiWebsiteId: websiteId,
            },
          },
        });
        console.log(`   💾 Saved umamiWebsiteId to tenant "${tenant.id}".`);
        created++;
      } catch (err) {
        console.error(
          `   ❌ Failed to update tenant "${tenant.id}": ${(err as Error).message}`,
        );
        failed++;
      }
    } else {
      console.log(
        `   [dry-run] Would set tenant.common.umamiWebsiteId = ${websiteId}`,
      );
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`  ✅ Processed : ${created}`);
  console.log(`  ⏭️  Skipped   : ${skipped}`);
  console.log(`  ❌ Failed    : ${failed}`);
  console.log('='.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
