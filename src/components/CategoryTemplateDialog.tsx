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
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  Add20Regular,
  Delete20Regular
} from '@fluentui/react-icons';
import { CategoryTemplate } from '../types';

const useStyles = makeStyles({
  dialogContent: {
    minWidth: '600px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  keyRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    marginBottom: tokens.spacingVerticalXS,
  },
});

interface CategoryTemplateDialogProps {
  isOpen: boolean;
  isNewTemplate: boolean;
  editingTemplate: CategoryTemplate | null;
  onClose: () => void;
  onSave: () => void;
  onTemplateChange: (template: CategoryTemplate) => void;
  onAddKey: () => void;
  onUpdateKey: (keyIndex: number, newKey: string) => void;
  onDeleteKey: (keyIndex: number) => void;
}

export const CategoryTemplateDialog = ({
  isOpen,
  isNewTemplate,
  editingTemplate,
  onClose,
  onSave,
  onTemplateChange,
  onAddKey,
  onUpdateKey,
  onDeleteKey
}: CategoryTemplateDialogProps) => {
  const styles = useStyles();

  // 确保模板数据完整性，防止白屏
  const safeTemplate = editingTemplate || {
    id: '',
    name: '',
    description: '',
    keys: []
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
            {isNewTemplate ? '添加分类模板' : '编辑分类模板'}
          </DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              {/* 表单头部继续使用 safeTemplate 作为回填默认值 */}
              <Field>
                <Label>分类名称</Label>
                <Input
                  value={safeTemplate.name}
                  onChange={(_, data) => onTemplateChange({ ...safeTemplate, name: data.value })}
                  placeholder="输入分类名称"
                />
              </Field>
              
              <Field>
                <Label>分类描述</Label>
                <Input
                  value={safeTemplate.description || ''}
                  onChange={(_, data) => onTemplateChange({ ...safeTemplate, description: data.value })}
                  placeholder="输入分类描述（可选）"
                />
              </Field>
              
              <Divider />
              
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: tokens.spacingVerticalS 
                }}>
                  <Label>变量Key列表</Label>
                  <Button 
                    appearance="secondary"
                    size="small"
                    icon={<Add20Regular />}
                    onClick={(e) => {
                      e.preventDefault();
                      onAddKey();
                    }}
                  >
                    添加Key
                  </Button>
                </div>
                
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {(editingTemplate?.keys ?? []).map((key, keyIndex) => (
                    <div key={keyIndex} className={styles.keyRow}>
                      <Input
                        value={key}
                        onChange={(_, data) => onUpdateKey(keyIndex, data.value)}
                        placeholder="变量Key名称"
                      />
                      <Button
                        appearance="subtle"
                        icon={<Delete20Regular />}
                        size="small"
                        onClick={() => onDeleteKey(keyIndex)}
                      />
                    </div>
                  ))}
                  {(editingTemplate?.keys ?? []).length === 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: tokens.spacingVerticalL,
                      color: tokens.colorNeutralForeground3 
                    }}>
                      暂无变量Key，请添加
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              取消
            </Button>
            <Button 
              appearance="primary" 
              onClick={onSave}
              disabled={!safeTemplate.name?.trim() || safeTemplate.keys?.length === 0}
            >
              保存
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};