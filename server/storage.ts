// 파일 저장소 — S3 호환 스토리지(Cloudflare R2 등) 직접 연동.
// 기존에는 마누스 Forge가 발급한 presigned URL을 거쳐 S3에 저장했지만,
// 이제 표준 AWS SDK로 어떤 S3 호환 버킷이든 직접 접근한다.
// storagePut/storageGet/storageGetSignedUrl 시그니처는 그대로 유지해
// 호출부(6곳)를 하나도 바꾸지 않아도 되게 했다.

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import { ENV } from "./_core/env";

function getS3Config() {
  const { s3Endpoint, s3Region, s3Bucket, s3AccessKeyId, s3SecretAccessKey } = ENV;

  if (!s3Endpoint || !s3Bucket || !s3AccessKeyId || !s3SecretAccessKey) {
    throw new Error(
      "Storage config missing: set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY"
    );
  }

  return { s3Endpoint, s3Region, s3Bucket, s3AccessKeyId, s3SecretAccessKey };
}

let cachedClient: S3Client | null = null;
function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;
  const { s3Endpoint, s3Region, s3AccessKeyId, s3SecretAccessKey } = getS3Config();
  cachedClient = new S3Client({
    endpoint: s3Endpoint,
    region: s3Region,
    credentials: { accessKeyId: s3AccessKeyId, secretAccessKey: s3SecretAccessKey },
  });
  return cachedClient;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { s3Bucket } = getS3Config();
  const key = appendHashSuffix(normalizeKey(relKey));

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  );

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { s3Bucket } = getS3Config();
  const key = normalizeKey(relKey);

  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({ Bucket: s3Bucket, Key: key }),
    { expiresIn: 3600 }
  );
}
