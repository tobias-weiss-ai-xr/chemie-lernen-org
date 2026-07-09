# Bewerbung Lehre@Philipp 2026 – Kategorie 1: Innovative Lehrideen

**Titel:** chemie-lernen.org – KI-gestützte, interaktive und offene Lernplattform für die Chemie

**Einreichende Person:** Tobias Weiss, Hochschulrechenzentrum (HRZ), Philipps-Universität Marburg

---

## 1. Entwicklungsbedarf (2.881 / 3.000 Zeichen)

Die Chemieausbildung steht vor strukturellen Herausforderungen: Chemische Konzepte wie Molekülgeometrie, Orbitaltheorie, Reaktionskinetik oder Elektrochemie operieren auf einer für Lernende nicht direkt beobachtbaren, submikroskopischen Ebene. Gleichzeitig fehlt es an digitalen Lernressourcen, die (1) wissenschaftlich fundiert, (2) interaktiv und multimodal, (3) kostenfrei und offen zugänglich (OER) sowie (4) datenschutzkonform und werbefrei sind. Kommerzielle Lernplattformen sind oft teuer, intransparent und nicht anpassbar; rein textbasierte Open-Access-Angebote bleiben hinter den didaktischen Möglichkeiten digitaler Medien zurück.

**chemie-lernen.org** schließt diese Lücke durch eine innovative, modular aufgebaute Lernplattform, die erstmals mehrere neuartige Technologien in einem kohärenten didaktischen Rahmen vereint:

- **Interaktive 3D-Visualisierungen:** Moleküle, Orbitale und das Periodensystem werden mittels Three.js als dreidimensionale, dreh- und zoombare Lernobjekte erlebbar. Geplant ist die Erweiterung zu begehbaren WebXR-Lernräumen – ein innovativer Ansatz im deutschsprachigen Chemieunterricht.
- **KI-Assistent mit Knowledge Graph:** Ein auf Large Language Models basierender Chatbot (Gemma, betrieben über LiteLLM) beantwortet Chemiefragen in natürlicher Sprache, gestützt auf einen Neo4j-Wissensgraphen mit über 54 chemischen Entitäten. Die Kombination aus generativer KI und strukturiertem Fachwissen ermöglicht kontextbezogene, quellenfundierte Antworten.
- **Adaptive Gamification & Learning Analytics:** Ein XP-basiertes Levelsystem mit 10 Stufen, Achievements und personalisierten Lernpfaden fördert die intrinsische Motivation. Das Klassencockpit gibt Lehrenden Einblick in den Fortschritt ihrer Lerngruppen.
- **Vollständiges OER-Ökosystem:** Die Plattform ist als Open Source (MIT-Lizenz) auf GitHub veröffentlicht, werbefrei und als Progressive Web App (PWA) offline nutzbar. Sämtliche Inhalte, Rechner, Simulationen und Visualisierungen sind kostenfrei – ohne Registrierung, ohne Tracking.

Was die Lehridee vom bisherigen Vorgehen unterscheidet, ist ihr **ganzheitlicher Ansatz**: Statt isolierter Einzeltools entsteht ein vernetztes Ökosystem, in dem sich interaktive Rechner (pH, Stöchiometrie, Titration, Gasgesetze etc.), Simulationen (Reaktionskinetik, Spektroskopie, Gasgesetze), 3D-Visualisierungen, ein KI-Assistent und ein Wissensnetz gegenseitig ergänzen. Die Lerninhalte sind nach 12 Themenbereichen und 9 Klassenstufen (5–13) strukturiert, mit über 20 Rechnern, 4 Simulationen, 7 Visualisierungen und über 1.500 automatisierten Tests auf einem professionellen CI/CD-Niveau.

Die Plattform adressiert damit nicht nur den Bedarf an modernen, digital gestützten Lernformen, sondern liefert eine **produktiv einsetzbare, sofort verfügbare Infrastruktur**, die sich nahtlos in die bestehende Hochschullehre integrieren lässt.

---

## 2. Curriculare Verankerung (2.950 / 3.000 Zeichen)

**chemie-lernen.org** ist als fächerübergreifende, curriculare Ergänzung für die Chemieausbildung an der Philipps-Universität Marburg und darüber hinaus konzipiert. Die Plattform deckt inhaltlich die Themenbereiche der gymnasialen Oberstufe (Sekundarstufe I und II) sowie grundständiger Chemiemodule im Hochschulbereich ab – von Atombau, chemischen Bindungen und dem Periodensystem über Säuren und Basen, Redoxreaktionen und Elektrochemie bis zu Energetik, Reaktionskinetik und organischen Stoffklassen.

**Konkrete Anknüpfungspunkte an die Lehre der UMR:**

1. **Einsatz in der Lehramtsausbildung Chemie:** Die Plattform kann in den fachdidaktischen Seminaren des Fachbereichs Chemie eingesetzt werden, um angehenden Lehrkräften den Umgang mit digitalen, interaktiven Lernmedien zu vermitteln. Die nach Mayers Prinzipien des multimedialen Lernens gestalteten Materialien dienen als Best-Practice-Beispiele für die Gestaltung digital gestützten Chemieunterrichts.

2. **Brückenkurs Chemie:** Für Studienanfänger\*innen der Chemie, Pharmazie, Biologie und Medizin bietet die Plattform einen strukturierten, selbstgesteuerten Einstieg in die chemischen Grundlagen – mit integrierten Lernpfaden, Quizzen und Fortschrittskontrolle. Der KI-Assistent fungiert als persönlicher Tutor, der Verständnisfragen in Echtzeit beantwortet.

3. **Ergänzung zu Grundvorlesungen:** In Vorlesungen der Allgemeinen und Anorganischen Chemie können die interaktiven 3D-Visualisierungen (Molekülstudio, Molekülorbitale, Periodische Trends) und Simulationen (Titration, Reaktionskinetik, Spektroskopie) als anschauliche Ergänzung zum Frontalvortrag eingesetzt werden. Studierende können die Konzepte im Selbststudium weiter vertiefen.

4. **Praktikumsvorbereitung:** Der Titrationssimulator, die Redox-Titrationen und der Gefahrstoff-Explorer bereiten Studierende gezielt auf die Durchführung von Laborpraktika vor – risikofrei und wiederholbar.

**Mehrwert durch die Lehridee:**

- **Multimodales Lernen:** Komplexe chemische Konzepte werden auf mehreren Ebenen zugänglich gemacht – (a) textuell (theoretische Einführung), (b) interaktiv-formelhaft (Rechner, Gleichungen), (c) visuell-räumlich (3D-Modelle, Animationen). Dies adressiert unterschiedliche Lernstile und reduziert kognitive Belastung durch das Split-Attention-Prinzip.
- **Selbstgesteuertes Lernen:** Lernpfade, Fortschrittstracking und Gamification ermöglichen ein individualisiertes Lerntempo mit unmittelbarem Feedback.
- **Dozentenentlastung:** Übungsgenerator, Lückentexte, Arbeitsblattgenerator und Aufgabensammlung automatisieren die Erstellung von Übungsmaterialien. Das Klassencockpit visualisiert den Lernstand lokaler Lerngruppen auf einen Blick.
- **Barrierefreiheit:** Die Plattform ist als PWA mit Offline-Modus, Tastaturnavigation, ARIA-Labels und Screenreader-Support bewusst barrierearm gestaltet. Ein geplantes WCAG-2.1-AA-Audit wird die Barrierefreiheit auf ein vollständiges Niveau heben.

---

## 3. Nachhaltigkeit und Transferpotenzial (1.626 / 2.000 Zeichen)

**Nachhaltigkeit:**

- **Open Source (MIT-Lizenz):** Der gesamte Quellcode ist auf GitHub öffentlich, forkbar und weiterentwickelbar. Vendor-Lock-in ausgeschlossen.
- **Statische Architektur:** Hugo-basiert, Auslieferung als reines HTML/JS/CSS ohne serverseitige DB-Abhängigkeit – minimale Betriebskosten, hohe Ausfallsicherheit.
- **PWA & Offline:** Inhalte dauerhaft offline verfügbar, auch bei schwacher Internetanbindung.
- **CI/CD:** Über 1.500 Unit-Tests und 330 E2E-Tests sichern dauerhafte Funktionsfähigkeit.

**Transferpotenzial:**

- **Fachübergreifend:** Der technische Aufbau (Hugo + interaktive JS-Module + PWA) ist fachunabhängig und direkt auf Physik, Biologie oder Mathematik übertragbar.
- **Curriculare Skalierung:** Modular aufgebaute Themenbereiche – neue Inhalte werden als Markdown-Dateien ergänzt, Rechner und Simulationen sind wiederverwendbare Webkomponenten.
- **Wissensnetz:** Der Neo4j-Graph ist auf andere Domänen übertragbar, über Entity-Detailseiten und D3.js-Visualisierung erschließbar.
- **Offene Bildungsressourcen:** Die Materialien können von anderen Hochschulen und Schulen übernommen und angepasst werden. Eine Übertragung auf andere Fachbereiche der UMR (Medizin, Pharmazie, Biologie) ist explizit erwünscht.
- **Didaktisches Transfermodell:** Das integrierte Gamification-Konzept mit XP-System, personalisierten Lernpfaden und Learning Analytics ist als didaktisches Framework auf andere Fachkontexte übertragbar. Der KI-Assistent demonstriert, wie generative KI mit strukturierten Wissensgraphen verbunden werden kann – ein Ansatz, der auch für andere Disziplinen modellhaft wirkt.

---

## 4. Überprüfung der Zielerreichung (1.238 / 2.000 Zeichen)

Die Wirksamkeit wird auf mehreren Ebenen gemessen:

**1. Nutzungsmetriken (quantitativ):** Anonymisierte Daten zu Seitenaufrufen, Rechnernutzung, Quizdurchläufen und KI-Assistent-Anfragen werden über ein datenschutzkonformes Analytics-Dashboard ausgewertet. Indikatoren: aktive Nutzer\*innen/Monat, absolvierte Quizze, generierte Übungsblätter, Verweildauer.

**2. Lernfortschritt:** Prä-/Post-Test-Design mit Wissensabfragen vor und nach Modulnutzung. Vergleichsgruppen-Design (Plattform vs. traditionelle Materialien). Das Gamification-System liefert Daten zu XP-Entwicklung und erreichten Levels als Indikatoren für kontinuierliche Beschäftigung.

**3. Qualitative Evaluation:** Regelmäßige Befragung von Dozierenden über das Klassencockpit; optionale Kurzumfragen zur User Experience (System Usability Scale) und wahrgenommenen Lernwirksamkeit; leitfadengestützte Interviews mit ausgewählten Nutzergruppen.

**4. Technische Qualitätssicherung:** Über 1.500 automatisierte Unit-Tests und 330 E2E-Tests über 3 Browser (Chromium, Firefox, WebKit) bei jeder Änderung. Performance-Budget-Überwachung und regelmäßige Accessibility-Audits (axe-core).

Die Ergebnisse werden jährlich in einem transparenten Evaluationsbericht veröffentlicht.

---

## 5. Unterstützung aus anderen Quellen (797 / 1.000 Zeichen)

Die Plattform **chemie-lernen.org** wird aktuell aus Eigenmitteln betrieben und entwickelt. Es bestehen keine Förderungen aus Drittmitteln, Preisen oder anderen öffentlichen Programmen. Die Infrastruktur (Server, Domains) wird privat finanziert; die LLM-API-Kosten für den KI-Assistenten werden aus den Betriebsmitteln gedeckt.

Eine Unterstützung erfolgt derzeit ausschließlich über freiwillige Spenden (Liberapay, Patreon), jedoch ohne nennenswerte regelmäßige Einnahmen.

Eine Förderung durch Lehre@Philipp wäre die **erste öffentliche Förderung** der Plattform und würde gezielt für den Ausbau der curricularen Integration an der Philipps-Universität Marburg, die Entwicklung neuer 3D-Lernräume, die Verbesserung der Barrierefreiheit und die Erstellung zusätzlicher Inhalte verwendet werden.

---

## 6. Weitere Bemerkungen (965 / 1.000 Zeichen)

**chemie-lernen.org** ist kein Konzeptpapier – die Plattform ist **produktiv im Einsatz** und unter https://chemie-lernen.org/ frei zugänglich. Alle beschriebenen Module sind live: 12 Themenbereiche, über 20 interaktive Rechner, 4 Simulationen, 3D-Visualisierungen (Three.js), der KI-Assistent mit Knowledge-Graph-Anbindung (Neo4j), Gamification-System, PWA-Offline-Modus und das Klassencockpit für Lehrende.

Die technische Infrastruktur (CI/CD, automatisiertes Deployment, Docker-Container) ist vollständig dokumentiert und reproduzierbar. Der gesamte Quellcode ist auf GitHub unter MIT-Lizenz veröffentlicht.

Die Plattform wird kontinuierlich weiterentwickelt (letztes Update: Juni 2026). Die Roadmap sieht für Q3/Q4 2026 die Vertiefung des KI-Assistenten, die Erweiterung der Themenbereiche auf 3–5 Artikel pro Bereich und die Verbesserung der Barrierefreiheit (WCAG 2.1 AA) vor – alles Bereiche, die durch die Förderung deutlich beschleunigt werden könnten.

---

## 7. Arbeits- und Kostenplan

### 7.1 Arbeitsplan (12 Monate)

| Phase | Zeitraum   | Aktivität                    | Arbeitspakete                                                                                                                                               |
| ----- | ---------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Monat 1–2  | Bestandsaufnahme & Planung   | Detaillierte Anforderungsanalyse mit Fachbereich Chemie; Identifikation von Pilotveranstaltungen; Festlegung der Evaluationskriterien                       |
| **2** | Monat 2–4  | Curriculare Integration      | Erstellung von 10 neuen vertiefenden Artikeln zu curricularen Schwerpunkten; Entwicklung von 5 neuen Übungssets; Konzeption der ILIAS/Moodle-Anbindung      |
| **3** | Monat 3–6  | 3D-Lernräume                 | Entwicklung von 3 neuen immersiven 3D-Lernräumen (Subatomare Reisen, Molekülgalerie, Gefahrfreies Labor) auf Basis von Three.js/WebXR                       |
| **4** | Monat 4–7  | KI-Assistent-Ausbau          | Deepening des KI-Assistenten mit adaptiven Lernpfad-Empfehlungen; Integration von Quellenangaben aus dem Wissensnetz; multilingualen Ausbau (DE/EN)         |
| **5** | Monat 5–8  | Barrierefreiheit & Inklusion | WCAG 2.1 AA-Audit und vollständige Überarbeitung aller interaktiven Komponenten; Erstellung barrierefreier Alternativtexte für 3D-Visualisierungen          |
| **6** | Monat 6–10 | Pilotphase                   | Einsatz in 2–3 Lehrveranstaltungen des Fachbereichs Chemie; begleitende Evaluation (Prä/Post-Tests, SUS-Befragungen, Interviews)                            |
| **7** | Monat 8–12 | Evaluation & Verstetigung    | Auswertung der Pilotevaluation; Erstellung des Evaluationsberichts; Überführung in dauerhaftes Angebot; Vorbereitung der Ausweitung auf andere Fachbereiche |

### 7.2 Kostenplan

| Pos.  | Beschreibung                                              |     Menge | Einzelpreis |          Gesamt |
| ----- | --------------------------------------------------------- | --------: | ----------: | --------------: |
| **1** | **Studentische Hilfskräfte**                              |           |             |  **8.700,00 €** |
| 1.1   | SHK – Inhaltserstellung (8 h/Woche × 12 Monate)           |     384 h |     15,00 € |      5.760,00 € |
| 1.2   | SHK – 3D/WebXR-Entwicklung (8 h/Woche × 6 Monate)         |     192 h |     15,00 € |      2.880,00 € |
| 1.3   | SHK – Barrierefreiheit & Testing (4 h/Woche × 6 Monate)   |      96 h |     15,00 € |      1.440,00 € |
|       | _Zwischensumme (abzgl. Puffer)_                           |           |             |    _8.700,00 €_ |
| **2** | **Infrastruktur & Betrieb**                               |           |             |  **2.400,00 €** |
| 2.1   | Server & Hosting                                          | 12 Monate |     20,00 € |        240,00 € |
| 2.2   | LLM-API-Kosten (KI-Assistent)                             | 12 Monate |     50,00 € |        600,00 € |
| 2.3   | Domain & SSL                                              |    1 Jahr |     10,00 € |         10,00 € |
| 2.4   | CDN & Optimierung (BunnyCDN)                              | 12 Monate |     30,00 € |        360,00 € |
| 2.5   | WebXR-Hosting & 3D-Infrastruktur                          | 12 Monate |    100,00 € |      1.200,00 € |
|       | _Zwischensumme Infrastruktur_                             |           |             |    _2.400,00 €_ |
| **3** | **Geräte & Software**                                     |           |             |  **2.800,00 €** |
| 3.1   | VR-Headset (Meta Quest 3) für Entwicklung & Test          |    1 Stk. |    450,00 € |        450,00 € |
| 3.2   | Barrierefreiheit-Test-Suite (Screenreader, Testendgeräte) |    1 Satz |    600,00 € |        600,00 € |
| 3.3   | 3D-Modell-Lizenzen (Science-Modelle für VR-Räume)         |    1 Satz |    500,00 € |        500,00 € |
| 3.4   | Grafiktablet & Peripherie für Inhaltserstellung           |    1 Satz |    300,00 € |        300,00 € |
| 3.5   | Sprachsynthese/Spracherkennung (Accessibility-Lizenzen)   |    1 Satz |    450,00 € |        450,00 € |
| 3.6   | Reserve für unvorhergesehene Lizenzkosten                 |   1 Psch. |    500,00 € |        500,00 € |
|       | _Zwischensumme Geräte & Software_                         |           |             |    _2.800,00 €_ |
| **4** | **Öffentlichkeitsarbeit & Transfer**                      |           |             |    **900,00 €** |
| 4.1   | Druck Lehrmaterialien und Flyer                           |   1 Psch. |    300,00 € |        300,00 € |
| 4.2   | Workshop/Schulung für Lehrende (Raummiete, Catering)      |   1 Psch. |    400,00 € |        400,00 € |
| 4.3   | Tagungsbeitrag (Tag der Lehre, GDCP-Tagung)               |   1 Psch. |    200,00 € |        200,00 € |
|       | _Zwischensumme Öffentlichkeitsarbeit_                     |           |             |      _900,00 €_ |
|       | **Gesamtsumme (netto)**                                   |           |             | **14.800,00 €** |
|       | Förderhöchstbetrag                                        |           |             |     15.000,00 € |
|       | **Differenz zum Höchstbetrag**                            |           |             |    **200,00 €** |

### 7.3 Begründung der Mittelverwendung

Die beantragten Mittel in Höhe von 14.800,00 € verteilen sich auf vier Bereiche:

**1. Studentische Hilfskräfte (8.700 € / 59 %):** Den größten Anteil bilden studentische Hilfskräfte. Eine SHK erstellt über 12 Monate vertiefende curriculare Inhalte und Übungsmaterialien. Eine zweite SHK entwickelt über 6 Monate neue 3D-Lernräume (Three.js/WebXR). Eine dritte SHK kümmert sich über 6 Monate um Barrierefreiheit und Testautomatisierung. Alle SHKs arbeiten unter fachlicher Anleitung und sammeln wertvolle Erfahrungen in der digitalen Hochschullehre.

**2. Infrastruktur & Betrieb (2.400 € / 16 %):** Die Plattform basiert auf einer effizienten statischen Hugo-Architektur, daher sind die Serverkosten niedrig. Der größte Infrastrukturposten ist das Hosting für 3D/WebXR-Lernräume. Die LLM-API-Kosten decken den Betrieb des KI-Assistenten.

**3. Geräte & Software (2.800 € / 19 %):** Ein VR-Headset (Meta Quest 3) wird für die Entwicklung und das Testen immersiver Lernerfahrungen benötigt. Testgeräte und -software für die Barrierefreiheit stellen sicher, dass die Plattform WCAG 2.1 AA-Standards erfüllt. 3D-Modell-Lizenzen erweitern die Visualisierungsbibliothek.

**4. Öffentlichkeitsarbeit & Transfer (900 € / 6 %):** Workshops für Lehrende der UMR, gedruckte Begleitmaterialien sowie die Vorstellung der Ergebnisse auf dem Tag der Lehre und Fachtagungen (z. B. GDCP) stellen die Bekanntheit und nachhaltige Verankerung der Plattform sicher.

**Gesamtsumme:** 14.800,00 € (unter dem Förderhöchstbetrag von 15.000,00 €)
