export interface OddLogEntry {
  event: string;
  payload: Record<string, any>;
  timestamp: string;
}

const oddLogsStore: OddLogEntry[] = [];

export function emitOddLog(event: string, payload: Record<string, any>): void {
  const entry: OddLogEntry = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  };
  oddLogsStore.push(entry);
}

export function getOddLogs(event?: string): OddLogEntry[] {
  if (event) {
    return oddLogsStore.filter((log) => log.event === event);
  }
  return [...oddLogsStore];
}

export function clearOddLogs(): void {
  oddLogsStore.length = 0;
}
