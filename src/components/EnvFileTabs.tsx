import { IconFile } from "@douyinfe/semi-icons";
import { EnvFile } from "../types";
import {
  Button,
  ButtonGroup,
  Modal,
  Spin,
  Toast,
  CodeHighlight,
} from "@douyinfe/semi-ui";
import { useState } from "react";
import { readTextFile } from "@tauri-apps/plugin-fs";

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
        text = await readTextFile(current.path);
      }
    } catch (e) {
      Toast.error("读取文件失败，已回退到缓存内容");
    } finally {
      setPreviewContent(text || "");
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          borderBottom: `1px solid #ccc`,
          position: "sticky",
          top: 0,
          padding: 12,
          backgroundColor: "var(--semi-color-bg-1)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "flex-start",
        }}
      >
        <ButtonGroup>
          {envFiles.map((file) => (
            <Button
              key={file.name}
              icon={<IconFile />}
              theme={selectedEnvFile === file.name ? "solid" : "light"}
              type={selectedEnvFile === file.name ? "primary" : "tertiary"}
              onClick={() => onEnvFileSelect(file.name)}
            >
              {file.name}
            </Button>
          ))}
        </ButtonGroup>
        <Button type="tertiary" onClick={handleViewCurrentEnvFile}>
          查看当前环境变量文件
        </Button>
      </div>

      {/* 预览弹窗 */}
      <Modal
        visible={previewOpen}
        title={previewTitle || "环境变量预览"}
        onCancel={() => setPreviewOpen(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(previewContent || "");
                  Toast.success("已复制到剪贴板");
                } catch {
                  Toast.warning("复制失败，请手动选择文本复制");
                }
              }}
            >
              复制内容
            </Button>
            <Button
              theme="solid"
              type="primary"
              onClick={() => setPreviewOpen(false)}
            >
              关闭
            </Button>
          </div>
        }
        width={860}
      >
        <Spin spinning={isLoading} tip="正在读取文件...">
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "SFMono-Regular,Consolas,Menlo,monospace",
              fontSize: 13,
              lineHeight: 1.6,
              background: "var(--semi-color-fill-0)",
              border: "1px solid var(--semi-color-border)",
              borderRadius: 6,
              padding: 16,
              maxHeight: "60vh",
              overflow: "auto",
            }}
          >
            <CodeHighlight
              code={previewContent || "（文件为空）"}
              language="env"
            />
          </pre>
        </Spin>
      </Modal>
    </>
  );
};
