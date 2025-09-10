import { IconFile } from "@douyinfe/semi-icons";
import { EnvFile } from "../types";
import { TabPane, Tabs } from "@douyinfe/semi-ui";

interface EnvFileTabsProps {
  envFiles: EnvFile[];
  selectedEnvFile?: string;
  onEnvFileSelect: (value: string) => void;
}

export const EnvFileTabs = ({
  envFiles,
  selectedEnvFile,
  onEnvFileSelect,
}: EnvFileTabsProps) => {
  return (
    <div
      style={{
        borderBottom: `1px solid #ccc`,
        padding: 8,
        position: "sticky",
        top: 0,
        backgroundColor: "var(--semi-color-bg-1)",
      }}
    >
      <Tabs
        type="button"
        onChange={(activeKey) => onEnvFileSelect(activeKey)}
        activeKey={selectedEnvFile}
        style={{ padding: 0 }}
      >
        {envFiles.map((file) => (
          <TabPane
            tab={file.name}
            key={file.name}
            itemKey={file.name}
            icon={<IconFile />}
          />
        ))}
      </Tabs>
    </div>
  );
};
