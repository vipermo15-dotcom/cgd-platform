// CGD 플랫폼 × 취업진로 AI 에이전트 연동 라우터
// 기존 server/routers/ 폴더에 추가하고 server/routers.ts에 import 등록

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { createAiLog } from "../db";
import { enforceAiRateLimit, AI_LIMITS } from "../_core/rateLimit";
import {
  sanitizeForPrompt,
  sanitizeList,
  UNTRUSTED_DATA_NOTICE,
  wrapUntrusted,
} from "../_core/promptSafety";

// ─── 시스템 프롬프트 ───────────────────────────────────────────────────────────

const CAREER_GUIDANCE_PROMPT = `당신은 2026 컴퓨터그래픽디자인 재학생 취업진로 지도 에이전트입니다.
학생 정보를 분석해 맞춤형 취업처 추천과 진로 리포트를 JSON으로 반환하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "추천직무": [{"직무명": "", "이유": ""}],
  "취업처목록": [{"순위": 1, "업종": "", "포지션": "", "추천이유": "", "준비포인트": ""}],
  "준비로드맵": {"단기1개월": "", "중기3개월": "", "포트폴리오핵심": ""}
}
규칙: 취업처 3개 이상 / AI 활용자는 AI 포지션 우선 / 근거없는 수치는 "확인 필요"
${UNTRUSTED_DATA_NOTICE}`;

const JOB_ANALYSIS_PROMPT = `당신은 채용공고 분석 에이전트입니다.
채용공고와 학생 정보를 받아 분석 결과를 JSON으로 반환하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "공고분석": {"회사명": "", "직무": "", "고용형태": "", "필수역량": [], "핵심키워드": []},
  "매칭포인트": {
    "강점TOP3": [{"항목": "", "이유": ""}],
    "보완필요": [{"항목": "", "준비방법": ""}],
    "매칭표": [{"요구사항": "", "내강점": "", "매칭강도": "★★★"}]
  },
  "포트폴리오전략": {
    "수록작업물": [{"순서": 1, "유형": "", "이유": "", "AI활용": false}],
    "면접관이보고싶은것": "",
    "절대넣지말것": ""
  }
}
${UNTRUSTED_DATA_NOTICE}`;

const PORTFOLIO_GUIDE_PROMPT = `당신은 포트폴리오 기업 맞춤형 가이드 에이전트입니다.
학생 정보와 목표 취업처를 받아 가이드를 JSON으로 반환하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "취업처분석": [{"회사": "", "선호스타일": "", "강조역량": ""}],
  "구성초안": [{"순서": 1, "작업물명": "", "유형": "", "강조포인트": "", "AI활용": false}],
  "작업물가이드": [{"작업물명": "", "한줄소개": "", "강조할것": "", "설명순서": "", "피할것": ""}]
}
규칙: 수록 작업물 3~5개 / AI 활용 작업물은 제작 과정 포함 권장
${UNTRUSTED_DATA_NOTICE}`;

// ─── 라우터 ───────────────────────────────────────────────────────────────────

export const aiAgentRouter = router({

  // 1. 취업처 추천 에이전트
  careerGuidance: protectedProcedure
    .input(z.object({
      name: z.string().max(50).optional(),
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
      ai: z.string().max(200).optional(),
      workType: z.string().max(50).optional(),
      industry: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);

      const userMessage = `학생 정보:
이름(가명): ${sanitizeForPrompt(input.name || "학생", 50)}
보유 툴: ${sanitizeList(input.tools)}
주요 작업물: ${sanitizeList(input.works)}
생성형 AI: ${sanitizeForPrompt(input.ai || "미입력", 200)}
희망 근무: ${sanitizeForPrompt(input.workType || "무관", 50)}
희망 업종: ${sanitizeForPrompt(input.industry || "무관", 100)}`;

      let tokensUsed = 0;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: CAREER_GUIDANCE_PROMPT },
            { role: "user", content: wrapUntrusted("STUDENT_INFO", userMessage) },
          ],
          response_format: { type: "json_object" },
        });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const raw = response.choices[0]?.message?.content;
        const data = JSON.parse(typeof raw === "string" ? raw : "{}");
        await createAiLog({ userId: ctx.user.id, type: "career_guidance", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "career_guidance", tokensUsed, success: false });
        throw error;
      }
    }),

  // 2. 채용공고 분석 에이전트
  jobAnalysis: protectedProcedure
    .input(z.object({
      jobPosting: z.string().max(5000),
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);

      const userMessage = `채용공고:\n${wrapUntrusted("JOB_POSTING", sanitizeForPrompt(input.jobPosting, 5000))}\n\n학생 정보:\n보유 툴: ${sanitizeList(input.tools)}\n주요 작업물: ${sanitizeList(input.works)}`;

      let tokensUsed = 0;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: JOB_ANALYSIS_PROMPT },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
        });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const raw = response.choices[0]?.message?.content;
        const data = JSON.parse(typeof raw === "string" ? raw : "{}");
        await createAiLog({ userId: ctx.user.id, type: "job_analysis", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "job_analysis", tokensUsed, success: false });
        throw error;
      }
    }),

  // 3. 포트폴리오 가이드 에이전트
  portfolioGuide: protectedProcedure
    .input(z.object({
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
      targetCompanies: z.array(z.string().max(100)).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);

      const userMessage = `학생 정보:\n보유 툴: ${sanitizeList(input.tools)}\n주요 작업물: ${sanitizeList(input.works)}\n\n목표 취업처: ${sanitizeList(input.targetCompanies)}`;

      let tokensUsed = 0;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: PORTFOLIO_GUIDE_PROMPT },
            { role: "user", content: wrapUntrusted("STUDENT_INFO", userMessage) },
          ],
          response_format: { type: "json_object" },
        });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const raw = response.choices[0]?.message?.content;
        const data = JSON.parse(typeof raw === "string" ? raw : "{}");
        await createAiLog({ userId: ctx.user.id, type: "portfolio_guide", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "portfolio_guide", tokensUsed, success: false });
        throw error;
      }
    }),

  // 4. 진로지도 채팅 에이전트 (대화형)
  careerChat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })).max(20),
      studentContext: z.object({
        tools: z.array(z.string().max(50)).max(20).optional(),
        works: z.array(z.string().max(100)).max(20).optional(),
        workType: z.string().max(50).optional(),
        industry: z.string().max(100).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.chat ?? AI_LIMITS.analysis);

      const contextBlock = input.studentContext
        ? `\n\n[학생 프로필]\n보유 툴: ${sanitizeList(input.studentContext.tools ?? [])}\n주요 작업물: ${sanitizeList(input.studentContext.works ?? [])}\n희망 근무: ${sanitizeForPrompt(input.studentContext.workType ?? "무관", 50)}\n희망 업종: ${sanitizeForPrompt(input.studentContext.industry ?? "무관", 100)}`
        : "";

      const systemPrompt = `당신은 컴퓨터그래픽디자인 취업 진로 상담사입니다.
학생의 진로·포트폴리오·취업에 관한 질문에 친절하고 구체적으로 답하세요.
근거 없는 수치나 연봉은 "확인 필요"로 표기하세요.
답변은 3~5문장으로 간결하게, 필요시 목록을 사용하세요.${contextBlock}
${UNTRUSTED_DATA_NOTICE}`;

      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...input.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: wrapUntrusted("USER_MESSAGE", sanitizeForPrompt(m.content, 2000)),
        })),
      ];

      let tokensUsed = 0;
      try {
        const response = await invokeLLM({ messages: llmMessages });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const reply = response.choices[0]?.message?.content ?? "죄송합니다, 다시 시도해주세요.";
        await createAiLog({ userId: ctx.user.id, type: "career_chat", tokensUsed, success: true });
        return { success: true, reply };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "career_chat", tokensUsed, success: false });
        throw error;
      }
    }),

  // 5. 사전 설문 제출 → 자동 진로지도 실행
  submitSurvey: protectedProcedure
    .input(z.object({
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
      aiUsage: z.string().max(200).optional(),
      workType: z.string().max(50).optional(),
      industry: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);

      const userMessage = `학생 정보:
이름(가명): 학생
보유 툴: ${sanitizeList(input.tools)}
주요 작업물: ${sanitizeList(input.works)}
생성형 AI: ${sanitizeForPrompt(input.aiUsage || "미입력", 200)}
희망 근무: ${sanitizeForPrompt(input.workType || "무관", 50)}
희망 업종: ${sanitizeForPrompt(input.industry || "무관", 100)}`;

      let tokensUsed = 0;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: CAREER_GUIDANCE_PROMPT },
            { role: "user", content: wrapUntrusted("STUDENT_INFO", userMessage) },
          ],
          response_format: { type: "json_object" },
        });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const raw = response.choices[0]?.message?.content;
        const data = JSON.parse(typeof raw === "string" ? raw : "{}");
        await createAiLog({ userId: ctx.user.id, type: "survey_guidance", tokensUsed, success: true });
        return { success: true, surveyInput: input, guidanceResult: data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "survey_guidance", tokensUsed, success: false });
        throw error;
      }
    }),
});
