/* ===============================================
   PROJECT DATA STORE
   ===============================================
*/
const myProjects = [
    {
        id: 0,
        title: "Neon Pong: Cyber Edition",
        description: "A retro-futuristic Pong game with neon visuals, particle effects, and screen shake.",
        icon: "fa-table-tennis",
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        isFullPage: false,
        html: `
            <div id="game-container">
                <canvas id="gameCanvas"></canvas>
                <div id="score-board" class="hidden">
                    <div id="player-score">0</div>
                    <div id="computer-score">0</div>
                </div>
                <div id="ui-layer">
                    <div id="main-menu" class="menu-screen">
                        <h1>Neon Pong</h1>
                        <p>Select Difficulty</p>
                        <div class="btn-group">
                            <button onclick="startGame('easy')" style="border-color: #00ff00;">Easy</button>
                            <button onclick="startGame('medium')" style="border-color: #ffff00;">Medium</button>
                            <button onclick="startGame('hard')" style="border-color: #ff0000;">Hard</button>
                        </div>
                        <div class="controls-hint">Use Mouse or Touch to move paddle</div>
                    </div>
                    <div id="game-over" class="menu-screen hidden">
                        <h1 id="winner-text">You Win!</h1>
                        <h2 id="final-score">5 - 3</h2>
                        <div class="btn-group">
                            <button onclick="returnToMenu()">Main Menu</button>
                            <button onclick="restartGame()">Play Again</button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        css: `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
            :root { --neon-blue: #00f3ff; --neon-pink: #ff00ff; --neon-green: #00ff00; --bg-color: #050505; }
            body { margin: 0; padding: 0; background-color: var(--bg-color); overflow: hidden; font-family: 'Orbitron', sans-serif; color: white; touch-action: none; user-select: none; }
            #game-container { position: relative; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
            canvas { box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); border: 2px solid #333; background: radial-gradient(circle at center, #111 0%, #000 100%); }
            #ui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
            .menu-screen { background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(5px); padding: 40px; border: 2px solid var(--neon-blue); box-shadow: 0 0 30px var(--neon-blue); border-radius: 10px; text-align: center; pointer-events: auto; transition: opacity 0.3s; }
            h1 { font-size: 3rem; margin: 0 0 20px 0; text-transform: uppercase; color: #fff; text-shadow: 0 0 10px var(--neon-blue), 0 0 20px var(--neon-blue); letter-spacing: 5px; }
            h2 { font-size: 1.5rem; color: var(--neon-pink); text-shadow: 0 0 10px var(--neon-pink); }
            .btn-group { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
            button { background: transparent; color: white; font-family: 'Orbitron', sans-serif; font-size: 1.2rem; padding: 15px 30px; border: 2px solid var(--neon-green); cursor: pointer; text-transform: uppercase; transition: all 0.2s; position: relative; overflow: hidden; }
            button:hover { background: var(--neon-green); color: black; box-shadow: 0 0 20px var(--neon-green); }
            button:active { transform: scale(0.95); }
            .hidden { opacity: 0; pointer-events: none; display: none; }
            #score-board { position: absolute; top: 20px; width: 100%; display: flex; justify-content: center; gap: 100px; font-size: 4rem; font-weight: 900; pointer-events: none; opacity: 0.5; z-index: 5; }
            #player-score { color: var(--neon-blue); text-shadow: 0 0 20px var(--neon-blue); }
            #computer-score { color: var(--neon-pink); text-shadow: 0 0 20px var(--neon-pink); }
            .controls-hint { margin-top: 20px; font-size: 0.8rem; color: #aaa; }
            @media (max-width: 768px) { h1 { font-size: 2rem; } #score-board { font-size: 2.5rem; gap: 50px; } .menu-screen { padding: 20px; width: 80%; } }
        `,
        js: `
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const STATE = { MENU: 0, PLAYING: 1, GAMEOVER: 2 };
            let gameState = STATE.MENU;
            let lastTime = 0;
            let difficulty = 'medium';
            let audioCtx;
            const ball = { x: 0, y: 0, radius: 8, speed: 0, dx: 0, dy: 0, color: '#fff', maxSpeed: 0 };
            const paddleWidth = 15;
            const paddleHeight = 100;
            const paddleOffset = 20;
            const player = { x: 0, y: 0, width: paddleWidth, height: paddleHeight, score: 0, color: '#00f3ff' };
            const computer = { x: 0, y: 0, width: paddleWidth, height: paddleHeight, score: 0, color: '#ff00ff', speed: 0, targetY: 0 };
            let particles = [];
            let screenShake = 0;
            function initAudio() { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } }
            function playSound(type) {
                if (!audioCtx) return;
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                const now = audioCtx.currentTime;
                if (type === 'hit') {
                    osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                    gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1);
                } else if (type === 'wall') {
                    osc.type = 'sine'; osc.frequency.setValueAtTime(200, now);
                    gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1);
                } else if (type === 'score') {
                    osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(600, now + 0.2);
                    gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.4); osc.start(now); osc.stop(now + 0.4);
                }
            }
            function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; resetPositions(); }
            function resetPositions() {
                player.x = paddleOffset; player.y = canvas.height / 2 - paddleHeight / 2;
                computer.x = canvas.width - paddleWidth - paddleOffset; computer.y = canvas.height / 2 - paddleHeight / 2;
                resetBall();
            }
            function resetBall() {
                ball.x = canvas.width / 2; ball.y = canvas.height / 2;
                const dirX = Math.random() > 0.5 ? 1 : -1; const dirY = (Math.random() * 2 - 1);
                let baseSpeed = 0;
                if (difficulty === 'easy') baseSpeed = 7; if (difficulty === 'medium') baseSpeed = 10; if (difficulty === 'hard') baseSpeed = 14;
                ball.speed = baseSpeed; ball.maxSpeed = baseSpeed * 2;
                const len = Math.sqrt(dirX*dirX + dirY*dirY);
                ball.dx = (dirX / len) * ball.speed; ball.dy = (dirY / len) * ball.speed;
            }
            window.startGame = function(diff) {
                initAudio(); difficulty = diff;
                if (difficulty === 'easy') computer.speed = 4; if (difficulty === 'medium') computer.speed = 9; if (difficulty === 'hard') computer.speed = 18;
                player.score = 0; computer.score = 0; updateScoreUI();
                document.getElementById('main-menu').classList.add('hidden'); document.getElementById('game-over').classList.add('hidden'); document.getElementById('score-board').classList.remove('hidden');
                resize(); gameState = STATE.PLAYING; lastTime = performance.now(); requestAnimationFrame(loop);
            }
            function update(dt) {
                if (gameState !== STATE.PLAYING) return;
                ball.x += ball.dx; ball.y += ball.dy;
                if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
                    ball.dy *= -1; ball.y = ball.y < 0 ? ball.radius : canvas.height - ball.radius;
                    createParticles(ball.x, ball.y, '#fff'); playSound('wall'); triggerShake(5);
                }
                function checkPaddleCollision(paddle) {
                    return ball.x - ball.radius < paddle.x + paddle.width && ball.x + ball.radius > paddle.x && ball.y + ball.radius > paddle.y && ball.y - ball.radius < paddle.y + paddle.height;
                }
                let hitPaddle = null;
                if (checkPaddleCollision(player)) hitPaddle = player;
                if (checkPaddleCollision(computer)) hitPaddle = computer;
                if (hitPaddle) {
                    ball.dx *= -1;
                    const currentSpeed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy);
                    if (currentSpeed < ball.maxSpeed) { ball.dx *= 1.05; ball.dy *= 1.05; }
                    const centerPaddle = hitPaddle.y + hitPaddle.height / 2;
                    const hitPoint = ball.y - centerPaddle;
                    const normalizedHit = hitPoint / (hitPaddle.height / 2);
                    ball.dy = normalizedHit * (Math.abs(ball.dx) * 0.8);
                    if (hitPaddle === player) ball.x = player.x + player.width + ball.radius; else ball.x = computer.x - ball.radius;
                    createParticles(ball.x, ball.y, hitPaddle.color); playSound('hit'); triggerShake(8);
                }
                let targetY = ball.y - computer.height / 2;
                if (difficulty === 'easy' && Math.abs(ball.dx) > 0 && ball.dx < 0) { targetY = canvas.height/2 - computer.height/2; }
                const distance = targetY - computer.y;
                if (Math.abs(distance) > computer.speed) { computer.y += Math.sign(distance) * computer.speed; } else { computer.y = targetY; }
                computer.y = Math.max(0, Math.min(canvas.height - computer.height, computer.y));
                player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
                if (ball.x < 0) { computer.score++; handleScore(computer.color); } else if (ball.x > canvas.width) { player.score++; handleScore(player.color); }
            }
            function handleScore(color) {
                playSound('score'); createParticles(ball.x, ball.y, color, 30); updateScoreUI(); triggerShake(15);
                if (player.score >= 5 || computer.score >= 5) { endGame(); } else { resetBall(); }
            }
            function endGame() {
                gameState = STATE.GAMEOVER;
                document.getElementById('score-board').classList.add('hidden'); document.getElementById('game-over').classList.remove('hidden');
                const winnerText = document.getElementById('winner-text'); const finalScore = document.getElementById('final-score');
                if (player.score > computer.score) { winnerText.innerText = "VICTORY!"; winnerText.style.color = "var(--neon-green)"; } else { winnerText.innerText = "DEFEAT"; winnerText.style.color = "red"; }
                finalScore.innerText = player.score + " - " + computer.score;
            }
            function updateScoreUI() { document.getElementById('player-score').innerText = player.score; document.getElementById('computer-score').innerText = computer.score; }
            window.returnToMenu = function() { document.getElementById('game-over').classList.add('hidden'); document.getElementById('main-menu').classList.remove('hidden'); gameState = STATE.MENU; }
            window.restartGame = function() { startGame(difficulty); }
            function createParticles(x, y, color, count = 10) {
                for (let i = 0; i < count; i++) { particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1.0, color: color, size: Math.random() * 3 + 1 }); }
            }
            function updateParticles() {
                for (let i = particles.length - 1; i >= 0; i--) {
                    let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.size *= 0.95;
                    if (p.life <= 0) { particles.splice(i, 1); }
                }
            }
            function triggerShake(intensity) { screenShake = intensity; }
            function draw() {
                let shakeX = 0; let shakeY = 0;
                if (screenShake > 0) { shakeX = (Math.random() - 0.5) * screenShake; shakeY = (Math.random() - 0.5) * screenShake; screenShake *= 0.9; if (screenShake < 0.5) screenShake = 0; }
                ctx.save(); ctx.translate(shakeX, shakeY);
                ctx.fillStyle = 'rgba(5, 5, 5, 0.4)'; ctx.fillRect(-shakeX, -shakeY, canvas.width + 50, canvas.height + 50);
                ctx.strokeStyle = '#333'; ctx.setLineDash([10, 15]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke(); ctx.setLineDash([]);
                const drawGlow = (color, blur) => { ctx.shadowBlur = blur; ctx.shadowColor = color; };
                ctx.fillStyle = player.color; drawGlow(player.color, 20); ctx.fillRect(player.x, player.y, player.width, player.height);
                ctx.fillStyle = computer.color; drawGlow(computer.color, 20); ctx.fillRect(computer.x, computer.y, computer.width, computer.height);
                ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fillStyle = ball.color; drawGlow(ball.color, 15); ctx.fill(); ctx.closePath();
                particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; drawGlow(p.color, 10); ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });
                ctx.globalAlpha = 1.0; ctx.shadowBlur = 0; ctx.restore();
            }
            function loop(timestamp) { if (gameState === STATE.PLAYING) { const dt = timestamp - lastTime; lastTime = timestamp; update(dt); updateParticles(); draw(); requestAnimationFrame(loop); } }
            function movePaddle(y) { player.y = y - player.height / 2; if (player.y < 0) player.y = 0; if (player.y + player.height > canvas.height) player.y = canvas.height - player.height; }
            window.addEventListener('mousemove', (e) => { if (gameState === STATE.PLAYING) { const rect = canvas.getBoundingClientRect(); const mouseY = e.clientY - rect.top; movePaddle(mouseY); } });
            window.addEventListener('touchmove', (e) => { if (gameState === STATE.PLAYING) { e.preventDefault(); const rect = canvas.getBoundingClientRect(); const touchY = e.touches[0].clientY - rect.top; movePaddle(touchY); } }, { passive: false });
            window.addEventListener('resize', resize);
            resize();
        `
    },
    {
        id: 1,
        title: "TypeSpeed",
        description: "An advanced typing speed test to measure WPM and accuracy.",
        icon: "fa-keyboard",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        isFullPage: false,
        html: `
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <div class="container">
                <div class="card">
                    <div class="header">
                        <h1><span class="material-icons" style="font-size: 2.5rem;">keyboard</span>TypeSpeed</h1>
                        <p>Test your typing speed and accuracy</p>
                    </div>
                    <div class="content">
                        <div class="stats-container">
                            <div class="stat-card"><div class="stat-label">WPM</div><div class="stat-value" id="wpm">0</div></div>
                            <div class="stat-card"><div class="stat-label">Accuracy</div><div class="stat-value" id="accuracy">100%</div></div>
                            <div class="stat-card"><div class="stat-label">Errors</div><div class="stat-value" id="errors">0</div></div>
                            <div class="stat-card"><div class="stat-label">Time</div><div class="stat-value" id="time">0s</div></div>
                        </div>
                        <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
                        <div class="controls">
                            <button class="btn btn-primary" id="startBtn"><span class="material-icons">play_arrow</span>Start Test</button>
                            <button class="btn btn-secondary" id="resetBtn"><span class="material-icons">refresh</span>Reset</button>
                            <div class="difficulty-selector">
                                <button class="difficulty-btn active" data-level="easy">Easy</button>
                                <button class="difficulty-btn" data-level="medium">Medium</button>
                                <button class="difficulty-btn" data-level="hard">Hard</button>
                            </div>
                        </div>
                        <div class="text-display" id="textDisplay">Click "Start Test" to begin typing...</div>
                        <input type="text" class="input-area" id="inputArea" placeholder="Start typing here..." disabled>
                    </div>
                </div>
            </div>
            <div class="results-modal" id="resultsModal">
                <div class="results-content">
                    <div class="results-header"><h2>🎉 Test Complete!</h2></div>
                    <div class="results-stats">
                        <div class="result-item"><span class="result-label">Words Per Minute</span><span class="result-value" id="finalWpm">0</span></div>
                        <div class="result-item"><span class="result-label">Accuracy</span><span class="result-value" id="finalAccuracy">0%</span></div>
                        <div class="result-item"><span class="result-label">Total Time</span><span class="result-value" id="finalTime">0s</span></div>
                        <div class="result-item"><span class="result-label">Characters</span><span class="result-value" id="finalChars">0</span></div>
                        <div class="result-item"><span class="result-label">Errors</span><span class="result-value" id="finalErrors">0</span></div>
                    </div>
                    <button class="btn btn-primary" id="tryAgainBtn" style="width: 100%; justify-content: center;"><span class="material-icons">replay</span>Try Again</button>
                </div>
            </div>
        `,
        css: `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Roboto', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
            .container { width: 100%; max-width: 900px; }
            .card { background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); overflow: hidden; animation: slideUp 0.5s ease-out; }
            @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 10px; }
            .header p { font-size: 1rem; opacity: 0.9; }
            .content { padding: 30px; }
            .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px; }
            .stat-card { background: #f5f5f5; padding: 20px; border-radius: 12px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; }
            .stat-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
            .stat-label { font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
            .stat-value { font-size: 2rem; font-weight: 700; color: #667eea; }
            .controls { display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap; align-items: center; }
            .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.5px; }
            .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5); }
            .btn-secondary { background: #f5f5f5; color: #333; }
            .btn-secondary:hover { background: #e0e0e0; }
            .btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .difficulty-selector { display: flex; gap: 10px; flex-wrap: wrap; }
            .difficulty-btn { padding: 8px 16px; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 20px; cursor: pointer; transition: all 0.3s; font-weight: 500; }
            .difficulty-btn.active { background: #667eea; color: white; }
            .progress-bar { width: 100%; height: 6px; background: #e0e0e0; border-radius: 3px; margin-bottom: 20px; overflow: hidden; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); width: 0%; transition: width 0.3s; }
            .text-display { background: #f9f9f9; padding: 30px; border-radius: 12px; font-size: 1.5rem; line-height: 2.2; margin-bottom: 20px; border: 2px solid #e0e0e0; min-height: 200px; user-select: none; }
            .text-display.active { border-color: #667eea; background: white; }
            .char { position: relative; transition: all 0.1s; }
            .char.correct { color: #4caf50; }
            .char.incorrect { color: #f44336; background: #ffebee; }
            .char.current { background: #667eea; color: white; border-radius: 3px; animation: blink 1s infinite; }
            @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.5; } }
            .input-area { width: 100%; padding: 15px; font-size: 1.2rem; border: 2px solid #e0e0e0; border-radius: 8px; font-family: 'Roboto', sans-serif; transition: border-color 0.3s; }
            .input-area:focus { outline: none; border-color: #667eea; }
            .results-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 1000; justify-content: center; align-items: center; padding: 20px; }
            .results-modal.show { display: flex; animation: fadeIn 0.3s; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .results-content { background: white; border-radius: 16px; padding: 40px; max-width: 500px; width: 100%; animation: scaleIn 0.3s; }
            @keyframes scaleIn { from { transform: scale(0.9); } to { transform: scale(1); } }
            .results-header { text-align: center; margin-bottom: 30px; }
            .results-header h2 { font-size: 2rem; color: #333; margin-bottom: 10px; }
            .results-stats { display: grid; gap: 20px; margin-bottom: 30px; }
            .result-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .result-label { font-size: 1rem; color: #666; }
            .result-value { font-size: 1.5rem; font-weight: 700; color: #667eea; }
            .timer-display { font-size: 1.2rem; font-weight: 500; color: #333; padding: 10px 20px; background: #f5f5f5; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; }
            @media (max-width: 768px) { .header h1 { font-size: 2rem; } .text-display { font-size: 1.2rem; padding: 20px; } .stats-container { grid-template-columns: repeat(2, 1fr); } .stat-value { font-size: 1.5rem; } .controls { flex-direction: column; width: 100%; } .btn { width: 100%; justify-content: center; } .results-content { padding: 25px; } }
            @media (max-width: 480px) { .stats-container { grid-template-columns: 1fr; } .header h1 { font-size: 1.5rem; } .text-display { font-size: 1rem; } }
            .material-icons { font-size: inherit; }
        `,
        js: `
            const textSamples = {
                easy: [ "The quick brown fox jumps over the lazy dog.", "A journey of a thousand miles begins with a single step.", "Birds sing sweetly in the morning light.", "Keep working hard and you will improve." ],
                medium: [ "Technology has revolutionized the way we communicate.", "The ability to type efficiently is an essential skill.", "Regular practice and dedication are key to developing any new skill.", "Curiosity drives innovation and personal growth." ],
                hard: [ "Quantum mechanics fundamentally challenges our classical understanding of physics.", "Cryptographic algorithms employ sophisticated principles to ensure data security.", "The implementation of machine learning algorithms requires careful consideration.", "Philosophical discourse concerning epistemology examines human knowledge." ]
            };
            let currentText = ''; let userInput = ''; let startTime = null; let timerInterval = null; let currentDifficulty = 'easy';
            let totalCharacters = 0; let correctCharacters = 0; let incorrectCharacters = 0; let isTestActive = false;
            const elements = { textDisplay: document.getElementById('textDisplay'), inputArea: document.getElementById('inputArea'), startBtn: document.getElementById('startBtn'), resetBtn: document.getElementById('resetBtn'), wpm: document.getElementById('wpm'), accuracy: document.getElementById('accuracy'), errors: document.getElementById('errors'), time: document.getElementById('time'), progressFill: document.getElementById('progressFill'), resultsModal: document.getElementById('resultsModal'), finalWpm: document.getElementById('finalWpm'), finalAccuracy: document.getElementById('finalAccuracy'), finalTime: document.getElementById('finalTime'), finalChars: document.getElementById('finalChars'), finalErrors: document.getElementById('finalErrors'), tryAgainBtn: document.getElementById('tryAgainBtn') };
            document.querySelectorAll('.difficulty-btn').forEach(btn => { btn.addEventListener('click', () => { if (isTestActive) return; document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentDifficulty = btn.dataset.level; }); });
            elements.startBtn.addEventListener('click', startTest);
            elements.resetBtn.addEventListener('click', resetTest);
            elements.tryAgainBtn.addEventListener('click', () => { elements.resultsModal.classList.remove('show'); resetTest(); });
            elements.inputArea.addEventListener('input', handleInput);
            function startTest() {
                resetTest(); isTestActive = true; currentText = textSamples[currentDifficulty][Math.floor(Math.random() * textSamples[currentDifficulty].length)];
                displayText(); elements.inputArea.disabled = false; elements.inputArea.focus(); elements.textDisplay.classList.add('active'); elements.startBtn.disabled = true; startTime = Date.now(); timerInterval = setInterval(updateTimer, 100);
            }
            function resetTest() {
                isTestActive = false; clearInterval(timerInterval); userInput = ''; currentText = ''; startTime = null; totalCharacters = 0; correctCharacters = 0; incorrectCharacters = 0;
                elements.inputArea.value = ''; elements.inputArea.disabled = true; elements.textDisplay.classList.remove('active'); elements.textDisplay.innerHTML = 'Click "Start Test" to begin typing...'; elements.startBtn.disabled = false; updateStats(); elements.progressFill.style.width = '0%';
            }
            function handleInput(e) {
                if (!isTestActive) return;
                userInput = e.target.value; displayText(); calculateStats(); updateStats();
                if (userInput.length === currentText.length) { finishTest(); }
            }
            function displayText() {
                let html = '';
                for (let i = 0; i < currentText.length; i++) {
                    let className = '';
                    if (i < userInput.length) { if (userInput[i] === currentText[i]) { className = 'correct'; } else { className = 'incorrect'; } } else if (i === userInput.length) { className = 'current'; }
                    html += '<span class="char ' + className + '">' + currentText[i] + '</span>';
                }
                elements.textDisplay.innerHTML = html;
                const progress = (userInput.length / currentText.length) * 100; elements.progressFill.style.width = progress + '%';
            }
            function calculateStats() { correctCharacters = 0; incorrectCharacters = 0; for (let i = 0; i < userInput.length; i++) { if (userInput[i] === currentText[i]) { correctCharacters++; } else { incorrectCharacters++; } } totalCharacters = userInput.length; }
            function updateStats() {
                const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0; const minutes = elapsed / 60; const wordsTyped = correctCharacters / 5; const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
                const accuracy = totalCharacters > 0 ? Math.round((correctCharacters / totalCharacters) * 100) : 100;
                elements.wpm.textContent = wpm; elements.accuracy.textContent = accuracy + '%'; elements.errors.textContent = incorrectCharacters; elements.time.textContent = Math.round(elapsed) + 's';
            }
            function updateTimer() { if (!startTime) return; const elapsed = (Date.now() - startTime) / 1000; elements.time.textContent = Math.round(elapsed) + 's'; }
            function finishTest() {
                isTestActive = false; clearInterval(timerInterval); elements.inputArea.disabled = true; elements.textDisplay.classList.remove('active');
                const elapsed = (Date.now() - startTime) / 1000; const minutes = elapsed / 60; const wordsTyped = correctCharacters / 5; const wpm = Math.round(wordsTyped / minutes); const accuracy = Math.round((correctCharacters / totalCharacters) * 100);
                elements.finalWpm.textContent = wpm; elements.finalAccuracy.textContent = accuracy + '%'; elements.finalTime.textContent = Math.round(elapsed) + 's'; elements.finalChars.textContent = totalCharacters; elements.finalErrors.textContent = incorrectCharacters;
                elements.resultsModal.classList.add('show');
            }
            elements.resultsModal.addEventListener('click', (e) => { if (e.target === elements.resultsModal) { elements.resultsModal.classList.remove('show'); } });
        `
    },
    {
        id: 4,
        title: "Vid2Wav Extractor",
        description: "Extract high-quality WAV audio from video files locally using your browser API.",
        icon: "fa-file-audio",
        color: "text-purple-400",
        bg: "bg-purple-900/20",
        isFullPage: true,
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Video to Audio Extractor</title><script src="https://cdn.tailwindcss.com"></script><script src="https://unpkg.com/lucide@latest"></script><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');body{font-family:'Inter',sans-serif;background-color:#0f172a;color:#e2e8f0}.glass-panel{background:rgba(30,41,59,.7);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.1)}.gradient-text{background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.loader{width:20px;height:20px;border:3px solid #fff;border-bottom-color:transparent;border-radius:50%;display:inline-block;box-sizing:border-box;animation:rotation 1s linear infinite}@keyframes rotation{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}</style></head><body class="min-h-screen flex flex-col items-center justify-center p-4"><header class="w-full max-w-2xl flex justify-between items-center mb-8"><div class="flex items-center gap-3"><div class="p-2 bg-purple-600 rounded-lg"><i data-lucide="music" class="text-white"></i></div><h1 class="text-2xl font-bold tracking-tight">Vid<span class="gradient-text">2Wav</span></h1></div><div class="text-sm text-slate-400 hidden sm:block">Fast Processing • No Playback</div></header><main class="w-full max-w-2xl glass-panel rounded-2xl shadow-2xl overflow-hidden relative p-8"><div class="space-y-8"><div class="space-y-4"><label class="block text-sm font-medium text-slate-300">Select Video Source</label><div class="relative group"><input type="file" id="video-file" accept="video/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"><div id="drop-zone" class="border-2 border-dashed border-slate-600 rounded-xl p-10 text-center group-hover:border-purple-500 group-hover:bg-slate-800/50 transition-all cursor-pointer"><div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-900/30 transition-colors"><i data-lucide="upload-cloud" class="h-8 w-8 text-slate-400 group-hover:text-purple-400"></i></div><h3 class="text-lg font-semibold text-slate-200 mb-1">Click to upload video</h3><p id="filename" class="text-sm text-slate-400 truncate max-w-[300px] mx-auto">Supports MP4, WebM, MOV, etc.</p></div></div></div><div id="status-area" class="hidden bg-slate-800/50 rounded-lg p-4 border border-slate-700"><div class="flex justify-between items-center mb-2"><span id="status-text" class="text-sm font-medium text-slate-300">Processing...</span> <span id="status-percent" class="text-xs text-purple-400">0%</span></div><div class="w-full bg-slate-700 rounded-full h-2"><div id="progress-bar" class="bg-purple-600 h-2 rounded-full transition-all duration-300" style="width:0%"></div></div></div><button id="btn-convert" disabled class="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white shadow-lg shadow-purple-900/20 transition-all flex justify-center items-center gap-3"><span>Start Conversion</span></button><p class="text-center text-xs text-slate-500">Processed locally. No data leaves your device. Large files may take longer to decode.</p></div></main><div id="download-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4"><div class="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 transition-all animate-[fadeIn_0.2s_ease-out]"><div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><i data-lucide="check" class="w-8 h-8 text-green-500"></i></div><h2 class="text-xl font-bold text-white mb-2">Success!</h2><p class="text-slate-400 mb-6 text-sm">Audio extracted successfully.</p><a id="download-link" href="#" download class="block w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold mb-3">Download .WAV</a> <button onclick="closeModal()" class="text-slate-400 hover:text-white text-sm">Convert Another</button></div></div><script>lucide.createIcons();const fileInput=document.getElementById("video-file"),dropZone=document.getElementById("drop-zone"),filenameDisplay=document.getElementById("filename"),btnConvert=document.getElementById("btn-convert"),statusArea=document.getElementById("status-area"),statusText=document.getElementById("status-text"),progressBar=document.getElementById("progress-bar"),modal=document.getElementById("download-modal"),downloadLink=document.getElementById("download-link");let selectedFile=null,audioCtx=null;fileInput.addEventListener("change",(e=>{e.target.files[0]&&(selectedFile=e.target.files[0],filenameDisplay.textContent=selectedFile.name,filenameDisplay.classList.add("text-purple-300"),dropZone.classList.add("border-purple-500","bg-slate-800/30"),btnConvert.disabled=!1,statusArea.classList.add("hidden"))})),btnConvert.addEventListener("click",(async()=>{if(!selectedFile)return;btnConvert.disabled=!0,btnConvert.innerHTML='<span class="loader"></span> Processing...',statusArea.classList.remove("hidden"),updateProgress(10,"Reading file...");try{const e=await readFileAsArrayBuffer(selectedFile);updateProgress(40,"Decoding audio data..."),audioCtx||(audioCtx=new(window.AudioContext||window.webkitAudioContext));const t=await audioCtx.decodeAudioData(e);updateProgress(80,"Encoding to WAV...");const n=bufferToWave(t,t.length);updateProgress(100,"Done!");const a=URL.createObjectURL(n),o=selectedFile.name.replace(/\.[^/.]+$/,"")+".wav";downloadLink.href=a,downloadLink.download=o,setTimeout((()=>{modal.classList.remove("hidden"),resetUI()}),500)}catch(e){console.error(e),statusText.textContent="Error: "+(e.message||"Could not decode video audio."),statusText.classList.add("text-red-400"),progressBar.classList.add("bg-red-500"),btnConvert.innerHTML="<span>Try Again</span>",btnConvert.disabled=!1}}));function readFileAsArrayBuffer(e){return new Promise(((t,n)=>{const a=new FileReader;a.onload=()=>t(a.result),a.onerror=n,a.readAsArrayBuffer(e)}))}function updateProgress(e,t){progressBar.style.width=e+"%",statusText.textContent=t,document.getElementById("status-percent").textContent=e+"%"}function bufferToWave(e,t){let n=e.numberOfChannels,a=2*t*n+44,o=new ArrayBuffer(a),l=new DataView(o),s=[],r,c=0,d=0;function i(e){l.setUint16(d,e,!0),d+=2}function u(e){l.setUint32(d,e,!0),d+=4}for(u(1179011410),u(a-8),u(1163280727),u(544501094),u(16),i(1),i(n),u(e.sampleRate),u(e.sampleRate*2*n),i(2*n),i(16),u(1635017060),u(a-d-4),r=0;r<e.numberOfChannels;r++)s.push(e.getChannelData(r));for(;d<t;){for(r=0;r<n;r++){let e=Math.max(-1,Math.min(1,s[r][d]));e=0|(.5+e<0?32768*e:32767*e),l.setInt16(44+c,e,!0),c+=2}d++}return new Blob([o],{type:"audio/wav"})}function closeModal(){modal.classList.add("hidden")}function resetUI(){btnConvert.disabled=!1,btnConvert.innerHTML="<span>Start Conversion</span>"}</script></body></html>`,
        css: "",
        js: ""
    },
    {
        id: 5,
        title: "FilterMaster",
        description: "A professional-grade browser photo editor. Apply filters, rotate, flip, and save your edited images instantly.",
        icon: "fa-sliders-h",
        color: "text-blue-600",
        bg: "bg-blue-500/10",
        isFullPage: true,
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Photo Editor</title><script src="https://cdn.tailwindcss.com"></script><link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet"><style>input[type=range]{-webkit-appearance:none;background:0 0}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;height:20px;width:20px;border-radius:50%;background:#2563eb;margin-top:-8px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3)}input[type=range]::-webkit-slider-runnable-track{width:100%;height:4px;cursor:pointer;background:#d1d5db;border-radius:2px}</style></head><body class="bg-gray-100 h-screen flex flex-col font-sans overflow-hidden"><header class="bg-white shadow-sm px-4 py-3 z-10 flex justify-between items-center shrink-0"><div class="flex items-center gap-2 text-blue-600"><i class="fas fa-layer-group text-xl"></i><span class="font-bold text-lg text-gray-800">FilterMaster</span></div><div class="flex gap-2"><button id="reset-all" class="px-4 py-2 text-sm text-gray-600 hover:text-red-500 font-medium transition-colors disabled:opacity-50"><i class="fas fa-undo mr-1"></i> Reset</button><button id="download-btn" class="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"><i class="fas fa-download mr-1"></i> Save</button></div></header><div class="flex flex-col lg:flex-row flex-1 overflow-hidden"><aside class="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col z-20 shadow-lg lg:shadow-none order-2 lg:order-1 h-1/2 lg:h-auto overflow-y-auto"><div class="p-6 space-y-6"><div><h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Filters</h3><div class="grid grid-cols-2 gap-2"><button class="filter-btn active w-full py-2.5 px-3 text-sm rounded-lg border bg-blue-50 border-blue-500 text-blue-700 font-semibold" data-key="brightness">Brightness</button><button class="filter-btn w-full py-2.5 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" data-key="saturate">Saturation</button><button class="filter-btn w-full py-2.5 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" data-key="invert">Inversion</button><button class="filter-btn w-full py-2.5 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" data-key="grayscale">Grayscale</button><button class="filter-btn w-full py-2.5 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" data-key="contrast">Contrast</button><button class="filter-btn w-full py-2.5 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" data-key="blur">Blur</button></div></div><div class="bg-gray-50 p-4 rounded-xl border border-gray-100"><div class="flex justify-between items-center mb-3"><label id="slider-label" class="text-sm font-semibold text-gray-700">Brightness</label><span id="slider-value" class="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">100%</span></div><input type="range" id="effect-slider" min="0" max="200" value="100" class="w-full"></div><div><h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Transform</h3><div class="grid grid-cols-4 gap-2"><button class="transform-btn p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors" id="rotate-left" title="Rotate Left"><i class="fas fa-rotate-left"></i></button><button class="transform-btn p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors" id="rotate-right" title="Rotate Right"><i class="fas fa-rotate-right"></i></button><button class="transform-btn p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors" id="flip-h" title="Flip Horizontal"><i class="fas fa-arrows-left-right"></i></button><button class="transform-btn p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors" id="flip-v" title="Flip Vertical"><i class="fas fa-arrows-up-down"></i></button></div></div><div class="mt-4 pt-4 border-t border-gray-100"><input type="file" id="upload-file" accept="image/*" hidden><button id="upload-btn" class="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 font-medium"><i class="fas fa-folder-open"></i> Choose Image</button></div></div></aside><main class="flex-1 bg-gray-100 relative p-4 lg:p-10 flex items-center justify-center order-1 lg:order-2 overflow-hidden h-1/2 lg:h-full"><div id="empty-state" class="text-center"><div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fas fa-image text-4xl text-gray-400"></i></div><h2 class="text-xl font-bold text-gray-700">No Image Selected</h2><p class="text-gray-500 mt-1">Upload a photo to start editing</p></div><div id="canvas-container" class="hidden relative shadow-2xl rounded-sm overflow-hidden max-w-full max-h-full"><canvas id="editor-canvas" class="block max-w-full max-h-full"></canvas></div></main></div><script>const filterDefinitions={brightness:{min:0,max:200,def:100,unit:"%"},saturate:{min:0,max:200,def:100,unit:"%"},invert:{min:0,max:100,def:0,unit:"%"},grayscale:{min:0,max:100,def:0,unit:"%"},contrast:{min:0,max:200,def:100,unit:"%"},blur:{min:0,max:20,def:0,unit:"px"}};let state={image:null,activeFilter:"brightness",filters:{brightness:100,saturate:100,invert:0,grayscale:0,contrast:100,blur:0},transform:{rotate:0,flipH:1,flipV:1}};const uploadBtn=document.getElementById("upload-btn"),fileInput=document.getElementById("upload-file"),canvas=document.getElementById("editor-canvas"),ctx=canvas.getContext("2d"),emptyState=document.getElementById("empty-state"),canvasContainer=document.getElementById("canvas-container"),filterBtns=document.querySelectorAll(".filter-btn"),slider=document.getElementById("effect-slider"),sliderValue=document.getElementById("slider-value"),sliderLabel=document.getElementById("slider-label"),downloadBtn=document.getElementById("download-btn"),resetBtn=document.getElementById("reset-all"),drawImage=()=>{if(!state.image)return;const e=Math.abs(state.transform.rotate%360),t=90===e||270===e;canvas.width=t?state.image.naturalHeight:state.image.naturalWidth,canvas.height=t?state.image.naturalWidth:state.image.naturalHeight,ctx.clearRect(0,0,canvas.width,canvas.height);const r=state.filters;ctx.filter=\`brightness(\${r.brightness}%) saturate(\${r.saturate}%) invert(\${r.invert}%) grayscale(\${r.grayscale}%) contrast(\${r.contrast}%) blur(\${r.blur}px)\`,ctx.save(),ctx.translate(canvas.width/2,canvas.height/2),ctx.rotate(state.transform.rotate*Math.PI/180),ctx.scale(state.transform.flipH,state.transform.flipV),ctx.drawImage(state.image,-state.image.naturalWidth/2,-state.image.naturalHeight/2,state.image.naturalWidth,state.image.naturalHeight),ctx.restore()},updateControls=()=>{const e=filterDefinitions[state.activeFilter],t=state.filters[state.activeFilter];sliderLabel.innerText=document.querySelector(\`.filter-btn[data-key="\${state.activeFilter}"]\`).innerText,slider.min=e.min,slider.max=e.max,slider.value=t,sliderValue.innerText=\`\${t}\${e.unit}\`,filterBtns.forEach((e=>{e.dataset.key===state.activeFilter?(e.classList.add("border-blue-500","bg-blue-50","text-blue-700","font-semibold"),e.classList.remove("border-gray-200","text-gray-600","hover:bg-gray-50")):(e.classList.remove("border-blue-500","bg-blue-50","text-blue-700","font-semibold"),e.classList.add("border-gray-200","text-gray-600","hover:bg-gray-50"))}))},resetState=()=>{state.filters={brightness:100,saturate:100,invert:0,grayscale:0,contrast:100,blur:0},state.transform={rotate:0,flipH:1,flipV:1},state.activeFilter="brightness",updateControls(),drawImage()};uploadBtn.addEventListener("click",(()=>fileInput.click())),fileInput.addEventListener("change",(e=>{const t=e.target.files[0];if(!t)return;const r=new Image;r.src=URL.createObjectURL(t),r.onload=()=>{state.image=r,emptyState.classList.add("hidden"),canvasContainer.classList.remove("hidden"),downloadBtn.disabled=!1,resetBtn.disabled=!1,resetState()}})),filterBtns.forEach((e=>{e.addEventListener("click",(()=>{state.activeFilter=e.dataset.key,updateControls()}))})),slider.addEventListener("input",(()=>{state.image&&(state.filters[state.activeFilter]=parseInt(slider.value),sliderValue.innerText=\`\${slider.value}\${filterDefinitions[state.activeFilter].unit}\`,drawImage())})),document.getElementById("rotate-left").addEventListener("click",(()=>{state.image&&(state.transform.rotate-=90,drawImage())})),document.getElementById("rotate-right").addEventListener("click",(()=>{state.image&&(state.transform.rotate+=90,drawImage())})),document.getElementById("flip-h").addEventListener("click",(()=>{state.image&&(state.transform.flipH*=-1,drawImage())})),document.getElementById("flip-v").addEventListener("click",(()=>{state.image&&(state.transform.flipV*=-1,drawImage())})),resetBtn.addEventListener("click",(()=>{state.image&&resetState()})),downloadBtn.addEventListener("click",(()=>{if(!state.image)return;const e=document.createElement("a");e.download=\`edited-image-\${Date.now()}.jpg\`,e.href=canvas.toDataURL("image/jpeg",.85),e.click()})),downloadBtn.disabled=!0,resetBtn.disabled=!0;</script></body></html>`,
        css: "",
        js: ""
    }
];

/* ===============================================
   COMMON LOGIC
   ===============================================
*/
const btn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');
if (btn && menu) {
    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
        if(!menu.classList.contains('hidden')){
            setTimeout(() => {
                menu.classList.remove('opacity-0', '-translate-y-5');
            }, 10);
        } else {
            menu.classList.add('opacity-0', '-translate-y-5');
        }
    });
}

// Typing Effect (Only run if element exists)
const textElement = document.getElementById('typing-text');
if (textElement) {
    const texts = ["Web Developer", "Code Enthusiast", "Frontend Engineer", "Problem Solver"];
    let textIndex = 0, charIndex = 0, isDeleting = false, typeSpeed = 100;
    function type() {
        const currentText = texts[textIndex];
        if (isDeleting) {
            textElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            textElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }
        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true; typeSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false; textIndex = (textIndex + 1) % texts.length; typeSpeed = 500;
        }
        setTimeout(type, typeSpeed);
    }
    document.addEventListener('DOMContentLoaded', type);
}

// Scroll Reveal
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            if (entry.target.querySelector('.progress-bar-fill')) {
                const bar = entry.target.querySelector('.progress-bar-fill');
                bar.style.width = bar.getAttribute('data-width');
            }
        }
    });
}, observerOptions);
document.querySelectorAll('.reveal-element').forEach(el => observer.observe(el));

// Particles
const canvas = document.getElementById('particles-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particlesArray;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    });
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = (Math.random() * 1.5 - 0.75);
            this.speedY = (Math.random() * 1.5 - 0.75);
            this.color = '#3B82F6';
        }
        update() {
            this.x += this.speedX; this.y += this.speedY;
            if (this.x > canvas.width) this.x = 0; else if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0; else if (this.y < 0) this.y = canvas.height;
        }
        draw() {
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
    }
    function initParticles() {
        particlesArray = [];
        const numberOfParticles = (canvas.width * canvas.height) / 15000;
        for (let i = 0; i < numberOfParticles; i++) { particlesArray.push(new Particle()); }
    }
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update(); particlesArray[i].draw();
            for (let j = i; j < particlesArray.length; j++) {
                const dx = particlesArray[i].x - particlesArray[j].x;
                const dy = particlesArray[i].y - particlesArray[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    ctx.beginPath(); ctx.strokeStyle = `rgba(59, 130, 246, ${1 - distance/100})`; ctx.lineWidth = 0.5;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y); ctx.lineTo(particlesArray[j].x, particlesArray[j].y); ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }
    initParticles(); animateParticles();
}


/* ===============================================
   PAGE SPECIFIC LOGIC
   ===============================================
*/

const projectsList = document.getElementById('projects-list');
const projectViewer = document.getElementById('project-viewer-container');

// A. IF WE ARE ON THE PROJECTS LIST PAGE
if (projectsList) {
    projectsList.innerHTML = '';
    myProjects.forEach(project => {
        // Create a Card for each project
        const card = document.createElement('div');
        card.className = "bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 hover:border-primary transition-all hover:-translate-y-2 duration-300 group";
        
        card.innerHTML = `
            <div class="h-32 ${project.bg || 'bg-slate-700'} flex items-center justify-center border-b border-slate-700 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent"></div>
                <i class="fas ${project.icon || 'fa-code'} text-6xl ${project.color || 'text-slate-500'} transform group-hover:scale-110 transition-transform duration-500"></i>
            </div>
            <div class="p-6">
                <h3 class="font-bold text-xl text-white mb-2">${project.title}</h3>
                <p class="text-sm text-slate-400 mb-6 h-10 overflow-hidden line-clamp-2">${project.description}</p>
                <a href="view-project.html?id=${project.id}" class="inline-block w-full text-center py-3 bg-primary hover:bg-blue-600 rounded-lg text-white font-semibold shadow-lg shadow-blue-500/30 transition-all">
                    <i class="fas fa-play mr-2"></i> Launch Project
                </a>
            </div>
        `;
        projectsList.appendChild(card);
    });
}

// B. IF WE ARE ON THE VIEWER PAGE
if (projectViewer) {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const project = myProjects.find(p => p.id == projectId);

    if (project) {
        document.getElementById('project-title').textContent = project.title;
        document.title = project.title + " | Project Viewer";

        const iframe = document.createElement('iframe');
        iframe.className = "w-full h-full border-none";
        
        // Handle Full Page vs Fragment
        let fullContent = "";
        
        if (project.isFullPage) {
            fullContent = project.html;
        } else {
            fullContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>${project.css}</style>
                </head>
                <body>
                    ${project.html}
                    <script>${project.js}<\/script>
                </body>
                </html>
            `;
        }

        projectViewer.appendChild(iframe);
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(fullContent);
        iframe.contentWindow.document.close();
    } else {
        projectViewer.innerHTML = `<div class="text-center mt-20 text-red-500 text-xl">Project not found.</div>`;
    }
}
