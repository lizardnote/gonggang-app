export interface LogEntry {
  timestamp: string;
  remainingTime: number;
  currentBuilding: string;
  nextBuilding: string;
  activity: string;
  recommended: string[];
  chosen: string;
  note?: string;
}

const KEY = "gonggang_log";

export function appendLog(entry: LogEntry) {
  const list = getLogs();
  list.push(entry);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getLogs(): LogEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LogEntry[];
  } catch {
    return [];
  }
}

export function clearLogs() {
  localStorage.removeItem(KEY);
}
