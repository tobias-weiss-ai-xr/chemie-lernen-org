/**
 * Modulhandbuch (module handbook) route handlers — extracted from server.js.
 *
 * Mount in server.js via:
 *   import modulhandbuchRouter from './routes/modulhandbuch.js';
 *   app.use('/api', modulhandbuchRouter);
 *
 * Routes extracted:
 *   GET /api/modulhandbuch/universities
 *   GET /api/modulhandbuch/university/:shortCode
 *   GET /api/modulhandbuch/module/:univCode/:moduleCode
 *   GET /api/modulhandbuch/search
 *   GET /api/modulhandbuch/teaches/:entityName
 *   GET /api/entities/:name/universities
 *   GET /api/studienvergleich/compare
 */

import { Router } from 'express';
import neo4j from 'neo4j-driver';
import pino from 'pino';
import { getNeo4jDriver, NEO4J_DATABASE } from '../services/neo4j.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

const router = Router();

// -- GET /api/modulhandbuch/universities -- List all indexed universities -----

router.get('/api/modulhandbuch/universities', async (req, res) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (u:University)
       WHERE EXISTS {
         MATCH (m:UniversityModule {university: u.short_code})
         WHERE m.module_code IS NOT NULL
       }
       WITH u, count(DISTINCT m) AS moduleCount
       WHERE moduleCount > 0
       RETURN u.short_code AS shortCode, u.name AS name, u.country AS country,
              u.city AS city, u.website AS website,
              moduleCount AS moduleCount
       ORDER BY u.name`
    );
    await session.close();
    const seen = new Map();
    result.records.forEach((r) => {
      const name = r.get('name');
      if (!seen.has(name)) {
        seen.set(name, {
          shortCode: r.get('shortCode'),
          name: name,
          country: r.get('country'),
          city: r.get('city'),
          website: r.get('website'),
          moduleCount: r.get('moduleCount').toNumber(),
        });
      }
    });
    res.json({
      source: 'neo4j',
      universities: Array.from(seen.values()),
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[modulhandbuch/universities] Neo4j error'
    );
    res.status(503).json({ error: 'University data unavailable' });
  }
});

// -- GET /api/modulhandbuch/university/:shortCode -- Single university --------

router.get('/api/modulhandbuch/university/:shortCode', async (req, res) => {
  const shortCode = req.params.shortCode.toUpperCase().trim();
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (u:University {short_code: $code})
       OPTIONAL MATCH (u)-[:OFFERS_DEGREE]->(d:Degree)
       OPTIONAL MATCH (m:UniversityModule {university: $code})
       RETURN u, collect(DISTINCT d{.*}) AS degrees,
              collect(DISTINCT m{.*}) AS modules`,
      { code: shortCode }
    );
    await session.close();
    if (!result.records.length) return res.status(404).json({ error: 'University not found' });
    const r = result.records[0];
    const u = r.get('u');
    if (!u) return res.status(404).json({ error: 'University not found' });
    res.json({
      source: 'neo4j',
      university: {
        shortCode: u.properties.short_code,
        name: u.properties.name,
        country: u.properties.country,
        city: u.properties.city,
        website: u.properties.website,
      },
      degrees: r.get('degrees').filter((d) => d.name),
      modules: r
        .get('modules')
        .filter((m) => m.module_code)
        .map((m) => ({
          code: m.module_code,
          name: m.module_name,
          ects: m.ects,
          level: m.level,
          degree: m.degree,
          semesterOffered: m.semester_offered,
        })),
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[modulhandbuch/university] Neo4j error'
    );
    res.status(503).json({ error: 'University data unavailable' });
  }
});

// -- GET /api/modulhandbuch/module/:univCode/:moduleCode -- Single module detail -

router.get('/api/modulhandbuch/module/:univCode/:moduleCode', async (req, res) => {
  const univCode = req.params.univCode.toLowerCase().trim();
  const moduleCode = req.params.moduleCode.trim();
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (m:UniversityModule {module_code: $code, university: $univ})
       OPTIONAL MATCH (m)-[:CARRIES]->(e:ECTS)
       OPTIONAL MATCH (m)-[:PART_OF]->(d:Degree)
       OPTIONAL MATCH (off:ModuleOffering {module_code: $code, university: $univ})-[:TAUGHT_BY]->(l:Lecturer)
       RETURN m, e{.*} AS ects, d{.*} AS degree,
              collect(DISTINCT {semester: off.semester, year: off.year, lecturer: l.name}) AS offerings`,
      { code: moduleCode, univ: univCode }
    );
    await session.close();
    if (!result.records.length) return res.status(404).json({ error: 'Module not found' });
    const r = result.records[0];
    const m = r.get('m');
    if (!m) return res.status(404).json({ error: 'Module not found' });
    res.json({
      source: 'neo4j',
      module: {
        code: m.properties.module_code,
        name: m.properties.module_name,
        ects: m.properties.ects,
        workloadHours: m.properties.workload_hours,
        language: m.properties.language,
        level: m.properties.level,
        degree: m.properties.degree,
        university: m.properties.university,
        semesterOffered: m.properties.semester_offered,
        learningOutcomes: m.properties.learning_outcomes,
        content: m.properties.content,
        prerequisites: m.properties.prerequisites,
        examination: m.properties.examination,
        url: m.properties.url,
      },
      ects: r.get('ects').credits
        ? { credits: r.get('ects').credits, workloadHours: r.get('ects').workload_hours }
        : null,
      degree: r.get('degree').name ? r.get('degree') : null,
      offerings: r.get('offerings').filter((o) => o.semester),
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[modulhandbuch/module] Neo4j error'
    );
    res.status(503).json({ error: 'Module data unavailable' });
  }
});

// -- GET /api/modulhandbuch/search -- Search modules across all universities --

router.get('/api/modulhandbuch/search', async (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.status(400).json({ error: 'Query param "q" is required' });
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 200,
    });
    const [result, totalResult] = await Promise.all([
      session.run(
        `MATCH (m:UniversityModule)
         WHERE toLower(m.module_name) CONTAINS $q OR toLower(m.module_code) CONTAINS $q
         RETURN m.module_code AS code, m.module_name AS name, m.university AS university,
                m.ects AS ects, m.level AS level, m.degree AS degree
         ORDER BY m.university, m.module_name
         SKIP ${offset} LIMIT ${limit}`,
        { q }
      ),
      session.run(
        `MATCH (m:UniversityModule)
         WHERE toLower(m.module_name) CONTAINS $q OR toLower(m.module_code) CONTAINS $q
         RETURN count(m) AS total`,
        { q }
      ),
    ]);
    await session.close();
    res.json({
      source: 'neo4j',
      modules: result.records.map((r) => ({
        code: r.get('code'),
        name: r.get('name'),
        university: r.get('university'),
        ects: r.get('ects'),
        level: r.get('level'),
        degree: r.get('degree'),
      })),
      total: totalResult.records[0].get('total').toNumber(),
      limit,
      offset,
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[modulhandbuch/search] Neo4j error'
    );
    res.status(503).json({ error: 'Search unavailable' });
  }
});

// -- GET /api/modulhandbuch/teaches/:entityName -- Modules that teach a concept -

router.get('/api/modulhandbuch/teaches/:entityName', async (req, res) => {
  const entityName = req.params.entityName.toLowerCase().trim();
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (e:Entity)<-[:TEACHES]-(m:UniversityModule)
       WHERE toLower(e.name) = $name
       RETURN m.module_code AS code, m.module_name AS name, m.university AS university,
              m.ects AS ects, m.level AS level, m.url AS url, e.name AS entityName`,
      { name: entityName }
    );
    await session.close();
    res.json({
      source: 'neo4j',
      entityName,
      modules: result.records.map((r) => ({
        code: r.get('code'),
        name: r.get('name'),
        university: r.get('university'),
        ects: r.get('ects'),
        level: r.get('level'),
        url: r.get('url'),
      })),
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[modulhandbuch/teaches] Neo4j error'
    );
    res.status(503).json({ error: 'Teaches data unavailable' });
  }
});

// -- GET /api/entities/:name/universities -- Univs. whose modules teach entity -

router.get('/api/entities/:name/universities', async (req, res) => {
  const entityName = req.params.name.toLowerCase().trim();
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (e:Entity)<-[:TEACHES]-(m:UniversityModule)
       WHERE toLower(e.name) = $name
       OPTIONAL MATCH (u:University {short_code: m.university})
       RETURN u.short_code AS uniCode, u.name AS uniName, u.country AS country,
              m.module_code AS code, m.module_name AS name, m.level AS level,
              m.ects AS ects, m.url AS url
       ORDER BY u.name, m.module_name`,
      { name: entityName }
    );
    await session.close();

    const byUniversity = new Map();
    result.records.forEach((r) => {
      const uniCode = r.get('uniCode') || r.get('uniName') || 'unknown';
      if (!byUniversity.has(uniCode)) {
        byUniversity.set(uniCode, {
          shortCode: uniCode,
          name: r.get('uniName') || uniCode,
          country: r.get('country') || '',
          modules: [],
        });
      }
      byUniversity.get(uniCode).modules.push({
        code: r.get('code'),
        name: r.get('name'),
        level: r.get('level'),
        ects: r.get('ects'),
        url: r.get('url'),
      });
    });

    res.json({
      source: 'neo4j',
      entityName,
      universities: Array.from(byUniversity.values()),
      totalModules: result.records.length,
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[entities/name/universities] Neo4j error'
    );
    res.status(503).json({ error: 'University data unavailable' });
  }
});

// -- GET /api/studienvergleich/compare -- Compare modules between two univs --

router.get('/api/studienvergleich/compare', async (req, res) => {
  const u1 = (req.query.u1 || '').trim().toUpperCase();
  const u2 = (req.query.u2 || '').trim().toUpperCase();
  const levelFilter = (req.query.level || '').trim().toUpperCase();
  const keyword = (req.query.topic || '').trim().toLowerCase();

  if (!u1 || !u2) {
    return res.status(400).json({ error: 'Both u1 and u2 query params are required' });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    // Fetch modules for both universities
    const baseCypher = `
      MATCH (m:UniversityModule {university: $univ})
      ${levelFilter ? 'WHERE toUpper(m.level) = toUpper($level)' : ''}
      RETURN m.module_code AS code, m.module_name AS name,
             m.ects AS ects, m.level AS level, m.degree AS degree,
             m.url AS url, m.language AS language
      ORDER BY m.module_name
    `;
    const params1 = { univ: u1 };
    const params2 = { univ: u2 };
    if (levelFilter) {
      params1.level = levelFilter;
      params2.level = levelFilter;
    }

    const result1 = await session.run(baseCypher, params1);
    const result2 = await session.run(baseCypher, params2);
    await session.close();

    const mapRecord = (r) => ({
      code: r.get('code'),
      name: r.get('name'),
      ects: r.get('ects')
        ? r.get('ects').toNumber
          ? r.get('ects').toNumber()
          : r.get('ects')
        : null,
      level: r.get('level'),
      degree: r.get('degree'),
      url: r.get('url'),
      language: r.get('language'),
    });

    const modules1 = result1.records.map(mapRecord);
    const modules2 = result2.records.map(mapRecord);

    // Build module matrix: find common modules by keyword overlap in name
    // and list unique-to-each modules
    const common = [];
    const only1 = [];
    const only2 = [];

    // Bilingual chemistry keyword map (German -> English) for cross-language matching.
    // TUM uses German module names, ETH uses English -- this normalizes both to
    // English so "Anorganische Chemie" matches "Inorganic Chemistry".
    const DE_EN_MAP = {
      anorganische: 'inorganic',
      organische: 'organic',
      physikalische: 'physical',
      chemie: 'chemistry',
      biochemie: 'biochemistry',
      biologie: 'biology',
      mathematik: 'mathematics',
      physik: 'physics',
      chemiker: 'chemist',
      praktikum: 'lab',
      analytische: 'analytical',
      theoretische: 'theoretical',
      technische: 'technical',
      molekulare: 'molecular',
      quanten: 'quantum',
      spektroskopie: 'spectroscopy',
      katalyse: 'catalysis',
      polymer: 'polymer',
      biotechnologie: 'biotechnology',
      umwelt: 'environmental',
      elektrochemie: 'electrochemistry',
      photochemie: 'photochemistry',
      makromolekulare: 'macromolecular',
      metall: 'metal',
      kristall: 'crystal',
      thermodynamik: 'thermodynamics',
      kinetik: 'kinetics',
      synthese: 'synthesis',
      nanostruktur: 'nanostructure',
      oberfläche: 'surface',
      kernchemie: 'nuclear',
      computerchemie: 'computational',
      stoffwechsel: 'metabolism',
      zellbiologie: 'cell',
      enzym: 'enzyme',
      protein: 'protein',
      bioanorganische: 'bioinorganic',
      bioorganische: 'bioorganic',
      medizinische: 'medical',
      lebensmittel: 'food',
      geochemie: 'geochemistry',
      photoelektronen: 'photoelectron',
      magnetische: 'magnetic',
      kernspin: 'nmr',
      nanomaterialien: 'nanomaterials',
      wissenschaftliches: 'scientific',
      rechnen: 'computing',
      programmierung: 'programming',
      informatik: 'informatics',
      molekül: 'molecule',
      reaktion: 'reaction',
      verfahrenstechnik: 'process',
      ingenieurwesen: 'engineering',
      grundlagen: 'fundamentals',
      grundpraktikum: 'basiclab',
      strukturaufklärung: 'structureelucidation',
      struktur: 'structure',
      funktion: 'function',
      werkstoff: 'material',
      werkstoffe: 'materials',
      verbundwerkstoff: 'composite',
      grenzflächen: 'interfaces',
      oberflächen: 'surfaces',
      nanostrukturierte: 'nanostructured',
      nanotechnologie: 'nanotechnology',
      koordinationschemie: 'coordination',
      supramolekular: 'supramolecular',
      heterocyclen: 'heterocycles',
      wirkstoff: 'drug',
      wirkstoffkunde: 'pharmacology',
      biomedizinische: 'biomedical',
      lebenswissenschaften: 'lifesciences',
      bioverfahrenstechnik: 'bioprocess',
      biokatalyse: 'biocatalysis',
      biopolymere: 'biopolymers',
      enzymtechnologie: 'enzymetechnology',
      proteinchemie: 'proteinchemistry',
      membranproteine: 'membraneproteins',
      säugetier: 'mammalian',
      stoffströme: 'materialflows',
      klinische: 'clinical',
      medizin: 'medicine',
      pharmakologie: 'pharmacology',
      toxikologie: 'toxicology',
      pharmazeutische: 'pharmaceutical',
      radiochemie: 'radiochemistry',
      radioaktivität: 'radioactivity',
      radioanalytik: 'radioanalysis',
      radiopharmazie: 'radiopharmacy',
      photokatalyse: 'photocatalysis',
      elektrochemisches: 'electrochemical',
      elektronische: 'electronic',
      elektronenmikroskopie: 'electronmicroscopy',
      roentgen: 'xray',
      synchrotron: 'synchrotron',
      quantendynamik: 'quantumdynamics',
      quantenmechanik: 'quantummechanics',
      gruppentheorie: 'grouptheory',
      festkörper: 'solidstate',
      festkörperchemie: 'solidstatechemistry',
      festkörpermaterialien: 'solidstatematerials',
      festkörpertheorie: 'solidstatetheory',
      polymerisation: 'polymerization',
      polymerphysik: 'polymerphysics',
      hochleistungspolymere: 'highperformancepolymers',
      hybridmaterialien: 'hybridmaterials',
      umweltschutz: 'environmentalprotection',
      ressourcen: 'resources',
      nachhaltige: 'sustainable',
      industrielle: 'industrial',
      reaktionstechnik: 'reactionengineering',
      technisch: 'technical',
      maschinelles: 'machine',
      lernende: 'learning',
      wissenschaft: 'science',
      programmieren: 'programming',
      numerische: 'numerical',
      simulation: 'simulation',
      modellbildung: 'modeling',
      bioinformatik: 'bioinformatics',
      automatisierung: 'automation',
      visualisierung: 'visualization',
      daten: 'data',
      prozesse: 'processes',
      moleküle: 'molecules',
      reaktivität: 'reactivity',
      synthesemethoden: 'synthesismethods',
      katalysator: 'catalyst',
      katalytische: 'catalytic',
      verfahren: 'methods',
      prozess: 'process',
      energie: 'energy',
      materialwissenschaften: 'materialsscience',
      oberflächenspektroskopie: 'surfacespectroscopy',
      mikroskopie: 'microscopy',
      massenspektrometrie: 'massspectrometry',
      biomolekulare: 'biomolecular',
      chiroptik: 'chiroptics',
      nanopartikel: 'nanoparticles',
      farbzentren: 'colorcenters',
      theroretisch: 'theoretical',
      experimentalphysik: 'experimentalphysics',
      mathematische: 'mathematical',
      bauchemie: 'constructionchemistry',
      anorganik: 'inorganics',
      bindemittel: 'binders',
    };

    const stopWords = new Set([
      'the',
      'of',
      'in',
      'and',
      'to',
      'a',
      'an',
      'for',
      'i',
      'ii',
      'iii',
      '1',
      '2',
      '3',
      'introductory',
      'introduction',
      'principles',
      'advanced',
      'der',
      'die',
      'das',
      'den',
      'dem',
      'des',
      'ein',
      'eine',
      'einer',
      'eines',
      'und',
      'oder',
      'mit',
      'auf',
      'bei',
      'von',
      'aus',
      'an',
      'zu',
      'als',
      'nach',
      'vor',
      'durch',
      'über',
      'für',
      'f',
      'um',
      'nicht',
      'auch',
      'werden',
      'wird',
      'wurde',
      'sich',
      'ihr',
      'ihre',
      'seine',
      'seinen',
      'durch',
      'gegen',
      'bis',
      'ohne',
      'zwischen',
      'unter',
      'über',
      'neben',
      'sowie',
      'aber',
      'wenn',
      'dann',
      'damit',
      'dazu',
      'davon',
      'daran',
      'dieser',
      'diese',
      'dieses',
      'allen',
      'alle',
      'allem',
      'jeder',
      'jede',
      'jedes',
      'beide',
      'beiden',
      'grundlagen',
      'grundlegende',
      'vertiefung',
      'vertiefungs',
      'modul',
      'vorlesung',
      'übung',
      'übung',
      'seminar',
      'praktikum',
      'fortgeschrittene',
      'fortgeschritten',
      'einführung',
      'einführung',
      'einführungs',
      'weiterführende',
      'erweiterte',
      'erweitert',
      'speziell',
      'spezielle',
      'spezial',
      'aktuell',
      'aktuelle',
      'teil',
      'teile',
      'teil1',
      'teil2',
      'teil3',
      'i',
      'ii',
      'iii',
      'allgemein',
      'allgemeine',
      'grund',
      'grundkurs',
      'aufbau',
      'praxis',
      'praktische',
      'theorie',
      'theoretische',
      'übersicht',
      'überblick',
      'anwendung',
      'anwendungen',
      'anwendungsrelevante',
      'aspekte',
      'aspekt',
      'konzepte',
      'konzept',
      'prinzipien',
      'prinzip',
      'methode',
      'methoden',
      'moderne',
      'modern',
    ]);

    const normalizeWords = (name) => {
      return name
        .toLowerCase()
        .split(/[\s,.\-\u2013\u2014/:]+/)
        .map((w) => DE_EN_MAP[w] || w) // map German -> English first
        .filter((w) => w.length > 2 && !stopWords.has(w));
    };

    modules1.forEach((m1) => {
      const words1 = normalizeWords(m1.name);
      let bestMatch = null;
      let bestScore = 0;
      let codeMatched = false;

      modules2.forEach((m2) => {
        if (m1.level !== m2.level) return;

        if (m1.code && m2.code && m1.code.toUpperCase() === m2.code.toUpperCase()) {
          if (!codeMatched || m1.name.length > bestMatch.name.length) {
            bestMatch = m2;
            bestScore = 999;
            codeMatched = true;
          }
          return;
        }
        const words2 = normalizeWords(m2.name);
        const overlap = words1.filter((w) => words2.includes(w)).length;
        // Overlap ratio: fraction of the shorter word list that overlaps
        const maxLen = Math.max(words1.length, words2.length);
        const ratio = maxLen > 0 ? overlap / maxLen : 0;
        // minOverlap: single-word modules match on 1, multi-word need 2+
        const minOverlap = words1.length === 1 && words2.length === 1 ? 1 : 2;
        // Require overlap >= minOverlap AND ratio > 0.3 to prevent catch-all false matches
        if (overlap > bestScore && overlap >= minOverlap && ratio > 0.3) {
          bestScore = overlap;
          bestMatch = m2;
        }
      });

      if (bestMatch) {
        common.push({
          topic: m1.name.length < 60 ? m1.name : words1.slice(0, 4).join(' '),
          module1: m1,
          module2: bestMatch,
          matchScore: codeMatched ? 999 : bestScore,
        });
      } else {
        only1.push(m1);
      }
    });

    // Modules in u2 that had no match in u1
    const matchedCodes2 = new Set(common.map((c) => c.module2.code));
    modules2.forEach((m2) => {
      if (!matchedCodes2.has(m2.code)) {
        only2.push(m2);
      }
    });

    // Apply keyword filter post-hoc (on text fields)
    const filterByKeyword = (arr) => {
      if (!keyword) return arr;
      return arr.filter(
        (m) =>
          m.name.toLowerCase().includes(keyword) ||
          (m.code && m.code.toLowerCase().includes(keyword))
      );
    };

    res.json({
      source: 'neo4j',
      university1: u1,
      university2: u2,
      level: levelFilter || null,
      topic: keyword || null,
      stats: {
        total1: modules1.length,
        total2: modules2.length,
        common: common.length,
        unique1: only1.length,
        unique2: only2.length,
      },
      matrix: {
        commonTopics: common.filter(
          (c) => filterByKeyword([c.module1]).length > 0 || filterByKeyword([c.module2]).length > 0
        ),
        unique1: filterByKeyword(only1),
        unique2: filterByKeyword(only2),
      },
      universities: {
        [u1]: modules1,
        [u2]: modules2,
      },
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[studienvergleich/compare] Neo4j error'
    );
    res.status(503).json({ error: 'Comparison data unavailable' });
  }
});

export default router;
