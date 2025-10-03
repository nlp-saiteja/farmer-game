import Entity from "./Entity.js";
import { WIDTH, HEIGHT, clamp, aabb } from "./utils.js";

/**
 * Represents an AI-controlled competitor farmer.
 * Moves automatically towards the nearest crop and collects points.
 */
export default class CompetitorFarmer extends Entity {
    constructor(x, y) {
        super(x, y, 50, 50); // Increased size from 34x34 to 50x50
        this.speed = 60; // Further reduced speed from 80 to 60 (player is 120)
        this.vx = 0;
        this.vy = 0;
        this.score = 0;
        this.color = "#4a5c9b"; // Blue color for AI

        // Animation state
        this.frameX = 0;
        this.frameY = 0;
        this.frameTimer = 0;
        this.frameInterval = 0.15;
        
        // Target tracking
        this.target = null;
        this.retargetTimer = 0;
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
    }

    findNearestCrop(crops) {
        if (!crops.length) return null;
        
        let nearest = null;
        let minDist = Infinity;
        
        for (const crop of crops) {
            const dx = crop.x + crop.w/2 - (this.x + this.w/2);
            const dy = crop.y + crop.h/2 - (this.y + this.h/2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Prioritize high-value crops when they're relatively close
            let adjustedDist = dist;
            if (crop.points > 1) {
                adjustedDist = dist / (1 + crop.points * 0.2); // Favor high-point crops
            }
            
            if (adjustedDist < minDist) {
                minDist = adjustedDist;
                nearest = crop;
            }
        }
        
        return nearest;
    }

    moveTowardsTarget(dt, game) {
        if (!this.target || this.target.dead) {
            this.target = this.findNearestCrop(game.crops);
            this.retargetTimer = 0;
        }
        
        // Retarget occasionally to adapt to new crops
        this.retargetTimer += dt;
        if (this.retargetTimer > 1.0) { // Re-evaluate every second
            this.target = this.findNearestCrop(game.crops);
            this.retargetTimer = 0;
        }
        
        if (this.target) {
            const dx = this.target.x + this.target.w/2 - (this.x + this.w/2);
            const dy = this.target.y + this.target.h/2 - (this.y + this.h/2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 2) { // Only move if not already at target
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
                
                // Update sprite direction based on movement
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.frameY = dx > 0 ? 3 : 2; // right : left
                } else {
                    this.frameY = dy > 0 ? 0 : 1; // down : up
                }
            } else {
                this.vx = 0;
                this.vy = 0;
            }
        } else {
            // Wander randomly if no crops available
            if (Math.random() < 0.02) { // 2% chance to change direction
                this.vx = (Math.random() - 0.5) * this.speed;
                this.vy = (Math.random() - 0.5) * this.speed;
            }
        }
    }

    update(dt, game) {
        // AI movement logic
        this.moveTowardsTarget(dt, game);
        
        // Store old position for collision detection
        const oldX = this.x;
        const oldY = this.y;
        
        // Apply movement
        this.x = clamp(this.x + this.vx * dt, 0, WIDTH - this.w);
        this.y = clamp(this.y + this.vy * dt, 0, HEIGHT - this.h);
        
        // Check obstacle collision
        const hitObs = game.obstacles.some(o => aabb(this, o));
        if (hitObs) {
            // Simple pathfinding: try to go around obstacle
            this.x = oldX;
            this.y = oldY;
            
            // Try horizontal movement only
            this.x = clamp(this.x + this.vx * dt, 0, WIDTH - this.w);
            if (game.obstacles.some(o => aabb(this, o))) {
                this.x = oldX;
                // Try vertical movement only
                this.y = clamp(this.y + this.vy * dt, 0, HEIGHT - this.h);
                if (game.obstacles.some(o => aabb(this, o))) {
                    this.y = oldY;
                    // Stuck - pick new target
                    this.target = null;
                }
            }
        }
        
        // Update animation
        if (this.vx !== 0 || this.vy !== 0) {
            this.frameTimer += dt;
            if (this.frameTimer >= this.frameInterval) {
                this.frameX = (this.frameX + 1) % 4;
                this.frameTimer = 0;
            }
        } else {
            this.frameX = 0;
        }
        
        // Collect crops
        const collected = game.crops.filter(c => aabb(this, c));
        if (collected.length) {
            collected.forEach(c => {
                c.dead = true;
                this.score += c.points;
            });
            
            // Update UI immediately
            const compScore = document.getElementById("compScore");
            if (compScore) compScore.textContent = String(this.score);
        }
    }

    draw(ctx) {
        // Draw AI farmer with distinct appearance
        ctx.save();
        
        // Shadow for depth (bigger shadow for bigger farmer)
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.ellipse(this.x + this.w/2, this.y + this.h - 2, this.w/2 - 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (blue robot suit)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 6, this.y + 18, this.w - 12, this.h - 22);
        
        // Metal chest plate
        ctx.fillStyle = "#6a7d9b";
        ctx.fillRect(this.x + 10, this.y + 22, this.w - 20, 15);
        
        // Head (bigger robot head)
        ctx.fillStyle = "#c0c0c0";
        ctx.beginPath();
        ctx.arc(this.x + this.w/2, this.y + 14, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Robot eyes (red glowing)
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(this.x + this.w/2 - 5, this.y + 12, 3, 0, Math.PI * 2);
        ctx.arc(this.x + this.w/2 + 5, this.y + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Robot antenna
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + this.w/2, this.y + 3);
        ctx.lineTo(this.x + this.w/2, this.y - 6);
        ctx.stroke();
        
        // Antenna bulb (blinking effect)
        const blink = Math.sin(Date.now() * 0.005) > 0;
        ctx.fillStyle = blink ? "#ffff00" : "#ffaa00";
        ctx.beginPath();
        ctx.arc(this.x + this.w/2, this.y - 6, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // "AI" label on chest
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AI", this.x + this.w/2, this.y + this.h/2 + 5);
        
        // Robot arms (mechanical looking)
        if (this.vx !== 0 || this.vy !== 0) {
            ctx.strokeStyle = "#888";
            ctx.lineWidth = 5;
            ctx.lineCap = "square";
            
            const armOffset = Math.sin(this.frameX * Math.PI / 2) * 3;
            
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