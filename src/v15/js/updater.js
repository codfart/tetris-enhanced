/*
This script checks the current README for the latest version.
If the current version is out of date, show the pop-up to update.
*/


// Grab update components
const UPDATE_BOX = document.querySelector(".update");
const README_URL = "../../README.md";
const CURRENT_VERSION = window.location.pathname.match(/\/v([^/]+)\/?$/)?.[1];

// Set window title
const title = document.createElement("title");
title.textContent = `Tetris Enhanced (v${CURRENT_VERSION})`;
document.head.prepend(title);

// Check for updates, if available, do the update box thing
async function check_update() {
    // fetch README
    const README = await fetch(README_URL).then(res => res.text());

    // get the version + URL from the "Play Tetris Enhanced vX" link
    const MATCH = README.match(/<a\s+href="([^"]+)"[^>]*>\s*Play Tetris Enhanced v(\d+)\s*<\/a>/i);
    if (!MATCH) return;
    
    // parse into version and URL
    const LATEST_VERSION = MATCH[2];
    const LATEST_URL = MATCH[1];

    // Check it
    if (LATEST_VERSION > CURRENT_VERSION && !settings.disableUpdateButton) {
        UPDATE_BOX.classList.remove("disabled");
        UPDATE_BOX.addEventListener("click", () => {
            document.location.href = LATEST_URL;
        });
    } else {
        UPDATE_BOX.classList.add("disabled");
    }
}

// haha update go BRRRRRRRRRRRRRRR
check_update()