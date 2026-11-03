// ==========================================
// NOVACRAFT 3D - MENÚ PRINCIPAL
// ==========================================

export const WORLD_OPTIONS = [
    {
        id: 'survival',
        name: 'Normal Survival',
        description: 'Un mundo para sobrevivir.'
    },
    {
        id: 'testworld',
        name: 'TestWorld',
        description: 'Un mundo para probar todos los bloques.'
    }
];

export function getWorld(id) {
    return WORLD_OPTIONS.find(world => world.id === id) || null;
}