/**
 * KnowDesk Chat Widget — embeddable script
 *
 * Usage :
 *   <script src="https://know-desk-frontend.vercel.app/chat.js"
 *           data-org="<orgSlug>"
 *           defer></script>
 *
 * Le script s'auto-installe : lit son data-org, charge la config du chatbot
 * (couleur, logo, message d'accueil) puis injecte un Web Component
 * <knowdesk-chat-widget> dans <body>. Tout est isolé en Shadow DOM pour ne
 * pas être impacté par le CSS du site hôte (et inversement).
 *
 * Multi-tour : l'historique est conservé en localStorage par session ; envoyé
 * au backend à chaque message pour permettre les références ("et combien ça
 * coûte ?" après "comment résilier ?").
 *
 * Streaming SSE : les réponses arrivent token par token via fetch + ReadableStream.
 * Pas de dépendance — vanilla JS, ~12 KB minifié.
 */
(function () {
  'use strict';

  // ── Bootstrap : lit le script tag courant ───────────────────────
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var orgSlug = currentScript && currentScript.getAttribute('data-org');
  if (!orgSlug) {
    console.warn('[knowdesk-chat] data-org manquant sur la balise script.');
    return;
  }

  // L'API endpoint est dérivé de l'origin du script — fonctionne donc en dev,
  // staging et prod sans config supplémentaire.
  var scriptUrl = new URL(currentScript.src);
  var API_BASE = scriptUrl.origin + '/public/v1/chat';

  // ── État global du widget ────────────────────────────────────────
  var state = {
    open:     false,
    config:   null,            // { orgName, welcomeMessage, primaryColor, logoUrl }
    history:  loadHistory(),   // [{role, content}, ...]
    pending:  false,           // attend une réponse du serveur
    sources:  [],              // sources de la dernière réponse
    error:    null,
  };

  function storageKey() { return 'knowdesk_chat_history_' + orgSlug; }
  function loadHistory() {
    try {
      var raw = localStorage.getItem(storageKey());
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(-20) : [];
    } catch (e) { return []; }
  }
  function saveHistory(h) {
    try { localStorage.setItem(storageKey(), JSON.stringify(h.slice(-20))); }
    catch (e) { /* quota plein, mode privé… */ }
  }

  function sessionId() {
    var k = 'knowdesk_chat_session_' + orgSlug;
    var existing = sessionStorage.getItem(k);
    if (existing) return existing;
    var fresh = 'sess-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
    sessionStorage.setItem(k, fresh);
    return fresh;
  }

  // ── Templates HTML (Shadow DOM) ──────────────────────────────────
  var TEMPLATE = (function () {
    var tpl = document.createElement('template');
    tpl.innerHTML = ''
      + '<style>'
      + ':host { all: initial; }'
      + '* { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }'
      + '.bubble {'
      + '  position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;'
      + '  width: 56px; height: 56px; border-radius: 50%;'
      + '  background: var(--kd-primary, #5B6CFF);'
      + '  color: white; border: none; cursor: pointer;'
      + '  display: flex; align-items: center; justify-content: center;'
      + '  font-size: 24px;'
      + '  box-shadow: 0 4px 16px rgba(0,0,0,.18);'
      + '  transition: transform 0.2s, box-shadow 0.2s;'
      + '}'
      + '.bubble:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(0,0,0,.22); }'
      + '.bubble:focus-visible { outline: 3px solid rgba(91,108,255,.4); outline-offset: 2px; }'
      + '.panel {'
      + '  position: fixed; bottom: 90px; right: 20px; z-index: 2147483647;'
      + '  width: min(380px, calc(100vw - 40px));'
      + '  height: min(560px, calc(100vh - 120px));'
      + '  background: white; border-radius: 12px;'
      + '  box-shadow: 0 12px 32px rgba(0,0,0,.18), 0 4px 12px rgba(0,0,0,.08);'
      + '  display: none; flex-direction: column; overflow: hidden;'
      + '  animation: kd-slide-up 0.18s ease-out;'
      + '}'
      + '.panel--open { display: flex; }'
      + '@keyframes kd-slide-up { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }'
      + '.header {'
      + '  display: flex; align-items: center; gap: 10px;'
      + '  padding: 14px 16px; background: var(--kd-primary, #5B6CFF); color: white;'
      + '}'
      + '.header__logo { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,.15); }'
      + '.header__title { flex: 1; font-size: 14px; font-weight: 600; }'
      + '.header__close { background: transparent; border: none; color: white; cursor: pointer; padding: 4px 8px; font-size: 18px; line-height: 1; opacity: 0.85; }'
      + '.header__close:hover { opacity: 1; }'
      + '.messages { flex: 1; overflow-y: auto; padding: 14px; background: #f8f9fb; display: flex; flex-direction: column; gap: 8px; }'
      + '.msg { display: flex; gap: 6px; max-width: 85%; }'
      + '.msg--user { align-self: flex-end; }'
      + '.msg--bot { align-self: flex-start; }'
      + '.msg__bubble { padding: 9px 12px; border-radius: 12px; font-size: 13.5px; line-height: 1.45; word-wrap: break-word; white-space: pre-wrap; }'
      + '.msg--user .msg__bubble { background: var(--kd-primary, #5B6CFF); color: white; border-bottom-right-radius: 3px; }'
      + '.msg--bot .msg__bubble { background: white; color: #1a1a1a; border-bottom-left-radius: 3px; box-shadow: 0 1px 2px rgba(0,0,0,.06); }'
      + '.msg__cite { font-size: 9px; vertical-align: super; color: var(--kd-primary, #5B6CFF); font-weight: 600; }'
      + '.cursor { display: inline-block; width: 1.5px; height: 12px; background: currentColor; margin-left: 2px; vertical-align: middle; animation: kd-blink 0.9s steps(2) infinite; }'
      + '@keyframes kd-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }'
      + '.sources { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }'
      + '.source-chip { font-size: 10.5px; background: #eef0ff; color: var(--kd-primary, #5B6CFF); padding: 2px 7px; border-radius: 999px; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }'
      + '.input-row { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid #eaecef; background: white; }'
      + '.input-row input { flex: 1; padding: 9px 12px; border: 1px solid #d6dae0; border-radius: 8px; font-size: 13.5px; outline: none; }'
      + '.input-row input:focus { border-color: var(--kd-primary, #5B6CFF); box-shadow: 0 0 0 3px rgba(91,108,255,.15); }'
      + '.input-row button { padding: 9px 14px; background: var(--kd-primary, #5B6CFF); color: white; border: none; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; }'
      + '.input-row button:disabled { opacity: 0.5; cursor: not-allowed; }'
      + '.disclaimer { font-size: 10px; color: #888; text-align: center; padding: 4px 12px 8px; background: white; }'
      + '</style>'
      + '<button class="bubble" type="button" aria-label="Ouvrir le chat">💬</button>'
      + '<div class="panel" role="dialog" aria-label="Chat">'
      + '  <div class="header">'
      + '    <div class="header__logo-wrap"></div>'
      + '    <div class="header__title">Discutons</div>'
      + '    <button class="header__close" type="button" aria-label="Fermer">×</button>'
      + '  </div>'
      + '  <div class="messages" role="log" aria-live="polite"></div>'
      + '  <form class="input-row">'
      + '    <input type="text" placeholder="Posez votre question…" autocomplete="off" maxlength="500" />'
      + '    <button type="submit">Envoyer</button>'
      + '  </form>'
      + '  <div class="disclaimer">Réponses générées par IA — vérifiez les informations importantes</div>'
      + '</div>';
    return tpl;
  })();

  // ── Web Component ────────────────────────────────────────────────
  function ChatWidget() {
    var el = document.createElement('div');
    el.attachShadow({ mode: 'open' });
    el.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
    return el;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderMessages(root) {
    var messagesEl = root.querySelector('.messages');
    messagesEl.innerHTML = '';
    state.history.forEach(function (turn) {
      var msg = document.createElement('div');
      msg.className = 'msg msg--' + (turn.role === 'user' ? 'user' : 'bot');
      var bubble = document.createElement('div');
      bubble.className = 'msg__bubble';
      // Linkify [n] et conserve les sauts de ligne
      bubble.innerHTML = escapeHtml(turn.content).replace(/\[(\d+)\]/g, '<span class="msg__cite">[$1]</span>');
      msg.appendChild(bubble);
      messagesEl.appendChild(msg);
    });
    // Sources de la dernière réponse
    if (state.sources.length > 0 && state.history.length > 0 && state.history[state.history.length - 1].role === 'assistant') {
      var lastMsg = messagesEl.lastChild;
      if (lastMsg) {
        var sources = document.createElement('div');
        sources.className = 'sources';
        state.sources.forEach(function (s, i) {
          var chip = document.createElement('span');
          chip.className = 'source-chip';
          var icon = s.type === 'faq' ? '❓' : (s.type === 'tree' ? '🌳' : '📄');
          chip.textContent = '[' + (i + 1) + '] ' + icon + ' ' + s.title;
          sources.appendChild(chip);
        });
        lastMsg.appendChild(sources);
      }
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setStreamingMessage(root, partialText) {
    var messagesEl = root.querySelector('.messages');
    var lastMsg = messagesEl.querySelector('.msg--bot:last-child .msg__bubble');
    if (!lastMsg) {
      var msg = document.createElement('div');
      msg.className = 'msg msg--bot';
      var bubble = document.createElement('div');
      bubble.className = 'msg__bubble';
      msg.appendChild(bubble);
      messagesEl.appendChild(msg);
      lastMsg = bubble;
    }
    lastMsg.innerHTML = escapeHtml(partialText).replace(/\[(\d+)\]/g, '<span class="msg__cite">[$1]</span>') + '<span class="cursor"></span>';
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── Logique d'envoi message ──────────────────────────────────────
  async function sendMessage(root, text) {
    if (!text.trim() || state.pending) return;
    state.pending = true;
    state.sources = [];
    state.history.push({ role: 'user', content: text.trim() });
    renderMessages(root);
    saveHistory(state.history);

    // Bot bubble en streaming
    var streamedText = '';
    setStreamingMessage(root, '');
    var fallbackHit = false;

    try {
      var resp = await fetch(API_BASE + '/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug:   orgSlug,
          sessionId: sessionId(),
          history:   state.history.slice(-10),  // dernier 10 tours envoyés
        }),
      });
      if (!resp.ok || !resp.body) throw new Error('HTTP ' + resp.status);

      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';

      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        var events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (var i = 0; i < events.length; i++) {
          var raw = events[i];
          var nameMatch = raw.match(/^event:\s*(\w+)/m);
          var dataMatch = raw.match(/^data:\s*(.+)$/m);
          if (!nameMatch || !dataMatch) continue;
          var name = nameMatch[1];
          var data;
          try { data = JSON.parse(dataMatch[1]); } catch (e) { continue; }

          if (name === 'sources') {
            state.sources = (data.sources || []).slice(0, 5);
          } else if (name === 'token') {
            streamedText += (data.text || '');
            setStreamingMessage(root, streamedText);
          } else if (name === 'fallback') {
            // Le serveur indique qu'il ne sait pas → message admin-configuré
            streamedText = data.message || streamedText || 'Désolé, je n\'ai pas la réponse.';
            setStreamingMessage(root, streamedText);
            fallbackHit = true;
          } else if (name === 'done') {
            break;
          }
        }
      }

      // Persiste le tour assistant
      state.history.push({
        role:    'assistant',
        content: streamedText || 'Désolé, je n\'ai pas pu répondre.',
      });
      saveHistory(state.history);
      // Pas de sources affichées si on est tombé en fallback (réponse "je sais pas")
      if (fallbackHit) state.sources = [];
      renderMessages(root);
    } catch (err) {
      state.history.push({
        role:    'assistant',
        content: 'Désolé, une erreur technique m\'empêche de répondre. Réessayez dans un instant.',
      });
      saveHistory(state.history);
      renderMessages(root);
    } finally {
      state.pending = false;
      var input = root.querySelector('.input-row input');
      var btn   = root.querySelector('.input-row button');
      if (input) input.disabled = false;
      if (btn)   btn.disabled = false;
    }
  }

  // ── Init après chargement de la config ───────────────────────────
  async function init() {
    // Empêche un double-init si le script est inclus deux fois
    if (window.__knowdeskChatLoaded) return;
    window.__knowdeskChatLoaded = true;

    // Charge la config publique du chatbot pour l'org
    var configResp;
    try {
      configResp = await fetch(API_BASE + '/config?orgSlug=' + encodeURIComponent(orgSlug));
    } catch (err) {
      console.warn('[knowdesk-chat] impossible de joindre le serveur', err);
      return;
    }
    if (!configResp.ok) {
      // 403 : domaine non autorisé ; 404 : org inconnue ; etc. — silencieux
      return;
    }
    var json = await configResp.json();
    state.config = json.data;

    // Crée le widget
    var widget = ChatWidget();
    document.body.appendChild(widget);
    var root = widget.shadowRoot;

    // Apparence
    if (state.config.primaryColor) {
      widget.style.setProperty('--kd-primary', state.config.primaryColor);
    }
    var logoWrap = root.querySelector('.header__logo-wrap');
    if (state.config.logoUrl) {
      var img = document.createElement('img');
      img.className = 'header__logo';
      img.src = state.config.logoUrl;
      img.alt = state.config.orgName || '';
      logoWrap.appendChild(img);
    }
    var titleEl = root.querySelector('.header__title');
    if (titleEl) titleEl.textContent = state.config.orgName ? ('Chat ' + state.config.orgName) : 'Discutons';

    // Welcome message si historique vide
    if (state.history.length === 0) {
      state.history.push({
        role:    'assistant',
        content: state.config.welcomeMessage || 'Bonjour 👋 Comment puis-je vous aider ?',
      });
      saveHistory(state.history);
    }
    renderMessages(root);

    // Wiring
    var bubble = root.querySelector('.bubble');
    var panel  = root.querySelector('.panel');
    var close  = root.querySelector('.header__close');
    var form   = root.querySelector('.input-row');
    var input  = root.querySelector('.input-row input');

    function open() {
      panel.classList.add('panel--open');
      bubble.style.display = 'none';
      setTimeout(function () { input.focus(); }, 50);
      state.open = true;
    }
    function closeP() {
      panel.classList.remove('panel--open');
      bubble.style.display = 'flex';
      state.open = false;
    }
    bubble.addEventListener('click', open);
    close.addEventListener('click', closeP);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = '';
      input.disabled = true;
      var btn = form.querySelector('button');
      if (btn) btn.disabled = true;
      sendMessage(root, v);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
