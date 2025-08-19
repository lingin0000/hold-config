import {
  Card,
  Text,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Edit20Regular, Delete20Regular } from "@fluentui/react-icons";
import { EnvGroup } from "../types";

const useStyles = makeStyles({
  groupCard: {
    transition: "all 0.2s ease",
    minHeight: "80px", // 进一步减小最小高度
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: "pointer",
    position: "relative",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground2,
      boxShadow: tokens.shadow4, // 减小阴影
      "& .group-actions": {
        opacity: 1,
      },
    },
    '&[data-selected="true"]': {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  groupCardHeader: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingVerticalS}`, // 进一步减小间距
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalXS, // 减小间距
  },
  groupCardContent: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingVerticalS}`, // 进一步减小间距
    flex: 1,
  },
  groupActions: {
    display: "flex",
    gap: "2px", // 进一步减小间距
    opacity: 0,
    transition: "opacity 0.2s ease",
    marginLeft: "auto",
  },
  groupCheckbox: {
    flexShrink: 0,
  },
  groupInfo: {
    flex: 1,
    minWidth: 0,
  },
  variableItem: {
    fontSize: "10px", // 进一步减小字体
    color: tokens.colorNeutralForeground3,
    marginBottom: "1px", // 进一步减小间距
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    padding: "1px 3px", // 进一步减小内边距
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: "2px",
  },
});

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
  const styles = useStyles();

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不触发卡片选择
    const target = e.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }
    onSelect(group.id, !selected);
  };

  return (
    <Card
      className={styles.groupCard}
      data-selected={selected}
      onClick={handleCardClick}
    >
      <div className={styles.groupCardHeader}>
        <Text
          size={300}
          weight="semibold"
          style={{
            // 减小字体
            display: "block",
            marginBottom: tokens.spacingVerticalXS,
            color: tokens.colorBrandForeground1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {group.name}
        </Text>

        <div className={styles.groupInfo}>
          {group.description && (
            <Text
              size={200}
              style={{
                color: tokens.colorNeutralForeground2,
                display: "block",
                lineHeight: "1.1", // 进一步减小行高
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {group.description}
            </Text>
          )}
        </div>

        <div className={`group-actions ${styles.groupActions}`}>
          <Button
            appearance="subtle"
            icon={<Edit20Regular />}
            size="small"
            title="编辑配置组"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(group);
            }}
          />
          <Button
            appearance="subtle"
            icon={<Delete20Regular />}
            size="small"
            title="删除配置组"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(group.id);
            }}
          />
        </div>
      </div>

      <div className={styles.groupCardContent}>
        <div style={{ maxHeight: "40px", overflow: "hidden" }}>
          {" "}
          {/* 进一步减小最大高度 */}
          {group.variables.slice(0, 2).map(
            (
              variable,
              index // 只显示2个变量
            ) => (
              <div key={index} className={styles.variableItem}>
                <strong style={{ color: tokens.colorNeutralForeground2 }}>
                  {variable.key}
                </strong>
                : {variable.value}
              </div>
            )
          )}
          {group.variables.length > 2 && (
            <Text
              size={100}
              style={{
                color: tokens.colorNeutralForeground3,
                fontStyle: "italic",
                marginTop: "1px", // 减小间距
              }}
            >
              +{group.variables.length - 2}个
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};
