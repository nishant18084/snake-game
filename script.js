const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
let snake, food, score, d, game;
let gameStarted = false;

// "Start Game" par click karne par modes dikhane ke liye
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

    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i == 0 ? "#4CAF50" : "#8BC34A";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = "#111";
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    ctx.fillStyle = "#FF5722";
    ctx.fillRect(food.x, food.y, box, box);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d == "LEFT") snakeX -= box;
    if (d == "UP") snakeY -= box;
    if (d == "RIGHT") snakeX += box;
    if (d == "DOWN") snakeY += box;

    if (snakeX == food.x && snakeY == food.y) {
        score++;
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
        alert("Game Over! Aapka Score: " + score);
        location.reload();
    }

    snake.unshift(newHead);
}

function startGame(speed, element) {
    resetGame();
    gameStarted = true;
    
    // Mode select hote hi Mode Menu chupayein aur Game Area dikhayein
    document.getElementById("modeMenu").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");

    game = setInterval(draw, speed);
}
