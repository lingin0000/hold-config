import { useEffect } from "react";
import { FluentProvider, Toaster } from "@fluentui/react-components";
import { listen } from "@tauri-apps/api/event";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ConfigGroupDialog } from "./components/ConfigGroupDialog";
import { CategoryTemplateDialog } from "./components/CategoryTemplateDialog";
import { useProjectManager } from "./hooks/useProjectManager";
import { useConfigManager } from "./hooks/useConfigManager";
import { WorkArea } from "./components/WorkArea";
import { useAppStyle } from "./hooks/useAppStyle";
import { useApp } from "./hooks/useApp";
import { useTheme } from "./contexts/ThemeContext";

function App() {
  const styles = useAppStyle();
  const { currentTheme } = useTheme();

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
    <FluentProvider
      theme={currentTheme}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <Toaster />
      <div className={styles.container}>
        {/* 主内容区 */}
        <div className={styles.mainContent}>
          {/* 项目侧边栏 */}
          <ProjectSidebar
            projects={projectManager.projects}
            selectedProject={projectManager.selectedProject}
            onProjectSelect={projectManager.handleProjectSelect}
            onProjectDelete={projectManager.deleteProject}
            onProjectRefresh={(projectId) =>
              projectManager.refreshProject(projectId, showNotification)
            }
            onAddProject={() =>
              projectManager.selectProjectFolder(showNotification)
            }
            onImportProjectConfig={importProjectConfig}
          />

          {/* 工作区 */}
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
            onOpenCategoryDialog={() => configManager.openCategoryDialog()}
            onDeleteCategoryTemplate={(templateId) =>
              configManager.deleteCategoryTemplate(templateId, showNotification)
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
          />
        </div>

        {/* 配置组编辑对话框 */}
        <ConfigGroupDialog
          isOpen={configManager.isGroupDialogOpen}
          isNewGroup={configManager.isNewGroup}
          editingGroup={configManager.editingGroup}
          categoryTemplates={configManager.getCategoryTemplates()}
          onClose={configManager.closeGroupDialog}
          onSave={() => configManager.saveGroup(showNotification)}
          onGroupChange={configManager.setEditingGroup}
        />

        {/* 分类模板编辑对话框 */}
        <CategoryTemplateDialog
          isOpen={configManager.isCategoryDialogOpen}
          isNewTemplate={configManager.isNewTemplate}
          editingTemplate={configManager.editingTemplate}
          onClose={configManager.closeCategoryDialog}
          onSave={() => configManager.saveCategoryTemplate(showNotification)}
          onTemplateChange={configManager.setEditingTemplate}
          onAddKey={configManager.addKeyToTemplate}
          onUpdateKey={configManager.updateTemplateKey}
          onDeleteKey={configManager.deleteTemplateKey}
        />
      </div>
    </FluentProvider>
  );
}

export default App;
