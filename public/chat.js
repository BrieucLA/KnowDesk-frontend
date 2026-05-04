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
    /**
     * Flag posé après un clic 👎 inline (Sprint 10) : on a poussé une bulle
     * d'empathie qui demande l'email du visiteur. Le prochain message est
     * intercepté par sendMessage : si c'est un email valide → POST /handoff
     * avec l'email ; sinon le flag retombe et le message reprend le RAG normal.
     * Reste éphémère (pas persisté localStorage) — un reload du widget annule
     * la demande, ce qui est le comportement attendu pour ne pas piéger
     * l'utilisateur dans une boucle.
     */
    awaitingHandoffEmail: false,
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
      + '.header__close, .header__reset, .header__human { background: transparent; border: none; color: white; cursor: pointer; padding: 4px 8px; font-size: 18px; line-height: 1; opacity: 0.85; }'
      + '.header__close:hover, .header__reset:hover, .header__human:hover { opacity: 1; }'
      + '.header__reset, .header__human { font-size: 16px; }'
      // Phase D — panel feedback supprimé (CSAT/escalate/handoff-form)
      // au profit du flux conversationnel pur. Tout est dans le canal.
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
      // Phase D — barre emoji dans la zone de saisie. 5 emojis preset
      // visibles à gauche du textarea, un click ajoute l'emoji au message
      // courant. État "is-active" si le visiteur a sélectionné un emoji.
      + '.emoji-bar { display: flex; gap: 2px; padding: 4px 8px 0; background: white; }'
      + '.emoji-bar button { background: transparent; border: 1px solid transparent; cursor: pointer; padding: 3px 6px; font-size: 16px; line-height: 1; border-radius: 6px; transition: all 0.12s; font-family: inherit; }'
      + '.emoji-bar button:hover { background: #f6f7fb; }'
      + '.emoji-bar button.is-active { background: #eef0ff; border-color: var(--kd-primary, #5B6CFF); }'
      + '</style>'
      + '<button class="bubble" type="button" aria-label="Ouvrir le chat">💬</button>'
      + '<div class="panel" role="dialog" aria-label="Chat">'
      + '  <div class="header">'
      + '    <div class="header__logo-wrap"></div>'
      + '    <div class="header__title">Discutons</div>'
      + '    <button class="header__human" type="button" aria-label="Parler à un humain"  title="Parler à un humain">🙋</button>'
      + '    <button class="header__reset" type="button" aria-label="Nouvelle conversation" title="Nouvelle conversation">↺</button>'
      + '    <button class="header__close" type="button" aria-label="Fermer">×</button>'
      + '  </div>'
      + '  <div class="messages" role="log" aria-live="polite"></div>'
      + '  <div class="emoji-bar">'
      + '    <button type="button" data-emoji="😊" title="Très satisfait">😊</button>'
      + '    <button type="button" data-emoji="🙂" title="Satisfait">🙂</button>'
      + '    <button type="button" data-emoji="😐" title="Neutre">😐</button>'
      + '    <button type="button" data-emoji="☹️" title="Insatisfait">☹️</button>'
      + '    <button type="button" data-emoji="😡" title="Très insatisfait">😡</button>'
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

            // Phase D — chips de la bulle propose_handoff : "Oui parler à un
            // conseiller" déclenche le flow handoff dans le canal ;
            // "Non, je continue" insère juste un acquittement bot et la conv
            // reprend normalement.
            if (turn.handoffPropose) {
              if (/^oui/i.test(label) && typeof window.__knowdeskTriggerHandoff === 'function') {
                window.__knowdeskTriggerHandoff();
              } else {
                state.history.push({
                  role:           'assistant',
                  content:        'Très bien, je continue à vous aider. Posez-moi votre question.',
                  handoffConfirm: true,
                });
                renderMessages(root);
              }
              return;
            }

            // "Parler à un humain" → ouvre le flow de handoff (legacy quick reply)
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

      // Phase D — pouces inline supprimés. La satisfaction se mesure
      // désormais via l'emoji posé par le visiteur (barre emoji du textarea)
      // + LLM judge à la clôture. Les bulles handoffPrompt / handoffConfirm
      // (Sprint 10 et propose_handoff Phase D) restent affichées sans pouces.
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

  // Regex email simple pour le pré-flight handoff (Sprint 10).
  // Volontairement permissive (pas de RFC 5322) — on rejette juste les
  // chaînes qui ne ressemblent visiblement pas à un email.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // ── Logique d'envoi message ──────────────────────────────────────
  async function sendMessage(root, text) {
    if (!text.trim() || state.pending) return;
    var trimmed = text.trim();

    // Sprint 10 — pré-flight email handoff : si on attend un email suite à
    // un clic 👎 inline, on intercepte le prochain message du visiteur.
    //  - email valide → POST /handoff(visitorEmail) + bulle confirmation
    //  - autre chose → on lève le flag et on enchaîne le flow normal
    //    (RAG sur le message, qui peut être une nouvelle question ou
    //    un « non merci » que le bot va comprendre comme smalltalk).
    if (state.awaitingHandoffEmail) {
      if (EMAIL_RE.test(trimmed)) {
        state.awaitingHandoffEmail = false;
        state.history.push({ role: 'visitor', content: trimmed });
        renderMessages(root);
        var resp = null;
        if (typeof window.__knowdeskSubmitHandoff === 'function') {
          resp = await window.__knowdeskSubmitHandoff(trimmed);
        }
        var delivered = resp && resp.delivered;
        var confirmText = delivered === 'webhook' || delivered === 'email'
          ? 'Merci. Votre demande a été transmise à notre équipe — nous reviendrons '
            + 'vers vous à cette adresse dans les meilleurs délais. '
            + 'En attendant, n\'hésitez pas à continuer la conversation.'
          : 'Merci. Votre adresse a été notée. N\'hésitez pas à continuer '
            + 'à me poser vos questions en attendant.';
        state.history.push({
          role:           'assistant',
          content:        confirmText,
          handoffConfirm: true,
        });
        renderMessages(root);
        return;
      }
      // Pas un email → on annule l'attente, le message est traité comme une
      // question normale (le bot répondra via RAG, smalltalk, etc.).
      state.awaitingHandoffEmail = false;
    }

    state.pending = true;
    state.history.push({ role: 'visitor', content: trimmed });
    renderMessages(root);

    var streamedText = '';
    var streamedQuickReplies = null;
    var streamedProposeHandoff = null;     // Phase D
    setStreamingMessage(root, '');

    try {
      // Phase D — extrait les emojis du message (regex unicode large) pour
      // les envoyer en payload séparé. Le backend les pose sur le tour
      // visiteur et déclenche éventuellement la détection negative_streak.
      var EMOJI_RE = /\p{Extended_Pictographic}/gu;
      var emojis = (text.match(EMOJI_RE) || []).slice(0, 5);

      var resp = await fetch(API_BASE + '/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug:            orgSlug,
          conversationId:     state.conversationId || undefined,
          visitorFingerprint: visitorFingerprint(),
          message:            text.trim(),
          emojis:             emojis.length > 0 ? emojis : undefined,
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
          } else if (name === 'propose_handoff') {
            // Phase D — backend a détecté un streak négatif (≥ 2 messages
            // visiteur consécutifs avec emoji négatif ou regex frustration).
            // On insère une bulle empathie + chips dédiées DANS le canal,
            // qui sera affichée APRÈS le tour assistant principal.
            streamedProposeHandoff = {
              message: data.message || 'Voulez-vous parler à un conseiller ?',
              replies: Array.isArray(data.replies) ? data.replies : ['Oui, parler à un conseiller', 'Non, je continue'],
            };
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

      // Phase D — propose_handoff : ajoute une 2e bulle bot empathie + chips
      // dédiées (« Oui parler à un conseiller » / « Non je continue »). Le
      // click sur "Oui" déclenche le flow handoff. "Non" insère juste un
      // accusé-réception.
      if (streamedProposeHandoff) {
        state.history.push({
          role:           'assistant',
          content:        streamedProposeHandoff.message,
          quickReplies:   streamedProposeHandoff.replies,
          handoffPropose: true,
        });
      }

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
      // Phase D — désélectionne la barre emoji après envoi (signal one-shot
      // par message ; le visiteur peut re-sélectionner pour le tour suivant).
      var bar = root.querySelector('.emoji-bar');
      if (bar) bar.querySelectorAll('button.is-active').forEach(function (b) { b.classList.remove('is-active'); });
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
    state.awaitingHandoffEmail = false;
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

    // ── Phase D — emoji bar + handoff dans le canal ────────────────
    // Le panel feedback plein écran est supprimé. Le flux est entièrement
    // dans le canal : émojis pour exprimer l'émotion, bulle propose_handoff
    // (event SSE backend) si streak négatif détecté, pré-flight email
    // (Sprint 10) toujours actif.

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
    // Exposé pour le pré-flight email (Sprint 10) toujours utilisé
    window.__knowdeskSubmitHandoff = submitHandoff;

    /**
     * Déclenche le flow handoff dans le canal :
     * - pousse une bulle bot empathie qui demande l'email
     * - lève state.awaitingHandoffEmail pour intercepter le prochain message
     * Pas de pop-up, tout reste dans la conversation.
     */
    function triggerHandoffFlow() {
      if (state.awaitingHandoffEmail) return;
      state.history.push({
        role:    'assistant',
        content: 'Très bien, je vous mets en relation avec un conseiller. '
               + 'Indiquez-moi votre adresse email pour qu\'il puisse vous '
               + 'recontacter, ou envoyez « non merci » si vous préférez ne pas en donner.',
        handoffPrompt: true,
      });
      state.awaitingHandoffEmail = true;
      renderMessages(root);
      var inp = root.querySelector('.input-row input');
      if (inp) inp.focus();
    }
    window.__knowdeskTriggerHandoff = triggerHandoffFlow;

    // Bouton 🙋 du header (raccourci humain explicite)
    if (humanBtn) {
      humanBtn.addEventListener('click', function () {
        var hasInteracted = state.history.filter(function (t) { return t.role === 'visitor'; }).length > 0;
        if (!hasInteracted) {
          humanBtn.style.opacity = '0.4';
          setTimeout(function () { humanBtn.style.opacity = ''; }, 400);
          return;
        }
        triggerHandoffFlow();
      });
    }

    // Barre emoji — click sur un emoji preset → on l'ajoute au message
    // courant (concaténé en fin), un seul emoji actif à la fois côté UI.
    var emojiBar = root.querySelector('.emoji-bar');
    if (emojiBar) {
      emojiBar.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-emoji]');
        if (!btn) return;
        var emoji = btn.getAttribute('data-emoji');
        // Toggle visuel : si déjà actif, on déselectionne ; sinon on active
        var alreadyActive = btn.classList.contains('is-active');
        emojiBar.querySelectorAll('button.is-active').forEach(function (b) { b.classList.remove('is-active'); });
        if (alreadyActive) {
          // Retire l'emoji du message si présent
          input.value = input.value.replace(emoji, '').trim();
        } else {
          btn.classList.add('is-active');
          // Append à la fin du message courant
          if (!input.value.endsWith(emoji)) {
            input.value = (input.value.trim() + ' ' + emoji).trim();
          }
        }
        input.focus();
      });
    }

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
