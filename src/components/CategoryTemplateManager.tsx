import {
  Button,
  Text,
  Card,
  Badge,
  makeStyles,
  tokens,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from "@fluentui/react-components";
import {
  Add20Regular,
  Edit20Regular,
  Delete20Regular,
} from "@fluentui/react-icons";
import { CategoryTemplate } from "../types";

const useStyles = makeStyles({
  templateManager: {
    marginBottom: tokens.spacingVerticalL,
  },
  // 可选：更紧凑的 Header 包裹样式
  accordionHeader: {
    padding: "0",
  },
  templateGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "4px",
    marginTop: "4px",
  },
  templateCard: {
    transition: "all 0.2s ease",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: "pointer",
    position: "relative",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground2,
      transform: "none",
      boxShadow: "none",
      "& .template-actions": {
        opacity: 1,
      },
    },
  },
  templateCardHeader: {
    padding: "4px 6px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalXS,
  },
  templateCardContent: {
    padding: "4px 6px",
  },
  templateActions: {
    display: "flex",
    gap: "2px",
    opacity: 0,
    transition: "opacity 0.2s ease",
  },
  keyList: {
    maxHeight: "80px",
    overflow: "auto",
  },
  keyItem: {
    fontSize: "9px",
    color: tokens.colorNeutralForeground3,
    marginBottom: "1px",
    padding: "1px 3px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

interface CategoryTemplateManagerProps {
  categoryTemplates: CategoryTemplate[];
  onAddTemplate: () => void;
  onEditTemplate: (template: CategoryTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
}

export const CategoryTemplateManager = ({
  categoryTemplates,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: CategoryTemplateManagerProps) => {
  const styles = useStyles();

  return (
    <div className={styles.templateManager}>
      <Accordion collapsible defaultOpenItems={""}>
        <AccordionItem value="templates-section">
          <AccordionHeader className={styles.accordionHeader}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: tokens.spacingHorizontalS,
              }}
            >
              <div>
                <Text size={400} weight="semibold">
                  分类模板管理
                </Text>
                <Text
                  size={300}
                  style={{
                    color: tokens.colorNeutralForeground2,
                    marginLeft: tokens.spacingHorizontalS,
                  }}
                >
                  {categoryTemplates.length} 个分类模板
                </Text>
              </div>
              <Button
                appearance="primary"
                icon={<Add20Regular />}
                onClick={(e) => {
                  e.stopPropagation(); // 防止点击按钮时触发折叠/展开
                  onAddTemplate();
                }}
              >
                添加分类模板
              </Button>
            </div>
          </AccordionHeader>

          <AccordionPanel>
            {categoryTemplates.length === 0 ? (
              <Card
                style={{
                  padding: tokens.spacingVerticalL,
                  textAlign: "center",
                }}
              >
                <Text
                  size={300}
                  style={{ color: tokens.colorNeutralForeground3 }}
                >
                  暂无分类模板，请先添加分类模板
                </Text>
              </Card>
            ) : (
              <div className={styles.templateGrid}>
                {categoryTemplates.map((template) => (
                  <Card key={template.id} className={styles.templateCard}>
                    <div className={styles.templateCardHeader}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          size={200}
                          weight="semibold"
                          style={{
                            display: "block",
                            marginBottom: "1px",
                            color: tokens.colorBrandForeground1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {template.name}
                        </Text>
                        {template.description && (
                          <Text
                            size={200}
                            style={{
                              color: tokens.colorNeutralForeground2,
                              display: "block",
                              lineHeight: "1.1",
                            }}
                          >
                            {template.description}
                          </Text>
                        )}
                      </div>

                      <div
                        className={`template-actions ${styles.templateActions}`}
                      >
                        <Button
                          appearance="subtle"
                          icon={<Edit20Regular />}
                          size="small"
                          title="编辑分类模板"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTemplate(template);
                          }}
                        />
                        <Button
                          appearance="subtle"
                          icon={<Delete20Regular />}
                          size="small"
                          title="删除分类模板"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTemplate(template.id);
                          }}
                        />
                      </div>
                    </div>

                    <div className={styles.templateCardContent}>
                      <Badge
                        appearance="outline"
                        style={{ marginBottom: "4px" }}
                      >
                        {template.keys.length} 个变量Key
                      </Badge>
                      <div className={styles.keyList}>
                        {template.keys.slice(0, 2).map((key, index) => (
                          <div key={index} className={styles.keyItem}>
                            {key}
                          </div>
                        ))}
                        {template.keys.length > 2 && (
                          <Text
                            size={200}
                            style={{
                              color: tokens.colorNeutralForeground3,
                              fontStyle: "italic",
                              marginTop: "2px",
                            }}
                          >
                            ...还有 {template.keys.length - 2} 个Key
                          </Text>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
