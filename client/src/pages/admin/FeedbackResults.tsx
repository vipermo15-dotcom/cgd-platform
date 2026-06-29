import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Trash2,
  Bot,
  MessageSquarePlus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_COLOR: Record<string, string> = {
  학과장: "bg-red-100 text-red-700",
  교수: "bg-purple-100 text-purple-700",
  공동훈련센터: "bg-green-100 text-green-700",
  "재학 교육생": "bg-blue-100 text-blue-700",
};

const QUESTION_LABELS: Record<string, string> = {
  A1: "대시보드 통계 만족도",
  A2: "포트폴리오 완성도 파악 기능 필요 여부",
  A3: "월별 성과 리포트 유용성 (신규)",
  B1: "취업처 정보 공유 원활성",
  B2: "학생 직접 매칭 기능 필요 여부 (신규)",
  B3: "타 학과 취업처 공동 공유 의향",
  C1: "불편·누락 기능 (주관식)",
  C2: "카카오/이메일 알림 연동 유용성 (신규)",
  C3: "전체 만족도",
  D1: "AI 포트폴리오 분석 도움도",
  D2: "교수 코멘트 기능 필요 여부 (신규)",
  D3: "자격증 자동 반영 유용성 (신규)",
  E1: "수업 과제 연동 활용 의향",
  E2: "학생 참여도 지표 필요 여부 (신규)",
  F1: "추가 희망 기능 (주관식)",
  F2: "교수 전체 만족도",
  G1: "인재 풀 스킬 필터링 원활성",
  G3: "통합 졸업생 이력 조회 필요성 (신규)",
  H1: "취업처 공유 효과성",
  H2: "채용 공고 자동 알림 필요 여부 (신규)",
  H3: "기업별 채용 이력 관리 유용성 (신규)",
  I1: "불편한 점 (주관식)",
  I2: "전체 만족도",
  J1: "AI 포트폴리오 분석 기능 사용 여부",
  J2: "AI 추천 채용 공고 적합성",
  K1: "주 이용 기기 (복수)",
  K2: "모바일 불편 사항 (주관식)",
  K3: "카카오 알림 시 방문 빈도 영향 (신규)",
  L1: "자소서 AI 초안 기능 사용 의향 (신규)",
  L2: "모의 면접 Q&A 유용성 (신규)",
  L3: "수료 후 알림 지속 희망 (신규)",
  L4: "가장 필요한 기능 (주관식)",
  L5: "전체 만족도",
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString("ko-KR", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

// 선택된 응답들을 Claude 프롬프트로 변환
function buildClaudePrompt(rows: any[]) {
  const lines: string[] = [
    "# CGD 취업지원 플랫폼 — 사용자 피드백 분석 요청",
    "",
    `총 ${rows.length}건의 설문 응답입니다. 아래 내용을 분석해서:`,
    "1. 역할별 주요 불만·요청 사항 요약",
    "2. 즉시 구현 가능한 개선사항 우선순위 3개",
    "3. 중기 개발이 필요한 신규 기능 제안",
    "4. Manus 배포 프롬프트로 만들어야 할 작업 목록",
    "",
    "---",
    "",
  ];

  for (const row of rows) {
    const ans = (row.answers as Record<string, string>) ?? {};
    lines.push(`## ${row.role ?? "미확인"} — ${row.name ?? "익명"} (${formatDate(row.createdAt)})`);
    lines.push("");
    for (const [k, v] of Object.entries(ans)) {
      const label = QUESTION_LABELS[k] ?? k;
      lines.push(`- **${label}**: ${v}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

type FeedbackRow = {
  id: number;
  role: string | null;
  name: string | null;
  answers: unknown;
  createdAt: Date | string;
};

function FeedbackCard({ row, onDelete }: { row: FeedbackRow; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const answers = (row.answers as Record<string, string>) ?? {};

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 cursor-pointer transition-colors">
          <Badge className={cn("text-xs font-medium shrink-0", ROLE_COLOR[row.role ?? ""] ?? "bg-gray-100 text-gray-700")}>
            {row.role ?? "미확인"}
          </Badge>
          <span className="text-sm font-medium flex-1 min-w-0 truncate">{row.name ?? "익명"}</span>
          <span className="text-xs text-muted-foreground shrink-0">{formatDate(row.createdAt)}</span>
          {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 p-4 rounded-lg border border-t-0 bg-muted/30 space-y-2">
          {Object.entries(answers).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[1fr_auto] gap-2 text-xs">
              <span className="text-muted-foreground">{QUESTION_LABELS[k] ?? k}</span>
              <span className="font-medium text-right">{String(v)}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 text-xs gap-1"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 size={12} /> 삭제
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function FeedbackResults() {
  const { data: rows = [], refetch, isLoading } = trpc.feedback.adminList.useQuery();
  const deleteMutation = trpc.feedback.adminDelete.useMutation({ onSuccess: () => refetch() });
  const [copied, setCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 역할별 그룹
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    const key = r.role ?? "미확인";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const copyToClipboard = async () => {
    const target = selectedIds.length > 0
      ? rows.filter((r) => selectedIds.includes(r.id))
      : rows;
    const text = buildClaudePrompt(target);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AppLayout title="피드백 설문 결과">
      <div className="p-3 lg:p-6 space-y-5 max-w-3xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquarePlus size={18} className="text-primary" />
              <h2 className="text-lg font-bold">설문 결과</h2>
              <Badge variant="outline" className="text-xs">{rows.length}건</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              역할별로 묶어서 표시됩니다. 내용 클릭 시 상세 답변 확인 가능
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => refetch()}>
              <RefreshCw size={12} /> 새로고침
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={copyToClipboard}
              disabled={rows.length === 0}
            >
              {copied ? <Check size={12} /> : <Bot size={12} />}
              {copied ? "복사 완료!" : "Claude에 복사"}
            </Button>
          </div>
        </div>

        {/* Claude 복사 안내 */}
        {rows.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground flex gap-2">
            <Bot size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Claude에 복사</strong> 버튼을 누르면 모든 피드백이 분석 프롬프트 형식으로 복사됩니다.
              Claude Code 채팅창에 붙여넣으면 우선순위·개선사항·배포 프롬프트를 자동 생성합니다.
            </span>
          </div>
        )}

        {/* 응답 없음 */}
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground text-sm">불러오는 중...</div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="text-center py-16">
            <MessageSquarePlus size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">아직 제출된 설문이 없습니다.</p>
            <p className="text-xs text-muted-foreground mt-1">사이드바 "플랫폼 피드백" 메뉴에서 설문을 작성할 수 있습니다.</p>
          </div>
        )}

        {/* 역할별 그룹 */}
        {Object.entries(grouped).map(([role, items]) => (
          <div key={role}>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-xs", ROLE_COLOR[role] ?? "bg-gray-100 text-gray-700")}>{role}</Badge>
              <span className="text-xs text-muted-foreground">{items.length}건</span>
            </div>
            <div className="space-y-1.5">
              {items.map((row) => (
                <FeedbackCard
                  key={row.id}
                  row={row}
                  onDelete={() => deleteMutation.mutate({ id: row.id })}
                />
              ))}
            </div>
          </div>
        ))}

      </div>
    </AppLayout>
  );
}
