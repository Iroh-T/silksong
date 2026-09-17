// --- CONSTANTS & SHARED STATE ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const keys = {};

let GAME_WIDTH = 1000;
let GAME_HEIGHT = 400;
let ARENA_W = 1000;
let ARENA_H = 400;
let FLOOR = 350;

let camX = 0, camY = 0;
let secretMode = false;
let gameState = "MENU";
const GRAVITY = 0.6;
let currentGravity = GRAVITY;
let jumpMod = 1;

let numPlayers = 1;
let sharedHeals = 3;
let maxSharedHeals = 3;
let sharedHitCount = 0;

let players = [];
let arenaLeaves = [];
let airBlades = [];
let blackDaggers = [];
let playerDaggers = [];
let p2Traps = [];
let phantoms = [];
let airTraps = [];
let airComboTraps = [];
let voidExplosions = [];
let voidPortals = [];
let looms = [];
let chaosBalls = [];

let scarf = { active: false, x: 0, y: 0, width: 0, dir: 1, target: null };
let clashFlash = null;
let activeCinematic = null;
let globalWindMode = "NONE", globalWindTimer = 0, globalWindCooldown = 0;
let freezeFrames = 0;
let screamRings = [];
let platforms = [];

let touchInputs = { left: false, right: false, up: false, down: false, jump: false, atk: false, dash: false, spec: false, heal: false, light: false };
let screenShake = { timer: 0, mag: 0, dirX: 0, dirY: 0 };
window.fireHeroUnlocked = false;
let testModeUnlocked = false;
window.testModeUnlocked = false;
let godModeActive = false;
window.godModeActive = false;
let megaDamageActive = false;
window.megaDamageActive = false;

let phase2Hp = 18;
let phase3Hp = 12.5;
let boss = { 
    x: 750, y: 300, width: 30, height: 50, vx: 0, vy: 0, speed: 6.5, 
    hp: 30, maxHp: 30, phase: 1, damageBonus: 0, state: "IDLE", stateTimer: 60, flashTimer: 0,
    invuln: 0, color: "#e6c800", attackDir: 1, targetY: 150, climbSaTimer: 0,
    isHorizontal: false, facingRight: false, missCount: 0, directAttackActive: false, 
    directAttackHit: false, comboCount: 0, heroBleedTimer: 0, heroBleedTicks: 0, 
    superQueue: [], sa1Arr: [], hunterInfected: 0, infectedTimer: 0, voidWindDisabled: 0,
    sa1Count: 0, saLines: null, saLinesState: "", saLinesTimer: 0,
    climbPlatCount: 0, climbPlatTimer: 0, lightStunDone: false, lightInfected: 0,
    bossBurnTimer: 0, bossBurnTicks: 0, duelSpacingTimer: 0,
    halfHpSeqDone: false, halfHpSeqActive: false, climbSaStep: 0,
    healCooldown: 0, healOrbs: []
};

let p1InputType = 'KEYBOARD_1';
let p2InputType = 'KEYBOARD_2';
let p1HeroSelection = null;
let p2HeroSelection = null;
let duoP1Device = 'KEYBOARD';
let duoP2Device = 'KEYBOARD';
let duoSoloKeyboardScheme = 'SCHEME_1';

const ACTION_DEFS = [
    { id: 'jump', name: 'Прыжок' },
    { id: 'attack', name: 'Удар' },
    { id: 'left', name: 'Лево' },
    { id: 'right', name: 'Право' },
    { id: 'down', name: 'Низ' },
    { id: 'up', name: 'Верх' },
    { id: 'heal', name: 'Лечение' },
    { id: 'dash', name: 'Рывок' },
    { id: 'special', name: 'Способность' },
    { id: 'light', name: '???' }, // таинственное (кинжал света)
    { id: 'stance', name: 'Смена стойки/оружия' }
];

const DEFAULT_CONTROLS = {
    SCHEME_1: {
        left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
        jump: 'KeyZ', attack: 'KeyX', heal: 'KeyA', dash: 'KeyC', special: 'KeyF',
        light: 'KeyL', stance: 'KeyS'
    },
    SCHEME_2: {
        left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS',
        jump: 'Space', attack: 'MouseLeft', heal: 'KeyQ', dash: 'KeyE', special: 'MouseRight',
        light: 'KeyR', stance: 'KeyT'
    },
    DUO_KEYBOARD: {
        p1: {
            left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
            jump: 'Comma', attack: 'Period', heal: 'KeyK', dash: 'Slash', special: 'Quote',
            light: 'KeyL', stance: 'Semicolon'
        },
        p2: {
            left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS',
            jump: 'Space', attack: 'KeyF', heal: 'KeyQ', dash: 'KeyE', special: 'KeyR',
            light: 'KeyC', stance: 'KeyT'
        }
    },
    GAMEPAD: {
        jump: 'Кнопка 0 (A / Cross)',
        attack: 'Кнопка 2/3 (X/Y)',
        left: 'D-Pad Влево / Стик',
        right: 'D-Pad Вправо / Стик',
        down: 'D-Pad Вниз / Стик',
        up: 'D-Pad Вверх / Стик',
        heal: 'Кнопка 1 (B / Circle)',
        dash: 'Кнопка 7 (ZR / RT)',
        special: 'Кнопка 5/4 (RB / R1)',
        light: 'Кнопка 11/10 (R3 / L3)',
        stance: 'Кнопка 8/9 (L / LB)'
    }
};

let userControls = JSON.parse(JSON.stringify(DEFAULT_CONTROLS));

function initControlsFromStorage() {
    try {
        let saved = localStorage.getItem('shelter_custom_controls');
        if (saved) {
            let parsed = JSON.parse(saved);
            userControls = Object.assign(JSON.parse(JSON.stringify(DEFAULT_CONTROLS)), parsed);
        } else {
            userControls = JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
        }
    } catch(e) {
        userControls = JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
    }
}
initControlsFromStorage();

function saveControlsToStorage() {
    try {
        localStorage.setItem('shelter_custom_controls', JSON.stringify(userControls));
    } catch(e) {}
}

function formatKeyName(code) {
    if (!code) return '[Пусто]';
    if (code === 'ArrowLeft') return '←';
    if (code === 'ArrowRight') return '→';
    if (code === 'ArrowUp') return '↑';
    if (code === 'ArrowDown') return '↓';
    if (code === 'Space') return 'Пробел';
    if (code === 'Comma') return ',';
    if (code === 'Period') return '.';
    if (code === 'Slash') return '/';
    if (code === 'Semicolon') return ';';
    if (code === 'Quote') return "'";
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
    if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
    if (code === 'AltLeft' || code === 'AltRight') return 'Alt';
    if (code === 'MouseLeft') return 'ЛКМ';
    if (code === 'MouseRight') return 'ПКМ';
    if (code === 'MouseMiddle') return 'СКМ';
    if (code.startsWith('Key')) return code.slice(3).toUpperCase();
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
    return code;
}

// Mouse button down/up listeners to support MouseLeft/MouseRight attacks
window.addEventListener('mousedown', e => {
    if (e.button === 0) keys['MouseLeft'] = true;
    if (e.button === 2) keys['MouseRight'] = true;
    if (e.button === 1) keys['MouseMiddle'] = true;
});
window.addEventListener('mouseup', e => {
    if (e.button === 0) keys['MouseLeft'] = false;
    if (e.button === 2) keys['MouseRight'] = false;
    if (e.button === 1) keys['MouseMiddle'] = false;
});
window.addEventListener('contextmenu', e => {
    if (gameState === "PLAYING" || window.rebindingActive) e.preventDefault();
});

// --- STATS & ACHIEVEMENTS MANAGER ---
const STATS_KEY = 'shelter_game_stats';
function loadGameStats() {
    try {
        let raw = localStorage.getItem(STATS_KEY);
        if (raw) return JSON.parse(raw);
    } catch(e){}
    return {
        soloNormalWins: 0, soloNormalLosses: 0,
        soloSecretWins: 0, soloSecretLosses: 0,
        duoNormalWins: 0, duoNormalLosses: 0,
        duoSecretWins: 0, duoSecretLosses: 0
    };
}

function saveGameStats(stats) {
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch(e){}
}

let battleResultRecorded = false;
function recordBattleResult(isVictory) {
    if (battleResultRecorded) return;
    battleResultRecorded = true;
    let s = loadGameStats();
    if (numPlayers === 1) {
        if (!secretMode) {
            if (isVictory) s.soloNormalWins++; else s.soloNormalLosses++;
        } else {
            if (isVictory) s.soloSecretWins++; else s.soloSecretLosses++;
        }
    } else {
        if (!secretMode) {
            if (isVictory) s.duoNormalWins++; else s.duoNormalLosses++;
        } else {
            if (isVictory) s.duoSecretWins++; else s.duoSecretLosses++;
        }
    }
    saveGameStats(s);
}

const badgesDict = {
    'accel': { id: 'accel', name: 'Ускоритель (+20% ск. хила)', teamAllowed: false },
    'multi': { id: 'multi', name: 'Мультисвязыватель (Двойной хил)', teamAllowed: false },
    'glass': { id: 'glass', name: 'Стеклянная нить (Урон х1.75, по вам х2)', teamAllowed: true }, 
    'wings': { id: 'wings', name: 'Световые крылья (Двойной прыжок)', teamAllowed: true },
    'sharp': { id: 'sharp', name: 'Заточка (Шанс кровотечения)', teamAllowed: false },
    'generator': { id: 'generator', name: 'Генератор (1 заряд за 2 сек)', teamAllowed: false },
    'bracelet': { id: 'bracelet', name: 'Тяжелый браслет (Отдача / 2)', teamAllowed: false },
    'sneakers': { id: 'sneakers', name: 'Кроссовки (+33% ск., -заряд/3с)', teamAllowed: false },
    'none':  { id: 'none', name: '[Пусто]', teamAllowed: 'both' }
};

const abilityDict = {
    'shuriken': 'Сюрикены',
    'chill': 'Охлаждающий отвар',
    'invig': 'Бодрящий отвар',
    'wind': 'Порыв ветра',
    'supertrap': 'Супер ловушка',
    'trap': 'Ловушка',
    'charge': 'Заряженный удар',
    'none': '[Пусто]'
};

const abilitySlotNames = {
    'top': 'Вверх + Спец',
    'mid': 'Спец (Только)',
    'bot': 'Удар + Спец'
};

function getAbilitiesInfo(type) {
    if (type === 'WATER') return { slots: ['mid'], pool: ['shuriken', 'chill', 'invig', 'none'] };
    if (type === 'AIR') return { slots: ['mid', 'bot'], pool: ['wind', 'supertrap', 'chill', 'invig', 'none'] };
    if (type === 'EARTH') return { slots: ['top', 'mid'], pool: ['trap', 'chill', 'invig', 'none'] };
    if (type === 'STAMINA') return { slots: ['top', 'mid'], pool: ['shuriken', 'charge', 'chill', 'invig', 'none'] };
    if (type === 'FIRE') return { slots: [], pool: [] };
    return { slots: [], pool: [] };
}

const defaultAbilities = {
    'WATER': { top: 'none', mid: 'shuriken', bot: 'none' },
    'AIR': { top: 'none', mid: 'wind', bot: 'supertrap' },
    'EARTH': { top: 'chill', mid: 'trap', bot: 'none' },
    'STAMINA': { top: 'shuriken', mid: 'charge', bot: 'none' },
    'FIRE': { top: 'none', mid: 'none', bot: 'none' } 
};

let configBadges = { team: 'none', p1: ['none','none','none'], p2: ['none','none','none'] };
let configAbilities = { p1: { top: 'none', mid: 'none', bot: 'none' }, p2: { top: 'none', mid: 'none', bot: 'none' } };

let currentEditingSlot = null; 
let currentEditingAbility = null;

// Initialize leaves
for (let i = 0; i < 50; i++) {
    arenaLeaves.push({ 
        x: Math.random() * 2500, 
        y: Math.random() * 600, 
        vx: 0, 
        vy: Math.random() * 0.5 + 0.2, 
        size: 4 + Math.random() * 4, 
        angle: Math.random() * Math.PI * 2, 
        spin: (Math.random() - 0.5) * 0.1, 
        color: `rgba(${100+Math.random()*50}, ${150+Math.random()*100}, 50, 0.8)` 
    });
}

function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1; 
    canvas.width = GAME_WIDTH * dpr; 
    canvas.height = GAME_HEIGHT * dpr;
    canvas.style.width = "100%"; 
    canvas.style.maxWidth = "1000px"; 
    canvas.style.height = "auto";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Geometry & Physics helpers
function rectIntersect(r1, r2) { 
    return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y); 
}

function distToSegment(p, line) {
    let l2 = Math.pow(line.x1 - line.x2, 2) + Math.pow(line.y1 - line.y2, 2);
    let cx = p.x + p.width/2; 
    let cy = p.y + p.height/2;
    if (l2 === 0) return Math.hypot(cx - line.x1, cy - line.y1);
    let t = ((cx - line.x1) * (line.x2 - line.x1) + (cy - line.y1) * (line.y2 - line.y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    let projX = line.x1 + t * (line.x2 - line.x1); 
    let projY = line.y1 + t * (line.y2 - line.y1);
    return Math.hypot(cx - projX, cy - projY);
}

function applyPhysicsPushToLeaves(srcX, srcY, strength) { 
    for (let l of arenaLeaves) { 
        let dx = l.x - srcX; 
        let dy = l.y - srcY; 
        let dist = Math.hypot(dx, dy); 
        if (dist < 80) { 
            l.vx += (dx / dist) * strength; 
            l.vy += (dy / dist) * strength; 
        } 
    } 
}
