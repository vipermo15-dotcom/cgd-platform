import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Bot, Copy, Check, Share2, Link2 } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { useState } from "react";
import { toast } from "sonner";

const SCORE_LABELS: Record<string, string> = {
  branding: "브랜딩", sns: "SNS 콘텐츠", video: "영상편집",
  character: "캐릭터/일러스트", aiGeneration: "AI 생성", editing: "편집디자인",
};

export default function PublicPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = trpc.portfolio.getPublic.useQuery({ slug });
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("링크가 복사되었습니다.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`${(data as any)?.user?.name ?? ""} 포트폴리오 — CGD 취업지원 플랫폼`);
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      kakao: `https://story.kakao.com/share?url=${url}`,
    };
    if (shareUrls[platform]) window.open(shareUrls[platform], "_blank", "width=600,height=400");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">포트폴리오를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground">존재하지 않거나 비공개 포트폴리오입니다.</p>
        <a href="/"><Button variant="outline">홈으로</Button></a>
      </div>
    );
  }

  const { user, profile, portfolios, analysis } = data as any;

  const radarData = analysis?.scores
    ? Object.entries(analysis.scores as Record<string, number>).map(([k, v]) => ({
        subject: SCORE_LABELS[k] ?? k, score: v,
      }))
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 공유 버튼 바 */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleCopyLink}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "복사됨" : "링크 복사"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => handleShare("twitter")}>
              <Share2 size={12} /> Twitter
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => handleShare("linkedin")}>
              <Share2 size={12} /> LinkedIn
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => handleShare("facebook")}>
              <Share2 size={12} /> Facebook
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => handleShare("kakao")}>
              <Share2 size={12} /> 카카오
            </Button>
          </div>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold flex-shrink-0">
              {user?.name?.[0] ?? "?"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              {profile?.major && <p className="text-muted-foreground mt-1">{profile.major}</p>}
              {profile?.bio && <p className="text-sm mt-2 max-w-lg">{profile.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {profile?.skills && (profile.skills as string[]).map((s: string) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
            {analysis && (
              <div className="text-center flex-shrink-0">
                <div className="text-3xl font-bold text-primary">{analysis.overallScore}</div>
                <div className="text-xs text-muted-foreground">AI 역량점수</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* AI Analysis */}
        {radarData.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bot size={20} className="text-purple-500" /> AI 역량 분석
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {analysis.strengths?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">강점</p>
                    <ul className="text-sm space-y-1">
                      {(analysis.strengths as string[]).map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.weaknesses?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">개선 영역</p>
                    <ul className="text-sm space-y-1">
                      {(analysis.weaknesses as string[]).map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5">△</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Portfolio works */}
        {portfolios?.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">작품 목록</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolios.map((item: any) => {
                const p = item.portfolio;
                return (
                  <Card key={p.id} className="overflow-hidden">
                    {p.thumbnailUrl && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{p.title}</h3>
                      {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.category && <Badge variant="secondary" className="text-xs">{p.category}</Badge>}
                        {(p.tags as string[] | null)?.map((t: string) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                      {p.externalUrl && (
                        <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                          <Button size="sm" variant="outline" className="gap-1 text-xs">
                            <ExternalLink size={12} /> 외부 링크
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {portfolios?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">등록된 작품이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
