# Jpdz Todo

A beautiful, Todoist-inspired task management extension for VS Code. Manage your development tasks with priorities, due dates, labels, and a stunning dark UI - all without leaving your editor.

![Jpdz Todo Screenshot](images/screenshot.png)

## Features

- **Sidebar & Panel Views** - Use in the sidebar or open as a full panel
- **Workspace-Based Tasks** - Each VS Code project has its own isolated task list
- **Real-Time Sync** - Tasks sync across multiple VS Code windows of the same project
- **Responsive Design** - Works perfectly in both narrow sidebar and wide panel views
- **Recent Projects** - Shows VS Code's recent workspaces for quick switching
- **Beautiful Dark UI** - Modern, sleek interface that fits perfectly with VS Code
- **Priorities** - P1-P4 priority levels with color-coded indicators
- **Due Dates** - Beautiful calendar picker with quick-select options (Today, Tomorrow, Next Week)
- **Smart Date Parsing** - Type "tomorrow" or "next week" and dates are auto-detected
- **Labels** - Tag tasks and filter by labels
- **Keyboard Shortcuts** - Full keyboard navigation (press `?` to see all shortcuts)
- **Settings & Trash** - View completed tasks, restore deleted items, manage preferences
- **Fluid Animations** - Smooth transitions and micro-interactions throughout
- **Persistent Storage** - Tasks are automatically saved and synced via VS Code

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

## Development

### Prerequisites
- Node.js 18+
- VS Code

### Setup
```bash
# Install dependencies
npm install

# Build everything
npm run build:all

# Watch for extension changes
npm run watch
```

### Testing
Press `F5` in VS Code to launch the Extension Development Host.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

### 1.1.0
- **Real-time sync** - Tasks now sync across multiple VS Code windows
- **Keyboard shortcuts** - Full keyboard navigation (press `?` to see all)
- **Settings page** - View completed tasks, trash, and preferences
- **Soft delete** - Deleted tasks go to trash and can be restored
- **VS Code recent projects** - Now uses VS Code's actual recent folders
- **Smart date parsing** - Natural language date detection
- **Improved project isolation** - Tasks stay in their own workspace
- **Activity bar icon fix** - Now uses proper monochrome SVG

### 1.0.0
- Initial release
- Workspace-based task management
- Beautiful calendar date picker
- Priority system (P1-P4)
- Labels support
- Recent projects switching
- Fluid animations and modern UI
