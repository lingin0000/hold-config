import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Field,
  Label,
  Input,
  Divider,
  Dropdown,
  Option,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { useState, useEffect, useCallback } from 'react';
import { EnvGroup, CategoryTemplate } from '../types';

const useStyles = makeStyles({
  dialogContent: {
    minWidth: '600px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  variableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    marginBottom: tokens.spacingVerticalXS,
  },
  keyDisplay: {
    fontWeight: 'bold',
    color: tokens.colorNeutralForeground1,
  },
});

interface ConfigGroupDialogProps {
  isOpen: boolean;
  isNewGroup: boolean;
  editingGroup: EnvGroup | null;
  categoryTemplates: CategoryTemplate[];
  onClose: () => void;
  onSave: () => void;
  onGroupChange: (group: EnvGroup) => void;
}

export const ConfigGroupDialog = ({
  isOpen,
  isNewGroup,
  editingGroup,
  categoryTemplates,
  onClose,
  onSave,
  onGroupChange,
}: ConfigGroupDialogProps) => {
  const styles = useStyles();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // 当选择分类时，获取该分类下的所有key
  useEffect(() => {
    if (selectedCategory) {
      const template = categoryTemplates.find(t => t.name === selectedCategory);
      if (template) {
        setAvailableKeys(template.keys);
        
        // 如果是新建组且还未初始化过，初始化变量
        if (isNewGroup && editingGroup && !hasInitialized) {
          const newVariables = template.keys.map(key => ({
            key,
            value: '',
            options: []
          }));
          onGroupChange({
            ...editingGroup,
            category: selectedCategory,
            variables: newVariables
          });
          setHasInitialized(true);
        }
      }
    } else {
      setAvailableKeys([]);
    }
  }, [selectedCategory, categoryTemplates, isNewGroup, editingGroup, hasInitialized]); // 移除 onGroupChange 依赖

  // 当对话框打开时，初始化选中的分类
  useEffect(() => {
    if (isOpen && editingGroup?.category) {
      setSelectedCategory(editingGroup.category);
      setHasInitialized(true);
    } else if (isOpen && isNewGroup) {
      setSelectedCategory('');
      setHasInitialized(false);
    }
  }, [isOpen, editingGroup, isNewGroup]);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
    setHasInitialized(false); // 重置初始化状态
    if (editingGroup) {
      onGroupChange({ ...editingGroup, category });
    }
  }, [editingGroup, onGroupChange]);

  const handleValueChange = (key: string, value: string) => {
    if (!editingGroup) return;
    
    const updatedVariables = editingGroup.variables.map(variable => 
      variable.key === key ? { ...variable, value } : variable
    );
    
    onGroupChange({ ...editingGroup, variables: updatedVariables });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => {
      if (!data.open) {
        onClose();
      }
    }}>
      <DialogSurface className={styles.dialogContent}>
        <DialogBody>
          <DialogTitle>
            {isNewGroup ? '添加配置组' : '编辑配置组'}
          </DialogTitle>
          <DialogContent>
            {editingGroup && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
                <Field>
                  <Label>选择配置分类</Label>
                  <Dropdown
                    placeholder="请选择配置分类"
                    value={selectedCategory}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        handleCategorySelect(data.optionValue);
                      }
                    }}
                  >
                    {categoryTemplates.map((template) => (
                      <Option key={template.id} value={template.name} text={template.name}>
                        {template.name} ({template.keys.length}个变量)
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
                
                <Field>
                  <Label>配置组名称</Label>
                  <Input
                    value={editingGroup.name}
                    onChange={(_, data) => onGroupChange({ ...editingGroup, name: data.value })}
                    placeholder="输入配置组名称"
                  />
                </Field>
                
                <Field>
                  <Label>配置组描述</Label>
                  <Input
                    value={editingGroup.description || ''}
                    onChange={(_, data) => onGroupChange({ ...editingGroup, description: data.value })}
                    placeholder="输入配置组描述（可选）"
                  />
                </Field>
                
                {selectedCategory && availableKeys.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Label>配置变量值</Label>
                      <div style={{ maxHeight: '300px', overflow: 'auto', marginTop: tokens.spacingVerticalS }}>
                        {availableKeys.map((key) => {
                          const variable = editingGroup.variables.find(v => v.key === key);
                          return (
                            <div key={key} className={styles.variableRow}>
                              <div className={styles.keyDisplay}>{key}</div>
                              <Input
                                value={variable?.value || ''}
                                onChange={(_, data) => handleValueChange(key, data.value)}
                                placeholder="输入变量值"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              取消
            </Button>
            <Button 
              appearance="primary" 
              onClick={onSave}
              disabled={!editingGroup?.name.trim() || !selectedCategory}
            >
              保存
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};