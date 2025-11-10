import { EnvGroup } from "../types";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Title, Text } from "./ui/typography";
import { ChevronDown, ChevronUp, Pen, Copy, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";

interface ConfigGroupCardProps {
  group: EnvGroup;
  selected: boolean;
  onEdit: (group: EnvGroup) => void;
  onDelete: (groupId: string) => void;
  onSelect: (groupId: string, selected: boolean) => void;
}

export const ConfigGroupCard = ({
  group,
  selected,
  onEdit,
  onDelete,
  onSelect,
}: ConfigGroupCardProps) => {
  // 变量预览展开/收起状态
  const [isVariablesExpanded, setIsVariablesExpanded] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不触发卡片选择
    const target = e.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }
    if (group.id) {
      onSelect(group.id, !selected);
    }
  };

  const cardClass =
    "group cursor-pointer rounded-xl border bg-background/60 transition-colors py-2" +
    (selected
      ? "border-primary/60 shadow-sm ring-1 ring-primary/20"
      : "border-border hover:border-primary/40 hover:shadow-sm");

  return (
    <Card className={cardClass}>
      <CardContent className="px-4 py-2" onClick={handleCardClick}>
        {/* 头部 */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Title level={5} className="m-0 truncate font-semibold">
              {group.name}
            </Title>
          </div>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon-sm"
              variant="ghost"
              title="编辑配置组"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(group);
              }}
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              title="复制配置组"
              onClick={(e) => {
                e.stopPropagation();
                onEdit({ ...group, id: undefined });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon-sm" variant="ghost" title="删除配置组">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除配置组？</AlertDialogTitle>
                  <AlertDialogDescription>
                    删除后不可恢复。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (group.id) onDelete(group.id);
                    }}
                  >
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* 描述 */}
        {group.description && (
          <Text className="mb-2 line-clamp-2 text-sm text-muted-foreground">
            {group.description}
          </Text>
        )}

        {/* 变量预览 */}
        <div className="mt-1">
          <div className="flex items-center justify-between">
            <Text className="text-xs text-muted-foreground">变量预览</Text>
            <Button
              size="icon-sm"
              variant="ghost"
              title={isVariablesExpanded ? "收起" : "展开"}
              onClick={(e) => {
                e.stopPropagation();
                setIsVariablesExpanded((v) => !v);
              }}
            >
              {isVariablesExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isVariablesExpanded ? (
            <div className="mt-2 space-y-1 rounded-lg bg-muted/40 p-2">
              {(group.variables || []).map((v, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-mono text-muted-foreground">{v.key}</span>
                  <span className="font-mono">{v.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {(group.variables || []).slice(0, 4).map((v, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-muted-foreground">{v.key}</span>
                  <span className="font-mono truncate">{v.value}</span>
                </div>
              ))}
              {(group.variables || []).length > 4 && (
                <Text className="col-span-full text-right text-xs text-muted-foreground">
                  +{(group.variables || []).length - 4} 更多
                </Text>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
