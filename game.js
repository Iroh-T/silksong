// --- EXTERNAL ASSETS (ITCH PACKS) ---
const externalGameAssets = {
    blueFlowers: [],
    plants1: [],
    plants2: [],
    plants3: [],
    compPlants: [],
    slimes: [],
    boulders: [],
    loaded: false
};

function loadExternalGameAssets() {
    if (typeof Image === 'undefined') return;
    try {
        let flowerFrames = ['00000', '00005', '00010', '00015', '00020', '00025', '00030', '00035', '00040', '00045', '00050', '00055'];
        flowerFrames.forEach((f, idx) => {
            let fl = new Image();
            fl.src = `assets/plants/blue_flower/opt/BlueFlower_${f}.png`;
            externalGameAssets.blueFlowers[idx] = fl;
        });

        let plantFrames = ['00000', '00008', '00016', '00024', '00032', '00040', '00048', '00056', '00064', '00072', '00080', '00088'];
        plantFrames.forEach((f, idx) => {
            let p1 = new Image();
            p1.src = `assets/plants/plant1/opt/Plant1_${f}.png`;
            externalGameAssets.plants1[idx] = p1;

            let p2 = new Image();
            p2.src = `assets/plants/plant2/opt/Plant2_${f}.png`;
            externalGameAssets.plants2[idx] = p2;

            let p3 = new Image();
            p3.src = `assets/plants/plant3/opt/Plant3_${f}.png`;
            externalGameAssets.plants3[idx] = p3;
        });

        // Animated Comp 1 plant frames for Fire Boss Arena
        for (let idx = 0; idx < 12; idx++) {
            let padded = String(idx).padStart(5, '0');
            let compImg = new Image();
            compImg.src = `assets/plants/comp/Comp 1_${padded}.png`;
            externalGameAssets.compPlants[idx] = compImg;
        }

        let slimeFrames = ['00000', '00004', '00008', '00012', '00016', '00020', '00024', '00028'];
        slimeFrames.forEach((s, idx) => {
            let sl = new Image();
            sl.src = `assets/slime/opt/SlimeBasic_${s}.png`;
            externalGameAssets.slimes[idx] = sl;
        });

        ['boulder1.png', 'boulder2.png', 'boulder3.png'].forEach((b, idx) => {
            let bImg = new Image();
            bImg.src = `assets/cave/${b}`;
            externalGameAssets.boulders[idx] = bImg;
        });

        externalGameAssets.loaded = true;
    } catch (e) {
        console.warn("External assets load error:", e);
    }
}
loadExternalGameAssets();

// --- UNIFIED CONTINUOUS TOTAL BOSS HEALTH HELPER ---
function getBossTotalHp() {
    if (!boss) return 0;
    if (window.isFireBossMode) {
        return Math.max(0, boss.hp);
    }
    if (boss.state === "DEFEATED") return 0;
    
    let p2 = (typeof phase2Hp !== 'undefined' && phase2Hp) ? phase2Hp : 0;
    let p3 = (typeof phase3Hp !== 'undefined' && phase3Hp) ? phase3Hp : 0;
    
    if (boss.phase === 1) {
        return Math.max(0, boss.hp) + p2 + p3;
    } else if (boss.phase === 2) {
        return Math.max(0, boss.hp) + p3;
    } else if (boss.phase === 2.5) {
        return p3;
    } else {
        return Math.max(0, boss.hp);
    }
}
window.getBossTotalHp = getBossTotalHp;

// --- FIRE BOSS DUEL: ASH PARTICLES & COMP PLANTS ---
function initAshParticles() {
    ashParticles = [];
    for (let i = 0; i < 50; i++) {
        let isEmber = Math.random() < 0.22;
        let grey = Math.floor(130 + Math.random() * 80);
        let alpha = 0.4 + Math.random() * 0.45;
        ashParticles.push({
            x: Math.random() * 1000,
            y: Math.random() * 400,
            vx: (Math.random() - 0.5) * 0.4,
            vy: Math.random() * 0.5 + 0.25,
            size: 2.5 + Math.random() * 3.5,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.05,
            phase: Math.random() * Math.PI * 2,
            isEmber: isEmber,
            color: isEmber ? `rgba(255, ${100 + Math.floor(Math.random() * 80)}, 30, ${alpha})` : `rgba(${grey}, ${grey}, ${grey + 10}, ${alpha})`
        });
    }
}
window.initAshParticles = initAshParticles;

function updateAshParticles() {
    if (!ashParticles || ashParticles.length === 0) return;
    for (let a of ashParticles) {
        a.x += Math.sin(Date.now() / 800 + a.phase) * 0.4 + a.vx;
        a.y += a.vy;
        a.angle += a.spin;
        a.vx *= 0.95;
        if (a.y > FLOOR + 10) {
            a.y = -10;
            a.x = Math.random() * ARENA_W;
            a.vx = (Math.random() - 0.5) * 0.4;
        }
        if (a.x < -10) a.x = ARENA_W + 10;
        if (a.x > ARENA_W + 10) a.x = -10;
    }
}
window.updateAshParticles = updateAshParticles;

function drawAshParticles() {
    if (!ashParticles || ashParticles.length === 0) return;
    ctx.save();
    for (let a of ashParticles) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.fillStyle = a.color;
        if (a.isEmber) {
            ctx.shadowColor = "#ff5500";
            ctx.shadowBlur = 5;
        }
        ctx.fillRect(-a.size / 2, -a.size / 2, a.size, a.size * 0.7);
        ctx.restore();
    }
    ctx.restore();
}
window.drawAshParticles = drawAshParticles;

function drawCompPlants() {
    if (!externalGameAssets || !externalGameAssets.compPlants || externalGameAssets.compPlants.length === 0) return;
    let frameIdx = Math.floor(Date.now() / 110) % externalGameAssets.compPlants.length;
    let img = externalGameAssets.compPlants[frameIdx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    let plantPositions = [
        { x: 140, w: 42, h: 84 },
        { x: 380, w: 38, h: 76 },
        { x: 620, w: 44, h: 88 },
        { x: 880, w: 40, h: 80 },
        { x: 1120, w: 44, h: 86 },
        { x: 1360, w: 38, h: 78 }
    ];

    ctx.save();
    for (let p of plantPositions) {
        ctx.drawImage(img, p.x - p.w / 2, FLOOR - p.h, p.w, p.h);
    }
    ctx.restore();
}
window.drawCompPlants = drawCompPlants;

function drawFireArenaBackdrop(w, h) {
    // Dark purple sky across the 1500 arena
    let skyGrad = ctx.createLinearGradient(0, 0, 0, FLOOR);
    skyGrad.addColorStop(0, "#190624");
    skyGrad.addColorStop(0.4, "#2c0e3e");
    skyGrad.addColorStop(1, "#3e1754");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, FLOOR);

    // Heavy purple clouds at the top
    ctx.save();
    ctx.fillStyle = "rgba(42, 11, 58, 0.85)";
    for (let i = 0; i < 11; i++) {
        let cx = 80 + i * 145;
        let cy = 35 + (i % 2) * 20;
        ctx.beginPath();
        ctx.arc(cx, cy, 75, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = "rgba(74, 25, 99, 0.6)";
    for (let i = 0; i < 10; i++) {
        let cx = 130 + i * 150;
        let cy = 25 + ((i + 1) % 2) * 15;
        ctx.beginPath();
        ctx.arc(cx, cy, 65, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Floor
    ctx.fillStyle = "#1e1322";
    ctx.fillRect(0, FLOOR, w, h - FLOOR);
    ctx.strokeStyle = "rgba(160, 90, 220, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR);
    ctx.lineTo(w, FLOOR);
    ctx.stroke();

    // Animated Comp plants on arena floor
    drawCompPlants();
}
window.drawFireArenaBackdrop = drawFireArenaBackdrop;

function drawFireBossArena(introTimer) {
    let w = ARENA_W || 1500;
    let h = ARENA_H || 400;
    let isIntro = (boss && boss.state === "FIRE_INTRO");
    let timer = (introTimer !== undefined) ? introTimer : (boss ? boss.introTimer : 0);
    let elapsed = 225 - timer;

    if (isIntro && elapsed < 135) {
        // --- 0.0s - 2.25s: PRE-FLASH ATMOSPHERE (1.5x slower) ---
        drawFireArenaBackdrop(w, h);

        // Blurred glowing red-orange round object on the ground in the middle
        let orbX = w / 2; // 750
        let orbY = FLOOR - 25;
        let orbR = 25;

        // Blurred background glow
        ctx.save();
        let glowGrad = ctx.createRadialGradient(orbX, orbY, 5, orbX, orbY, 90);
        glowGrad.addColorStop(0, "rgba(255, 100, 0, 0.85)");
        glowGrad.addColorStop(0.3, "rgba(255, 60, 0, 0.45)");
        glowGrad.addColorStop(0.7, "rgba(200, 30, 0, 0.15)");
        glowGrad.addColorStop(1, "rgba(150, 0, 0, 0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(orbX, orbY, 90, 0, Math.PI * 2);
        ctx.fill();

        // Glowing orb itself (soft blurred edges)
        let orbGrad = ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, orbR);
        orbGrad.addColorStop(0, "#fff2b2");
        orbGrad.addColorStop(0.35, "#ff8800");
        orbGrad.addColorStop(0.8, "#ff3300");
        orbGrad.addColorStop(1, "rgba(200, 20, 0, 0.85)");
        ctx.fillStyle = orbGrad;
        ctx.shadowColor = "#ff5500";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Purple ambient lighting overlay
        ctx.fillStyle = "rgba(65, 20, 90, 0.22)";
        ctx.fillRect(0, 0, w, h);

        // Silk thread sequence (from elapsed 90 to 135)
        if (elapsed >= 90) {
            let fireStartX = 420;
            let fireStartY = FLOOR - 35;
            let waterStartX = 1080;
            let waterStartY = FLOOR - 35;
            let meetX = orbX;
            let meetY = FLOOR - 70;

            let fProg = Math.min(1, Math.max(0, (elapsed - 90) / 30));
            let wProg = Math.min(1, Math.max(0, (elapsed - 102) / 26));

            ctx.save();
            ctx.strokeStyle = "#ffffff";
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2.5;

            // Draw Fire thread
            if (fProg > 0) {
                let curFX = fireStartX + (meetX - fireStartX) * fProg;
                let curFY = fireStartY + (meetY - fireStartY) * fProg - Math.sin(fProg * Math.PI) * 20;
                ctx.beginPath();
                ctx.moveTo(fireStartX, fireStartY);
                ctx.quadraticCurveTo(
                    fireStartX + (curFX - fireStartX) * 0.5,
                    Math.min(fireStartY, curFY) - 20,
                    curFX,
                    curFY
                );
                ctx.stroke();
            }

            // Draw Water thread
            if (wProg > 0) {
                let curWX = waterStartX + (meetX - waterStartX) * wProg;
                let curWY = waterStartY + (meetY - waterStartY) * wProg - Math.sin(wProg * Math.PI) * 20;
                ctx.beginPath();
                ctx.moveTo(waterStartX, waterStartY);
                ctx.quadraticCurveTo(
                    waterStartX + (curWX - waterStartX) * 0.5,
                    Math.min(waterStartY, curWY) - 20,
                    curWX,
                    curWY
                );
                ctx.stroke();
            }

            // When they touch / meet (elapsed >= 128)
            if (elapsed >= 128) {
                let orbProgress = (elapsed - 128) / 7;
                let mR = 4 + orbProgress * 30;
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(meetX, meetY, mR, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    } else {
        // ALWAYS render the underlying purple arena backdrop!
        drawFireArenaBackdrop(w, h);

        // --- WHITE DOME ARENA LAYER ---
        let domeAlpha = 1.0;
        if (boss && boss.domeDissolving) {
            domeAlpha = Math.max(0, 1 - (boss.domeDissolveProgress || 0));
        }

        if (domeAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = domeAlpha;

            let domeCx = 750;
            let domeFloor = FLOOR || 520;
            let domeRx = 700; // 1.5x diameter
            let domeRy = 480; // Taller soaring dome! Apex at y = 40 (520 - 480)

            // 1. Entire background outside dome is pitch black void (#000000)
            ctx.fillStyle = "#000000";
            // Top-left outside arch
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(domeCx, 0);
            ctx.lineTo(domeCx, domeFloor - domeRy);
            ctx.ellipse(domeCx, domeFloor, domeRx, domeRy, 0, 3 * Math.PI / 2, Math.PI, true);
            ctx.lineTo(0, domeFloor);
            ctx.closePath();
            ctx.fill();

            // Top-right outside arch
            ctx.beginPath();
            ctx.moveTo(w, 0);
            ctx.lineTo(domeCx, 0);
            ctx.lineTo(domeCx, domeFloor - domeRy);
            ctx.ellipse(domeCx, domeFloor, domeRx, domeRy, 0, 3 * Math.PI / 2, 2 * Math.PI, false);
            ctx.lineTo(w, domeFloor);
            ctx.closePath();
            ctx.fill();

            // Outer margin strips below floor outside dome base
            ctx.fillRect(0, domeFloor, Math.max(0, domeCx - domeRx), h - domeFloor);
            ctx.fillRect(domeCx + domeRx, domeFloor, Math.max(0, w - (domeCx + domeRx)), h - domeFloor);

            // 2. Interior of the dome: deep comfortable atmosphere with luminous silvery-white ambient glow
            ctx.beginPath();
            ctx.ellipse(domeCx, domeFloor, domeRx, domeRy, 0, Math.PI, 0, false);
            ctx.lineTo(domeCx + domeRx, domeFloor);
            ctx.lineTo(domeCx - domeRx, domeFloor);
            ctx.closePath();

            // Comfortable deep twilight slate backdrop with soft luminous mist
            let innerGrad = ctx.createRadialGradient(domeCx, 120, 60, domeCx, domeFloor, domeRx);
            innerGrad.addColorStop(0.0, "rgba(220, 230, 248, 0.45)");
            innerGrad.addColorStop(0.4, "rgba(180, 200, 230, 0.25)");
            innerGrad.addColorStop(0.8, "rgba(28, 32, 45, 0.95)");
            innerGrad.addColorStop(1.0, "#12151f");
            ctx.fillStyle = innerGrad;
            ctx.fill();

            // Soft celestial light beams from the apex
            let lightWash = ctx.createLinearGradient(0, 40, 0, domeFloor);
            lightWash.addColorStop(0, "rgba(255, 255, 255, 0.25)");
            lightWash.addColorStop(0.4, "rgba(230, 240, 255, 0.08)");
            lightWash.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = lightWash;
            ctx.fill();

            // 3. Floor beneath y = 350 inside the dome
            ctx.fillStyle = "#12141c";
            ctx.fillRect(domeCx - domeRx, domeFloor, domeRx * 2, h - domeFloor);

            // Subtle glowing floor border line
            ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(domeCx - domeRx, domeFloor);
            ctx.lineTo(domeCx + domeRx, domeFloor);
            ctx.stroke();

            // 4. Radiant White Dome Perimeter Arc (Glowing white light)
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 10;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.ellipse(domeCx, domeFloor, domeRx, domeRy, 0, Math.PI, 0, false);
            ctx.stroke();

            // Core bright white arch
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.ellipse(domeCx, domeFloor, domeRx, domeRy, 0, Math.PI, 0, false);
            ctx.stroke();

            ctx.restore();
        }
    }
}
window.drawFireBossArena = drawFireBossArena;

function maskOutsideFireDome() {
    if (!ctx) return;
    if (boss && (boss.domeDissolveProgress || 0) >= 1) {
        return;
    }
    if (boss && boss.state === "FIRE_INTRO" && (225 - boss.introTimer) < 135) {
        return;
    }
    let maskAlpha = 1.0;
    if (boss && boss.domeDissolving) {
        maskAlpha = Math.max(0, 1 - (boss.domeDissolveProgress || 0));
    }
    if (maskAlpha <= 0) return;

    let domeCx = 750;
    let domeFloor = FLOOR || 520;
    let domeRx = 700;
    let domeRy = 480;
    let w = ARENA_W || 1500;
    let h = ARENA_H || 650;

    ctx.save();
    ctx.globalAlpha = maskAlpha;
    ctx.fillStyle = "#000000";

    // 1. Top-Left Corner (Outside the Dome Arch)
    ctx.beginPath();
    ctx.moveTo(-500, -500);
    ctx.lineTo(domeCx, -500);
    ctx.lineTo(domeCx, domeFloor - domeRy);
    ctx.ellipse(domeCx, domeFloor, domeRx, domeRy, 0, 3 * Math.PI / 2, Math.PI, true);
    ctx.lineTo(-500, domeFloor);
    ctx.closePath();
    ctx.fill();

    // 2. Top-Right Corner (Outside the Dome Arch)
    ctx.beginPath();
    ctx.moveTo(w + 500, -500);
    ctx.lineTo(domeCx, -500);
    ctx.lineTo(domeCx, domeFloor - domeRy);
    ctx.ellipse(domeCx, domeFloor, domeRx, domeRy, 0, 3 * Math.PI / 2, 2 * Math.PI, false);
    ctx.lineTo(w + 500, domeFloor);
    ctx.closePath();
    ctx.fill();

    // 3. Outer strips below floor outside dome base
    ctx.fillRect(-500, domeFloor, (domeCx - domeRx) + 500, (h - domeFloor) + 500);
    ctx.fillRect(domeCx + domeRx, domeFloor, (w - (domeCx + domeRx)) + 500, (h - domeFloor) + 500);

    // 4. Crisp glowing perimeter line on top (boundary ceiling)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(domeCx, domeFloor, domeRx, domeRy, 0, Math.PI, 0, false);
    ctx.stroke();

    ctx.restore();
}
window.maskOutsideFireDome = maskOutsideFireDome;

function buildAndStartGame() {
    try {
        initAudio(); 
        if (typeof stopMenuMusic === 'function') stopMenuMusic();
        
        let isTouch = (p1InputType === 'TOUCH' || (numPlayers === 2 && p2InputType === 'TOUCH'));
        let mobUi = document.getElementById("mobile-ui");
        if (mobUi) mobUi.style.display = isTouch ? "flex" : "none";
        let ctrlCont = document.getElementById("controls-container");
        if (ctrlCont) ctrlCont.style.display = isTouch ? "none" : "block";
        players = [];
        fallingBananaPeels = [];
        isTutorial = false;
        
        if (window.isFireBossMode) {
            ARENA_W = 1500;
            ARENA_H = 650;
            FLOOR = 520;
            platforms = [];
            secretMode = false;
            numPlayers = 1;
            p1HeroSelection = 'WATER';
            hasAiCompanion = false;
        } else if (secretMode) { 
            ARENA_W = 2500; 
            ARENA_H = 600; 
            FLOOR = 550; 
        } else { 
            ARENA_W = 1000; 
            ARENA_H = 400; 
            FLOOR = 350; 
        }

        battleResultRecorded = false;
        battleStartTime = Date.now();

        function mapControlsToKeysObj(schemeObj) {
            let res = {};
            if (schemeObj && typeof schemeObj === 'object') {
                for (let k in schemeObj) {
                    if (schemeObj[k]) res[k] = [schemeObj[k]];
                }
            }
            return res;
        }

        if (!userControls || typeof userControls !== 'object') {
            userControls = JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
        }
        let s1 = userControls.SCHEME_1 || DEFAULT_CONTROLS.SCHEME_1;
        let s2 = userControls.SCHEME_2 || DEFAULT_CONTROLS.SCHEME_2;
        let duo1 = (userControls.DUO_KEYBOARD && userControls.DUO_KEYBOARD.p1) || DEFAULT_CONTROLS.DUO_KEYBOARD.p1;
        let duo2 = (userControls.DUO_KEYBOARD && userControls.DUO_KEYBOARD.p2) || DEFAULT_CONTROLS.DUO_KEYBOARD.p2;

        let p1Keys = mapControlsToKeysObj(s1);
        let p2Keys = mapControlsToKeysObj(s2);

        if (p1InputType === 'KEYBOARD_2' || p1InputType === 'KEYBOARD_SHOOTER') {
            p1Keys = mapControlsToKeysObj(s2);
        } else if (p1InputType === 'DUO_KEYBOARD_P1') {
            p1Keys = mapControlsToKeysObj(duo1);
        } else {
            p1Keys = mapControlsToKeysObj(s1);
        }

        if (p2InputType === 'KEYBOARD_1' || p2InputType === 'KEYBOARD_SILK') {
            p2Keys = mapControlsToKeysObj(s1);
        } else if (p2InputType === 'DUO_KEYBOARD_P2') {
            p2Keys = mapControlsToKeysObj(duo2);
        } else {
            p2Keys = mapControlsToKeysObj(s2);
        }

        if (!p1HeroSelection) p1HeroSelection = 'WATER';
        if (numPlayers === 2 && !p2HeroSelection) p2HeroSelection = 'EARTH';

        if (!configAbilities || typeof configAbilities !== 'object') {
            configAbilities = { p1: {}, p2: {} };
        }
        if (!configAbilities.p1 || typeof configAbilities.p1 !== 'object' || Object.keys(configAbilities.p1).length === 0) {
            configAbilities.p1 = { ...(defaultAbilities[p1HeroSelection] || { top: 'none', mid: 'shuriken', bot: 'none' }) };
        }
        if (numPlayers === 2 && (!configAbilities.p2 || typeof configAbilities.p2 !== 'object' || Object.keys(configAbilities.p2).length === 0)) {
            configAbilities.p2 = { ...(defaultAbilities[p2HeroSelection] || { top: 'none', mid: 'trap', bot: 'none' }) };
        }

        if (!configBadges || typeof configBadges !== 'object') {
            configBadges = { team: 'none', p1: ['none', 'none', 'none'], p2: ['none', 'none', 'none'] };
        }
        if (!Array.isArray(configBadges.p1)) configBadges.p1 = ['none', 'none', 'none'];
        if (!Array.isArray(configBadges.p2)) configBadges.p2 = ['none', 'none', 'none'];
        if (!configBadges.team) configBadges.team = 'none';

        let startX1 = window.isFireBossMode ? 1080 : (secretMode ? ARENA_W/2 - 50 : 150);
        let p1 = createPlayer(1, p1HeroSelection, p1Keys, p1InputType, startX1);
        if (window.isFireBossMode) {
            p1.facingRight = false;
            p1.maxHp = 8;
            p1.hp = 8;
        }
        p1.abilities = { ...(configAbilities.p1 || defaultAbilities[p1HeroSelection] || {}) };
        p1.bananaSkin = !!(typeof bananaSkinP1 !== 'undefined' && bananaSkinP1 && typeof isBananaSkinAllowed === 'function' && isBananaSkinAllowed());
        p1.gnomeSkin = !!(typeof gnomeSkinP1 !== 'undefined' && gnomeSkinP1 && typeof isGnomeSkinAllowed === 'function' && isGnomeSkinAllowed());
        let p1AbList = (p1.abilities && typeof p1.abilities === 'object') ? Object.values(p1.abilities) : [];
        if (p1.bananaSkin || p1AbList.includes('banana_snack')) p1.bananaSnackUses = 3;
        
        applyBadgesToPlayer(p1, true); 
        players.push(p1);

        if (numPlayers === 2) {
            let startX2 = secretMode ? ARENA_W/2 : (hasAiCompanion ? 190 : 200);
            let p2 = createPlayer(2, p2HeroSelection, p2Keys, p2InputType, startX2);
            p2.abilities = { ...(configAbilities.p2 || defaultAbilities[p2HeroSelection] || {}) };
            p2.bananaSkin = !!(typeof bananaSkinP2 !== 'undefined' && bananaSkinP2 && typeof isBananaSkinAllowed === 'function' && isBananaSkinAllowed());
            p2.gnomeSkin = !!(typeof gnomeSkinP2 !== 'undefined' && gnomeSkinP2 && typeof isGnomeSkinAllowed === 'function' && isGnomeSkinAllowed());
            let p2AbList = (p2.abilities && typeof p2.abilities === 'object') ? Object.values(p2.abilities) : [];
            if (p2.bananaSkin || p2AbList.includes('banana_snack')) p2.bananaSnackUses = 3;
            applyBadgesToPlayer(p2, false); 
            players.push(p2);
        }

        // Add AI companion if enabled (v74)
        if (typeof hasAiCompanion !== 'undefined' && hasAiCompanion) {
            let aiHero = (typeof aiCompanionConfig !== 'undefined' && aiCompanionConfig && aiCompanionConfig.hero) ? aiCompanionConfig.hero : (p1HeroSelection === 'WATER' ? 'EARTH' : 'WATER');
            if (aiHero === 'WATER_ROPE') aiHero = 'WATER';
            let aiId = players.length + 1;
            let startXAi = secretMode ? ARENA_W/2 + 80 : (players.length === 2 ? 260 : 200);
            let pAi = createPlayer(aiId, aiHero, {}, 'AI', startXAi);
            pAi.isAi = true;
            pAi.aiPersonality = (typeof aiCompanionConfig !== 'undefined' && aiCompanionConfig && aiCompanionConfig.personality) ? aiCompanionConfig.personality : 'TACTICIAN';
            pAi.abilities = { ...(defaultAbilities[aiHero] || {}) };
            applyBadgesToPlayer(pAi, false, 'ai');
            players.push(pAi);
        }

        // Lore Duo bonus for Water + Earth
        if (players.length >= 2) {
            let hasWater = players.some(p => p.type === 'WATER');
            let hasEarth = players.some(p => p.type === 'EARTH');
            if (hasWater && hasEarth) {
                for (let p of players) {
                    if (p.type === 'WATER' || p.type === 'EARTH') {
                        p.maxHp = Math.max(p.maxHp, 7);
                        p.hp = p.maxHp;
                    }
                }
            }
        }

        // Boss HP and Shared Heals scaling based on total fighters
        if (window.isFireBossMode) {
            boss.maxHp = 14;
            phase2Hp = 0;
            phase3Hp = 0;
            boss.totalMaxHp = 14;
            boss.totalHp = 14;
            maxSharedHeals = 3;
            platforms = [];
        } else if (!secretMode) {
            // Normal Mode exact total HP table specified by Timur:
            // 1P = 60 (24 + 18 + 18 = 60)
            // 2P = 120 (49 + 36 + 35 = 120)
            // 3P = 135 (60 + 40 + 35 = 135)
            if (players.length === 1) {
                boss.maxHp = 24; 
                phase2Hp = 18; 
                phase3Hp = 18;
                maxSharedHeals = 3;
            } else if (players.length === 2) {
                boss.maxHp = 49; 
                phase2Hp = 36; 
                phase3Hp = 35;
                maxSharedHeals = 4;
            } else {
                boss.maxHp = 60; 
                phase2Hp = 40; 
                phase3Hp = 35;
                maxSharedHeals = 5;
            }
            boss.totalMaxHp = boss.maxHp + phase2Hp + phase3Hp;
            boss.totalHp = boss.totalMaxHp;
        } else {
            // L-Mode (Secret Mode) exact total HP table specified by Timur:
            // L1 = 130 (56 + 39 + 35 = 130)
            // L2 = 120 (45 + 40 + 35 = 120)
            // L3 = 160 (70 + 50 + 40 = 160)
            if (players.length === 1) {
                boss.maxHp = 56; 
                phase2Hp = 39; 
                phase3Hp = 35;
                maxSharedHeals = 3;
            } else if (players.length === 2) {
                boss.maxHp = 45; 
                phase2Hp = 40; 
                phase3Hp = 35;
                maxSharedHeals = 4;
            } else {
                boss.maxHp = 70; 
                phase2Hp = 50; 
                phase3Hp = 40;
                maxSharedHeals = 5;
            }
            boss.totalMaxHp = boss.maxHp + phase2Hp + phase3Hp;
            boss.totalHp = boss.totalMaxHp;
        }

        if (secretMode) { 
            for (let p of players) { p.maxHp += 2; p.hp += 2; } 
        }

        // Battery Badge: +1 maximum heal charge for the team
        if (players.some(p => p.badges && p.badges.includes('battery'))) {
            maxSharedHeals = Math.min(6, maxSharedHeals + 1);
        }

        if (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.hp3) {
            for (let p of players) {
                p.maxHp = (p.type === 'WATER_ROPE') ? 2 : 3;
                if (p.badges && p.badges.includes('fish_scale')) p.maxHp += 1;
                p.hp = p.maxHp;
            }
        }

        if (!secretMode && !window.isFireBossMode) {
            platforms = [ { x: 420, y: FLOOR - 100, w: 160, h: 10 } ];
        } else {
            platforms = [];
        }

        let isEasyBoss = !!(typeof easyBossMode !== 'undefined' && easyBossMode) || !!window.easyBossMode;
        if (isEasyBoss) {
            boss.maxHp = Math.round(boss.maxHp * 0.75);
            phase2Hp = Math.round(phase2Hp * 0.75);
            phase3Hp = Math.round(phase3Hp * 0.75);
            boss.totalMaxHp = boss.maxHp + phase2Hp + phase3Hp;
            boss.totalHp = boss.totalMaxHp;
            activeWorldMessage = {
                text: `🌿 ОСЛАБЛЕНИЕ БОССА: ВКЛЮЧЕНО (HP: ${boss.maxHp}, УРОН: -50%)`,
                sender: 'Система',
                timer: 200,
                maxTimer: 200
            };
        }

        resetGameParams(); 
        gameState = "PLAYING";

        // ONLY hide overlay once game state is verified and active!
        let overlay = document.getElementById("overlay");
        if (overlay) overlay.style.display = "none"; 

        if (typeof sendPresencePing === 'function') sendPresencePing();

        if (secretMode) {
            boss.state = "L_INTRO_FALL"; 
            boss.stateTimer = 60; 
            boss.y = FLOOR + 100; 
            boss.color = "#aaaaaa";
            for (let p of players) { p.y = -200; p.vy = 5; }
        }

        if (window.isBroadcasting) {
            sendTelegramNotification(`🔴 <b>${getCurrentUser() || 'РЫБа'} начал прямую трансляцию боя!</b>\n⏰ <i>${new Date().toLocaleTimeString()}</i>`);
        }
    } catch(err) {
        console.error("Critical error in buildAndStartGame:", err);
        let overlay = document.getElementById("overlay");
        if (overlay) overlay.style.display = "block";
    }
}
window.buildAndStartGame = buildAndStartGame;

function buildAndStartTutorialGame() {
    try {
        initAudio(); 
        if (typeof stopMenuMusic === 'function') stopMenuMusic();
        
        let isTouch = (p1InputType === 'TOUCH');
        let mobUi = document.getElementById("mobile-ui");
        if (mobUi) mobUi.style.display = isTouch ? "flex" : "none";
        let ctrlCont = document.getElementById("controls-container");
        if (ctrlCont) ctrlCont.style.display = isTouch ? "none" : "block";
        players = [];
        
        secretMode = false;
        ARENA_W = 1000; 
        ARENA_H = 400; 
        FLOOR = 350; 
        platforms = [ { x: 420, y: FLOOR - 100, w: 160, h: 10 } ];

        battleResultRecorded = false;
        cheatUsedInBattle = false;
        healsUsedInBattle = 0;
        battleStartTime = Date.now();
        
        isTutorial = true;
        tutorialStep = 'WALK';
        tutorialSubStep = 0;
        tutorialDamageDealt = false;
        tutorialTargets = [];

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
        } else {
            p1Keys = mapControlsToKeysObj(userControls ? userControls.SCHEME_1 : DEFAULT_CONTROLS.SCHEME_1);
        }

        let p1 = createPlayer(1, 'WATER', p1Keys, p1InputType, 120);
        p1.abilities = { top: 'shuriken', mid: 'shuriken', bot: 'shuriken' };
        applyBadgesToPlayer(p1, true);
        players.push(p1);

        resetGameParams();

        // 4 heal charges for training
        sharedHeals = 4;
        maxSharedHeals = 4;

        // Step 1: 4 glowing spheres on the floor
        tutorialDots = [
            { x: 240, y: FLOOR - 20 },
            { x: 440, y: FLOOR - 20 },
            { x: 640, y: FLOOR - 20 },
            { x: 820, y: FLOOR - 20 }
        ];

        boss.hp = 7;
        boss.maxHp = 7;
        boss.x = -999;
        boss.y = -999;
        boss.state = "INACTIVE";

        gameState = "PLAYING";
        let overlay = document.getElementById("overlay");
        if (overlay) overlay.style.display = "none"; 

        if (typeof sendPresencePing === 'function') sendPresencePing();
    } catch(err) {
        console.error("Tutorial start failed:", err);
        let overlay = document.getElementById("overlay");
        if (overlay) overlay.style.display = "block";
    }
}
window.buildAndStartTutorialGame = buildAndStartTutorialGame;

// --- STORY MODE PROLOGUE LAUNCHER & RETURN ---
function launchStoryPrologue(slotData) {
    try {
        initAudio();
        if (typeof stopMenuMusic === 'function') stopMenuMusic();
        
        window.isStoryMode = true;
        isTutorial = false;
        window.isFireBossMode = false;
        isFireBossMode = false;
        gameState = "PLAYING";

        let overlay = document.getElementById("overlay");
        if (overlay) overlay.style.display = "none";

        // Initialize dedicated Prologue engine
        if (typeof initStoryPrologue === 'function') {
            initStoryPrologue(slotData);
        }
        
        if (typeof sendPresencePing === 'function') sendPresencePing();
    } catch(err) {
        console.error("Story mode start failed:", err);
        returnFromStoryToMenu();
    }
}
window.launchStoryPrologue = launchStoryPrologue;

function returnFromStoryToMenu() {
    window.isStoryMode = false;
    if (typeof storyState !== 'undefined') storyState.active = false;
    gameState = "MENU";
    let overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "block";
    let mobUi = document.getElementById("mobile-ui");
    if (mobUi) mobUi.style.display = "none";
    let ctrlCont = document.getElementById("controls-container");
    if (ctrlCont) ctrlCont.style.display = "block";
    if (typeof openStorySlotsScreen === 'function') {
        openStorySlotsScreen();
    }
}
window.returnFromStoryToMenu = returnFromStoryToMenu;

function resetGameParams() {
    for (let p of players) { 
        if (!p) continue;
        if (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.hp3) {
            let baseHp = (p.type === 'WATER_ROPE') ? 2 : 3;
            if (p.badges && p.badges.includes('fish_scale')) baseHp += 1;
            p.maxHp = baseHp;
        } else if (p.type === 'WATER_ROPE') {
            let baseHp = secretMode ? 6 : 4;
            if (p.badges && p.badges.includes('fish_scale')) baseHp += 1;
            p.maxHp = baseHp;
        }
        p.hp = p.maxHp; p.y = FLOOR - 50; p.vx = 0; p.vy = 0; p.invuln = 0; 
        p.healTimer = 0; p.isHealing = false; p.isAoEHealing = false; p.bleedTimer = 0; 
        p.tied = false; p.tieClicks = 0; p.hasPressedTie = false; p.isDowned = false; 
        p.purpleHp = 0; p.tpCooldown = 0; p.tpDebuffTimer = 0; p.genTimer = 0; 
        p.lightCharge = 0; p.saHit = false; p.pendingDmgTimer = 0; p.pendingDmg = 0; 
        p.attackSpamCount = 0; p.overheatTimer = 0; p.heatLevel = 0; 
        p.lastSafeX = p.x; p.lastSafeY = p.y;
        p.chillTimer = 0; p.invigTimer = 0; p.runTimer = 0; p.voidDamageTimer = 0; p.spamResetTimer = 0;
        let abList = (p.abilities && typeof p.abilities === 'object') ? Object.values(p.abilities) : [];
        p.chillBrews = abList.includes('chill') ? 3 : 0;
        p.invigBrews = abList.includes('invig') ? 3 : 0;
        p.bananaSnackUses = (p.bananaSkin || abList.includes('banana_snack')) ? 3 : 0;
        p.dashBurstTimer = 0; p.airDashed = false;
        p.ropeUltAttempts = 3;
        p.staminaUltAttempts = 2;
        p.waterDrop = null;
        p.waterDropActive = false;
        p.isSilkRunning = false;
        p.silkRunTimer = 0;
        p.halberdVaultTimer = 0;
        p.halberdVaultSwinging = false;
        p.airAttackTimer = 0;
        p.fireBlastTimer = 0;
        if (p.type === 'STAMINA') { p.stamina = 5; p.isCharging = false; p.chargeTimer = 0; p.chargeProjectiles = []; } 
        if (p.type === 'FIRE') { p.isParrying = false; p.parryTimer = 0; p.orangeHp = 0; p.orangeHpTimer = 0; p.isFieryHealing = false; p.fireDashTimer = 0; }
        if (p.type === 'FIRE_HALBERD') { p.halberdBuffTimer = 0; p.halberdVampiricReady = false; p.halberdCombos = 0; p.halberdComboTimer = 0; p.whirlwindTimer = 0; }
        if (p.type === 'WATER_ROPE') { p.concentrateTimer = 0; p.concentrateReady = false; p.ropeA = null; p.ropeB = null; p.ropeActive = false; p.ropeDrainTimer = 0; p.ropeSlideTimer = 0; p.isRopeSliding = false; }
        if (p.badges && p.badges.includes('shield')) p.hasAegisShield = true;
        if (p.badges && p.badges.includes('cracked_life')) { p.hasCrackedLife = true; p.crackedShieldBroken = false; }
    }
    if (players.length > 0 && players[0]) {
        if (window.isFireBossMode) {
            players[0].x = 760;
            players[0].facingRight = false;
            players[0].maxHp = 8;
            players[0].hp = 8;
            players[0].burnGauge = 0;
            players[0].burnTimer = 0;
        } else if (!window.isStoryMode) {
            players[0].x = ARENA_W/2 - 50;
        }
    }
    if (players.length > 1 && players[1] && !window.isStoryMode) players[1].x = ARENA_W/2 + 50;
    
    sharedHeals = maxSharedHeals; 
    sharedHitCount = 0; 
    sharedHealPoints = (typeof MAX_HEAL_POINTS !== 'undefined') ? MAX_HEAL_POINTS : 12;
    airBlades = []; playerDaggers = []; blackDaggers = []; p2Traps = []; phantoms = []; 
    airTraps = []; airComboTraps = []; scarf.active = false; clashFlash = null; 
    activeCinematic = null; globalWindMode = "NONE"; globalWindTimer = 0; globalWindCooldown = 0; 
    voidExplosions = []; voidPortals = []; looms = []; chaosBalls = []; screamRings = [];
    loomThreads = []; lightAmuletWaves = []; battleAnnouncements = [];
    waterRopes = []; fallingBananaPeels = []; slowMoTimer = 0;
    if (window.isFireBossMode) {
        initAshParticles();
    } else if (typeof initArenaLeaves === 'function') {
        initArenaLeaves();
    }
    
    floorCracks = [];
    voidPuddles = [];
    voidCeilingDrips = [];
    fallingBoulders = [];
    arenaBarricadeBoulders = [];
    abyssGooFloorActive = false;
    abyssGooSolidifying = false;
    abyssGooSolidifyTimer = 0;
    abyssGooSolidified = false;
    abyssRightWallBroken = false;
    gooCinematicTimer = 0;
    ambientVoidOrbsMultiplier = 1;
    teamHallucinationHits = 0;

    if (boss) {
        if (window.isFireBossMode) {
            boss.hp = 14; boss.maxHp = 14; boss.totalMaxHp = 14; boss.totalHp = 14;
            boss.phase = 1; boss.damageBonus = 0; boss.x = 420; boss.y = FLOOR - boss.height;
            boss.facingRight = true; boss.state = "FIRE_INTRO"; boss.introTimer = 225; boss.stateTimer = 225;
            boss.flamingRapierTimer = 0; boss.lastBlockTimer = 0; boss.fireHealCooldown = 0;
            boss.fireParryTimer = 0; boss.fireCounterTicks = 0; boss.vx = 0; boss.vy = 0; boss.invuln = 0;
            boss.flashTimer = 0;
        } else {
            boss.hp = boss.maxHp || 25; boss.phase = 1; boss.damageBonus = 0; boss.x = ARENA_W/2; boss.y = FLOOR - 50; 
            boss.state = "IDLE"; boss.stateTimer = 60; boss.flashTimer = 0; boss.vx = 0; 
            boss.speed = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.bossSpeed) ? (6.5 * 1.25) : 6.5; 
            boss.missCount = 0; boss.directAttackActive = false; boss.directAttackHit = false; boss.comboCount = 0; 
            boss.heroBleedTimer = 0; boss.heroBleedTicks = 0; boss.superQueue = []; boss.sa1Arr = []; 
            boss.hunterInfected = 0; boss.infectedTimer = 0; boss.voidWindDisabled = 0; boss.sa1Count = 0; 
            boss.saLines = null; boss.color = "#e6c800"; boss.climbSaTimer = 0; boss.saLinesState = ""; boss.saLinesTimer = 0;
            boss.lightStunDone = false; boss.lightInfected = 0; boss.lightInfectedDmgRed = 0.5;
            boss.climbSaStep = 0; boss.halfHpSeqDone = false;
            boss.attackCount = 0; boss.firstAttackAwarded = false; boss.healSpammerAwarded = false;
            boss.stunP1_1 = false; boss.stunP1_2 = false; boss.stunP2 = false;
            boss.lPhase4Orbs = []; boss.lPhase4AttackTimer = 0; boss.gooSeqTriggered = false;
        }
    }
    battleStartTime = Date.now();
    
    screenShake = { timer: 0, mag: 0, dirX: 0, dirY: 0 }; 
    freezeFrames = 0;
    godModeActive = false; window.godModeActive = false;
    megaDamageActive = false; window.megaDamageActive = false;
    try {
        let bgm = document.getElementById("lModeMusic"); 
        if (bgm) bgm.pause();
        if (window.isFireBossMode) {
            if (window.fireBossAudioEngine) window.fireBossAudioEngine.startIntro();
        } else {
            if (typeof stopFireBossMusic === 'function') stopFireBossMusic();
        }
    } catch(e) {}
}

function updateProjectiles() {
    // Air traps
    for (let i = airTraps.length - 1; i >= 0; i--) {
        let t = airTraps[i]; t.x += t.vx; t.y += t.vy;
        if (t.x < 0 || t.x > ARENA_W || t.y < -2000 || t.y > FLOOR + 400) { airTraps.splice(i, 1); continue; }
        if (rectIntersect({x: t.x-8, y: t.y-8, width: 16, height: 16}, boss) && boss.state !== "TRANSITION") {
            let caster = players.find(pl => pl.id === t.pId);
            let stateBefore = boss.state;
            if (tryDamageBoss(1, caster)) {
                if (stateBefore !== "PARRY_STANCE" && stateBefore !== "VULN_STANCE" && stateBefore !== "VULN_LATE") {
                    boss.state = "TIED"; boss.color = "blue"; boss.stateTimer = 60; boss.vx = 0;
                }
            }
            airTraps.splice(i, 1);
        }
    }

    // Air combo traps
    for (let i = airComboTraps.length - 1; i >= 0; i--) {
        let t = airComboTraps[i]; t.x += t.vx; t.y += t.vy;
        if (t.x < 0 || t.x > ARENA_W || t.y < -2000 || t.y > FLOOR + 400) { airComboTraps.splice(i, 1); continue; }
        
        let hitAlly = false;
        for (let p of players) {
            if (p.id !== t.pId && !p.isDowned && p.hp > 0 && rectIntersect(p, {x: t.x-10, y: t.y-10, width: 20, height: 20})) {
                p.hp = Math.min(p.maxHp, p.hp + 1.5);
                if (p.type === 'STAMINA') p.stamina = Math.min(p.maxStamina, p.stamina + 1);
                playSound('heal'); hitAlly = true; airComboTraps.splice(i, 1); break;
            }
        }
        if (hitAlly) continue;

        if (rectIntersect({x: t.x-10, y: t.y-10, width: 20, height: 20}, boss) && boss.state !== "TRANSITION") {
            let caster = players.find(pl => pl.id === t.pId);
            let stateBefore = boss.state;
            if (tryDamageBoss(1.5, caster)) {
                if (stateBefore !== "PARRY_STANCE" && stateBefore !== "VULN_STANCE" && stateBefore !== "VULN_LATE") {
                    boss.state = "TIED_BLEED"; boss.color = "blue"; boss.stateTimer = 120; boss.vx = 0;
                }
            }
            airComboTraps.splice(i, 1);
        }
    }

    // Earth traps
    for (let i = p2Traps.length - 1; i >= 0; i--) {
        let t = p2Traps[i]; t.timer--; if (t.cd > 0) t.cd--;
        if (t.cd <= 0 && t.hits > 0 && boss.state !== "DEFEATED" && !boss.state.startsWith("TELEPORT")) {
            if (rectIntersect({x: t.x, y: t.y, width: t.width, height: t.height}, boss)) {
                let caster = players.find(pl => pl.id === t.pId);
                if (tryDamageBoss(0.75, caster)) { t.hits--; t.cd = 30; }
            }
        }
        if (t.timer <= 0 || t.hits <= 0) p2Traps.splice(i, 1);
    }

    // Player daggers
    for (let i = playerDaggers.length - 1; i >= 0; i--) {
        let d = playerDaggers[i];
        if (d.active) {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > ARENA_W || d.y < -2000 || d.y > FLOOR + 400) { playerDaggers.splice(i, 1); continue; }
            
            if (!d.dodgeChecked && Math.abs(d.x - boss.x) < 100 && ["IDLE","WALK","CHASE"].includes(boss.state)) { 
                d.dodgeChecked = true;
                if (Math.random() < 0.30) { boss.state = "TELEPORT_OUT"; boss.stateTimer = 10; playSound('wind'); } 
            }

            if (typeof isTutorial !== 'undefined' && isTutorial && typeof tutorialTargets !== 'undefined') {
                let hitTrg = false;
                for (let ti = tutorialTargets.length - 1; ti >= 0; ti--) {
                    let trg = tutorialTargets[ti];
                    let trgBox = { x: trg.x - trg.r, y: trg.y - trg.r, width: trg.r * 2, height: trg.r * 2 };
                    if (rectIntersect({x: d.x-5, y: d.y-5, width: 10, height: 10}, trgBox)) {
                        playSound('hitBoss');
                        triggerShake(3, 5);
                        voidExplosions.push({ x: trg.x, y: trg.y, timer: 20, isWhite: true, r: 25 });
                        tutorialTargets.splice(ti, 1);
                        playerDaggers.splice(i, 1);
                        hitTrg = true;
                        break;
                    }
                }
                if (hitTrg) continue;
            }

            if (rectIntersect({x: d.x-5, y: d.y-5, width: 10, height: 10}, boss) && boss.state !== "TRANSITION" && boss.state !== "DEFEATED" && !boss.state.startsWith("TELEPORT")) {
                let caster = players.find(pl => pl.id === d.pId);
                if (tryDamageBoss(d.dmg || 1, caster)) {
                    if (d.isFire && caster && (caster.type === 'FIRE' || caster.type === 'FIRE_HALBERD')) {
                        caster.heatHitCount = (caster.heatHitCount || 0) + 1;
                        if (caster.heatHitCount >= 3) {
                            caster.heatHitCount = 0;
                            boss.bossBurnTimer = 180;
                            boss.bossBurnTicks = 3;
                            playSound('heatIgnite');
                            triggerShake(6, 12);
                            voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 20, isWhite: false, isOrange: true, r: 80 });
                        }
                    }
                    playerDaggers.splice(i, 1);
                }
            }
        }
    }
    
    // Black daggers
    for (let i = blackDaggers.length - 1; i >= 0; i--) {
        let d = blackDaggers[i]; d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > ARENA_W || d.y > FLOOR + 400 || d.y < -2000) { blackDaggers.splice(i, 1); continue; }
        
        // Boulders block boss daggers and shurikens!
        if (typeof arenaBarricadeBoulders !== 'undefined' && arenaBarricadeBoulders.length > 0) {
            let hitBarricade = false;
            for (let bar of arenaBarricadeBoulders) {
                let barBox = { x: bar.x - bar.w / 2, y: bar.y - bar.h / 2, width: bar.w, height: bar.h };
                if (rectIntersect({ x: d.x - 6, y: d.y - 6, width: 12, height: 12 }, barBox)) {
                    hitBarricade = true;
                    playSound('rockHit');
                    for (let k = 0; k < 5; k++) {
                        voidExplosions.push({
                            x: d.x, y: d.y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: (Math.random() - 0.5) * 4,
                            timer: 10,
                            isWhite: false,
                            isStone: true
                        });
                    }
                    break;
                }
            }
            if (hitBarricade) {
                blackDaggers.splice(i, 1);
                continue;
            }
        }

        if (d.deflected === 1 && rectIntersect({x: d.x-5, y: d.y-5, width: 10, height: 10}, boss)) {
            if (Math.random() < 0.2) { 
                d.vx = -d.vx * 1.5; d.vy = -d.vy * 1.5; d.deflected = 2; 
                triggerVibration('clash'); triggerShake(4, 5); playSound('parry'); freezeFrames = 5; 
            } else {
                if (tryDamageBoss(d.isShuriken ? (d.dmg || 2) : 2, null)) {
                    if (!d.isShuriken && !["HIDDEN_PAUSE", "AOE", "PARRY_COUNTER_WINDUP"].includes(boss.state)) { 
                        boss.state = "TIED"; boss.color = "blue"; boss.stateTimer = 60; boss.vx = 0; 
                    }
                    blackDaggers.splice(i, 1);
                }
            }
            continue;
        }

        if (d.deflected !== 1) {
            for (let p of players) {
                if (!p.tied && !p.isDowned && p.hp > 0 && rectIntersect(p, {x: d.x-5, y: d.y-5, width: 10, height: 10}) && p.invuln <= 0) {
                    let wasH = p.isHealing;
                    if (d.isShuriken) {
                        takeDamage(p, d.dmg !== undefined ? d.dmg : 2); applyBleed(p); blackDaggers.splice(i, 1); freezeFrames = 5;
                    } else {
                        p.tied = true; p.tieClicks = 0; 
                        if (secretMode) sharedHitCount = Math.max(0, sharedHitCount - 1); 
                        else sharedHeals = Math.max(0, sharedHeals - 1); 
                        if (d.dmg > 0) { takeDamage(p, d.dmg); freezeFrames = 5; }
                        blackDaggers.splice(i, 1); 
                    }
                    if (wasH) triggerVibration('heal_interrupt'); else triggerVibration('damage'); 
                    triggerShake(3, 10);
                    break;
                }
            }
        }
    }

    // Air blades
    for (let i = airBlades.length - 1; i >= 0; i--) {
        let b = airBlades[i];
        if (b.state === "HOVER") {
            b.timer--;
            if (b.timer <= 0) { 
                b.state = "SHOOT"; 
                let t = getNearestPlayer(b.x); 
                let dx = (t.x + 15) - b.x; 
                let dy = (t.y + 25) - b.y; 
                let dist = Math.hypot(dx, dy); 
                b.vx = (dx/dist) * 14; 
                b.vy = (dy/dist) * 14; 
                playSound('throw'); 
            }
        } else if (b.state === "SHOOT") {
            b.x += b.vx; b.y += b.vy; 
            
            if (b.deflected === 1 && rectIntersect({x: b.x-8, y: b.y-8, width: 16, height: 16}, boss)) {
                if (Math.random() < 0.2) { 
                    b.vx = -b.vx * 1.5; b.vy = -b.vy * 1.5; b.deflected = 2; 
                    triggerVibration('clash'); triggerShake(4, 5); playSound('parry'); freezeFrames = 5;
                } else { 
                    if (tryDamageBoss(2, null)) airBlades.splice(i, 1);
                }
                continue;
            }

            let hitP = false;
            if (b.deflected !== 1) {
                for (let p of players) { 
                    if (!p.isDowned && p.hp > 0 && rectIntersect(p, {x: b.x-8, y: b.y-8, width: 16, height: 16}) && p.invuln <= 0 && boss.state !== "DEFEATED") { 
                        let wasH = p.isHealing; takeDamage(p, secretMode ? 2 : 1.5); applyBleed(p); airBlades.splice(i, 1); hitP = true; freezeFrames = 5;
                        if (wasH) triggerVibration('heal_interrupt'); else triggerVibration('damage'); 
                        triggerShake(3, 10);
                        break; 
                    } 
                }
            }
            if (hitP) continue;
            if (b.y >= FLOOR || b.x <= 0 || b.x >= ARENA_W) airBlades.splice(i, 1);
        } else if (b.state === "STUCK") { 
            b.timer--; if (b.timer <= 0) airBlades.splice(i, 1); 
        }
    }

    // Phantoms
    for (let i = phantoms.length - 1; i >= 0; i--) {
        let ph = phantoms[i]; ph.timer--; ph.stateTimer--;
        if (ph.state === "LUNGE_WINDUP" && ph.stateTimer <= 0) { ph.state = "LUNGE"; ph.stateTimer = 15; ph.vx = ph.x < ph.target.x ? 18 : -18; } 
        else if (ph.state === "LUNGE" && ph.stateTimer <= 0) { ph.state = "IDLE"; ph.stateTimer = 30; ph.vx = 0; } 
        else if (ph.state === "IDLE" && ph.stateTimer <= 0) { ph.state = "LUNGE_WINDUP"; ph.stateTimer = 20; ph.target = getNearestPlayer(ph.x); }
        ph.x += ph.vx; ph.facingRight = ph.x < ph.target.x;
        if (ph.x < 0) ph.x = 0; if (ph.x > ARENA_W - ph.width) ph.x = ARENA_W - ph.width;
        if (ph.state === "LUNGE") {
            for (let p of players) {
                if (!p.isDowned && p.hp > 0 && rectIntersect(p, ph) && p.invuln <= 0 && !p.isPhantomHit) { 
                    let wasH = p.isHealing; takeDamage(p, secretMode ? 2.5 : 2.5); p.isPhantomHit = true; freezeFrames = 5;
                    if (wasH) triggerVibration('heal_interrupt'); else triggerVibration('damage'); 
                    triggerShake(3, 10);
                }
            }
        } else { 
            for (let p of players) p.isPhantomHit = false; 
        }
        if (ph.timer <= 0 || boss.state === "DEFEATED") phantoms.splice(i, 1);
    }

    // Arena leaves or Fire Boss ash particles
    if (window.isFireBossMode) {
        updateAshParticles();
    } else {
        for (let l of arenaLeaves) {
            l.x += Math.sin(Date.now()/1000 + l.spin*100) * 0.5 + l.vx; 
            if (globalWindMode === "DOWN") { l.vy = 8 + Math.random() * 4; l.vx = (Math.random() - 0.5) * 2; } 
            else if (globalWindMode === "UP") { l.vy = -8 - Math.random() * 4; l.vx = (Math.random() - 0.5) * 2; } 
            else { l.vy += 0.05; if (l.vy > 2) l.vy *= 0.95; }
            l.y += l.vy; l.angle += l.spin; l.vx *= 0.9; 
            if (l.y > FLOOR + 10) { l.y = -10; l.x = Math.random() * ARENA_W; l.vx = 0; if (globalWindMode === "NONE") l.vy = Math.random() * 0.5 + 0.2; }
            if (l.y < -20) { l.y = FLOOR + 10; l.x = Math.random() * ARENA_W; l.vx = 0; } 
            if (l.x > ARENA_W+10) l.x = -10; if (l.x < -10) l.x = ARENA_W+10;
        }
    }

    // Scream rings
    for (let i = screamRings.length - 1; i >= 0; i--) { 
        let sr = screamRings[i]; sr.r += 15; 
        if (sr.r > sr.maxR) screamRings.splice(i, 1); 
    }

    // Chaos balls (Шарики пустоты в 3 фазе L-режима: больше шариков, умножение при мега-ударе босса)
    if (secretMode && boss.phase >= 3 && !boss.state.startsWith("L_INTRO")) {
        let count = (typeof ambientVoidOrbsMultiplier !== 'undefined' && ambientVoidOrbsMultiplier > 1) ? 3 : 1;
        for (let c = 0; c < count; c++) {
            if (Math.random() < 0.40) { 
                let spawnCorner = Math.random() < 0.70;
                let spawnX = spawnCorner ? (Math.random() < 0.5 ? Math.random() * 280 : ARENA_W - Math.random() * 280) : (280 + Math.random() * (ARENA_W - 560));
                let fromTop = Math.random() < 0.25;
                chaosBalls.push({ 
                    x: spawnX, 
                    y: fromTop ? (camY - 30) : (camY + GAME_HEIGHT + 40), 
                    vx: (Math.random() - 0.5) * 2.2, 
                    vy: fromTop ? (1 + Math.random() * 2.2) : (-1 - Math.random() * 3), 
                    r: 7 + Math.random() * 11 
                }); 
            }
        }
    }
    for (let i = chaosBalls.length - 1; i >= 0; i--) {
        let cb = chaosBalls[i];
        cb.x += cb.vx; cb.y += cb.vy;
        if (cb.y < camY - 50 || cb.y > camY + GAME_HEIGHT + 60 || cb.x < -50 || cb.x > ARENA_W + 50) chaosBalls.splice(i, 1);
    }

    // Step dust puffs
    if (typeof stepPuffs !== 'undefined') {
        for (let i = stepPuffs.length - 1; i >= 0; i--) {
            let sp = stepPuffs[i];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.r += 0.15;
            sp.alpha -= 0.04;
            if (sp.alpha <= 0) stepPuffs.splice(i, 1);
        }
    }

    // Void portals
    for (let i = voidPortals.length - 1; i >= 0; i--) {
        let pt = voidPortals[i]; pt.timer--;
        if (pt.timer <= 0) {
            let nearest = getNearestPlayer(pt.x); 
            let dx = (nearest.x + nearest.width/2) - pt.x; 
            let dy = (nearest.y + nearest.height/2) - pt.y; 
            let dist = Math.hypot(dx, dy);
            blackDaggers.push({ 
                x: pt.x, y: pt.y, 
                vx: (dx/dist) * 14, vy: (dy/dist) * 14, 
                isShuriken: pt.type === "SHURIKEN", 
                isSecret: true, 
                dmg: pt.type === "SHURIKEN" ? 2 : 0.5, 
                deflected: 0, 
                infected: boss.hunterInfected > 0 
            });
            playSound('throw'); 
            voidPortals.splice(i, 1);
        }
    }

    // Looms
    if (!secretMode) {
        for (let i = looms.length - 1; i >= 0; i--) {
            let lm = looms[i]; lm.timer--;
            if (lm.timer > 0 && lm.timer % 90 === 0) { 
                let target = getNearestPlayer(lm.x); 
                let dx = (target.x + target.width/2) - lm.x; 
                let dy = (target.y + target.height/2) - lm.y; 
                let dist = Math.hypot(dx, dy);
                blackDaggers.push({ 
                    x: lm.x, y: lm.y, 
                    vx: (dx/dist) * 11, vy: (dy/dist) * 11, 
                    isShuriken: false, isSecret: false, 
                    dmg: 0, deflected: 0, infected: false 
                }); 
                playSound('throw');
            }
            if (lm.timer <= 0) looms.splice(i, 1);
        }
    } else { 
        looms = []; 
    }

    // Void explosions (clean update in all states, prevents lingering circles)
    for (let i = voidExplosions.length - 1; i >= 0; i--) {
        let e = voidExplosions[i];
        if (e.vx) e.x += e.vx;
        if (e.vy) e.y += e.vy;
        e.timer--;
        if (e.timer <= 0) voidExplosions.splice(i, 1);
    }

    // Loom Threads (Нить станка: полет из станка к боссу со скоростью 20, 2 урона + 4с дебаффа)
    for (let i = loomThreads.length - 1; i >= 0; i--) {
        let lt = loomThreads[i];
        if (lt.active) {
            lt.trail.push({ x: lt.x, y: lt.y });
            if (lt.trail.length > 8) lt.trail.shift();

            if (boss.state !== "DEFEATED" && boss.state !== "INACTIVE") {
                let dx = (boss.x + boss.width/2) - lt.x;
                let dy = (boss.y + boss.height/2) - lt.y;
                let dist = Math.hypot(dx, dy) || 1;
                lt.vx = (lt.vx * 0.8) + ((dx / dist) * 20 * 0.2);
                lt.vy = (lt.vy * 0.8) + ((dy / dist) * 20 * 0.2);
            }
            lt.x += lt.vx;
            lt.y += lt.vy;

            if (lt.x < -100 || lt.x > ARENA_W + 100 || lt.y < -2000 || lt.y > FLOOR + 400) {
                loomThreads.splice(i, 1);
                continue;
            }

            let hitBox = { x: lt.x - 8, y: lt.y - 8, width: 16, height: 16 };
            if (rectIntersect(hitBox, boss) && boss.state !== "TRANSITION" && boss.state !== "DEFEATED" && !boss.state.startsWith("TELEPORT")) {
                let caster = players.find(pl => pl.id === lt.pId);
                tryDamageBoss(2, caster); // 2 урона боссу
                boss.lightInfected = 240; // 4 секунды заражения светом
                boss.lightInfectedDmgRed = 0.5; // -0.5 урона босса
                boss.color = "#00ffff";
                playSound('hitBoss');
                playSound('slash');
                triggerShake(6, 10);
                triggerVibration('sa_hit');
                voidExplosions.push({ x: lt.x, y: lt.y, timer: 15, isWhite: true, r: 40 });
                loomThreads.splice(i, 1);
            }
        }
    }

    // Light Amulet Waves
    for (let i = lightAmuletWaves.length - 1; i >= 0; i--) {
        let w = lightAmuletWaves[i];
        w.r += (w.maxR - w.r) * 0.22;
        w.timer--;
        if (w.timer <= 0) lightAmuletWaves.splice(i, 1);
    }

    // Falling Boulders (Камнепад Бездны в 3 фазе L-режима)
    for (let i = fallingBoulders.length - 1; i >= 0; i--) {
        let b = fallingBoulders[i];
        if (b.delay > 0) {
            b.delay--;
            continue;
        }
        b.y += b.vy;
        b.vy = Math.min(26, b.vy + 0.9);
        
        let bw = isFinite(b.w) && b.w > 0 ? b.w : 76;
        let bh = isFinite(b.h) && b.h > 0 ? b.h : 52;
        let bHit = { x: b.x - bw / 2, y: b.y - bh / 2, width: bw, height: bh };
        for (let p of players) {
            if (p.hp > 0 && !p.isDowned && p.invuln <= 0 && rectIntersect(p, bHit)) {
                takeDamage(p, 2.5, false, false, false, false, true, false); // isBoulder = true, does NOT deduct heal charges!
                triggerShake(18, 22);
                triggerVibration('sa_hit');
                playSound('hitBoss');
                playSound('rockHit');
            }
        }

        if (b.y >= FLOOR - bh / 2) {
            b.y = FLOOR - bh / 2;
            triggerShake(14, 18);
            playSound('stoneThud');
            playSound('break');
            for (let k = 0; k < 12; k++) {
                voidExplosions.push({
                    x: b.x + (Math.random() - 0.5) * bw,
                    y: FLOOR - 10,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 6,
                    timer: 18,
                    isWhite: false,
                    isStone: true
                });
            }
            arenaBarricadeBoulders.push({
                x: b.x,
                y: b.y,
                w: bw,
                h: bh,
                imgIdx: isFinite(b.imgIdx) ? b.imgIdx : 0,
                timer: 480, // 8 секунд баррикады
                maxTimer: 480
            });
            fallingBoulders.splice(i, 1);
        }
    }

    // Arena Barricade Boulders
    for (let i = arenaBarricadeBoulders.length - 1; i >= 0; i--) {
        let bar = arenaBarricadeBoulders[i];
        bar.timer--;
        if (bar.timer <= 0) {
            let bw = isFinite(bar.w) && bar.w > 0 ? bar.w : 76;
            let bh = isFinite(bar.h) && bar.h > 0 ? bar.h : 52;
            for (let k = 0; k < 8; k++) {
                voidExplosions.push({
                    x: bar.x + (Math.random() - 0.5) * bw,
                    y: bar.y + (Math.random() - 0.5) * bh,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -Math.random() * 4,
                    timer: 15,
                    isWhite: false,
                    isStone: true
                });
            }
            arenaBarricadeBoulders.splice(i, 1);
        }
    }

    // Void Puddles (Фиолетовые лужи Бездны)
    for (let i = voidPuddles.length - 1; i >= 0; i--) {
        let pud = voidPuddles[i];
        pud.timer = (pud.timer || 720) - 1;
        let pr = isFinite(pud.r) && pud.r > 0 ? pud.r : 25;
        let maxR = isFinite(pud.maxR) && pud.maxR > 0 ? pud.maxR : 95;
        if (pr < maxR) {
            pud.r = pr + (pud.spreadSpeed || 0.08);
        }
        for (let p of players) {
            if (p.hp > 0 && !p.isDowned && p.invuln <= 0 && p.y >= FLOOR - 55) {
                let pMidX = p.x + p.width / 2;
                if (Math.abs(pMidX - pud.x) < pr) {
                    let dmg = (p.type === 'WATER' && p.stance === 'DEMON') ? 0.5 : 1.5;
                    teamHallucinationHits = getHallucinationThreshold();
                    for (let pl of players) pl.hallucinationHits = teamHallucinationHits;
                    takeDamage(p, dmg, false, false, false, true);
                    triggerShake(12, 16);
                    triggerVibration('damage');
                    playSound('voidWhisper');
                }
            }
        }
        if (pud.timer <= 0) {
            voidPuddles.splice(i, 1);
        }
    }

    // Void Ceiling Drips
    if (secretMode && boss.phase >= 3 && !boss.state.startsWith("L_INTRO")) {
        let dripChance = (boss.phase === 3 && boss.hp <= phase3Hp * 0.5) ? 0.25 : 0.08;
        if (Math.random() < dripChance) {
            voidCeilingDrips.push({
                x: 40 + Math.random() * (ARENA_W - 80),
                y: -10,
                vy: 2 + Math.random() * 3,
                length: 8 + Math.random() * 12,
                r: 2 + Math.random() * 2
            });
        }
    }
    for (let i = voidCeilingDrips.length - 1; i >= 0; i--) {
        let dr = voidCeilingDrips[i];
        dr.y += dr.vy;
        dr.vy += 0.15;
        if (dr.y >= FLOOR - 5) {
            for (let k = 0; k < 3; k++) {
                voidExplosions.push({
                    x: dr.x,
                    y: FLOOR - 2,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -Math.random() * 2,
                    timer: 8,
                    isWhite: false,
                    isDrip: true
                });
            }
            voidCeilingDrips.splice(i, 1);
        }
    }

    // Abyss Goo cinematic timer & right wall break
    if (gooCinematicTimer > 0) {
        gooCinematicTimer--;
        if (gooCinematicTimer === 120) {
            abyssRightWallBroken = true;
            abyssGooFloorActive = true;
            triggerShake(45, 45);
            triggerVibration('l_mode_final');
            playSound('break');
            playSound('waterSplash');
            // Обсидиановые боевые платформы по всей арене (2500 px):
            platforms = [
                { x: 140,  y: FLOOR - 95,  w: 190, h: 14, isObsidian: true },
                { x: 430,  y: FLOOR - 150, w: 190, h: 14, isObsidian: true },
                { x: 720,  y: FLOOR - 100, w: 190, h: 14, isObsidian: true },
                { x: 1010, y: FLOOR - 155, w: 210, h: 14, isObsidian: true },
                { x: 1310, y: FLOOR - 100, w: 200, h: 14, isObsidian: true },
                { x: 1600, y: FLOOR - 150, w: 210, h: 14, isObsidian: true },
                { x: 1900, y: FLOOR - 95,  w: 200, h: 14, isObsidian: true },
                { x: 2190, y: FLOOR - 145, w: 200, h: 14, isObsidian: true }
            ];
            // Мгновенное спасение игроков на платформы, чтобы никто не оказался в жиже!
            for (let p of players) {
                if (p.hp > 0 && !p.isDowned) {
                    let bestPlat = platforms.reduce((closest, pl) => {
                        return Math.abs((pl.x + pl.w / 2) - p.x) < Math.abs((closest.x + closest.w / 2) - p.x) ? pl : closest;
                    }, platforms[0]);
                    if (bestPlat) {
                        p.x = bestPlat.x + bestPlat.w / 2 - p.width / 2;
                        p.y = bestPlat.y - p.height;
                        p.vx = 0;
                        p.vy = 0;
                        p.lastSafeX = p.x;
                        p.lastSafeY = p.y;
                        p.invuln = 180; // 3 секунды честной неуязвимости
                    }
                }
            }
            for (let k = 0; k < 35; k++) {
                voidExplosions.push({
                    x: ARENA_W - 40,
                    y: FLOOR - 50 + (Math.random() - 0.5) * 120,
                    vx: -4 - Math.random() * 12,
                    vy: (Math.random() - 0.5) * 8,
                    timer: 35,
                    isWhite: false,
                    isGoo: true
                });
            }
        }
        if (gooCinematicTimer === 0) {
            // Завершение показа прорыва Бездны: еще раз проверяем, что все игроки на платформах
            for (let p of players) {
                if (p.hp > 0 && !p.isDowned && p.y >= FLOOR - 40) {
                    let bestPlat = platforms.reduce((closest, pl) => {
                        return Math.abs((pl.x + pl.w / 2) - p.x) < Math.abs((closest.x + closest.w / 2) - p.x) ? pl : closest;
                    }, platforms[0]);
                    if (bestPlat) {
                        p.x = bestPlat.x + bestPlat.w / 2 - p.width / 2;
                        p.y = bestPlat.y - p.height;
                        p.vx = 0;
                        p.vy = 0;
                        p.lastSafeX = p.x;
                        p.lastSafeY = p.y;
                        p.invuln = 90;
                    }
                }
            }
        }
    }

    // Abyss Goo solidifying in Phase 4
    if (abyssGooSolidifying) {
        abyssGooSolidifyTimer--;
        if (abyssGooSolidifyTimer <= 0) {
            abyssGooSolidifying = false;
            abyssGooSolidified = true;
            abyssGooFloorActive = false;
            triggerShake(20, 25);
            playSound('stoneThud');
            playSound('lightChime');
        }
    }

    // Falling Banana Peels
    updateFallingBananaPeels();
}

function updateWaterRopes() {
    for (let p of players) {
        if (p.type === 'WATER_ROPE' && p.ropeActive && p.ropeA && p.ropeB) {
            p.ropeDrainTimer--;
            if (p.ropeDrainTimer <= 0) {
                let isLimited = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal);
                let canAfford = isLimited ? (sharedHealPoints >= 1) : ((sharedHeals * 8 + sharedHitCount) >= 1);
                if (canAfford) {
                    if (isLimited) {
                        sharedHealPoints -= 1;
                        sharedHitCount = sharedHealPoints % 8;
                        sharedHeals = Math.floor(sharedHealPoints / 8);
                    } else {
                        let totalHits = sharedHeals * 8 + sharedHitCount - 1;
                        sharedHeals = Math.floor(totalHits / 8);
                        sharedHitCount = totalHits % 8;
                    }
                    p.ropeDrainTimer = 120; // 2 seconds between drains
                } else {
                    if (!p.ropeGracePeriod) p.ropeGracePeriod = 180;
                    p.ropeGracePeriod--;
                    if (p.ropeGracePeriod <= 0) {
                        p.ropeActive = false;
                        p.ropeA = null;
                        p.ropeB = null;
                        p.isRopeSliding = false;
                        p.ropeGracePeriod = 0;
                        playSound('break');
                        continue;
                    }
                }
            }

            if (boss.state !== "TRANSITION" && boss.state !== "DEFEATED" && !boss.state.startsWith("TELEPORT")) {
                let bossRect = { x: boss.x - 10, y: boss.y - 10, width: boss.width + 20, height: boss.height + 20 };
                let bx = boss.x + boss.width / 2;
                let by = boss.y + boss.height / 2;
                let dist = distToSegment({ x: bx, y: by }, p.ropeA, p.ropeB);
                let hitBoss = segmentIntersectsRect(bossRect, p.ropeA, p.ropeB) || dist < 50;

                if (hitBoss) {
                    boss.invuln = 0;
                    tryDamageBoss(1.25, p);
                    playSound('break');
                    playSound('hitBoss');
                    playSound('bladeSpin');
                    triggerShake(8, 14);
                    triggerVibration('sa_hit');

                    let dx = p.ropeB.x - p.ropeA.x;
                    let dy = p.ropeB.y - p.ropeA.y;
                    let len = Math.hypot(dx, dy) || 1;
                    let steps = Math.max(5, Math.floor(len / 35));
                    for (let s = 0; s <= steps; s++) {
                        let t = s / steps;
                        voidExplosions.push({
                            x: p.ropeA.x + dx * t,
                            y: p.ropeA.y + dy * t,
                            timer: 20,
                            isWhite: Math.random() > 0.5,
                            isOrange: false,
                            r: 30
                        });
                    }
                    p.ropeActive = false;
                    p.ropeA = null;
                    p.ropeB = null;
                    p.isRopeSliding = false;
                    p.ropeGracePeriod = 0;
                }
            }
        }
    }
}

function updateTutorialBoss() {
    if (boss.state === "INACTIVE" || boss.state === "DEFEATED") return;

    if (boss.invuln > 0) boss.invuln--;
    boss.stateTimer--;

    let p = players[0];
    if (!p) return;

    boss.facingDir = (p.x < boss.x) ? -1 : 1;

    if (boss.state === "IDLE") {
        boss.vx = 0;
        if (boss.stateTimer <= 0) {
            let dist = Math.abs(boss.x - p.x);
            let action = (Math.random() < 0.55 || dist > 350) ? "DASH_WINDUP" : "PORTAL_SHURIKEN";

            if (action === "DASH_WINDUP") {
                boss.state = "DASH_WINDUP";
                boss.stateTimer = 45; // Generous windup
            } else {
                boss.state = "PORTAL_SHURIKEN";
                boss.stateTimer = 50; // Generous windup
            }
        }
    } else if (boss.state === "DASH_WINDUP") {
        boss.vx = 0;
        boss.color = (Math.floor(boss.stateTimer / 5) % 2 === 0) ? "#ffffff" : "#9933ff";
        if (boss.stateTimer <= 0) {
            boss.state = "DASH";
            boss.stateTimer = 25;
            boss.color = "#9933ff";
            boss.vx = boss.facingDir * 7.5; // Slower dash (was 9.5)
            playSound('dash');
            voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 15, isWhite: false, r: 25 });
        }
    } else if (boss.state === "DASH") {
        boss.x += boss.vx;
        if (boss.x < 40) { boss.x = 40; boss.stateTimer = 0; }
        if (boss.x > ARENA_W - 70) { boss.x = ARENA_W - 70; boss.stateTimer = 0; }

        if (rectIntersect(boss, p) && p.invuln <= 0 && !p.isDowned) {
            takeDamage(p, 1.0); // 1.0 dmg (was 1.5)
            triggerShake(4, 8);
            triggerVibration('damage');
        }

        if (boss.stateTimer <= 0) {
            boss.state = "RECOVER";
            boss.stateTimer = 45; // Longer pause to strike back
            boss.vx = 0;
        }
    } else if (boss.state === "PORTAL_SHURIKEN") {
        boss.vx = 0;
        boss.color = "#9933ff";
        if (boss.stateTimer === 24) {
            playSound('throw');
            let sx = boss.x + (boss.facingDir > 0 ? 40 : -10);
            let sy = boss.y + 15;
            voidExplosions.push({ x: sx, y: sy, timer: 20, isWhite: true, r: 18 });
            let angle = Math.atan2((p.y + 20) - sy, (p.x + 15) - sx);
            let spd = 5.0; // Slower shuriken (was 6.5)
            blackDaggers.push({
                x: sx,
                y: sy,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                isShuriken: true,
                dmg: 0.75, // 0.75 dmg (was 1.0)
                deflected: 0
            });
        }
        if (boss.stateTimer <= 0) {
            boss.state = "RECOVER";
            boss.stateTimer = 40;
        }
    } else if (boss.state === "RECOVER") {
        boss.vx = 0;
        boss.color = "#9933ff";
        if (boss.stateTimer <= 0) {
            boss.state = "IDLE";
            boss.stateTimer = 40 + Math.floor(Math.random() * 25);
        }
    }

    boss.y = FLOOR - boss.height;
}

function updateTutorial() {
    let p = players[0];
    if (!p) return;

    if (tutorialStep === 'WALK') {
        for (let i = tutorialDots.length - 1; i >= 0; i--) {
            let dot = tutorialDots[i];
            if (Math.hypot((p.x + p.width/2) - dot.x, (p.y + p.height/2) - dot.y) < 45) {
                tutorialDots.splice(i, 1);
                playSound('lightChime');
                voidExplosions.push({ x: dot.x, y: dot.y, timer: 15, isWhite: true, r: 16 });
            }
        }
        if (tutorialDots.length === 0) {
            tutorialStep = 'JUMP';
            playSound('heal');
            triggerShake(2, 5);
            tutorialDots = [
                { x: 320, y: FLOOR - 70 },
                { x: 500, y: FLOOR - 140 },
                { x: 680, y: FLOOR - 70 }
            ];
        }
    } else if (tutorialStep === 'JUMP') {
        for (let i = tutorialDots.length - 1; i >= 0; i--) {
            let dot = tutorialDots[i];
            if (Math.hypot((p.x + p.width/2) - dot.x, (p.y + p.height/2) - dot.y) < 45) {
                tutorialDots.splice(i, 1);
                playSound('lightChime');
                voidExplosions.push({ x: dot.x, y: dot.y, timer: 15, isWhite: true, r: 16 });
            }
        }
        if (tutorialDots.length === 0) {
            tutorialStep = 'DASH';
            playSound('heal');
            triggerShake(2, 5);
            tutorialDots = [
                { x: 220, y: FLOOR - 20 },
                { x: 500, y: FLOOR - 20 },
                { x: 780, y: FLOOR - 20 }
            ];
        }
    } else if (tutorialStep === 'DASH') {
        for (let i = tutorialDots.length - 1; i >= 0; i--) {
            let dot = tutorialDots[i];
            if (Math.hypot((p.x + p.width/2) - dot.x, (p.y + p.height/2) - dot.y) < 45) {
                tutorialDots.splice(i, 1);
                playSound('lightChime');
                voidExplosions.push({ x: dot.x, y: dot.y, timer: 15, isWhite: true, r: 16 });
            }
        }
        if (tutorialDots.length === 0) {
            tutorialStep = 'WALL';
            playSound('heal');
            triggerShake(2, 5);
            tutorialDots = [
                { x: 40, y: FLOOR - 130 },
                { x: 40, y: FLOOR - 240 },
                { x: ARENA_W - 40, y: FLOOR - 200 }
            ];
        }
    } else if (tutorialStep === 'WALL') {
        for (let i = tutorialDots.length - 1; i >= 0; i--) {
            let dot = tutorialDots[i];
            if (Math.hypot((p.x + p.width/2) - dot.x, (p.y + p.height/2) - dot.y) < 45) {
                tutorialDots.splice(i, 1);
                playSound('lightChime');
                voidExplosions.push({ x: dot.x, y: dot.y, timer: 15, isWhite: true, r: 16 });
            }
        }
        if (tutorialDots.length === 0) {
            tutorialStep = 'ATTACK';
            playSound('heal');
            triggerShake(2, 5);
            tutorialDots = [];
            tutorialTargets = [
                { x: 320, y: FLOOR - 30, r: 22 },
                { x: 500, y: FLOOR - 130, r: 22 },
                { x: 720, y: FLOOR - 30, r: 22 }
            ];
        }
    } else if (tutorialStep === 'ATTACK') {
        if (tutorialTargets.length === 0) {
            tutorialStep = 'HEAL';
            playSound('damage');
            triggerShake(5, 10);
            p.hp = 3; // Hurt player down to 3 HP
            sharedHeals = 4; // 4 heal charges available
            maxSharedHeals = 4;
            tutorialDots = [];
            tutorialTargets = [];
        }
    } else if (tutorialStep === 'HEAL') {
        if (p.hp >= 5) {
            tutorialStep = 'SPECIAL';
            playSound('heal');
            triggerShake(2, 5);
            tutorialDots = [];
            tutorialTargets = [
                { x: 260, y: FLOOR - 100, r: 24 },
                { x: 740, y: FLOOR - 100, r: 24 }
            ];
        }
    } else if (tutorialStep === 'SPECIAL') {
        if (tutorialTargets.length === 0) {
            tutorialStep = 'BOSS';
            playSound('demonRoar');
            triggerShake(6, 15);
            tutorialDots = [];
            tutorialTargets = [];
            boss.x = ARENA_W / 2;
            boss.y = FLOOR - 50;
            boss.hp = 7;
            boss.maxHp = 7;
            boss.color = "#9933ff";
            boss.state = "IDLE";
            boss.stateTimer = 60;
            sharedHeals = 4;
            maxSharedHeals = 4;
            voidExplosions.push({ x: boss.x + 15, y: boss.y + 25, timer: 30, isWhite: false, r: 50 });
        }
    } else if (tutorialStep === 'BOSS') {
        updateTutorialBoss();
        if (boss.hp <= 0 && boss.state !== "DEFEATED") {
            boss.state = "DEFEATED";
            boss.hp = 0;
            tutorialStep = 'COMPLETE';
            tutorialSubStep = 210;
            playSound('victory');
            triggerShake(8, 20);
            voidExplosions.push({ x: boss.x + 15, y: boss.y + 25, timer: 45, isWhite: true, r: 60 });
            unlockAchievement('tutorial_grad');
            let curU = getCurrentUser() || "Новичок";
            sendTelegramNotification(
                `🎓 <b>ОБУЧЕНИЕ ПРОЙДЕНО!</b>\n` +
                `👤 <b>Игрок:</b> ${curU}\n` +
                `⚔️ <i>Победил тренировочного манекена и изучил основы «Убежища»!</i>\n` +
                `⏰ <i>${new Date().toLocaleTimeString()}</i>`
            );
        }
    } else if (tutorialStep === 'COMPLETE') {
        tutorialSubStep--;
        if (tutorialSubStep <= 0) {
            isTutorial = false;
            gameState = "MENU";
            if (typeof sendPresencePing === 'function') sendPresencePing();
            let overlay = document.getElementById("overlay");
            if (overlay) overlay.style.display = "flex";
        }
    }
}

function update() {
    if (gameState !== "PLAYING") return;

    // Story Mode: Campaign update loop
    if (window.isStoryMode && typeof updateStoryMode === 'function') {
        updateStoryMode();
        return;
    }

    // 1. Update flying emoji reactions
    if (window.flyingReactions && window.flyingReactions.length > 0) {
        for (let i = window.flyingReactions.length - 1; i >= 0; i--) {
            let r = window.flyingReactions[i];
            r.x += r.vx;
            r.y += r.vy;
            r.opacity -= 0.012;
            if (r.opacity <= 0) {
                window.flyingReactions.splice(i, 1);
            }
        }
    }

    // Online Multiplayer: Guest Frame Handling (Smooth 60 FPS interpolation, zero local lag)
    if (window.isOnlineMatch && window.onlineNet && window.onlineNet.isActive && !window.onlineNet.isHost) {
        if (typeof window.onlineNet.updateGuestBattleFrame === 'function') {
            window.onlineNet.updateGuestBattleFrame();
        }
        return;
    }

    // Online Multiplayer: Host Frame Hook (broadcasts 60 FPS authoritative state to guest)
    if (window.isOnlineMatch && window.onlineNet && window.onlineNet.isActive && window.onlineNet.isHost) {
        if (typeof window.onlineNet.broadcastHostBattleFrame === 'function') {
            window.onlineNet.broadcastHostBattleFrame();
        }
    }

    // 2. Spectator Mode Update (Receives stream from host)
    if (window.spectatorMode) {
        let bs = window.broadcastState;
        if (bs && bs.p) {
            if (players.length === 0) {
                players.push(createPlayer(1, bs.p.type || 'WATER', {}, 'SPECTATOR', bs.p.x));
            }
            let p = players[0];
            p.x = bs.p.x;
            p.y = bs.p.y;
            p.vx = bs.p.vx;
            p.vy = bs.p.vy;
            p.hp = bs.p.hp;
            p.maxHp = bs.p.maxHp;
            p.facingRight = bs.p.facingRight;
            p.attackType = bs.p.attackType;
            p.attackTimer = bs.p.attackTimer;
            p.isHealing = bs.p.isHealing;
            p.isAoEHealing = bs.p.isAoEHealing;
            p.isFieryHealing = bs.p.isFieryHealing;
            p.isDashing = bs.p.isDashing;
            p.hasAegisShield = bs.p.hasAegisShield;
            p.hasFishScale = bs.p.hasFishScale;
            p.color = bs.p.color || p.color;
            p.type = bs.p.type || p.type;
        }
        if (bs && bs.boss) {
            boss.x = bs.boss.x;
            boss.y = bs.boss.y;
            boss.vx = bs.boss.vx;
            boss.vy = bs.boss.vy;
            boss.hp = bs.boss.hp;
            boss.maxHp = bs.boss.maxHp;
            boss.state = bs.boss.state;
            boss.color = bs.boss.color;
            boss.phase = bs.boss.phase;
        }
        if (bs && bs.cam) {
            camX = bs.cam.x;
            camY = bs.cam.y;
        }
        if (bs) {
            secretMode = !!bs.secretMode;
            if (bs.floor !== undefined) FLOOR = bs.floor;
        }
        return;
    }

    // 3. Host Broadcast Streaming
    if (window.isBroadcasting && players.length > 0) {
        let p = players[0];
        let snapshot = {
            p: {
                x: Math.round(p.x),
                y: Math.round(p.y),
                vx: Math.round(p.vx * 10) / 10,
                vy: Math.round(p.vy * 10) / 10,
                hp: p.hp,
                maxHp: p.maxHp,
                facingRight: p.facingRight,
                attackType: p.attackType,
                attackTimer: p.attackTimer,
                isHealing: p.isHealing,
                isAoEHealing: p.isAoEHealing,
                isFieryHealing: p.isFieryHealing,
                isDashing: p.isDashing,
                hasAegisShield: !!p.hasAegisShield,
                hasFishScale: !!p.hasFishScale,
                color: p.color,
                type: p.type
            },
            boss: {
                x: Math.round(boss.x),
                y: Math.round(boss.y),
                vx: Math.round(boss.vx * 10) / 10,
                vy: Math.round(boss.vy * 10) / 10,
                hp: boss.hp,
                maxHp: boss.maxHp,
                state: boss.state,
                color: boss.color,
                phase: boss.phase
            },
            cam: {
                x: Math.round(camX),
                y: Math.round(camY)
            },
            secretMode: secretMode,
            floor: FLOOR
        };
        pushBroadcastSnapshot(snapshot);
    }

    if (!isTutorial) {
        if (boss.hp <= 0 && boss.state !== "DEFEATED" && !boss.state.startsWith("CINEMATIC") && boss.state !== "FREE_ROAM" && !window.isFireBossMode && boss.state !== "FIRE_FINALE") { 
            checkPhaseTransition(); 
        }

        if (boss.state === "FREE_ROAM" || boss.state === "DEFEATED") {
            if (typeof recordBattleResult === 'function') recordBattleResult(true);
            if (window.isBroadcasting) stopBroadcast();
        }

        // Achievement: «Аптечный магнат» (Потратить все заряды исцеления быстрее, чем за 15 секунд)
        if (sharedHeals <= 0.05 && battleStartTime > 0 && !boss.healSpammerAwarded && boss.state !== "DEFEATED") {
            let elapsed = (Date.now() - battleStartTime) / 1000;
            if (elapsed <= 15) {
                boss.healSpammerAwarded = true;
                let curU = getCurrentUser();
                unlockAchievement('heal_spammer', curU);
                if (numPlayers === 2) {
                    let p2U = getP2User();
                    if (p2U && p2U.toLowerCase() !== 'гость') {
                        unlockAchievement('heal_spammer', p2U);
                    }
                }
            }
        }
    }

    if (players.some(p => p.hp <= 0 && (!p.isDowned || p.downedTimer <= 0))) { 
        gameState = "GAMEOVER"; 
        if (typeof recordBattleResult === 'function') recordBattleResult(false);
        if (typeof sendPresencePing === 'function') sendPresencePing();
        if (window.isBroadcasting) stopBroadcast();
    }

    // Camera follow
    let shouldFollowCam = (secretMode || window.isFireBossMode || boss.state.startsWith("L_CLIMB") || boss.phase >= 2.5) && (!secretMode ? boss.state !== "SA1_ACTIVE" : true);
    if (activeCinematic) {
        // Во время катсцены камера сохраняет свои текущие координаты, не сбрасываясь в 0!
    } else if (gooCinematicTimer > 0) {
        // Камера сама перемещается к правой стене, где лопается стена и хлещет жижа!
        let targetCamX = Math.max(0, ARENA_W - GAME_WIDTH);
        let targetCamY = Math.min(Math.max(FLOOR - GAME_HEIGHT / 2 - 80, -2000), FLOOR - GAME_HEIGHT + 100);
        camX += (targetCamX - camX) * 0.08;
        camY += (targetCamY - camY) * 0.08;
    } else if (shouldFollowCam) {
        if (window.isFireBossMode) {
            if (boss && boss.state === "FIRE_INTRO") {
                let targetCamX = (ARENA_W - GAME_WIDTH) / 2; // exact center of arena
                let targetCamY = FLOOR - 350; // 170: perfectly frames ground
                camX += (targetCamX - camX) * 0.1;
                camY += (targetCamY - camY) * 0.1;
            } else {
                let p1 = players[0];
                let pMidX = p1 ? (p1.x + p1.width / 2) : 750;
                let bMidX = boss ? (boss.x + boss.width / 2) : 750;
                let midBetweenBoth = (pMidX + bMidX) * 0.5; // точка между водой и огнем
                let focusX = (pMidX + midBetweenBoth) * 0.5; // между водой и точкой между водой и огнем
                let targetCamX = focusX - GAME_WIDTH / 2;
                if (targetCamX < 0) targetCamX = 0;
                if (targetCamX > ARENA_W - GAME_WIDTH) targetCamX = ARENA_W - GAME_WIDTH;
                camX += (targetCamX - camX) * 0.08;

                let pMidY = p1 ? (p1.y + p1.height / 2) : (FLOOR - 25);
                let bMidY = boss ? (boss.y + boss.height / 2) : (FLOOR - 25);
                let midY = (pMidY + bMidY) * 0.5;
                let targetCamY = midY - GAME_HEIGHT / 2 - 20;
                if (targetCamY < 0) targetCamY = 0;
                let maxCamY = FLOOR - 340; // keeps floor visible
                if (targetCamY > maxCamY) targetCamY = maxCamY;
                camY += (targetCamY - camY) * 0.08;
            }
        } else {
            let ax = 0, ay = 0, c = 0;
            for (let p of players) { 
                if (p.hp > 0 && !p.isDowned) { ax += p.x; ay += p.y; c++; } 
            }
            if (c > 0) { ax /= c; ay /= c; }
            if (ARENA_W > GAME_WIDTH) {
                camX += (ax - GAME_WIDTH/2 - camX) * 0.1; 
                if (camX < 0) camX = 0; 
                if (camX > ARENA_W - GAME_WIDTH) camX = ARENA_W - GAME_WIDTH;
            } else {
                camX = 0;
            }
            let isFallingTransition = (boss.state === "L_CLIMB_TRANSITION" && boss.transitionTimer < 120);
            let lerpY = isFallingTransition ? 0.35 : 0.1;
            camY += (ay - GAME_HEIGHT/2 - camY) * lerpY;
            let minCamY = -2000;
            if (camY < minCamY) camY = minCamY;
            let maxCamY = isFallingTransition ? 99999 : (FLOOR - GAME_HEIGHT + 100);
            if (camY > maxCamY && maxCamY > 0) camY = maxCamY;
        }
    } else { 
        camX = 0; camY = 0; 
    }

    if (boss.hunterInfected > 0) {
        boss.hunterInfected--;
        if (boss.hunterInfected % 60 === 0) { 
            boss.hp -= 1; 
            playSound('hitBoss'); 
            checkPhaseTransition(); 
        }
    }

    if (activeCinematic) {
        activeCinematic.tick++; 
        activeCinematic.timer--;
        if (activeCinematic.type === 'SA1' && activeCinematic.isReal) { 
            // 6 визуальных ударов босса, урон наносится порциями по 1 на тиках 22, 42, 62
            if (activeCinematic.tick === 22 || activeCinematic.tick === 42 || activeCinematic.tick === 62) { 
                activeCinematic.p.invuln = 0; 
                takeDamage(activeCinematic.p, 1); 
                triggerShake(activeCinematic.tick === 62 ? 22 : 16, 18); 
                triggerVibration('sa_hit'); 
                playSound('slash');
            } 
            if (activeCinematic.tick % 5 === 0) triggerVibration('damage'); 
        }
        if (activeCinematic.type === 'SA2') { 
            // Первые 0.26 сек (15 тиков) статично видим только себя.
            // На 16 тике босс прорезает игрока: 3 УРОНА СРАЗУ!
            if (activeCinematic.tick === 16) { 
                activeCinematic.p.invuln = 0; 
                takeDamage(activeCinematic.p, 3); 
                triggerShake(20, 24); 
                triggerVibration('sa_hit'); 
                playSound('slash');
            } 
            if (activeCinematic.tick > 16 && activeCinematic.tick % 5 === 0) triggerVibration('damage'); 
        }
        if (activeCinematic.type === 'SA3') { 
            // Первые 0.4 сек (24 тика) статично видим только себя.
            // На 25 тике босс прорезает игрока: БЕСКОНЕЧНЫЙ УРОН (фатальный удар)!
            if (activeCinematic.tick === 25) { 
                if (!godModeActive && !window.godModeActive) {
                    takeDamage(activeCinematic.p, 9999, false, false, true);
                    if (activeCinematic.p.hp <= 0) {
                        activeCinematic.p.hp = 0; 
                        activeCinematic.p.purpleHp = 0;
                        activeCinematic.p.orangeHp = 0;
                        activeCinematic.p.isDowned = false; 
                    } else {
                        // Щит «Треснувшая жизнь» спас игрока от фатального удара SA3!
                        activeCinematic.p.invuln = 120; // 2 секунды неуязвимости
                        activeCinematic.p.voidDamageTimer = 0;
                        activeCinematic.p.purpleHp = 0;
                    }
                }
                triggerShake(28, 38); 
                triggerVibration('sa_hit'); 
                playSound('demonRoar');
            } 
            if (activeCinematic.tick > 25 && activeCinematic.tick % 5 === 0) triggerVibration('damage'); 
        }
        if (activeCinematic.timer <= 0) {
            let targetP = activeCinematic.p; 
            activeCinematic = null;

            // Если идет паркур по платформам (переход в 3 фазу):
            if (boss.state === "L_CLIMB_TRANSITION" || boss.state.startsWith("L_CLIMB") || boss.phase === 2.5) {
                // Босс остается за экраном, НЕ прилетает на платформы!
                boss.x = -99999;
                boss.y = -99999;
                boss.vx = 0;
                boss.vy = 0;
                boss.state = "L_CLIMB_ACTIVE";
                boss.invuln = 99999;
                boss.saLines = null; // Обязательно очищаем луч, чтобы не было повторного урона!
                boss.climbSaTimer = -120; // Даем игроку целых 4-5 секунд передышки перед следующей атакой!
                for (let p of players) {
                    p.saHit = false;
                    p.invuln = 180; // 3 секунды честной неуязвимости
                }

                // Игрок продолжает карабкаться по платформам:
                // Спасаем игрока от падения в бездну сразу после завершения катсцены
                if (targetP && targetP.hp > 0 && !targetP.isDowned) {
                    targetP.vx = 0;
                    targetP.vy = 0;
                    let bestPlat = null;
                    let bestDist = 999999;
                    for (let plat of platforms) {
                        let d = Math.hypot((plat.x + plat.w/2) - targetP.x, plat.y - targetP.y);
                        if (d < bestDist) { bestDist = d; bestPlat = plat; }
                    }
                    if (bestPlat) {
                        targetP.x = bestPlat.x + bestPlat.w / 2 - targetP.width / 2;
                        targetP.y = bestPlat.y - targetP.height;
                        targetP.lastSafeX = targetP.x;
                        targetP.lastSafeY = targetP.y;
                    }
                    // Мгновенно центрируем камеру на спасенном игроке, исключая ложный триггер бездны!
                    if (ARENA_W > GAME_WIDTH) {
                        camX = Math.min(Math.max(targetP.x - GAME_WIDTH / 2, 0), ARENA_W - GAME_WIDTH);
                    } else {
                        camX = 0;
                    }
                    camY = Math.min(Math.max(targetP.y - GAME_HEIGHT / 2, -2000), FLOOR - GAME_HEIGHT + 100);
                }
            } else if (boss.superQueue && boss.superQueue.length > 0) { 
                boss.state = "EXECUTE_QUEUE"; 
                boss.stateTimer = 60; // Честное окно в 1 сек между атаками очереди
                boss.saLines = null;
                for (let p of players) {
                    p.saHit = false;
                    p.invuln = 90; // 1.5 сек неуязвимости после выхода из катсцены
                }
            } else if (boss.halfHpSeqActive && secretMode && boss.phase === 3) {
                // Если катсцена сработала в цепочке 3 фазы L-режима, переходим к разгону и мега-удару по полу!
                boss.state = "SA1_MEGA_RISE";
                boss.stateTimer = 40;
                boss.vx = 0;
                boss.vy = -26;
                boss.x = ARENA_W / 2 - boss.width / 2;
                boss.y = FLOOR - boss.height - 20;
                boss.invuln = 99999;
                boss.sa1Arr = null;
                boss.saLines = null;
                for (let p of players) {
                    p.saHit = false;
                    p.invuln = 60;
                }
                playSound('wind');
                playSound('demonRoar');
                triggerShake(8, 12);
            } else { 
                boss.halfHpSeqActive = false; 
                boss.invuln = 0;
                let cX = boss.climbCenterX || (ARENA_W / 2);
                let spawnX = cX + (Math.random() - 0.5) * 400;
                boss.x = Math.max(60, Math.min(ARENA_W - 80, spawnX));
                boss.y = FLOOR - boss.height;
                boss.vx = 0;
                boss.vy = 0;
                boss.state = "IDLE"; 
                boss.color = "#e6c800"; 
                boss.stateTimer = 30; 
                boss.saLines = null;
                for (let p of players) {
                    p.saHit = false;
                    p.invuln = 60;
                }
                if (boss.phase === 3.5) boss.phase = 3;
            }
        }
        return; 
    }

    if (globalWindMode !== "NONE") { 
        globalWindTimer--; 
        if (globalWindTimer <= 0) { globalWindMode = "NONE"; globalWindCooldown = 900; } 
    } else if (globalWindCooldown > 0) globalWindCooldown--;
    
    currentGravity = globalWindMode === "UP" ? 0.3 : (globalWindMode === "DOWN" ? 0.9 : GRAVITY);
    jumpMod = globalWindMode === "UP" ? 1.3 : (globalWindMode === "DOWN" ? 0.6 : 1);

    if (typeof worldGravityTimer !== 'undefined' && worldGravityTimer > 0) {
        worldGravityTimer--;
        currentGravity *= (typeof worldGravityMod !== 'undefined' ? worldGravityMod : 1.0);
        jumpMod *= 1.3;
        if (worldGravityTimer <= 0) worldGravityMod = 1.0;
    }

    updatePlayers();
    updateProjectiles();
    updateWaterRopes();
    updateWorldEvents();
    updateBackgroundDust();
    if (typeof isTutorial !== 'undefined' && isTutorial) {
        updateTutorial();
    } else {
        updateBoss();
    }

    let voidVignette = document.getElementById('void-vignette');
    if (voidVignette) {
        let anyVoidDmg = players.some(p => p.voidDamageTimer > 0);
        voidVignette.style.opacity = anyVoidDmg ? "1" : "0";
    }
}

function updateBackgroundDust() {
    if (!backgroundDust || backgroundDust.length === 0) {
        if (typeof initBackgroundDust === 'function') initBackgroundDust();
        return;
    }
    let now = Date.now();
    for (let d of backgroundDust) {
        d.x += d.vx + Math.sin(now / 2200 + d.phase) * 0.16;
        d.y += d.vy;
        if (d.y < -350) {
            d.y = FLOOR + 60;
            d.x = Math.random() * ARENA_W;
        } else if (d.y > FLOOR + 100) {
            d.y = -250;
        }
        if (d.x < -100) d.x = ARENA_W + 80;
        if (d.x > ARENA_W + 100) d.x = -80;
    }
}

function drawAbyssFloorMirror() {
    if (!secretMode || boss.state.startsWith("L_CLIMB") || boss.phase === 2.5) return;
    
    let isPhase3 = (boss.phase === 3 || boss.state.startsWith("L_PHASE3") || boss.state.startsWith("SA") || boss.state === "VOID_SINK_STUN");
    let dirtiness = 0;
    if (isPhase3) {
        let p3Total = (typeof phase3Hp !== 'undefined' && phase3Hp > 0) ? phase3Hp : 40;
        let hpRatio = Math.max(0, Math.min(1, boss.hp / p3Total));
        // В начале 3 фазы пол уже грязный (0.52). К концу фазы становится еще грязнее (до 0.96)
        dirtiness = 0.52 + 0.44 * (1 - hpRatio);
    }

    ctx.save();
    // Область отражения — строго в пределах пола Бездны
    ctx.beginPath();
    ctx.rect(0, FLOOR, ARENA_W, 140);
    ctx.clip();

    // Вертикальное зеркальное отражение через линию FLOOR
    ctx.translate(0, 2 * FLOOR);
    ctx.scale(1, -1);
    
    // В 3 фазе отражает значительно слабее и угасает по мере загрязнения
    let reflAlpha = isPhase3 ? Math.max(0.02, 0.13 * (1 - (dirtiness - 0.52) / 0.48)) : 0.28;
    ctx.globalAlpha = reflAlpha;

    // Отражение босса
    if (boss.y + boss.height >= FLOOR - 160) {
        drawBoss();
    }
    // Отражение игроков
    for (let p of players) {
        if (p && p.y + p.height >= FLOOR - 140) {
            drawPlayer(p);
        }
    }

    ctx.restore();

    // Накладываем глубокий глянцевый градиент черного обсидианового стекла
    ctx.save();
    let glassGrad = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 100);
    if (!isPhase3) {
        glassGrad.addColorStop(0, "rgba(5, 2, 12, 0.45)");
        glassGrad.addColorStop(0.35, "rgba(3, 1, 8, 0.75)");
        glassGrad.addColorStop(1, "rgba(2, 0, 5, 0.98)");
    } else {
        // В 3 фазе стекло матовое, покрытое темным пеплом
        glassGrad.addColorStop(0, `rgba(10, 4, 14, ${0.7 + dirtiness * 0.25})`);
        glassGrad.addColorStop(0.35, `rgba(6, 2, 8, ${0.85 + dirtiness * 0.12})`);
        glassGrad.addColorStop(1, "rgba(2, 0, 4, 1.0)");
    }
    ctx.fillStyle = glassGrad;
    ctx.fillRect(0, FLOOR, ARENA_W, 140);

    // В 3 фазе: налет сажи, копоти и грязи на полу (становится всё грязнее)
    if (isPhase3 && dirtiness > 0) {
        ctx.save();
        // Темная зола и пепел
        for (let i = 0; i < 28; i++) {
            let sx = (i * 97) % ARENA_W;
            let sw = 45 + (i % 6) * 22;
            let sy = FLOOR + (i % 5) * 16;
            let sh = 10 + (i % 4) * 8;
            let sootAlpha = (0.25 + (i % 3) * 0.15) * dirtiness;
            ctx.fillStyle = `rgba(8, 4, 9, ${sootAlpha})`;
            ctx.fillRect(sx, sy, sw, sh);
        }
        // Трещинки и следы копоти на зеркале
        ctx.strokeStyle = `rgba(20, 10, 25, ${dirtiness * 0.8})`;
        ctx.lineWidth = 1.5;
        for (let j = 0; j < 12; j++) {
            let jx = (j * 211) % ARENA_W;
            ctx.beginPath();
            ctx.moveTo(jx, FLOOR);
            ctx.lineTo(jx + (j % 2 === 0 ? 15 : -15), FLOOR + 18 + (j % 3) * 10);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Зеркальная неоново-фиолетовая фаска на линии пола
    let rimAlpha = isPhase3 ? Math.max(0.1, 0.35 * (1 - (dirtiness - 0.52) / 0.48)) : 0.65;
    ctx.strokeStyle = `rgba(180, 100, 255, ${rimAlpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR);
    ctx.lineTo(ARENA_W, FLOOR);
    ctx.stroke();

    // Тонкий белый блик стекла (исчезает в 3 фазе под слоем грязи)
    if (!isPhase3 || dirtiness < 0.65) {
        let glintAlpha = isPhase3 ? (0.35 * (1 - dirtiness)) : 0.35;
        ctx.strokeStyle = `rgba(255, 255, 255, ${glintAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, FLOOR - 1);
        ctx.lineTo(ARENA_W, FLOOR - 1);
        ctx.stroke();
    }
    ctx.restore();
}

function drawFloorCracks() {
    if (!secretMode || !floorCracks || floorCracks.length === 0) return;
    ctx.save();
    for (let crack of floorCracks) {
        ctx.beginPath();
        let sx = isFinite(crack.x1) ? crack.x1 : (crack[0] ? crack[0].x : 0);
        let sy = isFinite(crack.y1) ? crack.y1 : (crack[0] ? crack[0].y : FLOOR);
        ctx.moveTo(sx, sy);
        let pts = crack.pts || (Array.isArray(crack) ? crack : null);
        if (pts && pts.length > 0) {
            for (let pt of pts) {
                if (pt && isFinite(pt.x) && isFinite(pt.y)) {
                    ctx.lineTo(pt.x, pt.y);
                }
            }
        }
        if (isFinite(crack.x2) && isFinite(crack.y2)) {
            ctx.lineTo(crack.x2, crack.y2);
        }
        ctx.strokeStyle = "rgba(160, 40, 255, 0.75)";
        ctx.lineWidth = isFinite(crack.width) ? crack.width : 2.5;
        ctx.shadowColor = "#cc00ff";
        ctx.shadowBlur = 8;
        ctx.stroke();

        ctx.strokeStyle = "rgba(230, 180, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    ctx.restore();
}

function drawVoidPuddles() {
    if (!secretMode || !voidPuddles || voidPuddles.length === 0) return;
    ctx.save();
    let t = Date.now();
    for (let pud of voidPuddles) {
        let baseR = isFinite(pud.r) && pud.r > 0 ? pud.r : 25;
        let px = isFinite(pud.x) ? pud.x : ARENA_W / 2;
        let py = isFinite(pud.y) ? pud.y : FLOOR;
        let pulse = 1 + 0.08 * Math.sin(t / 180 + px);
        let curR = baseR * pulse;
        if (!isFinite(curR) || curR <= 0) curR = 25;
        
        let grad = ctx.createRadialGradient(px, py + 4, 2, px, py + 4, curR + 10);
        grad.addColorStop(0, "rgba(200, 50, 255, 0.9)");
        grad.addColorStop(0.5, "rgba(120, 10, 200, 0.7)");
        grad.addColorStop(0.85, "rgba(50, 0, 100, 0.4)");
        grad.addColorStop(1, "rgba(20, 0, 40, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(px, py + 2, curR + 10, Math.max(1, (curR + 10) * 0.35), 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1a002e";
        ctx.beginPath();
        ctx.ellipse(px, py + 2, curR, Math.max(1, curR * 0.3), 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#da44ff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#cc00ff";
        ctx.shadowBlur = 12;
        ctx.stroke();

        for (let b = 0; b < 3; b++) {
            let bx = px + Math.sin(t / 200 + b * 2) * (curR * 0.6);
            let by = py - 2 - ((t / 30 + b * 25) % 20);
            let bAlpha = 1 - (((t / 30 + b * 25) % 20) / 20);
            ctx.fillStyle = `rgba(220, 120, 255, ${bAlpha})`;
            ctx.beginPath();
            ctx.arc(bx, by, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawVoidCeilingDrips() {
    if (!secretMode || !voidCeilingDrips || voidCeilingDrips.length === 0) return;
    ctx.save();
    ctx.fillStyle = "#1a0026";
    ctx.strokeStyle = "#bb00ff";
    ctx.lineWidth = 1;
    ctx.shadowColor = "#cc00ff";
    ctx.shadowBlur = 6;
    for (let dr of voidCeilingDrips) {
        let rx = isFinite(dr.r) && dr.r > 0 ? dr.r : 3;
        let ry = isFinite(dr.length) && dr.length > 0 ? dr.length / 2 : 5;
        let dx = isFinite(dr.x) ? dr.x : 0;
        let dy = isFinite(dr.y) ? dr.y : 0;
        ctx.beginPath();
        ctx.ellipse(dx, dy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

function drawBoulders() {
    if (!secretMode) return;
    ctx.save();
    let t = Date.now();

    // 1. Falling boulders & warning markers
    if (fallingBoulders && fallingBoulders.length > 0) {
        for (let b of fallingBoulders) {
            let warnPulse = 0.5 + 0.3 * Math.sin(t / 60);
            let bw = isFinite(b.w) && b.w > 0 ? b.w : 76;
            let bh = isFinite(b.h) && b.h > 0 ? b.h : 52;
            let bx = isFinite(b.x) ? b.x : ARENA_W / 2;
            let by = isFinite(b.y) ? b.y : 0;
            let warnR = Math.max(10, bw * 0.7);

            ctx.save();
            let wGrad = ctx.createRadialGradient(bx, FLOOR, 4, bx, FLOOR, warnR);
            wGrad.addColorStop(0, `rgba(230, 50, 255, ${warnPulse * 0.85})`);
            wGrad.addColorStop(0.7, `rgba(160, 20, 220, ${warnPulse * 0.45})`);
            wGrad.addColorStop(1, "rgba(50, 0, 100, 0)");
            ctx.fillStyle = wGrad;
            ctx.beginPath();
            ctx.ellipse(bx, FLOOR, warnR, Math.max(2, warnR * 0.35), 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 100, 255, ${warnPulse})`;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.restore();

            if (b.delay <= 0) {
                let imgIdx = isFinite(b.imgIdx) ? b.imgIdx : 0;
                let bImg = (externalGameAssets.boulders && externalGameAssets.boulders.length > imgIdx) ? externalGameAssets.boulders[imgIdx] : null;
                if (bImg && bImg.complete) {
                    ctx.save();
                    ctx.shadowColor = "#8800cc";
                    ctx.shadowBlur = 16;
                    ctx.drawImage(bImg, bx - bw / 2, by - bh / 2, bw, bh);
                    ctx.restore();
                } else {
                    ctx.save();
                    ctx.fillStyle = "#1e1526";
                    ctx.strokeStyle = "#8800cc";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.ellipse(bx, by, bw / 2, bh / 2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }

    // 2. Barricade boulders on floor
    if (arenaBarricadeBoulders && arenaBarricadeBoulders.length > 0) {
        for (let bar of arenaBarricadeBoulders) {
            let fadeAlpha = bar.timer < 60 ? (bar.timer / 60) : 1;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, fadeAlpha));
            let bw = isFinite(bar.w) && bar.w > 0 ? bar.w : 76;
            let bh = isFinite(bar.h) && bar.h > 0 ? bar.h : 52;
            let bx = isFinite(bar.x) ? bar.x : ARENA_W / 2;
            let by = isFinite(bar.y) ? bar.y : FLOOR - bh / 2;
            let imgIdx = isFinite(bar.imgIdx) ? bar.imgIdx : 0;
            let bImg = (externalGameAssets.boulders && externalGameAssets.boulders.length > imgIdx) ? externalGameAssets.boulders[imgIdx] : null;
            if (bImg && bImg.complete) {
                ctx.shadowColor = "#552277";
                ctx.shadowBlur = 10;
                ctx.drawImage(bImg, bx - bw / 2, by - bh / 2, bw, bh);
            } else {
                ctx.fillStyle = "#22182e";
                ctx.strokeStyle = "#aa44ff";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.ellipse(bx, by, bw / 2, bh / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            ctx.strokeStyle = "rgba(200, 100, 255, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(bx, by - bh / 4, bw / 3, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.restore();
}

function drawBrokenRightWall() {
    if (!secretMode || !abyssRightWallBroken) return;
    ctx.save();
    let t = Date.now();
    let wallX = ARENA_W - 35;
    
    // Брешь в стене
    ctx.fillStyle = "#05000a";
    ctx.beginPath();
    ctx.moveTo(wallX, FLOOR - 220);
    ctx.lineTo(ARENA_W + 30, FLOOR - 250);
    ctx.lineTo(ARENA_W + 30, FLOOR + 60);
    ctx.lineTo(wallX - 15, FLOOR + 20);
    ctx.lineTo(wallX + 10, FLOOR - 80);
    ctx.lineTo(wallX - 20, FLOOR - 140);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#cc00ff";
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Поток черной жижи Бездны
    let flowGrad = ctx.createLinearGradient(wallX + 20, FLOOR - 140, wallX - 80, FLOOR + 10);
    flowGrad.addColorStop(0, "rgba(5, 0, 10, 0.98)");
    flowGrad.addColorStop(0.5, "rgba(25, 0, 45, 0.92)");
    flowGrad.addColorStop(1, "rgba(60, 0, 95, 0.85)");
    ctx.fillStyle = flowGrad;
    ctx.beginPath();
    let wave1 = Math.sin(t / 90) * 12;
    let wave2 = Math.cos(t / 110) * 16;
    ctx.moveTo(wallX + 10, FLOOR - 130);
    ctx.bezierCurveTo(wallX - 40 + wave1, FLOOR - 70, wallX - 90 + wave2, FLOOR - 10, wallX - 120, FLOOR + 20);
    ctx.lineTo(ARENA_W, FLOOR + 50);
    ctx.lineTo(wallX + 20, FLOOR - 40);
    ctx.closePath();
    ctx.fill();

    for (let k = 0; k < 6; k++) {
        let spX = wallX - 30 - ((t / 20 + k * 45) % 90);
        let spY = FLOOR - 90 + (k * 22) + Math.sin(t / 80 + k) * 10;
        ctx.fillStyle = "rgba(180, 50, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(spX, spY, 2.5 + (k % 2), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawAbyssGooFloor() {
    if (!secretMode) return;
    let t = Date.now();

    if (abyssGooFloorActive) {
        ctx.save();
        let gooTop = FLOOR - 14;

        ctx.beginPath();
        ctx.moveTo(0, FLOOR + 120);
        ctx.lineTo(0, gooTop);
        for (let x = 0; x <= ARENA_W; x += 35) {
            let wave = Math.sin(x * 0.02 + t * 0.003) * 5 + Math.sin(x * 0.04 - t * 0.005) * 3;
            ctx.lineTo(x, gooTop + wave);
        }
        ctx.lineTo(ARENA_W, FLOOR + 120);
        ctx.closePath();

        let gooGrad = ctx.createLinearGradient(0, gooTop, 0, FLOOR + 80);
        gooGrad.addColorStop(0, "rgba(35, 5, 55, 0.94)");
        gooGrad.addColorStop(0.3, "rgba(12, 1, 22, 0.98)");
        gooGrad.addColorStop(1, "rgba(4, 0, 8, 1.0)");
        ctx.fillStyle = gooGrad;
        ctx.fill();

        ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#cc00ff";
        ctx.shadowBlur = 15;
        ctx.stroke();

        for (let b = 0; b < 10; b++) {
            let bx = (b * 123 + t * 0.04) % ARENA_W;
            let bWave = Math.sin(bx * 0.02 + t * 0.003) * 5;
            let by = gooTop + bWave + Math.sin(t * 0.006 + b) * 3;
            let br = 4 + (b % 4);
            ctx.fillStyle = "rgba(130, 20, 200, 0.75)";
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(220, 150, 255, 0.9)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    } else if (abyssGooSolidified) {
        ctx.save();
        ctx.fillStyle = "#0c0514";
        ctx.fillRect(0, FLOOR, ARENA_W, 120);

        ctx.strokeStyle = "rgba(130, 80, 200, 0.4)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 18; i++) {
            let cx = (i * 87) % ARENA_W;
            ctx.beginPath();
            ctx.moveTo(cx, FLOOR);
            ctx.lineTo(cx + (i % 2 === 0 ? 25 : -20), FLOOR + 45);
            ctx.lineTo(cx + (i % 3 === 0 ? 10 : 35), FLOOR + 90);
            ctx.stroke();
        }

        ctx.strokeStyle = "rgba(160, 240, 255, 0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, FLOOR);
        ctx.lineTo(ARENA_W, FLOOR);
        ctx.stroke();
        ctx.restore();
    }
}

function drawBackground() {
    if (window.isFireBossMode) {
        drawFireBossArena(boss ? boss.introTimer : 0);
        return;
    }
    let bgTop = (boss.phase >= 2.5 || boss.state.startsWith("L_CLIMB") || secretMode) ? -6000 : 0;
    ctx.fillStyle = secretMode ? "#111" : (globalWindMode === "DOWN" ? "#1a100c" : "#2e1a12"); 
    ctx.fillRect(0, bgTop, ARENA_W, FLOOR - bgTop);

    // 1. Atmospheric Black Dust behind everything (Silksong aesthetic for Gandalf)
    if (typeof backgroundDust !== 'undefined' && backgroundDust.length > 0) {
        ctx.save();
        for (let d of backgroundDust) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(10, 8, 14, ${d.alpha})`;
            ctx.fill();
            // Subtle iridescent rim on the edge
            ctx.strokeStyle = d.rimHue;
            ctx.lineWidth = 0.9;
            ctx.stroke();
        }
        ctx.restore();
    }
    
    if (!secretMode) { 
        ctx.fillStyle = "rgba(255, 250, 220, 0.08)";
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(200, 0); ctx.lineTo(550, FLOOR); ctx.lineTo(150, FLOOR); ctx.fill();
        
        ctx.fillStyle = "#1b3a1b"; 
        ctx.fillRect(50, 0, 10, 150); ctx.fillRect(120, 0, 8, 80); ctx.fillRect(800, 0, 12, 120);
        
        for (let i = 0; i < ARENA_W; i += 600) {
            ctx.fillStyle = "#3a261c"; ctx.fillRect(i + 150, 100, 80, 120); 
            ctx.fillStyle = "rgba(255, 180, 100, 0.05)"; ctx.fillRect(i + 150, 100, 80, 120); 
        }
        
        let lx = ARENA_W / 2 - 80;
        let ly = 350 - 140;
        ctx.fillStyle = "#2d1b15"; 
        ctx.fillRect(lx, ly, 10, 140); 
        ctx.fillRect(lx + 150, ly, 10, 140); 
        ctx.fillRect(lx - 10, ly + 20, 180, 10); 
        ctx.fillRect(lx - 10, ly + 110, 180, 15); 
        
        ctx.strokeStyle = "rgba(255, 200, 150, 0.2)"; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let tx = lx + 15; tx <= lx + 145; tx += 5) { ctx.moveTo(tx, ly + 30); ctx.lineTo(tx, ly + 110); }
        ctx.stroke();
        
        ctx.fillStyle = "rgba(255, 180, 100, 0.1)"; ctx.fillRect(lx + 15, ly + 70, 130, 40);
        ctx.fillStyle = "#4a3022"; ctx.fillRect(lx + 5, ly + 65, 150, 6);    }

    // Speedlines during the 2-second abyss free-fall
    if (boss.state === "L_CLIMB_TRANSITION" && boss.transitionTimer < 120) {
        ctx.save();
        ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
        ctx.lineWidth = 2;
        let t = boss.transitionTimer;
        for (let i = 0; i < 28; i++) {
            let sx = (i * 37 + (t * 11)) % ARENA_W;
            let sy = ((i * 73 - (t * 26)) % (GAME_HEIGHT + 350)) + camY - 50;
            let slen = 50 + (i % 5) * 30;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, sy + slen);
            ctx.stroke();
        }
        ctx.restore();
    }

    ctx.fillStyle = secretMode ? "#000" : "#22110a"; 
    ctx.fillRect(0, FLOOR, ARENA_W, ARENA_H > FLOOR ? ARENA_H : 2000);

    if (!boss.state.startsWith("L_CLIMB")) {
        ctx.strokeStyle = secretMode ? "#2a1538" : "#111"; 
        ctx.lineWidth = 4; ctx.beginPath(); 
        ctx.moveTo(0, FLOOR); ctx.lineTo(ARENA_W, FLOOR);
        ctx.stroke();
    }

    // Растительность на арене: анимированные Цветки (BlueFlower1) на поле боя и Растения 1, 2, 3 по краям арены
    // В L-режиме растительности НЕТ (мёртвая арена Бездны)
    if (!secretMode && !boss.state.startsWith("L_CLIMB") && !boss.floorSplitted) {
        ctx.save();
        let now = Date.now();

        // 1. Анимированные цветки (BlueFlower1) на полу арены
        let flFrames = externalGameAssets.blueFlowers || [];
        let flCount = flFrames.length;
        let flowerPositions = [210, 390, 630, 800];

        flowerPositions.forEach((fx, idx) => {
            let fw = 34, fh = 34;
            let fy = FLOOR - fh + 4;
            let drawn = false;

            if (flCount > 0) {
                let frameIdx = Math.floor(now / 140 + idx * 3) % flCount;
                let flImg = flFrames[frameIdx];
                if (flImg && flImg.complete && flImg.naturalWidth > 0) {
                    ctx.drawImage(flImg, fx, fy, fw, fh);
                    drawn = true;
                }
            }

            // Процедурный резервный цветок, если изображение еще декодируется браузером
            if (!drawn) {
                ctx.save();
                let sway = Math.sin(now / 350 + idx) * 2;
                ctx.strokeStyle = "#15803d";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(fx + 17, FLOOR);
                ctx.quadraticCurveTo(fx + 17 + sway, FLOOR - 14, fx + 17 + sway * 1.5, FLOOR - 24);
                ctx.stroke();

                // Лепестки цветка
                ctx.fillStyle = secretMode ? "#38bdf8" : "#60a5fa";
                ctx.beginPath();
                ctx.arc(fx + 17 + sway * 1.5, FLOOR - 25, 6, 0, Math.PI * 2);
                ctx.fill();

                // Светящаяся сердцевина
                ctx.fillStyle = "#fef08a";
                ctx.beginPath();
                ctx.arc(fx + 17 + sway * 1.5, FLOOR - 25, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });

        // 2. Анимированные Растения 1, 2, 3 по краям арены
        let p1Frames = externalGameAssets.plants1 || [];
        let p2Frames = externalGameAssets.plants2 || [];
        let p3Frames = externalGameAssets.plants3 || [];

        function drawPlantSprite(frames, speed, offset, x, y, w, h, fallbackColor) {
            let drawn = false;
            if (frames && frames.length > 0) {
                let fIdx = Math.floor(now / speed + offset) % frames.length;
                let img = frames[fIdx];
                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, x, y, w, h);
                    drawn = true;
                }
            }
            if (!drawn) {
                // Процедурные листья/папоротник
                ctx.save();
                ctx.fillStyle = fallbackColor || "#166534";
                let sway = Math.sin(now / 400 + offset) * 3;
                ctx.beginPath();
                ctx.moveTo(x + w / 2, FLOOR);
                ctx.quadraticCurveTo(x + w / 2 + sway, y + h / 2, x + w / 2 + sway * 1.5, y);
                ctx.quadraticCurveTo(x + w / 2 + 8, y + h / 2, x + w / 2, FLOOR);
                ctx.fill();
                ctx.restore();
            }
        }

        // Левый край арены: Plant 1, Plant 2, Plant 3
        drawPlantSprite(p1Frames, 110, 0, 28, FLOOR - 46, 48, 52, "#15803d");
        drawPlantSprite(p2Frames, 125, 2, 76, FLOOR - 42, 44, 48, "#166534");
        drawPlantSprite(p3Frames, 115, 4, 126, FLOOR - 40, 42, 46, "#14532d");

        // Правый край арены: Plant 3, Plant 2, Plant 1
        drawPlantSprite(p3Frames, 115, 6, ARENA_W - 170, FLOOR - 40, 42, 46, "#14532d");
        drawPlantSprite(p2Frames, 125, 8, ARENA_W - 122, FLOOR - 42, 44, 48, "#166534");
        drawPlantSprite(p1Frames, 110, 10, ARENA_W - 74, FLOOR - 46, 48, 52, "#15803d");

        ctx.restore();
    }
    
    for (let p of platforms) {
        if (secretMode || boss.state.startsWith("L_CLIMB") || boss.phase >= 2.5) {
            if (p.num === 10) {
                // Summit platform (Golden altar)
                ctx.save();
                ctx.fillStyle = "#1e1b2e";
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.strokeStyle = "#ffd700";
                ctx.lineWidth = 3;
                ctx.strokeRect(p.x, p.y, p.w, p.h);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
                ctx.lineWidth = 1;
                ctx.strokeRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
                
                ctx.fillStyle = "#ffe066";
                ctx.font = "bold 13px Arial";
                ctx.textAlign = "center";
                ctx.fillText("★ ВЕРШИНА [10] ★", p.x + p.w / 2, p.y - 6);
                ctx.restore();
            } else if (p.num) {
                // Climbing platforms (1..9)
                ctx.save();
                ctx.fillStyle = "#161626";
                ctx.fillRect(p.x, p.y, p.w, p.h);
                let edgeColor = (p.num % 2 === 0) ? "rgba(180, 100, 255, 0.85)" : "rgba(80, 220, 255, 0.85)";
                ctx.strokeStyle = edgeColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x, p.y, p.w, p.h);
                
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.font = "bold 11px Arial";
                ctx.textAlign = "center";
                ctx.fillText(`[ ${p.num} ]`, p.x + p.w / 2, p.y + 11);
                ctx.restore();
            } else if (p.isObsidian) {
                ctx.save();
                ctx.fillStyle = "#120a1a";
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.strokeStyle = "#a855f7";
                ctx.lineWidth = 2.5;
                ctx.shadowColor = "#cc00ff";
                ctx.shadowBlur = 12;
                ctx.strokeRect(p.x, p.y, p.w, p.h);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
                ctx.lineWidth = 1;
                ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, 2);
                ctx.restore();
            } else {
                ctx.fillStyle = "#2a2a38";
                ctx.fillRect(p.x, p.y, p.w, p.h);
                ctx.strokeStyle = "rgba(200, 180, 255, 0.5)";
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x, p.y, p.w, p.h);
            }
        } else {
            ctx.fillStyle = "#4a3022";
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.strokeRect(p.x, p.y, p.w, p.h);
        }
    }

    // Decorative bananas scattered on arena and platforms when banana skin is active
    drawArenaDecorativeBananas();

    let topWallLimit = (boss.state.startsWith("L_CLIMB") || boss.phase >= 2.5 || secretMode) 
        ? -2000 
        : (secretMode ? FLOOR/2 - 100 : FLOOR/2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; 
    ctx.setLineDash([5, 5]); 
    ctx.beginPath(); 
    ctx.moveTo(0, topWallLimit); ctx.lineTo(15, topWallLimit); 
    ctx.moveTo(ARENA_W-15, topWallLimit); ctx.lineTo(ARENA_W, topWallLimit); 
    ctx.stroke(); 
    ctx.setLineDash([]);
    
    if (globalWindMode === "UP") { 
        ctx.fillStyle = "rgba(0, 255, 255, 0.05)"; 
        ctx.fillRect(0, bgTop, ARENA_W, (GAME_HEIGHT > FLOOR ? GAME_HEIGHT : 2000) - bgTop); 
    }
}

function drawArenaDecorativeBananas() {
    if (!players || !players.some(p => p.bananaSkin)) return;

    function drawSingleDecorativeBanana(x, y, scale = 1, angle = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);

        // Soft ground shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(0, 3, 14, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Banana Yellow Body
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.moveTo(-11, -3);
        ctx.quadraticCurveTo(0, 8, 12, 1);
        ctx.quadraticCurveTo(0, 2, -11, -3);
        ctx.closePath();
        ctx.fill();

        // 3D Highlight curve
        ctx.strokeStyle = "rgba(255, 255, 230, 0.85)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.quadraticCurveTo(0, 5, 11, 1);
        ctx.stroke();

        // Dark bottom tip
        ctx.fillStyle = "#2d1b0d";
        ctx.beginPath();
        ctx.arc(12, 1, 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Brown stem
        ctx.strokeStyle = "#4a2e00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-11, -3);
        ctx.lineTo(-14, -6);
        ctx.stroke();

        ctx.restore();
    }

    // Bananas scattered on the arena floor
    const floorPositions = [
        { x: 85, a: 0.2, s: 0.95 },
        { x: 210, a: -0.25, s: 1.05 },
        { x: 330, a: 0.35, s: 0.9 },
        { x: 480, a: -0.15, s: 1.1 },
        { x: 640, a: 0.25, s: 1.0 },
        { x: 790, a: -0.3, s: 0.95 },
        { x: 915, a: 0.18, s: 1.0 }
    ];

    if (secretMode) {
        floorPositions.push(
            { x: 1150, a: -0.2, s: 1.0 },
            { x: 1420, a: 0.3, s: 0.95 },
            { x: 1720, a: -0.15, s: 1.05 },
            { x: 2050, a: 0.25, s: 0.9 },
            { x: 2320, a: -0.3, s: 1.0 }
        );
    }

    for (let pos of floorPositions) {
        if (pos.x < ARENA_W) {
            drawSingleDecorativeBanana(pos.x, FLOOR - 3, pos.s, pos.a);
        }
    }

    // Bananas resting on platforms
    for (let p of platforms) {
        if (p.w >= 50) {
            drawSingleDecorativeBanana(p.x + p.w * 0.45, p.y - 3, 0.9, -0.15);
        }
    }
}

// --- FALLING BANANA PEEL ABILITY SYSTEM ---
function spawnFallingBananaPeel(x, y, facingRight) {
    if (typeof fallingBananaPeels === 'undefined' || !fallingBananaPeels) fallingBananaPeels = [];
    let throwDir = facingRight ? -1 : 1; // flings behind the player who ate the banana
    fallingBananaPeels.push({
        x: x,
        y: y,
        vx: throwDir * (2.8 + Math.random() * 1.6),
        vy: -5.4 - Math.random() * 1.8,
        angle: (Math.random() - 0.5) * 0.8,
        spin: throwDir * (0.18 + Math.random() * 0.1),
        onGround: false,
        bounces: 0,
        timer: 1800, // 30 seconds
        slipped: false
    });
}
window.spawnFallingBananaPeel = spawnFallingBananaPeel;

function updateFallingBananaPeels() {
    if (!fallingBananaPeels || fallingBananaPeels.length === 0) return;
    for (let i = fallingBananaPeels.length - 1; i >= 0; i--) {
        let peel = fallingBananaPeels[i];
        peel.timer--;
        if (peel.timer <= 0) {
            fallingBananaPeels.splice(i, 1);
            continue;
        }

        if (!peel.onGround) {
            peel.vy += 0.28; // gravity
            peel.x += peel.vx;
            peel.y += peel.vy;
            peel.angle += peel.spin;

            // Check platforms
            let hitPlat = false;
            if (peel.vy >= 0 && typeof platforms !== 'undefined') {
                for (let plat of platforms) {
                    if (peel.x >= plat.x && peel.x <= plat.x + plat.w && peel.y >= plat.y - 2 && peel.y - peel.vy <= plat.y + 12) {
                        peel.y = plat.y - 2;
                        peel.bounces = (peel.bounces || 0) + 1;
                        if (peel.bounces < 2) {
                            peel.vy = -peel.vy * 0.35;
                            peel.vx *= 0.6;
                            peel.spin *= 0.5;
                        } else {
                            peel.onGround = true;
                            peel.vy = 0;
                            peel.vx = 0;
                            peel.angle = 0;
                        }
                        hitPlat = true;
                        break;
                    }
                }
            }

            // Check arena floor
            if (!hitPlat && peel.y >= FLOOR - 2) {
                peel.y = FLOOR - 2;
                peel.bounces = (peel.bounces || 0) + 1;
                if (peel.bounces < 2) {
                    peel.vy = -peel.vy * 0.35;
                    peel.vx *= 0.6;
                    peel.spin *= 0.5;
                } else {
                    peel.onGround = true;
                    peel.vy = 0;
                    peel.vx = 0;
                    peel.angle = 0;
                }
            }
        } else {
            // Hilarious interactive mechanics:
            // 1. If Boss steps on the banana peel, boss does a funny slip stagger!
            if (!peel.slipped && typeof boss !== 'undefined' && boss.state !== "DEFEATED" && boss.state !== "TRANSITION" && !boss.state.startsWith("CINEMATIC") && boss.x > -200) {
                let bossHitbox = { x: boss.x, y: boss.y, width: boss.width, height: boss.height };
                let peelBox = { x: peel.x - 14, y: peel.y - 12, width: 28, height: 18 };
                if (rectIntersect(peelBox, bossHitbox)) {
                    peel.slipped = true;
                    peel.timer = Math.min(peel.timer, 45); // squished peel fades quickly
                    if (typeof playSound === 'function') playSound('leaf');
                    if (typeof triggerVibration === 'function') triggerVibration('clash');
                    boss.vx = (boss.facingDir || 1) * 4;
                    boss.stateTimer = Math.max(boss.stateTimer, 15);
                    if (typeof voidExplosions !== 'undefined') {
                        voidExplosions.push({
                            x: peel.x,
                            y: peel.y,
                            timer: 16,
                            isWhite: true,
                            isOrange: true,
                            r: 25
                        });
                    }
                }
            }

            // 2. If a Player steps on the peel, they get a fun slippery little slide boost!
            if (!peel.slipped && typeof players !== 'undefined') {
                let peelBox = { x: peel.x - 12, y: peel.y - 10, width: 24, height: 16 };
                for (let pl of players) {
                    if (!pl.isDowned && pl.hp > 0 && rectIntersect(peelBox, pl)) {
                        peel.slipped = true;
                        peel.timer = Math.min(peel.timer, 45);
                        if (typeof playSound === 'function') playSound('leaf');
                        pl.vx = (pl.facingRight ? 1 : -1) * 7.5;
                        if (typeof voidExplosions !== 'undefined') {
                            voidExplosions.push({
                                x: peel.x,
                                y: peel.y,
                                timer: 14,
                                isWhite: false,
                                isOrange: true,
                                r: 18
                            });
                        }
                        break;
                    }
                }
            }
        }
    }
}
window.updateFallingBananaPeels = updateFallingBananaPeels;

function drawFallingBananaPeels() {
    if (!fallingBananaPeels || fallingBananaPeels.length === 0) return;

    for (let peel of fallingBananaPeels) {
        ctx.save();
        ctx.translate(peel.x, peel.y);
        ctx.rotate(peel.angle);

        let alpha = 1.0;
        if (peel.timer < 90) alpha = peel.timer / 90;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        if (peel.onGround) {
            // Ground shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            ctx.beginPath();
            ctx.ellipse(0, 3, 14, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stem (dark brown)
        ctx.fillStyle = "#3e2714";
        ctx.beginPath();
        ctx.arc(0, -3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Left peel skin
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.quadraticCurveTo(-10, -7, -15, 2);
        ctx.quadraticCurveTo(-8, 3, 0, -1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#4a2e00";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Right peel skin
        ctx.fillStyle = "#ffcc00";
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.quadraticCurveTo(10, -7, 15, 2);
        ctx.quadraticCurveTo(8, 3, 0, -1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#4a2e00";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Bottom/Center peel skin
        ctx.fillStyle = "#ffe600";
        ctx.beginPath();
        ctx.moveTo(-3, -1);
        ctx.quadraticCurveTo(0, 7, 2, 11);
        ctx.quadraticCurveTo(4, 7, 3, -1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#4a2e00";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Creamy highlights on the peel insides
        ctx.fillStyle = "rgba(255, 255, 230, 0.85)";
        ctx.beginPath();
        ctx.ellipse(-6, -1, 3.5, 1.2, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -1, 3.5, 1.2, 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
window.drawFallingBananaPeels = drawFallingBananaPeels;

function drawMasks() {
    for (let idx = 0; idx < players.length; idx++) {
        let p = players[idx]; 
        let yOffset = 25 + (idx * 35); 
        let mShakeX = 0, mShakeY = 0;
        if (screenShake.timer > 0 && (!activeCinematic || activeCinematic.p === p)) {
            mShakeX = (Math.random() - 0.5) * (screenShake.mag * 0.45);
            mShakeY = (Math.random() - 0.5) * (screenShake.mag * 0.45);
        }
        for (let i = 0; i < p.maxHp; i++) {
            let cx = 30 + i * 30 + mShakeX; let cy = yOffset + mShakeY;
            ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); 
            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fill(); 
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; ctx.lineWidth = 2; ctx.stroke();
            
            let hpColor = p.color; 
            if ((secretMode || window.isFireBossMode) && i >= p.maxHp - 2) hpColor = "rgba(255,255,255,0.8)";
            if (p.type === 'WATER' && p.stance === 'DEMON') hpColor = "#c084fc";
            
            if (p.hp > i) {
                let fraction = p.hp - i;
                if (fraction >= 1) {
                    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fillStyle = hpColor; ctx.fill();
                } else {
                    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 10, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * fraction)); ctx.closePath(); ctx.fillStyle = hpColor; ctx.fill();
                }
            }

            // Cracked Life Badge: синий защитный ореол с трещиной на 1-м HP (Потрескавшаяся маска)
            if (i === 0 && p.hasCrackedLife && !p.crackedShieldBroken) {
                ctx.save();
                let pulse = p.hp <= 1 ? (0.6 + 0.35 * Math.sin(Date.now() / 90)) : 0.45;
                ctx.strokeStyle = `rgba(0, 229, 255, ${pulse})`;
                ctx.lineWidth = 2.5;
                ctx.shadowColor = "#00e5ff";
                ctx.shadowBlur = p.hp <= 1 ? 14 : 6;
                ctx.beginPath();
                ctx.arc(cx, cy, 14, 0, Math.PI * 2);
                ctx.stroke();
                // Треснувший узор маски
                ctx.beginPath();
                ctx.moveTo(cx - 5, cy - 9);
                ctx.lineTo(cx - 1, cy - 2);
                ctx.lineTo(cx + 4, cy - 5);
                ctx.moveTo(cx - 1, cy - 2);
                ctx.lineTo(cx - 2, cy + 8);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            }

            // Thorns Badge: Thorny barbed spikes around player's HP masks!
            if (p.badges && p.badges.includes('thorns')) {
                ctx.save();
                ctx.fillStyle = (p.hp > i) ? "#ff2244" : "#883344";
                ctx.strokeStyle = "#440011";
                ctx.lineWidth = 1;
                let numSpikes = 6;
                for (let s = 0; s < numSpikes; s++) {
                    let ang = (s * Math.PI * 2) / numSpikes + (i * 0.4);
                    let tipX = cx + Math.cos(ang) * 14.5;
                    let tipY = cy + Math.sin(ang) * 14.5;
                    let b1x = cx + Math.cos(ang - 0.25) * 9.8;
                    let b1y = cy + Math.sin(ang - 0.25) * 9.8;
                    let b2x = cx + Math.cos(ang + 0.25) * 9.8;
                    let b2y = cy + Math.sin(ang + 0.25) * 9.8;
                    ctx.beginPath();
                    ctx.moveTo(b1x, b1y);
                    ctx.lineTo(tipX, tipY);
                    ctx.lineTo(b2x, b2y);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
        if (p.purpleHp > 0 && !window.isStoryMode) {
            for (let i = 0; i < p.purpleHp; i++) {
                let cx = 30 + (p.maxHp + i) * 30 + mShakeX; let cy = yOffset + mShakeY;
                ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); 
                ctx.fillStyle = "#9900ff"; ctx.fill(); ctx.strokeStyle = "#ff55ff"; ctx.lineWidth = 2; ctx.stroke();
            }
        }
        if (p.orangeHp > 0 && !window.isStoryMode) {
            let cx = 30 + (p.maxHp + p.purpleHp) * 30 + mShakeX; let cy = yOffset + mShakeY;
            ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); 
            ctx.fillStyle = "#ffaa00"; ctx.fill(); ctx.strokeStyle = "yellow"; ctx.lineWidth = 2; ctx.stroke();
        }
        if (p.type === 'STAMINA' && !window.isStoryMode) {
            for (let i = 0; i < p.maxStamina; i++) {
                let cx = 30 + i * 16; let cy = yOffset + 18;
                ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2);
                ctx.fillStyle = i < Math.floor(p.stamina) ? "#ffcc00" : (i < p.stamina ? "rgba(255, 204, 0, 0.5)" : "rgba(0,0,0,0.5)");
                ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1; ctx.stroke();
            }
        }
        
        let brewX = 30 + (p.maxHp + (p.purpleHp > 0 ? p.purpleHp : 0)) * 30 + (p.orangeHp > 0 ? 30 : 0) + 10;
        let pAbList = (p.abilities && typeof p.abilities === 'object') ? Object.values(p.abilities) : [];
        if (!window.isStoryMode && (p.chillBrews > 0 || pAbList.includes('chill'))) {
            for (let i = 0; i < p.chillBrews; i++) {
                ctx.beginPath(); ctx.arc(brewX + i * 16, yOffset, 5, 0, Math.PI*2);
                ctx.fillStyle = "cyan"; ctx.fill();
                ctx.strokeStyle = "purple"; ctx.lineWidth = 2; ctx.stroke();
            }
            if (p.chillBrews > 0) brewX += p.chillBrews * 16 + 10;
        }
        if (!window.isStoryMode && (p.invigBrews > 0 || pAbList.includes('invig'))) {
            for (let i = 0; i < p.invigBrews; i++) {
                ctx.beginPath(); ctx.arc(brewX + i * 16, yOffset, 5, 0, Math.PI*2);
                ctx.fillStyle = "#ffcc00"; ctx.fill();
                ctx.strokeStyle = "#ff5500"; ctx.lineWidth = 2; ctx.stroke();
            }
            if (p.invigBrews > 0) brewX += p.invigBrews * 16 + 10;
        }

        // Water Rope Ult Indicator (3 glowing cyan circles)
        if (!window.isStoryMode && p.type === 'WATER_ROPE') {
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(brewX + i * 16, yOffset, 6, 0, Math.PI * 2);
                ctx.fillStyle = i < (p.ropeUltAttempts || 0) ? "#00ffff" : "rgba(0, 255, 255, 0.2)";
                ctx.fill();
                ctx.strokeStyle = "#0088cc";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            brewX += 3 * 16 + 10;
        }

        // 4G Stamina Pink Ult Indicator (2 glowing pink circles)
        if (!window.isStoryMode && p.type === 'STAMINA' && (p.weaponMode === 'PINK' || p.stance === 'PINK')) {
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.arc(brewX + i * 16, yOffset, 6, 0, Math.PI * 2);
                ctx.fillStyle = i < (p.staminaUltAttempts || 0) ? "#ff33aa" : "rgba(255, 51, 170, 0.2)";
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            brewX += 2 * 16 + 10;
        }

        let tagOffset = brewX + 10;
        if (p.bleedTimer > 0 && !p.isDowned) { 
            ctx.fillStyle = "red"; ctx.font = "12px Arial"; ctx.fillText("Кровотечение!", tagOffset, yOffset + 4); 
            ctx.fillRect(tagOffset + 90, yOffset - 2, (p.bleedTimer / 120) * 50, 6); 
            tagOffset += 150;
        }

        // Fire Boss Duel: 3-segment Burn Gauge display near player's HP
        if (window.isFireBossMode || p.burnGauge > 0 || p.burnTimer > 0) {
            let burnX = tagOffset;
            ctx.save();
            ctx.font = "bold 11px Arial";
            ctx.textAlign = "left";
            if (p.burnTimer > 0) {
                let flash = Math.floor(Date.now() / 100) % 2 === 0;
                ctx.fillStyle = flash ? "#ff3300" : "#ffcc00";
                ctx.shadowColor = "#ff3300";
                ctx.shadowBlur = 8;
                ctx.fillText("🔥 ГОРИТ! (-0.5)", burnX, yOffset + 4);
                tagOffset += 120;
            } else {
                ctx.fillStyle = "#ff8800";
                ctx.fillText("🔥 Поджог:", burnX, yOffset + 4);
                let segStartX = burnX + 66;
                for (let b = 0; b < 3; b++) {
                    let segFilled = b < (p.burnGauge || 0);
                    ctx.beginPath();
                    ctx.rect(segStartX + b * 16, yOffset - 6, 12, 12);
                    ctx.fillStyle = segFilled ? "#ff4400" : "rgba(255, 68, 0, 0.2)";
                    ctx.fill();
                    ctx.strokeStyle = segFilled ? "#ffcc00" : "rgba(255, 200, 100, 0.4)";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
                tagOffset += 130;
            }
            ctx.restore();
        }

        // Arcade ability & stance hint tags: completely disabled in Story Mode!
        if (!window.isStoryMode) {
            let tagText = "";
            let tagColor = "#ffffff";
            if (p.type === 'WATER') {
                let canDemon = !(!secretMode && numPlayers === 2);
                if (p.stance === 'DEMON') {
                    tagText = secretMode ? "[ДЕМОНСКАЯ СИЛА] (F+Вниз: Бездна | C+F: Бег | S)" : "[ДЕМОНСКАЯ СИЛА] (C+F: Бег | S)";
                    tagColor = "#d000ff";
                } else {
                    tagText = canDemon ? "[СВЕТЛАЯ СИЛА] (X+F: Капля | C+F: Бег | S)" : "[СВЕТЛАЯ СИЛА] (X+F: Капля | C+F: Бег)";
                    tagColor = "#00e5ff";
                }
            } else if (p.type === 'EARTH') {
                let critVal = 0;
                if (sharedHeals >= 5) critVal = 15;
                else if (sharedHeals >= 4) critVal = 12.5;
                else if (sharedHeals >= 3) critVal = 10;
                else if (sharedHeals >= 2) critVal = 7.5;
                else if (sharedHeals >= 1) critVal = 5;
                if (p.hasLuckyCharm) critVal += 2;

                let dodgeVal = 0;
                if (p.hasLuckyCharm) dodgeVal += 5;
                if (sharedHeals >= 4) {
                    dodgeVal += 5;
                    if (p.hasLuckyCharm) dodgeVal += 2;
                }
                tagText = `[КИНЖАЛЫ ТЕНИ] (X+C: Удар-сальто | Крит: ${critVal}%${dodgeVal > 0 ? ` | Уворот: ${dodgeVal}%` : ''})`;
                tagColor = "#55ff77";
            } else if (p.type === 'AIR') {
                tagText = "[КЛИНКИ ВЕТРА] (S: Воздушная атака | Удерживай Z: Прыжок выше)";
                tagColor = "#fff066";
            } else if (p.type === 'STAMINA') {
                if (p.stance === 'PINK' || p.weaponMode === 'PINK') {
                    tagText = `[ВИРУСНЫЙ МЕЧ | x2.5] (X+S: Ульта [${p.staminaUltAttempts !== undefined ? p.staminaUltAttempts : 2}] | S: Режим)`;
                    tagColor = "#ff33aa";
                } else {
                    tagText = "[СИНИЕ КИНЖАЛЫ | СЕРИЯ] (S: Режим)";
                    tagColor = "#33ffff";
                }
            } else if (p.type === 'FIRE') {
                if (p.heatBladeTimer > 0) {
                    tagText = `[НАГРЕВ КЛИНКА: ${(p.heatBladeTimer/60).toFixed(1)}с] (S: Выпад 2.5 | Shift: Взрыв)`;
                    tagColor = "#ff4400";
                } else {
                    tagText = "[ШПАГА ОГНЯ] (Shift: Взрыв огня | S: Выпад | C+F: Бег)";
                    tagColor = "#ffaa33";
                }
            } else if (p.type === 'FIRE_HALBERD') {
                if (p.heatBladeTimer > 0) {
                    tagText = `[ОГНЕННАЯ ВОЛНА: ${(p.heatBladeTimer/60).toFixed(1)}с] (+1.25 урон | S: Прыжок-шест)`;
                    tagColor = "#ff3300";
                } else {
                    tagText = "[АЛЕБАРДА ОГНЯ] (S: Прыжок-шест с ударом 3.0 | F: Замах)";
                    tagColor = "#ff7733";
                }
            } else if (p.type === 'WATER_ROPE') {
                if (p.concentrateReady) {
                    tagText = `[ФОКУС ГОТОВ!] (Отпусти X: Удар 2.5 | X+S: Гарпун [${p.ropeUltAttempts !== undefined ? p.ropeUltAttempts : 3}])`;
                    tagColor = "#00ffff";
                } else if (p.concentrateTimer > 0) {
                    tagText = `[ФОКУС: ${Math.round((p.concentrateTimer/60)*100)}%]`;
                    tagColor = "#38bdf8";
                } else {
                    tagText = `[МАЛЫШ ВОДЫ] (X+S: Гарпун-захват [${p.ropeUltAttempts !== undefined ? p.ropeUltAttempts : 3}] | Трос: Движение)`;
                    tagColor = "#00e5ff";
                }
            }

            if (p.bananaSkin || Object.values(p.abilities).includes('banana_snack')) {
                let uCount = p.bananaSnackUses !== undefined ? p.bananaSnackUses : 3;
                ctx.save();
                ctx.font = "16px sans-serif";
                for (let b = 0; b < 3; b++) {
                    let bx = tagOffset + b * 22;
                    let by = yOffset + 5;
                    if (b < uCount) {
                        ctx.globalAlpha = 1.0;
                        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
                        ctx.shadowBlur = 6;
                    } else {
                        ctx.globalAlpha = 0.22;
                        ctx.shadowBlur = 0;
                    }
                    ctx.fillText("🍌", bx, by);
                }
                ctx.restore();
                tagOffset += 76;
            }

            if (tagText) {
                ctx.save();
                ctx.font = "bold 12px Arial";
                ctx.fillStyle = tagColor;
                ctx.fillText(tagText, tagOffset, yOffset + 4);
                ctx.restore();
                tagOffset += 210;
            }

            let maxHallHits = (p.hasLightAmulet && !p.lightAmuletBroken) ? 4 : 3;
            if (secretMode && (p.hallucinationHits || 0) >= maxHallHits && !(p.type === 'WATER' && p.stance === 'DEMON')) {
                ctx.save();
                ctx.font = "bold 11px Arial";
                let hPulse = 0.6 + 0.4 * Math.sin(Date.now() / 120);
                ctx.fillStyle = `rgba(220, 0, 255, ${hPulse})`;
                ctx.fillText(`⚠ ИСКАЖЕНИЕ ПУСТОТЫ (${maxHallHits}/${maxHallHits})`, tagOffset, yOffset + 4);
                ctx.restore();
            } else if (secretMode && (p.hallucinationHits || 0) > 0 && !(p.type === 'WATER' && p.stance === 'DEMON')) {
                ctx.save();
                ctx.font = "11px Arial";
                ctx.fillStyle = "rgba(180, 100, 220, 0.8)";
                ctx.fillText(`Удары пустоты: ${p.hallucinationHits}/${maxHallHits}`, tagOffset, yOffset + 4);
                ctx.restore();
            }
        }
    }

    if (!window.isStoryMode && typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal) {
        let healY = 25 + (players.length * 35) + 15;
        ctx.fillStyle = "#ffaa00"; 
        ctx.font = "bold 13px Arial"; 
        ctx.fillText(`Ограниченный хил: ${sharedHealPoints}/12`, 20, healY);
        
        let barX = 20;
        let barY = healY + 6;
        let segW = 12;
        let segH = 12;
        let gap = 3;
        for (let s = 0; s < 12; s++) {
            let sx = barX + s * (segW + gap);
            if (s < sharedHealPoints) {
                ctx.fillStyle = (s < 4) ? "#00ffff" : ((s < 8) ? "#4ade80" : "#ffcc00");
                ctx.fillRect(sx, barY, segW, segH);
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1;
                ctx.strokeRect(sx, barY, segW, segH);
            } else {
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(sx, barY, segW, segH);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
                ctx.lineWidth = 1;
                ctx.strokeRect(sx, barY, segW, segH);
            }
        }
        ctx.font = "11px Arial";
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.fillText("Хил: 8 | F: 4 | Огонь A+Вверх: 12", 20, barY + segH + 15);
    } else if (!window.isStoryMode) {
        let healY = 25 + (players.length * 35) + 15;
        ctx.fillStyle = "lime"; ctx.font = "14px Arial"; ctx.fillText("Заряды исцеления:", 20, healY);
        let hasGen = typeof players !== 'undefined' && players.some(p => p.badges && p.badges.includes('generator'));
        
        // Резерв хила (Синие деления в самом начале)
        let reservePlayers = (typeof players !== 'undefined' && players) ? players.filter(p => p.badges && p.badges.includes('heal_reserve')) : [];
        let startX = 155;
        for (let r = 0; r < reservePlayers.length; r++) {
            let rp = reservePlayers[r];
            let rx = startX + r * 16;
            let ry = healY - 5;
            ctx.save();
            ctx.beginPath(); ctx.moveTo(rx, ry - 6); ctx.lineTo(rx + 6, ry); ctx.lineTo(rx, ry + 6); ctx.lineTo(rx - 6, ry); ctx.closePath();
            if (!rp.healReserveUsed) {
                ctx.fillStyle = "#00e5ff";
                ctx.shadowColor = "#00e5ff";
                ctx.shadowBlur = rp.healingWithReserve ? 14 : 7;
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.2;
                ctx.stroke();
            } else {
                ctx.strokeStyle = "rgba(0, 229, 255, 0.35)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();
        }

        let greenStartX = startX + reservePlayers.length * 16;
        let genTargetIdx = Math.floor(sharedHeals);
        for (let j = 0; j < maxSharedHeals; j++) {
            let hx = greenStartX + j * 15; let hy = healY - 5;
            if (j < Math.floor(sharedHeals)) { 
                ctx.beginPath(); ctx.moveTo(hx, hy - 6); ctx.lineTo(hx + 6, hy); ctx.lineTo(hx, hy + 6); ctx.lineTo(hx - 6, hy); ctx.closePath(); 
                ctx.fillStyle = "lime"; ctx.fill(); 
            } else if (j < sharedHeals) { 
                ctx.beginPath(); ctx.moveTo(hx, hy - 6); ctx.lineTo(hx, hy + 6); ctx.lineTo(hx - 6, hy); ctx.closePath(); 
                ctx.fillStyle = "lime"; ctx.fill(); 
                ctx.beginPath(); ctx.moveTo(hx, hy - 6); ctx.lineTo(hx + 6, hy); ctx.lineTo(hx, hy + 6); ctx.lineTo(hx - 6, hy); ctx.closePath(); 
                ctx.strokeStyle = "rgba(0, 255, 0, 0.5)"; ctx.stroke(); 
            } else { 
                ctx.beginPath(); ctx.moveTo(hx, hy - 6); ctx.lineTo(hx + 6, hy); ctx.lineTo(hx, hy + 6); ctx.lineTo(hx - 6, hy); ctx.closePath(); 
                ctx.strokeStyle = "rgba(0, 255, 0, 0.3)"; ctx.stroke(); 
            }

            // Generator Badge: Charging Energy Animation on the next diamond in queue!
            if (hasGen && j === genTargetIdx && j < maxSharedHeals) {
                ctx.save();
                let gPulse = 0.35 + 0.35 * Math.sin(Date.now() / 130);
                ctx.fillStyle = `rgba(50, 255, 120, ${gPulse * 0.75})`;
                ctx.shadowColor = "#00ff66";
                ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.moveTo(hx, hy - 6); ctx.lineTo(hx + 6, hy); ctx.lineTo(hx, hy + 6); ctx.lineTo(hx - 6, hy); ctx.closePath();
                ctx.fill();

                // Spark streaming inwards towards diamond
                let sparkAng = (Date.now() / 150) % (Math.PI * 2);
                for (let s = 0; s < 3; s++) {
                    let a = sparkAng + (s * Math.PI * 2 / 3);
                    let dist = 8 + 3 * Math.sin(Date.now() / 90 + s);
                    let sx = hx + Math.cos(a) * dist;
                    let sy = hy + Math.sin(a) * dist;
                    ctx.fillStyle = "#aaffcc";
                    ctx.shadowBlur = 4;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }
        
        let reqHits = (typeof getHitsPerHeal === 'function') ? getHitsPerHeal() : 8;
        ctx.fillStyle = "cyan"; ctx.font = "14px Arial"; ctx.fillText(`Удары для хила: ${sharedHitCount}/${reqHits}`, 20, healY + 25);
    }
}

function draw() {
    if (!ctx) return;

    // Story Mode: Campaign Prologue Renderer
    if (window.isStoryMode && typeof drawStoryMode === 'function') {
        drawStoryMode();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    if (screenShake.timer > 0) {
        let sx = (Math.random() - 0.5) * screenShake.mag + screenShake.dirX * screenShake.mag;
        let sy = (Math.random() - 0.5) * screenShake.mag + screenShake.dirY * screenShake.mag;
        ctx.translate(sx, sy);
        screenShake.timer--;
    }

    ctx.translate(-camX, -camY);

    if (activeCinematic) {
        ctx.save();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Сотрясение всей сцены во время ударов суператаки
        if (screenShake.timer > 0) {
            let sx = (Math.random() - 0.5) * screenShake.mag * 1.35;
            let sy = (Math.random() - 0.5) * screenShake.mag * 1.35;
            ctx.translate(sx, sy);
        }

        let t = activeCinematic.tick;
        let cType = activeCinematic.type;
        let pX = GAME_WIDTH / 2;
        let pY = GAME_HEIGHT * 0.46; // Подвешен в воздухе в шоке (как Хорнет в Silksong)

        // Мягкие прожекторы/круги боке на фоне (эстетика Lost Lace)
        function drawBokehBackground(isVoid = false) {
            ctx.fillStyle = isVoid ? "#090212" : "#07080a";
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            const bokehDiscs = [
                { x: GAME_WIDTH * 0.50, y: GAME_HEIGHT * 0.44, r: 210, a: 0.16 },
                { x: GAME_WIDTH * 0.20, y: GAME_HEIGHT * 0.48, r: 150, a: 0.11 },
                { x: GAME_WIDTH * 0.78, y: GAME_HEIGHT * 0.52, r: 230, a: 0.13 },
                { x: GAME_WIDTH * 0.46, y: GAME_HEIGHT * 0.15, r: 100, a: 0.08 },
                { x: GAME_WIDTH * 0.84, y: GAME_HEIGHT * 0.22, r: 130, a: 0.07 }
            ];
            ctx.save();
            for (let b of bokehDiscs) {
                let grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
                if (isVoid) {
                    grad.addColorStop(0, `rgba(225, 185, 255, ${b.a * 1.6})`);
                    grad.addColorStop(0.45, `rgba(160, 60, 230, ${b.a * 0.85})`);
                    grad.addColorStop(1, "rgba(20, 0, 40, 0)");
                } else {
                    grad.addColorStop(0, `rgba(255, 255, 255, ${b.a * 1.8})`);
                    grad.addColorStop(0.45, `rgba(225, 230, 240, ${b.a})`);
                    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
                }
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Атмосферные парящие пылинки шёлка
            ctx.fillStyle = isVoid ? "rgba(210, 170, 255, 0.28)" : "rgba(255, 255, 255, 0.28)";
            for (let i = 0; i < 20; i++) {
                let px = (i * 47 + t * 0.7) % GAME_WIDTH;
                let py = (i * 31 + Math.sin(t * 0.06 + i) * 18) % GAME_HEIGHT;
                ctx.beginPath();
                ctx.arc(px, py, (i % 3) + 1, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Острая звёздная вспышка иглы (Needle Starburst)
        function drawNeedleStarburst(cx, cy, size, alpha = 1.0, isVoid = false) {
            if (alpha <= 0 || size <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.min(1, alpha);
            ctx.fillStyle = isVoid ? "#f3d9ff" : "#ffffff";
            ctx.shadowColor = isVoid ? "#c77dff" : "#ffffff";
            ctx.shadowBlur = 18;

            const angles = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4];
            for (let i = 0; i < angles.length; i++) {
                let ang = angles[i];
                let len = (i < 2) ? size : size * 0.6;
                let thick = Math.max(1.5, size * 0.06);
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(ang);
                ctx.beginPath();
                ctx.moveTo(-len, 0);
                ctx.lineTo(0, -thick);
                ctx.lineTo(len, 0);
                ctx.lineTo(0, thick);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(3, size * 0.12), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Острое светящееся рассечение (шрам лезвия)
        function drawRazorCut(x1, y1, x2, y2, intensity = 1.0, isVoid = false) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, Math.max(0, intensity));
            // Ореол рассечения
            ctx.strokeStyle = isVoid ? "rgba(208, 0, 255, 0.45)" : "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 14 * intensity;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Острое белое ядро рассечения
            ctx.strokeStyle = isVoid ? "#ff99ff" : "#ffffff";
            ctx.lineWidth = 3.5 * intensity;
            ctx.shadowColor = isVoid ? "#d000ff" : "#ffffff";
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        }

        function drawPlayerSilhouette(px, py, hitShake = 0) {
            let targetP = (activeCinematic && activeCinematic.p) ? activeCinematic.p : players[0];
            if (!targetP) return;

            ctx.save();
            let shakeX = (Math.random() - 0.5) * hitShake;
            let shakeY = (Math.random() - 0.5) * hitShake;
            ctx.translate(px + shakeX, py + shakeY);
            ctx.scale(2.2, 2.2);

            let dummyP = Object.assign({}, targetP, {
                x: -15,
                y: -25,
                width: 30,
                height: 50,
                vx: 0,
                vy: 0,
                facingRight: targetP.facingRight !== undefined ? targetP.facingRight : true,
                isDowned: false,
                isDashing: false,
                attackTimer: 0,
                lightCharge: 0,
                invuln: 0
            });

            ctx.shadowColor = targetP.color || "#00e5ff";
            ctx.shadowBlur = hitShake > 0 ? 35 : 15;

            drawPlayer(dummyP);

            if (hitShake > 0) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
                ctx.beginPath();
                ctx.ellipse(0, 0, 24, 32, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        function drawBossSilhouette(bx, by, facingDir = 1, isVoid = false, angle = 0) {
            ctx.save();
            ctx.translate(bx, by);
            if (angle) ctx.rotate(angle);
            ctx.scale(facingDir, 1);
            ctx.fillStyle = isVoid ? "#140024" : "#0a0a0c";
            ctx.shadowColor = isVoid ? "#d000ff" : "#ffffff";
            ctx.shadowBlur = 24;

            // Плащ
            ctx.beginPath();
            ctx.moveTo(0, -65);
            ctx.lineTo(48, 56);
            ctx.lineTo(-42, 56);
            ctx.closePath();
            ctx.fill();

            // Маска
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.ellipse(-5, -65, 18, 26, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // Острый глаз маски
            ctx.fillStyle = isVoid ? "#a855f7" : "#0a0a0c";
            ctx.beginPath();
            ctx.ellipse(-2, -65, 4, 7, -0.1, 0, Math.PI * 2);
            ctx.fill();

            // Рапира/игла
            ctx.strokeStyle = isVoid ? "#ff66ff" : "#ffffff";
            ctx.lineWidth = 4;
            ctx.shadowColor = isVoid ? "#d000ff" : "#ffffff";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(-10, -45);
            ctx.lineTo(95, -28);
            ctx.stroke();

            // Блик на конце иглы
            drawNeedleStarburst(95, -28, 14, 0.9, isVoid);
            ctx.restore();
        }

        if (cType === 'SA1') {
            // SA1: Молниеносная расправа в стиле Lost Lace (Silksong) — 72 тика (~1.2 сек)
            drawBokehBackground(false);

            // Тонкие линии скорости в ЧБ
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 20; i++) {
                let a = (i / 20) * Math.PI * 2 + (t * 0.04);
                ctx.beginPath();
                ctx.moveTo(pX + Math.cos(a) * 90, pY + Math.sin(a) * 90);
                ctx.lineTo(pX + Math.cos(a) * 800, pY + Math.sin(a) * 800);
                ctx.stroke();
            }
            ctx.restore();

            let shake = (t >= 22 && t <= 26) ? 16 : ((t >= 42 && t <= 46) ? 18 : ((t >= 62 && t <= 68) ? 22 : ((t >= 12 && t <= 14) || (t >= 32 && t <= 34) || (t >= 52 && t <= 54) ? 8 : 0)));
            drawPlayerSilhouette(pX, pY, shake);

            // 1) Разрез 1 (снизу-слева наверх-направо, пик на 12 тике)
            if (t >= 5 && t <= 14) {
                let prog = Math.min(1, Math.max(0, (t - 5) / 8));
                let bx = (pX - 380) + prog * 760;
                let by = (pY + 140) - prog * 280;
                drawBossSilhouette(bx, by, 1, false, Math.atan2(-280, 760));
            }
            // 2) Разрез 2 (сверху-справа вниз-влево, пик на 22 тике [-1 HP])
            if (t >= 15 && t <= 24) {
                let prog = Math.min(1, Math.max(0, (t - 15) / 8));
                let bx = (pX + 360) - prog * 720;
                let by = (pY - 180) + prog * 360;
                drawBossSilhouette(bx, by, -1, false, Math.atan2(360, -720));
            }
            // 3) Разрез 3 (горизонтальный пронзающий выпад, пик на 32 тике)
            if (t >= 25 && t <= 34) {
                let prog = Math.min(1, Math.max(0, (t - 25) / 8));
                let bx = (pX - 400) + prog * 800;
                let by = (pY - 20) + prog * 40;
                drawBossSilhouette(bx, by, 1, false, Math.atan2(40, 800));
            }
            // 4) Разрез 4 (крутой диагональный спуск, пик на 42 тике [-1 HP])
            if (t >= 35 && t <= 44) {
                let prog = Math.min(1, Math.max(0, (t - 35) / 8));
                let bx = (pX - 260) + prog * 520;
                let by = (pY - 280) + prog * 560;
                drawBossSilhouette(bx, by, 1, false, Math.atan2(560, 520));
            }
            // 5) Разрез 5 (обратный взлёт снизу-вверх, пик на 52 тике)
            if (t >= 45 && t <= 54) {
                let prog = Math.min(1, Math.max(0, (t - 45) / 8));
                let bx = (pX + 360) - prog * 720;
                let by = (pY + 160) - prog * 320;
                drawBossSilhouette(bx, by, -1, false, Math.atan2(-320, -720));
            }
            // 6) Разрез 6 (смертоносное вертикальное пике, пик на 62 тике [-1 HP])
            if (t >= 55 && t <= 64) {
                let prog = Math.min(1, Math.max(0, (t - 55) / 8));
                let bx = pX;
                let by = (pY - 340) + prog * 680;
                drawBossSilhouette(bx, by, 1, false, Math.PI / 2);
            }
            // Стойка босса после ударов
            if (t >= 65) {
                drawBossSilhouette(pX + 240, pY + 40, -1);
            }

            // Светящиеся разрезы (шрамы всех 6 лезвий)
            if (t >= 12) drawRazorCut(pX - 380, pY + 140, pX + 380, pY - 140, Math.max(0.2, 1 - (t - 12) / 60));
            if (t >= 22) drawRazorCut(pX + 360, pY - 180, pX - 360, pY + 180, Math.max(0.25, 1 - (t - 22) / 55));
            if (t >= 32) drawRazorCut(pX - 400, pY - 20, pX + 400, pY + 20, Math.max(0.3, 1 - (t - 32) / 50));
            if (t >= 42) drawRazorCut(pX - 260, pY - 280, pX + 260, pY + 280, Math.max(0.35, 1 - (t - 42) / 45));
            if (t >= 52) drawRazorCut(pX + 360, pY + 160, pX - 360, pY - 160, Math.max(0.45, 1 - (t - 52) / 40));
            if (t >= 62) drawRazorCut(pX, pY - 340, pX, pY + 340, Math.max(0.6, 1 - (t - 62) / 30));

            // Звёздные игольчатые вспышки при каждом ударе
            if (t >= 12 && t <= 17) drawNeedleStarburst(pX, pY, 65 * (1 - (t - 12) / 6), 1.0 - (t - 12) / 6);
            if (t >= 22 && t <= 28) drawNeedleStarburst(pX, pY, 90 * (1 - (t - 22) / 7), 1.0 - (t - 22) / 7);
            if (t >= 32 && t <= 37) drawNeedleStarburst(pX, pY, 70 * (1 - (t - 32) / 6), 1.0 - (t - 32) / 6);
            if (t >= 42 && t <= 48) drawNeedleStarburst(pX, pY, 110 * (1 - (t - 42) / 7), 1.0 - (t - 42) / 7);
            if (t >= 52 && t <= 57) drawNeedleStarburst(pX, pY, 80 * (1 - (t - 52) / 6), 1.0 - (t - 52) / 6);
            if (t >= 62 && t <= 70) drawNeedleStarburst(pX, pY, 145 * (1 - (t - 62) / 9), 1.0 - (t - 62) / 9);

            // Ослепляющая белая вспышка на каждом ударе, наносящем урон
            if (t === 22 || t === 23 || t === 42 || t === 43 || t === 62 || t === 63) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            }
        } else if (cType === 'SA2') {
            // SA2: Рассекающий свет — 48 тиков (~0.8 сек), резкий выпад на 16 тике
            drawBokehBackground(false);

            let lAngle = activeCinematic.angle !== null && activeCinematic.angle !== undefined ? activeCinematic.angle : -Math.PI / 6;

            // Направляющий луч
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pX - Math.cos(lAngle) * 900, pY - Math.sin(lAngle) * 900);
            ctx.lineTo(pX + Math.cos(lAngle) * 900, pY + Math.sin(lAngle) * 900);
            if (t <= 15) {
                ctx.setLineDash([12, 10]);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
                ctx.lineWidth = 2.5;
                ctx.stroke();
            } else {
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 16;
                ctx.stroke();
                ctx.strokeStyle = "#aaaaaa";
                ctx.lineWidth = 30;
                ctx.globalAlpha = 0.35;
                ctx.stroke();
            }
            ctx.restore();

            let shake = (t >= 16 && t <= 24) ? 20 : 0;
            drawPlayerSilhouette(pX, pY, shake);

            if (t >= 16) {
                let dashProg = Math.min(1, (t - 16) / 12);
                let dist = -420 + dashProg * 840;
                let bx = pX + Math.cos(lAngle) * dist;
                let by = pY + Math.sin(lAngle) * dist;
                let facing = Math.cos(lAngle) >= 0 ? 1 : -1;
                drawBossSilhouette(bx, by, facing, false, lAngle);
            }

            if (t >= 16 && t <= 25) {
                drawNeedleStarburst(pX, pY, 120 * (1 - (t - 16) / 10), 1.0 - (t - 16) / 9);
            }

            if (t === 16 || t === 17) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            }
        } else if (cType === 'SA3') {
            // SA3: Разрыв Пустоты — 52 тика, фатальный прорыв на 25 тике
            drawBokehBackground(true);

            let lAngle = activeCinematic.angle !== null && activeCinematic.angle !== undefined ? activeCinematic.angle : -Math.PI / 6;

            // Фиолетовый разрыв пустоты
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pX - Math.cos(lAngle) * 900, pY - Math.sin(lAngle) * 900);
            ctx.lineTo(pX + Math.cos(lAngle) * 900, pY + Math.sin(lAngle) * 900);
            if (t <= 24) {
                ctx.setLineDash([12, 10]);
                ctx.strokeStyle = "rgba(208, 0, 255, 0.85)";
                ctx.lineWidth = 3.5;
                ctx.stroke();
            } else {
                ctx.strokeStyle = "#d000ff";
                ctx.lineWidth = 26;
                ctx.stroke();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 8;
                ctx.stroke();
            }
            ctx.restore();

            let shake = (t >= 25 && t <= 38) ? 26 : 0;
            drawPlayerSilhouette(pX, pY, shake);

            if (t >= 25) {
                let dashProg = Math.min(1, (t - 25) / 13);
                let dist = -420 + dashProg * 840;
                let bx = pX + Math.cos(lAngle) * dist;
                let by = pY + Math.sin(lAngle) * dist;
                let facing = Math.cos(lAngle) >= 0 ? 1 : -1;
                drawBossSilhouette(bx, by, facing, true, lAngle);
            }

            if (t >= 25 && t <= 36) {
                drawNeedleStarburst(pX, pY, 150 * (1 - (t - 25) / 12), 1.0 - (t - 25) / 11, true);
            }

            if (t >= 25 && t <= 27) {
                ctx.fillStyle = "rgba(220, 0, 255, 0.95)";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            }
        }

        ctx.restore();
    } else {
        drawBackground();

        if (boss.state === "VULN_STANCE" || boss.state === "VULN_LATE") {
            let grad = ctx.createLinearGradient(0, 0, 0, boss.y + boss.height);
            grad.addColorStop(0, "rgba(255, 200, 100, 0.0)");
            grad.addColorStop(1, "rgba(255, 200, 100, 0.4)");
            ctx.fillStyle = grad;
            ctx.fillRect(boss.x - 20, 0, boss.width + 40, boss.y + boss.height);
        }

        for (let sr of screamRings) {
            ctx.beginPath(); ctx.arc(sr.x, sr.y, sr.r, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - (sr.r/sr.maxR)})`;
            ctx.lineWidth = 8; ctx.stroke();
        }

        if (boss.state === "VOID_FLOOR_WARN") { ctx.fillStyle = "rgba(150,0,255,0.2)"; ctx.fillRect(0, FLOOR-10, ARENA_W, 10); }
        if (boss.state === "VOID_FLOOR_ACTIVE") { ctx.fillStyle = "rgba(150,0,255,0.6)"; ctx.fillRect(0, FLOOR-15, ARENA_W, 15); }

        // Boss Wind attack has NO visual overlays/lines; strictly background leaf movement as requested by Timur!

        if (secretMode && boss.saLines) { 
            for (let l of boss.saLines) {
                ctx.save();
                ctx.beginPath(); ctx.moveTo(l.x1, l.y1);
                let drawX2 = l.x2; let drawY2 = l.y2;
                let isExecuting = (boss.saLinesState === "EXECUTE" || boss.state === "SA_EXECUTE");
                if (isExecuting) {
                    let progress = (boss.saLinesState === "EXECUTE") ? (1 - (boss.saLinesTimer / 10)) : (1 - (boss.stateTimer / 6));
                    drawX2 = l.x1 + (l.x2 - l.x1) * progress;
                    drawY2 = l.y1 + (l.y2 - l.y1) * progress;
                    ctx.lineTo(drawX2, drawY2);
                    ctx.strokeStyle = (l.type === "SA3") ? "#c044ff" : "#ffffff"; 
                    ctx.lineWidth = 40; 
                    ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(drawX2, drawY2);
                    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 12; ctx.stroke();
                } else {
                    ctx.setLineDash([8, 8]);
                    ctx.lineTo(drawX2, drawY2);
                    ctx.strokeStyle = (l.type === "SA3") ? "rgba(200, 50, 255, 0.75)" : "rgba(255, 255, 255, 0.75)";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        if (window.isFireBossMode) {
            drawAshParticles();
        } else {
            for (let l of arenaLeaves) { 
                ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.angle); 
                ctx.fillStyle = secretMode ? "rgba(150,0,255,0.5)" : l.color; 
                ctx.fillRect(-l.size/2, -l.size/2, l.size, l.size/2); 
                ctx.restore(); 
            }
        }

        // Falling & grounded banana peels from ability
        drawFallingBananaPeels();

        for (let b of airBlades) { 
            ctx.save(); ctx.translate(b.x, b.y); 
            ctx.rotate(Date.now() / 50); 
            ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(10, 0); ctx.lineTo(0, 10); ctx.lineTo(-10, 0); ctx.closePath(); 
            ctx.fillStyle = b.deflected === 1 ? "yellow" : "cyan"; ctx.fill(); 
            ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore(); 
        }
        
        for (let d of blackDaggers) { 
            ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(Math.atan2(d.vy, d.vx)); 
            if (d.isShuriken) { 
                ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(12, 0); ctx.lineTo(0, 12); ctx.lineTo(-12, 0); ctx.closePath();
                ctx.fillStyle = d.deflected === 1 ? "yellow" : (d.infected ? "#00ffff" : "#1a001a"); ctx.fill(); 
                ctx.strokeStyle = d.infected ? "white" : "#9900ff"; ctx.lineWidth = 2; ctx.stroke();
            } else { 
                ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, 5); ctx.lineTo(-8, -5); ctx.closePath(); 
                ctx.fillStyle = d.deflected === 1 ? "yellow" : (d.isSecret ? (d.infected ? "#00ffff" : "#1a001a") : "#111"); 
                ctx.fill(); 
                ctx.strokeStyle = d.isSecret ? (d.infected ? "white" : "#9900ff") : "#555"; 
                ctx.lineWidth = 2; ctx.stroke(); 
                ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-18, 0); 
                ctx.strokeStyle = d.isSecret ? "rgba(153, 0, 255, 0.6)" : "rgba(100, 100, 100, 0.6)"; 
                ctx.lineWidth = 1; ctx.stroke(); 
            }
            ctx.restore(); 
        }
        
        for (let pt of voidPortals) {
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 25, 0, Math.PI*2);
            let grad = ctx.createRadialGradient(pt.x, pt.y, 5, pt.x, pt.y, 25);
            grad.addColorStop(0, "black");
            grad.addColorStop(1, "white");
            ctx.fillStyle = grad; ctx.fill();
            ctx.strokeStyle = "#9900ff"; ctx.lineWidth = 3; ctx.stroke();
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 10 + Math.sin(Date.now()/100)*5, 0, Math.PI*2);
            ctx.fillStyle = "rgba(153, 0, 255, 0.5)"; ctx.fill();
        }

        for (let d of playerDaggers) { 
            ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(Math.atan2(d.vy, d.vx)); 
            ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, 5); ctx.lineTo(-10, -5); ctx.closePath(); 
            ctx.fillStyle = d.isFire ? "#ff5500" : "#00ffff"; ctx.fill(); 
            ctx.strokeStyle = d.isFire ? "#ffcc00" : "white"; ctx.stroke(); 
            ctx.restore(); 
        }

        // Water Ropes (Малыш Воды)
        for (let p of players) {
            if (p && p.type === 'WATER_ROPE') {
                if (p.ropeA && !p.ropeActive) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(p.ropeA.x, p.ropeA.y, 6, 0, Math.PI * 2);
                    ctx.fillStyle = "#00ffff";
                    ctx.shadowColor = "#00e5ff";
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                } else if (p.ropeActive && p.ropeA && p.ropeB) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(p.ropeA.x, p.ropeA.y);
                    ctx.lineTo(p.ropeB.x, p.ropeB.y);
                    ctx.strokeStyle = "rgba(0, 229, 255, 0.85)";
                    ctx.lineWidth = 4;
                    ctx.shadowColor = "#00e5ff";
                    ctx.shadowBlur = 12;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(p.ropeA.x, p.ropeA.y);
                    ctx.lineTo(p.ropeB.x, p.ropeB.y);
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.fillStyle = "#00e5ff";
                    ctx.beginPath(); ctx.arc(p.ropeA.x, p.ropeA.y, 5, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(p.ropeB.x, p.ropeB.y, 5, 0, Math.PI * 2); ctx.fill();

                    let pDist = distToSegment({ x: p.x + p.width/2, y: p.y + p.height/2 }, p.ropeA, p.ropeB);
                    if (pDist < 100 && !p.isRopeSliding) {
                        ctx.save();
                        let promptText = "[X] ЗАЦЕПИТЬСЯ ЗА ТРОС";
                        ctx.font = "bold 13px Arial";
                        let textW = ctx.measureText(promptText).width;
                        let bx = p.x + p.width/2 - textW/2 - 8;
                        let by = p.y - 28;
                        ctx.fillStyle = "rgba(10, 20, 35, 0.85)";
                        ctx.strokeStyle = "#00ffff";
                        ctx.lineWidth = 1.5;
                        ctx.shadowColor = "#00ffff";
                        ctx.shadowBlur = 8;
                        if (ctx.roundRect) ctx.roundRect(bx, by, textW + 16, 20, 5);
                        else ctx.rect(bx, by, textW + 16, 20);
                        ctx.fill();
                        ctx.stroke();
                        ctx.fillStyle = "#00ffff";
                        ctx.textAlign = "center";
                        ctx.fillText(promptText, p.x + p.width/2, by + 14);
                        ctx.restore();
                    } else if (p.isRopeSliding) {
                        ctx.save();
                        let promptText = "[Стрелки] Движение   [Z] Спрыгнуть";
                        ctx.font = "bold 12px Arial";
                        let textW = ctx.measureText(promptText).width;
                        let bx = p.x + p.width/2 - textW/2 - 8;
                        let by = p.y - 28;
                        ctx.fillStyle = "rgba(10, 20, 35, 0.85)";
                        ctx.strokeStyle = "#00e5ff";
                        ctx.lineWidth = 1.5;
                        ctx.shadowColor = "#00e5ff";
                        ctx.shadowBlur = 8;
                        if (ctx.roundRect) ctx.roundRect(bx, by, textW + 16, 20, 5);
                        else ctx.rect(bx, by, textW + 16, 20);
                        ctx.fill();
                        ctx.stroke();
                        ctx.fillStyle = "#ffffff";
                        ctx.textAlign = "center";
                        ctx.fillText(promptText, p.x + p.width/2, by + 14);
                        ctx.restore();
                    }
                    ctx.restore();
                }
            }
        }

        // Loom Threads (Нить станка: световая нить-шлейф и яркое желто-белое ядро с голубой обводкой)
        for (let lt of loomThreads) {
            ctx.save();
            if (lt.trail && lt.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(lt.trail[0].x, lt.trail[0].y);
                for (let ti = 1; ti < lt.trail.length; ti++) {
                    ctx.lineTo(lt.trail[ti].x, lt.trail[ti].y);
                }
                ctx.lineTo(lt.x, lt.y);
                ctx.strokeStyle = "rgba(0, 229, 255, 0.65)";
                ctx.lineWidth = 3.5;
                ctx.shadowColor = "#00ffff";
                ctx.shadowBlur = 8;
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(lt.x, lt.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "#00e5ff";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#ffea00";
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.restore();
        }

        // Light Amulet block waves (Неоново-бирюзовые кольца-волны парирования)
        for (let w of lightAmuletWaves) {
            ctx.save();
            let alpha = Math.max(0, w.timer / 20);
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.9})`;
            ctx.lineWidth = 3.5;
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
        }

        for (let t of airTraps) { 
            ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(Date.now()/50); 
            ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); 
            ctx.fillStyle = "#ffdd00"; ctx.fill(); ctx.strokeStyle = "white"; ctx.stroke(); ctx.restore(); 
        }
        for (let t of airComboTraps) { 
            ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(-Date.now()/50); 
            ctx.beginPath(); ctx.arc(0,0, 10, 0, Math.PI*2); 
            ctx.fillStyle = "rgba(255, 255, 100, 0.9)"; ctx.fill(); 
            ctx.strokeStyle = "yellow"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); 
        }
        for (let e of voidExplosions) { 
            ctx.beginPath(); ctx.arc(e.x, e.y, e.timer * (e.r ? (e.r/30) : 1), 0, Math.PI*2); 
            ctx.fillStyle = e.isOrange ? `rgba(255,100,0,${e.timer/30})` : (e.isWhite ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"); 
            ctx.fill(); 
        }

        for (let p of players) { 
            if (p.type === 'STAMINA' || Object.values(p.abilities).includes('charge')) { 
                for (let cp of p.chargeProjectiles) { 
                    ctx.beginPath(); ctx.arc(cp.x, cp.y, 8 + cp.dmg*2, 0, Math.PI*2); 
                    ctx.fillStyle = "rgba(0, 255, 255, 0.8)"; ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke(); 
                } 
            } 
        }
        for (let t of p2Traps) { 
            ctx.fillStyle = "lime"; ctx.beginPath(); ctx.moveTo(t.x + 15, t.y - 10); ctx.lineTo(t.x, t.y); ctx.lineTo(t.x + 35, t.y); ctx.closePath(); ctx.fill(); 
        }

        if (gameState === "PLAYING") {
            // Фаза 4: Отрисовка сфер и центрального Монолита в арене
            if (boss.phase === 4 && boss.lPhase4Orbs) {
                let t = Date.now();
                for (let orb of boss.lPhase4Orbs) {
                    if (orb.alive) {
                        let floatY = orb.y + Math.sin(t / 220 + orb.x) * 6;
                        ctx.save();
                        if (orb.isMonolith) {
                            // Центральный Монолит Бездны
                            let monoW = 36;
                            let monoH = 72;
                            let monoX = orb.x - monoW / 2;
                            let monoY = floatY - monoH / 2;
                            let mPulse = 0.5 + 0.3 * Math.sin(t / 140);

                            let grad = ctx.createRadialGradient(orb.x, floatY, 8, orb.x, floatY, 60);
                            grad.addColorStop(0, `rgba(220, 50, 255, ${mPulse * 0.95})`);
                            grad.addColorStop(0.5, `rgba(130, 0, 220, ${mPulse * 0.45})`);
                            grad.addColorStop(1, "rgba(20, 0, 40, 0)");
                            ctx.fillStyle = grad;
                            ctx.beginPath();
                            ctx.arc(orb.x, floatY, 60, 0, Math.PI * 2);
                            ctx.fill();

                            ctx.fillStyle = "#0c0414";
                            ctx.beginPath();
                            ctx.moveTo(orb.x, monoY - 12);
                            ctx.lineTo(monoX + monoW, monoY + 16);
                            ctx.lineTo(monoX + monoW - 4, monoY + monoH);
                            ctx.lineTo(monoX + 4, monoY + monoH);
                            ctx.lineTo(monoX, monoY + 16);
                            ctx.closePath();
                            ctx.fill();

                            ctx.strokeStyle = "#e040fb";
                            ctx.lineWidth = 3;
                            ctx.shadowColor = "#d500f9";
                            ctx.shadowBlur = 18;
                            ctx.stroke();

                            ctx.strokeStyle = `rgba(255, 200, 255, ${mPulse})`;
                            ctx.lineWidth = 1.5;
                            ctx.beginPath();
                            ctx.moveTo(orb.x, monoY + 6);
                            ctx.lineTo(orb.x - 7, monoY + 26);
                            ctx.lineTo(orb.x + 7, monoY + 46);
                            ctx.lineTo(orb.x, monoY + monoH - 8);
                            ctx.stroke();
                        } else {
                            let oPulse = 0.4 + 0.25 * Math.sin(t / 150 + orb.x);
                            let grad = ctx.createRadialGradient(orb.x, floatY, 4, orb.x, floatY, orb.r + 14);
                            grad.addColorStop(0, "rgba(220, 0, 255, 0.95)");
                            grad.addColorStop(0.5, `rgba(120, 0, 200, ${oPulse})`);
                            grad.addColorStop(1, "rgba(20, 0, 40, 0)");
                            ctx.fillStyle = grad;
                            ctx.beginPath();
                            ctx.arc(orb.x, floatY, orb.r + 14, 0, Math.PI * 2);
                            ctx.fill();

                            ctx.beginPath();
                            ctx.arc(orb.x, floatY, orb.r, 0, Math.PI * 2);
                            ctx.fillStyle = "#120024";
                            ctx.fill();
                            ctx.strokeStyle = "#dd00ff";
                            ctx.lineWidth = 2.5;
                            ctx.shadowColor = "#cc00ff";
                            ctx.shadowBlur = 15;
                            ctx.stroke();

                            for (let s = 0; s < 3; s++) {
                                let ang = (t / 180) + s * (Math.PI * 2 / 3);
                                let sx = orb.x + Math.cos(ang) * (orb.r * 0.5);
                                let sy = floatY + Math.sin(ang) * (orb.r * 0.5);
                                ctx.fillStyle = "#ffffff";
                                ctx.beginPath();
                                ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                        ctx.restore();
                    }
                }
            }

            // Footstep dust puffs under heroes' feet
            if (typeof stepPuffs !== 'undefined' && stepPuffs.length > 0) {
                ctx.save();
                for (let sp of stepPuffs) {
                    ctx.beginPath();
                    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(180, 160, 140, ${Math.max(0, sp.alpha)})`;
                    ctx.fill();
                }
                ctx.restore();
            }

            drawBoss();
            for (let p of players) {
                if (p) drawPlayer(p);
            }

            // Чёрное зеркало в L-режиме: отражение босса и героев в обсидиановом полу Бездны
            if (secretMode && typeof drawAbyssFloorMirror === 'function') {
                drawAbyssFloorMirror();
            }

            // Разрушения арены и эффекты Фазы 3:
            if (secretMode) {
                drawFloorCracks();
                drawVoidPuddles();
                drawVoidCeilingDrips();
                drawBoulders();
                drawBrokenRightWall();
                drawAbyssGooFloor();
            }

            if (secretMode && hasTeamHallucinations()) {
                let time = Date.now();
                let pMain = players[0];
                let phantomPositions = [
                    { x: boss.x + Math.sin(time / 280) * 160, y: boss.y - 30 + Math.cos(time / 330) * 20 },
                    { x: pMain.x + Math.cos(time / 210) * 220, y: FLOOR - 80 + Math.sin(time / 250) * 15 },
                    { x: ARENA_W / 2 + Math.sin(time / 390) * 350, y: FLOOR - 130 + Math.sin(time / 180) * 30 }
                ];
                for (let ph of phantomPositions) {
                    let flicker = 0.2 + 0.25 * Math.sin(time / 90 + ph.x);
                    if (flicker > 0.05) {
                        ctx.save();
                        ctx.translate(ph.x, ph.y);
                        ctx.globalAlpha = Math.min(0.6, flicker);
                        ctx.fillStyle = "#1e0033";
                        ctx.shadowColor = "#cc00ff";
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.moveTo(0, -35);
                        ctx.lineTo(16, 25);
                        ctx.lineTo(-16, 25);
                        ctx.closePath();
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(0, -30, 10, 0, Math.PI * 2);
                        ctx.fillStyle = "#ffffff";
                        ctx.fill();
                        ctx.fillStyle = "#ff00ff";
                        ctx.beginPath();
                        ctx.arc(-3, -30, 2, 0, Math.PI * 2);
                        ctx.arc(3, -30, 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = "#8800cc";
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(12, 5);
                        ctx.lineTo(28, 20);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
        }

        ctx.fillStyle = "#030303";
        for (let cb of chaosBalls) {
            ctx.beginPath(); ctx.arc(cb.x, cb.y, cb.r, 0, Math.PI*2); ctx.fill();
        }
        // Draw Tutorial Dots & Targets
        if (typeof isTutorial !== 'undefined' && isTutorial) {
            let now = performance.now();
            if (tutorialDots && tutorialDots.length > 0) {
                for (let dot of tutorialDots) {
                    if (dot) {
                        let pulse = Math.sin(now / 150) * 3;
                        let r = 14 + pulse;
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(0, 255, 255, 0.35)";
                        ctx.fill();

                        ctx.beginPath();
                        ctx.arc(dot.x, dot.y, 8, 0, Math.PI * 2);
                        ctx.fillStyle = "#ffffff";
                        ctx.shadowColor = "#00ffff";
                        ctx.shadowBlur = 12;
                        ctx.fill();
                        ctx.restore();
                    }
                }
            }

            if (tutorialTargets && tutorialTargets.length > 0) {
                for (let trg of tutorialTargets) {
                    ctx.save();
                    ctx.translate(trg.x, trg.y);
                    let pulse = Math.sin(now / 200) * 2;

                    // Отрисовка живого анимированного оранжевого слизня из itch-библиотеки!
                    if (externalGameAssets.slimes && externalGameAssets.slimes.length > 0) {
                        let sFrame = Math.floor(now / 110) % externalGameAssets.slimes.length;
                        let sImg = externalGameAssets.slimes[sFrame];
                        if (sImg) {
                            // Мягкое оранжевое свечение
                            let glow = ctx.createRadialGradient(0, 4, 2, 0, 4, 30);
                            glow.addColorStop(0, "rgba(255, 140, 0, 0.45)");
                            glow.addColorStop(1, "rgba(255, 100, 0, 0)");
                            ctx.fillStyle = glow;
                            ctx.beginPath();
                            ctx.arc(0, 4, 30, 0, Math.PI * 2);
                            ctx.fill();

                            // Анимированное дыхание/пружинистость
                            let squish = 1.0 + Math.sin(now / 140) * 0.08;
                            let sW = 54 * squish;
                            let sH = 38 / squish;
                            ctx.drawImage(sImg, -sW / 2, -sH / 2, sW, sH);

                            // Стильная пунктирная прицельная рамка вокруг слизня
                            ctx.beginPath();
                            ctx.arc(0, 0, trg.r + pulse + 4, 0, Math.PI * 2);
                            ctx.strokeStyle = "rgba(255, 160, 50, 0.85)";
                            ctx.lineWidth = 2;
                            ctx.setLineDash([4, 4]);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }
                    } else {
                        ctx.beginPath();
                        ctx.arc(0, 0, trg.r + pulse, 0, Math.PI * 2);
                        ctx.strokeStyle = "#ff0077";
                        ctx.lineWidth = 2.5;
                        ctx.shadowColor = "#ff0077";
                        ctx.shadowBlur = 10;
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.arc(0, 0, trg.r * 0.55, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(255, 50, 100, 0.4)";
                        ctx.fill();

                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(-trg.r - 4, 0); ctx.lineTo(trg.r + 4, 0);
                        ctx.moveTo(0, -trg.r - 4); ctx.lineTo(0, trg.r + 4);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            }
        }
    }
    
    // 1. World Events rendering (in world coordinates)
    drawWorldEvents();

    // 2. Dome arena masking (in world coordinates)
    if (window.isFireBossMode && typeof maskOutsideFireDome === 'function') {
        maskOutsideFireDome();
    }

    ctx.filter = "none";
    ctx.restore(); 

    // HUD overlays & Vignettes
    let maxHeat = 0;
    let maxChill = 0;
    let maxVoidDamage = 0;
    
    if (gameState === "PLAYING") {
        for (let p of players) {
            if (p.heatLevel > maxHeat) maxHeat = p.heatLevel;
            if (p.chillTimer > maxChill) maxChill = p.chillTimer;
            if (p.voidDamageTimer > maxVoidDamage) maxVoidDamage = p.voidDamageTimer;
        }
        if (maxHeat > 0) {
            let grad = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, 200, GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH/1.5);
            grad.addColorStop(0, "transparent");
            grad.addColorStop(1, `rgba(255, 80, 0, ${maxHeat * 0.6})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
        if (maxChill > 0) {
            let chillAlpha = Math.min(0.4, maxChill / 60); 
            let grad = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, 200, GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH/1.5);
            grad.addColorStop(0, "transparent");
            grad.addColorStop(1, `rgba(0, 200, 255, ${chillAlpha})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
        if (maxVoidDamage > 0) {
            let voidAlpha = (maxVoidDamage / 45) * 0.8;
            let grad = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH/4, GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH/1.2);
            grad.addColorStop(0, "transparent");
            grad.addColorStop(1, `rgba(0, 0, 0, ${voidAlpha})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        let hasHallucinations = secretMode && players.some(p => (p.hallucinationHits || 0) >= ((p.hasLightAmulet && !p.lightAmuletBroken) ? 4 : 3) && !(p.type === 'WATER' && p.stance === 'DEMON'));
        if (hasHallucinations) {
            let pulse = 0.45 + 0.3 * Math.sin(Date.now() / 140);
            let grad = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH/3.8, GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH/1.1);
            grad.addColorStop(0, "transparent");
            grad.addColorStop(0.65, `rgba(90, 0, 160, ${pulse * 0.35})`);
            grad.addColorStop(1, `rgba(160, 0, 255, ${pulse * 0.85})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
    }

    if (boss.state === "FREE_ROAM" || boss.state === "DEFEATED") {
        ctx.save();
        ctx.fillStyle = "white"; 
        ctx.font = "bold 56px Arial"; 
        ctx.textAlign = "center"; 
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 10;
        ctx.fillText(isTutorial ? "ПОБЕДА!" : "ПОБЕДА", GAME_WIDTH/2, 130);
        
        if (typeof isTutorial !== 'undefined' && isTutorial) {
            ctx.font = "bold 21px Arial";
            ctx.fillStyle = "#00ff88";
            ctx.shadowColor = "rgba(0,255,136,0.7)";
            ctx.shadowBlur = 10;
            ctx.fillText("Обучение пройдено, теперь ты готов(-а) к настоящему бою", GAME_WIDTH/2, 185);
        } else {
            if (!window.isFireBossMode && !secretMode) {
                ctx.font = "bold 22px Arial";
                ctx.fillStyle = "#ffdd44";
                ctx.shadowColor = "rgba(0,0,0,0.9)";
                ctx.shadowBlur = 8;
                ctx.fillText("«Хах, считай это дружеским спаррингом!»", GAME_WIDTH/2, 175);
            }

            ctx.font = "bold 18px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(0,0,0,0.9)";
            ctx.shadowBlur = 8;
            ctx.fillText("Нажмите 'R' для новой битвы", GAME_WIDTH/2, (secretMode || window.isFireBossMode) ? 180 : 215);
        }

        ctx.restore();
        ctx.textAlign = "left"; 
    }

    // 1. Fire Boss Intro blinding white flash overlay (screen space)
    if (window.isFireBossMode && boss && boss.state === "FIRE_INTRO") {
        let elapsed = 225 - boss.introTimer;
        if (elapsed === 136 && window.fireBossAudioEngine) {
            window.fireBossAudioEngine.flashApexImpact();
        }
        if (elapsed >= 135) {
            let flashAlpha = 1.0;
            if (elapsed < 145) {
                flashAlpha = (elapsed - 135) / 10;
            } else if (elapsed > 175) {
                flashAlpha = Math.max(0, (225 - elapsed) / 50);
            }
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.restore();
        }
    }

    // ============================================================
    // --- FOREFRONT HUD & UI LAYER ---
    // (Pinned to top-left screen (0,0), rendered on top of EVERYTHING)
    // ============================================================
    if (gameState === "PLAYING") {
        drawMasks(); 
        if (!activeCinematic && !isTutorial && boss.state !== "DEFEATED" && !boss.state.startsWith("CINEMATIC") && boss.state !== "FREE_ROAM" && !boss.state.startsWith("L_CLIMB") && boss.state !== "FIRE_INTRO" && boss.state !== "FIRE_FINALE") { 
            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(GAME_WIDTH/2 - 200, 375, 400, 10); 
            let maxTotal = (boss.totalMaxHp || (boss.maxHp + (phase2Hp || 0) + (phase3Hp || 0))) || 60;
            let currentTotal = Math.max(0, Math.ceil(getBossTotalHp()));
            let hpBarColor = "red";
            let isLightGlow = (boss.lightInfected > 0 || boss.hunterInfected > 0);
            if (window.isFireBossMode) {
                hpBarColor = "#ff3b00";
            } else if (isLightGlow) {
                hpBarColor = "#00ffff";
            } else if (boss.heroBleedTimer > 0) {
                hpBarColor = "#ff00aa";
            }
            ctx.fillStyle = hpBarColor;
            let barW = Math.min(400, Math.max(0, (getBossTotalHp() / maxTotal) * 400));
            ctx.fillRect(GAME_WIDTH/2 - 200, 375, barW, 10); 
            if (isLightGlow) {
                ctx.save();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.5;
                ctx.strokeRect(GAME_WIDTH/2 - 200, 375, barW, 10);
                ctx.restore();
            }
            ctx.save();
            ctx.font = "bold 12px Arial"; 
            ctx.textAlign = "center";
            let isEasy = !!(typeof easyBossMode !== 'undefined' && easyBossMode) || !!window.easyBossMode;
            let easyBadge = isEasy ? "  [🌿 Ослаблен: 0.75x HP, урон -50%]" : "";
            ctx.fillStyle = isEasy ? "#4ade80" : "#ffffff";
            if (window.isFireBossMode) {
                ctx.fillText(`🔥 Фехтовальщик Огня  |  ${Math.max(0, Math.ceil(boss.hp))} / 14 HP`, GAME_WIDTH/2, 385);
            } else {
                let phaseLabel = boss.phase >= 4 ? "Фаза: 4" : (boss.phase >= 3 ? "Фаза: 3" : (boss.phase >= 2 ? "Фаза: 2" : "Фаза: 1"));
                ctx.fillText(`${phaseLabel}  |  ${currentTotal} / ${maxTotal} HP${easyBadge}`, GAME_WIDTH/2, 385);
            }
            ctx.restore();

            // Phase 4: 3 фиолетовых значка (Сфера, Монолит, Сфера) рядом с полоской босса
            if (boss.phase === 4 && boss.lPhase4Orbs && boss.lPhase4Orbs.length >= 2) {
                let orbStartX = GAME_WIDTH/2 + 215;
                let orbY = 380;
                for (let k = 0; k < boss.lPhase4Orbs.length; k++) {
                    let target = boss.lPhase4Orbs[k];
                    let ox = orbStartX + k * 18;
                    let isAlive = target && target.alive;
                    ctx.save();
                    if (target.isMonolith) {
                        ctx.beginPath();
                        ctx.moveTo(ox, orbY - 8);
                        ctx.lineTo(ox + 5, orbY);
                        ctx.lineTo(ox, orbY + 8);
                        ctx.lineTo(ox - 5, orbY);
                        ctx.closePath();
                        if (isAlive) {
                            ctx.fillStyle = "#e040fb";
                            ctx.shadowColor = "#ff00ff";
                            ctx.shadowBlur = 12;
                            ctx.fill();
                            ctx.strokeStyle = "#ffffff";
                            ctx.lineWidth = 1.5;
                            ctx.stroke();
                        } else {
                            ctx.fillStyle = "rgba(40, 0, 60, 0.6)";
                            ctx.fill();
                            ctx.strokeStyle = "rgba(170, 0, 255, 0.4)";
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    } else {
                        ctx.beginPath();
                        ctx.arc(ox, orbY, 6, 0, Math.PI * 2);
                        if (isAlive) {
                            ctx.fillStyle = "#cc00ff";
                            ctx.shadowColor = "#cc00ff";
                            ctx.shadowBlur = 10;
                            ctx.fill();
                            ctx.strokeStyle = "#ffffff";
                            ctx.lineWidth = 1.5;
                            ctx.stroke();
                        } else {
                            ctx.fillStyle = "rgba(40, 0, 60, 0.6)";
                            ctx.fill();
                            ctx.strokeStyle = "rgba(170, 0, 255, 0.4)";
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    }
                    ctx.restore();
                }
            }
        }

        // Battle Announcements (e.g. «Амулет света сломан»)
        for (let i = battleAnnouncements.length - 1; i >= 0; i--) {
            let ba = battleAnnouncements[i];
            ba.timer--;
            ctx.save();
            let alpha = Math.min(1, ba.timer / 25);
            ctx.globalAlpha = alpha;
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = ba.color || "#00ffff";
            ctx.shadowColor = ba.color || "#00ffff";
            ctx.shadowBlur = 18;
            ctx.fillText(ba.text, GAME_WIDTH / 2, 130);
            ctx.restore();
            if (ba.timer <= 0) battleAnnouncements.splice(i, 1);
        }

        // HUD for Abyss Falling & 10-Platform Climb
        if (!activeCinematic && (boss.state === "L_CLIMB_TRANSITION" || boss.state.startsWith("L_CLIMB"))) {
            ctx.save();
            ctx.textAlign = "center";
            if (boss.transitionTimer < 120) {
                // Free fall
                ctx.font = "bold 20px Arial";
                ctx.fillStyle = "#c084fc";
                ctx.shadowColor = "rgba(168, 85, 247, 0.8)";
                ctx.shadowBlur = 12;
                ctx.fillText("↓ ПАДЕНИЕ В БЕЗДНУ ↓", GAME_WIDTH / 2, 45);
                ctx.font = "13px Arial";
                ctx.fillStyle = "#e9d5ff";
                let depthMeters = Math.round(boss.transitionTimer * 18);
                ctx.fillText(`Глубина погружения: ${depthMeters} м`, GAME_WIDTH / 2, 68);
            } else {
                // Climbing 10 platforms
                let currentPlatNum = 1;
                for (let p of players) {
                    if (p.highestPlatReached) currentPlatNum = Math.max(currentPlatNum, p.highestPlatReached);
                }
                ctx.font = "bold 18px Arial";
                ctx.fillStyle = "#ffd700";
                ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
                ctx.shadowBlur = 10;
                ctx.fillText("▲ ПОДЪЕМ НА ВЕРШИНУ ▲", GAME_WIDTH / 2, 42);
                ctx.font = "bold 13px Arial";
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                ctx.shadowBlur = 4;
                ctx.fillText(`Платформы: [ ${currentPlatNum} / 10 ]  —  Доберитесь до 10-й платформы!`, GAME_WIDTH / 2, 64);
            }
            ctx.restore();
        }

        if (boss.phase === 3 && boss.phase3AnnouncementTimer > 0) {
            boss.phase3AnnouncementTimer--;
            let alpha = Math.min(1, boss.phase3AnnouncementTimer / 30);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = "center";
            ctx.font = "bold 26px Arial";
            ctx.fillStyle = "#ffd700";
            ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
            ctx.shadowBlur = 15;
            ctx.fillText("⚔️ ФАЗА 3: ВЕРШИНА БЕЗДНЫ ⚔️", GAME_WIDTH / 2, 110);
            ctx.font = "bold 14px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
            ctx.shadowBlur = 6;
            ctx.fillText("Босс вернулся во всей своей мощи!", GAME_WIDTH / 2, 135);
            ctx.restore();
        }

        // Test Mode HUD Indicator (Corner)
        if (testModeUnlocked || window.testModeUnlocked) {
            ctx.save();
            let boxW = 162, boxH = 46;
            let boxX = GAME_WIDTH - boxW - 14;
            let boxY = 12;
            ctx.fillStyle = "rgba(12, 18, 28, 0.85)";
            let activeAny = (godModeActive || window.godModeActive || megaDamageActive || window.megaDamageActive);
            ctx.strokeStyle = activeAny ? "#00ff66" : "#445566";
            ctx.lineWidth = 1.5;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            ctx.font = "bold 11px Arial";
            ctx.textAlign = "left";

            // God Mode line
            let isGod = (godModeActive || window.godModeActive);
            ctx.fillStyle = isGod ? "#44ff44" : "#778899";
            ctx.fillText(`[9] БЕССМЕРТИЕ: ${isGod ? "ВКЛ" : "ВЫКЛ"}`, boxX + 8, boxY + 18);

            // Mega Damage line
            let isMega = (megaDamageActive || window.megaDamageActive);
            ctx.fillStyle = isMega ? "#ffaa00" : "#778899";
            ctx.fillText(`[0] УРОН x5: ${isMega ? "ВКЛ" : "ВЫКЛ"}`, boxX + 8, boxY + 36);

            ctx.restore();
        }

        if (typeof isTutorial !== 'undefined' && isTutorial) {
            drawTutorialHUD();
        }
    } else if (gameState === "GAMEOVER") { 
        ctx.fillStyle = "red"; ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.fillText("ВЫ ПОГИБЛИ", GAME_WIDTH/2, 180); 
        ctx.font = "20px Arial"; ctx.fillText("Нажмите 'R' для рестарта", GAME_WIDTH/2, 220); ctx.textAlign = "left";
    }
}

function drawTutorialHUD() {
    if (!isTutorial) return;

    ctx.save();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let title = "";
    let desc = "";
    let pKey = (action) => {
        if (p1InputType === 'GAMEPAD') {
            if (action === 'left' || action === 'right') return 'D-Pad / Стик';
            if (action === 'jump') return 'Кнопка A (✕)';
            if (action === 'attack') return 'Кнопка X (▢)';
            if (action === 'heal') return 'Кнопка B (◯)';
            if (action === 'dash') return 'Кнопка RT / ZR';
            if (action === 'special') return 'Кнопка RB (R1)';
            return 'Геймпад';
        }
        if (p1InputType === 'TOUCH') {
            if (action === 'left' || action === 'right') return 'Экранный джойстик';
            if (action === 'jump') return '[ПРЫЖОК]';
            if (action === 'attack') return '[АТАКА]';
            if (action === 'heal') return '[ХИЛ]';
            if (action === 'dash') return '[РЫВОК]';
            if (action === 'special') return '[СПЕЦ]';
            return 'Сенсор';
        }
        let scheme = (p1InputType === 'KEYBOARD_2' || p1InputType === 'KEYBOARD_SHOOTER') ? userControls.SCHEME_2 : userControls.SCHEME_1;
        return '[' + formatKeyName(scheme[action]) + ']';
    };

    if (tutorialStep === 'WALK') {
        title = "ШАГ 1/8: ДВИЖЕНИЕ";
        desc = `Используй ${pKey('left')} и ${pKey('right')} для ходьбы. Собери сферы на арене!`;
    } else if (tutorialStep === 'JUMP') {
        title = "ШАГ 2/8: ПРЫЖОК И ПЛАТФОРМЫ";
        desc = `Нажми ${pKey('jump')} для прыжка. Запрыгни на платформу и собери сферы!`;
    } else if (tutorialStep === 'DASH') {
        title = "ШАГ 3/8: БЫСТРЫЙ РЫВОК";
        desc = `Нажми ${pKey('dash')} для стремительного рывка вперед. Собери сферы рывком!`;
    } else if (tutorialStep === 'WALL') {
        title = "ШАГ 4/8: КАРАБКАНИЕ ПО СТЕНАМ";
        desc = `Прыгай в сторону стены и нажимай ${pKey('jump')}, чтобы отталкиваться выше!`;
    } else if (tutorialStep === 'ATTACK') {
        title = "ШАГ 5/8: БОЕВОЙ УДАР КЛИНКОМ";
        desc = `Нажми ${pKey('attack')} для удара клинком. Разбей 3 тренировочные мишени!`;
    } else if (tutorialStep === 'HEAL') {
        title = "ШАГ 6/8: ИСЦЕЛЕНИЕ";
        desc = `Осторожно, ты ранен! Зажми и удерживай ${pKey('heal')}, чтобы восполнить здоровье (доступно 4 заряда).`;
    } else if (tutorialStep === 'SPECIAL') {
        title = "ШАГ 7/8: СПЕЦ-АТАКА (СЮРИКЕНЫ)";
        desc = `Нажми ${pKey('special')}, чтобы метнуть сюрикены. Сбей 2 парящие мишени!`;
    } else if (tutorialStep === 'BOSS') {
        title = "ШАГ 8/8: ТРЕНИРОВОЧНЫЙ БОЙ";
        desc = "ФИНАЛ: Победи тренировочного манекена (7 HP)! Уклоняйся от рывков и сюрикенов.";
    } else if (tutorialStep === 'COMPLETE') {
        title = "🎉 ОБУЧЕНИЕ ЗАВЕРШЕНО!";
        desc = "Ты освоил все основы! Получено достижение «Выпускник Убежища» 🎓";
    }

    // Glowing Cyan Top Banner
    let bannerW = 680;
    let bannerH = 54;
    let bannerX = (GAME_WIDTH - bannerW) / 2;
    let bannerY = 14;

    ctx.fillStyle = "rgba(10, 20, 35, 0.9)";
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.font = "bold 15px Arial";
    ctx.fillStyle = "#00ffff";
    ctx.fillText(title, GAME_WIDTH / 2, bannerY + 22);

    ctx.font = "13px Arial";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(desc, GAME_WIDTH / 2, bannerY + 42);

    // If training boss is active, draw its purple HP bar
    if (tutorialStep === 'BOSS' && boss.state !== "INACTIVE") {
        let bBarW = 260;
        let bBarH = 10;
        let bBarX = (GAME_WIDTH - bBarW) / 2;
        let bBarY = 74;

        ctx.fillStyle = "rgba(20, 10, 35, 0.8)";
        ctx.fillRect(bBarX - 2, bBarY - 2, bBarW + 4, bBarH + 4);

        let curW = (Math.max(0, boss.hp) / boss.maxHp) * bBarW;
        ctx.fillStyle = "#9933ff";
        ctx.shadowColor = "#bb66ff";
        ctx.shadowBlur = 8;
        ctx.fillRect(bBarX, bBarY, curW, bBarH);
        ctx.shadowBlur = 0;

        ctx.font = "bold 11px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Тренировочный Манекен: ${Math.max(0, Math.ceil(boss.hp))} / 7 HP`, GAME_WIDTH / 2, bBarY + 22);
    }

    ctx.restore();
}

function updateWorldEvents() {
    // 1. Update active world message timer
    if (typeof activeWorldMessage !== 'undefined' && activeWorldMessage) {
        activeWorldMessage.timer--;
        if (activeWorldMessage.timer <= 0) {
            activeWorldMessage = null;
        }
    }

    // 2. Update falling AirDrop crystals
    if (typeof worldEventCrystals !== 'undefined') {
        for (let i = worldEventCrystals.length - 1; i >= 0; i--) {
            let c = worldEventCrystals[i];
            c.y += c.vy;
            if (c.y > FLOOR - 15) {
                c.y = FLOOR - 15;
                c.vy = 0;
            }
            c.timer--;
            if (c.timer <= 0) {
                worldEventCrystals.splice(i, 1);
                continue;
            }
            for (let p of players) {
                if (p.hp > 0 && Math.hypot((p.x + 15) - c.x, (p.y + 25) - c.y) < 35) {
                    p.hp = Math.min(p.maxHp, p.hp + (c.healAmount || 2));
                    if (typeof playSound === 'function') playSound('heal');
                    if (typeof voidExplosions !== 'undefined') {
                        voidExplosions.push({ x: c.x, y: c.y, timer: 20, isWhite: false, isOrange: true, r: 50 });
                    }
                    worldEventCrystals.splice(i, 1);
                    break;
                }
            }
        }
    }

    // 3. Update meteors
    if (typeof worldMeteors !== 'undefined') {
        for (let i = worldMeteors.length - 1; i >= 0; i--) {
            let m = worldMeteors[i];
            m.x += m.vx;
            m.y += m.vy;
            m.timer--;
            if (m.y >= FLOOR - 10 || m.timer <= 0) {
                if (typeof applyPhysicsPushToLeaves === 'function') {
                    applyPhysicsPushToLeaves(m.x, m.y, 8);
                }
                worldMeteors.splice(i, 1);
            }
        }
    }

    // 4. Update Boss Rage
    if (typeof worldBossRageTimer !== 'undefined' && worldBossRageTimer > 0) {
        worldBossRageTimer--;
        if (typeof boss !== 'undefined' && boss && boss.state !== 'DEFEATED' && typeof voidExplosions !== 'undefined') {
            if (Math.random() < 0.25) {
                voidExplosions.push({
                    x: boss.x + Math.random() * boss.width,
                    y: boss.y + Math.random() * boss.height,
                    timer: 10,
                    isWhite: false,
                    isOrange: true,
                    r: 25
                });
            }
        }
    }
}

function drawWorldEvents() {
    if (typeof worldEventCrystals !== 'undefined') {
        for (let c of worldEventCrystals) {
            ctx.save();
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 16;
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            let pulse = Math.sin(Date.now() / 90) * 3;
            ctx.arc(c.x, c.y, 14 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💚', c.x, c.y + 5);
            ctx.restore();
        }
    }

    if (typeof worldMeteors !== 'undefined') {
        for (let m of worldMeteors) {
            ctx.save();
            ctx.shadowColor = m.color || '#ffd700';
            ctx.shadowBlur = 12;
            ctx.fillStyle = m.color || '#ffd700';
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size || 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    if (typeof activeWorldMessage !== 'undefined' && activeWorldMessage) {
        ctx.save();
        ctx.textAlign = 'center';
        let alpha = Math.min(1, activeWorldMessage.timer / 30);
        ctx.globalAlpha = alpha;

        let bw = Math.min(GAME_WIDTH - 40, 680), bh = 66;
        let bx = GAME_WIDTH / 2 - bw / 2, by = 40;
        
        ctx.fillStyle = 'rgba(11, 15, 25, 0.94)';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 10);
        else ctx.rect(bx, by, bw, bh);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('👑 ' + (activeWorldMessage.sender || 'РЫБА (СОЗДАТЕЛЬ)').toUpperCase(), GAME_WIDTH / 2, by + 22);

        ctx.font = 'bold 15px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 8;
        ctx.fillText('« ' + activeWorldMessage.text + ' »', GAME_WIDTH / 2, by + 47);
        ctx.restore();
    }

    // Render flying stream reactions (floating emojis)
    if (window.flyingReactions && window.flyingReactions.length > 0) {
        ctx.save();
        ctx.textAlign = 'center';
        for (let r of window.flyingReactions) {
            ctx.globalAlpha = Math.max(0, Math.min(1, r.opacity));
            ctx.font = `${Math.round(26 * r.scale)}px sans-serif`;
            let screenX = r.x - camX;
            let screenY = r.y - camY;
            ctx.fillText(r.emoji, screenX, screenY);
        }
        ctx.restore();
    }
}

// Fixed timestep loop
let lastTime = performance.now();
let accumulator = 0;
const FIXED_TIME_STEP = 1000 / 60; 

function loop(time) {
    let dt = time - lastTime;
    lastTime = time;
    if (dt > 250) dt = 250; 

    accumulator += dt;
    while (accumulator >= FIXED_TIME_STEP) {
        if (freezeFrames > 0) {
            freezeFrames--; 
        } else {
            try {
                if (slowMoTimer > 0) {
                    slowMoTimer--;
                    if (slowMoTimer % 2 === 0) {
                        update();
                    }
                } else {
                    update();
                }
            } catch(e) {
                console.error("Game update loop error:", e);
            }
        }
        accumulator -= FIXED_TIME_STEP;
    }

    try {
        draw();
    } catch(e) {
        console.error("Game draw loop error:", e);
    }
    requestAnimationFrame(loop);
}

// --- HERO & BOSS CODEX / TECHNICAL DATASHEET SYSTEM (v73.2) ---
let currentCodexHero = 'WATER';
let currentCodexBossMode = 'NORMAL';
let codexAnimFrameId = null;

function isBossCodexUnlocked() {
    try {
        let u = (typeof getCurrentUser === 'function' ? getCurrentUser() : '') || '';
        u = u.trim().toLowerCase();
        let isDevice = false;
        try { isDevice = localStorage.getItem('shelter_is_creator_device') === 'true'; } catch(e){}
        if (isDevice) return true;
        if (!u) return false;
        if (u === 'рыба' || u === 'admin' || u === 'тимур' || u === '降卋神通' || u === 'creator') return true;
        if (typeof isCarrotsUser === 'function' && isCarrotsUser(u)) return true;
        if (u.includes('ярослав') || u.includes('carrots')) return true;
        if (typeof isDashaUser === 'function' && isDashaUser(u)) return true;
        if (u.includes('даша') || u.includes('dasha')) return true;
        if (u.includes('gandalf') || u.includes('гэндальф') || u.includes('гендальф')) return true;
        return false;
    } catch(e) {
        return false;
    }
}
window.isBossCodexUnlocked = isBossCodexUnlocked;

function openHeroCodexModal(initialHeroId = 'WATER') {
    let modal = document.getElementById('hero-codex-modal');
    if (!modal) return;
    
    // Check boss tab unlock for Timur, Yaroslav, Dasha & Gandalf
    let bossBtn = document.getElementById('codex-boss-tab-btn');
    if (bossBtn) {
        bossBtn.style.display = isBossCodexUnlocked() ? 'inline-block' : 'none';
    }
    
    modal.style.display = 'flex';
    selectCodexHero(initialHeroId);
    if (typeof playSound === 'function') playSound('select');
}
window.openHeroCodexModal = openHeroCodexModal;

function closeHeroCodexModal() {
    let modal = document.getElementById('hero-codex-modal');
    if (modal) modal.style.display = 'none';
    if (codexAnimFrameId) {
        cancelAnimationFrame(codexAnimFrameId);
        codexAnimFrameId = null;
    }
}
window.closeHeroCodexModal = closeHeroCodexModal;

function selectCodexHero(heroId) {
    if (heroId === 'BOSS' && !isBossCodexUnlocked()) return;
    currentCodexHero = heroId;

    let tabs = document.querySelectorAll('.codex-tab-btn');
    tabs.forEach(btn => {
        if (btn.getAttribute('data-hero') === heroId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    renderCodexHeroContent(heroId);
    startCodexPreviewAnimation();
}
window.selectCodexHero = selectCodexHero;

function toggleCodexBossMode(mode) {
    currentCodexBossMode = mode;
    renderCodexBossContent();
    if (typeof playSound === 'function') playSound('select');
}
window.toggleCodexBossMode = toggleCodexBossMode;

function renderCodexHeroContent(heroId) {
    let container = document.getElementById('codex-content-body');
    if (!container) return;
    
    if (heroId === 'BOSS') {
        renderCodexBossContent();
        return;
    }
    
    let h = (typeof HERO_CODEX_DATA !== 'undefined' && HERO_CODEX_DATA[heroId]) || null;
    if (!h) {
        container.innerHTML = `<div style="padding: 20px; color: #94a3b8;">Герой не найден</div>`;
        return;
    }

    let passivesHtml = (h.passives || []).map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('');
    let keyXDetailsHtml = (h.keyX && h.keyX.details || []).map(d => `<li style="margin-bottom: 6px;">${d}</li>`).join('');
    let keySDetailsHtml = (h.keyS && h.keyS.details || []).map(d => `<li style="margin-bottom: 6px;">${d}</li>`).join('');
    
    let ywSlots = h.yellowWhiteSlots || {};
    let slotsListHtml = (ywSlots.slotsList || []).map(s => `
        <div style="background: rgba(0,0,0,0.35); padding: 7px 12px; border-radius: 6px; border-left: 3px solid #ffd700; margin-bottom: 6px; font-size: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
            <div>
                <b style="color: #ffd700;">${s.slot}:</b> <span style="color: #cbd5e1; margin-left: 6px;">${s.desc}</span>
            </div>
            <span class="codex-badge-tag" style="border-color: #ffd700; color: #fff; font-weight: bold; background: rgba(255,215,0,0.15);">${s.key}</span>
        </div>
    `).join('');

    let poolHtml = (ywSlots.abilitiesPool || []).map(ab => `
        <span style="display: inline-block; background: rgba(255,215,0,0.12); border: 1px solid rgba(255,215,0,0.3); border-radius: 4px; padding: 3px 8px; margin: 3px 4px 3px 0; font-size: 11px; color: #fef08a;">${ab}</span>
    `).join('');

    let movesHtml = (h.moves || []).map(m => `
        <tr>
            <td style="white-space: nowrap;"><span class="codex-badge-tag" style="border-color: ${h.color}; color: #fff;">${m.keys}</span></td>
            <td style="font-weight: bold; color: ${h.color};">${m.name}</td>
            <td><b style="color: #ffdd44; font-size: 13px;">${m.dmg}</b></td>
            <td style="white-space: nowrap; color: #38bdf8; font-size: 11.5px;"><b>[${m.timing}]</b></td>
            <td style="font-size: 12px; color: #cbd5e1;">${m.desc}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Top Hero Banner -->
            <div style="background: rgba(15, 23, 42, 0.85); border: 2px solid ${h.color}; border-radius: 12px; padding: 14px 20px; box-shadow: 0 0 25px ${h.color}33; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 34px; filter: drop-shadow(0 0 10px ${h.color});">${h.icon}</span>
                    <div>
                        <div style="font-size: 22px; font-weight: 900; color: ${h.color}; letter-spacing: 1px;">${h.name}</div>
                        <div style="font-size: 12px; color: #94a3b8;">${h.tagline}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 12px; font-size: 12px;">
                        <span style="color: #f87171;">🩸 HP:</span> <b style="color: #fff;">${h.hp}</b>
                    </div>
                    <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 12px; font-size: 12px;">
                        <span style="color: #fbbf24;">⚔️ Базовый урон:</span> <b style="color: #fff;">${h.baseDmg}</b>
                    </div>
                    <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 12px; font-size: 12px;">
                        <span style="color: #38bdf8;">⚡ Скорость:</span> <b style="color: #fff;">${h.speed}</b>
                    </div>
                    <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 12px; font-size: 12px;">
                        <span style="color: #a855f7;">🎯 Радиус:</span> <b style="color: #fff;">${h.atkRange} px</b>
                    </div>
                </div>
            </div>

            <!-- Stats & Equipment Specs -->
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 16px; font-size: 12.5px;">
                <b style="color: #e2e8f0;">🗡️ Основное оружие:</b> <span style="color: ${h.color}; font-weight: bold;">${h.weapon}</span> &nbsp;|&nbsp; 
                <span style="color: #94a3b8; font-size: 12px;">⏱️ Кулдаун удара: <b style="color: #fff;">${h.atkCd} кадров</b> (~${Math.round(h.atkCd * 16.6)} мс)</span>
            </div>

            <!-- SECTION: YELLOW-WHITE SLOTS (F ABILITIES) -->
            <div style="background: rgba(255, 215, 0, 0.08); border: 1.5px solid #ffd700; border-radius: 12px; padding: 14px 18px; box-shadow: 0 0 20px rgba(255, 215, 0, 0.12);">
                <div style="font-size: 14px; font-weight: 900; color: #ffd700; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>🟡</span> ${ywSlots.title || 'Желто-белые слоты (Настройка способностей на клавишу F)'}
                    </div>
                    <span style="font-size: 12px; padding: 3px 10px; border-radius: 4px; font-weight: bold; background: rgba(255, 215, 0, 0.25); color: #ffd700; border: 1px solid #ffd700;">
                        ${ywSlots.countText || 'Настройка F'}
                    </span>
                </div>
                <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 10px; line-height: 1.5;">
                    В меню выбора снаряжения в эти слоты настраиваются боевые спец-способности, которые активируются в бою клавишей <b>F</b>:
                </div>
                <div style="margin-bottom: 10px;">
                    ${slotsListHtml}
                </div>
                <div style="font-size: 11.5px; color: #94a3b8; line-height: 1.5; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 6px;">
                    <b style="color: #ffd700;">Доступные способности для установки в слоты:</b><br>
                    ${poolHtml}
                </div>
            </div>

            <!-- SECTION: HEAL VOLUME & MECHANICS -->
            <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(15, 23, 42, 0.8)); border: 1.5px solid #22c55e; border-radius: 12px; padding: 14px 18px; box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);">
                <div style="font-size: 14px; font-weight: 900; color: #4ade80; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span>🩸</span> МЕХАНИКА И ОБЪЕМ ХИЛА (ЛЕЧЕНИЯ):
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 12px; margin-bottom: 10px;">
                    <div style="background: rgba(0,0,0,0.4); padding: 10px 12px; border-radius: 8px; border: 1.5px solid rgba(74, 222, 128, 0.4);">
                        <span style="color: #86efac; font-size: 11px; font-weight: bold;">ЗАВЕРШЕНИЕ ХИЛА (ОБЪЕМ):</span><br>
                        <b style="color: #4ade80; font-size: 14px;">${h.heal.restoresText}</b>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                        <span style="color: #94a3b8; font-size: 11px;">ВРЕМЯ КАСТА (УДЕРЖАНИЕ):</span><br>
                        <b style="color: #fff; font-size: 12.5px;">${h.heal.castTime}</b>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                        <span style="color: #94a3b8; font-size: 11px;">ПЕРЕЗАРЯДКА ХИЛА:</span><br>
                        <b style="color: #ffd700; font-size: 12.5px;">${h.heal.recharge}</b>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                        <span style="color: #94a3b8; font-size: 11px;">КОМАНДНЫЙ ЗАПАС:</span><br>
                        <b style="color: #38bdf8; font-size: 12.5px;">${h.heal.teamPool}</b>
                    </div>
                </div>
                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 6px;">
                    🤝 <b>Воскрешение союзника:</b> ${h.heal.allyRevive}<br>
                    ⚠️ <b>Прерывание:</b> ${h.heal.vulnerability}
                </div>
            </div>

            <!-- SECTION: KEY X MECHANICS -->
            <div style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid #38bdf8; border-radius: 12px; padding: 14px 18px; box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);">
                <div style="font-size: 14px; font-weight: 900; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>⚔️</span> ${h.keyX.title}
                    </div>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: normal;">(Базовые удары, атаки направления и концентрация)</span>
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #cbd5e1; line-height: 1.6;">
                    ${keyXDetailsHtml}
                </ul>
            </div>

            <!-- SECTION: KEY S MECHANICS & MODE SWITCH -->
            <div style="background: rgba(15, 23, 42, 0.75); border: 1.5px solid #c084fc; border-radius: 12px; padding: 14px 18px; box-shadow: 0 0 20px rgba(192, 132, 252, 0.15);">
                <div style="font-size: 14px; font-weight: 900; color: #c084fc; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>🔄</span> ${h.keyS.title}
                    </div>
                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: bold; background: ${h.keyS.changesMode ? 'rgba(192, 132, 252, 0.25); color: #e9d5ff;' : 'rgba(56, 189, 248, 0.2); color: #38bdf8;'}">
                        ${h.keyS.changesMode ? '🔄 МЕНЯЕТ РЕЖИМ' : '🛡️ БОЕВОЙ НАВЫК СТОЙКИ'}
                    </span>
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #cbd5e1; line-height: 1.6;">
                    ${keySDetailsHtml}
                </ul>
            </div>

            <!-- SECTION: PASSIVES -->
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 18px;">
                <div style="font-size: 14px; font-weight: 900; color: #ffd700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span>✨</span> ОСОБЕННОСТИ И ПАССИВНЫЕ ЭФФЕКТЫ:
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #cbd5e1; line-height: 1.6;">
                    ${passivesHtml}
                </ul>
            </div>

            <!-- SECTION: MOVESET TABLE -->
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 18px; overflow-x: auto;">
                <div style="font-size: 14px; font-weight: 900; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>🥋</span> ТАБЛИЦА ПРИЕМОВ, КЛАВИШ И ТАЙМИНГОВ
                    </div>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: normal;">(Базовые приемы, атаки направления, стойка S и спец-атаки F)</span>
                </div>
                <table class="codex-table">
                    <thead>
                        <tr>
                            <th style="width: 18%;">Клавиши</th>
                            <th style="width: 24%;">Прием</th>
                            <th style="width: 12%;">Урон</th>
                            <th style="width: 16%;">Тайминг</th>
                            <th style="width: 30%;">Описание и эффект</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movesHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCodexBossContent() {
    let container = document.getElementById('codex-content-body');
    if (!container) return;

    let b = (typeof BOSS_CODEX_DATA !== 'undefined' && BOSS_CODEX_DATA[currentCodexBossMode]) || null;
    if (!b) return;

    let isNormal = currentCodexBossMode === 'NORMAL';
    let phasesHtml = (b.phases || []).map(p => `
        <div style="background: rgba(0,0,0,0.35); padding: 10px 14px; border-radius: 8px; border-left: 3px solid #ffd700; margin-bottom: 8px;">
            <b style="color: #ffd700; font-size: 13px;">${p.title}</b>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 3px; line-height: 1.4;">${p.desc}</div>
        </div>
    `).join('');

    let attacksHtml = (b.attacks || []).map(a => {
        let isSA = a.type && a.type.includes('СУПЕРАТАКА');
        let typeBadge = a.type 
            ? `<div style="margin-top: 3px;"><span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; ${isSA ? 'background: rgba(168,85,247,0.25); border: 1px solid #a855f7; color: #d8b4fe;' : 'background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.3); color: #38bdf8;'}">${a.type}</span></div>` 
            : '';
        return `
        <tr style="${isSA ? 'background: rgba(168,85,247,0.06);' : ''}">
            <td style="font-weight: bold; color: ${isSA ? '#c084fc' : '#ffd700'};">
                ${a.name}${typeBadge}
            </td>
            <td style="color: #38bdf8; font-size: 12px; white-space: nowrap;"><b>[${a.windup}]</b></td>
            <td><b style="color: #ff5544; font-size: 13px;">${a.dmg}</b></td>
            <td style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">${a.desc}</td>
        </tr>`;
    }).join('');

    let modeBanner = isNormal
        ? `<div style="background: rgba(234, 179, 8, 0.1); border: 1.5px solid rgba(234, 179, 8, 0.4); border-radius: 10px; padding: 10px 16px; color: #fef08a; font-size: 12px; line-height: 1.5;">
            👑 <b>Классический арсенал:</b> В обычном режиме босс сражается шпагой, шелковым шарфом и ветром. <b>Суператаки (SA1, SA2, SA3), шары пустоты и хил в коконе пробуждаются ТОЛЬКО в Секретном L-режиме!</b>
           </div>`
        : `<div style="background: rgba(168, 85, 247, 0.12); border: 1.5px solid rgba(168, 85, 247, 0.5); border-radius: 10px; padding: 10px 16px; color: #e9d5ff; font-size: 12px; line-height: 1.5;">
            🌑 <b>Сила Бездны:</b> В секретном L-режиме босс применяет весь разрушительный арсенал — <b>Землетрясение (SA1), Бурю нитей (SA2), Теневых фантомов (SA3), тройные комбо, хил в коконе (+10 HP) и шары пустоты!</b>
           </div>`;

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Mode Switcher Bar -->
            <div style="display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap;">
                <div style="font-size: 13px; color: #94a3b8; font-weight: bold; margin-right: 4px;">РЕЖИМ БОССА:</div>
                <button class="codex-tab-btn ${isNormal ? 'active' : ''}" onclick="toggleCodexBossMode('NORMAL')" style="font-size: 13px; padding: 8px 20px;">
                    ⚔️ Обычный режим
                </button>
                <button class="codex-tab-btn codex-boss-btn ${!isNormal ? 'active' : ''}" onclick="toggleCodexBossMode('L_MODE')" style="font-size: 13px; padding: 8px 20px;">
                    🌑 Секретный L-режим
                </button>
            </div>

            ${modeBanner}

            <!-- Boss Title Card -->
            <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(15, 23, 42, 0.9)); border: 2px solid #ffd700; border-radius: 12px; padding: 14px 20px; box-shadow: 0 0 30px rgba(255, 215, 0, 0.25); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <div style="font-size: 22px; font-weight: 900; color: #ffd700; letter-spacing: 1px;">👑 ${b.name}</div>
                    <div style="font-size: 12px; color: #94a3b8; font-style: italic;">«Главная владычица Убежища и мастер Серебряной Иглы»</div>
                </div>
                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,215,0,0.3); border-radius: 8px; padding: 8px 14px; font-size: 12.5px;">
                    <span style="color: #f87171; font-weight: bold;">🩸 Здоровье:</span> <b style="color: #fff;">${b.hp}</b>
                </div>
            </div>

            <!-- SECTION: VISUALS & STICKMAN BODY -->
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 14px 18px;">
                <div style="font-size: 14px; font-weight: 900; color: #ffd700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span>👁️</span> МОДЕЛЬ, АНИМАЦИЯ И ГРАФИКА:
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #cbd5e1; line-height: 1.6;">
                    <li><b>Тело:</b> стикмен ярко-желтого цвета (#ffd700). Никаких рогов и масок насекомых — изящная инопланетная воительница!</li>
                    <li><b>Атаки и Движения:</b> атаки определяются стойками, глубокими замахами и шагами, а не цветовой подсветкой (на кончике иглы видна лишь капелька оттенка атаки).</li>
                    <li><b>Пыль на заднем фоне:</b> черные медленные частицы за всеми объектами арены с легким переливом по краям для создания глубокой атмосферы.</li>
                    <li><b>Шарики Пустоты:</b> появляются только в L-режиме (начиная с 3-й фазы), вылетают преимущественно из углов и по арене.</li>
                </ul>
            </div>

            <!-- SECTION: BOSS HEALING -->
            <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 23, 42, 0.8)); border: 1.5px solid #f87171; border-radius: 12px; padding: 14px 18px;">
                <div style="font-size: 14px; font-weight: 900; color: #f87171; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span>🩸</span> ${b.heal.title}:
                </div>
                <div style="font-size: 12.5px; color: #cbd5e1; line-height: 1.5;">
                    <b style="color: #ffdd44; font-size: 13px;">${b.heal.amount}</b><br>
                    ${b.heal.desc ? b.heal.desc : ''}
                </div>
            </div>

            <!-- SECTION: PHASES & SHARPEN -->
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 14px 18px;">
                <div style="font-size: 14px; font-weight: 900; color: #ffd700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span>⚡</span> ФАЗЫ БИТВЫ И ЗАТОЧКА ШПАГИ (УСИЛЕНИЯ БОССА):
                </div>
                ${phasesHtml}
            </div>

            <!-- SECTION: EXHAUSTIVE BOSS ATTACKS TABLE -->
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 18px; overflow-x: auto;">
                <div style="font-size: 14px; font-weight: 900; color: #ffd700; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>🥋</span> СПИСОК ВСЕХ АТАК, ЗАМАХОВ И ТАЙМИНГОВ БОССА
                    </div>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: normal;">${isNormal ? '(Обычные выпады, Шарф, Штопор, Линия ветра и Шелковый бег)' : '(Включая SA1, SA2, SA3, Тройные комбо, Врата тьмы и Хил)'}</span>
                </div>
                <table class="codex-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;">Атака</th>
                            <th style="width: 18%;">Замах / Окно</th>
                            <th style="width: 22%;">Урон и эффекты</th>
                            <th style="width: 35%;">Визуальный сигнал и поведение босса</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attacksHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function startCodexPreviewAnimation() {
    // No-op: Full text encyclopedia layout active
}

// Global Escape listener to close codex modal
window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        let modal = document.getElementById('hero-codex-modal');
        if (modal && modal.style.display !== 'none') {
            closeHeroCodexModal();
        }
    }
});

requestAnimationFrame(loop);
