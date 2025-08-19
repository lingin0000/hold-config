import { invoke } from "@tauri-apps/api/core";
import { useProjectManager } from "./useProjectManager";
import { useConfigManager } from "./useConfigManager";
import { open } from "@tauri-apps/plugin-dialog";
import { Toast, ToastBody, ToastIntent, ToastTitle, useToastController } from "@fluentui/react-components";

export const useApp = ({
  projectManager,
  configManager,
}: {
  projectManager:  ReturnType<typeof useProjectManager>;
  configManager: ReturnType<typeof useConfigManager>;
}) => {
    const { dispatchToast } = useToastController();
  // 修改通知函数使用 Toast
  const showNotification = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    const intent: ToastIntent =
      type === "error" ? "error" : type === "warning" ? "warning" : "success";

    dispatchToast(
      <Toast>
        <ToastTitle>
          {type === "success" ? "成功" : type === "error" ? "错误" : "警告"}
        </ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent, timeout: 3000 }
    );
  };

  // 处理托盘配置应用
  const handleTrayConfigApplication = async (
    projectId: string,
    envFilePath: string,
    groupId: string
  ) => {
    try {
      // 切换到指定项目
      const targetProject = projectManager.projects.find(
        (p) => p.id === projectId
      );
      if (!targetProject) {
        showNotification("error", "未找到指定项目");
        return;
      }

      // 切换项目
      projectManager.handleProjectSelect(projectId);

      // 切换到指定环境文件
      const envFileIndex = targetProject.env_files.findIndex(
        (f) => f.path === envFilePath
      );
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

  // 新增：导出项目配置功能
  const exportProjectConfig = async () => {
    if (!projectManager.currentProject) {
      showNotification("error", "请先选择一个项目");
      return;
    }

    try {
      const projectData = {
        project: projectManager.currentProject,
        exportTime: new Date().toISOString(),
        version: "1.0.0",
      };

      // 调用 Tauri 命令保存文件
      await invoke("export_project_config", {
        projectData: JSON.stringify(projectData, null, 2),
        projectName: projectManager.currentProject.name,
      });

      showNotification("success", "项目配置导出成功,位置在D:\\temp");
    } catch (error) {
      console.error("导出项目配置失败:", error);
      showNotification("error", "导出项目配置失败");
    }
  };

  // 新增：导入项目配置功能
  const importProjectConfig = async () => {
    try {
      const result = await open({
        type: "openFile",
        title: "导入项目配置",
        defaultPath: "D:\\temp",
        filters: [
          {
            name: "JSON 文件",
            extensions: ["json"],
          },
        ],
      });

      if (result) {
        const importedData = JSON.parse(result as string);
        const importedProject = importedData.project;

        // 生成新的项目ID避免冲突
        importedProject.id = Date.now().toString();
        importedProject.name = `${importedProject.name} (导入)`;

        // 添加到项目列表
        const updatedProjects = [...projectManager.projects, importedProject];
        projectManager.saveProjectsToLocal(updatedProjects);

        showNotification("success", "项目配置导入成功");
      }
    } catch (error) {
      console.error("导入项目配置失败:", error);
      showNotification("error", "导入项目配置失败");
    }
  };

  // 新增：修改项目路径功能
  const modifyProjectPath = async () => {
    if (!projectManager.currentProject) {
      showNotification("error", "请先选择一个项目");
      return;
    }

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择项目文件夹",
      });
      if (selected && selected !== projectManager.currentProject.path) {
        // 更新项目路径
        const updatedProjects = projectManager.projects.map((project) => {
          if (project.id === projectManager.currentProject!.id) {
            return {
              ...project,
              path: selected as string,
              last_modified: new Date().toISOString(),
            };
          }
          return project;
        });

        projectManager.saveProjectsToLocal(updatedProjects);

        // 重新扫描项目
        await projectManager.refreshProject(
          projectManager.currentProject.id,
          showNotification
        );

        showNotification("success", "项目路径修改成功");
      }
    } catch (error) {
      console.error("修改项目路径失败:", error);
      showNotification("error", "修改项目路径失败");
    }
  };

  // 更新托盘菜单
  const updateTrayMenu = async () => {
    try {
      const trayProjects = projectManager.projects.map((project) => ({
        id: project.id,
        name: project.name,
        env_files: project.env_files.map((envFile) => {
          // 按分类组织配置组
          const categorizedGroups = new Map<string, any[]>();
          envFile.groups.forEach((group) => {
            const category = group.category || "未分类";
            if (!categorizedGroups.has(category)) {
              categorizedGroups.set(category, []);
            }
            categorizedGroups.get(category)!.push({
              id: group.id,
              name: group.name,
              project_id: project.id,
              env_file_path: envFile.path,
              category: category,
            });
          });

          return {
            name: envFile.name,
            path: envFile.path,
            categories: Array.from(categorizedGroups.entries()).map(
              ([categoryName, groups]) => ({
                name: categoryName,
                groups: groups,
              })
            ),
          };
        }),
      }));

      await invoke("update_tray_menu", { projects: trayProjects });
    } catch (error) {
      console.error("更新托盘菜单失败:", error);
    }
  };

  return {
    updateTrayMenu,
    handleTrayConfigApplication,
    exportProjectConfig,
    importProjectConfig,
    modifyProjectPath,
    showNotification
  };
};
