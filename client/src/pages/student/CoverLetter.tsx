import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Sparkles, Edit, Trash2, FileText, Save, ChevronDown, LayoutTemplate } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// ─── 직무별 예시 템플릿 ──────────────────────────────────────────────────────
const JOB_TEMPLATES: Record<string, { label: string; template: string }> = {
  graphic_designer: {
    label: "그래픽 디자이너",
    template: `안녕하세요. 저는 시각 커뮤니케이션을 통해 브랜드의 가치를 전달하는 그래픽 디자이너를 꿈꾸는 [이름]입니다.

[지원 동기]
귀사의 [브랜드명/프로젝트명]에 깊은 인상을 받아 지원하게 되었습니다. 특히 [구체적인 캠페인/작업물]에서 보여준 창의적인 비주얼 언어와 일관된 브랜드 아이덴티티가 저의 디자인 철학과 일치합니다.

[역량 및 경험]
서울시기술교육원 컴퓨터그래픽디자인과에서 브랜딩, 편집디자인, 타이포그래피를 체계적으로 학습하였습니다. Adobe Creative Suite(Photoshop, Illustrator, InDesign)를 능숙하게 다루며, [포트폴리오 작품명] 프로젝트에서 [성과/특징]을 달성하였습니다.

[강점]
- 사용자 중심의 시각적 스토리텔링 역량
- 트렌드를 반영한 감각적인 레이아웃 구성 능력
- 피드백을 적극 수용하는 협업 태도

귀사와 함께 성장하며 더 나은 비주얼 경험을 만들어가고 싶습니다. 감사합니다.`,
  },
  ui_ux_designer: {
    label: "UI/UX 디자이너",
    template: `안녕하세요. 사용자 경험을 중심으로 직관적이고 아름다운 인터페이스를 설계하는 UI/UX 디자이너 [이름]입니다.

[지원 동기]
귀사의 [서비스명/앱명]을 직접 사용하면서 세심한 UX 설계에 감동받았습니다. 사용자의 불편함을 해소하고 즐거운 경험을 제공하는 귀사의 철학에 공감하여 지원합니다.

[역량 및 경험]
Figma, Adobe XD를 활용한 프로토타이핑과 와이어프레임 설계 경험이 있으며, 사용자 리서치와 휴리스틱 평가를 통해 [프로젝트명]에서 사용성을 [수치]% 개선한 경험이 있습니다. 디자인 시스템 구축과 컴포넌트 라이브러리 관리 역량도 보유하고 있습니다.

[강점]
- 데이터 기반의 UX 의사결정 능력
- 개발자와의 원활한 커뮤니케이션 경험
- 접근성(Accessibility) 가이드라인 준수

귀사의 제품이 더 많은 사용자에게 사랑받을 수 있도록 기여하겠습니다. 감사합니다.`,
  },
  video_editor: {
    label: "영상 편집자/모션 그래픽",
    template: `안녕하세요. 스토리텔링과 모션 그래픽으로 시청자의 감동을 이끌어내는 영상 편집자 [이름]입니다.

[지원 동기]
귀사의 [채널명/콘텐츠명]에서 보여주는 창의적인 영상 언어와 탄탄한 스토리 구조에 매료되어 지원합니다. 콘텐츠를 통해 브랜드 메시지를 효과적으로 전달하는 귀사의 방식을 배우고 함께 성장하고 싶습니다.

[역량 및 경험]
Adobe Premiere Pro, After Effects, DaVinci Resolve를 활용한 영상 편집 및 색보정 경험이 있습니다. [프로젝트명]에서 [조회수/성과]를 달성한 바 있으며, 모션 타이포그래피와 2D 애니메이션 제작 역량도 보유하고 있습니다.

[강점]
- 트렌드에 민감한 편집 감각
- 빠른 납기 준수 능력 (마감 100% 준수)
- 클라이언트 피드백을 반영한 수정 대응 능력

귀사의 콘텐츠가 더욱 빛날 수 있도록 최선을 다하겠습니다. 감사합니다.`,
  },
  social_media: {
    label: "SNS 콘텐츠 크리에이터",
    template: `안녕하세요. 디지털 네이티브 감성으로 브랜드와 팔로워를 연결하는 SNS 콘텐츠 크리에이터 [이름]입니다.

[지원 동기]
귀사의 [인스타그램/유튜브/틱톡] 채널을 꾸준히 팔로우하며 일관된 브랜드 톤앤매너와 높은 인게이지먼트에 감탄했습니다. 귀사의 디지털 마케팅 전략에 기여하고 싶어 지원합니다.

[역량 및 경험]
Instagram, YouTube, TikTok 등 주요 플랫폼의 알고리즘과 콘텐츠 전략을 이해하고 있습니다. [프로젝트명/개인 채널명]을 운영하며 [팔로워 수/조회수] 성과를 달성하였고, 카드뉴스, 릴스, 숏폼 영상 제작 경험이 있습니다.

[강점]
- 플랫폼별 최적화된 콘텐츠 기획 능력
- 데이터 분석을 통한 콘텐츠 개선 경험
- 트렌드를 빠르게 캐치하는 감각

귀사의 디지털 채널이 더욱 성장할 수 있도록 기여하겠습니다. 감사합니다.`,
  },
  illustration: {
    label: "일러스트레이터/캐릭터 디자이너",
    template: `안녕하세요. 독창적인 세계관과 감성으로 캐릭터와 일러스트를 창조하는 [이름]입니다.

[지원 동기]
귀사의 [IP명/캐릭터명]이 보여주는 독특한 아트 스타일과 세계관 구축 방식에 깊이 공감하여 지원합니다. 귀사와 함께 사람들의 마음을 움직이는 캐릭터를 만들고 싶습니다.

[역량 및 경험]
Procreate, Adobe Illustrator를 활용한 디지털 일러스트 제작 경험이 있으며, [스타일명] 아트 스타일을 구사합니다. [포트폴리오 작품명]에서 [성과/특징]을 달성하였고, 캐릭터 디자인부터 굿즈 적용까지 전 과정을 경험하였습니다.

[강점]
- 일관된 캐릭터 아이덴티티 유지 능력
- 다양한 아트 스타일 구사 가능
- 팬덤과 소통하는 콘텐츠 제작 경험

귀사의 IP가 더욱 사랑받을 수 있도록 최선을 다하겠습니다. 감사합니다.`,
  },
  ai_content: {
    label: "AI 콘텐츠 디자이너",
    template: `안녕하세요. AI 도구를 창의적으로 활용하여 혁신적인 콘텐츠를 제작하는 [이름]입니다.

[지원 동기]
AI와 디자인의 경계를 탐구하는 귀사의 비전에 공감하여 지원합니다. 기술과 창의성의 융합을 통해 새로운 가치를 창출하는 귀사의 방향성이 저의 역량과 잘 맞는다고 생각합니다.

[역량 및 경험]
Midjourney, Stable Diffusion, Adobe Firefly 등 AI 이미지 생성 도구를 능숙하게 활용합니다. AI 생성 이미지의 후보정 및 상업적 활용 경험이 있으며, 프롬프트 엔지니어링을 통해 [프로젝트명]에서 [성과]를 달성하였습니다.

[강점]
- AI 도구와 전통적 디자인 스킬의 융합 능력
- 빠른 프로토타이핑과 시안 제작 능력
- AI 윤리와 저작권에 대한 이해

AI 시대의 새로운 디자인 패러다임을 귀사와 함께 만들어가겠습니다. 감사합니다.`,
  },
};

// ─── 글자수 카운터 컴포넌트 ──────────────────────────────────────────────────
function CharCounter({ value, max = 1500 }: { value: string; max?: number }) {
  const count = value.length;
  const percent = Math.min((count / max) * 100, 100);
  const color = count > max ? "text-destructive" : count > max * 0.9 ? "text-amber-500" : "text-muted-foreground";

  return (
    <div className="flex items-center justify-between mt-1">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden mr-3">
        <div
          className={`h-full rounded-full transition-all duration-200 ${count > max ? "bg-destructive" : count > max * 0.9 ? "bg-amber-400" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`text-xs font-medium tabular-nums ${color}`}>
        {count.toLocaleString()} / {max.toLocaleString()}자
      </span>
    </div>
  );
}

export default function StudentCoverLetter() {
  const utils = trpc.useUtils();
  const { data: letters = [] } = trpc.ai.listCoverLetters.useQuery();

  // 생성 다이얼로그 상태
  const [genOpen, setGenOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  // 편집 상태
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");

  // 템플릿 상태
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const generate = trpc.ai.generateCoverLetter.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      utils.ai.listCoverLetters.invalidate();
      toast.success("자기소개서가 생성되었습니다!");
    },
    onError: (e) => toast.error(e.message),
  });

  const save = trpc.ai.saveCoverLetter.useMutation({
    onSuccess: () => {
      utils.ai.listCoverLetters.invalidate();
      setEditId(null);
      toast.success("저장되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLetter = trpc.ai.deleteCoverLetter.useMutation({
    onSuccess: () => { utils.ai.listCoverLetters.invalidate(); toast.success("삭제되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const handleEdit = (letter: any) => {
    setEditId(letter.id);
    setEditTitle(letter.title ?? "");
    setEditContent(letter.content);
  };

  const handleApplyTemplate = useCallback((templateKey: string) => {
    if (!templateKey) return;
    const tpl = JOB_TEMPLATES[templateKey];
    if (!tpl) return;
    if (editId) {
      // 편집 모드: 현재 내용에 템플릿 삽입 여부 확인
      if (editContent && !confirm("현재 내용을 템플릿으로 교체하시겠습니까?")) return;
      setEditContent(tpl.template);
      if (!editTitle) setEditTitle(`${tpl.label} 자기소개서`);
    } else {
      // 생성 모드
      setJobTitle(tpl.label);
      setJobDesc(tpl.template);
    }
    setSelectedTemplate("");
    toast.success(`'${tpl.label}' 템플릿이 적용되었습니다.`);
  }, [editId, editContent, editTitle]);

  return (
    <AppLayout title="AI 자기소개서">
      <div className="p-6 space-y-6 pb-20 lg:pb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">AI가 포트폴리오 기반으로 자기소개서 초안을 생성합니다.</p>
          <div className="flex items-center gap-2">
            {/* 직무별 템플릿 드롭다운 */}
            <Select value={selectedTemplate} onValueChange={handleApplyTemplate}>
              <SelectTrigger className="w-52 h-9 text-sm gap-1.5">
                <LayoutTemplate size={14} className="text-muted-foreground" />
                <SelectValue placeholder="직무별 예시 템플릿" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(JOB_TEMPLATES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* AI 생성 버튼 */}
            <Dialog open={genOpen} onOpenChange={(open) => { setGenOpen(open); if (!open) { setGeneratedContent(""); } }}>
              <DialogTrigger asChild>
                <Button className="gap-2 h-9"><Sparkles size={15} /> AI 생성</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>AI 자기소개서 생성</DialogTitle>
                </DialogHeader>
                {!generatedContent ? (
                  <div className="space-y-4">
                    <div>
                      <Label>회사명 *</Label>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="지원 회사명" className="mt-1" />
                    </div>
                    <div>
                      <Label>포지션 *</Label>
                      <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="그래픽 디자이너, 영상 편집자..." className="mt-1" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>직무 설명 (선택)</Label>
                        {/* 인라인 템플릿 선택 */}
                        <Select onValueChange={(key) => {
                          const tpl = JOB_TEMPLATES[key];
                          if (tpl) { setJobDesc(tpl.template); setJobTitle(tpl.label); toast.success(`'${tpl.label}' 템플릿 적용`); }
                        }}>
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue placeholder="템플릿 불러오기" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(JOB_TEMPLATES).map(([key, { label }]) => (
                              <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        value={jobDesc}
                        onChange={e => setJobDesc(e.target.value)}
                        placeholder="채용공고 내용이나 직무 설명을 입력하면 더 정확한 자기소개서가 생성됩니다."
                        className="mt-1"
                        rows={5}
                      />
                      <CharCounter value={jobDesc} max={2000} />
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={() => generate.mutate({ jobTitle, companyName, jobDescription: jobDesc })}
                      disabled={!jobTitle || !companyName || generate.isPending}
                    >
                      {generate.isPending
                        ? <><Sparkles size={16} className="animate-pulse" /> 생성 중...</>
                        : <><Sparkles size={16} /> 자기소개서 생성</>}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      value={generatedContent}
                      onChange={e => setGeneratedContent(e.target.value)}
                      rows={12}
                      className="text-sm"
                    />
                    <CharCounter value={generatedContent} max={1500} />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          save.mutate({ title: `${companyName} - ${jobTitle} 자기소개서`, content: generatedContent });
                          setGenOpen(false);
                          setGeneratedContent("");
                        }}
                        disabled={save.isPending}
                      >
                        <Save size={16} className="mr-2" /> 저장
                      </Button>
                      <Button variant="outline" onClick={() => setGeneratedContent("")}>다시 생성</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 편집 모드 */}
        {editId && (
          <Card className="border-primary shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">자기소개서 편집</CardTitle>
                {/* 편집 모드에서도 템플릿 선택 가능 */}
                <Select onValueChange={(key) => {
                  const tpl = JOB_TEMPLATES[key];
                  if (!tpl) return;
                  if (editContent && !confirm("현재 내용을 템플릿으로 교체하시겠습니까?")) return;
                  setEditContent(tpl.template);
                  if (!editTitle) setEditTitle(`${tpl.label} 자기소개서`);
                  toast.success(`'${tpl.label}' 템플릿 적용`);
                }}>
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <SelectValue placeholder="템플릿 적용" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(JOB_TEMPLATES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="제목" />
              <div>
                <Textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={14}
                  className="text-sm"
                  placeholder="자기소개서 내용을 입력하거나 AI로 생성하세요..."
                />
                <CharCounter value={editContent} max={1500} />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => save.mutate({ id: editId, title: editTitle, content: editContent })}
                  disabled={save.isPending}
                >
                  <Save size={16} className="mr-2" /> 저장
                </Button>
                <Button variant="outline" onClick={() => setEditId(null)}>취소</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 자기소개서 목록 */}
        {letters.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText size={48} className="mx-auto opacity-30 mb-4" />
            <p className="mb-3">아직 작성된 자기소개서가 없습니다.</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => setGenOpen(true)}>
                <Sparkles size={14} className="mr-1.5" /> AI로 생성하기
              </Button>
              <Button variant="outline" onClick={() => {
                const tpl = JOB_TEMPLATES["graphic_designer"];
                setEditId(-1);
                setEditContent(tpl.template);
                setEditTitle("그래픽 디자이너 자기소개서");
              }}>
                <LayoutTemplate size={14} className="mr-1.5" /> 템플릿으로 시작
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {(letters as any[]).map((letter) => (
              <Card key={letter.id} className={editId === letter.id ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{letter.title ?? "제목 없음"}</h3>
                        {letter.isAiGenerated && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            <Sparkles size={10} className="mr-1" /> AI 생성
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(letter.updatedAt), { addSuffix: true, locale: ko })}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {letter.content.length.toLocaleString()}자
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(letter)}>
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("삭제하시겠습니까?")) deleteLetter.mutate({ id: letter.id }); }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line leading-relaxed">
                    {letter.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
