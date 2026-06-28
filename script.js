const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const box = 20;

// Game State Tracking
let activeGame = "none"; // "snake" or "racing"
let game, currentSpeed, gameStarted = false, isPaused = false;
let score = 0;

// Shared Wallet Memory
let coins = parseInt(localStorage.getItem("snakeCoins")) || 0;
let snakeHighScore = localStorage.getItem("snakeHighScore") || 0;
let racingHighScore = localStorage.getItem("racingHighScore") || 0;
document.getElementById("coinCount").innerText = coins;

// --- SNAKE SYSTEM KEYS ---
let snake, food, d;
let unlockedSkins = JSON.parse(localStorage.getItem("unlockedSkins")) || ["cyan"];
let currentSkin = localStorage.getItem("currentSkin") || "cyan";
const skinsCollection = {
    cyan: { name: "Neon Cyan", cost: 0, rarity: "common", head: "#00f2fe", body: "#0072ff" },
    green: { name: "Toxic Green", cost: 15, rarity: "common", head: "#00ff87", body: "#00a352" },
    purple: { name: "Cosmic Purple", cost: 60, rarity: "rare", head: "#e040fb", body: "#7b1fa2" },
    gold: { name: "👑 Pure Gold", cost: 300, rarity: "legendary", head: "#ffdf00", body: "#d4af37" }
};

// --- RACING SYSTEM KEYS ---
let playerCar = { x: 180, y: 320, width: 35, height: 60 };
let enemyCars = [];
let roadLineY = 0;
let racingCoinsArr = [];

// MENU SYSTEM ROUTING
function selectGame(gameName) {
    activeGame = gameName;
    document.getElementById("hubMenu").classList.add("hidden");
    if (gameName === 'snake') {
        document.getElementById("mainTitle").innerText = "Snake Neon Pro";
        document.getElementById("highScore").innerText = snakeHighScore;
        showSnakeMenu();
    } else if (gameName === 'racing') {
        document.getElementById("mainTitle").innerText = "Turbo Racing";
        document.getElementById("highScore").innerText = racingHighScore;
        // Direct start racing at 90ms loop speed
        currentSpeed = 40;
        startRacingGame();
    }
}

function backToHub() {
    activeGame = "none";
    document.getElementById("startMenu").classList.add("hidden");
    document.getElementById("hubMenu").classList.remove("hidden");
    document.getElementById("mainTitle").innerText = "Arcade Hub";
}
function showSnakeMenu() {
    document.getElementById("modeMenu").classList.add("hidden");
    document.getElementById("shopMenu").classList.add("hidden");
    document.getElementById("startMenu").classList.remove("hidden");
}
function showModes() { document.getElementById("startMenu").classList.add("hidden"); document.getElementById("modeMenu").classList.remove("hidden"); }
function showShop() { document.getElementById("startMenu").classList.add("hidden"); document.getElementById("shopMenu").classList.remove("hidden"); buildShopMenu(); }
function hideShop() { showSnakeMenu(); }

// SHOP LOGIC
function buildShopMenu() {
    const container = document.getElementById("shopItemsContainer"); container.innerHTML = "";
    Object.keys(skinsCollection).forEach(id => {
        const item = skinsCollection[id]; const isUnlocked = unlockedSkins.includes(id); const isEquipped = currentSkin === id;
        let text = isEquipped ? "Equipped" : isUnlocked ? "Select" : "Buy";
        container.insertAdjacentHTML('beforeend', `
            <div class="shop-item rarity-${item.rarity}">
                <div><b>${item.name}</b><br><small style="color:#ffdf00">${isUnlocked ? "Unlocked" : "💰 " + item.cost}</small></div>
                <button class="buy-btn ${isEquipped?'equipped':''}" onclick="handleShopClick('${id}', ${item.cost})">${text}</button>
            </div>`);
    });
}
function handleShopClick(id, cost) {
    if (unlockedSkins.includes(id)) { currentSkin = id; localStorage.setItem("currentSkin", id); }
    else if (coins >= cost) {
        coins -= cost; unlockedSkins.push(id); localStorage.setItem("snakeCoins", coins);
        localStorage.setItem("unlockedSkins", JSON.stringify(unlockedSkins));
        document.getElementById("coinCount").innerText = coins; currentSkin = id;
    } else { alert("Coins kam hain!"); }
    buildShopMenu();
}

// SHARED PAUSE CORE
function togglePause() {
    if (!gameStarted) return;
    const overlay = document.getElementById("pauseOverlay");
    const btn = document.getElementById("pauseBtn");
    if (!isPaused) {
        isPaused = true; clearInterval(game);
        overlay.classList.remove("hidden"); btn.innerText = "▶️ Resume";
    } else {
        isPaused = false;
        game = setInterval(activeGame === "snake" ? drawSnake : drawRacing, currentSpeed);
        overlay.classList.add("hidden"); btn.innerText = "⏸️ Pause";
    }
}

// CONTROL EVENT OVERLAYS
document.addEventListener("keydown", e => {
    if (e.keyCode == 32) { togglePause(); return; }
    if (!gameStarted || isPaused) return;
    if (activeGame === "snake") {
        if (e.keyCode == 37 && d != "RIGHT") d = "LEFT";
        else if (e.keyCode == 38 && d != "DOWN") d = "UP";
        else if (e.keyCode == 39 && d != "LEFT") d = "RIGHT";
        else if (e.keyCode == 40 && d != "UP") d = "DOWN";
    } else if (activeGame === "racing") {
        if (e.keyCode == 37 && playerCar.x > 50) playerCar.x -= 25;
        if (e.keyCode == 39 && playerCar.x < 310) playerCar.x += 25;
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
        if (dir == "LEFT" && playerCar.x > 50) playerCar.x -= 30;
        if (dir == "RIGHT" && playerCar.x < 310) playerCar.x += 30;
    }
}

// ==========================================
// ENGINE 1: SNAKE NEON MODE
// ==========================================
function startGame(speed) {
    currentSpeed = speed; score = 0; d = undefined; isPaused = false;
    snake = [{ x: 9 * box, y: 10 * box }];
    food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
    document.getElementById("currentScore").innerText = score;
    document.getElementById("modeMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");
    gameStarted = true;
    game = setInterval(drawSnake, currentSpeed);
}

function drawSnake() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let skin = skinsCollection[currentSkin] || skinsCollection["cyan"];
    
    // Render Body
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i === 0) ? skin.head : skin.body;
        ctx.beginPath(); ctx.arc(snake[i].x + box/2, snake[i].y + box/2, box/2 - 1, 0, 2 * Math.PI); ctx.fill();
    }
    
    // Fruit
    ctx.font = "16px Arial"; ctx.fillText("🍎", food.x + 1, food.y + 1);

    let snakeX = snake[0].x, snakeY = snake[0].y;
    if (d == "LEFT") snakeX -= box; if (d == "UP") snakeY -= box; if (d == "RIGHT") snakeX += box; if (d == "DOWN") snakeY += box;

    if (snakeX == food.x && snakeY == food.y) {
        score++; coins += 2; document.getElementById("currentScore").innerText = score;
        document.getElementById("coinCount").innerText = coins; localStorage.setItem("snakeCoins", coins);
        if(score > snakeHighScore) { snakeHighScore = score; localStorage.setItem("snakeHighScore", snakeHighScore); }
        food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
    } else { snake.pop(); }

    let newHead = { x: snakeX, y: snakeY };
    if (snakeX < 0 || snakeX > canvas.width - box || snakeY < 0 || snakeY > canvas.height - box || collision(newHead, snake)) {
        clearInterval(game); gameStarted = false; alert("💥 SNAKE CRASH! Score: " + score); location.reload();
    }
    snake.unshift(newHead);
}
function collision(head, array) { for (let i = 0; i < array.length; i++) if (head.x == array[i].x && head.y == array[i].y) return true; return false; }


// ==========================================
// ENGINE 2: TURBO CAR RACING MODE
// ==========================================
function startRacingGame() {
    score = 0; isPaused = false; enemyCars = []; racingCoinsArr = [];
    playerCar.x = 180;
    document.getElementById("currentScore").innerText = score;
    document.getElementById("hubMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");
    gameStarted = true;
    game = setInterval(drawRacing, currentSpeed);
}

function drawRacing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Road Layout
    ctx.fillStyle = "#222"; ctx.fillRect(40, 0, 320, 400); // Black Road
    ctx.fillStyle = "#00ff87"; ctx.fillRect(0, 0, 40, 400); ctx.fillRect(360, 0, 40, 400); // Green grass side lines

    // Moving divider lines animation
    ctx.fillStyle = "#fff";
    roadLineY = (roadLineY + 12) % 60;
    for (let y = roadLineY - 60; y < 400; y += 60) {
        ctx.fillRect(197, y, 6, 30);
    }

    // 2. Spawn Items & Traffic Enemy Cars
    if (Math.random() < 0.03 && enemyCars.length < 3) {
        let lanes = [60, 120, 200, 260, 300];
        let selectLane = lanes[Math.floor(Math.random() * lanes.length)];
        // Check duplication
        if(!enemyCars.some(c => Math.abs(c.y) < 100 && c.x === selectLane)){
            enemyCars.push({ x: selectLane, y: -70, width: 35, height: 60, color: `hsl(${Math.random()*360}, 90%, 50%)` });
        }
    }
    if (Math.random() < 0.02 && racingCoinsArr.length < 2) {
        racingCoinsArr.push({ x: Math.floor(Math.random() * 260) + 60, y: -30, size: 15 });
    }

    // 3. Render and animate Coins
    for (let i = racingCoinsArr.length - 1; i >= 0; i--) {
        let c = racingCoinsArr[i];
        c.y += 5; // Coin scrolling speed
        ctx.font = "16px Arial"; ctx.fillText("💰", c.x, c.y);

        // Check wallet grab hitboxes
        if (c.y > playerCar.y && c.y < playerCar.y + playerCar.height && c.x > playerCar.x && c.x < playerCar.x + playerCar.width) {
            coins += 5; score += 10; // Grab coin gives 5 wallet funds + 10 points!
            document.getElementById("coinCount").innerText = coins;
            document.getElementById("currentScore").innerText = score;
            localStorage.setItem("snakeCoins", coins);
            racingCoinsArr.splice(i, 1);
        } else if (c.y > 400) { racingCoinsArr.splice(i, 1); }
    }

    // 4. Render and animate Enemy Traffic
    for (let i = enemyCars.length - 1; i >= 0; i--) {
        let ec = enemyCars[i];
        ec.y += 6; // Enemy car downwards speed
        
        // Draw 3D-ish Flat Car block
        ctx.fillStyle = ec.color; ctx.fillRect(ec.x, ec.y, ec.width, ec.height);
        ctx.fillStyle = "#000"; ctx.fillRect(ec.x+2, ec.y+8, 31, 15); // Windshield window

        // Check Fatal Crashes
        if (ec.x < playerCar.x + playerCar.width && ec.x + ec.width > playerCar.x && ec.y < playerCar.y + playerCar.height && ec.y + ec.height > playerCar.y) {
            clearInterval(game); gameStarted = false;
            alert("💥 CAR CRASHED! Score: " + score);
            if (score > racingHighScore) { racingHighScore = score; localStorage.setItem("racingHighScore", racingHighScore); }
            location.reload();
        }
        if (ec.y > 400) { enemyCars.splice(i, 1); score += 5; document.getElementById("currentScore").innerText = score; } // Dodge success score bonus
    }

    // 5. Render Blue Cyber Player Sports Car
    ctx.fillStyle = "#00f2fe"; ctx.fillRect(playerCar.x, playerCar.y, playerCar.width, playerCar.height); // Car chassis
    ctx.fillStyle = "#fff"; ctx.fillRect(playerCar.x+2, playerCar.y+35, 31, 15); // Windshield
    ctx.fillStyle = "#ff0055"; ctx.fillRect(playerCar.x+2, playerCar.y+2, 8, 5); ctx.fillRect(playerCar.x+25, playerCar.y+2, 8, 5); // Headlights
                                            }
