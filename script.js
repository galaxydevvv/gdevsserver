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

setupAudio();
wireEvents();
fetchStatus();
window.setInterval(fetchStatus, 300000);
