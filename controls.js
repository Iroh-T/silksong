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
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return; // Don't trigger game hotkeys or preventDefault when typing in inputs
    }

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
        let p2Screen = document.getElementById("p2-account-screen");
        let canActivateL = (modeScreen && modeScreen.style.display === "block") || 
                           (inputScreen && inputScreen.style.display === "block") ||
                           (p2Screen && p2Screen.style.display === "block");
        if (canActivateL && !secretMode) {
            secretMode = true; 
            playSound('heal'); 
            if (typeof unlockAchievement === 'function') unlockAchievement('whisper_of_void');
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
            if (godModeActive && typeof flagCheatUsage === 'function') {
                flagCheatUsage('Режим Бога [9]');
            }
        }
        if (e.key === '0' || e.code === 'Digit0') {
            megaDamageActive = !megaDamageActive;
            window.megaDamageActive = megaDamageActive;
            playSound(megaDamageActive ? 'slash' : 'hitBoss');
            if (megaDamageActive && typeof flagCheatUsage === 'function') {
                flagCheatUsage('Мега-урон х5 [0]');
            }
        }
    }
    
    // Unlock Fire Hero (Key 4 in Menu)
    if ((e.key === '4' || e.code === 'Digit4') && gameState === "MENU") {
        if (!window.fireHeroUnlocked) {
            window.fireHeroUnlocked = true; 
            try { localStorage.setItem('shelter_fire_unlocked', 'true'); } catch(e){}
            playSound('slash');
            if (typeof unlockAchievement === 'function') unlockAchievement('true_flame');
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

    // Restart key [R] (from Game Over or Boss Defeat straight to layout selection with saved accounts!)
    let isGameOverOrWon = (gameState === "GAMEOVER" || (gameState === "PLAYING" && (boss.state === "DEFEATED" || boss.state === "FREE_ROAM")));
    if (isGameOverOrWon && (e.code === "KeyR" || e.key === "r" || e.key === "к" || e.key === "К")) {
        if (typeof isTutorial !== 'undefined' && isTutorial) {
            buildAndStartTutorialGame();
            return;
        }
        gameState = "MENU";
        battleResultRecorded = false;
        document.getElementById("overlay").style.display = "block";
        
        // Go straight to layout/controls selection keeping the same active accounts!
        selectMode(numPlayers, true);

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

// --- AUTHENTICATION & PROFILE HANDLERS ---
let currentAuthTab = 'register';

function switchAuthTab(tab) {
    currentAuthTab = tab;
    let tabReg = document.getElementById('tab-btn-register');
    let tabLog = document.getElementById('tab-btn-login');
    let hint = document.getElementById('auth-hint');
    let submitBtn = document.getElementById('auth-submit-btn');
    let err = document.getElementById('auth-error');
    if (err) err.innerText = '';

    if (tab === 'register') {
        if (tabReg) tabReg.classList.add('active');
        if (tabLog) tabLog.classList.remove('active');
        if (hint) hint.innerText = "ЗАРЕГИСТРИРУЙСЯ, если у тебя еще нет профиля";
        if (submitBtn) submitBtn.innerText = "СОЗДАТЬ АККАУНТ";
    } else {
        if (tabLog) tabLog.classList.add('active');
        if (tabReg) tabReg.classList.remove('active');
        if (hint) hint.innerText = "Если у тебя уже есть профиль, можешь ВОЙТИ и играть с него";
        if (submitBtn) submitBtn.innerText = "ВОЙТИ В ИГРУ";
    }
}
window.switchAuthTab = switchAuthTab;

async function handleAuthSubmit() {
    let nameInput = document.getElementById('auth-username');
    let passInput = document.getElementById('auth-password');
    let err = document.getElementById('auth-error');
    let submitBtn = document.getElementById('auth-submit-btn');
    if (!nameInput || !passInput || !err) return;

    let name = nameInput.value.trim();
    let pass = passInput.value;

    let origText = submitBtn ? submitBtn.innerText : '';
    if (submitBtn) {
        submitBtn.innerText = "Подключение к базе...";
        submitBtn.disabled = true;
    }

    try {
        let res = (currentAuthTab === 'register') 
            ? await registerUser(name, pass) 
            : await loginUser(name, pass);

        if (!res.success) {
            err.innerText = res.message;
            playSound('hitPlayer');
            if (submitBtn) {
                submitBtn.innerText = origText;
                submitBtn.disabled = false;
            }
            return;
        }

        err.innerText = '';
        nameInput.value = '';
        passInput.value = '';
        playSound('heal');
        updateUserBadge();
        openScreen('root-menu', false);
    } catch(e) {
        err.innerText = "Ошибка соединения: " + e.message;
        playSound('hitPlayer');
    } finally {
        if (submitBtn) {
            submitBtn.innerText = origText;
            submitBtn.disabled = false;
        }
    }
}
window.handleAuthSubmit = handleAuthSubmit;

function handleLogout() {
    clearCurrentUser();
    updateUserBadge();
    menuHistory = [];
    openScreen('auth-screen', false);
    switchAuthTab('login');
}
window.handleLogout = handleLogout;

function updateUserBadge() {
    let badge = document.getElementById('user-badge');
    let nameEl = document.getElementById('user-badge-name');
    let adminBtn = document.getElementById('admin-panel-btn');
    let curUser = getCurrentUser();
    if (!badge || !nameEl) return;

    if (curUser) {
        nameEl.innerText = curUser;
        let authScreen = document.getElementById('auth-screen');
        badge.style.display = (authScreen && authScreen.style.display === 'block') ? 'none' : 'flex';
        
        // Show Admin Panel button if Timur ('РЫБа') is logged in
        if (adminBtn) {
            let isTimur = (curUser.toLowerCase() === 'рыба' || curUser.toLowerCase() === 'рыба' || curUser.toLowerCase() === 'admin');
            adminBtn.style.display = isTimur ? 'block' : 'none';
        }
    } else {
        badge.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
    }
}
window.updateUserBadge = updateUserBadge;

// --- MENU NAVIGATION & SCREENS STACK ---
let menuHistory = [];

function openScreen(screenId, pushHistory = true) {
    let curUser = getCurrentUser();
    if (!curUser && screenId !== 'auth-screen') {
        screenId = 'auth-screen';
        pushHistory = false;
    }

    const allScreens = [
        'auth-screen',
        'root-menu',
        'mode-select',
        'p2-account-screen',
        'input-select',
        'hero-select',
        'badge-select',
        'achievements-menu',
        'admin-screen',
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

    // Universal Back Button: visible on sub-screens EXCEPT root-menu and auth-screen!
    let backBtn = document.getElementById('menu-back-btn');
    if (backBtn) {
        backBtn.style.display = (screenId === 'root-menu' || screenId === 'auth-screen') ? 'none' : 'block';
    }

    // User badge: show only if logged in and not on auth-screen
    updateUserBadge();

    // Cancel mode L if returning to root menu
    if (screenId === 'root-menu' && secretMode) {
        cancelSecretMode();
    }

    // Dynamic renders when opening specific screens
    if (screenId === 'achievements-menu') {
        renderAchievements();
    }
    if (screenId === 'admin-screen') {
        renderAdminScreen();
    }
    if (screenId === 'p2-account-screen') {
        let hostEl = document.getElementById('p2-screen-p1-name');
        if (hostEl) hostEl.innerText = getCurrentUser() || "Игрок 1";
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

// --- PLAYER 2 AUTHENTICATION UI HANDLERS ---
let currentP2AuthTab = 'login';

function openP2AccountScreen() {
    let p1Name = getCurrentUser() || "Игрок 1";
    let hostEl = document.getElementById('p2-screen-p1-name');
    if (hostEl) hostEl.innerText = p1Name;

    let err = document.getElementById('p2-auth-error');
    if (err) err.innerText = '';
    let nameInput = document.getElementById('p2-auth-username');
    let passInput = document.getElementById('p2-auth-password');
    if (nameInput) nameInput.value = '';
    if (passInput) passInput.value = '';

    switchP2AuthTab('login');
    openScreen('p2-account-screen');
}
window.openP2AccountScreen = openP2AccountScreen;

function selectP2Guest() {
    setP2User("Гость");
    playSound('heal');
    proceedToInputSelectDuo();
}
window.selectP2Guest = selectP2Guest;

function switchP2AuthTab(tab) {
    currentP2AuthTab = tab;
    let tabLog = document.getElementById('p2-tab-btn-login');
    let tabReg = document.getElementById('p2-tab-btn-reg');
    let hint = document.getElementById('p2-auth-hint');
    let submitBtn = document.getElementById('p2-auth-submit-btn');
    let err = document.getElementById('p2-auth-error');
    if (err) err.innerText = '';

    if (tab === 'login') {
        if (tabLog) tabLog.classList.add('active');
        if (tabReg) tabReg.classList.remove('active');
        if (hint) hint.innerText = "Войди под своим ником, чтобы победы шли в твой профиль";
        if (submitBtn) submitBtn.innerText = "ВОЙТИ В СВОЙ АККАУНТ";
    } else {
        if (tabReg) tabReg.classList.add('active');
        if (tabLog) tabLog.classList.remove('active');
        if (hint) hint.innerText = "Создай новый аккаунт для Игрока 2 (пароль от 4 знаков)";
        if (submitBtn) submitBtn.innerText = "СОЗДАТЬ И ВЫБРАТЬ";
    }
}
window.switchP2AuthTab = switchP2AuthTab;

async function handleP2AuthSubmit() {
    let nameInput = document.getElementById('p2-auth-username');
    let passInput = document.getElementById('p2-auth-password');
    let err = document.getElementById('p2-auth-error');
    let submitBtn = document.getElementById('p2-auth-submit-btn');
    if (!nameInput || !passInput || !err) return;

    let name = nameInput.value.trim();
    let pass = passInput.value;

    let origText = submitBtn ? submitBtn.innerText : '';
    if (submitBtn) {
        submitBtn.innerText = "Проверка...";
        submitBtn.disabled = true;
    }

    try {
        let res = (currentP2AuthTab === 'register')
            ? await registerUserP2(name, pass)
            : await loginUserP2(name, pass);

        if (!res.success) {
            err.innerText = res.message;
            playSound('hitPlayer');
            if (submitBtn) {
                submitBtn.innerText = origText;
                submitBtn.disabled = false;
            }
            return;
        }

        err.innerText = '';
        playSound('heal');
        proceedToInputSelectDuo();
    } catch(e) {
        err.innerText = "Ошибка: " + e.message;
        playSound('hitPlayer');
    } finally {
        if (submitBtn) {
            submitBtn.innerText = origText;
            submitBtn.disabled = false;
        }
    }
}
window.handleP2AuthSubmit = handleP2AuthSubmit;

function proceedToInputSelectDuo() {
    numPlayers = 2;
    openScreen('input-select');
    document.getElementById("input-1p").style.display = "none";
    document.getElementById("input-2p").style.display = "block";
    updateDuoSubOptions();
}
window.proceedToInputSelectDuo = proceedToInputSelectDuo;

function selectMode(mode, keepP2 = false) {
    numPlayers = mode;
    if (mode === 1) {
        setP2User(null);
        openScreen('input-select');
        document.getElementById("input-1p").style.display = "block"; 
        document.getElementById("input-2p").style.display = "none";
    } else {
        if (keepP2 && getP2User()) {
            proceedToInputSelectDuo();
        } else {
            openP2AccountScreen();
        }
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
    let p1Lbl = document.getElementById('duo-p1-label');
    if (p1Lbl) p1Lbl.innerText = getCurrentUser() || "Игрок 1";
    let p2Lbl = document.getElementById('duo-p2-label');
    if (p2Lbl) p2Lbl.innerText = getP2User() || "Гость";

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

function openTutorialLayoutModal() {
    let modal = document.getElementById('tutorial-layout-modal');
    if (modal) modal.style.display = 'flex';
}
window.openTutorialLayoutModal = openTutorialLayoutModal;

function closeTutorialLayoutModal() {
    let modal = document.getElementById('tutorial-layout-modal');
    if (modal) modal.style.display = 'none';
}
window.closeTutorialLayoutModal = closeTutorialLayoutModal;

function startTutorialWithInput(inputType) {
    closeTutorialLayoutModal();
    isTutorial = true;
    numPlayers = 1;
    secretMode = false;
    p1HeroSelection = 'WATER';
    p1InputType = inputType || 'KEYBOARD_1';

    let mobUi = document.getElementById("mobile-ui");
    if (inputType === 'TOUCH') {
        if (mobUi) mobUi.style.display = "flex";
    } else {
        if (mobUi) mobUi.style.display = "none";
    }

    buildAndStartTutorialGame();
}
window.startTutorialWithInput = startTutorialWithInput;

function startTutorial() {
    openTutorialLayoutModal();
}
window.startTutorial = startTutorial;

function showTutorialPromptModal() {
    let modal = document.getElementById('tutorial-prompt-modal');
    if (modal) modal.style.display = 'flex';
}
window.showTutorialPromptModal = showTutorialPromptModal;

function closeTutorialPromptModal() {
    let modal = document.getElementById('tutorial-prompt-modal');
    if (modal) modal.style.display = 'none';
}
window.closeTutorialPromptModal = closeTutorialPromptModal;

function startTutorialFromPrompt() {
    closeTutorialPromptModal();
    openTutorialLayoutModal();
}
window.startTutorialFromPrompt = startTutorialFromPrompt;

function selectInput(in1, in2) {
    p1InputType = in1; 
    if (numPlayers === 2) p2InputType = in2;

    if (typeof isTutorial !== 'undefined' && isTutorial) {
        if (in1 === 'TOUCH') {
            let mobUi = document.getElementById("mobile-ui");
            if (mobUi) mobUi.style.display = "flex";
        }
        buildAndStartTutorialGame();
        return;
    }

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

function promptRenamePlace(netId) {
    let targetNet = netId || currentNetworkId;
    let curName = getNetworkDisplayName(targetNet);
    let curUser = getCurrentUser() || '';
    let isCreator = (curUser.toLowerCase() === 'рыба' || curUser.toLowerCase() === 'admin');
    
    let promptMsg = isCreator 
        ? "👑 СОЗДАТЕЛЬ РЫБа:\nВведите официальное название для этого места (оно отобразится У ВСЕХ игроков):" 
        : "Введите ваше название для этого места (например: 'Дом', 'Школа', 'У друга'):";
        
    let res = prompt(promptMsg, curName.startsWith("Неизведанное") ? "" : curName);
    if (res && res.trim()) {
        setNetworkName(targetNet, res.trim()).then(() => {
            renderAchievements();
        });
    }
}
window.promptRenamePlace = promptRenamePlace;

// --- ACHIEVEMENTS RENDERER ---
function renderAchievements() {
    let container = document.getElementById('achievements-content');
    if (!container) return;
    
    let curUser = getCurrentUser();
    let accs = loadAccounts();
    let userAcc = curUser ? accs[curUser.toLowerCase()] : null;
    let s = userAcc && userAcc.stats ? userAcc.stats : loadGameStats();
    
    let totalWins = s.soloNormalWins + s.soloSecretWins + s.duoNormalWins + s.duoSecretWins;
    let totalLosses = s.soloNormalLosses + s.soloSecretLosses + s.duoNormalLosses + s.duoSecretLosses;
    let totalBattles = totalWins + totalLosses;
    let winRate = totalBattles > 0 ? Math.round((totalWins / totalBattles) * 100) : 0;

    let userLabel = userAcc 
        ? `Игрок: <b style="color: #00ffff; font-size: 18px;">${userAcc.name}</b>` 
        : `Общая статистика игры`;

    // 1. Secret Achievements (ONLY completed are shown; fish_day is pinned prestigiously at top)
    let userAchMap = (userAcc && userAcc.achievements) ? userAcc.achievements : {};
    let unlockedAchs = ACHIEVEMENTS_DEF.filter(a => userAchMap[a.id]);
    let hasFishDay = !!userAchMap['fish_day'];
    let otherUnlocked = unlockedAchs.filter(a => a.id !== 'fish_day');

    let fishDayHtml = '';
    if (hasFishDay) {
        let fishDef = ACHIEVEMENTS_DEF.find(a => a.id === 'fish_day');
        fishDayHtml = `
            <div class="prestigious-fish-card">
                <div class="prestigious-crown">👑 ВЫСШЕЕ ПОЧЁТНОЕ ДОСТИЖЕНИЕ 👑</div>
                <div class="prestigious-title">${fishDef.title}</div>
                <div class="prestigious-desc">${fishDef.desc}</div>
                <div class="prestigious-badge">✨ ЗНАК ДРУЖБЫ И ПРИЗНАНИЯ РЫБЫ ✨</div>
            </div>
        `;
    }

    let achGridHtml = '';
    if (otherUnlocked.length > 0) {
        achGridHtml = `
            <div class="achieve-grid" style="margin-top: 10px;">
                ${otherUnlocked.map(a => `
                    <div class="achieve-card unlocked-secret">
                        <div class="achieve-card-title" style="color: #ffd700;">${a.title}</div>
                        <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">${a.desc}</div>
                        <div style="font-size: 10px; color: #4ade80; margin-top: 6px; font-weight: bold;">✓ РАЗБЛОКИРОВАНО</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    let secretAchSection = '';
    if (unlockedAchs.length === 0) {
        secretAchSection = `
            <div class="leaderboard-container" style="text-align: center; padding: 18px;">
                <div class="leaderboard-title" style="color: #ffd700;">🎖️ СЕКРЕТНЫЕ ДОСТИЖЕНИЯ</div>
                <div style="color: #94a3b8; font-size: 13px; font-style: italic; margin-top: 6px;">
                    Секретные боевые достижения скрыты и ждут первооткрывателей!<br>
                    Сражайтесь, побеждайте босса в разных режимах и условиях, чтобы раскрыть их.
                </div>
            </div>
        `;
    } else {
        secretAchSection = `
            <div class="leaderboard-container">
                <div class="leaderboard-title" style="color: #ffd700;">🎖️ ВЫПОЛНЕННЫЕ СЕКРЕТНЫЕ ДОСТИЖЕНИЯ (${unlockedAchs.length})</div>
                ${fishDayHtml}
                ${achGridHtml}
            </div>
        `;
    }

    // 2. Visited Places / Networks
    let placesHtml = '';
    let visitedMap = (userAcc && userAcc.visitedNetworks) ? userAcc.visitedNetworks : {};
    let visitedKeys = Object.keys(visitedMap);
    if (visitedKeys.length === 0 && currentNetworkId) {
        visitedKeys = [currentNetworkId];
    }

    if (visitedKeys.length > 0) {
        placesHtml = `
            <div class="leaderboard-container">
                <div class="leaderboard-title" style="color: #00ffcc; display: flex; justify-content: space-between; align-items: center;">
                    <span>📍 ГДЕ ВЫ ПОБЫВАЛИ (${visitedKeys.length})</span>
                    <button class="menu-btn" style="padding: 3px 10px; font-size: 11px; margin: 0;" onclick="promptRenamePlace('${currentNetworkId}')">✏️ Назвать текущее место</button>
                </div>
                ${visitedKeys.map(netId => {
                    let dName = getNetworkDisplayName(netId);
                    let isGlobal = globalNetworks && globalNetworks[netId] && globalNetworks[netId].name;
                    let isCurrent = (netId === currentNetworkId);
                    return `
                        <div class="leaderboard-row" style="align-items: center; justify-content: space-between;">
                            <div>
                                <span style="font-size: 14px;">🏠 <b>${dName}</b></span>
                                ${isGlobal ? '<span style="color:#ffd700; font-size:11px; margin-left: 6px;" title="Официальное имя от Создателя">👑 Официальное место</span>' : ''}
                                ${isCurrent ? '<span style="color:#00ffff; font-size:11px; margin-left: 6px;">[Сейчас здесь]</span>' : ''}
                            </div>
                            <button class="menu-btn" style="padding: 2px 8px; font-size: 11px; margin: 0;" onclick="promptRenamePlace('${netId}')">✏️ Назвать</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 3. Leaderboard across all accounts
    let accList = Object.values(accs);
    accList.sort((a, b) => {
        let aW = (a.stats ? a.stats.soloNormalWins + a.stats.soloSecretWins + a.stats.duoNormalWins + a.stats.duoSecretWins : 0);
        let bW = (b.stats ? b.stats.soloNormalWins + b.stats.soloSecretWins + b.stats.duoNormalWins + b.stats.duoSecretWins : 0);
        return bW - aW;
    });

    let leaderboardHtml = '';
    if (accList.length > 0) {
        leaderboardHtml = `
            <div class="leaderboard-container">
                <div class="leaderboard-title">🏆 ТАБЛИЦА ЛИДЕРОВ (ПОБЕДЫ ДРУЗЕЙ)</div>
                ${accList.map((acc, idx) => {
                    let st = acc.stats || { soloNormalWins: 0, soloSecretWins: 0, duoNormalWins: 0, duoSecretWins: 0 };
                    let w = st.soloNormalWins + st.soloSecretWins + st.duoNormalWins + st.duoSecretWins;
                    let isMe = curUser && acc.name.toLowerCase() === curUser.toLowerCase();
                    let medal = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : `${idx + 1}.`));
                    return `
                        <div class="leaderboard-row ${isMe ? 'me' : ''}">
                            <span>${medal} <b>${acc.name}</b> ${isMe ? '<span style="color:#00ffff; font-size:11px;">(Вы)</span>' : ''}</span>
                            <span style="color: #00ff66; font-weight: bold;">${w} побед</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 4. Co-op partners history
    let partnersHtml = '';
    let partnersMap = (userAcc && userAcc.coopPartners) ? userAcc.coopPartners : {};
    let partnersList = Object.entries(partnersMap);
    if (partnersList.length > 0) {
        partnersList.sort((a, b) => (b[1].wins || 0) - (a[1].wins || 0));
        partnersHtml = `
            <div class="leaderboard-container">
                <div class="leaderboard-title" style="color: #00e5ff;">🤝 НАПАРНИКИ В КООПЕРАТИВЕ</div>
                ${partnersList.map(([pName, pData]) => {
                    let w = pData.wins || 0;
                    let b = pData.battles || 0;
                    let isGuest = pName.toLowerCase() === 'гость' || pName.toLowerCase() === 'noname';
                    return `
                        <div class="leaderboard-row">
                            <span>👤 <b>${pName}</b> ${isGuest ? '<span style="color:#aaa; font-size:11px;">(Гость)</span>' : ''}</span>
                            <span style="color: #aaddff; font-size: 13px;">
                                Боёв: <b>${b}</b> | Побед: <b style="color: #00ff66;">${w}</b>
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    container.innerHTML = `
        <div style="margin-bottom: 8px;">
            ${userLabel}
        </div>
        <div style="margin-bottom: 15px; font-size: 13px; color: #aaddff;">
            Боёв: <b>${totalBattles}</b> | Побед: <b style="color: #44ff44;">${totalWins}</b> | Винрейт: <b style="color: #ffcc00;">${winRate}%</b>
        </div>
        ${secretAchSection}
        ${placesHtml}
        <div class="achieve-grid" style="margin-top: 15px;">
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
        ${partnersHtml}
        ${leaderboardHtml}
    `;

    // Real-time background sync with Firebase so all players see updated ranks
    if (!window._achieveSyncing) {
        window._achieveSyncing = true;
        syncAccountsFromFirebase().then(freshAccs => {
            window._achieveSyncing = false;
            let freshList = Object.values(freshAccs || {});
            if (freshList.length !== accList.length) {
                renderAchievements();
            }
        }).catch(() => { window._achieveSyncing = false; });
    }
}
window.renderAchievements = renderAchievements;

// --- IN-GAME ADMIN PANEL RENDERER ---
async function renderAdminScreen() {
    let listEl = document.getElementById('admin-cards-list');
    if (!listEl) return;
    listEl.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 25px;">Загрузка данных из облака Firebase...</div>';

    let accs = await syncAccountsFromFirebase();
    let list = Object.values(accs || {});

    if (list.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 25px;">В базе пока нет зарегистрированных игроков.</div>';
        return;
    }

    list.forEach(a => {
        let st = a.stats || { soloNormalWins: 0, soloSecretWins: 0, duoNormalWins: 0, duoSecretWins: 0 };
        a._totalWins = (st.soloNormalWins || 0) + (st.soloSecretWins || 0) + (st.duoNormalWins || 0) + (st.duoSecretWins || 0);
    });
    list.sort((a, b) => b._totalWins - a._totalWins);

    listEl.innerHTML = list.map((acc, idx) => {
        let isOwner = (acc.name && (acc.name.toLowerCase() === 'рыба' || acc.name.toLowerCase() === 'admin'));
        let regDate = acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : '—';
        let medal = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : "🔹"));
        return `
            <div class="admin-card">
                <div class="admin-card-row">
                    <span style="font-weight: bold; color: ${isOwner ? '#ffd700' : '#ffffff'};">
                        ${medal} <b>${acc.name}</b> ${isOwner ? '<span style="color:#ffd700; font-size:11px;">👑 (Создатель)</span>' : ''}
                    </span>
                    <span style="color: #4ade80; font-weight: bold;">🏆 ${acc._totalWins} побед</span>
                </div>
                <div class="admin-card-row">
                    <span style="color: #94a3b8; font-size: 12px;">Пароль:</span>
                    <span class="admin-pass-chip">${acc.password || '—'}</span>
                </div>
                <div class="admin-card-row" style="font-size: 11px; color: #64748b; margin-top: 4px;">
                    <span>Регистрация: ${regDate}</span>
                </div>
            </div>
        `;
    }).join('');
}
window.renderAdminScreen = renderAdminScreen;

async function adminSendRosterToTelegram() {
    let toast = document.getElementById('admin-toast');
    if (toast) {
        toast.style.display = 'block';
        toast.style.color = '#00ffff';
        toast.innerText = 'Отправка в Telegram...';
    }
    let res = await sendAllAccountsToTelegram();
    if (toast) {
        if (res.success) {
            toast.style.color = '#00ff66';
            toast.innerText = '✅ База отправлена в твой Telegram!';
        } else {
            toast.style.color = '#ff5566';
            toast.innerText = 'Ошибка: ' + res.message;
        }
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }
}
window.adminSendRosterToTelegram = adminSendRosterToTelegram;

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
        localStorage.removeItem(ACCOUNTS_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);
    } catch(e){}
    window.fireHeroUnlocked = false;
    testModeUnlocked = false;
    window.testModeUnlocked = false;
    initControlsFromStorage();
    hideResetModal();
    updateUserBadge();
    openScreen('auth-screen', false);
    switchAuthTab('register');
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

// Restore unlocked Fire Hero and check user authentication
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

    // Detect network and visited places
    if (typeof detectCurrentNetwork === 'function') {
        detectCurrentNetwork();
    }

    // Check user authentication & background sync cloud accounts
    let curUser = getCurrentUser();
    let accs = loadAccounts();
    if (curUser && accs[curUser.toLowerCase()]) {
        updateUserBadge();
        openScreen('root-menu', false);

        // Check if newcomer with 0 battles
        let u = accs[curUser.toLowerCase()];
        let st = u.stats || {};
        let totalB = (st.soloNormalWins || 0) + (st.soloNormalLosses || 0) + (st.soloSecretWins || 0) + (st.soloSecretLosses || 0) + (st.duoNormalWins || 0) + (st.duoNormalLosses || 0) + (st.duoSecretWins || 0) + (st.duoSecretLosses || 0);
        let hasGrad = u.achievements && u.achievements['tutorial_grad'];
        if (totalB === 0 && !hasGrad && !sessionStorage.getItem('shelter_tut_prompt_seen')) {
            sessionStorage.setItem('shelter_tut_prompt_seen', 'true');
            setTimeout(() => {
                showTutorialPromptModal();
            }, 600);
        }
    } else {
        openScreen('auth-screen', false);
        switchAuthTab('register');
    }

    // Cloud sync in background
    syncAccountsFromFirebase().then(() => {
        let updatedUser = getCurrentUser();
        if (updatedUser) {
            updateUserBadge();
        }
    }).catch(e => console.warn("Init sync failed:", e));
});

