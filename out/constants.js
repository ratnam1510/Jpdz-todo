"use strict";
/**
 * Application-wide constants for Jpdz Todo extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIORITY_COLORS = exports.APP_CONSTANTS = void 0;
exports.APP_CONSTANTS = {
    STORAGE: {
        /** Maximum number of recent workspaces to track */
        MAX_RECENT_WORKSPACES: 10,
        /** Cache time-to-live in milliseconds (1 hour) */
        WORKSPACE_CACHE_TTL: 3600000,
    },
    SYNC: {
        /** Debounce delay for file write operations (ms) */
        DEBOUNCE_DELAY_MS: 300,
        /** Delay after file watch event before processing (ms) */
        FILE_WATCH_DELAY_MS: 100,
        /** Number of retry attempts for failed operations */
        RETRY_ATTEMPTS: 3,
        /** Delay between retry attempts (ms) */
        RETRY_DELAY_MS: 1000,
    },
    UI: {
        /** Duration to show undo toast notification (ms) */
        UNDO_TOAST_DURATION_MS: 5000,
        /** Number of attempts to focus input element */
        FOCUS_RETRY_ATTEMPTS: 5,
        /** Delay between focus retry attempts (ms) */
        FOCUS_RETRY_DELAY_MS: 50,
        /** Viewport width breakpoint for sidebar mode (px) */
        SIDEBAR_BREAKPOINT_PX: 400,
        /** Delay before sending workspace data to webview (ms) */
        WORKSPACE_DATA_DELAY_MS: 500,
    },
    TASKS: {
        /** Maximum allowed length for task title */
        MAX_TITLE_LENGTH: 500,
        /** Maximum allowed length for task description */
        MAX_DESCRIPTION_LENGTH: 5000,
        /** Default priority level for new tasks */
        DEFAULT_PRIORITY: 4,
    },
    CALENDAR: {
        /** Total days to display in calendar grid (6 weeks) */
        DAYS_IN_GRID: 42,
        /** Days per week */
        DAYS_IN_WEEK: 7,
    },
    STATS: {
        /** Number of top projects to display in leaderboard */
        TOP_PROJECTS_COUNT: 5,
        /** Number of days to show in activity chart */
        ACTIVITY_CHART_DAYS: 7,
        /** Number of weeks for calculating weekly average */
        WEEKLY_AVERAGE_WEEKS: 4,
    },
};
/**
 * Priority color configurations for UI styling
 */
exports.PRIORITY_COLORS = {
    1: {
        selected: 'bg-red-500 text-white',
        unselected: 'bg-[#252525] text-red-400 hover:bg-red-500/20',
        border: 'border-red-500 text-red-500',
        dot: 'bg-red-500',
    },
    2: {
        selected: 'bg-orange-500 text-white',
        unselected: 'bg-[#252525] text-orange-400 hover:bg-orange-500/20',
        border: 'border-orange-500 text-orange-500',
        dot: 'bg-orange-500',
    },
    3: {
        selected: 'bg-blue-500 text-white',
        unselected: 'bg-[#252525] text-blue-400 hover:bg-blue-500/20',
        border: 'border-blue-500 text-blue-500',
        dot: 'bg-blue-500',
    },
    4: {
        selected: 'bg-[#444] text-white',
        unselected: 'bg-[#252525] text-[#666] hover:bg-[#333]',
        border: 'border-[#555] text-[#555]',
        dot: 'bg-[#444]',
    },
};
//# sourceMappingURL=constants.js.map