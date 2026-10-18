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
    ARENA_W: 4500,
    ARENA_H: 400,
    FLOOR: 350,
    UPPER_FLOOR: -25,
    LOWER_FLOOR: 850,
    ALTAR_X: 2000,
    BENCH_X: 3600,
    POND_X1: 3820,
    POND_X2: 4500,
    AIR_NPC_X: 1800,
    AIR_NPC_Y: -25,
    EARTH_NPC_X: 1100,
    EARTH_NPC_Y: 850,
    BENCH_2_X: 1450,
    BENCH_2_Y: 850,
    TRIALS_GATE_X: 1850,
    TRIALS_GATE_Y: 850,
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
    guardianDefeated: false,
    waterDropBonusDmg: 0,
    airMet: false,
    airDialogueTimer: 0,
    earthMet: false,
    earthDialogueTimer: 0,
    activeBenchId: 1, // 1 = Forest Bench (3600, 350), 2 = Underground Trials Bench (1450, 850)
    inTrials: false,
    trialsStage: 0,
    trialsWarnings: 0,
    trialsWeaponGranted: false,
    trialsGateY: 420,
    trialsGateOpen: false,
    checkpoint: { x: 120, y: 350, stance: 'WATER', hp: 5, benchId: 0 },
    leaves: [],
    grassBlades: [],
    stars: [],
    campfireFlames: [],
    restMenuOpen: false,
    backpackOpen: false,
    heroSelectOpen: false,
    heroAssignments: { WATER: 'P1', AIR: 'AI', EARTH: 'AI' }
};

function setupStoryPlatforms() {
    platforms = [
        // 1. Middle Tier (Floor 1: X = 0..3820, Y = 350)
        { x: 0, y: STORY_CONFIG.FLOOR, w: 3820, h: 48, solid: true, tier: 1 },
        // Left boundary wall of Floor 1 (separating Floor 1 from the Left Cliff Shaft X: -480..-40)
        { x: -42, y: 0, w: 42, h: 398, solid: true, isWall: true },
        // Water Pond basin floor & right wall (X = 3820..4500)
        { x: 3820, y: 445, w: 680, h: 45, solid: true, isPondBottom: true },
        { x: 4500, y: -380, w: 60, h: 870, solid: true, isWall: true },

        // 2. Three Solid Green Mossy Platforms above the Water Pond (cannot jump through from below!)
        { x: 3960, y: 265, w: 130, h: 20, solid: true, mossy: true },
        { x: 4210, y: 165, w: 130, h: 20, solid: true, mossy: true },
        { x: 3950, y: 65,  w: 130, h: 20, solid: true, mossy: true },

        // 3. Upper Tier (Floor 2 / Roof above Floor 1: X = -150..3820, Y = -25)
        { x: -150, y: STORY_CONFIG.UPPER_FLOOR, w: 3970, h: 26, solid: true, mossy: true, tier: 2 },

        // 4. Far-Left Shaft Wall (X = -520) guiding the drop down to the Underground Tier
        { x: -520, y: -380, w: 40, h: 1290, solid: true, isWall: true },

        // 5. Lower Underground Tier (Floor 3: X = -480..3200, Y = 850) - open corridor past gates
        { x: -480, y: STORY_CONFIG.LOWER_FLOOR, w: 3680, h: 65, solid: true, tier: 3 },

        // Dedicated Isolated Trials Arena Chamber (X = 5000..6000, Y = 450..870)
        // Hidden from corridor view; accessible ONLY via Arch Gate teleport!
        { x: 4980, y: STORY_CONFIG.LOWER_FLOOR, w: 1040, h: 65, solid: true, isTrialsArenaFloor: true },
        { x: 4980, y: 460, w: 25, h: 400, solid: true, isWall: true, isTrialsArenaWall: true },
        { x: 5995, y: 460, w: 25, h: 400, solid: true, isWall: true, isTrialsArenaWall: true },
        { x: 4980, y: 450, w: 1040, h: 20, solid: true, isTrialsCeiling: true },
        // Elevated Combat Ledges in Arena
        { x: 5180, y: 720, w: 130, h: 18, solid: true, isArenaLedge: true },
        { x: 5680, y: 720, w: 130, h: 18, solid: true, isArenaLedge: true },
        // Overhead Maze Platforms (Stage 2 ONLY - solid dynamically toggled)
        { x: 5360, y: 720, w: 105, h: 16, solid: false, isMazeBase1: true },
        { x: 5505, y: 720, w: 105, h: 16, solid: false, isMazeBase2: true },
        { x: 5360, y: 530, w: 250, h: 16, solid: false, isMazeRoof: true }
    ];
}

function mapStoryControlsToKeysObj(schemeObj) {
    let res = {};
    if (schemeObj && typeof schemeObj === 'object') {
        for (let k in schemeObj) {
            if (schemeObj[k]) res[k] = [schemeObj[k]];
        }
    }
    return res;
}

function getStoryP1Keys() {
    let p1Keys = mapStoryControlsToKeysObj(userControls ? userControls.SCHEME_1 : DEFAULT_CONTROLS.SCHEME_1);
    if (p1InputType === 'KEYBOARD_2' || p1InputType === 'KEYBOARD_SHOOTER') {
        p1Keys = mapStoryControlsToKeysObj(userControls ? userControls.SCHEME_2 : DEFAULT_CONTROLS.SCHEME_2);
    } else if (p1InputType === 'DUO_KEYBOARD_P1') {
        let duo1 = (userControls && userControls.DUO_KEYBOARD && userControls.DUO_KEYBOARD.p1) || DEFAULT_CONTROLS.DUO_KEYBOARD.p1;
        p1Keys = mapStoryControlsToKeysObj(duo1);
    }
    return p1Keys;
}

function getStoryP2Keys() {
    let p2Keys = mapStoryControlsToKeysObj(userControls ? userControls.SCHEME_2 : DEFAULT_CONTROLS.SCHEME_2);
    if (p2InputType === 'KEYBOARD_1' || p2InputType === 'KEYBOARD_SILK') {
        p2Keys = mapStoryControlsToKeysObj(userControls ? userControls.SCHEME_1 : DEFAULT_CONTROLS.SCHEME_1);
    } else if (p2InputType === 'DUO_KEYBOARD_P2') {
        let duo2 = (userControls && userControls.DUO_KEYBOARD && userControls.DUO_KEYBOARD.p2) || DEFAULT_CONTROLS.DUO_KEYBOARD.p2;
        p2Keys = mapStoryControlsToKeysObj(duo2);
    }
    return p2Keys;
}

function spawnStoryCompanionHero(heroType, spawnX, spawnY) {
    // Prevent duplicate heroes in Story Mode!
    if (players.some(pl => pl.type === heroType)) return;

    let role = storyState.heroAssignments[heroType] || 'AI';
    if (heroType === 'AIR' && (window.storyPlayerCount === 2) && !players.some(pl => !pl.isAi && pl.id === 2)) {
        role = 'P2';
        storyState.heroAssignments.AIR = 'P2';
    }

    let isHumanP2 = (role === 'P2' && window.storyPlayerCount === 2);
    let keysObj = isHumanP2 ? getStoryP2Keys() : getStoryP1Keys();
    let inputType = isHumanP2 ? (p2InputType || 'KEYBOARD_2') : 'AI';
    let newId = players.length + 1;

    let comp = createPlayer(newId, heroType, keysObj, inputType, spawnX);
    comp.isAi = !isHumanP2;
    comp.maxHp = 5;
    comp.hp = 5;
    comp.purpleHp = 0;
    comp.stance = 'LIGHT';
    comp.x = spawnX;
    comp.y = spawnY;
    comp.lastSafeX = spawnX;
    comp.lastSafeY = spawnY;
    comp.vx = 0;
    comp.vy = 0;
    if (heroType === 'AIR') {
        // Timur: "у воздуха из доступного только прыжок (выше чутка чем у остальных) и ходьба"
        comp.jumpPower = -11.9;
    }
    applyBadgesToPlayer(comp, true);
    players.push(comp);
}

// Rebuild party order and control assignments when changed on Bench via [Space]
function rebuildStoryPartyFromAssignments(anchorX, anchorFloorY) {
    let unlocked = ['WATER'];
    if (storyState.airMet) unlocked.push('AIR');
    if (storyState.earthMet) unlocked.push('EARTH');

    // Find P1 hero (must be human, default WATER)
    let p1Hero = unlocked.find(h => storyState.heroAssignments[h] === 'P1') || 'WATER';
    let orderedHeroes = [p1Hero];
    for (let h of unlocked) {
        if (h !== p1Hero) orderedHeroes.push(h);
    }

    let oldStances = {};
    for (let pl of players) {
        oldStances[pl.type] = pl.stance || 'LIGHT';
    }

    players = [];
    orderedHeroes.forEach((hType, idx) => {
        let role = storyState.heroAssignments[hType] || (idx === 0 ? 'P1' : 'AI');
        let isP1 = (role === 'P1');
        let isP2 = (role === 'P2' && window.storyPlayerCount === 2);
        let keysObj = isP1 ? getStoryP1Keys() : (isP2 ? getStoryP2Keys() : getStoryP1Keys());
        let inType = isP1 ? p1InputType : (isP2 ? (p2InputType || 'KEYBOARD_2') : 'AI');

        let pl = createPlayer(idx + 1, hType, keysObj, inType, anchorX - 18 + idx * 22);
        pl.isAi = !(isP1 || isP2);
        pl.maxHp = 5;
        pl.hp = 5;
        pl.purpleHp = 0;
        pl.stance = (hType === 'WATER') ? (oldStances.WATER || 'LIGHT') : 'LIGHT';
        pl.abilities = { top: 'shuriken', mid: 'shuriken', bot: 'shuriken' };
        pl.x = anchorX - 18 + idx * 22;
        pl.y = anchorFloorY - 24;
        pl.lastSafeX = pl.x;
        pl.lastSafeY = pl.y;
        pl.vx = 0;
        pl.vy = 0;
        if (hType === 'AIR') pl.jumpPower = -11.9;
        applyBadgesToPlayer(pl, true);
        players.push(pl);
    });
}

// Initialize decorative elements for Forest
function initForestScenery() {
    // 1. Stars in night sky
    storyState.stars = [];
    for (let i = 0; i < 110; i++) {
        storyState.stars.push({
            x: Math.random() * STORY_CONFIG.ARENA_W,
            y: -260 + Math.random() * (STORY_CONFIG.FLOOR + 140),
            size: 0.8 + Math.random() * 1.8,
            alpha: 0.3 + Math.random() * 0.7,
            twinkleSpeed: 0.02 + Math.random() * 0.04
        });
    }

    // 2. Swaying grass blades along Floor 1 (0..3820)
    storyState.grassBlades = [];
    for (let x = 0; x < 3820; x += 12) {
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
    for (let i = 0; i < 38; i++) {
        storyState.leaves.push({
            x: Math.random() * STORY_CONFIG.ARENA_W,
            y: -220 + Math.random() * (STORY_CONFIG.FLOOR + 220),
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
    storyState.backpackOpen = false;
    storyState.heroSelectOpen = false;
    storyState.airDialogueTimer = 0;
    storyState.earthDialogueTimer = 0;

    initForestScenery();

    // Setup 3-Tier Arena & Platforms
    ARENA_W = STORY_CONFIG.ARENA_W;
    ARENA_H = STORY_CONFIG.ARENA_H;
    FLOOR = STORY_CONFIG.FLOOR;
    camY = 0;

    // Reset game params BEFORE player creation and THEN set up Story platforms
    players = [];
    resetGameParams();
    setupStoryPlatforms();
    sharedHeals = 0;
    maxSharedHeals = 0;
    sharedHealPoints = 0;

    let playerCount = window.storyPlayerCount || 1;
    numPlayers = playerCount;
    p1HeroSelection = 'WATER';

    let p1Keys = getStoryP1Keys();

    let isSavedAtBench2 = slotData && slotData.checkpointId === 'bench_2_underground';
    let isSavedAtBench1 = slotData && (slotData.checkpointId === 'forest_bench_campfire' || slotData.checkpointId === 'bench_campfire');

    storyState.heroAssignments = (slotData && slotData.heroAssignments) ? Object.assign({}, slotData.heroAssignments) : {
        WATER: 'P1',
        AIR: (playerCount === 2 ? 'P2' : 'AI'),
        EARTH: 'AI'
    };
    if (playerCount === 1 && storyState.heroAssignments.AIR === 'P2') storyState.heroAssignments.AIR = 'AI';
    if (playerCount === 1 && storyState.heroAssignments.EARTH === 'P2') storyState.heroAssignments.EARTH = 'AI';

    if (isSavedAtBench2 || isSavedAtBench1) {
        let bId = isSavedAtBench2 ? 2 : 1;
        let bx = (bId === 2) ? STORY_CONFIG.BENCH_2_X : STORY_CONFIG.BENCH_X;
        let by = (bId === 2) ? STORY_CONFIG.BENCH_2_Y : STORY_CONFIG.FLOOR;

        storyState.activeBenchId = bId;
        storyState.step = 'BENCH_REST';
        storyState.stepTimer = 0;
        storyState.blackAlpha = 0.0;
        storyState.altarActive = false;
        storyState.jumpUnlocked = true;
        storyState.attackUnlocked = true;
        storyState.comboUnlocked = true;
        storyState.stanceUnlocked = true;
        storyState.isLyingDown = false;
        storyState.guardianDefeated = true;
        storyState.waterDropBonusDmg = 0.5;
        storyState.airMet = !!(slotData.airMet || isSavedAtBench2);
        storyState.earthMet = !!(slotData.earthMet || isSavedAtBench2);
        storyState.checkpoint = { x: bx - 10, y: by, stance: slotData.currentStance || 'LIGHT', hp: 5, benchId: bId };

        rebuildStoryPartyFromAssignments(bx, by);
        if (players[0] && slotData.currentStance) {
            players[0].stance = slotData.currentStance;
        }

        camX = Math.max(-480, Math.min(STORY_CONFIG.ARENA_W - GAME_WIDTH, bx - GAME_WIDTH * 0.35));
        camY = Math.max(-320, Math.min(560, by - 350));
    } else {
        // FRESH PROLOGUE START (Lying down in the night forest at x = 120)
        storyState.activeBenchId = 1;
        storyState.step = 'DARK_FADE';
        storyState.stepTimer = 0;
        storyState.blackAlpha = 1.0;
        storyState.altarActive = true;
        storyState.jumpUnlocked = false;
        storyState.attackUnlocked = false;
        storyState.comboUnlocked = false;
        storyState.stanceUnlocked = false;
        storyState.isLyingDown = true;
        storyState.guardianDefeated = false;
        storyState.waterDropBonusDmg = 0;
        storyState.airMet = false;
        storyState.earthMet = false;
        storyState.checkpoint = { x: STORY_CONFIG.START_X, y: STORY_CONFIG.FLOOR, stance: 'LIGHT', hp: 5, benchId: 0 };

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
        camY = 0;
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
window.launchStoryPrologue = initStoryPrologue;

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

// Safe helper to check key inputs without throwing if undefined or non-array
function checkKeyInput(keysObj, prop) {
    if (!keysObj || !keysObj[prop]) return false;
    let val = keysObj[prop];
    if (typeof isKeyPressed === 'function') {
        return isKeyPressed(val);
    }
    if (typeof val === 'string') return !!keys[val];
    if (Array.isArray(val)) return val.some(k => !!keys[k]);
    return false;
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
                    storyState.guardianDefeated = true;
                    storyState.waterDropBonusDmg = 0.5; // Timur: "после победы над тем боссом вода наносит атакой воды на 0.5 больше урона"
                    storyState.step = 'GUARDIAN_DEFEATED';
                    storyState.stepTimer = 0;
                    if (typeof playSound === 'function') playSound('parry');
                }
            }
            break;

        case 'GUARDIAN_DEFEATED':
            // Handled at top of updateStoryMode when S is pressed
            break;

        case 'GO_TO_BENCH': {
            // 0. DEMON SECRECY RULE: Water MUST hide the Demon from everyone!
            // Timur: "вода должен скрывать демона от всех, а сейчас мы спокойно можем проходить игру на демоне, так не должно быть"
            let waterPl = players.find(pl => pl && pl.type === 'WATER');
            if (waterPl && waterPl.stance === 'DEMON') {
                let nearAirNpc = (!storyState.airMet && waterPl.y < 60 && Math.abs(waterPl.x - STORY_CONFIG.AIR_NPC_X) < 420);
                let nearEarthNpc = (!storyState.earthMet && waterPl.y > 550 && Math.abs(waterPl.x - STORY_CONFIG.EARTH_NPC_X) < 420);
                let alliesPresent = (storyState.airMet || storyState.earthMet || nearAirNpc || nearEarthNpc);

                if (alliesPresent) {
                    // Instant exposure in front of Air or Earth!
                    storyState.step = 'DEMON_EXPOSED';
                    storyState.stepTimer = 0;
                    storyState.exposedReason = "Союзники увидели ваш облик Демона! Скрывайте эту силу от всех!";
                    if (storyState.earthMet || nearEarthNpc) {
                        storyState.earthDialogueTimer = 140;
                        storyState.exposedQuote = "🌿 «Стой... Ты что, ДЕМОН?!»";
                    } else {
                        storyState.airDialogueTimer = 140;
                        storyState.exposedQuote = "💨 «Подожди... Ты же ДЕМОН?!»";
                    }
                    if (typeof screenShake !== 'undefined') { screenShake.timer = 35; screenShake.mag = 16; }
                    if (typeof playSound === 'function') playSound('parry');
                    break;
                } else {
                    // Alone in the forest: cannot walk around in Demon form or cross past the Campfire (x > 3500)
                    storyState.demonAuraTimer = (storyState.demonAuraTimer || 0) + 1;
                    if (storyState.demonAuraTimer >= 150 || waterPl.x > 3520) {
                        storyState.step = 'DEMON_EXPOSED';
                        storyState.stepTimer = 0;
                        storyState.demonAuraTimer = 0;
                        storyState.exposedReason = "Стражи Леса почувствовали незакрытую ауру Демона! Всегда скрывайте её клавишей [S]!";
                        storyState.exposedQuote = "";
                        storyState.lightningTimer = 45;
                        if (typeof screenShake !== 'undefined') { screenShake.timer = 40; screenShake.mag = 20; }
                        if (typeof playSound === 'function') playSound('parry');
                        break;
                    }
                }
            } else {
                storyState.demonAuraTimer = 0;
            }

            // 1. Check if ANY player in the party sits on Bench 1 (3600, 350) or Bench 2 (1450, 850)
            // Timur: "если хоть один садится на скамейку - то все садятся"
            if (storyState.stepTimer > 22) {
                for (let pl of players) {
                    if (!pl || pl.isAi) continue;
                    let downPressed = (pl.keys && isKeyPressed(pl.keys.down)) ||
                                      (pl.id === 1 && (keys['ArrowDown'] || (p1InputType === 'KEYBOARD_2' && keys['KeyS']) || (typeof touchInputs !== 'undefined' && touchInputs && touchInputs.down))) ||
                                      (pl.id === 2 && (keys['KeyS'] || keys['ArrowDown']));
                    if (!downPressed) continue;

                    if (Math.abs(pl.x - STORY_CONFIG.BENCH_X) < 85 && Math.abs(pl.y - (STORY_CONFIG.FLOOR - 50)) < 75) {
                        restAtCampfire(1);
                        break;
                    }
                    if (Math.abs(pl.x - STORY_CONFIG.BENCH_2_X) < 85 && Math.abs(pl.y - (STORY_CONFIG.BENCH_2_Y - 50)) < 85) {
                        restAtCampfire(2);
                        break;
                    }
                }
            }

            // 2. Check encounter with AIR (💨) on the Upper Tier (X = 1800, Y = -25)
            // Timur: "если дойти до какого то места на том верхнем полу то там ты встретишь воздуха, который скажет 'хей, дружище пошли вместе'"
            if (!storyState.airMet) {
                for (let pl of players) {
                    if (pl && pl.y < 30 && Math.abs(pl.x - STORY_CONFIG.AIR_NPC_X) < 115) {
                        storyState.airMet = true;
                        storyState.airDialogueTimer = 280;
                        spawnStoryCompanionHero('AIR', STORY_CONFIG.AIR_NPC_X, STORY_CONFIG.AIR_NPC_Y - 50);
                        if (typeof playSound === 'function') playSound('lightChime');
                        break;
                    }
                }
            }

            // 3. When dropping down the Left Cliff Shaft (X < -60) to the Lower Underground Tier (Y > 680),
            // make sure any companion (P2 or AI) drops down together with the leader!
            if (storyState.airMet && p1.y > 620) {
                for (let i = 1; i < players.length; i++) {
                    let comp = players[i];
                    if (comp && comp.y < 200) {
                        comp.x = -240 + i * 35;
                        comp.y = 360;
                        comp.vx = 0;
                        comp.vy = 4;
                    }
                }
            }

            // 4. Check encounter with EARTH (🌿) on the Lower Underground Tier (X = 1100, Y = 850)
            // Timur: "когда они падают и доходят до какого то момента справа то земля им говорит 'вы чего так долго? я вас уже заждалась' и они идут вместе"
            if (!storyState.earthMet) {
                for (let pl of players) {
                    if (pl && pl.y > 650 && Math.abs(pl.x - STORY_CONFIG.EARTH_NPC_X) < 125) {
                        storyState.earthMet = true;
                        storyState.earthDialogueTimer = 300;
                        spawnStoryCompanionHero('EARTH', STORY_CONFIG.EARTH_NPC_X, STORY_CONFIG.EARTH_NPC_Y - 50);
                        if (typeof playSound === 'function') playSound('lightChime');
                        break;
                    }
                }
            }

            // 5. Standing near Gate of the Trials at X = 1850, Y = 850
            if (!storyState.inTrials) {
                let p1 = players[0];
                let nearGate = p1 && (p1.y > 700) && (Math.abs(p1.x - 1850) < 65);
                storyState.nearTrialsGate = !!nearGate;
                if (nearGate && storyState.airMet && storyState.earthMet) {
                    let kDown = checkKeyInput(p1.keys, 'down') || keys['ArrowDown'] || keys['KeyS'] || (typeof touchInputs !== 'undefined' && touchInputs && touchInputs.down);
                    if (kDown) {
                        clearKeyInput(p1.keys, 'down');
                        keys['ArrowDown'] = false;
                        keys['KeyS'] = false;
                        if (typeof enterStoryTrialsViaGate === 'function') {
                            enterStoryTrialsViaGate();
                        }
                    }
                }
            }

            // 6. Update Trials engine if active
            if (typeof storyTrials !== 'undefined' && storyTrials.active) {
                updateStoryTrials();
            }
            break;
        }

        case 'DEMON_EXPOSED': {
            for (let pl of players) {
                if (pl) { pl.vx = 0; pl.vy = 0; }
            }
            if (storyState.stepTimer >= 135) {
                storyState.demonAuraTimer = 0;
                storyState.exposedQuote = "";
                storyState.checkpoint.stance = 'LIGHT';
                respawnPlayerAtStoryCheckpoint();
                for (let pl of players) {
                    if (pl && pl.type === 'WATER') pl.stance = 'LIGHT';
                }
                storyState.step = 'GO_TO_BENCH';
                storyState.stepTimer = 0;
            }
            break;
        }

        case 'BENCH_REST': {
            let bId = storyState.activeBenchId || 1;
            let bx = (bId === 2) ? STORY_CONFIG.BENCH_2_X : STORY_CONFIG.BENCH_X;
            let by = (bId === 2) ? STORY_CONFIG.BENCH_2_Y : STORY_CONFIG.FLOOR;

            // Keep all party members seated peacefully on the bench
            for (let idx = 0; idx < players.length; idx++) {
                let pl = players[idx];
                if (!pl) continue;
                pl.vx = 0;
                pl.vy = 0;
                pl.x = bx - 22 + idx * 20;
                pl.y = by - 24;
            }

            // If Backpack [Tab] or Hero Select [Space] modal is open, do not stand up on random keys
            if (storyState.backpackOpen || storyState.heroSelectOpen || storyState.restMenuOpen) {
                break;
            }

            // Debounce so sitting down key does not immediately stand the party back up!
            if (storyState.stepTimer > 28) {
                // Check [Tab] -> Open Backpack & Map
                if (keys['Tab']) {
                    keys['Tab'] = false;
                    openStoryBackpackModal();
                    break;
                }
                // Check [Space] -> Open Hero Selection
                if (keys['Space']) {
                    keys['Space'] = false;
                    openStoryHeroSelectModal();
                    break;
                }

                let standUp = false;
                for (let k in keys) {
                    if (keys[k] === true && k !== 'Escape' && k !== 'Tab' && k !== 'Space') {
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
                    for (let idx = 0; idx < players.length; idx++) {
                        let pl = players[idx];
                        if (!pl) continue;
                        pl.x = bx - 45 - idx * 28;
                        pl.y = by - 50;
                        pl.vx = 0;
                        pl.vy = 0;
                    }
                    if (typeof playSound === 'function') playSound('jump');
                }
            }
            break;
        }
    }

    if (storyState.airDialogueTimer > 0) storyState.airDialogueTimer--;
    if (storyState.earthDialogueTimer > 0) storyState.earthDialogueTimer--;

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

    // 3. Update Normal Player Physics & Actions (skip when sitting on bench)
    if (storyState.step !== 'BENCH_REST') {
        updatePlayers();
    }

    // 4. Update Forest Atmospheric Effects
    updateForestAtmosphere();

    // 5. Smooth 2D Camera Tracking (X and Y across all 3 tiers!)
    let focusX = p1.x;
    let focusY = p1.y;
    if (players.length > 1 && !players[1].isAi) {
        // In 2P Local mode, bias camera towards P1 while keeping P2 comfortable
        focusX = p1.x * 0.65 + players[1].x * 0.35;
        focusY = p1.y * 0.65 + players[1].y * 0.35;
    }
    let minCamX = (focusX < 40 || focusY > 420) ? -480 : 0;
    let targetCamX = Math.max(minCamX, Math.min(STORY_CONFIG.ARENA_W - GAME_WIDTH, focusX - GAME_WIDTH * 0.38));
    let targetCamY = 0;

    if (focusY < 160) {
        targetCamY = Math.max(-280, focusY - 220);
    } else if (focusY > 410) {
        targetCamY = Math.min(540, focusY - 290);
    } else {
        targetCamY = 0;
    }

    // When inside Trials, lock camera to dedicated arena chamber (X: 5000..6000, Y: 470..870)
    // Entire arena is visible from border to border in 1 frame without scrolling!
    if (typeof storyTrials !== 'undefined' && storyTrials.active) {
        targetCamX = 5000;
        targetCamY = 470;
        camX = 5000;
        camY = 470;
    }

    camX += (targetCamX - camX) * 0.15;
    camY += (targetCamY - camY) * 0.15;

    // 6. Party Wipe / Death Respawn at Checkpoint
    let anyAlive = players.some(pl => pl && pl.hp > 0 && !pl.isDowned);
    if (!anyAlive) {
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
                g.hp -= 2.5 + (storyState.waterDropBonusDmg || 0);
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
                g.timer = 30;
            }
        } else if (g.state === 'WALK') {
            g.state = 'SLASH_WARN';
            g.timer = 30;
        } else if (g.state === 'SLASH_WARN') {
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
            let dir = g.facingRight ? 1 : -1;
            g.waterProjectiles.push({ x: g.x, y: g.y + 20, vx: dir * 4.5, vy: -0.5, life: 120 });
            g.waterProjectiles.push({ x: g.x, y: g.y + 35, vx: dir * 5.2, vy: 0.5, life: 120 });
        } else if (g.state === 'SHOOT') {
            g.state = 'PAUSE';
            g.timer = 90;
        } else if (g.state === 'TELEPORT') {
            let offset = (p.facingRight ? -80 : 80);
            g.x = Math.max(STORY_CONFIG.ALTAR_X - 100, Math.min(STORY_CONFIG.ALTAR_X + 450, p.x + offset));
            g.state = 'PAUSE';
            g.timer = 50;
        }
    }

    if (g.state === 'WALK') {
        let dir = (p.x > g.x) ? 1 : -1;
        g.x += dir * 1.8;
    }
}

// Respawn at Checkpoint
function respawnPlayerAtStoryCheckpoint() {
    let cpX = storyState.checkpoint.x || STORY_CONFIG.START_X;
    let cpY = storyState.checkpoint.y || STORY_CONFIG.FLOOR;

    if (typeof storyTrials !== 'undefined') {
        storyTrials.active = false;
        storyTrials.warnings = 0;
    }
    storyState.inTrials = false;

    for (let idx = 0; idx < players.length; idx++) {
        let pl = players[idx];
        if (!pl) continue;
        pl.hp = 5;
        pl.maxHp = 5;
        pl.isDowned = false;
        pl.downedTimer = 0;
        pl.x = cpX - idx * 25;
        pl.y = cpY - 50;
        pl.vx = 0;
        pl.vy = 0;
        pl.invuln = 60;
        if (pl.type === 'WATER') {
            pl.stance = storyState.checkpoint.stance || 'LIGHT';
        }
    }

    if (storyState.guardian) {
        storyState.guardian.hp = storyState.guardian.maxHp;
        storyState.guardian.x = STORY_CONFIG.ALTAR_X + 260;
        storyState.guardian.state = 'PAUSE';
        storyState.guardian.timer = 60;
    }
}

// Rest at Campfire Bench (Group Sit for all party members!)
function restAtCampfire(benchId = 1) {
    let p = players[0];
    if (!p) return;

    storyState.activeBenchId = benchId;
    let bx = (benchId === 2) ? STORY_CONFIG.BENCH_2_X : STORY_CONFIG.BENCH_X;
    let by = (benchId === 2) ? STORY_CONFIG.BENCH_2_Y : STORY_CONFIG.FLOOR;

    storyState.restMenuOpen = false;
    storyState.backpackOpen = false;
    storyState.heroSelectOpen = false;
    storyState.step = 'BENCH_REST';
    storyState.stepTimer = 0;

    for (let idx = 0; idx < players.length; idx++) {
        let pl = players[idx];
        if (!pl) continue;
        pl.hp = 5;
        pl.maxHp = 5;
        pl.purpleHp = 0;
        pl.isDowned = false;
        pl.downedTimer = 0;
        pl.vx = 0;
        pl.vy = 0;
        pl.x = bx - 22 + idx * 20;
        pl.y = by - 24;
    }

    sharedHeals = 0;
    maxSharedHeals = 0;
    sharedHealPoints = 0;
    storyState.checkpoint = { x: bx - 10, y: by, stance: p.stance || 'LIGHT', hp: 5, benchId: benchId };

    let unlockedHeroes = ['WATER'];
    if (storyState.airMet) unlockedHeroes.push('AIR');
    if (storyState.earthMet) unlockedHeroes.push('EARTH');

    // Auto-save progress to Firebase and LocalStorage!
    let curUser = getCurrentUser();
    let slotData = {
        slot: storyState.slotNum,
        location: (benchId === 2) ? "Подземелье (Костер у Врат Испытаний)" : "Лес (Костер у опушки)",
        locationSub: (benchId === 2) ? "Отряд в сборе: Вода 💧, Воздух 💨, Земля 🌿" : "Отдых у теплого огня",
        hero: p.type || "WATER",
        maxHp: 5,
        currentHp: 5,
        demonUnlocked: true,
        stealthUnlocked: true,
        waterDropBonusDmg: storyState.waterDropBonusDmg || 0.5,
        airMet: !!storyState.airMet,
        earthMet: !!storyState.earthMet,
        unlockedHeroes: unlockedHeroes,
        heroAssignments: storyState.heroAssignments,
        currentStance: p.stance || "LIGHT",
        checkpointId: (benchId === 2) ? "bench_2_underground" : "forest_bench_campfire",
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

// --- [Tab] BACKPACK & 3-TIER MAP MODAL ---
function openStoryBackpackModal() {
    if (!storyState.active) return;
    storyState.backpackOpen = true;
    let modal = document.getElementById('story-backpack-modal');
    if (!modal) return;
    modal.style.display = 'flex';

    // Render 3-Tier Map with Live Player Position Marker
    let mapEl = document.getElementById('story-map-diagram');
    if (mapEl) {
        let p = players[0] || { x: STORY_CONFIG.BENCH_X, y: STORY_CONFIG.FLOOR };
        // Convert world (x, y) into % coordinates on the 225px diagram
        let markerLeft = Math.max(6, Math.min(94, ((p.x + 500) / 5000) * 100));
        let markerTop = 48;
        if (p.y < 120) markerTop = 18;
        else if (p.y > 500) markerTop = 80;

        mapEl.innerHTML = `
            <!-- Upper Tier (Floor 2: Y = -25) -->
            <div style="position: absolute; left: 10%; right: 14%; top: 22%; height: 8px; background: linear-gradient(90deg, #15803d, #22c55e); border-radius: 4px; box-shadow: 0 0 8px rgba(34,197,94,0.4);"></div>
            <div style="position: absolute; left: 44%; top: 7%; color: #e2e8f0; font-weight: bold;">💨 Встреча с Воздухом ${storyState.airMet ? '✅' : '❓'}</div>
            <div style="position: absolute; left: 12%; top: 7%; color: #38bdf8;">⬅ Прыжок в обрыв вниз</div>

            <!-- Middle Tier (Floor 1: Y = 350) -->
            <div style="position: absolute; left: 12%; right: 16%; top: 52%; height: 8px; background: #334155; border-top: 2px solid #22c55e; border-radius: 4px;"></div>
            <div style="position: absolute; left: 14%; top: 38%; color: #94a3b8;">🌲 Старт</div>
            <div style="position: absolute; left: 45%; top: 38%; color: #c084fc;">⚡ Алтарь Демона</div>
            <div style="position: absolute; left: 72%; top: 38%; color: #fbbf24;">🔥 Скамейка 1</div>

            <!-- Water Pond & 3 Mossy Platforms on the right -->
            <div style="position: absolute; right: 3%; width: 13%; top: 53%; height: 18px; background: rgba(14, 165, 233, 0.45); border: 1px solid #38bdf8; border-radius: 0 0 6px 6px; text-align: center; color: #bae6fd; font-size: 9.5px; line-height: 16px;">💧 Вода</div>
            <div style="position: absolute; right: 10%; top: 43%; width: 26px; height: 5px; background: #22c55e; border-radius: 3px;"></div>
            <div style="position: absolute; right: 5%; top: 34%; width: 26px; height: 5px; background: #22c55e; border-radius: 3px;"></div>
            <div style="position: absolute; right: 10%; top: 26%; width: 26px; height: 5px; background: #22c55e; border-radius: 3px;"></div>

            <!-- Left Cliff Shaft -->
            <div style="position: absolute; left: 4%; width: 6%; top: 22%; height: 64%; border-left: 2px dashed rgba(56,189,248,0.4); border-right: 2px dashed rgba(56,189,248,0.4);"></div>

            <!-- Lower Underground Tier (Floor 3: Y = 850) -->
            <div style="position: absolute; left: 4%; right: 20%; top: 85%; height: 9px; background: #1e293b; border-top: 2px solid #4ade80; border-radius: 4px;"></div>
            <div style="position: absolute; left: 32%; top: 70%; color: #4ade80; font-weight: bold;">🌿 Встреча с Землей ${storyState.earthMet ? '✅' : '❓'}</div>
            <div style="position: absolute; left: 56%; top: 70%; color: #fbbf24; font-weight: bold;">🔥 Скамейка 2</div>
            <div style="position: absolute; right: 18%; top: 70%; color: #f87171; font-weight: bold;">⛩️ Врата Испытаний</div>

            <!-- Live Player Marker -->
            <div style="position: absolute; left: ${markerLeft}%; top: ${markerTop}%; transform: translate(-50%, -50%); background: #00ffcc; color: #041019; font-weight: 900; padding: 2px 7px; border-radius: 10px; font-size: 10px; box-shadow: 0 0 12px #00ffcc; white-space: nowrap;">
                📍 ВЫ ЗДЕСЬ
            </div>
        `;
    }

    // Render Backpack Items & Unlocked Abilities
    let itemsEl = document.getElementById('story-backpack-items');
    if (itemsEl) {
        let bonusText = storyState.waterDropBonusDmg > 0
            ? `<span style="color: #4ade80; font-weight: bold;">+0.5 урона (Усилено после Стража!)</span>`
            : `<span style="color: #94a3b8;">Базовый урон</span>`;
        itemsEl.innerHTML = `
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #38bdf8; border-radius: 10px; padding: 10px 12px;">
                <div style="font-weight: 900; color: #38bdf8; font-size: 13px; margin-bottom: 4px;">💧 Водяная Капля [X + F]</div>
                <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">Скрытная водяная атака (не раскрывает Демона). Статус: ${bonusText}</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #c084fc; border-radius: 10px; padding: 10px 12px;">
                <div style="font-weight: 900; color: #c084fc; font-size: 13px; margin-bottom: 4px;">😈 Сила Демона [S]</div>
                <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">Короткий сокрушительный удар в форме Демона. Скрывайте силу при союзниках!</div>
            </div>
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #4ade80; border-radius: 10px; padding: 10px 12px;">
                <div style="font-weight: 900; color: #4ade80; font-size: 13px; margin-bottom: 4px;">🤝 Спасение союзников [A]</div>
                <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">Тяжело раненый ждёт 10 сек. Подойдите вплотную и нажмите [A], чтобы отдать 1 HP (или 0.5 HP при 1 HP).</div>
            </div>
        `;
    }
}
window.openStoryBackpackModal = openStoryBackpackModal;

function closeStoryBackpackModal() {
    storyState.backpackOpen = false;
    let modal = document.getElementById('story-backpack-modal');
    if (modal) modal.style.display = 'none';
}
window.closeStoryBackpackModal = closeStoryBackpackModal;

// --- [Space] BENCH HERO SELECTION MODAL ---
// Rules:
// 1. No duplicates ("нельзя брать повторки")
// 2. At least one human player must play on WATER ("пока что хотя бы один игрок должен играть на воде")
// 3. Right-side checkmarks (✓) for AI companion control ("для второго ИИ появятся галочки справа")
function openStoryHeroSelectModal() {
    if (!storyState.active) return;
    storyState.heroSelectOpen = true;
    let modal = document.getElementById('story-hero-select-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderStoryHeroSelectList();
}
window.openStoryHeroSelectModal = openStoryHeroSelectModal;

function closeStoryHeroSelectModal() {
    storyState.heroSelectOpen = false;
    let modal = document.getElementById('story-hero-select-modal');
    if (modal) modal.style.display = 'none';

    let bId = storyState.activeBenchId || 1;
    let bx = (bId === 2) ? STORY_CONFIG.BENCH_2_X : STORY_CONFIG.BENCH_X;
    let by = (bId === 2) ? STORY_CONFIG.BENCH_2_Y : STORY_CONFIG.FLOOR;
    rebuildStoryPartyFromAssignments(bx, by);
}
window.closeStoryHeroSelectModal = closeStoryHeroSelectModal;

function showStoryHeroWarning(msg) {
    let warnEl = document.getElementById('story-hero-select-warning');
    if (!warnEl) return;
    warnEl.innerText = "⚠️ " + msg;
    warnEl.style.display = 'block';
}

function assignStoryHeroRole(heroType, targetRole) {
    let is2P = (window.storyPlayerCount === 2);
    let next = Object.assign({}, storyState.heroAssignments);

    if (targetRole === 'P1' || targetRole === 'P2') {
        // Swap roles with whichever hero currently holds targetRole so there are never duplicates!
        let prevHolder = Object.keys(next).find(h => next[h] === targetRole);
        let oldRoleOfClicked = next[heroType] || 'AI';
        next[heroType] = targetRole;
        if (prevHolder && prevHolder !== heroType) {
            next[prevHolder] = oldRoleOfClicked;
        }
    } else if (targetRole === 'AI') {
        next[heroType] = 'AI';
    }

    // Rule check: At least one human player (P1 or P2) MUST play as WATER!
    let waterRole = next['WATER'];
    let isWaterHuman = (waterRole === 'P1') || (is2P && waterRole === 'P2');
    if (!isWaterHuman) {
        showStoryHeroWarning("Пока что хотя бы один игрок должен играть на Воде 💧!");
        return;
    }

    // Ensure P1 is always assigned to one unlocked hero
    let unlocked = ['WATER'];
    if (storyState.airMet) unlocked.push('AIR');
    if (storyState.earthMet) unlocked.push('EARTH');
    if (!unlocked.some(h => next[h] === 'P1')) {
        next['WATER'] = 'P1';
    }

    let warnEl = document.getElementById('story-hero-select-warning');
    if (warnEl) warnEl.style.display = 'none';

    storyState.heroAssignments = next;
    renderStoryHeroSelectList();
}
window.assignStoryHeroRole = assignStoryHeroRole;

function renderStoryHeroSelectList() {
    let listEl = document.getElementById('story-hero-select-list');
    if (!listEl) return;

    let is2P = (window.storyPlayerCount === 2);
    let heroesMeta = [
        { id: 'WATER', name: 'Вода 💧', unlocked: true, desc: 'Скрытая сила Демона [S] и Водяная Капля [X+F]', color: '#38bdf8' },
        { id: 'AIR',   name: 'Воздух 💨', unlocked: !!storyState.airMet, desc: 'Высокий прыжок и стремительное движение', color: '#e2e8f0' },
        { id: 'EARTH', name: 'Земля 🌿', unlocked: !!storyState.earthMet, desc: 'Страж подземелья • Вместе идут на Испытания', color: '#4ade80' }
    ];

    let html = '';
    for (let h of heroesMeta) {
        if (!h.unlocked) {
            html += `
                <div style="background: rgba(15, 23, 42, 0.5); border: 1px dashed #334155; border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; opacity: 0.6;">
                    <div style="text-align: left;">
                        <div style="font-size: 15px; font-weight: 800; color: #64748b;">🔒 ${h.name}</div>
                        <div style="font-size: 11px; color: #475569;">Герой ещё не встречен в сюжете</div>
                    </div>
                </div>
            `;
            continue;
        }

        let curRole = storyState.heroAssignments[h.id] || 'AI';
        let isP1 = (curRole === 'P1');
        let isP2 = (is2P && curRole === 'P2');
        let isAI = (!isP1 && !isP2);

        html += `
            <div style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid ${h.color}; border-radius: 12px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                <div style="text-align: left; flex: 1; min-width: 170px;">
                    <div style="font-size: 16px; font-weight: 900; color: ${h.color};">${h.name}</div>
                    <div style="font-size: 11px; color: #94a3b8;">${h.desc}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="menu-btn" style="margin: 0; padding: 7px 11px; font-size: 11.5px; border-color: ${isP1 ? '#00ffcc' : '#475569'}; color: ${isP1 ? '#00ffcc' : '#94a3b8'}; background: ${isP1 ? 'rgba(0,255,204,0.18)' : 'rgba(255,255,255,0.04)'};" onclick="assignStoryHeroRole('${h.id}', 'P1')">
                        ${isP1 ? '✓ ' : ''}ИГРОК 1
                    </button>
                    ${is2P ? `
                    <button class="menu-btn" style="margin: 0; padding: 7px 11px; font-size: 11.5px; border-color: ${isP2 ? '#ffaa00' : '#475569'}; color: ${isP2 ? '#ffaa00' : '#94a3b8'}; background: ${isP2 ? 'rgba(255,170,0,0.18)' : 'rgba(255,255,255,0.04)'};" onclick="assignStoryHeroRole('${h.id}', 'P2')">
                        ${isP2 ? '✓ ' : ''}ИГРОК 2
                    </button>
                    ` : ''}
                    <div onclick="assignStoryHeroRole('${h.id}', 'AI')" title="Управление ИИ" style="cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; border: 1.5px solid ${isAI ? '#a855f7' : '#475569'}; background: ${isAI ? 'rgba(168,85,247,0.22)' : 'rgba(255,255,255,0.04)'}; color: ${isAI ? '#e9d5ff' : '#64748b'}; font-size: 12px; font-weight: 800; user-select: none;">
                        <span>ИИ</span>
                        <span style="display: inline-flex; width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid ${isAI ? '#c084fc' : '#475569'}; align-items: center; justify-content: center; background: ${isAI ? '#9333ea' : 'transparent'}; color: #fff; font-size: 12px;">
                            ${isAI ? '✓' : ''}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    listEl.innerHTML = html;
}
window.renderStoryHeroSelectList = renderStoryHeroSelectList;

// Global keyboard listener for [Tab] and [Space] while resting on a bench
if (typeof window !== 'undefined' && !window._storyBenchKeysBound) {
    window._storyBenchKeysBound = true;
    window.addEventListener('keydown', (e) => {
        if (!window.isStoryMode || !storyState.active || storyState.step !== 'BENCH_REST') return;
        if (e.code === 'Tab') {
            e.preventDefault();
            if (storyState.backpackOpen) closeStoryBackpackModal();
            else {
                if (storyState.heroSelectOpen) closeStoryHeroSelectModal();
                openStoryBackpackModal();
            }
        } else if (e.code === 'Space') {
            e.preventDefault();
            if (storyState.heroSelectOpen) closeStoryHeroSelectModal();
            else {
                if (storyState.backpackOpen) closeStoryBackpackModal();
                openStoryHeroSelectModal();
            }
        }
    });
}

// Update Forest Weather & Leaves
function updateForestAtmosphere() {
    let wind = Math.sin(Date.now() * 0.002) * 0.8;
    for (let leaf of storyState.leaves) {
        leaf.x += leaf.vx + wind;
        leaf.y += leaf.vy + Math.sin(Date.now() * 0.003 + leaf.x) * 0.3;
        leaf.rot += leaf.rotSpeed;
        if (leaf.x > STORY_CONFIG.ARENA_W + 50) {
            leaf.x = -50;
            leaf.y = -200 + Math.random() * (STORY_CONFIG.FLOOR + 200);
        }
        if (leaf.y > STORY_CONFIG.FLOOR + 20) {
            leaf.y = -220;
            leaf.x = Math.random() * STORY_CONFIG.ARENA_W;
        }
    }

    // Campfire sparks from logs at Bench 1 (3600, 350) and Bench 2 (1450, 850)
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
        storyState.campfireFlames.push({
            x: STORY_CONFIG.BENCH_2_X + 65 + (Math.random() * 16 - 8),
            y: STORY_CONFIG.BENCH_2_Y - 12,
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

// --- RENDERING 3-TIER STORY WORLD ---
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

    // Translate 2D Camera
    ctx.translate(-camX, -camY);

    // 1. Night Sky & Underground Cavern Background
    let skyGrad = ctx.createLinearGradient(camX, camY, camX, camY + GAME_HEIGHT);
    if (camY > 240) {
        skyGrad.addColorStop(0, "#030712");
        skyGrad.addColorStop(0.6, "#090d1a");
        skyGrad.addColorStop(1, "#051218");
    } else {
        skyGrad.addColorStop(0, "#020617");
        skyGrad.addColorStop(0.65, "#0b152e");
        skyGrad.addColorStop(1, "#071026");
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(camX, camY, GAME_WIDTH, GAME_HEIGHT);

    // 2. Stars (visible in upper & middle sky)
    if (camY < 260) {
        ctx.save();
        for (let s of storyState.stars) {
            let a = s.alpha + Math.sin(Date.now() * s.twinkleSpeed) * 0.25;
            ctx.fillStyle = `rgba(240, 248, 255, ${Math.max(0.1, a)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 3. The Moon
        let moonX = camX + 420;
        let moonY = camY * 0.4 + 85;
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
    }

    // 4. Distant Forest Trees Silhouette (on Middle Tier)
    drawForestTrees(camX);

    // 5. Render 3-Tier World Geometry:
    // 5a. Middle Tier Ground (X: 0..3820, Y: 350..490)
    ctx.fillStyle = "#070b14";
    ctx.fillRect(0, STORY_CONFIG.FLOOR, 3820, 130);
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, STORY_CONFIG.FLOOR);
    ctx.lineTo(3820, STORY_CONFIG.FLOOR);
    ctx.stroke();

    // Left Wall of Floor 1 (X = -42..0, Y = 0..398)
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.fillRect(-42, 0, 42, 398);
    ctx.strokeRect(-42, 0, 42, 398);

    // 5b. Water Pond right of Bench 1 (X: 3820..4500, Y: 355..445)
    drawStoryWaterPond();

    // 5c. Mossy Platforms & Upper Tier Roof (Floor 2: X = -150..3820, Y = -25)
    drawStoryMossyPlatformsAndRoof();

    // 5d. Left Cliff Shaft & Lower Underground Tier (Floor 3: X = -480..3200, Y = 850)
    drawStoryUndergroundTier();

    // 6. Swaying Grass Blades along Floor 1
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

    // 6b. Rich Environment Assets (Animated Blue Flowers, Swaying Plants 1..3, Comp Plants, Boulders, Slimes)
    drawStoryEnvironmentAssets();

    // 7. Ancient Altar with Violet Light (at x = 2000, y = 350)
    drawStoryAltar(STORY_CONFIG.ALTAR_X);

    // 8. Campfire & Resting Benches (Bench 1 at 3600,350 and Bench 2 at 1450,850)
    drawStoryCampfireAndBench(STORY_CONFIG.BENCH_X, STORY_CONFIG.FLOOR);
    drawStoryCampfireAndBench(STORY_CONFIG.BENCH_2_X, STORY_CONFIG.BENCH_2_Y);

    // 8b. Gates of the Trials at X = 1850, Y = 850
    drawStoryTrialsGate(STORY_CONFIG.TRIALS_GATE_X, STORY_CONFIG.TRIALS_GATE_Y);

    // 8c. Waiting NPCs (Air 💨 before meeting, Earth 🌿 before meeting) & Dialogue Bubbles
    drawStoryAirAndEarthNPCs();

    // 9. Water Guardian Mini-Boss
    if (storyState.guardian) {
        drawStoryGuardianObj(storyState.guardian);
    }

    // 9b. The 4-Stage Trials Arena (Overseer, Logic Maze, Mannequins, Targets, Demon Boss)
    drawStoryTrials();

    // 10. Players & Party Members
    let p = players[0];
    if (p) {
        if (storyState.isLyingDown) {
            drawLyingWaterPlayer(p.x, STORY_CONFIG.FLOOR);
        } else if (storyState.step === 'BENCH_REST') {
            let bId = storyState.activeBenchId || 1;
            let bx = (bId === 2) ? STORY_CONFIG.BENCH_2_X : STORY_CONFIG.BENCH_X;
            let by = (bId === 2) ? STORY_CONFIG.BENCH_2_Y : STORY_CONFIG.FLOOR;
            drawSittingPartyOnBench(bx, by);
        } else {
            for (let pl of players) {
                if (pl) drawPlayer(pl);
            }
        }
    }

    // 11. Flying Forest Leaves
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

        if (storyState.title1Alpha > 0) {
            ctx.textAlign = "center";
            ctx.fillStyle = `rgba(255, 255, 255, ${storyState.title1Alpha})`;
            ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
            ctx.shadowColor = "#a855f7";
            ctx.shadowBlur = 15;
            ctx.fillText("Сила демона получена", canvas.width / 2, canvas.height / 2 - 20);
        }

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

    // 15. Health Masks (Lives)
    if (!storyState.step.startsWith('TITLE') && !storyState.step.startsWith('LIGHTNING') && storyState.blackAlpha < 0.8 && typeof drawMasks === 'function') {
        drawMasks();
    }

    // 16. Screen-Space Story HUD & Objective Prompts
    drawStoryScreenHUD();
}
window.drawStoryMode = drawStoryMode;

// Draw Swimmable Water Pond right of Bench 1 (X: 3820..4500, Y: 355..445)
function drawStoryWaterPond() {
    ctx.save();
    let x1 = STORY_CONFIG.POND_X1;
    let x2 = STORY_CONFIG.POND_X2;
    let w = x2 - x1;
    let waterTop = STORY_CONFIG.FLOOR + 6;
    let waterBot = 445;

    // Deep water gradient
    let wGrad = ctx.createLinearGradient(x1, waterTop, x1, waterBot);
    wGrad.addColorStop(0, "rgba(14, 165, 233, 0.58)");
    wGrad.addColorStop(0.6, "rgba(2, 132, 199, 0.78)");
    wGrad.addColorStop(1, "rgba(12, 74, 110, 0.95)");
    ctx.fillStyle = wGrad;
    ctx.fillRect(x1, waterTop, w, waterBot - waterTop);

    // Animated shimmering surface waves
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let t = Date.now() * 0.005;
    for (let x = x1; x <= x2; x += 16) {
        let wy = waterTop + Math.sin(t + x * 0.04) * 3;
        if (x === x1) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
    }
    ctx.stroke();

    // Pond stone basin floor, left stone shore bank, & right cliff wall
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x1 - 24, STORY_CONFIG.FLOOR, 26, waterBot - STORY_CONFIG.FLOOR + 45);
    ctx.fillRect(x1, waterBot, w, 45);
    ctx.fillRect(x2, -380, 60, 870);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.strokeRect(x1 - 24, STORY_CONFIG.FLOOR, 24, waterBot - STORY_CONFIG.FLOOR + 45);
    ctx.strokeRect(x2, -380, 60, 870);
    ctx.restore();
}

// Draw the 3 Solid Green Mossy Platforms and the Upper Tier Roof (Floor 2)
function drawStoryMossyPlatformsAndRoof() {
    if (!platforms) return;
    ctx.save();
    for (let plat of platforms) {
        if (!plat.mossy) continue;
        // Solid stone core
        ctx.fillStyle = "#14261c";
        ctx.strokeStyle = "#166534";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();
        ctx.stroke();

        // Lush emerald moss top layer
        ctx.fillStyle = "#22c55e";
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, 6, [6, 6, 0, 0]);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Hanging moss vines under the platform
        ctx.strokeStyle = "#15803d";
        ctx.lineWidth = 1.5;
        for (let vx = plat.x + 12; vx < plat.x + plat.w - 10; vx += 28) {
            let vh = 6 + ((vx * 7) % 9);
            ctx.beginPath();
            ctx.moveTo(vx, plat.y + plat.h);
            ctx.lineTo(vx, plat.y + plat.h + vh);
            ctx.stroke();
        }
    }
    ctx.restore();
}

// Draw Left Cliff Shaft and Lower Underground Tier (Floor 3 at Y = 850)
function drawStoryUndergroundTier() {
    ctx.save();
    // Far-left shaft wall (X = -520..-480)
    ctx.fillStyle = "#090f1d";
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.fillRect(-520, -380, 40, 1290);
    ctx.strokeRect(-520, -380, 40, 1290);

    // Ceiling rock of the underground cavern (under Floor 1, X = -40..3200, Y = 480..540)
    ctx.fillStyle = "#060a14";
    ctx.fillRect(-40, 480, 3240, 55);
    ctx.strokeStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(-40, 535);
    ctx.lineTo(3200, 535);
    ctx.stroke();

    // Lower Underground Floor 3 (X = -480..3200, Y = 850)
    ctx.fillStyle = "#080f1a";
    ctx.fillRect(-480, STORY_CONFIG.LOWER_FLOOR, 3680, 90);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-480, STORY_CONFIG.LOWER_FLOOR);
    ctx.lineTo(3200, STORY_CONFIG.LOWER_FLOOR);
    ctx.stroke();
    ctx.restore();
}

// Draw Air (💨) and Earth (🌿) waiting NPCs & Speech Bubbles
function drawStoryAirAndEarthNPCs() {
    ctx.save();
    let bob = Math.sin(Date.now() * 0.005) * 3;

    // 1. Air NPC on Upper Tier (X = 1800, Y = -25) before meeting
    if (!storyState.airMet) {
        let ax = STORY_CONFIG.AIR_NPC_X;
        let ay = STORY_CONFIG.AIR_NPC_Y;
        if (!window.storyAirNpcDummy) {
            window.storyAirNpcDummy = createPlayer(-91, 'AIR', {}, 'AI', ax);
            window.storyAirNpcDummy.facingRight = false;
            window.storyAirNpcDummy.stance = 'LIGHT';
            window.storyAirNpcDummy.hp = 5;
            window.storyAirNpcDummy.maxHp = 5;
        }
        window.storyAirNpcDummy.x = ax - 15;
        window.storyAirNpcDummy.y = ay - 50;
        window.storyAirNpcDummy.onGround = true;
        window.storyAirNpcDummy.vx = Math.sin(Date.now() * 0.002) * 0.15;
        drawPlayer(window.storyAirNpcDummy);

        ctx.fillStyle = "#7dd3fc";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8;
        ctx.fillText("💨 Воздух", ax, ay - 68 + bob);
        ctx.shadowBlur = 0;
    }

    // Air Dialogue Bubble ("Хей, дружище, пошли вместе!")
    if (storyState.airDialogueTimer > 0) {
        let airPl = players.find(pl => pl && pl.type === 'AIR');
        let bx = airPl ? airPl.x : STORY_CONFIG.AIR_NPC_X;
        let by = airPl ? airPl.y - 28 : STORY_CONFIG.AIR_NPC_Y - 78;
        ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(bx - 120, by - 30, 240, 28, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f0f9ff";
        ctx.font = "bold 12.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💨 «Хей, дружище, пошли вместе!»", bx, by - 11);
    }

    // 2. Earth NPC on Lower Underground Tier (X = 1100, Y = 850) before meeting
    if (!storyState.earthMet) {
        let ex = STORY_CONFIG.EARTH_NPC_X;
        let ey = STORY_CONFIG.EARTH_NPC_Y;
        if (!window.storyEarthNpcDummy) {
            window.storyEarthNpcDummy = createPlayer(-92, 'EARTH', {}, 'AI', ex);
            window.storyEarthNpcDummy.facingRight = true;
            window.storyEarthNpcDummy.stance = 'LIGHT';
            window.storyEarthNpcDummy.hp = 5;
            window.storyEarthNpcDummy.maxHp = 5;
        }
        window.storyEarthNpcDummy.x = ex - 15;
        window.storyEarthNpcDummy.y = ey - 50;
        window.storyEarthNpcDummy.onGround = true;
        drawPlayer(window.storyEarthNpcDummy);

        ctx.fillStyle = "#86efac";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#4ade80";
        ctx.shadowBlur = 8;
        ctx.fillText("🌿 Земля", ex, ey - 68 + bob);
        ctx.shadowBlur = 0;
    }

    // Earth Dialogue Bubble ("Вы чего так долго? Я вас уже заждалась!")
    if (storyState.earthDialogueTimer > 0) {
        let earthPl = players.find(pl => pl && pl.type === 'EARTH');
        let bx = earthPl ? earthPl.x : STORY_CONFIG.EARTH_NPC_X;
        let by = earthPl ? earthPl.y - 34 : STORY_CONFIG.EARTH_NPC_Y - 84;
        ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(bx - 155, by - 32, 310, 30, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#dcfce7";
        ctx.font = "bold 12.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🌿 «Вы чего так долго? Я вас уже заждалась!»", bx, by - 13);
    }

    ctx.restore();
}

// Draw Ancient Gates of the Trials at X = 1850, Y = 850
function drawStoryTrialsGate(gx, floorY) {
    ctx.save();
    let gateY = (typeof storyState !== 'undefined' && storyState.trialsGateY !== undefined) ? storyState.trialsGateY : 420;

    // 1. Mystical Portal Mist in Archway Recess
    let runesActive = (storyState.airMet && storyState.earthMet);
    if (runesActive) {
        let portalGrad = ctx.createLinearGradient(gx, floorY - 260, gx, floorY);
        portalGrad.addColorStop(0, "rgba(56, 189, 248, 0.45)");
        portalGrad.addColorStop(0.5, "rgba(147, 51, 234, 0.35)");
        portalGrad.addColorStop(1, "rgba(15, 23, 42, 0.15)");
        ctx.fillStyle = portalGrad;
        ctx.fillRect(gx - 4, floorY - 260, 64, 260);

        // Swirling portal runes / particles
        ctx.fillStyle = "#38bdf8";
        let t = Date.now() * 0.003;
        for (let i = 0; i < 4; i++) {
            let py = floorY - 40 - ((Date.now() * 0.06 + i * 55) % 200);
            let px = gx + 28 + Math.sin(t + i) * 18;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 2. Majestic Stone Gate Arch & Pillars
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.5;
    // Left Pillar
    ctx.fillRect(gx - 26, floorY - 260, 24, 260);
    ctx.strokeRect(gx - 26, floorY - 260, 24, 260);
    // Right Pillar
    ctx.fillRect(gx + 58, floorY - 260, 24, 260);
    ctx.strokeRect(gx + 58, floorY - 260, 24, 260);
    // Top Arch Lintel
    ctx.fillRect(gx - 32, floorY - 280, 120, 26);
    ctx.strokeRect(gx - 32, floorY - 280, 120, 26);

    // Glowing Trial Runes
    ctx.fillStyle = runesActive ? "#fbbf24" : "#64748b";
    ctx.shadowColor = runesActive ? "#f59e0b" : "transparent";
    ctx.shadowBlur = runesActive ? 12 : 0;
    ctx.font = "bold 12.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⛩️ ВРАТА ИСПЫТАНИЙ", gx + 28, floorY - 295);

    if (!storyState.inTrials && (!storyTrials || !storyTrials.trialsCleared)) {
        if (storyState.nearTrialsGate && runesActive) {
            // Interactive prompt box when standing at gate
            ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2;
            let bw = 260, bh = 30;
            ctx.beginPath();
            ctx.roundRect(gx + 28 - bw / 2, floorY - 330, bw, bh, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#fef08a";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText("[ВНИЗ / S] Войти в Зал Испытаний ⛩️", gx + 28, floorY - 310);
        } else {
            ctx.font = "11px sans-serif";
            ctx.fillStyle = runesActive ? "#86efac" : "#94a3b8";
            ctx.fillText(runesActive ? "«Врата активны — подойдите и нажмите [Вниз]»" : "(Соберите команду на скамейке)", gx + 28, floorY - 312);
        }
    }
    ctx.restore();
}

// Draw Forest Trees Silhouette
function drawForestTrees(cx) {
    ctx.save();
    ctx.fillStyle = "#091224";
    for (let tx = 0; tx < 3800; tx += 180) {
        if (tx < cx - 100 || tx > cx + GAME_WIDTH + 100) continue;
        let trunkW = 28 + (tx % 20);
        let h = 180 + (tx % 60);
        ctx.fillRect(tx, STORY_CONFIG.FLOOR - h, trunkW, h);
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
    ctx.fillStyle = "#2255cc";
    ctx.beginPath();
    ctx.roundRect(0, 0, 48, 14, 6);
    ctx.fill();

    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(6, 7, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(14, 7);
    ctx.lineTo(44, 7);
    ctx.stroke();
    ctx.restore();
}

// Draw ALL unlocked party members sitting together on the wooden bench by the campfire!
function drawSittingPartyOnBench(bx, floorY) {
    let count = players.length;
    for (let idx = 0; idx < count; idx++) {
        let pl = players[idx];
        if (!pl) continue;
        let offsetX = (count === 1) ? -10 : (-26 + idx * 22);
        if (pl.type === 'WATER') {
            drawSittingWaterPlayer(bx + offsetX + 10, floorY, pl.stance);
        } else {
            drawSittingCompanionOnBench(bx + offsetX, floorY, pl.type);
        }
    }
}

function drawSittingCompanionOnBench(sitX, floorY, heroType) {
    ctx.save();
    let breathe = Math.sin(Date.now() * 0.003 + (heroType === 'AIR' ? 1 : 2)) * 1.2;
    let sitY = floorY - 24;
    let isAir = (heroType === 'AIR');
    let cloakColor = isAir ? "#64748b" : "#15803d";
    let headColor  = isAir ? "#f1f5f9" : "#4ade80";
    let trimColor  = isAir ? "#38bdf8" : "#86efac";

    ctx.fillStyle = cloakColor;
    ctx.beginPath();
    ctx.roundRect(sitX - 9, sitY - 20 + breathe, 22, 20, [7, 7, 4, 4]);
    ctx.fill();

    ctx.fillStyle = headColor;
    ctx.shadowColor = trimColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sitX + 2, sitY - 26 + breathe, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Draw Water sitting comfortably on the wooden bench by the campfire
function drawSittingWaterPlayer(bx, floorY, stance) {
    ctx.save();
    let isDemon = (stance === 'DEMON');
    let breathe = Math.sin(Date.now() * 0.003) * 1.2;
    let sitX = bx - 10;
    let sitY = floorY - 24;

    let firePulse = 0.5 + 0.3 * Math.sin(Date.now() * 0.009);
    let fireGlow = ctx.createRadialGradient(sitX + 15, sitY - 10, 4, sitX + 15, sitY - 10, 36);
    fireGlow.addColorStop(0, `rgba(245, 158, 11, ${firePulse * 0.45})`);
    fireGlow.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = fireGlow;
    ctx.beginPath();
    ctx.arc(sitX + 15, sitY - 10, 36, 0, Math.PI * 2);
    ctx.fill();

    let cloakColor = isDemon ? "#25003b" : "#2255cc";
    let trimColor = isDemon ? "#c084fc" : "#00ffff";
    let bodyColor = isDemon ? "#3a0055" : "#00e5ff";

    ctx.fillStyle = cloakColor;
    ctx.beginPath();
    ctx.roundRect(sitX - 10, sitY - 20 + breathe, 26, 20, [8, 8, 4, 4]);
    ctx.fill();

    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sitX - 8, sitY + breathe);
    ctx.lineTo(sitX + 14, sitY + breathe);
    ctx.stroke();

    ctx.fillStyle = isDemon ? "#1a0026" : "#172554";
    ctx.beginPath();
    ctx.roundRect(sitX + 2, sitY + 2, 7, 10, 3);
    ctx.roundRect(sitX + 9, sitY + 2, 7, 10, 3);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.shadowColor = trimColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sitX + 6, sitY - 26 + breathe, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sitX + 1, sitY - 32 + breathe);
    ctx.lineTo(sitX + 8, sitY - 37 + breathe);
    ctx.lineTo(sitX + 12, sitY - 29 + breathe);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isDemon ? "#f3e8ff" : "#ffffff";
    ctx.beginPath();
    ctx.ellipse(sitX + 9, sitY - 26 + breathe, 2, 1, 0.2, 0, Math.PI * 2);
    ctx.fill();

    if (isDemon) {
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

    if (!window.storyGuardianDummy) {
        window.storyGuardianDummy = createPlayer(-93, 'WATER', {}, 'AI', gx);
        window.storyGuardianDummy.stance = 'LIGHT';
    }
    window.storyGuardianDummy.x = gx - 15;
    window.storyGuardianDummy.y = gy;
    window.storyGuardianDummy.hp = g.hp;
    window.storyGuardianDummy.maxHp = g.maxHp;
    window.storyGuardianDummy.facingRight = (players[0] && players[0].x > gx);
    if (g.state === 'SLASH_WARN' || g.state === 'SLASH') {
        window.storyGuardianDummy.attackTimer = 16;
    } else {
        window.storyGuardianDummy.attackTimer = 0;
    }
    drawPlayer(window.storyGuardianDummy);

    if (g.hitFlash > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.beginPath();
        ctx.arc(gx, gy + 20, 24, 0, Math.PI * 2);
        ctx.fill();
    }

    if (g.state === 'SLASH_WARN') {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gx, gy + 30, 45, 0, Math.PI * 2);
        ctx.stroke();
    }

    let barW = 60;
    let hpW = Math.max(0, (g.hp / g.maxHp) * barW);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(gx - barW / 2, gy - 32, barW, 6);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(gx - barW / 2, gy - 32, hpW, 6);

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

// Draw Campfire and Resting Bench at any (bx, floorY)
function drawStoryCampfireAndBench(bx, floorY = STORY_CONFIG.FLOOR) {
    ctx.save();

    // 1. Cozy Wooden Bench (wider so all 3 heroes fit comfortably!)
    ctx.fillStyle = "#78350f";
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    ctx.fillRect(bx - 42, floorY - 24, 84, 7);
    ctx.fillRect(bx - 42, floorY - 42, 84, 7);
    ctx.fillRect(bx - 38, floorY - 24, 6, 24);
    ctx.fillRect(bx + 32, floorY - 24, 6, 24);
    ctx.fillRect(bx - 38, floorY - 42, 6, 18);
    ctx.fillRect(bx + 32, floorY - 42, 6, 18);

    // 2. Campfire with Stones & Wood Logs
    let fx = bx + 65;
    ctx.fillStyle = "#334155";
    for (let i = -16; i <= 16; i += 8) {
        ctx.beginPath();
        ctx.arc(fx + i, floorY - 3, 5, 0, Math.PI * 2);
        ctx.fill();
    }
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
        if (Math.abs(spark.y - floorY) > 120) continue;
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

    // Render DEMON_EXPOSED full-screen warning overlay if player failed to hide the Demon!
    if (storyState.step === 'DEMON_EXPOSED') {
        ctx.save();
        ctx.fillStyle = "rgba(18, 4, 28, 0.86)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        if (storyState.exposedQuote) {
            ctx.fillStyle = "#fde047";
            ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
            ctx.fillText(storyState.exposedQuote, canvas.width / 2, canvas.height / 2 - 48);
        }
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 22;
        ctx.font = "900 30px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("⚠️ ВАС РАСКРЫЛИ! ⚠️", canvas.width / 2, canvas.height / 2 - 6);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 15px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(storyState.exposedReason || "Вода должен скрывать силу Демона от всех!", canvas.width / 2, canvas.height / 2 + 28);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "13px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("Возвращение к последней точке сохранения...", canvas.width / 2, canvas.height / 2 + 56);
        ctx.restore();
        return;
    }

    // Render live Demon Aura Warning if Water switched to DEMON during exploration!
    if (storyState.demonAuraTimer && storyState.demonAuraTimer > 0) {
        let remSec = Math.max(0, (150 - storyState.demonAuraTimer) / 60).toFixed(1);
        ctx.save();
        let bw = 540;
        let bx = canvas.width / 2 - bw / 2;
        ctx.fillStyle = "rgba(88, 12, 45, 0.92)";
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(bx, 54, bw, 36, 10);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffe4e6";
        ctx.font = "bold 13.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`⚠️ СКРОЙТЕ ДЕМОНА [S]! Нельзя идти в этом облике! (${remSec} с)`, canvas.width / 2, 77);
        ctx.restore();
    }

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
            promptText = `✦ Водяная Капля усилена (+0.5 урона)! ${getControlPrompt('STANCE')}`;
            break;
        case 'GO_TO_BENCH':
            if (p) {
                if (Math.abs(p.x - STORY_CONFIG.BENCH_X) < 85 && Math.abs(p.y - (STORY_CONFIG.FLOOR - 50)) < 75) {
                    promptText = `✦ ${getDownPrompt()} — присесть на скамейку у костра (или идите направо к воде и паркуру →)`;
                } else if (Math.abs(p.x - STORY_CONFIG.BENCH_2_X) < 85 && Math.abs(p.y - (STORY_CONFIG.BENCH_2_Y - 50)) < 85) {
                    promptText = `✦ ${getDownPrompt()} — присесть всей командой у костра перед Испытаниями`;
                } else if (p.x > 3750 && p.y > 100 && p.y < 460) {
                    promptText = "✦ Заберитесь по зелёным моховым платформам наверх ↑ (снизу сквозь них прыгнуть нельзя!)";
                } else if (p.y < 40 && !storyState.airMet) {
                    promptText = "✦ Идите налево по верхнему ярусу ← (навстречу новому союзнику 💨)";
                } else if (p.y < 40 && storyState.airMet) {
                    promptText = "✦ Воздух 💨 в команде! Идите налево до края ← и прыгайте вместе вниз в обрыв!";
                } else if (p.y > 600 && !storyState.earthMet) {
                    promptText = "✦ Идите направо по подземелью → (там вас ждёт Земля 🌿)";
                } else if (p.y > 600 && storyState.earthMet) {
                    promptText = "✦ Земля 🌿 с вами! Присядьте на скамейку у костра справа → ([Tab] Рюкзак, [Пробел] Герои)";
                } else {
                    promptText = "✦ Демон скрыт. Идите направо к костру и паркуру над водой →";
                }
            }
            break;
        case 'BENCH_REST':
            promptText = "🔥 Отдых у костра (Сохранено ✓) • [Tab] Рюкзак/Карта | [Пробел] Выбор героев | [Движение] Встать | [Esc] Меню";
            break;
    }

    // In 2P Local mode before Air is met, show a subtle top-right notice for Player 2
    if (window.storyPlayerCount === 2 && !storyState.airMet) {
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "#ffaa00";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(canvas.width - 315, 12, 300, 26, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fde68a";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("👥 Игрок 2 вступит в игру при встрече с Воздухом 💨", canvas.width - 165, 29);
        ctx.restore();
    }

    if (promptText) {
        ctx.save();
        let bannerW = Math.min(760, canvas.width - 28);
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
        ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(promptText, canvas.width / 2, by + 22);
        ctx.restore();
    }
}

// Click/Tap on the prompt banner during BENCH_REST
if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', (e) => {
        if (!storyState.active || storyState.step !== 'BENCH_REST' || storyState.stepTimer <= 25) return;
        if (storyState.backpackOpen || storyState.heroSelectOpen) return;
        if (!canvas) return;
        let rect = canvas.getBoundingClientRect();
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;
        let canvasX = (e.clientX - rect.left) * scaleX;
        let canvasY = (e.clientY - rect.top) * scaleY;

        let bannerW = Math.min(760, canvas.width - 28);
        let by = canvas.height - 42;
        let bx = canvas.width / 2 - bannerW / 2;

        if (canvasY >= by && canvasY <= by + 34 && canvasX >= canvas.width / 2 + 180 && canvasX <= bx + bannerW + 15) {
            if (typeof returnFromStoryToMenu === 'function') {
                returnFromStoryToMenu();
            }
        }
    });
}

// ============================================================================
// --- RICH ENVIRONMENT ASSETS (FLOWERS, PLANTS, BOULDERS, SLIMES) ---
// ============================================================================
function drawStoryEnvironmentAssets() {
    if (!ctx) return;
    let now = Date.now();

    // 1. Blue Flowers along Floor 1 (Y = 350) and over pond platforms
    let flFrames = (typeof externalGameAssets !== 'undefined' && externalGameAssets.blueFlowers) ? externalGameAssets.blueFlowers : [];
    if (flFrames.length > 0) {
        let flowerCoords = [
            { x: 180, y: STORY_CONFIG.FLOOR - 32 },
            { x: 480, y: STORY_CONFIG.FLOOR - 32 },
            { x: 880, y: STORY_CONFIG.FLOOR - 32 },
            { x: 1320, y: STORY_CONFIG.FLOOR - 32 },
            { x: 1750, y: STORY_CONFIG.FLOOR - 32 },
            { x: 2280, y: STORY_CONFIG.FLOOR - 32 },
            { x: 2750, y: STORY_CONFIG.FLOOR - 32 },
            { x: 3350, y: STORY_CONFIG.FLOOR - 32 },
            { x: 3680, y: STORY_CONFIG.FLOOR - 32 },
            { x: 3980, y: 265 - 32 },
            { x: 4230, y: 165 - 32 },
            { x: 3970, y: 65 - 32 }
        ];
        flowerCoords.forEach((fc, idx) => {
            if (fc.x + 36 < camX || fc.x > camX + GAME_WIDTH) return;
            let fIdx = Math.floor(now / 120 + idx * 2) % flFrames.length;
            let img = flFrames[fIdx];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, fc.x, fc.y, 34, 34);
            }
        });
    }

    // 2. Animated Plants (Plant 1, 2, 3) along Roof / Upper Tier (Floor 2: Y = -25) and Floor 1
    let p1 = (typeof externalGameAssets !== 'undefined' && externalGameAssets.plants1) ? externalGameAssets.plants1 : [];
    let p2 = (typeof externalGameAssets !== 'undefined' && externalGameAssets.plants2) ? externalGameAssets.plants2 : [];
    let p3 = (typeof externalGameAssets !== 'undefined' && externalGameAssets.plants3) ? externalGameAssets.plants3 : [];
    let plantSpecs = [
        { frames: p1, x: 220, y: STORY_CONFIG.UPPER_FLOOR - 48, w: 46, h: 48, spd: 140 },
        { frames: p2, x: 740, y: STORY_CONFIG.UPPER_FLOOR - 50, w: 48, h: 50, spd: 130 },
        { frames: p3, x: 1380, y: STORY_CONFIG.UPPER_FLOOR - 46, w: 44, h: 46, spd: 150 },
        { frames: p1, x: 2150, y: STORY_CONFIG.UPPER_FLOOR - 48, w: 46, h: 48, spd: 140 },
        { frames: p2, x: 2890, y: STORY_CONFIG.UPPER_FLOOR - 50, w: 48, h: 50, spd: 130 },
        { frames: p3, x: 3450, y: STORY_CONFIG.UPPER_FLOOR - 46, w: 44, h: 46, spd: 150 },
        { frames: p1, x: 620, y: STORY_CONFIG.FLOOR - 44, w: 42, h: 44, spd: 130 },
        { frames: p2, x: 1560, y: STORY_CONFIG.FLOOR - 46, w: 44, h: 46, spd: 145 },
        { frames: p3, x: 3120, y: STORY_CONFIG.FLOOR - 44, w: 42, h: 44, spd: 135 }
    ];
    plantSpecs.forEach((ps, idx) => {
        if (ps.x + ps.w < camX || ps.x > camX + GAME_WIDTH) return;
        if (ps.frames && ps.frames.length > 0) {
            let fIdx = Math.floor(now / ps.spd + idx * 3) % ps.frames.length;
            let img = ps.frames[fIdx];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, ps.x, ps.y, ps.w, ps.h);
            }
        }
    });

    // 3. Animated Comp Plants in Underground Cavern & Trials Hall
    let compFrames = (typeof externalGameAssets !== 'undefined' && externalGameAssets.compPlants) ? externalGameAssets.compPlants : [];
    if (compFrames.length > 0) {
        let compCoords = [
            { x: 380, y: STORY_CONFIG.LOWER_FLOOR - 52, w: 50, h: 52 },
            { x: 890, y: STORY_CONFIG.LOWER_FLOOR - 52, w: 50, h: 52 },
            { x: 1380, y: STORY_CONFIG.LOWER_FLOOR - 52, w: 50, h: 52 },
            { x: 1680, y: STORY_CONFIG.LOWER_FLOOR - 52, w: 50, h: 52 },
            { x: 2040, y: STORY_CONFIG.LOWER_FLOOR - 52, w: 50, h: 52 },
            { x: 2950, y: STORY_CONFIG.LOWER_FLOOR - 52, w: 50, h: 52 }
        ];
        compCoords.forEach((cp, idx) => {
            if (cp.x + cp.w < camX || cp.x > camX + GAME_WIDTH) return;
            let fIdx = Math.floor(now / 110 + idx * 2) % compFrames.length;
            let img = compFrames[fIdx];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, cp.x, cp.y, cp.w, cp.h);
            }
        });
    }

    // 4. Cave Boulders (Floor 3 and cliff base)
    let bldrs = (typeof externalGameAssets !== 'undefined' && externalGameAssets.boulders) ? externalGameAssets.boulders : [];
    if (bldrs.length > 0) {
        let boulderCoords = [
            { imgIdx: 0, x: -440, y: STORY_CONFIG.LOWER_FLOOR - 44, w: 60, h: 44 },
            { imgIdx: 1, x: -210, y: STORY_CONFIG.LOWER_FLOOR - 40, w: 55, h: 40 },
            { imgIdx: 2, x: 240, y: STORY_CONFIG.LOWER_FLOOR - 48, w: 64, h: 48 },
            { imgIdx: 0, x: 760, y: STORY_CONFIG.LOWER_FLOOR - 42, w: 58, h: 42 },
            { imgIdx: 1, x: 1280, y: STORY_CONFIG.LOWER_FLOOR - 44, w: 60, h: 44 },
            { imgIdx: 2, x: 1720, y: STORY_CONFIG.LOWER_FLOOR - 46, w: 62, h: 46 },
            { imgIdx: 0, x: 2110, y: STORY_CONFIG.LOWER_FLOOR - 44, w: 60, h: 44 },
            { imgIdx: 1, x: 2980, y: STORY_CONFIG.LOWER_FLOOR - 44, w: 60, h: 44 }
        ];
        boulderCoords.forEach(b => {
            if (b.x + b.w < camX || b.x > camX + GAME_WIDTH) return;
            let img = bldrs[b.imgIdx];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, b.x, b.y, b.w, b.h);
            }
        });
    }

    // 5. Animated Slimes in Cavern & Pond
    let slimes = (typeof externalGameAssets !== 'undefined' && externalGameAssets.slimes) ? externalGameAssets.slimes : [];
    if (slimes.length > 0) {
        let slimeCoords = [
            { x: -90, y: STORY_CONFIG.LOWER_FLOOR - 28, w: 32, h: 28 },
            { x: 520, y: STORY_CONFIG.LOWER_FLOOR - 28, w: 32, h: 28 },
            { x: 4360, y: 445 - 28, w: 32, h: 28 }
        ];
        slimeCoords.forEach((sl, idx) => {
            if (sl.x + sl.w < camX || sl.x > camX + GAME_WIDTH) return;
            let fIdx = Math.floor(now / 120 + idx * 3) % slimes.length;
            let img = slimes[fIdx];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, sl.x, sl.y, sl.w, sl.h);
            }
        });
    }
}

// ============================================================================
// --- 4-STAGE TRIALS SYSTEM (ЗАЛ ИСПЫТАНИЙ) ---
// ============================================================================
let storyTrials = {
    active: false,
    state: 'IDLE', // 'IDLE', 'WAITING_FOR_CENTER', 'IN_STAGE'
    stage: 0, // 0 = not started, 1 = mannequins, 2 = maze, 3 = targets, 4 = demon boss, 5 = cleared
    warnings: 0, // 0..3
    stageTimer: 0,
    centerReadyTimer: 0,
    inCenterCount: 0,
    announcement: "",
    announcementTimer: 0,
    announcementColor: "#38bdf8",
    noticeText: "",
    noticeTimer: 0,
    warningRestarting: false,
    stageStartHp: {},
    overseerText: "",
    overseerTimer: 0,
    // Stage 1 & 2
    mannequins: [],
    // Stage 2
    mazeWallBroken: false,
    mazeTargetHit: false,
    mazeDropGuide: null,
    // Stage 3
    targets: [],
    targetTimer: 600,
    // Stage 4
    demon: null,
    trialsCleared: false,
    particles: []
};

function showStoryTrialNotice(text) {
    storyTrials.noticeText = text;
    storyTrials.noticeTimer = 110;
}

function enterStoryTrialsViaGate() {
    if (storyTrials.active) return;
    playSound('lightChime');
    playSound('parry');
    triggerShake(6, 12);
    flashAlpha = 0.6;

    // Teleport party into the arena chamber (X = 5000..6000, Y = 470..870)
    if (players[0]) { players[0].x = 5120; players[0].y = 850 - 50; players[0].vx = 0; players[0].vy = 0; }
    if (players[1]) { players[1].x = 5070; players[1].y = 850 - 50; players[1].vx = 0; players[1].vy = 0; }
    if (players[2]) { players[2].x = 5020; players[2].y = 850 - 50; players[2].vx = 0; players[2].vy = 0; }

    // Instant camera snap to show the entire 1000x400 arena in 1 single frame!
    camX = 5000;
    camY = 470;

    storyState.inTrials = true;
    storyTrials.active = true;
    storyTrials.state = 'WAITING_FOR_CENTER';
    storyTrials.stage = 0;
    storyTrials.warnings = 0;
    storyTrials.trialsCleared = false;
    storyTrials.centerReadyTimer = 0;
    storyTrials.inCenterCount = 0;
    storyState.trialsWeaponGranted = false;
    platforms.filter(p => p.isTrialsArenaWall).forEach(p => p.solid = true);

    // Ensure maze platforms are inactive initially
    let mb1 = platforms.find(p => p.isMazeBase1);
    let mb2 = platforms.find(p => p.isMazeBase2);
    let mr = platforms.find(p => p.isMazeRoof);
    if (mb1) mb1.solid = false;
    if (mb2) mb2.solid = false;
    if (mr) mr.solid = false;

    storyTrials.announcement = "⛩️ ВСТАНЬТЕ ВСЕМ ОТРЯДОМ В ЦЕНТР АРЕНЫ";
    storyTrials.announcementColor = "#38bdf8";
    storyTrials.announcementTimer = 300;
    storyTrials.overseerText = "Распорядитель: «Приветствую вас! Чтобы начать Испытания, встаньте всем отрядом в центр круга!»";
    storyTrials.overseerTimer = 320;
}
window.enterStoryTrialsViaGate = enterStoryTrialsViaGate;

function startStoryTrials() {
    enterStoryTrialsViaGate();
}

function startStoryTrialsStage(stageNum, isRestart) {
    storyTrials.stage = stageNum;
    storyTrials.state = 'IN_STAGE';
    storyTrials.stageTimer = 0;
    storyTrials.warningRestarting = false;

    if (!isRestart) {
        for (let pl of players) {
            if (pl) storyTrials.stageStartHp[pl.id] = pl.hp;
        }
    }

    // Toggle Maze platforms solid ONLY in Stage 2!
    let mb1 = platforms.find(p => p.isMazeBase1);
    let mb2 = platforms.find(p => p.isMazeBase2);
    let mr = platforms.find(p => p.isMazeRoof);
    if (mb1) mb1.solid = (stageNum === 2);
    if (mb2) mb2.solid = (stageNum === 2);
    if (mr) mr.solid = (stageNum === 2);

    if (stageNum === 1) {
        storyTrials.announcement = "ЭТАП 1: ТРЕНИРОВОЧНЫЕ МАНЕКЕНЫ";
        storyTrials.announcementColor = "#38bdf8";
        storyTrials.announcementTimer = 180;
        storyTrials.mannequins = [
            { id: 1, x: 5120, y: 850, vx: 0, vy: 0, hp: 5, maxHp: 5, width: 30, height: 50, facingRight: true, state: 'WALK', strikeTimer: 0, strikeCooldown: 40, hitFlash: 0 },
            { id: 2, x: 5880, y: 850, vx: 0, vy: 0, hp: 5, maxHp: 5, width: 30, height: 50, facingRight: false, state: 'WALK', strikeTimer: 0, strikeCooldown: 60, hitFlash: 0 }
        ];
    } else if (stageNum === 2) {
        storyTrials.announcement = "ЭТАП 2: ЛАБИРИНТ И МИШЕНЬ";
        storyTrials.announcementColor = "#38bdf8";
        storyTrials.announcementTimer = 180;
        storyTrials.overseerText = "Распорядитель: «Разбейте серую стену снизу и направьте каплю Воды (X+F) в мишень! И держите оборону!»";
        storyTrials.overseerTimer = 260;
        storyTrials.mazeWallBroken = false;
        storyTrials.mazeTargetHit = false;
        storyTrials.mazeDropGuide = null;
        playSound('breakStone');
        triggerShake(5, 8);
        for (let k = 0; k < 15; k++) {
            storyTrials.particles.push({
                x: 5480 + (Math.random() - 0.5) * 200,
                y: 530 + Math.random() * 50,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3,
                color: "#64748b",
                size: 3 + Math.random() * 3,
                timer: 40
            });
        }
        storyTrials.mannequins = [
            { id: 3, x: 5780, y: 850, vx: 0, vy: 0, hp: 5, maxHp: 5, width: 30, height: 50, facingRight: false, state: 'WALK', strikeTimer: 0, strikeCooldown: 50, hitFlash: 0 }
        ];
    } else if (stageNum === 3) {
        storyTrials.announcement = "ЭТАП 3: СКОРОСТНЫЕ МИШЕНИ (10 СЕКУНД)";
        storyTrials.announcementColor = "#f59e0b";
        storyTrials.announcementTimer = 180;
        storyTrials.overseerText = "Распорядитель: «Уничтожьте все 5 мишеней за 10 секунд! Не успеете — получите предупреждение!»";
        storyTrials.overseerTimer = 240;
        storyTrials.targetTimer = 600; // 10 sec @ 60 FPS
        storyTrials.targets = [
            { id: 1, x: 5080, y: 815, r: 16, hp: 1 },
            { id: 2, x: 5245, y: 690, r: 16, hp: 1 },
            { id: 3, x: 5500, y: 495, r: 16, hp: 1 },
            { id: 4, x: 5745, y: 690, r: 16, hp: 1 },
            { id: 5, x: 5920, y: 815, r: 16, hp: 1 }
        ];
    } else if (stageNum === 4) {
        storyTrials.announcement = "ЭТАП 4: ИСПЫТАТЕЛЬНЫЙ ДЕМОН";
        storyTrials.announcementColor = "#c084fc";
        storyTrials.announcementTimer = 200;
        storyTrials.overseerText = "Распорядитель: «Финальное испытание! Одолейте Испытательного Демона! Берегитесь напрыгивания!»";
        storyTrials.overseerTimer = 280;
        storyTrials.demon = {
            x: 5780,
            y: 850 - 80,
            vx: 0,
            vy: 0,
            width: 50,
            height: 80,
            hp: 20,
            maxHp: 20,
            facingRight: false,
            state: 'WALK', // WALK, WINDUP_LEAP, LEAP, SLAM, WINDUP_POWER, POWER_WAVE
            stateTimer: 60,
            attackCooldown: 80,
            hitFlash: 0,
            shockwaves: [],
            powerWaves: []
        };
    }
}

function triggerStoryTrialWarning(reason) {
    if (storyTrials.warningRestarting) return;
    storyTrials.warningRestarting = true;
    storyTrials.warnings++;
    playSound('damage');
    triggerShake(10, 16);

    if (storyTrials.warnings >= 3) {
        storyTrials.announcement = "💀 ПРОВАЛ ИСПЫТАНИЙ (3/3 предупреждений)!";
        storyTrials.announcementColor = "#ef4444";
        storyTrials.announcementTimer = 220;
        setTimeout(() => {
            storyTrials.warnings = 0;
            storyTrials.active = false;
            storyState.inTrials = false;
            storyState.trialsStage = 0;
            storyState.trialsGateY = 220;
            let gp = platforms.find(p => p.isTrialsGate);
            if (gp) gp.y = 220;
            respawnPlayerAtStoryCheckpoint();
            storyTrials.warningRestarting = false;
        }, 2200);
    } else {
        storyTrials.announcement = `⚠️ ПРЕДУПРЕЖДЕНИЕ (${storyTrials.warnings}/3)! ${reason} Перезапуск этапа...`;
        storyTrials.announcementColor = "#f59e0b";
        storyTrials.announcementTimer = 180;
        setTimeout(() => {
            for (let pl of players) {
                if (pl) {
                    let saved = storyTrials.stageStartHp[pl.id] || 3;
                    pl.hp = Math.max(2.5, saved);
                    pl.isDowned = false;
                    pl.invuln = 60;
                }
            }
            startStoryTrialsStage(storyTrials.stage, true);
        }, 1800);
    }
}

function completeStoryTrialsStage() {
    playSound('heal');
    playSound('lightChime');
    triggerShake(5, 10);

    // Timur: "зато после каждого выполеного этапа им востонавливают по одному хп каждому"
    for (let pl of players) {
        if (pl) pl.hp = Math.min(pl.maxHp, pl.hp + 1.0);
    }

    let st = storyTrials.stage;
    storyTrials.announcement = `✨ ЭТАП ${st} ПРОЙДЕН! +1 HP ВСЕМ ГЕРОЯМ 💚`;
    storyTrials.announcementColor = "#4ade80";
    storyTrials.announcementTimer = 180;

    if (st === 2) {
        // Retract maze platforms when Stage 2 is cleared!
        let mb1 = platforms.find(p => p.isMazeBase1);
        let mb2 = platforms.find(p => p.isMazeBase2);
        let mr = platforms.find(p => p.isMazeRoof);
        if (mb1) mb1.solid = false;
        if (mb2) mb2.solid = false;
        if (mr) mr.solid = false;
    }

    if (st < 4) {
        setTimeout(() => {
            if (storyTrials.active) {
                startStoryTrialsStage(st + 1, false);
            }
        }, 2200);
    } else {
        storyTrials.stage = 5;
        storyTrials.trialsCleared = true;
        storyTrials.overseerText = "Распорядитель: «Невероятно! Вы прошли все четыре ступени Испытаний! Ваша сила и слаженность доказаны! Портал выхода открыт!»";
        storyTrials.overseerTimer = 360;
        storyTrials.announcement = "🏆 ВСЕ ИСПЫТАНИЯ ПРОЙДЕНЫ! ВЫХОД В ПОДЗЕМЕЛЬЕ ОТКРЫТ! ⛩️";
        storyTrials.announcementColor = "#fde047";
        storyTrials.announcementTimer = 320;
        playSound('bladeSpin');
        playSound('lightChime');
        platforms.filter(p => p.isTrialsArenaWall).forEach(p => p.solid = false);
    }
}

function updateStoryTrials() {
    if (!storyTrials.active) return;
    storyTrials.stageTimer++;

    if (storyTrials.announcementTimer > 0) storyTrials.announcementTimer--;
    if (storyTrials.noticeTimer > 0) storyTrials.noticeTimer--;
    if (storyTrials.overseerTimer > 0) storyTrials.overseerTimer--;

    // Exit portal teleportation back to Floor 3 corridor outside the Arch Gate
    if (storyTrials.trialsCleared) {
        let p1 = players[0];
        if (p1 && p1.x >= 5860) {
            playSound('lightChime');
            playSound('parry');
            triggerShake(6, 12);
            flashAlpha = 0.5;
            for (let idx = 0; idx < players.length; idx++) {
                let pl = players[idx];
                if (pl) {
                    pl.x = 1920 + idx * 30;
                    pl.y = 800;
                    pl.vx = 0;
                    pl.vy = 0;
                }
            }
            storyTrials.active = false;
            storyState.inTrials = false;
            camX = 1450;
            camY = 470;
            return;
        }
    }

    // 0. Waiting for all 3 heroes to assemble in the center circle (X = 5500, Y = 850)
    if (storyTrials.state === 'WAITING_FOR_CENTER') {
        let livingHeroes = players.filter(pl => pl && pl.hp > 0);
        let inCenterCount = livingHeroes.filter(pl => Math.abs(pl.x - 5500) < 80 && pl.y >= 750).length;
        storyTrials.inCenterCount = inCenterCount;

        if (inCenterCount === livingHeroes.length && livingHeroes.length >= 1) {
            storyTrials.centerReadyTimer = (storyTrials.centerReadyTimer || 0) + 1;
            if (storyTrials.centerReadyTimer >= 30) {
                storyTrials.centerReadyTimer = 0;
                storyTrials.state = 'IN_STAGE';
                storyState.trialsWeaponGranted = true;
                playSound('lightChime');
                playSound('slash');
                triggerShake(8, 14);
                for (let k = 0; k < 20; k++) {
                    storyTrials.particles.push({
                        x: 5500, y: 845,
                        vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 8,
                        color: Math.random() < 0.5 ? "#fde047" : "#38bdf8",
                        size: 4 + Math.random() * 5, timer: 40
                    });
                }
                storyTrials.overseerText = "Распорядитель: «Отряд в сборе! Оружие даровано. Испытание 1 начинается!»";
                storyTrials.overseerTimer = 260;
                startStoryTrialsStage(1, false);
            }
        } else {
            storyTrials.centerReadyTimer = 0;
        }
        return;
    }

    // 1. Check Warning Rule: "если хп опустится до 1 у кого то то этот этап испытания придется переходить заново"
    if (!storyTrials.warningRestarting && storyTrials.stage >= 1 && storyTrials.stage <= 4) {
        for (let pl of players) {
            if (pl && pl.hp <= 1.0) {
                triggerStoryTrialWarning(`Герой ${pl.type} при смерти (HP <= 1)!`);
                return;
            }
        }
    }

    // 2. Update Particles (debris, sparks)
    for (let i = storyTrials.particles.length - 1; i >= 0; i--) {
        let pt = storyTrials.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.35;
        pt.timer--;
        if (pt.timer <= 0) storyTrials.particles.splice(i, 1);
    }

    // 3. Update Mannequins (Stage 1 & Stage 2)
    for (let i = storyTrials.mannequins.length - 1; i >= 0; i--) {
        let m = storyTrials.mannequins[i];
        if (m.hitFlash > 0) m.hitFlash--;

        // Find nearest living player
        let nearestPl = null;
        let minDist = 999999;
        for (let pl of players) {
            if (pl && pl.hp > 0 && !pl.isDowned) {
                let d = Math.hypot(pl.x - m.x, pl.y - (m.y - 25));
                if (d < minDist) { minDist = d; nearestPl = pl; }
            }
        }

        if (nearestPl) {
            m.facingRight = (nearestPl.x > m.x);
        }

        if (m.state === 'WALK') {
            if (nearestPl) {
                m.vx = m.facingRight ? 1.6 : -1.6;
                m.x += m.vx;
                // Keep mannequin on floor
                m.x = Math.max(5020, Math.min(5980, m.x));

                if (m.strikeCooldown > 0) m.strikeCooldown--;
                if (minDist <= 65 && m.strikeCooldown <= 0) {
                    m.state = 'WINDUP';
                    m.strikeTimer = 28;
                    m.vx = 0;
                }
            }

            // Contact Damage (входной урон: 1)
            for (let pl of players) {
                if (pl && pl.hp > 0 && pl.invuln <= 0) {
                    let mBox = { x: m.x - 15, y: m.y - 50, width: 30, height: 50 };
                    let plBox = { x: pl.x, y: pl.y, width: pl.width, height: pl.height };
                    if (rectIntersect(mBox, plBox)) {
                        takeDamage(pl, 1.0, true, true);
                        pl.invuln = 45;
                        pl.vx = m.facingRight ? 6 : -6;
                        pl.vy = -3;
                        triggerVibration('damage');
                    }
                }
            }
        } else if (m.state === 'WINDUP') {
            m.strikeTimer--;
            if (m.strikeTimer <= 0) {
                m.state = 'STRIKE';
                m.strikeTimer = 16;
                playSound('slash');
                triggerShake(3, 6);

                // Demonic strike forward hitbox (1 damage)
                let slashBox = {
                    x: m.facingRight ? m.x : m.x - 70,
                    y: m.y - 45,
                    width: 70,
                    height: 45
                };
                for (let pl of players) {
                    if (pl && pl.hp > 0 && pl.invuln <= 0) {
                        let plBox = { x: pl.x, y: pl.y, width: pl.width, height: pl.height };
                        if (rectIntersect(slashBox, plBox)) {
                            takeDamage(pl, 1.0, true, true);
                            pl.invuln = 45;
                            pl.vx = m.facingRight ? 9 : -9;
                            pl.vy = -4;
                            triggerVibration('damage');
                        }
                    }
                }
            }
        } else if (m.state === 'STRIKE') {
            m.strikeTimer--;
            if (m.strikeTimer <= 0) {
                m.state = 'WALK';
                m.strikeCooldown = 70;
            }
        }

        if (m.hp <= 0) {
            playSound('bladeSpin');
            triggerShake(6, 10);
            for (let k = 0; k < 12; k++) {
                storyTrials.particles.push({
                    x: m.x,
                    y: m.y - 25,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 8,
                    color: Math.random() < 0.5 ? "#78350f" : "#6b21a8",
                    size: 4 + Math.random() * 4,
                    timer: 35
                });
            }
            storyTrials.mannequins.splice(i, 1);
        }
    }

    // Check Stage 1 Clear
    if (storyTrials.stage === 1 && storyTrials.mannequins.length === 0 && !storyTrials.warningRestarting) {
        completeStoryTrialsStage();
    }

    // 4. Update Stage 2 (Maze + Droplet Guide + Mannequin)
    if (storyTrials.stage === 2) {
        // Guided water droplet through maze channel
        if (storyTrials.mazeDropGuide) {
            let dg = storyTrials.mazeDropGuide;
            let currentPt = dg.points[dg.idx];
            if (currentPt && dg.drop) {
                let dx = currentPt.x - dg.drop.x;
                let dy = currentPt.y - dg.drop.y;
                let dist = Math.hypot(dx, dy);
                if (dist < 6) {
                    dg.idx++;
                    if (dg.idx >= dg.points.length) {
                        // Reached Target!
                        storyTrials.mazeTargetHit = true;
                        playSound('lightChime');
                        playSound('bladeSpin');
                        triggerShake(8, 14);
                        for (let k = 0; k < 16; k++) {
                            storyTrials.particles.push({
                                x: 5480,
                                y: 565,
                                vx: (Math.random() - 0.5) * 8,
                                vy: (Math.random() - 0.5) * 8,
                                color: Math.random() < 0.5 ? "#fde047" : "#38bdf8",
                                size: 4 + Math.random() * 4,
                                timer: 45
                            });
                        }
                        if (dg.owner) {
                            dg.owner.waterDropActive = false;
                            dg.owner.waterDrop = null;
                        }
                        storyTrials.mazeDropGuide = null;
                    }
                } else {
                    dg.drop.x += (dx / dist) * 7.5;
                    dg.drop.y += (dy / dist) * 7.5;
                }
            }
        }

        // Check Stage 2 Clear
        if (storyTrials.mazeTargetHit && storyTrials.mannequins.length === 0 && !storyTrials.warningRestarting) {
            completeStoryTrialsStage();
        }
    }

    // 5. Update Stage 3 (Targets with 10s Timer)
    if (storyTrials.stage === 3 && !storyTrials.warningRestarting) {
        storyTrials.targetTimer--;
        if (storyTrials.targetTimer === 180 || storyTrials.targetTimer === 120 || storyTrials.targetTimer === 60) {
            playSound('step');
        }

        if (storyTrials.targets.length === 0) {
            completeStoryTrialsStage();
        } else if (storyTrials.targetTimer <= 0) {
            triggerStoryTrialWarning("Время вышло! Не успели уничтожить 5 мишеней!");
        }
    }

    // 6. Update Stage 4 (Trials Demon Boss)
    if (storyTrials.stage === 4 && storyTrials.demon && !storyTrials.warningRestarting) {
        let d = storyTrials.demon;
        if (d.hitFlash > 0) d.hitFlash--;

        let nearestPl = null;
        let minDist = 999999;
        for (let pl of players) {
            if (pl && pl.hp > 0 && !pl.isDowned) {
                let dist = Math.hypot(pl.x - d.x, pl.y - (d.y - 40));
                if (dist < minDist) { minDist = dist; nearestPl = pl; }
            }
        }

        if (nearestPl) {
            d.facingRight = (nearestPl.x > d.x);
        }

        // Boss Contact Damage (входной урон: 1.5)
        for (let pl of players) {
            if (pl && pl.hp > 0 && pl.invuln <= 0) {
                let dBox = { x: d.x - 25, y: d.y - 75, width: 50, height: 75 };
                let plBox = { x: pl.x, y: pl.y, width: pl.width, height: pl.height };
                if (rectIntersect(dBox, plBox)) {
                    takeDamage(pl, 1.5, true, true);
                    pl.invuln = 45;
                    pl.vx = d.facingRight ? 9 : -9;
                    pl.vy = -4;
                    triggerVibration('damage');
                }
            }
        }

        // Boss Shockwaves (Attack 1 ground slam shockwave: 2.0 damage)
        for (let i = d.shockwaves.length - 1; i >= 0; i--) {
            let sw = d.shockwaves[i];
            sw.x += sw.vx;
            sw.timer--;
            let swBox = { x: sw.x - 25, y: 850 - 40, width: 50, height: 40 };
            for (let pl of players) {
                if (pl && pl.hp > 0 && pl.invuln <= 0 && rectIntersect(swBox, pl)) {
                    takeDamage(pl, 2.0, true, true);
                    pl.invuln = 45;
                    pl.vy = -8;
                    triggerVibration('damage');
                }
            }
            if (sw.timer <= 0 || sw.x < 4980 || sw.x > 6020) {
                d.shockwaves.splice(i, 1);
            }
        }

        // Boss Power Waves (Attack 2 demonic power wave: 1.5 damage)
        for (let i = d.powerWaves.length - 1; i >= 0; i--) {
            let pw = d.powerWaves[i];
            pw.x += pw.vx;
            pw.y += pw.vy;
            pw.timer--;
            let pwBox = { x: pw.x - 18, y: pw.y - 18, width: 36, height: 36 };
            for (let pl of players) {
                if (pl && pl.hp > 0 && pl.invuln <= 0 && rectIntersect(pwBox, pl)) {
                    takeDamage(pl, 1.5, true, true);
                    pl.invuln = 45;
                    triggerVibration('damage');
                }
            }
            if (pw.timer <= 0 || pw.x < 4980 || pw.x > 6020) {
                d.powerWaves.splice(i, 1);
            }
        }

        if (d.attackCooldown > 0) d.attackCooldown--;

        if (d.state === 'WALK') {
            if (nearestPl) {
                d.vx = d.facingRight ? 1.8 : -1.8;
                d.x += d.vx;
                d.x = Math.max(5020, Math.min(5980, d.x));
            }
            if (d.attackCooldown <= 0 && nearestPl) {
                d.attackCooldown = 110;
                // Alternate between Leap Attack and Demon Power Wave
                if (Math.random() < 0.5) {
                    d.state = 'WINDUP_LEAP';
                    d.stateTimer = 32;
                    d.vx = 0;
                } else {
                    d.state = 'WINDUP_POWER';
                    d.stateTimer = 36;
                    d.vx = 0;
                }
            }
        } else if (d.state === 'WINDUP_LEAP') {
            d.stateTimer--;
            if (d.stateTimer <= 0) {
                d.state = 'LEAP';
                d.vy = -16;
                let dir = (nearestPl && nearestPl.x > d.x) ? 1 : -1;
                d.vx = dir * 6.5;
                playSound('jump');
            }
        } else if (d.state === 'LEAP') {
            d.x += d.vx;
            d.y += d.vy;
            d.vy += 0.85;
            if (d.vy > 2) d.vy += 0.4; // Fast fall slam

            if (d.y >= 850 - 80) {
                d.y = 850 - 80;
                d.vy = 0;
                d.vx = 0;
                d.state = 'SLAM';
                d.stateTimer = 25;
                playSound('breakStone');
                playSound('slash');
                triggerShake(9, 15);

                // 2.0 damage slam under boss
                let slamBox = { x: d.x - 40, y: 850 - 50, width: 80, height: 50 };
                for (let pl of players) {
                    if (pl && pl.hp > 0 && pl.invuln <= 0 && rectIntersect(slamBox, pl)) {
                        takeDamage(pl, 2.0, true, true);
                        pl.invuln = 45;
                        pl.vy = -7;
                    }
                }

                // Shockwaves racing left and right
                d.shockwaves.push({ x: d.x - 20, vx: -7.5, timer: 65 });
                d.shockwaves.push({ x: d.x + 20, vx: 7.5, timer: 65 });
            }
        } else if (d.state === 'SLAM') {
            d.stateTimer--;
            if (d.stateTimer <= 0) {
                d.state = 'WALK';
            }
        } else if (d.state === 'WINDUP_POWER') {
            d.stateTimer--;
            if (d.stateTimer <= 0) {
                d.state = 'POWER_WAVE';
                d.stateTimer = 25;
                playSound('heatIgnite');
                triggerShake(6, 12);
                let pDir = d.facingRight ? 1 : -1;
                d.powerWaves.push({ x: d.x + pDir * 30, y: 850 - 45, vx: pDir * 8.5, vy: 0, timer: 75 });
                d.powerWaves.push({ x: d.x + pDir * 30, y: 850 - 75, vx: pDir * 7.5, vy: -0.8, timer: 75 });
            }
        } else if (d.state === 'POWER_WAVE') {
            d.stateTimer--;
            if (d.stateTimer <= 0) {
                d.state = 'WALK';
            }
        }

        if (d.hp <= 0) {
            completeStoryTrialsStage();
            storyTrials.demon = null;
        }
    }
}

// Melee attack hitbox against trial entities
function checkStoryTrialHitbox(swordHitbox, attacker) {
    if (!storyTrials.active) return;

    // Timur: "вода - 0.75, воздух - 0.75, земля - 0.5"
    let dmg = 0.75;
    if (attacker.type === 'EARTH') {
        dmg = (attacker.attackType === 'EARTH_SPRINT_STRIKE') ? 0.75 : 0.5;
    } else if (attacker.type === 'AIR') {
        dmg = 0.75;
    } else if (attacker.type === 'WATER') {
        dmg = 0.75;
    }

    // 1. Mannequins
    for (let m of storyTrials.mannequins) {
        let mBox = { x: m.x - 18, y: m.y - 50, width: 36, height: 50 };
        if (rectIntersect(swordHitbox, mBox)) {
            m.hp -= dmg;
            m.hitFlash = 16;
            m.vx = (attacker.x < m.x ? 5 : -5);
            playSound('hitBoss');
            triggerShake(3, 6);
            if (attacker.attackType === 'DOWN') {
                attacker.vy = -14;
                attacker.jumps = 1;
            }
        }
    }

    // 2. Stage 2: Breakable Wall below maze entrance
    if (storyTrials.stage === 2 && !storyTrials.mazeWallBroken) {
        let wallBox = { x: 5460, y: 712, width: 45, height: 24 };
        if (rectIntersect(swordHitbox, wallBox)) {
            storyTrials.mazeWallBroken = true;
            playSound('breakStone');
            triggerShake(6, 10);
            for (let k = 0; k < 18; k++) {
                storyTrials.particles.push({
                    x: 5480,
                    y: 720,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 7,
                    color: Math.random() < 0.5 ? "#64748b" : "#94a3b8",
                    size: 4 + Math.random() * 4,
                    timer: 35
                });
            }
        }
    }

    // 3. Stage 3: Targets
    if (storyTrials.stage === 3) {
        for (let i = storyTrials.targets.length - 1; i >= 0; i--) {
            let trg = storyTrials.targets[i];
            let tBox = { x: trg.x - trg.r, y: trg.y - trg.r, width: trg.r * 2, height: trg.r * 2 };
            if (rectIntersect(swordHitbox, tBox)) {
                playSound('bladeSpin');
                playSound('parry');
                triggerShake(4, 7);
                for (let k = 0; k < 12; k++) {
                    storyTrials.particles.push({
                        x: trg.x,
                        y: trg.y,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8,
                        color: Math.random() < 0.5 ? "#ef4444" : "#ffffff",
                        size: 3 + Math.random() * 3,
                        timer: 25
                    });
                }
                storyTrials.targets.splice(i, 1);
            }
        }
    }

    // 4. Stage 4: Trials Demon Boss
    if (storyTrials.stage === 4 && storyTrials.demon) {
        let d = storyTrials.demon;
        let dBox = { x: d.x - 25, y: d.y - 75, width: 50, height: 75 };
        if (rectIntersect(swordHitbox, dBox)) {
            d.hp -= dmg;
            d.hitFlash = 16;
            playSound('hitBoss');
            triggerShake(4, 8);
            if (attacker.attackType === 'DOWN') {
                attacker.vy = -14;
                attacker.jumps = 1;
            }
        }
    }
}

// Water droplet collision with trial elements
function checkStoryTrialWaterDropHit(drop, p, hitBox) {
    if (!storyTrials.active) return false;

    // Stage 2: Breakable wall hit by water drop
    if (storyTrials.stage === 2 && !storyTrials.mazeWallBroken) {
        let wallBox = { x: 5460, y: 712, width: 45, height: 24 };
        if (rectIntersect(hitBox, wallBox)) {
            storyTrials.mazeWallBroken = true;
            playSound('breakStone');
            playSound('waterSplash');
            triggerShake(6, 10);
            return true;
        }
    }

    // Stage 2: Entrance to the maze channel (only after wall broken)
    if (storyTrials.stage === 2 && storyTrials.mazeWallBroken && !storyTrials.mazeTargetHit) {
        if (drop.x >= 5450 && drop.x <= 5515 && drop.y >= 700 && drop.y <= 745) {
            storyTrials.mazeDropGuide = {
                drop: drop,
                owner: p,
                idx: 0,
                points: [
                    { x: 5480, y: 715 },
                    { x: 5480, y: 685 },
                    { x: 5390, y: 685 },
                    { x: 5390, y: 620 },
                    { x: 5570, y: 620 },
                    { x: 5570, y: 565 },
                    { x: 5480, y: 565 }
                ]
            };
            playSound('waterSplash');
            return false; // keep drop alive as it follows guided channel
        }
    }

    // Mannequins
    for (let m of storyTrials.mannequins) {
        let mBox = { x: m.x - 18, y: m.y - 50, width: 36, height: 50 };
        if (rectIntersect(hitBox, mBox)) {
            m.hp -= 0.75;
            m.hitFlash = 16;
            playSound('hitBoss');
            playSound('waterSplash');
            return true;
        }
    }

    // Stage 3: Targets
    if (storyTrials.stage === 3) {
        for (let i = storyTrials.targets.length - 1; i >= 0; i--) {
            let trg = storyTrials.targets[i];
            let tBox = { x: trg.x - trg.r, y: trg.y - trg.r, width: trg.r * 2, height: trg.r * 2 };
            if (rectIntersect(hitBox, tBox)) {
                playSound('bladeSpin');
                storyTrials.targets.splice(i, 1);
                return true;
            }
        }
    }

    // Stage 4: Trials Demon Boss
    if (storyTrials.stage === 4 && storyTrials.demon) {
        let d = storyTrials.demon;
        let dBox = { x: d.x - 25, y: d.y - 75, width: 50, height: 75 };
        if (rectIntersect(hitBox, dBox)) {
            d.hp -= 0.75;
            d.hitFlash = 16;
            playSound('hitBoss');
            playSound('waterSplash');
            return true;
        }
    }

    return false;
}

// Air trap / projectile collision with trial elements
function checkStoryTrialProjectileHit(proj, type) {
    if (!storyTrials.active) return false;
    let pBox = { x: proj.x - 8, y: proj.y - 8, width: 16, height: 16 };

    for (let m of storyTrials.mannequins) {
        let mBox = { x: m.x - 18, y: m.y - 50, width: 36, height: 50 };
        if (rectIntersect(pBox, mBox)) {
            m.hp -= 0.75;
            m.hitFlash = 16;
            playSound('hitBoss');
            return true;
        }
    }

    if (storyTrials.stage === 3) {
        for (let i = storyTrials.targets.length - 1; i >= 0; i--) {
            let trg = storyTrials.targets[i];
            let tBox = { x: trg.x - trg.r, y: trg.y - trg.r, width: trg.r * 2, height: trg.r * 2 };
            if (rectIntersect(pBox, tBox)) {
                playSound('bladeSpin');
                storyTrials.targets.splice(i, 1);
                return true;
            }
        }
    }

    if (storyTrials.stage === 4 && storyTrials.demon) {
        let d = storyTrials.demon;
        let dBox = { x: d.x - 25, y: d.y - 75, width: 50, height: 75 };
        if (rectIntersect(pBox, dBox)) {
            d.hp -= 0.75;
            d.hitFlash = 16;
            playSound('hitBoss');
            return true;
        }
    }

    return false;
}

// Find closest trial enemy or target for companion targeting
function getNearestStoryTrialTarget(p) {
    if (!storyTrials.active) return null;

    if (storyTrials.stage === 1) {
        let closest = null, minD = 999999;
        for (let m of storyTrials.mannequins) {
            let d = Math.hypot(m.x - p.x, (m.y - 25) - p.y);
            if (d < minD) { minD = d; closest = { x: m.x, y: m.y - 25 }; }
        }
        return closest;
    }

    if (storyTrials.stage === 2) {
        if (p.type === 'EARTH' && !storyTrials.mazeWallBroken) {
            return { x: 5480, y: 720 };
        }
        if (storyTrials.mannequins.length > 0) {
            let m = storyTrials.mannequins[0];
            return { x: m.x, y: m.y - 25 };
        }
        return { x: 5480, y: 565 };
    }

    if (storyTrials.stage === 3) {
        let closest = null, minD = 999999;
        for (let trg of storyTrials.targets) {
            let d = Math.hypot(trg.x - p.x, trg.y - p.y);
            if (d < minD) { minD = d; closest = trg; }
        }
        return closest;
    }

    if (storyTrials.stage === 4 && storyTrials.demon) {
        return { x: storyTrials.demon.x, y: storyTrials.demon.y - 35 };
    }

    return null;
}

// Companion AI during Trials
function runStoryTrialsCompanionAI(p, inp, requestJump) {
    if (!storyTrials.active) return;

    // 0. Follow player into center circle when waiting for party to assemble
    if (storyTrials.state === 'WAITING_FOR_CENTER') {
        let leader = players[0];
        let targetX;
        if (leader && leader.x < 5420) {
            // Companion bots run behind player towards the center
            targetX = (p === players[1]) ? (leader.x - 45) : (leader.x - 85);
        } else {
            // Once leader reaches center area, step into circle flanking the player
            targetX = (p === players[1]) ? 5465 : 5535;
        }
        let dx = targetX - p.x;
        if (Math.abs(dx) > 10) {
            if (dx > 0) inp.right = true; else inp.left = true;
        }
        return;
    }

    // 1. Revive downed ally if possible
    let downedAlly = players.find(pl => pl.id !== p.id && pl.isDowned && pl.hp > 0);
    if (downedAlly && p.hp > 1.0) {
        let dx = downedAlly.x - p.x;
        if (Math.abs(dx) > 20) {
            if (dx > 0) inp.right = true; else inp.left = true;
        } else {
            inp.heal = true;
        }
        return;
    }

    // 2. Stage 2: Earth Companion breaks the bottom maze wall!
    if (storyTrials.stage === 2 && p.type === 'EARTH' && !storyTrials.mazeWallBroken) {
        let targetX = 5480;
        let dx = targetX - p.x;
        if (Math.abs(dx) > 18) {
            if (dx > 0) inp.right = true; else inp.left = true;
        } else {
            // Under entrance: jump up and attack upwards!
            requestJump(14);
            inp.up = true;
            inp.attack = true;
        }
        return;
    }

    // 3. Stage 4: Dodge Demon Boss Leap / Shockwaves
    if (storyTrials.stage === 4 && storyTrials.demon) {
        let d = storyTrials.demon;
        // If demon is about to slam or shockwaves are near: jump or dash away!
        if (d.state === 'LEAP' && Math.abs(d.x - p.x) < 140) {
            inp.dash = true;
            if (p.x < d.x) inp.left = true; else inp.right = true;
            return;
        }
        for (let sw of d.shockwaves) {
            if (Math.abs(sw.x - p.x) < 70) {
                requestJump(12);
                break;
            }
        }
    }

    // 4. Default: Hunt nearest trial target
    let tgt = getNearestStoryTrialTarget(p);
    if (tgt) {
        let dx = tgt.x - p.x;
        let dy = tgt.y - p.y;
        let dist = Math.hypot(dx, dy);

        if (dy < -40 && Math.abs(dx) < 120) {
            requestJump(12);
        }

        if (p.type === 'AIR') {
            // Air prefers medium range to shoot traps
            if (dist > 150) {
                if (dx > 0) inp.right = true; else inp.left = true;
            } else if (dist < 60) {
                if (dx > 0) inp.left = true; else inp.right = true;
            }
            if (dist <= 260 && Math.random() < 0.25) {
                inp.attack = true;
            }
        } else {
            // Earth or Water close combat
            if (Math.abs(dx) > 35) {
                if (dx > 0) inp.right = true; else inp.left = true;
            }
            if (dist <= 65) {
                inp.attack = true;
            }
        }
    }
}

// Draw the entire Trials Arena, Overseer, Maze, Mannequins, Targets, Demon Boss & HUD
function drawStoryTrials() {
    if (!ctx || !storyTrials || !storyTrials.active) return;
    let now = Date.now();

    // 0. Dedicated Ancient Trials Chamber Backdrop (X: 5000..6000, Y: 470..870)
    ctx.save();
    let bgGrad = ctx.createLinearGradient(5000, 470, 5000, 870);
    bgGrad.addColorStop(0, "#080c14");
    bgGrad.addColorStop(0.5, "#0d1322");
    bgGrad.addColorStop(1, "#141c2e");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(4990, 460, 1020, 410);

    // Stone Pillars in background
    ctx.fillStyle = "#162032";
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    let pilX = [5020, 5220, 5420, 5620, 5820, 5970];
    for (let px of pilX) {
        ctx.fillRect(px - 14, 460, 28, 390);
        ctx.strokeRect(px - 14, 460, 28, 390);
    }

    // Glowing Runic Torches
    let torchX = [5120, 5880];
    for (let tx of torchX) {
        ctx.fillStyle = "#78350f";
        ctx.fillRect(tx - 3, 670, 6, 20);
        let fGrad = ctx.createRadialGradient(tx, 665, 2, tx, 665, 28);
        fGrad.addColorStop(0, "rgba(56, 189, 248, 0.7)");
        fGrad.addColorStop(0.5, "rgba(147, 51, 234, 0.3)");
        fGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(tx, 665, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(tx, 665, 5 + Math.sin(now * 0.01 + tx) * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Chamber Floor & Boundary Walls
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.fillRect(4980, 850, 1040, 50);
    ctx.strokeRect(4980, 850, 1040, 50);
    ctx.fillRect(4980, 440, 1040, 25);
    ctx.strokeRect(4980, 440, 1040, 25);
    ctx.fillRect(4980, 460, 25, 400);
    ctx.strokeRect(4980, 460, 25, 400);
    ctx.fillRect(5995, 460, 25, 400);
    ctx.strokeRect(5995, 460, 25, 400);

    // Exit portal when trials cleared
    if (storyTrials.trialsCleared) {
        let px = 5900, py = 850;
        let pGrad = ctx.createLinearGradient(px, py - 180, px, py);
        pGrad.addColorStop(0, "rgba(253, 224, 71, 0.65)");
        pGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.45)");
        pGrad.addColorStop(1, "rgba(15, 23, 42, 0.2)");
        ctx.fillStyle = pGrad;
        ctx.fillRect(px - 25, py - 160, 50, 160);

        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 15;
        ctx.strokeRect(px - 28, py - 165, 56, 165);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("✨ ПОРТАЛ ВЫХОДА ✨", px, py - 175);
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#86efac";
        ctx.fillText("«Шагните в портал»", px, py - 90);
    }
    ctx.restore();

    // 1. Overseer Observation Balcony & Model at X = 5040, Y = 660
    ctx.save();
    let ovX = 5040, ovY = 660;
    // Stone plinth
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ovX - 35, ovY, 70, 24, 6);
    ctx.fill();
    ctx.stroke();

    // Overseer character model
    if (!window.storyOverseerDummy) {
        window.storyOverseerDummy = createPlayer(-190, 'AIR', {}, 'AI', ovX);
        window.storyOverseerDummy.facingRight = true;
        window.storyOverseerDummy.stance = 'LIGHT';
    }
    window.storyOverseerDummy.x = ovX - 15;
    window.storyOverseerDummy.y = ovY - 50;
    drawPlayer(window.storyOverseerDummy);

    // Golden Halo above Overseer
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(ovX, ovY - 60, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚖️ Распорядитель", ovX, ovY - 78);

    // Overseer Speech Bubble
    if (storyTrials.overseerTimer > 0 && storyTrials.overseerText) {
        let bw = Math.min(540, ctx.measureText(storyTrials.overseerText).width + 36);
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(ovX - bw / 2, ovY - 120, bw, 32, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(storyTrials.overseerText, ovX, ovY - 100);
    }
    ctx.restore();

    // 2. Elevated Arena Battle Ledges
    ctx.save();
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    // Left ledge: X: 5180..5320, Y: 720
    ctx.fillRect(5180, 720, 140, 18);
    ctx.strokeRect(5180, 720, 140, 18);
    // Right ledge: X: 5680..5820, Y: 720
    ctx.fillRect(5680, 720, 140, 18);
    ctx.strokeRect(5680, 720, 140, 18);
    ctx.restore();

    // 2.5 Central Assembly Circle (X = 5500, Y = 850) - Active when assembling party
    if (storyTrials.state === 'WAITING_FOR_CENTER') {
        ctx.save();
        let cx = 5500, cy = 848;
        let t = now * 0.002;
        let inCount = storyTrials.inCenterCount || 0;
        let readyProg = (storyTrials.centerReadyTimer || 0) / 30; // 0..1

        // Pulsing ground glow
        let glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 85);
        glowGrad.addColorStop(0, inCount >= 3 ? "rgba(253, 224, 71, 0.45)" : "rgba(56, 189, 248, 0.35)");
        glowGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 85, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer rotating runic ring
        ctx.strokeStyle = inCount >= 3 ? "#fde047" : "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = inCount >= 3 ? "#f59e0b" : "#0284c7";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 75, 22, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Inner rune ring
        ctx.beginPath();
        ctx.ellipse(cx, cy, 48, 15, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 3 Ritual Markers around circle for the 3 heroes
        for (let i = 0; i < 3; i++) {
            let ang = t + (i * Math.PI * 2) / 3;
            let rx = cx + Math.cos(ang) * 58;
            let ry = cy + Math.sin(ang) * 18;
            ctx.fillStyle = (i < inCount) ? "#fde047" : "#64748b";
            ctx.beginPath();
            ctx.arc(rx, ry, (i < inCount) ? 5 : 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ready progress ring if charging
        if (readyProg > 0) {
            ctx.strokeStyle = "#4ade80";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 80, 24, 0, -Math.PI / 2, -Math.PI / 2 + readyProg * Math.PI * 2);
            ctx.stroke();
        }

        // Title and counter above the circle
        ctx.shadowBlur = 0;
        ctx.fillStyle = inCount >= 3 ? "#fef08a" : "#e0f2fe";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("✨ КРУГ СБОРА ✨", cx, cy - 40);
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = inCount >= 3 ? "#4ade80" : "#38bdf8";
        ctx.fillText(`Встаньте в круг [${inCount}/3]`, cx, cy - 24);

        ctx.restore();
    }

    // 3. Stage 2: Overhead Logic Maze (X: 5360 .. 5600, Y: 530 .. 720) - ONLY during Stage 2
    if (storyTrials.stage === 2) {
        ctx.save();
        let mLeft = 5360, mRight = 5600, mTop = 530, mBottom = 720;

        // Outer frame
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.fillRect(mLeft, mTop, mRight - mLeft, mBottom - mTop);
        ctx.strokeRect(mLeft, mTop, mRight - mLeft, mBottom - mTop);

        // Internal Maze Stone Walls (creating the channel)
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 6;
        ctx.beginPath();
        // Divider 1 (vertical from roof down)
        ctx.moveTo(5440, mTop); ctx.lineTo(5440, 650);
        // Divider 2 (horizontal across)
        ctx.moveTo(5440, 650); ctx.lineTo(5530, 650);
        // Divider 3 (vertical from bottom up)
        ctx.moveTo(5530, 650); ctx.lineTo(5530, 590);
        // Bottom inner wall
        ctx.moveTo(mLeft, 680); ctx.lineTo(5450, 680);
        ctx.stroke();

        // Bottom Entrance Gap & Breakable Wall
        if (!storyTrials.mazeWallBroken) {
            // Grey Breakable Stone Wall
            ctx.fillStyle = "#64748b";
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 2;
            ctx.fillRect(5465, 714, 38, 16);
            ctx.strokeRect(5465, 714, 38, 16);
            // Cracks
            ctx.strokeStyle = "#334155";
            ctx.beginPath();
            ctx.moveTo(5475, 715); ctx.lineTo(5482, 722); ctx.lineTo(5495, 728);
            ctx.stroke();
            ctx.fillStyle = "#f8fafc";
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🧱 СТЕНА", 5484, 726);
        } else {
            // Open glowing water channel entrance
            ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
            ctx.fillRect(5465, 716, 38, 14);
        }

        // Bullseye Target at (5480, 565)
        let tgtX = 5480, tgtY = 565;
        ctx.save();
        if (storyTrials.mazeTargetHit) {
            ctx.fillStyle = "#fde047";
            ctx.shadowColor = "#f59e0b";
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(tgtX, tgtY, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("✨", tgtX, tgtY + 4);
        } else {
            // Red Bullseye
            ctx.fillStyle = "#ef4444";
            ctx.beginPath(); ctx.arc(tgtX, tgtY, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath(); ctx.arc(tgtX, tgtY, 9, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ef4444";
            ctx.beginPath(); ctx.arc(tgtX, tgtY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fef08a";
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🎯", tgtX, tgtY - 18);
        }
        ctx.restore();
        ctx.restore();
    }

    // 4. Stage 3: 5 Scattered Bullseye Targets
    if (storyTrials.stage === 3) {
        for (let trg of storyTrials.targets) {
            ctx.save();
            let bob = Math.sin(now * 0.005 + trg.id) * 3;
            ctx.fillStyle = "#ef4444";
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(trg.x, trg.y + bob, trg.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath(); ctx.arc(trg.x, trg.y + bob, trg.r * 0.65, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ef4444";
            ctx.beginPath(); ctx.arc(trg.x, trg.y + bob, trg.r * 0.35, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    // 5. Training Demonic Mannequins
    for (let m of storyTrials.mannequins) {
        ctx.save();
        if (!m.dummy) {
            m.dummy = createPlayer(-100 - m.id, 'WATER', {}, 'AI', m.x);
            m.dummy.stance = 'DEMON';
            m.dummy.width = 30;
            m.dummy.height = 50;
        }
        m.dummy.x = m.x - 15;
        m.dummy.y = m.y - 50;
        m.dummy.facingRight = m.facingRight;
        m.dummy.attackTimer = (m.state === 'STRIKE') ? 14 : 0;
        drawPlayer(m.dummy);

        // Wooden dummy armor & demonic mask
        ctx.fillStyle = "#6b21a8";
        ctx.beginPath();
        ctx.arc(m.x, m.y - 42, 6, 0, Math.PI * 2);
        ctx.fill();

        if (m.hitFlash > 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
            ctx.beginPath();
            ctx.arc(m.x, m.y - 25, 22, 0, Math.PI * 2);
            ctx.fill();
        }

        // Windup telegraph
        if (m.state === 'WINDUP') {
            ctx.strokeStyle = "#c084fc";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#a855f7";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            let startAngle = m.facingRight ? -0.4 : Math.PI - 0.4;
            let endAngle = m.facingRight ? 0.4 : Math.PI + 0.4;
            ctx.arc(m.x, m.y - 25, 55, startAngle, endAngle);
            ctx.stroke();
            ctx.fillStyle = "#f43f5e";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚠️ Замах!", m.x, m.y - 68);
        }

        // Mannequin Health Bar
        let bw = 45;
        let hpW = Math.max(0, (m.hp / m.maxHp) * bw);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(m.x - bw / 2, m.y - 58, bw, 5);
        ctx.fillStyle = "#c084fc";
        ctx.fillRect(m.x - bw / 2, m.y - 58, hpW, 5);
        ctx.restore();
    }

    // 6. Stage 4: Trials Demon Boss
    if (storyTrials.stage === 4 && storyTrials.demon) {
        let d = storyTrials.demon;
        ctx.save();
        if (!d.dummy) {
            d.dummy = createPlayer(-199, 'WATER', {}, 'AI', d.x);
            d.dummy.stance = 'DEMON';
            d.dummy.width = 50;
            d.dummy.height = 80;
        }
        d.dummy.x = d.x - 25;
        d.dummy.y = d.y;
        d.dummy.facingRight = d.facingRight;
        d.dummy.attackTimer = (d.state === 'SLAM' || d.state === 'POWER_WAVE') ? 16 : 0;

        // Draw scaled boss model
        ctx.save();
        ctx.translate(d.x, d.y + 40);
        ctx.scale(1.35, 1.35);
        ctx.translate(-d.x, -(d.y + 40));
        drawPlayer(d.dummy);
        ctx.restore();

        // Dark demonic aura & horns
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#991b1b";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(d.x, d.y + 10, 16, Math.PI, 0);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Boss Leap Windup telegraph
        if (d.state === 'WINDUP_LEAP') {
            ctx.fillStyle = "rgba(147, 51, 234, 0.4)";
            ctx.beginPath();
            ctx.ellipse(d.x, 850 - 4, 45, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#f43f5e";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚡ НАПРЫГИВАНИЕ!", d.x, d.y - 18);
        }

        // Draw Shockwaves
        ctx.fillStyle = "#9333ea";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 12;
        for (let sw of d.shockwaves) {
            ctx.beginPath();
            ctx.arc(sw.x, 850 - 15, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Power Waves
        for (let pw of d.powerWaves) {
            ctx.fillStyle = "#dc2626";
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(pw.x, pw.y, 16, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 7. Particles
    ctx.save();
    for (let pt of storyTrials.particles) {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // 8. Trials Screen HUD (Warnings Counter & Stage 3 Timer & Notice)
    if (storyTrials.active) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // screen space

        // Warnings Display (top left)
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.strokeStyle = (storyTrials.warnings > 0) ? "#f59e0b" : "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(16, 48, 220, 36, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = (storyTrials.warnings > 0) ? "#fbbf24" : "#f1f5f9";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "left";
        let warnDots = (storyTrials.warnings === 0) ? "⚪⚪⚪" : (storyTrials.warnings === 1) ? "🟡⚪⚪" : "🟡🟡⚪";
        ctx.fillText(`⚠️ Предупреждения: ${storyTrials.warnings}/3  ${warnDots}`, 28, 71);

        // Waiting for Center HUD prompt (top center)
        if (storyTrials.state === 'WAITING_FOR_CENTER') {
            let inCount = storyTrials.inCenterCount || 0;
            let allReady = inCount >= 3;
            ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
            ctx.strokeStyle = allReady ? "#4ade80" : "#38bdf8";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = allReady ? "#4ade80" : "#38bdf8";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.roundRect(canvas.width / 2 - 170, 48, 340, 42, 12);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = allReady ? "#4ade80" : "#fef08a";
            ctx.font = "900 15px 'Segoe UI', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`⛩️ ВСТАНЬТЕ В ЦЕНТР АРЕНЫ [${inCount}/3]`, canvas.width / 2, 74);
        }

        // Stage 3 10-Second Timer (top center)
        if (storyTrials.stage === 3) {
            let remSec = Math.max(0, storyTrials.targetTimer / 60).toFixed(1);
            let isUrgent = storyTrials.targetTimer < 180;
            ctx.fillStyle = isUrgent ? "rgba(127, 29, 29, 0.95)" : "rgba(15, 23, 42, 0.95)";
            ctx.strokeStyle = isUrgent ? "#ef4444" : "#f59e0b";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(canvas.width / 2 - 110, 48, 220, 42, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isUrgent ? "#fecaca" : "#fef08a";
            ctx.font = "900 18px 'Segoe UI', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`⏱️ ${remSec} сек  [${storyTrials.targets.length}/5]`, canvas.width / 2, 75);
        }

        // Stage 4 Boss Health Bar (top center)
        if (storyTrials.stage === 4 && storyTrials.demon) {
            let d = storyTrials.demon;
            let barW = 380, barH = 22;
            let bx = canvas.width / 2 - barW / 2, by = 48;
            let hpW = Math.max(0, (d.hp / d.maxHp) * barW);

            ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
            ctx.strokeStyle = "#dc2626";
            ctx.lineWidth = 2.5;
            ctx.fillRect(bx, by, barW, barH);
            ctx.strokeRect(bx, by, barW, barH);

            ctx.fillStyle = "#dc2626";
            ctx.fillRect(bx, by, hpW, barH);

            ctx.fillStyle = "#fef2f2";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`⚔️ ИСПЫТАТЕЛЬНЫЙ ДЕМОН  [${d.hp.toFixed(1)} / ${d.maxHp}]`, canvas.width / 2, by + 16);
        }

        // In-game notices (e.g. heal forbidden)
        if (storyTrials.noticeTimer > 0 && storyTrials.noticeText) {
            ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            let nw = 340;
            ctx.beginPath();
            ctx.roundRect(canvas.width / 2 - nw / 2, canvas.height - 85, nw, 32, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#fca5a5";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(storyTrials.noticeText, canvas.width / 2, canvas.height - 64);
        }

        // Announcement Banner
        if (storyTrials.announcementTimer > 0 && storyTrials.announcement) {
            let bw = Math.min(680, canvas.width - 32);
            ctx.fillStyle = "rgba(15, 23, 42, 0.96)";
            ctx.strokeStyle = storyTrials.announcementColor;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = storyTrials.announcementColor;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.roundRect(canvas.width / 2 - bw / 2, 98, bw, 42, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = storyTrials.announcementColor;
            ctx.font = "900 16px 'Segoe UI', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(storyTrials.announcement, canvas.width / 2, 125);
        }
        ctx.restore();
    }
}


