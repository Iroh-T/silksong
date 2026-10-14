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
    else if (type === 'l_mode_final') { ms = 35; weak = 1.0; strong = 1.0; }
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
    else if (type === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 25, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.045);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.start(now);
        osc.stop(now + 0.045);
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

// ============================================================
// --- FIRE BOSS COMPOSITION SUITE ---
// Structured Multi-Part Musical Suite:
// 1. INTRO (Интро): Deep atmospheric drone, accelerating pulse, riser to flash apex.
// 2. MAIN (Основа): Full driving battle theme, punchy flame groove, crisp dynamic EQ.
// 3. BRIDGE (Бридж): Melodic development, 16th-note fire arpeggios, filter resonance sweeps.
// 4. OUTRO (Аутро): Majestic decrescendo, lingering warm harmonic chord decay, fading embers.
// ============================================================
let fireBossIntroNodes = [];
let fireBossBridgeTimer = null;
let fireBossOutroNodes = [];
let fireBossLoopWatchdog = null;
let fireBossVolumeFadeTimer = null;

function fadeFireBossVolume(targetVol, durationMs) {
    let fAudio = document.getElementById("fireBossMusic");
    if (!fAudio) return;
    if (fireBossVolumeFadeTimer) {
        clearInterval(fireBossVolumeFadeTimer);
        fireBossVolumeFadeTimer = null;
    }
    if (durationMs <= 0) {
        fAudio.volume = Math.max(0, Math.min(1, targetVol));
        return;
    }
    let startVol = fAudio.volume;
    let startTime = performance.now();
    fireBossVolumeFadeTimer = setInterval(() => {
        let elapsed = performance.now() - startTime;
        let p = Math.min(1, elapsed / durationMs);
        fAudio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * p));
        if (p >= 1) {
            clearInterval(fireBossVolumeFadeTimer);
            fireBossVolumeFadeTimer = null;
        }
    }, 25);
}

const fireBossAudioEngine = {
    section: "IDLE", // "INTRO", "MAIN", "BRIDGE", "OUTRO"

    startIntro() {
        this.stop();
        this.section = "INTRO";
        if (!audioCtx) initAudio();
        
        let fAudio = document.getElementById("fireBossMusic");
        if (fAudio) {
            try {
                fAudio.pause();
                fAudio.currentTime = 0;
            } catch(e) {}
        }

        if (audioCtx) {
            let now = audioCtx.currentTime;
            try {
                // 1. Deep sub-bass drone (55Hz / A1 sliding up toward D2)
                let droneOsc = audioCtx.createOscillator();
                let droneGain = audioCtx.createGain();
                let droneFilter = audioCtx.createBiquadFilter();

                droneOsc.type = "sine";
                droneOsc.frequency.setValueAtTime(55, now);
                droneOsc.frequency.linearRampToValueAtTime(73.4, now + 3.75);

                droneFilter.type = "lowpass";
                droneFilter.frequency.setValueAtTime(160, now);

                droneGain.gain.setValueAtTime(0.001, now);
                droneGain.gain.exponentialRampToValueAtTime(0.35, now + 1.2);
                droneGain.gain.setValueAtTime(0.35, now + 2.8);
                droneGain.gain.exponentialRampToValueAtTime(0.001, now + 3.75);

                droneOsc.connect(droneFilter);
                droneFilter.connect(droneGain);
                droneGain.connect(audioCtx.destination);
                droneOsc.start(now);
                droneOsc.stop(now + 3.8);
                fireBossIntroNodes.push(droneOsc);

                // 2. Harmonic mysterious pad (A2 / E3 fifths)
                let padOsc1 = audioCtx.createOscillator();
                let padOsc2 = audioCtx.createOscillator();
                let padGain = audioCtx.createGain();
                let padFilter = audioCtx.createBiquadFilter();

                padOsc1.type = "triangle";
                padOsc2.type = "triangle";
                padOsc1.frequency.setValueAtTime(110, now);
                padOsc2.frequency.setValueAtTime(164.8, now);

                padFilter.type = "lowpass";
                padFilter.frequency.setValueAtTime(220, now);
                padFilter.frequency.exponentialRampToValueAtTime(1800, now + 2.4);

                padGain.gain.setValueAtTime(0.001, now);
                padGain.gain.linearRampToValueAtTime(0.2, now + 1.5);
                padGain.gain.exponentialRampToValueAtTime(0.001, now + 3.75);

                padOsc1.connect(padFilter);
                padOsc2.connect(padFilter);
                padFilter.connect(padGain);
                padGain.connect(audioCtx.destination);
                padOsc1.start(now);
                padOsc2.start(now);
                padOsc1.stop(now + 3.8);
                padOsc2.stop(now + 3.8);
                fireBossIntroNodes.push(padOsc1, padOsc2);

                // 3. Tension riser leading directly up to the blinding flash
                let riserOsc = audioCtx.createOscillator();
                let riserGain = audioCtx.createGain();
                riserOsc.type = "sawtooth";
                riserOsc.frequency.setValueAtTime(130, now + 0.8);
                riserOsc.frequency.exponentialRampToValueAtTime(780, now + 2.4);

                let riserFilter = audioCtx.createBiquadFilter();
                riserFilter.type = "bandpass";
                riserFilter.Q.setValueAtTime(4.0, now + 0.8);
                riserFilter.frequency.setValueAtTime(200, now + 0.8);
                riserFilter.frequency.exponentialRampToValueAtTime(1600, now + 2.4);

                riserGain.gain.setValueAtTime(0.0001, now + 0.8);
                riserGain.gain.exponentialRampToValueAtTime(0.18, now + 2.3);
                riserGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.45);

                riserOsc.connect(riserFilter);
                riserFilter.connect(riserGain);
                riserGain.connect(audioCtx.destination);
                riserOsc.start(now + 0.8);
                riserOsc.stop(now + 2.5);
                fireBossIntroNodes.push(riserOsc);
            } catch(e) {
                console.log("Fire boss intro error:", e);
            }
        }
    },

    flashApexImpact() {
        if (!audioCtx) return;
        try {
            let now = audioCtx.currentTime;
            let impOsc = audioCtx.createOscillator();
            let impGain = audioCtx.createGain();
            impOsc.type = "sine";
            impOsc.frequency.setValueAtTime(880, now);
            impOsc.frequency.exponentialRampToValueAtTime(220, now + 0.8);

            impGain.gain.setValueAtTime(0.35, now);
            impGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

            impOsc.connect(impGain);
            impGain.connect(audioCtx.destination);
            impOsc.start(now);
            impOsc.stop(now + 0.85);
        } catch(e) {}
    },

    playCombatStartChime() {
        if (!audioCtx) return;
        try {
            let now = audioCtx.currentTime;
            const chord = [146.83, 220.0, 293.66, 369.99];
            for (let freq of chord) {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                let filt = audioCtx.createBiquadFilter();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(freq, now);
                filt.type = "lowpass";
                filt.frequency.setValueAtTime(1400, now);
                filt.frequency.exponentialRampToValueAtTime(300, now + 1.8);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
                osc.connect(filt);
                filt.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 2.1);
            }
        } catch(e) {}
    },

    playParryRipSound() {
        if (!audioCtx) return;
        try {
            let now = audioCtx.currentTime;
            // 1. Sharp metallic clash & blade slide
            let slide = audioCtx.createOscillator();
            let sGain = audioCtx.createGain();
            slide.type = "sawtooth";
            slide.frequency.setValueAtTime(1400, now);
            slide.frequency.exponentialRampToValueAtTime(220, now + 0.35);
            sGain.gain.setValueAtTime(0.28, now);
            sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            slide.connect(sGain);
            sGain.connect(audioCtx.destination);
            slide.start(now);
            slide.stop(now + 0.36);

            // 2. Heavy explosive sub-whoosh (dimensional area tear)
            let sub = audioCtx.createOscillator();
            let subGain = audioCtx.createGain();
            let subFilt = audioCtx.createBiquadFilter();
            sub.type = "sine";
            sub.frequency.setValueAtTime(180, now + 0.05);
            sub.frequency.exponentialRampToValueAtTime(45, now + 0.55);
            subFilt.type = "lowpass";
            subFilt.frequency.setValueAtTime(250, now);
            subGain.gain.setValueAtTime(0.001, now + 0.05);
            subGain.gain.linearRampToValueAtTime(0.35, now + 0.12);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            sub.connect(subFilt);
            subFilt.connect(subGain);
            subGain.connect(audioCtx.destination);
            sub.start(now + 0.05);
            sub.stop(now + 0.65);
        } catch(e) {}
    },

    startMainTheme() {
        this.section = "MAIN";
        let fAudio = document.getElementById("fireBossMusic");
        if (!fAudio) return;

        try {
            fAudio.currentTime = 0;
            fAudio.volume = 0.02; // Начинается почти с нуля
            fAudio.play().catch(e => console.log("Fire boss play:", e));
            fadeFireBossVolume(0.85, 2500); // Плавно нарастает до 85% за 2.5 сек!
            this.startLoopWatchdog();
            this.playCombatStartChime();
        } catch(e) {
            console.log("Main theme start error:", e);
        }
    },

    triggerBridge() {
        if (this.section === "BRIDGE" || this.section === "OUTRO" || this.section === "IDLE") return;
        this.section = "BRIDGE";
        if (!audioCtx) initAudio();
        if (!audioCtx) return;

        try {
            const bridgeNotes = [220.00, 261.63, 293.66, 329.63, 440.00, 523.25, 587.33];
            let noteIdx = 0;
            if (fireBossBridgeTimer) clearInterval(fireBossBridgeTimer);
            fireBossBridgeTimer = setInterval(() => {
                if (fireBossAudioEngine.section !== "BRIDGE" || gameState !== "PLAYING") {
                    clearInterval(fireBossBridgeTimer);
                    fireBossBridgeTimer = null;
                    return;
                }
                try {
                    let t = audioCtx.currentTime;
                    let bOsc = audioCtx.createOscillator();
                    let bGain = audioCtx.createGain();
                    let bFilt = audioCtx.createBiquadFilter();

                    bOsc.type = (noteIdx % 4 === 0) ? "sawtooth" : "triangle";
                    let freq = bridgeNotes[noteIdx % bridgeNotes.length];
                    bOsc.frequency.setValueAtTime(freq, t);

                    bFilt.type = "bandpass";
                    bFilt.frequency.setValueAtTime(freq * 1.5, t);
                    bFilt.Q.setValueAtTime(2.5, t);

                    bGain.gain.setValueAtTime(0.001, t);
                    bGain.gain.linearRampToValueAtTime(0.06, t + 0.02);
                    bGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

                    bOsc.connect(bFilt);
                    bFilt.connect(bGain);
                    bGain.connect(audioCtx.destination);

                    bOsc.start(t);
                    bOsc.stop(t + 0.15);
                    noteIdx++;
                } catch(e) {}
            }, 125);
        } catch(e) {
            console.log("Bridge trigger error:", e);
        }
    },

    triggerOutro() {
        this.section = "OUTRO";
        let fAudio = document.getElementById("fireBossMusic");
        if (fireBossBridgeTimer) {
            clearInterval(fireBossBridgeTimer);
            fireBossBridgeTimer = null;
        }

        // 1. Smoothly fade out the battle track over 2.5s
        if (fAudio) {
            fadeFireBossVolume(0, 2500);
            setTimeout(() => {
                try { fAudio.pause(); fAudio.currentTime = 0; } catch(e){}
            }, 2600);
        }

        // 2. Play warm resolving orchestral chord decay (Dmaj7 / F#m / A: D3, F#3, A3, C#4)
        if (audioCtx) {
            let now = audioCtx.currentTime;
            try {
                const outroChord = [146.83, 185.00, 220.00, 277.18, 440.00];
                for (let freq of outroChord) {
                    let osc = audioCtx.createOscillator();
                    let gain = audioCtx.createGain();
                    let filt = audioCtx.createBiquadFilter();

                    osc.type = "triangle";
                    osc.frequency.setValueAtTime(freq, now + 0.2);

                    filt.type = "lowpass";
                    filt.frequency.setValueAtTime(1200, now + 0.2);
                    filt.frequency.exponentialRampToValueAtTime(300, now + 5.0);

                    gain.gain.setValueAtTime(0.001, now + 0.2);
                    gain.gain.linearRampToValueAtTime(0.07, now + 1.2);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

                    osc.connect(filt);
                    filt.connect(gain);
                    gain.connect(audioCtx.destination);

                    osc.start(now + 0.2);
                    osc.stop(now + 5.6);
                    fireBossOutroNodes.push(osc);
                }

                // 3. Gentle lingering fire bell harmonics
                const chimes = [880.00, 1174.66, 1318.51, 1760.00];
                for (let i = 0; i < chimes.length; i++) {
                    let cTime = now + 1.0 + i * 0.45;
                    let bell = audioCtx.createOscillator();
                    let bGain = audioCtx.createGain();
                    bell.type = "sine";
                    bell.frequency.setValueAtTime(chimes[i], cTime);

                    bGain.gain.setValueAtTime(0.001, cTime);
                    bGain.gain.linearRampToValueAtTime(0.04, cTime + 0.04);
                    bGain.gain.exponentialRampToValueAtTime(0.0001, cTime + 2.0);

                    bell.connect(bGain);
                    bGain.connect(audioCtx.destination);
                    bell.start(cTime);
                    bell.stop(cTime + 2.1);
                    fireBossOutroNodes.push(bell);
                }
            } catch(e) {
                console.log("Outro audio error:", e);
            }
        }
    },

    startLoopWatchdog() {
        if (fireBossLoopWatchdog) clearInterval(fireBossLoopWatchdog);
        let fAudio = document.getElementById("fireBossMusic");
        if (!fAudio) return;

        fireBossLoopWatchdog = setInterval(() => {
            if (fireBossAudioEngine.section === "IDLE" || gameState !== "PLAYING") {
                clearInterval(fireBossLoopWatchdog);
                fireBossLoopWatchdog = null;
                return;
            }
            if (fAudio && fAudio.duration && fAudio.currentTime >= fAudio.duration - 2.5) {
                fAudio.currentTime = 0.5;
                if (fireBossAudioEngine.section === "BRIDGE") {
                    fireBossAudioEngine.triggerBridge();
                }
            }
        }, 500);
    },

    stop() {
        this.section = "IDLE";
        if (fireBossBridgeTimer) {
            clearInterval(fireBossBridgeTimer);
            fireBossBridgeTimer = null;
        }
        if (fireBossLoopWatchdog) {
            clearInterval(fireBossLoopWatchdog);
            fireBossLoopWatchdog = null;
        }
        if (fireBossVolumeFadeTimer) {
            clearInterval(fireBossVolumeFadeTimer);
            fireBossVolumeFadeTimer = null;
        }
        for (let n of fireBossIntroNodes) {
            try { n.stop(); n.disconnect(); } catch(e){}
        }
        fireBossIntroNodes = [];
        for (let n of fireBossOutroNodes) {
            try { n.stop(); n.disconnect(); } catch(e){}
        }
        fireBossOutroNodes = [];

        let fAudio = document.getElementById("fireBossMusic");
        if (fAudio) {
            try {
                fAudio.pause();
                fAudio.currentTime = 0;
            } catch(e){}
        }
    }
};
window.fireBossAudioEngine = fireBossAudioEngine;

function playFireBossMusic() {
    if (window.fireBossAudioEngine) {
        window.fireBossAudioEngine.startMainTheme();
    }
}
window.playFireBossMusic = playFireBossMusic;

function stopFireBossMusic() {
    if (window.fireBossAudioEngine) {
        window.fireBossAudioEngine.stop();
    }
}
window.stopFireBossMusic = stopFireBossMusic;

// Start menu music on first user click or keypress
window.addEventListener('click', () => {
    if (gameState === "MENU") startMenuMusic();
}, { once: false });
window.addEventListener('keydown', () => {
    if (gameState === "MENU") startMenuMusic();
}, { once: false });
