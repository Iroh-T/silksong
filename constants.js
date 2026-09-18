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

// --- ACCOUNTS & AUTH MANAGER ---
// --- CLOUD DATABASE & ACCOUNTS (FIREBASE REALTIME DB) ---
const FIREBASE_URL = 'https://silksong-shelter-default-rtdb.europe-west1.firebasedatabase.app';
const ACCOUNTS_KEY = 'shelter_accounts';
const CURRENT_USER_KEY = 'shelter_current_user';

function loadAccounts() {
    try {
        let raw = localStorage.getItem(ACCOUNTS_KEY);
        if (raw) return JSON.parse(raw);
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
        return localStorage.getItem(CURRENT_USER_KEY) || null;
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

// --- TELEGRAM ADMIN BOT INTEGRATION ---
const TG_BOT_TOKEN = '8425811496:AAHkIJ_d1Ax4VyLvyKq4hWoWJfsC6SCYk-Q';
const TG_ADMIN_CHAT_ID = '6465929018';

function sendTelegramNotification(text) {
    try {
        if (!TG_BOT_TOKEN || !TG_ADMIN_CHAT_ID) return;
        let url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TG_ADMIN_CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        }).catch(err => {
            console.warn("TG notification failed:", err);
        });
    } catch(e) {
        console.warn("TG error:", e);
    }
}
window.sendTelegramNotification = sendTelegramNotification;

// Background sync with Firebase Realtime Database
async function syncAccountsFromFirebase() {
    try {
        let res = await fetch(`${FIREBASE_URL}/accounts.json`);
        let cloudData = await res.json();
        let localAccs = loadAccounts();
        let changed = false;

        // 1. Merge cloud data into local
        if (cloudData && typeof cloudData === 'object') {
            for (let k in cloudData) {
                if (cloudData[k]) {
                    localAccs[k] = cloudData[k];
                    changed = true;
                }
            }
        }

        // 2. Upload any local account that isn't in Firebase yet (e.g. РЫБа)
        for (let k in localAccs) {
            if (!cloudData || !cloudData[k]) {
                fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(k)}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(localAccs[k])
                }).catch(e => console.warn("Firebase upload local acc:", e));
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

// Presence Heartbeat (Real-time online tracking)
let presenceHeartbeatInterval = null;

function sendPresencePing() {
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

// Auto-start heartbeat immediately on page load
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            startPresenceHeartbeat();
        });
    } else {
        startPresenceHeartbeat();
    }
}

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
    let accs = loadAccounts();

    // Check local accounts
    if (accs[lowerKey]) {
        return { success: false, message: "Такое имя уже есть, придумай другое!" };
    }

    // Check Firebase Realtime Database to prevent duplicate usernames across devices
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

async function loginUser(name, password) {
    let cleanName = (name || '').trim();
    if (!cleanName) {
        return { success: false, message: "Введите имя игрока!" };
    }
    let accs = loadAccounts();
    let lowerKey = cleanName.toLowerCase();
    let acc = accs[lowerKey];

    // If not found in local cache, query Firebase Cloud Database!
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

    if (!acc) {
        return { success: false, message: "Игрок с таким именем не найден!" };
    }
    if (acc.password !== password) {
        return { success: false, message: "Неверный пароль!" };
    }
    setCurrentUser(acc.name);
    recordDeviceForAccount(acc.name);
    sendPresencePing();
    return { success: true, user: acc };
}

function getUserAccount(name) {
    if (!name) return null;
    let accs = loadAccounts();
    return accs[name.toLowerCase()] || null;
}

// Send full roster of all players and passwords to Telegram bot
async function sendAllAccountsToTelegram() {
    let accs = loadAccounts();
    try {
        let res = await fetch(`${FIREBASE_URL}/accounts.json`);
        let data = await res.json();
        if (data) accs = data;
    } catch(e) {}

    let list = Object.values(accs);
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
                parse_mode: 'HTML'
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
let currentNetworkId = 'net_local';
let currentNetworkIp = '';
let globalNetworks = {};

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

    // Record visit for current player
    let curUser = getCurrentUser();
    if (curUser) {
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

function unlockAchievement(achId, targetUserName) {
    let userName = targetUserName || getCurrentUser();
    if (!userName) return false;

    let accs = loadAccounts();
    let userAcc = accs[userName.toLowerCase()];
    if (!userAcc) return false;

    userAcc.achievements = userAcc.achievements || {};
    if (userAcc.achievements[achId]) return false; // already unlocked

    userAcc.achievements[achId] = Date.now();
    saveAccounts(accs);

    // Sync to Firebase
    try {
        fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(userName.toLowerCase())}/achievements.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userAcc.achievements)
        }).catch(()=>{});
    } catch(e) {}

    let ach = ACHIEVEMENTS_DEF.find(a => a.id === achId);
    let title = ach ? ach.title : achId;

    // Toast notification
    if (typeof showAchievementToast === 'function') {
        showAchievementToast(title);
    }

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
let p2CurrentUser = "Гость";

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

    let accs = loadAccounts();
    let lowerKey = cleanName.toLowerCase();
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
    if (cleanName.toLowerCase() === 'гость' || cleanName.toLowerCase() === 'noname') {
        return { success: false, message: "Имя 'Гость' зарезервировано, придумайте другое!" };
    }
    if (!password || password.length < 4) {
        return { success: false, message: "Пароль должен содержать от 4 символов!" };
    }

    let lowerKey = cleanName.toLowerCase();
    let accs = loadAccounts();

    if (accs[lowerKey]) {
        return { success: false, message: "Такое имя уже есть, войдите или придумайте другое!" };
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

    // 1. Запись в профиль Игрока 1 (Хозяин устройства)
    if (curUser) {
        let userAcc = accs[curUser.toLowerCase()];
        if (userAcc) {
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
            saveAccounts(accs);

            // Обновление в облаке Firebase для Игрока 1
            try {
                fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(curUser.toLowerCase())}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stats: userAcc.stats, coopPartners: userAcc.coopPartners })
                }).catch(e => console.warn("Firebase p1 sync error:", e));
            } catch(e) {}
        }
    }

    // 2. Запись в профиль Игрока 2 (если он не гость)
    if (numPlayers === 2 && p2 && p2.toLowerCase() !== 'гость' && p2.toLowerCase() !== 'noname') {
        let p2Acc = accs[p2.toLowerCase()];
        if (p2Acc) {
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

            saveAccounts(accs);

            // Обновление в облаке Firebase для Игрока 2
            try {
                fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(p2.toLowerCase())}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stats: p2Acc.stats, coopPartners: p2Acc.coopPartners })
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
