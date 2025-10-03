import Entity from "./Entity.js";


/**
 * Represents collectible crops with different types, visuals, and point values.
 * Types include wheat, pumpkin, and golden apple.
 * 
 * @extends Entity
 */
export default class Crop extends Entity {
    /**
     * Create a crop.
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} [type=null] - Crop type definition (name, color, points, size)
     */
    constructor(x, y, type = null) {
        // temporarily pass values, will override below
        super(x, y, 20, 26);

        // crop types with visuals + point values
        const types = [
            { name: "wheat", color: "#d9a441", points: 1, w: 10, h: 20 },
            { name: "pumpkin", color: "#ff8c00", points: 3, w: 12, h: 16 },
            { name: "goldenApple", color: "#ffd700", points: 5, w: 13, h: 15 }
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
    
    /**
     * Animate the crop (sway effect).
     * @param {number} dt - Delta time since last frame
     * @param {Game} game - Game instance
     */
    update(dt, game) {
        this.sway += dt * 2;
    }

    /**
     * Draw crop visuals depending on type.
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
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
            ctx.moveTo(x + w / 2 - 3, y + h / 2 - 5);
            ctx.lineTo(x + w / 2 - 3, y + h / 2 + 5);
            ctx.moveTo(x + w / 2 + 3, y + h / 2 - 5);
            ctx.lineTo(x + w / 2 + 3, y + h / 2 + 5);
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