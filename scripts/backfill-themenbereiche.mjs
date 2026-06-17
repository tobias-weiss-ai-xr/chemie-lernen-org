/**
 * Backfill themenbereiche articles into chemie-neo4j.
 * Reads all .md files from themenbereiche/, extracts frontmatter,
 * stores Document + Tag nodes with HAS_TAG relationships.
 *
 * Neo4j driver lifecycle managed by @graphwiz/neo4j.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDriver, closeDriver } from '@graphwiz/neo4j';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const BASE_URL = 'https://chemie-lernen.org';

// Hardcoded to avoid env leak
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie';

const config = { uri: NEO4J_URI, username: NEO4J_USER, password: NEO4J_PASSWORD, database: 'chemie' };

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kv = line.match(/^(\w+):\s*(.*)/);
    if (kv) {
      let val = kv[2].trim();
      // Handle YAML arrays
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map((v) => v.trim().replace(/["']/g, ''));
      } else if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      fm[kv[1]] = val;
    }
  }
  return fm;
}

async function main() {
  const d = getDriver(config);
  const session = d.session({ database: config.database });

  try {
    const themenDir = join(REPO_ROOT, 'myhugoapp', 'content', 'themenbereiche');
    const areas = readdirSync(themenDir, { withFileTypes: true }).filter((d) => d.isDirectory());

    let total = 0;
    let stored = 0;

    for (const area of areas) {
      const areaDir = join(themenDir, area.name);
      const files = readdirSync(areaDir).filter((f) => f.endsWith('.md') && f !== '_index.md');

      for (const file of files) {
        total++;
        const content = readFileSync(join(areaDir, file), 'utf-8');
        const fm = parseFrontmatter(content);
        if (!fm) {
          console.log(`  SKIP ${area.name}/${file}: no frontmatter`);
          continue;
        }

        const title = fm.title || file.replace(/\.md$/, '').replace(/-/g, ' ');
        const slug = file.replace(/\.md$/, '');
        const url = `${BASE_URL}/themenbereiche/${area.name}/${slug}/`;
        const description = (fm.description || '').slice(0, 300);
        const tags = Array.isArray(fm.tags) ? fm.tags : (fm.tags || '').split(',').filter(Boolean);
        const icon = fm.icon || '📘';

        // Check if already exists
        const existing = await session.run(
          'MATCH (d:Document {url: $url}) RETURN d LIMIT 1',
          { url }
        );

        if (existing.records.length > 0) {
          console.log(`  EXISTS ${title}`);
          continue;
        }

        // Store document
        await session.run(
          `MERGE (d:Document {
            url: $url,
            title: $title,
            description: $description,
            tags: $tags,
            icon: $icon,
            source: $source,
            date: $date
          })`,
          {
            url,
            title,
            description,
            tags,
            icon,
            source: 'chemie-lernen.org',
            date: fm.date || '2026-06-03',
          }
        );

        // Create/merge Tag nodes + HAS_TAG relationships
        for (const tag of tags) {
          const tagName = tag.trim().toLowerCase();
          if (!tagName || tagName.length < 2) continue;
          await session.run(
            `MATCH (d:Document {url: $url})
             MERGE (t:Tag {name: $tagName})
             MERGE (d)-[:HAS_TAG]->(t)`,
            { url, tagName }
          );
        }

        stored++;
        console.log(`  STORED ${title} (${tags.length} tags)`);
      }
    }

    console.log(`\nDone: ${stored}/${total} articles stored in chemie-neo4j`);
  } finally {
    await session.close();
    await closeDriver();
  }
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
