export const logger = {
  info(message: string): void {
    console.log(`[agentdemo] ${message}`);
  },
  warn(message: string): void {
    console.warn(`[agentdemo] ${message}`);
  },
  error(message: string): void {
    console.error(`[agentdemo] ${message}`);
  }
};
