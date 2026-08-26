const defaultSettings = {
    // graphics
    particles: true,
    animations: true,
    animationSpeed: 1,
    shake: true,

    // features
    autoRestart: false,
    scorePopup: true,
    speedUpAnimation: true,
    disableUpdateButton: false,

    // sounds
    musicVolume: 0,
    sfxVolume: 100
};

let settings = JSON.parse(
    localStorage.getItem("tetrisSettings") ||
    JSON.stringify(defaultSettings)
);

settings = {
    ...defaultSettings,
    ...settings
};

function saveSettings() {
    localStorage.setItem(
        "tetrisSettings",
        JSON.stringify(settings)
    );
}

function animationDuration(baseDuration) {
    if (!settings.animations) {
        return 0;
    }

    return baseDuration / settings.animationSpeed;
}

function animationScale(value) {
    if (!settings.animations) {
        return 1;
    }

    return value * settings.animationSpeed;
}

let highScoreData = JSON.parse(
    localStorage.getItem("tetrisHighScoreData") ||
    '{"score":0,"time":0,"lines":0,"level":0}'
);

// make sure old saves that don't have the newer fields still work
highScoreData = {
    score: Number(highScoreData.score) || 0,
    time: Number(highScoreData.time) || 0,
    lines: Number(highScoreData.lines) || 0,
    level: Number(highScoreData.level) || 0
};

let highScore = highScoreData.score;
let newHighScoreThisGame = false;

// level-up border shine
let levelUpShine = 0;
const LEVEL_UP_SHINE_DURATION = 700;

let startTime = Date.now();
let pausedAt = null;

let gameOver = false;
let paused = false;

const MAX_GRAVITY = 50;
const START_GRAVITY = 800;

let gravityTimer = 0;

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const timeEl = document.getElementById('time');
const levelEl = document.getElementById('level');
const scorePopupContainer = document.getElementById("scorePopupContainer");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const pauseBtn = document.getElementById("pauseBtn");
const devModeEl = document.getElementById("devMode");
const highScoreEl = document.getElementById("highScore");
const highScoreTimeEl = document.getElementById("highScoreTime");
const highScoreLinesEl = document.getElementById("highScoreLines");
const highScoreLevelEl = document.getElementById("highScoreLevel");

const optionsBtn = document.getElementById("optionsBtn");
const optionsOverlay = document.getElementById("optionsOverlay");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");
const closeOptionsBtn = document.getElementById("closeOptionsBtn");
const particlesToggle = document.getElementById("particlesToggle");
const animationsToggle = document.getElementById("animationsToggle");
const animationSpeed = document.getElementById("animationSpeed");
const animationSpeedValue = document.getElementById("animationSpeedValue");
const animationSpeedOption = document.getElementById("animationSpeedOption");
const shakeToggle = document.getElementById("shakeToggle");
const autoRestartToggle = document.getElementById("autoRestartToggle");
const scorePopupToggle = document.getElementById("scorePopupToggle");
const speedUpToggle = document.getElementById("speedUpToggle");
const disableUpdateToggle = document.getElementById("disableUpdateToggle");
const musicVolume = document.getElementById("musicVolume");
const musicVolumeValue = document.getElementById("musicVolumeValue");
const sfxVolume = document.getElementById("sfxVolume");
const sfxVolumeValue = document.getElementById("sfxVolumeValue");

function updateSettingsUI() {
    particlesToggle.checked = settings.particles;
    animationsToggle.checked = settings.animations;
    animationSpeed.value = String(settings.animationSpeed);
    animationSpeedValue.textContent = `${settings.animationSpeed}x`;
    animationSpeedOption.style.opacity = settings.animations ? "1" : "0.4";
    animationSpeed.disabled = !settings.animations;
    shakeToggle.checked = settings.shake;
    autoRestartToggle.checked = settings.autoRestart;
    scorePopupToggle.checked = settings.scorePopup;
    speedUpToggle.checked = settings.speedUpAnimation;
    disableUpdateToggle.checked = settings.disableUpdateButton;
    musicVolume.value = String(settings.musicVolume);
    musicVolumeValue.textContent = `${settings.musicVolume}%`;
    sfxVolume.value = String(settings.sfxVolume);
    sfxVolumeValue.textContent = `${settings.sfxVolume}%`;
    check_update();
}

function openOptions() {
    if (!paused && !gameOver) {
        togglePause();
    }

    updateSettingsUI();

    optionsOverlay.classList.add("open");
}

function closeOptions() {
    optionsOverlay.classList.remove("open");

    setTimeout(() => {
        if (
            paused &&
            !gameOver &&
            !optionsOverlay.classList.contains("open")
        ) {
            togglePause();
        }
    }, 100);
}

optionsBtn.addEventListener(
    "click",
    openOptions
);

resetSettingsBtn.addEventListener(
    "click",
    () => {
        const confirmed = confirm(
            "RESET ALL SETTINGS TO DEFAULTS?"
        );

        if (!confirmed) {
            return;
        }

        settings = {
            ...defaultSettings
        };

        saveSettings();
        updateSettingsUI();

        // immediately apply settings that affect
        // currently running animations/effects
        if (!settings.animations) {
            player.spawnAnimating = false;
            player.spawnProgress = 1;

            player.ghostAnimating = false;
            player.ghostOpacity = 0.2;
            player.ghostScale = 1;

            levelUpShine = 0;
            placementFlashCells = [];
            particles = [];
            shake = 0;

            canvas.style.transform = "";
        }

        if (!settings.particles) {
            particles = [];
        }

        if (!settings.shake) {
            shake = 0;
            canvas.style.transform = "";
        }
    }
);

closeOptionsBtn.addEventListener(
    "click",
    closeOptions
);

particlesToggle.addEventListener(
    "change",
    () => {
        settings.particles =
            particlesToggle.checked;

        saveSettings();

        if (!settings.particles) {
            particles = [];
        }
    }
);

animationsToggle.addEventListener(
    "change",
    () => {
        settings.animations =
            animationsToggle.checked;

        saveSettings();

        if (!settings.animations) {
            player.spawnAnimating = false;
            player.spawnProgress = 1;

            player.ghostAnimating = false;
            player.ghostOpacity = 0.2;
            player.ghostScale = 1;

            levelUpShine = 0;
            placementFlashCells = [];
            particles = [];
        }

        updateSettingsUI();
    }
);

animationSpeed.addEventListener(
    "input",
    () => {
        settings.animationSpeed =
            Number(animationSpeed.value);

        animationSpeedValue.textContent =
            `${settings.animationSpeed}x`;

        saveSettings();
    }
);

shakeToggle.addEventListener(
    "change",
    () => {
        settings.shake =
            shakeToggle.checked;

        if (!settings.shake) {
            shake = 0;
            canvas.style.transform = "";
        }

        saveSettings();
    }
);

autoRestartToggle.addEventListener(
    "change",
    () => {
        settings.autoRestart =
            autoRestartToggle.checked;

        saveSettings();
    }
);

scorePopupToggle.addEventListener(
    "change",
    () => {
        settings.scorePopup =
            scorePopupToggle.checked;

        saveSettings();
    }
);

speedUpToggle.addEventListener(
    "change",
    () => {
        settings.speedUpAnimation =
            speedUpToggle.checked;

        if (!settings.speedUpAnimation) {
            levelUpShine = 0;
        }

        saveSettings();
    }
);

disableUpdateToggle.addEventListener(
    "change",
    () => {
        settings.disableUpdateButton =
            disableUpdateToggle.checked;

        check_update();

        saveSettings();
    }
);

musicVolume.addEventListener(
    "input",
    () => {
        settings.musicVolume =
            Number(musicVolume.value);

        musicVolumeValue.textContent =
            `${settings.musicVolume}%`;

        saveSettings();
    }
);

sfxVolume.addEventListener(
    "input",
    () => {
        settings.sfxVolume =
            Number(sfxVolume.value);

        sfxVolumeValue.textContent =
            `${settings.sfxVolume}%`;

        saveSettings();
    }
);

optionsOverlay.addEventListener(
    "click",
    e => {
        if (e.target === optionsOverlay) {
            closeOptions();
        }
    }
);

updateSettingsUI();