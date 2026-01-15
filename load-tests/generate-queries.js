#!/usr/bin/env node

/**
 * Generate queries.js file from database
 * Fetches taxonomy queries from rds_topics_list_subtopics
 * with English labels from rds_topics_list_subtopics_locales
 */

import pg from 'pg';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database configuration from environment
const DATABASE_URI =
  process.env.DATABASE_URI ||
  'postgresql://norse-ng:norse-ng@localhost:5432/norse-ng';

const { Client } = pg;

async function fetchQueries() {
  const client = new Client({
    connectionString: DATABASE_URI,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Fetch subtopics with taxonomy query type and their English labels
    const result = await client.query(`
      SELECT 
        st.query,
        st.query_type,
        loc.name as label
      FROM rds_topics_list_subtopics st
      INNER JOIN rds_topics_list_subtopics_locales loc 
        ON st.id = loc._parent_id 
        AND loc._locale = 'en'
      WHERE st.query_type = 'taxonomy'
        AND st.query IS NOT NULL
        AND st.query != ''
      ORDER BY loc.name
    `);

    console.log(`Found ${result.rows.length} queries`);

    // Format the queries for the output file
    const queries = result.rows.map((row) => ({
      query: row.query,
      label: row.label,
      type: row.query_type,
    }));

    // Generate the JavaScript file content
    const fileContent = `/**
 * Sample queries for load testing
 * Generated from database on ${new Date().toISOString()}
 */
export const queries = ${JSON.stringify(queries, null, 2)};
`;

    // Write to data/queries.js
    const outputPath = join(__dirname, 'data', 'queries.js');
    writeFileSync(outputPath, fileContent, 'utf8');
    console.log(
      `\nSuccessfully wrote ${queries.length} queries to ${outputPath}`,
    );

    // Print a sample for verification
    if (queries.length > 0) {
      console.log('\nFirst 3 queries:');
      queries.slice(0, 3).forEach((q, i) => {
        console.log(`${i + 1}. ${q.label}: ${q.query}`);
      });
    }

    return queries;
  } catch (error) {
    console.error('Error fetching queries:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchQueries()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

export default fetchQueries;
