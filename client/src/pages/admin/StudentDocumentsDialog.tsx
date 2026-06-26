import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, FileText, FolderOpen, FileSignature } from "lucide-react";
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

// ─── 자기소개서 1건 편집 ──────────────────────────────────────────────────────
function CoverLetterItem({ cl }: { cl: any }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(cl.title ?? "");
  const [content, setContent] = useState(cl.content ?? "");
  const save = trpc.resume.adminUpdateStudentCoverLetter.useMutation({
    onSuccess: () => { utils.resume.adminGetStudentDocuments.invalidate(); toast.success("자기소개서가 수정되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="font-medium" />
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
      <Button size="sm" variant="outline" className="gap-1.5" disabled={save.isPending} onClick={() => save.mutate({ id: cl.id, title, content })}>
        {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 저장
      </Button>
    </div>
  );
}

// ─── 포트폴리오 1건 편집 ──────────────────────────────────────────────────────
function PortfolioItem({ pf }: { pf: any }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(pf.title ?? "");
  const [description, setDescription] = useState(pf.description ?? "");
  const [externalUrl, setExternalUrl] = useState(pf.externalUrl ?? "");
  const save = trpc.resume.adminUpdateStudentPortfolio.useMutation({
    onSuccess: () => { utils.resume.adminGetStudentDocuments.invalidate(); toast.success("포트폴리오가 수정되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="font-medium" />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="설명" />
      <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="외부 URL (선택)" />
      <Button size="sm" variant="outline" className="gap-1.5" disabled={save.isPending} onClick={() => save.mutate({ id: pf.id, title, description, externalUrl })}>
        {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 저장
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
          <Tabs defaultValue="resume">
            <TabsList>
              <TabsTrigger value="resume" className="gap-1.5"><FileText size={14} /> 이력서</TabsTrigger>
              <TabsTrigger value="cover" className="gap-1.5"><FileSignature size={14} /> 자소서 ({data?.coverLetters?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-1.5"><FolderOpen size={14} /> 포트폴리오 ({data?.portfolios?.length ?? 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="resume" className="mt-4">
              {userId !== null && <ResumeEditor userId={userId} resume={data?.resume} />}
            </TabsContent>

            <TabsContent value="cover" className="mt-4 space-y-3">
              {(data?.coverLetters?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">등록된 자기소개서가 없습니다.</p>
              ) : (
                data!.coverLetters.map((cl: any) => <CoverLetterItem key={cl.id} cl={cl} />)
              )}
            </TabsContent>

            <TabsContent value="portfolio" className="mt-4 space-y-3">
              {(data?.portfolios?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">등록된 포트폴리오가 없습니다.</p>
              ) : (
                data!.portfolios.map((pf: any) => <PortfolioItem key={pf.id} pf={pf} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
