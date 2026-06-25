import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createJobApplication,
  createJobPosting,
  createNotification,
  getAllUsers,
  getJobApplications,
  getJobPostingById,
  getJobPostings,
  getUserApplications,
  getUserBookmarks,
  toggleBookmark,
  updateApplicationStatus,
  updateJobPosting,
  getApplicationById,
} from "../db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { sanitizeForPrompt, sanitizeList, UNTRUSTED_DATA_NOTICE } from "../_core/promptSafety";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { aiAnalyses, studentProfiles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const jobsRouter = router({
  // 채용공고 목록 (승인된 것만 공개)
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return getJobPostings({ ...input, status: "approved" });
    }),

  // 내 회사 채용공고 목록
  myPostings: protectedProcedure.query(async ({ ctx }) => {
    return getJobPostings({ companyUserId: ctx.user.id });
  }),

  // 채용공고 상세
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await getJobPostingById(input.id);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      // 조회수 증가
      await updateJobPosting(input.id, { viewCount: (result.posting.viewCount ?? 0) + 1 });
      return result;
    }),

  // 채용공고 등록 (기업)
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      category: z.string().optional(),
      requiredSkills: z.array(z.string()).optional(),
      preferredSkills: z.array(z.string()).optional(),
      employmentType: z.enum(["정규직", "계약직", "프리랜서", "인턴"]),
      location: z.string().optional(),
      salaryMin: z.number().optional(),
      salaryMax: z.number().optional(),
      description: z.string().optional(),
      deadline: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "company" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "협력기업만 채용공고를 등록할 수 있습니다." });
      }
      await createJobPosting({
        companyUserId: ctx.user.id,
        ...input,
        deadline: input.deadline ? new Date(input.deadline) : undefined,
        status: "pending",
      });
      // 관리자에게 알림
      const admins = await getAllUsers({ role: "admin" });
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: "job_pending",
          title: "채용공고 승인 요청",
          message: `"${input.title}" 채용공고가 승인 대기 중입니다.`,
          relatedType: "job_posting",
        });
      }
      return { success: true };
    }),

  // 채용공고 수정
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      category: z.string().optional(),
      requiredSkills: z.array(z.string()).optional(),
      preferredSkills: z.array(z.string()).optional(),
      employmentType: z.enum(["정규직", "계약직", "프리랜서", "인턴"]).optional(),
      location: z.string().optional(),
      salaryMin: z.number().optional(),
      salaryMax: z.number().optional(),
      description: z.string().optional(),
      deadline: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, deadline, ...data } = input;
      await updateJobPosting(id, {
        ...data,
        deadline: deadline ? new Date(deadline) : undefined,
      });
      return { success: true };
    }),

  // 지원하기
  submitApplication: protectedProcedure
    .input(z.object({
      jobPostingId: z.number(),
      portfolioId: z.number().optional(),
      coverLetterId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "student") {
        throw new TRPCError({ code: "FORBIDDEN", message: "재학생만 지원할 수 있습니다." });
      }
      const posting = await getJobPostingById(input.jobPostingId);
      if (!posting || posting.posting.status !== "approved") {
        throw new TRPCError({ code: "NOT_FOUND", message: "공고를 찾을 수 없습니다." });
      }
      const application = await createJobApplication({
        jobPostingId: input.jobPostingId,
        applicantUserId: ctx.user.id,
        portfolioId: input.portfolioId,
        coverLetterId: input.coverLetterId,
        status: "지원완료",
      });
      if (!application) {
        throw new TRPCError({ code: "CONFLICT", message: "이미 지원한 공고입니다." });
      }
      // 기업에게 알림
      await createNotification({
        userId: posting.posting.companyUserId,
        type: "new_application",
        title: "새 지원자",
        message: `"${posting.posting.title}"에 새 지원자가 있습니다.`,
        relatedId: input.jobPostingId,
        relatedType: "job_posting",
      });
      return { success: true };
    }),

  // 내 지원 현황
  myApplications: protectedProcedure.query(async ({ ctx }) => {
    return getUserApplications(ctx.user.id);
  }),

  // 공고별 지원자 목록 (기업)
  getApplicants: protectedProcedure
    .input(z.object({ jobPostingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const posting = await getJobPostingById(input.jobPostingId);
      if (!posting) throw new TRPCError({ code: "NOT_FOUND" });
      if (posting.posting.companyUserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getJobApplications(input.jobPostingId);
    }),

  // 지원 상태 변경 (기업)
  updateApplicationStatus: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      status: z.enum(["지원완료", "서류합격", "면접", "최종합격", "탈락"]),
      interviewDate: z.string().optional(),
      interviewMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { applicationId, status, interviewDate, interviewMessage } = input;
      await updateApplicationStatus(applicationId, status, {
        interviewDate: interviewDate ? new Date(interviewDate) : undefined,
        interviewMessage,
      });
      // 학생에게 알림
      const app = await getApplicationById(applicationId);
      if (app) {
        const statusMessages: Record<string, string> = {
          '서류합격': '서류전형에 합격하셨습니다! 다음 단계를 확인하세요.',
          '면접': `면접 요청이 도착했습니다.${interviewDate ? ` 면접 일정: ${new Date(interviewDate).toLocaleDateString('ko-KR')}` : ''}`,
          '최종합격': '최종 합격을 축하드립니다! 🎉',
          '탈락': '아쉽게도 이번 전형에서 탈락하셨습니다.',
          '지원완료': '지원이 접수되었습니다.',
        };
        await createNotification({
          userId: app.applicantUserId,
          type: 'application_status',
          title: `지원 현황 업데이트: ${status}`,
          message: statusMessages[status] ?? `지원 상태가 '${status}'(으)로 변경되었습니다.`,
          relatedId: applicationId,
          relatedType: 'job_application',
        });
      }
      return { success: true };
    }),

  // 북마크 토글
  toggleBookmark: protectedProcedure
    .input(z.object({ jobPostingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isBookmarked = await toggleBookmark(ctx.user.id, input.jobPostingId);
      return { isBookmarked };
    }),

  // 내 북마크 목록
  myBookmarks: protectedProcedure.query(async ({ ctx }) => {
    return getUserBookmarks(ctx.user.id);
  }),

  // AI 맞춤 채용공고 추천 (역량 점수 + 분야 결합)
  aiRecommend: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    // 1. 학생 프로필 & AI 분석 결과 가져오기
    let userSkills: string[] = [];
    let userCategory = "";
    let aiScores: Record<string, number> = {};
    let topFields: string[] = [];

    if (db) {
      const profileResult = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, ctx.user.id)).limit(1);
      const profile = profileResult[0];
      if (profile) {
        userSkills = (profile.skills as string[] | null) ?? [];
        userCategory = profile.major ?? "";
      }
      const analysisResult = await db.select().from(aiAnalyses).where(eq(aiAnalyses.userId, ctx.user.id)).limit(1);
      const analysis = analysisResult[0];
      if (analysis?.scores) {
        aiScores = analysis.scores as Record<string, number>;
        // 점수 상위 2개 분야 추출
        topFields = Object.entries(aiScores)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 2)
          .map(([k]) => k);
      }
    }

    // 2. 승인된 공고 목록 가져오기
    const allPostings = await getJobPostings({ status: "approved", limit: 50 });

    // 3. LLM으로 맞춤 추천 (스킬 + AI 역량 점수 기반)
    if (allPostings.length === 0) return { recommendations: [], reason: "등록된 채용공고가 없습니다." };

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
          {
            role: "system",
            content: `당신은 취업 컨설턴트입니다. 학생의 기술 스택과 AI 역량 분석 결과를 바탕으로 가장 적합한 채용공고를 추천해주세요. JSON 형식으로만 응답하세요. ${UNTRUSTED_DATA_NOTICE}`,
          },
          {
            role: "user",
            content: JSON.stringify({
              studentSkills: sanitizeList(userSkills),
              studentMajor: sanitizeForPrompt(userCategory, 100),
              topAIFields: topFields,
              aiScores,
              postings: postingsSummary,
            }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "job_recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      matchScore: { type: "number" },
                      reason: { type: "string" },
                    },
                    required: ["id", "matchScore", "reason"],
                    additionalProperties: false,
                  },
                },
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

      // 추천 공고만 필터링하여 점수 순 정렬
      const recommended = allPostings
        .filter((p: any) => recIds.includes(p.posting.id))
        .map((p: any) => ({ ...p, matchScore: recMap[p.posting.id]?.matchScore ?? 0, matchReason: recMap[p.posting.id]?.reason ?? "" }))
        .sort((a: any, b: any) => b.matchScore - a.matchScore);

      return { recommendations: recommended, summary: parsed.summary ?? "", topFields };
    } catch {
      // LLM 실패 시 기술 스택 기반 단순 필터링 폴백
      const fallback = allPostings
        .filter((p: any) => {
          const req: string[] = (p.posting.requiredSkills as string[] | null) ?? [];
          return req.some((s: string) => userSkills.includes(s)) || (p.posting.category && topFields.includes(p.posting.category));
        })
        .slice(0, 5)
        .map((p: any) => ({ ...p, matchScore: 70, matchReason: "기술 스택 일치" }));
      return { recommendations: fallback, summary: "기술 스택 기반 추천", topFields };
    }
  }),

  // 관리자: 승인 대기 공고 목록
  adminPendingPostings: adminProcedure.query(async () => {
    return getJobPostings({ status: "pending" });
  }),

  // 관리자: 공고 승인/반려
  adminApprovePosting: adminProcedure
    .input(z.object({
      id: z.number(),
      action: z.enum(["approved", "rejected"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const posting = await getJobPostingById(input.id);
      if (!posting) throw new TRPCError({ code: "NOT_FOUND" });
      await updateJobPosting(input.id, {
        status: input.action,
        approvedAt: input.action === "approved" ? new Date() : undefined,
        approvedBy: ctx.user.id,
      });
      // 기업에게 알림
      await createNotification({
        userId: posting.posting.companyUserId,
        type: "job_approved",
        title: input.action === "approved" ? "채용공고 승인" : "채용공고 반려",
        message: input.action === "approved"
          ? `"${posting.posting.title}" 채용공고가 승인되어 게시되었습니다.`
          : `"${posting.posting.title}" 채용공고가 반려되었습니다.`,
        relatedId: input.id,
        relatedType: "job_posting",
      });
      return { success: true };
    }),
});
