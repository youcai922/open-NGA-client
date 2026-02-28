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
        log::info!("Config file does not exist, using defaults");
        return Ok(AppConfig::default());
    }

    log::info!("Reading config from: {:?}", path);

    // 先读取为字节
    let bytes = fs::read(&path)
        .map_err(|e| format!("Failed to read config.yml: {}", e))?;

    log::info!("Read {} bytes from config file", bytes.len());

    // 尝试 UTF-8 解码
    let content = String::from_utf8(bytes.clone());

    let content = match content {
        Ok(s) => {
            log::info!("Config file is UTF-8 encoded");
            s
        }
        Err(_) => {
            // UTF-8 失败，尝试 GBK 解码
            log::warn!("Config file is not UTF-8 encoded, trying GBK...");
            let (decoded, _, _) = encoding_rs::GBK.decode(&bytes);
            let converted = decoded.to_string();
            log::info!("Successfully decoded from GBK");
            // 保存为 UTF-8，避免下次再转换
            let _ = fs::write(&path, &converted);
            converted
        }
    };

    // 尝试解析 YAML
    match serde_yaml::from_str::<AppConfig>(&content) {
        Ok(config) => {
            log::info!("Config parsed successfully");
            Ok(config)
        }
        Err(e) => {
            log::error!("Failed to parse config.yml: {}", e);
            // 备份损坏的文件
            let backup_path = path.with_extension("yml.bak");
            let _ = fs::copy(&path, &backup_path);
            log::info!("Backed up corrupted config to: {:?}", backup_path);
            // 删除损坏的配置文件
            let _ = fs::remove_file(&path);
            log::warn!("Removed corrupted config file, using defaults");
            // 返回默认配置
            Ok(AppConfig::default())
        }
    }
}

/// 保存配置（始终使用 UTF-8）
pub fn save_config(handle: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = get_config_path(handle)?;

    let content = serde_yaml::to_string(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    log::info!("Saving config to: {:?}", path);
    log::info!("Config content length: {} bytes", content.len());

    // 使用 UTF-8 写入
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write config.yml: {}", e))?;

    log::info!("Config saved successfully");
    Ok(())
}
