/* kollaboration.js — Collaborative learning rooms (API-driven) */

var Collaboration = (function () {
  'use strict';

  var API_BASE = '/api';
  var POLL_INTERVAL_MS = 5000;

  var state = {
    isLoggedIn: false,
    currentSessionId: null,
    sessions: [],
    messages: [],
    exercises: [],
    challenges: [],
    participants: [],
    pollTimer: null,
  };

  /* ── Utilities ── */

  function apiFetch(url, opts) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
    return fetch(API_BASE + url, opts).then(function (r) {
      if (r.status === 401) {
        state.isLoggedIn = false;
        showLoginNotice();
        throw new Error('Nicht angemeldet (401)');
      }
      if (!r.ok) {
        return r.text().then(function (text) {
          throw new Error(text || 'HTTP ' + r.status);
        });
      }
      return r.json();
    });
  }

  function checkLoginStatus() {
    var cookie = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
    state.isLoggedIn = !!cookie;
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function timeAgo(isoStr) {
    if (!isoStr) return '';
    var diff = Date.now() - new Date(isoStr).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'gerade eben';
    if (mins < 60) return 'vor ' + mins + ' min';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return 'vor ' + hrs + ' h';
    return 'vor ' + Math.floor(hrs / 24) + ' Tagen';
  }

  function formatTime(isoStr) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  /* ── DOM Helpers ── */

  function $(id) {
    return document.getElementById(id);
  }
  function show(id) {
    var el = $(id);
    if (el) el.style.display = '';
  }
  function hide(id) {
    var el = $(id);
    if (el) el.style.display = 'none';
  }
  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }
  function setHtml(id, html) {
    var el = $(id);
    if (el) el.innerHTML = html;
  }

  /* ── Login / Error UI ── */

  function showLoginNotice() {
    hide('session-list-view');
    hide('session-detail-view');
    hide('session-error');
    show('login-notice');
  }
  function showError(msg) {
    setText('session-error-msg', msg);
    show('session-error');
  }
  function hideError() {
    hide('session-error');
  }

  /* ── Session List ── */

  function loadSessions() {
    hideError();
    checkLoginStatus();
    if (!state.isLoggedIn) {
      showLoginNotice();
      return;
    }
    setHtml(
      'session-list',
      '<p class="text-muted text-center"><i class="fa fa-spinner fa-spin"></i> Lade Lernräume...</p>'
    );
    show('session-list-view');
    hide('session-detail-view');
    apiFetch('/collab/sessions')
      .then(function (data) {
        state.sessions = (data && data.sessions) || data || [];
        renderSessionList();
      })
      .catch(function (err) {
        setHtml('session-list', '<p class="text-muted text-center">Keine Lernräume verfügbar.</p>');
        if (err.message.indexOf('401') === -1) console.error('[kollaboration]', err);
      });
  }

  function renderSessionList() {
    if (!state.sessions.length) {
      setHtml(
        'session-list',
        '<p class="text-muted text-center">Noch keine Lernräume vorhanden. Erstelle den ersten!</p>'
      );
      return;
    }
    var html = state.sessions
      .map(function (s) {
        var pc = (s.participants && s.participants.length) || s.participantCount || 0;
        var topicHtml = s.topic
          ? '<span><i class="fa fa-tag"></i> ' + escapeHtml(s.topic) + '</span>'
          : '';
        return (
          '<div class="session-card"><div class="session-info"><div class="session-name"><i class="fa fa-comments-o"></i> ' +
          escapeHtml(s.name || s.id) +
          '</div><div class="session-meta"><span><i class="fa fa-user"></i> ' +
          pc +
          '</span>' +
          topicHtml +
          '<span><i class="fa fa-clock-o"></i> ' +
          timeAgo(s.createdAt || s.created_at) +
          '</span></div></div>' +
          '<div class="session-actions"><button class="btn btn-sm btn-success" onclick="Collaboration.joinSession(\'' +
          s.id +
          '\'); return false;"><i class="fa fa-sign-in"></i> Beitreten</button></div></div>'
        );
      })
      .join('');
    setHtml('session-list', html);
  }

  /* ── Create Session ── */

  function showCreateModal() {
    if (!state.isLoggedIn) {
      showLoginNotice();
      return;
    }
    document.getElementById('session-name').value = '';
    document.getElementById('session-topic').value = '';
    jQuery('#create-session-modal').modal('show');
  }

  function doCreateSession() {
    var name = document.getElementById('session-name').value.trim();
    if (!name) {
      alert('Bitte gib einen Namen für den Lernraum ein.');
      return;
    }
    var topic = document.getElementById('session-topic').value.trim();

    apiFetch('/collab/sessions', {
      method: 'POST',
      body: JSON.stringify({ name: name, topic: topic }),
    })
      .then(function (data) {
        jQuery('#create-session-modal').modal('hide');
        var sessionId = data.session && data.session.id ? data.session.id : data.id;
        if (sessionId) {
          return joinSession(sessionId);
        }
        return loadSessions();
      })
      .catch(function (err) {
        showError('Fehler beim Erstellen: ' + err.message);
      });
  }

  /* ── Join / Leave ── */

  function joinSession(sessionId) {
    hideError();
    return apiFetch('/collab/sessions/' + encodeURIComponent(sessionId) + '/join', {
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then(function () {
        state.currentSessionId = sessionId;
        showSessionDetail(sessionId);
      })
      .catch(function (err) {
        if (err.message.indexOf('already') !== -1 || err.message.indexOf('bereits') !== -1) {
          state.currentSessionId = sessionId;
          showSessionDetail(sessionId);
          return;
        }
        showError('Beitritt fehlgeschlagen: ' + err.message);
      });
  }

  function leaveSession() {
    if (!state.currentSessionId) return;
    if (!confirm('Lernraum wirklich verlassen?')) return;

    stopPolling();
    apiFetch('/collab/sessions/' + encodeURIComponent(state.currentSessionId) + '/leave', {
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then(function () {
        state.currentSessionId = null;
        showSessionList();
      })
      .catch(function (err) {
        console.error('[kollaboration] leave failed', err);
        state.currentSessionId = null;
        showSessionList();
      });
  }

  /* ── Session Detail ── */

  function showSessionList() {
    stopPolling();
    state.currentSessionId = null;
    hide('session-detail-view');
    show('session-list-view');
    loadSessions();
  }

  function showSessionDetail(sessionId) {
    hide('session-list-view');
    hide('session-error');
    hide('login-notice');
    show('session-detail-view');
    setText('detail-session-name', 'Lade...');

    // Fetch session detail
    apiFetch('/collab/sessions/' + encodeURIComponent(sessionId))
      .then(function (data) {
        var session = data.session || data;
        setText('detail-session-name', escapeHtml(session.name || sessionId));
        renderParticipants(session.participants || []);
      })
      .catch(function (err) {
        console.error('[kollaboration] detail fetch failed', err);
      });

    // Load chat messages
    loadMessages();

    // Load exercises
    loadExercises();

    // Load quiz challenges
    loadChallenges();

    // Start polling for new messages
    startPolling();
  }

  /* ── Participants ── */

  function renderParticipants(participants) {
    state.participants = participants || [];
    if (!state.participants.length) {
      setHtml('participants-list', '<p class="text-muted">Keine Teilnehmer</p>');
      return;
    }
    var html = state.participants
      .map(function (p) {
        var name = p.username || p.name || p.userId || 'Unbekannt';
        return (
          '<div class="participant-item"><i class="fa fa-user"></i><span class="participant-name">' +
          escapeHtml(name) +
          '</span></div>'
        );
      })
      .join('');
    setHtml('participants-list', html);
  }

  /* ── Chat ── */

  function loadMessages() {
    if (!state.currentSessionId) return;
    apiFetch('/collab/sessions/' + encodeURIComponent(state.currentSessionId) + '/messages')
      .then(function (data) {
        state.messages = (data && data.messages) || [];
        renderMessages();
      })
      .catch(function (err) {
        if (err.message.indexOf('401') === -1) {
          console.error('[kollaboration] messages fetch failed', err);
        }
      });
  }

  function renderMessages() {
    if (!state.messages.length) {
      setHtml(
        'chat-messages',
        '<p class="text-muted text-center">Keine Nachrichten. Schreibe die erste!</p>'
      );
      return;
    }

    // Determine our username from the first message's author that matches
    var currentUser = getCurrentUsername();

    var html = state.messages
      .map(function (msg) {
        var author = msg.username || msg.author || msg.userId || 'Unbekannt';
        var isOwn = author === currentUser;
        var bubbleClass = isOwn ? 'message-bubble message-own' : 'message-bubble message-other';
        return (
          '<div class="' +
          bubbleClass +
          '">' +
          '<div class="message-header">' +
          '<span class="message-author">' +
          escapeHtml(author) +
          '</span>' +
          '<span class="message-time">' +
          formatTime(msg.createdAt || msg.timestamp || msg.created_at) +
          '</span>' +
          '</div>' +
          '<div class="message-text">' +
          escapeHtml(msg.text || msg.content || msg.message || '') +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    setHtml('chat-messages', html);

    // Auto-scroll to bottom
    var chatEl = document.getElementById('chat-messages');
    if (chatEl) {
      chatEl.scrollTop = chatEl.scrollHeight;
    }
  }

  function getCurrentUsername() {
    var match = document.cookie.match(/(?:^|;\s*)username=([^;]*)/);
    if (match) return decodeURIComponent(match[1]);
    return null;
  }

  function sendMessage() {
    if (!state.currentSessionId) return;
    var input = document.getElementById('chat-input');
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.focus();

    apiFetch('/collab/sessions/' + encodeURIComponent(state.currentSessionId) + '/messages', {
      method: 'POST',
      body: JSON.stringify({ text: text }),
    })
      .then(function () {
        loadMessages();
      })
      .catch(function (err) {
        showError('Nachricht konnte nicht gesendet werden: ' + err.message);
      });
  }

  /* ── Polling ── */

  function startPolling() {
    stopPolling();
    state.pollTimer = setInterval(function () {
      if (state.currentSessionId) {
        loadMessages();
        loadParticipants();
      }
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  function loadParticipants() {
    if (!state.currentSessionId) return;
    apiFetch('/collab/sessions/' + encodeURIComponent(state.currentSessionId))
      .then(function (data) {
        var session = data.session || data;
        if (session && session.participants) {
          renderParticipants(session.participants);
        }
      })
      .catch(function () {
        // Silent — polling shouldn't show errors
      });
  }

  /* ── Exercises ── */

  function loadExercises() {
    if (!state.currentSessionId) return;
    apiFetch('/collab/sessions/' + encodeURIComponent(state.currentSessionId) + '/exercises')
      .then(function (data) {
        state.exercises = (data && data.exercises) || [];
        renderExercises();
      })
      .catch(function (err) {
        if (err.message.indexOf('401') === -1) {
          console.error('[kollaboration] exercises fetch failed', err);
        }
      });
  }

  function renderExercises() {
    if (!state.exercises.length) {
      setHtml('shared-exercises', '<p class="text-muted">Noch keine Übungen geteilt.</p>');
      return;
    }

    var html = state.exercises
      .map(function (ex) {
        var completed = ex.completed || ex.isCompleted || false;
        var cardClass = completed ? 'exercise-card exercise-completed' : 'exercise-card';
        var author = ex.username || ex.author || ex.userId || 'Unbekannt';
        var name = ex.name || ex.title || ex.exerciseId || 'Übung';
        return (
          '<div class="' +
          cardClass +
          '">' +
          '<div class="exercise-info">' +
          '<div class="exercise-name">' +
          '<i class="fa fa-pencil-square-o"></i> ' +
          escapeHtml(name) +
          '</div>' +
          '<div class="exercise-meta">' +
          '<span><i class="fa fa-user"></i> ' +
          escapeHtml(author) +
          '</span>' +
          (completed
            ? ' <span class="label label-success"><i class="fa fa-check"></i> Erledigt</span>'
            : ' <span class="label label-warning">Offen</span>') +
          '</div>' +
          '</div>' +
          (completed
            ? ''
            : '<button class="btn btn-xs btn-success" onclick="Collaboration.completeExercise(\'' +
              ex.id +
              '\'); return false;">' +
              '<i class="fa fa-check"></i> Erledigt</button>') +
          '</div>'
        );
      })
      .join('');

    setHtml('shared-exercises', html);
  }

  function shareExercise() {
    if (!state.currentSessionId) return;
    var exerciseName = prompt('Name der Übung, die du teilen möchtest:');
    if (!exerciseName || !exerciseName.trim()) return;

    apiFetch('/collab/sessions/' + encodeURIComponent(state.currentSessionId) + '/exercises', {
      method: 'POST',
      body: JSON.stringify({ exercise: { name: exerciseName.trim() } }),
    })
      .then(function () {
        loadExercises();
      })
      .catch(function (err) {
        showError('Übung konnte nicht geteilt werden: ' + err.message);
      });
  }

  function completeExercise(exerciseId) {
    if (!state.currentSessionId) return;
    apiFetch(
      '/collab/sessions/' +
        encodeURIComponent(state.currentSessionId) +
        '/exercises/' +
        encodeURIComponent(exerciseId) +
        '/complete',
      { method: 'POST', body: JSON.stringify({}) }
    )
      .then(function () {
        loadExercises();
      })
      .catch(function (err) {
        showError('Übung konnte nicht als erledigt markiert werden: ' + err.message);
      });
  }

  /* ── Quiz Challenges (social learning) ── */

  function showPostChallengeModal() {
    if (!state.currentSessionId) return;
    var score = document.getElementById('challenge-score');
    var total = document.getElementById('challenge-total');
    var topic = document.getElementById('challenge-topic');
    var note = document.getElementById('challenge-note');
    if (score) score.value = '';
    if (total) total.value = '';
    if (topic) topic.value = '';
    if (note) note.value = '';
    if (window.jQuery && jQuery('#post-challenge-modal')) {
      jQuery('#post-challenge-modal').modal('show');
    }
  }

  function doPostChallenge() {
    if (!state.currentSessionId) return;
    var score = parseInt(document.getElementById('challenge-score').value, 10);
    var total = parseInt(document.getElementById('challenge-total').value, 10);
    var topic = (document.getElementById('challenge-topic').value || '').trim();
    var note = (document.getElementById('challenge-note').value || '').trim();
    if (isNaN(score) || isNaN(total) || total <= 0) {
      showError('Bitte gültige Punkte und Gesamtzahl angeben.');
      return;
    }

    apiFetch('/collab/sessions/' + encodeURIComponent(state.currentSessionId) + '/challenges', {
      method: 'POST',
      body: JSON.stringify({
        topic: topic || 'Quiz',
        score: score,
        total: total,
        percentage: Math.round((score / total) * 100),
        note: note,
      }),
    })
      .then(function () {
        if (window.jQuery && jQuery('#post-challenge-modal')) {
          jQuery('#post-challenge-modal').modal('hide');
        }
        loadChallenges();
      })
      .catch(function (err) {
        showError('Challenge konnte nicht gepostet werden: ' + err.message);
      });
  }

  function loadChallenges() {
    if (!state.currentSessionId) return;
    apiFetch('/collab/sessions/' + encodeURIComponent(state.currentSessionId) + '/challenges')
      .then(function (data) {
        state.challenges = (data && data.challenges) || [];
        renderChallenges();
      })
      .catch(function (err) {
        if (err.message.indexOf('401') === -1) {
          console.error('[kollaboration] challenges fetch failed', err);
        }
      });
  }

  function renderChallenges() {
    if (!state.challenges.length) {
      setHtml(
        'challenge-list',
        '<p class="text-muted">Noch keine Quiz-Challenges. Sei die erste Person, die ein Ergebnis teilt!</p>'
      );
      return;
    }

    var html = state.challenges
      .map(function (ch) {
        var pctColor = ch.percentage >= 85 ? 'success' : ch.percentage >= 70 ? 'info' : 'warning';
        var reactions = ch.reactions || {};
        var reactionHtml =
          Object.keys(reactions)
            .map(function (emoji) {
              return (
                '<button class="btn btn-xs btn-default challenge-reaction" onclick="Collaboration.reactToChallenge(\'' +
                ch.id +
                "', '" +
                emoji +
                '\'); return false;">' +
                emoji +
                ' ' +
                reactions[emoji] +
                '</button>'
              );
            })
            .join(' ') ||
          '<button class="btn btn-xs btn-default challenge-reaction" onclick="Collaboration.reactToChallenge(\'' +
            ch.id +
            "', '👍'); return false;\">👍</button>";

        return (
          '<div class="challenge-card">' +
          '<div class="challenge-header">' +
          '<strong>' +
          escapeHtml(ch.displayName || 'Benutzer') +
          '</strong> · <span class="text-muted">' +
          escapeHtml(ch.topic || 'Quiz') +
          '</span>' +
          '<span class="pull-right label label-' +
          pctColor +
          '">' +
          ch.percentage +
          '%</span></div>' +
          '<div class="progress" style="height: 8px; margin: 8px 0;">' +
          '<div class="progress-bar progress-bar-' +
          pctColor +
          '" style="width: ' +
          Math.min(100, ch.percentage || 0) +
          '%;"></div></div>' +
          '<div class="challenge-score text-muted">' +
          ch.score +
          '/' +
          ch.total +
          ' Punkte' +
          (ch.note ? ' — ' + escapeHtml(ch.note) : '') +
          '</div>' +
          '<div class="challenge-reactions">' +
          reactionHtml +
          '</div>' +
          '<div class="challenge-date text-muted">' +
          new Date(ch.createdAt).toLocaleString('de-DE') +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    setHtml('challenge-list', html);
  }

  function reactToChallenge(challengeId, emoji) {
    if (!state.currentSessionId) return;
    apiFetch(
      '/collab/sessions/' +
        encodeURIComponent(state.currentSessionId) +
        '/challenges/' +
        encodeURIComponent(challengeId) +
        '/reactions',
      { method: 'POST', body: JSON.stringify({ emoji: emoji }) }
    )
      .then(function () {
        loadChallenges();
      })
      .catch(function (err) {
        showError('Reaktion konnte nicht gespeichert werden: ' + err.message);
      });
  }

  /* ── Init ── */

  function init() {
    checkLoginStatus();
    if (state.isLoggedIn) {
      loadSessions();
    } else {
      showLoginNotice();
    }
  }

  // Public API
  return {
    loadSessions: loadSessions,
    showCreateModal: showCreateModal,
    doCreateSession: doCreateSession,
    joinSession: joinSession,
    leaveSession: leaveSession,
    showSessionList: showSessionList,
    sendMessage: sendMessage,
    loadExercises: loadExercises,
    shareExercise: shareExercise,
    completeExercise: completeExercise,
    showPostChallengeModal: showPostChallengeModal,
    doPostChallenge: doPostChallenge,
    loadChallenges: loadChallenges,
    reactToChallenge: reactToChallenge,
    init: init,
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  Collaboration.init();
});
