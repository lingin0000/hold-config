import React from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "./ui/card";
import { Title, Text } from "./ui/typography";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { File } from "lucide-react";
import { useProjectManager } from "../hooks/use-project-manager";
import { useConfigManager } from "../hooks/use-config-manager";
import Toast from "../lib/toast";

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
    <div className="flex flex-col gap-3 p-3 bg-background">
      <Title level={5} className="m-0">快速切换</Title>

      {/* 项目列表：当未选择项目时也显示，用于选择目标项目 */}
      <Card>
        <CardHeader>
          <CardTitle>选择项目</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
          {projectManager.projects.length === 0 ? (
            <Text>未检测到项目，请在主窗口添加或提供 default.json</Text>
          ) : (
            projectManager.projects.map((p) => (
              <Button
                key={p.id}
                variant={current?.id === p.id ? "default" : "outline"}
                size="sm"
                onClick={() => projectManager.handleProjectSelect(p.id)}
              >
                {p.name}
              </Button>
            ))
          )}
          </div>
        </CardContent>
      </Card>

      {/* 当前项目名称显示（仅在已选择项目时） */}
      {current && (
        <Title className="m-0">当前项目：{current.name}</Title>
      )}

      {/* 环境文件按钮组（仅在已选择项目时显示） */}
      {current && (
        <div className="flex flex-wrap gap-2">
          {current.env_files.map((f) => (
            <Button
              key={f.path}
              variant={projectManager.selectedEnvFile === f.name ? "default" : "outline"}
              size="sm"
              onClick={() => projectManager.setSelectedEnvFile(f.name)}
            >
              <File className="mr-2 size-4" /> {f.name}
            </Button>
          ))}
        </div>
      )}

      {/* 按分类折叠显示组（仅在已选择项目且选择了环境文件时显示） */}
      {current &&
        current.env_files.map(
          (env) =>
            env.name === projectManager.selectedEnvFile && (
              <Accordion
                key={env.path}
                type="multiple"
                defaultValue={Array.from(new Set(env.groups.map((g) => g.category || "未分类")))}
              >
                {Array.from(
                  configManager.getGroupsByCategory(env.groups).entries()
                ).map(([cat, groups]) => (
                  <AccordionItem value={cat} key={cat}>
                    <AccordionTrigger>{cat}</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2">
                        {groups.map((g) => (
                          <Card key={g.id}>
                            <CardHeader>
                              <CardTitle className="text-sm">{g.name}</CardTitle>
                              <CardAction>
                                <Button size="sm" onClick={() => onApplyGroup(g.id!)}>应用该组</Button>
                              </CardAction>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )
        )}
    </div>
  );
};
