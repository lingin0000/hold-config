import * as React from "react";
import { Inbox } from "lucide-react";

export function Empty({ title = "暂无数据", description = "请添加内容后查看", icon }: { title?: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="mb-2 text-muted-foreground">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

export default Empty;