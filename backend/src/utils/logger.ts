import { config } from '../config/index';

export const logger = {
  info: (message: string, data?: any) => {
    if (config.debug || true) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (config.debug) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
};
