// --- CONSTANTS & SHARED STATE ---
const GAME_VERSION = "v76.0";
window.GAME_VERSION = GAME_VERSION;
let isFireBossMode = false;
window.isFireBossMode = false;
let ashParticles = [];
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
let backgroundDust = [];
let stepPuffs = [];

let scarf = { active: false, x: 0, y: 0, width: 0, dir: 1, target: null };
let clashFlash = null;
let activeCinematic = null;
let globalWindMode = "NONE", globalWindTimer = 0, globalWindCooldown = 0;
let freezeFrames = 0;
let screamRings = [];
let platforms = [];
let loomThreads = [];
let lightAmuletWaves = [];
let battleAnnouncements = [];
let waterRopes = [];
let fallingBananaPeels = [];
let slowMoTimer = 0;

// Phase 3 L-mode Arena Destruction & Abyss Goo
let teamHallucinationHits = 0;
let floorCracks = [];
let voidPuddles = [];
let voidCeilingDrips = [];
let fallingBoulders = [];
let arenaBarricadeBoulders = [];
let abyssGooFloorActive = false;
let abyssGooSolidifying = false;
let abyssGooSolidifyTimer = 0;
let abyssGooSolidified = false;
let abyssRightWallBroken = false;
let gooCinematicTimer = 0;
let ambientVoidOrbsMultiplier = 1.0;

function getHallucinationThreshold() {
    let livingCount = (typeof players !== 'undefined' && players.length > 0) ? players.length : 1;
    let base = 3;
    if (livingCount === 2) base = 4;
    else if (livingCount >= 3) base = 6;
    let lightAmulets = (typeof players !== 'undefined') ? players.filter(p => p.hasLightAmulet && !p.lightAmuletBroken).length : 0;
    return base + lightAmulets;
}

function hasTeamHallucinations() {
    if (!secretMode) return false;
    return teamHallucinationHits >= getHallucinationThreshold();
}

function distToSegment(p, v, w) {
    let l2 = (w.x - v.x) * (w.x - v.x) + (w.y - v.y) * (w.y - v.y);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
    let proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    return Math.hypot(p.x - proj.x, p.y - proj.y);
}

function lineSegmentsIntersect(p1, p2, p3, p4) {
    function ccw(A, B, C) {
        return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    }
    return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

function segmentIntersectsRect(rect, p1, p2) {
    if (!p1 || !p2) return false;
    if (p1.x >= rect.x && p1.x <= rect.x + rect.width && p1.y >= rect.y && p1.y <= rect.y + rect.height) return true;
    if (p2.x >= rect.x && p2.x <= rect.x + rect.width && p2.y >= rect.y && p2.y <= rect.y + rect.height) return true;
    let rTop1 = { x: rect.x, y: rect.y }, rTop2 = { x: rect.x + rect.width, y: rect.y };
    let rBot1 = { x: rect.x, y: rect.y + rect.height }, rBot2 = { x: rect.x + rect.width, y: rect.y + rect.height };
    let rLeft1 = { x: rect.x, y: rect.y }, rLeft2 = { x: rect.x, y: rect.y + rect.height };
    let rRight1 = { x: rect.x + rect.width, y: rect.y }, rRight2 = { x: rect.x + rect.width, y: rect.y + rect.height };
    return lineSegmentsIntersect(p1, p2, rTop1, rTop2) ||
           lineSegmentsIntersect(p1, p2, rBot1, rBot2) ||
           lineSegmentsIntersect(p1, p2, rLeft1, rLeft2) ||
           lineSegmentsIntersect(p1, p2, rRight1, rRight2);
}

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
let phase3Hp = 22;
let boss = { 
    x: 750, y: 300, width: 30, height: 50, vx: 0, vy: 0, speed: 6.5, 
    hp: 30, maxHp: 30, phase: 1, damageBonus: 0, state: "IDLE", stateTimer: 60, flashTimer: 0,
    invuln: 0, color: "#e6c800", attackDir: 1, targetY: 150, climbSaTimer: 0,
    isHorizontal: false, facingRight: false, missCount: 0, directAttackActive: false, 
    directAttackHit: false, comboCount: 0, heroBleedTimer: 0, heroBleedTicks: 0, 
    superQueue: [], sa1Arr: [], hunterInfected: 0, infectedTimer: 0, voidWindDisabled: 0,
    sa1Count: 0, saLines: null, saLinesState: "", saLinesTimer: 0,
    climbPlatCount: 0, climbPlatTimer: 0, lightStunDone: false, lightInfected: 0, lightInfectedDmgRed: 0.5,
    bossBurnTimer: 0, bossBurnTicks: 0, duelSpacingTimer: 0,
    halfHpSeqDone: false, halfHpSeqActive: false, climbSaStep: 0,
    healCooldown: 0, healOrbs: [],
    flamingRapierTimer: 0, lastBlockTimer: 0, introTimer: 0,
    fireHealCooldown: 0, fireParryTimer: 0, fireCounterTicks: 0,
    totalMaxHp: 60, totalHp: 60
};

let p1InputType = 'KEYBOARD_1';
let p2InputType = 'KEYBOARD_2';
let p1HeroSelection = null;
let p2HeroSelection = null;
let duoP1Device = 'KEYBOARD';
let duoP2Device = 'KEYBOARD';
let duoSoloKeyboardScheme = 'SCHEME_1';
let gameMode = '1P'; // '1P', '2P', '1P_AI', '2P_AI'
let hasAiCompanion = false;

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
        light: 'ShiftLeft', stance: 'KeyS'
    },
    SCHEME_2: {
        left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS',
        jump: 'Space', attack: 'MouseLeft', heal: 'KeyQ', dash: 'KeyE', special: 'MouseRight',
        light: 'KeyT', stance: 'KeyR'
    },
    DUO_KEYBOARD: {
        p1: {
            left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS',
            jump: 'Space', attack: 'KeyF', heal: 'KeyQ', dash: 'KeyE', special: 'KeyR',
            light: 'KeyC', stance: 'KeyT'
        },
        p2: {
            left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
            jump: 'Comma', attack: 'Period', heal: 'KeyK', dash: 'Slash', special: 'Quote',
            light: 'KeyL', stance: 'Semicolon'
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
            if (userControls.DUO_KEYBOARD && userControls.DUO_KEYBOARD.p1 && userControls.DUO_KEYBOARD.p1.left === 'ArrowLeft') {
                // Auto-migrate inverted Duo Keyboard mapping so P1 is on the left (WASD) and P2 is on the right (Arrows)
                userControls.DUO_KEYBOARD = JSON.parse(JSON.stringify(DEFAULT_CONTROLS.DUO_KEYBOARD));
            }
            if (userControls.SCHEME_2 && (userControls.SCHEME_2.stance === 'KeyT' || !userControls.SCHEME_2.stance)) {
                userControls.SCHEME_2.stance = 'KeyR';
                if (userControls.SCHEME_2.light === 'KeyR') userControls.SCHEME_2.light = 'KeyT';
            }
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

// --- ACCOUNTS & AUTH MANAGER ---
// --- CLOUD DATABASE & ACCOUNTS (FIREBASE REALTIME DB) ---
const FIREBASE_URL = 'https://silksong-shelter-default-rtdb.europe-west1.firebasedatabase.app';
const ACCOUNTS_KEY = 'shelter_accounts';
const CURRENT_USER_KEY = 'shelter_current_user';
const POCKET_CACHE_KEY = 'shelter_pocket_keys';

// Старые аккаунты Даши по умолчанию лежат в «Кармане» (единый аккаунт — Dasha_545)
const DEFAULT_POCKET_KEYS = ['dasha', 'dasha545', 'dasha_54', 'даша'];
let cachedPocketAccounts = {};
let pocketKeysLoadedFromCloud = false;

function getPocketKeySet() {
    let set = new Set(DEFAULT_POCKET_KEYS);
    try {
        let raw = localStorage.getItem(POCKET_CACHE_KEY);
        if (raw) {
            let parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                set = new Set(parsed);
            }
        }
    } catch(e) {}
    if (pocketKeysLoadedFromCloud) {
        set = new Set(Object.keys(cachedPocketAccounts || {}).filter(k => k !== 'error'));
    }
    return set;
}

function isPocketedAccount(keyOrName, accObj = null) {
    if (accObj && accObj.inPocket) return true;
    if (!keyOrName) return false;
    let lk = String(keyOrName).trim().toLowerCase();
    let set = getPocketKeySet();
    if (set.has(lk)) return true;
    if (accObj && accObj.name) {
        let ln = String(accObj.name).trim().toLowerCase();
        // Если сам ключ не dasha_545, но старый аккаунт в кармане
        if (lk !== 'dasha_545' && set.has(ln)) return true;
    }
    return false;
}
window.isPocketedAccount = isPocketedAccount;

async function fetchPocketAccounts() {
    try {
        let res = await fetch(`${FIREBASE_URL}/pocket_accounts.json`);
        if (res.ok) {
            let data = await res.json();
            cachedPocketAccounts = (data && !data.error && typeof data === 'object') ? data : {};
            pocketKeysLoadedFromCloud = true;
            try {
                localStorage.setItem(POCKET_CACHE_KEY, JSON.stringify(Object.keys(cachedPocketAccounts)));
            } catch(e) {}
        }
    } catch(e) {}
    return cachedPocketAccounts;
}
window.fetchPocketAccounts = fetchPocketAccounts;

async function moveAccountToPocket(keyOrName) {
    if (!keyOrName) return { success: false, message: "Не указан аккаунт" };
    let lowerKey = String(keyOrName).trim().toLowerCase();
    if (lowerKey === 'рыба' || lowerKey === 'admin') {
        return { success: false, message: "Аккаунт Создателя нельзя убрать в карман!" };
    }
    let accs = loadAccounts();
    let accData = accs[lowerKey] || null;
    try {
        let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`);
        let cloudAcc = await res.json();
        if (cloudAcc && !cloudAcc.error) accData = cloudAcc;
    } catch(e) {}

    if (!accData) {
        return { success: false, message: "Аккаунт не найден в базе!" };
    }

    accData.inPocket = true;
    accData.pocketedAt = Date.now();
    accData.originalKey = lowerKey;

    try {
        await fetch(`${FIREBASE_URL}/pocket_accounts/${encodeURIComponent(lowerKey)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accData)
        });
        await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`, {
            method: 'DELETE'
        });
    } catch(e) {
        return { success: false, message: "Ошибка облака: " + e.message };
    }

    cachedPocketAccounts[lowerKey] = accData;
    pocketKeysLoadedFromCloud = true;
    try {
        localStorage.setItem(POCKET_CACHE_KEY, JSON.stringify(Object.keys(cachedPocketAccounts)));
    } catch(e) {}

    delete accs[lowerKey];
    saveAccounts(accs);
    return { success: true, account: accData };
}
window.moveAccountToPocket = moveAccountToPocket;

async function restoreAccountFromPocket(pocketKey) {
    if (!pocketKey) return { success: false, message: "Не указан ключ в кармане" };
    let lowerKey = String(pocketKey).trim().toLowerCase();
    let accData = cachedPocketAccounts[lowerKey] || null;
    try {
        let res = await fetch(`${FIREBASE_URL}/pocket_accounts/${encodeURIComponent(lowerKey)}.json`);
        let cloudAcc = await res.json();
        if (cloudAcc && !cloudAcc.error) accData = cloudAcc;
    } catch(e) {}

    if (!accData) {
        return { success: false, message: "Аккаунт не найден в кармане!" };
    }

    delete accData.inPocket;
    delete accData.pocketedAt;

    try {
        await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accData)
        });
        await fetch(`${FIREBASE_URL}/pocket_accounts/${encodeURIComponent(lowerKey)}.json`, {
            method: 'DELETE'
        });
    } catch(e) {
        return { success: false, message: "Ошибка облака: " + e.message };
    }

    delete cachedPocketAccounts[lowerKey];
    pocketKeysLoadedFromCloud = true;
    try {
        localStorage.setItem(POCKET_CACHE_KEY, JSON.stringify(Object.keys(cachedPocketAccounts)));
    } catch(e) {}

    let accs = loadAccounts();
    accs[lowerKey] = accData;
    saveAccounts(accs);
    return { success: true, account: accData };
}
window.restoreAccountFromPocket = restoreAccountFromPocket;

function loadAccounts() {
    try {
        let raw = localStorage.getItem(ACCOUNTS_KEY);
        if (raw) {
            let accs = JSON.parse(raw);
            let cleaned = false;
            if (accs && typeof accs === 'object') {
                for (let k in accs) {
                    if (k === 'error' || !accs[k] || typeof accs[k] !== 'object' || !accs[k].name || isPocketedAccount(k, accs[k])) {
                        delete accs[k];
                        cleaned = true;
                    }
                }
                if (accs['рыба'] && Array.isArray(accs['рыба'].friendRequests)) {
                    let beforeLen = accs['рыба'].friendRequests.length;
                    accs['рыба'].friendRequests = accs['рыба'].friendRequests.filter(r => {
                        let lr = (r || '').toLowerCase().trim();
                        return !lr.includes('dasha') && !lr.includes('даша');
                    });
                    if (accs['рыба'].friendRequests.length !== beforeLen) {
                        cleaned = true;
                    }
                }
                if (cleaned) {
                    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs)); } catch(e){}
                }
            }
            return accs;
        }
    } catch(e){}
    return {};
}

function saveAccounts(accs) {
    try {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
    } catch(e){}
}

function getCurrentUser() {
    try {
        let cur = localStorage.getItem(CURRENT_USER_KEY) || null;
        if (cur && isPocketedAccount(cur)) {
            localStorage.removeItem(CURRENT_USER_KEY);
            return null;
        }
        return cur;
    } catch(e){
        return null;
    }
}

function setCurrentUser(name) {
    try {
        localStorage.setItem(CURRENT_USER_KEY, name);
    } catch(e){}
}

function clearCurrentUser() {
    try {
        localStorage.removeItem(CURRENT_USER_KEY);
    } catch(e){}
}

// --- STORY MODE CLOUD SAVES (FIREBASE & LOCAL CACHE) ---
async function fetchStorySaves(username) {
    if (!username && typeof getCurrentUser === 'function') username = getCurrentUser();
    let lowerUser = (username && username.trim()) ? username.trim().toLowerCase() : 'guest';
    
    // 1. Read local cache first for instant UI response
    let localCache = null;
    try {
        let raw = localStorage.getItem(`shelter_story_saves_${lowerUser}`);
        if (raw) localCache = JSON.parse(raw);
    } catch(e) {}
    if (!localCache || typeof localCache !== 'object') {
        localCache = { slot1: null, slot2: null };
    }

    // 2. Fetch fresh cloud saves from Firebase
    try {
        let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerUser)}/storySaves.json`);
        if (res.ok) {
            let cloudData = await res.json();
            if (cloudData && typeof cloudData === 'object') {
                localCache = {
                    slot1: cloudData.slot1 || null,
                    slot2: cloudData.slot2 || null
                };
                localStorage.setItem(`shelter_story_saves_${lowerUser}`, JSON.stringify(localCache));
            } else if (cloudData === null) {
                // If cloud is explicitly null, don't wipe local if local has something unless verified
            }
        }
    } catch(e) {
        console.warn("Could not sync story saves from Firebase, using local cache:", e);
    }

    return localCache;
}
window.fetchStorySaves = fetchStorySaves;

async function saveStorySlot(slotNum, slotData, username) {
    if (!username && typeof getCurrentUser === 'function') username = getCurrentUser();
    let lowerUser = (username && username.trim()) ? username.trim().toLowerCase() : 'guest';
    let slotKey = `slot${slotNum}`;

    // Update local cache
    let localCache = {};
    try {
        let raw = localStorage.getItem(`shelter_story_saves_${lowerUser}`);
        if (raw) localCache = JSON.parse(raw);
    } catch(e) {}
    localCache[slotKey] = slotData;
    try {
        localStorage.setItem(`shelter_story_saves_${lowerUser}`, JSON.stringify(localCache));
    } catch(e) {}

    // Cloud Firebase update
    try {
        await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerUser)}/storySaves/${slotKey}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slotData)
        });
        return true;
    } catch(e) {
        console.warn("Failed to write story save to Firebase:", e);
        return false;
    }
}
window.saveStorySlot = saveStorySlot;

async function deleteStorySlot(slotNum, username) {
    if (!username && typeof getCurrentUser === 'function') username = getCurrentUser();
    let lowerUser = (username && username.trim()) ? username.trim().toLowerCase() : 'guest';
    let slotKey = `slot${slotNum}`;

    // Remove from local cache
    try {
        let raw = localStorage.getItem(`shelter_story_saves_${lowerUser}`);
        if (raw) {
            let localCache = JSON.parse(raw);
            delete localCache[slotKey];
            localStorage.setItem(`shelter_story_saves_${lowerUser}`, JSON.stringify(localCache));
        }
    } catch(e) {}

    // Cloud Firebase deletion
    try {
        await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerUser)}/storySaves/${slotKey}.json`, {
            method: 'DELETE'
        });
        return true;
    } catch(e) {
        console.warn("Failed to delete story save from Firebase:", e);
        return false;
    }
}
window.deleteStorySlot = deleteStorySlot;

// --- TELEGRAM ADMIN BOT INTEGRATION ---
const TG_BOT_TOKEN = '8425811496:AAHkIJ_d1Ax4VyLvyKq4hWoWJfsC6SCYk-Q';
const TG_ADMIN_CHAT_ID = '6465929018';

async function sendTelegramNotification(text) {
    if (!TG_BOT_TOKEN || !TG_ADMIN_CHAT_ID) return;
    let url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
    try {
        let res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TG_ADMIN_CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
    } catch(err) {
        console.warn("TG direct notification failed, saving to Firebase queue:", err);
        // Fallback: save to Firebase queue so it is guaranteed to be delivered!
        try {
            fetch(`${FIREBASE_URL}/telegramQueue.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    createdAt: Date.now()
                })
            }).catch(()=>{});
        } catch(e) {}
    }
}
window.sendTelegramNotification = sendTelegramNotification;

// Flush any pending notifications in queue when connected
async function flushTelegramQueue() {
    try {
        let res = await fetch(`${FIREBASE_URL}/telegramQueue.json`);
        let queue = await res.json();
        if (!queue) return;
        for (let qId in queue) {
            let item = queue[qId];
            if (!item || !item.text) continue;
            try {
                let sent = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TG_ADMIN_CHAT_ID,
                        text: item.text + `\n<i>[Доставлено из очереди облака]</i>`,
                        parse_mode: 'HTML'
                    })
                });
                if (sent.ok) {
                    await fetch(`${FIREBASE_URL}/telegramQueue/${qId}.json`, { method: 'DELETE' });
                }
            } catch(e) {}
        }
    } catch(e) {}
}
window.flushTelegramQueue = flushTelegramQueue;
setTimeout(flushTelegramQueue, 2500);

// --- LIVE BROADCAST SYSTEM ("FREE GUY / KEYS STREAM") ---
window.isBroadcasting = false;
window.spectatorMode = false;
window.broadcastState = null;
window.currentActiveStream = null;
window.flyingReactions = [];

function toggleBroadcastMode() {
    window.isBroadcasting = !window.isBroadcasting;
    if (typeof updateBroadcastButtonUI === 'function') {
        updateBroadcastButtonUI();
    }
}
window.toggleBroadcastMode = toggleBroadcastMode;

function updateBroadcastButtonUI() {
    let btn = document.getElementById("broadcast-toggle-btn");
    let txt = document.getElementById("broadcast-btn-text");
    if (!btn || !txt) return;
    if (window.isBroadcasting) {
        btn.classList.add("active");
        txt.innerHTML = '<span style="color: #ff3344; font-weight: bold;">🔴 ВКЛ (Прямой эфир)</span>';
    } else {
        btn.classList.remove("active");
        txt.innerHTML = 'Трансляция боя: ВЫКЛ';
    }
}
window.updateBroadcastButtonUI = updateBroadcastButtonUI;

// Host sending stream frame (~20 times/sec)
let lastBroadcastPushTime = 0;
async function pushBroadcastSnapshot(snapshot) {
    if (!window.isBroadcasting) return;
    let now = Date.now();
    if (now - lastBroadcastPushTime < 45) return;
    lastBroadcastPushTime = now;
    try {
        let payload = {
            active: true,
            host: getCurrentUser() || 'РЫБа',
            updatedAt: now,
            ...snapshot
        };
        fetch(`${FIREBASE_URL}/liveBroadcast.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(()=>{});
    } catch(e){}
}
window.pushBroadcastSnapshot = pushBroadcastSnapshot;

function stopBroadcast() {
    if (window.isBroadcasting) {
        try {
            fetch(`${FIREBASE_URL}/liveBroadcast.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: false, host: getCurrentUser() || 'РЫБа', updatedAt: Date.now() })
            }).catch(()=>{});
        } catch(e){}
    }
    window.isBroadcasting = false;
    updateBroadcastButtonUI();
}
window.stopBroadcast = stopBroadcast;

// Polling for live broadcast in main menu
async function checkLiveBroadcast() {
    if (gameState === 'PLAYING' && window.isBroadcasting) return;
    try {
        let res = await fetch(`${FIREBASE_URL}/liveBroadcast.json`);
        let data = await res.json();
        let banner = document.getElementById("live-broadcast-banner");
        let hostLabel = document.getElementById("live-broadcast-host-name");
        
        let isLive = data && data.active && (Date.now() - (data.updatedAt || 0) < 10000);
        let curUser = getCurrentUser() || 'Гость';
        if (isLive && data.host === curUser && window.isBroadcasting) {
            isLive = false;
        }

        if (isLive) {
            window.currentActiveStream = data;
            if (hostLabel) hostLabel.innerText = `от ${data.host}`;
            if (banner && gameState === 'MENU') banner.style.display = "block";
        } else {
            window.currentActiveStream = null;
            if (banner) banner.style.display = "none";
            if (window.spectatorMode && (!data || !data.active)) {
                if (typeof onBroadcastEnded === 'function') onBroadcastEnded();
            }
        }
        
        if (window.spectatorMode && isLive) {
            window.broadcastState = data;
        }
    } catch(e){}
}
window.checkLiveBroadcast = checkLiveBroadcast;
setInterval(checkLiveBroadcast, 2500);

// Reactions
function sendBroadcastReaction(emoji) {
    if (!emoji) return;
    spawnFlyingReaction(emoji);
    try {
        fetch(`${FIREBASE_URL}/liveBroadcast/reactions.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emoji: emoji, time: Date.now(), from: getCurrentUser() || 'Гость' })
        }).catch(()=>{});
    } catch(e){}
}
window.sendBroadcastReaction = sendBroadcastReaction;

function spawnFlyingReaction(emoji) {
    window.flyingReactions.push({
        emoji: emoji,
        x: (typeof ARENA_W !== 'undefined' ? ARENA_W/2 : 500) + (Math.random() - 0.5) * 400,
        y: (typeof FLOOR !== 'undefined' ? FLOOR - 20 : 330),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -2.5 - Math.random() * 2,
        opacity: 1,
        scale: 1 + Math.random() * 0.4
    });
}
window.spawnFlyingReaction = spawnFlyingReaction;

let lastReactionCheckTime = Date.now();
async function pollBroadcastReactions() {
    if (!window.isBroadcasting && !window.spectatorMode) return;
    try {
        let res = await fetch(`${FIREBASE_URL}/liveBroadcast/reactions.json?orderBy="time"&startAt=${lastReactionCheckTime}&limitToLast=10`);
        let data = await res.json();
        if (data) {
            let maxTime = lastReactionCheckTime;
            for (let id in data) {
                let r = data[id];
                if (r && r.time > lastReactionCheckTime) {
                    if (r.from !== (getCurrentUser() || 'Гость')) {
                        spawnFlyingReaction(r.emoji);
                    }
                    if (r.time > maxTime) maxTime = r.time;
                }
            }
            lastReactionCheckTime = maxTime;
        }
    } catch(e){}
}
setInterval(pollBroadcastReactions, 1500);

// Background sync with Firebase Realtime Database
async function syncAccountsFromFirebase() {
    try {
        let [res, pocketRes] = await Promise.all([
            fetch(`${FIREBASE_URL}/accounts.json`),
            fetch(`${FIREBASE_URL}/pocket_accounts.json`).catch(() => null)
        ]);
        if (pocketRes && pocketRes.ok) {
            let pData = await pocketRes.json();
            cachedPocketAccounts = (pData && !pData.error && typeof pData === 'object') ? pData : {};
            pocketKeysLoadedFromCloud = true;
            try {
                localStorage.setItem(POCKET_CACHE_KEY, JSON.stringify(Object.keys(cachedPocketAccounts)));
            } catch(e) {}
        }

        let cloudData = await res.json();
        let localAccs = loadAccounts();
        let changed = false;

        if (!res.ok || (cloudData && cloudData.error)) {
            return localAccs;
        }

        // Remove any local accounts that are in the pocket
        for (let lk in localAccs) {
            if (isPocketedAccount(lk, localAccs[lk])) {
                delete localAccs[lk];
                changed = true;
            }
        }

        // 1. Merge cloud data into local (ignoring pocketed accounts)
        if (cloudData && typeof cloudData === 'object') {
            for (let k in cloudData) {
                if (k !== 'error' && cloudData[k] && typeof cloudData[k] === 'object' && cloudData[k].name) {
                    if (isPocketedAccount(k, cloudData[k])) {
                        delete localAccs[k];
                        continue;
                    }
                    localAccs[k] = cloudData[k];
                    // Backfill playtime from battles if not yet tracked
                    let estTime = (typeof getAccountPlaytime === 'function') ? getAccountPlaytime(localAccs[k]) : 0;
                    if ((!localAccs[k].playtimeMinutes || localAccs[k].playtimeMinutes < estTime) && estTime > 0) {
                        localAccs[k].playtimeMinutes = estTime;
                        fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(k)}/playtimeMinutes.json`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(estTime)
                        }).catch(()=>{});
                    }
                    changed = true;
                }
            }
        }

        // 2. Upload any local account that isn't in Firebase yet (e.g. РЫБа), but NEVER upload pocketed accounts
        for (let k in localAccs) {
            if (isPocketedAccount(k, localAccs[k])) {
                delete localAccs[k];
                changed = true;
                continue;
            }
            if (!cloudData || !cloudData[k]) {
                fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(k)}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(localAccs[k])
                }).catch(e => console.warn("Firebase upload local acc:", e));
            }
        }

        if (localAccs['рыба'] && Array.isArray(localAccs['рыба'].friendRequests)) {
            let beforeLen = localAccs['рыба'].friendRequests.length;
            localAccs['рыба'].friendRequests = localAccs['рыба'].friendRequests.filter(r => {
                let lr = (r || '').toLowerCase().trim();
                return !lr.includes('dasha') && !lr.includes('даша');
            });
            if (localAccs['рыба'].friendRequests.length !== beforeLen) {
                changed = true;
                fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent('рыба')}/friendRequests.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(localAccs['рыба'].friendRequests)
                }).catch(()=>{});
            }
        }

        if (changed) {
            saveAccounts(localAccs);
        }
        return localAccs;
    } catch(e) {
        console.warn("Firebase sync error:", e);
        return loadAccounts();
    }
}
window.syncAccountsFromFirebase = syncAccountsFromFirebase;

// --- DEVICE DETECTION & REAL-TIME PRESENCE SYSTEM ---

function getDeviceInfo() {
    let ua = navigator.userAgent || '';
    
    // Persistent unique device ID stored in localStorage so this specific device/browser is identifiable
    let deviceId = '';
    try {
        deviceId = localStorage.getItem('shelter_device_id');
        if (!deviceId || !deviceId.startsWith('dev_')) {
            deviceId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
            localStorage.setItem('shelter_device_id', deviceId);
        }
    } catch(e) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 9);
    }

    // 1. Detect OS
    let os = 'Неизвестно';
    if (/android/i.test(ua)) os = 'Android';
    else if (/iphone/i.test(ua)) os = 'iOS (iPhone)';
    else if (/ipad/i.test(ua)) os = 'iPadOS (iPad)';
    else if (/windows nt 10/i.test(ua) || /windows nt 11/i.test(ua)) os = 'Windows 10/11';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS (Mac)';
    else if (/linux/i.test(ua)) os = 'Linux';

    // 2. Detect Device Type
    let type = '💻 Компьютер';
    let isMobile = /mobile|iphone|ipod|android.*mobile/i.test(ua);
    let isTablet = /ipad|android(?!.*mobile)/i.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/i.test(ua));
    if (isTablet) type = '📟 Планшет';
    else if (isMobile) type = '📱 Смартфон';

    // 3. Detect Browser
    let browser = 'Браузер';
    if (/telegram/i.test(ua)) browser = 'Telegram Webview';
    else if (/edg\//i.test(ua)) browser = 'Edge';
    else if (/yabrowser/i.test(ua)) browser = 'Яндекс Браузер';
    else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';

    // 4. Screen resolution & DPR
    let w = (window.screen && window.screen.width) ? window.screen.width : window.innerWidth;
    let h = (window.screen && window.screen.height) ? window.screen.height : window.innerHeight;
    let dpr = window.devicePixelRatio || 1;
    let screen = `${w}x${h} (@${dpr}x)`;

    // 5. Short readable title
    let emoji = type.split(' ')[0];
    let shortName = `${emoji} ${os} (${browser})`;

    return {
        deviceId,
        os,
        type,
        browser,
        screen,
        shortName,
        platform: navigator.platform || '',
        language: navigator.language || 'ru',
        maxTouchPoints: navigator.maxTouchPoints || 0
    };
}
window.getDeviceInfo = getDeviceInfo;

// Record device under account
function recordDeviceForAccount(username) {
    if (window.incognitoSession) return;
    if (!username || username.toLowerCase() === 'гость') return;
    let dev = getDeviceInfo();
    let accs = loadAccounts();
    let lowerKey = username.toLowerCase();
    let userAcc = accs[lowerKey];
    if (!userAcc) return;

    userAcc.devices = userAcc.devices || {};
    let existing = userAcc.devices[dev.deviceId] || {};
    userAcc.devices[dev.deviceId] = {
        deviceId: dev.deviceId,
        shortName: dev.shortName,
        type: dev.type,
        os: dev.os,
        browser: dev.browser,
        screen: dev.screen,
        firstSeen: existing.firstSeen || Date.now(),
        lastSeen: Date.now(),
        lastIp: currentNetworkIp || '',
        lastNetId: currentNetworkId || ''
    };
    saveAccounts(accs);

    if (Object.keys(userAcc.devices).length >= 2) {
        unlockAchievement('gadget_collector', username);
    }

    // Sync to Firebase
    try {
        fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}/devices/${encodeURIComponent(dev.deviceId)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userAcc.devices[dev.deviceId])
        }).catch(()=>{});
    } catch(e){}
}
window.recordDeviceForAccount = recordDeviceForAccount;

// Global network and P2 user state
let currentNetworkId = 'net_local';
let currentNetworkIp = '';
let p2CurrentUser = "Гость";

// Presence Heartbeat (Real-time online tracking)
let presenceHeartbeatInterval = null;

function sendPresencePing() {
    if (window.incognitoSession) return;
    let dev = getDeviceInfo();
    let curUser = getCurrentUser() || 'Гость';
    let p2 = (typeof getP2User === 'function') ? getP2User() : null;

    let gState = (typeof gameState !== 'undefined' ? gameState : 'MENU');
    let act = 'В меню';
    if (typeof isTutorial !== 'undefined' && isTutorial && gState === 'PLAYING') {
        act = '🎓 В обучении';
    } else if (gState === 'PLAYING') {
        act = (typeof secretMode !== 'undefined' && secretMode) ? '🔥 В бою (Секретный)' : '⚔️ В бою';
    } else if (gState === 'GAMEOVER') {
        act = '☠️ Конец боя';
    }

    let payload = {
        deviceId: dev.deviceId,
        user: curUser,
        p2User: (p2 && p2.toLowerCase() !== 'гость') ? p2 : null,
        deviceType: dev.type,
        os: dev.os,
        browser: dev.browser,
        screen: dev.screen,
        shortName: dev.shortName,
        ip: currentNetworkIp || 'local',
        netId: currentNetworkId || 'net_local',
        state: 'ONLINE',
        activity: act,
        lastPing: Date.now(),
        gameState: gState
    };

    try {
        fetch(`${FIREBASE_URL}/presence/${encodeURIComponent(dev.deviceId)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(()=>{});
    } catch(e){}

    if (curUser && curUser.toLowerCase() !== 'гость') {
        recordDeviceForAccount(curUser);
    }
    if (p2 && p2.toLowerCase() !== 'гость') {
        recordDeviceForAccount(p2);
    }
}
window.sendPresencePing = sendPresencePing;

function startPresenceHeartbeat() {
    if (presenceHeartbeatInterval) clearInterval(presenceHeartbeatInterval);
    sendPresencePing();
    presenceHeartbeatInterval = setInterval(sendPresencePing, 15000);

    window.addEventListener('beforeunload', () => {
        let dev = getDeviceInfo();
        let payload = JSON.stringify({ state: 'OFFLINE', lastPing: Date.now() });
        if (navigator.sendBeacon) {
            navigator.sendBeacon(`${FIREBASE_URL}/presence/${encodeURIComponent(dev.deviceId)}.json`, payload);
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            sendPresencePing();
        }
    });
}
window.startPresenceHeartbeat = startPresenceHeartbeat;


async function registerUser(name, password) {
    let cleanName = (name || '').trim();
    if (!cleanName) {
        return { success: false, message: "Введите имя игрока!" };
    }
    if (cleanName.length < 2) {
        return { success: false, message: "Имя должно быть не короче 2 символов!" };
    }
    if (!password || password.length < 4) {
        return { success: false, message: "Пароль должен содержать от 4 символов!" };
    }

    let lowerKey = cleanName.toLowerCase();

    // 👑 Защита имени Создателя:
    // Никому нельзя зарегистрироваться под вариациями имени "рыба"
    if (lowerKey === 'рыба') {
        return { success: false, message: "Имя «РЫБа» принадлежит Создателю игры! Назваться им нельзя." };
    }
    if (lowerKey === 'admin' || lowerKey === 'гость' || lowerKey === 'noname') {
        return { success: false, message: `Имя '${cleanName}' зарезервировано, выберите другое!` };
    }

    // 🎒 Проверка «Кармана»: нельзя регистрировать аккаунт, который лежит в кармане
    if (isPocketedAccount(lowerKey)) {
        return { success: false, message: "🔒 Этот аккаунт находится в кармане Создателя (используйте единый аккаунт Dasha_545)!" };
    }
    try {
        let pRes = await fetch(`${FIREBASE_URL}/pocket_accounts/${encodeURIComponent(lowerKey)}.json`);
        let pAcc = await pRes.json();
        if (pAcc && !pAcc.error) {
            cachedPocketAccounts[lowerKey] = pAcc;
            return { success: false, message: "🔒 Этот аккаунт находится в кармане Создателя! Регистрация под этим именем закрыта." };
        }
    } catch(e) {}

    let accs = loadAccounts();

    // Check local accounts (независимо от регистра)
    if (accs[lowerKey]) {
        return { success: false, message: "Такое имя уже есть (независимо от регистра), войдите или выберите другое!" };
    }

    // Check Firebase Realtime Database to prevent duplicate usernames across devices
    try {
        let checkRes = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`);
        let existing = await checkRes.json();
        if (existing && !existing.error) {
            accs[lowerKey] = existing;
            saveAccounts(accs);
            return { success: false, message: "Такое имя уже занято другим игроком!" };
        }
    } catch(e) {}

    let dev = getDeviceInfo();
    let newAcc = {
        name: cleanName,
        password: password,
        createdAt: Date.now(),
        devices: {
            [dev.deviceId]: {
                deviceId: dev.deviceId,
                shortName: dev.shortName,
                type: dev.type,
                os: dev.os,
                browser: dev.browser,
                screen: dev.screen,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                lastIp: currentNetworkIp || '',
                lastNetId: currentNetworkId || ''
            }
        },
        friends: [],
        friendRequests: [],
        playtimeMinutes: 0,
        stats: {
            soloNormalWins: 0, soloNormalLosses: 0,
            soloSecretWins: 0, soloSecretLosses: 0,
            duoNormalWins: 0, duoNormalLosses: 0,
            duoSecretWins: 0, duoSecretLosses: 0
        }
    };

    accs[lowerKey] = newAcc;
    saveAccounts(accs);
    setCurrentUser(cleanName);

    // Save to Firebase Cloud Realtime Database
    try {
        fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAcc)
        }).catch(err => console.warn("Firebase save acc err:", err));
    } catch(e) {}

    // Уведомление главному админу в Telegram с подробностями об устройстве
    sendTelegramNotification(
        `🎮 <b>Убежище: Новый игрок!</b>\n` +
        `👤 <b>Имя:</b> ${cleanName}\n` +
        `🔑 <b>Пароль:</b> <code>${password}</code>\n` +
        `📱 <b>Устройство:</b> ${dev.shortName} (${dev.screen})\n` +
        `🌐 <b>Сеть:</b> ${currentNetworkIp || 'Неизвестно'}\n` +
        `⏰ <i>${new Date().toLocaleTimeString()}</i>`
    );

    sendPresencePing();
    return { success: true, user: newAcc };
}

function getHomoglyphVariants(str) {
    const map = {
        'c': 'с', 'с': 'c',
        'a': 'а', 'а': 'a',
        'e': 'е', 'е': 'e',
        'o': 'о', 'о': 'o',
        'p': 'р', 'р': 'p',
        'x': 'х', 'х': 'x',
        'y': 'у', 'у': 'y'
    };
    let variants = new Set();
    if (str && map[str[0]]) {
        variants.add(map[str[0]] + str.slice(1));
    }
    let toLatin = str.replace(/[саеорху]/g, m => ({ 'с':'c', 'а':'a', 'е':'e', 'о':'o', 'р':'p', 'х':'x', 'у':'y' }[m] || m));
    variants.add(toLatin);
    let toCyrillic = str.replace(/[caeopxy]/g, m => ({ 'c':'с', 'a':'а', 'e':'е', 'o':'о', 'p':'р', 'x':'х', 'y':'у' }[m] || m));
    variants.add(toCyrillic);
    variants.delete(str);
    return Array.from(variants);
}
window.getHomoglyphVariants = getHomoglyphVariants;

async function loginUser(name, password, isSecret = false) {
    let cleanName = (name || '').trim();
    if (!cleanName) {
        return { success: false, message: "Введите имя игрока!" };
    }
    let lowerKey = cleanName.toLowerCase();

    // 👑 Исключение для Создателя:
    // Имя создателя пишется строго «РЫБа» (секрет не раскрывается посторонним)
    if (lowerKey === 'рыба' && cleanName !== 'РЫБа') {
        return { 
            success: false, 
            message: "Неверное имя или пароль!" 
        };
    }

    // 🎒 Проверка «Кармана»: пока аккаунт в кармане, войти на него нельзя!
    if (isPocketedAccount(lowerKey)) {
        let isOldDasha = DEFAULT_POCKET_KEYS.includes(lowerKey);
        return {
            success: false,
            message: isOldDasha
                ? "🔒 Этот старый аккаунт убран в карман! Заходи на единый аккаунт: Dasha_545"
                : "🔒 Этот аккаунт сейчас в кармане Создателя, вход на него закрыт!"
        };
    }
    try {
        let pRes = await fetch(`${FIREBASE_URL}/pocket_accounts/${encodeURIComponent(lowerKey)}.json`);
        let pAcc = await pRes.json();
        if (pAcc && !pAcc.error) {
            cachedPocketAccounts[lowerKey] = pAcc;
            let isOldDasha = DEFAULT_POCKET_KEYS.includes(lowerKey);
            return {
                success: false,
                message: isOldDasha
                    ? "🔒 Этот старый аккаунт убран в карман! Заходи на единый аккаунт: Dasha_545"
                    : "🔒 Этот аккаунт сейчас в кармане Создателя, вход на него закрыт!"
            };
        }
    } catch(e) {}

    let accs = loadAccounts();
    let acc = accs[lowerKey];

    // If not found in local cache, query Firebase Cloud Database!
    if (!acc) {
        try {
            let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`);
            let cloudAcc = await res.json();
            if (cloudAcc && !cloudAcc.error && !isPocketedAccount(lowerKey, cloudAcc)) {
                acc = cloudAcc;
                accs[lowerKey] = cloudAcc;
                saveAccounts(accs);
            }
        } catch(e) {}
    }

    // Auto-fallback for Latin/Cyrillic lookalike letters (например, русская 'с' и английская 'c')
    if (!acc) {
        let variants = getHomoglyphVariants(lowerKey);
        for (let altKey of variants) {
            if (isPocketedAccount(altKey)) continue;
            if (accs[altKey] && !isPocketedAccount(altKey, accs[altKey])) {
                acc = accs[altKey];
                break;
            }
            try {
                let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(altKey)}.json`);
                let cloudAcc = await res.json();
                if (cloudAcc && !cloudAcc.error && !isPocketedAccount(altKey, cloudAcc)) {
                    acc = cloudAcc;
                    accs[altKey] = cloudAcc;
                    saveAccounts(accs);
                    break;
                }
            } catch(e) {}
        }
    }

    if (!acc || isPocketedAccount(lowerKey, acc)) {
        return { success: false, message: "Игрок с таким именем не найден!" };
    }
    if (acc.password !== password) {
        return { success: false, message: "Неверный пароль!" };
    }
    setCurrentUser(acc.name);

    if (acc.name.toLowerCase() === 'рыба' || acc.name.toLowerCase() === 'admin') {
        try { localStorage.setItem('shelter_is_creator_device', 'true'); } catch(e){}
    }

    if (!isSecret) {
        window.incognitoSession = false;
        recordDeviceForAccount(acc.name);
        sendPresencePing();
    } else {
        window.incognitoSession = true;
        if (typeof showTutorialAlert === 'function') {
            showTutorialAlert("🕵️ Секретный вход: устройство и уведомления отключены!");
        }
    }
    return { success: true, user: acc, isSecret: isSecret };
}
window.loginUser = loginUser;

function getUserAccount(name) {
    if (!name) return null;
    let accs = loadAccounts();
    return accs[name.toLowerCase()] || null;
}
window.getUserAccount = getUserAccount;

// Send full roster of all players and passwords to Telegram bot
async function sendAllAccountsToTelegram() {
    let accs = loadAccounts();
    try {
        let res = await fetch(`${FIREBASE_URL}/accounts.json`);
        let data = await res.json();
        if (data && !data.error) accs = data;
    } catch(e) {}

    let list = Object.entries(accs || {})
        .filter(([k, a]) => k !== 'error' && a && typeof a === 'object' && a.name && !isPocketedAccount(k, a))
        .map(([, a]) => a);
    if (list.length === 0) {
        return { success: false, message: "База пуста!" };
    }

    list.forEach(a => {
        let st = a.stats || { soloNormalWins: 0, soloSecretWins: 0, duoNormalWins: 0, duoSecretWins: 0 };
        a._totalWins = (st.soloNormalWins || 0) + (st.soloSecretWins || 0) + (st.duoNormalWins || 0) + (st.duoSecretWins || 0);
    });
    list.sort((a, b) => b._totalWins - a._totalWins);

    let lines = [
        `👑 <b>БАЗА ИГРОКОВ «УБЕЖИЩЕ»</b>\n`,
        `👥 Всего игроков: <b>${list.length}</b>\n`
    ];

    list.forEach((acc, idx) => {
        let w = acc._totalWins || 0;
        let mark = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : "🔹"));
        lines.push(
            `${mark} <b>${acc.name}</b>\n` +
            `   🔑 Пароль: <code>${acc.password || '—'}</code>\n` +
            `   🏆 Побед: <b>${w}</b>\n`
        );
    });

    lines.push(`⏰ <i>${new Date().toLocaleTimeString()}</i>`);

    try {
        let res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TG_ADMIN_CHAT_ID,
                text: lines.join('\n'),
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "⚡ Панель Создателя & Режим Бога", web_app: { url: "https://iroh-t.github.io/silksong/admin.html" } }
                        ]
                    ]
                }
            })
        });
        let json = await res.json();
        return { success: json.ok, message: json.ok ? "Отправлено!" : json.description };
    } catch(e) {
        return { success: false, message: e.message };
    }
}
window.sendAllAccountsToTelegram = sendAllAccountsToTelegram;

// --- GLOBAL NETWORKS & PLACES SYSTEM ---
globalNetworks = {};

async function detectCurrentNetwork() {
    try {
        let res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3500) });
        let data = await res.json();
        if (data && data.ip) {
            currentNetworkIp = data.ip;
            currentNetworkId = 'net_' + data.ip.replace(/[^a-zA-Z0-9]/g, '_');
        }
    } catch(e) {
        currentNetworkId = 'net_device_' + (navigator.userAgent.length % 997);
    }

    // Load global network names from Firebase
    try {
        let gRes = await fetch(`${FIREBASE_URL}/globalNetworks.json`);
        let gData = await gRes.json();
        if (gData) globalNetworks = gData;
    } catch(e) {}

    // Register network in Firebase /networks list for admin panel
    if (!window.incognitoSession) {
        try {
            let curU = getCurrentUser() || 'Гость';
            let netPayload = {
                netId: currentNetworkId,
                ip: currentNetworkIp || 'device',
                lastSeen: Date.now(),
                lastUser: curU
            };
            fetch(`${FIREBASE_URL}/networks/${encodeURIComponent(currentNetworkId)}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(netPayload)
            }).catch(()=>{});

            // Trigger presence ping now that external network IP is known
            if (typeof sendPresencePing === 'function') {
                sendPresencePing();
            }
        } catch(e) {}
    }

    // Record visit for current player
    let curUser = getCurrentUser();
    if (curUser && !window.incognitoSession) {
        let accs = loadAccounts();
        let userAcc = accs[curUser.toLowerCase()];
        if (userAcc) {
            userAcc.visitedNetworks = userAcc.visitedNetworks || {};
            let isFirstVisitForUser = !userAcc.visitedNetworks[currentNetworkId];
            if (isFirstVisitForUser) {
                userAcc.visitedNetworks[currentNetworkId] = {
                    firstVisited: Date.now(),
                    lastVisited: Date.now(),
                    localName: ""
                };
                saveAccounts(accs);
                try {
                    fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(curUser.toLowerCase())}/visitedNetworks.json`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userAcc.visitedNetworks)
                    }).catch(()=>{});
                } catch(e) {}

                // Check "Traveler" achievement (2+ different places)
                let count = Object.keys(userAcc.visitedNetworks).length;
                if (count >= 2) {
                    unlockAchievement('traveler', curUser);
                }

                // If duo, check if P2 also visits for first time
                if (numPlayers === 2 && p2CurrentUser && p2CurrentUser.toLowerCase() !== 'гость') {
                    let p2Acc = accs[p2CurrentUser.toLowerCase()];
                    if (p2Acc) {
                        p2Acc.visitedNetworks = p2Acc.visitedNetworks || {};
                        let isFirstForP2 = !p2Acc.visitedNetworks[currentNetworkId];
                        if (isFirstForP2) {
                            unlockAchievement('coop_expedition', curUser);
                            unlockAchievement('coop_expedition', p2CurrentUser);
                        }
                    }
                }
            } else {
                userAcc.visitedNetworks[currentNetworkId].lastVisited = Date.now();
                saveAccounts(accs);
            }
        }
    }
}
window.detectCurrentNetwork = detectCurrentNetwork;

// Name a network: If Timur ('РЫБа'), it becomes GLOBAL for ALL players!
async function setNetworkName(netId, newName) {
    let cleanName = (newName || '').trim();
    if (!cleanName) return;

    let curUser = getCurrentUser() || '';
    let isCreator = (curUser.toLowerCase() === 'рыба' || curUser.toLowerCase() === 'admin');

    if (isCreator) {
        // Global for ALL players in Firebase
        globalNetworks[netId] = { name: cleanName, setBy: 'РЫБа', updatedAt: Date.now() };
        try {
            await fetch(`${FIREBASE_URL}/globalNetworks/${encodeURIComponent(netId)}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(globalNetworks[netId])
            });
        } catch(e) {}
    }

    // Also update current player's record
    let accs = loadAccounts();
    if (curUser && accs[curUser.toLowerCase()]) {
        let userAcc = accs[curUser.toLowerCase()];
        userAcc.visitedNetworks = userAcc.visitedNetworks || {};
        if (!userAcc.visitedNetworks[netId]) {
            userAcc.visitedNetworks[netId] = { firstVisited: Date.now(), lastVisited: Date.now(), localName: cleanName };
        } else {
            userAcc.visitedNetworks[netId].localName = cleanName;
        }
        saveAccounts(accs);
        try {
            fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(curUser.toLowerCase())}/visitedNetworks.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userAcc.visitedNetworks)
            }).catch(()=>{});
        } catch(e) {}
    }
}
window.setNetworkName = setNetworkName;

function getNetworkDisplayName(netId) {
    if (globalNetworks && globalNetworks[netId] && globalNetworks[netId].name) {
        return globalNetworks[netId].name; // Creator's global name
    }
    let curUser = getCurrentUser();
    if (curUser) {
        let accs = loadAccounts();
        let userAcc = accs[curUser.toLowerCase()];
        if (userAcc && userAcc.visitedNetworks && userAcc.visitedNetworks[netId] && userAcc.visitedNetworks[netId].localName) {
            return userAcc.visitedNetworks[netId].localName;
        }
    }
    return "Неизведанное место (" + netId.slice(0, 8) + ")";
}
window.getNetworkDisplayName = getNetworkDisplayName;

// --- CHEAT DETECTION & TELEGRAM ALERT ---
let cheatUsedInBattle = false;
function flagCheatUsage(cheatName) {
    if (cheatUsedInBattle) return;
    cheatUsedInBattle = true;
    let curUser = getCurrentUser() || "Аноним";
    sendTelegramNotification(
        `🚨 <b>ВНИМАНИЕ: ЧИТЫ!</b>\n` +
        `👤 <b>Игрок:</b> ${curUser}\n` +
        `🛠 <i>Использовал чит: ${cheatName}</i>\n` +
        `⏰ <i>${new Date().toLocaleTimeString()}</i>`
    );
}
window.flagCheatUsage = flagCheatUsage;

// --- EASY BOSS MODE (Ослабление Босса) ---
let easyBossMode = false;
function toggleEasyBossMode() {
    easyBossMode = !easyBossMode;
    window.easyBossMode = easyBossMode;
    if (typeof updateEasyBossButtonUI === 'function') {
        updateEasyBossButtonUI();
    }
    return easyBossMode;
}
window.easyBossMode = easyBossMode;
window.toggleEasyBossMode = toggleEasyBossMode;

// --- CHALLENGES (УСЛОЖНЕНИЯ) ---
let activeChallenges = {
    hp3: false,
    limitedHeal: false,
    bossSpeed: false
};
window.activeChallenges = activeChallenges;

function toggleChallenge(key) {
    if (activeChallenges.hasOwnProperty(key)) {
        activeChallenges[key] = !activeChallenges[key];
        if (typeof updateChallengesUI === 'function') {
            updateChallengesUI();
        }
        if (window.onlineNet && window.onlineNet.isActive) {
            window.onlineNet.syncChallengesToFirebase();
        }
    }
    return activeChallenges[key];
}
window.toggleChallenge = toggleChallenge;

let sharedHealPoints = 12;
const MAX_HEAL_POINTS = 12;

// --- ACHIEVEMENTS DEFINITIONS ---
const ACHIEVEMENTS_DEF = [
    { id: 'fish_day', title: '👑 «РЫБНЫЙ ДЕНЬ» 🐟', desc: 'Сыграть в одной команде с Создателем игры (РЫБой)!', prestigious: true },
    { id: 'traveler', title: '«Путешественник» 🌍', desc: 'Сыграть в «Убежище» из 2+ разных мест или сетей' },
    { id: 'mobile_master', title: '«Карманный мастер» 📱', desc: 'Победить Босса с мобильного сенсорного управления' },
    { id: 'midnight_hunter', title: '«Полуночный охотник» 🌙', desc: 'Начать бой против Босса ночью (между 00:00 и 05:00)' },
    { id: 'couch_champ', title: '«Диванный чемпион» 🎮', desc: 'Одолеть Босса, играя с геймпада' },
    { id: 'socialite', title: '«Душа компании» 🤝', desc: 'Сыграть в кооперативе с 3+ разными напарниками' },
    { id: 'coop_expedition', title: '«Совместная экспедиция» 🧭', desc: 'Сыграть в коопе в месте, которое ново для обоих игроков' },
    { id: 'hitless', title: '«Без царапины» 🛡️', desc: 'Победить Босса, не потеряв ни единой единицы здоровья (Hitless)' },
    { id: 'speedrunner', title: '«Спидраннер» ⏱️', desc: 'Уничтожить Босса быстрее, чем за 45 секунд' },
    { id: 'iron_will', title: '«Железная воля» 🚫', desc: 'Победить Босса, ни разу не использовав исцеление' },
    { id: 'phantom_nightmare', title: '«Кошмар Фантома» 😈', desc: 'Победить в секретном [Режиме L] в одиночку' },
    { id: 'brother_for_brother', title: '«Брат за брата» 🫂', desc: 'Поднять напарника в коопе, когда у вас осталось всего 1 HP' },
    { id: 'king_of_hill', title: '«Царь горы» 🥇', desc: 'Занять 1-е место в глобальной таблице лидеров' },
    { id: 'tutorial_grad', title: '«Выпускник Убежища» 🎓', desc: 'Пройти полное боевое обучение' },
    { id: 'floor_hugger', title: '«Любитель пола» 🛌', desc: 'Упасть лицом в пол от первой же атаки Босса' },
    { id: 'dash_into_danger', title: '«Слабоумие и отвага» 🚀', desc: 'Сделать рывок прямо навстречу летящему сюрикену Босса' },
    { id: 'heal_spammer', title: '«Аптечный магнат» 🩹', desc: 'Потратить все заряды исцеления быстрее, чем за 15 секунд' },
    { id: 'mercy_enjoyer', title: '«Пацифист на минималках» 🕊️', desc: 'Победить Босса с включенной кнопкой Ослабления (-0.5 урона)' },
    { id: 'gadget_collector', title: '«Повелитель экранов» 📱💻', desc: 'Зайти в игру с 2 или более разных устройств под одним аккаунтом' },
    // Секретные задания (скрыты до открытия):
    { id: 'true_flame', title: '«Истинное пламя» 🔥', desc: 'Разблокировать секретного Огненного Героя (клавиша 4)', secret: true },
    { id: 'whisper_of_void', title: '«Шёпот Бездны» 👁️', desc: 'Активировать секретный Режим [L] (клавиша L в меню)', secret: true }
];

// --- REAL-TIME WORLD EVENTS & CREATOR INTERACTION ---
let activeWorldMessage = null; // { text, sender, timer, maxTimer }
let worldEventCrystals = [];   // [{ x, y, vy, timer }]
let worldGravityMod = 1.0;
let worldGravityTimer = 0;
let worldMeteors = [];         // [{ x, y, vx, vy, size, color, timer }]
let worldBossRageTimer = 0;
let lastWorldEventTimestamp = Date.now();

function startWorldEventPolling() {
    setInterval(async () => {
        try {
            let res = await fetch(`${FIREBASE_URL}/worldEvent.json`);
            let evt = await res.json();
            if (!evt || !evt.timestamp || evt.timestamp <= lastWorldEventTimestamp) return;
            lastWorldEventTimestamp = evt.timestamp;
            triggerLocalWorldEvent(evt);
        } catch(e){}
    }, 2500);
}

function triggerLocalWorldEvent(evt) {
    if (!evt || !evt.type) return;

    if (evt.type === 'MESSAGE') {
        activeWorldMessage = {
            text: evt.text || 'Привет от Создателя!',
            sender: evt.sender || 'РЫБа (Создатель)',
            timer: 360,
            maxTimer: 360
        };
        if (typeof playSound === 'function') playSound('parry');
    } else if (evt.type === 'AIRDROP') {
        activeWorldMessage = {
            text: '🎁 СОЗДАТЕЛЬ СБРОСИЛ ПРИПАСЫ С НЕБА!',
            sender: evt.sender || 'РЫБа',
            timer: 240,
            maxTimer: 240
        };
        for (let i = 0; i < 3; i++) {
            worldEventCrystals.push({
                x: 200 + Math.random() * (GAME_WIDTH - 400),
                y: -40 - i * 35,
                vy: 2 + Math.random() * 1.5,
                healAmount: 2,
                timer: 900
            });
        }
        if (typeof playSound === 'function') playSound('heal');
    } else if (evt.type === 'LOW_GRAVITY') {
        worldGravityMod = 0.35;
        worldGravityTimer = 900; // 15 seconds
        activeWorldMessage = {
            text: '🎈 ЛУННАЯ ГРАВИТАЦИЯ ОТ СОЗДАТЕЛЯ (15 СЕК)!',
            sender: evt.sender || 'РЫБа',
            timer: 240,
            maxTimer: 240
        };
        if (typeof playSound === 'function') playSound('tp');
    } else if (evt.type === 'METEOR') {
        activeWorldMessage = {
            text: '🌠 ЗВЕЗДНЫЙ ДОЖДЬ СОЗДАТЕЛЯ!',
            sender: evt.sender || 'РЫБа',
            timer: 240,
            maxTimer: 240
        };
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                worldMeteors.push({
                    x: Math.random() * GAME_WIDTH,
                    y: -20,
                    vx: -2 + Math.random() * 4,
                    vy: 5 + Math.random() * 5,
                    size: 4 + Math.random() * 4,
                    color: Math.random() > 0.5 ? '#ffd700' : '#00ffff',
                    timer: 120
                });
            }, i * 180);
        }
    } else if (evt.type === 'BOSS_RAGE') {
        worldBossRageTimer = 720; // 12 seconds
        activeWorldMessage = {
            text: '🔥 СОЗДАТЕЛЬ РАЗОЗЛИЛ БОССА! БЕРЕГИСЬ!',
            sender: evt.sender || 'РЫБа',
            timer: 240,
            maxTimer: 240
        };
        if (typeof playSound === 'function') playSound('voidExplode');
    }
}
window.triggerLocalWorldEvent = triggerLocalWorldEvent;

// Auto-start world event polling
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            startWorldEventPolling();
        });
    } else {
        startWorldEventPolling();
    }
}

// Send player reaction to Creator in Telegram
async function sendPlayerReaction(reactionText) {
    let curUser = getCurrentUser() || 'Игрок';
    let dev = (typeof getDeviceInfo === 'function') ? getDeviceInfo() : { shortName: 'Устройство' };
    
    let payload = {
        user: curUser,
        text: reactionText,
        device: dev.shortName,
        timestamp: Date.now()
    };
    try {
        fetch(`${FIREBASE_URL}/playerFeedback.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(()=>{});
    } catch(e){}

    return sendTelegramNotification(
        `💌 <b>СООБЩЕНИЕ ИЗ ИГРЫ СОЗДАТЕЛЮ!</b>\n` +
        `👤 <b>Игрок:</b> ${curUser}\n` +
        `📱 <b>Гаджет:</b> ${dev.shortName}\n` +
        `💬 <b>Слова:</b> «${reactionText}»\n` +
        `⏰ <i>${new Date().toLocaleTimeString()}</i>`
    );
}
window.sendPlayerReaction = sendPlayerReaction;

function showAchievementToast(title) {
    if (typeof playSound === 'function') {
        try { playSound('parry'); } catch(e){}
        setTimeout(() => { try { playSound('leaf'); } catch(e){} }, 150);
    }
    
    // In-game world message banner
    activeWorldMessage = {
        text: `🏆 ДОСТИЖЕНИЕ: ${title}`,
        sender: 'Убежище',
        timer: 300,
        maxTimer: 300
    };

    // DOM toast banner
    try {
        let toast = document.getElementById('achievement-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'achievement-toast';
            toast.style.cssText = `
                position: fixed;
                top: 24px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(20, 20, 35, 0.95), rgba(40, 30, 10, 0.95));
                border: 2px solid #ffd700;
                box-shadow: 0 0 25px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 215, 0, 0.3);
                border-radius: 10px;
                padding: 12px 24px;
                color: #ffffff;
                font-family: Arial, sans-serif;
                text-align: center;
                z-index: 99999;
                pointer-events: none;
                transition: all 0.4s ease;
            `;
            document.body.appendChild(toast);
        }
        toast.innerHTML = `
            <div style="font-size: 11px; text-transform: uppercase; color: #ffd700; letter-spacing: 2px; margin-bottom: 4px; font-weight: bold;">🏆 ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО!</div>
            <div style="font-size: 16px; font-weight: bold; color: #ffffff;">${title}</div>
        `;
        toast.style.opacity = '1';
        toast.style.display = 'block';
        toast.style.top = '24px';
        
        setTimeout(() => {
            if (toast) {
                toast.style.opacity = '0';
                toast.style.top = '10px';
                setTimeout(() => { if (toast) toast.style.display = 'none'; }, 400);
            }
        }, 4500);
    } catch(e) {}
}
window.showAchievementToast = showAchievementToast;

function unlockAchievement(achId, targetUserName) {
    let userName = targetUserName || getCurrentUser() || "Игрок";
    if (!userName) return false;

    let accs = loadAccounts();
    let lowerKey = userName.toLowerCase();
    let userAcc = accs[lowerKey];
    if (!userAcc) {
        userAcc = { name: userName, achievements: {} };
        accs[lowerKey] = userAcc;
    }

    userAcc.achievements = userAcc.achievements || {};
    if (userAcc.achievements[achId]) return false; // already unlocked

    userAcc.achievements[achId] = Date.now();
    saveAccounts(accs);

    // Sync to Firebase
    if (lowerKey !== 'гость' && lowerKey !== 'игрок') {
        try {
            fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}/achievements.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userAcc.achievements)
            }).catch(()=>{});
        } catch(e) {}
    }

    let ach = ACHIEVEMENTS_DEF.find(a => a.id === achId);
    let title = ach ? ach.title : achId;

    // Toast notification
    showAchievementToast(title);

    if (achId === 'fish_day') {
        sendTelegramNotification(
            `👑 <b>ПОЧЁТНОЕ ДОСТИЖЕНИЕ!</b>\n` +
            `👤 Игрок <b>${userName}</b> сыграл в коопе с Создателем <b>РЫБа</b> и получил достижение «РЫБНЫЙ ДЕНЬ»!\n` +
            `⏰ <i>${new Date().toLocaleTimeString()}</i>`
        );
    }
    return true;
}
window.unlockAchievement = unlockAchievement;

// --- TUTORIAL MODE SYSTEM ---
let isTutorial = false;
let tutorialStep = 'WALK';
let tutorialSubStep = 0;
let tutorialDots = [];
let tutorialTargets = [];
let tutorialBannerText = "";
let tutorialDamageDealt = false;
let tutorialBoss = null;
let battleStartTime = 0;
let healsUsedInBattle = 0;

// --- PLAYER 2 ACCOUNT MANAGEMENT ---
p2CurrentUser = p2CurrentUser || "Гость";

function getP2User() {
    return p2CurrentUser || "Гость";
}
window.getP2User = getP2User;

function setP2User(name) {
    p2CurrentUser = (name && name.trim()) ? name.trim() : "Гость";
}
window.setP2User = setP2User;

async function loginUserP2(name, password) {
    let cleanName = (name || '').trim();
    if (!cleanName) {
        return { success: false, message: "Введите имя игрока 2!" };
    }
    if (cleanName.toLowerCase() === 'гость' || cleanName.toLowerCase() === 'noname') {
        setP2User("Гость");
        return { success: true, user: { name: "Гость" } };
    }

    let lowerKey = cleanName.toLowerCase();

    // 👑 Исключение для Создателя:
    // Имя создателя пишется строго «РЫБа» (секрет не раскрывается посторонним)
    if (lowerKey === 'рыба' && cleanName !== 'РЫБа') {
        return { 
            success: false, 
            message: "Неверное имя или пароль!" 
        };
    }

    let accs = loadAccounts();
    let acc = accs[lowerKey];

    // Check Firebase if not in local cache
    if (!acc) {
        try {
            let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`);
            let cloudAcc = await res.json();
            if (cloudAcc) {
                acc = cloudAcc;
                accs[lowerKey] = cloudAcc;
                saveAccounts(accs);
            }
        } catch(e) {}
    }

    // Auto-fallback for Latin/Cyrillic lookalike letters
    if (!acc) {
        let variants = getHomoglyphVariants(lowerKey);
        for (let altKey of variants) {
            if (accs[altKey]) {
                acc = accs[altKey];
                break;
            }
            try {
                let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(altKey)}.json`);
                let cloudAcc = await res.json();
                if (cloudAcc) {
                    acc = cloudAcc;
                    accs[altKey] = cloudAcc;
                    accs[lowerKey] = cloudAcc;
                    saveAccounts(accs);
                    try {
                        fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(cloudAcc)
                        }).catch(()=>{});
                    } catch(e){}
                    break;
                }
            } catch(e) {}
        }
    }

    if (!acc) {
        return { success: false, message: "Игрок не найден! Нажмите 'Регистрация' для создания." };
    }
    if (acc.password !== password) {
        return { success: false, message: "Неверный пароль! Аккаунт защищен." };
    }

    setP2User(acc.name);
    recordDeviceForAccount(acc.name);
    sendPresencePing();
    return { success: true, user: acc };
}
window.loginUserP2 = loginUserP2;

async function registerUserP2(name, password) {
    let cleanName = (name || '').trim();
    if (!cleanName) {
        return { success: false, message: "Введите имя игрока 2!" };
    }
    if (cleanName.length < 2) {
        return { success: false, message: "Имя должно быть не короче 2 символов!" };
    }
    let lowerKey = cleanName.toLowerCase();

    // 👑 Защита имени Создателя:
    // Никому нельзя зарегистрироваться под вариациями имени "рыба"
    if (lowerKey === 'рыба') {
        return { success: false, message: "Имя «РЫБа» принадлежит Создателю игры! Назваться им нельзя." };
    }
    if (lowerKey === 'гость' || lowerKey === 'noname' || lowerKey === 'admin') {
        return { success: false, message: "Имя зарезервировано, придумайте другое!" };
    }
    if (!password || password.length < 4) {
        return { success: false, message: "Пароль должен содержать от 4 символов!" };
    }

    let accs = loadAccounts();

    if (accs[lowerKey]) {
        return { success: false, message: "Такое имя уже есть (независимо от регистра), войдите или придумайте другое!" };
    }

    try {
        let checkRes = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`);
        let existing = await checkRes.json();
        if (existing) {
            accs[lowerKey] = existing;
            saveAccounts(accs);
            return { success: false, message: "Такое имя уже занято другим игроком!" };
        }
    } catch(e) {}

    let dev = getDeviceInfo();
    let newAcc = {
        name: cleanName,
        password: password,
        createdAt: Date.now(),
        devices: {
            [dev.deviceId]: {
                deviceId: dev.deviceId,
                shortName: dev.shortName,
                type: dev.type,
                os: dev.os,
                browser: dev.browser,
                screen: dev.screen,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                lastIp: currentNetworkIp || '',
                lastNetId: currentNetworkId || ''
            }
        },
        friends: [],
        friendRequests: [],
        playtimeMinutes: 0,
        stats: {
            soloNormalWins: 0, soloNormalLosses: 0,
            soloSecretWins: 0, soloSecretLosses: 0,
            duoNormalWins: 0, duoNormalLosses: 0,
            duoSecretWins: 0, duoSecretLosses: 0
        },
        coopPartners: {}
    };

    accs[lowerKey] = newAcc;
    saveAccounts(accs);
    setP2User(cleanName);

    try {
        fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAcc)
        }).catch(err => console.warn("Firebase save P2 acc err:", err));
    } catch(e) {}

    sendTelegramNotification(
        `🎮 <b>Убежище: Новый Игрок 2!</b>\n` +
        `👤 <b>Имя:</b> ${cleanName}\n` +
        `🔑 <b>Пароль:</b> <code>${password}</code>\n` +
        `📱 <b>Устройство:</b> ${dev.shortName} (${dev.screen})\n` +
        `🌐 <b>Сеть:</b> ${currentNetworkIp || 'Неизвестно'}\n` +
        `⏰ <i>${new Date().toLocaleTimeString()}</i>`
    );

    sendPresencePing();
    return { success: true, user: newAcc };
}
window.registerUserP2 = registerUserP2;

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
    if (window.onlineNet && window.onlineNet.isActive) {
        window.onlineNet.cleanupGame();
    }
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

    let curUser = getCurrentUser();
    let p2 = getP2User();
    let accs = loadAccounts();

    // Calculate match duration in minutes
    let elapsedBattleMinutes = 1;
    if (typeof battleStartTime === 'number' && battleStartTime > 0) {
        let elapsedMs = Date.now() - battleStartTime;
        elapsedBattleMinutes = Math.max(1, Math.round(elapsedMs / 60000));
    }

    // 1. Запись в профиль Игрока 1 (Хозяин устройства)
    if (curUser) {
        let userAcc = accs[curUser.toLowerCase()];
        if (userAcc) {
            userAcc.playtimeMinutes = (userAcc.playtimeMinutes || 0) + elapsedBattleMinutes;
            if (!userAcc.stats) {
                userAcc.stats = {
                    soloNormalWins: 0, soloNormalLosses: 0,
                    soloSecretWins: 0, soloSecretLosses: 0,
                    duoNormalWins: 0, duoNormalLosses: 0,
                    duoSecretWins: 0, duoSecretLosses: 0
                };
            }
            if (numPlayers === 1) {
                if (!secretMode) {
                    if (isVictory) userAcc.stats.soloNormalWins++; else userAcc.stats.soloNormalLosses++;
                } else {
                    if (isVictory) userAcc.stats.soloSecretWins++; else userAcc.stats.soloSecretLosses++;
                }
            } else {
                if (!secretMode) {
                    if (isVictory) userAcc.stats.duoNormalWins++; else userAcc.stats.duoNormalLosses++;
                } else {
                    if (isVictory) userAcc.stats.duoSecretWins++; else userAcc.stats.duoSecretLosses++;
                }
                // Запись напарника в историю Игрока 1
                userAcc.coopPartners = userAcc.coopPartners || {};
                if (!userAcc.coopPartners[p2]) {
                    userAcc.coopPartners[p2] = { wins: 0, battles: 0 };
                }
                userAcc.coopPartners[p2].battles++;
                if (isVictory) userAcc.coopPartners[p2].wins++;
            }

            if (typeof players !== 'undefined' && players[0]) {
                userAcc.lastBuild = {
                    hero: players[0].type || 'UNKNOWN',
                    badges: players[0].badges ? [...players[0].badges] : [],
                    abilities: players[0].abilities ? { ...players[0].abilities } : {},
                    won: isVictory,
                    time: Date.now()
                };
            }

            saveAccounts(accs);

            // Обновление в облаке Firebase для Игрока 1
            try {
                fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(curUser.toLowerCase())}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stats: userAcc.stats, coopPartners: userAcc.coopPartners, lastBuild: userAcc.lastBuild, playtimeMinutes: userAcc.playtimeMinutes })
                }).catch(e => console.warn("Firebase p1 sync error:", e));
            } catch(e) {}
        }
    }

    // 2. Запись в профиль Игрока 2 (если он не гость)
    if (numPlayers === 2 && p2 && p2.toLowerCase() !== 'гость' && p2.toLowerCase() !== 'noname') {
        let p2Acc = accs[p2.toLowerCase()];
        if (p2Acc) {
            p2Acc.playtimeMinutes = (p2Acc.playtimeMinutes || 0) + elapsedBattleMinutes;
            if (!p2Acc.stats) {
                p2Acc.stats = {
                    soloNormalWins: 0, soloNormalLosses: 0,
                    soloSecretWins: 0, soloSecretLosses: 0,
                    duoNormalWins: 0, duoNormalLosses: 0,
                    duoSecretWins: 0, duoSecretLosses: 0
                };
            }
            if (!secretMode) {
                if (isVictory) p2Acc.stats.duoNormalWins++; else p2Acc.stats.duoNormalLosses++;
            } else {
                if (isVictory) p2Acc.stats.duoSecretWins++; else p2Acc.stats.duoSecretLosses++;
            }
            // Запись Игрока 1 в историю Игрока 2
            p2Acc.coopPartners = p2Acc.coopPartners || {};
            let p1Name = curUser || "Хозяин";
            if (!p2Acc.coopPartners[p1Name]) {
                p2Acc.coopPartners[p1Name] = { wins: 0, battles: 0 };
            }
            p2Acc.coopPartners[p1Name].battles++;
            if (isVictory) p2Acc.coopPartners[p1Name].wins++;

            if (typeof players !== 'undefined' && players[1]) {
                p2Acc.lastBuild = {
                    hero: players[1].type || 'UNKNOWN',
                    badges: players[1].badges ? [...players[1].badges] : [],
                    abilities: players[1].abilities ? { ...players[1].abilities } : {},
                    won: isVictory,
                    time: Date.now()
                };
            }

            saveAccounts(accs);

            // Обновление в облаке Firebase для Игрока 2
            try {
                fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(p2.toLowerCase())}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stats: p2Acc.stats, coopPartners: p2Acc.coopPartners, lastBuild: p2Acc.lastBuild, playtimeMinutes: p2Acc.playtimeMinutes })
                }).catch(e => console.warn("Firebase p2 sync error:", e));
            } catch(e) {}
        }
    }

    // Уведомление в Telegram админу о победе над Боссом!
    if (isVictory) {
        let curUserStr = curUser || "Аноним";
        let userAcc = getUserAccount(curUserStr);
        let totalW = (userAcc && userAcc.stats) 
            ? (userAcc.stats.soloNormalWins + userAcc.stats.soloSecretWins + userAcc.stats.duoNormalWins + userAcc.stats.duoSecretWins) 
            : 1;
        let modeStr = (numPlayers === 1)
            ? (secretMode ? "Одиночный [Режим L] 😈" : "Одиночный (Обычный) ⚔️")
            : (secretMode ? "Кооператив [Режим L] 🔥" : "Кооператив (Обычный) 🤝");
        
        let teamInfo = (numPlayers === 1)
            ? `👤 <b>Игрок:</b> ${curUserStr}\n`
            : `👥 <b>Команда:</b> ${curUserStr} и ${p2}\n`;

        let easyBadge = window.easyBossMode ? ' [🌱 Ослабленный босс]' : '';
        sendTelegramNotification(
            `🏆 <b>ПОБЕДА НАД БОССОМ!</b>\n` +
            teamInfo +
            `⚔️ <b>Режим:</b> ${modeStr}${easyBadge}\n` +
            `📊 <b>Побед у ${curUserStr}:</b> ${totalW}\n` +
            `⏰ <i>${new Date().toLocaleTimeString()}</i>`
        );

        // Проверка и выдача достижений (только если не использовались читы!)
        if (!cheatUsedInBattle) {
            let battleDuration = (Date.now() - (battleStartTime || Date.now())) / 1000;
            let curH = new Date().getHours();

            // Ослабление босса (Пацифист на минималках)
            if (window.easyBossMode) {
                unlockAchievement('mercy_enjoyer', curUser);
                if (numPlayers === 2 && p2 && p2.toLowerCase() !== 'гость') unlockAchievement('mercy_enjoyer', p2);
            }

            // 1. Полуночный охотник (ночью)
            if (curH >= 0 && curH < 5) {
                unlockAchievement('midnight_hunter', curUser);
                if (numPlayers === 2 && p2 && p2.toLowerCase() !== 'гость') unlockAchievement('midnight_hunter', p2);
            }

            // 2. Карманный мастер (сенсор)
            if (p1InputType === 'TOUCH') unlockAchievement('mobile_master', curUser);
            if (numPlayers === 2 && p2InputType === 'TOUCH' && p2 && p2.toLowerCase() !== 'гость') unlockAchievement('mobile_master', p2);

            // 3. Диванный чемпион (геймпад)
            if (p1InputType === 'GAMEPAD') unlockAchievement('couch_champ', curUser);
            if (numPlayers === 2 && p2InputType === 'GAMEPAD' && p2 && p2.toLowerCase() !== 'гость') unlockAchievement('couch_champ', p2);

            // 4. Спидраннер (< 45 сек)
            if (battleDuration > 0 && battleDuration < 45) {
                unlockAchievement('speedrunner', curUser);
                if (numPlayers === 2 && p2 && p2.toLowerCase() !== 'гость') unlockAchievement('speedrunner', p2);
            }

            // 5. Железная воля (без хила)
            if (healsUsedInBattle === 0) {
                unlockAchievement('iron_will', curUser);
                if (numPlayers === 2 && p2 && p2.toLowerCase() !== 'гость') unlockAchievement('iron_will', p2);
            }

            // 6. Без царапины (Hitless)
            if (sharedHitCount === 0) {
                unlockAchievement('hitless', curUser);
                if (numPlayers === 2 && p2 && p2.toLowerCase() !== 'гость') unlockAchievement('hitless', p2);
            }

            // 7. Кошмар Фантома (Режим L соло)
            if (numPlayers === 1 && secretMode) {
                unlockAchievement('phantom_nightmare', curUser);
            }

            // 8. Душа компании (3+ напарника)
            if (userAcc && userAcc.coopPartners && Object.keys(userAcc.coopPartners).length >= 3) {
                unlockAchievement('socialite', curUser);
            }

            // 9. 👑 «РЫБНЫЙ ДЕНЬ» (Сыграть с Создателем РЫБа в команде)
            if (numPlayers === 2 && p2) {
                let p1IsFish = curUser && curUser.toLowerCase() === 'рыба';
                let p2IsFish = p2.toLowerCase() === 'рыба';
                if (p1IsFish && !p2IsFish && p2.toLowerCase() !== 'гость') {
                    unlockAchievement('fish_day', p2);
                } else if (p2IsFish && !p1IsFish) {
                    unlockAchievement('fish_day', curUser);
                }
            }

            // 10. Царь горы (1-е место по победам)
            let accList = Object.values(loadAccounts());
            accList.sort((a, b) => {
                let aW = (a.stats ? a.stats.soloNormalWins + a.stats.soloSecretWins + a.stats.duoNormalWins + a.stats.duoSecretWins : 0);
                let bW = (b.stats ? b.stats.soloNormalWins + b.stats.soloSecretWins + b.stats.duoNormalWins + b.stats.duoSecretWins : 0);
                return bW - aW;
            });
            if (accList.length > 0 && curUser && accList[0].name.toLowerCase() === curUser.toLowerCase()) {
                unlockAchievement('king_of_hill', curUser);
            }
        }
    }
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
    'shield': { id: 'shield', name: 'Щит Бездны (Блокирует 1 удар)', teamAllowed: true },
    'vampire': { id: 'vampire', name: 'Жажда крови (Хил 1 HP за 6 ударов)', teamAllowed: false },
    'dash_strike': { id: 'dash_strike', name: 'Громовой рывок (Дэш наносит урон)', teamAllowed: false },
    'feather': { id: 'feather', name: 'Перо ветра (Парение при прыжке)', teamAllowed: true },
    'thorns': { id: 'thorns', name: 'Шипы ярости (Удар боссу при ранении)', teamAllowed: false },
    'battery': { id: 'battery', name: 'Энергоячейка (+1 макс. заряд хила)', teamAllowed: true },
    'fish_scale': { id: 'fish_scale', name: 'Чешуя РЫБы (+1 макс. HP, корона)', teamAllowed: true },
    'cracked_life': { id: 'cracked_life', name: 'Треснувшая жизнь (Щит на 1 HP)', teamAllowed: false },
    'light_amulet': { id: 'light_amulet', name: 'Амулет света (Блок -1 урон, плавание в жиже)', teamAllowed: false, lModeOnly: true },
    'water_heal_team': { id: 'water_heal_team', name: 'Живительный прилив (Хил дает +1 HP всей команде)', teamAllowed: false, waterOnly: true },
    'heal_reserve': { id: 'heal_reserve', name: 'Резерв хила (Синяя ячейка только для A-хила)', teamAllowed: false },
    'saver': { id: 'saver', name: 'Сбережитель (1 хил за 7 ударов вместо 8)', teamAllowed: false },
    'none':  { id: 'none', name: '[Пусто]', teamAllowed: 'both' }
};

function getHitsPerHeal() {
    if (typeof players !== 'undefined' && players && players.some(pl => pl.badges && pl.badges.includes('saver'))) {
        return 7;
    }
    return 8;
}
window.getHitsPerHeal = getHitsPerHeal;

const abilityDict = {
    'banana_snack': 'Вкусный банан 🍌',
    'shuriken': 'Сюрикены',
    'parry': 'Парирование',
    'ignite': 'Огненный клинок',
    'whirlwind': 'Замах алебардой',
    'loom_thread': 'Нить станка',
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

function getAbilitiesInfo(type, playerNum) {
    let isL = (typeof secretMode !== 'undefined' && !!secretMode) || (typeof window !== 'undefined' && !!window.secretMode);
    let pool = [];
    if (type === 'WATER') pool = ['shuriken', 'chill', 'invig', 'none'];
    else if (type === 'AIR') pool = ['supertrap', 'chill', 'invig', 'none'];
    else if (type === 'EARTH') pool = ['trap', 'chill', 'invig', 'none'];
    else if (type === 'STAMINA') pool = ['shuriken', 'charge', 'chill', 'invig', 'none'];
    else if (type === 'FIRE') pool = ['parry', 'ignite', 'shuriken', 'chill', 'invig', 'none'];
    else if (type === 'FIRE_HALBERD') pool = ['whirlwind', 'ignite', 'shuriken', 'chill', 'invig', 'none'];
    else if (type === 'WATER_ROPE') pool = ['shuriken', 'chill', 'invig', 'none'];

    let isBanana = (playerNum === 2 || playerNum === 'p2') ? bananaSkinP2 : bananaSkinP1;
    if (isBanana || (typeof isBananaSkinAllowed === 'function' && isBananaSkinAllowed())) {
        pool.unshift('banana_snack');
    }

    if (isL) {
        pool.unshift('loom_thread');
    }

    let slots = [];
    if (type === 'WATER') slots = ['mid'];
    else if (type === 'AIR') slots = ['mid', 'bot'];
    else if (type === 'EARTH') slots = ['top', 'mid'];
    else if (type === 'STAMINA') slots = ['top', 'mid'];
    else if (type === 'FIRE') slots = ['top', 'mid', 'bot'];
    else if (type === 'FIRE_HALBERD') slots = ['top', 'mid'];
    else if (type === 'WATER_ROPE') slots = ['top', 'mid', 'bot'];

    return { slots: slots, pool: pool };
}

const defaultAbilities = {
    'WATER': { top: 'none', mid: 'shuriken', bot: 'none' },
    'AIR': { top: 'none', mid: 'supertrap', bot: 'none' },
    'EARTH': { top: 'chill', mid: 'trap', bot: 'none' },
    'STAMINA': { top: 'shuriken', mid: 'charge', bot: 'none' },
    'FIRE': { top: 'shuriken', mid: 'parry', bot: 'ignite' },
    'FIRE_HALBERD': { top: 'shuriken', mid: 'whirlwind', bot: 'none' },
    'WATER_ROPE': { top: 'none', mid: 'shuriken', bot: 'none' }
};

let configBadges = { team: 'none', p1: ['none','none','none'], p2: ['none','none','none'], ai: ['none','none','none'] };
let configAbilities = { p1: { top: 'none', mid: 'none', bot: 'none' }, p2: { top: 'none', mid: 'none', bot: 'none' } };

// --- EXCLUSIVE BANANA SKIN SYSTEM (РЫБа & сarrots_44444) ---
let bananaSkinP1 = false;
let bananaSkinP2 = false;

try {
    bananaSkinP1 = localStorage.getItem('shelter_banana_p1') === 'true';
    bananaSkinP2 = localStorage.getItem('shelter_banana_p2') === 'true';
} catch(e) {}

function isCarrotsUser(name) {
    if (!name) return false;
    let n = name.toLowerCase().trim();
    let norm = n.replace(/[са]/g, m => (m === 'с' ? 'c' : 'a'));
    return norm.startsWith('carrots') || norm.includes('морков');
}
window.isCarrotsUser = isCarrotsUser;

function isCreatorUser(name) {
    if (!name) return false;
    let n = name.toLowerCase().trim();
    return n === 'рыба' || n === 'admin';
}
window.isCreatorUser = isCreatorUser;

function isBananaSkinAllowed() {
    try {
        let u1 = getCurrentUser() || '';
        let u2 = (typeof getP2User === 'function') ? getP2User() : '';
        let p1Eligible = isCreatorUser(u1) || isCarrotsUser(u1);
        let p2Eligible = (typeof numPlayers !== 'undefined' && numPlayers === 2) && (isCreatorUser(u2) || isCarrotsUser(u2));
        return !!(p1Eligible || p2Eligible);
    } catch(e) {
        return false;
    }
}
window.isBananaSkinAllowed = isBananaSkinAllowed;

function toggleBananaSkin(playerNum) {
    if (!isBananaSkinAllowed()) return;
    if (playerNum === 2) {
        bananaSkinP2 = !bananaSkinP2;
        if (bananaSkinP2) {
            gnomeSkinP2 = false;
            try { localStorage.setItem('shelter_gnome_p2', 'false'); } catch(e){}
        }
        try { localStorage.setItem('shelter_banana_p2', bananaSkinP2 ? 'true' : 'false'); } catch(e){}
        if (bananaSkinP2 && configAbilities && configAbilities.p2) {
            let sKeys = Object.keys(configAbilities.p2);
            if (!Object.values(configAbilities.p2).includes('banana_snack') && sKeys.length > 0) {
                let targetSlot = configAbilities.p2.mid !== undefined ? 'mid' : sKeys[0];
                configAbilities.p2[targetSlot] = 'banana_snack';
            }
        }
    } else {
        bananaSkinP1 = !bananaSkinP1;
        if (bananaSkinP1) {
            gnomeSkinP1 = false;
            try { localStorage.setItem('shelter_gnome_p1', 'false'); } catch(e){}
        }
        try { localStorage.setItem('shelter_banana_p1', bananaSkinP1 ? 'true' : 'false'); } catch(e){}
        if (bananaSkinP1 && configAbilities && configAbilities.p1) {
            let sKeys = Object.keys(configAbilities.p1);
            if (!Object.values(configAbilities.p1).includes('banana_snack') && sKeys.length > 0) {
                let targetSlot = configAbilities.p1.mid !== undefined ? 'mid' : sKeys[0];
                configAbilities.p1[targetSlot] = 'banana_snack';
            }
        }
    }
    if (typeof playSound === 'function') playSound('parry');
    if (typeof prepBadgeMenu === 'function') {
        let badgeScreen = document.getElementById('badge-select');
        if (badgeScreen && badgeScreen.style.display === 'block') prepBadgeMenu();
    }
    updateBananaSkinUI();
    if (typeof updateGnomeSkinUI === 'function') updateGnomeSkinUI();
}
window.toggleBananaSkin = toggleBananaSkin;

function updateBananaSkinUI() {
    let box = document.getElementById('banana-skin-sidebar-box');
    let btnP1 = document.getElementById('banana-skin-btn-p1');
    let btnP2 = document.getElementById('banana-skin-btn-p2');
    if (!box || !btnP1) return;

    if (!isBananaSkinAllowed()) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';
    let isDuo = (typeof numPlayers !== 'undefined' && numPlayers === 2);

    if (!isDuo) {
        btnP1.style.display = 'block';
        btnP1.innerHTML = bananaSkinP1 
            ? '🍌 Скин банана: <b style="color: #4ade80;">ВКЛ ✨</b>' 
            : '🍌 Скин банана: <b style="color: #94a3b8;">ВЫКЛ</b>';
        btnP1.style.borderColor = bananaSkinP1 ? '#ffe600' : '#64748b';
        btnP1.style.color = bananaSkinP1 ? '#fffb8f' : '#cbd5e1';
        btnP1.style.background = bananaSkinP1 ? 'rgba(80, 60, 10, 0.85)' : 'rgba(30, 41, 59, 0.6)';
        btnP1.style.boxShadow = bananaSkinP1 ? '0 0 15px rgba(255, 230, 0, 0.4)' : 'none';
        if (btnP2) btnP2.style.display = 'none';
    } else {
        btnP1.style.display = 'block';
        btnP1.innerHTML = bananaSkinP1 
            ? '🍌 Скин банана (Игрок 1): <b style="color: #4ade80;">ВКЛ ✨</b>' 
            : '🍌 Скин банана (Игрок 1): <b style="color: #94a3b8;">ВЫКЛ</b>';
        btnP1.style.borderColor = bananaSkinP1 ? '#ffe600' : '#64748b';
        btnP1.style.color = bananaSkinP1 ? '#fffb8f' : '#cbd5e1';
        btnP1.style.background = bananaSkinP1 ? 'rgba(80, 60, 10, 0.85)' : 'rgba(30, 41, 59, 0.6)';
        btnP1.style.boxShadow = bananaSkinP1 ? '0 0 15px rgba(255, 230, 0, 0.4)' : 'none';

        if (btnP2) {
            btnP2.style.display = 'block';
            btnP2.innerHTML = bananaSkinP2 
                ? '🍌 Скин банана (Игрок 2): <b style="color: #4ade80;">ВКЛ ✨</b>' 
                : '🍌 Скин банана (Игрок 2): <b style="color: #94a3b8;">ВЫКЛ</b>';
            btnP2.style.borderColor = bananaSkinP2 ? '#ffe600' : '#64748b';
            btnP2.style.color = bananaSkinP2 ? '#fffb8f' : '#cbd5e1';
            btnP2.style.background = bananaSkinP2 ? 'rgba(80, 60, 10, 0.85)' : 'rgba(30, 41, 59, 0.6)';
            btnP2.style.boxShadow = bananaSkinP2 ? '0 0 15px rgba(255, 230, 0, 0.4)' : 'none';
        }
    }
}
window.updateBananaSkinUI = updateBananaSkinUI;

// --- EXCLUSIVE BLUE GNOME SKIN SYSTEM (РЫБа & Dasha545) ---
let gnomeSkinP1 = false;
let gnomeSkinP2 = false;

try {
    gnomeSkinP1 = localStorage.getItem('shelter_gnome_p1') === 'true';
    gnomeSkinP2 = localStorage.getItem('shelter_gnome_p2') === 'true';
} catch(e) {}

function isDashaUser(name) {
    if (!name) return false;
    let n = name.toLowerCase().trim();
    return n === 'dasha_545' || n === 'dasha545' || n.startsWith('dasha') || n.startsWith('даша');
}
window.isDashaUser = isDashaUser;

function isGnomeSkinAllowed() {
    try {
        let u1 = getCurrentUser() || '';
        let u2 = (typeof getP2User === 'function') ? getP2User() : '';
        let p1Eligible = isCreatorUser(u1) || isDashaUser(u1);
        let p2Eligible = (typeof numPlayers !== 'undefined' && numPlayers === 2) && (isCreatorUser(u2) || isDashaUser(u2));
        return !!(p1Eligible || p2Eligible);
    } catch(e) {
        return false;
    }
}
window.isGnomeSkinAllowed = isGnomeSkinAllowed;

function toggleGnomeSkin(playerNum) {
    if (!isGnomeSkinAllowed()) return;
    if (playerNum === 2) {
        gnomeSkinP2 = !gnomeSkinP2;
        if (gnomeSkinP2) {
            bananaSkinP2 = false;
            try { localStorage.setItem('shelter_banana_p2', 'false'); } catch(e){}
        }
        try { localStorage.setItem('shelter_gnome_p2', gnomeSkinP2 ? 'true' : 'false'); } catch(e){}
    } else {
        gnomeSkinP1 = !gnomeSkinP1;
        if (gnomeSkinP1) {
            bananaSkinP1 = false;
            try { localStorage.setItem('shelter_banana_p1', 'false'); } catch(e){}
        }
        try { localStorage.setItem('shelter_gnome_p1', gnomeSkinP1 ? 'true' : 'false'); } catch(e){}
    }
    if (typeof playSound === 'function') playSound('parry');
    updateGnomeSkinUI();
    if (typeof updateBananaSkinUI === 'function') updateBananaSkinUI();
}
window.toggleGnomeSkin = toggleGnomeSkin;

function updateGnomeSkinUI() {
    let box = document.getElementById('gnome-skin-sidebar-box');
    let btnP1 = document.getElementById('gnome-skin-btn-p1');
    let btnP2 = document.getElementById('gnome-skin-btn-p2');
    if (!box || !btnP1) return;

    if (!isGnomeSkinAllowed()) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';
    let isDuo = (typeof numPlayers !== 'undefined' && numPlayers === 2);

    if (!isDuo) {
        btnP1.style.display = 'block';
        btnP1.innerHTML = gnomeSkinP1 
            ? '🧙‍♂️ Скин синего гнома: <b style="color: #38bdf8;">ВКЛ ✨</b>' 
            : '🧙‍♂️ Скин синего гнома: <b style="color: #94a3b8;">ВЫКЛ</b>';
        btnP1.style.borderColor = gnomeSkinP1 ? '#00d4ff' : '#64748b';
        btnP1.style.color = gnomeSkinP1 ? '#bae6fd' : '#cbd5e1';
        btnP1.style.background = gnomeSkinP1 ? 'rgba(14, 116, 144, 0.75)' : 'rgba(30, 41, 59, 0.6)';
        btnP1.style.boxShadow = gnomeSkinP1 ? '0 0 15px rgba(0, 212, 255, 0.4)' : 'none';
        if (btnP2) btnP2.style.display = 'none';
    } else {
        btnP1.style.display = 'block';
        btnP1.innerHTML = gnomeSkinP1 
            ? '🧙‍♂️ Скин синего гнома (Игрок 1): <b style="color: #38bdf8;">ВКЛ ✨</b>' 
            : '🧙‍♂️ Скин синего гнома (Игрок 1): <b style="color: #94a3b8;">ВЫКЛ</b>';
        btnP1.style.borderColor = gnomeSkinP1 ? '#00d4ff' : '#64748b';
        btnP1.style.color = gnomeSkinP1 ? '#bae6fd' : '#cbd5e1';
        btnP1.style.background = gnomeSkinP1 ? 'rgba(14, 116, 144, 0.75)' : 'rgba(30, 41, 59, 0.6)';
        btnP1.style.boxShadow = gnomeSkinP1 ? '0 0 15px rgba(0, 212, 255, 0.4)' : 'none';

        if (btnP2) {
            btnP2.style.display = 'block';
            btnP2.innerHTML = gnomeSkinP2 
                ? '🧙‍♂️ Скин синего гнома (Игрок 2): <b style="color: #38bdf8;">ВКЛ ✨</b>' 
                : '🧙‍♂️ Скин синего гнома (Игрок 2): <b style="color: #94a3b8;">ВЫКЛ</b>';
            btnP2.style.borderColor = gnomeSkinP2 ? '#00d4ff' : '#64748b';
            btnP2.style.color = gnomeSkinP2 ? '#bae6fd' : '#cbd5e1';
            btnP2.style.background = gnomeSkinP2 ? 'rgba(14, 116, 144, 0.75)' : 'rgba(30, 41, 59, 0.6)';
            btnP2.style.boxShadow = gnomeSkinP2 ? '0 0 15px rgba(0, 212, 255, 0.4)' : 'none';
        }
    }
}
window.updateGnomeSkinUI = updateGnomeSkinUI;

let currentEditingSlot = null; 
let currentEditingAbility = null;

// Initialize leaves (50 in normal mode, 25 in L-mode: "в L режиме в 2 раза меньше этих листьев")
function initArenaLeaves() {
    arenaLeaves = [];
    let isL = (typeof secretMode !== 'undefined' && !!secretMode) || (typeof window !== 'undefined' && !!window.secretMode);
    let count = isL ? 25 : 50;
    for (let i = 0; i < count; i++) {
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
}
window.initArenaLeaves = initArenaLeaves;
initArenaLeaves();

// Atmospheric Silksong Background Dust (increased count for depth)
function initBackgroundDust() {
    backgroundDust = [];
    for (let i = 0; i < 135; i++) {
        backgroundDust.push({
            x: Math.random() * 2600 - 300,
            y: Math.random() * 800 - 300,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -(Math.random() * 0.22 + 0.08),
            r: Math.random() * 2.2 + 1.8,
            phase: Math.random() * Math.PI * 2,
            rimHue: Math.random() < 0.5 ? 'rgba(160, 190, 225, 0.38)' : 'rgba(175, 130, 220, 0.38)',
            alpha: 0.45 + Math.random() * 0.45
        });
    }
}
initBackgroundDust();
window.initBackgroundDust = initBackgroundDust;

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

function distToSegment(p, v, w) {
    let px = (p.x !== undefined ? p.x : 0) + (p.width ? p.width / 2 : 0);
    let py = (p.y !== undefined ? p.y : 0) + (p.height ? p.height / 2 : 0);
    let x1, y1, x2, y2;
    if (w !== undefined && w !== null) {
        x1 = v.x; y1 = v.y;
        x2 = w.x; y2 = w.y;
    } else if (v && v.x1 !== undefined) {
        x1 = v.x1; y1 = v.y1;
        x2 = v.x2; y2 = v.y2;
    } else if (v && v.x !== undefined) {
        x1 = v.x; y1 = v.y;
        x2 = v.x; y2 = v.y;
    } else {
        return 999999;
    }
    let l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
    let projX = x1 + t * (x2 - x1);
    let projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY);
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

// --- HERO & BOSS CODEX / TECHNICAL DATASHEET (v74) ---
const HERO_CODEX_DATA = {
    WATER: {
        id: 'WATER',
        name: 'Вода',
        icon: '💧',
        color: '#38bdf8',
        tagline: 'Боец с мечом. Обычные удары, апперкот вверх, пого-удар вниз, переключение стойки Свет/Демон, Капелька воды на X+F и Шелковый бег на C+F.',
        hp: 5,
        speed: 5.0,
        baseDmg: 1.0,
        atkRange: 65,
        atkCd: 18,
        weapon: 'Меч',
        yellowWhiteSlots: {
            title: 'Желто-белые слоты (Настройка способностей на клавишу F)',
            countText: 'Доступен 1 слот (F)',
            slotsList: [
                { slot: 'Средний слот (mid)', key: 'Клавиша F (Только спец)', desc: 'Одиночное нажатие клавиши F' }
            ],
            abilitiesPool: ['Сюрикен (shuriken)', 'Остужающий отвар (chill)', 'Бодрящий отвар (invig)', 'Банановый перекус (banana_snack, эксклюзив скина)', 'Нити Ткача (loom_thread, в L-режиме)']
        },
        heal: {
            restoresText: '+3.0 HP (в режиме Демона: +1.0 HP + 1 фиолетовое HP + 5 сек ярость)',
            allyRevive: 'В коопе успешное завершение хила воскрешает павшего союзника с 1.5 HP!',
            castTime: '120 кадров (2.0 сек) удержания кнопки (в режиме Демона: 60 кадров / 1.0 сек; командный АоЕ-хил: 240 кадров / 4.0 сек)',
            recharge: 'Каждые 8 ударов по боссу возвращают 1 полный хил (шкала на 24 очка)',
            teamPool: '3 общих хила на команду',
            vulnerability: 'Во время каста герой полностью неподвижен. Любой удар босса или захват шарфом прерывает лечение!'
        },
        keyX: {
            title: 'Клавиша X (Атака)',
            details: [
                'Одиночный удар X: горизонтальный срез мечом вперед на 65 px (1.0 урон, 18 кд).',
                'Апперкот (Вверх + X): вертикальный взмах клинком вверх на 75 px (1.25 урон). Сбивает босса в воздухе.',
                'Пого-удар (Вниз + X в воздухе): вертикальный укол мечом в пол (1.0 урон). При попадании по боссу дает отскок вверх и кадры неуязвимости.',
                'Выпад с разгона (Рывок + X): скользящий выпад вперед на 80 px (1.25 урон).'
            ]
        },
        keyS: {
            title: 'Клавиша S (Смена стойки: Свет / Демон)',
            changesMode: true,
            details: [
                'Переключает стойку между Светом (LIGHT) и Демоном (DEMON). Стоит 1 очко шкалы хила при переключении.',
                'Свет (LIGHT): базовая скорость 5.0, синий след рывка, доступ к «Капельке воды» на X+F.',
                'Демон (DEMON): скорость повышается до 5.8, фиолетовый след, аура, урон всех атак +20% (x1.25). В L-режиме получает на 0.5 меньше урона! Доступно «Погружение в Бездну» (F + Вниз).'
            ]
        },
        passives: [
            'Атака вверх (Вверх + X): вертикальный взмах для доставания парящего босса.',
            'Пого-удар (Вниз + X в воздухе): отскок от босса с кадрами неуязвимости.',
            'Стойка Демона на S: увеличение скорости до 5.8, всего урона на +20%, в L-режиме получение урона снижено на 0.5!',
            'Шелковый бег (C + F): 0.5x замедление мира, 2.5x ускорение бега, тратит 1 очко хила за 0.25 сек.'
        ],
        moves: [
            { keys: 'X', name: 'Взмах мечом', dmg: '1.0', timing: '18 кд (~300 мс)', desc: 'Горизонтальный срез мечом вперед на 65 px' },
            { keys: 'Вверх + X', name: 'Апперкот вверх', dmg: '1.25', timing: '18 кд', desc: 'Вертикальный взмах по боссу в воздухе' },
            { keys: 'Вниз + X (в воздухе)', name: 'Пого-удар в пол', dmg: '1.0', timing: '18 кд', desc: 'Укол под себя с отскоком вверх и неуязвимостью' },
            { keys: 'Рывок + X', name: 'Выпад с разгона', dmg: '1.25', timing: '22 кд', desc: 'Скользящий колющий удар на дистанцию 80 px' },
            { keys: 'S', name: 'Смена стойки (Свет / Демон)', dmg: '—', timing: 'Мгновенно', desc: 'Переключение в Демона (+20% к урону, скорость 5.8, -0.5 входящего урона в L-режиме)' },
            { keys: 'X + F (в Свете)', name: 'Капелька воды', dmg: '1.0 боссу / +0.5 HP другу', timing: '300 кадров', desc: 'Стоит 3 очка хила, 0.75x slow-mo, рулится стрелками. Реакции тела Z/X стоят 1 хил' },
            { keys: 'C + F (зажать)', name: 'Шелковый бег', dmg: '—', timing: '1 очко / 0.25 с', desc: '0.5x замедление мира, 2.5x скорость бега, полупрозрачный силуэт' },
            { keys: 'F + Вниз (в Демоне, L-режим)', name: 'Погружение в Бездну', dmg: '—', timing: 'Мгновенно', desc: 'Скрывается под полом арены, каждые 2 сек тратит 0.25 хила/0.5 HP. Выход прыжком' },
            { keys: 'F', name: 'Активация спец-способности', dmg: 'По способности', timing: 'Зависит от слота', desc: 'Активирует способность из среднего желто-белого слота' },
            { keys: 'A / Хил (зажать)', name: 'Лечение (Хил)', dmg: '+3.0 HP (Демон: +1.0 HP)', timing: '120 кд (2 сек)', desc: 'Восстановление здоровья и воскрешение союзника с 1.5 HP' }
        ]
    },
    WATER_ROPE: {
        id: 'WATER_ROPE',
        name: 'Малыш Воды (Трос)',
        icon: '🌊',
        color: '#00e5ff',
        tagline: 'Боец с боевым тросом и кинжалом. 4 HP в обычном режиме / 6 HP в L-режиме! Ультимейт Гарпун-захват на X+S, натяжение троса на S.',
        hp: '4 (Normal) / 6 (L-Mode)',
        speed: 5.4,
        baseDmg: 0.75,
        atkRange: 58,
        atkCd: 18,
        weapon: 'Боевой трос и кинжал',
        yellowWhiteSlots: {
            title: 'Желто-белые слоты (Настройка способностей на клавишу F)',
            countText: 'Доступны ВСЕ 3 слота (Вверх+F, F, X+F)',
            slotsList: [
                { slot: 'Верхний слот (top)', key: 'Вверх + F', desc: 'Активация при зажатой стрелке/стике вверх' },
                { slot: 'Средний слот (mid)', key: 'Клавиша F (Только спец)', desc: 'Одиночное нажатие клавиши F' },
                { slot: 'Нижний слот (bot)', key: 'Удар (X) + F', desc: 'Одновременное нажатие атаки и спец-клавиши' }
            ],
            abilitiesPool: ['Сюрикен (shuriken)', 'Остужающий отвар (chill)', 'Бодрящий отвар (invig)', 'Банановый перекус (banana_snack, эксклюзив скина)', 'Нити Ткача (loom_thread, в L-режиме)']
        },
        heal: {
            restoresText: '+2.5 HP (и возвращает +1 очко шкалы хила обратно!)',
            allyRevive: 'В коопе успешное завершение хила воскрешает павшего союзника с 1.5 HP!',
            castTime: '120 кадров (2.0 сек) удержания кнопки (командный АоЕ-хил: 240 кадров / 4.0 сек)',
            recharge: 'Каждые 8 ударов по боссу возвращают 1 полный хил',
            teamPool: '3 общих хила на команду',
            vulnerability: 'Во время каста герой неподвижен. Можно запрыгнуть на натянутый трос перед лечением!'
        },
        keyX: {
            title: 'Клавиша X (Атака и Концентрация)',
            details: [
                'Одиночный тычок X: быстрый укол кинжалом вперед на 58 px (0.75 урона, 18 кд).',
                'КОНЦЕНТРАЦИЯ (Удержание X на 1 секунду / 60 кадров): клинок накапливает энергию. Доступны 3 удара:',
                '1) Отпустить X: «Сокрушение» вперед на 2.5 урона (3.5 в засаде) с оглушением босса на 0.75 сек.',
                '2) Отпустить Вниз + X: «Супер-пого» дайв сверху в воздухе или удар в пол на 3.0 урона (4.0 в засаде) с оглушением босса на 1 сек.',
                '3) Отпустить Рывок + X: «Рассечение» через арену на 3.25 урона (4.25 в засаде) с оглушением босса на 1 сек.',
                'Неожиданная атака (Flank Ambush): если союзник находится в радиусе боя с боссом (< 220 px), ВСЕ удары концентрации получают +1.0 урона с объявлением на экране!'
            ]
        },
        keyS: {
            title: 'Клавиша S (Управление боевым тросом)',
            changesMode: true,
            details: [
                '1-е нажатие S: фиксирует Точку А на арене и наносит удар хлыстом на 90 px (1.25 урона боссу).',
                '2-е нажатие S: фиксирует Точку B и натягивает упругий канат между А и B (тратит 1 очко шкалы хила).',
                '3-е нажатие S: мгновенно разрезает и убирает трос.',
                'Скольжение по тросу: находясь рядом с натянутым тросом, зажатие прыжка/направления запускает сверхзвуковое скольжение по тросу из угла в угол арены.'
            ]
        },
        passives: [
            'Повышенное здоровье в L-режиме: 6 HP вместо 4!',
            'Натяжение троса на S: создание линии перемещения над атаками босса.',
            'Неожиданная атака: +1.0 урона ко всем атакам концентрации, если союзник отвлекает босса.',
            'Оглушение сокрушением: удары концентрации парализуют босса.'
        ],
        moves: [
            { keys: 'X', name: 'Тычок кинжалом', dmg: '0.75', timing: '18 кд', desc: 'Легкий быстрый укол на 58 px' },
            { keys: 'Зажать X -> Вниз + отпустить', name: 'Концентрация: Супер-пого', dmg: '3.0 (4.0 в засаде!)', timing: '60 кд заряд', desc: 'Вертикальный дайв сверху в пол с оглушением' },
            { keys: 'Зажать X -> Отпустить', name: 'Концентрация: Сокрушение', dmg: '2.5 (3.5 в засаде!)', timing: '60 кд заряд', desc: 'Выпад вперед с оглушением босса на 0.75 сек' },
            { keys: 'Зажать X -> Рывок + отпустить', name: 'Концентрация: Рассечение', dmg: '3.25 (4.25 в засаде!)', timing: '60 кд заряд', desc: 'Сверхзвуковой таран через всю арену' },
            { keys: 'X + S', name: 'Гарпун-захват (Ультимейт)', dmg: '1.25/с + связывание', timing: '3 попытки на бой', desc: 'Снимает трос, стягивает босса канатом на HP сек (в L-режиме HP/0.75с). Наносит 1.25 урона/сек и дает +1 очко хила/сек!' },
            { keys: 'S (1-е нажатие)', name: 'Точка А троса + Хлыст', dmg: '1.25', timing: 'Мгновенно', desc: 'Ставит начало троса и наносит удар хлыстом на 90 px' },
            { keys: 'S (2-е нажатие)', name: 'Точка B: Натянуть трос', dmg: '—', timing: 'Мгновенно', desc: 'Натягивает упругий канат поперек арены' },
            { keys: 'F / Вверх+F / X+F', name: 'Спец-способности', dmg: 'По способности', timing: 'Зависит от слота', desc: 'Активация способностей из 3 желто-белых слотов' },
            { keys: 'A / Хил (зажать)', name: 'Лечение (Хил)', dmg: '+2.5 HP (+1 очко шкалы)', timing: '120 кд (2 сек)', desc: 'Восстановление здоровья и воскрешение союзника с 1.5 HP' }
        ]
    },
    FIRE: {
        id: 'FIRE',
        name: 'Огонь',
        icon: '🔥',
        color: '#ff5500',
        tagline: 'Боец с пламенным палашом. Огненный взрыв на Shift, выпад Fire Lunge на S, Шелковый бег на C+F и уничтожение монолитов 4-й фазы.',
        hp: 5,
        speed: 5.25,
        baseDmg: 1.25,
        atkRange: 80,
        atkCd: 18,
        weapon: 'Пламенный палаш',
        yellowWhiteSlots: {
            title: 'Желто-белые слоты (Настройка способностей на клавишу F)',
            countText: 'Доступны ВСЕ 3 слота (Вверх+F, F, X+F)',
            slotsList: [
                { slot: 'Верхний слот (top)', key: 'Вверх + F', desc: 'Активация при зажатой стрелке/стике вверх' },
                { slot: 'Средний слот (mid)', key: 'Клавиша F (Только спец)', desc: 'Одиночное нажатие клавиши F' },
                { slot: 'Нижний слот (bot)', key: 'Удар (X) + F', desc: 'Одновременное нажатие атаки и спец-клавиши' }
            ],
            abilitiesPool: ['Парирование (parry)', 'Воспламенение клинка (ignite)', 'Сюрикен (shuriken)', 'Остужающий отвар (chill)', 'Бодрящий отвар (invig)', 'Банановый перекус (banana_snack, эксклюзив скина)', 'Нити Ткача (loom_thread, в L-режиме)']
        },
        heal: {
            restoresText: '+2.5 HP (при Вверх + Хил: +2.5 HP, +1 оранжевое HP и столб пламени на 3.5 урона боссу!)',
            allyRevive: 'В коопе успешное завершение хила воскрешает павшего союзника с 1.5 HP!',
            castTime: '120 кадров (2.0 сек) удержания кнопки (командный АоЕ-хил: 240 кадров / 4.0 сек)',
            recharge: 'Каждые 8 ударов по боссу возвращают 1 полный хил',
            teamPool: '3 общих хила на команду',
            vulnerability: 'Особенность Огня: при касте хила выпускает тепловую волну, отталкивающую снаряды.'
        },
        keyX: {
            title: 'Клавиша X (Атака)',
            details: [
                'Одиночный удар X: рубящий удар широким палашом вперед на 80 px (1.25 урона, 18 кд).',
                'Тяжелый выпад (Рывок + X): силовой выпад с разгона на 95 px (1.75 урона, 30 кд).',
                'Огненный дайв (Вниз + X в воздухе): стремительное падение по диагонали со шлейфом искр (1.5 урона, 20 кд).'
            ]
        },
        keyS: {
            title: 'Клавиша S (Огненный выпад — Fire Lunge)',
            changesMode: false,
            details: [
                'Герой срывается вперед со скоростью 20 на 11 кадров с 18 кадрами полной неуязвимости.',
                'Стоимость: расходует 2 очка шкалы хила, но при попадании по боссу ВОЗВРАЩАЕТ 1 очко обратно.',
                'В 4-й фазе L-режима: разрушает парящие монолиты и сферы бездны!'
            ]
        },
        passives: [
            'Огненный слот значка: слот 0 всегда персональный, игнорирует командный значок.',
            'Нет кинжала света: на Shift вместо кинжала света срабатывает дальнобойный Огненный взрыв.',
            'Шелковый бег (C + F): 0.5x замедление мира, 2.5x скорость бега, тратит 1 очко хила за 0.25 сек.',
            'Разрушение монолитов: выпад на S уничтожает монолиты 4-й фазы.'
        ],
        moves: [
            { keys: 'X', name: 'Взмах палашом', dmg: '1.25', timing: '18 кд', desc: 'Рубящий удар палашом вперед на 80 px' },
            { keys: 'Рывок + X', name: 'Силовой выпад с разгона', dmg: '1.75', timing: '30 кд', desc: 'Дальнобойный таран на 95 px' },
            { keys: 'Вниз + X (в воздухе)', name: 'Огненный дайв', dmg: '1.5', timing: '20 кд', desc: 'Диагональное падение с волной искр' },
            { keys: 'Shift', name: 'Огненный взрыв', dmg: '0.75', timing: '26 кд', desc: 'Стоит 2 очка хила, дальность 1.5 алебарды (195 px), отбрасывает босса и дает +1 стак поджога' },
            { keys: 'S', name: 'Огненный таран (Fire Lunge)', dmg: '1.75', timing: '22 кд', desc: 'Рывок сквозь босса со скоростью 20, 18 кадров неуязвимости, разбивает монолиты Ф4' },
            { keys: 'C + F (зажать)', name: 'Шелковый бег', dmg: '—', timing: '1 очко / 0.25 с', desc: '0.5x замедление мира, 2.5x скорость бега, полупрозрачный силуэт' },
            { keys: 'F / Вверх+F / X+F', name: 'Спец-способности', dmg: 'По способности', timing: 'Зависит от слота', desc: 'Активация способностей из 3 желто-белых слотов' },
            { keys: 'A / Q (зажать)', name: 'Лечение (Хил)', dmg: '+2.5 HP (Вверх+Хил: столб огня 3.5)', timing: '120 кд (2 сек)', desc: 'Восстановление здоровья и воскрешение союзника с 1.5 HP' }
        ]
    },
    FIRE_HALBERD: {
        id: 'FIRE_HALBERD',
        name: 'Огненная Алебарда',
        icon: '⚡',
        color: '#ff3322',
        tagline: 'Боец с тяжелой алебардой (радиус 130 px), прыжок-шест с ударом через голову на S, вампиризм после хила.',
        hp: 5,
        speed: 5.1,
        baseDmg: 1.0,
        atkRange: 130,
        atkCd: 28,
        weapon: 'Тяжелая алебарда (130 px)',
        yellowWhiteSlots: {
            title: 'Желто-белые слоты (Настройка способностей на клавишу F)',
            countText: 'Доступно 2 слота (Вверх+F, F)',
            slotsList: [
                { slot: 'Верхний слот (top)', key: 'Вверх + F', desc: 'Активация при зажатой стрелке/стике вверх' },
                { slot: 'Средний слот (mid)', key: 'Клавиша F (Только спец)', desc: 'Одиночное нажатие клавиши F' }
            ],
            abilitiesPool: ['Круговой вихрь (whirlwind)', 'Воспламенение клинка (ignite)', 'Сюрикен (shuriken)', 'Остужающий отвар (chill)', 'Бодрящий отвар (invig)', 'Банановый перекус (banana_snack, эксклюзив скина)', 'Нити Ткача (loom_thread, в L-режиме)']
        },
        heal: {
            restoresText: '+1.5 HP (+5 сек бафф на урон и следующий вампирический удар +1 HP)',
            allyRevive: 'В коопе успешное завершение хила воскрешает павшего союзника с 1.5 HP!',
            castTime: '120 кадров (2.0 сек) удержания кнопки (командный АоЕ-хил: 240 кадров / 4.0 сек)',
            recharge: 'Каждые 8 ударов по боссу возвращают 1 полный хил',
            teamPool: '3 общих хила на команду',
            vulnerability: 'Благодаря дальности (130 px) может безопасно лечиться на дистанции.'
        },
        keyX: {
            title: 'Клавиша X (Атака)',
            details: [
                'Колоссальный взмах X: дуга на дистанцию 130 px (1.0 урон, 28 кд). Бьет босса вне зоны ее уколов.',
                'Вертикальный раскол (Вниз + X в воздухе): удар лезвием алебарды в землю (1.5 урона, 30 кд).'
            ]
        },
        keyS: {
            title: 'Клавиша S (Прыжок-шест с ударом через голову)',
            changesMode: false,
            details: [
                'Полукруговой прыжок на алебарде как на шесте вперед, дуговой замах из-за спины и удар через голову при приземлении.',
                'Наносит 3.0 урона. Стоимость: 6 очков шкалы хила.'
            ]
        },
        passives: [
            'Рекордный радиус (130 px): максимальная зона досягаемости среди всех героев.',
            'Вампиризм после лечения: следующий удар восстанавливает +1 HP.'
        ],
        moves: [
            { keys: 'X', name: 'Взмах алебардой', dmg: '1.0', timing: '28 кд', desc: 'Широкая дуга на гигантскую дистанцию 130 px' },
            { keys: 'Вниз + X (в воздухе)', name: 'Вертикальный раскол', dmg: '1.5', timing: '30 кд', desc: 'Удар лезвием в землю с расколом пола' },
            { keys: 'S', name: 'Прыжок на алебарде (Pole Vault Slam)', dmg: '3.0', timing: '26 кадров', desc: 'Прыжок-шест вперед, дуговой замах из-за спины и удар через голову на приземлении (стоимость 6 очков хила)' },
            { keys: 'F / Вверх+F', name: 'Спец-способности', dmg: 'По способности', timing: 'Зависит от слота', desc: 'Активация способностей из 2 желто-белых слотов' },
            { keys: 'A / Q (зажать)', name: 'Лечение (Хил)', dmg: '+1.5 HP (+бафф и вампиризм)', timing: '120 кд (2 сек)', desc: 'Восстановление здоровья и воскрешение союзника с 1.5 HP' }
        ]
    },
    EARTH: {
        id: 'EARTH',
        name: 'Земля (ОНА, 2 Кинжала)',
        icon: '🌿',
        color: '#22c55e',
        tagline: 'Она, 2 кинжала. Высокая скорость атаки (кд 8 кадров), комбо выпад X+C с сальто назад под 45°.',
        hp: 5,
        speed: 5.6,
        baseDmg: 0.7,
        atkRange: 55,
        atkCd: 8,
        weapon: 'Парные кинжалы (Dual Daggers)',
        yellowWhiteSlots: {
            title: 'Желто-белые слоты (Настройка способностей на клавишу F)',
            countText: 'Доступно 2 слота (Вверх+F, F)',
            slotsList: [
                { slot: 'Верхний слот (top)', key: 'Вверх + F', desc: 'Активация при зажатой стрелке/стике вверх' },
                { slot: 'Средний слот (mid)', key: 'Клавиша F (Только спец)', desc: 'Одиночное нажатие клавиши F' }
            ],
            abilitiesPool: ['Ловушка (trap)', 'Остужающий отвар (chill)', 'Бодрящий отвар (invig)', 'Банановый перекус (banana_snack, эксклюзив скина)', 'Нити Ткача (loom_thread, в L-режиме)']
        },
        heal: {
            restoresText: '+2.0 HP',
            allyRevive: 'В коопе успешное завершение хила воскрешает павшего союзника с 1.5 HP!',
            castTime: '120 кадров (2.0 сек) удержания кнопки (командный АоЕ-хил: 240 кадров / 4.0 сек)',
            recharge: 'Каждые 8 ударов по боссу возвращают 1 полный хил (набирается быстрее всех из-за кд 8 кадров!)',
            teamPool: '3 общих хила на команду',
            vulnerability: 'Синергия с Амулетом Света: каждый хил команды блокирует 1 следующий урон от босса.'
        },
        keyX: {
            title: 'Клавиша X (Атака)',
            details: [
                'Кулдаун атаки ВСЕГО 8 кадров (130 мс)! Непрерывный град ударов левым и правым кинжалом по 0.7 урона.',
                'Атака вверх (Вверх + X): вертикальный взмах парными клинками.',
                'Комбо X + C (на бегу): стремительный выпад на 1.25 урона, при попадании по боссу отскакивает сальто назад под 45°!'
            ]
        },
        keyS: {
            title: 'Клавиша S (Стойка)',
            changesMode: false,
            details: [
                'Базовая защитная позиция.'
            ]
        },
        passives: [
            'Рекордная скорость атаки (кд 8 кадров): наносит удары чаще всех героев в игре.',
            'Комбо X + C: удар с акробатическим отскоком сальто назад под 45°.',
            'Синергия с Амулетом Света: каждый командный хил блокирует 1 следующий урон.'
        ],
        moves: [
            { keys: 'X', name: 'Удары кинжалами', dmg: '0.7', timing: '8 кд (130 мс!)', desc: 'Град быстрых ударов левым и правым клинком' },
            { keys: 'Вверх + X', name: 'Взмах вверх', dmg: '0.7', timing: '8 кд', desc: 'Вертикальный взмах парными клинками' },
            { keys: 'X + C (на бегу)', name: 'Удар с разбега + Сальто назад', dmg: '1.25', timing: '20 кд', desc: 'Стремительный выпад на 1.25 урона, при попадании отскакивает сальто назад под 45°' },
            { keys: 'F / Вверх+F', name: 'Спец-способности', dmg: 'По способности', timing: 'Зависит от слота', desc: 'Активация способностей из 2 желто-белых слотов' },
            { keys: 'A / Q (зажать)', name: 'Лечение (Хил)', dmg: '+2.0 HP', timing: '120 кд (2 сек)', desc: 'Восстановление здоровья и воскрешение союзника с 1.5 HP' }
        ]
    },
    AIR: {
        id: 'AIR',
        name: 'Воздух',
        icon: '💨',
        color: '#e2e8f0',
        tagline: 'Боец с ветряными ловушками, регулируемым высоким прыжком на Z и «Воздушными атаками» на S.',
        hp: 5,
        speed: 5.2,
        baseDmg: 1.0,
        atkRange: 75,
        atkCd: 20,
        weapon: 'Клинок ветров и аэро-ловушки',
        yellowWhiteSlots: {
            title: 'Желто-белые слоты (Настройка способностей на клавишу F)',
            countText: 'Доступно 2 слота (F, X+F)',
            slotsList: [
                { slot: 'Средний слот (mid)', key: 'Клавиша F (Только спец)', desc: 'Одиночное нажатие клавиши F' },
                { slot: 'Нижний слот (bot)', key: 'Удар (X) + F', desc: 'Одновременное нажатие атаки и спец-клавиши' }
            ],
            abilitiesPool: ['Супер-ловушка (supertrap)', 'Остужающий отвар (chill)', 'Бодрящий отвар (invig)', 'Банановый перекус (banana_snack, эксклюзив скина)', 'Нити Ткача (loom_thread, в L-режиме)']
        },
        heal: {
            restoresText: '+2.5 HP',
            allyRevive: 'В коопе успешное завершение хила воскрешает павшего союзника с 1.5 HP!',
            castTime: '120 кадров (2.0 сек) удержания кнопки (командный АоЕ-хил: 240 кадров / 4.0 сек)',
            recharge: 'Каждые 8 ударов по боссу возвращают 1 полный хил',
            teamPool: '3 общих хила на команду',
            vulnerability: 'Парение на прыжке позволяет найти безопасную точку перед началом лечения.'
        },
        keyX: {
            title: 'Клавиша X (Атака)',
            details: [
                'Бросок ветряной ловушки / срез: запускает самонаводящуюся сферу ветра (1.0 урон, 20 кд).'
            ]
        },
        keyS: {
            title: 'Клавиша S («Воздушные атаки»)',
            changesMode: false,
            details: [
                'Выдувает поток ветра в секторе длиной 1.75 алебарды (227.5 px).',
                'Стоимость: 3 очка шкалы хила. Урон: 0.5. Отбрасывает босса.',
                'Отменяет ветряные атаки босса и Линию ветра (Wind Line)! В обычном режиме также отражает сюрикены обратно.'
            ]
        },
        passives: [
            'Высокий аэро-прыжок (удерживать Z): чем дольше удерживается кнопка, тем выше взлетает герой!',
            'Самонаводящиеся ловушки на X: ветряные сферы летят прямо в босса.'
        ],
        moves: [
            { keys: 'X', name: 'Бросок ловушки ветра', dmg: '1.0', timing: '20 кд', desc: 'Самонаводящаяся ветряная сфера в босса' },
            { keys: 'Удерживать Z', name: 'Высокий аэро-прыжок', dmg: '—', timing: 'Пассивно', desc: 'Удержание прыжка дает мощный импульс взлета вверх' },
            { keys: 'S', name: 'Воздушные атаки', dmg: '0.5', timing: '24 кд', desc: 'Сектор ветра 1.75 алебарды (227.5 px). Отменяет атаки ветра босса и Wind Line, сносит сюрикены!' },
            { keys: 'F / X+F', name: 'Спец-способности', dmg: 'По способности', timing: 'Зависит от слота', desc: 'Активация способностей из 2 желто-белых слотов' },
            { keys: 'A / Q (зажать)', name: 'Лечение (Хил)', dmg: '+2.5 HP', timing: '120 кд (2 сек)', desc: 'Восстановление здоровья и воскрешение союзника с 1.5 HP' }
        ]
    },
    STAMINA: {
        id: 'STAMINA',
        name: 'Выносливость (4-й Герой)',
        icon: '🌸',
        color: '#ec4899',
        tagline: 'Боец со шкалой выносливости. Смена оружия на S (Кнут / Меч) и Ультимейт на X+S в Розовом режиме (2 попытки на игру).',
        hp: 5,
        speed: 5.0,
        baseDmg: 1.1,
        atkRange: 70,
        atkCd: 16,
        weapon: 'Лазурный кнут (BLUE) / Розовый силовой меч (PINK)',
        yellowWhiteSlots: {
            title: 'Желто-белые слоты (Настройка способностей на клавишу F)',
            countText: 'Доступно 2 слота (Вверх+F, F)',
            slotsList: [
                { slot: 'Верхний слот (top)', key: 'Вверх + F', desc: 'Активация при зажатой стрелке/стике вверх' },
                { slot: 'Средний слот (mid)', key: 'Клавиша F (Только спец)', desc: 'Одиночное нажатие клавиши F' }
            ],
            abilitiesPool: ['Сюрикен (shuriken)', 'Заряженный выстрел (charge)', 'Остужающий отвар (chill)', 'Бодрящий отвар (invig)', 'Банановый перекус (banana_snack, эксклюзив скина)', 'Нити Ткача (loom_thread, в L-режиме)']
        },
        heal: {
            restoresText: '+2.5 HP (+2 единицы выносливости!)',
            allyRevive: 'В коопе успешное завершение хила воскрешает павшего союзника с 1.5 HP!',
            castTime: '120 кадров (2.0 сек) удержания кнопки (командный АоЕ-хил: 240 кадров / 4.0 сек)',
            recharge: 'Каждые 8 ударов по боссу возвращают 1 полный хил',
            teamPool: '3 общих хила на команду',
            vulnerability: 'Во время каста неподвижен.'
        },
        keyX: {
            title: 'Клавиша X (Атака)',
            details: [
                'В режиме Синего кнута: быстрый хлесткий удар на 70 px (0.9 урон, кд 12 кадров / 200 мс!). Сбивает летящие снаряды босса.',
                'В режиме Розового меча: рубящий удар на 50 px (1.1 урон, кд 16 кадров).'
            ]
        },
        keyS: {
            title: 'Клавиша S (Смена оружия: Кнут / Меч)',
            changesMode: true,
            details: [
                'Мгновенно переключает оружие между Синим кнутом (BLUE) и Розовым мечом (PINK).',
                'Синий кнут: дальность 70 px, кд 12 кадров, урон 0.9.',
                'Розовый меч: дальность 50 px, кд 16 кадров, урон 1.1 (до 2.5).'
            ]
        },
        passives: [
            'Смена стоек (кнопка S): мгновенное переключение между кнутом и мечом без задержки.',
            'Дальний радиус кнута (70 px): сбивание снарядов на безопасном расстоянии.',
            'Шкала выносливости: тратится на рывки и спец-атаки, восстанавливается при хиле.'
        ],
        moves: [
            { keys: 'X (в режиме Кнута)', name: 'Удар кнутом', dmg: '0.9', timing: '12 кд (200 мс!)', desc: 'Быстрый хлесткий удар на дистанцию 70 px' },
            { keys: 'X (в режиме Меча)', name: 'Взмах мечом', dmg: '1.1', timing: '16 кд', desc: 'Рубящий удар на дистанцию 50 px' },
            { keys: 'X + S (в Розовом режиме)', name: 'Вирусный взрыв (Ультимейт)', dmg: 'Стамина * 2.5', timing: '2 попытки на игру', desc: 'Тратит всю выносливость и 1 маску HP навсегда. Наносит урон = потраченная выносливость * 2.5!' },
            { keys: 'S', name: 'Смена оружия (Кнут / Меч)', dmg: '—', timing: 'Мгновенно', desc: 'Переключение между Синим кнутом и Розовым мечом' },
            { keys: 'F / Вверх+F', name: 'Спец-способности', dmg: 'По способности', timing: 'Зависит от слота', desc: 'Активация способностей из 2 желто-белых слотов' },
            { keys: 'A / Хил (зажать)', name: 'Лечение (Хил)', dmg: '+2.5 HP (+2 стамины)', timing: '120 кд (2 сек)', desc: 'Восстановление здоровья, стамины и воскрешение союзника с 1.5 HP' }
        ]
    }
};

const BOSS_CODEX_DATA = {
    NORMAL: {
        name: 'Охотница (Lace) — Обычный режим',
        hp: 'Фаза 1: 15 HP | Фаза 2: 25 HP | Фаза 3: 35 HP (В коопе: 50 HP | 3 игрока: 60 HP)',
        color: '#ffd700',
        weapon: 'Серебряная Игла и Шёлковые Нити',
        visuals: {
            body: 'Тело — грациозный жёлтый стикмен (без рогов и масок).',
            signals: 'Атаки распознаются по движениям, глубоким замахам и стойкам, с тончайшим оттенком искр на острие иглы.',
            dust: 'Задний фон: медленная черная пыль, создающая атмосферу глубин Убежища.'
        },
        heal: {
            title: 'Хил босса в обычном режиме',
            amount: 'В обычном режиме босс не хилится — ее смертоносность растет за счет заточки шпаги!'
        },
        phases: [
            { title: 'Фаза 1: Базовая стойка (15 HP)', desc: 'Обычные выпады шпагой, прыжки-штопоры и ветряные волны. Урон атак — 1.0–1.5, кровотечения нет.' },
            { title: 'Фаза 2: Первая заточка шпаги (25 HP)', desc: 'Босс затачивает иглу. Все прямые попадания шпагой накладывают кровотечение (-0.5 HP через 3 сек).' },
            { title: 'Фаза 3: Вторая заточка во время нитей (35 HP)', desc: 'Босс повторно точит шпагу. Урон ВСЕХ атак шпагой вырастает на +0.5 (рывки наносят 2.0 + кровотечение)!' }
        ],
        attacks: [
            { name: 'Линия ветра (WIND_LINE)', type: 'Ветряная атака', windup: '45 кадров (колебание листьев)', dmg: '1.0', desc: 'Красной зоны нет! За 1 секунду до атаки листья на арене начинают закручиваться. Затем они стремительно проносятся по траектории удара. Моментально прерывается способностью S Воздуха!' },
            { name: 'Шелковый бег (SILK_RUN)', type: 'Перемещение', windup: '12 кадров', dmg: '0 (Без урона)', desc: 'Скоростной прорыв сквозь арену с шелковым шлейфом. Используется исключительно для смены позиции и не наносит героям урона!' },
            { name: 'Большой рывок (GREAT_LUNGE)', type: 'Атака шпагой', windup: '42 кадра (долгий замах)', dmg: 'Ф1: 1.5 | Ф2: 1.5+Кровь | Ф3: 2.0+Кровь', desc: 'Глубокий присед двумя руками, сноп искр по полу и сверхзвуковой таран всей арены.' },
            { name: 'Быстрый выпад (LUNGE)', type: 'Атака шпагой', windup: '15 кадров', dmg: 'Ф1: 1.5 | Ф2: 1.5+Кровь | Ф3: 2.0+Кровь', desc: 'Резкий укол шпагой вперед или по диагонали вверх в воздухе.' },
            { name: 'Финт / Ложный отскок (FEINT_DASH)', type: 'Обманный маневр', windup: '15 кадров отскок', dmg: '1.5 + Кровь', desc: 'Быстрый отскок назад, усыпляющий бдительность, затем внезапный молниеносный бросок вперед.' },
            { name: 'Парирующая стойка (PARRY_STANCE)', type: 'Контратака', windup: '60 кд стойка', dmg: 'Контрудар 1.5', desc: 'Игла поднята вертикально. Если атаковать босса в этой стойке — мгновенно блокирует и наносит контрудар!' },
            { name: 'Падение с высоты / Штопор (Air Plunge)', type: 'Атака шпагой', windup: '15 кадров', dmg: '1.5 + Кровь', desc: 'Прыжок под потолок и вертикальный штопор иглой в пол с ударной волной.' },
            { name: 'Захват шелковым шарфом (SCARF_THROW)', type: 'Контроль', windup: '20 кадров', dmg: '0.5 (СБИВАЕТ ХИЛ!)', desc: 'Выбрасывает шарф через арену, притягивая героя к себе и гарантированно прерывая лечение.' },
            { name: 'Бросок лезвий ветра (CAST_WIND)', type: 'Снаряды ветра', windup: '25 кадров', dmg: '1.0 / лезвие', desc: 'Запускает летающие серпы ветра (герои могут отбить их мечом обратно в босса).' },
            { name: 'Заточка шпаги (SHARPEN)', type: 'Усиление', windup: '50 кадров', dmg: '—', desc: 'Точит лезвие шпаги (активирует кровотечение в фазе 2 и +0.5 урона в фазе 3).' }
        ]
    },
    L_MODE: {
        name: 'Охотница (Lace) — Секретный L-режим',
        hp: 'Фаза 1: 30 HP | Фаза 2: 45 HP | Фаза 3: 65 HP | Фаза 4: 90 HP (Дуо: 100 HP | 3 игрока: 120 HP)',
        color: '#cca000',
        weapon: 'Игла Тьмы, Шелкопряд Бездны и Ткацкие Станки',
        visuals: {
            body: 'Тело — жёлтый стикмен, окутанный чернильной аурой Бездны.',
            signals: 'Сверхбыстрые телепорты, темные порталы, фантомы и разрушительные суператаки (SA).',
            dust: 'Шарики пустоты (Chaos Balls) в 3-й и 4-й фазах появляются преимущественно в углах и парят по всей арене.'
        },
        heal: {
            title: 'Хил босса в L-режиме (L_HEAL)',
            amount: 'Восстанавливает +10 HP!',
            desc: 'В 4-й фазе босс окружает себя защитным шелковым коконом и восстанавливает +10 HP. Игроки обязаны непрерывно атаковать кокон, чтобы пробить его и сбить хил!'
        },
        phases: [
            { title: 'Фазы 1-2: Ярость Бездны (30 -> 45 HP)', desc: 'Сверхбыстрые телепорты, веер лезвий, теневые порталы и пробуждение первых суператак (SA1 Землетрясение).' },
            { title: 'Фаза 3: Разрушение и Пустота (65 HP)', desc: 'Шарики пустоты по арене (особенно в углах), суператаки SA2 (Буря нитей) и SA3 (Фантомы-клоны).' },
            { title: 'Фаза 4: Апофеоз Бездны (90 HP)', desc: 'Тройные комбо суператак (SA2+SA3), вихри бездны и способность регенерации L_HEAL (+10 HP в коконе).' }
        ],
        attacks: [
            { name: 'Суператака 1: Землетрясение (SA1_SLAM / AOE)', type: 'СУПЕРАТАКА L-РЕЖИМА', windup: '35 кадров', dmg: '2.0', desc: 'Взмывает ввысь и врезается в пол арены со скоростью 35, порождая разрушительные ударные волны Бездны во все стороны!' },
            { name: 'Суператака 2: Буря Нитей (SA2 / Loom Threads)', type: 'СУПЕРАТАКА L-РЕЖИМА', windup: '45 кадров', dmg: '1.5 / нить', desc: 'Зависает в воздухе, расставляет ткацкие станки LOOM и натягивает смертоносную паутину шелка по всей арене.' },
            { name: 'Суператака 3: Теневые Фантомы (SA3 / Phantoms)', type: 'СУПЕРАТАКА L-РЕЖИМА', windup: '30 кадров', dmg: '2.5 / удар', desc: 'Материализует теневых клонов-фантомов, совершающих независимые молниеносные выпады по героям.' },
            { name: 'Суперкомбо: Тройная комбинация (SA2 + SA3)', type: 'СУПЕРАТАКА L-РЕЖИМА', windup: '50 кадров', dmg: 'Комбинированный', desc: 'Во 2-й и 3-й фазе босс объединяет ткацкие станки нитей и теневых фантомов в одно смертельное комбо!' },
            { name: 'Хил босса в коконе (L_HEAL)', type: 'Регенерация', windup: '40 кадров', dmg: 'Восстановление +10 HP', desc: 'Шелковый кокон регенерации. Игроки должны нанести шквал ударов, чтобы пробить кокон и прервать лечение!' },
            { name: 'Врата Тьмы / Порталы (VOID_PORTALS)', type: 'Магия Бездны', windup: '90 кадров', dmg: '1.5 / шар', desc: 'Порталы Бездны, выпускающие самонаводящиеся темные сгустки.' },
            { name: 'Крик Бездны (L_SCREAM)', type: 'Магия Бездны', windup: '25 кадров', dmg: '1.5 + Отталкивание', desc: 'Кольца темной энергии, сбивающие всех героев с ног и блокирующие движение.' },
            { name: 'Шарики Пустоты (Chaos Balls)', type: 'Ловушки арены', windup: 'Постоянно (Ф3-4)', dmg: '1.0 / контакт', desc: 'Темные сферы, вылетающие преимущественно из углов арены и зависающие в пространстве.' },
            { name: 'Линия ветра L-режима (WIND_LINE)', type: 'Ветряная атака', windup: '45 кадров (колебание листьев)', dmg: '1.5', desc: 'В L-режиме на арене в 2 раза меньше листьев (25 шт.), из-за чего предвестник атаки труднее заметить! Отменяется способностью S Воздуха!' },
            { name: 'Шелковый бег (SILK_RUN)', type: 'Перемещение', windup: '12 кадров', dmg: '—', desc: 'Сверхбыстрое скользящее перемещение босса в противоположный угол арены.' },
            { name: 'Большой рывок Бездны (GREAT_LUNGE)', type: 'Атака шпагой', windup: '36 кадров', dmg: '2.0 + Кровотечение', desc: 'Сверхзвуковой таран с чернильным шлейфом Бездны.' },
            { name: 'Погружение в Пустоту (VOID_SINK_STUN)', type: 'Уязвимость', windup: 'Окно оглушения', dmg: 'Окно атаки', desc: 'Босс падает на колени от перегрузки Бездны — идеальное окно для нанесения максимального урона героями.' }
        ]
    }
};

window.HERO_CODEX_DATA = HERO_CODEX_DATA;
window.BOSS_CODEX_DATA = BOSS_CODEX_DATA;

// ============================================================================
// --- SECURITY WATCHDOG, CREATOR DEVICE WHITELIST & ACCOUNT QUARANTINE (v74) ---
// ============================================================================

// Whitelist of trusted device IDs known for Creator ('РЫБа')
// Additional devices can be registered automatically when РЫБа logs in with password.
const CREATOR_TRUSTED_DEVICE_IDS = [
    'dev_8rz4u69_mu70u51u', // Windows PC (Chrome)
    'dev_acbkwod_mu73lef5', // Windows PC (Chrome)
    'dev_agbbsv6_mu6u7bj6', // Windows PC (Chrome)
    'dev_vn5kd7d_mu8ff6wz'  // Android Phone (Chrome)
];
window.CREATOR_TRUSTED_DEVICE_IDS = CREATOR_TRUSTED_DEVICE_IDS;

// Check if current session is running from a trusted Creator device
function isCreatorDevice() {
    let curUser = getCurrentUser();
    if (!curUser || curUser !== 'РЫБа') return false;

    let dev = (typeof getDeviceInfo === 'function') ? getDeviceInfo() : null;
    let devId = dev ? dev.deviceId : '';
    try {
        if (!devId) devId = localStorage.getItem('shelter_device_id') || '';
    } catch(e) {}

    // 1. Direct deviceId match in trusted whitelist
    if (devId && CREATOR_TRUSTED_DEVICE_IDS.includes(devId)) return true;

    // 2. Check if device is in РЫБа's recorded devices
    let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
    let fishAcc = accs['рыба'];
    if (fishAcc && fishAcc.devices && devId && fishAcc.devices[devId]) {
        return true;
    }

    // 3. Creator local flag set upon verified password login
    try {
        if (localStorage.getItem('shelter_is_creator_device') === 'true') {
            return true;
        }
    } catch(e) {}

    return false;
}
window.isCreatorDevice = isCreatorDevice;

// Quarantine unauthorized account: Preserves account data under /quarantine_accounts/
// while purging it from active /accounts/ and forcing immediate logout.
let quarantineInProgress = false;
async function quarantineUnauthorizedAccount(username, reason = "Несанкционированный доступ к панели администратора") {
    if (quarantineInProgress) return;
    if (!username || username === 'РЫБа' || username.toLowerCase() === 'гость') return;

    quarantineInProgress = true;
    let lowerKey = username.toLowerCase().trim();
    console.warn(`[SECURITY WATCHDOG] Quarantining account: ${username}. Reason: ${reason}`);

    let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
    let accountData = accs[lowerKey] || null;

    try {
        let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`);
        let cloudData = await res.json();
        if (cloudData) accountData = { ...(accountData || {}), ...cloudData };
    } catch(e) {}

    let dev = (typeof getDeviceInfo === 'function') ? getDeviceInfo() : { shortName: 'Устройство', deviceId: 'unknown' };

    if (accountData) {
        accountData.quarantineReason = reason;
        accountData.quarantinedAt = Date.now();
        accountData.quarantinedBy = "AdminWatchdog_v74";
        accountData.quarantineDevice = dev;

        // 1. Move to /quarantine_accounts/ in Firebase (so it's preserved for restoration)
        try {
            await fetch(`${FIREBASE_URL}/quarantine_accounts/${encodeURIComponent(lowerKey)}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accountData)
            });
            // 2. Delete from active /accounts/ in Firebase
            await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`, {
                method: 'DELETE'
            });
        } catch(e) {
            console.error("Quarantine remote sync error:", e);
        }
    }

    // 3. Delete from local cache
    delete accs[lowerKey];
    if (typeof saveAccounts === 'function') saveAccounts(accs);

    // 4. Force logout
    if (typeof setCurrentUser === 'function') setCurrentUser(null);
    try { localStorage.removeItem('shelter_current_user'); } catch(e){}

    // 5. Notify Creator via Telegram
    try {
        if (typeof sendTelegramNotification === 'function') {
            sendTelegramNotification(
                `🚨 <b>СИСТЕМА БЕЗОПАСНОСТИ v74: АККАУНТ ЗАБЛОКИРОВАН!</b>\n` +
                `👤 Аккаунт: <b>${username}</b>\n` +
                `⚠️ Причина: <i>${reason}</i>\n` +
                `📱 Устройство: <code>${dev.shortName} (${dev.deviceId})</code>\n` +
                `💾 Данные перемещены в <code>/quarantine_accounts/</code> и сохранены для Создателя.`
            );
        }
    } catch(e) {}

    alert(`⚠️ ВНИМАНИЕ: Обнаружена попытка несанкционированного доступа к панели администратора!\nАккаунт "${username}" заблокирован и отправлен в карантин на проверку Создателю (РЫБе).`);
    location.reload();
}
window.quarantineUnauthorizedAccount = quarantineUnauthorizedAccount;

// Constant Admin Watchdog: monitors admin buttons and screens in real-time
let adminWatchdogTimer = null;
function startAdminWatchdog() {
    if (adminWatchdogTimer) clearInterval(adminWatchdogTimer);

    function checkAdminSecurity() {
        let curUser = getCurrentUser();

        // 1. Inspect all admin buttons in DOM
        let adminBtns = document.querySelectorAll('#admin-panel-btn, .admin-panel-btn');
        let visibleAdminBtns = [];
        adminBtns.forEach(btn => {
            let style = window.getComputedStyle(btn);
            if (style && style.display !== 'none' && style.visibility !== 'hidden' && btn.offsetParent !== null) {
                visibleAdminBtns.push(btn);
            }
        });

        // Also check any button containing "ПАНЕЛЬ АДМИНА" outside admin-screen
        let allMenuBtns = document.querySelectorAll('.menu-btn');
        allMenuBtns.forEach(btn => {
            if (btn.id !== 'admin-panel-btn' && (btn.innerText || '').includes('ПАНЕЛЬ АДМИНА')) {
                let style = window.getComputedStyle(btn);
                if (style && style.display !== 'none' && btn.offsetParent !== null) {
                    visibleAdminBtns.push(btn);
                }
            }
        });

        if (visibleAdminBtns.length > 0) {
            if (curUser !== 'РЫБа') {
                // VIOLATION: Non-РЫБа account has an admin button shown!
                quarantineUnauthorizedAccount(curUser, "Обнаружена панель админа у неавторизованного аккаунта");
                return;
            } else {
                // Account is 'РЫБа' - check device whitelist
                if (!isCreatorDevice()) {
                    visibleAdminBtns.forEach(b => { b.style.display = 'none'; });
                } else if (visibleAdminBtns.length > 1) {
                    // More than 1 admin button appeared in DOM!
                    console.warn("[AdminWatchdog] Multiple admin buttons detected. Removing extra duplicates.");
                    for (let i = 1; i < visibleAdminBtns.length; i++) {
                        visibleAdminBtns[i].remove();
                    }
                }
            }
        }

        // 2. Inspect admin screen visibility
        let adminScreen = document.getElementById('admin-screen');
        if (adminScreen && window.getComputedStyle(adminScreen).display !== 'none') {
            if (curUser !== 'РЫБа' || !isCreatorDevice()) {
                quarantineUnauthorizedAccount(curUser, "Попытка несанкционированного открытия экрана администратора");
                return;
            }
        }

        // 3. Update incoming friend requests badge in root menu
        let badgeEl = document.getElementById('friends-badge-count');
        if (badgeEl) {
            if (curUser && curUser.toLowerCase() !== 'гость') {
                let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
                let userAcc = accs[curUser.toLowerCase()];
                let reqCount = (userAcc && userAcc.friendRequests) ? userAcc.friendRequests.length : 0;
                if (reqCount > 0) {
                    if (badgeEl.style.display !== 'inline-block') badgeEl.style.display = 'inline-block';
                    let countStr = String(reqCount);
                    if (badgeEl.textContent !== countStr) badgeEl.textContent = countStr;
                } else {
                    if (badgeEl.style.display !== 'none') badgeEl.style.display = 'none';
                }
            } else {
                if (badgeEl.style.display !== 'none') badgeEl.style.display = 'none';
            }
        }
    }

    adminWatchdogTimer = setInterval(checkAdminSecurity, 1500);

    if (window.MutationObserver && document.body) {
        let obs = new MutationObserver(() => {
            checkAdminSecurity();
        });
        obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    }
}
window.startAdminWatchdog = startAdminWatchdog;

// ============================================================================
// --- FRIENDS SYSTEM & PLAYTIME MANAGER (v74) ---
// ============================================================================

// Calculate total playtime for an account (combines explicit tracked minutes + historical battle estimate)
function getAccountPlaytime(acc) {
    if (!acc) return 0;
    let explicit = parseInt(acc.playtimeMinutes) || 0;

    // Estimate from historical battle stats if account played before v74
    let st = acc.stats || {};
    let totalBattles = (st.soloNormalWins || 0) + (st.soloNormalLosses || 0) +
                       (st.soloSecretWins || 0) + (st.soloSecretLosses || 0) +
                       (st.duoNormalWins || 0) + (st.duoNormalLosses || 0) +
                       (st.duoSecretWins || 0) + (st.duoSecretLosses || 0);

    // Each Silk Song match lasts ~2.5 - 3 minutes on average
    let estimatedMinutes = Math.round(totalBattles * 2.5);

    return Math.max(explicit, estimatedMinutes);
}
window.getAccountPlaytime = getAccountPlaytime;

// Format playtime minutes into human-readable string: e.g. "8 ч 28 мин" or "45 мин"
function formatPlaytime(minutesOrAcc) {
    let m = 0;
    if (typeof minutesOrAcc === 'object' && minutesOrAcc !== null) {
        m = getAccountPlaytime(minutesOrAcc);
    } else {
        m = Math.max(0, parseInt(minutesOrAcc) || 0);
    }
    if (m < 1) return "меньше минуты";
    let hours = Math.floor(m / 60);
    let mins = m % 60;
    if (hours === 0) return `${mins} мин`;
    if (mins === 0) return `${hours} ч`;
    return `${hours} ч ${mins} мин`;
}
window.formatPlaytime = formatPlaytime;

// Record playtime increment for user
function recordPlaytime(minutes, username = null) {
    if (!minutes || minutes <= 0) return;
    let target = username || getCurrentUser();
    if (!target || target.toLowerCase() === 'гость') return;
    let lower = target.toLowerCase();
    let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
    let acc = accs[lower];
    if (acc) {
        acc.playtimeMinutes = (acc.playtimeMinutes || 0) + minutes;
        if (typeof saveAccounts === 'function') saveAccounts(accs);
        try {
            fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lower)}/playtimeMinutes.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(acc.playtimeMinutes)
            }).catch(()=>{});
        } catch(e) {}
    }
}
window.recordPlaytime = recordPlaytime;

// Real-time presence cache for friends
let cachedPresenceMap = {};
let lastPresenceFetch = 0;
async function fetchPresenceMap() {
    if (Date.now() - lastPresenceFetch < 12000 && Object.keys(cachedPresenceMap).length > 0) {
        return cachedPresenceMap;
    }
    try {
        let res = await fetch(`${FIREBASE_URL}/presence.json`);
        let data = await res.json();
        if (data && typeof data === 'object') {
            cachedPresenceMap = data;
            lastPresenceFetch = Date.now();
        }
    } catch(e) {}
    return cachedPresenceMap;
}
window.fetchPresenceMap = fetchPresenceMap;

// Check if a player is currently online
function checkUserOnlineStatus(username, presenceMap = null) {
    if (!username) return false;
    let lower = username.toLowerCase().trim();
    let map = presenceMap || cachedPresenceMap;
    let now = Date.now();

    for (let devId in map) {
        let entry = map[devId];
        if (entry && entry.user && entry.user.toLowerCase().trim() === lower) {
            if (entry.state !== 'OFFLINE' && (now - entry.lastPing) < 70000) {
                return true;
            }
        }
    }

    let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
    let acc = accs[lower];
    if (acc && acc.devices) {
        for (let devId in acc.devices) {
            let d = acc.devices[devId];
            if (d && d.lastSeen && (now - d.lastSeen) < 90000) {
                return true;
            }
        }
    }
    return false;
}
window.checkUserOnlineStatus = checkUserOnlineStatus;

// Get mutual friends between two users
function getMutualFriends(userA, userB) {
    if (!userA || !userB) return [];
    let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
    let accA = accs[userA.toLowerCase()];
    let accB = accs[userB.toLowerCase()];
    if (!accA || !accB) return [];
    let listA = accA.friends || [];
    let listB = accB.friends || [];
    let lowerBSet = new Set(listB.map(f => (f || '').toLowerCase()));
    return listA.filter(f => lowerBSet.has((f || '').toLowerCase()));
}
window.getMutualFriends = getMutualFriends;

// Send friend request to target player
async function sendFriendRequest(targetName) {
    let curUser = getCurrentUser();
    if (!curUser || curUser.toLowerCase() === 'гость') {
        return { success: false, message: "Войдите в свой аккаунт, чтобы отправлять запросы в друзья!" };
    }
    if (!targetName || !targetName.trim()) {
        return { success: false, message: "Укажите имя игрока!" };
    }
    let cleanTarget = targetName.trim();
    let lowerTarget = cleanTarget.toLowerCase();
    let lowerCur = curUser.toLowerCase();

    if (lowerTarget === lowerCur) {
        return { success: false, message: "Нельзя добавить себя в друзья!" };
    }
    if (lowerTarget === 'гость' || lowerTarget === 'noname') {
        return { success: false, message: "Нельзя добавить гостя!" };
    }

    let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
    let curAcc = accs[lowerCur];
    if (!curAcc) {
        return { success: false, message: "Ошибка вашего профиля, выполните повторный вход!" };
    }
    curAcc.friends = curAcc.friends || [];
    curAcc.friendRequests = curAcc.friendRequests || [];

    if (curAcc.friends.some(f => (f || '').toLowerCase() === lowerTarget)) {
        return { success: false, message: `Игрок «${cleanTarget}» уже у вас в друзьях!` };
    }

    let targetAcc = accs[lowerTarget];
    if (!targetAcc) {
        try {
            let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerTarget)}.json`);
            targetAcc = await res.json();
            if (targetAcc) accs[lowerTarget] = targetAcc;
        } catch(e) {}
    }

    if (!targetAcc) {
        return { success: false, message: `Игрок «${cleanTarget}» не найден в базе!` };
    }

    targetAcc.friends = targetAcc.friends || [];
    targetAcc.friendRequests = targetAcc.friendRequests || [];

    if (targetAcc.friendRequests.some(r => (r || '').toLowerCase() === lowerCur)) {
        return { success: false, message: `Запрос игроку «${cleanTarget}» уже отправлен!` };
    }

    // Mutual request auto-accept
    if (curAcc.friendRequests.some(r => (r || '').toLowerCase() === lowerTarget)) {
        return await acceptFriendRequest(cleanTarget);
    }

    targetAcc.friendRequests.push(curAcc.name);
    if (typeof saveAccounts === 'function') saveAccounts(accs);

    try {
        await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerTarget)}/friendRequests.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(targetAcc.friendRequests)
        });
    } catch(e) {
        console.warn("Friend request sync error:", e);
    }

    // Notify Timur if request is sent to РЫБа
    if (lowerTarget === 'рыба') {
        try {
            if (typeof sendTelegramNotification === 'function') {
                sendTelegramNotification(
                    `👥 <b>НОВАЯ ЗАЯВКА В ДРУЗЬЯ!</b>\n` +
                    `👤 Игрок <b>${curAcc.name}</b> отправил заявку Создателю <b>РЫБе</b>!\n` +
                    `⏰ <i>${new Date().toLocaleTimeString()}</i>`
                );
            }
        } catch(e) {}
    }

    return { success: true, message: `Запрос в друзья игроку «${targetAcc.name}» успешно отправлен!` };
}
window.sendFriendRequest = sendFriendRequest;

// Accept friend request
async function acceptFriendRequest(targetName) {
    let curUser = getCurrentUser();
    if (!curUser || curUser.toLowerCase() === 'гость') return { success: false, message: "Не авторизован" };
    let lowerCur = curUser.toLowerCase();
    let cleanTarget = (targetName || '').trim();
    let lowerTarget = cleanTarget.toLowerCase();

    let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
    let curAcc = accs[lowerCur];
    if (!curAcc) return { success: false, message: "Профиль не найден" };

    curAcc.friends = curAcc.friends || [];
    curAcc.friendRequests = curAcc.friendRequests || [];

    // Remove from incoming requests
    curAcc.friendRequests = curAcc.friendRequests.filter(r => (r || '').toLowerCase() !== lowerTarget);

    // Add to friends
    if (!curAcc.friends.some(f => (f || '').toLowerCase() === lowerTarget)) {
        curAcc.friends.push(cleanTarget);
    }

    // Target account update
    let targetAcc = accs[lowerTarget];
    if (!targetAcc) {
        try {
            let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerTarget)}.json`);
            targetAcc = await res.json();
            if (targetAcc) accs[lowerTarget] = targetAcc;
        } catch(e) {}
    }

    if (targetAcc) {
        targetAcc.friends = targetAcc.friends || [];
        targetAcc.friendRequests = targetAcc.friendRequests || [];
        targetAcc.friendRequests = targetAcc.friendRequests.filter(r => (r || '').toLowerCase() !== lowerCur);
        if (!targetAcc.friends.some(f => (f || '').toLowerCase() === lowerCur)) {
            targetAcc.friends.push(curAcc.name);
        }
    }

    if (typeof saveAccounts === 'function') saveAccounts(accs);

    // Remote sync to Firebase
    try {
        await Promise.all([
            fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerCur)}/friends.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(curAcc.friends)
            }),
            fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerCur)}/friendRequests.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(curAcc.friendRequests)
            }),
            targetAcc ? fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerTarget)}/friends.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(targetAcc.friends)
            }) : Promise.resolve(),
            targetAcc ? fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerTarget)}/friendRequests.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(targetAcc.friendRequests)
            }) : Promise.resolve()
        ]);
    } catch(e) {
        console.warn("Friend accept sync error:", e);
    }

    return { success: true, message: `Вы и ${cleanTarget} теперь друзья! 🎉` };
}
window.acceptFriendRequest = acceptFriendRequest;

// Reject friend request
async function rejectFriendRequest(targetName) {
    let curUser = getCurrentUser();
    if (!curUser) return { success: false };
    let lowerCur = curUser.toLowerCase();
    let lowerTarget = (targetName || '').trim().toLowerCase();

    let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
    let curAcc = accs[lowerCur];
    if (!curAcc) return { success: false };

    curAcc.friendRequests = (curAcc.friendRequests || []).filter(r => (r || '').toLowerCase() !== lowerTarget);
    if (typeof saveAccounts === 'function') saveAccounts(accs);

    try {
        await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerCur)}/friendRequests.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(curAcc.friendRequests)
        });
    } catch(e) {}

    return { success: true };
}
window.rejectFriendRequest = rejectFriendRequest;

// Remove friend
async function removeFriend(targetName) {
    let curUser = getCurrentUser();
    if (!curUser) return { success: false };
    let lowerCur = curUser.toLowerCase();
    let cleanTarget = (targetName || '').trim();
    let lowerTarget = cleanTarget.toLowerCase();

    let accs = (typeof loadAccounts === 'function') ? loadAccounts() : {};
    let curAcc = accs[lowerCur];
    if (!curAcc) return { success: false };

    curAcc.friends = (curAcc.friends || []).filter(f => (f || '').toLowerCase() !== lowerTarget);

    let targetAcc = accs[lowerTarget];
    if (!targetAcc) {
        try {
            let res = await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerTarget)}.json`);
            targetAcc = await res.json();
            if (targetAcc) accs[lowerTarget] = targetAcc;
        } catch(e) {}
    }

    if (targetAcc) {
        targetAcc.friends = (targetAcc.friends || []).filter(f => (f || '').toLowerCase() !== lowerCur);
    }

    if (typeof saveAccounts === 'function') saveAccounts(accs);

    try {
        await Promise.all([
            fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerCur)}/friends.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(curAcc.friends)
            }),
            fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerTarget)}/friends.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(targetAcc ? targetAcc.friends : [])
            })
        ]);
    } catch(e) {}

    return { success: true, message: `Игрок «${cleanTarget}» удален из друзей.` };
}
window.removeFriend = removeFriend;

// Auto-start Watchdog and Heartbeats on initialization
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            startPresenceHeartbeat();
            startAdminWatchdog();
        });
    } else {
        startPresenceHeartbeat();
        startAdminWatchdog();
    }

    // Active Playtime ticker (every 60 seconds)
    setInterval(() => {
        let cur = getCurrentUser();
        if (cur && cur.toLowerCase() !== 'гость') {
            recordPlaytime(1, cur);
        }
    }, 60000);
}
