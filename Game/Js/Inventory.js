// ==========================================
// NOVACRAFT 3D - INVENTARIO
// ==========================================

export const INVENTORY_SIZE = 36;
export const HOTBAR_SIZE = 9;
export const MAX_STACK = 64;

export function createInventory() {
    return Array(INVENTORY_SIZE).fill(null);
}