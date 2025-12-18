import { invoke } from "@tauri-apps/api/core";
import { useProjectManager } from "./use-project-manager";
import { useConfigManager } from "./use-config-manager";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";



export const useApp = ({
  projectManager,
  configManager,
}: {
  projectManager: ReturnType<typeof useProjectManager>;
  configManager: ReturnType<typeof useConfigManager>;
}) => {
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
        toast.error("未找到指定项目");
        return;
      }

      // 切换项目
      projectManager.handleProjectSelect(projectId);

      // 切换到指定环境文件
      const envFileIndex = targetProject.env_files.findIndex(
        (f) => f.path === envFilePath
      );
      if (envFileIndex === -1) {
        toast.error("未找到指定环境文件");
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
        configManager.saveMergedEnvFile();

        toast.success(`已应用配置：${groupId}`);
      }, 100);
    } catch (error) {
      console.error("应用托盘配置失败:", error);
      toast.error("应用配置失败");
    }
  };

  // 导出所有项目配置到一个文件（格式与 default.json 一致：顶层数组）
  const exportAllConfigs = async () => {
    try {

      const payload = projectManager.projects; // 顶层数组
      // 让用户选择保存的文件夹（固定文件名 default.json）
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择保存文件夹",
        defaultPath: "D:\\",
      });
      if (!selected) return;
      const folder = Array.isArray(selected) ? selected[0] : (selected as string);
      const filePath = `${folder}\\default.json`;
      await writeTextFile(filePath, JSON.stringify(payload, null, 2));
      toast.success(`配置导出成功: ${filePath}`);

    } catch (error) {
      console.error("导出配置失败:", error);
      toast.error("导出配置失败");
    }
  };

  // 导入所有项目配置（从单文件，兼容 default.json 顶层数组）
  const importAllConfigs = async () => {
    try {
      const result = await open({
        type: "openFile",
        title: "导入配置文件",
        defaultPath: "D:\\temp",
        filters: [
          { name: "JSON 文件", extensions: ["json"] },
        ],
      });

      if (result) {
        const fileContent = await readTextFile(result as string);
        const imported = JSON.parse(fileContent);

        let importedProjects: any[] | undefined = undefined;
        if (Array.isArray(imported)) {
          // 顶层数组（default.json 示例格式）
          importedProjects = imported;
        } else if (Array.isArray(imported.projects)) {
          // 兼容之前的 { projects: [] } 包装格式
          importedProjects = imported.projects;
        } else if (imported.project) {
          // 兼容旧的单项目格式
          importedProjects = [imported.project];
        }

        if (!importedProjects) {
          toast.error("文件格式不正确，无法解析项目列表");
          return;
        }

        // 保留原始 ID；若缺失则生成新的 ID
        const normalized = importedProjects.map((p) => ({
          ...p,
          id: p.id ?? (Date.now() + Math.random()).toString(),
        }));

        // 去重：按 path 跳过重复项目
        const existingPaths = new Set(projectManager.projects.map((p) => p.path));
        const deduped = normalized.filter((p) => !existingPaths.has(p.path));
        const skipped = normalized.length - deduped.length;

        // 追加合并到现有配置（不删除原有配置）
        const merged = [...projectManager.projects, ...deduped];
        projectManager.saveProjectsToLocal(merged);
        toast.success("配置导入成功（已追加到现有配置）");
        if (skipped > 0) {
          toast.info(`已跳过重复项目 ${skipped} 个（按 path 去重）`);
        }
      }
    } catch (error) {
      console.error("导入配置失败:", error);
      toast.error("导入配置失败");
    }
  };

  // 新增：修改项目路径功能
  const modifyProjectPath = async () => {
    if (!projectManager.currentProject) {
      toast.error("请先选择一个项目");
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
              env_files:
                projectManager.currentProject?.env_files.map((envFile) => ({
                  ...envFile,
                  path: (selected as string) + "/" + envFile.name,
                })) || [],
            };
          }
          return project;
        });

        projectManager.saveProjectsToLocal(updatedProjects);

        toast.success("项目路径修改成功");
      }
    } catch (error) {
      console.error("修改项目路径失败:", error);
      toast.error("修改项目路径失败");
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
    exportAllConfigs,
    importAllConfigs,
    modifyProjectPath,
  };
};
