/* global saveToHistory */


function calcMolMolValue(n1, v1, v2) {
  return n1 * (v2 / v1);
}

function calcMolMol() {
  const n1 = parseFloat(document.getElementById('mol-reactant').value);
  const v1 = parseFloat(document.getElementById('mol-coeff-r').value);
  const v2 = parseFloat(document.getElementById('mol-coeff-p').value);

  if (isNaN(n1) || isNaN(v1) || isNaN(v2)) {
    showToast('Bitte geben Sie alle Werte ein', 'error');
    return;
  }
  if (v1 <= 0) {
    showToast('Der Edukt-Koeffizient muss größer als 0 sein', 'error');
    return;
  }

  const n2 = calcMolMolValue(n1, v1, v2);
  document.getElementById('mol-result').style.display = 'block';

  document.getElementById('mol-calc').innerHTML =
    '<p><strong>Edukt (ν\u2081=' + v1 + '):</strong> ' + n1 + ' mol</p>' +
    '<p><strong>Produkt (ν\u2082=' + v2 + '):</strong> ' + n2.toFixed(4) + ' mol</p>' +
    '<p class="text-muted"><small>Formel: n\u2082 = n\u2081 \u00d7 (\u03bd\u2082/\u03bd\u2081) = ' + n1 + ' \u00d7 (' + v2 + '/' + v1 + ') = ' + n2.toFixed(4) + ' mol</small></p>' +
    '<button class="btn btn-info btn-sm" onclick="toggleMolMolExplanation()" style="margin-top:10px;">' +
      '<i class="fa fa-info-circle"></i> Schritt-f\u00fcr-Schritt Erkl\u00e4rung' +
    '</button>' +
    '<div id="mol-mol-explanation" style="display:none; margin-top:15px; padding:15px; background:#e3f2fd; border-radius:4px; border-left:4px solid #2196F3;">' +
      '<h4 style="color:#1976D2; margin-top:0;"><i class="fa fa-graduation-cap"></i> Ausf\u00fchrliche Erkl\u00e4rung</h4>' +

      '<div style="margin-bottom:15px;">' +
        '<h5 style="color:#0D47A1;">\ud83d\udcda Das Konzept</h5>' +
        '<p>Bei chemischen Reaktionen reagieren Edukte und Produkte in festen Stoffmengenverh\u00e4ltnissen, die durch die st\u00f6chiometrischen Koeffizienten bestimmt werden. Diese Verh\u00e4ltnisse erm\u00f6glichen es uns, die Stoffmenge eines Produkts aus der Stoffmenge eines Edukts zu berechnen.</p>' +
      '</div>' +

      '<div style="margin-bottom:15px;">' +
        '<h5 style="color:#0D47A1;">\ud83d\udcd0 Die Formel</h5>' +
        '<p style="font-size:18px; font-weight:bold; color:#1976D2;">n\u2082 = n\u2081 \u00d7 (\u03bd\u2082/\u03bd\u2081)</p>' +
        '<p><strong>Wo:</strong></p>' +
        '<ul>' +
          '<li><strong>n\u2081</strong> = Stoffmenge des Edukts (gegeben)</li>' +
          '<li><strong>\u03bd\u2081</strong> = Koeffizient des Edukts in der Reaktionsgleichung</li>' +
          '<li><strong>\u03bd\u2082</strong> = Koeffizient des Produkts in der Reaktionsgleichung</li>' +
          '<li><strong>n\u2082</strong> = Stoffmenge des Produkts (berechnet)</li>' +
        '</ul>' +
      '</div>' +

      '<div style="margin-bottom:15px;">' +
        '<h5 style="color:#0D47A1;">\ud83d\udd22 Schritt-f\u00fcr-Schritt Berechnung</h5>' +
        '<div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">' +
          '<p><strong>Schritt 1:</strong> Koeffizientenverh\u00e4ltnis bestimmen</p>' +
          '<p style="font-family:monospace; color:#1976D2;">Verh\u00e4ltnis = \u03bd\u2082/\u03bd\u2081 = ' + v2 + '/' + v1 + ' = ' + (v2/v1).toFixed(4) + '</p>' +
          '<p><small>Das bedeutet: F\u00fcr jedes ' + v1 + ' Mol Edukt entstehen ' + v2 + ' Mol Produkt.</small></p>' +
        '</div>' +

        '<div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">' +
          '<p><strong>Schritt 2:</strong> Stoffmenge des Produkts berechnen</p>' +
          '<p style="font-family:monospace; color:#1976D2;">n\u2082 = ' + n1 + ' mol \u00d7 ' + (v2/v1).toFixed(4) + ' = ' + n2.toFixed(4) + ' mol</p>' +
          '<p><small>Multipliziere die gegebene Stoffmenge mit dem Koeffizientenverh\u00e4ltnis.</small></p>' +
        '</div>' +

        '<div style="background:white; padding:10px; border-radius:4px;">' +
          '<p><strong>Schritt 3:</strong> Ergebnis \u00fcberpr\u00fcfen</p>' +
          '<p><strong>Ergebnis:</strong> ' + n2.toFixed(4) + ' mol Produkt werden aus ' + n1 + ' mol Edukt gebildet.</p>' +
        '</div>' +
      '</div>' +

      '<div style="margin-bottom:15px;">' +
        '<h5 style="color:#0D47A1;">\ud83d\udca1 Einheiten-Analyse</h5>' +
        '<p style="font-family:monospace; background:white; padding:10px; border-radius:4px;">' +
          'mol \u00d7 (mol/mol) = mol' +
        '</p>' +
        '<p><small>Die Koeffizienten sind einheitenlos (Verh\u00e4ltnis von Mol zu Mol), daher bleibt die Einheit "mol" erhalten.</small></p>' +
      '</div>' +

      '<div style="background:#fff3e0; padding:12px; border-radius:4px; border-left:4px solid #FF9800;">' +
        '<h5 style="color:#E65100; margin-top:0;"><i class="fa fa-lightbulb-o"></i> Tipps & H\u00e4ufige Fehler</h5>' +
        '<ul style="margin-bottom:0;">' +
          '<li>\u2705 <strong>Richtig:</strong> Immer die Koeffizienten aus der <em>ausglichenen</em> Reaktionsgleichung verwenden</li>' +
          '<li>\u2705 <strong>Richtig:</strong> Das Koeffizientenverh\u00e4ltnis als Bruch schreiben (\u03bd\u2082/\u03bd\u2081)</li>' +
          '<li>\u274c <strong>Falsch:</strong> Koeffizienten vergessen und annehmen, das Verh\u00e4ltnis sei 1:1</li>' +
          '<li>\u274c <strong>Falsch:</strong> Das Verh\u00e4ltnis umgekehrt (\u03bd\u2081/\u03bd\u2082 statt \u03bd\u2082/\u03bd\u2081)</li>' +
        '</ul>' +
      '</div>' +
    '</div>';

  saveToHistory('Mol-Mol', '\u03bd\u2081=' + v1 + ', \u03bd\u2082=' + v2 + ': ' + n1 + ' mol \u2192 ' + n2.toFixed(4) + ' mol');
}


function toggleMolMolExplanation() {
  const explanation = document.getElementById('mol-mol-explanation');
  if (explanation) {
    explanation.style.display = explanation.style.display === 'none' ? 'block' : 'none';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcMolMolValue };
}
