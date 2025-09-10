import { useEffect, useRef, useState } from "react";
import { EnvGroup, CategoryTemplate, EnvVariable } from "../types";
import { Modal, Form, Divider, ArrayField } from "@douyinfe/semi-ui";
import { type FormApi } from "@douyinfe/semi-ui/lib/es/form";

interface ConfigGroupDialogProps {
  isOpen: boolean;
  isNewGroup: boolean;
  editingGroup: EnvGroup | null;
  categoryTemplates: CategoryTemplate[];
  onClose: () => void;
  onSave: (group: EnvGroup) => void;
  onGroupChange: (group: EnvGroup) => void;
}

export const ConfigGroupDialog = ({
  isOpen,
  isNewGroup,
  editingGroup,
  categoryTemplates,
  onClose,
  onSave,
}: ConfigGroupDialogProps) => {
  const form = useRef<FormApi<EnvGroup>>(null);
  const [variables, setVariables] = useState<EnvVariable[]>([]);

  const handleCategoryChange = (value: string) => {
    const template = categoryTemplates.find((t) => t.name === value);
    if (template) {
      form.current?.setValue(
        "variables",
        template.keys.map((key) => ({
          key,
          value: "",
          options: [],
        }))
      );
      setVariables(
        template.keys.map((key) => ({
          key,
          value: "",
          options: [],
        }))
      );
    }
  };

  const handleSubmit = () => {
    form.current?.validate().then((values) => {
      onSave(values);
    });
  };

  useEffect(() => {
    if (editingGroup && isOpen) {
      console.log(editingGroup);
      setTimeout(() => {
        form.current?.setValues(editingGroup);
        setVariables(editingGroup.variables);
        console.log(form.current?.getValues());
      }, 0);
    }
  }, [editingGroup, isOpen]);

  return (
    <Modal
      visible={isOpen}
      onCancel={onClose}
      title={
        isNewGroup ? "添加配置" : editingGroup?.id ? `编辑配置` : "复制配置"
      }
      okText="保存"
      onOk={() => {
        handleSubmit();
      }}
      width={900}
      centered
    >
      <Form<EnvGroup>
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        /** @ts-ingore */
        getFormApi={(api) => ((form.current as FormApi<EnvGroup>) = api)}
        labelPosition="left"
        labelWidth={120}
      >
        <Form.Select
          placeholder="请选择配置分类"
          label="选择配置分类"
          field="category"
          optionList={categoryTemplates.map((template) => ({
            label: template.name,
            value: template.name,
          }))}
          onChange={(valeu) => {
            handleCategoryChange(valeu as string);
          }}
        />

        <Form.Input
          label="配置组名称"
          field="name"
          placeholder="输入配置组名称"
          rules={[{ required: true, message: "请输入配置组名称" }]}
        />
        {
          <div hidden>
            <Form.Input label="ID" field="id" disabled />
          </div>
        }

        <Form.Input
          label="配置组描述"
          field="description"
          placeholder="输入配置组描述（可选）"
          rules={[{ required: false }]}
        />

        <Divider />
        {variables.length ? (
          <ArrayField field="variables" initValue={variables}>
            {({ arrayFields }) => {
              return (
                <>
                  {arrayFields && arrayFields.length > 0 ? (
                    arrayFields.map(({ field, key }, index) => (
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
                          label={`变量${index + 1}`}
                          field={`${field}.[key]`}
                          disabled
                          style={{ width: 200 }}
                        />
                        <Form.Input
                          label="值"
                          field={`${field}.[value]`}
                          style={{ width: 300 }}
                          placeholder="输入变量值"
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
                      暂无变量Key
                    </div>
                  )}
                </>
              );
            }}
          </ArrayField>
        ) : null}
      </Form>
    </Modal>
  );
};
