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
    ARENA_W: 9650,
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
    trialsWeaponGranted: true,
    trialsGateY: 420,
    trialsGateOpen: false,
    explored: {
        startForest: true,
        altar: false,
        bench1: false,
        pond: false,
        upperTier: false,
        airZone: false,
        cliffShaft: false,
        lowerTier: false,
        earthZone: false,
        bench2: false,
        trialsGates: false,
        trialsArena: false,
        rewardRoom: false
    },
    bluePowerUnlocked: false,
    tetyaSceneStarted: false,
    tetyaDialogueTriggered: false,
    checkpoint: { x: 120, y: 350, stance: 'WATER', hp: 5, benchId: 0 },
    leaves: [],
    grassBlades: [],
    cutGrassParticles: [],
    waterRipples: [],
    waterDrops: [],
    ambientDrips: [],
    ambientDripTimer: 0,
    silkFlies: [],
    sporeSpitters: [],
    sporeProjectiles: [],
    stars: [],
    campfireFlames: [],
    backpackSlots: 6,
    backpack: [],
    backpackSelectedIndex: 0,
    dashUnlocked: false,
    dashMaster: null, // 'WATER', 'AIR', 'EARTH'
    flaskDewCollected: false,
    dashScrollCollected: false,
    room1VinesBroken: false,
    room1SecretWallHp: 2,
    room1SecretWallBroken: false,
    secretRoomAnnounce: 0,
    room2OneWayWallHp: 1,
    room2OneWayBroken: true,
    currentRoom: 1, // 1 = Descent & Spikes, 2 = Scroll Cavern
    roomTransitioning: false,
    roomFadeAlpha: 0.0,
    room2BannerTimer: 0,
    deathFadeAlpha: 0.0,
    deathTimer: 0,
    hazardFlash: 0,
    scrollRitual: null, // { active: false, stage: 'PROMPT_ATTACK', hero: null, timer: 0 }
    mossCrawlers: [],
    mossCrawlerDefeated: false,
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

        // 5. Lower Underground Tier (Floor 3: X = -480..1960, Y = 850) - Bench 2 & Trials Gate Corridor
        { x: -480, y: STORY_CONFIG.LOWER_FLOOR, w: 2440, h: 65, solid: true, tier: 3 },

        // --- ROOM 1: 3-TIER PARKOUR DESCENT & SPIKES (Screen-Height Tiers matching user sketches!) ---
        // Left boundary wall of Middle & Bottom Tier (X = 1040, Y = 960..2020)
        { x: 1040, y: 960, w: 40, h: 1060, solid: true, isWall: true },
        // Right boundary wall of Room 1 (X = 2440, Y = 850..2020)
        { x: 2440, y: 850, w: 40, h: 1170, solid: true, isWall: true },

        // Shaft 1: Top Tier (Bench 2 at Y=850) <-> Middle Tier (Y=1400) - Staggered solid platforms (стена в воздухе)
        { x: 1980, y: 930,  w: 160, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 2260, y: 1030, w: 140, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 2020, y: 1120, w: 140, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 2260, y: 1210, w: 140, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 2020, y: 1305, w: 140, h: 24, solid: true, mossy: true, isRoom1: true },

        // Middle Tier (Y = 1400) - Path moves RIGHT to LEFT!
        // Solid landing floor right of center spikes (X: 1960..2380)
        { x: 1960, y: 1400, w: 420, h: 40, solid: true, mossy: true, isRoom1: true },
        // Solid sub-floor under right spike pit (X: 2380..2480)
        { x: 2380, y: 1410, w: 100, h: 40, solid: true, isFloor: true, isRoom1: true },
        // Floating rock ledge directly over center sunken spike pit (Sketch 1 🟢 - jump-through floating platform!)
        { x: 1720, y: 1350, w: 200, h: 24, canJumpThrough: true, solid: false, mossy: true, isRoom1: true },
        // Solid sub-floor under center spike pit (X: 1680..1960)
        { x: 1680, y: 1410, w: 280, h: 40, solid: true, isFloor: true, isRoom1: true },
        // Solid floor left of center spikes (X: 1420..1680)
        { x: 1420, y: 1400, w: 260, h: 40, solid: true, mossy: true, isRoom1: true },
        // Hanging Vine Barrier (Sketch 1 Red Arrow 🌿: X = 1420, Y = 960..1400) - slashed with attack
        { x: 1420, y: 960,  w: 30,  h: 440, solid: !storyState.room1VinesBroken, isVineBarrier: true, isRoom1: true },
        // Solid floor past vines leading to left drop-off (X: 1200..1420)
        { x: 1200, y: 1400, w: 220, h: 40, solid: true, mossy: true, isRoom1: true },

        // Shaft 2: Middle Tier left side (Y=1400) <-> Bottom Tier (Y=1950) - Staggered solid platforms (стена в воздухе)
        { x: 1080, y: 1490, w: 110, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 1270, y: 1580, w: 110, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 1080, y: 1670, w: 110, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 1270, y: 1760, w: 110, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 1080, y: 1855, w: 110, h: 24, solid: true, mossy: true, isRoom1: true },

        // Bottom Tier (Y = 1950) - Path moves LEFT to RIGHT!
        // Continuous Solid Bottom Tier Floor (X: 1040..2320, Y = 1950 - seamless, no snagging step at X=1120)
        { x: 1040, y: 1950, w: 1280, h: 60, solid: true, mossy: true, tier: 3, isRoom1: true },

        // High Path Steps to Secret Room (Sketch 1 White Line): jumps UP to Secret Room (solid floating blocks!)
        { x: 1680, y: 1850, w: 120, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 1840, y: 1750, w: 120, h: 24, solid: true, mossy: true, isRoom1: true },
        { x: 2000, y: 1650, w: 120, h: 24, solid: true, mossy: true, isRoom1: true },

        // Secret Room (Sketch 1 Pink Arrow 🧱: X = 2120..2480, Y = 1520..1650)
        { x: 2120, y: 1520, w: 30,  h: 130, solid: !storyState.room1SecretWallBroken, isSecretWall: true, isRoom1: true },
        { x: 2120, y: 1650, w: 340, h: 30,  solid: true, mossy: true, isRoom1: true },
        { x: 2120, y: 1500, w: 340, h: 24,  solid: true, isWall: true, isRoom1: true },
        { x: 2440, y: 1500, w: 30,  h: 180, solid: true, isWall: true, isRoom1: true },

        // --- ROOM 2: SCROLL CAVERN & SHORTCUT ARCHWAY (X: 8200..9580, Y: 700..1860) ---
        // Ceiling with top-right entrance drop shaft (Sketch 2 Purple Circle: shaft at X = 9320..9460)
        { x: 8200, y: 700,  w: 1120, h: 30, solid: true, isWall: true, isRoom2: true },
        { x: 9460, y: 700,  w: 120,  h: 30, solid: true, isWall: true, isRoom2: true },
        { x: 9320, y: 480,  w: 24,   h: 220, solid: true, isWall: true, isRoom2: true },
        { x: 9460, y: 480,  w: 24,   h: 220, solid: true, isWall: true, isRoom2: true },
        // Left boundary wall of Room 2 with Archway opening at Y: 1360..1520
        { x: 8170, y: 700,  w: 30,  h: 660,  solid: true, isWall: true, isRoom2: true }, // Upper wall: Y = 700..1360
        { x: 8170, y: 1520, w: 30,  h: 340,  solid: true, isWall: true, isRoom2: true }, // Lower wall: Y = 1520..1860
        { x: 9550, y: 700,  w: 30,  h: 1160, solid: true, isWall: true, isRoom2: true },
        // Upper Entrance Landing Ledge (right under entrance shaft at X: 9240..9500)
        { x: 9240, y: 1120, w: 260, h: 26, solid: true, mossy: true, isRoom2: true },

        // Exit Archway Ledge (threshold of the corridor leading back to Room 1: X = 8170..8300, Y = 1520)
        { x: 8170, y: 1520, w: 130, h: 24, solid: true, mossy: true, isRoom2: true },

        // Stepping Stones between Chamber (X = 8680, Y = 1540) and Exit Archway (X = 8300, Y = 1520)
        { x: 8350, y: 1520, w: 110, h: 24, solid: true, mossy: true, isRoom2: true },
        { x: 8520, y: 1530, w: 160, h: 24, solid: true, mossy: true, isRoom2: true },

        // Left climbable steps from Bottom Floor (Y = 1800) back up to Exit Platform (Y = 1520)
        { x: 8440, y: 1710, w: 100, h: 24, solid: true, mossy: true, isRoom2: true },
        { x: 8350, y: 1615, w: 100, h: 24, solid: true, mossy: true, isRoom2: true },

        // Room 2 Continuous Solid Bottom Floor (X: 8170..9480, Y = 1800 - seamless, no snagging step at X=8320)
        { x: 8170, y: 1800, w: 1310, h: 60, solid: true, tier: 3, isRoom2: true },
        // Bottom-Right Steps leading up into central chamber (Sketch 2 bottom right 🟢): 1800 -> 1715 -> 1630 -> 1540 (~85px hops)
        { x: 9230, y: 1715, w: 120, h: 24, solid: true, mossy: true, isRoom2: true },
        { x: 9362, y: 1628, w: 110, h: 24, solid: true, mossy: true, isRoom2: true },
        // Central Raised Chamber Floor & Roof (housing Dash Scroll and Shortcut Passage)
        { x: 8680, y: 1540, w: 660, h: 30, solid: true, mossy: true, isRoom2: true },
        { x: 8680, y: 1360, w: 660, h: 30, solid: true, isCeiling: true, isRoom2: true },
        { x: 8680, y: 1360, w: 35,  h: 180, solid: false, isOneWayWall: true, isRoom2: true },

        // Dedicated Isolated Trials Arena Chamber (X = 4800..6300, Y = 430..870)
        // Hidden from corridor view; accessible ONLY via Arch Gate teleport!
        { x: 4780, y: STORY_CONFIG.LOWER_FLOOR, w: 1540, h: 65, solid: true, isTrialsArenaFloor: true },
        { x: 4780, y: 440, w: 25, h: 420, solid: true, isWall: true, isTrialsArenaWall: true },
        { x: 6295, y: 440, w: 25, h: 420, solid: !(typeof storyTrials !== 'undefined' && storyTrials && storyTrials.trialsCleared), isWall: !(typeof storyTrials !== 'undefined' && storyTrials && storyTrials.trialsCleared), isTrialsArenaWall: true },
        { x: 4780, y: 430, w: 1540, h: 20, solid: true, isTrialsCeiling: true },
        // Elevated Combat Ledges in Arena (High ground for Air and party maneuver)
        { x: 4960, y: 720, w: 180, h: 18, solid: true, isArenaLedge: true },
        { x: 5960, y: 720, w: 180, h: 18, solid: true, isArenaLedge: true },
        // Overhead Maze Platforms (Stage 2 ONLY - solid dynamically toggled, center gap 60px)
        { x: 5440, y: 720, w: 80, h: 16, solid: false, isMazeBase1: true },
        { x: 5580, y: 720, w: 80, h: 16, solid: false, isMazeBase2: true },
        { x: 5440, y: 530, w: 220, h: 16, solid: false, isMazeRoof: true },

        // 6. Chamber of Ancient Power / Reward Room (X = 6295..7700, Y = 430..870)
        { x: 6295, y: STORY_CONFIG.LOWER_FLOOR, w: 1405, h: 65, solid: true, isRewardFloor: true },
        { x: 6295, y: 430, w: 1405, h: 20, solid: true, isRewardCeiling: true },
        { x: 7680, y: 430, w: 40, h: 440, solid: true, isWall: true }
    ];
}

// --- UNIVERSAL STORY DIALOGUE SYSTEM ---
// Styled with glowing neon banner and top-center heraldic crest badge (matching Timur's sketch)
let storyDialogue = {
    active: false,
    queue: [],
    currentIndex: 0,
    charIndex: 0,
    isFullyRevealed: false,
    onComplete: null
};

function startStoryDialogue(lines, onComplete) {
    if (!lines || !lines.length) return;
    storyDialogue.active = true;
    storyDialogue.queue = lines;
    storyDialogue.currentIndex = 0;
    storyDialogue.charIndex = 0;
    storyDialogue.isFullyRevealed = false;
    storyDialogue.onComplete = onComplete || null;
    if (typeof playSound === 'function') playSound('select');
}

function updateStoryDialogue() {
    if (!storyDialogue.active) return;
    let cur = storyDialogue.queue[storyDialogue.currentIndex];
    if (!cur) {
        storyDialogue.active = false;
        if (storyDialogue.onComplete) {
            let cb = storyDialogue.onComplete;
            storyDialogue.onComplete = null;
            cb();
        }
        return;
    }
    if (!storyDialogue.isFullyRevealed) {
        storyDialogue.charIndex += 1;
        if (storyDialogue.charIndex >= cur.text.length) {
            storyDialogue.charIndex = cur.text.length;
            storyDialogue.isFullyRevealed = true;
        }
    }
}

function advanceStoryDialogue() {
    if (!storyDialogue.active) return;
    let cur = storyDialogue.queue[storyDialogue.currentIndex];
    if (!cur) return;
    if (!storyDialogue.isFullyRevealed) {
        storyDialogue.charIndex = cur.text.length;
        storyDialogue.isFullyRevealed = true;
        if (typeof playSound === 'function') playSound('select');
    } else {
        storyDialogue.currentIndex++;
        if (storyDialogue.currentIndex < storyDialogue.queue.length) {
            storyDialogue.charIndex = 0;
            storyDialogue.isFullyRevealed = false;
            if (typeof playSound === 'function') playSound('select');
        } else {
            storyDialogue.active = false;
            let cb = storyDialogue.onComplete;
            storyDialogue.onComplete = null;
            if (cb) cb();
        }
    }
}

function wrapStoryDialogueText(context, text, maxWidth) {
    let words = text.split(' ');
    let lines = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
        let testLine = currentLine ? (currentLine + ' ' + words[i]) : words[i];
        if (context.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function drawStoryDialogue() {
    if (!storyDialogue.active) return;
    let cur = storyDialogue.queue[storyDialogue.currentIndex];
    if (!cur) return;

    ctx.save();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let boxW = Math.min(880, canvas.width - 48);
    let boxH = 135;
    let boxX = (canvas.width - boxW) / 2;
    let boxY = 26;

    // 1. Dark translucent glass background
    ctx.save();
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(8, 14, 26, 0.94)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 16);
    ctx.fill();

    // 2. Thick luminous white border with cyan glow
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // 3. Top-Center Crest Badge
    let badgeW = 76;
    let badgeH = 34;
    let badgeX = canvas.width / 2 - badgeW / 2;
    let badgeY = boxY - badgeH / 2;

    let speakerCol = '#00e5ff';
    let speakerIcon = '💧';
    if (cur.speaker === 'AIR') {
        speakerCol = '#facc15';
        speakerIcon = '💨';
    } else if (cur.speaker === 'EARTH') {
        speakerCol = '#4ade80';
        speakerIcon = '🌿';
    } else if (cur.speaker === 'TETYA') {
        speakerCol = '#f8fafc';
        speakerIcon = '⚜️';
    } else if (cur.speaker === 'GUARDIAN') {
        speakerCol = '#f43f5e';
        speakerIcon = '⚔️';
    }

    // Badge pill container
    ctx.save();
    ctx.fillStyle = "#020617";
    ctx.shadowColor = speakerCol;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = speakerCol;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17);
    ctx.fill();
    ctx.stroke();

    // Emblem inside badge
    ctx.shadowBlur = 8;
    ctx.font = "20px 'Segoe UI Emoji', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(speakerIcon, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
    ctx.restore();

    // 4. Speaker Name Header
    ctx.save();
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = speakerCol;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = speakerCol;
    ctx.shadowBlur = 8;
    ctx.fillText(cur.name || cur.speaker, boxX + 28, boxY + 22);
    ctx.restore();

    // 5. Text content with typewriter reveal & word wrap
    ctx.save();
    ctx.font = "bold 15.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    let revealedText = cur.text.slice(0, storyDialogue.charIndex);
    let wrappedLines = wrapStoryDialogueText(ctx, revealedText, boxW - 56);
    let lineY = boxY + 48;
    for (let line of wrappedLines) {
        ctx.fillText(line, boxX + 28, lineY);
        lineY += 23;
    }
    ctx.restore();

    // 6. Next prompt in bottom right
    ctx.save();
    let promptAlpha = storyDialogue.isFullyRevealed ? (0.5 + 0.5 * Math.sin(Date.now() * 0.007)) : 0.4;
    ctx.fillStyle = `rgba(224, 242, 254, ${promptAlpha})`;
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    let promptStr = storyDialogue.isFullyRevealed ? "[X / Space / E] ▶ Далее" : "[X / Space] Быстро ⏩";
    ctx.fillText(promptStr, boxX + boxW - 22, boxY + boxH - 12);
    ctx.restore();

    ctx.restore();
}
window.startStoryDialogue = startStoryDialogue;
window.advanceStoryDialogue = advanceStoryDialogue;

// --- ANCIENT POWER RITUAL CUTSCENE SYSTEM ---
// The light-cyan thread emerges from chest, weaves in air, splits in 3, infuses heroes,
// flashes white-blue, then cuts to iconic black screen with floating thread: "получена голубая сила"
let storyRitual = {
    active: false,
    timer: 0,
    phase: 'IDLE', // GESTURE, THREAD_RISE, THREAD_DANCE, THREAD_SPLIT, INFUSE, FLASH, BLACK_SCREEN
    cyanFlashAlpha: 0,
    blackScreenTimer: 0,
    particles: []
};

function startAncientRitualCutscene() {
    storyRitual.active = true;
    storyRitual.timer = 0;
    storyRitual.phase = 'GESTURE';
    storyRitual.cyanFlashAlpha = 0;
    storyRitual.blackScreenTimer = 0;
    storyRitual.particles = [];
    if (typeof playSound === 'function') playSound('lightChime');
}

function updateAncientRitual() {
    if (!storyRitual.active) return;
    storyRitual.timer++;

    // Freeze heroes in position facing chest during ritual
    let waterPl = players[0];
    let airPl = players.find(pl => pl && pl.type === 'AIR');
    let earthPl = players.find(pl => pl && pl.type === 'EARTH');

    if (waterPl) { waterPl.x = 6850; waterPl.y = 800; waterPl.vx = 0; waterPl.vy = 0; waterPl.facingRight = true; }
    if (airPl) { airPl.x = 6790; airPl.y = 800; airPl.vx = 0; airPl.vy = 0; airPl.facingRight = true; }
    if (earthPl) { earthPl.x = 6730; earthPl.y = 800; earthPl.vx = 0; earthPl.vy = 0; earthPl.facingRight = true; }

    // Phase transitions
    if (storyRitual.timer === 70) {
        storyRitual.phase = 'THREAD_RISE';
        if (typeof playSound === 'function') playSound('shuriken');
    } else if (storyRitual.timer === 170) {
        storyRitual.phase = 'THREAD_DANCE';
        if (typeof playSound === 'function') playSound('bladeSpin');
    } else if (storyRitual.timer === 280) {
        storyRitual.phase = 'THREAD_SPLIT';
        if (typeof playSound === 'function') {
            playSound('parry');
            playSound('lightChime');
        }
        if (typeof triggerShake === 'function') triggerShake(5, 12);
    } else if (storyRitual.timer === 370) {
        storyRitual.phase = 'INFUSE';
        if (typeof playSound === 'function') {
            playSound('lightChime');
            playSound('shuriken');
        }
    } else if (storyRitual.timer === 470) {
        storyRitual.phase = 'FLASH';
        storyRitual.cyanFlashAlpha = 1.0;
        if (typeof playSound === 'function') {
            playSound('lightChime');
            playSound('parry');
        }
        if (typeof triggerShake === 'function') triggerShake(8, 20);
    } else if (storyRitual.timer === 530) {
        storyRitual.phase = 'BLACK_SCREEN';
        storyRitual.blackScreenTimer = 0;
        storyRitual.cyanFlashAlpha = 0;
        if (typeof playSound === 'function') playSound('lightChime');
    }

    if (storyRitual.phase === 'FLASH') {
        storyRitual.cyanFlashAlpha = Math.max(0.7, 1.0 - (storyRitual.timer - 470) / 120);
    }

    if (storyRitual.phase === 'BLACK_SCREEN') {
        storyRitual.blackScreenTimer++;
        if (storyRitual.blackScreenTimer >= 300) {
            finishAncientRitual();
        }
    }
}

function finishAncientRitual() {
    if (!storyRitual.active) return;
    storyRitual.active = false;
    storyRitual.phase = 'IDLE';
    storyRitual.cyanFlashAlpha = 0;
    storyState.bluePowerUnlocked = true;
    storyState.guardianDefeated = true;
    storyState.comboUnlocked = true;
    sharedHeals = 3;
    maxSharedHeals = 3;
    sharedHealPoints = 12;

    // Fully heal all party members and reset any active droplet!
    for (let pl of players) {
        if (pl) {
            pl.hp = pl.maxHp || 5;
            pl.isDowned = false;
            pl.downedTimer = 0;
            pl.waterDropActive = false;
            pl.waterDrop = null;
        }
    }

    if (typeof playSound === 'function') playSound('lightChime');
    if (typeof triggerShake === 'function') triggerShake(3, 6);

    // Launch post-ritual dialogue with Тётя
    setTimeout(() => {
        startPostRitualDialogue();
    }, 150);
}
window.finishAncientRitual = finishAncientRitual;

// --- POST-RITUAL CONVERSATIONS WITH ТЁТЯ ---
let tetyaTalkCycle = 0;

function startPostRitualDialogue() {
    let earthPl = players.find(pl => pl && pl.type === 'EARTH');
    let airPl = players.find(pl => pl && pl.type === 'AIR');
    let waterPl = players[0];

    if (earthPl) { earthPl.x = 6730; earthPl.y = 800; earthPl.vx = 0; earthPl.facingRight = true; }
    if (airPl) { airPl.x = 6790; airPl.y = 800; airPl.vx = 0; airPl.facingRight = true; }
    if (waterPl) { waterPl.x = 6850; waterPl.y = 800; waterPl.vx = 0; waterPl.facingRight = true; }

    startStoryDialogue([
        { speaker: 'TETYA', name: 'Тётя', text: 'Свершилось. Теперь древняя связанная сила течёт в ваших сердцах. Вы больше не просто союзники — ваши судьбы неразрывно сплетены.' },
        { speaker: 'WATER', name: 'Вода', text: 'Я чувствую... тепло. Но и странную тяжесть. Как будто мы дышим в один такт.' },
        { speaker: 'TETYA', name: 'Тётя', text: 'Именно так. Эта связь изменила саму природу вашей жизни. Отныне, если вы потерпите поражение в бою, сила не позволит вашим душам рассеяться. Она притянет вас обратно к покою — к костру и скамейке, на которой вы отдыхали.' },
        { speaker: 'EARTH', name: 'Земля', text: 'Значит, скамейка у костра теперь наше убежище?' },
        { speaker: 'TETYA', name: 'Тётя', text: 'Да. Огонь костра стабилизирует силу. Но будьте осторожны: если один из вас окажется на волоске от гибели, сила попытается спасти его, забрав энергию у остальных. Берегите друг друга.' },
        { speaker: 'AIR', name: 'Воздух', text: 'А что дальше? Испытание пройдено, монстров здесь больше нет...' },
        { speaker: 'TETYA', name: 'Тётя', text: 'Впереди, в конце зала, открылся портал возвращения. Ступайте через него. Наш мир огромен, и где-то там настоящие демоны уже пробуждаются ото сна. А если вам понадобится совет — возвращайтесь сюда, я всегда буду ждать вас в этом зале.' }
    ], () => {
        storyState.tetyaPostRitualTalkDone = true;
    });
}

function triggerTetyaFollowupDialogue() {
    let earthPl = players.find(pl => pl && pl.type === 'EARTH');
    let airPl = players.find(pl => pl && pl.type === 'AIR');
    let waterPl = players[0];

    if (waterPl) { waterPl.facingRight = true; waterPl.vx = 0; }
    if (airPl) { airPl.facingRight = true; airPl.vx = 0; }
    if (earthPl) { earthPl.facingRight = true; earthPl.vx = 0; }

    let dialogues = [
        [
            { speaker: 'TETYA', name: 'Тётя', text: 'Демоны черпают мощь из страха и ярости. Ваша связанная сила — их прямая противоположность. Наносите удары в согласии, и ни один демон не устоит перед вами.' },
            { speaker: 'WATER', name: 'Вода', text: 'Мы будем помнить это, Тётя.' }
        ],
        [
            { speaker: 'TETYA', name: 'Тётя', text: 'Никогда не проходите мимо костров. Отдых на скамейке не только залечивает раны — пламя обновляет связующую силу между вашими сердцами.' },
            { speaker: 'AIR', name: 'Воздух', text: 'И там так приятно потрескивает огонь!' }
        ],
        [
            { speaker: 'TETYA', name: 'Тётя', text: 'Я вижу в ваших глазах решимость. Ступайте вперёд, мир за пределами этого зала ждёт своих защитников.' },
            { speaker: 'EARTH', name: 'Земля', text: 'Мы справимся. Теперь мы единая команда.' }
        ]
    ];

    let currentLines = dialogues[tetyaTalkCycle % dialogues.length];
    tetyaTalkCycle++;
    startStoryDialogue(currentLines);
}

// World-Space Cutscene Rendering (Draws in world coordinates inside camera transform)
function drawAncientRitualWorld() {
    if (!storyRitual.active) return;
    let t = storyRitual.timer;
    let chestX = 6952;
    let chestY = 818;
    let tetyaX = 7060;
    let tetyaY = 780;

    let heroes = [
        { type: 'WATER', name: 'Вода', x: 6850, y: 775, color: '#38bdf8' },
        { type: 'AIR', name: 'Воздух', x: 6790, y: 775, color: '#93c5fd' },
        { type: 'EARTH', name: 'Земля', x: 6730, y: 775, color: '#67e8f9' }
    ];

    ctx.save();

    // 1. GESTURE: Energy crackles and sparks between chest and Тётя
    if (storyRitual.phase === 'GESTURE') {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 15;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            let startX = chestX + Math.sin(t * 0.1 + i) * 12;
            let startY = chestY - 10;
            let endX = tetyaX - 25;
            let endY = tetyaY - 15;
            ctx.moveTo(startX, startY);
            let midX = (startX + endX) / 2;
            let midY = Math.min(startY, endY) - 20 - Math.sin(t * 0.15 + i * 2) * 18;
            ctx.quadraticCurveTo(midX, midY, endX, endY);
            ctx.stroke();
        }
    }

    // 2. THREAD_RISE: Glowing light-blue thread emerges upwards from the chest!
    else if (storyRitual.phase === 'THREAD_RISE') {
        let p = Math.min(1.0, (t - 70) / 90);
        let topY = chestY - p * 125; // Rises from 818 up to 693

        // Wide cyan aura
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 10;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.moveTo(chestX, chestY);
        for (let y = chestY; y >= topY; y -= 5) {
            let wave = Math.sin(Date.now() * 0.008 + y * 0.06) * 7;
            ctx.lineTo(chestX + wave, y);
        }
        ctx.stroke();

        // Brilliant inner white-cyan core
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Tip glowing energy bead
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 26;
        ctx.beginPath();
        let tipWave = Math.sin(Date.now() * 0.008 + topY * 0.06) * 7;
        ctx.arc(chestX + tipWave, topY, 9, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. THREAD_DANCE: Тётя weaves the thread in the air with hand motions!
    else if (storyRitual.phase === 'THREAD_DANCE') {
        let loopT = Date.now() * 0.005;
        let p1X = chestX - 10 + Math.sin(loopT * 1.5) * 25;
        let p1Y = 705 + Math.cos(loopT * 1.5) * 22;
        let p2X = 7010 + Math.cos(loopT * 1.2) * 20;
        let p2Y = 695 + Math.sin(loopT * 1.2) * 20;

        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 22;

        // Outer glow
        ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(chestX, chestY);
        ctx.bezierCurveTo(p1X, p1Y + 30, p2X, p2Y + 30, tetyaX - 25, tetyaY - 18);
        ctx.stroke();

        // Mid ribbon
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 4;
        ctx.stroke();

        // Core line
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Harmonic winding spiral helix around the main ribbon
        ctx.strokeStyle = "rgba(224, 242, 254, 0.85)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        let steps = 30;
        for (let i = 0; i <= steps; i++) {
            let u = i / steps;
            let buX = Math.pow(1 - u, 3) * chestX + 3 * Math.pow(1 - u, 2) * u * p1X + 3 * (1 - u) * Math.pow(u, 2) * p2X + Math.pow(u, 3) * (tetyaX - 25);
            let buY = Math.pow(1 - u, 3) * chestY + 3 * Math.pow(1 - u, 2) * u * (p1Y + 30) + 3 * (1 - u) * Math.pow(u, 2) * (p2Y + 30) + Math.pow(u, 3) * (tetyaY - 18);
            let spiralWave = Math.sin(loopT * 3 + u * 12) * 8;
            if (i === 0) ctx.moveTo(buX, buY + spiralWave);
            else ctx.lineTo(buX, buY + spiralWave);
        }
        ctx.stroke();
    }

    // 4. THREAD_SPLIT: Divided into 3 distinct glowing pieces in the air!
    else if (storyRitual.phase === 'THREAD_SPLIT') {
        let p = Math.min(1.0, (t - 280) / 75);
        let ease = p * p * (3 - 2 * p);
        let centerX = 6935;
        let centerY = 715;

        let branchTargets = [
            { x: centerX - 55 * ease, y: centerY + 10 * ease, label: 'WATER' },
            { x: centerX, y: centerY - 45 * ease, label: 'AIR' },
            { x: centerX + 55 * ease, y: centerY + 10 * ease, label: 'EARTH' }
        ];

        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 20;

        for (let b of branchTargets) {
            // Radiant branch from center
            ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            let cpx = (centerX + b.x) / 2 + Math.sin(Date.now() * 0.01) * 6;
            let cpy = (centerY + b.y) / 2 - 8;
            ctx.quadraticCurveTo(cpx, cpy, b.x, b.y);
            ctx.stroke();

            // Core
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Luminous orb node at the tip of each piece
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Glowing ring around each tip node
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 14 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Connecting triad triangle of light
        ctx.strokeStyle = "rgba(186, 230, 253, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(branchTargets[0].x, branchTargets[0].y);
        ctx.lineTo(branchTargets[1].x, branchTargets[1].y);
        ctx.lineTo(branchTargets[2].x, branchTargets[2].y);
        ctx.closePath();
        ctx.stroke();
    }

    // 5. INFUSE: The 3 pieces fly through the air into the 3 heroes!
    else if (storyRitual.phase === 'INFUSE') {
        let p = Math.min(1.0, (t - 370) / 85);
        let ease = p * p * (3 - 2 * p);
        let startX = 6935;
        let startY = 705;

        for (let h of heroes) {
            let curX = startX + (h.x - startX) * ease;
            let curY = startY + (h.y - startY) * ease;
            let midX = (startX + h.x) / 2;
            let midY = Math.min(startY, h.y) - 45;

            // Stream of starlight arc
            ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
            ctx.lineWidth = 7;
            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 22;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(midX, midY, curX, curY);
            ctx.stroke();

            // Core brilliant white beam
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Leading projectile tip
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(curX, curY, 7, 0, Math.PI * 2);
            ctx.fill();

            // Hero absorption auras when power penetrates them
            if (ease > 0.45) {
                let absorbP = (ease - 0.45) / 0.55;

                // Vertical ascending pillar of light through each hero
                let colGrad = ctx.createLinearGradient(h.x, 830, h.x, 720);
                colGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
                colGrad.addColorStop(0.5, `rgba(56, 189, 248, ${absorbP * 0.45})`);
                colGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
                ctx.fillStyle = colGrad;
                ctx.fillRect(h.x - 22, 720, 44, 110);

                // Expanding shockwave rings
                ctx.strokeStyle = `rgba(0, 229, 255, ${1 - absorbP * 0.6})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(h.x, h.y, 15 + absorbP * 35, 0, Math.PI * 2);
                ctx.stroke();

                // Bright heart core
                ctx.fillStyle = "#ffffff";
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(h.x, h.y, 6 * absorbP, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    ctx.restore();
}

// Screen-Space Overlay Rendering (Flash & Iconic Black Screen Card)
function drawAncientRitualScreen() {
    if (!storyRitual.active) return;

    // 1. Full-screen Blinding Cyan-White Flash
    if (storyRitual.phase === 'FLASH' && storyRitual.cyanFlashAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(56, 189, 248, ${storyRitual.cyanFlashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `rgba(255, 255, 255, ${storyRitual.cyanFlashAlpha * 0.85})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // 2. Iconic Black Screen Presentation Card (matches sketch!)
    if (storyRitual.phase === 'BLACK_SCREEN') {
        ctx.save();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Solid pitch black background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let cx = canvas.width / 2;
        let cy = canvas.height / 2 - 25;

        // Draw floating diagonal glowing thread filament
        ctx.save();
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 24;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4.5;
        ctx.lineCap = "round";

        let fx1 = cx - 24, fy1 = cy + 32;
        let fx2 = cx + 24, fy2 = cy - 65;

        ctx.beginPath();
        ctx.moveTo(fx1, fy1);
        ctx.lineTo(fx2, fy2);
        ctx.stroke();

        // Delicate wavy harmonic filament winding around the line
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "rgba(224, 242, 254, 0.9)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        let steps = 40;
        for (let i = 0; i <= steps; i++) {
            let p = i / steps;
            let px = fx1 + (fx2 - fx1) * p;
            let py = fy1 + (fy2 - fy1) * p;
            let wave = Math.sin(Date.now() * 0.007 + p * 14) * 3.8;
            let perpX = -(fy2 - fy1) / 95;
            let perpY = (fx2 - fx1) / 95;
            let wx = px + perpX * wave;
            let wy = py + perpY * wave;
            if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
        ctx.restore();

        // Below filament: text "получена голубая сила"
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.fillText("получена голубая сила", cx, cy + 90);
        ctx.restore();

        // Subtle advance hint
        if (storyRitual.blackScreenTimer > 40) {
            ctx.save();
            let hintAlpha = 0.4 + 0.4 * Math.sin(Date.now() * 0.006);
            ctx.fillStyle = `rgba(148, 163, 184, ${hintAlpha})`;
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("[ Пробел / Нажмите для продолжения ] ▶", cx, cy + 130);
            ctx.restore();
        }

        ctx.restore();
    }
}

function drawAncientRitual() {
    drawAncientRitualScreen();
}

// --- CHAMBER OF ANCIENT POWER (POST-TRIALS REWARD ROOM) ---
// Dark masonry bricks, 2 heraldic crest shields, white floor line, chest with glowing cyan orb, Тётя figure
function drawChamberOfAncientPower() {
    let roomX1 = 6295;
    let roomX2 = 7680;
    let floorY = STORY_CONFIG.LOWER_FLOOR; // 850
    let ceilingY = 430;

    ctx.save();

    // 1. Chamber Background & Dark Brick Wall
    ctx.fillStyle = "#080c16";
    ctx.fillRect(roomX1, ceilingY, roomX2 - roomX1, floorY - ceilingY);

    ctx.strokeStyle = "rgba(30, 41, 59, 0.85)";
    ctx.lineWidth = 1.5;
    let bH = 34;
    let bW = 72;
    for (let by = ceilingY; by < floorY; by += bH) {
        let rowIdx = Math.floor((by - ceilingY) / bH);
        let xOffset = (rowIdx % 2 === 1) ? (bW / 2) : 0;
        ctx.beginPath();
        ctx.moveTo(roomX1, by);
        ctx.lineTo(roomX2, by);
        ctx.stroke();
        for (let bx = roomX1 + xOffset; bx < roomX2; bx += bW) {
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx, by + bH);
            ctx.stroke();
        }
    }

    // 2. Two Large Stone Heraldic Crest Shields on the wall (from Timur's sketch!)
    function drawHeraldicShield(sx, sy, sw, sh) {
        ctx.save();
        ctx.fillStyle = "#243042";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#020617";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(sx - sw / 2, sy);
        ctx.lineTo(sx - sw / 2 + 12, sy);
        ctx.lineTo(sx - sw / 2 + 12, sy - 6);
        ctx.lineTo(sx + sw / 2 - 12, sy - 6);
        ctx.lineTo(sx + sw / 2 - 12, sy);
        ctx.lineTo(sx + sw / 2, sy);
        ctx.lineTo(sx + sw / 2, sy + sh * 0.58);
        ctx.quadraticCurveTo(sx + sw / 2, sy + sh, sx, sy + sh);
        ctx.quadraticCurveTo(sx - sw / 2, sy + sh, sx - sw / 2, sy + sh * 0.58);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(100, 116, 139, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    drawHeraldicShield(6600, 520, 115, 145);
    drawHeraldicShield(7340, 520, 115, 145);

    // 3. Chamber Ceiling & Solid Boundaries
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(roomX1, ceilingY, roomX2 - roomX1, 20);
    ctx.fillRect(roomX2, ceilingY, 40, floorY - ceilingY + 50);

    // 4. Solid Floor & White Glowing Floor Line (matching Timur's drawing!)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(roomX1, floorY, roomX2 - roomX1, 55);

    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(roomX1, floorY);
    ctx.lineTo(roomX2, floorY);
    ctx.stroke();
    ctx.restore();

    // 5. Open Ancient Chest with Glowing Light-Blue / Cyan Orb (at X = 6920, Y = 818)
    let cx = 6920;
    let cy = floorY - 32;
    ctx.save();
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx, cy, 64, 32, 4);
    ctx.fill();
    ctx.stroke();

    // Chest metallic bands
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx + 16, cy);
    ctx.lineTo(cx + 16, cy + 32);
    ctx.moveTo(cx + 48, cy);
    ctx.lineTo(cx + 48, cy + 32);
    ctx.stroke();

    // Open chest lid
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy);
    ctx.lineTo(cx + 6, cy - 18);
    ctx.lineTo(cx + 70, cy - 18);
    ctx.lineTo(cx + 66, cy);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.stroke();

    // Pulsating Glowing Cyan Orb inside (disappears once taken by the ritual!)
    let chestHasPower = !storyState.bluePowerUnlocked && (!storyRitual.active || storyRitual.phase === 'GESTURE' || storyRitual.timer < 90);
    if (chestHasPower) {
        let pulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.005);
        if (storyRitual.active && storyRitual.phase === 'GESTURE') {
            pulse = 0.85 + 0.35 * Math.sin(storyRitual.timer * 0.25);
        }
        let orbGrad = ctx.createRadialGradient(cx + 32, cy - 2, 2, cx + 32, cy - 2, 28 * pulse);
        orbGrad.addColorStop(0, "#ffffff");
        orbGrad.addColorStop(0.35, "rgba(56, 189, 248, 0.95)");
        orbGrad.addColorStop(0.7, "rgba(0, 229, 255, 0.45)");
        orbGrad.addColorStop(1, "rgba(15, 23, 42, 0)");

        ctx.fillStyle = orbGrad;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(cx + 32, cy - 2, 28 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Rising energy sparkles from chest
        ctx.fillStyle = "#bae6fd";
        for (let i = 0; i < 4; i++) {
            let spY = cy - ((Date.now() * 0.04 + i * 22) % 65);
            let spX = cx + 32 + Math.sin(Date.now() * 0.006 + i * 2) * 12;
            ctx.beginPath();
            ctx.arc(spX, spY, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Open chest is now empty (the blue power was divided and granted to the heroes!)
        ctx.fillStyle = "#070b12";
        ctx.fillRect(cx + 6, cy + 4, 52, 24);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 6, cy + 4, 52, 24);
    }
    ctx.restore();

    // 6. Тётя (White stylized elegant figure matching sketch at X = 7060, Y = 800)
    let tx = 7060;
    let ty = floorY - 50;
    ctx.save();
    let bob = Math.sin(Date.now() * 0.003) * 2;
    ctx.shadowColor = "#bae6fd";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.fillStyle = "#ffffff";

    // Head
    ctx.beginPath();
    ctx.arc(tx, ty - 22 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Torso & Robe
    ctx.beginPath();
    ctx.moveTo(tx, ty - 11 + bob);
    ctx.lineTo(tx, ty + 20 + bob);
    ctx.stroke();

    // Dynamic arms: animated during the Ancient Power ritual!
    let leftArmX = tx - 18, leftArmY = ty + 4 + bob;
    let rightArmX = tx + 12, rightArmY = ty + 8 + bob;

    if (storyRitual.active && storyRitual.phase !== 'IDLE' && storyRitual.phase !== 'BLACK_SCREEN') {
        let rt = storyRitual.timer;
        if (storyRitual.phase === 'GESTURE' || storyRitual.phase === 'THREAD_RISE') {
            // Both hands raised towards chest to summon the power
            leftArmX = tx - 32; leftArmY = ty - 16 + Math.sin(rt * 0.1) * 3;
            rightArmX = tx - 24; rightArmY = ty - 22 + Math.cos(rt * 0.1) * 3;
        } else if (storyRitual.phase === 'THREAD_DANCE') {
            // Weaving hands in mystical circles in the air
            leftArmX = tx - 28 + Math.cos(rt * 0.08) * 10;
            leftArmY = ty - 16 + Math.sin(rt * 0.08) * 10;
            rightArmX = tx - 20 + Math.sin(rt * 0.08) * 10;
            rightArmY = ty - 22 + Math.cos(rt * 0.08) * 10;
        } else if (storyRitual.phase === 'THREAD_SPLIT') {
            // Hands thrust wide apart to divide the thread into 3
            leftArmX = tx - 36; leftArmY = ty - 24;
            rightArmX = tx + 20; rightArmY = ty - 24;
        } else if (storyRitual.phase === 'INFUSE') {
            // Both arms thrust forward directing the power into the 3 heroes
            leftArmX = tx - 38; leftArmY = ty - 10;
            rightArmX = tx - 32; rightArmY = ty - 4;
        }

        // Glowing cyan magical auras around Тётя's palms
        ctx.save();
        let hg1 = ctx.createRadialGradient(leftArmX, leftArmY, 1, leftArmX, leftArmY, 13);
        hg1.addColorStop(0, "#ffffff");
        hg1.addColorStop(0.45, "rgba(56, 189, 248, 0.95)");
        hg1.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = hg1;
        ctx.beginPath();
        ctx.arc(leftArmX, leftArmY, 13, 0, Math.PI * 2);
        ctx.fill();

        let hg2 = ctx.createRadialGradient(rightArmX, rightArmY, 1, rightArmX, rightArmY, 13);
        hg2.addColorStop(0, "#ffffff");
        hg2.addColorStop(0.45, "rgba(56, 189, 248, 0.95)");
        hg2.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = hg2;
        ctx.beginPath();
        ctx.arc(rightArmX, rightArmY, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Arms
    ctx.beginPath();
    ctx.moveTo(tx, ty - 4 + bob);
    ctx.lineTo(leftArmX, leftArmY);
    ctx.moveTo(tx, ty - 4 + bob);
    ctx.lineTo(rightArmX, rightArmY);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(tx, ty + 20 + bob);
    ctx.lineTo(tx - 10, floorY);
    ctx.moveTo(tx, ty + 20 + bob);
    ctx.lineTo(tx + 10, floorY);
    ctx.stroke();

    // Name badge above head
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f8fafc";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 10;
    ctx.fillText("⚜️ Тётя", tx, ty - 40 + bob);

    // Interactive talk prompt when near Тётя after the ritual
    if (storyState.bluePowerUnlocked && storyState.nearTetya && !storyDialogue.active && (!storyRitual || !storyRitual.active)) {
        let bobPrompt = Math.sin(Date.now() * 0.007) * 3;
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(tx - 70, ty - 78 + bobPrompt, 140, 26, 13);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#e0f2fe";
        ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText("💬 [E / Вверх] Поговорить", tx, ty - 61 + bobPrompt);
        ctx.restore();
    }
    ctx.restore();

    // 7. Sacred Return Portal at X = 7520 (active once blue power unlocked)
    if (storyState.bluePowerUnlocked) {
        let ptx = 7520;
        let pty = floorY;
        ctx.save();
        let portGrad = ctx.createLinearGradient(ptx, pty - 160, ptx, pty);
        portGrad.addColorStop(0, "rgba(56, 189, 248, 0.65)");
        portGrad.addColorStop(0.5, "rgba(0, 229, 255, 0.35)");
        portGrad.addColorStop(1, "rgba(15, 23, 42, 0.1)");
        ctx.fillStyle = portGrad;
        ctx.fillRect(ptx - 26, pty - 160, 52, 160);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 16;
        ctx.strokeRect(ptx - 28, pty - 165, 56, 165);

        ctx.fillStyle = "#e0f2fe";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⛩️ В СВЯТИЛИЩЕ", ptx, pty - 175);
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#86efac";
        ctx.fillText("«Шагните для возврата»", ptx, pty - 80);
        ctx.restore();
    }

    ctx.restore();
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
    let spawnedCount = 0;
    orderedHeroes.forEach((hType, idx) => {
        let role = storyState.heroAssignments[hType] || (idx === 0 ? 'P1' : 'AI');
        if (role === 'NONE') return; // Герой отключен и не следует за командой!
        let isP1 = (role === 'P1');
        let isP2 = (role === 'P2' && window.storyPlayerCount === 2);
        let keysObj = isP1 ? getStoryP1Keys() : (isP2 ? getStoryP2Keys() : getStoryP1Keys());
        let inType = isP1 ? p1InputType : (isP2 ? (p2InputType || 'KEYBOARD_2') : 'AI');

        let pl = createPlayer(spawnedCount + 1, hType, keysObj, inType, anchorX - 18 + spawnedCount * 22);
        pl.isAi = !(isP1 || isP2);
        pl.maxHp = 5;
        pl.hp = 5;
        pl.purpleHp = 0;
        pl.stance = (hType === 'WATER') ? (oldStances.WATER || 'LIGHT') : 'LIGHT';
        pl.abilities = { top: 'shuriken', mid: 'shuriken', bot: 'shuriken' };
        pl.x = anchorX - 18 + spawnedCount * 22;
        pl.y = anchorFloorY - 24;
        pl.lastSafeX = pl.x;
        pl.lastSafeY = pl.y;
        pl.vx = 0;
        pl.vy = 0;
        if (hType === 'AIR') pl.jumpPower = -11.9;
        applyBadgesToPlayer(pl, true);
        players.push(pl);
        spawnedCount++;
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

    // 2. Interactive grass blades across the world
    initStoryGrassBlades();

    // 2b. Spawn starting location enemies
    spawnStoryWorldEnemies();

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

// --- INTERACTIVE WORLD & GRASS SYSTEM (Silksong-Style Foliage) ---
function initStoryGrassBlades() {
    storyState.grassBlades = [];
    storyState.cutGrassParticles = [];

    // Helper to generate a row of grass along a ledge/floor
    function addGrassLine(x1, x2, y, step = 14) {
        for (let x = x1; x <= x2; x += step) {
            let h = 13 + Math.sin(x * 0.12) * 7 + Math.random() * 6;
            storyState.grassBlades.push({
                x: Math.round(x + (Math.random() * 4 - 2)),
                y: y,
                h: h,
                maxH: h,
                lean: (Math.random() - 0.5) * 3,
                springVx: 0,
                phase: Math.random() * Math.PI * 2,
                cut: false,
                color: (Math.random() > 0.45) ? "#22c55e" : ((Math.random() > 0.5) ? "#15803d" : "#4ade80")
            });
        }
    }

    // 1. Forest Floor 1 (0..3820, Y = 350)
    addGrassLine(10, 3810, STORY_CONFIG.FLOOR, 12);

    // 2. Room 1 Top Tier / Bench 2 corridor (entire tier from shaft at -470 to shaft drop at 2430, Y = 850)
    addGrassLine(-470, 2430, 850, 13);

    // 3. Room 1 Middle Tier: left floor (1200..1670), right floor (1970..2370), Plat 3 (1720..1910, Y = 1350)
    addGrassLine(1210, 1670, 1400, 15);
    addGrassLine(1970, 2370, 1400, 15);
    addGrassLine(1725, 1915, 1350, 13);

    // 4. Room 1 Bottom Tier (1050..2310, Y = 1950)
    addGrassLine(1050, 2310, 1950, 14);

    // 5. Room 2 Bottom Floor (8180..9470, Y = 1800) and Central Chamber Roof (8690..9330, Y = 1360)
    addGrassLine(8180, 9470, 1800, 15);
    addGrassLine(8690, 9330, 1360, 14);
}
window.initStoryGrassBlades = initStoryGrassBlades;

function regrowStoryGrass() {
    if (!storyState.grassBlades || storyState.grassBlades.length === 0) {
        initStoryGrassBlades();
        return;
    }
    for (let g of storyState.grassBlades) {
        g.cut = false;
        g.h = g.maxH;
        g.springVx = 0;
        g.lean = (Math.random() - 0.5) * 3;
    }
    storyState.cutGrassParticles = [];
}
window.regrowStoryGrass = regrowStoryGrass;

// --- STARTING LOCATION ENEMIES (Мховички, Шёлковые Мошки, Споровые Плевуны) ---
function spawnStoryWorldEnemies() {
    // 1. Moss Crawlers (Мховички - патрульные жучки)
    storyState.mossCrawlers = [
        // Room 1 Middle Tier Platform 3 over center spikes
        { id: 'mc_1', x: 1820, y: 1350 - 24, w: 36, h: 24, startX: 1740, endX: 1890, vx: 0.5, hp: 2, maxHp: 2, facingRight: true, hitTimer: 0 },
        // Room 1 Top Tier far right edge (leaving Bench 2 campfire peaceful!)
        { id: 'mc_top', x: 1780, y: 850 - 24, w: 34, h: 22, startX: 1680, endX: 1940, vx: 0.6, hp: 2, maxHp: 2, facingRight: true, hitTimer: 0 },
        // Room 1 Bottom Tier left side
        { id: 'mc_bot1', x: 1280, y: 1950 - 24, w: 36, h: 24, startX: 1120, endX: 1440, vx: 0.55, hp: 2, maxHp: 2, facingRight: false, hitTimer: 0 },
        // Room 1 Bottom Tier right side
        { id: 'mc_bot2', x: 1920, y: 1950 - 24, w: 36, h: 24, startX: 1800, endX: 2160, vx: 0.5, hp: 2, maxHp: 2, facingRight: true, hitTimer: 0 },
        // Room 2 Bottom Floor
        { id: 'mc_r2', x: 8850, y: 1800 - 24, w: 36, h: 24, startX: 8680, endX: 9180, vx: 0.55, hp: 2, maxHp: 2, facingRight: true, hitTimer: 0 }
    ];

    // 2. Silk Flies / Moths (Шёлковые мошки - парят в воздухе над пропастями, служат трамплинами для пого-прыжка!)
    storyState.silkFlies = [
        // Room 1 Middle Tier over center spikes (пого-отскок через яму)
        { id: 'sf_1', x: 1820, baseY: 1240, y: 1240, w: 34, h: 26, hp: 1, maxHp: 1, hitTimer: 0, phase: 0, bobSpeed: 0.05, bobAmp: 18, facingRight: true },
        // Room 1 Shaft 2 left drop-off
        { id: 'sf_2', x: 1180, baseY: 1620, y: 1620, w: 34, h: 26, hp: 1, maxHp: 1, hitTimer: 0, phase: 1.5, bobSpeed: 0.045, bobAmp: 16, facingRight: false },
        // Room 2 over entrance spike pit (пого-шорткат к арке выхода)
        { id: 'sf_3', x: 8280, baseY: 1640, y: 1640, w: 34, h: 26, hp: 1, maxHp: 1, hitTimer: 0, phase: 0.8, bobSpeed: 0.05, bobAmp: 20, facingRight: true },
        // Room 1 Bottom Tier high steps leading to secret room
        { id: 'sf_4', x: 1760, baseY: 1780, y: 1780, w: 34, h: 26, hp: 1, maxHp: 1, hitTimer: 0, phase: 2.2, bobSpeed: 0.04, bobAmp: 15, facingRight: true }
    ];

    // 3. Spore Spitters (Споровые плевуны - плюются отбиваемыми спорами, можно делать пого)
    storyState.sporeSpitters = [
        // Room 1 Bottom Tier
        { id: 'spit_1', x: 1540, y: 1950 - 28, w: 38, h: 28, hp: 3, maxHp: 3, shootTimer: 90, hitTimer: 0, facingRight: false },
        // Room 2 Central Chamber
        { id: 'spit_2', x: 8950, y: 1540 - 28, w: 38, h: 28, hp: 3, maxHp: 3, shootTimer: 130, hitTimer: 0, facingRight: false }
    ];

    storyState.sporeProjectiles = [];
}
window.spawnStoryWorldEnemies = spawnStoryWorldEnemies;

// --- WATER POND INTERACTIVE EFFECTS (Всплески, круги на воде, брызги) ---
function createWaterSplash(x, y, vy) {
    if (!storyState.waterDrops) storyState.waterDrops = [];
    if (!storyState.waterRipples) storyState.waterRipples = [];

    let count = Math.min(18, Math.max(8, Math.floor(Math.abs(vy || 3) * 3)));
    for (let i = 0; i < count; i++) {
        let angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
        let spd = 2.5 + Math.random() * (Math.abs(vy || 3) * 0.9);
        storyState.waterDrops.push({
            x: x + (Math.random() - 0.5) * 16,
            y: y + (Math.random() - 0.5) * 4,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            r: 2 + Math.random() * 2.5,
            alpha: 0.9,
            life: 25 + Math.random() * 15
        });
    }

    storyState.waterRipples.push({
        x: x,
        y: y,
        rx: 6,
        ry: 2.2,
        maxRx: 42,
        alpha: 0.85,
        timer: 30
    });
    storyState.waterRipples.push({
        x: x,
        y: y,
        rx: 2,
        ry: 1.0,
        maxRx: 24,
        alpha: 0.95,
        timer: 20
    });
}
window.createWaterSplash = createWaterSplash;

function addWaterSwimmingRipple(x, y, vx) {
    if (!storyState.waterRipples) storyState.waterRipples = [];
    if (!storyState.waterDrops) storyState.waterDrops = [];

    storyState.waterRipples.push({
        x: x,
        y: y,
        rx: 4,
        ry: 1.6,
        maxRx: 26,
        alpha: 0.75,
        timer: 22
    });

    for (let k = 0; k < 2; k++) {
        storyState.waterDrops.push({
            x: x - Math.sign(vx || 1) * 10 + (Math.random() - 0.5) * 6,
            y: y - 2,
            vx: -Math.sign(vx || 1) * (1.2 + Math.random() * 1.5),
            vy: -1.2 - Math.random() * 1.5,
            r: 1.5 + Math.random() * 1.5,
            alpha: 0.8,
            life: 18
        });
    }
}
window.addWaterSwimmingRipple = addWaterSwimmingRipple;

function createWaterExitSplash(x, y, vy) {
    if (!storyState.waterDrops) storyState.waterDrops = [];
    if (typeof playSound === 'function') playSound('waterSplash');

    for (let i = 0; i < 10; i++) {
        storyState.waterDrops.push({
            x: x + (Math.random() - 0.5) * 14,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: -3 - Math.random() * 4,
            r: 2 + Math.random() * 2,
            alpha: 0.85,
            life: 24
        });
    }
}
window.createWaterExitSplash = createWaterExitSplash;

function checkStoryWaterAttackHitbox(swordHitbox, pl) {
    if (!swordHitbox) return;
    let waterY = 356;
    let pondX1 = STORY_CONFIG.POND_X1 || 3820;
    let pondX2 = STORY_CONFIG.POND_X2 || 4500;
    if (swordHitbox.x + swordHitbox.width > pondX1 && swordHitbox.x < pondX2 &&
        swordHitbox.y <= waterY + 14 && swordHitbox.y + swordHitbox.height >= waterY - 8) {
        let hitX = Math.max(pondX1, Math.min(pondX2, swordHitbox.x + swordHitbox.width / 2));
        createWaterSplash(hitX, waterY, 5);
        if (typeof playSound === 'function') playSound('waterSplash');
    }
}
window.checkStoryWaterAttackHitbox = checkStoryWaterAttackHitbox;

function checkStoryGrassSlashHitbox(swordHitbox, pl) {
    if (!swordHitbox || !storyState.grassBlades) return;
    let cutAny = false;
    for (let g of storyState.grassBlades) {
        if (g.cut) continue;
        let gy = g.y !== undefined ? g.y : STORY_CONFIG.FLOOR;
        if (g.x >= swordHitbox.x && g.x <= swordHitbox.x + swordHitbox.width &&
            gy >= swordHitbox.y && gy - g.h <= swordHitbox.y + swordHitbox.height) {
            g.cut = true;
            g.h = 4;
            g.springVx = (pl.facingRight ? 7 : -7);
            cutAny = true;

            if (!storyState.cutGrassParticles) storyState.cutGrassParticles = [];
            for (let p = 0; p < 4; p++) {
                storyState.cutGrassParticles.push({
                    x: g.x,
                    y: gy - g.maxH * 0.5,
                    vx: (pl.facingRight ? 1 : -1) * (1.8 + Math.random() * 3.5) + (Math.random() - 0.5) * 2,
                    vy: -2.5 - Math.random() * 3.5,
                    rot: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 0.4,
                    len: 5 + Math.random() * 6,
                    color: g.color,
                    alpha: 1.0,
                    life: 35
                });
            }
        }
    }
    if (cutAny) {
        if (typeof playSound === 'function') playSound('leaf');
    }
}
window.checkStoryGrassSlashHitbox = checkStoryGrassSlashHitbox;

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
    storyState.bluePowerUnlocked = !!(slotData && slotData.bluePowerUnlocked);
    storyState.guardianDefeated = !!(slotData && (slotData.guardianDefeated || slotData.bluePowerUnlocked || slotData.checkpointId === 'bench_2_underground' || slotData.checkpointId === 'forest_bench_campfire'));
    if (slotData && slotData.explored) {
        storyState.explored = Object.assign({ startForest: true }, slotData.explored);
    }
    sharedHeals = storyState.bluePowerUnlocked ? 3 : 0;
    maxSharedHeals = storyState.bluePowerUnlocked ? 3 : 0;
    sharedHealPoints = storyState.bluePowerUnlocked ? 12 : 0;

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

    // Restore Metroidvania progression, backpack items, abilities, and broken walls from saved slot
    if (slotData) {
        if (slotData.backpack && Array.isArray(slotData.backpack)) {
            storyState.backpack = slotData.backpack.map(it => Object.assign({}, it));
        }
        if (slotData.dashUnlocked) {
            storyState.dashUnlocked = true;
            storyState.dashMaster = slotData.dashMaster || 'WATER';
        }
        if (slotData.dashScrollCollected) storyState.dashScrollCollected = true;
        if (slotData.flaskDewCollected) storyState.flaskDewCollected = true;
        if (slotData.room1VinesBroken) storyState.room1VinesBroken = true;
        if (slotData.room1SecretWallBroken) storyState.room1SecretWallBroken = true;
        if (slotData.room2OneWayBroken) storyState.room2OneWayBroken = true;
        setupStoryPlatforms(); // Refresh platform solidities with restored broken wall flags!
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

    let btnBackpack = document.getElementById("m-backpack");

    if (btnJmp) btnJmp.style.display = storyState.jumpUnlocked ? "flex" : "none";
    if (btnAtk) btnAtk.style.display = storyState.attackUnlocked ? "flex" : "none";
    if (btnSpec) btnSpec.style.display = storyState.comboUnlocked ? "flex" : "none";
    if (btnStance) btnStance.style.display = storyState.stanceUnlocked ? "flex" : "none";
    if (btnDash) btnDash.style.display = storyState.dashUnlocked ? "flex" : "none";
    if (btnHeal) btnHeal.style.display = (storyState.scrollRitual && storyState.scrollRitual.stage === 'PROMPT_HEAL') ? "flex" : (storyState.healUnlocked ? "flex" : "none");
    if (btnBackpack) btnBackpack.style.display = (storyState.activeBenchId >= 1 || (storyState.backpack && storyState.backpack.length > 0) || storyState.earthMet) ? "flex" : "none";
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
        if (isShooter) return "Нажмите [R], чтобы скрыть демона и вернуть Свет";
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

    // Update universal dialogue and cutscene state
    updateStoryDialogue();
    updateAncientRitual();

    // Track exploration for the Metroidvania Fog of War Map
    if (!storyState.explored) storyState.explored = { startForest: true };
    let curPx = p1.x;
    let curPy = p1.y;
    if (curPy > 200 && curPy < 500) {
        if (curPx < 1400) storyState.explored.startForest = true;
        if (curPx >= 1400 && curPx < 2600) storyState.explored.altar = true;
        if (curPx >= 2600 && curPx < 3820) storyState.explored.bench1 = true;
        if (curPx >= 3820) storyState.explored.pond = true;
    } else if (curPy < 120) {
        storyState.explored.upperTier = true;
        if (curPx >= 1400 && curPx <= 2200) storyState.explored.airZone = true;
    } else if (curPy >= 500) {
        if (curPx < 200) storyState.explored.cliffShaft = true;
        if (curPx >= 200 && curPx < 900) storyState.explored.lowerTier = true;
        if (curPx >= 900 && curPx < 1350) storyState.explored.earthZone = true;
        if (curPx >= 1350 && curPx < 1700) storyState.explored.bench2 = true;
        if (curPx >= 1700 && curPx < 2500) storyState.explored.trialsGates = true;
        if (curPx >= 4780 && curPx <= 6300) storyState.explored.trialsArena = true;
        if (curPx > 6300) storyState.explored.rewardRoom = true;
    }
    if (typeof storyTrials !== 'undefined' && storyTrials.active) {
        storyState.explored.trialsArena = true;
    }

    // Freeze players if dialogue or ritual cutscene is running
    if (storyDialogue.active || (storyRitual.active && storyRitual.phase !== 'IDLE')) {
        for (let pl of players) {
            if (pl) {
                pl.vx = 0;
                pl.moving = false;
            }
        }
    }

    // Check [S] key press to hide Demon and return to Light after Guardian is defeated
    // (Checked FIRST before ability key clearing so it responds instantly!)
    if (storyState.step === 'GUARDIAN_DEFEATED') {
        let stanceKey = (p1.keys && p1.keys.stance) ? p1.keys.stance : ((p1InputType === 'KEYBOARD_2' || p1InputType === 'KEYBOARD_SHOOTER') ? 'KeyR' : 'KeyS');
        let sPressed = isKeyPressed(stanceKey) || 
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

    // Progressive ability locks for Player 1 during prologue (handled per-player in updatePlayer)
    if (!storyState.jumpUnlocked) {
        clearKeyInput(p1.keys, 'jump');
        if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.jump = false;
    }
    if (!storyState.attackUnlocked) {
        clearKeyInput(p1.keys, 'attack');
        if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.atk = false;
    }
    if (!storyState.comboUnlocked) {
        clearKeyInput(p1.keys, 'special');
        clearKeyInput(p1.keys, 'dagger');
        if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.spec = false;
    }
    if (!storyState.stanceUnlocked) {
        clearKeyInput(p1.keys, 'stance');
        if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.stance = false;
    }
    // Lock dash and heal during prologue until taught later
    clearKeyInput(p1.keys, 'dash');
    if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.dash = false;

    clearKeyInput(p1.keys, 'heal');
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
                        storyState.airDialogueTimer = 0;
                        spawnStoryCompanionHero('AIR', STORY_CONFIG.AIR_NPC_X, STORY_CONFIG.AIR_NPC_Y - 50);
                        startStoryDialogue([
                            { speaker: 'AIR', name: 'Воздух', text: 'Хей, дружище, пошли вместе!' }
                        ], () => {
                            if (typeof playSound === 'function') playSound('lightChime');
                        });
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
                        storyState.earthDialogueTimer = 0;
                        spawnStoryCompanionHero('EARTH', STORY_CONFIG.EARTH_NPC_X, STORY_CONFIG.EARTH_NPC_Y - 50);
                        startStoryDialogue([
                            { speaker: 'EARTH', name: 'Земля', text: 'Вы чего так долго? Я вас уже заждалась!' }
                        ], () => {
                            if (typeof playSound === 'function') playSound('lightChime');
                        });
                        break;
                    }
                }
            }

            // 5. Standing near Gate of the Trials at X = 1850, Y = 850 (strictly at the portal door only)
            if (!storyState.inTrials && (!storyTrials || !storyTrials.trialsCleared)) {
                let p1 = players[0];
                let nearGate = p1 && (p1.y >= 750 && p1.y <= 855) && (Math.abs((p1.x + p1.width / 2) - 1878) <= 45);
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
            } else {
                storyState.nearTrialsGate = false;
            }

            if (storyTrials.trialsCleared && !storyState.bluePowerUnlocked && !storyRitual.active && !storyDialogue.active && p1 && p1.x >= 6680 && p1.x <= 7720 && p1.y > 600 && p1.y < 900) {
                storyState.tetyaSceneStarted = true;
                let earthPl = players.find(pl => pl && pl.type === 'EARTH');
                let airPl = players.find(pl => pl && pl.type === 'AIR');
                let waterPl = players[0];

                if (earthPl) { earthPl.x = 6730; earthPl.y = 800; earthPl.vx = 0; earthPl.facingRight = true; }
                if (airPl) { airPl.x = 6790; airPl.y = 800; airPl.vx = 0; airPl.facingRight = true; }
                if (waterPl) { waterPl.x = 6850; waterPl.y = 800; waterPl.vx = 0; waterPl.facingRight = true; }

                startStoryDialogue([
                    { speaker: 'TETYA', name: 'Тётя', text: 'Вы выстояли перед испытательным демоном. Немногим удавалось дойти до этого зала... Вы доказали, что умеете прикрывать спины друг друга.' },
                    { speaker: 'TETYA', name: 'Тётя', text: 'В этом сундуке хранится древняя светлая сила и именно она является противоположностью силе демона.' },
                    { speaker: 'AIR', name: 'Воздух', text: 'Ого! Она буквально светится чистой энергией!' },
                    { speaker: 'TETYA', name: 'Тётя', text: 'Именно так. И из-за того что она противоположна силе демона, носитель этой силы сможет наносить огромный урон демонам.' },
                    { speaker: 'TETYA', name: 'Тётя', text: 'Поэтому мы искали людей что смогут носить ее и уничтожать демонов.' },
                    { speaker: 'WATER', name: 'Вода', text: 'Стоп стоп! А почему именно мы?' },
                    { speaker: 'TETYA', name: 'Тётя', text: 'Не зависимо от вашего возраста, вы показали самый большой результат на испытанях и теперь нам нужна ваша сила.' },
                    { speaker: 'EARTH', name: 'Земля', text: 'Что-то звучит слишком нечестно, тут должен быть подвох...' },
                    { speaker: 'TETYA', name: 'Тётя', text: 'И да совсем забыла, эта сила является "связанной", потому что на самом деле это одна единая сила, он мы разделим ее на несколько кусочков, на несколько человек...' },
                    { speaker: 'TETYA', name: 'Тётя', text: '...и это значит что если один носитель ее погибнет или будет находится в предсмертном состоянии, то эта сила попытается его спасти, но пока пытается это сделать может сама разорваться и погубить всех остальных. А может и спасти его, но только самой этой силы может уже не остаться.' },
                    { speaker: 'TETYA', name: 'Тётя', text: 'И сейчас вы получите ее...' }
                ], () => {
                    startAncientRitualCutscene();
                });
            }

            // 7. Return portal at X = 7520 in Chamber of Ancient Power
            if (storyState.bluePowerUnlocked && p1 && p1.x >= 7480 && p1.x <= 7720 && p1.y > 600 && p1.y < 900) {
                if (typeof playSound === 'function') playSound('lightChime');
                if (typeof playSound === 'function') playSound('parry');
                if (typeof triggerShake === 'function') triggerShake(5, 10);
                flashAlpha = 0.5;
                storyTrials.active = false;
                storyState.inTrials = false;

                // Place party seated at Bench 2 (X = 1450, Y = 850)
                storyState.activeBenchId = 2;
                storyState.checkpoint = { x: 1450, y: 850, benchId: 2, stance: 'LIGHT' };
                storyState.step = 'BENCH_REST';
                storyState.stepTimer = 0;
                let bx = STORY_CONFIG.BENCH_2_X;
                let by = STORY_CONFIG.BENCH_2_Y;
                for (let idx = 0; idx < players.length; idx++) {
                    let pl = players[idx];
                    if (pl) {
                        pl.x = bx + (idx === 0 ? 0 : (idx === 1 ? -32 : 32));
                        pl.y = by - 10;
                        pl.vx = 0;
                        pl.vy = 0;
                        pl.hp = pl.maxHp || 5;
                        pl.isDowned = false;
                    }
                }
                camX = bx - GAME_WIDTH / 2;
                camY = 470;
            }

            // 7b. Interactive conversation with Тётя in Chamber of Ancient Power
            if (storyState.bluePowerUnlocked && !storyDialogue.active && (!storyRitual || !storyRitual.active)) {
                let nearTetya = p1 && Math.abs(p1.x - 7060) < 65 && p1.y > 600;
                storyState.nearTetya = nearTetya;

                if (nearTetya) {
                    let ePressed = isKeyPressed(['KeyE', 'KeyУ', 'KeyW', 'KeyЦ', 'ArrowUp']) || 
                                   (typeof touchInputs !== 'undefined' && touchInputs && (touchInputs.up || touchInputs.atk));
                    
                    if (ePressed && !p1.prevTetyaTalkKey) {
                        p1.prevTetyaTalkKey = true;
                        triggerTetyaFollowupDialogue();
                    } else if (!ePressed) {
                        p1.prevTetyaTalkKey = false;
                    }
                }
            }

            // 8. Update Trials engine if active
            if (typeof storyTrials !== 'undefined' && storyTrials.active) {
                updateStoryTrials();
            }
            break;
        }

        case 'DEMON_EXPOSED': {
            for (let pl of players) {
                if (pl) { pl.vx = 0; pl.vy = 0; }
            }
            if (storyState.stepTimer >= 70) {
                storyState.demonAuraTimer = 0;
                storyState.exposedQuote = "";
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

            // If dying fade-out was active, gradually clear the blackness on the bench
            if (storyState.deathFadeAlpha > 0) {
                storyState.deathFadeAlpha = Math.max(0, storyState.deathFadeAlpha - 0.025);
                if (storyState.deathFadeAlpha > 0.25) {
                    break;
                }
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

        case 'SCROLL_RITUAL': {
            updateStoryScrollRitual();
            break;
        }

        case 'DEATH_FADE_OUT': {
            updateStoryDeathFadeOut();
            break;
        }
    }

    if (storyState.airDialogueTimer > 0) storyState.airDialogueTimer--;
    if (storyState.earthDialogueTimer > 0) storyState.earthDialogueTimer--;

    // Lock controls during cutscenes
    if (storyState.step === 'LIGHTNING_WINDUP' || storyState.step === 'LIGHTNING' || storyState.step.startsWith('TITLE') || storyState.step === 'SCROLL_RITUAL') {
        p1.vx = 0;
        p1.vy = 0;
        clearKeyInput(p1.keys, 'left');
        clearKeyInput(p1.keys, 'right');
        if (typeof touchInputs !== 'undefined' && touchInputs) {
            touchInputs.left = false;
            touchInputs.right = false;
        }
    }

    // 3. Update Normal Player Physics & Actions (skip when sitting on bench, ritual, death, or room transitioning)
    if (storyState.step !== 'BENCH_REST' && storyState.step !== 'SCROLL_RITUAL' && storyState.step !== 'DEATH_FADE_OUT' && !storyState.roomTransitioning) {
        updatePlayers();
    }
    if (typeof updateProjectiles === 'function') {
        updateProjectiles();
    }

    // 4. Update Forest Atmospheric Effects
    updateForestAtmosphere();

    // 4b. Update Room 1 & 2 Gameplay Systems (Spikes, Crawlers, Breakable Walls, Pickups, Transitions)
    updateStoryGameplayEntities();

    // 5. Smooth 2D Camera Tracking (X and Y across all 3 tiers & Rooms!)
    let focusX = p1.x;
    let focusY = p1.y;
    if (players.length > 1 && !players[1].isAi) {
        // In 2P Local mode, bias camera towards P1 while keeping P2 comfortable
        focusX = p1.x * 0.65 + players[1].x * 0.35;
        focusY = p1.y * 0.65 + players[1].y * 0.35;
    }
    let minCamX = (focusX < 40 || focusY > 420) ? -480 : 0;
    let targetCamX = Math.max(minCamX, Math.min(STORY_CONFIG.ARENA_W - GAME_WIDTH, focusX - GAME_WIDTH * 0.46));
    let targetCamY = 0;

    if (focusY < 160) {
        targetCamY = Math.max(-280, focusY - 220);
    } else if (focusX >= 8200) {
        // Room 2 (Scroll Cavern): Smooth continuous vertical tracking
        targetCamX = Math.max(8200, Math.min(9560 - GAME_WIDTH, focusX - GAME_WIDTH * 0.5));
        targetCamY = Math.max(500, Math.min(1450, focusY - GAME_HEIGHT * 0.52));
    } else if (focusX >= 1040 && focusX <= 2600 && focusY > 500) {
        // Room 1 (3-Tier Cavern): Smooth continuous vertical tracking without discrete snap cliffs
        targetCamX = Math.max(1040, Math.min(2460 - GAME_WIDTH, focusX - GAME_WIDTH * 0.46));
        targetCamY = Math.max(500, Math.min(1600, focusY - GAME_HEIGHT * 0.52));
    } else if (focusY > 410 && focusX < 4800) {
        // Lower Underground Bench 2 & corridor: Smooth vertical entrance glide
        targetCamY = Math.max(0, Math.min(500, focusY - GAME_HEIGHT * 0.52));
    } else {
        targetCamY = 0;
    }

    // When inside Trials or Chamber of Ancient Power, smoothly track the party
    if ((typeof storyTrials !== 'undefined' && storyTrials.active) || (focusX >= 4800 && focusX < 8000)) {
        let focusHero = (players[0] && players[0].hp > 0) ? players[0] : (players.find(pl => pl && pl.hp > 0) || { x: 5550 });
        let targetX = focusHero.x || 5550;

        // Cinematic center framing during dialogue with Тётя or the Ancient Ritual
        if ((typeof storyDialogue !== 'undefined' && storyDialogue.active && focusX > 6400) || 
            (typeof storyRitual !== 'undefined' && storyRitual.active && storyRitual.phase !== 'IDLE')) {
            targetX = 6890;
        }

        targetCamX = Math.max(4800, Math.min(STORY_CONFIG.ARENA_W - GAME_WIDTH, targetX - GAME_WIDTH * 0.5));
        targetCamY = 470;
    }

    // Silky smooth camera lerp (0.08 / 0.07): completely eliminates harsh snapping!
    let lerpX = 0.08;
    let lerpY = 0.07;
    camX += (targetCamX - camX) * lerpX;
    camY += (targetCamY - camY) * lerpY;

    // 6. Party Wipe / Death Respawn: If ANY hero dies, the party wipes and wakes up on the bench!
    if (storyState.step !== 'DEATH_FADE_OUT' && storyState.step !== 'BENCH_REST' && storyState.step !== 'SCROLL_RITUAL') {
        let anyDead = players.some(pl => pl && (pl.hp <= 0 || pl.isDowned));
        if (anyDead && players.length > 0) {
            storyState.step = 'DEATH_FADE_OUT';
            storyState.deathTimer = 0;
            storyState.deathFadeAlpha = 0.05;
            for (let pl of players) {
                if (pl) {
                    pl.vx = 0;
                    pl.vy = 0;
                }
            }
            if (typeof playSound === 'function') playSound('defeat');
        }
    }
}
window.updateStoryMode = updateStoryMode;

// Water Guardian Mini-Boss
function spawnWaterGuardian() {
    storyState.guardian = {
        x: STORY_CONFIG.ALTAR_X + 260,
        y: STORY_CONFIG.FLOOR - 72,
        w: 46,
        h: 72,
        hp: 10,
        maxHp: 10,
        facingRight: false,
        state: 'INTRO',
        timer: 120,
        dialogue: null,
        dialogueTimer: 0,
        waterProjectiles: [],
        hitFlash: 0
    };
    if (typeof playSound === 'function') playSound('shuriken');
    startStoryDialogue([
        { speaker: 'GUARDIAN', name: 'Страж Алтаря', text: 'Я чувствую скверну... Я должен уничтожить демона!' }
    ]);
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
            if (Math.abs(pr.x - (p.x + 15)) < 22 && Math.abs(pr.y - (p.y + 25)) < 32 && p.invuln <= 0) {
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
    if (p.attackTimer > 0 && Math.abs((p.x + (p.facingRight ? 35 : -35)) - g.x) < 64 && Math.abs(p.y - g.y) < 75) {
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
            if (Math.abs(pd.x - g.x) < 45 && Math.abs(pd.y - (g.y + 35)) < 55) {
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

function respawnPlayerAtStoryCheckpoint() {
    let cpX = storyState.checkpoint.x || STORY_CONFIG.START_X;
    let cpY = storyState.checkpoint.y || STORY_CONFIG.FLOOR;

    if (typeof storyTrials !== 'undefined') {
        storyTrials.active = false;
        storyTrials.warnings = 0;
    }
    storyState.inTrials = false;

    // When blue power is unlocked or bench is active, respawn seated peacefully at the campfire bench!
    if (storyState.bluePowerUnlocked || storyState.activeBenchId || storyState.earthMet || (storyState.checkpoint && storyState.checkpoint.benchId)) {
        let bId = (storyState.checkpoint && storyState.checkpoint.benchId) || storyState.activeBenchId || (storyState.earthMet ? 2 : 1);
        storyState.activeBenchId = bId;
        storyState.step = 'BENCH_REST';
        storyState.stepTimer = 0;
        storyState.mossCrawlerDefeated = false;
        spawnStoryWorldEnemies();
        regrowStoryGrass();
        storyState.currentRoom = 1;
        let bx = (bId === 2) ? STORY_CONFIG.BENCH_2_X : STORY_CONFIG.BENCH_X;
        let by = (bId === 2) ? STORY_CONFIG.BENCH_2_Y : STORY_CONFIG.FLOOR;
        for (let idx = 0; idx < players.length; idx++) {
            let pl = players[idx];
            if (!pl) continue;
            pl.x = bx + (idx === 0 ? 0 : (idx === 1 ? -32 : 32));
            pl.y = by - 10;
            pl.vx = 0;
            pl.vy = 0;
            pl.hp = pl.maxHp || 5;
            pl.isDowned = false;
            pl.downedTimer = 0;
            pl.invuln = 60;
            pl.waterDropActive = false;
            pl.waterDrop = null;
            if (pl.type === 'WATER') {
                pl.stance = 'LIGHT';
            }
        }
        camX = bx - GAME_WIDTH / 2;
        camY = (by > 500) ? 470 : 0;
        return;
    }

    for (let idx = 0; idx < players.length; idx++) {
        let pl = players[idx];
        if (!pl) continue;
        pl.hp = 5;
        pl.maxHp = 5;
        pl.isDowned = false;
        pl.downedTimer = 0;
        pl.x = cpX - idx * 25;
        pl.y = cpY - 50;
        pl.lastSafeX = pl.x;
        pl.lastSafeY = pl.y;
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
        storyState.guardian.y = STORY_CONFIG.FLOOR - 72;
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
    spawnStoryWorldEnemies();
    regrowStoryGrass();

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

    sharedHeals = storyState.bluePowerUnlocked ? 3 : 0;
    maxSharedHeals = storyState.bluePowerUnlocked ? 3 : 0;
    sharedHealPoints = storyState.bluePowerUnlocked ? 12 : 0;
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
        guardianDefeated: !!storyState.guardianDefeated,
        airMet: !!storyState.airMet,
        earthMet: !!storyState.earthMet,
        bluePowerUnlocked: !!storyState.bluePowerUnlocked,
        explored: storyState.explored,
        unlockedHeroes: unlockedHeroes,
        heroAssignments: storyState.heroAssignments,
        currentStance: p.stance || "LIGHT",
        checkpointId: (benchId === 2) ? "bench_2_underground" : "forest_bench_campfire",
        backpack: (storyState.backpack || []).map(it => Object.assign({}, it)),
        dashUnlocked: !!storyState.dashUnlocked,
        dashMaster: storyState.dashMaster || null,
        dashScrollCollected: !!storyState.dashScrollCollected,
        flaskDewCollected: !!storyState.flaskDewCollected,
        room1VinesBroken: !!storyState.room1VinesBroken,
        room1SecretWallBroken: !!storyState.room1SecretWallBroken,
        room2OneWayBroken: !!storyState.room2OneWayBroken,
        updatedAt: Date.now(),
        version: GAME_VERSION
    };
    if (typeof saveStorySlot === 'function') {
        saveStorySlot(storyState.slotNum, slotData, curUser);
    }
    if (typeof playSound === 'function') playSound('lightChime');
}
window.restAtCampfire = restAtCampfire;

function autoSaveStoryProgress() {
    if (!window.isStoryMode || !storyState.active) return;
    let p = players[0] || { type: 'WATER', stance: 'LIGHT' };
    let curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : 'guest';
    let bId = storyState.activeBenchId || (storyState.currentRoom === 2 ? 2 : 1);
    let unlockedHeroes = ['WATER'];
    if (storyState.airMet) unlockedHeroes.push('AIR');
    if (storyState.earthMet) unlockedHeroes.push('EARTH');

    let slotData = {
        slot: storyState.slotNum || 1,
        location: (bId === 2) ? "Подземелье (Костер у Врат Испытаний)" : "Лес (Костер у опушки)",
        locationSub: (bId === 2) ? "Отряд в сборе: Вода 💧, Воздух 💨, Земля 🌿" : "Отдых у теплого огня",
        hero: p.type || "WATER",
        maxHp: 5,
        currentHp: 5,
        demonUnlocked: true,
        stealthUnlocked: true,
        waterDropBonusDmg: storyState.waterDropBonusDmg || 0.5,
        guardianDefeated: !!storyState.guardianDefeated,
        airMet: !!storyState.airMet,
        earthMet: !!storyState.earthMet,
        bluePowerUnlocked: !!storyState.bluePowerUnlocked,
        explored: storyState.explored,
        unlockedHeroes: unlockedHeroes,
        heroAssignments: storyState.heroAssignments,
        currentStance: p.stance || "LIGHT",
        checkpointId: (bId === 2) ? "bench_2_underground" : "forest_bench_campfire",
        backpack: (storyState.backpack || []).map(it => Object.assign({}, it)),
        dashUnlocked: !!storyState.dashUnlocked,
        dashMaster: storyState.dashMaster || null,
        dashScrollCollected: !!storyState.dashScrollCollected,
        flaskDewCollected: !!storyState.flaskDewCollected,
        room1VinesBroken: !!storyState.room1VinesBroken,
        room1SecretWallBroken: !!storyState.room1SecretWallBroken,
        room2OneWayBroken: !!storyState.room2OneWayBroken,
        updatedAt: Date.now(),
        version: GAME_VERSION
    };
    if (typeof saveStorySlot === 'function') {
        saveStorySlot(storyState.slotNum || 1, slotData, curUser);
    }
}
window.autoSaveStoryProgress = autoSaveStoryProgress;

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

    // Render 3-Tier Map with Fog of War & Visual Marker Badges (Timur's request)
    let mapEl = document.getElementById('story-map-diagram');
    if (mapEl) {
        let p = players[0] || { x: STORY_CONFIG.BENCH_X, y: STORY_CONFIG.FLOOR };
        let exp = storyState.explored || { startForest: true };

        // Convert world (x, y) into % coordinates on diagram
        let markerLeft = Math.max(5, Math.min(95, ((p.x + 500) / 7600) * 100));
        let markerTop = 50;
        if (p.y < 120) markerTop = 18;
        else if (p.y > 500) markerTop = 82;

        function makeMarker(icon, label, leftPct, topPct, color, isVisible) {
            if (!isVisible) return '';
            return `
                <div title="${label}" style="position: absolute; left: ${leftPct}%; top: ${topPct}%; transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 4px; background: rgba(11, 18, 33, 0.94); border: 1.5px solid ${color}; border-radius: 12px; padding: 2px 7px; box-shadow: 0 0 10px ${color}55; white-space: nowrap; z-index: 6; font-size: 10px; font-weight: bold; color: #f8fafc; cursor: default;">
                    <span style="font-size: 13px;">${icon}</span>
                    <span>${label}</span>
                </div>
            `;
        }

        let upperExplored = !!(exp.upperTier || exp.airZone);
        let lowerExplored = !!(exp.lowerTier || exp.earthZone || exp.bench2 || exp.trialsGates || exp.trialsArena || exp.rewardRoom);

        mapEl.innerHTML = `
            <!-- 1. Upper Tier (Floor 2: Y = -25) -->
            ${upperExplored ? `
                <div style="position: absolute; left: 10%; right: 14%; top: 22%; height: 8px; background: linear-gradient(90deg, #15803d, #22c55e); border-radius: 4px; box-shadow: 0 0 8px rgba(34,197,94,0.4);"></div>
                ${makeMarker('💨', 'Воздух ' + (storyState.airMet ? '✓' : '?'), 48, 12, '#facc15', exp.airZone)}
                ${makeMarker('⬇️', 'Спуск', 15, 12, '#38bdf8', exp.upperTier && exp.cliffShaft)}
            ` : `
                <div style="position: absolute; left: 8%; right: 10%; top: 6%; height: 26%; background: radial-gradient(circle, rgba(15, 23, 42, 0.92) 0%, rgba(3, 7, 18, 0.98) 100%); border: 1px dashed rgba(56,189,248,0.25); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #475569; font-weight: bold; font-size: 10.5px; z-index: 4;">
                    🌫️ Неизведанный верхний ярус
                </div>
            `}

            <!-- 2. Middle Tier (Floor 1: Y = 350) -->
            <div style="position: absolute; left: 12%; right: 16%; top: 52%; height: 8px; background: #334155; border-top: 2px solid #22c55e; border-radius: 4px;"></div>
            ${makeMarker('🌲', 'Лес', 16, 40, '#94a3b8', exp.startForest)}
            ${makeMarker('⚡', 'Алтарь', 44, 40, '#c084fc', exp.altar)}
            ${makeMarker('🔥', 'Костёр 1', 72, 40, '#fbbf24', exp.bench1)}

            <!-- Pond & Platforms -->
            ${exp.pond ? `
                <div style="position: absolute; right: 3%; width: 13%; top: 53%; height: 18px; background: rgba(14, 165, 233, 0.45); border: 1px solid #38bdf8; border-radius: 0 0 6px 6px; text-align: center; color: #bae6fd; font-size: 9.5px; line-height: 16px;">💧 Вода</div>
                <div style="position: absolute; right: 10%; top: 43%; width: 26px; height: 5px; background: #22c55e; border-radius: 3px;"></div>
                <div style="position: absolute; right: 5%; top: 34%; width: 26px; height: 5px; background: #22c55e; border-radius: 3px;"></div>
                <div style="position: absolute; right: 10%; top: 26%; width: 26px; height: 5px; background: #22c55e; border-radius: 3px;"></div>
                ${makeMarker('💧', 'Озеро', 89, 40, '#38bdf8', true)}
            ` : `
                <div style="position: absolute; right: 2%; width: 18%; top: 38%; height: 24%; background: rgba(8, 14, 26, 0.94); border: 1px dashed rgba(56,189,248,0.2); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #475569; font-size: 9.5px; z-index: 4;">🌫️ Озеро</div>
            `}

            <!-- Left Cliff Shaft -->
            ${(exp.cliffShaft || lowerExplored) ? `
                <div style="position: absolute; left: 4%; width: 6%; top: 22%; height: 64%; border-left: 2px dashed rgba(56,189,248,0.4); border-right: 2px dashed rgba(56,189,248,0.4);"></div>
            ` : ''}

            <!-- 3. Lower Underground Tier (Floor 3: Y = 850) -->
            ${lowerExplored ? `
                <div style="position: absolute; left: 4%; right: 12%; top: 85%; height: 9px; background: #1e293b; border-top: 2px solid #4ade80; border-radius: 4px;"></div>
                ${makeMarker('🕳️', 'Спуск', 12, 72, '#94a3b8', exp.cliffShaft || exp.lowerTier)}
                ${makeMarker('🌿', 'Земля ' + (storyState.earthMet ? '✓' : '?'), 30, 72, '#4ade80', exp.earthZone)}
                ${makeMarker('🔥', 'Костёр 2', 54, 72, '#fbbf24', exp.bench2)}
                ${makeMarker('⛩️', 'Врата', 74, 72, '#f87171', exp.trialsGates)}
                ${makeMarker('⚔️', 'Арена', 86, 72, '#eab308', exp.trialsArena)}
                ${makeMarker('⚜️', 'Зал Силы', 94, 72, '#00e5ff', exp.rewardRoom)}
            ` : `
                <div style="position: absolute; left: 4%; right: 4%; top: 68%; height: 28%; background: radial-gradient(circle, rgba(15, 23, 42, 0.92) 0%, rgba(3, 7, 18, 0.98) 100%); border: 1px dashed rgba(74,222,128,0.25); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #475569; font-weight: bold; font-size: 10.5px; z-index: 4;">
                    🌫️ Неизведанные глубины подземелья
                </div>
            `}

            <!-- Live Player Position Marker -->
            <div style="position: absolute; left: ${markerLeft}%; top: ${markerTop}%; transform: translate(-50%, -50%); background: #00ffcc; color: #020617; font-weight: 900; padding: 2px 7px; border-radius: 12px; font-size: 10px; box-shadow: 0 0 14px #00ffcc; white-space: nowrap; z-index: 10; border: 1.5px solid #ffffff;">
                📍 ВЫ ЗДЕСЬ
            </div>
        `;
    }

    // Render 6-Slot Backpack Grid & Unlocked Abilities
    let itemsEl = document.getElementById('story-backpack-items');
    if (itemsEl) {
        let slotsHtml = '';
        let maxSlots = storyState.backpackSlots || 6;
        let bp = storyState.backpack || [];
        let leadP = players[0] || { x: 0, y: 0 };
        let isNearBench1 = Math.abs(leadP.x - STORY_CONFIG.BENCH_X) < 140 && Math.abs(leadP.y - STORY_CONFIG.FLOOR) < 80;
        let isNearBench2 = Math.abs(leadP.x - STORY_CONFIG.BENCH_2_X) < 140 && Math.abs(leadP.y - STORY_CONFIG.BENCH_2_Y) < 80;
        let isAtBench = (storyState.step === 'BENCH_REST') || isNearBench1 || isNearBench2;

        for (let s = 0; s < maxSlots; s++) {
            let item = bp[s];
            if (item) {
                if (item.id === 'flask_dew') {
                    slotsHtml += `
                        <div style="background: rgba(15, 23, 42, 0.9); border: 2px solid #22c55e; box-shadow: 0 0 14px rgba(34, 197, 94, 0.25); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="font-weight: 900; color: #4ade80; font-size: 13.5px; margin-bottom: 4px;">🧪 ${item.name}</div>
                                <div style="font-size: 11px; color: #cbd5e1; line-height: 1.35;">${item.desc}</div>
                            </div>
                            <button onclick="useStoryBackpackDewFlask()" style="margin-top: 10px; padding: 6px 10px; font-size: 11.5px; font-weight: 800; background: rgba(34, 197, 94, 0.2); border: 1.5px solid #22c55e; border-radius: 8px; color: #86efac; cursor: pointer;">
                                ✓ ВЫПИТЬ РОСУ (+2 ❤️)
                            </button>
                        </div>
                    `;
                } else if (item.id === 'dash_scroll') {
                    let actionBtn = isAtBench
                        ? `<button onclick="openStoryScrollHeroModal()" style="margin-top: 10px; padding: 6px 10px; font-size: 11.5px; font-weight: 900; background: linear-gradient(90deg, rgba(0, 229, 255, 0.25), rgba(56, 189, 248, 0.35)); border: 1.5px solid #00e5ff; border-radius: 8px; color: #e0f2fe; cursor: pointer; box-shadow: 0 0 10px rgba(0,229,255,0.4);">
                                ⚡ ВОНЗИТЬ ОРУЖИЕ У КОСТРА
                           </button>`
                        : `<div style="margin-top: 10px; padding: 7px 10px; font-size: 11px; text-align: center; color: #fca5a5; background: rgba(239, 68, 68, 0.12); border: 1px dashed rgba(239, 68, 68, 0.4); border-radius: 8px;">
                                🔥 Применить свиток можно только у костра на скамейке
                           </div>`;
                    slotsHtml += `
                        <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid #00e5ff; box-shadow: 0 0 16px rgba(0, 229, 255, 0.35); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="font-weight: 900; color: #00e5ff; font-size: 13.5px; margin-bottom: 4px;">📜 ${item.name}</div>
                                <div style="font-size: 11px; color: #e0f2fe; line-height: 1.35;">${item.desc}</div>
                            </div>
                            ${actionBtn}
                        </div>
                    `;
                } else {
                    slotsHtml += `
                        <div style="background: rgba(15, 23, 42, 0.85); border: 1.5px solid #38bdf8; border-radius: 12px; padding: 12px;">
                            <div style="font-weight: 900; color: #38bdf8; font-size: 13px;">${item.icon || '📦'} ${item.name}</div>
                            <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">${item.desc || ''}</div>
                        </div>
                    `;
                }
            } else {
                slotsHtml += `
                    <div style="background: rgba(15, 23, 42, 0.5); border: 1.5px dashed rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 75px; color: #64748b; font-size: 11px; font-weight: 700;">
                        <span>📦 Ячейка ${s + 1}</span>
                        <span style="font-size: 10px; color: #475569; margin-top: 3px;">[Пусто]</span>
                    </div>
                `;
            }
        }

        let dashCard = '';
        if (storyState.dashUnlocked) {
            let mHero = storyState.dashMaster || 'WATER';
            let mName = (mHero === 'WATER' ? '💧 Вода (Урон во время рывка -0.5)' : (mHero === 'AIR' ? '💨 Воздух (Воздушная волна)' : '🌿 Земля (Теневой рывок за спину)'));
            dashCard = `
                <div style="background: rgba(15, 23, 42, 0.85); border: 1.5px solid #facc15; box-shadow: 0 0 14px rgba(250, 204, 21, 0.3); border-radius: 10px; padding: 10px 12px;">
                    <div style="font-weight: 900; color: #facc15; font-size: 13px; margin-bottom: 4px;">💨 Рывок [Клавиша C]</div>
                    <div style="font-size: 11.5px; color: #fef08a; line-height: 1.4;">Стремительный рывок вперед с лазурным шлейфом (+20% скорости и дальности).<br>⭐ <b>Мастер:</b> ${mName}</div>
                </div>
            `;
        }

        let bonusText = storyState.waterDropBonusDmg > 0
            ? `<span style="color: #4ade80; font-weight: bold;">+0.5 урона (Усилено после Стража!)</span>`
            : `<span style="color: #94a3b8;">Базовый урон</span>`;
        let bluePowerCard = storyState.bluePowerUnlocked ? `
            <div style="background: rgba(15, 23, 42, 0.85); border: 1.5px solid #00e5ff; box-shadow: 0 0 14px rgba(0, 229, 255, 0.35); border-radius: 10px; padding: 10px 12px;">
                <div style="font-weight: 900; color: #00e5ff; font-size: 13px; margin-bottom: 4px;">⚜️ Голубая Сила [Связь Команды]</div>
                <div style="font-size: 11.5px; color: #e0f2fe; line-height: 1.4;">Древняя светлая сила, противоположная демону. Связывает троих героев воедино (+3 общих исцеления команды).</div>
            </div>
        ` : '';

        itemsEl.innerHTML = `
            <div style="grid-column: 1 / -1; margin-bottom: 6px;">
                <div style="font-size: 13px; font-weight: 900; color: #38bdf8; margin-bottom: 8px;">🎒 СЛОТЫ В РЮКЗАКЕ (6 МЕСТ):</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                    ${slotsHtml}
                </div>
            </div>
            <div style="grid-column: 1 / -1; font-size: 13px; font-weight: 900; color: #a855f7; margin-top: 10px; margin-bottom: 6px;">✨ РАЗБЛОКИРОВАННЫЕ СПОСОБНОСТИ:</div>
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
                <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">Тяжело раненый ждёт 10 сек. Подойдите вплотную и нажмите [A], чтобы отдать 1 HP.</div>
            </div>
            ${dashCard}
            ${bluePowerCard}
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

function addStoryBackpackItem(item) {
    if (!storyState.backpack) storyState.backpack = [];
    if (storyState.backpack.length >= (storyState.backpackSlots || 6)) {
        return false;
    }
    storyState.backpack.push(item);
    autoSaveStoryProgress();
    return true;
}
window.addStoryBackpackItem = addStoryBackpackItem;

function useStoryBackpackDewFlask() {
    if (!storyState.backpack) return;
    let idx = storyState.backpack.findIndex(it => it && it.id === 'flask_dew');
    if (idx === -1) return;
    storyState.backpack.splice(idx, 1);
    autoSaveStoryProgress();
    for (let pl of players) {
        if (pl) {
            pl.hp = Math.min(pl.maxHp || 5, pl.hp + 2);
            pl.isDowned = false;
        }
    }
    if (typeof playSound === 'function') playSound('lightChime');
    if (typeof playSound === 'function') playSound('absorb');
    flashAlpha = 0.4;
    openStoryBackpackModal();
}
window.useStoryBackpackDewFlask = useStoryBackpackDewFlask;

function openStoryScrollHeroModal() {
    let leadP = players[0] || { x: 0, y: 0 };
    let isNearBench1 = Math.abs(leadP.x - STORY_CONFIG.BENCH_X) < 140 && Math.abs(leadP.y - STORY_CONFIG.FLOOR) < 80;
    let isNearBench2 = Math.abs(leadP.x - STORY_CONFIG.BENCH_2_X) < 140 && Math.abs(leadP.y - STORY_CONFIG.BENCH_2_Y) < 80;
    let isAtBench = (storyState.step === 'BENCH_REST') || isNearBench1 || isNearBench2;
    if (!isAtBench) {
        showStoryHeroWarning("Свиток можно изучить только у костра на скамейке!");
        return;
    }
    let modal = document.getElementById('story-scroll-hero-modal');
    if (modal) modal.style.display = 'flex';
}
window.openStoryScrollHeroModal = openStoryScrollHeroModal;

function closeStoryScrollHeroModal() {
    let modal = document.getElementById('story-scroll-hero-modal');
    if (modal) modal.style.display = 'none';
}
window.closeStoryScrollHeroModal = closeStoryScrollHeroModal;

function selectScrollHeroForRitual(heroType) {
    closeStoryScrollHeroModal();
    closeStoryBackpackModal();
    startScrollRitualCutscene(heroType);
}
window.selectScrollHeroForRitual = selectScrollHeroForRitual;

function startScrollRitualCutscene(heroType) {
    let bx = STORY_CONFIG.BENCH_2_X;
    let by = STORY_CONFIG.BENCH_2_Y;
    storyState.step = 'SCROLL_RITUAL';
    storyState.stepTimer = 0;
    storyState.scrollRitual = {
        active: true,
        stage: 'PROMPT_ATTACK',
        hero: heroType,
        timer: 0,
        stuckWeapon: false,
        flashTimer: 0
    };

    let chosenPl = players.find(pl => pl && pl.type === heroType) || players[0];
    let companions = players.filter(pl => pl && pl !== chosenPl);

    if (chosenPl) {
        chosenPl.x = 1465;
        chosenPl.y = by - 50;
        chosenPl.vx = 0;
        chosenPl.vy = 0;
        chosenPl.facingRight = true;
    }
    if (companions[0]) {
        companions[0].x = 1410;
        companions[0].y = by - 50;
        companions[0].vx = 0;
        companions[0].vy = 0;
        companions[0].facingRight = true;
    }
    if (companions[1]) {
        companions[1].x = 1555;
        companions[1].y = by - 50;
        companions[1].vx = 0;
        companions[1].vy = 0;
        companions[1].facingRight = false;
    }

    camX = 1485 - GAME_WIDTH / 2;
    camY = 470;
}
window.startScrollRitualCutscene = startScrollRitualCutscene;

function finishScrollRitual() {
    if (storyState.scrollRitual) {
        storyState.scrollRitual.active = false;
        storyState.scrollRitual = null;
    }
    storyState.activeBenchId = 2;
    storyState.step = 'BENCH_REST';
    storyState.stepTimer = 0;
    let bx = STORY_CONFIG.BENCH_2_X;
    let by = STORY_CONFIG.BENCH_2_Y;
    for (let idx = 0; idx < players.length; idx++) {
        let pl = players[idx];
        if (pl) {
            pl.x = bx - 22 + idx * 20;
            pl.y = by - 24;
            pl.vx = 0;
            pl.vy = 0;
            pl.hp = 5;
            pl.isDowned = false;
        }
    }
    if (typeof playSound === 'function') playSound('lightChime');
    autoSaveStoryProgress();
}
window.finishScrollRitual = finishScrollRitual;

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
    if (storyState.step !== 'BENCH_REST' && players[0]) {
        bx = players[0].x;
        by = players[0].y + (players[0].height || 50);
    }
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

    if (targetRole === 'NONE') {
        let trialsCleared = (typeof storyTrials !== 'undefined' && storyTrials && storyTrials.trialsCleared);
        if (!trialsCleared) {
            showStoryHeroWarning("Оставлять героев можно только после прохождения Испытаний!");
            return;
        }
        if (next[heroType] === 'P1') {
            showStoryHeroWarning("Основной герой (Игрок 1) не может быть отключён!");
            return;
        }
        next[heroType] = 'NONE';
    } else if (targetRole === 'P1' || targetRole === 'P2') {
        // Swap roles with whichever hero currently holds targetRole so there are never duplicates!
        let prevHolder = Object.keys(next).find(h => next[h] === targetRole);
        let oldRoleOfClicked = next[heroType] || 'AI';
        next[heroType] = targetRole;
        if (prevHolder && prevHolder !== heroType) {
            next[prevHolder] = (oldRoleOfClicked === 'NONE') ? 'AI' : oldRoleOfClicked;
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
    let trialsCleared = (typeof storyTrials !== 'undefined' && storyTrials && storyTrials.trialsCleared);
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
        let isNone = (curRole === 'NONE');
        let isAI = (!isP1 && !isP2 && !isNone);

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
                    ${(trialsCleared && !isP1) ? `
                    <button class="menu-btn" style="margin: 0; padding: 7px 11px; font-size: 11.5px; border-color: ${isNone ? '#ef4444' : '#475569'}; color: ${isNone ? '#fca5a5' : '#94a3b8'}; background: ${isNone ? 'rgba(239,68,68,0.22)' : 'rgba(255,255,255,0.04)'}; font-weight: 800;" onclick="assignStoryHeroRole('${h.id}', 'NONE')" title="Герой останется отдыхать и не пойдёт за вами">
                        ${isNone ? '✓ ' : ''}💤 Никто
                    </button>
                    ` : ''}
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
        if (!window.isStoryMode || !storyState.active) return;

        // Dialogue advancement
        if (storyDialogue.active) {
            if (e.code === 'KeyX' || e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter' || e.code === 'KeyZ' || e.code === 'KeyF') {
                e.preventDefault();
                e.stopPropagation();
                advanceStoryDialogue();
                return;
            }
        }

        // Ritual black screen card dismissal
        if (storyRitual.active && storyRitual.phase === 'BLACK_SCREEN' && storyRitual.blackScreenTimer > 40) {
            if (e.code === 'KeyX' || e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                finishAncientRitual();
                return;
            }
        }

        // Energy Scroll Ritual key progression (accepts [A], [Q], [F], Cyrillic 'а'/'ф', [Space], [Enter], or any action key)
        if (storyState.step === 'SCROLL_RITUAL' && storyState.scrollRitual) {
            let r = storyState.scrollRitual;
            if (r.stage === 'PROMPT_ATTACK' && r.timer > 5) {
                e.preventDefault();
                e.stopPropagation();
                r.stuckWeapon = true;
                r.stage = 'PROMPT_HEAL';
                r.timer = 0;
                updateStoryTouchUIVisibility();
                if (typeof playSound === 'function') {
                    playSound('slash');
                    playSound('parry');
                }
                if (typeof triggerShake === 'function') triggerShake(6, 12);
                if (typeof voidExplosions !== 'undefined') {
                    voidExplosions.push({ x: 1500, y: 848, timer: 20, isWhite: true, r: 40 });
                }
                return;
            } else if (r.stage === 'PROMPT_HEAL' && r.timer > 5) {
                e.preventDefault();
                e.stopPropagation();
                r.stage = 'LIGHT_ERUPTION';
                r.timer = 0;
                flashAlpha = 1.0;
                updateStoryTouchUIVisibility();
                if (typeof playSound === 'function') {
                    playSound('lightChime');
                    playSound('absorb');
                }
                if (typeof triggerShake === 'function') triggerShake(8, 16);
                return;
            } else if (r.stage === 'ANNOUNCEMENT' && r.timer > 10) {
                e.preventDefault();
                e.stopPropagation();
                finishScrollRitual();
                return;
            }
        }

        if (e.code === 'Tab') {
            e.preventDefault();
            if (storyState.backpackOpen) closeStoryBackpackModal();
            else {
                if (storyState.heroSelectOpen) closeStoryHeroSelectModal();
                openStoryBackpackModal();
            }
            return;
        }

        if (e.code === 'Space') {
            let canOpenSpace = (storyState.step === 'BENCH_REST') || (typeof storyTrials !== 'undefined' && storyTrials && storyTrials.trialsCleared);
            if (!canOpenSpace) return;
            e.preventDefault();
            if (storyState.heroSelectOpen) closeStoryHeroSelectModal();
            else {
                if (storyState.backpackOpen) closeStoryBackpackModal();
                openStoryHeroSelectModal();
            }
            return;
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
    if (!storyState.campfireFlames) storyState.campfireFlames = [];
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

    // 1. Silksong 2-Color Smooth Biome Gradient
    let targetTop = [2, 9, 7];
    let targetBot = [12, 43, 30];

    if (camY >= 1200) {
        // Deep Descent / Catacombs (Rooms 1 & 2): Cold Obsidian to Royal Indigo
        targetTop = [3, 2, 7];
        targetBot = [10, 17, 40];
    } else if (camY >= 400) {
        // Underground Cavern & Trials: Deep Shadow to Mystical Violet
        targetTop = [5, 4, 11];
        targetBot = [28, 14, 54];
    } else if (camX >= 3600) {
        // Water Pond & Sacred Shore: Deep Navy to Luminous Cyan
        targetTop = [2, 14, 28];
        targetBot = [8, 51, 68];
    } else {
        // Surface Forest / Grove: Midnight Forest to Twilight Jade Moss
        targetTop = [2, 9, 7];
        targetBot = [12, 43, 30];
    }

    if (!storyState.bgTop) storyState.bgTop = [...targetTop];
    if (!storyState.bgBot) storyState.bgBot = [...targetBot];

    for (let c = 0; c < 3; c++) {
        storyState.bgTop[c] += (targetTop[c] - storyState.bgTop[c]) * 0.05;
        storyState.bgBot[c] += (targetBot[c] - storyState.bgBot[c]) * 0.05;
    }

    let tCol = `rgb(${Math.round(storyState.bgTop[0])}, ${Math.round(storyState.bgTop[1])}, ${Math.round(storyState.bgTop[2])})`;
    let bCol = `rgb(${Math.round(storyState.bgBot[0])}, ${Math.round(storyState.bgBot[1])}, ${Math.round(storyState.bgBot[2])})`;

    let skyGrad = ctx.createLinearGradient(camX, camY, camX, camY + GAME_HEIGHT);
    skyGrad.addColorStop(0, tCol);
    skyGrad.addColorStop(1, bCol);
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

    // 5e. Wet Floor Specular Sheen & Shallow Glistening Puddles (Silksong atmospheric damp floor)
    drawStoryWetFloorAndPuddles();

    // 6. Interactive Cuttable Grass Blades & Flying Cut Leaf Particles
    drawStoryGrassBlades();

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

    // 9b. The 4-Stage Trials Arena (Logic Maze, Mannequins, Targets, Demon Boss)
    drawStoryTrials();

    // 9c. Chamber of Ancient Power (Post-Trials Reward Room with Chest and Тётя)
    drawChamberOfAncientPower();

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

    // 10b. Ancient Power Ritual Animation in World Space (thread rising, waving, splitting in 3, infusing heroes)
    drawAncientRitualWorld();

    // 10c. Air Traps Projectiles in Story Mode
    if (typeof airTraps !== 'undefined' && airTraps.length > 0) {
        for (let t of airTraps) {
            ctx.save();
            ctx.translate(t.x, t.y);
            let rot = Date.now() / 50;
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(7, 7);
            ctx.lineTo(-7, 7);
            ctx.closePath();
            ctx.fillStyle = "#ffdd00";
            ctx.shadowColor = "#ffdd00";
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.restore();
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

    // 11b. Universal Water Drops & Surface Ripples (ambient drips, splashes, ripples)
    drawStoryWaterDropsAndRipples();

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

    // 13b. Full Screen Blinding Cyan Flash for Ancient Blue Power Ritual
    if (typeof storyRitual !== 'undefined' && storyRitual.cyanFlashAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(56, 189, 248, ${storyRitual.cyanFlashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `rgba(255, 255, 255, ${storyRitual.cyanFlashAlpha * 0.85})`;
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

    // 17. Room Transitions, Death Blackout, & Scroll Ritual UI Overlays
    drawStoryOverlaysAndRitualUI();
}
window.drawStoryMode = drawStoryMode;

// --- SCREEN-SPACE OVERLAYS (DEATH, TRANSITION, SCROLL RITUAL) ---
function drawStoryOverlaysAndRitualUI() {
    if (!ctx || !canvas) return;

    // 0. Hazard Vignette Flash (Metroidvania hazard respawn shadow pulse)
    if (storyState.hazardFlash > 0) {
        ctx.save();
        let a = (storyState.hazardFlash / 16) * 0.65;
        let grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 70, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(0, 0, 0, ${a})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        storyState.hazardFlash--;
    }

    // 1. Full Screen Black Fade for Room Transitions (Room 1 <-> Room 2)
    if (storyState.roomFadeAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1.0, storyState.roomFadeAlpha)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // 2. Full Screen Black Fade for Death & Bench Respawn
    if (storyState.deathFadeAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1.0, storyState.deathFadeAlpha)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // When deep in blackness, show the whisper of the campfire
        if (storyState.deathFadeAlpha > 0.65) {
            let textAlpha = Math.min(1.0, (storyState.deathFadeAlpha - 0.65) / 0.35);
            ctx.textAlign = "center";
            ctx.fillStyle = `rgba(251, 191, 36, ${textAlpha * 0.95})`;
            ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
            ctx.shadowColor = "#f59e0b";
            ctx.shadowBlur = 18;
            ctx.fillText("🔥 Огонь костра возвращает силы...", canvas.width / 2, canvas.height / 2);
        }
        ctx.restore();
    }

    // 3. Energy Scroll Ritual UI Prompts & Cards
    if (storyState.step === 'SCROLL_RITUAL' && storyState.scrollRitual) {
        let r = storyState.scrollRitual;
        let heroTitle = (r.hero === 'WATER') ? 'Вода 💧' : (r.hero === 'AIR') ? 'Воздух 💨' : 'Земля 🌿';
        let heroColor = (r.hero === 'WATER') ? '#38bdf8' : (r.hero === 'AIR') ? '#facc15' : '#4ade80';
        let isTouch = (typeof p1InputType !== 'undefined' && p1InputType === 'TOUCH');

        if (r.stage === 'PROMPT_ATTACK') {
            ctx.save();
            let bw = Math.min(680, canvas.width - 36);
            let bh = 58;
            let bx = canvas.width / 2 - bw / 2;
            let by = canvas.height - 96;
            let pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.008);

            ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 20 * pulse;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 14);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.font = "900 17px 'Segoe UI', Arial, sans-serif";
            let atkText = isTouch 
                ? "⚔️ НАЖМИТЕ [ATK] (ИЛИ КОСНИТЕСЬ ЭКРАНА) — ВОНЗИТЬ ОРУЖИЕ!" 
                : "⚔️ НАЖМИТЕ [X] (АТАКА) / [ПРОБЕЛ] / КЛИК — ВОНЗИТЬ ОРУЖИЕ В СВИТОК!";
            ctx.fillText(atkText, canvas.width / 2, by + 27);

            ctx.fillStyle = heroColor;
            ctx.font = "bold 13px sans-serif";
            ctx.fillText(`${heroTitle} готовится поглотить энергию свитка и связать узы`, canvas.width / 2, by + 48);
            ctx.restore();
        } else if (r.stage === 'PROMPT_HEAL') {
            ctx.save();
            let bw = Math.min(680, canvas.width - 36);
            let bh = 58;
            let bx = canvas.width / 2 - bw / 2;
            let by = canvas.height - 96;
            let pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.01);

            ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
            ctx.strokeStyle = "#00e5ff";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 22 * pulse;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 14);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.font = "900 17px 'Segoe UI', Arial, sans-serif";
            let healText = isTouch 
                ? "✨ НАЖМИТЕ [HEAL] (ИЛИ КОСНИТЕСЬ ЭКРАНА) — ВЛИТЬ СВЕТ!" 
                : "✨ НАЖМИТЕ [A] (ХИЛ) / [ПРОБЕЛ] / КЛИК — ВЛИТЬ СВЕТ И СОЕДИНИТЬ УЗЫ!";
            ctx.fillText(healText, canvas.width / 2, by + 27);

            ctx.fillStyle = "#7dd3fc";
            ctx.font = "bold 13px sans-serif";
            ctx.fillText(`Свет озарит всю команду и разблокирует Рывок [C]`, canvas.width / 2, by + 48);
            ctx.restore();
        } else if (r.stage === 'ANNOUNCEMENT') {
            ctx.save();
            // Dim world background
            ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let cw = Math.min(590, canvas.width - 32);
            let ch = 350;
            let cx = canvas.width / 2 - cw / 2;
            let cy = canvas.height / 2 - ch / 2;

            let grad = ctx.createLinearGradient(cx, cy, cx, cy + ch);
            grad.addColorStop(0, "#0f172a");
            grad.addColorStop(1, "#020617");
            ctx.fillStyle = grad;
            ctx.strokeStyle = "#00e5ff";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cw, ch, 18);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.textAlign = "center";

            // Title
            ctx.fillStyle = "#00e5ff";
            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 16;
            ctx.font = "900 24px 'Segoe UI', Arial, sans-serif";
            ctx.fillText("⚡ РЫВОК ПОЛУЧЕН! ⚡", canvas.width / 2, cy + 42);
            ctx.shadowBlur = 0;

            // Button prompt
            ctx.fillStyle = "#fef08a";
            ctx.font = "bold 15px 'Segoe UI', Arial, sans-serif";
            ctx.fillText("Кнопка [C] — Рывок (уклонение и стремительное движение)", canvas.width / 2, cy + 72);

            // Divider
            ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + 30, cy + 92);
            ctx.lineTo(cx + cw - 30, cy + 92);
            ctx.stroke();

            // Master Hero
            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 15px sans-serif";
            ctx.fillText(`Мастер Свитка: ${heroTitle}`, canvas.width / 2, cy + 122);

            ctx.fillStyle = "#94a3b8";
            ctx.font = "13px sans-serif";
            ctx.fillText("✦ Бонус мастера: +20% к дальности и скорости рывка", canvas.width / 2, cy + 148);

            // Hero-specific perk box
            let perkBoxY = cy + 172;
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            ctx.strokeStyle = heroColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cx + 25, perkBoxY, cw - 50, 80, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = heroColor;
            ctx.font = "bold 14px sans-serif";
            if (r.hero === 'WATER') {
                ctx.fillText("💧 Особый навык Мастера Воды:", canvas.width / 2, perkBoxY + 30);
                ctx.fillStyle = "#ffffff";
                ctx.font = "13px sans-serif";
                ctx.fillText("Во время рывка получаемый урон уменьшается на 0.5!", canvas.width / 2, perkBoxY + 54);
            } else if (r.hero === 'AIR') {
                ctx.fillText("💨 Особый навык Мастера Воздуха:", canvas.width / 2, perkBoxY + 30);
                ctx.fillStyle = "#ffffff";
                ctx.font = "13px sans-serif";
                ctx.fillText("Выпускает мощную воздушную волну вперед, отталкивая врагов!", canvas.width / 2, perkBoxY + 54);
            } else {
                ctx.fillText("🌿 Особый навык Мастера Земли:", canvas.width / 2, perkBoxY + 30);
                ctx.fillStyle = "#ffffff";
                ctx.font = "13px sans-serif";
                ctx.fillText("При рывке к врагу совершает теневой шаг за его спину!", canvas.width / 2, perkBoxY + 54);
            }

            // Dismiss prompt
            let pulseCont = 0.7 + 0.3 * Math.sin(Date.now() * 0.007);
            ctx.fillStyle = `rgba(254, 240, 138, ${pulseCont})`;
            ctx.font = "bold 13px sans-serif";
            ctx.fillText("[Пробел] / [Enter] / [Клик] — Продолжить приключение", canvas.width / 2, cy + ch - 22);

            ctx.restore();
        }
    }

    // 4. Secret Room Discovery Banner
    if (storyState.secretRoomAnnounce > 0) {
        storyState.secretRoomAnnounce--;
        ctx.save();
        let bw = Math.min(540, canvas.width - 40);
        let bh = 44;
        let bx = canvas.width / 2 - bw / 2;
        let by = 90;
        ctx.fillStyle = "rgba(10, 24, 18, 0.95)";
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 10);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#86efac";
        ctx.font = "900 16px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("✨ СЕКРЕТНАЯ КОМНАТА ОБНАРУЖЕНА! ✨", canvas.width / 2, by + 27);
        ctx.restore();
    }


    // 5. Metroidvania Location Title Card when entering Room 2 (Scroll Cavern)
    if (storyState.room2BannerTimer > 0) {
        storyState.room2BannerTimer--;
        let t = storyState.room2BannerTimer;
        let alpha = 1.0;
        if (t > 190) {
            alpha = (220 - t) / 30; // Smooth fade-in
        } else if (t < 40) {
            alpha = t / 40; // Smooth fade-out
        }
        ctx.save();
        ctx.textAlign = "center";

        let cy = 110;
        // Subtle dark translucent background vignette behind title
        let grad = ctx.createRadialGradient(canvas.width / 2, cy, 20, canvas.width / 2, cy, 260);
        grad.addColorStop(0, `rgba(3, 7, 18, ${alpha * 0.7})`);
        grad.addColorStop(1, "rgba(3, 7, 18, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(canvas.width / 2 - 280, cy - 50, 560, 100);

        // Elegant ornamental divider lines
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.65})`;
        ctx.lineWidth = 1.2;
        // Left line
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 190, cy - 14);
        ctx.lineTo(canvas.width / 2 - 50, cy - 14);
        ctx.stroke();
        // Right line
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 + 50, cy - 14);
        ctx.lineTo(canvas.width / 2 + 190, cy - 14);
        ctx.stroke();

        // Center heraldic diamond
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, cy - 18);
        ctx.lineTo(canvas.width / 2 + 5, cy - 14);
        ctx.lineTo(canvas.width / 2, cy - 10);
        ctx.lineTo(canvas.width / 2 - 5, cy - 14);
        ctx.closePath();
        ctx.fill();

        // Main Location Title
        ctx.font = "bold 22px 'Trajan Pro', 'Cinzel', 'Times New Roman', serif, sans-serif";
        ctx.fillStyle = `rgba(240, 249, 255, ${alpha * 0.95})`;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.fillText("ПЕЩЕРА ДРЕВНЕГО СВИТКА", canvas.width / 2, cy + 12);
        ctx.shadowBlur = 0;

        // Subtitle
        ctx.font = "italic 13px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = `rgba(148, 163, 184, ${alpha * 0.85})`;
        ctx.fillText("— Покинутые глубины святилища —", canvas.width / 2, cy + 34);

        ctx.restore();
    }
}
window.drawStoryOverlaysAndRitualUI = drawStoryOverlaysAndRitualUI;

// --- RENDERING: INTERACTIVE CUTTABLE GRASS & PARTICLES ---
function drawStoryGrassBlades() {
    if (!ctx || !storyState.grassBlades) return;
    ctx.save();
    let t = Date.now() * 0.003;

    // 1. Living & cut grass blades
    for (let g of storyState.grassBlades) {
        let gy = g.y !== undefined ? g.y : STORY_CONFIG.FLOOR;
        if (g.x < camX - 40 || g.x > camX + GAME_WIDTH + 40 || gy < camY - 50 || gy > camY + GAME_HEIGHT + 50) continue;

        if (g.cut) {
            // Cut stub: short 4px stem with cut angle
            ctx.strokeStyle = "#166534";
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(g.x, gy);
            ctx.lineTo(g.x + (g.lean * 0.2), gy - 4);
            ctx.stroke();

            // Light sap dot on cut tip
            ctx.fillStyle = "#86efac";
            ctx.fillRect(g.x + (g.lean * 0.2) - 0.75, gy - 5, 1.5, 1.5);
        } else {
            // Swaying living grass blade
            let windLean = Math.sin(t + g.phase) * 4.5 + g.lean;
            ctx.strokeStyle = g.color;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(g.x, gy);
            ctx.quadraticCurveTo(g.x + windLean * 0.45, gy - g.h * 0.52, g.x + windLean, gy - g.h);
            ctx.stroke();
        }
    }

    // 2. Flying cut grass particles (падающие срезанные травинки)
    if (storyState.cutGrassParticles && storyState.cutGrassParticles.length > 0) {
        for (let p of storyState.cutGrassParticles) {
            if (p.x < camX - 30 || p.x > camX + GAME_WIDTH + 30) continue;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.strokeStyle = p.color || "#22c55e";
            ctx.lineWidth = 1.6;
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.beginPath();
            ctx.moveTo(-p.len / 2, 0);
            ctx.quadraticCurveTo(0, -2, p.len / 2, 0);
            ctx.stroke();
            ctx.restore();
        }
    }

    ctx.restore();
}
window.drawStoryGrassBlades = drawStoryGrassBlades;

// --- RENDERING: SILK FLIES & SPORE SPITTERS ---
function drawStorySilkFlies() {
    if (!ctx || !storyState.silkFlies) return;
    let t = Date.now();
    for (let sf of storyState.silkFlies) {
        if (sf.x < camX - 60 || sf.x > camX + GAME_WIDTH + 60) continue;
        ctx.save();
        ctx.translate(sf.x + sf.w / 2, sf.y + sf.h / 2);
        if (!sf.facingRight) ctx.scale(-1, 1);

        let flash = (sf.hitTimer > 0);

        // Soft silk luminescence aura
        ctx.shadowColor = flash ? "#ffffff" : "#38bdf8";
        ctx.shadowBlur = flash ? 16 : 10;

        // Translucent buzzing wings
        let wingFlap = Math.sin(t * 0.045) * 0.7;
        ctx.fillStyle = flash ? "rgba(255,255,255,0.9)" : "rgba(186, 230, 253, 0.65)";
        ctx.beginPath();
        ctx.ellipse(-2, -9 + wingFlap * 2, 11, 4 + Math.abs(wingFlap) * 3, -0.4, 0, Math.PI * 2);
        ctx.ellipse(3, -8 - wingFlap * 2, 10, 4 + Math.abs(wingFlap) * 3, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Silk Abdomen
        let bodyGrad = ctx.createRadialGradient(2, 2, 2, 0, 0, 10);
        bodyGrad.addColorStop(0, flash ? "#ffffff" : "#7dd3fc");
        bodyGrad.addColorStop(1, flash ? "#ffffff" : "#0284c7");
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 2, 8, 10, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Dark chitin head & antennae
        ctx.fillStyle = flash ? "#ffffff" : "#0f172a";
        ctx.beginPath();
        ctx.arc(6, -4, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Antennae
        ctx.strokeStyle = flash ? "#ffffff" : "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(8, -6); ctx.lineTo(13, -11);
        ctx.moveTo(6, -7); ctx.lineTo(9, -13);
        ctx.stroke();

        // Shiny purple-red bead eye
        ctx.fillStyle = flash ? "#ffffff" : "#f43f5e";
        ctx.beginPath();
        ctx.arc(8, -4, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
window.drawStorySilkFlies = drawStorySilkFlies;

function drawStorySporeSpitters() {
    if (!ctx || !storyState.sporeSpitters) return;
    for (let sp of storyState.sporeSpitters) {
        if (sp.x < camX - 60 || sp.x > camX + GAME_WIDTH + 60) continue;
        ctx.save();
        ctx.translate(sp.x + sp.w / 2, sp.y + sp.h / 2);
        if (!sp.facingRight) ctx.scale(-1, 1);

        let flash = (sp.hitTimer > 0);
        let swell = (sp.shootTimer <= 30) ? Math.sin((30 - sp.shootTimer) * 0.3) * 3.5 : 0;

        // Bulbous mossy body
        ctx.fillStyle = flash ? "#ffffff" : "#166534";
        ctx.strokeStyle = "#14532d";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 2, 14 + swell * 0.5, 12 + swell, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing spore throat opening
        let throatGlow = (sp.shootTimer <= 30) ? "#f59e0b" : "#4ade80";
        ctx.fillStyle = flash ? "#ffffff" : throatGlow;
        ctx.shadowColor = throatGlow;
        ctx.shadowBlur = (sp.shootTimer <= 30) ? 14 : 5;
        ctx.beginPath();
        ctx.ellipse(8 + swell, -1, 5 + swell * 0.6, 6 + swell * 0.6, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Grounding roots
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-12, 10, 24, 4);

        ctx.restore();
    }

    // Flying Spore Projectiles
    if (storyState.sporeProjectiles && storyState.sporeProjectiles.length > 0) {
        for (let spr of storyState.sporeProjectiles) {
            if (spr.x < camX - 40 || spr.x > camX + GAME_WIDTH + 40) continue;
            ctx.save();
            ctx.translate(spr.x, spr.y);
            let glow = spr.isReflected ? "#38bdf8" : "#fbbf24";
            ctx.shadowColor = glow;
            ctx.shadowBlur = 10;
            ctx.fillStyle = spr.isReflected ? "#e0f2fe" : "#fef08a";
            ctx.beginPath();
            ctx.arc(0, 0, spr.r, 0, Math.PI * 2);
            ctx.fill();

            // Inner core
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, spr.r * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
window.drawStorySporeSpitters = drawStorySporeSpitters;

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

// Draw Damp Floor Sheen (Слегка влажный камень с мягким бликом, без луж)
function drawStoryWetFloor() {
    if (!ctx) return;
    ctx.save();

    // Specular Horizontal Sheen along main stone floors (damp glistening rock)
    // Floor 1 sheen (X: 0..3820, Y = 350)
    let f1Sheen = ctx.createLinearGradient(0, STORY_CONFIG.FLOOR - 2, 0, STORY_CONFIG.FLOOR + 5);
    f1Sheen.addColorStop(0, "rgba(186, 230, 253, 0.13)");
    f1Sheen.addColorStop(0.5, "rgba(56, 189, 248, 0.05)");
    f1Sheen.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = f1Sheen;
    ctx.fillRect(0, STORY_CONFIG.FLOOR - 1, 3820, 6);

    // Floor 3 (Underground Lower Tier) sheen (X: -480..1960, Y = 850)
    let f3Sheen = ctx.createLinearGradient(0, STORY_CONFIG.LOWER_FLOOR - 2, 0, STORY_CONFIG.LOWER_FLOOR + 5);
    f3Sheen.addColorStop(0, "rgba(186, 230, 253, 0.15)");
    f3Sheen.addColorStop(0.5, "rgba(56, 189, 248, 0.06)");
    f3Sheen.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = f3Sheen;
    ctx.fillRect(-480, STORY_CONFIG.LOWER_FLOOR - 1, 2440, 6);

    // Room 1 Bottom Floor sheen
    ctx.fillRect(1040, 1950 - 1, 1280, 5);

    // Room 2 Floor sheen
    ctx.fillRect(8170, 1800 - 1, 1310, 5);

    ctx.restore();
}
window.drawStoryWetFloor = drawStoryWetFloor;
window.drawStoryWetFloorAndPuddles = drawStoryWetFloor;

// Draw Universal Water Droplets & Ripples (All world tiers, rooms, pond & splashes)
function drawStoryWaterDropsAndRipples() {
    if (!ctx) return;
    ctx.save();

    // 1. Water Ripples on pond and damp stone
    if (storyState.waterRipples && storyState.waterRipples.length > 0) {
        for (let r of storyState.waterRipples) {
            if (r.x < camX - 60 || r.x > camX + GAME_WIDTH + 60) continue;
            ctx.save();
            ctx.strokeStyle = "rgba(186, 230, 253, " + Math.max(0, r.alpha) + ")";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // 2. Splash Droplets (брызги от бега, приземлений, плавания)
    if (storyState.waterDrops && storyState.waterDrops.length > 0) {
        for (let d of storyState.waterDrops) {
            if (d.x < camX - 40 || d.x > camX + GAME_WIDTH + 40) continue;
            ctx.save();
            ctx.fillStyle = "rgba(224, 242, 254, " + Math.max(0, d.alpha) + ")";
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    ctx.restore();
}
window.drawStoryWaterDropsAndRipples = drawStoryWaterDropsAndRipples;

// Update Water Simulation (physics, collisions with floors/platforms/pond, and movement splashes)
function updateStoryWaterSystem() {
    if (!storyState.waterRipples) storyState.waterRipples = [];
    if (!storyState.waterDrops) storyState.waterDrops = [];

    // 1. Ripples Physics & Decay
    for (let i = storyState.waterRipples.length - 1; i >= 0; i--) {
        let r = storyState.waterRipples[i];
        r.rx += (r.rxSpd || 1.15);
        r.ry += (r.rySpd || 0.40);
        r.alpha -= (r.fadeSpd || 0.034);
        if (r.alpha <= 0 || r.timer-- <= 0 || (r.maxRx && r.rx >= r.maxRx)) {
            storyState.waterRipples.splice(i, 1);
        }
    }

    // 2. Splash Droplets Physics, Collision & Splats
    let pX1 = STORY_CONFIG.POND_X1 || 3820;
    let pX2 = STORY_CONFIG.POND_X2 || 4500;
    let plats = platforms || [];

    for (let i = storyState.waterDrops.length - 1; i >= 0; i--) {
        let d = storyState.waterDrops[i];
        d.x += (d.vx || 0);
        d.y += d.vy;
        d.vy += 0.28; // Water gravity
        d.alpha -= 0.024;

        let hitSurface = false;
        let hitY = 0;

        // Check Water Pond surface
        if (d.x >= pX1 && d.x <= pX2 && d.vy > 0 && d.y >= 356 && d.y <= 445) {
            hitSurface = true;
            hitY = 356;
            storyState.waterRipples.push({
                x: d.x,
                y: 356,
                rx: 3,
                ry: 1.2,
                maxRx: 16,
                alpha: 0.75,
                timer: 18
            });
        }

        // Check platforms and floors collision
        if (!hitSurface && d.vy > 0) {
            for (let plat of plats) {
                if (plat.solid && d.x >= plat.x && d.x <= plat.x + plat.w && d.y >= plat.y && d.y <= plat.y + 14) {
                    hitSurface = true;
                    hitY = plat.y;
                    storyState.waterRipples.push({
                        x: d.x,
                        y: hitY,
                        rx: 2.2,
                        ry: 0.8,
                        maxRx: 9 + Math.random() * 5,
                        alpha: 0.60,
                        timer: 14
                    });
                    if (d.vy > 2.8) {
                        for (let s = 0; s < 2; s++) {
                            storyState.waterDrops.push({
                                x: d.x + (Math.random() - 0.5) * 4,
                                y: hitY - 1,
                                vx: (Math.random() - 0.5) * 1.6,
                                vy: -0.7 - Math.random() * 1.1,
                                r: 1.0 + Math.random() * 0.6,
                                alpha: 0.65,
                                life: 10 + Math.random() * 6
                            });
                        }
                    }
                    break;
                }
            }
        }

        if (hitSurface || d.alpha <= 0 || d.life-- <= 0 || d.y > 2200) {
            storyState.waterDrops.splice(i, 1);
        }
    }
}
window.updateStoryWaterSystem = updateStoryWaterSystem;

// Draw Organic Mossy Earth Ledges and Cavern Floors
function drawStoryMossyPlatformsAndRoof() {
    if (!platforms) return;
    ctx.save();
    let now = Date.now();
    for (let plat of platforms) {
        if (!plat.mossy) continue;

        if (plat.w < 200) {
            // --- FLOATING SOLID MOSSY ROCK LEDGES (Natural stone slabs, NO table legs!) ---
            // 1. Chiseled dark ancient slate rock body
            let rGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
            rGrad.addColorStop(0, "#131f2b");
            rGrad.addColorStop(0.5, "#0b121c");
            rGrad.addColorStop(1, "#05080e");
            ctx.fillStyle = rGrad;
            ctx.beginPath();
            ctx.roundRect(plat.x, plat.y + 4, plat.w, plat.h - 4, [0, 0, 8, 8]);
            ctx.fill();

            // Slate stone edge outline
            ctx.strokeStyle = "rgba(45, 68, 92, 0.55)";
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // 2. Thick organic velvety moss cushion on top
            ctx.fillStyle = "#14532d";
            ctx.beginPath();
            ctx.roundRect(plat.x - 2, plat.y, plat.w + 4, 7, 4);
            ctx.fill();

            // Lush emerald moss crest with soft glow
            ctx.fillStyle = "#22c55e";
            ctx.shadowColor = "#16a34a";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.roundRect(plat.x, plat.y, plat.w, 3, [3, 3, 0, 0]);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Waving tiny grass fronds along the ledge surface
            ctx.fillStyle = "#4ade80";
            for (let gx = plat.x + 8; gx < plat.x + plat.w - 6; gx += 16) {
                let lean = Math.sin(now / 400 + gx * 0.1) * 2;
                ctx.beginPath();
                ctx.moveTo(gx, plat.y);
                ctx.lineTo(gx + lean, plat.y - 4);
                ctx.lineTo(gx + 2, plat.y);
                ctx.fill();
            }
        } else {
            // --- WIDE CAVERN CEILINGS & FLOORS (Thick solid earth & rock) ---
            ctx.fillStyle = "#070c16";
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 2;
            ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

            // Emerald grass turf along the surface
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(plat.x, plat.y);
            ctx.lineTo(plat.x + plat.w, plat.y);
            ctx.stroke();

            // Soft grass tufts waving on ground
            ctx.fillStyle = "#4ade80";
            for (let gx = plat.x + 15; gx < plat.x + plat.w - 15; gx += 32) {
                let lean = Math.sin(now / 450 + gx * 0.08) * 2;
                ctx.beginPath();
                ctx.moveTo(gx, plat.y);
                ctx.lineTo(gx + lean, plat.y - 4.5);
                ctx.lineTo(gx + 2.5, plat.y);
                ctx.fill();
            }
        }
    }
    ctx.restore();
}

// Draw Left Cliff Shaft and Lower Underground Tier (Floor 3 at Y = 850)
function drawStoryUndergroundTier() {
    ctx.save();
    let now = Date.now();

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

    // Lower Underground Floor 3 (X = -480..1960, Y = 850) - Bench 2 & Trials Gate Corridor
    // Continuous solid rock foundation extending from X = -480 to 1960 and Y = 850 down to 960!
    ctx.fillStyle = "#080f1a";
    ctx.fillRect(-480, STORY_CONFIG.LOWER_FLOOR, 2440, 110);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-480, STORY_CONFIG.LOWER_FLOOR);
    ctx.lineTo(1960, STORY_CONFIG.LOWER_FLOOR);
    ctx.stroke();

    // Natural stone cliff edge at X = 1960, Y = 850..960
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1960, STORY_CONFIG.LOWER_FLOOR);
    ctx.lineTo(1960, 960);
    ctx.stroke();



    // --- ROOM 1 BOUNDARY WALLS ---
    // Outer Left Boundary Wall of Middle & Bottom Tier (X = 1040, Y = 960..2020)
    ctx.fillStyle = "#060a14";
    ctx.fillRect(1040, 960, 40, 1060);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(1040, 960, 40, 1060);

    // Outer Right Boundary Wall of Room 1 (X = 2440, Y = 850..2020)
    ctx.fillRect(2440, 850, 40, 1170);
    ctx.strokeRect(2440, 850, 40, 1170);

    // Middle Tier Cavern Ceiling line at Y = 960 (X = 1040..1960) with hanging moss vines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1040, 960);
    ctx.lineTo(1960, 960);
    ctx.stroke();

    ctx.lineWidth = 1.4;
    for (let vx = 1100; vx < 1940; vx += 36) {
        let vh = 10 + ((vx * 11) % 16);
        let sway = Math.sin(now / 500 + vx * 0.05) * 4;
        ctx.strokeStyle = "#15803d";
        ctx.beginPath();
        ctx.moveTo(vx, 960);
        ctx.quadraticCurveTo(vx + sway * 0.5, 960 + vh * 0.5, vx + sway, 960 + vh);
        ctx.stroke();
    }

    // --- MIDDLE TIER FLOOR (Y = 1400: Screen-Height Cavern!) ---
    // Left solid floor section (X: 1200..1680)
    ctx.fillStyle = "#080f1a";
    ctx.fillRect(1200, 1400, 480, 45);
    // Right solid floor section (X: 1960..2380)
    ctx.fillRect(1960, 1400, 420, 45);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1200, 1400); ctx.lineTo(1680, 1400);
    ctx.moveTo(1960, 1400); ctx.lineTo(2380, 1400);
    ctx.stroke();

    // --- DIVIDER 2 (Middle Tier underside: X = 1040..2440, Y = 1445..1500) ---
    ctx.fillStyle = "#070c17";
    ctx.fillRect(1040, 1445, 1400, 55);
    ctx.strokeStyle = "#1e293b";
    ctx.strokeRect(1040, 1445, 1400, 55);

    // Secret Room Ceiling rock (X: 2120..2460, Y: 1500..1524)
    ctx.fillStyle = "#070c17";
    ctx.fillRect(2120, 1500, 340, 24);
    ctx.strokeStyle = "#1e293b";
    ctx.strokeRect(2120, 1500, 340, 24);

    // Secret Room Floor rock (X: 2120..2460, Y: 1650..1680)
    ctx.fillStyle = "#080f1a";
    ctx.fillRect(2120, 1650, 340, 30);
    ctx.strokeStyle = "#1e293b";
    ctx.strokeRect(2120, 1650, 340, 30);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(2120, 1650); ctx.lineTo(2460, 1650);
    ctx.stroke();

    // Weeping moss tendrils under Middle Tier (Y = 1500)
    for (let vx = 1120; vx < 2100; vx += 38) {
        let vh = 9 + ((vx * 13) % 15);
        let sway = Math.sin(now / 520 + vx * 0.06) * 3;
        ctx.strokeStyle = "#15803d";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(vx, 1500);
        ctx.quadraticCurveTo(vx + sway * 0.5, 1500 + vh * 0.5, vx + sway, 1500 + vh);
        ctx.stroke();
    }

    // --- BOTTOM TIER FLOOR OF ROOM 1 (Y = 1950: X = 1120..2320) ---
    ctx.fillStyle = "#080f1a";
    ctx.fillRect(1120, 1950, 1200, 80);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1120, 1950);
    ctx.lineTo(2320, 1950);
    ctx.stroke();

    // Atmospheric Abyss Pit Opening in Room 1 (X = 2320..2440, Y = 1950..2150)
    let pitGrad = ctx.createLinearGradient(2380, 1950, 2380, 2150);
    pitGrad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
    pitGrad.addColorStop(0.3, "rgba(3, 7, 18, 0.85)");
    pitGrad.addColorStop(1, "#020617");
    ctx.fillStyle = pitGrad;
    ctx.fillRect(2320, 1950, 120, 200);

    // Downward air current wisps showing the shaft descends into the depths
    ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
        let wx = 2335 + i * 26;
        let wy = 1950 + ((now / 15 + i * 40) % 150);
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx, wy + 22);
        ctx.stroke();
    }
    // Subtle blue downward particles inside the pit
    ctx.fillStyle = "#38bdf8";
    for (let i = 0; i < 4; i++) {
        let px = 2335 + ((i * 37 + now / 25) % 90);
        let py = 1960 + ((i * 45 + now / 18) % 130);
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- ROOM 2 WORLD: Ceiling, Shaft, Outer Walls, Bottom Floor, Central Chamber ---
    // Outer boundary walls (Left: X = 8170..8200 with arch opening at Y = 1360..1520, Right: X = 9550..9580, Y = 700..1860)
    ctx.fillStyle = "#060a14";
    ctx.fillRect(8170, 700, 30, 660);   // Upper left wall (Y = 700..1360)
    ctx.fillRect(8170, 1520, 30, 340);  // Lower left wall (Y = 1520..1860)
    ctx.fillRect(9550, 700, 30, 1160);  // Right wall
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(8170, 700, 30, 660);
    ctx.strokeRect(8170, 1520, 30, 340);
    ctx.strokeRect(9550, 700, 30, 1160);

    // Ceiling of Room 2 with top-right vertical drop shaft (Sketch 2 Purple Circle: shaft at X = 9320..9460)
    // Left ceiling slab: X = 8200..9320, Y = 670..700
    ctx.fillStyle = "#070c17";
    ctx.fillRect(8200, 670, 1120, 30);
    ctx.strokeStyle = "#1e293b";
    ctx.strokeRect(8200, 670, 1120, 30);
    // Right ceiling slab: X = 9460..9580, Y = 670..700
    ctx.fillRect(9460, 670, 120, 30);
    ctx.strokeRect(9460, 670, 120, 30);

    // Vertical stone shaft walls extending upward (X = 9300..9324 and X = 9456..9480, Y = 480..700)
    ctx.fillStyle = "#090f1d";
    ctx.fillRect(9300, 480, 24, 220);
    ctx.fillRect(9456, 480, 24, 220);
    ctx.strokeStyle = "#1e293b";
    ctx.strokeRect(9300, 480, 24, 220);
    ctx.strokeRect(9456, 480, 24, 220);

    // Subtle ancient runic carvings on the shaft walls
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    for (let sy = 510; sy < 690; sy += 32) {
        ctx.beginPath();
        ctx.moveTo(9304, sy); ctx.lineTo(9320, sy + 14);
        ctx.moveTo(9460, sy); ctx.lineTo(9476, sy + 14);
        ctx.stroke();
    }

    // Weeping moss hanging from Room 2 ceiling
    for (let cx = 8280; cx < 9300; cx += 42) {
        let vh = 8 + ((cx * 13) % 16);
        let sway = Math.sin(now / 520 + cx * 0.06) * 3;
        ctx.strokeStyle = "#15803d";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, 700);
        ctx.quadraticCurveTo(cx + sway * 0.5, 700 + vh * 0.5, cx + sway, 700 + vh);
        ctx.stroke();
    }

    // Radiant celestial light beam pouring down from the ceiling shaft into the cavern
    let shaftBeam = ctx.createLinearGradient(9390, 480, 9390, 1120);
    shaftBeam.addColorStop(0, "rgba(56, 189, 248, 0.38)");
    shaftBeam.addColorStop(0.35, "rgba(56, 189, 248, 0.18)");
    shaftBeam.addColorStop(0.85, "rgba(56, 189, 248, 0.05)");
    shaftBeam.addColorStop(1, "transparent");
    ctx.fillStyle = shaftBeam;
    ctx.beginPath();
    ctx.moveTo(9320, 480);
    ctx.lineTo(9460, 480);
    ctx.lineTo(9510, 1120);
    ctx.lineTo(9270, 1120);
    ctx.closePath();
    ctx.fill();

    // Floating light motes drifting gently in the shaft beam
    ctx.fillStyle = "rgba(186, 230, 253, 0.8)";
    for (let i = 0; i < 7; i++) {
        let mx = 9330 + ((i * 31 + now / 24) % 120);
        let my = 500 + ((i * 89 + now / 18) % 600);
        let r = 1.2 + (i % 3) * 0.7;
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Bottom Floor of Room 2 (X = 8340..9480, Y = 1800)
    ctx.fillStyle = "#080f1a";
    ctx.fillRect(8340, 1800, 1140, 80);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(8340, 1800);
    ctx.lineTo(9480, 1800);
    ctx.stroke();

    // Central Chamber in Room 2 (Floor Y = 1540, Roof Y = 1360, X = 8680..9340)
    ctx.fillStyle = "#080f1a";
    ctx.fillRect(8680, 1540, 660, 30);
    ctx.fillRect(8680, 1360, 660, 30);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(8680, 1540, 660, 30);
    ctx.strokeRect(8680, 1360, 660, 30);
    // Green grass walkway on top of chamber roof (Sketch 2 upper path: X = 8680..9340, Y = 1360)
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(8680, 1360); ctx.lineTo(9340, 1360);
    ctx.stroke();
    // Interior chamber floor
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(8680, 1540); ctx.lineTo(9340, 1540);
    ctx.stroke();

    // Exit Archway on Left Wall of Room 2 (X = 8170..8260, Y = 1360..1520) -> leads back to Room 1 & Bench
    let archGrad = ctx.createLinearGradient(8170, 1360, 8260, 1360);
    archGrad.addColorStop(0, "rgba(56, 189, 248, 0.65)");
    archGrad.addColorStop(0.65, "rgba(56, 189, 248, 0.25)");
    archGrad.addColorStop(1, "transparent");
    ctx.fillStyle = archGrad;
    ctx.fillRect(8170, 1360, 80, 160);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(8170, 1360, 14, 160);

    ctx.fillStyle = "#7dd3fc";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⬅ В пещеру к скамейке", 8275, 1345);

    ctx.restore();

    // Draw Room 1 and Room 2 details (Spikes, Crawlers, Walls, Pickups, Ritual, Darkness Shrouds)
    drawStoryRoom1AndRoom2World();
}

// --- SPIKES DEFINITIONS ACROSS ROOM 1 & ROOM 2 (Strictly matching user sketches!) ---
const STORY_SPIKES = [
    // Room 1 Middle Tier far-right sunken pit (near right wall)
    { x: 2380, y: 1392, w: 100, h: 26 },
    // Room 1 Middle Tier center sunken pit (under Plat 3)
    { x: 1680, y: 1392, w: 280, h: 26 },
    // Room 1 Bottom Tier far-left corner sunken pit
    { x: 1040, y: 1942, w: 80, h: 26 },
    // Room 2 Bottom Floor far-left corner sunken pit
    { x: 8220, y: 1792, w: 120, h: 26 }
];

function isPositionNearSpikes(x, y, w, h) {
    let pw = w || 30;
    let ph = h || 45;
    // Safe floating rock ledge over center spike pit (X: 1710..1930, Y <= 1355)
    if (x + pw > 1710 && x < 1930 && y + ph <= 1355) return false;
    // 1. Spikes danger zone buffer (at least 35px away horizontally from spike pit opening)
    for (let sp of STORY_SPIKES) {
        let bufX = 35;
        if (x + pw > sp.x - bufX && x < sp.x + sp.w + bufX &&
            y + ph > sp.y - 15 && y < sp.y + sp.h + 24) {
            return true;
        }
    }
    // 2. Drop shafts (Room 1 bottom pit and Room 2 exit arch)
    if (x + pw > 2290 && x < 2480 && y + ph > 1920) return true;
    if (x + pw > 8200 && x < 8340 && y + ph > 1750) return true;
    return false;
}
window.isPositionNearSpikes = isPositionNearSpikes;

function handleStoryHazardDamage(pl) {
    if (!pl || pl.isAi) return;
    if (pl.hazardCooldown > 0) return;
    pl.hazardCooldown = 30;

    // 1. Deal 1 hazard damage (classical metroidvania penalty)
    damagePlayer(1, pl, false, true);

    // 2. If this damage dropped HP to 0, let the party wipe / bench rest take over
    if (pl.hp <= 0) return;

    // 3. Classical Metroidvania Hazard Respawn: hero takes 1 damage and returns to last safe ground!
    let defX = STORY_CONFIG.BENCH_2_X;
    let defY = STORY_CONFIG.BENCH_2_Y - (pl.height || 45);
    if (pl.y > 900 && pl.y < 1550) {
        defX = (pl.x > 1850 ? 2120 : 1550);
        defY = 1400 - (pl.height || 45);
    } else if (pl.y >= 1550 && pl.x < 8000) {
        defX = 1400;
        defY = 1950 - (pl.height || 45);
    } else if (pl.x >= 8200) {
        defX = 8600;
        defY = 1800 - (pl.height || 45);
    }

    let respawnX = (pl.lastSafeX !== undefined && pl.lastSafeX !== null) ? pl.lastSafeX : defX;
    let respawnY = (pl.lastSafeY !== undefined && pl.lastSafeY !== null) ? pl.lastSafeY : defY;

    // Double-check: ensure respawn coordinates are NOT in/near any spike
    if (isPositionNearSpikes(respawnX, respawnY, pl.width, pl.height)) {
        respawnX = defX;
        respawnY = defY;
    }

    pl.x = respawnX;
    pl.y = respawnY;
    pl.vx = 0;
    pl.vy = 0;
    pl.invuln = 90; // 1.5 seconds generous invulnerability window
    storyState.hazardFlash = 16; // Visual dark vignette pulse

    // Audio & particles
    if (typeof playSound === 'function') {
        playSound('hitPlayer');
        playSound('shuriken');
    }
    if (typeof triggerShake === 'function') triggerShake(6, 12);
    if (typeof voidExplosions !== 'undefined') {
        voidExplosions.push({ x: respawnX + (pl.width || 30) / 2, y: respawnY + (pl.height || 45) / 2, timer: 18, isWhite: true, r: 35 });
    }

    // Safely relocate AI companions to hero's safe ground
    for (let comp of players) {
        if (!comp || comp === pl) continue;
        comp.x = respawnX + (comp.type === 'AIR' ? -35 : 35);
        comp.y = respawnY;
        comp.vx = 0;
        comp.vy = 0;
        comp.invuln = 90;
    }
}
window.handleStoryHazardDamage = handleStoryHazardDamage;

let airDashWaves = [];

function triggerAirDashWave(player) {
    let dir = player.facingRight ? 1 : -1;
    airDashWaves.push({
        x: player.facingRight ? player.x + player.width + 10 : player.x - 35,
        y: player.y + player.height / 2 - 18,
        dir: dir,
        speed: 15,
        timer: 20,
        w: 36,
        h: 36
    });
    if (typeof playSound === 'function') playSound('bladeSpin');
    if (typeof applyPhysicsPushToLeaves === 'function') {
        applyPhysicsPushToLeaves(player.x, player.y, 14);
    }
}
window.triggerAirDashWave = triggerAirDashWave;

function triggerEarthBehindBackDash(player) {
    let target = null;
    let minDist = 320;
    let dir = player.facingRight ? 1 : -1;

    // Check boss in arena
    if (typeof boss !== 'undefined' && boss && boss.hp > 0 && !boss.state.startsWith('CINEMATIC')) {
        let dist = (boss.x - player.x) * dir;
        if (dist > 15 && dist < minDist) {
            target = { x: boss.x, y: boss.y, w: boss.width, h: boss.height };
        }
    }
    // Check moss crawlers
    if (!target && storyState.mossCrawlers) {
        for (let mc of storyState.mossCrawlers) {
            let dist = (mc.x - player.x) * dir;
            if (dist > 15 && dist < minDist) {
                minDist = dist;
                target = mc;
            }
        }
    }

    if (target) {
        player.shadowStepCooldown = 90;
        let behindX = player.facingRight ? target.x + target.w + 14 : target.x - player.width - 14;
        player.x = behindX;
        player.y = target.y - 6;
        player.facingRight = (target.x > player.x);
        if (typeof playSound === 'function') playSound('teleport');
        if (typeof triggerShake === 'function') triggerShake(4, 8);
        if (typeof voidExplosions !== 'undefined') {
            voidExplosions.push({ x: player.x + 15, y: player.y + 20, timer: 14, isWhite: false, r: 35 });
        }
    }
}
window.triggerEarthBehindBackDash = triggerEarthBehindBackDash;

function updateStoryGameplayEntities() {
    if (!storyState.active) return;

    // 1. Air Dash Wave Projectiles update
    for (let i = airDashWaves.length - 1; i >= 0; i--) {
        let w = airDashWaves[i];
        w.x += w.dir * w.speed;
        w.timer--;

        // Push / damage Moss Crawlers & Silk Flies
        if (storyState.mossCrawlers) {
            for (let mc of storyState.mossCrawlers) {
                if (rectIntersect(w, { x: mc.x, y: mc.y, width: mc.w, height: mc.h })) {
                    mc.hp -= 1.0;
                    mc.hitTimer = 14;
                    mc.vx = w.dir * 3.5;
                    if (typeof playSound === 'function') playSound('bladeSpin');
                }
            }
        }
        if (storyState.silkFlies) {
            for (let sf of storyState.silkFlies) {
                if (rectIntersect(w, { x: sf.x, y: sf.y, width: sf.w, height: sf.h })) {
                    sf.hp -= 1.0;
                    sf.hitTimer = 14;
                    if (typeof playSound === 'function') playSound('bladeSpin');
                }
            }
        }
        // Wave cuts grass along its flight path!
        if (typeof checkStoryGrassSlashHitbox === 'function') {
            checkStoryGrassSlashHitbox({ x: w.x, y: w.y - 10, width: w.w || 30, height: (w.h || 30) + 20 }, { facingRight: w.dir > 0 });
        }

        if (w.timer <= 0) {
            airDashWaves.splice(i, 1);
        }
    }

    // 2. Spikes & Safe Ground Tracking (Classic Metroidvania Hazard System)
    for (let pl of players) {
        if (!pl || pl.isDowned) continue;

        if (pl.hazardCooldown > 0) pl.hazardCooldown--;

        // Solid, non-hazardous ground updates the last safe position
        if (pl.onGround && !isPositionNearSpikes(pl.x, pl.y, pl.width, pl.height)) {
            pl.lastSafeX = pl.x;
            pl.lastSafeY = pl.y;
        }

        // Only human player triggers hazard damage (AI companions follow safely)
        if (!pl.isAi && (!pl.lastSpikePogoTimer || pl.lastSpikePogoTimer <= 0) && (!pl.hazardCooldown || pl.hazardCooldown <= 0)) {
            let inSpike = false;
            for (let sp of STORY_SPIKES) {
                // Inset hazard hitbox so standing right on solid floor edge never falsely triggers spike damage!
                let spBox = {
                    x: sp.x + 8,
                    y: sp.y + 12,
                    width: Math.max(10, sp.w - 16),
                    height: Math.max(10, sp.h - 12)
                };
                if (rectIntersect(pl, spBox)) {
                    inSpike = true;
                    break;
                }
            }
            if (inSpike) {
                handleStoryHazardDamage(pl);
            }
        }
    }

    // 3. Interactive Grass Physics & Reaction to Players Walking
    if (storyState.grassBlades && storyState.grassBlades.length > 0) {
        for (let g of storyState.grassBlades) {
            let gy = g.y !== undefined ? g.y : STORY_CONFIG.FLOOR;
            // Spring oscillation returning to neutral
            g.springVx += -g.lean * 0.14;
            g.springVx *= 0.84;
            g.lean += g.springVx;
            g.lean = Math.max(-14, Math.min(14, g.lean));

            // React to passing players
            if (!g.cut) {
                for (let pl of players) {
                    if (!pl) continue;
                    if (Math.abs(pl.x + pl.width / 2 - g.x) < 20 && Math.abs(pl.y + pl.height - gy) < 14) {
                        let pushDir = Math.sign(pl.vx) || (pl.facingRight ? 1 : -1);
                        g.springVx += pushDir * (Math.abs(pl.vx) * 0.35 + 1.2);
                    }
                }
            }
        }
    }

    // 3b. Cut Grass Particles Update
    if (storyState.cutGrassParticles && storyState.cutGrassParticles.length > 0) {
        for (let idx = storyState.cutGrassParticles.length - 1; idx >= 0; idx--) {
            let p = storyState.cutGrassParticles[idx];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.22; // gentle fluttering gravity
            p.rot += p.rotSpeed;
            p.alpha -= 0.025;
            if (p.alpha <= 0 || p.life-- <= 0) {
                storyState.cutGrassParticles.splice(idx, 1);
            }
        }
    }

    // 3c. Water System Update (Pond, ambient ceiling drips, shallow puddles & splash droplets)
    updateStoryWaterSystem();

    // 3d. Ensure all world enemies exist
    if (!storyState.mossCrawlers) {
        spawnStoryWorldEnemies();
    }

    // 3e. Moss Crawlers (Мховички) Update & Pogo Bounce
    for (let i = storyState.mossCrawlers.length - 1; i >= 0; i--) {
        let mc = storyState.mossCrawlers[i];
        if (!mc) continue;
        if (mc.hitTimer > 0) mc.hitTimer--;
        mc.x += mc.vx;
        if (mc.x > mc.endX) { mc.vx = -Math.abs(mc.vx); mc.facingRight = false; }
        else if (mc.x < mc.startX) { mc.vx = Math.abs(mc.vx); mc.facingRight = true; }

        let mcBox = { x: mc.x, y: mc.y, width: mc.w, height: mc.h };

        // Contact with player: 1 damage
        for (let pl of players) {
            if (pl && !pl.isDowned && pl.invuln <= 0 && rectIntersect(pl, mcBox)) {
                damagePlayer(1, pl, false, false);
                pl.vx = mc.facingRight ? 4.5 : -4.5;
            }
        }

        // Hit by player melee attacks
        for (let pl of players) {
            if (!pl || pl.attackTimer <= 0) continue;
            let atkRange = pl.atkRange || 80;
            let isDownAtk = (pl.keys && (checkKeyInput(pl.keys, 'down') || pl.keys.down || isKeyPressed(pl.keys.down))) || (pl.attackType === 'DOWN');
            let isUpAtk = (pl.keys && (checkKeyInput(pl.keys, 'up') || pl.keys.up || isKeyPressed(pl.keys.up))) || (pl.attackType === 'UP');
            let atkBox = {
                x: isDownAtk || isUpAtk ? pl.x - 25 : (pl.facingRight ? pl.x - 10 : pl.x - atkRange),
                y: isDownAtk ? pl.y + 12 : (isUpAtk ? pl.y - atkRange : pl.y - 15),
                width: isDownAtk || isUpAtk ? pl.width + 50 : atkRange + 30,
                height: isDownAtk || isUpAtk ? atkRange + 25 : pl.height + 35
            };
            if (rectIntersect(atkBox, mcBox) && mc.hitTimer <= 0) {
                mc.hp -= 1.0;
                mc.hitTimer = 16;
                // POGO BOUNCE if hitting from above!
                if (isDownAtk || pl.y + pl.height <= mc.y + 18) {
                    if (typeof triggerPlayerPogoBounce === 'function') {
                        triggerPlayerPogoBounce(pl, mc.y + 4);
                    } else {
                        pl.vy = -16.0;
                        pl.jumps = 1;
                        pl.airDashed = false;
                    }
                } else {
                    if (typeof playSound === 'function') playSound('slash');
                    if (typeof triggerShake === 'function') triggerShake(4, 7);
                }
                if (typeof voidExplosions !== 'undefined') {
                    voidExplosions.push({ x: mc.x + mc.w/2, y: mc.y + mc.h/2, timer: 16, isWhite: true, r: 30 });
                }
                break;
            }
        }

        // Hit by Air Traps
        if (typeof airTraps !== 'undefined' && airTraps.length > 0) {
            for (let at of airTraps) {
                if (rectIntersect({ x: at.x - 10, y: at.y - 10, width: 20, height: 20 }, mcBox) && mc.hitTimer <= 0) {
                    mc.hp -= 1.0;
                    mc.hitTimer = 14;
                    if (typeof playSound === 'function') playSound('bladeSpin');
                    break;
                }
            }
        }

        // Death: Enemy dies until resting at a bench!
        if (mc.hp <= 0) {
            if (typeof playSound === 'function') {
                playSound('rockCrit');
                playSound('parry');
            }
            if (typeof triggerShake === 'function') triggerShake(7, 12);
            if (typeof voidExplosions !== 'undefined') {
                voidExplosions.push({ x: mc.x + mc.w/2, y: mc.y + mc.h/2, timer: 24, isWhite: false, isOrange: true, r: 42 });
            }
            storyState.mossCrawlers.splice(i, 1);
        }
    }

    // 3f. Silk Moths / Flies (Шёлковые мошки - парят в воздухе, служат для пого-прыжка!)
    if (storyState.silkFlies && storyState.silkFlies.length > 0) {
        let nowTime = Date.now();
        for (let i = storyState.silkFlies.length - 1; i >= 0; i--) {
            let sf = storyState.silkFlies[i];
            if (!sf) continue;
            if (sf.hitTimer > 0) sf.hitTimer--;
            sf.y = sf.baseY + Math.sin(nowTime * (sf.bobSpeed || 0.05) + sf.phase) * (sf.bobAmp || 18);
            sf.x += Math.sin(nowTime * 0.002 + sf.phase * 2) * 0.25;

            let sfBox = { x: sf.x - 4, y: sf.y - 4, width: sf.w + 8, height: sf.h + 8 };

            // Touch player: 1 damage
            for (let pl of players) {
                if (pl && !pl.isDowned && pl.invuln <= 0 && rectIntersect(pl, sfBox)) {
                    damagePlayer(1, pl, false, false);
                    pl.vx = (pl.x < sf.x) ? -4 : 4;
                }
            }

            // Hit by player attacks: down-attack causes massive pogo boost!
            for (let pl of players) {
                if (!pl || pl.attackTimer <= 0) continue;
                let atkRange = pl.atkRange || 80;
                let isDownAtk = (pl.keys && (checkKeyInput(pl.keys, 'down') || pl.keys.down || isKeyPressed(pl.keys.down))) || (pl.attackType === 'DOWN');
                let isUpAtk = (pl.keys && (checkKeyInput(pl.keys, 'up') || pl.keys.up || isKeyPressed(pl.keys.up))) || (pl.attackType === 'UP');
                let atkBox = {
                    x: isDownAtk || isUpAtk ? pl.x - 25 : (pl.facingRight ? pl.x - 10 : pl.x - atkRange),
                    y: isDownAtk ? pl.y + 12 : (isUpAtk ? pl.y - atkRange : pl.y - 15),
                    width: isDownAtk || isUpAtk ? pl.width + 50 : atkRange + 30,
                    height: isDownAtk || isUpAtk ? atkRange + 25 : pl.height + 35
                };
                if (rectIntersect(atkBox, sfBox) && sf.hitTimer <= 0) {
                    sf.hp -= 1.0;
                    sf.hitTimer = 16;
                    // SILKSONG POGO BOUNCE!
                    if (isDownAtk || pl.y + pl.height <= sf.y + 18) {
                        if (typeof triggerPlayerPogoBounce === 'function') {
                            triggerPlayerPogoBounce(pl, sf.y + 4);
                        } else {
                            pl.vy = -16.0;
                            pl.jumps = 1;
                            pl.airDashed = false;
                        }
                    } else {
                        if (typeof playSound === 'function') playSound('slash');
                        if (typeof triggerShake === 'function') triggerShake(4, 7);
                    }
                    if (typeof voidExplosions !== 'undefined') {
                        voidExplosions.push({ x: sf.x + sf.w/2, y: sf.y + sf.h/2, timer: 14, isWhite: true, r: 28 });
                    }
                    break;
                }
            }

            // Death
            if (sf.hp <= 0) {
                if (typeof playSound === 'function') {
                    playSound('lightChime');
                    playSound('shuriken');
                }
                if (typeof voidExplosions !== 'undefined') {
                    voidExplosions.push({ x: sf.x + sf.w/2, y: sf.y + sf.h/2, timer: 20, isWhite: true, isOrange: false, r: 35 });
                }
                storyState.silkFlies.splice(i, 1);
            }
        }
    }

    // 3g. Spore Spitters & Spore Projectiles (Споровые плевуны)
    if (storyState.sporeSpitters && storyState.sporeSpitters.length > 0) {
        let pLeader = players[0] || { x: 0, y: 0 };
        for (let i = storyState.sporeSpitters.length - 1; i >= 0; i--) {
            let sp = storyState.sporeSpitters[i];
            if (!sp) continue;
            if (sp.hitTimer > 0) sp.hitTimer--;

            // Face closest player
            sp.facingRight = (pLeader.x > sp.x);

            // Shooting cycle
            if (sp.shootTimer > 0) {
                sp.shootTimer--;
                if (sp.shootTimer === 0) {
                    sp.shootTimer = 160 + Math.floor(Math.random() * 40);
                    // Spawn spore projectile flying toward leader!
                    let dir = sp.facingRight ? 1 : -1;
                    if (!storyState.sporeProjectiles) storyState.sporeProjectiles = [];
                    storyState.sporeProjectiles.push({
                        x: sp.x + (sp.facingRight ? sp.w + 6 : -6),
                        y: sp.y + 8,
                        vx: dir * 3.8,
                        vy: -0.6,
                        r: 7,
                        isReflected: false,
                        timer: 160
                    });
                    if (typeof playSound === 'function') playSound('step');
                }
            }

            let spBox = { x: sp.x, y: sp.y, width: sp.w, height: sp.h };

            // Touch player: 1 damage
            for (let pl of players) {
                if (pl && !pl.isDowned && pl.invuln <= 0 && rectIntersect(pl, spBox)) {
                    damagePlayer(1, pl, false, false);
                    pl.vx = sp.facingRight ? 4 : -4;
                }
            }

            // Hit by player melee attacks (supports pogo bounce!)
            for (let pl of players) {
                if (!pl || pl.attackTimer <= 0) continue;
                let atkRange = pl.atkRange || 80;
                let isDownAtk = (pl.keys && (checkKeyInput(pl.keys, 'down') || pl.keys.down || isKeyPressed(pl.keys.down))) || (pl.attackType === 'DOWN');
                let isUpAtk = (pl.keys && (checkKeyInput(pl.keys, 'up') || pl.keys.up || isKeyPressed(pl.keys.up))) || (pl.attackType === 'UP');
                let atkBox = {
                    x: isDownAtk || isUpAtk ? pl.x - 25 : (pl.facingRight ? pl.x - 10 : pl.x - atkRange),
                    y: isDownAtk ? pl.y + 12 : (isUpAtk ? pl.y - atkRange : pl.y - 15),
                    width: isDownAtk || isUpAtk ? pl.width + 50 : atkRange + 30,
                    height: isDownAtk || isUpAtk ? atkRange + 25 : pl.height + 35
                };
                if (rectIntersect(atkBox, spBox) && sp.hitTimer <= 0) {
                    sp.hp -= 1.0;
                    sp.hitTimer = 16;
                    if (isDownAtk || pl.y + pl.height <= sp.y + 18) {
                        if (typeof triggerPlayerPogoBounce === 'function') {
                            triggerPlayerPogoBounce(pl, sp.y + 4);
                        } else {
                            pl.vy = -16.0;
                            pl.jumps = 1;
                            pl.airDashed = false;
                        }
                    } else {
                        if (typeof playSound === 'function') playSound('slash');
                        if (typeof triggerShake === 'function') triggerShake(4, 7);
                    }
                    if (typeof voidExplosions !== 'undefined') {
                        voidExplosions.push({ x: sp.x + sp.w/2, y: sp.y + sp.h/2, timer: 16, isWhite: true, r: 32 });
                    }
                    break;
                }
            }

            // Death
            if (sp.hp <= 0) {
                if (typeof playSound === 'function') {
                    playSound('rockCrit');
                    playSound('parry');
                }
                if (typeof triggerShake === 'function') triggerShake(7, 12);
                if (typeof voidExplosions !== 'undefined') {
                    voidExplosions.push({ x: sp.x + sp.w/2, y: sp.y + sp.h/2, timer: 24, isWhite: false, isOrange: true, r: 44 });
                }
                storyState.sporeSpitters.splice(i, 1);
            }
        }
    }

    // 3h. Spore Projectiles Update & Blade Deflection!
    if (storyState.sporeProjectiles && storyState.sporeProjectiles.length > 0) {
        for (let i = storyState.sporeProjectiles.length - 1; i >= 0; i--) {
            let spr = storyState.sporeProjectiles[i];
            spr.x += spr.vx;
            spr.y += spr.vy;
            let sprBox = { x: spr.x - spr.r, y: spr.y - spr.r, width: spr.r * 2, height: spr.r * 2 };

            let destroyed = false;

            // Check blade deflection by player melee attacks!
            for (let pl of players) {
                if (!pl || pl.attackTimer <= 0) continue;
                let atkRange = pl.atkRange || 80;
                let isDownAtk = (pl.keys && (checkKeyInput(pl.keys, 'down') || pl.keys.down || isKeyPressed(pl.keys.down))) || (pl.attackType === 'DOWN');
                let isUpAtk = (pl.keys && (checkKeyInput(pl.keys, 'up') || pl.keys.up || isKeyPressed(pl.keys.up))) || (pl.attackType === 'UP');
                let atkBox = {
                    x: isDownAtk || isUpAtk ? pl.x - 25 : (pl.facingRight ? pl.x - 10 : pl.x - atkRange),
                    y: isDownAtk ? pl.y + 12 : (isUpAtk ? pl.y - atkRange : pl.y - 15),
                    width: isDownAtk || isUpAtk ? pl.width + 50 : atkRange + 30,
                    height: isDownAtk || isUpAtk ? atkRange + 25 : pl.height + 35
                };
                if (rectIntersect(atkBox, sprBox) && !spr.isReflected) {
                    // SILK DEFLECT!
                    spr.isReflected = true;
                    spr.vx = (pl.facingRight ? 1 : -1) * 7.5;
                    spr.vy = -1.2;
                    if (isDownAtk) {
                        triggerPlayerPogoBounce(pl, spr.y);
                    }
                    if (typeof playSound === 'function') {
                        playSound('parry');
                        playSound('clash');
                    }
                    if (typeof triggerShake === 'function') triggerShake(3, 6);
                    if (typeof voidExplosions !== 'undefined') {
                        voidExplosions.push({ x: spr.x, y: spr.y, timer: 12, isWhite: true, r: 24 });
                    }
                    break;
                }
            }

            // If reflected: can damage spitters and moss crawlers!
            if (spr.isReflected) {
                if (storyState.sporeSpitters) {
                    for (let sp of storyState.sporeSpitters) {
                        if (rectIntersect({ x: sp.x, y: sp.y, width: sp.w, height: sp.h }, sprBox)) {
                            sp.hp -= 2.0;
                            sp.hitTimer = 16;
                            destroyed = true;
                            if (typeof playSound === 'function') playSound('rockCrit');
                            break;
                        }
                    }
                }
            } else {
                // If unreflected: hits player
                for (let pl of players) {
                    if (pl && !pl.isDowned && pl.invuln <= 0 && rectIntersect(pl, sprBox)) {
                        damagePlayer(1, pl, false, false);
                        destroyed = true;
                        break;
                    }
                }
            }

            if (spr.timer-- <= 0 || destroyed) {
                storyState.sporeProjectiles.splice(i, 1);
            }
        }
    }

    // 4. Vine Barrier in Room 1 (Sketch 1 Red Arrow 🌿: X = 1440, Y = 960..1400)
    // 4. Room 1 Vine Barrier (Sketch 1 Red Arrow 🌿: X = 1420, Y = 960..1400)
    if (!storyState.room1VinesBroken) {
        let vBox = { x: 1410, y: 960, width: 50, height: 440 };
        for (let pl of players) {
            if (pl && pl.attackTimer > 0) {
                let atkRange = pl.atkRange || 75;
                let atkBox = {
                    x: pl.facingRight ? pl.x + pl.width : pl.x - atkRange,
                    y: pl.y,
                    width: atkRange,
                    height: pl.height
                };
                if (rectIntersect(atkBox, vBox)) {
                    storyState.room1VinesBroken = true;
                    let vPlat = platforms.find(p => p.isVineBarrier);
                    if (vPlat) vPlat.solid = false;
                    autoSaveStoryProgress();
                    if (typeof playSound === 'function') {
                        playSound('slash');
                        playSound('bladeSpin');
                    }
                    if (typeof triggerShake === 'function') triggerShake(5, 10);
                    break;
                }
            }
        }
    }

    // 5. Room 1 Secret Wall (Sketch 1 Pink Arrow 🧱: X = 2120, Y = 1520..1650)
    if (!storyState.room1SecretWallBroken) {
        let wBox = { x: 2110, y: 1520, width: 55, height: 130 };
        for (let pl of players) {
            if (pl && pl.attackTimer > 0) {
                let atkRange = pl.atkRange || 75;
                let atkBox = {
                    x: pl.facingRight ? pl.x + pl.width : pl.x - atkRange,
                    y: pl.y,
                    width: atkRange,
                    height: pl.height
                };
                if (rectIntersect(atkBox, wBox) && (!pl.prevWallHitTime || Date.now() - pl.prevWallHitTime > 300)) {
                    pl.prevWallHitTime = Date.now();
                    storyState.room1SecretWallHp = (storyState.room1SecretWallHp || 2) - 1;
                    if (typeof playSound === 'function') playSound('parry');
                    if (typeof triggerShake === 'function') triggerShake(5, 10);
                    if (storyState.room1SecretWallHp <= 0) {
                        storyState.room1SecretWallBroken = true;
                        storyState.secretRoomAnnounce = 160;
                        let wPlat = platforms.find(p => p.isSecretWall);
                        if (wPlat) wPlat.solid = false;
                        autoSaveStoryProgress();
                        if (typeof playSound === 'function') {
                            playSound('groundSlam');
                            playSound('lightChime');
                        }
                        if (typeof triggerShake === 'function') triggerShake(8, 16);
                        if (typeof voidExplosions !== 'undefined') {
                            voidExplosions.push({ x: 2125, y: 1585, timer: 25, isWhite: true, r: 40 });
                        }
                    }
                    break;
                }
            }
        }
    }

    // 6. Room 2 Shortcut Wall (Sketch 2 Red Arrow: X = 8680, Y = 1360..1540)
    if (!storyState.room2OneWayBroken) {
        let owBox = { x: 8650, y: 1360, width: 70, height: 180 };
        for (let pl of players) {
            if (pl && pl.attackTimer > 0) {
                let atkRange = pl.atkRange || 75;
                let atkBox = {
                    x: pl.facingRight ? pl.x + pl.width : pl.x - atkRange,
                    y: pl.y,
                    width: atkRange,
                    height: pl.height
                };
                if (rectIntersect(atkBox, owBox) && (!pl.prevOneWayHitTime || Date.now() - pl.prevOneWayHitTime > 250)) {
                    pl.prevOneWayHitTime = Date.now();
                    storyState.room2OneWayWallHp = 0;
                    storyState.room2OneWayBroken = true;
                    let owPlat = platforms.find(p => p.isOneWayWall);
                    if (owPlat) owPlat.solid = false;
                    autoSaveStoryProgress();
                    if (typeof playSound === 'function') playSound('groundSlam');
                    if (typeof triggerShake === 'function') triggerShake(8, 16);
                    if (typeof showStoryBanner === 'function') showStoryBanner("💥 Проход открыт!");
                    break;
                }
            }
        }
    }

    // 7. Dew Flask pickup on pedestal inside Secret Room (X = 2300, Y = 1600)
    if (!storyState.flaskDewCollected && storyState.room1SecretWallBroken) {
        let fBox = { x: 2280, y: 1570, width: 45, height: 50 };
        for (let pl of players) {
            if (pl && rectIntersect(pl, fBox)) {
                storyState.flaskDewCollected = true;
                addStoryBackpackItem({
                    id: 'flask_dew',
                    name: 'Флакон с «Росой»',
                    icon: '🧪',
                    count: 1,
                    desc: 'Восстанавливает 2 ❤️ всей команде при использовании.'
                });
                if (typeof playSound === 'function') {
                    playSound('lightChime');
                    playSound('absorb');
                }
                flashAlpha = 0.5;
                break;
            }
        }
    }

    // 8. Dash Scroll pickup in Room 2 central tunnel (X = 8950, Y = 1480)
    if (!storyState.dashScrollCollected) {
        let sBox = { x: 8930, y: 1460, width: 50, height: 50 };
        for (let pl of players) {
            if (pl && rectIntersect(pl, sBox)) {
                storyState.dashScrollCollected = true;
                addStoryBackpackItem({
                    id: 'dash_scroll',
                    name: 'Свиток Рывка',
                    icon: '📜',
                    isScroll: true,
                    desc: 'Энергетический свиток света. Активируйте на скамейке у костра!'
                });
                if (typeof playSound === 'function') {
                    playSound('lightChime');
                    playSound('parry');
                }
                flashAlpha = 0.6;
                break;
            }
        }
    }

    // 9. Room Transitions (Room 1 exit pit -> Room 2 ceiling drop, Room 2 left arch -> Room 1 bottom corridor)
    let p1 = players[0];
    if (p1 && storyState.currentRoom === 1 && p1.x >= 2325 && p1.x <= 2520 && p1.y >= 1930 && !storyState.roomTransitioning) {
        startStoryRoomTransition(2);
    }
    if (p1 && storyState.currentRoom === 2 && p1.x <= 8270 && p1.y >= 1350 && p1.y <= 1550 && !storyState.roomTransitioning) {
        startStoryRoomTransition(1);
    }
    if (storyState.roomTransitioning) {
        updateStoryRoomTransitionStep();
    }
}

function updateStoryScrollRitual() {
    let r = storyState.scrollRitual;
    if (!r) {
        storyState.step = 'BENCH_REST';
        return;
    }
    r.timer++;

    for (let pl of players) {
        if (pl) { pl.vx = 0; pl.vy = 0; }
    }

    let pLeader = players[0];
    let atkPressed = (pLeader && pLeader.keys && checkKeyInput(pLeader.keys, 'attack')) ||
        keys['KeyX'] || keys['KeyZ'] || keys['Space'] || keys['Enter'] ||
        keys['KeyF'] || keys['KeyE'] || keys['ч'] || keys['я'] ||
        (typeof touchInputs !== 'undefined' && touchInputs && touchInputs.atk);

    let healPressed = (pLeader && pLeader.keys && checkKeyInput(pLeader.keys, 'heal')) ||
        keys['KeyA'] || keys['KeyF'] || keys['KeyQ'] || keys['KeyE'] || keys['Space'] || keys['Enter'] ||
        keys['KeyZ'] || keys['KeyX'] || keys['KeyC'] ||
        keys['а'] || keys['А'] || keys['ф'] || keys['Ф'] || keys['й'] || keys['у'] ||
        (typeof touchInputs !== 'undefined' && touchInputs && touchInputs.heal);

    if (r.stage === 'PROMPT_ATTACK') {
        if (atkPressed && r.timer > 5) {
            if (pLeader && pLeader.keys) clearKeyInput(pLeader.keys, 'attack');
            keys['KeyX'] = false;
            keys['Space'] = false;
            keys['Enter'] = false;
            if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.atk = false;

            r.stuckWeapon = true;
            r.stage = 'PROMPT_HEAL';
            r.timer = 0;
            if (typeof playSound === 'function') {
                playSound('slash');
                playSound('parry');
            }
            if (typeof triggerShake === 'function') triggerShake(6, 12);
            if (typeof voidExplosions !== 'undefined') {
                voidExplosions.push({ x: 1500, y: 848, timer: 20, isWhite: true, r: 40 });
            }
        }
    } else if (r.stage === 'PROMPT_HEAL') {
        if (healPressed && r.timer > 5) {
            if (pLeader && pLeader.keys) clearKeyInput(pLeader.keys, 'heal');
            keys['KeyA'] = false;
            keys['KeyF'] = false;
            keys['KeyQ'] = false;
            keys['KeyE'] = false;
            keys['Space'] = false;
            keys['Enter'] = false;
            keys['а'] = false;
            keys['А'] = false;
            keys['ф'] = false;
            keys['Ф'] = false;
            if (typeof touchInputs !== 'undefined' && touchInputs) touchInputs.heal = false;

            r.stage = 'LIGHT_ERUPTION';
            r.timer = 0;
            flashAlpha = 1.0;
            if (typeof playSound === 'function') {
                playSound('lightChime');
                playSound('absorb');
            }
            if (typeof triggerShake === 'function') triggerShake(8, 16);
        }
    } else if (r.stage === 'LIGHT_ERUPTION') {
        if (r.timer >= 80) {
            r.stage = 'ANNOUNCEMENT';
            r.timer = 0;
            storyState.dashUnlocked = true;
            storyState.dashMaster = r.hero;
            if (storyState.backpack) {
                let idx = storyState.backpack.findIndex(it => it && it.id === 'dash_scroll');
                if (idx !== -1) storyState.backpack.splice(idx, 1);
            }
            updateStoryTouchUIVisibility();
            if (typeof playSound === 'function') playSound('lightChime');
        }
    } else if (r.stage === 'ANNOUNCEMENT') {
        if (r.timer > 30) {
            let confirmKey = isKeyPressed(['Space', 'Enter', 'KeyZ', 'KeyX', 'KeyC', 'Escape']) || 
                             (typeof touchInputs !== 'undefined' && touchInputs && (touchInputs.jump || touchInputs.atk || touchInputs.dash));
            if (confirmKey) {
                finishScrollRitual();
            }
        }
    }
}

function updateStoryDeathFadeOut() {
    storyState.deathTimer = (storyState.deathTimer || 0) + 1;
    storyState.deathFadeAlpha = Math.min(1.0, (storyState.deathFadeAlpha || 0) + 0.045);

    for (let pl of players) {
        if (pl) { pl.vx = 0; pl.vy = 0; }
    }

    if (storyState.deathFadeAlpha >= 1.0) {
        if (storyState.deathTimer >= 36) {
            respawnPlayerAtStoryCheckpoint();
            storyState.deathTimer = 0;
            storyState.step = 'BENCH_REST';
            storyState.stepTimer = 0;
            storyState.deathFadeAlpha = 0;
            if (typeof playSound === 'function') playSound('lightChime');
        }
    }
}

function startStoryRoomTransition(targetRoom) {
    storyState.roomTransitioning = true;
    storyState.targetRoom = targetRoom;
    storyState.roomFadeTimer = 0;
    storyState.roomFadeAlpha = 0.05;
    for (let pl of players) {
        if (pl) { pl.vx = 0; pl.vy = 0; }
    }
}
window.startStoryRoomTransition = startStoryRoomTransition;

function updateStoryRoomTransitionStep() {
    storyState.roomFadeTimer = (storyState.roomFadeTimer || 0) + 1;
    if (storyState.roomFadeTimer <= 16) {
        storyState.roomFadeAlpha = Math.min(1.0, storyState.roomFadeTimer / 16);
    } else if (storyState.roomFadeTimer === 17) {
        if (storyState.targetRoom === 2) {
            // Silksong-style transition: Drop down into Room 2 from the top ceiling shaft!
            storyState.currentRoom = 2;
            for (let idx = 0; idx < players.length; idx++) {
                let pl = players[idx];
                if (!pl) continue;
                pl.x = 9400 - idx * 22;
                pl.y = 660; // Inside top vertical shaft!
                pl.vx = 0;
                pl.vy = 5;  // Falling downward with momentum
                pl.invuln = 90;
                pl.isDowned = false;
                pl.lastSafeX = pl.x;
                pl.lastSafeY = 1120 - pl.height;
            }
            camX = 9390 - GAME_WIDTH / 2;
            camY = 560;
            if (typeof playSound === 'function') playSound('fall');
        } else {
            // Metroidvania seamless corridor return: enter Room 1 Bottom Tier from connecting shaft!
            storyState.currentRoom = 1;
            for (let idx = 0; idx < players.length; idx++) {
                let pl = players[idx];
                if (!pl) continue;
                pl.x = 2220 + (idx === 0 ? 0 : (idx === 1 ? -28 : 28));
                pl.y = 1950 - (pl.height || 45);
                pl.vx = 0;
                pl.vy = 0;
                pl.facingRight = false; // facing left into the room towards climbing shafts
                pl.invuln = 60;
                pl.isDowned = false;
                pl.downedTimer = 0;
                pl.lastSafeX = pl.x;
                pl.lastSafeY = pl.y;
            }
            camX = 2220 - GAME_WIDTH / 2;
            camY = 1950 - GAME_HEIGHT / 2;
            if (typeof playSound === 'function') playSound('step');
        }
    } else if (storyState.roomFadeTimer <= 34) {
        storyState.roomFadeAlpha = Math.max(0, 1.0 - (storyState.roomFadeTimer - 17) / 17);
    } else {
        storyState.roomTransitioning = false;
        storyState.roomFadeAlpha = 0;
    }
}

function drawStoryRoom1AndRoom2World() {
    if (!ctx) return;
    ctx.save();

    // 1. Spikes rendering (Sunken pits with jagged obsidian stalagmites matching sketches!)
    for (let sp of STORY_SPIKES) {
        if (sp.x < camX - 100 || sp.x > camX + GAME_WIDTH + 100) continue;
        // Sunken dark pit trough
        ctx.fillStyle = "#030712";
        ctx.fillRect(sp.x - 2, sp.y, sp.w + 4, sp.h + 8);
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sp.x - 2, sp.y, sp.w + 4, sp.h + 8);

        // Jagged crystal obsidian thorns
        let toothW = 12;
        let count = Math.floor(sp.w / toothW);
        for (let t = 0; t < count; t++) {
            let tx = sp.x + t * toothW;
            let tipH = 15 + ((t * 7) % 5);
            ctx.fillStyle = "#0f172a";
            ctx.beginPath();
            ctx.moveTo(tx, sp.y + sp.h);
            ctx.lineTo(tx + toothW / 2, sp.y - tipH);
            ctx.lineTo(tx + toothW, sp.y + sp.h);
            ctx.closePath();
            ctx.fill();

            // Gleaming silver sharp spine
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(tx, sp.y + sp.h);
            ctx.lineTo(tx + toothW / 2, sp.y - tipH);
            ctx.stroke();

            // Dangerous ruby gleam on tip
            ctx.fillStyle = "#f43f5e";
            ctx.beginPath();
            ctx.arc(tx + toothW / 2, sp.y - tipH + 2, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 2. Room 1 Vine Barrier (Sketch 1 Red Arrow 🌿: X = 1420, Y = 960..1400)
    if (!storyState.room1VinesBroken) {
        let vx = 1420, vy = 960, vw = 30, vh = 440;
        ctx.save();
        ctx.fillStyle = "rgba(10, 40, 20, 0.95)";
        ctx.fillRect(vx, vy, vw, vh);

        // Twisted winding jungle ivy strands
        for (let i = 0; i < 6; i++) {
            let lx = vx + 3 + i * 5;
            ctx.strokeStyle = (i % 2 === 0) ? "#15803d" : "#22c55e";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(lx, vy);
            for (let y = vy; y <= vy + vh; y += 24) {
                let sway = Math.sin(Date.now() / 250 + i * 1.5 + y * 0.05) * 4;
                ctx.lineTo(lx + sway, y);
            }
            ctx.stroke();
        }

        // Hanging moss leaves
        ctx.fillStyle = "#4ade80";
        for (let y = vy + 15; y < vy + vh - 10; y += 28) {
            ctx.beginPath();
            ctx.ellipse(vx + 6, y, 6, 3, 0.4, 0, Math.PI * 2);
            ctx.ellipse(vx + 22, y + 12, 6, 3, -0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Crimson spores drifting from vines (matching red arrow!)
        let t = Date.now() / 200;
        ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
        for (let s = 0; s < 4; s++) {
            let sx = vx + 15 + Math.sin(t + s * 2) * 8;
            let sy = vy + 20 + ((t * 24 + s * 45) % (vh - 30));
            ctx.beginPath();
            ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 2b. PITCH-BLACK DARKNESS SHROUD BEHIND VINES (Cannot see through walls/vines!)
        ctx.save();
        ctx.fillStyle = "#020617";
        ctx.fillRect(1040, 960, 380, 480); // Pitch black covering area behind vines (X: 1040..1420, Y: 960..1440)
        ctx.restore();
    }

    // 3. Room 1 Secret Wall & Secret Room (Sketch 1 Pink Arrow 🧱: X = 2120, Y = 1520..1650)
    if (!storyState.room1SecretWallBroken) {
        let wx = 2120, wy = 1520, ww = 30, wh = 130;
        ctx.save();
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.fillRect(wx, wy, ww, wh);
        ctx.strokeRect(wx, wy, ww, wh);

        // Deep jagged stone fissures
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(wx + 8, wy);
        ctx.lineTo(wx + 20, wy + 35);
        ctx.lineTo(wx + 10, wy + 70);
        ctx.lineTo(wx + 22, wy + wh);
        ctx.moveTo(wx + 20, wy + 35);
        ctx.lineTo(wx + 28, wy + 55);
        ctx.stroke();

        // Glowing rose/pink crystal veins in the cracks (matching pink arrow!)
        let glowPulse = 0.55 + 0.35 * Math.sin(Date.now() / 260);
        ctx.strokeStyle = `rgba(244, 114, 182, ${glowPulse})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#f472b6";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(wx + 8, wy + 2);
        ctx.lineTo(wx + 20, wy + 35);
        ctx.lineTo(wx + 10, wy + 70);
        ctx.lineTo(wx + 22, wy + wh - 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // 3b. PITCH-BLACK DARKNESS SHROUD INSIDE SECRET ROOM (Cannot see through secret wall!)
        ctx.save();
        ctx.fillStyle = "#020617";
        ctx.fillRect(2120, 1495, 360, 180); // Pitch black covering secret room X: 2120..2480, Y: 1495..1675
        ctx.restore();
    } else {
        // Shattered stone rubble at wall base
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(2120, 1640, 18, 10);
        ctx.fillRect(2135, 1643, 14, 7);
    }

    // 4. Room 1 Secret Room Pedestal & Dew Flask Pickup (inside Secret Room at X = 2300, Y = 1600)
    if (storyState.room1SecretWallBroken) {
        // Ancient carved pedestal in center of Secret Room
        ctx.save();
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(2282, 1622, 36, 28, [4, 4, 0, 0]);
        ctx.fill();
        ctx.stroke();

        // Glowing emerald crystal cluster hanging from Secret Room ceiling
        ctx.fillStyle = "#22c55e";
        ctx.shadowColor = "#4ade80";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(2340, 1524); ctx.lineTo(2346, 1542); ctx.lineTo(2352, 1524);
        ctx.moveTo(2350, 1524); ctx.lineTo(2358, 1548); ctx.lineTo(2364, 1524);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Dew Flask resting on pedestal
        if (!storyState.flaskDewCollected) {
            let fx = 2300, fy = 1604 + Math.sin(Date.now() / 250) * 3;
            ctx.save();
            ctx.shadowColor = "#4ade80";
            ctx.shadowBlur = 16;
            ctx.fillStyle = "#22c55e";
            ctx.beginPath();
            ctx.roundRect(fx - 10, fy - 14, 20, 22, 6);
            ctx.fill();
            ctx.fillStyle = "#fef08a";
            ctx.fillRect(fx - 4, fy - 20, 8, 6);
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "#86efac";
            ctx.fillText("🧪 Роса", fx, fy - 26);
            ctx.restore();
        }
    }

    // 5. Room 2 One-Way Shortcut Wall (Sketch 2 Red Arrow: X = 8680, Y = 1360..1540)
    // 5. Room 2 Chamber Entrance Archway & Shortcut Passage (X = 8670, Y = 1360..1540)
    let owx = 8670, owy = 1360, oww = 38, owh = 180;
    ctx.save();
    // Ancient stone portal frame pillars
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2.0;
    ctx.fillRect(owx - 4, owy, 10, owh);
    ctx.fillRect(owx + oww - 6, owy, 10, owh);
    ctx.strokeRect(owx - 4, owy, 10, owh);
    ctx.strokeRect(owx + oww - 6, owy, 10, owh);

    if (!storyState.room2OneWayBroken) {
        // Unbroken: Massive visible cracked ancient stone slab with glowing fissures
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(owx + 6, owy, oww - 12, owh);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(owx + 12, owy + 20); ctx.lineTo(owx + 22, owy + 70);
        ctx.lineTo(owx + 10, owy + 115); ctx.lineTo(owx + 24, owy + 160);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💥 Разрушаемая стена", owx + oww / 2, owy + 90);
    } else {
        // Broken: Open portal with crumbling stone debris and rubble at the threshold
        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 1.2;
        // Rubble stone chunks on floor
        ctx.beginPath();
        ctx.roundRect(owx - 2, owy + owh - 10, 14, 10, 2);
        ctx.roundRect(owx + 16, owy + owh - 7, 10, 7, 2);
        ctx.roundRect(owx + oww - 4, owy + owh - 12, 12, 12, 3);
        ctx.fill();
        ctx.stroke();

        // Soft emerald moss creeping onto rubble
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(owx - 1, owy + owh - 11, 8, 2);
        ctx.fillRect(owx + 18, owy + owh - 8, 6, 2);
    }

    // Chamber ambient teal glow (revealing the interior, NO black shroud!)
    let chamberGlow = ctx.createLinearGradient(owx, owy + 90, owx + 300, owy + 90);
    chamberGlow.addColorStop(0, "rgba(56, 189, 248, 0.08)");
    chamberGlow.addColorStop(1, "transparent");
    ctx.fillStyle = chamberGlow;
    ctx.fillRect(owx + 10, owy + 10, 600, 160);
    ctx.restore();

    // 6. Room 2 Dash Scroll Pickup (Sketch 2 White Arrow: X = 8950, Y = 1480)
    if (!storyState.dashScrollCollected) {
        let sx = 8950, sy = 1480 + Math.sin(Date.now() / 200) * 5;
        ctx.save();
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 22;

        ctx.strokeStyle = "rgba(0, 229, 255, 0.7)";
        ctx.lineWidth = 2;
        let rot = Date.now() / 200;
        ctx.beginPath();
        ctx.arc(sx, sy, 22, rot, rot + Math.PI * 1.3);
        ctx.stroke();

        ctx.fillStyle = "#fef08a";
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(sx - 14, sy - 9, 28, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#00e5ff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("📜 Свиток Рывка", sx, sy - 28);
        ctx.restore();
    }

    // 7. Moss Crawlers (Мховички)
    if (storyState.mossCrawlers) {
        for (let mc of storyState.mossCrawlers) {
            ctx.save();
            ctx.translate(mc.x + mc.w / 2, mc.y + mc.h / 2);
            if (!mc.facingRight) ctx.scale(-1, 1);

            let flash = (mc.hitTimer > 0);
            ctx.fillStyle = flash ? "#ffffff" : "#15803d";
            ctx.strokeStyle = "#166534";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -2, 16, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = flash ? "#ffffff" : "#4ade80";
            ctx.beginPath();
            ctx.arc(-5, -12, 4, 0, Math.PI * 2);
            ctx.arc(4, -13, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#f43f5e";
            ctx.beginPath();
            ctx.arc(0, -18, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = flash ? "#ffffff" : "#1e293b";
            ctx.fillRect(-14, -2, 28, 10);

            let legWalk = Math.sin(Date.now() / 80) * 3;
            ctx.strokeStyle = "#0f172a";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 8); ctx.lineTo(-12 + legWalk, 13);
            ctx.moveTo(-2, 8); ctx.lineTo(-2 - legWalk, 13);
            ctx.moveTo(6, 8); ctx.lineTo(6 + legWalk, 13);
            ctx.moveTo(12, 8); ctx.lineTo(14 - legWalk, 13);
            ctx.stroke();

            ctx.fillStyle = "#020617";
            ctx.beginPath();
            ctx.arc(9, 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(10, 1.2, 1, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // 7b. Silk Flies (Шёлковые мошки - парят над пропастями для пого-прыжков)
    drawStorySilkFlies();

    // 7c. Spore Spitters & Spore Projectiles (Споровые плевуны)
    drawStorySporeSpitters();

    // 7d. Interactive Grass & Falling Leaves in Room 1 and Room 2
    drawStoryGrassBlades();

    // 8. Air Dash Waves
    for (let w of airDashWaves) {
        ctx.save();
        ctx.translate(w.x + w.w / 2, w.y + w.h / 2);
        if (w.dir < 0) ctx.scale(-1, 1);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
        ctx.fillStyle = "rgba(125, 211, 252, 0.45)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 16, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // 9. Scroll Ritual in World Space
    if (storyState.step === 'SCROLL_RITUAL' && storyState.scrollRitual) {
        let r = storyState.scrollRitual;
        let rx = 1500, ry = 848;

        ctx.save();
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#fef08a";
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(rx - 15, ry - 6, 30, 14, 4);
        ctx.fill();
        ctx.stroke();

        if (r.stuckWeapon) {
            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(-0.4);
            let wColor = (r.hero === 'WATER' ? '#38bdf8' : (r.hero === 'AIR' ? '#facc15' : '#4ade80'));
            ctx.strokeStyle = wColor;
            ctx.lineWidth = 3.5;
            ctx.shadowColor = wColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -32);
            ctx.stroke();

            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-6, -26);
            ctx.lineTo(6, -26);
            ctx.moveTo(0, -26);
            ctx.lineTo(0, -36);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = "#00e5ff";
            for (let i = 0; i < 4; i++) {
                let spX = rx + Math.sin(Date.now() / 60 + i) * 14;
                let spY = ry - 10 - ((Date.now() / 40 + i * 20) % 25);
                ctx.beginPath();
                ctx.arc(spX, spY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (r.stage === 'LIGHT_ERUPTION') {
            for (let pl of players) {
                if (!pl) continue;
                ctx.strokeStyle = "rgba(0, 229, 255, 0.8)";
                ctx.lineWidth = 3;
                ctx.shadowColor = "#00e5ff";
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.lineTo(pl.x + pl.width / 2, pl.y + pl.height / 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

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

// Draw Water Guardian Mini-Boss (Unique, majestic elemental titan appearance)
function drawStoryGuardianObj(g) {
    if (!ctx) return;
    ctx.save();
    let gx = g.x;
    let gy = g.y;
    let gh = g.h || 72;
    let gw = g.w || 46;
    let feetY = gy + gh;
    let dir = g.facingRight ? 1 : -1;
    let now = Date.now();
    let t = now * 0.003;

    // 1. Water Ripple & Fluid Ground Aura
    ctx.save();
    let auraGrad = ctx.createRadialGradient(gx, feetY - 2, 4, gx, feetY - 2, 42);
    auraGrad.addColorStop(0, "rgba(56, 189, 248, 0.45)");
    auraGrad.addColorStop(0.5, "rgba(2, 132, 199, 0.25)");
    auraGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(gx, feetY - 2, 44 + Math.sin(t * 1.5) * 3, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Small water ripples expanding
    let ripR = ((now * 0.04) % 36);
    let ripAlpha = Math.max(0, 1 - ripR / 36) * 0.5;
    ctx.strokeStyle = `rgba(56, 189, 248, ${ripAlpha})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(gx, feetY - 2, ripR, ripR * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Flowing Elemental Water Cloak / Tendrils (waves behind body)
    ctx.save();
    let cloakGrad = ctx.createLinearGradient(gx, gy + 18, gx, feetY);
    cloakGrad.addColorStop(0, "rgba(14, 165, 233, 0.85)");
    cloakGrad.addColorStop(0.5, "rgba(3, 105, 161, 0.65)");
    cloakGrad.addColorStop(1, "rgba(2, 132, 199, 0.2)");
    ctx.fillStyle = cloakGrad;

    let waveOffset1 = Math.sin(t * 2.2) * 8;
    let waveOffset2 = Math.cos(t * 1.8) * 10;
    ctx.beginPath();
    let cAnchorX = gx - dir * 10;
    let cAnchorY = gy + 22;
    ctx.moveTo(cAnchorX, cAnchorY);
    ctx.quadraticCurveTo(cAnchorX - dir * 26 + waveOffset1, gy + 45, cAnchorX - dir * 32 + waveOffset2, feetY);
    ctx.lineTo(cAnchorX - dir * 14 + waveOffset2 * 0.5, feetY);
    ctx.quadraticCurveTo(cAnchorX - dir * 8 + waveOffset1 * 0.5, gy + 45, cAnchorX + dir * 6, cAnchorY + 6);
    ctx.closePath();
    ctx.fill();

    // Ethereal water cape highlights
    ctx.strokeStyle = "rgba(186, 230, 253, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cAnchorX, cAnchorY);
    ctx.quadraticCurveTo(cAnchorX - dir * 26 + waveOffset1, gy + 45, cAnchorX - dir * 32 + waveOffset2, feetY);
    ctx.stroke();
    ctx.restore();

    // 3. Heavy Oceanic Armored Legs & Greaves
    ctx.save();
    ctx.fillStyle = "#0c4a6e";
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2;

    // Left leg
    ctx.beginPath();
    ctx.roundRect(gx - 16, gy + 45, 12, 27, 4);
    ctx.fill();
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.roundRect(gx + 4, gy + 45, 12, 27, 4);
    ctx.fill();
    ctx.stroke();

    // Spiked armored greaves / boots
    ctx.fillStyle = "#075985";
    ctx.fillRect(gx - 18, feetY - 8, 16, 8);
    ctx.fillRect(gx + 2, feetY - 8, 16, 8);
    // Cyan knee runes
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(gx - 14, gy + 48, 8, 3);
    ctx.fillRect(gx + 6, gy + 48, 8, 3);
    ctx.restore();

    // 4. Massive Knightly Chestplate & Luminous Water Core
    ctx.save();
    let bodyGrad = ctx.createLinearGradient(gx - 20, gy + 16, gx + 20, gy + 46);
    bodyGrad.addColorStop(0, "#082f49");
    bodyGrad.addColorStop(0.5, "#0369a1");
    bodyGrad.addColorStop(1, "#075985");
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(gx - 20, gy + 16, 40, 32, 6);
    ctx.fill();
    ctx.stroke();

    // Armored belt
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(gx - 18, gy + 42, 36, 6);
    ctx.strokeStyle = "#38bdf8";
    ctx.strokeRect(gx - 18, gy + 42, 36, 6);

    // Glowing Central Water Droplet Core (Heart)
    let coreGrad = ctx.createRadialGradient(gx, gy + 28, 1, gx, gy + 28, 9);
    coreGrad.addColorStop(0, "#ffffff");
    coreGrad.addColorStop(0.4, "#38bdf8");
    coreGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(gx, gy + 28, 8, 0, Math.PI * 2);
    ctx.fill();

    // Water core droplet symbol
    ctx.fillStyle = "#e0f2fe";
    ctx.beginPath();
    ctx.moveTo(gx, gy + 23);
    ctx.quadraticCurveTo(gx + 5, gy + 28, gx, gy + 32);
    ctx.quadraticCurveTo(gx - 5, gy + 28, gx, gy + 23);
    ctx.fill();
    ctx.restore();

    // 5. Crystalline Spiked Pauldrons (Shoulders)
    ctx.save();
    ctx.fillStyle = "#075985";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    // Back shoulder
    let sBackX = gx - dir * 18;
    ctx.beginPath();
    ctx.moveTo(sBackX, gy + 20);
    ctx.lineTo(sBackX - dir * 10, gy + 10);
    ctx.lineTo(sBackX, gy + 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front shoulder
    let sFrontX = gx + dir * 18;
    ctx.beginPath();
    ctx.moveTo(sFrontX, gy + 20);
    ctx.lineTo(sFrontX + dir * 12, gy + 8);
    ctx.lineTo(sFrontX, gy + 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 6. Water Elemental Helm & Magnificent Antler-like Water Horns
    ctx.save();
    let helmX = gx;
    let helmY = gy + 10;

    // Horns (4 grand curved fluid ice-horns sweeping back and up!)
    let hornGrad = ctx.createLinearGradient(helmX, helmY, helmX - dir * 30, helmY - 30);
    hornGrad.addColorStop(0, "#0284c7");
    hornGrad.addColorStop(0.6, "#38bdf8");
    hornGrad.addColorStop(1, "#e0f2fe");
    ctx.strokeStyle = hornGrad;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    // Primary Upper Horn
    ctx.beginPath();
    ctx.moveTo(helmX - dir * 3, helmY - 6);
    ctx.quadraticCurveTo(helmX - dir * 16, helmY - 24, helmX - dir * 28 + Math.sin(t * 2) * 2, helmY - 26);
    ctx.stroke();

    // Secondary Lower Horn
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(helmX - dir * 6, helmY);
    ctx.quadraticCurveTo(helmX - dir * 20, helmY - 10, helmX - dir * 26 + Math.cos(t * 2) * 2, helmY - 14);
    ctx.stroke();

    // Front Crest Horn
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(helmX + dir * 6, helmY - 8);
    ctx.quadraticCurveTo(helmX + dir * 4, helmY - 18, helmX - dir * 12, helmY - 22);
    ctx.stroke();

    // Helm skull base
    ctx.fillStyle = "#0c4a6e";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(helmX, helmY, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Horizontal Visor Slit
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(helmX - 9 + dir * 2, helmY - 2, 14, 5);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 12;
    ctx.fillRect(helmX - 7 + dir * 3, helmY - 1, 10, 3);
    // Ethereal eye light beam trail
    ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(helmX + dir * 6, helmY);
    ctx.lineTo(helmX + dir * 18, helmY - 2 + Math.sin(t * 3) * 1.5);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // 7. Ancient Crystalline Water Glaive / Great Halberd
    ctx.save();
    let wX = gx + dir * 22;
    let wY = gy + 28;
    let isAttacking = (g.state === 'SLASH' || g.state === 'SLASH_WARN');

    if (g.state === 'SLASH_WARN') {
        // Windup telegraph: bright cyan rotating aura and water ring
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        let arcStart = dir > 0 ? -1.0 : Math.PI - 0.4;
        let arcEnd = dir > 0 ? 0.4 : Math.PI + 1.0;
        ctx.arc(gx, gy + 32, 60, arcStart, arcEnd);
        ctx.stroke();

        ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
        ctx.beginPath();
        ctx.moveTo(gx, gy + 32);
        ctx.arc(gx, gy + 32, 60, arcStart, arcEnd);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Halberd Shaft
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (g.state === 'SLASH') {
        ctx.moveTo(wX - dir * 10, wY + 28);
        ctx.lineTo(wX + dir * 32, wY - 28);
    } else {
        ctx.moveTo(wX, wY + 36);
        ctx.lineTo(wX, wY - 42);
    }
    ctx.stroke();

    // Halberd Crescent Water Blade
    let tipX = (g.state === 'SLASH') ? (wX + dir * 32) : wX;
    let tipY = (g.state === 'SLASH') ? (wY - 28) : (wY - 42);

    let bGrad = ctx.createRadialGradient(tipX, tipY, 4, tipX, tipY, 32);
    bGrad.addColorStop(0, "#ffffff");
    bGrad.addColorStop(0.35, "#38bdf8");
    bGrad.addColorStop(0.75, "#0284c7");
    bGrad.addColorStop(1, "rgba(2, 132, 199, 0)");

    ctx.fillStyle = bGrad;
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = isAttacking ? 22 : 10;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY - 22);
    ctx.quadraticCurveTo(tipX + dir * 26, tipY, tipX, tipY + 18);
    ctx.quadraticCurveTo(tipX + dir * 8, tipY, tipX, tipY - 22);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dynamic water slash wave particle arc when slashing!
    if (g.state === 'SLASH') {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(gx, gy + 30, 56, dir > 0 ? -0.8 : Math.PI - 0.6, dir > 0 ? 0.6 : Math.PI + 0.8);
        ctx.stroke();
    }
    ctx.restore();

    // 8. Hit Flash Effect (translucent cyan-white silhouette on damage)
    if (g.hitFlash > 0) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.roundRect(gx - gw / 2 - 4, gy - 6, gw + 8, gh + 10, 10);
        ctx.fill();
        ctx.restore();
    }

    // 9. Majestic Water Projectiles (Dual Swirling Hydro-Spheres)
    if (g.waterProjectiles) {
        for (let pr of g.waterProjectiles) {
            ctx.save();
            let prGrad = ctx.createRadialGradient(pr.x, pr.y, 1, pr.x, pr.y, 10);
            prGrad.addColorStop(0, "#ffffff");
            prGrad.addColorStop(0.4, "#38bdf8");
            prGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
            ctx.fillStyle = prGrad;
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(pr.x, pr.y, 9, 0, Math.PI * 2);
            ctx.fill();

            // Swirling water orbit ring
            ctx.strokeStyle = "rgba(224, 242, 254, 0.8)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(pr.x, pr.y, 12, 5, t * 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // 10. Epic Boss Name & Status Bar
    ctx.save();
    let barW = 110;
    let barH = 7;
    let bx = gx - barW / 2;
    let by = gy - 36;
    let hpRatio = Math.max(0, g.hp / g.maxHp);

    // Title banner
    ctx.fillStyle = "#38bdf8";
    ctx.shadowColor = "#0284c7";
    ctx.shadowBlur = 6;
    ctx.font = "bold 10px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🌊 ХРАНИТЕЛЬ ВОДНЫХ ГЛУБИН", gx, by - 6);
    ctx.shadowBlur = 0;

    // Outer frame
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(bx - 1, by - 1, barW + 2, barH + 2, 4);
    ctx.fill();
    ctx.stroke();

    // HP Fill gradient
    let hpGrad = ctx.createLinearGradient(bx, by, bx + barW, by);
    hpGrad.addColorStop(0, "#0284c7");
    hpGrad.addColorStop(0.5, "#38bdf8");
    hpGrad.addColorStop(1, "#bae6fd");
    ctx.fillStyle = hpGrad;
    ctx.beginPath();
    ctx.roundRect(bx, by, barW * hpRatio, barH, 3);
    ctx.fill();

    // Divider pips for each HP point
    ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
    ctx.lineWidth = 1;
    for (let p = 1; p < g.maxHp; p++) {
        let px = bx + (barW * p) / g.maxHp;
        ctx.beginPath();
        ctx.moveTo(px, by);
        ctx.lineTo(px, by + barH);
        ctx.stroke();
    }
    ctx.restore();

    // 11. Dialogue Bubble
    if (g.dialogueTimer > 0 && g.dialogue) {
        ctx.save();
        ctx.font = "bold 12px sans-serif";
        let bw = ctx.measureText(g.dialogue).width + 32;
        let bX = gx - bw / 2;
        let bY = gy - 74;

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "#0284c7";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(bX, bY, bw, 26, 6);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#e0f2fe";
        ctx.textAlign = "center";
        ctx.fillText(g.dialogue, gx, bY + 17);
        ctx.restore();
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

    // Timur: "убери подсказки после встречи с землей"
    if (!storyState.earthMet) {
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
                let inTrialsNow = (typeof storyState !== 'undefined' && storyState.inTrials) || (typeof storyTrials !== 'undefined' && storyTrials.active);
                if (inTrialsNow) break;
                if (p) {
                    if (Math.abs(p.x - STORY_CONFIG.BENCH_X) < 85 && Math.abs(p.y - (STORY_CONFIG.FLOOR - 50)) < 75) {
                        promptText = `✦ ${getDownPrompt()} — присесть на скамейку у костра (или идите направо к воде и паркуру →)`;
                    } else if (p.x > 3750 && p.y > 100 && p.y < 460) {
                        promptText = "✦ Заберитесь по зелёным моховым платформам наверх ↑ (снизу сквозь них прыгнуть нельзя!)";
                    } else if (p.y < 40 && !storyState.airMet) {
                        promptText = "✦ Идите налево по верхнему ярусу ← (навстречу новому союзнику 💨)";
                    } else if (p.y < 40 && storyState.airMet) {
                        promptText = "✦ Воздух 💨 в команде! Идите налево до края ← и прыгайте вместе вниз в обрыв!";
                    } else if (p.y > 600 && !storyState.earthMet) {
                        promptText = "✦ Идите направо по подземелью → (там вас ждёт Земля 🌿)";
                    } else if (p.x < 3500) {
                        promptText = "✦ Демон скрыт. Идите направо к костру и паркуру над водой →";
                    }
                }
                break;
            case 'BENCH_REST':
                promptText = "🔥 Отдых у костра (Сохранено ✓) • [Tab] Рюкзак/Карта | [Пробел] Выбор героев | [Движение] Встать | [Esc] Меню";
                break;
        }
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

    let inTrialsGlobal = (typeof storyState !== 'undefined' && storyState.inTrials) || (typeof storyTrials !== 'undefined' && storyTrials.active);
    if (promptText && !inTrialsGlobal && !storyState.earthMet) {
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

    // Universal Story Dialogue & Ancient Ritual Cutscene on top of screen
    drawAncientRitual();
    drawStoryDialogue();
}

// Click/Tap on the prompt banner during BENCH_REST or Dialogue advancing
if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', (e) => {
        if (!storyState.active) return;

        // Advance dialogue on screen tap
        if (storyDialogue.active) {
            advanceStoryDialogue();
            return;
        }

        // Dismiss ritual black screen card on tap
        if (storyRitual.active && storyRitual.phase === 'BLACK_SCREEN' && storyRitual.blackScreenTimer > 40) {
            finishAncientRitual();
            return;
        }

        // Advance / finish Energy Scroll Ritual on tap
        if (storyState.step === 'SCROLL_RITUAL' && storyState.scrollRitual) {
            let r = storyState.scrollRitual;
            if (r.stage === 'PROMPT_ATTACK' && r.timer > 15) {
                r.stuckWeapon = true;
                r.stage = 'PROMPT_HEAL';
                r.timer = 0;
                updateStoryTouchUIVisibility();
                if (typeof playSound === 'function') {
                    playSound('slash');
                    playSound('parry');
                }
                if (typeof triggerShake === 'function') triggerShake(6, 12);
                if (typeof voidExplosions !== 'undefined') {
                    voidExplosions.push({ x: 1500, y: 848, timer: 20, isWhite: true, r: 40 });
                }
                return;
            } else if (r.stage === 'PROMPT_HEAL' && r.timer > 15) {
                r.stage = 'LIGHT_ERUPTION';
                r.timer = 0;
                flashAlpha = 1.0;
                updateStoryTouchUIVisibility();
                if (typeof playSound === 'function') {
                    playSound('lightChime');
                    playSound('absorb');
                }
                if (typeof triggerShake === 'function') triggerShake(8, 16);
                return;
            } else if (r.stage === 'ANNOUNCEMENT' && r.timer > 20) {
                finishScrollRitual();
                return;
            }
        }

        if (storyState.step !== 'BENCH_REST' || storyState.stepTimer <= 25) return;
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

    // Teleport party into the expanded arena chamber (X = 4800..6300, Y = 470..870)
    if (players[0]) {
        players[0].x = 4960; players[0].y = 850 - 50;
        players[0].vx = 0; players[0].vy = 0;
        players[0].lastSafeX = 4960; players[0].lastSafeY = 800;
        players[0].facingRight = true;
    }
    if (players[1]) {
        players[1].x = 4900; players[1].y = 850 - 50;
        players[1].vx = 0; players[1].vy = 0;
        players[1].lastSafeX = 4900; players[1].lastSafeY = 800;
        players[1].facingRight = true;
    }
    if (players[2]) {
        players[2].x = 4840; players[2].y = 850 - 50;
        players[2].vx = 0; players[2].vy = 0;
        players[2].lastSafeX = 4840; players[2].lastSafeY = 800;
        players[2].facingRight = true;
    }

    camX = 4800;
    camY = 470;

    storyState.inTrials = true;
    storyState.guardianDefeated = true;
    storyState.comboUnlocked = true;
    storyState.currentRoom = 0;
    storyTrials.active = true;
    storyTrials.state = 'WAITING_FOR_CENTER';
    storyTrials.stage = 0;
    storyTrials.warnings = 0;
    storyTrials.trialsCleared = false;
    storyTrials.introTimer = 0;
    storyTrials.centerReadyTimer = 0;
    storyTrials.inCenterCount = 0;
    storyState.trialsWeaponGranted = true;
    for (let pl of players) {
        if (pl) { pl.waterDropActive = false; pl.waterDrop = null; }
    }
    platforms.filter(p => p.isTrialsArenaWall).forEach(p => p.solid = true);

    // Ensure maze platforms are inactive initially
    let mb1 = platforms.find(p => p.isMazeBase1);
    let mb2 = platforms.find(p => p.isMazeBase2);
    let mr = platforms.find(p => p.isMazeRoof);
    if (mb1) mb1.solid = false;
    if (mb2) mb2.solid = false;
    if (mr) mr.solid = false;

    storyTrials.announcement = "";
    storyTrials.announcementTimer = 0;
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
            { id: 1, x: 5750, y: 850, vx: 0, vy: 0, hp: 5, maxHp: 5, width: 30, height: 50, facingRight: false, state: 'WALK', strikeTimer: 0, strikeCooldown: 50, hitFlash: 0 },
            { id: 2, x: 6100, y: 850, vx: 0, vy: 0, hp: 5, maxHp: 5, width: 30, height: 50, facingRight: false, state: 'WALK', strikeTimer: 0, strikeCooldown: 70, hitFlash: 0 }
        ];
    } else if (stageNum === 2) {
        storyTrials.announcement = "ЭТАП 2: ЛАБИРИНТ И МИШЕНЬ";
        storyTrials.announcementColor = "#38bdf8";
        storyTrials.announcementTimer = 180;
        storyTrials.mazeWallBroken = false;
        storyTrials.mazeTargetHit = false;
        storyTrials.mazeDropGuide = null;
        playSound('breakStone');
        triggerShake(5, 8);
        for (let k = 0; k < 15; k++) {
            storyTrials.particles.push({
                x: 5550 + (Math.random() - 0.5) * 200,
                y: 530 + Math.random() * 50,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3,
                color: "#64748b",
                size: 3 + Math.random() * 3,
                timer: 40
            });
        }
        storyTrials.mannequins = [
            { id: 3, x: 6050, y: 850, vx: 0, vy: 0, hp: 5, maxHp: 5, width: 30, height: 50, facingRight: false, state: 'WALK', strikeTimer: 0, strikeCooldown: 50, hitFlash: 0 }
        ];
    } else if (stageNum === 3) {
        storyTrials.announcement = "ЭТАП 3: СКОРОСТНЫЕ МИШЕНИ (10 СЕКУНД)";
        storyTrials.announcementColor = "#f59e0b";
        storyTrials.announcementTimer = 180;
        storyTrials.targetTimer = 600; // 10 sec @ 60 FPS
        storyTrials.targets = [
            { id: 1, x: 4920, y: 815, r: 16, hp: 1 },
            { id: 2, x: 5050, y: 690, r: 16, hp: 1 },
            { id: 3, x: 5550, y: 495, r: 16, hp: 1 },
            { id: 4, x: 6050, y: 690, r: 16, hp: 1 },
            { id: 5, x: 6180, y: 815, r: 16, hp: 1 }
        ];
    } else if (stageNum === 4) {
        storyTrials.announcement = "ЭТАП 4: ИСПЫТАТЕЛЬНЫЙ ДЕМОН";
        storyTrials.announcementColor = "#c084fc";
        storyTrials.announcementTimer = 200;
        storyTrials.demon = {
            x: 6050,
            y: 850 - 80,
            vx: 0,
            vy: 0,
            width: 50,
            height: 80,
            hp: 10,
            maxHp: 10,
            facingRight: false,
            state: 'STAND', // STAND, WALK, WINDUP_LEAP, LEAP, SLAM, RECOVER, WINDUP_POWER, POWER_WAVE, TELEPORT_OUT, TELEPORT_IN
            stateTimer: 60,
            attackCooldown: 170,
            teleportCooldown: 140,
            teleportTargetX: 6050,
            tiedTimer: 0,
            interruptedTimer: 0,
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
        storyTrials.announcement = "🏆 ДЕМОН ПОВЕРЖЕН! ПРОХОД В ДРЕВНИЙ ЗАЛ СИЛЫ ОТКРЫТ! ▶";
        storyTrials.announcementColor = "#38bdf8";
        storyTrials.announcementTimer = 320;
        playSound('bladeSpin');
        playSound('lightChime');
        platforms.filter(p => p.isTrialsArenaWall && p.x > 6000).forEach(p => { p.solid = false; p.isWall = false; });
    }
}

function updateStoryTrials() {
    if (!storyTrials.active) return;
    storyTrials.stageTimer++;

    // Ensure passage to Chamber of Ancient Power remains open
    if (storyTrials.trialsCleared) {
        platforms.filter(p => p.isTrialsArenaWall && p.x > 6000).forEach(p => { p.solid = false; p.isWall = false; });
    }

    if (storyTrials.announcementTimer > 0) storyTrials.announcementTimer--;
    if (storyTrials.noticeTimer > 0) storyTrials.noticeTimer--;

    // 0. Waiting for party to step into the central runic arena (X = 5550, Y = 850)
    if (storyTrials.state === 'WAITING_FOR_CENTER') {
        storyTrials.introTimer = (storyTrials.introTimer || 0) + 1;
        let livingHeroes = players.filter(pl => pl && pl.hp > 0);
        let leader = players[0];
        let leaderInCenter = leader && Math.abs(leader.x - 5550) < 180 && leader.y >= 750;
        let inCenterCount = livingHeroes.filter(pl => Math.abs(pl.x - 5550) < 180 && pl.y >= 750).length;
        storyTrials.inCenterCount = inCenterCount;

        let readyToStart = (leaderInCenter && (inCenterCount >= Math.min(2, livingHeroes.length))) || (storyTrials.introTimer >= 40) || (leader && leader.x >= 5300);
        if (readyToStart) {
            storyTrials.centerReadyTimer = (storyTrials.centerReadyTimer || 0) + 1;
            if (storyTrials.centerReadyTimer >= 10) {
                storyTrials.centerReadyTimer = 0;
                storyTrials.state = 'IN_STAGE';
                storyState.trialsWeaponGranted = true;
                playSound('lightChime');
                playSound('slash');
                triggerShake(8, 14);
                for (let k = 0; k < 25; k++) {
                    storyTrials.particles.push({
                        x: 5500 + (Math.random() - 0.5) * 80, y: 845,
                        vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 7 - 2,
                        color: Math.random() < 0.5 ? "#fde047" : "#38bdf8",
                        size: 3 + Math.random() * 4, timer: 45
                    });
                }
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
                m.x = Math.max(4850, Math.min(6250, m.x));

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
        } else if (m.state === 'TIED') {
            m.vx = 0;
            m.strikeTimer--;
            if (m.strikeTimer <= 0) {
                m.state = 'WALK';
                m.strikeCooldown = 40;
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
                if (dist < 8) {
                    dg.idx++;
                    if (dg.idx >= dg.points.length) {
                        // Reached Target!
                        storyTrials.mazeTargetHit = true;
                        playSound('lightChime');
                        playSound('bladeSpin');
                        triggerShake(8, 14);
                        // Retract maze platforms so nobody is obstructed
                        let mb1 = platforms.find(p => p.isMazeBase1);
                        let mb2 = platforms.find(p => p.isMazeBase2);
                        let mr = platforms.find(p => p.isMazeRoof);
                        if (mb1) mb1.solid = false;
                        if (mb2) mb2.solid = false;
                        if (mr) mr.solid = false;
                        for (let k = 0; k < 18; k++) {
                            storyTrials.particles.push({
                                x: 5550,
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

        // Boss Contact Damage (входной урон: 1.0, отключен во время телепортации)
        if (d.state !== 'TELEPORT_OUT' && d.state !== 'TELEPORT_IN') {
            for (let pl of players) {
                if (pl && pl.hp > 0 && pl.invuln <= 0) {
                    let dBox = { x: d.x - 30, y: d.y, width: 60, height: 85 };
                    let plBox = { x: pl.x, y: pl.y, width: pl.width, height: pl.height };
                    if (rectIntersect(dBox, plBox)) {
                        takeDamage(pl, 1.0, true, true);
                        pl.invuln = 45;
                        pl.vx = d.facingRight ? 9 : -9;
                        pl.vy = -4;
                        triggerVibration('damage');
                    }
                }
            }
        }

        // Boss Shockwaves (Attack 1 ground slam shockwave: 1.5 damage)
        for (let i = d.shockwaves.length - 1; i >= 0; i--) {
            let sw = d.shockwaves[i];
            sw.x += sw.vx;
            sw.timer--;
            let swBox = { x: sw.x - 25, y: 850 - 40, width: 50, height: 40 };
            for (let pl of players) {
                if (pl && pl.hp > 0 && pl.invuln <= 0 && rectIntersect(swBox, pl)) {
                    takeDamage(pl, 1.5, true, true);
                    pl.invuln = 45;
                    pl.vy = -8;
                    triggerVibration('damage');
                }
            }
            if (sw.timer <= 0 || sw.x < 4800 || sw.x > 6300) {
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
            if (pw.timer <= 0 || pw.x < 4800 || pw.x > 6300) {
                d.powerWaves.splice(i, 1);
            }
        }

        if (d.hitFlash > 0) d.hitFlash--;
        if (d.attackCooldown > 0) d.attackCooldown--;
        if (d.teleportCooldown > 0) d.teleportCooldown--;
        if (d.interruptedTimer > 0) d.interruptedTimer--;

        if (d.tiedTimer > 0) {
            d.tiedTimer--;
            d.vx = 0;
            // Bound by air trap: completely immobilized and vulnerable!
        } else if (d.state === 'STAND') {
            d.vx = 0;
            d.stateTimer--;
            if (d.stateTimer <= 0) {
                d.state = 'WALK';
                d.stateTimer = 55 + Math.floor(Math.random() * 25);
            }
        } else if (d.state === 'RECOVER') {
            d.vx = 0;
            d.stateTimer--;
            if (d.stateTimer <= 0) {
                d.state = 'STAND';
                d.stateTimer = 40 + Math.floor(Math.random() * 20);
                d.vx = 0;
            }
        } else if (d.state === 'WALK') {
            if (nearestPl) {
                d.vx = d.facingRight ? 1.1 : -1.1; // Slow, heavy giant walk speed
                d.x += d.vx;
                d.x = Math.max(4850, Math.min(6250, d.x));
            }
            d.stateTimer--;

            // 1. Demonic Teleportation (repositioning & flanking)
            let atEdge = (d.x < 4940 || d.x > 6180);
            if ((d.teleportCooldown <= 0 || atEdge) && Math.random() < 0.35 && nearestPl) {
                d.teleportCooldown = 220 + Math.floor(Math.random() * 60);
                d.state = 'TELEPORT_OUT';
                d.stateTimer = 26;
                d.vx = 0;
                let flankDir = (nearestPl.x > 5500) ? -1 : 1;
                d.teleportTargetX = Math.max(4920, Math.min(6200, nearestPl.x + flankDir * 240));
                playSound('heatIgnite');
                triggerShake(4, 7);
            } else if (d.attackCooldown <= 0 && nearestPl) {
                d.attackCooldown = 160 + Math.floor(Math.random() * 25); // 160-185 frames cooldown
                // Alternate between Leap Attack and Demon Power Wave
                if (Math.random() < 0.5) {
                    d.state = 'WINDUP_LEAP';
                    d.stateTimer = 48; // Leap windup: 48 frames (~0.8s)
                    d.vx = 0;
                } else {
                    d.state = 'WINDUP_POWER';
                    d.stateTimer = 44;
                    d.vx = 0;
                }
            } else if (d.stateTimer <= 0) {
                // Regular pause between walks: stand still menacingly
                d.state = 'STAND';
                d.stateTimer = 50 + Math.floor(Math.random() * 25);
                d.vx = 0;
            }
        } else if (d.state === 'TELEPORT_OUT') {
            d.vx = 0;
            d.stateTimer--;
            if (Math.random() < 0.45) {
                storyTrials.particles.push({
                    x: d.x + (Math.random() - 0.5) * 35,
                    y: d.y + Math.random() * 70,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -Math.random() * 4 - 2,
                    color: Math.random() < 0.5 ? "#7e22ce" : "#e11d48",
                    size: 3.5 + Math.random() * 3,
                    timer: 24
                });
            }
            if (d.stateTimer <= 0) {
                d.state = 'TELEPORT_IN';
                d.stateTimer = 30;
                playSound('heatIgnite');
            }
        } else if (d.state === 'TELEPORT_IN') {
            d.vx = 0;
            d.stateTimer--;
            if (Math.random() < 0.6) {
                storyTrials.particles.push({
                    x: d.teleportTargetX + (Math.random() - 0.5) * 45,
                    y: (850 - 80) + Math.random() * 70,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3 - 1,
                    color: Math.random() < 0.5 ? "#c084fc" : "#f43f5e",
                    size: 3 + Math.random() * 3,
                    timer: 20
                });
            }
            if (d.stateTimer <= 0) {
                d.x = d.teleportTargetX;
                d.y = 850 - 80;
                d.state = 'STAND';
                d.stateTimer = 38; // Brief recovery after appearing
                playSound('breakStone');
                playSound('slash');
                triggerShake(6, 12);
                for (let k = 0; k < 16; k++) {
                    storyTrials.particles.push({
                        x: d.x + (Math.random() - 0.5) * 40,
                        y: d.y + 40 + (Math.random() - 0.5) * 40,
                        vx: (Math.random() - 0.5) * 8,
                        vy: -Math.random() * 6 - 1,
                        color: Math.random() < 0.5 ? "#a855f7" : "#ef4444",
                        size: 4 + Math.random() * 3,
                        timer: 25
                    });
                }
            }
        } else if (d.state === 'WINDUP_LEAP') {
            d.vx = 0;
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

                // 1.5 damage slam under boss
                let slamBox = { x: d.x - 40, y: 850 - 50, width: 80, height: 50 };
                for (let pl of players) {
                    if (pl && pl.hp > 0 && pl.invuln <= 0 && rectIntersect(slamBox, pl)) {
                        takeDamage(pl, 1.5, true, true);
                        pl.invuln = 45;
                        pl.vy = -7;
                    }
                }

                // Shockwaves racing left and right at reduced speed 4.5
                d.shockwaves.push({ x: d.x - 20, vx: -4.5, timer: 100 });
                d.shockwaves.push({ x: d.x + 20, vx: 4.5, timer: 100 });
            }
        } else if (d.state === 'SLAM') {
            d.vx = 0;
            d.stateTimer--;
            if (d.stateTimer <= 0) {
                // Extended vulnerable recovery after heavy ground slam!
                d.state = 'RECOVER';
                d.stateTimer = 65;
                d.vx = 0;
            }
        } else if (d.state === 'WINDUP_POWER') {
            d.vx = 0;
            d.stateTimer--;
            if (d.stateTimer <= 0) {
                d.state = 'POWER_WAVE';
                d.stateTimer = 25;
                playSound('heatIgnite');
                triggerShake(6, 12);
                let pDir = d.facingRight ? 1 : -1;
                d.powerWaves.push({ x: d.x + pDir * 30, y: 850 - 45, vx: pDir * 7.5, vy: 0, timer: 85 });
                d.powerWaves.push({ x: d.x + pDir * 30, y: 850 - 75, vx: pDir * 6.5, vy: -0.6, timer: 85 });
            }
        } else if (d.state === 'POWER_WAVE') {
            d.vx = 0;
            d.stateTimer--;
            if (d.stateTimer <= 0) {
                // Extended vulnerable recovery after power wave!
                d.state = 'RECOVER';
                d.stateTimer = 50;
                d.vx = 0;
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

    let isBlue = (typeof storyState !== 'undefined' && storyState.bluePowerUnlocked);
    let normalDmg = 0.75;
    let demonDmg = 0.75;
    if (attacker.type === 'EARTH') {
        normalDmg = isBlue ? ((attacker.attackType === 'EARTH_SPRINT_STRIKE') ? 1.25 : 0.75) : ((attacker.attackType === 'EARTH_SPRINT_STRIKE') ? 0.75 : 0.5);
        demonDmg = isBlue ? ((attacker.attackType === 'EARTH_SPRINT_STRIKE') ? 1.5 : 1.0) : ((attacker.attackType === 'EARTH_SPRINT_STRIKE') ? 0.75 : 0.5);
    } else if (attacker.type === 'AIR') {
        normalDmg = isBlue ? 1.0 : 0.75;
        demonDmg = isBlue ? 1.35 : 0.75;
    } else if (attacker.type === 'WATER') {
        normalDmg = isBlue ? 1.0 : 0.75;
        demonDmg = isBlue ? 1.2 : 0.75;
    }

    // 1. Mannequins
    for (let m of storyTrials.mannequins) {
        let mBox = { x: m.x - 18, y: m.y - 50, width: 36, height: 50 };
        if (rectIntersect(swordHitbox, mBox)) {
            m.hp -= normalDmg;
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
        let wallBox = { x: 5510, y: 700, width: 80, height: 35 };
        if (rectIntersect(swordHitbox, wallBox)) {
            storyTrials.mazeWallBroken = true;
            playSound('breakStone');
            triggerShake(6, 10);
            for (let k = 0; k < 18; k++) {
                storyTrials.particles.push({
                    x: 5550,
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

    // 2b. Stage 2: Direct hit on Maze Target once wall is broken
    if (storyTrials.stage === 2 && storyTrials.mazeWallBroken && !storyTrials.mazeTargetHit) {
        let tBox = { x: 5550 - 22, y: 565 - 22, width: 44, height: 44 };
        if (rectIntersect(swordHitbox, tBox)) {
            storyTrials.mazeTargetHit = true;
            playSound('bladeSpin');
            playSound('parry');
            playSound('lightChime');
            triggerShake(7, 12);
            let mb1 = platforms.find(p => p.isMazeBase1);
            let mb2 = platforms.find(p => p.isMazeBase2);
            let mr = platforms.find(p => p.isMazeRoof);
            if (mb1) mb1.solid = false;
            if (mb2) mb2.solid = false;
            if (mr) mr.solid = false;
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
        let dBox = { x: d.x - 30, y: d.y, width: 60, height: 85 };
        if (rectIntersect(swordHitbox, dBox)) {
            d.hp -= demonDmg;
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
        let wallBox = { x: 5510, y: 700, width: 80, height: 35 };
        if (rectIntersect(hitBox, wallBox)) {
            storyTrials.mazeWallBroken = true;
            playSound('breakStone');
            playSound('waterSplash');
            triggerShake(6, 10);
            return true;
        }
    }

    // Stage 2: Entrance to the maze channel (only after wall broken) or direct target hit
    if (storyTrials.stage === 2 && storyTrials.mazeWallBroken && !storyTrials.mazeTargetHit) {
        let directTBox = { x: 5550 - 20, y: 565 - 20, width: 40, height: 40 };
        if (rectIntersect(hitBox, directTBox)) {
            storyTrials.mazeTargetHit = true;
            playSound('bladeSpin');
            playSound('parry');
            playSound('lightChime');
            triggerShake(7, 12);
            let mb1 = platforms.find(p => p.isMazeBase1);
            let mb2 = platforms.find(p => p.isMazeBase2);
            let mr = platforms.find(p => p.isMazeRoof);
            if (mb1) mb1.solid = false;
            if (mb2) mb2.solid = false;
            if (mr) mr.solid = false;
            return true;
        }
        if (drop.x >= 5510 && drop.x <= 5590 && drop.y >= 695 && drop.y <= 745) {
            storyTrials.mazeDropGuide = {
                drop: drop,
                owner: p,
                idx: 0,
                points: [
                    { x: 5550, y: 715 },
                    { x: 5550, y: 685 },
                    { x: 5470, y: 685 },
                    { x: 5470, y: 620 },
                    { x: 5630, y: 620 },
                    { x: 5630, y: 565 },
                    { x: 5550, y: 565 }
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
        let dBox = { x: d.x - 30, y: d.y, width: 60, height: 85 };
        if (rectIntersect(hitBox, dBox)) {
            let isBlue = (typeof storyState !== 'undefined' && storyState.bluePowerUnlocked);
            d.hp -= isBlue ? 1.2 : 0.75;
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

    // Stage 2: Breakable wall hit by Air trap
    if (storyTrials.stage === 2 && !storyTrials.mazeWallBroken) {
        let wallBox = { x: 5510, y: 700, width: 80, height: 35 };
        if (rectIntersect(pBox, wallBox)) {
            storyTrials.mazeWallBroken = true;
            playSound('breakStone');
            playSound('trap');
            triggerShake(6, 10);
            return true;
        }
    }

    // Stage 2: Maze Target hit by Air trap once wall is broken
    if (storyTrials.stage === 2 && storyTrials.mazeWallBroken && !storyTrials.mazeTargetHit) {
        let tBox = { x: 5550 - 20, y: 565 - 20, width: 40, height: 40 };
        if (rectIntersect(pBox, tBox)) {
            storyTrials.mazeTargetHit = true;
            playSound('bladeSpin');
            playSound('parry');
            playSound('lightChime');
            triggerShake(7, 12);
            let mb1 = platforms.find(p => p.isMazeBase1);
            let mb2 = platforms.find(p => p.isMazeBase2);
            let mr = platforms.find(p => p.isMazeRoof);
            if (mb1) mb1.solid = false;
            if (mb2) mb2.solid = false;
            if (mr) mr.solid = false;
            return true;
        }
    }

    for (let m of storyTrials.mannequins) {
        let mBox = { x: m.x - 18, y: m.y - 50, width: 36, height: 50 };
        if (rectIntersect(pBox, mBox)) {
            let isBlue = (typeof storyState !== 'undefined' && storyState.bluePowerUnlocked);
            m.hp -= isBlue ? 1.0 : 0.75;
            m.hitFlash = 16;
            // BIND THE MANNEQUIN WITH AIR TRAP!
            m.state = 'TIED';
            m.strikeTimer = 85;
            m.tiedTimer = 85;
            m.vx = 0;
            playSound('hitBoss');
            playSound('trap');
            for (let k = 0; k < 8; k++) {
                storyTrials.particles.push({
                    x: m.x,
                    y: m.y - 25,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    color: "#00ffff",
                    size: 3 + Math.random() * 3,
                    timer: 24
                });
            }
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

        // 1. Air trap dispels Demon shockwaves on contact!
        for (let i = d.shockwaves.length - 1; i >= 0; i--) {
            let sw = d.shockwaves[i];
            let swBox = { x: sw.x - 25, y: 850 - 40, width: 50, height: 40 };
            if (rectIntersect(pBox, swBox)) {
                d.shockwaves.splice(i, 1);
                playSound('parry');
                playSound('trap');
                triggerShake(3, 6);
                for (let k = 0; k < 10; k++) {
                    storyTrials.particles.push({
                        x: sw.x,
                        y: 850 - 20,
                        vx: (Math.random() - 0.5) * 6,
                        vy: -Math.random() * 4 - 1,
                        color: "#00ffff",
                        size: 3 + Math.random() * 3,
                        timer: 22
                    });
                }
                return true;
            }
        }

        // 2. Air trap hits Demon: INTERRUPTS WINDUP & BINDS!
        let dBox = { x: d.x - 30, y: d.y, width: 60, height: 85 };
        if (rectIntersect(pBox, dBox) && d.state !== 'TELEPORT_IN') {
            let isBlue = (typeof storyState !== 'undefined' && storyState.bluePowerUnlocked);
            d.hp -= isBlue ? 1.35 : 0.75;
            d.hitFlash = 16;

            // INTERRUPT ATTACK / TELEPORT WINDUP!
            let wasWindingUp = (d.state === 'WINDUP_LEAP' || d.state === 'WINDUP_POWER' || d.state === 'TELEPORT_OUT');
            if (wasWindingUp) {
                d.state = 'STAND';
                d.stateTimer = 90;
                d.vx = 0;
                d.interruptedTimer = 60; // Triggers "💨 ЗАМАХ СБИТ ЛОВУШКОЙ!" notification
                playSound('parry');
                triggerShake(7, 12);
            }

            d.tiedTimer = 90; // Bind Demon for 90 frames (1.5 seconds)!
            playSound('hitBoss');
            playSound('trap');
            for (let k = 0; k < 12; k++) {
                storyTrials.particles.push({
                    x: d.x,
                    y: d.y + 40,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    color: "#00ffff",
                    size: 3.5 + Math.random() * 3,
                    timer: 28
                });
            }
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
            return { x: 5550, y: 720 };
        }
        if (storyTrials.mannequins.length > 0) {
            let m = storyTrials.mannequins[0];
            return { x: m.x, y: m.y - 25 };
        }
        return { x: 5550, y: 565 };
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
        return { x: storyTrials.demon.x, y: storyTrials.demon.y + 40 };
    }

    return null;
}

// Smart & Adaptive Companion AI during Trials (Learns from damage, dodges windups, uses ledges & traps)
function runStoryTrialsCompanionAI(p, inp, requestJump) {
    if (!storyTrials || !storyTrials.active) return inp;

    if (!p.trialAi) {
        p.trialAi = {
            attackCooldown: 0,
            jumpCooldown: 0,
            dodgeCooldown: 0,
            caution: 0,         // Increments on taking damage (0..5)
            lastHp: p.hp,
            evadeTimer: 0,
            preferredLedge: (p.type === 'AIR') ? (Math.random() < 0.5 ? 5180 : 5680) : null
        };
    }
    let st = p.trialAi;
    if (st.attackCooldown > 0) st.attackCooldown--;
    if (st.jumpCooldown > 0) st.jumpCooldown--;
    if (st.dodgeCooldown > 0) st.dodgeCooldown--;
    if (st.evadeTimer > 0) st.evadeTimer--;

    // Adaptive Learning from mistakes: when companion takes damage, caution increases!
    if (p.hp < st.lastHp) {
        st.caution = Math.min(5, st.caution + 1);
        st.evadeTimer = 32; // Immediate reactive disengagement
        st.lastHp = p.hp;
    } else {
        st.lastHp = p.hp;
    }

    // 0. Active Party Entry into Arena: Bots boldly advance forward towards the center!
    if (storyTrials.state === 'WAITING_FOR_CENTER') {
        let leader = players[0];
        let targetX = (p === players[1]) ? 5510 : 5590;
        if (leader && leader.x > 5300) {
            targetX = (p === players[1]) ? (leader.x - 35) : (leader.x + 35);
        }
        let dx = targetX - p.x;
        if (Math.abs(dx) > 12) {
            if (dx > 0) inp.right = true; else inp.left = true;
        }
        return inp;
    }

    // Freeze companion controls during story dialogue or ritual cutscenes
    if (typeof storyDialogue !== 'undefined' && storyDialogue.active) {
        return inp;
    }
    if (typeof storyRitual !== 'undefined' && storyRitual.active && storyRitual.phase !== 'IDLE') {
        return inp;
    }

    // 0.5. TRIALS CLEARED: AI Companions follow Leader into the Chamber of Ancient Power!
    if (storyTrials.trialsCleared) {
        let leader = players.find(pl => !pl.isAi && pl.hp > 0 && !pl.isDowned) || players[0];
        if (leader) {
            let offset = (p.type === 'AIR') ? -65 : -125;
            if (!leader.facingRight) offset = -offset;
            let targetX = leader.x + offset;

            // If leader moves towards or through the right archway (>= 6180), guide companions smoothly through archway!
            if (leader.x >= 6180 && p.x < 6260) {
                targetX = Math.max(targetX, 6340);
            }

            let dx = targetX - p.x;
            let dist = Math.abs(dx);

            if (dist > 25) {
                if (dx > 0) inp.right = true;
                else inp.left = true;

                // Dash / sprint when falling behind
                if (dist > 140 && st.dodgeCooldown <= 0) {
                    inp.dash = true;
                    st.dodgeCooldown = 28;
                }
            } else {
                p.facingRight = leader.facingRight;
            }

            // Jump / climb logic
            let dy = leader.y - p.y;
            if (dy < -35 && p.onGround && st.jumpCooldown <= 0) {
                requestJump(15);
                st.jumpCooldown = 26;
            } else if (Math.abs(p.vx) < 0.25 && dist > 40 && p.onGround && st.jumpCooldown <= 0) {
                requestJump(14);
                st.jumpCooldown = 25;
            }

            // Anti-stuck repositioning: if leader is well into the Chamber (x > 6380) and companion is stuck far behind in arena
            if (leader.x > 6380 && p.x < 6220) {
                p.x = leader.x - (p.type === 'AIR' ? 70 : 130);
                p.y = 800;
                p.vx = 0;
                p.vy = 0;
            }
        }
        return inp;
    }

    // 1. Revive downed ally if possible (only if safe)
    let downedAlly = players.find(pl => pl && pl.id !== p.id && pl.isDowned && pl.hp > 0);
    if (downedAlly && p.hp > 1.0) {
        let dx = downedAlly.x - p.x;
        if (Math.abs(dx) > 20) {
            if (dx > 0) inp.right = true; else inp.left = true;
        } else {
            inp.heal = true;
        }
        return inp;
    }

    // 2. Stage 2: Earth Companion breaks the bottom maze wall!
    if (storyTrials.stage === 2 && p.type === 'EARTH' && !storyTrials.mazeWallBroken) {
        let targetX = 5550;
        let dx = targetX - p.x;
        if (Math.abs(dx) > 22) {
            if (dx > 0) inp.right = true; else inp.left = true;
        } else {
            if (p.onGround && st.jumpCooldown <= 0) {
                requestJump(15);
                st.jumpCooldown = 28;
            }
            inp.up = true;
            if (st.attackCooldown <= 0) {
                inp.attack = true;
                st.attackCooldown = 18;
            }
        }
        return inp;
    }

    // 3. Stage 4: Dodge Demon Boss Leap / Shockwaves
    if (storyTrials.stage === 4 && storyTrials.demon) {
        let d = storyTrials.demon;
        // Boss leaping: immediately dash sideways out of danger!
        if (d.state === 'LEAP' && Math.abs(d.x - p.x) < 160) {
            inp.dash = true;
            if (p.x < d.x) inp.left = true; else inp.right = true;
            return inp;
        }
        // Jump over shockwaves with precision
        for (let sw of d.shockwaves) {
            if (Math.abs(sw.x - p.x) < 80 && st.jumpCooldown <= 0 && p.onGround) {
                requestJump(13);
                st.jumpCooldown = 24;
                break;
            }
        }
    }

    // 4. INTELLIGENT REACTION TO ENEMY WINDUP (⚠️ Замах!)
    // If ANY enemy within 130px is preparing a forward strike, companions react smartly!
    let windingEnemy = storyTrials.mannequins.find(m => m.hp > 0 && m.state === 'WINDUP' && Math.abs(m.x - p.x) < 130);
    if (windingEnemy) {
        let facingMe = (windingEnemy.facingRight && p.x > windingEnemy.x) || (!windingEnemy.facingRight && p.x < windingEnemy.x);
        let dist = Math.abs(windingEnemy.x - p.x);

        if (p.type === 'EARTH') {
            if (facingMe && dist < 85) {
                // If Earth is close (< 45px) with forward momentum: acrobatic vault over enemy!
                if (dist < 45 && p.onGround && st.jumpCooldown <= 0) {
                    requestJump(15);
                    st.jumpCooldown = 28;
                    // Move forward over their head to land behind them!
                    if (windingEnemy.facingRight) inp.right = true; else inp.left = true;
                    return inp;
                } else {
                    // Backstep / dash away out of the 70px slash reach!
                    inp.dash = true;
                    if (windingEnemy.x > p.x) inp.left = true; else inp.right = true;
                    return inp;
                }
            }
        } else if (p.type === 'AIR') {
            // Air skirmisher: immediately disengage to safe distance or elevated ledges!
            if (windingEnemy.x > p.x) inp.left = true; else inp.right = true;
            if (p.onGround && st.jumpCooldown <= 0 && Math.abs(p.y - 800) < 60) {
                requestJump(14);
                st.jumpCooldown = 26;
            }
            // Air throws a binding trap directly at the winding-up enemy to stop the strike!
            if (st.attackCooldown <= 0) {
                inp.attack = true;
                st.attackCooldown = 18;
            }
            return inp;
        }
    }

    // 5. LOW-HP SURVIVAL PROTOCOL (Ensures companion NEVER drops to 1 HP to trigger restart!)
    let isLowHp = (p.hp <= 2.0);
    if (isLowHp) {
        let nearestThreat = storyTrials.mannequins.find(m => m.hp > 0 && Math.abs(m.x - p.x) < 95 && m.state !== 'TIED');
        if (nearestThreat) {
            // Priority: Retreat away and maintain safety!
            inp.dash = true;
            if (nearestThreat.x > p.x) inp.left = true; else inp.right = true;
            if (p.onGround && st.jumpCooldown <= 0) {
                requestJump(13);
                st.jumpCooldown = 24;
            }
            return inp;
        }
    }

    // 6. TACTICAL COMBAT & POSITIONING
    let tiedMannequin = storyTrials.mannequins.find(m => m.hp > 0 && m.state === 'TIED');

    if (p.type === 'AIR') {
        // --- AIR HERO: High-Ground Specialist & Trap Trapper ---
        // Seeks elevated combat ledges (x: 4960 or 5960, y: 720) to rain down traps from safety!
        let targetLedgeX = 5050; // Primary safe high ground for Air!
        let onLedge = (p.y <= 730 && (p.x >= 4940 && p.x <= 5160));

        // IN STAGE 2: "воздух которому туда не надо"!
        // Air stays on the safe perimeter ledge/flank and NEVER pushes into the maze!
        if (storyTrials.stage === 2) {
            if (!onLedge && p.onGround && st.jumpCooldown <= 0) {
                let dxL = targetLedgeX - p.x;
                if (Math.abs(dxL) > 20) {
                    if (dxL > 0) inp.right = true; else inp.left = true;
                } else {
                    requestJump(15);
                    st.jumpCooldown = 32;
                }
            }
            // Air snipes at any enemies from distance up to 650px away
            let airTgt = getNearestStoryTrialTarget(p);
            if (airTgt) {
                let dx = airTgt.x - p.x;
                let dist = Math.hypot(dx, airTgt.y - p.y);
                if (dist <= 650 && st.attackCooldown <= 0) {
                    inp.attack = true;
                    st.attackCooldown = 60 + Math.floor(Math.random() * 15);
                }
            }
            return inp;
        }

        // IN STAGE 4: Dedicated Boss Support & Snipe Positioning
        if (storyTrials.stage === 4 && storyTrials.demon) {
            let d = storyTrials.demon;
            let dx = d.x - p.x;
            let dy = d.y - p.y;
            let dist = Math.hypot(dx, dy);

            // If Demon gets too close (< 180px), Air disengages!
            if (dist < 180) {
                inp.dash = true;
                if (dx > 0) inp.left = true; else inp.right = true;
                if (p.onGround && st.jumpCooldown <= 0) {
                    requestJump(15);
                    st.jumpCooldown = 28;
                }
            } else if (dist > 380) {
                // Move towards Demon to stay in optimal sniping distance!
                if (dx > 0) inp.right = true; else inp.left = true;
            } else {
                // In sweet spot (180..380px): strafe and perform high aero-hops!
                if (p.onGround && Math.random() < 0.08 && st.jumpCooldown <= 0) {
                    requestJump(14);
                    st.jumpCooldown = 32;
                }
            }

            // Rapid-fire binding traps: Air relentlessly peppers the Demon!
            if (dist <= 650 && st.attackCooldown <= 0) {
                inp.attack = true;
                st.attackCooldown = 60 + Math.floor(Math.random() * 15);
            }
            return inp;
        }

        // Other stages: Seek high ground and rain down traps
        if (!onLedge && p.onGround && st.jumpCooldown <= 0 && storyTrials.mannequins.length > 0) {
            let dxL = targetLedgeX - p.x;
            if (Math.abs(dxL) > 20) {
                if (dxL > 0) inp.right = true; else inp.left = true;
            } else {
                requestJump(15);
                st.jumpCooldown = 32;
            }
        }

        let untied = storyTrials.mannequins.find(m => m.hp > 0 && m.state !== 'TIED');
        let airTgt = untied ? { x: untied.x, y: untied.y - 25 } : getNearestStoryTrialTarget(p);

        if (airTgt) {
            let dx = airTgt.x - p.x;
            let dist = Math.hypot(dx, airTgt.y - p.y);

            // Maintain safe distance (180..380px)
            if (dist > 380) {
                if (dx > 0) inp.right = true; else inp.left = true;
            } else if (dist < 130 && !onLedge) {
                if (dx > 0) inp.left = true; else inp.right = true;
            }

            // Throw binding wind trap up to 600px away!
            if (dist <= 600 && st.attackCooldown <= 0) {
                inp.attack = true;
                st.attackCooldown = 20 + Math.floor(Math.random() * 8);
            }
        }

    } else {
        // --- EARTH / MELEE HERO: Agile Dual-Dagger Punisher ---
        if (storyTrials.stage === 4 && storyTrials.demon) {
            let d = storyTrials.demon;
            let dx = d.x - p.x;
            let dist = Math.abs(dx);
            let isDemonTied = (d.tiedTimer > 0);
            let isDemonVulnerable = (d.state === 'RECOVER' || d.state === 'STAND' || isDemonTied);

            if (isDemonVulnerable) {
                // Punish window! Charge in aggressively!
                if (dist > 35) {
                    if (dx > 0) inp.right = true; else inp.left = true;
                    if (dist > 80) inp.dash = true; // Sprint strike!
                }
                if (dist <= 80 && st.attackCooldown <= 0) {
                    inp.attack = true;
                    st.attackCooldown = isDemonTied ? 10 : 16;
                }
            } else {
                // Demon is active / dangerous: keep safe spacing (130..190px)!
                if (dist < 130) {
                    if (dx > 0) inp.left = true; else inp.right = true;
                    inp.dash = true;
                } else if (dist > 200) {
                    if (dx > 0) inp.right = true; else inp.left = true;
                }
            }
            return inp;
        }
        let meleeTgt = tiedMannequin ? { x: tiedMannequin.x, y: tiedMannequin.y - 25 } : getNearestStoryTrialTarget(p);

        if (meleeTgt) {
            let dx = meleeTgt.x - p.x;
            let dy = meleeTgt.y - p.y;
            let dist = Math.hypot(dx, dy);

            // Jump to higher ledge if needed
            if (dy < -35 && Math.abs(dx) < 130 && st.jumpCooldown <= 0 && p.onGround) {
                requestJump(14);
                st.jumpCooldown = 30;
            }

            // Close in for melee strike
            let targetRange = tiedMannequin ? 32 : (36 + st.caution * 6);
            if (Math.abs(dx) > targetRange) {
                if (dx > 0) inp.right = true; else inp.left = true;
                if (tiedMannequin && Math.abs(dx) > 70) inp.dash = true; // Sprint to punish bound enemy!
            }

            // Execute rapid double-dagger strikes
            if (dist <= 75 && st.attackCooldown <= 0) {
                inp.attack = true;
                st.attackCooldown = tiedMannequin ? 12 : (18 + Math.floor(Math.random() * 8));
            }
        }
    }

    return inp;
}

// Draw the entire Trials Arena, Maze, Mannequins, Targets, Demon Boss & HUD
function drawStoryTrials() {
    if (!ctx || !storyTrials || !storyTrials.active) return;
    let now = Date.now();

    // 0. Dedicated Ancient Trials Chamber Backdrop (X: 4800..6300, Y = 430..870)
    ctx.save();
    let bgGrad = ctx.createLinearGradient(4800, 430, 4800, 870);
    bgGrad.addColorStop(0, "#080c14");
    bgGrad.addColorStop(0.5, "#0d1322");
    bgGrad.addColorStop(1, "#141c2e");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(4780, 430, 1540, 440);

    // Stone Pillars in background
    ctx.fillStyle = "#162032";
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    let pilX = [4850, 5050, 5250, 5450, 5650, 5850, 6050, 6250];
    for (let px of pilX) {
        ctx.fillRect(px - 14, 440, 28, 410);
        ctx.strokeRect(px - 14, 440, 28, 410);
    }

    // Glowing Runic Torches
    let torchX = [4950, 5350, 5750, 6150];
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
    ctx.fillRect(4780, 850, 1540, 50);
    ctx.strokeRect(4780, 850, 1540, 50);
    ctx.fillRect(4780, 430, 1540, 25);
    ctx.strokeRect(4780, 430, 1540, 25);
    ctx.fillRect(4780, 440, 25, 420);
    ctx.strokeRect(4780, 440, 25, 420);
    if (!storyTrials.trialsCleared) {
        ctx.fillRect(6295, 440, 25, 420);
        ctx.strokeRect(6295, 440, 25, 420);
    } else {
        // Grand open archway leading directly into the Chamber of Ancient Power
        let ax = 6295;
        ctx.save();

        // 1. Soft atmospheric light pouring into the corridor
        let lightGrad = ctx.createLinearGradient(ax - 70, 640, ax + 130, 640);
        lightGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
        lightGrad.addColorStop(0.35, "rgba(56, 189, 248, 0.08)");
        lightGrad.addColorStop(0.65, "rgba(56, 189, 248, 0.18)");
        lightGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = lightGrad;
        ctx.fillRect(ax - 60, 455, 190, 395);

        // 2. Carved stone archway lintel & upper jambs (overhead only: y = 430..535)
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ax - 20, 430);
        ctx.lineTo(ax + 35, 430);
        ctx.lineTo(ax + 35, 515);
        ctx.quadraticCurveTo(ax + 8, 540, ax - 20, 515);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing runic keystone in the upper arch
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(ax + 8, 475, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ᚱ", ax + 8, 479);

        // Arch side pillars above walking height (y: 435..520)
        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 1.8;
        ctx.fillRect(ax - 12, 440, 14, 80);
        ctx.strokeRect(ax - 12, 440, 14, 80);

        // Floor threshold marker with soft cyan glow (walkway is wide open!)
        let floorGlow = ctx.createRadialGradient(ax + 10, 850, 4, ax + 10, 850, 65);
        floorGlow.addColorStop(0, "rgba(56, 189, 248, 0.4)");
        floorGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = floorGlow;
        ctx.fillRect(ax - 50, 836, 120, 18);

        // 3. Floating passage guide banner
        let bobY = Math.sin(Date.now() * 0.005) * 4;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("✨ ПРОХОД В ЗАЛ СИЛЫ →", ax - 50, 715 + bobY);
        ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
        ctx.font = "11px sans-serif";
        ctx.fillText("Древний сундук ждёт", ax - 50, 733 + bobY);
        ctx.restore();
    }
    ctx.restore();

    // 2. Elevated Arena Battle Ledges
    ctx.save();
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    // Left ledge: X: 4960..5140, Y: 720
    ctx.fillRect(4960, 720, 180, 18);
    ctx.strokeRect(4960, 720, 180, 18);
    // Right ledge: X: 5960..6140, Y: 720
    ctx.fillRect(5960, 720, 180, 18);
    ctx.strokeRect(5960, 720, 180, 18);
    ctx.restore();

    // 2.5 Central Assembly Circle (X = 5550, Y = 850) - Active when assembling party
    if (storyTrials.state === 'WAITING_FOR_CENTER') {
        ctx.save();
        let cx = 5550, cy = 848;
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

        ctx.restore();
    }

    // 3. Stage 2: Overhead Logic Maze (X: 5440 .. 5660, Y: 530 .. 720) - ONLY during Stage 2
    if (storyTrials.stage === 2) {
        ctx.save();
        let mLeft = 5440, mRight = 5660, mTop = 530, mBottom = 720;

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
        ctx.moveTo(5510, mTop); ctx.lineTo(5510, 650);
        // Divider 2 (horizontal across)
        ctx.moveTo(5510, 650); ctx.lineTo(5600, 650);
        // Divider 3 (vertical from bottom up)
        ctx.moveTo(5600, 650); ctx.lineTo(5600, 590);
        // Bottom inner wall
        ctx.moveTo(mLeft, 680); ctx.lineTo(5520, 680);
        ctx.stroke();

        // Bottom Entrance Gap & Breakable Wall
        if (!storyTrials.mazeWallBroken) {
            // Grey Breakable Stone Wall
            ctx.fillStyle = "#64748b";
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 2;
            ctx.fillRect(5520, 714, 60, 16);
            ctx.strokeRect(5520, 714, 60, 16);
            // Cracks
            ctx.strokeStyle = "#334155";
            ctx.beginPath();
            ctx.moveTo(5535, 715); ctx.lineTo(5550, 722); ctx.lineTo(5565, 728);
            ctx.stroke();
            ctx.fillStyle = "#f8fafc";
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🧱 СТЕНА", 5550, 726);
        } else {
            // Open glowing water channel entrance
            ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
            ctx.fillRect(5520, 716, 60, 14);
        }

        // Bullseye Target at (5550, 565)
        let tgtX = 5550, tgtY = 565;
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

    // 5. Training Demonic Mannequins (Articulated Wooden Sparring Dummy with Demon Horns & Target Rune)
    for (let m of storyTrials.mannequins) {
        ctx.save();
        let mx = m.x, my = m.y;
        let dir = m.facingRight ? 1 : -1;
        let walkBob = (m.state === 'WALK') ? Math.sin(now * 0.015 + m.id * 2) * 2.5 : 0;
        let strikeSwing = (m.state === 'STRIKE') ? (m.strikeTimer / 16) : 0;
        let windupTension = (m.state === 'WINDUP') ? (1 - m.strikeTimer / 28) : 0;

        ctx.translate(mx, my + walkBob);

        // Ground shadow
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wooden stand base (tripod mount)
        ctx.fillStyle = "#3e2723";
        ctx.strokeStyle = "#5d4037";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(10, -8); ctx.lineTo(-10, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Central dark-wood pole / post
        ctx.fillStyle = "#4e342e";
        ctx.fillRect(-5, -38, 10, 30);

        // Heavy carved wooden dummy torso
        let torsoGrad = ctx.createLinearGradient(-14, -48, 14, -18);
        torsoGrad.addColorStop(0, "#5d4037");
        torsoGrad.addColorStop(0.5, "#3e2723");
        torsoGrad.addColorStop(1, "#271c19");
        ctx.fillStyle = torsoGrad;
        ctx.strokeStyle = "#8d6e63";
        ctx.lineWidth = 1.5;
        if (ctx.roundRect) {
            ctx.roundRect(-14, -48, 28, 30, 4);
            ctx.fill(); ctx.stroke();
        } else {
            ctx.fillRect(-14, -48, 28, 30);
            ctx.strokeRect(-14, -48, 28, 30);
        }

        // Iron/Brass reinforcement bands on torso
        ctx.fillStyle = "#b45309";
        ctx.fillRect(-14, -43, 28, 3.5);
        ctx.fillRect(-14, -28, 28, 3.5);

        // Target Runemark on chest (Bullseye)
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.arc(0, -34, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(0, -34, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.arc(0, -34, 2, 0, Math.PI * 2); ctx.fill();

        // Wooden Sparring Arms holding practice daggers
        let armAngle = (m.state === 'WINDUP') ? (-0.65 * windupTension * dir) : 
                       ((m.state === 'STRIKE') ? (0.85 * strikeSwing * dir) : (dir * 0.15));
        ctx.save();
        ctx.translate(0, -38);
        ctx.rotate(armAngle);
        // Wooden arm beam
        ctx.fillStyle = "#6d4c41";
        ctx.fillRect(dir > 0 ? -4 : -26, -4, 30, 8);
        // Practice blade
        ctx.fillStyle = "#94a3b8";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (dir > 0) {
            ctx.moveTo(24, -8); ctx.lineTo(40, 0); ctx.lineTo(24, 8);
        } else {
            ctx.moveTo(-24, -8); ctx.lineTo(-40, 0); ctx.lineTo(-24, 8);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();

        // Carved Demonic Training Head / Mask
        ctx.save();
        ctx.translate(0, -56);
        // Wooden head block
        ctx.fillStyle = "#3e2723";
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 1.5;
        ctx.fillRect(-9, -12, 18, 16);
        ctx.strokeRect(-9, -12, 18, 16);
        // Small demonic horns
        ctx.fillStyle = "#7c3aed";
        ctx.beginPath();
        ctx.moveTo(-7, -12); ctx.lineTo(-12, -22); ctx.lineTo(-3, -12);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(7, -12); ctx.lineTo(12, -22); ctx.lineTo(3, -12);
        ctx.fill();
        // Glowing purple eye slits
        ctx.fillStyle = "#e879f9";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 8;
        ctx.fillRect(dir > 0 ? 1 : -7, -6, 6, 2.5);
        ctx.restore();

        // Hit flash overlay
        if (m.hitFlash > 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.beginPath();
            ctx.arc(0, -32, 26, 0, Math.PI * 2);
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
            ctx.arc(0, -30, 50, startAngle, endAngle);
            ctx.stroke();
            ctx.fillStyle = "#f43f5e";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚠️ Замах!", 0, -74);
        }

        // Tied / Bound by Air Wind Trap
        if (m.state === 'TIED') {
            ctx.save();
            ctx.strokeStyle = "#00e5ff";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 10;
            let tiedTime = now * 0.01;
            for (let ring = 0; ring < 3; ring++) {
                let ry = -42 + ring * 14;
                let rxOff = Math.sin(tiedTime * 4 + ring) * 4;
                ctx.beginPath();
                ctx.ellipse(rxOff, ry, 18, 6, Math.sin(tiedTime * 2 + ring) * 0.3, 0, Math.PI * 2);
                ctx.stroke();
            }
            // Swirling wind particles around dummy
            ctx.fillStyle = "#ffffff";
            for (let wp = 0; wp < 4; wp++) {
                let ang = tiedTime * 6 + (wp * Math.PI / 2);
                let wpx = Math.cos(ang) * 22;
                let wpy = -30 + Math.sin(ang) * 12;
                ctx.beginPath();
                ctx.arc(wpx, wpy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🌪️ Связан!", 0, -74);
            ctx.restore();
        }

        // Mannequin Health Bar
        let bw = 45;
        let hpW = Math.max(0, (m.hp / m.maxHp) * bw);
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(-bw / 2, -70, bw, 5);
        ctx.fillStyle = "#c084fc";
        ctx.fillRect(-bw / 2, -70, hpW, 5);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-bw / 2, -70, bw, 5);

        ctx.restore();
    }

    // 6. Stage 4: Trials Demon Boss (Unique Towering Demonic Guardian)
    if (storyTrials.stage === 4 && storyTrials.demon) {
        let d = storyTrials.demon;

        if (d.state !== 'TELEPORT_IN') {
            ctx.save();
            let dx = d.x, dy = d.y;
            let dir = d.facingRight ? 1 : -1;
            let walkBob = (d.state === 'WALK' && (!d.tiedTimer || d.tiedTimer <= 0)) ? Math.sin(now * 0.012) * 2.5 : 0;
            let alpha = (d.state === 'TELEPORT_OUT') ? Math.max(0.12, d.stateTimer / 26) : 1;
            ctx.globalAlpha = alpha;

            ctx.translate(dx, dy + walkBob);

        // Ground shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.beginPath();
        ctx.ellipse(0, 80, 36, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Swirling demonic violet / crimson flame aura
        ctx.save();
        let auraGrad = ctx.createRadialGradient(0, 35, 15, 0, 35, 55);
        auraGrad.addColorStop(0, "rgba(168, 85, 247, 0.4)");
        auraGrad.addColorStop(0.6, "rgba(225, 29, 72, 0.2)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 35, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Heavy obsidian/crimson armored legs
        ctx.strokeStyle = "#1e1b4b";
        ctx.fillStyle = "#311042";
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-16, 52, 10, 28, 3); else ctx.fillRect(-16, 52, 10, 28);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(6, 52, 10, 28, 3); else ctx.fillRect(6, 52, 10, 28);
        ctx.fill(); ctx.stroke();

        // Massive hulking demonic torso & breastplate
        let chestGrad = ctx.createLinearGradient(-22, 10, 22, 54);
        chestGrad.addColorStop(0, "#4c0519");
        chestGrad.addColorStop(0.5, "#18181b");
        chestGrad.addColorStop(1, "#3b0764");
        ctx.fillStyle = chestGrad;
        ctx.strokeStyle = "#e11d48";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-22, 16);
        ctx.lineTo(22, 16);
        ctx.lineTo(16, 54);
        ctx.lineTo(-16, 54);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Demonic core runemark on chest (pulsing crimson heart)
        let coreGlow = 0.6 + Math.sin(now * 0.008) * 0.4;
        ctx.fillStyle = `rgba(244, 63, 94, ${coreGlow})`;
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 32, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Spiked demonic pauldrons (shoulders)
        ctx.fillStyle = "#18181b";
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-22, 16); ctx.lineTo(-32, 6); ctx.lineTo(-24, 2); ctx.lineTo(-18, 14);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22, 16); ctx.lineTo(32, 6); ctx.lineTo(24, 2); ctx.lineTo(18, 14);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Arms holding dark flame greatsword
        ctx.save();
        let armSwing = (d.state === 'SLAM' || d.state === 'POWER_WAVE') ? 0.8 : (d.state === 'RECOVER' ? 1.3 : (dir * 0.2));
        ctx.translate(dir * 14, 24);
        ctx.rotate(armSwing);
        let bladeLen = 54;
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#e11d48";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.lineTo(6, bladeLen); ctx.lineTo(0, bladeLen + 12); ctx.lineTo(-6, bladeLen);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, bladeLen + 6); ctx.stroke();
        ctx.restore();

        // Terrifying horned demon head / skull helm
        ctx.save();
        ctx.translate(0, 4);
        ctx.fillStyle = "#18181b";
        ctx.strokeStyle = "#881337";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Sweeping jagged demon horns
        ctx.fillStyle = "#e11d48";
        ctx.strokeStyle = "#4c0519";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.quadraticCurveTo(-22, -24, -28, -32);
        ctx.quadraticCurveTo(-14, -20, -3, -12);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.quadraticCurveTo(22, -24, 28, -32);
        ctx.quadraticCurveTo(14, -20, 3, -12);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Glowing menacing eye slits
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(dir > 0 ? 3 : -7, -1, 4, 1.8, dir * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Hit flash overlay
        if (d.hitFlash > 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            ctx.beginPath();
            ctx.arc(0, 35, 45, 0, Math.PI * 2);
            ctx.fill();
        }

        // Bound by Air Trap Visuals
        if (d.tiedTimer > 0) {
            ctx.save();
            ctx.strokeStyle = "#00e5ff";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 12;
            let tiedTime = now * 0.01;
            for (let ring = 0; ring < 3; ring++) {
                let ry = 18 + ring * 22;
                let rxOff = Math.sin(tiedTime * 4 + ring) * 6;
                ctx.beginPath();
                ctx.ellipse(rxOff, ry, 34, 10, Math.sin(tiedTime * 2 + ring) * 0.3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🌪️ СВЯЗАН ЛОВУШКОЙ!", 0, -38);
            ctx.restore();
        }

        ctx.restore();
    }

        // Teleport arrival rune telegraph
        if (d.state === 'TELEPORT_IN') {
            let prog = 1 - (d.stateTimer / 30);
            let glowRad = 35 + prog * 15;
            let tGrad = ctx.createRadialGradient(d.teleportTargetX, 850 - 4, 8, d.teleportTargetX, 850 - 4, glowRad);
            tGrad.addColorStop(0, "rgba(192, 132, 252, 0.85)");
            tGrad.addColorStop(0.5, "rgba(225, 29, 72, 0.5)");
            tGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = tGrad;
            ctx.beginPath();
            ctx.ellipse(d.teleportTargetX, 850 - 4, glowRad, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(244, 63, 94, ${0.7 + Math.sin(now * 0.02) * 0.3})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(d.teleportTargetX, 850 - 4, glowRad, 14, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "#fbcfe8";
            ctx.font = "900 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("🌀 ТЕЛЕПОРТАЦИЯ ДЕМОНА!", d.teleportTargetX, 850 - 45);
        }

        // Interrupted by Air trap notification
        if (d.interruptedTimer > 0) {
            ctx.fillStyle = "#38bdf8";
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 10;
            ctx.font = "900 14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("💨 ЗАМАХ ДЕМОНА СБИТ ЛОВУШКОЙ!", d.x, d.y - 48);
            ctx.shadowBlur = 0;
        }

        // Recovery / Vulnerable breathing embers
        if (d.state === 'RECOVER' && Math.random() < 0.25) {
            storyTrials.particles.push({
                x: d.x + (Math.random() - 0.5) * 24,
                y: d.y + 40,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 2 - 1,
                color: Math.random() < 0.5 ? "#a855f7" : "#ef4444",
                size: 2.5 + Math.random() * 2,
                timer: 20
            });
        }

        // Boss Leap Windup telegraph (Enhanced glowing floor warning)
        if (d.state === 'WINDUP_LEAP') {
            let prog = 1 - (d.stateTimer / 48);
            let glowRad = 45 + prog * 18;
            let groundGrad = ctx.createRadialGradient(d.x, 850 - 4, 10, d.x, 850 - 4, glowRad);
            groundGrad.addColorStop(0, "rgba(239, 68, 68, 0.75)");
            groundGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.5)");
            groundGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = groundGrad;
            ctx.beginPath();
            ctx.ellipse(d.x, 850 - 4, glowRad, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + Math.sin(now * 0.02) * 0.3})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(d.x, 850 - 4, glowRad, 16, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "#fef2f2";
            ctx.font = "900 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚡ ЗАМАХ НА ПРЫЖОК (УХОДИТЕ)!", d.x, d.y - 22);
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


