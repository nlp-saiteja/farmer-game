import Entity from "./Entity.js";

/**
 * Represents a power-up item that temporarily grants special abilities.
 * Current effect: Speed boost (⚡).
 * 
 * @extends Entity
 */
export default class PowerUp extends Entity {
    /**
     * Create a power-up.
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} [effect="speed"] - Type of effect (e.g., "speed")
     */

    constructor(x, y, effect = "speed") {
        super(x, y, 25, 25);
        this.effect = effect;
        this.active = false;
    }
    
    /**
     * Draw the power-up symbol (lightning bolt).
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    draw(ctx) {
        const { x, y, w, h } = this;
        if (this.effect === "speed") {
            // --- Thunderbolt Shape ⚡ ---
            ctx.fillStyle = "#FFD700"; // bright yellow
            ctx.beginPath();
            ctx.moveTo(x + w * 0.3, y);              // top
            ctx.lineTo(x + w * 0.6, y + h * 0.4);    // diagonal down-right
            ctx.lineTo(x + w * 0.4, y + h * 0.4);    // short step left
            ctx.lineTo(x + w * 0.7, y + h);          // bottom point
            ctx.lineTo(x + w * 0.4, y + h * 0.6);    // back up-left
            ctx.lineTo(x + w * 0.6, y + h * 0.6);    // short step right
            ctx.closePath();
            ctx.fill();
    
            // outline for contrast
            ctx.strokeStyle = "#DAA520";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}
