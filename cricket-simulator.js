const cricketRoot = document.querySelector("[data-cricket-game]");

if (cricketRoot) {
  const canvas = cricketRoot.querySelector("[data-cricket-canvas]");
  const ctx = canvas.getContext("2d");
  const scoreEl = cricketRoot.querySelector("[data-cricket-score]");
  const targetEl = cricketRoot.querySelector("[data-cricket-target]");
  const ballsEl = cricketRoot.querySelector("[data-cricket-balls]");
  const requiredEl = cricketRoot.querySelector("[data-cricket-required]");
  const deliveryEl = cricketRoot.querySelector("[data-cricket-delivery]");
  const messageEl = cricketRoot.querySelector("[data-cricket-message]");
  const submessageEl = cricketRoot.querySelector("[data-cricket-submessage]");
  const instructionEl = cricketRoot.querySelector("[data-cricket-instruction]");
  const ballRowEl = cricketRoot.querySelector("[data-cricket-ball-row]");
  const startScreen = cricketRoot.querySelector("[data-cricket-start]");
  const endScreen = cricketRoot.querySelector("[data-cricket-end]");
  const startButton = cricketRoot.querySelector("[data-cricket-start-button]");
  const restartButton = cricketRoot.querySelector("[data-cricket-restart-button]");
  const resetButton = cricketRoot.querySelector("[data-cricket-reset]");
  const endTitle = cricketRoot.querySelector("[data-cricket-end-title]");
  const endResult = cricketRoot.querySelector("[data-cricket-end-result]");
  const endScore = cricketRoot.querySelector("[data-cricket-end-score]");
  const statOne = cricketRoot.querySelector("[data-cricket-stat-one]");
  const statTwo = cricketRoot.querySelector("[data-cricket-stat-two]");
  const statThree = cricketRoot.querySelector("[data-cricket-stat-three]");

  const deliveries = [
    { name: "Yorker", speed: 1.9, swing: 0, bounce: 0.05, pitch: 0.9, line: 0 },
    { name: "Bouncer", speed: 1.8, swing: 0, bounce: 0.6, pitch: 0.5, line: 0 },
    { name: "Good Length", speed: 1.55, swing: 0, bounce: 0.28, pitch: 0.72, line: 0 },
    { name: "Inswing", speed: 1.6, swing: -0.3, bounce: 0.2, pitch: 0.74, line: 0 },
    { name: "Outswing", speed: 1.6, swing: 0.3, bounce: 0.2, pitch: 0.74, line: 0 },
    { name: "Slower Ball", speed: 1.05, swing: 0.1, bounce: 0.22, pitch: 0.73, line: 0 },
    { name: "Off Spin", speed: 0.88, swing: 0.36, bounce: 0.18, pitch: 0.66, line: 0.1 },
    { name: "Leg Spin", speed: 0.84, swing: -0.34, bounce: 0.2, pitch: 0.64, line: -0.1 },
    { name: "Top Spin", speed: 0.95, swing: 0, bounce: 0.38, pitch: 0.68, line: 0 },
    { name: "Flight", speed: 0.72, swing: 0.24, bounce: 0.18, pitch: 0.58, line: 0 }
  ];

  const state = {
    mode: "idle",
    phase: "wait",
    score: 0,
    target: 0,
    balls: 30,
    wickets: 0,
    totalBalls: 0,
    hits: 0,
    fours: 0,
    sixes: 0,
    perfects: 0,
    wait: 0,
    runup: 0,
    deliveryTick: 0,
    deliveryDuration: 80,
    currentDelivery: null,
    bowler: { x: 0, y: 0 },
    ball: { x: 0, y: 0, visible: false },
    pitchMark: { x: 0, y: 0, alpha: 0 },
    end: { x: 0, y: 0 },
    hit: { active: false, x: 0, y: 0, vx: 0, vy: 0, height: 0, vh: 0, tick: 0 },
    trail: [],
    batSwing: 0,
    swinging: false,
    particles: [],
    shake: 0,
    flash: 0,
    lockInput: false,
    messageTimer: null
  };

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomInt(min, max) {
    return Math.floor(randomBetween(min, max + 1));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function resizeCanvas() {
    const rect = cricketRoot.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function width() {
    return cricketRoot.clientWidth;
  }

  function height() {
    return cricketRoot.clientHeight;
  }

  function pitch() {
    const w = width();
    const h = height();
    const top = h * 0.16;
    const bottom = h * 0.83;
    return {
      cx: w * 0.5,
      top,
      bottom,
      height: bottom - top,
      width: Math.max(84, w * 0.1)
    };
  }

  function updateHud() {
    scoreEl.textContent = state.score;
    targetEl.textContent = state.target || "-";
    ballsEl.textContent = state.balls;
    const required = state.target - state.score;
    requiredEl.textContent = required > 0 && state.balls > 0 ? `Need ${required} in ${state.balls}` : "";
  }

  function buildBallRow() {
    ballRowEl.replaceChildren();
    for (let index = 0; index < 30; index += 1) {
      const dot = document.createElement("span");
      ballRowEl.append(dot);
    }
  }

  function markBall(type) {
    const index = 30 - state.balls;
    const dot = ballRowEl.children[index];
    if (dot) {
      dot.className = type === "wicket" ? "wicket" : "used";
    }
  }

  function showMessage(text, subtext, color = "#fff", duration = 900) {
    messageEl.textContent = text;
    submessageEl.textContent = subtext || "";
    messageEl.style.color = color;
    messageEl.style.opacity = "1";
    submessageEl.style.opacity = subtext ? "1" : "0";
    window.clearTimeout(state.messageTimer);
    state.messageTimer = window.setTimeout(() => {
      messageEl.style.opacity = "0";
      submessageEl.style.opacity = "0";
    }, duration);
  }

  function showDelivery(name) {
    deliveryEl.textContent = name;
    deliveryEl.style.color = "rgba(255, 214, 91, 0.9)";
    window.setTimeout(() => {
      deliveryEl.style.color = "rgba(255, 214, 91, 0)";
    }, 1200);
  }

  function addParticle(x, y, color, power = 5) {
    for (let index = 0; index < 16; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(1, power);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomInt(25, 55),
        maxLife: 55,
        color
      });
    }
  }

  function resetGame() {
    state.mode = "playing";
    state.phase = "wait";
    state.score = 0;
    state.target = randomInt(30, 90);
    state.balls = 30;
    state.wickets = 0;
    state.totalBalls = 0;
    state.hits = 0;
    state.fours = 0;
    state.sixes = 0;
    state.perfects = 0;
    state.wait = 45;
    state.hit.active = false;
    state.ball.visible = false;
    state.trail = [];
    state.particles = [];
    state.shake = 0;
    state.flash = 0;
    state.lockInput = false;
    instructionEl.textContent = "Click or press Space to bat";
    buildBallRow();
    updateHud();
  }

  function showStartScreen() {
    state.mode = "idle";
    state.phase = "wait";
    state.hit.active = false;
    state.ball.visible = false;
    state.trail = [];
    state.particles = [];
    state.shake = 0;
    state.flash = 0;
    state.lockInput = false;
    instructionEl.textContent = "Press Space to play";
    messageEl.style.opacity = "0";
    submessageEl.style.opacity = "0";
    startScreen.hidden = false;
    endScreen.hidden = true;
  }

  function nextDelivery() {
    const base = deliveries[randomInt(0, deliveries.length - 1)];
    const flip = Math.random() < 0.28 ? -1 : 1;
    const p = pitch();
    state.currentDelivery = {
      ...base,
      speed: base.speed * randomBetween(0.88, 1.14),
      swing: base.swing * randomBetween(0.75, 1.25) * flip,
      line: base.line * randomBetween(0.8, 1.2)
    };
    state.phase = "runup";
    state.runup = 0;
    state.lockInput = false;
    state.swinging = false;
    state.batSwing = 0;
    state.ball.visible = false;
    state.hit.active = false;
    state.trail = [];
    state.bowler.x = p.cx + randomBetween(-8, 8);
    state.bowler.y = p.top - height() * 0.06;
    showDelivery(state.currentDelivery.name);
  }

  function launchBall() {
    const p = pitch();
    const d = state.currentDelivery;
    state.phase = "delivery";
    state.deliveryTick = 0;
    state.deliveryDuration = Math.round((d.speed > 1.3 ? 70 : 112) / d.speed);
    state.ball.visible = true;
    state.ball.x = state.bowler.x;
    state.ball.y = state.bowler.y;
    state.pitchMark.x = p.cx + d.line * p.width * 1.4;
    state.pitchMark.y = p.top + d.pitch * p.height;
    state.pitchMark.alpha = 1;
    state.end.x = p.cx + d.swing * p.width * 1.6;
    state.end.y = p.top + p.height * 0.9;
  }

  function endGame() {
    state.mode = "end";
    const won = state.score >= state.target;
    const strikeRate = state.totalBalls ? Math.round((state.score / state.totalBalls) * 100) : 0;
    const accuracy = state.totalBalls ? Math.round((state.hits / state.totalBalls) * 100) : 0;
    endTitle.textContent = won ? "Victory" : "Defeat";
    endResult.textContent = won ? "Target achieved" : `Fell short by ${state.target - state.score}`;
    endScore.textContent = `${state.score}/${state.wickets}`;
    statOne.textContent = `Strike rate ${strikeRate}`;
    statTwo.textContent = `Shot accuracy ${accuracy}%`;
    statThree.textContent = `${state.fours} fours · ${state.sixes} sixes · ${state.perfects} perfect`;
    endScreen.hidden = false;
  }

  function maybeEnd() {
    if (state.score >= state.target || state.balls <= 0) {
      window.setTimeout(endGame, 1200);
    }
  }

  function launchHit(quality) {
    const p = pitch();
    const directions = [[-210, -150], [170, -175], [0, -220], [220, -130], [-260, -95], [260, -95]];
    const direction = directions[randomInt(0, directions.length - 1)];
    const power = quality === "perfect" ? 1.55 : quality === "good" ? 1.05 : 0.58;
    state.hit = {
      active: true,
      x: p.cx,
      y: p.top + p.height * 0.86,
      vx: direction[0] * 0.07 * power,
      vy: direction[1] * 0.07 * power,
      height: 0,
      vh: quality === "perfect" ? 10 : quality === "good" ? 6 : 2,
      tick: 0
    };
  }

  function processShot(quality) {
    markBall("used");
    state.totalBalls += 1;
    state.hits += 1;
    state.balls -= 1;
    let runs = 0;
    let text = "";
    let subtext = "";
    let color = "#fff";

    if (quality === "perfect") {
      runs = Math.random() < 0.55 ? 6 : 4;
      text = runs === 6 ? "Six!" : "Four!";
      subtext = "Perfect timing";
      color = runs === 6 ? "#ffe066" : "#66ffcc";
      state.perfects += 1;
      if (runs === 6) state.sixes += 1;
      if (runs === 4) state.fours += 1;
      state.shake = 16;
      state.flash = 18;
      addParticle(state.ball.x, state.ball.y, "#ffe066", 10);
    } else if (quality === "good") {
      runs = Math.random() < 0.5 ? 3 : 2;
      text = runs === 3 ? "Three" : "Two";
      subtext = "Good timing";
      color = "#aaffaa";
      state.flash = 8;
      addParticle(state.ball.x, state.ball.y, "#88ff88", 6);
    } else {
      runs = Math.random() < 0.5 ? 1 : 0;
      text = runs ? "One" : "Dot";
      subtext = "Late contact";
      color = "rgba(240, 237, 232, 0.7)";
    }

    state.score += runs;
    state.phase = "travel";
    state.swinging = true;
    state.batSwing = 0;
    state.ball.visible = false;
    state.pitchMark.alpha = 0;
    launchHit(quality);
    showMessage(text, subtext, color);
    updateHud();
    maybeEnd();
  }

  function processMiss() {
    state.totalBalls += 1;
    state.balls -= 1;
    state.ball.visible = false;
    state.phase = "travel";
    state.swinging = true;
    state.batSwing = 0;
    state.pitchMark.alpha = 0;
    const wicket = Math.random() < 0.28;
    if (wicket) {
      state.wickets += 1;
      markBall("wicket");
      showMessage("Out!", "Bowled", "#ff4545", 1200);
      addParticle(state.ball.x, state.ball.y, "#ff4545", 7);
      state.shake = 10;
    } else {
      markBall("used");
      showMessage("Miss", "Dot ball", "rgba(255, 100, 100, 0.78)");
    }
    updateHud();
    maybeEnd();
  }

  function handleInput() {
    if (state.mode !== "playing" || state.phase !== "delivery" || state.lockInput) {
      return;
    }
    state.lockInput = true;
    const p = pitch();
    const batX = p.cx;
    const batY = p.top + p.height * 0.86;
    const distance = Math.hypot(state.ball.x - batX, state.ball.y - batY);
    const zone = Math.min(width(), height()) * 0.13;
    if (distance < zone * 0.28) processShot("perfect");
    else if (distance < zone * 0.54) processShot("good");
    else if (distance < zone * 0.82) processShot("ok");
    else processMiss();
  }

  function drawField() {
    const w = width();
    const h = height();
    const p = pitch();
    const gradient = ctx.createRadialGradient(p.cx, h * 0.54, 20, p.cx, h * 0.54, h * 0.9);
    gradient.addColorStop(0, "#10100b");
    gradient.addColorStop(1, "#000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = "rgba(240, 237, 232, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(p.cx, h * 0.56, w * 0.43, h * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(p.cx, h * 0.56, w * 0.34, h * 0.29, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const pitchGradient = ctx.createLinearGradient(p.cx - p.width, p.top, p.cx + p.width, p.bottom);
    pitchGradient.addColorStop(0, "#14140e");
    pitchGradient.addColorStop(1, "#202010");
    ctx.fillStyle = pitchGradient;
    ctx.beginPath();
    ctx.moveTo(p.cx - p.width / 2, p.top);
    ctx.lineTo(p.cx + p.width / 2, p.top);
    ctx.lineTo(p.cx + p.width * 0.58, p.bottom);
    ctx.lineTo(p.cx - p.width * 0.58, p.bottom);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(240, 237, 232, 0.16)";
    ctx.stroke();

    ctx.strokeStyle = "rgba(240, 237, 232, 0.28)";
    const topCrease = p.top + p.height * 0.1;
    const bottomCrease = p.top + p.height * 0.9;
    ctx.beginPath();
    ctx.moveTo(p.cx - p.width * 0.42, topCrease);
    ctx.lineTo(p.cx + p.width * 0.42, topCrease);
    ctx.moveTo(p.cx - p.width * 0.46, bottomCrease);
    ctx.lineTo(p.cx + p.width * 0.46, bottomCrease);
    ctx.stroke();

    [-1, 0, 1].forEach((offset) => {
      ctx.beginPath();
      ctx.moveTo(p.cx + offset * 6, bottomCrease);
      ctx.lineTo(p.cx + offset * 6, bottomCrease + 18);
      ctx.stroke();
    });
    ctx.restore();

    if (state.pitchMark.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = state.pitchMark.alpha;
      ctx.strokeStyle = "#ffe066";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(state.pitchMark.x, state.pitchMark.y, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(102, 255, 204, 0.8)";
      ctx.beginPath();
      ctx.arc(state.pitchMark.x, state.pitchMark.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawStickFigure(x, y, type = "bowler") {
    ctx.save();
    ctx.strokeStyle = "rgba(240, 237, 232, 0.92)";
    ctx.fillStyle = "#f0ede8";
    ctx.lineWidth = type === "bat" ? 2.2 : 1.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y - 28, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x, y - 2);
    ctx.stroke();

    if (type === "bat") {
      const angle = state.swinging ? -0.7 + state.batSwing * 2.2 : -0.7;
      const handX = x + Math.cos(angle) * 18;
      const handY = y - 16 + Math.sin(angle) * 18;
      ctx.beginPath();
      ctx.moveTo(x, y - 15);
      ctx.lineTo(handX, handY);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(handX + Math.cos(angle) * 24, handY + Math.sin(angle) * 24);
      ctx.stroke();
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x - 13, y - 2);
      ctx.stroke();
    } else {
      const swing = Math.sin(state.runup * 0.35) * 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x + Math.cos(swing) * 15, y - 14 + Math.sin(swing) * 15);
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x - Math.cos(swing) * 11, y - 14 - Math.sin(swing) * 11);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x - 9, y + 18);
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x + 9, y + 18);
    ctx.stroke();
    ctx.restore();
  }

  function drawBall() {
    if (!state.ball.visible) return;
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#fff";
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHitBall() {
    const hit = state.hit;
    if (!hit.active) return;
    for (let index = 1; index < state.trail.length; index += 1) {
      const alpha = index / state.trail.length;
      ctx.save();
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = hit.height > 20 ? "#ffe066" : "#fff";
      ctx.lineWidth = alpha * 3;
      ctx.beginPath();
      ctx.moveTo(state.trail[index - 1].x, state.trail[index - 1].y);
      ctx.lineTo(state.trail[index].x, state.trail[index].y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = hit.height > 20 ? "#ffe066" : "#fff";
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(hit.x, hit.y - hit.height, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2.5 * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function updateGame() {
    if (state.mode !== "playing") return;
    if (state.phase === "wait") {
      state.wait -= 1;
      if (state.wait <= 0) nextDelivery();
    }

    if (state.phase === "runup") {
      const p = pitch();
      state.runup += 1;
      state.bowler.y = lerp(p.top - height() * 0.06, p.top + p.height * 0.13, clamp(state.runup / 48, 0, 1));
      if (state.runup >= 48) launchBall();
    }

    if (state.phase === "delivery") {
      const p = pitch();
      const d = state.currentDelivery;
      state.deliveryTick += 1;
      const half = state.deliveryDuration / 2;
      if (state.deliveryTick < half) {
        const t = state.deliveryTick / half;
        state.ball.x = lerp(state.bowler.x, state.pitchMark.x, t) + Math.sin(t * Math.PI) * d.swing * p.width;
        state.ball.y = lerp(state.bowler.y, state.pitchMark.y, t) - Math.sin(t * Math.PI) * d.bounce * height() * 0.18;
      } else {
        const t = clamp((state.deliveryTick - half) / half, 0, 1);
        state.ball.x = lerp(state.pitchMark.x, state.end.x, t);
        state.ball.y = lerp(state.pitchMark.y, state.end.y, t);
      }
      state.pitchMark.alpha = clamp(state.pitchMark.alpha - 0.012, 0, 1);
      if (state.deliveryTick >= state.deliveryDuration) processMiss();
    }

    if (state.phase === "travel") {
      if (state.swinging) {
        state.batSwing = clamp(state.batSwing + 0.08, 0, 1);
        if (state.batSwing >= 1) state.swinging = false;
      }
      if (state.hit.active) {
        state.hit.tick += 1;
        state.hit.x += state.hit.vx;
        state.hit.y += state.hit.vy;
        state.hit.vy += 0.055;
        state.hit.height += state.hit.vh;
        state.hit.vh -= 0.18;
        if (state.hit.height < 0) {
          state.hit.height = 0;
          state.hit.vh *= -0.4;
        }
        state.trail.push({ x: state.hit.x, y: state.hit.y - state.hit.height });
        if (state.trail.length > 22) state.trail.shift();
        if (state.hit.tick > 120) state.hit.active = false;
      }
      if (!state.hit.active && !state.swinging && state.mode === "playing") {
        state.phase = "wait";
        state.wait = 74;
        state.lockInput = false;
        state.trail = [];
      }
    }

    state.particles = state.particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.92;
      particle.vy = particle.vy * 0.92 + 0.12;
      particle.life -= 1;
      return particle.life > 0;
    });

    state.shake *= 0.82;
    state.flash = Math.max(0, state.flash - 1);
  }

  function render() {
    requestAnimationFrame(render);
    ctx.clearRect(0, 0, width(), height());
    ctx.save();
    if (state.shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    drawField();
    if (state.mode === "playing") {
      const p = pitch();
      drawStickFigure(state.bowler.x, state.bowler.y, "bowler");
      drawStickFigure(p.cx, p.top + p.height * 0.86, "bat");
      drawBall();
      drawHitBall();
      drawParticles();
      if (state.flash > 0) {
        ctx.save();
        ctx.globalAlpha = state.flash / 35;
        ctx.fillStyle = "#ffe066";
        ctx.beginPath();
        ctx.arc(p.cx, p.top + p.height * 0.86, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
    updateGame();
  }

  function start() {
    resetGame();
    startScreen.hidden = true;
    endScreen.hidden = true;
  }

  startButton.addEventListener("click", start);
  restartButton.addEventListener("click", start);
  resetButton.addEventListener("click", showStartScreen);
  canvas.addEventListener("click", handleInput);
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !startScreen.hidden) {
      event.preventDefault();
      start();
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      handleInput();
    }
  });

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  buildBallRow();
  updateHud();
  render();
}
