function drawBlock(x, y, color) {
    const px = x * BLOCK;
    const py = y * BLOCK;

    ctx.fillStyle = color;
    ctx.fillRect(
        px,
        py,
        BLOCK,
        BLOCK
    );

    ctx.strokeStyle =
        "rgba(255,255,255,0.2)";

    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(
        px + 1,
        py + BLOCK - 1
    );
    ctx.lineTo(
        px + 1,
        py + 1
    );
    ctx.lineTo(
        px + BLOCK - 1,
        py + 1
    );
    ctx.stroke();

    ctx.strokeStyle =
        "rgba(0,0,0,0.2)";

    ctx.beginPath();
    ctx.moveTo(
        px + BLOCK - 1,
        py + 1
    );
    ctx.lineTo(
        px + BLOCK - 1,
        py + BLOCK - 1
    );
    ctx.lineTo(
        px + 1,
        py + BLOCK - 1
    );
    ctx.stroke();

    ctx.fillStyle =
        "rgba(255,255,255,.08)";

    ctx.fillRect(
        px + 4,
        py + 4,
        BLOCK - 8,
        BLOCK - 8
    );
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (!value) return;

            drawBlock(
                x + offset.x,
                y + offset.y,
                COLORS[value]
            );

            if (
                clearingRows.includes(
                    y + offset.y
                )
            ) {
                const flash =
                    Math.sin(
                        performance.now() * 0.06
                    ) * 0.5 + 0.5;

                ctx.fillStyle =
                    `rgba(255,255,255,${flash})`;

                ctx.fillRect(
                    (x + offset.x) * BLOCK,
                    (y + offset.y) * BLOCK,
                    BLOCK,
                    BLOCK
                );
            }
        });
    });
}




// =========================
// LINE CLEAR
// =========================

let clearingRows = [];
let clearQueue = [];
let clearTimer = 0;

const CLEAR_DELAY = 55;

let lastClearedRow = null;
let pendingClearCount = 0;

function sweep() {
    if (
        clearingRows.length ||
        clearQueue.length
    ) {
        return;
    }

    const rows = [];

    for (
        let y = arena.length - 1;
        y >= 0;
        y--
    ) {
        if (
            arena[y].every(
                v => v !== 0
            )
        ) {
            rows.push(y);
        }
    }

    if (!rows.length) return;

    pendingClearCount =
        rows.length;

    clearQueue = [...rows];

    clearNextRow();
}

function clearNextRow() {

    let row = -1;

    for (
        let y = arena.length - 1;
        y >= 0;
        y--
    ) {
        if (
            arena[y].every(
                v => v !== 0
            )
        ) {
            row = y;
            break;
        }
    }

    if (row === -1) {
        finishLineClear();
        return;
    }

    lastClearedRow = row;
    clearingRows = [row];

    clearTimer = CLEAR_DELAY;

    shake = 5;

    // this sound happens once per individual
    // row animation, as before
    playSFX(
        "lineClear",
        0.8
    );

    spawnParticles(row);

    canvas.animate(
        [
            { transform: "scale(1)" },
            { transform: "scale(1.025)" },
            { transform: "scale(1)" }
        ],
        {
            duration: CLEAR_DELAY,
            easing: "ease-out"
        }
    );
}

function updateLineClear(delta) {
    if (!clearingRows.length) {
        return;
    }

    clearTimer -= delta;

    if (clearTimer > 0) {
        return;
    }

    const row =
        lastClearedRow;

    arena.splice(
        row,
        1
    );

    arena.unshift(
        new Array(COLS).fill(0)
    );

    clearingRows = [];
    lastClearedRow = null;

    setTimeout(() => {
        clearNextRow();
    }, 15);
}
function finishLineClear() {
    const totalCleared =
        pendingClearCount;

    if (totalCleared <= 0) {
        resetPlayer();
        return;
    }

    // four lines at once = TETRIS!
    if (totalCleared === 4) {
        playSFX("tetris", 0.9);
    }

    linesCleared += totalCleared;

    // level increases every 10 lines.
    // e.g. 0-9 = level 0,
    //      10-19 = level 1,
    //      20-29 = level 2
    const oldLevel = level;

    level =
        Math.floor(
            linesCleared / 10
        );

    // level-up effects
    if (level > oldLevel) {
        setTimeout(() => {
            playSFX("clear", 1.0);

            if (settings.speedUpAnimation) {
                levelUpShine = 1;
            }
        }, 500);
    }

    const lineScore =
        [
            0,
            100,
            300,
            500,
            800
        ][
        Math.min(
            totalCleared,
            4
        )
        ];

    const earnedScore =
        lineScore *
        (level + 1);

    score += earnedScore;

    showScorePopup(
        earnedScore,
        totalCleared
    );

    pendingClearCount = 0;
    lastClearedRow = null;

    clearingRows = [];
    clearQueue = [];

    resetPlayer();
}



// =========================
// PLAYER DROP
// =========================

function playerDrop() {
    if (
        gameOver ||
        paused ||
        player.hardDropTargetY !== null ||
        clearingRows.length ||
        clearQueue.length
    ) {
        return;
    }

    player.pos.y++;

    if (
        collide(
            arena,
            player
        )
    ) {
        player.pos.y--;

        // flash BEFORE the piece becomes
        // part of the board
        startPlacementFlash();

        merge(
            arena,
            player
        );

        sweep();

        if (
            !clearingRows.length &&
            !clearQueue.length
        ) {
            playSFX(
                "place",
                0.65
            );

            resetPlayer();
        }
    }

    gravityTimer = 0;
}

// =========================
// HARD DROP (ANIMATION)
// =========================
function animateHardDrop(dt) {
    if (
        player.hardDropTargetY === null
    ) {
        return false;
    }

    const dy =
        player.hardDropTargetY -
        player.pos.y;

    if (
        Math.abs(dy) < 0.05
    ) {
        player.pos.y =
            player.hardDropTargetY;

        // flash at the final landing position
        startPlacementFlash();

        merge(
            arena,
            player
        );

        sweep();

        if (!clearingRows.length) {
            playSFX(
                "place",
                0.65
            );

            resetPlayer();
        }

        player.hardDropTargetY = null;

        return false;
    }

    const hardDropSmoothing = settings.animations
        ? 1 - Math.pow(1 - 0.3, dt * settings.animationSpeed)
        : 1;

    player.pos.y += dy * hardDropSmoothing;

    return true;
}



// =========================
// GHOST
// =========================
function drawGhost(dt) {

    if (
        player.hardDropTargetY === null
    ) {
        const ghostSmoothing = settings.animations
            ? 1 - Math.pow(1 - 0.2, dt * settings.animationSpeed)
            : 1;

        player.easingGhostY +=
            (
                player.ghostY -
                player.easingGhostY
            ) * ghostSmoothing;
    }

    if (player.ghostAnimating) {

        const elapsed =
            performance.now() -
            player.ghostSpawnTime;

        const ghostDuration =
            animationDuration(100);

        const t =
            ghostDuration <= 0
                ? 1
                : Math.min(
                    elapsed / ghostDuration,
                    1
                );

        const ease =
            1 -
            Math.pow(
                1 - t,
                3
            );

        player.ghostScale =
            0.8 +
            ease * 0.2;

        player.ghostOpacity =
            ease * 0.2;

        if (t >= 1) {
            player.ghostAnimating = false;
            player.ghostScale = 1;
            player.ghostOpacity = 0.2;
        }

    } else {

        const opacitySmoothing = settings.animations
            ? 1 - Math.pow(1 - 0.12, dt * settings.animationSpeed)
            : 1;

        player.ghostOpacity +=
            (
                0.2 -
                player.ghostOpacity
            ) * opacitySmoothing;
    }

    ctx.save();

    const centerX =
        (
            player.easingPos.x +
            player.matrix[0].length / 2
        ) * BLOCK;

    const centerY =
        (
            player.easingGhostY +
            player.matrix.length / 2
        ) * BLOCK;

    ctx.translate(
        centerX,
        centerY
    );

    ctx.scale(
        player.ghostScale,
        player.ghostScale
    );

    ctx.translate(
        -centerX,
        -centerY
    );

    ctx.globalAlpha =
        player.ghostOpacity;

    drawMatrix(
        player.matrix,
        {
            x: player.easingPos.x,
            y: player.easingGhostY
        }
    );

    ctx.restore();

    ctx.globalAlpha = 1;
}

function updateGhostY() {
    let gy =
        player.pos.y;

    while (
        !collide(
            arena,
            {
                ...player,
                pos: {
                    x: player.pos.x,
                    y: gy + 1
                }
            }
        )
    ) {
        gy++;
    }

    player.ghostY = gy;
}