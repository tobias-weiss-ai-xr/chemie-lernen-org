/* global saveToHistory */


function calcYieldValue(theo, act) {
  return (act / theo) * 100;
}

function calcYield() {
  const theo = parseFloat(document.getElementById('yield-theo').value);
  const act = parseFloat(document.getElementById('yield-act').value);

  if (isNaN(theo) || isNaN(act)) {
    showToast('Bitte geben Sie alle Werte ein', 'error');
    return;
  }
  if (theo <= 0) {
    showToast('Die theoretische Ausbeute muss größer als 0 sein', 'error');
    return;
  }

  const yield_pct = calcYieldValue(theo, act);

  document.getElementById('yield-result').style.display = 'block';
  document.getElementById('yield-result').innerHTML =
    '<div class="result-box">' +
      '<h3>Ausbeute: ' + yield_pct.toFixed(2) + '%</h3>' +
      '<p>Theoretisch: ' + theo + ' g</p>' +
      '<p>Praktisch: ' + act + ' g</p>' +
      '<button class="btn btn-info btn-sm" onclick="toggleYieldExplanation()" style="margin-top:10px;">' +
        '<i class="fa fa-info-circle"></i> Schritt-f\u00fcr-Schritt Erkl\u00e4rung' +
      '</button>' +
      '<div id="yield-explanation" style="display:none; margin-top:15px; padding:15px; background:#f3e5f5; border-radius:4px; border-left:4px solid #9C27B0;">' +
        '<h4 style="color:#7B1FA2; margin-top:0;"><i class="fa fa-graduation-cap"></i> Ausf\u00fchrliche Erkl\u00e4rung</h4>' +

        '<div style="margin-bottom:15px;">' +
          '<h5 style="color:#4A148C;">\ud83d\udcda Das Konzept</h5>' +
          '<p>Die <strong>Reaktionsausbeute</strong> (Percent Yield) gibt an, wie effizient eine chemische Reaktion ist. Sie vergleicht die tats\u00e4chlich erhaltene Produktmenge mit der theoretisch m\u00f6glichen Menge.</p>' +
        '</div>' +

        '<div style="margin-bottom:15px;">' +
          '<h5 style="color:#4A148C;">\ud83d\udcd0 Die Formel</h5>' +
          '<p style="font-size:18px; font-weight:bold; color:#7B1FA2;">Ausbeute (%) = (Praktische Masse / Theoretische Masse) \u00d7 100%</p>' +
          '<p><strong>Wo:</strong></p>' +
          '<ul>' +
            '<li><strong>Theoretische Masse:</strong> Maximale Produktmenge, die basierend auf der St\u00f6chiometrie berechnet wurde</li>' +
            '<li><strong>Praktische Masse:</strong> Tats\u00e4chlich im Labor erhaltene Produktmenge</li>' +
            '<li><strong>Ausbeute:</strong> Prozentuales Verh\u00e4ltnis von praktisch zu theoretisch</li>' +
          '</ul>' +
        '</div>' +

        '<div style="margin-bottom:15px;">' +
          '<h5 style="color:#4A148C;">\ud83d\udd22 Schritt-f\u00fcr-Schritt Berechnung</h5>' +
          '<div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">' +
            '<p><strong>Schritt 1:</strong> Werte identifizieren</p>' +
            '<p style="font-family:monospace; color:#7B1FA2;">Theoretisch = ' + theo + ' g</p>' +
            '<p style="font-family:monospace; color:#7B1FA2;">Praktisch = ' + act + ' g</p>' +
          '</div>' +

          '<div style="background:white; padding:10px; border-radius:4px; margin-bottom:10px;">' +
            '<p><strong>Schritt 2:</strong> Ausbeute berechnen</p>' +
            '<p style="font-family:monospace; color:#7B1FA2;">Ausbeute = (' + act + ' / ' + theo + ') \u00d7 100%</p>' +
            '<p style="font-family:monospace; color:#7B1FA2;">Ausbeute = ' + (act/theo).toFixed(4) + ' \u00d7 100%</p>' +
            '<p style="font-family:monospace; color:#7B1FA2;">Ausbeute = ' + yield_pct.toFixed(2) + '%</p>' +
          '</div>' +

          '<div style="background:white; padding:10px; border-radius:4px;">' +
            '<p><strong>Schritt 3:</strong> Ergebnis interpretieren</p>' +
            '<p><strong>' + yield_pct.toFixed(2) + '%</strong> Ausbeute bedeutet, dass ' + yield_pct.toFixed(1) + '% der theoretisch m\u00f6glichen Produktmenge tats\u00e4chlich erhalten wurden.</p>' +
            (yield_pct < 50 ? '<p style="color:#c62828;"><small>\u26a0\ufe0f <strong>Niedrige Ausbeute:</strong> Es k\u00f6nnten Probleme mit der Reaktion aufgetreten sein (Verunreinigungen, Nebenreaktionen, Verluste bei der Aufarbeitung).</small></p>' : '') +
            (yield_pct > 100 ? '<p style="color:#c62828;"><small>\u26a0\ufe0f <strong>Ausbeute > 100%:</strong> Dies ist physikalisch unm\u00f6glich! M\u00f6gliche Ursachen: Verunreinigungen im Produkt, Feuchtigkeit, Messfehler.</small></p>' : '') +
            (yield_pct >= 80 && yield_pct <= 100 ? '<p style="color:#2e7d32;"><small>\u2705 <strong>Gute Ausbeute:</strong> Die Reaktion verlief effizient.</small></p>' : '') +
          '</div>' +
        '</div>' +

        '<div style="margin-bottom:15px;">' +
          '<h5 style="color:#4A148C;">\ud83d\udca1 Warum ist die Ausbeute nie 100%?</h5>' +
          '<div style="background:white; padding:12px; border-radius:4px;">' +
            '<p><strong>Typische Gr\u00fcnde f\u00fcr niedrigere Ausbeuten:</strong></p>' +
            '<ul>' +
              '<li>\ud83d\udca7 <strong>Verluste bei der Aufarbeitung:</strong> Produkt geht beim Filtern, Waschen oder Umkristallisieren verloren</li>' +
              '<li>\u26a0\ufe0f <strong>Nebenreaktionen:</strong> Edukte reagieren zu unerw\u00fcnschten Nebenprodukten</li>' +
              '<li>\ud83d\udd04 <strong>Reversible Reaktionen:</strong> Die Reaktion erreicht nicht das vollst\u00e4ndige Gleichgewicht</li>' +
              '<li>\ud83e\uddea <strong>Ung\u00fcnstige Bedingungen:</strong> Temperatur, Druck oder Katalysator nicht optimal</li>' +
              '<li>\ud83d\udccf <strong>Messungenauigkeit:</strong> Waagen, Messzylinder und andere Ger\u00e4te haben Ungenauigkeiten</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +

        '<div style="background:#e1f5fe; padding:12px; border-radius:4px; border-left:4px solid #03A9F4;">' +
          '<h5 style="color:#0277BD; margin-top:0;"><i class="fa fa-lightbulb-o"></i> Tipps & H\u00e4ufige Fehler</h5>' +
          '<ul style="margin-bottom:0;">' +
            '<li>\u2705 <strong>Richtig:</strong> Die praktische Masse kann nie gr\u00f6\u00dfer als die theoretische sein (au\u00dfer bei Messfehlern)</li>' +
            '<li>\u2705 <strong>Richtig:</strong> Die Ausbeute wird als Prozentsatz angegeben, nicht als Dezimalzahl</li>' +
            '<li>\u274c <strong>Falsch:</strong> Theoretische und praktische Masse vertauschen</li>' +
            '<li>\u274c <strong>Falsch:</strong> Das "\u00d7100%" vergessen und als Dezimalzahl angeben</li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-success btn-sm" onclick="exportYieldToPDF()" style="margin-top:15px;">' +
        '<i class="fa fa-file-pdf-o"></i> Als PDF exportieren' +
      '</button>' +
    '</div>';

  saveToHistory('Ausbeute', yield_pct.toFixed(2) + '% (' + act + 'g / ' + theo + 'g)');
}


function toggleYieldExplanation() {
  const explanation = document.getElementById('yield-explanation');
  if (explanation) {
    explanation.style.display = explanation.style.display === 'none' ? 'block' : 'none';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcYieldValue };
}
