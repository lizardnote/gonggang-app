import locationsRaw from "@/data/locations.json";
import { ZoneId, zoneDistance } from "@/data/zones";

export type Activity = "전체" | "공부" | "식사" | "휴식" | "산책";

export interface Location {
  id: string;
  name: string;
  zone: ZoneId;
  categories: string[];
  duration: number;
  emoji: string;
  desc: string;
}

export interface Recommendation {
  location: Location;
  travelIn: number;
  travelOut: number;
  totalTime: number;
  buffer: number;
  reason: string;
  tight: boolean;
}

const LOCATIONS = locationsRaw as Location[];

export function recommend(
  remainingTime: number,
  currentZone: ZoneId,
  nextZone: ZoneId,
  activity: Activity
): Recommendation[] {
  const candidates = LOCATIONS.filter(
    (loc) => activity === "전체" || loc.categories.includes(activity)
  );

  const scored: Recommendation[] = candidates.map((loc) => {
    const travelIn = zoneDistance(currentZone, loc.zone);
    const travelOut = zoneDistance(loc.zone, nextZone);
    const totalTime = travelIn + loc.duration + travelOut;
    const buffer = remainingTime - totalTime;
    const tight = buffer < 0;
    const reason = tight
      ? `이동은 ${travelIn}분이면 되지만, 활동 후 다음 수업까지 여유가 빠듯해요.`
      : `이동 ${travelIn}분 + 활동 약 ${loc.duration}분 + 다음 수업까지 ${travelOut}분 — 공강 ${remainingTime}분 안에 ${buffer}분 여유 있어요.`;
    return { location: loc, travelIn, travelOut, totalTime, buffer, reason, tight };
  });

  scored.sort((a, b) => {
    if (a.tight !== b.tight) return a.tight ? 1 : -1;
    return a.travelIn * 2 + a.totalTime * 0.3 - (b.travelIn * 2 + b.totalTime * 0.3);
  });

  return scored.slice(0, 3);
}
