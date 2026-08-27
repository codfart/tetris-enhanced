// =========================
// MOVEMENT
// =========================
function playerMove(dir) {
    player.pos.x += dir;

    if (
        collide(
            arena,
            player
        )
    ) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    const oldMatrix =
        player.matrix.map(
            r => [...r]
        );

    rotate(
        player.matrix,
        dir
    );

    if (
        collide(
            arena,
            player
        )
    ) {
        player.matrix =
            oldMatrix;
    }
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
// HARD DROP
// =========================

function hardDrop() {
    if (
        gameOver ||
        paused ||
        player.hardDropTargetY !== null ||
        clearingRows.length ||
        clearQueue.length
    ) {
        return;
    }

    updateGhostY();

    player.hardDropTargetY =
        player.ghostY;

    player.easingGhostY =
        player.ghostY;

    playSFX(
        "drop",
        0.7
    );
}



// =========================
// RESET PLAYER
// =========================

function resetPlayer() {
    player.matrix =
        nextPiece;

    nextAnimatingOut = true;
    nextOutAnim = 0;

    setTimeout(() => {
        nextPiece =
            randomPiece();
    }, 120);

    player.pos.y = 0;

    player.pos.x =
        Math.floor(
            COLS / 2
        ) -
        Math.floor(
            player.matrix[0].length / 2
        );

    player.easingPos = {
        ...player.pos
    };

    if (settings.animations) {
        player.spawnProgress = 0;
        player.spawnAnimating = true;
        player.spawnStartTime = performance.now();
    } else {
        player.spawnProgress = 1;
        player.spawnAnimating = false;
    }

    updateGhostY();

    player.easingGhostY =
        player.ghostY;

    player.ghostOpacity = 0;
    player.ghostScale = 0.5;
    player.ghostSpawnTime =
        performance.now();

    player.ghostAnimating = true;

    checkDeath();
}



// =========================
// DEATH
// =========================
function checkDeath() {
    if (
        collide(
            arena,
            player
        )
    ) {
        gameOver = true;
        deathAnimation = true;
        highScoreDeathAnimation = newHighScoreThisGame;

        playSFX(
            "gameOver",
            0.9
        );

        playSFX(
            "explode",
            0.8
        );

        shake = 20;

        for (
            let y = 0;
            y < ROWS;
            y++
        ) {
            for (
                let x = 0;
                x < COLS;
                x++
            ) {
                if (arena[y][x]) {

                    for (
                        let i = 0;
                        i < 10;
                        i++
                    ) {
                        if (settings.particles) {
                            deathParticles.push({
                                x:
                                    x * BLOCK +
                                    BLOCK / 2,

                                y:
                                    y * BLOCK +
                                    BLOCK / 2,

                                vx:
                                    (Math.random() - 0.5) * 14,

                                vy:
                                    (Math.random() - 0.5) * 14,

                                rot:
                                    Math.random() *
                                    Math.PI * 2,

                                vr:
                                    (Math.random() - 0.5) *
                                    0.4,

                                size:
                                    BLOCK * 0.7,

                                alpha: 1,

                                color:
                                    COLORS[
                                    arena[y][x]
                                    ]
                            });
                        }
                    }
                }
            }
        }

        if (settings.autoRestart) {
            if (gameOver) {
                restartGame();
            }
        }
    }
}

function updateDeathAnimation(dt) {
    deathProgress += 0.015 * dt;

    ctx.fillStyle =
        "rgba(0,0,0,0.08)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    deathParticles.forEach(p => {

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.35 * dt;
        p.vx *= Math.pow(0.985, dt);
        p.rot += p.vr * dt;
        p.alpha -= 0.012 * dt;

        ctx.save();

        ctx.translate(
            p.x,
            p.y
        );

        ctx.rotate(
            p.rot
        );

        ctx.globalAlpha =
            Math.max(
                0,
                p.alpha
            );

        ctx.fillStyle =
            p.color;

        ctx.fillRect(
            -p.size / 2,
            -p.size / 2,
            p.size,
            p.size
        );

        ctx.restore();

        ctx.globalAlpha = 1;
    });

    deathParticles =
        deathParticles.filter(
            p => p.alpha > 0
        );

    ctx.fillStyle =
        `rgba(0,0,0,${Math.min(
            deathProgress * 0.6,
            0.6
        )})`;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const scale =
        1 +
        Math.sin(
            deathProgress * 8
        ) * 0.05;

    ctx.save();

    ctx.translate(
        canvas.width / 2,
        canvas.height / 2
    );

    ctx.scale(
        scale,
        scale
    );

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "#fff";

    ctx.font =
        "72px 'Micro 5'";

    ctx.fillText(
        "GAME",
        0,
        -25
    );

    ctx.fillText(
        "OVER",
        0,
        45
    );

    ctx.font =
        "28px 'Micro 5'";

    ctx.fillText(
        "PRESS SPACE TO RESTART",
        0,
        95
    );

    ctx.restore();

    if (highScoreDeathAnimation) {
        const t = Math.min(deathProgress / 1.2, 1);

        const pop =
            1 - Math.pow(1 - t, 3);

        const pulse =
            1 +
            Math.sin(deathProgress * 18) * 0.045;

        ctx.save();

        ctx.translate(
            canvas.width / 2,
            canvas.height / 2 - 115
        );

        ctx.scale(
            (0.65 + pop * 0.35) * pulse,
            (0.65 + pop * 0.35) * pulse
        );

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // dark backing
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(
            -125,
            -31,
            250,
            62
        );

        // outline
        ctx.strokeStyle =
            "rgba(255,255,255,0.9)";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            -125,
            -31,
            250,
            62
        );

        // text
        ctx.fillStyle = "#fff";

        ctx.font =
            "42px 'Micro 5'";

        ctx.fillText(
            "NEW HIGH SCORE!",
            0,
            0
        );

        ctx.restore();
    }
}



// =========================
// GRAVITY
// =========================
function getGravitySpeed() {
    // each level is 10 lines.
    //
    // level 0 = 800ms
    // level 1 = 656ms
    // level 2 = 538ms
    // level 3 = 441ms
    // ...
    //
    // eventually bottoms out at 50ms.

    return Math.max(
        MAX_GRAVITY,
        START_GRAVITY *
        Math.pow(
            0.82,
            level
        )
    );
}