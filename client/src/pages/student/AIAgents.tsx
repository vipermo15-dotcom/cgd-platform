import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Sparkles, Briefcase, FileSearch, BookOpen, Plus, X, MessageCircle, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, FileText, Mic, Map, Star, TrendingUp, CalendarCheck } from "lucide-react";
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

// ─── C. 사전 설문 탭 ──────────────────────────────────────────────────────────

const TOOL_OPTIONS = ["Photoshop", "Illustrator", "InDesign", "Figma", "XD", "Premiere Pro", "After Effects", "Final Cut", "Blender", "Midjourney", "DALL-E", "ChatGPT", "Claude"];
const WORK_OPTIONS = ["상세페이지", "SNS 카드뉴스", "포스터/리플렛", "영상편집", "모션그래픽", "UI 화면설계", "브랜드 아이덴티티", "편집디자인", "유튜브 썸네일"];

function SurveyTab() {
  const [step, setStep] = useState(0);
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);
  const [aiUsage, setAiUsage] = useState("");
  const [workType, setWorkType] = useState("");
  const [industry, setIndustry] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = trpc.aiAgent.submitSurvey.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => toast.error(e.message),
  });

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const steps = [
    {
      title: "보유 툴을 선택해주세요",
      content: (
        <div className="flex flex-wrap gap-2">
          {TOOL_OPTIONS.map((t) => (
            <Badge
              key={t}
              variant={tools.includes(t) ? "default" : "outline"}
              className="cursor-pointer text-sm py-1 px-3"
              onClick={() => toggleItem(tools, setTools, t)}
            >{t}</Badge>
          ))}
        </div>
      ),
      canNext: tools.length > 0,
    },
    {
      title: "주요 작업물 유형을 선택해주세요",
      content: (
        <div className="flex flex-wrap gap-2">
          {WORK_OPTIONS.map((w) => (
            <Badge
              key={w}
              variant={works.includes(w) ? "default" : "outline"}
              className="cursor-pointer text-sm py-1 px-3"
              onClick={() => toggleItem(works, setWorks, w)}
            >{w}</Badge>
          ))}
        </div>
      ),
      canNext: true,
    },
    {
      title: "생성형 AI를 활용하고 있나요?",
      content: (
        <Select value={aiUsage} onValueChange={setAiUsage}>
          <SelectTrigger><SelectValue placeholder="선택해주세요" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="자주 씁니다 (Claude, Midjourney 등)">자주 씁니다</SelectItem>
            <SelectItem value="가끔 써봤어요">가끔 써봤어요</SelectItem>
            <SelectItem value="아직 안 써봤어요">아직 안 써봤어요</SelectItem>
          </SelectContent>
        </Select>
      ),
      canNext: !!aiUsage,
    },
    {
      title: "희망 근무 형태는?",
      content: (
        <Select value={workType} onValueChange={setWorkType}>
          <SelectTrigger><SelectValue placeholder="선택해주세요" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="정규직">정규직</SelectItem>
            <SelectItem value="프리랜서">프리랜서</SelectItem>
            <SelectItem value="무관">무관 / 아직 모르겠어요</SelectItem>
          </SelectContent>
        </Select>
      ),
      canNext: !!workType,
    },
    {
      title: "관심 있는 업종이 있나요?",
      content: (
        <Input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="패션, 뷰티, IT스타트업, 광고대행사… (없으면 무관)"
        />
      ),
      canNext: true,
    },
  ];

  if (submitted) {
    const result = mutation.data?.guidanceResult as {
      추천직무?: Array<{ 직무명: string; 이유: string }>;
      취업처목록?: Array<{ 순위: number; 업종: string; 포지션: string; 추천이유: string; 준비포인트: string }>;
      준비로드맵?: { 단기1개월: string; 중기3개월: string; 포트폴리오핵심: string };
    } | undefined;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 size={20} />
          <span className="font-medium">설문 완료! AI 진로 분석 결과입니다.</span>
        </div>
        {result?.추천직무 && (
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
        {result?.취업처목록 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">맞춤 취업처</CardTitle></CardHeader>
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
        {result?.준비로드맵 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">준비 로드맵</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">단기(1개월):</span> {result.준비로드맵.단기1개월}</p>
              <p><span className="font-medium">중기(3개월):</span> {result.준비로드맵.중기3개월}</p>
              <p><span className="font-medium">포트폴리오 핵심:</span> {result.준비로드맵.포트폴리오핵심}</p>
            </CardContent>
          </Card>
        )}
        <Button variant="outline" onClick={() => { setSubmitted(false); setStep(0); setTools([]); setWorks([]); setAiUsage(""); setWorkType(""); setIndustry(""); }}>
          다시 작성하기
        </Button>
      </div>
    );
  }

  const currentStep = steps[step];
  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{step + 1} / {steps.length}</p>
        <h3 className="font-medium text-base mb-4">{currentStep.title}</h3>
        {currentStep.content}
      </div>
      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>이전</Button>
        )}
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!currentStep.canNext} className="gap-1.5">
            다음 <ChevronRight size={14} />
          </Button>
        ) : (
          <Button
            onClick={() => mutation.mutate({ tools, works, aiUsage, workType, industry: industry || "무관" })}
            disabled={mutation.isPending}
            className="gap-1.5"
          >
            {mutation.isPending ? <><Sparkles size={14} className="animate-spin" /> 분석 중…</> : <><Sparkles size={14} /> 제출하고 진로 분석 받기</>}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── A. 진로 상담 채팅 탭 ─────────────────────────────────────────────────────

type ChatMessage = { role: "user" | "assistant"; content: string };

function CareerChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "안녕하세요! 취업 진로 상담 AI입니다 😊\n궁금한 것을 편하게 물어보세요.\n\n예시: \"포트폴리오에 몇 개 작품을 넣어야 하나요?\", \"광고대행사 취업을 위해 뭘 준비해야 하나요?\"" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const mutation = trpc.aiAgent.careerChat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    mutation.mutate({
      messages: next.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    });
  };

  return (
    <div className="flex flex-col h-[520px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {mutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm text-muted-foreground">
              <Sparkles size={14} className="animate-spin inline mr-1" /> 답변 작성 중…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="질문을 입력하세요… (Enter로 전송)"
          rows={2}
          className="resize-none flex-1"
        />
        <Button onClick={send} disabled={mutation.isPending || !input.trim()} className="self-end">전송</Button>
      </div>
    </div>
  );
}

// ─── B. 내 진로지도 카드 탭 ───────────────────────────────────────────────────

const TRACK_LABELS: Record<string, string> = {
  brand_design: "브랜드 디자인",
  sns_marketing: "SNS 마케팅",
  video_editing: "영상 편집",
  character_goods: "캐릭터/굿즈",
  ai_generation: "AI 생성 콘텐츠",
  freelancer: "프리랜서",
  undecided: "미정",
};

function MyGuidanceTab() {
  const me = trpc.auth.me.useQuery();
  const userId = me.data?.id;
  const guidance = trpc.guidance.getCareerGuidance.useQuery(
    { studentUserId: userId! },
    { enabled: !!userId }
  );

  if (guidance.isLoading) return <div className="text-sm text-muted-foreground">불러오는 중…</div>;
  if (!guidance.data) return (
    <div className="text-center py-12 text-muted-foreground">
      <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">아직 진로지도 카드가 없습니다.</p>
      <p className="text-xs mt-1">사전 설문을 제출하면 선생님이 진로지도 카드를 작성해 드립니다.</p>
    </div>
  );

  const card = guidance.data;
  const checklist = (card.checklist as Record<string, boolean> | null) ?? {};
  const checkItems = [
    { key: "서류준비", label: "서류 준비" },
    { key: "서류검토", label: "서류 검토" },
    { key: "기업매칭", label: "기업 매칭" },
    { key: "지원완료", label: "지원 완료" },
    { key: "면접준비", label: "면접 준비" },
    { key: "최종결과", label: "최종 결과" },
  ];
  const doneCount = checkItems.filter((c) => checklist[c.key]).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">내 진로 트랙</CardTitle>
            {card.careerTrack && (
              <Badge>{TRACK_LABELS[card.careerTrack] ?? card.careerTrack}</Badge>
            )}
          </div>
        </CardHeader>
        {card.guidanceNote && (
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{card.guidanceNote}</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">진행 체크리스트</CardTitle>
            <span className="text-sm text-muted-foreground">{doneCount} / {checkItems.length}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${(doneCount / checkItems.length) * 100}%` }} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {checkItems.map((c) => (
              <div key={c.key} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${checklist[c.key] ? "bg-green-50 text-green-700" : "text-muted-foreground"}`}>
                <CheckCircle2 size={14} className={checklist[c.key] ? "text-green-600" : "opacity-30"} />
                {c.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {card.aiRecommendations && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">AI 추천 취업처</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
              {typeof card.aiRecommendations === "string"
                ? card.aiRecommendations
                : JSON.stringify(card.aiRecommendations, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── 포트폴리오 코치 탭 ───────────────────────────────────────────────────────

function PortfolioCoachTab() {
  const [description, setDescription] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);
  const [targetJob, setTargetJob] = useState("");

  const mutation = trpc.aiAgent.portfolioCoach.useMutation({ onError: (e) => toast.error(e.message) });

  const result = mutation.data?.data as {
    총점?: number;
    강점?: Array<{ 항목: string; 설명: string }>;
    개선점?: Array<{ 항목: string; 방법: string; 우선순위: string }>;
    총평?: string;
    다음단계?: string;
  } | undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">포트폴리오 설명 *</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="작업물 목록, 작업 방식, 강점이라고 생각하는 부분 등을 자유롭게 적어주세요…" rows={6} className="resize-none" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput label="보유 툴 *" placeholder="Photoshop…" values={tools} onChange={setTools} />
        <TagInput label="주요 작업물" placeholder="상세페이지…" values={works} onChange={setWorks} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">목표 직무</label>
        <Input value={targetJob} onChange={(e) => setTargetJob(e.target.value)} placeholder="UI 디자이너, SNS 마케터…" />
      </div>
      <Button onClick={() => mutation.mutate({ description, tools, works, targetJob })} disabled={mutation.isPending || !description.trim() || tools.length === 0} className="gap-2">
        {mutation.isPending ? <><Sparkles size={14} className="animate-spin" />분석 중…</> : <><GraduationCap size={14} />포트폴리오 코칭 받기</>}
      </Button>

      {result && (
        <div className="space-y-4">
          {result.총점 !== undefined && (
            <Card>
              <CardContent className="pt-6 flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{result.총점}</div>
                  <div className="text-xs text-muted-foreground">/ 100점</div>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${result.총점}%` }} />
                  </div>
                  {result.총평 && <p className="text-sm text-muted-foreground mt-2">{result.총평}</p>}
                </div>
              </CardContent>
            </Card>
          )}
          {result.강점 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base text-green-700">강점</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.강점.map((s, i) => (
                  <div key={i} className="flex gap-3 items-start text-sm">
                    <span className="text-green-500 shrink-0">✓</span>
                    <div><span className="font-medium">{s.항목}</span> — {s.설명}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {result.개선점 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base text-orange-600">개선점</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.개선점.map((p, i) => (
                  <div key={i} className="flex gap-3 items-start text-sm">
                    <Badge variant="outline" className={`text-xs shrink-0 ${p.우선순위 === "높음" ? "border-red-300 text-red-600" : "border-amber-300 text-amber-600"}`}>{p.우선순위}</Badge>
                    <div><span className="font-medium">{p.항목}</span> — {p.방법}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {result.다음단계 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 text-sm"><span className="font-medium">다음 단계: </span>{result.다음단계}</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 자기소개서 탭 ────────────────────────────────────────────────────────────

function CoverLetterTab() {
  const [jobPosting, setJobPosting] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);
  const [selfIntro, setSelfIntro] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const mutation = trpc.aiAgent.coverLetter.useMutation({ onError: (e) => toast.error(e.message) });

  const result = mutation.data?.data as {
    지원동기?: string;
    성장과정?: string;
    역량및경험?: string;
    입사후계획?: string;
    총평?: string;
  } | undefined;

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
  };

  const sections = result ? [
    { key: "지원동기", label: "지원 동기", value: result.지원동기 },
    { key: "성장과정", label: "성장 과정", value: result.성장과정 },
    { key: "역량및경험", label: "역량 및 경험", value: result.역량및경험 },
    { key: "입사후계획", label: "입사 후 계획", value: result.입사후계획 },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">채용공고 내용 *</label>
        <Textarea value={jobPosting} onChange={(e) => setJobPosting(e.target.value)} placeholder="채용공고 전문을 붙여넣어 주세요…" rows={6} className="resize-none" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput label="보유 툴 *" placeholder="Photoshop…" values={tools} onChange={setTools} />
        <TagInput label="주요 작업물" placeholder="상세페이지…" values={works} onChange={setWorks} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">나에 대해 간단히 (선택)</label>
        <Textarea value={selfIntro} onChange={(e) => setSelfIntro(e.target.value)} placeholder="경력, 특기, 어필하고 싶은 점…" rows={3} className="resize-none" />
      </div>
      <Button onClick={() => mutation.mutate({ jobPosting, tools, works, selfIntro })} disabled={mutation.isPending || !jobPosting.trim() || tools.length === 0} className="gap-2">
        {mutation.isPending ? <><Sparkles size={14} className="animate-spin" />작성 중…</> : <><FileText size={14} />자기소개서 초안 생성</>}
      </Button>

      {result && (
        <div className="space-y-3">
          {result.총평 && <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{result.총평}</p>}
          {sections.map(({ key, label, value }) => value && (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copy(key, value)}>
                    {copied === key ? "복사됨 ✓" : "복사"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 면접 준비 탭 ─────────────────────────────────────────────────────────────

function InterviewPrepTab() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const mutation = trpc.aiAgent.interviewPrep.useMutation({ onError: (e) => toast.error(e.message) });

  const result = mutation.data?.data as {
    예상질문?: Array<{ 질문: string; 카테고리: string; 모범답변: string; 핵심포인트: string }>;
  } | undefined;

  const catColor: Record<string, string> = {
    "자기소개": "bg-blue-100 text-blue-700",
    "포트폴리오": "bg-purple-100 text-purple-700",
    "직무역량": "bg-green-100 text-green-700",
    "인성": "bg-amber-100 text-amber-700",
    "상황대처": "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">지원 직무 *</label>
          <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="UI 디자이너, SNS 마케터…" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">지원 회사 (선택)</label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="회사명…" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput label="보유 툴 *" placeholder="Photoshop…" values={tools} onChange={setTools} />
        <TagInput label="주요 작업물" placeholder="상세페이지…" values={works} onChange={setWorks} />
      </div>
      <Button onClick={() => mutation.mutate({ jobTitle, company, tools, works })} disabled={mutation.isPending || !jobTitle.trim() || tools.length === 0} className="gap-2">
        {mutation.isPending ? <><Sparkles size={14} className="animate-spin" />생성 중…</> : <><Mic size={14} />면접 질문 생성</>}
      </Button>

      {result?.예상질문 && (
        <div className="space-y-2">
          {result.예상질문.map((q, i) => (
            <Card key={i} className="overflow-hidden">
              <button className="w-full text-left px-4 py-3 flex items-center justify-between gap-2" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <div className="flex items-center gap-2 min-w-0">
                  <Badge className={`text-xs shrink-0 ${catColor[q.카테고리] ?? "bg-gray-100 text-gray-700"}`}>{q.카테고리}</Badge>
                  <span className="text-sm font-medium truncate">Q{i + 1}. {q.질문}</span>
                </div>
                <ChevronRight size={14} className={`shrink-0 transition-transform ${openIdx === i ? "rotate-90" : ""}`} />
              </button>
              {openIdx === i && (
                <CardContent className="pt-0 pb-4 space-y-2 border-t bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{q.모범답변}</p>
                  <p className="text-xs text-primary font-medium">💡 {q.핵심포인트}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 학습 로드맵 탭 ───────────────────────────────────────────────────────────

function LearningRoadmapTab() {
  const [tools, setTools] = useState<string[]>([]);
  const [targetJob, setTargetJob] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");

  const mutation = trpc.aiAgent.learningRoadmap.useMutation({ onError: (e) => toast.error(e.message) });

  const result = mutation.data?.data as {
    현재수준?: string;
    목표직무?: string;
    로드맵?: Array<{ 기간: string; 목표: string; 학습항목: string[]; 체크포인트: string }>;
    추천리소스?: Array<{ 유형: string; 내용: string }>;
  } | undefined;

  return (
    <div className="space-y-6">
      <TagInput label="현재 보유 툴 *" placeholder="Photoshop…" values={tools} onChange={setTools} />
      <div className="space-y-2">
        <label className="text-sm font-medium">목표 직무 *</label>
        <Input value={targetJob} onChange={(e) => setTargetJob(e.target.value)} placeholder="UI 디자이너, 영상 편집자…" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">현재 수준 (선택)</label>
        <Input value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)} placeholder="기초 포토샵만 가능, Figma 3개월 경험…" />
      </div>
      <Button onClick={() => mutation.mutate({ tools, targetJob, currentLevel })} disabled={mutation.isPending || tools.length === 0 || !targetJob.trim()} className="gap-2">
        {mutation.isPending ? <><Sparkles size={14} className="animate-spin" />생성 중…</> : <><Map size={14} />학습 로드맵 받기</>}
      </Button>

      {result && (
        <div className="space-y-4">
          {result.로드맵 && (
            <div className="relative space-y-0">
              {result.로드맵.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    {i < result.로드맵!.length - 1 && <div className="w-0.5 bg-border flex-1 my-1" />}
                  </div>
                  <Card className="flex-1 mb-3">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{step.기간}</Badge>
                        <CardTitle className="text-sm">{step.목표}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {step.학습항목.map((item, j) => <Badge key={j} variant="secondary" className="text-xs">{item}</Badge>)}
                      </div>
                      <p className="text-xs text-primary">✓ {step.체크포인트}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
          {result.추천리소스 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">추천 리소스</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {result.추천리소스.map((r, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <Badge variant="outline" className="text-xs shrink-0">{r.유형}</Badge>
                    <span className="text-muted-foreground">{r.내용}</span>
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

// ─── 포트폴리오 점수 탭 ───────────────────────────────────────────────────────

function PortfolioScoreTab() {
  const [description, setDescription] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);
  const [targetJob, setTargetJob] = useState("");

  const mutation = trpc.aiAgent.portfolioScore.useMutation({ onError: (e) => toast.error(e.message) });

  const result = mutation.data?.data as {
    총점?: number;
    등급?: string;
    항목별점수?: Array<{ 항목: string; 점수: number; 만점: number; 피드백: string }>;
    한줄평?: string;
    즉시개선?: string;
  } | undefined;

  const gradeColor: Record<string, string> = { A: "text-green-600", B: "text-blue-600", C: "text-amber-600", D: "text-red-600" };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">포트폴리오 내용 *</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="작업물 목록, 구성, 특징 등을 자세히 적어주세요…" rows={6} className="resize-none" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput label="보유 툴 *" placeholder="Photoshop…" values={tools} onChange={setTools} />
        <TagInput label="주요 작업물" placeholder="상세페이지…" values={works} onChange={setWorks} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">목표 직무 (선택)</label>
        <Input value={targetJob} onChange={(e) => setTargetJob(e.target.value)} placeholder="UI 디자이너…" />
      </div>
      <Button onClick={() => mutation.mutate({ description, tools, works, targetJob })} disabled={mutation.isPending || !description.trim() || tools.length === 0} className="gap-2">
        {mutation.isPending ? <><Sparkles size={14} className="animate-spin" />채점 중…</> : <><Star size={14} />포트폴리오 점수 받기</>}
      </Button>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="text-center shrink-0">
                  <div className={`text-5xl font-black ${gradeColor[result.등급 ?? "C"] ?? ""}`}>{result.등급}</div>
                  <div className="text-2xl font-bold text-primary">{result.총점}점</div>
                </div>
                <div className="flex-1 space-y-2">
                  {result.한줄평 && <p className="text-sm font-medium">{result.한줄평}</p>}
                  {result.즉시개선 && <p className="text-xs text-orange-600">즉시 개선: {result.즉시개선}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
          {result.항목별점수 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">항목별 점수</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.항목별점수.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.항목}</span>
                      <span className="text-muted-foreground">{s.점수} / {s.만점}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(s.점수 / s.만점) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{s.피드백}</p>
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

// ─── 취업 준비도 탭 ───────────────────────────────────────────────────────────

function JobReadinessTab() {
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);
  const [targetJob, setTargetJob] = useState("");
  const [hasResume, setHasResume] = useState(false);
  const [hasPortfolio, setHasPortfolio] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const mutation = trpc.aiAgent.jobReadiness.useMutation({ onError: (e) => toast.error(e.message) });

  const result = mutation.data?.data as {
    준비도?: number;
    등급?: string;
    강점?: string[];
    보완필요?: string[];
    단계별현황?: Array<{ 단계: string; 상태: string; 설명: string }>;
    이번주할일?: string[];
  } | undefined;

  const statusColor = { "완료": "text-green-600 bg-green-50", "진행중": "text-blue-600 bg-blue-50", "미시작": "text-muted-foreground bg-muted" };

  return (
    <div className="space-y-6">
      <TagInput label="보유 툴 *" placeholder="Photoshop…" values={tools} onChange={setTools} />
      <TagInput label="주요 작업물" placeholder="상세페이지…" values={works} onChange={setWorks} />
      <div className="space-y-2">
        <label className="text-sm font-medium">목표 직무 *</label>
        <Input value={targetJob} onChange={(e) => setTargetJob(e.target.value)} placeholder="UI 디자이너, SNS 마케터…" />
      </div>
      <div className="flex flex-wrap gap-4">
        {([["hasResume", "이력서 작성 완료", hasResume, setHasResume], ["hasPortfolio", "포트폴리오 완성", hasPortfolio, setHasPortfolio], ["hasApplied", "지원 경험 있음", hasApplied, setHasApplied]] as const).map(([key, label, val, setter]: any) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="rounded" />
            {label}
          </label>
        ))}
      </div>
      <Button onClick={() => mutation.mutate({ tools, works, targetJob, hasResume, hasPortfolio, hasApplied })} disabled={mutation.isPending || tools.length === 0 || !targetJob.trim()} className="gap-2">
        {mutation.isPending ? <><Sparkles size={14} className="animate-spin" />분석 중…</> : <><TrendingUp size={14} />취업 준비도 확인</>}
      </Button>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-6">
              <div className="text-center shrink-0">
                <div className="text-4xl font-black text-primary">{result.준비도}</div>
                <div className="text-xs text-muted-foreground">/ 100점</div>
                <Badge className="mt-1 text-xs">{result.등급}</Badge>
              </div>
              <div className="flex-1">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${result.준비도}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {result.강점?.map((s, i) => <p key={i} className="text-xs text-green-600">✓ {s}</p>)}
                  {result.보완필요?.map((s, i) => <p key={i} className="text-xs text-orange-500">△ {s}</p>)}
                </div>
              </div>
            </CardContent>
          </Card>
          {result.단계별현황 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">단계별 현황</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.단계별현황.map((s, i) => (
                  <div key={i} className={`flex items-start gap-3 p-2 rounded-lg text-sm ${statusColor[s.상태 as keyof typeof statusColor] ?? "bg-muted"}`}>
                    <span className="font-medium shrink-0 w-20">{s.단계}</span>
                    <span className="text-xs shrink-0">[{s.상태}]</span>
                    <span className="text-xs">{s.설명}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {result.이번주할일 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3"><CardTitle className="text-base">이번 주 할 일</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {result.이번주할일.map((t, i) => (
                  <div key={i} className="flex gap-2 text-sm items-start">
                    <span className="text-primary shrink-0">→</span>
                    <span>{t}</span>
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

// ─── 주간 리포트 탭 ───────────────────────────────────────────────────────────

function WeeklyReportTab() {
  const [tools, setTools] = useState<string[]>([]);
  const [works, setWorks] = useState<string[]>([]);
  const [thisWeekDone, setThisWeekDone] = useState("");
  const [nextWeekPlan, setNextWeekPlan] = useState("");

  const mutation = trpc.aiAgent.weeklyReport.useMutation({ onError: (e) => toast.error(e.message) });

  const result = mutation.data?.data as {
    이번주요약?: string;
    성과?: string[];
    잘한점?: string;
    보완점?: string;
    다음주목표?: string[];
    응원메시지?: string;
  } | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput label="보유 툴" placeholder="Photoshop…" values={tools} onChange={setTools} />
        <TagInput label="주요 작업물" placeholder="상세페이지…" values={works} onChange={setWorks} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">이번 주 한 일 *</label>
        <Textarea value={thisWeekDone} onChange={(e) => setThisWeekDone(e.target.value)} placeholder="포트폴리오 작업물 2개 완성, Figma 강의 수강, 채용공고 5개 조회…" rows={4} className="resize-none" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">다음 주 계획 (선택)</label>
        <Textarea value={nextWeekPlan} onChange={(e) => setNextWeekPlan(e.target.value)} placeholder="이력서 작성 완료, 지원서 제출…" rows={2} className="resize-none" />
      </div>
      <Button onClick={() => mutation.mutate({ tools, works, thisWeekDone, nextWeekPlan })} disabled={mutation.isPending || !thisWeekDone.trim()} className="gap-2">
        {mutation.isPending ? <><Sparkles size={14} className="animate-spin" />생성 중…</> : <><CalendarCheck size={14} />주간 리포트 받기</>}
      </Button>

      {result && (
        <div className="space-y-4">
          {result.이번주요약 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">이번 주 요약</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{result.이번주요약}</p>
                {result.성과 && (
                  <div className="mt-3 space-y-1">
                    {result.성과.map((s, i) => <p key={i} className="text-sm text-green-600">✓ {s}</p>)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.잘한점 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-green-700">잘한 점</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-green-700">{result.잘한점}</p></CardContent>
              </Card>
            )}
            {result.보완점 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-orange-700">보완할 점</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-orange-700">{result.보완점}</p></CardContent>
              </Card>
            )}
          </div>
          {result.다음주목표 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">다음 주 목표</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {result.다음주목표.map((t, i) => (
                  <div key={i} className="flex gap-2 text-sm"><span className="text-primary">→</span><span>{t}</span></div>
                ))}
              </CardContent>
            </Card>
          )}
          {result.응원메시지 && (
            <Card className="bg-primary/5 border-primary/20 text-center">
              <CardContent className="pt-4 text-sm font-medium text-primary">{result.응원메시지}</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 포트폴리오 구성전략 탭 (채용분야 기반 사전 전략) ──────────────────────────

const TARGET_FIELDS = [
  "이커머스/상세페이지 디자이너", "SNS 콘텐츠/마케팅 디자이너", "브랜드/BI 디자이너",
  "영상편집/모션그래픽 디자이너", "UI/UX 디자이너", "편집디자인/출판", "광고대행사 디자이너",
  "캐릭터/일러스트레이터", "AI 콘텐츠 크리에이터", "프리랜서 디자이너",
];

function PortfolioStrategyTab() {
  const [targetField, setTargetField] = useState("");
  const [customField, setCustomField] = useState("");
  const [jobPosting, setJobPosting] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [currentWorks, setCurrentWorks] = useState<string[]>([]);
  const [level, setLevel] = useState("초급~중급");

  const mutation = trpc.aiAgent.portfolioStrategy.useMutation({ onError: (e) => toast.error(e.message) });

  const result = mutation.data?.data as {
    전략요약?: string;
    핵심어필포인트?: string[];
    추천구성?: Array<{
      순서: number;
      작업물유형: string;
      목적: string;
      강조포인트: string;
      분량: string;
      AI활용권장: boolean;
    }>;
    채용분야별키워드?: string[];
    제작우선순위?: string[];
    피해야할실수?: string[];
    예상심사기준?: string;
  } | undefined;

  const field = targetField === "직접입력" ? customField : targetField;

  return (
    <div className="space-y-6">
      {/* 안내 카드 */}
      <div className="flex gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
        <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-primary mb-1">포트폴리오 제작 전 전략부터!</p>
          <p className="text-muted-foreground text-xs">희망 취업분야와 채용공고를 입력하면 어떤 작업물을 어떤 순서로 담아야 하는지 AI가 전략을 세워드립니다.</p>
        </div>
      </div>

      {/* 희망 취업분야 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">희망 취업분야 *</label>
        <div className="flex flex-wrap gap-2">
          {TARGET_FIELDS.map((f) => (
            <Badge
              key={f}
              variant={targetField === f ? "default" : "outline"}
              className="cursor-pointer text-xs py-1 px-3"
              onClick={() => setTargetField(f)}
            >{f}</Badge>
          ))}
          <Badge
            variant={targetField === "직접입력" ? "default" : "outline"}
            className="cursor-pointer text-xs py-1 px-3"
            onClick={() => setTargetField("직접입력")}
          >직접 입력</Badge>
        </div>
        {targetField === "직접입력" && (
          <Input value={customField} onChange={(e) => setCustomField(e.target.value)} placeholder="희망 취업분야를 입력해주세요…" />
        )}
      </div>

      {/* 채용공고 (선택) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">채용공고 붙여넣기 <span className="text-muted-foreground font-normal">(선택 — 있으면 더 정확해요)</span></label>
        <Textarea value={jobPosting} onChange={(e) => setJobPosting(e.target.value)} placeholder="채용공고 전문을 붙여넣어 주세요…" rows={5} className="resize-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput label="보유 툴 *" placeholder="Photoshop…" values={tools} onChange={setTools} />
        <TagInput label="현재 작업물 현황" placeholder="상세페이지 2개, SNS 포스터…" values={currentWorks} onChange={setCurrentWorks} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">현재 수준</label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="입문 (툴 기초)">입문 (툴 기초)</SelectItem>
            <SelectItem value="초급~중급">초급~중급</SelectItem>
            <SelectItem value="중급 이상">중급 이상</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={() => mutation.mutate({ targetField: field, jobPosting: jobPosting || undefined, tools, currentWorks, level })}
        disabled={mutation.isPending || !field.trim() || tools.length === 0}
        className="gap-2 w-full md:w-auto"
      >
        {mutation.isPending
          ? <><Sparkles size={14} className="animate-spin" />전략 수립 중…</>
          : <><BookOpen size={14} />포트폴리오 구성전략 받기</>}
      </Button>

      {result && (
        <div className="space-y-4">
          {/* 전략 요약 */}
          {result.전략요약 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-primary mb-1">전략 요약</p>
                <p className="text-sm">{result.전략요약}</p>
              </CardContent>
            </Card>
          )}

          {/* 핵심 어필 포인트 + 채용 키워드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.핵심어필포인트 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">핵심 어필 포인트</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {result.핵심어필포인트.map((p, i) => (
                    <div key={i} className="flex gap-2 text-xs"><span className="text-primary shrink-0">✓</span>{p}</div>
                  ))}
                </CardContent>
              </Card>
            )}
            {result.채용분야별키워드 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">채용분야 핵심 키워드</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {result.채용분야별키워드.map((k, i) => <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 추천 구성 */}
          {result.추천구성 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">추천 포트폴리오 구성</CardTitle></CardHeader>
              <CardContent className="divide-y">
                {result.추천구성.map((c) => (
                  <div key={c.순서} className="py-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{c.순서}</div>
                      <span className="font-medium text-sm">{c.작업물유형}</span>
                      <Badge variant="outline" className="text-xs">{c.분량}</Badge>
                      {c.AI활용권장 && <Badge className="text-xs bg-violet-100 text-violet-700 border-violet-200">AI 활용 권장</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground pl-8">{c.목적}</p>
                    <p className="text-xs text-primary pl-8">💡 {c.강조포인트}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 제작 우선순위 + 피해야 할 실수 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.제작우선순위 && (
              <Card className="border-green-200">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-green-700">제작 우선순위</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {result.제작우선순위.map((p, i) => (
                    <div key={i} className="flex gap-2 text-xs"><span className="text-green-600 shrink-0">{i + 1}.</span>{p}</div>
                  ))}
                </CardContent>
              </Card>
            )}
            {result.피해야할실수 && (
              <Card className="border-red-200">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">피해야 할 실수</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {result.피해야할실수.map((m, i) => (
                    <div key={i} className="flex gap-2 text-xs"><span className="text-red-500 shrink-0">✗</span>{m}</div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {result.예상심사기준 && (
            <Card>
              <CardContent className="pt-4 text-sm"><span className="font-medium">예상 심사 기준: </span><span className="text-muted-foreground">{result.예상심사기준}</span></CardContent>
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
            사전 설문 · 진로 상담 · 포트폴리오 코치 · 자기소개서 · 면접 준비 · 학습 로드맵 · 점수 · 준비도 · 주간 리포트
          </p>
        </div>

        <Tabs defaultValue="survey">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="survey" className="gap-1.5"><ClipboardList size={14} /> 사전 설문</TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5"><MessageCircle size={14} /> 진로 상담</TabsTrigger>
            <TabsTrigger value="mycard" className="gap-1.5"><Briefcase size={14} /> 내 진로카드</TabsTrigger>
            <TabsTrigger value="career" className="gap-1.5"><Sparkles size={14} /> 기업 추천</TabsTrigger>
            <TabsTrigger value="strategy" className="gap-1.5"><BookOpen size={14} /> 포폴 구성전략</TabsTrigger>
            <TabsTrigger value="coach" className="gap-1.5"><GraduationCap size={14} /> 포트폴리오 코치</TabsTrigger>
            <TabsTrigger value="score" className="gap-1.5"><Star size={14} /> 포트폴리오 점수</TabsTrigger>
            <TabsTrigger value="cover" className="gap-1.5"><FileText size={14} /> 자기소개서</TabsTrigger>
            <TabsTrigger value="interview" className="gap-1.5"><Mic size={14} /> 면접 준비</TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-1.5"><Map size={14} /> 학습 로드맵</TabsTrigger>
            <TabsTrigger value="readiness" className="gap-1.5"><TrendingUp size={14} /> 취업 준비도</TabsTrigger>
            <TabsTrigger value="weekly" className="gap-1.5"><CalendarCheck size={14} /> 주간 리포트</TabsTrigger>
            <TabsTrigger value="job" className="gap-1.5"><FileSearch size={14} /> 채용공고 분석</TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-1.5"><BookOpen size={14} /> 포트폴리오 가이드</TabsTrigger>
          </TabsList>

          <TabsContent value="survey" className="mt-6"><SurveyTab /></TabsContent>
          <TabsContent value="chat" className="mt-6"><CareerChatTab /></TabsContent>
          <TabsContent value="mycard" className="mt-6"><MyGuidanceTab /></TabsContent>
          <TabsContent value="career" className="mt-6"><CareerGuidanceTab /></TabsContent>
          <TabsContent value="strategy" className="mt-6"><PortfolioStrategyTab /></TabsContent>
          <TabsContent value="coach" className="mt-6"><PortfolioCoachTab /></TabsContent>
          <TabsContent value="score" className="mt-6"><PortfolioScoreTab /></TabsContent>
          <TabsContent value="cover" className="mt-6"><CoverLetterTab /></TabsContent>
          <TabsContent value="interview" className="mt-6"><InterviewPrepTab /></TabsContent>
          <TabsContent value="roadmap" className="mt-6"><LearningRoadmapTab /></TabsContent>
          <TabsContent value="readiness" className="mt-6"><JobReadinessTab /></TabsContent>
          <TabsContent value="weekly" className="mt-6"><WeeklyReportTab /></TabsContent>
          <TabsContent value="job" className="mt-6"><JobAnalysisTab /></TabsContent>
          <TabsContent value="portfolio" className="mt-6"><PortfolioGuideTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
