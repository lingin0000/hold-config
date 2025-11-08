import * as React from "react"
import {
  IconFolder,
  IconSettings,
  IconDownload,
  IconUpload,
  IconFolderUp,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useTheme, { type ThemeMode, type ThemePreset } from "@/hooks/use-theme"
import type { Project } from "@/types"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  projects?: Project[]
  selectedProjectId?: string
  onSelectProject?: (id: string) => void
  onImportProject?: () => void
  onImportAllConfigs?: () => void
  onExportAllConfigs?: () => void
}

export function AppSidebar({
  projects = [],
  selectedProjectId,
  onSelectProject,
  onImportProject,
  onImportAllConfigs,
  onExportAllConfigs,
  ...props
}: AppSidebarProps) {
  const { mode, setMode, preset, setPreset } = useTheme()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>项目列表</SidebarGroupLabel>
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
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter className="mt-auto">
        <SidebarMenu>
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
                </SidebarMenu>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>主题模式</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
                  <DropdownMenuRadioItem value="system">跟随系统</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="light">浅色</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">深色</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>主题方案</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={preset} onValueChange={(v) => setPreset(v as ThemePreset)}>
                  <DropdownMenuRadioItem value="default">默认</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="ocean">海洋蓝</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="forest">森林绿</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="violet">紫罗兰</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rose">玫瑰红</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="amber">琥珀黄</DropdownMenuRadioItem>
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
  )
}
