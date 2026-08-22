/**
 * Gefahrstoffkennzeichnung
 * GHS hazard pictograms, H/P phrases explorer
 */

(function () {
  'use strict';

  var pictograms = [
    {
      id: 'ghs01',
      symbol: '&#x2622;',
      name: 'Explosiv',
      code: 'GHS01',
      desc: 'Explosionsgefährlich',
      detail: 'Für Stoffe, die von selbst explosionsfähig sind.',
      examples: ['TNT', 'Nitroglycerin', 'Wasserstoff'],
    },
    {
      id: 'ghs02',
      symbol: '&#x2600;',
      name: 'Entzündlich',
      code: 'GHS02',
      desc: 'Leicht entzündlich',
      detail: 'Für entzündbare Gase, Aerosole, Flüssigkeiten und Feststoffe.',
      examples: ['Aceton', 'Ethanol', 'Benzin', 'Wasserstoff'],
    },
    {
      id: 'ghs03',
      symbol: '&#x2677;',
      name: 'Oxidierend',
      code: 'GHS03',
      desc: 'Brandfördernd',
      detail: 'Für Stoffe, die Brände anderer Materialien verursachen oder fördern.',
      examples: ['Wasserstoffperoxid', 'Kaliumnitrat', 'Sauerstoff'],
    },
    {
      id: 'ghs04',
      symbol: '&#x23F1;',
      name: 'Gas unter Druck',
      code: 'GHS04',
      desc: 'Enthält Gas unter Druck',
      detail: 'Für Druckgase, verflüssigte oder tiefgekühlte Gase.',
      examples: ['Propan', 'Sauerstoffflasche', 'Stickstoff (flüssig)'],
    },
    {
      id: 'ghs05',
      symbol: '&#x26A1;',
      name: 'Ätzend',
      code: 'GHS05',
      desc: 'Korrosiv',
      detail: 'Für Stoffe, die Metalle angreifen oder Haut/Hautverätzung verursachen.',
      examples: ['Schwefelsäure', 'Natronlauge', 'Salzsäure'],
    },
    {
      id: 'ghs06',
      symbol: '&#x271D;',
      name: 'Akute Toxizität',
      code: 'GHS06',
      desc: 'Giftig',
      detail: 'Für akut toxische Stoffe mit sehr geringer letaler Dosis.',
      examples: ['Methanol', 'Blausäure', 'Arsen', 'Quecksilber'],
    },
    {
      id: 'ghs07',
      symbol: '&#x26A0;',
      name: 'Reizend',
      code: 'GHS07',
      desc: 'Gesundheitsschädlich',
      detail: 'Für reizende, hautsensibilisierende oder akut toxische Stoffe.',
      examples: ['Ammoniak', 'Chlor', 'Isopropanol'],
    },
    {
      id: 'ghs08',
      symbol: '&#x267B;',
      name: 'Gesundheitsgefahr',
      code: 'GHS08',
      desc: 'Langfristige Gesundheitsgefahr',
      detail: 'Für kanzerogene, mutagene, reproduktionstoxische oder sensibilisierende Stoffe.',
      examples: ['Benzen', 'Asbest', 'Formaldehyd', 'Bleiverbindungen'],
    },
    {
      id: 'ghs09',
      symbol: '&#x2655;',
      name: 'Umweltgefährlich',
      code: 'GHS09',
      desc: 'Gewässergefährdend',
      detail: 'Für aquatisch toxische Stoffe.',
      examples: ['Pflanzenschutzmittel', 'Quecksilber', 'Blei', 'Öl'],
    },
  ];

  var hPhrases = [
    { code: 'H200', text: 'Instabil, explosiv.', category: 'physical' },
    { code: 'H201', text: 'Explosiv, Gefahr der Massenexplosion.', category: 'physical' },
    { code: 'H202', text: 'Explosiv, große Gefahr der Splitterbildung.', category: 'physical' },
    {
      code: 'H203',
      text: 'Explosiv, Brand-, Explosions- und Splittergefahr.',
      category: 'physical',
    },
    { code: 'H220', text: 'Extrem entzündbares Gas.', category: 'physical' },
    { code: 'H221', text: 'Entzündbares Gas.', category: 'physical' },
    { code: 'H222', text: 'Extrem entzündbares Aerosol.', category: 'physical' },
    { code: 'H224', text: 'Flüssigkeit und Dampf extrem entzündbar.', category: 'physical' },
    { code: 'H225', text: 'Flüssigkeit und Dampf leicht entzündbar.', category: 'physical' },
    { code: 'H226', text: 'Flüssigkeit und Dampf entzündbar.', category: 'physical' },
    { code: 'H228', text: 'Entzündbarer Feststoff.', category: 'physical' },
    { code: 'H240', text: 'Erwärmung kann Explosion verursachen.', category: 'physical' },
    {
      code: 'H241',
      text: 'Erwärmung kann Brand oder Explosion verursachen.',
      category: 'physical',
    },
    { code: 'H242', text: 'Erwärmung kann Brand verursachen.', category: 'physical' },
    {
      code: 'H270',
      text: 'Kann Brand verursachen oder verstärken; Oxidationsmittel.',
      category: 'physical',
    },
    {
      code: 'H271',
      text: 'Kann Brand oder Explosion verursachen; starkes Oxidationsmittel.',
      category: 'physical',
    },
    { code: 'H272', text: 'Kann Brand verstärken; Oxidationsmittel.', category: 'physical' },
    { code: 'H290', text: 'Kann gegenüber Metallen korrosiv sein.', category: 'physical' },
    { code: 'H300', text: 'Lebensgefahr bei Verschlucken.', category: 'health' },
    { code: 'H301', text: 'Giftig bei Verschlucken.', category: 'health' },
    { code: 'H302', text: 'Gesundheitsschädlich bei Verschlucken.', category: 'health' },
    {
      code: 'H304',
      text: 'Kann bei Verschlucken und Eindringen in die Atemwege tödlich sein.',
      category: 'health',
    },
    { code: 'H310', text: 'Lebensgefahr bei Hautkontakt.', category: 'health' },
    { code: 'H311', text: 'Giftig bei Hautkontakt.', category: 'health' },
    { code: 'H312', text: 'Gesundheitsschädlich bei Hautkontakt.', category: 'health' },
    {
      code: 'H314',
      text: 'Verursacht schwere Verätzungen der Haut und schwere Augenschäden.',
      category: 'health',
    },
    { code: 'H315', text: 'Verursacht Hautreizungen.', category: 'health' },
    { code: 'H317', text: 'Kann allergische Hautreaktionen verursachen.', category: 'health' },
    { code: 'H318', text: 'Verursacht schwere Augenschäden.', category: 'health' },
    { code: 'H319', text: 'Verursacht schwere Augenreizung.', category: 'health' },
    { code: 'H330', text: 'Lebensgefahr bei Einatmen.', category: 'health' },
    { code: 'H331', text: 'Giftig bei Einatmen.', category: 'health' },
    { code: 'H332', text: 'Gesundheitsschädlich bei Einatmen.', category: 'health' },
    {
      code: 'H334',
      text: 'Kann bei Einatmen Allergie, asthmaartige Symptome oder Atembeschwerden verursachen.',
      category: 'health',
    },
    { code: 'H335', text: 'Kann die Atemwege reizen.', category: 'health' },
    { code: 'H336', text: 'Kann Schläfrigkeit und Benommenheit verursachen.', category: 'health' },
    { code: 'H340', text: 'Kann genetische Defekte verursachen.', category: 'health' },
    { code: 'H341', text: 'Kann vermutlich genetische Defekte verursachen.', category: 'health' },
    { code: 'H350', text: 'Kann Krebs erzeugen.', category: 'health' },
    { code: 'H351', text: 'Kann vermutlich Krebs erzeugen.', category: 'health' },
    {
      code: 'H360',
      text: 'Kann die Fruchtbarkeit beeinträchtigen oder das Kind im Mutterleib schädigen.',
      category: 'health',
    },
    {
      code: 'H361',
      text: 'Kann vermutlich die Fruchtbarkeit beeinträchtigen oder das Kind im Mutterleib schädigen.',
      category: 'health',
    },
    { code: 'H370', text: 'Schädigt die Organe.', category: 'health' },
    { code: 'H371', text: 'Kann die Organe schädigen.', category: 'health' },
    {
      code: 'H372',
      text: 'Schädigt die Organe bei längerer oder wiederholter Exposition.',
      category: 'health',
    },
    {
      code: 'H373',
      text: 'Kann die Organe schädigen bei längerer oder wiederholter Exposition.',
      category: 'health',
    },
    { code: 'H400', text: 'Sehr giftig für Wasserorganismen.', category: 'environment' },
    {
      code: 'H410',
      text: 'Sehr giftig für Wasserorganismen mit langfristiger Wirkung.',
      category: 'environment',
    },
    {
      code: 'H411',
      text: 'Giftig für Wasserorganismen mit langfristiger Wirkung.',
      category: 'environment',
    },
    {
      code: 'H412',
      text: 'Schädlich für Wasserorganismen mit langfristiger Wirkung.',
      category: 'environment',
    },
    {
      code: 'H413',
      text: 'Kann für Wasserorganismen schädlich sein mit langfristiger Wirkung.',
      category: 'environment',
    },
    { code: 'H420', text: 'Schädigt die Ozonschicht.', category: 'environment' },
  ];

  var pPhrases = [
    {
      code: 'P101',
      text: 'Ist ärztlicher Rat erforderlich, Verpackung oder Kennzeichnungsetikett bereithalten.',
    },
    { code: 'P102', text: 'Darf nicht in die Hände von Kindern gelangen.' },
    { code: 'P103', text: 'Vor Gebrauch Kennzeichnungsetikett lesen.' },
    { code: 'P201', text: 'Vor Gebrauch besondere Anweisungen einholen.' },
    { code: 'P202', text: 'Vor Gebrauch alle Sicherheitshinweise lesen und verstehen.' },
    {
      code: 'P210',
      text: 'Von Hitze, heißen Oberflächen, Funken, offenen Flammen und anderen Zündquellen fernhalten. Nicht rauchen.',
    },
    { code: 'P211', text: 'Nicht gegen offene Flamme oder andere Zündquelle sprühen.' },
    { code: 'P220', text: 'Von Kleidung und anderen brennbaren Materialien fernhalten.' },
    { code: 'P221', text: 'Von brennbaren Stoffen fernhalten.' },
    { code: 'P222', text: 'Kontakt mit Luft nicht zulassen.' },
    { code: 'P223', text: 'Kontakt mit Wasser vermeiden.' },
    { code: 'P230', text: 'Feucht halten mit ...' },
    { code: 'P231', text: 'Unter inertem Gas handhaben.' },
    { code: 'P232', text: 'Vor Feuchtigkeit schützen.' },
    { code: 'P233', text: 'Behälter dicht verschlossen halten.' },
    { code: 'P234', text: 'Nur in Originalverpackung aufbewahren.' },
    { code: 'P235', text: 'Kühl halten.' },
    { code: 'P240', text: 'Behälter und zu befüllende Anlage erden.' },
    { code: 'P241', text: 'Explosionsgeschützte Geräte verwenden.' },
    { code: 'P242', text: 'Funkenarmes Werkzeug verwenden.' },
    { code: 'P243', text: 'Maßnahmen gegen elektrostatische Entladungen treffen.' },
    { code: 'P244', text: 'Druckminderer frei von Fett und Öl halten.' },
    { code: 'P250', text: 'Nicht schleifen, stoßen, reiben oder fallen lassen.' },
    { code: 'P251', text: 'Behälter steht unter Druck: Nicht durchstechen oder verbrennen.' },
    { code: 'P260', text: 'Staub/Rauch/Gas/Nebel/Dampf/Aerosol nicht einatmen.' },
    { code: 'P261', text: 'Einatmen von Staub/Rauch/Gas/Nebel/Dampf/Aerosol vermeiden.' },
    {
      code: 'P262',
      text: 'Nicht in die Augen, auf die Haut oder auf die Kleidung gelangen lassen.',
    },
    { code: 'P263', text: 'Während der Schwangerschaft und Stillzeit vermeiden.' },
    { code: 'P264', text: 'Nach Gebrauch Hände gründlich waschen.' },
    { code: 'P270', text: 'Bei Gebrauch nicht essen, trinken oder rauchen.' },
    { code: 'P271', text: 'Nur im Freien oder in gut belüfteten Räumen verwenden.' },
    {
      code: 'P272',
      text: 'Kontaminierte Arbeitskleidung nicht außerhalb des Arbeitsplatzes tragen.',
    },
    { code: 'P273', text: 'Freisetzung in die Umwelt vermeiden.' },
    { code: 'P280', text: 'Schutzhandschuhe/Schutzkleidung/Augenschutz/Gesichtsschutz tragen.' },
    { code: 'P281', text: 'Vorgeschriebene persönliche Schutzausrüstung verwenden.' },
    { code: 'P282', text: 'Kälteschutzhandschuhe und Schutzbrille tragen.' },
    { code: 'P284', text: 'Atemschutzgerät tragen.' },
    { code: 'P301', text: 'BEI VERSCHLUCKEN:' },
    { code: 'P302', text: 'BEI HAUTKONTAKT:' },
    { code: 'P303', text: 'BEI HAUTKONTAKT (oder Haar):' },
    { code: 'P304', text: 'BEI EINATMEN:' },
    { code: 'P305', text: 'BEI KONTAKT MIT DEN AUGEN:' },
    { code: 'P306', text: 'BEI KONTAKT MIT DER KLEIDUNG:' },
    { code: 'P308', text: 'BEI EXPOSITION ODER BESORGNIS:' },
    { code: 'P309', text: 'BEI EXPOSITION:' },
    { code: 'P310', text: 'Sofort Giftinformationszentrum oder Arzt anrufen.' },
    { code: 'P311', text: 'Giftinformationszentrum oder Arzt anrufen.' },
    { code: 'P312', text: 'Bei Unwohlsein Giftinformationszentrum oder Arzt anrufen.' },
    { code: 'P313', text: 'Ärztlichen Rat einholen/ärztliche Hilfe hinzuziehen.' },
    { code: 'P314', text: 'Bei Unwohlsein ärztlichen Rat einholen/ärztliche Hilfe hinzuziehen.' },
    { code: 'P315', text: 'Sofort ärztlichen Rat einholen/ärztliche Hilfe hinzuziehen.' },
    { code: 'P320', text: 'Besondere Behandlung dringend erforderlich (siehe ...).' },
    { code: 'P321', text: 'Besondere Behandlung (siehe ...).' },
    { code: 'P322', text: 'Besondere Maßnahmen (siehe ...).' },
    { code: 'P330', text: 'Mund ausspülen.' },
    { code: 'P331', text: 'KEIN Erbrechen herbeiführen.' },
    { code: 'P332', text: 'Bei Hautreizung:' },
    { code: 'P333', text: 'Bei Hautreizung oder -ausschlag:' },
    { code: 'P334', text: 'In kaltes Wasser tauchen oder nassen Verband anlegen.' },
    { code: 'P335', text: 'Lose Partikel von der Haut abbürsten.' },
    { code: 'P336', text: 'Vereiste Körperteile in lauwarmem Wasser auftauen.' },
    { code: 'P337', text: 'Bei anhaltender Augenreizung:' },
    { code: 'P338', text: 'Eventuell Kontaktlinsen entfernen. Weiter ausspülen.' },
    {
      code: 'P340',
      text: 'Die Person an die frische Luft bringen und für ungehinderte Atmung sorgen.',
    },
    { code: 'P342', text: 'Bei Atemproblemen:' },
    { code: 'P351', text: 'Einige Minuten lang behutsam mit Wasser ausspülen.' },
    { code: 'P352', text: 'Mit viel Wasser und Seife waschen.' },
    { code: 'P353', text: 'Haut mit Wasser abwaschen/duschen.' },
    { code: 'P360', text: 'Kontaminierte Kleidung und Haut sofort mit viel Wasser abwaschen.' },
    { code: 'P361', text: 'Alle kontaminierten Kleidungsstücke sofort ausziehen.' },
    { code: 'P362', text: 'Kontaminierte Kleidung ausziehen und vor erneutem Tragen waschen.' },
    { code: 'P363', text: 'Kontaminierte Kleidung vor erneutem Tragen waschen.' },
    { code: 'P370', text: 'Bei Brand:' },
    { code: 'P371', text: 'Bei Großbrand und großen Mengen:' },
    { code: 'P372', text: 'Explosionsgefahr bei Brand.' },
    { code: 'P373', text: 'Brand NICHT bekämpfen, wenn Explosionsgefahr besteht.' },
    { code: 'P374', text: 'Brand von angemessener Entfernung bekämpfen.' },
    { code: 'P375', text: 'Wegen Explosionsgefahr Brand aus der Entfernung bekämpfen.' },
    { code: 'P376', text: 'Undichtigkeit beseitigen, wenn gefahrlos möglich.' },
    {
      code: 'P377',
      text: 'Brand von ausströmendem Gas: Nicht löschen, bis Undichtigkeit beseitigt werden kann.',
    },
    { code: 'P378', text: 'Zum Löschen ... verwenden.' },
    { code: 'P380', text: 'Umgebung räumen.' },
    { code: 'P381', text: 'Alle Zündquellen entfernen, wenn gefahrlos möglich.' },
    { code: 'P390', text: 'Verschüttete Mengen aufnehmen, um Umweltschäden zu vermeiden.' },
    { code: 'P391', text: 'Ausgetretene/gelöste/verschüttete Mengen aufnehmen.' },
    { code: 'P401', text: 'Entsorgung gemäß den behördlichen Vorschriften.' },
    { code: 'P402', text: 'An einem trockenen Ort aufbewahren.' },
    { code: 'P403', text: 'An einem gut belüfteten Ort aufbewahren.' },
    { code: 'P404', text: 'Verschlossen aufbewahren.' },
    { code: 'P405', text: 'Unter Verschluss aufbewahren.' },
    { code: 'P406', text: 'In korrosionsbeständigem Behälter aufbewahren.' },
    { code: 'P407', text: 'Luftspalt zwischen Stapeln/Paletten lassen.' },
    { code: 'P410', text: 'Vor Sonnenbestrahlung schützen.' },
    { code: 'P411', text: 'Bei Temperaturen nicht über ... °C aufbewahren.' },
    { code: 'P412', text: 'Nicht Temperaturen über 50 °C aussetzen.' },
    { code: 'P413', text: 'Schüttgut bei Temperaturen nicht über ... °C aufbewahren.' },
    { code: 'P420', text: 'Von anderen Materialien fernhalten.' },
    { code: 'P422', text: 'Inhalt in/unter ... aufbewahren.' },
    { code: 'P501', text: 'Inhalt/Behälter gemäß den behördlichen Vorschriften entsorgen.' },
  ];

  // --- Rendering ---

  function renderPictograms() {
    var grid = document.getElementById('pictogram-grid');
    if (!grid) return;

    var html = '';
    pictograms.forEach(function (p) {
      html += '<div class="col-md-4 col-sm-6">';
      html += '  <div class="ghs-pictogram" data-id="' + p.id + '">';
      html += '    <div class="pictogram-symbol">' + p.symbol + '</div>';
      html += '    <div class="pictogram-name">' + p.name + '</div>';
      html += '    <div class="pictogram-code">' + p.code + '</div>';
      html += '  </div>';
      html += '</div>';
    });
    grid.innerHTML = html;

    grid.querySelectorAll('.ghs-pictogram').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        showPictogramDetail(id);
      });
    });
  }

  function showPictogramDetail(id) {
    var detail = document.getElementById('pictogram-detail');
    var p = pictograms.filter(function (p) {
      return p.id === id;
    })[0];
    if (!p) return;

    var html = '<div class="ghs-detail-card">';
    html += '  <div class="row">';
    html += '    <div class="col-md-2 text-center">';
    html += '      <div class="ghs-detail-symbol">' + p.symbol + '</div>';
    html += '    </div>';
    html += '    <div class="col-md-10">';
    html += '      <h3>' + p.code + ' - ' + p.name + '</h3>';
    html += '      <p><strong>' + p.desc + '</strong></p>';
    html += '      <p>' + p.detail + '</p>';
    html += '      <h4>Beispielstoffe:</h4>';
    html += '      <ul>';
    p.examples.forEach(function (ex) {
      html += '        <li>' + ex + '</li>';
    });
    html += '      </ul>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    detail.innerHTML = html;
    detail.style.display = 'block';
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderHPhrases(_filter) {
    var tbody = document.getElementById('h-phrases-body');
    if (!tbody) return;

    var category = document.getElementById('h-category').value;
    var search = document.getElementById('h-search').value.toLowerCase().trim();

    var filtered = hPhrases.filter(function (h) {
      var matchCat = category === 'all' || h.category === category;
      var matchSearch =
        search === '' ||
        h.code.toLowerCase().indexOf(search) !== -1 ||
        h.text.toLowerCase().indexOf(search) !== -1;
      return matchCat && matchSearch;
    });

    var html = '';
    filtered.forEach(function (h) {
      var piktogram = '';
      if (h.category === 'physical') piktogram = 'GHS01, GHS02, GHS03, GHS04';
      else if (h.category === 'health') piktogram = 'GHS05, GHS06, GHS07, GHS08';
      else if (h.category === 'environment') piktogram = 'GHS09';
      html +=
        '<tr><td><strong>' +
        h.code +
        '</strong></td><td>' +
        h.text +
        '</td><td>' +
        h.category +
        '</td><td>' +
        piktogram +
        '</td></tr>';
    });
    tbody.innerHTML = html;
  }

  function renderPPhrases() {
    var tbody = document.getElementById('p-phrases-body');
    if (!tbody) return;

    var search = document.getElementById('p-search').value.toLowerCase().trim();

    var filtered = pPhrases.filter(function (p) {
      return (
        search === '' ||
        p.code.toLowerCase().indexOf(search) !== -1 ||
        p.text.toLowerCase().indexOf(search) !== -1
      );
    });

    var html = '';
    filtered.forEach(function (p) {
      html += '<tr><td><strong>' + p.code + '</strong></td><td>' + p.text + '</td></tr>';
    });
    tbody.innerHTML = html;
  }

  // --- Init ---

  function init() {
    renderPictograms();

    var hCategory = document.getElementById('h-category');
    var hSearch = document.getElementById('h-search');
    var pSearch = document.getElementById('p-search');

    if (hCategory)
      hCategory.addEventListener('change', function () {
        renderHPhrases();
      });
    if (hSearch)
      hSearch.addEventListener('input', function () {
        renderHPhrases();
      });
    if (pSearch)
      pSearch.addEventListener('input', function () {
        renderPPhrases();
      });

    renderHPhrases();
    renderPPhrases();
  }

  if (document.getElementById('pictogram-grid')) {
    init();
  }
})();
