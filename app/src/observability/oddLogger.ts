export interface OddLogEntry {
  id: string;
  event: string;
  payload: Record<string, any>;
  timestamp: string;
}

export type OddLogSink = (batch: OddLogEntry[]) => Promise<void>;

const MAX_ODD_LOGS = 1000;
const oddLogsStore: OddLogEntry[] = [];
const oddOutbox: OddLogEntry[] = [];
let activeSink: OddLogSink | null = null;
let nextLogSeq = 1;

/**
 * Registra un sink remoto (ej. Firestore / Cloud Logging) para vaciar la cola ODD.
 */
export function registerOddSink(sink: OddLogSink | null): void {
  activeSink = sink;
}

export function emitOddLog(event: string, payload: Record<string, any>): void {
  const entry: OddLogEntry = {
    id: `odd_${Date.now()}_${nextLogSeq++}`,
    event,
    payload,
    timestamp: new Date().toISOString(),
  };

  if (oddLogsStore.length >= MAX_ODD_LOGS) {
    oddLogsStore.shift();
  }
  oddLogsStore.push(entry);

  if (oddOutbox.length >= MAX_ODD_LOGS) {
    oddOutbox.shift();
  }
  oddOutbox.push(entry);
}

/**
 * Intenta enviar los eventos pendientes al sink remoto; si falla (sin red),
 * los conserva en el outbox para el siguiente reintento.
 */
export async function flushOddOutbox(): Promise<{ flushed: number; pending: number }> {
  if (!activeSink || oddOutbox.length === 0) {
    return { flushed: 0, pending: oddOutbox.length };
  }

  const batch = [...oddOutbox];
  try {
    await activeSink(batch);
    oddOutbox.splice(0, batch.length);
    return { flushed: batch.length, pending: oddOutbox.length };
  } catch {
    return { flushed: 0, pending: oddOutbox.length };
  }
}

export function getPendingOddOutboxCount(): number {
  return oddOutbox.length;
}

export function getOddLogs(event?: string): OddLogEntry[] {
  if (event) {
    return oddLogsStore.filter((log) => log.event === event);
  }
  return [...oddLogsStore];
}

export function clearOddLogs(): void {
  oddLogsStore.length = 0;
  oddOutbox.length = 0;
}
