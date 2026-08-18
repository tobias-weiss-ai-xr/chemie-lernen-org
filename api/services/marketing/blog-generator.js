/**
 * Blog Generator Service - Generates blog posts from Knowledge Graph entities
 */

import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'neo4jpassword';

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

/**
 * Fetch entity data from Knowledge Graph
 */
async function fetchEntityData(entityName) {
  const session = driver.session();

  const query = `
    MATCH (e:Entity {name: $entityName})
    OPTIONAL MATCH (e)-[:RELATED_TO]->(r)
    OPTIONAL MATCH (e)-[:FULFILLS_OBJECTIVE]->(o)
    OPTIONAL MATCH (d:Document)-[:MENTIONS]->(e)
    RETURN
      e.name as name,
      e.description as description,
      e.created_at as created_at,
      collect(DISTINCT r.name)[0..5] as related_entities,
      count(DISTINCT d) as mention_count
  `;

  try {
    const result = await session.run(query, { entityName });

    if (result.records.length === 0) {
      throw new Error(`Entity '${entityName}' not found in Knowledge Graph`);
    }

    const record = result.records[0];
    return {
      name: record.get('name'),
      description: record.get('description') || '',
      related_entities: record.get('related_entities') || [],
      mention_count: record.get('mention_count') || 0,
      created_at: record.get('created_at')
    };
  } finally {
    await session.close();
  }
}

/**
 * Generate SEO-focused title from entity name
 */
function generateTitle(entityName) {
  const templates = [
    `${entityName} einfach erklärt – Das musst du wissen`,
    `${entityName}: Definition, Beispiele und Übungen`,
    `Die Chemie von ${entityName} – Zusammenfassung für Schüler`,
    `${entityName} verstehen: Mit Quiz und praktischen Beispielen`
  ];

  // Simple hash-based template selection for consistency
  const hash = entityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return templates[hash % templates.length];
}

/**
 * Generate meta description
 */
function generateDescription(entityName, description) {
  const baseDescription = description || `Erfahre alles über ${entityName} im chemie-lernen.org Knowledge Graph.`;

  return `Lerne alles über ${entityName}: Definition, grundlegende Prinzipien mit einfachen Beispielen, Übungsaufgaben und einem interaktiven Quiz für Schüler, Lehrer und Studierende. ${baseDescription}`;
}

/**
 * Generate blog post content
 */
function generateBlogContent(entityData) {
  const { name, description, related_entities } = entityData;

  const sections = [
    `## Was ist ${name}?`,
    '',
    description || `${name} ist ein wichtiges Konzept in der Chemie.`,
    '',
    '### Die Grundprinzipien',
    '',
    `- Definition: Was bedeutet ${name}?',
    `- Eigenschaften: Typische Merkmale',
    `- Anwendungen: Wo begegnet dir ${name} im Alltag?',
    '',
    '### Beispiele aus dem Praxis und Unterricht',
    '',
    '- [Beispiel 1 aus dem Alltag]',
    '- [Beispiel 2 aus dem Labor]',
    '- [Beispiel 3 aus der Industrie]',
  ];

  // Add related entities section
  if (related_entities.length > 0) {
    sections.push(
      '',
      '### Verwandte Konzepte',
      '',
      ...related_entities.map(re => `- [${re}](/entity/${encodeURI(re.toLowerCase().replace(/\s+/g, '-'))})`)
    );
  }

  // Add quiz embed
  sections.push(
    '',
    '### Teste dein Wissen!',
    '',
    `{{< quiz-embed quiz="${name.toLowerCase()}" >}}`,
    '',
    '### Weiterführende Ressourcen',
    '',
    '- [Themenbereich Übersicht](/themenbereiche/)',
    '- [Alle Lernvideos](/lernvideos/)'
  );

  return sections.join('\n');
}

/**
 * Generate complete blog post (Hugo markdown format)
 */
export async function generateBlogFromEntity(entityName, format = 'hugo-markdown') {
  const entityData = await fetchEntityData(entityName);

  const title = generateTitle(entityName);
  const description = generateDescription(entityName, entityData.description);
  const content = generateBlogContent(entityData);

  const today = new Date().toISOString().split('T')[0];

  // Generate keywords from entity data
  const keywords = [
    entityName,
    ...entityData.related_entities.slice(0, 3)
  ].join('\", \"');

  const frontmatter = `---
title: "${title}"
description: "${description.replace(/"/g, '\\"')}"
date: "${today}"
tags: ["${keywords}"]
author: "Prof. Siegfried Schindler"
featured_image: "/static/img/entities/${entityName.toLowerCase().replace(/\s+/g, '-')}.jpg"
canonical: "https://chemie-lernen.org/posts/${today}-${entityName.toLowerCase().replace(/\s+/g, '-')}/"
---

`;

  if (format === 'json') {
    return {
      title,
      description,
      content,
      frontmatter: frontmatter.trim(),
      tags: entityData.related_entities,
      entity_name: entityName
    };
  }

  return frontmatter + content;
}

/**
 * Batch generate blog posts for multiple entities
 */
export async function generateBatchBlogPosts(entityNames) {
  const blogPosts = [];

  for (const entityName of entityNames) {
    try {
      const blogPost = await generateBlogFromEntity(entityName);
      blogPosts.push({
        entityName,
        success: true,
        blogPost
      });
    } catch (error) {
      console.error(`Failed to generate blog post for ${entityName}:`, error);
      blogPosts.push({
        entityName,
        success: false,
        error: error.message
      });
    }
  }

  return blogPosts;
}
