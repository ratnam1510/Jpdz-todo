/**
 * Centralized logging service for the extension
 * Replaces console.log/error with proper VS Code OutputChannel logging
 */

import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static instance: Logger;
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor(channelName: string) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  static getInstance(channelName = 'Jpdz Todo'): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(channelName);
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.log('DEBUG', message, args);
    }
  }

  /**
   * Log informational message
   */
  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.log('INFO', message, args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.log('WARN', message, args);
    }
  }

  /**
   * Log error message with optional Error object
   */
  error(message: string, error?: Error, ...args: any[]): void {
    this.log('ERROR', message, args);
    if (error) {
      this.outputChannel.appendLine(`Stack trace: ${error.stack || error.message}`);
    }
  }

  /**
   * Internal logging implementation
   */
  private log(level: string, message: string, args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}${formattedArgs}`);
  }

  /**
   * Show the output channel to the user
   */
  show(): void {
    this.outputChannel.show();
  }

  /**
   * Clear all output
   */
  clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Dispose of the output channel
   */
  dispose(): void {
    this.outputChannel.dispose();
  }
}
