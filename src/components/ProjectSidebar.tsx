import {
  Text,
  Button,
  makeStyles,
  tokens,
  Divider,
} from "@fluentui/react-components";
import {
  Delete24Regular,
  Add24Regular,
  FolderOpen24Regular,
  DarkTheme24Filled,
  ArrowImport20Regular,
} from "@fluentui/react-icons";
import { Project } from "../types";
import { ThemeToggle } from "./ThemeToggle";

const useStyles = makeStyles({
  sidebar: {
    width: "280px",
    height: "100%",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    flexDirection: "column",
    boxShadow: tokens.shadow4,
  },

  // 侧边栏头部区域
  sidebarHeader: {
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },

  headerTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },

  headerSubtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },

  // 项目列表区域
  projectList: {
    flex: 1,
    overflow: "auto",
    padding: tokens.spacingVerticalS,

    // 自定义滚动条样式
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStroke2,
      borderRadius: "3px",
      "&:hover": {
        backgroundColor: tokens.colorNeutralStroke1,
      },
    },
  },

  // 项目项样式
  projectItem: {
    display: "flex",
    alignItems: "center",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    marginBottom: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    transition: "all 0.15s ease-in-out",
    border: "1px solid transparent",
    position: "relative",

    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      "& .project-actions": {
        opacity: 1,
      },
    },

    '&[data-selected="true"]': {
      backgroundColor: tokens.colorBrandBackground2,
      "&::before": {
        content: '""',
        position: "absolute",
        left: "0",
        top: "0",
        bottom: "0",
        width: "3px",
        backgroundColor: tokens.colorBrandBackground,
        borderRadius: "0 2px 2px 0",
      },
    },
  },

  projectIcon: {
    fontSize: "20px",
    color: tokens.colorBrandForeground1,
    marginRight: tokens.spacingHorizontalS,
  },

  projectContent: {
    flex: 1,
    minWidth: 0,
  },

  projectName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: "1.2",
  },

  projectPath: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: "2px",
  },

  projectActions: {
    display: "flex",
    gap: "2px",
    opacity: 0,
    transition: "opacity 0.15s ease-in-out",
  },

  actionButton: {
    minWidth: "28px",
    height: "28px",
    borderRadius: tokens.borderRadiusSmall,
  },

  // 空状态样式
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    textAlign: "center",
    padding: tokens.spacingHorizontalM,
  },

  emptyIcon: {
    fontSize: "48px",
    color: tokens.colorNeutralForeground4,
    marginBottom: tokens.spacingVerticalM,
  },

  emptyText: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalS,
  },

  emptySubtext: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4,
  },

  // 底部操作区域
  sidebarFooter: {
    padding: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },

  addProjectButton: {
    width: "100%",
    justifyContent: "flex-start",
    fontWeight: tokens.fontWeightMedium,
  },

  footerActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject?: string;
  onProjectSelect: (projectId: string) => void;
  onProjectDelete: (projectId: string) => void;
  onProjectRefresh: (projectId: string) => void;
  onAddProject?: () => void;
  onImportProjectConfig?: () => void;
}

export const ProjectSidebar = ({
  projects,
  selectedProject,
  onProjectSelect,
  onProjectDelete,
  onAddProject,
  onImportProjectConfig,
}: ProjectSidebarProps) => {
  const styles = useStyles();

  return (
    <div className={styles.sidebar}>
      {/* 侧边栏头部 */}
      <div className={styles.sidebarHeader}>
        <Text className={styles.headerTitle}>项目列表</Text>
      </div>

      {/* 项目列表 */}
      <div className={styles.projectList}>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderOpen24Regular className={styles.emptyIcon} />
            <Text className={styles.emptyText}>暂无项目</Text>
            <Text className={styles.emptySubtext}>
              点击下方按钮添加您的第一个项目
            </Text>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={styles.projectItem}
              data-selected={selectedProject === project.id}
              onClick={() => onProjectSelect(project.id)}
            >
              <Text className={styles.projectName}>{project.name}</Text>
              <Button
                appearance="subtle"
                icon={<Delete24Regular />}
                size="small"
                className={styles.actionButton}
                title="移除项目"
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectDelete(project.id);
                }}
              />
            </div>
          ))
        )}
      </div>

      <Divider />

      {/* 底部操作区域 */}
      <div className={styles.sidebarFooter}>
        <Button
          appearance="primary"
          icon={<ArrowImport20Regular />}
          onClick={onImportProjectConfig}
        >
          导入项目
        </Button>
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          onClick={onAddProject}
        >
          添加项目
        </Button>

        <div className={styles.footerActions}>
          <Button
            appearance="subtle"
            icon={<DarkTheme24Filled />}
            size="small"
            title="切换主题"
          />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};
