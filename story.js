// --- STORY CAMPAIGN: PROLOGUE "FOREST" (ЛЕС) ---
// Authentic Silksong-like adventure mode crafted for Timur (РЫБа)

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (!r) r = 0;
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
    };
}

const STORY_CONFIG = {
    ARENA_W: 4200,
    ARENA_H: 400,
    FLOOR: 350,
    ALTAR_X: 2000,
    BENCH_X: 3600,
    START_X: 120
};

let storyState = {
    active: false,
    slotNum: 1,
    step: 'DARK_FADE', // DARK_FADE, WALK_PROMPT, JUMP_PROMPT, SEEK_ALTAR, LIGHTNING_WINDUP, LIGHTNING, TITLE_PAUSE, TITLE_1, TITLE_2, TITLE_FADE, WAKE_DEMON, SPAWN_GUARDIAN, GUARDIAN_FIGHT, GUARDIAN_DEFEATED, GO_TO_BENCH, BENCH_REST
    stepTimer: 0,
    blackAlpha: 1.0,
    title1Alpha: 0.0,
    title2Alpha: 0.0,
    lightningTimer: 0,
    flashAlpha: 0.0,
    altarActive: true,
    altarPulse: 0,
    jumpUnlocked: false,
    attackUnlocked: false,
    comboUnlocked: false,
    stanceUnlocked: false,
    isLyingDown: true,
    guardian: null,
    checkpoint: { x: 120, stance: 'WATER', hp: 5 },
    leaves: [],
    grassBlades: [],
    stars: [],
    campfireFlames: [],
    restMenuOpen: false
};

// Initialize decorative elements for Forest
function initForestScenery() {
    // 1. Stars in night sky
    storyState.stars = [];
    for (let i = 0; i < 90; i++) {
        storyState.stars.push({
            x: Math.random() * STORY_CONFIG.ARENA_W,
            y: Math.random() * (STORY_CONFIG.FLOOR - 120),
            size: 0.8 + Math.random() * 1.8,
            alpha: 0.3 + Math.random() * 0.7,
            twinkleSpeed: 0.02 + Math.random() * 0.04
        });
    }

    // 2. Swaying grass blades along the entire floor
    storyState.grassBlades = [];
    for (let x = 0; x < STORY_CONFIG.ARENA_W; x += 12) {
        let h = 14 + Math.sin(x * 0.1) * 8 + Math.random() * 8;
        storyState.grassBlades.push({
            x: x + (Math.random() * 4 - 2),
            h: h,
            lean: (Math.random() - 0.5) * 4,
            phase: Math.random() * Math.PI * 2,
            color: (Math.random() > 0.4) ? "#15803d" : "#166534"
        });
    }

    // 3. Drifting leaves blown by wind (green & autumn emerald)
    storyState.leaves = [];
    for (let i = 0; i < 35; i++) {
        storyState.leaves.push({
            x: Math.random() * STORY_CONFIG.ARENA_W,
            y: Math.random() * STORY_CONFIG.FLOOR,
            vx: 0.8 + Math.random() * 1.4,
            vy: 0.2 + Math.random() * 0.5,
            size: 4 + Math.random() * 5,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: 0.02 + Math.random() * 0.04,
            color: (Math.random() > 0.5) ? "#22c55e" : (Math.random() > 0.5 ? "#10b981" : "#84cc16")
        });
    }

    // 4. Campfire flame particles
    storyState.campfireFlames = [];
}

// Start Prologue Session
function initStoryPrologue(slotData) {
    window.isStoryMode = true;
    storyState.active = true;
    storyState.slotNum = slotData ? (slotData.slot || 1) : 1;
    storyState.title1Alpha = 0.0;
    storyState.title2Alpha = 0.0;
    storyState.lightningTimer = 0;
    storyState.flashAlpha = 0.0;
    storyState.guardian = null;
    storyState.restMenuOpen = false;

    initForestScenery();

    // Setup Arena
    ARENA_W = STORY_CONFIG.ARENA_W;
    ARENA_H = STORY_CONFIG.ARENA_H;
    FLOOR = STORY_CONFIG.FLOOR;
    camY = 0;
    platforms = [];

    // Reset game params BEFORE player creation so player position is never altered by battle resets
    players = [];
    resetGameParams();
    sharedHeals = 0;
    maxSharedHeals = 0;
    sharedHealPoints = 0;

    // Setup Player (Water 💧)
    numPlayers = 1;
    p1HeroSelection = 'WATER';

    function mapControlsToKeysObj(schemeObj) {
        let res = {};
        if (schemeObj && typeof schemeObj === 'object') {
            for (let k in schemeObj) {
                if (schemeObj[k]) res[k] = [schemeObj[k]];
            }
        }
        return res;
    }

    let p1Keys = mapControlsToKeysObj(userControls ? userControls.SCHEME_1 : DEFAULT_CONTROLS.SCHEME_1);
    if (p1InputType === 'KEYBOARD_2' || p1InputType === 'KEYBOARD_SHOOTER') {
        p1Keys = mapControlsToKeysObj(userControls ? userControls.SCHEME_2 : DEFAULT_CONTROLS.SCHEME_2);
    }

    let isSavedAtBench = slotData && (slotData.checkpointId === 'forest_bench_campfire' || slotData.checkpointId === 'bench_campfire');

    if (isSavedAtBench) {
        // RESUME DIRECTLY AT CAMPFIRE BENCH!
        storyState.step = 'BENCH_REST';
        storyState.stepTimer = 0;
        storyState.blackAlpha = 0.0;
        storyState.altarActive = false;
        storyState.jumpUnlocked = true;
        storyState.attackUnlocked = true;
        storyState.comboUnlocked = true;
        storyState.stanceUnlocked = true;
        storyState.isLyingDown = false;
        storyState.checkpoint = { x: STORY_CONFIG.BENCH_X - 10, stance: slotData.currentStance || 'LIGHT', hp: 5 };

        let p1 = createPlayer(1, 'WATER', p1Keys, p1InputType, STORY_CONFIG.BENCH_X - 10);
        p1.maxHp = 5;
        p1.hp = 5;
        p1.purpleHp = 0;
        p1.stance = slotData.currentStance || 'LIGHT';
        p1.abilities = { top: 'shuriken', mid: 'shuriken', bot: 'shuriken' };
        p1.x = STORY_CONFIG.BENCH_X - 10;
        p1.y = STORY_CONFIG.FLOOR - 24;
        p1.lastSafeX = p1.x;
        p1.lastSafeY = p1.y;
        p1.vx = 0;
        p1.vy = 0;
        applyBadgesToPlayer(p1, true);
        players.push(p1);

        camX = Math.max(0, Math.min(STORY_CONFIG.ARENA_W - GAME_WIDTH, p1.x - GAME_WIDTH * 0.35));
    } else {
        // FRESH PROLOGUE START (Lying down in the night forest at x = 120)
        storyState.step = 'DARK_FADE';
        storyState.stepTimer = 0;
        storyState.blackAlpha = 1.0;
        storyState.altarActive = true;
        storyState.jumpUnlocked = false;
        storyState.attackUnlocked = false;
        storyState.comboUnlocked = false;
        storyState.stanceUnlocked = false;
        storyState.isLyingDown = true;
        storyState.checkpoint = { x: STORY_CONFIG.START_X, stance: 'LIGHT', hp: 5 };

        let p1 = createPlayer(1, 'WATER', p1Keys, p1InputType, STORY_CONFIG.START_X);
        p1.maxHp = 5;
        p1.hp = 5;
        p1.purpleHp = 0;
        p1.stance = 'LIGHT';
        p1.abilities = { top: 'shuriken', mid: 'shuriken', bot: 'shuriken' };
        p1.x = STORY_CONFIG.START_X;
        p1.y = STORY_CONFIG.FLOOR - 14;
        p1.lastSafeX = p1.x;
        p1.lastSafeY = p1.y;
        p1.vx = 0;
        p1.vy = 0;
        applyBadgesToPlayer(p1, true);
        players.push(p1);

        camX = 0;
    }

    // Boss of arena is deactivated during story
    boss.hp = 0;
    boss.maxHp = 10;
    boss.x = -9999;
    boss.y = -9999;
    boss.state = "INACTIVE";

    // Setup touch UI visibility
    updateStoryTouchUIVisibility();
}
window.initStoryPrologue = initStoryPrologue;

// Configure Mobile Touch Controls based on unlocked abilities
function updateStoryTouchUIVisibility() {
    let mobUi = document.getElementById("mobile-ui");
    if (!mobUi || p1InputType !== 'TOUCH') return;

    mobUi.style.display = "flex";
    let btnJmp = document.getElementById("m-jmp");
    let btnAtk = document.getElementById("m-atk");
    let btnSpec = document.getElementById("m-spec");
    let btnStance = document.getElementById("m-stance");
    let btnDash = document.getElementById("m-dash");
    let btnHeal = document.getElementById("m-heal");

    if (btnJmp) btnJmp.style.display = storyState.jumpUnlocked ? "flex" : "none";
    if (btnAtk) btnAtk.style.display = storyState.attackUnlocked ? "flex" : "none";
    if (btnSpec) btnSpec.style.display = storyState.comboUnlocked ? "flex" : "none";
    if (btnStance) btnStance.style.display = storyState.stanceUnlocked ? "flex" : "none";
    if (btnDash) btnDash.style.display = "none";
    if (btnHeal) btnHeal.style.display = "none"; // Heal is disabled during prologue
}

// Get player-friendly control hint depending on selected layout
// Get player-friendly control hint depending on selected layout
function getControlPrompt(actionType) {
    let isTouch = (p1InputType === 'TOUCH');
    let isShooter = (p1InputType === 'KEYBOARD_2' || p1InputType === 'KEYBOARD_SHOOTER');
    let isGamepad = (p1InputType === 'GAMEPAD');

    if (actionType === 'MOVE') {
        if (isTouch) return "Двигайте джойстик для перемещения";
        if (isShooter) return "Клавиши [A] / [D] — движение";
        if (isGamepad) return "Стик / D-Pad — движение";
        return "Стрелочки [←] [→] — движение";
    }
    if (actionType === 'JUMP') {
        if (isTouch) return "Кнопка [JMP] — прыжок";
        if (isShooter) return "Клавиша [Пробел] — прыжок";
        if (isGamepad) return "Кнопка [A] — прыжок";
        return "Клавиша [Z] — прыжок";
    }
    if (actionType === 'ATTACK') {
        if (isTouch) return "Нажмите [ATK] — атака демоническим клинком";
        if (isShooter) return "Нажмите [ЛКМ] — атака демоническим клинком";
        if (isGamepad) return "Нажмите [X] — атака демоническим клинком";
        return "Нажмите [X] для атаки демоническим клинком";
    }
    if (actionType === 'COMBO') {
        if (isTouch) return "Комбо: [ATK] + [SPEC] — Водяная Капля";
        if (isShooter) return "Комбо: [ЛКМ] + [ПКМ] — Водяная Капля";
        if (isGamepad) return "Комбо: [X] + [RB] — Водяная Капля";
        return "Комбо: [X] + [F] — Водяная Капля";
    }
    if (actionType === 'STANCE') {
        if (isTouch) return "Нажмите [S], чтобы скрыть демона и вернуть Свет";
        if (isShooter) return "Нажмите [T], чтобы скрыть демона и вернуть Свет";
        if (isGamepad) return "Нажмите [LB], чтобы скрыть демона и вернуть Свет";
        return "Нажмите [S], чтобы скрыть демона и вернуть Свет";
    }
    return "";
}

function getDownPrompt() {
    let isTouch = (p1InputType === 'TOUCH');
    let isShooter = (p1InputType === 'KEYBOARD_2' || p1InputType === 'KEYBOARD_SHOOTER');
    let isGamepad = (p1InputType === 'GAMEPAD');
    if (isTouch) return "Джойстик [Вниз]";
    if (isShooter) return "Клавиша [S]";
    if (isGamepad) return "D-Pad [Вниз]";
    return "Стрелочка [↓]";
}

// Safe helper to clear key inputs without throwing if undefined or non-array
function clearKeyInput(keysObj, prop) {
    if (!keysObj || !keysObj[prop]) return;
    let val = keysObj[prop];
    if (typeof val === 'string') {
        keys[val] = false;
    } else if (Array.isArray(val)) {
        for (let k of val) {
            if (k) keys[k] = false;
        }
    }
}

// Trigger Altar Lightning Strike with dramatic suspense
function triggerAltarLightning(p1) {
    if (storyState.step === 'LIGHTNING_WINDUP' || storyState.step === 'LIGHTNING' || storyState.step.startsWith('TITLE')) return;
    storyState.step = 'LIGHTNING_WINDUP';
    storyState.stepTimer = 0;
    p1.vx = 0;
    p1.vy = 0;
    if (typeof playSound === 'function') playSound('wind');
}

// Main Story Mode Update Loop
function updateStoryMode() {
    if (!storyState.active) return;
    let p1 = players[0];
    if (!p1) return;

    storyState.stepTimer++;

    // Check [S] key press to hide Demon and return to Light after Guardian is defeated
    // (Checked FIRST before ability key clearing so it responds instantly!)
    if (storyState.step === 'GUARDIAN_DEFEATED') {
        let sPressed = (p1.keys && isKeyPressed(p1.keys.stance)) || keys['KeyS'] || keys['KeyT'] || keys['KeyV'] || 
                       (typeof touchInputs !== 'undefined' && touchInputs && (touchInputs.stance || touchInputs['S']));
        if (sPressed) {
            p1.stance = 'LIGHT';
            storyState.stanceUnlocked = true;
            storyState.step = 'GO_TO_BENCH';
            storyState.stepTimer = 0;
            updateStoryTouchUIVisibility();
            if (typeof playSound === 'function') playSound('lightChime');
            if (typeof triggerShake === 'function') triggerShake(3, 8);
        }
    }

    // 1. Filter Player Controls based on progressive unlock
    if (storyState.isLyingDown) {
        p1.vx = 0;
        p1.vy = 0;
        p1.y = STORY_CONFIG.FLOOR - 14;
        // Wake up when pressing horizontal move or jump
        let movePressed = (p1.keys && (isKeyPressed(p1.keys.left) || isKeyPressed(p1.keys.right))) || 
                          keys['ArrowLeft'] || keys['ArrowRight'] || keys['KeyA'] || keys['KeyD'] ||
                          (typeof touchInputs !== 'undefined' && touchInputs && (touchInputs.left || touchInputs.right));
        if (storyState.jumpUnlocked && ((p1.keys && isKeyPressed(p1.keys.jump)) || keys['KeyZ'] || keys['Space'] || (typeof touchInputs !== 'undefined' && touchInputs && touchInputs.jump))) {
            movePressed = true;
        }
        if (movePressed) {
            storyState.isLyingDown = false;
            p1.y = STORY_CONFIG.FLOOR - 50;
        }
    }

    // Progressive ability locks
    if (!storyState.jumpUnlocked) {
        clearKeyInput(p1.keys, 'jump');
        keys['KeyZ'] = false;
        keys['Space'] = false;
        keys['Comma'] = false;
        keys['ArrowUp'] = false;
        keys['KeyW'] = false;
        if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.jump = false;
    }
    if (!storyState.attackUnlocked) {
        clearKeyInput(p1.keys, 'attack');
        keys['KeyX'] = false;
        keys['MouseLeft'] = false;
        keys['Period'] = false;
        if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.atk = false;
    }
    if (!storyState.comboUnlocked) {
        clearKeyInput(p1.keys, 'special');
        clearKeyInput(p1.keys, 'dagger');
        keys['KeyF'] = false;
        keys['MouseRight'] = false;
        keys['Quote'] = false;
        if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.spec = false;
    }
    if (!storyState.stanceUnlocked) {
        clearKeyInput(p1.keys, 'stance');
        keys['KeyS'] = false;
        keys['KeyT'] = false;
        keys['KeyV'] = false;
        keys['Semicolon'] = false;
        if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.stance = false;
    }
    // Lock dash and heal during prologue until taught later
    clearKeyInput(p1.keys, 'dash');
    keys['KeyC'] = false;
    keys['KeyE'] = false;
    keys['Slash'] = false;
    if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.dash = false;

    clearKeyInput(p1.keys, 'heal');
    keys['KeyA'] = false;
    keys['KeyQ'] = false;
    keys['KeyK'] = false;
    if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.heal = false;

    // 2. State Machine Transitions (deliberate, slow, cinematic pacing)
    switch (storyState.step) {
        case 'DARK_FADE':
            // Very smooth fade-in over 180 frames (3.0 seconds)
            storyState.blackAlpha = Math.max(0, 1.0 - (storyState.stepTimer / 180));
            if (storyState.stepTimer >= 180) {
                storyState.blackAlpha = 0;
                storyState.step = 'WALK_PROMPT';
                storyState.stepTimer = 0;
            }
            break;

        case 'WALK_PROMPT':
            // Generous walking exploration time: 600 frames (10 seconds) or when player has explored forward (x > 650)
            if (storyState.stepTimer >= 600 || p1.x > 650) {
                storyState.jumpUnlocked = true;
                updateStoryTouchUIVisibility();
                storyState.step = 'JUMP_PROMPT';
                storyState.stepTimer = 0;
                if (typeof playSound === 'function') playSound('lightChime');
            }
            break;

        case 'JUMP_PROMPT':
            // Generous jumping exploration time: 450 frames (7.5 seconds) or when player has explored forward (x > 1200)
            if (storyState.stepTimer >= 450 || p1.x > 1200) {
                storyState.step = 'SEEK_ALTAR';
                storyState.stepTimer = 0;
            }
            if (Math.abs(p1.x - STORY_CONFIG.ALTAR_X) < 70) {
                triggerAltarLightning(p1);
            }
            break;

        case 'SEEK_ALTAR':
            // When approaching altar at x = 2000
            if (Math.abs(p1.x - STORY_CONFIG.ALTAR_X) < 70) {
                triggerAltarLightning(p1);
            }
            break;

        case 'LIGHTNING_WINDUP':
            p1.vx = 0;
            p1.vy = 0;
            storyState.altarPulse = (storyState.stepTimer / 50);
            if (storyState.stepTimer >= 50) {
                storyState.step = 'LIGHTNING';
                storyState.stepTimer = 0;
                storyState.lightningTimer = 60;
                storyState.flashAlpha = 1.0;
                if (typeof screenShake !== 'undefined') {
                    screenShake.timer = 55;
                    screenShake.mag = 26;
                }
                if (typeof playSound === 'function') playSound('parry');
            }
            break;

        case 'LIGHTNING':
            storyState.flashAlpha = Math.max(0, storyState.flashAlpha - 0.02);
            if (storyState.stepTimer >= 60) {
                storyState.step = 'TITLE_PAUSE';
                storyState.stepTimer = 0;
                storyState.blackAlpha = 1.0;
            }
            break;

        case 'TITLE_PAUSE':
            // Deep suspenseful black pause: 90 frames (1.5 seconds)
            if (storyState.stepTimer >= 90) {
                storyState.step = 'TITLE_1';
                storyState.stepTimer = 0;
                storyState.title1Alpha = 0.0;
            }
            break;

        case 'TITLE_1':
            // Smooth slow fade-in over 70 frames, then held until 160 frames (2.7 seconds)
            storyState.title1Alpha = Math.min(1.0, storyState.stepTimer / 70);
            if (storyState.stepTimer >= 160) {
                storyState.step = 'TITLE_2';
                storyState.stepTimer = 0;
                storyState.title2Alpha = 1.0;
                if (typeof screenShake !== 'undefined') {
                    screenShake.timer = 20;
                    screenShake.mag = 12;
                }
                if (typeof playSound === 'function') playSound('parry');
            }
            break;

        case 'TITLE_2':
            // Hold both titles suspended in the void for a full 3.0 seconds (180 frames)
            if (storyState.stepTimer >= 180) {
                storyState.step = 'TITLE_FADE';
                storyState.stepTimer = 0;
            }
            break;

        case 'TITLE_FADE':
            // Very slow, respectful fade out over 120 frames (2.0 seconds)
            storyState.title1Alpha = Math.max(0, storyState.title1Alpha - 0.015);
            storyState.title2Alpha = Math.max(0, storyState.title2Alpha - 0.015);
            storyState.blackAlpha = Math.max(0, storyState.blackAlpha - 0.015);

            if (storyState.title1Alpha <= 0 && storyState.title2Alpha <= 0 && storyState.blackAlpha <= 0) {
                storyState.blackAlpha = 0;
                storyState.step = 'WAKE_DEMON';
                storyState.stepTimer = 0;
                storyState.altarActive = false; // Violet glow extinguished
                p1.stance = 'DEMON'; // Awaken in Demon Stance!
                p1.hp = 5;
                p1.maxHp = 5;
                p1.purpleHp = 0; // Pure 5 base HP with demonic purple styling, no extra phantom purple masks!
                storyState.attackUnlocked = true;
                storyState.checkpoint = { x: STORY_CONFIG.ALTAR_X - 20, stance: 'DEMON', hp: 5 };
                updateStoryTouchUIVisibility();
                if (typeof playSound === 'function') playSound('demonRoar');
            }
            break;

        case 'WAKE_DEMON':
            // Generous practice window in Demon form: 500 frames (8.3 seconds)
            // Player walks, jumps, slashes with [X] in demon form, realizes they got the Demon!
            if (storyState.stepTimer >= 500) {
                storyState.step = 'SPAWN_GUARDIAN';
                storyState.stepTimer = 0;
                spawnWaterGuardian();
            }
            break;

        case 'SPAWN_GUARDIAN':
            if (storyState.guardian) {
                updateWaterGuardian();
                if (storyState.stepTimer >= 120) {
                    storyState.step = 'GUARDIAN_FIGHT';
                    storyState.stepTimer = 0;
                    storyState.comboUnlocked = true;
                    updateStoryTouchUIVisibility();
                }
            }
            break;

        case 'GUARDIAN_FIGHT':
            if (storyState.guardian) {
                updateWaterGuardian();
                if (storyState.guardian.hp <= 0) {
                    storyState.guardian = null;
                    storyState.step = 'GUARDIAN_DEFEATED';
                    storyState.stepTimer = 0;
                    if (typeof playSound === 'function') playSound('parry');
                }
            }
            break;

        case 'GUARDIAN_DEFEATED':
            // Handled at top of updateStoryMode when S is pressed
            break;

        case 'GO_TO_BENCH':
            // Player approaches campfire bench at x = STORY_CONFIG.BENCH_X
            if (Math.abs(p1.x - STORY_CONFIG.BENCH_X) < 75) {
                // Timur explicitly requested: (присесть на скамейку - вниз, пишется подсказка)
                let downPressed = (p1.keys && isKeyPressed(p1.keys.down)) || keys['ArrowDown'] || 
                                  (p1InputType === 'KEYBOARD_2' && keys['KeyS']) ||
                                  (typeof touchInputs !== 'undefined' && touchInputs && touchInputs.down);
                if (downPressed && storyState.stepTimer > 20) {
                    restAtCampfire();
                }
            }
            break;

        case 'BENCH_REST':
            p1.vx = 0;
            p1.vy = 0;
            p1.x = STORY_CONFIG.BENCH_X - 10;
            p1.y = STORY_CONFIG.FLOOR - 24;

            // Debounce so sitting down key does not immediately stand the player back up!
            if (storyState.stepTimer > 25) {
                let standUp = false;
                for (let k in keys) {
                    if (keys[k] === true && k !== 'Escape') {
                        standUp = true;
                        break;
                    }
                }
                if (!standUp && typeof touchInputs !== 'undefined' && touchInputs) {
                    for (let tk in touchInputs) {
                        if (touchInputs[tk] === true) {
                            standUp = true;
                            break;
                        }
                    }
                }
                if (!standUp && typeof navigator !== 'undefined' && navigator.getGamepads) {
                    let gps = navigator.getGamepads();
                    if (gps && gps[0]) {
                        let gp = gps[0];
                        if (gp.buttons && gp.buttons.some(b => b && b.pressed)) standUp = true;
                        if (gp.axes && gp.axes.some(a => Math.abs(a) > 0.4)) standUp = true;
                    }
                }

                if (standUp) {
                    for (let k in keys) keys[k] = false;
                    if (typeof touchInputs !== 'undefined' && touchInputs) {
                        for (let tk in touchInputs) touchInputs[tk] = false;
                    }
                    storyState.step = 'GO_TO_BENCH';
                    storyState.stepTimer = 0;
                    p1.x = STORY_CONFIG.BENCH_X - 45;
                    p1.y = STORY_CONFIG.FLOOR - 50;
                    p1.vx = 0;
                    p1.vy = 0;
                    if (typeof playSound === 'function') playSound('jump');
                }
            }
            break;
    }

    // Lock controls during cutscenes
    if (storyState.step === 'LIGHTNING_WINDUP' || storyState.step === 'LIGHTNING' || storyState.step.startsWith('TITLE')) {
        p1.vx = 0;
        p1.vy = 0;
        clearKeyInput(p1.keys, 'left');
        clearKeyInput(p1.keys, 'right');
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
        keys['KeyA'] = false;
        keys['KeyD'] = false;
        if (typeof touchInputs !== 'undefined' && touchInputs) {
            touchInputs.left = false;
            touchInputs.right = false;
        }
    }

    // 3. Update Normal Player Physics & Actions
    updatePlayers();

    // 4. Update Forest Atmospheric Effects
    updateForestAtmosphere();

    // 5. Smooth Camera Tracking
    let targetCamX = Math.max(0, Math.min(STORY_CONFIG.ARENA_W - GAME_WIDTH, p1.x - GAME_WIDTH * 0.35));
    camX += (targetCamX - camX) * 0.08;
    camY = 0;

    // 6. Player Fall/Death Respawn at Checkpoint
    if (p1.hp <= 0) {
        respawnPlayerAtStoryCheckpoint();
    }
}
window.updateStoryMode = updateStoryMode;

// Water Guardian Mini-Boss
function spawnWaterGuardian() {
    storyState.guardian = {
        x: STORY_CONFIG.ALTAR_X + 260,
        y: STORY_CONFIG.FLOOR - 65,
        w: 36,
        h: 65,
        hp: 10,
        maxHp: 10,
        facingRight: false,
        state: 'INTRO',
        timer: 120,
        dialogue: "«Я должен уничтожить демона!»",
        dialogueTimer: 180,
        waterProjectiles: [],
        hitFlash: 0
    };
    if (typeof playSound === 'function') playSound('shuriken');
}

function updateWaterGuardian() {
    let g = storyState.guardian;
    if (!g) return;
    let p = players[0];
    if (!p) return;

    if (g.hitFlash > 0) g.hitFlash--;
    if (g.dialogueTimer > 0) g.dialogueTimer--;

    g.facingRight = (p.x > g.x);
    g.timer--;

    // Update projectiles
    if (g.waterProjectiles) {
        for (let i = g.waterProjectiles.length - 1; i >= 0; i--) {
            let pr = g.waterProjectiles[i];
            pr.x += pr.vx;
            pr.y += pr.vy;
            pr.life--;
            // Hit player
            if (Math.abs(pr.x - (p.x + 15)) < 20 && Math.abs(pr.y - (p.y + 25)) < 30 && p.invuln <= 0) {
                p.hp = Math.max(0, p.hp - 1);
                p.invuln = 45;
                if (typeof triggerVibration === 'function') triggerVibration('damage');
                g.waterProjectiles.splice(i, 1);
                continue;
            }
            if (pr.life <= 0 || pr.x < 0 || pr.x > STORY_CONFIG.ARENA_W) {
                g.waterProjectiles.splice(i, 1);
            }
        }
    }

    // Check hit by player attacks
    if (p.attackTimer > 0 && Math.abs((p.x + (p.facingRight ? 35 : -35)) - g.x) < 55 && Math.abs(p.y - g.y) < 60) {
        if (g.hitFlash <= 0) {
            g.hp -= (p.stance === 'DEMON' ? 2 : 1);
            g.hitFlash = 15;
            g.x += (p.facingRight ? 20 : -20);
            if (typeof playSound === 'function') playSound('hit');
            if (typeof triggerVibration === 'function') triggerVibration('hit');
        }
    }

    // Check hit by player projectiles/daggers (X+F combo)
    if (typeof playerDaggers !== 'undefined' && playerDaggers.length > 0) {
        for (let i = playerDaggers.length - 1; i >= 0; i--) {
            let pd = playerDaggers[i];
            if (Math.abs(pd.x - g.x) < 35 && Math.abs(pd.y - (g.y + 30)) < 45) {
                g.hp -= 2.5;
                g.hitFlash = 15;
                if (typeof playSound === 'function') playSound('hit');
                playerDaggers.splice(i, 1);
            }
        }
    }

    if (g.state === 'INTRO') {
        if (g.timer <= 0) {
            g.state = 'PAUSE';
            g.timer = 60;
        }
        return;
    }

    // Guardian Combat State Machine
    if (g.timer <= 0) {
        let dist = Math.abs(p.x - g.x);
        if (g.state === 'PAUSE') {
            if (dist > 300) {
                g.state = 'TELEPORT';
                g.timer = 40;
            } else if (dist > 140) {
                g.state = 'WALK';
                g.timer = 80;
            } else {
                g.state = 'SLASH_WARN';
                g.timer = 30; // 0.5s visual warning before strike!
            }
        } else if (g.state === 'WALK') {
            g.state = 'SLASH_WARN';
            g.timer = 30;
        } else if (g.state === 'SLASH_WARN') {
            // Execute slash
            g.state = 'SLASH';
            g.timer = 20;
            if (dist < 65 && p.invuln <= 0) {
                p.hp = Math.max(0, p.hp - 1);
                p.invuln = 45;
                if (typeof triggerVibration === 'function') triggerVibration('damage');
            }
        } else if (g.state === 'SLASH') {
            g.state = 'SHOOT';
            g.timer = 30;
            // Shoot 2 water bubbles
            let dir = g.facingRight ? 1 : -1;
            g.waterProjectiles.push({ x: g.x, y: g.y + 20, vx: dir * 4.5, vy: -0.5, life: 120 });
            g.waterProjectiles.push({ x: g.x, y: g.y + 35, vx: dir * 5.2, vy: 0.5, life: 120 });
        } else if (g.state === 'SHOOT') {
            g.state = 'PAUSE';
            g.timer = 90; // Noticeable pause between attacks!
        } else if (g.state === 'TELEPORT') {
            // Teleport behind player
            let offset = (p.facingRight ? -80 : 80);
            g.x = Math.max(STORY_CONFIG.ALTAR_X - 100, Math.min(STORY_CONFIG.ALTAR_X + 450, p.x + offset));
            g.state = 'PAUSE';
            g.timer = 50;
        }
    }

    // Movement during WALK
    if (g.state === 'WALK') {
        let dir = (p.x > g.x) ? 1 : -1;
        g.x += dir * 1.8;
    }
}

// Respawn at Checkpoint
function respawnPlayerAtStoryCheckpoint() {
    let p = players[0];
    if (!p) return;
    p.hp = storyState.checkpoint.hp || 5;
    p.x = storyState.checkpoint.x || STORY_CONFIG.START_X;
    p.y = STORY_CONFIG.FLOOR - 50;
    p.vx = 0;
    p.vy = 0;
    p.invuln = 60;
    p.stance = storyState.checkpoint.stance || 'WATER';

    // If died during Guardian, reset Guardian HP
    if (storyState.guardian) {
        storyState.guardian.hp = storyState.guardian.maxHp;
        storyState.guardian.x = STORY_CONFIG.ALTAR_X + 260;
        storyState.guardian.state = 'PAUSE';
        storyState.guardian.timer = 60;
    }
}

// Rest at Campfire Bench
function restAtCampfire() {
    let p = players[0];
    if (!p) return;

    storyState.restMenuOpen = false;
    storyState.step = 'BENCH_REST';
    storyState.stepTimer = 0;
    p.hp = 5;
    p.maxHp = 5;
    p.purpleHp = 0;
    p.vx = 0;
    p.vy = 0;
    p.x = STORY_CONFIG.BENCH_X - 10;
    p.y = STORY_CONFIG.FLOOR - 24;
    sharedHeals = 0;
    maxSharedHeals = 0;
    sharedHealPoints = 0;
    storyState.checkpoint = { x: STORY_CONFIG.BENCH_X - 10, stance: p.stance || 'LIGHT', hp: 5 };

    // Auto-save progress to Firebase and LocalStorage!
    let curUser = getCurrentUser();
    let slotData = {
        slot: storyState.slotNum,
        location: "Лес (Костер у опушки)",
        locationSub: "Отдых у теплого огня",
        hero: "WATER",
        maxHp: 5,
        currentHp: 5,
        demonUnlocked: true,
        stealthUnlocked: true,
        currentStance: p.stance || "LIGHT",
        checkpointId: "forest_bench_campfire",
        updatedAt: Date.now(),
        version: GAME_VERSION
    };
    if (typeof saveStorySlot === 'function') {
        saveStorySlot(storyState.slotNum, slotData, curUser);
    }
    if (typeof playSound === 'function') playSound('lightChime');
}
window.restAtCampfire = restAtCampfire;

function closeCampfireModal() {
    storyState.restMenuOpen = false;
    storyState.step = 'GO_TO_BENCH';
    let modal = document.getElementById("story-campfire-modal");
    if (modal) modal.style.display = "none";
}
window.closeCampfireModal = closeCampfireModal;

// Update Forest Weather & Leaves
function updateForestAtmosphere() {
    let wind = Math.sin(Date.now() * 0.002) * 0.8;
    for (let leaf of storyState.leaves) {
        leaf.x += leaf.vx + wind;
        leaf.y += leaf.vy + Math.sin(Date.now() * 0.003 + leaf.x) * 0.3;
        leaf.rot += leaf.rotSpeed;
        if (leaf.x > STORY_CONFIG.ARENA_W + 50) {
            leaf.x = -50;
            leaf.y = Math.random() * STORY_CONFIG.FLOOR;
        }
        if (leaf.y > STORY_CONFIG.FLOOR + 20) {
            leaf.y = -20;
            leaf.x = Math.random() * STORY_CONFIG.ARENA_W;
        }
    }

    // Campfire sparks from logs at BENCH_X + 65
    if (Math.random() < 0.45) {
        storyState.campfireFlames.push({
            x: STORY_CONFIG.BENCH_X + 65 + (Math.random() * 16 - 8),
            y: STORY_CONFIG.FLOOR - 12,
            vx: (Math.random() - 0.5) * 0.9 + 0.3,
            vy: -1.2 - Math.random() * 1.8,
            life: 35 + Math.random() * 25,
            maxLife: 60,
            color: (Math.random() > 0.6) ? "#f59e0b" : (Math.random() > 0.3 ? "#ef4444" : "#fbbf24")
        });
    }
    for (let i = storyState.campfireFlames.length - 1; i >= 0; i--) {
        let f = storyState.campfireFlames[i];
        f.x += f.vx;
        f.y += f.vy;
        f.life--;
        if (f.life <= 0) storyState.campfireFlames.splice(i, 1);
    }
}

// --- RENDERING STORY PROLOGUE ---
function drawStoryMode() {
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Screen Shake if active
    if (typeof screenShake !== 'undefined' && screenShake.timer > 0) {
        let sx = (Math.random() - 0.5) * screenShake.mag;
        let sy = (Math.random() - 0.5) * screenShake.mag;
        ctx.translate(sx, sy);
        screenShake.timer--;
    }

    // Translate Camera
    ctx.translate(-camX, -camY);

    // 1. Night Sky Background (Moonlit gradient)
    let skyGrad = ctx.createLinearGradient(camX, 0, camX, STORY_CONFIG.FLOOR);
    skyGrad.addColorStop(0, "#020617");
    skyGrad.addColorStop(0.65, "#0b152e");
    skyGrad.addColorStop(1, "#071026");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(camX, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Stars
    ctx.save();
    for (let s of storyState.stars) {
        let a = s.alpha + Math.sin(Date.now() * s.twinkleSpeed) * 0.25;
        ctx.fillStyle = `rgba(240, 248, 255, ${Math.max(0.1, a)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // 3. The Moon (Silver with radiant glow)
    let moonX = camX + 420;
    let moonY = 85;
    ctx.save();
    let moonGlow = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 110);
    moonGlow.addColorStop(0, "rgba(224, 242, 254, 0.45)");
    moonGlow.addColorStop(0.5, "rgba(186, 230, 253, 0.15)");
    moonGlow.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Distant Forest Trees Silhouette (Parallax)
    drawForestTrees(camX);

    // 5. Ground Floor
    ctx.fillStyle = "#070b14";
    ctx.fillRect(camX, STORY_CONFIG.FLOOR, GAME_WIDTH, GAME_HEIGHT - STORY_CONFIG.FLOOR + 100);
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(camX, STORY_CONFIG.FLOOR);
    ctx.lineTo(camX + GAME_WIDTH, STORY_CONFIG.FLOOR);
    ctx.stroke();

    // 6. Swaying Grass Blades
    ctx.save();
    let t = Date.now() * 0.003;
    for (let g of storyState.grassBlades) {
        if (g.x < camX - 20 || g.x > camX + GAME_WIDTH + 20) continue;
        let windLean = Math.sin(t + g.phase) * 5 + g.lean;
        ctx.strokeStyle = g.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(g.x, STORY_CONFIG.FLOOR);
        ctx.quadraticCurveTo(g.x + windLean * 0.5, STORY_CONFIG.FLOOR - g.h * 0.5, g.x + windLean, STORY_CONFIG.FLOOR - g.h);
        ctx.stroke();
    }
    ctx.restore();

    // 7. Ancient Altar with Violet Light (at x = 1100)
    drawStoryAltar(STORY_CONFIG.ALTAR_X);

    // 8. Campfire & Resting Bench (at x = 2300)
    drawStoryCampfireAndBench(STORY_CONFIG.BENCH_X);

    // 9. Water Guardian Mini-Boss
    if (storyState.guardian) {
        drawStoryGuardianObj(storyState.guardian);
    }

    // 10. Player (Water 💧)
    let p = players[0];
    if (p) {
        if (storyState.isLyingDown) {
            // Draw Water resting/sleeping horizontally on the grass
            drawLyingWaterPlayer(p.x, STORY_CONFIG.FLOOR);
        } else if (storyState.step === 'BENCH_REST') {
            // Draw Water sitting peacefully on the wooden bench looking at the fire!
            drawSittingWaterPlayer(STORY_CONFIG.BENCH_X, STORY_CONFIG.FLOOR, p.stance);
        } else {
            drawPlayer(p);
        }
    }

    // 11. Flying Forest Leaves (No dust!)
    ctx.save();
    for (let l of storyState.leaves) {
        if (l.x < camX - 20 || l.x > camX + GAME_WIDTH + 20) continue;
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, l.size, l.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();

    // 12. Lightning Strike VFX
    if (storyState.step === 'LIGHTNING' && storyState.lightningTimer > 0) {
        drawVioletLightning(STORY_CONFIG.ALTAR_X);
    }

    // Reset translate for screen-space HUD and titles
    ctx.restore();

    // 13. Full Screen Violet Flash
    if (storyState.flashAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(168, 85, 247, ${storyState.flashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // 14. Black Screen & Cinematic Titles
    if (storyState.blackAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${storyState.blackAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title 1: "Сила демона получена" (smooth white fade)
        if (storyState.title1Alpha > 0) {
            ctx.textAlign = "center";
            ctx.fillStyle = `rgba(255, 255, 255, ${storyState.title1Alpha})`;
            ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
            ctx.shadowColor = "#a855f7";
            ctx.shadowBlur = 15;
            ctx.fillText("Сила демона получена", canvas.width / 2, canvas.height / 2 - 20);
        }

        // Title 2: "Скрывайте это" (sharp sudden appearance)
        if (storyState.title2Alpha > 0) {
            ctx.textAlign = "center";
            ctx.fillStyle = `rgba(239, 68, 68, ${storyState.title2Alpha})`;
            ctx.font = "900 28px 'Segoe UI', Arial, sans-serif";
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 20;
            ctx.fillText("Скрывайте это", canvas.width / 2, canvas.height / 2 + 30);
        }
        ctx.restore();
    }

    // 15. Health Masks (Lives) - rendered in screen space when not in cutscene titles
    if (!storyState.step.startsWith('TITLE') && !storyState.step.startsWith('LIGHTNING') && storyState.blackAlpha < 0.8 && typeof drawMasks === 'function') {
        drawMasks();
    }

    // 16. Screen-Space Story HUD & Objective Prompts - always visible on top!
    drawStoryScreenHUD();
}
window.drawStoryMode = drawStoryMode;

// Draw Forest Trees Silhouette
function drawForestTrees(cx) {
    ctx.save();
    ctx.fillStyle = "#091224";
    // Tree trunks and foliage clumps
    for (let tx = 0; tx < STORY_CONFIG.ARENA_W; tx += 180) {
        if (tx < cx - 100 || tx > cx + GAME_WIDTH + 100) continue;
        let trunkW = 28 + (tx % 20);
        let h = 180 + (tx % 60);
        ctx.fillRect(tx, STORY_CONFIG.FLOOR - h, trunkW, h);
        // Foliage canopy
        ctx.beginPath();
        ctx.arc(tx + trunkW / 2, STORY_CONFIG.FLOOR - h, 50 + (tx % 25), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Draw Water lying down on grass
function drawLyingWaterPlayer(px, floorY) {
    ctx.save();
    ctx.translate(px, floorY - 14);
    // Dark water blue cloak
    ctx.fillStyle = "#2255cc";
    ctx.beginPath();
    ctx.roundRect(0, 0, 48, 14, 6);
    ctx.fill();

    // Head
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(6, 7, 7, 0, Math.PI * 2);
    ctx.fill();

    // Cyan cloth trims
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(14, 7);
    ctx.lineTo(44, 7);
    ctx.stroke();
    ctx.restore();
}

// Draw Water sitting comfortably on the wooden bench by the campfire
function drawSittingWaterPlayer(bx, floorY, stance) {
    ctx.save();
    let isDemon = (stance === 'DEMON');
    let breathe = Math.sin(Date.now() * 0.003) * 1.2;
    let sitX = bx - 10;
    let sitY = floorY - 24; // Bench seat level

    // Warm firelight reflection from the campfire at bx + 65
    let firePulse = 0.5 + 0.3 * Math.sin(Date.now() * 0.009);
    let fireGlow = ctx.createRadialGradient(sitX + 15, sitY - 10, 4, sitX + 15, sitY - 10, 36);
    fireGlow.addColorStop(0, `rgba(245, 158, 11, ${firePulse * 0.45})`);
    fireGlow.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = fireGlow;
    ctx.beginPath();
    ctx.arc(sitX + 15, sitY - 10, 36, 0, Math.PI * 2);
    ctx.fill();

    // 1. Draped Folded Cloak on bench seat
    let cloakColor = isDemon ? "#25003b" : "#2255cc";
    let trimColor = isDemon ? "#c084fc" : "#00ffff";
    let bodyColor = isDemon ? "#3a0055" : "#00e5ff";

    ctx.fillStyle = cloakColor;
    ctx.beginPath();
    ctx.roundRect(sitX - 10, sitY - 20 + breathe, 26, 20, [8, 8, 4, 4]);
    ctx.fill();

    // Cloak trim
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sitX - 8, sitY + breathe);
    ctx.lineTo(sitX + 14, sitY + breathe);
    ctx.stroke();

    // 2. Small feet resting below bench seat
    ctx.fillStyle = isDemon ? "#1a0026" : "#172554";
    ctx.beginPath();
    ctx.roundRect(sitX + 2, sitY + 2, 7, 10, 3);
    ctx.roundRect(sitX + 9, sitY + 2, 7, 10, 3);
    ctx.fill();

    // 3. Cute Droplet Head tilted gently towards the crackling fire
    ctx.fillStyle = bodyColor;
    ctx.shadowColor = trimColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sitX + 6, sitY - 26 + breathe, 9, 0, Math.PI * 2);
    ctx.fill();

    // Droplet tip
    ctx.beginPath();
    ctx.moveTo(sitX + 1, sitY - 32 + breathe);
    ctx.lineTo(sitX + 8, sitY - 37 + breathe);
    ctx.lineTo(sitX + 12, sitY - 29 + breathe);
    ctx.closePath();
    ctx.fill();

    // 4. Peaceful eyes gazing at the embers
    ctx.fillStyle = isDemon ? "#f3e8ff" : "#ffffff";
    ctx.beginPath();
    ctx.ellipse(sitX + 9, sitY - 26 + breathe, 2, 1, 0.2, 0, Math.PI * 2);
    ctx.fill();

    if (isDemon) {
        // Small purple demonic horn aura
        ctx.strokeStyle = "rgba(192, 132, 252, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sitX + 3, sitY - 34 + breathe);
        ctx.lineTo(sitX, sitY - 41 + breathe);
        ctx.moveTo(sitX + 9, sitY - 34 + breathe);
        ctx.lineTo(sitX + 12, sitY - 42 + breathe);
        ctx.stroke();
    }

    ctx.restore();
}

// Draw Ancient Altar
function drawStoryAltar(ax) {
    ctx.save();
    let floorY = STORY_CONFIG.FLOOR;

    // Stone Steps & Pedestal
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ax - 40, floorY - 14, 80, 14, 3);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(ax - 28, floorY - 32, 56, 18, 4);
    ctx.fill();
    ctx.stroke();

    if (storyState.altarActive) {
        // Mysterious Violet Glow
        let t = Date.now() * 0.004;
        let isWindup = (storyState.step === 'LIGHTNING_WINDUP');
        let pulse = isWindup ? (0.85 + 0.45 * Math.sin(Date.now() * 0.04)) : (0.5 + 0.3 * Math.sin(t));
        let glowRadius = isWindup ? 110 : 75;
        let grad = ctx.createRadialGradient(ax, floorY - 55, 6, ax, floorY - 55, glowRadius);
        grad.addColorStop(0, `rgba(216, 180, 254, ${pulse * 0.95})`);
        grad.addColorStop(0.5, `rgba(168, 85, 247, ${pulse * 0.5})`);
        grad.addColorStop(1, "rgba(88, 28, 135, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ax, floorY - 55, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Hovering Violet Demonic Relic
        let relicY = floorY - 55 + (isWindup ? (Math.random() * 4 - 2) : (Math.sin(t * 1.5) * 6));
        ctx.fillStyle = isWindup ? "#f3e8ff" : "#c084fc";
        ctx.shadowColor = "#d8b4fe";
        ctx.shadowBlur = isWindup ? 30 : 18;
        ctx.beginPath();
        ctx.moveTo(ax, relicY - 14);
        ctx.lineTo(ax + 10, relicY);
        ctx.lineTo(ax, relicY + 14);
        ctx.lineTo(ax - 10, relicY);
        ctx.closePath();
        ctx.fill();

        if (isWindup) {
            ctx.strokeStyle = "rgba(233, 213, 255, 0.8)";
            ctx.lineWidth = 1.5;
            for (let s = 0; s < 3; s++) {
                let sx = ax + (Math.random() - 0.5) * 40;
                let sy = relicY + (Math.random() - 0.5) * 35;
                ctx.beginPath();
                ctx.moveTo(ax, relicY);
                ctx.lineTo(sx, sy);
                ctx.stroke();
            }
        }
    } else {
        // Dormant extinguished altar
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(ax, floorY - 40, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Draw Violet Lightning Strike
function drawVioletLightning(targetX) {
    ctx.save();
    let startY = 0;
    let endY = STORY_CONFIG.FLOOR;
    let curX = targetX + (Math.random() * 20 - 10);

    ctx.strokeStyle = "rgba(192, 132, 252, 0.45)";
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(curX, startY);
    for (let y = startY; y < endY; y += 30) {
        curX += (Math.random() - 0.5) * 35;
        ctx.lineTo(curX, y);
    }
    ctx.lineTo(targetX, endY);
    ctx.stroke();

    // Sharp white-violet core
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#c084fc";
    ctx.shadowBlur = 25;
    ctx.stroke();
    ctx.restore();
}

// Draw Water Guardian Mini-Boss
function drawStoryGuardianObj(g) {
    ctx.save();
    let gx = g.x;
    let gy = g.y;

    if (g.hitFlash > 0) {
        ctx.fillStyle = "#ffffff";
    } else {
        ctx.fillStyle = "#0284c7"; // Azure water robe
    }

    // Tall Silhouette
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(gx - g.w / 2, gy, g.w, g.h, 8);
    ctx.fill();

    // Head with water veil
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(gx, gy - 8, 12, 0, Math.PI * 2);
    ctx.fill();

    // Water slash telegraph aura
    if (g.state === 'SLASH_WARN') {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gx, gy + 30, 45, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Health Bar above Guardian
    let barW = 60;
    let hpW = Math.max(0, (g.hp / g.maxHp) * barW);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(gx - barW / 2, gy - 32, barW, 6);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(gx - barW / 2, gy - 32, hpW, 6);

    // Dialogue Bubble
    if (g.dialogueTimer > 0) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(gx - 110, gy - 62, 220, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#e0f2fe";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(g.dialogue, gx, gy - 46);
    }

    // Water projectiles
    if (g.waterProjectiles) {
        for (let pr of g.waterProjectiles) {
            ctx.fillStyle = "#38bdf8";
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(pr.x, pr.y, 7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// Draw Campfire and Resting Bench
function drawStoryCampfireAndBench(bx) {
    ctx.save();
    let floorY = STORY_CONFIG.FLOOR;

    // 1. Cozy Wooden Bench
    ctx.fillStyle = "#78350f";
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    // Bench seat
    ctx.fillRect(bx - 35, floorY - 24, 70, 7);
    // Bench backrest
    ctx.fillRect(bx - 35, floorY - 42, 70, 7);
    // Legs
    ctx.fillRect(bx - 32, floorY - 24, 6, 24);
    ctx.fillRect(bx + 26, floorY - 24, 6, 24);
    ctx.fillRect(bx - 32, floorY - 42, 6, 18);
    ctx.fillRect(bx + 26, floorY - 42, 6, 18);

    // 2. Campfire with Stones & Wood Logs
    let fx = bx + 65;
    ctx.fillStyle = "#334155";
    for (let i = -16; i <= 16; i += 8) {
        ctx.beginPath();
        ctx.arc(fx + i, floorY - 3, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    // Fire Wood Logs
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(fx - 14, floorY - 2); ctx.lineTo(fx + 14, floorY - 12);
    ctx.moveTo(fx + 14, floorY - 2); ctx.lineTo(fx - 14, floorY - 12);
    ctx.stroke();

    // Fire Glow
    let firePulse = 0.6 + 0.3 * Math.sin(Date.now() * 0.008);
    let fGrad = ctx.createRadialGradient(fx, floorY - 18, 5, fx, floorY - 18, 65);
    fGrad.addColorStop(0, `rgba(245, 158, 11, ${firePulse * 0.8})`);
    fGrad.addColorStop(0.5, `rgba(239, 68, 68, ${firePulse * 0.4})`);
    fGrad.addColorStop(1, "rgba(180, 83, 9, 0)");
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.arc(fx, floorY - 18, 65, 0, Math.PI * 2);
    ctx.fill();

    // Campfire Spark Particles
    for (let spark of storyState.campfireFlames) {
        ctx.fillStyle = spark.color;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Draw Screen-Space Story Prompts and Objectives ("Таблички")
function drawStoryScreenHUD() {
    if (storyState.step === 'LIGHTNING_WINDUP' || storyState.step === 'LIGHTNING' || storyState.step.startsWith('TITLE')) return;

    let promptText = "";
    let p = players[0];

    switch (storyState.step) {
        case 'DARK_FADE':
        case 'WALK_PROMPT':
            if (storyState.isLyingDown) {
                promptText = `✦ ${getControlPrompt('MOVE')} (нажмите, чтобы подняться)`;
            } else {
                promptText = `✦ ${getControlPrompt('MOVE')} • Исследуйте лес`;
            }
            break;
        case 'JUMP_PROMPT':
            promptText = `✦ ${getControlPrompt('JUMP')} • Попробуйте прыгнуть`;
            break;
        case 'SEEK_ALTAR':
            promptText = "✦ Идите направо вглубь леса → (найдите фиолетовое свечение)";
            break;
        case 'WAKE_DEMON':
            promptText = `✦ Вы в форме Демона! ${getControlPrompt('ATTACK')}`;
            break;
        case 'SPAWN_GUARDIAN':
        case 'GUARDIAN_FIGHT':
            promptText = `⚔️ ${getControlPrompt('ATTACK')}  |  ${getControlPrompt('COMBO')}`;
            break;
        case 'GUARDIAN_DEFEATED':
            promptText = `✦ ${getControlPrompt('STANCE')}`;
            break;
        case 'GO_TO_BENCH':
            if (p && Math.abs(p.x - STORY_CONFIG.BENCH_X) < 75) {
                promptText = `✦ ${getDownPrompt()} — присесть на скамейку у костра`;
            } else {
                promptText = "✦ Демон скрыт. Пройдите направо вглубь леса к костру →";
            }
            break;
        case 'BENCH_REST':
            if (storyState.stepTimer < 240) {
                promptText = "✦ Отдых у костра (Сохранено ✓) • [Любая клавиша] — Встать  |  [Esc] — Меню сохранений";
            }
            break;
    }

    if (promptText) {
        ctx.save();
        // Placed at BOTTOM CENTER (under arena floor, completely clear of top HP masks)
        let bannerW = Math.min(680, canvas.width - 40);
        let bannerH = 34;
        let bx = canvas.width / 2 - bannerW / 2;
        let by = canvas.height - 42;
        ctx.fillStyle = "rgba(10, 18, 32, 0.92)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(bx, by, bannerW, bannerH, 17);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f0f9ff";
        ctx.font = "bold 13.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(promptText, canvas.width / 2, by + 22);
        ctx.restore();
    }
}

// Click/Tap on the "Меню сохранений" prompt during BENCH_REST returns to saves menu
if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', (e) => {
        if (!storyState.active || storyState.step !== 'BENCH_REST' || storyState.stepTimer <= 25) return;
        if (!canvas) return;
        let rect = canvas.getBoundingClientRect();
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;
        let canvasX = (e.clientX - rect.left) * scaleX;
        let canvasY = (e.clientY - rect.top) * scaleY;

        let bannerW = Math.min(680, canvas.width - 40);
        let by = canvas.height - 42;
        let bx = canvas.width / 2 - bannerW / 2;

        if (canvasY >= by && canvasY <= by + 34 && canvasX >= canvas.width / 2 + 80 && canvasX <= bx + bannerW + 15) {
            if (typeof returnFromStoryToMenu === 'function') {
                returnFromStoryToMenu();
            }
        }
    });
}
