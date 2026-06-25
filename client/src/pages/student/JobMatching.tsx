import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Sparkles, RefreshCw, Bookmark, BookmarkCheck, Building2, MapPin,
  Briefcase, Target, Loader2, CheckCircle2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// ─── 매칭 점수 링 ──────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-muted-foreground";
  return (
    <div className={`flex flex-col items-center justify-center shrink-0 ${color}`}>
      <div className="text-2xl font-bold leading-none">{pct}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">매칭</div>
    </div>
  );
}

// ─── 매칭 공고 카드 ────────────────────────────────────────────────────────────
function MatchCard({
  item, isBookmarked, isApplied, onBookmark, onApply,
}: {
  item: any;
  isBookmarked: boolean;
  isApplied: boolean;
  onBookmark: () => void;
  onApply: () => void;
}) {
  const job = item.posting;
  const company = item.company;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <ScoreRing score={item.matchScore ?? 0} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{job.title}</h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Building2 size={13} />
                  <span className="truncate">{company?.companyName ?? "기업 비공개"}</span>
                  {job.location && (<><MapPin size={13} className="ml-1" /><span className="truncate">{job.location}</span></>)}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={onBookmark} aria-label="희망기업 북마크">
                {isBookmarked ? <BookmarkCheck size={18} className="text-primary" /> : <Bookmark size={18} />}
              </Button>
            </div>

            {item.matchReason && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                <Sparkles size={12} className="inline mr-1 text-primary" />
                {item.matchReason}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {job.employmentType && <Badge variant="secondary" className="text-xs">{job.employmentType}</Badge>}
              {job.category && <Badge variant="outline" className="text-xs">{job.category}</Badge>}
              <div className="ml-auto">
                {isApplied ? (
                  <Badge className="gap-1 bg-emerald-600"><CheckCircle2 size={12} /> 지원완료</Badge>
                ) : (
                  <Button size="sm" onClick={onApply}>지원하기</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 페이지 ────────────────────────────────────────────────────────────────────
export default function JobMatching() {
  const utils = trpc.useUtils();
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | undefined>();
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<number | undefined>();

  const { data: aiRec, isLoading, isFetching, refetch } = trpc.jobs.aiRecommend.useQuery();
  const { data: bookmarks = [] } = trpc.jobs.myBookmarks.useQuery();
  const { data: applications = [] } = trpc.jobs.myApplications.useQuery();
  const { data: portfolios = [] } = trpc.portfolio.list.useQuery();
  const { data: coverLetters = [] } = trpc.ai.listCoverLetters.useQuery();

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b: any) => b.bookmark.jobPostingId)),
    [bookmarks],
  );
  const appliedIds = useMemo(
    () => new Set(applications.map((a: any) => a.application?.jobPostingId)),
    [applications],
  );

  const toggleBookmark = trpc.jobs.toggleBookmark.useMutation({
    onSuccess: (data) => {
      utils.jobs.myBookmarks.invalidate();
      toast.success(data.isBookmarked ? "희망기업에 추가했습니다" : "희망기업에서 제외했습니다");
    },
  });

  const submitApplication = trpc.jobs.submitApplication.useMutation({
    onSuccess: () => {
      utils.jobs.myApplications.invalidate();
      setApplyOpen(false);
      toast.success("지원이 완료되었습니다!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleApply = (job: any) => {
    setSelectedJob(job);
    setSelectedPortfolioId(undefined);
    setSelectedCoverLetterId(undefined);
    setApplyOpen(true);
  };

  const recommendations: any[] = aiRec?.recommendations ?? [];

  return (
    <AppLayout title="희망기업 매칭">
      <div className="p-6 space-y-5 pb-20 lg:pb-6">
        {/* AI 요약 헤더 */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Target className="text-primary" size={22} />
                </div>
                <div>
                  <h2 className="font-semibold">AI 맞춤 기업 매칭</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                    {isLoading
                      ? "역량 분석과 포트폴리오를 바탕으로 매칭 중입니다…"
                      : aiRec?.summary || "내 기술 스택과 AI 역량 점수를 기반으로 적합한 채용공고를 추천합니다."}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
                <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
                다시 매칭
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI 매칭 결과 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="font-semibold">매칭 결과</h3>
            {recommendations.length > 0 && (
              <Badge variant="secondary">{recommendations.length}건</Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={20} /> 매칭 결과를 불러오는 중…
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <Briefcase size={40} className="mx-auto opacity-30 mb-3" />
              <p>아직 매칭된 공고가 없습니다.</p>
              <p className="text-sm mt-1">포트폴리오와 AI 역량 분석을 먼저 완료하면 더 정확하게 매칭됩니다.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {recommendations.map((item) => (
                <MatchCard
                  key={item.posting.id}
                  item={item}
                  isBookmarked={bookmarkedIds.has(item.posting.id)}
                  isApplied={appliedIds.has(item.posting.id)}
                  onBookmark={() => toggleBookmark.mutate({ jobPostingId: item.posting.id })}
                  onApply={() => handleApply(item.posting)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 내 희망기업 (북마크) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookmarkCheck size={16} className="text-primary" />
            <h3 className="font-semibold">내 희망기업</h3>
            {bookmarks.length > 0 && <Badge variant="secondary">{bookmarks.length}건</Badge>}
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Bookmark size={36} className="mx-auto opacity-30 mb-2" />
              <p className="text-sm">관심 있는 공고의 북마크 아이콘을 눌러 희망기업으로 저장하세요.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {bookmarks.map((item: any) => (
                <MatchCard
                  key={item.posting.id}
                  item={item}
                  isBookmarked={true}
                  isApplied={appliedIds.has(item.posting.id)}
                  onBookmark={() => toggleBookmark.mutate({ jobPostingId: item.posting.id })}
                  onApply={() => handleApply(item.posting)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 지원 다이얼로그 */}
        <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>지원하기 — {selectedJob?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">포트폴리오 첨부 (선택)</label>
                <Select value={String(selectedPortfolioId ?? "")} onValueChange={(v) => setSelectedPortfolioId(v ? Number(v) : undefined)}>
                  <SelectTrigger><SelectValue placeholder="포트폴리오 선택" /></SelectTrigger>
                  <SelectContent>
                    {portfolios.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">자기소개서 첨부 (선택)</label>
                <Select value={String(selectedCoverLetterId ?? "")} onValueChange={(v) => setSelectedCoverLetterId(v ? Number(v) : undefined)}>
                  <SelectTrigger><SelectValue placeholder="자기소개서 선택" /></SelectTrigger>
                  <SelectContent>
                    {coverLetters.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title ?? "제목 없음"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => selectedJob && submitApplication.mutate({
                  jobPostingId: selectedJob.id,
                  portfolioId: selectedPortfolioId,
                  coverLetterId: selectedCoverLetterId,
                })}
                disabled={submitApplication.isPending}
              >
                {submitApplication.isPending ? "지원 중..." : "지원 완료"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
