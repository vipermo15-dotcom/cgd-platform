import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  User, Briefcase, BookOpen, Award, Mail, Phone,
  ExternalLink, Download, Share2, Copy, Check,
  Radar, BarChart2, Star
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar as RechartsRadar,
  ResponsiveContainer, Tooltip
} from "recharts";

// ─── 인쇄/PDF 스타일 ──────────────────────────────────────────────────────────
const printStyles = `
@media print {
  .no-print { display: none !important; }
  body { background: white !important; }
  .print-page { box-shadow: none !important; }
}
`;

export default function PublicResume() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = trpc.user.getPublicResume.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("링크가 복사되었습니다.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${data?.user.name ?? ""}의 포트폴리오 & 이력서`);
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
    window.open(shareUrls[platform], "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="w-full max-w-4xl p-8 space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <User size={36} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700">프로필을 찾을 수 없습니다</h2>
          <p className="text-slate-500 text-sm">비공개이거나 존재하지 않는 페이지입니다.</p>
        </div>
      </div>
    );
  }

  const { user, profile, portfolios, coverLetters, analysis } = data;

  // AI 분석 레이더 데이터
  const radarData = analysis?.scores
    ? Object.entries(analysis.scores as Record<string, number>).map(([k, v]) => ({
        subject: k, score: v, fullMark: 100,
      }))
    : [];

  const skills = (profile.skills as string[] | null) ?? [];
  const certs = (profile.certificates as string[] | null) ?? [];

  return (
    <>
      <style>{printStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* 상단 액션 바 */}
        <div className="no-print sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <BookOpen size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">CGD 취업지원 플랫폼</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "복사됨" : "링크 복사"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleShare("twitter")}>
                <Share2 size={13} /> Twitter
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleShare("linkedin")}>
                <Share2 size={13} /> LinkedIn
              </Button>
              <Button size="sm" className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700" onClick={handlePrint}>
                <Download size={13} /> PDF 저장
              </Button>
            </div>
          </div>
        </div>

        <div ref={printRef} className="max-w-4xl mx-auto px-4 py-8 space-y-6 print-page">
          {/* ── 헤더 카드 ── */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
            <CardContent className="pt-0 pb-6 px-6">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-3xl font-bold text-blue-600">
                  {user.name?.[0] ?? "?"}
                </div>
                <div className="pb-1">
                  <h1 className="text-2xl font-bold text-slate-800">{user.name}</h1>
                  <p className="text-sm text-slate-500">{profile.major ?? "컴퓨터그래픽디자인과"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                {user.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} className="text-blue-500" />
                    {user.email}
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} className="text-blue-500" />
                    {profile.phone}
                  </div>
                )}
                {profile.employmentStatus && (
                  <Badge variant={profile.employmentStatus === "취업확정" ? "default" : "secondary"} className="text-xs">
                    {profile.employmentStatus}
                  </Badge>
                )}
                {profile.employedCompany && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-emerald-500" />
                    {profile.employedCompany}
                  </div>
                )}
              </div>
              {profile.bio && (
                <p className="mt-4 text-sm text-slate-600 leading-relaxed border-l-2 border-blue-200 pl-3">
                  {profile.bio}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── 좌측: 기술/자격증/AI분석 ── */}
            <div className="space-y-4">
              {/* 기술 스택 */}
              {skills.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Star size={14} className="text-amber-500" /> 기술 스택
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 자격증 */}
              {certs.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Award size={14} className="text-purple-500" /> 자격증
                    </h3>
                    <ul className="space-y-1.5">
                      {certs.map((c) => (
                        <li key={c} className="text-xs text-slate-600 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* AI 역량 분석 레이더 */}
              {radarData.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <BarChart2 size={14} className="text-blue-500" /> AI 역량 분석
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`${v}점`, "점수"]} />
                        <RechartsRadar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                    {analysis?.strengths && (
                      <div className="mt-2 text-xs text-slate-600">
                        <span className="font-medium text-emerald-600">강점: </span>
                        {Array.isArray(analysis.strengths)
                          ? (analysis.strengths as string[]).join(", ")
                          : String(analysis.strengths)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ── 우측: 포트폴리오 + 자기소개서 ── */}
            <div className="lg:col-span-2 space-y-4">
              {/* 포트폴리오 */}
              {portfolios.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Briefcase size={14} className="text-indigo-500" /> 포트폴리오
                    </h3>
                    <div className="space-y-4">
                      {portfolios.map((p) => (
                        <div key={p.id} className="border border-slate-100 rounded-xl overflow-hidden">
                          <div className="p-3 bg-slate-50 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-slate-800">{p.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-400">조회 {p.viewCount ?? 0}회</span>
                              </div>
                            </div>
                            <a
                              href={`/portfolio/${p.publicSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-700 no-print"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                          {p.items.length > 0 && (
                            <div className="grid grid-cols-3 gap-1 p-2">
                              {p.items.slice(0, 3).map((item: any) => (
                                <div key={item.id} className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                  {item.mediaType === "image" && item.mediaUrl ? (
                                    <img src={item.mediaUrl} alt={item.title ?? ""} className="w-full h-full object-cover" />
                                  ) : item.mediaType === "youtube" && item.mediaUrl ? (
                                    <div className="w-full h-full flex items-center justify-center bg-red-50">
                                      <span className="text-xs text-red-400">YouTube</span>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-xs text-slate-400">{item.title ?? "작품"}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {p.description && (
                            <p className="px-3 pb-3 text-xs text-slate-500 leading-relaxed">{p.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 자기소개서 */}
              {coverLetters.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <BookOpen size={14} className="text-emerald-500" /> 자기소개서
                    </h3>
                    <div className="space-y-3">
                      {coverLetters.map((cl) => (
                        <div key={cl.id} className="border border-slate-100 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm text-slate-800">{cl.title ?? "자기소개서"}</p>
                            {cl.isAiGenerated && (
                              <Badge variant="secondary" className="text-xs">AI 생성</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                            {cl.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {portfolios.length === 0 && coverLetters.length === 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center text-slate-400">
                    <User size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">아직 공개된 작품이 없습니다.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* 푸터 */}
          <div className="text-center text-xs text-slate-400 py-4">
            CGD 취업지원 플랫폼 · 서울시기술교육원 컴퓨터그래픽디자인과
          </div>
        </div>
      </div>
    </>
  );
}
