/**
 * Article HTML template — entity detail page for /entity/:slug
 * Generates a full HTML page with entity metadata, related entities, learning path, and dark mode.
 */

/**
 * Generate the full HTML page for an entity detail page.
 * @param {object} opts
 * @param {object} opts.entity - Entity object (name, category, articles, articleCount, relatedEntities, curriculumMeta, contentLinks, etc.)
 * @param {boolean} opts.isCurriculum - Whether entity is a curriculum topic
 * @param {string} opts.displayName - Formatted display name
 * @param {string} opts.catColor - CSS color for category badge
 * @param {string} opts.catLabel - Human-readable category label
 * @param {string} opts.metaHtml - HTML for curriculum metadata section
 * @param {string} opts.quelleHtml - HTML for source references
 * @param {string} opts.kmkHtml - HTML for KMK standards
 * @param {string} opts.learningPathHtml - HTML for learning path content
 * @param {string} opts.quizHtml - HTML for quiz links
 * @param {string} opts.otherRelatedHtml - HTML for related entities
 * @param {string} opts.articlesHtml - HTML for article list
 * @param {string} opts.slug - Entity slug for the inline script
 * @param {string} opts.backLink - URL for back link
 * @returns {string} Complete HTML page
 */
export function renderEntityPage(opts) {
  const {
    isCurriculum, displayName, catColor, catLabel,
    metaHtml, quelleHtml, kmkHtml, learningPathHtml, quizHtml,
    otherRelatedHtml, articlesHtml, slug, backLink
  } = opts;

  return (
    '<!DOCTYPE html>' +
    '<html lang="de">' +
    '<head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(displayName) + ' - chemie-lernen.org</title>' +
    '<style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:2rem;background:#f5f5f5;color:#333}' +
    '.container{max-width:800px;margin:0 auto}' +
    '.card{background:#fff;border-radius:12px;padding:2rem;box-shadow:0 2px 8px rgba(0,0,0,0.1)}' +
    '.cat-badge{display:inline-block;padding:4px 12px;border-radius:20px;color:#fff;font-size:.85rem;font-weight:600;background:' + catColor + '}' +
    'h1{margin:.5rem 0 1.5rem;font-size:1.8rem}' +
    '.meta-section{background:#fafafa;border-radius:8px;padding:1rem;margin:1rem 0}' +
    '.meta-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}' +
    '.meta-row:last-child{border-bottom:none}' +
    '.meta-label{font-weight:600;color:#666}' +
    '.meta-value{color:#333}' +
    '.related-list{display:flex;flex-wrap:wrap;gap:8px;margin:.5rem 0}' +
    '.related-chip{display:inline-block;padding:6px 14px;background:#e8f0fe;color:#1a73e8;border-radius:20px;text-decoration:none;font-size:.9rem}' +
    '.related-chip:hover{background:#d2e3fc}' +
    '.quelle-chip{display:inline-block;padding:6px 14px;background:#fef3e2;color:#b8860b;border-radius:20px;text-decoration:none;font-size:.85rem;border:1px solid #f0d9b5}' +
    '.quelle-chip:hover{background:#fce4b8}' +
    '.kmk-list{display:flex;flex-wrap:wrap;gap:8px;margin:.5rem 0}' +
    '.kmk-chip{display:inline-block;padding:6px 14px;background:#e8f5e9;color:#2e7d32;border-radius:20px;text-decoration:none;font-size:.85rem;border:1px solid #a5d6a7}' +
    '.kmk-chip:hover{background:#c8e6c9;border-color:#388e3c}' +
    '.kmk-chip::before{content:"✓ ";font-weight:bold}' +
    '.content-links-list{display:flex;flex-direction:column;gap:6px;margin:.5rem 0}' +
    '.content-link-card{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8f9fa;border-radius:8px;text-decoration:none;color:#333;font-size:.9rem;border:1px solid #e9ecef;transition:all .15s}' +
    '.content-link-card:hover{background:#e8f0fe;border-color:#1a73e8;transform:translateX(3px)}' +
    '.content-link-icon{font-size:1.1rem;flex-shrink:0}' +
    '.content-link-title{flex:1;font-weight:500}' +
    '.content-link-type{font-size:.75rem;color:#888;text-transform:uppercase;letter-spacing:.5px}' +
    '.content-link-more{text-align:center;font-size:.85rem;color:#888;padding:4px}' +
    '.quiz-links-list{display:flex;flex-wrap:wrap;gap:8px;margin:.5rem 0}' +
    '.quiz-link-card{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#fff3e0;border:1px solid #ffcc80;border-radius:8px;text-decoration:none;color:#e65100;font-size:.9rem;transition:all .15s}' +
    '.quiz-link-card:hover{background:#ffe0b2;border-color:#ff9800;text-decoration:none}' +
    '.quiz-link-label{flex:1;font-weight:500}' +
    '.quiz-link-arrow{font-weight:bold;font-size:1.1rem}' +
    '.curricula-context{margin:1rem 0}' +
    '.curricula-context h3{font-size:1rem;margin:1rem 0 0.5rem}' +
    '.curricula-context-stats{display:flex;gap:1rem;font-size:0.85rem;color:var(--text-muted,#666);margin-bottom:0.5rem}' +
    '.curricula-context-stats strong{color:#9b59b6}' +
    '.topic-chip{display:inline-block;padding:4px 10px;margin:3px;background:#f3e5f5;color:#7b1fa2;border-radius:14px;text-decoration:none;font-size:0.8rem;border:1px solid #ce93d8}' +
    '.topic-chip:hover{background:#e1bee7;border-color:#7b1fa2}' +
    '.objective-chip{display:inline-block;padding:3px 8px;margin:2px;background:#e8f5e9;color:#2e7d32;border-radius:10px;font-size:0.75rem;border:1px solid #a5d6a7}' +
    '.article-list{padding-left:1.2rem}' +
    '.article-list li{margin:.5rem 0;color:#555}' +
    '.back-link{display:inline-block;margin-top:1.5rem;color:#666;text-decoration:none}' +
    '.back-link:hover{color:#333}' +
    '@media(prefers-color-scheme:dark){' +
    'body{background:#1a1a2e;color:#e0e0e0}' +
    '.card{background:#16213e;box-shadow:0 2px 8px rgba(0,0,0,0.4)}' +
    '.meta-section{background:#1a1a3e}' +
    '.related-chip{background:#2a2a5e;color:#7cb3ff}' +
    '.content-link-card{background:#2a2a4e;color:#e0e0e0;border-color:#444}' +
    '.quiz-link-card{background:#3a2a1e;color:#ffb74d;border-color:#6a4a2e}' +
    '.quiz-link-card:hover{background:#4a3a2e}' +
    '.content-link-card:hover{background:#3a3a6e}' +
    '.content-link-type{color:#999}' +
    '.kmk-chip{background:#1b3a1b;color:#81c784;border-color:#2e7d32}' +
    '.quelle-chip{background:#3a2a1b;color:#f0d9b5;border-color:#b8860b}' +
    '.meta-row{border-bottom-color:#333}' +
    '.meta-label{color:#999}' +
    '.topic-chip{background:#3a2050;color:#ce93d8;border-color:#7b1fa2}' +
    '.topic-chip:hover{background:#4a2060}' +
    '.objective-chip{background:#1b3a1b;color:#81c784;border-color:#2e7d32}' +
    '.curricula-context h3{color:#e0e0e0}' +
    '}</style>' +
    '</head><body>' +
    '<div class="container">' +
    '<div class="card">' +
    '<span class="cat-badge">' + escapeHtml(catLabel) + '</span>' +
    '<h1>' + escapeHtml(displayName) + '</h1>' +
    (isCurriculum ? '<div class="meta-section">' + metaHtml + '</div>' : '') +
    quelleHtml +
    kmkHtml +
    learningPathHtml +
    quizHtml +
    otherRelatedHtml +
    articlesHtml +
    '<div id="curricula-context" class="curricula-context"></div>' +
    '<a href="' + backLink + '" class="back-link">← Zurück</a>' +
    '</div></div>' +
    '<script>' +
    'fetch("/api/entities/' + slugify(slug) + '/curricula").then(function(r){return r.json()}).then(function(d){' +
    'var el=document.getElementById("curricula-context");' +
    'if(!el||!d.coveredTopics||!d.fulfilledObjectives)return;' +
    'var ct=d.coveredTopics.filter(function(t){return t.topic});' +
    'var fo=d.fulfilledObjectives.filter(function(o){return o.objective});' +
    'if(ct.length===0&&fo.length===0)return;' +
    'var h="<h3>📚 Lehrplan-Kontext</h3>";' +
    'h+="<div class=\\"curricula-context-stats\\">";' +
    'h+="<span><strong>"+ct.length+"</strong> Themen</span>";' +
    'h+="<span><strong>"+fo.length+"</strong> Lernziele</span>";' +
    'h+="</div>";' +
    'if(ct.length>0){' +
    'h+="<div class=\\"kmk-list\\">";' +
    'for(var i=0;i<ct.length;i++){' +
    'var topicSlug=ct[i].topic.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");' +
    'h+="<a href=\\"/entity/"+topicSlug+"/\\" class=\\"topic-chip\\">"+ct[i].topic.replace(/-/g," ")+"</a>";' +
    '}' +
    'h+="</div>";' +
    '}' +
    'if(fo.length>0){' +
    'h+="<p style=\\"font-size:0.8rem;color:#888;margin:0.5rem 0 0.25rem\\">Erfüllte Lernziele</p>";' +
    'h+="<div class=\\"kmk-list\\">";' +
    'for(var j=0;j<Math.min(fo.length,20);j++){' +
    'h+="<span class=\\"objective-chip\\">"+fo[j].objective.replace(/-/g," ")+"</span>";' +
    '}' +
    'if(fo.length>20)h+="<span class=\\"objective-chip\\">+"+(fo.length-20)+" weitere</span>";' +
    'h+="</div>";' +
    '}' +
    'el.innerHTML=h;' +
    '}).catch(function(){});' +
    '</script>' +
    '</body></html>'
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
