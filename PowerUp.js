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
        super(x, y, 40, 40);
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
