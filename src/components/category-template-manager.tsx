import { CategoryTemplate } from "../types";
import { Button } from "./ui/button";
import { Card, CardTitle, CardContent } from "./ui/card";
import { Empty } from "./ui/empty";
import {
  Plus,
  Copy,
  Trash2,
  Pen,
} from "lucide-react";
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

interface CategoryTemplateManagerProps {
  categoryTemplates: CategoryTemplate[];
  onAddTemplate: () => void;
  onEditTemplate: (template: CategoryTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onCopyTemplate: (template: CategoryTemplate) => void; // 新增复制功能
}

export const CategoryTemplateManager = ({
  categoryTemplates,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCopyTemplate,
}: CategoryTemplateManagerProps) => {
  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onAddTemplate();
        }}
      >
        <Plus className="mr-2 size-4" /> 新增模板
      </Button>
      {categoryTemplates.length === 0 ? (
        <Empty title="暂无分类模板" description="开始创建你的第一个分类模板吧！" />
      ) : (
        <div className="mt-1.5 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-1.5">
          {categoryTemplates.map((template) => (
            <Card key={template.id} className="relative">
              <div className="flex items-center justify-between px-4">
                <CardTitle className="flex-1 text-sm leading-tight">
                  {template.name} ({template.keys.length}个变量)
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="hover:bg-muted/60"
                    title="编辑分类模板"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTemplate(template);
                    }}
                  >
                    <Pen />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="hover:bg-muted/60"
                    title="复制分类模板"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyTemplate(template);
                    }}
                  >
                    <Copy />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon-sm" variant="ghost" className="hover:bg-muted/60" title="删除分类模板">
                        <Trash2 />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确定删除该分类模板？</AlertDialogTitle>
                        <AlertDialogDescription>
                          删除后不可恢复。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            if (template.id) onDeleteTemplate(template.id);
                          }}
                        >
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardContent className="px-4">
                <div className="max-h-[120px] overflow-auto">
                  <div className="flex flex-col gap-1.5">
                    {template.keys.map((key) => (
                      <code key={key} className="rounded bg-muted px-1.5 py-0.5 text-[11px] leading-tight font-mono">
                        {key}
                      </code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ >
  );
};
