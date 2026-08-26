const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
const BLOCK = 32;

const COLORS = [
    null,
    '#ff3838',
    '#ffb8b8',
    '#38ff83',
    '#83ffb8',
    '#3838ff',
    '#b838ff',
    '#ffb838'
];

let score = 0;
let linesCleared = 0;
let level = 0;