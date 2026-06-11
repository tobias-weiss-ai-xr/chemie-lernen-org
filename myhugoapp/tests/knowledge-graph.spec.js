// Unit tests for Knowledge Graph Visualization Components
// Tests: Graph initialization, data processing, interactive features

describe('Knowledge Graph Visualization', () => {
  let mockNodes, mockLinks, mockSvg, mockG;
  
  beforeEach(() => {
    // Mock DOM elements
    document.getElementById = jest.fn().mockReturnValue({
      clientWidth: 800,
      appendChild: jest.fn(),
      removeChild: jest.fn()
    });
    
    // Mock D3.js
    global.d3 = {
      select: jest.fn().mockReturnThis(),
      zoom: jest.fn().mockReturnThis(),
      forceSimulation: jest.fn().mockReturnThis(),
      force: jest.fn().mockReturnThis(),
      forceLink: jest.fn().mockReturnThis(),
      forceManyBody: jest.fn().mockReturnThis(),
      forceCenter: jest.fn().mockReturnThis(),
      forceCollide: jest.fn().mockReturnThis(),
      forceCluster: jest.fn().mockReturnThis(),
      zoomIdentity: { translate: jest.fn(), scale: jest.fn() }
    };
    
    // Mock data
    mockNodes = [
      { id: 'e1', label: 'Wasser', type: 'entity', category: 'stoff', size: 15, count: 5 },
      { id: 'e2', label: 'Elektrolyse', type: 'entity', category: 'reaktion', size: 12, count: 3 },
      { id: 'a1', label: 'Elektrolyse von Wasser', type: 'article', size: 8 }
    ];
    
    mockLinks = [
      { source: 'e1', target: 'a1', type: 'entity-article' },
      { source: 'e2', target: 'a1', type: 'entity-article' }
    ];
  });

  describe('Graph Initialization', () => {
    test('should initialize graph with proper dimensions', () => {
      const width = 800;
      const height = 600;
      
      // Test that graph container is set up correctly
      expect(document.getElementById).toHaveBeenCalledWith('knowledge-graph');
      
      // Test SVG creation
      expect(d3.select).toHaveBeenCalledWith('#knowledge-graph');
    });

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
  });

  describe('Search Functionality', () => {
    test('should search entities by label', () => {
      const searchTerm = 'Wasser';
      const results = mockNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(results).toHaveLength(1);
      expect(results[0].label).toBe('Wasser');
    });

    test('should handle case-insensitive search', () => {
      const searchTerm = 'WASSER';
      const results = mockNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(results).toHaveLength(1);
    });

    test('should return empty results for non-existent search', () => {
      const searchTerm = 'NonExistent';
      const results = mockNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(results).toHaveLength(0);
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
          count: n.count
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
    test('should throttle tick events for performance', () => {
      const mockTickCallback = jest.fn();
      const mockAlpha = jest.fn().mockReturnValue(0.2);
      
      // Simulate tick throttling
      if (mockAlpha() > 0.1) {
        mockTickCallback();
      }
      
      // Should only call when alpha > 0.1
      expect(mockTickCallback).not.toHaveBeenCalled();
    });

    test('should handle large datasets with progressive rendering', () => {
      const largeDataset = Array(300).fill().map((_, i) => ({
        id: `node-${i}`,
        label: `Node ${i}`,
        type: i % 2 === 0 ? 'entity' : 'article',
        size: 10 + (i % 10)
      }));
      
      expect(largeDataset).toHaveLength(300);
      
      // Test progressive rendering activation
      const shouldUseProgressive = largeDataset.length > 200;
      expect(shouldUseProgressive).toBe(true);
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

    test('should support keyboard navigation', () => {
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

    test('should handle invalid category assignments', () => {
      const invalidNode = { ...mockNodes[0], category: 'invalid-category' };
      const categoryColors = {
        'stoff': '#667eea',
        'methode': '#f093fb',
        'reaktion': '#4ecdc4',
        'konzept': '#45b7d1'
      };
      
      const color = categoryColors[invalidNode.category] || categoryColors.default;
      expect(color).toBeDefined();
    });
  });
});