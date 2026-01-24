import { Injectable, signal, computed, effect } from '@angular/core';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 1 | 2 | 3 | 4;
  dueDate?: string;
  projectId: string;
  labels?: string[];
  createdAt?: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
  lastOpened?: number;
}

// Declare VS Code API type
declare const acquireVsCodeApi: () => { postMessage: (msg: any) => void; getState: () => any; setState: (state: any) => void; };

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private vscode: any = null;
  
  // Current workspace info
  currentWorkspace = signal<WorkspaceInfo | null>(null);
  
  // List of recent workspaces from VS Code
  recentWorkspaces = signal<WorkspaceInfo[]>([]);

  // Workspace name (derived from current workspace)
  workspaceName = computed(() => this.currentWorkspace()?.name || 'My Workspace');
  
  private workspaceId = computed(() => this.currentWorkspace()?.id || 'default');

  // Tasks stored directly (no projects hierarchy - tasks belong to workspaces now)
  tasks = signal<Task[]>([]);
  
  activeViewId = signal<string>('inbox');

  activeViewType = computed(() => {
    const id = this.activeViewId();
    if (['inbox', 'today', 'upcoming'].includes(id)) return id as 'inbox' | 'today' | 'upcoming';
    if (id.startsWith('label:')) return 'label' as const;
    return 'workspace';
  });

  allTasks = computed(() => this.tasks());

  uniqueLabels = computed(() => {
    const tasks = this.allTasks();
    const labels = new Set<string>();
    tasks.forEach(t => t.labels?.forEach(l => labels.add(l)));
    return [...labels].sort();
  });

  todayTaskCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.allTasks().filter(t => t.dueDate === today && !t.completed).length;
  });

  upcomingTaskCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.allTasks().filter(t => t.dueDate && t.dueDate > today && !t.completed).length;
  });

  overdueTaskCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.allTasks().filter(t => t.dueDate && t.dueDate < today && !t.completed).length;
  });

  // Get task count for a specific workspace
  getWorkspaceTaskCount(workspaceId: string): number {
    const key = `project-tasks-${workspaceId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.tasks?.filter((t: Task) => !t.completed).length || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  tasksForActiveView = computed(() => {
    const type = this.activeViewType();
    const id = this.activeViewId();
    const all = this.allTasks();

    // For inbox, show all tasks without a due date or all incomplete tasks
    if (type === 'inbox') return all.filter(t => !t.completed);

    const today = new Date().toISOString().split('T')[0];
    if (type === 'today') return all.filter(t => t.dueDate === today && !t.completed);
    if (type === 'upcoming') return all.filter(t => t.dueDate && t.dueDate > today && !t.completed);

    if (id.startsWith('label:')) {
      const label = id.replace('label:', '');
      return all.filter(t => t.labels?.includes(label) && !t.completed);
    }

    return all.filter(t => !t.completed);
  });

  private getStorageKey(): string {
    return `project-tasks-${this.workspaceId()}`;
  }

  constructor() {
    // Try to get VS Code API for workspace info
    this.initVsCodeApi();

    // Save data whenever tasks change
    effect(() => {
      const wsId = this.workspaceId();
      if (wsId && wsId !== 'default') {
        const data = {
          tasks: this.tasks(),
        };
        localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
      }
    });

    // Listen for messages from VS Code extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'workspaceData') {
        this.handleWorkspaceData(message);
      }
    });
  }

  private handleWorkspaceData(message: any) {
    // Update current workspace
    if (message.currentWorkspace) {
      this.currentWorkspace.set(message.currentWorkspace);
      this.loadData(); // Load data for this workspace
    }
    
    // Update recent workspaces list
    if (message.recentWorkspaces) {
      this.recentWorkspaces.set(message.recentWorkspaces);
    }
  }

  private initVsCodeApi() {
    try {
      // Check if we're in VS Code webview
      if (typeof acquireVsCodeApi !== 'undefined') {
        this.vscode = acquireVsCodeApi();
        // Request workspace info from extension
        this.vscode.postMessage({ type: 'getWorkspaceInfo' });
      }
    } catch (e) {
      // Not in VS Code, use default workspace
      console.log('Running outside VS Code, using default workspace');
      // Set a default workspace for testing
      this.currentWorkspace.set({
        id: 'default',
        name: 'My Workspace',
        path: '/default'
      });
    }
  }

  private loadData() {
    const saved = localStorage.getItem(this.getStorageKey());
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.tasks) {
          this.tasks.set(data.tasks);
        } else {
          this.tasks.set([]);
        }
      } catch (e) {
        console.error('Failed to load data', e);
        this.tasks.set([]);
      }
    } else {
      this.tasks.set([]);
    }
  }

  // Switch to a different workspace (opens it in VS Code)
  switchWorkspace(workspaceId: string) {
    if (this.vscode) {
      this.vscode.postMessage({ 
        type: 'switchWorkspace', 
        workspaceId 
      });
    }
  }

  addTask(title: string, priority: 1 | 2 | 3 | 4 = 4, dueDate?: string) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      priority,
      dueDate,
      projectId: this.workspaceId(),
      createdAt: new Date().toISOString()
    };

    this.tasks.update(tasks => [...tasks, newTask]);
  }

  toggleTask(taskId: string) {
    this.tasks.update(tasks =>
      tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    );
  }

  deleteTask(taskId: string) {
    this.tasks.update(tasks => tasks.filter(t => t.id !== taskId));
  }

  updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'projectId'>>) {
    this.tasks.update(tasks =>
      tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    );
  }

  // Legacy methods for compatibility (no longer used but kept for safety)
  projects = computed(() => [{
    id: 'inbox',
    name: 'Inbox',
    description: 'Default',
    tasks: this.tasks()
  }]);

  currentProject = computed(() => this.projects()[0]);
}
