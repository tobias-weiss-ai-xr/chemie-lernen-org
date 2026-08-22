/**
 * KI-Assistent
 * Chemistry Q&A chatbot backed by Knowledge Graph data.
 * Queries the kg-data.json content embedded in the page.
 */
(function () {
  'use strict';

  var kgData = null;

  /**
   * Sanitize HTML to prevent XSS from server responses.
   * Strips <script> tags, event handler attributes, and javascript: URLs.
   */
  function sanitizeAiHtml(html) {
    if (typeof html !== 'string') return '';
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
    html = html.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
    html = html.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
    html = html.replace(
      /(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi,
      '$1="#"'
    );
    html = html.replace(
      /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/gi,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );
    html = html.replace(
      /(^|[\s>])(https?:\/\/[^\s<]{1,250})(?=[\s<]|$)/gi,
      '$1<a href="$2" target="_blank" rel="noopener">$2</a>'
    );
    return html;
  }

  /**
   * Parse KG data from the embedded script tag.
   */
  function loadKgData() {
    var el = document.getElementById('kg-data');
    if (!el) return null;
    try {
      var parsed = JSON.parse(el.textContent);
      if (parsed && Array.isArray(parsed.articles)) {
        return parsed;
      }
    } catch (_) {
      /* ignore */
    }
    return null;
  }

  /**
   * Score an article against a user query.
   * Matches against title, tags, entities, description.
   * Returns a relevance score (higher = better match).
   */
  function scoreArticle(article, queryWords) {
    var score = 0;
    var titleLow = (article.title || '').toLowerCase();
    var descLow = (article.description || '').toLowerCase();
    var tags = (article.tags || []).map(function (t) {
      return t.toLowerCase();
    });
    var entities = (article.entities || []).map(function (e) {
      return e.toLowerCase();
    });

    for (var w = 0; w < queryWords.length; w++) {
      var word = queryWords[w];
      if (word.length < 2) continue;

      // Title match (highest weight)
      if (titleLow.indexOf(word) !== -1) score += 10;

      // Tag match
      for (var t = 0; t < tags.length; t++) {
        if (tags[t].indexOf(word) !== -1) score += 8;
      }

      // Entity match
      for (var e = 0; e < entities.length; e++) {
        if (entities[e].indexOf(word) !== -1) score += 6;
      }

      // Description match
      if (descLow.indexOf(word) !== -1) score += 3;
    }

    return score;
  }

  /**
   * Find the best matching articles for a query.
   */
  function findBestMatches(query, limit) {
    limit = limit || 3;
    if (!kgData || !kgData.articles || kgData.articles.length === 0) return [];

    var queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(function (w) {
        return w.length > 1;
      });

    var scored = [];
    for (var i = 0; i < kgData.articles.length; i++) {
      var article = kgData.articles[i];
      var score = scoreArticle(article, queryWords);
      if (score > 0) {
        scored.push({ article: article, score: score });
      }
    }

    // Sort by score descending
    scored.sort(function (a, b) {
      return b.score - a.score;
    });

    return scored.slice(0, limit).map(function (s) {
      return s.article;
    });
  }

  /**
   * Get a fallback thematic answer from a curated set.
   * Used when KG data is unavailable or no matches found.
   */
  var fallbackKnowledge = [
    {
      q: ['molare masse', 'molmasse', 'molekülmasse'],
      a: 'Die molare Masse (M) ist die Masse eines Mols eines Stoffes. Einheit: g/mol. Beispiel: H2O: 2×1.008 + 16.00 = 18.016 g/mol. Zum Berechnen: <a href="/molare-masse-rechner/">Molare-Masse-Rechner</a>.',
    },
    {
      q: ['stöchiometrie', 'verhältnis', 'reaktionsgleichung'],
      a: 'Die Stöchiometrie beschreibt die quantitativen Verhältnisse bei chemischen Reaktionen. Nutze den <a href="/stoechiometrie-rechner/">Stöchiometrie-Rechner</a> oder <a href="/reaktionsgleichungen-ausgleichen/">Reaktionsgleichungen-Ausgleichen</a>.',
    },
    {
      q: ['redox', 'oxidation', 'reduktion', 'elektrochemie'],
      a: 'Redox-Reaktionen sind Elektronenübertragungen. Oxidation = Elektronenabgabe, Reduktion = Elektronenaufnahme. Tools: <a href="/redox-titrationen/">Redox-Titrationen</a>, <a href="/redox-potenzial-rechner/">Redox-Potenzial-Rechner</a>.',
    },
    {
      q: ['periodensystem', 'pse', 'elementsymbol'],
      a: 'Das Periodensystem (PSE) ordnet Elemente nach Ordnungszahl. Unser interaktives System: <a href="/perioden-system-der-elemente/">3D-PSE</a>, auch als <a href="/pse-vr/">VR-Version</a>.',
    },
    {
      q: ['säure', 'base', 'ph-wert', 'ph', 'puffer'],
      a: 'Der pH-Wert gibt die H⁺-Ionenkonzentration an. pH = -log[H⁺]. Rechner: <a href="/ph-rechner/">pH-Rechner</a>, <a href="/saeuren-basen-gleichgewicht/">Säuren-Basen-Gleichgewicht</a>.',
    },
    {
      q: ['titration', 'äquivalenzpunkt', 'indikator'],
      a: 'Bei der Titration wird die Konzentration einer Lösung bestimmt. Simulator: <a href="/titrations-simulator/">Titrationssimulator</a>, <a href="/redox-titrationen/">Redox-Titrationen</a>.',
    },
    {
      q: ['gasgesetz', 'ideales gas', 'p v n t', 'boyle'],
      a: 'Ideales Gasgesetz: p·V = n·R·T. Simulator: <a href="/gasgesetz-simulator/">Gasgesetz-Simulator</a>, Rechner: <a href="/gasgesetz-rechner/">Gasgesetz-Rechner</a>.',
    },
    {
      q: ['hess', 'enthalpie', 'thermochemie'],
      a: 'Der Satz von Hess: Die Reaktionsenthalpie ist unabhängig vom Reaktionsweg. Rechner: <a href="/hess-gesetz/">Hess-Gesetz-Rechner</a>.',
    },
    {
      q: ['gleichgewicht', 'massenwirkungsgesetz', 'mwg', 'le chatelier'],
      a: 'Das chemische Gleichgewicht: MWG beschreibt das Konzentrationsverhältnis. Simulator: <a href="/chemisches-gleichgewicht/">Gleichgewichts-Simulator</a>.',
    },
    {
      q: ['kinetik', 'reaktionsgeschwindigkeit', 'arrhenius'],
      a: 'Die Reaktionskinetik beschreibt Reaktionsgeschwindigkeiten. Simulator: <a href="/reaktionskinetik-simulator/">Kinetik-Simulator</a>.',
    },
    {
      q: ['atom', 'orbital', 'energieniveau', 'bohr'],
      a: 'Atome bestehen aus Kern und Hülle. Visualisierung: <a href="/atomenergieniveaus/">Atom-Energieniveaus</a>, <a href="/molekuelorbitale/">Molekülorbitale</a>.',
    },
    {
      q: ['molekül', 'molekülgeometrie', '3d', 'vsepr'],
      a: 'Molekülgeometrien visualisieren: <a href="/molekuel-studio/">Molekülstudio</a>, <a href="/molar-mass-visualizer/">Molar Mass Visualizer</a>.',
    },
    {
      q: ['übung', 'aufgabe', 'training', 'lernen', 'quiz'],
      a: 'Übungsmöglichkeiten: <a href="/uebungsgenerator/">Übungsgenerator</a>, <a href="/aufgabensammlung/">Aufgabensammlung</a>, <a href="/lernpfad/">Lernpfad</a>.',
    },
    {
      q: ['spektrum', 'ir', 'nmr', 'spektroskopie'],
      a: 'Spektroskopie zur Strukturaufklärung: <a href="/spektroskopie-simulator/">Spektroskopie-Simulator</a>.',
    },
    {
      q: ['gefahrstoff', 'ghs', 'sicherheit', 'labor'],
      a: 'GHS-Piktogramme und Sicherheit: <a href="/gefahrstoffkennzeichnung/">Gefahrstoffkennzeichnung</a>, <a href="/laborgeraete-explorer/">Laborgeräte-Explorer</a>.',
    },
  ];

  function findFallbackAnswer(query) {
    var q = query.toLowerCase().trim();
    for (var i = 0; i < fallbackKnowledge.length; i++) {
      var entry = fallbackKnowledge[i];
      for (var j = 0; j < entry.q.length; j++) {
        if (q.indexOf(entry.q[j]) !== -1) {
          return entry.a;
        }
      }
    }
    return null;
  }

  /**
   * Displays current session usage limits prominently above the chat input.
   */
  function updateSessionInfoDisplay(remaining, messageCount) {
    var existing = document.getElementById('session-info-display');
    if (existing) existing.remove();
    if (remaining === undefined) return;

    var infoDiv = document.createElement('div');
    infoDiv.id = 'session-info-display';

    var sessionText = 'Noch ' + remaining + ' KI-Anfragen heute';
    if (messageCount !== undefined) {
      sessionText += ' (' + messageCount + '/50)';
    }

    infoDiv.textContent = sessionText;
    var chatArea = document.querySelector('.chat-input-area');
    if (chatArea && chatArea.parentNode) {
      chatArea.parentNode.insertBefore(infoDiv, chatArea);
    }
  }

  /**
   * Calls /api/chat with SSE streaming via Accept: text/event-stream.
   * Creates the bot message div immediately and appends content as chunks arrive.
   */
  function askAIStream(query) {
    var streamResolve, streamReject;
    var promise = new Promise(function (resolve, reject) {
      streamResolve = resolve;
      streamReject = reject;
    });

    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, 30000);

    var requestBody = { message: query };
    if (currentSession) {
      requestBody.sessionId = currentSession.sessionId;
    }
    var pageEntity = getCurrentEntity();
    if (pageEntity) requestBody.currentEntity = pageEntity;

    var container = document.getElementById('chat-messages');
    var botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'message bot';
    var messageContentDiv = document.createElement('div');
    messageContentDiv.className = 'message-content';
    botMessageDiv.appendChild(messageContentDiv);
    container.appendChild(botMessageDiv);
    container.scrollTop = container.scrollHeight;

    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
      .then(function (response) {
        clearTimeout(timer);

        if (!response.ok) {
          return response.json().then(function (errData) {
            errData.status = response.status;
            throw errData;
          });
        }

        var contentType = response.headers.get('content-type') || '';
        if (contentType.indexOf('text/event-stream') === -1) {
          return response.json().then(streamResolve);
        }

        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var result = {
          reply: '',
          fallback: false,
          remaining: undefined,
          sessionId: undefined,
          messageCount: undefined,
        };

        function processChunk(value, streamEnd) {
          var text = decoder.decode(value || new Uint8Array(), { stream: !streamEnd });
          var lines = text.split('\n');
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line === '' || !line.startsWith('data: ')) continue;
            var dataStr = line.substring(6);
            try {
              var data = JSON.parse(dataStr);
              if (data.content) {
                result.reply += data.content;
                messageContentDiv.innerHTML = sanitizeAiHtml(result.reply);
                container.scrollTop = container.scrollHeight;
              }
              if (data.done) {
                result.fallback = data.fallback || false;
                result.remaining = data.remaining;
                result.sessionId = data.sessionId;
                result.messageCount = data.messageCount;
                result.sources = data.sources || [];

                if (result.sessionId && currentSession) {
                  currentSession.sessionId = result.sessionId;
                  currentSession.messageCount = result.messageCount;
                  localStorage.setItem('chemie_session', JSON.stringify(currentSession));
                }

                var remainingInfo = '';
                if (result.messageCount) {
                  remainingInfo =
                    '<br><br><small style="color:#888;">Nachricht ' +
                    result.messageCount +
                    ' von max. 50 pro Sitzung.';
                }
                if (result.remaining !== undefined) {
                  remainingInfo =
                    '<br><br><small style="color:#888;">Noch ' +
                    result.remaining +
                    ' KI-Anfragen heute übrig.' +
                    remainingInfo +
                    '</small>';
                }

                if (remainingInfo) {
                  messageContentDiv.innerHTML = sanitizeAiHtml(result.reply + remainingInfo);
                }
              }
            } catch (_) {}
          }
        }

        function pump() {
          return reader
            .read()
            .then(function (chunk) {
              processChunk(chunk.value, chunk.done);
              if (chunk.done) {
                streamResolve(result);
              } else {
                return pump();
              }
            })
            .catch(function (error) {
              streamReject(error);
            });
        }

        return pump();
      })
      .catch(function (error) {
        streamReject(error);
      });

    return promise;
  }

  function formatArticleResult(articles) {
    if (articles.length === 0) return null;

    var html = 'Ich habe passende Artikel aus unserer Wissensdatenbank gefunden:<br><br>';
    for (var i = 0; i < articles.length; i++) {
      var a = articles[i];
      html += '📄 <strong><a href="' + a.url + '">' + a.title + '</a></strong><br>';
      if (a.description) {
        html += '<small>' + a.description.slice(0, 150) + '</small><br>';
      }
      if (a.tags && a.tags.length > 0) {
        html += '<small>🏷️ ' + a.tags.join(', ') + '</small>';
      }
      html += '<br><br>';
    }
    html +=
      '<em>Die Antworten basieren auf KI-generierten Zusammenfassungen aktueller Forschung.</em>';
    return html;
  }

  function formatNoResult(query) {
    // Try fallback thematic answers
    var fallback = findFallbackAnswer(query);
    if (fallback) {
      return (
        fallback +
        '<br><br><em>Diese Antwort stammt aus unserer Wissensdatenbank. Für aktuelle Forschungsergebnisse versuche einen spezifischeren Begriff.</em>'
      );
    }

    var html =
      'Tut mir leid, ich habe nichts Passendes gefunden. Versuche es mit einem anderen Begriff, z.B.:<ul>';
    var suggestions = [
      '<a href="/molare-masse-rechner/">Molare Masse</a>',
      '<a href="/ph-rechner/">pH-Wert</a>',
      '<a href="/gasgesetz-simulator/">Gasgesetze</a>',
      '<a href="/perioden-system-der-elemente/">Periodensystem</a>',
      '<a href="/uebungsgenerator/">Übungen</a>',
    ];
    for (var s = 0; s < suggestions.length; s++) {
      html += '<li>' + suggestions[s] + '</li>';
    }
    html += '</ul>';
    return html;
  }

  // Global session state
  var currentSession = null;

  /**
   * Initialize or get session from server
   */
  function initSession() {
    return new Promise(function (resolve) {
      fetch('/api/session')
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          currentSession = data;
          resolve(currentSession);
        })
        .catch(function () {
          // Fallback: use local storage if API fails
          var savedSession = localStorage.getItem('chemie_session');
          if (savedSession) {
            try {
              currentSession = JSON.parse(savedSession);
            } catch (_e) {
              currentSession = null;
            }
          }
          resolve(currentSession);
        });
    });
  }

  function getCurrentEntity() {
    var app = document.getElementById('entity-app');
    if (app && app.dataset && app.dataset.entity) return app.dataset.entity;
    var ego = document.getElementById('entity-ego-graph');
    if (ego && ego.dataset && ego.dataset.entity) return ego.dataset.entity;
    return null;
  }

  var followUpSuggestions = [
    'Was ist die molare Masse?',
    'Wie gleiche ich Reaktionsgleichungen aus?',
    'Erkläre mir den pH-Wert',
    'Was sind Redox-Reaktionen?',
    'Wie funktioniert das Periodensystem?',
    'Was ist Stöchiometrie?',
    'Erkläre mir Säuren und Basen',
    'Was ist chemisches Gleichgewicht?',
    'Wie funktioniert eine Titration?',
    'Was besagt der Satz von Hess?',
  ];

  function getRandomSuggestions(count, exclude) {
    var pool = followUpSuggestions.filter(function (s) {
      return s !== exclude;
    });
    var shuffled = pool.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    return shuffled.slice(0, count);
  }

  function addFollowUpButtons(container, suggestions) {
    var btnContainer = document.createElement('div');
    btnContainer.className = 'followup-buttons';
    btnContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.6rem;';
    suggestions.forEach(function (text) {
      var btn = document.createElement('button');
      btn.textContent = text;
      btn.style.cssText =
        'padding:0.3rem 0.7rem;border-radius:16px;font-size:0.78rem;border:1.5px solid #667eea;background:transparent;color:#667eea;cursor:pointer;transition:all 0.2s;';
      btn.onmouseover = function () {
        this.style.background = '#667eea';
        this.style.color = '#fff';
      };
      btn.onmouseout = function () {
        this.style.background = 'transparent';
        this.style.color = '#667eea';
      };
      btn.onclick = function () {
        document.getElementById('chat-input').value = this.textContent;
        handleQuery(this.textContent);
      };
      btnContainer.appendChild(btn);
    });
    container.appendChild(btnContainer);
  }

  function handleQuery(query) {
    query = query.trim();
    if (!query) return;

    addMessage(query, true);
    document.getElementById('chat-input').value = '';
    showTyping();

    // Use streaming API by default, with fallback to regular API
    askAIStream(query)
      .then(function (apiResult) {
        hideTyping();

        var matches, answer, container, lastMsg, contentDiv, remainingInfo;

        if (apiResult) {
          if (apiResult.remaining !== undefined) {
            updateSessionInfoDisplay(apiResult.remaining, apiResult.messageCount);
          }

          // If API returned fallback/empty, use client-side KG search + thematic fallback
          if (apiResult.fallback || !apiResult.reply) {
            matches = findBestMatches(query);
            answer = null;
            if (matches.length > 0) {
              answer = formatArticleResult(matches);
            }
            if (!answer) {
              answer = formatNoResult(query);
            }

            container = document.getElementById('chat-messages');
            lastMsg = container.lastElementChild;
            if (lastMsg) {
              contentDiv = lastMsg.querySelector('.message-content');
              if (contentDiv) {
                contentDiv.innerHTML = sanitizeAiHtml(answer || '');
              }
              remainingInfo = '';
              if (apiResult.messageCount) {
                remainingInfo =
                  '<br><br><small style="color:#888;">Nachricht ' +
                  apiResult.messageCount +
                  ' von max. 50 pro Sitzung.';
              }
              if (apiResult.remaining !== undefined) {
                remainingInfo =
                  '<br><br><small style="color:#888;">Noch ' +
                  apiResult.remaining +
                  ' KI-Anfragen heute übrig.' +
                  remainingInfo +
                  '</small>';
              }
              if (remainingInfo) {
                contentDiv = lastMsg.querySelector('.message-content');
                if (contentDiv) contentDiv.innerHTML += remainingInfo;
              }
              makeMessageClickable(lastMsg);
              addFollowUpButtons(lastMsg, getRandomSuggestions(4, query));
              if (container) container.scrollTop = container.scrollHeight;
            }
            return;
          }

          // Render source chips from RAG context
          container = document.getElementById('chat-messages');
          lastMsg = container.lastElementChild;
          if (lastMsg && apiResult.sources && apiResult.sources.length > 0) {
            renderSourceChips(apiResult.sources, lastMsg);
          }
          if (lastMsg) {
            makeMessageClickable(lastMsg);
          }
          // Add follow-up suggestion buttons
          if (lastMsg) {
            addFollowUpButtons(lastMsg, getRandomSuggestions(4, query));
          }
          return;
        }

        // Fallback to KG search and thematic answers
        matches = findBestMatches(query);
        answer = null;

        if (matches.length > 0) {
          answer = formatArticleResult(matches);
        }

        if (!answer) {
          answer = formatNoResult(query);
        }

        addMessage(answer, false);
        var msgContainer = document.getElementById('chat-messages');
        var lastResponse = msgContainer.lastElementChild;
        if (lastResponse) {
          addFollowUpButtons(lastResponse, getRandomSuggestions(4, query));
        }
      })
      .catch(function (error) {
        hideTyping();
        var errorMessage;

        // Custom error handling
        if (error.status === 429) {
          errorMessage =
            'Maximal 50 KI-Anfragen pro Tag erreicht. ' +
            'Versuchen Sie es morgen erneut oder stöbern Sie in unserem <a href="#">Wissensgraph</a>.';
          updateSessionInfoDisplay(0);
        } else if (
          error.status === 502 ||
          (error.message && error.message.includes('not available'))
        ) {
          // Server error
          errorMessage =
            'Der KI-Assistent ist aktuell nicht verfügbar. ' +
            'Bitte versuchen Sie es später, oder stöbern Sie in <a href="/">unseren Lerninhalten</a>.';
        } else if (
          error.name === 'AbortError' ||
          (error.message && error.message.includes('timeout'))
        ) {
          // Timeout
          errorMessage =
            'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es mit einer kürzeren Frage. ' +
            'Alternativ können Sie in <a href="/">unseren Lerninhalten</a> stöbern.';
        } else {
          // Generic error with KG search fallback
          console.error('Error:', error);
          var matches = findBestMatches(query);
          var answer;

          if (matches.length > 0) {
            answer = formatArticleResult(matches);
            addMessage(answer, false);
          } else {
            answer = formatNoResult(query);
            addMessage(answer, false);
          }
          var msgBox = document.getElementById('chat-messages');
          var lastBotMsg = msgBox.lastElementChild;
          if (lastBotMsg) {
            addFollowUpButtons(lastBotMsg, getRandomSuggestions(4, query));
          }
          return;
        }

        addMessage(errorMessage, false);
        var errContainer = document.getElementById('chat-messages');
        var lastErrMsg = errContainer.lastElementChild;
        if (lastErrMsg) {
          addFollowUpButtons(lastErrMsg, [
            'Wissensgraph durchsuchen',
            'Zu Übungen',
            'Zur Startseite',
          ]);
        }
      });
  }

  // --- Chat UI (unchanged) ---

  function addMessage(text, isUser) {
    var container = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'message ' + (isUser ? 'user' : 'bot');
    var contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    if (isUser) {
      contentDiv.textContent = text;
    } else {
      contentDiv.innerHTML = sanitizeAiHtml(text);
    }
    div.appendChild(contentDiv);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    if (!isUser) {
      makeMessageClickable(div);
    }
  }

  /**
   * Make welcome message suggestion <li> items clickable.
   * Copies the suggestion text (without surrounding quotes) to the chat input.
   */
  function makeSuggestionsClickable() {
    var items = document.querySelectorAll('.suggestions li');
    items.forEach(function (item) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', function () {
        var text = this.textContent.trim().replace(/^"|"$/g, '');
        var chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.value = text;
          chatInput.focus();
        }
      });
    });
  }

  function makeMessageClickable(messageDiv) {
    var links = messageDiv.querySelectorAll('a');
    links.forEach(function (link) {
      link.style.cursor = 'pointer';
      link.style.textDecoration = 'underline';
      link.style.color = '#007bff';
    });
  }

  function showTyping() {
    var container = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'message bot typing';
    div.id = 'typing-indicator';
    div.innerHTML =
      '<div class="message-content"><i class="fa fa-spinner fa-spin"></i> Denke nach...</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function renderSourceChips(sources, botMsgDiv) {
    if (!sources || sources.length === 0) return;
    var topSources = sources.slice(0, 5);
    var hasMore = sources.length > topSources.length;
    var sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'message-sources';
    sourcesDiv.innerHTML =
      '<div class="sources-title">Quellen aus dem Wissensgraph</div><div class="sources-chips">';
    for (var i = 0; i < topSources.length; i++) {
      var s = topSources[i];
      var chipClass = 'source-chip';
      if (s.category === 'lehrplan') chipClass += ' source-curriculum';
      else if (s.category === 'didaktik') chipClass += ' source-didaktik';
      var scoreAttr = '';
      if (typeof s.score === 'number' && !isNaN(s.score)) {
        scoreAttr =
          ' title="Relevanz: ' +
          escapeHtml(s.score.toFixed(1)) +
          '" data-score="' +
          escapeHtml(s.score.toFixed(1)) +
          '"';
        chipClass += ' source-scored';
      }
      sourcesDiv.innerHTML +=
        '<a href="/entity/' +
        slugify(s.name) +
        '/" class="' +
        chipClass +
        '"' +
        scoreAttr +
        '>' +
        escapeHtml(s.nameDisplay || s.name) +
        (s.category ? '<span class="source-cat">' + s.category + '</span>' : '') +
        '</a>';
    }
    sourcesDiv.innerHTML += '</div>';
    if (hasMore) {
      var moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'source-more-btn';
      moreBtn.textContent = 'Mehr anzeigen (' + (sources.length - topSources.length) + ' weitere)';
      moreBtn.style.cssText =
        'display:inline-block;margin-top:0.4rem;background:transparent;border:none;color:#667eea;cursor:pointer;font-size:0.78rem;text-decoration:underline;';
      moreBtn.addEventListener('click', function () {
        sourcesDiv.querySelector('.sources-chips').innerHTML = '';
        for (var j = 0; j < sources.length; j++) {
          var s2 = sources[j];
          var cc = 'source-chip';
          if (s2.category === 'lehrplan') cc += ' source-curriculum';
          else if (s2.category === 'didaktik') cc += ' source-didaktik';
          var sa = '';
          if (typeof s2.score === 'number' && !isNaN(s2.score)) {
            sa =
              ' title="Relevanz: ' +
              escapeHtml(s2.score.toFixed(1)) +
              '" data-score="' +
              escapeHtml(s2.score.toFixed(1)) +
              '"';
            cc += ' source-scored';
          }
          sourcesDiv.querySelector('.sources-chips').innerHTML +=
            '<a href="/entity/' +
            slugify(s2.name) +
            '/" class="' +
            cc +
            '"' +
            sa +
            '>' +
            escapeHtml(s2.nameDisplay || s2.name) +
            (s2.category ? '<span class="source-cat">' + s2.category + '</span>' : '') +
            '</a>';
        }
        moreBtn.remove();
      });
      sourcesDiv.appendChild(moreBtn);
    }
    botMsgDiv.appendChild(sourcesDiv);
    makeMessageClickable(botMsgDiv);
    var container = document.getElementById('chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =============================================================
  // Task 21.9: Learning profile (strength/weakness) in sidebar
  // =============================================================
  function loadLearningProfile() {
    var profileSection = document.getElementById('learning-profile');
    if (!profileSection) return;

    // Check if user is authenticated via AuthClient.me() or cookie
    var checkAuth;
    if (window.AuthClient && typeof window.AuthClient.getUser === 'function') {
      checkAuth = window.AuthClient.getUser();
    } else {
      // Fallback: check for auth cookie existence
      checkAuth = fetch('/api/auth/me', { credentials: 'same-origin' })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (data) {
          return data && data.user ? data.user : null;
        })
        .catch(function () {
          return null;
        });
    }

    Promise.resolve(checkAuth).then(function (user) {
      if (!user) return;

      fetch('/api/auth/learning-profile', { credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok) throw new Error('Profile not available');
          return r.json();
        })
        .then(function (data) {
          renderLearningProfile(data);
          profileSection.style.display = 'block';
        })
        .catch(function () {
          // Profile not available silently
        });
    });
  }

  function renderLearningProfile(data) {
    var weakList = document.getElementById('weak-areas-list');
    var strongList = document.getElementById('strong-areas-list');
    if (!weakList || !strongList) return;

    weakList.innerHTML = '';
    strongList.innerHTML = '';

    var weakAreas = data.weakAreas || data.weak_areas || [];
    var strongAreas = data.strongAreas || data.strong_areas || [];

    if (weakAreas.length === 0 && strongAreas.length === 0) {
      // If no data yet, show a placeholder
      weakList.innerHTML = '<li class="profile-empty">Noch keine Daten vorhanden.</li>';
      return;
    }

    for (var wi = 0; wi < weakAreas.length; wi++) {
      var wItem = document.createElement('li');
      wItem.textContent = weakAreas[wi].name || weakAreas[wi];
      weakList.appendChild(wItem);
    }
    if (weakAreas.length === 0) {
      weakList.innerHTML = '<li class="profile-empty">Keine identifiziert.</li>';
    }

    for (var si = 0; si < strongAreas.length; si++) {
      var sItem = document.createElement('li');
      sItem.textContent = strongAreas[si].name || strongAreas[si];
      strongList.appendChild(sItem);
    }
    if (strongAreas.length === 0) {
      strongList.innerHTML = '<li class="profile-empty">Keine identifiziert.</li>';
    }
  }

  // =============================================================
  // Task 21.11: Chat history search
  // =============================================================
  function initChatSearch() {
    var searchInput = document.getElementById('chat-search-input');
    var searchBtn = document.getElementById('chat-search-btn');
    var resultsDiv = document.getElementById('chat-search-results');
    if (!searchInput || !searchBtn || !resultsDiv) return;

    function doSearch() {
      var query = searchInput.value.trim();
      if (!query) {
        resultsDiv.style.display = 'none';
        return;
      }

      resultsDiv.style.display = 'block';
      resultsDiv.innerHTML = '<p class="chat-search-loading">Suche...</p>';

      fetch('/api/chat/history/search?q=' + encodeURIComponent(query), {
        credentials: 'same-origin',
      })
        .then(function (r) {
          if (!r.ok) throw new Error('Search failed');
          return r.json();
        })
        .then(function (data) {
          var results = data.results || data || [];
          if (results.length === 0) {
            resultsDiv.innerHTML =
              '<p class="chat-search-empty">Keine Ergebnisse gefunden.</p>' +
              '<button class="chat-search-close" id="chat-search-close">Schließen</button>';
            var closeBtn = resultsDiv.querySelector('#chat-search-close');
            if (closeBtn) {
              closeBtn.addEventListener('click', function () {
                resultsDiv.style.display = 'none';
                searchInput.value = '';
              });
            }
            return;
          }

          var html =
            '<div class="chat-search-header">' +
            '<span>' +
            results.length +
            ' Ergebnis(se)</span>' +
            '<button class="chat-search-close" id="chat-search-close">×</button>' +
            '</div>';
          for (var i = 0; i < results.length; i++) {
            var r = results[i];
            var preview = (r.preview || r.message || '').substring(0, 100);
            html +=
              '<div class="chat-search-item" data-session="' +
              escapeHtml(r.sessionId || r.id || '') +
              '">' +
              '<div class="chat-search-item-title">' +
              escapeHtml(r.title || 'Chat ' + (i + 1)) +
              '</div>' +
              '<div class="chat-search-item-preview">' +
              escapeHtml(preview) +
              '</div>' +
              '</div>';
          }
          resultsDiv.innerHTML = html;

          var searchCloseBtn = resultsDiv.querySelector('#chat-search-close');
          if (searchCloseBtn) {
            searchCloseBtn.addEventListener('click', function () {
              resultsDiv.style.display = 'none';
              searchInput.value = '';
            });
          }
          var items = resultsDiv.querySelectorAll('.chat-search-item');
          for (var j = 0; j < items.length; j++) {
            items[j].addEventListener('click', function () {
              var sessionId = this.dataset.session;
              if (sessionId) {
                // Load session into chat (dispatch custom event)
                var event = new CustomEvent('load-chat-session', {
                  detail: { sessionId: sessionId },
                });
                document.dispatchEvent(event);
                resultsDiv.style.display = 'none';
                searchInput.value = '';
              }
            });
          }
        })
        .catch(function () {
          resultsDiv.innerHTML =
            '<p class="chat-search-error">Suche fehlgeschlagen.</p>' +
            '<button class="chat-search-close" id="chat-search-close">Schließen</button>';
          var closeBtn = resultsDiv.querySelector('#chat-search-close');
          if (closeBtn) {
            closeBtn.addEventListener('click', function () {
              resultsDiv.style.display = 'none';
            });
          }
        });
    }

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      }
    });
  }

  // =============================================================
  // Task 21.12: Export conversation
  // =============================================================
  function updateExportButton() {
    var exportBtn = document.getElementById('export-chat-btn');
    if (!exportBtn) return;

    if (currentSession && currentSession.sessionId) {
      exportBtn.style.display = 'block';
      exportBtn.onclick = function () {
        exportSession(currentSession.sessionId);
      };
    } else {
      exportBtn.style.display = 'none';
    }
  }

  function exportSession(sessionId) {
    var a = document.createElement('a');
    a.href = '/api/chat/export/' + encodeURIComponent(sessionId);
    a.download = 'chat-' + sessionId + '.md';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // =============================================================
  // Task 21.10: Hint button initialization (cross-page)
  // =============================================================
  function initHintButtons() {
    // Works on any page with .hint-button elements
    var buttons = document.querySelectorAll('.hint-button');
    if (buttons.length === 0) return;

    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener('click', handleHintClick);
    }
  }

  function handleHintClick() {
    var btn = this;
    var problem = btn.dataset.problem;
    var topic = btn.dataset.topic || '';
    var hintArea = btn.nextElementSibling;

    if (!hintArea || !hintArea.classList.contains('hint-content')) {
      hintArea = document.createElement('div');
      hintArea.className = 'hint-content';
      btn.parentNode.insertBefore(hintArea, btn.nextSibling);
    }

    hintArea.innerHTML = '<p class="hint-loading">Hinweis wird generiert...</p>';
    btn.disabled = true;

    fetch('/api/chat/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem: problem, topic: topic }),
      credentials: 'same-origin',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Hint request failed');
        return res.json();
      })
      .then(function (data) {
        var hintText = data.hint || data.text || 'Kein Hinweis verfügbar.';
        hintArea.innerHTML =
          '<div class="hint-result">' + hintText.replace(/\n/g, '<br>') + '</div>';
      })
      .catch(function () {
        hintArea.innerHTML = '<p class="hint-error">Hinweis konnte nicht geladen werden.</p>';
      })
      .finally(function () {
        btn.disabled = false;
      });
  }

  // =============================================================
  // Persist session for export when streaming completes
  // =============================================================
  // Patch: after a session is established, show export button
  var _origAskAIStream = askAIStream;
  if (_origAskAIStream) {
    // Wrap askAIStream to track session ID updates
    var _origThen = Promise.prototype.then;
    // No clean way to patch the stream callback, so we listen for session updates
    // via the existing initSession mechanism and updateExportButton after initSession
  }

  function init() {
    kgData = loadKgData();
    makeSuggestionsClickable();
    loadLearningProfile();
    initChatSearch();
    initHintButtons();

    initSession().then(function (_session) {
      var input = document.getElementById('chat-input');
      var sendBtn = document.getElementById('chat-send-btn');

      if (input && sendBtn) {
        sendBtn.addEventListener('click', function () {
          handleQuery(input.value);
        });

        input.addEventListener('keypress', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleQuery(input.value);
          }
        });
      }

      updateExportButton();
      // Also watch for session changes: poll the session ID periodically
      setInterval(function () {
        if (currentSession && currentSession.sessionId) {
          updateExportButton();
        }
      }, 3000);
    });
  }

  if (document.getElementById('chat-input')) {
    init();
  }
})();
