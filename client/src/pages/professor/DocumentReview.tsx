import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FileText, User, Globe, CheckCircle2, Clock, XCircle, AlertCircle,
  ChevronRight, Bot, Briefcase, Send, Eye, ExternalLink, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// ─── 승인 단계 설정 ───────────────────────────────────────────────────────────
const STEP_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:      { label: "작성중",   color: "bg-gray-100 text-gray-600",    icon: <AlertCircle className="w-3 h-3" /> },
  submitted:  { label: "제출완료", color: "bg-blue-100 text-blue-700",    icon: <Clock className="w-3 h-3" /> },
  reviewing:  { label: "검토중",   color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3" /> },
  approved:   { label: "승인완료", color: "bg-green-100 text-green-700",  icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:   { label: "반려",     color: "bg-red-100 text-red-700",      icon: <XCircle className="w-3 h-3" /> },
};

function StepBadge({ step }: { step: string }) {
  const cfg = STEP_CONFIG[step] ?? STEP_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── 학생 문서 상세 모달 ──────────────────────────────────────────────────────
function StudentDocumentModal({
  studentUserId,
  studentName,
  open,
  onClose,
}: {
  studentUserId: number;
  studentName: string;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: docs, isLoading } = trpc.resume.adminGetStudentDocuments.useQuery(
    { studentUserId },
    { enabled: open }
  );
  const { data: recData, isLoading: recLoading, refetch: refetchRec } = trpc.resume.adminRecommendForStudent.useQuery(
    { studentUserId },
    { enabled: false }
  );

  const resumeApprovalMut = trpc.resume.adminUpdateResumeApproval.useMutation({
    onSuccess: () => { toast.success("이력서 상태가 변경되었습니다."); utils.resume.adminGetStudentDocuments.invalidate(); utils.resume.adminGetPendingDocuments.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const clApprovalMut = trpc.resume.adminUpdateCoverLetterApproval.useMutation({
    onSuccess: () => { toast.success("자기소개서 상태가 변경되었습니다."); utils.resume.adminGetStudentDocuments.invalidate(); utils.resume.adminGetPendingDocuments.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const pfApprovalMut = trpc.resume.adminUpdatePortfolioApproval.useMutation({
    onSuccess: () => { toast.success("포트폴리오 상태가 변경되었습니다."); utils.resume.adminGetStudentDocuments.invalidate(); utils.resume.adminGetPendingDocuments.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const matchMut = trpc.user.adminMatchJobToStudent.useMutation({
    onSuccess: () => { toast.success("채용공고 매칭이 완료되었습니다."); },
    onError: (e: any) => toast.error(e.message),
  });

  const [approvalNote, setApprovalNote] = useState("");
  const [activeDocTab, setActiveDocTab] = useState("resume");

  const handleResumeApproval = (step: string) => {
    if (!docs?.resume) return;
    resumeApprovalMut.mutate({ resumeId: docs.resume.id, approvalStep: step as any, approvalNote: approvalNote || undefined });
    setApprovalNote("");
  };
  const handleCLApproval = (id: number, step: string) => {
    clApprovalMut.mutate({ coverLetterId: id, approvalStep: step as any, approvalNote: approvalNote || undefined });
    setApprovalNote("");
  };
  const handlePFApproval = (id: number, step: string) => {
    pfApprovalMut.mutate({ portfolioId: id, approvalStep: step as any, approvalNote: approvalNote || undefined });
    setApprovalNote("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> {studentName} 서류 검토
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
        ) : (
          <Tabs value={activeDocTab} onValueChange={setActiveDocTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="resume" className="gap-1 text-xs"><User className="w-3 h-3" /> 이력서</TabsTrigger>
              <TabsTrigger value="coverletter" className="gap-1 text-xs"><FileText className="w-3 h-3" /> 자기소개서</TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-1 text-xs"><Globe className="w-3 h-3" /> 포트폴리오</TabsTrigger>
              <TabsTrigger value="recommend" className="gap-1 text-xs"><Bot className="w-3 h-3" /> AI 추천</TabsTrigger>
            </TabsList>

            {/* 이력서 탭 */}
            <TabsContent value="resume" className="mt-4 space-y-4">
              {!docs?.resume ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>등록된 이력서가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <StepBadge step={docs.resume.approvalStep} />
                    {docs.resume.submittedAt && (
                      <span className="text-xs text-muted-foreground">
                        제출: {format(new Date(docs.resume.submittedAt), "yyyy.MM.dd HH:mm", { locale: ko })}
                      </span>
                    )}
                  </div>

                  {/* 이력서 내용 */}
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {docs.resume.name && <div><span className="text-muted-foreground">이름:</span> {docs.resume.name}</div>}
                        {docs.resume.phone && <div><span className="text-muted-foreground">연락처:</span> {docs.resume.phone}</div>}
                        {docs.resume.email && <div><span className="text-muted-foreground">이메일:</span> {docs.resume.email}</div>}
                        {docs.resume.birthDate && <div><span className="text-muted-foreground">생년월일:</span> {docs.resume.birthDate}</div>}
                      </div>
                      {docs.resume.summary && <p className="text-sm p-2 bg-muted rounded">{docs.resume.summary}</p>}
                      {(docs.resume.skills as string[] | null)?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {(docs.resume.skills as string[]).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      ) : null}
                      {(docs.resume.education as any[] | null)?.length ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">학력</p>
                          {(docs.resume.education as any[]).map((e, i) => (
                            <p key={i} className="text-sm">{e.school} {e.major} ({e.status}) {e.startDate}~{e.endDate}</p>
                          ))}
                        </div>
                      ) : null}
                      {(docs.resume.career as any[] | null)?.length ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">경력</p>
                          {(docs.resume.career as any[]).map((c, i) => (
                            <p key={i} className="text-sm">{c.company} {c.position} ({c.type}) {c.startDate}~{c.endDate}</p>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  {/* 승인 액션 */}
                  {(docs.resume.approvalStep === "submitted" || docs.resume.approvalStep === "reviewing") && (
                    <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                      <Label className="text-xs">메모 (선택)</Label>
                      <Textarea rows={2} placeholder="피드백 메모를 입력하세요..." value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} />
                      <div className="flex gap-2">
                        {docs.resume.approvalStep === "submitted" && (
                          <Button size="sm" variant="outline" onClick={() => handleResumeApproval("reviewing")} disabled={resumeApprovalMut.isPending}>
                            검토 시작
                          </Button>
                        )}
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleResumeApproval("approved")} disabled={resumeApprovalMut.isPending}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> 승인
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleResumeApproval("rejected")} disabled={resumeApprovalMut.isPending}>
                          <XCircle className="w-3 h-3 mr-1" /> 반려
                        </Button>
                      </div>
                    </div>
                  )}
                  {docs.resume.approvalNote && (
                    <p className="text-xs text-muted-foreground">관리자 메모: {docs.resume.approvalNote}</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* 자기소개서 탭 */}
            <TabsContent value="coverletter" className="mt-4 space-y-4">
              {docs?.coverLetters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>등록된 자기소개서가 없습니다.</p>
                </div>
              ) : (
                docs?.coverLetters.map((cl) => (
                  <Card key={cl.id}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{cl.title}</p>
                          <StepBadge step={cl.approvalStep} />
                        </div>
                        {cl.submittedAt && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(cl.submittedAt), "yyyy.MM.dd", { locale: ko })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{cl.content}</p>
                      {(cl.approvalStep === "submitted" || cl.approvalStep === "reviewing") && (
                        <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                          <Textarea rows={2} placeholder="피드백 메모..." value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} />
                          <div className="flex gap-2">
                            {cl.approvalStep === "submitted" && (
                              <Button size="sm" variant="outline" onClick={() => handleCLApproval(cl.id, "reviewing")} disabled={clApprovalMut.isPending}>검토 시작</Button>
                            )}
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleCLApproval(cl.id, "approved")} disabled={clApprovalMut.isPending}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> 승인
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleCLApproval(cl.id, "rejected")} disabled={clApprovalMut.isPending}>
                              <XCircle className="w-3 h-3 mr-1" /> 반려
                            </Button>
                          </div>
                        </div>
                      )}
                      {cl.approvalNote && <p className="text-xs text-muted-foreground">메모: {cl.approvalNote}</p>}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* 포트폴리오 탭 */}
            <TabsContent value="portfolio" className="mt-4 space-y-4">
              {docs?.portfolios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>등록된 포트폴리오가 없습니다.</p>
                </div>
              ) : (
                docs?.portfolios.map((pf) => (
                  <Card key={pf.id}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{pf.title}</p>
                            <Badge variant="outline" className="text-xs">{pf.portfolioType === "pdf" ? "PDF" : "URL"}</Badge>
                          </div>
                          <StepBadge step={pf.approvalStep} />
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {pf.externalUrl && (
                            <a href={pf.externalUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="gap-1 text-xs">
                                <ExternalLink className="w-3 h-3" /> URL
                              </Button>
                            </a>
                          )}
                          {pf.pdfUrl && (
                            <a href={pf.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="gap-1 text-xs">
                                <Eye className="w-3 h-3" /> PDF
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                      {pf.description && <p className="text-sm text-muted-foreground">{pf.description}</p>}
                      {(pf.approvalStep === "submitted" || pf.approvalStep === "reviewing") && (
                        <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                          <Textarea rows={2} placeholder="피드백 메모..." value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} />
                          <div className="flex gap-2">
                            {pf.approvalStep === "submitted" && (
                              <Button size="sm" variant="outline" onClick={() => handlePFApproval(pf.id, "reviewing")} disabled={pfApprovalMut.isPending}>검토 시작</Button>
                            )}
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handlePFApproval(pf.id, "approved")} disabled={pfApprovalMut.isPending}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> 승인
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handlePFApproval(pf.id, "rejected")} disabled={pfApprovalMut.isPending}>
                              <XCircle className="w-3 h-3 mr-1" /> 반려
                            </Button>
                          </div>
                        </div>
                      )}
                      {pf.approvalNote && <p className="text-xs text-muted-foreground">메모: {pf.approvalNote}</p>}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* AI 추천 탭 */}
            <TabsContent value="recommend" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">채용공고 AI 추천</p>
                  <p className="text-sm text-muted-foreground">학생의 기술 스택과 AI 역량 분석을 기반으로 적합한 공고를 추천합니다.</p>
                </div>
                <Button onClick={() => refetchRec()} disabled={recLoading} className="gap-2">
                  {recLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {recLoading ? "분석 중..." : "추천 받기"}
                </Button>
              </div>

              {recData && (
                <>
                  {recData.summary && (
                    <Card className="bg-blue-50/50 border-blue-200">
                      <CardContent className="pt-3 pb-3">
                        <p className="text-sm text-blue-800">{recData.summary}</p>
                      </CardContent>
                    </Card>
                  )}
                  {recData.recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>적합한 채용공고를 찾지 못했습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recData.recommendations.map((rec: any) => (
                        <Card key={rec.posting.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{rec.posting.title}</p>
                                  {rec.matchScore && (
                                    <Badge className="bg-green-100 text-green-700 text-xs">
                                      적합도 {rec.matchScore}%
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{rec.company?.companyName}</p>
                                {rec.matchReason && (
                                  <p className="text-xs text-blue-600 mt-1">{rec.matchReason}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                className="gap-1 shrink-0"
                                onClick={() => {
                                  matchMut.mutate({ studentUserId, jobPostingId: rec.posting.id });
                                }}
                                disabled={matchMut.isPending}
                              >
                                <Send className="w-3 h-3" /> 매칭
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {!recData && !recLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">위 버튼을 클릭하면 AI가 학생에게 적합한 채용공고를 분석합니다.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function ProfessorDocumentReview() {
  const { data: pending, isLoading } = trpc.resume.adminGetPendingDocuments.useQuery();
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; name: string } | null>(null);

  // 제출 대기 문서에서 학생 목록 추출 (중복 제거)
  const studentMap = new Map<number, { id: number; name: string; counts: { resume: number; cl: number; pf: number } }>();

  (pending?.pendingResumes ?? []).forEach((r: any) => {
    const key = r.userId;
    if (!studentMap.has(key)) studentMap.set(key, { id: key, name: `학생 #${key}`, counts: { resume: 0, cl: 0, pf: 0 } });
    studentMap.get(key)!.counts.resume++;
  });
  (pending?.pendingCoverLetters ?? []).forEach((cl: any) => {
    const key = cl.userId;
    if (!studentMap.has(key)) studentMap.set(key, { id: key, name: `학생 #${key}`, counts: { resume: 0, cl: 0, pf: 0 } });
    studentMap.get(key)!.counts.cl++;
  });
  (pending?.pendingPortfolios ?? []).forEach((pf: any) => {
    const key = pf.userId;
    if (!studentMap.has(key)) studentMap.set(key, { id: key, name: `학생 #${key}`, counts: { resume: 0, cl: 0, pf: 0 } });
    studentMap.get(key)!.counts.pf++;
  });

  const pendingStudents = Array.from(studentMap.values());
  const totalPending = (pending?.pendingResumes.length ?? 0) + (pending?.pendingCoverLetters.length ?? 0) + (pending?.pendingPortfolios.length ?? 0);

  return (
    <AppLayout title="서류 검토">
      <div className="p-6 space-y-6 max-w-4xl">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" /> 서류 검토 센터
          </h1>
          <p className="text-muted-foreground mt-1">
            교육생이 제출한 이력서·자기소개서·포트폴리오를 검토하고 승인하세요.
            승인된 서류는 채용공고 매칭에 활용됩니다.
          </p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "이력서 검토 대기", count: pending?.pendingResumes.length ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "자기소개서 검토 대기", count: pending?.pendingCoverLetters.length ?? 0, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "포트폴리오 검토 대기", count: pending?.pendingPortfolios.length ?? 0, color: "text-orange-600", bg: "bg-orange-50" },
          ].map((item) => (
            <Card key={item.label} className={`${item.bg} border-0`}>
              <CardContent className="pt-4 pb-3">
                <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 검토 대기 학생 목록 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">검토 대기 학생</CardTitle>
              {totalPending > 0 && (
                <Badge className="bg-red-100 text-red-700">{totalPending}건 대기</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin w-6 h-6 text-primary" /></div>
            ) : pendingStudents.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p className="font-medium text-green-600">검토 대기 서류가 없습니다.</p>
                <p className="text-sm mt-1">모든 서류가 처리되었습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingStudents.map((s) => (
                  <button
                    key={s.id}
                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors text-left"
                    onClick={() => setSelectedStudent({ id: s.id, name: s.name })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <div className="flex gap-2 mt-0.5">
                          {s.counts.resume > 0 && <span className="text-xs text-blue-600">이력서 {s.counts.resume}</span>}
                          {s.counts.cl > 0 && <span className="text-xs text-purple-600">자기소개서 {s.counts.cl}</span>}
                          {s.counts.pf > 0 && <span className="text-xs text-orange-600">포트폴리오 {s.counts.pf}</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 전체 학생 서류 조회 안내 */}
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm font-medium text-indigo-800">특정 학생 서류를 직접 조회하려면?</p>
            <p className="text-xs text-indigo-600 mt-1">
              <strong>학생 관리</strong> 메뉴에서 학생을 선택한 후 서류 검토 버튼을 클릭하거나,
              위 대기 목록에서 학생을 클릭하여 이력서·자기소개서·포트폴리오를 확인하고 채용공고를 추천·매칭할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 학생 문서 상세 모달 */}
      {selectedStudent && (
        <StudentDocumentModal
          studentUserId={selectedStudent.id}
          studentName={selectedStudent.name}
          open={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </AppLayout>
  );
}
