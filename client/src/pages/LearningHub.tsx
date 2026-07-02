import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronRight, ChevronDown, FileText, Folder, BookOpen, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";

const REPO = "vipermo15-dotcom/cgd-ai-career-platform";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main`;

const STUDENT_GUIDANCE: { id: string; label: string; files: { name: string; path: string }[] }[] = [
  { id: "김건우", label: "김건우", files: [
    { name: "진로지도 (최종)", path: "docs/김건우/진로지도-김건우-20260625-최종.md" },
  ]},
  { id: "김규연", label: "김규연", files: [
    { name: "진로지도", path: "docs/김규연/진로지도-김규연-20260625.md" },
    { name: "포트폴리오가이드", path: "docs/김규연/포트폴리오가이드-김규연-20260625.md" },
  ]},
  { id: "김민지", label: "김민지", files: [
    { name: "진로지도", path: "docs/김민지/진로지도-포트폴리오가이드/진로지도-민지-20260625.md" },
    { name: "포트폴리오가이드", path: "docs/김민지/진로지도-포트폴리오가이드/포트폴리오가이드-민지-20260625.md" },
  ]},
  { id: "김승희", label: "김승희", files: [
    { name: "진로지도", path: "docs/김승희/진로지도-김승희.md" },
    { name: "포트폴리오가이드", path: "docs/김승희/포트폴리오가이드-김승희.md" },
  ]},
  { id: "박민서", label: "박민서", files: [
    { name: "진로지도", path: "docs/박민서/진로지도-박민서-20260625.md" },
    { name: "이력서분석", path: "docs/박민서/진로지도-이력서분석-박민서-20260625.md" },
    { name: "포트폴리오가이드", path: "docs/박민서/포트폴리오가이드-박민서-20260625.md" },
  ]},
  { id: "박세은", label: "박세은", files: [
    { name: "포트폴리오가이드", path: "docs/박세은/포트폴리오가이드-박세은.md" },
  ]},
  { id: "박소현", label: "박소현", files: [
    { name: "진로지도", path: "docs/박소현/진로지도-소현-20260625.md" },
    { name: "포트폴리오가이드", path: "docs/박소현/포트폴리오가이드-소현-20260625.md" },
  ]},
  { id: "박연", label: "박연", files: [
    { name: "진로지도", path: "docs/박연/진로지도-연-20260625.md" },
    { name: "핸즈픽 분석", path: "docs/박연/진로지도-연-핸즈픽분석-20260625.md" },
    { name: "포트폴리오가이드", path: "docs/박연/포트폴리오가이드-연-20260625.md" },
  ]},
  { id: "박홍덕", label: "박홍덕", files: [
    { name: "진로지도", path: "docs/박홍덕/진로지도-박홍덕-20260625.md" },
  ]},
  { id: "서두원", label: "서두원", files: [
    { name: "진로지도 종합", path: "docs/서두원/진로지도-서두원-종합문서-20260625.md" },
  ]},
  { id: "이윤정", label: "이윤정", files: [
    { name: "진로지도", path: "docs/이윤정/진로지도_ 이윤정.md" },
  ]},
  { id: "이윤채", label: "이윤채", files: [
    { name: "이력서분석", path: "docs/이윤채/이력서분석-이윤채-20260625.md" },
  ]},
  { id: "임효정", label: "임효정", files: [
    { name: "진로지도 가이드", path: "docs/임효정/진로지도-가이드-임효정.md" },
    { name: "포트폴리오 가이드", path: "docs/임효정/포트폴리오-가이드-임효정.md" },
  ]},
  { id: "장아름", label: "장아름", files: [
    { name: "공고분석", path: "docs/장아름/공고분석-장아름-20260625.md" },
    { name: "진로지도", path: "docs/장아름/진로지도-아름-20260625.md" },
    { name: "포트폴리오가이드", path: "docs/장아름/포트폴리오가이드-아름-20260625.md" },
  ]},
  { id: "장혜정", label: "장혜정", files: [
    { name: "포트폴리오가이드", path: "docs/장혜정/포트폴리오가이드-장혜정.md" },
  ]},
  { id: "정채원", label: "정채원", files: [
    { name: "진로지도", path: "docs/정채원/진로지도-정채원-20260625.md" },
    { name: "포트폴리오가이드", path: "docs/정채원/포트폴리오가이드-정채원-20260625.md" },
  ]},
  { id: "조수정", label: "조수정", files: [
    { name: "진로지도 (최종)", path: "docs/조수정/진로지도-조수정-20260625-최종.md" },
  ]},
  { id: "황상민", label: "황상민", files: [
    { name: "진로지도 (최종)", path: "docs/황상민/진로지도-황상민-최종-20260625.md" },
  ]},
];

const SECTIONS = [
  {
    id: "docs",
    label: "📚 교육 자료",
    files: [
      { name: "00-오리엔테이션", path: "docs/00-오리엔테이션.md" },
      { name: "01-Git 설치", path: "docs/01-Git설치.md" },
      { name: "02-GitHub", path: "docs/02-GitHub.md" },
      { name: "03-VSCode", path: "docs/03-VSCode.md" },
      { name: "04-Claude 무료", path: "docs/04-Claude무료.md" },
      { name: "05-MCP", path: "docs/05-MCP.md" },
      { name: "06-Firecrawl", path: "docs/06-Firecrawl.md" },
      { name: "07-GitHub Projects", path: "docs/07-GitHubProjects.md" },
      { name: "08-Markdown", path: "docs/08-Markdown.md" },
      { name: "09-AI 프롬프트", path: "docs/09-AI프롬프트.md" },
      { name: "10-포트폴리오", path: "docs/10-포트폴리오.md" },
      { name: "11-자기소개서", path: "docs/11-자기소개서.md" },
      { name: "12-기업분석", path: "docs/12-기업분석.md" },
      { name: "13-면접준비", path: "docs/13-면접준비.md" },
      { name: "14-취업지원시스템", path: "docs/14-취업지원시스템.md" },
      { name: "15-FAQ", path: "docs/15-FAQ.md" },
      { name: "16-문제해결", path: "docs/16-문제해결.md" },
      { name: "17-프로젝트예제", path: "docs/17-프로젝트예제.md" },
      { name: "18-GitHub Actions", path: "docs/18-GitHubActions.md" },
      { name: "19-Firecrawl 자동화", path: "docs/19-Firecrawl자동화.md" },
      { name: "20-교육생실습", path: "docs/20-교육생실습.md" },
    ],
  },
  {
    id: "students",
    label: "🎓 주차별 실습",
    weeks: Array.from({ length: 20 }, (_, i) => {
      const w = String(i + 1).padStart(2, "0");
      return {
        id: `Week${w}`,
        label: `Week ${i + 1}`,
        files: [
          { name: "실습", path: `students/Week${w}/실습.md` },
          { name: "미션", path: `students/Week${w}/미션.md` },
          { name: "체크리스트", path: `students/Week${w}/체크리스트.md` },
          { name: "예제", path: `students/Week${w}/예제.md` },
        ],
      };
    }),
  },
  {
    id: "prompt",
    label: "💬 프롬프트 라이브러리",
    files: [
      { name: "Claude 프롬프트 50선", path: "prompt/claude.md" },
      { name: "Gemini 프롬프트", path: "prompt/gemini.md" },
      { name: "ChatGPT 프롬프트", path: "prompt/chatgpt.md" },
      { name: "Firecrawl 명령어", path: "prompt/firecrawl.md" },
      { name: "Midjourney 프롬프트", path: "prompt/midjourney.md" },
    ],
  },
  {
    id: "template",
    label: "📄 템플릿",
    files: [
      { name: "포트폴리오 템플릿", path: "template/포트폴리오.md" },
      { name: "이력서 템플릿", path: "template/이력서.md" },
      { name: "자기소개서 템플릿", path: "template/자기소개서.md" },
      { name: "기업분석 보고서", path: "template/기업분석.md" },
      { name: "회의록", path: "template/회의록.md" },
      { name: "보고서", path: "template/보고서.md" },
      { name: "취업추천서", path: "template/취업추천서.md" },
    ],
  },
  {
    id: "workflow",
    label: "🔄 워크플로우",
    files: [
      { name: "학생 학습 플로우", path: "workflow/학생학습.md" },
      { name: "취업 준비 플로우", path: "workflow/취업.md" },
      { name: "포트폴리오 플로우", path: "workflow/포트폴리오.md" },
      { name: "기업분석 플로우", path: "workflow/기업분석.md" },
      { name: "Firecrawl 플로우", path: "workflow/Firecrawl.md" },
    ],
  },
  {
    id: "guidance",
    label: "📂 교육생 진로지도",
    students: STUDENT_GUIDANCE,
  },
];

type FileItem = { name: string; path: string };

function NavSection({ section, selected, onSelect }: {
  section: typeof SECTIONS[0];
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState<string | null>(null);

  const rawSub = (section as any).weeks || (section as any).students;
  const subItems: any[] | null = Array.isArray(rawSub) ? rawSub : rawSub ? [] : null;
  if (subItems) {
    const folderColor = (section as any).students ? "text-purple-400" : "text-blue-400";
    return (
      <div>
        <button
          className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 font-semibold text-sm text-gray-700"
          onClick={() => setOpen(!open)}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{section.label}</span>
        </button>
        {open && (
          <div className="ml-2">
            {subItems.map((item: any) => (
              <div key={item.id}>
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm text-gray-600"
                  onClick={() => setWeekOpen(weekOpen === item.id ? null : item.id)}
                >
                  <Folder size={13} className={folderColor} />
                  {weekOpen === item.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {item.label}
                </button>
                {weekOpen === item.id && (
                  <div className="ml-6">
                    {(Array.isArray(item.files) ? item.files : []).map((f: FileItem) => (
                      <button
                        key={f.path}
                        onClick={() => onSelect(f.path)}
                        className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-xs ${
                          selected === f.path ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <FileText size={11} />
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 font-semibold text-sm text-gray-700"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{section.label}</span>
      </button>
      {open && (
        <div className="ml-2">
          {(Array.isArray(section.files) ? (section.files as FileItem[]) : []).map((f) => (
            <button
              key={f.path}
              onClick={() => onSelect(f.path)}
              className={`flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-lg text-sm ${
                selected === f.path ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileText size={13} className="shrink-0" />
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LearningHub() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!selectedPath) return;
    setLoading(true);
    setError(null);
    setContent("");
    const encodedPath = selectedPath.split("/").map(encodeURIComponent).join("/");
    fetch(`${RAW_BASE}/${encodedPath}`)
      .then((r) => {
        if (!r.ok) throw new Error("파일을 불러올 수 없습니다.");
        return r.text();
      })
      .then(setContent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedPath]);

  const selectedName = selectedPath?.split("/").pop()?.replace(".md", "") ?? "";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* 사이드바 */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} flex-shrink-0 border-r bg-gray-50 overflow-y-auto transition-all duration-200`}>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-3 px-1">
            <BookOpen size={16} className="text-blue-600" />
            <span className="font-bold text-sm text-gray-800">학습 자료 허브</span>
          </div>
          <a
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-4 px-1"
          >
            <ExternalLink size={11} />
            GitHub 저장소 바로가기
          </a>
          <div className="space-y-1">
            {SECTIONS.map((s) => (
              <NavSection key={s.id} section={s} selected={selectedPath} onSelect={setSelectedPath} />
            ))}
          </div>
        </div>
      </aside>

      {/* 본문 */}
      <main className="flex-1 overflow-y-auto">
        {/* 상단 바 */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded"
          >
            <Folder size={16} />
          </button>
          {selectedPath && (
            <span className="text-sm text-gray-600 font-medium">{selectedName}</span>
          )}
          {selectedPath && (
            <a
              href={`https://github.com/${REPO}/blob/main/${selectedPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <ExternalLink size={12} />
              GitHub에서 보기
            </a>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {!selectedPath && (
            <div className="text-center py-20">
              <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
              <h2 className="text-xl font-bold text-gray-700 mb-2">CGD 학습 자료 허브</h2>
              <p className="text-gray-400 text-sm mb-6">
                좌측 메뉴에서 학습하고 싶은 자료를 선택하세요.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
                {SECTIONS.map((s) => (
                  <div key={s.id} className="bg-gray-50 rounded-xl p-4 border">
                    <div className="text-lg mb-1">{s.label.split(" ")[0]}</div>
                    <div className="text-xs font-semibold text-gray-700">{s.label.slice(2)}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {s.weeks ? "20주차" : `${(s.files as FileItem[]).length}개 문서`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">불러오는 중...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-red-400">
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSelectedPath(null)}>
                돌아가기
              </Button>
            </div>
          )}

          {!loading && !error && content && (
            <article className="prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
