import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EnvGroup, CategoryTemplate, Project, EnvFile } from "../types";
import { Toast } from "@douyinfe/semi-ui";

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

  // 获取当前选中的所有配置组ID列表
  const getSelectedGroupIds = (): string[] => {
    return Array.from(selectedGroupsByCategory.values());
  };

  // 检查配置组是否被选中
  const isGroupSelected = (groupId: string): boolean => {
    return getSelectedGroupIds().includes(groupId);
  };

  // 处理配置组选择
  const handleGroupSelect = (groupId: string, selected: boolean) => {
    if (!currentEnvFile) return;

    const group = currentEnvFile.groups.find((g) => g.id === groupId);
    if (!group) return;

    const category = group.category || "未分类";

    setSelectedGroupsByCategory((prev) => {
      const newMap = new Map(prev);
      if (selected) {
        newMap.set(category, groupId);
      } else {
        newMap.delete(category);
      }
      return newMap;
    });
  };

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
  const saveGroup = (data: EnvGroup) => {
    if (!editingGroup || !currentProject || selectedEnvFile === undefined)
      return;

    const updatedProjects = [...projects];
    const project = updatedProjects.find((p) => p.id === currentProject.id);
    if (!project) return;

    const env_files = project.env_files.find(
      (f) => f.name === currentEnvFile?.name
    );

    if (!env_files) {
      Toast.error("环境文件不存在");
      return;
    }

    if (isNewGroup) {
      env_files.groups.push(data);
    } else {
      const groupIndex = env_files.groups.findIndex((g) => g.id === data.id);
      if (groupIndex !== -1) {
        env_files.groups[groupIndex] = data;
      }
    }

    project.last_modified = new Date().toISOString();
    saveProjectsToLocal(updatedProjects);
    closeGroupDialog();
    Toast.success(isNewGroup ? "配置组添加成功" : "配置组更新成功");
  };

  // 删除配置组
  const deleteGroup = (groupId: string) => {
    if (!currentProject || selectedEnvFile === undefined) return;

    const updatedProjects = [...projects];
    const project = updatedProjects.find((p) => p.id === currentProject.id);
    if (!project) return;

    const env_files = project.env_files.find(
      (f) => f.name === currentEnvFile?.name
    );

    if (!env_files) {
      Toast.error("环境文件不存在");
      return;
    }

    env_files.groups = env_files.groups.filter((g) => g.id !== groupId);
    project.last_modified = new Date().toISOString();
    saveProjectsToLocal(updatedProjects);
    Toast.success("配置组已删除");
  };

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

  const saveCategoryTemplate = (data: CategoryTemplate) => {
    if (!data || !currentProject || selectedEnvFile === undefined) return;
    // 验证模板数据完整性
    if (!data.name.trim() || data.keys.length === 0) {
      Toast.warning("请填写分类名称并添加至少一个变量Key");
      return;
    }

    const updatedProjects = [...projects];
    const project = updatedProjects.find((p) => p.id === currentProject.id);
    if (!project) return;

    const targetEnvFile = project.env_files.find(
      (item) => item.name === selectedEnvFile
    );
    if (!targetEnvFile) {
      Toast.error("未找到目标环境文件");
      return;
    }

    if (!targetEnvFile.categoryTemplates) {
      targetEnvFile.categoryTemplates = [];
    }

    if (isNewTemplate) {
      targetEnvFile.categoryTemplates!.push(data);
    } else {
      const templateIndex = targetEnvFile.categoryTemplates!.findIndex(
        (t) => t.id === data.id
      );
      if (templateIndex !== -1) {
        targetEnvFile.categoryTemplates![templateIndex] = data;
      }
    }

    project.last_modified = new Date().toISOString();
    saveProjectsToLocal(updatedProjects);
    closeCategoryDialog();
    Toast.success(isNewTemplate ? "分类模板添加成功" : "分类模板更新成功");
  };

  const deleteCategoryTemplate = (templateId: string) => {
    if (!currentProject || selectedEnvFile === undefined) return;
    const updatedProjects = [...projects];
    const project = updatedProjects.find((p) => p.id === currentProject.id);
    if (!project) return;

    const targetEnvFile = project.env_files.find(
      (item) => item.name === selectedEnvFile
    );
    if (!targetEnvFile) {
      Toast.error("未找到目标环境文件");
      return;
    }
    if (!targetEnvFile.categoryTemplates) return;

    if (targetEnvFile.categoryTemplates) {
      targetEnvFile.categoryTemplates = targetEnvFile.categoryTemplates.filter(
        (t) => t.id !== templateId
      );
    }
    project.last_modified = new Date().toISOString();
    saveProjectsToLocal(updatedProjects);
    Toast.success("分类模板已删除");
  };

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
  const getGroupsByCategory = (groups: EnvGroup[]) => {
    console.log(groups);
    const categorizedGroups = new Map<string, EnvGroup[]>();
    groups.filter(Boolean).forEach((group) => {
      const category = group?.category || "未分类";
      if (!categorizedGroups.has(category)) {
        categorizedGroups.set(category, []);
      }
      categorizedGroups.get(category)!.push(group);
    });
    return categorizedGroups;
  };

  // 清除选择
  const clearSelection = () => {
    setSelectedGroupsByCategory(new Map());
  };

  // 生成环境变量文件内容
  // const generateEnvContent = (groups: EnvGroup[]): string => {
  //   return groups
  //     .map((group) => {
  //       const groupContent = [
  //         `# ${group.name}`,
  //         group.description ? `# ${group.description}` : "",
  //         ...group.variables
  //           .filter((v) => v.key)
  //           .map((variable) => `${variable.key}=${variable.value}`),
  //         "",
  //       ].filter((line) => line !== undefined && line !== "");
  //       return groupContent.join("\n");
  //     })
  //     .join("\n");
  // };

  // 保存合并后的环境变量文件
  const saveMergedEnvFile = async () => {
    const selectedGroupIds = getSelectedGroupIds();
    if (
      !currentProject ||
      selectedEnvFile === undefined ||
      selectedGroupIds.length === 0
    )
      return;

    try {
      const fileIndex = parseInt(selectedEnvFile?.toString() || "0");
      const envFile = currentProject.env_files[fileIndex];
      if (!envFile) return;

      // 每次保存前，先从磁盘读取最新内容，避免使用初始加载时的缓存内容
      const scannedEnvFiles = await invoke<EnvFile[]>("scan_env_files", {
        projectPath: currentProject.path,
      });
      const latestEnv =
        scannedEnvFiles.find((f) => f.path === envFile.path) ||
        scannedEnvFiles.find((f) => f.name === envFile.name);

      const currentContent = latestEnv?.content || "";
      const currentLines = currentContent.split("\n");

      // 1) 选中的配置组
      const selectedGroups = envFile.groups.filter(
        (group) => group.id && selectedGroupIds.includes(group.id)
      );

      // 2) 准备更新表：key -> value
      const variablesToUpdate = new Map<string, string>();
      selectedGroups.forEach((group) => {
        group.variables.forEach((variable) => {
          if (variable.key && variable.value !== undefined) {
            variablesToUpdate.set(variable.key.trim(), variable.value);
          }
        });
      });

      // 3) 已存在的 key 集合（来自当前文件）
      const existingKeys = new Set<string>();
      currentLines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [k] = trimmed.split("=");
          const cleanKey = (k || "").trim();
          if (cleanKey) existingKeys.add(cleanKey);
        }
      });

      // 4) 替换现有 key 的值
      const updatedLines = currentLines.map((line) => {
        const trimmedLine = line.trim();
        if (
          trimmedLine &&
          !trimmedLine.startsWith("#") &&
          trimmedLine.includes("=")
        ) {
          const [key] = trimmedLine.split("=");
          const cleanKey = (key || "").trim();
          if (cleanKey && variablesToUpdate.has(cleanKey)) {
            return `${cleanKey}=${variablesToUpdate.get(cleanKey)}`;
          }
        }
        return line;
      });

      // 5) 追加文件中不存在的 key（按配置组分段）
      const appendSections: string[] = [];
      selectedGroups.forEach((group) => {
        const missingVars = group.variables.filter(
          (v) => v.key && !existingKeys.has(v.key.trim())
        );
        if (missingVars.length > 0) {
          appendSections.push("");
          appendSections.push(`# ${group.name}`);
          if (group.description) appendSections.push(`# ${group.description}`);
          missingVars.forEach((v) => {
            appendSections.push(`${v.key!.trim()}=${v.value ?? ""}`);
            if (v.key) existingKeys.add(v.key.trim());
          });
        }
      });

      const updatedContent =
        (
          updatedLines.join("\n") +
          (appendSections.length ? "\n" + appendSections.join("\n") : "")
        ).trimEnd() + "\n";

      await invoke("save_env_file", {
        filePath: envFile.path,
        content: updatedContent,
      });

      // 同步本地项目信息（更新时间）
      const updatedProjects = [...projects];
      const projectToUpdate = updatedProjects.find(
        (p) => p.id === currentProject.id
      );
      if (projectToUpdate) {
        projectToUpdate.last_modified = new Date().toISOString();
        saveProjectsToLocal(updatedProjects);
      }

      clearSelection();
      Toast.success("配置已保存！");
    } catch (error) {
      console.error("保存配置失败:", error);
      Toast.error("保存失败：" + error);
    }
  };

  // 通过组 ID 直接选择配置组（用于托盘菜单）
  const selectGroupById = (groupId: string) => {
    if (!currentEnvFile) return false;

    const group = currentEnvFile.groups.find((g) => g.id === groupId);
    if (!group) return false;

    const category = group.category || "未分类";
    setSelectedGroupsByCategory(new Map([[category, groupId]]));
    return true;
  };

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
