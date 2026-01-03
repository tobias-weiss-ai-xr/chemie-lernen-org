---
title: "Roadmap: Ausbaustrategie"
date: 2026-01-03
description: "Die zukünftige Entwicklungsstrategie für chemie-lernen.org"
tags: ["roadmap", "entwicklung", "vr"]
---

Die aktuelle Plattform nutzt erfolgreich VR (Mozilla Hubs) zur Visualisierung des Periodensystems und grundlegender Experimente. Um sich von einem forschungsorientierten Projekt zu einem umfassenden Lernökosystem zu entwickeln, werden folgende Erweiterungen empfohlen.

## 0. Kürzliche Verbesserungen ✨ (Januar 2026)

### Codequalität & Wartbarkeit

*   **✓ Shared Utility Modules (IMPLEMENTIERT):** Zentrale Bibliothek für chemische Formel-Parsing und Berechnungen. Eliminierung von ~160 Zeilen doppeltem Code über 3 Dateien. Verbesserte Wartbarkeit und Konsistenz.
*   **✓ Performance-Optimierung (IMPLEMENTIERT):** Screenshots von PNG zu WebP konvertiert. Ersparnis von 14.19 MB (80% Reduktion) bei verbesserter Bildqualität durch modernere Kompression.
*   **✓ Test-Infrastruktur (IMPLEMENTIERT):** Jest-Test-Suite für Stöchiometrie-Rechner, Export-Manager und Visualisierungskomponenten. 53+ Tests mit automatisierter Coverage-Berichterstattung.
*   **✓ ESLint & Prettier (IMPLEMENTIERT):** Automatische Code-Formatierung und Linting mit Pre-Commit-Hooks. Konsistenter Codestil über das gesamte Projekt.

### Berechner & Werkzeuge

*   **✓ Stöchiometrie-Rechner (IMPLEMENTIERT):** Umfassender Rechner für Mol-Mol-Umrechnungen, Masse-Masse-Berechnungen, limitierende Reagenzien, prozentuale Ausbeute und Gasgesetze.
*   **✓ pH-Rechner (IMPLEMENTIERT):** Interaktiver Rechner für pH- und pOH-Werte mit starker und schwacher Säuren/Basen.
*   **✓ Molare-Masse-Rechner (IMPLEMENTIERT):** Automatische Berechnung der molaren Masse aus chemischen Formeln mit detaillierter Elementaranalyse.
*   **✓ Reaktionsgleichungen-Ausgleicher (IMPLEMENTIERT):** Automatisches Ausgleichen chemischer Reaktionsgleichungen mit Matrix-Methode und Verifizierung.
*   **✓ Löslichkeitsprodukt-Rechner (IMPLEMENTIERT):** Berechnung von Ksp-Werten und Vorhersage von Fällungsreaktionen. [Jetzt berechnen](/loeslichkeitsprodukt-rechner/)
*   **✓ Redox-Potenzial-Rechner (IMPLEMENTIERT):** Bestimmung von Zellspannungen, Gibbs-Energie und Redox-Gleichgewichten. [Jetzt berechnen](/redox-potenzial-rechner/)
*   **✓ Konzentrationsumrechner (IMPLEMENTIERT):** Umrechnung zwischen 11 verschiedenen Konzentrationseinheiten (Molar, Molal, %, ppm, ppb, etc.). [Jetzt umrechnen](/konzentrationsumrechner/)

## 1. Immersive VR-Szenarioen 🥽

Während das Periodensystem ein guter Anfang ist, entfaltet VR seine größte Stärke bei der Visualisierung von Dingen, die sonst unsichtbar oder gefährlich sind.

*   **✓ PSE in VR (IMPLEMENTIERT):** Vollständige WebXR-basierte VR-Erfahrung für das Periodensystem. Interaktive 3D-Umgebung mit Multiplayer-Unterstützung. [Jetzt erleben](/pages/pse-in-vr/)
*   **✓ Molekülstudio (IMPLEMENTIERT):** Interaktive 3D-Webanwendung zur Visualisierung von Molekülen mit Echtzeit-Rendering, Maussteuerung und automatischer Rotation. [Jetzt testen](/molekuel-studio/)
*   **✓ Interaktives Periodensystem 3D (IMPLEMENTIERT):** WebGL-basiertes 3D-Periodensystem mit verschiedenen Ansichten (Tabelle, Kugel, Helix, Gitter). [Jetzt erkunden](/perioden-system-der-elemente/)
*   **Subatomare Reisen:** Interaktive Räume, in denen Nutzer Atome durch Hinzufügen von Protonen, Neutronen und Elektronen "aufbauen" können, um zu beobachten, wie sich Orbitale (s, p, d, f) in 3D verändern.
*   **Molekülgalerie in VR:** Ein Raum, der der VSEPR-Theorie gewidmet ist, in dem Nutzer durch riesige 3D-Modelle komplexer Moleküle (z. B. DNA, Koffein oder Polymere) laufen können, um Bindungswinkel zu verstehen.
*   **Gefahrfreie Labore:** Simulierte "Extreme Experimente", die zu gefährlich für ein Schullabor wären (z. B. Alkalimetalle in Wasser, Thermit-Reaktion), bei denen Schüler mit den Variablen interagieren können.

## 2. Bildungsinhalte und gamifiziertes Lernen 🎮

Verwandlung der "Räume" in aktive Lernerfahrungen.

*   **Chemie-Escape-Rooms:** Nutzer müssen stöchiometrische Rätsel lösen oder unbekannte Substanzen mithilfe chemischer Tests identifizieren, um den nächsten VR-Raum freizuschalten.
*   **Schnitzjagden:** Finden Sie alle Elemente einer bestimmten Gruppe (z. B. Halogene), die in einer virtuellen Landschaft versteckt sind, um "Element-Abzeichen" zu verdienen.
*   **Geführte Erzählungen:** Stimmengeführte Touren, bei denen ein virtuelles "Marie Curie" oder "Linus Pauling" die Geschichte und Chemie einer bestimmten Ära oder Entdeckung erklärt.

## 3. Ressourcen für Lehrer und Institutionen 📚

Um die Einführung an Schulen und Universitäten zu erhöhen:

*   **Unterrichtsbaupläne:** PDF-Leitfäden für Lehrer, die erklären, wie ein bestimmter VR-Raum in eine 45-minütige Unterrichtsstunde integriert wird.
*   **"Multi-User-Lab"-Tage:** Geplante Sitzungen, bei denen ein Experte/Moderator eine Gruppe von Schülern durch ein komplexes Experiment im Hub führt.
*   **Bewertungstools:** Integration einfacher Quizze im Wiki, die den visuellen Hinweisen in den VR-Hubs entsprechen.

## 4. Technische und barrierefreie Verbesserungen ⚙️

*   **✓ Interaktives Periodensystem 3D (IMPLEMENTIERT):** WebGL-basiertes 3D-Periodensystem mit verschiedenen Ansichten (Tabelle, Kugel, Helix, Gitter). [Jetzt erkunden](/perioden-system-der-elemente/)
*   **✓ Molekülstudio 3D (IMPLEMENTIERT):** Webbasierte Molekülvisualisierung mit Echtzeit-Rendering und interaktiver Steuerung. [Jetzt testen](/molekuel-studio/)
*   **✓ PSE in VR - WebXR (IMPLEMENTIERT):** Browser-basierte VR-Erfahrung mit Desktop- und VR-Headset-Unterstützung. [Jetzt erleben](/pages/pse-in-vr/)
*   **Hybrides Lernen (WebGL):** Sicherstellen, dass jeder VR-Raum einen leistungsstarken "2D/Browser"-Modus für Schüler ohne VR-Headsets oder langsame Verbindungen bietet.
*   **Wiki-Erweiterung:** Das Wiki sollte als "Lehrbuch" zum "Labor" des Hubs dienen. Jedes VR-Experiment sollte einen entsprechenden vertiefenden Artikel haben, der die Mathematik und Theorie dahinter erklärt.

## 5. Erweiterte Berechner & Werkzeuge 🔬 (ABGESCHLOSSEN ✅)

**ALLE RECHNER IMPLEMENTIERT - Januar 2026**

Die Suite an erweiterten chemischen Rechnern ist jetzt vollständig verfügbar:

*   **✓ Löslichkeitsprodukt-Rechner (IMPLEMENTIERT):** Berechnung von Ksp-Werten, Lösunglichkeit und Fällungsreaktionen. Unterstützt 25+ häufige Salze mit automatischer Stöchiometrie-Erkennung. [Jetzt berechnen](/loeslichkeitsprodukt-rechner/)
*   **✓ Redox-Potenzial-Rechner (IMPLEMENTIERT):** Bestimmung von Zellspannungen, Gibbs-Energie (ΔG°) und Gleichgewichtskonstanten (K). Nernst-Gleichung für Nicht-Standard-Bedingungen. [Jetzt berechnen](/redox-potenzial-rechner/)
*   **✓ Konzentrationsumrechner (IMPLEMENTIERT):** Umrechnung zwischen 11 verschiedenen Konzentrationseinheiten (Molar, Molal, % w/w, % v/v, % w/v, ppm, ppb, g/L, mg/L, Molenbruch, Normalität). [Jetzt umrechnen](/konzentrationsumrechner/)
*   **✓ Verbrennungsrechner (IMPLEMENTIERT):** Vollständige Analyse von Verbrennungsreaktionen mit Luftbedarf, Abgaszusammensetzung, CO₂-Emissionen und Energiegehalt (Heizwert/Brennwert). Unterstützt C, H, O, N, S-haltige Verbindungen. [Jetzt analysieren](/verbrennungsrechner/)
*   **✓ Titrationssimulator (IMPLEMENTIERT):** Interaktive Simulation von Säure-Base-Titrationen mit Echtzeit-pH-Berechnung, visueller Kurvenzeichnung (Chart.js) und Äquivalenzpunkt-Bestimmung. Unterstützt starke und schwache Elektrolyte. [Jetzt simulieren](/titrations-simulator/)
*   **✓ Gasesetz-Rechner (IMPLEMENTIERT):** Kombinierte Berechnungen mit Idealem Gasgesetz (pV=nRT), Boyle-Mariotte (p₁V₁=p₂V₂), Gay-Lussac (V/T, p/T) und Kombiniertem Gasgesetz (p₁V₁/T₁=p₂V₂/T₂). Umfassende Einheitenumrechnungen. [Jetzt berechnen](/gasgesetz-rechner/)

**Implementierungsumfang:**
- 6 vollständige Berechner mit deutschsprachiger Oberfläche
- Responsive Design für Desktop und Mobile
- Umfassende Educational Content Sections mit Theorie, Beispielen und Anwendungstabellen
- Interaktive Beispiele und Quick-Buttons
- Farbcodierte Ergebnisse und Visualisierungen
- Alle 299 Tests bestanden ✅
- ESLint-konformer Code
- Insgesamt über 4.100 Zeilen Code

## 6. Community & Zusammenarbeit 🤝

*   **Benutzergenerierte Hubs:** Fortgeschrittene Schüler oder Lehrer können ihre eigenen Hub-Layouts oder experimentellen Aufstellungen einreichen.
*   **Forschungsblog:** Regelmäßige Updates zum "Status Quo" des Projekts, teilen Sie Erkenntnisse darüber, wie VR die Behaltensrate von Chemiestudenten im Vergleich zu herkömmlichen Methoden beeinflusst.
