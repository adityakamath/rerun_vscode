import * as vscode from 'vscode';

export class RerunViewProvider implements vscode.CustomReadonlyEditorProvider {
    constructor(private readonly context: vscode.ExtensionContext) {}

    async openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        return {
            uri,
            dispose: () => {},
        };
    }

    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document.uri);

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'requestFile':
                        try {
                            const fileData = await vscode.workspace.fs.readFile(document.uri);
                            const base64Data = Buffer.from(fileData).toString('base64');
                            webviewPanel.webview.postMessage({
                                type: 'loadData',
                                data: base64Data,
                            });
                        } catch (error) {
                            vscode.window.showErrorMessage(`Failed to load file: ${error}`);
                        }
                        break;
                    case 'connectToLive':
                        const url = await vscode.window.showInputBox({
                            prompt: 'Enter Rerun server URL or address (e.g., ws://localhost:9877)',
                            placeHolder: 'ws://localhost:9877',
                            value: 'ws://localhost:9877'
                        });
                        if (url) {
                            webviewPanel.webview.postMessage({
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
            this.context.subscriptions
        );
    }

    public getHtmlForWebview(webview: vscode.Webview, uri?: vscode.Uri): string {
        const nonce = getNonce();
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.js')
        );
        const baseUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'out')
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
        ${uri ? 'window.__SHOULD_AUTO_LOAD__ = true;' : ''}
        ${uri ? 'window.__DISABLE_DRAG_DROP__ = true;' : ''}
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
