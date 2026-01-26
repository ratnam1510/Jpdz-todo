/**
 * Date utility functions for consistent date handling across the application
 */

export class DateUtils {
  /**
   * Format a date string for display (e.g., "Today", "Tomorrow", "Jan 15")
   */
  static formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Format a date string in long format (e.g., "Monday, January 15")
   */
  static formatDateLong(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Check if a date string represents today
   */
  static isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().split('T')[0];
  }

  /**
   * Check if a date string is in the past (overdue)
   */
  static isOverdue(dateStr: string): boolean {
    return dateStr < new Date().toISOString().split('T')[0];
  }

  /**
   * Get today's date in ISO format (YYYY-MM-DD)
   */
  static getTodayISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get tomorrow's date in ISO format (YYYY-MM-DD)
   */
  static getTomorrowISO(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date N days from now in ISO format (YYYY-MM-DD)
   */
  static addDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date for ISO storage (YYYY-MM-DD)
   */
  static formatDateISO(year: number, month: number, day: number): string {
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  }

  /**
   * Validate date string format and validity
   */
  static isValidDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
