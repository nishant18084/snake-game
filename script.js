const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const box = 18; // Canvas responsiveness tweak

// Multi-Game Core State
let activeGame = "none"; 
let game, currentSpeed, gameStarted = false, isPaused = false;
let score = 0;

// Universal Memory
let coins = parseInt(localStorage.getItem("snakeCoins")) || 0;
let snakeHighScore = parseInt(localStorage.getItem("snakeHighScore")) || 0;
let racingHighScore = parseInt(localStorage.getItem("racingHighScore")) || 0;
document.getElementById("coinCount").innerText = coins;

// Snake Engine Configurations
let snake, food, d;
let unlockedSkins = JSON.parse(localStorage.getItem("unlockedSkins")) || ["cyan"];
let currentSkin = localStorage.getItem("currentSkin") || "cyan";
const skinsCollection = {
    cyan: { name: "Neon Cyan", head: "#00f2fe", body: "#0072ff" },
    green: { name: "Toxic Green", head: "#00ff87", body: "#00a352" },
    purple: { name: "Cosmic Purple", head: "#e040fb", body: "#7b1fa2" }
};

// 3D Racing Engine Configurations
let trackPosition = 0;
let playerX = 0; 
let carSpeed = 0;
const maxSpeed = 18;
let trackSegments = [];

// SCREEN NAVIGATION FUNCTIONS (Yahan block break ho raha tha)
function selectGame(gameName) {
    activeGame = gameName;
    document.getElementById("hubMenu").classList.add("hidden"); // Hub Chupao
    
    if (gameName === 'snake') {
        document.getElementById("mainTitle").innerText = "Snake Neon Pro";
        document.getElementById("highScore").innerText = snakeHighScore;
        showSnakeMenu();
    } else if (gameName === 'racing') {
        document.getElementById("mainTitle").innerText = "3D Turbo Racing";
        document.getElementById("highScore").innerText = racingHighScore;
        currentSpeed = 35; // 3D Frame Refresh Loop Speed
        startRacingGame();
    }
}

function backToHub() {
    activeGame = "none";
    document.getElementById("startMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.add("hidden");
    document.getElementById("hubMenu").classList.remove("hidden");
    document.getElementById("mainTitle").innerText = "Arcade Hub";
}

function showSnakeMenu() {
    document.getElementById("modeMenu").classList.add("hidden");
    document.getElementById("shopMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.add("hidden");
    document.getElementById("startMenu").classList.remove("hidden");
}

function showModes() { 
    document.getElementById("startMenu").classList.add("hidden"); 
    document.getElementById("modeMenu").classList.remove("hidden"); 
}

function showShop() { 
    document.getElementById("startMenu").classList.add("hidden"); 
    document.getElementById("shopMenu").classList.remove("hidden"); 
    buildShopMenu(); 
}

function hideShop() { showSnakeMenu(); }

function buildShopMenu() {
    const container = document.getElementById("shopItemsContainer"); container.innerHTML = "";
    Object.keys(skinsCollection).forEach(id => {
        const item = skinsCollection[id]; const isUnlocked = unlockedSkins.includes(id); const isEquipped = currentSkin === id;
        container.insertAdjacentHTML('beforeend', `
            <div class="shop-item">
                <div><b>${item.name}</b></div>
                <button class="buy-btn" onclick="handleShopClick('${id}')">${isEquipped?'Equipped':isUnlocked?'Select':'Free'}</button>
            </div>`);
    });
}

function handleShopClick(id) {
    currentSkin = id; localStorage.setItem("currentSkin", id); buildShopMenu();
}

function togglePause() {
    if (!gameStarted) return;
    const overlay = document.getElementById("pauseOverlay");
    const btn = document.getElementById("pauseBtn");
    if (!isPaused) {
        isPaused = true; clearInterval(game); overlay.classList.remove("hidden"); btn.innerText = "▶️ Resume";
    } else {
        isPaused = false; overlay.classList.add("hidden"); btn.innerText = "⏸️ Pause";
        game = setInterval(activeGame === "snake" ? drawSnake : drawRacing, currentSpeed);
    }
}

// ------------------------------------------
// CORE 1: SNAKE GAMEPLAY
// ------------------------------------------
function startGame(speed) {
    currentSpeed = speed; score = 0; d = undefined; isPaused = false;
    snake = [{ x: 9 * box, y: 10 * box }];
    food = { x: Math.floor(Math.random() * 19) * box, y: Math.floor(Math.random() * 19) * box };
    document.getElementById("currentScore").innerText = score;
    document.getElementById("modeMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");
    gameStarted = true;
    game = setInterval(drawSnake, currentSpeed);
}

function drawSnake() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let skin = skinsCollection[currentSkin] || skinsCollection["cyan"];
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i === 0) ? skin.head : skin.body;
        ctx.fillRect(snake[i].x, snake[i].y, box-1, box-1);
    }
    ctx.font = "16px Arial"; ctx.fillText("🍎", food.x, food.y + 14);

    let snakeX = snake[0].x, snakeY = snake[0].y;
    if (d == "LEFT") snakeX -= box; if (d == "UP") snakeY -= box; if (d == "RIGHT") snakeX += box; if (d == "DOWN") snakeY += box;

    if (snakeX == food.x && snakeY == food.y) {
        score++; coins += 2; document.getElementById("currentScore").innerText = score;
        document.getElementById("coinCount").innerText = coins; localStorage.setItem("snakeCoins", coins);
        if(score > snakeHighScore) { snakeHighScore = score; localStorage.setItem("snakeHighScore", snakeHighScore); }
        food = { x: Math.floor(Math.random() * 19) * box, y: Math.floor(Math.random() * 19) * box };
    } else { snake.pop(); }

    let newHead = { x: snakeX, y: snakeY };
    if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
        clearInterval(game); gameStarted = false; alert("💥 GAME OVER! Score: " + score); backToHub();
    }
    snake.unshift(newHead);
}
function collision(head, array) { for (let i = 0; i < array.length; i++) if (head.x == array[i].x && head.y == array[i].y) return true; return false; }

// ------------------------------------------
// CORE 2: 3D HORIZON RACING GAMEPLAY
// ------------------------------------------
function startRacingGame() {
    score = 0; isPaused = false; trackPosition = 0; playerX = 0; carSpeed = 5; trackSegments = [];
    for (let i = 0; i < 600; i++) {
        let curve = (i > 80 && i < 220) ? 2.5 * Math.sin(i * 0.05) : (i > 350 && i < 500) ? -3 * Math.cos(i * 0.04) : 0;
        let hill = (i > 150 && i < 400) ? 35 * Math.sin(i * 0.03) : 0;
        trackSegments.push({ curve: curve, hill: hill, coinX: (i % 25 === 0) ? (Math.random() > 0.5 ? 0.5 : -0.5) : 0, collected: false });
    }
    document.getElementById("currentScore").innerText = score;
    document.getElementById("gameArea").classList.remove("hidden");
    gameStarted = true;
    game = setInterval(drawRacing, currentSpeed);
}

function drawRacing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    trackPosition += carSpeed; score++;
    document.getElementById("currentScore").innerText = Math.floor(score/10);

    let startSegment = Math.floor(trackPosition / 20) % trackSegments.length;
    let percent = (trackPosition % 20) / 20;
    let currentHill = trackSegments[startSegment].hill;

    // Draw Sky & Horizon Background
    ctx.fillStyle = "#0c051a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0a1c28"; ctx.fillRect(0, 140 + currentHill*0.5, canvas.width, 220 - currentHill*0.5);

    let dx = 0;
    for (let i = 30; i > 0; i--) {
        let idx = (startSegment + i) % trackSegments.length;
        let seg = trackSegments[idx];
        
        let p1 = 800 / (800 + (i - percent) * 20);
        let p2 = 800 / (800 + (i - 1 - percent) * 20);
        
        let y1 = 140 + currentHill*0.5 + (220 - currentHill*0.5) * (i - percent) / 30;
        let y2 = 140 + currentHill*0.5 + (220 - currentHill*0.5) * (i - 1 - percent) / 30;
        
        dx += seg.curve * 2.5;
        let w1 = canvas.width * 0.65 * p1, w2 = canvas.width * 0.65 * p2;
        let x1 = canvas.width / 2 + dx, x2 = canvas.width / 2 + dx + trackSegments[(startSegment+i-1)%trackSegments.length].curve*2.5;

        // Rumble Grass Side Strip
        ctx.fillStyle = (idx % 4 < 2) ? "#0a2f1d" : "#0f4229"; ctx.fillRect(0, y2, canvas.width, y1 - y2);
        // Asphalt 3D Road
        ctx.fillStyle = (idx % 4 < 2) ? "#222" : "#2d2d2d";
        ctx.beginPath(); ctx.moveTo(x1-w1, y1); ctx.lineTo(x1+w1, y1); ctx.lineTo(x2+w2, y2); ctx.lineTo(x2-w2, y2); ctx.fill();
        // Borders
        ctx.fillStyle = (idx % 4 < 2) ? "#fff" : "#ff0055";
        ctx.fillRect(x1-w1-2, y1, 4, y2-y1); ctx.fillRect(x1+w1-2, y1, 4, y2-y1);

        // Render Coins in 3D Space
        if (seg.coinX !== 0 && !seg.collected && i === 10) {
            let cx = x1 + (seg.coinX * w1);
            ctx.font = "16px Arial"; ctx.fillText("💰", cx - 8, y1 - 5);
            if (Math.abs(playerX - seg.coinX) < 0.35) {
                coins += 5; localStorage.setItem("snakeCoins", coins);
                document.getElementById("coinCount").innerText = coins; seg.collected = true;
            }
        }
    }

    // Render Foreground Player Supercar
    let pCarX = canvas.width / 2 + (playerX * canvas.width * 0.32);
    ctx.save(); ctx.translate(pCarX, 310);
    ctx.fillStyle = "#ff0055"; ctx.fillRect(-22, -4, 44, 15); // Chassis
    ctx.fillStyle = "#00f2fe"; ctx.fillRect(-15, -12, 30, 9); // Shield
    ctx.fillStyle = "#111"; ctx.fillRect(-25, 2, 5, 10); ctx.fillRect(20, 2, 5, 10); // Tires
    ctx.restore();

    // Physics Speed logic
    if (playerX > 1.1 || playerX < -1.1) { carSpeed = Math.max(2, carSpeed - 0.4); } // Off-road slow down
    else if (carSpeed < maxSpeed) { carSpeed += 0.04; }
}

// SHARED CONTROLS HUB
document.addEventListener("keydown", e => {
    if (!gameStarted || isPaused) return;
    if (activeGame === "snake") {
        if (e.keyCode == 37 && d != "RIGHT") d = "LEFT";
        else if (e.keyCode == 38 && d != "DOWN") d = "UP";
        else if (e.keyCode == 39 && d != "LEFT") d = "RIGHT";
        else if (e.keyCode == 40 && d != "UP") d = "DOWN";
    } else if (activeGame === "racing") {
        if (e.keyCode == 37) playerX -= 0.15;
        if (e.keyCode == 39) playerX += 0.15;
    }
});

function handleControl(dir) {
    if (!gameStarted || isPaused) return;
    if (activeGame === "snake") {
        if (dir == "LEFT" && d != "RIGHT") d = "LEFT";
        if (dir == "UP" && d != "DOWN") d = "UP";
        if (dir == "RIGHT" && d != "LEFT") d = "RIGHT";
        if (dir == "DOWN" && d != "UP") d = "DOWN";
    } else if (activeGame === "racing") {
        if (dir == "LEFT") playerX -= 0.25;
        if (dir == "RIGHT") playerX += 0.25;
        if (dir == "UP" && carSpeed < maxSpeed) carSpeed += 1.5;
    }
            }
