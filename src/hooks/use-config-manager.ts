import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EnvGroup, CategoryTemplate, Project, EnvFile } from "../types";
import Toast from "../lib/toast";

// 常量定义
const DEFAULT_CATEGORY = "未分类";
const ERROR_MESSAGES = {
  ENV_FILE_NOT_FOUND: "环境文件不存在",
  PROJECT_NOT_FOUND: "项目不存在",
  TARGET_ENV_FILE_NOT_FOUND: "未找到目标环境文件",
  SAVE_FAILED: "保存失败",
  DELETE_FAILED: "删除失败",
  SELECT_GROUPS_FIRST: "请选择要合并的配置组",
  PROJECT_OR_ENV_NOT_SELECTED: "请先选择项目和环境文件",
  SELECT_PROJECT_AND_ENV_FIRST: "请先选择项目和环境文件",
  CONFIG_GROUP_NOT_FOUND: "未找到指定的配置组",
  CATEGORY_TEMPLATE_NOT_FOUND: "未找到指定的分类模板",
  TEMPLATE_VALIDATION_FAILED: "请填写分类名称并添加至少一个变量Key",
} as const;

// 工具函数：验证项目和环境文件
const validateProjectAndEnvFile = (
  currentProject: Project | undefined,
  selectedEnvFile: string | undefined,
  projects: Project[]
) => {
  if (!currentProject || selectedEnvFile === undefined) {
    return { isValid: false, project: null, envFile: null };
  }

  const project = projects.find((p) => p.id === currentProject.id);
  if (!project) {
    return { isValid: false, project: null, envFile: null };
  }

  const envFile = project.env_files.find((f) => f.name === selectedEnvFile);
  if (!envFile) {
    return { isValid: false, project, envFile: null };
  }

  return { isValid: true, project, envFile };
};

// 工具函数：更新项目修改时间并保存
const updateProjectAndSave = (
  projects: Project[],
  projectId: string,
  saveProjectsToLocal: (projects: Project[]) => void
) => {
  const updatedProjects = [...projects];
  const project = updatedProjects.find((p) => p.id === projectId);
  if (project) {
    project.last_modified = new Date().toISOString();
    saveProjectsToLocal(updatedProjects);
  }
  return updatedProjects;
};

export const useConfigManager = (
  currentProject: Project | undefined,
  currentEnvFile: EnvFile | undefined,
  selectedEnvFile: string | undefined,
  saveProjectsToLocal: (projects: Project[]) => void,
  projects: Project[]
) => {
  // 配置组相关状态
  const [selectedGroupsByCategory, setSelectedGroupsByCategory] = useState<
    Map<string, string>
  >(new Map());
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EnvGroup | null>(null);
  const [isNewGroup, setIsNewGroup] = useState(false);

  // 分类模板相关状态
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<CategoryTemplate | null>(null);
  const [isNewTemplate, setIsNewTemplate] = useState(false);

  // 切换环境文件时清除选择
  useEffect(() => {
    setSelectedGroupsByCategory(new Map());
  }, [selectedEnvFile]);

  // 切换项目或当前环境文件实例变化时清除选择（增强鲁棒性）
  useEffect(() => {
    setSelectedGroupsByCategory(new Map());
  }, [currentProject?.id, currentEnvFile?.name]);

  // 获取当前选中的所有配置组ID列表
  const getSelectedGroupIds = (): string[] => {
    return Array.from(selectedGroupsByCategory.values());
  };

  // 检查配置组是否被选中
  const isGroupSelected = (groupId: string): boolean => {
    return getSelectedGroupIds().includes(groupId);
  };

  // 处理配置组选择
  const handleGroupSelect = useCallback(
    (groupId: string, selected: boolean) => {
      if (!currentEnvFile) return;

      const group = currentEnvFile.groups.find((g) => g.id === groupId);
      if (!group) return;

      const category = group.category || DEFAULT_CATEGORY;

      setSelectedGroupsByCategory((prev) => {
        const newMap = new Map(prev);
        if (selected) {
          newMap.set(category, groupId);
        } else {
          newMap.delete(category);
        }
        return newMap;
      });
    },
    [currentEnvFile]
  );

  // 打开配置组编辑弹窗
  const openGroupDialog = (group?: EnvGroup) => {
    if (group) {
      setEditingGroup(group);
      setIsNewGroup(false);
    } else {
      setEditingGroup({
        id: Date.now().toString(),
        name: "",
        description: "",
        variables: [],
      });
      setIsNewGroup(true);
    }
    setIsGroupDialogOpen(true);
  };

  // 关闭配置组编辑弹窗
  const closeGroupDialog = () => {
    setIsGroupDialogOpen(false);
    setEditingGroup(null);
    setIsNewGroup(false);
  };

  // 保存配置组
  const saveGroup = useCallback(
    (data: EnvGroup) => {
      if (!editingGroup) return;

      const { isValid, project, envFile } = validateProjectAndEnvFile(
        currentProject,
        selectedEnvFile,
        projects
      );

      if (!isValid || !project || !envFile) {
        Toast.error(ERROR_MESSAGES.ENV_FILE_NOT_FOUND);
        return;
      }

      try {
        if (!data.id || isNewGroup) {
          envFile.groups.push({
            ...data,
            id: new Date().getTime().toString(),
          });
        } else {
          const groupIndex = envFile.groups.findIndex((g) => g.id === data.id);
          if (groupIndex !== -1) {
            envFile.groups[groupIndex] = data;
          }
        }
        if (!currentProject) {
          Toast.error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
          return;
        }
        updateProjectAndSave(projects, currentProject.id, saveProjectsToLocal);
        closeGroupDialog();
        Toast.success(isNewGroup ? "配置组添加成功" : "配置组更新成功");
      } catch (error) {
        console.error("保存配置组失败:", error);
        Toast.error(ERROR_MESSAGES.SAVE_FAILED);
      }
    },
    [
      editingGroup,
      currentProject,
      selectedEnvFile,
      projects,
      isNewGroup,
      saveProjectsToLocal,
    ]
  );

  // 删除配置组
  const deleteGroup = useCallback(
    (groupId: string) => {
      const { isValid, project, envFile } = validateProjectAndEnvFile(
        currentProject,
        selectedEnvFile,
        projects
      );

      if (!isValid || !project || !envFile) {
        Toast.error(ERROR_MESSAGES.ENV_FILE_NOT_FOUND);
        return;
      }

      try {
        if (!currentProject) {
          Toast.error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
          return;
        }
        envFile.groups = envFile.groups.filter((g) => g.id !== groupId);
        updateProjectAndSave(projects, currentProject.id, saveProjectsToLocal);
        Toast.success("配置组已删除");
      } catch (error) {
        console.error("删除配置组失败:", error);
        Toast.error(ERROR_MESSAGES.SAVE_FAILED);
      }
    },
    [currentProject, selectedEnvFile, projects, saveProjectsToLocal]
  );

  // 分类模板管理
  const openCategoryDialog = (template?: CategoryTemplate | any) => {
    // 类型守卫：判断是否为合法的 CategoryTemplate
    const isValidTemplate =
      template &&
      typeof template === "object" &&
      typeof template.id === "string" &&
      typeof template.name === "string" &&
      Array.isArray(template.keys);

    if (isValidTemplate) {
      setEditingTemplate(template as CategoryTemplate);
      setIsNewTemplate(false);
    } else {
      // 创建新的模板，避免事件对象导致误判
      setEditingTemplate({
        id: Date.now().toString(),
        name: "",
        description: "",
        keys: [],
      });
      setIsNewTemplate(true);
    }
    setIsCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
    setEditingTemplate(null);
    setIsNewTemplate(false);
  };

  const saveCategoryTemplate = useCallback(
    (data: CategoryTemplate) => {
      // 验证模板数据完整性
      if (!data || !data.name.trim() || data.keys.length === 0) {
        Toast.warning(ERROR_MESSAGES.TEMPLATE_VALIDATION_FAILED);
        return;
      }

      const { isValid, project, envFile } = validateProjectAndEnvFile(
        currentProject,
        selectedEnvFile,
        projects
      );

      if (!isValid || !project || !envFile) {
        Toast.error(ERROR_MESSAGES.TARGET_ENV_FILE_NOT_FOUND);
        return;
      }

      try {
        // 确保 categoryTemplates 数组存在
        if (!envFile.categoryTemplates) {
          envFile.categoryTemplates = [];
        }

        if (isNewTemplate) {
          envFile.categoryTemplates.push(data);
        } else {
          const templateIndex = envFile.categoryTemplates.findIndex(
            (t) => t.id === data.id
          );
          if (templateIndex !== -1) {
            envFile.categoryTemplates[templateIndex] = data;
          }
        }
        if (!currentProject) {
          Toast.error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
          return;
        }
        updateProjectAndSave(projects, currentProject.id, saveProjectsToLocal);
        closeCategoryDialog();
        Toast.success(isNewTemplate ? "分类模板添加成功" : "分类模板更新成功");
      } catch (error) {
        console.error("保存分类模板失败:", error);
        Toast.error(ERROR_MESSAGES.SAVE_FAILED);
      }
    },
    [
      currentProject,
      selectedEnvFile,
      projects,
      isNewTemplate,
      saveProjectsToLocal,
    ]
  );

  const deleteCategoryTemplate = useCallback(
    (templateId: string) => {
      const { isValid, project, envFile } = validateProjectAndEnvFile(
        currentProject,
        selectedEnvFile,
        projects
      );

      if (!isValid || !project || !envFile) {
        Toast.error(ERROR_MESSAGES.TARGET_ENV_FILE_NOT_FOUND);
        return;
      }

      if (!envFile.categoryTemplates) return;

      try {
        envFile.categoryTemplates = envFile.categoryTemplates.filter(
          (t) => t.id !== templateId
        );
        if (!currentProject) {
          Toast.error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
          return;
        }
        updateProjectAndSave(projects, currentProject.id, saveProjectsToLocal);
        Toast.success("分类模板已删除");
      } catch (error) {
        console.error("删除分类模板失败:", error);
        Toast.error(ERROR_MESSAGES.SAVE_FAILED);
      }
    },
    [currentProject, selectedEnvFile, projects, saveProjectsToLocal]
  );

  // 复制分类模板
  const copyTemplate = (template: CategoryTemplate) => {
    if (!currentProject || selectedEnvFile === undefined) return;

    // 创建复制的模板，生成新的ID和名称
    const copiedTemplate: CategoryTemplate = {
      name: `${template.name} - 副本`,
      keys: [...template.keys], // 深拷贝keys数组
      description: template.description,
    };
    setIsNewTemplate(true);

    setEditingTemplate(copiedTemplate);
    setIsCategoryDialogOpen(true);
  };

  // 获取分类模板列表
  const getCategoryTemplates = (): CategoryTemplate[] => {
    if (!currentEnvFile) return [];
    return currentEnvFile.categoryTemplates || [];
  };

  // 按分类组织配置组
  const getGroupsByCategory = useCallback((groups: EnvGroup[]) => {
    const categorizedGroups = new Map<string, EnvGroup[]>();
    groups.filter(Boolean).forEach((group) => {
      const category = group?.category || DEFAULT_CATEGORY;
      if (!categorizedGroups.has(category)) {
        categorizedGroups.set(category, []);
      }
      categorizedGroups.get(category)!.push(group);
    });
    return categorizedGroups;
  }, []);

  // 工具函数：更新现有环境变量的值并处理分类注释替换
  const updateExistingVariables = useCallback(
    (lines: string[], selectedGroups: EnvGroup[]): string[] => {
      const result: string[] = [];
      const processedCategories = new Set<string>();
      let i = 0;

      // 构建变量更新映射
      const variablesToUpdate = new Map<string, string>();
      selectedGroups.forEach((group) => {
        group.variables.forEach((variable) => {
          if (variable.key && variable.value !== undefined) {
            variablesToUpdate.set(variable.key.trim(), variable.value);
          }
        });
      });

      while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // 检查是否是分类注释
        if (trimmedLine.startsWith("#")) {
          const commentText = trimmedLine.substring(1).trim();

          // 查找匹配的分类组
          const matchingGroup = selectedGroups.find(
            (group) => group.category && commentText.includes(group.category)
          );

          if (
            matchingGroup &&
            !processedCategories.has(matchingGroup.category!)
          ) {
            processedCategories.add(matchingGroup.category!);

            // 添加分类注释
            result.push(`# ${matchingGroup.category}: ${matchingGroup.name}`);

            // 添加该分类下的所有变量
            const categoryGroups = selectedGroups.filter(
              (g) => g.category === matchingGroup.category
            );
            categoryGroups.forEach((group) => {
              group.variables.forEach((variable) => {
                if (variable.key && variable.value !== undefined) {
                  result.push(`${variable.key.trim()}=${variable.value}`);
                }
              });
            });

            // 跳过原有的相关内容直到下一个注释或文件结束
            i++;
            while (
              i < lines.length &&
              !lines[i].trim().startsWith("#") &&
              lines[i].trim() !== ""
            ) {
              i++;
            }
            continue;
          }
        }

        // 处理普通变量行
        if (
          trimmedLine &&
          !trimmedLine.startsWith("#") &&
          trimmedLine.includes("=")
        ) {
          const [key] = trimmedLine.split("=");
          const cleanKey = (key || "").trim();
          if (cleanKey && variablesToUpdate.has(cleanKey)) {
            result.push(`${cleanKey}=${variablesToUpdate.get(cleanKey)}`);
          } else {
            result.push(line);
          }
        } else {
          result.push(line);
        }

        i++;
      }

      // 添加未处理的分类
      selectedGroups.forEach((group) => {
        if (group.category && !processedCategories.has(group.category)) {
          result.push("");
          result.push(`# ${group.category}`);
          group.variables.forEach((variable) => {
            if (variable.key && variable.value !== undefined) {
              result.push(`${variable.key.trim()}=${variable.value}`);
            }
          });
        }
      });

      return result;
    },
    []
  );

  // 清除选择
  const clearSelection = () => {
    setSelectedGroupsByCategory(new Map());
  };

  // 保存合并后的环境变量文件
  const saveMergedEnvFile = useCallback(async () => {
    const selectedGroupIds = getSelectedGroupIds();
    if (selectedGroupIds.length === 0) {
      Toast.warning(ERROR_MESSAGES.SELECT_GROUPS_FIRST);
      return;
    }

    const { isValid, project, envFile } = validateProjectAndEnvFile(
      currentProject,
      selectedEnvFile,
      projects
    );

    if (!isValid || !project || !envFile) {
      Toast.error(ERROR_MESSAGES.TARGET_ENV_FILE_NOT_FOUND);
      return;
    }

    try {
      if (!currentProject) {
        Toast.error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
        return;
      }
      // 每次保存前，先从磁盘读取最新内容，避免使用初始加载时的缓存内容
      const scannedEnvFiles = await invoke<EnvFile[]>("scan_env_files", {
        projectPath: currentProject.path,
      });
      const latestEnv =
        scannedEnvFiles.find((f) => f.path === envFile.path) ||
        scannedEnvFiles.find((f) => f.name === envFile.name);

      const currentContent = latestEnv?.content || "";
      const currentLines = currentContent.split("\n");

      // 1) 获取选中的配置组
      const selectedGroups = envFile.groups.filter(
        (group) => group?.id && selectedGroupIds.includes(group.id)
      );

      // 2) 更新现有变量的值并处理分类注释替换
      const updatedLines = updateExistingVariables(
        currentLines,
        selectedGroups
      );

      // 3) 合并内容
      const updatedContent = updatedLines.join("\n").trimEnd() + "\n";

      // 7) 保存文件
      await invoke("save_env_file", {
        filePath: envFile.path,
        content: updatedContent,
      });

      // 8) 更新项目信息
      updateProjectAndSave(projects, currentProject.id, saveProjectsToLocal);
      Toast.success("配置已保存！");
    } catch (error) {
      console.error("保存配置失败:", error);
      Toast.error(`${ERROR_MESSAGES.SAVE_FAILED}：${error}`);
    }
  }, [
    getSelectedGroupIds,
    currentProject,
    selectedEnvFile,
    projects,
    updateExistingVariables,
    saveProjectsToLocal,
  ]);

  // 通过组 ID 直接选择配置组（用于托盘菜单）
  const selectGroupById = useCallback(
    (groupId: string) => {
      if (!currentProject || !currentEnvFile) {
        Toast.error(ERROR_MESSAGES.PROJECT_NOT_FOUND);
        return;
      }
      const { isValid, project, envFile } = validateProjectAndEnvFile(
        currentProject,
        selectedEnvFile,
        projects
      );

      if (!isValid || !project || !envFile) {
        Toast.warning(ERROR_MESSAGES.SELECT_PROJECT_AND_ENV_FIRST);
        return false;
      }

      const group = envFile.groups.find((g) => g.id === groupId);
      if (!group) {
        Toast.error(ERROR_MESSAGES.CONFIG_GROUP_NOT_FOUND);
        return false;
      }

      // 清除之前的选择
      clearSelection();
      // 选择该组
      Toast.success(`已选择配置组: ${group.name}`);
      return true;
    },
    [currentProject, currentEnvFile, projects, clearSelection]
  );

  return {
    // 配置组相关
    selectedGroupsByCategory,
    isGroupDialogOpen,
    editingGroup,
    isNewGroup,
    getSelectedGroupIds,
    isGroupSelected,
    handleGroupSelect,
    openGroupDialog,
    closeGroupDialog,
    saveGroup,
    deleteGroup,
    setEditingGroup,

    // 分类模板相关
    isCategoryDialogOpen,
    editingTemplate,
    isNewTemplate,
    openCategoryDialog,
    closeCategoryDialog,
    saveCategoryTemplate,
    deleteCategoryTemplate,
    copyTemplate,
    setEditingTemplate,
    getCategoryTemplates,

    // 其他功能
    getGroupsByCategory,
    clearSelection,
    saveMergedEnvFile,
    selectGroupById,
  };
};
