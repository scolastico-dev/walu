/**
 * Logging levels for WALU
 */
export type LogLevel = 'NONE' | 'ERROR' | 'WARN' | 'INFO';

const LOG_LEVEL_KEY = 'walu-log-level';
const DEFAULT_LOG_LEVEL: LogLevel = 'INFO';

/**
 * Gets the current log level from sessionStorage or returns the default
 * @returns The current log level
 */
function getLogLevel(): LogLevel {
  try {
    const stored = sessionStorage.getItem(LOG_LEVEL_KEY);
    if (stored && ['NONE', 'ERROR', 'WARN', 'INFO'].includes(stored)) {
      return stored as LogLevel;
    }
  } catch (e) {
    // sessionStorage might not be available
  }
  return DEFAULT_LOG_LEVEL;
}

/**
 * Sets the logging level for WALU and stores it in sessionStorage
 * @param level - The log level to set: "NONE", "ERROR", "WARN", or "INFO"
 */
export function setLogging(level: LogLevel): void {
  try {
    sessionStorage.setItem(LOG_LEVEL_KEY, level);
  } catch (e) {
    // sessionStorage might not be available, continue silently
  }
}

/**
 * Checks if a log level should be shown based on the current log level
 * @param level - The level to check
 * @returns true if the level should be shown
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  
  if (currentLevel === 'NONE') return false;
  if (currentLevel === 'ERROR') return level === 'ERROR';
  if (currentLevel === 'WARN') return level === 'ERROR' || level === 'WARN';
  if (currentLevel === 'INFO') return level === 'ERROR' || level === 'WARN' || level === 'INFO';
  
  return false;
}

/**
 * WALU logger with configurable log levels
 */
export const logger = {
  /**
   * Logs an error message
   * @param message - The message to log
   * @param args - Additional arguments
   */
  error: (message: string, ...args: any[]): void => {
    if (shouldLog('ERROR')) console.error(`[WALU] ${message}`, ...args);
  },

  /**
   * Logs a warning message
   * @param message - The message to log
   * @param args - Additional arguments
   */
  warn: (message: string, ...args: any[]): void => {
    if (shouldLog('WARN')) console.warn(`[WALU] ${message}`, ...args);
  },

  /**
   * Logs an info message
   * @param message - The message to log
   * @param args - Additional arguments
   */
  info: (message: string, ...args: any[]): void => {
    if (shouldLog('INFO')) console.log(`[WALU] ${message}`, ...args);
  }
};
