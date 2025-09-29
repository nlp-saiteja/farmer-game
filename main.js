// =========================
// Farmer Harvest — no libs
// =========================

// ---- Config & helpers ----
const WIDTH = 900, HEIGHT = 540;
const TILE = 30;           // for a subtle grid
const GAME_LEN = 60;       // seconds
const GOAL = 15;           // crops to win

const State = Object.freeze({ MENU: "MENU", PLAYING: "PLAYING", PAUSED: "PAUSED", GAME_OVER: "GAME_OVER", WIN: "WIN" });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ---- Base Entity ----
class Entity {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
    update(dt, game) { }
    draw(ctx) { }
}

// ---- Farmer (player) ----
class Farmer extends Entity {
    constructor(x, y) {
        super(x, y, 34, 34);
        this.speed = 260;
        this.vx = 0; this.vy = 0;
        this.color = "#8b5a2b";
    }
    handleInput(input) {
        const L = input.keys.has("ArrowLeft"), R = input.keys.has("ArrowRight");
        const U = input.keys.has("ArrowUp"), D = input.keys.has("ArrowDown");
        this.vx = (R - L) * this.speed;
        this.vy = (D - U) * this.speed;
    }
    update(dt, game) {
        // try movement
        const oldX = this.x, oldY = this.y;
        this.x = clamp(this.x + this.vx * dt, 0, WIDTH - this.w);
        this.y = clamp(this.y + this.vy * dt, 0, HEIGHT - this.h);
        // block through obstacles
        const hitObs = game.obstacles.some(o => aabb(this, o));
        if (hitObs) { this.x = oldX; this.y = oldY; }
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "#c28e0e";
        ctx.fillRect(this.x + 4, this.y - 6, this.w - 8, 8);        // hat brim
        ctx.fillRect(this.x + 10, this.y - 18, this.w - 20, 12);    // hat top
    }
}

// ---- Crop (collectible) ----
class Crop extends Entity {
    constructor(x, y, type = null) {
        // temporarily pass values, will override below
        super(x, y, 20, 26);

        // crop types with visuals + point values
        const types = [
            { name: "wheat", color: "#d9a441", points: 1, w: 12, h: 28 },
            { name: "pumpkin", color: "#ff8c00", points: 3, w: 28, h: 28 },
            { name: "goldenApple", color: "#ffd700", points: 5, w: 24, h: 24 }
        ];

        const chosen = type || types[Math.floor(Math.random() * types.length)];
        this.type = chosen.name;
        this.color = chosen.color;
        this.points = chosen.points;

        // override width/height per type
        this.w = chosen.w;
        this.h = chosen.h;

        this.sway = Math.random() * Math.PI * 2; // animation effect
    }
    update(dt, game) {
        this.sway += dt * 2;
    }
    draw(ctx) {
        const { x, y, w, h } = this;

        if (this.type === "wheat") {
            // stem
            ctx.strokeStyle = "#2f7d32"; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + h);
            ctx.lineTo(x + w / 2, y + 4);
            ctx.stroke();

            // grain head (yellow ovals)
            ctx.fillStyle = "#d9a441";
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(x + w / 2, y + 4 + i * 4, 5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (this.type === "pumpkin") {
            // pumpkin body
            ctx.fillStyle = "#ff8c00"; 
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
            ctx.fill();

            // ridges
            ctx.strokeStyle = "#cc7000";
            ctx.beginPath();
            ctx.moveTo(x + w / 2 - 5, y + h / 2 - 8);
            ctx.lineTo(x + w / 2 - 5, y + h / 2 + 8);
            ctx.moveTo(x + w / 2 + 5, y + h / 2 - 8);
            ctx.lineTo(x + w / 2 + 5, y + h / 2 + 8);
            ctx.stroke();

            // stem
            ctx.fillStyle = "#2f7d32";
            ctx.fillRect(x + w / 2 - 2, y + h / 2 - (h / 2) - 2, 4, 6);

        } else if (this.type === "goldenApple") {
            // apple body
            ctx.fillStyle = "#ffd700"; 
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#e6c200";
            ctx.stroke();

            // leaf
            ctx.fillStyle = "#2f7d32";
            ctx.beginPath();
            ctx.ellipse(x + w / 2 + 4, y + h / 2 - (h / 2), 5, 3, -0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ---- PowerUp (temporary boost) ----
class PowerUp extends Entity {
    constructor(x, y, effect = "speed") {
        super(x, y, 40, 40);
        this.effect = effect;
        this.active = false;
    }

    draw(ctx) {
        const { x, y, w, h } = this;
        if (this.effect === "speed") {
            // draw lightning bolt ⚡
            ctx.fillStyle = "#00c3ff";
            ctx.beginPath();
            ctx.moveTo(x + w * 0.4, y);
            ctx.lineTo(x + w * 0.6, y + h * 0.4);
            ctx.lineTo(x + w * 0.3, y + h * 0.4);
            ctx.lineTo(x + w * 0.6, y + h);
            ctx.lineTo(x + w * 0.4, y + h * 0.6);
            ctx.lineTo(x + w * 0.7, y + h * 0.6);
            ctx.closePath();
            ctx.fill();
        }
    }
}



// ---- Scarecrow (obstacle) ----
class Scarecrow extends Entity {
    constructor(x, y) { super(x, y, 26, 46); }
    draw(ctx) {
        const { x, y, w, h } = this;
        ctx.fillStyle = "#9b7653";
        ctx.fillRect(x + w / 2 - 3, y, 6, h); // pole
        ctx.fillStyle = "#c28e0e";
        ctx.beginPath(); ctx.arc(x + w / 2, y + 10, 10, 0, Math.PI * 2); ctx.fill(); // head
        ctx.strokeStyle = "#6b4f2a"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + w, y + 18); ctx.stroke(); // arms
    }
}

// ---- Input (uses .bind to control `this`) ----
class Input {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        // (b) Here we MUST use .bind(this), because addEventListener
        // passes the callback as a plain function. Without bind, `this`
        // would default to window, not our Input instance.
        this._onKeyDown = this.onKeyDown.bind(this); // bind #1
        this._onKeyUp = this.onKeyUp.bind(this);   // bind #2
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
    }
    onKeyDown(e) {
        if (e.key === "p" || e.key === "P") this.game.togglePause();
        this.keys.add(e.key);
    }
    onKeyUp(e) { this.keys.delete(e.key); }
    dispose() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }
}

// ---- Game ----
class Game {
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

    onResize() {
        // fixed canvas size for simplicity; handle DPR here if desired
    }

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

    togglePause() {
        if (this.state === State.PLAYING) {
            this.state = State.PAUSED;
            if (this.ui.status) this.ui.status.textContent = "Paused";
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    syncUI() {
        if (this.ui.score) this.ui.score.textContent = String(this.score);
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
    }

    spawnCrop() {
        const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
        const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
        this.crops.push(new Crop(gx, gy));
    }

    activatePowerUp(effect) {
        if (effect === "speed") {
            this.player.speed *= 2;        // double speed
            this.powerUpActive = true;
            this.powerUpTimer = 5;         // lasts 5 seconds
            if (this.ui.status) this.ui.status.textContent = "Speed Boost!";
        }
    }
    

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

    dispose() {
        this.input.dispose();
        window.removeEventListener("resize", this._onResize);
    }
}

// ---- Boot ----
const canvas = document.getElementById("game");
const game = new Game(canvas);
// Click "Start" in the UI to begin.
