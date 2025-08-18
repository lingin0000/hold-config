import React from "react";
import {
  makeStyles,
  tokens,
  Text,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
} from "@fluentui/react-components";
import { EnvFile } from "../types";

const useStyles = makeStyles({
  container: {
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tableWrapper: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    overflow: "hidden",
  },
  code: {
    fontFamily: "monospace",
    fontSize: "12px",
  },
});

export interface MergePreviewProps {
  envFile: EnvFile;
  selectedGroupIds: string[];
}

export const MergePreview: React.FC<MergePreviewProps> = ({ envFile, selectedGroupIds }) => {
  const styles = useStyles();

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
    const groups = envFile.groups.filter((g) => selectedGroupIds.includes(g.id));
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
    <div className={styles.container}>
      <Text size={400} weight="semibold" style={{ marginBottom: tokens.spacingVerticalS }}>
        合并预览
      </Text>
      {previewData.length === 0 ? (
        <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
          没有可预览的内容
        </Text>
      ) : (
        <div className={styles.tableWrapper}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>状态</TableHeaderCell>
                <TableHeaderCell>环境变量</TableHeaderCell>
                <TableHeaderCell>值</TableHeaderCell>
                <TableHeaderCell>源配置组</TableHeaderCell>
                <TableHeaderCell>分类</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, idx) => (
                <TableRow key={`${row.key}-${idx}`}>
                  <TableCell>
                    <Badge appearance="tint" color={row.status === "覆盖" ? "brand" : "important"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Text weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
                      {row.key}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text className={styles.code}>{row.value}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                      {row.group}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Badge size="small" color="brand">
                      {row.category}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};