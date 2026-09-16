// --- GAME ENGINE & MAIN LOOP MODULE ---

function buildAndStartGame() {
    initAudio(); 
    if (typeof stopMenuMusic === 'function') stopMenuMusic();
    let overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "none"; 
    players = [];
    
    if (secretMode) { 
        ARENA_W = 2500; 
        ARENA_H = 600; 
        FLOOR = 550; 
    } else { 
        ARENA_W = 1000; 
        ARENA_H = 400; 
        FLOOR = 350; 
    }

    let silkSolo = { left: ["ArrowLeft"], right: ["ArrowRight"], down: ["ArrowDown"], jump: ["KeyZ"], attack: ["KeyX"], heal: ["KeyA"], special: ["KeyF"], up: ["ArrowUp"], dash: ["KeyC"], stance: ["KeyS"] };
    let shooterSolo = { left: ["KeyA"], right: ["KeyD"], down: ["KeyS"], jump: ["Space"], attack: ["MouseLeft"], heal: ["KeyQ"], special: ["MouseRight"], up: ["KeyW"], dash: ["KeyE"], stance: ["KeyT", "KeyV", "KeyX"] };
    
    let p1Keys = p1InputType === 'KEYBOARD_SHOOTER' ? shooterSolo : silkSolo; 
    let p2Keys = shooterSolo; 
    if (numPlayers === 2 && p1InputType === 'KEYBOARD_SILK' && p2InputType === 'KEYBOARD_SHOOTER') {
        p1Keys = { left: ["ArrowLeft"], right: ["ArrowRight"], down: ["ArrowDown"], jump: ["Comma"], attack: ["Period"], heal: ["KeyK"], special: ["Quote"], up: ["ArrowUp"], dash: ["Slash"], stance: ["KeyS", "Semicolon"] };
    }

    if (!p1HeroSelection) p1HeroSelection = 'WATER';
    if (numPlayers === 2 && !p2HeroSelection) p2HeroSelection = 'EARTH';

    let startX1 = secretMode ? ARENA_W/2 - 50 : 150;
    let p1 = createPlayer(1, p1HeroSelection, p1Keys, p1InputType, startX1);
    p1.abilities = { ...configAbilities.p1 };
    
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

    if (!secretMode) {
        platforms = [ { x: 420, y: FLOOR - 100, w: 160, h: 10 } ];
    } else {
        platforms = [];
    }

    resetGameParams(); 
    gameState = "PLAYING";

    if (secretMode) {
        boss.state = "L_INTRO_FALL"; 
        boss.stateTimer = 60; 
        boss.y = FLOOR + 100; 
        boss.color = "#aaaaaa";
        for (let p of players) { p.y = -200; p.vy = 5; }
    }
}
window.buildAndStartGame = buildAndStartGame;

function resetGameParams() {
    for (let p of players) { 
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
        if (p.type === 'STAMINA') { p.stamina = 5; p.isCharging = false; p.chargeTimer = 0; p.chargeProjectiles = []; } 
        if (p.type === 'FIRE') { p.isParrying = false; p.parryTimer = 0; p.orangeHp = 0; p.orangeHpTimer = 0; p.isFieryHealing = false; p.fireDashTimer = 0; }
    }
    if (players.length > 0) players[0].x = ARENA_W/2 - 50; 
    if (players.length > 1) players[1].x = ARENA_W/2 + 50;
    
    sharedHeals = maxSharedHeals; 
    sharedHitCount = 0; 
    airBlades = []; playerDaggers = []; blackDaggers = []; p2Traps = []; phantoms = []; 
    airTraps = []; airComboTraps = []; scarf.active = false; clashFlash = null; 
    activeCinematic = null; globalWindMode = "NONE"; globalWindTimer = 0; globalWindCooldown = 0; 
    voidExplosions = []; voidPortals = []; looms = []; chaosBalls = []; screamRings = [];
    
    boss.hp = boss.maxHp; boss.phase = 1; boss.damageBonus = 0; boss.x = ARENA_W/2; boss.y = FLOOR - 50; 
    boss.state = "IDLE"; boss.stateTimer = 60; boss.flashTimer = 0; boss.vx = 0; boss.speed = 6.5; 
    boss.missCount = 0; boss.directAttackActive = false; boss.directAttackHit = false; boss.comboCount = 0; 
    boss.heroBleedTimer = 0; boss.heroBleedTicks = 0; boss.superQueue = []; boss.sa1Arr = []; 
    boss.hunterInfected = 0; boss.infectedTimer = 0; boss.voidWindDisabled = 0; boss.sa1Count = 0; 
    boss.saLines = null; boss.color = "#e6c800"; boss.climbSaTimer = 0; boss.saLinesState = ""; boss.saLinesTimer = 0;
    boss.lightStunDone = false; boss.lightInfected = 0;
    
    screenShake = { timer: 0, mag: 0, dirX: 0, dirY: 0 }; 
    freezeFrames = 0;
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

            if (rectIntersect({x: d.x-5, y: d.y-5, width: 10, height: 10}, boss) && boss.state !== "TRANSITION" && boss.state !== "DEFEATED" && !boss.state.startsWith("TELEPORT")) {
                let caster = players.find(pl => pl.id === d.pId);
                if (tryDamageBoss(d.dmg || 1, caster)) { playerDaggers.splice(i, 1); }
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

    // Void explosions
    if (boss.state === "FREE_ROAM") {
        for (let i = voidExplosions.length - 1; i >= 0; i--) {
            let e = voidExplosions[i]; e.x += e.vx; e.y += e.vy; e.timer--;
            if (e.timer <= 0) voidExplosions.splice(i, 1);
        }
    }
}

function update() {
    if (gameState !== "PLAYING") return;

    if (boss.hp <= 0 && boss.state !== "DEFEATED" && !boss.state.startsWith("CINEMATIC") && boss.state !== "FREE_ROAM") { 
        checkPhaseTransition(); 
    }

    if (players.some(p => p.hp <= 0 && (!p.isDowned || p.downedTimer <= 0))) { 
        gameState = "GAMEOVER"; 
    }

    // Camera follow
    let shouldFollowCam = (secretMode || boss.state.startsWith("L_CLIMB") || boss.phase >= 2.5) && !activeCinematic && boss.state !== "SA1_ACTIVE";
    if (shouldFollowCam) {
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
        camY += (ay - GAME_HEIGHT/2 - camY) * 0.1;
        let minCamY = -2000;
        if (camY < minCamY) camY = minCamY;
        let maxCamY = FLOOR - GAME_HEIGHT + 100;
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
            if (activeCinematic.tick % 30 === 0 && activeCinematic.tick <= 90) { 
                activeCinematic.p.invuln = 0; 
                takeDamage(activeCinematic.p, 1); 
                triggerShake(8, 10); 
                triggerVibration('sa_hit'); 
            } 
            if (activeCinematic.tick % 5 === 0) triggerVibration('damage'); 
        }
        if (activeCinematic.type === 'SA2') { 
            if (activeCinematic.tick % 30 === 0 && activeCinematic.tick <= 90) { 
                activeCinematic.p.invuln = 0; 
                takeDamage(activeCinematic.p, 1); 
                triggerShake(10, 10); 
                triggerVibration('sa_hit'); 
            } 
            if (activeCinematic.tick % 5 === 0) triggerVibration('damage'); 
        }
        if (activeCinematic.type === 'SA3') { 
            if (activeCinematic.tick === 30 || activeCinematic.tick === 60) {
                activeCinematic.p.invuln = 0;
                takeDamage(activeCinematic.p, 1);
                triggerShake(10, 10);
                triggerVibration('sa_hit');
            } else if (activeCinematic.tick === 90) { 
                // Tick 3: INFINITE DAMAGE / INSTANT KILL (bypasses shields & purple HP)
                takeDamage(activeCinematic.p, 9999, false, false, true);
                activeCinematic.p.hp = 0; 
                activeCinematic.p.purpleHp = 0;
                activeCinematic.p.orangeHp = 0;
                activeCinematic.p.isDowned = false; 
                triggerShake(20, 30); 
                triggerVibration('sa_hit'); 
            } 
            if (activeCinematic.tick % 5 === 0) triggerVibration('damage'); 
        }
        if (activeCinematic.timer <= 0) {
            let targetP = activeCinematic.p; 
            activeCinematic = null;
            boss.y = Math.min(targetP.y, FLOOR - boss.height);
            if (boss.superQueue && boss.superQueue.length > 0) { 
                boss.state = "EXECUTE_QUEUE"; boss.stateTimer = 30; 
            } else { 
                boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 30; 
                if (boss.phase === 2.5) { boss.phase = 3; boss.damageBonus = 0.5; } 
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

    updatePlayers();
    updateProjectiles();
    updateBoss();

    let voidVignette = document.getElementById('void-vignette');
    if (voidVignette) {
        let anyVoidDmg = players.some(p => p.voidDamageTimer > 0);
        voidVignette.style.opacity = anyVoidDmg ? "1" : "0";
    }
}

function drawBackground() {
    let bgTop = (boss.phase >= 2.5 || boss.state.startsWith("L_CLIMB") || secretMode) ? -2000 : 0;
    ctx.fillStyle = secretMode ? (window.fireHeroUnlocked ? "#150505" : "#111") : (globalWindMode === "DOWN" ? "#1a100c" : "#2e1a12"); 
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

    ctx.fillStyle = secretMode ? (window.fireHeroUnlocked ? "#1a0000" : "#000") : "#22110a"; 
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
        for (let i = 0; i < p.maxHp; i++) {
            let cx = 30 + i * 30; let cy = yOffset;
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
        }
        if (p.purpleHp > 0) {
            for (let i = 0; i < p.purpleHp; i++) {
                let cx = 30 + (p.maxHp + i) * 30; let cy = yOffset;
                ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); 
                ctx.fillStyle = "#9900ff"; ctx.fill(); ctx.strokeStyle = "#ff55ff"; ctx.lineWidth = 2; ctx.stroke();
            }
        }
        if (p.orangeHp > 0) {
            let cx = 30 + (p.maxHp + p.purpleHp) * 30; let cy = yOffset;
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
            let critPct = (sharedHeals >= 3) ? 10 : (sharedHeals >= 2 ? 7.5 : (sharedHeals >= 1 ? 5 : 0));
            tagText = `[КИНЖАЛЫ ТЕНИ] (Крит: ${critPct}%)`;
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
                tagText = `[НАГРЕВ КЛИНКА: ${(p.heatBladeTimer/60).toFixed(1)}с] (x1.5 + Ожог)`;
                tagColor = "#ff4400";
            } else {
                tagText = "[СТАЛЬНАЯ ШПАГА] (S: Нагрев)";
                tagColor = "#ffaa33";
            }
        }

        if (tagText) {
            ctx.save();
            ctx.font = "bold 12px Arial";
            ctx.fillStyle = tagColor;
            ctx.fillText(tagText, tagOffset, yOffset + 4);
            ctx.restore();
            tagOffset += 190;
        }

        if (secretMode && (p.hallucinationHits || 0) >= 3 && !(p.type === 'WATER' && p.stance === 'DEMON')) {
            ctx.save();
            ctx.font = "bold 11px Arial";
            let hPulse = 0.6 + 0.4 * Math.sin(Date.now() / 120);
            ctx.fillStyle = `rgba(220, 0, 255, ${hPulse})`;
            ctx.fillText("⚠ ИСКАЖЕНИЕ ПУСТОТЫ (3/3)", tagOffset, yOffset + 4);
            ctx.restore();
        } else if (secretMode && (p.hallucinationHits || 0) > 0 && !(p.type === 'WATER' && p.stance === 'DEMON')) {
            ctx.save();
            ctx.font = "11px Arial";
            ctx.fillStyle = "rgba(180, 100, 220, 0.8)";
            ctx.fillText(`Удары пустоты: ${p.hallucinationHits}/3`, tagOffset, yOffset + 4);
            ctx.restore();
        }
    }

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
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "#fff"; ctx.fillRect(GAME_WIDTH/2 - 15, GAME_HEIGHT/2, 30, 50); 
        ctx.fillStyle = "#555"; ctx.fillRect(GAME_WIDTH/2 + Math.sin(activeCinematic.tick)*100, GAME_HEIGHT/2, 30, 50); 
        ctx.fillStyle = "red"; ctx.font = "30px Arial"; ctx.textAlign = "center"; ctx.fillText("КРИТИЧЕСКИЙ УДАР!", GAME_WIDTH/2, 100); ctx.textAlign = "left";
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
                if (boss.saLinesState === "EXECUTE") {
                    let progress = 1 - (boss.saLinesTimer / 10);
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
            drawBoss();
            for (let p of players) {
                drawPlayer(p);
            }

            if (secretMode && players.some(p => (p.hallucinationHits || 0) >= 3 && !(p.type === 'WATER' && p.stance === 'DEMON'))) {
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

        let hasHallucinations = secretMode && players.some(p => (p.hallucinationHits || 0) >= 3 && !(p.type === 'WATER' && p.stance === 'DEMON'));
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

    if (boss.state === "FREE_ROAM") {
        ctx.fillStyle = "white"; ctx.font = "60px Arial"; ctx.textAlign = "center"; 
        ctx.fillText("ПОБЕДА", GAME_WIDTH/2, 150); ctx.textAlign = "left"; 
    }

    if (gameState === "PLAYING") {
        drawMasks(); 
        if (!activeCinematic && boss.state !== "DEFEATED" && !boss.state.startsWith("CINEMATIC") && boss.state !== "FREE_ROAM" && !boss.state.startsWith("L_CLIMB")) { 
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
            ctx.fillStyle = "white"; ctx.font = "12px Arial"; 
            ctx.fillText(`Фаза: ${boss.phase}`, GAME_WIDTH/2 - 20, 385); 
        }
    } else if (gameState === "GAMEOVER") { 
        ctx.fillStyle = "red"; ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.fillText("ВЫ ПОГИБЛИ", GAME_WIDTH/2, 180); 
        ctx.font = "20px Arial"; ctx.fillText("Нажмите 'R' для рестарта", GAME_WIDTH/2, 220); ctx.textAlign = "left";
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
            update();
        }
        accumulator -= FIXED_TIME_STEP;
    }

    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
