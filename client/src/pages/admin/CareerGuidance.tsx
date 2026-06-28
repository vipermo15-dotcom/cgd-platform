import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, User, CheckSquare, Building2, ChevronDown, ChevronUp, ClipboardList, ArrowRight, Wrench, Layers } from "lucide-react";

const CAREER_TRACKS = [
  { value: "brand_design", label: "브랜드 디자인" },
  { value: "sns_marketing", label: "SNS 마케팅" },
  { value: "video_editing", label: "영상 편집" },
  { value: "character_goods", label: "캐릭터 굿즈" },
  { value: "ai_generation", label: "AI 생성" },
  { value: "freelancer", label: "프리랜서" },
  { value: "undecided", label: "미정" },
] as const;

type CareerTrack = typeof CAREER_TRACKS[number]["value"];

const DEFAULT_CHECKLIST = [
  { id: "resume", label: "이력서 작성 완료", done: false, category: "서류" },
  { id: "cover_letter", label: "자기소개서 작성 완료", done: false, category: "서류" },
  { id: "portfolio", label: "포트폴리오 등록 완료", done: false, category: "서류" },
  { id: "doc_review", label: "서류 검토 완료 (학과장)", done: false, category: "검토" },
  { id: "job_match", label: "채용공고 매칭 완료", done: false, category: "매칭" },
  { id: "apply", label: "지원서 제출 완료", done: false, category: "지원" },
  { id: "interview", label: "면접 준비 완료", done: false, category: "면접" },
  { id: "result", label: "최종 결과 확인", done: false, category: "결과" },
];

interface StudentItem {
  id: number;
  name: string;
  studentNumber?: string;
  skills?: string[];
}

type SurveyRow = {
  guidanceId: number;
  studentUserId: number;
  careerTrack: string;
  updatedAt: string;
  userName: string | null;
  surveyData: {
    tools: string[];
    works: string[];
    aiUsage: string;
    workType: string;
    industry: string;
    submittedAt: string;
    guidanceResult?: {
      추천직무?: Array<{ 직무명: string; 이유: string }>;
      취업처목록?: Array<{ 순위: number; 업종: string; 포지션: string; 추천이유: string; 준비포인트: string }>;
      준비로드맵?: { 단기1개월: string; 중기3개월: string; 포트폴리오핵심: string };
    };
  } | null;
};

// AI 취업처목록 → recommendedCompanies 형식 변환
function convertToRecommendations(취업처목록?: SurveyRow["surveyData"] extends null ? never : NonNullable<SurveyRow["surveyData"]>["guidanceResult"]) {
  if (!취업처목록?.취업처목록) return [];
  return 취업처목록.취업처목록.map((c) => ({
    companyName: c.포지션,
    jobTitle: c.업종,
    reason: `${c.추천이유} | 준비: ${c.준비포인트}`,
    matchScore: 80,
  }));
}

export default function CareerGuidance() {
  const { data: users = [] } = trpc.user.adminGetUsers.useQuery({ role: "student" });
  const students = (users as StudentItem[]).filter((u: any) => u.role === "student");
  const { data: surveys = [], refetch: refetchSurveys } = trpc.aiAgent.adminGetSurveys.useQuery();

  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [careerTrack, setCareerTrack] = useState<CareerTrack>("undecided");
  const [guidanceNote, setGuidanceNote] = useState("");
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [aiRecommendations, setAiRecommendations] = useState<
    { companyName: string; jobTitle: string; reason: string; matchScore: number }[]
  >([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: guidance, refetch: refetchGuidance } = trpc.guidance.getCareerGuidance.useQuery(
    { studentUserId: selectedStudent?.id ?? 0 },
    { enabled: !!selectedStudent }
  );

  const saveMutation = trpc.guidance.saveCareerGuidance.useMutation({
    onSuccess: () => { refetchGuidance(); toast.success("진로지도 카드가 저장되었습니다."); },
    onError: () => toast.error("저장 실패"),
  });

  const aiRecommendMutation = trpc.guidance.aiRecommendCompanies.useMutation({
    onSuccess: (data) => {
      setAiRecommendations(data.recommendations);
      toast.success("AI 추천이 완료되었습니다.");
      setIsAiLoading(false);
    },
    onError: () => { toast.error("AI 추천 실패"); setIsAiLoading(false); },
  });

  const handleSelectStudent = (student: StudentItem) => {
    setSelectedStudent(student);
    setCareerTrack("undecided");
    setGuidanceNote("");
    setChecklist(DEFAULT_CHECKLIST);
    setAiRecommendations([]);
  };

  // guidance 데이터가 로드되면 폼에 반영
  const handleLoadGuidance = () => {
    if (guidance) {
      setCareerTrack((guidance.careerTrack as CareerTrack) ?? "undecided");
      setGuidanceNote(guidance.guidanceNote ?? "");
      setChecklist((guidance.checklist as typeof DEFAULT_CHECKLIST) ?? DEFAULT_CHECKLIST);
      setAiRecommendations((guidance.recommendedCompanies as typeof aiRecommendations) ?? []);
    }
  };

  const handleSave = () => {
    if (!selectedStudent) return;
    saveMutation.mutate({
      studentUserId: selectedStudent.id,
      careerTrack,
      guidanceNote,
      checklist,
      recommendedCompanies: aiRecommendations,
    });
  };

  const handleAiRecommend = () => {
    if (!selectedStudent) return;
    setIsAiLoading(true);
    aiRecommendMutation.mutate({
      studentUserId: selectedStudent.id,
      skills: selectedStudent.skills ?? [],
      careerTrack,
    });
  };

  const toggleCheckItem = (id: string) => {
    setChecklist((prev) => prev.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  };

  const filteredStudents = students.filter((s) =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentNumber?.includes(searchQuery)
  );

  const completedCount = checklist.filter((c) => c.done).length;

  // 설문 데이터를 진로지도 카드 폼에 적용
  const applyFromSurvey = (survey: SurveyRow) => {
    const student = students.find((s) => s.id === survey.studentUserId);
    if (student) handleSelectStudent(student);
    if (survey.surveyData?.guidanceResult) {
      const recs = convertToRecommendations(survey.surveyData.guidanceResult);
      setAiRecommendations(recs);
      const note = [
        `[사전 설문 자동 적용 - ${new Date(survey.surveyData.submittedAt).toLocaleDateString("ko-KR")}]`,
        `보유 툴: ${survey.surveyData.tools.join(", ")}`,
        `주요 작업물: ${survey.surveyData.works.join(", ")}`,
        `AI 활용: ${survey.surveyData.aiUsage}`,
        `희망 근무: ${survey.surveyData.workType}`,
        `희망 업종: ${survey.surveyData.industry}`,
        survey.surveyData.guidanceResult.준비로드맵
          ? `\n[AI 준비 로드맵]\n단기: ${survey.surveyData.guidanceResult.준비로드맵.단기1개월}\n중기: ${survey.surveyData.guidanceResult.준비로드맵.중기3개월}`
          : "",
      ].filter(Boolean).join("\n");
      setGuidanceNote(note);
    }
    toast.success(`${survey.userName ?? "학생"} 설문 데이터가 진로지도 카드에 적용됐습니다.`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">진로지도 카드</h1>
        <p className="text-sm text-muted-foreground mt-1">교육생별 진로 트랙 설정, 체크리스트 관리, AI 취업처 추천</p>
      </div>

      {/* 설문 제출 현황 배너 */}
      {surveys.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <ClipboardList size={16} className="text-primary" />
              <span>사전 설문 제출 <strong>{surveys.length}명</strong> — 아래 탭에서 확인 후 첨삭에 바로 적용할 수 있습니다.</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="guidance">
        <TabsList>
          <TabsTrigger value="guidance" className="gap-1.5"><User size={14} /> 진로지도 카드</TabsTrigger>
          <TabsTrigger value="surveys" className="gap-1.5">
            <ClipboardList size={14} /> 사전 설문 결과
            {surveys.length > 0 && <Badge className="ml-1 h-4 text-xs px-1">{surveys.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── 설문 결과 탭 ── */}
        <TabsContent value="surveys" className="mt-4">
          {surveys.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">아직 제출된 사전 설문이 없습니다.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {(surveys as SurveyRow[]).map((row) => (
                <Card key={row.guidanceId} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {row.userName?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{row.userName ?? "학생"}</p>
                          <p className="text-xs text-muted-foreground">
                            제출: {row.surveyData?.submittedAt ? new Date(row.surveyData.submittedAt).toLocaleDateString("ko-KR") : "-"}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" className="gap-1.5" onClick={() => applyFromSurvey(row)}>
                        진로지도에 적용 <ArrowRight size={12} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {row.surveyData && (
                      <>
                        <div className="flex flex-wrap gap-1 items-center text-xs">
                          <Wrench size={12} className="text-muted-foreground" />
                          {row.surveyData.tools.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                        <div className="flex flex-wrap gap-1 items-center text-xs">
                          <Layers size={12} className="text-muted-foreground" />
                          {row.surveyData.works.map((w) => <Badge key={w} variant="outline" className="text-xs">{w}</Badge>)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          희망: {row.surveyData.workType || "무관"} / {row.surveyData.industry || "무관"} | AI: {row.surveyData.aiUsage || "-"}
                        </p>
                        {row.surveyData.guidanceResult?.추천직무 && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            <span className="text-xs text-muted-foreground">AI 추천 직무:</span>
                            {row.surveyData.guidanceResult.추천직무.map((j) => (
                              <Badge key={j.직무명} className="text-xs">{j.직무명}</Badge>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── 진로지도 카드 탭 ── */}
        <TabsContent value="guidance" className="mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 학생 목록 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">교육생 목록</CardTitle>
            <Input
              placeholder="이름 또는 학번 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 ${
                    selectedStudent?.id === student.id ? "bg-primary/5 border-l-2 border-primary" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                    {student.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    {student.studentNumber && (
                      <p className="text-xs text-muted-foreground">{student.studentNumber}</p>
                    )}
                  </div>
                </button>
              ))}
              {filteredStudents.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">학생이 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 진로지도 카드 */}
        <div className="lg:col-span-2 space-y-4">
          {selectedStudent ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" /> {selectedStudent.name} 진로지도 카드
                    </CardTitle>
                    <div className="flex gap-2">
                      {guidance && (
                        <Button variant="outline" size="sm" onClick={handleLoadGuidance}>
                          저장된 데이터 불러오기
                        </Button>
                      )}
                      <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                        저장
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="track">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="track">진로 트랙</TabsTrigger>
                      <TabsTrigger value="checklist">체크리스트 ({completedCount}/{checklist.length})</TabsTrigger>
                      <TabsTrigger value="companies">취업처 추천</TabsTrigger>
                    </TabsList>

                    {/* 진로 트랙 탭 */}
                    <TabsContent value="track" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>진로 트랙</Label>
                        <Select value={careerTrack} onValueChange={(v) => setCareerTrack(v as CareerTrack)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CAREER_TRACKS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>지도 메모</Label>
                        <Textarea
                          value={guidanceNote}
                          onChange={(e) => setGuidanceNote(e.target.value)}
                          placeholder="학생에 대한 진로지도 메모를 입력하세요..."
                          rows={5}
                        />
                      </div>
                    </TabsContent>

                    {/* 체크리스트 탭 */}
                    <TabsContent value="checklist" className="mt-4">
                      <div className="space-y-2">
                        {["서류", "검토", "매칭", "지원", "면접", "결과"].map((category) => (
                          <div key={category}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{category}</p>
                            {checklist
                              .filter((item) => item.category === category)
                              .map((item) => (
                                <label
                                  key={item.id}
                                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={() => toggleCheckItem(item.id)}
                                    className="rounded"
                                  />
                                  <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>
                                    {item.label}
                                  </span>
                                  {item.done && (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs ml-auto">완료</Badge>
                                  )}
                                </label>
                              ))}
                          </div>
                        ))}
                      </div>
                      {/* 진행률 바 */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>진행률</span>
                          <span>{Math.round((completedCount / checklist.length) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* AI 취업처 추천 탭 */}
                    <TabsContent value="companies" className="mt-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          AI가 학생의 스킬과 진로 트랙을 분석하여 적합한 취업처를 추천합니다.
                        </p>
                        <Button
                          size="sm"
                          onClick={handleAiRecommend}
                          disabled={isAiLoading}
                          className="gap-2 flex-shrink-0"
                        >
                          <Sparkles className="w-4 h-4" />
                          {isAiLoading ? "분석 중..." : "AI 추천"}
                        </Button>
                      </div>
                      {aiRecommendations.length > 0 ? (
                        <div className="space-y-3">
                          {aiRecommendations.map((rec, idx) => (
                            <div key={idx} className="p-4 rounded-lg border bg-card space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-sm">{rec.companyName}</p>
                                    <p className="text-xs text-muted-foreground">{rec.jobTitle}</p>
                                  </div>
                                </div>
                                <Badge className={`text-xs ${rec.matchScore >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                  적합도 {rec.matchScore}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{rec.reason}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">AI 추천 버튼을 클릭하여 취업처를 추천받으세요.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">좌측에서 교육생을 선택하세요.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
