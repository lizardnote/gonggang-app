"use client";

import { useEffect, useMemo, useState } from "react";
import { BUILDINGS } from "@/data/zones";
import { Activity, Recommendation, recommend } from "@/lib/recommend";
import { appendLog, fetchLogs, LogEntry } from "@/lib/log";

const TIME_OPTIONS = [30, 45, 60, 90, 120];
const ACTIVITIES: Activity[] = ["전체", "공부", "식사", "휴식", "산책"];
const REJECT_REASONS = ["너무 멀어요", "장소가 맘에 안 들어요", "기타"];

type Step = "intro" | "input" | "result";

export default function Home() {
  // 데모 영상용 버전 토글: ?v=1, ?v=2, 기본(파라미터 없음)=v3
  const [version, setVersion] = useState<1 | 2 | 3>(3);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    // URL은 서버 렌더링 시점엔 알 수 없는 외부 상태라 마운트 후에만 읽을 수 있음
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v === "1" || v === "2") setVersion(Number(v) as 1 | 2);
  }, []);

  const [step, setStep] = useState<Step>("intro");
  const [decisionStart, setDecisionStart] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(60);
  const [currentBuilding, setCurrentBuilding] = useState(BUILDINGS[0].name);
  const [nextBuilding, setNextBuilding] = useState(BUILDINGS[3].name);
  const [activity, setActivity] = useState<Activity>("전체");

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logSource, setLogSource] = useState<"remote" | "local">("local");
  const [logLoading, setLogLoading] = useState(false);

  const currentZone = useMemo(
    () => BUILDINGS.find((b) => b.name === currentBuilding)!.zone,
    [currentBuilding]
  );
  const nextZone = useMemo(
    () => BUILDINGS.find((b) => b.name === nextBuilding)!.zone,
    [nextBuilding]
  );

  function handleSearch() {
    const results = recommend(remainingTime, currentZone, nextZone, activity);
    setRecommendations(results);
    setSelected(null);
    setStep("result");
    setDecisionStart(new Date().getTime());
  }

  function handleChoose(rec: Recommendation) {
    if (selected?.location.id === rec.location.id) {
      setSelected(null);
      return;
    }
    setSelected(rec);
    appendLog({
      timestamp: new Date().toISOString(),
      remainingTime,
      currentBuilding,
      nextBuilding,
      activity,
      recommended: recommendations.map((r) => r.location.name),
      chosen: rec.location.name,
      decisionMs: decisionStart ? new Date().getTime() - decisionStart : undefined,
    });
  }

  function handleReject(reason: string) {
    appendLog({
      timestamp: new Date().toISOString(),
      remainingTime,
      currentBuilding,
      nextBuilding,
      activity,
      recommended: recommendations.map((r) => r.location.name),
      chosen: "",
      rejectReason: reason,
      decisionMs: decisionStart ? new Date().getTime() - decisionStart : undefined,
    });
    setShowReject(false);
  }

  function mapUrl(name: string) {
    return `https://map.kakao.com/link/search/${encodeURIComponent(`${name} 성균관대`)}`;
  }

  async function handleShare(rec: Recommendation) {
    const text = `${rec.location.name}${rec.location.desc ? " - " + rec.location.desc : ""}`;
    const url = mapUrl(rec.location.name);
    if (navigator.share) {
      try {
        await navigator.share({ title: "공강 추천", text, url });
      } catch {
        // 공유 취소 등은 무시
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert("링크를 복사했어요. 친구에게 붙여넣어 보내보세요!");
    } catch {
      alert("공유에 실패했어요.");
    }
  }

  async function openLog() {
    setShowLog(true);
    setLogLoading(true);
    const { logs: fetched, source } = await fetchLogs();
    setLogs(fetched);
    setLogSource(source);
    setLogLoading(false);
  }

  async function copyLog() {
    const { logs: fetched } = await fetchLogs();
    const text = JSON.stringify(fetched, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      alert("복사했어요. 노션이나 시트에 붙여넣으면 돼요.");
    } catch {
      alert("복사에 실패했어요. 콘솔에서 직접 확인해주세요.");
      console.log(text);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        {step === "intro" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <div className="text-5xl">🕒</div>
            <h1 className="text-4xl font-bold tracking-tight">공강</h1>
            <p className="text-balance text-stone-500">
              애매하게 남은 공강 시간,
              <br />
              뭐 할지 고민하지 말고 바로 추천받으세요.
            </p>
            <button
              onClick={() => setStep("input")}
              className="mt-4 w-full rounded-2xl bg-stone-900 px-6 py-4 text-base font-semibold text-white transition active:scale-[0.98]"
            >
              시작하기
            </button>
          </div>
        )}

        {step === "input" && (
          <div className="flex flex-1 flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold">지금 상황을 알려주세요</h2>
              <p className="mt-1 text-sm text-stone-500">
                입력한 정보로 딱 맞는 장소를 찾아드려요.
              </p>
            </div>

            <Field label="공강 시간이 얼마나 남았어요?">
              <div className="grid grid-cols-5 gap-2">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setRemainingTime(t)}
                    className={pillClass(remainingTime === t)}
                  >
                    {t}분
                  </button>
                ))}
              </div>
            </Field>

            {version >= 2 && (
              <Field label="지금 어디에 있어요?">
                <select
                  value={currentBuilding}
                  onChange={(e) => setCurrentBuilding(e.target.value)}
                  className={selectClass}
                >
                  {BUILDINGS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {version >= 2 && (
              <Field label="다음 수업은 어디예요?">
                <select
                  value={nextBuilding}
                  onChange={(e) => setNextBuilding(e.target.value)}
                  className={selectClass}
                >
                  {BUILDINGS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="뭐 하고 싶어요?">
              <div className="grid grid-cols-3 gap-2">
                {ACTIVITIES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setActivity(a)}
                    className={pillClass(activity === a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>

            <button
              onClick={handleSearch}
              className="mt-2 w-full rounded-2xl bg-stone-900 px-6 py-4 text-base font-semibold text-white transition active:scale-[0.98]"
            >
              장소 찾아보기
            </button>

            <button
              onClick={() => setStep("intro")}
              className="text-sm text-stone-400 underline underline-offset-2"
            >
              처음으로
            </button>
          </div>
        )}

        {step === "result" && (
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">이런 곳 어때요?</h2>
              <button
                onClick={() => setStep("input")}
                className="text-sm text-stone-400 underline underline-offset-2"
              >
                다시 입력
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.location.id}
                  className={`rounded-2xl border p-4 transition ${
                    selected?.location.id === rec.location.id
                      ? "border-stone-900 bg-stone-100"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl leading-none">{rec.location.emoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold">{rec.location.name}</div>
                      <div className="mt-0.5 text-sm text-stone-500">
                        {rec.location.desc}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        {version >= 2 && <Badge>이동 {rec.travelIn}분</Badge>}
                        <Badge>활동 {rec.location.duration}분</Badge>
                        <Badge tone={rec.tight ? "warn" : "ok"}>
                          {rec.tight
                            ? `여유 ${rec.buffer}분 빠듯`
                            : `여유 ${rec.buffer}분`}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-stone-400">{rec.reason}</p>
                      {version >= 3 && (rec.location.cost || rec.location.hours) && (
                        <p className="mt-1 text-xs text-stone-400">
                          {rec.location.cost && <span>{rec.location.cost}</span>}
                          {rec.location.cost && rec.location.hours && <span> · </span>}
                          {rec.location.hours && <span>{rec.location.hours}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleChoose(rec)}
                    className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                      selected?.location.id === rec.location.id
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {selected?.location.id === rec.location.id
                      ? "여기로 갈게요 ✅"
                      : "여기서 시간 보낼래요"}
                  </button>

                  {selected?.location.id === rec.location.id && (
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      {version >= 3 && (
                        <a
                          href={mapUrl(rec.location.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            appendLog({
                              timestamp: new Date().toISOString(),
                              remainingTime,
                              currentBuilding,
                              nextBuilding,
                              activity,
                              recommended: recommendations.map((r) => r.location.name),
                              chosen: rec.location.name,
                              externalSearch: true,
                            })
                          }
                          className="flex-1 rounded-xl border border-emerald-600 py-2 text-center font-semibold text-emerald-700"
                        >
                          지도에서 길찾기 🧭
                        </a>
                      )}
                      <button
                        onClick={() => handleShare(rec)}
                        className="text-xs text-stone-400 underline underline-offset-2"
                      >
                        친구에게 공유하기
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {recommendations.length === 0 && (
                <p className="text-sm text-stone-400">
                  조건에 맞는 장소를 찾지 못했어요. 활동을 바꿔서 다시 시도해보세요.
                </p>
              )}
            </div>

            {version >= 2 && !selected && recommendations.length > 0 && !showReject && (
              <button
                onClick={() => setShowReject(true)}
                className="text-center text-sm text-stone-400 underline underline-offset-2"
              >
                마음에 드는 곳이 없어요
              </button>
            )}

            {showReject && (
              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-sm font-semibold">어떤 점이 아쉬웠어요?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REJECT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => handleReject(reason)}
                      className="rounded-xl bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep("input")}
              className="mt-1 w-full rounded-2xl border border-stone-200 px-6 py-3 text-sm font-semibold text-stone-600"
            >
              다른 곳도 볼래요
            </button>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={openLog}
            className="text-xs text-stone-300 underline underline-offset-2"
          >
            [인터뷰 진행자용] 선택 기록 보기
          </button>
        </div>

        {showLog && (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center"
            onClick={() => setShowLog(false)}
          >
            <div
              className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold">선택 기록 ({logs.length}건)</h3>
                <button onClick={() => setShowLog(false)} className="text-stone-400">
                  닫기
                </button>
              </div>
              <p className="mt-1 text-xs text-stone-400">
                {logLoading
                  ? "불러오는 중..."
                  : logSource === "remote"
                  ? "☁️ 팀 전체 데이터(Supabase)"
                  : "⚠️ 이 기기에만 저장된 데이터 (서버 연결 안 됨)"}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {!logLoading && logs.length === 0 && (
                  <p className="text-sm text-stone-400">아직 기록이 없어요.</p>
                )}
                {logs.map((l, i) => (
                  <div key={i} className="rounded-xl bg-stone-50 p-3 text-xs">
                    <div className="font-semibold">
                      {l.chosen || `❌ 미선택 (${l.rejectReason ?? "이유 없음"})`}
                      {l.externalSearch && " · 🔗 외부검색"}
                    </div>
                    <div className="text-stone-400">
                      {l.currentBuilding} → {l.nextBuilding} / {l.remainingTime}분 /{" "}
                      {l.activity}
                      {typeof l.decisionMs === "number" &&
                        ` / 결정 ${Math.round(l.decisionMs / 1000)}초`}
                    </div>
                    {l.note && <div className="mt-1 text-stone-600">&ldquo;{l.note}&rdquo;</div>}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={copyLog}
                  className="flex-1 rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white"
                >
                  복사하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn";
}) {
  const toneClass =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700"
      : "bg-stone-100 text-stone-600";
  return <span className={`rounded-full px-2 py-1 ${toneClass}`}>{children}</span>;
}

function pillClass(active: boolean) {
  return `rounded-xl py-2.5 text-sm font-semibold transition ${
    active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
  }`;
}

const selectClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-stone-400";
