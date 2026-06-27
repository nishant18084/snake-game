const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
let snake, food, score, d, game;
let gameStarted = false;

// Storage configuration
let savedHighScore = localStorage.getItem("snakeHighScore") || 0;
let coins = parseInt(localStorage.getItem("snakeCoins")) || 0;
let unlockedSkins = JSON.parse(localStorage.getItem("unlockedSkins")) || ["cyan"];
let currentSkin = localStorage.getItem("currentSkin") || "cyan";

document.getElementById("highScore").innerText = savedHighScore;
document.getElementById("coinCount").innerText = coins;

// 16 Different Skins Data Matrix (Price and Rarity based)
const skinsCollection = {
    // COMMON (Basic color sets)
    cyan: { name: "Cyan Neon", cost: 0, rarity: "common", head: "#00f2fe", body: "#0072ff" },
    green: { name: "Toxic Green", cost: 15, rarity: "common", head: "#00ff87", body: "#00a352" },
    red: { name: "Ruby Red", cost: 20, rarity: "common", head: "#ff0055", body: "#990033" },
    orange: { name: "Tiger Orange", cost: 25, rarity: "common", head: "#ff9900", body: "#b36600" },
    blue: { name: "Ocean Blue", cost: 30, rarity: "common", head: "#00aeff", body: "#0044cc" },

    // RARE (Premium Shades & Contrasts)
    purple: { name: "Cosmic Purple", cost: 60, rarity: "rare", head: "#e040fb", body: "#7b1fa2" },
    pink: { name: "Barbie Pink", cost: 80, rarity: "rare", head: "#ff007f", body: "#ff66b2" },
    mint: { name: "Fresh Mint", cost: 100, rarity: "rare", head: "#10e7dc", body: "#009688" },
    shadow: { name: "Shadow Stealth", cost: 120, rarity: "rare", head: "#555555", body: "#222222" },

    // EPIC (High Price Match Ups)
    magma: { name: "Volcanic Magma", cost: 200, rarity: "epic", head: "#ff3300", body: "#ffaa00" },
    cyber: { name: "Cyber Matrix", cost: 250, rarity: "epic", head: "#39ff14", body: "#003300" },
    frozen: { name: "Absolute Zero", cost: 300, rarity: "epic", head: "#a6ffea", body: "#005f73" },
    bubblegum: { name: "Bubblegum", cost: 350, rarity: "epic", head: "#ff758c", body: "#ff7eb3" },

    // LEGENDARY (Ultra High Pricing & Custom Glows)
    gold: { name: "👑 Pure Gold", cost: 600, rarity: "legendary", head: "#ffdf00", body: "#d4af37" },
    diamond: { name: "💎 Diamond Ice", cost: 850, rarity: "legendary", head: "#ffffff", body: "#bde0fe" },
    rainbow: { name: "🌈 RGB Rainbow", cost: 1200, rarity: "legendary", head: "rainbow_mode", body: "rainbow_mode" }
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

// 15+ Skins List ko display generate karne ka function
function buildShopMenu() {
    const container = document.getElementById("shopItemsContainer");
    container.innerHTML = ""; // reset

    Object.keys(skinsCollection).forEach(id => {
        const item = skinsCollection[id];
        const isUnlocked = unlockedSkins.includes(id);
        const isEquipped = currentSkin === id;
        
        let buttonText = "Buy";
        let buttonClass = "buy-btn";
        if (isEquipped) {
            buttonText = "Equipped";
            buttonClass = "buy-btn equipped";
        } else if (isUnlocked) {
            buttonText = "Select";
        }

        const itemHTML = `
            <div class="shop-item rarity-${item.rarity}">
                <div>
                    <span class="skin-name">${item.name}</span>
                    <span class="skin-price">${isUnlocked ? "Unlocked" : "💰 " + item.cost + " Coins"}</span>
                </div>
                <button class="${buttonClass}" onclick="handleShopClick('${id}', ${item.cost})">${buttonText}</button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHTML);
    });
}

function handleShopClick(id, cost) {
    if (unlockedSkins.includes(id)) {
        currentSkin = id;
        localStorage.setItem("currentSkin", currentSkin);
    } else if (coins >= cost) {
        coins -= cost;
        unlockedSkins.push(id);
        localStorage.setItem("snakeCoins", coins);
        localStorage.setItem("unlockedSkins", JSON.stringify(unlockedSkins));
        document.getElementById("coinCount").innerText = coins;
        currentSkin = id;
        localStorage.setItem("currentSkin", currentSkin);
    } else {
        alert("❌ Coins kam hain! Game khelo aur coins kamao.");
    }
    buildShopMenu();
}

function resetGame() {
    snake = [{ x: 9 * box, y: 10 * box }];
    food = {
        x: Math.floor(Math.random() * 19 + 1) * box,
        y: Math.floor(Math.random() * 19 + 1) * box
    };
    score = 0;
    document.getElementById("currentScore").innerText = score;
    d = undefined;
    clearInterval(game);
}

document.addEventListener("keydown", direction);

function direction(event) {
    if (!gameStarted) return;
    if (event.keyCode == 37 && d != "RIGHT") d = "LEFT";
    else if (event.keyCode == 38 && d != "DOWN") d = "UP";
    else if (event.keyCode == 39 && d != "LEFT") d = "RIGHT";
    else if (event.keyCode == 40 && d != "UP") d = "DOWN";
}

function changeDirection(dir) {
    if (!gameStarted) return;
    if (dir == "LEFT" && d != "RIGHT") d = "LEFT";
    else if (dir == "UP" && d != "DOWN") d = "UP";
    else if (dir == "RIGHT" && d != "LEFT") d = "RIGHT";
    else if (dir == "DOWN" && d != "UP") d = "DOWN";
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x == array[i].x && head.y == array[i].y) return true;
    }
    return false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dynamic Skin Calculation
    let skin = skinsCollection[currentSkin] || skinsCollection["cyan"];
    let headColor = skin.head;
    let bodyColor = skin.body;

    // Rainbow Specially setup logic
    if (currentSkin === "rainbow") {
        let hue = (Date.now() / 10) % 360;
        headColor = `hsl(${hue}, 100%, 50%)`;
        bodyColor = `hsl(${(hue + 30) % 360}, 100%, 45%)`;
    }

    // Snake Body & Muh (Eyes) Drawing Logic
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i == 0 ? headColor : bodyColor;
        ctx.shadowBlur = i == 0 ? 10 : 0;
        ctx.shadowColor = headColor;
        
        ctx.beginPath();
        ctx.arc(snake[i].x + box/2, snake[i].y + box/2, box/2 - 1, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Agar i == 0 hai yani snake ka MUH (Head), toh aankhein draw karein:
        if (i === 0) {
            ctx.fillStyle = "#ffffff"; // Eyes base white
            let eyeSize = 3.5;
            let eyeOffset = 5;

            let eye1 = { x: 0, y: 0 };
            let eye2 = { x: 0, y: 0 };

            // Direction ke hisab se aankhon ka rukh badlega
            if (d === "UP" || d === undefined) {
                eye1 = { x: snake[i].x + eyeOffset, y: snake[i].y + eyeOffset };
                eye2 = { x: snake[i].x + box - eyeOffset, y: snake[i].y + eyeOffset };
            } else if (d === "DOWN") {
                eye1 = { x: snake[i].x + eyeOffset, y: snake[i].y + box - eyeOffset };
                eye2 = { x: snake[i].x + box - eyeOffset, y: snake[i].y + box - eyeOffset };
            } else if (d === "LEFT") {
                eye1 = { x: snake[i].x + eyeOffset, y: snake[i].y + eyeOffset };
                eye2 = { x: snake[i].x + eyeOffset, y: snake[i].y + box - eyeOffset };
            } else if (d === "RIGHT") {
                eye1 = { x: snake[i].x + box - eyeOffset, y: snake[i].y + eyeOffset };
                eye2 = { x: snake[i].x + box - eyeOffset, y: snake[i].y + box - eyeOffset };
            }

            // Draw Eyes White Outer
            ctx.beginPath(); ctx.arc(eye1.x, eye1.y, eyeSize, 0, 2*Math.PI); ctx.fill();
            ctx.beginPath(); ctx.arc(eye2.x, eye2.y, eyeSize, 0, 2*Math.PI); ctx.fill();

            // Draw Black Pupils (Choti eyeball)
            ctx.fillStyle = "#000000";
            ctx.beginPath(); ctx.arc(eye1.x, eye1.y, eyeSize/2, 0, 2*Math.PI); ctx.fill();
            ctx.beginPath(); ctx.arc(eye2.x, eye2.y, eyeSize/2, 0, 2*Math.PI); ctx.fill();
        }
    }

    // Fruit (🍎)
    ctx.font = "16px Arial";
    ctx.textBaseline = "top";
    ctx.fillText("🍎", food.x + 2, food.y + 2);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d == "LEFT") snakeX -= box;
    if (d == "UP") snakeY -= box;
    if (d == "RIGHT") snakeX += box;
    if (d == "DOWN") snakeY += box;

    if (snakeX == food.x && snakeY == food.y) {
        score++;
        coins += 2; // Pro Version me 1 fruit = 2 Coins milenge!
        
        document.getElementById("currentScore").innerText = score;
        document.getElementById("coinCount").innerText = coins;
        
        localStorage.setItem("snakeCoins", coins);

        if(score > savedHighScore) {
            savedHighScore = score;
            localStorage.setItem("snakeHighScore", savedHighScore);
            document.getElementById("highScore").innerText = savedHighScore;
        }

        food = {
            x: Math.floor(Math.random() * 19 + 1) * box,
            y: Math.floor(Math.random() * 19 + 1) * box
        };
    } else {
        snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    if (
        snakeX < 0 || snakeX > canvas.width - box ||
        snakeY < 0 || snakeY > canvas.height - box ||
        collision(newHead, snake)
    ) {
        clearInterval(game);
        gameStarted = false;
        alert("💥 GAME OVER! Score: " + score + " | Total Coins Save Ho Gaye!");
        location.reload();
    }

    snake.unshift(newHead);
}

function startGame(speed) {
    resetGame();
    gameStarted = true;
    document.getElementById("modeMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");
    game = setInterval(draw, speed);
}

resetGame();
draw();
