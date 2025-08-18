import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Project, EnvFile, EnvVariable } from '../types';

export const useProjectManager = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [selectedEnvFile, setSelectedEnvFile] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // 从本地存储加载项目
  useEffect(() => {
    loadProjectsFromLocal();
  }, []);

  // 加载本地保存的项目
  const loadProjectsFromLocal = async () => {
    try {
      const savedProjects = localStorage.getItem("env-manager-projects");
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        // 如果有项目，默认选择第一个
        if (parsedProjects.length > 0) {
          setSelectedProject(parsedProjects[0].id);
          if (parsedProjects[0].env_files.length > 0) {
            setSelectedEnvFile("0");
          }
        }
      }
    } catch (error) {
      console.error("加载本地项目失败:", error);
    }
  };

  // 保存项目到本地
  const saveProjectsToLocal = (updatedProjects: Project[]) => {
    try {
      localStorage.setItem(
        "env-manager-projects",
        JSON.stringify(updatedProjects)
      );
      setProjects(updatedProjects);
    } catch (error) {
      console.error("保存项目到本地失败:", error);
    }
  };

  // 解析环境变量内容
  const parseEnvContent = (content: string): EnvVariable[] => {
    return content
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        return {
          key: key?.trim() || "",
          value: valueParts.join("=").trim(),
          options: [],
        };
      })
      .filter((variable) => variable.key);
  };

  // 选择项目文件夹
  const selectProjectFolder = async (showNotification: (type: "success" | "error" | "warning", message: string) => void) => {
    try {
      setIsLoading(true);
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择项目文件夹",
      });

      if (selected) {
        const projectPath = Array.isArray(selected) ? selected[0] : selected;
        const projectName =
          projectPath.split(/[\\\/]/).pop() || "Unknown Project";

        // 检查项目是否已存在
        const existingProject = projects.find((p) => p.path === projectPath);
        if (existingProject) {
          handleProjectSelect(existingProject.id);
          showNotification("warning", "项目已存在");
          return;
        }

        // 扫描环境变量文件
        try {
          const envFiles = await invoke<EnvFile[]>("scan_env_files", {
            projectPath,
          });

          // 创建新项目
          const newProject: Project = {
            id: Date.now().toString(),
            name: projectName,
            path: projectPath,
            env_files: envFiles.map((file) => ({
              ...file,
              groups:
                file.groups && file.groups.length > 0
                  ? file.groups
                  : [
                      {
                        id: "default",
                        name: "默认配置",
                        variables: parseEnvContent(file.content || ""),
                      },
                    ],
              categoryTemplates: file.categoryTemplates || [],
            })),
            created_at: new Date().toISOString(),
            last_modified: new Date().toISOString(),
          };

          const updatedProjects = [...projects, newProject];
          saveProjectsToLocal(updatedProjects);
          handleProjectSelect(newProject.id);
          showNotification("success", "项目添加成功");
        } catch (invokeError) {
          console.error("扫描环境文件失败:", invokeError);
          // 如果后端命令失败，创建一个空项目
          const newProject: Project = {
            id: Date.now().toString(),
            name: projectName,
            path: projectPath,
            env_files: [
              {
                name: ".env",
                path: `${projectPath}/.env`,
                content: "",
                groups: [
                  {
                    id: "default",
                    name: "默认配置",
                    variables: [],
                  },
                ],
                categoryTemplates: [],
              },
            ],
            created_at: new Date().toISOString(),
            last_modified: new Date().toISOString(),
          };
          const updatedProjects = [...projects, newProject];
          saveProjectsToLocal(updatedProjects);
          handleProjectSelect(newProject.id);
          showNotification("success", "项目添加成功（未找到环境文件）");
        }
      }
    } catch (error) {
      console.error("选择项目文件夹失败:", error);
      showNotification("error", "选择项目失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理项目选择
  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (project && project.env_files.length > 0) {
      setSelectedEnvFile("0");
    } else {
      setSelectedEnvFile(undefined);
    }
  };

  // 删除项目
  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter((p) => p.id !== projectId);
    saveProjectsToLocal(updatedProjects);
    
    if (selectedProject === projectId) {
      if (updatedProjects.length > 0) {
        handleProjectSelect(updatedProjects[0].id);
      } else {
        setSelectedProject(undefined);
        setSelectedEnvFile(undefined);
      }
    }
  };

  // 刷新项目
  const refreshProject = async (projectId: string, showNotification: (type: "success" | "error" | "warning", message: string) => void) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    try {
      const envFiles = await invoke<EnvFile[]>("scan_env_files", {
        projectPath: project.path,
      });

      const updatedProjects = projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              env_files: envFiles.map((file) => ({
                ...file,
                groups:
                  file.groups && file.groups.length > 0
                    ? file.groups
                    : [
                        {
                          id: "default",
                          name: "默认配置",
                          variables: parseEnvContent(file.content || ""),
                        },
                      ],
                categoryTemplates: file.categoryTemplates || [],
              })),
              last_modified: new Date().toISOString(),
            }
          : p
      );

      saveProjectsToLocal(updatedProjects);
      showNotification("success", "项目刷新成功");
    } catch (error) {
      console.error("刷新项目失败:", error);
      showNotification("error", "刷新项目失败");
    }
  };

  // 获取当前项目和环境文件
  const currentProject = projects.find((p) => p.id === selectedProject);
  const currentEnvFile = currentProject?.env_files[parseInt(selectedEnvFile?.toString() || "0")];

  return {
    projects,
    selectedProject,
    selectedEnvFile,
    currentProject,
    currentEnvFile,
    isLoading,
    setSelectedEnvFile,
    selectProjectFolder,
    handleProjectSelect,
    deleteProject,
    refreshProject,
    saveProjectsToLocal,
  };
};

