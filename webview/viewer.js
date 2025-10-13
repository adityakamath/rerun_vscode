"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web_viewer_1 = require("@rerun-io/web-viewer");
const vscode = acquireVsCodeApi();
let viewer = null;
// Initialize the viewer
async function initViewer() {
    const container = document.getElementById('rerun-container');
    if (!container) {
        console.error('Container not found');
        return;
    }
    try {
        viewer = new web_viewer_1.WebViewer();
        await viewer.start(null, container);
        console.log('Rerun viewer started');
        // Listen for selection changes
        viewer.on('selection_change', (event) => {
            vscode.postMessage({
                type: 'selectionChange',
                items: event.items
            });
        });
    }
    catch (error) {
        console.error('Failed to start viewer:', error);
        vscode.postMessage({
            type: 'showError',
            message: `Failed to start viewer: ${error}`
        });
    }
}
// Handle messages from the extension
window.addEventListener('message', async (event) => {
    const message = event.data;
    switch (message.type) {
        case 'loadFile':
            if (viewer && message.url) {
                try {
                    await viewer.open(message.url);
                }
                catch (error) {
                    console.error('Failed to load file:', error);
                    vscode.postMessage({
                        type: 'showError',
                        message: `Failed to load file: ${error}`
                    });
                }
            }
            break;
        case 'connectUrl':
            if (viewer && message.url) {
                try {
                    await viewer.open(message.url);
                }
                catch (error) {
                    console.error('Failed to connect:', error);
                    vscode.postMessage({
                        type: 'showError',
                        message: `Failed to connect: ${error}`
                    });
                }
            }
            break;
        case 'loadData':
            if (viewer && message.data) {
                try {
                    // Convert base64 to blob URL
                    const binaryString = atob(message.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'application/octet-stream' });
                    const blobUrl = URL.createObjectURL(blob);
                    await viewer.open(blobUrl);
                }
                catch (error) {
                    console.error('Failed to load data:', error);
                    vscode.postMessage({
                        type: 'showError',
                        message: `Failed to load data: ${error}`
                    });
                }
            }
            break;
    }
});
// Toolbar button handlers
document.getElementById('load-file-btn')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'selectFile' });
});
document.getElementById('connect-btn')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'connectToLive' });
});
// Drag and drop support
const dropZone = document.getElementById('drop-zone');
let dragCounter = 0;
document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropZone?.classList.add('active');
});
document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
        dropZone?.classList.remove('active');
    }
});
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});
document.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone?.classList.remove('active');
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.rrd')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
                const blobUrl = URL.createObjectURL(blob);
                if (viewer) {
                    await viewer.open(blobUrl);
                }
            }
            catch (error) {
                vscode.postMessage({
                    type: 'showError',
                    message: `Failed to load dropped file: ${error}`
                });
            }
        }
        else {
            vscode.postMessage({
                type: 'showError',
                message: 'Please drop a .rrd file'
            });
        }
    }
});
// Initialize on load
initViewer();
//# sourceMappingURL=viewer.js.map