import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  PencilLine, Send, Building2, Link2, FileText, Trash2,
  Clock, Loader2, CheckCircle2, MessageSquareText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "검토 대기", cls: "bg-amber-100 text-amber-700" },
  in_review: { label: "검토 중", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "첨삭 완료", cls: "bg-emerald-100 text-emerald-700" },
};

export default function JobCoaching() {
  const utils = trpc.useUtils();
  const { data: requests = [], isLoading } = trpc.coaching.myRequests.useQuery();
  const { data: myResume } = trpc.resume.getMyResume.useQuery();
  const { data: coverLetters = [] } = trpc.ai.listCoverLetters.useQuery();
  const { data: portfolios = [] } = trpc.portfolio.list.useQuery();

  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [attachResume, setAttachResume] = useState(false);
  const [coverLetterId, setCoverLetterId] = useState<number | undefined>();
  const [portfolioId, setPortfolioId] = useState<number | undefined>();
  const [studentMessage, setStudentMessage] = useState("");

  const reset = () => {
    setCompanyName(""); setJobTitle(""); setJobUrl(""); setJobDescription("");
    setAttachResume(false); setCoverLetterId(undefined); setPortfolioId(undefined);
    setStudentMessage("");
  };

  const create = trpc.coaching.createRequest.useMutation({
    onSuccess: () => {
      utils.coaching.myRequests.invalidate();
      toast.success("첨삭 요청을 보냈습니다. 검토 후 알림으로 안내됩니다.");
      reset();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.coaching.deleteRequest.useMutation({
    onSuccess: () => {
      utils.coaching.myRequests.invalidate();
      toast.success("요청을 삭제했습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!companyName.trim() || !jobTitle.trim()) {
      toast.error("회사명과 직무명은 필수입니다.");
      return;
    }
    create.mutate({
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      jobUrl: jobUrl.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      resumeId: attachResume && myResume ? (myResume as any).id : undefined,
      coverLetterId,
      portfolioId,
      studentMessage: studentMessage.trim() || undefined,
    });
  };

  return (
    <AppLayout title="채용공고 첨삭">
      <div className="p-6 space-y-6 pb-20 lg:pb-6 max-w-3xl">
        {/* 요청 폼 */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2"><PencilLine className="text-primary" size={20} /></div>
              <div>
                <h2 className="font-semibold">희망 채용공고 첨삭 요청</h2>
                <p className="text-sm text-muted-foreground">지원하고 싶은 공고를 올리면 멘토가 맞춤 첨삭을 해드립니다.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">회사명 *</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="예: OO 디자인 스튜디오" />
              </div>
              <div>
                <Label className="mb-1 block">직무명 *</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="예: 그래픽 디자이너" />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">공고 URL (선택)</Label>
              <Input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <Label className="mb-1 block">공고 내용 붙여넣기 (선택)</Label>
              <Textarea
                value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                placeholder="채용 공고 전문을 붙여넣으면 더 정확한 첨삭을 받을 수 있습니다."
                rows={5}
              />
            </div>

            {/* 첨부 서류 */}
            <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">내 서류 첨부 (선택)</p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="attachResume"
                  checked={attachResume}
                  onCheckedChange={(v) => setAttachResume(!!v)}
                  disabled={!myResume}
                />
                <Label htmlFor="attachResume" className="text-sm font-normal">
                  내 이력서 첨부 {!myResume && <span className="text-muted-foreground">(등록된 이력서 없음)</span>}
                </Label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">자기소개서</Label>
                  <Select value={coverLetterId ? String(coverLetterId) : "none"} onValueChange={(v) => setCoverLetterId(v === "none" ? undefined : Number(v))}>
                    <SelectTrigger><SelectValue placeholder="선택 안 함" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안 함</SelectItem>
                      {coverLetters.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.title ?? "제목 없음"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">포트폴리오</Label>
                  <Select value={portfolioId ? String(portfolioId) : "none"} onValueChange={(v) => setPortfolioId(v === "none" ? undefined : Number(v))}>
                    <SelectTrigger><SelectValue placeholder="선택 안 함" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안 함</SelectItem>
                      {portfolios.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-1 block">요청 메모 (선택)</Label>
              <Textarea
                value={studentMessage} onChange={(e) => setStudentMessage(e.target.value)}
                placeholder="특별히 봐주셨으면 하는 부분이 있다면 적어주세요."
                rows={2}
              />
            </div>

            <Button onClick={handleSubmit} disabled={create.isPending} className="gap-1.5">
              {create.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              첨삭 요청 보내기
            </Button>
          </CardContent>
        </Card>

        {/* 내 요청 목록 */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquareText size={16} className="text-primary" /> 내 첨삭 요청
            {requests.length > 0 && <Badge variant="secondary">{requests.length}건</Badge>}
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={18} /> 불러오는 중…
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <PencilLine size={36} className="mx-auto opacity-30 mb-2" />
              <p className="text-sm">아직 요청한 첨삭이 없습니다.</p>
            </div>
          ) : (
            requests.map((r: any) => {
              const meta = STATUS_META[r.status] ?? STATUS_META.pending;
              return (
                <Card key={r.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 size={14} className="text-muted-foreground shrink-0" />
                          <span className="truncate">{r.companyName} · {r.jobTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                          {r.jobUrl && (
                            <a href={r.jobUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                              <Link2 size={12} /> 공고 링크
                            </a>
                          )}
                          {r.resumeId && <span className="inline-flex items-center gap-1"><FileText size={12} /> 이력서</span>}
                          {r.coverLetterId && <span className="inline-flex items-center gap-1"><FileText size={12} /> 자소서</span>}
                          {r.portfolioId && <span className="inline-flex items-center gap-1"><FileText size={12} /> 포트폴리오</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={meta.cls}>
                          {r.status === "completed" ? <CheckCircle2 size={11} className="mr-1" /> : <Clock size={11} className="mr-1" />}
                          {meta.label}
                        </Badge>
                        {r.status !== "completed" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => remove.mutate({ id: r.id })} aria-label="삭제">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 첨삭 결과 */}
                    {r.status === "completed" && r.feedbackContent && (
                      <div className="rounded-lg border bg-emerald-50/50 p-3">
                        <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                          <MessageSquareText size={12} /> 멘토 첨삭 지도
                        </p>
                        <div className="prose prose-sm max-w-none text-sm">
                          <Streamdown>{r.feedbackContent}</Streamdown>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
