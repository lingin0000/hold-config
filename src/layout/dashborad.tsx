import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

import { WorkArea } from '@/components/work-area'
import { ConfigGroupDialog } from '@/components/config-group-dialog'
import { CategoryTemplateDialog } from '@/components/category-template-dialog'
import { CategoryTemplateManager } from '@/components/category-template-manager'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
// 移除快速切换面板相关引用
// import { QuickSwitchPanel } from '@/components/quick-switch-panel'
import { ConfigJsonEditorDialog } from '@/components/config-json-editor'
import { GlobalJsonEditorDialog } from '@/components/global-json-editor'
import { useProjectManager } from '@/hooks/use-project-manager'
import { useConfigManager } from '@/hooks/use-config-manager'
import { useApp } from '@/hooks/use-app'

import type { CategoryTemplate } from '@/types'



export default function Page() {
  const projectManager = useProjectManager()
  const configManager = useConfigManager(
    projectManager.currentProject,
    projectManager.currentEnvFile,
    projectManager.selectedEnvFile,
    projectManager.saveProjectsToLocal,
    projectManager.projects
  )

  const isBrowser = typeof window !== 'undefined'
  const isTauri = isBrowser && '__TAURI__' in window
  // 移除 quick=1 悬浮窗模式
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false)
  // 配置 JSON 编辑器弹窗状态
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false)
  // 全局（所有项目）JSON 编辑器弹窗状态
  const [isGlobalEditorOpen, setIsGlobalEditorOpen] = useState(false)


  // 已移除快速切换环境悬浮窗逻辑

  const {
    updateTrayMenu,
    handleTrayConfigApplication,
    exportAllConfigs,
    importAllConfigs,
    modifyProjectPath,
  } = useApp({ projectManager, configManager })

  useEffect(() => {
    if (!isTauri) return
    const unlistenMenuAddProject = listen('menu-add-project', () => {
      projectManager.selectProjectFolder()
    })

    const unlistenMenuRefreshProject = listen('menu-refresh-project', () => {
      if (projectManager.selectedProject) {
        projectManager.refreshProject(projectManager.selectedProject)
      }
    })

    const unlistenTrayApplyConfig = listen(
      'tray-apply-config',
      (event: any) => {
        const { project_id, env_file_path, group_id } = event.payload
        handleTrayConfigApplication(project_id, env_file_path, group_id)
      }
    )

    return () => {
      unlistenMenuAddProject.then((fn) => fn())
      unlistenMenuRefreshProject.then((fn) => fn())
      unlistenTrayApplyConfig.then((fn) => fn())
    }
  }, [])

  useEffect(() => {
    if (!isTauri) return
    updateTrayMenu()
  }, [projectManager.projects])

  return (
    <SidebarProvider className="[--sidebar-width:calc(var(--spacing)*72)] [--header-height:calc(var(--spacing)*12)]">
      <AppSidebar
        variant="inset"
        projects={projectManager.projects}
        selectedProjectId={projectManager.selectedProject}
        onSelectProject={(id) => projectManager.handleProjectSelect(id)}
        onImportProject={() => projectManager.selectProjectFolder()}
        onImportAllConfigs={() => importAllConfigs()}
        onExportAllConfigs={() => exportAllConfigs()}
        onOpenGlobalEditor={() => setIsGlobalEditorOpen(true)}
      />
      <SidebarInset>
        <SiteHeader
          projectName={projectManager.currentProject?.name}
          projectPath={projectManager.currentProject?.path}
          onProjectDelete={projectManager.currentProject ? () => projectManager.deleteProject(projectManager.currentProject!.id) : undefined}
          onModifyProjectPath={modifyProjectPath}
          onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-0 md:gap-6">
              <div className="px-4 lg:px-6">
                <WorkArea
                  currentProject={projectManager.currentProject}
                  selectedEnvFile={projectManager.selectedEnvFile}
                  currentEnvFile={projectManager.currentEnvFile}
                  isLoading={projectManager.isLoading}
                  onSelectProjectFolder={() => projectManager.selectProjectFolder()}
                  onRefreshProject={(projectId) => projectManager.refreshProject(projectId)}
                  onSetSelectedEnvFile={projectManager.setSelectedEnvFile}
                  getCategoryTemplates={configManager.getCategoryTemplates}
                  onOpenCategoryDialog={(template) => configManager.openCategoryDialog(template)}
                  onDeleteCategoryTemplate={(templateId) => configManager.deleteCategoryTemplate(templateId)}
                  onCopyTemplate={(template) => configManager.copyTemplate(template as CategoryTemplate)}
                  onOpenGroupDialog={() => configManager.openGroupDialog()}
                  getGroupsByCategory={configManager.getGroupsByCategory}
                  isGroupSelected={configManager.isGroupSelected}
                  handleGroupSelect={configManager.handleGroupSelect}
                  onEditGroup={configManager.openGroupDialog}
                  onDeleteGroup={(groupId) => configManager.deleteGroup(groupId)}
                  getSelectedGroupIds={configManager.getSelectedGroupIds}
                  clearSelection={configManager.clearSelection}
                  saveMergedEnvFile={configManager.saveMergedEnvFile}
                  setEditingGroup={configManager.setEditingGroup}
                  onModifyProjectPath={modifyProjectPath}
                  onProjectDelete={projectManager.deleteProject}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 顶部模板管理抽屉（全局入口）*/}
        <Sheet open={isTemplateManagerOpen} onOpenChange={setIsTemplateManagerOpen}>
          <SheetContent side="right" className="w-[480px] sm:max-w-lg p-0 overflow-y-auto">
            <div className="sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
              <DialogHeader>
                <div className="p-4">
                  <DialogTitle>分类模板管理</DialogTitle>
                  <DialogDescription>在当前项目下管理分类模板</DialogDescription>
                </div>
              </DialogHeader>
            </div>
            <div className="p-4 pt-2">
              <CategoryTemplateManager
                categoryTemplates={configManager.getCategoryTemplates()}
                onAddTemplate={configManager.openCategoryDialog}
                onEditTemplate={configManager.openCategoryDialog}
                onDeleteTemplate={configManager.deleteCategoryTemplate}
                onCopyTemplate={configManager.copyTemplate}
              />
            </div>
          </SheetContent>
        </Sheet>

        <ConfigGroupDialog
          isOpen={configManager.isGroupDialogOpen}
          isNewGroup={configManager.isNewGroup}
          editingGroup={configManager.editingGroup}
          categoryTemplates={configManager.getCategoryTemplates()}
          onClose={configManager.closeGroupDialog}
          onSave={(group) => configManager.saveGroup(group)}
          onGroupChange={configManager.setEditingGroup}
        />

        <CategoryTemplateDialog
          isOpen={configManager.isCategoryDialogOpen}
          isNewTemplate={configManager.isNewTemplate}
          editingTemplate={configManager.editingTemplate}
          onClose={configManager.closeCategoryDialog}
          onSave={(data: CategoryTemplate) => configManager.saveCategoryTemplate(data)}
        />

        <Toaster />
      </SidebarInset>

      {/* 配置 JSON 编辑器对话框 */}
      <ConfigJsonEditorDialog
        open={isJsonEditorOpen}
        onOpenChange={setIsJsonEditorOpen}
        projectPath={projectManager.currentProject?.path}
      />

      {/* 全局项目配置编辑器（Monaco） */}
      <GlobalJsonEditorDialog
        open={isGlobalEditorOpen}
        onOpenChange={setIsGlobalEditorOpen}
        projects={projectManager.projects}
        onSaveProjects={(projects) => {
          // 将编辑后的项目列表保存到本地缓存并刷新 UI
          projectManager.saveProjectsToLocal(projects)
        }}
      />
    </SidebarProvider>
  )
}
