import { supabase } from "@/lib/supabase";

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

export async function appendLog(entry: LogEntry) {
  const list = getLocalLogs();
  list.push(entry);
  localStorage.setItem(KEY, JSON.stringify(list));

  if (!supabase) return;
  try {
    await supabase.from("gonggang_logs").insert({
      remaining_time: entry.remainingTime,
      current_building: entry.currentBuilding,
      next_building: entry.nextBuilding,
      activity: entry.activity,
      recommended: entry.recommended,
      chosen: entry.chosen,
    });
  } catch {
    // 오프라인 등으로 실패해도 로컬 기록은 이미 남아있음
  }
}

export function getLocalLogs(): LogEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LogEntry[];
  } catch {
    return [];
  }
}

export async function fetchLogs(): Promise<{ logs: LogEntry[]; source: "remote" | "local" }> {
  if (supabase) {
    const { data, error } = await supabase
      .from("gonggang_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return {
        source: "remote",
        logs: data.map((row) => ({
          timestamp: row.created_at,
          remainingTime: row.remaining_time,
          currentBuilding: row.current_building,
          nextBuilding: row.next_building,
          activity: row.activity,
          recommended: row.recommended ?? [],
          chosen: row.chosen,
        })),
      };
    }
  }
  return { source: "local", logs: getLocalLogs().slice().reverse() };
}

export function clearLocalLogs() {
  localStorage.removeItem(KEY);
}
