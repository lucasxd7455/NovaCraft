// ==========================================
// NOVACRAFT 3D - JUGADOR
// ==========================================

export const PLAYER_SETTINGS = {
    height: 2.6,
    moveSpeed: 4.5,
    sprintMultiplier: 1.6
};

export function clampPitch(pitch) {
    return Math.max(-1.45, Math.min(1.45, pitch));
}