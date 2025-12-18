import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Project, EnvFile, EnvVariable } from "../types";
import { toast } from "sonner"; // 引入 toast 替换 Toast
import { readTextFile } from "@tauri-apps/plugin-fs"; // 读取默认配置文件用

export const useProjectManager = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [selectedEnvFile, setSelectedEnvFile] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // 从本地存储加载项目
  useEffect(() => {
    loadProjectsFromLocal();
  }, []);

  // 加载本地保存的项目（新增：无缓存时加载默认配置 default.json）
  const loadProjectsFromLocal = async () => {
    try {
      // 1) 优先读取本地缓存，避免不必要的 IO
      const savedProjects = localStorage.getItem("env-manager-projects");
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        // 默认选择第一个项目与其第一个环境文件
        if (parsedProjects.length > 0) {
          setSelectedProject(parsedProjects[0].id);
          if (parsedProjects[0].env_files.length > 0) {
            setSelectedEnvFile(parsedProjects[0].env_files[0].name);
          }
        }
        return; // 提前返回，避免继续加载默认配置
      }

      // 2) 本地无缓存时，尝试加载默认配置：default.json
      let defaultProjects: Project[] | null = null;

      // 2.1) 浏览器/Vite 预览模式：尝试通过 HTTP 读取 /default.json
      try {
        const res = await fetch("/default.json", { cache: "no-store" });
        if (res.ok) {
          defaultProjects = await res.json();
        }
      } catch (_) {
        // 忽略网络错误，转入下一种读取方式
      }

      // 2.2) Tauri 桌面模式：通过文件系统读取
      if (!defaultProjects) {
        try {
          const canUseTauri = !!(import.meta as any).env?.TAURI_PLATFORM || !!(window as any)?.__TAURI__;
          if (canUseTauri) {
            let jsonText = "";
            try {
              // 优先读取应用根目录的 default.json（打包时放置在可读位置）
              jsonText = await readTextFile("default.json");
            } catch (_) {
              // 开发模式兼容：使用绝对路径读取当前工作区的 default.json
              jsonText = await readTextFile(
                "d\\:\\test-workspace\\hold-config\\default.json"
              );
            }
            defaultProjects = JSON.parse(jsonText);
          }
        } catch (_) {
          // 忽略读取错误
        }
      }

      // 3) 若成功读取到默认配置，写入本地并初始化选择状态
      if (
        defaultProjects &&
        Array.isArray(defaultProjects) &&
        defaultProjects.length > 0
      ) {
        localStorage.setItem(
          "env-manager-projects",
          JSON.stringify(defaultProjects)
        );
        setProjects(defaultProjects);
        setSelectedProject(defaultProjects[0].id);
        if (defaultProjects[0].env_files.length > 0) {
          setSelectedEnvFile(defaultProjects[0].env_files[0].name);
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
  const selectProjectFolder = async () => {
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
          toast.warning("项目已存在");
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
          toast.success("项目添加成功");
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
          toast.success("项目添加成功（未找到环境文件）");
        }
      }
    } catch (error) {
      console.error("选择项目文件夹失败:", error);
      toast.error("选择项目失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理项目选择
  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (project && project.env_files.length > 0) {
      setSelectedEnvFile(project.env_files[0].name);
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
  const refreshProject = async (projectId: string) => {
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
      toast.success("项目刷新成功");
    } catch (error) {
      console.error("刷新项目失败:", error);
      toast.error("刷新项目失败");
    }
  };

  // 获取当前项目和环境文件
  const currentProject = projects.find((p) => p.id === selectedProject);
  const currentEnvFile = currentProject?.env_files.find(
    (f) => f.name === selectedEnvFile
  );

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

