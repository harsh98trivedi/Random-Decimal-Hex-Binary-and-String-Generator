// Cookie helpers
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

// Persisted settings using localStorage
function loadUserSettings() {
  let length = parseInt(localStorage.getItem('rng_length'));
  let max = parseInt(localStorage.getItem('rng_maxLength'));
  if (isNaN(length) || length < 1) length = 5;
  if (isNaN(max) || max < length) max = 20;
  if (max > 1000) max = 1000;
  return { length, max };
}

function saveUserSettings(length, max) {
  localStorage.setItem('rng_length', length);
  localStorage.setItem('rng_maxLength', max);
}

// Random generators
function getRandomDecimal(digits) {
  if (digits <= 0) return '';
  let result = String(Math.floor(Math.random() * 9) + 1);
  for (let i = 1; i < digits; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}
function getRandomHex(digits) {
  const chars = '0123456789ABCDEF';
  let res = '';
  for (let i = 0; i < digits; i++) {
    res += chars.charAt(Math.floor(Math.random() * 16));
  }
  return res;
}
function getRandomBinary(digits) {
  let res = '';
  for (let i = 0; i < digits; i++) {
    res += Math.floor(Math.random() * 2);
  }
  return res;
}
function getRandomString(digits) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  for (let i = 0; i < digits; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// DOM elements
const numberDisplay = document.getElementById('number-display');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const copyMsg = document.getElementById('copy-msg');
const digitSlider = document.getElementById('digit-slider');
const digitCount = document.getElementById('digit-count');
const maxSlider = document.getElementById('max-slider');
const modeBtns = document.querySelectorAll('.modeBtn');
const presets = document.getElementById('presets');
const autoCopyToggle = document.getElementById('auto-copy-toggle');
const darkModeToggle = document.getElementById('dark-mode-toggle');

let currentMode = 'decimal';

function animateNumber() {
  numberDisplay.style.color = "inherit";
  gsap.to(numberDisplay, {
    color: '#2bb3d2',
    scale: 1.05,
    y: -2.5,
    duration: 0.15,
    ease: "power1.out",
    onComplete: () => {
      gsap.to(numberDisplay, {
        color: 'inherit',
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
    document.body.appendChild(rollOverlay);
  }
  rollOverlay.textContent = 'Rolled!';
  rollOverlay.classList.add("show");

  const diceIcon = document.getElementById('dice-icon');
  gsap.fromTo(diceIcon,
    { rotation: 0 },
    { rotation: 360, duration: 0.15, ease: "power1.inOut" }
  );
  gsap.fromTo(generateBtn,
    { scale: 1 },
    { scale: 1.25, duration: 0.075, yoyo: true, repeat: 1, ease: "power2.out" }
  );

  gsap.timeline({
    onComplete: () => rollOverlay.classList.remove("show")
  })
    .to(rollOverlay, { opacity: 1, scale: 1.25, duration: 0.075, ease: "power1.out" })
    .to(rollOverlay, { opacity: 0, scale: 1, duration: 0.075, ease: "power1.in" });
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

function setDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  setCookie('darkModeEnabled', enabled, 365);
}

function setAutoCopy(enabled) {
  setCookie('autoCopyEnabled', enabled, 365);
}

function saveMode(mode) {
  setCookie('lastSelectedMode', mode, 365);
}

function setUpPresets() {
  presets.innerHTML = `
    <button class="presetDigit" data-digits="5">5</button>
    <button class="presetDigit" data-digits="10">10</button>
    <button class="presetDigit" data-digits="15">15</button>
    <button class="presetDigit" data-digits="20">20</button>
    <button class="presetDigit" data-digits="25">25</button>
  `;
  presets.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      let val = parseInt(button.getAttribute("data-digits"));
      let max = parseInt(maxSlider.value);
      if (val > max) val = max;
      digitSlider.value = val;
      digitCount.value = val;
      saveUserSettings(val, max);
      generateValue();
      animateButton(button);
      button.blur();
    });
  });
}

function generateValue(animate = true) {
  let digits = parseInt(digitCount.value);
  let max = parseInt(maxSlider.value);

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

  let result = '';
  switch (currentMode) {
    case 'decimal':
      result = getRandomDecimal(digits);
      break;
    case 'hex':
      result = getRandomHex(digits);
      break;
    case 'binary':
      result = getRandomBinary(digits);
      break;
    case 'string':
      result = getRandomString(digits);
      break;
    default:
      result = "-----";
  }

  numberDisplay.textContent = result;

  if (animate) {
    animateNumber();
  }
}

// Event handlers
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');

    currentMode = btn.getAttribute('data-mode');
    saveMode(currentMode);

    generateValue();
    btn.blur();
    animateButton(btn);
  });
});

autoCopyToggle.addEventListener('change', () => {
  setAutoCopy(autoCopyToggle.checked);
  setDarkMode(darkModeToggle.checked);
});

darkModeToggle.addEventListener('change', () => {
  setDarkMode(darkModeToggle.checked);
});

digitSlider.addEventListener('input', () => {
  let val = parseInt(digitSlider.value);
  let max = parseInt(maxSlider.value);
  if (val > max) val = max;
  digitSlider.value = val;
  digitCount.value = val;
  saveUserSettings(val, max);
  generateValue();
});

digitCount.addEventListener('input', () => {
  let val = parseInt(digitCount.value);
  let max = parseInt(maxSlider.value);
  if (isNaN(val) || val < 1) val = 1;
  if (val > max) val = max;
  digitCount.value = val;
  digitSlider.value = val;
  saveUserSettings(val, max);
  generateValue();
});

maxSlider.addEventListener('input', () => {
  let max = parseInt(maxSlider.value);
  if (isNaN(max) || max < 1) max = 20;
  if (digitSlider.value > max) {
    digitSlider.value = max;
    digitCount.value = max;
  }
  maxSlider.value = max;
  digitSlider.max = max;
  digitCount.max = max;
  saveUserSettings(parseInt(digitSlider.value), max);
  generateValue();
});

generateBtn.addEventListener('click', () => {
  generateValue(true);
  animateRoll();
});

copyBtn.addEventListener('click', () => {
  let val = numberDisplay.textContent;
  if (val && val !== "-----" && val !== "All numbers used!") {
    navigator.clipboard.writeText(val);
    animateCopy();
    copyBtn.blur();
  }
});

// Initialization on load
window.onload = () => {
  // Setup toggles state from cookies
  let autoCopyVal = getCookie('autoCopyEnabled');
  autoCopyToggle.checked = autoCopyVal === "true";

  let darkModeVal = getCookie('darkModeEnabled');
  darkModeToggle.checked = darkModeVal === "true";
  setDarkMode(darkModeToggle.checked);

  // Restore last used mode from cookie
  let lastMode = getCookie('lastSelectedMode');
  if (lastMode && ['decimal', 'hex', 'binary', 'string'].includes(lastMode)) {
    currentMode = lastMode;
  } else {
    currentMode = 'decimal';
  }

  // Update mode buttons UI
  modeBtns.forEach(btn => {
    if (btn.getAttribute('data-mode') === currentMode) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // Load persisted length and max
  let { length, max } = loadUserSettings();

  if (!max || max > 1000) max = 1000;
  if (!length) length = 5;
  if (length > max) length = max;

  // Setup inputs
  maxSlider.min = 1;
  maxSlider.max = 1000;
  maxSlider.value = max;

  digitSlider.min = 1;
  digitSlider.max = max;
  digitSlider.value = length;

  digitCount.min = 1;
  digitCount.max = max;
  digitCount.value = length;

  setUpPresets();

  generateValue();

  if (autoCopyToggle.checked && numberDisplay.textContent !== "-----") {
    navigator.clipboard.writeText(numberDisplay.textContent);
    animateCopy();
  }
};
