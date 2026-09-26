// --- GAME ENGINE & MAIN LOOP MODULE ---

function buildAndStartGame() {
    initAudio(); 
    if (typeof stopMenuMusic === 'function') stopMenuMusic();
    let overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "none"; 
    let isTouch = (p1InputType === 'TOUCH' || (numPlayers === 2 && p2InputType === 'TOUCH'));
    let mobUi = document.getElementById("mobile-ui");
    if (mobUi) mobUi.style.display = isTouch ? "flex" : "none";
    let ctrlCont = document.getElementById("controls-container");
    if (ctrlCont) ctrlCont.style.display = isTouch ? "none" : "block";
    players = [];
    isTutorial = false;
    
    if (secretMode) { 
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
        for (let k in schemeObj) {
            res[k] = [schemeObj[k]];
        }
        return res;
    }

    let p1Keys = mapControlsToKeysObj(userControls.SCHEME_1);
    let p2Keys = mapControlsToKeysObj(userControls.SCHEME_2);

    if (p1InputType === 'KEYBOARD_2' || p1InputType === 'KEYBOARD_SHOOTER') {
        p1Keys = mapControlsToKeysObj(userControls.SCHEME_2);
    } else if (p1InputType === 'DUO_KEYBOARD_P1') {
        p1Keys = mapControlsToKeysObj(userControls.DUO_KEYBOARD.p1);
    } else {
        p1Keys = mapControlsToKeysObj(userControls.SCHEME_1);
    }

    if (p2InputType === 'KEYBOARD_1' || p2InputType === 'KEYBOARD_SILK') {
        p2Keys = mapControlsToKeysObj(userControls.SCHEME_1);
    } else if (p2InputType === 'DUO_KEYBOARD_P2') {
        p2Keys = mapControlsToKeysObj(userControls.DUO_KEYBOARD.p2);
    } else {
        p2Keys = mapControlsToKeysObj(userControls.SCHEME_2);
    }

    if (!p1HeroSelection) p1HeroSelection = 'WATER';
    if (numPlayers === 2 && !p2HeroSelection) p2HeroSelection = 'EARTH';

    let startX1 = secretMode ? ARENA_W/2 - 50 : 150;
    let p1 = createPlayer(1, p1HeroSelection, p1Keys, p1InputType, startX1);
    p1.abilities = { ...configAbilities.p1 };
    p1.bananaSkin = !!(typeof bananaSkinP1 !== 'undefined' && bananaSkinP1 && typeof isBananaSkinAllowed === 'function' && isBananaSkinAllowed());
    
    applyBadgesToPlayer(p1, true); 
    players.push(p1);

    if (numPlayers === 1) {
        boss.maxHp = secretMode ? 60 : 25; 
        phase2Hp = secretMode ? 39 : 18; 
        phase3Hp = secretMode ? 20 : 10; 
        maxSharedHeals = 3;
    } else {
        let startX2 = secretMode ? ARENA_W/2 + 50 : 200;
        let p2 = createPlayer(2, p2HeroSelection, p2Keys, p2InputType, startX2);
        p2.abilities = { ...configAbilities.p2 };
        p2.bananaSkin = !!(typeof bananaSkinP2 !== 'undefined' && bananaSkinP2 && typeof isBananaSkinAllowed === 'function' && isBananaSkinAllowed());
        applyBadgesToPlayer(p2, false); 
        players.push(p2);
        
        let isLoreDuo = (p1HeroSelection === 'WATER' && p2HeroSelection === 'EARTH') || (p1HeroSelection === 'EARTH' && p2HeroSelection === 'WATER');
        if (isLoreDuo) { 
            players[0].maxHp = 7; players[0].hp = 7; 
            players[1].maxHp = 7; players[1].hp = 7; 
        }
        boss.maxHp = secretMode ? 100 : 50; 
        phase2Hp = secretMode ? 66 : 36; 
        phase3Hp = secretMode ? 33 : 20; 
        maxSharedHeals = 4;
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

    if (!secretMode) {
        platforms = [ { x: 420, y: FLOOR - 100, w: 160, h: 10 } ];
    } else {
        platforms = [];
    }

    let isEasyBoss = !!(typeof easyBossMode !== 'undefined' && easyBossMode) || !!window.easyBossMode;
    if (isEasyBoss) {
        boss.maxHp = Math.round(boss.maxHp * 0.75);
        phase2Hp = Math.round(phase2Hp * 0.75);
        phase3Hp = Math.round(phase3Hp * 0.75);
        activeWorldMessage = {
            text: `🌿 ОСЛАБЛЕНИЕ БОССА: ВКЛЮЧЕНО (HP: ${boss.maxHp}, УРОН: -50%)`,
            sender: 'Система',
            timer: 200,
            maxTimer: 200
        };
    }

    resetGameParams(); 
    gameState = "PLAYING";
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
}
window.buildAndStartGame = buildAndStartGame;

function buildAndStartTutorialGame() {
    initAudio(); 
    if (typeof stopMenuMusic === 'function') stopMenuMusic();
    let overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "none"; 
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
        for (let k in schemeObj) {
            res[k] = [schemeObj[k]];
        }
        return res;
    }

    let p1Keys = mapControlsToKeysObj(userControls.SCHEME_1);
    if (p1InputType === 'KEYBOARD_2' || p1InputType === 'KEYBOARD_SHOOTER') {
        p1Keys = mapControlsToKeysObj(userControls.SCHEME_2);
    } else {
        p1Keys = mapControlsToKeysObj(userControls.SCHEME_1);
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
    if (typeof sendPresencePing === 'function') sendPresencePing();
}
window.buildAndStartTutorialGame = buildAndStartTutorialGame;

function resetGameParams() {
    for (let p of players) { 
        if (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.hp3) {
            let baseHp = (p.type === 'WATER_ROPE') ? 2 : 3;
            if (p.badges && p.badges.includes('fish_scale')) baseHp += 1;
            p.maxHp = baseHp;
        } else if (p.type === 'WATER_ROPE') {
            let baseHp = 5;
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
        p.chillBrews = Object.values(p.abilities).includes('chill') ? 3 : 0;
        p.invigBrews = Object.values(p.abilities).includes('invig') ? 3 : 0;
        p.dashBurstTimer = 0; p.airDashed = false;
        if (p.type === 'STAMINA') { p.stamina = 5; p.isCharging = false; p.chargeTimer = 0; p.chargeProjectiles = []; } 
        if (p.type === 'FIRE') { p.isParrying = false; p.parryTimer = 0; p.orangeHp = 0; p.orangeHpTimer = 0; p.isFieryHealing = false; p.fireDashTimer = 0; }
        if (p.type === 'FIRE_HALBERD') { p.halberdBuffTimer = 0; p.halberdVampiricReady = false; p.halberdCombos = 0; p.halberdComboTimer = 0; p.whirlwindTimer = 0; }
        if (p.type === 'WATER_ROPE') { p.concentrateTimer = 0; p.concentrateReady = false; p.ropeA = null; p.ropeB = null; p.ropeActive = false; p.ropeDrainTimer = 0; p.ropeSlideTimer = 0; p.isRopeSliding = false; }
        if (p.badges && p.badges.includes('shield')) p.hasAegisShield = true;
        if (p.badges && p.badges.includes('cracked_life')) { p.hasCrackedLife = true; p.crackedShieldBroken = false; }
    }
    if (players.length > 0) players[0].x = ARENA_W/2 - 50; 
    if (players.length > 1) players[1].x = ARENA_W/2 + 50;
    
    sharedHeals = maxSharedHeals; 
    sharedHitCount = 0; 
    sharedHealPoints = (typeof MAX_HEAL_POINTS !== 'undefined') ? MAX_HEAL_POINTS : 12;
    airBlades = []; playerDaggers = []; blackDaggers = []; p2Traps = []; phantoms = []; 
    airTraps = []; airComboTraps = []; scarf.active = false; clashFlash = null; 
    activeCinematic = null; globalWindMode = "NONE"; globalWindTimer = 0; globalWindCooldown = 0; 
    voidExplosions = []; voidPortals = []; looms = []; chaosBalls = []; screamRings = [];
    loomThreads = []; lightAmuletWaves = []; battleAnnouncements = [];
    waterRopes = []; slowMoTimer = 0;
    
    boss.hp = boss.maxHp; boss.phase = 1; boss.damageBonus = 0; boss.x = ARENA_W/2; boss.y = FLOOR - 50; 
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
    boss.lPhase4Orbs = []; boss.lPhase4AttackTimer = 0;
    battleStartTime = Date.now();
    
    screenShake = { timer: 0, mag: 0, dirX: 0, dirY: 0 }; 
    freezeFrames = 0;
    godModeActive = false; window.godModeActive = false;
    megaDamageActive = false; window.megaDamageActive = false;
    let bgm = document.getElementById("lModeMusic"); 
    if (bgm) bgm.pause();
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

    // Arena leaves
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

    // Scream rings
    for (let i = screamRings.length - 1; i >= 0; i--) { 
        let sr = screamRings[i]; sr.r += 15; 
        if (sr.r > sr.maxR) screamRings.splice(i, 1); 
    }

    // Chaos balls
    if (secretMode && boss.phase >= 3 && !boss.state.startsWith("L_INTRO")) {
        if (Math.random() < 0.15) { 
            chaosBalls.push({ 
                x: Math.random() < 0.5 ? Math.random() * 250 : ARENA_W - Math.random() * 250, 
                y: camY + GAME_HEIGHT + 50, 
                vx: (Math.random() - 0.5) * 2, 
                vy: -1 - Math.random() * 3, 
                r: 10 + Math.random() * 15 
            }); 
        }
    }
    for (let i = chaosBalls.length - 1; i >= 0; i--) {
        let cb = chaosBalls[i];
        cb.x += cb.vx; cb.y += cb.vy;
        if (cb.y < camY - 50 || cb.x < -50 || cb.x > ARENA_W + 50) chaosBalls.splice(i, 1);
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
        if (boss.hp <= 0 && boss.state !== "DEFEATED" && !boss.state.startsWith("CINEMATIC") && boss.state !== "FREE_ROAM") { 
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
    let shouldFollowCam = (secretMode || boss.state.startsWith("L_CLIMB") || boss.phase >= 2.5) && (!secretMode ? boss.state !== "SA1_ACTIVE" : true);
    if (activeCinematic) {
        // Во время катсцены камера сохраняет свои текущие координаты, не сбрасываясь в 0!
    } else if (shouldFollowCam) {
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

function drawBackground() {
    let bgTop = (boss.phase >= 2.5 || boss.state.startsWith("L_CLIMB") || secretMode) ? -6000 : 0;
    ctx.fillStyle = secretMode ? "#111" : (globalWindMode === "DOWN" ? "#1a100c" : "#2e1a12"); 
    ctx.fillRect(0, bgTop, ARENA_W, FLOOR - bgTop);
    
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
        ctx.fillStyle = "#4a3022"; ctx.fillRect(lx + 5, ly + 65, 150, 6);
    }

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
        ctx.strokeStyle = secretMode ? "#555" : "#111"; 
        ctx.lineWidth = 4; ctx.beginPath(); 
        ctx.moveTo(0, FLOOR); ctx.lineTo(ARENA_W, FLOOR);
        ctx.stroke();
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
            if (secretMode && i >= p.maxHp - 2) hpColor = "rgba(255,255,255,0.8)";
            
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
        }
        if (p.purpleHp > 0) {
            for (let i = 0; i < p.purpleHp; i++) {
                let cx = 30 + (p.maxHp + i) * 30 + mShakeX; let cy = yOffset + mShakeY;
                ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); 
                ctx.fillStyle = "#9900ff"; ctx.fill(); ctx.strokeStyle = "#ff55ff"; ctx.lineWidth = 2; ctx.stroke();
            }
        }
        if (p.orangeHp > 0) {
            let cx = 30 + (p.maxHp + p.purpleHp) * 30 + mShakeX; let cy = yOffset + mShakeY;
            ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); 
            ctx.fillStyle = "#ffaa00"; ctx.fill(); ctx.strokeStyle = "yellow"; ctx.lineWidth = 2; ctx.stroke();
        }
        if (p.type === 'STAMINA') {
            for (let i = 0; i < p.maxStamina; i++) {
                let cx = 30 + i * 16; let cy = yOffset + 18;
                ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2);
                ctx.fillStyle = i < Math.floor(p.stamina) ? "#ffcc00" : (i < p.stamina ? "rgba(255, 204, 0, 0.5)" : "rgba(0,0,0,0.5)");
                ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1; ctx.stroke();
            }
        }
        
        let brewX = 30 + (p.maxHp + (p.purpleHp > 0 ? p.purpleHp : 0)) * 30 + (p.orangeHp > 0 ? 30 : 0) + 10;
        if (p.chillBrews > 0 || Object.values(p.abilities).includes('chill')) {
            for (let i = 0; i < p.chillBrews; i++) {
                ctx.beginPath(); ctx.arc(brewX + i * 16, yOffset, 5, 0, Math.PI*2);
                ctx.fillStyle = "cyan"; ctx.fill();
                ctx.strokeStyle = "purple"; ctx.lineWidth = 2; ctx.stroke();
            }
            if (p.chillBrews > 0) brewX += p.chillBrews * 16 + 10;
        }
        if (p.invigBrews > 0 || Object.values(p.abilities).includes('invig')) {
            for (let i = 0; i < p.invigBrews; i++) {
                ctx.beginPath(); ctx.arc(brewX + i * 16, yOffset, 5, 0, Math.PI*2);
                ctx.fillStyle = "#ffcc00"; ctx.fill();
                ctx.strokeStyle = "#ff5500"; ctx.lineWidth = 2; ctx.stroke();
            }
        }

        let tagOffset = brewX + 10;
        if (p.bleedTimer > 0 && !p.isDowned) { 
            ctx.fillStyle = "red"; ctx.font = "12px Arial"; ctx.fillText("Кровотечение!", tagOffset, yOffset + 4); 
            ctx.fillRect(tagOffset + 90, yOffset - 2, (p.bleedTimer / 120) * 50, 6); 
            tagOffset += 150;
        }

        let tagText = "";
        let tagColor = "#ffffff";
        if (p.type === 'WATER') {
            let canDemon = !(!secretMode && numPlayers === 2);
            if (p.stance === 'DEMON') {
                tagText = "[ДЕМОНСКАЯ СИЛА] (S)";
                tagColor = "#d000ff";
            } else {
                tagText = canDemon ? "[СВЕТЛАЯ СИЛА] (S)" : "[СВЕТЛАЯ СИЛА]";
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
            tagText = `[КИНЖАЛЫ ТЕНИ] (Крит: ${critVal}%${dodgeVal > 0 ? ` | Уворот: ${dodgeVal}%` : ''})`;
            tagColor = "#55ff77";
        } else if (p.type === 'AIR') {
            tagText = "[КЛИНКИ ВЕТРА]";
            tagColor = "#fff066";
        } else if (p.type === 'STAMINA') {
            if (p.stance === 'PINK') {
                tagText = "[ВИРУСНЫЙ МЕЧ | x2.5] (S)";
                tagColor = "#ff33aa";
            } else {
                tagText = "[СИНИЕ КИНЖАЛЫ | СЕРИЯ] (S)";
                tagColor = "#33ffff";
            }
        } else if (p.type === 'FIRE') {
            if (p.heatBladeTimer > 0) {
                tagText = `[НАГРЕВ КЛИНКА: ${(p.heatBladeTimer/60).toFixed(1)}с] (S: Выпад 2.5)`;
                tagColor = "#ff4400";
            } else {
                tagText = "[ШПАГА ОГНЯ] (S: Выпад | F: Парир 0.5х | F+X: Нагрев 0.5х)";
                tagColor = "#ffaa33";
            }
        } else if (p.type === 'FIRE_HALBERD') {
            if (p.heatBladeTimer > 0) {
                tagText = `[ОГНЕННАЯ ВОЛНА: ${(p.heatBladeTimer/60).toFixed(1)}с] (+1.25 урон)`;
                tagColor = "#ff3300";
            } else {
                tagText = "[АЛЕБАРДА ОГНЯ] (F: Замах | F+Вверх: Сюрикены)";
                tagColor = "#ff7733";
            }
        } else if (p.type === 'WATER_ROPE') {
            if (p.concentrateReady) {
                tagText = "[ФОКУС ГОТОВ!] (Отпусти X: Удар 2.5 | X+C: Рывок 2.75)";
                tagColor = "#00ffff";
            } else if (p.concentrateTimer > 0) {
                tagText = `[ФОКУС: ${Math.round((p.concentrateTimer/60)*100)}%]`;
                tagColor = "#38bdf8";
            } else {
                tagText = "[МАЛЫШ ВОДЫ] (Зажми X: Фокус | Трос: Движение)";
                tagColor = "#00e5ff";
            }
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

    if (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal) {
        let healY = numPlayers === 2 ? 105 : 75;
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
    } else {
        let healY = numPlayers === 2 ? 105 : 75;
        ctx.fillStyle = "lime"; ctx.font = "14px Arial"; ctx.fillText("Заряды исцеления:", 20, healY);
        for (let j = 0; j < maxSharedHeals; j++) {
            let hx = 150 + j * 15; let hy = healY - 5;
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
        }
        
        ctx.fillStyle = "cyan"; ctx.font = "14px Arial"; ctx.fillText(`Удары для хила: ${sharedHitCount}/8`, 20, healY + 25);
    }
}

function draw() {
    if (!ctx) return;
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

        for (let l of arenaLeaves) { 
            ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.angle); 
            ctx.fillStyle = secretMode ? "rgba(150,0,255,0.5)" : l.color; 
            ctx.fillRect(-l.size/2, -l.size/2, l.size, l.size/2); 
            ctx.restore(); 
        }

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
            if (p.type === 'WATER_ROPE') {
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
            // Фаза 4: Отрисовка 2 фиолетовых сфер в арене
            if (boss.phase === 4 && boss.lPhase4Orbs) {
                let t = Date.now();
                for (let orb of boss.lPhase4Orbs) {
                    if (orb.alive) {
                        let floatY = orb.y + Math.sin(t / 220 + orb.x) * 6;
                        ctx.save();
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
                        ctx.restore();
                    }
                }
            }

            drawBoss();
            for (let p of players) {
                drawPlayer(p);
            }

            if (secretMode && players.some(p => (p.hallucinationHits || 0) >= ((p.hasLightAmulet && !p.lightAmuletBroken) ? 4 : 3) && !(p.type === 'WATER' && p.stance === 'DEMON'))) {
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
                    ctx.restore();
                }
            }
        }
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
            // Фраза звучит ТОЛЬКО в обычном режиме и пишется ТОЛЬКО ОДИН РАЗ (под «ПОБЕДА»):
            if (!secretMode) {
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
            ctx.fillText("Нажмите 'R' для новой битвы", GAME_WIDTH/2, secretMode ? 185 : 215);
        }

        ctx.restore();
        ctx.textAlign = "left"; 
    }

    if (gameState === "PLAYING") {
        drawMasks(); 
        if (!activeCinematic && !isTutorial && boss.state !== "DEFEATED" && !boss.state.startsWith("CINEMATIC") && boss.state !== "FREE_ROAM" && !boss.state.startsWith("L_CLIMB")) { 
            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(GAME_WIDTH/2 - 200, 375, 400, 10); 
            let hpBarColor = "red";
            let isLightGlow = (boss.lightInfected > 0 || boss.hunterInfected > 0);
            if (isLightGlow) {
                hpBarColor = "#00ffff";
            } else if (boss.heroBleedTimer > 0) {
                hpBarColor = "#ff00aa";
            }
            ctx.fillStyle = hpBarColor;
            let barW = (Math.max(0, boss.hp) / boss.maxHp) * 400;
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
            ctx.fillText(`Фаза: ${boss.phase}  |  ${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp} HP${easyBadge}`, GAME_WIDTH/2, 385);
            ctx.restore();

            // Phase 4: 2 фиолетовых кружка рядом с полоской босса
            if (boss.phase === 4 && boss.lPhase4Orbs && boss.lPhase4Orbs.length >= 2) {
                let orbStartX = GAME_WIDTH/2 + 215;
                let orbY = 380;
                for (let k = 0; k < 2; k++) {
                    let ox = orbStartX + k * 18;
                    let isAlive = boss.lPhase4Orbs[k] && boss.lPhase4Orbs[k].alive;
                    ctx.save();
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

    drawWorldEvents();
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
            if (slowMoTimer > 0) {
                slowMoTimer--;
                if (slowMoTimer % 2 === 0) {
                    update();
                }
            } else {
                update();
            }
        }
        accumulator -= FIXED_TIME_STEP;
    }

    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
