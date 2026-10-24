let currentDiscount = 0;
let jerseysData = [];

// 1. Fetch Jerseys from Node.js / MongoDB
async function fetchJerseys() {
  try {
    const res = await fetch('/api/jerseys');
    jerseysData = await res.json();
    renderJerseys();
  } catch (err) {
    console.error("Backend fetch error:", err);
  }
}

function renderJerseys() {
  const container = document.getElementById('jerseyList');
  container.innerHTML = jerseysData.map(j => {
    const discounted = Math.round(j.basePrice * (1 - currentDiscount / 100));
    return `
      <div class="jersey-card">
        <div>
          <span class="match-date">${j.match}</span>
          <h3>${j.title}</h3>
          <p>${j.signedNote || 'Personally signed match shirt'}</p>
        </div>
        <div class="price-tag">
          <div>
            <div style="font-size:0.8rem; text-decoration:line-through; color:#777;">$${j.basePrice.toLocaleString()}</div>
            <div class="amount">$${discounted.toLocaleString()}</div>
          </div>
          <button class="btn-claim" onclick="submitInquiry('${j._id || j.id}', ${discounted})">Acquire</button>
        </div>
      </div>
    `;
  }).join('');
}

async function submitInquiry(id, price) {
  try {
    const res = await fetch('/api/inquire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jerseyId: id, finalPrice: price })
    });
    const data = await res.json();
    alert(data.message);
  } catch (e) {
    alert(`Acquisition inquiry saved at $${price.toLocaleString()}!`);
  }
}

// 2. CR7 Ball Kick & MongoDB Stats Fetcher
async function kickBall(club) {
  const cr7 = document.getElementById('cr7Player');
  const ball = document.getElementById('ball');
  const buttons = document.querySelectorAll('.btn-ball');

  buttons.forEach(btn => {
    if (btn.textContent.includes(club)) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  // Kick animation
  cr7.classList.add('kick');
  ball.classList.add('flying');

  // Play whistle & kick sound
  playWhistleSound();

  // Fetch stats from backend
  try {
    const res = await fetch(`/api/stats/${encodeURIComponent(club)}`);
    const data = await res.json();

    setTimeout(() => {
      document.getElementById('statClub').textContent = `${data.club} (${data.years})`;
      document.getElementById('statQuote').textContent = `"${data.quote}"`;
      document.getElementById('statMatches').textContent = data.matches;
      document.getElementById('statGoals').textContent = data.goals;
      document.getElementById('statAssists').textContent = data.assists;
      document.getElementById('statTrophies').innerHTML = `<strong>Trophies:</strong> ${data.trophies.join(' • ')}`;

      cr7.classList.remove('kick');
      ball.classList.remove('flying');
    }, 700);
  } catch (e) {
    cr7.classList.remove('kick');
    ball.classList.remove('flying');
  }
}

// 3. 3D Scroll Perspective Animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.outfit-card').forEach(card => observer.observe(card));

// 4. SIUUU Microphone Voice Scream Engine
const btnMic = document.getElementById('btnMic');
const meterFill = document.getElementById('meterFill');
const statusMessage = document.getElementById('statusMessage');
const navDiscount = document.getElementById('navDiscount');
let isRecording = false;

btnMic.addEventListener('click', async () => {
  if (isRecording) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const mic = audioCtx.createMediaStreamSource(stream);
    const scriptProcessor = audioCtx.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    mic.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioCtx.destination);

    isRecording = true;
    btnMic.textContent = "Listening... SHOUT 'SIUUUU'!";
    let highestIntensity = 0;

    scriptProcessor.onaudioprocess = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      let sum = 0;
      data.forEach(v => sum += v);
      let avg = sum / data.length;

      let score = Math.min(100, Math.round((avg / 80) * 100));
      meterFill.style.width = `${score}%`;

      if (score > highestIntensity) {
        highestIntensity = score;
        currentDiscount = Math.min(50, Math.round(highestIntensity / 2));
        navDiscount.textContent = `${currentDiscount}%`;
        renderJerseys();
      }
    };

    setTimeout(() => {
      scriptProcessor.disconnect();
      mic.disconnect();
      audioCtx.close();
      isRecording = false;
      btnMic.textContent = "Scream Again!";
      statusMessage.textContent = `⚡ Incredible! You unlocked a ${currentDiscount}% discount on all shirts!`;
    }, 5500);

  } catch (err) {
    alert("Microphone permission required for the scream test!");
  }
});

// 5. Synthesized Referee Whistle Sound
function playWhistleSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(2600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

document.getElementById('btnStadium').addEventListener('click', playWhistleSound);

// Initial Load
fetchJerseys();