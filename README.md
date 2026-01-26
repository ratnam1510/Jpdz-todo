# Jpdz Todo

A beautiful, Todoist-inspired task management extension for VS Code. Manage your development tasks with priorities, due dates, labels, and a stunning dark UI - all without leaving your editor.

![Jpdz Todo Screenshot](images/screenshot.png)

## Features

### Core Features
- **Sidebar & Panel Views** - Use in the sidebar or open as a full panel
- **Workspace-Based Tasks** - Each VS Code project has its own isolated task list
- **Real-Time Cross-Window Sync** - Tasks sync instantly across multiple VS Code windows
- **Responsive Design** - Works perfectly in both narrow sidebar and wide panel views
- **Recent Projects** - Shows VS Code's recent workspaces for quick switching
- **Beautiful Dark UI** - Modern, sleek interface that fits perfectly with VS Code

### Task Management
- **Priorities** - P1-P4 priority levels with color-coded indicators
- **Due Dates** - Beautiful calendar picker with quick-select options (Today, Tomorrow, Next Week)
- **Labels** - Tag tasks and filter by labels
- **Settings & Trash** - View completed tasks, restore deleted items, manage preferences

### Smart Parsing
- **Smart Date Detection** - Type "tomorrow", "next week", "Jan 15" and dates are auto-detected
- **Smart Project Detection** - Type partial project names or use `#projectname` syntax
- **Smart Priority Detection** - Type "p1", "p2", etc. to set priority
- **Visual Feedback** - See detected items highlighted in real-time as you type

### Gamification & Stats 🎮
- **Productivity Dashboard** - Beautiful stats page with comprehensive metrics
- **Streak Tracking** - Track your current and longest completion streaks
- **Daily & Weekly Stats** - See how many tasks you complete each day
- **7-Day Activity Chart** - Visual bar chart of your recent activity
- **Project Leaderboard** - See which projects you're most productive in
- **Best Day Achievement** - Track your most productive day ever

### Keyboard-First Design
- **Full Keyboard Navigation** - Press `?` to see all shortcuts
- **Quick Task Creation** - Press `N` or `A` to add a task instantly
- **Vim-Style Navigation** - Use `J`/`K` to navigate tasks

### Quality of Life
- **Fluid Animations** - Smooth transitions and micro-interactions throughout
- **Persistent Storage** - Tasks are automatically saved and synced via VS Code
- **Auto-Focus** - Input fields automatically focus when adding tasks

## Installation

1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Search for "Jpdz Todo"
4. Click Install

## Usage

### Opening Jpdz Todo
- **Sidebar**: Click the Jpdz Todo icon in the Activity Bar (left sidebar)
- **Panel**: Use command palette: `Cmd+Shift+P` → "Jpdz Todo: Open in Panel"
- **Keyboard**: `Cmd+Shift+T` (Mac) / `Ctrl+Shift+T` (Windows/Linux)

### Adding Tasks
1. Click "Add new task" or the + button
2. Enter your task title
3. Set a due date using the calendar picker
4. Choose a priority (P1-P4)
5. Press Enter or click "Add Task"

### Managing Tasks
- **Complete a task**: Click the checkbox
- **Edit a task**: Click on any task to open the detail panel
- **Set due date**: Use the beautiful calendar modal
- **Add labels**: Type in the label field and press Enter
- **Delete a task**: Open the task and click "Delete Task"

### Views
- **All Tasks**: See all incomplete tasks in the current workspace
- **Today**: Tasks due today
- **Upcoming**: Tasks with future due dates
- **Labels**: Filter by any label you've created

### Switching Projects
The sidebar shows all VS Code workspaces where you've used this extension. Click any project to switch to it (opens the folder in VS Code).

## Keyboard Shortcuts

Press `?` at any time to see all keyboard shortcuts in the app.

### Global VS Code Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Open in Panel | `Cmd+Shift+T` | `Ctrl+Shift+T` |

### In-App Shortcuts

#### General
| Action | Shortcut |
|--------|----------|
| Show shortcuts help | `?` |
| Close modal/panel | `Esc` |

#### Tasks
| Action | Shortcut |
|--------|----------|
| New task | `N` or `A` |
| Complete task | `Space` or `Enter` |
| Delete task | `Delete` or `Backspace` |
| Set priority 1 (Urgent) | `1` |
| Set priority 2 (High) | `2` |
| Set priority 3 (Medium) | `3` |
| Set priority 4 (Low) | `4` |

#### Dates
| Action | Shortcut |
|--------|----------|
| Open date picker | `D` |
| Set due today | `T` |

#### Navigation
| Action | Shortcut |
|--------|----------|
| Next task | `↓` or `J` |
| Previous task | `↑` or `K` |

## Troubleshooting

### Tasks Not Syncing Between Windows
If tasks aren't syncing across VS Code windows:
1. Make sure both windows are open to the same workspace folder
2. Check that the workspace has been opened at least once with the extension active
3. Try closing and reopening one of the windows

### Tasks Disappeared
Don't worry! Tasks are stored in VS Code's global storage. Check:
1. The **Settings** page → **Trash** section to restore deleted tasks
2. Make sure you're viewing the correct workspace (check the workspace selector)

### Extension Not Loading
1. Reload VS Code window: `Cmd+Shift+P` → "Developer: Reload Window"
2. Check the Developer Console: `Help` → `Toggle Developer Tools` → look for errors
3. Try reinstalling the extension

### Performance Issues
If the extension feels slow:
1. Check if you have a very large number of tasks (>1000)
2. Archive old completed tasks from the Settings page
3. Consider creating separate workspaces for different projects

## Roadmap

### Upcoming Features 🚧
- **AI-Powered Task Generation** - Describe what you need to do, get structured tasks (API key required)
- **Natural Language Task Parsing** - Enhanced NLP for better task understanding
- **Cloud Sync** - Optional cloud backup and cross-device sync
- **Subtasks** - Break down complex tasks into smaller steps
- **Time Tracking** - Track time spent on tasks
- **Recurring Tasks** - Set tasks to repeat daily, weekly, etc.

### Configuration (Coming Soon)
Some features will require configuration:
- AI features require a Google Gemini API key (you can get one free at [Google AI Studio](https://makersuite.google.com/app/apikey))
- Cloud sync will be opt-in with your own storage provider

## Development

### Prerequisites
- Node.js 18.20.5+ (see `.nvmrc`)
- npm 9.x or higher
- VS Code 1.85.0 or higher

### Setup
```bash
# Install dependencies
npm install

# Build everything
npm run build:all

# Watch for extension changes (TypeScript)
npm run watch

# Develop Angular app with live reload
npm run dev
```

### Project Structure
```
src/
├── extension.ts              # Main extension entry point
├── app.component.ts          # Root Angular component  
├── components/               # Angular UI components
│   ├── main-view.component.ts
│   └── sidebar.component.ts
├── services/                 # Business logic
│   ├── store.service.ts     # Task storage & state
│   └── ai.service.ts        # AI integration (upcoming)
└── utils/                    # Shared utilities
    ├── constants.ts
    ├── date-utils.ts
    ├── error-handler.ts
    ├── logger.ts
    └── validators.ts
```

### Testing
```bash
# Launch Extension Development Host
# Press F5 in VS Code

# Or use the Run and Debug panel
# Select "Run Extension" and click play
```

### Code Quality
```bash
# Run linter (once ESLint is configured)
npm run lint

# Format code (once Prettier is configured)
npm run format

# Type check
npm run build-ext
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up your development environment
- Code style and best practices
- Submitting pull requests
- Reporting bugs and requesting features

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

### 1.2.0 (Latest)
- **Gamification Stats Dashboard** - Track streaks, daily/weekly completions, project leaderboard
- **Smart Project Detection** - Fuzzy matching for project names while typing
- **Enhanced Smart Parsing** - Visual feedback for detected dates, priorities, and projects
- **Improved Cross-Window Sync** - More reliable sync using native file system watching
- **Responsive Navigation** - Better handling of narrow sidebar widths
- **Auto-Focus** - Input automatically focuses when adding tasks

### 1.1.0
- **Real-time sync** - Tasks now sync across multiple VS Code windows
- **Keyboard shortcuts** - Full keyboard navigation (press `?` to see all)
- **Settings page** - View completed tasks, trash, and preferences
- **Soft delete** - Deleted tasks go to trash and can be restored
- **VS Code recent projects** - Now uses VS Code's actual recent folders
- **Smart date parsing** - Natural language date detection
- **Improved project isolation** - Tasks stay in their own workspace

### 1.0.0
- Initial release
- Workspace-based task management
- Beautiful calendar date picker
- Priority system (P1-P4)
- Labels support
- Recent projects switching
- Fluid animations and modern UI
