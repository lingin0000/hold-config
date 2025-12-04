// 顶部 use 行
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::image::Image;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager,
}; // 新增：用于生成时间戳

#[derive(Debug, Serialize, Deserialize)]
struct EnvFile {
    name: String,
    path: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct EnvConfig {
    title: String,
    variables: std::collections::HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProjectConfig {
    name: String,
    path: String,
    env_files: Vec<EnvFile>,
    preset_configs: Vec<EnvConfig>,
}

// 托盘菜单相关数据结构
#[derive(Debug, Serialize, Deserialize, Clone)]
struct TrayProjectData {
    id: String,
    name: String,
    env_files: Vec<TrayEnvFile>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TrayEnvFile {
    name: String,
    path: String,
    categories: Vec<TrayCategory>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TrayCategory {
    name: String,
    groups: Vec<TrayGroup>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TrayGroup {
    id: String,
    name: String,
    project_id: String,
    env_file_path: String,
    category: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn scan_env_files(project_path: String) -> Result<Vec<EnvFile>, String> {
    let path = Path::new(&project_path);
    if !path.exists() {
        return Err("Project path does not exist".to_string());
    }

    let mut env_files = Vec::new();
    let env_patterns = vec![
        ".env",
        ".env.local",
        ".env.development",
        ".env.production",
        ".env.test",
    ];

    for pattern in env_patterns {
        let file_path = path.join(pattern);
        if file_path.exists() {
            match fs::read_to_string(&file_path) {
                Ok(content) => {
                    env_files.push(EnvFile {
                        name: pattern.to_string(),
                        path: file_path.to_string_lossy().to_string(),
                        content,
                    });
                }
                Err(_) => continue,
            }
        }
    }

    Ok(env_files)
}

#[tauri::command]
fn save_env_file(file_path: String, content: String) -> Result<(), String> {
    fs::write(&file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_project_config(project_path: String) -> Result<ProjectConfig, String> {
    let config_path = Path::new(&project_path).join(".hold-config.json");

    if config_path.exists() {
        let content = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
        let config: ProjectConfig = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(config)
    } else {
        // 创建默认配置
        let env_files = scan_env_files(project_path.clone())?;
        let config = ProjectConfig {
            name: Path::new(&project_path)
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            path: project_path,
            env_files,
            preset_configs: vec![
                EnvConfig {
                    title: "开发环境".to_string(),
                    variables: std::collections::HashMap::new(),
                },
                EnvConfig {
                    title: "生产环境".to_string(),
                    variables: std::collections::HashMap::new(),
                },
            ],
        };
        Ok(config)
    }
}

#[tauri::command]
fn save_project_config(config: ProjectConfig) -> Result<(), String> {
    let config_path = Path::new(&config.path).join(".hold-config.json");
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_project_config(project_data: String, project_name: String) -> Result<String, String> {
    // 确保 D:\temp 目录存在
    let temp_dir = Path::new("D:\\temp");
    if !temp_dir.exists() {
        fs::create_dir_all(temp_dir).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    // 生成带时间戳的文件名
    let now: DateTime<Local> = Local::now();
    let timestamp = now.format("%Y%m%d_%H%M%S").to_string();
    let filename = format!("{}_{}.json", project_name, timestamp);

    let file_path = temp_dir.join(filename);

    // 写入文件
    fs::write(&file_path, project_data).map_err(|e| format!("写入文件失败: {}", e))?;

    // 返回导出的文件路径
    Ok(file_path.to_string_lossy().to_string())
}

// 新增：按文件路径读取文本内容（用于预览 .env 等文件）
#[tauri::command]
fn read_env_file(file_path: String) -> Result<String, String> {
    // 直接使用 Rust 标准库读取，避免前端插件 fs 的能力范围限制
    std::fs::read_to_string(&file_path).map_err(|e| format!("读取失败: {}", e))
}

// 更新托盘菜单的命令
#[tauri::command]
fn update_tray_menu(app: tauri::AppHandle, projects: Vec<TrayProjectData>) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let menu = build_tray_menu(&app, projects).map_err(|e| e.to_string())?;
        tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// 构建托盘菜单
fn build_tray_menu(
    app: &tauri::AppHandle,
    projects: Vec<TrayProjectData>,
) -> Result<tauri::menu::Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let mut menu_builder = MenuBuilder::new(app);

    // 按 项目 -> 环境文件 -> 分类 -> 组 的层次构建
    for project in projects {
        // 项目标题（作为分组标识）
        let project_title = format!("📁 {}", project.name);
        let project_item = MenuItemBuilder::new(&project_title)
            .id(&format!("label-project-{}", project.id))
            .build(app)?;
        menu_builder = menu_builder.item(&project_item);

        for env in project.env_files {
            let env_item = MenuItemBuilder::new(&format!("🧾 {}", env.name))
                .id(&format!("label-env-{}-{}", project.id, env.name))
                .build(app)?;
            menu_builder = menu_builder.item(&env_item);

            for category in env.categories {
                let cat_item = MenuItemBuilder::new(&format!("📂 {}", category.name))
                    .id(&format!("label-cat-{}-{}-{}", project.id, env.name, category.name))
                    .build(app)?;
                menu_builder = menu_builder.item(&cat_item);

                for group in category.groups {
                    let group_item = MenuItemBuilder::new(&format!("⚙️ {}", group.name))
                        .id(&format!(
                            "tray-config-{}-{}-{}",
                            group.project_id,
                            group.env_file_path,
                            group.id
                        ))
                        .build(app)?;
                    menu_builder = menu_builder.item(&group_item);
                }
            }
        }

        // 每个项目后增加分隔符
        menu_builder = menu_builder.separator();
    }

    // 末尾保留退出项
    let quit_app = MenuItemBuilder::new("退出").id("quit-app").build(app)?;
    menu_builder = menu_builder.item(&quit_app);

    Ok(menu_builder.build()?)
}

// 已移除快速切换悬浮窗功能

// 创建初始托盘菜单
fn create_tray_icon(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // 创建初始菜单（只保留退出）
    let quit_app = MenuItemBuilder::new("退出").id("quit-app").build(app)?;
    let menu = MenuBuilder::new(app)
        .item(&quit_app)
        .build()?;

    // 使用 PNG 图标
    let tray_icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))?;

    // 创建托盘图标
    TrayIconBuilder::with_id("main-tray")
        .menu(&menu)
        .icon(tray_icon)
        .tooltip("配置管理器")
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "quit-app" => {
                    app.exit(0);
                }
                id if id.starts_with("tray-config-") => {
                    // 解析菜单ID获取配置信息
                    let parts: Vec<&str> = id
                        .strip_prefix("tray-config-")
                        .unwrap()
                        .split('-')
                        .collect();
                    if parts.len() >= 3 {
                        let project_id = parts[0];
                        let env_file_path = parts[1..parts.len() - 1].join("-");
                        let group_id = parts[parts.len() - 1];

                        // 发送事件到前端
                        let _ = app.emit(
                            "tray-apply-config",
                            serde_json::json!({
                                "project_id": project_id,
                                "env_file_path": env_file_path,
                                "group_id": group_id
                            }),
                        );
                    }
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|app, event| {
            // 左键打开主窗口；右键与中键由系统托盘处理（显示菜单），此处无需处理
            match event {
                tauri::tray::TrayIconEvent::Click { button, .. } => {
                    if button == tauri::tray::MouseButton::Left {
                        if let Some(win) = app.app_handle().get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    } else {
                        // 右键 / 中键：不处理，系统菜单负责显示
                    }
                }
                tauri::tray::TrayIconEvent::DoubleClick { .. } => {
                    if let Some(win) = app.app_handle().get_webview_window("main") {
                        let _ = win.show();
                        let _ = win.set_focus();
                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // 监听菜单事件
            app.on_menu_event(move |app, event| {
                match event.id().as_ref() {
                    "add_project" => {
                        // 发送添加项目事件到前端
                        let _ = app.emit("menu-add-project", ());
                    }
                    _ => {}
                }
            });

            // 创建系统托盘
            create_tray_icon(app)?;

            // 监听主窗口关闭按钮：改为隐藏窗口（阻止真正关闭，托盘保留）
            if let Some(main_win) = app.get_webview_window("main") {
                let main_win_clone = main_win.clone();
                main_win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        // 阻止窗口被关闭（应用不退出）
                        api.prevent_close();
                        // 隐藏到托盘（看起来像关闭）
                        let _ = main_win_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            scan_env_files,
            save_env_file,
            load_project_config,
            save_project_config,
            update_tray_menu,
            export_project_config,
            read_env_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
