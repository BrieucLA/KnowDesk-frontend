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
    open:           false,
    config:         null,    // { orgName, welcomeMessage, primaryColor, logoUrl }
    conversationId: null,    // créé par le serveur au 1er message, persisté localStorage
    history:        [],      // [{role:'visitor'|'assistant', content}, ...] (UI-only, pas la source de vérité)
    pending:        false,
    error:          null,
  };

  // Identifiants persistés côté client : la conversationId pour reprendre
  // une conversation après reload, et le visitorFingerprint pour suivre un
  // visiteur unique (anonyme) cross-conversations.
  function convIdKey()    { return 'knowdesk_chat_conv_'    + orgSlug; }
  function fingerprintKey() { return 'knowdesk_chat_fp_'   + orgSlug; }

  function loadConversationId() {
    try { return localStorage.getItem(convIdKey()) || null; } catch (e) { return null; }
  }
  function saveConversationId(id) {
    try { if (id) localStorage.setItem(convIdKey(), id); else localStorage.removeItem(convIdKey()); }
    catch (e) {}
  }
  function visitorFingerprint() {
    try {
      var k = fingerprintKey();
      var fp = localStorage.getItem(k);
      if (fp) return fp;
      fp = 'vis-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
      localStorage.setItem(k, fp);
      return fp;
    } catch (e) {
      // localStorage indispo (mode privé strict) → fingerprint éphémère
      return 'vis-eph-' + Math.random().toString(36).slice(2);
    }
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
      + '.header__close, .header__reset, .header__end, .header__human { background: transparent; border: none; color: white; cursor: pointer; padding: 4px 8px; font-size: 18px; line-height: 1; opacity: 0.85; }'
      + '.header__close:hover, .header__reset:hover, .header__end:hover, .header__human:hover { opacity: 1; }'
      + '.header__reset, .header__end, .header__human { font-size: 16px; }'
      + '.feedback { padding: 18px 16px; background: white; border-top: 1px solid #eaecef; }'
      + '.feedback__title { font-size: 13.5px; color: #1a1a1a; margin: 0 0 10px; line-height: 1.45; }'
      + '.feedback__choices { display: flex; flex-direction: column; gap: 6px; }'
      + '.feedback__choices button { padding: 9px 12px; background: white; border: 1px solid #d6dae0; border-radius: 8px; font-size: 13px; cursor: pointer; text-align: left; transition: all 0.12s; }'
      + '.feedback__choices button:hover { border-color: var(--kd-primary, #5B6CFF); background: #f6f7ff; }'
      + '.feedback__stars { display: flex; gap: 4px; justify-content: center; margin: 8px 0 4px; }'
      + '.feedback__stars button { background: transparent; border: none; cursor: pointer; font-size: 28px; color: #d6dae0; padding: 2px 4px; transition: color 0.1s, transform 0.1s; }'
      + '.feedback__stars button:hover { transform: scale(1.15); }'
      + '.feedback__stars button.is-active, .feedback__stars button.is-active ~ button:not(.is-active) { color: var(--kd-primary, #5B6CFF); }'
      + '.feedback__stars--hovering button { color: #d6dae0; }'
      + '.feedback__stars--hovering button.hover-up-to { color: var(--kd-primary, #5B6CFF); }'
      + '.feedback__escalate-msg { font-size: 13px; color: #4a4a4a; line-height: 1.5; margin: 8px 0 14px; padding: 10px 12px; background: #f6f7fb; border-radius: 8px; white-space: pre-wrap; }'
      + '.feedback__close-btn, .feedback__close-btn-2, .feedback__submit-btn { padding: 9px 16px; background: var(--kd-primary, #5B6CFF); color: white; border: none; border-radius: 8px; font-size: 13px; cursor: pointer; width: 100%; }'
      + '.feedback__close-btn:disabled, .feedback__submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }'
      + '.feedback__subtitle { font-size: 12.5px; color: #4a4a4a; margin: 4px 0 8px; line-height: 1.45; }'
      + '.feedback__email { width: 100%; padding: 9px 12px; border: 1px solid #d6dae0; border-radius: 8px; font-size: 13px; outline: none; margin-bottom: 10px; box-sizing: border-box; font-family: inherit; }'
      + '.feedback__email:focus { border-color: var(--kd-primary, #5B6CFF); box-shadow: 0 0 0 3px rgba(91,108,255,.15); }'
      + '.feedback__handoff-done-msg { font-size: 12.5px; color: #4a4a4a; line-height: 1.45; margin: 6px 0 14px; padding: 10px 12px; background: #f6f7fb; border-radius: 8px; white-space: pre-wrap; }'
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
      + '.quick-replies { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 0 4px; max-width: 90%; align-self: flex-start; }'
      + '.quick-reply { background: white; border: 1px solid var(--kd-primary, #5B6CFF); color: var(--kd-primary, #5B6CFF); padding: 6px 12px; border-radius: 999px; font-size: 12.5px; cursor: pointer; line-height: 1.3; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: all 0.12s; font-family: inherit; }'
      + '.quick-reply:hover { background: var(--kd-primary, #5B6CFF); color: white; }'
      + '.quick-reply:disabled { opacity: 0.5; cursor: not-allowed; }'
      // Pouces inline (Sprint 6) — petits et discrets, sous chaque réponse bot
      + '.msg-fb { display: flex; gap: 2px; margin: 2px 0 0 6px; align-self: flex-start; }'
      + '.msg-fb button { background: transparent; border: none; cursor: pointer; padding: 2px 5px; font-size: 13px; opacity: 0.45; transition: opacity 0.12s, transform 0.12s; line-height: 1; font-family: inherit; }'
      + '.msg-fb button:hover { opacity: 1; transform: scale(1.15); }'
      + '.msg-fb button.is-voted { opacity: 1; cursor: default; }'
      + '.msg-fb button.is-voted:hover { transform: none; }'
      + '.msg-fb button.is-disabled { opacity: 0.2; cursor: default; }'
      + '.msg-fb button.is-disabled:hover { transform: none; }'
      + '</style>'
      + '<button class="bubble" type="button" aria-label="Ouvrir le chat">💬</button>'
      + '<div class="panel" role="dialog" aria-label="Chat">'
      + '  <div class="header">'
      + '    <div class="header__logo-wrap"></div>'
      + '    <div class="header__title">Discutons</div>'
      + '    <button class="header__human" type="button" aria-label="Parler à un humain"      title="Parler à un humain">🙋</button>'
      + '    <button class="header__end"   type="button" aria-label="Terminer la conversation" title="Terminer la conversation">✓</button>'
      + '    <button class="header__reset" type="button" aria-label="Nouvelle conversation"     title="Nouvelle conversation">↺</button>'
      + '    <button class="header__close" type="button" aria-label="Fermer">×</button>'
      + '  </div>'
      + '  <div class="messages" role="log" aria-live="polite"></div>'
      + '  <div class="feedback" hidden>'
      + '    <div class="feedback__step feedback__step--1">'
      + '      <p class="feedback__title">Cette conversation vous a-t-elle aidé&nbsp;?</p>'
      + '      <div class="feedback__choices">'
      + '        <button type="button" data-helpful="yes">👍 Oui, parfait</button>'
      + '        <button type="button" data-helpful="partial">🤷 Pas tout à fait</button>'
      + '        <button type="button" data-helpful="no">👎 Non, besoin d\'un humain</button>'
      + '      </div>'
      + '    </div>'
      + '    <div class="feedback__step feedback__step--csat" hidden>'
      + '      <p class="feedback__title">Merci&nbsp;! Notez votre expérience&nbsp;:</p>'
      + '      <div class="feedback__stars" role="radiogroup" aria-label="Note">'
      + '        <button type="button" data-csat="1" aria-label="1 étoile">★</button>'
      + '        <button type="button" data-csat="2" aria-label="2 étoiles">★</button>'
      + '        <button type="button" data-csat="3" aria-label="3 étoiles">★</button>'
      + '        <button type="button" data-csat="4" aria-label="4 étoiles">★</button>'
      + '        <button type="button" data-csat="5" aria-label="5 étoiles">★</button>'
      + '      </div>'
      + '    </div>'
      + '    <div class="feedback__step feedback__step--escalate" hidden>'
      + '      <p class="feedback__title">Désolé que je n\'aie pas pu vous aider.</p>'
      + '      <p class="feedback__escalate-msg"></p>'
      + '      <button type="button" class="feedback__close-btn">Fermer</button>'
      + '    </div>'
      + '    <div class="feedback__step feedback__step--handoff-form" hidden>'
      + '      <p class="feedback__title">Un humain va prendre votre demande en charge.</p>'
      + '      <p class="feedback__subtitle">Laissez-nous votre email si vous souhaitez une réponse personnalisée (facultatif) :</p>'
      + '      <input type="email" class="feedback__email" placeholder="vous@exemple.fr" autocomplete="email" />'
      + '      <button type="button" class="feedback__submit-btn">Transmettre ma demande</button>'
      + '    </div>'
      + '    <div class="feedback__step feedback__step--handoff-done" hidden>'
      + '      <p class="feedback__title">✓ Votre demande a été transmise.</p>'
      + '      <p class="feedback__handoff-done-msg"></p>'
      + '      <button type="button" class="feedback__close-btn-2">Fermer</button>'
      + '    </div>'
      + '    <div class="feedback__step feedback__step--thanks" hidden>'
      + '      <p class="feedback__title">Merci pour votre retour&nbsp;! 🙏</p>'
      + '    </div>'
      + '  </div>'
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

  // Strip les éventuelles citations [n] que Mistral pourrait laisser malgré
  // l'instruction du prompt — on les retire à l'affichage pour rester propre.
  function stripCitations(text) {
    return String(text).replace(/\s*\[\d+\]\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function renderMessages(root) {
    var messagesEl = root.querySelector('.messages');
    messagesEl.innerHTML = '';
    var lastIdx = state.history.length - 1;
    state.history.forEach(function (turn, idx) {
      var msg = document.createElement('div');
      // Accepte 'visitor' (nouveau format DB) ou 'user' (ancien format) côté UI
      msg.className = 'msg msg--' + (turn.role === 'visitor' || turn.role === 'user' ? 'user' : 'bot');
      var bubble = document.createElement('div');
      bubble.className = 'msg__bubble';
      bubble.textContent = stripCitations(turn.content);
      msg.appendChild(bubble);
      messagesEl.appendChild(msg);

      // Quick replies — uniquement sous le dernier tour assistant.
      // Évite l'accumulation de chips obsolètes au fil de la conversation.
      var isLastAssistant = idx === lastIdx && (turn.role === 'assistant' || turn.role === 'bot');
      if (isLastAssistant && Array.isArray(turn.quickReplies) && turn.quickReplies.length > 0) {
        var chips = document.createElement('div');
        chips.className = 'quick-replies';
        turn.quickReplies.forEach(function (label) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'quick-reply';
          btn.textContent = label;
          btn.addEventListener('click', function () {
            // Disable pour éviter les double-clics
            chips.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
            // "Parler à un humain" → ouvre le formulaire de handoff au lieu d'envoyer
            // un message normal au bot. La fonction est exposée par init().
            if (label === 'Parler à un humain' && typeof window.__knowdeskTriggerHandoff === 'function') {
              window.__knowdeskTriggerHandoff();
              return;
            }
            sendMessage(root, label);
          });
          chips.appendChild(btn);
        });
        messagesEl.appendChild(chips);
      }

      // Pouces inline (Sprint 6) — sous chaque réponse bot SAUF welcome.
      // 👍 → marque la conversation 'resolved' (helpful=yes). 👎 → propose
      // immédiatement le handoff humain. Une fois cliqué, l'état persiste
      // visuellement (turn.voted) et l'autre bouton est désactivé.
      var isBot = turn.role === 'assistant' || turn.role === 'bot';
      if (isBot && !turn.welcome) {
        var fb = document.createElement('div');
        fb.className = 'msg-fb';

        var up = document.createElement('button');
        up.type = 'button';
        up.setAttribute('aria-label', 'Réponse utile');
        up.title = 'Cette réponse m\'a aidé';
        up.textContent = '👍';

        var down = document.createElement('button');
        down.type = 'button';
        down.setAttribute('aria-label', 'Réponse pas utile');
        down.title = 'Je n\'ai pas eu de réponse — parler à un humain';
        down.textContent = '👎';

        if (turn.voted === 'yes') {
          up.classList.add('is-voted');
          down.classList.add('is-disabled');
        } else if (turn.voted === 'no') {
          down.classList.add('is-voted');
          up.classList.add('is-disabled');
        }

        up.addEventListener('click', function () {
          if (turn.voted) return;
          turn.voted = 'yes';
          if (typeof window.__knowdeskSubmitFeedback === 'function') {
            window.__knowdeskSubmitFeedback({ helpful: 'yes' });
          }
          renderMessages(root);
        });
        down.addEventListener('click', function () {
          if (turn.voted) return;
          turn.voted = 'no';
          if (typeof window.__knowdeskSubmitFeedback === 'function') {
            window.__knowdeskSubmitFeedback({ helpful: 'no' });
          }
          renderMessages(root);
          if (typeof window.__knowdeskTriggerHandoff === 'function') {
            window.__knowdeskTriggerHandoff();
          }
        });

        fb.appendChild(up);
        fb.appendChild(down);
        messagesEl.appendChild(fb);
      }
    });
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
    // En streaming, on garde le texte tel quel + cursor ; le strip définitif
    // se fait au render final via renderMessages.
    lastMsg.innerHTML = '';
    lastMsg.appendChild(document.createTextNode(stripCitations(partialText)));
    var cur = document.createElement('span');
    cur.className = 'cursor';
    lastMsg.appendChild(cur);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── Logique d'envoi message ──────────────────────────────────────
  async function sendMessage(root, text) {
    if (!text.trim() || state.pending) return;
    state.pending = true;
    state.history.push({ role: 'visitor', content: text.trim() });
    renderMessages(root);

    var streamedText = '';
    var streamedQuickReplies = null;
    setStreamingMessage(root, '');

    try {
      var resp = await fetch(API_BASE + '/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug:            orgSlug,
          conversationId:     state.conversationId || undefined,
          visitorFingerprint: visitorFingerprint(),
          message:            text.trim(),
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

          if (name === 'conversation') {
            // Le serveur nous attribue (ou confirme) un conversationId
            if (data.id && data.id !== state.conversationId) {
              state.conversationId = data.id;
              saveConversationId(data.id);
            }
          } else if (name === 'token') {
            streamedText += (data.text || '');
            setStreamingMessage(root, streamedText);
          } else if (name === 'fallback') {
            streamedText = data.message || streamedText || 'Désolé, je n\'ai pas la réponse.';
            setStreamingMessage(root, streamedText);
          } else if (name === 'quickReplies') {
            // Les chips sont envoyées juste avant 'done' — on les stocke
            // pour les attacher au tour assistant à l'insertion finale.
            if (Array.isArray(data.items)) streamedQuickReplies = data.items;
          } else if (name === 'done') {
            break;
          }
        }
      }

      state.history.push({
        role:         'assistant',
        content:      streamedText || 'Désolé, je n\'ai pas pu répondre.',
        quickReplies: streamedQuickReplies,
      });
      renderMessages(root);
    } catch (err) {
      state.history.push({
        role:    'assistant',
        content: 'Désolé, une erreur technique m\'empêche de répondre. Réessayez dans un instant.',
      });
      renderMessages(root);
    } finally {
      state.pending = false;
      var input = root.querySelector('.input-row input');
      var btn   = root.querySelector('.input-row button');
      if (input) input.disabled = false;
      if (btn)   btn.disabled = false;
    }
  }

  // Recharge l'historique d'une conversation depuis le serveur (au reload page).
  async function fetchConversation(convId) {
    try {
      var resp = await fetch(API_BASE + '/conversation/' + encodeURIComponent(convId)
        + '?orgSlug=' + encodeURIComponent(orgSlug));
      if (resp.status === 404) {
        // Conversation purgée serveur → on en démarre une nouvelle
        saveConversationId(null);
        return null;
      }
      if (!resp.ok) return null;
      var json = await resp.json();
      return json.data;
    } catch (e) { return null; }
  }

  // Démarre une conversation neuve (bouton "Nouvelle conversation" du header).
  async function resetConversation(root) {
    var oldId = state.conversationId;
    state.conversationId = null;
    state.history = [];
    saveConversationId(null);
    if (oldId) {
      // Best-effort RGPD : supprime côté serveur. Erreur ignorée.
      fetch(API_BASE + '/conversation/' + encodeURIComponent(oldId)
        + '?orgSlug=' + encodeURIComponent(orgSlug),
        { method: 'DELETE' }).catch(function () {});
    }
    if (state.config && state.config.welcomeMessage) {
      state.history.push({
        role:    'assistant',
        content: state.config.welcomeMessage,
        welcome: true,
      });
    } else {
      state.history.push({
        role:    'assistant',
        content: 'Bonjour 👋 Comment puis-je vous aider ?',
        welcome: true,
      });
    }
    renderMessages(root);
  }

  function emitEvent(name, detail) {
    try { window.dispatchEvent(new CustomEvent('knowdesk-chat:' + name, { detail: detail || {} })); }
    catch (e) { /* CustomEvent pas dispo, ignore */ }
  }

  // ── Init après chargement de la config ───────────────────────────
  async function init() {
    // Empêche un double-init si le script est inclus deux fois
    if (window.__knowdeskChatLoaded) {
      emitEvent('error', { reason: 'already-loaded' });
      return;
    }
    window.__knowdeskChatLoaded = true;

    // Charge la config publique du chatbot pour l'org
    var configResp;
    try {
      configResp = await fetch(API_BASE + '/config?orgSlug=' + encodeURIComponent(orgSlug));
    } catch (err) {
      console.warn('[knowdesk-chat] impossible de joindre le serveur', err);
      emitEvent('error', { reason: 'network', message: String(err && err.message ? err.message : err) });
      return;
    }
    if (!configResp.ok) {
      var bodyText = '';
      try { bodyText = await configResp.text(); } catch (e) {}
      console.warn('[knowdesk-chat] config échouée', configResp.status, bodyText);
      var reason = 'unknown';
      if (configResp.status === 403) reason = 'domain-not-allowed';
      else if (configResp.status === 404) reason = 'org-not-found';
      else if (configResp.status >= 500) reason = 'server-error';
      emitEvent('error', { reason: reason, status: configResp.status, body: bodyText });
      return;
    }
    var json = await configResp.json();
    state.config = json.data;

    // Crée le widget
    var widget = ChatWidget();
    // Marqueur pour permettre à l'admin de retirer le widget proprement
    // depuis Settings → Chatbot quand il quitte la page de test.
    widget.setAttribute('data-knowdesk-chat', '1');
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

    // Recharge la conversation depuis le serveur si on a un id en local
    var existingId = loadConversationId();
    if (existingId) {
      var conv = await fetchConversation(existingId);
      if (conv && Array.isArray(conv.turns)) {
        state.conversationId = conv.id;
        state.history = conv.turns.map(function (t) {
          return {
            role:         t.role,
            content:      t.content,
            quickReplies: Array.isArray(t.quickReplies) ? t.quickReplies : null,
          };
        });
      }
    }
    // Welcome message si conversation neuve
    if (state.history.length === 0) {
      state.history.push({
        role:    'assistant',
        content: state.config.welcomeMessage || 'Bonjour 👋 Comment puis-je vous aider ?',
        welcome: true,
      });
    }
    renderMessages(root);

    // Wiring
    var bubble = root.querySelector('.bubble');
    var panel  = root.querySelector('.panel');
    var close  = root.querySelector('.header__close');
    var reset  = root.querySelector('.header__reset');
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
    if (reset) reset.addEventListener('click', function () { resetConversation(root); });

    // Bouton "humain" du header (Sprint 6) — handoff direct, sans passer par
    // les quick replies. Le bouton n'est visible qu'une fois la conversation
    // commencée (≥ 1 turn visiteur) pour ne pas inciter à escalader avant
    // toute interaction.
    var humanBtn = root.querySelector('.header__human');

    // ── Feedback flow ────────────────────────────────────────────
    var endBtn       = root.querySelector('.header__end');
    var feedbackEl   = root.querySelector('.feedback');
    var fbStep1      = root.querySelector('.feedback__step--1');
    var fbStepCsat   = root.querySelector('.feedback__step--csat');
    var fbStepEsc    = root.querySelector('.feedback__step--escalate');
    var fbStepThanks = root.querySelector('.feedback__step--thanks');
    var fbHandoffForm = root.querySelector('.feedback__step--handoff-form');
    var fbHandoffDone = root.querySelector('.feedback__step--handoff-done');

    function hideAllFbSteps() {
      [fbStep1, fbStepCsat, fbStepEsc, fbStepThanks, fbHandoffForm, fbHandoffDone].forEach(function (el) {
        if (el) el.hidden = true;
      });
    }

    /** Déclenche le flow handoff humain (depuis quick reply ou feedback). */
    window.__knowdeskTriggerHandoff = function () { triggerHandoffFlow(root); };
    if (humanBtn) {
      humanBtn.addEventListener('click', function () {
        // Ne propose pas le handoff si rien n'a été échangé — évite les escalades
        // « réflexes » dès l'ouverture du widget.
        var hasInteracted = state.history.filter(function (t) { return t.role === 'visitor'; }).length > 0;
        if (!hasInteracted) {
          // Petit feedback visuel : flash le bouton
          humanBtn.style.opacity = '0.4';
          setTimeout(function () { humanBtn.style.opacity = ''; }, 400);
          return;
        }
        triggerHandoffFlow(root);
      });
    }
    function triggerHandoffFlow(rootEl) {
      // Cache l'input et affiche le formulaire handoff
      form.style.display = 'none';
      feedbackEl.hidden = false;
      hideAllFbSteps();
      fbHandoffForm.hidden = false;
      var emailInput = fbHandoffForm.querySelector('.feedback__email');
      if (emailInput) emailInput.focus();
    }

    async function submitHandoff(visitorEmail) {
      if (!state.conversationId) return null;
      try {
        var resp = await fetch(API_BASE + '/conversation/'
          + encodeURIComponent(state.conversationId) + '/handoff', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            orgSlug:      orgSlug,
            visitorEmail: visitorEmail || '',
          }),
        });
        if (!resp.ok) return null;
        var json = await resp.json();
        return json.data;
      } catch (e) { return null; }
    }

    var submitHandoffBtn = fbHandoffForm.querySelector('.feedback__submit-btn');
    if (submitHandoffBtn) {
      submitHandoffBtn.addEventListener('click', async function () {
        var emailInput = fbHandoffForm.querySelector('.feedback__email');
        var email = emailInput ? emailInput.value.trim() : '';
        // Validation email simple si fourni
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          emailInput.focus();
          emailInput.style.borderColor = '#e74c3c';
          return;
        }
        submitHandoffBtn.disabled = true;
        submitHandoffBtn.textContent = 'Transmission…';
        var result = await submitHandoff(email);
        // Affiche la confirmation, avec ou sans le fallback message admin
        hideAllFbSteps();
        fbHandoffDone.hidden = false;
        var msgEl = fbHandoffDone.querySelector('.feedback__handoff-done-msg');
        var fallback = (state.config && state.config.fallbackMessage) || '';
        if (result && result.delivered === 'webhook') {
          msgEl.textContent = email
            ? 'Notre équipe vous répondra à ' + email + ' dans les meilleurs délais.'
            : (fallback || 'Notre équipe va prendre contact via les canaux habituels.');
        } else if (result && result.delivered === 'email') {
          msgEl.textContent = email
            ? 'Notre équipe a reçu votre demande et vous répondra à ' + email + '.'
            : (fallback || 'Notre équipe a reçu votre demande.');
        } else {
          // 'none' ou erreur de livraison → on affiche le fallback admin
          msgEl.textContent = fallback || 'Merci, votre demande a été enregistrée.';
        }
      });
    }

    var closeHandoffDoneBtn = fbHandoffDone.querySelector('.feedback__close-btn-2');
    if (closeHandoffDoneBtn) {
      closeHandoffDoneBtn.addEventListener('click', function () {
        hideFeedback();
        // Reset complet : la conversation est terminée (escalated côté serveur)
        state.conversationId = null;
        state.history = [];
        saveConversationId(null);
        closeP();
      });
    }

    function showFeedback() {
      // Cache l'input et affiche le panneau de feedback (étape 1)
      form.style.display = 'none';
      feedbackEl.hidden = false;
      fbStep1.hidden = false;
      fbStepCsat.hidden = true;
      fbStepEsc.hidden = true;
      fbStepThanks.hidden = true;
    }
    function hideFeedback() {
      feedbackEl.hidden = true;
      form.style.display = '';
    }

    async function submitFeedback(payload) {
      if (!state.conversationId) return;
      try {
        await fetch(API_BASE + '/conversation/' + encodeURIComponent(state.conversationId) + '/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({ orgSlug: orgSlug }, payload)),
        });
      } catch (e) { /* silencieux : feedback non critique */ }
    }
    // Exposé pour les pouces inline (Sprint 6) — renderMessages est au scope
    // module, submitFeedback au scope init() : on passe par window.
    window.__knowdeskSubmitFeedback = submitFeedback;

    if (endBtn) {
      endBtn.addEventListener('click', function () {
        // Nécessite au moins 1 vrai échange (≥ 2 turns en historique : welcome + 1 réponse bot
        // c'est minimum pour activer)
        var hasInteracted = state.history.filter(function (t) { return t.role === 'visitor'; }).length > 0;
        if (!hasInteracted) {
          // Rien à évaluer → ferme simplement le widget
          closeP();
          return;
        }
        showFeedback();
      });
    }

    fbStep1.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-helpful]');
      if (!btn) return;
      var helpful = btn.getAttribute('data-helpful');
      fbStep1.hidden = true;
      if (helpful === 'yes') {
        fbStepCsat.hidden = false;
      } else if (helpful === 'no') {
        // Demande explicite d'un humain → on lance le formulaire handoff
        // (transmet le transcript via webhook ou email selon conf admin).
        submitFeedback({ helpful: helpful });
        triggerHandoffFlow(root);
      } else {
        // 'partial' → on affiche juste le fallback admin
        var escMsg = root.querySelector('.feedback__escalate-msg');
        var fallback = (state.config && state.config.fallbackMessage)
          || 'Un de nos conseillers vous répondra dans les meilleurs délais. Merci de patienter.';
        escMsg.textContent = fallback;
        fbStepEsc.hidden = false;
        submitFeedback({ helpful: helpful });
      }
    });

    // CSAT — survol et click
    fbStepCsat.addEventListener('mouseover', function (e) {
      var btn = e.target.closest('button[data-csat]');
      if (!btn) return;
      var n = parseInt(btn.getAttribute('data-csat'), 10);
      var stars = fbStepCsat.querySelectorAll('button[data-csat]');
      fbStepCsat.querySelector('.feedback__stars').classList.add('feedback__stars--hovering');
      stars.forEach(function (s, i) {
        if (i < n) s.classList.add('hover-up-to'); else s.classList.remove('hover-up-to');
      });
    });
    fbStepCsat.addEventListener('mouseleave', function () {
      fbStepCsat.querySelector('.feedback__stars').classList.remove('feedback__stars--hovering');
    });
    fbStepCsat.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-csat]');
      if (!btn) return;
      var csat = parseInt(btn.getAttribute('data-csat'), 10);
      submitFeedback({ helpful: 'yes', csat: csat });
      fbStepCsat.hidden = true;
      fbStepThanks.hidden = false;
      // Fin de la conversation : on RAZ pour la prochaine session
      setTimeout(function () {
        hideFeedback();
        state.conversationId = null;
        state.history = [];
        saveConversationId(null);
        renderMessages(root);
        if (state.config && state.config.welcomeMessage) {
          state.history.push({ role: 'assistant', content: state.config.welcomeMessage, welcome: true });
          renderMessages(root);
        }
        closeP();
      }, 1800);
    });

    fbStepEsc.querySelector('.feedback__close-btn').addEventListener('click', function () {
      hideFeedback();
      state.conversationId = null;
      state.history = [];
      saveConversationId(null);
      closeP();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = '';
      input.disabled = true;
      var btn = form.querySelector('button');
      if (btn) btn.disabled = true;
      sendMessage(root, v);
    });

    // Signal au parent (cas du test live dans Settings) que le widget est OK
    emitEvent('ready', { orgSlug: orgSlug });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
