/**
 * Centralized error handling utility
 */

import * as vscode from 'vscode';
import { Logger } from './logger';

export class ErrorHandler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Handle an error with user notification and logging
   * @param error - The error object
   * @param userMessage - User-friendly error message
   * @param showNotification - Whether to show a notification to the user
   */
  handleError(error: Error, userMessage: string, showNotification = true): void {
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
  handleWarning(message: string, showNotification = false): void {
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
  handleInfo(message: string, showNotification = false): void {
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
  async wrapAsync<T>(fn: () => Promise<T>, errorMessage: string): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)), errorMessage);
      return null;
    }
  }

  /**
   * Wrap a sync function with error handling
   * @param fn - The function to wrap
   * @param errorMessage - Error message to display if function fails
   */
  wrap<T>(fn: () => T, errorMessage: string): T | null {
    try {
      return fn();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)), errorMessage);
      return null;
    }
  }
}
