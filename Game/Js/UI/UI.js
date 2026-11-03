// ==========================================
// NOVACRAFT 3D - INTERFAZ
// ==========================================

export function getElement(id) {
    return document.getElementById(id);
}

export function showElement(element) {
    if (element) element.style.display = 'block';
}

export function hideElement(element) {
    if (element) element.style.display = 'none';
}

export function toggleElement(element, visible) {
    if (element) {
        element.style.display = visible ? 'block' : 'none';
    }
}
