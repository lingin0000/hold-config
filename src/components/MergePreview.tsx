import React from "react";
import { Typography, Table, Tag } from "@douyinfe/semi-ui";
import { EnvFile } from "../types";

export interface MergePreviewProps {
  envFile: EnvFile;
  selectedGroupIds: string[];
}

const { Text } = Typography;

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
    <div
      style={{
        padding: 12,
        marginBottom: 24,
      }}
    >
      {previewData.length === 0 ? (
        <Text>没有可预览的内容</Text>
      ) : (
        <div>
          <Table
            columns={[
              {
                title: "状态",
                dataIndex: "status",
                width: 80,
              },
              {
                title: "环境变量",
                dataIndex: "key",
              },
              {
                title: "值",
                dataIndex: "value",
              },
              {
                title: "源配置组",
                dataIndex: "group",
              },
              {
                title: "分类",
                dataIndex: "category",
                render: (category) => (
                  <Tag shape="circle" color="green">
                    {category}
                  </Tag>
                ),
              },
            ]}
            dataSource={previewData}
          />
        </div>
      )}
    </div>
  );
};
