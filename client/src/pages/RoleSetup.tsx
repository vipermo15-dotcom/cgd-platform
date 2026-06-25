import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { GraduationCap, Users, Building2, Award } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const roles = [
  { value: "student", label: "재학생", icon: <GraduationCap size={24} />, desc: "포트폴리오 관리 및 취업 지원", color: "border-blue-300 hover:border-blue-500 hover:bg-blue-50" },
  { value: "professor", label: "학과장", icon: <Users size={24} />, desc: "학생 관리 및 통계 보고서", color: "border-purple-300 hover:border-purple-500 hover:bg-purple-50" },
  { value: "company", label: "협력기업", icon: <Building2 size={24} />, desc: "인재 탐색 및 채용공고 등록", color: "border-orange-300 hover:border-orange-500 hover:bg-orange-50" },
  { value: "training_center", label: "공동훈련센터", icon: <Building2 size={24} />, desc: "산학협력 관리 및 AI 매칭", color: "border-green-300 hover:border-green-500 hover:bg-green-50" },
];

export default function RoleSetup() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState("");
  const [studentId, setStudentId] = useState("");
  const [major, setMajor] = useState("컴퓨터그래픽디자인");
  const [companyName, setCompanyName] = useState("");

  const setRole = trpc.user.setRole.useMutation({
    onSuccess: () => {
      toast.success("역할이 설정되었습니다. 관리자 승인 후 서비스를 이용할 수 있습니다.");
      const routes: Record<string, string> = {
        student: "/student",
        professor: "/professor",
        company: "/company/talent",
        training_center: "/training",
      };
      navigate(routes[selectedRole] ?? "/");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!selectedRole) return toast.error("역할을 선택해주세요.");
    if (selectedRole === "student" && !studentId) return toast.error("학번을 입력해주세요.");
    if (selectedRole === "company" && !companyName) return toast.error("회사명을 입력해주세요.");
    setRole.mutate({ role: selectedRole as any, studentId, major, companyName });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">역할 선택</h1>
          <p className="text-muted-foreground">
            안녕하세요, <strong>{user?.name}</strong>님! 사용할 역할을 선택해주세요.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRole(r.value)}
              className={`p-5 rounded-xl border-2 text-left transition-all ${r.color} ${
                selectedRole === r.value ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
            >
              <div className="mb-2 text-muted-foreground">{r.icon}</div>
              <p className="font-semibold">{r.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Additional fields */}
        {selectedRole === "student" && (
          <Card className="mb-6">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label>학번 *</Label>
                <Input
                  placeholder="학번을 입력하세요"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>전공</Label>
                <Input
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {selectedRole === "company" && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <Label>회사명 *</Label>
              <Input
                placeholder="회사명을 입력하세요"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
              />
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={!selectedRole || setRole.isPending}
        >
          {setRole.isPending ? "처리 중..." : "역할 설정 완료"}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          재학생 및 협력기업은 관리자 승인 후 서비스 이용이 가능합니다.
        </p>
      </div>
    </div>
  );
}
