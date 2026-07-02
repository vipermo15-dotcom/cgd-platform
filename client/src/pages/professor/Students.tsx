import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Search, Star, MessageSquare, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const STATUS_COLORS: Record<string, string> = {
  "취업확정": "bg-emerald-100 text-emerald-700",
  "지원중": "bg-blue-100 text-blue-700",
  "준비중": "bg-yellow-100 text-yellow-700",
  "미시작": "bg-gray-100 text-gray-600",
};

export default function ProfessorStudents() {
  const { user } = useAuth();
  const isReadOnly = user?.role === "training_center";
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [feedbackStudent, setFeedbackStudent] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);

  const { data: students = [] } = trpc.professor.getStudents.useQuery({
    search: search || undefined,
    employmentStatus: statusFilter === "전체" ? undefined : statusFilter,
  });

  const addFeedback = trpc.professor.createFeedback.useMutation({
    onSuccess: () => {
      utils.professor.getStudents.invalidate();
      setFeedbackStudent(null);
      setFeedbackText("");
      setFeedbackRating(5);
      toast.success("피드백이 작성되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AppLayout title="학생 관리">
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="학생 이름, 학번 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["전체", "취업확정", "지원중", "준비중", "미시작"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">{students.length}명</p>

        {/* Student table */}
        <div className="space-y-2">
          {students.map((item: any) => {
            const user = item.user;
            const profile = item.profile;
            return (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {user.name?.[0] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        {profile?.studentId && <span className="text-xs text-muted-foreground">{profile.studentId}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {profile?.employmentStatus && (
                          <Badge className={`text-xs ${STATUS_COLORS[profile.employmentStatus] ?? ""}`}>
                            {profile.employmentStatus}
                          </Badge>
                        )}
                        {profile?.employedCompany && (
                          <span className="text-xs text-muted-foreground">→ {profile.employedCompany}</span>
                        )}
                        {profile?.major && <span className="text-xs text-muted-foreground">{profile.major}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/professor/students/${user.id}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye size={14} /> {isReadOnly ? "열람" : "상세"}
                        </Button>
                      </Link>
                      {!isReadOnly && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setFeedbackStudent(item)}
                        >
                          <MessageSquare size={14} /> 피드백
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {students.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">학생이 없습니다.</div>
          )}
        </div>

        {/* Feedback dialog */}
        <Dialog open={!!feedbackStudent} onOpenChange={() => setFeedbackStudent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{feedbackStudent?.user?.name}님에게 피드백 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">별점</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setFeedbackRating(n)}>
                      <Star size={24} className={n <= feedbackRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">피드백 내용 *</p>
                <Textarea value={feedbackText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)} rows={5} placeholder="학생에게 전달할 피드백을 작성해주세요." />
              </div>
              <Button
                className="w-full"
                onClick={() => feedbackStudent && addFeedback.mutate({
                  studentUserId: feedbackStudent.user.id,
                  rating: feedbackRating,
                  content: feedbackText,
                })}
                disabled={!feedbackText || addFeedback.isPending}
              >
                피드백 전송
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
