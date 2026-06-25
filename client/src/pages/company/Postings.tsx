import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Users, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "승인 대기", approved: "게시 중", rejected: "반려됨",
};

export default function CompanyPostings() {
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [employmentType, setEmploymentType] = useState("정규직");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");

  const { data: postings = [] } = trpc.jobs.myPostings.useQuery();

  const createPosting = trpc.jobs.create.useMutation({
    onSuccess: () => {
      utils.jobs.myPostings.invalidate();
      setCreateOpen(false);
      setTitle(""); setDescription(""); setRequirements("");
      toast.success("채용공고가 등록되었습니다. 관리자 승인 후 게시됩니다.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!title) return toast.error("제목을 입력하세요.");
    createPosting.mutate({
      title, description,
      employmentType: employmentType as "정규직" | "계약직" | "프리랜서" | "인턴",
      location, category,
      deadline: deadline || undefined,
    });
  };

  return (
    <AppLayout title="채용공고 관리">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">등록한 공고는 관리자 승인 후 게시됩니다.</p>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> 공고 등록</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>채용공고 등록</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>제목 *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="그래픽 디자이너 모집" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>고용 형태</Label>
                    <Select value={employmentType} onValueChange={setEmploymentType}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["정규직", "계약직", "인턴", "프리랜서"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>분야</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="선택" /></SelectTrigger>
                      <SelectContent>
                        {["브랜딩", "SNS 콘텐츠", "영상편집", "캐릭터/일러스트", "AI 생성", "편집디자인", "UI/UX"].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>근무지</Label>
                    <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="서울 강남구" className="mt-1" />
                  </div>
                  <div>
                    <Label>급여</Label>
                    <Input value={salary} onChange={e => setSalary(e.target.value)} placeholder="협의" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>마감일</Label>
                  <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>공고 내용</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1" placeholder="업무 내용, 우대사항 등" />
                </div>
                <div>
                  <Label>지원 자격</Label>
                  <Textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={3} className="mt-1" placeholder="필요 역량, 경험 등" />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createPosting.isPending}>
                  {createPosting.isPending ? "등록 중..." : "공고 등록"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Postings list */}
        <div className="space-y-3">
          {postings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">등록한 채용공고가 없습니다.</div>
          ) : (
            postings.map((item: any) => {
              const posting = item.posting;
              return (
                <Card key={posting.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{posting.title}</h3>
                          <Badge className={`text-xs ${STATUS_COLORS[posting.approvalStatus] ?? ""}`}>
                            {STATUS_LABELS[posting.approvalStatus] ?? posting.approvalStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {posting.location && <span className="flex items-center gap-1"><MapPin size={11} /> {posting.location}</span>}
                          {posting.deadline && <span className="flex items-center gap-1"><Clock size={11} /> {format(new Date(posting.deadline), "yyyy.MM.dd", { locale: ko })} 마감</span>}
                          <span className="flex items-center gap-1"><Users size={11} /> {item.applicantCount ?? 0}명 지원</span>
                        </div>
                      </div>
                      {posting.approvalStatus === "approved" && (
                        <Link href={`/company/applicants/${posting.id}`}>
                          <Button size="sm" variant="outline">지원자 관리</Button>
                        </Link>
                      )}
                    </div>
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
