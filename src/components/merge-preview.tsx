import React from "react";
import { EnvFile } from "../types";
import { Text } from "./ui/typography";
import { Badge } from "./ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";

export interface MergePreviewProps {
  envFile: EnvFile;
  selectedGroupIds: string[];
}

export const MergePreview: React.FC<MergePreviewProps> = ({
  envFile,
  selectedGroupIds,
}) => {
  // 当前文件已有的 key
  const existingKeys = React.useMemo(() => {
    const set = new Set<string>();
    const lines = (envFile.content || "").split("\n");
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [k] = trimmed.split("=");
        const key = (k || "").trim();
        if (key) set.add(key);
      }
    });
    return set;
  }, [envFile.content]);

  // 预览数据
  const previewData = React.useMemo(() => {
    const groups = envFile.groups
      .filter(Boolean)
      .filter((g) => g.id && selectedGroupIds.includes(g.id));
    const rows: Array<{
      key: string;
      value: string;
      group: string;
      category: string;
      status: "覆盖" | "新增";
    }> = [];

    groups.forEach((group) => {
      group.variables.forEach((v) => {
        if (!v.key) return;
        rows.push({
          key: v.key,
          value: v.value,
          group: group.name,
          category: group.category || "未分类",
          status: existingKeys.has(v.key) ? "覆盖" : "新增",
        });
      });
    });

    // 可按 key 排序，覆盖优先显示
    rows.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "覆盖" ? -1 : 1;
      }
      return a.key.localeCompare(b.key);
    });

    return rows;
  }, [envFile.groups, selectedGroupIds, existingKeys]);

  return (
    <div className="p-3 mb-6">
      {previewData.length === 0 ? (
        <Text>没有可预览的内容</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">状态</TableHead>
              <TableHead>环境变量</TableHead>
              <TableHead>值</TableHead>
              <TableHead>源配置组</TableHead>
              <TableHead>分类</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row) => (
              <TableRow key={`${row.key}-${row.group}`}>
                <TableCell>
                  <Badge variant={row.status === "覆盖" ? "secondary" : "outline"}>{row.status}</Badge>
                </TableCell>
                <TableCell className="font-mono">{row.key}</TableCell>
                <TableCell className="font-mono break-words whitespace-pre-wrap">{row.value}</TableCell>
                <TableCell>{row.group}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.category}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
