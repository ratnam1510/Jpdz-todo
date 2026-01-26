"use strict";
/**
 * Validation utilities for user input
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPriority = isValidPriority;
exports.isValidDate = isValidDate;
exports.sanitizeTaskTitle = sanitizeTaskTitle;
exports.sanitizeTaskDescription = sanitizeTaskDescription;
exports.validatePriority = validatePriority;
exports.isValidWorkspaceId = isValidWorkspaceId;
/**
 * Check if a value is a valid priority level (1-4)
 */
function isValidPriority(value) {
    return [1, 2, 3, 4].includes(value);
}
/**
 * Check if a date string is in valid ISO format and represents a valid date
 */
function isValidDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string')
        return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
}
/**
 * Sanitize and validate task title
 * @param title - The task title to validate
 * @param maxLength - Maximum allowed length (default 500)
 * @returns Sanitized title
 * @throws Error if title is invalid
 */
function sanitizeTaskTitle(title, maxLength = 500) {
    if (!title || typeof title !== 'string') {
        throw new Error('Task title must be a non-empty string');
    }
    const trimmed = title.trim();
    if (trimmed.length === 0) {
        throw new Error('Task title cannot be empty');
    }
    if (trimmed.length > maxLength) {
        throw new Error(`Task title too long (max ${maxLength} characters)`);
    }
    return trimmed;
}
/**
 * Sanitize task description
 * @param description - The task description to validate
 * @param maxLength - Maximum allowed length (default 5000)
 * @returns Sanitized description
 */
function sanitizeTaskDescription(description, maxLength = 5000) {
    if (!description)
        return undefined;
    const trimmed = description.trim();
    if (trimmed.length === 0)
        return undefined;
    if (trimmed.length > maxLength) {
        throw new Error(`Task description too long (max ${maxLength} characters)`);
    }
    return trimmed;
}
/**
 * Validate priority and return safe value
 */
function validatePriority(priority) {
    if (isValidPriority(priority)) {
        return priority;
    }
    // Default to low priority if invalid
    return 4;
}
/**
 * Validate workspace ID format
 */
function isValidWorkspaceId(id) {
    // Workspace IDs should be 12 character hex strings (MD5 hash truncated)
    return /^[a-f0-9]{12}$/.test(id);
}
//# sourceMappingURL=validators.js.map