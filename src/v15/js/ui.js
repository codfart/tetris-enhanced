// =========================
// PAUSE
// =========================
function togglePause() {
    if (gameOver) return;

    paused = !paused;

    if (paused) {
        pausedAt = Date.now();
        pauseBtn.textContent = "RESUME";
        pauseBtn.blur();
    } else {
        if (pausedAt !== null) {
            startTime += Date.now() - pausedAt;
        }

        pausedAt = null;
        pauseBtn.textContent = "PAUSE";

        lastTime = performance.now(); // prevent a giant delta after resuming
    }
}

pauseBtn.addEventListener("click", togglePause);

document.addEventListener("visibilitychange", () => {
    if (document.hidden && !paused && !gameOver) {
        togglePause();
    }
});

window.addEventListener("blur", () => {
    if (!paused && !gameOver) {
        togglePause();
    }
});



// =========================
// Main UI
// =========================
function updateUI(dt = 1) {
    scoreEl.textContent = score;
    linesEl.textContent = linesCleared;
    levelEl.textContent = level;

    const hsMinutes = String(Math.floor(highScoreData.time / 60)).padStart(2, "0");
    const hsSeconds = String(highScoreData.time % 60).padStart(2, "0");
    highScoreTimeEl.textContent = `${hsMinutes}:${hsSeconds}`;
    highScoreLinesEl.textContent = highScoreData.lines;
    highScoreLevelEl.textContent = highScoreData.level;

    // dev mode scores are NEVER saved
    if (!twoByTwoMode && score > highScore) {
        const currentTime = Math.floor(((paused && pausedAt !== null ? pausedAt : Date.now()) - startTime) / 1000);

        highScore = score;
        newHighScoreThisGame = true;

        highScoreData = {
            score: score,
            time: currentTime,
            lines: linesCleared,
            level: level
        };

        localStorage.setItem(
            "tetrisHighScoreData",
            JSON.stringify(highScoreData)
        );
    }
    highScoreEl.textContent = highScore;

    let elapsed;
    
    if (paused && pausedAt !== null) {
        elapsed = Math.floor(( pausedAt - startTime) / 1000);
    } else {
        elapsed = Math.floor((Date.now() - startTime) / 1000);
    }

    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    timeEl.textContent = `${m}:${s}`;

    devModeEl.classList.toggle(
        "active",
        twoByTwoMode
    );

    drawNextPiece(dt);
}