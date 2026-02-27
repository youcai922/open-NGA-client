use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

/// 应用配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// NGA Cookie
    pub nga_cookie: String,
    /// 用户收藏的板块列表
    pub my_forums: Vec<ForumInfo>,
    /// 当前选中的板块 fid
    pub current_forum_fid: Option<i64>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            nga_cookie: String::new(),
            my_forums: Vec::new(),
            current_forum_fid: None,
        }
    }
}

/// 板块信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForumInfo {
    pub fid: i64,
    pub name: String,
    pub description: Option<String>,
}

/// 获取 settings 目录路径
pub fn get_settings_dir(handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config_dir = handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;

    // 创建 settings 目录
    let settings_dir = config_dir.join("settings");
    fs::create_dir_all(&settings_dir)
        .map_err(|e| format!("Failed to create settings dir: {}", e))?;

    Ok(settings_dir)
}

/// 获取配置文件路径
pub fn get_config_path(handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(get_settings_dir(handle)?.join("config.yml"))
}

/// 读取配置
pub fn read_config(handle: &tauri::AppHandle) -> Result<AppConfig, String> {
    let path = get_config_path(handle)?;

    if !path.exists() {
        // 如果文件不存在，返回默认值
        return Ok(AppConfig::default());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read config.yml: {}", e))?;

    serde_yaml::from_str(&content)
        .map_err(|e| format!("Failed to parse config.yml: {}", e))
}

/// 保存配置
pub fn save_config(handle: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = get_config_path(handle)?;

    let content = serde_yaml::to_string(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&path, content)
        .map_err(|e| format!("Failed to write config.yml: {}", e))?;

    Ok(())
}
