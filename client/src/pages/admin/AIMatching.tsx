import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Sparkles, Loader2, Search, Building2, Briefcase, Send, CheckCircle2,
  Lightbulb, Users, Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function scoreColor(s: number) {
  return s >= 80 ? "text-emerald-600" : s >= 60 ? "text-amber-600" : "text-muted-foreground";
}

export default function AIMatching() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [resultFor, setResultFor] = useState<{ id: number; name: string } | null>(null);
  const [result, setResult] = useState<any>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  const { data: students = [], isLoading } = trpc.aiMatch.listStudents.useQuery();

  const filtered = students.filter(
    (s: any) => !search || s.name?.includes(search) || s.email?.includes(search),
  );

  const analyze = trpc.aiMatch.analyzeStudent.useMutation({
    onSuccess: (data) => { setResult(data); toast.success("AI 매칭 분석 완료 — 진로지도 카드 저장 + 학생 알림 발송"); },
    onError: (e) => toast.error(e.message),
  });

  const analyzeAll = trpc.aiMatch.analyzeAll.useMutation({
    onSuccess: (data) => { setBatchResult(data); toast.success(`전체 ${data.total}명 분석 완료`); },
    onError: (e) => toast.error(e.message),
  });

  const applyOnBehalf = trpc.aiMatch.applyOnBehalf.useMutation({
    onSuccess: () => { utils.aiMatch.invalidate(); toast.success("대신 지원 완료 — 학생에게 알림 발송"); },
    onError: (e) => toast.error(e.message),
  });

  const runAnalyze = (s: { id: number; name: string }) => {
    setResultFor(s);
    setResult(null);
    analyze.mutate({ studentUserId: s.id });
  };

  return (
    <AppLayout title="AI 자동 매칭">
      <div className="p-6 space-y-5">
        {/* 헤더 */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-5 flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><Zap className="text-primary" size={22} /></div>
              <div>
                <h2 className="font-semibold">AI 취업처 자동 매칭</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  교육생의 포트폴리오·AI 역량점수·이력서를 자동 분석해 실제 채용공고를 매칭하고,
                  결과를 진로지도 카드에 저장 + 학생에게 알림을 보냅니다.
                </p>
              </div>
            </div>
            <Button onClick={() => { setBatchOpen(true); setBatchResult(null); }} className="gap-1.5">
              <Users size={16} /> 전체 일괄 분석
            </Button>
          </CardContent>
        </Card>

        {/* 검색 */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름·이메일 검색" className="pl-9" />
        </div>

        {/* 학생 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={20} /> 불러오는 중…
          </div>
        ) : (
          <div className="grid gap-2">
            {filtered.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {s.name?.[0] ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.major || s.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={analyze.isPending && resultFor?.id === s.id}
                    onClick={() => runAnalyze({ id: s.id, name: s.name })}
                  >
                    {analyze.isPending && resultFor?.id === s.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Sparkles size={14} />}
                    AI 매칭 분석
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 단일 분석 결과 모달 */}
        <Dialog open={resultFor !== null} onOpenChange={(o) => { if (!o) { setResultFor(null); setResult(null); } }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{resultFor?.name} — AI 매칭 결과</DialogTitle>
            </DialogHeader>
            {analyze.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="animate-spin mb-3" size={24} />
                <p className="text-sm">학생 데이터를 분석하고 채용공고를 매칭하는 중…</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {result.summary && (
                  <p className="text-sm bg-muted/40 rounded-lg p-3">{result.summary}</p>
                )}

                {/* 실제 공고 매칭 */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <Briefcase size={14} className="text-primary" /> 실제 채용공고 매칭 ({result.matchedPostings.length})
                  </h3>
                  {result.matchedPostings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">적합한 실제 공고가 없습니다. 아래 유형 제안을 참고하세요.</p>
                  ) : (
                    <div className="space-y-2">
                      {result.matchedPostings.map((p: any) => (
                        <div key={p.posting.id} className="rounded-lg border p-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${scoreColor(p.matchScore)}`}>{p.matchScore}</span>
                              <span className="font-medium truncate">{p.posting.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 size={11} /> {p.company?.companyName ?? "기업"}
                            </p>
                            {p.reason && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.reason}</p>}
                          </div>
                          <Button
                            size="sm" variant="outline" className="gap-1 shrink-0"
                            disabled={applyOnBehalf.isPending}
                            onClick={() => resultFor && applyOnBehalf.mutate({ studentUserId: resultFor.id, jobPostingId: p.posting.id })}
                          >
                            <Send size={13} /> 대신 지원
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI 유형 제안 */}
                {result.suggestedTypes?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                      <Lightbulb size={14} className="text-amber-500" /> 보완 취업처 유형 제안
                    </h3>
                    <div className="space-y-2">
                      {result.suggestedTypes.map((t: any, i: number) => (
                        <div key={i} className="rounded-lg border border-dashed p-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${scoreColor(t.matchScore)}`}>{t.matchScore}</span>
                            <span className="font-medium">{t.companyType} · {t.jobTitle}</span>
                          </div>
                          {t.reason && <p className="text-xs text-muted-foreground mt-1">{t.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} /> 진로지도 카드에 저장됨 · 학생에게 알림 발송됨 · 공동훈련센터 공유됨
                </p>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* 전체 일괄 분석 모달 */}
        <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>전체 재학생 일괄 AI 매칭</DialogTitle>
            </DialogHeader>
            {!batchResult ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  전체 재학생(최대 50명)을 한 번에 AI 분석합니다. 각 학생의 진로지도 카드에 추천 취업처가 저장되고 알림이 발송됩니다.
                  <br /><span className="text-amber-600">※ 학생 수에 따라 1~2분 소요될 수 있습니다.</span>
                </p>
                <Button className="w-full gap-1.5" disabled={analyzeAll.isPending} onClick={() => analyzeAll.mutate()}>
                  {analyzeAll.isPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  {analyzeAll.isPending ? "분석 중…" : "일괄 분석 시작"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">총 {batchResult.total}명 분석 완료</p>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {batchResult.results.map((r: any) => (
                    <div key={r.studentUserId} className="flex items-center justify-between text-sm rounded border px-3 py-2">
                      <span>{r.name}</span>
                      {r.success
                        ? <Badge className="bg-emerald-100 text-emerald-700">매칭 {r.matchedCount}건</Badge>
                        : <Badge variant="secondary">분석 실패</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
