/**
 * Social Post Generator Service - Generates posts for Twitter/X, LinkedIn, Instagram
 */

/**
 * Generate social media post
 */
export async function generateSocialPost(entityName, platform = 'twitter', tone = 'educational') {
  const entitySlug = entityName.toLowerCase().replace(/\s+/g, '-');

  const templates = {
    twitter: {
      educational: `🔬 ${entityName} erklärt – Chemie leicht gemacht!

Lerne ${entityName} mit einfachen Beispielen und einem interaktiven Quiz.

📚 Mehr: chemie-lernen.org/entity/${entitySlug}
🧪 Quiz: #chemie #${entitySlug.replace(/-/g, '')}`,
      engaging: `🚀 Hast du ${entityName} schon mal im Alltag erlebt?

Ja, öfter als du denkst! Erfahre, wo & warum in unserem aktuellen Blogpost.

🔗 chemie-lernen.org/entity/${entitySlug}
#ChemieLernen #Didaktik`,
      promotional: `🎓 Schüler & Lehrer: Verbessere deine Chemie-Kenntnisse mit ${entityName}!

🧪 Interaktives Quiz
📊 ZPD-basierte Lernpfade
🎬 Video-Integration

Jetzt kostenlos lernen: chemie-lernen.org/entity/${entitySlug}
#Premium #ChemieLernen`
    },
    linkedin: {
      educational: `#ChemieLeichtgemacht: ${entityName} – Das musst du wissen

Warum wird ${entityName} oft nicht verstanden?
Meist fehlt der praktische Bezug zum Alltag.

📐 Grundprinzipien:
✅ Definition & Begriffsabgrenzung
✅ Typische Beispiele & Gegenbeispiele
✅ Anwendungen im Labor & Alltag

🧪 INTERAKTIVES QUIZ
Teste dein Wissen:
🔗 chemie-lernen.org/entity/${entitySlug}

💡 Lehrend-Tipp:
Nutze die ZPD-gestützten Lernpfade für gezielte Übung.

${['#Chemie', '#Lehrer', '#Schule', `#${entityName.replace(/-/g, '')}`].join(' ')}`,
      engaging: `📊 7 von 10 Schüler scheitern an ${entityName} – wir ändern das!

Herausforderung:
- ${entityName} ist komplex
- Lehrpläne sind z.T. unklar
- Fehlende Übungsressourcen

Die Lösung:
✅ Interaktive Quiz mit Sofort-Feedback
✅ ZPD-based Assessment
✅ 3D visualisierte Lernräume

Ergebnis: 3x besseres Verständnis in 1 Woche!

🔗 Ausprobieren: chemie-lernen.org/entity/${entitySlug}
#Chemie #EdTech #Lernplattform`,
      promotional: `🎓 Premium-Access: ${entityName} – Master the basics

Für Schulklassen & Lehrer:
✅ Custom Lernpfade (nach Bundesland)
✅ Premium Quiz-Bank (1000+ Fragen)
✅ Real-time Assessment Analytics

💰 Schul-Lizenz: 5€/Schüler/Monat
🆔 Test-Account: chemie-lernen.org/premium

${['#Chemie', '#PremiumAccess', '#Schulsoftware'].join(' ')}

Join 2,000+ Lehrer, die bisher unsere Plattform nutzen!`
    },
    instagram: {
      educational: `🧪 ${entityName} erklärt

Warum ist ${entityName} wichtig?
💭 Everyday examples
🔬 Lab demonstrations
📚 Quiz for practice

🔗 chemie-lernen.org/entity/${entitySlug}
.
#ChemieLernen #${entityName.replace(/-/g, '')} #DailyScience`,
      engaging: `🚀 ${entityName} – const test, not magic!

Discover where you encounter ${entityName} daily.

🍽️ In food
🧴 In everyday products
🏭 In industry

🔗 chemie-lernen.org/entity/${entitySlug}
.
#ChemieFakten #ScienceEd`,
      promotional: `🎓 Upgrade your chemistry learning!

Access ${entityName} premium content:

✅ Custom learning paths
✅ Premium quiz bank
✅ 3D learning spaces

🔗 chemie-lernen.org/premium
.
#ChemiePremium #EdTech #LearnChemistry`
    }
  };

  // Combine platform + tone
  let postContent = templates[platform]?.[tone] ||
                    templates[platform]?.educational ||
                    templates.twitter.educational;

  // Character limit enforcement
  if (platform === 'twitter') {
    postContent = postContent.slice(0, 280);
  }

  return {
    platform,
    tone,
    entityName,
    content: postContent,
    hashtags: postContent.match(/#[\w-]+/g) || [],
    links: postContent.match(/https?:\/\/[^\s]+/g) || [],
    characterCount: postContent.length,
    exceedsLimit: platform === 'twitter' && postContent.length > 280
  };
}

/**
 * Batch generate social posts for all platforms
 */
export async function generateBatchSocialPosts(entityName, tone = 'educational') {
  const platforms = ['twitter', 'linkedin', 'instagram'];
  const posts = {};

  for (const platform of platforms) {
    posts[platform] = await generateSocialPost(entityName, platform, tone);
  }

  return posts;
}
