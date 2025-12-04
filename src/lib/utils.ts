import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { openUrl } from "@tauri-apps/plugin-opener";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 使用系统默认浏览器打开链接（Tauri 环境使用 shell.open，Web 环境回退到 window.open）
export async function openInDefaultBrowser(url: string) {
  // 参数校验：避免空字符串或无效 URL
  if (!url || typeof url !== "string") return;
  // 不指定特定浏览器，使用系统默认
  await openUrl(url);
}
