import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

let currentPanel: vscode.WebviewPanel | undefined;

// Track all active webviews for broadcasting
const activeWebviews: Set<vscode.Webview> = new Set();

interface WorkspaceRecord {
    id: string;
    name: string;
    path: string;
    lastOpened: number;
}

function getWorkspaceInfo(): { name: string; id: string; path: string } | null {
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

function getRecentWorkspaces(context: vscode.ExtensionContext): WorkspaceRecord[] {
    const workspaces = context.globalState.get<WorkspaceRecord[]>('recentWorkspaces') || [];
    return workspaces.sort((a, b) => b.lastOpened - a.lastOpened);
}

function addCurrentWorkspaceToRecent(context: vscode.ExtensionContext): WorkspaceRecord[] {
    const current = getWorkspaceInfo();
    if (!current) return getRecentWorkspaces(context);

    let workspaces = context.globalState.get<WorkspaceRecord[]>('recentWorkspaces') || [];
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

async function getVSCodeRecentWorkspaces(context: vscode.ExtensionContext): Promise<WorkspaceRecord[]> {
    try {
        const recentlyOpened = await vscode.commands.executeCommand<{
            workspaces?: Array<{ folderUri?: vscode.Uri; workspace?: { configPath: vscode.Uri } }>;
        }>('_workbench.getRecentlyOpened');
        
        if (recentlyOpened?.workspaces) {
            const workspaces: WorkspaceRecord[] = [];
            for (const item of recentlyOpened.workspaces) {
                let fsPath: string | undefined;
                let name: string = '';
                
                if (item.folderUri) {
                    fsPath = item.folderUri.fsPath;
                    name = path.basename(fsPath);
                } else if (item.workspace?.configPath) {
                    fsPath = path.dirname(item.workspace.configPath.fsPath);
                    name = path.basename(fsPath);
                }
                
                if (fsPath) {
                    const id = crypto.createHash('md5').update(fsPath).digest('hex').substring(0, 12);
                    workspaces.push({
                        id,
                        name,
                        path: fsPath,
                        lastOpened: Date.now() - workspaces.length
                    });
                }
            }
            if (workspaces.length > 0) {
                return workspaces.slice(0, 10);
            }
        }
    } catch (e) {
        console.log('Failed to get VS Code recents, falling back to extension tracking');
    }
    
    return getRecentWorkspaces(context);
}

function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext, isSidebar: boolean): string {
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
        } else if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>\n${csp}\n<base href="${baseUri}/">`);
        }

        return html;
    }

    return getBuildRequiredHtml();
}

// Get tasks for a workspace from global state
function getTasksForWorkspace(context: vscode.ExtensionContext, workspaceId: string): any[] {
    const allTasks = context.globalState.get<Record<string, any[]>>('workspaceTasks') || {};
    return allTasks[workspaceId] || [];
}

// Save tasks for a workspace to global state
function saveTasksForWorkspace(context: vscode.ExtensionContext, workspaceId: string, tasks: any[]): void {
    const allTasks = context.globalState.get<Record<string, any[]>>('workspaceTasks') || {};
    allTasks[workspaceId] = tasks;
    context.globalState.update('workspaceTasks', allTasks);
}

// Broadcast task updates to all active webviews
function broadcastTaskUpdate(workspaceId: string, tasks: any[], excludeWebview?: vscode.Webview): void {
    for (const webview of activeWebviews) {
        if (webview !== excludeWebview) {
            webview.postMessage({
                type: 'tasksUpdated',
                workspaceId,
                tasks
            });
        }
    }
}

function setupWebviewMessageHandler(webview: vscode.Webview, context: vscode.ExtensionContext) {
    // Add webview to active set
    activeWebviews.add(webview);

    webview.onDidReceiveMessage(async message => {
        switch (message.type) {
            case 'getWorkspaceInfo':
                await sendWorkspaceData(webview, context);
                break;
            case 'switchWorkspace':
                const recentWorkspaces = await getVSCodeRecentWorkspaces(context);
                const workspace = recentWorkspaces.find(w => w.id === message.workspaceId);
                if (workspace) {
                    const uri = vscode.Uri.file(workspace.path);
                    vscode.commands.executeCommand('vscode.openFolder', uri, false);
                }
                break;
            case 'getTasks':
                // Send tasks for the requested workspace
                const tasks = getTasksForWorkspace(context, message.workspaceId);
                webview.postMessage({
                    type: 'tasksLoaded',
                    workspaceId: message.workspaceId,
                    tasks
                });
                break;
            case 'saveTasks':
                // Save tasks and broadcast to other webviews
                saveTasksForWorkspace(context, message.workspaceId, message.tasks);
                broadcastTaskUpdate(message.workspaceId, message.tasks, webview);
                break;
            case 'addTaskToProject':
                // Add a task to a different project's storage
                const targetWorkspaceId = message.workspaceId;
                const existingTasks = getTasksForWorkspace(context, targetWorkspaceId);
                const updatedTasks = [...existingTasks, message.task];
                saveTasksForWorkspace(context, targetWorkspaceId, updatedTasks);
                // Broadcast to all webviews so the target project's window gets updated
                broadcastTaskUpdate(targetWorkspaceId, updatedTasks);
                break;
        }
    });
}

async function sendWorkspaceData(webview: vscode.Webview, context: vscode.ExtensionContext) {
    const current = getWorkspaceInfo();
    const recentWorkspaces = await getVSCodeRecentWorkspaces(context);
    
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
class JpdzTodoSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'jpdz-todo.sidebarView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this._context.extensionPath, 'dist'))]
        };

        webviewView.webview.html = getWebviewContent(webviewView.webview, this._context, true);
        
        setupWebviewMessageHandler(webviewView.webview, this._context);

        // Remove webview from active set when disposed
        webviewView.onDidDispose(() => {
            activeWebviews.delete(webviewView.webview);
        });

        // Send workspace data after a short delay
        setTimeout(async () => await sendWorkspaceData(webviewView.webview, this._context), 500);

        // Listen for visibility changes to refresh data
        webviewView.onDidChangeVisibility(async () => {
            if (webviewView.visible) {
                await sendWorkspaceData(webviewView.webview, this._context);
            }
        });
    }

    public async refresh() {
        if (this._view) {
            await sendWorkspaceData(this._view.webview, this._context);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel("Jpdz Todo");
    outputChannel.appendLine("Jpdz Todo extension activating...");

    // Add current workspace to recent list
    const recentWorkspaces = addCurrentWorkspaceToRecent(context);
    outputChannel.appendLine(`Recent workspaces: ${recentWorkspaces.map(w => w.name).join(', ')}`);

    // Register sidebar provider
    const sidebarProvider = new JpdzTodoSidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            JpdzTodoSidebarProvider.viewType,
            sidebarProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Register command to open in panel
    const openPanelCommand = vscode.commands.registerCommand('jpdz-todo.openPanel', async () => {
        outputChannel.appendLine("Opening Jpdz Todo in panel...");

        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            await sendWorkspaceData(currentPanel.webview, context);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'jpdzTodo',
            'Jpdz Todo',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
            }
        );

        currentPanel = panel;

        setupWebviewMessageHandler(panel.webview, context);

        panel.onDidDispose(() => {
            activeWebviews.delete(panel.webview);
            currentPanel = undefined;
            outputChannel.appendLine("Panel disposed.");
        }, null, context.subscriptions);

        panel.webview.html = getWebviewContent(panel.webview, context, false);
        
        setTimeout(async () => await sendWorkspaceData(panel.webview, context), 500);
    });

    // Register command to focus sidebar
    const openSidebarCommand = vscode.commands.registerCommand('jpdz-todo.openSidebar', () => {
        vscode.commands.executeCommand('workbench.view.extension.jpdz-todo-sidebar');
    });

    context.subscriptions.push(openPanelCommand);
    context.subscriptions.push(openSidebarCommand);

    // Watch for workspace folder changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(async () => {
            addCurrentWorkspaceToRecent(context);
            await sidebarProvider.refresh();
            if (currentPanel) {
                await sendWorkspaceData(currentPanel.webview, context);
            }
        })
    );

    outputChannel.appendLine("Jpdz Todo extension activated!");
}

function getBuildRequiredHtml(): string {
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

export function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
}
