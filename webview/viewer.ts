import { WebViewer } from '@rerun-io/web-viewer';

declare const acquireVsCodeApi: () => any;
declare const WEBVIEW_BASE_URI: string;

const vscode = acquireVsCodeApi();
let viewer: WebViewer | null = null;

// Initialize the viewer
async function initViewer() {
    const container = document.getElementById('rerun-container');
    if (!container) {
        console.error('Container not found');
        return;
    }

    try {
        viewer = new WebViewer();
        await viewer.start(null, container, {
            hide_welcome_screen: false,
            enable_history: true,
            allow_fullscreen: false,
            render_backend: 'webgpu',
            theme: 'dark',
            width: '100%',
            height: '100%',
            base_url: WEBVIEW_BASE_URI
        } as any);
        console.log('Rerun viewer started successfully');

        // Listen for selection changes
        viewer.on('selection_change', (event: any) => {
            vscode.postMessage({
                type: 'selectionChange',
                items: event.items
            });
        });
    } catch (error) {
        console.error('Failed to start viewer:', error);
        console.error('Error details:', error instanceof Error ? error.stack : error);
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
                } catch (error) {
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
                } catch (error) {
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
                    // Wait for viewer to be ready
                    const waitForReady = () => {
                        return new Promise<void>((resolve) => {
                            if (viewer!.ready) {
                                resolve();
                            } else {
                                const checkReady = setInterval(() => {
                                    if (viewer!.ready) {
                                        clearInterval(checkReady);
                                        resolve();
                                    }
                                }, 50);
                            }
                        });
                    };

                    await waitForReady();

                    // Convert base64 to Uint8Array
                    const binaryString = atob(message.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Open a channel and send the RRD data
                    const channel = viewer.open_channel('file_upload');
                    channel.send_rrd(bytes);
                    channel.close();

                    console.log('RRD file loaded successfully');
                } catch (error) {
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

// Drag and drop support (only if not disabled)
const dropZone = document.getElementById('drop-zone');
let dragCounter = 0;

// Check if drag-drop should be disabled (e.g., when viewing a specific .rrd file)
const isDragDropDisabled = (window as any).__DISABLE_DRAG_DROP__;

if (!isDragDropDisabled) {
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
        e.dataTransfer!.dropEffect = 'copy';
    });
}

document.addEventListener('drop', async (e) => {
    // If drag-drop is disabled, prevent any drop action
    if (isDragDropDisabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    dropZone?.classList.remove('active');

    // Check for VSCode URI data (when dragging from VSCode explorer)
    const uriListData = e.dataTransfer?.getData('text/uri-list');
    if (uriListData) {
        const uris = uriListData.split('\n').filter(uri => uri.trim());
        if (uris.length > 0) {
            const uri = uris[0].trim();
            // Extract file path and request the file from extension
            vscode.postMessage({
                type: 'loadFileFromUri',
                uri: uri
            });
            return;
        }
    }

    // Fallback: Check for regular file drop (external files)
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.rrd')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);

                if (viewer) {
                    // Wait for viewer to be ready
                    const waitForReady = () => {
                        return new Promise<void>((resolve) => {
                            if (viewer!.ready) {
                                resolve();
                            } else {
                                const checkReady = setInterval(() => {
                                    if (viewer!.ready) {
                                        clearInterval(checkReady);
                                        resolve();
                                    }
                                }, 50);
                            }
                        });
                    };

                    await waitForReady();

                    // Open a channel and send the RRD data
                    const channel = viewer.open_channel('file_drop');
                    channel.send_rrd(bytes);
                    channel.close();
                }
            } catch (error) {
                vscode.postMessage({
                    type: 'showError',
                    message: `Failed to load dropped file: ${error}`
                });
            }
        } else {
            vscode.postMessage({
                type: 'showError',
                message: 'Please drop a .rrd file'
            });
        }
    }
});

// Initialize on load
initViewer().then(() => {
    // Request file if this is a custom editor (not empty viewer)
    // Check if we should auto-load by looking for a special marker
    if ((window as any).__SHOULD_AUTO_LOAD__) {
        // Wait for viewer to be fully ready, then request the file
        const checkViewerReady = setInterval(() => {
            if (viewer && viewer.ready) {
                clearInterval(checkViewerReady);
                console.log('Viewer is ready, requesting file');
                vscode.postMessage({ type: 'requestFile' });
            }
        }, 100);
    }
});
