import { TRPCError } from "@trpc/server";
import { countRecentAiLogs } from "../db";

/**
 * AI(LLM) 호출 비용 방어용 rate limiter.
 *
 * ai_logs 테이블을 기준으로 사용자별 최근 호출 수를 세어 한도를 초과하면
 * TOO_MANY_REQUESTS를 던진다. DB 기반이라 서버 재시작·다중 인스턴스에서도
 * 일관되게 동작한다(인메모리 카운터와 달리 휘발되지 않음).
 *
 * 호출 성공/실패가 모두 ai_logs에 기록되므로, 실패한 호출도 한도에 포함된다.
 * (반복 실패로 인한 비용·부하도 함께 억제)
 */
export interface AiRateLimit {
  /** 집계 윈도우(밀리초) */
  windowMs: number;
  /** 윈도우 내 허용 횟수 */
  max: number;
  /** 집계할 ai_logs.type. 생략 시 전체 AI 호출 합산 */
  type?: string;
  /** 한도 초과 시 사용자에게 보여줄 메시지 */
  message?: string;
}

export async function enforceAiRateLimit(
  userId: number,
  limit: AiRateLimit,
): Promise<void> {
  const used = await countRecentAiLogs(userId, limit.windowMs, limit.type);
  if (used >= limit.max) {
    const minutes = Math.ceil(limit.windowMs / 60000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        limit.message ??
        `AI 요청이 너무 많습니다. ${minutes}분 동안 최대 ${limit.max}회까지 가능합니다. 잠시 후 다시 시도해주세요.`,
    });
  }
}

// 엔드포인트별 기본 한도 (필요 시 조정)
export const AI_LIMITS = {
  // 역량 분석: 무겁고 자주 바뀔 일이 적음 → 10분에 5회
  analysis: { windowMs: 10 * 60_000, max: 5, type: "analysis" } satisfies AiRateLimit,
  // 자기소개서 생성: 시도 반복이 잦음 → 10분에 10회
  coverLetter: { windowMs: 10 * 60_000, max: 10, type: "cover_letter" } satisfies AiRateLimit,
  // 진로 취업처 추천(관리자/학과장이 학생별로 실행) → 10분에 20회
  recommend: { windowMs: 10 * 60_000, max: 20, type: "recommend" } satisfies AiRateLimit,
  // 진로 상담 채팅: 대화형이라 빈번 → 10분에 30회
  chat: { windowMs: 10 * 60_000, max: 30, type: "career_chat" } satisfies AiRateLimit,
};
