// ==========================================
// ENGINE 2: 3D HORIZON HILL RACING MODE (NO FUEL)
// ==========================================
let trackPosition = 0;
let playerX = 0; // -1 se 1 tak (road ke left/right)
let carSpeed = 0;
const maxSpeed = 20;

// 3D Track generation (pahaad aur curves)
let trackSegments = [];
function startRacingGame() {
    score = 0; isPaused = false; trackPosition = 0; playerX = 0; carSpeed = 5;
    trackSegments = [];
    
    // 1000 segments lambi 3D road banayein pahaad aur mod ke sath
    for (let i = 0; i < 1000; i++) {
        let curve = 0;
        let hill = 0;
        
        if (i > 100 && i < 300) curve = 2 * Math.sin(i * 0.05); // Mod (Curves)
        if (i > 200 && i < 500) hill = 40 * Math.sin(i * 0.03); // Unche-neeche pahaad
        if (i > 600 && i < 800) curve = -3 * Math.cos(i * 0.04);
        
        trackSegments.push({ curve: curve, hill: hill, coins: (i % 20 === 0) ? (Math.random() > 0.5 ? 1 : -1) : 0, coinCollected: false });
    }

    document.getElementById("currentScore").innerText = score;
    document.getElementById("hubMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");
    gameStarted = true;
    game = setInterval(drawRacing, currentSpeed);
}

function drawRacing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Move forward automatically
    trackPosition += carSpeed;
    score += Math.floor(carSpeed / 2);
    document.getElementById("currentScore").innerText = Math.floor(score/10);

    let startSegment = Math.floor(trackPosition / 20) % trackSegments.length;
    let percent = (trackPosition % 20) / 20;
    
    // 1. DRAW 3D SKY & HILL BACKGROUND
    let currentHill = trackSegments[startSegment].hill;
    ctx.fillStyle = "#0c051a"; ctx.fillRect(0, 0, canvas.width, canvas.height); // Sky
    ctx.fillStyle = "#0a1c28"; ctx.fillRect(0, 160 + currentHill * 0.5, canvas.width, 240 - currentHill * 0.5); // Distant mountains

    // 2. RENDER 3D PSEUDO ROAD LINES (Back to Front)
    let maxProjectedSegments = 40; // Kitni door tak road dikhegi
    let dx = 0;
    let camH = 1000; // Camera height

    for (let i = maxProjectedSegments; i > 0; i--) {
        let segIndex = (startSegment + i) % trackSegments.length;
        let seg = trackSegments[segIndex];
        
        // Perspective Math Calculations for 3D depth
        let p1_scale = camH / (camH + (i - percent) * 20);
        let p2_scale = camH / (camH + (i - 1 - percent) * 20);
        
        let y1 = 160 + currentHill * 0.5 + (240 - currentHill * 0.5) * (i - percent) / maxProjectedSegments;
        let y2 = 160 + currentHill * 0.5 + (240 - currentHill * 0.5) * (i - 1 - percent) / maxProjectedSegments;
        
        // Curve accumulating
        dx += seg.curve * 3;
        
        let w1 = canvas.width * 0.7 * p1_scale;
        let w2 = canvas.width * 0.7 * p2_scale;
        let x1 = canvas.width / 2 + dx;
        let x2 = canvas.width / 2 + dx + trackSegments[(startSegment+i-1)%trackSegments.length].curve*3;

        // Striped Grass Effect (Rumble Strip)
        ctx.fillStyle = (segIndex % 4 < 2) ? "#0a2f1d" : "#0f4229";
        ctx.fillRect(0, y2, canvas.width, y1 - y2);

        // 3D Road polygon paint
        ctx.fillStyle = (segIndex % 4 < 2) ? "#222" : "#2a2a2a";
        ctx.beginPath();
        ctx.moveTo(x1 - w1, y1); ctx.lineTo(x1 + w1, y1);
        ctx.lineTo(x2 + w2, y2); ctx.lineTo(x2 - w2, y2);
        ctx.fill();

        // 3D White lines on Road edges
        ctx.fillStyle = (segIndex % 4 < 2) ? "#fff" : "#ff0055";
        ctx.fillRect(x1 - w1 - 3, y1, 6, y2 - y1);
        ctx.fillRect(x1 + w1 - 3, y1, 6, y2 - y1);

        // Render 3D Floating Coins on Road
        if (seg.coins !== 0 && !seg.coinCollected && i === 12) {
            let coinScreenX = x1 + (seg.coins * w1 * 0.5);
            ctx.font = `${Math.floor(20 * p1_scale) + 12}px Arial`;
            ctx.fillText("💰", coinScreenX, y1 - 10);

            // Hitbox checks for player taking the coins
            if (Math.abs(playerX - (seg.coins * 0.7)) < 0.4) {
                coins += 15;
                localStorage.setItem("snakeCoins", coins);
                seg.coinCollected = true;
                document.getElementById("coinCount").innerText = coins;
            }
        }
    }

    // 3. RENDER PLAYER CYBER CAR (Fixed in Foreground)
    let playerScreenX = canvas.width / 2 + (playerX * canvas.width * 0.35);
    let carY = 340;

    ctx.save();
    // Acceleration tilt shake effect
    let shake = (Math.random() - 0.5) * (carSpeed * 0.1);
    ctx.translate(playerScreenX + shake, carY);

    // Sports Car Body
    ctx.fillStyle = "#ff0055"; ctx.fillRect(-25, -5, 50, 18); // Main block
    ctx.fillStyle = "#00f2fe"; ctx.fillRect(-18, -15, 36, 11); // Cabin windshield
    ctx.fillStyle = "#fff"; ctx.fillRect(-22, 10, 8, 4); ctx.fillRect(14, 10, 8, 4); // Rear Lights
    
    // Wheels 3D angle view
    ctx.fillStyle = "#111";
    ctx.fillRect(-28, 2, 6, 12); ctx.fillRect(22, 2, 6, 12); 
    ctx.restore();

    // Auto Center correction to stay on road safely
    if (playerX > 1.2 || playerX < -1.2) {
        carSpeed = Math.max(2, carSpeed - 0.5); // Grass slows you down
    } else if (carSpeed < maxSpeed) {
        carSpeed += 0.05; // Auto accelerate
    }
}

// KEYBOARD EVENTS OVERLAY
document.addEventListener("keydown", e => {
    if (!gameStarted || isPaused || activeGame !== "racing") return;
    if (e.keyCode == 37) playerX -= 0.12; // Steer Left
    if (e.keyCode == 39) playerX += 0.12; // Steer Right
});

// MOBILE BUTTON HANDLING OVERLAY
function handleControl(dir) {
    if (!gameStarted || isPaused || activeGame !== "racing") return;
    if (dir === "LEFT") playerX -= 0.18;
    if (dir === "RIGHT") playerX += 0.18;
    if (dir === "UP") { if(carSpeed < maxSpeed) carSpeed += 3; } // Nitro burst
}
