import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, FileText, FolderOpen, FileSignature, UserCog, X, Plus, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// ─── 이력서 편집 (기본정보 + 요약) ────────────────────────────────────────────
function ResumeEditor({ userId, resume }: { userId: number; resume: any }) {
  const utils = trpc.useUtils();
  const [f, setF] = useState({ name: "", birthDate: "", address: "", phone: "", email: "", summary: "" });

  useEffect(() => {
    setF({
      name: resume?.name ?? "", birthDate: resume?.birthDate ?? "", address: resume?.address ?? "",
      phone: resume?.phone ?? "", email: resume?.email ?? "", summary: resume?.summary ?? "",
    });
  }, [resume]);

  const save = trpc.resume.adminUpdateStudentResume.useMutation({
    onSuccess: () => { utils.resume.adminGetStudentDocuments.invalidate(); toast.success("이력서가 수정되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">이름</Label><Input value={f.name} onChange={set("name")} className="mt-1" /></div>
        <div><Label className="text-xs">생년월일</Label><Input value={f.birthDate} onChange={set("birthDate")} className="mt-1" placeholder="2001.01.01" /></div>
        <div><Label className="text-xs">연락처</Label><Input value={f.phone} onChange={set("phone")} className="mt-1" /></div>
        <div><Label className="text-xs">이메일</Label><Input value={f.email} onChange={set("email")} className="mt-1" /></div>
      </div>
      <div><Label className="text-xs">주소</Label><Input value={f.address} onChange={set("address")} className="mt-1" /></div>
      <div><Label className="text-xs">자기소개 요약</Label><Textarea value={f.summary} onChange={set("summary")} rows={4} className="mt-1" /></div>
      <p className="text-xs text-muted-foreground">※ 학력·경력 등 상세 항목은 교육생 본인이 '서류 등록 센터'에서 관리합니다.</p>
      <Button size="sm" className="gap-1.5" disabled={save.isPending} onClick={() => save.mutate({ userId, ...f })}>
        {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 이력서 저장
      </Button>
    </div>
  );
}

// ─── 공통: 파일 업로드 (PDF 등) ────────────────────────────────────────────────
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("파일 업로드에 실패했습니다.");
  const data = await res.json();
  return data.url as string;
}

// ─── 자기소개서 1건 편집 ──────────────────────────────────────────────────────
function CoverLetterItem({ cl }: { cl: any }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(cl.title ?? "");
  const [content, setContent] = useState(cl.content ?? "");
  const [pdfUrl, setPdfUrl] = useState(cl.pdfUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const save = trpc.resume.adminUpdateStudentCoverLetter.useMutation({
    onSuccess: () => { utils.resume.adminGetStudentDocuments.invalidate(); toast.success("자기소개서가 수정되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      setPdfUrl(await uploadFile(file));
    } catch (e: any) {
      toast.error(e.message ?? "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="font-medium" />
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
      <label className="flex items-center gap-2 rounded-md border border-dashed p-2 cursor-pointer text-sm">
        <Upload size={14} className="text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">
          {uploading ? "업로드 중..." : pdfUrl ? "첨부 파일 교체 (PDF·DOC·DOCX)" : "PDF · DOC · DOCX 첨부 (선택, 최대 50MB)"}
        </span>
        <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      </label>
      {pdfUrl && (
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline block">
          첨부된 파일 보기
        </a>
      )}
      <Button size="sm" variant="outline" className="gap-1.5" disabled={save.isPending} onClick={() => save.mutate({ id: cl.id, title, content, pdfUrl })}>
        {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 저장
      </Button>
    </div>
  );
}

// ─── 자기소개서 신규 등록 ──────────────────────────────────────────────────────
function NewCoverLetterForm({ userId, onDone }: { userId: number; onDone: () => void }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const create = trpc.resume.adminCreateStudentCoverLetter.useMutation({
    onSuccess: () => {
      utils.resume.adminGetStudentDocuments.invalidate();
      toast.success("자기소개서가 등록되었습니다.");
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      setPdfUrl(await uploadFile(file));
    } catch (e: any) {
      toast.error(e.message ?? "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="font-medium" />
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="내용을 입력하세요" />
      <label className="flex items-center gap-2 rounded-md border border-dashed p-2 cursor-pointer text-sm">
        <Upload size={14} className="text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">
          {uploading ? "업로드 중..." : pdfUrl ? "첨부됨 — 교체하려면 클릭" : "PDF · DOC · DOCX 첨부 (선택, 최대 50MB)"}
        </span>
        <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      </label>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={create.isPending || !title.trim() || !content.trim()}
          onClick={() => create.mutate({ userId, title, content, pdfUrl: pdfUrl || undefined })}
        >
          {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 등록
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>취소</Button>
      </div>
    </div>
  );
}

// ─── 포트폴리오 1건 편집 ──────────────────────────────────────────────────────
function PortfolioItem({ pf }: { pf: any }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(pf.title ?? "");
  const [description, setDescription] = useState(pf.description ?? "");
  const [externalUrl, setExternalUrl] = useState(pf.externalUrl ?? "");
  const [pdfUrl, setPdfUrl] = useState(pf.pdfUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const save = trpc.resume.adminUpdateStudentPortfolio.useMutation({
    onSuccess: () => { utils.resume.adminGetStudentDocuments.invalidate(); toast.success("포트폴리오가 수정되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      setPdfUrl(await uploadFile(file));
    } catch (e: any) {
      toast.error(e.message ?? "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="font-medium" />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="설명" />
      <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="외부 URL (선택)" />
      <label className="flex items-center gap-2 rounded-md border border-dashed p-2 cursor-pointer text-sm">
        <Upload size={14} className="text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">
          {uploading ? "업로드 중..." : pdfUrl ? "첨부 파일 교체 (PDF)" : "PDF 첨부 (선택, 최대 50MB)"}
        </span>
        <input type="file" accept=".pdf" className="hidden" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      </label>
      {pdfUrl && (
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline block">
          첨부된 파일 보기
        </a>
      )}
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={save.isPending}
        onClick={() => save.mutate({ id: pf.id, title, description, externalUrl, pdfUrl, portfolioType: pdfUrl ? "pdf" : "url" })}
      >
        {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 저장
      </Button>
    </div>
  );
}

// ─── 포트폴리오 신규 등록 ──────────────────────────────────────────────────────
function NewPortfolioForm({ userId, onDone }: { userId: number; onDone: () => void }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const create = trpc.resume.adminCreateStudentPortfolio.useMutation({
    onSuccess: () => {
      utils.resume.adminGetStudentDocuments.invalidate();
      toast.success("포트폴리오가 등록되었습니다.");
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      setPdfUrl(await uploadFile(file));
    } catch (e: any) {
      toast.error(e.message ?? "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="font-medium" />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="설명" />
      <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="외부 URL (선택 — 랜딩페이지 링크 등)" />
      <label className="flex items-center gap-2 rounded-md border border-dashed p-2 cursor-pointer text-sm">
        <Upload size={14} className="text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">
          {uploading ? "업로드 중..." : pdfUrl ? "첨부됨 — 교체하려면 클릭" : "PDF 첨부 (선택, 최대 50MB)"}
        </span>
        <input type="file" accept=".pdf" className="hidden" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      </label>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={create.isPending || !title.trim() || (!externalUrl.trim() && !pdfUrl)}
          onClick={() => create.mutate({
            userId, title, description: description || undefined,
            portfolioType: pdfUrl ? "pdf" : "url",
            pdfUrl: pdfUrl || undefined,
            externalUrl: externalUrl || undefined,
          })}
        >
          {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 등록
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>취소</Button>
      </div>
    </div>
  );
}

// ─── 교육생 프로필 편집 ────────────────────────────────────────────────────────
const EMPLOYMENT_OPTIONS = [
  { value: "미시작", label: "미시작" },
  { value: "준비중", label: "준비중" },
  { value: "지원중", label: "지원중" },
  { value: "취업확정", label: "취업확정" },
] as const;

function ProfileEditor({ userId }: { userId: number }) {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.user.getStudentProfile.useQuery(undefined, {
    // getStudentProfile은 본인용이라 userId 파라미터가 없음 → adminGetUsers 데이터에서 가져옴
    // 대신 adminGetStudentDocuments와 함께 로드되는 방식으로 처리
    enabled: false,
  });

  const [f, setF] = useState({
    studentId: "",
    major: "",
    phone: "",
    bio: "",
    skills: [] as string[],
    certificates: [] as string[],
    employmentStatus: "미시작" as "미시작" | "준비중" | "지원중" | "취업확정",
    employedCompany: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [loaded, setLoaded] = useState(false);

  // 서버에서 프로필 직접 조회
  const { data: profileData, isLoading: profileLoading } = trpc.user.adminGetStudentProfile.useQuery(
    { userId },
    { enabled: userId > 0 }
  );

  useEffect(() => {
    if (profileData && !loaded) {
      setF({
        studentId: profileData.studentId ?? "",
        major: profileData.major ?? "",
        phone: profileData.phone ?? "",
        bio: profileData.bio ?? "",
        skills: (profileData.skills as string[]) ?? [],
        certificates: (profileData.certificates as string[]) ?? [],
        employmentStatus: (profileData.employmentStatus as typeof f.employmentStatus) ?? "미시작",
        employedCompany: profileData.employedCompany ?? "",
      });
      setLoaded(true);
    }
  }, [profileData, loaded]);

  const save = trpc.user.adminUpdateStudentProfile.useMutation({
    onSuccess: () => {
      utils.user.adminGetStudentProfile.invalidate({ userId });
      toast.success("프로필이 수정되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v || f.skills.includes(v)) return;
    setF({ ...f, skills: [...f.skills, v] });
    setSkillInput("");
  };
  const removeSkill = (s: string) => setF({ ...f, skills: f.skills.filter((x) => x !== s) });

  const addCert = () => {
    const v = certInput.trim();
    if (!v || f.certificates.includes(v)) return;
    setF({ ...f, certificates: [...f.certificates, v] });
    setCertInput("");
  };
  const removeCert = (c: string) => setF({ ...f, certificates: f.certificates.filter((x) => x !== c) });

  if (profileLoading) return <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">학번</Label>
          <Input value={f.studentId} onChange={(e) => setF({ ...f, studentId: e.target.value })} className="mt-1" placeholder="예) 2024001" />
        </div>
        <div>
          <Label className="text-xs">전공</Label>
          <Input value={f.major} onChange={(e) => setF({ ...f, major: e.target.value })} className="mt-1" placeholder="예) 컴퓨터그래픽디자인과" />
        </div>
        <div>
          <Label className="text-xs">연락처</Label>
          <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="mt-1" placeholder="010-0000-0000" />
        </div>
        <div>
          <Label className="text-xs">취업 상태</Label>
          <Select value={f.employmentStatus} onValueChange={(v) => setF({ ...f, employmentStatus: v as typeof f.employmentStatus })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {f.employmentStatus === "취업확정" && (
        <div>
          <Label className="text-xs">취업 확정 기업명</Label>
          <Input value={f.employedCompany} onChange={(e) => setF({ ...f, employedCompany: e.target.value })} className="mt-1" placeholder="기업명 입력" />
        </div>
      )}

      <div>
        <Label className="text-xs">자기소개 (Bio)</Label>
        <Textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} rows={3} className="mt-1" placeholder="교육생 소개 메모" />
      </div>

      <div>
        <Label className="text-xs">보유 스킬</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            placeholder="스킬 입력 후 Enter 또는 추가"
            className="flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={addSkill} className="gap-1">
            <Plus size={13} /> 추가
          </Button>
        </div>
        {f.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {f.skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="ml-0.5 hover:text-red-500">
                  <X size={11} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">자격증</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCert(); } }}
            placeholder="자격증 입력 후 Enter 또는 추가"
            className="flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={addCert} className="gap-1">
            <Plus size={13} /> 추가
          </Button>
        </div>
        {f.certificates.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {f.certificates.map((c) => (
              <Badge key={c} variant="outline" className="gap-1 pr-1">
                {c}
                <button type="button" onClick={() => removeCert(c)} className="ml-0.5 hover:text-red-500">
                  <X size={11} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button
        size="sm"
        className="gap-1.5"
        disabled={save.isPending}
        onClick={() => save.mutate({ userId, ...f })}
      >
        {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        프로필 저장
      </Button>
    </div>
  );
}

// ─── 메인 다이얼로그 ──────────────────────────────────────────────────────────
export default function StudentDocumentsDialog({
  userId, userName, open, onClose,
}: { userId: number | null; userName: string; open: boolean; onClose: () => void }) {
  const { data, isLoading } = trpc.resume.adminGetStudentDocuments.useQuery(
    { studentUserId: userId ?? 0 },
    { enabled: open && userId !== null },
  );
  const [addingCoverLetter, setAddingCoverLetter] = useState(false);
  const [addingPortfolio, setAddingPortfolio] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{userName} — 서류 수정</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={18} /> 불러오는 중…
          </div>
        ) : (
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile" className="gap-1.5"><UserCog size={14} /> 프로필</TabsTrigger>
              <TabsTrigger value="resume" className="gap-1.5"><FileText size={14} /> 이력서</TabsTrigger>
              <TabsTrigger value="cover" className="gap-1.5"><FileSignature size={14} /> 자소서 ({data?.coverLetters?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-1.5"><FolderOpen size={14} /> 포트폴리오 ({data?.portfolios?.length ?? 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              {userId !== null && <ProfileEditor userId={userId} />}
            </TabsContent>

            <TabsContent value="resume" className="mt-4">
              {userId !== null && <ResumeEditor userId={userId} resume={data?.resume} />}
            </TabsContent>

            <TabsContent value="cover" className="mt-4 space-y-3">
              {(data?.coverLetters?.length ?? 0) === 0 && !addingCoverLetter && (
                <p className="text-sm text-muted-foreground text-center py-6">등록된 자기소개서가 없습니다.</p>
              )}
              {data?.coverLetters?.map((cl: any) => <CoverLetterItem key={cl.id} cl={cl} />)}
              {addingCoverLetter && userId !== null ? (
                <NewCoverLetterForm userId={userId} onDone={() => setAddingCoverLetter(false)} />
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddingCoverLetter(true)}>
                  <Plus size={14} /> 새 자기소개서 추가
                </Button>
              )}
            </TabsContent>

            <TabsContent value="portfolio" className="mt-4 space-y-3">
              {(data?.portfolios?.length ?? 0) === 0 && !addingPortfolio && (
                <p className="text-sm text-muted-foreground text-center py-6">등록된 포트폴리오가 없습니다.</p>
              )}
              {data?.portfolios?.map((pf: any) => <PortfolioItem key={pf.id} pf={pf} />)}
              {addingPortfolio && userId !== null ? (
                <NewPortfolioForm userId={userId} onDone={() => setAddingPortfolio(false)} />
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddingPortfolio(true)}>
                  <Plus size={14} /> 새 포트폴리오 추가
                </Button>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
