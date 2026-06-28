// CGD 플랫폼 × 취업진로 AI 에이전트 연동 라우터
// 기존 server/routers/ 폴더에 추가하고 server/routers.ts에 import 등록

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { createAiLog, getDb } from "../db";
import { enforceAiRateLimit, AI_LIMITS } from "../_core/rateLimit";
import {
  sanitizeForPrompt,
  sanitizeList,
  UNTRUSTED_DATA_NOTICE,
  wrapUntrusted,
} from "../_core/promptSafety";
import { careerGuidance, users, studentProfiles } from "../../drizzle/schema";
import { eq, isNotNull, desc } from "drizzle-orm";

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

const PORTFOLIO_COACH_PROMPT = `당신은 컴퓨터그래픽 포트폴리오 코치입니다.
학생의 포트폴리오 설명을 분석해 구체적인 피드백을 JSON으로 반환하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "총점": 0,
  "강점": [{"항목": "", "설명": ""}],
  "개선점": [{"항목": "", "방법": "", "우선순위": "높음"}],
  "총평": "",
  "다음단계": ""
}
총점 0~100점. 강점 2~4개, 개선점 2~4개.
${UNTRUSTED_DATA_NOTICE}`;

const COVER_LETTER_PROMPT = `당신은 디자이너 자기소개서 전문가입니다.
채용공고와 학생 정보를 받아 자기소개서 초안을 JSON으로 반환하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "지원동기": "",
  "성장과정": "",
  "역량및경험": "",
  "입사후계획": "",
  "총평": ""
}
각 항목 200~300자 이내. 실제 지원에 쓸 수 있도록 구체적으로.
${UNTRUSTED_DATA_NOTICE}`;

const INTERVIEW_PREP_PROMPT = `당신은 디자이너 면접 코치입니다.
직무와 학생 정보를 받아 예상 질문과 모범 답변을 JSON으로 반환하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "예상질문": [
    {
      "질문": "",
      "카테고리": "자기소개|포트폴리오|직무역량|인성|상황대처",
      "모범답변": "",
      "핵심포인트": ""
    }
  ]
}
질문 5~7개. 포트폴리오 관련 질문 반드시 포함.
${UNTRUSTED_DATA_NOTICE}`;

const LEARNING_ROADMAP_PROMPT = `당신은 컴퓨터그래픽 취업 준비 코치입니다.
현재 스킬과 목표 직무를 받아 학습 로드맵을 JSON으로 반환하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "현재수준": "",
  "목표직무": "",
  "로드맵": [
    {
      "기간": "",
      "목표": "",
      "학습항목": [""],
      "체크포인트": ""
    }
  ],
  "추천리소스": [{"유형": "", "내용": ""}]
}
로드맵 3~4단계(1주/1개월/2개월/3개월).
${UNTRUSTED_DATA_NOTICE}`;

const PORTFOLIO_SCORE_PROMPT = `당신은 컴퓨터그래픽 포트폴리오 심사위원입니다.
포트폴리오 내용을 평가해 점수와 피드백을 JSON으로 반환하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "총점": 0,
  "등급": "A",
  "항목별점수": [
    {"항목": "작업물다양성", "점수": 0, "만점": 20, "피드백": ""},
    {"항목": "완성도", "점수": 0, "만점": 20, "피드백": ""},
    {"항목": "툴활용", "점수": 0, "만점": 20, "피드백": ""},
    {"항목": "창의성", "점수": 0, "만점": 20, "피드백": ""},
    {"항목": "AI활용", "점수": 0, "만점": 20, "피드백": ""}
  ],
  "한줄평": "",
  "즉시개선": ""
}
총점 100점 만점. A:90+, B:75+, C:60+, D:60미만.
${UNTRUSTED_DATA_NOTICE}`;

const JOB_READINESS_PROMPT = `당신은 컴퓨터그래픽 취업 준비도 평가 전문가입니다.
학생 정보를 받아 취업 준비도를 JSON으로 평가하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "준비도": 0,
  "등급": "준비중",
  "강점": [""],
  "보완필요": [""],
  "단계별현황": [
    {"단계": "포트폴리오", "상태": "진행중", "설명": ""},
    {"단계": "이력서/자소서", "상태": "미시작", "설명": ""},
    {"단계": "스킬보강", "상태": "진행중", "설명": ""},
    {"단계": "기업리서치", "상태": "미시작", "설명": ""},
    {"단계": "지원/면접", "상태": "미시작", "설명": ""}
  ],
  "이번주할일": [""]
}
준비도 0~100점.
${UNTRUSTED_DATA_NOTICE}`;

const WEEKLY_REPORT_PROMPT = `당신은 취업 준비 주간 리포트 AI입니다.
이번 주 활동과 학생 정보를 받아 주간 리포트를 JSON으로 작성하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "이번주요약": "",
  "성과": [""],
  "잘한점": "",
  "보완점": "",
  "다음주목표": [""],
  "응원메시지": ""
}
${UNTRUSTED_DATA_NOTICE}`;

const PORTFOLIO_STRATEGY_PROMPT = `당신은 컴퓨터그래픽디자인 취업 포트폴리오 전략 전문가입니다.
교육생이 희망 취업분야와 채용공고를 제출하면, 포트폴리오 제작 전 최적의 구성 전략을 JSON으로 반환하세요.
반드시 아래 JSON 형식만 반환하세요:
{
  "전략요약": "",
  "핵심어필포인트": [""],
  "추천구성": [
    {
      "순서": 1,
      "작업물유형": "",
      "목적": "",
      "강조포인트": "",
      "분량": "",
      "AI활용권장": false
    }
  ],
  "채용분야별키워드": [""],
  "제작우선순위": [""],
  "피해야할실수": [""],
  "예상심사기준": ""
}
추천구성 3~5개. 채용공고가 있으면 요구사항을 직접 반영할 것.
AI 활용 가능 작업물은 AI활용권장: true로 표시.
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

  // 5. 사전 설문 제출 → AI 진로 분석 + DB 저장
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
      let guidanceResult: object = {};
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
        guidanceResult = JSON.parse(typeof raw === "string" ? raw : "{}");
        await createAiLog({ userId: ctx.user.id, type: "survey_guidance", tokensUsed, success: true });
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "survey_guidance", tokensUsed, success: false });
        throw error;
      }

      // DB에 설문 결과 저장 (career_guidance 레코드 upsert)
      const db = await getDb();
      if (db) {
        const surveyData = {
          tools: input.tools,
          works: input.works,
          aiUsage: input.aiUsage ?? "",
          workType: input.workType ?? "",
          industry: input.industry ?? "",
          submittedAt: new Date().toISOString(),
          guidanceResult,
        };
        const [existing] = await db
          .select({ id: careerGuidance.id })
          .from(careerGuidance)
          .where(eq(careerGuidance.studentUserId, ctx.user.id))
          .limit(1);
        if (existing) {
          await db.update(careerGuidance)
            .set({ surveyData })
            .where(eq(careerGuidance.id, existing.id));
        } else {
          await db.insert(careerGuidance).values({
            studentUserId: ctx.user.id,
            careerTrack: "undecided",
            surveyData,
          });
        }
      }

      return { success: true, surveyInput: input, guidanceResult };
    }),

  // 7. AI 포트폴리오 코치
  portfolioCoach: protectedProcedure
    .input(z.object({
      description: z.string().max(3000),
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
      targetJob: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);
      const userMessage = `포트폴리오 설명:\n${sanitizeForPrompt(input.description, 3000)}\n\n보유 툴: ${sanitizeList(input.tools)}\n주요 작업물: ${sanitizeList(input.works)}\n목표 직무: ${sanitizeForPrompt(input.targetJob ?? "미정", 100)}`;
      let tokensUsed = 0;
      try {
        const response = await invokeLLM({ messages: [{ role: "system", content: PORTFOLIO_COACH_PROMPT }, { role: "user", content: wrapUntrusted("PORTFOLIO", userMessage) }], response_format: { type: "json_object" } });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
        await createAiLog({ userId: ctx.user.id, type: "portfolio_coach", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "portfolio_coach", tokensUsed, success: false });
        throw error;
      }
    }),

  // 8. AI 자기소개서
  coverLetter: protectedProcedure
    .input(z.object({
      jobPosting: z.string().max(3000),
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
      selfIntro: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);
      const userMessage = `채용공고:\n${wrapUntrusted("JOB_POSTING", sanitizeForPrompt(input.jobPosting, 3000))}\n\n학생 정보:\n보유 툴: ${sanitizeList(input.tools)}\n주요 작업물: ${sanitizeList(input.works)}\n자기소개: ${sanitizeForPrompt(input.selfIntro ?? "미입력", 1000)}`;
      let tokensUsed = 0;
      try {
        const response = await invokeLLM({ messages: [{ role: "system", content: COVER_LETTER_PROMPT }, { role: "user", content: userMessage }], response_format: { type: "json_object" } });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
        await createAiLog({ userId: ctx.user.id, type: "cover_letter", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "cover_letter", tokensUsed, success: false });
        throw error;
      }
    }),

  // 9. AI 면접 준비
  interviewPrep: protectedProcedure
    .input(z.object({
      jobTitle: z.string().max(100),
      company: z.string().max(100).optional(),
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);
      const userMessage = `지원 직무: ${sanitizeForPrompt(input.jobTitle, 100)}\n지원 회사: ${sanitizeForPrompt(input.company ?? "미정", 100)}\n보유 툴: ${sanitizeList(input.tools)}\n주요 작업물: ${sanitizeList(input.works)}`;
      let tokensUsed = 0;
      try {
        const response = await invokeLLM({ messages: [{ role: "system", content: INTERVIEW_PREP_PROMPT }, { role: "user", content: wrapUntrusted("STUDENT_INFO", userMessage) }], response_format: { type: "json_object" } });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
        await createAiLog({ userId: ctx.user.id, type: "interview_prep", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "interview_prep", tokensUsed, success: false });
        throw error;
      }
    }),

  // 10. AI 학습 로드맵
  learningRoadmap: protectedProcedure
    .input(z.object({
      tools: z.array(z.string().max(50)).max(20),
      targetJob: z.string().max(100),
      currentLevel: z.string().max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);
      const userMessage = `현재 보유 툴: ${sanitizeList(input.tools)}\n목표 직무: ${sanitizeForPrompt(input.targetJob, 100)}\n현재 수준: ${sanitizeForPrompt(input.currentLevel ?? "입문", 200)}`;
      let tokensUsed = 0;
      try {
        const response = await invokeLLM({ messages: [{ role: "system", content: LEARNING_ROADMAP_PROMPT }, { role: "user", content: wrapUntrusted("STUDENT_INFO", userMessage) }], response_format: { type: "json_object" } });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
        await createAiLog({ userId: ctx.user.id, type: "learning_roadmap", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "learning_roadmap", tokensUsed, success: false });
        throw error;
      }
    }),

  // 11. AI 포트폴리오 점수
  portfolioScore: protectedProcedure
    .input(z.object({
      description: z.string().max(3000),
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
      targetJob: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);
      const userMessage = `포트폴리오 내용:\n${sanitizeForPrompt(input.description, 3000)}\n\n보유 툴: ${sanitizeList(input.tools)}\n작업물: ${sanitizeList(input.works)}\n목표 직무: ${sanitizeForPrompt(input.targetJob ?? "미정", 100)}`;
      let tokensUsed = 0;
      try {
        const response = await invokeLLM({ messages: [{ role: "system", content: PORTFOLIO_SCORE_PROMPT }, { role: "user", content: wrapUntrusted("PORTFOLIO", userMessage) }], response_format: { type: "json_object" } });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
        await createAiLog({ userId: ctx.user.id, type: "portfolio_score", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "portfolio_score", tokensUsed, success: false });
        throw error;
      }
    }),

  // 12. AI 취업 준비도
  jobReadiness: protectedProcedure
    .input(z.object({
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
      targetJob: z.string().max(100),
      hasResume: z.boolean().optional(),
      hasPortfolio: z.boolean().optional(),
      hasApplied: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);
      const userMessage = `보유 툴: ${sanitizeList(input.tools)}\n주요 작업물: ${sanitizeList(input.works)}\n목표 직무: ${sanitizeForPrompt(input.targetJob, 100)}\n이력서 작성: ${input.hasResume ? "완료" : "미완료"}\n포트폴리오: ${input.hasPortfolio ? "완료" : "미완료"}\n지원 이력: ${input.hasApplied ? "있음" : "없음"}`;
      let tokensUsed = 0;
      try {
        const response = await invokeLLM({ messages: [{ role: "system", content: JOB_READINESS_PROMPT }, { role: "user", content: wrapUntrusted("STUDENT_INFO", userMessage) }], response_format: { type: "json_object" } });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
        await createAiLog({ userId: ctx.user.id, type: "job_readiness", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "job_readiness", tokensUsed, success: false });
        throw error;
      }
    }),

  // 13. AI 주간 리포트
  weeklyReport: protectedProcedure
    .input(z.object({
      tools: z.array(z.string().max(50)).max(20),
      works: z.array(z.string().max(100)).max(20),
      thisWeekDone: z.string().max(1000),
      nextWeekPlan: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);
      const userMessage = `보유 툴: ${sanitizeList(input.tools)}\n주요 작업물: ${sanitizeList(input.works)}\n이번 주 한 일: ${sanitizeForPrompt(input.thisWeekDone, 1000)}\n다음 주 계획: ${sanitizeForPrompt(input.nextWeekPlan ?? "미정", 500)}`;
      let tokensUsed = 0;
      try {
        const response = await invokeLLM({ messages: [{ role: "system", content: WEEKLY_REPORT_PROMPT }, { role: "user", content: wrapUntrusted("STUDENT_INFO", userMessage) }], response_format: { type: "json_object" } });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
        await createAiLog({ userId: ctx.user.id, type: "weekly_report", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "weekly_report", tokensUsed, success: false });
        throw error;
      }
    }),

  // 14. 포트폴리오 구성전략 (채용분야 기반 사전 전략)
  portfolioStrategy: protectedProcedure
    .input(z.object({
      targetField: z.string().max(100),
      jobPosting: z.string().max(3000).optional(),
      tools: z.array(z.string().max(50)).max(20),
      currentWorks: z.array(z.string().max(100)).max(20),
      level: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await enforceAiRateLimit(ctx.user.id, AI_LIMITS.analysis);
      const userMessage = [
        `희망 취업분야: ${sanitizeForPrompt(input.targetField, 100)}`,
        input.jobPosting ? `채용공고:\n${wrapUntrusted("JOB_POSTING", sanitizeForPrompt(input.jobPosting, 3000))}` : "",
        `보유 툴: ${sanitizeList(input.tools)}`,
        `현재 작업물 현황: ${sanitizeList(input.currentWorks)}`,
        `수준: ${sanitizeForPrompt(input.level ?? "초급~중급", 100)}`,
      ].filter(Boolean).join("\n\n");
      let tokensUsed = 0;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: PORTFOLIO_STRATEGY_PROMPT },
            { role: "user", content: wrapUntrusted("STUDENT_INFO", userMessage) },
          ],
          response_format: { type: "json_object" },
        });
        tokensUsed = response.usage?.total_tokens ?? 0;
        const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
        await createAiLog({ userId: ctx.user.id, type: "portfolio_strategy", tokensUsed, success: true });
        return { success: true, data };
      } catch (error) {
        await createAiLog({ userId: ctx.user.id, type: "portfolio_strategy", tokensUsed, success: false });
        throw error;
      }
    }),

  // 6. 관리자용: 설문 제출한 학생 목록 조회
  adminGetSurveys: protectedProcedure
    .query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "professor" || ctx.user.role === "training_center";
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select({
          guidanceId: careerGuidance.id,
          studentUserId: careerGuidance.studentUserId,
          careerTrack: careerGuidance.careerTrack,
          surveyData: careerGuidance.surveyData,
          updatedAt: careerGuidance.updatedAt,
          userName: users.name,
        })
        .from(careerGuidance)
        .innerJoin(users, eq(careerGuidance.studentUserId, users.id))
        .where(isNotNull(careerGuidance.surveyData))
        .orderBy(desc(careerGuidance.updatedAt));
      return rows;
    }),
});
