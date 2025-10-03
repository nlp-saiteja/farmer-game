import Farmer from "./Farmer.js";
import Crop from "./Crop.js";
import PowerUp from "./PowerUp.js";
import Scarecrow from "./Scarecrow.js";
import Input from "./Input.js";
import { WIDTH, HEIGHT, TILE, GAME_LEN, GOAL, State, clamp, aabb } from "./utils.js";
import CompetitorFarmer from "./CompetitorFarmer.js";

/**
 * Main game controller.
 * Handles game state, entity management, updates, rendering, and UI.
 */
export default class Game {
    /**
     * Create a new game instance.
     * @param {HTMLCanvasElement} canvas - Canvas element for rendering
     */
    constructor(canvas) {
        if (!canvas) {
            console.error("Canvas #game not found. Check index.html IDs.");
            return;
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.state = State.MENU;

        // world
        this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
        this.competitor = new CompetitorFarmer(100, 100); // Initialize AI
        this.crops = [];
        this.obstacles = [];

        // power-ups
        this.powerUps = [];
        this.powerUpActive = false;
        this.powerUpTimer = 0;

        // timing
        this.lastTime = 0;
        this.timeLeft = GAME_LEN;
        this.spawnEvery = 0.8;
        this._accumSpawn = 0;

        // score & goal
        this.score = 0;
        this.goal = GOAL;

        // --- G1: Add Level System (3 levels, cumulative goals) ---
        this.level = 1;
        this.maxLevels = 3;
        this.levels = [
            null, // index 0 unused
            { goal: 15, time: 60, spawnBase: 0.8, extraScarecrows: 0 },
            { goal: 25, time: 50, spawnBase: 0.7, extraScarecrows: 2 },
            { goal: 35, time: 45, spawnBase: 0.6, extraScarecrows: 3 }
        ];
        
        // Try to load config, but use defaults if not available
        fetch("config.json")
            .then(res => res.json())
            .then(data => {
                this.levels = [null, ...data.levels]; // index 0 unused
                this.applyLevelSettings();
            })
            .catch(err => {
                console.log("Using default level configuration");
                this.applyLevelSettings();
            });
        // ----------------------------------------------------------

        // input & resize
        this.input = new Input(this);
        this._onResize = this.onResize.bind(this);
        window.addEventListener("resize", this._onResize);

        // UI
        // helper to fetch DOM elements
        // Arrow function here is just shorthand; it doesn't use `this`,
        // but arrow functions inherit `this` lexically (from Game constructor).
        const get = id => document.getElementById(id) || console.error(`#${id} not found`);
        this.ui = {
            score: get("score"),
            compScore: get("compScore"), // Add AI score element
            time: get("time"),
            goal: get("goal"),
            status: get("status"),
            start: get("btnStart"),
            reset: get("btnReset"),
            level: get("level"), // Add level indicator
        };
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
        if (this.ui.level) this.ui.level.textContent = String(this.level);
        // (a) Event listeners as arrow functions:
        // Arrow functions inherit `this` from the Game instance,
        // so this.start() and this.reset() work correctly.
        // If we used a normal function, `this` would point 
        // to the button element, not the Game object.
        if (this.ui.start) this.ui.start.addEventListener("click", () => this.start()); // arrow keeps `this`
        if (this.ui.reset) this.ui.reset.addEventListener("click", () => this.reset());

        // RAF loop as arrow function → lexical `this`

        // (c) requestAnimationFrame loop:
        // Using an arrow function keeps `this` bound to the Game object.
        // A normal function would lose context (`this` → window).
        this.tick = (ts) => {
            const dt = Math.min((ts - this.lastTime) / 1000, 0.033); // ~30ms cap
            this.lastTime = ts;
            this.update(dt);
            this.render();
            requestAnimationFrame(this.tick);
        };
    }

    /** Handle window resize (currently unused). */
    onResize() {
        // fixed canvas size for simplicity; handle DPR here if desired
    }

    /** Start the game loop and set state to PLAYING. */
    start() {
        if (this.state === State.MENU || this.state === State.GAME_OVER || this.state === State.WIN) {
            this.reset();
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
            // Focus the canvas without preventing scrolling
            this.canvas.focus();
            requestAnimationFrame(this.tick);
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    /** Reset the game to menu state with fresh entities. */
    reset() {
        this.state = State.MENU;
        this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
        this.competitor = new CompetitorFarmer(100, 100); // Reset AI position
        this.competitor.score = 0; // Reset AI score
        this.crops.length = 0;
        this.obstacles.length = 0;
        this.powerUps.length = 0;
        this.score = 0;
        this.powerUpActive = false;
        this.powerUpTimer = 0;

        // --- G1: Reset to Level 1 ---
        this.level = 1;
        this.applyLevelSettings();
        // ----------------------------

        if (this.ui.status) this.ui.status.textContent = "Ready to Play!";
    }

    /** Toggle pause state on/off. */
    togglePause() {
        if (this.state === State.PLAYING) {
            this.state = State.PAUSED;
            if (this.ui.status) this.ui.status.textContent = "Paused";
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    /** Sync game values (score, time, goal) to UI elements. */
    syncUI() {
        if (this.ui.score) this.ui.score.textContent = String(this.score);
        if (this.ui.compScore) this.ui.compScore.textContent = String(this.competitor.score);
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
        if (this.ui.level) this.ui.level.textContent = String(this.level);
    }

    /** Spawn a new crop at a random position. */
    spawnCrop() {
        // Avoid spawning on obstacles
        let attempts = 0;
        let x, y;
        do {
            x = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
            y = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
            attempts++;
        } while (attempts < 10 && this.obstacles.some(o => 
            x < o.x + o.w && x + 28 > o.x && y < o.y + o.h && y + 28 > o.y));
        
        this.crops.push(new Crop(x, y));
    }

    /**
     * Activate a power-up effect (e.g., speed boost).
     * @param {string} effect - Type of power-up effect
     */
    activatePowerUp(effect) {
        if (effect === "speed") {
            this.player.speed *= 2;        // double speed
            this.powerUpActive = true;
            this.powerUpTimer = 5;         // lasts 5 seconds
            if (this.ui.status) this.ui.status.textContent = "Speed Boost!";
        }
    }

    // --- G1: Apply settings for the current level ---
    applyLevelSettings() {
        if (!this.levels[this.level]) return; // Safety check
        
        const cfg = this.levels[this.level];
        this.goal = cfg.goal;
        this.timeLeft = cfg.time;
        this.spawnBase = cfg.spawnBase;
        this._accumSpawn = 0;
        this.lastTime = performance.now();

        // reset obstacles
        this.obstacles.length = 0;
        this.obstacles.push(new Scarecrow(200, 220), new Scarecrow(650, 160));
        
        // Add extra scarecrows based on level
        if (cfg.extraScarecrows >= 1) {
            this.obstacles.push(new Scarecrow(450, 350));
        }
        if (cfg.extraScarecrows >= 2) {
            this.obstacles.push(new Scarecrow(100, 150));
        }
        if (cfg.extraScarecrows >= 3) {
            this.obstacles.push(new Scarecrow(750, 400));
        }

        // --- Update legend dynamically ---
        const goalLegend = document.getElementById("goalLegend");
        const timeLegend = document.getElementById("timeLegend");
        if (goalLegend) goalLegend.textContent = String(this.goal);
        if (timeLegend) timeLegend.textContent = String(cfg.time);

        this.syncUI();
    }

    // --- G1: Start the next level ---
    startNextLevel() {
        this.level++;
        if (this.level > this.maxLevels) {
            this.state = State.WIN;
            if (this.ui.status) this.ui.status.textContent = "🎉 Final Victory! All Levels Complete!";
            return;
        }
        
        // Reset scores for each new level
        this.score = 0;
        this.competitor.score = 0;
        
        // Reset positions but keep the game going
        this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
        this.competitor.x = 100;
        this.competitor.y = 100;
        this.crops.length = 0;
        this.powerUps.length = 0;
        this.powerUpActive = false;
        this.powerUpTimer = 0;
        
        this.applyLevelSettings();
        this.state = State.PLAYING;
        if (this.ui.status) this.ui.status.textContent = `Level ${this.level} - Get Ready!`;
        
        // Update UI to show reset scores
        this.syncUI();
    }

    /**
     * Update all entities and game state.
     * @param {number} dt - Delta time since last frame
     */
    update(dt) {
        if (this.state !== State.PLAYING) return;

        // countdown
        this.timeLeft = clamp(this.timeLeft - dt, 0, GAME_LEN);
        
        // Check if AI wins immediately when reaching goal
        if (this.competitor.score >= this.goal) {
            this.state = State.GAME_OVER;
            if (this.ui.status) this.ui.status.textContent = "🤖 Robot Farmer Wins! Try Again";
            this.syncUI();
            return;
        }
        
        // Check if player wins immediately when reaching goal
        if (this.score >= this.goal) {
            if (this.level < this.maxLevels) {
                this.startNextLevel();
                return;
            } else {
                this.state = State.WIN;
                if (this.ui.status) this.ui.status.textContent = "🎉 You Win! All Levels Complete!";
                this.syncUI();
                return;
            }
        }
        
        // Check time up conditions
        if (this.timeLeft <= 0) {
            this.state = State.GAME_OVER;
            if (this.ui.status) this.ui.status.textContent = "⏱️ Time's up! Nobody reached the goal";
            this.syncUI();
            return;
        }

        // gradually increase difficulty (spawn crops faster over time)
        // progress goes from 0 → 1 (start → end of game)
        const progress = 1 - (this.timeLeft / this.levels[this.level].time);
        this.spawnEvery = (this.spawnBase ?? 0.8) - (0.3 * progress); // --- G1: use per-level base

        // player
        this.player.handleInput(this.input);
        this.player.update(dt, this);
        
        // AI competitor
        this.competitor.update(dt, this);

        // spawn crops
        this._accumSpawn += dt;
        while (this._accumSpawn >= this.spawnEvery) {
            this._accumSpawn -= this.spawnEvery;
            this.spawnCrop();

            // occasionally spawn a power-up (5% chance each spawn cycle)
            if (Math.random() < 0.05) {
                const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
                const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
                this.powerUps.push(new PowerUp(gx, gy, "speed"));
            }
        }

        // collect crops for player
        // (a) Array methods use arrow functions:
        // They lexically inherit `this`, so game state can be accessed safely.
        const collected = this.crops.filter(c => aabb(this.player, c));     // arrow #1
        if (collected.length) {
            collected.forEach(c => c.dead = true);                             // arrow #2
            collected.forEach(c => this.score += c.points);
            if (this.ui.score) this.ui.score.textContent = String(this.score);
        }

        // collect power-ups
        const collectedPU = this.powerUps.filter(p => aabb(this.player, p));
        if (collectedPU.length) {
            collectedPU.forEach(p => p.dead = true);
            this.activatePowerUp("speed");  // apply effect
        }

        this.powerUps = this.powerUps.filter(p => !p.dead);
        this.crops = this.crops.filter(c => !c.dead);                        // arrow #3
        this.crops.forEach(c => c.update(dt, this));                         // arrow #4

        // power-up timer
        if (this.powerUpActive) {
            this.powerUpTimer -= dt;
            if (this.powerUpTimer <= 0) {
                this.player.speed /= 2;    // reset speed
                this.powerUpActive = false;
                if (this.ui.status) this.ui.status.textContent = `Level ${this.level} - Playing`;
            }
        }

        // timer UI
        this.syncUI();
    }

    /**
     * Render all entities and UI overlays to canvas.
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // field background (grid) with gradient
        const grd = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        grd.addColorStop(0, "#f0f9e8");
        grd.addColorStop(1, "#ccebc5");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        
        // Grid lines
        ctx.strokeStyle = "rgba(180, 200, 160, 0.3)";
        ctx.lineWidth = 1;
        for (let y = TILE; y < HEIGHT; y += TILE) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
        }
        for (let x = TILE; x < WIDTH; x += TILE) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
        }

        // crops, obstacles, farmer
        // (a) Arrow functions in render loops: 
        // No new `this`, they inherit from Game instance context.
        this.crops.forEach(c => c.draw(ctx));                                 // arrow #5
        this.obstacles.forEach(o => o.draw(ctx));                             // arrow #6
        this.powerUps.forEach(p => p.draw(ctx));
        this.player.draw(ctx);
        this.competitor.draw(ctx); // Draw AI competitor

        // state labels
        ctx.fillStyle = "#333";
        ctx.font = "bold 18px system-ui, sans-serif";
        if (this.state === State.MENU) {
            ctx.fillText("Press Start to play - Race against the Blue Robot!", 20, 30);
        } else if (this.state === State.PAUSED) {
            ctx.fillText("PAUSED - Press P to resume", 20, 30);
        } else if (this.state === State.GAME_OVER) {
            ctx.font = "bold 24px system-ui, sans-serif";
            ctx.fillStyle = "#ff0000";
            ctx.fillText("GAME OVER! Press Reset to try again", WIDTH/2 - 200, HEIGHT/2);
        } else if (this.state === State.WIN) {
            ctx.font = "bold 24px system-ui, sans-serif";
            ctx.fillStyle = "#00aa00";
            ctx.fillText("🎉 VICTORY! All 3 Levels Complete! 🎉", WIDTH/2 - 200, HEIGHT/2);
        } else {
            // --- G1: Show level indicator during play ---
            ctx.fillText(`Level ${this.level}/${this.maxLevels}`, WIDTH - 120, 30);
        }

        // Draw real-time scores on canvas for better visibility during gameplay
        if (this.state === State.PLAYING) {
            // Player score (green)
            ctx.font = "bold 20px sans-serif";
            ctx.fillStyle = "#2a5a2a";
            ctx.fillText(`You: ${this.score}/${this.goal}`, 20, HEIGHT - 20);
            
            // AI score (blue/red)
            ctx.fillStyle = "#4a5c9b";
            ctx.fillText(`Robot: ${this.competitor.score}/${this.goal}`, 20, HEIGHT - 50);
            
            // Time remaining with warning color
            const timeColor = this.timeLeft < 10 ? "#ff0000" : "#333333";
            ctx.fillStyle = timeColor;
            ctx.fillText(`Time: ${Math.ceil(this.timeLeft)}s`, WIDTH - 120, HEIGHT - 20);
        }
    }

    /** Cleanup event listeners and input manager. */
    dispose() {
        this.input.dispose();
        window.removeEventListener("resize", this._onResize);
    }
}