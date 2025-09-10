import { EnvGroup } from "../types";
import { Card, Button, Typography, Tag } from "@douyinfe/semi-ui";
import {
  IconCopyAdd,
  IconDelete,
  IconEdit,
  IconChevronDown,
  IconChevronUp,
} from "@douyinfe/semi-icons";
import { useState } from "react";

const { Text, Title } = Typography;

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

  const cardStyle = {
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: selected
      ? "1px solid var(--semi-color-primary)"
      : "1px solid var(--semi-color-border)",
    boxShadow: selected
      ? "0 4px 12px rgba(var(--semi-color-primary-rgb), 0.15)"
      : "0 2px 8px rgba(0, 0, 0, 0.06)",
    transform: selected ? "translateY(-1px)" : "none",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  };

  const titleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  };

  const actionsStyle = {
    display: "flex",
    gap: "4px",
    opacity: 0.7,
    transition: "opacity 0.2s ease",
  };

  const variablesStyle = {
    backgroundColor: "var(--semi-color-fill-0)",
    borderRadius: "6px",
    padding: "8px",
    marginTop: "8px",
  };

  const variableItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "2px 0",
    fontSize: "12px",
  };

  return (
    <Card style={cardStyle} bodyStyle={{ padding: "16px" }}>
      <div
        onClick={handleCardClick}
        onMouseEnter={(e) => {
          const actions = e.currentTarget.querySelector(
            ".card-actions"
          ) as HTMLElement;
          if (actions) actions.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          const actions = e.currentTarget.querySelector(
            ".card-actions"
          ) as HTMLElement;
          if (actions) actions.style.opacity = "0.7";
        }}
      >
        {/* 卡片头部 */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            <Title heading={6} style={{ margin: 0, fontWeight: 600 }}>
              {group.name}
            </Title>
            {group.category && (
              <Tag size="small" color="blue">
                {group.category}
              </Tag>
            )}
          </div>

          <div className="card-actions" style={actionsStyle}>
            <Button
              icon={<IconEdit />}
              size="small"
              theme="borderless"
              title="编辑配置组"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(group);
              }}
            />
            <Button
              icon={<IconCopyAdd />}
              size="small"
              theme="borderless"
              title="复制配置组"
              onClick={(e) => {
                e.stopPropagation();
                onEdit({
                  ...group,
                  id: undefined,
                });
              }}
            />
            <Button
              icon={<IconDelete />}
              size="small"
              theme="borderless"
              type="danger"
              title="删除配置组"
              onClick={(e) => {
                e.stopPropagation();
                if (group.id) {
                  onDelete(group.id);
                }
              }}
            />
          </div>
        </div>

        {/* 描述信息 */}
        {group.description && (
          <Text
            type="secondary"
            size="small"
            style={{
              display: "block",
              marginBottom: "8px",
              lineHeight: "1.4",
            }}
          >
            {group.description}
          </Text>
        )}

        {/* 变量预览 */}
        {group.variables.length > 0 && (
          <div style={variablesStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsVariablesExpanded(!isVariablesExpanded);
              }}
            >
              <Text
                size="small"
                type="secondary"
                style={{
                  fontWeight: 500,
                }}
              >
                变量预览 ({group.variables.length}个)
              </Text>
              <Button
                icon={
                  isVariablesExpanded ? <IconChevronUp /> : <IconChevronDown />
                }
                size="small"
                theme="borderless"
                style={{ padding: "2px" }}
              />
            </div>

            {isVariablesExpanded && (
              <>
                {group.variables.map((variable, index) => (
                  <div key={index} style={variableItemStyle}>
                    <Text
                      code
                      size="small"
                      style={{
                        backgroundColor:
                          "var(--semi-color-primary-light-hover)",
                        padding: "1px 4px",
                        borderRadius: "3px",
                        fontWeight: 500,
                      }}
                    >
                      {variable.key}
                    </Text>
                    <Text size="small" type="secondary">
                      {variable.value || "(空值)"}
                    </Text>
                  </div>
                ))}
              </>
            )}

            {!isVariablesExpanded && group.variables.length > 0 && (
              <Text
                size="small"
                type="tertiary"
                style={{
                  fontStyle: "italic",
                  display: "block",
                }}
              >
                点击展开查看所有变量
              </Text>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
