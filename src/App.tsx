import { useState, useEffect } from "react";
import {
  FluentProvider,
  webLightTheme,
  Button,
  Text,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  FolderOpen20Regular,
  Warning20Regular,
} from "@fluentui/react-icons";
import { listen } from "@tauri-apps/api/event";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { EnvFileTabs } from "./components/EnvFileTabs";
import { ConfigGroupCard } from "./components/ConfigGroupCard";
import { ConfigGroupDialog } from "./components/ConfigGroupDialog";
import { CategoryTemplateDialog } from "./components/CategoryTemplateDialog";
import { CategoryTemplateManager } from "./components/CategoryTemplateManager";
import { useProjectManager } from "./hooks/useProjectManager";
import { useConfigManager } from "./hooks/useConfigManager";
import { MergePreview } from "./components/MergePreview"; // 新增
import { invoke } from "@tauri-apps/api/core";

const useStyles = makeStyles({
  container: {
    height: "calc(100vh - 16px)",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  headerActions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
  mainContent: {
    flex: 1,
    display: "flex",
    margin: "0 auto",
    width: "100%",
    overflow: "hidden",
  },
  workArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  workAreaHeader: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workAreaHeaderLeft: {
    display: "flex",
    flexDirection: "column",
  },
  workAreaHeaderRight: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
  workAreaContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  configManagement: {
    flex: 1,
    padding: tokens.spacingVerticalM,
    overflow: "auto",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    gap: tokens.spacingVerticalL,
  },
  emptyStateIcon: {
    fontSize: "64px",
    color: tokens.colorNeutralForeground3,
  },
  groupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", // 进一步减小最小宽度
    gap: tokens.spacingVerticalXS, // 进一步减小间距
    marginBottom: tokens.spacingVerticalL,
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${tokens.spacingVerticalM} 0`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: tokens.spacingVerticalL,
  },
  // 新增：窗口菜单状态栏样式
  statusBar: {
    padding: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBarLeft: {
    display: "flex",
    alignItems: "center",
  },
  statusBarRight: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
});

function App() {
  const styles = useStyles();
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // 使用自定义hooks
  const projectManager = useProjectManager();
  const configManager = useConfigManager(
    projectManager.currentProject,
    projectManager.currentEnvFile,
    projectManager.selectedEnvFile,
    projectManager.saveProjectsToLocal,
    projectManager.projects
  );

  // 显示通知
  const showNotification = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 按分类组织配置组的渲染函数
  const renderGroupsByCategory = () => {
    if (!projectManager.currentEnvFile) return null;

    const categorizedGroups = configManager.getGroupsByCategory(
      projectManager.currentEnvFile.groups
    );

    return Array.from(categorizedGroups.entries()).map(([category, groups]) => (
      <div key={category} style={{ marginBottom: tokens.spacingVerticalL }}>
        <Text
          size={400}
          weight="semibold"
          style={{
            marginBottom: tokens.spacingVerticalS,
            color: tokens.colorBrandForeground1,
            display: "block",
          }}
        >
          {category}
        </Text>
        <div className={styles.groupGrid}>
          {groups.map((group) => (
            <ConfigGroupCard
              key={group.id}
              group={group}
              selected={configManager.isGroupSelected(group.id)}
              onEdit={configManager.openGroupDialog}
              onDelete={(groupId) =>
                configManager.deleteGroup(groupId, showNotification)
              }
              onSelect={configManager.handleGroupSelect}
            />
          ))}
        </div>
      </div>
    ));
  };

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
  const unlistenTrayApplyConfig = listen("tray-apply-config", (event: any) => {
    const { project_id, env_file_path, group_id } = event.payload;
    handleTrayConfigApplication(project_id, env_file_path, group_id);
  });

  return () => {
    unlistenMenuAddProject.then((fn) => fn());
    unlistenMenuRefreshProject.then((fn) => fn());
    unlistenTrayApplyConfig.then((fn) => fn());
  };
}, []);

// 处理托盘配置应用
const handleTrayConfigApplication = async (projectId: string, envFilePath: string, groupId: string) => {
  try {
    // 切换到指定项目
    const targetProject = projectManager.projects.find(p => p.id === projectId);
    if (!targetProject) {
      showNotification("error", "未找到指定项目");
      return;
    }

    // 切换项目
    projectManager.handleProjectSelect(projectId);
    
    // 切换到指定环境文件
    const envFileIndex = targetProject.env_files.findIndex(f => f.path === envFilePath);
    if (envFileIndex === -1) {
      showNotification("error", "未找到指定环境文件");
      return;
    }

    projectManager.setSelectedEnvFile(envFileIndex.toString());

    // 等待状态更新后应用配置
    setTimeout(() => {
      // 清除当前选择
      configManager.clearSelection();
      
      // 选择指定配置组
      configManager.handleGroupSelect(groupId, true);
      
      // 应用配置
      configManager.saveMergedEnvFile(showNotification);
      
      showNotification("success", `已应用配置：${groupId}`);
    }, 100);

  } catch (error) {
    console.error("应用托盘配置失败:", error);
    showNotification("error", "应用配置失败");
  }
};

// 更新托盘菜单
const updateTrayMenu = async () => {
  try {
    const trayProjects = projectManager.projects.map(project => ({
      id: project.id,
      name: project.name,
      env_files: project.env_files.map(envFile => {
        // 按分类组织配置组
        const categorizedGroups = new Map<string, any[]>();
        envFile.groups.forEach(group => {
          const category = group.category || "未分类";
          if (!categorizedGroups.has(category)) {
            categorizedGroups.set(category, []);
          }
          categorizedGroups.get(category)!.push({
            id: group.id,
            name: group.name,
            project_id: project.id,
            env_file_path: envFile.path,
            category: category
          });
        });

        return {
          name: envFile.name,
          path: envFile.path,
          categories: Array.from(categorizedGroups.entries()).map(([categoryName, groups]) => ({
            name: categoryName,
            groups: groups
          }))
        };
      })
    }));

    await invoke("update_tray_menu", { projects: trayProjects });
  } catch (error) {
    console.error("更新托盘菜单失败:", error);
  }
};

// 在项目或配置组变化时更新托盘菜单
useEffect(() => {
  updateTrayMenu();
}, [projectManager.projects]);

  // 监听菜单事件
  useEffect(() => {
    // 监听添加项目菜单事件
    const unlistenAddProject = listen("menu-add-project", () => {
      projectManager.selectProjectFolder(showNotification);
    });

    // 清理监听器
    return () => {
      unlistenAddProject.then((fn) => fn());
    };
  }, [projectManager.selectedProject]);

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.container}>
        {/* 通知条 */}
        {notification && (
          <MessageBar intent={notification.type}>
            <MessageBarBody>{notification.message}</MessageBarBody>
          </MessageBar>
        )}

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
          />

          {/* 工作区 */}
          {projectManager.currentProject ? (
            <div className={styles.workArea}>
              {/* 工作区头部（仅显示信息，不再包含按钮） */}
              <div className={styles.workAreaHeader}>
                <Text size={500} weight="semibold">
                  {projectManager.currentProject.name}
                </Text>
                <Text
                  size={300}
                  style={{ color: tokens.colorNeutralForeground2 }}
                >
                  {projectManager.currentProject.path}
                </Text>
              </div>

              {/* 工作区内容 */}
              <div className={styles.workAreaContent}>
                {projectManager.currentProject.env_files.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Warning20Regular className={styles.emptyStateIcon} />
                    <div>
                      <Text size={500} weight="semibold">
                        未找到环境文件
                      </Text>
                      <Text
                        size={400}
                        style={{
                          color: tokens.colorNeutralForeground2,
                          marginTop: tokens.spacingVerticalS,
                        }}
                      >
                        该项目中没有发现 .env 文件
                      </Text>
                    </div>
                    <Button
                      appearance="primary"
                      onClick={() =>
                        projectManager.refreshProject(
                          projectManager.currentProject!.id,
                          showNotification
                        )
                      }
                    >
                      重新扫描
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* 环境文件标签页 */}
                    <EnvFileTabs
                      envFiles={projectManager.currentProject.env_files}
                      selectedEnvFile={projectManager.selectedEnvFile}
                      // @ts-ignore
                      onEnvFileSelect={projectManager.setSelectedEnvFile}
                    />

                    {/* 配置管理区域 */}
                    {projectManager.currentEnvFile && (
                      <div className={styles.configManagement}>
                        {/* 分类模板管理 */}
                        <CategoryTemplateManager
                          categoryTemplates={configManager.getCategoryTemplates()}
                          onAddTemplate={() =>
                            configManager.openCategoryDialog()
                          }
                          onEditTemplate={configManager.openCategoryDialog}
                          onDeleteTemplate={(templateId) =>
                            configManager.deleteCategoryTemplate(
                              templateId,
                              showNotification
                            )
                          }
                        />

                        {/* 配置组网格 */}
                        {renderGroupsByCategory()}

                        {/* 操作栏 */}
                        {configManager.getSelectedGroupIds().length > 0 && (
                          <>
                            <div className={styles.actionBar}>
                              <div>
                                <Text size={400} weight="semibold">
                                  已选择{" "}
                                  {configManager.getSelectedGroupIds().length}{" "}
                                  个配置组
                                </Text>
                                <Text
                                  size={300}
                                  style={{
                                    color: tokens.colorNeutralForeground2,
                                    marginLeft: tokens.spacingHorizontalS,
                                  }}
                                >
                                  选择配置组后可以合并保存到环境文件
                                </Text>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: tokens.spacingHorizontalS,
                                }}
                              >
                                <Button
                                  appearance="secondary"
                                  onClick={configManager.clearSelection}
                                >
                                  清除选择
                                </Button>
                                <Button
                                  appearance="primary"
                                  onClick={() =>
                                    configManager.saveMergedEnvFile(
                                      showNotification
                                    )
                                  }
                                >
                                  保存合并配置
                                </Button>
                              </div>
                            </div>

                            {/* 合并预览（独立组件） */}
                            {projectManager.currentEnvFile && (
                              <MergePreview
                                envFile={projectManager.currentEnvFile}
                                selectedGroupIds={configManager.getSelectedGroupIds()}
                              />
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Text size={500} weight="semibold">
                选择一个项目开始管理
              </Text>
              <Text
                size={400}
                style={{ color: tokens.colorNeutralForeground2 }}
              >
                从左侧选择项目或添加新项目
              </Text>
              <Button
                appearance="primary"
                icon={<FolderOpen20Regular />}
                onClick={() =>
                  projectManager.selectProjectFolder(showNotification)
                }
                disabled={projectManager.isLoading}
              >
                {projectManager.isLoading ? "扫描中..." : "添加项目"}
              </Button>
            </div>
          )}
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



