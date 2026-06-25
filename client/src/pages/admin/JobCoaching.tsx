import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  PencilLine, Building2, Link2, FileText, User, Clock, Loader2,
  CheckCircle2, Send, Inbox,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "검토 대기", cls: "bg-amber-100 text-amber-700" },
  in_review: { label: "검토 중", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "완료", cls: "bg-emerald-100 text-emerald-700" },
};

const FILTERS = [
  { key: undefined, label: "전체" },
  { key: "pending" as const, label: "검토 대기" },
  { key: "in_review" as const, label: "검토 중" },
  { key: "completed" as const, label: "완료" },
];

export default function AdminJobCoaching() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"pending" | "in_review" | "completed" | undefined>(undefined);
  const [openId, setOpenId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");

  const { data: rows = [], isLoading } = trpc.coaching.listRequests.useQuery(
    filter ? { status: filter } : undefined,
  );
  const { data: detail } = trpc.coaching.getRequestDetail.useQuery(
    { id: openId ?? 0 },
    { enabled: openId !== null },
  );

  const respond = trpc.coaching.respond.useMutation({
    onSuccess: () => {
      utils.coaching.listRequests.invalidate();
      toast.success("첨삭을 전송했습니다. 교육생에게 알림이 발송됐습니다.");
      setOpenId(null);
      setFeedback("");
    },
    onError: (e) => toast.error(e.message),
  });

  const openDetail = (id: number, existingFeedback?: string | null) => {
    setOpenId(id);
    setFeedback(existingFeedback ?? "");
  };

  return (
    <AppLayout title="채용공고 첨삭">
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><PencilLine className="text-primary" size={20} /></div>
          <div>
            <h2 className="font-semibold text-lg">채용공고 첨삭 센터</h2>
            <p className="text-sm text-muted-foreground">교육생이 올린 희망 채용공고에 맞춤 첨삭 지도를 작성하세요.</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <Button
              key={f.label}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={20} /> 불러오는 중…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox size={40} className="mx-auto opacity-30 mb-3" />
            <p>해당하는 첨삭 요청이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((row: any) => {
              const r = row.request;
              const meta = STATUS_META[r.status] ?? STATUS_META.pending;
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(r.id, r.feedbackContent)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 size={14} className="text-muted-foreground shrink-0" />
                          <span className="truncate">{r.companyName} · {r.jobTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1"><User size={12} /> {row.studentName ?? "교육생"}</span>
                          {r.resumeId && <span className="inline-flex items-center gap-1"><FileText size={12} /> 이력서</span>}
                          {r.coverLetterId && <span className="inline-flex items-center gap-1"><FileText size={12} /> 자소서</span>}
                          {r.portfolioId && <span className="inline-flex items-center gap-1"><FileText size={12} /> 포트폴리오</span>}
                        </div>
                      </div>
                      <Badge className={meta.cls}>
                        {r.status === "completed" ? <CheckCircle2 size={11} className="mr-1" /> : <Clock size={11} className="mr-1" />}
                        {meta.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 상세 + 첨삭 작성 다이얼로그 */}
        <Dialog open={openId !== null} onOpenChange={(o) => { if (!o) { setOpenId(null); setFeedback(""); } }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {detail ? `${detail.request.companyName} · ${detail.request.jobTitle}` : "첨삭"}
              </DialogTitle>
            </DialogHeader>

            {!detail ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="animate-spin mr-2" size={18} /> 불러오는 중…
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">교육생: </span>
                  <span className="font-medium">{detail.studentName}</span>
                </div>

                {detail.request.jobUrl && (
                  <a href={detail.request.jobUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <Link2 size={14} /> 공고 링크 열기
                  </a>
                )}

                {detail.request.jobDescription && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">공고 내용</p>
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {detail.request.jobDescription}
                    </div>
                  </div>
                )}

                {detail.request.studentMessage && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">교육생 요청 메모</p>
                    <p className="text-sm rounded-lg border bg-muted/30 p-3">{detail.request.studentMessage}</p>
                  </div>
                )}

                {/* 첨부 서류 */}
                {(detail.resume || detail.coverLetter || detail.portfolio) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">첨부 서류</p>
                    {detail.coverLetter && (
                      <details className="rounded-lg border p-3">
                        <summary className="text-sm font-medium cursor-pointer">자기소개서: {(detail.coverLetter as any).title ?? "제목 없음"}</summary>
                        <p className="text-sm mt-2 whitespace-pre-wrap text-muted-foreground">{(detail.coverLetter as any).content}</p>
                      </details>
                    )}
                    {detail.resume && (
                      <div className="rounded-lg border p-3 text-sm">
                        <span className="font-medium">이력서</span>
                        {(detail.resume as any).summary && <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{(detail.resume as any).summary}</p>}
                      </div>
                    )}
                    {detail.portfolio && (
                      <div className="rounded-lg border p-3 text-sm">
                        <span className="font-medium">포트폴리오: {(detail.portfolio as any).title}</span>
                        {(detail.portfolio as any).publicSlug && (
                          <a href={`/portfolio/${(detail.portfolio as any).publicSlug}`} target="_blank" rel="noreferrer" className="ml-2 text-primary hover:underline text-xs">열기</a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* 첨삭 작성 */}
                <div>
                  <p className="text-sm font-semibold mb-1">첨삭 지도 작성 <span className="text-xs text-muted-foreground font-normal">(Markdown 지원)</span></p>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={"이 공고에 맞춰 강조할 경험, 보완할 점, 자소서 방향 등을 적어주세요.\n\n예)\n- 지원동기: ...\n- 강조 포인트: ..."}
                    rows={8}
                  />
                  <Button
                    className="mt-3 gap-1.5"
                    disabled={respond.isPending || !feedback.trim()}
                    onClick={() => openId && respond.mutate({ id: openId, feedbackContent: feedback.trim() })}
                  >
                    {respond.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    첨삭 전송 (완료 처리)
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
