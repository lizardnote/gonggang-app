export type ZoneId = "A" | "B" | "C" | "D" | "E" | "F";

export const ZONE_LABELS: Record<ZoneId, string> = {
  A: "교내 하단(600주년기념관/국제관/학생회관)",
  B: "교내 중앙(중앙학술정보관/경영관)",
  C: "교내 상단 동측(퇴계인문관/다산경제관/수선관)",
  D: "교내 상단 서측(법학관/호암관)",
  E: "쪽문/후문권",
  F: "정문·혜화권",
};

// 편도 도보 이동시간(분) 추정치.
// 팀이 실측한 "중앙학술정보관(B) 기준 왕복이동시간"을 절반으로 나눠 구역-B 편도거리로 삼고,
// 두 구역 사이 거리는 B를 경유하는 것으로 근사(dist(X,Y) = dist(X,B) + dist(B,Y)).
// B는 캠퍼스 지리상 중앙이라 이 근사가 합리적. E(쪽문)는 팀 실사용 실측값(왕복 15분)이라 신뢰도 높음.
// F(정문·혜화권)는 장소별 편차가 커서(왕복 16~28분) 대표값 정확도가 낮음 — 팀 실측 시 우선 교체 대상.
const HUB_DIST: Record<ZoneId, number> = {
  A: 5,
  B: 0,
  C: 4,
  D: 5,
  E: 8,
  F: 12,
};

export function zoneDistance(a: ZoneId, b: ZoneId): number {
  if (a === b) return 0;
  return HUB_DIST[a] + HUB_DIST[b];
}

export interface Building {
  name: string;
  zone: ZoneId;
}

export const BUILDINGS: Building[] = [
  { name: "600주년기념관", zone: "A" },
  { name: "국제관", zone: "A" },
  { name: "학생회관", zone: "A" },
  { name: "중앙학술정보관(도서관)", zone: "B" },
  { name: "경영관", zone: "B" },
  { name: "퇴계인문관", zone: "C" },
  { name: "다산경제관", zone: "C" },
  { name: "수선관", zone: "C" },
  { name: "법학관", zone: "D" },
  { name: "호암관", zone: "D" },
  { name: "쪽문(후문)", zone: "E" },
  { name: "정문", zone: "F" },
  { name: "혜화역", zone: "F" },
];
