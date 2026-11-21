const $ = id => document.getElementById(id);

const TIME_KEY = "ninaivu-study-device-total-seconds";
const BEST_KEY = "ninaivu-study-device-runner-best";

let totalSeconds = Number(localStorage.getItem(TIME_KEY) || 0);
let isRunning = false;
let isGameMode = false;
let lastTick = Date.now();

let stopHoldTimer = null;
let resetHoldTimer = null;
let stopTriggeredLong = false;
let resetTriggeredLong = false;

const startButton = $("start-button");
const stopButton = $("stop-button");
const resetButton = $("reset-button");

const timerView = $("timer-view");
const gameView = $("game-view");
const timeDisplay = $("time-display");
const screenStatus = $("screen-status");
const screenCaption = $("screen-caption");
const sessionMessage = $("session-message");
const interactionHint = $("interaction-hint");

function formatTime(total) {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
}

function renderTimer() {
    timeDisplay.textContent = formatTime(totalSeconds);
    screenStatus.innerHTML = `<i></i> ${isRunning ? "LIVE" : "IDLE"}`;
    screenCaption.textContent = "STUDY TIME";
    sessionMessage.textContent = isRunning ? "SESSION IN PROGRESS" : "READY WHEN YOU ARE";
    $("progress-fill").style.width = `${(totalSeconds % 3600) / 36}%`;
}

function saveTime() {
    localStorage.setItem(TIME_KEY, String(totalSeconds));
}

function startStudyTimer() {
    if (isGameMode) {
        jump();
        return;
    }
    if (!isRunning) {
        isRunning = true;
        lastTick = Date.now();
        renderTimer();
    }
}

function pauseStudyTimer() {
    isRunning = false;
    renderTimer();
}

function resetStudyTimer() {
    isRunning = false;
    totalSeconds = 0;
    saveTime();
    renderTimer();
    interactionHint.textContent = "TIMER RESET · READY FOR A FRESH SESSION";
    window.setTimeout(() => {
        interactionHint.textContent = "START to begin · STOP to pause · hold STOP 3s for game · hold RESET 2s to clear";
    }, 2200);
}

function enterGameMode() {
    isRunning = false;
    isGameMode = true;
    timerView.hidden = true;
    gameView.hidden = false;
    screenStatus.innerHTML = "<i></i> ARCADE";
    interactionHint.textContent = "GAME MODE · START to jump · STOP to return to the timer";
    resetGame();
    renderTimer();
}

function exitGameMode() {
    isGameMode = false;
    gameView.hidden = true;
    timerView.hidden = false;
    interactionHint.textContent = "START to begin · STOP to pause · hold STOP 3s for game · hold RESET 2s to clear";
    renderTimer();
}

startButton.addEventListener("click", startStudyTimer);

/* STOP: quick press pauses/exits; a continuous 3-second hold enters game mode. */
stopButton.addEventListener("pointerdown", event => {
    if (event.button !== undefined && event.button !== 0) return;
    stopTriggeredLong = false;
    stopButton.classList.add("is-pressed");
    clearTimeout(stopHoldTimer);

    stopHoldTimer = window.setTimeout(() => {
        stopTriggeredLong = true;
        if (!isGameMode) enterGameMode();
    }, 3000);
});

function finishStopPress() {
    clearTimeout(stopHoldTimer);
    stopButton.classList.remove("is-pressed");

    if (stopTriggeredLong) return;

    if (isGameMode) {
        exitGameMode();
    } else {
        pauseStudyTimer();
    }
}
stopButton.addEventListener("pointerup", finishStopPress);
stopButton.addEventListener("pointercancel", finishStopPress);
stopButton.addEventListener("lostpointercapture", finishStopPress);

/* RESET: only a deliberate 2-second hold clears accumulated study time. */
resetButton.addEventListener("pointerdown", event => {
    if (event.button !== undefined && event.button !== 0) return;
    resetTriggeredLong = false;
    resetButton.classList.add("is-pressed");
    clearTimeout(resetHoldTimer);

    resetHoldTimer = window.setTimeout(() => {
        resetTriggeredLong = true;
        if (!isGameMode) resetStudyTimer();
        else resetGame();
    }, 2000);
});

function finishResetPress() {
    clearTimeout(resetHoldTimer);
    resetButton.classList.remove("is-pressed");
    if (!resetTriggeredLong) {
        interactionHint.textContent = "HOLD RESET FOR 2 SECONDS TO CLEAR THE TIMER";
        window.setTimeout(() => {
            if (!isGameMode) interactionHint.textContent = "START to begin · STOP to pause · hold STOP 3s for game · hold RESET 2s to clear";
        }, 1800);
    }
}
resetButton.addEventListener("pointerup", finishResetPress);
resetButton.addEventListener("pointercancel", finishResetPress);
resetButton.addEventListener("lostpointercapture", finishResetPress);

/* Keep the timer running accurately even if the tab sleeps briefly. */
window.setInterval(() => {
    const now = Date.now();
    if (isRunning && !isGameMode) {
        const elapsed = Math.floor((now - lastTick) / 1000);
        if (elapsed > 0) {
            totalSeconds += elapsed;
            lastTick += elapsed * 1000;
            saveTime();
            renderTimer();
        }
    } else {
        lastTick = now;
    }
}, 200);

/* Small original monochrome runner, built into the device's game mode. */
const canvas = $("game-canvas");
const ctx = canvas.getContext("2d");
let player;
let obstacle;
let score;
let bestScore;
let gameRunning;
let gameOver;
let gameSpeed;
let lastFrame = 0;
let animationFrame = 0;

function resetGame() {
    player = { x: 34, y: 75, velocityY: 0, grounded: true };
    obstacle = { x: 340, width: 13, height: 22 };
    score = 0;
    bestScore = Number(localStorage.getItem(BEST_KEY) || 0);
    gameRunning = false;
    gameOver = false;
    gameSpeed = 2.5;
    $("game-score").textContent = "00000";
    $("game-message").textContent = "PRESS START TO PLAY";
    drawGame();
    lastFrame = 0;
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(gameLoop);
}

function jump() {
    if (!isGameMode) return;
    if (gameOver) {
        resetGame();
        gameRunning = true;
        $("game-message").textContent = " ";
    } else if (!gameRunning) {
        gameRunning = true;
        $("game-message").textContent = " ";
    }
    if (player.grounded) {
        player.velocityY = -7.5;
        player.grounded = false;
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#d9e8d0";
    ctx.fillRect(0, 88, canvas.width, 1);

    /* Tiny pixel runner */
    ctx.fillRect(player.x + 5, player.y - 20, 11, 13);
    ctx.fillRect(player.x + 2, player.y - 12, 5, 9);
    ctx.fillRect(player.x + 14, player.y - 10, 5, 7);
    ctx.fillRect(player.x + 5, player.y - 7, 4, 7);
    ctx.fillRect(player.x + 14, player.y - 4, 4, 4);
    ctx.fillStyle = "#101810";
    ctx.fillRect(player.x + 13, player.y - 17, 2, 2);

    /* Pixel cactus obstacle */
    ctx.fillStyle = "#a8c49d";
    ctx.fillRect(obstacle.x, 88 - obstacle.height, obstacle.width, obstacle.height);
    ctx.fillRect(obstacle.x - 5, 70, 5, 4);
    ctx.fillRect(obstacle.x - 5, 65, 3, 6);
    ctx.fillRect(obstacle.x + obstacle.width, 76, 5, 4);
    ctx.fillRect(obstacle.x + obstacle.width + 2, 70, 3, 7);
}

function gameLoop(timestamp) {
    if (!isGameMode) return;
    if (!lastFrame) lastFrame = timestamp;
    const delta = Math.min(2, (timestamp - lastFrame) / 16.67);
    lastFrame = timestamp;

    if (gameRunning && !gameOver) {
        player.velocityY += 0.42 * delta;
        player.y += player.velocityY * delta;

        if (player.y >= 75) {
            player.y = 75;
            player.velocityY = 0;
            player.grounded = true;
        }

        obstacle.x -= gameSpeed * delta;
        if (obstacle.x < -22) {
            obstacle.x = canvas.width + 20 + Math.random() * 65;
            score += 1;
            gameSpeed = Math.min(5.2, 2.5 + score * 0.045);
            $("game-score").textContent = String(score).padStart(5, "0");
        }

        const collided =
            player.x + 17 > obstacle.x + 2 &&
            player.x + 3 < obstacle.x + obstacle.width - 1 &&
            player.y > 88 - obstacle.height + 4;

        if (collided) {
            gameRunning = false;
            gameOver = true;
            $("game-message").textContent = "GAME OVER · START TO RETRY";
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem(BEST_KEY, String(bestScore));
            }
        }
    }

    drawGame();
    animationFrame = requestAnimationFrame(gameLoop);
}

canvas.addEventListener("pointerdown", jump);
document.addEventListener("keydown", event => {
    if (!isGameMode) return;
    if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
    }
    if (event.code === "Escape") exitGameMode();
});

renderTimer();
