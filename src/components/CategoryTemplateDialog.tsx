import { CategoryTemplate } from "../types";
import {
  Modal,
  Button,
  Divider,
  Form,
  ArrayField,
  Toast,
} from "@douyinfe/semi-ui";
import { IconMinusCircle, IconPlus } from "@douyinfe/semi-icons";
import { useRef, useEffect } from "react";
import { FormApi } from "@douyinfe/semi-ui/lib/es/form";

interface CategoryTemplateDialogProps {
  isOpen: boolean;
  isNewTemplate: boolean;
  editingTemplate: CategoryTemplate | null;
  onClose: () => void;
  onSave: (data: CategoryTemplate) => void;
}

export const CategoryTemplateDialog = ({
  isOpen,
  isNewTemplate,
  editingTemplate,
  onClose,
  onSave,
}: CategoryTemplateDialogProps) => {
  const form = useRef<FormApi<CategoryTemplate>>(null);

  // 当编辑模板变化时，更新表单数据
  useEffect(() => {
    if (form.current && editingTemplate && isOpen) {
      // 使用setTimeout确保Form完全初始化后再设置值
      setTimeout(() => {
        if (form.current) {
          form.current.setValues(editingTemplate, {
            isOverride: true,
          });
        }
      }, 0);
    }
  }, [editingTemplate, isOpen]);

  // 处理保存逻辑
  const handleSave = () => {
    form.current
      ?.validate()
      .then((values) => {
        // 过滤空的key值
        const filteredKeys = (values.keys || [])
          .map((item: any) => item.trim())
          .filter((key: string) => key);
        const updatedTemplate: CategoryTemplate = {
          ...(editingTemplate || {}),
          name: values.name.trim(),
          description: values.description?.trim() || "",
          keys: filteredKeys,
          id: editingTemplate?.id,
        };

        onSave(updatedTemplate);
      })
      .catch(() => {
        Toast.error("表单验证失败:");
      });
  };

  return (
    <Modal
      visible={isOpen}
      onCancel={() => {
        onClose();
      }}
      title={isNewTemplate ? "添加分类模板" : "编辑分类模板"}
      okButtonProps={{
        onClick: handleSave,
      }}
      centered
      width={900}
    >
      <Form<CategoryTemplate>
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        getFormApi={(api) =>
          ((form.current as FormApi<CategoryTemplate>) = api)
        }
        labelPosition="inset"
        labelWidth={100}
      >
        {/* 表单头部继续使用 safeTemplate 作为回填默认值 */}
        <Form.Input
          field="name"
          label="分类名称"
          placeholder="输入分类名称"
          rules={[{ required: true, message: "请输入分类名称" }]}
        />
        <div hidden>
          {" "}
          <Form.Input field="id" disabled />
        </div>
        <Form.Input
          field="description"
          label="分类描述"
          placeholder="输入分类描述（可选）"
          rules={[{ required: false, message: "请输入分类描述" }]}
        />

        <Divider />
        <ArrayField field="keys">
          {({ add, arrayFields }) => {
            return (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div>变量Key列表</div>
                  <Button
                    size="small"
                    icon={<IconPlus />}
                    onClick={(e) => {
                      e.preventDefault();
                      add(); // 添加空的key对象
                    }}
                  >
                    添加Key
                  </Button>
                </div>
                {arrayFields && arrayFields.length > 0 ? (
                  arrayFields.map(({ field, key, remove }, index) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Form.Input
                        field={`${field}`}
                        label={`Key${index + 1}`}
                        placeholder="变量Key名称"
                        style={{ width: 360 }}
                        rules={[
                          { required: true, message: "请输入变量Key名称" },
                          {
                            validator: (_rule, value) => {
                              if (!value || !value.trim()) {
                                return new Error("Key名称不能为空");
                              }
                              // 检查是否有重复的key
                              const currentValues = form.current?.getValues();
                              if (currentValues?.keys) {
                                const keys = currentValues.keys
                                  .map((item: any, idx: number) => ({
                                    value: item?.name?.trim(),
                                    index: idx,
                                  }))
                                  .filter(
                                    (item: any) =>
                                      item.value && item.index !== index
                                  );
                                const duplicates = keys.filter(
                                  (item: any) => item.value === value.trim()
                                );
                                if (duplicates.length > 0) {
                                  return new Error("Key名称不能重复");
                                }
                              }
                              return true;
                            },
                          },
                        ]}
                      />
                      <Button
                        type="danger"
                        theme="borderless"
                        icon={<IconMinusCircle />}
                        size="small"
                        onClick={() => {
                          remove();
                        }}
                        title="删除此Key"
                      />
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#999",
                      padding: "20px",
                      border: "1px dashed #d9d9d9",
                      borderRadius: "4px",
                    }}
                  >
                    暂无变量Key，点击上方"添加Key"按钮开始添加
                  </div>
                )}
              </>
            );
          }}
        </ArrayField>
      </Form>
    </Modal>
  );
};
