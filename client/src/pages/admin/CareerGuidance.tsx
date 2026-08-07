import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, User, Building2, ClipboardList, ArrowRight, Wrench, Layers, FileText, Loader2, ExternalLink, Link2, Send, MessageSquare, Plus, Trash2 } from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import StudentDocumentsDialog from "./StudentDocumentsDialog";

// 2026-08 변경: 학생별 진로지도/포트폴리오가이드 문서 목록은 더 이상 소스코드에
// 실명 목록으로 하드코딩하지 않는다(공개 저장소 개인정보 노출 이슈).
// 대신 career_guidance.guidanceDocs(DB)에 학생별로 {name, url}을 등록해 관리한다 —
// 아래 "진로지도 자료" 탭에서 관리자가 직접 추가/삭제한다.

const CAREER_TRACKS = [
  { value: "editorial_design", label: "편집 디자인" },
  { value: "brand_design", label: "브랜드 디자인" },
  { value: "goods_design", label: "굿즈 디자인" },
  { value: "content_marketing", label: "콘텐츠 마케팅" },
  { value: "sns_content", label: "SNS 콘텐츠 제작" },
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
  updatedAt: string | Date;
  userName: string | null;
  surveyData: {
    tools: string[];
    works: string[];
    aiUsage: string;
    workType: string;
    industry: string;
    desiredSalary?: string;
    desiredLocation?: string;
    availability?: string;
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

// ─── 진로 매칭 자료 탭 (이력서·자소서·랜딩페이지·희망 취업처 등록 + 누적 히스토리/댓글) ──
function MatchingMaterialsTab({ studentUserId }: { studentUserId: number }) {
  const utils = trpc.useUtils();
  const { data: docs, isLoading: docsLoading } = trpc.resume.adminGetStudentDocuments.useQuery({ studentUserId });
  const { data: records = [], isLoading: recordsLoading } = trpc.careerMatching.getMatchingRecords.useQuery({ studentUserId });

  const [coverLetterId, setCoverLetterId] = useState<string>("");
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [desiredEmployerLink, setDesiredEmployerLink] = useState("");
  const [note, setNote] = useState("");

  const create = trpc.careerMatching.createMatchingRecord.useMutation({
    onSuccess: () => {
      utils.careerMatching.getMatchingRecords.invalidate({ studentUserId });
      toast.success("매칭자료가 등록되었습니다.");
      setCoverLetterId("");
      setPortfolioId("");
      setDesiredEmployerLink("");
      setNote("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    create.mutate({
      studentUserId,
      resumeId: docs?.resume?.id,
      coverLetterId: coverLetterId ? Number(coverLetterId) : undefined,
      portfolioId: portfolioId ? Number(portfolioId) : undefined,
      desiredEmployerLink: desiredEmployerLink || undefined,
      note: note || undefined,
    });
  };

  if (docsLoading) {
    return <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-1.5"><Link2 size={14} /> 새 매칭자료 등록</p>

          <div className="text-xs text-muted-foreground">
            이력서: {docs?.resume ? <span className="text-foreground font-medium">현재 등록된 이력서 자동 연결</span> : "등록된 이력서 없음"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">자기소개서</Label>
              <Select value={coverLetterId} onValueChange={setCoverLetterId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="선택 안 함" /></SelectTrigger>
                <SelectContent>
                  {(docs?.coverLetters ?? []).map((cl: any) => (
                    <SelectItem key={cl.id} value={String(cl.id)}>{cl.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">랜딩페이지 (포트폴리오)</Label>
              <Select value={portfolioId} onValueChange={setPortfolioId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="선택 안 함" /></SelectTrigger>
                <SelectContent>
                  {(docs?.portfolios ?? []).map((pf: any) => (
                    <SelectItem key={pf.id} value={String(pf.id)}>{pf.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">희망 취업처 링크</Label>
            <Input
              className="mt-1"
              value={desiredEmployerLink}
              onChange={(e) => setDesiredEmployerLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label className="text-xs">메모 (선택)</Label>
            <Textarea className="mt-1" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="학생에게 전달할 메모" />
          </div>

          <Button
            size="sm"
            className="gap-1.5"
            disabled={create.isPending || (!coverLetterId && !portfolioId && !desiredEmployerLink.trim() && !docs?.resume)}
            onClick={handleCreate}
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 매칭자료 등록
          </Button>
        </CardContent>
      </Card>

      {/* 누적 히스토리 */}
      <div className="space-y-3">
        {recordsLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">등록된 매칭자료가 없습니다.</p>
        ) : (
          records.map((record: any) => <MatchingRecordCard key={record.id} record={record} />)
        )}
      </div>
    </div>
  );
}

function MatchingRecordCard({ record }: { record: any }) {
  const utils = trpc.useUtils();
  const [reply, setReply] = useState("");
  const addComment = trpc.careerMatching.addMatchingComment.useMutation({
    onSuccess: () => {
      utils.careerMatching.getMatchingRecords.invalidate({ studentUserId: record.studentUserId });
      setReply("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          {new Date(record.createdAt).toLocaleString("ko-KR")}
        </p>

        <div className="space-y-1 text-sm">
          {record.resume && <p>📄 이력서: <span className="font-medium">{record.resume.name || "등록된 이력서"}</span></p>}
          {record.coverLetter && <p>📝 자기소개서: <span className="font-medium">{record.coverLetter.title}</span></p>}
          {record.portfolio && (
            <p>
              🌐 랜딩페이지:{" "}
              {record.portfolio.externalUrl ? (
                <a href={record.portfolio.externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  {record.portfolio.title}
                </a>
              ) : (
                <span className="font-medium">{record.portfolio.title}</span>
              )}
            </p>
          )}
          {record.desiredEmployerLink && (
            <p>
              🎯 희망 취업처:{" "}
              <a href={record.desiredEmployerLink} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {record.desiredEmployerLink}
              </a>
            </p>
          )}
          {record.note && <p className="text-muted-foreground italic">💬 {record.note}</p>}
        </div>

        <div className="border-t pt-2 space-y-2">
          {record.comments.length > 0 && (
            <div className="space-y-2">
              {record.comments.map((c: any) => (
                <div key={c.id} className="flex items-start gap-2 text-xs">
                  <Badge variant={c.authorRole === "admin" ? "default" : "secondary"} className="shrink-0">
                    {c.authorRole === "admin" ? "학과장" : "학생"}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p>{c.content}</p>
                    <p className="text-muted-foreground mt-0.5">{new Date(c.createdAt).toLocaleString("ko-KR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="답글 남기기"
              className="text-sm"
              onKeyDown={(e) => { if (e.key === "Enter" && reply.trim()) addComment.mutate({ recordId: record.id, content: reply }); }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={addComment.isPending || !reply.trim()}
              onClick={() => addComment.mutate({ recordId: record.id, content: reply })}
            >
              <MessageSquare size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CareerGuidance() {
  const { data: users = [] } = trpc.user.adminGetUsers.useQuery({ role: "student" });
  const students = (users as StudentItem[]).filter((u: any) => u.role === "student");
  const { data: surveys = [] } = trpc.aiAgent.adminGetSurveys.useQuery();

  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [careerTrack, setCareerTrack] = useState<CareerTrack>("undecided");
  const [guidanceNote, setGuidanceNote] = useState("");
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [aiRecommendations, setAiRecommendations] = useState<
    { companyName: string; jobTitle: string; reason: string; matchScore: number }[]
  >([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [guidanceDocs, setGuidanceDocs] = useState<{ name: string; url: string }[]>([]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [guidanceUrl, setGuidanceUrl] = useState<string | null>(null);
  const [guidanceContent, setGuidanceContent] = useState("");
  const [guidanceLoading, setGuidanceLoading] = useState(false);

  useEffect(() => {
    if (!guidanceUrl) return;
    setGuidanceLoading(true);
    setGuidanceContent("");
    fetch(guidanceUrl)
      .then((r) => { if (!r.ok) throw new Error("파일 없음"); return r.text(); })
      .then(setGuidanceContent)
      .catch(() => setGuidanceContent("파일을 불러올 수 없습니다. (비공개 저장소이거나 링크가 잘못되었을 수 있어요)"))
      .finally(() => setGuidanceLoading(false));
  }, [guidanceUrl]);

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
    setGuidanceDocs([]);
    setGuidanceUrl(null);
    setChecklist(DEFAULT_CHECKLIST);
    setAiRecommendations([]);
  };

  // guidance 데이터가 로드되면 폼에 자동 반영 (수동 클릭 없이도 기존 저장 내용을 덮어쓰지 않도록)
  useEffect(() => {
    if (!selectedStudent || !guidance) return;
    setCareerTrack((guidance.careerTrack as CareerTrack) ?? "undecided");
    setGuidanceNote(guidance.guidanceNote ?? "");
    setGuidanceDocs((guidance.guidanceDocs as typeof guidanceDocs) ?? []);
    setChecklist((guidance.checklist as typeof DEFAULT_CHECKLIST) ?? DEFAULT_CHECKLIST);
    setAiRecommendations((guidance.recommendedCompanies as typeof aiRecommendations) ?? []);
  }, [selectedStudent?.id, guidance]);

  // "저장된 데이터 불러오기" 버튼 (수동 재동기화용으로 유지)
  const handleLoadGuidance = () => {
    if (guidance) {
      setCareerTrack((guidance.careerTrack as CareerTrack) ?? "undecided");
      setGuidanceNote(guidance.guidanceNote ?? "");
      setGuidanceDocs((guidance.guidanceDocs as typeof guidanceDocs) ?? []);
      setChecklist((guidance.checklist as typeof DEFAULT_CHECKLIST) ?? DEFAULT_CHECKLIST);
      setAiRecommendations((guidance.recommendedCompanies as typeof aiRecommendations) ?? []);
    }
  };

  const handleAddGuidanceDoc = () => {
    if (!newDocName.trim() || !newDocUrl.trim()) return;
    setGuidanceDocs((prev) => [...prev, { name: newDocName.trim(), url: newDocUrl.trim() }]);
    setNewDocName("");
    setNewDocUrl("");
  };

  const handleRemoveGuidanceDoc = (idx: number) => {
    setGuidanceDocs((prev) => prev.filter((_, i) => i !== idx));
    setGuidanceUrl(null);
  };

  const handleSave = () => {
    if (!selectedStudent) return;
    saveMutation.mutate({
      studentUserId: selectedStudent.id,
      careerTrack,
      guidanceNote,
      guidanceDocs,
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
    <AppLayout title="진로지도 카드">
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
                        <p className="text-xs text-muted-foreground">
                          연봉: {row.surveyData.desiredSalary || "무관"} | 지역: {row.surveyData.desiredLocation || "무관"} | 취업 가능: {row.surveyData.availability || "미정"}
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
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setDocsOpen(true)}>
                        <FileText className="w-4 h-4 mr-1" /> 서류 수정
                      </Button>
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
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="track">진로 트랙</TabsTrigger>
                      <TabsTrigger value="checklist">체크리스트 ({completedCount}/{checklist.length})</TabsTrigger>
                      <TabsTrigger value="companies">취업처 추천</TabsTrigger>
                      <TabsTrigger value="docs">진로지도 자료</TabsTrigger>
                      <TabsTrigger value="matching">매칭자료</TabsTrigger>
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

                    {/* 진로지도 자료 탭 — DB(career_guidance.guidanceDocs)에 학생별로 등록/관리 */}
                    <TabsContent value="docs" className="mt-4 space-y-3">
                      {/* 새 문서 등록 */}
                      <div className="flex gap-2 items-end p-3 border rounded-lg bg-muted/20">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">문서 이름</Label>
                          <Input
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            placeholder="예: 진로지도, 포트폴리오가이드"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex-[2] space-y-1">
                          <Label className="text-xs">문서 URL</Label>
                          <Input
                            value={newDocUrl}
                            onChange={(e) => setNewDocUrl(e.target.value)}
                            placeholder="https://raw.githubusercontent.com/... 또는 md/html 링크"
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button size="sm" variant="outline" onClick={handleAddGuidanceDoc} className="gap-1">
                          <Plus className="w-3.5 h-3.5" /> 추가
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground px-1">
                        여기서 추가한 문서는 저장 버튼을 눌러야 DB에 반영됩니다. 실명을 코드에 남기지 않기 위해
                        학생별 자료 목록은 소스코드가 아닌 이 화면에서만 등록·관리합니다.
                      </p>

                      {guidanceDocs.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>등록된 진로지도 자료가 없습니다.</p>
                        </div>
                      ) : (
                        <div className="flex gap-3 h-[300px]">
                          {/* 파일 목록 */}
                          <div className="w-48 flex-shrink-0 space-y-1 overflow-y-auto">
                            {guidanceDocs.map((f, idx) => (
                              <div
                                key={`${f.url}-${idx}`}
                                className={`w-full flex items-center gap-1 rounded-lg text-xs ${
                                  guidanceUrl === f.url ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
                                }`}
                              >
                                <button
                                  onClick={() => setGuidanceUrl(f.url)}
                                  className="flex-1 text-left px-3 py-2 flex items-center gap-2 hover:bg-muted rounded-lg"
                                >
                                  <FileText size={12} className="flex-shrink-0" />
                                  {f.name}
                                </button>
                                <button
                                  onClick={() => handleRemoveGuidanceDoc(idx)}
                                  className="p-1.5 text-muted-foreground hover:text-destructive"
                                  title="삭제"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                          {/* 내용 뷰어 */}
                          <div className="flex-1 border rounded-lg overflow-y-auto p-4 bg-muted/30">
                            {!guidanceUrl && (
                              <p className="text-xs text-muted-foreground text-center mt-10">좌측에서 파일을 선택하세요.</p>
                            )}
                            {guidanceLoading && (
                              <div className="flex items-center justify-center mt-10">
                                <Loader2 size={20} className="animate-spin text-primary" />
                              </div>
                            )}
                            {!guidanceLoading && guidanceContent && (
                              <>
                                <div className="flex justify-end mb-2">
                                  <a
                                    href={guidanceUrl ?? "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                                  >
                                    <ExternalLink size={11} /> 원본 링크 열기
                                  </a>
                                </div>
                                <article className="prose prose-xs max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded text-sm">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{guidanceContent}</ReactMarkdown>
                                </article>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* 진로 매칭 자료 탭 */}
                    <TabsContent value="matching" className="mt-4">
                      <MatchingMaterialsTab studentUserId={selectedStudent.id} />
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

              {/* 면담 중 서류 즉시 수정 */}
              <StudentDocumentsDialog
                userId={selectedStudent.id}
                userName={selectedStudent.name}
                open={docsOpen}
                onClose={() => setDocsOpen(false)}
              />
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
    </AppLayout>
  );
}
