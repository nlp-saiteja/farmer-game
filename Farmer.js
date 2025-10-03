import Entity from "./Entity.js";
import { WIDTH, HEIGHT, clamp, aabb } from "./utils.js";

/**
 * Represents the player-controlled farmer.
 * Uses a sprite sheet for walking animation in four directions.
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
        super(x, y,90 ,90); 
        this.speed = 120;
        this.vx = 0;
        this.vy = 0;
        this.color = "#8b5a2b";

        // Load sprite sheet (4x4 grid: rows=direction, cols=animation frames)
        this.sprite = new Image();
        this.sprite.src = "sprites/farmer.png";
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };
        this.sprite.onerror = () => { 
            console.log("Sprite not found, using fallback graphics");
            this.spriteLoaded = false; 
        };

        // Animation state
        this.frameX = 0;          // current column in sprite sheet
        this.frameY = 0;          // current row (0=down, 1=left, 2=right, 3=up)
        this.frameTimer = 0;      // timer for frame switching
        this.frameInterval = 0.15; // seconds per frame
        this.direction = "down";  // For fallback rendering
    }

    /**
     * Handle arrow key input and update velocity + facing direction.
     * @param {Input} input - Current input handler
     */
    handleInput(input) {
        const L = input.keys.has("ArrowLeft"), 
              R = input.keys.has("ArrowRight");
        const U = input.keys.has("ArrowUp"), 
              D = input.keys.has("ArrowDown");

        this.vx = (R - L) * this.speed;
        this.vy = (D - U) * this.speed;

        // Update sprite direction row
        if (D) { this.frameY = 0; this.direction = "down"; }
        if (U) { this.frameY = 1; this.direction = "up"; }
        if (L) { this.frameY = 2; this.direction = "left"; }
        if (R) { this.frameY = 3; this.direction = "right"; }
    }

    /**
     * Update farmer position, obstacle collisions, and animation frames.
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

        // update animation frames if moving
        if (this.vx !== 0 || this.vy !== 0) {
            this.frameTimer += dt;
            if (this.frameTimer >= this.frameInterval) {
                this.frameX = (this.frameX + 1) % 4; // cycle 0–3
                this.frameTimer = 0;
            }
        } else {
            this.frameX = 0; // idle frame
        }
    }

    /**
     * Render the farmer sprite on the canvas.
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    draw(ctx) {
        if (this.spriteLoaded && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            // Use sprite sheet if loaded
            const spriteCols = 4;   // 4 columns in sheet
            const spriteRows = 4;   // 4 rows in sheet
            const spriteWidth = this.sprite.width / spriteCols;   // one frame width
            const spriteHeight = this.sprite.height / spriteRows; // one frame height
        
            ctx.drawImage(
                this.sprite,
                this.frameX * spriteWidth, this.frameY * spriteHeight, // source X,Y
                spriteWidth, spriteHeight,                             // source W,H
                this.x, this.y, this.w, this.h                         // destination size
            );
        } else {
            // Fallback: Draw simple farmer graphics
            ctx.save();
            
            // Shadow for depth
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.beginPath();
            ctx.ellipse(this.x + this.w/2, this.y + this.h - 2, this.w/2 - 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Body (brown overalls)
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x + 6, this.y + 18, this.w - 12, this.h - 22);
            
            // Head (bigger)
            ctx.fillStyle = "#f4c2a8";
            ctx.beginPath();
            ctx.arc(this.x + this.w/2, this.y + 14, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Hat (straw hat)
            ctx.fillStyle = "#c28e0e";
            ctx.fillRect(this.x + 8, this.y + 4, this.w - 16, 6);       // hat brim
            ctx.fillRect(this.x + 12, this.y - 2, this.w - 24, 6);      // hat top
            
            // Eyes
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.arc(this.x + this.w/2 - 4, this.y + 12, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.w/2 + 4, this.y + 12, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // "You" label
            ctx.fillStyle = "#fff";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("YOU", this.x + this.w/2, this.y + this.h/2 + 8);
            
            // Movement indicator (simple animation)
            if (this.vx !== 0 || this.vy !== 0) {
                // Arms swing based on frame
                ctx.strokeStyle = "#f4c2a8";
                ctx.lineWidth = 4;
                ctx.lineCap = "round";
                
                const armOffset = Math.sin(this.frameX * Math.PI / 2) * 4;
                
                // Left arm
                ctx.beginPath();
                ctx.moveTo(this.x + 10, this.y + 25);
                ctx.lineTo(this.x + 4, this.y + 35 + armOffset);
                ctx.stroke();
                
                // Right arm
                ctx.beginPath();
                ctx.moveTo(this.x + this.w - 10, this.y + 25);
                ctx.lineTo(this.x + this.w - 4, this.y + 35 - armOffset);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
}