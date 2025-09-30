/**
 * Base class for all in-game entities (player, crops, obstacles, power-ups).
 * Provides position, size, and a dead flag for removal logic.
 */
export default class Entity {
    /**
     * Create an entity.
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} w - Width of entity
     * @param {number} h - Height of entity
     */
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
    /**
     * Update entity logic. Default is empty.
     * @param {number} dt - Delta time since last frame
     * @param {Game} game - Reference to game instance
     */
    update(dt, game) { }
    /**
     * Draw entity. Default is empty.
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    draw(ctx) { }
}
