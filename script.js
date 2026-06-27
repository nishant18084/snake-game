const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
let snake, food, score, d, game;
let gameStarted = false;

let savedHighScore = localStorage.getItem("snakeHighScore") || 0;
document.getElementById("highScore").innerText = savedHighScore;

function showModes() {
    document.getElementById("startMenu").classList.add("hidden");
    document.getElementById("modeMenu").classList.remove("hidden");
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

    // Grid System
    ctx.strokeStyle = "rgba(0, 242, 254, 0.03)";
    for(let i=0; i<canvas.width; i+=box) {
        ctx.strokeRect(i, 0, box, canvas.height);
        ctx.strokeRect(0, i, canvas.width, box);
    }

    // Updated Snake Design (Rounded corners for a modern style)
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i == 0 ? "#00f2fe" : "#0072ff";
        ctx.shadowBlur = i == 0 ? 8 : 0;
        ctx.shadowColor = "#00f2fe";
        
        // Circular / Rounded effect for snake bodies
        ctx.beginPath();
        ctx.arc(snake[i].x + box/2, snake[i].y + box/2, box/2 - 1, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Food as a Fruit (🍎 Apple Emoji)
    ctx.font = "16px Arial";
    ctx.textBaseline = "top";
    // thoda center text alignment
    ctx.fillText("🍎", food.x + 2, food.y + 2);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d == "LEFT") snakeX -= box;
    if (d == "UP") snakeY -= box;
    if (d == "RIGHT") snakeX += box;
    if (d == "DOWN") snakeY += box;

    if (snakeX == food.x && snakeY == food.y) {
        score++;
        document.getElementById("currentScore").innerText = score;
        
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
        alert("💥 GAME OVER! Your Score: " + score);
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
                          
