import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Globe, Lock, Eye, Trash2, Edit, Image, Video, Youtube, ExternalLink, Download } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

const CATEGORIES = ["브랜딩", "SNS 콘텐츠", "영상편집", "캐릭터/일러스트", "AI 생성", "편집디자인", "UI/UX", "기타"];

function PortfolioCard({ portfolio, onSelect }: { portfolio: any; onSelect: () => void }) {
  const utils = trpc.useUtils();
  const deletePortfolio = trpc.portfolio.delete.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("삭제되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const updatePortfolio = trpc.portfolio.update.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("변경되었습니다."); },
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{portfolio.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{portfolio.description}</p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {portfolio.isPublic ? (
              <Globe size={14} className="text-green-500" />
            ) : (
              <Lock size={14} className="text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Eye size={12} /> {portfolio.viewCount ?? 0}회 조회
          {portfolio.isPublic && portfolio.publicSlug && (
            <a
              href={`/portfolio/${portfolio.publicSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline ml-auto"
            >
              공개 URL <ExternalLink size={12} />
            </a>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={onSelect}>
            <Edit size={14} className="mr-1" /> 작품 관리
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updatePortfolio.mutate({ id: portfolio.id, isPublic: !portfolio.isPublic })}
          >
            {portfolio.isPublic ? <Lock size={14} /> : <Globe size={14} />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => { if (confirm("삭제하시겠습니까?")) deletePortfolio.mutate({ id: portfolio.id }); }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddItemDialog({ portfolioId, onClose }: { portfolioId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "youtube">("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [tools, setTools] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMedia = trpc.portfolio.uploadMedia.useMutation();
  const addItem = trpc.portfolio.addItem.useMutation({
    onSuccess: () => {
      utils.portfolio.getItems.invalidate({ portfolioId });
      toast.success("작품이 추가되었습니다.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const result = await uploadMedia.mutateAsync({
          fileName: file.name,
          contentType: file.type,
          base64Data: base64,
        });
        setMediaUrl(result.url);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("업로드 실패");
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!title) return toast.error("제목을 입력하세요.");
    if (!mediaUrl) return toast.error("미디어를 추가하세요.");
    addItem.mutate({
      portfolioId,
      title,
      description,
      category,
      mediaType,
      mediaUrl,
      tools: tools.split(",").map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>제목 *</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="작품 제목" className="mt-1" />
      </div>
      <div>
        <Label>설명</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="작품 설명" className="mt-1" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>카테고리</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>미디어 유형</Label>
          <Select value={mediaType} onValueChange={(v) => setMediaType(v as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">이미지</SelectItem>
              <SelectItem value="video">영상</SelectItem>
              <SelectItem value="youtube">YouTube URL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mediaType === "youtube" ? (
        <div>
          <Label>YouTube URL *</Label>
          <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1" />
        </div>
      ) : (
        <div>
          <Label>파일 업로드 *</Label>
          <div
            className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {mediaUrl ? (
              <div className="text-sm text-green-600">업로드 완료 ✓</div>
            ) : uploading ? (
              <div className="text-sm text-muted-foreground">업로드 중...</div>
            ) : (
              <div className="text-sm text-muted-foreground">클릭하여 파일 선택</div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={mediaType === "image" ? "image/*" : "video/*"}
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </div>
      )}

      <div>
        <Label>사용 툴 (쉼표 구분)</Label>
        <Input value={tools} onChange={e => setTools(e.target.value)} placeholder="Photoshop, Illustrator, After Effects" className="mt-1" />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={addItem.isPending || uploading}>
        {addItem.isPending ? "추가 중..." : "작품 추가"}
      </Button>
    </div>
  );
}

export default function StudentPortfolio() {
  const utils = trpc.useUtils();
  const { data: portfolios = [] } = trpc.portfolio.list.useQuery();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  const selectedPortfolio = portfolios.find((p: any) => p.id === selectedPortfolioId);
  const { data: items = [] } = trpc.portfolio.getItems.useQuery(
    { portfolioId: selectedPortfolioId! },
    { enabled: !!selectedPortfolioId }
  );

  const createPortfolio = trpc.portfolio.create.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); setCreateOpen(false); setNewTitle(""); toast.success("포트폴리오가 생성되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const deleteItem = trpc.portfolio.deleteItem.useMutation({
    onSuccess: () => { utils.portfolio.getItems.invalidate({ portfolioId: selectedPortfolioId! }); toast.success("삭제되었습니다."); },
  });

  return (
    <AppLayout title="포트폴리오 관리">
      <div className="p-6 space-y-6 pb-20 lg:pb-6">
        {/* Portfolio list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">내 포트폴리오</h2>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus size={16} /> 새 포트폴리오</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 포트폴리오 만들기</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>제목 *</Label>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="포트폴리오 제목" className="mt-1" />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => newTitle && createPortfolio.mutate({ title: newTitle })}
                    disabled={!newTitle || createPortfolio.isPending}
                  >
                    생성
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {portfolios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-3">아직 포트폴리오가 없습니다.</p>
              <Button variant="outline" onClick={() => setCreateOpen(true)}>첫 포트폴리오 만들기</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map((p: any) => (
                <PortfolioCard key={p.id} portfolio={p} onSelect={() => setSelectedPortfolioId(p.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Portfolio items */}
        {selectedPortfolio && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">{selectedPortfolio.title} — 작품 목록</h2>
                <p className="text-xs text-muted-foreground">{items.length}개 작품</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2"><Plus size={16} /> 작품 추가</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>작품 추가</DialogTitle>
                    </DialogHeader>
                    <AddItemDialog portfolioId={selectedPortfolioId!} onClose={() => setAddItemOpen(false)} />
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline" onClick={() => setSelectedPortfolioId(null)}>닫기</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item: any) => (
                <Card key={item.id} className="overflow-hidden group">
                  <div className="aspect-square bg-muted relative">
                    {item.mediaType === "image" && item.mediaUrl && (
                      <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
                    )}
                    {item.mediaType === "youtube" && (
                      <div className="w-full h-full flex items-center justify-center bg-red-50">
                        <Youtube size={32} className="text-red-500" />
                      </div>
                    )}
                    {item.mediaType === "video" && (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                        <Video size={32} className="text-blue-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { if (confirm("삭제?")) deleteItem.mutate({ id: item.id }); }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    {item.category && <Badge variant="secondary" className="text-xs mt-1">{item.category}</Badge>}
                  </div>
                </Card>
              ))}
              {items.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                  작품을 추가해주세요.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
