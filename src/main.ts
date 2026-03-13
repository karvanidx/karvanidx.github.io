import './style.css'
import Alpine from 'alpinejs'

// @ts-ignore
window.Alpine = Alpine

const TYPING_SENTENCES = [
    "the quick brown fox jumps over the lazy dog",
    "pack my box with five dozen liquor jugs",
    "how vexingly quick daft zebras jump",
    "the five boxing wizards jump quickly",
    "sphinx of black quartz judge my vow",
    "two driven jocks help fax my big quiz",
    "the jay pig fox zebra and my wolves quack",
    "sympathizing would fix quaker objectives",
    "a large fawn jumped quickly over white zinc boxes",
    "my girl wove six dozen plaid jackets before she quit"
];

interface AppState {
    note: string;
    location: string;
    time: { hours: string; minutes: string; seconds: string; date: string };
    lastSaved: string;
    toast: { show: boolean; message: string; timeout: number | null };
    stats: { words: number };
    totalGamesPlayed: number;
    showInfo: boolean;
    sysInfo: {
        userAgent: string;
        platform: string;
        resolution: string;
        timezone: string;
        referrer: string;
    };
    focusGame: {
        state: 'idle' | 'waiting' | 'ready' | 'result' | 'too_soon';
        statusText: string;
        statusColor: string;
        best: number;
        attempts: number[];
        startTime: number;
        timeout: number | null;
        ctx: CanvasRenderingContext2D | null;
        dpr: number;
    };
    memoryGame: {
        phase: 'idle' | 'show' | 'input' | 'success' | 'fail';
        statusText: string;
        level: number;
        best: number;
        sequence: number[];
        playerIndex: number;
        grid: { isActive: boolean; isCorrect: boolean; isWrong: boolean }[];
    };
    typingGame: {
        phase: 'idle' | 'playing' | 'done';
        text: string;
        input: string;
        correct: number;
        errors: number;
        wpm: number;
        accuracy: number;
        bestWpm: number;
        startTime: number;
        interval: number | null;
    };
    _saveTimeout: number | null;
    _resizeObserver: ResizeObserver | null;
    init(): void;
    updateClock(): void;
    detectLocation(): void;
    gatherSysInfo(): void;
    countWords(str: string): number;
    debouncedSaveNote(): void;
    clearNote(): void;
    loadData(): void;
    saveStats(): void;
    showToast(msg: string): void;
    initFocusCanvas(): void;
    resizeFocusCanvas(): void;
    drawFocusState(): void;
    handleFocusAction(): void;
    resetFocusGame(): void;
    startMemoryGame(): Promise<void>;
    playMemorySequence(): Promise<void>;
    clearMemoryGrid(): void;
    handleMemoryClick(idx: number): void;
    resetTypingGame(): void;
    renderTypingDisplay(): string;
    handleTypingInput(): void;
    calculateTypingStats(): void;
}

document.addEventListener("alpine:init", () => {
    Alpine.data("portfolioApp", () => ({
        // General State
        note: "",
        location: "Earth",
        time: { hours: "00", minutes: "00", seconds: "00", date: "" },
        lastSaved: "",
        toast: { show: false, message: "", timeout: null },
        stats: { words: 0 },
        totalGamesPlayed: 0,
        showInfo: false,
        sysInfo: {
            userAgent: "",
            platform: "",
            resolution: "",
            timezone: "",
            referrer: ""
        },
        
        // Focus Game State
        focusGame: {
            state: "idle",
            statusText: "Click to start",
            statusColor: "text-muted",
            best: 9999,
            attempts: [],
            startTime: 0,
            timeout: null,
            ctx: null,
            dpr: 1
        },

        // Memory Game State
        memoryGame: {
            phase: "idle",
            statusText: "Click Start to begin",
            level: 1,
            best: 0,
            sequence: [],
            playerIndex: 0,
            grid: Array(9).fill(null).map(() => ({ isActive: false, isCorrect: false, isWrong: false })),
        },

        // Typing Game State
        typingGame: {
            phase: "idle",
            text: "",
            input: "",
            correct: 0,
            errors: 0,
            wpm: 0,
            accuracy: 100,
            bestWpm: 0,
            startTime: 0,
            interval: null
        },

        _saveTimeout: null,
        _resizeObserver: null,

        // Core Initialization
        init(this: AppState) {
            this.updateClock();
            setInterval(() => this.updateClock(), 1000);
            
            this.detectLocation();
            this.gatherSysInfo();
            this.loadData();
            
            // Init Games
            this.initFocusCanvas();
            this.resetTypingGame();

            // Resize Listener
            window.addEventListener('resize', () => {
                this.drawFocusState();
            });
        },

        // Clock & Location
        updateClock(this: AppState) {
            const now = new Date();
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const pad = (num: number) => num.toString().padStart(2, '0');
            
            this.time = {
                hours: pad(now.getHours()),
                minutes: pad(now.getMinutes()),
                seconds: pad(now.getSeconds()),
                date: `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
            };
        },

        detectLocation(this: AppState) {
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (tz.includes("Jakarta") || tz.includes("Indonesia")) this.location = "Indonesia";
                else if (tz.includes("Singapore")) this.location = "Singapore";
                else if (tz.includes("Tokyo")) this.location = "Japan";
                else if (tz.includes("America")) this.location = "United States";
                else if (tz.includes("Europe")) this.location = "Europe";
                else if (tz.includes("Australia")) this.location = "Australia";
                else {
                    const parts = tz.split("/");
                    if (parts.length > 1) this.location = parts[1].replace("_", " ");
                }
            } catch (e) {
                this.location = "Earth";
            }
        },

        gatherSysInfo(this: AppState) {
            this.sysInfo = {
                userAgent: navigator.userAgent,
                // @ts-ignore
                platform: navigator.platform || (navigator.userAgentData ? navigator.userAgentData.platform : "Unknown"),
                resolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                referrer: document.referrer || "Direct Access"
            };
        },

        // Notes Logic
        countWords(str: string) {
            return str ? str.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
        },

        debouncedSaveNote(this: AppState) {
            this.stats.words = this.countWords(this.note);
            if (this._saveTimeout) clearTimeout(this._saveTimeout);
            
            this._saveTimeout = window.setTimeout(() => {
                localStorage.setItem("ervan_notes", this.note);
                this.lastSaved = "Saved just now";
                setTimeout(() => this.lastSaved = "", 3000);
            }, 500);
        },

        clearNote(this: AppState) {
            if (!this.note) return;
            if (window.confirm("Are you sure you want to clear all notes?")) {
                this.note = "";
                this.stats.words = 0;
                localStorage.removeItem("ervan_notes");
                this.showToast("Notes cleared successfully.");
            }
        },

        // Persistence Data
        loadData(this: AppState) {
            const savedNote = localStorage.getItem("ervan_notes");
            if (savedNote) {
                this.note = savedNote;
                this.stats.words = this.countWords(this.note);
            }

            try {
                const stats = JSON.parse(localStorage.getItem("ervan_game_stats") || "{}");
                this.focusGame.best = stats.focusBest || 9999;
                this.memoryGame.best = stats.memoryBest || 0;
                this.typingGame.bestWpm = stats.typingBest || 0;
                this.totalGamesPlayed = stats.totalPlayed || 0;
            } catch (e) { console.error("Could not parse local stats."); }
        },

        saveStats(this: AppState) {
            const stats = {
                focusBest: this.focusGame.best,
                memoryBest: this.memoryGame.best,
                typingBest: this.typingGame.bestWpm,
                totalPlayed: this.totalGamesPlayed
            };
            localStorage.setItem("ervan_game_stats", JSON.stringify(stats));
        },

        showToast(this: AppState, msg: string) {
            this.toast.message = msg;
            this.toast.show = true;
            if (this.toast.timeout) clearTimeout(this.toast.timeout);
            this.toast.timeout = window.setTimeout(() => {
                this.toast.show = false;
            }, 2500);
        },

        // FOCUS REACTION
        initFocusCanvas(this: any) {
            const canvas = this.$refs.focusCanvas as HTMLCanvasElement;
            const container = canvas.parentElement;
            if (!canvas || !container) return;
            this.focusGame.ctx = canvas.getContext("2d");

            // Use ResizeObserver for perfect scaling
            this._resizeObserver = new ResizeObserver(() => {
                this.resizeFocusCanvas();
                this.drawFocusState();
            });
            this._resizeObserver.observe(container);
            
            this.resizeFocusCanvas();
            this.drawFocusState();
        },

        resizeFocusCanvas(this: any) {
            const canvas = this.$refs.focusCanvas as HTMLCanvasElement;
            const container = canvas.parentElement;
            if (!canvas || !container || !this.focusGame.ctx) return;
            
            const rect = container.getBoundingClientRect();
            this.focusGame.dpr = window.devicePixelRatio || 1;
            
            canvas.width = rect.width * this.focusGame.dpr;
            canvas.height = rect.height * this.focusGame.dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            
            this.focusGame.ctx.scale(this.focusGame.dpr, this.focusGame.dpr);
        },

        drawFocusState(this: any) {
            const ctx = this.focusGame.ctx;
            const canvas = this.$refs.focusCanvas as HTMLCanvasElement;
            if (!ctx || !canvas) return;
            
            const w = canvas.width / this.focusGame.dpr;
            const h = canvas.height / this.focusGame.dpr;
            const state = this.focusGame.state;

            ctx.clearRect(0, 0, w, h);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (state === 'idle') {
                ctx.fillStyle = "#0c0c0e";
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = "#6b6b72";
                ctx.font = "14px DM Sans";
                ctx.fillText("Click to start", w/2, h/2);
            } 
            else if (state === 'waiting') {
                ctx.fillStyle = "#1a0f0f";
                ctx.fillRect(0, 0, w, h);
                ctx.fillStyle = "#f87171";
                ctx.font = "16px DM Sans";
                ctx.fillText("Wait...", w/2, h/2);
            } 
            else if (state === 'ready') {
                const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w,h)/2);
                grad.addColorStop(0, "#1a2a1a");
                grad.addColorStop(1, "#0c0c0e");
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
                
                ctx.fillStyle = "#4ade80";
                ctx.font = "bold 24px Space Grotesk";
                ctx.fillText("CLICK!", w/2, h/2);
            } 
            else if (state === 'result' || state === 'too_soon') {
                ctx.fillStyle = "#0c0c0e";
                ctx.fillRect(0, 0, w, h);
                
                if (state === 'too_soon') {
                    ctx.fillStyle = "#f87171";
                    ctx.font = "bold 20px Space Grotesk";
                    ctx.fillText("Too Soon!", w/2, h/2 - 5);
                } else {
                    const score = this.focusGame.attempts[this.focusGame.attempts.length - 1];
                    ctx.fillStyle = score < 250 ? "#4ade80" : (score < 350 ? "#c9a227" : "#f87171");
                    ctx.font = "bold 28px Space Grotesk";
                    ctx.fillText(`${score}ms`, w/2, h/2 - 10);
                    
                    ctx.fillStyle = "#6b6b72";
                    ctx.font = "12px DM Sans";
                    let rating = score < 200 ? "Alien! 👽" : score < 250 ? "Excellent! ⚡" : score < 350 ? "Good 👍" : "Slow 🐢";
                    ctx.fillText(rating, w/2, h/2 + 18);
                }
            }
        },

        handleFocusAction(this: AppState) {
            const fg = this.focusGame;
            
            if (fg.state === 'idle' || fg.state === 'result' || fg.state === 'too_soon') {
                fg.state = 'waiting';
                fg.statusText = "Wait for green...";
                fg.statusColor = "text-danger";
                this.drawFocusState();
                
                const delay = 1200 + Math.random() * 2500;
                fg.timeout = window.setTimeout(() => {
                    fg.state = 'ready';
                    fg.statusText = "GO!";
                    fg.statusColor = "text-success";
                    fg.startTime = performance.now();
                    this.drawFocusState();
                }, delay);
            } 
            else if (fg.state === 'waiting') {
                if (fg.timeout) clearTimeout(fg.timeout);
                fg.state = 'too_soon';
                fg.statusText = "Click to retry";
                fg.statusColor = "text-muted";
                this.drawFocusState();
            } 
            else if (fg.state === 'ready') {
                const reactionTime = Math.round(performance.now() - fg.startTime);
                fg.attempts.push(reactionTime);
                
                if (reactionTime < fg.best) fg.best = reactionTime;
                if (fg.attempts.length > 5) fg.attempts.shift();
                
                fg.state = 'result';
                fg.statusText = "Click to retry";
                fg.statusColor = "text-muted";
                this.drawFocusState();
                
                this.totalGamesPlayed++;
                this.saveStats();
            }
        },

        resetFocusGame(this: AppState) {
            if (this.focusGame.timeout) clearTimeout(this.focusGame.timeout);
            this.focusGame.attempts = [];
            this.focusGame.best = 9999;
            this.focusGame.state = 'idle';
            this.focusGame.statusText = "Click to start";
            this.drawFocusState();
            this.saveStats();
            this.showToast("Focus stats reset.");
        },

        // MEMORY PATTERN
        async startMemoryGame(this: AppState) {
            if (this.memoryGame.phase === 'show') return;
            
            if (this.memoryGame.phase === 'fail' || this.memoryGame.phase === 'idle') {
                this.memoryGame.level = 1;
                this.memoryGame.sequence = [];
            }
            
            this.memoryGame.phase = 'show';
            this.memoryGame.statusText = "Watch the pattern...";
            this.memoryGame.playerIndex = 0;
            
            this.memoryGame.sequence.push(Math.floor(Math.random() * 9));
            
            this.clearMemoryGrid();
            await this.playMemorySequence();
        },

        async playMemorySequence(this: AppState) {
            await new Promise(r => setTimeout(r, 600));
            
            for (let i = 0; i < this.memoryGame.sequence.length; i++) {
                if (this.memoryGame.phase !== 'show') break;
                
                let cellIdx = this.memoryGame.sequence[i];
                this.memoryGame.grid[cellIdx].isActive = true;
                
                await new Promise(r => setTimeout(r, 400));
                this.memoryGame.grid[cellIdx].isActive = false;
                
                await new Promise(r => setTimeout(r, 200));
            }
            
            if (this.memoryGame.phase === 'show') {
                this.memoryGame.phase = 'input';
                this.memoryGame.statusText = "Your turn! Repeat the pattern";
            }
        },

        clearMemoryGrid(this: AppState) {
            this.memoryGame.grid.forEach(cell => {
                cell.isActive = false;
                cell.isCorrect = false;
                cell.isWrong = false;
            });
        },

        handleMemoryClick(this: AppState, idx: number) {
            if (this.memoryGame.phase !== 'input') return;

            const expectedIdx = this.memoryGame.sequence[this.memoryGame.playerIndex];
            
            if (idx === expectedIdx) {
                this.memoryGame.grid[idx].isCorrect = true;
                setTimeout(() => this.memoryGame.grid[idx].isCorrect = false, 250);
                
                this.memoryGame.playerIndex++;
                
                if (this.memoryGame.playerIndex === this.memoryGame.sequence.length) {
                    this.memoryGame.phase = 'success';
                    this.memoryGame.statusText = `Correct! Level ${this.memoryGame.level} complete!`;
                    
                    if (this.memoryGame.level > this.memoryGame.best) {
                        this.memoryGame.best = this.memoryGame.level;
                    }
                    this.totalGamesPlayed++;
                    this.saveStats();
                    
                    this.memoryGame.level++;
                    setTimeout(() => {
                        if (this.memoryGame.phase === 'success') this.startMemoryGame();
                    }, 1200);
                }
            } else {
                this.memoryGame.grid[idx].isWrong = true;
                setTimeout(() => this.memoryGame.grid[idx].isWrong = false, 400);
                
                this.memoryGame.phase = 'fail';
                this.memoryGame.statusText = `Game Over! Reached Level ${this.memoryGame.level}`;
                this.totalGamesPlayed++;
                this.saveStats();
            }
        },

        // TYPING SPEED
        resetTypingGame(this: any) {
            let newText = TYPING_SENTENCES[Math.floor(Math.random() * TYPING_SENTENCES.length)];
            while(newText === this.typingGame.text && TYPING_SENTENCES.length > 1) {
                 newText = TYPING_SENTENCES[Math.floor(Math.random() * TYPING_SENTENCES.length)];
            }

            this.typingGame = {
                ...this.typingGame,
                phase: "idle",
                text: newText,
                input: "",
                correct: 0,
                errors: 0,
                wpm: 0,
                accuracy: 100,
                startTime: 0
            };
            
            if (this.typingGame.interval) clearInterval(this.typingGame.interval);
            
            this.$nextTick(() => {
                if (this.$refs.typingInput) (this.$refs.typingInput as HTMLInputElement).focus();
            });
        },

        renderTypingDisplay(this: AppState) {
            let html = '';
            const text = this.typingGame.text;
            const input = this.typingGame.input;
            
            for (let i = 0; i < text.length; i++) {
                let statusClass = 'pending';
                if (i < input.length) {
                    statusClass = input[i] === text[i] ? 'correct' : 'incorrect';
                } else if (i === input.length && this.typingGame.phase !== 'done') {
                    statusClass = 'current';
                }
                
                const char = text[i] === ' ' ? '&nbsp;' : text[i];
                html += `<span class="${statusClass} transition-colors duration-100">${char}</span>`;
            }
            return html;
        },

        handleTypingInput(this: AppState) {
            const tg = this.typingGame;
            
            if (tg.input.length > tg.text.length) {
                tg.input = tg.input.substring(0, tg.text.length);
                return;
            }

            if (tg.phase === 'idle' && tg.input.length > 0) {
                tg.phase = 'playing';
                tg.startTime = performance.now();
                
                tg.interval = window.setInterval(() => {
                    if (tg.phase === 'playing') this.calculateTypingStats();
                }, 500);
            }

            let currentCorrect = 0;
            let currentErrors = 0;
            for (let i = 0; i < tg.input.length; i++) {
                if (tg.input[i] === tg.text[i]) currentCorrect++;
                else currentErrors++;
            }
            
            tg.correct = currentCorrect;
            tg.errors = currentErrors;
            
            if (tg.input.length > 0) {
                tg.accuracy = Math.round((tg.correct / tg.input.length) * 100);
            } else {
                tg.accuracy = 100;
            }

            if (tg.input.length === tg.text.length) {
                tg.phase = 'done';
                if (tg.interval) clearInterval(tg.interval);
                this.calculateTypingStats();
                
                if (tg.wpm > tg.bestWpm) {
                    tg.bestWpm = tg.wpm;
                }
                this.totalGamesPlayed++;
                this.saveStats();
                this.showToast("Typing test completed!");
            }
        },

        calculateTypingStats(this: AppState) {
            const tg = this.typingGame;
            const timeElapsedMs = performance.now() - tg.startTime;
            const timeElapsedMins = timeElapsedMs / 1000 / 60;
            
            if (timeElapsedMins > 0) {
                tg.wpm = Math.round((tg.correct / 5) / timeElapsedMins);
            }
        }
    }));
});

Alpine.start()
