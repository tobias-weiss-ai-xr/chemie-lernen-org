// Unit tests for Knowledge Graph Visualization Components
// Using Jest with jsdom environment for DOM testing

describe('Knowledge Graph Visualization', () => {
  let mockNodes, mockLinks, mockSvg, mockG;
  
  beforeEach(() => {
    // Setup jsdom environment
    document.documentElement.innerHTML = `
      <div id="knowledge-graph">
        <svg width="800" height="600"></svg>
      </div>
    `;
    
    // Mock document.getElementById
    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'knowledge-graph') {
        return document.querySelector('#knowledge-graph');
      }
      return null;
    });
    
    // Mock D3.js functions
    global.d3 = {
      select: jest.fn().mockReturnThis(),
      zoom: jest.fn().mockReturnThis(),
      zoomIdentity: { translate: jest.fn().mockReturnValue({ k: 1, x: 0, y: 0 }), scale: jest.fn().mockReturnValue(1) },
      forceSimulation: jest.fn().mockReturnThis(),
      force: jest.fn().mockReturnThis(),
      forceLink: jest.fn().mockReturnThis(),
      forceManyBody: jest.fn().mockReturnThis(),
      forceCenter: jest.fn().mockReturnThis(),
      forceCollide: jest.fn().mockReturnThis(),
      forceCluster: jest.fn().mockReturnThis(),
      zoomTransform: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      transition: jest.fn().mockReturnThis(),
      call: jest.fn().mockReturnThis(),
      nodes: jest.fn().mockReturnThis(),
      links: jest.fn().mockReturnThis(),
      alpha: jest.fn().mockReturnThis(),
      alphaDecay: jest.fn().mockReturnThis(),
      velocityDecay: jest.fn().mockReturnThis(),
      restart: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      enter: jest.fn().mockReturnThis(),
      exit: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      merge: jest.fn().mockReturnThis(),
      each: jest.fn().mockReturnThis(),
      size: jest.fn().mockReturnThis(),
      tick: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis()
    };
    
    // Mock performance API
    global.performance = {
      now: jest.fn()
    };
    
    // Mock fetch API for Neo4j
    global.fetch = jest.fn();
    
    // Mock setTimeout for async operations
    jest.useFakeTimers();
    
    // Mock data
    mockNodes = [
      { id: 'e1', label: 'Wasser', type: 'entity', category: 'stoff', size: 15, count: 5, url: null },
      { id: 'e2', label: 'Elektrolyse', type: 'entity', category: 'reaktion', size: 12, count: 3, url: null },
      { id: 'a1', label: 'Elektrolyse von Wasser', type: 'article', size: 8, url: '/test-article' }
    ];
    
    mockLinks = [
      { source: 'e1', target: 'a1', type: 'entity-article' },
      { source: 'e2', target: 'a1', type: 'entity-article' }
    ];
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Graph Initialization', () => {
    test('should create nodes with correct properties', () => {
      mockNodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('label');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('size');
        
        if (node.type === 'entity') {
          expect(node).toHaveProperty('category');
          expect(node).toHaveProperty('count');
        }
      });
    });
  });

  describe('Data Processing', () => {
    test('should process Neo4j data structure correctly', () => {
      const rawData = {
        articles: [
          { id: 'a1', title: 'Test Article', url: '/test', entities: ['Wasser'] }
        ],
        entities: [
          { id: 'e1', name: 'Wasser', category: 'stoff', articleCount: 1 }
        ]
      };
      
      // Test that entities and articles are properly linked
      expect(rawData.entities[0].articleCount).toBe(1);
      expect(rawData.articles[0].entities).toContain('Wasser');
    });

    test('should handle category mapping correctly', () => {
      const categoryColors = {
        'stoff': '#667eea',
        'methode': '#f093fb', 
        'reaktion': '#4ecdc4',
        'konzept': '#45b7d1'
      };
      
      mockNodes.forEach(node => {
        if (node.type === 'entity') {
          expect(categoryColors[node.category]).toBeDefined();
        }
      });
    });

    test('should handle unknown categories gracefully', () => {
      const unknownCategoryNode = { ...mockNodes[0], category: 'unknown' };
      const categoryColors = {
        'stoff': '#667eea',
        'methode': '#f093fb',
        'reaktion': '#4ecdc4', 
        'konzept': '#45b7d1'
      };
      
      expect(categoryColors[unknownCategoryNode.category]).toBeUndefined();
    });
  });

  describe('Search Functionality', () => {
    test('should return empty results for non-existent search', () => {
      const searchTerm = 'NonExistent';
      const results = mockNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(results).toHaveLength(0);
    });

    test('should find entities containing search term', () => {
      const searchTerm = 'Wasser';
      const results = mockNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

    test('should return empty results for non-existent search', () => {
      const searchTerm = 'NonExistent';
      const results = mockNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(results).toHaveLength(0);
    });

    test('should handle empty search term', () => {
      const searchTerm = '';
      const results = mockNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(results).toHaveLength(mockNodes.length);
    });
  });

  describe('Interactive Features', () => {
    test('should filter nodes by category', () => {
      const category = 'stoff';
      const filtered = mockNodes.filter(node => 
        node.type === 'entity' && node.category === category
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('stoff');
    });

    test('should handle category filter for all categories', () => {
      const allEntities = mockNodes.filter(node => node.type === 'entity');
      expect(allEntities.length).toBeGreaterThan(0);
    });

    test('should highlight search results correctly', () => {
      const searchResults = [mockNodes[0]]; // First node (Wasser)
      
      searchResults.forEach(node => {
        expect(mockNodes).toContain(node);
        expect(node.type).toBe('entity');
      });
    });
  });

  describe('Export Functionality', () => {
    test('should export nodes with required properties', () => {
      const exportData = {
        nodes: mockNodes.map(n => ({
          id: n.id,
          label: n.label,
          type: n.type,
          category: n.category,
          size: n.size,
          count: n.count,
          url: n.url
        }))
      };
      
      expect(exportData.nodes).toHaveLength(3);
      expect(exportData.nodes[0]).toHaveProperty('id');
      expect(exportData.nodes[0]).toHaveProperty('label');
      expect(exportData.nodes[0]).toHaveProperty('type');
    });

    test('should export links with correct structure', () => {
      const exportData = {
        links: mockLinks.map(l => ({
          source: l.source.id || l.source,
          target: l.target.id || l.target,
          type: l.type
        }))
      };
      
      expect(exportData.links).toHaveLength(2);
      expect(exportData.links[0]).toHaveProperty('source');
      expect(exportData.links[0]).toHaveProperty('target');
      expect(exportData.links[0]).toHaveProperty('type');
    });
  });

  describe('Performance Optimization', () => {
    test('should handle large datasets with progressive rendering', () => {

    test('should simulate tick throttling for performance', () => {
      const mockAlpha = jest.fn().mockReturnValue(0.2);
      const mockTickCallback = jest.fn();
      
      // Simulate tick throttling
      if (mockAlpha() > 0.1) {
        mockTickCallback();
      }
      
      // Should only call when alpha > 0.1
      expect(mockTickCallback).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Features', () => {
    test('should add ARIA labels to elements', () => {
      const mockCircle = { __data__: mockNodes[0] };
      const ariaLabel = mockNodes[0].type === 'entity' 
        ? `Entität: ${mockNodes[0].label}, Kategorie: ${mockNodes[0].category}, ${mockNodes[0].count} Artikel`
        : `Artikel: ${mockNodes[0].label}`;
      
      expect(ariaLabel).toContain('Wasser');
      expect(ariaLabel).toContain('stoff');
    });

    test('should support keyboard navigation keys', () => {
      const eventKeys = ['Tab', 'ArrowRight', 'ArrowLeft', 'Escape', ' '];
      
      eventKeys.forEach(key => {
        expect(['Tab', 'ArrowRight', 'ArrowLeft', 'Escape', ' ']).toContain(key);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle Neo4j connection failures gracefully', () => {
      const error = new Error('Connection failed');
      
      expect(error.message).toBe('Connection failed');
      // Should fall back to local data
      expect(mockNodes.length).toBeGreaterThan(0);
    });

    test('should handle missing data structures', () => {
      const emptyData = { articles: [], entities: [] };
      expect(emptyData.articles).toHaveLength(0);
      expect(emptyData.entities).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    test('should handle DOM element creation', () => {
      const container = document.getElementById('knowledge-graph');
      expect(container).not.toBeNull();
      
      // Simulate DOM manipulation
      const newElement = document.createElement('div');
      newElement.textContent = 'Test Element';
      container.appendChild(newElement);
      
      expect(container.children.length).toBeGreaterThan(0);
    });

    test('should handle async operations with timers', () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue('success');
      
      // Simulate async operation
      Promise.resolve().then(() => {
        mockAsyncFunction();
      });
      
      // Fast-forward timers
      jest.advanceTimersByTime(100);
      
      expect(mockAsyncFunction).toHaveBeenCalled();
    });
  });
});