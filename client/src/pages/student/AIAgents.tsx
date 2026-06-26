import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Sparkles, Briefcase, FileSearch, BookOpen, Plus, X } from "lucide-react";
import { toast } from "sonner";

// ─── 공통 태그 입력 컴포넌트 ─────────────────────────────────────────────────

function TagInput({
  label,
  placeholder,
  values,
  onChange,
  max = 10,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v || values.includes(v) || values.length >= max) return;
    onChange([...values, v]);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={add}>
          <Plus size={14} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1 pr-1">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))}>
              <X size={10} />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ─── 결과 렌더러 ─────────────────────────────────────────────────────────────

function JsonResult({ data }: { data: unknown }) {
  if (!data) return null;
  return (
    <pre className="bg-muted rounded-lg p-4 text-xs overflow-auto max-h-[500px] whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ─── 취업처 추천 탭 ──────────────────────────────────────────────────────────

function CareerGuidanceTab() {
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);
  const [ai, setAi] = useState("");
  const [workType, setWorkType] = useState("");
  const [industry, setIndustry] = useState("");

  const mutation = trpc.aiAgent.careerGuidance.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const handleRun = () => {
    if (tools.length === 0) {
      toast.error("보유 툴을 1개 이상 입력해주세요.");
      return;
    }
    mutation.mutate({ tools, works, ai, workType, industry });
  };

  const result = mutation.data?.data as {
    추천직무?: Array<{ 직무명: string; 이유: string }>;
    취업처목록?: Array<{
      순위: number;
      업종: string;
      포지션: string;
      추천이유: string;
      준비포인트: string;
    }>;
    준비로드맵?: { 단기1개월: string; 중기3개월: string; 포트폴리오핵심: string };
  } | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput label="보유 툴 *" placeholder="Photoshop, Illustrator…" values={tools} onChange={setTools} />
        <TagInput label="주요 작업물" placeholder="상세페이지, SNS 카드뉴스…" values={works} onChange={setWorks} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">생성형 AI 활용</label>
          <Input value={ai} onChange={(e) => setAi(e.target.value)} placeholder="Claude, Midjourney…" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">희망 근무 형태</label>
          <Input value={workType} onChange={(e) => setWorkType(e.target.value)} placeholder="정규직, 계약직…" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">희망 업종</label>
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="이커머스, 에이전시…" />
        </div>
      </div>

      <Button onClick={handleRun} disabled={mutation.isPending} className="gap-2 w-full md:w-auto">
        {mutation.isPending ? <><Sparkles size={14} className="animate-spin" /> 분석 중…</> : <><Sparkles size={14} /> 취업처 추천 받기</>}
      </Button>

      {result && (
        <div className="space-y-4">
          {result.추천직무 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">추천 직무</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.추천직무.map((j, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <Badge className="shrink-0">{j.직무명}</Badge>
                    <p className="text-sm text-muted-foreground">{j.이유}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.취업처목록 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">취업처 목록</CardTitle></CardHeader>
              <CardContent className="divide-y">
                {result.취업처목록.map((c) => (
                  <div key={c.순위} className="py-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{c.순위}. {c.포지션}</span>
                      <Badge variant="outline" className="text-xs">{c.업종}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.추천이유}</p>
                    <p className="text-xs text-primary">💡 {c.준비포인트}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.준비로드맵 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">준비 로드맵</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">단기(1개월):</span> {result.준비로드맵.단기1개월}</p>
                <p><span className="font-medium">중기(3개월):</span> {result.준비로드맵.중기3개월}</p>
                <p><span className="font-medium">포트폴리오 핵심:</span> {result.준비로드맵.포트폴리오핵심}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 채용공고 분석 탭 ─────────────────────────────────────────────────────────

function JobAnalysisTab() {
  const [jobPosting, setJobPosting] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);

  const mutation = trpc.aiAgent.jobAnalysis.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const handleRun = () => {
    if (!jobPosting.trim()) {
      toast.error("채용공고 내용을 입력해주세요.");
      return;
    }
    if (tools.length === 0) {
      toast.error("보유 툴을 1개 이상 입력해주세요.");
      return;
    }
    mutation.mutate({ jobPosting, tools, works });
  };

  const result = mutation.data?.data as {
    공고분석?: { 회사명: string; 직무: string; 고용형태: string; 필수역량: string[]; 핵심키워드: string[] };
    매칭포인트?: {
      강점TOP3: Array<{ 항목: string; 이유: string }>;
      보완필요: Array<{ 항목: string; 준비방법: string }>;
      매칭표: Array<{ 요구사항: string; 내강점: string; 매칭강도: string }>;
    };
    포트폴리오전략?: {
      수록작업물: Array<{ 순서: number; 유형: string; 이유: string; AI활용: boolean }>;
      면접관이보고싶은것: string;
      절대넣지말것: string;
    };
  } | undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">채용공고 내용 *</label>
        <Textarea
          value={jobPosting}
          onChange={(e) => setJobPosting(e.target.value)}
          placeholder="채용공고 전문을 붙여넣어 주세요…"
          rows={8}
          className="resize-none"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput label="보유 툴 *" placeholder="Photoshop, Illustrator…" values={tools} onChange={setTools} />
        <TagInput label="주요 작업물" placeholder="상세페이지, SNS 카드뉴스…" values={works} onChange={setWorks} />
      </div>

      <Button onClick={handleRun} disabled={mutation.isPending} className="gap-2 w-full md:w-auto">
        {mutation.isPending ? <><FileSearch size={14} className="animate-spin" /> 분석 중…</> : <><FileSearch size={14} /> 채용공고 분석하기</>}
      </Button>

      {result && (
        <div className="space-y-4">
          {result.공고분석 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">공고 분석</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">회사:</span> {result.공고분석.회사명} / {result.공고분석.직무} ({result.공고분석.고용형태})</p>
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="font-medium shrink-0">필수역량:</span>
                  {result.공고분석.필수역량.map((k) => <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>)}
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="font-medium shrink-0">키워드:</span>
                  {result.공고분석.핵심키워드.map((k) => <Badge key={k} variant="outline" className="text-xs">{k}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          {result.매칭포인트 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">매칭 포인트</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">강점 TOP 3</p>
                  <div className="space-y-1">
                    {result.매칭포인트.강점TOP3.map((s, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-green-600 shrink-0">✓</span>
                        <span><strong>{s.항목}</strong> — {s.이유}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">보완 필요</p>
                  <div className="space-y-1">
                    {result.매칭포인트.보완필요.map((w, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-orange-500 shrink-0">△</span>
                        <span><strong>{w.항목}</strong> — {w.준비방법}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">매칭표</p>
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-1 font-medium">요구사항</th>
                          <th className="text-left pb-1 font-medium">내 강점</th>
                          <th className="text-left pb-1 font-medium">매칭</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.매칭포인트.매칭표.map((r, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1 pr-4">{r.요구사항}</td>
                            <td className="py-1 pr-4">{r.내강점}</td>
                            <td className="py-1">{r.매칭강도}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result.포트폴리오전략 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">포트폴리오 전략</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  {result.포트폴리오전략.수록작업물.map((w) => (
                    <div key={w.순서} className="flex gap-2 items-start">
                      <Badge variant="secondary" className="shrink-0">{w.순서}</Badge>
                      <span>{w.유형} — {w.이유}{w.AI활용 && " (AI 활용 과정 포함 권장)"}</span>
                    </div>
                  ))}
                </div>
                <p><span className="font-medium">면접관이 보고 싶은 것:</span> {result.포트폴리오전략.면접관이보고싶은것}</p>
                <p className="text-red-600"><span className="font-medium">절대 넣지 말 것:</span> {result.포트폴리오전략.절대넣지말것}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 포트폴리오 가이드 탭 ─────────────────────────────────────────────────────

function PortfolioGuideTab() {
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);

  const mutation = trpc.aiAgent.portfolioGuide.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const handleRun = () => {
    if (tools.length === 0) {
      toast.error("보유 툴을 1개 이상 입력해주세요.");
      return;
    }
    if (targetCompanies.length === 0) {
      toast.error("목표 취업처를 1개 이상 입력해주세요.");
      return;
    }
    mutation.mutate({ tools, works, targetCompanies });
  };

  const result = mutation.data?.data as {
    취업처분석?: Array<{ 회사: string; 선호스타일: string; 강조역량: string }>;
    구성초안?: Array<{ 순서: number; 작업물명: string; 유형: string; 강조포인트: string; AI활용: boolean }>;
    작업물가이드?: Array<{ 작업물명: string; 한줄소개: string; 강조할것: string; 설명순서: string; 피할것: string }>;
  } | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput label="보유 툴 *" placeholder="Photoshop, Illustrator…" values={tools} onChange={setTools} />
        <TagInput label="주요 작업물" placeholder="상세페이지, SNS 카드뉴스…" values={works} onChange={setWorks} />
      </div>
      <TagInput label="목표 취업처 *" placeholder="이커머스 에이전시, 중소 광고대행사…" values={targetCompanies} onChange={setTargetCompanies} max={5} />

      <Button onClick={handleRun} disabled={mutation.isPending} className="gap-2 w-full md:w-auto">
        {mutation.isPending ? <><BookOpen size={14} className="animate-spin" /> 가이드 생성 중…</> : <><BookOpen size={14} /> 포트폴리오 가이드 받기</>}
      </Button>

      {result && (
        <div className="space-y-4">
          {result.취업처분석 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">취업처 분석</CardTitle></CardHeader>
              <CardContent className="divide-y">
                {result.취업처분석.map((c, i) => (
                  <div key={i} className="py-3 space-y-1 text-sm">
                    <p className="font-medium">{c.회사}</p>
                    <p className="text-muted-foreground">선호 스타일: {c.선호스타일}</p>
                    <p className="text-muted-foreground">강조 역량: {c.강조역량}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.구성초안 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">포트폴리오 구성 초안</CardTitle></CardHeader>
              <CardContent className="divide-y">
                {result.구성초안.map((w) => (
                  <div key={w.순서} className="py-3 space-y-1 text-sm">
                    <div className="flex gap-2 items-center">
                      <Badge>{w.순서}</Badge>
                      <span className="font-medium">{w.작업물명}</span>
                      <Badge variant="outline" className="text-xs">{w.유형}</Badge>
                      {w.AI활용 && <Badge variant="secondary" className="text-xs">AI 활용</Badge>}
                    </div>
                    <p className="text-muted-foreground pl-8">강조 포인트: {w.강조포인트}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.작업물가이드 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">작업물별 설명 가이드</CardTitle></CardHeader>
              <CardContent className="divide-y">
                {result.작업물가이드.map((g, i) => (
                  <div key={i} className="py-3 space-y-2 text-sm">
                    <p className="font-medium">{g.작업물명}</p>
                    <p className="text-muted-foreground italic">"{g.한줄소개}"</p>
                    <p><span className="font-medium">강조할 것:</span> {g.강조할것}</p>
                    <p><span className="font-medium">설명 순서:</span> {g.설명순서}</p>
                    <p className="text-red-600"><span className="font-medium">피할 것:</span> {g.피할것}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function StudentAIAgents() {
  return (
    <AppLayout title="AI 취업진로 에이전트">
      <div className="p-6 space-y-6 pb-20 lg:pb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            취업처 추천 · 채용공고 분석 · 포트폴리오 가이드를 AI로 즉시 받아보세요.
          </p>
        </div>

        <Tabs defaultValue="career">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="career" className="gap-1.5">
              <Briefcase size={14} /> 취업처 추천
            </TabsTrigger>
            <TabsTrigger value="job" className="gap-1.5">
              <FileSearch size={14} /> 채용공고 분석
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-1.5">
              <BookOpen size={14} /> 포트폴리오 가이드
            </TabsTrigger>
          </TabsList>

          <TabsContent value="career" className="mt-6">
            <CareerGuidanceTab />
          </TabsContent>
          <TabsContent value="job" className="mt-6">
            <JobAnalysisTab />
          </TabsContent>
          <TabsContent value="portfolio" className="mt-6">
            <PortfolioGuideTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
