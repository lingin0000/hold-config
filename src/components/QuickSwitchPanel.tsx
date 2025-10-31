import React from "react";
import { Button, Typography, Card, Collapse, Toast } from "@douyinfe/semi-ui";
import { IconFile } from "@douyinfe/semi-icons";
import { useProjectManager } from "../hooks/useProjectManager";
import { useConfigManager } from "../hooks/useConfigManager";

const { Title, Text } = Typography;

// 悬浮窗：快速切换环境
export const QuickSwitchPanel: React.FC = () => {
  // 复用现有 hooks 获取项目/配置上下文
  const projectManager = useProjectManager();
  const configManager = useConfigManager(
    projectManager.currentProject,
    projectManager.currentEnvFile,
    projectManager.selectedEnvFile,
    projectManager.saveProjectsToLocal,
    projectManager.projects
  );

  // 当带有 project_id 查询参数时，自动切换到对应项目
  React.useEffect(() => {
    const pid =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("project_id")
        : null;
    if (pid && projectManager.projects.length > 0) {
      const target = projectManager.projects.find((p) => p.id === pid);
      if (target) {
        projectManager.handleProjectSelect(pid);
      }
    }
    // 仅在项目列表变化时尝试匹配
  }, [projectManager.projects]);

  const onApplyGroup = (groupId: string) => {
    try {
      // 清空选择并选中单个组，然后保存
      configManager.clearSelection();
      configManager.handleGroupSelect(groupId, true);
      configManager.saveMergedEnvFile();
      Toast.success("已应用配置");
    } catch (e) {
      Toast.error("应用失败");
    }
  };

  const current = projectManager.currentProject;

  return (
    <div
      style={{
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: "var(--semi-color-bg-1)",
      }}
    >
      <Title heading={5} style={{ margin: 0 }}>
        快速切换
      </Title>

      {/* 项目列表：当未选择项目时也显示，用于选择目标项目 */}
      <Card headerLine={false} title="选择项目">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {projectManager.projects.length === 0 ? (
            <Text>未检测到项目，请在主窗口添加或提供 default.json</Text>
          ) : (
            projectManager.projects.map((p) => (
              <Button
                key={p.id}
                theme={current?.id === p.id ? "solid" : "light"}
                type={current?.id === p.id ? "primary" : "tertiary"}
                onClick={() => projectManager.handleProjectSelect(p.id)}
              >
                {p.name}
              </Button>
            ))
          )}
        </div>
      </Card>

      {/* 当前项目名称显示（仅在已选择项目时） */}
      {current && (
        <Title heading={6} style={{ margin: 0 }}>
          当前项目：{current.name}
        </Title>
      )}

      {/* 环境文件按钮组（仅在已选择项目时显示） */}
      {current && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {current.env_files.map((f) => (
            <Button
              key={f.path}
              icon={<IconFile />}
              theme={
                projectManager.selectedEnvFile === f.name ? "solid" : "light"
              }
              type={
                projectManager.selectedEnvFile === f.name
                  ? "primary"
                  : "tertiary"
              }
              onClick={() => projectManager.setSelectedEnvFile(f.name)}
            >
              {f.name}
            </Button>
          ))}
        </div>
      )}

      {/* 按分类折叠显示组（仅在已选择项目且选择了环境文件时显示） */}
      {current &&
        current.env_files.map(
          (env) =>
            env.name === projectManager.selectedEnvFile && (
              <Collapse
                key={env.path}
                defaultActiveKey={env.groups.map((g) => g.category || "未分类")}
              >
                {Array.from(
                  configManager.getGroupsByCategory(env.groups).entries()
                ).map(([cat, groups]) => (
                  <Collapse.Panel header={cat} itemKey={cat} key={cat}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {groups.map((g) => (
                        <Card key={g.id} title={g.name}>
                          <Button
                            theme="solid"
                            type="primary"
                            onClick={() => onApplyGroup(g.id!)}
                          >
                            应用该组
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </Collapse.Panel>
                ))}
              </Collapse>
            )
        )}
    </div>
  );
};
