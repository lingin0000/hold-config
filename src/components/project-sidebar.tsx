import { Project } from "../types";

import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Import, Upload, FolderUp, Settings } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { useTheme } from "../hooks/use-theme";

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject?: string;
  onProjectSelect: (projectId: string) => void;
  onProjectRefresh: (projectId: string) => void;
  onAddProject?: () => void;
  onImportAllConfigs?: () => void;
  onExportAllConfigs?: () => void;
}

export const ProjectSidebar = ({
  projects,
  selectedProject,
  onProjectSelect,
  onAddProject,
  onImportAllConfigs,
  onExportAllConfigs,
}: ProjectSidebarProps) => {
  const { mode, setMode } = useTheme();

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-2 grid gap-2">
        <Button variant="secondary" className="w-full justify-start" onClick={onImportAllConfigs}>
          <Import className="mr-2 size-4" /> 导入配置
        </Button>
        <Button variant="secondary" className="w-full justify-start" onClick={onExportAllConfigs}>
          <Upload className="mr-2 size-4" /> 导出配置
        </Button>

        <div className="grid gap-1">
          <div className="text-xs text-muted-foreground">主题模式</div>
          <Select value={mode} onValueChange={(val) => setMode(val as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择主题模式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">跟随系统</SelectItem>
              <SelectItem value="light">亮色</SelectItem>
              <SelectItem value="dark">暗色</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-auto">
        <div className="p-1">
          {projects.length === 0 ? (
            <div className="text-sm text-muted-foreground p-2">暂无项目</div>
          ) : (
            projects.map((project) => {
              const active = selectedProject === project.id;
              return (
                <Button
                  key={project.id}
                  variant={active ? "secondary" : "ghost"}
                  className={`w-full justify-start ${active ? "" : "hover:bg-muted"}`}
                  onClick={() => onProjectSelect(project.id)}
                >
                  {project.name}
                </Button>
              );
            })
          )}
        </div>
      </div>
      <Separator />
      <div className="p-2">
        <Button onClick={onAddProject}>
          <FolderUp className="size-4" />
        </Button>
      </div>
      <div className="p-2">
        <Button onClick={onAddProject}>
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  );
};
