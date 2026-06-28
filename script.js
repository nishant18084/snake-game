const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
let snake, food, score, d, game, currentSpeed;
let gameStarted = false;
let isPaused = false; // Pause tracking logic

let savedHighScore = localStorage.getItem("snakeHighScore") || 0;
let coins = parseInt(localStorage.getItem("snakeCoins")) || 0;
let unlockedSkins = JSON.parse(localStorage.getItem("unlockedSkins")) || ["cyan"];
let currentSkin = localStorage.getItem("currentSkin") || "cyan";

document.getElementById("highScore").innerText = savedHighScore;
document.getElementById("coinCount").innerText = coins;

const skinsCollection = {
    cyan: { name: "Cyan 3D", cost: 0, rarity: "common", head: "#00f2fe", body: "#0072ff" },
    green: { name: "Toxic 3D", cost: 15, rarity: "common", head: "#00ff87", body: "#00a352" },
    red: { name: "Ruby 3D", cost: 20, rarity: "common", head: "#ff0055", body: "#990033" },
    purple: { name: "Cosmic 3D", cost: 60, rarity: "rare", head: "#e040fb", body: "#7b1fa2" },
    gold: { name: "👑 Pure Gold 3D", cost: 300, rarity: "legendary", head: "#ffdf00", body: "#d4af37" },
    rainbow: { name: "🌈 RGB 3D", cost: 500, rarity: "legendary", head: "rainbow_mode", body: "rainbow_mode" }
};

function showModes() {
    document.getElementById("startMenu").classList.add("hidden");
    document.getElementById("modeMenu").classList.remove("hidden");
}

function showShop() {
    document.getElementById("startMenu").classList.add("hidden");
    document.getElementById("shopMenu").classList.remove("hidden");
    buildShopMenu();
}

function hideShop() {
    document.getElementById("shopMenu").classList.add("hidden");
    document.getElementById("startMenu").classList.remove("hidden");
}

function buildShopMenu() {
    const container = document.getElementById("shopItemsContainer");
    container.innerHTML = "";
    Object.keys(skinsCollection).forEach(id => {
        const item = skinsCollection[id];
        const isUnlocked = unlockedSkins.includes(id);
        const isEquipped = currentSkin === id;
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
        coins -= cost; unlockedSkins.push(id);
        localStorage.setItem("snakeCoins", coins);
        localStorage.setItem("unlockedSkins", JSON.stringify(unlockedSkins));
        document.getElementById("coinCount").innerText = coins; currentSkin = id;
    } else { alert("Coins kam hain!"); }
    buildShopMenu();
}

// Pause / Resume Logic Function
function togglePause() {
    if (!gameStarted) return;
    const overlay = document.getElementById("pauseOverlay");
    const btn = document.getElementById("pauseBtn");
    
    if (!isPaused) {
        isPaused = true;
        clearInterval(game); // Game dynamic loop stops
        overlay.classList.remove("hidden");
        btn.innerText = "▶️ Resume";
    } else {
        isPaused = false;
        game = setInterval(draw, currentSpeed); // Resume with same speed
        overlay.classList.add("hidden");
        btn.innerText = "⏸️ Pause";
    }
}

function resetGame() {
    snake = [{ x: 9 * box, y: 10 * box }];
    food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
    score = 0; d = undefined; isPaused = false;
    document.getElementById("currentScore").innerText = score;
    document.getElementById("pauseOverlay").classList.add("hidden");
    document.getElementById("pauseBtn").innerText = "⏸️ Pause";
    clearInterval(game);
}

document.addEventListener("keydown", e => {
    if (e.keyCode == 32) { togglePause(); return; } // Spacebar to pause/resume
    if (!gameStarted || isPaused) return;
    if (e.keyCode == 37 && d != "RIGHT") d = "LEFT";
    else if (e.keyCode == 38 && d != "DOWN") d = "UP";
    else if (e.keyCode == 39 && d != "LEFT") d = "RIGHT";
    else if (e.keyCode == 40 && d != "UP") d = "DOWN";
});

function changeDirection(dir) {
    if (!gameStarted || isPaused) return;
    if (dir == "LEFT" && d != "RIGHT") d = "LEFT";
    else if (dir == "UP" && d != "DOWN") d = "UP";
    else if (dir == "RIGHT" && d != "LEFT") d = "RIGHT";
    else if (dir == "DOWN" && d != "UP") d = "DOWN";
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) if (head.x == array[i].x && head.y == array[i].y) return true;
    return false;
}

// 3D Block Drawing Helper (Adds bevels & shadow edges)
function draw3DBlock(x, y, baseColor, highlightColor) {
    // Top-Left corner Highlight
    ctx.fillStyle = highlightColor;
    ctx.fillRect(x, y, box, box);
    
    // Bottom-Right Deep Shadow (gives 3D bevel look)
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x, y + box);
    ctx.lineTo(x + box, y + box);
    ctx.lineTo(x + box, y);
    ctx.fill();

    // Core Face Front
    ctx.fillStyle = baseColor;
    ctx.fillRect(x + 2, y + 2, box - 4, box - 4);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let skin = skinsCollection[currentSkin] || skinsCollection["cyan"];
    let headColor = skin.head, bodyColor = skin.body;

    if (currentSkin === "rainbow") {
        let hue = (Date.now() / 10) % 360;
        headColor = `hsl(${hue}, 100%, 50%)`;
        bodyColor = `hsl(${(hue + 25) % 360}, 100%, 40%)`;
    }

    // Render Snake Blocks with 3D Texture Layers
    for (let i = 0; i < snake.length; i++) {
        let bColor = (i === 0) ? headColor : bodyColor;
        draw3DBlock(snake[i].x, snake[i].y, bColor, "#ffffff");

        // Face & Pupils mapping on 3D Head Block
        if (i === 0) {
            ctx.fillStyle = "#fff";
            let o = 5;
            if (d === "UP" || d === undefined) { ctx.fillRect(snake[i].x+o, snake[i].y+o, 3, 3); ctx.fillRect(snake[i].x+box-o-3, snake[i].y+o, 3, 3); }
            else if (d === "DOWN") { ctx.fillRect(snake[i].x+o, snake[i].y+box-o-3, 3, 3); ctx.fillRect(snake[i].x+box-o-3, snake[i].y+box-o-3, 3, 3); }
            else if (d === "LEFT") { ctx.fillRect(snake[i].x+o, snake[i].y+o, 3, 3); ctx.fillRect(snake[i].x+o, snake[i].y+box-o-3, 3, 3); }
            else if (d === "RIGHT") { ctx.fillRect(snake[i].x+box-o-3, snake[i].y+o, 3, 3); ctx.fillRect(snake[i].x+box-o-3, snake[i].y+box-o-3, 3, 3); }
        }
    }

    // Fruit Layer (🍎 with slight drop shadow look)
    ctx.font = "16px Arial";
    ctx.fillText("🍎", food.x + 1, food.y + 1);

    let snakeX = snake[0].x, snakeY = snake[0].y;
    if (d == "LEFT") snakeX -= box; if (d == "UP") snakeY -= box; if (d == "RIGHT") snakeX += box; if (d == "DOWN") snakeY += box;

    if (snakeX == food.x && snakeY == food.y) {
        score++; coins += 2;
        document.getElementById("currentScore").innerText = score;
        document.getElementById("coinCount").innerText = coins;
        localStorage.setItem("snakeCoins", coins);

        if(score > savedHighScore) {
            savedHighScore = score; localStorage.setItem("snakeHighScore", savedHighScore);
            document.getElementById("highScore").innerText = savedHighScore;
        }
        food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
    } else { snake.pop(); }

    let newHead = { x: snakeX, y: snakeY };
    if (snakeX < 0 || snakeX > canvas.width - box || snakeY < 0 || snakeY > canvas.height - box || collision(newHead, snake)) {
        clearInterval(game); gameStarted = false;
        alert("💥 GAME OVER! Score: " + score); location.reload();
    }
    snake.unshift(newHead);
}

function startGame(speed) {
    currentSpeed = speed;
    resetGame();
    gameStarted = true;
    document.getElementById("modeMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");
    game = setInterval(draw, currentSpeed);
}

resetGame(); draw();
            
