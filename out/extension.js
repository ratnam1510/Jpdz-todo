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
        const id = crypto.createHash('md5').update(fsPath).digest('hex').substring(0, 12);
        return { name, id, path: fsPath };
    }
    return null;
}
function getRecentWorkspaces(context) {
    const workspaces = context.globalState.get('recentWorkspaces') || [];
    return workspaces.sort((a, b) => b.lastOpened - a.lastOpened);
}
function addCurrentWorkspaceToRecent(context) {
    const current = getWorkspaceInfo();
    if (!current)
        return getRecentWorkspaces(context);
    let workspaces = context.globalState.get('recentWorkspaces') || [];
    workspaces = workspaces.filter(w => w.id !== current.id);
    workspaces.unshift({
        id: current.id,
        name: current.name,
        path: current.path,
        lastOpened: Date.now()
    });
    workspaces = workspaces.slice(0, 10);
    context.globalState.update('recentWorkspaces', workspaces);
    return workspaces;
}
function getWebviewContent(webview, context, isSidebar) {
    const distPath = path.join(context.extensionPath, 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
        let html = fs.readFileSync(indexHtmlPath, 'utf8');
        const baseUri = webview.asWebviewUri(vscode.Uri.file(distPath));
        // Add sidebar mode indicator
        const sidebarScript = isSidebar ? `<script>window.JPDZ_SIDEBAR_MODE = true;</script>` : `<script>window.JPDZ_SIDEBAR_MODE = false;</script>`;
        const csp = `
            <meta http-equiv="Content-Security-Policy" content="
                default-src 'none';
                style-src ${webview.cspSource} 'unsafe-inline' https://cdn.tailwindcss.com;
                script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://esm.sh;
                connect-src https://esm.sh https://generativelanguage.googleapis.com https://*.googleapis.com;
                font-src ${webview.cspSource} https:;
                img-src ${webview.cspSource} https: data:;
            ">
            ${sidebarScript}
        `;
        if (html.includes('<base href="/">')) {
            html = html.replace('<base href="/">', `${csp}\n<base href="${baseUri}/">`);
        }
        else if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>\n${csp}\n<base href="${baseUri}/">`);
        }
        return html;
    }
    return getBuildRequiredHtml();
}
function setupWebviewMessageHandler(webview, context) {
    const recentWorkspaces = getRecentWorkspaces(context);
    webview.onDidReceiveMessage(message => {
        switch (message.type) {
            case 'getWorkspaceInfo':
                sendWorkspaceData(webview, context);
                break;
            case 'switchWorkspace':
                const workspace = recentWorkspaces.find(w => w.id === message.workspaceId);
                if (workspace) {
                    const uri = vscode.Uri.file(workspace.path);
                    vscode.commands.executeCommand('vscode.openFolder', uri, false);
                }
                break;
        }
    });
}
function sendWorkspaceData(webview, context) {
    const current = getWorkspaceInfo();
    const recentWorkspaces = getRecentWorkspaces(context);
    webview.postMessage({
        type: 'workspaceData',
        currentWorkspace: current ? {
            id: current.id,
            name: current.name,
            path: current.path
        } : null,
        recentWorkspaces: recentWorkspaces
    });
}
// Sidebar WebviewViewProvider
class JpdzTodoSidebarProvider {
    constructor(_context) {
        this._context = _context;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this._context.extensionPath, 'dist'))]
        };
        webviewView.webview.html = getWebviewContent(webviewView.webview, this._context, true);
        setupWebviewMessageHandler(webviewView.webview, this._context);
        // Send workspace data after a short delay
        setTimeout(() => sendWorkspaceData(webviewView.webview, this._context), 500);
        // Listen for visibility changes to refresh data
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                sendWorkspaceData(webviewView.webview, this._context);
            }
        });
    }
    refresh() {
        if (this._view) {
            sendWorkspaceData(this._view.webview, this._context);
        }
    }
}
JpdzTodoSidebarProvider.viewType = 'jpdz-todo.sidebarView';
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel("Jpdz Todo");
    outputChannel.appendLine("Jpdz Todo extension activating...");
    // Add current workspace to recent list
    const recentWorkspaces = addCurrentWorkspaceToRecent(context);
    outputChannel.appendLine(`Recent workspaces: ${recentWorkspaces.map(w => w.name).join(', ')}`);
    // Register sidebar provider
    const sidebarProvider = new JpdzTodoSidebarProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(JpdzTodoSidebarProvider.viewType, sidebarProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
    // Register command to open in panel
    const openPanelCommand = vscode.commands.registerCommand('jpdz-todo.openPanel', () => {
        outputChannel.appendLine("Opening Jpdz Todo in panel...");
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            sendWorkspaceData(currentPanel.webview, context);
            return;
        }
        const panel = vscode.window.createWebviewPanel('jpdzTodo', 'Jpdz Todo', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
        });
        currentPanel = panel;
        setupWebviewMessageHandler(panel.webview, context);
        panel.onDidDispose(() => {
            currentPanel = undefined;
            outputChannel.appendLine("Panel disposed.");
        }, null, context.subscriptions);
        panel.webview.html = getWebviewContent(panel.webview, context, false);
        setTimeout(() => sendWorkspaceData(panel.webview, context), 500);
    });
    // Register command to focus sidebar
    const openSidebarCommand = vscode.commands.registerCommand('jpdz-todo.openSidebar', () => {
        vscode.commands.executeCommand('workbench.view.extension.jpdz-todo-sidebar');
    });
    context.subscriptions.push(openPanelCommand);
    context.subscriptions.push(openSidebarCommand);
    // Watch for workspace folder changes
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
        addCurrentWorkspaceToRecent(context);
        sidebarProvider.refresh();
        if (currentPanel) {
            sendWorkspaceData(currentPanel.webview, context);
        }
    }));
    outputChannel.appendLine("Jpdz Todo extension activated!");
}
function getBuildRequiredHtml() {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%);
                    color: #e0e0e0;
                    padding: 20px;
                    line-height: 1.7;
                    min-height: 100vh;
                    margin: 0;
                    box-sizing: border-box;
                }
                h1 { 
                    background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-size: 20px;
                    margin-bottom: 12px;
                }
                p { color: #888; font-size: 13px; }
                code {
                    background: #252525;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <h1>Build Required</h1>
            <p>Run <code>npm run build:all</code> then restart.</p>
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