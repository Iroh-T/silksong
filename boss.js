// --- BOSS (LACE) MODULE ---

function getBossColor(c) {
    if (boss.lightInfected > 0 || boss.hunterInfected > 0 || boss.infectedTimer > 0) return "#00ffff"; 
    if (!secretMode) return c;
    if (boss.state === "SA1_ACTIVE") return "#ff8800"; 
    if (c === '#e6c800') return '#665500'; 
    if (c === '#ff3333') return '#660000'; 
    if (c === '#00ffff') return '#006666'; 
    if (c === '#ff8800') return '#884400'; 
    if (c === '#aaaaaa') return '#444444'; 
    return c;
}

function tryDamageBoss(dmg, sourcePlayer) {
    if (boss.invuln > 0 || boss.state === "DEFEATED" || boss.state.startsWith("CINEMATIC") || boss.state.startsWith("TELEPORT") || boss.state === "L_CLIMB_START" || boss.state === "L_CLIMB_ACTIVE" || boss.state === "VOID_SINK_STUN") return false;

    if (boss.state === "PARRY_STANCE") {
        boss.state = "PARRY_COUNTER_WINDUP";
        boss.stateTimer = 6; 
        boss.flashTimer = 15; 
        boss.attackDir = boss.x < (sourcePlayer ? sourcePlayer.x : ARENA_W/2) ? 1 : -1;
        playSound('parry');
        return true; 
    }

    if (boss.state === "VULN_STANCE") {
        boss.hp -= 3 * (sourcePlayer ? sourcePlayer.dmgDealtMod : 1);
        boss.state = "HIDDEN_PAUSE";
        boss.stateTimer = 120;
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

function triggerCinematic(type, targetPlayer, isRealHit = true) {
    if (type === "SA1") activeCinematic = { type: 'SA1', p: targetPlayer, timer: 90, tick: 0, isReal: isRealHit };
    else if (type === "SA2") activeCinematic = { type: 'SA2', p: targetPlayer, timer: 90, tick: 0 };
    else if (type === "SA3") activeCinematic = { type: 'SA3', p: targetPlayer, timer: 120, tick: 0 };
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
    if (boss.hp <= 0 && boss.state !== "DEFEATED" && !boss.state.startsWith("CINEMATIC") && boss.state !== "FREE_ROAM") {
        boss.hp = 0;
        if (secretMode && boss.phase >= 3) {
            let bgm = document.getElementById("lModeMusic"); 
            if (bgm) bgm.pause();
            triggerVibration('l_mode_final'); 
            boss.state = "FREE_ROAM"; 
            for (let i = 0; i < 40; i++) {
                voidExplosions.push({
                    x: boss.x + 15, 
                    y: boss.y + 25, 
                    vx: (Math.random() - 0.5) * 20, 
                    vy: (Math.random() - 0.5) * 20, 
                    timer: 60, 
                    isWhite: Math.random() > 0.5
                });
            }
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
    boss.x = -99999;
    boss.y = -99999; 
    boss.vx = 0; 
    boss.vy = 0; 

    // Очищаем арену от снарядов и ловушек
    airBlades = []; playerDaggers = []; blackDaggers = []; p2Traps = []; phantoms = []; 
    airTraps = []; airComboTraps = []; scarf.active = false; looms = []; voidPortals = []; chaosBalls = [];
    platforms = [];

    // 3. Пол исчезает, игроки падают секунду на нижний уровень
    FLOOR += 500;
    triggerShake(15, 25);
    playSound('hitBoss');

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

    // Через 1.5 секунды (90 кадров) появляются платформы одна за другой (задержка 0.40с = 24 кадра)
    if (boss.transitionTimer >= 90) {
        boss.climbPlatTimer++;
        if (boss.climbPlatTimer >= 24 && boss.climbPlatCount < 10) {
            boss.climbPlatTimer = 0;
            boss.climbPlatCount++;
            let i = boss.climbPlatCount; // 1 to 10
            let stepY = 85;
            let platY = FLOOR - (i * stepY);
            let platW = (i === 10) ? 320 : 180;
            let offset = (i === 1 || i === 10) ? 0 : ((i % 2 === 0) ? -130 : 130);
            let platX = boss.climbCenterX + offset - platW / 2;
            platX = Math.min(Math.max(platX, 20), ARENA_W - platW - 20);

            platforms.push({ x: platX, y: platY, w: platW, h: 16, num: i });
            playSound('wind');
            applyPhysicsPushToLeaves(platX + platW / 2, platY, 15);
            triggerShake(3, 5);
        }
    }

    // --- SA 2 и SA 3 АТАКИ ВО ВРЕМЯ ПОДЪЕМА ПО ПЛАТФОРМАМ ---
    if (boss.transitionTimer > 120 && !boss.saLines) {
        if (!boss.climbSaTimer) boss.climbSaTimer = 0;
        boss.climbSaTimer++;
        if (boss.climbSaTimer >= 80) { // каждые ~1.3 сек полоса атаки
            boss.climbSaTimer = 0;
            let activeP = players.filter(p => !p.isDowned && p.hp > 0);
            if (activeP.length > 0) {
                let targetP = activeP[Math.floor(Math.random() * activeP.length)];
                let type = Math.random() > 0.5 ? "SA2" : "SA3";
                let ex1 = targetP.x + targetP.width/2 + (Math.random() - 0.5) * 160;
                let ex2 = ex1 + (Math.random() - 0.5) * 160;
                boss.saLines = [{ 
                    x1: ex1, 
                    y1: camY - 100, 
                    x2: ex2, 
                    y2: camY + GAME_HEIGHT + 100, 
                    type: type 
                }];
                boss.saLinesState = "WINDUP";
                boss.saLinesTimer = 45; // 0.75с предупреждение (пунктир)
            }
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
                    if (!p.isDowned && !p.saHit && p.invuln <= 0 && distToSegment(p, curLine) < 35 + p.width/2) {
                        takeDamage(p, 1.5);
                        p.saHit = true;
                        p.vy = 4; // отталкивание вниз
                        triggerShake(10, 15);
                        triggerVibration('sa_hit');
                        freezeFrames = 4;
                    }
                }
            }
        }
    }

    // Проверяем, наступил ли игрок на 10-ю платформу
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

            // 3. Только сейчас появляется босс и начинается 3 фаза!
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

            // Боевые платформы для 3 фазы:
            platforms = [
                { x: boss.climbCenterX - 280, y: FLOOR - 90, w: 130, h: 12 },
                { x: boss.climbCenterX + 150, y: FLOOR - 90, w: 130, h: 12 }
            ];

            // 4. Музыка включается ТОЛЬКО СЕЙЧАС (в начале 3 фазы):
            let bgm = document.getElementById("lModeMusic");
            if (bgm) {
                bgm.currentTime = 0;
                bgm.volume = 0.5;
                bgm.play().catch(e => console.log(e));
            }

            triggerShake(15, 20);
            playSound('parry');
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
            boss.state = "DEFEATED"; 
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
        if (boss.stateTimer <= 0) {
            if (boss.superQueue && boss.superQueue.length > 0) { 
                let n = boss.superQueue.shift(); 
                boss.state = n.s; 
                boss.stateTimer = n.t; 
            } else { 
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
        if (boss.stateTimer <= 0) { 
            boss.sa1Arr = []; 
            let count = 7; 
            let realIdx = Math.floor(Math.random() * count);
            for (let i = 0; i < count; i++) { 
                boss.sa1Arr.push({ 
                    x: Math.random() * (ARENA_W - 50) + 25, 
                    y: Math.random() * (FLOOR - 100) + 50, 
                    isReal: (i === realIdx), 
                    timer: 0, 
                    startDelay: i * 8, 
                    active: true, 
                    struck: false 
                }); 
            }
            boss.state = "SA1_ACTIVE"; 
            boss.stateTimer = 300; 
            boss.y = -1000; 
            boss.color = "#ff8800";
        }
    } else if (boss.state === "SA1_ACTIVE") {
        let allDone = true;
        for (let ph of boss.sa1Arr) {
            if (!ph.active) continue; 
            ph.timer++;
            if (ph.timer > ph.startDelay) {
                allDone = false;
                if (ph.timer === ph.startDelay + 45 && !ph.struck) {
                    ph.struck = true; 
                    let hitArea = { x: ph.x - 300, y: ph.y - 150, width: 630, height: 200 };
                    for (let p of players) { 
                        if (!p.isDowned && p.hp > 0 && rectIntersect(p, hitArea)) { 
                            triggerCinematic("SA1", p, true); 
                        } 
                    }
                }
                if (ph.timer > ph.startDelay + 60) ph.active = false;
            }
        }
        if (allDone && !activeCinematic) { 
            boss.state = "SA1_SLAM_WINDUP"; 
            boss.stateTimer = 40; 
            boss.x = nearestP.x; 
            boss.y = Math.max(-50, FLOOR - 350); 
            boss.color = "#e6c800"; 
        }
    } else if (boss.state === "SA1_SLAM_WINDUP") {
        boss.vx = 0; boss.vy = 0; boss.y = Math.max(-50, FLOOR - 350);
        if (boss.stateTimer <= 0) { boss.state = "SA1_SLAM"; boss.vy = 35; }
    } else if (boss.state === "SA1_SLAM") {
        boss.vy = 35; 
        boss.y += boss.vy;
        if (boss.y + boss.height >= FLOOR) {
            boss.y = FLOOR - boss.height; 
            triggerShake(30, 20, 0, 1); 
            triggerVibration('sa1_land');
            for (let p of players) {
                if (Math.abs((p.x + p.width/2) - (boss.x + boss.width/2)) < 100) {
                    let slamDmg = secretMode ? 2 : 1.5;
                    if (boss.lightInfected > 0) slamDmg = Math.max(0.5, slamDmg - 1);
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
        if (boss.stateTimer === 23) {
            let ex1 = Math.random() * ARENA_W; 
            let ex2 = Math.random() * ARENA_W;
            if (Math.random() < 0.5) { ex1 = 0; ex2 = ARENA_W; }
            boss.saLines = [{ x1: ex1, y1: Math.random() * (FLOOR - 100), x2: ex2, y2: FLOOR, type: boss.state === "SA3_WINDUP" ? "SA3" : "SA2" }];
        }
        if (boss.stateTimer <= 0) { boss.state = "SA_EXECUTE"; boss.stateTimer = 6; }
    } else if (boss.state === "SA2_DOUBLE") {
        if (boss.stateTimer === 23) {
            let cX1 = Math.random() * ARENA_W; 
            let cX2 = Math.random() * ARENA_W;
            boss.saLines = [
                { x1: cX1, y1: 0, x2: ARENA_W - cX1, y2: FLOOR, type: "SA2" },
                { x1: cX2, y1: 0, x2: ARENA_W - cX2, y2: FLOOR, type: "SA2" }
            ]; 
        }
        if (boss.stateTimer <= 0) { boss.state = "SA_EXECUTE"; boss.stateTimer = 6; }
    } else if (boss.state === "SA2_TRIPLE") {
        if (boss.stateTimer === 23) {
            boss.saLines = [
                { x1: 0, y1: Math.random() * (FLOOR - 100), x2: ARENA_W, y2: FLOOR, type: "SA2" },
                { x1: ARENA_W, y1: Math.random() * (FLOOR - 100), x2: 0, y2: FLOOR, type: "SA2" },
                { x1: Math.random() * ARENA_W, y1: 0, x2: Math.random() * ARENA_W, y2: FLOOR, type: "SA2" }
            ]; 
        }
        if (boss.stateTimer <= 0) { boss.state = "SA_EXECUTE"; boss.stateTimer = 6; }
    } else if (boss.state === "SA_EXECUTE") {
        if (boss.stateTimer > 0) {
            let progress = 1 - (boss.stateTimer / 6);
            for (let l of boss.saLines) {
                let curX2 = l.x1 + (l.x2 - l.x1) * progress; 
                let curY2 = l.y1 + (l.y2 - l.y1) * progress; 
                let curLine = { x1: l.x1, y1: l.y1, x2: curX2, y2: curY2 };
                for (let p of players) {
                    if (!p.isDowned && !p.saHit && distToSegment(p, curLine) < 40 + p.width/2) {
                        triggerCinematic(l.type, p); 
                        p.saHit = true; 
                        let dx_n = l.x2 - l.x1; 
                        let dy_n = l.y2 - l.y1; 
                        let dLen = Math.hypot(dx_n, dy_n);
                        triggerShake(10, 15, dx_n / dLen, dy_n / dLen);
                    }
                }
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
        if (boss.stateTimer <= 0) {
            boss.hp = Math.min(boss.maxHp, boss.hp + 2);
            boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 20;
        }
    } else {
        switch(boss.state) {
            case "IDLE":
                boss.vx = 0; boss.comboCount = 0;
                if (boss.stateTimer <= 0) { 
                    if (Math.random() < 0.25) { boss.state = "WALK"; boss.stateTimer = 60 + Math.random() * 60; } 
                    else { boss.state = "CHASE"; boss.stateTimer = (30 + Math.random() * 40) * phaseMultiplier; } 
                }
                break;
            case "WALK": 
                if (boss.stateTimer % 30 === 0) boss.vx = (Math.random() < 0.5 ? -1 : 1) * (boss.speed * 0.8); 
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 15; boss.vx = 0; }
                break;
            case "CHASE":
                let currentBossSpeed = boss.speed;
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
                    let rand = Math.random(); 
                    let teleChance = numPlayers === 2 ? 0.35 : 0.25; 
                    
                    if (secretMode) {
                        if (boss.phase === 3) {
                            if (rand < 0.35) { boss.state = "VOID_PORTALS"; boss.stateTimer = 90; boss.color = "#9900ff"; }
                            else if (boss.sa1Count < 4 && rand < 0.50) { boss.sa1Count++; boss.state = "SA1_WINDUP"; boss.stateTimer = 1; boss.color = "#ff8800"; }
                            else if (rand < 0.60) { boss.state = "TELEPORT_OUT"; boss.stateTimer = 15; playSound('wind'); }
                            else if (rand < 0.70) { boss.state = "CAST_WIND"; boss.stateTimer = 30 * phaseMultiplier; boss.vx = 0; boss.directAttackActive = true; boss.color = "#00ffff"; }
                            else if (rand < 0.80) { boss.state = "FEINT_WINDUP"; boss.stateTimer = 20 * phaseMultiplier; boss.attackDir = boss.x < nearestP.x ? 1 : -1; boss.directAttackActive = true; boss.color = "#aaaaaa"; }
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
                        if (boss.lightInfected > 0) sDmg = Math.max(0.5, sDmg - 1);
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
                    boss.state = Math.random() < 0.5 ? "VULN_STANCE" : "PARRY_STANCE"; 
                    boss.color = boss.state === "VULN_STANCE" ? "#ff8800" : "#aaaaaa"; 
                    if (boss.state === "VULN_STANCE") boss.stateTimer = 60 * phaseMultiplier; else boss.stateTimer = 60;
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
                        if (boss.lightInfected > 0) { dmg = Math.max(0.5, dmg - 1); }
                        takeDamage(p, dmg); 
                        if (wasH) triggerVibration('heal_interrupt'); else triggerVibration('damage'); 
                        triggerShake(3, 10); freezeFrames = 6; 
                    } 
                } 
                if (boss.stateTimer <= 0) { boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 30; } 
                break;
            case "PARRY_STANCE": 
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
                    boss.x = Math.random() * (ARENA_W - 50);
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
    if (boss.state.startsWith("L_CLIMB") || ["WIND_FLY", "VULN_STANCE", "VULN_LATE", "PARRY_STANCE", "PARRY_COUNTER_WINDUP", "TRANSITION", "PARRY_DASH", "HEAL_PUNISH_DASH", "CAST_WIND", "CAST_VERTICAL_WIND", "SCARF_SHOOT", "SCARF_PULL", "SCARF_WINDUP", "TELEPORT_OUT", "TELEPORT_IN", "TIED", "TIED_BLEED", "SHARPEN_WINDUP", "EXECUTE_QUEUE", "SA1_WINDUP", "SA1_ACTIVE", "SA2_WINDUP", "SA3_WINDUP", "SA2_DOUBLE", "SA2_TRIPLE", "SA_EXECUTE", "VOID_PORTALS", "SA1_SLAM_WINDUP", "L_HEAL", "L_INTRO_FALL", "L_INTRO_RISE", "L_PHASE3_RISE", "L_SCREAM", "HIDDEN_PAUSE", "VOID_SINK_STUN"].includes(boss.state) || (boss.state === "LUNGE" && boss.attackDir === "UP") || boss.state.startsWith("CINEMATIC")) {
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
    boss.x += boss.vx; boss.y += boss.vy;
    let bossFloorLimit = FLOOR;
    if (boss.y + boss.height > bossFloorLimit && !boss.state.startsWith("L_INTRO") && boss.state !== "L_PHASE3_RISE" && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB")) { 
        boss.y = bossFloorLimit - boss.height; 
        boss.vy = 0; 
    }
    let bossCeilLimit = secretMode ? -2000 : 0;
    if (boss.y < bossCeilLimit && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB")) boss.y = bossCeilLimit; 
    if (boss.x < 0) { boss.x = 0; boss.vx *= -1; } 
    if (boss.x > ARENA_W - 30) { boss.x = ARENA_W - 30; boss.vx *= -1; }

    let bossDmgHitbox = { x: boss.x, y: boss.y, width: 30, height: 50 };
    if (boss.phase === 3 && (boss.state === "PARRY_DASH" || boss.state === "HEAL_PUNISH_DASH")) { 
        bossDmgHitbox.y -= 60; 
        bossDmgHitbox.height += 60; 
    }

    for (let p of players) {
        if (!p.isDowned && p.hp > 0 && rectIntersect(p, bossDmgHitbox) && boss.state !== "TRANSITION" && p.invuln <= 0 && !boss.state.startsWith("TELEPORT") && !boss.state.startsWith("CINEMATIC") && boss.state !== "SA_EXECUTE" && boss.state !== "SA1_ACTIVE" && !boss.state.startsWith("L_INTRO") && !boss.state.startsWith("L_PHASE3") && boss.state !== "HIDDEN_PAUSE" && !boss.state.startsWith("L_CLIMB") && boss.state !== "VOID_SINK_STUN") {
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
                dmg = Math.max(0.5, dmg - 1);
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

function drawBoss() {
    if (boss.state.startsWith("L_CLIMB") || boss.phase === 2.5) return;
    if (boss.state === "SA1_ACTIVE" && boss.sa1Arr) {
        for (let ph of boss.sa1Arr) {
            if (ph.active && ph.timer >= ph.startDelay) {
                if (ph.timer < ph.startDelay + 45) {
                    ctx.fillStyle = "rgba(255, 150, 0, 0.3)";
                    ctx.fillRect(ph.x - 300, ph.y - 150, 630, 200);
                } else if (ph.timer < ph.startDelay + 55) {
                    ctx.fillStyle = "rgba(255, 100, 0, 0.8)";
                    ctx.fillRect(ph.x - 300, ph.y - 150, 630, 200);
                }
                ctx.fillStyle = ph.isReal ? "#ff8800" : "#221100";
                ctx.fillRect(ph.x - 15, ph.y - 25, 30, 50);
                if (!ph.isReal) { 
                    ctx.strokeStyle = "#ff8800"; 
                    ctx.lineWidth = 2; 
                    ctx.strokeRect(ph.x - 15, ph.y - 25, 30, 50); 
                }
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
    } else if (boss.state !== "FREE_ROAM" && boss.state !== "SA1_ACTIVE" && boss.state !== "HIDDEN_PAUSE" && boss.state !== "SA1_SLAM_WINDUP" && !boss.state.startsWith("L_CLIMB")) {
        ctx.fillStyle = getBossColor(boss.color);
        ctx.globalAlpha = (boss.invuln > 0 && Math.floor(Date.now() / 50) % 2 === 0) ? 0.5 : 1.0;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        
        // --- БОСС: ЧЕРНЫЙ ШАРФ И ЖЕЛТЫЙ ПЛАЩ С ОРАНЖЕВЫМИ УЗОРАМИ ---
        ctx.save();
        let bCloakColor = secretMode ? "#4a3c00" : "#e6c800";
        let bPatternColor = secretMode ? "#8a4500" : "#ff7700";
        
        // Желтый плащ
        ctx.fillStyle = bCloakColor;
        ctx.beginPath();
        let bcx = boss.facingRight ? boss.x : boss.x + boss.width;
        let bcw = boss.facingRight ? 22 : -22;
        ctx.moveTo(bcx, boss.y + 10);
        ctx.lineTo(bcx + bcw, boss.y + 18);
        ctx.lineTo(bcx + (bcw * 0.85), boss.y + boss.height - 2);
        ctx.lineTo(bcx, boss.y + boss.height);
        ctx.closePath();
        ctx.fill();

        // Оранжевые узоры плаща
        ctx.strokeStyle = bPatternColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bcx + (bcw * 0.3), boss.y + 15);
        ctx.lineTo(bcx + (bcw * 0.85), boss.y + 24);
        ctx.lineTo(bcx + (bcw * 0.4), boss.y + boss.height - 6);
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
        let wave = Math.sin(Date.now() / 120) * 4;
        ctx.beginPath();
        ctx.moveTo(tailX, scarfY + 4);
        ctx.quadraticCurveTo(tailX + (tailDir * 14), scarfY + 12 + wave, tailX + (tailDir * 22), scarfY + 18 + wave * 1.5);
        ctx.lineTo(tailX + (tailDir * 20), scarfY + 23 + wave * 1.5);
        ctx.quadraticCurveTo(tailX + (tailDir * 12), scarfY + 16 + wave, tailX, scarfY + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
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
