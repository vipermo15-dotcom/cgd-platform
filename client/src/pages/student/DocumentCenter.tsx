import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText, User, Briefcase, Award, Globe, Plus, Trash2,
  CheckCircle2, Clock, XCircle, Send, AlertCircle, Upload, Link
} from "lucide-react";

// ─── 승인 단계 배지 ──────────────────────────────────────────────────────────
const STEP_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:      { label: "작성중",   color: "bg-gray-100 text-gray-600",    icon: <AlertCircle className="w-3 h-3" /> },
  submitted:  { label: "제출완료", color: "bg-blue-100 text-blue-700",    icon: <Clock className="w-3 h-3" /> },
  reviewing:  { label: "검토중",   color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3" /> },
  approved:   { label: "승인완료", color: "bg-green-100 text-green-700",  icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:   { label: "반려",     color: "bg-red-100 text-red-700",      icon: <XCircle className="w-3 h-3" /> },
};

function ApprovalBadge({ step, note }: { step: string; note?: string | null }) {
  const cfg = STEP_CONFIG[step] ?? STEP_CONFIG.draft;
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
        {cfg.icon} {cfg.label}
      </span>
      {note && <p className="text-xs text-muted-foreground pl-1">메모: {note}</p>}
    </div>
  );
}

// ─── 진행 단계 스텝퍼 ────────────────────────────────────────────────────────
const STEPS = ["draft", "submitted", "reviewing", "approved"];
function ApprovalStepper({ current }: { current: string }) {
  const isRejected = current === "rejected";
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STEPS.map((step, i) => {
        const cfg = STEP_CONFIG[step];
        const idx = STEPS.indexOf(current);
        const active = i <= idx && !isRejected;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              active ? cfg.color : "bg-gray-50 text-gray-400"
            }`}>
              {cfg.icon} {cfg.label}
            </div>
            {i < STEPS.length - 1 && <div className={`w-4 h-px ${active && i < idx ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        );
      })}
      {isRejected && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STEP_CONFIG.rejected.color}`}>
          {STEP_CONFIG.rejected.icon} 반려
        </div>
      )}
    </div>
  );
}

// ─── 이력서 탭 ───────────────────────────────────────────────────────────────
function ResumeTab() {
  const { data: resume, refetch } = trpc.resume.getMyResume.useQuery();
  const saveMut = trpc.resume.saveResume.useMutation({
    onSuccess: () => { toast.success("이력서가 저장되었습니다."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const submitMut = trpc.resume.submitResume.useMutation({
    onSuccess: () => { toast.success("이력서를 제출했습니다. 검토를 기다려주세요."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: resume?.name ?? "",
    birthDate: resume?.birthDate ?? "",
    address: resume?.address ?? "",
    phone: resume?.phone ?? "",
    email: resume?.email ?? "",
    summary: resume?.summary ?? "",
    skills: (resume?.skills ?? []).join(", "),
  });

  const [education, setEducation] = useState<{ school: string; major: string; startDate: string; endDate: string; status: string }[]>(
    (resume?.education as any[]) ?? []
  );
  const [career, setCareer] = useState<{ company: string; position: string; startDate: string; endDate: string; type: string; description: string }[]>(
    (resume?.career as any[]) ?? []
  );
  const [certs, setCerts] = useState<{ name: string; issuer: string; date: string }[]>(
    (resume?.certificates as any[]) ?? []
  );

  const handleSave = () => {
    saveMut.mutate({
      ...form,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      education,
      career,
      certificates: certs,
    });
  };

  const canSubmit = !resume || resume.approvalStep === "draft" || resume.approvalStep === "rejected";

  return (
    <div className="space-y-6">
      {/* 승인 상태 */}
      {resume && (
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">이력서 진행 현황</p>
              <ApprovalStepper current={resume.approvalStep} />
              {resume.approvalNote && (
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium">관리자 메모:</span> {resume.approvalNote}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기본 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> 기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "이름", key: "name" },
            { label: "생년월일", key: "birthDate", placeholder: "YYYY-MM-DD" },
            { label: "연락처", key: "phone" },
            { label: "이메일", key: "email" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label>{label}</Label>
              <Input
                placeholder={placeholder ?? label}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="sm:col-span-2 space-y-1">
            <Label>주소</Label>
            <Input placeholder="주소" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label>자기소개 (한 줄)</Label>
            <Textarea rows={2} placeholder="간략한 자기소개를 입력하세요" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label>보유 기술 (쉼표로 구분)</Label>
            <Input placeholder="예: Photoshop, Illustrator, Figma" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {/* 학력 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4" /> 학력</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setEducation((e) => [...e, { school: "", major: "", startDate: "", endDate: "", status: "졸업" }])}>
              <Plus className="w-3 h-3 mr-1" /> 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {education.length === 0 && <p className="text-sm text-muted-foreground">학력을 추가해주세요.</p>}
          {education.map((edu, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg relative">
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setEducation((e) => e.filter((_, j) => j !== i))}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <Input placeholder="학교명" value={edu.school} onChange={(e) => setEducation((arr) => arr.map((x, j) => j === i ? { ...x, school: e.target.value } : x))} />
              <Input placeholder="전공" value={edu.major} onChange={(e) => setEducation((arr) => arr.map((x, j) => j === i ? { ...x, major: e.target.value } : x))} />
              <Select value={edu.status} onValueChange={(v) => setEducation((arr) => arr.map((x, j) => j === i ? { ...x, status: v } : x))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["재학", "졸업", "중퇴", "수료"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="입학일 (YYYY-MM)" value={edu.startDate} onChange={(e) => setEducation((arr) => arr.map((x, j) => j === i ? { ...x, startDate: e.target.value } : x))} />
              <Input placeholder="졸업일 (YYYY-MM)" value={edu.endDate} onChange={(e) => setEducation((arr) => arr.map((x, j) => j === i ? { ...x, endDate: e.target.value } : x))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 경력 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4" /> 경력</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setCareer((c) => [...c, { company: "", position: "", startDate: "", endDate: "", type: "정규직", description: "" }])}>
              <Plus className="w-3 h-3 mr-1" /> 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {career.length === 0 && <p className="text-sm text-muted-foreground">경력을 추가해주세요. (신입의 경우 생략 가능)</p>}
          {career.map((c, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg relative">
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setCareer((arr) => arr.filter((_, j) => j !== i))}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <Input placeholder="회사명" value={c.company} onChange={(e) => setCareer((arr) => arr.map((x, j) => j === i ? { ...x, company: e.target.value } : x))} />
              <Input placeholder="직책/직무" value={c.position} onChange={(e) => setCareer((arr) => arr.map((x, j) => j === i ? { ...x, position: e.target.value } : x))} />
              <Select value={c.type} onValueChange={(v) => setCareer((arr) => arr.map((x, j) => j === i ? { ...x, type: v } : x))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["정규직", "계약직", "인턴", "아르바이트", "프리랜서"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="시작일 (YYYY-MM)" value={c.startDate} onChange={(e) => setCareer((arr) => arr.map((x, j) => j === i ? { ...x, startDate: e.target.value } : x))} />
              <Input placeholder="종료일 (YYYY-MM)" value={c.endDate} onChange={(e) => setCareer((arr) => arr.map((x, j) => j === i ? { ...x, endDate: e.target.value } : x))} />
              <Input placeholder="업무 내용" value={c.description} className="sm:col-span-3" onChange={(e) => setCareer((arr) => arr.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 자격증 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4" /> 자격증</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setCerts((c) => [...c, { name: "", issuer: "", date: "" }])}>
              <Plus className="w-3 h-3 mr-1" /> 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {certs.length === 0 && <p className="text-sm text-muted-foreground">자격증을 추가해주세요.</p>}
          {certs.map((cert, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 p-3 border rounded-lg relative">
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => setCerts((arr) => arr.filter((_, j) => j !== i))}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <Input placeholder="자격증명" value={cert.name} onChange={(e) => setCerts((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
              <Input placeholder="발급기관" value={cert.issuer} onChange={(e) => setCerts((arr) => arr.map((x, j) => j === i ? { ...x, issuer: e.target.value } : x))} />
              <Input placeholder="취득일 (YYYY-MM)" value={cert.date} onChange={(e) => setCerts((arr) => arr.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleSave} disabled={saveMut.isPending}>
          {saveMut.isPending ? "저장 중..." : "임시 저장"}
        </Button>
        <Button onClick={() => { handleSave(); }} disabled={saveMut.isPending || !canSubmit} className="gap-2">
          <Send className="w-4 h-4" /> 검토 제출
        </Button>
      </div>
      {!canSubmit && (
        <p className="text-xs text-muted-foreground text-right">이미 제출된 이력서입니다. 반려 후 재제출이 가능합니다.</p>
      )}
    </div>
  );
}

// ─── 자기소개서 탭 ────────────────────────────────────────────────────────────
function CoverLetterTab() {
  const { data: list, refetch } = trpc.resume.getMyCoverLetters.useQuery();
  const saveMut = trpc.resume.saveCoverLetter.useMutation({
    onSuccess: () => { toast.success("자기소개서가 저장되었습니다."); refetch(); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });
  const submitMut = trpc.resume.submitCoverLetter.useMutation({
    onSuccess: () => { toast.success("자기소개서를 제출했습니다."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.resume.deleteCoverLetter.useMutation({
    onSuccess: () => { toast.success("삭제되었습니다."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [editing, setEditing] = useState<{ id?: number; title: string; content: string; pdfUrl?: string } | null>(null);
  const [clUploading, setClUploading] = useState(false);

  const handleClFileUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) { toast.error("파일 크기는 50MB 이하여야 합니다."); return; }
    setClUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setEditing((f) => f ? { ...f, pdfUrl: url } : null);
      toast.success("PDF가 업로드되었습니다.");
    } catch {
      toast.error("파일 업로드에 실패했습니다.");
    } finally {
      setClUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ title: "", content: "", pdfUrl: "" })} className="gap-2">
          <Plus className="w-4 h-4" /> 자기소개서 작성
        </Button>
      </div>

      {/* 편집 폼 */}
      {editing && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editing.id ? "자기소개서 수정" : "새 자기소개서"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>제목</Label>
              <Input placeholder="예: OO기업 디자이너 지원 자기소개서" value={editing.title} onChange={(e) => setEditing((f) => f ? { ...f, title: e.target.value } : null)} />
            </div>
            <div className="space-y-1">
              <Label>내용</Label>
              <Textarea rows={12} placeholder="자기소개서 내용을 입력하세요..." value={editing.content} onChange={(e) => setEditing((f) => f ? { ...f, content: e.target.value } : null)} />
            </div>
            <div className="space-y-1">
              <Label>PDF 첨부 (선택)</Label>
              {editing.pdfUrl ? (
                <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 flex-1">업로드 완료</span>
                  <Button size="sm" variant="ghost" onClick={() => setEditing((f) => f ? { ...f, pdfUrl: "" } : null)}>변경</Button>
                </div>
              ) : (
                <label className="flex items-center gap-3 border border-dashed rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{clUploading ? "업로드 중..." : "PDF · DOC · DOCX 첨부 (최대 50MB)"}</span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={clUploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleClFileUpload(f); }} />
                </label>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>취소</Button>
              <Button onClick={() => saveMut.mutate({ id: editing.id, title: editing.title, content: editing.content, pdfUrl: editing.pdfUrl })} disabled={saveMut.isPending}>
                {saveMut.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 목록 */}
      {(list ?? []).length === 0 && !editing && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>작성된 자기소개서가 없습니다.</p>
        </div>
      )}
      {(list ?? []).map((cl) => (
        <Card key={cl.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{cl.title}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cl.content}</p>
                <div className="mt-2">
                  <ApprovalStepper current={cl.approvalStep} />
                  {cl.approvalNote && <p className="text-xs text-muted-foreground mt-1">관리자 메모: {cl.approvalNote}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {(cl.approvalStep === "draft" || cl.approvalStep === "rejected") && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditing({ id: cl.id, title: cl.title ?? "", content: cl.content })}>수정</Button>
                    <Button size="sm" onClick={() => submitMut.mutate({ id: cl.id })} disabled={submitMut.isPending} className="gap-1">
                      <Send className="w-3 h-3" /> 제출
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate({ id: cl.id })}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── 포트폴리오 탭 ────────────────────────────────────────────────────────────
function PortfolioTab() {
  const { data: list, refetch } = trpc.resume.getMyPortfolios.useQuery();
  const saveMut = trpc.resume.savePortfolioLink.useMutation({
    onSuccess: () => { toast.success("포트폴리오가 저장되었습니다."); refetch(); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });
  const submitMut = trpc.resume.submitPortfolio.useMutation({
    onSuccess: () => { toast.success("포트폴리오를 제출했습니다."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [editing, setEditing] = useState<{
    id?: number;
    title: string;
    description: string;
    portfolioType: "pdf" | "url";
    pdfUrl: string;
    externalUrl: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) { toast.error("파일 크기는 50MB 이하여야 합니다."); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("업로드 실패");
      const { url } = await res.json();
      setEditing((f) => f ? { ...f, pdfUrl: url } : null);
      toast.success("PDF가 업로드되었습니다.");
    } catch {
      toast.error("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ title: "", description: "", portfolioType: "url", pdfUrl: "", externalUrl: "" })} className="gap-2">
          <Plus className="w-4 h-4" /> 포트폴리오 추가
        </Button>
      </div>

      {/* 편집 폼 */}
      {editing && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editing.id ? "포트폴리오 수정" : "포트폴리오 등록"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>제목</Label>
              <Input placeholder="포트폴리오 제목" value={editing.title} onChange={(e) => setEditing((f) => f ? { ...f, title: e.target.value } : null)} />
            </div>
            <div className="space-y-1">
              <Label>설명 (선택)</Label>
              <Textarea rows={2} placeholder="간략한 설명" value={editing.description} onChange={(e) => setEditing((f) => f ? { ...f, description: e.target.value } : null)} />
            </div>
            <div className="space-y-2">
              <Label>등록 방식</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={editing.portfolioType === "url" ? "default" : "outline"}
                  onClick={() => setEditing((f) => f ? { ...f, portfolioType: "url" } : null)}
                  className="gap-1"
                >
                  <Link className="w-3 h-3" /> URL 링크
                </Button>
                <Button
                  size="sm"
                  variant={editing.portfolioType === "pdf" ? "default" : "outline"}
                  onClick={() => setEditing((f) => f ? { ...f, portfolioType: "pdf" } : null)}
                  className="gap-1"
                >
                  <Upload className="w-3 h-3" /> PDF 업로드
                </Button>
              </div>
            </div>

            {editing.portfolioType === "url" && (
              <div className="space-y-1">
                <Label>포트폴리오 URL</Label>
                <Input
                  placeholder="https://notion.so/... 또는 https://behance.net/..."
                  value={editing.externalUrl}
                  onChange={(e) => setEditing((f) => f ? { ...f, externalUrl: e.target.value } : null)}
                />
                <p className="text-xs text-muted-foreground">Notion, Behance, Figma, GitHub 등 외부 링크를 입력하세요.</p>
              </div>
            )}

            {editing.portfolioType === "pdf" && (
              <div className="space-y-2">
                <Label>PDF 파일</Label>
                {editing.pdfUrl ? (
                  <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 truncate flex-1">업로드 완료</span>
                    <Button size="sm" variant="ghost" onClick={() => setEditing((f) => f ? { ...f, pdfUrl: "" } : null)}>변경</Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/30 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">{uploading ? "업로드 중..." : "PDF 파일을 클릭하여 선택 (최대 50MB)"}</span>
                    <input type="file" accept=".pdf" className="hidden" disabled={uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  </label>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>취소</Button>
              <Button
                onClick={() => saveMut.mutate({
                  id: editing.id,
                  title: editing.title,
                  description: editing.description,
                  portfolioType: editing.portfolioType,
                  pdfUrl: editing.pdfUrl || undefined,
                  externalUrl: editing.externalUrl || undefined,
                })}
                disabled={saveMut.isPending}
              >
                {saveMut.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 목록 */}
      {(list ?? []).length === 0 && !editing && (
        <div className="text-center py-12 text-muted-foreground">
          <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>등록된 포트폴리오가 없습니다.</p>
        </div>
      )}
      {(list ?? []).map((p) => (
        <Card key={p.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{p.title}</p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {p.portfolioType === "pdf" ? "PDF" : p.portfolioType === "url" ? "URL" : "작품집"}
                  </Badge>
                </div>
                {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                {p.externalUrl && (
                  <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block truncate">
                    {p.externalUrl}
                  </a>
                )}
                {p.pdfUrl && (
                  <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                    PDF 보기
                  </a>
                )}
                <div className="mt-2">
                  <ApprovalStepper current={p.approvalStep} />
                  {p.approvalNote && <p className="text-xs text-muted-foreground mt-1">관리자 메모: {p.approvalNote}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {(p.approvalStep === "draft" || p.approvalStep === "rejected") && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditing({
                      id: p.id,
                      title: p.title,
                      description: p.description ?? "",
                      portfolioType: (p.portfolioType as "pdf" | "url") ?? "url",
                      pdfUrl: p.pdfUrl ?? "",
                      externalUrl: p.externalUrl ?? "",
                    })}>수정</Button>
                    <Button size="sm" onClick={() => submitMut.mutate({ id: p.id })} disabled={submitMut.isPending} className="gap-1">
                      <Send className="w-3 h-3" /> 제출
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function DocumentCenter() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" /> 서류 등록 센터
        </h1>
        <p className="text-muted-foreground mt-1">
          이력서·자기소개서·포트폴리오를 등록하고 학과장 검토를 요청하세요.
          승인된 서류는 채용공고 지원 및 매칭에 활용됩니다.
        </p>
      </div>

      {/* 진행 안내 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-4 pb-3">
          <p className="text-sm font-medium text-blue-800 mb-2">서류 등록 → 제출 → 검토 → 승인 → 채용 매칭</p>
          <div className="flex flex-wrap gap-2 text-xs text-blue-700">
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 작성중: 임시저장 상태</span>
            <span>→</span>
            <span className="flex items-center gap-1"><Send className="w-3 h-3" /> 제출완료: 검토 요청됨</span>
            <span>→</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 검토중: 학과장 확인 중</span>
            <span>→</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 승인완료: 채용 매칭 가능</span>
          </div>
        </CardContent>
      </Card>

      {/* 탭 */}
      <Tabs defaultValue="resume">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resume" className="gap-1"><User className="w-3 h-3" /> 이력서</TabsTrigger>
          <TabsTrigger value="coverletter" className="gap-1"><FileText className="w-3 h-3" /> 자기소개서</TabsTrigger>
          <TabsTrigger value="portfolio" className="gap-1"><Globe className="w-3 h-3" /> 포트폴리오</TabsTrigger>
        </TabsList>
        <TabsContent value="resume" className="mt-4"><ResumeTab /></TabsContent>
        <TabsContent value="coverletter" className="mt-4"><CoverLetterTab /></TabsContent>
        <TabsContent value="portfolio" className="mt-4"><PortfolioTab /></TabsContent>
      </Tabs>
    </div>
  );
}
