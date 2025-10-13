import * as vscode from 'vscode';
import { RerunViewProvider } from './rerunViewProvider';

function getHtmlForWebview(webview: vscode.Webview, context: vscode.ExtensionContext): string {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'out', 'webview.js')
    );
    const baseUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'out')
    ).toString() + '/';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';
        script-src ${webview.cspSource} 'nonce-${nonce}' 'wasm-unsafe-eval';
        style-src ${webview.cspSource} 'unsafe-inline';
        img-src ${webview.cspSource} https: data: blob:;
        font-src ${webview.cspSource};
        connect-src https: ws: wss: blob:;
        worker-src blob:;
        child-src blob:;">
    <title>Rerun Viewer</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            background: #1e1e1e;
            color: #cccccc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        #rerun-container {
            width: 100%;
            height: 100%;
            position: relative;
        }
        #drop-zone {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 1000;
            display: none;
        }
        #drop-zone.active {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 123, 255, 0.1);
            border: 3px dashed #007bff;
            pointer-events: all;
        }
        #drop-zone.active::after {
            content: 'Drop .rrd file to open';
            font-size: 24px;
            color: #007bff;
        }
        canvas {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="rerun-container"></div>
    <div id="drop-zone"></div>
    <script nonce="${nonce}">
        const WEBVIEW_BASE_URI = "${baseUri}";
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Rerun Viewer extension is now active');

    // Register custom editor provider for .rrd files
    const provider = new RerunViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider('rerun.viewer', provider, {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
        })
    );

    // Register command to open empty viewer
    const openViewerCommand = vscode.commands.registerCommand('rerun.openViewer', async () => {
        const panel = vscode.window.createWebviewPanel(
            'rerunViewer',
            'Rerun Viewer',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        panel.webview.html = getHtmlForWebview(panel.webview, context);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'loadFileFromUri':
                        try {
                            // Parse the VSCode URI
                            const fileUri = vscode.Uri.parse(message.uri);

                            // Read and send as data
                            const fileData = await vscode.workspace.fs.readFile(fileUri);
                            const base64Data = Buffer.from(fileData).toString('base64');
                            panel.webview.postMessage({
                                type: 'loadData',
                                data: base64Data,
                            });
                        } catch (error) {
                            vscode.window.showErrorMessage(`Failed to load file: ${error}`);
                        }
                        break;
                    case 'selectFile':
                        const uris = await vscode.window.showOpenDialog({
                            canSelectMany: false,
                            filters: {
                                'Rerun files': ['rrd']
                            },
                            title: 'Select RRD file to load'
                        });
                        if (uris && uris.length > 0) {
                            try {
                                const fileData = await vscode.workspace.fs.readFile(uris[0]);
                                const base64Data = Buffer.from(fileData).toString('base64');
                                panel.webview.postMessage({
                                    type: 'loadData',
                                    data: base64Data,
                                });
                            } catch (error) {
                                vscode.window.showErrorMessage(`Failed to load file: ${error}`);
                            }
                        }
                        break;
                    case 'connectToLive':
                        const url = await vscode.window.showInputBox({
                            prompt: 'Enter Rerun server URL or address (e.g., ws://localhost:9877)',
                            placeHolder: 'ws://localhost:9877',
                            value: 'ws://localhost:9877'
                        });
                        if (url) {
                            panel.webview.postMessage({
                                type: 'connectUrl',
                                url: url,
                            });
                        }
                        break;
                    case 'showError':
                        vscode.window.showErrorMessage(message.message);
                        break;
                    case 'selectionChange':
                        // Handle selection changes from viewer if needed
                        console.log('Selection changed:', message.items);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(openViewerCommand);
}

export function deactivate() {}
