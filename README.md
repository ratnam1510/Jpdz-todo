# Project Tasks

A beautiful, Todoist-inspired task management extension for VS Code. Manage your development tasks with priorities, due dates, labels, and a stunning dark UI - all without leaving your editor.

![Project Tasks Screenshot](images/screenshot.png)

## Features

- **Workspace-Based Tasks** - Each VS Code project has its own task list
- **Recent Projects** - Switch between workspaces and see all your projects
- **Beautiful Dark UI** - Modern, sleek interface that fits perfectly with VS Code
- **Priorities** - P1-P4 priority levels with color-coded indicators
- **Due Dates** - Beautiful calendar picker with quick-select options (Today, Tomorrow, Next Week)
- **Labels** - Tag tasks and filter by labels
- **Fluid Animations** - Smooth transitions and micro-interactions throughout
- **Keyboard Shortcut** - Quick access with `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows/Linux)
- **Persistent Storage** - Tasks are automatically saved per workspace

## Installation

1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Search for "Project Tasks"
4. Click Install

## Usage

### Opening Project Tasks
- Use the command palette: `Cmd+Shift+P` → "Project Tasks: Open"
- Or use the keyboard shortcut: `Cmd+Shift+T` (Mac) / `Ctrl+Shift+T` (Windows/Linux)

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

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Open Project Tasks | `Cmd+Shift+T` | `Ctrl+Shift+T` |

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

### 1.0.0
- Initial release
- Workspace-based task management
- Beautiful calendar date picker
- Priority system (P1-P4)
- Labels support
- Recent projects switching
- Fluid animations and modern UI
