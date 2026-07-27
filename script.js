/**
 * ==========================================================================
 * Joako.Web - Motor Principal de JavaScript (Next-Gen Retro Engine)
 * ==========================================================================
 * Incluye:
 * 1. Sintetizador de Sonidos Retro de 8-Bit (Web Audio API)
 * 2. Visualizador de Audio Cyber Deck y analizador de frecuencias
 * 3. Selector de temas y filtros CRT
 * 4. Lluvia de código Matrix en Canvas
 * 5. Fondo dinamico de partículas y estrellas
 * 6. Consola Terminal interactiva ejecutable JoakoOS
 * 7. Mini-Juego Arcade Canvas 2D a 60 FPS
 * 8. Efecto 3D Tilt en tarjetas al pasar el ratón
 * 9. Widget interactivo de Mate 🧉 con contador y física de vapor
 * 10. Easter egg de Código Konami
 * 
 * Regla de Emojis: Únicamente se permite el emoji de mate (🧉).
 */

document.addEventListener("DOMContentLoaded", () => {
  // Variables globales de estado
  let sfxEnabled = true;
  let audioCtx = null;
  let sessionStartTime = Date.now();
  let totalClicks = 0;

  /**
   * Obtiene o inicializa el contexto de Web Audio API al interactuar el usuario.
   * Evita bloqueos de autoplay de los navegadores modernos.
   */
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // ==========================================================================
  // 1. SINTETIZADOR DE SONIDOS RETRO 8-BIT (WEB AUDIO API)
  // ==========================================================================

  /**
   * Genera un tono sintetizado mediante osciladores y nodos de ganancia.
   * @param {number} freq - Frecuencia en Hertz (Hz)
   * @param {number} duration - Duración en segundos
   * @param {string} type - Tipo de onda ('square', 'sine', 'triangle', 'sawtooth')
   * @param {number} startVol - Volumen inicial (0 a 1)
   */
  function playTone(freq, duration = 0.08, type = "square", startVol = 0.15) {
    if (!sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(startVol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  /**
   * Sintetiza un efecto de sonido retro para el servido y burbujeo del mate 🧉
   * realizando un barrido exponencial de frecuencia.
   */
  function playMateSound() {
    if (!sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  /**
   * Toca una secuencia arpegiada de 4 notas sintetizadas para victorias o logros.
   */
  function playVictorySound() {
    if (!sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Notas C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 0.12, "triangle", 0.2);
      }, idx * 90);
    });
  }

  // Asigna sonido leve de hover a elementos interactivos
  document.querySelectorAll("button, a, .card-item, .version-2").forEach(elem => {
    elem.addEventListener("mouseenter", () => {
      playTone(440, 0.03, "sine", 0.05);
    });
  });

  // Registra el contador global de clics y dispara sonido retro al hacer clic
  document.addEventListener("click", () => {
    totalClicks++;
    playTone(320, 0.04, "square", 0.06);
  });


  // ==========================================================================
  // 2. CYBER DECK DE AUDIO Y VISUALIZADOR DE ESPECTRO EN CANVAS
  // ==========================================================================
  const audio = document.getElementById("bg-audio");
  const playBtn = document.getElementById("audio-play-btn");
  const muteBtn = document.getElementById("audio-mute-btn");
  const volumeSlider = document.getElementById("volume-slider");
  const canvas = document.getElementById("visualizer");
  const visCtx = canvas ? canvas.getContext("2d") : null;

  let analyser = null;
  let dataArray = null;
  let isAudioInitialized = false;

  /**
   * Conecta el elemento de audio HTML5 al AnalyserNode de Web Audio API.
   */
  function initWebAudioAnalyser() {
    if (isAudioInitialized || !audio) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 64;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      dataArray = new Uint8Array(analyser.frequencyBinCount);
      isAudioInitialized = true;
    } catch (e) {}
  }

  /**
   * Bucle de dibujo del ecualizador en tiempo real mediante requestAnimationFrame.
   */
  function drawVisualizer() {
    if (!visCtx || !canvas) return;
    requestAnimationFrame(drawVisualizer);

    const width = canvas.width;
    const height = canvas.height;
    visCtx.clearRect(0, 0, width, height);

    const isPlaying = audio && !audio.paused && !audio.muted;
    const barsCount = 24;
    const barWidth = (width / barsCount) - 3;

    if (isAudioInitialized && analyser && isPlaying) {
      analyser.getByteFrequencyData(dataArray);
    }

    for (let i = 0; i < barsCount; i++) {
      let value = 0;
      if (isPlaying) {
        if (dataArray && dataArray[i] !== undefined) {
          value = dataArray[i] / 255;
        } else {
          // Algoritmo de ondas de respaldo si el audio aun no ha cargado datos de espectro
          const time = Date.now() * 0.005;
          value = (Math.sin(time + i * 0.3) + 1) / 2 * 0.7 + 0.15;
        }
      } else {
        value = 0.05; // Estado reposo base
      }

      const barHeight = Math.max(3, value * height);
      const x = i * (barWidth + 3);
      const y = height - barHeight;

      // Degradado dinamico para las barras del ecualizador
      const gradient = visCtx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "#a1ffdb");
      gradient.addColorStop(0.6, "#fff2a1");
      gradient.addColorStop(1, "#ff7ebb");

      visCtx.fillStyle = gradient;
      visCtx.fillRect(x, y, barWidth, barHeight);
    }
  }

  drawVisualizer();

  /**
   * Conmuta el estado de reproduccion del audio de fondo.
   */
  function togglePlay() {
    if (!audio) return;
    initWebAudioAnalyser();

    if (audio.paused) {
      audio.play().then(() => {
        updateAudioUI();
        showToast("[AUDIO] Reproduciendo musica retro");
      }).catch(() => {
        showToast("Haz clic para permitir audio");
      });
    } else {
      audio.pause();
      updateAudioUI();
      showToast("[PAUSA] Audio pausado");
    }
  }

  /**
   * Conmuta el estado de silencio (mute) del audio.
   */
  function toggleMute() {
    if (!audio) return;
    audio.muted = !audio.muted;
    updateAudioUI();
    showToast(audio.muted ? "[MUT] Audio silenciado" : "[VOL] Audio activado");
  }

  /**
   * Actualiza el texto e iconos de los botones de audio segun el estado actual.
   */
  function updateAudioUI() {
    if (!audio || !playBtn || !muteBtn) return;
    const playIcon = playBtn.querySelector(".btn-icon");
    const playText = playBtn.querySelector(".btn-text");
    if (audio.paused) {
      if (playIcon) playIcon.textContent = "[>]";
      if (playText) playText.textContent = "Reproducir";
    } else {
      if (playIcon) playIcon.textContent = "[||]";
      if (playText) playText.textContent = "Pausar";
    }

    const muteIcon = muteBtn.querySelector(".btn-icon");
    const muteText = muteBtn.querySelector(".btn-text");
    if (audio.muted) {
      if (muteIcon) muteIcon.textContent = "[MUT]";
      if (muteText) muteText.textContent = "Silenciado";
    } else {
      if (muteIcon) muteIcon.textContent = "[VOL]";
      if (muteText) muteText.textContent = "Sonar";
    }
  }

  if (playBtn) playBtn.addEventListener("click", togglePlay);
  if (muteBtn) muteBtn.addEventListener("click", toggleMute);
  if (volumeSlider && audio) {
    volumeSlider.addEventListener("input", (e) => {
      audio.volume = parseFloat(e.target.value);
    });
  }


  // ==========================================================================
  // 3. BARRA SUPERIOR: SFX, SHADER CRT Y SELECTOR DE TEMAS
  // ==========================================================================
  const sfxToggleBtn = document.getElementById("sfx-toggle-btn");
  if (sfxToggleBtn) {
    sfxToggleBtn.addEventListener("click", () => {
      sfxEnabled = !sfxEnabled;
      sfxToggleBtn.textContent = sfxEnabled ? "[SFX: ON]" : "[SFX: OFF]";
      showToast(sfxEnabled ? "[SFX] Efectos SFX Activados" : "[SFX] Efectos SFX Desactivados");
    });
  }

  const crtToggleBtn = document.getElementById("crt-toggle-btn");
  const crtOverlay = document.getElementById("crt-overlay");
  if (crtToggleBtn && crtOverlay) {
    crtToggleBtn.addEventListener("click", () => {
      crtOverlay.classList.toggle("crt-active");
      const isActive = crtOverlay.classList.contains("crt-active");
      showToast(isActive ? "[CRT] Filtro CRT Activado" : "[CRT] Filtro CRT Desactivado");
    });
  }

  const themes = ["theme-cyberpunk", "theme-gameboy", "theme-osupink", "theme-matrix"];
  const themeNames = ["Cyberpunk Neon", "GameBoy Classic", "Osu! Magenta", "Matrix Rain"];
  let currentThemeIdx = 0;

  const themeBtn = document.getElementById("theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.body.classList.remove(...themes);
      currentThemeIdx = (currentThemeIdx + 1) % themes.length;
      document.body.classList.add(themes[currentThemeIdx]);
      showToast(`[TEMA] Tema: ${themeNames[currentThemeIdx]}`);
    });
  }

  // Reloj en tiempo real y rotador de estados de actividad
  const timeElem = document.getElementById("live-time");
  const statusElem = document.getElementById("live-status-text");
  const statuses = [
    "Jugando FluXis",
    "Escuchando Música",
    "Cebando Mates 🧉",
    "Programando Joako.Web",
    "Jugando Osu!"
  ];

  function updateClock() {
    if (timeElem) {
      const now = new Date();
      timeElem.textContent = now.toLocaleTimeString();
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  setInterval(() => {
    if (statusElem) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      statusElem.textContent = randomStatus;
    }
  }, 12000);


  // ==========================================================================
  // 4. MOTOR DE LLUVIA DE CÓDIGO MATRIX EN CANVAS
  // ==========================================================================
  const matrixCanvas = document.getElementById("matrix-canvas");
  if (matrixCanvas) {
    const mCtx = matrixCanvas.getContext("2d");
    let mWidth = matrixCanvas.width = window.innerWidth;
    let mHeight = matrixCanvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      mWidth = matrixCanvas.width = window.innerWidth;
      mHeight = matrixCanvas.height = window.innerHeight;
    });

    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZJOAKO";
    const fontSize = 14;
    const columns = Math.floor(mWidth / fontSize);
    const drops = Array(columns).fill(1);

    function drawMatrix() {
      if (!document.body.classList.contains("theme-matrix")) {
        requestAnimationFrame(drawMatrix);
        return;
      }

      mCtx.fillStyle = "rgba(0, 10, 2, 0.08)";
      mCtx.fillRect(0, 0, mWidth, mHeight);

      mCtx.fillStyle = "#00ff66";
      mCtx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        mCtx.fillText(text, x, y);

        if (y > mHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      requestAnimationFrame(drawMatrix);
    }
    drawMatrix();
  }


  // ==========================================================================
  // 5. MOTOR DE CANVAS DE PARTICULAS Y ESTRELLAS EN SEGUNDO PLANO
  // ==========================================================================
  const bgCanvas = document.getElementById("bg-canvas");
  if (bgCanvas) {
    const bgCtx = bgCanvas.getContext("2d");
    let width = bgCanvas.width = window.innerWidth;
    let height = bgCanvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      width = bgCanvas.width = window.innerWidth;
      height = bgCanvas.height = window.innerHeight;
    });

    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        color: Math.random() > 0.4 ? "#a1ffdb" : "#fff2a1"
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function renderBg() {
      bgCtx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Efecto de repulsión sutil con el puntero
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const angle = Math.atan2(dy, dx);
          p.x += Math.cos(angle) * 1.2;
          p.y += Math.sin(angle) * 1.2;
        }

        p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.005;
        p.opacity = Math.max(0.2, Math.min(0.9, p.opacity));

        bgCtx.fillStyle = p.color;
        bgCtx.globalAlpha = p.opacity;
        bgCtx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(p.size), Math.round(p.size));
      });

      bgCtx.globalAlpha = 1;
      requestAnimationFrame(renderBg);
    }
    renderBg();
  }


  // ==========================================================================
  // 6. MOTOR DE CONSOLA TERMINAL INTERACTIVA (JOAKOOS)
  // ==========================================================================
  const terminalModal = document.getElementById("terminal-modal");
  const terminalOpenBtn = document.getElementById("terminal-open-btn");
  const terminalCloseBtn = document.getElementById("terminal-close-btn");
  const terminalInput = document.getElementById("terminal-input");
  const terminalOutput = document.getElementById("terminal-output");

  function openTerminal() {
    if (terminalModal) {
      terminalModal.classList.remove("hidden");
      if (terminalInput) terminalInput.focus();
    }
  }

  function closeTerminal() {
    if (terminalModal) terminalModal.classList.add("hidden");
  }

  if (terminalOpenBtn) terminalOpenBtn.addEventListener("click", openTerminal);
  if (terminalCloseBtn) terminalCloseBtn.addEventListener("click", closeTerminal);

  /**
   * Imprime una línea de texto en el historial de la terminal.
   */
  function printTermLine(text, isCmd = false, isSystem = false) {
    if (!terminalOutput) return;
    const p = document.createElement("p");
    p.className = "term-line";
    if (isCmd) {
      p.innerHTML = `<span class="prompt">joako@web:~$</span> <span class="term-cmd">${text}</span>`;
    } else if (isSystem) {
      p.className += " system-text";
      p.textContent = text;
    } else {
      p.textContent = text;
    }
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  if (terminalInput) {
    terminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = terminalInput.value.trim().toLowerCase();
        if (!cmd) return;
        printTermLine(cmd, true);
        terminalInput.value = "";
        executeCommand(cmd);
      }
    });
  }

  /**
   * Analiza y ejecuta comandos ingresados en la consola.
   */
  function executeCommand(cmd) {
    const parts = cmd.split(" ");
    const mainCmd = parts[0];

    switch (mainCmd) {
      case "help":
        printTermLine("Comandos disponibles:", false, true);
        printTermLine("  help               - Muestra este menú de ayuda", false, true);
        printTermLine("  mate               - Ceba un mate inmediatamente", false, true);
        printTermLine("  play / pause       - Controla la música de fondo", false, true);
        printTermLine("  theme [nombre]     - Cambia el tema (cyberpunk, gameboy, osupink, matrix)", false, true);
        printTermLine("  stats              - Muestra estadísticas de tu sesión", false, true);
        printTermLine("  minigame           - Abre el mini-juego arcade", false, true);
        printTermLine("  secret             - Muestra la pista del secreto de la página", false, true);
        printTermLine("  clear / cls        - Limpia la consola", false, true);
        break;

      case "secret":
        printTermLine("Pista Secreta: Ingresa la secuencia retro ↑ ↑ ↓ ↓ ← → ← → B A para activar el Modo Super Joako.", false, true);
        break;

      case "mate":
        document.getElementById("cebar-mate-btn")?.click();
        printTermLine("🧉 ¡Mate cebado con éxito desde la terminal!", false, true);
        break;

      case "play":
        if (audio && audio.paused) togglePlay();
        printTermLine("Reproduciendo audio.", false, true);
        break;

      case "pause":
        if (audio && !audio.paused) togglePlay();
        printTermLine("Audio pausado.", false, true);
        break;

      case "theme":
        const targetTheme = parts[1];
        const idx = themes.indexOf(`theme-${targetTheme}`);
        if (idx !== -1) {
          document.body.classList.remove(...themes);
          document.body.classList.add(themes[idx]);
          currentThemeIdx = idx;
          printTermLine(`Tema cambiado a: ${themeNames[idx]}`, false, true);
        } else {
          printTermLine("Tema no válido. Usa: cyberpunk, gameboy, osupink o matrix", false, true);
        }
        break;

      case "stats":
        const seconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        const count = localStorage.getItem("joako_mate_count") || "0";
        printTermLine(`Tiempo de sesión: ${seconds} segundos`, false, true);
        printTermLine(`Mates cebados totales: ${count}`, false, true);
        printTermLine(`Clics totales en la página: ${totalClicks}`, false, true);
        break;

      case "minigame":
        openMinigame();
        printTermLine("Abriendo mini-juego arcade...", false, true);
        break;

      case "clear":
      case "cls":
        if (terminalOutput) terminalOutput.innerHTML = "";
        break;

      default:
        printTermLine(`Comando no reconocido: '${mainCmd}'. Escribe 'help' para ver la lista.`, false, true);
    }
  }


  // ==========================================================================
  // 7. MOTOR DEL MINI-JUEGO ARCADE EN CANVAS 2D
  // ==========================================================================
  const minigameModal = document.getElementById("minigame-modal");
  const minigameOpenBtn = document.getElementById("minigame-open-btn");
  const minigameCloseBtn = document.getElementById("minigame-close-btn");
  const startGameBtn = document.getElementById("start-game-btn");
  const gameOverlay = document.getElementById("game-start-overlay");

  const gameCanvas = document.getElementById("game-canvas");
  const gCtx = gameCanvas ? gameCanvas.getContext("2d") : null;

  const scoreElem = document.getElementById("game-score");
  const comboElem = document.getElementById("game-combo");
  const livesElem = document.getElementById("game-lives");
  const highscoreElem = document.getElementById("game-highscore");

  let gameLoopReq = null;
  let isGameRunning = false;
  let score = 0;
  let combo = 0;
  let lives = 3;
  let highscore = parseInt(localStorage.getItem("joako_game_highscore") || "0", 10);

  if (highscoreElem) highscoreElem.textContent = highscore;

  function openMinigame() {
    if (minigameModal) minigameModal.classList.remove("hidden");
  }

  function closeMinigame() {
    if (minigameModal) minigameModal.classList.add("hidden");
    isGameRunning = false;
    if (gameLoopReq) cancelAnimationFrame(gameLoopReq);
  }

  if (minigameOpenBtn) minigameOpenBtn.addEventListener("click", openMinigame);
  if (minigameCloseBtn) minigameCloseBtn.addEventListener("click", closeMinigame);

  const paddle = { x: 200, width: 80, height: 14 };
  let items = [];

  if (gameCanvas) {
    gameCanvas.addEventListener("mousemove", (e) => {
      const rect = gameCanvas.getBoundingClientRect();
      paddle.x = e.clientX - rect.left - paddle.width / 2;
    });
  }

  function startGame() {
    if (gameOverlay) gameOverlay.style.display = "none";
    score = 0;
    combo = 0;
    lives = 3;
    items = [];
    isGameRunning = true;
    updateGameHUD();
    gameLoop();
  }

  if (startGameBtn) startGameBtn.addEventListener("click", startGame);

  function updateGameHUD() {
    if (scoreElem) scoreElem.textContent = score;
    if (comboElem) comboElem.textContent = `${combo}x`;
    if (livesElem) livesElem.textContent = "[I]".repeat(lives);
    if (highscoreElem) highscoreElem.textContent = highscore;
  }

  /**
   * Bucle principal del mini-juego corriendo a 60 FPS.
   */
  function gameLoop() {
    if (!isGameRunning || !gCtx || !gameCanvas) return;

    const w = gameCanvas.width;
    const h = gameCanvas.height;

    gCtx.clearRect(0, 0, w, h);

    paddle.x = Math.max(0, Math.min(w - paddle.width, paddle.x));

    // Dibujar la cesta/plataforma del jugador
    gCtx.fillStyle = "#a1ffdb";
    gCtx.fillRect(paddle.x, h - 20, paddle.width, paddle.height);
    gCtx.fillStyle = "#fff2a1";
    gCtx.fillRect(paddle.x + 4, h - 18, paddle.width - 8, 4);

    // Generar elementos que caen (ÚNICAMENTE EMOJI DE MATE O CARACTERES ASCII)
    if (Math.random() < 0.04) {
      const types = [
        { symbol: "🧉", type: "mate", pts: 15, color: "#a1ffdb" },
        { symbol: "(O)", type: "osu", pts: 10, color: "#ff7ebb" },
        { symbol: "[+]", type: "power", pts: 20, color: "#fff2a1" }
      ];
      const target = types[Math.floor(Math.random() * types.length)];

      items.push({
        x: Math.random() * (w - 30) + 15,
        y: -20,
        speed: 2.5 + Math.random() * 2,
        ...target
      });
    }

    // Actualizar posicion y verificar colisiones
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.y += item.speed;

      gCtx.font = "20px 'Pixelify Sans', sans-serif";
      gCtx.fillStyle = item.color;
      gCtx.fillText(item.symbol, item.x - 10, item.y);

      // Verificacion de colision con la cesta
      if (item.y >= h - 30 && item.y <= h - 10) {
        if (item.x >= paddle.x && item.x <= paddle.x + paddle.width) {
          combo++;
          score += item.pts * (1 + Math.floor(combo / 5) * 0.5);
          playTone(400 + combo * 30, 0.08, "sine", 0.15);
          items.splice(i, 1);
          updateGameHUD();
          continue;
        }
      }

      // Si el elemento cae al fondo sin ser atrapado
      if (item.y > h) {
        items.splice(i, 1);
        combo = 0;
        lives--;
        playTone(150, 0.15, "sawtooth", 0.2);
        updateGameHUD();

        if (lives <= 0) {
          endGame();
          return;
        }
      }
    }

    gameLoopReq = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    isGameRunning = false;
    if (score > highscore) {
      highscore = Math.floor(score);
      localStorage.setItem("joako_game_highscore", highscore.toString());
      playVictorySound();
      showToast(`[RECORD] NUEVO RECORD ARCADE: ${highscore} PTS!`);
    }

    if (gameOverlay) {
      gameOverlay.style.display = "flex";
      gameOverlay.querySelector("h3").textContent = `¡Game Over! Puntuación: ${Math.floor(score)}`;
      gameOverlay.querySelector("p").textContent = `Récord guardado: ${highscore} pts. ¡Inténtalo de nuevo!`;
    }
  }


  // ==========================================================================
  // 8. PERSPECTIVA 3D TILT EN TARJETAS Y REVELACION EN SCROLL
  // ==========================================================================
  const cards = document.querySelectorAll(".card-item");
  cards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });

  const listItems = document.querySelectorAll(".card-item");
  const revealOnScroll = () => {
    const trigger = window.innerHeight * 0.9;
    listItems.forEach((item) => {
      if (item.getBoundingClientRect().top < trigger) {
        item.classList.add("reveal");
        item.classList.remove("hidden");
      }
    });
  };
  listItems.forEach((item) => item.classList.add("hidden"));
  revealOnScroll();
  window.addEventListener("scroll", revealOnScroll, { passive: true });


  // ==========================================================================
  // 9. WIDGET INTERACTIVO DE MATE 🧉
  // ==========================================================================
  const mateBtn = document.getElementById("cebar-mate-btn");
  const mateCountElem = document.getElementById("mate-count");
  const steamContainer = document.getElementById("steam-container");

  let mateCount = parseInt(localStorage.getItem("joako_mate_count") || "0", 10);
  if (mateCountElem) mateCountElem.textContent = mateCount;

  if (mateBtn) {
    mateBtn.addEventListener("click", () => {
      mateCount++;
      if (mateCountElem) mateCountElem.textContent = mateCount;
      localStorage.setItem("joako_mate_count", mateCount.toString());

      playMateSound();

      if (steamContainer) {
        for (let i = 0; i < 4; i++) {
          const particle = document.createElement("div");
          particle.className = "steam-particle";
          particle.style.setProperty("--rand", (Math.random() - 0.5).toString());
          particle.style.left = `${20 + Math.random() * 40}px`;
          steamContainer.appendChild(particle);
          setTimeout(() => particle.remove(), 1500);
        }
      }

      const mateMessages = [
        "🧉 ¡Mate amargo cebado con éxito!",
        "🧉 +10 de energía para jugar Osu!",
        "🧉 Mate calentito listo.",
        "🧉 Joako ha recuperado energía.",
        "🧉 ¡Un buen mate argentino!"
      ];
      const msg = mateMessages[Math.floor(Math.random() * mateMessages.length)];
      showToast(`${msg} (Total: ${mateCount})`);
    });
  }


  // ==========================================================================
  // 10. EASTER EGG CÓDIGO KONAMI Y ATAJOS DE TECLADO
  // ==========================================================================
  const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konamiIndex = 0;

  document.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const requiredKey = konamiCode[konamiIndex].length === 1 ? konamiCode[konamiIndex].toLowerCase() : konamiCode[konamiIndex];

    if (key === requiredKey) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        document.body.classList.toggle("super-joako-mode");
        playVictorySound();
        showToast("[KONAMI] CODIGO KONAMI ACTIVADO: MODO SUPER JOAKO");
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }

    if (event.key.toLowerCase() === "t" && event.target.tagName !== "INPUT") {
      openTerminal();
    } else if (event.key.toLowerCase() === "m" && event.target.tagName !== "INPUT") {
      toggleMute();
    } else if (event.code === "Space" && event.target.tagName !== "BUTTON" && event.target.tagName !== "INPUT") {
      event.preventDefault();
      togglePlay();
    }
  });


  // ==========================================================================
  // 11. SISTEMA DE NOTIFICACIONES EMERGENES (TOASTS)
  // ==========================================================================
  function showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast-exit");
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
});
