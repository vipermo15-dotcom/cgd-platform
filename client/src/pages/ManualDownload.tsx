import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, Download, FileText,
  GraduationCap, Shield, Loader2, CheckCircle2, Building2, Eye
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ManualRole = "admin" | "student" | "training";

interface ManualInfo {
  role: ManualRole;
  title: string;
  filename: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  accentClass: string;
  badge: string;
  sections: string[];
}

const MANUAL_LIST: ManualInfo[] = [
  {
    role: "admin",
    title: "관리자(학과장) 매뉴얼",
    filename: "CGD_관리자_학과장_매뉴얼.pdf",
    description: "학생 관리, 피드백 작성, HRD-Net 보고서 출력, 통계 확인 등 학과장 전용 기능 안내",
    icon: <Shield size={22} />,
    colorClass: "text-blue-600 bg-blue-50 border-blue-100",
    accentClass: "bg-blue-600",
    badge: "학과장",
    sections: [
      "시스템 개요",
      "로그인 및 역할 설정",
      "대시보드 사용법",
      "학생 관리",
      "HRD-Net 보고서 출력",
      "주요 알림 이벤트",
      "문의 및 지원",
    ],
  },
  {
    role: "student",
    title: "교육생(재학생) 매뉴얼",
    filename: "CGD_교육생_재학생_매뉴얼.pdf",
    description: "포트폴리오 등록, AI 역량 분석, 자기소개서 생성, 채용공고 지원 등 재학생 기능 안내",
    icon: <GraduationCap size={22} />,
    colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
    accentClass: "bg-emerald-600",
    badge: "재학생",
    sections: [
      "시스템 개요",
      "로그인 및 프로필 설정",
      "포트폴리오 관리",
      "AI 역량 분석",
      "AI 자기소개서 생성",
      "채용공고 탐색 및 지원",
      "지원 현황 확인",
      "공개 포트폴리오 공유",
    ],
  },
  {
    role: "training",
    title: "공동훈련센터 매뉴얼",
    filename: "CGD_공동훈련센터_매뉴얼.pdf",
    description: "협력기업 관리, AI 기업-학생 매칭, 취업 연계 통계 확인 등 공동훈련센터 기능 안내",
    icon: <Building2 size={22} />,
    colorClass: "text-purple-600 bg-purple-50 border-purple-100",
    accentClass: "bg-purple-600",
    badge: "공동훈련센터",
    sections: [
      "시스템 개요",
      "로그인 및 역할 설정",
      "대시보드 사용법",
      "협력기업 관리",
      "AI 기업-학생 매칭",
      "취업 연계 통계",
      "알림 및 커뮤니케이션",
    ],
  },
];

// ─── 매뉴얼 카드 ──────────────────────────────────────────────────────────────

function ManualCard({ manual, isMyRole }: { manual: ManualInfo; isMyRole: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const { refetch } = trpc.manual.getManualHtml.useQuery(
    { role: manual.role },
    { enabled: false }
  );

  /** HTML 문자열을 Blob URL로 변환해 새 탭에서 열고 인쇄 다이얼로그 표시 */
  const handleDownload = async () => {
    setStatus("loading");
    try {
      const result = await refetch();
      const html = result.data?.html;
      if (!html) throw new Error("매뉴얼 데이터를 불러올 수 없습니다.");

      // Blob URL 방식 — 팝업 차단 없이 동작
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");

      if (!win) {
        // 팝업이 차단된 경우 직접 다운로드 링크 생성
        const a = document.createElement("a");
        a.href = url;
        a.download = manual.filename.replace(".pdf", ".html");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.info("HTML 파일로 저장되었습니다. 브라우저에서 열어 인쇄(Ctrl+P) → PDF 저장을 선택하세요.");
      } else {
        // 창이 열리면 폰트 로드 후 인쇄 다이얼로그 자동 실행
        win.addEventListener("load", () => {
          setTimeout(() => {
            win.print();
          }, 600);
        });
        toast.success(
          `인쇄 창이 열렸습니다. 대상(Destination)에서 "PDF로 저장"을 선택하세요.`,
          { duration: 6000 }
        );
      }

      // Blob URL 메모리 해제 (지연)
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e: any) {
      toast.error(e.message ?? "다운로드 중 오류가 발생했습니다.");
      setStatus("idle");
    }
  };

  /** 미리보기 — 새 탭에서 HTML 렌더링 */
  const handlePreview = async () => {
    try {
      const result = await refetch();
      const html = result.data?.html;
      if (!html) return;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error("미리보기를 불러올 수 없습니다.");
    }
  };

  return (
    <Card className={`border transition-shadow hover:shadow-md ${isMyRole ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* 아이콘 */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${manual.colorClass}`}>
            {manual.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* 제목 + 배지 */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-slate-800">{manual.title}</h3>
              <Badge variant="secondary" className="text-xs">{manual.badge}</Badge>
              {isMyRole && (
                <Badge className="text-xs bg-blue-600 text-white">내 역할</Badge>
              )}
            </div>

            <p className="text-sm text-slate-500 mb-3 leading-relaxed">{manual.description}</p>

            {/* 목차 미리보기 */}
            <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">포함 내용</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-3">
                {manual.sections.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CheckCircle2 size={11} className="text-slate-300 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleDownload}
                disabled={status === "loading"}
                size="sm"
                className="gap-1.5"
              >
                {status === "loading" ? (
                  <><Loader2 size={14} className="animate-spin" /> 준비 중...</>
                ) : status === "done" ? (
                  <><CheckCircle2 size={14} /> 완료!</>
                ) : (
                  <><Download size={14} /> PDF 다운로드</>
                )}
              </Button>
              <Button
                onClick={handlePreview}
                disabled={status === "loading"}
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                <Eye size={14} /> 미리보기
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default function ManualDownloadPage() {
  const { user } = useAuth();

  const roleMap: Record<string, ManualRole> = {
    admin: "admin",
    professor: "admin",
    student: "student",
    training_center: "training",
    company: "admin",
  };
  const userRole = user?.role ? (roleMap[user.role as string] ?? null) : null;

  // 내 역할 매뉴얼을 맨 위로
  const sortedManuals = userRole
    ? [
        ...MANUAL_LIST.filter((m) => m.role === userRole),
        ...MANUAL_LIST.filter((m) => m.role !== userRole),
      ]
    : MANUAL_LIST;

  return (
    <AppLayout title="사용자 매뉴얼">
      <div className="p-6 space-y-6 pb-20 lg:pb-6 max-w-2xl">
        {/* 헤더 */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-lg">사용자 매뉴얼 다운로드</h2>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
              역할별 매뉴얼을 PDF로 저장하여 오프라인에서도 참고하세요.
            </p>
          </div>
        </div>

        <Separator />

        {/* 매뉴얼 목록 */}
        <div className="space-y-4">
          {sortedManuals.map((manual) => (
            <ManualCard
              key={manual.role}
              manual={manual}
              isMyRole={manual.role === userRole}
            />
          ))}
        </div>

        {/* PDF 저장 방법 안내 */}
        <Card className="border-0 bg-amber-50 border border-amber-100">
          <CardContent className="p-4 flex items-start gap-3">
            <FileText size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">PDF 저장 방법</p>
              <ol className="text-xs text-amber-700 space-y-1 leading-relaxed list-decimal list-inside">
                <li><strong>PDF 다운로드</strong> 버튼 클릭 → 인쇄 창 자동 열림</li>
                <li>인쇄 창의 <strong>대상(Destination)</strong>에서 <strong>"PDF로 저장"</strong> 선택</li>
                <li><strong>저장</strong> 버튼 클릭하여 원하는 위치에 저장</li>
              </ol>
              <p className="text-xs text-amber-600 mt-2">
                ※ 팝업이 차단된 경우 브라우저 주소창 오른쪽 팝업 허용 버튼을 클릭하거나,
                <strong> 미리보기</strong> 버튼으로 열어 직접 인쇄(Ctrl+P)하세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
