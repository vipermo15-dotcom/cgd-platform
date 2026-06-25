import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { resumes, coverLetters, portfolios, notifications } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sanitizeForPrompt, sanitizeList, UNTRUSTED_DATA_NOTICE } from "../_core/promptSafety";

// ─── 공통 스키마 ──────────────────────────────────────────────────────────────
const educationSchema = z.object({
  school: z.string(),
  major: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
});

const careerSchema = z.object({
  company: z.string(),
  position: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  type: z.string(),
  description: z.string(),
});

const certificateSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
});

const languageSchema = z.object({
  name: z.string(),
  level: z.string(),
  date: z.string(),
});

const approvalStepEnum = z.enum(["draft", "submitted", "reviewing", "approved", "rejected"]);

// ─── 헬퍼: 알림 생성 ─────────────────────────────────────────────────────────
async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  relatedId?: number,
  relatedType?: string,
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    isRead: false,
    relatedId,
    relatedType,
  });
}

export const resumeRouter = router({
  // ─── 교육생: 내 이력서 조회 ─────────────────────────────────────────────────
  getMyResume: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, ctx.user.id))
      .orderBy(desc(resumes.createdAt))
      .limit(1);
    return resume ?? null;
  }),

  // ─── 교육생: 이력서 저장 (upsert) ──────────────────────────────────────────
  saveResume: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        birthDate: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        education: z.array(educationSchema).optional(),
        career: z.array(careerSchema).optional(),
        certificates: z.array(certificateSchema).optional(),
        languages: z.array(languageSchema).optional(),
        skills: z.array(z.string()).optional(),
        summary: z.string().optional(),
        isPublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
      const [existing] = await db
        .select({ id: resumes.id })
        .from(resumes)
        .where(eq(resumes.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db.update(resumes).set({ ...input }).where(eq(resumes.id, existing.id));
        return { id: existing.id };
      } else {
        const [result] = await db.insert(resumes).values({
          userId: ctx.user.id,
          ...input,
        });
        return { id: (result as any).insertId };
      }
    }),

  // ─── 교육생: 이력서 제출 (draft → submitted) ────────────────────────────────
  submitResume: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
    const [existing] = await db
      .select({ id: resumes.id, approvalStep: resumes.approvalStep })
      .from(resumes)
      .where(eq(resumes.userId, ctx.user.id))
      .limit(1);

    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "이력서를 먼저 작성해주세요." });
    if (existing.approvalStep !== "draft" && existing.approvalStep !== "rejected") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "이미 제출된 이력서입니다." });
    }

    await db
      .update(resumes)
      .set({ approvalStep: "submitted", submittedAt: new Date() })
      .where(eq(resumes.id, existing.id));

    return { success: true };
  }),

  // ─── 교육생: 내 자기소개서 목록 ─────────────────────────────────────────────
  getMyCoverLetters: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
    return db
      .select()
      .from(coverLetters)
      .where(eq(coverLetters.userId, ctx.user.id))
      .orderBy(desc(coverLetters.createdAt));
  }),

  // ─── 교육생: 자기소개서 저장 ─────────────────────────────────────────────────
  saveCoverLetter: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        title: z.string().min(1),
        content: z.string().min(1),
        jobPostingId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
      if (input.id) {
        const [existing] = await db
          .select({ id: coverLetters.id, userId: coverLetters.userId })
          .from(coverLetters)
          .where(eq(coverLetters.id, input.id))
          .limit(1);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db
          .update(coverLetters)
          .set({ title: input.title, content: input.content, jobPostingId: input.jobPostingId })
          .where(eq(coverLetters.id, input.id));
        return { id: input.id };
      } else {
        const [result] = await db.insert(coverLetters).values({
          userId: ctx.user.id,
          title: input.title,
          content: input.content,
          jobPostingId: input.jobPostingId,
          isAiGenerated: false,
        });
        return { id: (result as any).insertId };
      }
    }),

  // ─── 교육생: 자기소개서 삭제 ─────────────────────────────────────────────────
  deleteCoverLetter: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
      const [existing] = await db
        .select({ id: coverLetters.id, userId: coverLetters.userId })
        .from(coverLetters)
        .where(eq(coverLetters.id, input.id))
        .limit(1);
      if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(coverLetters).where(eq(coverLetters.id, input.id));
      return { success: true };
    }),

  // ─── 교육생: 자기소개서 제출 ─────────────────────────────────────────────────
  submitCoverLetter: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
      const [existing] = await db
        .select({ id: coverLetters.id, userId: coverLetters.userId, approvalStep: coverLetters.approvalStep })
        .from(coverLetters)
        .where(eq(coverLetters.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (existing.approvalStep !== "draft" && existing.approvalStep !== "rejected") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "이미 제출된 자기소개서입니다." });
      }

      await db
        .update(coverLetters)
        .set({ approvalStep: "submitted", submittedAt: new Date() })
        .where(eq(coverLetters.id, input.id));

      return { success: true };
    }),

  // ─── 교육생: 포트폴리오 PDF/URL 저장 ────────────────────────────────────────
  savePortfolioLink: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        portfolioType: z.enum(["pdf", "url"]),
        pdfUrl: z.string().optional(),
        externalUrl: z.string().optional(),
        isPublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
      if (input.id) {
        const [existing] = await db
          .select({ id: portfolios.id, userId: portfolios.userId })
          .from(portfolios)
          .where(eq(portfolios.id, input.id))
          .limit(1);
        if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await db
          .update(portfolios)
          .set({
            title: input.title,
            description: input.description,
            portfolioType: input.portfolioType,
            pdfUrl: input.pdfUrl,
            externalUrl: input.externalUrl,
            isPublic: input.isPublic ?? false,
          })
          .where(eq(portfolios.id, input.id));
        return { id: input.id };
      } else {
        const [result] = await db.insert(portfolios).values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          portfolioType: input.portfolioType,
          pdfUrl: input.pdfUrl,
          externalUrl: input.externalUrl,
          isPublic: input.isPublic ?? false,
        });
        return { id: (result as any).insertId };
      }
    }),

  // ─── 교육생: 내 포트폴리오 목록 ─────────────────────────────────────────────
  getMyPortfolios: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
    return db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, ctx.user.id))
      .orderBy(desc(portfolios.createdAt));
  }),

  // ─── 교육생: 포트폴리오 제출 ─────────────────────────────────────────────────
  submitPortfolio: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
      const [existing] = await db
        .select({ id: portfolios.id, userId: portfolios.userId, approvalStep: portfolios.approvalStep })
        .from(portfolios)
        .where(eq(portfolios.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (existing.approvalStep !== "draft" && existing.approvalStep !== "rejected") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "이미 제출된 포트폴리오입니다." });
      }

      await db
        .update(portfolios)
        .set({ approvalStep: "submitted", submittedAt: new Date() })
        .where(eq(portfolios.id, input.id));

      return { success: true };
    }),

  // ─── 관리자/학과장: 교육생 문서 통합 조회 ────────────────────────────────────
  adminGetStudentDocuments: protectedProcedure
    .input(z.object({ studentUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "professor") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });

      const [resume] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, input.studentUserId))
        .orderBy(desc(resumes.createdAt))
        .limit(1);

      const coverLetterList = await db
        .select()
        .from(coverLetters)
        .where(eq(coverLetters.userId, input.studentUserId))
        .orderBy(desc(coverLetters.createdAt));

      const portfolioList = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, input.studentUserId))
        .orderBy(desc(portfolios.createdAt));

      return {
        resume: resume ?? null,
        coverLetters: coverLetterList,
        portfolios: portfolioList,
      };
    }),

  // ─── 관리자/학과장: 이력서 승인 단계 변경 ────────────────────────────────────
  adminUpdateResumeApproval: protectedProcedure
    .input(
      z.object({
        resumeId: z.number(),
        approvalStep: approvalStepEnum,
        approvalNote: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "professor") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
      const [resume] = await db
        .select({ id: resumes.id, userId: resumes.userId })
        .from(resumes)
        .where(eq(resumes.id, input.resumeId))
        .limit(1);

      if (!resume) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(resumes).set({
        approvalStep: input.approvalStep,
        approvalNote: input.approvalNote,
        approvedBy: ctx.user.id,
        approvedAt: input.approvalStep === "approved" ? new Date() : undefined,
      }).where(eq(resumes.id, input.resumeId));

      const stepLabel: Record<string, string> = { reviewing: "검토 중", approved: "승인 완료", rejected: "반려" };
      if (stepLabel[input.approvalStep]) {
        await createNotification(
          resume.userId, "resume_approval", `이력서 ${stepLabel[input.approvalStep]}`,
          input.approvalNote
            ? `이력서가 ${stepLabel[input.approvalStep]}되었습니다. 메모: ${input.approvalNote}`
            : `이력서가 ${stepLabel[input.approvalStep]}되었습니다.`,
          input.resumeId, "resume",
        );
      }
      return { success: true };
    }),

  // ─── 관리자/학과장: 자기소개서 승인 단계 변경 ────────────────────────────────
  adminUpdateCoverLetterApproval: protectedProcedure
    .input(
      z.object({
        coverLetterId: z.number(),
        approvalStep: approvalStepEnum,
        approvalNote: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "professor") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
      const [cl] = await db
        .select({ id: coverLetters.id, userId: coverLetters.userId })
        .from(coverLetters)
        .where(eq(coverLetters.id, input.coverLetterId))
        .limit(1);

      if (!cl) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(coverLetters).set({
        approvalStep: input.approvalStep,
        approvalNote: input.approvalNote,
        approvedBy: ctx.user.id,
        approvedAt: input.approvalStep === "approved" ? new Date() : undefined,
      }).where(eq(coverLetters.id, input.coverLetterId));

      const stepLabel: Record<string, string> = { reviewing: "검토 중", approved: "승인 완료", rejected: "반려" };
      if (stepLabel[input.approvalStep]) {
        await createNotification(
          cl.userId, "cover_letter_approval", `자기소개서 ${stepLabel[input.approvalStep]}`,
          input.approvalNote
            ? `자기소개서가 ${stepLabel[input.approvalStep]}되었습니다. 메모: ${input.approvalNote}`
            : `자기소개서가 ${stepLabel[input.approvalStep]}되었습니다.`,
          input.coverLetterId, "cover_letter",
        );
      }
      return { success: true };
    }),

  // ─── 관리자/학과장: 포트폴리오 승인 단계 변경 ────────────────────────────────
  adminUpdatePortfolioApproval: protectedProcedure
    .input(
      z.object({
        portfolioId: z.number(),
        approvalStep: approvalStepEnum,
        approvalNote: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "professor") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });
      const [portfolio] = await db
        .select({ id: portfolios.id, userId: portfolios.userId })
        .from(portfolios)
        .where(eq(portfolios.id, input.portfolioId))
        .limit(1);

      if (!portfolio) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(portfolios).set({
        approvalStep: input.approvalStep,
        approvalNote: input.approvalNote,
        approvedBy: ctx.user.id,
        approvedAt: input.approvalStep === "approved" ? new Date() : undefined,
      }).where(eq(portfolios.id, input.portfolioId));

      const stepLabel: Record<string, string> = { reviewing: "검토 중", approved: "승인 완료", rejected: "반려" };
      if (stepLabel[input.approvalStep]) {
        await createNotification(
          portfolio.userId, "portfolio_approval", `포트폴리오 ${stepLabel[input.approvalStep]}`,
          input.approvalNote
            ? `포트폴리오가 ${stepLabel[input.approvalStep]}되었습니다. 메모: ${input.approvalNote}`
            : `포트폴리오가 ${stepLabel[input.approvalStep]}되었습니다.`,
          input.portfolioId, "portfolio",
        );
      }
      return { success: true };
    }),

  // ─── 관리자/학과장: 제출 대기 문서 목록 ──────────────────────────────────────
  adminGetPendingDocuments: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "professor") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });

    const pendingResumes = await db
      .select()
      .from(resumes)
      .where(eq(resumes.approvalStep, "submitted"))
      .orderBy(desc(resumes.submittedAt));

    const pendingCoverLetters = await db
      .select()
      .from(coverLetters)
      .where(eq(coverLetters.approvalStep, "submitted"))
      .orderBy(desc(coverLetters.submittedAt));

    const pendingPortfolios = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.approvalStep, "submitted"))
      .orderBy(desc(portfolios.submittedAt));

    return { pendingResumes, pendingCoverLetters, pendingPortfolios };
  }),

  // ─── 관리자/학과장: 특정 학생 채용공고 AI 추천 ────────────────────────────────
  adminRecommendForStudent: protectedProcedure
    .input(z.object({ studentUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "professor") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });

      const { studentProfiles, aiAnalyses } = await import("../../drizzle/schema");
      const { eq: eqOp } = await import("drizzle-orm");
      const { getJobPostings } = await import("../db");
      const { invokeLLM } = await import("../_core/llm");

      let userSkills: string[] = [];
      let userCategory = "";
      let aiScores: Record<string, number> = {};
      let topFields: string[] = [];
      let studentName = "학생";

      const profileResult = await db.select().from(studentProfiles).where(eqOp(studentProfiles.userId, input.studentUserId)).limit(1);
      const profile = profileResult[0];
      if (profile) {
        userSkills = (profile.skills as string[] | null) ?? [];
        userCategory = profile.major ?? "";
      }

      const { users } = await import("../../drizzle/schema");
      const [student] = await db.select({ name: users.name }).from(users).where(eqOp(users.id, input.studentUserId)).limit(1);
      if (student) studentName = student.name ?? "학생";

      const analysisResult = await db.select().from(aiAnalyses).where(eqOp(aiAnalyses.userId, input.studentUserId)).limit(1);
      const analysis = analysisResult[0];
      if (analysis?.scores) {
        aiScores = analysis.scores as Record<string, number>;
        topFields = Object.entries(aiScores).sort(([, a], [, b]) => b - a).slice(0, 2).map(([k]) => k);
      }

      const allPostings = await getJobPostings({ status: "approved", limit: 50 });
      if (allPostings.length === 0) return { recommendations: [], summary: "등록된 채용공고가 없습니다.", topFields, studentName };

      // 공고 제목·카테고리는 기업이 입력한 신뢰할 수 없는 텍스트이므로 정제한다.
      const postingsSummary = allPostings.slice(0, 20).map((p: any) => ({
        id: p.posting.id,
        title: sanitizeForPrompt(p.posting.title, 200),
        category: sanitizeForPrompt(p.posting.category, 100),
        requiredSkills: sanitizeList(p.posting.requiredSkills as string[] | null),
        employmentType: p.posting.employmentType,
      }));

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `당신은 취업 컨설턴트입니다. 학생의 기술 스택과 AI 역량 분석 결과를 바탕으로 가장 적합한 채용공고를 추천해주세요. JSON 형식으로만 응답하세요. ${UNTRUSTED_DATA_NOTICE}` },
            { role: "user", content: JSON.stringify({ studentSkills: sanitizeList(userSkills), studentMajor: sanitizeForPrompt(userCategory, 100), topAIFields: topFields, aiScores, postings: postingsSummary }) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "job_recommendations",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  recommendations: { type: "array", items: { type: "object", properties: { id: { type: "number" }, matchScore: { type: "number" }, reason: { type: "string" } }, required: ["id", "matchScore", "reason"], additionalProperties: false } },
                  summary: { type: "string" },
                },
                required: ["recommendations", "summary"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = (response.choices[0]?.message?.content as string | null) ?? "{}";
        const parsed = JSON.parse(content);
        const recIds: number[] = (parsed.recommendations ?? []).map((r: any) => r.id);
        const recMap: Record<number, { matchScore: number; reason: string }> = {};
        for (const r of parsed.recommendations ?? []) recMap[r.id] = r;
        const recommended = allPostings
          .filter((p: any) => recIds.includes(p.posting.id))
          .map((p: any) => ({ ...p, matchScore: recMap[p.posting.id]?.matchScore ?? 0, matchReason: recMap[p.posting.id]?.reason ?? "" }))
          .sort((a: any, b: any) => b.matchScore - a.matchScore);
        return { recommendations: recommended, summary: parsed.summary ?? "", topFields, studentName };
      } catch {
        const fallback = allPostings
          .filter((p: any) => { const req: string[] = (p.posting.requiredSkills as string[] | null) ?? []; return req.some((s: string) => userSkills.includes(s)); })
          .slice(0, 5)
          .map((p: any) => ({ ...p, matchScore: 70, matchReason: "기술 스택 일치" }));
        return { recommendations: fallback, summary: "기술 스택 기반 추천", topFields, studentName };
      }
    }),
});
