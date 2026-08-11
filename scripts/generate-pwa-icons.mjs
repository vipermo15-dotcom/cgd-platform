// PWA 아이콘 생성 스크립트 — 앱 전역에서 쓰는 브랜드 마크(핑크 사각형 + GraduationCap)를
// 라이브 벡터가 아닌 정적 PNG로 한 번 구워둔다. 디자인이 바뀌면 이 파일만 다시 실행하면 된다.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve(import.meta.dirname, "../client/public");
mkdirSync(OUT_DIR, { recursive: true });

const ACCENT = "#ff385c";

// lucide-react GraduationCap 아이콘의 실제 path data (24x24 viewBox)
const GRAD_CAP_PATHS = [
  "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
  "M22 10v6",
  "M6 12.5V16a6 3 0 0 0 12 0v-3.5",
];

function iconGroup({ scale, translate, strokeWidth = 2 }) {
  const d = GRAD_CAP_PATHS.map((d) => `<path d="${d}" />`).join("");
  return `<g transform="translate(${translate},${translate}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
}

// 일반 아이콘(둥근 사각형 배경, 앱 서랍/홈 화면용) — 레일 로고와 동일한 비례
function standardSvg(size) {
  const radius = size * 0.22;
  const iconBoxRatio = 0.58; // 아이콘이 캔버스의 58%를 차지
  const scale = (size * iconBoxRatio) / 24;
  const translate = (size - 24 * scale) / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${radius}" fill="${ACCENT}" />
    ${iconGroup({ scale, translate, strokeWidth: 2 * (scale / (size * 0.033)) })}
  </svg>`;
}

// 마스커블 아이콘(Android 적응형) — 안전 영역(중앙 80%) 안에 아이콘, 배경은 엣지까지 꽉 채움
function maskableSvg(size) {
  const iconBoxRatio = 0.42; // 마스크에 잘려도 안전하도록 더 작게
  const scale = (size * iconBoxRatio) / 24;
  const translate = (size - 24 * scale) / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${ACCENT}" />
    ${iconGroup({ scale, translate, strokeWidth: 2.2 })}
  </svg>`;
}

const targets = [
  { name: "icon-192.png", svg: standardSvg(192) },
  { name: "icon-512.png", svg: standardSvg(512) },
  { name: "maskable-icon-512.png", svg: maskableSvg(512) },
  { name: "apple-touch-icon.png", svg: standardSvg(180) },
  { name: "favicon-32.png", svg: standardSvg(32) },
];

for (const { name, svg } of targets) {
  const size = Number(svg.match(/width="(\d+)"/)[1]);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT_DIR, name));
  console.log("generated", name);
}
