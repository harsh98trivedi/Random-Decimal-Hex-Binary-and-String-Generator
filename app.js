// --- Cookie helpers ---
function setCookie(name, value, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const cookieArr = document.cookie.split(';');
  for (let c of cookieArr) {
    const [key, val] = c.trim().split('=');
    if (key === name) return decodeURIComponent(val);
  }
  return null;
}

// --- Utilities to save/load user settings ---
function loadUserSettings() {
  let length = parseInt(localStorage.getItem('rng_length'), 10);
  let max = parseInt(localStorage.getItem('rng_maxLength'), 10);

  if (isNaN(length) || length < 1) length = 5; // default
  if (isNaN(max) || max < length) max = 20;    // default

  return { length, max };
}

function saveUserSettings(length, max) {
  localStorage.setItem('rng_length', length);
  localStorage.setItem('rng_maxLength', max);
}

// --- Random Generators ---
function getRandomDecimal(digits) {
  if (digits <= 0) return '';
  let numberStr = '';
  numberStr += Math.floor(Math.random() * 9) + 1;
  for (let i = 1; i < digits; i++) numberStr += Math.floor(Math.random() * 10);
  return numberStr;
}

function getRandomHex(digits) {
  let result = '';
  for (let i = 0; i < digits; i++) result += Math.floor(Math.random() * 16).toString(16).toUpperCase();
  return result;
}

function getRandomBinary(digits) {
  let result = '';
  for (let i = 0; i < digits; i++) result += Math.floor(Math.random() * 2);
  return result;
}

function getRandomString(len) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  for (let i = 0; i < len; i++) res += charset.charAt(Math.floor(Math.random() * charset.length));
  return res;
}

// --- DOM Elements ---
const numberDisplay = document.getElementById('number-display');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const copyMsg = document.getElementById('copy-msg');
const digitSlider = document.getElementById('digit-slider');
const digitCount = document.getElementById('digit-count');
const maxSlider = document.getElementById('max-slider');
const modeBtns = document.querySelectorAll('.modeBtn');
const presets = document.getElementById('presets');
const lengthLabel = document.getElementById('length-label');
const autoCopyToggle = document.getElementById('auto-copy-toggle');

let currentMode = 'decimal';

// --- Animations ---
function animateNumber() {
  numberDisplay.style.color = "#111";
  gsap.to(numberDisplay, {
    color: '#2bb3d2',
    scale: 1.15,
    y: -15,
    duration: 0.15,
    ease: "power1.out",
    onComplete: () => {
      gsap.to(numberDisplay, {
        color: '#111',
        scale: 1,
        y: 0,
        duration: 0.15,
        ease: "power2.inOut"
      });
    }
  });
}


function animateRoll() {
  let rollOverlay = document.getElementById('roll-msg');
  if (!rollOverlay) {
    rollOverlay = document.createElement('div');
    rollOverlay.id = 'roll-msg';
    rollOverlay.className = 'roll-msg-overlay';
    rollOverlay.setAttribute('role', 'alert');
    rollOverlay.setAttribute('aria-live', 'assertive');
    rollOverlay.textContent = 'Rolled!';
    document.body.appendChild(rollOverlay);
  } else {
    rollOverlay.textContent = 'Rolled!';
  }
  rollOverlay.classList.add("show");

  // Dice icon spin animation
  const diceIcon = document.getElementById('dice-icon');
  gsap.fromTo(diceIcon,
    { rotation: 0 },
    { rotation: 360, duration: 0.15, ease: "power1.inOut" }
  );

  // Roll button pop animation
  gsap.fromTo(generateBtn,
    { scale: 1 },
    { scale: 1.25, duration: 0.075, yoyo: true, repeat: 1, ease: "power2.out" }
  );

  // Overlay fade in/out animation total ~0.15s
  gsap.timeline({
    onComplete: () => rollOverlay.classList.remove("show")
  })
    .to(rollOverlay, { opacity: 1, scale: 1.25, duration: 0.05, ease: "power1.out" })
    .to(rollOverlay, { opacity: 0, scale: 1, duration: 0.1, ease: "power1.in" });
}


function animateCopy() {
  copyMsg.classList.add("show");
  setTimeout(() => {
    copyMsg.classList.remove("show");
  }, 150);
  gsap.fromTo("#copy-icon", 
    { rotation: 0 }, 
    { rotation: 360, duration: 0.15, ease: "power1.inOut" }
  );
  gsap.fromTo(copyBtn, 
    { boxShadow: "0 0 0 #0000" }, 
    { boxShadow: "0 0 15px #2228", duration: 0.15, yoyo: true, repeat: 1 }
  );
}

function animateButton(btn) {
  gsap.fromTo(btn, { scale: 1 }, { scale: 0.95, duration: 0.15, yoyo: true, repeat: 1 });
}

// --- Preset buttons ---
function setPresets() {
  presets.innerHTML = `
    <button class="presetDigit btn-neutral" data-digits="5">5</button>
    <button class="presetDigit btn-neutral" data-digits="10">10</button>
    <button class="presetDigit btn-neutral" data-digits="15">15</button>
    <button class="presetDigit btn-neutral" data-digits="20">20</button>
    <button class="presetDigit btn-neutral" data-digits="25">25</button>
  `;
  const presetButtons = document.querySelectorAll(".presetDigit");
  presetButtons.forEach(button => {
    button.addEventListener("click", () => {
      let val = parseInt(button.getAttribute("data-digits"));
      const maxVal = parseInt(maxSlider.value, 10);
      if (val > maxVal) val = maxVal;
      digitSlider.value = val;
      digitCount.value = val;
      saveUserSettings(val, maxVal);
      generateValue();
      button.blur();
      animateButton(button);
    });
  });
}

// --- Generate value ---
function generateValue(animate = true) {
  let digits = parseInt(digitCount.value, 10);
  let max = parseInt(maxSlider.value, 10);

  if (isNaN(digits) || digits < 1) digits = 1;
  if (digits > max) digits = max;

  digitSlider.value = digits;
  digitCount.value = digits;
  digitSlider.max = max;
  digitCount.max = max;

  if (digits < 1 || digits > max) {
    numberDisplay.textContent = "-----";
    return;
  }

  let result = "";
  switch (currentMode) {
    case "decimal":
      result = getRandomDecimal(digits);
      break;
    case "hex":
      result = getRandomHex(digits);
      break;
    case "binary":
      result = getRandomBinary(digits);
      break;
    case "string":
      result = getRandomString(digits);
      break;
    default:
      result = "-----";
  }

  numberDisplay.textContent = result;

  if (animate) animateNumber();
}

// --- Event Listeners ---

modeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    modeBtns.forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    currentMode = btn.getAttribute("data-mode");

    // Save mode for persistence
    setCookie("lastSelectedMode", currentMode, 365);

    generateValue();
    btn.blur();
    animateButton(btn);
  });
});

autoCopyToggle.addEventListener("change", () => {
  setCookie("autoCopyEnabled", autoCopyToggle.checked, 365);
  // Save immediately as preference
});

digitSlider.addEventListener("input", () => {
  const maxVal = parseInt(maxSlider.value, 10);
  let val = parseInt(digitSlider.value);
  if (val > maxVal) val = maxVal;
  digitSlider.value = val;
  digitCount.value = val;
  saveUserSettings(val, maxVal);
  generateValue();
});

digitCount.addEventListener("input", () => {
  const maxVal = parseInt(maxSlider.value, 10);
  let val = parseInt(digitCount.value);
  if (isNaN(val) || val < 1) val = 1;
  if (val > maxVal) val = maxVal;
  digitCount.value = val;
  digitSlider.value = val;
  saveUserSettings(val, maxVal);
  generateValue();
});

maxSlider.addEventListener("input", () => {
  let maxVal = parseInt(maxSlider.value);
  if (isNaN(maxVal) || maxVal < 1) maxVal = 20;
  if (digitSlider.value > maxVal) {
    digitSlider.value = maxVal;
    digitCount.value = maxVal;
  }
  maxSlider.value = maxVal;
  digitSlider.max = maxVal;
  digitCount.max = maxVal;
  saveUserSettings(parseInt(digitSlider.value), maxVal);
  generateValue();
});

generateBtn.addEventListener("click", () => {
  generateValue(true);
  animateRoll();
});

copyBtn.addEventListener("click", () => {
  let val = numberDisplay.textContent;
  if (val && val !== "-----" && val !== "All numbers used!") {
    navigator.clipboard.writeText(val);
    animateCopy();
    copyBtn.blur();
  }
});

// --- Initialization ---

window.onload = () => {
  const autoCopyValue = getCookie("autoCopyEnabled");
  autoCopyToggle.checked = autoCopyValue === "true";

  let lastMode = getCookie("lastSelectedMode");
  if (lastMode && ["decimal", "hex", "binary", "string"].includes(lastMode)) {
    currentMode = lastMode;
  } else {
    currentMode = "decimal";
  }

  modeBtns.forEach(btn => {
    if (btn.getAttribute("data-mode") === currentMode) {
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
    } else {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    }
  });

  const settings = loadUserSettings();

  // Set max slider fixed properties
  maxSlider.min = 1;
  maxSlider.max = 1000;
  maxSlider.value = settings.max;

  // Apply max to digit slider and input
  digitSlider.min = 1;
  digitSlider.max = settings.max;
  digitSlider.value = settings.length;

  digitCount.min = 1;
  digitCount.max = settings.max;
  digitCount.value = settings.length;

  setPresets();
  generateValue(false);

  if (autoCopyToggle.checked && numberDisplay.textContent !== "-----") {
    generateValue(true);
    navigator.clipboard.writeText(numberDisplay.textContent);
    animateCopy();
  }
};
