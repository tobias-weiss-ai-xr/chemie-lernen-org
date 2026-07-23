/* global saveToHistory */

function calcMassMassValue(m1, M1, M2, v1, v2) {
  const n1 = m1 / M1;
  const n2 = n1 * (v2 / v1);
  const m2 = n2 * M2;
  return { n1, n2, m2 };
}

function calcMassMass() {
  const m1 = parseFloat(document.getElementById('mass-r').value);
  const M1 = parseFloat(document.getElementById('mm-r').value);
  const M2 = parseFloat(document.getElementById('mm-p').value);
  const v1 = parseFloat(document.getElementById('mass-coeff-r').value);
  const v2 = parseFloat(document.getElementById('mass-coeff-p').value);

  if (isNaN(m1) || isNaN(M1) || isNaN(M2) || isNaN(v1) || isNaN(v2)) {
    showToast('Bitte geben Sie alle Werte ein', 'error');
    return;
  }
  if (M1 <= 0 || v1 <= 0) {
    showToast('Molare Masse und Koeffizient müssen größer als 0 sein', 'error');
    return;
  }

  const { n1, n2, m2 } = calcMassMassValue(m1, M1, M2, v1, v2);

  document.getElementById('mass-preview').innerHTML =
    '<p style="font-size:2em; color:#007bff;">' + m2.toFixed(2) + '</p>' + '<p>Gramm</p>';

  document.getElementById('mass-result').style.display = 'block';
  document.getElementById('mass-result').innerHTML =
    '<div class="result-box">' +
    '<h3>Berechnung:</h3>' +
    '<p><strong>Schritt 1:</strong> n\u2081 = m\u2081/M\u2081 = ' +
    m1 +
    ' g / ' +
    M1 +
    ' g/mol = ' +
    n1.toFixed(4) +
    ' mol</p>' +
    '<p><strong>Schritt 2:</strong> n\u2082 = n\u2081 \u00d7 (\u03bd\u2082/\u03bd\u2081) = ' +
    n1.toFixed(4) +
    ' mol \u00d7 (' +
    v2 +
    '/' +
    v1 +
    ') = ' +
    n2.toFixed(4) +
    ' mol</p>' +
    '<p><strong>Schritt 3:</strong> m\u2082 = n\u2082 \u00d7 M\u2082 = ' +
    n2.toFixed(4) +
    ' mol \u00d7 ' +
    M2 +
    ' g/mol = <strong>' +
    m2.toFixed(2) +
    ' g</strong></p>' +
    '<button class="btn btn-info btn-sm" onclick="toggleMassMassExplanation()" style="margin-top:10px;">' +
    '<i class="fa fa-info-circle"></i> Schritt-f\u00fcr-Schritt Erkl\u00e4rung' +
    '</button>' +
    '<div id="mass-mass-explanation" style="display:none; margin-top:15px; padding:15px; background:#e8f5e9; border-radius:4px; border-left:4px solid #4CAF50;">' +
    '<h4 style="color:#2E7D32; margin-top:0;"><i class="fa fa-graduation-cap"></i> Ausf\u00fchrliche Erkl\u00e4rung</h4>' +
    '<div style="margin-bottom:15px;">' +
    '<h5 style="color:#1B5E20;">\ud83d\udcda Das Konzept</h5>' +
    '<p>Die Umrechnung von Masse zu Masse erfordert drei Schritte: Masse \u2192 Mol (Stoffmenge) \u2192 Mol (Stoffmenge) \u2192 Masse. Dies ist notwendig, weil die st\u00f6chiometrischen Koeffizienten das Verh\u00e4ltnis der <strong>Stoffmengen</strong> (in Mol), nicht der Massen angeben.</p>' +
    '</div>' +
    '<div style="margin-bottom:15px;">' +
    '<h5 style="color:#1B5E20;">\ud83d\udcd0 Die Formeln</h5>' +
    '<p style="font-size:16px; font-weight:bold; color:#2E7D32;">Schritt 1: n = m/M</p>' +
    '<p style="font-size:16px; font-weight:bold; color:#2E7D32;">Schritt 2: n\u2082 = n\u2081 \u00d7 (\u03bd\u2082/\u03bd\u2081)</p>' +
    '<p style="font-size:16px; font-weight:bold; color:#2E7D32;">Schritt 3: m = n \u00d7 M</p>' +
    '<p><strong>Wo:</strong></p>' +
    '<ul>' +
    '<li><strong>m</strong> = Masse (in Gramm)</li>' +
    '<li><strong>M</strong> = Molare Masse (in g/mol)</li>' +
    '<li><strong>n</strong> = Stoffmenge (in mol)</li>' +
    '<li><strong>\u03bd</strong> = St\u00f6chiometrischer Koeffizient</li>' +
    '</ul>' +
    '</div>' +
    '<div style="margin-bottom:15px;">' +
    '<h5 style="color:#1B5E20;">\ud83d\udd22 Detaillierte Berechnung</h5>' +
    '<div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">' +
    '<p><strong>Schritt 1:</strong> Masse des Edukts in Stoffmenge umrechnen</p>' +
    '<p style="font-family:monospace; color:#2E7D32;">n\u2081 = m\u2081 / M\u2081 = ' +
    m1 +
    ' g / ' +
    M1 +
    ' g/mol</p>' +
    '<p style="font-family:monospace; color:#2E7D32;">n\u2081 = ' +
    n1.toFixed(4) +
    ' mol</p>' +
    '<p><small>Teile die Masse durch die molare Masse, um die Stoffmenge in Mol zu erhalten.</small></p>' +
    '</div>' +
    '<div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">' +
    '<p><strong>Schritt 2:</strong> Stoffmenge des Produkts berechnen (unter Verwendung der Koeffizienten)</p>' +
    '<p style="font-family:monospace; color:#2E7D32;">Verh\u00e4ltnis = \u03bd\u2082/\u03bd\u2081 = ' +
    v2 +
    '/' +
    v1 +
    ' = ' +
    (v2 / v1).toFixed(4) +
    '</p>' +
    '<p style="font-family:monospace; color:#2E7D32;">n\u2082 = ' +
    n1.toFixed(4) +
    ' mol \u00d7 ' +
    (v2 / v1).toFixed(4) +
    ' = ' +
    n2.toFixed(4) +
    ' mol</p>' +
    '<p><small>Multipliziere die Stoffmenge des Edukts mit dem Koeffizientenverh\u00e4ltnis.</small></p>' +
    '</div>' +
    '<div style="background:white; padding:10px; border-radius:4px;">' +
    '<p><strong>Schritt 3:</strong> Stoffmenge des Produkts in Masse umrechnen</p>' +
    '<p style="font-family:monospace; color:#2E7D32;">m\u2082 = n\u2082 \u00d7 M\u2082 = ' +
    n2.toFixed(4) +
    ' mol \u00d7 ' +
    M2 +
    ' g/mol</p>' +
    '<p style="font-family:monospace; color:#2E7D32;">m\u2082 = ' +
    m2.toFixed(2) +
    ' g</p>' +
    '<p><small>Multipliziere die Stoffmenge mit der molaren Masse, um die Masse zu erhalten.</small></p>' +
    '</div>' +
    '</div>' +
    '<div style="margin-bottom:15px;">' +
    '<h5 style="color:#1B5E20;">\ud83d\udca1 Einheiten-Analyse</h5>' +
    '<p style="font-family:monospace; background:white; padding:10px; border-radius:4px;">' +
    'Schritt 1: g \u00f7 (g/mol) = mol' +
    '</p>' +
    '<p style="font-family:monospace; background:white; padding:10px; border-radius:4px;">' +
    'Schritt 2: mol \u00d7 (mol/mol) = mol' +
    '</p>' +
    '<p style="font-family:monospace; background:white; padding:10px; border-radius:4px;">' +
    'Schritt 3: mol \u00d7 (g/mol) = g' +
    '</p>' +
    '</div>' +
    '<div style="background:#fff3e0; padding:12px; border-radius:4px; border-left:4px solid #FF9800;">' +
    '<h5 style="color:#E65100; margin-top:0;"><i class="fa fa-lightbulb-o"></i> Tipps & H\u00e4ufige Fehler</h5>' +
    '<ul style="margin-bottom:0;">' +
    '<li>\u2705 <strong>Richtig:</strong> Immer \u00fcber Mol (Stoffmenge) umrechnen, nicht direkt von Masse zu Masse</li>' +
    '<li>\u2705 <strong>Richtig:</strong> Die molare Masse aus dem Periodensystem bestimmen (Summe der Atommassen)</li>' +
    '<li>\u274c <strong>Falsch:</strong> Masse\u2081 \u00d7 (Masse\u2082/Masse\u2081) - Die molaren Massen sind nicht proportional!</li>' +
    '<li>\u274c <strong>Falsch:</strong> Vergessen, die Koeffizienten zu ber\u00fccksichtigen</li>' +
    '</ul>' +
    '</div>' +
    '</div>' +
    '<button class="btn btn-success btn-sm" onclick="exportMassMassToPDF()" style="margin-top:15px;">' +
    '<i class="fa fa-file-pdf-o"></i> Als PDF exportieren' +
    '</button>' +
    '</div>';

  saveToHistory(
    'Masse-Masse',
    m1 + ' g \u2192 ' + m2.toFixed(2) + ' g (\u03bd\u2081=' + v1 + ', \u03bd\u2082=' + v2 + ')'
  );
}

function toggleMassMassExplanation() {
  const explanation = document.getElementById('mass-mass-explanation');
  if (explanation) {
    explanation.style.display = explanation.style.display === 'none' ? 'block' : 'none';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcMassMassValue };
}
