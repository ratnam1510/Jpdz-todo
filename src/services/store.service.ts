import { Injectable, signal, computed, effect } from '@angular/core';
import {
  sanitizeTaskTitle,
  sanitizeTaskDescription,
  validatePriority,
  isValidDate,
} from '../utils/validators';
import { APP_CONSTANTS } from '../constants';
import { DateUtils } from '../utils/date-utils';

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

export interface CompletionRecord {
  date: string; // YYYY-MM-DD
  count: number;
  taskIds: string[];
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  totalCompleted: number;
}

export interface UserStats {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  completionsByDate: Record<string, CompletionRecord>;
  completionsByProject: Record<string, ProjectStats>;
  weeklyAverage: number;
  bestDay: { date: string; count: number } | null;
}

// Declare VS Code API type
declare const acquireVsCodeApi: () => {
  postMessage: (msg: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

// Declare sidebar mode global
declare const JPDZ_SIDEBAR_MODE: boolean | undefined;

@Injectable({
  providedIn: 'root',
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
    if (['inbox', 'today', 'upcoming', 'completed', 'settings'].includes(id))
      return id as 'inbox' | 'today' | 'upcoming' | 'completed' | 'settings';
    if (id.startsWith('label:')) return 'label' as const;
    return 'workspace';
  });

  allTasks = computed(() => {
    const wsId = this.workspaceId();
    return this.tasks().filter(t => t.projectId === wsId && !t.deletedAt);
  });

  deletedTasks = computed(() =>
    this.tasks().filter(t => t.projectId === this.workspaceId() && !!t.deletedAt)
  );

  completedTasks = computed(() => this.allTasks().filter(t => t.completed));

  uniqueLabels = computed(() => {
    const tasks = this.allTasks();
    const labels = new Set<string>();
    tasks.forEach(t => t.labels?.forEach(l => labels.add(l)));
    return [...labels].sort();
  });

  todayTaskCount = computed(() => {
    const today = DateUtils.getTodayISO();
    return this.allTasks().filter(t => t.dueDate === today && !t.completed).length;
  });

  upcomingTaskCount = computed(() => {
    const today = DateUtils.getTodayISO();
    return this.allTasks().filter(t => t.dueDate && t.dueDate > today && !t.completed).length;
  });

  overdueTaskCount = computed(() => {
    const today = DateUtils.getTodayISO();
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

    // For inbox, show all incomplete tasks
    if (type === 'inbox') return all.filter(t => !t.completed);

    const today = DateUtils.getTodayISO();
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
    smartParsing: true,
  });

  // User stats for gamification
  userStats = signal<UserStats>({
    totalCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletionDate: null,
    completionsByDate: {},
    completionsByProject: {},
    weeklyAverage: 0,
    bestDay: null,
  });

  // Computed stats
  todayCompletions = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.userStats().completionsByDate[today]?.count || 0;
  });

  thisWeekCompletions = computed(() => {
    const stats = this.userStats();
    const now = new Date();
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      total += stats.completionsByDate[dateStr]?.count || 0;
    }
    return total;
  });

  last7DaysData = computed(() => {
    const stats = this.userStats();
    const data: { date: string; day: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      data.push({
        date: dateStr,
        day: dayName,
        count: stats.completionsByDate[dateStr]?.count || 0,
      });
    }
    return data;
  });

  topProjects = computed(() => {
    const stats = this.userStats();
    return Object.values(stats.completionsByProject)
      .sort((a, b) => b.totalCompleted - a.totalCompleted)
      .slice(0, 5);
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

    // Load stats
    const savedStats = localStorage.getItem('jpdz-user-stats');
    if (savedStats) {
      try {
        this.userStats.set({ ...this.userStats(), ...JSON.parse(savedStats) });
      } catch { }
    }

    // Save settings effect
    effect(() => {
      localStorage.setItem('jpdz-settings', JSON.stringify(this.settings()));
    });

    // Save stats effect
    effect(() => {
      localStorage.setItem('jpdz-user-stats', JSON.stringify(this.userStats()));
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
          tasks: tasks,
        });
      }
    });

    // Listen for messages from VS Code extension
    window.addEventListener('message', event => {
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
      // Prevent over-writing storage with empty tasks while switching workspaces
      this.pendingSave = true;
      this.currentWorkspace.set(message.currentWorkspace);
      // Request tasks from extension storage
      if (this.vscode) {
        this.vscode.postMessage({
          type: 'getTasks',
          workspaceId: message.currentWorkspace.id,
        });
      } else {
        this.pendingSave = false;
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
      // Running outside VS Code - use default workspace
      this.currentWorkspace.set({
        id: 'default',
        name: 'My Workspace',
        path: '/default',
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
            .map(t => (t.projectId ? t : { ...t, projectId: wsId }));
          this.pendingSave = true;
          this.tasks.set(cleanedTasks);
          this.pendingSave = false;
        }
      } catch (e) {
        // Failed to load data - start with empty tasks
      }
    }
  }

  // Switch to a different workspace (opens it in VS Code)
  switchWorkspace(workspaceId: string) {
    if (this.vscode) {
      this.vscode.postMessage({
        type: 'switchWorkspace',
        workspaceId,
      });
    }
  }

  addTask(
    title: string,
    priority: 1 | 2 | 3 | 4 = APP_CONSTANTS.TASKS.DEFAULT_PRIORITY,
    dueDate?: string,
    projectId?: string
  ) {
    // Validate and sanitize inputs
    const sanitizedTitle = sanitizeTaskTitle(title, APP_CONSTANTS.TASKS.MAX_TITLE_LENGTH);
    const validPriority = validatePriority(priority);

    // Validate date if provided
    if (dueDate && !isValidDate(dueDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format.');
    }

    const targetProjectId = projectId || this.workspaceId();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: sanitizedTitle,
      completed: false,
      priority: validPriority,
      dueDate,
      projectId: targetProjectId,
      createdAt: new Date().toISOString(),
    };

    // If adding to a different project, send directly to extension
    if (projectId && projectId !== this.workspaceId() && this.vscode) {
      this.vscode.postMessage({
        type: 'addTaskToProject',
        workspaceId: projectId,
        task: newTask,
      });
    } else {
      // Adding to current workspace
      this.tasks.update(tasks => [...tasks, newTask]);
    }
  }

  toggleTask(taskId: string) {
    const task = this.tasks().find(t => t.id === taskId);
    if (!task) return;

    const wasCompleted = task.completed;
    const willBeCompleted = !wasCompleted;

    this.tasks.update(tasks =>
      tasks.map(t => (t.id === taskId ? { ...t, completed: willBeCompleted } : t))
    );

    // Track completion stats
    if (willBeCompleted) {
      this.recordCompletion(taskId, task.projectId);
    } else {
      this.removeCompletion(taskId);
    }
  }

  private recordCompletion(taskId: string, projectId: string) {
    const today = DateUtils.getTodayISO();
    const projectName = this.currentWorkspace()?.name || projectId;

    this.userStats.update(stats => {
      const newStats = { ...stats };

      // Update total
      newStats.totalCompleted = (stats.totalCompleted || 0) + 1;

      // Update daily record
      const completionsByDate = { ...stats.completionsByDate };
      if (!completionsByDate[today]) {
        completionsByDate[today] = { date: today, count: 0, taskIds: [] };
      }
      completionsByDate[today] = {
        ...completionsByDate[today],
        count: completionsByDate[today].count + 1,
        taskIds: [...completionsByDate[today].taskIds, taskId],
      };
      newStats.completionsByDate = completionsByDate;

      // Update project stats
      const completionsByProject = { ...stats.completionsByProject };
      if (!completionsByProject[projectId]) {
        completionsByProject[projectId] = { projectId, projectName, totalCompleted: 0 };
      }
      completionsByProject[projectId] = {
        ...completionsByProject[projectId],
        projectName,
        totalCompleted: completionsByProject[projectId].totalCompleted + 1,
      };
      newStats.completionsByProject = completionsByProject;

      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = DateUtils.formatDateISO(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate()
      );

      if (stats.lastCompletionDate === today) {
        // Already completed something today, streak unchanged
      } else if (stats.lastCompletionDate === yesterdayStr || !stats.lastCompletionDate) {
        // Continuing streak or starting new one
        newStats.currentStreak = (stats.currentStreak || 0) + 1;
      } else {
        // Streak broken, start new
        newStats.currentStreak = 1;
      }

      newStats.lastCompletionDate = today;
      newStats.longestStreak = Math.max(newStats.longestStreak || 0, newStats.currentStreak);

      // Update best day
      const todayCount = completionsByDate[today].count;
      if (!stats.bestDay || todayCount > stats.bestDay.count) {
        newStats.bestDay = { date: today, count: todayCount };
      }

      // Calculate weekly average (last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      let weeklyTotal = 0;
      for (const [date, record] of Object.entries(completionsByDate)) {
        if (new Date(date) >= fourWeeksAgo) {
          weeklyTotal += record.count;
        }
      }
      newStats.weeklyAverage = Math.round((weeklyTotal / 4) * 10) / 10;

      return newStats;
    });
  }

  private removeCompletion(taskId: string) {
    const today = DateUtils.getTodayISO();

    this.userStats.update(stats => {
      const newStats = { ...stats };

      // Find and remove from daily record
      for (const [date, record] of Object.entries(stats.completionsByDate)) {
        if (record.taskIds.includes(taskId)) {
          const completionsByDate = { ...stats.completionsByDate };
          completionsByDate[date] = {
            ...record,
            count: Math.max(0, record.count - 1),
            taskIds: record.taskIds.filter(id => id !== taskId),
          };
          newStats.completionsByDate = completionsByDate;
          newStats.totalCompleted = Math.max(0, (stats.totalCompleted || 0) - 1);
          break;
        }
      }

      return newStats;
    });
  }

  deleteTask(taskId: string) {
    this.tasks.update(tasks =>
      tasks.map(t => (t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t))
    );
  }

  purgeTask(taskId: string) {
    this.tasks.update(tasks => tasks.filter(t => t.id !== taskId));
  }

  restoreTask(taskId: string) {
    this.tasks.update(tasks =>
      tasks.map(t => (t.id === taskId ? { ...t, deletedAt: undefined } : t))
    );
  }

  updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'projectId'>>) {
    // Validate updates if present
    if (updates.title !== undefined) {
      updates.title = sanitizeTaskTitle(updates.title, APP_CONSTANTS.TASKS.MAX_TITLE_LENGTH);
    }
    if (updates.description !== undefined) {
      updates.description = sanitizeTaskDescription(
        updates.description,
        APP_CONSTANTS.TASKS.MAX_DESCRIPTION_LENGTH
      );
    }
    if (updates.priority !== undefined) {
      updates.priority = validatePriority(updates.priority);
    }
    if (updates.dueDate !== undefined && updates.dueDate && !isValidDate(updates.dueDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format.');
    }

    this.tasks.update(tasks => tasks.map(t => (t.id === taskId ? { ...t, ...updates } : t)));
  }

  // Legacy methods for compatibility (no longer used but kept for safety)
  projects = computed(() => [
    {
      id: 'inbox',
      name: 'Inbox',
      description: 'Default',
      tasks: this.tasks(),
    },
  ]);

  currentProject = computed(() => this.projects()[0]);
}
