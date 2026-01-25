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
  deletedAt?: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
  lastOpened?: number;
}

// Declare VS Code API type
declare const acquireVsCodeApi: () => { postMessage: (msg: any) => void; getState: () => any; setState: (state: any) => void; };

// Declare sidebar mode global
declare const JPDZ_SIDEBAR_MODE: boolean | undefined;

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private vscode: any = null;

  // Sidebar mode detection
  isSidebarMode = signal<boolean>(false);

  // Current workspace info
  currentWorkspace = signal<WorkspaceInfo | null>(null);

  // List of recent workspaces from VS Code
  recentWorkspaces = signal<WorkspaceInfo[]>([]);

  // Workspace name (derived from current workspace)
  workspaceName = computed(() => this.currentWorkspace()?.name || 'My Workspace');

  workspaceId = computed(() => this.currentWorkspace()?.id || 'default');

  // Tasks stored directly (no projects hierarchy - tasks belong to workspaces now)
  tasks = signal<Task[]>([]);

  activeViewId = signal<string>('inbox');

  activeViewType = computed(() => {
    const id = this.activeViewId();
    if (['inbox', 'today', 'upcoming', 'completed', 'settings'].includes(id)) return id as 'inbox' | 'today' | 'upcoming' | 'completed' | 'settings';
    if (id.startsWith('label:')) return 'label' as const;
    return 'workspace';
  });

  allTasks = computed(() => {
    const wsId = this.workspaceId();
    return this.tasks().filter(t => t.projectId === wsId && !t.deletedAt);
  });

  deletedTasks = computed(() => this.tasks().filter(t => t.projectId === this.workspaceId() && !!t.deletedAt));

  completedTasks = computed(() => this.allTasks().filter(t => t.completed));

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
    if (type === 'completed') return all.filter(t => t.completed);

    if (id.startsWith('label:')) {
      const label = id.replace('label:', '');
      return all.filter(t => t.labels?.includes(label) && !t.completed);
    }

    return all.filter(t => !t.completed);
  });

  private getStorageKey(): string {
    return `project-tasks-${this.workspaceId()}`;
  }

  // Settings
  settings = signal({
    smartParsing: true
  });

  private pendingSave = false;

  constructor() {
    // Load settings
    const savedSettings = localStorage.getItem('jpdz-settings');
    if (savedSettings) {
      try {
        this.settings.set({ ...this.settings(), ...JSON.parse(savedSettings) });
      } catch { }
    }

    // Save settings effect
    effect(() => {
      localStorage.setItem('jpdz-settings', JSON.stringify(this.settings()));
    });

    // Detect sidebar mode
    this.detectSidebarMode();

    // Try to get VS Code API for workspace info
    this.initVsCodeApi();

    // Save data whenever tasks change (debounced to extension)
    effect(() => {
      const wsId = this.workspaceId();
      const tasks = this.tasks();
      if (wsId && wsId !== 'default' && this.vscode && !this.pendingSave) {
        // Send tasks to extension for storage
        this.vscode.postMessage({
          type: 'saveTasks',
          workspaceId: wsId,
          tasks: tasks
        });
      }
    });

    // Listen for messages from VS Code extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'workspaceData') {
        this.handleWorkspaceData(message);
      } else if (message.type === 'tasksLoaded') {
        // Initial load from extension storage
        this.pendingSave = true;
        this.tasks.set(message.tasks || []);
        this.pendingSave = false;
      } else if (message.type === 'tasksUpdated') {
        // Another window updated tasks - sync if same workspace
        if (message.workspaceId === this.workspaceId()) {
          this.pendingSave = true;
          this.tasks.set(message.tasks || []);
          this.pendingSave = false;
        }
      }
    });

    // Also detect based on window width for responsiveness
    this.checkWindowSize();
    window.addEventListener('resize', () => this.checkWindowSize());
  }

  private detectSidebarMode() {
    try {
      if (typeof (window as any).JPDZ_SIDEBAR_MODE !== 'undefined') {
        this.isSidebarMode.set((window as any).JPDZ_SIDEBAR_MODE);
      }
    } catch (e) {
      // Ignore
    }
  }

  private checkWindowSize() {
    // If width is less than 400px, treat as sidebar mode for responsive layout
    if (window.innerWidth < 400) {
      this.isSidebarMode.set(true);
    }
  }

  private handleWorkspaceData(message: any) {
    // Update current workspace
    if (message.currentWorkspace) {
      this.currentWorkspace.set(message.currentWorkspace);
      // Request tasks from extension storage
      if (this.vscode) {
        this.vscode.postMessage({
          type: 'getTasks',
          workspaceId: message.currentWorkspace.id
        });
      }
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
      // Not in VS Code, use default workspace and localStorage fallback
      console.log('Running outside VS Code, using default workspace');
      this.currentWorkspace.set({
        id: 'default',
        name: 'My Workspace',
        path: '/default'
      });
      // Load from localStorage for non-VS Code environments
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    const saved = localStorage.getItem(this.getStorageKey());
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.tasks) {
          const wsId = this.workspaceId();
          const cleanedTasks = (data.tasks as Task[])
            .filter(t => !t.projectId || t.projectId === wsId)
            .map(t => t.projectId ? t : { ...t, projectId: wsId });
          this.pendingSave = true;
          this.tasks.set(cleanedTasks);
          this.pendingSave = false;
        }
      } catch (e) {
        console.error('Failed to load data', e);
      }
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

  addTask(title: string, priority: 1 | 2 | 3 | 4 = 4, dueDate?: string, projectId?: string) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      priority,
      dueDate,
      projectId: projectId || this.workspaceId(),
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
    this.tasks.update(tasks =>
      tasks.map(t => t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t)
    );
  }

  purgeTask(taskId: string) {
    this.tasks.update(tasks => tasks.filter(t => t.id !== taskId));
  }

  restoreTask(taskId: string) {
    this.tasks.update(tasks =>
      tasks.map(t => t.id === taskId ? { ...t, deletedAt: undefined } : t)
    );
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
