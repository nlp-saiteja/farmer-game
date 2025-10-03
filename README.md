# 🌾 Farmer Game — Race Against the Robot 🤖

A modular ES6 canvas game where you play as a farmer racing against an AI competitor to collect crops.  
The game features multiple crop types, power-ups, scarecrow obstacles, a configurable difficulty system, and sprite-based animations.

---

## Live Demo

[Play Farmer Game here!](https://nlp-saiteja.github.io/farmer-game/)


URL: https://nlp-saiteja.github.io/farmer-game/

No setup needed — just click the link to play directly in your browser.

---

## How to Run Locally

Since the project uses ES6 modules, it must be run from a local server:

**Option 1 — Python (any OS):**

```bash
python3 -m http.server 8000
```

Then open: [http://localhost:8000/index.html](http://localhost:8000/index.html)

**Option 2 — VS Code Live Server:**

- Install the **Live Server** extension.
- Right-click `index.html` → **Open with Live Server**.

The game will run in your browser without extra dependencies.

---

## New Features Implemented

### Core Features

- **Different crop types with point values:**
  - 🌾 Wheat = 1 point
  - 🎃 Pumpkin = 3 points
  - 🍎 Golden Apple = 5 points
- **Difficulty curve:** Crop spawn rates increase and time limits shrink as levels progress.
- **Power-ups:** Collect ⚡ lightning bolts for a speed boost that lasts 5 seconds.
- **Obstacles:** Brown scarecrows block your path, forcing careful navigation.

### Graduate Features

- **AI Competitor Farmer:**  
  A robot farmer moves intelligently across the field, prioritizing high-value crops and competing to reach the goal first. If the AI wins, the game ends with a “Robot Wins” message.

- **Level System (3 levels):**  
  Each level increases difficulty with shorter timers, faster crop spawns, and more scarecrows.

- **Sprite Animation:**  
  The player farmer uses a 4×4 sprite sheet to animate walking in all directions. A fallback graphical farmer is drawn if the sprite image is missing.

- **Configurable Difficulty (config.json):**  
  Level goals, timers, spawn rates, and obstacles are loaded from an external JSON file, making it easy to adjust or expand the game without changing the code.

---

## Game Controls

- **Arrow keys (↑ ↓ ← →)** → Move farmer
- **P** → Pause / Resume
- Collect crops faster than the AI to win each level!

---

## File Structure

```
/ (project root)
│─ index.html          # HTML layout and UI
│─ style.css           # Styling for UI and instructions
│─ config.json         # Level configurations (goals, timers, spawn rates)
│─ /sprites
│   └─ farmer.png      # Sprite sheet for farmer (4x4)
│─ /js
    │─ main.js         # Bootstraps the game
    │─ Game.js         # Main game loop and state machine
    │─ Farmer.js       # Player farmer with sprite animation
    │─ CompetitorFarmer.js # AI competitor farmer logic
    │─ Crop.js         # Crop entities (wheat, pumpkin, apple)
    │─ PowerUp.js      # Power-up (speed boost)
    │─ Scarecrow.js    # Scarecrow obstacle
    │─ Input.js        # Keyboard input (pause, movement)
    └─ utils.js        # Constants and helper functions
```

---

## Arrow Functions, `this`, and `.bind(this)`

- **Arrow Functions (lexical `this` binding):**

  - `Game.js`:
    - RequestAnimationFrame loop (`this.tick = (ts) => {...}`) keeps `this` bound to the `Game` instance.
    - UI button event listeners (`() => this.start()`, `() => this.reset()`).
    - Array methods (`this.crops.filter(c => ...)`) safely access game state.

- **`.bind(this)` (for stable references):**

  - `Input.js`:
    - `this.onKeyDown = this.onKeyDown.bind(this)`
    - `this.onKeyUp = this.onKeyUp.bind(this)`  
      Used so `removeEventListener` works correctly and `this` refers to the `Input` instance instead of `window`.

- **`this` in Different Contexts:**
  - **RAF loop (Game.js):** Arrow functions preserve the `this` context as the Game object.
  - **Event listeners (Input.js):** `.bind(this)` ensures `this` points to the Input manager.
  - **Method references:** `bind(this)` ensures methods run with the correct context when passed as callbacks.

---

## Game Flow

1. Press **Start** → Level 1 begins.
2. Collect crops faster than the AI to reach the goal score.
3. If you win → advance to the next level with higher difficulty.
4. If the AI wins first → Game Over.
5. Complete all 3 levels → 🎉 Victory!

---

## Future Improvements

- Add smarter AI using pathfinding (A\* algorithm) for more realistic behavior.
- Introduce more crop types and seasonal themes.
- Save high scores to `localStorage` for persistent leaderboards.
- Add background music and sound effects for better immersion.

---
