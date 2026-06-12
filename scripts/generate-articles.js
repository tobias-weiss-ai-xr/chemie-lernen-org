#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const topics = {
  'organische-stoffklassen': {
    articles: [
      { title: 'Alkohole und Ether', difficulty: 'grundlagen', icon: '🧪' },
      { title: 'Carbonsäuren und Ester', difficulty: 'mittel', icon: '🧴' },
      { title: 'Amine und Amide', difficulty: 'mittel', icon: '⚗️' }
    ]
  },
  'reaktionstypen': {
    articles: [
      { title: 'Elektrophile aromatische Substitution', difficulty: 'schwer', icon: '🔬' },
      { title: 'Radikalreaktionen im Detail', difficulty: 'fortgeschritten', icon: '⚡' },
      { title: 'Redoxreaktionen Elektrochemie', difficulty: 'mittel', icon: '🔋' }
    ]
  },
  'energetik': {
    articles: [
      { title: 'Thermodynamik Gesetze', difficulty: 'grundlagen', icon: '🌡️' },
      { title: 'Gibbs-Energie und Spontaneität', difficulty: 'schwer', icon: 'ΔG' },
      { title: 'Enthalpie und Entropie Praktisch', difficulty: 'mittel', icon: '📊' }
    ]
  },
  'analytik': {
    articles: [
      { title: 'Spektroskopische Methoden', difficulty: 'mittel', icon: '📈' },
      { title: 'Chromatographie Grundlagen', difficulty: 'grundlagen', icon: '🧬' },
      { title: 'Elektroanalytische Verfahren', difficulty: 'schwer', icon: '⚡' }
    ]
  },
  'anorganik': {
    articles: [
      { title: 'Ionenkristalle und Gitter', difficulty: 'mittel', icon: '💎' },
      { title: 'Übergangsmetalle Komplexe', difficulty: 'schwer', icon: '🔩' },
      { title: 'Hauptgruppen Elemente', difficulty: 'grundlagen', icon: '⚛️' }
    ]
  }
};

function createArticle(topic, article) {
  const articleSlug = article.title.toLowerCase()
    .replace(/[^a-z0-9äöüß\- "]+/g, '')
    .replace(/["\s]+/g, '-')
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue');
  
  const content = `---
title: "${article.title}"
description: "Lernen Sie über ${article.title.toLowerCase()} und ihre Anwendungen in der Chemie."
date: "${new Date().toISOString().split('T')[0]}"
tags: ["chemie", "${article.title.toLowerCase().replace(' ', '-')}"]
interaktiv: false
schwierigkeit: "${article.difficulty}"
teilgebiet: ["${topic}"]
icon: "${article.icon}"
---

# ${article.title}

Dies ist der Platzhalter für den Inhalt über ${article.title}.

## Hauptkonzept

Hier werden die grundlegenden Konzepte erklärt.

Mathematische Beziehungen: $E = \\frac{1}{2}mv^2$

## Praktische Anwendungen

- Laboranwendung
- Industrielle Methoden  
- Alltagsbezug

## Übungsfragen

{{< quiz id="${articleSlug}-quiz" >}}

## Zusammenfassung

Die wichtigsten Punkte sind hier zusammengefasst.
`;

  return { slug: articleSlug, content };
}

function generateArticles() {
  const contentDir = path.join(__dirname, '..', 'myhugoapp/content');
  
  Object.keys(topics).forEach(topic => {
    const topicData = topics[topic];
    const topicDir = path.join(contentDir, 'themenbereiche', topic);
    
    if (!fs.existsSync(topicDir)) {
      fs.mkdirSync(topicDir, { recursive: true });
      console.log(`Created directory: ${topicDir}`);
    }
    
    topicData.articles.forEach(article => {
      const { slug, content } = createArticle(topic, article);
      const filePath = path.join(topicDir, `${slug}.md`);
      
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Created article: ${filePath}`);
      } else {
        console.log(`Article already exists: ${filePath}`);
      }
    });
  });
}

if (require.main === module) {
  console.log('🧪 Generating chemistry articles...\n');
  generateArticles();
  console.log('\n✅ Article generation complete!');
  console.log('💡 Tip: Review and expand the generated articles with detailed content.');
}

module.exports = { generateArticles, createArticle };