export type ZoneId = "A" | "B" | "C" | "D";

export const ZONE_LABELS: Record<ZoneId, string> = {
  A: "정문/성균관로",
  B: "600주년기념관/경영관",
  C: "학생회관/도서관",
  D: "후문/명륜동",
};

// 편도 도보 이동시간(분). 팀원 실측치로 교체 예정 — 현재는 추정치.
const DIST: Record<string, number> = {
  "A-A": 0,
  "A-B": 6,
  "A-C": 9,
  "A-D": 8,
  "B-B": 0,
  "B-C": 5,
  "B-D": 12,
  "C-C": 0,
  "C-D": 7,
  "D-D": 0,
};

export function zoneDistance(a: ZoneId, b: ZoneId): number {
  const key = [a, b].sort().join("-");
  return DIST[key] ?? 10;
}

export interface Building {
  name: string;
  zone: ZoneId;
}

export const BUILDINGS: Building[] = [
  { name: "정문", zone: "A" },
  { name: "성균관(명륜당)", zone: "A" },
  { name: "인문사회과학관", zone: "A" },
  { name: "600주년기념관", zone: "B" },
  { name: "경영관", zone: "B" },
  { name: "다산경제관", zone: "B" },
  { name: "학생회관", zone: "C" },
  { name: "중앙학술정보관(도서관)", zone: "C" },
  { name: "국제관", zone: "C" },
  { name: "새천년홀", zone: "C" },
  { name: "후문", zone: "D" },
];
