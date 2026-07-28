---
title: 'PWA & Offline-Modus'
description: 'Chemie Lernen als Progressive Web App — installieren und offline nutzen'
date: 2026-05-28
type: 'page'
layout: 'single'
icon: '📱'
tags: ['pwa', 'offline', 'app', 'mobil', 'installation']
---

## PWA & Offline-Modus

Chemie Lernen kann als Progressive Web App (PWA) installiert werden — nutzen Sie die Plattform wie eine native App und greifen Sie offline auf Lerninhalte zu.

### Installation

**Auf dem Smartphone (Android/iOS):**

1. Öffnen Sie chemie-lernen.org im Browser
2. Tippen Sie auf "Zum Startbildschirm hinzufügen" (Android) / "Teilen" → "Zum Home-Bildschirm" (iOS)
3. Die App wird installiert und ist ab sofort offline nutzbar

**Auf dem Desktop (Chrome/Edge):**

1. Klicken Sie auf das Installationssymbol in der Adressleiste
2. Bestätigen Sie die Installation

### Vorteile

- **Offline-Nutzung:** Bereits besuchte Seiten sind offline verfügbar
- **Schneller Zugriff:** Direkter Start vom Startbildschirm
- **Kein App Store:** Automatische Updates, keine Installation nötig
- **Speichersparend:** Deutlich kleiner als native Apps

### Technische Details

Die PWA verwendet einen Service Worker mit folgenden Caching-Strategien:

- Statische Assets (CSS, JS, Bilder): Cache First
- HTML-Seiten: Network First mit Cache-Fallback
- API-Daten: Stale While Revalidate
