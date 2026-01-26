# Jpdz Todo - Codebase Fixes Implementation Plan

## Objective

Systematically address all critical, high, and medium priority issues identified in the codebase scrutiny to improve security, reliability, performance, and maintainability of the Jpdz Todo VS Code extension.

---

## Phase 1: Critical Security Fixes (Week 1)

### Priority: CRITICAL 🔴
**Timeline:** 2-3 days

### - [ ] 1.1 Remove Hardcoded API Key and Implement Configuration
**File:** `src/services/ai.service.ts`  
**Issue:** Hardcoded Google AI API key exposes security vulnerability

**Implementation Steps:**
- [ ] 1.1.1 Create VS Code configuration schema in `package.json`:
  ```json
  "configuration": {
    "title": "Jpdz Todo",
    "properties": {
      "jpdz-todo.aiApiKey": {
        "type": "string",
        "default": "",
        "description": "Google Generative AI API key for AI-powered features (optional)"
      },
      "jpdz-todo.enableAiFeatures": {
        "type": "boolean",
        "default": false,
        "description": "Enable AI-powered task generation and suggestions"
      }
    }
  }
  ```
- [ ] 1.1.2 Update `ai.service.ts` constructor to read from VS Code configuration:
  ```typescript
  constructor() {
    const config = vscode.workspace.getConfiguration('jpdz-todo');
    const apiKey = config.get<string>('aiApiKey', '');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }
  ```
- [ ] 1.1.3 Add validation method to check if AI features are available
- [ ] 1.1.4 Update all AI service methods to check for valid API key before execution
- [ ] 1.1.5 Show user-friendly message when AI features are used without API key
- [ ] 1.1.6 Add command to open settings for API key configuration

**Verification:**
- Extension loads without errors when no API key is set
- User sees helpful message when attempting to use AI features without key
- AI features work when valid key is configured
- No hardcoded secrets remain in source code

**Alternative Approach:**
Store API key in VS Code's `SecretStorage` API for enhanced security

---

### - [ ] 1.2 Remove Environment File from Repository
**Files:** `.env.local`, `.git/`  
**Issue:** Environment file committed despite gitignore rule

**Implementation Steps:**
- [ ] 1.2.1 Remove `.env.local` from git history:
  ```bash
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch .env.local" \
    --prune-empty --tag-name-filter cat -- --all
  ```
- [ ] 1.2.2 Alternative: Use BFG Repo-Cleaner for safer history rewrite
- [ ] 1.2.3 Verify `.env.local` is in `.gitignore` (already present at line 17-19)
- [ ] 1.2.4 Create `.env.example` with placeholder values for documentation
- [ ] 1.2.5 Update README with instructions for local environment setup
- [ ] 1.2.6 Force push to remote (coordinate with team if applicable)

**Verification:**
- `git log --all -- .env.local` returns no results
- `.env.local` not visible in GitHub repository
- `.env.example` provides clear guidance for developers

---

### - [ ] 1.3 Implement Secure Content Security Policy
**File:** `src/extension.ts:104-113`  
**Issue:** CSP allows `unsafe-inline` and `unsafe-eval`, loads from external CDNs

**Implementation Steps:**
- [ ] 1.3.1 Remove Tailwind CDN dependency - bundle locally via Angular build
- [ ] 1.3.2 Update `angular.json` to include Tailwind CSS in build assets
- [ ] 1.3.3 Remove `unsafe-eval` from CSP (verify Angular doesn't require it)
- [ ] 1.3.4 Replace `unsafe-inline` with nonce-based approach:
  ```typescript
  const nonce = crypto.randomBytes(16).toString('base64');
  const csp = `
    default-src 'none';
    style-src ${webview.cspSource} 'nonce-${nonce}';
    script-src ${webview.cspSource} 'nonce-${nonce}';
    connect-src https://generativelanguage.googleapis.com;
    font-src ${webview.cspSource};
    img-src ${webview.cspSource} data:;
  `;
  ```
- [ ] 1.3.5 Add nonce to inline scripts in HTML
- [ ] 1.3.6 Make external API connections opt-in via user consent dialog

**Verification:**
- Browser console shows no CSP violations
- Extension functions correctly with strict CSP
- External connections only occur after user consent

---

## Phase 2: High Priority Bug Fixes (Week 2)

### Priority: HIGH 🟠
**Timeline:** 4-5 days

### - [ ] 2.1 Fix File Sync Race Conditions
**File:** `src/extension.ts:300-343`  
**Issue:** Arbitrary delays, no debouncing, multiple events for single write

**Implementation Steps:**
- [ ] 2.1.1 Install debouncing utility or implement custom debouncer
- [ ] 2.1.2 Create `SyncManager` class to encapsulate sync logic:
  ```typescript
  class SyncManager {
    private writeDebounceTimer: NodeJS.Timeout | null = null;
    private readonly DEBOUNCE_DELAY = 300; // ms
    
    debouncedWrite(path: string, data: any): void {
      if (this.writeDebounceTimer) {
        clearTimeout(this.writeDebounceTimer);
      }
      this.writeDebounceTimer = setTimeout(() => {
        this.atomicWrite(path, data);
      }, this.DEBOUNCE_DELAY);
    }
    
    private async atomicWrite(path: string, data: any): Promise<void> {
      const tempPath = `${path}.tmp`;
      await fs.promises.writeFile(tempPath, JSON.stringify(data));
      await fs.promises.rename(tempPath, path);
    }
  }
  ```
- [ ] 2.1.3 Implement event deduplication using timestamp comparison
- [ ] 2.1.4 Add mutex/lock mechanism for concurrent write protection
- [ ] 2.1.5 Replace synchronous `fs.writeFileSync` with async operations
- [ ] 2.1.6 Add comprehensive error handling with user notifications
- [ ] 2.1.7 Implement exponential backoff for retry logic on failures

**Verification:**
- Open 3+ VS Code windows with same workspace
- Rapidly create/modify tasks in all windows simultaneously
- Verify all windows eventually converge to same state
- No data loss or corruption occurs

---

### - [ ] 2.2 Fix Memory Leak in Timer Management
**File:** `src/components/main-view.component.ts:1678-1695`  
**Issue:** Timers not cleaned up on component destruction

**Implementation Steps:**
- [ ] 2.2.1 Change timer type from `any` to `NodeJS.Timeout | null`
- [ ] 2.2.2 Implement `ngOnDestroy` lifecycle hook:
  ```typescript
  ngOnDestroy(): void {
    if (this.undoTimeout) {
      clearTimeout(this.undoTimeout);
      this.undoTimeout = null;
    }
  }
  ```
- [ ] 2.2.3 Clear timer before setting new one in `toggleTask` method
- [ ] 2.2.4 Add cleanup for any other timers used in component
- [ ] 2.2.5 Consider using RxJS timer operators for better lifecycle management

**Verification:**
- Use Chrome DevTools memory profiler
- Create/complete many tasks rapidly
- Navigate away from component
- Verify timers are cleared (check browser console for active timers)
- No memory growth after repeated component mount/unmount

---

### - [ ] 2.3 Add Type Safety and Validation
**Files:** `src/components/main-view.component.ts`, `src/services/store.service.ts`  
**Issue:** Unsafe type assertions, missing runtime validation

**Implementation Steps:**
- [ ] 2.3.1 Create validation utilities in `src/utils/validators.ts`:
  ```typescript
  export function isValidPriority(value: any): value is 1 | 2 | 3 | 4 {
    return [1, 2, 3, 4].includes(value);
  }
  
  export function isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }
  
  export function sanitizeTaskTitle(title: string): string {
    return title.trim().substring(0, 500); // Max length
  }
  ```
- [ ] 2.3.2 Replace unsafe type assertions with validation:
  ```typescript
  const priority = parseInt(priorityMatch[1].charAt(1));
  if (isValidPriority(priority)) {
    this.newTaskPriority.set(priority);
  }
  ```
- [ ] 2.3.3 Add input validation in `store.service.ts:addTask()`:
  ```typescript
  addTask(title: string, priority: 1 | 2 | 3 | 4 = 4, dueDate?: string, projectId?: string) {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }
    if (title.length > 500) {
      throw new Error('Task title too long (max 500 characters)');
    }
    if (dueDate && !isValidDate(dueDate)) {
      throw new Error('Invalid date format');
    }
    // ... rest of implementation
  }
  ```
- [ ] 2.3.4 Replace `any` types with proper interfaces
- [ ] 2.3.5 Add TypeScript strict null checks
- [ ] 2.3.6 Create type guards for VS Code API responses

**Verification:**
- All TypeScript compilation passes with strict mode
- Runtime validation prevents invalid data entry
- User sees helpful error messages for invalid input

---

### - [ ] 2.4 Implement Consistent Error Handling
**Files:** `src/extension.ts`, `src/services/*.ts`  
**Issue:** Inconsistent error handling, silent failures

**Implementation Steps:**
- [ ] 2.4.1 Create centralized error handling utility `src/utils/error-handler.ts`:
  ```typescript
  export class ErrorHandler {
    constructor(private outputChannel: vscode.OutputChannel) {}
    
    handleError(error: Error, userMessage: string, showNotification = true): void {
      this.outputChannel.appendLine(`ERROR: ${error.message}`);
      this.outputChannel.appendLine(error.stack || '');
      
      if (showNotification) {
        vscode.window.showErrorMessage(
          `Jpdz Todo: ${userMessage}`,
          'View Logs'
        ).then(selection => {
          if (selection === 'View Logs') {
            this.outputChannel.show();
          }
        });
      }
    }
    
    handleWarning(message: string, showNotification = false): void {
      this.outputChannel.appendLine(`WARNING: ${message}`);
      if (showNotification) {
        vscode.window.showWarningMessage(`Jpdz Todo: ${message}`);
      }
    }
  }
  ```
- [ ] 2.4.2 Replace all `console.log`/`console.error` with ErrorHandler methods
- [ ] 2.4.3 Add try-catch blocks around all async operations
- [ ] 2.4.4 Implement graceful degradation for non-critical failures
- [ ] 2.4.5 Add error boundaries in Angular components:
  ```typescript
  @Component({ /* ... */ })
  export class AppComponent implements ErrorHandler {
    handleError(error: Error): void {
      // Log and show user-friendly message
    }
  }
  ```
- [ ] 2.4.6 Create error recovery mechanisms (e.g., retry logic, fallback storage)

**Verification:**
- Simulate various error conditions (network failures, file permission issues)
- Verify user receives clear, actionable error messages
- Check OutputChannel logs contain detailed debugging information
- Extension remains functional after errors

---

## Phase 3: Medium Priority Issues (Week 3-4)

### Priority: MEDIUM 🟡
**Timeline:** 6-8 days

### - [ ] 3.1 Refactor Large Component and Extract Template
**File:** `src/components/main-view.component.ts` (1,879 lines)  
**Issue:** Unmaintainable monolithic component

**Implementation Steps:**
- [ ] 3.1.1 Extract inline template to `main-view.component.html`
- [ ] 3.1.2 Create separate component files for logical sections:
  - `task-list.component.ts` - Task rendering and interaction
  - `task-detail-panel.component.ts` - Side panel for task editing
  - `date-picker.component.ts` - Calendar modal
  - `stats-dashboard.component.ts` - Statistics and gamification view
  - `settings-panel.component.ts` - Settings and trash management
  - `add-task-form.component.ts` - Task creation form
- [ ] 3.1.3 Create shared components directory structure:
  ```
  src/components/
    ├── main-view/
    │   ├── main-view.component.ts (orchestrator, ~200 lines)
    │   ├── main-view.component.html
    │   └── main-view.component.scss
    ├── task-list/
    │   ├── task-list.component.ts
    │   ├── task-list.component.html
    │   └── task-item/
    │       └── task-item.component.ts
    ├── task-detail/
    │   └── task-detail-panel.component.ts
    ├── date-picker/
    │   └── date-picker.component.ts
    └── shared/
        └── keyboard-shortcuts-modal/
  ```
- [ ] 3.1.4 Use Angular Input/Output decorators for component communication
- [ ] 3.1.5 Move utility methods to service layer
- [ ] 3.1.6 Extract date formatting logic to `DateUtilService`
- [ ] 3.1.7 Create component-specific stylesheets instead of inline Tailwind

**Verification:**
- All functionality works identically after refactor
- Each component file is < 300 lines
- Components are independently testable
- Code is easier to navigate and understand

---

### - [ ] 3.2 Consolidate Storage Strategy
**Files:** `src/extension.ts`, `src/services/store.service.ts`  
**Issue:** Tasks stored in 3 different places causing inconsistency

**Implementation Steps:**
- [ ] 3.2.1 Choose single source of truth: **VS Code GlobalState** (recommended)
  - Rationale: Available in all VS Code contexts, persisted automatically, no file system dependencies
- [ ] 3.2.2 Create `StorageService` abstraction:
  ```typescript
  export interface IStorageService {
    getTasks(workspaceId: string): Promise<Task[]>;
    saveTasks(workspaceId: string, tasks: Task[]): Promise<void>;
    getSettings(): Promise<Settings>;
    saveSettings(settings: Settings): Promise<void>;
  }
  
  export class VSCodeStorageService implements IStorageService {
    constructor(private context: vscode.ExtensionContext) {}
    
    async getTasks(workspaceId: string): Promise<Task[]> {
      const allTasks = this.context.globalState.get<Record<string, Task[]>>('tasks', {});
      return allTasks[workspaceId] || [];
    }
    
    async saveTasks(workspaceId: string, tasks: Task[]): Promise<void> {
      const allTasks = this.context.globalState.get<Record<string, Task[]>>('tasks', {});
      allTasks[workspaceId] = tasks;
      await this.context.globalState.update('tasks', allTasks);
    }
  }
  ```
- [ ] 3.2.3 Remove localStorage usage from `store.service.ts`
- [ ] 3.2.4 Remove sync.json file-based synchronization
- [ ] 3.2.5 Implement event-based synchronization using VS Code's `Memento` change events
- [ ] 3.2.6 Add migration logic to move existing data to new storage:
  ```typescript
  async migrateOldStorage(): Promise<void> {
    // Read from localStorage and sync.json
    // Write to new storage
    // Clean up old storage
  }
  ```
- [ ] 3.2.7 Update documentation explaining storage architecture

**Verification:**
- Data persists correctly across VS Code restarts
- Multiple windows stay synchronized
- No data loss during migration
- Performance improvement in read/write operations

**Alternative Approaches:**
1. Keep localStorage for stats/settings (non-critical), GlobalState for tasks
2. Use SQLite for local storage if offline-first is priority
3. Implement backend sync service for cloud storage (future feature)

---

### - [ ] 3.3 Replace Console Statements with Proper Logging
**Files:** All TypeScript files  
**Issue:** 7 console.* statements should use VS Code OutputChannel

**Implementation Steps:**
- [ ] 3.3.1 Create `LoggerService` in `src/services/logger.service.ts`:
  ```typescript
  export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
  }
  
  export class LoggerService {
    private static instance: LoggerService;
    private outputChannel: vscode.OutputChannel;
    private logLevel: LogLevel = LogLevel.INFO;
    
    private constructor() {
      this.outputChannel = vscode.window.createOutputChannel('Jpdz Todo');
      const config = vscode.workspace.getConfiguration('jpdz-todo');
      this.logLevel = config.get<LogLevel>('logLevel', LogLevel.INFO);
    }
    
    static getInstance(): LoggerService {
      if (!LoggerService.instance) {
        LoggerService.instance = new LoggerService();
      }
      return LoggerService.instance;
    }
    
    debug(message: string, ...args: any[]): void {
      if (this.logLevel <= LogLevel.DEBUG) {
        this.log('DEBUG', message, args);
      }
    }
    
    info(message: string, ...args: any[]): void {
      if (this.logLevel <= LogLevel.INFO) {
        this.log('INFO', message, args);
      }
    }
    
    warn(message: string, ...args: any[]): void {
      if (this.logLevel <= LogLevel.WARN) {
        this.log('WARN', message, args);
      }
    }
    
    error(message: string, error?: Error, ...args: any[]): void {
      this.log('ERROR', message, args);
      if (error) {
        this.outputChannel.appendLine(error.stack || error.message);
      }
    }
    
    private log(level: string, message: string, args: any[]): void {
      const timestamp = new Date().toISOString();
      const formattedArgs = args.length > 0 ? JSON.stringify(args) : '';
      this.outputChannel.appendLine(
        `[${timestamp}] [${level}] ${message} ${formattedArgs}`
      );
    }
    
    show(): void {
      this.outputChannel.show();
    }
  }
  ```
- [ ] 3.3.2 Replace all instances:
  - `console.log` → `logger.info`
  - `console.error` → `logger.error`
  - `console.warn` → `logger.warn`
  - `console.debug` → `logger.debug`
- [ ] 3.3.3 Add configuration option for log level in `package.json`
- [ ] 3.3.4 Add command to open logs: `jpdz-todo.showLogs`
- [ ] 3.3.5 Implement log rotation or size limits for large logs
- [ ] 3.3.6 Add structured logging for important events (task created, sync completed, etc.)

**Verification:**
- No console.* statements remain in source code
- Logs appear in VS Code Output panel under "Jpdz Todo"
- Log level configuration works correctly
- Logs contain sufficient debugging information

---

### - [ ] 3.4 Fix localStorage Browser Dependency
**File:** `src/services/store.service.ts:220-343`  
**Issue:** localStorage is browser-only, causes issues in tests

**Implementation Steps:**
- [ ] 3.4.1 Create storage abstraction that works in both browser and Node.js:
  ```typescript
  interface IKeyValueStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  }
  
  class WebviewStorage implements IKeyValueStorage {
    getItem(key: string): string | null {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    // ... implement other methods
  }
  ```
- [ ] 3.4.2 Inject storage abstraction into StoreService constructor
- [ ] 3.4.3 For non-browser environments, use VS Code's storage as fallback
- [ ] 3.4.4 Ensure stats and settings are backed up to GlobalState
- [ ] 3.4.5 Add feature detection to check localStorage availability
- [ ] 3.4.6 Update tests to provide mock storage implementation

**Verification:**
- Extension works in webview (panel and sidebar)
- Unit tests can run without browser environment
- Settings persist correctly across sessions
- Fallback mechanism activates when localStorage unavailable

---

### - [ ] 3.5 Extract Constants and Remove Magic Numbers
**Files:** Multiple files throughout codebase  
**Issue:** Magic numbers reduce code readability and maintainability

**Implementation Steps:**
- [ ] 3.5.1 Create `src/constants.ts`:
  ```typescript
  export const APP_CONSTANTS = {
    STORAGE: {
      MAX_RECENT_WORKSPACES: 10,
      WORKSPACE_CACHE_TTL: 3600000, // 1 hour in ms
    },
    SYNC: {
      DEBOUNCE_DELAY_MS: 300,
      FILE_WATCH_DELAY_MS: 50,
      RETRY_ATTEMPTS: 3,
      RETRY_DELAY_MS: 1000,
    },
    UI: {
      UNDO_TOAST_DURATION_MS: 5000,
      FOCUS_RETRY_ATTEMPTS: 5,
      FOCUS_RETRY_DELAY_MS: 50,
      SIDEBAR_BREAKPOINT_PX: 400,
    },
    TASKS: {
      MAX_TITLE_LENGTH: 500,
      MAX_DESCRIPTION_LENGTH: 5000,
      DEFAULT_PRIORITY: 4 as const,
    },
    CALENDAR: {
      DAYS_IN_GRID: 42, // 6 weeks
      DAYS_IN_WEEK: 7,
    },
    STATS: {
      TOP_PROJECTS_COUNT: 5,
      ACTIVITY_CHART_DAYS: 7,
      WEEKLY_AVERAGE_WEEKS: 4,
    },
  } as const;
  
  export const PRIORITY_COLORS = {
    1: { selected: 'bg-red-500', unselected: 'bg-red-500/20', border: 'border-red-500' },
    2: { selected: 'bg-orange-500', unselected: 'bg-orange-500/20', border: 'border-orange-500' },
    3: { selected: 'bg-blue-500', unselected: 'bg-blue-500/20', border: 'border-blue-500' },
    4: { selected: 'bg-gray-500', unselected: 'bg-gray-500/20', border: 'border-gray-500' },
  } as const;
  ```
- [ ] 3.5.2 Replace all magic numbers with named constants
- [ ] 3.5.3 Add JSDoc comments explaining the rationale for each constant
- [ ] 3.5.4 Group related constants together
- [ ] 3.5.5 Export constants from single barrel file

**Verification:**
- No hardcoded numbers in business logic
- Constants have descriptive names
- Easy to modify behavior by changing constants
- TypeScript provides autocomplete for constant names

---

### - [ ] 3.6 Optimize Performance Issues
**Files:** `src/services/store.service.ts`, `src/extension.ts`  
**Issue:** Inefficient computed signals, excessive file operations

**Implementation Steps:**
- [ ] 3.6.1 Implement memoization for expensive computed signals:
  ```typescript
  private taskCache = new Map<string, Task[]>();
  private cacheVersion = 0;
  
  allTasks = computed(() => {
    const wsId = this.workspaceId();
    const cacheKey = `${wsId}-${this.cacheVersion}`;
    
    if (this.taskCache.has(cacheKey)) {
      return this.taskCache.get(cacheKey)!;
    }
    
    const filtered = this.tasks().filter(t => t.projectId === wsId && !t.deletedAt);
    this.taskCache.set(cacheKey, filtered);
    return filtered;
  });
  
  // Invalidate cache when tasks change
  private invalidateCache(): void {
    this.cacheVersion++;
    this.taskCache.clear();
  }
  ```
- [ ] 3.6.2 Debounce file write operations (already covered in 2.1)
- [ ] 3.6.3 Implement virtual scrolling for large task lists:
  ```typescript
  // Use Angular CDK virtual scrolling
  import { ScrollingModule } from '@angular/cdk/scrolling';
  ```
- [ ] 3.6.4 Lazy load stats calculations (compute only when stats tab visible)
- [ ] 3.6.5 Use `trackBy` functions in all `@for` loops to improve rendering:
  ```typescript
  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
  ```
- [ ] 3.6.6 Reduce uniqueLabels computation complexity:
  ```typescript
  // Instead of iterating all tasks every time, maintain a Set
  private labelsCache = signal<Set<string>>(new Set());
  
  updateLabelsCache(tasks: Task[]): void {
    const labels = new Set<string>();
    tasks.forEach(t => t.labels?.forEach(l => labels.add(l)));
    this.labelsCache.set(labels);
  }
  ```
- [ ] 3.6.7 Profile with Chrome DevTools to identify remaining bottlenecks
- [ ] 3.6.8 Implement change detection optimization:
  ```typescript
  @Component({
    changeDetection: ChangeDetectionStrategy.OnPush
  })
  ```

**Verification:**
- Measure performance with 1000+ tasks
- Task list renders < 100ms
- No frame drops during scrolling
- File writes batched and debounced
- Memory usage stays constant over time

---

### - [ ] 3.7 Remove or Complete AI Service Implementation
**File:** `src/services/ai.service.ts`  
**Issue:** Service exists but appears unused, incomplete feature

**Decision Required:** Remove or Complete?

**Option A: Remove AI Service (Recommended for MVP)**
- [ ] 3.7.1 Delete `src/services/ai.service.ts`
- [ ] 3.7.2 Remove `@google/generative-ai` dependency from `package.json`
- [ ] 3.7.3 Remove AI-related configuration from package.json
- [ ] 3.7.4 Update README to remove AI feature mentions
- [ ] 3.7.5 Document as "future feature" in roadmap

**Option B: Complete AI Service Implementation**
- [ ] 3.7.1 Implement API key configuration (covered in 1.1)
- [ ] 3.7.2 Create UI components for AI features:
  - Task generation modal
  - Subtask suggestion in task detail panel
  - Smart task breakdown command
- [ ] 3.7.3 Add commands to `package.json`:
  ```json
  {
    "command": "jpdz-todo.generateTasksFromDescription",
    "title": "Jpdz Todo: Generate Tasks from Description"
  }
  ```
- [ ] 3.7.4 Implement error handling for API failures
- [ ] 3.7.5 Add rate limiting to prevent API quota exhaustion
- [ ] 3.7.6 Add loading states and progress indicators
- [ ] 3.7.7 Create comprehensive documentation for AI features
- [ ] 3.7.8 Add telemetry to track AI feature usage (opt-in)

**Verification:**
- If removed: No references to AI service remain, bundle size reduced
- If completed: AI features work end-to-end, user documentation available

---

## Phase 4: Testing Infrastructure (Week 4-5)

### Priority: HIGH 🟠
**Timeline:** 5-7 days

### - [ ] 4.1 Set Up Testing Framework
**Issue:** Zero test coverage, no testing infrastructure

**Implementation Steps:**
- [ ] 4.1.1 Install testing dependencies:
  ```bash
  npm install --save-dev @types/mocha @types/chai mocha chai @vscode/test-electron
  npm install --save-dev @angular/core/testing karma karma-chrome-launcher karma-jasmine
  ```
- [ ] 4.1.2 Create test configuration in `package.json`:
  ```json
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "ng test --watch=false --browsers=ChromeHeadless",
    "test:integration": "node ./out/test/runTest.js",
    "test:watch": "ng test",
    "test:coverage": "ng test --code-coverage --watch=false"
  }
  ```
- [ ] 4.1.3 Create VS Code extension test runner `src/test/runTest.ts`:
  ```typescript
  import * as path from 'path';
  import { runTests } from '@vscode/test-electron';
  
  async function main() {
    try {
      const extensionDevelopmentPath = path.resolve(__dirname, '../../');
      const extensionTestsPath = path.resolve(__dirname, './suite/index');
      
      await runTests({
        extensionDevelopmentPath,
        extensionTestsPath
      });
    } catch (err) {
      console.error('Failed to run tests');
      process.exit(1);
    }
  }
  
  main();
  ```
- [ ] 4.1.4 Create test suite index `src/test/suite/index.ts`
- [ ] 4.1.5 Configure Karma for Angular tests
- [ ] 4.1.6 Add test coverage thresholds (target: 70%+)

**Verification:**
- `npm test` runs successfully
- Test framework properly configured
- Can run tests in CI environment

---

### - [ ] 4.2 Write Unit Tests for Core Services
**Files:** `src/services/*.spec.ts` (to be created)

**Implementation Steps:**
- [ ] 4.2.1 Create `store.service.spec.ts`:
  ```typescript
  describe('StoreService', () => {
    let service: StoreService;
    let mockVsCodeApi: any;
    
    beforeEach(() => {
      mockVsCodeApi = {
        postMessage: jasmine.createSpy('postMessage'),
        getState: jasmine.createSpy('getState'),
        setState: jasmine.createSpy('setState')
      };
      // Inject mock
    });
    
    describe('addTask', () => {
      it('should add task with valid data', () => {
        service.addTask('Test task', 1, '2026-01-26');
        expect(service.tasks().length).toBe(1);
      });
      
      it('should throw error for empty title', () => {
        expect(() => service.addTask('', 1)).toThrowError();
      });
      
      it('should throw error for invalid priority', () => {
        expect(() => service.addTask('Test', 5 as any)).toThrowError();
      });
    });
    
    describe('toggleTask', () => {
      it('should toggle completion status', () => {
        service.addTask('Test', 1);
        const taskId = service.tasks()[0].id;
        service.toggleTask(taskId);
        expect(service.tasks()[0].completed).toBe(true);
      });
      
      it('should update streak on completion', () => {
        // Test streak logic
      });
    });
    
    // ... more tests
  });
  ```
- [ ] 4.2.2 Test coverage for `store.service.ts`:
  - Task CRUD operations
  - Computed signal calculations
  - Streak tracking logic
  - Stats calculations
  - Workspace switching
- [ ] 4.2.3 Create `logger.service.spec.ts`:
  - Test log level filtering
  - Test output formatting
  - Test error logging with stack traces
- [ ] 4.2.4 Create `ai.service.spec.ts` (if kept):
  - Mock Google AI API responses
  - Test error handling
  - Test configuration validation
- [ ] 4.2.5 Aim for 80%+ code coverage on services

**Verification:**
- All service tests pass
- Edge cases covered (empty inputs, null values, invalid data)
- Tests run in < 5 seconds

---

### - [ ] 4.3 Write Integration Tests for Extension
**Files:** `src/test/suite/*.test.ts` (to be created)

**Implementation Steps:**
- [ ] 4.3.1 Create `extension.test.ts`:
  ```typescript
  import * as assert from 'assert';
  import * as vscode from 'vscode';
  
  suite('Extension Integration Tests', () => {
    vscode.window.showInformationMessage('Running integration tests');
    
    test('Extension should be present', () => {
      assert.ok(vscode.extensions.getExtension('ratnam1510.jpdz-todo'));
    });
    
    test('Extension should activate', async () => {
      const ext = vscode.extensions.getExtension('ratnam1510.jpdz-todo');
      await ext?.activate();
      assert.ok(ext?.isActive);
    });
    
    test('Commands should be registered', async () => {
      const commands = await vscode.commands.getCommands();
      assert.ok(commands.includes('jpdz-todo.openPanel'));
      assert.ok(commands.includes('jpdz-todo.openSidebar'));
    });
    
    test('Should open panel on command', async () => {
      await vscode.commands.executeCommand('jpdz-todo.openPanel');
      // Verify webview panel created
    });
  });
  ```
- [ ] 4.3.2 Create `sync.test.ts`:
  - Test cross-window synchronization
  - Test file watcher behavior
  - Test conflict resolution
  - Test data persistence
- [ ] 4.3.3 Create `storage.test.ts`:
  - Test GlobalState read/write
  - Test migration from old storage
  - Test workspace isolation
- [ ] 4.3.4 Create `webview-communication.test.ts`:
  - Test message passing extension ↔ webview
  - Test workspace data updates
  - Test task synchronization
- [ ] 4.3.5 Set up test workspace with sample data
- [ ] 4.3.6 Implement test utilities for common operations

**Verification:**
- Integration tests pass in VS Code test instance
- Tests cover critical user workflows
- Tests are reliable (no flakiness)

---

### - [ ] 4.4 Write Component Tests for Angular
**Files:** `src/components/**/*.spec.ts` (to be created)

**Implementation Steps:**
- [ ] 4.4.1 Create `main-view.component.spec.ts`:
  ```typescript
  describe('MainViewComponent', () => {
    let component: MainViewComponent;
    let fixture: ComponentFixture<MainViewComponent>;
    let mockStore: jasmine.SpyObj<StoreService>;
    
    beforeEach(async () => {
      mockStore = jasmine.createSpyObj('StoreService', [
        'addTask', 'toggleTask', 'deleteTask', 'updateTask'
      ]);
      
      await TestBed.configureTestingModule({
        imports: [MainViewComponent],
        providers: [
          { provide: StoreService, useValue: mockStore }
        ]
      }).compileComponents();
      
      fixture = TestBed.createComponent(MainViewComponent);
      component = fixture.componentInstance;
    });
    
    it('should create', () => {
      expect(component).toBeTruthy();
    });
    
    it('should show add task form when button clicked', () => {
      component.isAdding.set(false);
      // Simulate button click
      component.isAdding.set(true);
      fixture.detectChanges();
      // Assert form is visible
    });
    
    it('should add task on form submit', () => {
      component.newTaskTitle = 'Test task';
      component.addTask();
      expect(mockStore.addTask).toHaveBeenCalledWith('Test task', 4, undefined, undefined);
    });
  });
  ```
- [ ] 4.4.2 Test keyboard shortcuts functionality
- [ ] 4.4.3 Test date picker component
- [ ] 4.4.4 Test task detail panel
- [ ] 4.4.5 Test smart parsing detection
- [ ] 4.4.6 Test responsive behavior (sidebar vs panel mode)
- [ ] 4.4.7 Aim for 70%+ code coverage on components

**Verification:**
- All component tests pass
- User interactions properly tested
- Component outputs verified
- Accessibility tested (keyboard navigation)

---

### - [ ] 4.5 Set Up Continuous Integration
**Files:** `.github/workflows/ci.yml` (to be created)

**Implementation Steps:**
- [ ] 4.5.1 Create GitHub Actions workflow:
  ```yaml
  name: CI
  
  on:
    push:
      branches: [ main, develop ]
    pull_request:
      branches: [ main, develop ]
  
  jobs:
    test:
      runs-on: ${{ matrix.os }}
      strategy:
        matrix:
          os: [ubuntu-latest, windows-latest, macos-latest]
          node-version: [18.x, 20.x]
      
      steps:
        - uses: actions/checkout@v3
        
        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: ${{ matrix.node-version }}
            cache: 'npm'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Lint
          run: npm run lint
        
        - name: Build
          run: npm run build:all
        
        - name: Run tests
          run: npm test
        
        - name: Upload coverage
          uses: codecov/codecov-action@v3
          if: matrix.os == 'ubuntu-latest'
          with:
            files: ./coverage/lcov.info
    
    package:
      runs-on: ubuntu-latest
      needs: test
      steps:
        - uses: actions/checkout@v3
        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: 18.x
        - run: npm ci
        - run: npm run build:all
        - run: npm run package
        - uses: actions/upload-artifact@v3
          with:
            name: vsix-package
            path: '*.vsix'
  ```
- [ ] 4.5.2 Add ESLint configuration if not present
- [ ] 4.5.3 Configure code coverage reporting (Codecov or similar)
- [ ] 4.5.4 Add status badges to README
- [ ] 4.5.5 Set up branch protection rules requiring passing tests
- [ ] 4.5.6 Configure automated dependency updates (Dependabot)

**Verification:**
- CI pipeline runs on every PR
- All checks must pass before merge
- Coverage reports generated and tracked
- VSIX package built successfully

---

## Phase 5: Code Quality & Documentation (Week 5-6)

### Priority: MEDIUM 🟡
**Timeline:** 4-5 days

### - [ ] 5.1 Add Code Quality Tools
**Files:** `.eslintrc.json`, `.prettierrc`, `tsconfig.json` (to be created/updated)

**Implementation Steps:**
- [ ] 5.1.1 Install ESLint and Prettier:
  ```bash
  npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
  npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
  ```
- [ ] 5.1.2 Create `.eslintrc.json`:
  ```json
  {
    "root": true,
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
      "project": "./tsconfig.json",
      "ecmaVersion": 2022,
      "sourceType": "module"
    },
    "plugins": ["@typescript-eslint"],
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:@typescript-eslint/recommended-requiring-type-checking",
      "prettier"
    ],
    "rules": {
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-console": "error",
      "prefer-const": "error"
    }
  }
  ```
- [ ] 5.1.3 Create `.prettierrc`:
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2,
    "useTabs": false
  }
  ```
- [ ] 5.1.4 Create `.editorconfig`:
  ```ini
  root = true
  
  [*]
  charset = utf-8
  end_of_line = lf
  insert_final_newline = true
  indent_style = space
  indent_size = 2
  trim_trailing_whitespace = true
  
  [*.md]
  trim_trailing_whitespace = false
  ```
- [ ] 5.1.5 Add npm scripts:
  ```json
  "scripts": {
    "lint": "eslint src --ext ts",
    "lint:fix": "eslint src --ext ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\""
  }
  ```
- [ ] 5.1.6 Set up Husky pre-commit hooks:
  ```bash
  npm install --save-dev husky lint-staged
  npx husky install
  npx husky add .husky/pre-commit "npx lint-staged"
  ```
- [ ] 5.1.7 Configure `lint-staged` in `package.json`:
  ```json
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
  ```
- [ ] 5.1.8 Run formatter on entire codebase
- [ ] 5.1.9 Fix all linting errors

**Verification:**
- `npm run lint` passes with zero errors
- Pre-commit hooks prevent commits with linting errors
- Code formatting is consistent across all files
- ESLint catches common TypeScript mistakes

---

### - [ ] 5.2 Improve Documentation
**Files:** `README.md`, `CONTRIBUTING.md` (to be created), `docs/` (to be created)

**Implementation Steps:**
- [ ] 5.2.1 Update README.md with accurate information:
  - Remove AI feature mentions (if removed)
  - Add troubleshooting section
  - Add FAQ section
  - Update screenshots to match current UI
  - Add requirements (VS Code version, Node version)
  - Add known limitations section
- [ ] 5.2.2 Create `CONTRIBUTING.md`:
  ```markdown
  # Contributing to Jpdz Todo
  
  ## Development Setup
  1. Clone the repository
  2. Run `npm install`
  3. Run `npm run build:all`
  4. Press F5 to launch Extension Development Host
  
  ## Running Tests
  - `npm test` - Run all tests
  - `npm run test:watch` - Run tests in watch mode
  
  ## Code Style
  - Follow TypeScript best practices
  - Use meaningful variable names
  - Add JSDoc comments for public APIs
  - Write tests for new features
  
  ## Pull Request Process
  1. Create a feature branch
  2. Make your changes
  3. Add tests
  4. Ensure all tests pass
  5. Update documentation
  6. Submit PR with clear description
  ```
- [ ] 5.2.3 Create `docs/` folder with:
  - `architecture.md` - System architecture overview
  - `storage.md` - Storage strategy explanation
  - `sync.md` - Cross-window synchronization details
  - `api.md` - Extension API documentation
  - `keyboard-shortcuts.md` - Complete shortcut reference
- [ ] 5.2.4 Add JSDoc comments to all public APIs:
  ```typescript
  /**
   * Adds a new task to the current workspace.
   * 
   * @param title - The task title (max 500 characters)
   * @param priority - Priority level (1=urgent, 4=low)
   * @param dueDate - Optional due date in ISO format (YYYY-MM-DD)
   * @param projectId - Optional project ID (defaults to current workspace)
   * @throws {Error} If title is empty or exceeds max length
   * @throws {Error} If date format is invalid
   * @returns The created task ID
   */
  addTask(title: string, priority: 1 | 2 | 3 | 4 = 4, dueDate?: string, projectId?: string): string
  ```
- [ ] 5.2.5 Generate TypeDoc documentation:
  ```bash
  npm install --save-dev typedoc
  npx typedoc --out docs/api src
  ```
- [ ] 5.2.6 Create CHANGELOG.md following Keep a Changelog format
- [ ] 5.2.7 Document configuration options
- [ ] 5.2.8 Add architecture diagrams (use Mermaid or similar)

**Verification:**
- Documentation is clear and comprehensive
- All public APIs have JSDoc comments
- README accurately reflects current functionality
- Contributors can set up development environment following docs

---

### - [ ] 5.3 Refactor Duplicate Code
**Files:** Multiple files with duplicated logic

**Implementation Steps:**
- [ ] 5.3.1 Create `src/utils/date-utils.ts`:
  ```typescript
  export class DateUtils {
    static formatDate(dateStr: string): string {
      const date = new Date(dateStr + 'T00:00:00');
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (dateStr === today.toISOString().split('T')[0]) return 'Today';
      if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    static formatDateLong(dateStr: string): string {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    static isToday(dateStr: string): boolean {
      return dateStr === new Date().toISOString().split('T')[0];
    }
    
    static isOverdue(dateStr: string): boolean {
      return dateStr < new Date().toISOString().split('T')[0];
    }
    
    static getTodayISO(): string {
      return new Date().toISOString().split('T')[0];
    }
    
    static addDays(date: Date, days: number): Date {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
  }
  ```
- [ ] 5.3.2 Create `src/utils/workspace-utils.ts`:
  ```typescript
  export class WorkspaceUtils {
    static generateWorkspaceId(fsPath: string): string {
      return crypto.createHash('md5').update(fsPath).digest('hex').substring(0, 12);
    }
    
    static getCurrentWorkspaceInfo(): WorkspaceInfo | null {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const folder = workspaceFolders[0];
        return {
          name: folder.name,
          id: this.generateWorkspaceId(folder.uri.fsPath),
          path: folder.uri.fsPath
        };
      }
      return null;
    }
  }
  ```
- [ ] 5.3.3 Extract `sendWorkspaceData` logic to reusable function
- [ ] 5.3.4 Create shared styling utilities for priority colors
- [ ] 5.3.5 Extract task filtering logic to separate functions
- [ ] 5.3.6 Create barrel exports `src/utils/index.ts`:
  ```typescript
  export * from './date-utils';
  export * from './workspace-utils';
  export * from './validators';
  export * from './error-handler';
  export * from './logger.service';
  ```
- [ ] 5.3.7 Update all files to use shared utilities

**Verification:**
- No duplicate logic remains
- Utilities are well-tested
- Code is more maintainable
- Bundle size doesn't increase significantly

---

## Phase 6: Architecture & Performance (Week 6-7)

### Priority: MEDIUM 🟡
**Timeline:** 5-7 days

### - [ ] 6.1 Evaluate and Potentially Simplify Architecture
**Issue:** Angular + VS Code dual architecture may be overcomplicated

**Analysis Required:**
- [ ] 6.1.1 Measure current bundle size:
  ```bash
  npm run build:all
  du -h dist/
  du -h out/
  ls -lh *.vsix
  ```
- [ ] 6.1.2 Benchmark extension load time
- [ ] 6.1.3 Profile Angular runtime overhead
- [ ] 6.1.4 Calculate complexity metrics (lines of code, dependencies)

**Decision Matrix:**

| Factor | Keep Angular | Migrate to Vanilla TS |
|--------|-------------|----------------------|
| Bundle Size | ~2-3 MB | ~500 KB |
| Development Speed | Fast (components) | Slower (manual DOM) |
| Maintainability | High (framework) | Medium (custom code) |
| Performance | Good | Excellent |
| Learning Curve | Familiar (if know Angular) | Lower barrier |
| Type Safety | Excellent | Excellent |

**If Keeping Angular:**
- [ ] 6.1.5 Optimize Angular build configuration
- [ ] 6.1.6 Enable production mode optimizations
- [ ] 6.1.7 Implement lazy loading for routes/features
- [ ] 6.1.8 Tree-shake unused Angular features

**If Migrating Away:**
- [ ] 6.1.9 Create vanilla TypeScript + Web Components alternative
- [ ] 6.1.10 Use Lit or similar lightweight library
- [ ] 6.1.11 Implement phased migration plan
- [ ] 6.1.12 Ensure feature parity during migration

**Recommendation:** Keep Angular unless bundle size becomes prohibitive. The productivity gains outweigh the size cost for most users.

---

### - [ ] 6.2 Implement Advanced Sync Strategies
**File:** `src/extension.ts`, new `src/sync/` folder

**Implementation Steps:**
- [ ] 6.2.1 Create `SyncEngine` class with conflict resolution:
  ```typescript
  interface SyncEvent {
    workspaceId: string;
    timestamp: number;
    tasks: Task[];
    source: 'local' | 'remote';
    version: number;
  }
  
  class SyncEngine {
    private lastKnownVersion = new Map<string, number>();
    
    async syncTasks(event: SyncEvent): Promise<Task[]> {
      const currentVersion = this.lastKnownVersion.get(event.workspaceId) || 0;
      
      if (event.version <= currentVersion) {
        // Stale update, ignore
        return this.getCurrentTasks(event.workspaceId);
      }
      
      // Check for conflicts
      const conflicts = this.detectConflicts(event);
      
      if (conflicts.length > 0) {
        return this.resolveConflicts(conflicts, event);
      }
      
      // No conflicts, accept update
      this.lastKnownVersion.set(event.workspaceId, event.version);
      return event.tasks;
    }
    
    private detectConflicts(event: SyncEvent): Conflict[] {
      // Compare timestamps, detect simultaneous edits
    }
    
    private resolveConflicts(conflicts: Conflict[], event: SyncEvent): Task[] {
      // Strategy: Last Write Wins (LWW) or Manual Resolution
      return conflicts.map(c => {
        if (c.local.updatedAt > c.remote.updatedAt) {
          return c.local;
        }
        return c.remote;
      });
    }
  }
  ```
- [ ] 6.2.2 Implement version vectors for causality tracking
- [ ] 6.2.3 Add task-level versioning (not just workspace-level)
- [ ] 6.2.4 Implement CRDT (Conflict-free Replicated Data Type) for tasks
- [ ] 6.2.5 Add conflict resolution UI for user decisions
- [ ] 6.2.6 Log sync events for debugging
- [ ] 6.2.7 Add sync status indicator in UI

**Verification:**
- Open 3 windows, edit same task simultaneously
- Verify conflict resolution works correctly
- No data loss in any scenario
- User can review and resolve conflicts if needed

---

### - [ ] 6.3 Add Telemetry and Analytics (Optional, Opt-In)
**Files:** `src/services/telemetry.service.ts` (to be created)

**Implementation Steps:**
- [ ] 6.3.1 Create telemetry service with strict opt-in:
  ```typescript
  export class TelemetryService {
    private static readonly CONFIG_KEY = 'jpdz-todo.telemetry';
    private enabled = false;
    
    constructor(private context: vscode.ExtensionContext) {
      this.enabled = vscode.workspace
        .getConfiguration('jpdz-todo')
        .get<boolean>('enableTelemetry', false);
    }
    
    async initialize(): Promise<void> {
      if (!this.enabled) {
        // First run: ask user for consent
        const response = await vscode.window.showInformationMessage(
          'Help improve Jpdz Todo by sending anonymous usage data?',
          'Yes', 'No', 'Learn More'
        );
        
        if (response === 'Learn More') {
          vscode.env.openExternal(vscode.Uri.parse('https://...'));
          return;
        }
        
        this.enabled = response === 'Yes';
        await vscode.workspace.getConfiguration('jpdz-todo')
          .update('enableTelemetry', this.enabled, true);
      }
    }
    
    trackEvent(eventName: string, properties?: Record<string, any>): void {
      if (!this.enabled) return;
      
      // Send to telemetry backend (anonymized)
      const event = {
        name: eventName,
        timestamp: Date.now(),
        properties: this.sanitize(properties),
        sessionId: this.getAnonymousSessionId()
      };
      
      // Send to backend or log locally
    }
    
    private sanitize(data: any): any {
      // Remove PII, sanitize task titles/descriptions
      return data;
    }
  }
  ```
- [ ] 6.3.2 Track useful metrics:
  - Extension activation time
  - Task creation/completion counts
  - Feature usage (keyboard shortcuts, date picker, etc.)
  - Error rates
  - Performance metrics
- [ ] 6.3.3 Add configuration option to disable telemetry
- [ ] 6.3.4 Document what data is collected
- [ ] 6.3.5 Provide transparency report showing aggregated data
- [ ] 6.3.6 Ensure GDPR compliance

**Alternative:** Skip telemetry entirely for privacy-focused approach

---

## Phase 7: Final Polish & Release Prep (Week 7-8)

### Priority: LOW 🟢
**Timeline:** 3-4 days

### - [ ] 7.1 UI/UX Improvements
**Files:** Various component files

**Implementation Steps:**
- [ ] 7.1.1 Add loading states for async operations
- [ ] 7.1.2 Improve error messages with actionable suggestions
- [ ] 7.1.3 Add empty state illustrations
- [ ] 7.1.4 Implement toast notifications for actions
- [ ] 7.1.5 Add confirmation dialogs for destructive actions
- [ ] 7.1.6 Improve accessibility (ARIA labels, keyboard navigation)
- [ ] 7.1.7 Add animation preferences (respect prefers-reduced-motion)
- [ ] 7.1.8 Optimize responsive breakpoints
- [ ] 7.1.9 Add dark/light theme support (if not already)
- [ ] 7.1.10 Improve mobile-friendly layout (narrow sidebars)

**Verification:**
- Extension feels polished and professional
- All interactions provide clear feedback
- Meets accessibility standards (WCAG 2.1 AA)
- Works well at all viewport sizes

---

### - [ ] 7.2 Performance Optimization Final Pass
**Files:** All source files

**Implementation Steps:**
- [ ] 7.2.1 Run bundle analyzer:
  ```bash
  npm install --save-dev webpack-bundle-analyzer
  # Analyze and identify large dependencies
  ```
- [ ] 7.2.2 Implement code splitting where appropriate
- [ ] 7.2.3 Lazy load heavy dependencies (chrono-node, etc.)
- [ ] 7.2.4 Optimize images (compress, use appropriate formats)
- [ ] 7.2.5 Minify and compress assets
- [ ] 7.2.6 Profile and optimize hotspots
- [ ] 7.2.7 Reduce initial load time < 500ms
- [ ] 7.2.8 Ensure smooth 60fps animations
- [ ] 7.2.9 Test with 10,000+ tasks to ensure scalability

**Target Metrics:**
- Extension activation time: < 200ms
- First task render: < 100ms
- Task creation: < 50ms
- Bundle size: < 2MB

---

### - [ ] 7.3 Security Audit
**Implementation Steps:**
- [ ] 7.3.1 Run npm audit and fix vulnerabilities
- [ ] 7.3.2 Review all user input handling for XSS
- [ ] 7.3.3 Verify CSP is properly configured
- [ ] 7.3.4 Check for SQL injection (if using database)
- [ ] 7.3.5 Ensure no secrets in source code
- [ ] 7.3.6 Review file system operations for path traversal
- [ ] 7.3.7 Validate all external API calls
- [ ] 7.3.8 Test with malicious input data
- [ ] 7.3.9 Consider third-party security audit

**Verification:**
- No critical or high vulnerabilities
- Extension follows VS Code security best practices
- Data is properly sanitized and validated

---

### - [ ] 7.4 Prepare for Marketplace Release
**Files:** `package.json`, `README.md`, `CHANGELOG.md`, `images/`

**Implementation Steps:**
- [ ] 7.4.1 Update package.json metadata:
  - Version number (semantic versioning)
  - Description (clear, concise)
  - Categories (correct classification)
  - Keywords (searchable terms)
  - Gallery banner configuration
- [ ] 7.4.2 Create high-quality assets:
  - Icon (128x128 PNG)
  - Screenshots (multiple views, high resolution)
  - Demo GIF showing key features
  - Video demo (optional but recommended)
- [ ] 7.4.3 Write compelling marketplace description
- [ ] 7.4.4 Complete CHANGELOG.md with all versions
- [ ] 7.4.5 Add LICENSE file (verify MIT is correct)
- [ ] 7.4.6 Create release notes template
- [ ] 7.4.7 Set up publisher account on VS Code Marketplace
- [ ] 7.4.8 Test extension installation from VSIX
- [ ] 7.4.9 Verify all links in README work
- [ ] 7.4.10 Prepare launch announcement

**Verification:**
- Extension page looks professional
- Screenshots accurately represent functionality
- Installation and setup instructions are clear
- Extension meets marketplace guidelines

---

## Phase 8: Monitoring & Maintenance (Ongoing)

### Priority: ONGOING 🔄

### - [ ] 8.1 Set Up Error Monitoring
**Implementation Steps:**
- [ ] 8.1.1 Integrate error tracking (Sentry, AppInsights, or similar)
- [ ] 8.1.2 Add error boundaries in Angular components
- [ ] 8.1.3 Implement global error handler
- [ ] 8.1.4 Set up alerting for critical errors
- [ ] 8.1.5 Create error dashboard for monitoring
- [ ] 8.1.6 Implement error rate SLOs (< 1% error rate)

---

### - [ ] 8.2 Establish Support Channels
**Implementation Steps:**
- [ ] 8.2.1 Create GitHub issue templates
- [ ] 8.2.2 Set up discussion forum or Discord
- [ ] 8.2.3 Document support policy
- [ ] 8.2.4 Create FAQ from common issues
- [ ] 8.2.5 Set up automated responses for common questions
- [ ] 8.2.6 Define SLA for issue response times

---

### - [ ] 8.3 Plan Future Features
**Ideas to Consider:**
- [ ] Cloud synchronization across devices
- [ ] Team collaboration features
- [ ] Integration with external tools (GitHub Issues, Jira, etc.)
- [ ] Time tracking capabilities
- [ ] Pomodoro timer integration
- [ ] Task templates and recurring tasks
- [ ] Export/import functionality (JSON, CSV, Markdown)
- [ ] Calendar view
- [ ] Gantt chart for project planning
- [ ] AI-powered task prioritization (if AI service implemented)

---

## Success Metrics

### Code Quality
- ✅ Test coverage > 70%
- ✅ Zero console.* statements in production
- ✅ ESLint passes with zero errors
- ✅ TypeScript strict mode enabled
- ✅ All `any` types removed or justified

### Security
- ✅ No hardcoded secrets
- ✅ CSP without unsafe-* directives
- ✅ npm audit shows zero high/critical vulnerabilities
- ✅ User data properly encrypted/sanitized

### Performance
- ✅ Extension activation < 200ms
- ✅ Bundle size < 2MB
- ✅ 60fps animations
- ✅ Handles 10,000+ tasks without degradation

### Reliability
- ✅ No data loss in any scenario
- ✅ Cross-window sync works 100% of time
- ✅ Graceful error handling with user feedback
- ✅ Extension doesn't crash VS Code

### User Experience
- ✅ All features work as documented
- ✅ Clear error messages
- ✅ Keyboard shortcuts fully functional
- ✅ Responsive design at all viewport sizes
- ✅ Accessibility standards met

---

## Risk Mitigation

### Potential Risks

1. **Breaking Changes During Refactor**
   - Mitigation: Comprehensive test coverage before refactoring
   - Mitigation: Feature flags for gradual rollout
   - Mitigation: Maintain backward compatibility

2. **Data Migration Failures**
   - Mitigation: Backup user data before migration
   - Mitigation: Provide rollback mechanism
   - Mitigation: Extensive testing with various data scenarios

3. **Performance Regression**
   - Mitigation: Benchmark before and after changes
   - Mitigation: Performance testing in CI pipeline
   - Mitigation: Monitor real-world metrics post-release

4. **User Adoption of Breaking Changes**
   - Mitigation: Clear communication about changes
   - Mitigation: Provide migration guides
   - Mitigation: Offer support during transition

5. **Timeline Slippage**
   - Mitigation: Prioritize critical issues first
   - Mitigation: Release incrementally (v1.3, v1.4, etc.)
   - Mitigation: Cut scope if necessary (move to future versions)

---

## Release Strategy

### Version 1.3.0 - Security & Critical Fixes (Week 2)
- ✅ Remove hardcoded API key
- ✅ Fix file sync race conditions
- ✅ Fix memory leaks
- ✅ Implement proper error handling
- ✅ Secure CSP

### Version 1.4.0 - Quality & Testing (Week 4)
- ✅ Complete test coverage
- ✅ Remove console statements
- ✅ Fix localStorage issues
- ✅ Code quality tools (ESLint, Prettier)
- ✅ Performance optimizations

### Version 1.5.0 - Architecture Improvements (Week 6)
- ✅ Refactor large components
- ✅ Consolidate storage strategy
- ✅ Extract utilities
- ✅ Optimize bundle size
- ✅ Advanced sync strategies

### Version 2.0.0 - Major Release (Week 8)
- ✅ All issues resolved
- ✅ Comprehensive documentation
- ✅ Polished UI/UX
- ✅ Feature complete
- ✅ Production ready

---

## Post-Implementation Checklist

- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] 70%+ test coverage achieved
- [ ] Documentation complete and accurate
- [ ] CI/CD pipeline functional
- [ ] Security audit passed
- [ ] Performance targets met
- [ ] User acceptance testing completed
- [ ] Marketplace assets prepared
- [ ] Release notes written
- [ ] Support channels established
- [ ] Monitoring and alerting configured

---

## Conclusion

This plan addresses all 28 identified issues across 7 phases spanning approximately 8 weeks of focused development. The plan prioritizes security and critical bugs first, followed by testing infrastructure, code quality, architecture improvements, and finally polish and release preparation.

**Key Principles:**
1. **Safety First** - No data loss, comprehensive testing
2. **Incremental Progress** - Small, testable changes
3. **User Focus** - Maintain functionality, improve UX
4. **Quality Over Speed** - Do it right, not just fast
5. **Transparency** - Document decisions and trade-offs

**Estimated Effort:** 6-8 weeks for one full-time developer, or 12-16 weeks for part-time development.

**Success Criteria:** Extension is secure, reliable, maintainable, well-tested, and provides excellent user experience.