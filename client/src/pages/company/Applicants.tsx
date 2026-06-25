import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  "지원완료": "bg-blue-100 text-blue-700",
  "서류합격": "bg-green-100 text-green-700",
  "면접": "bg-yellow-100 text-yellow-700",
  "최종합격": "bg-emerald-100 text-emerald-700",
  "탈락": "bg-red-100 text-red-700",
};

export default function CompanyApplicants() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewMessage, setInterviewMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: applicants = [] } = trpc.jobs.getApplicants.useQuery({ jobPostingId: Number(id) });

  const updateStatus = trpc.jobs.updateApplicationStatus.useMutation({
    onSuccess: () => {
      utils.jobs.getApplicants.invalidate({ jobPostingId: Number(id) });
      setInterviewOpen(false);
      toast.success("상태가 업데이트되었습니다.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handleStatusUpdate = (appId: number, status: string) => {
    if (status === "면접") {
      setSelectedAppId(appId);
      setInterviewOpen(true);
    } else {
      updateStatus.mutate({ applicationId: appId, status: status as "지원완료" | "서류합격" | "면접" | "최종합격" | "탈락" });
    }
  };

  return (
    <AppLayout title="지원자 관리">
      <div className="p-6 space-y-6">
        <Link href="/company/postings">
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft size={16} /> 공고 목록</Button>
        </Link>

        <p className="text-sm text-muted-foreground">{applicants.length}명 지원</p>

        <div className="space-y-3">
          {applicants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">지원자가 없습니다.</div>
          ) : (
            applicants.map((item: any) => {
              const app = item.application;
              const user = item.user;
              const profile = item.profile;
              return (
                <Card key={app.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                        {user?.name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{profile?.major} · {profile?.studentId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${STATUS_COLORS[app.status] ?? ""}`}>{app.status}</Badge>
                        {profile?.isPublic && profile?.publicSlug && (
                          <a href={`/portfolio/${profile.publicSlug}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline"><ExternalLink size={14} /></Button>
                          </a>
                        )}
                        <Select onValueChange={(v) => handleStatusUpdate(app.id, v)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue placeholder="상태 변경" />
                          </SelectTrigger>
                          <SelectContent>
                            {["서류합격", "면접", "최종합격", "탈락"].map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Interview dialog */}
        <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>면접 일정 안내</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">면접 일시</label>
                <Input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">안내 메시지</label>
                <Textarea value={interviewMessage} onChange={e => setInterviewMessage(e.target.value)} rows={4} placeholder="면접 장소, 준비사항 등을 안내해주세요." />
              </div>
              <Button
                className="w-full"
                onClick={() => selectedAppId && updateStatus.mutate({
                  applicationId: selectedAppId,
                  status: "면접",
                  interviewDate: interviewDate || undefined,
                  interviewMessage: interviewMessage || undefined,
                })}
                disabled={updateStatus.isPending}
              >
                <Calendar size={16} className="mr-2" /> 면접 요청 전송
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
