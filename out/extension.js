"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
let currentPanel;
function getWorkspaceInfo() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const folder = workspaceFolders[0];
        const name = folder.name;
        const fsPath = folder.uri.fsPath;
        // Create a stable ID based on the folder path
        const id = crypto.createHash('md5').update(fsPath).digest('hex').substring(0, 12);
        return { name, id, path: fsPath };
    }
    return null;
}
function getRecentWorkspaces(context) {
    const workspaces = context.globalState.get('recentWorkspaces') || [];
    // Sort by last opened, most recent first
    return workspaces.sort((a, b) => b.lastOpened - a.lastOpened);
}
function addCurrentWorkspaceToRecent(context) {
    const current = getWorkspaceInfo();
    if (!current)
        return getRecentWorkspaces(context);
    let workspaces = context.globalState.get('recentWorkspaces') || [];
    // Remove existing entry for this workspace if present
    workspaces = workspaces.filter(w => w.id !== current.id);
    // Add current workspace at the beginning
    workspaces.unshift({
        id: current.id,
        name: current.name,
        path: current.path,
        lastOpened: Date.now()
    });
    // Keep only the 10 most recent
    workspaces = workspaces.slice(0, 10);
    // Save to global state
    context.globalState.update('recentWorkspaces', workspaces);
    return workspaces;
}
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel("Project Tasks");
    outputChannel.appendLine("Extension activating...");
    // Add current workspace to recent list
    const recentWorkspaces = addCurrentWorkspaceToRecent(context);
    outputChannel.appendLine(`Recent workspaces: ${recentWorkspaces.map(w => w.name).join(', ')}`);
    const disposable = vscode.commands.registerCommand('vs-code-style-project-tasks.start', () => {
        outputChannel.appendLine("Command 'vs-code-style-project-tasks.start' triggered.");
        // If panel already exists, reveal it instead of creating a new one
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            sendWorkspaceData(currentPanel, context);
            return;
        }
        const panel = vscode.window.createWebviewPanel('projectTasks', 'Project Tasks', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
        });
        currentPanel = panel;
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'getWorkspaceInfo':
                    sendWorkspaceData(panel, context);
                    break;
                case 'switchWorkspace':
                    // User wants to switch to a different workspace
                    const workspace = recentWorkspaces.find(w => w.id === message.workspaceId);
                    if (workspace) {
                        // Open the workspace folder
                        const uri = vscode.Uri.file(workspace.path);
                        vscode.commands.executeCommand('vscode.openFolder', uri, false);
                    }
                    break;
            }
        }, undefined, context.subscriptions);
        // Clear reference when panel is closed
        panel.onDidDispose(() => {
            currentPanel = undefined;
            outputChannel.appendLine("Panel disposed.");
        }, null, context.subscriptions);
        const distPath = path.join(context.extensionPath, 'dist');
        const indexHtmlPath = path.join(distPath, 'index.html');
        outputChannel.appendLine(`Checking for index.html at: ${indexHtmlPath}`);
        if (fs.existsSync(indexHtmlPath)) {
            outputChannel.appendLine("index.html found. Reading content...");
            let html = fs.readFileSync(indexHtmlPath, 'utf8');
            // Convert the dist path to a Webview URI
            const baseUri = panel.webview.asWebviewUri(vscode.Uri.file(distPath));
            // Content Security Policy - allows Tailwind, esm.sh, and Gemini API
            const csp = `
                <meta http-equiv="Content-Security-Policy" content="
                    default-src 'none';
                    style-src ${panel.webview.cspSource} 'unsafe-inline' https://cdn.tailwindcss.com;
                    script-src ${panel.webview.cspSource} 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://esm.sh;
                    connect-src https://esm.sh https://generativelanguage.googleapis.com https://*.googleapis.com;
                    font-src ${panel.webview.cspSource} https:;
                    img-src ${panel.webview.cspSource} https: data:;
                ">
            `;
            // Inject CSP and base URI
            if (html.includes('<base href="/">')) {
                html = html.replace('<base href="/">', `${csp}\n<base href="${baseUri}/">`);
            }
            else if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>\n${csp}\n<base href="${baseUri}/">`);
            }
            panel.webview.html = html;
            outputChannel.appendLine("Webview HTML set successfully.");
            // Send workspace info after a short delay to ensure Angular is ready
            setTimeout(() => sendWorkspaceData(panel, context), 500);
        }
        else {
            outputChannel.appendLine("index.html NOT found! Dist path: " + distPath);
            const distExists = fs.existsSync(distPath);
            outputChannel.appendLine(`Dist folder exists: ${distExists}`);
            if (distExists) {
                const files = fs.readdirSync(distPath);
                outputChannel.appendLine(`Files in dist: ${files.join(', ')}`);
            }
            panel.webview.html = getBuildRequiredHtml(indexHtmlPath);
        }
    });
    context.subscriptions.push(disposable);
    // Watch for workspace folder changes
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
        addCurrentWorkspaceToRecent(context);
        if (currentPanel) {
            sendWorkspaceData(currentPanel, context);
        }
    }));
    // Auto-start for easier testing
    outputChannel.appendLine("Auto-executing command...");
    vscode.commands.executeCommand('vs-code-style-project-tasks.start');
    vscode.window.showInformationMessage("Project Tasks Extension Activated!");
}
function sendWorkspaceData(panel, context) {
    const current = getWorkspaceInfo();
    const recentWorkspaces = getRecentWorkspaces(context);
    panel.webview.postMessage({
        type: 'workspaceData',
        currentWorkspace: current ? {
            id: current.id,
            name: current.name,
            path: current.path
        } : null,
        recentWorkspaces: recentWorkspaces
    });
}
function getBuildRequiredHtml(indexHtmlPath) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%);
                    color: #e0e0e0;
                    padding: 60px 40px;
                    line-height: 1.7;
                    min-height: 100vh;
                    margin: 0;
                    box-sizing: border-box;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                }
                h1 { 
                    background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-size: 28px;
                    margin-bottom: 16px;
                }
                p { color: #888; margin-bottom: 24px; }
                code {
                    background: #252525;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #e0e0e0;
                    font-family: 'SF Mono', Monaco, monospace;
                }
                .steps {
                    background: #1e1e1e;
                    padding: 24px;
                    border-radius: 12px;
                    border: 1px solid #2d2d2d;
                }
                .steps h3 {
                    margin-top: 0;
                    font-size: 14px;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .step {
                    margin: 16px 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .step-num {
                    width: 24px;
                    height: 24px;
                    background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Build Required</h1>
                <p>The UI hasn't been built yet. Run these commands to get started:</p>
                
                <div class="steps">
                    <h3>Quick Setup</h3>
                    <div class="step">
                        <span class="step-num">1</span>
                        <code>npm install</code>
                    </div>
                    <div class="step">
                        <span class="step-num">2</span>
                        <code>npm run build</code>
                    </div>
                    <div class="step">
                        <span class="step-num">3</span>
                        <span>Press <code>F5</code> to restart</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}
function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
}
//# sourceMappingURL=extension.js.map