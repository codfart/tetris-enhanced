// =========================
// DEATH
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