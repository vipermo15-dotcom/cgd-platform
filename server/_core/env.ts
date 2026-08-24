export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // 마누스 종속 — 이전(migration) 기간에만 남겨둠. 아래 직접 연동 값이 있으면 그쪽을 우선 사용한다.
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ─── AI (OpenAI 직접 연동) ───────────────────────────────────────────────
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o",

  // ─── 파일 저장소 (S3 호환 — Cloudflare R2 등) ────────────────────────────
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",

  // ─── 로그인 (Google OAuth 직접 연동) ──────────────────────────────────────
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
};
