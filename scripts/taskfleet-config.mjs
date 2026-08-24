/**
 * taskfleet-config.mjs — Configuration for TaskFleet Knowledge Graph Extension
 * 
 * This file defines all available tasks for parallel execution.
 * Tasks are organized into groups and can have dependencies.
 * 
 * Usage:
 *   - Import this file in taskfleet.mjs
 *   - Or create a custom config and pass it via --config
 * 
 * Task Structure:
 *   {
 *     id: string,           // Unique identifier
 *     name: string,         // Human-readable name
 *     group: string,        // Group for filtering
 *     command: string,      // Command to execute
 *     description: string,  // Description
 *     timeout: number,      // Timeout in ms (default: 5 min)
 *     retries: number,      // Number of retries (default: 2)
 *     priority: number,     // Higher = executed first (default: 10)
 *     dependencies: string[] // Task IDs that must complete first
 *   }
 * 
 * @module taskfleet-config
 */

// =============================================================================
// KNOWLEDGE GRAPH EXTENSION TASKS
// =============================================================================

// These tasks extend the chemie-lernen.org knowledge graph in parallel.
// They are organized into logical groups for targeted execution.

/** @type {Array<import('./taskfleet.mjs').Task>} */
const TASKS = [
  // =========================================================================
  // GROUP: Data Import Tasks
  // =========================================================================
  {
    id: 'import-curricula-all',
    name: 'Alle Lehrpläne importieren',
    group: 'data-import',
    command: 'node scripts/import-curricula-all.mjs',
    description: 'Importiert alle 16 Bundesländer-Lehrpläne in den KG',
    timeout: 1800000, // 30 minutes
    retries: 1,
    priority: 20,
  },
  {
    id: 'import-didaktik',
    name: 'Didaktische Richtlinien importieren',
    group: 'data-import',
    command: 'node scripts/import-didaktik.mjs',
    description: 'Importiert didaktische Leitlinien und Standards',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 15,
  },
  {
    id: 'import-modulhandbuch',
    name: 'Modulhandbuch-Daten importieren',
    group: 'data-import',
    command: 'bash scripts/vendor-core.sh && node scripts/import-modulhandbuch.mjs',
    description: 'Importiert Modulhandbuch-Daten (erfordert vendor-core.sh)',
    timeout: 900000, // 15 minutes
    retries: 2,
    priority: 15,
  },
  {
    id: 'import-he-manual',
    name: 'HE Manual Daten importieren',
    group: 'data-import',
    command: 'node scripts/import-he-manual.mjs',
    description: 'Importiert Daten aus dem HE Manual',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 10,
  },
  
  // =========================================================================
  // GROUP: Entity Enrichment Tasks
  // =========================================================================
  {
    id: 'enrich-entity-descriptions',
    name: 'Entity-Beschreibungen anreichern',
    group: 'entity-enrichment',
    command: 'node scripts/enrich-entity-descriptions.mjs',
    description: 'Fügt detaillierte Beschreibungen zu chemischen Entities hinzu',
    timeout: 450000, // 7.5 minutes
    retries: 2,
    priority: 20,
  },
  {
    id: 'enrich-isolated-entities',
    name: 'Isolierte Entities verknüpfen',
    group: 'entity-enrichment',
    command: 'node scripts/enrich-isolated-entities.mjs',
    description: 'Findet Entities ohne Verknüpfungen und reichert sie mit Kontext an',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 20,
  },
  {
    id: 'kg-enrich',
    name: 'Generische KG-Anreicherung',
    group: 'entity-enrichment',
    command: 'node scripts/kg-enrich.mjs',
    description: 'Allgemeine Anreicherung von Knoten und Beziehungen',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 15,
  },
  {
    id: 'kg-enrich-relations',
    name: 'Beziehungen anreichern',
    group: 'entity-enrichment',
    command: 'node scripts/kg-enrich-relations.mjs',
    description: 'Ergänzt fehlende Beziehungen basierend auf Inhalten',
    timeout: 900000, // 15 minutes
    retries: 2,
    priority: 15,
    dependencies: ['kg-enrich'],
  },
  
  // =========================================================================
  // GROUP: Content Indexing Tasks
  // =========================================================================
  {
    id: 'import-content-nodes',
    name: 'Content-Knoten importieren',
    group: 'content-indexing',
    command: 'node scripts/curricula/import-content-nodes.mjs',
    description: 'Importiert alle Hugo-Inhalte als Content-Knoten in den KG',
    timeout: 450000, // 7.5 minutes
    retries: 2,
    priority: 20,
  },
  {
    id: 'export-kg-data',
    name: 'KG-Daten exportieren ( für Hugo )',
    group: 'content-indexing',
    command: 'node scripts/export-kg-data.mjs',
    description: 'Exportiert KG-Daten für die statische Site-Generierung',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 15,
    dependencies: ['import-content-nodes'],
  },
  {
    id: 'link-articles-to-entities',
    name: 'Artikel mit Entities verknüpfen',
    group: 'content-indexing',
    command: 'node scripts/link-articles-to-entities.mjs',
    description: 'Verknüpft Content-Knoten mit chemischen Entities',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 15,
    dependencies: ['import-content-nodes'],
  },
  {
    id: 'link-content',
    name: 'Content-Knoten vernetzen',
    group: 'content-indexing',
    command: 'node scripts/curricula/link-content.mjs',
    description: 'Erstellt Verknüpfungen zwischen verwandten Content-Knoten',
    timeout: 900000, // 15 minutes
    retries: 2,
    priority: 10,
    dependencies: ['link-articles-to-entities'],
  },
  {
    id: 'generate-entity-pages',
    name: 'Entity-Seiten generieren',
    group: 'content-indexing',
    command: 'node scripts/generate-entity-pages.mjs',
    description: 'Generiert statische Seiten für alle chemischen Entities',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 10,
    dependencies: ['export-kg-data'],
  },
  {
    id: 'generate-themenbereich-entities',
    name: 'Themenbereich-Entities generieren',
    group: 'content-indexing',
    command: 'node scripts/generate-themenbereich-entities.mjs',
    description: 'Generiert Entity-Seiten für alle Themenbereiche',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 10,
  },
  
  // =========================================================================
  // GROUP: Curriculum Linking Tasks
  // =========================================================================
  {
    id: 'link-entities-to-curriculum',
    name: 'Entities mit Curricula verknüpfen',
    group: 'curriculum-linking',
    command: 'node scripts/link-entities-to-curriculum.mjs',
    description: 'LLM-basierte Verknüpfung von Entities mit Lehrplan-Inhalten',
    timeout: 900000, // 15 minutes
    retries: 2,
    priority: 20,
    dependencies: ['enrich-entity-descriptions', 'import-curricula-all'],
  },
  {
    id: 'link-entities-to-curricula',
    name: 'Entities mit Curricula (Legacy) verknüpfen',
    group: 'curriculum-linking',
    command: 'node scripts/link-entities-to-curricula.mjs',
    description: 'Alternative Verknüpfung (Schema A)',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 5,
    dependencies: ['import-curricula-all'],
  },
  {
    id: 'link-modules-to-entities',
    name: 'Module mit Entities verknüpfen',
    group: 'curriculum-linking',
    command: 'node scripts/link-modules-to-entities.mjs',
    description: 'Verknüpft Modulhandbuch-Einträge mit chemischen Entities',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 10,
    dependencies: ['import-modulhandbuch'],
  },
  {
    id: 'generate-learning-paths',
    name: 'Lernpfade generieren',
    group: 'curriculum-linking',
    command: 'node scripts/generate-learning-paths.mjs',
    description: 'Automatische Generierung von Lernpfaden basierend auf Abhängigkeiten',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 15,
    dependencies: ['link-entities-to-curriculum', 'link-content'],
  },
  {
    id: 'create-prerequisites',
    name: 'Voraussetzungen erstellen',
    group: 'curriculum-linking',
    command: 'node scripts/create-prerequisites.mjs',
    description: 'Erstellt Voraussetzungs-Beziehungen zwischen Themen',
    timeout: 450000, // 7.5 minutes
    retries: 2,
    priority: 10,
    dependencies: ['link-entities-to-curriculum'],
  },
  
  // =========================================================================
  // GROUP: Quality Assurance Tasks
  // =========================================================================
  {
    id: 'kg-quality-audit',
    name: 'KG Qualitätsprüfung',
    group: 'quality-assurance',
    command: 'node scripts/kg-quality-audit.mjs',
    description: 'Comprehensive quality audit des Wissensgraphen',
    timeout: 450000, // 7.5 minutes
    retries: 1,
    priority: 5,
  },
  {
    id: 'cross-link-audit',
    name: 'Kreuzverweise prüfen',
    group: 'quality-assurance',
    command: 'node scripts/cross-link-audit.mjs',
    description: 'Prüft die Konsistenz von Verknüpfungen im KG',
    timeout: 600000, // 10 minutes
    retries: 1,
    priority: 5,
  },
  {
    id: 'merge-duplicate-entities',
    name: 'Doppelte Entities zusammenführen',
    group: 'quality-assurance',
    command: 'node scripts/merge-duplicate-entities.mjs --dry-run=false',
    description: 'Findet und merged doppelte Entity-Knoten',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 1,
    dependencies: [], // Should run early to clean up
  },
  {
    id: 'clean-garbage-subtopics',
    name: 'Garbage-Subtopics bereinigen',
    group: 'quality-assurance',
    command: 'node scripts/clean-garbage-subtopics.mjs',
    description: 'Entfernt ungültige oder leere SubTopic-Knoten',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 1,
  },
  {
    id: 'delete-orphaned-garbage',
    name: 'Verwaiste Knoten bereinigen',
    group: 'quality-assurance',
    command: 'node scripts/delete-orphaned-garbage.mjs',
    description: 'Entfernt verwaiste Knoten ohne Verknüpfungen',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 1,
  },
  {
    id: 'validate-curricula',
    name: 'Curricula validieren',
    group: 'quality-assurance',
    command: 'node scripts/validate-curricula.mjs',
    description: 'Validiert die Struktur und Inhalte der Lehrpläne',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 10,
  },
  {
    id: 'audit-deep',
    name: 'Tiefenprüfung des KG',
    group: 'quality-assurance',
    command: 'node scripts/audit-deep.mjs',
    description: 'Detaillierte Analyse der Graph-Struktur',
    timeout: 600000, // 10 minutes
    retries: 1,
    priority: 5,
  },
  {
    id: 'audit-content-freshness',
    name: 'Content-Aktualität prüfen',
    group: 'quality-assurance',
    command: 'node scripts/audit-content-freshness.mjs',
    description: 'Prüft, wie aktuell die Inhalte sind',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 5,
  },
  
  // =========================================================================
  // GROUP: Index & Search Tasks
  // =========================================================================
  {
    id: 'create-neo4j-indexes',
    name: 'Neo4j-Indizes erstellen',
    group: 'index-search',
    command: 'node scripts/create-neo4j-indexes.mjs',
    description: 'Erstellt optimierte Indizes für schnelle Abfragen',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 20,
  },
  {
    id: 'build-search-index',
    name: 'Suchindex aufbauen',
    group: 'index-search',
    command: 'node scripts/build-search-index.mjs',
    description: 'Baut den Volltext-Suchindex für die Website',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 15,
    dependencies: ['export-kg-data'],
  },
  
  // =========================================================================
  // GROUP: Data Export Tasks
  // =========================================================================
  {
    id: 'export-graph-backup',
    name: 'Graph-Backup exportieren',
    group: 'data-export',
    command: 'node scripts/export-graph-backup.mjs',
    description: 'Erstellt ein Backup des gesamten Wissensgraphen',
    timeout: 1200000, // 20 minutes
    retries: 1,
    priority: 5,
  },
  {
    id: 'export-kg-from-api',
    name: 'KG-Daten von API exportieren',
    group: 'data-export',
    command: 'node scripts/export-kg-from-api.mjs',
    description: 'Exportiert KG-Daten über die API',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 5,
  },
  
  // =========================================================================
  // GROUP: Curricula & Didaktik Tasks
  // =========================================================================
  {
    id: 'curricula-quality-report',
    name: 'Curricula-Qualitätsbericht generieren',
    group: 'curricula-didaktik',
    command: 'node scripts/curricula-quality-report.mjs',
    description: 'Erstellt einen Bericht über die Qualität der Lehrplandaten',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 10,
  },
  {
    id: 'generate-curricula-pages',
    name: 'Curricula-Seiten generieren',
    group: 'curricula-didaktik',
    command: 'node scripts/generate-curricula-pages.mjs',
    description: 'Generiert statische Seiten für alle Curricula',
    timeout: 450000, // 7.5 minutes
    retries: 2,
    priority: 10,
  },
  {
    id: 'generate-modulhandbuch-pages',
    name: 'Modulhandbuch-Seiten generieren',
    group: 'curricula-didaktik',
    command: 'node scripts/generate-modulhandbuch-pages.mjs',
    description: 'Generiert statische Seiten für Modulhandbuch-Einträge',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 10,
  },
  {
    id: 'migrate-modulhandbuch-to-chemie-kg',
    name: 'Modulhandbuch in Chemie KG migrieren',
    group: 'curricula-didaktik',
    command: 'node scripts/migrate-modulhandbuch-to-chemie-kg.mjs',
    description: 'Migriert Modulhandbuch-Daten in den Haupt-KG',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 10,
  },
  {
    id: 'migrate-typed-labels',
    name: 'Typisierte Labels migrieren',
    group: 'curricula-didaktik',
    command: 'node scripts/migrate-typed-labels.mjs',
    description: 'Konvertiert alte Labels in das neue Schema',
    timeout: 300000, // 5 minutes
    retries: 1,
    priority: 5,
  },
  {
    id: 'normalize-section-order',
    name: 'Abschnittsreihenfolge normalisieren',
    group: 'curricula-didaktik',
    command: 'node scripts/normalize-section-order.mjs',
    description: 'Normalisiert die Reihenfolge von Abschnitten',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 5,
  },
  
  // =========================================================================
  // GROUP: Marketing & Analytics Tasks
  // =========================================================================
  {
    id: 'add-article-aliases',
    name: 'Artikel-Aliasse hinzufügen',
    group: 'marketing',
    command: 'node scripts/add-article-aliases.mjs',
    description: 'Fügt Alternative Namen für Artikel hinzu',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 10,
  },
  {
    id: 'add-verwandte-themen',
    name: 'Verwandte Themen verknüpfen',
    group: 'marketing',
    command: 'node scripts/add-verwandte-themen.mjs',
    description: 'Erstellt Verknüpfungen zwischen verwandten Themen',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 10,
  },
  {
    id: 'create-hubs-element-rooms',
    name: 'Element-Räume Hub erstellen',
    group: 'marketing',
    command: 'node scripts/create-hubs-element-rooms.mjs',
    description: 'Erstellt Hub-Seiten für Element-Räume',
    timeout: 450000, // 7.5 minutes
    retries: 2,
    priority: 5,
  },
  {
    id: 'create-scenes',
    name: 'Szenen erstellen',
    group: 'marketing',
    command: 'node scripts/create-scenes.mjs',
    description: 'Erstellt thematische Szenen für die Visualisierung',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 5,
  },
  {
    id: 'generate-chemie-raeume-manifest',
    name: 'Chemie-Räume Manifest generieren',
    group: 'marketing',
    command: 'node scripts/generate-chemie-raeume-manifest.mjs',
    description: 'Generiert Manifest für Chemie-Räume',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 5,
  },
  {
    id: 'fetch-zigs-videos',
    name: 'Zigs Videos abrufen',
    group: 'marketing',
    command: 'node scripts/fetch-zigs-videos.mjs',
    description: 'Lädt Video-Metadaten von Zigs ab',
    timeout: 300000, // 5 minutes
    retries: 2,
    priority: 10,
  },
  
  // =========================================================================
  // GROUP: Maintenance Tasks
  // =========================================================================
  {
    id: 'backfill-sources',
    name: 'Quellenangaben ergänzen',
    group: 'maintenance',
    command: 'node scripts/backfill-sources.mjs',
    description: 'Fügt fehlende Quellenangaben hinzu',
    timeout: 600000, // 10 minutes
    retries: 2,
    priority: 5,
  },
  {
    id: 'upgrade-relation-types',
    name: 'Beziehungstypen aktualisieren',
    group: 'maintenance',
    command: 'node scripts/curricula/upgrade-relation-types.mjs',
    description: 'Aktualisiert veraltete Beziehungstypen',
    timeout: 450000, // 7.5 minutes
    retries: 1,
    priority: 5,
  },
  {
    id: 'migrate-curriculum',
    name: 'Curriculum migrieren (Legacy)',
    group: 'maintenance',
    command: 'node scripts/neo4j-migrate-curriculum.mjs',
    description: 'Migriert alte Curriculum-Daten in neues Schema',
    timeout: 600000, // 10 minutes
    retries: 1,
    priority: 1,
  },
];

// =============================================================================
// PREDEFINED TASK SETS
// =============================================================================

/**
 * Full KG extension pipeline - runs all essential tasks
 * This is the recommended starting point for a complete update
 */
const FULL_KG_EXTENSION = [
  'merge-duplicate-entities',
  'clean-garbage-subtopics',
  'delete-orphaned-garbage',
  'import-curricula-all',
  'import-didaktik',
  'enrich-entity-descriptions',
  'enrich-isolated-entities',
  'import-content-nodes',
  'link-articles-to-entities',
  'link-entities-to-curriculum',
  'link-content',
  'kg-enrich',
  'kg-enrich-relations',
  'generate-learning-paths',
  'create-prerequisites',
  'create-neo4j-indexes',
  'export-kg-data',
  'build-search-index',
  'generate-entity-pages',
  'generate-themenbereich-entities',
  'generate-curricula-pages',
  'kg-quality-audit',
  'cross-link-audit',
  'validate-curricula',
];

/**
 * Quick update - fast tasks that can be run frequently
 */
const QUICK_UPDATE = [
  'enrich-entity-descriptions',
  'import-content-nodes',
  'link-articles-to-entities',
  'export-kg-data',
  'build-search-index',
  'generate-entity-pages',
  'fetch-zigs-videos',
];

/**
 * Data quality pipeline - focus on cleaning and validating
 */
const QUALITY_PIPELINE = [
  'merge-duplicate-entities',
  'clean-garbage-subtopics',
  'delete-orphaned-garbage',
  'kg-quality-audit',
  'cross-link-audit',
  'audit-deep',
  'audit-content-freshness',
  'validate-curricula',
];

/**
 * Content generation pipeline - focus on generating static pages
 */
const CONTENT_GENERATION = [
  'export-kg-data',
  'generate-entity-pages',
  'generate-themenbereich-entities',
  'generate-curricula-pages',
  'generate-modulhandbuch-pages',
  'build-search-index',
  'generate-chemie-raeume-manifest',
];

// =============================================================================
// EXPORTS
// =============================================================================

export default TASKS;
export {
  TASKS,
  FULL_KG_EXTENSION,
  QUICK_UPDATE,
  QUALITY_PIPELINE,
  CONTENT_GENERATION,
};
