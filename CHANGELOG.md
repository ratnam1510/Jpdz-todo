# Changelog

All notable changes to the "Project Tasks" extension will be documented in this file.

## [1.2.0] - 2026-01-25

### Added
- **Gamification Stats Dashboard** - Beautiful stats page with comprehensive productivity metrics
  - Total tasks completed (all-time, across all projects)
  - Current streak and longest streak tracking
  - Daily and weekly completion counts
  - Interactive 7-day activity bar chart
  - Best day achievement tracking
  - Project leaderboard with medal-style rankings (gold/silver/bronze)
  - Weekly average calculations
- **Smart Project Detection** - Fuzzy matching for project names while typing
  - Type partial project names and see suggestions
  - Use `#projectname` or `@projectname` syntax for explicit targeting
  - Visual feedback showing detected project, date, and priority
  - Click to confirm detected project
- **Enhanced Smart Parsing Feedback** - See what's being detected in real-time
  - Color-coded pills for detected items
  - Shows parsed date conversions (e.g., "tomorrow" → "Jan 26")
  - Priority detection with colored indicators

### Improved
- **Cross-Window Sync** - More reliable task syncing between VS Code windows
  - Uses native file system watching for instant sync
  - Tasks sync via shared file for cross-process reliability
  - No more need to close and reopen to see updates
- **Responsive Navigation Bar** - Better handling of narrow sidebar widths
  - Icons-only mode at very narrow widths
  - Tooltips for accessibility
  - Evenly distributed buttons
- **Auto-Focus on Add Task** - Input automatically focuses when opening add task form
  - Works with both button clicks and keyboard shortcuts (N/A keys)
  - Retries focus to handle DOM timing issues

### Fixed
- Module import error for `@google/generative-ai`
- Sync file watcher now properly detects changes across extension host processes

## [1.1.0] - 2026-01-24

### Added
- **Real-time sync** - Tasks sync across multiple VS Code windows
- **Keyboard shortcuts** - Full keyboard navigation (press `?` to see all)
- **Settings page** - View completed tasks, trash, and preferences
- **Soft delete** - Deleted tasks go to trash and can be restored
- **VS Code recent projects** - Now uses VS Code's actual recent folders
- **Smart date parsing** - Natural language date detection
- **Improved project isolation** - Tasks stay in their own workspace

### Fixed
- Activity bar icon now uses proper monochrome SVG

## [1.0.0] - 2026-01-24

### Added
- Initial release
- Workspace-based task management - each VS Code project has its own tasks
- Beautiful dark UI with smooth animations
- Priority system (P1-P4) with color-coded indicators
- Beautiful calendar date picker with quick-select options
- Labels support for organizing tasks
- Recent projects sidebar to switch between workspaces
- Today and Upcoming views for time-based filtering
- Keyboard shortcut (Cmd/Ctrl+Shift+T) for quick access
- Persistent storage using localStorage per workspace
- Task detail panel for editing
- Fluid animations throughout the UI
