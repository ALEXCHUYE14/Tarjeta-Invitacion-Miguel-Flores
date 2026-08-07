/* =========================================================
   Miguel_Flores_v31.0 — System Architecture Invitation
   script.js — Vanilla JS ES6+, zero dependencies
   ========================================================= */
"use strict";

/* ---------------- CONFIG ---------------- */
const CONFIG = {
  // Fecha objetivo: 14 Agosto 2026, 21:30 hrs (hora local del navegador)
  eventDate: new Date(2026, 7, 14, 21, 30, 0), // mes 7 = Agosto (0-indexed)
  audioVolume: 0.8,
  // 1) Pega aquí la URL /exec de tu Web App de Google Apps Script tras desplegar Code.gs
  scriptURL: "https://script.google.com/macros/s/AKfycbxeV0Hmg8Kqkz2OEDa_DkRT74Eh8fMMnA9EW_xoiUOGHgTiach1qVBn_ZlXWuSv5C_sDQ/exec",
  // 2) Ubicación del evento (para el botón y el mapa embebido de Google Maps)
  venueName: "Av. Emilio Hermoza Mz. O Lote 1, Nuevo Catacaos",
  venueRef: "Referencia: Mi Niño",
  mapsQuery: "Av. Emilio Hermoza Mz. O Lote 1, Nuevo Catacaos, Piura, Perú"
};

/* ---------------- DOM ---------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const splash      = $("#splash");
const dashboard   = $("#dashboard");
const bootTerminal= $("#boot-terminal");
const bootActions = $(".boot-actions");
const initBtn     = $("#init-btn");
const audio       = $("#event-audio");
const typingAudio = $("#typing-audio");

/* =========================================================
   0) TYPING AMBIENCE (Public/audio/programando.mp3)
   Suena en loop mientras se "escribe" el boot sequence, simulando
   que Miguel está programando en vivo.
   ========================================================= */
typingAudio.volume = 0.55;

function playTypingAudio() {
  const p = typingAudio.play();
  if (p && typeof p.catch === "function") p.catch(() => {}); // ignora bloqueo silencioso del navegador
}

function stopTypingAudio() {
  typingAudio.pause();
  typingAudio.currentTime = 0;
}

// Los navegadores bloquean el audio hasta que hay un gesto real del usuario
// (click / tecla / toque). Muestra un prompt tipo "press any key" y espera
// ese gesto antes de arrancar el boot sequence, así el audio de "programando"
// suena desde la primera línea (no solo tras pulsar INITIALIZE_PARTY()).
function waitForFirstGesture() {
  return new Promise((resolve) => {
    const line = document.createElement("div");
    line.className = "boot-line";
    line.innerHTML = '<span class="warn">[SYSTEM]</span>: Toca la pantalla o presiona una tecla para iniciar el arranque...<span class="cursor"></span>';
    bootTerminal.appendChild(line);

    const start = () => {
      window.removeEventListener("keydown", start);
      window.removeEventListener("pointerdown", start);
      playTypingAudio();
      line.remove();
      resolve();
    };
    window.addEventListener("keydown", start, { once: true });
    window.addEventListener("pointerdown", start, { once: true });
  });
}

/* =========================================================
   1) TERMINAL BOOT SEQUENCE (typewriter)
   ========================================================= */
const BOOT_LINES = [
  { t: '<span class="key">[INIT_SYS]</span>: Loading Miguel_Flores_v31.0_Event...', d: 22 },
  { t: '<span class="key">[AUTH]</span>: Biometric access card ..... <span class="ok">GRANTED</span>', d: 18 },
  { t: '<span class="key">[MODULE]</span>: mounting /countdown_engine ..... <span class="ok">OK</span>', d: 16 },
  { t: '<span class="key">[MODULE]</span>: mounting /audio_engine [Pitbull] ..... <span class="ok">OK</span>', d: 16 },
  { t: '<span class="key">[MODULE]</span>: mounting /rsvp_module ..... <span class="ok">OK</span>', d: 16 },
  { t: '<span class="key">[BUILD]</span>: compiling Birthday.release(31) ..... <span class="ok">DONE</span>', d: 16 },
  { t: '<span class="warn">[READY]</span>: awaiting user gesture to execute...', d: 20 }
];

function typeLine(html, speed) {
  return new Promise((resolve) => {
    const line = document.createElement("div");
    line.className = "boot-line";
    bootTerminal.appendChild(line);

    // Escribe respetando etiquetas HTML (no rompe los <span>)
    let i = 0;
    const tokens = tokenize(html);
    const cursor = '<span class="cursor"></span>';

    function step() {
      if (i <= tokens.length) {
        line.innerHTML = tokens.slice(0, i).join("") + cursor;
        i++;
        setTimeout(step, speed);
      } else {
        line.innerHTML = html; // limpia cursor al terminar
        resolve();
      }
    }
    step();
  });
}

// Divide una cadena HTML en "tokens" visibles: cada etiqueta completa cuenta como 1 salto,
// cada carácter de texto cuenta como 1. Evita cortar etiquetas a la mitad.
function tokenize(html) {
  const out = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === "<") {
      const end = html.indexOf(">", i);
      out.push(html.slice(i, end + 1));
      i = end + 1;
    } else {
      out.push(html[i]);
      i++;
    }
  }
  return out;
}

async function runBootSequence() {
  await waitForFirstGesture(); // desbloquea audio y garantiza el sonido de teclado desde la línea 1
  for (const l of BOOT_LINES) {
    await typeLine(l.t, l.d);
    await wait(120);
  }
  bootActions.classList.add("is-ready");
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* =========================================================
   2) CTA — ripple + transición + audio bajo gesto de usuario
   ========================================================= */
initBtn.addEventListener("click", (e) => {
  spawnRipple(e, initBtn);
  stopTypingAudio(); // corta el ambiente de "programando" al pasar a la fiesta

  // AUDIO ENGINE TRIGGER — se ejecuta dentro del gesto (evita autoplay-blocked)
  audio.volume = CONFIG.audioVolume;
  const p = audio.play();
  if (p && typeof p.catch === "function") {
    p.catch(() => {
      // Si el navegador bloquea, el widget arrancará en pausa; el usuario puede togglear
      setPlayingUI(false);
    });
  }

  // Transición State 1 -> State 2
  splash.classList.add("is-hidden");
  setTimeout(() => {
    splash.hidden = true;
    dashboard.hidden = false;
    setPlayingUI(!audio.paused);
    startCountdown();
    startUptime();
  }, 550);
});

/* =========================================================
   2.1) UPTIME BADGE — reloj tipo "system uptime" desde que
   arranca el dashboard (puramente decorativo, no afecta al resto)
   ========================================================= */
const uptimeEl = $("#uptime");
let uptimeTimer = null;

function startUptime() {
  if (!uptimeEl || uptimeTimer) return; // evita timers duplicados si se llama más de una vez
  const start = Date.now();
  uptimeTimer = setInterval(() => {
    const secs = Math.floor((Date.now() - start) / 1000);
    const hh = pad(Math.floor(secs / 3600));
    const mm = pad(Math.floor((secs % 3600) / 60));
    const ss = pad(secs % 60);
    uptimeEl.textContent = `uptime: ${hh}:${mm}:${ss}`;
  }, 1000);
}

function spawnRipple(e, btn) {
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement("span");
  span.className = "ripple";
  span.style.width = span.style.height = size + "px";
  span.style.left = (e.clientX - rect.left - size / 2) + "px";
  span.style.top  = (e.clientY - rect.top  - size / 2) + "px";
  btn.appendChild(span);
  setTimeout(() => span.remove(), 620);
}

/* =========================================================
   3) STICKY AUDIO WIDGET
   ========================================================= */
const audioToggle = $("#audio-toggle");
const audioMute   = $("#audio-mute");
const equalizer   = $("#equalizer");
const icoPlay  = $(".ico-play", audioToggle);
const icoPause = $(".ico-pause", audioToggle);
const icoVol   = $(".ico-vol", audioMute);
const icoMuted = $(".ico-muted", audioMute);

function setPlayingUI(playing) {
  icoPause.hidden = !playing;
  icoPlay.hidden  = playing;
  equalizer.classList.toggle("is-paused", !playing);
}

audioToggle.addEventListener("click", () => {
  if (audio.paused) {
    audio.play().then(() => setPlayingUI(true)).catch(() => setPlayingUI(false));
  } else {
    audio.pause();
    setPlayingUI(false);
  }
});

audioMute.addEventListener("click", () => {
  audio.muted = !audio.muted;
  icoVol.hidden = audio.muted;
  icoMuted.hidden = !audio.muted;
});

audio.addEventListener("play",  () => setPlayingUI(true));
audio.addEventListener("pause", () => setPlayingUI(false));

/* =========================================================
   4) COUNTDOWN ENGINE (con animación flip)
   ========================================================= */
const cd = {
  days:  $("#cd-days"),
  hours: $("#cd-hours"),
  mins:  $("#cd-mins"),
  secs:  $("#cd-secs")
};
const cdStatus = $("#countdown-status");
const cdGrid   = $("#countdown-grid");
let countdownTimer = null;

function pad(n) { return String(n).padStart(2, "0"); }

function setUnit(el, value) {
  const v = pad(value);
  if (el.dataset.prev !== v) {
    el.dataset.prev = v;
    el.textContent = v;
    el.classList.remove("flip");
    void el.offsetWidth; // reflow para reiniciar la animación
    el.classList.add("flip");
  }
}

function tickCountdown() {
  const now = new Date();
  const diff = CONFIG.eventDate - now;

  if (diff <= 0) {
    // Evento en curso
    clearInterval(countdownTimer);
    cdGrid.hidden = true;
    cdStatus.hidden = false;
    return;
  }

  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  const secs  = Math.floor((diff % 60000) / 1000);

  setUnit(cd.days, days);
  setUnit(cd.hours, hours);
  setUnit(cd.mins, mins);
  setUnit(cd.secs, secs);
}

function startCountdown() {
  tickCountdown();
  countdownTimer = setInterval(tickCountdown, 1000);
}

/* =========================================================
   5) LOGÍSTICA — Google Maps (botón + mapa embebido, misma fuente)
   ========================================================= */
(function initVenue() {
  const venueEl = $("#venue-name");
  const venueRefEl = $("#venue-ref");
  const mapsBtn = $("#maps-btn");
  const mapFrame = $("#venue-map");

  if (venueEl) venueEl.textContent = CONFIG.venueName;
  if (venueRefEl) venueRefEl.textContent = CONFIG.venueRef || "";

  const q = encodeURIComponent(CONFIG.mapsQuery || CONFIG.venueName || "");
  if (mapsBtn) mapsBtn.href = "https://www.google.com/maps/search/?api=1&query=" + q;
  // Embed de Google Maps sin necesidad de API key
  if (mapFrame && q) mapFrame.src = "https://www.google.com/maps?q=" + q + "&output=embed";
})();

/* =========================================================
   6) RSVP MODULE — validación + submit asíncrono
   ========================================================= */
const form        = $("#rsvp-form");
const submitBtn   = $("#rsvp-submit");
const guestsInput = $("#fld-guests");
const aporteInputs= $$('input[name="aporte"]');
const modal       = $("#modal");
const modalBody   = $("#modal-body");
const modalPanel  = $(".modal__panel");
const modalClose  = $("#modal-primary");
const modalRetry  = $("#modal-retry");

// Deshabilita acompañantes y "qué llevarás" si "No podré ir"
$$('input[name="asistencia"]').forEach((r) => {
  r.addEventListener("change", () => {
    const going = form.asistencia.value === "Sí asistiré";
    guestsInput.disabled = !going;
    if (!going) guestsInput.value = 0;

    aporteInputs.forEach((a) => {
      a.disabled = !going;
      if (!going) a.checked = false;
    });
  });
});

function setFieldError(name, msg) {
  const errEl = $(`.field__err[data-err="${name}"]`);
  const wrap = errEl ? errEl.closest(".field") : null;
  if (errEl) errEl.textContent = msg || "";
  if (wrap) wrap.classList.toggle("invalid", !!msg);
}

function validate() {
  let ok = true;
  const name = form.nombre.value.trim();
  if (name.length < 2) { setFieldError("name", "// ERROR: nombre requerido (mín. 2 caracteres)"); ok = false; }
  else setFieldError("name", "");

  if (!form.asistencia.value) { setFieldError("asistencia", "// ERROR: selecciona una opción"); ok = false; }
  else setFieldError("asistencia", "");

  return ok;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  setLoading(true);

  const payload = {
    nombre: form.nombre.value.trim(),
    asistencia: form.asistencia.value,
    acompanantes: guestsInput.disabled ? 0 : (parseInt(guestsInput.value, 10) || 0),
    aporte: guestsInput.disabled ? "" : form.aporte.value,
    mensaje: form.mensaje.value.trim()
  };

  try {
    await sendRSVP(payload);
    setLoading(false);
    showModal("success", payload);
    form.reset();
    guestsInput.disabled = false;
    aporteInputs.forEach((a) => { a.disabled = false; });
  } catch (err) {
    setLoading(false);
    showModal("error", null, err);
  }
});

function setLoading(state) {
  submitBtn.disabled = state;
  submitBtn.classList.toggle("is-loading", state);
  $(".rsvp-submit__label", submitBtn).textContent = state ? "> PROCESSING..." : "> SUBMIT_RSVP()";
}

// Envío CORS-safe. Con mode:'no-cors' la respuesta es opaca (no legible),
// por eso construimos el flujo asumiendo éxito salvo error de red.
async function sendRSVP(payload) {
  if (!CONFIG.scriptURL || CONFIG.scriptURL.startsWith("REEMPLAZA")) {
    // Modo demo: simula latencia si aún no configuras Apps Script
    await wait(1200);
    return { simulated: true };
  }

  const body = new URLSearchParams();
  Object.keys(payload).forEach((k) => body.append(k, payload[k]));

  await fetch(CONFIG.scriptURL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: body.toString()
  });
  return { sent: true };
}

/* =========================================================
   6.1) CONFETTI — celebración con símbolos de código al confirmar
   ========================================================= */
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fireConfetti() {
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; } // navegador sin soporte de canvas: no rompe nada

  const dpr = window.devicePixelRatio || 1;
  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const GLYPHS = ["{ }", "< / >", ";", "01", "( )", "=>", "//"];
  const COLORS = ["#06b6d4", "#10b981", "#f8fafc", "#ffbd2e"];
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * window.innerWidth,
    y: -30 - Math.random() * window.innerHeight * 0.5,
    vx: (Math.random() - 0.5) * 2,
    vy: 2 + Math.random() * 2.5,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.15,
    size: 12 + Math.random() * 10,
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  }));

  const DURATION = 4200;
  const start = performance.now();
  let raf = null;

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.font = `700 ${p.size}px "JetBrains Mono", monospace`;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION);
      ctx.fillText(p.glyph, 0, 0);
      ctx.restore();
    });

    if (elapsed < DURATION) {
      raf = requestAnimationFrame(frame);
    } else {
      window.removeEventListener("resize", resize);
      canvas.remove();
    }
  }
  raf = requestAnimationFrame(frame);
}

/* =========================================================
   7) MODAL (success / error)
   ========================================================= */
function showModal(type, payload, err) {
  modalPanel.classList.toggle("is-error", type === "error");
  modalRetry.hidden = type !== "error";

  if (type === "success") {
    const ac = payload ? payload.acompanantes : 0;
    const aporte = payload && payload.aporte ? escapeHtml(payload.aporte) : "—";
    modalBody.innerHTML = `
      <p><span class="status-ok">RSVP_ACCEPTED_200_OK</span></p>
      <p><span class="key">&gt;</span> host: Miguel_Flores_v31.0</p>
      <p><span class="key">&gt;</span> guest: ${escapeHtml(payload.nombre)}</p>
      <p><span class="key">&gt;</span> status: ${escapeHtml(payload.asistencia)}</p>
      <p><span class="key">&gt;</span> party_size: +${ac}</p>
      <p><span class="key">&gt;</span> aporte: ${aporte}</p>
      <p style="margin-top:.8rem;color:#94a3b8;">// Tu respuesta fue registrada en el sistema. ¡Nos vemos el 14/AGO! 🎉</p>
    `;
    if (!prefersReducedMotion()) fireConfetti();
  } else {
    modalBody.innerHTML = `
      <p><span class="status-err">ERROR_500_CONNECTION_FAILED</span></p>
      <p><span class="key">&gt;</span> No pudimos alcanzar el servidor del evento.</p>
      <p style="color:#94a3b8;">// ${escapeHtml(err && err.message ? err.message : "network error")}</p>
      <p style="margin-top:.6rem;color:#94a3b8;">// Verifica tu conexión e intenta de nuevo.</p>
    `;
  }
  modal.hidden = false;
}

function closeModal() { modal.hidden = true; }
modalClose.addEventListener("click", closeModal);
$(".modal__backdrop").addEventListener("click", closeModal);
modalRetry.addEventListener("click", () => {
  closeModal();
  form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* =========================================================
   BOOT
   ========================================================= */
document.addEventListener("DOMContentLoaded", runBootSequence);
