import React, { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import type { Project } from "@/types";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: Project[];
  onSaveProjects: (projects: Project[]) => void;
};

// 全局项目配置编辑器（Monaco）：编辑所有项目的整体 JSON
export const GlobalJsonEditorDialog: React.FC<Props> = ({ open, onOpenChange, projects, onSaveProjects }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState<string>("");
  const { resolvedTheme } = useTheme();

  // 初始化时载入为格式化 JSON 文本
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    try {
      setText(JSON.stringify(projects ?? [], null, 2));
    } finally {
      setLoading(false);
    }
  }, [open]);

  const canSave = useMemo(() => {
    try {
      if (!text.trim()) return false;
      const value = JSON.parse(text);
      return Array.isArray(value);
    } catch {
      return false;
    }
  }, [text]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        toast.error("顶层必须是数组（projects 列表）");
        return;
      }
      // 保存到本地存储，通过外部回调合入状态
      onSaveProjects(parsed as Project[]);
      toast.success("全局配置已保存");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(`保存失败：${e?.message || "JSON 解析错误"}`);
    } finally {
      setSaving(false);
    }
  };

  const editorTheme = useMemo(() => {
    return resolvedTheme === "dark" ? "vs-dark" : "light";
  }, [resolvedTheme]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 全屏弹窗：占满可视区域，移除内边距以便编辑器铺满 */}
      <DialogContent fullscreen className="max-w-none w-screen h-screen p-0">
        <DialogHeader>
          <DialogTitle>编辑全局项目配置</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
            <Spinner size={16} /> 正在加载...
          </div>
        ) : null}
        {/* 主体区：使用 flex 布局占满屏幕高度 */}
        <div className="flex flex-col h-[calc(100vh-136px)] gap-2 px-4 pb-4">
          <div className="flex-1 border rounded-md overflow-hidden">
            {/* Monaco 编辑器：语言 JSON，自动布局；高度自适应容器 */}
            <Editor
              height="100%"
              defaultLanguage="json"
              value={text}
              onChange={(v) => setText(v ?? "")}
              theme={editorTheme}
              options={{
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                minimap: { enabled: false },
                wordWrap: "on",
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              try {
                const obj = JSON.parse(text);
                setText(JSON.stringify(obj, null, 2));
                toast.success("已格式化");
              } catch {
                toast.warning("格式化失败：JSON 语法错误");
              }
            }}
          >
            格式化
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              try {
                JSON.parse(text);
                toast.success("校验通过");
              } catch (e: any) {
                toast.error(`校验失败：${e?.message || "语法错误"}`);
              }
            }}
          >
            校验
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
