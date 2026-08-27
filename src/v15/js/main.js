// =========================
// CONSTANTS
// =========================

let deathAnimation = false;
let autoRestartTimer = null;
let deathProgress = 0;
let deathParticles = [];
let shake = 0;
let highScoreDeathAnimation = false;


// =========================
// GRID
// =========================

function drawGrid() {
    ctx.strokeStyle =
        'rgba(255,255,255,0.05)';

    ctx.lineWidth = 1;

    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(
            x * BLOCK,
            0
        );
        ctx.lineTo(
            x * BLOCK,
            ROWS * BLOCK
        );
        ctx.stroke();
    }

    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(
            0,
            y * BLOCK
        );
        ctx.lineTo(
            COLS * BLOCK,
            y * BLOCK
        );
        ctx.stroke();
    }
}



// =========================
// MAIN LOOP
// =========================

let lastTime = 0;

function update(time = 0) {

    const delta = Math.min(time - lastTime, 100);
    lastTime = time;
    const dt = delta / 16.6667; // 1.0 at 60 FPS

    ctx.save();

    if (settings.shake && shake > 0) {

        canvas.style.transform =
            `translate(
            ${(Math.random() - 0.5) * shake}px,
            ${(Math.random() - 0.5) * shake}px
          )`;

        shake *= Math.pow(0.92, dt);

    } else {
        canvas.style.transform = "";
    }

    // =========================
    // GAME OVER
    // =========================

    if (
        gameOver &&
        deathAnimation
    ) {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        drawGrid();

        drawMatrix(
            arena,
            {
                x: 0,
                y: 0
            }
        );

        updateDeathAnimation(dt);

        ctx.restore();

        requestAnimationFrame(
            update
        );

        return;
    }

    // =========================
    // PAUSED
    // =========================

    if (paused) {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        drawGrid();

        drawMatrix(
            arena,
            {
                x: 0,
                y: 0
            }
        );

        drawMatrix(
            player.matrix,
            player.easingPos
        );

        drawPlacementFlash();

        ctx.save();

        ctx.fillStyle =
            "rgba(0,0,0,0.65)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillStyle =
            "#fff";

        ctx.font =
            "64px 'Micro 5'";

        ctx.fillText(
            "PAUSED",
            canvas.width / 2,
            canvas.height / 2
        );

        ctx.font =
            "28px 'Micro 5'";

        ctx.fillText(
            "PRESS P TO RESUME",
            canvas.width / 2,
            canvas.height / 2 + 55
        );

        ctx.restore();

        updateUI(dt);

        ctx.restore();

        requestAnimationFrame(
            update
        );

        return;
    }

    // =========================
    // NORMAL GAME
    // =========================

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawGrid();

    // level-up green border shine
    drawLevelUpShine(delta);

    // gravity
    if (
        !clearingRows.length &&
        !clearQueue.length &&
        player.hardDropTargetY === null
    ) {

        gravityTimer += delta;

        const gravity =
            getGravitySpeed();

        if (
            gravityTimer >= gravity
        ) {
            playerDrop();
            gravityTimer = 0;
        }
    }

    // smooth movement
    const smoothing = settings.animations
        ? 1 - Math.pow(1 - 0.38, dt * settings.animationSpeed)
        : 1;

    player.easingPos.x +=
        (player.pos.x - player.easingPos.x) * smoothing;

    player.easingPos.y +=
        (player.pos.y - player.easingPos.y) * smoothing;

    if (
        player.hardDropTargetY === null &&
        !clearingRows.length &&
        !clearQueue.length
    ) {
        updateGhostY();
    }

    drawGhost(dt);

    drawMatrix(
        arena,
        {
            x: 0,
            y: 0
        }
    );

    updateSpawnAnimation();

    ctx.save();

    if (settings.animations) {
        const spawnScale =
            0.72 +
            player.spawnProgress * 0.28;

        const spawnAlpha =
            0.25 +
            player.spawnProgress * 0.75;

        const centerX =
            (
                player.easingPos.x +
                player.matrix[0].length / 2
            ) * BLOCK;

        const centerY =
            (
                player.easingPos.y +
                player.matrix.length / 2
            ) * BLOCK;

        ctx.translate(
            centerX,
            centerY
        );

        ctx.scale(
            spawnScale,
            spawnScale
        );

        ctx.translate(
            -centerX,
            -centerY
        );

        ctx.globalAlpha =
            spawnAlpha;
    }

    drawMatrix(
        player.matrix,
        player.easingPos
    );

    ctx.restore();

    ctx.globalAlpha = 1;

    // placement flash is drawn on top
    // of the placed blocks
    drawPlacementFlash();

    updateParticles(dt);

    updateLineClear(delta);

    if (
        !clearingRows.length &&
        !clearQueue.length
    ) {
        animateHardDrop(dt);
    }

    updateUI(dt);

    ctx.restore();

    requestAnimationFrame(
        update
    );
}



// =========================
// RESTART
// =========================

function restartGame() {
    if (autoRestartTimer !== null) {
        clearTimeout(autoRestartTimer);
        autoRestartTimer = null;
    }

    // holding ; while restarting enables
    // I-only dev mode
    twoByTwoMode =
        semicolonHeld;

    for (
        let y = 0;
        y < ROWS;
        y++
    ) {
        arena[y].fill(0);
    }

    score = 0;
    linesCleared = 0;
    level = 0;

    gameOver = false;
    paused = false;
    pausedAt = null;

    deathAnimation = false;
    deathProgress = 0;
    deathParticles = [];
    highScoreDeathAnimation = false;
    newHighScoreThisGame = false;

    particles = [];

    placementFlashCells = [];

    clearingRows = [];
    clearQueue = [];

    clearTimer = 0;
    pendingClearCount = 0;
    lastClearedRow = null;

    gravityTimer = 0;

    player.hardDropTargetY = null;

    tgm3 =
        tgm3Randomizer();

    nextPiece =
        twoByTwoMode
            ? createPiece("I")
            : createPiece(
                tgm3.next().value
            );

    pauseBtn.textContent =
        "PAUSE";

    startTime =
        Date.now();

    lastTime =
        performance.now();

    resetPlayer();

    updateUI();
}



// =========================
// INPUT
// =========================
document.addEventListener(
    "keydown",
    e => {
        if (e.code === "Space") {
            e.preventDefault();
        }

        if (
            e.code === "Semicolon"
        ) {
            semicolonHeld = true;
        }

        if (gameOver) {

            if (
                e.code === "Space"
            ) {
                restartGame();
            }

            return;
        }

        if (
            e.key.toLowerCase() === "p"
        ) {
            togglePause();
            return;
        }

        if (paused) return;

        if (
            e.key === "ArrowLeft"
        ) {
            playerMove(-1);
        }

        if (
            e.key === "ArrowRight"
        ) {
            playerMove(1);
        }

        if (
            e.key === "ArrowDown"
        ) {
            playerDrop();
        }

        if (
            e.key === "ArrowUp"
        ) {
            playerRotate(1);
        }

        if (
            e.code === "Space"
        ) {
            hardDrop();
        }
    }
);

document.addEventListener(
    "keyup",
    e => {

        if (
            e.code === "Semicolon"
        ) {
            semicolonHeld = false;
        }
    }
);



// =========================
// START
// =========================
resetPlayer();
update();