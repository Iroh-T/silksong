// --- PLAYER MODULE ---

function applyBadgesToPlayer(p, isP1) {
    p.badges = [];
    let slots = isP1 ? configBadges.p1 : configBadges.p2;
    p.badges.push(...slots);
    p.badges.push(configBadges.team); 
    if (p.badges.includes('accel')) p.healFramesTotal = 96;
    if (p.badges.includes('multi')) { p.isMultiHeal = true; p.healFramesTotal = 120; } 
    if (p.badges.includes('glass')) { p.dmgDealtMod = 1.75; p.glassDebuff = true; } else { p.dmgDealtMod = 1; }
    if (p.badges.includes('wings')) p.maxJumps = 2;
    if (p.badges.includes('sharp')) p.hasSharpening = true;
    if (p.badges.includes('bracelet')) p.recoilResist = true;
    if (p.badges.includes('sneakers')) { p.speedMod = 1.33; p.hasSneakers = true; p.runTimer = 0; } else { p.speedMod = 1; p.hasSneakers = false; p.runTimer = 0; }
    if (p.badges.includes('shield')) p.hasAegisShield = true;
    if (p.badges.includes('fish_scale')) { p.maxHp += 1; p.hp = p.maxHp; p.hasFishScale = true; }
    if (p.badges.includes('cracked_life')) { p.hasCrackedLife = true; p.crackedShieldBroken = false; }
    if (p.badges.includes('lucky_charm')) p.hasLuckyCharm = true;
    if (p.badges.includes('light_amulet') && secretMode) { p.hasLightAmulet = true; p.lightAmuletBroken = false; p.lightAmuletStreak = 0; }
    if (p.inputType === 'TOUCH') { p.dmgDealtMod += 0.5; p.isMobile = true; } else { p.isMobile = false; }
}

function createPlayer(id, type, keysObj, inputType, startX) {
    let p = { 
        id: id, x: startX, y: FLOOR - 50, width: 30, height: 50, vx: 0, vy: 0, facingRight: true, attackTimer: 0, attackCooldown: 0, attackType: "NORMAL", 
        invuln: 0, healTimer: 0, isHealing: false, isAoEHealing: false, prevHealKey: false, prevDaggerKey: false, prevAttackKey: false, prevComboKey: false, prevJumpKey: false, prevDashKey: false, prevStanceKey: false,
        wallJumpCooldown: 0, bleedTimer: 0, tied: false, tieClicks: 0, hasPressedTie: false, keys: keysObj, inputType: inputType, isDowned: false, downedTimer: 0, 
        isDashing: false, purpleHp: 0, tpCooldown: 0, tpDebuffTimer: 0, jumps: 0, maxJumps: 1, healFramesTotal: 120, isMultiHeal: false, glassDebuff: false, hasSharpening: false, dmgDealtMod: 1, genTimer: 0, lightCharge: 0, saHit: false, pendingDmgTimer: 0, pendingDmg: 0, healCost: 1,
        recoilResist: false, attackSpamCount: 0, overheatTimer: 0, heatLevel: 0, lastSafeX: startX, lastSafeY: FLOOR - 50, badges: [], abilities: {}, chillBrews: 0, invigBrews: 0, chillTimer: 0, invigTimer: 0,
        speedMod: 1, hasSneakers: false, runTimer: 0, voidDamageTimer: 0, spamResetTimer: 0,
        stance: 'LIGHT', weaponMode: 'PINK', comboHits: 0, comboTimer: 0,
        heatBladeTimer: 0, heatBladeIgniteTimer: 0, heatHitCount: 0,
        demonRageTimer: 0, isUnderFloor: false, underFloorTimer: 0, holdDownSpecTimer: 0,
        hallucinationHits: 0, shadowStepCooldown: 0, delayedBleedArr: [],
        hasCrackedLife: false, crackedShieldBroken: false, crackedImmuneTimer: 0, hasLuckyCharm: false,
        hasLightAmulet: false, lightAmuletBroken: false, lightAmuletStreak: 0,
        dodgeFlashTimer: 0, crackedBreakFlash: 0,
        dashBurstTimer: 0, dashDir: 0, airDashed: false, fireLungeTimer: 0, fireLungeHit: false
    };
    let baseHp = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.hp3) ? 3 : 6;
    if (type === 'WATER') { Object.assign(p, { speed: 5, hp: baseHp, maxHp: baseHp, color: "#3366ff", atkCdBase: 24, atkRange: 95, jumpPowerBase: -12, type: 'WATER', dmgMulti: 1 }); } 
    else if (type === 'EARTH') { Object.assign(p, { speed: 5.5, hp: baseHp, maxHp: baseHp, color: "#33cc33", atkCdBase: 12, atkRange: 65, jumpPowerBase: -12, type: 'EARTH', dmgMulti: 0.75 }); } 
    else if (type === 'AIR') { Object.assign(p, { speed: 5.5, hp: baseHp, maxHp: baseHp, color: "#ffdd00", atkCdBase: 20, atkRange: 80, jumpPowerBase: -13, type: 'AIR', dmgMulti: 0.8 }); } 
    else if (type === 'STAMINA') { Object.assign(p, { speed: 5, hp: baseHp, maxHp: baseHp, color: "#b35959", atkCdBase: 24, atkRange: 95, jumpPowerBase: -12, type: 'STAMINA', dmgMulti: 1.5, stamina: 5, maxStamina: 9, isCharging: false, chargeTimer: 0, chargeProjectiles: [] }); }
    else if (type === 'FIRE') { Object.assign(p, { speed: 5.25, hp: baseHp, maxHp: baseHp, color: "#ff5500", atkCdBase: 18, atkRange: 80, jumpPowerBase: -12.5, type: 'FIRE', dmgMulti: 1.25, isParrying: false, parryTimer: 0, orangeHp: 0, orangeHpTimer: 0, isFieryHealing: false, fireDashTimer: 0 }); }
    else if (type === 'FIRE_HALBERD') { Object.assign(p, { speed: 5.1, hp: baseHp, maxHp: baseHp, color: "#ff3322", atkCdBase: 28, atkRange: 130, jumpPowerBase: -12.2, type: 'FIRE_HALBERD', dmgMulti: 1.0, halberdBuffTimer: 0, halberdVampiricReady: false, halberdCombos: 0, halberdComboTimer: 0, whirlwindTimer: 0 }); }
    else if (type === 'WATER_ROPE') { let rHp = Math.max(1, baseHp - 1); Object.assign(p, { width: 22, height: 38, speed: 5.4, hp: rHp, maxHp: rHp, color: "#00e5ff", atkCdBase: 18, atkRange: 58, jumpPowerBase: -11.8, type: 'WATER_ROPE', dmgMulti: 0.75, concentrateTimer: 0, concentrateReady: false, ropeA: null, ropeB: null, ropeActive: false, ropeDrainTimer: 0, ropeSlideTimer: 0, isRopeSliding: false, ropeT: 0 }); }
    return p;
}

function takeDamage(p, amount, isBleed = false, isStaminaBleed = false, bypassInvuln = false) {
    if (godModeActive || window.godModeActive) return;
    if (p.crackedImmuneTimer > 0) return; // 100% immune during Cracked Life multi-tick survival window
    if (!isBleed && !boss.state.startsWith("CINEMATIC") && !activeCinematic && !bypassInvuln && !boss.state.startsWith("L_SCREAM") && !boss.state.startsWith("L_INTRO")) { 
        boss.directAttackHit = true; 
        boss.missCount = 0; 
    }
    
    if (boss.hunterInfected > 0 && !isBleed && !isStaminaBleed && amount > 0) amount = Math.max(0.5, amount - 1.5);
    if (p.isMobile && !isBleed && amount > 0) amount = Math.max(0, amount - 0.5);

    if (p.isParrying && !isBleed && !isStaminaBleed && !bypassInvuln) {
        p.isParrying = false; 
        p.parryTimer = 0;
        triggerVibration('clash'); 
        triggerShake(10, 16); 
        playSound('parry');
        playSound('slash');
        playSound('rockCrit');
        // AoE counter-strike: around player, above, below, left, right!
        let parryAoE = { x: p.x + p.width/2 - 130, y: p.y + p.height/2 - 110, width: 260, height: 220 };
        if (rectIntersect(parryAoE, boss)) { 
            tryDamageBoss(3.0, p); 
        }
        // Destroy boss projectiles in parry AoE
        if (typeof blackDaggers !== 'undefined') {
            blackDaggers = blackDaggers.filter(d => !rectIntersect(parryAoE, { x: d.x - 10, y: d.y - 10, width: 20, height: 20 }));
        }
        if (typeof chaosBalls !== 'undefined') {
            chaosBalls = chaosBalls.filter(b => !rectIntersect(parryAoE, { x: b.x - 12, y: b.y - 12, width: 24, height: 24 }));
        }
        if (typeof boss !== 'undefined' && boss && boss.sa1Arr) {
            boss.sa1Arr = boss.sa1Arr.filter(ph => !rectIntersect(parryAoE, { x: ph.x - 15, y: ph.y - 25, width: 30, height: 50 }));
        }
        voidExplosions.push({ x: p.x + p.width/2, y: p.y + p.height/2, timer: 25, isWhite: false, isOrange: true, r: 130 });
        p.invuln = 45;
        return; 
    }

    if (p.invuln <= 0 || isBleed || bypassInvuln) {
        // Lucky Charm (5% dodge) & Earth Hero at 4-5 heals (5% dodge + 2% Lucky Charm synergy)
        let dodgeChance = 0;
        if (p.hasLuckyCharm) dodgeChance += 0.05;
        if (p.type === 'EARTH' && sharedHeals >= 4) {
            dodgeChance += 0.05;
            if (p.hasLuckyCharm) dodgeChance += 0.02; // +2% synergy!
        }
        if (dodgeChance > 0 && Math.random() < dodgeChance && !isBleed && !isStaminaBleed) {
            p.invuln = 30;
            p.dodgeFlashTimer = 16;
            playSound('parry');
            triggerVibration('clash');
            triggerShake(4, 8);
            return;
        }

        // Light Amulet («Амулет света»): шанс смягчить входящий удар на 1 за каждый целый хил команды
        if (p.hasLightAmulet && !p.lightAmuletBroken && !isBleed && !isStaminaBleed && amount > 0) {
            let blockChance = Math.floor(sharedHeals) * 0.05 + (p.hasLuckyCharm ? 0.02 : 0);
            if (Math.random() < blockChance) {
                amount = Math.max(0, amount - 1);
                p.lightAmuletStreak = (p.lightAmuletStreak || 0) + 1;
                playSound('parry');
                triggerVibration('clash');
                triggerShake(6, 10);
                lightAmuletWaves.push({ x: p.x + p.width/2, y: p.y + p.height/2, r: 10, maxR: 85, timer: 20 });
                if (p.lightAmuletStreak >= 3) {
                    p.lightAmuletBroken = true;
                    playSound('parry');
                    triggerShake(14, 22);
                    battleAnnouncements.push({ text: "«Амулет света сломан»", color: "#00ffff", timer: 150 });
                }
            } else {
                p.lightAmuletStreak = 0;
            }
        }

        // Shield Badge: Blocks the first incoming attack cleanly!
        if (p.badges && p.badges.includes('shield') && p.hasAegisShield && !isBleed && !isStaminaBleed) {
            p.hasAegisShield = false;
            p.invuln = 50;
            playSound('parry');
            triggerShake(6, 12);
            triggerVibration('clash');
            voidExplosions.push({ x: p.x + p.width/2, y: p.y + p.height/2, timer: 20, isWhite: true, isOrange: false, r: 55 });
            return;
        }

        // Thorns Badge: Inflicts 1.5 retribution damage to the boss when player is hit
        if (p.badges && p.badges.includes('thorns') && !isBleed && !isStaminaBleed && amount > 0) {
            tryDamageBoss(1.5, p);
            triggerShake(5, 10);
            voidExplosions.push({ x: p.x + p.width/2, y: p.y + p.height/2, timer: 18, isWhite: false, isOrange: true, r: 60 });
        }

        if (typeof easyBossMode !== 'undefined' && easyBossMode && !isBleed && !isStaminaBleed) {
            amount = Math.max(0.25, amount * 0.5);
        }

        if (p.isDashing && !isBleed) {
            let curU = (p.id === 1) ? getCurrentUser() : getP2User();
            if (curU) unlockAchievement('dash_into_danger', curU);
        }

        if (p.glassDebuff && !isStaminaBleed && !(p.type === 'WATER' && p.stance === 'DEMON')) amount *= 2; 
        
        if (p.orangeHp > 0 && !isBleed && !isStaminaBleed) { let absorb = Math.min(p.orangeHp, amount); p.orangeHp -= absorb; amount -= absorb; }
        if (p.purpleHp > 0 && !isBleed) { let absorb = Math.min(p.purpleHp, amount); p.purpleHp -= absorb; amount -= absorb; }
        if (p.lightCharge > 0 && !isBleed) { amount = Math.max(0, amount - 1); p.lightCharge = 0; }
        if (secretMode && !isBleed && !boss.state.startsWith("L_FAKE")) sharedHitCount = Math.max(0, sharedHitCount - 1);
        
        // In L-mode: hits increase hallucination counter (unless Water in Demon form)
        if (secretMode && !isBleed && !isStaminaBleed) {
            if (!(p.type === 'WATER' && p.stance === 'DEMON')) {
                p.hallucinationHits++;
            }
            // Boss Qi absorption when player has purpleHp > 2
            if (p.purpleHp > 2) {
                p.purpleHp = Math.max(0, p.purpleHp - 1);
                boss.hp = Math.min(boss.maxHp, boss.hp + 1);
                playSound('hitBoss');
                voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 15, isWhite: false, isOrange: false, r: 40 });
            }
        }

        // --- Cracked Life Badge («Треснувшая жизнь»): защита от ваншота и щит на 1 HP ---
        if (p.hasCrackedLife && !p.crackedShieldBroken && amount > 0) {
            let isLastCinematicHit = activeCinematic && (
                (activeCinematic.type === 'SA1' && activeCinematic.tick >= 60) ||
                (activeCinematic.type === 'SA2' && activeCinematic.tick >= 16) ||
                (activeCinematic.type === 'SA3' && activeCinematic.tick >= 24)
            );
            let isInCinematic = !!activeCinematic;

            if (p.hp <= 1) {
                if (isInCinematic && !isLastCinematicHit) {
                    // Щит держит удар в серии: урон 0, только сотрясение ("вообще ничего кроме тряски")
                    playSound('parry');
                    triggerShake(14, 18);
                    triggerVibration('sa_hit');
                    return;
                } else {
                    // Финальный удар серии или одиночный удар: щит ломается, оставляя 1 HP!
                    p.crackedShieldBroken = true;
                    p.hp = 1;
                    p.crackedImmuneTimer = 120; // 2 секунды абсолютной защиты от любых последующих тиков этой атаки!
                    p.invuln = Math.max(p.invuln || 0, 120);
                    playSound('break');
                    playSound('parry');
                    triggerShake(16, 24);
                    triggerVibration('sa_hit');
                    // При ломке щита - маленький взрыв, наносящий 1 урон боссу!
                    tryDamageBoss(1, p);
                    p.crackedBreakFlash = 25;
                    if (typeof battleAnnouncements !== 'undefined') {
                        battleAnnouncements.push({ text: "«ЩИТ ТРЕСНУВШЕЙ ЖИЗНИ РАСКОЛОТ!»", color: "#00e5ff", timer: 120 });
                    }
                    return;
                }
            } else if (p.hp - amount < 1) {
                // Предотвращает ваншот: оставляет ровно 1 HP и раскалывается
                p.hp = 1;
                p.crackedShieldBroken = true;
                p.crackedImmuneTimer = 120; // 2 секунды абсолютной защиты от всех тиков
                p.invuln = Math.max(p.invuln || 0, 120);
                playSound('break');
                playSound('parry');
                triggerShake(16, 24);
                triggerVibration('sa_hit');
                // При ломке щита - маленький взрыв, наносящий 1 урон боссу!
                tryDamageBoss(1, p);
                p.crackedBreakFlash = 25;
                if (typeof battleAnnouncements !== 'undefined') {
                    battleAnnouncements.push({ text: "«ЩИТ ТРЕСНУВШЕЙ ЖИЗНИ РАСКОЛОТ!»", color: "#00e5ff", timer: 120 });
                }
                return;
            } else {
                p.hp -= amount;
            }
        } else {
            if (amount > 0) p.hp -= amount; 
        } 
        if (!isBleed && !bypassInvuln) {
            p.invuln = 60; 
            if (secretMode) p.voidDamageTimer = 45;
        }
        p.isHealing = false; 
        p.isAoEHealing = false; 
        p.isFieryHealing = false; 
        p.healTimer = 0; 
        if (p.type === 'STAMINA') p.isCharging = false; 
        playSound('hitPlayer'); 
        if (p.hp <= 0) {
            let otherP = players.find(pl => pl.id !== p.id);
            if (numPlayers === 2 && otherP && otherP.hp > 0 && !otherP.isDowned && !p.isDowned) { 
                p.isDowned = true; 
                p.hp = 0.1; 
                p.downedTimer = 600; 
            } else { 
                p.hp = 0; 
            }
        }

        // Achievement: «Любитель пола» (Упасть лицом в пол от первой же атаки Босса)
        if (typeof boss !== 'undefined' && boss && (boss.attackCount <= 1 || !boss.attackCount) && !boss.firstAttackAwarded && boss.phase === 1 && !isBleed && !isStaminaBleed) {
            if (p.hp <= 0 || p.isDowned || (amount >= 1 && p.y >= FLOOR - 55)) {
                boss.firstAttackAwarded = true;
                let curU = (p.id === 1) ? getCurrentUser() : getP2User();
                if (curU && typeof unlockAchievement === 'function') {
                    unlockAchievement('floor_hugger', curU);
                }
            }
        }
    }
}

function recordHit(p) { 
    if (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal) {
        sharedHealPoints = Math.min(MAX_HEAL_POINTS, sharedHealPoints + 1);
        sharedHitCount = sharedHealPoints % 8;
        sharedHeals = Math.floor(sharedHealPoints / 8);
        if (sharedHealPoints % 8 === 0) {
            for (let pl of players) { 
                if (pl.type === 'STAMINA' && !pl.isDowned) pl.stamina = Math.min(pl.maxStamina, pl.stamina + 1); 
            }
            playSound('leaf');
        }
    } else {
        sharedHitCount++; 
        if (sharedHitCount >= 8) { 
            sharedHitCount = 0; 
            sharedHeals = Math.min(maxSharedHeals, sharedHeals + 1); 
            for (let pl of players) { 
                if (pl.type === 'STAMINA' && !pl.isDowned) pl.stamina = Math.min(pl.maxStamina, pl.stamina + 1); 
            }
            playSound('leaf'); 
        }
    }
    let sharpChance = (p && p.hasLuckyCharm) ? 0.10 : 0.08;
    if (p && p.hasSharpening && Math.random() < sharpChance && boss.heroBleedTimer <= 0) { 
        boss.heroBleedTimer = 60; 
        boss.heroBleedTicks = 2; 
    }
    if (p && p.badges && p.badges.includes('vampire')) {
        p.vampireHits = (p.vampireHits || 0) + 1;
        if (p.vampireHits >= 6) {
            p.vampireHits = 0;
            if (p.hp < p.maxHp) {
                p.hp = Math.min(p.maxHp, p.hp + 1);
                playSound('heal');
                voidExplosions.push({ x: p.x + 15, y: p.y + 25, timer: 15, isWhite: true, isOrange: false, r: 35 });
            }
        }
    }
}

function applyBleed(p) { 
    if (boss.phase >= 2 && p.bleedTimer <= 0 && !p.isHealing && !p.tied && !p.isDowned) { 
        p.bleedTimer = 120; 
    } 
}

function getNearestPlayer(srcX) { 
    let activePlayers = players.filter(p => !p.isDowned && p.hp > 0);
    if (activePlayers.length === 0) return players[0] || { x: ARENA_W/2, y: FLOOR-50, width: 30, height: 50 };
    if (activePlayers.length === 1) return activePlayers[0];
    let d1 = Math.abs(srcX - (activePlayers[0].x + activePlayers[0].width/2)); 
    let d2 = Math.abs(srcX - (activePlayers[1].x + activePlayers[1].width/2)); 
    return d1 < d2 ? activePlayers[0] : activePlayers[1]; 
}

function fireCharge(p) { 
    let ticks = Math.floor(p.chargeTimer / 30); 
    let damage = 0.5 + ticks * 1.0; 
    p.chargeProjectiles.push({ x: p.x + p.width/2, y: p.y + p.height/2, vx: (p.facingRight ? 1 : -1) * 12, dmg: damage, pId: p.id }); 
    p.isCharging = false; 
    playSound('wind'); 
    p.attackCooldown = 15; 
    p.chargeTimer = 0; 
}

function executeAbility(p, ab) {
    let isLimited = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal);
    let canAfford = (halfCost) => {
        let pts = halfCost ? 4 : 8;
        return isLimited ? (sharedHealPoints >= pts) : (sharedHeals >= (halfCost ? 0.5 : 1));
    };
    let spendCost = (halfCost) => {
        if (isLimited) {
            let pts = halfCost ? 4 : 8;
            sharedHealPoints -= pts;
            sharedHitCount = sharedHealPoints % 8;
            sharedHeals = Math.floor(sharedHealPoints / 8);
        } else {
            sharedHeals -= (halfCost ? 0.5 : 1);
        }
    };

    if (ab === 'shuriken') {
        if (canAfford(true)) {
            spendCost(true); p.attackCooldown = 15; playSound('throw');
            let targetX = boss.x + boss.width/2;
            let targetY = boss.y + boss.height/2;

            if (typeof isTutorial !== 'undefined' && isTutorial && typeof tutorialTargets !== 'undefined' && tutorialTargets.length > 0) {
                let minD = Infinity;
                let closest = null;
                for (let trg of tutorialTargets) {
                    let d = Math.hypot(trg.x - (p.x + p.width/2), trg.y - (p.y + p.height/2));
                    if (d < minD) { minD = d; closest = trg; }
                }
                if (closest) {
                    targetX = closest.x;
                    targetY = closest.y;
                }
            } else if (boss.x < -500 || boss.y < -500 || boss.state === "INACTIVE" || boss.state === "DEFEATED") {
                targetX = (p.x + p.width/2) + (p.facingRight ? 300 : -300);
                targetY = p.y + p.height/2;
            }

            let dx = targetX - (p.x + p.width/2); 
            let dy = targetY - (p.y + p.height/2); 
            let dist = Math.hypot(dx, dy) || 1; 
            let isFireDagger = (p.type === 'FIRE' || p.type === 'FIRE_HALBERD');
            playerDaggers.push({ x: p.x + p.width/2, y: p.y + p.height/2, vx: (dx/dist) * 14, vy: (dy/dist) * 14, active: true, pId: p.id, isFire: isFireDagger, dmg: isFireDagger ? 1.25 : 1 });
        }
    }
    else if (ab === 'chill') {
        if (p.chillBrews > 0) {
            p.chillBrews--; p.chillTimer = 540; p.overheatTimer = 0; p.attackSpamCount = 0; p.heatLevel = 0; playSound('heal');
        }
    }
    else if (ab === 'invig') {
        if (p.invigBrews > 0) {
            p.invigBrews--; p.invigTimer = 300; playSound('heal');
        }
    }
    else if (ab === 'wind') {
        if (canAfford(true)) {
            spendCost(true); p.attackCooldown = 30; playSound('wind'); applyPhysicsPushToLeaves(p.x, p.y, 15); boss.voidWindDisabled = 1200;
            let windBox = {x: p.facingRight ? p.x+p.width : p.x - 150, y: p.y - 20, width: 150, height: 100};
            if (rectIntersect(windBox, boss)) { 
                if (tryDamageBoss(1, p)) { 
                    boss.vx = p.facingRight ? 15 : -15; 
                    if (["CAST_WIND", "WIND_FLY", "CAST_VERTICAL_WIND", "CAST_ANGLED_WIND"].includes(boss.state)) { 
                        boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 30; 
                    } 
                }
            }
        }
    }
    else if (ab === 'supertrap') {
        if (canAfford(false)) {
            spendCost(false); p.attackCooldown = 45; playSound('throw');
            let dx = (boss.x + boss.width/2) - (p.x + p.width/2); 
            let dy = (boss.y + boss.height/2) - (p.y + p.height/2); 
            let dist = Math.hypot(dx, dy);
            airComboTraps.push({ x: p.x + p.width/2, y: p.y + p.height/2, vx: (dx/dist)*16, vy: (dy/dist)*16, pId: p.id });
        }
    }
    else if (ab === 'trap') {
        if (canAfford(true)) {
            spendCost(true); p.attackCooldown = 15; playSound('trap'); 
            p2Traps.push({ x: p.x, y: FLOOR - 5, width: 35, height: 10, timer: 300, hits: 2, cd: 0, pId: p.id });
        }
    }
    else if (ab === 'charge') {
        if (canAfford(true)) { p.isCharging = true; p.chargeTimer = 0; }
    }
    else if (ab === 'loom_thread') {
        if (!secretMode) return;
        if (canAfford(true)) {
            spendCost(true); p.attackCooldown = 30; playSound('throw');
            let spawnX = ARENA_W / 2;
            let spawnY = FLOOR - 20;
            let trgX = boss.x + boss.width / 2;
            let trgY = boss.y + boss.height / 2;
            let dx = trgX - spawnX;
            let dy = trgY - spawnY;
            let dist = Math.hypot(dx, dy) || 1;
            loomThreads.push({
                x: spawnX,
                y: spawnY,
                vx: (dx / dist) * 20,
                vy: (dy / dist) * 20,
                active: true,
                pId: p.id,
                trail: []
            });
        }
    }
    else if (ab === 'parry') {
        if (canAfford(true)) {
            spendCost(true);
            p.isParrying = true;
            p.parryTimer = 40;
            p.attackCooldown = 40;
            playSound('parry');
            triggerVibration('attack');
        }
    }
    else if (ab === 'ignite') {
        if (canAfford(true)) {
            spendCost(true);
            p.heatBladeTimer = 600; // 10 seconds flaming blade buff
            p.attackCooldown = 20;
            playSound('heatIgnite');
            triggerVibration('attack');
            voidExplosions.push({ x: p.x + p.width/2, y: p.y + p.height/2, timer: 20, isWhite: false, isOrange: true, r: 50 });
        }
    }
    else if (ab === 'whirlwind') {
        if (canAfford(true)) {
            spendCost(true);
            p.whirlwindTimer = 16;
            p.attackCooldown = 28;
            playSound('slash');
            playSound('heatIgnite');
            triggerShake(6, 12);
            let whirlBox = { x: p.x + p.width/2 - 130, y: p.y + p.height/2 - 130, width: 260, height: 260 };
            if (rectIntersect(whirlBox, boss) && boss.invuln <= 0 && boss.state !== "TRANSITION" && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED") {
                tryDamageBoss(2.0, p);
            }
            for (let i = airBlades.length - 1; i >= 0; i--) {
                if (rectIntersect(whirlBox, { x: airBlades[i].x - 10, y: airBlades[i].y - 10, width: 20, height: 20 })) airBlades.splice(i, 1);
            }
            for (let i = blackDaggers.length - 1; i >= 0; i--) {
                if (rectIntersect(whirlBox, { x: blackDaggers[i].x - 10, y: blackDaggers[i].y - 10, width: 20, height: 20 })) blackDaggers.splice(i, 1);
            }
            for (let i = chaosBalls.length - 1; i >= 0; i--) {
                if (rectIntersect(whirlBox, { x: chaosBalls[i].x - 12, y: chaosBalls[i].y - 12, width: 24, height: 24 })) chaosBalls.splice(i, 1);
            }
            voidExplosions.push({ x: p.x + p.width/2, y: p.y + p.height/2, timer: 20, isWhite: false, isOrange: true, r: 130 });
        }
    }
}

function updatePlayers() {
    for (let p of players) {
        if (p.voidDamageTimer > 0) p.voidDamageTimer--;
        if (p.crackedImmuneTimer > 0) p.crackedImmuneTimer--;
        if (p.fireLungeTimer > 0) p.fireLungeTimer--;
        
        let onPlatform = false;
        if (p.vy >= 0) {
            for (let plat of platforms) {
                if (p.y + p.height <= plat.y + 15 && p.y + p.height + p.vy >= plat.y && p.x + p.width > plat.x && p.x < plat.x + plat.w) {
                    p.y = plat.y - p.height; p.vy = 0; onPlatform = true; 
                    p.lastSafeX = plat.x + plat.w / 2 - p.width / 2; 
                    p.lastSafeY = plat.y - p.height;
                    if (plat.num) p.highestPlatReached = Math.max(p.highestPlatReached || 1, plat.num);
                    break;
                }
            }
        }
        let onFloor = false;
        if (!onPlatform && p.y + p.height >= FLOOR) {
            p.y = FLOOR - p.height; p.vy = 0; onFloor = true;
            p.lastSafeX = p.x; p.lastSafeY = p.y;
        }

        if (p.hasSneakers && Math.abs(p.vx) > 0 && (onFloor || onPlatform) && !p.isDashing && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED") {
            p.runTimer++;
            if (p.runTimer >= 180) {
                p.runTimer = 0;
                sharedHitCount = Math.max(0, sharedHitCount - 1);
            }
        } else {
            p.runTimer = 0;
        }

        if (p.chillTimer > 0) {
            p.chillTimer--; p.overheatTimer = 0; p.attackSpamCount = 0; p.heatLevel = 0;
        } else {
            if (p.spamResetTimer > 0) {
                p.spamResetTimer--;
                if (p.spamResetTimer <= 0) {
                    p.attackSpamCount = 0;
                    p.heatLevel = 0;
                }
            }
            if (p.overheatTimer > 0) { 
                p.overheatTimer--; p.heatLevel = Math.max(0, p.overheatTimer / 90); 
                if (p.overheatTimer <= 0) { p.attackSpamCount = 0; p.heatLevel = 0; } 
            } else if (p.heatLevel > 0) { 
                p.heatLevel -= 0.01; 
            }
        }
        
        if (p.invigTimer > 0) p.invigTimer--;

        if (p.pendingDmgTimer > 0) { 
            p.pendingDmgTimer--; 
            if (p.pendingDmgTimer <= 0) { 
                takeDamage(p, p.pendingDmg, false, false, true); 
                triggerVibration('damage'); 
                freezeFrames = 2; 
            } 
        }

        if (p.badges.includes('generator') && !p.isDowned && p.hp > 0 && !boss.state.startsWith("CINEMATIC") && boss.state !== "FREE_ROAM") { 
            p.genTimer++; 
            if (p.genTimer >= 120) { p.genTimer = 0; recordHit(p); } 
        }
        
        if (p.isDowned) { 
            p.vx = 0; p.vy = 0; p.isHealing = false; p.isAoEHealing = false; 
            p.downedTimer--; 
            if (p.downedTimer <= 0) p.hp = 0; 
            continue; 
        }
        if (p.hp <= 0) continue; 

        let kLeft=false, kRight=false, kDown=false, kUp=false, kJump=false, kAttack=false, kHeal=false, kSpec=false, kDash=false, kLight=false, kStance=false;

        if (p.inputType === 'GAMEPAD') {
            let targetIndex = p.id === 1 ? 0 : 1;
            if (numPlayers === 2 && p1InputType.startsWith('KEYBOARD') && p.id === 2) targetIndex = 0;
            if (numPlayers === 2 && p2InputType.startsWith('KEYBOARD') && p.id === 1) targetIndex = 0;
            let gpIn = getGamepadInput(targetIndex);
            if (gpIn) { 
                kLeft=gpIn.left; kRight=gpIn.right; kUp=gpIn.up; kDown=gpIn.down; 
                kJump=gpIn.jump; kHeal=gpIn.heal; kDash=gpIn.dash; kSpec=gpIn.special; 
                kAttack=gpIn.attack; kLight=gpIn.light; kStance=gpIn.stance; 
            }
        } else if (p.inputType === 'TOUCH') {
            kLeft = touchInputs.left; kRight = touchInputs.right; kDown = touchInputs.down; kUp = touchInputs.up;
            kJump = touchInputs.jump; kAttack = touchInputs.atk; kDash = touchInputs.dash; kSpec = touchInputs.spec; 
            kHeal = touchInputs.heal; kLight = touchInputs.light; kStance = touchInputs.stance;
        } else {
            kLeft = isKeyPressed(p.keys.left); kRight = isKeyPressed(p.keys.right); kDown = isKeyPressed(p.keys.down); kUp = isKeyPressed(p.keys.up);
            kJump = isKeyPressed(p.keys.jump); kAttack = isKeyPressed(p.keys.attack); kHeal = isKeyPressed(p.keys.heal); kSpec = isKeyPressed(p.keys.special);
            kDash = p.keys.dash ? isKeyPressed(p.keys.dash) : false; 
            kLight = (p.keys && p.keys.light && isKeyPressed(p.keys.light)) || isKeyPressed(['ShiftLeft', 'ShiftRight', 'KeyL']) || ((p.inputType === 'KEYBOARD_SHOOTER' || p.inputType === 'KEYBOARD_2') ? (isKeyPressed(['MouseLeft']) && isKeyPressed(['MouseRight'])) : false);
            kStance = (p.keys && p.keys.stance) ? isKeyPressed(p.keys.stance) : isKeyPressed(['KeyS', 'KeyT', 'KeyV']);
        }

        // Tutorial Input Restrictions
        if (typeof isTutorial !== 'undefined' && isTutorial) {
            if (tutorialStep === 'WALK') {
                kJump = false; kAttack = false; kHeal = false; kSpec = false; kDash = false; kLight = false; kStance = false; kUp = false; kDown = false;
            } else if (tutorialStep === 'JUMP') {
                kAttack = false; kHeal = false; kSpec = false; kDash = false; kLight = false; kStance = false;
            } else if (tutorialStep === 'DASH') {
                kAttack = false; kHeal = false; kSpec = false; kLight = false; kStance = false;
            } else if (tutorialStep === 'WALL') {
                kAttack = false; kHeal = false; kSpec = false; kLight = false; kStance = false;
            } else if (tutorialStep === 'ATTACK') {
                kHeal = false; kSpec = false; kLight = false; kStance = false;
            } else if (tutorialStep === 'HEAL') {
                kSpec = false; kLight = false; kStance = false;
            } else if (tutorialStep === 'SPECIAL') {
                kLight = false; kStance = false;
            }
        }

        // Stance / Weapon mode switching (Key S)
        if (kStance && !p.prevStanceKey && p.overheatTimer <= 0 && !boss.state.startsWith("CINEMATIC")) {
            let cost = (p.type === 'FIRE') ? 2 : 1;
            let isLimited = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal);
            let canAfford = isLimited ? (sharedHealPoints >= cost) : ((sharedHeals * 8 + sharedHitCount) >= cost);

            if (canAfford) {
                let actionTaken = false;
                if (p.type === 'WATER') {
                    let allowed = (numPlayers === 1) || (secretMode);
                    if (allowed) {
                        p.stance = (p.stance === 'DEMON') ? 'LIGHT' : 'DEMON';
                        if (p.stance === 'DEMON') {
                            playSound('demonRoar');
                            triggerShake(4, 10);
                        } else {
                            playSound('lightChime');
                        }
                        actionTaken = true;
                    }
                } else if (p.type === 'STAMINA') {
                    p.weaponMode = (p.weaponMode === 'BLUE') ? 'PINK' : 'BLUE';
                    p.comboHits = 0;
                    p.comboTimer = 0;
                    if (p.weaponMode === 'PINK') {
                        playSound('slash');
                    } else {
                        playSound('bladeSpin');
                    }
                    actionTaken = true;
                } else if (p.type === 'FIRE') {
                    // Physical LUNGE (Выпад) on Key S!
                    // Hero physically rushes forward with rapier thrust, costs 2 charges, refunds 1 if hits boss!
                    p.fireLungeTimer = 11;
                    p.fireLungeHit = false;
                    p.vx = (p.facingRight ? 1 : -1) * 20;
                    if (!onFloor && !onPlatform) p.vy = 0;
                    p.attackCooldown = 22;
                    p.isDashing = true;
                    playSound('dash');
                    playSound('slash');
                    triggerVibration('attack');
                    applyPhysicsPushToLeaves(p.x + 15, p.y + 25, 12);
                    actionTaken = true;
                } else if (p.type === 'WATER_ROPE') {
                    if (p.ropeActive) {
                        p.ropeActive = false;
                        p.ropeA = null;
                        p.ropeB = null;
                        p.isRopeSliding = false;
                        p.ropeGracePeriod = 0;
                        playSound('break');
                    } else if (!p.ropeA) {
                        p.ropeA = { x: p.x + p.width/2, y: p.y + p.height/2 };
                        playSound('slash');
                        triggerVibration('attack');
                        let whipBox = { x: p.facingRight ? p.x : p.x - 90, y: p.y - 20, width: p.width + 90, height: 80 };
                        if (rectIntersect(whipBox, boss)) {
                            if (tryDamageBoss(1.25, p)) {
                                playSound('hitBoss');
                                triggerShake(6, 10);
                            }
                            voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 15, isWhite: false, isOrange: false, r: 40 });
                        }
                        voidExplosions.push({ x: p.ropeA.x, y: p.ropeA.y, timer: 15, isWhite: true, isOrange: false, r: 25 });
                        // Setting Point A does not deduct charge yet (whole rope costs 1 charge on Point B)
                    } else if (p.ropeA && !p.ropeActive) {
                        p.ropeB = { x: p.x + p.width/2, y: p.y + p.height/2 };
                        p.ropeActive = true;
                        p.ropeDrainTimer = 180;
                        p.ropeGracePeriod = 180;
                        p.ropeSlideTimer = 0;
                        p.isRopeSliding = false;
                        playSound('teleport');
                        voidExplosions.push({ x: p.ropeB.x, y: p.ropeB.y, timer: 15, isWhite: true, isOrange: false, r: 25 });
                        actionTaken = true; // Completes rope for 1 charge
                    }
                }

                if (actionTaken) {
                    if (isLimited) {
                        sharedHealPoints -= cost;
                        sharedHitCount = sharedHealPoints % 8;
                        sharedHeals = Math.floor(sharedHealPoints / 8);
                    } else {
                        let totalHits = sharedHeals * 8 + sharedHitCount - cost;
                        sharedHeals = Math.floor(totalHits / 8);
                        sharedHitCount = totalHits % 8;
                    }
                }
            }
        }
        p.prevStanceKey = kStance;

        // Timers for stances and buffs
        if (p.halberdComboTimer > 0) {
            p.halberdComboTimer--;
            if (p.halberdComboTimer <= 0) p.halberdCombos = 0;
        }
        if (p.halberdBuffTimer > 0) p.halberdBuffTimer--;
        if (p.whirlwindTimer > 0) p.whirlwindTimer--;
        if (p.heatBladeIgniteTimer > 0) {
            p.heatBladeIgniteTimer--;
            p.vx = 0;
            if (p.heatBladeIgniteTimer % 10 === 0) {
                voidExplosions.push({ x: p.x + (p.facingRight ? 25 : 5), y: p.y + 25, timer: 12, isWhite: false, isOrange: true, r: 25 });
            }
            if (p.heatBladeIgniteTimer <= 0) {
                p.heatBladeTimer = 600; // 10s buff
                p.heatHitCount = 0;
                playSound('slash');
                triggerShake(4, 10);
            }
        }
        if (p.heatBladeTimer > 0) p.heatBladeTimer--;
        if (p.demonRageTimer > 0) p.demonRageTimer--;
        if (p.shadowStepCooldown > 0) p.shadowStepCooldown--;
        if (p.comboTimer > 0) {
            p.comboTimer--;
            if (p.comboTimer <= 0) p.comboHits = 0;
        }

        // Water Demon delayed bleed
        if (p.delayedBleedArr && p.delayedBleedArr.length > 0) {
            for (let i = p.delayedBleedArr.length - 1; i >= 0; i--) {
                let b = p.delayedBleedArr[i];
                b.timer--;
                if (b.timer <= 0) {
                    tryDamageBoss(b.dmg, p);
                    playSound('hitBoss');
                    voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 15, isWhite: false, isOrange: false, r: 40 });
                    p.delayedBleedArr.splice(i, 1);
                }
            }
        }

        // Water Demon L-mode Abyss Plunge (F + Down held for 0.5s)
        if (p.type === 'WATER' && p.stance === 'DEMON' && secretMode) {
            if (kDown && kSpec && !p.isHealing && p.overheatTimer <= 0) {
                p.holdDownSpecTimer = (p.holdDownSpecTimer || 0) + 1;
                if (p.holdDownSpecTimer >= 30 && !p.isUnderFloor) {
                    p.isUnderFloor = true;
                    p.y = FLOOR + 60;
                    p.vy = 0;
                    playSound('teleport');
                    triggerShake(6, 12);
                    voidExplosions.push({ x: p.x + 15, y: FLOOR, timer: 20, isWhite: false, isOrange: false, r: 80 });
                }
            } else {
                p.holdDownSpecTimer = 0;
            }
            if (p.isUnderFloor) {
                p.underFloorTimer = (p.underFloorTimer || 0) + 1;
                if (p.underFloorTimer >= 120) { // every 2 seconds drains 0.25 heal
                    p.underFloorTimer = 0;
                    if (sharedHeals >= 0.25) {
                        sharedHeals -= 0.25;
                    } else {
                        takeDamage(p, 0.5, true);
                    }
                }
                if (p.y + p.height <= FLOOR) {
                    p.isUnderFloor = false; // back into arena
                }
            }
        }

        // Hallucinations in L-Mode (>= 3 hits without heal, or >= 4 with Light Amulet)
        let hallThreshold = (p.hasLightAmulet && !p.lightAmuletBroken) ? 4 : 3;
        if (secretMode && p.hallucinationHits >= hallThreshold && !(p.type === 'WATER' && p.stance === 'DEMON')) {
            let beatInterval = Math.floor(Date.now() / 650);
            if (beatInterval % 2 === 0 && !p.lastHeartbeat) {
                playSound('heartbeat');
                p.lastHeartbeat = true;
            } else if (beatInterval % 2 !== 0) {
                p.lastHeartbeat = false;
            }
            if (Math.random() < 0.02) {
                p.vx *= 0.3; // brief micro control slip
            }
        }

        if (p.tpDebuffTimer > 0) { p.tpDebuffTimer--; kSpec = false; kHeal = false; if (p.tpDebuffTimer <= 0) p.purpleHp = 0; }
        if (p.tpCooldown > 0) p.tpCooldown--;
        p.isDashing = false;

        if (p.overheatTimer > 0 || boss.state.includes("SCREAM") || boss.state === "L_INTRO_FALL" || boss.state === "L_INTRO_RISE" || boss.state === "L_PHASE3_RISE" || boss.state === "L_CLIMB_START") {
            kJump = false; kAttack = false; kDash = false; kSpec = false; kLight = false; 
            if (boss.state.includes("SCREAM") || boss.state === "L_CLIMB_START") { kLeft = false; kRight = false; kHeal = false; }
            if (p.overheatTimer > 0) p.speed = 3.5;
        }

        if (boss.state.startsWith("CINEMATIC") || boss.state === "DEFEATED" || boss.state === "FREE_ROAM") {
            if (boss.state === "CINEMATIC_TIE_WAIT") { 
                if (kSpec && !p.prevDaggerKey && !p.hasPressedTie && sharedHeals >= 0.5 && p.overheatTimer<=0) { 
                    sharedHeals -= 0.5; p.hasPressedTie = true; playSound('throw'); 
                } 
            }
            p.prevDaggerKey = kSpec; p.vx = 0; p.vy = 0; p.isHealing = false; p.isAoEHealing = false; 
            if (p.type === 'STAMINA'){ p.isCharging = false; p.chargeTimer = 0; }
            
            if (boss.state === "FREE_ROAM") {
                let moveSpd = p.speed; if (p.invigTimer > 0) moveSpd *= 1.4;
                if (kLeft) { p.vx = -moveSpd; p.facingRight = false; } else if (kRight) { p.vx = moveSpd; p.facingRight = true; }
                if (kJump && !p.prevJumpKey && (onFloor || onPlatform)) { p.vy = p.jumpPowerBase; }
                p.prevJumpKey = kJump; p.vy += GRAVITY;
            }
        } else if (p.tied) {
            if (boss.state !== "SCARF_PULL") { p.vx = 0; p.vy = 0; } 
            p.isHealing = false; p.isAoEHealing = false; p.healTimer = 0; 
            if (p.type === 'STAMINA'){ p.isCharging = false; p.chargeTimer = 0; }
        } else {
            let isLimited = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal);
            let healCost = (p.type === 'FIRE' && kUp) ? 1.5 : (p.isAoEHealing ? 1 : 1);
            let pointCost = (p.type === 'FIRE' && kUp) ? 12 : 8;
            let canAffordHeal = isLimited ? (sharedHealPoints >= pointCost) : (sharedHeals >= healCost);

            if (kHeal && !p.prevHealKey && !p.isHealing && !p.isParrying && canAffordHeal && p.overheatTimer<=0) {
                let isAoE = (p.type === 'WATER' && p.stance !== 'DEMON' && numPlayers === 2 && kUp); 
                let isFiery = (p.type === 'FIRE' && kUp);
                let needsHeal = p.hp < p.maxHp || isFiery || (p.type === 'WATER' && p.stance === 'DEMON'); 
                let hasDownedAlly = players.some(pl => pl.isDowned);
                if (isAoE) needsHeal = players.some(pl => pl.hp < pl.maxHp) || hasDownedAlly;
                if (needsHeal || (p.type === 'STAMINA' && p.stamina < p.maxStamina) || hasDownedAlly) {
                    p.isHealing = true; p.healTimer = 0; p.bleedTimer = 0; p.isAoEHealing = isAoE; p.isFieryHealing = isFiery; p.healCost = healCost; playSound('heal');
                    if (p.hasLightAmulet && !p.lightAmuletBroken) {
                        p.hallucinationHits = 0; // Амулет света сбрасывает счетчик галлюцинаций сразу в момент начала хила!
                    }
                    if (p.type === 'FIRE') {
                        if (isLimited) {
                            sharedHealPoints -= pointCost;
                            sharedHitCount = sharedHealPoints % 8;
                            sharedHeals = Math.floor(sharedHealPoints / 8);
                        } else {
                            sharedHeals -= healCost; 
                        }
                        if (typeof healsUsedInBattle !== 'undefined') healsUsedInBattle++;
                    } 
                    if (numPlayers === 2 && !secretMode && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED") {
                        if (Math.random() < 0.75 && (boss.state === "IDLE" || boss.state === "WALK" || boss.state === "CHASE" || boss.state === "VULN_STANCE")) {
                            boss.state = "HEAL_PUNISH_DASH"; boss.stateTimer = 6; boss.vx = boss.x < p.x ? 80 : -80; boss.color = "#aaaaaa"; playSound('parry'); boss.directAttackActive = true; boss.directAttackHit = false; boss.comboCount = 0;
                        }
                    }
                }
            }
            p.prevHealKey = kHeal;

            let isLightStun = (boss.state === "VOID_SINK_STUN");
            let reqCharge = isLightStun ? 15 : 60;

            // Light dagger: disabled for FIRE and for WATER in Demon form
            let canUseLightDagger = (p.type !== 'FIRE') && !(p.type === 'WATER' && p.stance === 'DEMON');
            let hasLightDaggerCost = isLimited ? (sharedHealPoints >= 4) : (sharedHeals >= 0.5);
            if (secretMode && kLight && canUseLightDagger && hasLightDaggerCost && p.attackCooldown <= 0 && !p.isHealing && p.overheatTimer<=0) {
                if (p.lightCharge === 0) {
                    if (isLimited) {
                        sharedHealPoints -= 4;
                        sharedHitCount = sharedHealPoints % 8;
                        sharedHeals = Math.floor(sharedHealPoints / 8);
                    } else {
                        sharedHeals -= 0.5;
                    }
                }
                p.lightCharge++;
                if (p.lightCharge === reqCharge) {
                    playSound('lightChime');
                }
            } else if (p.lightCharge >= reqCharge && !kLight && p.overheatTimer<=0) {
                p.lightCharge = 0; p.attackCooldown = 30; playSound('slash'); p.attackTimer = 16; p.attackType = "LIGHT";
                let hitW = Math.max(p.atkRange, 120);
                let sHit = { x: p.facingRight ? p.x + p.width : p.x - hitW, y: p.y - 20, width: hitW, height: 70 };
                
                // Phase 4: Destroy Void Orbs only by Light Dagger!
                if (boss.phase === 4 && boss.lPhase4Orbs) {
                    for (let orb of boss.lPhase4Orbs) {
                        if (orb.alive && rectIntersect(sHit, { x: orb.x - orb.r, y: orb.y - orb.r, width: orb.r * 2, height: orb.r * 2 })) {
                            orb.alive = false;
                            playSound('break');
                            playSound('lightChime');
                            playSound('hitBoss');
                            triggerShake(14, 20);
                            triggerVibration('sa_hit');
                            freezeFrames = 8;
                            for (let i = 0; i < 30; i++) {
                                voidExplosions.push({
                                    x: orb.x,
                                    y: orb.y,
                                    vx: (Math.random() - 0.5) * 16,
                                    vy: (Math.random() - 0.5) * 16,
                                    timer: 35,
                                    isWhite: Math.random() > 0.5
                                });
                            }
                            if (!boss.lPhase4Orbs.some(o => o.alive)) {
                                boss.superQueue = [];
                                boss.sa1Arr = [];
                                boss.state = "L_PHASE4_FALL";
                                boss.vx = 0;
                                boss.vy = 12;
                                boss.invuln = 0;
                                playSound('break');
                                triggerShake(18, 25);
                            }
                            break;
                        }
                    }
                }

                if (boss.state === "VOID_SINK_STUN") {
                    let stunHitbox = { x: boss.x - 60, y: boss.y - 30, width: boss.width + 120, height: boss.height + 60 };
                    if (rectIntersect(sHit, stunHitbox)) {
                        triggerVibration('sa_hit'); 
                        triggerShake(12, 18); 
                        freezeFrames = 8;
                        boss.hp -= 2; // -2 HP сразу
                        boss.lightInfected = 300; // заражение светом на 5 сек (300 кадров)
                        boss.lightInfectedDmgRed = 1.0;
                        boss.hunterInfected = 300;
                        boss.color = "#00ffff";
                        boss.state = "IDLE"; 
                        boss.stateTimer = 30;
                        boss.y = FLOOR - boss.height;
                        playSound('hitBoss');
                        recordHit(p);
                        checkPhaseTransition();
                    }
                } else if (boss.state === "SA1_ACTIVE" && !boss.halfHpSeqActive) {
                    for (let ph of boss.sa1Arr) {
                        if (ph.active && ph.timer >= ph.startDelay && rectIntersect(sHit, {x: ph.x - 15, y: ph.y - 25, width: 30, height: 50})) {
                            if (ph.isReal) {
                                triggerVibration('sa_hit'); triggerShake(10, 15); freezeFrames = 6; boss.hp -= 4; 
                                boss.lightInfected = 300; boss.lightInfectedDmgRed = 1.0; boss.hunterInfected = 300;
                                boss.state = "IDLE"; boss.color = "#00ffff"; boss.stateTimer = 30; boss.sa1Arr = []; 
                                boss.y = Math.min(ph.y, FLOOR - boss.height); boss.x = ph.x; 
                                checkPhaseTransition();
                                break;
                            }
                        }
                    }
                } else if (boss.state === "VULN_STANCE" || boss.color === "#ff8800" || (boss.invuln > 0 && boss.state !== "TRANSITION" && boss.state !== "DEFEATED")) {
                    if (rectIntersect(sHit, boss)) {
                        triggerVibration('sa_hit'); 
                        triggerShake(16, 22); 
                        freezeFrames = 10;
                        boss.hp -= 4; // Прямо сейчас наносит 4 урона!
                        boss.lightInfected = 480; // 8 секунд терзания светом (480 кадров, по 0.5 урона/сек = еще 4 урона)
                        boss.lightInfectedDmgRed = 1.0; // босс наносит на 1 хп меньше
                        boss.hunterInfected = 480;
                        boss.color = "#00ffff";
                        boss.state = "HIDDEN_PAUSE"; 
                        boss.stateTimer = 35; 
                        boss.y = -1000;
                        playSound('hitBoss');
                        playSound('lightChime');
                        recordHit(p);
                        checkPhaseTransition();
                    }
                } else if (rectIntersect(sHit, boss) && boss.invuln <= 0 && boss.state !== "TRANSITION") {
                    if (tryDamageBoss(3, p)) { freezeFrames = 6; }
                }
            } else if (!kLight) { 
                if (p.lightCharge > 0 && p.lightCharge < reqCharge) {
                    if (isLimited) {
                        sharedHealPoints = Math.min(MAX_HEAL_POINTS, sharedHealPoints + 4);
                        sharedHitCount = sharedHealPoints % 8;
                        sharedHeals = Math.floor(sharedHealPoints / 8);
                    } else {
                        sharedHeals = Math.min(maxSharedHeals, sharedHeals + 0.5); // Возврат потраченного хила, если игрок не завершил зарядку
                    }
                }
                p.lightCharge = 0; 
            }

            let wallDir = 0; 
            let topWallLimit = (boss.state.startsWith("L_CLIMB") || boss.phase >= 2.5 || secretMode) ? -2000 : (secretMode ? FLOOR/2 - 100 : FLOOR/2);
            let onWall = false;
            let isClimbPhase = boss.state.startsWith("L_CLIMB") || boss.phase === 2.5;
            
            if (!isClimbPhase) {
                if (p.x <= 5 && kLeft && p.y >= topWallLimit && !onPlatform) { onWall = true; wallDir = -1; p.facingRight = true; } 
                else if (p.x >= ARENA_W - p.width - 5 && kRight && p.y >= topWallLimit && !onPlatform) { onWall = true; wallDir = 1; p.facingRight = false; }
            }

            // Reset airDashed when touching floor, platform, or wall
            if (onFloor || onPlatform || onWall) {
                p.airDashed = false;
            }

            // Dash burst trigger on Key C press
            if (kDash && !p.prevDashKey && !p.tied && p.overheatTimer <= 0) {
                let canBurst = false;
                if (onFloor || onPlatform || onWall) {
                    canBurst = true;
                    p.airDashed = false;
                } else if (!p.airDashed) {
                    canBurst = true;
                    p.airDashed = true;
                    p.vy = 0;
                }

                if (canBurst) {
                    let burstFrames = (p.type === 'WATER_ROPE') ? 14 : 10;
                    p.dashBurstTimer = burstFrames;
                    p.dashDir = (kLeft ? -1 : (kRight ? 1 : (p.facingRight ? 1 : -1)));
                    p.facingRight = p.dashDir > 0;
                    playSound('dash');
                    applyPhysicsPushToLeaves(p.x + 15, p.y + 25, 8);
                }

                // Dash Backstab Shadow Teleport for Water Demon & Earth facing boss
                if ((p.type === 'WATER' && p.stance === 'DEMON') || p.type === 'EARTH') {
                    let facingBoss = (p.facingRight && boss.x > p.x) || (!p.facingRight && boss.x < p.x);
                    let dist = Math.abs(boss.x - p.x);
                    if (facingBoss && dist < 450 && p.shadowStepCooldown <= 0 && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED" && !p.tied) {
                        p.shadowStepCooldown = 90;
                        let targetX = boss.facingRight ? boss.x - 35 : boss.x + boss.width + 5;
                        targetX = Math.max(10, Math.min(ARENA_W - 40, targetX));
                        p.x = targetX;
                        p.y = boss.y;
                        p.facingRight = boss.x > p.x;
                        playSound('teleport');
                        triggerShake(3, 6);
                    }
                }
            }
            p.prevDashKey = kDash;

            let baseSpd = { 'WATER': 5, 'EARTH': 5.5, 'AIR': 5.5, 'STAMINA': 5, 'FIRE': 5.25, 'FIRE_HALBERD': 5.1, 'WATER_ROPE': 5.4 }[p.type] || 5;
            let sprintSpd = { 'WATER': 7.8, 'EARTH': 8.2, 'AIR': 8.2, 'STAMINA': 7.2, 'FIRE': 7.6, 'FIRE_HALBERD': 7.8, 'WATER_ROPE': 8.2 }[p.type] || 7.8;
            let isSprinting = kDash && (onFloor || onPlatform) && p.dashBurstTimer <= 0;
            p.speed = (isSprinting ? sprintSpd : baseSpd) * p.speedMod;
            p.isDashing = isSprinting || (p.dashBurstTimer > 0);

            // Dash Strike Badge: Dashing through boss inflicts 1.5 damage
            if (p.isDashing && p.badges && p.badges.includes('dash_strike')) {
                if (!p.dashStrikeCooldown) p.dashStrikeCooldown = 0;
                if (p.dashStrikeCooldown <= 0 && rectIntersect(p, boss) && boss.invuln <= 0 && boss.state !== "TRANSITION" && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED") {
                    p.dashStrikeCooldown = 35;
                    tryDamageBoss(1.5, p);
                    playSound('slash');
                    triggerShake(6, 12);
                    triggerVibration('attack');
                    voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 16, isWhite: true, isOrange: false, r: 55 });
                }
            }
            if (p.dashStrikeCooldown > 0) p.dashStrikeCooldown--;

            if (p.type === 'WATER' && p.stance === 'LIGHT' && kDash && kUp && p.tpCooldown <= 0 && (isLimited ? sharedHealPoints >= 4 : sharedHeals >= 0.5) && (numPlayers === 1 || secretMode) && p.overheatTimer<=0) { 
                if (isLimited) {
                    sharedHealPoints -= 4;
                    sharedHitCount = sharedHealPoints % 8;
                    sharedHeals = Math.floor(sharedHealPoints / 8);
                } else {
                    sharedHeals -= 0.5;
                }
                p.tpCooldown = 420; p.tpDebuffTimer = 180; p.purpleHp = 2; p.x = Math.random() * (ARENA_W - p.width); playSound('teleport'); applyPhysicsPushToLeaves(p.x, p.y, 20); 
            }

            if (p.type === 'FIRE') {
                if (kSpec && !p.prevDaggerKey && !p.isHealing && p.attackCooldown <= 0 && p.overheatTimer<=0) {
                    let intendedSlot = 'mid';
                    if (kUp) intendedSlot = 'top';
                    else if (kAttack) intendedSlot = 'bot';

                    let ab = p.abilities[intendedSlot];
                    if (ab && ab !== 'none') {
                        executeAbility(p, ab);
                    } else {
                        // Defaults if slot is none:
                        if (intendedSlot === 'top') {
                            executeAbility(p, 'shuriken');
                        } else if (intendedSlot === 'bot') {
                            // F + X default Ignite!
                            executeAbility(p, 'ignite');
                        } else {
                            // F default Parry!
                            executeAbility(p, 'parry');
                        }
                    }
                    p.prevDaggerKey = true;
                }
                if (p.orangeHpTimer > 0) { p.orangeHpTimer--; if (p.orangeHpTimer <= 0) p.orangeHp = 0; }
            } else if (p.type === 'FIRE_HALBERD') {
                if (kSpec && !p.prevDaggerKey && !p.isHealing && p.attackCooldown <= 0 && p.overheatTimer<=0) {
                    let intendedSlot = kUp ? 'top' : 'mid';
                    let ab = p.abilities[intendedSlot] || (intendedSlot === 'top' ? 'shuriken' : 'whirlwind');
                    if (ab && ab !== 'none') {
                        executeAbility(p, ab);
                    }
                    p.prevDaggerKey = true;
                }
            } else {
                let intendedSlot = 'mid';
                if (kUp) intendedSlot = 'top';
                else if (kAttack) intendedSlot = 'bot';

                let ab = p.abilities[intendedSlot];
                if (!ab && intendedSlot !== 'mid') ab = p.abilities['mid'];

                if (kSpec && !p.prevDaggerKey && !p.isHealing && p.attackCooldown <= 0 && p.overheatTimer<=0 && ab && ab !== 'none') {
                    executeAbility(p, ab);
                    p.prevDaggerKey = true;
                }

                if (p.isCharging) {
                    if (!kSpec) { fireCharge(p); } 
                    else { 
                        let canPayCharge = isLimited ? (sharedHealPoints >= 4) : (sharedHeals >= 0.5);
                        let payCharge = () => {
                            if (isLimited) {
                                sharedHealPoints -= 4;
                                sharedHitCount = sharedHealPoints % 8;
                                sharedHeals = Math.floor(sharedHealPoints / 8);
                            } else {
                                sharedHeals -= 0.5;
                            }
                        };
                        if (p.chargeTimer === 0 && canPayCharge) payCharge(); 
                        p.chargeTimer++; 
                        if (p.chargeTimer % 60 === 0) { 
                            if (canPayCharge) payCharge(); else fireCharge(p); 
                        } 
                    }
                }
            }
            
            if (!kSpec) p.prevDaggerKey = false;
            
            let isFallingTransition = (boss.state === "L_CLIMB_TRANSITION" && boss.transitionTimer < 120);
            if (!isFallingTransition && !p.isUnderFloor && (p.y > camY + GAME_HEIGHT + 150 || p.y > FLOOR + 250)) {
                if (isClimbPhase && p.invuln > 0) {
                    // Во время подъема по платформам при неуязвимости (например, после SA2) игрок не получает урон от бездны!
                    p.x = p.lastSafeX || (ARENA_W / 2); 
                    p.y = p.lastSafeY !== undefined ? p.lastSafeY : (FLOOR - 50); 
                    p.vy = 0; 
                    p.vx = 0;
                } else {
                    takeDamage(p, 1, false, false, false); // НЕ пробиваем неуязвимость, чтобы исключить мгновенную мультисмерть!
                    p.invuln = 90; // Честное окно неуязвимости после падения
                    p.x = p.lastSafeX || (ARENA_W / 2); 
                    p.y = p.lastSafeY !== undefined ? p.lastSafeY : (FLOOR - 50); 
                    p.vy = 0; 
                    p.vx = 0;
                    triggerShake(6, 12);
                    if (isClimbPhase) {
                        camY = Math.min(Math.max(p.y - GAME_HEIGHT / 2, -2000), FLOOR - GAME_HEIGHT + 100);
                    }
                }
            }

            if (onFloor || onWall || onPlatform || p.isUnderFloor) {
                p.jumps = 0;
                p.airDashed = false;
            }

            if (p.isParrying) {
                p.vx = 0; p.vy = 0; p.parryTimer--;
                if (p.parryTimer <= 0) p.isParrying = false;
            } else if (p.isHealing) {
                p.vx = 0; p.vy = 0; p.healTimer++; 
                let isLimited = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal);
                let consumeCompletedHeal = () => {
                    if (isLimited) {
                        sharedHealPoints = Math.max(0, sharedHealPoints - 8);
                        sharedHitCount = sharedHealPoints % 8;
                        sharedHeals = Math.floor(sharedHealPoints / 8);
                    } else {
                        sharedHeals--;
                    }
                };
                
                if (p.isMultiHeal && !p.isAoEHealing && !(p.type === 'WATER' && p.stance === 'DEMON')) {
                    let half = Math.floor(120 / 2);
                    let baseAmt = p.type === 'EARTH' ? 2 : (p.type === 'AIR' || p.type === 'STAMINA' ? 2.5 : 3);
                    let amt = baseAmt - 0.75;
                    if (p.healTimer === half) { p.hp = Math.min(p.maxHp, p.hp + amt); playSound('heal'); if (p.type === 'STAMINA' && !p.isDowned) p.stamina = Math.min(p.maxStamina, p.stamina + 2); }
                    if (p.healTimer >= 120) { 
                        p.hp = Math.min(p.maxHp, p.hp + amt); 
                        if (p.type === 'STAMINA' && !p.isDowned) p.stamina = Math.min(p.maxStamina, p.stamina + 2); 
                        if (p.type !== 'FIRE') consumeCompletedHeal(); 
                        if (typeof healsUsedInBattle !== 'undefined') healsUsedInBattle++;
                        p.isHealing = false; 
                        p.healTimer = 0; 
                        p.hallucinationHits = 0; 
                    }
                } else {
                    let targetTime = (p.type === 'WATER' && p.stance === 'DEMON') ? 60 : (p.isAoEHealing ? 240 : p.healFramesTotal);
                    if (p.healTimer >= targetTime) { 
                        p.hallucinationHits = 0; // Healing resets hallucination counter!
                        let downedAlly = players.find(pl => pl.isDowned);
                        let didRevive = false;
                        let revivingHp = p.hp;
                        if (typeof healsUsedInBattle !== 'undefined') healsUsedInBattle++;
                        if (p.type === 'WATER' && p.stance === 'DEMON') {
                            p.hp = Math.min(p.maxHp, p.hp + 1);
                            p.purpleHp = Math.min(6, p.purpleHp + 1);
                            p.demonRageTimer = 300; // 5 seconds +25% damage!
                            consumeCompletedHeal();
                            playSound('heal');
                        } else if (p.isAoEHealing) { 
                            for(let pl of players) { 
                                if (pl.isDowned) { pl.isDowned = false; pl.hp = 3; pl.stamina = 3; pl.downedTimer=0; didRevive = true; } 
                                else { pl.hp = Math.min(pl.maxHp, pl.hp + 2); } 
                            } 
                            consumeCompletedHeal();
                        } 
                        else if (p.type === 'WATER') {
                            p.hp = Math.min(p.maxHp, p.hp + 3);
                            if (downedAlly) { downedAlly.isDowned = false; downedAlly.hp = 1.5; downedAlly.stamina = 2; downedAlly.downedTimer=0; didRevive = true; }
                            consumeCompletedHeal();
                        }
                        else if (p.type === 'FIRE') {
                            p.hp = Math.min(p.maxHp, p.hp + 2.5);
                            if (downedAlly) { downedAlly.isDowned = false; downedAlly.hp = 1.5; downedAlly.stamina = 2; downedAlly.downedTimer=0; didRevive = true; }
                            if (p.isFieryHealing) {
                                // Massive fire pillar eruption across half the arena
                                let fPillar = { x: p.x - (ARENA_W / 4), y: -1000, width: ARENA_W / 2, height: 3000 };
                                if (rectIntersect(fPillar, boss)) { tryDamageBoss(3.5, p); }
                                p.orangeHp = 1; p.orangeHpTimer = 180;
                                triggerShake(16, 25);
                                playSound('heatIgnite');
                                voidExplosions.push({ x: p.x, y: FLOOR - 100, timer: 30, isWhite: false, isOrange: true, r: 250 });
                            }
                        }
                        else if (p.type === 'FIRE_HALBERD') {
                            p.hp = Math.min(p.maxHp, p.hp + 1.5);
                            p.halberdBuffTimer = 300; // 5s buff: +0.5 dmg, attack cd as water (24)
                            p.halberdVampiricReady = true; // next hit vampiric heal +1 HP
                            if (downedAlly) { downedAlly.isDowned = false; downedAlly.hp = 1.5; downedAlly.stamina = 2; downedAlly.downedTimer=0; didRevive = true; }
                            consumeCompletedHeal();
                            playSound('heatIgnite');
                            voidExplosions.push({ x: p.x + p.width/2, y: p.y + p.height/2, timer: 20, isWhite: true, isOrange: true, r: 60 });
                        }
                        else if (p.type === 'WATER_ROPE') {
                            p.hp = Math.min(p.maxHp, p.hp + 2.5);
                            if (downedAlly) { downedAlly.isDowned = false; downedAlly.hp = 1.5; downedAlly.stamina = 2; downedAlly.downedTimer=0; didRevive = true; }
                            consumeCompletedHeal();
                            if (isLimited) {
                                sharedHealPoints = Math.min(MAX_HEAL_POINTS, sharedHealPoints + 1);
                                sharedHitCount = sharedHealPoints % 8;
                                sharedHeals = Math.floor(sharedHealPoints / 8);
                            } else {
                                sharedHitCount++;
                                if (sharedHitCount >= 8) {
                                    sharedHitCount -= 8;
                                    sharedHeals = Math.min(maxSharedHeals, sharedHeals + 1);
                                }
                            }
                            playSound('heal');
                        }
                        else { 
                            let amt = p.type === 'EARTH' ? 2 : (p.type === 'AIR' || p.type === 'STAMINA' ? 2.5 : 3); p.hp = Math.min(p.maxHp, p.hp + amt); 
                            if (p.type === 'STAMINA' && !p.isDowned) p.stamina = Math.min(p.maxStamina, p.stamina + 2); 
                            if (downedAlly) { downedAlly.isDowned = false; downedAlly.hp = 1.5; downedAlly.stamina = 2; downedAlly.downedTimer=0; didRevive = true; }
                            consumeCompletedHeal();
                        }

                        // Achievement: «Брат за брата» (Поднять напарника в коопе, когда у вас осталось всего 1 HP)
                        if (didRevive && revivingHp <= 1.05 && numPlayers === 2) {
                            let curU = (p.id === 1) ? getCurrentUser() : getP2User();
                            if (curU && typeof unlockAchievement === 'function') {
                                unlockAchievement('brother_for_brother', curU);
                            }
                        }

                        p.isHealing = false; p.isAoEHealing = false; p.isFieryHealing = false; p.healTimer = 0;
                        if (p.badges && p.badges.includes('shield')) p.hasAegisShield = true;
                    }
                }
            } else {
                if (p.wallJumpCooldown > 0) p.wallJumpCooldown--;
                else if (p.isRopeSliding) {
                    // Handled in rope slide logic
                } else if (p.dashBurstTimer > 0) {
                    p.dashBurstTimer--;
                    let burstVelocity = (p.type === 'WATER_ROPE') ? 13.5 : 11.5;
                    p.vx = p.dashDir * burstVelocity * p.speedMod;
                    if (!onFloor && !onPlatform) p.vy = Math.min(p.vy, 0.4);
                } else if (p.type === 'FIRE' && p.fireLungeTimer > 0) {
                    p.vx = (p.facingRight ? 1 : -1) * 20;
                    if (!onFloor && !onPlatform) p.vy = Math.min(p.vy, 0.2);
                    p.isDashing = true;

                    // Physical Lunge Strike collision with boss during forward rush
                    if (!p.fireLungeHit) {
                        let lReach = 55;
                        let lBox = {
                            x: p.facingRight ? p.x : p.x - lReach,
                            y: p.y - 10,
                            width: p.width + lReach,
                            height: p.height + 20
                        };
                        if (rectIntersect(lBox, boss) && boss.invuln <= 0 && boss.state !== "TRANSITION" && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED") {
                            p.fireLungeHit = true;
                            let lungeDmg = (p.heatBladeTimer > 0) ? 2.5 : 1.0;
                            tryDamageBoss(lungeDmg, p);
                            if (p.heatBladeTimer > 0) {
                                boss.bossBurnTimer = 180;
                                boss.bossBurnTicks = 3;
                                playSound('heatIgnite');
                            }
                            playSound('rockCrit');
                            playSound('slash');
                            triggerShake(8, 14);
                            triggerVibration('attack');
                            voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 18, isWhite: false, isOrange: true, r: 75 });
                            // Refund 1 hit charge:
                            let isLimited = (typeof activeChallenges !== 'undefined' && activeChallenges && activeChallenges.limitedHeal);
                            if (isLimited) {
                                sharedHealPoints = Math.min(MAX_HEAL_POINTS, sharedHealPoints + 1);
                                sharedHitCount = sharedHealPoints % 8;
                                sharedHeals = Math.floor(sharedHealPoints / 8);
                            } else {
                                sharedHitCount++;
                                if (sharedHitCount >= 8) {
                                    sharedHitCount -= 8;
                                    sharedHeals = Math.min(maxSharedHeals, sharedHeals + 1);
                                }
                            }
                        }
                    }
                } else if (p.type === 'FIRE' && p.fireDashTimer > 0) {
                    p.vx = (p.facingRight ? 1 : -1) * 12; p.fireDashTimer--;
                } else {
                    let moveSpd = p.speed; if (p.invigTimer > 0) moveSpd *= 1.4;
                    if (isSprinting && !kLeft && !kRight) {
                        p.vx = (p.facingRight ? 1 : -1) * moveSpd;
                    } else if (kLeft) {
                        p.vx = -moveSpd; p.facingRight = false;
                    } else if (kRight) {
                        p.vx = moveSpd; p.facingRight = true;
                    } else {
                        p.vx = 0;
                    }
                }

                if (kJump) {
                    if (!p.prevJumpKey) {
                        if (onFloor || onPlatform || p.isUnderFloor) { p.vy = p.jumpPowerBase * jumpMod; p.jumps = 1; applyPhysicsPushToLeaves(p.x + 15, p.y + 50, 5); }
                        else if (onWall) { p.vy = p.jumpPowerBase * jumpMod; p.vx = (wallDir === -1 ? 1 : -1) * (globalWindMode === "DOWN" ? 2 : 5); p.wallJumpCooldown = globalWindMode === "DOWN" ? 2 : 6; applyPhysicsPushToLeaves(p.x + 15, p.y + 25, 4); }
                        else if (p.jumps < p.maxJumps) { p.vy = p.jumpPowerBase * jumpMod; p.jumps++; applyPhysicsPushToLeaves(p.x + 15, p.y + 50, 5); }
                    }
                    p.prevJumpKey = true;
                } else {
                    p.prevJumpKey = false;
                    if (p.vy < 0) p.vy *= 0.5; 
                }

                if (p.attackCooldown > 0) p.attackCooldown--; if (p.attackTimer > 0) p.attackTimer--;

                if (kAttack && !p.prevAttackKey && p.overheatTimer <= 0 && p.chillTimer <= 0 && !kSpec) {
                    p.spamResetTimer = 120;
                    p.attackSpamCount++;
                    p.heatLevel = Math.max(p.heatLevel, Math.min(1, p.attackSpamCount / 10));
                    if (p.attackSpamCount >= 10) { p.overheatTimer = 90; p.attackSpamCount = 0; p.spamResetTimer = 0; }
                }

                // Water Rope: Concentration in air & Rope Riding
                if (p.type === 'WATER_ROPE') {
                    if (p.ropeActive && p.ropeA && p.ropeB) {
                        let pCenter = { x: p.x + p.width/2, y: p.y + p.height/2 };
                        let dist = distToSegment(pCenter, p.ropeA, p.ropeB);
                        
                        // Grab rope with Attack key (X) when close (< 70px)
                        if (kAttack && !p.prevAttackKey && !p.isRopeSliding) {
                            if (dist < 70) {
                                p.isRopeSliding = true;
                                p.ropeSlideTimer = 180; // 3 sec slide
                                let l2 = (p.ropeB.x - p.ropeA.x)**2 + (p.ropeB.y - p.ropeA.y)**2;
                                if (l2 > 0) {
                                    p.ropeT = Math.max(0, Math.min(1, ((pCenter.x - p.ropeA.x)*(p.ropeB.x - p.ropeA.x) + (pCenter.y - p.ropeA.y)*(p.ropeB.y - p.ropeA.y)) / l2));
                                } else {
                                    p.ropeT = 0.5;
                                }
                                playSound('parry');
                                playSound('teleport');
                                triggerVibration('attack');
                            }
                        }

                        if (p.isRopeSliding) {
                            p.ropeSlideTimer--;
                            let jumpDismount = kJump && !p.prevJumpKey;
                            if (p.ropeSlideTimer <= 0 || jumpDismount) {
                                p.isRopeSliding = false;
                                if (jumpDismount) {
                                    p.vy = -12; // Responsive jump dismount
                                    p.airDashed = false;
                                    playSound('dash');
                                }
                            } else {
                                let dx = p.ropeB.x - p.ropeA.x;
                                let dy = p.ropeB.y - p.ropeA.y;
                                let ropeLen = Math.hypot(dx, dy) || 1;
                                let dt = 8.5 / ropeLen;

                                let moveForward = false;
                                let moveBackward = false;

                                if (kRight && dx >= 0) moveForward = true;
                                if (kRight && dx < 0) moveBackward = true;
                                if (kLeft && dx <= 0) moveForward = true;
                                if (kLeft && dx > 0) moveBackward = true;
                                if (kDown && dy >= 0) moveForward = true;
                                if (kDown && dy < 0) moveBackward = true;
                                if (kUp && dy <= 0) moveForward = true;
                                if (kUp && dy > 0) moveBackward = true;

                                if (moveForward && !moveBackward) {
                                    p.ropeT = Math.min(1, p.ropeT + dt);
                                    if (dx !== 0) p.facingRight = dx > 0;
                                } else if (moveBackward && !moveForward) {
                                    p.ropeT = Math.max(0, p.ropeT - dt);
                                    if (dx !== 0) p.facingRight = dx < 0;
                                }

                                p.x = p.ropeA.x + dx * p.ropeT - p.width / 2;
                                p.y = p.ropeA.y + dy * p.ropeT - p.height / 2;
                                p.vx = 0;
                                p.vy = 0;
                            }
                        }
                    }

                    let pCenter = { x: p.x + p.width/2, y: p.y + p.height/2 };
                    let nearRope = (p.ropeActive && p.ropeA && p.ropeB && distToSegment(pCenter, p.ropeA, p.ropeB) < 95);

                    if (!p.isRopeSliding && !nearRope) {
                        if (kAttack) {
                            p.concentrateTimer = (p.concentrateTimer || 0) + 1;
                            if (!onFloor && !onPlatform) {
                                p.vy = Math.min(p.vy, 0.4);
                                p.vx *= 0.85;
                            } else {
                                p.vx *= 0.8;
                            }
                            if (p.concentrateTimer % 8 === 0) {
                                voidExplosions.push({
                                    x: p.x + p.width/2 + (Math.random() - 0.5) * 25,
                                    y: p.y + p.height/2 + (Math.random() - 0.5) * 25,
                                    timer: 10,
                                    isWhite: true,
                                    isOrange: false,
                                    r: 16
                                });
                            }
                            if (p.concentrateTimer === 60) {
                                slowMoTimer = 60; // 1 second slow-mo
                                p.concentrateReady = true;
                                playSound('lightChime');
                                triggerVibration('clash');
                                triggerShake(4, 8);
                            }
                        } else {
                            if (p.concentrateReady) {
                                p.concentrateReady = false;
                                p.concentrateTimer = 0;
                                p.attackCooldown = 28;

                                if (kDash) {
                                    // Release X + C combo: Rushing Tidal Surge Strike!
                                    p.attackType = "TIDAL_SURGE";
                                    p.attackTimer = 22;
                                    p.dashBurstTimer = 16;
                                    p.dashDir = p.facingRight ? 1 : -1;
                                    p.vx = (p.facingRight ? 1 : -1) * 22;
                                    playSound('dash');
                                    playSound('slash');
                                    playSound('bladeSpin');
                                    triggerShake(12, 18);
                                    triggerVibration('sa_hit');
                                    let surgeBox = { x: p.facingRight ? p.x : p.x - 170, y: p.y - 30, width: p.width + 170, height: p.height + 60 };
                                    if (rectIntersect(surgeBox, boss) && boss.invuln <= 0 && boss.state !== "TRANSITION" && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED") {
                                        tryDamageBoss(2.75, p);
                                        boss.state = "STUN";
                                        boss.stateTimer = 60;
                                        boss.vx = 0; boss.vy = 0;
                                        freezeFrames = 8;
                                        playSound('rockCrit');
                                        voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 25, isWhite: true, isOrange: false, r: 100 });
                                    }
                                } else if (kDown && !onFloor && !onPlatform) {
                                    p.attackType = "SUPER_POGO";
                                    p.attackTimer = 18;
                                    p.vy = 18;
                                    playSound('rockCrit');
                                    triggerShake(8, 14);
                                } else {
                                    // Release X alone: One Crushing Strike (Сокрушительный удар на 2.5 урона)
                                    p.attackType = "CRUSHING_STRIKE";
                                    p.attackTimer = 22;
                                    playSound('slash');
                                    playSound('rockCrit');
                                    triggerShake(10, 16);
                                    triggerVibration('attack');
                                    let crushRange = 90;
                                    let crushBox = { x: p.facingRight ? p.x + p.width : p.x - crushRange, y: p.y - 15, width: crushRange, height: p.height + 30 };
                                    if (rectIntersect(crushBox, boss) && boss.invuln <= 0 && boss.state !== "TRANSITION" && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED") {
                                        tryDamageBoss(2.5, p);
                                        boss.state = "STUN";
                                        boss.stateTimer = 45;
                                        boss.vx = (p.facingRight ? 1 : -1) * 10;
                                        freezeFrames = 6;
                                        voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 20, isWhite: true, isOrange: false, r: 85 });
                                    }
                                }
                            } else {
                                p.concentrateReady = false;
                                p.concentrateTimer = 0;
                            }
                        }
                    } else if (nearRope) {
                        p.concentrateReady = false;
                        p.concentrateTimer = 0;
                    }
                }

                // Super Pogo Dive Collision with Boss
                if (p.attackType === "SUPER_POGO") {
                    let spBox = { x: p.x - 20, y: p.y + p.height - 5, width: p.width + 40, height: 50 };
                    if (rectIntersect(spBox, boss) && boss.invuln <= 0 && boss.state !== "TRANSITION" && !boss.state.startsWith("CINEMATIC") && boss.state !== "DEFEATED") {
                        tryDamageBoss(2.0, p);
                        boss.state = "STUN";
                        boss.stateTimer = 60; // 1s stun
                        boss.vx = 0; boss.vy = 0;
                        p.vy = -15;
                        p.jumps = 1;
                        p.airDashed = false;
                        p.attackType = "NORMAL";
                        playSound('rockCrit');
                        playSound('parry');
                        triggerShake(12, 18);
                        freezeFrames = 8;
                        voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 20, isWhite: true, isOrange: false, r: 90 });
                    }
                    if (onFloor || onPlatform) {
                        p.attackType = "NORMAL";
                    }
                }

                let swordHitbox = null;
                let nearRopeForAttack = (p.type === 'WATER_ROPE' && p.ropeActive && p.ropeA && p.ropeB && distToSegment({ x: p.x + p.width/2, y: p.y + p.height/2 }, p.ropeA, p.ropeB) < 95);
                let canAttackNow = kAttack && !p.prevAttackKey && p.attackCooldown <= 0 && p.lightCharge === 0 && p.overheatTimer <= 0 && !kSpec && !p.isRopeSliding && !nearRopeForAttack;
                if (canAttackNow) {
                    if (p.type === 'AIR') {
                        p.attackCooldown = 60; playSound('throw'); 
                        let dx = (boss.x + boss.width/2) - (p.x + p.width/2); 
                        let dy = (boss.y + boss.height/2) - (p.y + p.height/2); 
                        let dist = Math.hypot(dx, dy); 
                        airTraps.push({ x: p.x + p.width/2, y: p.y + p.height/2, vx: (dx/dist)*14, vy: (dy/dist)*14, pId: p.id });
                    } else {
                        p.attackTimer = 12; 
                        let cdBase = (p.type === 'STAMINA' && p.weaponMode === 'BLUE') ? 12 : p.atkCdBase;
                        if (p.type === 'FIRE_HALBERD' && p.halberdBuffTimer > 0) cdBase = 24;
                        p.attackCooldown = cdBase; 
                        playSound('slash'); 
                        triggerVibration('attack');
                        
                        let currentAtkRange = p.atkRange;
                        let isUpAtk = kUp && !kDown;
                        
                        if (isUpAtk) {
                            // Upward Attack (X + Up) for all heroes
                            p.attackType = "UP";
                            swordHitbox = { x: p.x - 15, y: p.y - currentAtkRange, width: p.width + 30, height: currentAtkRange + 15 };
                            applyPhysicsPushToLeaves(p.x + 15, p.y - 20, 6);
                        } else if (p.type === 'FIRE') {
                            if (kDown && !onFloor) { p.attackType = "DIVE"; p.vy = 15; p.vx = (p.facingRight ? 1 : -1) * 15; p.attackTimer = 20; swordHitbox = { x: p.facingRight ? p.x : p.x - 30, y: p.y + p.height, width: p.width + 30, height: 40 }; } 
                            else if (kDash) { p.attackType = "HEAVY"; p.attackTimer = 18; p.attackCooldown = 30; currentAtkRange += 15; swordHitbox = { x: p.facingRight ? p.x + p.width : p.x - currentAtkRange, y: p.y + 10, width: currentAtkRange, height: 20 }; } 
                            else { p.attackType = "NORMAL"; swordHitbox = { x: p.facingRight ? p.x + p.width : p.x - p.atkRange, y: p.y + 10, width: p.atkRange, height: 20 }; }
                        } else if (p.type === 'FIRE_HALBERD') {
                            if (kDown && !onFloor) { p.attackType = "DOWN"; swordHitbox = { x: p.x - 20, y: p.y + p.height - 10, width: 70, height: 130 }; applyPhysicsPushToLeaves(p.x + 15, p.y + 50, 6); }
                            else { p.attackType = "NORMAL"; swordHitbox = { x: p.facingRight ? p.x + p.width : p.x - 130, y: p.y + 5, width: 130, height: 30 }; applyPhysicsPushToLeaves(swordHitbox.x + 65, swordHitbox.y + 10, 5); }
                        } else if (p.type === 'WATER_ROPE') {
                            if (kDown && !onFloor) { p.attackType = "DOWN"; swordHitbox = { x: p.x - 15, y: p.y + p.height - 10, width: 52, height: 45 }; applyPhysicsPushToLeaves(p.x + 11, p.y + 38, 5); }
                            else { p.attackType = "NORMAL"; swordHitbox = { x: p.facingRight ? p.x + p.width : p.x - 58, y: p.y + 8, width: 58, height: 20 }; applyPhysicsPushToLeaves(swordHitbox.x + 29, swordHitbox.y + 10, 3); }
                        } else {
                            if (kDown && !onFloor) { p.attackType = "DOWN"; swordHitbox = { x: p.x - 20, y: p.y + p.height - 10, width: 70, height: 45 }; applyPhysicsPushToLeaves(p.x + 15, p.y + 50, 6); } 
                            else { p.attackType = "NORMAL"; swordHitbox = { x: p.facingRight ? p.x + p.width : p.x - p.atkRange, y: p.y + 10, width: p.atkRange, height: 20 }; applyPhysicsPushToLeaves(swordHitbox.x + p.atkRange/2, swordHitbox.y + 10, 4); }
                        }

                        // Tutorial targets hit check
                        if (typeof isTutorial !== 'undefined' && isTutorial && typeof tutorialTargets !== 'undefined') {
                            for (let ti = tutorialTargets.length - 1; ti >= 0; ti--) {
                                let trg = tutorialTargets[ti];
                                let trgBox = { x: trg.x - trg.r, y: trg.y - trg.r, width: trg.r * 2, height: trg.r * 2 };
                                if (rectIntersect(swordHitbox, trgBox)) {
                                    playSound('hitBoss');
                                    playSound('parry');
                                    triggerShake(3, 5);
                                    voidExplosions.push({ x: trg.x, y: trg.y, timer: 20, isWhite: true, r: 25 });
                                    tutorialTargets.splice(ti, 1);
                                }
                            }
                        }

                        for(let i=airBlades.length-1; i>=0; i--) { 
                            let b = airBlades[i];
                            if (b.state === "SHOOT" && rectIntersect(swordHitbox, {x: b.x-10, y: b.y-10, width: 20, height: 20})) { 
                                b.vx = -b.vx * 1.5; b.vy = -b.vy * 1.5; b.deflected = 1; triggerVibration('clash'); triggerShake(2, 5); playSound('parry'); freezeFrames = 5;
                            } 
                        }
                        for(let i=blackDaggers.length-1; i>=0; i--) { 
                            let d = blackDaggers[i];
                            if (rectIntersect(swordHitbox, {x: d.x-10, y: d.y-10, width: 20, height: 20})) { 
                                d.vx = -d.vx * 1.5; d.vy = -d.vy * 1.5; d.deflected = 1; triggerVibration('clash'); triggerShake(2, 5); playSound('parry'); freezeFrames = 5;
                            } 
                        }

                        if (boss.state === "SA1_ACTIVE" && !boss.halfHpSeqActive) {
                            for (let ph of boss.sa1Arr) {
                                if (ph.active && ph.timer >= ph.startDelay && rectIntersect(swordHitbox, {x: ph.x - 15, y: ph.y - 25, width: 30, height: 50})) {
                                    if (ph.isReal) {
                                        triggerVibration('sa_hit'); triggerShake(10, 15); boss.hp -= 3; freezeFrames = 8;
                                        boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 30; boss.sa1Arr = []; boss.y = Math.min(ph.y, FLOOR - boss.height); boss.x = ph.x; break;
                                    }
                                }
                            }
                        } else {
                            let clashHappened = false;
                            if (boss.state === "LUNGE" && rectIntersect(swordHitbox, boss)) {
                                playSound('parry'); boss.state = "IDLE"; boss.color = "#e6c800"; boss.stateTimer = 30; boss.vx = boss.x < p.x ? -15 : 15; p.vx = boss.x < p.x ? 15 : -15; p.vy = -5; p.invuln = 30; boss.invuln = 10; clashFlash = {x: p.x + 15, y: p.y + 25, timer: 15}; clashHappened = true; applyPhysicsPushToLeaves(clashFlash.x, clashFlash.y, 20); triggerVibration('clash'); triggerShake(3, 5); freezeFrames = 6;
                            }

                            if (!clashHappened && rectIntersect(swordHitbox, boss)) {
                                // Calculate base damage multiplier for this hit
                                let dmgToDeal = p.dmgMulti;
                                let isFarHalberdHit = false;

                                if (p.type === 'FIRE_HALBERD') {
                                    let farBox;
                                    if (p.attackType === "UP") {
                                        farBox = { x: p.x - 15, y: p.y - 130, width: p.width + 30, height: 65 };
                                    } else if (p.attackType === "DOWN") {
                                        farBox = { x: p.x - 20, y: p.y + p.height + 55, width: 70, height: 75 };
                                    } else {
                                        farBox = { x: p.facingRight ? p.x + p.width + 65 : p.x - 130, y: p.y - 5, width: 65, height: 45 };
                                    }
                                    if (rectIntersect(farBox, boss)) {
                                        isFarHalberdHit = true;
                                        dmgToDeal = 1.5;
                                    } else {
                                        dmgToDeal = 1.0;
                                    }
                                    if (p.halberdBuffTimer > 0) dmgToDeal += 0.5;
                                    if (p.heatBladeTimer > 0) dmgToDeal += 1.25; // +1.25 Fire Wave damage when ignited!
                                } else if (p.type === 'WATER_ROPE') {
                                    if (p.attackType === "TIDAL_SURGE") dmgToDeal = 2.75;
                                    else if (p.attackType === "CRUSHING_STRIKE") dmgToDeal = 2.5;
                                    else if (p.attackType === "SUPER_POGO") dmgToDeal = 2.0;
                                    else if (p.attackType === "DOWN") dmgToDeal = 1.25;
                                    else dmgToDeal = 0.75;
                                }
                                
                                if (p.type === 'WATER' && p.stance === 'DEMON') {
                                    if (secretMode) dmgToDeal = 0.75;
                                    if (p.demonRageTimer > 0) dmgToDeal *= 1.25;
                                }
                                if (p.type === 'STAMINA') {
                                    if (p.weaponMode === 'PINK') {
                                        dmgToDeal = 2.5; // Colossal damage!
                                    } else {
                                        dmgToDeal = 1.0;
                                    }
                                }
                                if (p.type === 'FIRE' && p.heatBladeTimer > 0) {
                                    dmgToDeal *= 1.5; // 1.5x Heat Blade buff!
                                }
                                if (p.type === 'EARTH') {
                                    let critChance = 0;
                                    if (sharedHeals >= 5) critChance = 0.15;
                                    else if (sharedHeals >= 4) critChance = 0.125;
                                    else if (sharedHeals >= 3) critChance = 0.10;
                                    else if (sharedHeals >= 2) critChance = 0.075;
                                    else if (sharedHeals >= 1) critChance = 0.05;

                                    if (p.hasLuckyCharm) critChance += 0.02; // +2% синергия от Талисмана удачи!

                                    if (Math.random() < critChance) {
                                        dmgToDeal *= 3; // *3 CRIT!
                                        playSound('rockCrit');
                                        triggerShake(12, 16);
                                        triggerVibration('sa_hit');
                                        freezeFrames = 8;
                                        voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 20, isWhite: true, isOrange: false, r: 90 });
                                    }
                                }

                                if (tryDamageBoss(dmgToDeal, p)) {
                                    let recoilForce = 6; if (p.recoilResist) recoilForce /= 2;
                                    p.vx = p.facingRight ? -recoilForce : recoilForce;
                                    
                                    // FIRE_HALBERD combo and vampiric heal
                                    if (p.type === 'FIRE_HALBERD') {
                                        if (p.heatBladeTimer > 0) {
                                            // Ignite Fire Wave: +2 combo count towards boss burn and fire wave shockwave
                                            p.halberdCombos = (p.halberdCombos || 0) + 2;
                                            p.halberdComboTimer = 180;
                                            voidExplosions.push({
                                                x: p.facingRight ? p.x + p.width + 60 : p.x - 60,
                                                y: p.y + 15,
                                                timer: 20,
                                                isWhite: false,
                                                isOrange: true,
                                                r: 75
                                            });
                                            playSound('heatIgnite');
                                            if (p.halberdCombos >= 3) {
                                                p.halberdCombos = 0;
                                                boss.bossBurnTimer = 180;
                                                boss.bossBurnTicks = 3;
                                                playSound('heatIgnite');
                                                triggerShake(8, 14);
                                                voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 20, isWhite: false, isOrange: true, r: 85 });
                                            }
                                        } else if (isFarHalberdHit) {
                                            p.halberdCombos = (p.halberdCombos || 0) + 1;
                                            p.halberdComboTimer = 180; // 3 sec window
                                            if (p.halberdCombos >= 3) {
                                                p.halberdCombos = 0;
                                                boss.bossBurnTimer = 180;
                                                boss.bossBurnTicks = 3;
                                                playSound('heatIgnite');
                                                triggerShake(8, 14);
                                                voidExplosions.push({ x: boss.x + boss.width/2, y: boss.y + boss.height/2, timer: 20, isWhite: false, isOrange: true, r: 85 });
                                            }
                                        }
                                        if (p.halberdVampiricReady) {
                                            p.halberdVampiricReady = false;
                                            p.hp = Math.min(p.maxHp, p.hp + 1.0);
                                            playSound('heal');
                                            voidExplosions.push({ x: p.x + p.width/2, y: p.y + p.height/2, timer: 15, isWhite: true, isOrange: true, r: 40 });
                                        }
                                    }

                                    // 4G Stamina vs Combo logic
                                    if (p.type === 'STAMINA') { 
                                        if (p.weaponMode === 'PINK') {
                                            if (p.stamina >= 1) p.stamina -= 1; 
                                            else { let wasH = p.isHealing; takeDamage(p, 0.5, true, true); if (wasH) triggerVibration('heal_interrupt'); else triggerVibration('damage'); }
                                        } else {
                                            // Blue combo tracking (3 hits in succession)
                                            p.comboHits = (p.comboHits || 0) + 1;
                                            p.comboTimer = 50;
                                            if (p.comboHits >= 3) {
                                                p.comboHits = 0;
                                                playSound('bladeSpin');
                                                triggerShake(10, 16);
                                                triggerVibration('sa_hit');
                                                freezeFrames = 6;
                                                let flurryBox = { x: p.x - 120, y: p.y - 100, width: 270, height: 250 };
                                                if (rectIntersect(flurryBox, boss)) { tryDamageBoss(3.5, p); }
                                                for (let i = airBlades.length - 1; i >= 0; i--) {
                                                    if (rectIntersect(flurryBox, { x: airBlades[i].x - 10, y: airBlades[i].y - 10, width: 20, height: 20 })) airBlades.splice(i, 1);
                                                }
                                                for (let i = blackDaggers.length - 1; i >= 0; i--) {
                                                    if (rectIntersect(flurryBox, { x: blackDaggers[i].x - 10, y: blackDaggers[i].y - 10, width: 20, height: 20 })) blackDaggers.splice(i, 1);
                                                }
                                                voidExplosions.push({ x: p.x + 15, y: p.y + 25, timer: 20, isWhite: true, isOrange: false, r: 120 });
                                            }
                                        }
                                    }

                                    // Water Demon delayed bleed & purple HP vampirism
                                    if (p.type === 'WATER' && p.stance === 'DEMON') {
                                        p.purpleHp = Math.min(6, p.purpleHp + 0.25);
                                        p.delayedBleedArr.push({ timer: 30, dmg: 0.75 });
                                    }

                                    // Fire Heat Blade burn stack
                                    if (p.type === 'FIRE' && p.heatBladeTimer > 0) {
                                        p.heatHitCount = (p.heatHitCount || 0) + 1;
                                        if (p.heatHitCount >= 3) {
                                            p.heatHitCount = 0;
                                            boss.bossBurnTimer = 180;
                                            boss.bossBurnTicks = 3;
                                            playSound('heatIgnite');
                                        }
                                    }

                                    if (p.attackType === "DOWN" || p.attackType === "DIVE") { p.vy = -14; p.jumps = 1; p.airDashed = false; triggerVibration('clash'); triggerShake(2, 5, 0, 1); }
                                }
                            }
                        }

                        for (let ph of phantoms) {
                            if (p.attackType === "DOWN" && rectIntersect(swordHitbox, ph)) { p.vy = -14; p.jumps = 1; p.airDashed = false; triggerVibration('clash'); triggerShake(2, 5, 0, 1); freezeFrames = 5; }
                        }
                    }
                }
                if (!kSpec) p.prevAttackKey = kAttack;
                if (p.type === 'FIRE') p.prevDashKey = kDash;
                if (!p.isRopeSliding) p.vy += currentGravity; 
                // Feather Badge: Glide slowly in air when Jump is held
                if (p.badges && p.badges.includes('feather') && kJump && p.vy > 1.2 && !onFloor && !onPlatform && !onWall) {
                    p.vy = 1.2;
                    if (Math.random() < 0.2) applyPhysicsPushToLeaves(p.x + 15, p.y + p.height, 2);
                }
                let maxWallSlide = globalWindMode === "DOWN" ? 8 : 2; 
                if (onWall && p.vy > maxWallSlide) p.vy = maxWallSlide; 
            }
        }

        if (p.bleedTimer > 0) { p.bleedTimer--; if (p.bleedTimer <= 0) { let wasH = p.isHealing; takeDamage(p, 0.5, true); if(wasH) triggerVibration('heal_interrupt'); else triggerVibration('damage'); } }
        p.x += p.vx; p.y += p.vy;
        let ceilingLimit = (boss.state.startsWith("L_CLIMB") || boss.phase >= 2.5 || secretMode) ? -2000 : 0;
        if (p.y < ceilingLimit) { p.y = ceilingLimit; if (p.vy < 0) p.vy = 0; } 
        if (p.x < 0) p.x = 0; if (p.x > ARENA_W - p.width) p.x = ARENA_W - p.width;
        if (Math.abs(p.vx) > 0 && p.y + p.height >= FLOOR && !boss.state.startsWith("CINEMATIC")) applyPhysicsPushToLeaves(p.x + 15, p.y + 25, 1);
        if (p.invuln > 0) p.invuln--;
    }

    for (let p of players) { 
        if (p.type === 'STAMINA' || Object.values(p.abilities).includes('charge')) { 
            for (let i = p.chargeProjectiles.length - 1; i >= 0; i--) { 
                let cp = p.chargeProjectiles[i]; cp.x += cp.vx; 
                if (cp.x < 0 || cp.x > ARENA_W) { p.chargeProjectiles.splice(i, 1); continue; } 
                if (rectIntersect({x: cp.x-10, y: cp.y-10, width: 20, height: 20}, boss)) { 
                    if (tryDamageBoss(cp.dmg, p)) { p.chargeProjectiles.splice(i, 1); } 
                } 
            } 
        } 
    }
}

// --- EXCLUSIVE BANANA SKIN RENDERING ---
function drawBananaBody(p, bodyColor, cloakColor) {
    let cx = p.x + p.width / 2;
    let cy = p.y + p.height / 2;
    let runSpeed = Math.abs(p.vx);
    let tilt = (p.facingRight ? 1 : -1) * (runSpeed * 0.04) + (p.vy * 0.015);
    if (p.isDashing) tilt = (p.facingRight ? 1 : -1) * 0.35;

    let w = p.width * 0.95;
    let h = p.height * 0.95;
    let hw = w / 2;
    let hh = h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(p.facingRight ? 1 : -1, 1);
    ctx.rotate(tilt);

    // 1. Banana Body Silhouette
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(hw * 0.3, -hh * 0.85);
    // Outer back curve
    ctx.bezierCurveTo(-hw * 0.3, -hh * 0.8, -hw * 1.15, -hh * 0.3, -hw * 1.15, 0);
    ctx.bezierCurveTo(-hw * 1.15, hh * 0.3, -hw * 0.3, hh * 0.8, hw * 0.35, hh * 0.88);
    // Bottom tip curve
    ctx.lineTo(hw * 0.38, hh * 0.92);
    ctx.lineTo(hw * 0.32, hh * 0.95);
    // Inner belly curve
    ctx.bezierCurveTo(-hw * 0.05, hh * 0.6, -hw * 0.2, hh * 0.2, -hw * 0.2, 0);
    ctx.bezierCurveTo(-hw * 0.2, -hh * 0.2, -hw * 0.05, -hh * 0.6, hw * 0.3, -hh * 0.85);
    ctx.closePath();
    ctx.fill();

    // Outline
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 2. Peel Facet Ribs (рёбра банана для 3D объёма)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hw * 0.15, -hh * 0.75);
    ctx.bezierCurveTo(-hw * 0.5, -hh * 0.4, -hw * 0.65, 0, -hw * 0.65, 0);
    ctx.bezierCurveTo(-hw * 0.65, hh * 0.2, -hw * 0.45, hh * 0.5, hw * 0.15, hh * 0.8);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(hw * 0.05, -hh * 0.7);
    ctx.bezierCurveTo(-hw * 0.7, -hh * 0.4, -hw * 0.95, 0, -hw * 0.95, 0);
    ctx.bezierCurveTo(-hw * 0.95, hh * 0.2, -hw * 0.65, hh * 0.5, hw * 0.05, hh * 0.75);
    ctx.stroke();

    // 3. Banana Stem (стебель на макушке)
    ctx.fillStyle = "#3e2714";
    ctx.beginPath();
    ctx.moveTo(hw * 0.22, -hh * 0.85);
    ctx.lineTo(hw * 0.12, -hh * 1.05);
    ctx.lineTo(hw * 0.28, -hh * 1.08);
    ctx.lineTo(hw * 0.36, -hh * 0.84);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6d542d";
    ctx.beginPath();
    ctx.ellipse(hw * 0.2, -hh * 1.06, 2.5, 1.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 4. Banana Bottom Tip (тёмный кончик банана)
    ctx.fillStyle = "#2d1b0d";
    ctx.beginPath();
    ctx.arc(hw * 0.35, hh * 0.92, 3, 0, Math.PI * 2);
    ctx.fill();

    // 5. Heroic Ninja Headband
    ctx.fillStyle = cloakColor;
    ctx.beginPath();
    ctx.ellipse(-hw * 0.22, -hh * 0.32, hw * 0.55, 4.5, -0.15, 0, Math.PI * 2);
    ctx.fill();

    let wave = Math.sin(Date.now() / 90) * 3;
    ctx.strokeStyle = cloakColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.75, -hh * 0.32);
    ctx.quadraticCurveTo(-hw * 1.1, -hh * 0.28 + wave, -hw * 1.35, -hh * 0.22 + wave * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-hw * 0.75, -hh * 0.30);
    ctx.quadraticCurveTo(-hw * 1.05, -hh * 0.22 - wave, -hw * 1.25, -hh * 0.12 - wave * 1.2);
    ctx.stroke();

    // 6. Expressive Eyes
    if (p.invuln > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.15, -hh * 0.34);
        ctx.lineTo(-hw * 0.05, -hh * 0.31);
        ctx.lineTo(-hw * 0.15, -hh * 0.28);
        ctx.stroke();
    } else {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(-hw * 0.12, -hh * 0.31, 4.5, 5, 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(-hw * 0.07, -hh * 0.31, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-hw * 0.09, -hh * 0.34, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawPlayer(p) {
    if (p.isDowned) {
        ctx.save(); 
        ctx.translate(p.x + 15, p.y + 50); 
        ctx.rotate(Math.PI / 2); 
        ctx.fillStyle = "rgba(179, 89, 89, 0.6)"; 
        ctx.fillRect(-15, -50, 30, 50); 
        ctx.restore();
        ctx.fillStyle = "red"; 
        ctx.font = "16px Arial"; 
        ctx.textAlign = "center"; 
        ctx.fillText(Math.ceil(p.downedTimer / 60) + " сек", p.x + 15, p.y - 10); 
        ctx.textAlign = "left";
        return; 
    }
    if (p.hp <= 0) return;

    if (p.lightCharge > 0) { 
        let req = (boss.state === "VOID_SINK_STUN") ? 15 : 60;
        let prog = Math.min(1, p.lightCharge / req);
        ctx.save();
        ctx.beginPath(); 
        ctx.arc(p.x + 15, p.y + 25, 25 + prog * 15, 0, Math.PI * 2); 
        ctx.fillStyle = `rgba(0, 229, 255, ${0.15 + prog * 0.35})`; 
        ctx.fill(); 
        ctx.strokeStyle = (prog >= 1) ? "#ffffff" : "#00ffff";
        ctx.lineWidth = 2 + prog * 2.5;
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 10 + prog * 15;
        ctx.stroke();
        ctx.restore();
    }

    if (p.isDashing) { 
        ctx.shadowColor = (p.type === 'WATER' && p.stance === 'DEMON') ? "#9900ff" : p.color; 
        ctx.shadowBlur = 20; 
    }

    // Demon rage purple aura
    if (p.demonRageTimer > 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(180, 0, 255, 0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x + 15, p.y + 25, 32 + Math.sin(Date.now() / 60) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Lucky Charm / Earth Dodge golden flash
    if (p.dodgeFlashTimer > 0) {
        p.dodgeFlashTimer--;
        ctx.save();
        ctx.fillStyle = `rgba(255, 230, 100, ${p.dodgeFlashTimer / 16})`;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(p.x + 15, p.y + 25, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Cracked Life Shield aura at 1 HP
    if (p.hasCrackedLife && !p.crackedShieldBroken && p.hp <= 1) {
        ctx.save();
        let pulse = 0.5 + 0.3 * Math.sin(Date.now() / 100);
        ctx.strokeStyle = `rgba(0, 229, 255, ${pulse})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(p.x + 15, p.y + 25, 26 + Math.sin(Date.now() / 80) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Cracked Life Shield break shatter flash
    if (p.crackedBreakFlash > 0) {
        p.crackedBreakFlash--;
        ctx.save();
        ctx.strokeStyle = `rgba(0, 255, 255, ${p.crackedBreakFlash / 25})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(p.x + 15, p.y + 25, 45 * (1 - p.crackedBreakFlash / 25), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    let baseColor = p.color;
    if (p.type === 'WATER' && p.stance === 'DEMON') baseColor = "#3a0055";

    let cloakColor = "#2952cc";
    let patternColor = "#00ffff";
    if (p.type === 'WATER') {
        if (p.stance === 'DEMON') {
            cloakColor = "#25003b";
            patternColor = "#d000ff";
        } else {
            cloakColor = "#2255cc";
            patternColor = "#00ffff";
        }
    } else if (p.type === 'EARTH') {
        cloakColor = "#1f7a1f";
        patternColor = "#44cc44";
    } else if (p.type === 'AIR') {
        cloakColor = "#d4af37";
        patternColor = "#00e5ff";
    } else if (p.type === 'STAMINA') {
        cloakColor = "#661426";
        patternColor = "#00f0ff";
    } else if (p.type === 'FIRE') {
        cloakColor = "#bb1b00";
        patternColor = "#ff7700";
    } else if (p.type === 'FIRE_HALBERD') {
        cloakColor = "#9e1500";
        patternColor = "#ffcc00";
    } else if (p.type === 'WATER_ROPE') {
        cloakColor = "#0077aa";
        patternColor = "#00ffff";
    }

    let bodyColor = p.invuln > 0 && Math.floor(Date.now() / 50) % 2 === 0 ? "lightblue" : baseColor;
    ctx.fillStyle = bodyColor;
    
    // --- MAIN BODY SHAPE (OR BANANA SKIN) ---
    if (p.bananaSkin) {
        drawBananaBody(p, bodyColor, cloakColor);
    } else {
        ctx.beginPath();
        if (p.facingRight) {
            ctx.moveTo(p.x, p.y + p.height);
            ctx.lineTo(p.x, p.y);
            ctx.lineTo(p.x + p.width - 15, p.y + 10);
            ctx.quadraticCurveTo(p.x + p.width, p.y + p.height / 2, p.x + p.width - 5, p.y + p.height);
        } else {
            ctx.moveTo(p.x + p.width, p.y + p.height);
            ctx.lineTo(p.x + p.width, p.y);
            ctx.lineTo(p.x + 15, p.y + 10);
            ctx.quadraticCurveTo(p.x, p.y + p.height / 2, p.x + 5, p.y + p.height);
        }
        ctx.closePath();
        ctx.fill();
    }

    // --- CLOAKS & PATTERNS ---
    ctx.save();

    // --- DYNAMIC BILLOWING CLOAK WITH CLOTH PHYSICS ---
    let trailDir = p.facingRight ? -1 : 1; // Плащ развевается позади персонажа
    let runSpeed = Math.abs(p.vx);
    let velLagX = -p.vx * 3.5; // Отклоняется назад от скорости бега
    let velLagY = -p.vy * 1.8; // Взлетает при падении, опускается при прыжке
    let time = Date.now();
    let pIdx = (typeof players !== 'undefined' && players[1] === p) ? 2 : 1;
    let waveTime = time / 110 + pIdx * 3;

    // Многочастотные волновые колебания для живого извивания ткани
    let flutter1 = Math.sin(waveTime) * (5 + runSpeed * 1.5);
    let flutter2 = Math.cos(waveTime * 1.4) * (6 + runSpeed * 1.8);
    let flap = Math.sin(waveTime * 1.8) * (4 + runSpeed);

    let anchorX = p.facingRight ? p.x + 8 : p.x + p.width - 8;
    let shoulderX = anchorX;
    let shoulderY = p.y + 10;

    // Ключевые точки извивающегося края плаща
    let tipX = anchorX + (trailDir * (24 + runSpeed * 4)) + (velLagX * 0.5) + flutter1;
    let tipY = p.y + p.height + flutter2 * 0.8 + (velLagY * 0.4);
    let midX = anchorX + (trailDir * (28 + runSpeed * 4.5)) + (velLagX * 0.6) + flutter2;
    let midY = p.y + 24 + flutter1 * 0.7;
    let hemMidX = anchorX + (trailDir * (13 + runSpeed * 2)) + flap;
    let hemMidY = p.y + p.height - 2 - flap * 0.5;

    // 1. Тень складок плаща для 3D глубины
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY + 2);
    ctx.quadraticCurveTo(midX * 0.9, midY, tipX - trailDir * 4, tipY);
    ctx.quadraticCurveTo(hemMidX, hemMidY + 2, anchorX, p.y + p.height);
    ctx.closePath();
    ctx.fill();

    // 2. Основная развевающаяся ткань плаща
    ctx.fillStyle = cloakColor;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    // Верхняя волна плаща
    ctx.quadraticCurveTo(shoulderX + (trailDir * (13 + runSpeed * 2)), shoulderY + 4 + flap, midX, midY);
    // Внешний колышущийся край к кончику
    ctx.quadraticCurveTo(midX + trailDir * 4, midY + (p.height * 0.4), tipX, tipY);
    // Нижняя волнистая кромка плаща
    ctx.quadraticCurveTo(hemMidX, hemMidY, anchorX, p.y + p.height - 4);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.closePath();
    ctx.fill();

    // 3. Извивающиеся узоры на плаще
    ctx.strokeStyle = patternColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shoulderX + (trailDir * 4), shoulderY + 6);
    ctx.quadraticCurveTo(midX - (trailDir * 4), midY + 4, tipX - (trailDir * 3), tipY - 4);
    ctx.stroke();

    // Вторая линия узора
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(shoulderX + (trailDir * 7), shoulderY + 12);
    ctx.quadraticCurveTo(midX - (trailDir * 8), midY + 12, hemMidX, hemMidY - 3);
    ctx.stroke();
    ctx.restore();

    // --- EARTH HERO: BLACK-PURPLE HAIR ---
    if (p.type === 'EARTH') {
        ctx.save();
        ctx.fillStyle = "#1e0b29";
        ctx.beginPath();
        let hx = p.facingRight ? p.x + 8 : p.x + p.width - 8;
        let hDir = p.facingRight ? -1 : 1;
        ctx.arc(hx, p.y + 10, 9, 0, Math.PI * 2);
        ctx.fill();
        // Flowing locks with violet sheen
        ctx.strokeStyle = "#6b289c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx, p.y + 8);
        ctx.quadraticCurveTo(hx + (hDir * 12), p.y + 22, hx + (hDir * 16), p.y + 36);
        ctx.stroke();
        ctx.strokeStyle = "#1a0824";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx + 2, p.y + 6);
        ctx.quadraticCurveTo(hx + (hDir * 8), p.y + 20, hx + (hDir * 12), p.y + 34);
        ctx.stroke();
        ctx.restore();
    }

    // --- FIRE HERO: WOODEN STICK ON BACK ---
    if (p.type === 'FIRE') {
        ctx.save(); 
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2); 
        ctx.rotate((p.facingRight ? -25 : 25) * Math.PI / 180);
        ctx.fillStyle = "#8b4513"; // Childhood wooden stick
        ctx.fillRect(-p.width / 2 - 2, -4, p.width + 4, 6); 
        ctx.strokeStyle = "#5c2d0c";
        ctx.lineWidth = 1;
        ctx.strokeRect(-p.width / 2 - 2, -4, p.width + 4, 6);
        ctx.restore();

        if (p.isParrying) { 
            // 0.66s Ready stance: steel rapier presented forward!
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#ff7700";
            ctx.lineWidth = 2;
            let px = p.facingRight ? p.x + p.width + 5 : p.x - 12; 
            ctx.fillRect(px, p.y + 10, 6, p.height - 15);
            ctx.strokeRect(px, p.y + 10, 6, p.height - 15);
            ctx.restore();
        }

        if (p.fireLungeTimer > 0) {
            // Forward physical lunge rapier thrust!
            ctx.save();
            let flip = p.facingRight ? 1 : -1;
            let lx = p.facingRight ? p.x + p.width - 2 : p.x + 2;
            let ly = p.y + 24;
            ctx.strokeStyle = (p.heatBladeTimer > 0) ? "#ff3300" : "#ffaa00";
            ctx.lineWidth = 4;
            ctx.shadowColor = (p.heatBladeTimer > 0) ? "#ff2200" : "#ff8800";
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + flip * 55, ly);
            ctx.stroke();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + flip * 55, ly);
            ctx.stroke();
            ctx.restore();
        }
    }

    // --- FIRE_HALBERD: LONG HALBERD ON BACK & WHIRLWIND ---
    if (p.type === 'FIRE_HALBERD') {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate((p.facingRight ? -35 : 35) * Math.PI / 180);
        ctx.fillStyle = "#5c2d0c";
        ctx.fillRect(-2, -35, 4, 65);
        ctx.fillStyle = "#e0e0e0";
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-7, -42);
        ctx.lineTo(0, -48);
        ctx.lineTo(7, -42);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ff5500";
        ctx.beginPath();
        ctx.arc(4, -40, 8, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.restore();

        if (p.halberdBuffTimer > 0) {
            ctx.save();
            let glowR = 26 + Math.sin(Date.now() / 80) * 3;
            ctx.strokeStyle = "rgba(255, 60, 0, 0.75)";
            ctx.lineWidth = 2.5;
            ctx.shadowColor = "#ff3300";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(p.x + p.width/2, p.y + p.height/2, glowR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (p.whirlwindTimer > 0) {
            ctx.save();
            let prog = 1 - (p.whirlwindTimer / 16);
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.rotate(prog * Math.PI * 4);
            ctx.beginPath();
            ctx.arc(0, 0, 130, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 68, 0, 0.85)";
            ctx.lineWidth = 10;
            ctx.shadowColor = "#ff7700";
            ctx.shadowBlur = 18;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, 130, 0, Math.PI * 2);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }

    // --- WATER_ROPE: ROPE COIL ON BACK & AIR CONCENTRATION GAUGE ---
    if (p.type === 'WATER_ROPE') {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2 + 2);
        ctx.rotate((p.facingRight ? -20 : 20) * Math.PI / 180);
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (p.concentrateTimer > 0) {
            let prog = Math.min(1, p.concentrateTimer / 60);
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(p.x + p.width/2 - 16, p.y - 14, 32, 6);
            ctx.fillStyle = p.concentrateReady ? "#ffffff" : "#00e5ff";
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = p.concentrateReady ? 12 : 6;
            ctx.fillRect(p.x + p.width/2 - 15, p.y - 13, 30 * prog, 4);
            if (p.concentrateReady) {
                ctx.strokeStyle = "rgba(0, 240, 255, 0.9)";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(p.x + p.width/2, p.y + p.height/2, 22 + Math.sin(Date.now() / 60) * 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // --- 4TH HERO: PINK VIRAL BLADE SHEATH ---
    if (p.type === 'STAMINA' && p.weaponMode === 'PINK') {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2 + 5);
        ctx.rotate((p.facingRight ? -30 : 30) * Math.PI / 180);
        ctx.fillStyle = "#4a0b2b";
        ctx.fillRect(-8, -3, 24, 6);
        ctx.strokeStyle = "#ff0088";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-8, -3, 24, 6);
        ctx.restore();
    }

    // --- AIR HERO: WIND PARTICLES (Weapon materializes only on swing) ---
    if (p.type === 'AIR' && p.attackTimer === 0) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 229, 255, 0.4)";
        let t = Date.now() / 200;
        let wx = p.facingRight ? p.x + p.width + 2 : p.x - 2;
        ctx.beginPath();
        ctx.arc(wx + Math.sin(t) * 4, p.y + 25 + Math.cos(t) * 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    ctx.shadowBlur = 0; 

    // Aegis Shield Badge Visual Bubble
    if (p.hasAegisShield && !p.isDowned) {
        ctx.save();
        let t = Date.now() / 250;
        let pulseR = 30 + Math.sin(t) * 2;
        ctx.strokeStyle = "rgba(0, 225, 255, 0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x + p.width/2, p.y + p.height/2, pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(0, 225, 255, 0.12)";
        ctx.fill();
        ctx.restore();
    }

    // Water Rope Surfing Wave Effect
    if (p.isRopeSliding && !p.isDowned) {
        ctx.save();
        let t = Date.now() / 120;
        let surfR = 18 + Math.sin(t) * 3;
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.ellipse(p.x + p.width/2, p.y + p.height - 2, surfR, surfR * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(0, 229, 255, 0.4)";
        ctx.fill();
        ctx.restore();
    }

    // Fish Scale Badge Crown
    if (p.hasFishScale && !p.isDowned) {
        ctx.save();
        ctx.fillStyle = "#ffd700";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("👑", p.x + p.width / 2, p.y - 6);
        ctx.restore();
    }

    // Healing Auras
    if (p.isAoEHealing || p.isFieryHealing) { 
        ctx.beginPath(); 
        ctx.arc(p.x + 15, p.y + 25, 50, 0, Math.PI * 2); 
        ctx.fillStyle = p.isFieryHealing ? "rgba(255, 100, 0, 0.3)" : "rgba(0, 150, 255, 0.3)"; 
        ctx.fill(); 
    }
    if (p.tied && boss.state !== "SCARF_PULL" && !boss.state.startsWith("CINEMATIC")) { 
        ctx.strokeStyle = "cyan"; 
        ctx.lineWidth = 2; 
        ctx.beginPath(); 
        ctx.moveTo(p.x, p.y + 10); 
        ctx.lineTo(p.x + 30, p.y + 20); 
        ctx.moveTo(p.x, p.y + 30); 
        ctx.lineTo(p.x + 30, p.y + 40); 
        ctx.stroke(); 
        ctx.fillStyle = "cyan"; 
        ctx.font = "12px Arial"; 
        ctx.fillText((secretMode ? 7 : 5) - p.tieClicks, p.x - 10, p.y - 10); 
    }

    if (p.isHealing && !p.isAoEHealing && !p.isFieryHealing) { 
        ctx.fillStyle = (p.type === 'WATER' && p.stance === 'DEMON') ? "rgba(180, 0, 255, 0.4)" : "rgba(0, 255, 100, 0.3)"; 
        ctx.beginPath(); 
        let target = (p.type === 'WATER' && p.stance === 'DEMON') ? 60 : (p.isMultiHeal ? (p.healFramesTotal / 2) : p.healFramesTotal);
        let progress = (p.healTimer % target) / target;
        ctx.arc(p.x + 15, p.y + 25, 40, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress)); 
        ctx.lineTo(p.x + 15, p.y + 25); 
        ctx.fill(); 
    } else if (p.isHealing && p.isFieryHealing) {
        ctx.fillStyle = "rgba(255, 100, 0, 0.3)"; 
        ctx.beginPath(); 
        let progress = p.healTimer / p.healFramesTotal;
        ctx.arc(p.x + 15, p.y + 25, 40, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress)); 
        ctx.lineTo(p.x + 15, p.y + 25); 
        ctx.fill();
    }

    // --- TRANSLUCENT SWORD SLASH ARCS & WEAPONS ---
    if (p.attackTimer > 0 && p.lightCharge === 0) {
        let atkProgress = 1 - (p.attackTimer / 12); 
        let currentRange = p.atkRange;
        let slashColor = p.color;
        
        if (p.attackType === "LIGHT") {
            slashColor = "#00ffff";
            currentRange = Math.max(p.atkRange, 125);
        }
        else if (p.attackType === "TIDAL_SURGE") {
            slashColor = "#00ffff";
            currentRange = 160;
        }
        else if (p.attackType === "CRUSHING_STRIKE") {
            slashColor = "#00e5ff";
            currentRange = 110;
        }
        else if (p.type === 'WATER') slashColor = (p.stance === 'DEMON') ? "#d000ff" : "#00d4ff";
        else if (p.type === 'EARTH') slashColor = "#33ff55";
        else if (p.type === 'AIR') slashColor = "#00ffff";
        else if (p.type === 'STAMINA') slashColor = (p.weaponMode === 'BLUE') ? "#44d4ff" : "#ff0077";
        else if (p.type === 'FIRE') slashColor = (p.heatBladeTimer > 0) ? "#ff3300" : "#ffaa00";
        else if (p.type === 'FIRE_HALBERD') slashColor = (p.halberdBuffTimer > 0) ? "#ff2200" : (p.heatBladeTimer > 0 ? "#ff4400" : "#ff5500");
        else if (p.type === 'WATER_ROPE') slashColor = "#00f0ff";

        ctx.save();
        let flip = p.facingRight ? 1 : -1;
        let originX = p.x + 15;
        let originY = p.y + 25;

        if (p.attackType === "UP") {
            // Sweeping overhead vertical arc
            ctx.beginPath();
            let startAng = -Math.PI * 0.85;
            let endAng = -Math.PI * 0.15;
            ctx.arc(originX, originY, currentRange, startAng, endAng);
            ctx.strokeStyle = slashColor;
            ctx.lineWidth = 14;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            // Core white line
            ctx.beginPath();
            ctx.arc(originX, originY, currentRange, startAng, endAng);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.9;
            ctx.stroke();
        } else if (p.attackType === "DOWN" || p.attackType === "DIVE") {
            // Sweeping downwards arc
            ctx.beginPath();
            let startAng = Math.PI * 0.15;
            let endAng = Math.PI * 0.85;
            ctx.arc(originX, originY, currentRange, startAng, endAng);
            ctx.strokeStyle = slashColor;
            ctx.lineWidth = 14;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(originX, originY, currentRange, startAng, endAng);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.9;
            ctx.stroke();
        } else {
            // Forward horizontal sweeping crescent arc
            ctx.translate(originX, originY);
            ctx.scale(flip, 1);
            let sweepAngle = -Math.PI * 0.35 + (atkProgress * Math.PI * 0.7);
            
            ctx.beginPath();
            ctx.arc(0, 0, currentRange, -Math.PI * 0.35, sweepAngle);
            ctx.strokeStyle = slashColor;
            ctx.lineWidth = 16;
            ctx.globalAlpha = 0.55;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, currentRange, -Math.PI * 0.35, sweepAngle);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.globalAlpha = 0.9;
            ctx.stroke();

            // Additional blade trail / dagger flourish
            if (p.type === 'EARTH' || (p.type === 'STAMINA' && p.weaponMode === 'BLUE')) {
                // Secondary dagger trail
                ctx.beginPath();
                ctx.arc(0, 5, currentRange * 0.7, -Math.PI * 0.25, sweepAngle);
                ctx.strokeStyle = slashColor;
                ctx.lineWidth = 8;
                ctx.globalAlpha = 0.4;
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}
