import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Trash2, Settings, List } from "lucide-react";

type SiteHeaderProps = {
  projectName?: string;
  projectPath?: string;
  onProjectDelete?: () => void;
  onModifyProjectPath?: () => void;
  onOpenTemplateManager?: () => void;
};

export function SiteHeader({
  projectName,
  projectPath,
  onProjectDelete,
  onModifyProjectPath,
  onOpenTemplateManager,
}: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="text-base font-medium truncate">
            {projectName || "未选择项目"}
          </h1>
          {projectPath ? (
            <span className="text-xs text-muted-foreground truncate max-w-[40ch]">
              {projectPath}
            </span>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onProjectDelete}
            disabled={!onProjectDelete}
          >
            <Trash2 className="mr-2 size-4" /> 删除项目
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onModifyProjectPath}
            disabled={!onModifyProjectPath}
          >
            <Settings className="mr-2 size-4" /> 修改路径
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenTemplateManager}
            disabled={!onOpenTemplateManager}
          >
            <List className="mr-2 size-4" /> 模板管理
          </Button>
        </div>
      </div>
    </header>
  );
}
