import { cn } from "@/lib/utils";

export type ProgressStage = {
  key: string;
  label: string;
  from: number; // 1-indexed, inclusive
  to: number; // 1-indexed, inclusive
};

export const PROGRESS_STAGES: ProgressStage[] = [
  { key: "basic", label: "기초 과정", from: 1, to: 10 },
  { key: "practice", label: "심화 실무", from: 11, to: 22 },
  { key: "portfolio", label: "포트폴리오", from: 23, to: 34 },
  { key: "job", label: "취업 실행", from: 35, to: 40 },
];

export const TOTAL_WEEKS = 40;

export function getStageOfWeek(week: number): ProgressStage {
  return PROGRESS_STAGES.find((s) => week >= s.from && week <= s.to) ?? PROGRESS_STAGES[0];
}

export function weekState(week: number, doneCount: number): "done" | "current" | "upcoming" {
  if (week <= doneCount) return "done";
  if (week === doneCount + 1) return "current";
  return "upcoming";
}

interface ProgressGridProps {
  doneCount: number; // 0~40 — 체크리스트 완료율을 40주 타임라인에 근사 반영
  onCellClick?: (week: number) => void;
  compact?: boolean;
  className?: string;
}

export default function ProgressGrid({ doneCount, onCellClick, compact = false, className }: ProgressGridProps) {
  const clamped = Math.max(0, Math.min(TOTAL_WEEKS, doneCount));

  return (
    <div className={cn("space-y-3", className)}>
      {/* 4단계 구간 범례 */}
      {!compact && (
        <div className="flex items-center gap-1 h-1.5 rounded-full overflow-hidden">
          {PROGRESS_STAGES.map((s) => (
            <div
              key={s.key}
              className="h-full bg-muted"
              style={{ flexGrow: s.to - s.from + 1 }}
              title={s.label}
            />
          ))}
        </div>
      )}
      {!compact && (
        <div className="flex text-[11px] text-muted-foreground">
          {PROGRESS_STAGES.map((s) => (
            <span key={s.key} style={{ flexGrow: s.to - s.from + 1, flexBasis: 0 }} className="truncate">
              {s.label}
            </span>
          ))}
        </div>
      )}

      {/* 좁은 화면에서 칸이 탭하기 어려울 만큼 작아지지 않도록 최소 폭을 두고 가로 스크롤로 대응 */}
      <div className="overflow-x-auto -mx-0.5 px-0.5">
        <div className="grid grid-cols-10 gap-1.5 min-w-[400px]">
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((week) => {
            const state = weekState(week, clamped);
            return (
              <button
                key={week}
                type="button"
                onClick={onCellClick ? () => onCellClick(week) : undefined}
                className={cn(
                  "aspect-square rounded-[8px] flex items-center justify-center text-[11px] font-medium tabular-nums transition-colors",
                  state === "done" && "bg-foreground text-background",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "upcoming" && "bg-secondary border border-border text-muted-foreground",
                  onCellClick && "cursor-pointer hover:opacity-80"
                )}
              >
                {week}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
