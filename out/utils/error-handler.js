"use strict";
/**
 * Centralized error handling utility
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const vscode = __importStar(require("vscode"));
class ErrorHandler {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Handle an error with user notification and logging
     * @param error - The error object
     * @param userMessage - User-friendly error message
     * @param showNotification - Whether to show a notification to the user
     */
    handleError(error, userMessage, showNotification = true) {
        // Log the full error details
        this.logger.error(userMessage, error);
        // Show user notification if requested
        if (showNotification) {
            vscode.window
                .showErrorMessage(`Jpdz Todo: ${userMessage}`, 'View Logs', 'Dismiss')
                .then(selection => {
                if (selection === 'View Logs') {
                    this.logger.show();
                }
            });
        }
    }
    /**
     * Handle a warning with optional user notification
     * @param message - Warning message
     * @param showNotification - Whether to show a notification to the user
     */
    handleWarning(message, showNotification = false) {
        this.logger.warn(message);
        if (showNotification) {
            vscode.window.showWarningMessage(`Jpdz Todo: ${message}`);
        }
    }
    /**
     * Handle an info message with optional user notification
     * @param message - Info message
     * @param showNotification - Whether to show a notification to the user
     */
    handleInfo(message, showNotification = false) {
        this.logger.info(message);
        if (showNotification) {
            vscode.window.showInformationMessage(`Jpdz Todo: ${message}`);
        }
    }
    /**
     * Wrap an async function with error handling
     * @param fn - The async function to wrap
     * @param errorMessage - Error message to display if function fails
     */
    async wrapAsync(fn, errorMessage) {
        try {
            return await fn();
        }
        catch (error) {
            this.handleError(error instanceof Error ? error : new Error(String(error)), errorMessage);
            return null;
        }
    }
    /**
     * Wrap a sync function with error handling
     * @param fn - The function to wrap
     * @param errorMessage - Error message to display if function fails
     */
    wrap(fn, errorMessage) {
        try {
            return fn();
        }
        catch (error) {
            this.handleError(error instanceof Error ? error : new Error(String(error)), errorMessage);
            return null;
        }
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=error-handler.js.map