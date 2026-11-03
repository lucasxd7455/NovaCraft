// ==========================================
// NOVACRAFT 3D - MUNDO
// ==========================================

export const WORLD_TYPES = {
    SURVIVAL: 'survival',
    TESTWORLD: 'testworld'
};

export function blockKey(x, y, z) {
    return `${x},${y},${z}`;
}