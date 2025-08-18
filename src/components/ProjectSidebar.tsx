import {
  Text,
  Card,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  DeleteDismissFilled,
  Folder20Regular,
  ArrowClockwiseFilled,
} from "@fluentui/react-icons";
import { Project } from "../types";

const useStyles = makeStyles({
  sidebar: {
    width: "320px",
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    // backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  projectList: {
    flex: 1,
    overflow: "auto",
    padding: tokens.spacingVerticalS,
  },
  projectCard: {
    marginBottom: tokens.spacingVerticalS,
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1,
    },
    '&[data-selected="true"]': {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
});

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject?: string;
  onProjectSelect: (projectId: string) => void;
  onProjectDelete: (projectId: string) => void;
  onProjectRefresh: (projectId: string) => void;
}

export const ProjectSidebar = ({
  projects,
  selectedProject,
  onProjectSelect,
  onProjectDelete,
  onProjectRefresh,
}: ProjectSidebarProps) => {
  const styles = useStyles();
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Text size={500} weight="semibold">
          项目列表
        </Text>
        <Text
          size={300}
          style={{ color: tokens.colorNeutralForeground2, marginLeft: 12 }}
        >
          {projects.length} 个项目
        </Text>
      </div>

      <div className={styles.projectList}>
        {projects.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: tokens.spacingVerticalL }}
          >
            <Folder20Regular
              style={{
                fontSize: "32px",
                color: tokens.colorNeutralForeground3,
              }}
            />
            <Text
              size={300}
              style={{
                color: tokens.colorNeutralForeground3,
                display: "block",
                marginTop: tokens.spacingVerticalS,
              }}
            >
              暂无项目
            </Text>
          </div>
        ) : (
          projects.map((project) => (
            <Card
              key={project.id}
              className={styles.projectCard}
              data-selected={selectedProject === project.id}
              onClick={() => onProjectSelect(project.id)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  width: "100%",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    size={400}
                    weight="semibold"
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    📁 {project.name}
                  </Text>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <Button
                    appearance="subtle"
                    icon={<ArrowClockwiseFilled />}
                    size="small"
                    title="刷新项目"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectRefresh(project.id);
                    }}
                  />
                  <Button
                    appearance="subtle"
                    icon={<DeleteDismissFilled />}
                    size="small"
                    title="移除项目"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectDelete(project.id);
                    }}
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
