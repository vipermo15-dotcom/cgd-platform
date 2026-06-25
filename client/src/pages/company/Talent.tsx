import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Search, ExternalLink, Star } from "lucide-react";
import { useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const SCORE_LABELS: Record<string, string> = {
  branding: "브랜딩", sns: "SNS", video: "영상", character: "캐릭터", aiGeneration: "AI", editing: "편집",
};

export default function CompanyTalent() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minScore, setMinScore] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: talents = [] } = trpc.company.searchStudents.useQuery({
    major: category || undefined,
    minScore: minScore ? Number(minScore) : undefined,
  });

  return (
    <AppLayout title="인재 탐색">
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="이름, 스킬 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="분야 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {["브랜딩", "SNS 콘텐츠", "영상편집", "캐릭터/일러스트", "AI 생성", "편집디자인"].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={minScore} onValueChange={setMinScore}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="최소 AI점수" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              <SelectItem value="60">60점 이상</SelectItem>
              <SelectItem value="70">70점 이상</SelectItem>
              <SelectItem value="80">80점 이상</SelectItem>
              <SelectItem value="90">90점 이상</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">{talents.length}명</p>

        {/* Talent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {talents.map((item: any) => {
            const user = item.user;
            const profile = item.profile;
            const analysis = item.analysis;
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user.name?.[0] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.major}</p>
                    </div>
                    {analysis && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{analysis.overallScore}</p>
                        <p className="text-xs text-muted-foreground">AI점수</p>
                      </div>
                    )}
                  </div>
                  {profile?.skills && (profile.skills as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(profile.skills as string[]).slice(0, 4).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedStudent(item)}>
                      상세 보기
                    </Button>
                    {profile?.isPublic && profile?.publicSlug && (
                      <a href={`/portfolio/${profile.publicSlug}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline"><ExternalLink size={14} /></Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {talents.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        {/* Student detail dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedStudent?.user?.name} 포트폴리오</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                    {selectedStudent.user?.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedStudent.user?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedStudent.profile?.major}</p>
                    {selectedStudent.profile?.bio && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedStudent.profile.bio}</p>
                    )}
                  </div>
                </div>
                {selectedStudent.analysis && (
                  <div>
                    <p className="text-sm font-medium mb-2">AI 역량 분석 ({selectedStudent.analysis.overallScore}점)</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <RadarChart data={Object.entries(selectedStudent.analysis.scores as Record<string, number>).map(([k, v]) => ({ subject: SCORE_LABELS[k] ?? k, score: v }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {selectedStudent.profile?.isPublic && selectedStudent.profile?.publicSlug && (
                  <a href={`/portfolio/${selectedStudent.profile.publicSlug}`} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2"><ExternalLink size={16} /> 포트폴리오 보기</Button>
                  </a>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
