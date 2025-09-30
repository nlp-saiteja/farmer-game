/**
 * Handles keyboard input for the game.
 * Uses event listeners to track pressed keys.
 */

export default class Input {
    /**
     * Create an input manager.
     * @param {Game} game - Game instance
     */
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

    /**
     * Handle keydown events (including pause toggle).
     * @param {KeyboardEvent} e - Keyboard event
     */
    onKeyDown(e) {
        if (e.key === "p" || e.key === "P") this.game.togglePause();
        this.keys.add(e.key);
    }

    /**
     * Handle keyup events.
     * @param {KeyboardEvent} e - Keyboard event
     */
    onKeyUp(e) { this.keys.delete(e.key); }

    /**
     * Remove input event listeners.
     */
    dispose() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }
}