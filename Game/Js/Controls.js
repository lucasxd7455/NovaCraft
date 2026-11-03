// ==========================================
// NOVACRAFT 3D - CONTROLES
// ==========================================

export const CONTROL_SETTINGS = {
    joystickMaxDistance: 35,
    cameraSensitivity: 0.004
};

export function clampJoystick(value) {
    return Math.max(-1, Math.min(1, value));
}