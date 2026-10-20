// --- BOSS (LACE) MODULE ---

function getBossColor(c) {
    if (boss.lightInfected > 0 || boss.hunterInfected > 0 || boss.infectedTimer > 0) return "#00ffff"; 
    if (boss.state === "BOSS_STUNNED" || boss.state === "L_PHASE4_STUNNED") return c; // В оглушении босс окрашивается в свои обычные цвета!
    if (!secretMode) return c;
    if (boss.state === "SA1_ACTIVE") return "#ff8800"; 
    if (c === '#e6c800') return '#665500'; 
    if (c === '#ff3333') return '#660000'; 
    if (c === '#00ffff') return '#006666'; 
    if (c === '#ff8800') return '#884400'; 
    if (c === '#aaaaaa') return '#444444'; 
    return c;
}

function checkBossStun() {
    if (boss.state === "BOSS_STUNNED" || boss.state === "L_PHASE4_STUNNED" || boss.state === "L_PHASE4_ORBS" || boss.state === "L_PHASE4_FALL" || boss.state.startsWith("CINEMATIC") || boss.state === "DEFEATED" || boss.state === "FREE_ROAM" || boss.state.startsWith("L_CLIMB") || boss.phase === 2.5) return;
    
    let shouldStun = false;
    if (!secretMode) {
        // Обычный режим: 2 оглушения (1 фаза 50% и 2 фаза 50%)
        if (boss.phase === 1 && !boss.stunP1_1 && boss.hp <= boss.maxHp * 0.5) {
            boss.stunP1_1 = true;
            shouldStun = true;
        } else if (boss.phase === 2 && !boss.stunP2 && boss.hp <= phase2Hp * 0.5) {
            boss.stunP2 = true;
            shouldStun = true;
        }
    } else {
        // L режим: 3 оглушения (1 фаза 2/3 и 1/3, 2 фаза 50%)
        if (boss.phase === 1 && !boss.stunP1_1 && boss.hp <= boss.maxHp * (2 / 3)) {
            boss.stunP1_1 = true;
            shouldStun = true;
        } else if (boss.phase === 1 && !boss.stunP1_2 && boss.hp <= boss.maxHp * (1 / 3)) {
            boss.stunP1_2 = true;
            shouldStun = true;
        } else if (boss.phase === 2 && !boss.stunP2 && boss.hp <= phase2Hp * 0.5) {
            boss.stunP2 = true;
            shouldStun = true;
        }
    }

    if (shouldStun) {
        boss.state = "BOSS_STUNNED";
        boss.stateTimer = 300; // 5 секунд оглушения
        boss.vx = 0;
        boss.vy = 0;
        boss.y = FLOOR - boss.height;
        boss.superQueue = [];
        boss.sa1Arr = [];
        boss.invuln = 0;
        boss.color = "#e6c800";
        playSound('parry');
        playSound('break');
        triggerShake(10, 16);
        voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y - 10, timer: 30, isWhite: true, isOrange: false, r: 50 });
    }
}

function createRandomSaLine(type) {
    let rx = (camX || 0) + Math.random() * GAME_WIDTH;
    let ry = (camY || 0) + Math.random() * GAME_HEIGHT;
    let angle = Math.random() * Math.PI;
    let dist = 3500;
    return {
        x1: rx - Math.cos(angle) * dist,
        y1: ry - Math.sin(angle) * dist,
        x2: rx + Math.cos(angle) * dist,
        y2: ry + Math.sin(angle) * dist,
        type: type
    };
}

function tryDamageBoss(dmg, sourcePlayer) {
    if (window.isFireBossMode) {
        return tryDamageFireBoss(dmg, sourcePlayer);
    }
    if (boss.invuln > 0 || boss.state === "DEFEATED" || boss.state.startsWith("CINEMATIC") || boss.state.startsWith("TELEPORT") || boss.state === "L_CLIMB_START" || boss.state === "L_CLIMB_ACTIVE" || boss.state === "VOID_SINK_STUN" || boss.state === "L_PHASE4_ORBS" || boss.state === "L_PHASE4_FALL" || (boss.phase === 4 && boss.state !== "L_PHASE4_STUNNED")) return false;

    // Фаза 4: босс в бесконечном оглушении - один любой удар и он побежден!
    if (boss.state === "L_PHASE4_STUNNED") {
        boss.hp = 0;
        boss.state = "DEFEATED";
        let bgm = document.getElementById("lModeMusic"); 
        if (bgm) bgm.pause();
        triggerVibration('l_mode_final'); 
        boss.state = "FREE_ROAM"; 
        let origX = (boss.x > -1000) ? boss.x + 15 : ARENA_W / 2;
        let origY = (boss.y > -1000) ? boss.y + 25 : FLOOR - 50;
        boss.x = -99999;
        boss.y = -99999;
        boss.vx = 0;
        boss.vy = 0;
        for (let i = 0; i < 60; i++) {
            voidExplosions.push({
                x: origX, 
                y: origY, 
                vx: (Math.random() - 0.5) * 24, 
                vy: (Math.random() - 0.5) * 24, 
                timer: 75, 
                isWhite: Math.random() > 0.5
            });
        }
        playSound('hitBoss');
        playSound('slash');
        triggerShake(20, 30);
        return true;
    }

    if (megaDamageActive || window.megaDamageActive) {
        dmg *= 5;
    }

    if (boss.state === "PARRY_STANCE") {
        boss.state = "PARRY_COUNTER_WINDUP";
        boss.stateTimer = 6; 
        boss.flashTimer = 15; 
        boss.attackDir = boss.x < (sourcePlayer ? sourcePlayer.x : ARENA_W/2) ? 1 : -1;
        playSound('parry');
        return true; 
    }

    if (boss.state === "VULN_STANCE") {
        let baseDmg = (megaDamageActive || window.megaDamageActive) ? 15 : 3;
        boss.hp -= baseDmg * (sourcePlayer ? sourcePlayer.dmgDealtMod : 1);
        boss.state = "HIDDEN_PAUSE";
        boss.stateTimer = 30;
        boss.y = -1000;
        boss.invuln = 10;
        playSound('hitBoss');
        if (sourcePlayer) recordHit(sourcePlayer);
        checkPhaseTransition();
        freezeFrames = 6;
        return true;
    }

    if (boss.state === "VULN_LATE") {
        boss.hp -= dmg * (sourcePlayer ? sourcePlayer.dmgDealtMod : 1);
        boss.state = "AOE"; 
        boss.stateTimer = 15; 
        boss.invuln = 10;
        applyPhysicsPushToLeaves(boss.x + 15, boss.y + 25, 25);
        playSound('hitBoss');
        if (sourcePlayer) recordHit(sourcePlayer);
        checkPhaseTransition();
        freezeFrames = 6;
        return true;
    }

    let finalDmg = dmg * (sourcePlayer ? sourcePlayer.dmgDealtMod : 1);
    if (sourcePlayer && sourcePlayer.isMobile) finalDmg += 0.5;
    finalDmg = Math.round(finalDmg * 100) / 100;
    boss.hp = Math.max(0, Math.round((boss.hp - finalDmg) * 100) / 100);
    boss.invuln = 10;
    playSound('hitBoss');
    if (sourcePlayer) recordHit(sourcePlayer);
    checkPhaseTransition();
    freezeFrames = 5;
    return true;
}

function triggerCinematic(type, targetPlayer, isRealHit = true, lineAngle = null) {
    if (type === "SA1") activeCinematic = { type: 'SA1', p: targetPlayer, timer: 72, tick: 0, isReal: isRealHit, angle: lineAngle };
    else if (type === "SA2") activeCinematic = { type: 'SA2', p: targetPlayer, timer: 48, tick: 0, isReal: isRealHit, angle: lineAngle };
    else if (type === "SA3") activeCinematic = { type: 'SA3', p: targetPlayer, timer: 52, tick: 0, isReal: isRealHit, angle: lineAngle };
}

function triggerChaos(saCount) {
    boss.y = -1000; boss.vx = 0; boss.vy = 0;
    if (saCount === 3) { 
        boss.superQueue = [{ s: "SA2_WINDUP", t: 24 }, { s: "SA2_WINDUP", t: 24 }, { s: "SA2_WINDUP", t: 24 }, { s: "SA2_DOUBLE", t: 24 }, { s: "SA2_TRIPLE", t: 24 }, { s: "SA3_WINDUP", t: 24 }]; 
    } else if (saCount === 4) { 
        boss.superQueue = [{ s: "SA2_WINDUP", t: 24 }, { s: "SA2_WINDUP", t: 24 }, { s: "SA2_WINDUP", t: 24 }, { s: "SA2_DOUBLE", t: 24 }, { s: "SA3_WINDUP", t: 24 }]; 
    }
    boss.state = "EXECUTE_QUEUE"; 
    boss.stateTimer = 1; 
    boss.phase = (saCount === 3 ? 2.5 : 3.5); 
}

function checkPhaseTransition() {
    if (typeof isTutorial !== 'undefined' && isTutorial) return;
    if (typeof isFireBossMode !== 'undefined' && isFireBossMode) return;
    if (typeof window !== 'undefined' && window.isFireBossMode) return;
    if (boss && boss.state === "FIRE_FINALE") return;
    if (boss.hp <= 0 && boss.state !== "DEFEATED" && !boss.state.startsWith("CINEMATIC") && boss.state !== "FREE_ROAM") {
        boss.hp = 0;
        if (secretMode && boss.phase === 3) {
            // L-mode Phase 4: True Void / Сферы Тьмы!
            boss.phase = 4;
            boss.hp = 1;
            boss.maxHp = 1;
            boss.invuln = 999999;
            boss.x = ARENA_W / 2 - boss.width / 2;
            boss.y = FLOOR - 220;
            boss.vx = 0;
            boss.vy = 0;
            boss.state = "L_PHASE4_ORBS";
            boss.lPhase4AttackTimer = 60; // 1 секунда между атаками в 4 фазе!
            boss.lPhase4Orbs = [
                { x: 260, y: FLOOR - 90, r: 24, alive: true, isMonolith: false },
                { x: ARENA_W / 2, y: FLOOR - 110, r: 28, alive: true, isMonolith: true },
                { x: ARENA_W - 260, y: FLOOR - 90, r: 24, alive: true, isMonolith: false }
            ];
            
            // Восполнить все хилы до максимума
            if (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal) {
                sharedHealPoints = MAX_HEAL_POINTS;
            }
            sharedHeals = maxSharedHeals;
            sharedHitCount = 0;

            triggerVibration('l_mode_final');
            triggerShake(16, 24);
            playSound('break');
            playSound('lightChime');
            battleAnnouncements.push({ text: "ФАЗА 4: СФЕРЫ ТЬМЫ", color: "#aa00ff", timer: 180 });
            for (let i = 0; i < 40; i++) {
                voidExplosions.push({
                    x: boss.x + 15,
                    y: boss.y + 25,
                    vx: (Math.random() - 0.5) * 20,
                    vy: (Math.random() - 0.5) * 20,
                    timer: 50,
                    isWhite: Math.random() > 0.5
                });
            }
            return;
        } else if (secretMode && boss.phase >= 4) {
            let bgm = document.getElementById("lModeMusic"); 
            if (bgm) bgm.pause();
            triggerVibration('l_mode_final'); 
            boss.state = "FREE_ROAM"; 
            let origX = (boss.x > -1000) ? boss.x + 15 : ARENA_W / 2;
            let origY = (boss.y > -1000) ? boss.y + 25 : FLOOR - 50;
            boss.x = -99999;
            boss.y = -99999;
            boss.vx = 0;
            boss.vy = 0;
            for (let i = 0; i < 50; i++) {
                voidExplosions.push({
                    x: origX, 
                    y: origY, 
                    vx: (Math.random() - 0.5) * 22, 
                    vy: (Math.random() - 0.5) * 22, 
                    timer: 70, 
                    isWhite: Math.random() > 0.5
                });
            }
            playSound('hitBoss');
            return;
        } else if (!secretMode && boss.phase >= 3) {
            boss.state = "CINEMATIC_TIE_WAIT"; 
            boss.invuln = 9999; 
            boss.missCount = 0; 
            boss.stateTimer = 600; 
            boss.x = ARENA_W/2 - 15; 
            boss.y = FLOOR - boss.height; 
            boss.vx = 0; boss.vy = 0; 
            boss.color = "white";
            for (let p of players) { 
                p.bleedTimer = 0; 
                p.hasPressedTie = false; 
                p.tied = false; 
                if (p.type === 'STAMINA') { p.isCharging = false; p.chargeTimer = 0; } 
            }
            airBlades = []; playerDaggers = []; blackDaggers = []; p2Traps = []; phantoms = []; airTraps = []; airComboTraps = []; 
            scarf.active = false; globalWindMode = "NONE"; boss.width = 30; boss.height = 50; boss.isHorizontal = false; looms = []; chaosBalls = [];
            players[0].x = boss.x - 50; players[0].y = FLOOR - players[0].height; players[0].vx = 0; players[0].facingRight = true;
            if (numPlayers === 2) { 
                players[1].x = boss.x + boss.width + 20; 
                players[1].y = FLOOR - players[1].height; 
                players[1].vx = 0; 
                players[1].facingRight = false; 
            }
        } else {
            if (boss.phase === 1) { 
                boss.phase = 2; 
                boss.hp = phase2Hp; 
                if (secretMode) {
                    boss.superQueue = [ { s: "VOID_PORTALS", t: 90 }, { s: "VOID_PORTALS", t: 90 }, { s: "VOID_PORTALS", t: 90 }, { s: "SHARPEN_WINDUP", t: 120 } ]; 
                    boss.state = "EXECUTE_QUEUE"; 
                    boss.stateTimer = 1;
                    platforms = [ {x: 200, y: FLOOR-80, w: 80, h:10}, {x: 500, y: FLOOR-120, w: 80, h:10}, {x: 800, y: FLOOR-80, w: 80, h:10} ];
                } else {
                    startTransition("Фаза 2: Кинжалы и Телепорты!"); 
                }
            } else if (boss.phase === 2) { 
                if (secretMode) {
                    startPhase3Transition();
                } else {
                    boss.phase = 3; 
                    boss.hp = phase3Hp; 
                    boss.damageBonus = 0.5; 
                    boss.speed = 8.5; 
                    startTransition("Фаза 3: Финальная Битва!");
                }
            }
        }
    } else if (boss.hp > 0) {
        checkBossStun();
    }
}

function startPhase3Transition() {
    // 1. Выключаем музыку во время перехода из 2 в 3 фазу
    let bgm = document.getElementById("lModeMusic"); 
    if (bgm) bgm.pause();

    // 2. Полностью убираем босса, отключаем его гравитацию и физику
    boss.phase = 2.5; 
    boss.hp = phase3Hp; 
    boss.invuln = 99999;
    boss.state = "L_CLIMB_TRANSITION"; 
    boss.transitionTimer = 0;
    boss.climbPlatCount = 0;
    boss.climbPlatTimer = 0;
    boss.climbSaStep = 0;
    boss.halfHpSeqDone = false;
    boss.saLines = null;
    boss.climbSaTimer = 0;
    boss.abyssLanded = false;
    boss.startFloor = FLOOR;
    boss.phase3AnnouncementTimer = 0;
    boss.x = -99999;
    boss.y = -99999; 
    boss.vx = 0; 
    boss.vy = 0; 

    // Очищаем арену от снарядов и ловушек
    airBlades = []; playerDaggers = []; blackDaggers = []; p2Traps = []; phantoms = []; 
    airTraps = []; airComboTraps = []; scarf.active = false; looms = []; voidPortals = []; chaosBalls = [];
    platforms = [];

    // 3. Пол исчезает, герои падают 2 секунды (120 кадров) в глубины темной бездны!
    FLOOR += 10000;
    triggerShake(16, 25);
    playSound('break');

    for (let p of players) {
        p.vy = Math.max(p.vy, 4);
        p.invuln = 140; // Неуязвимость на время падения
    }

    // Спавним платформы по центру поля зрения игрока
    let targetX = (players && players[0]) ? players[0].x : ARENA_W / 2;
    boss.climbCenterX = Math.min(Math.max(targetX, 240), ARENA_W - 240);
}

function updatePhase3Transition() {
    // Босс заблокирован за экраном без гравитации и без движения
    boss.x = -99999;
    boss.y = -99999;
    boss.vx = 0;
    boss.vy = 0;
    boss.invuln = 99999;
    boss.transitionTimer++;

    // === 1. СВОБОДНОЕ ПАДЕНИЕ В БЕЗДНУ (Ровно 2 секунды = 120 кадров) ===
    if (boss.transitionTimer < 120) {
        let lowestY = Math.max(...players.map(p => p.y));
        FLOOR = Math.max(boss.startFloor + 6000, lowestY + 2000);

        // Ограничиваем скорость падения для плавного кинематографичного полета
        for (let p of players) {
            if (p.vy > 20) p.vy = 20;
            p.invuln = 30;
        }

        // Завывание бездны и сотрясение от скорости
        if (boss.transitionTimer % 25 === 0) {
            playSound('wind');
        }
        if (boss.transitionTimer % 20 === 0) {
            triggerShake(2, 6);
        }
        return;
    }

    // === 2. ПРИЗЕМЛЕНИЕ НА ДНО БЕЗДНЫ (Ровно на 120-м кадре = 2.0 секунды) ===
    if (boss.transitionTimer === 120) {
        boss.abyssLanded = true;
        let groundY = Math.max(...players.map(p => p.y + p.height));
        FLOOR = Math.round(groundY);
        boss.abyssFloor = FLOOR;

        for (let p of players) {
            p.y = FLOOR - p.height;
            p.vy = 0;
            p.lastSafeX = p.x;
            p.lastSafeY = p.y;
            p.jumps = 0;
        }

        // Мощный удар о дно бездны со спецэффектами
        playSound('hitBoss');
        triggerShake(20, 30);
        triggerVibration('slam');
        voidExplosions.push({ x: boss.climbCenterX, y: FLOOR - 20, timer: 30, isWhite: true, isOrange: false, r: 140 });
        applyPhysicsPushToLeaves(boss.climbCenterX, FLOOR - 30, 25);
    }

    // === 3. ПОЯВЛЕНИЕ 10 ПЛАТФОРМ ДЛЯ ПОДЪЕМА НАВЕРХ ===
    if (boss.transitionTimer > 120) {
        boss.climbPlatTimer++;
        if (boss.climbPlatTimer >= 10 && boss.climbPlatCount < 10) {
            boss.climbPlatTimer = 0;
            boss.climbPlatCount++;
            let i = boss.climbPlatCount; // 1 to 10
            let stepY = 85;
            let platY = boss.abyssFloor - (i * stepY);
            let platW = (i === 10) ? 340 : 180;
            let offset = (i === 1 || i === 10) ? 0 : ((i % 2 === 0) ? -130 : 130);
            let platX = boss.climbCenterX + offset - platW / 2;
            platX = Math.min(Math.max(platX, 20), ARENA_W - platW - 20);

            platforms.push({ x: platX, y: platY, w: platW, h: 16, num: i });
            playSound('wind');
            applyPhysicsPushToLeaves(platX + platW / 2, platY, 15);
            triggerShake(3, 5);
        }
    }

    // === 4. SA 2 АТАКИ ВО ВРЕМЯ ПОДЪЕМА ПО ПЛАТФОРМАМ ===
    if (boss.transitionTimer > 180 && !boss.saLines && !activeCinematic) {
        if (!boss.climbSaTimer) boss.climbSaTimer = 0;
        boss.climbSaTimer++;
        if (boss.climbSaTimer >= 180) { // каждые ~3 секунды
            boss.climbSaTimer = 0;
            let step = boss.climbSaStep || 0;

            if (step === 0) boss.saLines = [ createRandomSaLine("SA2") ];
            else if (step === 1) boss.saLines = [ createRandomSaLine("SA2") ];
            else if (step === 2) boss.saLines = [ createRandomSaLine("SA2"), createRandomSaLine("SA2") ];
            else if (step === 3) boss.saLines = [ createRandomSaLine("SA2") ];
            else if (step === 4) boss.saLines = [ createRandomSaLine("SA2"), createRandomSaLine("SA2") ];
            else if (step === 5) boss.saLines = [ createRandomSaLine("SA2"), createRandomSaLine("SA2"), createRandomSaLine("SA2") ];

            boss.climbSaStep = (step + 1) % 6;
            boss.saLinesState = "WINDUP";
            boss.saLinesTimer = 55;
        }
    }

    if (boss.saLines) {
        boss.saLinesTimer--;
        if (boss.saLinesTimer <= 0 && boss.saLinesState === "WINDUP") {
            boss.saLinesState = "EXECUTE";
            boss.saLinesTimer = 10;
            playSound('slash');
            triggerShake(8, 12);
        } else if (boss.saLinesTimer <= 0 && boss.saLinesState === "EXECUTE") {
            boss.saLines = null;
            for (let p of players) p.saHit = false;
        } else if (boss.saLinesState === "EXECUTE") {
            for (let l of boss.saLines) {
                let progress = 1 - (boss.saLinesTimer / 10);
                let curLine = {
                    x1: l.x1, 
                    y1: l.y1, 
                    x2: l.x1 + (l.x2 - l.x1) * progress, 
                    y2: l.y1 + (l.y2 - l.y1) * progress
                };
                for (let p of players) {
                    if (!p.isDowned && !p.saHit && p.invuln <= 0 && distToSegment(p, curLine) < 38 + p.width/2) {
                        let lineAngle = Math.atan2(l.y2 - l.y1, l.x2 - l.x1);
                        triggerCinematic(l.type, p, true, lineAngle);
                        p.saHit = true;
                        boss.saLines = null;
                        triggerShake(15, 20);
                        triggerVibration('sa_hit');
                        break;
                    }
                }
                if (!boss.saLines) break;
            }
        }
    }

    // === 5. ПРОВЕРКА ДОСТИЖЕНИЯ 10-Й ПЛАТФОРМЫ (ВЕРШИНА) ===
    let topPlat = platforms.find(p => p.num === 10);
    if (topPlat) {
        let reachedTop = players.some(p => !p.isDowned && p.hp > 0 && (
            (p.y + p.height <= topPlat.y + 15 && p.y + p.height >= topPlat.y - 15 && p.x + p.width > topPlat.x && p.x < topPlat.x + topPlat.w) ||
            rectIntersect(p, { x: topPlat.x, y: topPlat.y - 15, width: topPlat.w, height: topPlat.h + 25 })
        ));
        if (reachedTop) {
            // 1. Появляется пол на уровне десятой платформы:
            FLOOR = topPlat.y;

            // 2. Игроки надежно ставятся на новый пол:
            for (let p of players) {
                if (p.y > FLOOR - p.height) {
                    p.y = FLOOR - p.height;
                    p.vy = 0;
                }
                p.lastSafeX = p.x;
                p.lastSafeY = FLOOR - p.height;
            }

            // 3. Босс появляется и начинается 3 фаза!
            boss.phase = 3;
            boss.hp = phase3Hp;
            boss.damageBonus = 0.5;
            boss.speed = 8.5;
            boss.state = "IDLE";
            boss.stateTimer = 45;
            boss.invuln = 60;
            boss.color = "#e6c800";
            boss.x = boss.climbCenterX - 15;
            boss.y = FLOOR - boss.height;
            boss.vx = 0;
            boss.vy = 0;
            boss.saLines = null;
            boss.climbSaTimer = 0;
            boss.phase3AnnouncementTimer = 180;

            // Боевые платформы для 3 фазы:
            let cX = boss.climbCenterX;
            platforms = [
                { x: cX - 550, y: FLOOR - 80, w: 180, h: 14 },
                { x: cX - 280, y: FLOOR - 140, w: 200, h: 14 },
                { x: cX - 80, y: FLOOR - 80, w: 160, h: 14 },
                { x: cX + 160, y: FLOOR - 140, w: 200, h: 14 },
                { x: cX + 420, y: FLOOR - 80, w: 180, h: 14 }
            ];

            // 4. Музыка включается ТОЛЬКО СЕЙЧАС (в начале 3 фазы):
            let bgm = document.getElementById("lModeMusic");
            if (bgm) {
                bgm.currentTime = 0;
                bgm.volume = 0.5;
                bgm.play().catch(e => console.log(e));
            }

            triggerShake(18, 25);
            playSound('parry');
            playSound('demonRoar');
            voidExplosions.push({ x: boss.x + boss.width / 2, y: boss.y + boss.height / 2, timer: 30, isWhite: true, isOrange: false, r: 150 });
        }
    }
}

function checkMissPhaseTransition() {
    if (secretMode) return; 
    if (boss.missCount >= 3) {
        boss.missCount = 0;
        if (boss.phase === 1) { 
            boss.hp = phase2Hp; boss.phase = 2; 
            startTransition("ЯРОСТЬ! Промахи раздражают. Фаза 2!"); 
        } else if (boss.phase === 2) { 
            boss.phase = 3;
            boss.hp = phase3Hp;
            boss.damageBonus = 0.5;
            boss.speed = 8.5;
            startTransition("ЯРОСТЬ! Промахи раздражают. Фаза 3!"); 
        }
    }
}

function startTransition(msg) { 
    boss.state = "TRANSITION"; 
    boss.color = "#e6c800"; 
    boss.msg = msg; 
    boss.stateTimer = 420; 
    boss.invuln = 420; 
    boss.comboCount = 0; 
    boss.x = ARENA_W/2 - 15; 
    boss.y = FLOOR - boss.height; 
    boss.vx = 0; boss.vy = 0; 
    boss.missCount = 0; 
    airBlades = []; playerDaggers = []; blackDaggers = []; p2Traps = []; 
    scarf.active = false; 
    globalWindMode = "NONE"; 
    boss.width = 30; boss.height = 50; boss.isHorizontal = false; 
}

function spawnThread(targetPlayer) { 
    let dx = (targetPlayer.x + targetPlayer.width/2) - (boss.x + boss.width/2); 
    let dy = (targetPlayer.y + targetPlayer.height/2) - (boss.y + boss.height/2); 
    let dist = Math.hypot(dx, dy); 
    blackDaggers.push({ 
        x: boss.x + boss.width/2, 
        y: boss.y + boss.height/2, 
        vx: (dx/dist) * 11, 
        vy: (dy/dist) * 11, 
        isShuriken: false, 
        isSecret: false, 
        dmg: 0, 
        deflected: 0 
    }); 
    playSound('throw'); 
}

function updateBoss() {
    if (window.isFireBossMode) {
        updateFireBoss();
        return;
    }
    if (boss.state === "DEFEATED" || boss.state === "FREE_ROAM") return;

    // --- ПЕРЕХОД В 3 ФАЗУ (РЕЖИМ L) ---
    if (boss.state === "L_CLIMB_TRANSITION" || boss.state.startsWith("L_CLIMB") || boss.phase === 2.5) {
        updatePhase3Transition();
        return;
    }

    if (boss.invuln > 0) boss.invuln--; 
    boss.stateTimer--; 

    // Оглушение босса (Boss Stun: 5 секунд / 300 кадров)
    if (boss.state === "BOSS_STUNNED") {
        boss.vx = 0;
        boss.vy = 0;
        if (boss.y + boss.height < FLOOR) boss.y = Math.min(FLOOR - boss.height, boss.y + 10);
        if (boss.stateTimer <= 0) {
            boss.state = "IDLE";
            boss.color = "#e6c800";
            boss.stateTimer = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.bossSpeed) ? 12 : 25;
        }
        return;
    }

    // Фаза 4: Сферы Тьмы
    if (boss.state === "L_PHASE4_ORBS") {
        boss.vx = 0;
        boss.vy = 0;
        boss.x = ARENA_W / 2 - boss.width / 2;
        boss.y = (FLOOR - 220) + Math.sin(Date.now() / 250) * 8;
        boss.invuln = 99999;

        if (Math.random() < 0.25) {
            voidExplosions.push({
                x: boss.x + boss.width/2 + (Math.random() - 0.5) * 40,
                y: boss.y + boss.height/2 + (Math.random() - 0.5) * 40,
                timer: 20,
                isWhite: false,
                r: 15
            });
        }

        boss.lPhase4AttackTimer--;
        let attackInterval = 60; // 1 секунда между атаками в 4 фазе!
        if (boss.lPhase4AttackTimer <= 0) {
            boss.lPhase4AttackTimer = attackInterval;
            let roll = Math.random();
            if (roll < 0.28) {
                // Спам сюрикенами из порталов
                boss.state = "VOID_PORTALS";
                boss.stateTimer = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.bossSpeed) ? 65 : 85;
                boss.color = "#9900ff";
            } else {
                // Случайный SA: SA1 всегда 1 раз, SA2 случайное количество раз (1..3), SA3
                let saRoll = Math.random();
                if (saRoll < 0.33) {
                    boss.state = "SA1_WINDUP";
                    boss.stateTimer = 1;
                    boss.color = "#ff8800";
                } else if (saRoll < 0.68) {
                    let sa2CountRoll = Math.random();
                    if (sa2CountRoll < 0.34) {
                        boss.state = "SA2_WINDUP";
                        boss.stateTimer = 24;
                    } else if (sa2CountRoll < 0.67) {
                        boss.state = "SA2_DOUBLE";
                        boss.stateTimer = 24;
                    } else {
                        boss.state = "SA2_TRIPLE";
                        boss.stateTimer = 24;
                    }
                    boss.color = "#ffffff";
                    playSound('slash');
                } else {
                    boss.state = "SA3_WINDUP";
                    boss.stateTimer = 24;
                    boss.color = "#9900ff";
                    playSound('demonRoar');
                }
            }
        }
        return;
    }

    if (boss.state === "L_PHASE4_FALL") {
        boss.vx = 0;
        boss.y += 12;
        if (boss.y >= FLOOR - boss.height) {
            boss.y = FLOOR - boss.height;
            boss.state = "L_PHASE4_STUNNED";
            boss.stateTimer = 999999;
            boss.hp = 1;
            boss.invuln = 0;
            boss.color = "#e6c800";
            playSound('hitBoss');
            playSound('break');
            triggerShake(16, 24);
            voidExplosions.push({ x: boss.x + boss.width/2, y: FLOOR, timer: 30, isWhite: true, r: 60 });
        }
        return;
    }

    if (boss.state === "L_PHASE4_STUNNED") {
        boss.vx = 0;
        boss.vy = 0;
        boss.y = FLOOR - boss.height;
        boss.invuln = 0;
        boss.color = "#e6c800";
        return;
    } 

    // Заражение светом (Light Infection): 5 секунд = 300 кадров
    if (boss.lightInfected > 0) {
        boss.lightInfected--;
        // Каждую секунду (60 кадров) отнимается 0.5 HP (суммарно 2.5 HP)
        if (boss.lightInfected % 60 === 0) {
            boss.hp -= 0.5;
            checkPhaseTransition();
        }
        // Бирюзовые искры света вокруг босса
        if (boss.lightInfected % 8 === 0) {
            voidExplosions.push({
                x: boss.x + Math.random() * boss.width,
                y: boss.y + Math.random() * boss.height,
                timer: 15,
                isWhite: true,
                r: 12
            });
        }
    }

    // Горение от нагретого клинка Огня (Heat Blade Burn)
    if (boss.bossBurnTimer > 0) {
        boss.bossBurnTimer--;
        if (boss.bossBurnTimer % 60 === 0 && boss.bossBurnTicks > 0) {
            boss.bossBurnTicks--;
            boss.hp -= 0.67; // ~2 урона за 3 сек
            playSound('hitBoss');
            voidExplosions.push({
                x: boss.x + boss.width/2 + (Math.random() - 0.5) * 20,
                y: boss.y + boss.height/2 + (Math.random() - 0.5) * 20,
                timer: 15,
                isWhite: false,
                isOrange: true,
                r: 30
            });
            checkPhaseTransition();
        }
    }

    if (boss.healCooldown > 0) boss.healCooldown--;

    // Смертоносная последовательность SA при половине ХП в 3 фазе (режим L)
    // Цепочка: SA2 -> 2*SA2 -> SA2 & SA3 -> 2*SA2 -> 3*SA2 -> 3*SA2 & SA3 -> SA1
    // Босс полностью исчезает на время цепочки, чтобы ее нельзя было прервать
    if (secretMode && boss.phase === 3 && boss.hp <= phase3Hp * 0.5 && !boss.halfHpSeqDone && 
        !boss.state.startsWith("CINEMATIC") && !activeCinematic && boss.state !== "DEFEATED" && 
        boss.state !== "FREE_ROAM" && !boss.state.startsWith("L_CLIMB") && boss.state !== "VOID_SINK_STUN") {
        
        boss.halfHpSeqDone = true;
        boss.halfHpSeqActive = true;
        boss.vx = 0;
        boss.vy = 0;
        boss.invuln = 99999;
        boss.superQueue = [
            { s: "SA2_WINDUP", t: 30 },
            { s: "SA2_DOUBLE", t: 30 },
            { s: "SA2_SA3_COMBO", t: 30 },
            { s: "SA2_DOUBLE", t: 30 },
            { s: "SA2_TRIPLE", t: 30 },
            { s: "SA2_TRIPLE_SA3_COMBO", t: 35 },
            { s: "SA1_WINDUP", t: 1 }
        ];
        boss.state = "EXECUTE_QUEUE";
        boss.stateTimer = 1;
        boss.color = "#ffffff";
        boss.saLines = null;
        for (let p of players) p.saHit = false;
        playSound('demonRoar');
        triggerShake(18, 28);
    }

    // Прорыв Бездны и черная жижа при <= 33% HP в 3 фазе (режим L)
    if (secretMode && boss.phase === 3 && boss.hp <= phase3Hp * 0.33 && !boss.gooSeqTriggered && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED" && boss.state !== "FREE_ROAM" && boss.state !== "VOID_SINK_STUN") {
        boss.gooSeqTriggered = true;
        boss.state = "HIDDEN_PAUSE";
        boss.stateTimer = 240; // 4 секунды отдышаться
        boss.x = -99999;
        boss.y = -99999;
        boss.vx = 0;
        boss.vy = 0;
        gooCinematicTimer = 240;
        playSound('demonRoar');
        triggerShake(12, 16);
        battleAnnouncements.push({ text: "«БЕЗДНА ПРОРЫВАЕТСЯ!»", color: "#cc00ff", timer: 140 });
    }

    // Оглушение в луже пустоты при <= 25% HP в 3 фазе (режим L)
    if (secretMode && boss.phase === 3 && boss.hp <= phase3Hp * 0.25 && !boss.lightStunDone && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED" && boss.state !== "FREE_ROAM" && boss.state !== "VOID_SINK_STUN") {
        boss.lightStunDone = true;
        boss.state = "VOID_SINK_STUN";
        boss.stateTimer = 120; // 2 секунды
        boss.vx = 0;
        boss.vy = 0;
        boss.x = Math.max(80, Math.min(ARENA_W - 120, boss.x));
        boss.y = FLOOR - boss.height;
        boss.color = "#330055";
        boss.saLines = null;
        playSound('wind');
        triggerShake(5, 10);
    }

    let phaseMultiplier = boss.phase === 1 ? 1 : (boss.phase === 2 ? 0.8 : 0.6);
    let nearestP = getNearestPlayer(boss.x); 
    boss.facingRight = boss.x < nearestP.x; 
    let prevState = boss.state;
    let onGround = boss.y + boss.height >= FLOOR;

    if (boss.state === "L_INTRO_FALL") {
        if (boss.stateTimer <= 0) { 
            boss.state = "L_INTRO_RISE"; 
            boss.stateTimer = 45; 
            boss.x = ARENA_W/2; 
            boss.y = FLOOR + 100; 
            playSound('wind'); 
        }
    } else if (boss.state === "L_INTRO_RISE") {
        boss.vy = - (boss.y - (FLOOR - boss.height)) * 0.1;
        if (boss.stateTimer <= 0) { 
            boss.state = "L_SCREAM"; 
            boss.color = "#aaaaaa"; 
            boss.stateTimer = 120; 
            boss.vy = 0; 
        }
    } else if (boss.state === "L_PHASE3_RISE") {
        boss.vy = - (boss.y - (FLOOR - boss.height - 30)) * 0.1;
        if (boss.stateTimer <= 0) { 
            boss.state = "L_SCREAM"; 
            boss.color = "#aaaaaa"; 
            boss.stateTimer = 120; 
            boss.vy = 0; 
        }
    } else if (boss.state === "L_SCREAM") {
        if (boss.stateTimer % 15 === 0) { 
            screamRings.push({ x: boss.x + 15, y: boss.y + 25, r: 10, maxR: 1200 }); 
            triggerShake(5, 10); 
        }
        if (boss.stateTimer <= 0) { 
            boss.state = "IDLE"; 
            boss.stateTimer = 30; 
            let bgm = document.getElementById("lModeMusic"); 
            if (bgm) { 
                bgm.volume = 0.5; 
                bgm.play().catch(e => console.log(e)); 
            }
        }
    } else if (boss.state === "CINEMATIC_TIE_WAIT") {
        boss.color = "white"; boss.vx = 0; boss.vy = 0;
        if (boss.stateTimer <= 0) { 
            boss.state = "CINEMATIC_FAIL"; 
            boss.color = "red"; 
            boss.stateTimer = 45; 
            playSound('slash'); 
        } else { 
            let livingHumans = players.filter(p => !p.isAi && !p.isDowned && p.hp > 0);
            let allPressed = (livingHumans.length > 0)
                ? livingHumans.every(p => p.hasPressedTie)
                : players.every(p => p.hasPressedTie || p.isDowned || p.hp <= 0);
            if (allPressed) { 
                boss.state = "CINEMATIC_TYING"; 
                boss.color = "white"; 
                boss.stateTimer = 90; 
                playSound('wind'); 
                for (let pl of players) {
                    if (pl.isAi && !pl.isDowned && pl.hp > 0) pl.hasPressedTie = true;
                }
            } 
        }
    } else if (boss.state === "CINEMATIC_FAIL") {
        if (boss.stateTimer <= 0) { 
            boss.hp = numPlayers === 1 ? 5 : 10; 
            boss.invuln = 60; 
            boss.state = "IDLE"; 
            boss.color = "#e6c800"; 
            boss.stateTimer = 30; 
            for (let p of players) p.hasPressedTie = false; 
        }
    } else if (boss.state === "CINEMATIC_TYING") {
        if (boss.stateTimer <= 0) { 
            boss.state = "CINEMATIC_BREAK"; 
            boss.color = "white"; 
            boss.stateTimer = 40; 
            playSound('slash'); 
        }
    } else if (boss.state === "CINEMATIC_BREAK") { 
        if (boss.stateTimer <= 0) { 
            boss.state = "FREE_ROAM"; 
            boss.color = "#e6c800"; 
        }
    } else if (boss.state === "TIED" || boss.state === "TIED_BLEED") {
        boss.vx = 0;
        if (boss.tiedFromWaterRope) {
            // Вода с тросом: каждую секунду связывания (60 кадров): 1.25 урона и +1 очко шкалы хила
            if (boss.stateTimer % 60 === 0 && boss.stateTimer > 0) {
                let pSource = boss.tiedDamageHero;
                tryDamageBoss(1.25, pSource);
                playSound('hitBoss');
                triggerShake(4, 8);
                let isLimited = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal);
                let reqHits = (typeof getHitsPerHeal === 'function') ? getHitsPerHeal() : 8;
                if (isLimited) {
                    sharedHealPoints = Math.min(MAX_HEAL_POINTS, sharedHealPoints + 1);
                    sharedHitCount = sharedHealPoints % reqHits;
                    sharedHeals = Math.floor(sharedHealPoints / reqHits);
                } else {
                    sharedHitCount++;
                    if (sharedHitCount >= reqHits) {
                        sharedHitCount -= reqHits;
                        sharedHeals = Math.min(maxSharedHeals, sharedHeals + 1);
                    }
                }
                voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 15, isWhite: false, isOrange: false, r: 35 });
            }
        } else if (boss.state === "TIED_BLEED" && boss.stateTimer % 30 === 0) { 
            let dmg = 0.5; 
            boss.hp -= dmg; 
            playSound('hitBoss'); 
            checkPhaseTransition(); 
        }
        if (boss.stateTimer <= 0) { 
            boss.state = "IDLE"; 
            boss.color = "#e6c800"; 
            boss.tiedFromWaterRope = false;
        }
    } else if (boss.state === "EXECUTE_QUEUE") {
        if (boss.halfHpSeqActive) {
            boss.invuln = 99999;
            boss.vx = 0;
            boss.vy = 0;
            boss.x = -99999;
            boss.y = -99999;
        }
        if (boss.stateTimer <= 0) {
            if (boss.superQueue && boss.superQueue.length > 0) { 
                let n = boss.superQueue.shift(); 
                boss.state = n.s; 
                boss.stateTimer = n.t; 
            } else { 
                boss.halfHpSeqActive = false;
                boss.invuln = 0;
                let targetP = getNearestPlayer(boss.x);
                let spawnX = targetP ? targetP.x + (Math.random() < 0.5 ? -120 : 120) : (boss.climbCenterX || ARENA_W/2);
                boss.x = Math.max(60, Math.min(ARENA_W - 80, spawnX));
                boss.y = FLOOR - boss.height;
                boss.vx = 0;
                boss.vy = 0;
                if (boss.phase === 2.5) { 
                    boss.phase = 3; 
                    boss.damageBonus = 0.5; 
                    boss.state = "L_PHASE3_RISE"; 
                    boss.stateTimer = 45; 
                    boss.y = FLOOR + 100; 
                    boss.x = ARENA_W/2; 
                    playSound('wind'); 
                } else if (boss.phase === 3.5) { 
                    boss.phase = 3; 
                    boss.state = "IDLE"; 
                    boss.color = "#e6c800"; 
                    boss.stateTimer = 30;
                } else { 
                    boss.state = "IDLE"; 
                    boss.color = "#e6c800"; 
                    boss.stateTimer = 30; 
                }
            }
        }
    } else if (boss.state === "SA1_WINDUP") {
        if (boss.halfHpSeqActive) {
            boss.invuln = 99999;
            boss.vx = 0;
            boss.vy = 0;
            boss.x = -99999;
            boss.y = -99999;
        }
        if (boss.stateTimer <= 0) { 
            boss.sa1Arr = []; 
            let count = 7; 
            let realIdx = Math.floor(Math.random() * count);
            
            // Распределение фантомов ПО ВСЕМУ ПОЛЮ СЛУЧАЙНО (без привязки к игроку):
            let cX = boss.climbCenterX || (ARENA_W / 2);
            let minX = secretMode ? Math.max(60, cX - 580) : 60;
            let maxX = secretMode ? Math.min(ARENA_W - 60, cX + 580) : ARENA_W - 60;
            let minY = secretMode ? FLOOR - 290 : 60;
            let maxY = secretMode ? FLOOR - 30 : FLOOR - 50;

            for (let i = 0; i < count; i++) { 
                let phX = minX + Math.random() * (maxX - minX);
                let phY = minY + Math.random() * (maxY - minY);
                boss.sa1Arr.push({ 
                    x: phX, 
                    y: phY, 
                    isReal: (i === realIdx), 
                    timer: 0, 
                    startDelay: i * 22, // Последовательно по очереди!
                    active: true, 
                    struck: false,
                    w: 630, // Оригинальный размер оранжевой зоны (кадр уязвимости)
                    h: 200
                }); 
            }
            boss.state = "SA1_ACTIVE"; 
            boss.stateTimer = 220; 
            boss.color = "#ff8800";
        }
    } else if (boss.state === "SA1_ACTIVE") {
        if (boss.halfHpSeqActive) {
            boss.invuln = 99999;
            boss.vx = 0;
            boss.vy = 0;
            boss.x = -99999;
            boss.y = -99999;
        }
        let allDone = true;
        if (boss.sa1Arr) {
            for (let ph of boss.sa1Arr) {
                if (!ph.active) continue; 
                ph.timer++;
                if (ph.timer > ph.startDelay) {
                    allDone = false;
                    if (ph.timer === ph.startDelay + 40 && !ph.struck) {
                        ph.struck = true; 
                        playSound('slash');
                        applyPhysicsPushToLeaves(ph.x, ph.y, 10);
                        // Оригинальная зона поражения (кадр уязвимости 630x200):
                        let hitArea = { x: ph.x - 300, y: ph.y - 150, width: ph.w, height: ph.h };
                        for (let p of players) { 
                            if (!p.isDowned && p.hp > 0 && p.invuln <= 0 && rectIntersect(p, hitArea)) { 
                                if (boss.halfHpSeqActive && secretMode && boss.phase === 3) {
                                    // В цепочке 3 фазы L-режима фантомы наносят урон, но не прерывают SA1: все 7 фантомов отрабатывают до конца!
                                    takeDamage(p, 1);
                                    p.invuln = 45;
                                    triggerShake(16, 18);
                                    triggerVibration('sa_hit');
                                    playSound('slash');
                                } else {
                                    triggerCinematic("SA1", p, true); 
                                    boss.sa1Arr = null; // Очищаем фантомов, чтобы не было повторных ударов
                                    break;
                                }
                            } 
                        }
                    }
                    if (ph && ph.timer > ph.startDelay + 52) ph.active = false;
                }
                if (!boss.sa1Arr) break;
            }
        }
        if ((allDone || boss.stateTimer <= 0) && !activeCinematic) { 
            if (boss.halfHpSeqActive && secretMode && boss.phase === 3) {
                // Разгон в высоту для мега-удара по полу в 3 фазе L-режима!
                boss.state = "SA1_MEGA_RISE";
                boss.stateTimer = 40;
                boss.vx = 0;
                boss.vy = -26;
                boss.x = ARENA_W / 2 - boss.width / 2;
                boss.y = FLOOR - boss.height - 20;
                boss.invuln = 99999;
                boss.sa1Arr = null;
                boss.saLines = null;
                for (let p of players) p.saHit = false;
                playSound('wind');
                playSound('demonRoar');
                triggerShake(8, 12);
                return;
            }

            boss.halfHpSeqActive = false; 
            boss.invuln = 0;
            let cX = boss.climbCenterX || (ARENA_W / 2);
            boss.x = Math.max(60, Math.min(ARENA_W - 80, cX + (Math.random() - 0.5) * 450));
            boss.y = FLOOR - boss.height;
            boss.vx = 0;
            boss.vy = 0;
            boss.state = "IDLE"; 
            boss.color = "#e6c800"; 
            boss.stateTimer = 30; 
            boss.saLines = null;
            boss.sa1Arr = null;
            for (let p of players) {
                p.saHit = false;
                p.invuln = 60;
            }
            applyPhysicsPushToLeaves(boss.x + 15, boss.y + 25, 15);
            playSound('wind');
        }
    } else if (boss.state === "SA1_MEGA_RISE") {
        boss.vx = 0;
        boss.y += boss.vy;
        boss.vy = Math.min(-4, boss.vy + 0.6);
        if (boss.stateTimer <= 0 || boss.y < -150) {
            boss.state = "SA1_MEGA_SLAM";
            boss.x = ARENA_W / 2 - boss.width / 2;
            boss.y = -200;
            boss.vy = 42;
            boss.color = "#ff0055";
            playSound('demonRoar');
            playSound('slash');
        }
    } else if (boss.state === "SA1_MEGA_SLAM") {
        boss.vy = 42;
        boss.y += boss.vy;
        if (boss.y + boss.height >= FLOOR) {
            boss.y = FLOOR - boss.height;
            boss.vy = 0;
            boss.halfHpSeqActive = false;
            boss.invuln = 0;
            boss.state = "IDLE";
            boss.color = "#e6c800";
            boss.stateTimer = 45;

            // Максимальное сотрясение экрана и вибрация джойстиков
            triggerShake(45, 40, 0, 1);
            triggerVibration('l_mode_final');
            playSound('rockCrit');
            playSound('demonRoar');
            playSound('slash');

            // 1. По полу появляются трещины
            if (floorCracks.length === 0) {
                let startXs = [320, 640, 960, 1300, 1650, 2020];
                startXs.forEach(sx => {
                    let cx = sx + (Math.random() - 0.5) * 60;
                    let cy = FLOOR;
                    let crackPts = [];
                    for (let step = 0; step < 7; step++) {
                        cx += (Math.random() - 0.5) * 45;
                        cy += 8 + Math.random() * 12;
                        crackPts.push({ x: cx, y: cy });
                    }
                    floorCracks.push({
                        x1: sx,
                        y1: FLOOR,
                        x2: cx,
                        y2: cy,
                        pts: crackPts,
                        width: 3
                    });
                });
            }

            // 2. Шариков пустоты становится больше (хуже видимость)
            ambientVoidOrbsMultiplier = 3.5;

            // 3. С потолка падают черные капельки
            for (let i = 0; i < 28; i++) {
                voidCeilingDrips.push({
                    x: Math.random() * ARENA_W,
                    y: -100 - Math.random() * 200,
                    vy: 7 + Math.random() * 5,
                    length: 8 + Math.random() * 12,
                    r: 3 + Math.random() * 3
                });
            }

            // 4. Фиолетовые лужи на полу, которые медленно расплываются
            if (voidPuddles.length === 0) {
                voidPuddles.push(
                    { x: ARENA_W / 2 - 380, y: FLOOR, r: 25, maxR: 95, spreadSpeed: 0.08, timer: 720 },
                    { x: ARENA_W / 2 + 380, y: FLOOR, r: 25, maxR: 95, spreadSpeed: 0.08, timer: 720 }
                );
            }

            // 5. Камнепад: падают огромные валуны (2.5 урона, не забирают хил)
            fallingBoulders = [
                { x: ARENA_W / 2 - 330, y: -250, vy: 0, w: 76, h: 52, delay: 48, imgIdx: 0 },
                { x: ARENA_W / 2 + 330, y: -250, vy: 0, w: 76, h: 52, delay: 56, imgIdx: 1 },
                { x: ARENA_W / 2,       y: -250, vy: 0, w: 84, h: 58, delay: 68, imgIdx: 2 }
            ];

            // Ударная волна по стоящим рядом на полу
            for (let p of players) {
                if (!p.isDowned && p.hp > 0 && Math.abs(p.x - boss.x) < 170 && p.y >= FLOOR - 50 && p.invuln <= 0) {
                    takeDamage(p, 2);
                }
                p.invuln = 60;
            }
        }
    } else if (boss.state === "SA1_SLAM_WINDUP") {
        boss.vx = 0; boss.vy = 0; boss.y = FLOOR - 220;
        if (boss.stateTimer <= 0) { boss.state = "SA1_SLAM"; boss.vy = 35; }
    } else if (boss.state === "SA1_SLAM") {
        boss.vy = 35; 
        boss.y += boss.vy;
        if (boss.y + boss.height >= FLOOR) {
            boss.y = FLOOR - boss.height; 
            boss.vy = 0;
            triggerShake(30, 20, 0, 1); 
            triggerVibration('sa1_land');
            for (let p of players) {
                if (Math.abs((p.x + p.width/2) - (boss.x + boss.width/2)) < 100) {
                    let slamDmg = secretMode ? 2 : 1.5;
                    if (boss.lightInfected > 0) slamDmg = Math.max(0.5, slamDmg - (boss.lightInfectedDmgRed || 0.5));
                    takeDamage(p, slamDmg);
                }
            }
            boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 30;
        }
    } else if (boss.state === "VOID_SINK_STUN") {
        boss.vx = 0; boss.vy = 0;
        boss.y = FLOOR - boss.height + 20;
        if (boss.stateTimer % 6 === 0) {
            voidExplosions.push({
                x: boss.x + boss.width/2 + (Math.random() - 0.5) * 50,
                y: FLOOR - 5 + (Math.random() - 0.5) * 10,
                timer: 20,
                isWhite: false,
                r: 25
            });
        }
        if (boss.stateTimer <= 0) {
            boss.y = FLOOR - boss.height;
            boss.state = "IDLE";
            boss.color = "#e6c800";
            boss.stateTimer = 30;
        }
    } else if (boss.state === "SA2_WINDUP" || boss.state === "SA3_WINDUP") {
        if (boss.halfHpSeqActive) {
            boss.vx = 0; boss.vy = 0; boss.invuln = 99999;
            boss.x = -99999; boss.y = -99999;
        }
        if (!boss.saLines) {
            boss.saLines = [ createRandomSaLine(boss.state === "SA3_WINDUP" ? "SA3" : "SA2") ];
        }
        if (boss.stateTimer <= 0) { boss.state = "SA_EXECUTE"; boss.stateTimer = 6; }
    } else if (boss.state === "SA2_DOUBLE") {
        if (boss.halfHpSeqActive) {
            boss.vx = 0; boss.vy = 0; boss.invuln = 99999;
            boss.x = -99999; boss.y = -99999;
        }
        if (!boss.saLines) {
            boss.saLines = [ createRandomSaLine("SA2"), createRandomSaLine("SA2") ]; 
        }
        if (boss.stateTimer <= 0) { boss.state = "SA_EXECUTE"; boss.stateTimer = 6; }
    } else if (boss.state === "SA2_TRIPLE") {
        if (boss.halfHpSeqActive) {
            boss.vx = 0; boss.vy = 0; boss.invuln = 99999;
            boss.x = -99999; boss.y = -99999;
        }
        if (!boss.saLines) {
            boss.saLines = [ createRandomSaLine("SA2"), createRandomSaLine("SA2"), createRandomSaLine("SA2") ]; 
        }
        if (boss.stateTimer <= 0) { boss.state = "SA_EXECUTE"; boss.stateTimer = 6; }
    } else if (boss.state === "SA2_SA3_COMBO") {
        if (boss.halfHpSeqActive) {
            boss.vx = 0; boss.vy = 0; boss.invuln = 99999;
            boss.x = -99999; boss.y = -99999;
        }
        if (!boss.saLines) {
            boss.saLines = [ createRandomSaLine("SA2"), createRandomSaLine("SA3") ]; 
            boss.color = "#d000ff";
            playSound('slash');
        }
        if (boss.stateTimer <= 0) { boss.state = "SA_EXECUTE"; boss.stateTimer = 6; }
    } else if (boss.state === "SA2_TRIPLE_SA3_COMBO") {
        if (boss.halfHpSeqActive) {
            boss.vx = 0; boss.vy = 0; boss.invuln = 99999;
            boss.x = -99999; boss.y = -99999;
        }
        if (!boss.saLines) {
            boss.saLines = [ createRandomSaLine("SA2"), createRandomSaLine("SA2"), createRandomSaLine("SA2"), createRandomSaLine("SA3") ]; 
            boss.color = "#d000ff";
            playSound('demonRoar');
        }
        if (boss.stateTimer <= 0) { boss.state = "SA_EXECUTE"; boss.stateTimer = 6; }
    } else if (boss.state === "SA_EXECUTE") {
        if (boss.halfHpSeqActive) {
            boss.vx = 0; boss.vy = 0; boss.invuln = 99999;
            boss.x = -99999; boss.y = -99999;
        }
        if (boss.stateTimer > 0) {
            let progress = 1 - (boss.stateTimer / 6);
            for (let l of boss.saLines) {
                let curX2 = l.x1 + (l.x2 - l.x1) * progress; 
                let curY2 = l.y1 + (l.y2 - l.y1) * progress; 
                let curLine = { x1: l.x1, y1: l.y1, x2: curX2, y2: curY2 };
                for (let p of players) {
                    if (!p.isDowned && !p.saHit && p.invuln <= 0 && distToSegment(p, curLine) < 40 + p.width/2) {
                        let lineAngle = Math.atan2(l.y2 - l.y1, l.x2 - l.x1);
                        triggerCinematic(l.type, p, true, lineAngle); 
                        p.saHit = true; 
                        boss.saLines = null; // Очищаем луч сразу
                        let dx_n = l.x2 - l.x1; 
                        let dy_n = l.y2 - l.y1; 
                        let dLen = Math.hypot(dx_n, dy_n);
                        triggerShake(10, 15, dx_n / dLen, dy_n / dLen);
                        break;
                    }
                }
                if (!boss.saLines) break;
            }
        } else { 
            boss.state = "EXECUTE_QUEUE"; 
            boss.stateTimer = 30; 
            for (let p of players) p.saHit = false; 
            boss.saLines = null; 
        }
    } else if (boss.state === "SHARPEN_WINDUP") { 
        boss.vx = 0; boss.y = FLOOR - 150; 
        if (boss.stateTimer <= 0) { 
            boss.state = "IDLE"; boss.color = "#e6c800"; 
            boss.phase = 2; boss.damageBonus = secretMode ? 0.5 : 0; 
        } 
    } else if (boss.state === "VOID_PORTALS") {
        if (boss.stateTimer === 89) {
            let numPortals = boss.phase >= 3 ? 5 : (boss.phase === 2 ? 4 : 3);
            for (let i = 0; i < numPortals; i++) { 
                voidPortals.push({ 
                    x: Math.random() * (ARENA_W - 100) + 50, 
                    y: Math.random() * (FLOOR - 150) + 50, 
                    timer: 24 + i * 9, 
                    type: Math.random() < 0.5 ? "TIE" : "SHURIKEN" 
                }); 
            }
        }
        boss.vx = 0;
        if (boss.stateTimer <= 0) { 
            if (boss.superQueue && boss.superQueue.length > 0) { 
                boss.state = "EXECUTE_QUEUE"; boss.stateTimer = 1; 
            } else { 
                boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 30; 
            }
        }
    } else if (boss.state === "PLACE_LOOM") {
        if (boss.stateTimer <= 0) { 
            looms.push({ x: boss.x + 15, y: FLOOR, timer: 600 }); 
            boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 20; 
        }
    } else if (boss.state === "L_HEAL") {
        boss.vx = 0;
        boss.vy = 0;
        boss.color = "#4a0072";
        if (boss.stateTimer === 120) {
            playSound('demonRoar');
            triggerShake(6, 10);
            boss.healOrbs = [];
        }

        // Круговорот черных шариков пустоты, летящих прямо в босса:
        if (boss.stateTimer % 3 === 0) {
            let spawnAngle = Math.random() * Math.PI * 2;
            let spawnR = 150 + Math.random() * 90;
            boss.healOrbs.push({
                angle: spawnAngle,
                dist: spawnR,
                speed: 3.5 + Math.random() * 2,
                rotSpeed: (Math.random() < 0.5 ? 1 : -1) * (0.09 + Math.random() * 0.05),
                r: 7 + Math.random() * 7
            });
        }

        for (let i = boss.healOrbs.length - 1; i >= 0; i--) {
            let o = boss.healOrbs[i];
            o.dist -= o.speed;
            o.angle += o.rotSpeed;
            if (o.dist <= 15) {
                boss.healOrbs.splice(i, 1);
                voidExplosions.push({
                    x: boss.x + boss.width / 2 + (Math.random() - 0.5) * 20,
                    y: boss.y + boss.height / 2 + (Math.random() - 0.5) * 20,
                    timer: 10,
                    isWhite: false,
                    r: 15
                });
            }
        }

        // Восстанавливает 3 ХП за 2 секунды (каждые 40 кадров по +1 ХП):
        if (boss.stateTimer === 80 || boss.stateTimer === 40 || boss.stateTimer === 1) {
            boss.hp = Math.min(phase3Hp, boss.hp + 1);
            playSound('heal');
            triggerShake(3, 6);
        }

        if (boss.stateTimer <= 0) {
            boss.state = "IDLE";
            boss.color = "#e6c800";
            boss.stateTimer = 25;
            boss.healCooldown = 360; // 6 сек кулдаун
            boss.healOrbs = [];
        }
    } else {
        switch(boss.state) {
            case "IDLE":
                if (boss.phase === 4) {
                    if (boss.lPhase4Orbs && !boss.lPhase4Orbs.some(o => o.alive)) {
                        boss.state = "L_PHASE4_STUNNED";
                    } else {
                        boss.state = "L_PHASE4_ORBS";
                    }
                    break;
                }
                boss.vx = 0; boss.comboCount = 0;
                let isFast = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.bossSpeed);
                if (boss.stateTimer <= 0) { 
                    if (Math.random() < 0.25) { 
                        boss.state = "WALK"; 
                        boss.stateTimer = (isFast ? 30 : 60) + Math.random() * (isFast ? 30 : 60); 
                    } else { 
                        boss.state = "CHASE"; 
                        boss.stateTimer = ((isFast ? 20 : 30) + Math.random() * (isFast ? 25 : 40)) * phaseMultiplier; 
                    } 
                }
                break;
            case "WALK": 
                let isFastWalk = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.bossSpeed);
                if (boss.stateTimer % 30 === 0) boss.vx = (Math.random() < 0.5 ? -1 : 1) * (boss.speed * (isFastWalk ? 1.0 : 0.8)); 
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = isFastWalk ? 10 : 15; boss.vx = 0; }
                break;
            case "CHASE":
                let currentBossSpeed = boss.speed;
                if (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.bossSpeed) currentBossSpeed *= 1.25;
                if (boss.lightInfected > 0) currentBossSpeed /= 1.5;
                if (secretMode && nearestP.purpleHp > 2) currentBossSpeed *= 1.25;

                let distToP = Math.abs(boss.x - nearestP.x);
                let pDir = boss.x < nearestP.x ? 1 : -1;

                // Tactical duel spacing: ideal distance is 120-175 px (no hugging/pushing!)
                if (distToP < 95) {
                    // Too close: swift tactical retreat backstep
                    boss.vx = -pDir * (currentBossSpeed * 1.05);
                } else if (distToP <= 175) {
                    // Ideal spacing: agile feinting, circling, and micro-hops
                    boss.vx = Math.sin(Date.now() / 160) * (currentBossSpeed * 0.45);
                } else {
                    // Close the gap dynamically
                    boss.vx = pDir * currentBossSpeed;
                }

                // Boss jumps up if player is on a platform or higher
                let isBossGrounded = (boss.y + boss.height >= FLOOR);
                for (let plat of platforms) {
                    if (Math.abs((boss.y + boss.height) - plat.y) < 6 && boss.x + boss.width > plat.x && boss.x < plat.x + plat.w) {
                        isBossGrounded = true;
                        break;
                    }
                }
                if (nearestP.y < boss.y - 50 && isBossGrounded && Math.random() < 0.04 && boss.vy === 0) {
                    boss.vy = -14;
                    playSound('wind');
                    applyPhysicsPushToLeaves(boss.x + 15, boss.y + 50, 10);
                }
                
                let playerRunningAway = (Math.abs(nearestP.vx) > 3 && Math.sign(nearestP.vx) !== Math.sign(boss.x - nearestP.x));

                if (Math.abs(boss.x - nearestP.x) > 220 && Math.random() < 0.4) { 
                    if (Math.random() < 0.6) {
                        boss.state = "SILK_RUN";
                        boss.stateTimer = 20;
                        boss.silkRunDir = boss.x < nearestP.x ? 1 : -1;
                        boss.hitDuringSilkRun = false;
                        playSound('dash');
                    } else if (boss.phase >= 2) {
                        boss.state = "TELEPORT_OUT"; boss.stateTimer = 10; playSound('wind'); 
                    }
                } else if (playerRunningAway && Math.random() < 0.3) { 
                    boss.state = "SILK_RUN";
                    boss.stateTimer = 20;
                    boss.silkRunDir = boss.x < nearestP.x ? 1 : -1;
                    boss.hitDuringSilkRun = false;
                    playSound('dash');
                } else if (boss.stateTimer <= 0) {
                    boss.attackCount = (boss.attackCount || 0) + 1;
                    let rand = Math.random(); 
                    let teleChance = numPlayers === 2 ? 0.35 : 0.25; 
                    
                    if (secretMode) {
                        if (boss.phase === 3) {
                            if (boss.hp <= phase3Hp * 0.75 && (!boss.healCooldown || boss.healCooldown <= 0) && Math.random() < 0.28) {
                                boss.state = "L_HEAL";
                                boss.stateTimer = 120;
                                boss.vx = 0;
                                boss.vy = 0;
                                boss.color = "#4a0072";
                            }
                            else if (rand < 0.28) { boss.state = "VOID_PORTALS"; boss.stateTimer = 90; boss.color = "#9900ff"; }
                            else if (rand < 0.50) {
                                // Super attacks in Phase 3
                                let saRoll = Math.random();
                                if (saRoll < 0.33) {
                                    boss.state = "SA1_WINDUP"; boss.stateTimer = 1; boss.color = "#ff8800";
                                } else if (saRoll < 0.66) {
                                    let sa2Var = Math.random();
                                    if (sa2Var < 0.34) { boss.state = "SA2_WINDUP"; boss.stateTimer = 24; }
                                    else if (sa2Var < 0.67) { boss.state = "SA2_DOUBLE"; boss.stateTimer = 24; }
                                    else { boss.state = "SA2_TRIPLE"; boss.stateTimer = 24; }
                                    boss.color = "#ffffff";
                                    playSound('slash');
                                } else {
                                    boss.state = "SA3_WINDUP"; boss.stateTimer = 24;
                                    boss.color = "#9900ff";
                                    playSound('demonRoar');
                                }
                            }
                            else if (rand < 0.62) { boss.state = "TELEPORT_OUT"; boss.stateTimer = 15; playSound('wind'); }
                            else if (rand < 0.72) { boss.state = "WIND_LINE_WINDUP"; boss.stateTimer = 60; boss.vx = 0; boss.windLineY = undefined; boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.82) { boss.state = "SILK_RUN"; boss.stateTimer = 20; boss.silkRunDir = boss.x < nearestP.x ? 1 : -1; boss.hitDuringSilkRun = false; playSound('dash'); }
                            else { boss.state = "LUNGE_WINDUP"; boss.stateTimer = 15 * phaseMultiplier; boss.comboCount = 0; boss.attackDir = (Math.random() < 0.3 && boss.y > FLOOR - 50) ? "UP" : (boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"); boss.directAttackActive = true; boss.color = "#ff3333"; }
                        } else if (boss.phase === 2) {
                            if (rand < 0.30) { boss.state = "VOID_PORTALS"; boss.stateTimer = 90; boss.color = "#9900ff"; }
                            else if (onGround && rand < 0.45) { boss.state = "VOID_FLOOR_WARN"; boss.stateTimer = 180; boss.color = "#9900ff"; }
                            else if (globalWindCooldown <= 0 && globalWindMode === "NONE" && rand < 0.60) { boss.state = "CAST_VERTICAL_WIND"; boss.stateTimer = 40; playSound('wind'); boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < teleChance + 0.45) { boss.state = "TELEPORT_OUT"; boss.stateTimer = 15; playSound('wind'); }
                            else if (rand < 0.65) { boss.state = "WIND_FLY"; boss.stateTimer = 15; playSound('wind'); applyPhysicsPushToLeaves(boss.x + 15, boss.y + 50, 10); boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.75) { boss.state = "WIND_LINE_WINDUP"; boss.stateTimer = 60; boss.vx = 0; boss.windLineY = undefined; boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.85) { boss.state = "SILK_RUN"; boss.stateTimer = 20; boss.silkRunDir = boss.x < nearestP.x ? 1 : -1; boss.hitDuringSilkRun = false; playSound('dash'); }
                            else { boss.state = "LUNGE_WINDUP"; boss.stateTimer = 15 * phaseMultiplier; boss.comboCount = 0; boss.attackDir = (Math.random() < 0.3 && boss.y > FLOOR - 50) ? "UP" : (boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"); boss.directAttackActive = true; boss.color = "#ff3333"; }
                        } else {
                            if (rand < 0.22) { boss.state = "WIND_FLY"; boss.stateTimer = 15; playSound('wind'); applyPhysicsPushToLeaves(boss.x + 15, boss.y + 50, 10); boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.42) { boss.state = "WIND_LINE_WINDUP"; boss.stateTimer = 60; boss.vx = 0; boss.windLineY = undefined; boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.58) { boss.state = "SILK_RUN"; boss.stateTimer = 20; boss.silkRunDir = boss.x < nearestP.x ? 1 : -1; boss.hitDuringSilkRun = false; playSound('dash'); }
                            else if (rand < 0.78) { boss.state = "GREAT_LUNGE_WINDUP"; boss.stateTimer = 38 * phaseMultiplier; boss.attackDir = boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"; boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#ff4400"; }
                            else { boss.state = "LUNGE_WINDUP"; boss.stateTimer = 15 * phaseMultiplier; boss.comboCount = 0; boss.attackDir = (Math.random() < 0.3 && boss.y > FLOOR - 50) ? "UP" : (boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"); boss.directAttackActive = true; boss.color = "#ff3333"; }
                        }
                    } else {
                        if (boss.phase >= 2 && globalWindCooldown <= 0 && globalWindMode === "NONE" && rand < 0.15) { boss.state = "CAST_VERTICAL_WIND"; boss.stateTimer = 40; playSound('wind'); boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#00ffff"; }
                        else if (boss.phase >= 2 && rand < teleChance + 0.15) { boss.state = "TELEPORT_OUT"; boss.stateTimer = 15; playSound('wind'); }
                        else if (boss.phase >= 2 && rand < 0.28) { boss.state = "VOID_PORTALS"; boss.stateTimer = 90; boss.color = "#9900ff"; }
                        else if (rand < 0.38) { boss.state = "SCARF_WINDUP"; boss.stateTimer = 20 * phaseMultiplier; boss.attackDir = boss.x < nearestP.x ? 1 : -1; scarf.target = nearestP; boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#ff3333"; } 
                        else if (rand < 0.48) { boss.state = "WIND_FLY"; boss.stateTimer = 15; playSound('wind'); applyPhysicsPushToLeaves(boss.x + 15, boss.y + 50, 10); boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#00ffff"; }
                        else if (rand < 0.58) { boss.state = "WIND_LINE_WINDUP"; boss.stateTimer = 60; boss.vx = 0; boss.windLineY = undefined; boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#00ffff"; }
                        else if (rand < 0.68) { boss.state = "SILK_RUN"; boss.stateTimer = 20; boss.silkRunDir = boss.x < nearestP.x ? 1 : -1; boss.hitDuringSilkRun = false; playSound('dash'); }
                        else if (onGround && rand < 0.76) { boss.state = "VULN_STANCE"; boss.stateTimer = 60 * phaseMultiplier; boss.color = "#ff8800"; }
                        else if (onGround && rand < 0.84) { boss.state = "PARRY_STANCE"; boss.stateTimer = 60; boss.flashTimer = 5; boss.color = "#aaaaaa"; }
                        else if (onGround && rand < 0.92) { boss.state = "GREAT_LUNGE_WINDUP"; boss.stateTimer = 42 * phaseMultiplier; boss.attackDir = boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"; boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#ff4400"; }
                        else { boss.state = "LUNGE_WINDUP"; boss.stateTimer = 15 * phaseMultiplier; boss.comboCount = 0; boss.attackDir = (Math.random() < 0.3 && boss.y > FLOOR - 50) ? "UP" : (boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"); boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#ff3333"; }
                    }
                }

                break;
            case "TELEPORT_OUT": 
                boss.vx = 0; boss.vy = 0; 
                if (boss.stateTimer <= 0) { 
                    let playerRunDir = nearestP.vx !== 0 ? Math.sign(nearestP.vx) : (Math.random() < 0.5 ? -1 : 1);
                    boss.x = nearestP.x + playerRunDir * 150; 
                    if (boss.x < 0) boss.x = 50; 
                    if (boss.x > ARENA_W-30) boss.x = ARENA_W-80; 
                    boss.y = FLOOR - boss.height; 
                    boss.state = "TELEPORT_IN"; 
                    boss.stateTimer = 10; 
                    applyPhysicsPushToLeaves(boss.x + 15, boss.y + 25, 15); 
                    playSound('wind'); 
                } 
                break;
            case "TELEPORT_IN": 
                boss.vx = 0; boss.vy = 0; 
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 10; } 
                break;
            case "SCARF_WINDUP": 
                boss.vx = 0; 
                if (boss.stateTimer <= 0) { boss.state = "SCARF_SHOOT"; scarf.active = true; scarf.width = 0; scarf.dir = boss.attackDir; } 
                break;
            case "SCARF_SHOOT": 
                scarf.width += 45; 
                let sHit = { x: scarf.dir === 1 ? boss.x + 30 : boss.x - scarf.width, y: boss.y + 20, width: scarf.width, height: 10 }; 
                for (let p of players) { 
                    if (!p.isDowned && p.hp > 0 && rectIntersect(p, sHit) && p.invuln <= 0) { 
                        boss.state = "SCARF_PULL"; 
                        p.tied = true; 
                        p.tieClicks = 0; 
                        scarf.target = p; 
                        boss.directAttackHit = true; 
                        boss.missCount = 0; 
                        break; 
                    } 
                } 
                if (scarf.width > ARENA_W) { 
                    boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 15; scarf.active = false; boss.comboCount = 0; 
                } 
                break;
            case "SCARF_PULL": 
                if (scarf.target) { 
                    let pdx = boss.x - scarf.target.x; 
                    scarf.target.x += pdx * 0.15; 
                    scarf.target.y += (boss.y - scarf.target.y) * 0.15; 
                    if (Math.abs(pdx) < 50) { 
                        let wasH = scarf.target.isHealing; 
                        let sDmg = secretMode ? 2 : 0.5;
                        if (boss.lightInfected > 0) sDmg = Math.max(0.5, sDmg - (boss.lightInfectedDmgRed || 0.5));
                        takeDamage(scarf.target, sDmg); 
                        if (wasH) triggerVibration('heal_interrupt'); else triggerVibration('damage'); 
                        triggerShake(3, 10); 
                        scarf.target.tied = false; 
                        scarf.target = null; 
                        boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 20; scarf.active = false; boss.comboCount = 0;
                    } 
                } else { 
                    boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 20; scarf.active = false; boss.comboCount = 0;
                } 
                break;
            case "CAST_VERTICAL_WIND": 
                boss.vx = 0; boss.vy = 0; 
                if (boss.stateTimer === 1) { 
                    globalWindMode = Math.random() < 0.5 ? "UP" : "DOWN"; 
                    globalWindTimer = 300; 
                    playSound('wind'); 
                    boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 20; 
                } 
                break;
            case "FEINT_WINDUP": 
                boss.vx = 0; 
                if (boss.stateTimer <= 0) { boss.state = "FEINT_DASH_FWD"; boss.stateTimer = 8; boss.vx = boss.attackDir * 12; } 
                break;
            case "FEINT_DASH_FWD": 
                if (boss.stateTimer <= 0) { boss.state = "FEINT_DASH_BACK"; boss.stateTimer = 12; boss.vx = -boss.attackDir * 20; applyPhysicsPushToLeaves(boss.x + 15, boss.y + 25, 12); } 
                break;
            case "FEINT_DASH_BACK": 
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 20; boss.vx = 0; } 
                break;
            case "CAST_WIND": 
            case "WIND_LINE_WINDUP":
                boss.vx = 0;
                boss.directAttackActive = true;
                if (boss.windLineY === undefined) {
                    let targetP = getNearestPlayer(boss.x);
                    boss.windLineY = Math.min(FLOOR - 40, Math.max(120, targetP ? targetP.y + 10 : FLOOR - 50));
                    boss.windLineDir = boss.x < ARENA_W / 2 ? 1 : -1;
                }
                // За 1 сек (60 кадров) перед самой атакой: закручивание листьев в зоне удара (вихри на фоне без каких-либо зон!)
                for (let l of arenaLeaves) {
                    if (Math.abs(l.y - boss.windLineY) < 50) {
                        l.angle += 0.45;
                        let t = (60 - boss.stateTimer) * 0.28 + (l.x * 0.05);
                        l.vx = Math.cos(t) * 6;
                        l.vy = Math.sin(t) * 4.5;
                    }
                }
                if (boss.stateTimer <= 0) {
                    boss.state = "WIND_LINE_ACTIVE";
                    boss.stateTimer = 16;
                    playSound('wind');
                    playSound('throw');
                    triggerShake(4, 8);
                    for (let l of arenaLeaves) {
                        if (Math.abs(l.y - boss.windLineY) < 50) {
                            l.vx = boss.windLineDir * 42;
                            l.vy = (Math.random() - 0.5) * 2;
                        }
                    }
                }
                break;
            case "WIND_LINE_ACTIVE":
                boss.vx = 0;
                // Листья быстро несутся в ту сторону, где удар!
                for (let l of arenaLeaves) {
                    if (Math.abs(l.y - boss.windLineY) < 50) {
                        l.vx = boss.windLineDir * 42;
                    }
                }
                let windDmg = secretMode ? 1.5 : 1.0;
                for (let p of players) {
                    if (!p.isDowned && p.hp > 0 && p.invuln <= 0) {
                        if (Math.abs((p.y + p.height/2) - boss.windLineY) < 35) {
                            takeDamage(p, windDmg);
                            p.vx = boss.windLineDir * 12;
                            playSound('wind');
                        }
                    }
                }
                if (boss.stateTimer <= 0) {
                    boss.state = "IDLE";
                    boss.color = "#e6c800";
                    boss.stateTimer = 20;
                    boss.windLineY = undefined;
                }
                break;
            case "SILK_RUN":
                boss.vx = (boss.silkRunDir || 1) * 24;
                boss.silkTrail = boss.silkTrail || [];
                boss.silkTrail.push({
                    x: boss.x,
                    y: boss.y,
                    facingRight: (boss.silkRunDir || 1) > 0,
                    alpha: 0.85
                });
                if (boss.silkTrail.length > 8) boss.silkTrail.shift();

                // Шелковый бег босса используется только для перемещения и не наносит урона (v74)

                if (Math.random() < 0.7 && typeof stepPuffs !== 'undefined') {
                    stepPuffs.push({
                        x: boss.x + boss.width/2,
                        y: boss.y + boss.height/2,
                        vx: -boss.vx * 0.1,
                        vy: 0,
                        r: 18,
                        alpha: 0.5,
                        color: secretMode ? "rgba(180, 80, 255, 0.5)" : "rgba(255, 235, 120, 0.5)"
                    });
                }
                if (boss.stateTimer <= 0) {
                    boss.state = "IDLE";
                    boss.color = "#e6c800";
                    boss.stateTimer = 15;
                    boss.vx = 0;
                }
                break;
            case "WIND_FLY": 
                boss.vy = -14; 
                if (boss.y <= 100 || boss.stateTimer <= 0) { 
                    if (boss.phase >= 2 && !secretMode) { 
                        airBlades.push({ x: boss.x - 15, y: boss.y + 15, vx: 0, vy: 0, state: "HOVER", timer: 30, deflected: 0 }); 
                        airBlades.push({ x: boss.x + 15, y: boss.y - 10, vx: 0, vy: 0, state: "HOVER", timer: 30, deflected: 0 }); 
                        airBlades.push({ x: boss.x + 45, y: boss.y + 15, vx: 0, vy: 0, state: "HOVER", timer: 30, deflected: 0 }); 
                    } 
                    if (secretMode && boss.phase === 3) {
                        boss.state = "SA1_WINDUP";
                        boss.stateTimer = 1;
                        boss.color = "#ff8800";
                    } else {
                        boss.state = Math.random() < 0.5 ? "VULN_STANCE" : "PARRY_STANCE"; 
                        boss.color = boss.state === "VULN_STANCE" ? "#ff8800" : "#aaaaaa"; 
                        if (boss.state === "VULN_STANCE") boss.stateTimer = 60 * phaseMultiplier; else boss.stateTimer = 60;
                    }
                } 
                break;
            case "GREAT_LUNGE_WINDUP":
                boss.vx = 0;
                if (boss.stateTimer % 6 === 0 && typeof stepPuffs !== 'undefined') {
                    let pDir = boss.attackDir === "HORIZONTAL_R" ? -1 : 1;
                    stepPuffs.push({
                        x: boss.x + boss.width/2 + pDir * 12,
                        y: boss.y + boss.height - 2,
                        vx: pDir * (1.2 + Math.random() * 0.8),
                        vy: -(0.5 + Math.random() * 0.4),
                        r: 3.5 + Math.random() * 2,
                        alpha: 0.7
                    });
                }
                if (boss.stateTimer <= 0) {
                    boss.state = "GREAT_LUNGE_ACTIVE";
                    boss.stateTimer = 16;
                    boss.vx = boss.attackDir === "HORIZONTAL_R" ? 32 : -32;
                    playSound('dash');
                    playSound('bladeSpin');
                    triggerShake(5, 12);
                    applyPhysicsPushToLeaves(boss.x + 15, boss.y + 25, 25);
                }
                break;
            case "GREAT_LUNGE_ACTIVE":
                if (boss.stateTimer <= 0) {
                    boss.state = "IDLE";
                    boss.color = "#ffd700";
                    boss.stateTimer = 20;
                    boss.vx = 0;
                }
                break;
            case "LUNGE_WINDUP": 
                boss.vx = 0; 
                if (boss.stateTimer <= 0) { 
                    boss.state = "LUNGE"; 
                    boss.stateTimer = 10; 
                    if (boss.attackDir === "UP") { 
                        boss.vy = -20; boss.vx = 0; applyPhysicsPushToLeaves(boss.x + 15, boss.y, 10); 
                    } else { 
                        boss.vx = boss.attackDir === "HORIZONTAL_R" ? 25 : -25; 
                    } 
                } 
                break;
            case "LUNGE": 
                if (boss.stateTimer <= 0) { 
                    if (boss.comboCount === 0 && Math.random() < 0.85) { 
                        boss.comboCount = 1; boss.state = "LUNGE_WINDUP"; boss.color = "#ff3333"; boss.stateTimer = 10; boss.attackDir = boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"; 
                    } else if (boss.comboCount === 1) { 
                        let r = Math.random(); 
                        if (r < 0.25) { 
                            boss.comboCount = 2; boss.state = "LUNGE_WINDUP"; boss.color = "#ff3333"; boss.stateTimer = 10; boss.attackDir = boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"; 
                        } else if (r < 0.50) { 
                            boss.comboCount = 0; 
                            if (!secretMode) { 
                                boss.state = "SCARF_WINDUP"; boss.color = "#ff3333"; boss.stateTimer = 15; boss.attackDir = boss.x < nearestP.x ? 1 : -1; scarf.target = nearestP; 
                            } else { 
                                boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 15; boss.vx = 0; 
                            }
                        } else { 
                            boss.comboCount = 0; boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 15; boss.vx = 0; 
                        } 
                    } else { 
                        boss.comboCount = 0; boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 15; boss.vx = 0; 
                    } 
                } 
                break;
            case "VULN_STANCE": 
                if (secretMode && boss.phase === 3) {
                    boss.state = "SA1_WINDUP"; 
                    boss.stateTimer = 1; 
                    boss.color = "#ff8800";
                    break;
                }
                boss.vx = 0; 
                if (boss.stateTimer <= 0) { boss.state = "VULN_LATE"; boss.stateTimer = 15 * phaseMultiplier; } 
                break;
            case "VULN_LATE": 
                boss.vx = 0; 
                if (boss.stateTimer <= 0) { boss.state = "AOE"; boss.stateTimer = 15; applyPhysicsPushToLeaves(boss.x + 15, boss.y + 25, 25); } 
                break;
            case "AOE": 
                let aoeBox = { x: boss.x - 400, y: boss.y - 150, width: 800, height: 200 }; 
                for (let p of players) { 
                    if (!p.isDowned && p.hp > 0 && rectIntersect(p, aoeBox) && p.invuln <= 0) { 
                        let wasH = p.isHealing; 
                        let dmg = 2.5; 
                        if (boss.damageBonus > 0 || secretMode) { dmg = 3; applyBleed(p); }
                        if (boss.lightInfected > 0) { dmg = Math.max(0.5, dmg - (boss.lightInfectedDmgRed || 0.5)); }
                        takeDamage(p, dmg); 
                        if (wasH) triggerVibration('heal_interrupt'); else triggerVibration('damage'); 
                        triggerShake(3, 10); freezeFrames = 6; 
                    } 
                } 
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 30; } 
                break;
            case "PARRY_STANCE": 
                if (secretMode && boss.phase === 3) {
                    boss.state = "SA1_WINDUP"; 
                    boss.stateTimer = 1; 
                    boss.color = "#ff8800";
                    break;
                }
                boss.vx = 0; 
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 15; } 
                break;
            case "PARRY_COUNTER_WINDUP": 
                boss.vx = 0; 
                if (boss.stateTimer <= 0) { boss.state = "PARRY_DASH"; boss.stateTimer = 12; boss.vx = boss.attackDir * 60; boss.color = "#aaaaaa"; playSound('parry'); } 
                break;
            case "PARRY_DASH": case "HEAL_PUNISH_DASH": 
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 25; boss.vx = 0; } 
                break;
            case "HIDDEN_PAUSE":
                boss.vx = 0; boss.vy = 0; boss.y = -1000;
                boss.invuln = 99999;
                if (boss.stateTimer <= 0 && (typeof gooCinematicTimer === 'undefined' || gooCinematicTimer <= 0)) {
                    let targetP = getNearestPlayer(boss.x);
                    let spawnNearX = targetP ? targetP.x + (Math.random() < 0.5 ? -140 : 140) : (boss.climbCenterX || ARENA_W/2);
                    boss.x = Math.max(80, Math.min(ARENA_W - 120, spawnNearX));
                    if (typeof abyssGooFloorActive !== 'undefined' && abyssGooFloorActive && !abyssGooSolidified && typeof platforms !== 'undefined' && platforms.length > 0) {
                        let spawnPlat = platforms.find(pl => Math.abs((pl.x + pl.w/2) - boss.x) < 240) || platforms[0];
                        boss.x = spawnPlat.x + spawnPlat.w/2 - boss.width/2;
                        boss.y = spawnPlat.y - boss.height;
                    } else {
                        boss.y = FLOOR - boss.height;
                    }
                    boss.state = "IDLE"; 
                    boss.stateTimer = 50; // Спокойное окно перед следующей атакой
                    boss.color = "#e6c800";
                    boss.invuln = 60;
                    applyPhysicsPushToLeaves(boss.x + 15, boss.y + 25, 15);
                }
                break;
            case "TRANSITION": 
                if (!secretMode && boss.stateTimer % 45 === 0 && boss.stateTimer < 380) { 
                    let aliveP = players.filter(p => !p.isDowned && p.hp > 0); 
                    if (aliveP.length > 0) spawnThread(aliveP[Math.floor(Math.random() * aliveP.length)]); 
                } 
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 15; } 
                break;
        }
        if (prevState !== "IDLE" && boss.state === "IDLE") { 
            if (boss.directAttackActive) { 
                boss.directAttackActive = false; 
                if (!boss.directAttackHit) { 
                    boss.missCount++; 
                    checkMissPhaseTransition(); 
                } 
            } 
        }
    }

    let applyBossGravity = true;
    if (boss.state.startsWith("L_CLIMB") || ["WIND_FLY", "VULN_STANCE", "VULN_LATE", "PARRY_STANCE", "PARRY_COUNTER_WINDUP", "TRANSITION", "PARRY_DASH", "HEAL_PUNISH_DASH", "CAST_WIND", "WIND_LINE_WINDUP", "WIND_LINE_ACTIVE", "SILK_RUN", "CAST_VERTICAL_WIND", "SCARF_SHOOT", "SCARF_PULL", "SCARF_WINDUP", "TELEPORT_OUT", "TELEPORT_IN", "TIED", "TIED_BLEED", "SHARPEN_WINDUP", "EXECUTE_QUEUE", "SA1_WINDUP", "SA1_ACTIVE", "SA2_WINDUP", "SA3_WINDUP", "SA2_DOUBLE", "SA2_TRIPLE", "SA2_SA3_COMBO", "SA2_TRIPLE_SA3_COMBO", "SA_EXECUTE", "VOID_PORTALS", "SA1_SLAM_WINDUP", "L_HEAL", "L_INTRO_FALL", "L_INTRO_RISE", "L_PHASE3_RISE", "L_SCREAM", "HIDDEN_PAUSE", "VOID_SINK_STUN"].includes(boss.state) || (boss.state === "LUNGE" && boss.attackDir === "UP") || boss.state.startsWith("CINEMATIC")) {
        applyBossGravity = false; 
        boss.vy = 0; 
    }
    if (boss.state === "SA1_MEGA_RISE" || boss.state === "SA1_SLAM" || boss.state === "SA1_MEGA_SLAM") {
        applyBossGravity = false; // не обнуляем boss.vy, босс летит вверх при разгоне или вниз при ударе!
    }
    if (globalWindMode === "UP" && !["TRANSITION", "DEFEATED", "WIND_FLY", "LUNGE", "TELEPORT_OUT", "TELEPORT_IN", "TIED", "TIED_BLEED"].includes(boss.state) && !boss.state.startsWith("CINEMATIC") && !boss.state.startsWith("L_CLIMB")) {
        applyBossGravity = false; 
        if (boss.stateTimer % 30 === 0) boss.targetY = 50 + Math.random() * 200; 
        if (["IDLE", "WALK", "CHASE", "FEINT_WINDUP"].includes(boss.state)) { 
            boss.vy += (boss.targetY - boss.y) * 0.05; 
            boss.vy *= 0.8; 
        } else if (["VULN_STANCE", "VULN_LATE", "PARRY_STANCE", "PARRY_COUNTER_WINDUP", "PARRY_DASH", "HEAL_PUNISH_DASH", "CAST_WIND"].includes(boss.state)) boss.vy = 0; 
    }

    if (applyBossGravity) {
        boss.vy += currentGravity;
        if (boss.vy >= 0 && !["SA1_SLAM", "SA1_MEGA_SLAM", "L_INTRO_FALL"].includes(boss.state)) {
            for (let plat of platforms) {
                if (boss.y + boss.height <= plat.y + 15 && boss.y + boss.height + boss.vy >= plat.y && boss.x + boss.width > plat.x && boss.x < plat.x + plat.w) {
                    boss.y = plat.y - boss.height;
                    boss.vy = 0;
                    break;
                }
            }
        }
    }
    let effectiveVx = (boss.lightInfected > 0 && ["LUNGE", "PARRY_DASH", "HEAL_PUNISH_DASH", "FEINT_DASH_FORWARD", "FEINT_DASH_BACK"].includes(boss.state)) ? (boss.vx / 1.5) : boss.vx;
    boss.x += effectiveVx; boss.y += boss.vy;
    let bossFloorLimit = FLOOR;
    if (boss.y + boss.height > bossFloorLimit && !boss.state.startsWith("L_INTRO") && boss.state !== "L_PHASE3_RISE" && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB") && boss.state !== "SA1_MEGA_SLAM") { 
        boss.y = bossFloorLimit - boss.height; 
        boss.vy = 0; 
    }
    let bossCeilLimit = secretMode ? -2000 : 0;
    if (boss.y < bossCeilLimit && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB")) boss.y = bossCeilLimit; 
    if (boss.x < 0 && !boss.state.startsWith("L_CLIMB")) { boss.x = 0; boss.vx *= -1; } 
    if (boss.x > ARENA_W - 30 && !boss.state.startsWith("L_CLIMB")) { boss.x = ARENA_W - 30; boss.vx *= -1; }

    let bossDmgHitbox = { x: boss.x, y: boss.y, width: 30, height: 50 };
    if (boss.phase === 3 && (boss.state === "PARRY_DASH" || boss.state === "HEAL_PUNISH_DASH")) { 
        bossDmgHitbox.y -= 60; 
        bossDmgHitbox.height += 60; 
    }

    for (let p of players) {
        if (!p.isDowned && p.hp > 0 && rectIntersect(p, bossDmgHitbox) && !(p.fireLungeTimer > 0) && boss.state !== "TRANSITION" && p.invuln <= 0 && !boss.halfHpSeqActive && boss.state !== "EXECUTE_QUEUE" && !boss.state.startsWith("SA") && !boss.state.startsWith("TELEPORT") && !boss.state.startsWith("CINEMATIC") && !boss.state.startsWith("L_INTRO") && !boss.state.startsWith("L_PHASE3") && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB") && boss.state !== "VOID_SINK_STUN") {
            let dmg = (secretMode ? 2 : 1) + boss.damageBonus; 
            if (boss.state === "GREAT_LUNGE_ACTIVE") {
                if (!secretMode) {
                    if (boss.phase === 1) {
                        dmg = 1.5;
                    } else if (boss.phase === 2) {
                        dmg = 1.5;
                        applyBleed(p);
                    } else { // Phase 3 (2nd sharpen)
                        dmg = 2.0;
                        applyBleed(p);
                    }
                } else { // L-mode
                    dmg = 2.0;
                    applyBleed(p);
                }
                triggerShake(8, 16);
            } else if (boss.state === "LUNGE" || boss.state === "LUNGE_WINDUP" || boss.state.startsWith("FEINT_DASH") || boss.state === "HEAL_PUNISH_DASH" || boss.state === "SCARF_SHOOT") { 
                dmg = (secretMode ? 2 : 1.5) + boss.damageBonus; 
                if (secretMode || boss.phase >= 2) {
                    applyBleed(p); 
                }
            } 
            if (boss.state === "PARRY_DASH") { 
                dmg = 1; 
                if (boss.damageBonus > 0 || secretMode) { 
                    dmg = 1.5; 
                    applyBleed(p); 
                } 
            }
            if (boss.lightInfected > 0) {
                dmg = Math.max(0.5, dmg - (boss.lightInfectedDmgRed || 0.5));
            }
            
            let wasH = p.isHealing; 
            takeDamage(p, dmg / 2); 
            p.pendingDmg = dmg / 2; 
            p.pendingDmgTimer = 5; 
            
            if (wasH) triggerVibration('heal_interrupt'); else triggerVibration('damage'); 
            triggerShake(3, 10); 
            freezeFrames = 2; 
        }
    }
}

function drawRapier(b, isPhantom = false) {
    if (b.state.startsWith("CINEMATIC") || b.state === "DEFEATED" || b.state === "FREE_ROAM" || b.state === "HIDDEN_PAUSE" || b.state.startsWith("L_CLIMB") || b.phase === 2.5 || b.state === "VOID_SINK_STUN") return;
    
    if (b.state === "SA1_SLAM_WINDUP") {
        ctx.fillStyle = "rgba(255, 255, 0, 0.2)";
        ctx.fillRect(b.x - 10, camY, b.width + 20, GAME_HEIGHT);
        ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
        ctx.fillRect(b.x, camY, b.width, GAME_HEIGHT);
        return; 
    }

    if (!isPhantom) return; // Boss now holds the Great Needle directly in her articulated model!

    ctx.save(); 
    let flip = b.facingRight ? 1 : -1; 
    ctx.translate(b.x + b.width/2, b.y + b.height/2 - 5); 
    ctx.scale(flip, 1);
    let angle = 0; 
    let time = Date.now(); 
    if (b.state === "IDLE") { angle = -Math.PI / 6 + Math.sin(time / 300) * 0.05; } 
    else if (b.state === "WALK" || b.state === "CHASE") { angle = Math.sin(time / 150) * 0.15; } 
    else if (b.state === "LUNGE_WINDUP") { angle = -Math.PI / 4 + Math.sin(time / 50) * 0.03; } 
    else if (b.state === "LUNGE") { angle = Math.PI / 16; } 
    else if (b.state === "PARRY_STANCE" || b.state === "PARRY_COUNTER_WINDUP" || b.state === "PARRY_DASH" || b.state === "HEAL_PUNISH_DASH") { angle = -Math.PI / 2; } 
    else if (b.state === "CAST_WIND" || b.state === "WIND_FLY" || b.state === "CAST_VERTICAL_WIND" || b.state === "SA1_SLAM_WINDUP" || b.state === "SA1_SLAM" || b.state.startsWith("L_INTRO") || b.state === "L_SCREAM") { angle = -Math.PI / 3 + Math.sin(time / 200) * 0.08; } 
    else if (b.state === "AOE") { angle = Math.PI / 2; } 
    else if (b.state.startsWith("FEINT")) { angle = b.state === "FEINT_DASH_BACK" ? Math.PI/4 : -Math.PI/6 + Math.sin(time / 100) * 0.1; }
    ctx.rotate(angle);
    
    let infectedColor = (boss.lightInfected > 0 || boss.hunterInfected > 0) ? "#00ffff" : "#ff8800";
    if (boss.state === "SHARPEN_WINDUP" && !isPhantom) {
        ctx.fillStyle = "purple"; 
        ctx.fillRect(10, -5, 50, 10);
    } else {
        ctx.fillStyle = "#ffffff"; 
        ctx.fillRect(0, -1, 35, 2); 
        ctx.fillStyle = isPhantom ? infectedColor : "#ffdd00"; 
        ctx.fillRect(-2, -4, 4, 8); 
        ctx.fillStyle = "#888888"; 
        ctx.fillRect(-6, -1, 4, 2); 
    }
    ctx.restore();
}

function drawTutorialBossModel() {
    if (boss.state === "INACTIVE" || boss.state === "DEFEATED") return;
    ctx.save();
    
    let bx = boss.x;
    let by = boss.y;
    let bw = boss.width || 30;
    let bh = boss.height || 50;
    let facing = boss.facingDir || 1;
    let t = Date.now();

    if (boss.invuln > 0 && Math.floor(t / 50) % 2 === 0) {
        ctx.globalAlpha = 0.45;
    }

    let floatY = Math.sin(t / 200) * 3;

    // 1. Purple mystical shadow aura beneath
    ctx.fillStyle = "rgba(124, 58, 237, 0.25)";
    ctx.beginPath();
    ctx.ellipse(bx + bw/2, FLOOR - 2, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main Puppet / Golem Body (Purple Training Dummy)
    ctx.fillStyle = (boss.state === "DASH_WINDUP" && Math.floor(boss.stateTimer / 5) % 2 === 0) ? "#ffffff" : "#6d28d9";
    ctx.strokeStyle = "#4c1d95";
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(bx, by + floatY + 12, bw, bh - 12, 6);
    ctx.fill();
    ctx.stroke();

    // Wooden cross-stitching / training patches on the torso
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + bw/2 - 5, by + floatY + 22); ctx.lineTo(bx + bw/2 + 5, by + floatY + 22);
    ctx.moveTo(bx + bw/2, by + floatY + 17); ctx.lineTo(bx + bw/2, by + floatY + 27);
    ctx.moveTo(bx + 2, by + floatY + 34); ctx.lineTo(bx + bw - 2, by + floatY + 34);
    ctx.stroke();

    // 3. Training Capelet / Cloth (Purple fluttering capelet)
    let capeDir = -facing;
    let capeWave = Math.sin(t / 150) * 4;
    ctx.fillStyle = "#8b5cf6";
    ctx.beginPath();
    ctx.moveTo(bx + (facing > 0 ? 4 : bw - 4), by + floatY + 14);
    ctx.quadraticCurveTo(bx + bw/2 + (capeDir * 18), by + floatY + 22 + capeWave, bx + bw/2 + (capeDir * 24), by + floatY + 38 + capeWave);
    ctx.lineTo(bx + bw/2 + (capeDir * 16), by + floatY + 44 + capeWave);
    ctx.quadraticCurveTo(bx + bw/2 + (capeDir * 8), by + floatY + 26, bx + (facing > 0 ? 8 : bw - 8), by + floatY + 20);
    ctx.closePath();
    ctx.fill();

    // 4. Head / Training Target Mask
    let headX = bx + bw / 2;
    let headY = by + floatY + 6;
    let headR = 12;

    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Target bullseye rings on the mask!
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(headX, headY, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing target eye in center
    ctx.fillStyle = (boss.state === "DASH_WINDUP") ? "#ff0044" : "#eab308";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(headX + (facing * 2), headY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. Training Wooden Foil / Practice Rapier
    let handX = bx + (facing > 0 ? bw + 2 : -2);
    let handY = by + floatY + 26;
    let tipX = handX + (facing * 34);
    let tipY = handY + (boss.state === "DASH" ? 0 : 4);

    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Practice padded tip (Purple glowing ball)
    ctx.fillStyle = "#c084fc";
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Guard of the sword
    ctx.fillStyle = "#78350f";
    ctx.fillRect(handX - 2, handY - 5, 4, 10);

    ctx.restore();
}

// --- ARTICULATED SILK HUNTRESS BOSS SYSTEM (v73) ---
function getBossAttackHintColor(boss) {
    if (boss.state === "BOSS_STUNNED" || boss.state === "L_PHASE4_STUNNED" || boss.state === "VOID_SINK_STUN") {
        return "rgba(220, 220, 240, 0.4)";
    }
    if (boss.state.startsWith("GREAT_LUNGE")) {
        return "rgba(255, 68, 0, 0.95)"; // Intense amber-crimson spark for Great Lunge
    }
    if (boss.state.startsWith("LUNGE") || boss.state === "DASH_WINDUP") {
        return "rgba(0, 240, 255, 0.85)"; // Subtle cyan gleam for horizontal lunge
    }
    if (boss.state === "PARRY_STANCE" || boss.state === "PARRY_COUNTER_WINDUP") {
        return "rgba(255, 215, 0, 0.85)"; // Subtle golden gleam for defensive parry
    }
    if (boss.state.startsWith("SA1") || boss.state === "AOE" || boss.state === "SHARPEN_WINDUP") {
        return "rgba(255, 120, 0, 0.85)"; // Subtle ember orange for sweep / spin / flurry
    }
    if (boss.state.startsWith("SA3") || boss.state === "VOID_PORTALS" || boss.state === "L_HEAL" || boss.state.startsWith("L_PHASE4")) {
        return "rgba(168, 85, 247, 0.85)"; // Subtle void purple for dark magic
    }
    if (boss.state.startsWith("SA2")) {
        return "rgba(255, 255, 255, 0.9)"; // Subtle white for precision needle slice
    }
    if (boss.state === "CAST_WIND" || boss.state === "WIND_FLY" || boss.state === "CAST_VERTICAL_WIND") {
        return "rgba(56, 189, 248, 0.85)"; // Subtle air cyan for wind
    }
    if (boss.state.startsWith("FEINT")) {
        return "rgba(200, 200, 220, 0.75)"; // Subtle silver for feints
    }
    if (boss.color && boss.color !== "#e6c800") {
        return boss.color;
    }
    return "rgba(255, 215, 0, 0.6)"; // Default subtle golden silk
}

function drawBossStickmanFigure(boss, bCloakColor, bPatternColor) {
    ctx.save();
    let facing = boss.facingRight ? 1 : -1;
    let bcx = boss.x + boss.width / 2;
    let bFloorY = boss.y + boss.height;
    let hintColor = getBossAttackHintColor(boss);

    let isStun = (boss.state === "BOSS_STUNNED" || boss.state === "L_PHASE4_STUNNED" || boss.state === "VOID_SINK_STUN");
    let isGreatLungeWindup = (boss.state === "GREAT_LUNGE_WINDUP");
    let isGreatLungeActive = (boss.state === "GREAT_LUNGE_ACTIVE");
    let isLungeWindup = (boss.state.startsWith("LUNGE_WINDUP") || boss.state === "DASH_WINDUP" || boss.state === "FEINT_WINDUP" || boss.state === "HEAL_PUNISH_DASH");
    let isLungeActive = (boss.state === "LUNGE" || boss.state === "PARRY_DASH" || boss.state === "FEINT_DASH_FORWARD");
    let isParry = (boss.state === "PARRY_STANCE" || boss.state === "PARRY_COUNTER_WINDUP");
    let isPlunge = (boss.state === "CAST_VERTICAL_WIND" || boss.state === "SA1_SLAM" || (boss.vy > 8 && boss.y < FLOOR - 60));
    let isSpin = (boss.state === "AOE" || boss.state === "SHARPEN_WINDUP" || boss.state === "SA1_WINDUP");
    let isMagic = (boss.state === "CAST_WIND" || boss.state === "WIND_FLY" || boss.state.startsWith("SA2") || boss.state.startsWith("SA3") || boss.state === "VOID_PORTALS" || boss.state === "L_HEAL" || boss.state === "L_SCREAM");
    let isMove = (boss.state === "WALK" || boss.state === "CHASE" || Math.abs(boss.vx) > 0.8);

    let neckX, neckY, pelvisX, pelvisY, headX, headY;
    let pommelX, pommelY, tipX, tipY;
    let hand1X, hand1Y, hand2X, hand2Y;

    // Body Color: iconic bright golden yellow boss stickman
    let huntressColor = isStun ? "#888877" : (secretMode ? "#cca000" : "#ffd700");

    ctx.lineWidth = 3.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = huntressColor;

    if (isGreatLungeWindup) {
        // --- 0. GREAT LUNGE WINDUP (Deep two-handed ground stance, long dramatic windup) ---
        let chargeJitter = Math.sin(Date.now() / 25) * 1.8;
        neckX = bcx + facing * 8; neckY = boss.y + 25 + chargeJitter;
        pelvisX = bcx - facing * 10; pelvisY = boss.y + 38;
        headX = neckX + facing * 4; headY = neckY - 8;

        // Front leg deeply coiled forward, rear leg stretched far back
        let fKneeX = bcx + facing * 14, fKneeY = boss.y + 44;
        let fFootX = bcx + facing * 19, fFootY = bFloorY;
        let bKneeX = bcx - facing * 16, bKneeY = boss.y + 42;
        let bFootX = bcx - facing * 24, bFootY = bFloorY;

        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bKneeX, bKneeY); ctx.lineTo(bFootX, bFootY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(fKneeX, fKneeY); ctx.lineTo(fFootX, fFootY); ctx.stroke();

        // Both hands gripping Great Needle pulled far behind
        hand1X = bcx - facing * 18; hand1Y = boss.y + 26;
        hand2X = bcx - facing * 8; hand2Y = boss.y + 24;
        pommelX = bcx - facing * 32; pommelY = boss.y + 27;
        tipX = bcx + facing * 38 + chargeJitter * 2; tipY = boss.y + 22;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand2X, hand2Y); ctx.stroke();

    } else if (isGreatLungeActive) {
        // --- 0.5 GREAT LUNGE ACTIVE (Super-fast aerodynamic supersonic thrust) ---
        neckX = bcx + facing * 18; neckY = boss.y + 20;
        pelvisX = bcx - facing * 14; pelvisY = boss.y + 20;
        headX = neckX + facing * 5; headY = neckY - 5;

        let l1KneeX = bcx - facing * 22, l1KneeY = boss.y + 19;
        let l1FootX = bcx - facing * 34, l1FootY = boss.y + 18;
        let l2KneeX = bcx - facing * 20, l2KneeY = boss.y + 22;
        let l2FootX = bcx - facing * 31, l2FootY = boss.y + 23;

        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(l1KneeX, l1KneeY); ctx.lineTo(l1FootX, l1FootY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(l2KneeX, l2KneeY); ctx.lineTo(l2FootX, l2FootY); ctx.stroke();

        hand1X = neckX + facing * 18; hand1Y = neckY;
        pommelX = neckX + facing * 10; pommelY = neckY;
        tipX = neckX + facing * 75; tipY = neckY;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();

    } else if (isLungeWindup) {
        // --- 1. LUNGE WINDUP (Deep coiled crouch, needle cocked back horizontally) ---
        let coilJitter = Math.sin(Date.now() / 35) * 1.2;
        neckX = bcx + facing * 5; neckY = boss.y + 22 + coilJitter;
        pelvisX = bcx - facing * 7; pelvisY = boss.y + 35;
        headX = neckX + facing * 3; headY = neckY - 8;

        // Front leg deeply coiled, back leg bracing
        let fKneeX = bcx + facing * 11, fKneeY = boss.y + 42;
        let fFootX = bcx + facing * 15, fFootY = bFloorY;
        let bKneeX = bcx - facing * 13, bKneeY = boss.y + 39;
        let bFootX = bcx - facing * 18, bFootY = bFloorY;

        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bKneeX, bKneeY); ctx.lineTo(bFootX, bFootY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(fKneeX, fKneeY); ctx.lineTo(fFootX, fFootY); ctx.stroke();

        // Hands & Needle pulled back horizontally
        hand1X = bcx - facing * 12; hand1Y = boss.y + 22;
        hand2X = bcx - facing * 2; hand2Y = boss.y + 22;
        pommelX = bcx - facing * 24; pommelY = boss.y + 22;
        tipX = bcx + facing * 26 + coilJitter; tipY = boss.y + 22;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand2X, hand2Y); ctx.stroke();

    } else if (isLungeActive) {
        // --- 2. LUNGE ACTIVE (Horizontal spear thrust mid-flight) ---
        neckX = bcx + facing * 14; neckY = boss.y + 21;
        pelvisX = bcx - facing * 10; pelvisY = boss.y + 21;
        headX = neckX + facing * 4; headY = neckY - 5;

        // Horizontal streamlined trailing legs
        let l1KneeX = bcx - facing * 18, l1KneeY = boss.y + 20;
        let l1FootX = bcx - facing * 28, l1FootY = boss.y + 19;
        let l2KneeX = bcx - facing * 16, l2KneeY = boss.y + 23;
        let l2FootX = bcx - facing * 25, l2FootY = boss.y + 24;

        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(l1KneeX, l1KneeY); ctx.lineTo(l1FootX, l1FootY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(l2KneeX, l2KneeY); ctx.lineTo(l2FootX, l2FootY); ctx.stroke();

        // Arm thrusting forward, Great Needle extended far ahead
        hand1X = neckX + facing * 14; hand1Y = neckY;
        pommelX = neckX + facing * 8; pommelY = neckY;
        tipX = neckX + facing * 64; tipY = neckY;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();

    } else if (isParry) {
        // --- 3. PARRY STANCE (Upright martial poise, Great Needle held vertically guarding torso) ---
        neckX = bcx; neckY = boss.y + 14;
        pelvisX = bcx; pelvisY = boss.y + 31;
        headX = neckX; headY = neckY - 9;

        // Grounded defensive wide feet
        let lKneeX = bcx - 8, lKneeY = boss.y + 40;
        let lFootX = bcx - 12, lFootY = bFloorY;
        let rKneeX = bcx + 8, rKneeY = boss.y + 40;
        let rFootX = bcx + 12, rFootY = bFloorY;

        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(lKneeX, lKneeY); ctx.lineTo(lFootX, lFootY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(rKneeX, rKneeY); ctx.lineTo(rFootX, rFootY); ctx.stroke();

        // Hands holding Great Needle VERTICALLY like a guard shield
        hand1X = bcx + facing * 4; hand1Y = boss.y + 28;
        pommelX = bcx + facing * 4; pommelY = boss.y + 40;
        tipX = bcx + facing * 4; tipY = boss.y - 12;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();

    } else if (isPlunge) {
        // --- 4. AIR DIVE / PLUNGE (Knees tucked up, Great Needle pointing straight down) ---
        neckX = bcx; neckY = boss.y + 24;
        pelvisX = bcx; pelvisY = boss.y + 13;
        headX = neckX; headY = neckY - 8;

        // Tucked knees
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx - 6, boss.y + 18); ctx.lineTo(bcx - 4, boss.y + 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx + 6, boss.y + 18); ctx.lineTo(bcx + 4, boss.y + 22); ctx.stroke();

        // Hands gripping needle pommel, pointing straight down into floor
        hand1X = bcx; hand1Y = boss.y + 24;
        pommelX = bcx; pommelY = boss.y + 24;
        tipX = bcx; tipY = boss.y + 72;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();

    } else if (isSpin) {
        // --- 5. SPIN / CYCLONE / AOE (Wide stance, horizontal sweeping needle) ---
        neckX = bcx; neckY = boss.y + 18;
        pelvisX = bcx; pelvisY = boss.y + 32;
        headX = neckX + facing * 1; headY = neckY - 9;

        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx - 10, boss.y + 40); ctx.lineTo(bcx - 14, bFloorY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx + 10, boss.y + 40); ctx.lineTo(bcx + 14, bFloorY); ctx.stroke();

        hand1X = bcx - facing * 8; hand1Y = boss.y + 22;
        hand2X = bcx + facing * 8; hand2Y = boss.y + 22;
        pommelX = bcx - facing * 20; pommelY = boss.y + 22;
        tipX = bcx + facing * 34; tipY = boss.y + 22;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand2X, hand2Y); ctx.stroke();

    } else if (isMagic) {
        // --- 6. MAGIC / SUPER ATTACK (Channeling hand, needle pointed aloft to sky) ---
        neckX = bcx - facing * 2; neckY = boss.y + 14;
        pelvisX = bcx - facing * 4; pelvisY = boss.y + 32;
        headX = neckX + facing * 1; headY = neckY - 9;

        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx - 7, boss.y + 40); ctx.lineTo(bcx - 9, bFloorY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx + 8, boss.y + 40); ctx.lineTo(bcx + 11, bFloorY); ctx.stroke();

        // Channeling forward hand
        hand1X = bcx + facing * 12; hand1Y = boss.y + 18;
        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();

        // Raised needle hand
        hand2X = bcx - facing * 6; hand2Y = boss.y + 14;
        pommelX = bcx - facing * 14; pommelY = boss.y + 24;
        tipX = bcx + facing * 24; tipY = boss.y - 18;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand2X, hand2Y); ctx.stroke();

    } else if (isStun) {
        // --- 7. STUNNED (Kneeling slump, head hanging, needle dropped on floor) ---
        neckX = bcx; neckY = boss.y + 27;
        pelvisX = bcx - facing * 4; pelvisY = boss.y + 38;
        headX = bcx + facing * 2; headY = boss.y + 20;

        // Down on one knee
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx - facing * 8, bFloorY); ctx.lineTo(bcx - facing * 14, bFloorY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx + facing * 8, boss.y + 42); ctx.lineTo(bcx + facing * 10, bFloorY); ctx.stroke();

        // Limp arm, needle tip resting on arena floor
        hand1X = bcx + facing * 6; hand1Y = boss.y + 36;
        pommelX = bcx - facing * 4; pommelY = boss.y + 36;
        tipX = bcx + facing * 26; tipY = bFloorY;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();

    } else if (isMove) {
        // --- 8. MOVE / CHASE (Fluid predatory stalking stride) ---
        let movePhase = Date.now() / 85;
        let stride = Math.sin(movePhase) * 10;
        neckX = bcx + facing * 3; neckY = boss.y + 15;
        pelvisX = bcx; pelvisY = boss.y + 31;
        headX = neckX + facing * 1; headY = neckY - 9;

        let k1X = pelvisX + facing * stride * 0.6, k1Y = boss.y + 40;
        let f1X = pelvisX + facing * stride, f1Y = bFloorY - Math.max(0, -stride * 0.3);
        let k2X = pelvisX - facing * stride * 0.6, k2Y = boss.y + 40;
        let f2X = pelvisX - facing * stride, f2Y = bFloorY - Math.max(0, stride * 0.3);

        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(k1X, k1Y); ctx.lineTo(f1X, f1Y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(k2X, k2Y); ctx.lineTo(f2X, f2Y); ctx.stroke();

        hand1X = bcx + facing * 6; hand1Y = boss.y + 22;
        pommelX = bcx - facing * 6; pommelY = boss.y + 18;
        tipX = bcx + facing * 26; tipY = boss.y + 28;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();

    } else {
        // --- 9. IDLE (Breathing combat poise) ---
        let breath = Math.sin(Date.now() / 250) * 1.2;
        neckX = bcx; neckY = boss.y + 14 + breath;
        pelvisX = bcx; pelvisY = boss.y + 31 + breath * 0.5;
        headX = neckX; headY = neckY - 9;

        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx - 5, boss.y + 40); ctx.lineTo(bcx - 6, bFloorY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pelvisX, pelvisY); ctx.lineTo(bcx + 5, boss.y + 40); ctx.lineTo(bcx + 6, bFloorY); ctx.stroke();

        hand1X = bcx + facing * 6; hand1Y = boss.y + 22 + breath;
        pommelX = bcx - facing * 6; pommelY = boss.y + 19 + breath;
        tipX = bcx + facing * 24; tipY = boss.y + 27 + breath;

        ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hand1X, hand1Y); ctx.stroke();
    }

    // Spine
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(neckX, neckY);
    ctx.lineTo(pelvisX, pelvisY);
    ctx.stroke();

    // --- THE GREAT NEEDLE (Silver steel with eyelet & subtle attack color spark on tip) ---
    // 1. Pommel Eyelet
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(pommelX, pommelY, 3.5, 0, Math.PI * 2);
    ctx.stroke();

    // Delicate silk thread from eyelet
    ctx.strokeStyle = hintColor;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.55;
    let wave1 = Math.sin(Date.now() / 90) * 5;
    ctx.beginPath();
    ctx.moveTo(pommelX, pommelY);
    ctx.quadraticCurveTo(pommelX - facing * 12, pommelY + 6 + wave1, pommelX - facing * 24, pommelY + 14 + wave1 * 1.5);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // 2. Polished Silver Needle Blade
    let needleGrad = ctx.createLinearGradient(pommelX, pommelY, tipX, tipY);
    needleGrad.addColorStop(0, "#cbd5e1");
    needleGrad.addColorStop(0.5, "#f1f5f9");
    needleGrad.addColorStop(1, "#94a3b8");
    ctx.strokeStyle = needleGrad;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(pommelX, pommelY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // 3. SUBTLE ATTACK COLOR TINT ON NEEDLE TIP ("капелька оттенка")
    ctx.save();
    ctx.fillStyle = hintColor;
    ctx.shadowColor = hintColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- BOSS STICKMAN HEAD (NO ALIEN HORNS / NO BUG MASK) ---
    // Sleek stickman warrior head (Yellow)
    ctx.fillStyle = huntressColor;
    ctx.strokeStyle = isStun ? "rgba(0, 0, 0, 0.4)" : "#b38600";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(headX, headY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Focused warrior eye slit with subtle attack color hint ("капелька оттенка")
    ctx.strokeStyle = hintColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = hintColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(headX + facing * 0.5, headY - 0.5);
    ctx.lineTo(headX + facing * 6.5, headY - 0.5);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
}

function drawBoss() {
    if (window.isFireBossMode) {
        drawFireBoss();
        return;
    }
    if (typeof isTutorial !== 'undefined' && isTutorial) {
        drawTutorialBossModel();
        return;
    }
    if (boss.state.startsWith("L_CLIMB") || boss.phase === 2.5 || boss.state === "DEFEATED" || boss.state === "FREE_ROAM") return;

    if (boss.state === "L_HEAL" && boss.healOrbs) {
        let bCenterX = boss.x + boss.width / 2;
        let bCenterY = boss.y + boss.height / 2;

        // Темная воронка пустоты
        ctx.save();
        let auraPulse = 0.4 + 0.2 * Math.sin(Date.now() / 80);
        let auraGrad = ctx.createRadialGradient(bCenterX, bCenterY, 15, bCenterX, bCenterY, 180);
        auraGrad.addColorStop(0, "rgba(80, 0, 140, 0.7)");
        auraGrad.addColorStop(0.5, `rgba(40, 0, 80, ${auraPulse})`);
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(bCenterX, bCenterY, 180, 0, Math.PI * 2);
        ctx.fill();

        // Черные шарики пустоты, закручивающиеся в центр босса
        for (let o of boss.healOrbs) {
            let ox = bCenterX + Math.cos(o.angle) * o.dist;
            let oy = bCenterY + Math.sin(o.angle) * o.dist;
            ctx.beginPath();
            ctx.arc(ox, oy, o.r, 0, Math.PI * 2);
            ctx.fillStyle = "#0a0014";
            ctx.fill();
            ctx.strokeStyle = "#aa00ff";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    }

    if (boss.state === "SA1_ACTIVE" && boss.sa1Arr) {
        for (let ph of boss.sa1Arr) {
            if (ph.active && ph.timer >= ph.startDelay) {
                let w = ph.w || 630;
                let h = ph.h || 200;
                let bx = ph.x - 300;
                let by = ph.y - 150;

                ctx.save();
                if (ph.timer < ph.startDelay + 40) {
                    // Фаза предупреждения: оригинальная полупрозрачная оранжевая зона (кадр уязвимости)
                    let pulse = 0.22 + 0.12 * Math.sin(Date.now() / 80 + ph.x);
                    ctx.fillStyle = `rgba(255, 150, 0, ${pulse})`;
                    ctx.fillRect(bx, by, w, h);
                    ctx.setLineDash([8, 6]);
                    ctx.strokeStyle = "rgba(255, 180, 0, 0.85)";
                    ctx.lineWidth = 2.5;
                    ctx.strokeRect(bx, by, w, h);
                } else if (ph.timer <= ph.startDelay + 52) {
                    // Фаза удара: яркая оранжевая вспышка рассечения
                    let fade = Math.max(0, (ph.startDelay + 52 - ph.timer) / 12);
                    ctx.fillStyle = `rgba(255, 120, 0, ${fade * 0.85})`;
                    ctx.fillRect(bx, by, w, h);
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(bx, by + h / 2);
                    ctx.lineTo(bx + w, by + h / 2);
                    ctx.moveTo(bx + 40, by + 20);
                    ctx.lineTo(bx + w - 40, by + h - 20);
                    ctx.stroke();
                }

                // Силуэт фантома босса
                ctx.fillStyle = ph.isReal ? "#ff8800" : "rgba(35, 15, 0, 0.9)";
                ctx.fillRect(ph.x - 15, ph.y - 25, 30, 50);
                if (!ph.isReal) { 
                    ctx.strokeStyle = "#ffaa00"; 
                    ctx.lineWidth = 2; 
                    ctx.strokeRect(ph.x - 15, ph.y - 25, 30, 50); 
                }
                // Маска фантома
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(ph.x, ph.y - 15, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    if (boss.state === "VOID_SINK_STUN") {
        // Лужа пустоты под боссом
        ctx.save();
        ctx.fillStyle = "#0a0014";
        ctx.beginPath();
        ctx.ellipse(boss.x + boss.width/2, FLOOR, 45, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#aa00ff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Тело босса, погрузившееся в пол
        ctx.fillStyle = getBossColor(boss.color);
        ctx.fillRect(boss.x, boss.y + 12, boss.width, boss.height - 12);
        ctx.restore();

        // Мерцающая надпись "Примените кинжал света (Shift)!"
        ctx.save();
        ctx.fillStyle = (Math.floor(Date.now() / 150) % 2 === 0) ? "#00ffff" : "#ffffff";
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "center";
        ctx.shadowColor = "#00ffff";
        let hintKey = (players[0] && players[0].inputType === 'KEYBOARD_SHOOTER') ? "ЛКМ+ПКМ" : "Shift";
        ctx.fillText(`Примените кинжал света (${hintKey})!`, boss.x + boss.width/2, boss.y - 18);
        ctx.restore();
    }

    // Шлейф шелкового бега босса (Silk Run afterimages & silk ribbons)
    if (boss.silkTrail && boss.silkTrail.length > 0) {
        ctx.save();
        for (let i = boss.silkTrail.length - 1; i >= 0; i--) {
            let st = boss.silkTrail[i];
            st.alpha -= 0.04;
            if (st.alpha <= 0) {
                boss.silkTrail.splice(i, 1);
                continue;
            }
            ctx.globalAlpha = st.alpha * 0.55;
            ctx.fillStyle = secretMode ? "rgba(180, 60, 255, 0.5)" : "rgba(255, 220, 80, 0.55)";
            ctx.shadowColor = secretMode ? "#cc00ff" : "#ffcc00";
            ctx.shadowBlur = 14;
            ctx.fillRect(st.x, st.y, boss.width, boss.height);

            if (i > 0) {
                let prev = boss.silkTrail[i - 1];
                ctx.strokeStyle = secretMode ? `rgba(220, 120, 255, ${st.alpha * 0.8})` : `rgba(255, 245, 180, ${st.alpha * 0.8})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(prev.x + boss.width / 2, prev.y + boss.height / 2);
                ctx.lineTo(st.x + boss.width / 2, st.y + boss.height / 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    if (!boss.halfHpSeqActive && boss.x > -1000 && boss.state !== "SA1_ACTIVE" && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB")) {
        ctx.globalAlpha = (boss.invuln > 0 && Math.floor(Date.now() / 50) % 2 === 0) ? 0.5 : 1.0;
        
        // --- БОСС: ЧЕРНЫЙ ШАРФ И ЖЕЛТЫЙ ПЛАЩ С ОРАНЖЕВЫМИ УЗОРАМИ ---
        ctx.save();
        let isStunColor = (boss.state === "BOSS_STUNNED" || boss.state === "L_PHASE4_STUNNED");
        let bCloakColor = (secretMode && !isStunColor) ? "#4a3c00" : "#e6b800";
        let bPatternColor = (secretMode && !isStunColor) ? "#8a4500" : "#ff7700";
        
        // --- БОСС: ДИНАМИЧЕСКИЙ РАЗВЕВАЮЩИЙСЯ ЖЕЛТЫЙ ПЛАЩ ---
        let bTrailDir = boss.facingRight ? -1 : 1;
        let bSpeed = Math.abs(boss.vx);
        let bLagX = -boss.vx * 3.5;
        let bLagY = -boss.vy * 2;
        let bTime = Date.now();
        let bWaveTime = bTime / 110;
        let bFlutter1 = Math.sin(bWaveTime) * (5 + bSpeed * 1.5);
        let bFlutter2 = Math.cos(bWaveTime * 1.4) * (6 + bSpeed * 1.8);
        let bFlap = Math.sin(bWaveTime * 1.8) * (4 + bSpeed);

        let bAnchorX = boss.facingRight ? boss.x + 8 : boss.x + boss.width - 8;
        let bShoulderY = boss.y + 10;
        let bTipX = bAnchorX + (bTrailDir * (28 + bSpeed * 4)) + (bLagX * 0.5) + bFlutter1;
        let bTipY = boss.y + boss.height + 4 + bFlutter2 * 0.8 + (bLagY * 0.4);
        let bMidX = bAnchorX + (bTrailDir * (32 + bSpeed * 4.5)) + (bLagX * 0.6) + bFlutter2;
        let bMidY = boss.y + 26 + bFlutter1 * 0.7;
        let bHemMidX = bAnchorX + (bTrailDir * (14 + bSpeed * 2)) + bFlap;
        let bHemMidY = boss.y + boss.height - bFlap * 0.5;

        // 1. Тень складок плаща
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.moveTo(bAnchorX, bShoulderY + 2);
        ctx.quadraticCurveTo(bMidX * 0.9, bMidY, bTipX - bTrailDir * 4, bTipY);
        ctx.quadraticCurveTo(bHemMidX, bHemMidY + 2, bAnchorX, boss.y + boss.height);
        ctx.closePath();
        ctx.fill();

        // 2. Основная ткань желтого плаща
        ctx.fillStyle = bCloakColor;
        ctx.beginPath();
        ctx.moveTo(bAnchorX, bShoulderY);
        ctx.quadraticCurveTo(bAnchorX + (bTrailDir * (14 + bSpeed * 2)), bShoulderY + 4 + bFlap, bMidX, bMidY);
        ctx.quadraticCurveTo(bMidX + bTrailDir * 4, bMidY + (boss.height * 0.4), bTipX, bTipY);
        ctx.quadraticCurveTo(bHemMidX, bHemMidY, bAnchorX, boss.y + boss.height - 4);
        ctx.lineTo(bAnchorX, bShoulderY);
        ctx.closePath();
        ctx.fill();

        // 3. Оранжевые узоры плаща
        ctx.strokeStyle = bPatternColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bAnchorX + (bTrailDir * 5), bShoulderY + 6);
        ctx.quadraticCurveTo(bMidX - (bTrailDir * 5), bMidY + 4, bTipX - (bTrailDir * 4), bTipY - 5);
        ctx.stroke();

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bAnchorX + (bTrailDir * 8), bShoulderY + 12);
        ctx.quadraticCurveTo(bMidX - (bTrailDir * 9), bMidY + 12, bHemMidX, bHemMidY - 3);
        ctx.stroke();

        // --- БОСС: АРТИКУЛИРОВАННАЯ ФИГУРА ОХОТНИЦЫ И ВЕЛИКАЯ ИГЛА (v73) ---
        drawBossStickmanFigure(boss, bCloakColor, bPatternColor);

        // Черный шарф вокруг шеи
        ctx.fillStyle = "#111111";
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
        let scarfY = boss.y + 6;
        ctx.fillRect(boss.x - 2, scarfY, boss.width + 4, 8);
        ctx.strokeRect(boss.x - 2, scarfY, boss.width + 4, 8);
        
        // Развевающиеся концы черного шарфа
        let tailX = boss.facingRight ? boss.x - 4 : boss.x + boss.width + 4;
        let tailDir = boss.facingRight ? -1 : 1;
        let wave = Math.sin(Date.now() / 90) * 6;
        ctx.beginPath();
        ctx.moveTo(tailX, scarfY + 4);
        ctx.quadraticCurveTo(tailX + (tailDir * 16), scarfY + 10 + wave, tailX + (tailDir * 26), scarfY + 16 + wave * 1.6);
        ctx.lineTo(tailX + (tailDir * 24), scarfY + 22 + wave * 1.6);
        ctx.quadraticCurveTo(tailX + (tailDir * 14), scarfY + 15 + wave, tailX, scarfY + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // В оглушении над боссом летает белая штука (нимб и вращающиеся искры-звездочки)
        if (boss.state === "BOSS_STUNNED" || boss.state === "L_PHASE4_STUNNED") {
            let hTime = Date.now();
            let hCenterX = boss.x + boss.width / 2;
            let hCenterY = boss.y - 16;
            
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.ellipse(hCenterX, hCenterY, 20, 6, Math.PI / 12, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 3; i++) {
                let ang = (hTime / 220) + (i * (Math.PI * 2 / 3));
                let sx = hCenterX + Math.cos(ang) * 20;
                let sy = hCenterY + Math.sin(ang) * 6;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Фаза 4: темная парящая аура босса
        if (boss.state === "L_PHASE4_ORBS") {
            ctx.save();
            let bCenterX = boss.x + boss.width / 2;
            let bCenterY = boss.y + boss.height / 2;
            let auraPulse = 0.35 + 0.15 * Math.sin(Date.now() / 150);
            let auraGrad = ctx.createRadialGradient(bCenterX, bCenterY, 10, bCenterX, bCenterY, 80);
            auraGrad.addColorStop(0, "rgba(80, 0, 140, 0.7)");
            auraGrad.addColorStop(0.6, `rgba(40, 0, 80, ${auraPulse})`);
            auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(bCenterX, bCenterY, 80, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();

        ctx.globalAlpha = 1.0;
        
        if (boss.flashTimer > 0) {
            ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
            ctx.beginPath();
            ctx.arc(boss.x + 15, boss.y + 25, boss.flashTimer * 10, 0, Math.PI*2);
            ctx.fill();
            boss.flashTimer--;
        }
    }
    drawRapier(boss);

    if (boss.state === "CINEMATIC_TIE_WAIT") { 
        ctx.fillStyle = "cyan"; ctx.font = "16px Arial"; ctx.textAlign = "center"; 
        ctx.fillText(`Связывайте!`, boss.x + boss.width/2, boss.y - 40); 
        for (let i = 0; i < players.length; i++) { 
            let p = players[i]; 
            if (!p.hasPressedTie && !p.isDowned && p.hp > 0 && !p.isAi) { 
                let key = p.type === 'WATER' ? (numPlayers === 1 ? "F" : "'") : "F"; 
                ctx.fillStyle = p.color; 
                ctx.fillText(`Нажми ${key}`, p.x + p.width/2, p.y - 15); 
            } 
        } 
        ctx.textAlign = "left"; 
    }
    if (boss.state === "CINEMATIC_FAIL") { 
        ctx.fillStyle = "red"; ctx.font = "16px Arial"; ctx.textAlign = "center"; 
        ctx.fillText("Провал!", boss.x + boss.width/2, boss.y - 40); ctx.textAlign = "left"; 
        ctx.lineWidth = 2; ctx.strokeStyle = "red"; 
        for (let i = 0; i < 10; i++) { 
            ctx.beginPath(); 
            let sx = boss.x + boss.width/2; let sy = boss.y + boss.height/2; 
            ctx.moveTo(sx, sy); 
            ctx.lineTo(sx + (Math.random() - 0.5) * 150, sy + (Math.random() - 0.5) * 150); 
            ctx.stroke(); 
        } 
    }
    if (boss.state === "CINEMATIC_TYING" || boss.state === "CINEMATIC_BREAK") { 
        ctx.lineWidth = 2; 
        for (let i = 0; i < 20; i++) { 
            ctx.strokeStyle = (i % 2 === 0) ? "cyan" : (numPlayers === 2 ? "lime" : "cyan"); 
            ctx.beginPath(); 
            ctx.moveTo(boss.x - 5 + Math.random() * 10, boss.y + i * 2.5 + Math.random() * 5); 
            ctx.lineTo(boss.x + boss.width + 5 + Math.random() * 10, boss.y + i * 2.5 + Math.random() * 5); 
            ctx.stroke(); 
        } 
    }
    if (boss.state === "CINEMATIC_BREAK") { 
        ctx.strokeStyle = "white"; ctx.lineWidth = 5; ctx.beginPath(); 
        ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, 50, -Math.PI/4, Math.PI + Math.PI/4); 
        ctx.stroke(); 
    }
    if (boss.state === "WIND_FLY") { 
        ctx.fillStyle = secretMode ? "rgba(150,0,255,0.5)" : "rgba(0, 255, 255, 0.5)"; 
        ctx.fillRect(boss.x, boss.y + boss.height, boss.width, 20 + Math.random() * 20); 
    }
    
    if (scarf.active) { 
        ctx.fillStyle = "#111"; ctx.strokeStyle = "#444"; ctx.lineWidth = 2; 
        let sx = scarf.dir === 1 ? boss.x + boss.width : boss.x - scarf.width; 
        ctx.fillRect(sx, boss.y + 20, scarf.width, 10); 
        ctx.strokeRect(sx, boss.y + 20, scarf.width, 10); 
    }
    if (boss.state === "TRANSITION") { 
        ctx.fillStyle = "cyan"; ctx.font = "14px Arial"; ctx.textAlign = "center"; 
        ctx.fillText(boss.msg, boss.x + boss.width/2, boss.y - 15); 
        ctx.textAlign = "left"; 
    }
    
    if (boss.state === "AOE") { 
        let aX = boss.x - 400, aY = boss.y - 150, aW = 800, aH = 200; 
        ctx.fillStyle = "rgba(255, 136, 0, 0.1)"; 
        ctx.fillRect(aX, aY, aW, aH); 
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"; 
        ctx.lineWidth = 2; 
        for (let i = 0; i < 20; i++) { 
            ctx.beginPath(); 
            let sx = aX + Math.random() * aW; 
            let sy = aY + Math.random() * aH; 
            ctx.moveTo(sx, sy); 
            ctx.lineTo(sx + (Math.random() - 0.5) * 250, sy + (Math.random() - 0.5) * 250); 
            ctx.stroke(); 
        } 
    }

    if (clashFlash && clashFlash.timer > 0) { 
        ctx.beginPath(); 
        ctx.arc(clashFlash.x, clashFlash.y, (15 - clashFlash.timer) * 8, 0, Math.PI*2); 
        ctx.fillStyle = "rgba(255, 255, 0, 0.8)"; 
        ctx.fill(); 
        ctx.strokeStyle = "cyan"; 
        ctx.lineWidth = 4; 
        ctx.stroke(); 
        clashFlash.timer--; 
    }
}

// --- FIRE BOSS (ФЕХТОВАЛЬЩИК ОГНЯ) IMPLEMENTATION ---

function tryDamageFireBoss(dmg, sourcePlayer) {
    if (boss.invuln > 0 || boss.state === "FIRE_INTRO" || boss.state === "DEFEATED" || boss.state === "FIRE_SILK_RUN" || boss.state === "FIRE_FINALE") {
        return false;
    }

    // Active Parry Stance: if struck, parries with metallic clash and initiates SA1-style area tear counter!
    if (boss.state === "FIRE_PARRY_STANCE") {
        boss.state = "FIRE_PARRY_COUNTER";
        boss.stateTimer = 44; // Telegraph windup (14f) + Area Tear (15f) + Recovery (15f)
        boss.attackHitDone = false;
        boss.invuln = 45;
        boss.parryRipLines = null;
        let pMidX = sourcePlayer ? (sourcePlayer.x + sourcePlayer.width / 2) : (boss.x + (boss.facingRight ? 60 : -60));
        let pMidY = sourcePlayer ? (sourcePlayer.y + sourcePlayer.height / 2) : (boss.y + 24);
        boss.clashX = (boss.x + boss.width / 2 + pMidX) * 0.5;
        boss.clashY = (boss.y + 24 + pMidY) * 0.5;

        playSound('parry');
        freezeFrames = 4; // Satisfying parry clash freeze!
        triggerShake(6, 12);
        triggerVibration('parry');

        voidExplosions.push({
            x: boss.clashX,
            y: boss.clashY,
            timer: 20,
            isWhite: true,
            isOrange: true,
            r: 45
        });
        return false; // Attack parried!
    }

    // Interruptible Heal: struck during heal -> interrupted!
    if (boss.state === "FIRE_HEAL") {
        boss.state = "FIRE_IDLE";
        boss.stateTimer = 25;
        boss.fireHealCooldown = 600; // 10s cooldown
        playSound('break');
        playSound('hitBoss');
        triggerShake(8, 14);
        triggerVibration('heal_interrupt');
    }

    // Mid-attack check: 0% block chance during another attack
    let isAttacking = (boss.state === "FIRE_WALK_ATTACK" || boss.state === "FIRE_LUNGE" || boss.state === "FIRE_SHIFT_DASH" || boss.state === "FIRE_UPWARD_COUNTER");

    // Downwards pogo deflection check: 20% chance if not mid-attack
    let isPogo = sourcePlayer && (sourcePlayer.vy > 0 || sourcePlayer.attackType === "DOWN" || (keys['ArrowDown'] || keys['KeyS']));
    if (!isAttacking && isPogo) {
        if (Math.random() < 0.20) {
            // Deflected! Counters with upward strike
            boss.state = "FIRE_UPWARD_COUNTER";
            boss.stateTimer = 22;
            boss.vx = 0;
            boss.vy = -4;
            boss.attackHitDone = false;
            playSound('parry');
            playSound('slash');
            triggerShake(6, 12);
            triggerVibration('clash');
            voidExplosions.push({
                x: boss.x + boss.width / 2,
                y: boss.y - 10,
                timer: 16,
                isWhite: true,
                isOrange: false,
                r: 45
            });
            return false;
        }
    }

    // Horizontal passive block check: 50% base, 25% if struck within 1.5s (90 frames) of last block
    if (!isAttacking && !isPogo) {
        let blockChance = (boss.lastBlockTimer > 0) ? 0.25 : 0.50;
        if (Math.random() < blockChance) {
            boss.lastBlockTimer = 90; // 1.5 seconds window
            playSound('parry');
            playSound('break');
            triggerShake(5, 10);
            triggerVibration('clash');
            let sparkX = boss.facingRight ? boss.x + boss.width + 12 : boss.x - 12;
            voidExplosions.push({
                x: sparkX,
                y: boss.y + 20,
                timer: 14,
                isWhite: true,
                isOrange: false,
                r: 40
            });
            if (sourcePlayer) {
                sourcePlayer.vx = (sourcePlayer.x > boss.x ? 1 : -1) * 6;
            }
            return false;
        }
    }

    // Take hit damage
    if (megaDamageActive || window.megaDamageActive) dmg *= 5;
    let finalDmg = Math.round(dmg * 4) / 4;
    boss.hp = Math.max(0, Math.round((boss.hp - finalDmg) * 4) / 4);
    boss.invuln = 10;
    playSound('hitBoss');
    playSound('slash');
    triggerShake(5, 12);
    triggerVibration('damage');

    if (sourcePlayer && typeof recordHit === 'function') recordHit(sourcePlayer);

    // Section 3: BRIDGE - Escalates into climactic bridge when Boss HP <= 7 (Phase 2)
    if (boss.hp > 0 && boss.hp <= 7 && window.fireBossAudioEngine && window.fireBossAudioEngine.section !== "BRIDGE") {
        window.fireBossAudioEngine.triggerBridge();
    }

    if (boss.hp <= 0) {
        boss.hp = 0;
        if (boss.state !== "FIRE_FINALE" && boss.state !== "DEFEATED") {
            boss.state = "FIRE_FINALE";
            boss.finaleSubStep = "PROMPT_F";
            boss.finaleTimer = 0;
            boss.rapierShattered = false;
            boss.rapierShards = [];
            boss.droppedStick = null;
            boss.domeDissolving = false;
            boss.domeDissolveProgress = 0;
            boss.invuln = 99999;
            boss.vx = 0;
            boss.vy = 0;
            boss.y = FLOOR - boss.height;

            let p = players[0];
            if (p) {
                let toRight = (p.x >= boss.x);
                boss.facingRight = toRight;
                p.facingRight = !toRight;
                p.x = boss.x + (toRight ? 95 : -95);
                p.y = boss.y - 32; // In front and slightly above
                p.vx = 0;
                p.vy = 0;
                p.isAttacking = true;
                p.attackTimer = 12; // Sword windup pose!
                p.invuln = 99999;
            }

            boss.prevFPressed = true;
            boss.prevXPressed = true;
            freezeFrames = 12; // Crisp dramatic impact stop frame
            playSound('parry');
            playSound('clash');
            triggerShake(10, 16);
            if (typeof fadeFireBossVolume === 'function') {
                fadeFireBossVolume(0.35, 400);
            }
            return true;
        }
    }

    return true;
}
window.tryDamageFireBoss = tryDamageFireBoss;

function updateRapierShards(b) {
    if (!b.rapierShards || b.rapierShards.length === 0) return;
    for (let i = b.rapierShards.length - 1; i >= 0; i--) {
        let s = b.rapierShards[i];
        s.vy += 0.35;
        s.x += s.vx;
        s.y += s.vy;
        s.angle += s.vRot;
        if (s.y >= FLOOR - 2) {
            s.y = FLOOR - 2;
            s.vx *= 0.5;
            s.vy = -s.vy * 0.3;
            s.vRot *= 0.5;
        }
        s.alpha -= 0.008;
        if (s.alpha <= 0) {
            b.rapierShards.splice(i, 1);
        }
    }
}

function drawRapierShards(shards) {
    if (!shards || shards.length === 0) return;
    ctx.save();
    for (let s of shards) {
        if (s.alpha <= 0) continue;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.globalAlpha = s.alpha;
        if (s.isFlame) {
            ctx.strokeStyle = "#ff7700";
            ctx.shadowColor = "#ff3300";
            ctx.shadowBlur = 8;
        } else {
            ctx.strokeStyle = "#e2e8f0";
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 6;
        }
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-s.len / 2, 0);
        ctx.lineTo(s.len / 2, 0);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

function updateDroppedStick(st) {
    if (!st || st.onFloor) return;
    st.vy += 0.38;
    st.x += st.vx;
    st.y += st.vy;
    st.angle += st.vRot;
    if (st.y >= FLOOR - 4) {
        st.y = FLOOR - 4;
        st.vy = -st.vy * 0.35;
        st.vx *= 0.6;
        st.vRot *= 0.5;
        if (Math.abs(st.vy) < 1) {
            st.onFloor = true;
            st.vy = 0;
            st.vx = 0;
            st.vRot = 0;
            st.angle = 0.2;
        }
    }
}

function drawDroppedStick(st) {
    if (!st) return;
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.angle);
    ctx.strokeStyle = "#854d0e";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(11, 0);
    ctx.stroke();
    // Leather grip wraps
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -2); ctx.lineTo(-5, 2);
    ctx.moveTo(3, -2); ctx.lineTo(3, 2);
    ctx.stroke();
    ctx.restore();
}

function drawFireBossKneeling(b, bodyColor, cloakColor, patternColor) {
    ctx.save();
    let facing = b.facingRight ? 1 : -1;
    let bcx = b.x + b.width / 2;
    let floorY = FLOOR || 520;
    let breath = Math.sin(Date.now() / 350) * 1.5;

    // Pelvis is low, resting near floor
    let pelvisX = bcx;
    let pelvisY = floorY - 18;

    // Rear leg: knee resting right on the floor behind him
    let kRearX = pelvisX - facing * 12;
    let kRearY = floorY - 2;
    let fRearX = pelvisX - facing * 22;
    let fRearY = floorY - 1;

    // Front leg: knee bent upright, foot planted firmly on floor
    let kFrontX = pelvisX + facing * 14;
    let kFrontY = floorY - 16;
    let fFrontX = pelvisX + facing * 14;
    let fFrontY = floorY - 1;

    // Spine: leaning slightly forward in respect / exhaustion
    let neckX = pelvisX + facing * 6;
    let neckY = pelvisY - 16 + breath;
    let shX = neckX;
    let shY = neckY + 2;

    // Head: slightly bowed forward
    let headX = neckX + facing * 5;
    let headY = neckY - 8;
    let headR = 7;

    // 1. Cloak draped over back and onto floor
    ctx.save();
    ctx.fillStyle = cloakColor;
    ctx.beginPath();
    ctx.moveTo(shX, shY);
    ctx.quadraticCurveTo(pelvisX - facing * 14, floorY - 20, pelvisX - facing * 24, floorY - 2);
    ctx.lineTo(pelvisX - facing * 4, floorY - 2);
    ctx.lineTo(shX, shY);
    ctx.closePath();
    ctx.fill();

    // Cloak gold embroidery pattern
    ctx.strokeStyle = patternColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(shX, shY + 4);
    ctx.quadraticCurveTo(pelvisX - facing * 12, floorY - 16, pelvisX - facing * 20, floorY - 3);
    ctx.stroke();
    ctx.restore();

    // 2. Rear leg (drawn behind)
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pelvisX, pelvisY);
    ctx.lineTo(kRearX, kRearY);
    ctx.lineTo(fRearX, fRearY);
    ctx.stroke();

    // 3. Front leg
    ctx.beginPath();
    ctx.moveTo(pelvisX, pelvisY);
    ctx.lineTo(kFrontX, kFrontY);
    ctx.lineTo(fFrontX, fFrontY);
    ctx.stroke();

    // 4. Spine
    ctx.beginPath();
    ctx.moveTo(neckX, neckY);
    ctx.lineTo(pelvisX, pelvisY);
    ctx.stroke();

    // 5. Arms
    // Front arm: resting forearm on front knee (honorable warrior resting pose)
    ctx.beginPath();
    ctx.moveTo(shX, shY);
    ctx.lineTo(kFrontX - facing * 2, kFrontY - 2);
    ctx.lineTo(kFrontX + facing * 4, kFrontY + 2);
    ctx.stroke();

    // Rear arm: resting down, hand touching or near the floor
    ctx.beginPath();
    ctx.moveTo(shX, shY);
    ctx.lineTo(pelvisX - facing * 4, floorY - 10);
    ctx.lineTo(pelvisX + facing * 2, floorY - 2);
    ctx.stroke();

    // 6. Head
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Visor glowing slit (dimmer, quiet ember)
    ctx.strokeStyle = patternColor;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = patternColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(headX, headY + 1);
    ctx.lineTo(headX + facing * 5, headY + 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 7. Soft drifting embers from his back (alive!)
    if (Math.random() < 0.25) {
        voidExplosions.push({
            x: neckX + (Math.random() - 0.5) * 12,
            y: neckY - 2,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -1.2 - Math.random() * 1.5,
            timer: 16,
            isWhite: false,
            isOrange: true,
            r: 4
        });
    }

    ctx.restore();
}

function drawFireFinalePrompt(p) {
    if (!boss || boss.state !== "FIRE_FINALE" || !p) return;
    if (boss.finaleSubStep !== "PROMPT_F" && boss.finaleSubStep !== "PROMPT_X") return;

    let isF = (boss.finaleSubStep === "PROMPT_F");
    let keyChar = isF ? "F" : "X";
    let subText = isF ? "Спецатака (сюрикен)" : "Атака (раскол шпаги)";
    let uiX = p.x + p.width / 2;
    let uiY = p.y - 42;

    ctx.save();
    ctx.textAlign = "center";

    // Pulsing glowing badge
    let pulse = 0.8 + 0.2 * Math.sin(Date.now() / 70);
    let boxW = 180;
    let boxH = 44;

    ctx.fillStyle = "rgba(10, 10, 18, 0.84)";
    ctx.strokeStyle = isF ? `rgba(0, 240, 255, ${pulse})` : `rgba(255, 110, 40, ${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = isF ? "#00ffff" : "#ff5500";
    ctx.shadowBlur = 14;

    ctx.beginPath();
    let rx = uiX - boxW / 2;
    let ry = uiY - boxH / 2;
    if (ctx.roundRect) {
        ctx.roundRect(rx, ry, boxW, boxH, 8);
    } else {
        ctx.rect(rx, ry, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    // Text: НАЖМИТЕ [ F ] or [ X ]
    ctx.font = "bold 15px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 0;
    ctx.fillText("НАЖМИТЕ", uiX - 22, uiY - 3);

    ctx.font = "bold 19px Arial";
    ctx.fillStyle = isF ? "#00ffff" : "#ff7733";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillText(`[ ${keyChar} ]`, uiX + 44, uiY - 2);

    // Subtext
    ctx.font = "11px Arial";
    ctx.fillStyle = "rgba(220, 235, 255, 0.9)";
    ctx.shadowBlur = 0;
    ctx.fillText(subText, uiX, uiY + 14);

    ctx.restore();
}

function updateFireBossFinale(p) {
    if (boss.finaleSubStep !== "BOSS_KNOCKBACK_AIR" && boss.finaleSubStep !== "BOSS_KNEEL") {
        boss.vx = 0;
        boss.vy = 0;
    }
    boss.invuln = 99999;
    p.invuln = 99999;

    let facing = boss.facingRight ? 1 : -1;
    let hx = boss.facingRight ? boss.x + boss.width - 4 : boss.x + 4;
    let hy = boss.y + 22;
    let pMidX = p.x + p.width / 2;
    let pMidY = p.y + p.height / 2;
    let angToWater = Math.atan2(pMidY - hy, pMidX - hx);
    let rTipX = hx + Math.cos(angToWater) * 44;
    let rTipY = hy + Math.sin(angToWater) * 44;

    boss.rapierTipX = rTipX;
    boss.rapierTipY = rTipY;
    boss.rapierAngle = angToWater;

    // Detect F / Special button (no heal consumed)
    let fPressed = isKeyPressed(['KeyF', 'f', 'F', 'а', 'А', 'ф', 'Ф']) || 
                   (p.keys && isKeyPressed(p.keys.special)) ||
                   (window.gamepads && window.gamepads[0] && (window.gamepads[0].buttons[4]?.pressed || window.gamepads[0].buttons[5]?.pressed)) ||
                   (typeof touchInputs !== 'undefined' && touchInputs.spec);

    // Detect X / Attack button
    let xPressed = isKeyPressed(['KeyX', 'x', 'X', 'ч', 'Ч']) || 
                   (p.keys && isKeyPressed(p.keys.attack)) ||
                   (window.gamepads && window.gamepads[0] && (window.gamepads[0].buttons[2]?.pressed || window.gamepads[0].buttons[3]?.pressed)) ||
                   (typeof touchInputs !== 'undefined' && touchInputs.atk);

    if (boss.finaleSubStep === "PROMPT_F") {
        p.vx = 0;
        p.vy = 0;
        p.attackTimer = 12; // Water frozen in sword windup pose
        p.isAttacking = true;

        if (fPressed && !boss.prevFPressed) {
            playSound('throw');
            triggerVibration('parry');
            boss.finaleShuriken = {
                startX: p.x + (p.facingRight ? p.width + 4 : -4),
                startY: p.y + 14,
                x: p.x + (p.facingRight ? p.width + 4 : -4),
                y: p.y + 14,
                targetX: rTipX - Math.cos(angToWater) * 5,
                targetY: rTipY - Math.sin(angToWater) * 5,
                t: 0,
                angle: 0
            };
            boss.finaleSubStep = "SHURIKEN_FLY";
        }
    }
    else if (boss.finaleSubStep === "SHURIKEN_FLY") {
        p.vx = 0;
        p.vy = 0;
        p.attackTimer = 12;
        p.isAttacking = true;

        if (boss.finaleShuriken) {
            boss.finaleShuriken.t += 0.034;
            let t = Math.min(1, boss.finaleShuriken.t);
            let easeT = Math.sin(t * Math.PI / 2);
            boss.finaleShuriken.x = boss.finaleShuriken.startX + (boss.finaleShuriken.targetX - boss.finaleShuriken.startX) * easeT;
            boss.finaleShuriken.y = boss.finaleShuriken.startY + (boss.finaleShuriken.targetY - boss.finaleShuriken.startY) * easeT;
            boss.finaleShuriken.angle += 0.35;

            if (Math.random() < 0.45) {
                voidExplosions.push({
                    x: boss.finaleShuriken.x,
                    y: boss.finaleShuriken.y,
                    vx: -Math.cos(angToWater) * 1.5,
                    vy: -Math.sin(angToWater) * 1.5,
                    timer: 14,
                    isWhite: true,
                    r: 6
                });
            }

            if (boss.finaleShuriken.t >= 1) {
                boss.finaleShuriken.t = 1;
                playSound('lightChime');
                boss.finaleSubStep = "PROMPT_X";
                boss.prevXPressed = true;
            }
        }
    }
    else if (boss.finaleSubStep === "PROMPT_X") {
        p.vx = 0;
        p.vy = 0;
        p.attackTimer = 12;
        p.isAttacking = true;

        if (boss.finaleShuriken) {
            boss.finaleShuriken.angle += 0.12;
        }

        if (xPressed && !boss.prevXPressed) {
            playSound('break');
            playSound('parry');
            playSound('slash');
            triggerShake(16, 22);
            triggerVibration('sa_hit');
            freezeFrames = 6;

            boss.rapierShattered = true;

            // Water spray burst
            if (boss.finaleShuriken) {
                for (let i = 0; i < 20; i++) {
                    voidExplosions.push({
                        x: boss.finaleShuriken.x,
                        y: boss.finaleShuriken.y,
                        vx: (Math.random() - 0.5) * 12,
                        vy: (Math.random() - 0.5) * 12,
                        timer: 24,
                        isWhite: true,
                        r: 16
                    });
                }
                boss.finaleShuriken = null;
            }

            // Shattered rapier shards
            boss.rapierShards = [];
            for (let i = 0; i < 16; i++) {
                let sFrac = i / 16;
                let sx = hx + Math.cos(angToWater) * (sFrac * 44);
                let sy = hy + Math.sin(angToWater) * (sFrac * 44);
                boss.rapierShards.push({
                    x: sx,
                    y: sy,
                    vx: (Math.random() - 0.5) * 10 + Math.cos(angToWater) * 3,
                    vy: -Math.random() * 7 - 2,
                    angle: Math.random() * Math.PI * 2,
                    vRot: (Math.random() - 0.5) * 0.4,
                    len: 5 + Math.random() * 8,
                    alpha: 1.0,
                    isFlame: (Math.random() < 0.4)
                });
            }

            boss.finaleSubStep = "WATER_SLASH";
            boss.finaleTimer = 24;
        }
    }
    else if (boss.finaleSubStep === "WATER_SLASH") {
        boss.finaleTimer--;
        let prog = 1 - (boss.finaleTimer / 24);
        p.attackTimer = Math.max(0, Math.floor((1 - prog) * 12));
        p.x += (p.facingRight ? 1 : -1) * 3.8;
        p.y = p.y + (FLOOR - p.height - p.y) * 0.12;

        updateRapierShards(boss);

        // Frame of decisive impact on Fire Boss
        if (boss.finaleTimer === 12) {
            playSound('hitBoss');
            playSound('slash');
            triggerShake(15, 22);
            triggerVibration('l_mode_final');

            for (let i = 0; i < 28; i++) {
                voidExplosions.push({
                    x: boss.x + boss.width / 2,
                    y: boss.y + 20,
                    vx: (Math.random() - 0.5) * 16,
                    vy: (Math.random() - 0.5) * 16,
                    timer: 32,
                    isWhite: Math.random() > 0.4,
                    isOrange: true,
                    r: 28
                });
            }

            // Launch Fire Boss into air away from Water!
            let kDir = (boss.x < p.x) ? -1 : 1;
            boss.vx = kDir * 11.5;
            boss.vy = -8.5;
            boss.y -= 8; // Lift off the ground!
            boss.facingRight = (kDir < 0);
            boss.airborneTimer = 0;
            boss.finaleSubStep = "BOSS_KNOCKBACK_AIR";
            boss.finaleTimer = 0;
        }
    }
    else if (boss.finaleSubStep === "BOSS_KNOCKBACK_AIR") {
        boss.airborneTimer = (boss.airborneTimer || 0) + 1;

        // Water finishes dash and returns to idle
        p.vx = 0;
        p.vy = 0;
        p.attackTimer = 0;
        p.isAttacking = false;
        p.y = FLOOR - p.height;

        // Fire Boss flying back through the air
        boss.vy += 0.44;
        boss.x += boss.vx;
        boss.y += boss.vy;

        // Arena boundaries
        boss.x = Math.max(120, Math.min(ARENA_W - 120, boss.x));

        updateRapierShards(boss);

        // Trailing air embers
        if (Math.random() < 0.6) {
            voidExplosions.push({
                x: boss.x + boss.width / 2,
                y: boss.y + 20,
                vx: -boss.vx * 0.25,
                vy: (Math.random() - 0.5) * 2,
                timer: 14,
                isWhite: false,
                isOrange: true,
                r: 10
            });
        }

        // Landing impact on arena floor: ONLY when falling downward and after minimum air time!
        if (boss.airborneTimer > 12 && boss.vy > 0 && boss.y >= FLOOR - boss.height) {
            boss.y = FLOOR - boss.height;
            boss.vy = 0;
            boss.vx = 0;

            playSound('parry');
            playSound('hitBoss');
            triggerShake(8, 14);
            triggerVibration('parry');

            // Ground impact dust & spark puff
            for (let i = 0; i < 16; i++) {
                voidExplosions.push({
                    x: boss.x + boss.width / 2 + (Math.random() - 0.5) * 24,
                    y: FLOOR,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 4 - 0.5,
                    timer: 18,
                    isWhite: Math.random() > 0.4,
                    isOrange: true,
                    r: 9
                });
            }

            // Wooden stick / hilt pops loose ONLY AFTER HE LANDS!
            let stickDir = (boss.facingRight ? 1 : -1);
            boss.droppedStick = {
                x: (boss.facingRight ? boss.x + boss.width - 2 : boss.x + 2),
                y: FLOOR - 14,
                vx: stickDir * (3.8 + Math.random() * 2),
                vy: -5.5,
                angle: 0.1,
                vRot: stickDir * 0.22,
                onFloor: false
            };

            // DOME STARTS DISSOLVING NOW!
            boss.domeDissolving = true;
            boss.domeDissolveProgress = 0;

            if (window.fireBossAudioEngine) {
                window.fireBossAudioEngine.triggerOutro();
            }
            playSound('lightChime');

            boss.finaleSubStep = "BOSS_KNEEL";
            boss.finaleTimer = 190;
        }
    }
    else if (boss.finaleSubStep === "BOSS_KNEEL") {
        boss.finaleTimer--;
        boss.vx *= 0.5;
        updateRapierShards(boss);

        if (boss.droppedStick) {
            updateDroppedStick(boss.droppedStick);
        }

        // Dissolve dome smoothly
        if (boss.domeDissolving) {
            boss.domeDissolveProgress = Math.min(1, (boss.domeDissolveProgress || 0) + 0.010);
            if (boss.domeDissolveProgress < 0.98 && Math.random() < 0.6) {
                let domeCx = 750, domeFloor = FLOOR || 520, domeRx = 700, domeRy = 480;
                let ang = Math.PI + Math.random() * Math.PI;
                voidExplosions.push({
                    x: domeCx + Math.cos(ang) * domeRx,
                    y: domeFloor + Math.sin(ang) * domeRy,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -2 - Math.random() * 3,
                    timer: 20,
                    isWhite: true,
                    r: 10
                });
            }
        }

        if (boss.finaleTimer <= 0) {
            boss.state = "DEFEATED";
            boss.stateTimer = 9999;
            p.invuln = 0;
            p.isAttacking = false;
            p.attackTimer = 0;
            p.y = FLOOR - p.height;
        }
    }

    boss.prevFPressed = fPressed;
    boss.prevXPressed = xPressed;
}

function updateFireBoss() {
    // Keep dropped stick animating even after victory
    if (boss.droppedStick && !boss.droppedStick.onFloor) {
        updateDroppedStick(boss.droppedStick);
    }

    // Keep dome dissolving smoothly until 100% complete even after victory
    if (boss.domeDissolving && (boss.domeDissolveProgress || 0) < 1) {
        boss.domeDissolveProgress = Math.min(1, (boss.domeDissolveProgress || 0) + 0.010);
        if (boss.domeDissolveProgress < 0.98 && Math.random() < 0.6) {
            let domeCx = 750, domeFloor = FLOOR || 520, domeRx = 700, domeRy = 480;
            let ang = Math.PI + Math.random() * Math.PI;
            voidExplosions.push({
                x: domeCx + Math.cos(ang) * domeRx,
                y: domeFloor + Math.sin(ang) * domeRy,
                vx: (Math.random() - 0.5) * 3,
                vy: -2 - Math.random() * 3,
                timer: 20,
                isWhite: true,
                r: 10
            });
        }
    }

    if (boss.rapierShards && boss.rapierShards.length > 0) {
        updateRapierShards(boss);
    }

    if (boss.state === "DEFEATED") {
        boss.vx = 0;
        boss.vy = 0;
        return;
    }

    let p = players[0]; // Duel: strictly 1 on 1 against Water
    if (!p) return;

    if (boss.state === "FIRE_FINALE") {
        updateFireBossFinale(p);
        return;
    }

    if (boss.flamingRapierTimer > 0) boss.flamingRapierTimer--;
    if (boss.lastBlockTimer > 0) boss.lastBlockTimer--;
    if (boss.fireHealCooldown > 0) boss.fireHealCooldown--;
    if (boss.invuln > 0) boss.invuln--;
    if (boss.fireParryCooldown > 0) boss.fireParryCooldown--;

    // Contact damage (body-to-body only: strictly matches stickman torso/legs)
    if (boss.state !== "FIRE_SILK_RUN" && boss.state !== "FIRE_INTRO" && boss.state !== "DEFEATED" && boss.state !== "FIRE_PARRY_COUNTER" && p.invuln <= 0) {
        let bBox = { x: boss.x + 3, y: boss.y + 4, width: boss.width - 6, height: boss.height - 4 };
        if (rectIntersect(bBox, p)) {
            takeDamage(p, 1);
        }
    }

    // INTRO STATE (1.5x slower: 225 frames / ~3.75s)
    if (boss.state === "FIRE_INTRO") {
        boss.introTimer = (boss.introTimer !== undefined) ? boss.introTimer - 1 : 224;
        boss.x = 420;
        boss.y = FLOOR - boss.height;
        boss.vx = 0;
        boss.vy = 0;
        boss.facingRight = true;
        p.x = 1080;
        p.y = FLOOR - p.height;
        p.vx = 0;
        p.vy = 0;
        p.facingRight = false;

        if (boss.introTimer <= 0) {
            boss.state = "FIRE_IDLE";
            boss.stateTimer = 35;
            if (typeof playFireBossMusic === 'function') playFireBossMusic();
        }
        return;
    }

    // STATE MACHINE
    boss.stateTimer--;

    // Physics (gravity and floor collision)
    if (boss.state !== "FIRE_SILK_RUN") {
        boss.vy += GRAVITY;
        boss.y += boss.vy;
        if (boss.y >= FLOOR - boss.height) {
            boss.y = FLOOR - boss.height;
            boss.vy = 0;
        }
        boss.x += boss.vx;
    }

    // Bounds clamp (inside curved white dome: 1.5x larger, Rx 700, Center 750, Ry 480)
    let domeRx = 700;
    let domeRy = 480;
    let domeFloor = FLOOR || 520;
    let domeCenterX = 750;
    let minX = domeCenterX - domeRx + 15;
    let maxX = domeCenterX + domeRx - boss.width - 15;
    if (boss.x < minX) { boss.x = minX; if (boss.vx < 0) boss.vx = 0; }
    if (boss.x > maxX) { boss.x = maxX; if (boss.vx > 0) boss.vx = 0; }
    let bdx = Math.abs((boss.x + boss.width / 2) - domeCenterX);
    let bNormX = Math.min(0.999, bdx / domeRx);
    let domeCeilY = domeFloor - domeRy * Math.sqrt(Math.max(0, 1 - bNormX * bNormX));
    if (boss.y < domeCeilY) {
        boss.y = domeCeilY;
        if (boss.vy < 0) boss.vy = 0;
    }

    if (Math.abs(boss.vx) > 0.2) {
        boss.walkDist = (boss.walkDist || 0) + Math.abs(boss.vx);
    }

    let dist = Math.abs((p.x + p.width/2) - (boss.x + boss.width/2));
    let dir = (p.x > boss.x) ? 1 : -1;

    switch (boss.state) {
        case "FIRE_IDLE":
            boss.facingRight = (dir > 0);
            boss.vx *= 0.80;

            if (boss.stateTimer <= 0) {
                // Decision logic (20% slower pacing for clearer combat read)
                // 1. Can heal? (<= 11 HP, cooldown ready, 40% chance)
                if (boss.hp <= 11 && boss.fireHealCooldown <= 0 && Math.random() < 0.40) {
                    boss.state = "FIRE_HEAL";
                    boss.stateTimer = 120;
                    boss.vx = 0;
                    playSound('heal');
                    break;
                }

                // 2. Can ignite flaming rapier buff? (not currently active, 32% chance)
                if (boss.flamingRapierTimer <= 0 && Math.random() < 0.32) {
                    boss.state = "FIRE_IGNITE_WEAPON";
                    boss.stateTimer = 22;
                    boss.vx = 0;
                    break;
                }

                // 3. Can enter active parry stance? (Rare tactical counter: 10% chance, 6-second cooldown)
                if (dist < 130 && (boss.fireParryCooldown || 0) <= 0 && Math.random() < 0.10) {
                    boss.state = "FIRE_PARRY_STANCE";
                    boss.stateTimer = 42; // ~0.7 seconds
                    boss.fireParryCooldown = 360; // 6 seconds before next parry!
                    boss.vx = 0;
                    playSound('parry');
                    break;
                }

                // 4. Can jump? (between normal and air jump height: vy ~ -10.5, 20% slower)
                if (Math.random() < 0.25 && boss.y >= FLOOR - boss.height - 2) {
                    boss.vy = -10.0 - Math.random() * 1.8;
                    boss.vx = dir * (2.8 + Math.random() * 2.8);
                    boss.stateTimer = 40;
                    playSound('wind');
                    break;
                }

                // 5. Can silk run? (reposition or dodge: invulnerable dash, 28% chance)
                if ((dist < 75 || dist > 420) && Math.random() < 0.28) {
                    boss.state = "FIRE_SILK_RUN";
                    boss.stateTimer = 24;
                    boss.silkDir = (dist < 75) ? -dir : dir;
                    boss.invuln = 28;
                    playSound('dash');
                    break;
                }

                // 6. Attacks (clear telegraphs + 20% reduced speed)
                if (dist < 130) {
                    let r = Math.random();
                    if (r < 0.50) {
                        boss.state = "FIRE_WALK_ATTACK";
                        boss.stateTimer = 36;
                        boss.attackHitDone = false;
                    } else if (r < 0.80) {
                        boss.state = "FIRE_SHIFT_DASH";
                        boss.stateTimer = 28;
                        boss.attackHitDone = false;
                    } else {
                        boss.state = "FIRE_LUNGE";
                        boss.stateTimer = 36;
                        boss.attackHitDone = false;
                    }
                } else if (dist < 380) {
                    let r = Math.random();
                    if (r < 0.45) {
                        boss.state = "FIRE_LUNGE";
                        boss.stateTimer = 36;
                        boss.attackHitDone = false;
                    } else if (r < 0.75) {
                        boss.state = "FIRE_SHIFT_DASH";
                        boss.stateTimer = 28;
                        boss.attackHitDone = false;
                    } else {
                        boss.state = "FIRE_WALK_ATTACK";
                        boss.stateTimer = 36;
                        boss.attackHitDone = false;
                    }
                } else {
                    // Approach player (20% slower: 3.3 vs 4.2)
                    boss.vx = dir * 3.3;
                    boss.stateTimer = 28;
                }
            }
            break;

        case "FIRE_WALK_ATTACK":
            boss.facingRight = (dir > 0);
            // Telegraph wind-up phase (first 14 frames): raises weapon, warning gleam
            if (boss.stateTimer > 22) {
                boss.vx = (boss.facingRight ? 1 : -1) * 1.0;
            } else {
                // Active swing phase (slowed by 20%: 3.0 vs 3.8)
                boss.vx = (boss.facingRight ? 1 : -1) * 3.0;
                if (boss.stateTimer >= 8 && !boss.attackHitDone) {
                    // Blade reach strictly matches the 50px visual rapier swing!
                    let atkRange = 50;
                    let atkBox = {
                        x: boss.facingRight ? boss.x + boss.width - 2 : boss.x - atkRange + 2,
                        y: boss.y + 4,
                        width: atkRange,
                        height: boss.height - 4
                    };
                    if (rectIntersect(atkBox, p) && p.invuln <= 0) {
                        boss.attackHitDone = true;
                        let isBuffed = (boss.flamingRapierTimer > 0);
                        let dmgAmt = isBuffed ? 2.0 : 1.5;
                        takeDamage(p, dmgAmt);
                        if (isBuffed && typeof addPlayerBurnGauge === 'function') {
                            addPlayerBurnGauge(p, 1);
                        }
                        playSound('slash');
                        triggerShake(5, 10);
                    }
                }
            }
            if (boss.stateTimer <= 0) {
                boss.state = "FIRE_IDLE";
                boss.stateTimer = 22 + Math.floor(Math.random() * 12);
            }
            break;

        case "FIRE_LUNGE":
            // Lunge: forward thrust on Key S (deals 1.5, +1 burn)
            // Clear Telegraph wind-up (first 18 frames): pulls back in thrust pose, tip sparks
            if (boss.stateTimer > 18) {
                boss.vx *= 0.6;
                boss.facingRight = (dir > 0);
            } else if (boss.stateTimer > 6) {
                // Active thrust (slowed by 20%: 12.8 vs 16.0)
                boss.vx = (boss.facingRight ? 1 : -1) * 12.8;
                if (!boss.attackHitDone) {
                    // Thrust box strictly matches forward thrust reach!
                    let lungeBox = {
                        x: boss.facingRight ? boss.x + 8 : boss.x - 52,
                        y: boss.y + 6,
                        width: boss.width + 48,
                        height: boss.height - 10
                    };
                    if (rectIntersect(lungeBox, p) && p.invuln <= 0) {
                        boss.attackHitDone = true;
                        let isBuffed = (boss.flamingRapierTimer > 0);
                        let dmgAmt = isBuffed ? 2.0 : 1.5;
                        takeDamage(p, dmgAmt);
                        if (typeof addPlayerBurnGauge === 'function') {
                            addPlayerBurnGauge(p, isBuffed ? 2 : 1);
                        }
                        playSound('dash');
                        playSound('slash');
                        triggerShake(7, 14);
                    }
                }
            } else {
                boss.vx *= 0.8;
            }
            if (boss.stateTimer <= 0) {
                boss.state = "FIRE_IDLE";
                boss.stateTimer = 24 + Math.floor(Math.random() * 12);
            }
            break;

        case "FIRE_SHIFT_DASH":
            // Dash / Shove on Shift: 0.5 dmg, knocks player back, +1 burn
            // Clear Telegraph wind-up (first 12 frames): crouch flame gathering
            if (boss.stateTimer > 16) {
                boss.vx *= 0.6;
            } else {
                // Active shove (slowed by 20%: 11.2 vs 14.0)
                boss.vx = (boss.facingRight ? 1 : -1) * 11.2;
                if (!boss.attackHitDone) {
                    // Shove box strictly matches dashing body!
                    let shoveBox = {
                        x: boss.x + 2,
                        y: boss.y + 4,
                        width: boss.width - 4,
                        height: boss.height - 4
                    };
                    if (rectIntersect(shoveBox, p) && p.invuln <= 0) {
                        boss.attackHitDone = true;
                        takeDamage(p, 0.5);
                        p.vx = (boss.facingRight ? 1 : -1) * 10;
                        if (typeof addPlayerBurnGauge === 'function') {
                            addPlayerBurnGauge(p, 1);
                        }
                        playSound('dash');
                        triggerShake(6, 12);
                    }
                }
            }
            if (boss.stateTimer <= 0) {
                boss.state = "FIRE_IDLE";
                boss.stateTimer = 22 + Math.floor(Math.random() * 10);
            }
            break;

        case "FIRE_IGNITE_WEAPON":
            boss.vx = 0;
            if (boss.stateTimer === 10) {
                boss.flamingRapierTimer = 450; // 7.5 seconds
                playSound('heatIgnite');
                triggerShake(8, 14);
                voidExplosions.push({
                    x: boss.x + boss.width / 2,
                    y: boss.y + boss.height / 2,
                    timer: 24,
                    isWhite: false,
                    isOrange: true,
                    r: 95
                });
            }
            if (boss.stateTimer <= 0) {
                boss.state = "FIRE_IDLE";
                boss.stateTimer = 12;
            }
            break;

        case "FIRE_PARRY_STANCE":
            boss.vx = 0;
            boss.facingRight = (dir > 0);
            if (boss.stateTimer <= 0) {
                boss.state = "FIRE_IDLE";
                boss.stateTimer = 14;
            }
            break;

        case "FIRE_PARRY_COUNTER":
            boss.vx = 0;
            // Phase 1: Windup (frames 44 to 30) - prepares the counter cut
            // Phase 2: Active SA1-style area tear (frames 29 to 14)
            if (boss.stateTimer === 29) {
                if (window.fireBossAudioEngine) {
                    window.fireBossAudioEngine.playParryRipSound();
                } else {
                    playSound('slash');
                }
                triggerShake(12, 18);
                triggerVibration('sa_hit');

                // 4 Intense fiery dimension rip lines through clashX, clashY
                let cx = boss.clashX || (boss.x + boss.width / 2);
                let cy = boss.clashY || (boss.y + 24);
                boss.parryRipLines = [
                    { x1: cx - 100, y1: cy - 70, x2: cx + 100, y2: cy + 70, color: "#ffffff", bloom: "#ff4400" },
                    { x1: cx + 90, y1: cy - 65, x2: cx - 90, y2: cy + 65, color: "#ffffff", bloom: "#ff7700" },
                    { x1: cx - 110, y1: cy - 5, x2: cx + 110, y2: cy + 5, color: "#fff0aa", bloom: "#ff2200" },
                    { x1: cx, y1: cy - 80, x2: cx, y2: cy + 80, color: "#ffffff", bloom: "#ffaa00" }
                ];
            }

            if (boss.stateTimer >= 14 && boss.stateTimer <= 29 && !boss.attackHitDone) {
                let cx = boss.clashX || (boss.x + boss.width / 2);
                let cy = boss.clashY || (boss.y + 24);
                let ripBox = {
                    x: cx - 85,
                    y: cy - 65,
                    width: 170,
                    height: 130
                };
                if (rectIntersect(ripBox, p) && p.invuln <= 0) {
                    boss.attackHitDone = true;
                    takeDamage(p, 1.5);
                    if (typeof addPlayerBurnGauge === 'function') {
                        addPlayerBurnGauge(p, 1);
                    }
                    let kDir = (p.x + p.width / 2 < cx) ? -1 : 1;
                    p.vx = kDir * 11;
                    triggerShake(8, 14);
                }
            }

            if (boss.stateTimer <= 0) {
                boss.state = "FIRE_IDLE";
                boss.stateTimer = 18;
                boss.parryRipLines = null;
            }
            break;

        case "FIRE_HEAL":
            boss.vx = 0;
            if (Math.random() < 0.4) {
                voidExplosions.push({
                    x: boss.x + Math.random() * boss.width,
                    y: boss.y + boss.height,
                    vy: -2,
                    timer: 16,
                    isWhite: true,
                    isOrange: true,
                    r: 12
                });
            }
            if (boss.stateTimer <= 0) {
                let healed = 3; // Guaranteed 100% 3 HP
                boss.hp = Math.min(boss.maxHp, boss.hp + healed);
                boss.fireHealCooldown = 600; // 10s cooldown
                playSound('heatIgnite');
                playSound('heal');
                triggerShake(14, 22);
                triggerVibration('sa_hit');

                let bMidX = boss.x + boss.width / 2;
                let bMidY = boss.y + boss.height / 2;
                let pMidX = p.x + p.width / 2;
                let pMidY = p.y + p.height / 2;
                let distToHeal = Math.hypot(pMidX - bMidX, pMidY - bMidY);
                if (distToHeal < 100 && p.invuln <= 0) {
                    takeDamage(p, 1);
                    if (typeof addPlayerBurnGauge === 'function') {
                        addPlayerBurnGauge(p, 1);
                    }
                    p.vx = (pMidX < bMidX ? -1 : 1) * 9;
                    p.vy = -4;
                }

                // Explosive outward radial flame blast:
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
                    let spd = 6 + Math.random() * 8;
                    voidExplosions.push({
                        x: bMidX,
                        y: bMidY,
                        vx: Math.cos(a) * spd,
                        vy: Math.sin(a) * spd,
                        timer: 24,
                        isWhite: Math.random() > 0.4,
                        isOrange: true,
                        r: 28
                    });
                }
                voidExplosions.push({
                    x: bMidX,
                    y: bMidY,
                    timer: 35,
                    isWhite: true,
                    isOrange: true,
                    r: 90
                });
                voidExplosions.push({
                    x: bMidX,
                    y: bMidY,
                    timer: 25,
                    isWhite: false,
                    isOrange: true,
                    r: 130
                });

                boss.state = "FIRE_IDLE";
                boss.stateTimer = 28;
            }
            break;

        case "FIRE_SILK_RUN":
            boss.vx = (boss.silkDir || dir) * 18;
            boss.x += boss.vx;
            if (Math.random() < 0.6) {
                voidExplosions.push({
                    x: boss.x + boss.width / 2,
                    y: boss.y + boss.height / 2,
                    timer: 10,
                    isWhite: true,
                    isOrange: true,
                    r: 20
                });
            }
            if (boss.stateTimer <= 0) {
                boss.state = "FIRE_IDLE";
                boss.stateTimer = 18;
            }
            break;

        case "FIRE_UPWARD_COUNTER":
            if (boss.stateTimer >= 10 && !boss.attackHitDone) {
                let upBox = {
                    x: boss.x - 20,
                    y: boss.y - 65,
                    width: boss.width + 40,
                    height: 75
                };
                if (rectIntersect(upBox, p) && p.invuln <= 0) {
                    boss.attackHitDone = true;
                    let isBuffed = (boss.flamingRapierTimer > 0);
                    takeDamage(p, isBuffed ? 2.0 : 1.5);
                    if (isBuffed && typeof addPlayerBurnGauge === 'function') {
                        addPlayerBurnGauge(p, 1);
                    }
                    playSound('slash');
                    triggerShake(6, 12);
                }
            }
            if (boss.stateTimer <= 0) {
                boss.state = "FIRE_IDLE";
                boss.stateTimer = 18;
            }
            break;

        default:
            boss.state = "FIRE_IDLE";
            boss.stateTimer = 20;
            break;
    }
}
window.updateFireBoss = updateFireBoss;

function drawFireBoss() {
    ctx.save();

    let facing = boss.facingRight ? 1 : -1;
    let bcx = boss.x + boss.width / 2;
    let bcy = boss.y + boss.height / 2;
    let isBuffed = (boss.flamingRapierTimer > 0);
    let isParry = (boss.state === "FIRE_PARRY_STANCE");
    let isHeal = (boss.state === "FIRE_HEAL");
    let isSilk = (boss.state === "FIRE_SILK_RUN");
    let isDefeated = (boss.state === "DEFEATED");
    let isFinale = (boss.state === "FIRE_FINALE");
    let isKneeling = (isFinale && boss.finaleSubStep === "BOSS_KNEEL") || isDefeated;
    let isAirKnockback = (isFinale && boss.finaleSubStep === "BOSS_KNOCKBACK_AIR");

    if (isSilk) {
        ctx.globalAlpha = 0.45;
    }

    let cloakColor = isKneeling ? "#991b1b" : "#bb1b00";
    let patternColor = isKneeling ? "#f97316" : "#ff7700";
    let bodyColor = isKneeling ? "#ea580c" : "#ff5500";

    if (isKneeling) {
        // Honorable defeated kneeling posture (alive, breathing, resting on one knee!)
        drawFireBossKneeling(boss, bodyColor, cloakColor, patternColor);
    } else {
        // 1. Flowing Cloth-Physics Cloak (identical to playable Fire character)
        ctx.save();
        let trailDir = boss.facingRight ? -1 : 1;
        let runSpeed = Math.abs(boss.vx);
        let velLagX = -boss.vx * 3.5;
        let velLagY = -boss.vy * 1.8;
        let waveTime = Date.now() / 110 + 2.5;

        let flutter1 = Math.sin(waveTime) * (5 + runSpeed * 1.5);
        let flutter2 = Math.cos(waveTime * 1.4) * (6 + runSpeed * 1.8);
        let flap = Math.sin(waveTime * 1.8) * (4 + runSpeed);

        let anchorX = boss.facingRight ? boss.x + 8 : boss.x + boss.width - 8;
        let shoulderX = anchorX;
        let shoulderY = boss.y + 10;

        let tipX = anchorX + (trailDir * (24 + runSpeed * 4)) + (velLagX * 0.5) + flutter1;
        let tipY = boss.y + boss.height + flutter2 * 0.8 + (velLagY * 0.4);
        let midX = anchorX + (trailDir * (28 + runSpeed * 4.5)) + (velLagX * 0.6) + flutter2;
        let midY = boss.y + 24 + flutter1 * 0.7;
        let hemMidX = anchorX + (trailDir * (13 + runSpeed * 2)) + flap;
        let hemMidY = boss.y + boss.height - 2 - flap * 0.5;

        // Cloak shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 2);
        ctx.quadraticCurveTo(midX * 0.9, midY, tipX - trailDir * 4, tipY);
        ctx.quadraticCurveTo(hemMidX, hemMidY + 2, anchorX, boss.y + boss.height);
        ctx.closePath();
        ctx.fill();

        // Cloak main fabric
        ctx.fillStyle = cloakColor;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.quadraticCurveTo(shoulderX + (trailDir * (13 + runSpeed * 2)), shoulderY + 4 + flap, midX, midY);
        ctx.quadraticCurveTo(midX + trailDir * 4, midY + (boss.height * 0.4), tipX, tipY);
        ctx.quadraticCurveTo(hemMidX, hemMidY, anchorX, boss.y + boss.height - 4);
        ctx.lineTo(shoulderX, shoulderY);
        ctx.closePath();
        ctx.fill();

        // Patterns on cloak
        ctx.strokeStyle = patternColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shoulderX + (trailDir * 4), shoulderY + 6);
        ctx.quadraticCurveTo(midX - (trailDir * 4), midY + 4, tipX - (trailDir * 3), tipY - 4);
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(shoulderX + (trailDir * 7), shoulderY + 12);
        ctx.quadraticCurveTo(midX - (trailDir * 8), midY + 12, hemMidX, hemMidY - 3);
        ctx.stroke();
        ctx.restore();

        // 2. Articulated Stickman Body (Playable Character Model!)
        let bossP = {
            x: boss.x,
            y: boss.y,
            width: boss.width,
            height: boss.height,
            facingRight: boss.facingRight,
            vx: boss.vx,
            vy: boss.vy,
            walkDist: boss.walkDist || 0,
            isDashing: (boss.state === "FIRE_SILK_RUN" || boss.state === "FIRE_SHIFT_DASH"),
            attackTimer: (boss.state === "FIRE_WALK_ATTACK" || boss.state === "FIRE_LUNGE" || boss.state === "FIRE_UPWARD_COUNTER") ? 8 : 0,
            onGround: (boss.y >= FLOOR - boss.height - 2),
            type: 'FIRE',
            color: bodyColor,
            bananaSkin: false,
            gnomeSkin: false
        };

        if (isAirKnockback) {
            ctx.save();
            ctx.translate(bcx, bcy);
            ctx.rotate(facing * -0.28);
            ctx.translate(-bcx, -bcy);
        }

        if (typeof drawStickmanBody === 'function') {
            drawStickmanBody(bossP, bodyColor, cloakColor, patternColor);
        }

        if (isAirKnockback) {
            ctx.restore();
        }
    }

    // 3. Flaming Rapier Blade Effect
    let hx = boss.facingRight ? boss.x + boss.width - 6 : boss.x + 6;
    let hy = boss.y + 24;
    let rTipX = hx + facing * (boss.state === "FIRE_LUNGE" ? 52 : 36);
    let rTipY = hy;
    if (boss.state === "FIRE_UPWARD_COUNTER") {
        rTipX = hx + facing * 18;
        rTipY = boss.y - 18;
    } else if (isParry) {
        rTipX = hx + facing * 12;
        rTipY = boss.y + 6;
    }

    // Interactive finale rapier pointing straight at Water
    if (isFinale && !boss.rapierShattered) {
        let p = players[0];
        let pMidX = p ? (p.x + p.width / 2) : (hx + facing * 80);
        let pMidY = p ? (p.y + p.height / 2) : (hy - 30);
        let angToWater = Math.atan2(pMidY - hy, pMidX - hx);
        rTipX = hx + Math.cos(angToWater) * 44;
        rTipY = hy + Math.sin(angToWater) * 44;

        ctx.save();
        // Guard
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Silver steel blade
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(rTipX, rTipY);
        ctx.stroke();

        // Gleaming star at tip
        let glint = 4 + Math.sin(Date.now() / 60) * 2;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(rTipX, rTipY, glint, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if (isBuffed && !boss.rapierShattered && !isKneeling) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 120, 0, 0.9)";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#ff3b00";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(rTipX, rTipY);
        ctx.stroke();

        let sparkR = 4 + Math.sin(Date.now() / 50) * 2;
        ctx.fillStyle = "#ffcc00";
        ctx.beginPath();
        ctx.arc(rTipX, rTipY, sparkR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 4. CLEAR ATTACK TELEGRAPHS
    // Lunge telegraph wind-up (spark glint on rapier tip + trajectory hint line)
    if (boss.state === "FIRE_LUNGE" && boss.stateTimer > 18) {
        ctx.save();
        let glintPulse = 6 + Math.sin(Date.now() / 40) * 3;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ff7700";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(rTipX, rTipY, glintPulse, 0, Math.PI * 2);
        ctx.fill();

        // Warning trajectory line
        ctx.strokeStyle = "rgba(255, 100, 0, 0.55)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(rTipX, rTipY);
        ctx.lineTo(rTipX + facing * 140, rTipY);
        ctx.stroke();
        ctx.restore();
    }

    // Shift Dash telegraph wind-up (flames swirling around crouched body)
    if (boss.state === "FIRE_SHIFT_DASH" && boss.stateTimer > 16) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 80, 0, 0.75)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff3b00";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        let rad = 24 + Math.sin(Date.now() / 50) * 4;
        ctx.arc(bcx, bcy, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Walk attack swing warning arc
    if (boss.state === "FIRE_WALK_ATTACK" && boss.stateTimer > 22) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 150, 0, 0.65)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#ffaa00";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(hx, hy, 45, boss.facingRight ? -Math.PI / 3 : Math.PI * 0.8, boss.facingRight ? Math.PI / 3 : Math.PI * 1.3);
        ctx.stroke();
        ctx.restore();
    }

    // Parry Stance glowing shield aura & chime
    if (isParry) {
        let pPulse = 0.6 + 0.3 * Math.sin(Date.now() / 50);
        ctx.save();
        ctx.strokeStyle = `rgba(255, 170, 0, ${pPulse})`;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = "#ff6600";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(bcx + facing * 8, bcy, 36, -Math.PI / 2, Math.PI / 2, !boss.facingRight);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 200, 50, ${pPulse * 0.25})`;
        ctx.fill();
        ctx.restore();
    }

    // Heal warning text and rising flame spirals
    if (isHeal) {
        let t = Date.now();
        for (let i = 0; i < 4; i++) {
            let spiralX = bcx + Math.sin(t / 120 + i * 1.5) * 22;
            let spiralY = boss.y + boss.height - ((t / 8 + i * 25) % 60);
            ctx.fillStyle = "rgba(255, 140, 20, 0.85)";
            ctx.beginPath();
            ctx.arc(spiralX, spiralY, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.save();
        ctx.font = "bold 13px Arial";
        ctx.fillStyle = "#ffcc00";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ff3300";
        ctx.shadowBlur = 8;
        ctx.fillText("⚠️ ВОССТАНОВЛЕНИЕ!", bcx, boss.y - 12);
        ctx.restore();
    }

    // 5. Active Weapon Slash Curves (Strictly matches hitboxes!)
    // Walk attack active swing arc
    if (boss.state === "FIRE_WALK_ATTACK" && boss.stateTimer <= 22 && boss.stateTimer >= 8) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 120, 0, 0.9)";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#ff3b00";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        let sStart = boss.facingRight ? -Math.PI / 3 : Math.PI * 0.7;
        let sEnd = boss.facingRight ? Math.PI / 3 : Math.PI * 1.3;
        ctx.arc(hx, hy, 48, sStart, sEnd);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    // Lunge active piercing thrust trail
    if (boss.state === "FIRE_LUNGE" && boss.stateTimer <= 18 && boss.stateTimer > 6) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 140, 0, 0.85)";
        ctx.lineWidth = 6;
        ctx.shadowColor = "#ff4400";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(hx - facing * 10, hy);
        ctx.lineTo(rTipX, rTipY);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(rTipX, rTipY);
        ctx.stroke();
        ctx.restore();
    }

    // 6. SA1-STYLE PARRY COUNTER AREA TEAR (Разрыв области)
    if (boss.state === "FIRE_PARRY_COUNTER") {
        let cx = boss.clashX || bcx;
        let cy = boss.clashY || (boss.y + 24);
        ctx.save();

        // Phase 1: Windup warning (frames 44 to 30) - blade tip cross glint & gathering sparks
        if (boss.stateTimer > 29) {
            let prog = (44 - boss.stateTimer) / 14;
            let starR = 8 + prog * 10;
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#ff7700";
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(cx, cy, starR, 0, Math.PI * 2);
            ctx.fill();

            // Concentric shock ring gathering
            ctx.strokeStyle = `rgba(255, 120, 0, ${prog * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 70 * (1 - prog * 0.5), 0, Math.PI * 2);
            ctx.stroke();
        }
        // Phase 2: Active Tear & Slits (frames 29 to 0)
        else {
            let fadeAlpha = Math.min(1, boss.stateTimer / 12);
            ctx.globalAlpha = fadeAlpha;

            // Fiery speed lines radiating from center
            ctx.strokeStyle = "rgba(255, 180, 50, 0.4)";
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 12; i++) {
                let ang = (i / 12) * Math.PI * 2 + (boss.stateTimer * 0.05);
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(ang) * 15, cy + Math.sin(ang) * 15);
                ctx.lineTo(cx + Math.cos(ang) * 110, cy + Math.sin(ang) * 110);
                ctx.stroke();
            }

            // Dimensional slash cuts (SA1 style)
            if (boss.parryRipLines) {
                for (let rip of boss.parryRipLines) {
                    // Outer fiery bloom
                    ctx.save();
                    ctx.strokeStyle = rip.bloom;
                    ctx.lineWidth = 14;
                    ctx.shadowColor = rip.bloom;
                    ctx.shadowBlur = 25;
                    ctx.beginPath();
                    ctx.moveTo(rip.x1, rip.y1);
                    ctx.lineTo(rip.x2, rip.y2);
                    ctx.stroke();

                    // Sharp white core incision
                    ctx.strokeStyle = rip.color;
                    ctx.lineWidth = 3.5;
                    ctx.shadowColor = "#ffffff";
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.moveTo(rip.x1, rip.y1);
                    ctx.lineTo(rip.x2, rip.y2);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Central explosive flash
            let coreR = Math.max(0, (boss.stateTimer - 14) * 3);
            if (coreR > 0) {
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "#ff5500";
                ctx.shadowBlur = 24;
                ctx.beginPath();
                ctx.arc(cx, cy, Math.min(28, coreR), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // 7. FINALE ARTIFACTS & PROMPTS
    // Dropped wooden stick / hilt on arena floor (visible during and after finale!)
    if (boss.droppedStick) {
        drawDroppedStick(boss.droppedStick);
    }

    // Flying / scattered rapier shards
    if (boss.rapierShards && boss.rapierShards.length > 0) {
        drawRapierShards(boss.rapierShards);
    }

    // Cinematic Water Shuriken during QTE
    if (isFinale && boss.finaleShuriken) {
        let sh = boss.finaleShuriken;
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.angle || (Date.now() / 30));
        ctx.fillStyle = "#00e5ff";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            let a = (i * Math.PI) / 2;
            ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
            ctx.lineTo(Math.cos(a + Math.PI / 4) * 3.5, Math.sin(a + Math.PI / 4) * 3.5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Interactive QTE Prompt: НАЖМИТЕ [ F ] or [ X ]
    if (isFinale) {
        let p = players[0];
        if (p) {
            drawFireFinalePrompt(p);
        }
    }

    ctx.restore();
}
window.drawFireBoss = drawFireBoss;

window.drawBoss = drawBoss;
window.drawBossStickmanFigure = drawBossStickmanFigure;
window.getBossAttackHintColor = getBossAttackHintColor;
window.drawRapier = drawRapier;

