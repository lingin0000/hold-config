import { CategoryTemplate } from "../types";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner"
import { MinusCircle, Plus } from "lucide-react";

interface CategoryTemplateDialogProps {
  isOpen: boolean;
  isNewTemplate: boolean;
  editingTemplate: CategoryTemplate | null;
  onClose: () => void;
  onSave: (data: CategoryTemplate) => void;
}

export const CategoryTemplateDialog = ({
  isOpen,
  isNewTemplate,
  editingTemplate,
  onClose,
  onSave,
}: CategoryTemplateDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keys, setKeys] = useState<string[]>([]);

  // 当编辑模板变化时，更新表单数据
  useEffect(() => {
    if (isOpen) {
      setName(editingTemplate?.name || "");
      setDescription(editingTemplate?.description || "");
      setKeys(editingTemplate?.keys || []);
    }
  }, [editingTemplate, isOpen]);

  // 处理保存逻辑
  const handleSave = () => {
    if (!name || !name.trim()) {
      toast.error("请输入分类名称");
      return;
    }
    const filteredKeys = keys.map((k) => k.trim()).filter((k) => k);
    // 重复校验
    const set = new Set(filteredKeys);
    if (set.size !== filteredKeys.length) {
      toast.error("Key名称不能重复");
      return;
    }
    onSave({
      id: editingTemplate?.id,
      name: name.trim(),
      description: description.trim(),
      keys: filteredKeys,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNewTemplate ? "添加分类模板" : "编辑分类模板"}</DialogTitle>
          <DialogDescription>请填写模板名称与变量 Key 列表</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid gap-1">
            <Label htmlFor="tmpl-name">分类名称</Label>
            <Input id="tmpl-name" type="text" placeholder="输入分类名称" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="tmpl-desc">分类描述</Label>
            <Input id="tmpl-desc" type="text" placeholder="输入分类描述（可选）" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">变量Key列表</div>
            <Button
              size="sm"
              onClick={() => setKeys((arr) => [...arr, ""])}
            >
              <Plus className="mr-2 size-4" /> 添加Key
            </Button>
          </div>

          {keys.length > 0 ? (
            <div className="flex flex-col gap-2">
              {keys.map((k, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-96 grid gap-1">
                    <Label htmlFor={`tmpl-key-${idx}`}>{`Key${idx + 1}`}</Label>
                    <Input
                      id={`tmpl-key-${idx}`}
                      type="text"
                      placeholder="变量Key名称"
                      className="w-full"
                      value={k}
                      onChange={(e) => {
                        const v = e.target.value;
                        setKeys((arr) => arr.map((item, i) => (i === idx ? v : item)));
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="删除此Key"
                    onClick={() => setKeys((arr) => arr.filter((_, i) => i !== idx))}
                  >
                    <MinusCircle />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground">
              暂无变量Key，点击上方"添加Key"按钮开始添加
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
