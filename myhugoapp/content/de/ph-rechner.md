---
title: "pH-Rechner"
description: "Interaktiver pH-Rechner für Säuren und Basen"
interaktiv: true
layout: "ph-rechner"
---

<script src="/js/chemistry-calculator-framework.js"></script>
<script>
// Initialize pH calculator using framework
const phCalculator = new ChemistryCalculator({
  title: 'pH-Rechner',
  inputFields: [
    {
      id: 'hplus-input',
      label: 'H⁺-Konzentration (Mol/L)',
      type: 'number',
      validation: {
        min: 0,
        max: 14,
        errorMessage: 'Bitte geben Sie einen gültigen H⁺-Platz-Wert (0-14 Mol/L) ein.'
      }
    },
    {
      id: 'ohminus-input',
      label: 'OH⁻-Platz (Mol/L)',
      type: 'number',
      validation: {
        min: 0,
        max: 14,
        errorMessage: 'Bitte geben Sie einen gültigen OH⁻-Platz-Wert (0-14 Mol/L) ein.'
      }
    }
  ],
  resultFields: [
    {
      id: 'hplus-result',
      label: 'pH-Wert',
      format: value => `${value} pH`
    },
    {
      id: 'ohminus-result',
      label: 'pH-Wert',
      format: value => `${value} pH`
    }
  ]
  },
  calculations: {
    calculateFromInputs: (inputs) => {
      // H+ calculation
      const hplus = inputs['hplus-input'];
      if (hplus !== undefined && hplus > 0) {
        const h = -Math.log10(hplus);
        const ph = -h;
        return {
          result: ph,
          explanation: `pH = -log₁₀(${h}) = ${(-h).toFixed(2)}`
        };
      }
      
      // OH- calculation
      const ohminus = inputs['ohminus-input'];
      if (ohminus !== undefined && ohminus > 0 && ohminus <= 14) {
        const poh = -Math.log10(ohminus);
        const ph = 14 - poh;
        return {
          result: ph,
          explanation: `pH = 14 - pOH = ${ph.toFixed(2)}`
        };
      }
      
      // Return null for pOH calculation (not implemented yet)
      return null;
    }
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  phCalculator.init();
});
</script>

<style>
/* pH Calculator specific styles */
.ph-scale {
  width: 100%;
  height: 6px;
  background: linear-gradient(to right, #4CAF50, #45a049);
  border-radius: 3px;
  margin-bottom: 10px;
}

.ph-indicator {
  width: 8px;
  height: 8px;
  background: #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  position: absolute;
  left: calc(50%);
  transform: translateX(-50%);
}

.ph-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #007bff;
  min-height: 1.5rem;
}

.result-panel {
  background: #f8f9fa;
  border: 1px solid #e1f5e3;
  border-radius: 8px;
  padding: 20px;
  margin: 15px 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.result-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
}

.calculation-details {
  background: #e3f2fd;
  border: 1px solid #d1e3f2;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
}

.educational-info {
  background: #e8f5e9;
  border-left: 4px solid #007bff;
  padding: 15px;
  margin: 10px 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.tab-pane {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}

.tab-pane.active {
  background: #f8f9fa;
}

/* Override framework defaults for this specific calculator */
.chemistry-calculator .input-group {
  background: #f8f9fa;
}

.chemistry-calculator .result-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chemistry-calculator .tab-content {
  background: #f8f9fa;
}

/* Update framework default results styling */
.result-panel {
  border-color: #2c3e50 !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.result-value {
  color: #2c3e50 !important;
}

.educational-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}
</style>

<script src="/js/chemistry-utils.js"></script>
<script src="/js/ph-rechner.js"></script>
</body>
</html>