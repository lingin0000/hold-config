import { Tab, TabList, TabValue, makeStyles, tokens } from '@fluentui/react-components';
import { EnvFile } from '../types';

const useStyles = makeStyles({
  envFilesTabs: {
    marginBottom: tokens.spacingVerticalM,
    overflow: 'auto',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: tokens.spacingVerticalS,
  },
  tabList: {
    minWidth: 'max-content',
  }
});

interface EnvFileTabsProps {
  envFiles: EnvFile[];
  selectedEnvFile?: TabValue;
  onEnvFileSelect: (value: TabValue) => void;
}

export const EnvFileTabs = ({ 
  envFiles, 
  selectedEnvFile, 
  onEnvFileSelect 
}: EnvFileTabsProps) => {
  const styles = useStyles();

  return (
    <div className={styles.envFilesTabs}>
      <TabList 
        className={styles.tabList}
        selectedValue={selectedEnvFile} 
        onTabSelect={(_, data) => onEnvFileSelect(data.value)}
      >
        {envFiles.map((file, index) => (
          <Tab key={index} value={index.toString()}>
            📄 {file.name}
          </Tab>
        ))}
      </TabList>
    </div>
  );
};