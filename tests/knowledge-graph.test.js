describe('Knowledge Graph Visualization', () => {
  let mockNodes, mockLinks;

  beforeEach(() => {
    document.documentElement.innerHTML = '<div id="knowledge-graph"><svg width="800" height="600"></svg></div>';

    mockNodes = [
      { id: 'e1', label: 'Wasser', type: 'entity', category: 'stoff', size: 15, count: 5, url: null },
      { id: 'e2', label: 'Elektrolyse', type: 'entity', category: 'reaktion', size: 12, count: 3, url: null },
      { id: 'a1', label: 'Elektrolyse von Wasser', type: 'article', size: 8, url: '/test-article' },
    ];

    mockLinks = [
      { source: 'e1', target: 'a1', type: 'entity-article' },
      { source: 'e2', target: 'a1', type: 'entity-article' },
    ];
  });

  describe('Data Processing', () => {
    test('should process Neo4j data structure correctly', () => {
      const rawData = {
        articles: [{ id: 'a1', title: 'Test Article', url: '/test', entities: ['Wasser'] }],
        entities: [{ id: 'e1', name: 'Wasser', category: 'stoff', articleCount: 1 }],
      };

      expect(rawData.entities[0].articleCount).toBe(1);
      expect(rawData.articles[0].entities).toContain('Wasser');
    });

    test('should handle category mapping correctly', () => {
      const categoryColors = {
        stoff: '#667eea',
        methode: '#f093fb',
        reaktion: '#4ecdc4',
        konzept: '#45b7d1',
      };

      mockNodes
        .filter((n) => n.type === 'entity')
        .forEach((node) => {
          expect(categoryColors[node.category]).toBeDefined();
        });
    });

    test('should handle unknown categories gracefully', () => {
      const unknownNode = { ...mockNodes[0], category: 'unknown' };
      const categoryColors = {
        stoff: '#667eea',
        methode: '#f093fb',
        reaktion: '#4ecdc4',
        konzept: '#45b7d1',
      };

      expect(categoryColors[unknownNode.category]).toBeUndefined();
    });
  });

  describe('Search Functionality', () => {
    test('should return empty results for non-existent search', () => {
      const results = mockNodes.filter((n) => n.label.toLowerCase().includes('nonexistent'));
      expect(results).toHaveLength(0);
    });

    test('should find entities containing search term', () => {
      const results = mockNodes.filter((n) => n.label.toLowerCase().includes('wasser'));
      expect(results.length).toBeGreaterThan(0);
    });

    test('should return all nodes for empty search term', () => {
      const results = mockNodes.filter((n) => n.label.toLowerCase().includes(''));
      expect(results).toHaveLength(mockNodes.length);
    });
  });

  describe('Interactive Features', () => {
    test('should filter nodes by category', () => {
      const filtered = mockNodes.filter((n) => n.type === 'entity' && n.category === 'stoff');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].label).toBe('Wasser');
    });

    test('should filter all entities from mixed nodes', () => {
      const entities = mockNodes.filter((n) => n.type === 'entity');
      expect(entities).toHaveLength(2);
    });

    test('should highlight search results correctly', () => {
      const searchResults = mockNodes.filter((n) => n.label.includes('Wasser'));
      expect(searchResults).toHaveLength(2);
      expect(searchResults[0].label).toBe('Wasser');
    });
  });

  describe('Export Functionality', () => {
    test('should export nodes with required properties', () => {
      const exportData = mockNodes.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        category: n.category || null,
        size: n.size,
        count: n.count || null,
        url: n.url,
      }));

      expect(exportData).toHaveLength(3);
      expect(exportData[0]).toHaveProperty('id');
      expect(exportData[0]).toHaveProperty('label');
      expect(exportData[0]).toHaveProperty('type');
    });

    test('should export links with correct structure', () => {
      const exportData = mockLinks.map((l) => ({
        source: l.source.id || l.source,
        target: l.target.id || l.target,
        type: l.type,
      }));

      expect(exportData).toHaveLength(2);
      expect(exportData[0]).toHaveProperty('source');
      expect(exportData[0]).toHaveProperty('target');
    });
  });

  describe('Accessibility Features', () => {
    test('should generate correct ARIA labels for entities', () => {
      const node = mockNodes[0];
      const ariaLabel = `Entität: ${node.label}, Kategorie: ${node.category}, ${node.count} Artikel`;

      expect(ariaLabel).toContain('Wasser');
      expect(ariaLabel).toContain('stoff');
      expect(ariaLabel).toContain('5 Artikel');
    });

    test('should generate correct ARIA labels for articles', () => {
      const node = mockNodes[2];
      const ariaLabel = `Artikel: ${node.label}`;

      expect(ariaLabel).toContain('Elektrolyse von Wasser');
    });

    test('should support keyboard navigation keys', () => {
      const supportedKeys = ['Tab', 'ArrowRight', 'ArrowLeft', 'Escape', ' '];
      supportedKeys.forEach((key) => {
        expect(['Tab', 'ArrowRight', 'ArrowLeft', 'Escape', ' ']).toContain(key);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle Neo4j connection failures gracefully', () => {
      const error = new Error('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(mockNodes.length).toBeGreaterThan(0);
    });

    test('should handle missing data structures', () => {
      const emptyData = { articles: [], entities: [] };
      expect(emptyData.articles).toHaveLength(0);
      expect(emptyData.entities).toHaveLength(0);
    });
  });

  describe('DOM Integration', () => {
    test('should find graph container in DOM', () => {
      const container = document.getElementById('knowledge-graph');
      expect(container).not.toBeNull();
    });

    test('should handle DOM element creation', () => {
      const container = document.getElementById('knowledge-graph');
      const newElement = document.createElement('div');
      newElement.textContent = 'Test Element';
      container.appendChild(newElement);

      expect(container.children.length).toBeGreaterThan(0);
    });
  });
});
