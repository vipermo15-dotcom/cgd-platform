import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Search, Sparkles, ShieldCheck } from "lucide-react";

// 비로그인 학생도 이름 + 전화번호 뒷자리 4자리만으로 본인 취업분야에 맞는
// 포트폴리오 가이드 링크를 받아볼 수 있는 공개 페이지.
// 개인정보 보호: 서버는 이름+전화번호 뒷자리가 모두 일치하는 경우에만 결과를 반환하고,
// 어떤 부분이 틀렸는지는 알려주지 않는다. 목록(로스터) 자체는 클라이언트로 절대 내려주지 않는다.
export default function PortfolioGuideLookup() {
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");

  const lookup = trpc.guidance.lookupPortfolioGuide.useMutation();

  const canSubmit = name.trim().length > 0 && /^\d{4}$/.test(phoneLast4) && !lookup.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    lookup.mutate({ name: name.trim(), phoneLast4 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">내 포트폴리오 가이드 찾기</CardTitle>
            <p className="text-sm text-muted-foreground">
              이름과 전화번호 뒷자리 4자리를 입력하면, 본인 취업분야에 맞는
              포트폴리오 실전 가이드로 바로 연결해드려요.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone4">전화번호 뒷자리 4자리</Label>
                <Input
                  id="phone4"
                  value={phoneLast4}
                  onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={!canSubmit}>
                <Search className="w-4 h-4" />
                {lookup.isPending ? "조회 중..." : "가이드 찾기"}
              </Button>
            </form>

            {lookup.isError && (
              <p className="mt-4 text-sm text-center text-destructive">
                {lookup.error.data?.code === "TOO_MANY_REQUESTS"
                  ? lookup.error.message
                  : "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요."}
              </p>
            )}

            {lookup.isSuccess && !lookup.data.found && (
              <p className="mt-4 text-sm text-center text-muted-foreground">
                일치하는 정보를 찾을 수 없어요. 이름과 전화번호 뒷자리를 다시 확인해주시거나,
                강사에게 문의해주세요.
              </p>
            )}

            {lookup.isSuccess && lookup.data.found && (
              <div className="mt-5 space-y-3 border-t pt-4">
                <p className="text-sm text-center">
                  <span className="font-semibold">{lookup.data.name}</span>님의 취업분야는{" "}
                  <span className="font-semibold text-primary">{lookup.data.trackLabel}</span>입니다.
                </p>
                {lookup.data.guideUrl ? (
                  <a href={lookup.data.guideUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full gap-2">
                      {lookup.data.trackLabel} 실무가이드 열기
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                ) : (
                  <p className="text-xs text-center text-muted-foreground">
                    아직 취업분야가 배정되지 않았어요. 강사와 먼저 상담해주세요.
                  </p>
                )}
                <a href={lookup.data.workbookUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    전체 포트폴리오 워크북 보기
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          입력하신 정보는 본인 확인 용도로만 사용되며 별도로 저장되지 않습니다.
        </p>
      </div>
    </div>
  );
}
