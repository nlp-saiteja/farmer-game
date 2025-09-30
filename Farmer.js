import Entity from "./Entity.js";
import { WIDTH, HEIGHT, clamp, aabb } from "./utils.js";

/**
 * Represents the player-controlled farmer.
 * Moves using keyboard input, collects crops, and collides with obstacles.
 * 
 * @extends Entity
 */
export default class Farmer extends Entity {
    /**
     * Create a farmer instance.
     * @param {number} x - Starting X coordinate
     * @param {number} y - Starting Y coordinate
     */
    constructor(x, y) {
        super(x, y, 34, 34);
        this.speed = 260;
        this.vx = 0; this.vy = 0;
        this.color = "#8b5a2b";
    }
    /**
     * Handle arrow key input and update velocity.
     * @param {Input} input - Current input handler
     */
    handleInput(input) {
        const L = input.keys.has("ArrowLeft"), R = input.keys.has("ArrowRight");
        const U = input.keys.has("ArrowUp"), D = input.keys.has("ArrowDown");
        this.vx = (R - L) * this.speed;
        this.vy = (D - U) * this.speed;
    }
    /**
     * Update farmer position and check obstacle collisions.
     * @param {number} dt - Delta time since last frame
     * @param {Game} game - Game instance for collision detection
     */
    update(dt, game) {
        // try movement
        const oldX = this.x, oldY = this.y;
        this.x = clamp(this.x + this.vx * dt, 0, WIDTH - this.w);
        this.y = clamp(this.y + this.vy * dt, 0, HEIGHT - this.h);
        // block through obstacles
        const hitObs = game.obstacles.some(o => aabb(this, o));
        if (hitObs) { this.x = oldX; this.y = oldY; }
    }
    /**
     * Render the farmer and hat on the canvas.
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "#c28e0e";
        ctx.fillRect(this.x + 4, this.y - 6, this.w - 8, 8);        // hat brim
        ctx.fillRect(this.x + 10, this.y - 18, this.w - 20, 12);    // hat top
    }
}
