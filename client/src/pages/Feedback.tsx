import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Send, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── 공통 UI ──────────────────────────────────────────────────────────────────

function RatingField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const labels = ["매우 불만", "불만", "보통", "만족", "매우 만족"];
  return (
    <div className="flex gap-1.5 flex-wrap">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(String(n))}
          className={cn(
            "w-10 h-10 rounded-lg border text-sm font-semibold transition-colors",
            value === String(n)
              ? "bg-primary text-white border-primary"
              : "border-border bg-background hover:border-primary/50 text-muted-foreground"
          )}
          title={labels[n - 1]}
        >
          {n}
        </button>
      ))}
      {value && (
        <span className="text-xs text-muted-foreground self-center ml-1">{labels[Number(value) - 1]}</span>
      )}
    </div>
  );
}

function YesNoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {["예", "아니오"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-5 py-2 rounded-lg border text-sm font-medium transition-colors",
            value === opt
              ? "bg-primary text-white border-primary"
              : "border-border bg-background hover:border-primary/50 text-muted-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultiCheckField({ options, values, onChange }: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    values.includes(opt) ? onChange(values.filter((x) => x !== opt)) : onChange([...values, opt]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
            values.includes(opt)
              ? "bg-primary text-white border-primary"
              : "border-border bg-background hover:border-primary/50 text-muted-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function QItem({ num, question, hint, children }: {
  num: string; question: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5 py-4 border-b border-border last:border-0">
      <div>
        <span className="text-xs font-bold text-primary mr-2">{num}</span>
        <span className="text-sm font-medium">{question}</span>
        {hint && <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">🆕</span>}
      </div>
      {children}
    </div>
  );
}

type SurveyProps = {
  answers: Record<string, string>;
  setAnswer: (k: string, v: string) => void;
  multiAnswers: Record<string, string[]>;
  setMultiAnswer: (k: string, v: string[]) => void;
};

// ─── 역할별 설문 ──────────────────────────────────────────────────────────────

function AdminSurvey({ answers, setAnswer, multiAnswers, setMultiAnswer }: SurveyProps) {
  return (
    <>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">A. 대시보드 & 데이터 관리</CardTitle></CardHeader>
        <CardContent>
          <QItem num="A-1" question="대시보드의 취업 현황 통계가 의사결정에 충분한 정보를 제공하고 있나요?">
            <RatingField id="A1" value={answers.A1??""} onChange={(v)=>setAnswer("A1",v)} />
          </QItem>
          <QItem num="A-2" question="학생별 포트폴리오 완성도·AI 분석 결과를 한눈에 파악하는 기능이 필요하신가요?">
            <YesNoField value={answers.A2??""} onChange={(v)=>setAnswer("A2",v)} />
          </QItem>
          <QItem num="A-3" question="월별·분기별 성과 리포트를 PDF/엑셀로 자동 생성하면 유용할까요?" hint="신규">
            <RatingField id="A3" value={answers.A3??""} onChange={(v)=>setAnswer("A3",v)} />
          </QItem>
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">B. 공동훈련센터 협업</CardTitle></CardHeader>
        <CardContent>
          <QItem num="B-1" question="공동훈련센터와 취업처 정보 실시간 공유 기능이 원활하게 작동하고 있나요?">
            <RatingField id="B1" value={answers.B1??""} onChange={(v)=>setAnswer("B1",v)} />
          </QItem>
          <QItem num="B-2" question="협력기업 채용 요청에 학과에서 학생을 직접 매칭하는 기능이 필요하신가요?" hint="신규">
            <YesNoField value={answers.B2??""} onChange={(v)=>setAnswer("B2",v)} />
          </QItem>
          <QItem num="B-3" question="타 학과와 취업처를 공동 공유하는 기능이 있다면 활용할 의향이 있으신가요?">
            <RatingField id="B3" value={answers.B3??""} onChange={(v)=>setAnswer("B3",v)} />
          </QItem>
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">C. 운영 효율 & 만족도</CardTitle></CardHeader>
        <CardContent>
          <QItem num="C-1" question="플랫폼에서 가장 불편하거나 누락된 기능이 있다면 적어주세요.">
            <Textarea rows={3} placeholder="자유 의견" value={answers.C1??""} onChange={(e)=>setAnswer("C1",e.target.value)} className="text-sm" />
          </QItem>
          <QItem num="C-2" question="카카오/이메일 알림 연동이 추가된다면 유용할까요?" hint="신규">
            <YesNoField value={answers.C2??""} onChange={(v)=>setAnswer("C2",v)} />
          </QItem>
          <QItem num="C-3" question="플랫폼 전체 만족도를 평가해 주세요.">
            <RatingField id="C3" value={answers.C3??""} onChange={(v)=>setAnswer("C3",v)} />
          </QItem>
        </CardContent>
      </Card>
    </>
  );
}

function ProfessorSurvey({ answers, setAnswer }: SurveyProps) {
  return (
    <>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">D. 포트폴리오 & AI 분석</CardTitle></CardHeader>
        <CardContent>
          <QItem num="D-1" question="AI 포트폴리오 분석 결과가 학생 취업 지도에 도움이 되고 있나요?">
            <RatingField id="D1" value={answers.D1??""} onChange={(v)=>setAnswer("D1",v)} />
          </QItem>
          <QItem num="D-2" question="AI 분석 리포트에 교수 코멘트 기능이 필요하신가요?" hint="신규">
            <YesNoField value={answers.D2??""} onChange={(v)=>setAnswer("D2",v)} />
          </QItem>
          <QItem num="D-3" question="자격증(GTQ 등) 취득 시 포트폴리오 자동 반영이 유용할까요?" hint="신규">
            <RatingField id="D3" value={answers.D3??""} onChange={(v)=>setAnswer("D3",v)} />
          </QItem>
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">E–F. 수업 연계 & 기타</CardTitle></CardHeader>
        <CardContent>
          <QItem num="E-1" question="수업 과제를 플랫폼 포트폴리오에 직접 업로드·연동할 수 있다면 활용할 의향이 있으신가요?">
            <RatingField id="E1" value={answers.E1??""} onChange={(v)=>setAnswer("E1",v)} />
          </QItem>
          <QItem num="E-2" question="학생 참여도 지표(로그인 빈도·업데이트율)가 필요하신가요?" hint="신규">
            <YesNoField value={answers.E2??""} onChange={(v)=>setAnswer("E2",v)} />
          </QItem>
          <QItem num="F-1" question="플랫폼에 추가되었으면 하는 기능을 자유롭게 작성해 주세요.">
            <Textarea rows={3} placeholder="자유 의견" value={answers.F1??""} onChange={(e)=>setAnswer("F1",e.target.value)} className="text-sm" />
          </QItem>
          <QItem num="F-2" question="교수 입장에서 플랫폼 전체 만족도를 평가해 주세요.">
            <RatingField id="F2" value={answers.F2??""} onChange={(v)=>setAnswer("F2",v)} />
          </QItem>
        </CardContent>
      </Card>
    </>
  );
}

function TrainingSurvey({ answers, setAnswer }: SurveyProps) {
  return (
    <>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">G. 인재 풀 & 매칭</CardTitle></CardHeader>
        <CardContent>
          <QItem num="G-1" question="인재 풀에서 스킬셋 기준으로 학생 필터링이 충분히 작동하고 있나요?">
            <RatingField id="G1" value={answers.G1??""} onChange={(v)=>setAnswer("G1",v)} />
          </QItem>
          <QItem num="G-3" question="학과별 졸업생 취업 이력 통합 조회가 필요한가요?" hint="신규">
            <RatingField id="G3" value={answers.G3??""} onChange={(v)=>setAnswer("G3",v)} />
          </QItem>
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">H–I. 취업처 공유 & 만족도</CardTitle></CardHeader>
        <CardContent>
          <QItem num="H-1" question="학과↔센터 취업처 정보 실시간 공유가 효과적으로 활용되고 있나요?">
            <RatingField id="H1" value={answers.H1??""} onChange={(v)=>setAnswer("H1",v)} />
          </QItem>
          <QItem num="H-2" question="채용 공고 등록 즉시 교수·학생 자동 알림이 필요하다고 생각하시나요?" hint="신규">
            <YesNoField value={answers.H2??""} onChange={(v)=>setAnswer("H2",v)} />
          </QItem>
          <QItem num="H-3" question="기업별 채용 이력(재채용 의향 등) 관리가 유용할까요?" hint="신규">
            <RatingField id="H3" value={answers.H3??""} onChange={(v)=>setAnswer("H3",v)} />
          </QItem>
          <QItem num="I-1" question="플랫폼 사용 시 가장 불편한 점은 무엇인가요?">
            <Textarea rows={3} placeholder="자유 의견" value={answers.I1??""} onChange={(e)=>setAnswer("I1",e.target.value)} className="text-sm" />
          </QItem>
          <QItem num="I-2" question="플랫폼 전체 만족도를 평가해 주세요.">
            <RatingField id="I2" value={answers.I2??""} onChange={(v)=>setAnswer("I2",v)} />
          </QItem>
        </CardContent>
      </Card>
    </>
  );
}

function StudentSurvey({ answers, setAnswer, multiAnswers, setMultiAnswer }: SurveyProps) {
  return (
    <>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">J. 포트폴리오 & 구직</CardTitle></CardHeader>
        <CardContent>
          <QItem num="J-1" question="AI 포트폴리오 분석 기능(강점·약점 진단)을 사용해 본 적이 있나요?">
            <YesNoField value={answers.J1??""} onChange={(v)=>setAnswer("J1",v)} />
          </QItem>
          <QItem num="J-2" question="AI가 추천한 채용 공고가 내 희망 직종·실력과 잘 맞나요?">
            <RatingField id="J2" value={answers.J2??""} onChange={(v)=>setAnswer("J2",v)} />
          </QItem>
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">K. UX & 접근성</CardTitle></CardHeader>
        <CardContent>
          <QItem num="K-1" question="플랫폼을 주로 어떤 기기로 이용하시나요? (복수 선택 가능)">
            <MultiCheckField
              options={["PC / 노트북", "Android 폰", "iPhone", "태블릿"]}
              values={multiAnswers.K1??[]}
              onChange={(v)=>setMultiAnswer("K1",v)}
            />
          </QItem>
          <QItem num="K-2" question="모바일 사용 시 불편한 점이 있나요?" hint="신규">
            <Textarea rows={2} placeholder="예: 글씨가 작다, 탭이 불편하다" value={answers.K2??""} onChange={(e)=>setAnswer("K2",e.target.value)} className="text-sm" />
          </QItem>
          <QItem num="K-3" question="카카오톡으로 채용 공고 알림을 받으면 방문 빈도가 늘어날 것 같나요?" hint="신규">
            <RatingField id="K3" value={answers.K3??""} onChange={(v)=>setAnswer("K3",v)} />
          </QItem>
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">L. 취업 준비 지원</CardTitle></CardHeader>
        <CardContent>
          <QItem num="L-1" question="자기소개서 AI 초안 작성 기능이 있다면 사용하실 건가요?" hint="신규">
            <YesNoField value={answers.L1??""} onChange={(v)=>setAnswer("L1",v)} />
          </QItem>
          <QItem num="L-2" question="모의 면접 Q&A(AI 면접관)가 추가된다면 얼마나 유용할 것 같나요?" hint="신규">
            <RatingField id="L2" value={answers.L2??""} onChange={(v)=>setAnswer("L2",v)} />
          </QItem>
          <QItem num="L-3" question="수료 후에도 플랫폼에서 취업 알림·합격 후기를 계속 받고 싶으신가요?" hint="신규">
            <YesNoField value={answers.L3??""} onChange={(v)=>setAnswer("L3",v)} />
          </QItem>
          <QItem num="L-4" question="플랫폼에서 가장 필요한 기능을 자유롭게 작성해 주세요.">
            <Textarea rows={3} placeholder="자유 의견" value={answers.L4??""} onChange={(e)=>setAnswer("L4",e.target.value)} className="text-sm" />
          </QItem>
          <QItem num="L-5" question="전반적인 플랫폼 만족도를 평가해 주세요.">
            <RatingField id="L5" value={answers.L5??""} onChange={(v)=>setAnswer("L5",v)} />
          </QItem>
        </CardContent>
      </Card>
    </>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: "학과장", professor: "교수", training_center: "공동훈련센터", student: "재학 교육생",
};
const ROLE_SECTION: Record<string, string> = {
  admin: "A–C 섹션", professor: "D–F 섹션", training_center: "G–I 섹션", student: "J–L 섹션",
};

export default function Feedback() {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const role = user?.role ?? "student";

  const setAnswer = (k: string, v: string) => setAnswers((p) => ({ ...p, [k]: v }));
  const setMultiAnswer = (k: string, v: string[]) => setMultiAnswers((p) => ({ ...p, [k]: v }));

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combined: Record<string, unknown> = { ...answers };
    for (const [k, arr] of Object.entries(multiAnswers)) combined[k] = arr.join(", ");
    submitMutation.mutate({ role: ROLE_LABELS[role] ?? role, name: user?.name, answers: combined });
  };

  if (submitted) {
    return (
      <AppLayout title="플랫폼 피드백">
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">설문 제출 완료!</h2>
            <p className="text-sm text-muted-foreground">소중한 의견 감사합니다.</p>
            <p className="text-xs text-muted-foreground mt-1">학과장이 플랫폼 내에서 확인 후 반영합니다.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="플랫폼 피드백">
      <div className="p-3 lg:p-6 max-w-2xl mx-auto pb-20 lg:pb-6">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquarePlus size={18} className="text-primary" />
            <h2 className="text-lg font-bold">CGD 플랫폼 개선 설문</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{ROLE_LABELS[role] ?? role}</span> 대상 · {ROLE_SECTION[role]} · 약 3분
          </p>
          <p className="text-xs text-muted-foreground mt-1">1=매우 불만 · 5=매우 만족 · 🆕 = 신규 기능 제안 의견</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === "admin" && <AdminSurvey answers={answers} setAnswer={setAnswer} multiAnswers={multiAnswers} setMultiAnswer={setMultiAnswer} />}
          {role === "professor" && <ProfessorSurvey answers={answers} setAnswer={setAnswer} multiAnswers={multiAnswers} setMultiAnswer={setMultiAnswer} />}
          {role === "training_center" && <TrainingSurvey answers={answers} setAnswer={setAnswer} multiAnswers={multiAnswers} setMultiAnswer={setMultiAnswer} />}
          {(role === "student" || !["admin","professor","training_center"].includes(role)) && (
            <StudentSurvey answers={answers} setAnswer={setAnswer} multiAnswers={multiAnswers} setMultiAnswer={setMultiAnswer} />
          )}

          {submitMutation.error && (
            <p className="text-sm text-red-500 text-center">제출에 실패했습니다. 다시 시도해 주세요.</p>
          )}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={submitMutation.isPending}>
            <Send size={16} />
            {submitMutation.isPending ? "제출 중..." : "설문 제출하기"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">제출된 답변은 플랫폼 DB에 저장되어 학과장이 확인합니다</p>
        </form>
      </div>
    </AppLayout>
  );
}
