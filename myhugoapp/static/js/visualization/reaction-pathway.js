/**
 * Reaction Pathway Visualizer
 * Visualizes chemical reaction mechanisms and pathways
 */

const ReactionPathway = {
  /**
   * Create reaction pathway diagram
   */
  create(options = {}) {
    const {
      containerId,
      reaction = {
        reactants: [],
        products: [],
        intermediates: [],
        steps: [],
      },
      showEnergy = true,
      showMechanism = true,
      animated = true,
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    const diagram = document.createElement('div');
    diagram.className = 'reaction-pathway';

    // Create energy diagram
    if (showEnergy) {
      const energyDiagram = this.createEnergyDiagram(reaction);
      diagram.appendChild(energyDiagram);
    }

    // Create mechanism diagram
    if (showMechanism) {
      const mechanismDiagram = this.createMechanismDiagram(reaction);
      diagram.appendChild(mechanismDiagram);
    }

    container.appendChild(diagram);
    this.addStyles();

    if (animated) {
      this.animatePathway(diagram);
    }

    return diagram;
  },

  /**
   * Create energy diagram
   */
  createEnergyDiagram(reaction) {
    const container = document.createElement('div');
    container.className = 'energy-diagram';

    const title = document.createElement('h4');
    title.textContent = 'Energiediagramm';
    container.appendChild(title);

    const canvas = document.createElement('canvas');
    canvas.className = 'energy-canvas';
    container.appendChild(canvas);

    // Draw the diagram
    this.drawEnergyDiagram(canvas, reaction);

    return container;
  },

  /**
   * Draw energy diagram on canvas
   */
  drawEnergyDiagram(canvas, reaction) {
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 400;

    canvas.width = width;
    canvas.height = height;

    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    // Y axis (Energy)
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // X axis (Reaction coordinate)
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Reaktionskoordinate', width / 2, height - 20);

    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Energie', 0, 0);
    ctx.restore();

    // Calculate energy profile
    const energies = this.calculateEnergyProfile(reaction);

    // Find min and max for scaling
    const minEnergy = Math.min(...energies) - 10;
    const maxEnergy = Math.max(...energies) + 10;
    const energyRange = maxEnergy - minEnergy;

    // Draw energy curve
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3;
    ctx.beginPath();

    energies.forEach((energy, index) => {
      const x = padding + (index / (energies.length - 1)) * graphWidth;
      const y = height - padding - ((energy - minEnergy) / energyRange) * graphHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points and labels
    const steps = reaction.steps || [
      { name: 'Edukte', type: 'reactant' },
      { name: 'Übergangszustand', type: 'transition' },
      { name: 'Produkte', type: 'product' },
    ];

    steps.forEach((step, index) => {
      const x = padding + (index / (steps.length - 1)) * graphWidth;
      const energy = energies[index] || 0;
      const y = height - padding - ((energy - minEnergy) / energyRange) * graphHeight;

      // Draw point
      ctx.fillStyle = step.type === 'transition' ? '#F44336' : '#4CAF50';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw label
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(step.name, x, y - 15);
    });

    // Draw activation energy
    if (energies.length > 1) {
      const maxEnergyIndex = energies.indexOf(Math.max(...energies));
      const activationEnergy = energies[maxEnergyIndex] - energies[0];

      ctx.fillStyle = '#F44336';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Ea = ${activationEnergy.toFixed(1)} kJ/mol`, padding + 20, padding + 40);
    }
  },

  /**
   * Calculate energy profile for reaction
   */
  calculateEnergyProfile(reaction) {
    // Default values if not provided
    const steps = reaction.steps || [];

    if (steps.length === 0) {
      return [0, 50, -20]; // Reactant, TS, Product
    }

    return steps.map((step, _index) => {
      if (step.energy !== undefined) {
        return step.energy;
      }

      // Generate plausible energy profile
      switch (step.type) {
        case 'reactant':
          return 0;
        case 'transition':
          return 40 + Math.random() * 20;
        case 'intermediate':
          return 10 + Math.random() * 10;
        case 'product':
          return -20 - Math.random() * 10;
        default:
          return 0;
      }
    });
  },

  /**
   * Create mechanism diagram
   */
  createMechanismDiagram(reaction) {
    const container = document.createElement('div');
    container.className = 'mechanism-diagram';

    const title = document.createElement('h4');
    title.textContent = 'Reaktionsmechanismus';
    container.appendChild(title);

    const canvas = document.createElement('canvas');
    canvas.className = 'mechanism-canvas';
    container.appendChild(canvas);

    // Draw the mechanism
    this.drawMechanismDiagram(canvas, reaction);

    return container;
  },

  /**
   * Draw mechanism diagram
   */
  drawMechanismDiagram(canvas, reaction) {
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 300;

    canvas.width = width;
    canvas.height = height;

    const padding = 50;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const steps = reaction.steps || [
      { name: 'Edukte', formula: 'A + B' },
      { name: 'Übergangszustand', formula: '[AB]‡' },
      { name: 'Produkte', formula: 'C + D' },
    ];

    const stepWidth = (width - padding * 2) / (steps.length - 1);

    // Draw arrows between steps
    ctx.strokeStyle = '#2196F3';
    ctx.fillStyle = '#2196F3';
    ctx.lineWidth = 2;

    steps.forEach((step, index) => {
      if (index < steps.length - 1) {
        const x1 = padding + index * stepWidth + 80;
        const y1 = height / 2;
        const x2 = padding + (index + 1) * stepWidth - 80;
        const y2 = height / 2;

        // Draw arrow
        this.drawArrow(ctx, x1, y1, x2, y2);

        // Draw rate constant label
        ctx.font = 'italic 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`k${index + 1}`, (x1 + x2) / 2, y1 - 10);
      }
    });

    // Draw step boxes
    steps.forEach((step, index) => {
      const x = padding + index * stepWidth - 60;
      const y = height / 2 - 40;

      // Draw box
      ctx.fillStyle = step.type === 'transition' ? '#FFEBEE' : '#E3F2FD';
      ctx.strokeStyle = step.type === 'transition' ? '#F44336' : '#2196F3';
      ctx.lineWidth = 2;

      ctx.fillRect(x, y, 120, 80);
      ctx.strokeRect(x, y, 120, 80);

      // Draw text
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(step.name, x + 60, y + 30);

      ctx.font = '14px monospace';
      ctx.fillText(step.formula || '', x + 60, y + 55);
    });
  },

  /**
   * Draw arrow
   */
  drawArrow(ctx, x1, y1, x2, y2) {
    const headLength = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  },

  /**
   * Animate pathway
   */
  animatePathway(diagram) {
    const steps = diagram.querySelectorAll('.mechanism-diagram canvas');
    // Animation would be implemented here using requestAnimationFrame
    // For now, we just add a visual indicator
    steps.forEach((canvas) => {
      canvas.style.opacity = '0';
      canvas.style.transition = 'opacity 0.5s ease';

      setTimeout(() => {
        canvas.style.opacity = '1';
      }, 100);
    });
  },

  /**
   * Create interactive reaction explorer
   */
  createExplorer(options = {}) {
    const { containerId, reactions = [] } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    const explorer = document.createElement('div');
    explorer.className = 'reaction-explorer';

    // Create controls
    const controls = document.createElement('div');
    controls.className = 'explorer-controls';

    const select = document.createElement('select');
    select.className = 'reaction-select';
    select.innerHTML = `
      <option value="">Reaktion auswählen...</option>
      ${reactions
        .map(
          (r, i) => `
        <option value="${i}">${r.name}</option>
      `
        )
        .join('')}
    `;

    controls.appendChild(select);
    explorer.appendChild(controls);

    // Create display area
    const display = document.createElement('div');
    display.className = 'explorer-display';
    display.id = `${containerId}-display`;
    explorer.appendChild(display);

    container.appendChild(explorer);

    // Handle selection
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.value);
      if (!isNaN(index) && reactions[index]) {
        this.create({
          containerId: `${containerId}-display`,
          reaction: reactions[index],
          showEnergy: true,
          showMechanism: true,
          animated: true,
        });
      }
    });

    this.addStyles();

    return explorer;
  },

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('reaction-pathway-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'reaction-pathway-styles';
    style.textContent = `
      .reaction-pathway {
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin: 20px 0;
      }

      .energy-diagram,
      .mechanism-diagram {
        margin: 20px 0;
      }

      .energy-diagram h4,
      .mechanism-diagram h4 {
        margin: 0 0 15px 0;
        font-size: 16px;
        color: #333;
      }

      .energy-canvas,
      .mechanism-canvas {
        display: block;
        margin: 0 auto;
        max-width: 100%;
        height: auto;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }

      .reaction-explorer {
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .explorer-controls {
        margin-bottom: 20px;
      }

      .reaction-select {
        width: 100%;
        padding: 10px;
        font-size: 14px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #fff;
      }

      .explorer-display {
        min-height: 400px;
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        .reaction-pathway,
        .reaction-explorer {
          background: #2c2c2c;
        }

        .energy-diagram h4,
        .mechanism-diagram h4 {
          color: #fff;
        }

        .energy-canvas,
        .mechanism-canvas {
          border-color: #444;
        }

        .reaction-select {
          background-color: #3c3c3c;
          color: #fff;
          border-color: #555;
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .reaction-pathway {
          padding: 15px;
        }

        .energy-canvas,
        .mechanism-canvas {
          max-width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReactionPathway;
}

// Expose to global scope
if (typeof window !== 'undefined') {
  window.ReactionPathway = ReactionPathway;
}
