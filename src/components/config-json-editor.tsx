import React, { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectPath?: string;
};

// 配置 JSON 编辑器对话框
export const ConfigJsonEditorDialog: React.FC<Props> = ({ open, onOpenChange, projectPath }) => {
  // 加载状态与文本内容
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jsonText, setJsonText] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 是否可以保存（JSON 解析校验）
  const canSave = useMemo(() => {
    if (!jsonText.trim()) return false;
    try {
      JSON.parse(jsonText);
      return true;
    } catch {
      return false;
    }
  }, [jsonText]);

  // 打开时加载当前项目的 .hold-config.json
  useEffect(() => {
    if (!open) return;
    if (!projectPath) {
      setError("未选择项目，无法加载配置");
      setJsonText("");
      return;
    }
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        // 通过后端命令读取当前项目配置对象
        const data = await invoke<any>("load_project_config", { projectPath });
        // 美化为可编辑字符串
        setJsonText(JSON.stringify(data, null, 2));
      } catch (e: any) {
        console.error("加载配置失败", e);
        setError("加载配置失败，请稍后重试");
        setJsonText("");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, projectPath]);

  // 保存修改到 .hold-config.json
  const handleSave = async () => {
    if (!projectPath) return;
    try {
      setSaving(true);
      setError("");
      // 解析用户编辑的 JSON 文本
      const obj = JSON.parse(jsonText);
      // 调用后端保存（tauri 命令需要对象形态）
      await invoke("save_project_config", { config: obj });
      toast.success("已保存到 .hold-config.json");
      onOpenChange(false);
    } catch (e: any) {
      console.error("保存失败", e);
      setError("保存失败：请检查 JSON 格式是否正确");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 全屏弹窗：textarea 铺满可视区域 */}
      <DialogContent fullscreen className="max-w-none w-[100vw] h-[100vh] p-0">
        <DialogHeader>
          <DialogTitle>配置 JSON 编辑器</DialogTitle>
          <DialogDescription>
            直接编辑当前项目下的 .hold-config.json（请谨慎操作）
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-[calc(100vh-136px)] gap-2 px-4 pb-4">
          {/* 加载与错误提示 */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size={16} /> 正在加载配置...
            </div>
          ) : null}
          {error ? (
            <Text className="text-destructive">{error}</Text>
          ) : null}

          {/* 文本编辑区域：使用 textarea，避免引入大型编辑器依赖 */}
          <textarea
            className="flex-1 min-h-0 font-mono text-sm leading-6 bg-muted/40 border border-input rounded-md p-3 outline-none focus:ring-2 focus:ring-ring/50"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="在此粘贴或编辑 JSON 文本"
          />

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                // 尝试格式化 JSON 文本
                try {
                  const obj = JSON.parse(jsonText);
                  setJsonText(JSON.stringify(obj, null, 2));
                  toast.success("已格式化");
                } catch {
                  toast.warning("格式化失败：JSON 无法解析");
                }
              }}
            >
              格式化
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                // 校验 JSON 文本
                try {
                  JSON.parse(jsonText);
                  toast.success("JSON 校验通过");
                } catch (e: any) {
                  toast.error(`JSON 校验失败：${e?.message || "语法错误"}`);
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
