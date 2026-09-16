// --- CONTROLS & INPUT MODULE ---

function isKeyPressed(codes) { 
    for (let c of codes) { 
        if (keys[c]) return true; 
    } 
    return false; 
}

function tryEscapeTie() { 
    let escaped = false; 
    for (let p of players) { 
        if (p.tied && boss.state !== "SCARF_PULL" && !boss.state.startsWith("CINEMATIC")) { 
            p.tieClicks++; 
            triggerVibration('untie');
            if (p.tieClicks >= (secretMode ? 7 : 5)) { 
                p.tied = false; 
                p.tieClicks = 0; 
            } 
            escaped = true; 
        } 
    } 
    return escaped; 
}

// Keyboard events
window.addEventListener("keydown", e => { 
    if (e.code === "Space" && e.target === document.body) e.preventDefault();
    keys[e.code] = true; 
    initAudio(); 
    tryEscapeTie(); 
    
    // Secret mode (L)
    if (e.code === 'KeyL' && gameState === "MENU" && (
        document.getElementById("input-select").style.display === "block" || 
        document.getElementById("hero-select").style.display === "block" || 
        document.getElementById("main-menu").style.display === "block"
    )) {
        secretMode = true; 
        playSound('heal'); 
        document.body.style.backgroundColor = window.fireHeroUnlocked ? "#2a0a0a" : "#000";
        if (document.getElementById("mobile-ui").style.display === "flex") {
            document.getElementById("m-light").style.display = "flex";
        }
    }
    
    // Unlock Fire Hero (Key 4)
    if (e.key === '4' && gameState === "MENU" && (
        document.getElementById("input-select").style.display === "block" || 
        document.getElementById("main-menu").style.display === "block"
    )) {
        if (!window.fireHeroUnlocked) {
            window.fireHeroUnlocked = true; 
            playSound('slash');
            document.body.style.backgroundColor = "#2a0a0a";
            let p1Ui = document.getElementById("p1-select-ui");
            if (p1Ui) {
                p1Ui.innerHTML += `<div class="menu-btn" onclick="selectHero1('FIRE')" style="color: #ff5500; border-color: #ff5500;">5. Огонь</div>`;
            }
            let p2Text = document.getElementById("p2-options-text");
            if (p2Text) {
                p2Text.innerHTML = "<b>1</b>-Вода | <b>2</b>-Воздух | <b>3</b>-Земля | <b>4</b>-4-й Герой | <b style='color:#ff5500;'>5</b>-Огонь";
            }
        }
    }

    // Player 2 keyboard hero selection in menu
    if (gameState === "MENU" && document.getElementById("hero-select").style.display === "block" && numPlayers === 2) {
        let p2Status = document.getElementById('p2-status');
        if (e.key === "1") { p2HeroSelection = 'WATER'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Вода"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "2") { p2HeroSelection = 'AIR'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Воздух"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "3") { p2HeroSelection = 'EARTH'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Земля"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "4") { p2HeroSelection = 'STAMINA'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: 4-й Герой"; p2Status.style.color = "lime"; } checkDuoStart(); }
        if (e.key === "5" && window.fireHeroUnlocked) { p2HeroSelection = 'FIRE'; if (p2Status) { p2Status.innerText = "Игрок 2 Готов: Огонь"; p2Status.style.color = "#ff5500"; } checkDuoStart(); }
    }

    // Restart key
    if (gameState === "GAMEOVER" && (e.code === "KeyR" || e.key === "r" || e.key === "к" || e.key === "К")) {
        gameState = "MENU";
        document.getElementById("overlay").style.display = "block";
        document.getElementById("main-menu").style.display = "block";
        document.getElementById("input-select").style.display = "none";
        document.getElementById("hero-select").style.display = "none";
        document.getElementById("badge-select").style.display = "none";
    }
});

window.addEventListener("keyup", e => keys[e.code] = false);
window.addEventListener("mousedown", e => { 
    if (e.button === 0) keys['MouseLeft'] = true; 
    if (e.button === 2) keys['MouseRight'] = true; 
    initAudio(); 
    tryEscapeTie(); 
});
window.addEventListener("mouseup", e => { 
    if (e.button === 0) keys['MouseLeft'] = false; 
    if (e.button === 2) keys['MouseRight'] = false; 
});
window.addEventListener("contextmenu", e => e.preventDefault());

// Touch Joystick Setup
const joyBase = document.getElementById('joy-base');
const joyStick = document.getElementById('joy-stick');
let joyActive = false; 
let joyCenter = { x: 0, y: 0 };

if (joyBase && joyStick) {
    joyBase.addEventListener('touchstart', e => { 
        e.preventDefault(); 
        joyActive = true; 
        let r = joyBase.getBoundingClientRect(); 
        joyCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; 
        updateJoy(e.touches[0]); 
    });
    joyBase.addEventListener('touchmove', e => { 
        e.preventDefault(); 
        if (joyActive) updateJoy(e.touches[0]); 
    });
    joyBase.addEventListener('touchend', e => { 
        e.preventDefault(); 
        joyActive = false; 
        joyStick.style.transform = `translate(0px, 0px)`; 
        touchInputs.left = false; 
        touchInputs.right = false; 
        touchInputs.up = false; 
        touchInputs.down = false; 
    });
}

function updateJoy(touch) {
    if (!joyStick) return;
    let dx = touch.clientX - joyCenter.x; 
    let dy = touch.clientY - joyCenter.y;
    let dist = Math.hypot(dx, dy); 
    let maxDist = 35;
    if (dist > maxDist) { 
        dx = (dx / dist) * maxDist; 
        dy = (dy / dist) * maxDist; 
    }
    joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
    touchInputs.left = dx < -15; 
    touchInputs.right = dx > 15;
    touchInputs.up = dy < -15; 
    touchInputs.down = dy > 15;
}

const tBtns = ['m-jmp', 'm-atk', 'm-dash', 'm-spec', 'm-heal', 'm-light', 'm-stance'];
const tMap = { 'm-jmp': 'jump', 'm-atk': 'atk', 'm-dash': 'dash', 'm-spec': 'spec', 'm-heal': 'heal', 'm-light': 'light', 'm-stance': 'stance' };
tBtns.forEach(id => {
    let el = document.getElementById(id);
    if (el) {
        el.addEventListener('touchstart', e => { 
            e.preventDefault(); 
            touchInputs[tMap[id]] = true; 
            el.style.transform = 'scale(0.9)'; 
            el.style.background = 'rgba(0,255,255,0.6)'; 
            tryEscapeTie(); 
        });
        el.addEventListener('touchend', e => { 
            e.preventDefault(); 
            touchInputs[tMap[id]] = false; 
            el.style.transform = 'scale(1)'; 
            el.style.background = 'rgba(0,255,255,0.15)'; 
        });
    }
});

// Gamepad API Polling
function getGamepadInput(targetIndex) {
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = gamepads[targetIndex] || Array.from(gamepads).find(g => g !== null);
    if (!gp) return null;
    return {
        left: gp.axes[0] < -0.3 || gp.buttons[14]?.pressed, 
        right: gp.axes[0] > 0.3 || gp.buttons[15]?.pressed,
        up: gp.axes[1] < -0.3 || gp.buttons[12]?.pressed, 
        down: gp.axes[1] > 0.3 || gp.buttons[13]?.pressed,
        jump: gp.buttons[0]?.pressed,
        heal: gp.buttons[1]?.pressed,
        attack: gp.buttons[2]?.pressed || gp.buttons[3]?.pressed, 
        special: gp.buttons[5]?.pressed || gp.buttons[4]?.pressed, 
        dash: gp.buttons[7]?.pressed || gp.buttons[7]?.value > 0.1,
        light: gp.buttons[11]?.pressed || gp.buttons[10]?.pressed,
        stance: gp.buttons[8]?.pressed || gp.buttons[9]?.pressed
    };
}

// Menu and UI callbacks
function toggleSecretMobile() {
    secretMode = true; 
    playSound('heal'); 
    document.body.style.backgroundColor = window.fireHeroUnlocked ? "#2a0a0a" : "#000";
    let mb = document.getElementById("mobile-l-btn");
    if (mb) mb.style.display = "none";
    let ml = document.getElementById("m-light");
    if (ml) ml.style.display = "flex";
}
window.toggleSecretMobile = toggleSecretMobile;

function selectMode(mode) {
    numPlayers = mode; 
    document.getElementById("main-menu").style.display = "none"; 
    document.getElementById("input-select").style.display = "block";
    document.getElementById("input-1p").style.display = (mode === 1) ? "block" : "none"; 
    document.getElementById("input-2p").style.display = (mode === 2) ? "block" : "none";
}
window.selectMode = selectMode;

function selectInput(in1, in2) {
    p1InputType = in1; 
    if (numPlayers === 2) p2InputType = in2;
    document.getElementById("input-select").style.display = "none"; 
    document.getElementById("hero-select").style.display = "block";
    
    let p1Status = document.getElementById('p1-status');
    let p2Status = document.getElementById('p2-status');
    if (p1Status) p1Status.innerText = ""; 
    if (p2Status) p2Status.innerText = "Ожидание Игрока 2...";
    
    let p2Ui = document.getElementById("p2-select-ui");
    if (p2Ui) p2Ui.style.display = (numPlayers === 2) ? "block" : "none";

    if (in1 === 'TOUCH' || in2 === 'TOUCH') {
        let mobUi = document.getElementById("mobile-ui");
        if (mobUi) mobUi.style.display = "flex";
        if (!secretMode) {
            let lBtn = document.getElementById("mobile-l-btn");
            if (lBtn) lBtn.style.display = "block";
        }
    }
}
window.selectInput = selectInput;

function selectHero1(type) { 
    p1HeroSelection = type; 
    if (numPlayers === 1) { 
        Object.assign(configAbilities.p1, defaultAbilities[type]); 
        prepBadgeMenu(); 
    } else { 
        let p1Status = document.getElementById('p1-status');
        if (p1Status) p1Status.innerText = "Игрок 1 Готов!"; 
        checkDuoStart(); 
    } 
}
window.selectHero1 = selectHero1;

function checkDuoStart() { 
    if (p1HeroSelection && p2HeroSelection) { 
        Object.assign(configAbilities.p1, defaultAbilities[p1HeroSelection]); 
        Object.assign(configAbilities.p2, defaultAbilities[p2HeroSelection]); 
        prepBadgeMenu(); 
    } 
}
window.checkDuoStart = checkDuoStart;

function getSlotsForHero(type) { 
    return (type === 'WATER' || type === 'AIR' || type === 'FIRE') ? 2 : 3; 
}
window.getSlotsForHero = getSlotsForHero;

function prepBadgeMenu() {
    document.getElementById("hero-select").style.display = "none";
    document.getElementById("badge-select").style.display = "block";

    let titleTeam = document.getElementById("team-slot-title");
    let slotTeam = document.getElementById("slot-team");
    if (slotTeam) slotTeam.style.display = "inline-block"; 
    if (titleTeam) titleTeam.style.display = "block";

    let p1html = '';
    for (let i = 0; i < getSlotsForHero(p1HeroSelection); i++) {
        p1html += `<div class="badge-slot" id="slot-p1_${i}" onclick="openBadgeList('p1_${i}')">[Пусто]</div>`;
    }
    let p1sc = document.getElementById("p1-slots-container");
    if (p1sc) p1sc.innerHTML = p1html;

    let a1html = '';
    let info1 = getAbilitiesInfo(p1HeroSelection);
    for (let slot of info1.slots) {
        let abName = abilityDict[configAbilities.p1[slot]] || '[Пусто]';
        a1html += `<div class="badge-slot" id="slot-p1_ab_${slot}" onclick="openAbList('p1', '${slot}', '${p1HeroSelection}')" style="border-color: yellow; color: white;">${abilitySlotNames[slot]}: ${abName}</div>`;
    }
    let p1ac = document.getElementById("p1-abilities-container");
    if (p1ac) p1ac.innerHTML = a1html;

    if (numPlayers === 2) {
        let p2area = document.getElementById("p2-badge-area");
        if (p2area) p2area.style.display = "block";
        
        let p2html = '';
        for (let i = 0; i < getSlotsForHero(p2HeroSelection); i++) {
            p2html += `<div class="badge-slot" id="slot-p2_${i}" onclick="openBadgeList('p2_${i}')">[Пусто]</div>`;
        }
        let p2sc = document.getElementById("p2-slots-container");
        if (p2sc) p2sc.innerHTML = p2html;

        let a2html = '';
        let info2 = getAbilitiesInfo(p2HeroSelection);
        for (let slot of info2.slots) {
            let abName = abilityDict[configAbilities.p2[slot]] || '[Пусто]';
            a2html += `<div class="badge-slot" id="slot-p2_ab_${slot}" onclick="openAbList('p2', '${slot}', '${p2HeroSelection}')" style="border-color: yellow; color: white;">${abilitySlotNames[slot]}: ${abName}</div>`;
        }
        let p2ac = document.getElementById("p2-abilities-container");
        if (p2ac) p2ac.innerHTML = a2html;
    }
}
window.prepBadgeMenu = prepBadgeMenu;

function openBadgeList(slotId) {
    currentEditingSlot = slotId; 
    currentEditingAbility = null;
    let listDiv = document.getElementById("badge-list");
    if (!listDiv) return;
    listDiv.style.display = "flex"; 
    listDiv.innerHTML = '';
    let isTopSlot = (slotId === 'team');
    
    for (let key in badgesDict) {
        let b = badgesDict[key];
        if (isTopSlot && b.teamAllowed !== true) continue; 
        if (!isTopSlot && b.teamAllowed === true) continue; 
        let colorStyle = (b.teamAllowed === true) ? 'color: cyan; border-color: cyan;' : 'color: white; border-color: #aaa;';
        listDiv.innerHTML += `<div class="badge-item" style="${colorStyle}" onclick="assignBadge('${key}')">${b.name}</div>`;
    }
}
window.openBadgeList = openBadgeList;

function openAbList(playerId, slotId, heroType) {
    currentEditingSlot = null; 
    currentEditingAbility = { p: playerId, s: slotId };
    let listDiv = document.getElementById("badge-list");
    if (!listDiv) return;
    listDiv.style.display = "flex"; 
    listDiv.innerHTML = '';
    
    let info = getAbilitiesInfo(heroType);
    for (let abKey of info.pool) {
        listDiv.innerHTML += `<div class="badge-item" style="color: #ffff88; border-color: #ffff88;" onclick="assignAbility('${abKey}')">${abilityDict[abKey]}</div>`;
    }
}
window.openAbList = openAbList;

function assignBadge(badgeKey) {
    let name = (badgesDict[badgeKey].id === 'none') ? '[Пусто]' : badgesDict[badgeKey].name.split(' (')[0];
    if (currentEditingSlot === 'team') { 
        configBadges.team = badgeKey; 
        let el = document.getElementById('slot-team');
        if (el) el.innerText = name; 
    } else {
        let parts = currentEditingSlot.split('_'); 
        configBadges[parts[0]][parseInt(parts[1])] = badgeKey;
        let el = document.getElementById('slot-' + currentEditingSlot);
        if (el) el.innerText = name;
    }
    let bl = document.getElementById("badge-list");
    if (bl) bl.style.display = "none";
}
window.assignBadge = assignBadge;

function assignAbility(abKey) {
    configAbilities[currentEditingAbility.p][currentEditingAbility.s] = abKey;
    let el = document.getElementById(`slot-${currentEditingAbility.p}_ab_${currentEditingAbility.s}`);
    if (el) el.innerText = `${abilitySlotNames[currentEditingAbility.s]}: ${abilityDict[abKey]}`;
    let bl = document.getElementById("badge-list");
    if (bl) bl.style.display = "none";
}
window.assignAbility = assignAbility;
