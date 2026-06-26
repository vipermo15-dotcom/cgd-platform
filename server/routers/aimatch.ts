import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { sanitizeForPrompt, sanitizeList, UNTRUSTED_DATA_NOTICE, wrapUntrusted } from "../_core/promptSafety";
import {
  getDb,
  getStudentProfile,
  getLatestAiAnalysis,
  getUserPortfolios,
  getPortfolioItems,
  getJobPostings,
  getPartnerCompanies,
  getAllStudents,
  getUserById,
  createJobApplication,
  createNotification,
  createAiLog,
} from "../db";
import { careerGuidance } from "../../drizzle/schema";

// 분석/매칭 권한: 학과장 / 관리자 / 공동훈련센터 (admin 항상 통과)
const REVIEWER_ROLES = ["admin", "professor", "training_center"];
function assertReviewer(role: string) {
  if (!REVIEWER_ROLES.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "AI 매칭 권한이 없습니다." });
  }
}

type MatchedPosting = { postingId: number; matchScore: number; reason: string };
type SuggestedType = { companyType: string; jobTitle: string; reason: string; matchScore: number };

// ─── 학생 1명 자동 분석 (공유 헬퍼) ───────────────────────────────────────────
async function analyzeOneStudent(studentUserId: number, reviewerUserId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  // 1. 학생 데이터 자동 수집
  const profile = await getStudentProfile(studentUserId);
  const analysis = await getLatestAiAnalysis(studentUserId);
  const portfolios = await getUserPortfolios(studentUserId);
  const portfolioItems = portfolios.length > 0 ? await getPortfolioItems(portfolios[0].id) : [];

  const skills = (profile?.skills as string[] | null) ?? [];
  const scores = (analysis?.scores as Record<string, number> | null) ?? {};
  const topFields = Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 3).map(([k]) => k);

  // 2. 매칭 후보: 실제 승인 공고 + 협력기업
  const postings = await getJobPostings({ status: "approved", limit: 30 });
  const partners = await getPartnerCompanies({ status: "active" });

  const postingsForPrompt = postings.map((p: any) => ({
    id: p.posting.id,
    title: sanitizeForPrompt(p.posting.title, 150),
    company: sanitizeForPrompt(p.company?.companyName, 100),
    category: sanitizeForPrompt(p.posting.category, 80),
    requiredSkills: sanitizeList(p.posting.requiredSkills as string[] | null),
    employmentType: p.posting.employmentType,
  }));

  const studentSummary = `보유 스킬: ${sanitizeList(skills)}
전공: ${sanitizeForPrompt(profile?.major, 100)}
AI 역량 상위분야: ${sanitizeList(topFields)}
역량 점수: ${sanitizeForPrompt(JSON.stringify(scores), 300)}
포트폴리오 작품: ${sanitizeList(portfolioItems.map((i: any) => i.title), 15, 100)}`;

  const prompt = `당신은 컴퓨터그래픽디자인 취업 매칭 전문가입니다.
아래 교육생 정보를 분석해, 제공된 '실제 채용공고 목록' 중 적합한 공고를 매칭하고,
부족하면 일반 취업처 유형도 보완 제안하세요.

${wrapUntrusted("STUDENT", studentSummary)}

실제 채용공고 목록(JSON):
${wrapUntrusted("POSTINGS", JSON.stringify(postingsForPrompt))}

다음 JSON 형식으로만 응답하세요:
{
  "matchedPostings": [{"postingId": 공고id(number), "matchScore": 0-100, "reason": "매칭 이유"}],
  "suggestedTypes": [{"companyType": "회사 유형", "jobTitle": "직무", "reason": "추천 이유", "matchScore": 0-100}],
  "summary": "한 줄 종합 매칭 코멘트"
}
규칙: matchedPostings는 위 목록의 실제 id만 사용 / 적합 공고 없으면 빈 배열 / suggestedTypes는 2~4개`;

  let tokensUsed = 0;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: `당신은 취업 매칭 전문가입니다. JSON으로만 응답합니다. ${UNTRUSTED_DATA_NOTICE}` },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });
    tokensUsed = response.usage?.total_tokens ?? 0;
    const raw = response.choices[0]?.message?.content;
    const parsed = JSON.parse(typeof raw === "string" ? raw : "{}");

    const matched: MatchedPosting[] = Array.isArray(parsed.matchedPostings) ? parsed.matchedPostings : [];
    const suggested: SuggestedType[] = Array.isArray(parsed.suggestedTypes) ? parsed.suggestedTypes : [];

    // 실제 공고 객체로 해석
    const postingMap = new Map(postings.map((p: any) => [p.posting.id, p]));
    const matchedPostings = matched
      .filter((m) => postingMap.has(m.postingId))
      .map((m) => ({ ...postingMap.get(m.postingId), matchScore: m.matchScore, reason: m.reason }))
      .sort((a: any, b: any) => b.matchScore - a.matchScore);

    // 진로지도 카드의 추천 취업처 형식으로 변환 (실제 공고 + 유형 제안)
    const recommendedCompanies = [
      ...matchedPostings.map((p: any) => ({
        companyName: p.company?.companyName ?? p.posting.title,
        jobTitle: p.posting.title,
        reason: p.reason ?? "",
        matchScore: p.matchScore ?? 0,
      })),
      ...suggested.map((s) => ({
        companyName: `[유형] ${s.companyType}`,
        jobTitle: s.jobTitle,
        reason: s.reason,
        matchScore: s.matchScore,
      })),
    ];

    // 진로지도 카드에 저장 (upsert)
    const [existing] = await db
      .select({ id: careerGuidance.id })
      .from(careerGuidance)
      .where(eq(careerGuidance.studentUserId, studentUserId))
      .limit(1);
    if (existing) {
      await db.update(careerGuidance)
        .set({ recommendedCompanies, aiRecommendReason: parsed.summary ?? "AI 자동 매칭", professorUserId: reviewerUserId })
        .where(eq(careerGuidance.id, existing.id));
    } else {
      await db.insert(careerGuidance).values({
        studentUserId, professorUserId: reviewerUserId, careerTrack: "undecided",
        recommendedCompanies, aiRecommendReason: parsed.summary ?? "AI 자동 매칭",
      });
    }

    // 학생 알림
    await createNotification({
      userId: studentUserId,
      type: "ai_match",
      title: "AI 추천 취업처 도착",
      message: `학과장님이 AI로 분석한 추천 취업처 ${recommendedCompanies.length}곳이 진로지도 카드에 등록됐습니다.`,
      relatedType: "career_guidance",
    });

    await createAiLog({ userId: reviewerUserId, type: "ai_match", tokensUsed, success: true });
    return { matchedPostings, suggestedTypes: suggested, summary: parsed.summary ?? "", partnerCount: partners.length };
  } catch (error) {
    await createAiLog({ userId: reviewerUserId, type: "ai_match", tokensUsed, success: false });
    throw error;
  }
}

export const aiMatchRouter = router({
  // 검토자용 재학생 목록
  listStudents: protectedProcedure.query(async ({ ctx }) => {
    assertReviewer(ctx.user.role);
    const students = await getAllStudents();
    return students.map((s: any) => ({
      id: s.user.id,
      name: s.user.name ?? "이름 없음",
      email: s.user.email,
      major: s.profile?.major ?? null,
      employmentStatus: s.profile?.employmentStatus ?? null,
    }));
  }),

  // 학생 1명 AI 매칭 분석
  analyzeStudent: protectedProcedure
    .input(z.object({ studentUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      assertReviewer(ctx.user.role);
      return analyzeOneStudent(input.studentUserId, ctx.user.id);
    }),

  // 전체 재학생 일괄 분석 (최대 50명)
  analyzeAll: protectedProcedure.mutation(async ({ ctx }) => {
    assertReviewer(ctx.user.role);
    const students = await getAllStudents();
    const targets = students.slice(0, 50);
    const results: { studentUserId: number; name: string; matchedCount: number; success: boolean }[] = [];
    for (const s of targets) {
      try {
        const r = await analyzeOneStudent(s.user.id, ctx.user.id);
        results.push({ studentUserId: s.user.id, name: s.user.name ?? "교육생", matchedCount: r.matchedPostings.length, success: true });
      } catch {
        results.push({ studentUserId: s.user.id, name: s.user.name ?? "교육생", matchedCount: 0, success: false });
      }
    }
    return { total: targets.length, results };
  }),

  // 학과장이 학생 대신 실제 공고에 지원
  applyOnBehalf: protectedProcedure
    .input(z.object({ studentUserId: z.number(), jobPostingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      assertReviewer(ctx.user.role);
      const application = await createJobApplication({
        jobPostingId: input.jobPostingId,
        applicantUserId: input.studentUserId,
        status: "지원완료",
        matchedBy: ctx.user.id,
        matchNote: "학과장 AI 매칭 대신 지원",
      });
      if (!application) {
        throw new TRPCError({ code: "CONFLICT", message: "이미 지원한 공고입니다." });
      }
      await createNotification({
        userId: input.studentUserId,
        type: "job_applied",
        title: "채용공고 매칭 지원 완료",
        message: "학과장님이 AI 매칭 결과로 채용공고에 대신 지원했습니다. 지원 현황에서 확인하세요.",
        relatedId: input.jobPostingId,
        relatedType: "job_posting",
      });
      return { success: true };
    }),

  // 학생의 최근 매칭 결과(진로지도 카드) 조회 — 공동훈련센터 공유 포함
  getMatchResult: protectedProcedure
    .input(z.object({ studentUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      assertReviewer(ctx.user.role);
      const db = await getDb();
      if (!db) return null;
      const [card] = await db
        .select()
        .from(careerGuidance)
        .where(eq(careerGuidance.studentUserId, input.studentUserId))
        .orderBy(desc(careerGuidance.updatedAt))
        .limit(1);
      return card ?? null;
    }),
});
