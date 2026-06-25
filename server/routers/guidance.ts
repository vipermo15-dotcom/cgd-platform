import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { createAiLog, getDb } from "../db";
import { AI_LIMITS, enforceAiRateLimit } from "../_core/rateLimit";
import {
  careerGuidance,
  companyPipeline,
  employmentTracking,
  employmentSuccessBanner,
  users,
  studentProfiles,
  jobApplications,
} from "../../drizzle/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { sanitizeForPrompt, sanitizeList, UNTRUSTED_DATA_NOTICE, wrapUntrusted } from "../_core/promptSafety";

// ─── 진로지도 카드 ─────────────────────────────────────────────────────────────

const careerTrackEnum = z.enum([
  "brand_design",
  "sns_marketing",
  "video_editing",
  "character_goods",
  "ai_generation",
  "freelancer",
  "undecided",
]);

export const guidanceRouter = router({
  // 학생의 진로지도 카드 조회 (학생 본인 / 학과장 / 관리자)
  getCareerGuidance: protectedProcedure
    .input(z.object({ studentUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const isSelf = ctx.user.id === input.studentUserId;
      const isAdmin =
        ctx.user.role === "admin" ||
        ctx.user.role === "professor" ||
        ctx.user.role === "training_center";
      if (!isSelf && !isAdmin)
        throw new TRPCError({ code: "FORBIDDEN" });
      const [guidance] = await db
        .select()
        .from(careerGuidance)
        .where(eq(careerGuidance.studentUserId, input.studentUserId))
        .orderBy(desc(careerGuidance.updatedAt))
        .limit(1);
      return guidance ?? null;
    }),

  // 진로지도 카드 저장 (학과장 / 관리자)
  saveCareerGuidance: protectedProcedure
    .input(
      z.object({
        studentUserId: z.number(),
        careerTrack: careerTrackEnum,
        guidanceNote: z.string().optional(),
        checklist: z
          .array(
            z.object({
              id: z.string(),
              label: z.string(),
              done: z.boolean(),
              category: z.string(),
            })
          )
          .optional(),
        recommendedCompanies: z
          .array(
            z.object({
              companyName: z.string(),
              jobTitle: z.string(),
              reason: z.string(),
              matchScore: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (ctx.user.role !== "admin" && ctx.user.role !== "professor" && ctx.user.role !== "training_center")
        throw new TRPCError({ code: "FORBIDDEN" });

      const [existing] = await db
        .select({ id: careerGuidance.id })
        .from(careerGuidance)
        .where(eq(careerGuidance.studentUserId, input.studentUserId))
        .limit(1);

      if (existing) {
        await db
          .update(careerGuidance)
          .set({
            careerTrack: input.careerTrack,
            guidanceNote: input.guidanceNote,
            checklist: input.checklist ?? [],
            recommendedCompanies: input.recommendedCompanies ?? [],
            professorUserId: ctx.user.id,
          })
          .where(eq(careerGuidance.id, existing.id));
        return { id: existing.id };
      } else {
        const [result] = await db.insert(careerGuidance).values({
          studentUserId: input.studentUserId,
          professorUserId: ctx.user.id,
          careerTrack: input.careerTrack,
          guidanceNote: input.guidanceNote,
          checklist: input.checklist ?? [],
          recommendedCompanies: input.recommendedCompanies ?? [],
        });
        return { id: result.insertId };
      }
    }),

  // 체크리스트 항목 토글 (학생 본인)
  toggleChecklistItem: protectedProcedure
    .input(z.object({ guidanceId: z.number(), itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [guidance] = await db
        .select()
        .from(careerGuidance)
        .where(eq(careerGuidance.id, input.guidanceId))
        .limit(1);
      if (!guidance) throw new TRPCError({ code: "NOT_FOUND" });
      if (guidance.studentUserId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "professor")
        throw new TRPCError({ code: "FORBIDDEN" });

      const updated = (guidance.checklist ?? []).map((item) =>
        item.id === input.itemId ? { ...item, done: !item.done } : item
      );
      await db
        .update(careerGuidance)
        .set({ checklist: updated })
        .where(eq(careerGuidance.id, input.guidanceId));
      return { success: true };
    }),

  // AI 취업처 추천 (학과장 / 관리자)
  aiRecommendCompanies: protectedProcedure
    .input(
      z.object({
        studentUserId: z.number(),
        skills: z.array(z.string()),
        careerTrack: careerTrackEnum,
        portfolioSummary: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (ctx.user.role !== "admin" && ctx.user.role !== "professor" && ctx.user.role !== "training_center")
        throw new TRPCError({ code: "FORBIDDEN" });

      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.recommend);

      const trackLabels: Record<string, string> = {
        brand_design: "브랜드 디자인",
        sns_marketing: "SNS 마케팅",
        video_editing: "영상 편집",
        character_goods: "캐릭터 굿즈",
        ai_generation: "AI 생성",
        freelancer: "프리랜서",
        undecided: "미정",
      };

      // careerTrack은 zod enum으로 검증된 고정값이므로 신뢰 가능, 스킬·포트폴리오는 정제한다.
      const prompt = `당신은 CGD(컴퓨터그래픽디자인) 취업지원 플랫폼의 AI 취업 컨설턴트입니다.
진로 트랙: ${trackLabels[input.careerTrack]}

${wrapUntrusted("STUDENT", `보유 스킬: ${sanitizeList(input.skills)}
${input.portfolioSummary ? `포트폴리오 요약: ${sanitizeForPrompt(input.portfolioSummary, 2000)}` : ""}`)}

위 교육생에게 적합한 취업처 5곳을 추천해주세요.
각 취업처는 실제로 존재할 법한 한국 기업 유형이어야 합니다.
JSON 배열 형식으로만 응답하세요:
[{"companyName": "기업명", "jobTitle": "직무명", "reason": "추천 이유 (2문장)", "matchScore": 85}]`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: `당신은 CGD 취업지원 플랫폼의 AI 취업 컨설턴트입니다. ${UNTRUSTED_DATA_NOTICE}` },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "company_recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      companyName: { type: "string" },
                      jobTitle: { type: "string" },
                      reason: { type: "string" },
                      matchScore: { type: "number" },
                    },
                    required: ["companyName", "jobTitle", "reason", "matchScore"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        },
      });

      // rate limit 카운팅 및 비용 추적을 위해 호출 기록 (acting user 기준)
      await createAiLog({
        userId: ctx.user.id,
        type: "recommend",
        tokensUsed: response.usage?.total_tokens ?? 0,
        success: true,
      });

      const content = response.choices[0].message.content;
      let recommendations: { companyName: string; jobTitle: string; reason: string; matchScore: number }[] = [];
      try {
        const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
        recommendations = parsed.recommendations ?? parsed;
      } catch {
        recommendations = [];
      }

      // 진로지도 카드에 저장
      const [existing] = await db
        .select({ id: careerGuidance.id, checklist: careerGuidance.checklist })
        .from(careerGuidance)
        .where(eq(careerGuidance.studentUserId, input.studentUserId))
        .limit(1);

      if (existing) {
        await db
          .update(careerGuidance)
          .set({ recommendedCompanies: recommendations, aiRecommendReason: "AI 자동 추천" })
          .where(eq(careerGuidance.id, existing.id));
      } else {
        await db.insert(careerGuidance).values({
          studentUserId: input.studentUserId,
          professorUserId: ctx.user.id,
          careerTrack: input.careerTrack,
          recommendedCompanies: recommendations,
          aiRecommendReason: "AI 자동 추천",
        });
      }

      return { recommendations };
    }),

  // ─── 업체 파이프라인 ─────────────────────────────────────────────────────────

  // 전체 파이프라인 조회
  getPipeline: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (ctx.user.role !== "admin" && ctx.user.role !== "training_center" && ctx.user.role !== "professor")
      throw new TRPCError({ code: "FORBIDDEN" });
    return db.select().from(companyPipeline).orderBy(desc(companyPipeline.updatedAt));
  }),

  // 파이프라인 업체 추가
  addPipelineCompany: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
        industry: z.string().optional(),
        stage: z.enum(["discovery", "contact", "negotiation", "mou_signed"]).default("discovery"),
        availablePositions: z.array(z.string()).optional(),
        expectedHeadcount: z.number().optional(),
        note: z.string().optional(),
        nextAction: z.string().optional(),
        nextActionDate: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (ctx.user.role !== "admin" && ctx.user.role !== "training_center" && ctx.user.role !== "professor")
        throw new TRPCError({ code: "FORBIDDEN" });
      const [result] = await db.insert(companyPipeline).values({
        companyName: input.companyName,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
        industry: input.industry,
        stage: input.stage,
        availablePositions: input.availablePositions ?? [],
        expectedHeadcount: input.expectedHeadcount ?? 0,
        note: input.note,
        nextAction: input.nextAction,
        nextActionDate: input.nextActionDate ? new Date(input.nextActionDate) : undefined,
        managedBy: ctx.user.id,
      });
      return { id: result.insertId };
    }),

  // 파이프라인 단계 변경
  updatePipelineStage: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        stage: z.enum(["discovery", "contact", "negotiation", "mou_signed"]),
        note: z.string().optional(),
        nextAction: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (ctx.user.role !== "admin" && ctx.user.role !== "training_center" && ctx.user.role !== "professor")
        throw new TRPCError({ code: "FORBIDDEN" });
      await db
        .update(companyPipeline)
        .set({ stage: input.stage, note: input.note, nextAction: input.nextAction })
        .where(eq(companyPipeline.id, input.id));
      return { success: true };
    }),

  // 파이프라인 업체 삭제
  deletePipelineCompany: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (ctx.user.role !== "admin" && ctx.user.role !== "training_center")
        throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(companyPipeline).where(eq(companyPipeline.id, input.id));
      return { success: true };
    }),

  // ─── 취업 추적 / 취업률 통계 ─────────────────────────────────────────────────

  // 수료전후 취업률 4단계 통계
  getEmploymentStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (ctx.user.role !== "admin" && ctx.user.role !== "professor" && ctx.user.role !== "training_center")
      throw new TRPCError({ code: "FORBIDDEN" });

    // 전체 학생 수
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "student"));
    const total = totalResult?.count ?? 0;

    // 취업 확정 학생 수
    const [employedResult] = await db
      .select({ count: count() })
      .from(studentProfiles)
      .where(eq(studentProfiles.employmentStatus, "취업확정"));
    const employed = employedResult?.count ?? 0;

    // 지원 중 학생 수
    const [applyingResult] = await db
      .select({ count: count() })
      .from(studentProfiles)
      .where(eq(studentProfiles.employmentStatus, "지원중"));
    const applying = applyingResult?.count ?? 0;

    // 준비 중 학생 수
    const [preparingResult] = await db
      .select({ count: count() })
      .from(studentProfiles)
      .where(eq(studentProfiles.employmentStatus, "준비중"));
    const preparing = preparingResult?.count ?? 0;

    // 수료 후 추적 데이터
    const trackingData = await db
      .select()
      .from(employmentTracking)
      .orderBy(desc(employmentTracking.createdAt))
      .limit(20);

    // 최근 취업 확정 학생 목록
    const recentEmployed = await db
      .select({
        userId: studentProfiles.userId,
        employedCompany: studentProfiles.employedCompany,
        employedAt: studentProfiles.employedAt,
        name: users.name,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(users.id, studentProfiles.userId))
      .where(eq(studentProfiles.employmentStatus, "취업확정"))
      .orderBy(desc(studentProfiles.employedAt))
      .limit(10);

    return {
      total,
      employed,
      applying,
      preparing,
      employmentRate: total > 0 ? Math.round((employed / total) * 100) : 0,
      // 4단계: 수료전 / 수료직후(D+30) / D+60 / D+90
      stages: {
        preGraduation: employed,
        d30: trackingData.filter((t) => t.checkD30).length,
        d60: trackingData.filter((t) => t.checkD60).length,
        d90: trackingData.filter((t) => t.checkD90).length,
      },
      recentEmployed,
      trackingData,
    };
  }),

  // 취업 추적 등록/업데이트
  upsertEmploymentTracking: protectedProcedure
    .input(
      z.object({
        studentUserId: z.number(),
        graduationDate: z.number().optional(),
        employedAt: z.number().optional(),
        companyName: z.string().optional(),
        jobTitle: z.string().optional(),
        employmentType: z.enum(["정규직", "계약직", "프리랜서", "인턴"]).optional(),
        salary: z.number().optional(),
        checkD30: z.boolean().optional(),
        checkD60: z.boolean().optional(),
        checkD90: z.boolean().optional(),
        checkD30Note: z.string().optional(),
        checkD60Note: z.string().optional(),
        checkD90Note: z.string().optional(),
        source: z.enum(["platform", "professor_match", "self", "other"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (ctx.user.role !== "admin" && ctx.user.role !== "professor" && ctx.user.role !== "training_center")
        throw new TRPCError({ code: "FORBIDDEN" });

      const [existing] = await db
        .select({ id: employmentTracking.id })
        .from(employmentTracking)
        .where(eq(employmentTracking.studentUserId, input.studentUserId))
        .limit(1);

      const data = {
        graduationDate: input.graduationDate ? new Date(input.graduationDate) : undefined,
        employedAt: input.employedAt ? new Date(input.employedAt) : undefined,
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        employmentType: input.employmentType,
        salary: input.salary,
        checkD30: input.checkD30,
        checkD60: input.checkD60,
        checkD90: input.checkD90,
        checkD30Note: input.checkD30Note,
        checkD60Note: input.checkD60Note,
        checkD90Note: input.checkD90Note,
        source: input.source,
      };

      if (existing) {
        await db.update(employmentTracking).set(data).where(eq(employmentTracking.id, existing.id));
        return { id: existing.id };
      } else {
        const [result] = await db.insert(employmentTracking).values({
          studentUserId: input.studentUserId,
          ...data,
        });
        return { id: result.insertId };
      }
    }),

  // ─── 취업 축하 배너 ─────────────────────────────────────────────────────────

  // 활성 배너 목록 (최근 5건)
  getActiveBanners: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(employmentSuccessBanner)
      .where(eq(employmentSuccessBanner.isActive, true))
      .orderBy(desc(employmentSuccessBanner.createdAt))
      .limit(5);
  }),

  // 배너 생성 (관리자 수동 또는 자동)
  createBanner: protectedProcedure
    .input(
      z.object({
        studentUserId: z.number(),
        studentName: z.string(),
        companyName: z.string(),
        jobTitle: z.string(),
        message: z.string().optional(),
        useInitial: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (ctx.user.role !== "admin" && ctx.user.role !== "professor" && ctx.user.role !== "training_center")
        throw new TRPCError({ code: "FORBIDDEN" });
      const [result] = await db.insert(employmentSuccessBanner).values({
        studentUserId: input.studentUserId,
        studentName: input.studentName,
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        message: input.message,
        useInitial: input.useInitial,
        isAutoGenerated: false,
      });
      return { id: result.insertId };
    }),

  // 배너 비활성화
  deactivateBanner: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await db
        .update(employmentSuccessBanner)
        .set({ isActive: false })
        .where(eq(employmentSuccessBanner.id, input.id));
      return { success: true };
    }),

  // 공개 취업 현황 통계 (비로그인 접근 가능)
  getPublicStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "student"));
    const total = totalResult?.count ?? 0;

    const [employedResult] = await db
      .select({ count: count() })
      .from(studentProfiles)
      .where(eq(studentProfiles.employmentStatus, "취업확정"));
    const employed = employedResult?.count ?? 0;

    const recentEmployed = await db
      .select({
        name: users.name,
        employedCompany: studentProfiles.employedCompany,
        employedAt: studentProfiles.employedAt,
      })
      .from(studentProfiles)
      .innerJoin(users, eq(users.id, studentProfiles.userId))
      .where(eq(studentProfiles.employmentStatus, "취업확정"))
      .orderBy(desc(studentProfiles.employedAt))
      .limit(20);

    const banners = await db
      .select()
      .from(employmentSuccessBanner)
      .where(eq(employmentSuccessBanner.isActive, true))
      .orderBy(desc(employmentSuccessBanner.createdAt))
      .limit(10);

    return {
      total,
      employed,
      employmentRate: total > 0 ? Math.round((employed / total) * 100) : 0,
      recentEmployed,
      banners,
    };
  }),
});
