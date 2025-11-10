import { EnvFile } from "../types";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ButtonGroup } from "./ui/button-group";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Spinner } from "./ui/spinner";
import { toast } from "sonner";

interface EnvFileTabsProps {
  envFiles: EnvFile[];
  selectedEnvFile?: string;
  onEnvFileSelect: (value: string) => void;
}

export const EnvFileTabs = ({
  envFiles,
  selectedEnvFile,
  onEnvFileSelect,
}: EnvFileTabsProps) => {
  // 弹窗状态与内容
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // 查看当前环境变量文件：弹窗展示内容
  const handleViewCurrentEnvFile = async () => {
    const current =
      envFiles.find((f) => f.name === selectedEnvFile) ??
      (selectedEnvFile && /^\d+$/.test(selectedEnvFile)
        ? envFiles[parseInt(selectedEnvFile, 10)]
        : undefined);

    if (!current) {
      setPreviewTitle("未选择环境文件");
      setPreviewContent("请先选择一个环境文件");
      setPreviewOpen(true);
      return;
    }

    setPreviewTitle(current.name);
    setPreviewOpen(true); // 先打开弹窗以便显示加载态
    setIsLoading(true);

    let text = current.content || "";
    try {
      if (current.path) {
        // 通过后端命令读取文件，绕过前端 fs 插件的能力限制
        // 注意：后端命令在 tauri invoke handler 中已注册为 read_env_file
        text = await invoke<string>("read_env_file", {
          filePath: current.path,
        });
      }
    } catch (e) {
      console.error("读取文件失败", e);
      toast.error("读取文件失败，已回退到缓存内容");
    } finally {
      setPreviewContent(text || "");
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-start gap-3 border-b bg-background p-3">
        <ButtonGroup>
          {envFiles.map((file) => {
            const isActive =
              selectedEnvFile === file.name ||
              (selectedEnvFile && /^\d+$/.test(selectedEnvFile)
                ? envFiles[parseInt(selectedEnvFile, 10)]?.name === file.name
                : false);
            return (
              <Button
                key={file.name}
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => onEnvFileSelect(file.name)}
              >
                {file.name}
              </Button>
            );
          })}
        </ButtonGroup>
        <Button onClick={handleViewCurrentEnvFile}>查看当前环境变量文件</Button>
      </div>

      {/* 预览弹窗 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl w-[860px]">
          <DialogHeader>
            <DialogTitle>{previewTitle || "预览环境变量文件"}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size={16} /> 正在读取文件...
              </div>
            ) : null}
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 bg-muted/40 border border-input rounded-md p-4 max-h-[60vh] overflow-auto">
              {previewContent || "（文件为空）"}
            </pre>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(previewContent || "");
                    toast.success("已复制到剪贴板");
                  } catch {
                    toast.warning("复制失败，请手动选择文本复制");
                  }
                }}
              >
                复制内容
              </Button>
              <Button onClick={() => setPreviewOpen(false)}>关闭</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
