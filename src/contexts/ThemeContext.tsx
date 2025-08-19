import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Theme,
  webLightTheme,
  webDarkTheme,
  teamsDarkTheme,
  teamsLightTheme,
} from "@fluentui/react-components";

// 主题类型定义
export type ThemeType = "webLight" | "webDark" | "teamsDark" | "teamsLight";


interface ThemeContextType {
  themeType: ThemeType;
  currentTheme: Theme;
  toggleTheme: () => void;
  setThemeType: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 获取主题对象的辅助函数
const getTheme = (type: ThemeType): Theme => {
  if (type === "webLight") {
    return webLightTheme;
  }
  if (type === "webDark") {
    return webDarkTheme;
  }
  if (type === "teamsDark") {
    return teamsDarkTheme;
  }
  if (type === "teamsLight") {
    return teamsLightTheme;
  }
  return webDarkTheme;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 从localStorage读取保存的主题设置，默认为暗色主题
  const [themeType, setThemeType] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("theme-type");
    return (saved as ThemeType) || "dark";
  });



  // 计算当前主题
  const currentTheme = getTheme(themeType);

  // 切换明暗主题
  const toggleTheme = () => {
    const newType = themeType === "webLight" ? "webDark" : "webLight";
    setThemeType(newType);
    localStorage.setItem("theme-type", newType);
  };

  // 设置主题类型
  const handleSetThemeType = (type: ThemeType) => {
    setThemeType(type);
    localStorage.setItem("theme-type", type);
  };



  const value: ThemeContextType = {
    themeType,

    currentTheme,
    toggleTheme,
    setThemeType: handleSetThemeType,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// 自定义hook用于使用主题
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
