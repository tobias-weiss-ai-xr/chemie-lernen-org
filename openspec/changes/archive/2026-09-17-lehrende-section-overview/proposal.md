# Proposal: Lehrende-Section-Überblick (Lehrer-Hub)

## Problem Statement

Nutzer:innen, die in der Navigation auf **„Lehrende“** klicken, landeten bislang
auf einer rohen Sektion mit schweren, unstrukturierten Content-Blöcken (frei
stehende Tabellen, Arbeitsblätter, Bewertungsmatrizen) ohne Navigationseinstieg.
Zudem war das Menü-**Label „Lehrende“** ein reiner Dropdown-Toggle (`href="#"`):
Ein Klick auf den Namen öffnete nur das Submenü, konnte aber nicht die Sektion
selbst aufrufen — inkonsistent zu den meisten anderen Hauptmenüpunkten und
damit eine UX-Falle für Lehrkräfte.

## Goals

1. Eine **Übersichts-/Hub-Seite unter `/lehrende/`** erstellen, die erscheint,
   wenn man in der Navigation auf „Lehrende“ klickt.
2. Die Lehrende-Section **inhaltlich überarbeiten**: schwere Inline-Blöcke aus
   dem Index in die passenden Subsections **relokalisieren** (nichts löschen).
3. Die Navigation so ändern, dass das Label „Lehrende“ zur Sektion navigiert
   und ein separates **Caret** das Submenü öffnet (Split-Dropdown).
4. Kontrast-AA/AAA in Light-, Dark- und Contrast-Theme der neuen Cards
   sicherstellen.

## Non-Goals

- Kein neues `section.html`-Layout (nutzt dediziertes `_default/lehrende.html`).
- Keine Änderung der bereits fehlenden `[data-theme=contrast]`-Zwillinge.
- Keine neuen Rechner/Simulatoren — nur kuratierte Verlinkung bestehender Instrumente.
