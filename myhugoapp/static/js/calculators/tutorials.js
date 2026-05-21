var tutorialState = {
  currentTutorial: null,
  currentStep: 0,
  completedTutorials: JSON.parse(localStorage.getItem('completedTutorials') || '[]')
};

var tutorials = {
  1: {
    title: 'Was ist Stöchiometrie?',
    color: '#4CAF50',
    steps: [
      {
        title: 'Willkommen zur Stöchiometrie! 🧪',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;">🎯 Lernziele</h4>
            <p>Nach diesem Tutorial wirst du verstehen:</p>
            <ul style="color: #1b5e20;">
              <li>Was Stöchiometrie ist und warum sie wichtig ist</li>
              <li>Das Konzept der Stoffmenge (Mol)</li>
              <li>Wie chemische Gleichungen als "Rezepte" funktionieren</li>
              <li>Die Grundlage aller stöchiometrischen Berechnungen</li>
            </ul>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-question-circle" style="color: #4CAF50;"></i> Was bedeutet "Stöchiometrie"?</h5>
            <p>Das Wort kommt aus dem Griechischen:</p>
            <ul>
              <li><strong>stoicheion</strong> = Element</li>
              <li><strong>metron</strong> = Maß</li>
            </ul>
            <p>Stöchiometrie ist also das <strong"Messen von Elementen</strong> - die Berechnung der Mengenverhältnisse bei chemischen Reaktionen.</p>
          </div>
        `
      },
      {
        title: 'Das Mol - Die Grundlage 📊',
        content: `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="color: #e65100; margin-top: 0;"><i class="fa fa-lightbulb-o"></i> Das Wichtigste auf einen Blick</h4>
            <p><strong>1 Mol</strong> ist die Menge eines Stoffes, die genau <strong>6.022 × 10²³ Teilchen</strong> enthält.</p>
            <p style="font-size: 18px; color: #e65100; text-align: center; margin: 15px 0;">
              <strong>1 Mol = 602.200.000.000.000.000.000.000 Teilchen</strong>
            </p>
            <p>Diese Zahl heißt <strong>Avogadro-Konstante</strong> (Nₐ).</p>
          </div>
          <div style="margin-top: 20px;">
            <h5>🎨 Eine Analogie</h5>
            <p>Stell dir vor, ein <strong>Dutzend</strong> sind 12 Stück:</p>
            <ul>
              <li>1 Dutzend Eier = 12 Eier</li>
              <li>1 Dutzend Stifte = 12 Stifte</li>
            </ul>
            <p>In der Chemie ist das <strong>Mol</strong> unser "Dutzend" - nur viel größer!</p>
            <ul>
              <li>1 Mol Atome = 6.022 × 10²³ Atome</li>
              <li>1 Mol Moleküle = 6.022 × 10²³ Moleküle</li>
            </ul>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #1565c0;"><i class="fa fa-balance-scale"></i> Mol und Masse</h5>
            <p>Die Masse von 1 Mol nennt man <strong>molare Masse</strong> (M). Sie hängt vom Element ab:</p>
            <ul>
              <li>1 Mol Kohlenstoff (C) wiegt <strong>12.01 g</strong></li>
              <li>1 Mol Wasserstoff (H) wiegt <strong>1.008 g</strong></li>
              <li>1 Mol Sauerstoff (O) wiegt <strong>16.00 g</strong></li>
            </ul>
            <p><strong>Formel:</strong> n = m / M (Stoffmenge = Masse / molare Masse)</p>
          </div>
        `
      },
      {
        title: 'Chemische Gleichungen als Rezepte 📝',
        content: `
          <div style="background: #fce4ec; padding: 20px; border-radius: 8px; border-left: 4px solid #E91E63;">
            <h4 style="color: #c2185b; margin-top: 0;"><i class="fa fa-cutlery"></i> Rezepte in der Küche und Chemie</h4>
            <p>Ein chemisches Rezept (Gleichung) funktioniert genau wie ein Kochrezept!</p>
          </div>
          <div style="margin-top: 20px;">
            <h5>🍳 Beispiel: Kuchen backen</h5>
            <div style="background: #fff; padding: 15px; border: 2px dashed #ccc; border-radius: 8px;">
              <p><strong>Rezept:</strong> 2 Eier + 3 Tassen Mehl → 1 Kuchen</p>
              <p><em>Wenn du 6 Eier hast, wie viele Tassen Mehl brauchst du?</em></p>
              <p style="color: #4CAF50; font-weight: bold;">Lösung: 9 Tassen Mehl (Verhältnis 2:3)</p>
            </div>
          </div>
          <div style="margin-top: 20px;">
            <h5>⚗️ Chemisches Beispiel: Wasserbildung</h5>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; font-size: 18px; text-align: center;">
              <p><strong>2 H₂ + O₂ → 2 H₂O</strong></p>
            </div>
            <p style="margin-top: 15px;">Diese Gleichung sagt:</p>
            <ul>
              <li><strong>2 Moleküle</strong> H₂ reagieren mit <strong>1 Molekül</strong> O₂</li>
              <li>Es entstehen <strong>2 Moleküle</strong> H₂O</li>
              <li>Das Verhältnis ist <strong>2:1:2</strong></li>
            </ul>
            <p>Auf Mol-Ebene: <strong>2 mol H₂ + 1 mol O₂ → 2 mol H₂O</strong></p>
          </div>
          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-star"></i> Das Prinzip</h5>
            <p>Die <strong>Koeffizienten</strong> (Zahlen vor den Formeln) geben das Mengenverhältnis an:</p>
            <p style="font-size: 16px; text-align: center;">
              ν₁ A + ν₂ B → ν₃ C + ν₄ D
            </p>
            <p>Daraus folgt: <strong>n(A) / ν₁ = n(B) / ν₂ = n(C) / ν₃ = n(D) / ν₄</strong></p>
          </div>
        `
      },
      {
        title: 'Warum ist Stöchiometrie wichtig? 🎯',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-industry"></i> In der Industrie</h4>
            <p>Chemische Unternehmen müssen genau berechnen:</p>
            <ul>
              <li>Wie viel Rohstoff wird benötigt für eine gewünschte Produktmenge?</li>
              <li>Was kostet die Produktion?</li>
              <li>Wie viel Abfall entsteht?</li>
            </ul>
          </div>
          <div style="background: #f1f8e9; padding: 20px; border-radius: 8px; margin-top: 15px;">
            <h4 style="color: #558b2f; margin-top: 0;"><i class="fa fa-flask"></i> Im Labor</h4>
            <p>Chemiker verwenden Stöchiometrie für:</p>
            <ul>
              <li>Die Synthese neuer Verbindungen</li>
              <li>Quantitative Analysen</li>
              <li>Qualitätskontrolle</li>
            </ul>
          </div>
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-top: 15px;">
            <h4 style="color: #ef6c00; margin-top: 0;"><i class="fa fa-leaf"></i> In der Umwelt</h4>
            <p>Stöchiometrie hilft uns zu verstehen:</p>
            <ul>
              <li>Wie viel CO₂ bei der Verbrennung entsteht</li>
              <li>Wie viel Abgas ein Auto produziert</li>
              <li>Wie man Umweltbelastung reduziert</li>
            </ul>
          </div>
          <div style="background: #fce4ec; padding: 20px; border-radius: 8px; margin-top: 15px;">
            <h4 style="color: #c2185b; margin-top: 0;"><i class="fa fa-heartbeat"></i> Im Körper</h4>
            <p>Dein Körper nutzt stöchiometrische Prinzipien:</p>
            <ul>
              <li>Zellatmung: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energie</li>
              <li>Photosynthese: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Zusammenfassung & Quiz 📝',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Was du jetzt wissen solltest</h4>
            <ol>
              <li><strong>Stöchiometrie</strong> = Lehre von den Mengenverhältnissen in chemischen Reaktionen</li>
              <li><strong>1 Mol</strong> = 6.022 × 10²³ Teilchen (Avogadro-Konstante)</li>
              <li><strong>Molare Masse</strong> = Masse von 1 Mol (in g/mol)</li>
              <li><strong>Koeffizienten</strong> in Gleichungen geben das Mengenverhältnis an</li>
              <li>Stöchiometrie ist wichtig in Industrie, Labor, Umwelt und Biologie</li>
            </ol>
          </div>
          <div style="background: #fff9c4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #f57f17;"><i class="fa fa-puzzle-piece"></i> Teste dein Wissen!</h4>
            <div style="margin-top: 15px;">
              <p><strong>Frage 1:</strong> Wie viele Teilchen sind in 1 Mol?</p>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">A) 1 Milliarde</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="true">B) 6.022 × 10²³</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">C) 1000</button>
            </div>
            <div style="margin-top: 15px;">
              <p><strong>Frage 2:</strong> Was gibt die molare Masse an?</p>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="true">A) Masse von 1 Mol</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">B) Anzahl der Atome</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">C) Volumen eines Stoffes</button>
            </div>
            <div style="margin-top: 15px;">
              <p><strong>Frage 3:</strong> In der Gleichung "2 H₂ + O₂ → 2 H₂O", was ist das Verhältnis H₂:O₂:H₂O?</p>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="true">A) 2:1:2</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">B) 1:1:1</button>
              <button class="btn btn-sm btn-default" onclick="this.style.background=this.dataset.correct==='true'?'#c8e6c9':'#ffcdd2'; this.dataset.answered='true'" data-correct="false">C) 2:2:1</button>
            </div>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>🎉 Gratulation!</strong> Du hast Tutorial 1 abgeschlossen! Klicke auf "Weiter", um fortzufahren.</p>
          </div>
        `
      }
    ]
  },
  2: {
    title: 'Mol-Mol Umrechnung',
    color: '#2196F3',
    steps: [
      {
        title: 'Einführung in Mol-Mol Berechnungen 🔄',
        content: `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3;">
            <h4 style="color: #1565c0; margin-top: 0;">🎯 Was du lernen wirst</h4>
            <p>In diesem Tutorial lernst du:</p>
            <ul>
              <li>Wie man Stoffmengen mit Hilfe von Koeffizienten umrechnet</li>
              <li>Die grundlegende Formel: n₂ = n₁ × (ν₂/ν₁)</li>
              <li>Praktische Beispiele Schritt für Schritt durchzurechnen</li>
            </ul>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-question-circle" style="color: #2196F3;"></i> Warum Mol-Mol?</h5>
            <p>Die Mol-Mol-Umrechnung ist die <strong>grundlegendste stöchiometrische Berechnung</strong>. Alle anderen Berechnungen (Masse-Masse, Volumen-Volumen) basieren darauf!</p>
            <p>Du rechnest Stoffmengen um, wenn du:</p>
            <ul>
              <li>Willst wissen, wie viel Produkt entsteht</li>
              <li>Berechnen willst, wie viel Edukt verbraucht wird</li>
              <li>Reaktionspartner im richtigen Verhältnis mischen willst</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Die Grundformel 📐',
        content: `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="color: #e65100; margin-top: 0;"><i class="fa fa-balance-scale"></i> Die wichtigste Formel!</h4>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; margin: 15px 0;">
              <strong>n₂ = n₁ × (ν₂/ν₁)</strong>
            </div>
            <p>Haben die Geduld, diese Formel zu verstehen - sie ist der Schlüssel zur Stöchiometrie!</p>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-book"></i> Die Variablen erklärt</h5>
            <table class="table table-striped" style="margin-top: 15px;">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Bedeutung</th>
                  <th>Einheit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>n₁</strong></td>
                  <td>Stoffmenge des Edukts (gegeben)</td>
                  <td>mol</td>
                </tr>
                <tr>
                  <td><strong>n₂</strong></td>
                  <td>Stoffmenge des Produkts (gesucht)</td>
                  <td>mol</td>
                </tr>
                <tr>
                  <td><strong>ν₁</strong></td>
                  <td>Koeffizient des Edukts in der Gleichung</td>
                  <td>(dimensionslos)</td>
                </tr>
                <tr>
                  <td><strong>ν₂</strong></td>
                  <td>Koeffizient des Produkts in der Gleichung</td>
                  <td>(dimensionslos)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #2e7d32;"><i class="fa fa-lightbulb-o"></i> Woher kommt diese Formel?</h5>
            <p>Aus der <strong>Proportion</strong> der Koeffizienten:</p>
            <p style="text-align: center; font-size: 18px;">
              n₁ / ν₁ = n₂ / ν₂
            </p>
            <p>Umgestellt nach n₂:</p>
            <p style="text-align: center; font-size: 20px; color: #4CAF50;">
              n₂ = n₁ × (ν₂/ν₁)
            </p>
          </div>
        `
      },
      {
        title: 'Beispiel 1: Wasserbildung 💧',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-tint"></i> Aufgabe</h4>
            <p>Gegeben ist die Wasserbildung:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 22px; margin: 10px 0;">
              <strong>2 H₂ + O₂ → 2 H₂O</strong>
            </div>
            <p><strong>Frage:</strong> Wie viel Mol H₂O entstehen, wenn 5 mol H₂ reagieren?</p>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Schritt-für-Schritt Lösung</h5>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> Identifiziere die Größen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>• n₁ = 5 mol (H₂, gegeben)</p>
                <p>• ν₁ = 2 (Koeffizient von H₂)</p>
                <p>• ν₂ = 2 (Koeffizient von H₂O)</p>
                <p>• n₂ = ? (gesucht)</p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> Einsetzen in die Formel</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p style="font-size: 18px;">n₂ = 5 mol × (2/2)</p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> Ausrechnen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p style="font-size: 18px;">n₂ = 5 mol × 1</p>
                <p style="font-size: 18px; color: #4CAF50;"><strong>n₂ = 5 mol</strong></p>
              </div>
            </div>
            <div style="background: #c8e6c9; padding: 15px; border-radius: 8px;">
              <p><strong>✅ Lösung:</strong> Aus 5 mol H₂ entstehen 5 mol H₂O!</p>
            </div>
          </div>
          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-eye"></i> Beobachtung</h5>
            <p>Weil beide Koeffizienten gleich sind (2 und 2), ist das Verhältnis 1:1. Die Stoffmenge bleibt gleich!</p>
          </div>
        `
      },
      {
        title: 'Beispiel 2: Methanverbrennung 🔥',
        content: `
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #F44336;">
            <h4 style="color: #c62828; margin-top: 0;"><i class="fa fa-fire"></i> Aufgabe</h4>
            <p>Verbrennung von Methan:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 22px; margin: 10px 0;">
              <strong>CH₄ + 2 O₂ → CO₂ + 2 H₂O</strong>
            </div>
            <p><strong>Frage:</strong> Wie viel Mol CO₂ entstehen aus 3 mol CH₄?</p>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Schritt-für-Schritt Lösung</h5>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> Identifiziere die Größen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>• n₁ = 3 mol (CH₄, gegeben)</p>
                <p>• ν₁ = 1 (Koeffizient von CH₄)</p>
                <p>• ν₂ = 1 (Koeffizient von CO₂)</p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> Einsetzen in die Formel</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p style="font-size: 18px;">n(CO₂) = 3 mol × (1/1)</p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> Ausrechnen</p>
              <div style="background: #c8e6c9; padding: 10px; border-radius: 4px;">
                <p style="font-size: 18px; color: #4CAF50;"><strong>n(CO₂) = 3 mol</strong></p>
              </div>
            </div>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <h5 style="color: #1565c0;"><i class="fa fa-plus-circle"></i> Zusatzfrage</h5>
            <p><strong>Wie viel Mol H₂O entstehen gleichzeitig?</strong></p>
            <p>Hier ist ν(H₂O) = 2:</p>
            <p style="font-size: 18px; text-align: center;">n(H₂O) = 3 mol × (2/1) = <strong>6 mol</strong></p>
          </div>
        `
      },
      {
        title: 'Praxis & Zusammenfassung ✅',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Merke dir</h4>
            <ul>
              <li><strong>Formel:</strong> n₂ = n₁ × (ν₂/ν₁)</li>
              <li><strong>Einheiten:</strong> Alle Stoffmengen in mol</li>
              <li><strong>Koeffizienten:</strong> Aus der ausgeglichenen Gleichung ablesen</li>
              <li><strong>Verhältnis:</strong> Das Verhältnis ν₂/ν₁ skaliert die Stoffmenge</li>
            </ul>
          </div>
          <div style="background: #fff9c4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #f57f17;"><i class="fa fa-pencil"></i> Probier es selbst!</h4>
            <div style="margin-top: 15px;">
              <p><strong>Aufgabe:</strong> N₂ + 3 H₂ → 2 NH₃ (Haber-Verfahren)</p>
              <p>Wie viel Mol NH₃ entstehen aus 4 mol N₂?</p>
              <details style="margin-top: 10px;">
                <summary style="cursor: pointer; padding: 10px; background: white; border-radius: 4px;">
                  <strong>Lösung anzeigen</strong>
                </summary>
                <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                  <p><strong>Schritt 1:</strong> n₁ = 4 mol, ν₁ = 1, ν₂ = 2</p>
                  <p><strong>Schritt 2:</strong> n(NH₃) = 4 mol × (2/1)</p>
                  <p><strong>Schritt 3:</strong> n(NH₃) = <strong>8 mol</strong></p>
                </div>
              </details>
            </div>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>🎉 Super!</strong> Du kennst jetzt die Grundlage aller stöchiometrischen Berechnungen!</p>
            <p style="margin: 10px 0 0 0;">Als nächstes lernst du, wie man Massen umrechnet (Tutorial 3).</p>
          </div>
        `
      }
    ]
  },
  3: {
    title: 'Masse-Masse Umrechnung',
    color: '#FF9800',
    steps: [
      {
        title: 'Von Masse zu Masse und zurück 🔄',
        content: `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="color: #e65100; margin-top: 0;">🎯 Was du lernen wirst</h4>
            <p>Im Labor wiegen wir Stoffe in Gramm, nicht in Mol! Du lernst:</p>
            <ul>
              <li>Die 3-Schritt-Methode für Masse-Masse-Berechnungen</li>
              <li>Wie man Masse → Mol → Mol → Masse umrechnet</li>
              <li>Praktische Beispiele aus dem Laboralltag</li>
            </ul>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-road"></i> Der Weg von Masse zu Masse</h5>
            <p>Um von einer Masse zur anderen zu kommen, brauchst du einen <strong>Umweg über Mol</strong>:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0;">
              <p style="font-size: 20px; margin: 10px 0;">
                m₁ <span style="color: #FF9800;">→</span> n₁ <span style="color: #FF9800;">→</span> n₂ <span style="color: #FF9800;">→</span> m₂
              </p>
              <p style="font-size: 14px; color: #666;">
                (Masse Edukt) → (Mol Edukt) → (Mol Produkt) → (Masse Produkt)
              </p>
            </div>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>💡 Merke:</strong> Mol ist die "Brücke" zwischen Massen verschiedener Stoffe!</p>
          </div>
        `
      },
      {
        title: 'Die drei Schritte im Detail 📝',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-list-ol"></i> Die 3-Schritt-Methode</h4>
          </div>
          <div style="margin-top: 20px;">
            <div style="margin-bottom: 20px;">
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                <h5 style="color: #1565c0;">Schritt 1: Masse → Mol (Edukt)</h5>
                <p style="font-size: 18px; text-align: center; margin: 10px 0;"><strong>n₁ = m₁ / M₁</strong></p>
                <p>Berechne die Stoffmenge des Edukts aus seiner Masse und molaren Masse.</p>
              </div>
            </div>
            <div style="margin-bottom: 20px;">
              <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #FF9800;">
                <h5 style="color: #e65100;">Schritt 2: Mol → Mol (Umrechnung)</h5>
                <p style="font-size: 18px; text-align: center; margin: 10px 0;"><strong>n₂ = n₁ × (ν₂/ν₁)</strong></p>
                <p>Rechne die Stoffmengen mit den Koeffizienten um (das kennst du schon!).</p>
              </div>
            </div>
            <div style="margin-bottom: 20px;">
              <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #9C27B0;">
                <h5 style="color: #6a1b9a;">Schritt 3: Mol → Masse (Produkt)</h5>
                <p style="font-size: 18px; text-align: center; margin: 10px 0;"><strong>m₂ = n₂ × M₂</strong></p>
                <p>Berechne die Masse des Produkts aus seiner Stoffmenge und molaren Masse.</p>
              </div>
            </div>
          </div>
          <div style="background: #fff9c4; padding: 15px; border-radius: 8px;">
            <h5 style="color: #f57f17;"><i class="fa fa-lightbulb-o"></i> Einheiten, Einheiten, Einheiten!</h5>
            <ul>
              <li><strong>m</strong> = Masse in Gramm (g)</li>
              <li><strong>n</strong> = Stoffmenge in Mol (mol)</li>
              <li><strong>M</strong> = Molare Masse in g/mol</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Beispiel: Wasserbildung berechnen 💧',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-tint"></i> Aufgabe</h4>
            <p>Wasserbildung: <strong>2 H₂ + O₂ → 2 H₂O</strong></p>
            <p><strong>Gegeben:</strong> 4.0 g Wasserstoff (H₂)</p>
            <p><strong>Frage:</strong> Wie viel Gramm Wasser (H₂O) entstehen?</p>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Schritt-für-Schritt Lösung</h5>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> H₂-Masse zu H₂-Mol</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>n(H₂) = m(H₂) / M(H₂)</p>
                <p>n(H₂) = 4.0 g / 2.016 g/mol</p>
                <p>n(H₂) = <strong>1.98 mol</strong></p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> H₂-Mol zu H₂O-Mol</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>n(H₂O) = n(H₂) × (ν(H₂O) / ν(H₂))</p>
                <p>n(H₂O) = 1.98 mol × (2/2)</p>
                <p>n(H₂O) = <strong>1.98 mol</strong></p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> H₂O-Mol zu H₂O-Masse</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>m(H₂O) = n(H₂O) × M(H₂O)</p>
                <p>m(H₂O) = 1.98 mol × 18.015 g/mol</p>
                <p>m(H₂O) = <strong>35.7 g</strong></p>
              </div>
            </div>
            <div style="background: #c8e6c9; padding: 15px; border-radius: 8px;">
              <p><strong>✅ Lösung:</strong> Aus 4.0 g H₂ entstehen 35.7 g H₂O!</p>
            </div>
          </div>
          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-eye"></i> Beobachtung</h5>
            <p>Die Masse hat sich fast verzehnffacht! Das liegt an der unterschiedlichen molaren Masse.</p>
          </div>
        `
      },
      {
        title: 'Tipps & Tricks 💡',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-star"></i> Wichtige Tipps</h4>
          </div>
          <div style="margin-top: 20px;">
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #1565c0;"><i class="fa fa-check"></i> Immer schrittweise vorgehen</h5>
              <p>Schreib jeden Schritt einzeln auf. So vermeidest du Fehler und kannst später nachvollziehen, was du getan hast.</p>
            </div>
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #e65100;"><i class="fa fa-check"></i> Einheiten kontrollieren</h5>
              <p>Überprüfe nach jedem Schritt, ob die Einheiten stimmen.</p>
            </div>
            <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #6a1b9a;"><i class="fa fa-check"></i> Molare Massen berechnen</h5>
              <p>Addiere die Atommassen aller Atome im Molekül.</p>
            </div>
            <div style="background: #fce4ec; padding: 15px; border-radius: 8px;">
              <h5 style="color: #c2185b;"><i class="fa fa-warning"></i> Häufige Fehler vermeiden</h5>
              <ul>
                <li>❌ Nicht vergessen, die molare Masse zu berechnen</li>
                <li>❌ Koeffizienten beim Mol-Mol-Schritt ignorieren</li>
                <li>❌ Falsche Koeffizienten verwenden (Edukt vs. Produkt)</li>
                <li>✅ Immer die ausgeglichene Gleichung kontrollieren</li>
              </ul>
            </div>
          </div>
        `
      },
      {
        title: 'Zusammenfassung & Praxis ✅',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Die 3-Schritt-Methode</h4>
            <ol>
              <li><strong>Schritt 1:</strong> n₁ = m₁ / M₁ (Masse → Mol, Edukt)</li>
              <li><strong>Schritt 2:</strong> n₂ = n₁ × (ν₂/ν₁) (Mol → Mol, Umrechnung)</li>
              <li><strong>Schritt 3:</strong> m₂ = n₂ × M₂ (Mol → Masse, Produkt)</li>
            </ol>
          </div>
          <div style="background: #fff9c4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #f57f17;"><i class="fa fa-pencil"></i> Übungsaufgabe</h4>
            <p><strong>Verbrennung von Kohlenstoff:</strong> C + O₂ → CO₂</p>
            <p>Wie viel Gramm CO₂ entstehen aus 12.0 g Kohlenstoff (C)?</p>
            <details style="margin-top: 10px;">
              <summary style="cursor: pointer; padding: 10px; background: white; border-radius: 4px;">
                <strong>Lösung anzeigen</strong>
              </summary>
              <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <p><strong>Schritt 1:</strong> n(C) = 12.0 g / 12.011 g/mol = 0.999 mol</p>
                <p><strong>Schritt 2:</strong> n(CO₂) = 0.999 mol × (1/1) = 0.999 mol</p>
                <p><strong>Schritt 3:</strong> m(CO₂) = 0.999 mol × 44.009 g/mol = <strong>44.0 g</strong></p>
              </div>
            </details>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>🎉 Ausgezeichnet!</strong> Du kannst jetzt Massen stöchiometrisch umrechnen!</p>
          </div>
        `
      }
    ]
  },
  4: {
    title: 'Limitierendes Reagenz',
    color: '#9C27B0',
    steps: [
      {
        title: 'Was ist ein limitierendes Reagenz? 🚧',
        content: `
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #9C27B0;">
            <h4 style="color: #6a1b9a; margin-top: 0;">🎯 Was du lernen wirst</h4>
            <p>Oft haben wir nicht von jedem Reaktionspartner genau die richtige Menge. Du lernst:</p>
            <ul>
              <li>Was ein limitierendes Reagenz ist</li>
              <li>Wie du es identifizierst</li>
              <li>Warum es wichtig für die Berechnung ist</li>
            </ul>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-question-circle" style="color: #9C27B0;"></i> Eine Analogie: Auto bauen 🚗</h5>
            <div style="background: #fff; padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px;">
              <p>Stell dir vor, du willst Autos bauen:</p>
              <p><strong>Rezept:</strong> 4 Räder + 1 Karosserie → 1 Auto</p>
              <p>Du hast: <strong>16 Räder</strong> und <strong>5 Karosserien</strong></p>
              <p>Wie viele Autos kannst du bauen?</p>
            </div>
          </div>
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>💡 Erkenntnis:</strong> Das Reagenz, das weniger Produkt erzeugen kann, bestimmt die Reaktion!</p>
          </div>
        `
      },
      {
        title: 'Wie man das limitierende Reagenz findet 🔍',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-list-ol"></i> Schritt-für-Schritt Methode</h4>
          </div>
          <div style="margin-top: 20px;">
            <h5>Der Algorithmus</h5>
            <div style="margin-bottom: 15px;">
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
                <p><strong>Schritt 1:</strong> Berechne Mol für jedes Reagenz</p>
                <p style="font-size: 18px; text-align: center;">n = m / M</p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="background: #fff3e0; padding: 15px; border-radius: 8px;">
                <p><strong>Schritt 2:</strong> Vergleiche die Mol-Verhältnisse</p>
                <p style="font-size: 18px; text-align: center;">n / ν für jedes Reagenz</p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <div style="background: #f3e5f5; padding: 15px; border-radius: 8px;">
                <p><strong>Schritt 3:</strong> Identifiziere das limitierende Reagenz</p>
                <p style="text-align: center;">Das Reagenz mit dem <strong>kleinsten n/ν-Wert</strong></p>
              </div>
            </div>
          </div>
          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-exclamation-triangle"></i> Wichtig!</h5>
            <p>Vergleiche <strong>immer n/ν</strong>, nicht nur n oder m!</p>
          </div>
        `
      },
      {
        title: 'Beispiel: Ammoniaksynthese 🌿',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-flask"></i> Aufgabe</h4>
            <p>Haber-Verfahren: <strong>N₂ + 3 H₂ → 2 NH₃</strong></p>
            <p><strong>Gegeben:</strong> 28.0 g N₂ und 10.0 g H₂</p>
            <p><strong>Frage:</strong> Was ist das limitierende Reagenz?</p>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Lösung</h5>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> Mol berechnen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
                <p>n(N₂) = 28.0 g / 28.02 g/mol = <strong>0.999 mol</strong></p>
                <p>n(H₂) = 10.0 g / 2.016 g/mol = <strong>4.96 mol</strong></p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> n/ν berechnen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
                <p>N₂: 0.999 mol / 1 = <strong>0.999</strong></p>
                <p>H₂: 4.96 mol / 3 = <strong>1.65</strong></p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> Vergleich</p>
              <div style="background: #c8e6c9; padding: 15px; border-radius: 8px;">
                <p>0.999 < 1.65</p>
                <p><strong>N₂ ist das limitierende Reagenz!</strong></p>
              </div>
            </div>
          </div>
        `
      },
      {
        title: 'Überschuss berechnen ➗',
        content: `
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px;">
            <h4 style="color: #6a1b9a; margin-top: 0;"><i class="fa fa-calculator"></i> Wie viel vom anderen Reagenz bleibt übrig?</h4>
          </div>
          <div style="margin-top: 20px;">
            <h5>Die Methode</h5>
            <ol>
              <li>Berechne, wie viel vom überschüssigen Reagenz verbraucht wird</li>
              <li>Ziehe dies von der ursprünglichen Menge ab</li>
            </ol>
          </div>
          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-lightbulb-o"></i> Praktische Bedeutung</h5>
            <ul>
              <li>In der Industrie nutzt man oft ein Reagenz im Überschuss</li>
              <li>So wird sichergestellt, dass das teure Reagenz komplett verbraucht wird</li>
              <li>Der Überschuss kann recycelt werden</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Zusammenfassung ✅',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Merkpunkte</h4>
            <ul>
              <li><strong>Limitierendes Reagenz:</strong> Der Reaktionspartner, der zuerst aufgebraucht wird</li>
              <li><strong>Identifikation:</strong> Vergleiche n/ν für alle Edukte</li>
              <li><strong>Das kleinste n/ν</strong> bestimmt die Produktmenge</li>
              <li><strong>Überschuss:</strong> Differenz zwischen vorhandenem und verbrauchtem Reagenz</li>
            </ul>
          </div>
          <div style="background: #fff9c4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #f57f17;"><i class="fa fa-pencil"></i> Übungsaufgabe</h4>
            <p><strong>Reaktion:</strong> 2 Na + Cl₂ → 2 NaCl</p>
            <p>Gegeben: 5.0 g Na und 7.0 g Cl₂</p>
            <p>Was ist das limitierende Reagenz?</p>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0;"><strong>🎉 Perfekt!</strong> Du kannst jetzt limitierende Reagenzien finden und berechnen!</p>
          </div>
        `
      }
    ]
  },
  5: {
    title: 'Ausbeute berechnen',
    color: '#F44336',
    steps: [
      {
        title: 'Theoretische vs. praktische Ausbeute 📊',
        content: `
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #F44336;">
            <h4 style="color: #c62828; margin-top: 0;">🎯 Was du lernen wirst</h4>
            <p>In der Realität erhalten wir nie 100% des theoretisch möglichen Produkts. Du lernst:</p>
            <ul>
              <li>Was theoretische und praktische Ausbeute sind</li>
              <li>Wie man die prozentuale Ausbeute berechnet</li>
              <li>Warum Ausbeuten nie 100% erreichen</li>
            </ul>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-balance-scale" style="color: #F44336;"></i> Zwei Arten der Ausbeute</h5>
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p><strong>📐 Theoretische Ausbeute</strong></p>
              <p>Die Menge an Produkt, die man unter <strong>perfekten Bedingungen</strong> erhalten würde.</p>
            </div>
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p><strong>⚗️ Praktische Ausbeute</strong></p>
              <p>Die Menge an Produkt, die man <strong>wirklich im Labor</strong> erhält.</p>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
              <p><strong>📈 Prozentsatz der Ausbeute</strong></p>
              <p>Das Verhältnis von praktischer zu theoretischer Ausbeute in Prozent.</p>
            </div>
          </div>
        `
      },
      {
        title: 'Die Ausbeute-Formel 📐',
        content: `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="color: #e65100; margin-top: 0;"><i class="fa fa-calculator"></i> Die Formel</h4>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; font-size: 24px; margin: 15px 0;">
              <strong>Ausbeute % = (m(praktisch) / m(theoretisch)) × 100%</strong>
            </div>
          </div>
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #2e7d32;"><i class="fa fa-lightbulb-o"></i> Berechnungsablauf</h5>
            <ol>
              <li>Berechne zuerst die <strong>theoretische Ausbeute</strong> mit Stöchiometrie</li>
              <li>Messe die <strong>praktische Ausbeute</strong> im Labor</li>
              <li>Setze beide in die Formel ein</li>
            </ol>
          </div>
        `
      },
      {
        title: 'Beispiel: Kupferfällung 🧪',
        content: `
          <div style="background: #e1f5fe; padding: 20px; border-radius: 8px; border-left: 4px solid #03A9F4;">
            <h4 style="color: #0277bd; margin-top: 0;"><i class="fa fa-flask"></i> Experiment</h4>
            <p>Fällung von Kupfer: Cu²⁺ + 2e⁻ → Cu</p>
            <p>Du verwendest 6.35 g CuSO₄ und erhältst 2.1 g Kupfer.</p>
          </div>
          <div style="margin-top: 20px;">
            <h5><i class="fa fa-list-ol"></i> Schritt-für-Schritt Lösung</h5>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 1:</strong> Theoretische Ausbeute berechnen</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>m(Cu)theoretisch = <strong>2.53 g</strong></p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 2:</strong> Praktische Ausbeute (gegeben)</p>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-left: 20px;">
                <p>m(Cu)praktisch = <strong>2.1 g</strong> (gemessen)</p>
              </div>
            </div>
            <div style="margin-bottom: 15px;">
              <p><strong>Schritt 3:</strong> Ausbeute berechnen</p>
              <div style="background: #c8e6c9; padding: 15px; border-radius: 8px;">
                <p style="font-size: 22px; text-align: center; color: #4CAF50;">
                  <strong>Ausbeute % = 83.0%</strong>
                </p>
              </div>
            </div>
          </div>
        `
      },
      {
        title: 'Warum nie 100% Ausbeute? 🤔',
        content: `
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px;">
            <h4 style="color: #6a1b9a; margin-top: 0;"><i class="fa fa-question-circle"></i> Gründe für Verluste</h4>
          </div>
          <div style="margin-top: 20px;">
            <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #c62828;"><i class="fa fa-times-circle"></i> Unvollständige Reaktionen</h5>
              <p>Manche Reaktionen erreichen nicht 100% Umsatz.</p>
            </div>
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #e65100;"><i class="fa fa-times-circle"></i> Nebenreaktionen</h5>
              <p>Nebenreaktionen verbrauchen Edukte.</p>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h5 style="color: #1565c0;"><i class="fa fa-times-circle"></i> Mechanische Verluste</h5>
              <p>Verluste bei der Arbeit (Transfer, Filtrieren, etc.).</p>
            </div>
          </div>
          <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h5 style="color: #f57f17;"><i class="fa fa-lightbulb-o"></i> Typische Ausbeuten</h5>
            <ul>
              <li>Präzise Synthesen: 80-90%</li>
              <li>Organische Synthesen: 50-70%</li>
              <li>Komplexe mehrstufige Synthesen: 10-40% (pro Schritt)</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Zusammenfassung & Abschluss ✅',
        content: `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="color: #2e7d32; margin-top: 0;"><i class="fa fa-check-circle"></i> Das hast du gelernt</h4>
            <ul>
              <li><strong>Theoretische Ausbeute:</strong> Berechneter Maximalwert (aus Stöchiometrie)</li>
              <li><strong>Praktische Ausbeute:</strong> Tatsächlich erhaltene Menge (gemessen)</li>
              <li><strong>Formel:</strong> Ausbeute % = (m(praktisch) / m(theoretisch)) × 100%</li>
              <li><strong>Realistische Ausbeuten:</strong> 50-90% je nach Reaktionstyp</li>
            </ul>
          </div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: white; margin-top: 0;"><i class="fa fa-trophy"></i> 🎉 Glückwunsch!</h4>
            <p style="color: white; font-size: 16px;">Du hast alle 5 Tutorials abgeschlossen!</p>
            <p style="color: white;">Du beherrschst jetzt:</p>
            <ul style="color: white;">
              <li>Grundlagen der Stöchiometrie</li>
              <li>Mol-Mol Umrechnungen</li>
              <li>Masse-Masse Umrechnungen</li>
              <li>Limitierende Reagenzien</li>
              <li>Ausbeuteberechnung</li>
            </ul>
          </div>
        `
      }
    ]
  }
};

function startTutorial(tutorialId) {
  const tutorial = tutorials[tutorialId];

  if (!tutorial) {
    alert('Tutorial nicht gefunden!');
    return;
  }

  if (tutorialId > 1 && !tutorialState.completedTutorials.includes(tutorialId - 1)) {
    alert('Bitte schließe zuerst das vorherige Tutorial ab!');
    return;
  }

  tutorialState.currentTutorial = tutorialId;
  tutorialState.currentStep = 0;

  document.getElementById('tutorial-menu').style.display = 'none';
  document.getElementById('tutorial-viewer').style.display = 'block';

  updateTutorialView();
}

function updateTutorialView() {
  const tutorial = tutorials[tutorialState.currentTutorial];

  if (!tutorial) {return;}

  const step = tutorial.steps[tutorialState.currentStep];

  document.getElementById('tutorial-title').textContent = tutorial.title;

  document.getElementById('tutorial-content').innerHTML = step.content;

  document.getElementById('step-indicator').textContent =
    'Schritt ' + (tutorialState.currentStep + 1) + ' von ' + tutorial.steps.length;

  document.getElementById('tutorial-prev').style.visibility =
    tutorialState.currentStep === 0 ? 'hidden' : 'visible';

  const nextBtn = document.getElementById('tutorial-next');
  if (tutorialState.currentStep === tutorial.steps.length - 1) {
    nextBtn.innerHTML = '<i class="fa fa-check"></i> Tutorial abschließen';
  } else {
    nextBtn.innerHTML = 'Weiter <i class="fa fa-arrow-right"></i>';
  }
}

function nextStep() {
  const tutorial = tutorials[tutorialState.currentTutorial];

  if (tutorialState.currentStep < tutorial.steps.length - 1) {
    tutorialState.currentStep++;
    updateTutorialView();
  } else {
    completeTutorial();
  }
}

function previousStep() {
  if (tutorialState.currentStep > 0) {
    tutorialState.currentStep--;
    updateTutorialView();
  }
}

function completeTutorial() {
  const tutorialId = tutorialState.currentTutorial;

  if (!tutorialState.completedTutorials.includes(tutorialId)) {
    tutorialState.completedTutorials.push(tutorialId);
    localStorage.setItem('completedTutorials', JSON.stringify(tutorialState.completedTutorials));
  }

  updateTutorialProgress();

  alert('\ud83c\udf89 Tutorial "' + tutorials[tutorialId].title + '" abgeschlossen!');

  closeTutorial();
}

function closeTutorial() {
  document.getElementById('tutorial-viewer').style.display = 'none';
  document.getElementById('tutorial-menu').style.display = 'block';
  tutorialState.currentTutorial = null;
  tutorialState.currentStep = 0;
}

function updateTutorialProgress() {
  const completedCount = tutorialState.completedTutorials.length;
  const progressEl = document.getElementById('tutorial-progress');
  if (progressEl) {
    progressEl.textContent = completedCount;
  }

  for (let i = 1; i <= 5; i++) {
    const statusEl = document.getElementById('status-tutorial-' + i);
    if (!statusEl) {continue;}

    if (tutorialState.completedTutorials.includes(i)) {
      statusEl.innerHTML = '<i class="fa fa-check-circle"></i> Abgeschlossen';
      statusEl.style.background = '#c8e6c9';
      statusEl.style.color = '#2e7d32';
    } else if (i === 1 || tutorialState.completedTutorials.includes(i - 1)) {
      statusEl.innerHTML = '<i class="fa fa-circle-o"></i> Nicht begonnen';
      statusEl.style.background = '#e0e0e0';
      statusEl.style.color = '#666';
    } else {
      statusEl.innerHTML = '<i class="fa fa-lock"></i> Gesperrt';
      statusEl.style.background = '#ffe0b2';
      statusEl.style.color = '#e65100';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateTutorialProgress();
});
