---
title: 'Lernräume in Mozilla Hubs'
description: 'Wie 3D-Lernräume in Mozilla Hubs den Chemieunterricht ergänzen — Konzept, Beispiele und Einstieg in hubs.chemie-lernen.org'
date: 2026-06-26
last_reviewed: 2026-07-09
tags: ['3d', 'webxr', 'hubs', 'lernräume', 'virtual-reality']
menu:
  main:
    parent: 'mehr'
    weight: 220
---

Chemie ist eine dreidimensionale Wissenschaft — Moleküle, Kristallgitter,
Reaktionsmechanismen lassen sich nur schwer in Fließtext und 2D-Diagrammen
vermitteln. **Lernräume in [Mozilla Hubs][hubs]** schaffen einen gemeinsamen
3D-Raum, in dem Lehrkräfte und Lernende Molekülmodelle, Periodensysteme oder
ganze Experimentieraufbauten räumlich erleben, gemeinsam betrachten und
diskutieren können.

[hubs]: https://hubs.chemie-lernen.org/

![Gemeinsamer 3D-Lernraum in Mozilla Hubs: Avatare um ein Molekülmodell, Periodensystem-Wand, Audio- und Chat-Chips](/img/hubs-lernraum-cover.svg){width="100%"}

> **Direkt loslegen:** [Raum erstellen auf hubs.chemie-lernen.org](https://hubs.chemie-lernen.org/) — kein Account, kein Download, läuft direkt im Browser.

**Ein Raum pro Element:** Über [Chemie Räume](/chemie-raeume/) erreicht ihr für
jedas Element des Periodensystems einen eigenen, thematisch gefärbten
3D-Lernraum (Atommodell, Inhalte, Partikel). Den gleichen Raum könnt ihr für
den Klassenverband auch in Hubs öffnen — siehe unten „Elementräume in Hubs".

## Was sind Lernräume in Hubs?

[Mozilla Hubs][hubs] ist eine offene, browserbasierte Plattform für soziale
3D-Räume. Lehrkräfte und Lernende betreten dieselbe Szene über einen Link —
kein Account, keine Installation. Innerhalb des Raumes lassen sich Avatare
bewegen, Objekte platzieren, gemeinsam Notizen an die Wand heften, Medien
( Bilder, PDFs, 3D-Modelle, Videos ) einblenden und per Sprachchat austauschen.

Für den Chemieunterricht ergeben sich daraus vier didaktische Muster:

| Muster                    | Beschreibung                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gemeinsames 3D-Modell** | Lehrkraft baut ein Molekül (z. B. Ethan, Glucose, Aspirin) aus `.glb`-Bausteinen. SuS betreten den Raum, drehen das Modell mit der Maus, benennen funktionelle Gruppen. |
| **Periodensystem-Wand**   | Periodensystem wird als interaktive 2D-Textur an die Wand geheftet. Beim Klick auf ein Element erscheinen atomare Daten, ein Bohr-Modell und ein Quiz-Popup.            |
| **Reaktions-Timeline**    | Schritt-für-Schritt-Aufbau einer Reaktion: Edukte links, Übergangszustand mittig, Produkte rechts. SuS bewegen Token, ordnen Zwischenprodukte zu.                       |
| **Labor-Szene**           | Nachbau eines Versuchsaufbaus (Destillation, Titration). SuS gehen virtuell durch den Aufbau, lesen Erklärtexte, sehen Sicherheitshinweise.                             |

## Wie passt das zu chemie-lernen.org?

Die bestehenden 3D-Werkzeuge — [Molekül-Studio][ms], [Periodensystem VR][pse],
[Bindungspotential][bp] — sind **Einzelspieler-Modi**: jede:r sieht das Modell
alleine. Lernräume in Hubs ergänzen diese Werkzeuge um die **Mehrspieler- und
Präsenz-Dimension**. Konkret:

- **Molekül-Studio** bleibt das tiefe Solo-Werkzeug für Konstruktion und
  Animation. Der Lernraum wird genutzt, um das fertige Modell **gemeinsam zu
  besprechen**.
- **KI-Assistent** kann als „Assistenten-Avatar" im Raum auftauchen und
  kontextbezogene Fragen beantworten (geplant für Q3 2026).
- **Quiz und Lückentexte** lassen sich als 3D-Würfel im Raum spawnen, deren
  Seiten die Antwortmöglichkeiten zeigen.

[ms]: /molekuel-studio/
[pse]: /perioden-system-der-elemente/
[bp]: /bindungspotential/

## hubs.chemie-lernen.org — der eigene Lernraum

Unter [hubs.chemie-lernen.org][hubs] läuft eine selbst gehostete Instanz von
Mozilla Hubs, optimiert für den Chemieunterricht:

- **Offen** — kein Account, keine Datenkrümel an Mozilla
- **Selbst gehostet** — Server in Deutschland, DSGVO-konform
- **Asset-Bibliothek** — vorbereitete 3D-Modelle für die häufigsten
  Schulstoff-Moleküle
- **Sicher** — Standard-Privatsphäre-Einstellungen, Jugendschutz-Modus

### Erste Schritte

1. Browser öffnen und [hubs.chemie-lernen.org][hubs] aufrufen
2. Auf **„Raum erstellen"** klicken — es wird ein persönlicher Lernraum-Link
   generiert
3. Link mit Lernenden teilen (z. B. über die Klassenraum-Pinnwand)
4. Im Raum: **Objekte spawnen**, Medien per Drag-and-drop ablegen, Avatare
   bewegen, Mikrofon und Kamera freigeben
5. Optional: **Szenen aus [Spoke][spoke]** (Hubs' Szenen-Editor) importieren
   — vorbereitete Chemie-Lab-Szenen sind im Asset-Browser verlinkt

[spoke]: https://hubs.chemie-lernen.org/spoke

## Didaktische Tipps

- **Kurze Einheiten**: 15-25 Minuten im Lernraum reichen. Längere
  VR-Sessions ermüden.
- **Anker setzen**: Lehrkraft benennt das Ziel zu Beginn („Wir schauen uns
  heute die Bindungswinkel im Methan an") und fasst am Ende zusammen.
- **Auffangplan**: 3-5 SuS ohne stabile Internetverbindung sollten das
  Modell parallel am Tablet oder über das [Molekül-Studio][ms] aufrufen können.
- **Barrierefreiheit**: Hubs bietet Maus- und Tastatur-Steuerung; SuS mit
  motion-sickness können über das Burger-Menü Animationen abschalten
  (`prefers-reduced-motion` wird respektiert).

## Bekannte Einschränkungen

- **Mobile Endgeräte** rendern die Hubs-Szene weniger flüssig — Tablets ab
  iPad 5 / Android 9 funktionieren, ältere Geräte nicht.
- **VR-Headsets** (Meta Quest, Apple Vision Pro) werden voll unterstützt;
  ein einfaches Cardboard funktioniert nur eingeschränkt.
- **Bandbreite**: Pro Person ca. 2-3 Mbit/s Upload empfohlen.

## Status & Roadmap

Die Hubs-Instanz befindet sich aktuell im **Beta-Betrieb**. Geplant:

| Sprint  | Feature                                             |
| ------- | --------------------------------------------------- |
| Q3 2026 | Asset-Bibliothek mit 30 Standard-Molekülen          |
| Q3 2026 | KI-Assistent-Avatar mit Bezug zum aktuellen Molekül |
| Q4 2026 | Quiz-Cubes (3D-Würfel mit Aufgaben)                 |
| Q4 2026 | Lehrer-Dashboard mit Anwesenheit und Time-on-Task   |

Status-Updates laufen im [Plattform-Status][status] und im
[Roadmap-Dokument][roadmap].

[status]: /pages/status/
[roadmap]: /pages/roadmap/

## Quellen & weiterführende Links

- [Mozilla Hubs — Offizielle Dokumentation](https://hubs.mozilla.com/docs)
- [WebXR-Spezifikation](https://www.w3.org/TR/webxr/)
- [Spoke — Szenen-Editor für Hubs](https://hubs.mozilla.com/spoke)
- [chemie-lernen.org: Molekül-Studio](/molekuel-studio/)
- [chemie-lernen.org: Periodensystem VR](/perioden-system-der-elemente/)

---

> **Mitmachen**: Wenn Sie als Lehrkraft eine Lernraum-Szene für ein
> bestimmtes Thema beitragen möchten, öffnen Sie ein Issue im
> [GitHub-Repository][repo] oder schreiben Sie an
> [`lernraum@chemie-lernen.org`](mailto:lernraum@chemie-lernen.org).

[repo]: https://github.com/tobias-weiss-ai-xr/chemie-lernen-org
