import * as React from "react"
import { useEffect, useState } from "react";
import {
  IconFolder,
  IconSettings,
  IconDownload,
  IconUpload,
  IconFolderUp,
  IconCode,
  IconInfoCircle,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useTheme, { type ThemeMode, type ThemePreset } from "@/hooks/use-theme";
import type { Project } from "@/types";
import { getVersion } from "@tauri-apps/api/app";
import { toast } from "sonner";
import { openInDefaultBrowser } from "@/lib/utils";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  projects?: Project[];
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  onImportProject?: () => void;
  onImportAllConfigs?: () => void;
  onExportAllConfigs?: () => void;
  onOpenGlobalEditor?: () => void;
};

export function AppSidebar({
  projects = [],
  selectedProjectId,
  onSelectProject,
  onImportProject,
  onImportAllConfigs,
  onExportAllConfigs,
  onOpenGlobalEditor,
  ...props
}: AppSidebarProps) {
  const { mode, setMode, preset, setPreset } = useTheme();
  const [version, setVersion] = useState<string>("");

  // 读取应用版本号并显示在设置菜单中
  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(""));
  }, []);

  // 检查 GitHub Releases 最新版本并提示
  const checkLatestRelease = async () => {
    const toastId = "check-update-" + Math.random().toString(36).slice(2);
    try {
      toast.loading("正在检查最新版本...", { id: toastId });

      let remoteVersion = "";
      let downloadUrl = "";
      let releaseUrl = "";
      let releaseNotes = "";
      let publishedAt = "";

      // 策略1：优先尝试 GitHub Releases API 获取详细信息（含下载链接）
      try {
        const res = await fetch(
          "https://api.github.com/repos/lingin0000/hold-config/releases/latest"
        );
        if (res.ok) {
          const data = await res.json();
          remoteVersion = (data.tag_name || data.name || "").replace(/^v/i, "");
          releaseUrl = data.html_url;
          publishedAt = data.published_at
            ? new Date(data.published_at).toLocaleString()
            : "";
          releaseNotes = data.body
            ? data.body.slice(0, 100) + (data.body.length > 100 ? "..." : "")
            : "";

          // 查找 Windows 安装包 (.exe)
          if (Array.isArray(data.assets)) {
            const exeAsset = data.assets.find((a: any) =>
              /\.exe$/i.test(a.name)
            );
            if (exeAsset && exeAsset.browser_download_url) {
              downloadUrl = exeAsset.browser_download_url;
            }
          }
        }
      } catch (e) {
        console.warn(
          "GitHub API check failed, falling back to raw file check",
          e
        );
      }

      // 策略2：如果 API 失败（可能是限流），回退到 raw 文件检查（无直接下载链接，只能跳网页）
      if (!remoteVersion) {
        const RAW_PKG_URLS = [
          "https://raw.githubusercontent.com/lingin0000/hold-config/main/package.json",
          "https://raw.githubusercontent.com/lingin0000/hold-config/master/package.json",
        ];
        for (const url of RAW_PKG_URLS) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const pkg = await res.json();
              if (pkg.version) {
                remoteVersion = pkg.version;
                releaseUrl = `https://github.com/lingin0000/hold-config/releases/tag/v${remoteVersion}`;
                break;
              }
            }
          } catch {}
        }
      }

      if (!remoteVersion) throw new Error("无法获取远程版本信息");

      // 版本对比
      const normalize = (s: string) => s.replace(/^v/i, "");
      const toNums = (s: string) =>
        normalize(s)
          .split(".")
          .map((n) => parseInt(n || "0", 10));
      const cmp = (a: string, b: string) => {
        const A = toNums(a);
        const B = toNums(b);
        for (let i = 0; i < Math.max(A.length, B.length); i++) {
          const ai = A[i] ?? 0;
          const bi = B[i] ?? 0;
          if (ai > bi) return 1;
          if (ai < bi) return -1;
        }
        return 0;
      };

      const compare = version ? cmp(remoteVersion, version) : 1;

      if (compare > 0) {
        // 发现新版本
        toast.success(`发现新版本：v${remoteVersion}`, {
          id: toastId,
          duration: 10000, // 延长显示时间
          description: (
            <div className="flex flex-col gap-1">
              <span>当前版本：v{version}</span>
              {publishedAt && (
                <span className="text-xs text-muted-foreground">
                  发布于：{publishedAt}
                </span>
              )}
              {downloadUrl ? (
                <span className="text-xs text-green-600 font-medium">
                  已找到 Windows 安装包，可直接下载
                </span>
              ) : (
                <span className="text-xs text-orange-600">
                  未找到安装包，请前往页面下载
                </span>
              )}
            </div>
          ),
          action: {
            label: downloadUrl ? "立即下载" : "前往下载",
            onClick: () => {
              const targetUrl = downloadUrl || releaseUrl;
              if (targetUrl) openInDefaultBrowser(targetUrl);
            },
          },
        });

        // 如果有下载链接，额外提供一个查看详情的选项（可选）
        if (downloadUrl) {
          setTimeout(() => {
            toast.info(`v${remoteVersion} 更新详情`, {
              description: releaseNotes || "点击查看完整更新日志",
              action: {
                label: "查看详情",
                onClick: () => openInDefaultBrowser(releaseUrl),
              },
              duration: 5000,
            });
          }, 500);
        }
      } else {
        // 已是最新
        toast.success(`当前已是最新版本：v${version}`, {
          id: toastId,
          description: `远程版本：v${remoteVersion} (最新)`,
          action: {
            label: "查看",
            onClick: () => {
              if (releaseUrl) openInDefaultBrowser(releaseUrl);
            },
          },
        });
      }
    } catch (e: any) {
      toast.error(`检查失败：${e?.message ?? "网络错误"}`);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarGroupContent>
          <SidebarMenu>
            {projects?.length ? (
              projects.map((p) => (
                <SidebarMenuItem key={p.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectProject?.(p.id)}
                    isActive={selectedProjectId === p.id}
                  >
                    <IconFolder />
                    <span>{p.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <IconFolder />
                  <span>暂无项目</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter className="mt-auto">
        <SidebarMenu>
          {/* 独立的版本按钮：点击检查并提示最新版本 */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={checkLatestRelease}>
              <IconInfoCircle />
              <span>{version ? `版本 v${version}` : "版本检查"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <IconSettings />
                  <span>设置</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-64">
                <DropdownMenuLabel>配置管理</DropdownMenuLabel>
                <SidebarMenu className="px-1 py-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onImportAllConfigs}>
                      <IconUpload />
                      <span>导入配置</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onExportAllConfigs}>
                      <IconDownload />
                      <span>导出配置</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onOpenGlobalEditor}>
                      <IconCode />
                      <span>编辑全局配置(JSON)</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
                {/* 移除：更新下载入口，改由独立“版本”按钮提供 */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>主题模式</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={mode}
                  onValueChange={(v) => setMode(v as ThemeMode)}
                >
                  <DropdownMenuRadioItem value="system">
                    跟随系统
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="light">
                    浅色
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    深色
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>主题方案</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={preset}
                  onValueChange={(v) => setPreset(v as ThemePreset)}
                >
                  <DropdownMenuRadioItem value="default">
                    默认
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="ocean">
                    海洋蓝
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="forest">
                    森林绿
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="violet">
                    紫罗兰
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rose">
                    玫瑰红
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="amber">
                    琥珀黄
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="sky">
                    天空蓝
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="indigo">
                    靛青
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="teal">
                    青蓝
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="lime">
                    青柠绿
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="slate">
                    石板灰
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onImportProject}>
              <IconFolderUp />
              <span>导入项目</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

