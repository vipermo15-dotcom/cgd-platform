import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Trophy, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function EmploymentBanners() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [message, setMessage] = useState("");
  const [useInitial, setUseInitial] = useState(false);

  const { data: banners = [] } = trpc.guidance.getActiveBanners.useQuery();

  const createBanner = trpc.guidance.createBanner.useMutation({
    onSuccess: () => {
      utils.guidance.getActiveBanners.invalidate();
      setOpen(false);
      setStudentName(""); setCompanyName(""); setJobTitle(""); setMessage(""); setUseInitial(false);
      toast.success("취업 축하 배너가 등록되었습니다.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const deleteBanner = trpc.guidance.deactivateBanner.useMutation({
    onSuccess: () => {
      utils.guidance.getActiveBanners.invalidate();
      toast.success("배너가 삭제되었습니다.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const typedBanners = banners as {
    id: number;
    studentName: string;
    useInitial: boolean;
    companyName: string;
    jobTitle: string;
    message?: string;
    createdAt: string | Date;
  }[];

  const handleCreate = () => {
    if (!studentName.trim()) return toast.error("학생 이름을 입력하세요.");
    if (!companyName.trim()) return toast.error("기업명을 입력하세요.");
    if (!jobTitle.trim()) return toast.error("직무를 입력하세요.");
    createBanner.mutate({ studentUserId: 0, studentName, companyName, jobTitle, message: message || undefined, useInitial });
  };

  return (
    <AppLayout title="취업 축하 배너 관리">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">취업 축하 배너 관리</h2>
            <p className="text-sm text-muted-foreground mt-1">
              취업에 성공한 교육생을 축하하는 배너를 등록하고 관리합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/results" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-4 h-4" />
                공개 페이지 보기
              </Button>
            </Link>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  배너 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>취업 축하 배너 등록</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>학생 이름 *</Label>
                    <Input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="예: 이유진"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>취업 기업명 *</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="예: 슈퍼웍스컴퍼니"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>직무 *</Label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="예: 굿즈생산디자이너"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>축하 메시지 (선택)</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="학생의 한마디나 축하 메시지를 입력하세요."
                      className="mt-1 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Switch
                      checked={useInitial}
                      onCheckedChange={setUseInitial}
                      id="useInitial"
                    />
                    <div>
                      <Label htmlFor="useInitial" className="cursor-pointer">이름 이니셜 처리</Label>
                      <p className="text-xs text-muted-foreground">
                        공개 페이지에서 이름을 "이○○" 형태로 표시합니다.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={createBanner.isPending}
                    className="w-full"
                  >
                    {createBanner.isPending ? "등록 중..." : "배너 등록"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 배너 목록 */}
        {typedBanners.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">등록된 배너가 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-1">
                취업에 성공한 교육생의 배너를 등록해 보세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {typedBanners.map((banner) => (
              <Card key={banner.id} className="border-amber-200 bg-amber-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">🎊</span>
                        <span className="font-bold">{banner.studentName}</span>
                        {banner.useInitial && (
                          <Badge variant="outline" className="text-xs">이니셜 처리</Badge>
                        )}
                        <span className="text-muted-foreground text-sm">→</span>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {banner.companyName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{banner.jobTitle}</span>
                      </div>
                      {banner.message && (
                        <p className="text-sm text-muted-foreground mt-1.5 italic">
                          "{banner.message}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        등록일: {new Date(banner.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBanner.mutate({ id: banner.id })}
                      disabled={deleteBanner.isPending}
                      className="text-destructive hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 안내 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700 font-medium mb-1">📢 공개 페이지 안내</p>
            <p className="text-sm text-blue-600">
              등록된 배너는 <strong>/results</strong> 페이지에서 누구나 확인할 수 있습니다.
              이름 이니셜 처리 옵션을 활용해 개인정보를 보호하세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
