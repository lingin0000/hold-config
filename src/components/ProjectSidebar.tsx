import { Project } from "../types";

import { Nav, Button } from "@douyinfe/semi-ui";
import { IconPlusCircle, IconImport } from "@douyinfe/semi-icons";
import { IconDarkMode } from "@douyinfe/semi-icons-lab";

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject?: string;
  onProjectSelect: (projectId: string) => void;
  onProjectRefresh: (projectId: string) => void;
  onAddProject?: () => void;
  onImportProjectConfig?: () => void;
}

export const ProjectSidebar = ({
  projects,
  selectedProject,
  onProjectSelect,
  onAddProject,
  onImportProjectConfig,
}: ProjectSidebarProps) => {
  const handleThemeToggle = () => {
    const body = document.body;
    if (body.hasAttribute("theme-mode")) {
      body.removeAttribute("theme-mode");
    } else {
      body.setAttribute("theme-mode", "dark");
    }
  };

  return (
    <Nav
      style={{
        height: "100%",
        width: "100%",
      }}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
            gap: 20,
            width: "100%",
          }}
        >
          <Button
            type="primary"
            icon={<IconImport />}
            onClick={onImportProjectConfig}
            block
          >
            导入项目
          </Button>
          <Button
            type="primary"
            icon={<IconPlusCircle />}
            onClick={onAddProject}
            block
          >
            添加项目
          </Button>
          <Button
            type="tertiary"
            icon={<IconDarkMode />}
            size="small"
            title="切换主题"
            block
            onClick={handleThemeToggle}
          />
        </div>
      }
      items={projects.map((project) => ({
        key: project.id,
        text: project.name,
        itemKey: project.id,
        style: {
          color:
            selectedProject === project.id ? "var(--semi-color-primary)" : "",
          backgroundColor:
            selectedProject === project.id
              ? "var(--semi-color-primary-light-active)"
              : "transparent",
        },
      }))}
      onSelect={(item) => onProjectSelect(item.itemKey as string)}
    />
  );
};
