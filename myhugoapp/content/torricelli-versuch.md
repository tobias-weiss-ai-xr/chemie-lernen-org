---
title: 'Torricelli-Versuch - Atmosphärischer Druck'
date: 2026-01-04
description: 'Entdecken Sie Torricellis historisches Experiment zur Messung des Luftdrucks mit interaktiver Simulation'
tags: ['druck', 'atmosphaere', 'experiment', 'gasgesetze', 'geschichte']
---

## Torricelli-Versuch: Die Entdeckung des Luftdrucks

**Evangelista Torricellis (1608-1647) revolutionäres Experiment**

Im Jahr 1643 führte der italienische Physiker Evangelista Torricelli ein Experiment durch, das die Existenz des atmosphärischen Drucks bewies und das erste Barometer erfand.

### 🎯 Das Experiment

Torricelli füllte eine etwa 1 Meter lange Glasröhre mit Quecksilber (Hg), verschloss sie an einem Ende und stellte sie upside-down in ein Quecksilbergefäß.

**Das Ergebnis:**

- Das Quecksilber in der Röhre sank nicht vollständig ab
- Es blieb eine Säule von etwa 76 cm Höhe stehen
- Über dem Quecksilber entstand ein leerer Raum (Vakuum)

```
┌─────────────────┐
│   Vakuum        │  ← "Torricelli-Leere Raum"
├─────────────────┤
│   Hg - Hg - Hg  │  ← Quecksilbersäule (~760 mm)
│   Hg - Hg - Hg  │
├─────────────────┤
│   Hg - Hg - Hg  │  ← Quecksilber im Gefäß
│   Hg - Hg - Hg  │
└─────────────────┘
```

### 💡 Die Erklärung

**Warum fällt das Quecksilber nicht vollständig?**

Der atmosphärische Druck drückt auf die Oberfläche des Quecksilbers im Gefäß und drückt die Flüssigkeit die Röhre hinauf. Das Gewicht der Quecksilbersäule wird durch den Luftdruck von unten ausgeglichen.

**Gleichgewichtsbedingung:**

$$p_{atm} = p_{Hg} = \rho_{Hg} \cdot g \hbar$$

Dabei ist:

- $p_{atm}$ = Atmosphärischer Druck
- $\rho_{Hg}$ = Dichte des Quecksilbers (13.534 kg/m³)
- $g$ = Erdbeschleunigung (9.81 m/s²)
- $\hbar$ = Höhe der Quecksilbersäule

### 🌍 Verschiedene Planeten

Was würde mit einem Quecksilberbarometer auf anderen Planeten passieren?

| Planet  | Gravitation (m/s²) | Quecksilbersäule |
| ------- | ------------------ | ---------------- |
| Erde    | 9.81               | ~760 mm          |
| Mond    | 1.62               | ~120 mm          |
| Mars    | 3.71               | ~280 mm          |
| Venus   | 8.87               | ~690 mm          |
| Jupiter | 24.79              | ~1.920 mm        |
| Merkur  | 3.7                | ~280 mm          |

_Hinweis: Diese Werte nehmen an, dass die Atmosphäre ähnlich zusammengesetzt ist und dieselbe Temperatur herrscht._

### 🔬 Interaktive Simulation

<div class="torricelli-simulator">
  <div class="simulation-container">
    <canvas id="torricelliCanvas"></canvas>

    <div class="controls">
      <h3>Simulationseinstellungen</h3>

      <div class="control-group">
        <label for="planetSelect">Planet wählen:</label>
        <select id="planetSelect">
          <option value="earth">🌍 Erde</option>
          <option value="moon">🌑 Mond</option>
          <option value="mars">🔴 Mars</option>
          <option value="venus">🟡 Venus</option>
          <option value="mercury">⚫ Merkur</option>
          <option value="jupiter">🟤 Jupiter</option>
        </select>
      </div>

      <div class="control-group">
        <label for="atmosphericPressure">Atmosphärischer Druck (hPa):</label>
        <input type="range" id="atmosphericPressure" min="800" max="1100" value="1013" step="1">
        <span id="pressureValue">1013 hPa</span>
      </div>

      <div class="info-panel">
        <h4>Ergebnisse</h4>
        <div class="result-item">
          <span>Quecksilbersäule:</span>
          <span id="mercuryHeight" class="result-value">760 mm</span>
        </div>
        <div class="result-item">
          <span>Druck in mmHg:</span>
          <span id="pressureMmHg" class="result-value">760 mmHg</span>
        </div>
        <div class="result-item">
          <span>Druck in Pascal:</span>
          <span id="pressurePa" class="result-value">101.325 kPa</span>
        </div>
      </div>
    </div>

  </div>

  <div class="explanation">
    <h3>Hintergrundwissen</h3>
    <p><strong>Normale Bedingungen:</strong> Bei einem atmosphärischen Druck von 1013 hPa (Normaldruck) beträgt die Höhe der Quecksilbersäule exakt 760 mm. Deshalb wird Druck oft in "mmHg" (Millimeter Quecksilbersäule) angegeben.</p>

    <p><strong>Historische Bedeutung:</strong> Dieses Experiment war der erste Nachweis, dass Luft Gewicht hat und Druck ausübt. Es widerlegte die damals vorherrschende Meinung, dass die Natur "leere Räume hasse" (horror vacui).</p>

    <p><strong>Anwendungen heute:</strong> Moderne Barometer verwenden meist Quecksilber aus Umweltgründen nicht mehr, aber das Prinzip bleibt gleich. Präzise Druckmessungen verwenden oft digitale Sensoren, basieren aber auf demselben physikalischen Prinzip.</p>

  </div>
</div>

### 📚 Weiterführende Themen

- [Gasgesetz-Rechner](/gasgesetz-rechner/) - Berechnen Sie verschiedene Gasgesetze
- [Druck-Einheiten umrechnen](/einheitenumrechner/) - Konvertieren Sie verschiedene Druckeinheiten
- [Boyle-Mariotte Gesetz](/gasgesetz-rechner/) - Zusammenhang zwischen Druck und Volumen

<style>
.torricelli-simulator {
  margin: 30px 0;
}

.simulation-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

#torricelliCanvas {
  background: white;
  border-radius: 8px;
  display: block;
  margin: 0 auto 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.controls {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 20px;
  color: #333;
}

.control-group {
  margin-bottom: 20px;
}

.control-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #667eea;
}

.control-group select,
.control-group input[type="range"] {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
}

.control-group select:focus,
.control-group input[type="range"]:focus {
  outline: none;
  border-color: #667eea;
}

#pressureValue {
  display: inline-block;
  margin-left: 10px;
  font-weight: 600;
  color: #667eea;
}

.info-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.info-panel h4 {
  color: #667eea;
  margin-bottom: 15px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}

.result-item:last-child {
  border-bottom: none;
}

.result-value {
  font-weight: 600;
  color: #764ba2;
}

.explanation {
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  padding: 20px;
  border-radius: 8px;
  margin-top: 30px;
}

.explanation h3 {
  color: #667eea;
  margin-top: 0;
}

.explanation p {
  line-height: 1.8;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .simulation-container {
    padding: 20px;
  }

  .controls {
    padding: 15px;
  }
}
</style>

<script src="/js/torricelli-simulation.js"></script>
