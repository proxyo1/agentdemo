export const logger = {
  info(message: string): void {
    console.log(`[auto-demo] ${message}`);
  },
  warn(message: string): void {
    console.warn(`[auto-demo] ${message}`);
  },
  error(message: string): void {
    console.error(`[auto-demo] ${message}`);
  }
};
