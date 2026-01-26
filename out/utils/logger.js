"use strict";
/**
 * Centralized logging service for the extension
 * Replaces console.log/error with proper VS Code OutputChannel logging
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
exports.Logger = exports.LogLevel = void 0;
const vscode = __importStar(require("vscode"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(channelName) {
        this.logLevel = LogLevel.INFO;
        this.outputChannel = vscode.window.createOutputChannel(channelName);
    }
    static getInstance(channelName = 'Jpdz Todo') {
        if (!Logger.instance) {
            Logger.instance = new Logger(channelName);
        }
        return Logger.instance;
    }
    /**
     * Set the minimum log level
     */
    setLogLevel(level) {
        this.logLevel = level;
    }
    /**
     * Log debug message (development only)
     */
    debug(message, ...args) {
        if (this.logLevel <= LogLevel.DEBUG) {
            this.log('DEBUG', message, args);
        }
    }
    /**
     * Log informational message
     */
    info(message, ...args) {
        if (this.logLevel <= LogLevel.INFO) {
            this.log('INFO', message, args);
        }
    }
    /**
     * Log warning message
     */
    warn(message, ...args) {
        if (this.logLevel <= LogLevel.WARN) {
            this.log('WARN', message, args);
        }
    }
    /**
     * Log error message with optional Error object
     */
    error(message, error, ...args) {
        this.log('ERROR', message, args);
        if (error) {
            this.outputChannel.appendLine(`Stack trace: ${error.stack || error.message}`);
        }
    }
    /**
     * Internal logging implementation
     */
    log(level, message, args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
        this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}${formattedArgs}`);
    }
    /**
     * Show the output channel to the user
     */
    show() {
        this.outputChannel.show();
    }
    /**
     * Clear all output
     */
    clear() {
        this.outputChannel.clear();
    }
    /**
     * Dispose of the output channel
     */
    dispose() {
        this.outputChannel.dispose();
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map