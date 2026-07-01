// openDesk Edu Landscape - Interactive JavaScript

class LandscapeApp {
  constructor() {
    this.data = null;
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.init();
  }

  async init() {
    await this.loadData();
    this.renderLandscape();
    this.renderMetadata();
    this.setupEventListeners();
    this.updateLastUpdated();
  }

  async loadData() {
    try {
      // In a production environment, this would fetch from data/services.yaml
      // For this static site, we embed the data directly
      this.data = this.getEmbeddedData();
    } catch (error) {
      console.error('Failed to load landscape data:', error);
    }
  }

  getEmbeddedData() {
    return {
      categories: [
        {
          id: 'identity',
          name: 'Identity & Access',
          description: 'Authentication, authorization, and user management',
          color: '#4A90E2',
          icon: '🔐',
          subcategories: [
            {
              name: 'Single Sign-On',
              items: [
                {
                  name: 'Keycloak',
                  description:
                    'Open-source Identity and Access Management with SAML 2.0 and OIDC support',
                  url: 'https://www.keycloak.org',
                  repository: 'https://github.com/keycloak/keycloak',
                  license: 'Apache-2.0',
                  category: 'identity',
                  subcategory: 'Single Sign-On',
                  tier: 'critical',
                  maturity: 'graduated',
                  tags: ['sso', 'oidc', 'saml', 'ldap'],
                },
                {
                  name: 'Nubus',
                  description:
                    'Identity and access management with OpenLDAP, Keycloak, Portal, and UMC',
                  url: 'https://www.univention.com',
                  repository: 'https://github.com/univention/univention-corporate-server',
                  license: 'AGPL-3.0',
                  category: 'identity',
                  subcategory: 'Single Sign-On',
                  tier: 'critical',
                  maturity: 'production',
                  tags: ['iam', 'ldap', 'portal', 'provisioning'],
                },
              ],
            },
            {
              name: 'User Management',
              items: [
                {
                  name: 'Self-Service Password',
                  description: 'LDB self-service password reset tool for OpenLDAP',
                  url: 'https://ltb-project.org',
                  repository: 'https://github.com/ltb-project/self-service-password',
                  license: 'GPL-3.0',
                  category: 'identity',
                  subcategory: 'User Management',
                  tier: 'standard',
                  maturity: 'production',
                  tags: ['password', 'ldap', 'self-service'],
                },
              ],
            },
          ],
        },
        {
          id: 'lms',
          name: 'Learning Management',
          description: 'LMS, online classes, and educational tools',
          color: '#50C878',
          icon: '🎓',
          subcategories: [
            {
              name: 'LMS Platforms',
              items: [
                {
                  name: 'ILIAS',
                  description:
                    'Comprehensive LMS popular in German-speaking countries with Shibboleth SSO',
                  url: 'https://www.ilias.de',
                  repository: 'https://github.com/ILIAS-eLearning/ILIAS',
                  license: 'GPL-3.0',
                  category: 'lms',
                  subcategory: 'LMS Platforms',
                  tier: 'high',
                  maturity: 'production',
                  tags: ['lms', 'education', 'shibboleth', 'german'],
                },
                {
                  name: 'Moodle',
                  description: "World's most widely used LMS with extensive plugin ecosystem",
                  url: 'https://moodle.org',
                  repository: 'https://github.com/moodle/moodle',
                  license: 'GPL-3.0',
                  category: 'lms',
                  subcategory: 'LMS Platforms',
                  tier: 'high',
                  maturity: 'production',
                  tags: ['lms', 'education', 'plugins', 'php'],
                },
              ],
            },
            {
              name: 'Video Conferencing',
              items: [
                {
                  name: 'BigBlueButton',
                  description:
                    'Web conferencing for online classes with whiteboard and breakout rooms',
                  url: 'https://bigbluebutton.org',
                  repository: 'https://github.com/bigbluebutton/bigbluebutton',
                  license: 'LGPL-3.0',
                  category: 'lms',
                  subcategory: 'Video Conferencing',
                  tier: 'high',
                  maturity: 'production',
                  tags: ['video', 'classroom', 'whiteboard', 'recording'],
                },
                {
                  name: 'Jitsi Meet',
                  description: 'WebRTC video conferencing with OIDC and Matrix UVS integration',
                  url: 'https://jitsi.org',
                  repository: 'https://github.com/jitsi/jitsi-meet',
                  license: 'Apache-2.0',
                  category: 'lms',
                  subcategory: 'Video Conferencing',
                  tier: 'high',
                  maturity: 'production',
                  tags: ['video', 'webrtc', 'meetings'],
                },
              ],
            },
            {
              name: 'Knowledge Management',
              items: [
                {
                  name: 'XWiki',
                  description:
                    'Enterprise wiki for collaborative knowledge base with OIDC and LDAP',
                  url: 'https://www.xwiki.org',
                  repository: 'https://github.com/xwiki/xwiki-platform',
                  license: 'LGPL-2.1',
                  category: 'lms',
                  subcategory: 'Knowledge Management',
                  tier: 'standard',
                  maturity: 'production',
                  tags: ['wiki', 'knowledge', 'collaboration'],
                },
              ],
            },
          ],
        },
        {
          id: 'collaboration',
          name: 'Content & Collaboration',
          description: 'File storage, document editing, and collaboration tools',
          color: '#FF6B6B',
          icon: '📚',
          subcategories: [
            {
              name: 'File Storage & Sharing',
              items: [
                {
                  name: 'Nextcloud',
                  description:
                    'File storage, sharing, and collaboration (replaces Google Drive/Dropbox)',
                  url: 'https://nextcloud.com',
                  repository: 'https://github.com/nextcloud/server',
                  license: 'AGPL-3.0',
                  category: 'collaboration',
                  subcategory: 'File Storage & Sharing',
                  tier: 'critical',
                  maturity: 'production',
                  tags: ['files', 'storage', 'sharing', 'collaboration'],
                },
                {
                  name: 'OpenCloud',
                  description: 'Lightweight CS3-native file sharing optimized for education',
                  url: 'https://opencloud.eu',
                  repository: 'https://github.com/opencloud-eu/opencloud',
                  license: 'Apache-2.0',
                  category: 'collaboration',
                  subcategory: 'File Storage & Sharing',
                  tier: 'critical',
                  maturity: 'production',
                  tags: ['files', 'storage', 'cs3', 'education'],
                },
              ],
            },
            {
              name: 'Document Editing',
              items: [
                {
                  name: 'Collabora Online',
                  description:
                    'Real-time document editing integrated with Nextcloud (WOPI protocol)',
                  url: 'https://www.collaboraoffice.com',
                  repository: 'https://github.com/CollaboraOnline/online',
                  license: 'MPL-2.0',
                  category: 'collaboration',
                  subcategory: 'Document Editing',
                  tier: 'high',
                  maturity: 'production',
                  tags: ['office', 'documents', 'wopi', 'collaboration'],
                },
                {
                  name: 'Etherpad',
                  description: 'Real-time collaborative text editing with OT algorithm',
                  url: 'https://etherpad.org',
                  repository: 'https://github.com/ether/etherpad-lite',
                  license: 'Apache-2.0',
                  category: 'collaboration',
                  subcategory: 'Document Editing',
                  tier: 'standard',
                  maturity: 'production',
                  tags: ['collaboration', 'text', 'realtime'],
                },
                {
                  name: 'CryptPad',
                  description:
                    'End-to-end encrypted collaborative editing integrated with Nextcloud',
                  url: 'https://cryptpad.fr',
                  repository: 'https://github.com/cryptpad/cryptpad',
                  license: 'AGPL-3.0',
                  category: 'collaboration',
                  subcategory: 'Document Editing',
                  tier: 'standard',
                  maturity: 'production',
                  tags: ['encryption', 'privacy', 'collaboration'],
                },
                {
                  name: 'Notes (im.press)',
                  description:
                    'Collaborative note-taking with AI integration and Yjs collaboration',
                  url: 'https://www.im.press',
                  repository: 'https://github.com/suitenumerique/notes',
                  license: 'AGPL-3.0',
                  category: 'collaboration',
                  subcategory: 'Document Editing',
                  tier: 'standard',
                  maturity: 'production',
                  tags: ['notes', 'ai', 'yjs', 'django'],
                },
              ],
            },
            {
              name: 'Diagramming & Whiteboards',
              items: [
                {
                  name: 'Draw.io',
                  description: 'Stateless diagram editor for flowcharts, UML, and network diagrams',
                  url: 'https://www.drawio.com',
                  repository: 'https://github.com/jgraph/drawio',
                  license: 'Apache-2.0',
                  category: 'collaboration',
                  subcategory: 'Diagramming & Whiteboards',
                  tier: 'low',
                  maturity: 'production',
                  tags: ['diagrams', 'uml', 'flowcharts'],
                },
                {
                  name: 'Excalidraw',
                  description: 'Hand-drawn style whiteboard editor with shareable URLs',
                  url: 'https://excalidraw.com',
                  repository: 'https://github.com/excalidraw/excalidraw',
                  license: 'MIT',
                  category: 'collaboration',
                  subcategory: 'Diagramming & Whiteboards',
                  tier: 'low',
                  maturity: 'production',
                  tags: ['whiteboard', 'handdrawn', 'sketching'],
                },
              ],
            },
            {
              name: 'Documentation & Content',
              items: [
                {
                  name: 'BookStack',
                  description: 'Documentation platform with Book→Chapter→Page hierarchy',
                  url: 'https://www.bookstackapp.com',
                  repository: 'https://github.com/BookStackApp/BookStack',
                  license: 'MIT',
                  category: 'collaboration',
                  subcategory: 'Documentation & Content',
                  tier: 'standard',
                  maturity: 'production',
                  tags: ['documentation', 'wiki', 'knowledge-base'],
                },
                {
                  name: 'TYPO3',
                  description: 'Enterprise content management for institutional websites',
                  url: 'https://typo3.org',
                  repository: 'https://github.com/TYPO3/typo3',
                  license: 'GPL-2.0',
                  category: 'collaboration',
                  subcategory: 'Documentation & Content',
                  tier: 'standard',
                  maturity: 'production',
                  tags: ['cms', 'websites', 'content'],
                },
              ],
            },
          ],
        },
        {
          id: 'project',
          name: 'Project Management',
          description: 'Project, task, and work management tools',
          color: '#FFA500',
          icon: '📊',
          subcategories: [
            {
              name: 'Project Management',
              items: [
                {
                  name: 'OpenProject',
                  description: 'Enterprise project management with agile boards and timelines',
                  url: 'https://www.openproject.org',
                  repository: 'https://github.com/opf/openproject',
                  license: 'GPL-3.0',
                  category: 'project',
                  subcategory: 'Project Management',
                  tier: 'high',
                  maturity: 'production',
                  tags: ['project-management', 'agile', 'kanban', 'timeline'],
                },
                {
                  name: 'Planka',
                  description: 'Kanban boards with real-time collaboration and LTI integration',
                  url: 'https://planka.app',
                  repository: 'https://github.com/plankanban/planka',
                  license: 'AGPL-3.0',
                  category: 'project',
                  subcategory: 'Project Management',
                  tier: 'standard',
                  maturity: 'production',
                  tags: ['kanban', 'boards', 'lti', 'realtime'],
                },
              ],
            },
          ],
        },
        {
          id: 'communication',
          name: 'Communication',
          description: 'Email, messaging, and support tools',
          color: '#9B59B6',
          icon: '📧',
          subcategories: [
            {
              name: 'Email & Groupware',
              items: [
                {
                  name: 'OX App Suite',
                  description: 'Enterprise email, calendar, and groupware with SAML 2.0',
                  url: 'https://www.open-xchange.com',
                  repository: 'https://gitlab.open-xchange.com',
                  license: 'Open-Xchange License',
                  category: 'communication',
                  subcategory: 'Email & Groupware',
                  tier: 'critical',
                  maturity: 'production',
                  tags: ['email', 'calendar', 'groupware', 'ox'],
                },
                {
                  name: 'SOGo',
                  description: 'Alternative groupware with LDAP-native integration',
                  url: 'https://www.sogo.nu',
                  repository: 'https://github.com/Alinto/sogo',
                  license: 'GPL-2.0',
                  category: 'communication',
                  subcategory: 'Email & Groupware',
                  tier: 'critical',
                  maturity: 'production',
                  tags: ['email', 'calendar', 'ldap', 'groupware'],
                },
              ],
            },
            {
              name: 'Email Infrastructure',
              items: [
                {
                  name: 'Dovecot',
                  description: 'IMAP email server with Sieve filtering and quota management',
                  url: 'https://www.dovecot.org',
                  repository: 'https://github.com/dovecot/core',
                  license: 'LGPL-2.1',
                  category: 'communication',
                  subcategory: 'Email Infrastructure',
                  tier: 'critical',
                  maturity: 'production',
                  tags: ['imap', 'email', 'sieve'],
                },
                {
                  name: 'Postfix',
                  description: 'SMTP mail transfer agent with TLS and authentication',
                  url: 'http://www.postfix.org',
                  repository: 'https://github.com/vdukhovni/postfix',
                  license: 'IPL-1.0',
                  category: 'communication',
                  subcategory: 'Email Infrastructure',
                  tier: 'critical',
                  maturity: 'production',
                  tags: ['smtp', 'email', 'mail-server'],
                },
              ],
            },
            {
              name: 'Messaging',
              items: [
                {
                  name: 'Element',
                  description: 'Matrix-based secure messaging with WebRTC and appservices',
                  url: 'https://element.io',
                  repository: 'https://github.com/element-hq/element-web',
                  license: 'Apache-2.0',
                  category: 'communication',
                  subcategory: 'Messaging',
                  tier: 'high',
                  maturity: 'production',
                  tags: ['matrix', 'chat', 'messaging', 'webrtc'],
                },
              ],
            },
            {
              name: 'Support & Helpdesk',
              items: [
                {
                  name: 'Zammad',
                  description: 'Multi-channel helpdesk and ticketing with email, chat, and phone',
                  url: 'https://zammad.org',
                  repository: 'https://github.com/zammad/zammad',
                  license: 'AGPL-3.0',
                  category: 'communication',
                  subcategory: 'Support & Helpdesk',
                  tier: 'high',
                  maturity: 'production',
                  tags: ['helpdesk', 'ticketing', 'support', 'email'],
                },
                {
                  name: 'LimeSurvey',
                  description: 'Survey and questionnaire platform with LDAP authentication',
                  url: 'https://www.limesurvey.org',
                  repository: 'https://github.com/LimeSurvey/LimeSurvey',
                  license: 'GPL-2.0',
                  category: 'communication',
                  subcategory: 'Support & Helpdesk',
                  tier: 'standard',
                  maturity: 'production',
                  tags: ['surveys', 'questionnaires', 'ldap'],
                },
              ],
            },
          ],
        },
      ],
      metadata: {
        total_services: 25,
        total_categories: 5,
        license_breakdown: [
          { license: 'Apache-2.0', count: 6 },
          { license: 'AGPL-3.0', count: 7 },
          { license: 'GPL-2.0', count: 3 },
          { license: 'GPL-3.0', count: 4 },
          { license: 'MIT', count: 2 },
          { license: 'LGPL-2.1', count: 2 },
          { license: 'MPL-2.0', count: 1 },
        ],
        service_tiers: [
          { tier: 'critical', count: 8, description: 'Foundation services, 99.9% availability' },
          { tier: 'high', count: 7, description: 'Important services, 99.5% availability' },
          { tier: 'standard', count: 8, description: 'Collaboration tools, 99.0% availability' },
          { tier: 'low', count: 2, description: 'Supporting tools' },
        ],
      },
    };
  }

  renderLandscape() {
    const container = document.getElementById('landscape');
    container.innerHTML = '';

    this.data.categories.forEach((category) => {
      const visibleSubcategories = category.subcategories
        .map((sub) => ({
          ...sub,
          items: sub.items.filter((item) => this.matchesFilter(item)),
        }))
        .filter((sub) => sub.items.length > 0);

      if (visibleSubcategories.length === 0) return;

      const categoryEl = document.createElement('div');
      categoryEl.className = 'category';
      categoryEl.innerHTML = `
        <div class="category-header" style="border-left: 4px solid ${category.color}">
          <h2>${category.icon} ${category.name}</h2>
          <p>${category.description}</p>
        </div>
      `;

      visibleSubcategories.forEach((sub) => {
        const subEl = document.createElement('div');
        subEl.className = 'subcategory';
        subEl.innerHTML = `
          <h3 class="subcategory-title">${sub.name}</h3>
          <div class="items-grid">
            ${sub.items.map((item) => this.renderItem(item)).join('')}
          </div>
        `;
        categoryEl.appendChild(subEl);
      });

      container.appendChild(categoryEl);
    });
  }

  renderItem(item) {
    const tagsHtml = item.tags.map((tag) => `<span class="tag">${tag}</span>`).join('');
    return `
      <a href="${item.url}" target="_blank" rel="noopener" class="item-card">
        <div class="item-header">
          <div class="item-name">${item.name}</div>
          <span class="tier-badge tier-${item.tier}">${item.tier}</span>
        </div>
        <div class="item-description">${item.description}</div>
        <div class="item-tags">${tagsHtml}</div>
        <div class="item-meta">
          <span class="item-license">${item.license}</span>
          <span>${item.maturity}</span>
        </div>
      </a>
    `;
  }

  renderMetadata() {
    this.renderLicenseStats();
    this.renderTierStats();
  }

  renderLicenseStats() {
    const container = document.getElementById('license-stats');
    container.innerHTML = this.data.metadata.license_breakdown
      .sort((a, b) => b.count - a.count)
      .map(
        (item) => `
        <div class="stat-bar">
          <span class="stat-label-sm">${item.license}</span>
          <span class="stat-value">${item.count} services</span>
        </div>
      `
      )
      .join('');
  }

  renderTierStats() {
    const container = document.getElementById('tier-stats');
    container.innerHTML = this.data.metadata.service_tiers
      .map(
        (item) => `
        <div class="stat-bar">
          <span class="stat-label-sm">${item.tier.charAt(0).toUpperCase() + item.tier.slice(1)} Tier</span>
          <span class="stat-value">${item.count} services</span>
        </div>
      `
      )
      .join('');
  }

  matchesFilter(item) {
    const tierMatch = this.currentFilter === 'all' || item.tier === this.currentFilter;
    if (!tierMatch) return false;

    if (!this.searchQuery) return true;

    const query = this.searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      item.license.toLowerCase().includes(query) ||
      item.subcategory.toLowerCase().includes(query)
    );
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderLandscape();
    });

    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderLandscape();
      });
    });
  }

  updateLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el) {
      el.textContent = new Date().toISOString().split('T')[0];
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LandscapeApp();
});
