// --- AI COMPANION MODULE (ИИ-НАПАРНИК) ---
// Created for v74 by Timur & Assistant

let aiCompanionConfig = {
    hero: 'WATER',
    personality: 'TACTICIAN', // 'AGGRESSIVE', 'DEFENDER', 'TACTICIAN'
    slots: ['none', 'none', 'none']
};

let aiInternalState = {
    actionTimer: 0,
    currentAction: 'IDLE',
    attackCooldown: 0,
    dashCooldown: 0,
    specCooldown: 0,
    jumpCooldown: 0,
    ultCooldown: 0,
    comboStep: 0,
    comboTimer: 0,
    isChargingConcentration: false,
    concentrateChargeFrames: 0,
    dodgeReactionTimer: 0
};

function setAiPersonality(pers) {
    if (['AGGRESSIVE', 'DEFENDER', 'TACTICIAN'].includes(pers)) {
        aiCompanionConfig.personality = pers;
        updateAiSettingsUI();
    }
}
window.setAiPersonality = setAiPersonality;

function getAiPersonalityName(pers) {
    if (pers === 'AGGRESSIVE') return '⚔️ Штурмовик (Агрессивный)';
    if (pers === 'DEFENDER') return '🛡️ Телохранитель (Защитник)';
    return '🏹 Тактик (Саппорт)';
}
window.getAiPersonalityName = getAiPersonalityName;

function updateAiSettingsUI() {
    let curPers = (aiCompanionConfig && aiCompanionConfig.personality) ? aiCompanionConfig.personality : 'TACTICIAN';
    
    let btnTact = document.getElementById('ai-pers-btn-TACTICIAN');
    let btnAggr = document.getElementById('ai-pers-btn-AGGRESSIVE');
    let btnDef = document.getElementById('ai-pers-btn-DEFENDER');
    let descEl = document.getElementById('ai-pers-desc');

    if (btnTact) {
        let isSel = (curPers === 'TACTICIAN');
        btnTact.style.borderColor = isSel ? '#00e5ff' : '#64748b';
        btnTact.style.color = isSel ? '#00e5ff' : '#94a3b8';
        btnTact.style.background = isSel ? 'rgba(0, 229, 255, 0.15)' : 'transparent';
        btnTact.style.boxShadow = isSel ? '0 0 10px rgba(0, 229, 255, 0.3)' : 'none';
    }
    if (btnAggr) {
        let isSel = (curPers === 'AGGRESSIVE');
        btnAggr.style.borderColor = isSel ? '#ff4444' : '#64748b';
        btnAggr.style.color = isSel ? '#ff6666' : '#94a3b8';
        btnAggr.style.background = isSel ? 'rgba(255, 68, 68, 0.15)' : 'transparent';
        btnAggr.style.boxShadow = isSel ? '0 0 10px rgba(255, 68, 68, 0.3)' : 'none';
    }
    if (btnDef) {
        let isSel = (curPers === 'DEFENDER');
        btnDef.style.borderColor = isSel ? '#eab308' : '#64748b';
        btnDef.style.color = isSel ? '#fde047' : '#94a3b8';
        btnDef.style.background = isSel ? 'rgba(234, 179, 8, 0.15)' : 'transparent';
        btnDef.style.boxShadow = isSel ? '0 0 10px rgba(234, 179, 8, 0.3)' : 'none';
    }

    if (descEl) {
        if (curPers === 'AGGRESSIVE') {
            descEl.innerText = '⚔️ Агрессивно сближается с боссом, проводит серии ударов, комбо и спецприёмы. Высокий урон в секунду!';
        } else if (curPers === 'DEFENDER') {
            descEl.innerText = '🛡️ Охраняет живого союзника, перехватывает атаки босса и отбрасывает его при угрозе напарнику.';
        } else {
            descEl.innerText = '🏹 Держится на средней дистанции, атакует сюрикенами/спец-ударами, приоритетно отступает и лечит павшего напарника!';
        }
    }
}
window.updateAiSettingsUI = updateAiSettingsUI;

function runAiCompanion(p) {
    let inp = {
        left: false, right: false, up: false, down: false,
        jump: false, attack: false, heal: false, dash: false,
        special: false, stance: false, light: false, ult: false,
        waterDrop: false
    };

    if (typeof boss === 'undefined' || !boss || gameState !== "PLAYING") {
        return inp;
    }

    // Final tie cinematic:
    if (boss.state === "CINEMATIC_TIE_WAIT") {
        let livingHumans = players.filter(pl => !pl.isAi && pl.hp > 0 && !pl.isDowned);
        // Если все живые игроки-люди упали, ИИ сам подходит и связывает босса!
        if (livingHumans.length === 0) {
            let dx = boss.x - p.x;
            if (Math.abs(dx) > 70) {
                if (dx > 0) inp.right = true;
                else inp.left = true;
            } else {
                inp.special = true;
                p.hasPressedTie = true;
            }
        }
        return inp;
    }

    // Cooldown decrements
    if (aiInternalState.attackCooldown > 0) aiInternalState.attackCooldown--;
    if (aiInternalState.dashCooldown > 0) aiInternalState.dashCooldown--;
    if (aiInternalState.specCooldown > 0) aiInternalState.specCooldown--;
    if (aiInternalState.jumpCooldown > 0) aiInternalState.jumpCooldown--;
    if (aiInternalState.ultCooldown > 0) aiInternalState.ultCooldown--;
    if (aiInternalState.comboTimer > 0) aiInternalState.comboTimer--;
    else aiInternalState.comboStep = 0;

    // Check heals available
    let isLimited = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal);
    let hasHeal = isLimited ? (sharedHealPoints >= 8) : (sharedHeals >= 1);

    // Living human teammates & downed teammates
    let humans = players.filter(pl => pl.id !== p.id && !pl.isAi && pl.hp > 0 && !pl.isDowned);
    let downedTeammates = players.filter(pl => pl.id !== p.id && pl.isDowned && pl.hp > 0);

    let dx = boss.x - p.x;
    let distX = Math.abs(dx);
    let dirToBoss = dx > 0 ? 1 : -1;
    let distY = boss.y - p.y;
    let pCenterX = p.x + p.width / 2;
    let pCenterY = p.y + p.height / 2;

    // Check if player is on platform
    let onPlatform = false;
    let currentPlat = null;
    if (typeof platforms !== 'undefined' && platforms.length > 0) {
        for (let plat of platforms) {
            if (p.y + p.height <= plat.y + 16 && p.y + p.height >= plat.y - 4 && pCenterX >= plat.x && pCenterX <= plat.x + plat.w) {
                onPlatform = true;
                currentPlat = plat;
                break;
            }
        }
    }

    // --- 1. TOP PRIORITY: REVIVING DOWNED TEAMMATES ---
    if (downedTeammates.length > 0) {
        if (hasHeal) {
            aiInternalState.isChargingConcentration = false;
            if (distX < 140 && boss.state !== "CINEMATIC_TIE_WAIT" && boss.state !== "DEFEATED") {
                if (dirToBoss > 0) inp.left = true;
                else inp.right = true;
                if (aiInternalState.dashCooldown <= 0 && distX < 90) {
                    inp.dash = true;
                    aiInternalState.dashCooldown = 60;
                }
                return inp;
            } else {
                inp.heal = true;
                return inp;
            }
        }
    }

    // --- 2. SELF PRESERVATION HEAL (Low HP) ---
    if (p.hp <= 1.5 && hasHeal && downedTeammates.length === 0) {
        aiInternalState.isChargingConcentration = false;
        if (distX < 160 && boss.state !== "CINEMATIC_TIE_WAIT" && boss.state !== "DEFEATED") {
            if (dirToBoss > 0) inp.left = true;
            else inp.right = true;
            if (aiInternalState.dashCooldown <= 0 && distX < 100) {
                inp.dash = true;
                aiInternalState.dashCooldown = 60;
            }
            return inp;
        } else {
            inp.heal = true;
            return inp;
        }
    }

    // If currently healing, maintain heal until completed or interrupted
    if (p.isHealing) {
        inp.heal = true;
        return inp;
    }

    // --- 3. ANTI-PARRY REFLEX (Чутьё на парирование босса) ---
    let bossIsParrying = (boss.state === "PARRY_STANCE" || boss.state === "PARRY_COUNTER_WINDUP");
    if (bossIsParrying) {
        // Умный ИИ прекращает атаки и не бьет в парирование босса!
        inp.attack = false;
        inp.special = false;
        inp.ult = false;
        aiInternalState.isChargingConcentration = false;
        if (distX < 85) {
            if (dirToBoss > 0) inp.left = true;
            else inp.right = true;
            if (aiInternalState.dashCooldown <= 0 && distX < 55) {
                inp.dash = true;
                aiInternalState.dashCooldown = 45;
            }
        }
        return inp;
    }

    // --- 4. PROJECTILE RADAR (Радар снарядов: сюрикены и воздушные клинки) ---
    let incomingThreat = null;

    // Сканирование черных сюрикенов и кинжалов босса
    if (typeof blackDaggers !== 'undefined' && blackDaggers.length > 0) {
        for (let d of blackDaggers) {
            if (d.deflected === 1) continue;
            let ddx = pCenterX - d.x;
            let ddy = pCenterY - d.y;
            let dist = Math.hypot(ddx, ddy);
            let dot = ddx * d.vx + ddy * d.vy;
            if (dot > 0 && dist < 210) {
                let spd = Math.hypot(d.vx, d.vy) || 1;
                let tth = dist / spd;
                if (tth < 16) {
                    incomingThreat = { x: d.x, y: d.y, vx: d.vx, vy: d.vy, dist, tth, type: 'DAGGER' };
                    break;
                }
            }
        }
    }

    // Сканирование воздушных клинков (airBlades)
    if (!incomingThreat && typeof airBlades !== 'undefined' && airBlades.length > 0) {
        for (let b of airBlades) {
            if (b.deflected === 1 || b.state !== "SHOOT") continue;
            let bdx = pCenterX - b.x;
            let bdy = pCenterY - b.y;
            let dist = Math.hypot(bdx, bdy);
            let dot = bdx * b.vx + bdy * b.vy;
            if (dot > 0 && dist < 210) {
                let spd = Math.hypot(b.vx, b.vy) || 1;
                let tth = dist / spd;
                if (tth < 16) {
                    incomingThreat = { x: b.x, y: b.y, vx: b.vx, vy: b.vy, dist, tth, type: 'BLADE' };
                    break;
                }
            }
        }
    }

    // Реакция на летящий снаряд
    if (incomingThreat) {
        aiInternalState.isChargingConcentration = false;
        // Огонь: парирование снаряда на S
        if (p.type === 'FIRE' && aiInternalState.specCooldown <= 0) {
            inp.special = true;
            aiInternalState.specCooldown = 40;
            return inp;
        }
        // Воздух: сдувание снарядов на S
        if (p.type === 'AIR' && aiInternalState.specCooldown <= 0) {
            inp.special = true;
            aiInternalState.specCooldown = 40;
            return inp;
        }
        // Рывок через снаряд или в сторону (с неуязвимостью)
        if (aiInternalState.dashCooldown <= 0) {
            if (incomingThreat.vx > 0) inp.right = true; // уклонение по вектору или сквозь
            else inp.left = true;
            inp.dash = true;
            aiInternalState.dashCooldown = 45;
            return inp;
        }
        // Прыжок над снарядом
        if (aiInternalState.jumpCooldown <= 0 && (p.onGround || p.y >= FLOOR - 55)) {
            inp.jump = true;
            aiInternalState.jumpCooldown = 35;
            return inp;
        }
    }

    // --- 5. BOSS MELEE ATTACK RADAR (Уклонение от опасных атак босса) ---
    let bossIsAttacking = boss.state.includes("WINDUP") || boss.state === "WIND_FLY" || boss.state === "SCARF_SHOOT" 
        || boss.state === "SA1_ACTIVE" || boss.state === "SA1_SLAM" || boss.state === "GREAT_LUNGE_ACTIVE" 
        || boss.state === "PARRY_DASH" || boss.state === "HEAL_PUNISH_DASH";

    if (bossIsAttacking && distX < 95 && Math.abs(distY) < 70) {
        aiInternalState.isChargingConcentration = false;
        // Огненное парирование
        if (p.type === 'FIRE' && aiInternalState.specCooldown <= 0 && boss.state.includes("WINDUP")) {
            inp.special = true;
            aiInternalState.specCooldown = 55;
            return inp;
        }
        // Рывок от атаки
        if (dirToBoss > 0) inp.left = true;
        else inp.right = true;
        if (aiInternalState.dashCooldown <= 0) {
            inp.dash = true;
            aiInternalState.dashCooldown = 48;
            return inp;
        } else if (aiInternalState.jumpCooldown <= 0 && (p.onGround || p.y >= FLOOR - 55)) {
            inp.jump = true;
            aiInternalState.jumpCooldown = 40;
            return inp;
        }
    }

    // --- 6. PLATFORM PARKOUR INTELLIGENCE (Паркур по платформам) ---
    let mainPlat = (typeof platforms !== 'undefined' && platforms.length > 0) ? platforms[0] : null;

    // А) Спасение на платформу при сокрушительных наземных ударах босса (SA1 Slam / shockwave)
    let groundSlamDanger = (boss.state === "SA1_SLAM_WINDUP" || boss.state === "SA1_SLAM" || boss.state === "WIND_LINE_WINDUP");
    if (groundSlamDanger && mainPlat && !onPlatform && !boss.state.startsWith("L_CLIMB")) {
        let platCenterX = mainPlat.x + mainPlat.w / 2;
        if (p.x < platCenterX - 20) inp.right = true;
        else if (p.x > platCenterX + 20) inp.left = true;
        if (aiInternalState.jumpCooldown <= 0 && p.y >= FLOOR - 55) {
            inp.jump = true;
            aiInternalState.jumpCooldown = 45;
        }
        return inp;
    }

    // Б) Pogo-удар с платформы: если ИИ на платформе, а босс прямо под ним
    if (onPlatform && boss.y > p.y + 35 && distX < 65) {
        inp.down = true;
        inp.attack = true;
        aiInternalState.attackCooldown = 20;
        return inp;
    }

    // В) Режим подъема в L-режиме (L_CLIMB): паркур вверх по платформам 1..10
    if (boss.state.startsWith("L_CLIMB") || boss.phase === 2.5) {
        if (typeof platforms !== 'undefined' && platforms.length > 0) {
            let nextPlat = platforms.find(pl => pl.y < p.y - 25 && pl.y > p.y - 180);
            if (nextPlat) {
                let nCenterX = nextPlat.x + nextPlat.w / 2;
                if (p.x < nCenterX - 15) inp.right = true;
                else if (p.x > nCenterX + 15) inp.left = true;
                if (aiInternalState.jumpCooldown <= 0 && p.vy >= -1) {
                    inp.jump = true;
                    aiInternalState.jumpCooldown = 35;
                }
                return inp;
            }
        }
    }

    // Границы арены: отступ от стен
    if (p.x < 70) {
        inp.right = true;
    } else if (p.x > ARENA_W - 70) {
        inp.left = true;
    }

    // --- 7. WATER ROPE HERO MASTERY (Вода с тросом: Концентрация и Гарпун) ---
    if (p.type === 'WATER_ROPE') {
        // А) Гарпун на Q / X+S (inp.ult) при уязвимости босса
        let bossVulnerable = (boss.state === "VULN_STANCE" || boss.state === "VULN_LATE" || boss.state === "BOSS_STUNNED" || boss.state === "STUN");
        if (bossVulnerable && boss.state !== "TIED" && !p.holdingBossRope && !p.ropeHarpoon && (p.ropeUltAttempts || 0) > 0 && aiInternalState.ultCooldown <= 0) {
            p.facingRight = dirToBoss > 0;
            inp.ult = true;
            aiInternalState.ultCooldown = 120;
            aiInternalState.isChargingConcentration = false;
            return inp;
        }

        // Б) Зарядка Концентрации (удержание атаки 60 кадров -> Tidal Surge 3.25 урона!)
        if (distX >= 70 && distX <= 220 && !bossIsAttacking && !bossIsParrying && !p.isHealing && !p.holdingBossRope) {
            if (!aiInternalState.isChargingConcentration) {
                aiInternalState.isChargingConcentration = true;
                aiInternalState.concentrateChargeFrames = 0;
            }
        }

        if (aiInternalState.isChargingConcentration) {
            aiInternalState.concentrateChargeFrames++;
            p.facingRight = dirToBoss > 0;

            // Готово к высвобождению (p.concentrateReady или >= 60 кадров зарядки)
            if (p.concentrateReady || aiInternalState.concentrateChargeFrames >= 62) {
                aiInternalState.isChargingConcentration = false;
                aiInternalState.concentrateChargeFrames = 0;
                aiInternalState.attackCooldown = 35;

                // Высвобождение Tidal Surge через комбинацию с рывком (X + C)
                inp.attack = false;
                if (p.onGround || Math.abs(distY) < 50) {
                    inp.dash = true; // Вызывает сокрушительный TIDAL SURGE!
                } else {
                    inp.down = true; // Сверху вызывает SUPER POGO / GROUND SLAM!
                }
                return inp;
            } else {
                // Удерживаем атаку для накопления концентрации
                inp.attack = true;
                if (distX > 140) {
                    if (dirToBoss > 0) inp.right = true;
                    else inp.left = true;
                }
                return inp;
            }
        }
    }

    // --- 8. POSITIONING & COMBAT BASED ON PERSONALITY ---
    let pers = p.aiPersonality || aiCompanionConfig.personality || 'TACTICIAN';
    let targetX = boss.x;
    let idealDist = 65;

    if (pers === 'AGGRESSIVE') {
        idealDist = 55;
        targetX = boss.x - dirToBoss * idealDist;
    } else if (pers === 'DEFENDER' && humans.length > 0) {
        let h = humans[0];
        let bossDistToHuman = Math.abs(boss.x - h.x);
        if (bossDistToHuman < 160) {
            idealDist = 60;
            targetX = boss.x - dirToBoss * idealDist;
        } else {
            targetX = (h.x + boss.x) / 2;
            idealDist = 90;
        }
    } else {
        // TACTICIAN
        idealDist = (p.type === 'AIR' || p.type === 'WATER_ROPE') ? 110 : 85;
        targetX = boss.x - dirToBoss * idealDist;
    }

    // Движение к целевой позиции
    let moveDiff = targetX - p.x;
    if (Math.abs(moveDiff) > 20) {
        if (moveDiff > 0) inp.right = true;
        else inp.left = true;

        if (pers === 'AGGRESSIVE' && Math.abs(moveDiff) > 130 && aiInternalState.dashCooldown <= 0) {
            inp.dash = true;
            aiInternalState.dashCooldown = 65;
        }
    }

    // Прыжок при нахождении босса в воздухе
    if (boss.y < p.y - 45 && distX < 130 && aiInternalState.jumpCooldown <= 0 && (p.onGround || p.y >= FLOOR - 55)) {
        inp.jump = true;
        aiInternalState.jumpCooldown = 45;
    }

    // --- 9. ATTACK & SPECIAL ABILITIES BY HERO TYPE ---
    let inMeleeRange = distX <= (p.atkRange ? p.atkRange + 25 : 95);

    if (inMeleeRange && !bossIsParrying) {
        p.facingRight = dirToBoss > 0;

        // Обычные атаки
        if (aiInternalState.attackCooldown <= 0) {
            inp.attack = true;
            aiInternalState.attackCooldown = Math.max(10, Math.round((p.atkCdBase || 20) * 0.8));
            aiInternalState.comboStep++;
            aiInternalState.comboTimer = 35;
        }

        // Способности героев
        if (p.type === 'FIRE') {
            if (distX < 80 && aiInternalState.specCooldown <= 0 && Math.random() < 0.35) {
                inp.down = true;
                inp.special = true;
                aiInternalState.specCooldown = 45;
            }
        } else if (p.type === 'FIRE_HALBERD') {
            if (distX >= 80 && distX <= 170 && aiInternalState.specCooldown <= 0) {
                inp.down = true;
                inp.special = true; // S-vault
                aiInternalState.specCooldown = 75;
            } else if (distX < 80 && aiInternalState.specCooldown <= 0) {
                inp.special = true; // whirlwind
                aiInternalState.specCooldown = 50;
            }
        } else if (p.type === 'EARTH') {
            if (aiInternalState.specCooldown <= 0 && Math.random() < 0.4) {
                inp.special = true; // ловушка
                aiInternalState.specCooldown = 60;
            }
            if (distX < 60 && Math.random() < 0.25) {
                inp.jump = true;
                inp.special = true; // flip combo
            }
        } else if (p.type === 'AIR') {
            if ((globalWindMode !== "NONE" || (typeof blackDaggers !== 'undefined' && blackDaggers.length > 0) || boss.state === "CAST_VERTICAL_WIND") && aiInternalState.specCooldown <= 0) {
                inp.special = true;
                aiInternalState.specCooldown = 40;
            }
        } else if (p.type === 'WATER') {
            if (distX > 80 && aiInternalState.specCooldown <= 0) {
                inp.special = true;
                aiInternalState.specCooldown = 50;
            }
        }
    } else {
        // Дальние атаки вне дистанции ближнего боя
        if (distX > 90 && distX < 280 && aiInternalState.specCooldown <= 0 && !bossIsParrying) {
            let abList = p.abilities ? Object.values(p.abilities) : [];
            if (abList.includes('shuriken') || p.type === 'WATER' || p.type === 'AIR') {
                inp.special = true;
                aiInternalState.specCooldown = 55;
            }
        }
    }

    return inp;
}
window.runAiCompanion = runAiCompanion;
