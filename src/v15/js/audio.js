// =========================
// SOUND EFFECTS
// =========================

const SFX_PATH = "./sfx/";

const line0Mode = Math.random() < 0.1;

const SFX = line0Mode
    ? {
        drop: ["line0.wav"],
        place: ["line0.wav"],
        lineClear: ["line0.wav"],
        explode: ["line0.wav"],
        gameOver: ["line0.wav"],
        clear: ["line0.wav"],
        tetris: ["line0.wav"]
    }
    : {
        drop: ["drop.wav"],
        place: ["place.wav"],

        lineClear: [
            "line1.wav",
            "line2.wav",
            "line3.wav",
            "line4.wav"
        ],

        explode: [
            "explode1.wav",
            "explode2.wav",
            "explode3.wav",
            "explode4.wav"
        ],

        gameOver: ["game_over.wav"],
        clear: ["score.wav"],
        tetris: ["tetris.wav"]
    };

const lastSFX = {};

function playSFX(type, volume = 1) {
    const sounds = SFX[type];

    if (!sounds || sounds.length === 0) return;

    let index;

    do {
        index = Math.floor(Math.random() * sounds.length);
    } while (
        sounds.length > 1 &&
        index === lastSFX[type]
    );

    lastSFX[type] = index;

    const audio = new Audio(
        SFX_PATH + sounds[index]
    );

    audio.volume = Math.max(
        0,
        Math.min(
            1,
            volume * (settings.sfxVolume / 100)
        )
    );

    audio.play().catch(() => { });
}