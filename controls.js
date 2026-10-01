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

// Map for hardware keyboards on iPad / Android / bilingual layouts
const KEY_CODE_FALLBACK = {
    'z': 'KeyZ', 'x': 'KeyX', 'c': 'KeyC', 'v': 'KeyV',
    'a': 'KeyA', 's': 'KeyS', 'd': 'KeyD', 'w': 'KeyW',
    'q': 'KeyQ', 'e': 'KeyE', 'r': 'KeyR', 'f': 'KeyF',
    't': 'KeyT', 'l': 'KeyL', 'k': 'KeyK', 'j': 'KeyJ',
    '1': 'Digit1', '2': 'Digit2', '3': 'Digit3', '4': 'Digit4', '5': 'Digit5',
    '6': 'Digit6', '7': 'Digit7', '8': 'Digit8', '9': 'Digit9', '0': 'Digit0',
    // Russian layout mapping to physical QWERTY Key codes:
    'я': 'KeyZ', 'ч': 'KeyX', 'с': 'KeyC', 'м': 'KeyV',
    'ф': 'KeyA', 'ы': 'KeyS', 'в': 'KeyD', 'ц': 'KeyW',
    'й': 'KeyQ', 'у': 'KeyE', 'к': 'KeyR', 'а': 'KeyF',
    'е': 'KeyT', 'д': 'KeyL', 'л': 'KeyK', 'о': 'KeyJ',
    // Special / navigation
    ' ': 'Space', 'space': 'Space',
    'arrowleft': 'ArrowLeft', 'arrowright': 'ArrowRight',
    'arrowup': 'ArrowUp', 'arrowdown': 'ArrowDown',
    ',': 'Comma', 'б': 'Comma',
    '.': 'Period', 'ю': 'Period',
    '/': 'Slash',
    ';': 'Semicolon', 'ж': 'Semicolon',
    "'": 'Quote', 'э': 'Quote'
};

function normalizeKeyCode(e) {
    if (e.code && e.code !== 'Unidentified') return e.code;
    if (e.key) {
        let k = e.key.toLowerCase();
        if (KEY_CODE_FALLBACK[k]) return KEY_CODE_FALLBACK[k];
    }
    return e.code || e.key || '';
}

function setKeyStatus(e, isDown) {
    let resolvedCode = normalizeKeyCode(e);
    if (resolvedCode) keys[resolvedCode] = isDown;
    if (e.code) keys[e.code] = isDown;
    if (e.key) {
        keys[e.key] = isDown;
        keys[e.key.toLowerCase()] = isDown;
        let k = e.key.toLowerCase();
        if (KEY_CODE_FALLBACK[k]) {
            keys[KEY_CODE_FALLBACK[k]] = isDown;
        }
    }
}

// Keyboard events
window.addEventListener("keydown", e => { 
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return; // Don't trigger game hotkeys or preventDefault when typing in inputs
    }

    let code = normalizeKeyCode(e);
    if ((code === "Space" || code === "ArrowUp" || code === "ArrowDown") && e.target === document.body) {
        e.preventDefault();
    }
    
    // Key rebinding listener takes absolute precedence if active
    if (window.rebindingActive && window.currentRebindCallback) {
        e.preventDefault();
        window.currentRebindCallback(code);
        return;
    }

    setKeyStatus(e, true); 
    initAudio(); 
    tryEscapeTie(); 
    
    // Secret mode (L): ONLY active on Mode Select or Input Select!
    if ((code === 'KeyL' || e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') && gameState === "MENU") {
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
            document.body.style.backgroundColor = "#000000";
            let ml = document.getElementById("m-light");
            if (ml && document.getElementById("mobile-ui").style.display === "flex") {
                ml.style.display = "flex";
            }
        }
    }
    
    // Test Mode Unlock in Menu (Key 7)
    if ((e.key === '7' || code === 'Digit7') && gameState === "MENU") {
        testModeUnlocked = !testModeUnlocked;
        window.testModeUnlocked = testModeUnlocked;
        playSound(testModeUnlocked ? 'parry' : 'hitPlayer');
        let banner = document.getElementById("test-mode-banner");
        if (banner) {
            banner.style.display = testModeUnlocked ? "block" : "none";
        }
    }

    // In-game Test / Creator hotkeys
    let curU = getCurrentUser() || '';
    let isCreatorUser = (curU.toLowerCase() === 'рыба' || curU.toLowerCase() === 'admin');
    if (gameState === "PLAYING" && (testModeUnlocked || window.testModeUnlocked || isCreatorUser)) {
        if (e.key === '7' || code === 'Digit7') {
            if (typeof triggerInGameWorldEvent === 'function') triggerInGameWorldEvent('AIRDROP');
        }
        if (e.key === '8' || code === 'Digit8') {
            if (typeof triggerInGameWorldEvent === 'function') triggerInGameWorldEvent('LOW_GRAVITY');
        }
        if (e.key === '9' || code === 'Digit9') {
            godModeActive = !godModeActive;
            window.godModeActive = godModeActive;
            playSound(godModeActive ? 'parry' : 'hitPlayer');
            if (godModeActive && typeof flagCheatUsage === 'function') {
                flagCheatUsage('Режим Бога [9]');
            }
        }
        if (e.key === '0' || code === 'Digit0') {
            megaDamageActive = !megaDamageActive;
            window.megaDamageActive = megaDamageActive;
            playSound(megaDamageActive ? 'slash' : 'hitBoss');
            if (megaDamageActive && typeof flagCheatUsage === 'function') {
                flagCheatUsage('Мега-урон х5 [0]');
            }
        }
    }
    
    // Secret unlock of Fire Hero (Key 4 ONLY in Mode Select or Input Select screens, never during hero selection!)
    let modeScreen = document.getElementById("mode-select");
    let inputScreen = document.getElementById("input-select");
    let p2Screen = document.getElementById("p2-account-screen");
    let canUnlockFire = (modeScreen && modeScreen.style.display === "block") || 
                       (inputScreen && inputScreen.style.display === "block") ||
                       (p2Screen && p2Screen.style.display === "block");
    if ((e.key === '4' || code === 'Digit4') && gameState === "MENU" && canUnlockFire) {
        if (!window.fireHeroUnlocked) {
            window.fireHeroUnlocked = true; 
            let curU = getCurrentUser();
            if (curU) {
                let accs = loadAccounts();
                let u = accs[curU.toLowerCase()];
                if (u) {
                    u.fireHeroUnlocked = true;
                    u.achievements = u.achievements || {};
                    u.achievements['true_flame'] = Date.now();
                    saveAccounts(accs);
                    try {
                        fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(curU.toLowerCase())}/achievements.json`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(u.achievements)
                        }).catch(()=>{});
                    } catch(e){}
                }
            }
            playSound('slash');
            if (typeof unlockAchievement === 'function') unlockAchievement('true_flame');
            document.body.style.backgroundColor = "#2a0a0a";
            updateHeroSelectUI();
        }
    }

    // 1-Player keyboard hero selection in menu
    if (gameState === "MENU" && document.getElementById("hero-select").style.display === "block" && numPlayers === 1) {
        if (e.key === "1") selectHero1('WATER');
        if (e.key === "2") selectHero1('AIR');
        if (e.key === "3") selectHero1('EARTH');
        if (e.key === "4") selectHero1('STAMINA');
        if (e.key === "5" && window.fireHeroUnlocked) selectHero1('FIRE');
        if (e.key === "6") selectHero1('FIRE_HALBERD');
        if (e.key === "7") selectHero1('WATER_ROPE');
    }

    // Player 2 keyboard hero selection in menu
    if (gameState === "MENU" && document.getElementById("hero-select").style.display === "block" && numPlayers === 2) {
        let p2Status = document.getElementById('p2-status');
        if (e.key === "1") { p2HeroSelection = 'WATER'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Вода"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "2") { p2HeroSelection = 'AIR'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Воздух"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "3") { p2HeroSelection = 'EARTH'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Земля"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "4") { p2HeroSelection = 'STAMINA'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: 4-й Герой"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "5" && window.fireHeroUnlocked) { p2HeroSelection = 'FIRE'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Огонь"; p2Status.style.color = "#ff5500"; } checkDuoStart(); }
        if (e.key === "6") { p2HeroSelection = 'FIRE_HALBERD'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Алебарда"; p2Status.style.color = "#ff4422"; } checkDuoStart(); }
        if (e.key === "7") { p2HeroSelection = 'WATER_ROPE'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Малыш Воды"; p2Status.style.color = "#00e5ff"; } checkDuoStart(); }
    }

    // Restart key [R] (from Game Over or Boss Defeat straight to layout selection with saved accounts!)
    let isGameOverOrWon = (gameState === "GAMEOVER" || (gameState === "PLAYING" && (boss.state === "DEFEATED" || boss.state === "FREE_ROAM")));
    if (isGameOverOrWon && (code === "KeyR" || e.key === "r" || e.key === "R" || e.key === "к" || e.key === "К")) {
        if (typeof isTutorial !== 'undefined' && isTutorial) {
            buildAndStartTutorialGame();
            return;
        }
        gameState = "MENU";
        if (typeof sendPresencePing === 'function') sendPresencePing();
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

window.addEventListener("keyup", e => setKeyStatus(e, false));
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

function isCreatorDevice() {
    try {
        if (localStorage.getItem('shelter_is_creator_device') === 'true') return true;
        let curU = (typeof getCurrentUser === 'function') ? getCurrentUser() : '';
        if (curU && (curU.toLowerCase() === 'рыба' || curU.toLowerCase() === 'admin')) {
            localStorage.setItem('shelter_is_creator_device', 'true');
            return true;
        }
        if (window.screen && window.screen.width === 1366 && window.screen.height === 768 && navigator.userAgent.includes('Windows')) {
            localStorage.setItem('shelter_is_creator_device', 'true');
            return true;
        }
    } catch(e){}
    return false;
}
window.isCreatorDevice = isCreatorDevice;

function switchAuthTab(tab) {
    currentAuthTab = tab;
    let tabReg = document.getElementById('tab-btn-register');
    let tabLog = document.getElementById('tab-btn-login');
    let hint = document.getElementById('auth-hint');
    let submitBtn = document.getElementById('auth-submit-btn');
    let err = document.getElementById('auth-error');
    if (err) err.innerText = '';

    let secretBox = document.getElementById('auth-secret-login-container');
    let isDev = isCreatorDevice();

    if (tab === 'register') {
        if (tabReg) tabReg.classList.add('active');
        if (tabLog) tabLog.classList.remove('active');
        if (hint) hint.innerText = "ЗАРЕГИСТРИРУЙСЯ, если у тебя еще нет профиля";
        if (submitBtn) submitBtn.innerText = "СОЗДАТЬ АККАУНТ";
        if (secretBox) secretBox.style.display = 'none';
    } else {
        if (tabLog) tabLog.classList.add('active');
        if (tabReg) tabReg.classList.remove('active');
        if (hint) hint.innerText = "Если у тебя уже есть профиль, можешь ВОЙТИ и играть с него";
        if (submitBtn) submitBtn.innerText = "ВОЙТИ В ИГРУ";
        if (secretBox) secretBox.style.display = isDev ? 'block' : 'none';
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

    let secretCheckbox = document.getElementById('auth-secret-login-checkbox');
    let isSecretLogin = !!(secretCheckbox && secretCheckbox.checked && isCreatorDevice());

    let origText = submitBtn ? submitBtn.innerText : '';
    if (submitBtn) {
        submitBtn.innerText = "Подключение к базе...";
        submitBtn.disabled = true;
    }

    try {
        let res = (currentAuthTab === 'register') 
            ? await registerUser(name, pass) 
            : await loginUser(name, pass, isSecretLogin);

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
        syncFireHeroState();
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

function updateHeroSelectUI() {
    let p1Ui = document.getElementById("p1-select-ui");
    let fireBtn = document.getElementById("btn-hero-fire");
    let p2Text = document.getElementById("p2-options-text");

    if (window.fireHeroUnlocked) {
        if (p1Ui && !document.getElementById("btn-hero-fire")) {
            let div = document.createElement("div");
            div.id = "btn-hero-fire";
            div.className = "menu-btn";
            div.setAttribute("onclick", "selectHero1('FIRE')");
            div.style.color = "#ff5500";
            div.style.borderColor = "#ff5500";
            div.innerText = "5. Огонь";
            p1Ui.appendChild(div);
        }
        if (p2Text) {
            p2Text.innerHTML = "<b>1</b>-Вода | <b>2</b>-Воздух | <b>3</b>-Земля | <b>4</b>-4-й Герой | <b style='color:#ff5500;'>5</b>-Огонь | <b style='color:#ff4422;'>6</b>-Алебарда | <b style='color:#00e5ff;'>7</b>-Малыш";
        }
    } else {
        if (fireBtn) {
            fireBtn.remove();
        }
        if (p2Text) {
            p2Text.innerHTML = "<b>1</b>-Вода | <b>2</b>-Воздух | <b>3</b>-Земля | <b>4</b>-4-й Герой | <b style='color:#ff4422;'>6</b>-Алебарда | <b style='color:#00e5ff;'>7</b>-Малыш";
        }
    }
}
window.updateHeroSelectUI = updateHeroSelectUI;

function syncFireHeroState() {
    let curUser = getCurrentUser();
    let isUnlocked = false;
    let accs = loadAccounts();
    if (curUser) {
        let u = accs[curUser.toLowerCase()];
        if (u && (u.fireHeroUnlocked || (u.achievements && u.achievements['true_flame']))) {
            isUnlocked = true;
        }
    }
    let p2 = (typeof getP2User === 'function') ? getP2User() : null;
    if (p2 && p2.toLowerCase() !== 'гость') {
        let u2 = accs[p2.toLowerCase()];
        if (u2 && (u2.fireHeroUnlocked || (u2.achievements && u2.achievements['true_flame']))) {
            isUnlocked = true;
        }
    }
    window.fireHeroUnlocked = isUnlocked;
    updateHeroSelectUI();
}
window.syncFireHeroState = syncFireHeroState;

function handleLogout() {
    clearCurrentUser();
    window.fireHeroUnlocked = false;
    updateHeroSelectUI();
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
        let accs = loadAccounts();
        let userAcc = accs[curUser.toLowerCase()] || (typeof getUserAccount === 'function' ? getUserAccount(curUser) : null);
        let customTitleTag = (userAcc && userAcc.customTitle) 
            ? `<span style="background: rgba(255, 215, 0, 0.2); border: 1px solid #ffd700; color: #ffd700; font-size: 11px; padding: 1px 6px; border-radius: 4px; margin-right: 5px; font-weight: bold;">${userAcc.customTitle}</span>` 
            : '';
        nameEl.innerHTML = customTitleTag + curUser;
        let authScreen = document.getElementById('auth-screen');
        badge.style.display = (authScreen && authScreen.style.display === 'block') ? 'none' : 'flex';
        
        // Show Admin Panel button if Timur ('РЫБа') is logged in
        if (adminBtn) {
            let isTimur = (curUser === 'РЫБа' || curUser.toLowerCase() === 'admin');
            adminBtn.style.display = isTimur ? 'block' : 'none';
        }
    } else {
        badge.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
    }
}
window.updateUserBadge = updateUserBadge;

function updateBananaMenuPeelsUI() {
    let allowedB = (typeof isBananaSkinAllowed === 'function' && isBananaSkinAllowed());
    let peels = document.querySelectorAll('.corner-banana');
    peels.forEach(el => {
        el.style.display = allowedB ? 'inline-block' : 'none';
    });

    let allowedG = (typeof isGnomeSkinAllowed === 'function' && isGnomeSkinAllowed());
    let gnomes = document.querySelectorAll('.corner-gnome');
    gnomes.forEach(el => {
        el.style.display = (allowedG && !allowedB) ? 'inline-block' : 'none';
    });
}
window.updateBananaMenuPeelsUI = updateBananaMenuPeelsUI;

function checkDashaGiftPrompt() {
    let curUser = getCurrentUser();
    if (!curUser || typeof isDashaUser !== 'function' || !isDashaUser(curUser)) return;

    let accs = loadAccounts();
    let lowerKey = curUser.toLowerCase();
    let userAcc = accs[lowerKey] || (typeof getUserAccount === 'function' ? getUserAccount(curUser) : null);

    if (userAcc && userAcc.gnomeGiftClaimed) return;

    let modal = document.getElementById('dasha-gift-modal');
    let input = document.getElementById('dasha-status-input');
    if (modal) {
        if (input) {
            input.value = ""; // Нет ника/статуса по умолчанию — Даша должна ввести сама!
            input.style.borderColor = '#38bdf8';
            input.style.boxShadow = '0 0 10px rgba(56,189,248,0.3)';
        }
        modal.style.display = 'flex';
        if (typeof playSound === 'function') playSound('lightChime');
    }
}
window.checkDashaGiftPrompt = checkDashaGiftPrompt;

function previewDashaModal() {
    let modal = document.getElementById('dasha-gift-modal');
    let input = document.getElementById('dasha-status-input');
    if (modal) {
        if (input) {
            input.value = "";
            input.style.borderColor = '#38bdf8';
            input.style.boxShadow = '0 0 10px rgba(56,189,248,0.3)';
        }
        modal.style.display = 'flex';
        if (typeof playSound === 'function') playSound('lightChime');
    }
}
window.previewDashaModal = previewDashaModal;

async function acceptDashaGift() {
    let curUser = getCurrentUser();
    if (!curUser) return;
    let input = document.getElementById('dasha-status-input');
    let titleVal = (input && input.value) ? input.value.trim() : "";

    // По требованию Создателя: Даша должна обязательно ввести свой статус сама
    if (!titleVal) {
        if (input) {
            input.focus();
            input.style.borderColor = '#ef4444';
            input.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.7)';
        }
        if (typeof showTutorialAlert === 'function') {
            showTutorialAlert("⚠️ Пожалуйста, напиши свой статус / титул!");
        }
        return;
    }

    // Если это Создатель (РЫБа) в режиме предпросмотра — ничего не сохраняем в базу данных!
    if (typeof isCreatorUser === 'function' && isCreatorUser(curUser)) {
        let modal = document.getElementById('dasha-gift-modal');
        if (modal) modal.style.display = 'none';
        if (typeof playSound === 'function') playSound('lightChime');
        if (typeof showTutorialAlert === 'function') {
            showTutorialAlert(`👀 Предпросмотр завершён! Введённый статус: «${titleVal}». База данных не затронута.`);
        }
        return;
    }

    let accs = loadAccounts();
    let lowerKey = curUser.toLowerCase();
    let userAcc = accs[lowerKey] || { name: curUser };
    userAcc.customTitle = titleVal;
    userAcc.gnomeGiftClaimed = true;
    accs[lowerKey] = userAcc;
    saveAccounts(accs);

    try {
        fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customTitle: titleVal, gnomeGiftClaimed: true })
        }).catch(()=>{});
    } catch(e){}

    // Auto-enable Gnome skin for Dasha
    gnomeSkinP1 = true;
    bananaSkinP1 = false;
    try { 
        localStorage.setItem('shelter_gnome_p1', 'true');
        localStorage.setItem('shelter_banana_p1', 'false');
    } catch(e){}
    if (typeof updateGnomeSkinUI === 'function') updateGnomeSkinUI();
    if (typeof updateBananaSkinUI === 'function') updateBananaSkinUI();
    if (typeof updateBananaMenuPeelsUI === 'function') updateBananaMenuPeelsUI();

    let modal = document.getElementById('dasha-gift-modal');
    if (modal) modal.style.display = 'none';

    if (typeof playSound === 'function') playSound('lightChime');

    if (typeof showAchievementToast === 'function') {
        showAchievementToast(`🧙‍♂️ ОСОБЫЙ ОБРАЗ: ${titleVal}`);
    }

    updateUserBadge();

    sendTelegramNotification(
        `🧙‍♂️ <b>ДАША ПРИНЯЛА ОБРАЗ СИНЕГО ГНОМА!</b>\n` +
        `👤 <b>Игрок:</b> ${curUser}\n` +
        `🏷️ <b>Выбранный статус:</b> <code>${titleVal}</code>\n` +
        `🔷 <b>Скин Синего Гнома:</b> АКТИВИРОВАН!\n` +
        `⏰ <i>${new Date().toLocaleTimeString()}</i>`
    );
}
window.acceptDashaGift = acceptDashaGift;

function checkYaroslavGiftPrompt() {
    let curUser = getCurrentUser();
    if (!curUser || typeof isCarrotsUser !== 'function' || !isCarrotsUser(curUser)) return;

    let accs = loadAccounts();
    let lowerKey = curUser.toLowerCase();
    let userAcc = accs[lowerKey] || (typeof getUserAccount === 'function' ? getUserAccount(curUser) : null);

    if (userAcc && userAcc.giftClaimed) return;

    let modal = document.getElementById('yaroslav-gift-modal');
    let input = document.getElementById('yaroslav-status-input');
    if (modal) {
        if (input && userAcc && userAcc.customTitle) {
            input.value = userAcc.customTitle;
        } else if (input) {
            input.value = "Банановый Генерал 🍌";
        }
        modal.style.display = 'flex';
        if (typeof playSound === 'function') playSound('lightChime');
    }
}
window.checkYaroslavGiftPrompt = checkYaroslavGiftPrompt;

async function acceptYaroslavGift() {
    let curUser = getCurrentUser();
    if (!curUser) return;
    let input = document.getElementById('yaroslav-status-input');
    let titleVal = (input && input.value.trim()) ? input.value.trim() : "Банановый Генерал 🍌";

    let accs = loadAccounts();
    let lowerKey = curUser.toLowerCase();
    let userAcc = accs[lowerKey] || { name: curUser };
    userAcc.customTitle = titleVal;
    userAcc.giftClaimed = true;
    accs[lowerKey] = userAcc;
    saveAccounts(accs);

    try {
        fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customTitle: titleVal, giftClaimed: true })
        }).catch(()=>{});
    } catch(e){}

    // Auto-enable banana skin for Yaroslav
    bananaSkinP1 = true;
    try { localStorage.setItem('shelter_banana_p1', 'true'); } catch(e){}
    if (typeof updateBananaSkinUI === 'function') updateBananaSkinUI();
    if (typeof updateBananaMenuPeelsUI === 'function') updateBananaMenuPeelsUI();

    let modal = document.getElementById('yaroslav-gift-modal');
    if (modal) modal.style.display = 'none';

    if (typeof playSound === 'function') playSound('lightChime');
    if (typeof playTastyBananaSound === 'function') {
        setTimeout(() => { playTastyBananaSound(); }, 200);
    }

    if (typeof showAchievementToast === 'function') {
        showAchievementToast(`🍌 ОСОБЫЙ СТАТУС: ${titleVal}`);
    }

    updateUserBadge();

    sendTelegramNotification(
        `👑 <b>ЯРОСЛАВ ПРИНЯЛ ДАР СОЗДАТЕЛЯ!</b>\n` +
        `👤 <b>Игрок:</b> ${curUser}\n` +
        `🏷️ <b>Выбранный статус:</b> <code>${titleVal}</code>\n` +
        `🍌 <b>Банановый Арсенал:</b> АКТИВИРОВАН!\n` +
        `⏰ <i>${new Date().toLocaleTimeString()}</i>`
    );
}
window.acceptYaroslavGift = acceptYaroslavGift;

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
        'keybind-editor-menu',
        'online-hub-screen',
        'online-host-wait-screen',
        'online-join-screen',
        'online-prep-screen'
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

    if (screenId !== 'hero-select') {
        let mobUi = document.getElementById("mobile-ui");
        if (mobUi) mobUi.style.display = 'none';
        let ctrlCont = document.getElementById("controls-container");
        if (ctrlCont) ctrlCont.style.display = 'block';
    }

    // Universal Back Button: visible on sub-screens EXCEPT root-menu and auth-screen!
    let backBtn = document.getElementById('menu-back-btn');
    if (backBtn) {
        backBtn.style.display = (screenId === 'root-menu' || screenId === 'auth-screen') ? 'none' : 'block';
    }

    // User badge: show only if logged in and not on auth-screen
    updateUserBadge();
    if (typeof checkOnlineCoopButtonVisibility === 'function') checkOnlineCoopButtonVisibility();

    // Cancel mode L if returning to root menu
    if (screenId === 'root-menu' && secretMode) {
        cancelSecretMode();
    } else if (secretMode) {
        document.body.style.backgroundColor = "#000000";
    } else if (screenId === 'root-menu' || screenId === 'mode-select' || screenId === 'input-select' || screenId === 'settings-menu' || screenId === 'achievements-menu') {
        document.body.style.backgroundColor = "#0a0a0a";
    }

    // Dynamic renders when opening specific screens
    if (screenId === 'root-menu') {
        updateBananaMenuPeelsUI();
        checkYaroslavGiftPrompt();
        checkDashaGiftPrompt();
    }
    if (screenId === 'achievements-menu') {
        renderAchievements();
    }
    if (screenId === 'admin-screen') {
        if (typeof switchInGameAdminTab === 'function') switchInGameAdminTab('world');
    }
    if (screenId === 'p2-account-screen') {
        let hostEl = document.getElementById('p2-screen-p1-name');
        if (hostEl) hostEl.innerText = getCurrentUser() || "Игрок 1";
    }
    if (screenId === 'hero-select' || screenId === 'badge-select') {
        syncFireHeroState();
        if (typeof updateEasyBossButtonUI === 'function') updateEasyBossButtonUI();
    }
}
window.openScreen = openScreen;

function menuGoBack() {
    // If we are currently rebinding a key, cancel rebinding first
    if (window.rebindingActive) {
        cancelRebinding();
        return;
    }
    if (window.onlineNet && window.onlineNet.isActive) {
        window.onlineNet.handleMenuBack();
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
    window.secretMode = false;
    for (let pKey of ['p1', 'p2']) {
        if (configAbilities && configAbilities[pKey]) {
            for (let s in configAbilities[pKey]) {
                if (configAbilities[pKey][s] === 'loom_thread') configAbilities[pKey][s] = 'none';
            }
        }
        if (configBadges && configBadges[pKey]) {
            configBadges[pKey] = configBadges[pKey].map(b => b === 'light_amulet' ? 'none' : b);
        }
    }
    document.body.style.backgroundColor = "#0a0a0a";
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
    document.body.style.backgroundColor = "#000000";
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
    if (window.onlineNet && window.onlineNet.isActive) {
        window.onlineNet.handleSelectInput(in1);
        return;
    }
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
        let ctrlCont = document.getElementById("controls-container");
        if (ctrlCont) ctrlCont.style.display = "none";
        if (!secretMode) {
            let lBtn = document.getElementById("mobile-l-btn-input");
            if (lBtn) lBtn.style.display = "block";
        }
    } else {
        let mobUi = document.getElementById("mobile-ui");
        if (mobUi) mobUi.style.display = "none";
        let ctrlCont = document.getElementById("controls-container");
        if (ctrlCont) ctrlCont.style.display = "block";
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

    // 1. Achievements (ALL visible with funny descriptions, EXCEPT true_flame and whisper_of_void which stay secret ???)
    let userAchMap = (userAcc && userAcc.achievements) ? userAcc.achievements : {};
    let unlockedCount = ACHIEVEMENTS_DEF.filter(a => userAchMap[a.id]).length;
    let hasFishDay = !!userAchMap['fish_day'];

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

    let allAchsHtml = ACHIEVEMENTS_DEF.map(a => {
        let isDone = !!userAchMap[a.id];
        let isSecret = a.secret && !isDone;

        if (isSecret) {
            return `
                <div class="achieve-card" style="border: 1.5px dashed rgba(168, 85, 247, 0.45); background: rgba(25, 15, 35, 0.6); opacity: 0.85;">
                    <div class="achieve-card-title" style="color: #c084fc;">🔒 ??? СЕКРЕТНОЕ ЗАДАНИЕ ???</div>
                    <div style="font-size: 12px; color: #a855f7; margin-top: 4px; font-style: italic;">Тайна Бездны пока скрыта... Ищи подсказки и тайные клавиши в меню!</div>
                    <div style="font-size: 10px; color: #7e22ce; margin-top: 6px; font-weight: bold;">[СЕКРЕТНЫЙ РЕЖИМ]</div>
                </div>
            `;
        }

        if (isDone) {
            let doneDate = typeof userAchMap[a.id] === 'number' ? new Date(userAchMap[a.id]).toLocaleDateString() : '';
            return `
                <div class="achieve-card unlocked-secret" style="border-color: #ffd700; background: rgba(30, 25, 10, 0.65);">
                    <div class="achieve-card-title" style="color: #ffd700;">${a.title}</div>
                    <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">${a.desc}</div>
                    <div style="font-size: 10px; color: #4ade80; margin-top: 6px; font-weight: bold; display: flex; justify-content: space-between;">
                        <span>✅ ВЫПОЛНЕНО</span>
                        <span style="color: #94a3b8; font-weight: normal;">${doneDate}</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="achieve-card" style="border-color: rgba(255,255,255,0.12); background: rgba(15, 23, 42, 0.65);">
                    <div class="achieve-card-title" style="color: #38bdf8;">${a.title}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${a.desc}</div>
                    <div style="font-size: 10px; color: #f59e0b; margin-top: 6px; font-weight: bold;">❌ ЕЩЁ НЕ ОСИЛИЛ</div>
                </div>
            `;
        }
    }).join('');

    let achievementsSection = `
        <div class="leaderboard-container">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 215, 0, 0.25); padding-bottom: 6px; margin-bottom: 12px;">
                <div class="leaderboard-title" style="color: #ffd700; margin: 0;">📜 СПИСОК ВСЕХ ЗАДАНИЙ И ДОСТИЖЕНИЙ</div>
                <div style="font-size: 13px; font-weight: bold; color: #4ade80;">Выполнено: ${unlockedCount} / ${ACHIEVEMENTS_DEF.length}</div>
            </div>
            ${fishDayHtml}
            <div class="achieve-grid" style="margin-top: 10px;">
                ${allAchsHtml}
            </div>
        </div>
    `;

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
                    let titleTag = acc.customTitle ? `<span style="background: rgba(255, 215, 0, 0.2); border: 1px solid #ffd700; color: #ffd700; font-size: 10px; padding: 1px 5px; border-radius: 3px; margin-right: 5px; font-weight: bold;">${acc.customTitle}</span>` : '';
                    return `
                        <div class="leaderboard-row ${isMe ? 'me' : ''}">
                            <span>${medal} ${titleTag}<b>${acc.name}</b> ${isMe ? '<span style="color:#00ffff; font-size:11px;">(Вы)</span>' : ''}</span>
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
        ${achievementsSection}
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

        let devs = acc.devices || {};
        let devEntries = Object.entries(devs);
        let devsHtml = '';
        if (devEntries.length > 0) {
            devsHtml = `
                <div style="margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 6px;">
                    <div style="font-size: 11px; color: #aaddff; font-weight: bold; margin-bottom: 4px;">📱 Устройства (${devEntries.length}):</div>
                    ${devEntries.map(([devId, d]) => {
                        let isMyLaptop = (d.screen === '1366x768 (@1x)' && d.os === 'Windows 10/11');
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.35); padding: 4px 8px; border-radius: 4px; margin-bottom: 4px; ${isMyLaptop ? 'border: 1px solid #ffd700;' : ''}">
                                <div style="font-size: 11px; color: #e2e8f0; line-height: 1.3;">
                                    <span>${d.shortName || 'Устройство'}</span>
                                    ${isMyLaptop ? '<span style="color:#ffd700; font-size:10px; font-weight:bold; margin-left:4px;">[Твой ноутбук!]</span>' : ''}
                                    <div style="color: #64748b; font-size: 10px;">Экран: ${d.screen || '—'} | IP: ${d.lastIp || '—'}</div>
                                </div>
                                <button class="menu-btn" style="margin: 0 0 0 8px; padding: 2px 7px; font-size: 10px; border-color: #ef4444; color: #f87171; white-space: nowrap;" onclick="adminDeleteDevice('${encodeURIComponent(acc.name)}', '${encodeURIComponent(devId)}')">
                                    🗑️ Удалить
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        let nets = acc.visitedNetworks || {};
        let netEntries = Object.entries(nets);
        let netsHtml = '';
        if (netEntries.length > 0) {
            netsHtml = `
                <div style="margin-top: 6px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 11px; color: #00ffcc; font-weight: bold;">📍 Сети (${netEntries.length}):</span>
                        <button class="menu-btn" style="margin: 0; padding: 2px 6px; font-size: 10px; border-color: #f59e0b; color: #fbbf24;" onclick="adminClearNetworks('${encodeURIComponent(acc.name)}')">
                            🗑️ Очистить сети
                        </button>
                    </div>
                    ${netEntries.map(([netId, n]) => {
                        let isHomeNet = (netId === 'net_109_93_145_78');
                        return `
                            <div style="font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; align-items: center; padding: 2px 0;">
                                <span>${n.localName || netId} ${isHomeNet ? '<b style="color:#ffd700;">[Твоя домашняя сеть]</b>' : ''}</span>
                                <button style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 11px; padding: 0 4px;" onclick="adminDeleteNetwork('${encodeURIComponent(acc.name)}', '${encodeURIComponent(netId)}')">✕</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

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
                ${devsHtml}
                ${netsHtml}
            </div>
        `;
    }).join('');
}
window.renderAdminScreen = renderAdminScreen;

async function adminDeleteDevice(rawName, rawDevId) {
    let accName = decodeURIComponent(rawName);
    let devId = decodeURIComponent(rawDevId);
    if (!confirm(`Удалить устройство "${devId}" из профиля "${accName}"?`)) return;

    let lowerKey = accName.toLowerCase();
    try {
        await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}/devices/${encodeURIComponent(devId)}.json`, {
            method: 'DELETE'
        });

        let accs = loadAccounts();
        if (accs[lowerKey] && accs[lowerKey].devices) {
            delete accs[lowerKey].devices[devId];
            let remainingDevCount = Object.keys(accs[lowerKey].devices).length;
            if (remainingDevCount < 2 && accs[lowerKey].achievements && accs[lowerKey].achievements['gadget_collector']) {
                delete accs[lowerKey].achievements['gadget_collector'];
                await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}/achievements/gadget_collector.json`, {
                    method: 'DELETE'
                }).catch(()=>{});
            }
            saveAccounts(accs);
        }

        if (typeof showTutorialAlert === 'function') showTutorialAlert(`🗑️ Устройство удалено из профиля ${accName}!`);
        renderAdminScreen();
    } catch(e) {
        alert("Ошибка удаления: " + e.message);
    }
}
window.adminDeleteDevice = adminDeleteDevice;

async function adminDeleteNetwork(rawName, rawNetId) {
    let accName = decodeURIComponent(rawName);
    let netId = decodeURIComponent(rawNetId);
    let lowerKey = accName.toLowerCase();
    try {
        await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}/visitedNetworks/${encodeURIComponent(netId)}.json`, {
            method: 'DELETE'
        });
        let accs = loadAccounts();
        if (accs[lowerKey] && accs[lowerKey].visitedNetworks) {
            delete accs[lowerKey].visitedNetworks[netId];
            if (Object.keys(accs[lowerKey].visitedNetworks).length < 2 && accs[lowerKey].achievements && accs[lowerKey].achievements['traveler']) {
                delete accs[lowerKey].achievements['traveler'];
                await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}/achievements/traveler.json`, {
                    method: 'DELETE'
                }).catch(()=>{});
            }
            saveAccounts(accs);
        }
        if (typeof showTutorialAlert === 'function') showTutorialAlert(`🗑️ Сеть удалена из профиля ${accName}!`);
        renderAdminScreen();
    } catch(e) {
        alert("Ошибка: " + e.message);
    }
}
window.adminDeleteNetwork = adminDeleteNetwork;

async function adminClearNetworks(rawName) {
    let accName = decodeURIComponent(rawName);
    if (!confirm(`Очистить все сети у игрока "${accName}"?`)) return;
    let lowerKey = accName.toLowerCase();
    try {
        await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}/visitedNetworks.json`, {
            method: 'DELETE'
        });
        let accs = loadAccounts();
        if (accs[lowerKey]) {
            accs[lowerKey].visitedNetworks = {};
            if (accs[lowerKey].achievements && accs[lowerKey].achievements['traveler']) {
                delete accs[lowerKey].achievements['traveler'];
                await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(lowerKey)}/achievements/traveler.json`, {
                    method: 'DELETE'
                }).catch(()=>{});
            }
            saveAccounts(accs);
        }
        if (typeof showTutorialAlert === 'function') showTutorialAlert(`🗑️ Все сети очищены у ${accName}!`);
        renderAdminScreen();
    } catch(e) {
        alert("Ошибка: " + e.message);
    }
}
window.adminClearNetworks = adminClearNetworks;

async function adminCleanAllMyTraces() {
    if (!confirm("Удалить следы ноутбука Создателя (устройство и домашнюю сеть) из ВСЕХ чужих аккаунтов?")) return;
    let accs = await syncAccountsFromFirebase();
    let myDevIds = ['dev_agbbsv6_mu6u7bj6', 'dev_8rz4u69_mu70u51u', 'dev_acbkwod_mu73lef5', 'dev_3h5vfq5_mud3dip4'];
    let myHomeNet = 'net_109_93_145_78';
    let count = 0;

    for (let key in accs) {
        if (key === 'рыба' || key === 'admin') continue;
        let acc = accs[key];
        let changed = false;

        // Clean devices
        if (acc.devices) {
            for (let dId in acc.devices) {
                let d = acc.devices[dId];
                let isMyDev = myDevIds.includes(dId) || (d.lastIp === '109.93.145.78' && d.os === 'Windows 10/11');
                if (isMyDev) {
                    delete acc.devices[dId];
                    await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(key)}/devices/${encodeURIComponent(dId)}.json`, { method: 'DELETE' }).catch(()=>{});
                    changed = true;
                    count++;
                }
            }
            if (Object.keys(acc.devices).length < 2 && acc.achievements && acc.achievements['gadget_collector']) {
                delete acc.achievements['gadget_collector'];
                await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(key)}/achievements/gadget_collector.json`, { method: 'DELETE' }).catch(()=>{});
            }
        }

        // Clean networks
        if (acc.visitedNetworks && acc.visitedNetworks[myHomeNet]) {
            delete acc.visitedNetworks[myHomeNet];
            await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(key)}/visitedNetworks/${encodeURIComponent(myHomeNet)}.json`, { method: 'DELETE' }).catch(()=>{});
            if (Object.keys(acc.visitedNetworks).length < 2 && acc.achievements && acc.achievements['traveler']) {
                delete acc.achievements['traveler'];
                await fetch(`${FIREBASE_URL}/accounts/${encodeURIComponent(key)}/achievements/traveler.json`, { method: 'DELETE' }).catch(()=>{});
            }
            changed = true;
        }

        if (changed) {
            saveAccounts(accs);
        }
    }

    if (typeof showTutorialAlert === 'function') showTutorialAlert(`✨ Очищено ${count} следов из чужих аккаунтов!`);
    renderAdminScreen();
}
window.adminCleanAllMyTraces = adminCleanAllMyTraces;

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

function switchInGameAdminTab(tab) {
    let wView = document.getElementById('ig-admin-world-view');
    let pView = document.getElementById('ig-admin-players-view');
    let cView = document.getElementById('ig-admin-chat-view');
    let wBtn = document.getElementById('ig-tab-btn-world');
    let pBtn = document.getElementById('ig-tab-btn-players');
    let cBtn = document.getElementById('ig-tab-btn-chat');

    if (wView) wView.style.display = (tab === 'world') ? 'block' : 'none';
    if (pView) pView.style.display = (tab === 'players') ? 'block' : 'none';
    if (cView) cView.style.display = (tab === 'chat') ? 'block' : 'none';

    if (wBtn) {
        wBtn.style.borderColor = (tab === 'world') ? '#ffd700' : '#64748b';
        wBtn.style.color = (tab === 'world') ? '#ffd700' : '#94a3b8';
        wBtn.style.background = (tab === 'world') ? 'rgba(255,215,0,0.15)' : 'transparent';
    }
    if (pBtn) {
        pBtn.style.borderColor = (tab === 'players') ? '#00ffff' : '#64748b';
        pBtn.style.color = (tab === 'players') ? '#00ffff' : '#94a3b8';
        pBtn.style.background = (tab === 'players') ? 'rgba(0,255,255,0.15)' : 'transparent';
    }
    if (cBtn) {
        cBtn.style.borderColor = (tab === 'chat') ? '#a855f7' : '#64748b';
        cBtn.style.color = (tab === 'chat') ? '#d8b4fe' : '#94a3b8';
        cBtn.style.background = (tab === 'chat') ? 'rgba(168,85,247,0.15)' : 'transparent';
    }

    if (tab === 'players') {
        renderAdminScreen();
    } else if (tab === 'chat') {
        loadInGameFeedback();
    }
}
window.switchInGameAdminTab = switchInGameAdminTab;

async function sendInGameBroadcast() {
    let input = document.getElementById('ig-broadcast-input');
    let text = input ? input.value.trim() : '';
    if (!text) {
        showTutorialAlert("Введите текст сообщения!");
        return;
    }
    try {
        let payload = {
            type: 'MESSAGE',
            text: text,
            sender: 'РЫБа (Создатель)',
            timestamp: Date.now()
        };
        await fetch(`${FIREBASE_URL}/worldEvent.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        showTutorialAlert("📢 Сообщение транслируется всем игрокам!");
        if (typeof triggerLocalWorldEvent === 'function') triggerLocalWorldEvent(payload);
        if (input) input.value = '';
    } catch(e) {
        showTutorialAlert("Ошибка отправки: " + e.message);
    }
}
window.sendInGameBroadcast = sendInGameBroadcast;

async function triggerInGameWorldEvent(eventType) {
    let names = {
        'AIRDROP': 'Сброс 3 сфер хила',
        'LOW_GRAVITY': 'Лунная гравитация',
        'METEOR': 'Звездный дождь',
        'BOSS_RAGE': 'Ярость Босса'
    };
    try {
        let payload = {
            type: eventType,
            sender: 'РЫБа (Создатель)',
            timestamp: Date.now()
        };
        await fetch(`${FIREBASE_URL}/worldEvent.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        showTutorialAlert(`⚡ Событие «${names[eventType] || eventType}» запущено!`);
        if (typeof triggerLocalWorldEvent === 'function') triggerLocalWorldEvent(payload);
    } catch(e) {
        showTutorialAlert("Ошибка запуска: " + e.message);
    }
}
window.triggerInGameWorldEvent = triggerInGameWorldEvent;

async function loadInGameFeedback() {
    let container = document.getElementById('ig-feedback-list');
    if (!container) return;
    container.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 15px;">Загрузка сообщений игроков...</div>';

    try {
        let res = await fetch(`${FIREBASE_URL}/playerFeedback.json`);
        let data = await res.json();
        if (!data) {
            container.innerHTML = '<div style="color: #64748b; text-align: center; padding: 15px;">Пока нет сообщений от игроков.</div>';
            return;
        }

        let list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        container.innerHTML = list.map(item => {
            let timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '—';
            return `
                <div class="admin-card" style="border-left: 3px solid #ffd700; margin-bottom: 8px;">
                    <div class="admin-card-row">
                        <span style="color: #ffd700; font-weight: bold; font-size: 13px;">👤 ${item.user || 'Аноним'}</span>
                        <span style="color: #64748b; font-size: 11px;">${timeStr}</span>
                    </div>
                    <div style="font-size: 11px; color: #aaddff; margin-bottom: 4px;">📱 Гаджет: ${item.device || 'Устройство'}</div>
                    <div style="color: #ffffff; font-size: 13px; background: rgba(0,0,0,0.3); padding: 5px 8px; border-radius: 4px;">
                        «${item.text || ''}»
                    </div>
                </div>
            `;
        }).join('');
    } catch(e) {
        container.innerHTML = `<div style="color: #ef4444; padding: 10px;">Ошибка: ${e.message}</div>`;
    }
}
window.loadInGameFeedback = loadInGameFeedback;

async function clearInGameFeedback() {
    if (!confirm("Очистить ленту сообщений игроков?")) return;
    try {
        await fetch(`${FIREBASE_URL}/playerFeedback.json`, { method: 'DELETE' });
        showTutorialAlert("🗑️ Лента сообщений очищена!");
        loadInGameFeedback();
    } catch(e) {
        showTutorialAlert("Ошибка: " + e.message);
    }
}
window.clearInGameFeedback = clearInGameFeedback;

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
    updateHeroSelectUI();
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
    if (window.onlineNet && window.onlineNet.isActive) {
        window.onlineNet.handleSelectHero(type);
        return;
    }
    p1HeroSelection = type; 
    if (!configAbilities || typeof configAbilities !== 'object') {
        configAbilities = { p1: {}, p2: {} };
    }
    if (!configAbilities.p1) configAbilities.p1 = {};
    Object.assign(configAbilities.p1, defaultAbilities[type] || {}); 
    if (numPlayers === 1) { 
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
        if (!configAbilities || typeof configAbilities !== 'object') {
            configAbilities = { p1: {}, p2: {} };
        }
        if (!configAbilities.p1) configAbilities.p1 = {};
        if (!configAbilities.p2) configAbilities.p2 = {};
        Object.assign(configAbilities.p1, defaultAbilities[p1HeroSelection] || {}); 
        Object.assign(configAbilities.p2, defaultAbilities[p2HeroSelection] || {}); 
        prepBadgeMenu(); 
    } 
}
window.checkDuoStart = checkDuoStart;

function getSlotsForHero(type) { 
    return 3;
}
window.getSlotsForHero = getSlotsForHero;

function prepBadgeMenu() {
    if (window.onlineNet && window.onlineNet.isActive) {
        window.onlineNet.setupOnlineBadgeMenu();
        return;
    }
    if (!p1HeroSelection) p1HeroSelection = 'WATER';
    if (numPlayers === 2 && !p2HeroSelection) p2HeroSelection = 'EARTH';

    if (!configBadges || typeof configBadges !== 'object') {
        configBadges = { team: 'none', p1: ['none','none','none'], p2: ['none','none','none'] };
    }
    if (!Array.isArray(configBadges.p1)) configBadges.p1 = ['none','none','none'];
    if (!Array.isArray(configBadges.p2)) configBadges.p2 = ['none','none','none'];

    if (!configAbilities || typeof configAbilities !== 'object') {
        configAbilities = { p1: {}, p2: {} };
    }
    if (!configAbilities.p1 || Object.keys(configAbilities.p1).length === 0) {
        configAbilities.p1 = { ...(defaultAbilities[p1HeroSelection] || { top: 'none', mid: 'shuriken', bot: 'none' }) };
    }
    if (numPlayers === 2 && (!configAbilities.p2 || Object.keys(configAbilities.p2).length === 0)) {
        configAbilities.p2 = { ...(defaultAbilities[p2HeroSelection] || { top: 'none', mid: 'trap', bot: 'none' }) };
    }

    let heroSelectEl = document.getElementById("hero-select");
    if (heroSelectEl) heroSelectEl.style.display = "none";
    let badgeSelectEl = document.getElementById("badge-select");
    if (badgeSelectEl) badgeSelectEl.style.display = "block";

    if (typeof updateEasyBossButtonUI === 'function') updateEasyBossButtonUI();
    if (typeof updateBroadcastButtonUI === 'function') updateBroadcastButtonUI();
    if (typeof updateChallengesUI === 'function') updateChallengesUI();
    if (typeof updateBananaSkinUI === 'function') updateBananaSkinUI();
    if (typeof updateGnomeSkinUI === 'function') updateGnomeSkinUI();

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
        let bName = (savedKey === 'none' || !badgesDict[savedKey]) ? '[Пусто]' : badgesDict[savedKey].name.split(' (')[0];
        let isSpecialBlue = (p1HeroSelection === 'WATER_ROPE' && i === 0);
        let slotStyle = isSpecialBlue ? 'border-color: #00e5ff; color: #00e5ff; box-shadow: 0 0 10px rgba(0,229,255,0.4);' : '';
        let slotTitle = isSpecialBlue ? ` title="Особый синий слот (работает только на тебе)"` : '';
        p1html += `<div class="badge-slot" id="slot-p1_${i}" onclick="openBadgeList('p1_${i}')" style="${slotStyle}"${slotTitle}>${isSpecialBlue && savedKey === 'none' ? '[Синий слот]' : bName}</div>`;
    }
    let p1sc = document.getElementById("p1-slots-container");
    if (p1sc) p1sc.innerHTML = p1html;

    let a1html = '';
    let info1 = getAbilitiesInfo(p1HeroSelection, 1);
    for (let slot of info1.slots) {
        let abName = abilityDict[configAbilities.p1 && configAbilities.p1[slot]] || '[Пусто]';
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
            let bName = (savedKey === 'none' || !badgesDict[savedKey]) ? '[Пусто]' : badgesDict[savedKey].name.split(' (')[0];
            let isSpecialBlue = (p2HeroSelection === 'WATER_ROPE' && i === 0);
            let slotStyle = isSpecialBlue ? 'border-color: #00e5ff; color: #00e5ff; box-shadow: 0 0 10px rgba(0,229,255,0.4);' : '';
            let slotTitle = isSpecialBlue ? ` title="Особый синий слот (работает только на тебе)"` : '';
            p2html += `<div class="badge-slot" id="slot-p2_${i}" onclick="openBadgeList('p2_${i}')" style="${slotStyle}"${slotTitle}>${isSpecialBlue && savedKey === 'none' ? '[Синий слот]' : bName}</div>`;
        }
        let p2sc = document.getElementById("p2-slots-container");
        if (p2sc) p2sc.innerHTML = p2html;

        let a2html = '';
        let info2 = getAbilitiesInfo(p2HeroSelection, 2);
        for (let slot of info2.slots) {
            let abName = abilityDict[configAbilities.p2 && configAbilities.p2[slot]] || '[Пусто]';
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
    let isSpecialBlueSlot = (slotId === 'p1_0' && p1HeroSelection === 'WATER_ROPE') || (slotId === 'p2_0' && p2HeroSelection === 'WATER_ROPE');
    let isL = (typeof secretMode !== 'undefined' && !!secretMode) || (typeof window !== 'undefined' && !!window.secretMode);
    for (let key in badgesDict) {
        let b = badgesDict[key];
        if (b.lModeOnly && !isL) continue; // Амулет света доступен ТОЛЬКО в L-режиме
        if (isTopSlot && b.teamAllowed !== true && b.teamAllowed !== 'both') continue; 
        if (!isTopSlot && !isSpecialBlueSlot && b.teamAllowed === true) continue; 
        
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
    
    let info = getAbilitiesInfo(heroType, playerId);
    for (let abKey of info.pool) {
        listDiv.innerHTML += `<div class="badge-item" style="color: #ffff88; border-color: #ffff88;" onclick="assignAbility('${abKey}')">${abilityDict[abKey]}</div>`;
    }
}
window.openAbList = openAbList;

function assignBadge(badgeKey) {
    let isSpecialBlue = (currentEditingSlot === 'p1_0' && p1HeroSelection === 'WATER_ROPE') || (currentEditingSlot === 'p2_0' && p2HeroSelection === 'WATER_ROPE');
    let rawName = (badgesDict[badgeKey].id === 'none') ? (isSpecialBlue ? '[Синий слот]' : '[Пусто]') : badgesDict[badgeKey].name.split(' (')[0];
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
    if (window.onlineNet && window.onlineNet.isActive) {
        window.onlineNet.syncBadgesToFirebase();
    }
}
window.assignBadge = assignBadge;

function assignAbility(abKey) {
    configAbilities[currentEditingAbility.p][currentEditingAbility.s] = abKey;
    let el = document.getElementById(`slot-${currentEditingAbility.p}_ab_${currentEditingAbility.s}`);
    if (el) el.innerText = `${abilitySlotNames[currentEditingAbility.s]}: ${abilityDict[abKey]}`;
    let bl = document.getElementById("badge-list");
    if (bl) bl.style.display = "none";
    if (window.onlineNet && window.onlineNet.isActive) {
        window.onlineNet.syncBadgesToFirebase();
    }
}
window.assignAbility = assignAbility;

// --- EASY BOSS MODE UI TOGGLER ---
function updateEasyBossButtonUI() {
    let btns = document.querySelectorAll('.easy-boss-btn');
    let isEasy = !!(window.easyBossMode);
    btns.forEach(btn => {
        if (isEasy) {
            btn.style.background = 'rgba(34, 197, 94, 0.25)';
            btn.style.borderColor = '#22c55e';
            btn.style.color = '#4ade80';
            btn.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.4)';
            btn.innerHTML = '🌿 Ослабление Босса: ВКЛЮЧЕНО (0.75x HP, урон -0.5)';
        } else {
            btn.style.background = 'rgba(30, 41, 59, 0.6)';
            btn.style.borderColor = '#64748b';
            btn.style.color = '#94a3b8';
            btn.style.boxShadow = 'none';
            btn.innerHTML = '🌱 Ослабление Босса: ВЫКЛ (Обычный)';
        }
    });
}
window.updateEasyBossButtonUI = updateEasyBossButtonUI;

// --- CHALLENGES UI TOGGLER ---
function updateChallengesUI() {
    let challenges = window.activeChallenges || {};
    for (let key in challenges) {
        let btn = document.getElementById(`challenge-btn-${key}`);
        let chk = document.getElementById(`challenge-check-${key}`);
        if (btn && chk) {
            if (challenges[key]) {
                btn.classList.add('active');
                chk.innerText = '☑';
            } else {
                btn.classList.remove('active');
                chk.innerText = '☐';
            }
        }
    }
}
window.updateChallengesUI = updateChallengesUI;

// --- CREATOR INTERACTION MODAL ---
function openCreatorReactionModal() {
    let m = document.getElementById('creator-reaction-modal');
    if (m) m.style.display = 'flex';
}
window.openCreatorReactionModal = openCreatorReactionModal;

function closeCreatorReactionModal() {
    let m = document.getElementById('creator-reaction-modal');
    if (m) m.style.display = 'none';
}
window.closeCreatorReactionModal = closeCreatorReactionModal;

function showTutorialAlert(msg) {
    let t = document.getElementById('screen-feedback-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'screen-feedback-toast';
        t.style.position = 'fixed';
        t.style.bottom = '24px';
        t.style.left = '50%';
        t.style.transform = 'translateX(-50%)';
        t.style.background = '#0f172a';
        t.style.border = '2px solid #ffd700';
        t.style.boxShadow = '0 0 20px rgba(255,215,0,0.4)';
        t.style.color = '#fff';
        t.style.padding = '12px 24px';
        t.style.borderRadius = '24px';
        t.style.fontSize = '14px';
        t.style.fontWeight = 'bold';
        t.style.zIndex = '9999';
        t.style.pointerEvents = 'none';
        t.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(t);
    }
    t.innerText = msg;
    t.style.display = 'block';
    t.style.opacity = '1';
    clearTimeout(t._hideTimeout);
    t._hideTimeout = setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => { t.style.display = 'none'; }, 300);
    }, 2800);
}
window.showTutorialAlert = showTutorialAlert;

async function sendQuickReactionToCreator(reactionText) {
    closeCreatorReactionModal();
    if (typeof sendPlayerReaction === 'function') {
        await sendPlayerReaction(reactionText);
        showTutorialAlert("💌 Сообщение отправлено Создателю (РЫБе) в Telegram!");
    }
}
window.sendQuickReactionToCreator = sendQuickReactionToCreator;

function initShelterApp() {
    try {
        localStorage.removeItem('shelter_fire_unlocked');
    } catch(e){}
    syncFireHeroState();

    // Detect network and visited places
    if (typeof detectCurrentNetwork === 'function') {
        try { detectCurrentNetwork(); } catch(e){}
    }

    // Check user authentication & background sync cloud accounts
    let curUser = getCurrentUser();
    let accs = loadAccounts();
    if (curUser && accs[curUser.toLowerCase()]) {
        updateUserBadge();
        openScreen('root-menu', false);

        // Check if newcomer with 0 battles
        let u = accs[curUser.toLowerCase()];
        let st = (u && u.stats) ? u.stats : {};
        let totalB = (st.soloNormalWins || 0) + (st.soloNormalLosses || 0) + (st.soloSecretWins || 0) + (st.soloSecretLosses || 0) + (st.duoNormalWins || 0) + (st.duoNormalLosses || 0) + (st.duoSecretWins || 0) + (st.duoSecretLosses || 0);
        let hasGrad = u && u.achievements && u.achievements['tutorial_grad'];
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
            updateBananaMenuPeelsUI();
            checkYaroslavGiftPrompt();
            checkDashaGiftPrompt();
        }
    }).catch(e => console.warn("Init sync failed:", e));
}
window.initShelterApp = initShelterApp;

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initShelterApp);
} else {
    initShelterApp();
}

// --- SPECTATOR CONTROLS ---
function startWatchingBroadcast() {
    if (!window.currentActiveStream) {
        showTutorialAlert("Трансляция ещё не началась или уже завершилась!");
        return;
    }
    initAudio();
    window.spectatorMode = true;
    window.broadcastState = window.currentActiveStream;
    
    // Hide menus
    let ov = document.getElementById("overlay");
    if (ov) ov.style.display = "none";
    let mobUi = document.getElementById("mobile-ui");
    if (mobUi) mobUi.style.display = "none";
    let ctrlCont = document.getElementById("controls-container");
    if (ctrlCont) ctrlCont.style.display = "none";
    
    // Show spectator HUD
    let specHud = document.getElementById("spectator-hud");
    if (specHud) specHud.style.display = "block";
    let titleEl = document.getElementById("spectator-host-title");
    if (titleEl) {
        let hostName = window.currentActiveStream.host || 'РЫБа';
        titleEl.innerText = `🔴 В ЭФИРЕ: ${hostName}`;
    }

    gameState = "PLAYING";
}
window.startWatchingBroadcast = startWatchingBroadcast;

function stopWatchingBroadcast() {
    window.spectatorMode = false;
    window.broadcastState = null;
    
    let specHud = document.getElementById("spectator-hud");
    if (specHud) specHud.style.display = "none";
    
    let ov = document.getElementById("overlay");
    if (ov) ov.style.display = "block";
    
    gameState = "MENU";
    if (typeof openScreen === 'function') {
        openScreen('root-menu', false);
    }
}
window.stopWatchingBroadcast = stopWatchingBroadcast;

function onBroadcastEnded() {
    showTutorialAlert("🏆 Бой завершён! Трансляция окончена.");
    stopWatchingBroadcast();
}
window.onBroadcastEnded = onBroadcastEnded;

