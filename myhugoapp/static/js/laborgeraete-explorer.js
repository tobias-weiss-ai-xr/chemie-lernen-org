/**
 * Laborgeräte-Explorer
 * Interactive lab equipment explorer with categories and descriptions
 */

(function () {
  'use strict';

  const equipment = [
    { id: 'becherglas', name: 'Becherglas', cat: 'glas', desc: 'Zylindrisches Gefäß mit Ausgießer zum Mischen, Erwärmen und Reagieren von Substanzen.', usage: 'Mischen, Erhitzen, Titration' },
    { id: 'erlenmeyer', name: 'Erlenmeyerkolben', cat: 'glas', desc: 'Konischer Kolben mit schmalem Hals für Titrationen und Erhitzen.', usage: 'Titration, Erhitzen, Aufbewahren' },
    { id: 'rundkolben', name: 'Rundkolben', cat: 'glas', desc: 'Rundbodiger Kolben für Destillation und Reaktionen unter Rückfluss.', usage: 'Destillation, Rückfluss, Synthese' },
    { id: 'messkolben', name: 'Messkolben', cat: 'glas', desc: 'Präzises Volumenmessgerät mit Eichmarke.', usage: 'Herstellung von Maßlösungen, Verdünnungen' },
    { id: 'burette', name: 'Bürette', cat: 'glas', desc: 'Langes, graduiertes Rohr mit Hahn zur präzisen Flüssigkeitszugabe.', usage: 'Titration, präzise Dosierung' },
    { id: 'pipette', name: 'Pipette', cat: 'glas', desc: 'Messgerät zur Aufnahme und Abgabe genauer Flüssigkeitsvolumina.', usage: 'Volumenmessung, Probenvorbereitung' },
    { id: 'zylinder', name: 'Messzylinder', cat: 'glas', desc: 'Zylindrisches Gefäß mit Graduierung für grobe Volumenmessung.', usage: 'Volumenmessung' },
    { id: 'uhrglas', name: 'Uhrglas', cat: 'glas', desc: 'Gewölbte Glasscheibe zum Abdecken von Gefäßen oder Eindampfen.', usage: 'Abdecken, Eindampfen, Wägen' },
    { id: 'ph-meter', name: 'pH-Meter', cat: 'mess', desc: 'Elektronisches Gerät zur präzisen pH-Messung mit Glaselektrode.', usage: 'pH-Bestimmung, Säure-Base-Titration' },
    { id: 'waage', name: 'Analysenwaage', cat: 'mess', desc: 'Präzisionswaage mit 0.1 mg Genauigkeit für Einwaagen.', usage: 'Einwaage, Massenbestimmung' },
    { id: 'thermometer', name: 'Thermometer', cat: 'mess', desc: 'Misst die Temperatur von Substanzen, oft mit Quecksilber oder Digitalanzeige.', usage: 'Temperaturmessung' },
    { id: 'photometer', name: 'Photometer', cat: 'mess', desc: 'Optisches Gerät zur Messung der Lichtabsorption von Lösungen.', usage: 'Konzentrationsbestimmung (Lambert-Beer)' },
    { id: 'brenner', name: 'Bunsenbrenner', cat: 'heiz', desc: 'Gasbrenner mit regelbarer Flamme zum Erhitzen und Sterilisieren.', usage: 'Erhitzen, Sterilisieren, Flammenfärbung' },
    { id: 'heizplatte', name: 'Heizplatte', cat: 'heiz', desc: 'Elektrische Heizplatte mit Magnetrührer zum Erhitzen und Rühren.', usage: 'Erhitzen, Rühren' },
    { id: 'wasserbad', name: 'Wasserbad', cat: 'heiz', desc: 'Beheiztes Wasserbecken zum schonenden Erwärmen.', usage: 'Erwärmen auf konstante Temperatur' },
    { id: 'eisbad', name: 'Eisbad', cat: 'heiz', desc: 'Kühlbad aus Eis/Wasser für exotherme Reaktionen.', usage: 'Kühlung, Kristallisation' },
    { id: 'abzug', name: 'Abzug', cat: 'sicherheit', desc: 'Belüfteter Arbeitsplatz mit Glasfront zum sicheren Arbeiten mit Gasen/Dämpfen.', usage: 'Arbeiten mit flüchtigen Stoffen' },
    { id: 'brille', name: 'Sicherheitsbrille', cat: 'sicherheit', desc: 'Schutzbrille mit Seitenschutz für die Augen.', usage: 'Augenschutz bei allen Laborarbeiten' },
    { id: 'handschuhe', name: 'Schutzhandschuhe', cat: 'sicherheit', desc: 'Chemikalienbeständige Handschuhe (Latex, Nitril).', usage: 'Hautschutz bei Chemikalienkontakt' },
    { id: 'feuerloescher', name: 'Feuerlöscher', cat: 'sicherheit', desc: 'Kohlendioxid- oder Pulverlöscher für Laborbrände.', usage: 'Brandbekämpfung' },
    { id: 'dusche', name: 'Augendusche', cat: 'sicherheit', desc: 'Notdusche mit Augenausspüleinrichtung bei Chemikalienspritzern.', usage: 'Erste Hilfe bei Chemikalienkontakt' }
  ];

  function renderEquipment(category) {
    const grid = document.getElementById('equipment-grid');
    if (!grid) return;

    const filtered = category === 'all' ? equipment : equipment.filter(function (e) { return e.cat === category; });

    let html = '';
    filtered.forEach(function (e) {
      html += '<div class="col-md-4 col-sm-6">';
      html += '  <div class="equipment-card">';
      html += '    <div class="equipment-icon">';
      html += '      <i class="fa fa-' + getIcon(e.cat) + '"></i>';
      html += '    </div>';
      html += '    <h4>' + e.name + '</h4>';
      html += '    <p class="equipment-cat-badge badge-cat-' + e.cat + '">' + getCatName(e.cat) + '</p>';
      html += '    <p>' + e.desc + '</p>';
      html += '    <p class="equipment-usage"><strong>Verwendung:</strong> ' + e.usage + '</p>';
      html += '  </div>';
      html += '</div>';
    });

    grid.innerHTML = html;
  }

  function getIcon(cat) {
    switch (cat) {
      case 'glas': return 'glass';
      case 'mess': return 'tachometer';
      case 'heiz': return 'fire';
      case 'sicherheit': return 'shield';
      default: return 'flask';
    }
  }

  function getCatName(cat) {
    switch (cat) {
      case 'glas': return 'Glasgerät';
      case 'mess': return 'Messgerät';
      case 'heiz': return 'Heiz-/Kühlgerät';
      case 'sicherheit': return 'Sicherheit';
      default: return '';
    }
  }

  function init() {
    const categoryBtns = document.querySelectorAll('[data-cat]');
    categoryBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        categoryBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        renderEquipment(this.getAttribute('data-cat'));
      });
    });

    renderEquipment('all');
  }

  if (document.getElementById('equipment-grid')) {
    init();
  }

})();
