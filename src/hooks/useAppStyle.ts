import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    height: "calc(100vh - 16px)",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  mainContent: {
    flex: 1,
    display: "flex",
    margin: "0 auto",
    width: "100%",
    overflow: "hidden",
  },
  workArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  workAreaHeader: {
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workAreaHeaderLeft: {
    display: "flex",
    flexDirection: "column",
  },
  workAreaHeaderRight: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
  workAreaContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  configManagement: {
    flex: 1,
    padding: tokens.spacingVerticalM,
    overflow: "auto",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    gap: tokens.spacingVerticalL,
  },
  emptyStateIcon: {
    fontSize: "64px",
    color: tokens.colorNeutralForeground3,
  },
  groupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", // 进一步减小最小宽度
    gap: tokens.spacingVerticalXS, // 进一步减小间距
    marginBottom: tokens.spacingVerticalL,
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${tokens.spacingVerticalM} 0`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: tokens.spacingVerticalL,
  },
  // 新增：窗口菜单状态栏样式
  statusBar: {
    padding: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBarLeft: {
    display: "flex",
    alignItems: "center",
  },
  statusBarRight: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "center",
  },
});

export const useAppStyle = useStyles;