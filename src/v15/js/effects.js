// =========================
// LEVEL-UP BORDER SHINE
// =========================
function drawLevelUpShine(delta) {
    if (levelUpShine <= 0) {
        return;
    }

    if (!settings.animations) {
        levelUpShine = 0;
        return;
    }

    levelUpShine -=
        delta /
        animationDuration(LEVEL_UP_SHINE_DURATION);

    levelUpShine =
        Math.max(0, levelUpShine);

    const progress =
        1 - levelUpShine;

    const perimeter =
        canvas.width * 2 +
        canvas.height * 2;

    const distance =
        progress * perimeter;

    ctx.save();

    /*
        Strong animated border.
        The bright section travels clockwise
        around the entire playfield.
    */

    ctx.lineWidth = 12;
    ctx.lineCap = "round";

    // base glow
    ctx.shadowBlur = 18;
    ctx.shadowColor =
        `rgba(80,255,140,${levelUpShine})`;

    /*
        Draw the border as four separate sides
        so the shine can travel around it.
    */

    const segments = [
        // top
        {
            x1: 0,
            y1: 0,
            x2: canvas.width,
            y2: 0,
            length: canvas.width
        },

        // right
        {
            x1: canvas.width,
            y1: 0,
            x2: canvas.width,
            y2: canvas.height,
            length: canvas.height
        },

        // bottom
        {
            x1: canvas.width,
            y1: canvas.height,
            x2: 0,
            y2: canvas.height,
            length: canvas.width
        },

        // left
        {
            x1: 0,
            y1: canvas.height,
            x2: 0,
            y2: 0,
            length: canvas.height
        }
    ];

    let accumulated = 0;

    segments.forEach(segment => {
        const start = accumulated;
        const end =
            accumulated + segment.length;

        if (
            distance >= start - 120 &&
            distance <= end + 120
        ) {
            const local =
                Math.max(
                    0,
                    Math.min(
                        segment.length,
                        distance - start
                    )
                );

            const x =
                segment.x1 +
                (segment.x2 - segment.x1) *
                (local / segment.length);

            const y =
                segment.y1 +
                (segment.y2 - segment.y1) *
                (local / segment.length);

            // bright moving core
            const gradient =
                ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    75
                );

            gradient.addColorStop(
                0,
                `rgba(240,255,245,${levelUpShine})`
            );

            gradient.addColorStop(
                0.15,
                `rgba(120,255,170,${levelUpShine})`
            );

            gradient.addColorStop(
                0.45,
                `rgba(40,255,110,${levelUpShine * 0.7})`
            );

            gradient.addColorStop(
                1,
                "rgba(0,255,100,0)"
            );

            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.arc(
                x,
                y,
                75,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        accumulated = end;
    });

    // bright white/green border itself
    ctx.strokeStyle =
        `rgba(100,255,150,${levelUpShine * 0.9})`;

    ctx.strokeRect(
        2,
        2,
        canvas.width - 4,
        canvas.height - 4
    );

    // bright travelling core
    ctx.shadowBlur = 25;
    ctx.shadowColor =
        `rgba(180,255,210,${levelUpShine})`;

    ctx.strokeStyle =
        `rgba(230,255,240,${levelUpShine})`;

    ctx.lineWidth = 5;

    /*
        Draw a short segment around the current
        position to make the actual movement obvious.
    */

    ctx.beginPath();

    const coreLength = 90;

    let remaining = coreLength;
    let pos = distance - coreLength / 2;

    while (pos < 0) {
        pos += perimeter;
    }

    while (remaining > 0) {
        let segmentStart = 0;

        for (const segment of segments) {
            const segmentEnd =
                segmentStart + segment.length;

            if (
                pos >= segmentStart &&
                pos < segmentEnd
            ) {
                const available =
                    Math.min(
                        remaining,
                        segmentEnd - pos
                    );

                const t1 =
                    (pos - segmentStart) /
                    segment.length;

                const t2 =
                    (pos + available - segmentStart) /
                    segment.length;

                const x1 =
                    segment.x1 +
                    (segment.x2 - segment.x1) * t1;

                const y1 =
                    segment.y1 +
                    (segment.y2 - segment.y1) * t1;

                const x2 =
                    segment.x1 +
                    (segment.x2 - segment.x1) * t2;

                const y2 =
                    segment.y1 +
                    (segment.y2 - segment.y1) * t2;

                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);

                remaining -= available;
                pos += available;

                if (pos >= perimeter) {
                    pos = 0;
                }

                break;
            }

            segmentStart = segmentEnd;
        }
    }

    ctx.stroke();

    ctx.restore();
}



// =========================
// PARTICLES
// =========================
let particles = [];

function updateParticles(dt) {
    if (!settings.particles) {
        particles = [];
        return;
    }

    particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.2 * dt;
        p.alpha -= 0.04 * dt;
    });

    particles =
        particles.filter(
            p => p.alpha > 0
        );

    particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        ctx.fillRect(
            p.x - 3,
            p.y - 3,
            6,
            6
        );

        ctx.globalAlpha = 1;
    });
}

function spawnParticles(y) {
    if (!settings.particles) {
        return;
    }

    if (
        y < 0 ||
        y >= ROWS
    ) return;

    for (let x = 0; x < COLS; x++) {

        if (arena[y][x] !== 0) {

            for (let i = 0; i < 20; i++) {

                particles.push({
                    x:
                        x * BLOCK +
                        BLOCK / 2,

                    y:
                        y * BLOCK +
                        BLOCK / 2,

                    vx:
                        (Math.random() - 0.5) * 16,

                    vy:
                        (Math.random() - 0.5) * 14,

                    alpha: 1,

                    color:
                        COLORS[arena[y][x]]
                });
            }
        }
    }
}



// =========================
// PLACEMENT FLASH
// =========================
let placementFlashCells = [];
let placementFlashStart = 0;
const PLACEMENT_FLASH_DURATION = 110;

function startPlacementFlash() {
    placementFlashCells = [];

    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (!value) return;

            placementFlashCells.push({
                x: x + Math.round(player.pos.x),
                y: y + Math.round(player.pos.y)
            });
        });
    });

    placementFlashStart = performance.now();
}

function drawPlacementFlash() {
    if (!placementFlashCells.length) return;

    const elapsed =
        performance.now() - placementFlashStart;

    const duration =
        animationDuration(PLACEMENT_FLASH_DURATION);

    if (
        !settings.animations ||
        elapsed >= duration
    ) {
        placementFlashCells = [];
        return;
    }

    const progress =
        elapsed / duration;

    // starts bright and quickly fades
    const alpha =
        Math.pow(1 - progress, 2);

    ctx.save();

    ctx.fillStyle =
        `rgba(255,255,255,${alpha})`;

    placementFlashCells.forEach(cell => {
        if (
            cell.x < 0 ||
            cell.x >= COLS ||
            cell.y < 0 ||
            cell.y >= ROWS
        ) {
            return;
        }

        ctx.fillRect(
            cell.x * BLOCK,
            cell.y * BLOCK,
            BLOCK,
            BLOCK
        );
    });

    ctx.restore();
}



// =========================
// SCORE POP-UP
// =========================
function showScorePopup(points, lineCount) {
    if (
        points <= 0 ||
        !settings.scorePopup ||
        !settings.animations
    ) {
        return;
    }

    const popup =
        document.createElement("div");

    popup.className = "score-popup";

    popup.style.setProperty(
        "--score-popup-duration",
        `${animationDuration(850)}ms`
    );

    let label;

    switch (lineCount) {
        case 1:
            label = "SINGLE";
            break;

        case 2:
            label = "DOUBLE";
            break;

        case 3:
            label = "TRIPLE";
            break;

        case 4:
            label = "TETRIS!";
            break;

        default:
            label = "CLEAR";
    }

    popup.textContent =
        `+${points} ${label}`;

    scorePopupContainer.appendChild(popup);

    popup.addEventListener(
        "animationend",
        () => popup.remove()
    );
}



// =========================
// PIECE SPAWN ANIMATION
// =========================
function updateSpawnAnimation() {
    if (!settings.animations) {
        player.spawnAnimating = false;
        player.spawnProgress = 1;
        return;
    }

    if (!player.spawnAnimating) return;

    const duration = animationDuration(140);

    if (duration <= 0) {
        player.spawnProgress = 1;
        player.spawnAnimating = false;
        return;
    }

    const elapsed = performance.now() - player.spawnStartTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3); // smooth "pop" easing
    player.spawnProgress = ease;

    if (t >= 1) {
        player.spawnProgress = 1;
        player.spawnAnimating = false;
    }
}