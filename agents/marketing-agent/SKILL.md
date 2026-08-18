# Marketing-Agent für chemie-lernen.org

Dedizierter Marketing-Agent für chemie-lernen.org, der direkt mit der Knowledge Graph und der GitHub-Repository-Struktur arbeitet.

## 💼 Primäre Aufgaben

### 1. Content-Generierung
- **Blog-Posts** aus Knowledge Graph entities
- **Social-Media-Posts** (Twitter/X, LinkedIn, Instagram)
- **Newsletter-Content** (Weekly digest, Monthly deep-dive)
- **Video-Bescriptions** für Zig's Chemistry 42 embeds

### 2. SEO-Optimierung
- **Meta-Tags** (Title, Description) für alle entity pages
- **Schema.org JSON-LD** Markup (Article, Video, FAQ)
- **Internal Linking** Strategy basierend auf KG relationships
- **Sitemap Updates** für neue entities/pages

### 3. Analytics & Conversion
- **GA4 Event Tracking** Setup (Quiz, Signup, Video-Play)
- **Conversion Funnel** Analysis
- **Cohort Analysis** (Visitor → Premium User conversion)
- **User Journey Mapping** (Quiz → Lernpfade → Assessment)

### 4. Community-Engagement
- **Feedback-Sammlung** & Analysis
- **User-Interview** Planung
- **Survey Design** für Lehrer & Schüler
- **Community Content** Moderation (& crowdsourcing)

## 🗃️ Data Sources

### Knowledge Graph (Neo4j)
```
bolt://chemie-kg:7687
Database: chemie
Labels: Entity, Document, Tag, Content
Relationships: RELATED_TO, FULFILLS_OBJECTIVE, SIMILAR_TO
```

### GitHub Repository
```
/opt/git/hugo-chemie-lernen-org/
├── myhugoapp/content/entity/     # ~700+ entity pages
├── myhugoapp/content/themenbereiche/  # 12 Themenbereiche
├── myhugoapp/content/quiz.md     # Quiz landing page
├── myhugoapp/data/zigs_videos.json  # Video metadata
└── api/routes/                   # API endpoints for KG queries
```

### External APIs
- **YouTube Data API** (Zig's Chemistry 42 channel)
- **Google Analytics 4** (chemie-lernen.org property)
- **Mailchimp/SendGrid** (Newsletter delivery)
- **Twitter/X API** (Social posting)
- **LinkedIn API** (Business Page posting)

## 🔧 Capabilities

### Content Generation

#### blog-generation
```bash
# Generate blog post from Knowledge Graph entity
POST /api/marketing/generate-blog
{
  "entity_name": "redoxreaktion",
  "format": "wordpress", # or "hugo-markdown"
  "seo_keywords": ["redox", "oxidation", "reduktion", "elektronenübertragung"],
  "target_audience": "schüler" # or "lehrer", "studierende"
}
```

**Template Example:**
```markdown
---
title: "Redoxreaktionen einfach erklärt: Das musst du wissen"
description: "Lerne Redoxreaktionen mit einfachen Beispielen, Übungsaufgaben und einem interaktiven Quiz."
tags: ["redox", "oxidation", "reduktion", "elektronenübertragung", "elektronendichte"]
author: "Prof. Siegfried Schindler"
date: "2026-08-15"
---

## Was sind Redoxreaktionen?

Redoxreaktionen (Reduktions-Oxidations-Reaktionen) sind chemische Reaktionen, bei denen Elektronen übertragen werden. Das Prinzip ist einfach: Ein Stoff gibt Elektronen ab (Oxidation) und ein anderer nimmt sie auf (Reduktion).

### Die Grundprinzipien

1. **Oxidation**: Verlust von Elektronen (z.B. Na → Na⁺ + e⁻)
2. **Reduktion**: Gewinn von Elektronen (z.B. Cl₂ + 2e⁻ → 2Cl⁻)
3. **Redox-Paar**: Oxidation und Reduktion finden gleichzeitig statt

{{< quiz-embed quiz="redoxreaktionen" >}}

### Beispiele aus dem Alltag

- **Rost**: Eisen oxidiert zu Eisen(III)-oxid (Fe₂O₃)
- **Atmung**: Glucose wird zu CO₂ und H₂O oxidiert
- **Batterie**: Lithium oxidiert, Kupfer reduziert
```

**Technische Details:**
- Fetch entity from KG: `MATCH (e:Entity {name: 'redoxreaktion'}) RETURN e`
- Fetch related entities: `MATCH (e:Entity)-[:RELATED_TO]->(r) RETURN r`
- Fetch videos: `WHERE e.id IN (SELECT id FROM files_videos WHERE topic = 'redoxreaktion')`
- Generate internal links: `/entity/redoxreaktion/`, `/quiz?topic=redoxreaktion`

#### social-post
```bash
# Generate social media post
POST /api/marketing/generate-social
{
  "entity_name": "redoxreaktion",
  "platform": "twitter", # or "linkedin", "instagram"
  "tone": "educational", # or "engaging", "promotional"
}
```

**Twitter/X Template (280 char):**
```
🔬 Die Chemie des Atmens: Redoxreaktionen einfach erklärt!

Glucose wird zu CO₂ + H₂O oxidiert – das heißt: Elektronen fließen!

📚 Lerne mehr über Redoxreaktionen:
🔗 chemie-lernen.org/entity/redoxreaktion
🧪 Mach das Quiz: #chemie #redox
```

**LinkedIn Template (max 2000 char):**
```
#ChemieLeichtgemacht: Redoxreaktionen – das Herz der chemischen Reaktionen

🔬 Warum verstehen meisten Schüler Redoxreaktionen nicht?
Oxidation = Elektronen-Verlust (OIL)
Reduktion = Elektronen-Gewinn (RIG)
Mnemonic: "OIL RIG" – Oxidation Is Loss, Reduction Is Gain

📊 In unserem Knowledge Graph finden sich 127 verwandte Konzepte:
- Oxidationszahlen → Wie man sie berechnet
- Elektrochemie → Batterien, Solarzellen
- Photosynthese → Redox + Licht

🧪 INTERAKTIVES QUIZ
Teste dein Wissen über Redoxreaktionen:
🔗 chemie-lernen.org/quiz?topic=redoxreaktion

💡 Lehrend-Tipp: Nutze die ZPD-gestützten Lernpfade für gezielte Übung

#Chemie #Lehrer #Schule #Redoxreaktionen #Didaktik
```

#### newsletter
```bash
# Generate newsletter
POST /api/marketing/generate-newsletter
{
  "type": "weekly", # or "monthly"
  "period_start": "2026-08-11",
  "period_end": "2026-08-17",
  "format": "html"
}
```

**Weekly Digest Template:**
```html
<h2>Chemie-Lernen Newsletter (Woche 33)</h2>
<p>Moin liebe chemie-Lernen Community!</p>

<h3>🎬 Neue Videos von Zig's Chemistry 42</h3>
<ul>
  <li><a href="https://youtu.be/QfkBZ9EEXsM">Lesson 005-A: Fire, Chemical Reactions and the Mole</a></li>
  <li><a href="https://youtu.be/9Rw3imR6wP0">Lesson 004-A: From Coffee to Chemical Elements</a></li>
</ul>

<h3>📚 Neue Entities der Woche</h3>
<ul>
  <li><a href="/entity/atom/">Atom</a> – Grundbaustein der Materie</li>
  <li><a href="/entity/edelgas/">Edelgas</a> – Inertgase im Periodensystem</li>
  <li><a href="/entity/element/">Element</a> – Chemisches Element mit 118 verschiedenen</li>
</ul>

<h3>🧪 Quiz-Ergebnisse der Woche</h3>
<p>Diese Woche haben 127 Schüler das Redoxreaktionen-Quiz absolviert:
- Durchschnitt: 78% Prozentsatz
- Top-3 Fragen: "Elektronenübertragung", "Oxidationszahlen", "Anwendungen"</p>

<h3>🔮 Ausblick: Nächste Woche</h3>
<p>Veröffentlichung von 3 neuen Lernräumen für die Halogene (Chlor, Brom, Iod) in Mozilla Hubs. Stay tuned!</p>

<p>Bis nächste Woche! 🧪</p>
```

### SEO-Optimization

#### meta-generation
```bash
# Generate meta tags for entity pages
POST /api/marketing/generate-meta
{
  "entity_name": "redoxreaktion",
  "format": "hugo-frontmatter"
}
```

**Generated Frontmatter:**
```yaml
---
title: "Redoxreaktionen einfach erklärt – Definition, Beispiele und Übungsaufgaben"
description: "Lerne alles über Redoxreaktionen: Definition, Elektronenübertragung, Oxidation & Reduktion mit einfachen Beispielen, anteiligem Quiz und Detail-Erklärung für Schüler, Lehrer und Studierende."
keywords: ["Redoxreaktion", "Oxidation", "Reduktion", "Elektronenübertragung", "Elektronendichte", "OIL RIG", "Elektrochemie", "Batterien", "Atmung", "Rost"]
canonical: "https://chemie-lernen.org/entity/redoxreaktion/"
robots: "index, follow"
og:title: "Redoxreaktionen einfach erklärt – Chemie-Lernen"
og:description: "Lerne Redoxreaktionen mit einfachen Beispielen und einem interaktiven Quiz."
og:type: "article"
og:url: "https://chemie-lernen.org/entity/redoxreaktion/"
og:image: "https://chemie-lernen.org/static/img/og-redoxreaktion.jpg"
og:locale: "de_DE"
article:author: "Prof. Siegfried Schindler"
article:section: "redoxchemie"
article:published_time: "2026-08-15T12:00:00Z"
article:modified_time: "2026-08-15T12:00:00Z"
twitter:card: "summary_large_image"
twitter:title: "Redoxreaktionen einfach erklärt"
twitter:description: "Lerne Redoxreaktionen mit einfachen Beispielen und einem interaktiven Quiz."
twitter:image: "https://chemie-lernen.org/static/img/twitter-redoxreaktion.jpg"
---
```

#### schema-generation
```bash
# Generate Schema.org JSON-LD for entity pages
POST /api/marketing/generate-schema
{
  "entity_name": "redoxreaktion",
  "type": "Article" # or "Video", "FAQ", "Quiz", "LearningResource"
}
```

**Generated JSON-LD:**
```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "Redoxreaktionen einfach erklärt",
  "description": "Lerne alles über Redoxreaktionen: Definition, Elektronenübertragung, Oxidation & Reduktion mit einfachen Beispielen und einem interaktiven Quiz.",
  "educationalLevel": ["Sekundarstufe I", "Sekundarstufe II"],
  "learningResourceType": "Lesson Plan",
  "educationalUse": "Homework",
  "inLanguage": "de",
  "author": {
    "@type": "Person",
    "name": "Prof. Siegfried Schindler",
    "affiliation": "Justus-Liebig-Universität Gießen"
  },
  "provider": {
    "@type": "Organization",
    "name": "chemie-lernen.org",
    "logo": "https://chemie-lernen.org/static/img/logo.png",
    "url": "https://chemie-lernen.org"
  },
  "about": {
    "@type": "Thing",
    "name": "Redoxreaktion",
    "sameAs": [
      "https://en.wikipedia.org/wiki/Redox",
      "https://de.wiktionary.org/wiki/Redoxreaktion"
    ]
  },
  "hasPart": [
    {
      "@type": "Quiz",
      "name": "Redoxreaktionen Quiz",
      "url": "https://chemie-lernen.org/quiz?topic=redoxreaktion"
    },
    {
      "@type": "Video",
      "name": "Redoxreaktionen im Alltag",
      "url": "https://youtu.be/xyz123",
      "author": "Zig's Chemistry 42"
    }
  ]
}
</script>
```

### Analytics & Conversion

#### analytics-review
```bash
# Review GA4 analytics
POST /api/marketing/analytics-review
{
  "period": "last_7_days", # or "last_30_days", "last_quarter"
  "metrics": ["pageviews", "sessions", "bounce_rate", "conversion_rate"],
  "segments": ["quiz_users", "premium_users", "video_watchers"]
}
```

**Response Example:**
```json
{
  "summary": {
    "total_sessions": 1247,
    "total_pageviews": 3892,
    "bounce_rate": 0.42,
    "avg_session_duration": 245000,
    "conversion_rate": 0.08
  },
  "top_entities": [
    {"entity": "periodensystem", "pageviews": 456, "sessions": 234},
    {"entity": "molare-masse", "pageviews": 387, "sessions": 201},
    {"entity": "ph-wert", "pageviews": 298, "sessions": 156}
  ],
  "conversion_funnel": {
    "quiz_start": 567,
    "quiz_complete": 412,
    "premium_signup": 89
  },
  "tips": [
    "Increase conversion from quiz_login → premium_signup by 15%",
    "Add video preview on quiz landing page",
    "Optimize mobile UX for quiz results page"
  ]
}
```

#### conversion-tracking
```bash
# Track conversion event
POST /api/marketing/track-conversion
{
  "event": "quiz_start",
  "entity": "redoxreaktion",
  "session_id": "abc123",
  "user_id": "user456",
  "timestamp": "2026-08-18T10:00:00Z"
}
```

### Community-Engagement

#### feedback-collection
```bash
# Collect user feedback
POST /api/marketing/collect-feedback
{
  "type": "quiz_completion", # or "premium_signup", "bug_report"
  "entity": "redoxreaktion",
  "rating": 4.5,
  "feedback_text": "Ich hätte gerne mehr Beispiele aus dem Alltag",
  "user_email": "user@example.com"
}
```

#### user-research
```bash
# Plan user research
POST /api/marketing/plan-user-research
{
  "type": "interview", # or "survey", "usability_test"
  "target_audience": "teachers", # or "students", "premium_users"
  "scheduling": {
    "start_date": "2026-09-01",
    "end_date": "2026-09-30",
    "duration_minutes": 30
  }
}
```

**Generated Interview Plan:**
```markdown
# User-Research Interview Plan für Chemie-Lehrer

## Zielsetzung
- Verstehen, wie Lehrer die chemie-lernen.org Plattform im Unterricht einsetzen
- Identify pain points mit jetzigen Lehrplänen-Integration (Curricula linking)
- Gauger interest für Premium-Funktionen (ZPD-Based Assessment)

## Teilnehmer
- **N = 12 Lehrer** (4 Gymnasium, 4 Realschule, 4 Hauptschule)
- Via Calendly: chemie-lernen.org/interview
- Incentiv: 50€ Amazon Gutschein (oder 1 Monat Premium-Access)

## Interview-Skript (30 min)

### Warm-Up (5 min)
- Welche Klasse, welche Fächer?
- Wie lange unterrichtest du Chemie?

### Current Usage (10 min)
- Nutzen Sie chemie-lernen.org im Unterricht?
- Welche Features nutzen Sie? (Quiz, Lernpfade, Lehrpläne)
- Wie oft? (1×/Woche, 1×/Monat)

### Pain Points (8 min)
- Was fehlt in den Lehrplänen?
- Wie vieles ist manuell bei Integration in Ihren Unterricht?
- Was gefällt nicht an der Oberfläche?

### Premium & Future (7 min)
- Was würden Sie für Premium bezahlen? (ZPD-Assessment, Custom Lernpfade)
- Würden Sie Lehrplan-Integration & Quiz-Customization nutzen?
- Feedback zu 3D Lernräumen (Hubs)

## Aufzeichnung
- Zoom-Recording (mit Einverständnis)
- Transcription via Whisper API
- Auswertung via ChatGPT/Anthropic für Themes

## Follow-up
- Send Interview Summary per Email
- Request für 1 Monat Premium-Access Test
```

## ⚡ Workflows

### W1: Weekly Content Generation (Montag 09:00)
1. Fetch new entities from last 7 days
2. Generate blog post for 1-2 important entities
3. Generate social media posts for Twitter/X & LinkedIn
4. Schedule via Buffer/Hootsuite

### W2: Monthly Newsletter (Erster Montag 10:00)
1. Compile: New videos, new entities, quiz statistics
2. Generate HTML newsletter template
3. Review with Content Team
4. Send via Mailchimp (list: ~2,000 subscribers)

### W3: SEO Optimization (Wöchtentags Alldonjonch 11:00)
1. Identify pages with low traffic (from Google Search Console)
2. Update meta tags & schema markup
3. Check for broken links (404s)
4. Regenerate sitemap.xml

### W4: Analytics Review (Freitag 16:00)
1. Pull GA4 data for last 7 days
2. Calculate conversion funnel: Visitor → Quiz → Premium
3. Identify top-performing entities
4. Plan content for next week

## 🔌 Integration

### Hugo Frontend Integration
```diff
 myhugoapp/layouts/_default/entity/single.html
+{{ if eq .Params.marketing_meta_auto "true" }}
+  {{ partial "marketing/meta-tags.html" (dict "entity" .Params.name) }}
+{{ end }}
+
+{{ if eq .Params.marketing_schema_auto "true" }}
+  {{ partial "marketing/schema-org.html" (dict "type" "Article" "entity" .Params.name) }}
+{{ end }}
```

### API Routes
```javascript
// api/routes/marketing.js

import { generateBlogFromEntity } from '../services/marketing/blog-generator.js';
import { generateMetaTags } from '../services/marketing/seo-generator.js';
import { getAnalyticsData } from '../services/marketing/analytics-service.js';

router.get('/marketing/generate-blog/:entityName', async (req, res) => {
  const { entityName } = req.params;
  const blogPost = await generateBlogFromEntity(entityName);
  res.json(blogPost);
});

router.get('/marketing/meta/:entityName', async (req, res) => {
  const { entityName } = req.params;
  const metaTags = await generateMetaTags(entityName);
  res.json(metaTags);
});

router.get('/marketing/analytics', async (req, res) => {
  const { period } = req.query;
  const analytics = await getAnalyticsData(period);
  res.json(analytics);
});
```

### Knowledge Graph Queries
```javascript
// scripts/marketing/generate-entity-stats.mjs

import neo4j from 'neo4j-driver';

const driver = neo4j.driver('bolt://chemie-kg:7687');

async function getEntityStats(entityName) {
  const session = driver.session();

  const statsQuery = `
    MATCH (e:Entity {name: $entityName})
    OPTIONAL MATCH (e)-[:RELATED_TO]->(r)
    OPTIONAL MATCH (e)-[:FULFILLS_OBJECTIVE]->(o)
    OPTIONAL MATCH (d:Document)-[:MENTIONS]->(e)
    RETURN
      e.name as entity_name,
      e.description as description,
      count(DISTINCT r) as related_count,
      count(DISTINCT o) as objective_count,
      count(DISTINCT d) as document_count,
      collect(DISTINCT r.name)[0..3] as top_related
  `;

  const result = await session.run(statsQuery, { entityName });
  await session.close();

  return result.records[0];
}
```

## 📚 Ressourcen

### Internal Documentation
- `/opt/git/hugo-chemie-lernen-org/AGENTS.md` (Project Instructions)
- `/opt/git/marketing-research/README.md` (Marketing Research)
- `/opt/git/hugo-chemie-lernen-org/docs/SEO.md` (SEO Guidelines)

### External Services
- **YouTube Data API v3**: Fetch Zig's Chemistry 42 video metadata
- **Google Analytics 4**: Property ID: GA_MEASUREMENT_ID (TODO: add to .env)
- **Google Search Console**: Search Performance Reports
- **Mailchimp API**: Newsletter delivery & list management
- **Twitter/X API v2**: Social posting (@chemie_lernen)
- **LinkedIn API**: Business Page posting (chemie-lernen.org)

## 🎯 Success Metrics

### Content Goals
- 10 Blog posts/month (automated from KG)
- 3 Social posts/week (Twitter, LinkedIn)
- 1 Newsletter/month (Weekly digest, Monthly deep-dive)

### SEO Goals
- 100% of entity pages have proper meta tags
- Top 5 organic search keywords in "Chemie-Learning" space
- 50% increase in organic traffic (baseline: 1,000 sessions/month)

### Conversion Goals
- 15% Free-to-Premium conversion rate
- 30% quiz-to-signup conversion rate
- 10% increase in average session duration

### Community Goals
- 5,000 newsletter subscribers (current: 2,000)
- 100 user interviews/month (teachers & students)
- 25 community-submitted quiz questions/month

## 🔧 Technische Konfiguration

### Environment Variables (.env)
```bash
# Marketing Services
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_PROPERTY_ID=123456789
GOOGLE_SEARCH_CONSOLE_API_KEY=xxx

# Newsletter
MAILCHIMP_API_KEY=xxx-newsletters
MAILCHIMP_LIST_ID=xxx-newsletters-subscribers
NEWSLETTER_FROM=noreply@chemie-lernen.org

# Social Media
TWITTER_BEARER_TOKEN=xxx-x-api-token
LINKEDIN_ACCESS_TOKEN=xxx-workplace-token
LINKEDIN_ORGANIZATION_ID=xxx-urn:li:organization:12345

# Scheduling
BUFFER_ACCESS_TOKEN=xxx
BUFFER_SOCIAL_PROFILES=["twitter/chemie_lernen", "linkedin/chemie-lernen-org"]
```

### Cron Jobs (via Systemd Timer)
```bash
# Weekly Blog Generation ( Montag 09:00 )
[Unit]
Description=Weekly Blog Generation for chemie-lernen.org

[Timer]
OnCalendar=Mon 09:00
Persistent=true

[Service]
ExecStart=/opt/git/hugo-chemie-lernen-org/scripts/marketing/weekly-blog.sh
WorkingDirectory=/opt/git/hugo-chemie-lernen.org
User=weiss
```

## 🚀 Quick Start

### 1. Marketing-API starten
```bash
cd /opt/git/hugo-chemie-lernen-org
npm run dev:marketing-api  # Port 3002
```

### 2. Test Blog Generation
```bash
curl http://localhost:3002/api/marketing/generate-blog/redoxreaktion
```

### 3. Generate Social Post
```bash
curl http://localhost:3002/api/marketing/generate-social/redoxreaktion?platform=twitter
```

### 4. Review Analytics
```bash
curl http://localhost:3002/api/marketing/analytics?period=last_7_days
```

---

**TODO:**
- [ ] Create `api/routes/marketing.js` with all routes
- [ ] Implement `blog-generator.js` with KG queries
- [ ] Create `seo-generator.js` for meta & schema
- [ ] Add GA4 event tracking script to frontend
- [ ] Set up Mailchimp templates & automation
- [ ] Configure Buffer social scheduling
- [ ] Create systemd timer for weekly blog generation
