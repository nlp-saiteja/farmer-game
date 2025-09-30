import Farmer from "./Farmer.js";
import Crop from "./Crop.js";
import PowerUp from "./PowerUp.js";
import Scarecrow from "./Scarecrow.js";
import Input from "./Input.js";
import { WIDTH, HEIGHT, TILE, GAME_LEN, GOAL, State, clamp, aabb } from "./utils.js";


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
            time: get("time"),
            goal: get("goal"),
            status: get("status"),
            start: get("btnStart"),
            reset: get("btnReset"),
        };
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
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
        this.crops.length = 0;
        this.obstacles.length = 0;
        this.score = 0;
        this.timeLeft = GAME_LEN;
        this._accumSpawn = 0;
        this.lastTime = performance.now();
        // place a couple of scarecrows
        this.obstacles.push(new Scarecrow(200, 220), new Scarecrow(650, 160));
        this.syncUI();
        if (this.ui.status) this.ui.status.textContent = "Menu";
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
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
    }
    /** Spawn a new crop at a random position. */
    spawnCrop() {
        const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
        const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
        this.crops.push(new Crop(gx, gy));
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
    
    /**
     * Update all entities and game state.
     * @param {number} dt - Delta time since last frame
     */
    update(dt) {
        if (this.state !== State.PLAYING) return;

        // countdown
        this.timeLeft = clamp(this.timeLeft - dt, 0, GAME_LEN);
        if (this.timeLeft <= 0) {
            this.state = (this.score >= this.goal) ? State.WIN : State.GAME_OVER;
            if (this.ui.status) this.ui.status.textContent = (this.state === State.WIN) ? "You Win!" : "Game Over";
            this.syncUI();
            return;
        }
        // gradually increase difficulty (spawn crops faster over time)
        // progress goes from 0 → 1 (start → end of game)
        const progress = 1 - (this.timeLeft / GAME_LEN);
        this.spawnEvery = 0.8 - (0.5 * progress); // 0.8s → 0.3s

        // player
        this.player.handleInput(this.input);
        this.player.update(dt, this);

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

        

        // collect crops
        // (a) Array methods use arrow functions:
        // They lexically inherit `this`, so game state can be accessed safely.
        const collected = this.crops.filter(c => aabb(this.player, c));     // arrow #1
        if (collected.length) {
            collected.forEach(c => c.dead = true);                             // arrow #2
            collected.forEach(c => this.score += c.points);
            if (this.ui.score) this.ui.score.textContent = String(this.score);
            if (this.score >= this.goal) {
                this.state = State.WIN;
                if (this.ui.status) this.ui.status.textContent = "You Win!";
            }
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
                if (this.ui.status) this.ui.status.textContent = "Playing…";
            }
        }

        // timer UI
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
    }

    /**
     * Render all entities and UI overlays to canvas.
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // field background (grid)
        ctx.fillStyle = "#dff0d5";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.strokeStyle = "#c7e0bd";
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
        this.powerUps.forEach(p => p.draw(ctx));   // NEW
        this.player.draw(ctx);

        // state labels
        ctx.fillStyle = "#333";
        ctx.font = "16px system-ui, sans-serif";
        if (this.state === State.MENU) {
            ctx.fillText("Press Start to play", 20, 28);
        } else if (this.state === State.PAUSED) {
            ctx.fillText("Paused (press P to resume)", 20, 28);
        } else if (this.state === State.GAME_OVER) {
            ctx.fillText("Time up! Press Reset to return to Menu", 20, 28);
        } else if (this.state === State.WIN) {
            ctx.fillText("Harvest complete! Press Reset for another round", 20, 28);
        }
    }
    /** Cleanup event listeners and input manager. */
    dispose() {
        this.input.dispose();
        window.removeEventListener("resize", this._onResize);
    }
}