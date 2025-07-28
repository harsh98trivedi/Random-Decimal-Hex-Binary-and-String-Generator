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

  if (isNaN(length) || length < 1) length = 5; // default length
  if (isNaN(max) || max < length) max = 25;    // default max (>= length)

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
  numberStr += Math.floor(Math.random() * 9) + 1; // First digit 1-9
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
const numberDisplay = document.getElementById('numberDisplay');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const copyMsg = document.getElementById('copyMsg');
const digitSlider = document.getElementById('digitSlider');
const digitCount = document.getElementById('digitCount');
const maxSlider = document.getElementById('maxSlider');
const modeBtns = document.querySelectorAll('.modeBtn');
const presetsRow = document.getElementById('presetsRow');
const lengthLabel = document.getElementById('lengthLabel');
const autoCopyToggle = document.getElementById('autoCopyToggle');

let currentMode = 'decimal';

// --- Animations ---
function animateNumber() {
  // Ensure number is black at start
  numberDisplay.style.color = "#111";
  gsap.to(numberDisplay, {
    color: '#2bb3d2',
    scale: 1.15,
    y: -15,
    duration: 0.13,
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
  let rollOverlay = document.getElementById('rollMsg');
  if (!rollOverlay) {
    rollOverlay = document.createElement('div');
    rollOverlay.id = 'rollMsg';
    rollOverlay.className = 'roll-msg-overlay';
    rollOverlay.setAttribute('role', 'status');
    rollOverlay.setAttribute('aria-live', 'polite');
    rollOverlay.textContent = 'Rolled!';
    document.body.appendChild(rollOverlay);
  } else {
    rollOverlay.textContent = 'Rolled!';
  }
  rollOverlay.classList.add("show");
  gsap.fromTo(generateBtn, { scale: 1 }, { scale: 1.25, duration: 0.05, yoyo: true, repeat: 1, ease: "power2.out" });
  gsap.fromTo(rollOverlay, { opacity: 0, scale: 1 }, {
    opacity: 1, scale: 1.25, duration: 0.05, ease: "power1.out",
    onComplete: () => {
      gsap.to(rollOverlay, {
        opacity: 0,
        scale: 1,
        duration: 0.05,
        delay: 0.025,
        onComplete: () => rollOverlay.classList.remove("show"),
      });
    },
  });
}

function animateCopy() {
  copyMsg.classList.add("show");
  setTimeout(() => {
    copyMsg.classList.remove("show");
  }, 900);
  gsap.fromTo('#copyIcon', { rotate: 0 }, { rotate: 360, duration: 0.05, yoyo: true, repeat: 1 });
  gsap.fromTo(copyBtn, { boxShadow: "0 0 0 #0000" }, { boxShadow: "0 0 15px #2228", duration: 0.05, yoyo: true, repeat: 1 });
}
function animateButton(btn) {
  gsap.fromTo(btn, { scale: 1 }, { scale: 0.95, duration: 0.05, yoyo: true, repeat: 1 });
}

// --- Preset Buttons Setup ---
function setPresets() {
  presetsRow.innerHTML = `
    <button class="presetDigit btn-neutral" data-digits="5">5</button>
    <button class="presetDigit btn-neutral" data-digits="10">10</button>
    <button class="presetDigit btn-neutral" data-digits="15">15</button>
    <button class="presetDigit btn-neutral" data-digits="20">20</button>
    <button class="presetDigit btn-neutral" data-digits="25">25</button>
  `;
  document.querySelectorAll('.presetDigit').forEach((btn) => {
    btn.addEventListener('click', () => {
      let val = parseInt(btn.getAttribute('data-digits'), 10);
      const maxVal = parseInt(maxSlider.value, 10);
      val = val > maxVal ? maxVal : val;

      digitSlider.value = val;
      digitCount.value = val;
      saveUserSettings(val, maxVal);
      generateValue();
      btn.blur();
      animateButton(btn);
    });
  });
}

// --- Generate Value ---
function generateValue(animate = true) {
  let digits = parseInt(digitCount.value, 10);
  let max = parseInt(maxSlider.value, 10);

  if (isNaN(digits) || digits < 1) digits = 1;
  else if (digits > max) digits = max;

  digitSlider.value = digits;
  digitCount.value = digits;
  digitSlider.max = max;
  digitCount.max = max;

  if (digits < 1 || digits > max) {
    numberDisplay.textContent = "-----";
    return;
  }

  let val = '';
  switch (currentMode) {
    case "decimal":
      val = getRandomDecimal(digits);
      break;
    case "hex":
      val = getRandomHex(digits);
      break;
    case "binary":
      val = getRandomBinary(digits);
      break;
    case "string":
      val = getRandomString(digits);
      break;
    default:
      val = "-----";
  }
  numberDisplay.textContent = val;

  if (animate) animateNumber();
}

// --- Mode Buttons ---
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    currentMode = btn.getAttribute('data-mode');

    // Save selected mode in cookie
    setCookie('lastSelectedMode', currentMode, 365);

    generateValue();
    btn.blur();
    animateButton(btn);
  });
});

// --- Auto Copy Toggle ---
autoCopyToggle.addEventListener('change', () => {
  setCookie('autoCopyEnabled', autoCopyToggle.checked, 365);
});

// --- Event Listeners ---

digitSlider.addEventListener('input', () => {
  let val = parseInt(digitSlider.value, 10);
  const maxVal = parseInt(maxSlider.value, 10);
  val = Math.min(val, maxVal);
  digitSlider.value = val;
  digitCount.value = val;
  saveUserSettings(val, maxVal);
  generateValue();
});

digitCount.addEventListener('input', () => {
  let val = parseInt(digitCount.value, 10);
  const maxVal = parseInt(maxSlider.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  val = Math.min(val, maxVal);
  digitCount.value = val;
  digitSlider.value = val;
  saveUserSettings(val, maxVal);
  generateValue();
});

maxSlider.addEventListener('input', () => {
  let maxVal = parseInt(maxSlider.value, 10);
  if (isNaN(maxVal) || maxVal < 1) maxVal = 20;
  if (parseInt(digitSlider.value, 10) > maxVal) {
    digitSlider.value = maxVal;
    digitCount.value = maxVal;
  }
  maxSlider.value = maxVal;
  digitSlider.max = maxVal;
  digitCount.max = maxVal;
  saveUserSettings(parseInt(digitSlider.value, 10), maxVal);
  generateValue();
});

generateBtn.addEventListener('click', () => {
  generateValue(true);
  animateRoll();
});

copyBtn.addEventListener('click', () => {
  const val = numberDisplay.textContent;
  if (val && val !== "-----") {
    navigator.clipboard.writeText(val);
    animateCopy();
    copyBtn.blur();
  }
});

// --- On Load ---
window.onload = () => {
  const autoCopyCookie = getCookie('autoCopyEnabled');
  autoCopyToggle.checked = autoCopyCookie === "true";

  const lastModeCookie = getCookie('lastSelectedMode');
  if (lastModeCookie && ["decimal", "hex", "binary", "string"].includes(lastModeCookie)) {
    currentMode = lastModeCookie;
  } else {
    currentMode = 'decimal';
  }

  // Update mode buttons UI
  modeBtns.forEach(btn => {
    const mode = btn.getAttribute('data-mode');
    if (mode === currentMode) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  const { length, max } = loadUserSettings();

  maxSlider.min = 1;
  maxSlider.max = 1000;
  maxSlider.value = max;

  digitSlider.min = 1;
  digitSlider.max = max;
  digitSlider.value = length;

  digitCount.min = 1;
  digitCount.max = max;
  digitCount.value = length;

  setPresets();
  generateValue(false);

  // If auto copy enabled, auto copy the initial value
  if(autoCopyToggle.checked && numberDisplay.textContent !== "-----") {
    // Re-generate with animation and copy to clipboard
    generateValue(true);
    navigator.clipboard.writeText(numberDisplay.textContent);
    animateCopy();
  }
};
