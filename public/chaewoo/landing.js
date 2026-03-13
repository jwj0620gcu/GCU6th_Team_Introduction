// Slaughter: One-Page Progression Logic

let bloodLevel = 20;
const statusText = document.getElementById('statusText');
const bloodLevelEl = document.getElementById('bloodLevel');
const bloodOverlay = document.getElementById('bloodOverlay');
const body = document.getElementById('gameBody');
const heart = document.getElementById('heart');
const gameMsg = document.getElementById('gameMsg');
const introContainer = document.getElementById('intro');

function updateUI() {
  bloodLevelEl.textContent = `${Math.floor(bloodLevel)}%`;
  
  if (bloodLevel < 40) {
    statusText.textContent = '피의 허기 (Lacks blood)';
    statusText.style.color = 'var(--fresh-blood)';
  } else if (bloodLevel < 80) {
    statusText.textContent = '추출 진행 중 (Extracting)';
    statusText.style.color = 'var(--accent-red)';
  } else if (bloodLevel < 100) {
    statusText.textContent = '폭주 직전 (Satiated)';
    statusText.style.color = '#FFD700';
  } else {
    statusText.textContent = '도륙 완료 (SLAUGHTERED)';
    statusText.style.color = '#FFFFFF';
    introContainer.classList.add('intro-active');
  }

  // Heart & Visual Effects
  const progress = bloodLevel / 100;
  const heartSvg = heart.querySelector('.heart-svg');
  const beatSpeed = Math.max(1.2 - (progress * 1), 0.2);
  heartSvg.style.animationDuration = `${beatSpeed}s`;
  
  const heartScale = 1 + (progress * 1.5);
  heart.style.transform = `scale(${heartScale})`;
  
  bloodOverlay.style.opacity = progress * 0.7;
  
  // SHAKE CONTROL: ONLY shake if between 20% and 99.9%
  // Once it hits 100%, REMOVE shake permanently.
  if (bloodLevel > 20 && bloodLevel < 100) {
    body.classList.add('shake');
    const shakeSpeed = Math.max(0.5 - (progress * 0.4), 0.05);
    body.style.animationDuration = `${shakeSpeed}s`;
  } else {
    body.classList.remove('shake');
    body.style.animationDuration = '0s'; // Extra safety
  }

  // Auto-scroll when 100%
  if (bloodLevel >= 100) {
    setTimeout(() => {
      introContainer.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }
}

function showMessage(text) {
  gameMsg.textContent = text;
  gameMsg.style.opacity = 1;
  gameMsg.style.transform = 'translate(-50%, -100%)';
  gameMsg.style.transition = 'all 0.4s ease-out';
  
  setTimeout(() => {
    gameMsg.style.opacity = 0;
    gameMsg.style.transform = 'translate(-50%, -50%)';
  }, 800);
}

function extract(amount, msg) {
  if (bloodLevel >= 100) return;
  
  bloodLevel = Math.min(bloodLevel + amount, 100);
  updateUI();
  showMessage(msg);
  
  // Flash effect
  bloodOverlay.style.background = 'white';
  setTimeout(() => {
    bloodOverlay.style.background = 'radial-gradient(circle, transparent 20%, rgba(255, 0, 0, 0.4) 100%)';
  }, 50);
}

// Click Events
document.getElementById('bloodBtn').addEventListener('click', () => {
  extract(15, "피순대 섭취! (+15%)");
});

document.getElementById('soupBtn').addEventListener('click', () => {
  extract(10, "선지해장국 흡입! (+10%)");
});

heart.addEventListener('click', () => {
  extract(5, "심장 박동 가속! (+5%)");
});

// Initial UI
updateUI();

// Ensure scroll doesn't re-trigger shake
window.addEventListener('scroll', () => {
  if (bloodLevel >= 100) {
    body.classList.remove('shake');
  }
});
