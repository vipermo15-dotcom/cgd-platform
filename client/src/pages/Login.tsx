import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { GraduationCap, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// 카카오톡·인스타·라인 등 인앱 브라우저(WebView) 감지
function detectWebView(): boolean {
  const ua = navigator.userAgent;
  // 국내 주요 앱 인앱 브라우저
  if (/KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER|DaumApps/i.test(ua)) return true;
  // Android 일반 WebView (wv 플래그)
  if (/Android/.test(ua) && /wv\)/.test(ua)) return true;
  // iOS WebView: iPhone/iPad인데 Safari가 없는 경우
  if (/iPhone|iPad/.test(ua) && !/Safari/.test(ua)) return true;
  return false;
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

function openInChrome() {
  const url = window.location.href;
  // Android: intent URL로 Chrome 강제 실행
  window.location.href =
    "intent://" +
    url.replace(/^https?:\/\//, "") +
    "#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;end;";
}

function WebViewGuide() {
  const [copied, setCopied] = useState(false);
  const currentUrl = window.location.href;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 미지원 시 fallback
      const el = document.createElement("textarea");
      el.value = currentUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background px-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">CGD 취업지원 플랫폼</h1>
        <p className="text-muted-foreground mb-6">서울시기술교육원 컴퓨터그래픽디자인과</p>

        {/* 안내 박스 */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-orange-800 mb-1">⚠️ 외부 브라우저에서 열어주세요</p>
          <p className="text-xs text-orange-700 leading-relaxed">
            카카오톡·인스타그램 등 앱 내 브라우저에서는 구글 로그인이 차단됩니다.
            {isAndroid()
              ? " 아래 버튼으로 Chrome에서 열어주세요."
              : " URL을 복사해 Safari나 Chrome에 붙여넣어 주세요."}
          </p>
        </div>

        <div className="space-y-3">
          {isAndroid() ? (
            <Button size="lg" className="w-full gap-2" onClick={openInChrome}>
              <ExternalLink size={18} />
              Chrome으로 열기
            </Button>
          ) : null}

          <Button size="lg" variant="outline" className="w-full gap-2" onClick={copyUrl}>
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            {copied ? "복사 완료!" : "URL 복사하기"}
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {isAndroid()
            ? "Chrome이 없다면 URL을 복사해 다른 브라우저에 붙여넣어 주세요."
            : "복사한 URL을 Safari 또는 Chrome 주소창에 붙여넣어 주세요."}
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [webView] = useState(() => detectWebView());

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  // 인앱 브라우저면 외부 브라우저 유도 화면 표시
  if (webView) {
    return <WebViewGuide />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">CGD 취업지원 플랫폼</h1>
        <p className="text-muted-foreground mb-8">서울시기술교육원 컴퓨터그래픽디자인과</p>
        <a href={getLoginUrl()}>
          <Button size="lg">Manus 계정으로 로그인</Button>
        </a>
      </div>
    </div>
  );
}
