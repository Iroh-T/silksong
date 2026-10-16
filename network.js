// ========================================================
// --- ONLINE MULTIPLAYER ENGINE v72.1 ---
// --- «Убежище» — Сетевая игра для Создателя и друзей ---
// --- 100% PURE FIREBASE REALTIME STREAMING (SSE / REST) ---
// ========================================================

// 1. Доступ к закрытому тесту (РЫБа / Тимур, Ярослав, Даша, Gandalf)
function isOnlineTester(user) {
    if (!user) return false;
    let u = user.trim().toLowerCase();
    return u === 'рыба' || u === 'admin' || 
           u === 'сarrots_44444' || u === 'carrots_44444' || u === 'ярослав' || 
           u === 'dasha545' || u === 'даша' || 
           u === 'gandalf';
}
window.isOnlineTester = isOnlineTester;

// 2. Сетевое состояние
window.onlineNet = {
    isActive: false,           // true когда находимся в сетевой игре
    isHost: false,             // true для Создателя (P1), false для Гостя (P2)
    roomId: null,              // Код комнаты
    mySlot: 'p1',              // 'p1' или 'p2'
    peerSlot: 'p2',            // слот напарника
    
    // Локальные настройки игрока
    myControl: 'KEYBOARD_1',
    myHero: 'WATER',
    myBadges: ['none', 'none', 'none'],
    myAbilities: {},
    myReady: false,

    // Данные сокомандника
    peerName: 'Сокомандник',
    peerHero: 'AIR',
    peerControl: 'KEYBOARD_1',
    peerBadges: ['none', 'none', 'none'],
    peerAbilities: {},
    peerReady: false,

    // Общие параметры
    teamBadge: 'none',
    challenges: { hp3: false, limitedHeal: false, bossSpeed: false },

    // Firebase EventSource потоки (SSE - нулевая задержка чтения)
    lobbyEventSource: null,
    liveEventSource: null,
    inputsEventSource: null,

    // Контроль сетевой очереди (исключает перегрузку браузера и слайд-шоу)
    isSendingHostState: false,
    lastHostStateSent: 0,
    isSendingGuestInputs: false,
    lastGuestInputSent: 0,
    lastSentInputJson: '',
    lastStatePacketTime: 0,

    // Цели интерполяции для сглаживания (60 FPS, 0 слайд-шоу)
    targetBoss: null,
    targetP1: null,
    remoteInputs: {
        left: false, right: false, up: false, down: false,
        jump: false, attack: false, heal: false, dash: false,
        special: false, stance: false, light: false
    },

    // Таймеры
    matchmakingPollTimer: null,
    countdownTimer: null,
    fallbackPollTimer: null
};

// Проверка видимости кнопки сетевой игры в главном меню
function checkOnlineCoopButtonVisibility() {
    let btn = document.getElementById('online-coop-btn');
    if (!btn) return;
    let curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    if (isOnlineTester(curUser)) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
}
window.checkOnlineCoopButtonVisibility = checkOnlineCoopButtonVisibility;

// Открытие хаба сетевой игры
function openOnlineHub() {
    let curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    if (!isOnlineTester(curUser)) {
        if (typeof showTutorialAlert === 'function') {
            showTutorialAlert("🔒 Сетевая игра доступна только в закрытом тесте Создателя (РЫБа, Ярослав, Даша, Gandalf)!");
        }
        return;
    }
    openScreen('online-hub-screen', true);
}
window.openOnlineHub = openOnlineHub;

// Красивые коды комнат
function generateCleanRoomId(prefix) {
    let p = (prefix || 'RYBA').trim().toLowerCase();
    let tag = 'RYBA';
    if (p.includes('рыба') || p.includes('ryba')) tag = 'RYBA';
    else if (p.includes('ярос') || p.includes('carrot') || p.includes('сarrot')) tag = 'YARIK';
    else if (p.includes('даша') || p.includes('dasha')) tag = 'DASHA';
    else if (p.includes('gandalf')) tag = 'GANDAL';
    else {
        tag = p.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'ROOM';
    }
    let rand = Math.floor(1000 + Math.random() * 9000);
    return `${tag}-${rand}`;
}

// ========================================================
// --- ХОСТ: СОЗДАНИЕ КОМАНДЫ ---
// ========================================================
async function startOnlineHost() {
    let curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : 'РЫБа';
    let roomId = generateCleanRoomId(curUser);

    window.onlineNet.isActive = false;
    window.onlineNet.isHost = true;
    window.onlineNet.roomId = roomId;
    window.onlineNet.mySlot = 'p1';
    window.onlineNet.peerSlot = 'p2';
    window.onlineNet.myControl = 'KEYBOARD_1';
    window.onlineNet.myHero = (typeof p1HeroSelection !== 'undefined' && p1HeroSelection) ? p1HeroSelection : 'WATER';
    window.onlineNet.myReady = false;
    window.onlineNet.peerReady = false;
    window.onlineNet.peerName = 'Сокомандник';
    window.onlineNet.teamBadge = 'none';

    let hostNameEl = document.getElementById('online-host-my-name');
    if (hostNameEl) hostNameEl.innerText = curUser;
    let codeEl = document.getElementById('online-host-room-code');
    if (codeEl) codeEl.innerText = roomId;

    openScreen('online-host-wait-screen', true);

    // 1. Создаём комнату в Firebase
    let initialRoom = {
        roomId: roomId,
        host: curUser,
        guest: null,
        status: 'WAITING',
        createdAt: Date.now(),
        p1: {
            name: curUser,
            hero: window.onlineNet.myHero,
            control: window.onlineNet.myControl,
            badges: ['none', 'none', 'none'],
            abilities: {},
            ready: false
        },
        p2: null,
        teamBadge: 'none',
        challenges: { hp3: false, limitedHeal: false, bossSpeed: false }
    };

    try {
        await fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(roomId)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialRoom)
        });
        await fetch(`${FIREBASE_URL}/onlineRooms/${encodeURIComponent(roomId)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: roomId, host: curUser, status: 'WAITING', createdAt: Date.now() })
        });
    } catch(e) {
        console.warn("Firebase host room creation err:", e);
    }

    // 2. Опрашиваем Firebase: ждём появления гостя
    startHostMatchmakingPoll(roomId);
}
window.startOnlineHost = startOnlineHost;

function startHostMatchmakingPoll(roomId) {
    if (window.onlineNet.matchmakingPollTimer) clearInterval(window.onlineNet.matchmakingPollTimer);

    window.onlineNet.matchmakingPollTimer = setInterval(async () => {
        if (!window.onlineNet.isHost || window.onlineNet.roomId !== roomId) {
            clearInterval(window.onlineNet.matchmakingPollTimer);
            return;
        }

        try {
            let res = await fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(roomId)}.json`);
            let data = await res.json();
            if (data && data.guest && data.p2) {
                // Гость найден!
                clearInterval(window.onlineNet.matchmakingPollTimer);
                window.onlineNet.matchmakingPollTimer = null;

                window.onlineNet.peerName = data.guest;
                window.onlineNet.peerHero = data.p2.hero || 'AIR';
                window.onlineNet.peerControl = data.p2.control || 'KEYBOARD_1';

                onMatchFound(roomId);
            }
        } catch(e){}
    }, 450);
}

function cancelOnlineHost() {
    if (window.onlineNet.matchmakingPollTimer) {
        clearInterval(window.onlineNet.matchmakingPollTimer);
        window.onlineNet.matchmakingPollTimer = null;
    }
    cleanupGame();
    openScreen('online-hub-screen', false);
}
window.cancelOnlineHost = cancelOnlineHost;

function copyOnlineRoomCode() {
    let codeEl = document.getElementById('online-host-room-code');
    if (!codeEl || !codeEl.innerText) return;
    let code = codeEl.innerText.trim();
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
            if (typeof showTutorialAlert === 'function') {
                showTutorialAlert(`📋 Код комнаты скопирован:\n${code}`);
            }
        });
    } else {
        alert("Код комнаты: " + code);
    }
}
window.copyOnlineRoomCode = copyOnlineRoomCode;

// ========================================================
// --- ГОСТЬ: ПОИСК И ПРИСОЕДИНЕНИЕ ---
// ========================================================
function openOnlineJoinScreen() {
    openScreen('online-join-screen', true);
    refreshOnlineRoomsList();
}
window.openOnlineJoinScreen = openOnlineJoinScreen;

async function refreshOnlineRoomsList() {
    let container = document.getElementById('online-rooms-list');
    if (!container) return;
    container.innerHTML = `<div style="color: #94a3b8; font-size: 13px; padding: 16px;">🔄 Поиск открытых комнат...</div>`;

    if (typeof FIREBASE_URL === 'undefined') {
        container.innerHTML = `<div style="color: #f87171; font-size: 13px;">Ошибка соединения с базой</div>`;
        return;
    }

    try {
        let res = await fetch(`${FIREBASE_URL}/onlineRooms.json`);
        let data = await res.json();
        
        let now = Date.now();
        let validRooms = [];
        if (data) {
            for (let rId in data) {
                let r = data[rId];
                if (r && r.status === 'WAITING' && (now - (r.createdAt || 0) < 600000)) {
                    validRooms.push(r);
                }
            }
        }

        if (validRooms.length === 0) {
            container.innerHTML = `
                <div style="background: rgba(15, 23, 42, 0.6); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; padding: 18px 12px; color: #94a3b8; font-size: 13px;">
                    🍃 Сейчас никто не ждёт команду.<br>
                    <span style="color: #64748b; font-size: 11px;">Попроси Хоста создать комнату или введи код вручную ниже!</span>
                </div>
            `;
            return;
        }

        let html = '';
        for (let r of validRooms) {
            let isCreatorHost = (r.host.toLowerCase() === 'рыба');
            let crownIcon = isCreatorHost ? '👑' : '⚔️';
            let hostTitle = isCreatorHost ? 'Создатель (РЫБа)' : r.host;
            let timeStr = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            html += `
                <div style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 27, 75, 0.8)); border: 1.5px solid #38bdf8; border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; box-shadow: 0 0 12px rgba(56,189,248,0.25);">
                    <div style="text-align: left;">
                        <div style="font-size: 14px; font-weight: bold; color: #fff; display: flex; align-items: center; gap: 6px;">
                            <span>${crownIcon}</span>
                            <span style="color: ${isCreatorHost ? '#ffd700' : '#38bdf8'};">${hostTitle}</span>
                        </div>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">
                            Код: <b style="color: #00ffff; font-family: monospace;">${r.roomId}</b> | ⏰ ${timeStr}
                        </div>
                    </div>
                    <button class="menu-btn" style="margin: 0; padding: 8px 14px; font-size: 13px; font-weight: bold; border-color: #22c55e; color: #4ade80; background: rgba(34,197,94,0.15);" onclick="connectToOnlineRoom('${r.roomId}', '${r.host}')">
                        ВОЙТИ ➔
                    </button>
                </div>
            `;
        }
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = `<div style="color: #f87171; font-size: 13px;">Ошибка загрузки комнат</div>`;
    }
}
window.refreshOnlineRoomsList = refreshOnlineRoomsList;

function joinOnlineByManualCode() {
    let inp = document.getElementById('online-manual-code-input');
    if (!inp || !inp.value.trim()) {
        if (typeof showTutorialAlert === 'function') showTutorialAlert("Введите код комнаты!");
        return;
    }
    let code = inp.value.trim().toUpperCase();
    connectToOnlineRoom(code, 'Хост');
}
window.joinOnlineByManualCode = joinOnlineByManualCode;

async function connectToOnlineRoom(roomId, hostName) {
    let curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : 'Игрок 2';

    window.onlineNet.isActive = false;
    window.onlineNet.isHost = false;
    window.onlineNet.roomId = roomId;
    window.onlineNet.mySlot = 'p2';
    window.onlineNet.peerSlot = 'p1';
    window.onlineNet.peerName = hostName || 'Хост';
    window.onlineNet.myControl = 'KEYBOARD_1';
    window.onlineNet.myHero = (typeof p2HeroSelection !== 'undefined' && p2HeroSelection) ? p2HeroSelection : 'AIR';
    window.onlineNet.myReady = false;
    window.onlineNet.peerReady = false;

    // Записываем себя в Firebase
    let guestData = {
        name: curUser,
        hero: window.onlineNet.myHero,
        control: window.onlineNet.myControl,
        badges: ['none', 'none', 'none'],
        abilities: {},
        ready: false
    };

    try {
        await fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(roomId)}/guest.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(curUser)
        });
        await fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(roomId)}/p2.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guestData)
        });
        await fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(roomId)}/status.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify('IN_SETUP')
        });
        await fetch(`${FIREBASE_URL}/onlineRooms/${encodeURIComponent(roomId)}/status.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify('IN_SETUP')
        });
    } catch(e) {
        console.warn("Connect online room err:", e);
    }

    onMatchFound(roomId);
}
window.connectToOnlineRoom = connectToOnlineRoom;

// ========================================================
// --- ИГРА НАЙДЕНА: ПОСЛЕДОВАТЕЛЬНОСТЬ (РАСКЛАДКА -> ГЕРОЙ -> ЗНАКИ) ---
// ========================================================
function onMatchFound(roomId) {
    window.onlineNet.isActive = true;
    window.onlineNet.roomId = roomId;

    if (typeof playSound === 'function') playSound('parry');

    // Плашка "ИГРА НАЙДЕНА!"
    let banner = document.getElementById('online-input-banner');
    if (banner) {
        banner.style.display = 'block';
        let hostNick = window.onlineNet.isHost ? 'Ты (Хост)' : window.onlineNet.peerName;
        let guestNick = window.onlineNet.isHost ? window.onlineNet.peerName : 'Ты (Гость)';
        banner.innerHTML = `🎉 ИГРА НАЙДЕНА! Команда: <b>${hostNick}</b> и <b>${guestNick}</b><br><span style="color:#a5f3fc; font-size:11px;">Выбери своё управление:</span>`;
    }

    // ШАГ 1: ВЫБОР УПРАВЛЕНИЯ
    openScreen('input-select', false);
    let in1 = document.getElementById('input-1p');
    if (in1) in1.style.display = 'block';
    let in2 = document.getElementById('input-2p');
    if (in2) in2.style.display = 'none';

    // Запускаем непрерывную синхронизацию лобби через Firebase EventSource
    startLobbyStream(roomId);
}

// 1. Выбор раскладки (Шаг 1)
function handleSelectInput(inType) {
    window.onlineNet.myControl = inType;
    let rId = window.onlineNet.roomId;
    let slot = window.onlineNet.mySlot;

    if (rId && typeof FIREBASE_URL !== 'undefined') {
        fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/${slot}/control.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inType)
        }).catch(()=>{});
    }

    // ШАГ 2: ВЫБОР ГЕРОЕВ
    openScreen('hero-select', false);
    let p2Ui = document.getElementById("p2-select-ui");
    if (p2Ui) p2Ui.style.display = "none";

    let heroBanner = document.getElementById('online-hero-banner');
    if (heroBanner) heroBanner.style.display = 'block';
    updateOnlineHeroBanner();
}
window.onlineNet.handleSelectInput = handleSelectInput;

// 2. Выбор героя (Шаг 2)
function handleSelectHero(heroType) {
    window.onlineNet.myHero = heroType;
    let rId = window.onlineNet.roomId;
    let slot = window.onlineNet.mySlot;

    if (!configAbilities || typeof configAbilities !== 'object') configAbilities = { p1: {}, p2: {} };
    if (!configAbilities[slot]) configAbilities[slot] = {};
    if (typeof defaultAbilities !== 'undefined' && defaultAbilities[heroType]) {
        Object.assign(configAbilities[slot], defaultAbilities[heroType]);
    }

    if (rId && typeof FIREBASE_URL !== 'undefined') {
        fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/${slot}/hero.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(heroType)
        }).catch(()=>{});
        fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/${slot}/abilities.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configAbilities[slot])
        }).catch(()=>{});
    }

    // ШАГ 3: ВЫБОР СНАРЯЖЕНИЯ
    setupOnlineBadgeMenu();
}
window.onlineNet.handleSelectHero = handleSelectHero;

function updateOnlineHeroBanner() {
    let p1Text = document.getElementById('online-hero-p1-text');
    let p2Text = document.getElementById('online-hero-p2-text');
    let curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : 'Ты';

    let isH = window.onlineNet.isHost;
    let myH = getHeroDisplayName(window.onlineNet.myHero);
    let peerH = getHeroDisplayName(window.onlineNet.peerHero);

    if (p1Text) {
        p1Text.innerText = isH ? `Игрок 1 (${curUser}): ${myH}` : `Игрок 1 (${window.onlineNet.peerName}): ${peerH}`;
    }
    if (p2Text) {
        p2Text.innerText = !isH ? `Игрок 2 (${curUser}): ${myH}` : `Игрок 2 (${window.onlineNet.peerName}): ${peerH}`;
    }
}

// 3. Настройка экрана снаряжения (Шаг 3)
function setupOnlineBadgeMenu() {
    numPlayers = 2; // Командный режим

    let isH = window.onlineNet.isHost;
    let h1 = isH ? window.onlineNet.myHero : window.onlineNet.peerHero;
    let h2 = !isH ? window.onlineNet.myHero : window.onlineNet.peerHero;
    p1HeroSelection = h1;
    p2HeroSelection = h2;

    let curUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : 'Ты';

    let heroSelectEl = document.getElementById("hero-select");
    if (heroSelectEl) heroSelectEl.style.display = "none";
    let badgeSelectEl = document.getElementById("badge-select");
    if (badgeSelectEl) badgeSelectEl.style.display = "block";

    // Скрываем стандартную кнопку "В БОЙ!" и показываем сетевой блок готовности
    let offBtn = document.getElementById("badge-select-offline-btn");
    if (offBtn) offBtn.style.display = "none";
    let onlineBox = document.getElementById("online-badge-bottom-box");
    if (onlineBox) onlineBox.style.display = "block";

    // Командный знак ("а голубой слот может менять кто угодно")
    let titleTeam = document.getElementById("team-slot-title");
    let slotTeam = document.getElementById("slot-team");
    if (slotTeam) {
        slotTeam.style.display = "inline-block";
        slotTeam.setAttribute("onclick", "openBadgeList('team')");
        let bDef = (badgesDict && badgesDict[configBadges.team]) ? badgesDict[configBadges.team].name.split(' (')[0] : '[Пусто]';
        slotTeam.innerText = bDef;
    }
    if (titleTeam) {
        titleTeam.style.display = "block";
        titleTeam.innerHTML = `Командный знак (Голубые) <span style="font-size: 11px; color: #a5f3fc;">[Может менять любой игрок]</span>:`;
    }

    // Заголовки игроков с указанием героя
    let p1Title = document.querySelector("#p1-badge-area > div:first-child");
    if (p1Title) {
        let name1 = isH ? `Ты (${curUser})` : window.onlineNet.peerName;
        let ro = !isH ? ' <span style="color: #f59e0b; font-size: 11px;">(Сокомандник — только просмотр)</span>' : '';
        p1Title.innerHTML = `Знаки (Игрок 1: ${name1} — <b>${getHeroDisplayName(h1)}</b>):${ro}`;
    }

    let p2area = document.getElementById("p2-badge-area");
    if (p2area) p2area.style.display = "block";
    let p2Title = document.querySelector("#p2-badge-area > div:first-child");
    if (p2Title) {
        let name2 = !isH ? `Ты (${curUser})` : window.onlineNet.peerName;
        let ro = isH ? ' <span style="color: #f59e0b; font-size: 11px;">(Сокомандник — только просмотр)</span>' : '';
        p2Title.innerHTML = `Знаки (Игрок 2: ${name2} — <b>${getHeroDisplayName(h2)}</b>):${ro}`;
    }

    // Рендерим слоты P1 и P2
    renderPlayerBadgeSlots('p1', h1, isH);
    renderPlayerBadgeSlots('p2', h2, !isH);

    updateReadyButtonUI();
}
window.onlineNet.setupOnlineBadgeMenu = setupOnlineBadgeMenu;

function renderPlayerBadgeSlots(slotKey, heroType, isInteractive) {
    if (!configBadges[slotKey]) configBadges[slotKey] = ['none', 'none', 'none'];
    let sc = document.getElementById(`${slotKey}-slots-container`);
    let ac = document.getElementById(`${slotKey}-abilities-container`);

    // Значки
    let bHtml = '';
    let sCount = (typeof getSlotsForHero === 'function') ? getSlotsForHero(heroType) : 3;
    for (let i = 0; i < sCount; i++) {
        let savedKey = configBadges[slotKey][i] || 'none';
        let bName = (savedKey === 'none' || !badgesDict[savedKey]) ? '[Пусто]' : badgesDict[savedKey].name.split(' (')[0];
        let isSpecialBlue = (heroType === 'WATER_ROPE' && i === 0);
        let clickAttr = isInteractive ? `onclick="openBadgeList('${slotKey}_${i}')"` : `style="pointer-events: none; opacity: 0.75;"`;
        let slotStyle = isSpecialBlue ? 'border-color: #00e5ff; color: #00e5ff;' : '';
        bHtml += `<div class="badge-slot" id="slot-${slotKey}_${i}" ${clickAttr} style="${slotStyle}">${bName}</div>`;
    }
    if (sc) sc.innerHTML = bHtml;

    // Способности
    let aHtml = '';
    let info = (typeof getAbilitiesInfo === 'function') ? getAbilitiesInfo(heroType, slotKey === 'p1' ? 1 : 2) : { slots: ['mid'] };
    for (let s of info.slots) {
        let abKey = (configAbilities[slotKey] && configAbilities[slotKey][s]) ? configAbilities[slotKey][s] : 'none';
        let abName = abilityDict[abKey] || '[Пусто]';
        let slotLabel = (abilitySlotNames && abilitySlotNames[s]) ? abilitySlotNames[s] : s;
        let clickAttr = isInteractive ? `onclick="openAbList('${slotKey}', '${s}', '${heroType}')"` : `style="pointer-events: none; opacity: 0.75;"`;
        aHtml += `<div class="badge-slot" id="slot-${slotKey}_ab_${s}" ${clickAttr} style="border-color: yellow; color: white;">${slotLabel}: ${abName}</div>`;
    }
    if (ac) ac.innerHTML = aHtml;
}

// Синхронизация значков в Firebase
function syncBadgesToFirebase() {
    let rId = window.onlineNet.roomId;
    let slot = window.onlineNet.mySlot;
    if (!rId || typeof FIREBASE_URL === 'undefined') return;

    fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/${slot}/badges.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configBadges[slot])
    }).catch(()=>{});

    fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/${slot}/abilities.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configAbilities[slot])
    }).catch(()=>{});

    fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/teamBadge.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configBadges.team || 'none')
    }).catch(()=>{});
}
window.onlineNet.syncBadgesToFirebase = syncBadgesToFirebase;

// Переключение готовности
function toggleReady() {
    window.onlineNet.myReady = !window.onlineNet.myReady;
    let rId = window.onlineNet.roomId;
    let slot = window.onlineNet.mySlot;

    updateReadyButtonUI();

    if (rId && typeof FIREBASE_URL !== 'undefined') {
        fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/${slot}/ready.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.onlineNet.myReady)
        }).catch(()=>{});
    }

    checkBothReady();
}
window.onlineNet.toggleReady = toggleReady;

function updateReadyButtonUI() {
    let btn = document.getElementById('online-ready-toggle-btn');
    if (!btn) return;
    if (window.onlineNet.myReady) {
        btn.innerText = "✅ ТЫ ГОТОВ! (Нажми для отмены)";
        btn.style.borderColor = "#22c55e";
        btn.style.color = "#4ade80";
        btn.style.background = "rgba(34, 197, 94, 0.25)";
    } else {
        btn.innerText = "⚔️ Я ГОТОВ К БОЮ!";
        btn.style.borderColor = "#ffd700";
        btn.style.color = "#ffd700";
        btn.style.background = "rgba(255, 215, 0, 0.15)";
    }

    let peerTxt = document.getElementById('online-teammate-status-text');
    if (peerTxt) {
        if (window.onlineNet.peerReady) {
            peerTxt.innerHTML = `<span style="color: #4ade80; font-weight: bold;">✅ Сокомандник ГОТОВ!</span>`;
        } else {
            peerTxt.innerHTML = `<span style="color: #f59e0b;">⏳ Сокомандник выбирает значки...</span>`;
        }
    }
}

// Проверка готовности и 3-секундный обратный отсчет
function checkBothReady() {
    let both = window.onlineNet.myReady && window.onlineNet.peerReady;
    let banner = document.getElementById('online-countdown-banner');

    if (both) {
        if (window.onlineNet.countdownTimer) return;
        let sec = 3;
        if (banner) {
            banner.style.display = 'block';
            banner.innerHTML = `🔥 ОБА ГОТОВЫ! СТАРТ ЧЕРЕЗ <b>${sec}</b>...`;
        }

        window.onlineNet.countdownTimer = setInterval(() => {
            sec--;
            if (banner) banner.innerHTML = `🔥 ОБА ГОТОВЫ! СТАРТ ЧЕРЕЗ <b>${sec}</b>...`;
            if (sec <= 0) {
                clearInterval(window.onlineNet.countdownTimer);
                window.onlineNet.countdownTimer = null;
                startOnlineBattle();
            }
        }, 1000);
    } else {
        if (window.onlineNet.countdownTimer) {
            clearInterval(window.onlineNet.countdownTimer);
            window.onlineNet.countdownTimer = null;
        }
        if (banner) banner.style.display = 'none';
    }
}

// Мгновенная синхронизация лобби через Firebase SSE (EventSource)
function startLobbyStream(roomId) {
    closeLobbyStream();

    try {
        let es = new EventSource(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(roomId)}.json`);
        window.onlineNet.lobbyEventSource = es;

        let handleLobbyData = (data) => {
            if (!data) return;
            let peerSlot = window.onlineNet.peerSlot;
            let peerData = data[peerSlot];

            if (peerData) {
                if (peerData.hero && peerData.hero !== window.onlineNet.peerHero) {
                    window.onlineNet.peerHero = peerData.hero;
                    updateOnlineHeroBanner();
                }
                if (peerData.ready !== undefined) {
                    window.onlineNet.peerReady = !!peerData.ready;
                    updateReadyButtonUI();
                    checkBothReady();
                }
                if (peerData.badges) {
                    configBadges[peerSlot] = [...peerData.badges];
                }
                if (peerData.abilities) {
                    configAbilities[peerSlot] = { ...peerData.abilities };
                }
            }

            // Командный знак
            if (data.teamBadge && data.teamBadge !== configBadges.team) {
                configBadges.team = data.teamBadge;
                let slotTeam = document.getElementById("slot-team");
                if (slotTeam) {
                    let bDef = (badgesDict && badgesDict[data.teamBadge]) ? badgesDict[data.teamBadge].name.split(' (')[0] : '[Пусто]';
                    slotTeam.innerText = bDef;
                }
            }

            // Если открыт экран значков — обновляем слоты сокомандника
            let badgeEl = document.getElementById("badge-select");
            if (badgeEl && badgeEl.style.display === "block") {
                renderPlayerBadgeSlots(peerSlot, window.onlineNet.peerHero, false);
            }
        };

        es.addEventListener('put', (e) => {
            try {
                let parsed = JSON.parse(e.data);
                if (parsed && parsed.data !== undefined) {
                    if (parsed.path === "/") {
                        handleLobbyData(parsed.data);
                    } else if (parsed.path.startsWith("/" + window.onlineNet.peerSlot)) {
                        // Точечное обновление
                        refreshLobbySnapshot(roomId);
                    } else if (parsed.path === "/teamBadge") {
                        configBadges.team = parsed.data;
                        let slotTeam = document.getElementById("slot-team");
                        if (slotTeam) {
                            let bDef = (badgesDict && badgesDict[parsed.data]) ? badgesDict[parsed.data].name.split(' (')[0] : '[Пусто]';
                            slotTeam.innerText = bDef;
                        }
                    }
                }
            } catch(err){}
        });

        es.addEventListener('patch', () => {
            refreshLobbySnapshot(roomId);
        });

    } catch(e) {
        console.warn("EventSource lobby stream error:", e);
    }
}

async function refreshLobbySnapshot(roomId) {
    if (!roomId || typeof FIREBASE_URL === 'undefined') return;
    try {
        let res = await fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(roomId)}.json`);
        let data = await res.json();
        if (data && window.onlineNet.isActive) {
            let peerSlot = window.onlineNet.peerSlot;
            let peerData = data[peerSlot];
            if (peerData) {
                if (peerData.hero) window.onlineNet.peerHero = peerData.hero;
                if (peerData.ready !== undefined) window.onlineNet.peerReady = !!peerData.ready;
                if (peerData.badges) configBadges[peerSlot] = [...peerData.badges];
                if (peerData.abilities) configAbilities[peerSlot] = { ...peerData.abilities };
                updateOnlineHeroBanner();
                updateReadyButtonUI();
                checkBothReady();
            }
            if (data.teamBadge) {
                configBadges.team = data.teamBadge;
                let slotTeam = document.getElementById("slot-team");
                if (slotTeam) {
                    let bDef = (badgesDict && badgesDict[data.teamBadge]) ? badgesDict[data.teamBadge].name.split(' (')[0] : '[Пусто]';
                    slotTeam.innerText = bDef;
                }
            }
        }
    } catch(e){}
}

function closeLobbyStream() {
    if (window.onlineNet.lobbyEventSource) {
        try { window.onlineNet.lobbyEventSource.close(); } catch(e){}
        window.onlineNet.lobbyEventSource = null;
    }
}

// Навигация "Назад" в онлайн-режиме
function handleMenuBack() {
    let badgeEl = document.getElementById("badge-select");
    let heroEl = document.getElementById("hero-select");
    let inputEl = document.getElementById("input-select");

    if (badgeEl && badgeEl.style.display === "block") {
        openScreen('hero-select', false);
        let heroBanner = document.getElementById('online-hero-banner');
        if (heroBanner) heroBanner.style.display = 'block';
    } else if (heroEl && heroEl.style.display === "block") {
        openScreen('input-select', false);
    } else {
        leaveRoom();
    }
}
window.onlineNet.handleMenuBack = handleMenuBack;

function leaveRoom() {
    cleanupGame();
    openScreen('online-hub-screen', false);
}
window.onlineNet.leaveRoom = leaveRoom;

// ========================================================
// --- ШАГ 4: СТАРТ БИТВЫ (100% PURE FIREBASE SSE STREAMING) ---
// ========================================================
function startOnlineBattle() {
    closeLobbyStream();

    window.isOnlineMatch = true;
    window.numPlayers = 2;

    let isH = window.onlineNet.isHost;
    let myCtrl = window.onlineNet.myControl;

    if (isH) {
        p1InputType = myCtrl;
        p2InputType = 'ONLINE_REMOTE';
        p1HeroSelection = window.onlineNet.myHero;
        p2HeroSelection = window.onlineNet.peerHero;
    } else {
        p1InputType = 'ONLINE_REMOTE';
        p2InputType = myCtrl;
        p1HeroSelection = window.onlineNet.peerHero;
        p2HeroSelection = window.onlineNet.myHero;
    }

    if (typeof buildAndStartGame === 'function') {
        buildAndStartGame();
    }

    let roomId = window.onlineNet.roomId;
    if (isH) {
        // ХОСТ: Подключает непрерывный SSE поток к /inputs.json для мгновенного чтения кнопок гостя
        startHostInputsEventSource(roomId);
    } else {
        // ГОСТЬ: Подключает непрерывный SSE поток к /live.json для мгновенного чтения мира от хоста
        startGuestLiveEventSource(roomId);
    }
}
window.onlineNet.startBattle = startOnlineBattle;

// --- ХОСТ: ПОТОКОВОЕ ЧТЕНИЕ КНОПОК ГОСТЯ ЧЕРЕЗ FIREBASE SSE ---
function startHostInputsEventSource(roomId) {
    if (window.onlineNet.inputsEventSource) {
        try { window.onlineNet.inputsEventSource.close(); } catch(e){}
    }

    try {
        let es = new EventSource(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(roomId)}/inputs.json`);
        window.onlineNet.inputsEventSource = es;

        let handleInputs = (val) => {
            if (!val) return;
            window.onlineNet.remoteInputs = val;
        };

        es.addEventListener('put', (e) => {
            try {
                let parsed = JSON.parse(e.data);
                if (parsed && parsed.data !== undefined) {
                    handleInputs(parsed.data);
                }
            } catch(err){}
        });
        es.addEventListener('patch', (e) => {
            try {
                let parsed = JSON.parse(e.data);
                if (parsed && parsed.data !== undefined) {
                    handleInputs(parsed.data);
                }
            } catch(err){}
        });
    } catch(err){
        console.warn("Host inputs EventSource error:", err);
    }
}

// --- ХОСТ: ОТПРАВЛЯЕТ МИР БОЯ (КОНТРОЛИРУЕМЫЙ FAST-PUT, 0 ОЧЕРЕДИ) ---
function broadcastHostBattleFrame() {
    if (!boss || !players || players.length < 2) return;
    let p1 = players[0];
    let p2 = players[1];

    let now = Date.now();
    // Контролируемый интервал ~35 мс (28 обновлений в сек) + защита от наложения запросов в браузере
    if (window.onlineNet.isSendingHostState || (now - window.onlineNet.lastHostStateSent < 35)) {
        return;
    }

    let rId = window.onlineNet.roomId;
    if (!rId || typeof FIREBASE_URL === 'undefined') return;

    window.onlineNet.lastHostStateSent = now;
    window.onlineNet.isSendingHostState = true;

    let compactPacket = [
        // 0: Boss [x, y, vx, vy, hp, maxHp, state, stateTimer, color, facingDir, phase]
        [Math.round(boss.x), Math.round(boss.y), Math.round(boss.vx * 10) / 10, Math.round(boss.vy * 10) / 10,
         boss.hp, boss.maxHp, boss.state, boss.stateTimer, boss.color, boss.facingDir, boss.phase],

        // 1: P1 [x, y, vx, vy, hp, facingRight, attackType, attackTimer, isDashing, isDowned, isHealing]
        [Math.round(p1.x), Math.round(p1.y), Math.round(p1.vx * 10) / 10, Math.round(p1.vy * 10) / 10,
         p1.hp, p1.facingRight ? 1 : 0, p1.attackType || 'none', p1.attackTimer || 0,
         p1.isDashing ? 1 : 0, p1.isDowned ? 1 : 0, p1.isHealing ? 1 : 0],

        // 2: P2 authoritative [hp, isDowned, downedTimer]
        [p2.hp, p2.isDowned ? 1 : 0, p2.downedTimer || 0],

        // 3: Shared [heals, hitCount, camX, camY]
        [sharedHeals, sharedHitCount, Math.round(camX), Math.round(camY)],

        // 4: Projectiles
        serializeActiveProjectiles()
    ];

    fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/live.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compactPacket)
    }).finally(() => {
        window.onlineNet.isSendingHostState = false;
    }).catch(()=>{});
}
window.onlineNet.broadcastHostBattleFrame = broadcastHostBattleFrame;

// --- ГОСТЬ: ПОТОКОВОЕ ЧТЕНИЕ МИРА ХОСТА ЧЕРЕЗ FIREBASE SSE ---
function startGuestLiveEventSource(roomId) {
    if (window.onlineNet.liveEventSource) {
        try { window.onlineNet.liveEventSource.close(); } catch(e){}
    }

    try {
        let es = new EventSource(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(roomId)}/live.json`);
        window.onlineNet.liveEventSource = es;

        es.addEventListener('put', (e) => {
            try {
                let parsed = JSON.parse(e.data);
                if (parsed && parsed.data !== undefined) {
                    applyHostStatePacket(parsed.data);
                }
            } catch(err){}
        });

        es.addEventListener('patch', (e) => {
            try {
                let parsed = JSON.parse(e.data);
                if (parsed && parsed.data !== undefined) {
                    applyHostStatePacket(parsed.data);
                }
            } catch(err){}
        });
    } catch(err){
        console.warn("Guest live EventSource error:", err);
    }
}

// --- ГОСТЬ: ОТПРАВКА НАЖАТИЙ КНОПОК И СГЛАЖЕННОЕ ОБНОВЛЕНИЕ КАДРА ---
function sendGuestInputs() {
    let myCtrl = window.onlineNet.myControl;
    let inKeys = sampleCurrentLocalInputs(myCtrl);
    let str = JSON.stringify(inKeys);

    let now = Date.now();
    let hasChanged = (str !== window.onlineNet.lastSentInputJson);

    // Если кнопки не менялись — шлем не чаще чем раз в 120 мс для подтверждения связи.
    // Если изменились — отправляем сразу (с минимальным шагом 30 мс и защитой от перегрузки).
    if (!hasChanged && (now - window.onlineNet.lastGuestInputSent < 120)) return;
    if (window.onlineNet.isSendingGuestInputs || (now - window.onlineNet.lastGuestInputSent < 30)) return;

    let rId = window.onlineNet.roomId;
    if (!rId || typeof FIREBASE_URL === 'undefined') return;

    window.onlineNet.lastGuestInputSent = now;
    window.onlineNet.lastSentInputJson = str;
    window.onlineNet.isSendingGuestInputs = true;

    fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/inputs.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: str
    }).finally(() => {
        window.onlineNet.isSendingGuestInputs = false;
    }).catch(()=>{});
}

// Обработка кадра на стороне Гостя (Клиентское предсказание + Плавная интерполяция 60 FPS)
function updateGuestBattleFrame() {
    // 1. Отправляем кнопки Гостя Хосту
    sendGuestInputs();

    // 2. Страховочный опрос (если SSE поток прервался более чем на 600 мс)
    let now = Date.now();
    if (now - (window.onlineNet.lastStatePacketTime || 0) > 650) {
        pollFirebaseStateFallback();
    }

    // 3. Плавная интерполяция Босса к координатам Хоста (Без рывков и слайд-шоу!)
    if (window.onlineNet.targetBoss && boss) {
        let tb = window.onlineNet.targetBoss;
        boss.x += (tb.x - boss.x) * 0.40 + (tb.vx || 0);
        boss.y += (tb.y - boss.y) * 0.40 + (tb.vy || 0);
        boss.vx = tb.vx;
        boss.vy = tb.vy;
        boss.hp = tb.hp;
        boss.maxHp = tb.maxHp;
        boss.state = tb.state;
        boss.stateTimer = tb.stateTimer;
        boss.color = tb.color;
        boss.facingDir = tb.facingDir;
        boss.phase = tb.phase;
    }

    // 4. Локальная симуляция Игрока 2 (Гостя): 0 мс задержки управления!
    if (typeof updatePlayers === 'function') {
        updatePlayers(); // P1 интерполируется в player.js, P2 управляется мгновенно!
    }

    // 5. Проверка победы / поражения
    if (boss && boss.hp <= 0 && boss.state !== "DEFEATED" && !boss.state.startsWith("CINEMATIC")) {
        if (typeof checkPhaseTransition === 'function') checkPhaseTransition();
    }
    if (players && players.some(p => p.hp <= 0 && (!p.isDowned || p.downedTimer <= 0))) {
        gameState = "GAMEOVER";
        if (typeof recordBattleResult === 'function') recordBattleResult(false);
    }
}
window.onlineNet.updateGuestBattleFrame = updateGuestBattleFrame;

// Применение пакета состояния от Хоста
function applyHostStatePacket(data) {
    if (!data || !boss || !players || players.length < 2) return;

    window.onlineNet.lastStatePacketTime = Date.now();

    let b = data[0];
    let p1 = data[1];
    let p2 = data[2];
    let sh = data[3];
    let projs = data[4];

    // Цели интерполяции для Босса
    window.onlineNet.targetBoss = {
        x: b[0], y: b[1], vx: b[2], vy: b[3],
        hp: b[4], maxHp: b[5], state: b[6], stateTimer: b[7],
        color: b[8], facingDir: b[9], phase: b[10]
    };

    // Цели интерполяции для Игрока 1 (Хоста)
    window.onlineNet.targetP1 = {
        x: p1[0], y: p1[1], vx: p1[2], vy: p1[3],
        hp: p1[4], facingRight: (p1[5] === 1),
        attackType: p1[6], attackTimer: p1[7],
        isDashing: (p1[8] === 1), isDowned: (p1[9] === 1), isHealing: (p1[10] === 1)
    };

    // Авторитетные показатели Игрока 2 (HP, статус падения)
    if (players[1]) {
        players[1].hp = p2[0];
        players[1].isDowned = (p2[1] === 1);
        players[1].downedTimer = p2[2];
    }

    // Общие хилы и удары
    if (sh) {
        sharedHeals = sh[0];
        sharedHitCount = sh[1];
        camX += (sh[2] - camX) * 0.25;
        camY += (sh[3] - camY) * 0.25;
    }

    // Синхронизация снарядов от Хоста
    if (projs) {
        deserializeActiveProjectiles(projs);
    }
}

// Страховочный опрос Firebase
async function pollFirebaseStateFallback() {
    let rId = window.onlineNet.roomId;
    if (!rId || typeof FIREBASE_URL === 'undefined') return;
    try {
        let res = await fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}/live.json`);
        let data = await res.json();
        if (data) applyHostStatePacket(data);
    } catch(e){}
}

// --- СЕРИАЛИЗАЦИЯ И ДЕСЕРИАЛИЗАЦИЯ СНАРЯДОВ ---
function serializeActiveProjectiles() {
    let blades = [];
    if (airBlades && airBlades.length > 0) {
        for (let b of airBlades) {
            blades.push([Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy), b.color || '#fff', b.dir || 1]);
        }
    }

    let daggers = [];
    if (playerDaggers && playerDaggers.length > 0) {
        for (let d of playerDaggers) {
            daggers.push([Math.round(d.x), Math.round(d.y), Math.round(d.vx), Math.round(d.vy), d.color || '#00e5ff']);
        }
    }

    let chaos = [];
    if (chaosBalls && chaosBalls.length > 0) {
        for (let cb of chaosBalls) {
            chaos.push([Math.round(cb.x), Math.round(cb.y), Math.round(cb.vx), Math.round(cb.vy)]);
        }
    }

    return [blades, daggers, chaos];
}

function deserializeActiveProjectiles(projs) {
    if (!projs) return;
    let blades = projs[0] || [];
    let daggers = projs[1] || [];
    let chaos = projs[2] || [];

    // Воздушные клинки
    airBlades = blades.map(b => ({
        x: b[0], y: b[1], vx: b[2], vy: b[3], color: b[4], dir: b[5], width: 45, height: 18, timer: 60
    }));

    // Кинжалы
    playerDaggers = daggers.map(d => ({
        x: d[0], y: d[1], vx: d[2], vy: d[3], color: d[4], width: 14, height: 6
    }));

    // Шары хаоса
    chaosBalls = chaos.map(c => ({
        x: c[0], y: c[1], vx: c[2], vy: c[3], r: 16
    }));
}

// Считывание кнопок локального игрока
function sampleCurrentLocalInputs(inputType) {
    let kLeft=false, kRight=false, kUp=false, kDown=false;
    let kJump=false, kAttack=false, kHeal=false, kDash=false;
    let kSpec=false, kStance=false, kLight=false;

    if (inputType === 'TOUCH' && typeof touchInputs !== 'undefined') {
        kLeft = touchInputs.left; kRight = touchInputs.right; kDown = touchInputs.down; kUp = touchInputs.up;
        kJump = touchInputs.jump; kAttack = touchInputs.atk; kDash = touchInputs.dash; kSpec = touchInputs.spec;
        kHeal = touchInputs.heal; kLight = touchInputs.light; kStance = touchInputs.stance;
    } else if (inputType === 'GAMEPAD' && typeof getGamepadInput === 'function') {
        let gp = getGamepadInput(0);
        if (gp) {
            kLeft=gp.left; kRight=gp.right; kUp=gp.up; kDown=gp.down;
            kJump=gp.jump; kAttack=gp.attack; kHeal=gp.heal; kDash=gp.dash;
            kSpec=gp.special; kStance=gp.stance; kLight=gp.light;
        }
    } else if (inputType === 'KEYBOARD_2') {
        kLeft = isKeyPressed(['KeyA']); kRight = isKeyPressed(['KeyD']);
        kUp = isKeyPressed(['KeyW']); kDown = isKeyPressed(['KeyS']);
        kJump = isKeyPressed(['Space']); kAttack = isKeyPressed(['KeyJ']);
        kDash = isKeyPressed(['KeyK']); kHeal = isKeyPressed(['KeyU']);
        kSpec = isKeyPressed(['KeyI']); kStance = isKeyPressed(['KeyO']);
        kLight = isKeyPressed(['KeyL']);
    } else {
        // KEYBOARD_1
        kLeft = isKeyPressed(['ArrowLeft']); kRight = isKeyPressed(['ArrowRight']);
        kUp = isKeyPressed(['ArrowUp']); kDown = isKeyPressed(['ArrowDown']);
        kJump = isKeyPressed(['KeyZ', 'Space']); kAttack = isKeyPressed(['KeyX']);
        kDash = isKeyPressed(['KeyC']); kHeal = isKeyPressed(['KeyA']);
        kSpec = isKeyPressed(['KeyF']); kStance = isKeyPressed(['KeyS']);
        kLight = isKeyPressed(['ShiftLeft', 'ShiftRight']);
    }

    return {
        left: kLeft, right: kRight, up: kUp, down: kDown,
        jump: kJump, attack: kAttack, heal: kHeal, dash: kDash,
        special: kSpec, stance: kStance, light: kLight
    };
}
window.sampleCurrentLocalInputs = sampleCurrentLocalInputs;

// ========================================================
// --- ШАГ 5: ОКОНЧАНИЕ ИГРЫ И ПОЛНОЕ УДАЛЕНИЕ ИЗ FIREBASE ---
// ========================================================
function cleanupGame() {
    closeLobbyStream();

    if (window.onlineNet.liveEventSource) {
        try { window.onlineNet.liveEventSource.close(); } catch(e){}
        window.onlineNet.liveEventSource = null;
    }
    if (window.onlineNet.inputsEventSource) {
        try { window.onlineNet.inputsEventSource.close(); } catch(e){}
        window.onlineNet.inputsEventSource = null;
    }
    if (window.onlineNet.countdownTimer) {
        clearInterval(window.onlineNet.countdownTimer);
        window.onlineNet.countdownTimer = null;
    }

    let rId = window.onlineNet.roomId;
    if (rId && typeof FIREBASE_URL !== 'undefined') {
        // ПОЛНОЕ УДАЛЕНИЕ КОМНАТЫ И ДАННЫХ ИЗ FIREBASE ДЛЯ ОСВОБОЖДЕНИЯ ПАМЯТИ
        fetch(`${FIREBASE_URL}/onlineGames/${encodeURIComponent(rId)}.json`, { method: 'DELETE' }).catch(()=>{});
        fetch(`${FIREBASE_URL}/onlineRooms/${encodeURIComponent(rId)}.json`, { method: 'DELETE' }).catch(()=>{});
    }

    window.onlineNet.isActive = false;
    window.onlineNet.roomId = null;
    window.isOnlineMatch = false;

    // Скрываем онлайн-элементы
    let inBanner = document.getElementById('online-input-banner');
    if (inBanner) inBanner.style.display = 'none';
    let heroBanner = document.getElementById('online-hero-banner');
    if (heroBanner) heroBanner.style.display = 'none';
    let onlineBox = document.getElementById('online-badge-bottom-box');
    if (onlineBox) onlineBox.style.display = 'none';
    let offBtn = document.getElementById("badge-select-offline-btn");
    if (offBtn) offBtn.style.display = 'inline-block';
}
window.onlineNet.cleanupGame = cleanupGame;

// Очистка при закрытии вкладки браузера
window.addEventListener('beforeunload', () => {
    if (window.onlineNet && window.onlineNet.isActive) {
        window.onlineNet.cleanupGame();
    }
});

// Хелпер отображения имен героев
function getHeroDisplayName(h) {
    let map = {
        'WATER': '💧 Вода (Катана)',
        'FIRE': '🔥 Огонь (Рапира)',
        'AIR': '🌪️ Воздух (Клинки)',
        'EARTH': '🌿 Земля (Тяжёлый)',
        'STAMINA': '🩸 4-й Герой (Стамина)',
        'FIRE_HALBERD': '⚡ Огненная Алебарда',
        'WATER_ROPE': '🪢 Малыш Воды (Трос)'
    };
    return map[h] || h || 'Выбирает...';
}
