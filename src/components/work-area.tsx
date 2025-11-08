import React from "react";
import { EnvFileTabs } from "./env-file-tabs";
import { ConfigGroupCard } from "./config-group-card";
import { MergePreview } from "./merge-preview";
import { Button } from "./ui/button";
import { Empty } from "./ui/empty";
import { Badge } from "./ui/badge";
import { Text } from "./ui/typography";
import { Folder, AlertCircle } from "lucide-react";
import type { Project, EnvFile, CategoryTemplate } from "../types";
// 移除 Semi 图标实验库，使用 lucide-react 替代

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
}) => {

  // 按分类组织配置组的渲染函数
  const renderGroupsByCategory = () => {
    if (!currentEnvFile) return null;

    const categorizedGroups = getGroupsByCategory(currentEnvFile.groups);

    return Array.from(categorizedGroups.entries()).map(([category, groups]) => (
      <div key={category} className="p-3">
        {/* 分类标题区域 */}
        <div className="text-foreground mb-3 pl-3">
          <Badge className="rounded-full" variant="secondary">{category}</Badge>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
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
            className="flex items-center justify-center rounded-md border border-dashed p-4 text-sm text-muted-foreground cursor-pointer hover:bg-muted/20 transition"
          >
            添加配置组
          </div>
        </div>
      </div>
    ));
  };

  // 如果没有选择项目，显示空状态
  if (!currentProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5">
        <Empty title="暂无项目" description="请先添加一个项目" icon={<Folder className="h-8 w-8" />} />
        <Button onClick={onSelectProjectFolder} disabled={isLoading}>
          <Folder className="mr-2 size-4" /> {isLoading ? "扫描中..." : "添加项目"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* 工作区内容 */}
      <div className="h-full flex flex-col overflow-auto">
        {currentProject.env_files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <AlertCircle className="mb-2 size-8 text-muted-foreground" />
            <div>
              <Text>未找到环境文件</Text>
              <Text>该项目中没有发现 .env 文件</Text>
            </div>
            <Button onClick={() => onRefreshProject(currentProject.id)}>
              重新扫描
            </Button>
          </div>
        ) : (
          <>
            {/* 环境文件标签页 */}
            <EnvFileTabs
              envFiles={currentProject.env_files}
              selectedEnvFile={selectedEnvFile}
              onEnvFileSelect={(value) => {
                // 切换任务（环境文件）时清除已选配置组
                clearSelection();
                onSetSelectedEnvFile(value);
              }}
            />

            {/* 配置管理区域 */}
            {currentEnvFile && (
              <div className="h-full flex flex-col">
                {/* 配置组网格 */}
                {renderGroupsByCategory()}

                {/* 操作栏 */}
                {getSelectedGroupIds().length > 0 && (
                  <>
                    <div className="m-3 p-3 border-t flex justify-between items-center bg-muted/30">
                      <div>
                        <Text>
                          已选择 {getSelectedGroupIds().length} 个配置组
                        </Text>
                        <Text
                        >
                          选择配置组后可以合并保存到环境文件
                        </Text>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="secondary" onClick={clearSelection}>
                          清除选择
                        </Button>
                        <Button onClick={saveMergedEnvFile}>保存合并配置</Button>
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
