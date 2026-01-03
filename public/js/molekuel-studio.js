import * as THREE from 'three';

// Set loaded flag immediately to prevent timeout
console.log('Molekülstudio script loaded');
window.moleculeStudioLoaded = true;

// Error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // Don't set moleculeStudioLoaded to false on global errors
    // The script is loaded, even if there's a runtime error
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

console.log('Molekülstudio script loaded');

// Global flag to track initialization
window.moleculeStudioInitialized = false;
window.moleculeStudioError = null;

// Globale Variablen (Modul-Scope)
let scene, camera, renderer;
let moleculeGroup = null;
let autoRotate = true;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// DOM Elemente werden beim Initialisieren gesetzt
let container, canvas, moleculeInput, visualizeBtn, moleculeInfo;
let errorMessage, welcomeScreen, loadingScreen, controlsInfo, autoRotateCheckbox;

// Beispieldaten für Moleküle
const moleculeData = {
    'Wasser': {
        formula: 'H₂O',
        wikipedia: 'https://de.wikipedia.org/wiki/Wasser',
        elements: {
            'H': { radius: 0.3, color: '#FFFFFF' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            { id: 'O-1', element: 'O', position: [0.0, 0.0, 0.0] },
            { id: 'H-1', element: 'H', position: [0.757, 0.586, 0.0] },
            { id: 'H-2', element: 'H', position: [-0.757, 0.586, 0.0] }
        ],
        bonds: [
            { atom1: 'O-1', atom2: 'H-1', type: 'single' },
            { atom1: 'O-1', atom2: 'H-2', type: 'single' }
        ]
    },
    'Methan': {
        formula: 'CH₄',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' }
        },
        atoms: [
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'H-1', element: 'H', position: [0.63, 0.63, 0.63] },
            { id: 'H-2', element: 'H', position: [-0.63, -0.63, 0.63] },
            { id: 'H-3', element: 'H', position: [-0.63, 0.63, -0.63] },
            { id: 'H-4', element: 'H', position: [0.63, -0.63, -0.63] }
        ],
        bonds: [
            { atom1: 'C-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-1', atom2: 'H-2', type: 'single' },
            { atom1: 'C-1', atom2: 'H-3', type: 'single' },
            { atom1: 'C-1', atom2: 'H-4', type: 'single' }
        ]
    },
    'Ammoniak': {
        formula: 'NH₃',
        elements: {
            'N': { radius: 0.65, color: '#3050F8' },
            'H': { radius: 0.3, color: '#FFFFFF' }
        },
        atoms: [
            { id: 'N-1', element: 'N', position: [0.0, 0.0, 0.0] },
            { id: 'H-1', element: 'H', position: [0.94, 0.0, -0.38] },
            { id: 'H-2', element: 'H', position: [-0.47, 0.81, -0.38] },
            { id: 'H-3', element: 'H', position: [-0.47, -0.81, -0.38] }
        ],
        bonds: [
            { atom1: 'N-1', atom2: 'H-1', type: 'single' },
            { atom1: 'N-1', atom2: 'H-2', type: 'single' },
            { atom1: 'N-1', atom2: 'H-3', type: 'single' }
        ]
    },
    'Kohlendioxid': {
        formula: 'CO₂',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'O-1', element: 'O', position: [1.16, 0.0, 0.0] },
            { id: 'O-2', element: 'O', position: [-1.16, 0.0, 0.0] }
        ],
        bonds: [
            { atom1: 'C-1', atom2: 'O-1', type: 'double' },
            { atom1: 'C-1', atom2: 'O-2', type: 'double' }
        ]
    },
    'Ethen': {
        formula: 'C₂H₄',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' }
        },
        atoms: [
            { id: 'C-1', element: 'C', position: [0.67, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [-0.67, 0.0, 0.0] },
            { id: 'H-1', element: 'H', position: [1.23, 0.94, 0.0] },
            { id: 'H-2', element: 'H', position: [1.23, -0.94, 0.0] },
            { id: 'H-3', element: 'H', position: [-1.23, 0.94, 0.0] },
            { id: 'H-4', element: 'H', position: [-1.23, -0.94, 0.0] }
        ],
        bonds: [
            { atom1: 'C-1', atom2: 'C-2', type: 'double' },
            { atom1: 'C-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-1', atom2: 'H-2', type: 'single' },
            { atom1: 'C-2', atom2: 'H-3', type: 'single' },
            { atom1: 'C-2', atom2: 'H-4', type: 'single' }
        ]
    },
    'THC': {
        formula: 'C₂₁H₃₀O₂',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            // Benzene ring (simplified representation)
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [1.4, 0.0, 0.0] },
            { id: 'C-3', element: 'C', position: [2.1, 1.21, 0.0] },
            { id: 'C-4', element: 'C', position: [1.4, 2.42, 0.0] },
            { id: 'C-5', element: 'C', position: [0.0, 2.42, 0.0] },
            { id: 'C-6', element: 'C', position: [-0.7, 1.21, 0.0] },
            // Pyran ring oxygen
            { id: 'O-1', element: 'O', position: [-0.7, -1.3, 0.0] },
            // Pyran ring carbons
            { id: 'C-7', element: 'C', position: [0.7, -1.3, 0.0] },
            { id: 'C-8', element: 'C', position: [1.4, 0.0, 0.0] },
            // Pentyl side chain (simplified)
            { id: 'C-9', element: 'C', position: [2.8, 0.0, 0.0] },
            { id: 'C-10', element: 'C', position: [3.5, 0.86, 0.0] },
            { id: 'C-11', element: 'C', position: [4.2, 0.0, 0.0] },
            { id: 'C-12', element: 'C', position: [4.9, 0.86, 0.0] },
            { id: 'C-13', element: 'C', position: [5.6, 0.0, 0.0] },
            // Methyl group
            { id: 'C-14', element: 'C', position: [2.1, 1.21, 0.0] },
            // Hydroxyl group
            { id: 'O-2', element: 'O', position: [-1.9, 2.8, 0.0] },
            { id: 'H-1', element: 'H', position: [0.0, -0.94, 0.0] },
            { id: 'H-2', element: 'H', position: [2.34, -0.94, 0.0] },
            { id: 'H-3', element: 'H', position: [2.8, 2.27, 0.0] },
            { id: 'H-4', element: 'H', position: [1.4, 3.36, 0.0] },
            { id: 'H-5', element: 'H', position: [-0.7, 3.36, 0.0] },
            { id: 'H-6', element: 'H', position: [-1.64, 1.21, 0.0] },
            { id: 'H-7', element: 'H', position: [0.7, -2.24, 0.0] },
            { id: 'H-8', element: 'H', position: [3.5, -0.86, 0.0] },
            { id: 'H-9', element: 'H', position: [3.5, 1.72, 0.0] },
            { id: 'H-10', element: 'H', position: [4.2, -0.86, 0.0] },
            { id: 'H-11', element: 'H', position: [4.2, 1.72, 0.0] },
            { id: 'H-12', element: 'H', position: [5.6, -0.94, 0.0] },
            { id: 'H-13', element: 'H', position: [6.3, 0.0, 0.0] },
            { id: 'H-14', element: 'H', position: [2.1, 2.15, 0.0] },
            { id: 'H-15', element: 'H', position: [2.1, 0.27, 0.0] },
            { id: 'H-16', element: 'H', position: [-2.3, 2.8, 0.0] }
        ],
        bonds: [
            // Benzene ring bonds (alternating single/double)
            { atom1: 'C-1', atom2: 'C-2', type: 'double' },
            { atom1: 'C-2', atom2: 'C-3', type: 'single' },
            { atom1: 'C-3', atom2: 'C-4', type: 'double' },
            { atom1: 'C-4', atom2: 'C-5', type: 'single' },
            { atom1: 'C-5', atom2: 'C-6', type: 'double' },
            { atom1: 'C-6', atom2: 'C-1', type: 'single' },
            // Pyran ring
            { atom1: 'C-6', atom2: 'O-1', type: 'single' },
            { atom1: 'O-1', atom2: 'C-7', type: 'single' },
            { atom1: 'C-7', atom2: 'C-8', type: 'single' },
            { atom1: 'C-8', atom2: 'C-2', type: 'single' },
            // Side chain
            { atom1: 'C-9', atom2: 'C-10', type: 'single' },
            { atom1: 'C-10', atom2: 'C-11', type: 'single' },
            { atom1: 'C-11', atom2: 'C-12', type: 'single' },
            { atom1: 'C-12', atom2: 'C-13', type: 'single' },
            // Methyl group
            { atom1: 'C-3', atom2: 'C-14', type: 'single' },
            // Hydroxyl group
            { atom1: 'C-5', atom2: 'O-2', type: 'single' },
            { atom1: 'O-2', atom2: 'H-16', type: 'single' },
            // Hydrogen bonds
            { atom1: 'C-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-2', atom2: 'H-2', type: 'single' },
            { atom1: 'C-3', atom2: 'H-3', type: 'single' },
            { atom1: 'C-4', atom2: 'H-4', type: 'single' },
            { atom1: 'C-5', atom2: 'H-5', type: 'single' },
            { atom1: 'C-6', atom2: 'H-6', type: 'single' },
            { atom1: 'C-7', atom2: 'H-7', type: 'single' },
            { atom1: 'C-9', atom2: 'H-8', type: 'single' },
            { atom1: 'C-10', atom2: 'H-9', type: 'single' },
            { atom1: 'C-10', atom2: 'H-10', type: 'single' },
            { atom1: 'C-11', atom2: 'H-11', type: 'single' },
            { atom1: 'C-11', atom2: 'H-12', type: 'single' },
            { atom1: 'C-13', atom2: 'H-13', type: 'single' },
            { atom1: 'C-14', atom2: 'H-14', type: 'single' },
            { atom1: 'C-14', atom2: 'H-15', type: 'single' }
        ]
    },
    'Ethanol': {
        formula: 'C₂H₅OH',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [1.5, 0.0, 0.0] },
            { id: 'O-1', element: 'O', position: [2.3, 1.2, 0.0] },
            { id: 'H-1', element: 'H', position: [-0.54, 0.86, 0.0] },
            { id: 'H-2', element: 'H', position: [-0.54, -0.86, 0.0] },
            { id: 'H-3', element: 'H', position: [0.54, 0.0, 0.86] },
            { id: 'H-4', element: 'H', position: [1.96, -0.54, 0.86] },
            { id: 'H-5', element: 'H', position: [1.96, -0.54, -0.86] },
            { id: 'H-6', element: 'H', position: [3.2, 1.2, 0.0] }
        ],
        bonds: [
            { atom1: 'C-1', atom2: 'C-2', type: 'single' },
            { atom1: 'C-2', atom2: 'O-1', type: 'single' },
            { atom1: 'C-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-1', atom2: 'H-2', type: 'single' },
            { atom1: 'C-1', atom2: 'H-3', type: 'single' },
            { atom1: 'C-2', atom2: 'H-4', type: 'single' },
            { atom1: 'C-2', atom2: 'H-5', type: 'single' },
            { atom1: 'O-1', atom2: 'H-6', type: 'single' }
        ]
    },
    'Essigsaeure': {
        formula: 'CH₃COOH',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [1.5, 0.0, 0.0] },
            { id: 'O-1', element: 'O', position: [2.2, 1.2, 0.0] },
            { id: 'O-2', element: 'O', position: [2.2, -1.2, 0.0] },
            { id: 'H-1', element: 'H', position: [-0.54, 0.86, 0.0] },
            { id: 'H-2', element: 'H', position: [-0.54, -0.86, 0.0] },
            { id: 'H-3', element: 'H', position: [0.54, 0.0, 0.86] },
            { id: 'H-4', element: 'H', position: [3.1, -1.2, 0.0] },
            { id: 'H-5', element: 'H', position: [1.9, 1.9, 0.0] }
        ],
        bonds: [
            { atom1: 'C-1', atom2: 'C-2', type: 'single' },
            { atom1: 'C-2', atom2: 'O-1', type: 'single' },
            { atom1: 'C-2', atom2: 'O-2', type: 'double' },
            { atom1: 'C-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-1', atom2: 'H-2', type: 'single' },
            { atom1: 'C-1', atom2: 'H-3', type: 'single' },
            { atom1: 'O-1', atom2: 'H-4', type: 'single' },
            { atom1: 'O-1', atom2: 'H-5', type: 'single' }
        ]
    },
    'Benzol': {
        formula: 'C₆H₆',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' }
        },
        atoms: [
            { id: 'C-1', element: 'C', position: [1.4, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [0.7, 1.21, 0.0] },
            { id: 'C-3', element: 'C', position: [-0.7, 1.21, 0.0] },
            { id: 'C-4', element: 'C', position: [-1.4, 0.0, 0.0] },
            { id: 'C-5', element: 'C', position: [-0.7, -1.21, 0.0] },
            { id: 'C-6', element: 'C', position: [0.7, -1.21, 0.0] },
            { id: 'H-1', element: 'H', position: [2.48, 0.0, 0.0] },
            { id: 'H-2', element: 'H', position: [1.24, 2.15, 0.0] },
            { id: 'H-3', element: 'H', position: [-1.24, 2.15, 0.0] },
            { id: 'H-4', element: 'H', position: [-2.48, 0.0, 0.0] },
            { id: 'H-5', element: 'H', position: [-1.24, -2.15, 0.0] },
            { id: 'H-6', element: 'H', position: [1.24, -2.15, 0.0] }
        ],
        bonds: [
            { atom1: 'C-1', atom2: 'C-2', type: 'single' },
            { atom1: 'C-2', atom2: 'C-3', type: 'double' },
            { atom1: 'C-3', atom2: 'C-4', type: 'single' },
            { atom1: 'C-4', atom2: 'C-5', type: 'double' },
            { atom1: 'C-5', atom2: 'C-6', type: 'single' },
            { atom1: 'C-6', atom2: 'C-1', type: 'double' },
            { atom1: 'C-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-2', atom2: 'H-2', type: 'single' },
            { atom1: 'C-3', atom2: 'H-3', type: 'single' },
            { atom1: 'C-4', atom2: 'H-4', type: 'single' },
            { atom1: 'C-5', atom2: 'H-5', type: 'single' },
            { atom1: 'C-6', atom2: 'H-6', type: 'single' }
        ]
    },
    'Acetylen': {
        formula: 'C₂H₂',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' }
        },
        atoms: [
            { id: 'C-1', element: 'C', position: [-0.6, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [0.6, 0.0, 0.0] },
            { id: 'H-1', element: 'H', position: [-1.56, 0.0, 0.0] },
            { id: 'H-2', element: 'H', position: [1.56, 0.0, 0.0] }
        ],
        bonds: [
            { atom1: 'C-1', atom2: 'C-2', type: 'triple' },
            { atom1: 'C-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-2', atom2: 'H-2', type: 'single' }
        ]
    },
    'Koffein': {
        formula: 'C₈H₁₀N₄O₂',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'N': { radius: 0.65, color: '#3050F8' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            // Purine ring system (simplified)
            { id: 'N-1', element: 'N', position: [0.0, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [1.3, 0.0, 0.0] },
            { id: 'N-3', element: 'N', position: [1.9, 1.1, 0.0] },
            { id: 'C-4', element: 'C', position: [1.3, 2.2, 0.0] },
            { id: 'C-5', element: 'C', position: [0.0, 2.2, 0.0] },
            { id: 'C-6', element: 'C', position: [-0.6, 1.1, 0.0] },
            // Second ring
            { id: 'N-7', element: 'N', position: [-1.9, 1.1, 0.0] },
            { id: 'C-8', element: 'C', position: [-2.5, 0.0, 0.0] },
            { id: 'N-9', element: 'N', position: [-1.9, -1.1, 0.0] },
            // Oxygen atoms (carbonyl groups)
            { id: 'O-1', element: 'O', position: [2.3, 2.2, 0.0] },
            { id: 'O-2', element: 'O', position: [-0.6, 3.3, 0.0] },
            // Methyl groups
            { id: 'C-10', element: 'C', position: [-3.0, 2.4, 0.0] },
            { id: 'C-11', element: 'C', position: [3.3, -0.5, 0.0] },
            { id: 'C-12', element: 'C', position: [-2.5, -2.2, 0.0] },
            // Hydrogen atoms (simplified - on methyl groups)
            { id: 'H-1', element: 'H', position: [-3.6, 2.4, 0.9] },
            { id: 'H-2', element: 'H', position: [-3.0, 3.5, 0.0] },
            { id: 'H-3', element: 'H', position: [-3.6, 2.4, -0.9] },
            { id: 'H-4', element: 'H', position: [3.8, -1.3, 0.0] },
            { id: 'H-5', element: 'H', position: [4.1, 0.2, 0.9] },
            { id: 'H-6', element: 'H', position: [4.1, 0.2, -0.9] },
            { id: 'H-7', element: 'H', position: [-1.8, -2.0, 0.9] },
            { id: 'H-8', element: 'H', position: [-3.3, -2.8, 0.0] },
            { id: 'H-9', element: 'H', position: [-1.8, -2.0, -0.9] },
            { id: 'H-10', element: 'H', position: [0.7, -1.1, 0.0] }
        ],
        bonds: [
            // Purine ring
            { atom1: 'N-1', atom2: 'C-2', type: 'double' },
            { atom1: 'C-2', atom2: 'N-3', type: 'single' },
            { atom1: 'N-3', atom2: 'C-4', type: 'double' },
            { atom1: 'C-4', atom2: 'C-5', type: 'single' },
            { atom1: 'C-5', atom2: 'C-6', type: 'double' },
            { atom1: 'C-6', atom2: 'N-1', type: 'single' },
            // Second ring
            { atom1: 'C-6', atom2: 'N-7', type: 'single' },
            { atom1: 'N-7', atom2: 'C-8', type: 'double' },
            { atom1: 'C-8', atom2: 'N-9', type: 'single' },
            { atom1: 'N-9', atom2: 'N-1', type: 'single' },
            // Carbonyl groups
            { atom1: 'C-4', atom2: 'O-1', type: 'double' },
            { atom1: 'C-5', atom2: 'O-2', type: 'double' },
            // Methyl groups
            { atom1: 'N-7', atom2: 'C-10', type: 'single' },
            { atom1: 'N-3', atom2: 'C-11', type: 'single' },
            { atom1: 'N-9', atom2: 'C-12', type: 'single' },
            // Hydrogen bonds
            { atom1: 'C-10', atom2: 'H-1', type: 'single' },
            { atom1: 'C-10', atom2: 'H-2', type: 'single' },
            { atom1: 'C-10', atom2: 'H-3', type: 'single' },
            { atom1: 'C-11', atom2: 'H-4', type: 'single' },
            { atom1: 'C-11', atom2: 'H-5', type: 'single' },
            { atom1: 'C-11', atom2: 'H-6', type: 'single' },
            { atom1: 'C-12', atom2: 'H-7', type: 'single' },
            { atom1: 'C-12', atom2: 'H-8', type: 'single' },
            { atom1: 'C-12', atom2: 'H-9', type: 'single' },
            { atom1: 'C-2', atom2: 'H-10', type: 'single' }
        ]
    },
    'Aspirin': {
        formula: 'C₉H₈O₄',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            // Benzene ring
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [1.4, 0.0, 0.0] },
            { id: 'C-3', element: 'C', position: [2.1, 1.21, 0.0] },
            { id: 'C-4', element: 'C', position: [1.4, 2.42, 0.0] },
            { id: 'C-5', element: 'C', position: [0.0, 2.42, 0.0] },
            { id: 'C-6', element: 'C', position: [-0.7, 1.21, 0.0] },
            // Carboxylic acid group
            { id: 'C-7', element: 'C', position: [-2.1, 1.21, 0.0] },
            { id: 'O-1', element: 'O', position: [-2.6, 2.4, 0.0] },
            { id: 'O-2', element: 'O', position: [-2.8, 0.3, 0.0] },
            // Ester group
            { id: 'C-8', element: 'C', position: [2.1, -1.21, 0.0] },
            { id: 'O-3', element: 'O', position: [3.0, -1.21, 0.0] },
            { id: 'C-9', element: 'C', position: [3.8, -2.1, 0.0] },
            { id: 'O-4', element: 'O', position: [4.9, -1.6, 0.0] },
            // Hydrogen atoms
            { id: 'H-1', element: 'H', position: [-2.0, 2.8, 0.0] },
            { id: 'H-2', element: 'H', position: [-3.7, 0.1, 0.0] },
            { id: 'H-3', element: 'H', position: [0.0, -0.94, 0.0] },
            { id: 'H-4', element: 'H', position: [2.8, 2.27, 0.0] },
            { id: 'H-5', element: 'H', position: [1.4, 3.36, 0.0] },
            { id: 'H-6', element: 'H', position: [-0.7, 3.36, 0.0] },
            { id: 'H-7', element: 'H', position: [-1.64, 1.21, 0.0] },
            { id: 'H-8', element: 'H', position: [3.6, -3.2, 0.0] },
            { id: 'H-9', element: 'H', position: [4.4, -2.7, 0.0] },
            { id: 'H-10', element: 'H', position: [3.1, -2.8, 0.0] }
        ],
        bonds: [
            // Benzene ring
            { atom1: 'C-1', atom2: 'C-2', type: 'double' },
            { atom1: 'C-2', atom2: 'C-3', type: 'single' },
            { atom1: 'C-3', atom2: 'C-4', type: 'double' },
            { atom1: 'C-4', atom2: 'C-5', type: 'single' },
            { atom1: 'C-5', atom2: 'C-6', type: 'double' },
            { atom1: 'C-6', atom2: 'C-1', type: 'single' },
            // Carboxylic acid
            { atom1: 'C-1', atom2: 'C-7', type: 'single' },
            { atom1: 'C-7', atom2: 'O-1', type: 'single' },
            { atom1: 'C-7', atom2: 'O-2', type: 'double' },
            // Ester
            { atom1: 'C-2', atom2: 'C-8', type: 'single' },
            { atom1: 'C-8', atom2: 'O-3', type: 'single' },
            { atom1: 'O-3', atom2: 'C-9', type: 'single' },
            { atom1: 'C-9', atom2: 'O-4', type: 'double' },
            // Hydrogens
            { atom1: 'O-1', atom2: 'H-1', type: 'single' },
            { atom1: 'O-2', atom2: 'H-2', type: 'single' },
            { atom1: 'C-1', atom2: 'H-3', type: 'single' },
            { atom1: 'C-3', atom2: 'H-4', type: 'single' },
            { atom1: 'C-4', atom2: 'H-5', type: 'single' },
            { atom1: 'C-5', atom2: 'H-6', type: 'single' },
            { atom1: 'C-6', atom2: 'H-7', type: 'single' },
            { atom1: 'C-9', atom2: 'H-8', type: 'single' },
            { atom1: 'C-9', atom2: 'H-9', type: 'single' },
            { atom1: 'C-9', atom2: 'H-10', type: 'single' }
        ]
    },
    'Serotonin': {
        formula: 'C₁₀H₁₂N₂O',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'N': { radius: 0.65, color: '#3050F8' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            // Indole ring system
            { id: 'N-1', element: 'N', position: [0.0, 0.0, 0.0] },
            { id: 'C-1', element: 'C', position: [1.3, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [1.9, 1.1, 0.0] },
            { id: 'C-3', element: 'C', position: [1.3, 2.2, 0.0] },
            { id: 'C-4', element: 'C', position: [0.0, 2.2, 0.0] },
            { id: 'C-5', element: 'C', position: [-0.6, 1.1, 0.0] },
            // Benzene ring
            { id: 'C-6', element: 'C', position: [-1.9, 1.1, 0.0] },
            { id: 'C-7', element: 'C', position: [-2.5, 0.0, 0.0] },
            { id: 'C-8', element: 'C', position: [-1.9, -1.1, 0.0] },
            // Hydroxy group
            { id: 'O-1', element: 'O', position: [-3.5, -1.8, 0.0] },
            // Ethylamine side chain
            { id: 'C-9', element: 'C', position: [3.3, -0.5, 0.0] },
            { id: 'C-10', element: 'C', position: [4.2, 0.6, 0.0] },
            { id: 'N-2', element: 'N', position: [5.5, 0.0, 0.0] },
            // Hydrogens
            { id: 'H-1', element: 'H', position: [-0.6, -0.9, 0.0] },
            { id: 'H-2', element: 'H', position: [1.3, 3.3, 0.0] },
            { id: 'H-3', element: 'H', position: [-3.1, 2.0, 0.0] },
            { id: 'H-4', element: 'H', position: [-3.1, -2.5, 0.0] },
            { id: 'H-5', element: 'H', position: [3.8, -1.3, 0.0] },
            { id: 'H-6', element: 'H', position: [4.2, 1.7, 0.0] },
            { id: 'H-7', element: 'H', position: [6.2, 0.9, 0.0] },
            { id: 'H-8', element: 'H', position: [5.5, -0.9, 0.0] },
            { id: 'H-9', element: 'H', position: [3.8, 1.4, 0.0] },
            { id: 'H-10', element: 'H', position: [2.9, -1.1, 0.0] }
        ],
        bonds: [
            // Indole ring
            { atom1: 'N-1', atom2: 'C-1', type: 'single' },
            { atom1: 'C-1', atom2: 'C-2', type: 'double' },
            { atom1: 'C-2', atom2: 'C-3', type: 'single' },
            { atom1: 'C-3', atom2: 'C-4', type: 'double' },
            { atom1: 'C-4', atom2: 'C-5', type: 'single' },
            { atom1: 'C-5', atom2: 'N-1', type: 'double' },
            // Benzene ring
            { atom1: 'C-5', atom2: 'C-6', type: 'single' },
            { atom1: 'C-6', atom2: 'C-7', type: 'double' },
            { atom1: 'C-7', atom2: 'C-8', type: 'single' },
            { atom1: 'C-8', atom2: 'C-5', type: 'double' },
            // Hydroxy
            { atom1: 'C-8', atom2: 'O-1', type: 'single' },
            // Side chain
            { atom1: 'C-2', atom2: 'C-9', type: 'single' },
            { atom1: 'C-9', atom2: 'C-10', type: 'single' },
            { atom1: 'C-10', atom2: 'N-2', type: 'single' },
            // Hydrogens
            { atom1: 'N-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-3', atom2: 'H-2', type: 'single' },
            { atom1: 'C-6', atom2: 'H-3', type: 'single' },
            { atom1: 'O-1', atom2: 'H-4', type: 'single' },
            { atom1: 'C-9', atom2: 'H-5', type: 'single' },
            { atom1: 'C-9', atom2: 'H-6', type: 'single' },
            { atom1: 'N-2', atom2: 'H-7', type: 'single' },
            { atom1: 'N-2', atom2: 'H-8', type: 'single' },
            { atom1: 'C-10', atom2: 'H-9', type: 'single' },
            { atom1: 'C-10', atom2: 'H-10', type: 'single' }
        ]
    },
    'Ozon': {
        formula: 'O₃',
        elements: {
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            { id: 'O-1', element: 'O', position: [0.0, 0.5, 0.0] },
            { id: 'O-2', element: 'O', position: [0.0, -0.5, 0.0] },
            { id: 'O-3', element: 'O', position: [1.2, 0.0, 0.0] }
        ],
        bonds: [
            { atom1: 'O-1', atom2: 'O-2', type: 'single' },
            { atom1: 'O-2', atom2: 'O-3', type: 'double' }
        ]
    },
    'Schwefelhexafluorid': {
        formula: 'SF₆',
        elements: {
            'S': { radius: 0.9, color: '#FFFF30' },
            'F': { radius: 0.5, color: '#90E050' }
        },
        atoms: [
            { id: 'S-1', element: 'S', position: [0.0, 0.0, 0.0] },
            { id: 'F-1', element: 'F', position: [1.5, 0.0, 0.0] },
            { id: 'F-2', element: 'F', position: [-1.5, 0.0, 0.0] },
            { id: 'F-3', element: 'F', position: [0.0, 1.5, 0.0] },
            { id: 'F-4', element: 'F', position: [0.0, -1.5, 0.0] },
            { id: 'F-5', element: 'F', position: [0.0, 0.0, 1.5] },
            { id: 'F-6', element: 'F', position: [0.0, 0.0, -1.5] }
        ],
        bonds: [
            { atom1: 'S-1', atom2: 'F-1', type: 'single' },
            { atom1: 'S-1', atom2: 'F-2', type: 'single' },
            { atom1: 'S-1', atom2: 'F-3', type: 'single' },
            { atom1: 'S-1', atom2: 'F-4', type: 'single' },
            { atom1: 'S-1', atom2: 'F-5', type: 'single' },
            { atom1: 'S-1', atom2: 'F-6', type: 'single' }
        ]
    },
    'Glucose': {
        formula: 'C₆H₁₂O₆',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            // Pyranose ring (simplified - chair conformation approximation)
            { id: 'O-1', element: 'O', position: [0.0, 0.0, 0.0] },
            { id: 'C-1', element: 'C', position: [1.4, 0.3, 0.0] },
            { id: 'C-2', element: 'C', position: [2.1, 1.4, 0.0] },
            { id: 'C-3', element: 'C', position: [1.4, 2.5, 0.0] },
            { id: 'C-4', element: 'C', position: [0.0, 2.8, 0.0] },
            { id: 'C-5', element: 'C', position: [-0.7, 1.7, 0.0] },
            // Ring oxygen
            { id: 'O-2', element: 'O', position: [-0.7, 0.5, 0.0] },
            // Hydroxyl groups and CH2OH
            { id: 'O-3', element: 'O', position: [2.8, -0.3, 0.0] },
            { id: 'O-4', element: 'O', position: [3.3, 1.7, 0.0] },
            { id: 'O-5', element: 'O', position: [2.1, 3.5, 0.0] },
            { id: 'O-6', element: 'O', position: [-0.7, 3.9, 0.0] },
            { id: 'C-6', element: 'C', position: [-1.9, 2.1, 0.0] },
            { id: 'O-7', element: 'O', position: [-2.8, 3.0, 0.0] },
            // Hydrogens (simplified - one per carbon/oxygen where applicable)
            { id: 'H-1', element: 'H', position: [3.5, -0.6, 0.0] },
            { id: 'H-2', element: 'H', position: [4.2, 1.5, 0.0] },
            { id: 'H-3', element: 'H', position: [2.6, 4.2, 0.0] },
            { id: 'H-4', element: 'H', position: [-1.4, 4.6, 0.0] },
            { id: 'H-5', element: 'H', position: [-1.8, 1.0, 0.0] },
            { id: 'H-6', element: 'H', position: [-2.6, 2.0, 0.8] },
            { id: 'H-7', element: 'H', position: [-3.5, 2.9, 0.0] },
            { id: 'H-8', element: 'H', position: [0.9, -0.6, 0.0] },
            { id: 'H-9', element: 'H', position: [2.4, 0.7, 0.9] },
            { id: 'H-10', element: 'H', position: [1.8, 2.0, 0.9] },
            { id: 'H-11', element: 'H', position: [0.5, 2.3, 0.9] },
            { id: 'H-12', element: 'H', position: [-0.2, 1.6, 0.9] }
        ],
        bonds: [
            // Pyranose ring
            { atom1: 'O-1', atom2: 'C-1', type: 'single' },
            { atom1: 'C-1', atom2: 'C-2', type: 'single' },
            { atom1: 'C-2', atom2: 'C-3', type: 'single' },
            { atom1: 'C-3', atom2: 'C-4', type: 'single' },
            { atom1: 'C-4', atom2: 'C-5', type: 'single' },
            { atom1: 'C-5', atom2: 'O-2', type: 'single' },
            { atom1: 'O-2', atom2: 'C-1', type: 'single' },
            // Hydroxyl groups
            { atom1: 'C-1', atom2: 'O-3', type: 'single' },
            { atom1: 'C-2', atom2: 'O-4', type: 'single' },
            { atom1: 'C-3', atom2: 'O-5', type: 'single' },
            { atom1: 'C-4', atom2: 'O-6', type: 'single' },
            // CH2OH group
            { atom1: 'C-5', atom2: 'C-6', type: 'single' },
            { atom1: 'C-6', atom2: 'O-7', type: 'single' },
            // Hydrogens
            { atom1: 'O-3', atom2: 'H-1', type: 'single' },
            { atom1: 'O-4', atom2: 'H-2', type: 'single' },
            { atom1: 'O-5', atom2: 'H-3', type: 'single' },
            { atom1: 'O-6', atom2: 'H-4', type: 'single' },
            { atom1: 'C-5', atom2: 'H-5', type: 'single' },
            { atom1: 'C-6', atom2: 'H-6', type: 'single' },
            { atom1: 'O-7', atom2: 'H-7', type: 'single' },
            { atom1: 'O-1', atom2: 'H-8', type: 'single' },
            { atom1: 'C-1', atom2: 'H-9', type: 'single' },
            { atom1: 'C-2', atom2: 'H-10', type: 'single' },
            { atom1: 'C-3', atom2: 'H-11', type: 'single' },
            { atom1: 'C-4', atom2: 'H-12', type: 'single' }
        ]
    },
    'Cyanwasserstoff': {
        formula: 'HCN',
        wikipedia: 'https://de.wikipedia.org/wiki/Blaus%C3%A4ure',
        elements: {
            'H': { radius: 0.3, color: '#FFFFFF' },
            'C': { radius: 0.7, color: '#909090' },
            'N': { radius: 0.65, color: '#3050F8' }
        },
        atoms: [
            { id: 'H-1', element: 'H', position: [-1.06, 0.0, 0.0] },
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'N-1', element: 'N', position: [1.13, 0.0, 0.0] }
        ],
        bonds: [
            { atom1: 'H-1', atom2: 'C-1', type: 'single' },
            { atom1: 'C-1', atom2: 'N-1', type: 'triple' }
        ]
    },
    'Schwefelwasserstoff': {
        formula: 'H₂S',
        wikipedia: 'https://de.wikipedia.org/wiki/Schwefelwasserstoff',
        elements: {
            'H': { radius: 0.3, color: '#FFFFFF' },
            'S': { radius: 0.9, color: '#FFFF30' }
        },
        atoms: [
            { id: 'S-1', element: 'S', position: [0.0, 0.0, 0.0] },
            { id: 'H-1', element: 'H', position: [0.97, 0.0, 0.93] },
            { id: 'H-2', element: 'H', position: [-0.97, 0.0, 0.93] }
        ],
        bonds: [
            { atom1: 'S-1', atom2: 'H-1', type: 'single' },
            { atom1: 'S-1', atom2: 'H-2', type: 'single' }
        ]
    },
    'Salpetersaeure': {
        formula: 'HNO₃',
        wikipedia: 'https://de.wikipedia.org/wiki/Salpeters%C3%A4ure',
        elements: {
            'H': { radius: 0.3, color: '#FFFFFF' },
            'N': { radius: 0.65, color: '#3050F8' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            { id: 'N-1', element: 'N', position: [0.0, 0.0, 0.0] },
            { id: 'O-1', element: 'O', position: [1.2, 0.0, 0.0] },
            { id: 'O-2', element: 'O', position: [-0.6, 1.04, 0.0] },
            { id: 'O-3', element: 'O', position: [-0.6, -1.04, 0.0] },
            { id: 'H-1', element: 'H', position: [-1.5, -1.3, 0.0] }
        ],
        bonds: [
            { atom1: 'N-1', atom2: 'O-1', type: 'double' },
            { atom1: 'N-1', atom2: 'O-2', type: 'single' },
            { atom1: 'N-1', atom2: 'O-3', type: 'single' },
            { atom1: 'O-3', atom2: 'H-1', type: 'single' }
        ]
    },
    'Formaldehyd': {
        formula: 'CH₂O',
        wikipedia: 'https://de.wikipedia.org/wiki/Formaldehyd',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'O-1', element: 'O', position: [1.2, 0.0, 0.0] },
            { id: 'H-1', element: 'H', position: [-0.54, 0.94, 0.0] },
            { id: 'H-2', element: 'H', position: [-0.54, -0.94, 0.0] }
        ],
        bonds: [
            { atom1: 'C-1', atom2: 'O-1', type: 'double' },
            { atom1: 'C-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-1', atom2: 'H-2', type: 'single' }
        ]
    },
    'Harnstoff': {
        formula: 'CH₄N₂O',
        wikipedia: 'https://de.wikipedia.org/wiki/Harnstoff',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'N': { radius: 0.65, color: '#3050F8' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'O-1', element: 'O', position: [1.2, 0.0, 0.0] },
            { id: 'N-1', element: 'N', position: [-0.6, 1.04, 0.0] },
            { id: 'N-2', element: 'N', position: [-0.6, -1.04, 0.0] },
            { id: 'H-1', element: 'H', position: [-0.6, 1.94, 0.9] },
            { id: 'H-2', element: 'H', position: [-1.5, 1.2, 0.0] },
            { id: 'H-3', element: 'H', position: [-0.6, -1.94, 0.0] },
            { id: 'H-4', element: 'H', position: [-1.5, -1.2, 0.0] }
        ],
        bonds: [
            { atom1: 'C-1', atom2: 'O-1', type: 'double' },
            { atom1: 'C-1', atom2: 'N-1', type: 'single' },
            { atom1: 'C-1', atom2: 'N-2', type: 'single' },
            { atom1: 'N-1', atom2: 'H-1', type: 'single' },
            { atom1: 'N-1', atom2: 'H-2', type: 'single' },
            { atom1: 'N-2', atom2: 'H-3', type: 'single' },
            { atom1: 'N-2', atom2: 'H-4', type: 'single' }
        ]
    },
    'Nikotin': {
        formula: 'C₁₀H₁₄N₂',
        wikipedia: 'https://de.wikipedia.org/wiki/Nikotin',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'N': { radius: 0.65, color: '#3050F8' }
        },
        atoms: [
            // Pyridine ring
            { id: 'N-1', element: 'N', position: [0.0, 0.0, 0.0] },
            { id: 'C-1', element: 'C', position: [1.3, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [2.0, 1.1, 0.0] },
            { id: 'C-3', element: 'C', position: [1.3, 2.2, 0.0] },
            { id: 'C-4', element: 'C', position: [0.0, 2.2, 0.0] },
            { id: 'C-5', element: 'C', position: [-0.6, 1.1, 0.0] },
            // Pyrrolidine ring
            { id: 'N-2', element: 'N', position: [-2.0, 1.1, 0.0] },
            { id: 'C-6', element: 'C', position: [-2.6, 0.0, 0.0] },
            { id: 'C-7', element: 'C', position: [-2.0, -1.1, 0.0] },
            { id: 'C-8', element: 'C', position: [-0.6, -1.1, 0.0] },
            // Methyl group
            { id: 'C-9', element: 'C', position: [3.5, 1.1, 0.0] },
            // Hydrogens (simplified)
            { id: 'H-1', element: 'H', position: [1.3, -0.94, 0.0] },
            { id: 'H-2', element: 'H', position: [2.8, 1.1, 0.0] },
            { id: 'H-3', element: 'H', position: [1.8, 3.1, 0.0] },
            { id: 'H-4', element: 'H', position: [-0.5, 3.1, 0.0] },
            { id: 'H-5', element: 'H', position: [-2.8, 2.0, 0.0] },
            { id: 'H-6', element: 'H', position: [-3.6, 0.0, 0.9] },
            { id: 'H-7', element: 'H', position: [-3.6, 0.0, -0.9] },
            { id: 'H-8', element: 'H', position: [-2.3, -2.0, 0.0] },
            { id: 'H-9', element: 'H', position: [0.2, -1.9, 0.0] },
            { id: 'H-10', element: 'H', position: [3.9, 1.9, 0.0] },
            { id: 'H-11', element: 'H', position: [3.9, 0.2, 0.9] },
            { id: 'H-12', element: 'H', position: [3.9, 0.2, -0.9] }
        ],
        bonds: [
            // Pyridine ring
            { atom1: 'N-1', atom2: 'C-1', type: 'single' },
            { atom1: 'C-1', atom2: 'C-2', type: 'double' },
            { atom1: 'C-2', atom2: 'C-3', type: 'single' },
            { atom1: 'C-3', atom2: 'C-4', type: 'double' },
            { atom1: 'C-4', atom2: 'C-5', type: 'single' },
            { atom1: 'C-5', atom2: 'N-1', type: 'double' },
            // Pyrrolidine ring
            { atom1: 'C-5', atom2: 'C-8', type: 'single' },
            { atom1: 'C-8', atom2: 'C-7', type: 'single' },
            { atom1: 'C-7', atom2: 'C-6', type: 'single' },
            { atom1: 'C-6', atom2: 'N-2', type: 'single' },
            { atom1: 'N-2', atom2: 'C-5', type: 'single' },
            // Methyl group
            { atom1: 'C-2', atom2: 'C-9', type: 'single' },
            // Hydrogens
            { atom1: 'C-1', atom2: 'H-1', type: 'single' },
            { atom1: 'C-2', atom2: 'H-2', type: 'single' },
            { atom1: 'C-3', atom2: 'H-3', type: 'single' },
            { atom1: 'C-4', atom2: 'H-4', type: 'single' },
            { atom1: 'N-2', atom2: 'H-5', type: 'single' },
            { atom1: 'C-6', atom2: 'H-6', type: 'single' },
            { atom1: 'C-6', atom2: 'H-7', type: 'single' },
            { atom1: 'C-7', atom2: 'H-8', type: 'single' },
            { atom1: 'C-8', atom2: 'H-9', type: 'single' },
            { atom1: 'C-9', atom2: 'H-10', type: 'single' },
            { atom1: 'C-9', atom2: 'H-11', type: 'single' },
            { atom1: 'C-9', atom2: 'H-12', type: 'single' }
        ]
    },
    'Adrenalin': {
        formula: 'C₉H₁₃NO₃',
        wikipedia: 'https://de.wikipedia.org/wiki/Adrenalin',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'N': { radius: 0.65, color: '#3050F8' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            // Benzene ring
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [1.4, 0.0, 0.0] },
            { id: 'C-3', element: 'C', position: [2.1, 1.21, 0.0] },
            { id: 'C-4', element: 'C', position: [1.4, 2.42, 0.0] },
            { id: 'C-5', element: 'C', position: [0.0, 2.42, 0.0] },
            { id: 'C-6', element: 'C', position: [-0.7, 1.21, 0.0] },
            // Hydroxyl groups on benzene
            { id: 'O-1', element: 'O', position: [3.3, 1.21, 0.0] },
            { id: 'O-2', element: 'O', position: [-1.7, 2.42, 0.0] },
            // Side chain
            { id: 'C-7', element: 'C', position: [-0.7, -1.3, 0.0] },
            { id: 'C-8', element: 'C', position: [-2.2, -1.8, 0.0] },
            { id: 'N-1', element: 'N', position: [-2.9, -0.6, 0.0] },
            { id: 'C-9', element: 'C', position: [-4.3, -0.6, 0.0] },
            // Third hydroxyl
            { id: 'O-3', element: 'O', position: [-2.0, -3.2, 0.0] },
            // Hydrogens (simplified)
            { id: 'H-1', element: 'H', position: [3.8, 2.1, 0.0] },
            { id: 'H-2', element: 'H', position: [-2.2, 3.3, 0.0] },
            { id: 'H-3', element: 'H', position: [-2.8, -3.5, 0.0] },
            { id: 'H-4', element: 'H', position: [0.0, -0.94, 0.0] },
            { id: 'H-5', element: 'H', position: [-4.8, 0.3, 0.9] },
            { id: 'H-6', element: 'H', position: [-4.8, 0.3, -0.9] },
            { id: 'H-7', element: 'H', position: [-4.6, -1.6, 0.0] },
            { id: 'H-8', element: 'H', position: [-2.7, 0.3, 0.9] },
            { id: 'H-9', element: 'H', position: [-2.7, 0.3, -0.9] },
            { id: 'H-10', element: 'H', position: [-1.4, -2.4, 0.9] },
            { id: 'H-11', element: 'H', position: [-1.4, -2.4, -0.9] },
            { id: 'H-12', element: 'H', position: [-0.6, 3.36, 0.0] },
            { id: 'H-13', element: 'H', position: [2.34, -0.94, 0.0] }
        ],
        bonds: [
            // Benzene ring
            { atom1: 'C-1', atom2: 'C-2', type: 'double' },
            { atom1: 'C-2', atom2: 'C-3', type: 'single' },
            { atom1: 'C-3', atom2: 'C-4', type: 'double' },
            { atom1: 'C-4', atom2: 'C-5', type: 'single' },
            { atom1: 'C-5', atom2: 'C-6', type: 'double' },
            { atom1: 'C-6', atom2: 'C-1', type: 'single' },
            // Hydroxyl groups
            { atom1: 'C-3', atom2: 'O-1', type: 'single' },
            { atom1: 'C-5', atom2: 'O-2', type: 'single' },
            { atom1: 'C-8', atom2: 'O-3', type: 'single' },
            // Side chain
            { atom1: 'C-6', atom2: 'C-7', type: 'single' },
            { atom1: 'C-7', atom2: 'C-8', type: 'single' },
            { atom1: 'C-8', atom2: 'N-1', type: 'single' },
            { atom1: 'N-1', atom2: 'C-9', type: 'single' },
            // Hydrogens
            { atom1: 'O-1', atom2: 'H-1', type: 'single' },
            { atom1: 'O-2', atom2: 'H-2', type: 'single' },
            { atom1: 'O-3', atom2: 'H-3', type: 'single' },
            { atom1: 'C-1', atom2: 'H-4', type: 'single' },
            { atom1: 'C-9', atom2: 'H-5', type: 'single' },
            { atom1: 'C-9', atom2: 'H-6', type: 'single' },
            { atom1: 'C-9', atom2: 'H-7', type: 'single' },
            { atom1: 'N-1', atom2: 'H-8', type: 'single' },
            { atom1: 'N-1', atom2: 'H-9', type: 'single' },
            { atom1: 'C-8', atom2: 'H-10', type: 'single' },
            { atom1: 'C-8', atom2: 'H-11', type: 'single' },
            { atom1: 'C-5', atom2: 'H-12', type: 'single' },
            { atom1: 'C-2', atom2: 'H-13', type: 'single' }
        ]
    },
    'Dopamin': {
        formula: 'C₈H₁₁NO₂',
        wikipedia: 'https://de.wikipedia.org/wiki/Dopamin',
        elements: {
            'C': { radius: 0.7, color: '#909090' },
            'H': { radius: 0.3, color: '#FFFFFF' },
            'N': { radius: 0.65, color: '#3050F8' },
            'O': { radius: 0.6, color: '#FF0D0D' }
        },
        atoms: [
            // Benzene ring
            { id: 'C-1', element: 'C', position: [0.0, 0.0, 0.0] },
            { id: 'C-2', element: 'C', position: [1.4, 0.0, 0.0] },
            { id: 'C-3', element: 'C', position: [2.1, 1.21, 0.0] },
            { id: 'C-4', element: 'C', position: [1.4, 2.42, 0.0] },
            { id: 'C-5', element: 'C', position: [0.0, 2.42, 0.0] },
            { id: 'C-6', element: 'C', position: [-0.7, 1.21, 0.0] },
            // Hydroxyl groups
            { id: 'O-1', element: 'O', position: [3.3, 1.21, 0.0] },
            { id: 'O-2', element: 'O', position: [-1.7, 2.42, 0.0] },
            // Ethylamine side chain
            { id: 'C-7', element: 'C', position: [-0.7, -1.3, 0.0] },
            { id: 'C-8', element: 'C', position: [-2.2, -1.8, 0.0] },
            { id: 'N-1', element: 'N', position: [-3.0, -0.8, 0.0] },
            // Hydrogens (simplified)
            { id: 'H-1', element: 'H', position: [3.8, 2.1, 0.0] },
            { id: 'H-2', element: 'H', position: [-2.2, 3.3, 0.0] },
            { id: 'H-3', element: 'H', position: [0.0, -0.94, 0.0] },
            { id: 'H-4', element: 'H', position: [-3.9, -0.6, 0.0] },
            { id: 'H-5', element: 'H', position: [-2.8, -2.8, 0.0] },
            { id: 'H-6', element: 'H', position: [-1.4, -2.4, 0.9] },
            { id: 'H-7', element: 'H', position: [-1.4, -2.4, -0.9] },
            { id: 'H-8', element: 'H', position: [-0.6, 3.36, 0.0] },
            { id: 'H-9', element: 'H', position: [2.34, -0.94, 0.0] },
            { id: 'H-10', element: 'H', position: [-2.7, 0.2, 0.9] },
            { id: 'H-11', element: 'H', position: [-2.7, 0.2, -0.9] }
        ],
        bonds: [
            // Benzene ring
            { atom1: 'C-1', atom2: 'C-2', type: 'double' },
            { atom1: 'C-2', atom2: 'C-3', type: 'single' },
            { atom1: 'C-3', atom2: 'C-4', type: 'double' },
            { atom1: 'C-4', atom2: 'C-5', type: 'single' },
            { atom1: 'C-5', atom2: 'C-6', type: 'double' },
            { atom1: 'C-6', atom2: 'C-1', type: 'single' },
            // Hydroxyl groups
            { atom1: 'C-3', atom2: 'O-1', type: 'single' },
            { atom1: 'C-5', atom2: 'O-2', type: 'single' },
            // Side chain
            { atom1: 'C-6', atom2: 'C-7', type: 'single' },
            { atom1: 'C-7', atom2: 'C-8', type: 'single' },
            { atom1: 'C-8', atom2: 'N-1', type: 'single' },
            // Hydrogens
            { atom1: 'O-1', atom2: 'H-1', type: 'single' },
            { atom1: 'O-2', atom2: 'H-2', type: 'single' },
            { atom1: 'C-1', atom2: 'H-3', type: 'single' },
            { atom1: 'N-1', atom2: 'H-4', type: 'single' },
            { atom1: 'C-8', atom2: 'H-5', type: 'single' },
            { atom1: 'C-8', atom2: 'H-6', type: 'single' },
            { atom1: 'C-8', atom2: 'H-7', type: 'single' },
            { atom1: 'C-5', atom2: 'H-8', type: 'single' },
            { atom1: 'C-2', atom2: 'H-9', type: 'single' },
            { atom1: 'N-1', atom2: 'H-10', type: 'single' },
            { atom1: 'N-1', atom2: 'H-11', type: 'single' }
        ]
    }
};

function init() {
    console.log('Init function called');

    // Hide loading message
    const loadingMsg = document.getElementById('js-loading');
    if (loadingMsg) {
        loadingMsg.style.display = 'none';
    }

    // DOM Elemente abrufen
    container = document.getElementById('molecule-studio-container');
    canvas = document.getElementById('molecule-canvas');
    moleculeInput = document.getElementById('molecule-input');
    visualizeBtn = document.getElementById('visualize-btn');
    moleculeInfo = document.getElementById('molecule-info');
    errorMessage = document.getElementById('error-message');
    welcomeScreen = document.getElementById('welcome-screen');
    loadingScreen = document.getElementById('loading-screen');
    controlsInfo = document.getElementById('controls-info');
    autoRotateCheckbox = document.getElementById('auto-rotate');

    console.log('DOM elements:', { container, canvas, moleculeInput, visualizeBtn });

    if (!container || !canvas || !moleculeInput || !visualizeBtn) {
        console.error('Ein oder mehrere Elemente nicht gefunden!');
        showError('Die erforderlichen HTML-Elemente wurden nicht gefunden. Bitte laden Sie die Seite neu.');
        return;
    }

    try {
        console.log('Molekülstudio wird initialisiert...');
        window.moleculeStudioInitialized = true;
        window.moleculeStudioLoaded = true; // Ensure this is set

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8f5e9);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight || 1,
        0.1,
        1000
    );
    camera.position.z = 10;

    // Renderer
    console.log('Creating WebGL renderer...');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    updateRendererSize();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    console.log('Renderer created:', renderer);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Event Listeners
    setupEventListeners();

    // Setup ResizeObserver for better responsiveness
    setupResizeObserver();

    // Animation
    animate();

    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        window.moleculeStudioError = error;
        showError('Fehler beim Laden der 3D-Grafik: ' + error.message);
    }
}

function showError(message) {
    console.error('showError called:', message);

    // Hide loading screen
    if (loadingScreen && loadingScreen.parentNode) {
        loadingScreen.style.display = 'none';
    }

    // Hide welcome screen
    if (welcomeScreen && welcomeScreen.parentNode) {
        welcomeScreen.style.display = 'none';
    }

    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 20px;
        border-radius: 8px;
        margin: 20px;
        border: 2px solid #f5c6cb;
        text-align: center;
    `;
    errorDiv.innerHTML = `
        <h3>⚠️ Fehler</h3>
        <p>${message}</p>
        <p><small>Bitte stellen Sie sicher, dass JavaScript aktiviert ist und versuchen Sie es erneut.</small></p>
        <button class="btn btn-primary" onclick="location.reload()">Neu laden</button>
    `;

    if (container) {
        container.appendChild(errorDiv);
    }

    // Also try to show in error-message element if it exists
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

function updateRendererSize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }
}

function setupResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
        updateRendererSize();
    });
    resizeObserver.observe(container);
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Visualize button
    visualizeBtn.addEventListener('click', () => {
        console.log('Visualize button clicked');
        const moleculeName = moleculeInput.value.trim();
        if (moleculeName) {
            visualizeMolecule(moleculeName);
        }
    });

    // Enter key
    moleculeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const moleculeName = moleculeInput.value.trim();
            if (moleculeName) {
                visualizeMolecule(moleculeName);
            }
        }
    });

    // Suggestion chips - only add listeners if not already added by early-init script
    const chipsWithoutListeners = Array.from(document.querySelectorAll('.suggestion-chip'))
        .filter(chip => !chip.hasAttribute('data-listener-attached'));

    chipsWithoutListeners.forEach(chip => {
        chip.addEventListener('click', () => {
            const molecule = chip.dataset.molecule;
            moleculeInput.value = molecule;
            visualizeMolecule(molecule);
        });
        chip.setAttribute('data-listener-attached', 'true');
    });

    // Auto-rotate toggle
    autoRotateCheckbox.addEventListener('change', (e) => {
        autoRotate = e.target.checked;
    });

    // Mouse controls
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel);

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
    autoRotate = false;
    autoRotateCheckbox.checked = false;
}

function onMouseUp() {
    isDragging = false;
}

function onMouseMove(event) {
    if (!isDragging || !moleculeGroup) return;

    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    moleculeGroup.rotation.y += deltaX * 0.01;
    moleculeGroup.rotation.x += deltaY * 0.01;

    previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onWheel(event) {
    event.preventDefault();
    camera.position.z += event.deltaY * 0.01;
    camera.position.z = Math.max(3, Math.min(30, camera.position.z));
}

function onWindowResize() {
    updateRendererSize();
}

function visualizeMolecule(name) {
    showError('');
    const data = moleculeData[name];

    if (!data) {
        showError(`Molekül "${name}" nicht gefunden. Versuchen Sie: Wasser, Methan, Ammoniak, Kohlendioxid, Ethen, Ethanol, Essigsäure, Benzol, Acetylen, Koffein, Aspirin, Serotonin, Ozon, Schwefelhexafluorid oder Glucose.`);
        return;
    }

    showLoading(true);

    setTimeout(() => {
        renderMolecule(data);
        showMoleculeInfo(data);
        showLoading(false);
        welcomeScreen.style.display = 'none';
        controlsInfo.style.display = 'block';
    }, 500);
}

function renderMolecule(data) {
    // Clear previous molecule
    if (moleculeGroup) {
        scene.remove(moleculeGroup);
    }

    moleculeGroup = new THREE.Group();

    // Create atom map
    const atomMap = new Map();

    // Create atoms
    data.atoms.forEach(atom => {
        const elementInfo = data.elements[atom.element];
        if (!elementInfo) return;

        const color = parseInt(elementInfo.color.replace('#', '0x'));
        const radius = elementInfo.radius;

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshLambertMaterial({ color });
        const sphere = new THREE.Mesh(geometry, material);

        sphere.position.set(...atom.position);
        sphere.castShadow = true;
        sphere.receiveShadow = true;

        moleculeGroup.add(sphere);
        atomMap.set(atom.id, atom);
    });

    // Create bonds
    data.bonds.forEach(bond => {
        const atom1 = atomMap.get(bond.atom1);
        const atom2 = atomMap.get(bond.atom2);

        if (!atom1 || !atom2) return;

        const start = new THREE.Vector3(...atom1.position);
        const end = new THREE.Vector3(...atom2.position);
        const direction = new THREE.Vector3().subVectors(end, start);
        const distance = direction.length();

        if (bond.type === 'single') {
            const cylinder = createBondCylinder(start, end, distance, 0.05);
            moleculeGroup.add(cylinder);
        } else if (bond.type === 'double') {
            const offset = 0.08;
            const perpendicular = calculatePerpendicular(direction);
            const midpoint = new THREE.Vector3().copy(start).add(end).divideScalar(2);

            const cylinder1 = createBondCylinder(
                start.clone().add(perpendicular.clone().multiplyScalar(offset / distance)),
                end.clone().add(perpendicular.clone().multiplyScalar(offset / distance)),
                distance,
                0.04
            );
            const cylinder2 = createBondCylinder(
                start.clone().sub(perpendicular.clone().multiplyScalar(offset / distance)),
                end.clone().sub(perpendicular.clone().multiplyScalar(offset / distance)),
                distance,
                0.04
            );
            moleculeGroup.add(cylinder1);
            moleculeGroup.add(cylinder2);
        } else if (bond.type === 'triple') {
            const offset = 0.1;
            const perpendicular = calculatePerpendicular(direction);

            // Central bond
            const centerCylinder = createBondCylinder(start, end, distance, 0.04);
            moleculeGroup.add(centerCylinder);

            // Two outer bonds
            const cylinder1 = createBondCylinder(
                start.clone().add(perpendicular.clone().multiplyScalar(offset / distance)),
                end.clone().add(perpendicular.clone().multiplyScalar(offset / distance)),
                distance,
                0.03
            );
            const cylinder2 = createBondCylinder(
                start.clone().sub(perpendicular.clone().multiplyScalar(offset / distance)),
                end.clone().sub(perpendicular.clone().multiplyScalar(offset / distance)),
                distance,
                0.03
            );
            moleculeGroup.add(cylinder1);
            moleculeGroup.add(cylinder2);
        }
    });

    scene.add(moleculeGroup);

    // Center and fit to view
    const box = new THREE.Box3().setFromObject(moleculeGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    moleculeGroup.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.5;

    camera.position.set(0, 0, Math.max(distance, 5));
    camera.lookAt(0, 0, 0);

    // Reset rotation
    moleculeGroup.rotation.set(0, 0, 0);
    autoRotate = true;
    autoRotateCheckbox.checked = true;
}

function createBondCylinder(start, end, distance, radius) {
    const geometry = new THREE.CylinderGeometry(radius, radius, distance, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const cylinder = new THREE.Mesh(geometry, material);

    cylinder.position.copy(start).add(end).divideScalar(2);
    cylinder.lookAt(end);
    cylinder.rotateX(Math.PI / 2);

    return cylinder;
}

function calculatePerpendicular(direction) {
    if (Math.abs(direction.y) < 0.9) {
        return new THREE.Vector3(0, 1, 0).cross(direction).normalize();
    } else {
        return new THREE.Vector3(1, 0, 0).cross(direction).normalize();
    }
}

function showLoading(show) {
    loadingScreen.style.display = show ? 'flex' : 'none';
    visualizeBtn.disabled = show;
}

function showMoleculeInfo(data) {
    let infoHtml = 'Formel: ' + data.formula + ' • Atome: ' + data.atoms.length + ' • Bindungen: ' + data.bonds.length;

    // Add Wikipedia link if available
    if (data.wikipedia) {
        infoHtml += '<br><a href="' + data.wikipedia + '" target="_blank" rel="noopener noreferrer" style="color: #4caf50; text-decoration: none; font-size: 0.9em;">📚 Wikipedia: ' + data.formula + '</a>';
    }

    moleculeInfo.innerHTML = infoHtml;
    moleculeInfo.style.display = 'block';
}


function animate() {
    requestAnimationFrame(animate);

    if (autoRotate && moleculeGroup) {
        moleculeGroup.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}

console.log('Animation loop function defined');

// Warte bis DOM geladen ist, dann initialisiere
console.log('Document ready state:', document.readyState);

// Warte bis DOM geladen ist, dann initialisiere
if (document.readyState === 'loading') {
    console.log('Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired, calling init()');
        init();
    });
} else {
    console.log('DOM already loaded, calling init() immediately');
    init();
}

// Process any molecules that were queued before the module loaded
setTimeout(() => {
    if (window.moleculeStudioQueue && window.moleculeStudioQueue.length > 0) {
        console.log('Processing queued molecules:', window.moleculeStudioQueue);

        // Process each queued molecule
        window.moleculeStudioQueue.forEach(molecule => {
            if (moleculeData[molecule]) {
                console.log('Visualizing queued molecule:', molecule);
                visualizeMolecule(molecule);
            }
        });

        // Clear the queue
        window.moleculeStudioQueue = [];
    }
}, 100);

// Export visualizeMolecule to window for early-init access
window.visualizeMolecule = visualizeMolecule;

// Export moleculeData for testing
window.moleculeData = moleculeData;

// Process any molecules that were queued before the module loaded
function processQueue() {
    if (window.moleculeStudioQueue && window.moleculeStudioQueue.length > 0) {
        console.log('Processing queued molecules:', window.moleculeStudioQueue);

        // Process each queued molecule
        while (window.moleculeStudioQueue.length > 0) {
            const molecule = window.moleculeStudioQueue.shift();
            if (moleculeData[molecule]) {
                console.log('Visualizing queued molecule:', molecule);
                visualizeMolecule(molecule);
            } else {
                console.warn('Molecule not found in data:', molecule);
            }
        }
    }
}

// Process queue immediately
processQueue();

// Also set up an interval to process any new queue items (for clicks during init)
let queueChecker = setInterval(() => {
    if (window.moleculeStudioInitialized && window.moleculeStudioQueue.length > 0) {
        processQueue();
    }
}, 100);

// Clear interval after 5 seconds
setTimeout(() => {
    clearInterval(queueChecker);
}, 5000);

// Cleanup on page navigation to prevent memory leaks
window.addEventListener('beforeunload', () => {
    clearInterval(queueChecker);
});
