import { useEffect } from "react";

import {
  ConfigProvider,
  ResizeGroup,
  ResizeHandler,
  ResizeItem,
} from "@douyinfe/semi-ui"; // 引入 Semi 的全局配置 Provider，用于主题切换
import { listen } from "@tauri-apps/api/event";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ConfigGroupDialog } from "./components/ConfigGroupDialog";
import { CategoryTemplateDialog } from "./components/CategoryTemplateDialog";
import { useProjectManager } from "./hooks/useProjectManager";
import { useConfigManager } from "./hooks/useConfigManager";
import { WorkArea } from "./components/WorkArea";

import { useApp } from "./hooks/useApp";
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

  const {
    updateTrayMenu,
    handleTrayConfigApplication,
    exportProjectConfig,
    importProjectConfig,
    modifyProjectPath,
    showNotification,
  } = useApp({
    projectManager,
    configManager,
  });

  useEffect(() => {
    const unlistenMenuAddProject = listen("menu-add-project", () => {
      projectManager.selectProjectFolder(showNotification);
    });

    const unlistenMenuRefreshProject = listen("menu-refresh-project", () => {
      if (projectManager.selectedProject) {
        projectManager.refreshProject(
          projectManager.selectedProject,
          showNotification
        );
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
    <ConfigProvider>
      <div style={{ width: "100%", height: "100%" }}>
        <ResizeGroup direction="horizontal">
          <ResizeItem
            style={{
              backgroundColor: "rgba(var(--semi-grey-1), 1)",
              border: "var(--semi-color-border) 1px solid",
            }}
            defaultSize="20%"
            min="10%"
          >
            <ProjectSidebar
              projects={projectManager.projects}
              selectedProject={projectManager.selectedProject}
              onProjectSelect={projectManager.handleProjectSelect}
              onProjectRefresh={(projectId) =>
                projectManager.refreshProject(projectId, showNotification)
              }
              onAddProject={() =>
                projectManager.selectProjectFolder(showNotification)
              }
              onImportProjectConfig={importProjectConfig}
            />
          </ResizeItem>
          <ResizeHandler />
          <ResizeItem
            style={{
              backgroundColor: "rgba(var(--semi-grey-1), 1)",
              border: "var(--semi-color-border) 1px solid",
            }}
            defaultSize="80%"
            min="40%"
          >
            <WorkArea
              currentProject={projectManager.currentProject}
              selectedEnvFile={projectManager.selectedEnvFile}
              currentEnvFile={projectManager.currentEnvFile}
              isLoading={projectManager.isLoading}
              onSelectProjectFolder={() =>
                projectManager.selectProjectFolder(showNotification)
              }
              onRefreshProject={(projectId) =>
                projectManager.refreshProject(projectId, showNotification)
              }
              onSetSelectedEnvFile={projectManager.setSelectedEnvFile}
              getCategoryTemplates={configManager.getCategoryTemplates}
              onOpenCategoryDialog={(template) =>
                configManager.openCategoryDialog(template)
              }
              onDeleteCategoryTemplate={(templateId) =>
                configManager.deleteCategoryTemplate(templateId)
              }
              onCopyTemplate={(template) =>
                configManager.copyTemplate(template)
              }
              onOpenGroupDialog={() => configManager.openGroupDialog()}
              getGroupsByCategory={configManager.getGroupsByCategory}
              isGroupSelected={configManager.isGroupSelected}
              handleGroupSelect={configManager.handleGroupSelect}
              onEditGroup={configManager.openGroupDialog}
              onDeleteGroup={(groupId) =>
                configManager.deleteGroup(groupId, showNotification)
              }
              getSelectedGroupIds={configManager.getSelectedGroupIds}
              clearSelection={configManager.clearSelection}
              saveMergedEnvFile={() =>
                configManager.saveMergedEnvFile(showNotification)
              }
              setEditingGroup={configManager.setEditingGroup}
              onExportProjectConfig={exportProjectConfig}
              onModifyProjectPath={modifyProjectPath}
              onProjectDelete={projectManager.deleteProject}
            />
          </ResizeItem>
        </ResizeGroup>

        <ConfigGroupDialog
          isOpen={configManager.isGroupDialogOpen}
          isNewGroup={configManager.isNewGroup}
          editingGroup={configManager.editingGroup}
          categoryTemplates={configManager.getCategoryTemplates()}
          onClose={configManager.closeGroupDialog}
          onSave={(group) => configManager.saveGroup(group)}
          onGroupChange={configManager.setEditingGroup}
        />

        {/* 分类模板编辑对话框 */}
        <CategoryTemplateDialog
          isOpen={configManager.isCategoryDialogOpen}
          isNewTemplate={configManager.isNewTemplate}
          editingTemplate={configManager.editingTemplate}
          onClose={configManager.closeCategoryDialog}
          onSave={(data: CategoryTemplate) =>
            configManager.saveCategoryTemplate(data)
          }
        />
      </div>
    </ConfigProvider>
  );
}

export default App;
