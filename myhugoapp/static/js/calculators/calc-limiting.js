/* global saveToHistory */

function calcLimitingValue(m1, M1, m2, M2) {
  const n1 = m1 / M1;
  const n2 = m2 / M2;
  const limiting = n1 < n2 ? 1 : 2;
  const name = limiting === 1 ? 'Reagenz 1' : 'Reagenz 2';
  const excess = limiting === 1 ? n2 - n1 : n1 - n2;
  return { n1, n2, limiting, name, excess };
}

function calcLimiting() {
  const m1 = parseFloat(document.getElementById('lim-m1').value);
  const M1 = parseFloat(document.getElementById('lim-mm1').value);
  const m2 = parseFloat(document.getElementById('lim-m2').value);
  const M2 = parseFloat(document.getElementById('lim-mm2').value);

  if (isNaN(m1) || isNaN(M1) || isNaN(m2) || isNaN(M2)) {
    showToast('Bitte geben Sie alle Werte ein', 'error');
    return;
  }
  if (M1 <= 0 || M2 <= 0) {
    showToast('Die molare Masse muss größer als 0 sein', 'error');
    return;
  }

  const { n1, n2: n2_2, limiting, name, excess: other } = calcLimitingValue(m1, M1, m2, M2);

  document.getElementById('limit-result').style.display = 'block';
  document.getElementById('limit-result').innerHTML =
    '<div class="alert alert-success">' +
    '<h4>Limitierend: ' +
    name +
    '</h4>' +
    '<p>Reagenz 1: ' +
    n1.toFixed(4) +
    ' mol</p>' +
    '<p>Reagenz 2: ' +
    n2_2.toFixed(4) +
    ' mol</p>' +
    '<button class="btn btn-info btn-sm" onclick="toggleLimitingExplanation()" style="margin-top:10px;">' +
    '<i class="fa fa-info-circle"></i> Schritt-f\u00fcr-Schritt Erkl\u00e4rung' +
    '</button>' +
    '<div id="limiting-explanation" style="display:none; margin-top:15px; padding:15px; background:#fff3e0; border-radius:4px; border-left:4px solid #FF9800;">' +
    '<h4 style="color:#E65100; margin-top:0;"><i class="fa fa-graduation-cap"></i> Ausf\u00fchrliche Erkl\u00e4rung</h4>' +
    '<div style="margin-bottom:15px;">' +
    '<h5 style="color:#BF360C;">\ud83d\udcda Das Konzept</h5>' +
    '<p>Das <strong>limitierende Reagenz</strong> (Limiting Reagent) ist der Stoff, der zuerst verbraucht wird und damit die Menge an Produkt bestimmt, die gebildet werden kann. Der andere Stoff ist im \u00dcberschuss vorhanden und wird nicht vollst\u00e4ndig verbraucht.</p>' +
    '</div>' +
    '<div style="margin-bottom:15px;">' +
    '<h5 style="color:#BF360C;">\ud83d\udcd0 Die Logik</h5>' +
    '<p>Vergleiche die Stoffmengen (in Mol) der beiden Reagenzien:</p>' +
    '<ul>' +
    '<li>Wenn beide Reagenzien im 1:1-Verh\u00e4ltnis reagieren: Das Reagenz mit der <strong>geringeren Stoffmenge</strong> ist limitierend</li>' +
    '<li>Das Reagenz mit der gr\u00f6\u00dferen Stoffmenge ist im <strong>\u00dcberschuss</strong></li>' +
    '</ul>' +
    '</div>' +
    '<div style="margin-bottom:15px;">' +
    '<h5 style="color:#BF360C;">\ud83d\udd22 Schritt-f\u00fcr-Schritt Berechnung</h5>' +
    '<div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">' +
    '<p><strong>Schritt 1:</strong> Stoffmenge von Reagenz 1 berechnen</p>' +
    '<p style="font-family:monospace; color:#E65100;">n\u2081 = m\u2081 / M\u2081 = ' +
    m1 +
    ' g / ' +
    M1 +
    ' g/mol = ' +
    n1.toFixed(4) +
    ' mol</p>' +
    '</div>' +
    '<div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">' +
    '<p><strong>Schritt 2:</strong> Stoffmenge von Reagenz 2 berechnen</p>' +
    '<p style="font-family:monospace; color:#E65100;">n\u2082 = m\u2082 / M\u2082 = ' +
    m2 +
    ' g / ' +
    M2 +
    ' g/mol = ' +
    n2_2.toFixed(4) +
    ' mol</p>' +
    '</div>' +
    '<div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">' +
    '<p><strong>Schritt 3:</strong> Stoffmengen vergleichen</p>' +
    '<p style="font-family:monospace; color:#E65100;">' +
    n1.toFixed(4) +
    ' mol ' +
    (n1 < n2_2 ? '<' : '>') +
    ' ' +
    n2_2.toFixed(4) +
    ' mol</p>' +
    '<p><strong>Ergebnis:</strong> ' +
    name +
    ' hat weniger Mol und ist daher limitierend.</p>' +
    '</div>' +
    '<div style="background:white; padding:10px; border-radius:4px;">' +
    '<p><strong>Schritt 4:</strong> \u00dcberschuss berechnen (optional)</p>' +
    '<p style="font-family:monospace; color:#E65100;">\u00dcberschuss = ' +
    other.toFixed(4) +
    ' mol</p>' +
    '<p><small>Dies ist die Menge an ' +
    (limiting === 1 ? 'Reagenz 2' : 'Reagenz 1') +
    ', die <strong>nicht</strong> reagieren wird.</small></p>' +
    '</div>' +
    '</div>' +
    '<div style="background:#e1f5fe; padding:12px; border-radius:4px; border-left:4px solid #03A9F4;">' +
    '<h5 style="color:#0277BD; margin-top:0;"><i class="fa fa-lightbulb-o"></i> Tipps & H\u00e4ufige Fehler</h5>' +
    '<ul style="margin-bottom:0;">' +
    '<li>\u2705 <strong>Richtig:</strong> Immer die Stoffmengen (in Mol) vergleichen, nicht die Massen!</li>' +
    '<li>\u2705 <strong>Richtig:</strong> Auf die Koeffizienten der Reaktionsgleichung achten (z.B. 2A + B \u2192 C bedeutet 2:1 Verh\u00e4ltnis)</li>' +
    '<li>\u274c <strong>Falsch:</strong> Die Massen direkt vergleichen - das funktioniert nur bei gleichen molaren Massen!</li>' +
    '<li>\u274c <strong>Falsch:</strong> Annehmen, das Reagenz mit der kleineren Masse sei immer limitierend</li>' +
    '</ul>' +
    '</div>' +
    '</div>' +
    '<button class="btn btn-success btn-sm" onclick="exportLimitingToPDF()" style="margin-top:15px;">' +
    '<i class="fa fa-file-pdf-o"></i> Als PDF exportieren' +
    '</button>' +
    '</div>';

  saveToHistory(
    'Limitierendes Reagenz',
    name + ' (' + n1.toFixed(4) + ' vs ' + n2_2.toFixed(4) + ' mol)'
  );
}

function toggleLimitingExplanation() {
  const explanation = document.getElementById('limiting-explanation');
  if (explanation) {
    explanation.style.display = explanation.style.display === 'none' ? 'block' : 'none';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcLimitingValue, calcLimiting, toggleLimitingExplanation };
}
