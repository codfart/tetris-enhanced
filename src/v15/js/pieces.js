// =========================
// TGM3 RANDOMIZER
// =========================

function* tgm3Randomizer() {
    const pieces = ["I", "J", "L", "O", "S", "T", "Z"];

    const pool = [
        ...pieces,
        ...pieces,
        ...pieces,
        ...pieces,
        ...pieces
    ];

    const firstPiece =
        ["I", "J", "L", "T"][
        Math.floor(Math.random() * 4)
        ];

    yield firstPiece;

    const history = ["S", "Z", "S", firstPiece];

    const order = [];

    while (true) {
        let piece;
        let index;

        for (let roll = 0; roll < 6; roll++) {
            index = Math.floor(Math.random() * 35);
            piece = pool[index];

            if (!history.includes(piece) || roll === 5) {
                break;
            }

            if (order.length) {
                pool[index] = order[0];
            }
        }

        const oldIndex = order.indexOf(piece);

        if (oldIndex !== -1) {
            order.splice(oldIndex, 1);
        }

        order.push(piece);

        pool[index] = order[0];

        history.shift();
        history[3] = piece;

        yield piece;
    }
}

let tgm3 = tgm3Randomizer();

let semicolonHeld = false;
let twoByTwoMode = false;

function randomPiece() {
    if (twoByTwoMode) {
        return createPiece("I");
    }

    return createPiece(tgm3.next().value);
}

let nextPiece = randomPiece();



// =========================
// NEXT PIECE
// =========================

let nextAnim = 1;
let nextOutAnim = 0;
let nextAnimatingOut = false;

function createMatrix(w, h) {
    const m = [];

    while (h--) {
        m.push(new Array(w).fill(0));
    }

    return m;
}

function drawBlockToContext(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x + 1, y + size - 1);
    ctx.lineTo(x + 1, y + 1);
    ctx.lineTo(x + size - 1, y + 1);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,0.2)";

    ctx.beginPath();
    ctx.moveTo(x + size - 1, y + 1);
    ctx.lineTo(x + size - 1, y + size - 1);
    ctx.lineTo(x + 1, y + size - 1);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(
        x + 3,
        y + 3,
        size - 6,
        size - 6
    );
}

function trimPiece(matrix) {
    let minX = matrix[0].length;
    let maxX = 0;
    let minY = matrix.length;
    let maxY = 0;

    matrix.forEach((row, y) => {
        row.forEach((v, x) => {
            if (v) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        });
    });

    return matrix
        .slice(minY, maxY + 1)
        .map(row =>
            row.slice(minX, maxX + 1)
        );
}

function drawNextPiece(dt = 1) {
    nextCtx.clearRect(
        0,
        0,
        nextCanvas.width,
        nextCanvas.height
    );

    if (nextAnimatingOut) {
        nextOutAnim += 0.15 * dt;

        if (nextOutAnim >= 1) {
            nextAnimatingOut = false;
            nextOutAnim = 0;
            nextAnim = 0;
        }
    }

    nextAnim += (1 - nextAnim) * (1 - Math.pow(1 - 0.18, dt));

    const piece = trimPiece(nextPiece);

    const size = 24;

    const w = piece[0].length;
    const h = piece.length;

    const offsetX =
        (nextCanvas.width - w * size) / 2;

    const offsetY =
        (nextCanvas.height - h * size) / 2;

    nextCtx.save();

    let scale;
    let alpha;

    if (nextAnimatingOut) {
        scale = 1 - nextOutAnim * 0.4;
        alpha = 1 - nextOutAnim;
    } else {
        scale = 0.8 + nextAnim * 0.2;
        alpha = nextAnim;
    }

    nextCtx.translate(
        nextCanvas.width / 2,
        nextCanvas.height / 2
    );

    nextCtx.scale(scale, scale);

    nextCtx.translate(
        -nextCanvas.width / 2,
        -nextCanvas.height / 2
    );

    nextCtx.globalAlpha = alpha;

    piece.forEach((row, y) => {
        row.forEach((v, x) => {
            if (!v) return;

            drawBlockToContext(
                nextCtx,
                offsetX + x * size,
                offsetY + y * size,
                size,
                COLORS[v]
            );
        });
    });

    nextCtx.restore();
}





// =========================
// COLLISION / PIECES
// =========================

function collide(arena, player) {
    const [m, o] = [
        player.matrix,
        player.pos
    ];

    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {

            if (
                m[y][x] &&
                (
                    arena[y + o.y] &&
                    arena[y + o.y][x + o.x]
                ) !== 0
            ) {
                return true;
            }
        }
    }

    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                arena[
                    y + player.pos.y
                ][
                    x + player.pos.x
                ] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x]
            ] = [
                    matrix[y][x],
                    matrix[x][y]
                ];
        }
    }

    if (dir > 0) {
        matrix.forEach(r => r.reverse());
    } else {
        matrix.reverse();
    }
}

function createPiece(type) {
    switch (type) {
        case 'T':
            return [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ];

        case 'O':
            return [
                [2, 2],
                [2, 2]
            ];

        case 'L':
            return [
                [0, 0, 3],
                [3, 3, 3],
                [0, 0, 0]
            ];

        case 'J':
            return [
                [4, 0, 0],
                [4, 4, 4],
                [0, 0, 0]
            ];

        case 'I':
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0]
            ];

        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0]
            ];

        case 'Z':
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0]
            ];
    }
}

const arena = createMatrix(COLS, ROWS);

const player = {
    pos: {
        x: 0,
        y: 0
    },

    matrix: null,

    easingPos: {
        x: 0,
        y: 0
    },

    ghostY: 0,
    easingGhostY: 0,

    hardDropTargetY: null,

    ghostOpacity: 0,
    ghostScale: 0.5,
    ghostSpawnTime: 0,
    ghostAnimating: false,

    spawnProgress: 1,
    spawnAnimating: false,
    spawnStartTime: 0
};




