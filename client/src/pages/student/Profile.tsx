import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Save, Plus, X, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StudentProfile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.user.getStudentProfile.useQuery();

  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [major, setMajor] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [employmentStatus, setEmploymentStatus] = useState<"준비중" | "지원중" | "취업확정" | "미시작">("미시작");
  const [employedCompany, setEmployedCompany] = useState("");

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (profile) {
      setStudentId(profile.studentId ?? "");
      setMajor(profile.major ?? "");
      setPhone(profile.phone ?? "");
      setBio(profile.bio ?? "");
      setSkills((profile.skills as string[] | null) ?? []);
      setPublicSlug(profile.publicSlug ?? "");
      setIsPublic(profile.isPublic ?? false);
      setEmploymentStatus(profile.employmentStatus ?? "미시작");
      setEmployedCompany(profile.employedCompany ?? "");
    }
  }, [profile]);

  const updateName = trpc.user.updateMyName.useMutation();

  const update = trpc.user.updateStudentProfile.useMutation({
    onSuccess: () => { utils.user.getStudentProfile.invalidate(); toast.success("프로필이 저장되었습니다."); },
    onError: (e) => toast.error(e.message),
  });

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter(sk => sk !== s));

  const handleSave = async () => {
    // 이름이 바뀌었으면 함께 저장 후 헤더/사이드바 갱신
    if (name.trim() && name.trim() !== (user?.name ?? "")) {
      await updateName.mutateAsync({ name: name.trim() });
      utils.auth.me.invalidate();
    }
    update.mutate({
      studentId, major, phone, bio, skills, publicSlug, isPublic,
      employmentStatus,
      employedCompany: employmentStatus === "취업확정" ? employedCompany : undefined,
    });
  };

  return (
    <AppLayout title="내 프로필">
      <div className="p-6 space-y-6 pb-20 lg:pb-6 max-w-2xl">
        {/* Basic info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>이름</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="이름" className="mt-1" />
              </div>
              <div>
                <Label>학번</Label>
                <Input value={studentId} onChange={e => setStudentId(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>전공</Label>
                <Input value={major} onChange={e => setMajor(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>연락처</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>자기소개</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="mt-1" placeholder="간단한 자기소개를 작성해주세요." />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">보유 스킬</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSkill()}
                placeholder="스킬 입력 후 Enter"
              />
              <Button variant="outline" onClick={addSkill}><Plus size={16} /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <button onClick={() => removeSkill(s)}><X size={12} /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employment status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">취업 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>취업 상태</Label>
              <Select value={employmentStatus} onValueChange={(v) => setEmploymentStatus(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="미시작">미시작</SelectItem>
                  <SelectItem value="준비중">준비중</SelectItem>
                  <SelectItem value="지원중">지원중</SelectItem>
                  <SelectItem value="취업확정">취업확정</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {employmentStatus === "취업확정" && (
              <div>
                <Label>취업 회사명</Label>
                <Input value={employedCompany} onChange={e => setEmployedCompany(e.target.value)} className="mt-1" placeholder="회사명을 입력하세요" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Public profile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">공개 프로필</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">프로필 공개</p>
                <p className="text-xs text-muted-foreground">협력기업이 내 프로필을 탐색할 수 있습니다.</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            {isPublic && (
              <div>
                <Label>공개 URL 슬러그</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={publicSlug} onChange={e => setPublicSlug(e.target.value)} placeholder="my-portfolio" />
                  {publicSlug && (
                    <a href={`/portfolio/${publicSlug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon"><ExternalLink size={16} /></Button>
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">/portfolio/{publicSlug || "슬러그"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button className="w-full gap-2" onClick={handleSave} disabled={update.isPending}>
          <Save size={16} />
          {update.isPending ? "저장 중..." : "프로필 저장"}
        </Button>
      </div>
    </AppLayout>
  );
}
