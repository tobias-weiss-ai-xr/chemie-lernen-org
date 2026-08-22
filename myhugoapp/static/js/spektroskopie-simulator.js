/**
 * Spektroskopie-Simulator
 * IR, NMR, Mass Spec spectral simulation and visualization
 */

(function () {
  'use strict';

  /* global Chart */
  var irChart = null;
  var nmrChart = null;
  var msChart = null;

  // --- Spectral Data ---

  var irData = {
    ethanol: {
      name: 'Ethanol',
      peaks: [
        { wavenumber: 3320, transmittance: 15, label: 'O-H (breit)' },
        { wavenumber: 2970, transmittance: 40, label: 'C-H (Valenz)' },
        { wavenumber: 2880, transmittance: 45, label: 'C-H (Valenz)' },
        { wavenumber: 1450, transmittance: 35, label: 'C-H (Deformation)' },
        { wavenumber: 1380, transmittance: 40, label: 'C-H (Deformation)' },
        { wavenumber: 1050, transmittance: 20, label: 'C-O (Valenz)' },
        { wavenumber: 880, transmittance: 60, label: 'C-C (Gerüst)' },
      ],
    },
    acetone: {
      name: 'Aceton',
      peaks: [
        { wavenumber: 2960, transmittance: 35, label: 'C-H (Valenz)' },
        { wavenumber: 2920, transmittance: 38, label: 'C-H (Valenz)' },
        { wavenumber: 1715, transmittance: 5, label: 'C=O (stark)' },
        { wavenumber: 1420, transmittance: 40, label: 'C-H (Deformation)' },
        { wavenumber: 1360, transmittance: 45, label: 'C-H (Deformation)' },
        { wavenumber: 1215, transmittance: 30, label: 'C-C (Gerüst)' },
      ],
    },
    'acetic-acid': {
      name: 'Essigsäure',
      peaks: [
        { wavenumber: 3100, transmittance: 10, label: 'O-H (breit, assoziiert)' },
        { wavenumber: 2940, transmittance: 40, label: 'C-H (Valenz)' },
        { wavenumber: 1710, transmittance: 3, label: 'C=O (Säure, stark)' },
        { wavenumber: 1420, transmittance: 35, label: 'C-O-H (Deformation)' },
        { wavenumber: 1290, transmittance: 25, label: 'C-O (Valenz)' },
        { wavenumber: 1180, transmittance: 30, label: 'C-O (Valenz)' },
      ],
    },
    benzene: {
      name: 'Benzen',
      peaks: [
        { wavenumber: 3050, transmittance: 30, label: 'C-H (aromatisch)' },
        { wavenumber: 1960, transmittance: 80, label: 'C=C (Obertöne)' },
        { wavenumber: 1815, transmittance: 85, label: 'C=C (Obertöne)' },
        { wavenumber: 1670, transmittance: 70, label: 'C=C (Valenz)' },
        { wavenumber: 1480, transmittance: 25, label: 'C=C (Valenz)' },
        { wavenumber: 1440, transmittance: 30, label: 'C=C (Valenz)' },
        { wavenumber: 1035, transmittance: 50, label: 'C-H (Deformation)' },
        { wavenumber: 740, transmittance: 15, label: 'C-H (out-of-plane)' },
        { wavenumber: 690, transmittance: 20, label: 'C-H (out-of-plane)' },
      ],
    },
    toluene: {
      name: 'Toluol',
      peaks: [
        { wavenumber: 3060, transmittance: 30, label: 'C-H (aromatisch)' },
        { wavenumber: 2960, transmittance: 35, label: 'C-H (Methyl)' },
        { wavenumber: 2920, transmittance: 38, label: 'C-H (Methyl)' },
        { wavenumber: 1605, transmittance: 40, label: 'C=C (Valenz)' },
        { wavenumber: 1495, transmittance: 25, label: 'C=C (Valenz)' },
        { wavenumber: 1460, transmittance: 30, label: 'C-H (Deformation)' },
        { wavenumber: 1380, transmittance: 45, label: 'C-H (Deformation, Methyl)' },
        { wavenumber: 730, transmittance: 10, label: 'C-H (out-of-plane)' },
        { wavenumber: 695, transmittance: 15, label: 'C-H (out-of-plane)' },
      ],
    },
    cyclohexane: {
      name: 'Cyclohexan',
      peaks: [
        { wavenumber: 2930, transmittance: 10, label: 'C-H (Valenz)' },
        { wavenumber: 2855, transmittance: 15, label: 'C-H (Valenz)' },
        { wavenumber: 1450, transmittance: 25, label: 'C-H (Deformation)' },
        { wavenumber: 1350, transmittance: 40, label: 'C-H (Deformation)' },
        { wavenumber: 860, transmittance: 55, label: 'C-C (Gerüst)' },
      ],
    },
  };

  var nmrData = {
    ethanol: {
      name: 'Ethanol',
      peaks: [
        { ppm: 1.2, intensity: 3, multiplicity: 't', label: 'CH3 (Triplett)' },
        { ppm: 3.7, intensity: 2, multiplicity: 'q', label: 'CH2 (Quartett)' },
        { ppm: 5.0, intensity: 1, multiplicity: 's', label: 'OH (Singulett)' },
      ],
    },
    acetone: {
      name: 'Aceton',
      peaks: [{ ppm: 2.1, intensity: 6, multiplicity: 's', label: 'CH3 (Singulett)' }],
    },
    'ethyl-acetate': {
      name: 'Essigsäureethylester',
      peaks: [
        { ppm: 1.2, intensity: 3, multiplicity: 't', label: 'CH3-CH2 (Triplett)' },
        { ppm: 2.0, intensity: 3, multiplicity: 's', label: 'CH3-CO (Singulett)' },
        { ppm: 4.1, intensity: 2, multiplicity: 'q', label: 'CH2-O (Quartett)' },
      ],
    },
    toluene: {
      name: 'Toluol',
      peaks: [
        { ppm: 2.3, intensity: 3, multiplicity: 's', label: 'CH3 (Singulett)' },
        { ppm: 7.1, intensity: 5, multiplicity: 'm', label: 'Aromatische H (Multiplett)' },
      ],
    },
    benzene: {
      name: 'Benzen',
      peaks: [{ ppm: 7.3, intensity: 6, multiplicity: 's', label: 'Aromatische H (Singulett)' }],
    },
  };

  var msData = {
    ethanol: {
      name: 'Ethanol',
      molecularIon: 46,
      peaks: [
        { mz: 46, intensity: 20, label: 'M⁺' },
        { mz: 45, intensity: 50, label: 'M-H' },
        { mz: 31, intensity: 100, label: 'CH2OH⁺ (Basispeak)' },
        { mz: 29, intensity: 40, label: 'C2H5⁺' },
        { mz: 27, intensity: 25, label: 'C2H3⁺' },
        { mz: 15, intensity: 15, label: 'CH3⁺' },
      ],
    },
    acetone: {
      name: 'Aceton',
      molecularIon: 58,
      peaks: [
        { mz: 58, intensity: 30, label: 'M⁺' },
        { mz: 43, intensity: 100, label: 'CH3CO⁺ (Basispeak)' },
        { mz: 15, intensity: 20, label: 'CH3⁺' },
      ],
    },
    toluene: {
      name: 'Toluol',
      molecularIon: 92,
      peaks: [
        { mz: 92, intensity: 60, label: 'M⁺' },
        { mz: 91, intensity: 100, label: 'C7H7⁺ (Basispeak, Tropylium)' },
        { mz: 65, intensity: 20, label: 'C5H5⁺' },
        { mz: 39, intensity: 15, label: 'C3H3⁺' },
      ],
    },
    benzene: {
      name: 'Benzen',
      molecularIon: 78,
      peaks: [
        { mz: 78, intensity: 100, label: 'M⁺ (Basispeak)' },
        { mz: 77, intensity: 20, label: 'M-H' },
        { mz: 52, intensity: 15, label: 'C4H4⁺' },
        { mz: 39, intensity: 10, label: 'C3H3⁺' },
      ],
    },
    'ethyl-acetate': {
      name: 'Essigsäureethylester',
      molecularIon: 88,
      peaks: [
        { mz: 88, intensity: 5, label: 'M⁺ (schwach)' },
        { mz: 73, intensity: 10, label: 'M-CH3' },
        { mz: 61, intensity: 20, label: 'CH3COOH2⁺' },
        { mz: 45, intensity: 40, label: 'COOH⁺' },
        { mz: 43, intensity: 100, label: 'CH3CO⁺ (Basispeak)' },
        { mz: 29, intensity: 30, label: 'C2H5⁺' },
      ],
    },
  };

  // --- IR Plot ---

  function plotIR(compound) {
    var data = irData[compound];
    if (!data) return;

    var ctx = document.getElementById('ir-plot').getContext('2d');
    if (irChart) irChart.destroy();

    var peaks = data.peaks.sort(function (a, b) {
      return a.wavenumber - b.wavenumber;
    });
    var labels = [];
    var values = [];
    var backgroundColors = [];

    peaks.forEach(function (p) {
      labels.push(p.wavenumber);
      values.push(p.transmittance);
      backgroundColors.push(p.transmittance < 30 ? 'rgba(231,76,60,0.6)' : 'rgba(52,152,219,0.4)');
    });

    irChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Transmission (%)',
            data: values,
            backgroundColor: backgroundColors,
            borderColor: '#2c3e50',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            title: { display: true, text: 'Transmission (%)' },
            min: 0,
            max: 100,
            reverse: false,
          },
          y: {
            title: { display: true, text: 'Wellenzahl (cm⁻¹)' },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: function (context) {
                var idx = context.dataIndex;
                return peaks[idx] ? peaks[idx].label : '';
              },
            },
          },
        },
      },
    });

    renderIRPeakTable(data);
  }

  function renderIRPeakTable(data) {
    var container = document.getElementById('ir-peak-table');
    var html = '<h4>Peak-Zuordnung</h4>';
    html +=
      '<table class="table table-sm"><thead><tr><th>Wellenzahl (cm⁻¹)</th><th>Transmission (%)</th><th>Zuordnung</th></tr></thead><tbody>';
    data.peaks
      .sort(function (a, b) {
        return a.wavenumber - b.wavenumber;
      })
      .forEach(function (p) {
        html +=
          '<tr><td>' +
          p.wavenumber +
          '</td><td>' +
          p.transmittance +
          '</td><td>' +
          p.label +
          '</td></tr>';
      });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // --- NMR Plot ---

  function plotNMR(compound) {
    var data = nmrData[compound];
    if (!data) return;

    var ctx = document.getElementById('nmr-plot').getContext('2d');
    if (nmrChart) nmrChart.destroy();

    var multiplicityLabels = { s: 's', d: 'd', t: 't', q: 'q', m: 'm' };

    var labels = data.peaks.map(function (p) {
      return p.ppm.toFixed(1) + ' (' + multiplicityLabels[p.multiplicity] + ')';
    });
    var values = data.peaks.map(function (p) {
      return p.intensity;
    });

    nmrChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Integral (relative Intensität)',
            data: values,
            backgroundColor: 'rgba(46,204,113,0.6)',
            borderColor: '#27ae60',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Chemische Verschiebung δ (ppm)' },
          },
          y: {
            title: { display: true, text: 'Intensität' },
            beginAtZero: true,
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: function (context) {
                var idx = context.dataIndex;
                return data.peaks[idx] ? data.peaks[idx].label : '';
              },
            },
          },
        },
      },
    });

    renderNMRPeakTable(data);
  }

  function renderNMRPeakTable(data) {
    var container = document.getElementById('nmr-peak-table');
    var multiplicityNames = {
      s: 'Singulett',
      d: 'Dublett',
      t: 'Triplett',
      q: 'Quartett',
      m: 'Multiplett',
    };
    var html = '<h4>NMR-Daten</h4>';
    html +=
      '<table class="table table-sm"><thead><tr><th>δ (ppm)</th><th>Multiplizität</th><th>H-Atome</th><th>Zuordnung</th></tr></thead><tbody>';
    data.peaks.forEach(function (p) {
      html +=
        '<tr><td>' +
        p.ppm +
        '</td><td>' +
        multiplicityNames[p.multiplicity] +
        '</td><td>' +
        p.intensity +
        '</td><td>' +
        p.label +
        '</td></tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // --- MS Plot ---

  function plotMS(compound) {
    var data = msData[compound];
    if (!data) return;

    var ctx = document.getElementById('ms-plot').getContext('2d');
    if (msChart) msChart.destroy();

    var labels = data.peaks.map(function (p) {
      return p.mz;
    });
    var values = data.peaks.map(function (p) {
      return p.intensity;
    });

    msChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Relative Intensität (%)',
            data: values,
            backgroundColor: 'rgba(155,89,182,0.6)',
            borderColor: '#8e44ad',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'm/z' },
            min: 0,
          },
          y: {
            title: { display: true, text: 'Relative Intensität' },
            beginAtZero: true,
            max: 100,
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: function (context) {
                var idx = context.dataIndex;
                return data.peaks[idx] ? data.peaks[idx].label : '';
              },
            },
          },
        },
      },
    });

    renderMSPeakTable(data);
  }

  function renderMSPeakTable(data) {
    var container = document.getElementById('ms-peak-table');
    var html = '<h4>Massenspektrum-Daten</h4>';
    html += '<p><strong>Molekülion (M⁺):</strong> m/z ' + data.molecularIon + '</p>';
    html +=
      '<table class="table table-sm"><thead><tr><th>m/z</th><th>Intensität (%)</th><th>Fragment</th></tr></thead><tbody>';
    data.peaks
      .sort(function (a, b) {
        return a.mz - b.mz;
      })
      .forEach(function (p) {
        html +=
          '<tr><td>' + p.mz + '</td><td>' + p.intensity + '</td><td>' + p.label + '</td></tr>';
      });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // --- Init ---

  function init() {
    // IR
    var irSelect = document.getElementById('ir-compound');
    if (irSelect) {
      irSelect.addEventListener('change', function () {
        plotIR(this.value);
      });
      plotIR(irSelect.value);
    }

    // NMR
    var nmrSelect = document.getElementById('nmr-compound');
    if (nmrSelect) {
      nmrSelect.addEventListener('change', function () {
        plotNMR(this.value);
      });
      plotNMR(nmrSelect.value);
    }

    // MS
    var msSelect = document.getElementById('ms-compound');
    if (msSelect) {
      msSelect.addEventListener('change', function () {
        plotMS(this.value);
      });
      plotMS(msSelect.value);
    }
  }

  if (typeof Chart !== 'undefined' && document.getElementById('ir-compound')) {
    init();
  } else if (document.getElementById('ir-compound')) {
    // Chart.js not loaded yet - wait a moment
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof Chart !== 'undefined') init();
    });
  }
})();
