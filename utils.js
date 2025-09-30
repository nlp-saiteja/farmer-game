/**
 * Utility constants and helper functions for the game.
 */
export const WIDTH = 900, HEIGHT = 540;
export const TILE = 30;           // for a subtle grid
export const GAME_LEN = 60;       // seconds
export const GOAL = 15;           // crops to win

export const State = Object.freeze({ MENU: "MENU", PLAYING: "PLAYING", PAUSED: "PAUSED", GAME_OVER: "GAME_OVER", WIN: "WIN" });
/**
 * Clamp a number within a range.
 * @param {number} v - Value
 * @param {number} lo - Minimum value
 * @param {number} hi - Maximum value
 * @returns {number} - Clamped result
 */
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Axis-Aligned Bounding Box collision detection.
 * @param {Entity} a - First entity
 * @param {Entity} b - Second entity
 * @returns {boolean} - True if overlapping
 */
export const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
