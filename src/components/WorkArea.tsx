import React from "react";
import {
  Button,
  TabValue,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  FolderOpen20Regular,
  Warning20Regular,
  Add20Regular,
  ArrowExport20Regular,
  ArrowImport20Regular,
  FolderArrowUp20Regular,
} from "@fluentui/react-icons";
import { EnvFileTabs } from "./EnvFileTabs";
import { CategoryTemplateManager } from "./CategoryTemplateManager";
import { ConfigGroupCard } from "./ConfigGroupCard";
import { MergePreview } from "./MergePreview";
import type { Project, EnvFile } from "../types";

// 工作区样式定义
const useStyles = makeStyles({
  workArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  workAreaHeader: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workAreaHeaderLeft: {
    display: "flex",
    flexDirection: "column",
  },
  workAreaHeaderRight: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
  workAreaContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  configManagement: {
    flex: 1,
    padding: tokens.spacingVerticalM,
    overflow: "auto",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    gap: tokens.spacingVerticalL,
  },
  emptyStateIcon: {
    fontSize: "64px",
    color: tokens.colorNeutralForeground3,
  },
  groupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalL,
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${tokens.spacingVerticalM} 0`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: tokens.spacingVerticalL,
  },
});

// 工作区组件属性接口
interface WorkAreaProps {
  currentProject?: Project;
  selectedEnvFile?: TabValue;
  currentEnvFile?: EnvFile;
  isLoading: boolean;
  // 项目管理相关函数
  onSelectProjectFolder: () => void;
  onRefreshProject: (projectId: string) => void;
  onSetSelectedEnvFile: (envFileIndex: TabValue) => void;
  // 配置管理相关函数
  getCategoryTemplates: () => any[];
  onOpenCategoryDialog: () => void;
  onDeleteCategoryTemplate: (templateId: string) => void;
  onOpenGroupDialog: () => void;
  getGroupsByCategory: (groups: any[]) => Map<string, any[]>;
  isGroupSelected: (groupId: string) => boolean;
  handleGroupSelect: (groupId: string, selected: boolean) => void;
  onEditGroup: (group: any) => void;
  onDeleteGroup: (groupId: string) => void;
  getSelectedGroupIds: () => string[];
  clearSelection: () => void;
  saveMergedEnvFile: () => void;
  setEditingGroup: (group: any) => void;
  // 项目操作函数
  onExportProjectConfig: () => void;
  onModifyProjectPath: () => void;
}

export const WorkArea: React.FC<WorkAreaProps> = ({
  currentProject,
  selectedEnvFile,
  currentEnvFile,
  isLoading,
  onSelectProjectFolder,
  onRefreshProject,
  onSetSelectedEnvFile,
  getCategoryTemplates,
  onOpenCategoryDialog,
  onDeleteCategoryTemplate,
  onOpenGroupDialog,
  getGroupsByCategory,
  isGroupSelected,
  handleGroupSelect,
  onEditGroup,
  onDeleteGroup,
  getSelectedGroupIds,
  clearSelection,
  saveMergedEnvFile,
  setEditingGroup,
  onExportProjectConfig,
  onModifyProjectPath,
}) => {
  const styles = useStyles();

  // 按分类组织配置组的渲染函数
  const renderGroupsByCategory = () => {
    if (!currentEnvFile) return null;

    const categorizedGroups = getGroupsByCategory(currentEnvFile.groups);

    return Array.from(categorizedGroups.entries()).map(([category, groups]) => (
      <div key={category} style={{ marginBottom: tokens.spacingVerticalL }}>
        {/* 分类标题区域 */}
        <div
          style={{
            color: tokens.colorBrandForeground1,
            marginBottom: tokens.spacingVerticalXS,
          }}
        >
          <Text size={400} weight="semibold">
            {category}
          </Text>
        </div>

        <div className={styles.groupGrid}>
          {groups.map((group) => (
            <ConfigGroupCard
              key={group.id}
              group={group}
              selected={isGroupSelected(group.id)}
              onEdit={onEditGroup}
              onDelete={onDeleteGroup}
              onSelect={handleGroupSelect}
            />
          ))}

          {/* 添加配置组卡片 */}
          <div
            onClick={() => {
              const newGroup = {
                id: Date.now().toString(),
                name: "",
                description: "",
                variables: [],
                category: category === "未分类" ? undefined : category,
              };
              setEditingGroup(newGroup);
              onOpenGroupDialog();
            }}
          ></div>
        </div>
      </div>
    ));
  };

  // 如果没有选择项目，显示空状态
  if (!currentProject) {
    return (
      <div className={styles.emptyState}>
        <Text size={500} weight="semibold">
          选择一个项目开始管理
        </Text>
        <Text size={400} style={{ color: tokens.colorNeutralForeground2 }}>
          从左侧选择项目或添加新项目
        </Text>
        <Button
          appearance="primary"
          icon={<FolderOpen20Regular />}
          onClick={onSelectProjectFolder}
          disabled={isLoading}
        >
          {isLoading ? "扫描中..." : "添加项目"}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.workArea}>
      {/* 工作区头部，包含项目信息和操作按钮 */}
      <div className={styles.workAreaHeader}>
        <div className={styles.workAreaHeaderLeft}>
          <Text size={500} weight="semibold">
            {currentProject.name}
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
            {currentProject.path}
          </Text>
        </div>

        {/* 操作按钮区域 */}
        <div className={styles.workAreaHeaderRight}>
          <Button
            appearance="subtle"
            icon={<ArrowExport20Regular />}
            onClick={onExportProjectConfig}
          >
            导出项目
          </Button>
          <Button
            appearance="subtle"
            icon={<FolderArrowUp20Regular />}
            onClick={onModifyProjectPath}
          >
            修改路径
          </Button>
        </div>
      </div>

      {/* 工作区内容 */}
      <div className={styles.workAreaContent}>
        {currentProject.env_files.length === 0 ? (
          <div className={styles.emptyState}>
            <Warning20Regular className={styles.emptyStateIcon} />
            <div>
              <Text size={500} weight="semibold">
                未找到环境文件
              </Text>
              <Text
                size={400}
                style={{
                  color: tokens.colorNeutralForeground2,
                  marginTop: tokens.spacingVerticalS,
                }}
              >
                该项目中没有发现 .env 文件
              </Text>
            </div>
            <Button
              appearance="primary"
              onClick={() => onRefreshProject(currentProject.id)}
            >
              重新扫描
            </Button>
          </div>
        ) : (
          <>
            {/* 环境文件标签页 */}
            <EnvFileTabs
              envFiles={currentProject.env_files}
              selectedEnvFile={selectedEnvFile}
              onEnvFileSelect={onSetSelectedEnvFile}
            />

            {/* 配置管理区域 */}
            {currentEnvFile && (
              <div className={styles.configManagement}>
                {/* 分类模板管理 */}
                <CategoryTemplateManager
                  categoryTemplates={getCategoryTemplates()}
                  onAddTemplate={onOpenCategoryDialog}
                  onEditTemplate={onOpenCategoryDialog}
                  onDeleteTemplate={onDeleteCategoryTemplate}
                />

                <Button
                  icon={<Add20Regular />}
                  appearance="primary"
                  onClick={onOpenGroupDialog}
                  style={{
                    marginBottom: tokens.spacingVerticalM,
                  }}
                >
                  添加配置组
                </Button>

                {/* 配置组网格 */}
                {renderGroupsByCategory()}

                {/* 操作栏 */}
                {getSelectedGroupIds().length > 0 && (
                  <>
                    <div className={styles.actionBar}>
                      <div>
                        <Text size={400} weight="semibold">
                          已选择 {getSelectedGroupIds().length} 个配置组
                        </Text>
                        <Text
                          size={300}
                          style={{
                            color: tokens.colorNeutralForeground2,
                            marginLeft: tokens.spacingHorizontalS,
                          }}
                        >
                          选择配置组后可以合并保存到环境文件
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: tokens.spacingHorizontalS,
                        }}
                      >
                        <Button appearance="secondary" onClick={clearSelection}>
                          清除选择
                        </Button>
                        <Button
                          appearance="primary"
                          onClick={saveMergedEnvFile}
                        >
                          保存合并配置
                        </Button>
                      </div>
                    </div>

                    {/* 合并预览组件 */}
                    <MergePreview
                      envFile={currentEnvFile}
                      selectedGroupIds={getSelectedGroupIds()}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
