// 环境变量类型定义
export interface EnvVariable {
  key: string;
  value: string;
  description?: string; // 环境变量描述
  options?: string[];
}

// 分类模板类型定义 - 新增
export interface CategoryTemplate {
  id?: string;
  name: string; // 分类名称
  description?: string;
  keys: string[]; // 该分类下的变量key列表
}

// 环境变量组类型定义
export interface EnvGroup {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  variables: EnvVariable[];
}

// 环境文件类型定义
export interface EnvFile {
  name: string;
  path: string;
  content?: string;
  groups: EnvGroup[];
  categoryTemplates?: CategoryTemplate[]; // 新增：分类模板
}

// 项目类型定义
export interface Project {
  id: string;
  name: string;
  path: string;
  env_files: EnvFile[];
  created_at: string;
  last_modified: string;
}