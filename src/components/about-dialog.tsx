import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getVersion } from "@tauri-apps/api/app";
import { useState, useEffect } from "react";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const [version, setVersion] = useState("Unknown");

  useEffect(() => {
    if (open) {
      getVersion().then(setVersion).catch(() => setVersion("Unknown"));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>关于 环境变量管理工具</DialogTitle>
          <DialogDescription>
            高效管理多个项目的环境变量配置
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">当前版本</span>
            <span className="text-sm text-muted-foreground">v{version}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>© 2025 Hold Config. All rights reserved.</p>
            <p className="mt-1">Powered by Tauri v2 & React</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
