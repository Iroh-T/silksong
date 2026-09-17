// --- CONTROLS & INPUT MODULE ---

function isKeyPressed(codes) { 
    for (let c of codes) { 
        if (keys[c]) return true; 
    } 
    return false; 
}

function tryEscapeTie() { 
    let escaped = false; 
    for (let p of players) { 
        if (p.tied && boss.state !== "SCARF_PULL" && !boss.state.startsWith("CINEMATIC")) { 
            p.tieClicks++; 
            triggerVibration('untie');
            if (p.tieClicks >= (secretMode ? 7 : 5)) { 
                p.tied = false; 
                p.tieClicks = 0; 
            } 
            escaped = true; 
        } 
    } 
    return escaped; 
}

// Keyboard events
window.addEventListener("keydown", e => { 
    if (e.code === "Space" && e.target === document.body) e.preventDefault();
    
    // Key rebinding listener takes absolute precedence if active
    if (window.rebindingActive && window.currentRebindCallback) {
        e.preventDefault();
        window.currentRebindCallback(e.code);
        return;
    }

    keys[e.code] = true; 
    initAudio(); 
    tryEscapeTie(); 
    
    // Secret mode (L): ONLY active on Mode Select or Input Select!
    if (e.code === 'KeyL' && gameState === "MENU") {
        let modeScreen = document.getElementById("mode-select");
        let inputScreen = document.getElementById("input-select");
        let canActivateL = (modeScreen && modeScreen.style.display === "block") || 
                           (inputScreen && inputScreen.style.display === "block");
        if (canActivateL && !secretMode) {
            secretMode = true; 
            playSound('heal'); 
            document.body.style.backgroundColor = window.fireHeroUnlocked ? "#2a0a0a" : "#000";
            let ml = document.getElementById("m-light");
            if (ml && document.getElementById("mobile-ui").style.display === "flex") {
                ml.style.display = "flex";
            }
        }
    }
    
    // Test Mode Unlock in Menu (Key 7)
    if ((e.key === '7' || e.code === 'Digit7') && gameState === "MENU") {
        testModeUnlocked = !testModeUnlocked;
        window.testModeUnlocked = testModeUnlocked;
        playSound(testModeUnlocked ? 'parry' : 'hitPlayer');
        let banner = document.getElementById("test-mode-banner");
        if (banner) {
            banner.style.display = testModeUnlocked ? "block" : "none";
        }
    }

    // In-game Test Mode hotkeys (only works if unlocked via '7' before game)
    if (gameState === "PLAYING" && (testModeUnlocked || window.testModeUnlocked)) {
        if (e.key === '9' || e.code === 'Digit9') {
            godModeActive = !godModeActive;
            window.godModeActive = godModeActive;
            playSound(godModeActive ? 'parry' : 'hitPlayer');
        }
        if (e.key === '0' || e.code === 'Digit0') {
            megaDamageActive = !megaDamageActive;
            window.megaDamageActive = megaDamageActive;
            playSound(megaDamageActive ? 'slash' : 'hitBoss');
        }
    }
    
    // Unlock Fire Hero (Key 4 in Menu)
    if ((e.key === '4' || e.code === 'Digit4') && gameState === "MENU") {
        if (!window.fireHeroUnlocked) {
            window.fireHeroUnlocked = true; 
            try { localStorage.setItem('shelter_fire_unlocked', 'true'); } catch(e){}
            playSound('slash');
            document.body.style.backgroundColor = "#2a0a0a";
            let p1Ui = document.getElementById("p1-select-ui");
            if (p1Ui && !document.getElementById("btn-hero-fire")) {
                p1Ui.innerHTML += `<div id="btn-hero-fire" class="menu-btn" onclick="selectHero1('FIRE')" style="color: #ff5500; border-color: #ff5500;">5. Огонь</div>`;
            }
            let p2Text = document.getElementById("p2-options-text");
            if (p2Text) {
                p2Text.innerHTML = "<b>1</b>-Вода | <b>2</b>-Воздух | <b>3</b>-Земля | <b>4</b>-4-й Герой | <b style='color:#ff5500;'>5</b>-Огонь";
            }
            return; // Don't pick STAMINA on the keypress that reveals Fire
        }
    }

    // 1-Player keyboard hero selection in menu
    if (gameState === "MENU" && document.getElementById("hero-select").style.display === "block" && numPlayers === 1) {
        if (e.key === "1") selectHero1('WATER');
        if (e.key === "2") selectHero1('AIR');
        if (e.key === "3") selectHero1('EARTH');
        if (e.key === "4") selectHero1('STAMINA');
        if (e.key === "5" && window.fireHeroUnlocked) selectHero1('FIRE');
    }

    // Player 2 keyboard hero selection in menu
    if (gameState === "MENU" && document.getElementById("hero-select").style.display === "block" && numPlayers === 2) {
        let p2Status = document.getElementById('p2-status');
        if (e.key === "1") { p2HeroSelection = 'WATER'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Вода"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "2") { p2HeroSelection = 'AIR'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Воздух"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "3") { p2HeroSelection = 'EARTH'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Земля"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "4") { p2HeroSelection = 'STAMINA'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: 4-й Герой"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "5" && window.fireHeroUnlocked) { p2HeroSelection = 'FIRE'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Огонь"; p2Status.style.color = "#ff5500"; } checkDuoStart(); }
    }

    // Restart key (from Game Over back to root menu)
    if (gameState === "GAMEOVER" && (e.code === "KeyR" || e.key === "r" || e.key === "к" || e.key === "К")) {
        gameState = "MENU";
        document.getElementById("overlay").style.display = "block";
        openScreen('root-menu', false);
        let banner = document.getElementById("test-mode-banner");
        if (banner) {
            banner.style.display = (testModeUnlocked || window.testModeUnlocked) ? "block" : "none";
        }
    }
});

window.addEventListener("keyup", e => keys[e.code] = false);
window.addEventListener("mousedown", e => { 
    if (e.button === 0) keys['MouseLeft'] = true; 
    if (e.button === 2) keys['MouseRight'] = true; 
    initAudio(); 
    tryEscapeTie(); 
});
window.addEventListener("mouseup", e => { 
    if (e.button === 0) keys['MouseLeft'] = false; 
    if (e.button === 2) keys['MouseRight'] = false; 
});
window.addEventListener("contextmenu", e => e.preventDefault());

// Touch Joystick Setup
const joyBase = document.getElementById('joy-base');
const joyStick = document.getElementById('joy-stick');
let joyActive = false; 
let joyCenter = { x: 0, y: 0 };

if (joyBase && joyStick) {
    joyBase.addEventListener('touchstart', e => { 
        e.preventDefault(); 
        joyActive = true; 
        let r = joyBase.getBoundingClientRect(); 
        joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; 
        updateJoy(e.touches[0]); 
    });
    joyBase.addEventListener('touchmove', e => { 
        e.preventDefault(); 
        if (joyActive) updateJoy(e.touches[0]); 
    });
    joyBase.addEventListener('touchend', e => { 
        e.preventDefault(); 
        joyActive = false; 
        joyStick.style.transform = `translate(0px, 0px)`; 
        touchInputs.left = false; 
        touchInputs.right = false; 
        touchInputs.up = false; 
        touchInputs.down = false; 
    });
}

function updateJoy(touch) {
    if (!joyStick) return;
    let dx = touch.clientX - joyCenter.x; 
    let dy = touch.clientY - joyCenter.y;
    let dist = Math.hypot(dx, dy); 
    let maxDist = 35;
    if (dist > maxDist) { 
        dx = (dx / dist) * maxDist; 
        dy = (dy / dist) * maxDist; 
    }
    joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
    touchInputs.left = dx < -15; 
    touchInputs.right = dx > 15;
    touchInputs.up = dy < -15; 
    touchInputs.down = dy > 15;
}

const tBtns = ['m-jmp', 'm-atk', 'm-dash', 'm-spec', 'm-heal', 'm-light', 'm-stance'];
const tMap = { 'm-jmp': 'jump', 'm-atk': 'atk', 'm-dash': 'dash', 'm-spec': 'spec', 'm-heal': 'heal', 'm-light': 'light', 'm-stance': 'stance' };
tBtns.forEach(id => {
    let el = document.getElementById(id);
    if (el) {
        el.addEventListener('touchstart', e => { 
            e.preventDefault(); 
            touchInputs[tMap[id]] = true; 
            el.style.transform = 'scale(0.9)'; 
            el.style.background = 'rgba(0,255,255,0.6)'; 
            tryEscapeTie(); 
        });
        el.addEventListener('touchend', e => { 
            e.preventDefault(); 
            touchInputs[tMap[id]] = false; 
            el.style.transform = 'scale(1)'; 
            el.style.background = 'rgba(0,255,255,0.15)'; 
        });
    }
});

// Gamepad API Polling
function getGamepadInput(targetIndex) {
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = gamepads[targetIndex] || Array.from(gamepads).find(g => g !== null);
    if (!gp) return null;
    return {
        left: gp.axes[0] < -0.3 || gp.buttons[14]?.pressed, 
        right: gp.axes[0] > 0.3 || gp.buttons[15]?.pressed,
        up: gp.axes[1] < -0.3 || gp.buttons[12]?.pressed, 
        down: gp.axes[1] > 0.3 || gp.buttons[13]?.pressed,
        jump: gp.buttons[0]?.pressed,
        heal: gp.buttons[1]?.pressed,
        attack: gp.buttons[2]?.pressed || gp.buttons[3]?.pressed, 
        special: gp.buttons[5]?.pressed || gp.buttons[4]?.pressed, 
        dash: gp.buttons[7]?.pressed || gp.buttons[7]?.value > 0.1,
        light: gp.buttons[11]?.pressed || gp.buttons[10]?.pressed,
        stance: gp.buttons[8]?.pressed || gp.buttons[9]?.pressed
    };
}

// --- MENU NAVIGATION & SCREENS STACK ---
let menuHistory = [];

function openScreen(screenId, pushHistory = true) {
    const allScreens = [
        'root-menu',
        'mode-select',
        'input-select',
        'hero-select',
        'badge-select',
        'achievements-menu',
        'settings-menu',
        'keybind-editor-menu'
    ];

    let currentActive = allScreens.find(id => {
        let el = document.getElementById(id);
        return el && el.style.display === 'block';
    });

    if (pushHistory && currentActive && currentActive !== screenId) {
        menuHistory.push(currentActive);
    }

    allScreens.forEach(id => {
        let el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    let targetEl = document.getElementById(screenId);
    if (targetEl) targetEl.style.display = 'block';

    // Universal Back Button: visible on all sub-screens EXCEPT root-menu!
    let backBtn = document.getElementById('menu-back-btn');
    if (backBtn) {
        backBtn.style.display = (screenId === 'root-menu') ? 'none' : 'block';
    }

    // Cancel mode L if returning to root menu
    if (screenId === 'root-menu' && secretMode) {
        cancelSecretMode();
    }

    // Dynamic renders when opening specific screens
    if (screenId === 'achievements-menu') {
        renderAchievements();
    }
}
window.openScreen = openScreen;

function menuGoBack() {
    // If we are currently rebinding a key, cancel rebinding first
    if (window.rebindingActive) {
        cancelRebinding();
        return;
    }
    if (menuHistory.length > 0) {
        let prev = menuHistory.pop();
        openScreen(prev, false);
    } else {
        openScreen('root-menu', false);
    }
}
window.menuGoBack = menuGoBack;

function cancelSecretMode() {
    secretMode = false;
    document.body.style.backgroundColor = window.fireHeroUnlocked ? "#2a0a0a" : "#0a0a0a";
    let ml = document.getElementById("m-light");
    if (ml) ml.style.display = "none";
    let lMusic = document.getElementById("lModeMusic");
    if (lMusic) { lMusic.pause(); lMusic.currentTime = 0; }
    let mMusic = document.getElementById("menuMusic");
    if (mMusic && mMusic.paused && typeof playMenuMusic === 'function') { playMenuMusic(); }
}
window.cancelSecretMode = cancelSecretMode;

function toggleSecretMobile() {
    secretMode = true; 
    playSound('heal'); 
    document.body.style.backgroundColor = window.fireHeroUnlocked ? "#2a0a0a" : "#000";
    let ml = document.getElementById("m-light");
    if (ml) ml.style.display = "flex";
}
window.toggleSecretMobile = toggleSecretMobile;

function selectMode(mode) {
    numPlayers = mode;
    openScreen('input-select');
    document.getElementById("input-1p").style.display = (mode === 1) ? "block" : "none"; 
    document.getElementById("input-2p").style.display = (mode === 2) ? "block" : "none";
    if (mode === 2) {
        updateDuoSubOptions();
    }
}
window.selectMode = selectMode;

// --- 2-PLAYER INPUT DEVICE SELECTION ---
function setP1Device(dev) {
    duoP1Device = dev;
    let btnKb = document.getElementById('p1-type-kb');
    let btnGp = document.getElementById('p1-type-gp');
    if (btnKb && btnGp) {
        if (dev === 'KEYBOARD') {
            btnKb.style.borderColor = '#00aaff'; btnKb.style.color = '#00ffff';
            btnGp.style.borderColor = '#888'; btnGp.style.color = '#888';
        } else {
            btnGp.style.borderColor = '#00aaff'; btnGp.style.color = '#00ffff';
            btnKb.style.borderColor = '#888'; btnKb.style.color = '#888';
        }
    }
    updateDuoSubOptions();
}
window.setP1Device = setP1Device;

function setP2Device(dev) {
    duoP2Device = dev;
    let btnKb = document.getElementById('p2-type-kb');
    let btnGp = document.getElementById('p2-type-gp');
    if (btnKb && btnGp) {
        if (dev === 'KEYBOARD') {
            btnKb.style.borderColor = '#ffcc00'; btnKb.style.color = '#ffdd44';
            btnGp.style.borderColor = '#888'; btnGp.style.color = '#888';
        } else {
            btnGp.style.borderColor = '#ffcc00'; btnGp.style.color = '#ffdd44';
            btnKb.style.borderColor = '#888'; btnKb.style.color = '#888';
        }
    }
    updateDuoSubOptions();
}
window.setP2Device = setP2Device;

function updateDuoSubOptions() {
    let container = document.getElementById('duo-sub-options');
    if (!container) return;

    if (duoP1Device === 'KEYBOARD' && duoP2Device === 'KEYBOARD') {
        container.innerHTML = `
            <div style="color: #a842f5; font-weight: bold; margin-bottom: 4px;">🎮 Оба на клавиатуре:</div>
            <div style="color: #ccc; font-size: 12px;">Игрок 1: 1-я раскладка (справа) | Игрок 2: 2-я раскладка (слева)</div>
        `;
    } else if (duoP1Device === 'KEYBOARD' && duoP2Device === 'GAMEPAD') {
        let is1 = (duoSoloKeyboardScheme === 'SCHEME_1');
        container.innerHTML = `
            <div style="color: #00ddff; font-weight: bold; margin-bottom: 6px;">Раскладка для Игрока 1 (Клава):</div>
            <div style="display: flex; gap: 10px;">
                <button class="menu-btn" style="padding: 5px 12px; font-size: 12px; margin: 0; ${is1 ? 'border-color: #00ffff; color: #00ffff;' : 'border-color: #666; color: #888;'}" onclick="setDuoKeyboardScheme('SCHEME_1')">1. Первая раскладка</button>
                <button class="menu-btn" style="padding: 5px 12px; font-size: 12px; margin: 0; ${!is1 ? 'border-color: #00ffff; color: #00ffff;' : 'border-color: #666; color: #888;'}" onclick="setDuoKeyboardScheme('SCHEME_2')">2. Вторая раскладка</button>
            </div>
        `;
    } else if (duoP1Device === 'GAMEPAD' && duoP2Device === 'KEYBOARD') {
        let is1 = (duoSoloKeyboardScheme === 'SCHEME_1');
        container.innerHTML = `
            <div style="color: #ffdd44; font-weight: bold; margin-bottom: 6px;">Раскладка для Игрока 2 (Клава):</div>
            <div style="display: flex; gap: 10px;">
                <button class="menu-btn" style="padding: 5px 12px; font-size: 12px; margin: 0; ${is1 ? 'border-color: #ffcc00; color: #ffdd44;' : 'border-color: #666; color: #888;'}" onclick="setDuoKeyboardScheme('SCHEME_1')">1. Первая раскладка</button>
                <button class="menu-btn" style="padding: 5px 12px; font-size: 12px; margin: 0; ${!is1 ? 'border-color: #ffcc00; color: #ffdd44;' : 'border-color: #666; color: #888;'}" onclick="setDuoKeyboardScheme('SCHEME_2')">2. Вторая раскладка</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="color: yellow; font-weight: bold; margin-bottom: 4px;">🎮 Оба на джойстиках:</div>
            <div style="color: #ccc; font-size: 12px;">Игрок 1: Геймпад 1 | Игрок 2: Геймпад 2</div>
        `;
    }
}
window.updateDuoSubOptions = updateDuoSubOptions;

function setDuoKeyboardScheme(scheme) {
    duoSoloKeyboardScheme = scheme;
    updateDuoSubOptions();
}
window.setDuoKeyboardScheme = setDuoKeyboardScheme;

function confirmDuoInput() {
    if (duoP1Device === 'KEYBOARD' && duoP2Device === 'KEYBOARD') {
        selectInput('DUO_KEYBOARD_P1', 'DUO_KEYBOARD_P2');
    } else if (duoP1Device === 'KEYBOARD' && duoP2Device === 'GAMEPAD') {
        selectInput(duoSoloKeyboardScheme === 'SCHEME_1' ? 'KEYBOARD_1' : 'KEYBOARD_2', 'GAMEPAD');
    } else if (duoP1Device === 'GAMEPAD' && duoP2Device === 'KEYBOARD') {
        selectInput('GAMEPAD', duoSoloKeyboardScheme === 'SCHEME_1' ? 'KEYBOARD_1' : 'KEYBOARD_2');
    } else {
        selectInput('GAMEPAD', 'GAMEPAD');
    }
}
window.confirmDuoInput = confirmDuoInput;

function selectInput(in1, in2) {
    p1InputType = in1; 
    if (numPlayers === 2) p2InputType = in2;
    openScreen('hero-select');
    
    let p1Status = document.getElementById('p1-status');
    let p2Status = document.getElementById('p2-status');
    if (p1Status) p1Status.innerText = ""; 
    if (p2Status) p2Status.innerText = "Ожидание Игрока 2...";
    
    let p2Ui = document.getElementById("p2-select-ui");
    if (p2Ui) p2Ui.style.display = (numPlayers === 2) ? "block" : "none";

    if (in1 === 'TOUCH' || in2 === 'TOUCH') {
        let mobUi = document.getElementById("mobile-ui");
        if (mobUi) mobUi.style.display = "flex";
        if (!secretMode) {
            let lBtn = document.getElementById("mobile-l-btn-input");
            if (lBtn) lBtn.style.display = "block";
        }
    }
}
window.selectInput = selectInput;

// --- ACHIEVEMENTS RENDERER ---
function renderAchievements() {
    let container = document.getElementById('achievements-content');
    if (!container) return;
    let s = loadGameStats();
    let totalWins = s.soloNormalWins + s.soloSecretWins + s.duoNormalWins + s.duoSecretWins;
    let totalLosses = s.soloNormalLosses + s.soloSecretLosses + s.duoNormalLosses + s.duoSecretLosses;
    let totalBattles = totalWins + totalLosses;
    let winRate = totalBattles > 0 ? Math.round((totalWins / totalBattles) * 100) : 0;

    container.innerHTML = `
        <div style="margin-bottom: 15px; font-size: 14px; color: #aaddff;">
            Всего боёв: <b>${totalBattles}</b> | Побед: <b style="color: #44ff44;">${totalWins}</b> | Винрейт: <b style="color: #ffcc00;">${winRate}%</b>
        </div>
        <div class="achieve-grid">
            <div class="achieve-card">
                <div class="achieve-card-title">1 Игрок (Обычный режим)</div>
                <div class="achieve-stat-line"><span>Побед над Боссом:</span><span class="achieve-stat-val win">${s.soloNormalWins}</span></div>
                <div class="achieve-stat-line"><span>Поражений:</span><span class="achieve-stat-val loss">${s.soloNormalLosses}</span></div>
            </div>
            <div class="achieve-card secret">
                <div class="achieve-card-title">1 Игрок (Режим [L])</div>
                <div class="achieve-stat-line"><span>Побед над Боссом:</span><span class="achieve-stat-val win">${s.soloSecretWins}</span></div>
                <div class="achieve-stat-line"><span>Поражений:</span><span class="achieve-stat-val loss">${s.soloSecretLosses}</span></div>
            </div>
            <div class="achieve-card">
                <div class="achieve-card-title">2 Игрока (Обычный кооп)</div>
                <div class="achieve-stat-line"><span>Командных побед:</span><span class="achieve-stat-val win">${s.duoNormalWins}</span></div>
                <div class="achieve-stat-line"><span>Поражений:</span><span class="achieve-stat-val loss">${s.duoNormalLosses}</span></div>
            </div>
            <div class="achieve-card secret">
                <div class="achieve-card-title">2 Игрока (Кооп в [L])</div>
                <div class="achieve-stat-line"><span>Командных побед:</span><span class="achieve-stat-val win">${s.duoSecretWins}</span></div>
                <div class="achieve-stat-line"><span>Поражений:</span><span class="achieve-stat-val loss">${s.duoSecretLosses}</span></div>
            </div>
        </div>
    `;
}
window.renderAchievements = renderAchievements;

// --- KEYBINDING EDITOR MANAGER ---
let currentEditingScheme = null;
let rebindingTarget = null;
window.rebindingActive = false;

function openKeybindEditor(schemeKey) {
    currentEditingScheme = schemeKey;
    openScreen('keybind-editor-menu');
    let title = document.getElementById('keybind-title');
    let titles = {
        'SCHEME_1': 'НАСТРОЙКА: 1-Я РАСКЛАДКА',
        'SCHEME_2': 'НАСТРОЙКА: 2-Я РАСКЛАДКА',
        'DUO_KEYBOARD': 'НАСТРОЙКА: ОБА НА КЛАВИАТУРЕ',
        'GAMEPAD': 'НАСТРОЙКА: ДЖОЙСТИК (ГЕЙМПАД)'
    };
    if (title) title.innerText = titles[schemeKey] || 'НАСТРОЙКА КЛАВИШ';
    hideConflictBanner();
    renderKeybindList();
}
window.openKeybindEditor = openKeybindEditor;

function renderKeybindList() {
    let container = document.getElementById('keybind-list');
    if (!container || !currentEditingScheme) return;

    if (currentEditingScheme === 'GAMEPAD') {
        let html = '';
        let gpMap = userControls.GAMEPAD;
        for (let act of ACTION_DEFS) {
            let label = gpMap[act.id] || 'Не назначено';
            html += `
                <div class="keybind-row">
                    <span class="keybind-name">${act.name}</span>
                    <span class="keybind-line"></span>
                    <div class="keybind-btn" style="border-color: yellow; color: yellow; cursor: default;">${label}</div>
                </div>
            `;
        }
        container.innerHTML = html;
        return;
    }

    if (currentEditingScheme === 'DUO_KEYBOARD') {
        let html = '<div style="color: #00ddff; font-weight: bold; margin: 10px 0 5px 0;">Игрок 1 (Справа / Стрелки):</div>';
        for (let act of ACTION_DEFS) {
            let code = userControls.DUO_KEYBOARD.p1[act.id];
            let isWaiting = (rebindingTarget && rebindingTarget.scheme === 'DUO_KEYBOARD' && rebindingTarget.pKey === 'p1' && rebindingTarget.action === act.id);
            let btnLabel = isWaiting ? 'Нажмите...' : formatKeyName(code);
            html += `
                <div class="keybind-row">
                    <span class="keybind-name">${act.name}</span>
                    <span class="keybind-line"></span>
                    <button class="keybind-btn ${isWaiting ? 'waiting' : ''}" onclick="startRebinding('DUO_KEYBOARD', '${act.id}', 'p1')">${btnLabel}</button>
                </div>
            `;
        }
        html += '<div style="color: #ffdd44; font-weight: bold; margin: 18px 0 5px 0;">Игрок 2 (Слева / WASD):</div>';
        for (let act of ACTION_DEFS) {
            let code = userControls.DUO_KEYBOARD.p2[act.id];
            let isWaiting = (rebindingTarget && rebindingTarget.scheme === 'DUO_KEYBOARD' && rebindingTarget.pKey === 'p2' && rebindingTarget.action === act.id);
            let btnLabel = isWaiting ? 'Нажмите...' : formatKeyName(code);
            html += `
                <div class="keybind-row">
                    <span class="keybind-name">${act.name}</span>
                    <span class="keybind-line"></span>
                    <button class="keybind-btn ${isWaiting ? 'waiting' : ''}" style="border-color: #ffcc00; color: #ffdd44;" onclick="startRebinding('DUO_KEYBOARD', '${act.id}', 'p2')">${btnLabel}</button>
                </div>
            `;
        }
        container.innerHTML = html;
        return;
    }

    // SCHEME_1 or SCHEME_2
    let map = userControls[currentEditingScheme];
    let html = '';
    for (let act of ACTION_DEFS) {
        let code = map[act.id];
        let isWaiting = (rebindingTarget && rebindingTarget.scheme === currentEditingScheme && rebindingTarget.action === act.id);
        let btnLabel = isWaiting ? 'Нажмите...' : formatKeyName(code);
        html += `
            <div class="keybind-row">
                <span class="keybind-name">${act.name}</span>
                <span class="keybind-line"></span>
                <button class="keybind-btn ${isWaiting ? 'waiting' : ''}" onclick="startRebinding('${currentEditingScheme}', '${act.id}')">${btnLabel}</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

function startRebinding(schemeKey, actionId, pKey = null) {
    hideConflictBanner();
    rebindingTarget = { scheme: schemeKey, action: actionId, pKey: pKey };
    window.rebindingActive = true;
    window.currentRebindCallback = (code) => handleKeyRebind(code);
    renderKeybindList();
}
window.startRebinding = startRebinding;

function cancelRebinding() {
    rebindingTarget = null;
    window.rebindingActive = false;
    window.currentRebindCallback = null;
    renderKeybindList();
}

function showConflictBanner(msg) {
    let b = document.getElementById('keybind-conflict-banner');
    if (b) {
        b.innerText = msg;
        b.style.display = 'block';
    }
}

function hideConflictBanner() {
    let b = document.getElementById('keybind-conflict-banner');
    if (b) b.style.display = 'none';
}

function handleKeyRebind(newCode) {
    if (!rebindingTarget) return;
    let { scheme, action, pKey } = rebindingTarget;
    hideConflictBanner();

    if (scheme === 'DUO_KEYBOARD') {
        let myMap = userControls.DUO_KEYBOARD[pKey];
        let otherPKey = (pKey === 'p1') ? 'p2' : 'p1';
        let otherMap = userControls.DUO_KEYBOARD[otherPKey];

        // Conflict check: if the key is already used by the other player!
        let conflictAction = Object.keys(otherMap).find(act => otherMap[act] === newCode);
        if (conflictAction) {
            let actName = ACTION_DEFS.find(a => a.id === conflictAction)?.name || conflictAction;
            let otherPlayerName = (pKey === 'p1') ? 'Игроком 2' : 'Игроком 1';
            showConflictBanner(`⚠️ Клавиша [${formatKeyName(newCode)}] уже занята ${otherPlayerName} («${actName}»)! Выберите другую.`);
            playSound('hitPlayer');
            cancelRebinding();
            return;
        }

        // Auto-swap within current player's scheme
        let oldCode = myMap[action];
        let duplicateAction = Object.keys(myMap).find(act => act !== action && myMap[act] === newCode);
        if (duplicateAction) {
            myMap[duplicateAction] = oldCode; // SWAP!
            playSound('parry');
        } else {
            playSound('slash');
        }
        myMap[action] = newCode;
    } else {
        // Single scheme (SCHEME_1 or SCHEME_2)
        let map = userControls[scheme];
        let oldCode = map[action];
        // Auto-swap within same scheme
        let duplicateAction = Object.keys(map).find(act => act !== action && map[act] === newCode);
        if (duplicateAction) {
            map[duplicateAction] = oldCode; // SWAP!
            playSound('parry');
        } else {
            playSound('slash');
        }
        map[action] = newCode;
    }

    saveControlsToStorage();
    cancelRebinding();
}

function resetCurrentSchemeToDefault() {
    if (!currentEditingScheme) return;
    if (currentEditingScheme === 'DUO_KEYBOARD') {
        userControls.DUO_KEYBOARD = JSON.parse(JSON.stringify(DEFAULT_CONTROLS.DUO_KEYBOARD));
    } else {
        userControls[currentEditingScheme] = JSON.parse(JSON.stringify(DEFAULT_CONTROLS[currentEditingScheme]));
    }
    saveControlsToStorage();
    playSound('parry');
    hideConflictBanner();
    renderKeybindList();
}
window.resetCurrentSchemeToDefault = resetCurrentSchemeToDefault;

// --- RESET MODAL ---
function showResetModal() {
    let m = document.getElementById('reset-modal');
    if (m) m.style.display = 'block';
}
window.showResetModal = showResetModal;

function hideResetModal() {
    let m = document.getElementById('reset-modal');
    if (m) m.style.display = 'none';
}
window.hideResetModal = hideResetModal;

function confirmResetAllData() {
    try {
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem('shelter_custom_controls');
        localStorage.removeItem('shelter_fire_unlocked');
    } catch(e){}
    window.fireHeroUnlocked = false;
    testModeUnlocked = false;
    window.testModeUnlocked = false;
    initControlsFromStorage();
    hideResetModal();
    openScreen('root-menu', false);
    playSound('parry');
}
window.confirmResetAllData = confirmResetAllData;

function selectHero1(type) { 
    p1HeroSelection = type; 
    if (numPlayers === 1) { 
        Object.assign(configAbilities.p1, defaultAbilities[type]); 
        prepBadgeMenu(); 
    } else { 
        let p1Status = document.getElementById('p1-status');
        if (p1Status) p1Status.innerText = "Игрок 1 Готов!"; 
        checkDuoStart(); 
    } 
}
window.selectHero1 = selectHero1;

function checkDuoStart() { 
    if (p1HeroSelection && p2HeroSelection) { 
        Object.assign(configAbilities.p1, defaultAbilities[p1HeroSelection]); 
        Object.assign(configAbilities.p2, defaultAbilities[p2HeroSelection]); 
        prepBadgeMenu(); 
    } 
}
window.checkDuoStart = checkDuoStart;

function getSlotsForHero(type) { 
    if (type === 'STAMINA' || type === 'EARTH') return 3;
    return 2; // WATER, AIR, FIRE
}
window.getSlotsForHero = getSlotsForHero;

function prepBadgeMenu() {
    document.getElementById("hero-select").style.display = "none";
    document.getElementById("badge-select").style.display = "block";

    let titleTeam = document.getElementById("team-slot-title");
    let slotTeam = document.getElementById("slot-team");
    if (slotTeam) slotTeam.style.display = "inline-block"; 
    if (titleTeam) titleTeam.style.display = "block";

    let p1BadgeTitle = document.querySelector("#p1-badge-area > div:first-child");
    if (p1BadgeTitle) p1BadgeTitle.innerText = "Знаки (Игрок 1):";

    let p1html = '';
    let sCount1 = getSlotsForHero(p1HeroSelection);
    for (let i = 0; i < sCount1; i++) {
        let savedKey = (configBadges.p1 && configBadges.p1[i]) ? configBadges.p1[i] : 'none';
        let bName = (savedKey === 'none') ? '[Пусто]' : badgesDict[savedKey].name.split(' (')[0];
        p1html += `<div class="badge-slot" id="slot-p1_${i}" onclick="openBadgeList('p1_${i}')">${bName}</div>`;
    }
    let p1sc = document.getElementById("p1-slots-container");
    if (p1sc) p1sc.innerHTML = p1html;

    let a1html = '';
    let info1 = getAbilitiesInfo(p1HeroSelection);
    for (let slot of info1.slots) {
        let abName = abilityDict[configAbilities.p1[slot]] || '[Пусто]';
        a1html += `<div class="badge-slot" id="slot-p1_ab_${slot}" onclick="openAbList('p1', '${slot}', '${p1HeroSelection}')" style="border-color: yellow; color: white;">${abilitySlotNames[slot]}: ${abName}</div>`;
    }
    let p1ac = document.getElementById("p1-abilities-container");
    if (p1ac) p1ac.innerHTML = a1html;

    if (numPlayers === 2) {
        let p2area = document.getElementById("p2-badge-area");
        if (p2area) p2area.style.display = "block";
        
        let p2BadgeTitle = document.querySelector("#p2-badge-area > div:first-child");
        if (p2BadgeTitle) p2BadgeTitle.innerText = "Знаки (Игрок 2):";

        let p2html = '';
        let sCount2 = getSlotsForHero(p2HeroSelection);
        for (let i = 0; i < sCount2; i++) {
            let savedKey = (configBadges.p2 && configBadges.p2[i]) ? configBadges.p2[i] : 'none';
            let bName = (savedKey === 'none') ? '[Пусто]' : badgesDict[savedKey].name.split(' (')[0];
            p2html += `<div class="badge-slot" id="slot-p2_${i}" onclick="openBadgeList('p2_${i}')">${bName}</div>`;
        }
        let p2sc = document.getElementById("p2-slots-container");
        if (p2sc) p2sc.innerHTML = p2html;

        let a2html = '';
        let info2 = getAbilitiesInfo(p2HeroSelection);
        for (let slot of info2.slots) {
            let abName = abilityDict[configAbilities.p2[slot]] || '[Пусто]';
            a2html += `<div class="badge-slot" id="slot-p2_ab_${slot}" onclick="openAbList('p2', '${slot}', '${p2HeroSelection}')" style="border-color: yellow; color: white;">${abilitySlotNames[slot]}: ${abName}</div>`;
        }
        let p2ac = document.getElementById("p2-abilities-container");
        if (p2ac) p2ac.innerHTML = a2html;
    }
}
window.prepBadgeMenu = prepBadgeMenu;

function openBadgeList(slotId) {
    currentEditingSlot = slotId; 
    currentEditingAbility = null;
    let listDiv = document.getElementById("badge-list");
    if (!listDiv) return;
    listDiv.style.display = "flex"; 
    listDiv.innerHTML = '';
    let isTopSlot = (slotId === 'team');

    for (let key in badgesDict) {
        let b = badgesDict[key];
        if (isTopSlot && b.teamAllowed !== true) continue; 
        if (!isTopSlot && b.teamAllowed === true && key !== 'none') continue; 
        
        let colorStyle = (b.teamAllowed === true || isTopSlot) 
            ? 'color: cyan; border-color: cyan;' 
            : 'color: white; border-color: #aaa;';
        listDiv.innerHTML += `<div class="badge-item" style="${colorStyle}" onclick="assignBadge('${key}')">${b.name}</div>`;
    }
}
window.openBadgeList = openBadgeList;

function openAbList(playerId, slotId, heroType) {
    currentEditingSlot = null; 
    currentEditingAbility = { p: playerId, s: slotId };
    let listDiv = document.getElementById("badge-list");
    if (!listDiv) return;
    listDiv.style.display = "flex"; 
    listDiv.innerHTML = '';
    
    let info = getAbilitiesInfo(heroType);
    for (let abKey of info.pool) {
        listDiv.innerHTML += `<div class="badge-item" style="color: #ffff88; border-color: #ffff88;" onclick="assignAbility('${abKey}')">${abilityDict[abKey]}</div>`;
    }
}
window.openAbList = openAbList;

function assignBadge(badgeKey) {
    let rawName = (badgesDict[badgeKey].id === 'none') ? '[Пусто]' : badgesDict[badgeKey].name.split(' (')[0];
    if (currentEditingSlot === 'team') { 
        configBadges.team = badgeKey; 
        let el = document.getElementById('slot-team');
        if (el) el.innerText = rawName; 
    } else {
        let parts = currentEditingSlot.split('_'); 
        let pKey = parts[0];
        let slotIdx = parseInt(parts[1]);
        if (!configBadges[pKey]) configBadges[pKey] = [];
        configBadges[pKey][slotIdx] = badgeKey;
        let el = document.getElementById('slot-' + currentEditingSlot);
        if (el) el.innerText = rawName;
    }
    let bl = document.getElementById("badge-list");
    if (bl) bl.style.display = "none";
}
window.assignBadge = assignBadge;

function assignAbility(abKey) {
    configAbilities[currentEditingAbility.p][currentEditingAbility.s] = abKey;
    let el = document.getElementById(`slot-${currentEditingAbility.p}_ab_${currentEditingAbility.s}`);
    if (el) el.innerText = `${abilitySlotNames[currentEditingAbility.s]}: ${abilityDict[abKey]}`;
    let bl = document.getElementById("badge-list");
    if (bl) bl.style.display = "none";
}
window.assignAbility = assignAbility;

// Restore unlocked Fire Hero from localStorage
window.addEventListener('DOMContentLoaded', () => {
    try {
        if (localStorage.getItem('shelter_fire_unlocked') === 'true') {
            window.fireHeroUnlocked = true;
            let p1Ui = document.getElementById("p1-select-ui");
            if (p1Ui && !document.getElementById("btn-hero-fire")) {
                p1Ui.innerHTML += `<div id="btn-hero-fire" class="menu-btn" onclick="selectHero1('FIRE')" style="color: #ff5500; border-color: #ff5500;">5. Огонь</div>`;
            }
            let p2Text = document.getElementById("p2-options-text");
            if (p2Text) {
                p2Text.innerHTML = "<b>1</b>-Вода | <b>2</b>-Воздух | <b>3</b>-Земля | <b>4</b>-4-й Герой | <b style='color:#ff5500;'>5</b>-Огонь";
            }
        }
    } catch(e){}
});

