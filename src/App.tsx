import { useEffect } from "react";
import { Toaster } from "./components/ui/sonner"
import { listen } from "@tauri-apps/api/event";
import { ProjectSidebar } from "./components/project-sidebar";
import { ConfigGroupDialog } from "./components/config-group-dialog";
import { CategoryTemplateDialog } from "./components/category-template-dialog";
import { useProjectManager } from "./hooks/use-project-manager";
import { useConfigManager } from "./hooks/use-config-manager";
import { WorkArea } from "./components/work-area";
// 移除快速切换面板

import { useApp } from "./hooks/use-app";
import { CategoryTemplate } from "./types";

function App() {
  // 使用自定义hooks
  const projectManager = useProjectManager();
  const configManager = useConfigManager(
    projectManager.currentProject,
    projectManager.currentEnvFile,
    projectManager.selectedEnvFile,
    projectManager.saveProjectsToLocal,
    projectManager.projects
  );

  // 已移除悬浮窗快速切换逻辑
  const {
    updateTrayMenu,
    handleTrayConfigApplication,
    exportAllConfigs,
    importAllConfigs,
    modifyProjectPath,
  } = useApp({
    projectManager,
    configManager,
  });

  useEffect(() => {
    const unlistenMenuAddProject = listen("menu-add-project", () => {
      projectManager.selectProjectFolder();
    });

    const unlistenMenuRefreshProject = listen("menu-refresh-project", () => {
      if (projectManager.selectedProject) {
        projectManager.refreshProject(projectManager.selectedProject);
      }
    });

    // 监听托盘配置应用事件
    const unlistenTrayApplyConfig = listen(
      "tray-apply-config",
      (event: any) => {
        const { project_id, env_file_path, group_id } = event.payload;
        handleTrayConfigApplication(project_id, env_file_path, group_id);
      }
    );

    return () => {
      unlistenMenuAddProject.then((fn) => fn());
      unlistenMenuRefreshProject.then((fn) => fn());
      unlistenTrayApplyConfig.then((fn) => fn());
    };
  }, []);

  // 在项目或配置组变化时更新托盘菜单
  useEffect(() => {
    updateTrayMenu();
  }, [projectManager.projects]);

  return (
    <div className="w-full h-full flex">
      <div className="w-1/5 min-w-[220px] border-r bg-background">
        <ProjectSidebar
          projects={projectManager.projects}
          selectedProject={projectManager.selectedProject}
          onProjectSelect={projectManager.handleProjectSelect}
          onProjectRefresh={(projectId) => projectManager.refreshProject(projectId)}
          onAddProject={() => projectManager.selectProjectFolder()}
          onImportAllConfigs={importAllConfigs}
          onExportAllConfigs={exportAllConfigs}
        />
      </div>
      <div className="flex-1">
        <WorkArea
          currentProject={projectManager.currentProject}
          selectedEnvFile={projectManager.selectedEnvFile}
          currentEnvFile={projectManager.currentEnvFile}
          isLoading={projectManager.isLoading}
          onSelectProjectFolder={() => projectManager.selectProjectFolder()}
          onRefreshProject={(projectId) =>
            projectManager.refreshProject(projectId)
          }
          onSetSelectedEnvFile={projectManager.setSelectedEnvFile}
          getCategoryTemplates={configManager.getCategoryTemplates}
          onOpenCategoryDialog={(template) =>
            configManager.openCategoryDialog(template)
          }
          onDeleteCategoryTemplate={(templateId) =>
            configManager.deleteCategoryTemplate(templateId)
          }
          onCopyTemplate={(template) => configManager.copyTemplate(template)}
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
        onSave={(data: CategoryTemplate) =>
          configManager.saveCategoryTemplate(data)
        }
      />
      <Toaster />
    </div>
  );
}

export default App;
