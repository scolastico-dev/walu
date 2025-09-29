import { openDb, readFromStore, STORAGE_STORE, writeToStore } from "./database";
import { IStorageData } from "./types";

/**
 * Logging levels for WALU
 */
export type LogLevel = 'NONE' | 'ERROR' | 'WARN' | 'INFO';

const LOG_LEVEL_KEY = 'log-level';
const DEFAULT_LOG_LEVEL: LogLevel = 'INFO';

/**
 * Gets the current log level from sessionStorage or returns the default
 * @returns The current log level
 */
async function getLogLevel(): Promise<LogLevel> {
  try {
    await openDb();
    const data = await readFromStore<IStorageData>(STORAGE_STORE, LOG_LEVEL_KEY);
    if (data) {
      return data.value as LogLevel;
    }
  } catch (e) {
    // db might not be available, continue silently
  }
  return DEFAULT_LOG_LEVEL;
}

/**
 * Sets the logging level for WALU and stores it in sessionStorage
 * @param level - The log level to set: "NONE", "ERROR", "WARN", or "INFO"
 */
export async function setLogging(level: LogLevel): Promise<void> {
  await openDb();
  await writeToStore<IStorageData>(STORAGE_STORE, { key: LOG_LEVEL_KEY, value: level });
}

/**
 * Checks if a log level should be shown based on the current log level
 * @param level - The level to check
 * @returns true if the level should be shown
 */
async function shouldLog(level: LogLevel): Promise<boolean> {
  const currentLevel = await getLogLevel();
  
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
  error: async (message: string, ...args: any[]): Promise<void> => {
    if (await shouldLog('ERROR')) console.error(`[WALU] ${message}`, ...args);
  },

  /**
   * Logs a warning message
   * @param message - The message to log
   * @param args - Additional arguments
   */
  warn: async (message: string, ...args: any[]): Promise<void> => {
    if (await shouldLog('WARN')) console.warn(`[WALU] ${message}`, ...args);
  },

  /**
   * Logs an info message
   * @param message - The message to log
   * @param args - Additional arguments
   */
  info: async (message: string, ...args: any[]): Promise<void> => {
    if (await shouldLog('INFO')) console.log(`[WALU] ${message}`, ...args);
  }
};
