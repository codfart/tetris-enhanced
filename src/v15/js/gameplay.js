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