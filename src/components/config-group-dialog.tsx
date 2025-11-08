import { useEffect, useState } from "react";
import { EnvGroup, CategoryTemplate, EnvVariable } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { toast } from "sonner";

interface ConfigGroupDialogProps {
  isOpen: boolean;
  isNewGroup: boolean;
  editingGroup: EnvGroup | null;
  categoryTemplates: CategoryTemplate[];
  onClose: () => void;
  onSave: (group: EnvGroup) => void;
  onGroupChange: (group: EnvGroup) => void;
}

export const ConfigGroupDialog = ({
  isOpen,
  isNewGroup,
  editingGroup,
  categoryTemplates,
  onClose,
  onSave,
  onGroupChange,
}: ConfigGroupDialogProps) => {
  const [localGroup, setLocalGroup] = useState<EnvGroup>({
    id: undefined,
    name: "",
    description: "",
    category: "",
    variables: [],
  });
  const [variables, setVariables] = useState<EnvVariable[]>([]);

  const handleCategoryChange = (value: string) => {
    const template = categoryTemplates.find((t) => t.name === value);
    if (template) {
      setVariables(
        template.keys.map((key) => ({
          key,
          value: "",
          options: [],
        }))
      );
    }
  };

  const handleSubmit = () => {
    if (!localGroup.name || !localGroup.name.trim()) {
      toast.error("请输入配置组名称");
      return;
    }
    onSave({ ...localGroup, variables });
  };

  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        setLocalGroup({
          id: editingGroup.id,
          name: editingGroup.name || "",
          description: editingGroup.description || "",
          category: editingGroup.category || "",
          variables: editingGroup.variables || [],
        });
        setVariables(editingGroup.variables || []);
      } else {
        setLocalGroup({ id: undefined, name: "", description: "", category: "", variables: [] });
        setVariables([]);
      }
    }
  }, [editingGroup, isOpen]);

  // 将本地编辑状态同步到外部（用于预览或父组件状态）
  useEffect(() => {
    onGroupChange({ ...localGroup, variables });
  }, [localGroup, variables]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl w-[860px]">
        <DialogHeader>
          <DialogTitle>
            {isNewGroup ? "添加配置" : editingGroup?.id ? "编辑配置" : "复制配置"}
          </DialogTitle>
          <DialogDescription>配置分类与变量值请按需填写</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid gap-1">
            <div className="text-xs text-muted-foreground">选择配置分类</div>
            <Select
              value={localGroup.category || undefined}
              onValueChange={(val) => {
                setLocalGroup((g) => ({ ...g, category: val }));
                handleCategoryChange(val);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categoryTemplates.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="group-name">配置组名称</Label>
            <Input
              id="group-name"
              type="text"
              placeholder="输入配置组名称"
              value={localGroup.name}
              onChange={(e) => setLocalGroup((g) => ({ ...g, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="group-desc">配置组描述</Label>
            <Input
              id="group-desc"
              type="text"
              placeholder="输入配置组描述（可选）"
              value={localGroup.description || ""}
              onChange={(e) => setLocalGroup((g) => ({ ...g, description: e.target.value }))}
            />
          </div>

          {/* 变量列表 */}
          {variables.length > 0 ? (
            <div className="mt-2 flex flex-col gap-2 max-h-[60vh] overflow-auto pr-1">
              {variables.map((v, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="min-w-0 grid gap-1">
                    <Label htmlFor={`var-key-${idx}`}>{`变量${idx + 1}`}</Label>
                    <Input id={`var-key-${idx}`} type="text" value={v.key} disabled className="w-full" />
                  </div>
                  <div className="min-w-0 grid gap-1">
                    <Label htmlFor={`var-val-${idx}`}>值</Label>
                    <Input
                      id={`var-val-${idx}`}
                      type="text"
                      placeholder="输入变量值"
                      value={v.value || ""}
                      className="w-full"
                      onChange={(e) => {
                        const nv = e.target.value;
                        setVariables((arr) => arr.map((item, i) => (i === idx ? { ...item, value: nv } : item)));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground">暂无变量Key</div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={handleSubmit}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
