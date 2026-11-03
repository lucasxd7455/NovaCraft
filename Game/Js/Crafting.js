// ==========================================
// NOVACRAFT 3D - CRAFTING
// ==========================================

export const RECIPES = [
    {
        id: 'test_block',
        ingredients: {
            grass: 2,
            dirt: 2
        },
        result: {
            type: 'test_block',
            count: 1
        }
    }
];

export function getRecipe(id) {
    return RECIPES.find(recipe => recipe.id === id) || null;
}