import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { createAiAnalysis, createAiLog, createCoverLetter, deleteCoverLetter, getCoverLetterById, getLatestAiAnalysis, getPortfolioItems, getUserCoverLetters, getUserPortfolios, updateCoverLetter } from "../db";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import { sanitizeForPrompt, sanitizeList, UNTRUSTED_DATA_NOTICE, wrapUntrusted } from "../_core/promptSafety";
import { AI_LIMITS, enforceAiRateLimit } from "../_core/rateLimit";

export const aiRouter = router({
  // AI 역량 분석 실행
  analyze: protectedProcedure
    .input(z.object({ portfolioId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);
      const portfolios = await getUserPortfolios(ctx.user.id);
      if (portfolios.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "포트폴리오를 먼저 등록해주세요." });
      }

      const targetPortfolioId = input.portfolioId ?? portfolios[0].id;
      const items = await getPortfolioItems(targetPortfolioId);

      // 사용자가 입력한 포트폴리오 텍스트는 신뢰할 수 없으므로 정제 후 삽입한다.
      const portfolioSummary = items.map(item =>
        `- 제목: ${sanitizeForPrompt(item.title, 200)}, 카테고리: ${sanitizeForPrompt(item.category, 100) || "미분류"}, 툴: ${sanitizeList(item.tools as string[] | null) || "없음"}, 설명: ${sanitizeForPrompt(item.description, 500) || ""}`
      ).join("\n");

      const prompt = `당신은 컴퓨터그래픽디자인 분야 전문 커리어 컨설턴트입니다.
다음 포트폴리오 작품 목록을 분석하여 역량 점수를 JSON 형식으로 반환해주세요.

${wrapUntrusted("PORTFOLIO", portfolioSummary || "작품이 없습니다.")}

다음 JSON 형식으로만 응답하세요:
{
  "scores": {
    "branding": 0-100,
    "sns": 0-100,
    "video": 0-100,
    "character": 0-100,
    "aiGeneration": 0-100,
    "editing": 0-100
  },
  "overallScore": 0-100,
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "recommendedSkills": ["추천스킬1", "추천스킬2", "추천스킬3"],
  "summary": "전반적인 역량 요약 (200자 이내)"
}`;

      let tokensUsed = 0;
      let success = true;
      let errorMessage: string | undefined;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `당신은 컴퓨터그래픽디자인 분야 전문 커리어 컨설턴트입니다. JSON 형식으로만 응답합니다. ${UNTRUSTED_DATA_NOTICE}` },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";
        tokensUsed = response.usage?.total_tokens ?? 0;

        let parsed: any = {};
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = {
            scores: { branding: 60, sns: 55, video: 50, character: 65, aiGeneration: 45, editing: 70 },
            overallScore: 58,
            strengths: ["포트폴리오 구성 능력", "다양한 분야 경험"],
            weaknesses: ["특정 분야 심화 필요"],
            recommendedSkills: ["Adobe Illustrator", "After Effects"],
            summary: "전반적으로 균형 잡힌 역량을 보유하고 있습니다.",
          };
        }

        await createAiAnalysis({
          userId: ctx.user.id,
          portfolioId: targetPortfolioId,
          scores: parsed.scores,
          overallScore: parsed.overallScore,
          strengths: parsed.strengths,
          weaknesses: parsed.weaknesses,
          recommendedSkills: parsed.recommendedSkills,
          summary: parsed.summary,
          rawResponse: content,
          tokensUsed,
        });

        await createAiLog({ userId: ctx.user.id, type: "analysis", tokensUsed, success: true });
        return parsed;
      } catch (err: any) {
        success = false;
        errorMessage = err.message;
        await createAiLog({ userId: ctx.user.id, type: "analysis", tokensUsed, success: false, errorMessage });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." });
      }
    }),

  // 최신 AI 분석 결과 조회
  getLatest: protectedProcedure.query(async ({ ctx }) => {
    return getLatestAiAnalysis(ctx.user.id);
  }),

  // AI 자기소개서 생성
  generateCoverLetter: protectedProcedure
    .input(z.object({
      jobPostingId: z.number().optional(),
      jobTitle: z.string(),
      companyName: z.string(),
      jobDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.coverLetter);
      const analysis = await getLatestAiAnalysis(ctx.user.id);
      const portfolios = await getUserPortfolios(ctx.user.id);

      const analysisInfo = analysis
        ? `역량 분석 결과: 종합점수 ${Number(analysis.overallScore) || 0}점, 강점: ${sanitizeList(analysis.strengths as string[] | null)}, 추천스킬: ${sanitizeList(analysis.recommendedSkills as string[] | null)}`
        : "역량 분석 결과 없음";

      const portfolioInfo = portfolios.length > 0
        ? `포트폴리오 ${portfolios.length}개 보유`
        : "포트폴리오 없음";

      const prompt = `당신은 취업 자기소개서 전문 작성가입니다.
다음 정보를 바탕으로 한국어 자기소개서를 작성해주세요.

${wrapUntrusted("APPLICATION", `지원 정보:
- 회사명: ${sanitizeForPrompt(input.companyName, 200)}
- 포지션: ${sanitizeForPrompt(input.jobTitle, 200)}
- 직무 설명: ${sanitizeForPrompt(input.jobDescription, 2000) || "없음"}

지원자 정보:
- ${analysisInfo}
- ${portfolioInfo}`)}

자기소개서 구성 (각 항목 150~200자):
1. 지원 동기
2. 본인의 강점과 역량
3. 입사 후 포부

전문적이고 진정성 있는 자기소개서를 작성해주세요.`;

      let tokensUsed = 0;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `당신은 취업 자기소개서 전문 작성가입니다. ${UNTRUSTED_DATA_NOTICE}` },
            { role: "user", content: prompt },
          ],
        });

        const rawContent2 = response.choices[0]?.message?.content;
        const content = typeof rawContent2 === "string" ? rawContent2 : "";
        tokensUsed = response.usage?.total_tokens ?? 0;

        const coverLetter = await createCoverLetter({
          userId: ctx.user.id,
          jobPostingId: input.jobPostingId,
          title: `${input.companyName} - ${input.jobTitle} 자기소개서`,
          content,
          isAiGenerated: true,
          tokensUsed,
        });

        await createAiLog({ userId: ctx.user.id, type: "cover_letter", tokensUsed, success: true });
        return { content, id: null };
      } catch (err: any) {
        await createAiLog({ userId: ctx.user.id, type: "cover_letter", tokensUsed, success: false, errorMessage: err.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "자기소개서 생성 중 오류가 발생했습니다." });
      }
    }),

  // 자기소개서 목록
  listCoverLetters: protectedProcedure.query(async ({ ctx }) => {
    return getUserCoverLetters(ctx.user.id);
  }),

  // 자기소개서 저장
  saveCoverLetter: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      title: z.string(),
      content: z.string(),
      jobPostingId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        await updateCoverLetter(input.id, { title: input.title, content: input.content });
        return { id: input.id };
      } else {
        await createCoverLetter({
          userId: ctx.user.id,
          jobPostingId: input.jobPostingId,
          title: input.title,
          content: input.content,
          isAiGenerated: false,
        });
        return { id: null };
      }
    }),

  // 자기소개서 삭제
  deleteCoverLetter: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const letter = await getCoverLetterById(input.id);
      if (!letter || letter.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await deleteCoverLetter(input.id);
      return { success: true };
    }),
});
