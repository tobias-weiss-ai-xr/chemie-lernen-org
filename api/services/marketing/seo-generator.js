/**
 * SEO Generator Service - Generates meta tags and schema.org markup
 */

/**
 * Generate meta tags for entity page (Hugo frontmatter format)
 */
export async function generateMetaTags(entityName, schemaType = 'LearningResource') {
  const today = new Date().toISOString().split('T')[0];
  const entitySlug = entityName.toLowerCase().replace(/\s+/g, '-');

  const metaTags = {
    title: `${entityName} einfach erklärt – Definition, Beispiele und Übungsaufgaben`,
    description: `Lerne alles über ${entityName}: Definition, grundlegende Prinzipien mit einfachen Beispielen, Übungsaufgaben und einem interaktiven Quiz für Schüler, Lehrer und Studierende.`,
    keywords: [
      entityName,
      'chemie lernen',
      'chemie unterricht',
      'chemie quiz',
      'schüler chemie'
    ],
    canonical: `https://chemie-lernen.org/entity/${entitySlug}/`,
    robots: 'index, follow',
    og: {
      title: `${entityName} einfach erklärt – Chemie-Lernen`,
      description: `Lerne ${entityName} mit einfachen Beispielen und einem interaktiven Quiz.`,
      type: schemaType === 'LearningResource' ? 'article' : schemaType.toLowerCase(),
      url: `https://chemie-lernen.org/entity/${entitySlug}/`,
      image: `https://chemie-lernen.org/static/img/og-${entitySlug}.jpg`,
      locale: 'de_DE'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${entityName} einfach erklärt`,
      description: `Lerne ${entityName} mit einfachen Beispielen und einem interaktiven Quiz.`,
      image: `https://chemie-lernen.org/static/img/twitter-${entitySlug}.jpg`
    },
    article: {
      author: 'Prof. Siegfried Schindler',
      section: 'chemie',
      published_time: `${today}T12:00:00Z`,
      modified_time: `${today}T12:00:00Z`
    }
  };

  return metaTags;
}

/**
 * Generate Schema.org JSON-LD markup
 */
export function generateSchemaMarkup(entityName, type = 'LearningResource') {
  const entitySlug = entityName.toLowerCase().replace(/\s+/g, '-');

  const schemas = {
    Article: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${entityName} einfach erklärt`,
      description: `Lerne alles über ${entityName} mit einfachen Beispielen und einem interaktiven Quiz.`,
      author: {
        '@type': 'Person',
        name: 'Prof. Siegfried Schindler',
        affiliation: 'Justus-Liebig-Universität Gießen'
      },
      publisher: {
        '@type': 'Organization',
        name: 'chemie-lernen.org',
        logo: {
          '@type': 'ImageObject',
          url: 'https://chemie-lernen.org/static/img/logo.png'
        }
      },
      url: `https://chemie-lernen.org/entity/${entitySlug}/`,
      datePublished: new Date().toISOString(),
      genre: 'Education',
      educationalLevel: ['Sekundarstufe I', 'Sekundarstufe II'],
      inLanguage: 'de',
      about: {
        '@type': 'Thing',
        name: entityName
      }
    },
    Video: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: `${entityName} erklärt (Video)`,
      description: `Lerne ${entityName} mit einem von Zig's Chemistry 42 Video.`,
      thumbnailUrl: [`https://i.ytimg.com/vi/Hq8w5Xkxp0/mqdefault.jpg`],
      uploadDate: new Date().toISOString(),
      duration: 'PT5M',
      author: {
        '@type': 'Organization',
        name: 'Zig\'s Chemistry 42'
      },
      provider: {
        '@type': 'Organization',
        name: 'chemie-lernen.org'
      },
      url: `https://chemie-lernen.org/entity/${entitySlug}/`
    },
    Quiz: {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: `${entityName} Quiz`,
      description: `Teste dein Wissen über ${entityName} mit einem interaktiven Quiz.`,
      educationalLevel: 'Sekundarstufe II',
      about: {
        '@type': 'Thing',
        name: entityName
      },
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: {
            '@type': 'TakeAction'
          },
          userInteractionCount: '1000'
        }
      ]
    },
    LearningResource: {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: `${entityName} einfach erklärt`,
      description: `Lerne alles über ${entityName}: Definition, grundlegende Prinzipien mit einfachen Beispielen, Übungsaufgaben und einem interaktiven Quiz.`,
      educationalLevel: ['Sekundarstufe I', 'Sekundarstufe II'],
      learningResourceType: 'Lesson Plan',
      educationalUse: 'Homework',
      inLanguage: 'de',
      author: {
        '@type': 'Person',
        name: 'Prof. Siegfried Schindler',
        affiliation: 'Justus-Liebig-Universität Gießen'
      },
      provider: {
        '@type': 'Organization',
        name: 'chemie-lernen.org',
        logo: 'https://chemie-lernen.org/static/img/logo.png',
        url: 'https://chemie-lernen.org'
      },
      about: {
        '@type': 'Thing',
        name: entityName
      }
    }
  };

  return schemas[type] || schemas.LearningResource;
}
