import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {
    WORLD_SIZE,
    CHUNK_SIZE,
    RENDER_SCALE,
    MOVE_SPEED,
    PLAYER_HEIGHT,
    REACH
} from './js/Config.js';

import { BLOCKS } from './js/Blocks.js';

import { WORLD_TYPES, blockKey } from './js/World.js';

import { chunkKey } from './js/Chunks.js';

import { clampPitch } from './js/Player.js';

import {
    CONTROL_SETTINGS,
    clampJoystick
} from './js/Controls.js';

import {
    INVENTORY_SIZE,
    HOTBAR_SIZE,
    MAX_STACK,
    createInventory
} from './js/Inventory.js';

import { getRecipe } from './js/Crafting.js';

import {
    getElement,
    showElement,
    hideElement,
    toggleElement
} from './js/UI/UI.js';

import { WORLD_OPTIONS, getWorld } from './js/Main-menu.js';
console.log('🔥 GAME.JS ESTÁ EJECUTÁNDOSE');

// ==========================================
// NOVACRAFT 3D - MOTOR 1.0
// ==========================================

// ESCENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// CÁMARA
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    80
);

camera.position.set(0, PLAYER_HEIGHT, 5);
camera.rotation.order = 'YXZ';

// RENDERIZADOR
const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'low-power'
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, RENDER_SCALE)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById('game-container')
    .appendChild(renderer.domElement);

// ==========================================
// ILUMINACIÓN
// ==========================================

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    1.5
);

scene.add(ambientLight);

const sun = new THREE.DirectionalLight(
    0xffffff,
    1.2
);

sun.position.set(10, 20, 10);
scene.add(sun);


// ==========================================
// NOVAENGINE - SISTEMA DE BLOQUES
// ==========================================

// Generar terreno

const blocks = new Map();

// ==========================================
// NOVACRAFT - GENERADOR DE MUNDOS
// ==========================================

function generateWorld(worldType) {
    blocks.clear();

    const testBlocks = [
        'grass',
        'dirt',
        'stone',
        'test_block'
    ];

    for (let x = 0; x < WORLD_SIZE; x++) {
        for (let z = 0; z < WORLD_SIZE; z++) {

            if (worldType === WORLD_TYPES.SURVIVAL) {

                blocks.set(blockKey(x, 0, z), 'grass');

            } else {

                const index = (x + z * 3) % testBlocks.length;

                blocks.set(
                    blockKey(x, 0, z),
                    testBlocks[index]
                );
            }

            blocks.set(blockKey(x, -1, z), 'dirt');
            blocks.set(blockKey(x, -2, z), 'dirt');
            blocks.set(blockKey(x, -3, z), 'stone');
        }
    }
}

// Mantener el mundo original al iniciar
generateWorld(WORLD_TYPES.SURVIVAL);


// ==========================================
// NOVACRAFT - SELECCIÓN DE MUNDOS
// ==========================================

let currentWorld = null;
function selectWorld(worldId) {
    console.log('🔥 SELECT WORLD EJECUTADO:', worldId);

    const world = getWorld(worldId);

    if (!world) {
        console.log('❌ Mundo no encontrado:', worldId);
        return;
    }

// Cambiar de mundo
currentWorld = worldId;

  // Restablecer estado de pausa
gamePaused = false;
pauseMenu.classList.remove('open');

// Cargar inventario correspondiente
const savedInventory = worldInventories.get(worldId);

if (savedInventory) {
    inventory.splice(
        0,
        inventory.length,
        ...savedInventory.map(item => item ? { ...item } : null)
    );
} else {
    inventory.fill(null);

    if (worldId === WORLD_TYPES.TESTWORLD) {
        inventory[0] = { type: 'grass', count: 64 };
        inventory[1] = { type: 'dirt', count: 64 };
        inventory[2] = { type: 'stone', count: 64 };
        inventory[3] = { type: 'test_block', count: 64 };
    }
}

selectedSlot = 0;
updateInventoryUI();

generateWorld(worldId);
rebuildTerrain();

generateWorld(worldId);

if (worldId === WORLD_TYPES.TESTWORLD) {
    inventory.fill(null);

    inventory[0] = { type: 'grass', count: 64 };
    inventory[1] = { type: 'dirt', count: 64 };
    inventory[2] = { type: 'stone', count: 64 };
    inventory[3] = { type: 'test_block', count: 64 };

    selectedSlot = 0;
    updateInventoryUI();
}

rebuildTerrain();

    document.getElementById('main-menu').style.display = 'none';
document.getElementById('loading').style.display = 'none';

// Mostrar interfaz del juego
document.getElementById('hud')
    .classList.remove('menu-hidden');

    console.log('✅ Mundo seleccionado:', world.name);
}

// Botón Normal Survival
document.getElementById('world-survival')
    .addEventListener('click', () => {
        selectWorld(WORLD_TYPES.SURVIVAL);
    });

// Botón TestWorld
document.getElementById('world-test')
    .addEventListener('click', () => {
        selectWorld(WORLD_TYPES.TESTWORLD);
    });

// ==========================================
// NOVACRAFT - INSTRUCCIONES
// ==========================================

const instructionsMenu = document.getElementById('instructions-menu');

document.getElementById('instructions-button')
    .addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();

        document.getElementById('main-menu').style.display = 'none';
        instructionsMenu.style.display = 'flex';
    });

document.getElementById('instructions-back')
    .addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();

        instructionsMenu.style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
    });

const faces = [
    { dir:[1,0,0], vertices:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
    { dir:[-1,0,0], vertices:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
    { dir:[0,1,0], vertices:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]] },
    { dir:[0,-1,0], vertices:[[0,0,1],[0,0,0],[1,0,0],[1,0,1]] },
    { dir:[0,0,1], vertices:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]] },
    { dir:[0,0,-1], vertices:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]] }
];



// ==========================================
// NOVACRAFT - CHUNKS CON TEXTURAS 4X4
// ==========================================

// Crear una textura de 4x4 píxeles por bloque
function createBlockTexture(type) {
    const data = new Uint8Array(4 * 4 * 4);
    const base = BLOCKS[type].color;

    const seed = Object.keys(BLOCKS).indexOf(type) + 1;

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const pattern = (x * 7 + y * 11 + seed * 13) % 5;

            const shades = [0.78, 0.90, 1.05, 0.92, 1.15];
            const shade = shades[pattern];

            const i = (y * 4 + x) * 4;

            data[i] = Math.min(255, base[0] * shade * 255);
            data[i + 1] = Math.min(255, base[1] * shade * 255);
            data[i + 2] = Math.min(255, base[2] * shade * 255);
            data[i + 3] = 255;
        }
    }

    const texture = new THREE.DataTexture(
        data,
        4,
        4,
        THREE.RGBAFormat
    );

    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
}

// Material independiente para cada bloque
const blockTypes = Object.keys(BLOCKS);

const terrainMaterials = blockTypes.map(type => {
    const material = new THREE.MeshLambertMaterial({
        map: createBlockTexture(type),
        transparent: type === 'water',
        opacity: type === 'water' ? 0.72 : 1,
        depthWrite: type !== 'water'
    });

    return material;
});

const materialIndexes = {};

blockTypes.forEach((type, index) => {
    materialIndexes[type] = index;
});

const chunkMeshes = new Map();

function rebuildChunk(cx, cz) {
    const id = chunkKey(cx, cz);
    const oldMesh = chunkMeshes.get(id);

    if (oldMesh) {
        scene.remove(oldMesh);
        oldMesh.geometry.dispose();
        chunkMeshes.delete(id);
    }

    const positions = [];
    const uvs = [];
    const indices = [];
  const faceGroups = [];

    let vertexCount = 0;

    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    const endX = startX + CHUNK_SIZE;
    const endZ = startZ + CHUNK_SIZE;

    for (const [key, type] of blocks) {
        const [x, y, z] = key.split(',').map(Number);

        if (
            x < startX || x >= endX ||
            z < startZ || z >= endZ
        ) continue;

        const materialIndex = materialIndexes[type];

        for (const face of faces) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            if (blocks.has(blockKey(nx, ny, nz))) continue;

            for (const v of face.vertices) {
                positions.push(
                    x - WORLD_SIZE / 2 + v[0],
                    y + v[1],
                    z - WORLD_SIZE / 2 + v[2]
                );
            }

            // Coordenadas UV de la textura
            uvs.push(
                0, 0,
                0, 1,
                1, 1,
                1, 0
            );

            indices.push(
                vertexCount,
                vertexCount + 1,
                vertexCount + 2,
                vertexCount,
                vertexCount + 2,
                vertexCount + 3
            );

            // Asignar material a esta cara
            const groupStart = indices.length - 6;

            // Guardaremos los grupos después de crear la geometría
            faceGroups.push({
                start: groupStart,
                count: 6,
                materialIndex
            });

            vertexCount += 4;
        }
    }

    if (positions.length === 0) return;

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(uvs, 2)
    );

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    for (const group of faceGroups) {
        geometry.addGroup(
            group.start,
            group.count,
            group.materialIndex
        );
    }

    const mesh = new THREE.Mesh(
        geometry,
        terrainMaterials
    );

    chunkMeshes.set(id, mesh);
    scene.add(mesh);
}

function rebuildTerrain() {
    for (const mesh of chunkMeshes.values()) {
        scene.remove(mesh);
        mesh.geometry.dispose();
    }

    chunkMeshes.clear();

    const totalChunks = WORLD_SIZE / CHUNK_SIZE;

    for (let cx = 0; cx < totalChunks; cx++) {
        for (let cz = 0; cz < totalChunks; cz++) {
            rebuildChunk(cx, cz);
        }
    }
}


function rebuildChunksAround(x, z) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);

    const affected = new Set();

    affected.add(chunkKey(cx, cz));

    if (x % CHUNK_SIZE === 0) {
        affected.add(chunkKey(cx - 1, cz));
    }

    if (x % CHUNK_SIZE === CHUNK_SIZE - 1) {
        affected.add(chunkKey(cx + 1, cz));
    }

    if (z % CHUNK_SIZE === 0) {
        affected.add(chunkKey(cx, cz - 1));
    }

    if (z % CHUNK_SIZE === CHUNK_SIZE - 1) {
        affected.add(chunkKey(cx, cz + 1));
    }

    for (const id of affected) {
        const [chunkX, chunkZ] = id.split(',').map(Number);

        if (
            chunkX >= 0 && chunkX < WORLD_SIZE / CHUNK_SIZE &&
            chunkZ >= 0 && chunkZ < WORLD_SIZE / CHUNK_SIZE
        ) {
            rebuildChunk(chunkX, chunkZ);
        }
    }
}

// Primera construcción
rebuildTerrain();
console.log('BOTÓN SURVIVAL:', document.getElementById('world-survival'));
console.log('BOTÓN TEST:', document.getElementById('world-test'));

// ==========================================
// CONTROLES DEL JUGADOR
// ==========================================

let yaw = 0;
let pitch = 0;

let velocityY = 0;
let grounded = true;
let jumpRequested = false;

let joystickX = 0;
let joystickY = 0;

const keys = {};

// Teclado
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Joystick táctil
const joystick = document.getElementById('joystick');
const knob = document.getElementById('joystick-knob');

let joystickPointer = null;

joystick.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    joystickPointer = e.pointerId;
    joystick.setPointerCapture(e.pointerId);

    updateJoystick(e);
});

function updateJoystick(e) {
    const rect = joystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    const maxDistance = CONTROL_SETTINGS.joystickMaxDistance;
    const distance = Math.hypot(dx, dy);
    const scale = distance > maxDistance
        ? maxDistance / distance
        : 1;

    const x = dx * scale;
    const y = dy * scale;

    joystickX = clampJoystick(x / maxDistance);
joystickY = clampJoystick(y / maxDistance);

    knob.style.left = `calc(50% + ${x}px)`;
    knob.style.top = `calc(50% + ${y}px)`;
}

joystick.addEventListener('pointermove', (e) => {
    if (e.pointerId === joystickPointer) {
        updateJoystick(e);
    }
});

function resetJoystick() {
    joystickPointer = null;
    joystickX = 0;
    joystickY = 0;

    knob.style.left = '50%';
    knob.style.top = '50%';
}

joystick.addEventListener('pointerup', resetJoystick);
joystick.addEventListener('pointercancel', resetJoystick);

// Mirar alrededor
let lookPointer = null;
let lastX = 0;
let lastY = 0;

renderer.domElement.addEventListener('pointerdown', (e) => {
    if (e.clientX < window.innerWidth / 2) return;

    lookPointer = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;

    renderer.domElement.setPointerCapture(e.pointerId);
});

renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookPointer) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    yaw -= dx * CONTROL_SETTINGS.cameraSensitivity;
pitch -= dy * CONTROL_SETTINGS.cameraSensitivity;
pitch = clampPitch(pitch)

    lastX = e.clientX;
    lastY = e.clientY;
});

function stopLooking(e) {
    if (e.pointerId === lookPointer) {
        lookPointer = null;
    }
}

renderer.domElement.addEventListener('pointerup', stopLooking);
renderer.domElement.addEventListener('pointercancel', stopLooking);

// Saltar
const jumpButton = document.getElementById('jump');

jumpButton.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    jumpRequested = true;
});

// ==========================================
// AGACHARSE - TOGGLE
// ==========================================

const crouchButton = document.getElementById('crouch');

let crouchRequested = false;

crouchButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    crouchRequested = !crouchRequested;

    crouchButton.classList.toggle(
        'active',
        crouchRequested
    );
});

// ==========================================
// CORRER - TOGGLE
// ==========================================

const sprintButton = document.getElementById('sprint');

let sprintRequested = false;

sprintButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    sprintRequested = !sprintRequested;

    sprintButton.classList.toggle(
        'active',
        sprintRequested
    );
});

// ==========================================
// NOVACRAFT - SISTEMA DE PAUSA
// ==========================================

const pauseButton = document.getElementById('pause');
const pauseMenu = document.getElementById('pause-menu');

let gamePaused = false;

function pauseGame() {
    gamePaused = true;

    pauseMenu.classList.add('open');
    joystickX = 0;
    joystickY = 0;
    jumpRequested = false;
    sprintRequested = false;
    crouchRequested = false;

    sprintButton.classList.remove('active');
    crouchButton.classList.remove('active');
}

function resumeGame() {
    gamePaused = false;
    pauseMenu.classList.remove('open');
}

pauseButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
});

// ==========================================
// NOVACRAFT - BOTONES DEL MENÚ DE PAUSA
// ==========================================

// CONTINUAR
document.getElementById('resume')
    .addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();

        resumeGame();
    });

// REINICIAR MUNDO
document.getElementById('restart')
    .addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentWorld) return;

      resetWorldInventory(currentWorld);
        generateWorld(currentWorld);
        rebuildTerrain();

        // Volver a la posición inicial
        camera.position.set(0, PLAYER_HEIGHT, 5);

        velocityY = 0;
        grounded = true;
        jumpRequested = false;

        yaw = 0;
        pitch = 0;

        resetJoystick();

        resumeGame();

        console.log('🔄 Mundo reiniciado');
    });

// VOLVER AL MENÚ PRINCIPAL
document.getElementById('exit')
    .addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        gamePaused = true;
        pauseMenu.classList.remove('open');

        document.getElementById('main-menu').style.display = 'flex';
      document.getElementById('hud')
    .classList.add('menu-hidden');

        resetJoystick();
    });

if (currentWorld !== null) {
    resetWorldInventory(currentWorld);
}

currentWorld = null;

// ==========================================
// NOVAENGINE - MINERÍA Y COLOCACIÓN
// ==========================================

const selection = new THREE.LineSegments(
    new THREE.EdgesGeometry(
        new THREE.BoxGeometry(1.01, 1.01, 1.01)
    ),
    new THREE.LineBasicMaterial({ color: 0xffffff })
);

scene.add(selection);
selection.visible = false;

const miningButton = document.getElementById('mine');
const placeButton = document.getElementById('place');
const miningProgress = document.getElementById('mining-progress');
const miningBar = document.getElementById('mining-bar');

let miningTime = 0;
let miningKey = null;
let mining = false;
// ==========================================
// INVENTARIO NOVACRAFT
// ==========================================

const inventory = createInventory();
const worldInventories = new Map();

let selectedSlot = 0;
let moveMode = false;
let moveSourceSlot = null;

// Cada espacio contiene:
// { type: 'grass', count: 64 }

// Agregar bloques al inventario
function addItem(type) {
    // Primero llenar stacks existentes
    for (let i = 0; i < inventory.length; i++) {
        const slot = inventory[i];

        if (slot && slot.type === type && slot.count < MAX_STACK) {
            const amount = Math.min(MAX_STACK - slot.count, 1);
            slot.count += amount;
            updateInventoryUI();
            return true;
        }
    }

    // Buscar espacio vacío
    for (let i = 0; i < inventory.length; i++) {
        if (inventory[i] === null) {
            inventory[i] = {
                type: type,
                count: 1
            };

            updateInventoryUI();
            return true;
        }
    }

    return false;
}
function getItemIcon(type) {
    if (type === 'grass') return '🟩';
    if (type === 'dirt') return '🟫';
    if (type === 'test_block') return '🧱';
    if (type === 'stone') return '🪨';
    return '⬜';
}

// Actualizar interfaz
function updateInventoryUI() {
    const slots = document.querySelectorAll('#hotbar .slot');

    slots.forEach((slot, i) => {
        const item = inventory[i];

        slot.dataset.slot = i;

        slot.textContent = item
            ? `${getItemIcon(item.type)} ${item.count}`
            : '';

        slot.classList.toggle('selected', i === selectedSlot);

        slot.classList.toggle(
            'moving-source',
            moveMode && moveSourceSlot === i
        );
    });

    const grid = document.getElementById('inventory-grid');

    if (grid) {
        grid.innerHTML = '';

        for (let i = HOTBAR_SIZE; i < INVENTORY_SIZE; i++) {
            const item = inventory[i];

            const element = document.createElement('button');

            element.className = 'slot';
            element.dataset.slot = i;

            element.textContent = item
    ? `${getItemIcon(item.type)} ${item.count}`
    : '';

            element.classList.toggle('selected', i === selectedSlot);

            element.classList.toggle(
                'moving-source',
                moveMode && moveSourceSlot === i
            );

            grid.appendChild(element);
        }
    }
}

// ==========================================
// NOVACRAFT - REINICIAR INVENTARIO
// ==========================================

function resetWorldInventory(worldId) {
    inventory.fill(null);

    // TestWorld comienza con sus cuatro bloques
    if (worldId === WORLD_TYPES.TESTWORLD) {
        inventory[0] = { type: 'grass', count: 64 };
        inventory[1] = { type: 'dirt', count: 64 };
        inventory[2] = { type: 'stone', count: 64 };
        inventory[3] = { type: 'test_block', count: 64 };
    }

    selectedSlot = 0;
    moveMode = false;
    moveSourceSlot = null;

    worldInventories.delete(worldId);

    updateInventoryUI();
}

// Obtener bloque seleccionado
function getSelectedBlock() {
    const item = inventory[selectedSlot];

    return item && item.count > 0 ? item.type : null;
}

// Alcance de interacción

// Detectar bloques mediante recorrido de voxeles
function getTargetedBlock() {
    const origin = camera.position.clone();
    const direction = new THREE.Vector3();

    camera.getWorldDirection(direction);

    const half = WORLD_SIZE / 2;

    const start = [
        origin.x + half,
        origin.y,
        origin.z + half
    ];

    const dir = [direction.x, direction.y, direction.z];

    const cell = start.map(Math.floor);
    const step = dir.map(v => Math.sign(v));

    const delta = dir.map(v =>
        v === 0 ? Infinity : Math.abs(1 / v)
    );

    const max = start.map((v, i) => {
        if (dir[i] > 0) {
            return (Math.floor(v) + 1 - v) / dir[i];
        }

        if (dir[i] < 0) {
            return (v - Math.floor(v)) / -dir[i];
        }

        return Infinity;
    });

    let previous = null;
    let distance = 0;

    while (distance <= REACH) {
        const [x, y, z] = cell;
        const key = blockKey(x, y, z);

        if (blocks.has(key)) {
            return {
                x, y, z,
                type: blocks.get(key),
                key,
                place: previous
            };
        }

        previous = { x, y, z };

        let axis = 0;

        if (max[1] < max[axis]) axis = 1;
        if (max[2] < max[axis]) axis = 2;

        distance = max[axis];

        cell[axis] += step[axis];
        max[axis] += delta[axis];
    }

    return null;
}

// ==========================================
// NOVACRAFT - MOVIMIENTO DE OBJETOS
// ==========================================

const moveToggle = document.getElementById('move-toggle');

moveToggle.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    moveMode = !moveMode;
    moveSourceSlot = null;

    moveToggle.classList.toggle('active', moveMode);

    moveToggle.textContent = moveMode
        ? '↔ MOVER: ON'
        : '↔ MOVER';

    updateInventoryUI();
});

document.getElementById('inventory')
.addEventListener('pointerdown', e => {

    const slot = e.target.closest('.slot');

    if (!slot) return;

    e.preventDefault();
    e.stopPropagation();

    const index = Number(slot.dataset.slot);

    // MODO NORMAL
    if (!moveMode) {
        selectedSlot = index;
        updateInventoryUI();
        return;
    }

    // PRIMER TOQUE: elegir origen
    if (moveSourceSlot === null) {

        if (inventory[index] === null) return;

        moveSourceSlot = index;
        updateInventoryUI();
        return;
    }

    // SEGUNDO TOQUE EN EL MISMO SLOT: cancelar
    if (moveSourceSlot === index) {

        moveSourceSlot = null;
        updateInventoryUI();
        return;
    }

    // SEGUNDO TOQUE: mover o intercambiar
    const temp = inventory[moveSourceSlot];

    inventory[moveSourceSlot] = inventory[index];
    inventory[index] = temp;

    moveSourceSlot = null;

    updateInventoryUI();
});

// ==========================================
// MOCHILA - ABRIR Y CERRAR
// ==========================================

const inventoryPanel = document.getElementById('inventory');

document.getElementById('inventory-toggle')
    .addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();

        inventoryPanel.classList.toggle('open');

        updateInventoryUI();
    });
// ==========================================
// NOVACRAFT - SISTEMA DE CRAFTEO
// ==========================================

let selectedRecipe = null;

const recipeTest = document.getElementById('recipe-test');
const craftButton = document.getElementById('craft-button');
const craftSlots = document.querySelectorAll('.craft-slot');
const craftResult = document.getElementById('craft-result');

const testRecipe = getRecipe('test_block');

// Contar materiales
function countItem(type) {
    let total = 0;

    for (const item of inventory) {
        if (item && item.type === type) {
            total += item.count;
        }
    }

    return total;
}

// Comprobar materiales
function hasRecipeMaterials(recipe) {
    return Object.entries(recipe.ingredients).every(
        ([type, amount]) => countItem(type) >= amount
    );
}

// Comprobar espacio para el resultado
function canAddCraftedItem(type) {
    return inventory.some(item =>
        item === null ||
        (item.type === type && item.count < MAX_STACK)
    );
}

// Mostrar receta
function updateCraftingUI() {

    const available = selectedRecipe !== null &&
        hasRecipeMaterials(selectedRecipe);

    const ingredients = selectedRecipe
        ? selectedRecipe.ingredients
        : {};

    craftSlots.forEach((slot, i) => {

        const types = ['grass', 'dirt'];

        if (!selectedRecipe) {
            slot.textContent = '';
            return;
        }

        const type = types[i];

        slot.textContent = ingredients[type]
            ? `${getItemIcon(type)} ${ingredients[type]}`
            : '';
    });

    craftResult.textContent = selectedRecipe
    ? getItemIcon(selectedRecipe.result.type)
    : '';

    craftButton.disabled = !available ||
        !canAddCraftedItem(selectedRecipe.result.type);
}

// Seleccionar receta
recipeTest.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    selectedRecipe = testRecipe;

    document.querySelectorAll('.recipe-item').forEach(button => {
        button.classList.remove('selected');
    });

    recipeTest.classList.add('selected');

    updateCraftingUI();
});

// Fabricar
craftButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedRecipe) return;

    if (!hasRecipeMaterials(selectedRecipe)) return;

    if (!canAddCraftedItem(selectedRecipe.result.type)) return;

    // Consumir materiales
    for (const [type, amount] of Object.entries(
        selectedRecipe.ingredients
    )) {

        let remaining = amount;

for (let i = 0; i < inventory.length; i++) {

    const item = inventory[i];

    if (!item || item.type !== type) continue;

    const used = Math.min(item.count, remaining);

    item.count -= used;
    remaining -= used;

    if (item.count <= 0) {
        inventory[i] = null;
    }

    if (remaining === 0) break;
}
}

// Entregar resultado
for (let i = 0; i < selectedRecipe.result.count; i++) {
    addItem(selectedRecipe.result.type);
}

updateInventoryUI();
updateCraftingUI();
});

updateCraftingUI();

document.getElementById('inventory-close')
    .addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();

        inventoryPanel.classList.remove('open');
    });

// Mantener pulsado para minar
miningButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    mining = true;
});

function stopMining(e) {
    e.preventDefault();
    e.stopPropagation();

    mining = false;
    miningTime = 0;
    miningKey = null;

    miningProgress.style.display = 'none';
    miningBar.style.width = '0%';
}

miningButton.addEventListener('pointerup', stopMining);
miningButton.addEventListener('pointercancel', stopMining);
miningButton.addEventListener('lostpointercapture', stopMining);

// Colocar bloque
placeButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    const target = getTargetedBlock();

    if (!target || !target.place) return;

    // Obtener el bloque seleccionado
    const selectedBlock = getSelectedBlock();

    // No colocar si la mano está vacía
    if (!selectedBlock) return;

    const p = target.place;
    const key = blockKey(p.x, p.y, p.z);

    if (blocks.has(key)) return;

    // Comprobar límites del mundo
    if (
        p.x < 0 || p.x >= WORLD_SIZE ||
        p.z < 0 || p.z >= WORLD_SIZE
    ) return;

    const bx = p.x - WORLD_SIZE / 2;
    const by = p.y;
    const bz = p.z - WORLD_SIZE / 2;

    // Evitar colocar bloques dentro del jugador
    const feet = camera.position.y - 1.6;
    const head = feet + 1.8;

    const overlapX =
        camera.position.x + 0.3 > bx &&
        camera.position.x - 0.3 < bx + 1;

    const overlapY =
        head > by && feet < by + 1;

    const overlapZ =
        camera.position.z + 0.3 > bz &&
        camera.position.z - 0.3 < bz + 1;

    if (overlapX && overlapY && overlapZ) return;

    // Colocar el bloque
    blocks.set(key, selectedBlock);

    // Consumir una unidad del inventario
    inventory[selectedSlot].count--;

    if (inventory[selectedSlot].count <= 0) {
        inventory[selectedSlot] = null;
    }

    updateInventoryUI();
    rebuildChunksAround(p.x, p.z);
});

// Actualizar selección y minería
function updateBlockInteraction(delta) {
    const target = getTargetedBlock();

    if (target) {
        selection.visible = true;

        selection.position.set(
            target.x - WORLD_SIZE / 2 + 0.5,
            target.y + 0.5,
            target.z - WORLD_SIZE / 2 + 0.5
        );
    } else {
        selection.visible = false;
    }

    if (!mining || !target) {
        miningProgress.style.display = 'none';
        miningBar.style.width = '0%';
        miningTime = 0;
        miningKey = null;
        return;
    }

    if (miningKey !== target.key) {
        miningKey = target.key;
        miningTime = 0;
    }

    const duration = BLOCKS[target.type]?.hardness || 1;

    miningTime += delta;

    miningProgress.style.display = 'block';

    const progress = Math.min(
        miningTime / duration,
        1
    );

    miningBar.style.width = `${progress * 100}%`;

    if (progress >= 1) {
    addItem(target.type);

    blocks.delete(target.key);
    miningTime = 0;
    miningKey = null;
    rebuildChunksAround(target.x, target.z);

        miningProgress.style.display = 'none';
        miningBar.style.width = '0%';
    }
}

// ==========================================
// NOVAENGINE - COLISIONES Y SUELO
// ==========================================

let PLAYER_EYE_HEIGHT = 1.6;
let PLAYER_BODY_HEIGHT = 1.8;

const STANDING_EYE_HEIGHT = 1.6;
const CROUCH_EYE_HEIGHT = 0.8;

const STANDING_BODY_HEIGHT = 1.8;
const CROUCH_BODY_HEIGHT = 0.9;

const PLAYER_RADIUS = 0.3;

function findLandingHeight(previousFeet, nextFeet) {
    const half = WORLD_SIZE / 2;

    const minX = Math.floor(
        camera.position.x + half - PLAYER_RADIUS
    );

    const maxX = Math.floor(
        camera.position.x + half + PLAYER_RADIUS
    );

    const minZ = Math.floor(
        camera.position.z + half - PLAYER_RADIUS
    );

    const maxZ = Math.floor(
        camera.position.z + half + PLAYER_RADIUS
    );

    let landingHeight = null;

    for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {

            for (
                let y = Math.floor(previousFeet);
                y >= -128;
                y--
            ) {
                if (!blocks.has(blockKey(x, y, z))) {
                    continue;
                }

                const top = y + 1;

                if (
                    top <= previousFeet + 0.001 &&
                    top >= nextFeet - 0.001
                ) {
                    if (
                        landingHeight === null ||
                        top > landingHeight
                    ) {
                        landingHeight = top;
                    }
                }
            }
        }
    }

    return landingHeight;
}

// ==========================================
// NOVAENGINE - COLISIONES SUPERIORES
// ==========================================

function findCeilingHeight(previousHead, nextHead) {
    const half = WORLD_SIZE / 2;

    const minX = Math.floor(
        camera.position.x + half - PLAYER_RADIUS
    );

    const maxX = Math.floor(
        camera.position.x + half + PLAYER_RADIUS
    );

    const minZ = Math.floor(
        camera.position.z + half - PLAYER_RADIUS
    );

    const maxZ = Math.floor(
        camera.position.z + half + PLAYER_RADIUS
    );

    let ceilingHeight = null;

    for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {

            for (
                let y = Math.floor(previousHead);
                y <= Math.ceil(nextHead);
                y++
            ) {
                if (!blocks.has(blockKey(x, y, z))) {
                    continue;
                }

                if (
                    y >= previousHead - 0.001 &&
                    y <= nextHead + 0.001
                ) {
                    if (
                        ceilingHeight === null ||
                        y < ceilingHeight
                    ) {
                        ceilingHeight = y;
                    }
                }
            }
        }
    }

    return ceilingHeight;
}

// ==========================================
// NOVAENGINE - COLISIONES LATERALES
// ==========================================

function hasHorizontalCollision(x, z, bodyHeight = PLAYER_BODY_HEIGHT) {
    const half = WORLD_SIZE / 2;

    const feet = camera.position.y - PLAYER_EYE_HEIGHT;
    const head = feet + bodyHeight;

    const minX = Math.floor(x + half - PLAYER_RADIUS);
    const maxX = Math.floor(x + half + PLAYER_RADIUS);

    const minZ = Math.floor(z + half - PLAYER_RADIUS);
    const maxZ = Math.floor(z + half + PLAYER_RADIUS);

    const minY = Math.floor(feet + 0.001);
    const maxY = Math.floor(head - 0.001);

    for (let bx = minX; bx <= maxX; bx++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
            for (let by = minY; by <= maxY; by++) {

                if (blocks.has(blockKey(bx, by, bz))) {
                    return true;
                }

            }
        }
    }

    return false;
}

// ==========================================
// PROTECCIÓN DE BORDES AL AGACHARSE
// ==========================================

function hasFloorSupport(x, z) {
    const half = WORLD_SIZE / 2;

    const feet = camera.position.y - PLAYER_EYE_HEIGHT;
    const supportY = Math.floor(feet - 0.01);

    const offset = PLAYER_RADIUS * 0.9;

    const points = [
        [x - offset, z - offset],
        [x + offset, z - offset],
        [x - offset, z + offset],
        [x + offset, z + offset]
    ];

    for (const point of points) {
        const bx = Math.floor(point[0] + half);
        const bz = Math.floor(point[1] + half);

        if (!blocks.has(blockKey(bx, supportY, bz))) {
            return false;
        }
    }

    return true;
}

// ==========================================
// BUCLE PRINCIPAL
// ==========================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
  if (gamePaused) {
    renderer.render(scene, camera);
    return;
  }

    const limit = WORLD_SIZE / 2 - 0.5;

    // Rotación de cámara
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Movimiento
    let forward = -joystickY;
    let sideways = joystickX;

    if (keys['KeyW'] || keys['ArrowUp']) forward += 1;
    if (keys['KeyS'] || keys['ArrowDown']) forward -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) sideways += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) sideways -= 1;

    const length = Math.hypot(forward, sideways);

    if (length > 1) {
        forward /= length;
        sideways /= length;
    }
// Velocidad de movimiento
const currentMoveSpeed =
    sprintRequested && !crouchRequested
        ? MOVE_SPEED * 1.6
        : MOVE_SPEED;

// ==========================================
// NOVAENGINE - MOVIMIENTO AL AGACHARSE
// ==========================================

const canStand = !hasHorizontalCollision(
    camera.position.x,
    camera.position.z,
    STANDING_BODY_HEIGHT
);

const targetEyeHeight =
    crouchRequested || !canStand
        ? CROUCH_EYE_HEIGHT
        : STANDING_EYE_HEIGHT;

const targetBodyHeight =
    crouchRequested || !canStand
        ? CROUCH_BODY_HEIGHT
        : STANDING_BODY_HEIGHT;

const oldEyeHeight = PLAYER_EYE_HEIGHT;
const smooth = Math.min(1, delta * 10);

PLAYER_EYE_HEIGHT +=
    (targetEyeHeight - PLAYER_EYE_HEIGHT) * smooth;

PLAYER_BODY_HEIGHT +=
    (targetBodyHeight - PLAYER_BODY_HEIGHT) * smooth;

camera.position.y +=
    PLAYER_EYE_HEIGHT - oldEyeHeight;

crouchButton.classList.toggle(
    'active',
    crouchRequested
);
  
    // Movimiento horizontal independiente de la inclinación
const directionX = Math.sin(yaw);
const directionZ = -Math.cos(yaw);

// Movimiento sincronizado con la cámara
const moveX =
    -Math.sin(yaw) * forward +
    Math.cos(yaw) * sideways;

const moveZ =
    -Math.cos(yaw) * forward -
    Math.sin(yaw) * sideways;

    // Movimiento con colisiones y deslizamiento
const nextX = THREE.MathUtils.clamp(
  camera.position.x + moveX * currentMoveSpeed * delta,
    -limit,
    limit
);

if (
    !hasHorizontalCollision(nextX, camera.position.z) &&
    (
        !crouchRequested ||
        !grounded ||
        hasFloorSupport(nextX, camera.position.z)
    )
) {
    camera.position.x = nextX;
}

const nextZ = THREE.MathUtils.clamp(
    camera.position.z + moveZ * currentMoveSpeed * delta,
    -limit,
    limit
);

if (
    !hasHorizontalCollision(camera.position.x, nextZ) &&
    (
        !crouchRequested ||
        !grounded ||
        hasFloorSupport(camera.position.x, nextZ)
    )
) {
    camera.position.z = nextZ;
}

// ==========================================
// NOVAENGINE - GRAVEDAD REAL
// ==========================================

if (jumpRequested && grounded) {
    velocityY = 6;
    grounded = false;
}

jumpRequested = false;

const previousFeet =
    camera.position.y - PLAYER_EYE_HEIGHT;

velocityY -= 16 * delta;

const nextFeet =
    previousFeet + velocityY * delta;

grounded = false;

if (velocityY <= 0) {

    const landing = findLandingHeight(
        previousFeet,
        nextFeet
    );

    if (landing !== null) {
        camera.position.y =
            landing + PLAYER_EYE_HEIGHT;

        velocityY = 0;
        grounded = true;
    } else {
        camera.position.y =
            nextFeet + PLAYER_EYE_HEIGHT;
    }

} else {

    const previousHead =
        previousFeet + PLAYER_BODY_HEIGHT;

    const nextHead =
        nextFeet + PLAYER_BODY_HEIGHT;

    const ceiling = findCeilingHeight(
        previousHead,
        nextHead
    );

    if (ceiling !== null) {

        camera.position.y =
            ceiling - PLAYER_BODY_HEIGHT + PLAYER_EYE_HEIGHT;

        velocityY = 0;

    } else {

        camera.position.y =
            nextFeet + PLAYER_EYE_HEIGHT;

    }
}

// Evitar caída infinita fuera del mundo
if (camera.position.y < -20) {
    camera.position.set(0, PLAYER_HEIGHT, 5);

    velocityY = 0;
    grounded = false;
}
  
  updateBlockInteraction(delta);

    renderer.render(scene, camera);
}

// Ajustar pantalla
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

// Iniciar
document.getElementById('loading').style.display = 'none';

animate();

console.log('NovaCraft 3D iniciado correctamente');
