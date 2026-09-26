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
    if (boss.invuln > 0 || boss.state === "DEFEATED" || boss.state.startsWith("CINEMATIC") || boss.state.startsWith("TELEPORT") || boss.state === "L_CLIMB_START" || boss.state === "L_CLIMB_ACTIVE" || boss.state === "VOID_SINK_STUN" || boss.state === "L_PHASE4_ORBS" || boss.state === "L_PHASE4_FALL") return false;

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
    boss.hp -= finalDmg;
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
            boss.lPhase4AttackTimer = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.bossSpeed) ? 135 : 180;
            boss.lPhase4Orbs = [
                { x: 260, y: FLOOR - 90, r: 24, alive: true },
                { x: ARENA_W - 260, y: FLOOR - 90, r: 24, alive: true }
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
        let attackInterval = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.bossSpeed) ? 135 : 180;
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
            let allPressed = players.every(p => p.hasPressedTie || p.isDowned || p.hp <= 0); 
            if (allPressed) { 
                boss.state = "CINEMATIC_TYING"; 
                boss.color = "white"; 
                boss.stateTimer = 90; 
                playSound('wind'); 
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
        if (boss.state === "TIED_BLEED" && boss.stateTimer % 30 === 0) { 
            let dmg = 0.5; 
            boss.hp -= dmg; 
            playSound('hitBoss'); 
            checkPhaseTransition(); 
        }
        if (boss.stateTimer <= 0) { 
            boss.state = "IDLE"; 
            boss.color = "#e6c800"; 
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
                                triggerCinematic("SA1", p, true); 
                                boss.sa1Arr = null; // Очищаем фантомов, чтобы не было повторных ударов
                                break;
                            } 
                        }
                    }
                    if (ph && ph.timer > ph.startDelay + 52) ph.active = false;
                }
                if (!boss.sa1Arr) break;
            }
        }
        if ((allDone || boss.stateTimer <= 0) && !activeCinematic) { 
            // Больше никакого удара строго вниз по игроку!
            // Босс плавно появляется на арене в случайном месте вершины:
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

                if (Math.abs(boss.x - nearestP.x) > 400 && boss.phase >= 2 && Math.random() < 0.5) { 
                    boss.state = "TELEPORT_OUT"; boss.stateTimer = 10; playSound('wind'); 
                } else if (playerRunningAway && boss.phase >= 2 && Math.random() < 0.05) { 
                    boss.state = "TELEPORT_OUT"; boss.stateTimer = 10; playSound('wind'); 
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
                            else if (rand < 0.72) { boss.state = "CAST_WIND"; boss.stateTimer = 30 * phaseMultiplier; boss.vx = 0; boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.82) { boss.state = "FEINT_WINDUP"; boss.stateTimer = 20 * phaseMultiplier; boss.attackDir = boss.x < nearestP.x ? 1 : -1; boss.directAttackActive = true; boss.color = "#aaaaaa"; }
                            else { boss.state = "LUNGE_WINDUP"; boss.stateTimer = 15 * phaseMultiplier; boss.comboCount = 0; boss.attackDir = (Math.random() < 0.3 && boss.y > FLOOR - 50) ? "UP" : (boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"); boss.directAttackActive = true; boss.color = "#ff3333"; }
                        } else if (boss.phase === 2) {
                            if (rand < 0.30) { boss.state = "VOID_PORTALS"; boss.stateTimer = 90; boss.color = "#9900ff"; }
                            else if (onGround && rand < 0.45) { boss.state = "VOID_FLOOR_WARN"; boss.stateTimer = 180; boss.color = "#9900ff"; }
                            else if (globalWindCooldown <= 0 && globalWindMode === "NONE" && rand < 0.60) { boss.state = "CAST_VERTICAL_WIND"; boss.stateTimer = 40; playSound('wind'); boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < teleChance + 0.45) { boss.state = "TELEPORT_OUT"; boss.stateTimer = 15; playSound('wind'); }
                            else if (rand < 0.65) { boss.state = "WIND_FLY"; boss.stateTimer = 15; playSound('wind'); applyPhysicsPushToLeaves(boss.x + 15, boss.y + 50, 10); boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.75) { boss.state = "CAST_WIND"; boss.stateTimer = 30 * phaseMultiplier; boss.vx = 0; boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.85) { boss.state = "FEINT_WINDUP"; boss.stateTimer = 20 * phaseMultiplier; boss.attackDir = boss.x < nearestP.x ? 1 : -1; boss.directAttackActive = true; boss.color = "#aaaaaa"; }
                            else { boss.state = "LUNGE_WINDUP"; boss.stateTimer = 15 * phaseMultiplier; boss.comboCount = 0; boss.attackDir = (Math.random() < 0.3 && boss.y > FLOOR - 50) ? "UP" : (boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"); boss.directAttackActive = true; boss.color = "#ff3333"; }
                        } else {
                            if (rand < 0.30) { boss.state = "WIND_FLY"; boss.stateTimer = 15; playSound('wind'); applyPhysicsPushToLeaves(boss.x + 15, boss.y + 50, 10); boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.50) { boss.state = "CAST_WIND"; boss.stateTimer = 30 * phaseMultiplier; boss.vx = 0; boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.70) { boss.state = "FEINT_WINDUP"; boss.stateTimer = 20 * phaseMultiplier; boss.attackDir = boss.x < nearestP.x ? 1 : -1; boss.directAttackActive = true; boss.color = "#aaaaaa"; }
                            else { boss.state = "LUNGE_WINDUP"; boss.stateTimer = 15 * phaseMultiplier; boss.comboCount = 0; boss.attackDir = (Math.random() < 0.3 && boss.y > FLOOR - 50) ? "UP" : (boss.x < nearestP.x ? "HORIZONTAL_R" : "HORIZONTAL_L"); boss.directAttackActive = true; boss.color = "#ff3333"; }
                        }
                    } else {
                        if (boss.phase >= 2 && globalWindCooldown <= 0 && globalWindMode === "NONE" && rand < 0.15) { boss.state = "CAST_VERTICAL_WIND"; boss.stateTimer = 40; playSound('wind'); boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#00ffff"; }
                        else if (boss.phase >= 2 && rand < teleChance + 0.15) { boss.state = "TELEPORT_OUT"; boss.stateTimer = 15; playSound('wind'); }
                        else if (boss.phase >= 2 && rand < 0.30) { boss.state = "VOID_PORTALS"; boss.stateTimer = 90; boss.color = "#9900ff"; }
                        else if (rand < 0.40) { boss.state = "SCARF_WINDUP"; boss.stateTimer = 20 * phaseMultiplier; boss.attackDir = boss.x < nearestP.x ? 1 : -1; scarf.target = nearestP; boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#ff3333"; } 
                        else if (rand < 0.50) { boss.state = "WIND_FLY"; boss.stateTimer = 15; playSound('wind'); applyPhysicsPushToLeaves(boss.x + 15, boss.y + 50, 10); boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#00ffff"; }
                        else if (rand < 0.60) { boss.state = "CAST_WIND"; boss.stateTimer = 30 * phaseMultiplier; boss.vx = 0; boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#00ffff"; }
                        else if (onGround && rand < 0.70) { boss.state = "VULN_STANCE"; boss.stateTimer = 60 * phaseMultiplier; boss.color = "#ff8800"; }
                        else if (onGround && rand < 0.80) { boss.state = "PARRY_STANCE"; boss.stateTimer = 60; boss.flashTimer = 5; boss.color = "#aaaaaa"; }
                        else if (rand < 0.90) { boss.state = "FEINT_WINDUP"; boss.stateTimer = 20 * phaseMultiplier; boss.attackDir = boss.x < nearestP.x ? 1 : -1; boss.directAttackActive = true; boss.directAttackHit = false; boss.color = "#aaaaaa"; }
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
                if (boss.stateTimer === Math.floor(30 * phaseMultiplier)) {
                    if (boss.voidWindDisabled <= 0) playSound('wind');
                }
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 20; } 
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
                if (boss.stateTimer <= 0) {
                    let targetP = getNearestPlayer(boss.x);
                    let spawnNearX = targetP ? targetP.x + (Math.random() < 0.5 ? -140 : 140) : (boss.climbCenterX || ARENA_W/2);
                    boss.x = Math.max(60, Math.min(ARENA_W - 80, spawnNearX));
                    boss.y = FLOOR - boss.height;
                    boss.state = "IDLE"; boss.stateTimer = 20; boss.color = "#e6c800";
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
    if (boss.state.startsWith("L_CLIMB") || ["WIND_FLY", "VULN_STANCE", "VULN_LATE", "PARRY_STANCE", "PARRY_COUNTER_WINDUP", "TRANSITION", "PARRY_DASH", "HEAL_PUNISH_DASH", "CAST_WIND", "CAST_VERTICAL_WIND", "SCARF_SHOOT", "SCARF_PULL", "SCARF_WINDUP", "TELEPORT_OUT", "TELEPORT_IN", "TIED", "TIED_BLEED", "SHARPEN_WINDUP", "EXECUTE_QUEUE", "SA1_WINDUP", "SA1_ACTIVE", "SA2_WINDUP", "SA3_WINDUP", "SA2_DOUBLE", "SA2_TRIPLE", "SA2_SA3_COMBO", "SA2_TRIPLE_SA3_COMBO", "SA_EXECUTE", "VOID_PORTALS", "SA1_SLAM_WINDUP", "L_HEAL", "L_INTRO_FALL", "L_INTRO_RISE", "L_PHASE3_RISE", "L_SCREAM", "HIDDEN_PAUSE", "VOID_SINK_STUN"].includes(boss.state) || (boss.state === "LUNGE" && boss.attackDir === "UP") || boss.state.startsWith("CINEMATIC")) {
        applyBossGravity = false; 
        boss.vy = 0; 
    }
    if (boss.state === "SA1_SLAM") {
        applyBossGravity = false; // не обнуляем boss.vy, босс летит вниз со скоростью 35!
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
        if (boss.vy >= 0 && !["SA1_SLAM", "L_INTRO_FALL"].includes(boss.state)) {
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
    if (boss.y + boss.height > bossFloorLimit && !boss.state.startsWith("L_INTRO") && boss.state !== "L_PHASE3_RISE" && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB")) { 
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
        if (!p.isDowned && p.hp > 0 && rectIntersect(p, bossDmgHitbox) && boss.state !== "TRANSITION" && p.invuln <= 0 && !boss.halfHpSeqActive && boss.state !== "EXECUTE_QUEUE" && !boss.state.startsWith("SA") && !boss.state.startsWith("TELEPORT") && !boss.state.startsWith("CINEMATIC") && !boss.state.startsWith("L_INTRO") && !boss.state.startsWith("L_PHASE3") && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB") && boss.state !== "VOID_SINK_STUN") {
            let dmg = (secretMode ? 2 : 1) + boss.damageBonus; 
            if (boss.state === "LUNGE" || boss.state === "LUNGE_WINDUP" || boss.state.startsWith("FEINT_DASH") || boss.state === "HEAL_PUNISH_DASH" || boss.state === "SCARF_SHOOT") { 
                dmg = (secretMode ? 2 : 1.5) + boss.damageBonus; 
                applyBleed(p); 
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

function drawBoss() {
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
        ctx.shadowBlur = 10;
        let hintKey = (players[0] && players[0].inputType === 'KEYBOARD_SHOOTER') ? "ЛКМ+ПКМ" : "Shift";
        ctx.fillText(`Примените кинжал света (${hintKey})!`, boss.x + boss.width/2, boss.y - 18);
        ctx.restore();
    } else if (!boss.halfHpSeqActive && boss.x > -1000 && boss.state !== "SA1_ACTIVE" && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB")) {
        ctx.fillStyle = getBossColor(boss.color);
        ctx.globalAlpha = (boss.invuln > 0 && Math.floor(Date.now() / 50) % 2 === 0) ? 0.5 : 1.0;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        
        // --- БОСС: ЧЕРНЫЙ ШАРФ И ЖЕЛТЫЙ ПЛАЩ С ОРАНЖЕВЫМИ УЗОРАМИ ---
        ctx.save();
        let isStunColor = (boss.state === "BOSS_STUNNED" || boss.state === "L_PHASE4_STUNNED");
        let bCloakColor = (secretMode && !isStunColor) ? "#4a3c00" : "#e6c800";
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
            if (!p.hasPressedTie && !p.isDowned && p.hp > 0) { 
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
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; 
        ctx.fill(); 
        ctx.strokeStyle = "cyan"; 
        ctx.lineWidth = 4; 
        ctx.stroke(); 
        clashFlash.timer--; 
    }
}
