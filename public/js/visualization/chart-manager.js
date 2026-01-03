/**
 * Chart Manager
 * Creates interactive charts and graphs for chemistry education
 */

const ChartManager = {
  /**
   * Create a bar chart
   */
  createBarChart(options = {}) {
    const {
      containerId,
      data = [],
      xAxisLabel = '',
      yAxisLabel = '',
      title = '',
      colorScheme = 'default',
      interactive = true,
      showValues = true,
      horizontal = false
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    const chart = document.createElement('div');
    chart.className = 'chart bar-chart';
    if (horizontal) chart.classList.add('horizontal');

    // Create title
    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'chart-title';
      titleEl.textContent = title;
      chart.appendChild(titleEl);
    }

    // Create chart canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas';
    chart.appendChild(canvas);

    // Create axis labels
    const axisLabels = document.createElement('div');
    axisLabels.className = 'chart-axis-labels';

    if (xAxisLabel) {
      const xLabel = document.createElement('div');
      xLabel.className = 'x-axis-label';
      xLabel.textContent = xAxisLabel;
      axisLabels.appendChild(xLabel);
    }

    if (yAxisLabel) {
      const yLabel = document.createElement('div');
      yLabel.className = 'y-axis-label';
      yLabel.textContent = yAxisLabel;
      axisLabels.appendChild(yLabel);
    }

    chart.appendChild(axisLabels);

    container.appendChild(chart);

    // Draw the chart
    this.drawBarChart(canvas, data, {
      colorScheme,
      interactive,
      showValues,
      horizontal
    });

    this.addStyles();

    return chart;
  },

  /**
   * Draw bar chart on canvas
   */
  drawBarChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const { colorScheme = 'default', showValues = true, horizontal = false } = options;

    // Set canvas size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.min(rect.width - 40, 800);
    canvas.height = Math.min(400, 500);

    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.value)) * 1.1;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get colors
    const colors = this.getColorScheme(colorScheme);

    // Draw bars
    const barWidth = horizontal ? chartHeight / data.length - 10 : chartWidth / data.length - 10;
    const maxBarWidth = horizontal ? chartHeight : chartWidth;

    data.forEach((item, index) => {
      const barLength = (item.value / maxValue) * (horizontal ? chartWidth : chartHeight);

      // Position
      const x = horizontal ? padding : padding + index * (barWidth + 10);
      const y = horizontal ? padding + index * (barWidth + 10) : canvas.height - padding - barLength;

      // Draw bar
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(
        horizontal ? x : x,
        horizontal ? y : y,
        horizontal ? barLength : barWidth,
        horizontal ? barWidth : barLength
      );

      // Draw value
      if (showValues) {
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const valueX = horizontal ? x + barLength + 10 : x + barWidth / 2;
        const valueY = horizontal ? y + barWidth / 2 : y - 10;

        ctx.fillText(item.value.toString(), valueX, valueY);
      }

      // Draw label
      ctx.save();
      ctx.fillStyle = '#666';
      ctx.font = '11px sans-serif';

      if (horizontal) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, x - 10, y + barWidth / 2);
      } else {
        ctx.textAlign = 'center';
        ctx.translate(x + barWidth / 2, canvas.height - padding + 20);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(this.truncateText(item.label, 15), 0, 0);
      }

      ctx.restore();
    });

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // X axis
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
  },

  /**
   * Create a line chart
   */
  createLineChart(options = {}) {
    const {
      containerId,
      data = [],
      xAxisLabel = '',
      yAxisLabel = '',
      title = '',
      colorScheme = 'default',
      showPoints = true,
      smooth = false
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    const chart = document.createElement('div');
    chart.className = 'chart line-chart';

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'chart-title';
      titleEl.textContent = title;
      chart.appendChild(titleEl);
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas';
    chart.appendChild(canvas);

    const axisLabels = document.createElement('div');
    axisLabels.className = 'chart-axis-labels';

    if (xAxisLabel) {
      const xLabel = document.createElement('div');
      xLabel.className = 'x-axis-label';
      xLabel.textContent = xAxisLabel;
      axisLabels.appendChild(xLabel);
    }

    if (yAxisLabel) {
      const yLabel = document.createElement('div');
      yLabel.className = 'y-axis-label';
      yLabel.textContent = yAxisLabel;
      axisLabels.appendChild(yLabel);
    }

    chart.appendChild(axisLabels);
    container.appendChild(chart);

    // Draw the chart
    this.drawLineChart(canvas, data, {
      colorScheme,
      showPoints,
      smooth
    });

    this.addStyles();

    return chart;
  },

  /**
   * Draw line chart on canvas
   */
  drawLineChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const { colorScheme = 'default', showPoints = true, smooth = false } = options;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.min(rect.width - 40, 800);
    canvas.height = Math.min(400, 500);

    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    const maxValue = Math.max(...data.map(d => d.value)) * 1.1;
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = this.getColorScheme(colorScheme);
    const primaryColor = colors[0];

    // Calculate points
    const points = data.map((item, index) => ({
      x: padding + (index / (data.length - 1)) * chartWidth,
      y: canvas.height - padding - ((item.value - minValue) / valueRange) * chartHeight,
      value: item.value,
      label: item.label
    }));

    // Draw line
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();

    if (smooth && points.length > 1) {
      // Smooth curve using cubic bezier
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    } else {
      // Straight lines
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
    }

    ctx.stroke();

    // Draw points
    if (showPoints) {
      points.forEach(point => {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw value
        ctx.fillStyle = '#333';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.value.toString(), point.x, point.y - 10);
      });
    }

    // Draw labels
    points.forEach((point, index) => {
      if (index % Math.ceil(data.length / 10) === 0) {
        ctx.save();
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.translate(point.x, canvas.height - padding + 20);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(this.truncateText(point.label, 10), 0, 0);
        ctx.restore();
      }
    });

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
  },

  /**
   * Create a pie chart
   */
  createPieChart(options = {}) {
    const {
      containerId,
      data = [],
      title = '',
      colorScheme = 'default',
      showPercentages = true,
      showLegend = true
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    const chart = document.createElement('div');
    chart.className = 'chart pie-chart';

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'chart-title';
      titleEl.textContent = title;
      chart.appendChild(titleEl);
    }

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'pie-canvas-container';

    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas';
    canvasContainer.appendChild(canvas);
    chart.appendChild(canvasContainer);

    if (showLegend) {
      const legend = document.createElement('div');
      legend.className = 'chart-legend';
      chart.appendChild(legend);
    }

    container.appendChild(chart);

    // Draw the chart
    this.drawPieChart(canvas, data, {
      colorScheme,
      showPercentages
    });

    // Add legend
    if (showLegend) {
      const legend = chart.querySelector('.chart-legend');
      const colors = this.getColorScheme(colorScheme);

      data.forEach((item, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
          <span class="legend-color" style="background-color: ${colors[index % colors.length]}"></span>
          <span class="legend-label">${item.label}</span>
        `;
        legend.appendChild(legendItem);
      });
    }

    this.addStyles();

    return chart;
  },

  /**
   * Draw pie chart on canvas
   */
  drawPieChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const { colorScheme = 'default', showPercentages = true } = options;

    const size = Math.min(400, 500);
    canvas.width = size;
    canvas.height = size;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = this.getColorScheme(colorScheme);

    let currentAngle = -Math.PI / 2;

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * Math.PI * 2;
      const endAngle = currentAngle + sliceAngle;

      // Draw slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Draw percentage
      if (showPercentages) {
        const percentage = ((item.value / total) * 100).toFixed(1);
        const textAngle = currentAngle + sliceAngle / 2;
        const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
        const textY = centerY + Math.sin(textAngle) * (radius * 0.7);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, textX, textY);
      }

      currentAngle = endAngle;
    });
  },

  /**
   * Create a scatter plot
   */
  createScatterPlot(options = {}) {
    const {
      containerId,
      data = [],
      xAxisLabel = '',
      yAxisLabel = '',
      title = '',
      colorScheme = 'default',
      showTrendline = false
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    const chart = document.createElement('div');
    chart.className = 'chart scatter-plot';

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'chart-title';
      titleEl.textContent = title;
      chart.appendChild(titleEl);
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas';
    chart.appendChild(canvas);

    const axisLabels = document.createElement('div');
    axisLabels.className = 'chart-axis-labels';

    if (xAxisLabel) {
      const xLabel = document.createElement('div');
      xLabel.className = 'x-axis-label';
      xLabel.textContent = xAxisLabel;
      axisLabels.appendChild(xLabel);
    }

    if (yAxisLabel) {
      const yLabel = document.createElement('div');
      yLabel.className = 'y-axis-label';
      yLabel.textContent = yAxisLabel;
      axisLabels.appendChild(yLabel);
    }

    chart.appendChild(axisLabels);
    container.appendChild(chart);

    // Draw the plot
    this.drawScatterPlot(canvas, data, {
      colorScheme,
      showTrendline
    });

    this.addStyles();

    return chart;
  },

  /**
   * Draw scatter plot on canvas
   */
  drawScatterPlot(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const { colorScheme = 'default', showTrendline = false } = options;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.min(rect.width - 40, 800);
    canvas.height = Math.min(400, 500);

    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = this.getColorScheme(colorScheme);

    // Draw points
    data.forEach((point) => {
      const x = padding + ((point.x - xMin) / xRange) * chartWidth;
      const y = canvas.height - padding - ((point.y - yMin) / yRange) * chartHeight;

      ctx.fillStyle = colors[0];
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw trendline
    if (showTrendline && data.length > 1) {
      // Calculate linear regression
      const n = data.length;
      const sumX = data.reduce((sum, p) => sum + p.x, 0);
      const sumY = data.reduce((sum, p) => sum + p.y, 0);
      const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
      const sumXX = data.reduce((sum, p) => sum + p.x * p.x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const y1 = slope * xMin + intercept;
      const y2 = slope * xMax + intercept;

      const lineX1 = padding;
      const lineY1 = canvas.height - padding - ((y1 - yMin) / yRange) * chartHeight;
      const lineX2 = canvas.width - padding;
      const lineY2 = canvas.height - padding - ((y2 - yMin) / yRange) * chartHeight;

      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(lineX1, lineY1);
      ctx.lineTo(lineX2, lineY2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
  },

  /**
   * Get color scheme
   */
  getColorScheme(scheme) {
    const schemes = {
      default: ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'],
      chemistry: ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4'],
      thermal: ['#F44336', '#FF9800', '#FFEB3B', '#8BC34A', '#4CAF50', '#00BCD4'],
      monochrome: ['#424242', '#616161', '#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0'],
      pastel: ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB']
    };

    return schemes[scheme] || schemes.default;
  },

  /**
   * Truncate text to fit
   */
  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  },

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('chart-manager-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'chart-manager-styles';
    style.textContent = `
      .chart {
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin: 20px 0;
      }

      .chart-title {
        margin: 0 0 15px 0;
        font-size: 18px;
        color: #333;
        text-align: center;
      }

      .chart-canvas {
        display: block;
        margin: 0 auto;
      }

      .chart-axis-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        font-size: 12px;
        color: #666;
      }

      .x-axis-label {
        text-align: center;
        flex: 1;
      }

      .y-axis-label {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        transform: rotate(180deg);
      }

      .pie-canvas-container {
        display: flex;
        justify-content: center;
      }

      .chart-legend {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 15px;
        margin-top: 15px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
      }

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        .chart {
          background: #2c2c2c;
        }

        .chart-title {
          color: #fff;
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .chart {
          padding: 15px;
        }

        .chart-canvas {
          max-width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartManager;
}

// Expose to global scope
if (typeof window !== 'undefined') {
  window.ChartManager = ChartManager;
}
