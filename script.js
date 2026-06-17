const SERVER_IP = "gdevsserver.minehut.gg";
const STATUS_URL = `https://api.mcsrvstat.us/3/${SERVER_IP}`;

const toast = document.querySelector("[data-toast]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const audioToggle = document.querySelector("[data-audio-toggle]");

let clickSound;
let ambienceSound;
let soundEnabled = localStorage.getItem("gdevsSound") === "on";

function setupAudio() {
  clickSound = new Audio("assets/click.wav");
  clickSound.volume = 0.34;

  ambienceSound = new Audio("assets/ambience.wav");
  ambienceSound.loop = true;
  ambienceSound.volume = 0.22;

  updateAudioButton();
}

function updateAudioButton() {
  if (!audioToggle) return;
  audioToggle.textContent = soundEnabled ? "Sound On" : "Sound Off";
  audioToggle.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
}

function playClick() {
  if (!soundEnabled || !clickSound) return;
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

function startAmbience() {
  if (!soundEnabled || !ambienceSound) return;
  ambienceSound.play().catch(() => {});
}

function stopAmbience() {
  if (!ambienceSound) return;
  ambienceSound.pause();
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

async function copyIP() {
  try {
    await navigator.clipboard.writeText(SERVER_IP);
    showToast(`Copied ${SERVER_IP}`);
  } catch (error) {
    const input = document.createElement("input");
    input.value = SERVER_IP;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    showToast(`Copied ${SERVER_IP}`);
  }
}

function applyStatus({ title, detail, state }) {
  document.querySelectorAll("[data-status-card]").forEach((card) => {
    const titleEl = card.querySelector("[data-status-title]");
    const detailEl = card.querySelector("[data-status-detail]");
    const dotEl = card.querySelector("[data-status-dot]");
    if (titleEl) titleEl.textContent = title;
    if (detailEl) detailEl.textContent = detail;
    if (dotEl) {
      dotEl.classList.remove("online", "offline");
      if (state) dotEl.classList.add(state);
    }
  });
}

async function fetchStatus() {
  if (!document.querySelector("[data-status-card]")) return;
  try {
    const response = await fetch(STATUS_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Status request failed");
    const data = await response.json();

    if (!data.online) {
      applyStatus({
        title: "Server offline or sleeping",
        detail: `Try joining with ${SERVER_IP}`,
        state: "offline"
      });
      return;
    }

    const players = data.players ? `${data.players.online ?? 0}/${data.players.max ?? "?"}` : "players unknown";
    const version = data.version || "version unknown";
    const motd = Array.isArray(data.motd?.clean) ? data.motd.clean.filter(Boolean).join(" ") : "Online now";

    applyStatus({
      title: `Online • ${players} players`,
      detail: `${version} • ${motd}`,
      state: "online"
    });
  } catch (error) {
    applyStatus({
      title: "Status unavailable",
      detail: `Join with ${SERVER_IP}`,
      state: "offline"
    });
  }
}

function wireEvents() {
  document.querySelectorAll("[data-sound]").forEach((el) => {
    el.addEventListener("click", playClick);
  });

  document.querySelectorAll("[data-copy-ip]").forEach((button) => {
    button.addEventListener("click", copyIP);
  });

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("open");
    });
  }

  if (audioToggle) {
    audioToggle.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem("gdevsSound", soundEnabled ? "on" : "off");
      updateAudioButton();
      if (soundEnabled) startAmbience();
      else stopAmbience();
    });
  }

  document.addEventListener("pointerdown", () => {
    if (soundEnabled) startAmbience();
  }, { once: true });
}


function setupInteractiveBackground() {
  const canvas = document.createElement("canvas");
  canvas.className = "interactive-bg";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!ctx || reduceMotion) return;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let pointerX = 0.5;
  let pointerY = 0.5;
  const particles = [];
  const colors = ["139,92,255", "73,209,125", "101,199,255", "246,189,75", "255,106,42"];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.length = 0;
    const count = Math.min(95, Math.max(38, Math.floor((width * height) / 21000)));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        base: 1.2 + Math.random() * 2.6,
        vx: (Math.random() - 0.5) * 0.23,
        vy: -0.08 - Math.random() * 0.24,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
        link: Math.random() > 0.35
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    const t = time * 0.001;
    const px = (pointerX - 0.5) * 28;
    const py = (pointerY - 0.5) * 28;

    const gradient = ctx.createRadialGradient(width * pointerX, height * pointerY, 0, width * pointerX, height * pointerY, Math.max(width, height) * 0.54);
    gradient.addColorStop(0, "rgba(139, 92, 255, 0.16)");
    gradient.addColorStop(0.45, "rgba(73, 209, 125, 0.05)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx + Math.sin(t + p.phase) * 0.08;
      p.y += p.vy + Math.cos(t * 0.7 + p.phase) * 0.04;
      if (p.y < -20) { p.y = height + 20; p.x = Math.random() * width; }
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
    }

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      if (!a.link) continue;
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 135) {
          ctx.strokeStyle = `rgba(139, 92, 255, ${0.13 * (1 - dist / 135)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x + px, a.y + py);
          ctx.lineTo(b.x + px, b.y + py);
          ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2 + p.phase);
      const r = p.base + pulse * 1.4;
      ctx.fillStyle = `rgba(${p.color}, ${0.25 + pulse * 0.32})`;
      ctx.shadowColor = `rgba(${p.color}, .9)`;
      ctx.shadowBlur = 14 + pulse * 12;
      ctx.beginPath();
      ctx.arc(p.x + px, p.y + py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX / Math.max(1, width);
    pointerY = event.clientY / Math.max(1, height);
    document.documentElement.style.setProperty("--mx", `${Math.round(pointerX * 100)}%`);
    document.documentElement.style.setProperty("--my", `${Math.round(pointerY * 100)}%`);
  });

  resize();
  requestAnimationFrame(draw);
}

setupInteractiveBackground();
setupAudio();
wireEvents();
fetchStatus();
window.setInterval(fetchStatus, 300000);
