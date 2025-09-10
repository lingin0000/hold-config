import React from "react";
import { EnvFileTabs } from "./EnvFileTabs";
import { CategoryTemplateManager } from "./CategoryTemplateManager";
import { ConfigGroupCard } from "./ConfigGroupCard";
import { MergePreview } from "./MergePreview";
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from "@douyinfe/semi-illustrations";
import { Typography, Button, Empty, Tag } from "@douyinfe/semi-ui";
import {
  IconFolder,
  IconDelete,
  IconExport,
  IconPlus,
} from "@douyinfe/semi-icons";
import type { Project, EnvFile, CategoryTemplate } from "../types";
import { IconConfig, IconToast } from "@douyinfe/semi-icons-lab";

const { Text, Title } = Typography;

// 工作区组件属性接口
interface WorkAreaProps {
  currentProject?: Project;
  selectedEnvFile?: string;
  currentEnvFile?: EnvFile;
  isLoading: boolean;
  // 项目管理相关函数
  onSelectProjectFolder: () => void;
  onRefreshProject: (projectId: string) => void;
  onSetSelectedEnvFile: (envFileIndex: string) => void;
  // 配置管理相关函数
  getCategoryTemplates: () => any[];
  onOpenCategoryDialog: (template?: any) => void;
  onDeleteCategoryTemplate: (templateId: string) => void;
  onCopyTemplate: (template: CategoryTemplate) => void;
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
  onProjectDelete: (id: string) => void;
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
  onCopyTemplate,
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
  onProjectDelete,
}) => {
  // 按分类组织配置组的渲染函数
  const renderGroupsByCategory = () => {
    if (!currentEnvFile) return null;

    const categorizedGroups = getGroupsByCategory(currentEnvFile.groups);

    return Array.from(categorizedGroups.entries()).map(([category, groups]) => (
      <div key={category} style={{ padding: 12 }}>
        {/* 分类标题区域 */}
        <div
          style={{
            color: "#333",
            marginBottom: 12,
            paddingLeft: 12,
          }}
        >
          <Tag shape="circle" color="green">
            {category}
          </Tag>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12,
          }}
        >
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
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <Empty
          image={
            <IllustrationConstruction style={{ width: 150, height: 150 }} />
          }
          darkModeImage={
            <IllustrationConstructionDark style={{ width: 150, height: 150 }} />
          }
          title="暂无项目 "
          description="请先添加一个项目"
        />
        <Button
          type="primary"
          icon={<IconFolder />}
          onClick={onSelectProjectFolder}
          disabled={isLoading}
        >
          {isLoading ? "扫描中..." : "添加项目"}
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* 工作区头部，包含项目信息和操作按钮 */}
      <div
        style={{
          padding: 12,
          borderBottom: `1px solid #ccc`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Title type="primary" heading={3}>
            {currentProject.name}
          </Title>
          <Text>{currentProject.path}</Text>
        </div>

        {/* 操作按钮区域 */}
        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          <Button
            appearance="subtle"
            icon={<IconExport />}
            onClick={onExportProjectConfig}
          >
            导出项目
          </Button>
          <Button
            appearance="subtle"
            icon={<IconDelete />}
            onClick={() => onProjectDelete(currentProject.id)}
          >
            删除项目
          </Button>
          <Button
            appearance="subtle"
            icon={<IconConfig />}
            onClick={onModifyProjectPath}
          >
            修改路径
          </Button>
        </div>
      </div>

      {/* 工作区内容 */}
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        {currentProject.env_files.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconToast />
            <div>
              <Text>未找到环境文件</Text>
              <Text>该项目中没有发现 .env 文件</Text>
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
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* 分类模板管理 */}
                <CategoryTemplateManager
                  categoryTemplates={getCategoryTemplates()}
                  onAddTemplate={onOpenCategoryDialog}
                  onEditTemplate={onOpenCategoryDialog}
                  onDeleteTemplate={onDeleteCategoryTemplate}
                  onCopyTemplate={onCopyTemplate}
                />

                <Button
                  icon={<IconPlus />}
                  appearance="primary"
                  onClick={onOpenGroupDialog}
                  style={{
                    margin: 12,
                  }}
                >
                  添加配置组
                </Button>

                {/* 配置组网格 */}
                {renderGroupsByCategory()}

                {/* 操作栏 */}
                {getSelectedGroupIds().length > 0 && (
                  <>
                    <div
                      style={{
                        margin: 12,
                        padding: 12,
                        borderTop: `1px solid #ccc`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "var(--semi-color-bg-1)",
                      }}
                    >
                      <div>
                        <Text>
                          已选择 {getSelectedGroupIds().length} 个配置组
                        </Text>
                        <Text
                          style={{
                            marginLeft: 12,
                          }}
                        >
                          选择配置组后可以合并保存到环境文件
                        </Text>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
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
