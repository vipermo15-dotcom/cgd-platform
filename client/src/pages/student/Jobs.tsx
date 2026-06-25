import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Search, Bookmark, BookmarkCheck, Briefcase, MapPin, Clock, Building2, Sparkles, TrendingUp, Loader2, Info } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const CATEGORIES = ["전체", "브랜딩", "SNS 콘텐츠", "영상편집", "캐릭터/일러스트", "AI 생성", "편집디자인", "UI/UX"];

// ─── 공고 카드 컴포넌트 ────────────────────────────────────────────────────────
function JobCard({
  item,
  isBookmarked,
  matchScore,
  matchReason,
  onBookmark,
  onApply,
}: {
  item: any;
  isBookmarked: boolean;
  matchScore?: number;
  matchReason?: string;
  onBookmark: () => void;
  onApply: () => void;
}) {
  const job = item.posting;
  const company = item.company;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* AI 매칭 점수 바 */}
        {matchScore !== undefined && (
          <div className="mb-3 p-2.5 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                <Sparkles size={11} /> AI 매칭 점수
              </span>
              <span className="text-xs font-bold text-purple-700">{matchScore}점</span>
            </div>
            <Progress value={matchScore} className="h-1.5 bg-purple-100" />
            {matchReason && (
              <p className="text-xs text-purple-600 mt-1.5 leading-relaxed">{matchReason}</p>
            )}
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{job.title}</h3>
              <Badge variant="secondary" className="text-xs flex-shrink-0">{job.employmentType}</Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 size={12} /> {company?.companyName ?? "회사명 없음"}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {job.location && <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>}
              {job.deadline && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  마감 {formatDistanceToNow(new Date(job.deadline), { addSuffix: true, locale: ko })}
                </span>
              )}
              {job.category && <Badge variant="outline" className="text-xs">{job.category}</Badge>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="ghost" onClick={onBookmark}>
              {isBookmarked ? <BookmarkCheck size={18} className="text-primary" /> : <Bookmark size={18} />}
            </Button>
            <Button size="sm" onClick={onApply}>지원</Button>
          </div>
        </div>
        {job.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentJobs() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | undefined>();
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState("all");

  const { data: jobs = [] } = trpc.jobs.list.useQuery({
    category: category === "전체" ? undefined : category,
    search: search || undefined,
  });
  const { data: bookmarks = [] } = trpc.jobs.myBookmarks.useQuery();
  const { data: portfolios = [] } = trpc.portfolio.list.useQuery();
  const { data: coverLetters = [] } = trpc.ai.listCoverLetters.useQuery();

  // AI 추천 — 탭 활성화 시에만 fetch
  const {
    data: aiRec,
    isLoading: aiLoading,
    refetch: refetchAI,
    isFetched: aiIsFetched,
  } = trpc.jobs.aiRecommend.useQuery(undefined, { enabled: false });

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b: any) => b.bookmark.jobPostingId)), [bookmarks]);

  const toggleBookmark = trpc.jobs.toggleBookmark.useMutation({
    onSuccess: (data) => {
      utils.jobs.myBookmarks.invalidate();
      toast.success(data.isBookmarked ? "북마크 추가" : "북마크 해제");
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "ai" && !aiIsFetched) {
      refetchAI();
    }
  };

  const handleApply = (job: any) => {
    setSelectedJob(job);
    setApplyOpen(true);
  };

  return (
    <AppLayout title="채용공고">
      <div className="p-6 space-y-5 pb-20 lg:pb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <TabsList className="h-9">
              <TabsTrigger value="all" className="gap-1.5 text-sm">
                <Briefcase size={14} /> 전체 공고
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-1.5 text-sm">
                <Sparkles size={14} /> AI 맞춤 추천
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="gap-1.5 text-sm">
                <Bookmark size={14} /> 북마크
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── 전체 공고 탭 ── */}
          <TabsContent value="all" className="space-y-4 mt-0">
            {/* Search & Filter */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="공고 검색..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase size={40} className="mx-auto opacity-30 mb-3" />
                  <p>채용공고가 없습니다.</p>
                </div>
              ) : (
                jobs.map((item: any) => (
                  <JobCard
                    key={item.posting.id}
                    item={item}
                    isBookmarked={bookmarkedIds.has(item.posting.id)}
                    onBookmark={() => toggleBookmark.mutate({ jobPostingId: item.posting.id })}
                    onApply={() => handleApply(item.posting)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* ── AI 맞춤 추천 탭 ── */}
          <TabsContent value="ai" className="space-y-4 mt-0">
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 size={32} className="animate-spin text-purple-500" />
                <p className="text-sm">AI가 포트폴리오와 역량 점수를 분석 중입니다...</p>
              </div>
            ) : !aiRec ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles size={40} className="mx-auto opacity-30 mb-3" />
                <p className="mb-3">AI 맞춤 추천을 불러오려면 버튼을 클릭하세요.</p>
                <Button onClick={() => refetchAI()} className="gap-2">
                  <Sparkles size={15} /> AI 추천 받기
                </Button>
              </div>
            ) : (
              <>
                {/* 분석 요약 */}
                {aiRec.summary && (
                  <Card className="border-0 bg-gradient-to-r from-purple-50 to-blue-50">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Sparkles size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-purple-800 mb-1">AI 분석 요약</p>
                        <p className="text-sm text-purple-700 leading-relaxed">{aiRec.summary}</p>
                        {aiRec.topFields && aiRec.topFields.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <TrendingUp size={13} className="text-purple-500" />
                            <span className="text-xs text-purple-600">강점 분야: </span>
                            {aiRec.topFields.map((f: string) => (
                              <Badge key={f} variant="secondary" className="text-xs bg-purple-100 text-purple-700">{f}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {aiRec.recommendations?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Info size={40} className="mx-auto opacity-30 mb-3" />
                    <p className="mb-2">맞춤 추천 공고가 없습니다.</p>
                    <p className="text-xs">포트폴리오를 등록하고 AI 역량 분석을 완료하면 더 정확한 추천을 받을 수 있습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiRec.recommendations.map((item: any) => (
                      <JobCard
                        key={item.posting.id}
                        item={item}
                        isBookmarked={bookmarkedIds.has(item.posting.id)}
                        matchScore={item.matchScore}
                        matchReason={item.matchReason}
                        onBookmark={() => toggleBookmark.mutate({ jobPostingId: item.posting.id })}
                        onApply={() => handleApply(item.posting)}
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => refetchAI()} className="gap-1.5 text-xs">
                    <Sparkles size={12} /> 다시 분석
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── 북마크 탭 ── */}
          <TabsContent value="bookmarks" className="space-y-3 mt-0">
            {bookmarks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark size={40} className="mx-auto opacity-30 mb-3" />
                <p>북마크한 공고가 없습니다.</p>
              </div>
            ) : (
              bookmarks.map((item: any) => (
                <JobCard
                  key={item.posting.id}
                  item={item}
                  isBookmarked={true}
                  onBookmark={() => toggleBookmark.mutate({ jobPostingId: item.posting.id })}
                  onApply={() => handleApply(item.posting)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Apply dialog */}
        <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>지원하기 — {selectedJob?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">포트폴리오 첨부 (선택)</label>
                <Select value={String(selectedPortfolioId ?? "")} onValueChange={v => setSelectedPortfolioId(v ? Number(v) : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="포트폴리오 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">자기소개서 첨부 (선택)</label>
                <Select value={String(selectedCoverLetterId ?? "")} onValueChange={v => setSelectedCoverLetterId(v ? Number(v) : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="자기소개서 선택" />
                  </SelectTrigger>
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
