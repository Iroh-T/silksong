// --- AUDIO & HAPTICS MODULE ---
let audioCtx = null;
let tastyBananaAudio = null;

function initTastyBananaAudio() {
    if (!tastyBananaAudio) {
        try {
            tastyBananaAudio = new Audio('вкусный_банан.mp3');
            tastyBananaAudio.preload = 'auto';
        } catch(e) {}
    }
}

function initAudio() { 
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
    }
    initTastyBananaAudio();
}

function triggerVibration(type) {
    let ms = 0, weak = 0, strong = 0;
    if (type === 'attack' || type === 'untie') { ms = 5; weak = 0.3; strong = 0; }
    else if (type === 'damage') { ms = 10; weak = 0.6; strong = 0.2; }
    else if (type === 'heal_interrupt') { ms = 10; weak = 0.8; strong = 0.5; }
    else if (type === 'sa_hit') { ms = 15; weak = 0.8; strong = 0.5; }
    else if (type === 'sa1_land') { ms = 25; weak = 1.0; strong = 1.0; }
    else if (type === 'l_mode_final') { ms = 10; weak = 0.8; strong = 0.8; }
    else if (type === 'clash') { ms = 8; weak = 0.5; strong = 0.3; }

    if (navigator.vibrate) navigator.vibrate(ms);
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let gp of gamepads) {
        if (gp && gp.vibrationActuator) {
            try { 
                gp.vibrationActuator.playEffect("dual-rumble", { 
                    startDelay: 0, 
                    duration: ms, 
                    weakMagnitude: weak, 
                    strongMagnitude: strong 
                }); 
            } catch(e){}
        }
    }
}

function triggerShake(mag, time, dirX = 0, dirY = 0) {
    screenShake.mag = mag; 
    screenShake.timer = time; 
    screenShake.dirX = dirX; 
    screenShake.dirY = dirY;
}

function playSound(type) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator(); 
    let gain = audioCtx.createGain();
    osc.connect(gain); 
    gain.connect(audioCtx.destination); 
    let now = audioCtx.currentTime;

    if (type === 'slash') { 
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(600, now); 
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15); 
        gain.gain.setValueAtTime(0.4, now); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15); 
        osc.start(now); 
        osc.stop(now + 0.15); 
    } 
    else if (type === 'hitBoss') { 
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(200, now); 
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1); 
        gain.gain.setValueAtTime(0.4, now); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); 
        osc.start(now); 
        osc.stop(now + 0.1); 
    } 
    else if (type === 'hitPlayer') { 
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(150, now); 
        osc.frequency.linearRampToValueAtTime(50, now + 0.3); 
        gain.gain.setValueAtTime(0.7, now); 
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3); 
        osc.start(now); 
        osc.stop(now + 0.3); 
    } 
    else if (type === 'parry') { 
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(800, now); 
        osc.frequency.linearRampToValueAtTime(2000, now + 0.15); 
        gain.gain.setValueAtTime(0.5, now); 
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15); 
        osc.start(now); 
        osc.stop(now + 0.15); 
    } 
    else if (type === 'heal') { 
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(300, now); 
        osc.frequency.linearRampToValueAtTime(600, now + 2.0); 
        gain.gain.setValueAtTime(0.3, now); 
        gain.gain.linearRampToValueAtTime(0.001, now + 2.0); 
        osc.start(now); 
        osc.stop(now + 2.0); 
    } 
    else if (type === 'throw') { 
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(900, now); 
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1); 
        gain.gain.setValueAtTime(0.3, now); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); 
        osc.start(now); 
        osc.stop(now + 0.1); 
    } 
    else if (type === 'teleport') { 
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(1500, now); 
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.4); 
        gain.gain.setValueAtTime(0.5, now); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); 
        osc.start(now); 
        osc.stop(now + 0.4); 
    }
    else if (type === 'wind') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    }
    else if (type === 'leaf') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type === 'trap') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type === 'heartbeat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        // second beat (lub-dub)
        let osc2 = audioCtx.createOscillator();
        let gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(75, now + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.32);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(0.4, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.35);
    }
    else if (type === 'rockCrit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        let crackOsc = audioCtx.createOscillator();
        let crackGain = audioCtx.createGain();
        crackOsc.connect(crackGain);
        crackGain.connect(audioCtx.destination);
        crackOsc.type = 'square';
        crackOsc.frequency.setValueAtTime(450, now);
        crackOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        crackGain.gain.setValueAtTime(0.5, now);
        crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        crackOsc.start(now);
        crackOsc.stop(now + 0.15);
    }
    else if (type === 'heatIgnite') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    }
    else if (type === 'demonRoar') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
    }
    else if (type === 'lightChime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    }
    else if (type === 'bladeSpin') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
    else if (type === 'tasty_banana') {
        playTastyBananaSound();
    }
}

function playTastyBananaSound() {
    try {
        if (!tastyBananaAudio) {
            tastyBananaAudio = new Audio('вкусный_банан.mp3');
        }
        tastyBananaAudio.currentTime = 0;
        tastyBananaAudio.volume = 0.85;
        let p = tastyBananaAudio.play();
        if (p) {
            p.catch(() => {
                if (typeof playSound === 'function') playSound('heal');
            });
        }
    } catch(e) {
        if (typeof playSound === 'function') playSound('heal');
    }
}
window.playTastyBananaSound = playTastyBananaSound;

// --- ATMOSPHERIC MENU SOUNDTRACK (SILKSONG AMBIENCE) ---
let menuMusicTimer = null;
let menuDroneGain = null;
let isMenuMusicPlaying = false;

function startMenuMusic() {
    if (isMenuMusicPlaying || gameState === "PLAYING") return;
    initAudio();
    if (!audioCtx) return;

    // Check if external menu.mp3 is loaded in <audio id="menuMusic">
    let externalMenuAudio = document.getElementById("menuMusic");
    if (externalMenuAudio && externalMenuAudio.src && !externalMenuAudio.src.endsWith("#")) {
        externalMenuAudio.volume = 0.4;
        let p = externalMenuAudio.play();
        if (p) {
            p.then(() => { isMenuMusicPlaying = true; })
             .catch(() => { startProceduralMenuTheme(); });
            return;
        }
    }
    startProceduralMenuTheme();
}

function startProceduralMenuTheme() {
    if (isMenuMusicPlaying || gameState === "PLAYING" || !audioCtx) return;
    isMenuMusicPlaying = true;

    try {
        // Soft low drone (A minor atmosphere)
        let droneOsc = audioCtx.createOscillator();
        let droneGain = audioCtx.createGain();
        let droneFilter = audioCtx.createBiquadFilter();

        droneOsc.type = 'triangle';
        droneOsc.frequency.setValueAtTime(110, audioCtx.currentTime); // A2
        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(320, audioCtx.currentTime);

        droneGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        droneGain.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 3);

        droneOsc.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(audioCtx.destination);
        droneOsc.start();

        menuDroneGain = { osc: droneOsc, gain: droneGain };

        // Silksong-inspired melancholic bell/harp melody
        const notes = [
            220.00, // A3
            261.63, // C4
            293.66, // D4
            329.63, // E4
            392.00, // G4
            440.00, // A4
            523.25, // C5
            587.33  // D5
        ];

        const melodyPattern = [
            { n: 2, d: 2.2 }, 
            { n: 0, d: 1.6 }, 
            { n: 3, d: 2.4 },
            { n: 1, d: 1.8 }, 
            { n: 4, d: 2.8 }, 
            { n: 2, d: 2.0 },
            { n: 5, d: 2.4 }, 
            { n: 3, d: 1.6 }, 
            { n: 1, d: 2.6 }
        ];
        let step = 0;

        function playNextNote() {
            if (!isMenuMusicPlaying || gameState === "PLAYING") return;
            let cur = melodyPattern[step % melodyPattern.length];
            step++;
            let freq = notes[cur.n];
            playAtmosphericPluck(freq, cur.d);
            menuMusicTimer = setTimeout(playNextNote, cur.d * 950);
        }

        playNextNote();
    } catch(e) {
        console.log("Audio theme error:", e);
    }
}

function playAtmosphericPluck(freq, duration) {
    if (!audioCtx || !isMenuMusicPlaying || gameState === "PLAYING") return;
    try {
        let osc = audioCtx.createOscillator();
        let osc2 = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        let filter = audioCtx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        // Slight shimmer / harmonic
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2.005, audioCtx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + duration);

        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime);
        osc2.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + duration);
        osc2.stop(audioCtx.currentTime + duration);
    } catch(e){}
}

function stopMenuMusic() {
    isMenuMusicPlaying = false;
    if (menuMusicTimer) {
        clearTimeout(menuMusicTimer);
        menuMusicTimer = null;
    }
    if (menuDroneGain) {
        try {
            menuDroneGain.gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.0);
            setTimeout(() => {
                try { menuDroneGain.osc.stop(); } catch(e){}
            }, 1000);
        } catch(e){}
        menuDroneGain = null;
    }
    let externalMenuAudio = document.getElementById("menuMusic");
    if (externalMenuAudio) {
        try { externalMenuAudio.pause(); } catch(e){}
    }
}

// Start menu music on first user click or keypress
window.addEventListener('click', () => {
    if (gameState === "MENU") startMenuMusic();
}, { once: false });
window.addEventListener('keydown', () => {
    if (gameState === "MENU") startMenuMusic();
}, { once: false });

