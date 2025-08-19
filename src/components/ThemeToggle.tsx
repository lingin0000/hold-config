import React from 'react';
import {
  makeStyles,
  Select,
  useId,
  SelectOnChangeData,
} from '@fluentui/react-components';
import { useTheme, ThemeType } from '../contexts/ThemeContext';

const useStyles = makeStyles({
  headerActions: {
    display: 'flex',
    alignItems: 'center',
  },
  themeSelect: {
    minWidth: '120px',
  },
});

export const ThemeToggle: React.FC = () => {
  const selectId = useId();
  const styles = useStyles();
  const { themeType, setThemeType } = useTheme();

  // 处理主题切换
  const handleThemeChange = (_: any, data: SelectOnChangeData) => {
    const newTheme = data.value as ThemeType;
    if (
      newTheme &&
      (newTheme === 'webLight' ||
        newTheme === 'webDark' ||
        newTheme === 'teamsDark' ||
        newTheme === 'teamsLight')
    ) {
      setThemeType(newTheme);
    }
  };

  return (
    <div className={styles.headerActions}>
      <Select
        id={selectId}
        value={themeType}
        onChange={handleThemeChange}
        className={styles.themeSelect}
      >
        <option value="webLight">Web 亮色主题</option>
        <option value="webDark">Web 暗色主题</option>
        <option value="teamsDark">Teams 暗色主题</option>
        <option value="teamsLight">Teams 亮色主题</option>
      </Select>
    </div>
  );
};
