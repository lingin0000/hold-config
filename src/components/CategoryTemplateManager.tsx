import { CategoryTemplate } from "../types";
import {
  Button,
  Typography,
  Card,
  Collapse,
  Empty,
  Popconfirm,
} from "@douyinfe/semi-ui";
import { IconDelete, IconEdit, IconPlus, IconCopy } from "@douyinfe/semi-icons";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";

const { Text } = Typography;

interface CategoryTemplateManagerProps {
  categoryTemplates: CategoryTemplate[];
  onAddTemplate: () => void;
  onEditTemplate: (template: CategoryTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onCopyTemplate: (template: CategoryTemplate) => void; // 新增复制功能
}

export const CategoryTemplateManager = ({
  categoryTemplates,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCopyTemplate,
}: CategoryTemplateManagerProps) => {
  return (
    <Collapse collapsible defaultOpenItems={"templates-section"}>
      <Collapse.Panel
        itemKey="templates-section"
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              gap: 50,
            }}
          >
            <Text>分类模板管理</Text>
            <Button
              icon={<IconPlus />}
              onClick={(e) => {
                e.stopPropagation();
                onAddTemplate();
              }}
            >
              新增模板
            </Button>
          </div>
        }
      >
        {categoryTemplates.length === 0 ? (
          <Empty
            image={
              <IllustrationNoContent style={{ width: 150, height: 150 }} />
            }
            darkModeImage={
              <IllustrationNoContentDark style={{ width: 150, height: 150 }} />
            }
            title="暂无分类模板"
            description="开始创建你的第一个分类模板吧！"
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "4px",
              marginTop: "4px",
            }}
          >
            {categoryTemplates.map((template) => (
              <Card
                key={template.id}
                headerExtraContent={
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    <Button
                      icon={<IconEdit />}
                      size="small"
                      title="编辑分类模板"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTemplate(template);
                      }}
                    />
                    <Button
                      icon={<IconCopy />}
                      size="small"
                      title="复制分类模板"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyTemplate(template);
                      }}
                    />
                    <Popconfirm
                      title="确定是否要保存此修改？"
                      content="此修改将不可逆"
                      onConfirm={() => {
                        if (template.id) onDeleteTemplate(template.id);
                      }}
                    >
                      <Button
                        icon={<IconDelete />}
                        size="small"
                        title="删除分类模板"
                      />
                    </Popconfirm>
                  </div>
                }
                title={
                  <>
                    {template.name} ({template.keys.length}个变量)
                  </>
                }
              >
                <div
                  style={{
                    height: "150px",
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {template.keys.map((key) => (
                    <Text key={key} code>
                      {key}
                    </Text>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Collapse.Panel>
    </Collapse>
  );
};
