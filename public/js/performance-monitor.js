#!/usr/bin/env node

/**
 * Real-time Performance Monitoring
 * Tracks Core Web Vitals and performance metrics
 */

const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      vitals: [],
      resources: [],
      navigation: {},
      userInteractions: []
    };
    
    this.thresholds = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 600,
      FCP: 1800,
      TTI: 3800
    };

    this.setupMonitoring();
  }

  setupMonitoring() {
    if (typeof window !== 'undefined') {
      this.observeWebVitals();
      this.observeResourceTiming();
      this.observeUserInteractions();
      this.reportInitialLoad();
    }
  }

  observeWebVitals() {
    try {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.recordVital('LCP', entry.startTime, entry);
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.recordVital('FID', entry.processingStart - entry.startTime, entry);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            this.recordVital('CLS', entry.value, entry);
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint (FCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.recordVital('FCP', entry.startTime, entry);
        });
      }).observe({ entryTypes: ['paint'] });

    } catch (error) {
      console.warn('Web Vitals monitoring not supported:', error);
    }
  }

  observeResourceTiming() {
    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.recordResource(entry);
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource timing monitoring not supported:', error);
    }
  }

  observeUserInteractions() {
    let lastInteractionTime = 0;
    
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const now = performance.now();
        const responseTime = now - lastInteractionTime;
        
        if (lastInteractionTime > 0 && responseTime < 1000) {
          this.metrics.userInteractions.push({
            type: eventType,
            responseTime,
            timestamp: now,
            element: event.target.tagName
          });
        }
        
        lastInteractionTime = now;
      }, { passive: true });
    });
  }

  recordVital(type, value, entry) {
    const vital = {
      type,
      value,
      timestamp: performance.now(),
      rating: this.getRating(type, value),
      entry
    };

    this.metrics.vitals.push(vital);
    this.vitalWarning(type, value);
    this.emitVitalUpdate(vital);
  }

  recordResource(entry) {
    const resource = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      size: entry.transferSize || 0,
      duration: entry.duration,
      timestamp: entry.startTime,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    };

    this.metrics.resources.push(resource);
    
    if (resource.duration > 1000) {
      this.resourceWarning(resource);
    }
  }

  getResourceType(url) {
    const extension = url.split('.').pop().toLowerCase();
    const typeMap = {
      'js': 'script',
      'css': 'stylesheet',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'woff': 'font',
      'woff2': 'font'
    };
    
    return typeMap[extension] || 'other';
  }

  getRating(type, value) {
    const threshold = this.thresholds[type];
    if (!threshold) return 'unknown';

    if (value <= threshold * 0.5) return 'good';
    if (value <= threshold) return 'needs-improvement';
    return 'poor';
  }

  vitalWarning(type, value) {
    const threshold = this.thresholds[type];
    if (threshold && value > threshold) {
      console.warn(`⚠️ ${type} threshold exceeded: ${value.toFixed(2)}ms (threshold: ${threshold}ms)`);
      this.emitPerformanceIssue(type, value, threshold);
    }
  }

  resourceWarning(resource) {
    console.warn(`⚠️ Slow resource detected: ${resource.name} took ${resource.duration.toFixed(2)}ms`);
    this.emitPerformanceIssue('resource', resource, 1000);
  }

  emitVitalUpdate(vital) {
    window.dispatchEvent(new CustomEvent('vitalUpdate', {
      detail: vital
    }));
  }

  emitPerformanceIssue(type, value, threshold) {
    window.dispatchEvent(new CustomEvent('performanceIssue', {
      detail: { type, value, threshold }
    }));
  }

  reportInitialLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.metrics.navigation = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          timeToFirstByte: navigation.responseStart - navigation.navigationStart,
          domInteractive: navigation.domInteractive - navigation.navigationStart
        };

        this.checkNavigationPerformance();
      }
    });
  }

  checkNavigationPerformance() {
    const { navigation } = this.metrics;
    
    Object.entries(this.thresholds).forEach(([metric, threshold]) => {
      const value = navigation[metric.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()];
      if (value && value > threshold) {
        this.emitPerformanceIssue(metric, value, threshold);
      }
    });
  }

  getCurrentMetrics() {
    return {
      vitals: this.metrics.vitals.slice(-10), // Last 10 vitals
      resourceCount: this.metrics.resources.length,
      slowResources: this.metrics.resources.filter(r => r.duration > 1000).length,
      averageLoadTime: this.calculateAverageLoadTime(),
      interactionResponsiveness: this.calculateInteractionResponsiveness()
    };
  }

  calculateAverageLoadTime() {
    if (this.metrics.resources.length === 0) return 0;
    
    const totalTime = this.metrics.resources.reduce((sum, resource) => sum + resource.duration, 0);
    return totalTime / this.metrics.resources.length;
  }

  calculateInteractionResponsiveness() {
    if (this.metrics.userInteractions.length === 0) return 0;
    
    const recentInteractions = this.metrics.userInteractions.slice(-20);
    const averageResponseTime = recentInteractions.reduce((sum, interaction) => sum + interaction.responseTime, 0) / recentInteractions.length;
    
    return averageResponseTime;
  }

  generateReport() {
    const metrics = this.getCurrentMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalVitals: this.metrics.vitals.length,
        totalResources: this.metrics.resources.length,
        slowResources: metrics.slowResources,
        averageLoadTime: metrics.averageLoadTime,
        interactionScore: metrics.interactionResponsiveness
      },
      vitals: this.metrics.vitals.map(vital => ({
        type: vital.type,
        value: vital.value,
        rating: vital.rating
      })),
      resources: this.metrics.resources.slice(-50), // Last 50 resources
      recommendations: this.generateRecommendations(metrics)
    };
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.averageLoadTime > 2000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Average load time is slow. Consider optimizing images and enabling compression.',
        action: 'Use WebP images and enable gzip/brotli compression'
      });
    }
    
    if (metrics.slowResources > 5) {
      recommendations.push({
        type: 'resources',
        priority: 'medium',
        message: 'Multiple slow resources detected. Consider CDN usage.',
        action: 'Implement CDN for static assets'
      });
    }
    
    if (metrics.interactionScore > 200) {
      recommendations.push({
        type: 'interactivity',
        priority: 'high',
        message: 'User interactions are sluggish. Optimize JavaScript execution.',
        action: 'Reduce main thread blocking operations'
      });
    }
    
    return recommendations;
  }

  saveReport() {
    const report = this.generateReport();
    const reportPath = path.join(__dirname, '../../performance-report.json');
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('Performance report saved to performance-report.json');
    
    return report;
  }

  reset() {
    this.metrics = {
      vitals: [],
      resources: [],
      navigation: {},
      userInteractions: []
    };
  }
}

// Initialize monitoring in browser environment
if (typeof window !== 'undefined') {
  const monitor = new PerformanceMonitor();
  window.PerformanceMonitor = PerformanceMonitor;
  
  // Save report every 5 minutes
  setInterval(() => {
    monitor.saveReport();
  }, 5 * 60 * 1000);
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}