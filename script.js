// ==========================================
// ENGINE 2: HILL CLIMB RACING MODE (NO FUEL)
// ==========================================
let carPhysics = { x: 50, y: 200, vy: 0, vx: 2, angle: 0, vAngle: 0 };
let terrainPoints = [];

function startRacingGame() {
    score = 0; isPaused = false;
    carPhysics = { x: 60, y: 200, vy: 0, vx: 3, angle: 0, vAngle: 0 };
    
    // Procedural 2D Mountain Terrain Generation
    terrainPoints = [];
    let currentY = 300;
    for (let i = 0; i < 500; i++) {
        // Har 40px par pahaad upar-niche hoga
        currentY += Math.sin(i * 0.1) * 25 + (Math.random() * 15 - 7);
        if (currentY < 180) currentY = 180;
        if (currentY > 360) currentY = 360;
        
        // Raste me ab sirf Coins (💰) milenge
        let item = "none";
        if (i > 5 && i % 15 === 0) item = "coin";

        terrainPoints.push({ x: i * 40, y: currentY, item: item, itemCollected: false });
    }

    document.getElementById("currentScore").innerText = score;
    document.getElementById("hubMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");
    gameStarted = true;
    game = setInterval(drawRacing, currentSpeed);
}

// Terrain Ka Y nikalne ka helper function
function getTerrainY(carX) {
    for (let i = 0; i < terrainPoints.length - 1; i++) {
        if (carX >= terrainPoints[i].x && carX <= terrainPoints[i+1].x) {
            let t = (carX - terrainPoints[i].x) / (terrainPoints[i+1].x - terrainPoints[i].x);
            return terrainPoints[i].y + t * (terrainPoints[i+1].y - terrainPoints[i].y);
        }
    }
    return 300;
}

function drawRacing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Camera follow mechanics
    let offsetX = carPhysics.x - 80;

    // 1. DRAW SKY BACKGROUND
    ctx.fillStyle = "#1a0b2e"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. DRAW MOUNTAIN TERRAIN
    ctx.fillStyle = "#00f2fe";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    for (let i = 0; i < terrainPoints.length; i++) {
        let screenX = terrainPoints[i].x - offsetX;
        if (screenX >= -40 && screenX <= canvas.width + 40) {
            ctx.lineTo(screenX, terrainPoints[i].y);
            
            // Draw Coins on Hills
            if (terrainPoints[i].item === "coin" && !terrainPoints[i].itemCollected) {
                ctx.font = "14px Arial";
                ctx.fillText("💰", screenX - 5, terrainPoints[i].y - 20);

                // Hitbox detection for coins
                if (Math.abs(carPhysics.x - terrainPoints[i].x) < 25) {
                    coins += 10; score += 20;
                    localStorage.setItem("snakeCoins", coins);
                    terrainPoints[i].itemCollected = true;
                    document.getElementById("coinCount").innerText = coins;
                    document.getElementById("currentScore").innerText = score;
                }
            }
        }
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 242, 254, 0.25)"; ctx.fill(); 
    ctx.strokeStyle = "#00f2fe"; ctx.lineWidth = 3; ctx.stroke(); 

    // 3. APPLIED 2D PHYSICS (GRAVITY & ACCELERATION)
    let groundY = getTerrainY(carPhysics.x) - 15; 
    
    // Gravity Logic
    if (carPhysics.y < groundY) {
        carPhysics.vy += 0.5; 
        carPhysics.angle += carPhysics.vAngle; 
    } else {
        carPhysics.y = groundY;
        carPhysics.vy = 0;
        let nextGroundY = getTerrainY(carPhysics.x + 5);
        carPhysics.angle = Math.atan2(nextGroundY - groundY, 5);
        carPhysics.vAngle *= 0.5; 
    }

    // Move forward continuously
    carPhysics.x += carPhysics.vx;
    carPhysics.y += carPhysics.vy;
    score++; document.getElementById("currentScore").innerText = Math.floor(score/10);

    // 4. RENDER HILL CLIMB CAR WITH ROTATION
    ctx.save();
    ctx.translate(carPhysics.x - offsetX, carPhysics.y);
    ctx.rotate(carPhysics.angle);

    // Car Body Frame
    ctx.fillStyle = "#ff0055";
    ctx.fillRect(-20, -12, 40, 14); 
    ctx.fillStyle = "#00f2fe";
    ctx.fillRect(-8, -22, 18, 10); 

    // Wheels
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-12, 4, 6, 0, 2*Math.PI); ctx.fill(); 
    ctx.beginPath(); ctx.arc(12, 4, 6, 0, 2*Math.PI); ctx.fill();  
    ctx.restore();

    // CRASH CHECK: Head crash condition stays for fun!
    let normalizedAngle = Math.abs(carPhysics.angle % (2 * Math.PI));
    if (carPhysics.y >= groundY && (normalizedAngle > 1.8 && normalizedAngle < 4.5)) {
        clearInterval(game); gameStarted = false;
        alert("💥 HEAD CRASHED! Game Over. Score: " + Math.floor(score/10));
        if (score > racingHighScore) localStorage.setItem("racingHighScore", Math.floor(score/10));
        location.reload();
    }
}

// KEY CONTROLS
document.addEventListener("keydown", e => {
    if (!gameStarted || isPaused || activeGame !== "racing") return;
    if (e.keyCode == 38 || e.keyCode == 39) { 
        carPhysics.vx = 4.5;
    }
    if (e.keyCode == 37) { 
        carPhysics.vAngle = -0.07;
    }
});
document.addEventListener("keyup", e => {
    if (activeGame === "racing") carPhysics.vx = 2.5; 
});

// Mobile Controls handling mapping
function handleControl(dir) {
    if (!gameStarted || isPaused || activeGame !== "racing") return;
    if (dir === "UP") { carPhysics.vx = 4.5; setTimeout(() => { carPhysics.vx = 2.5; }, 400); }
    if (dir === "LEFT") carPhysics.vAngle = -0.08;
    if (dir === "RIGHT") carPhysics.vAngle = 0.08;
}
