use crate::config::{AppConfig, ForumInfo, read_config, save_config};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Clone, Serialize, Deserialize)]
pub struct SetCookieRequest {
    pub cookie: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct AddForumRequest {
    pub fid: i64,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct RemoveForumRequest {
    pub fid: i64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SetCurrentForumRequest {
    pub fid: Option<i64>,
}

/// 获取 Cookie
#[tauri::command]
pub async fn get_cookie(app_handle: AppHandle) -> Result<String, String> {
    log::info!("Getting cookie from config...");
    let config = read_config(&app_handle)?;
    log::info!("Cookie retrieved, length: {}", config.nga_cookie.len());
    Ok(config.nga_cookie)
}

/// 设置 Cookie
#[tauri::command]
pub async fn set_cookie(app_handle: AppHandle, request: SetCookieRequest) -> Result<(), String> {
    log::info!("Setting cookie, length: {}", request.cookie.len());

    let mut config = read_config(&app_handle)?;
    config.nga_cookie = request.cookie.clone();

    log::info!("Cookie set in config, saving...");
    save_config(&app_handle, &config)?;

    log::info!("Cookie saved successfully");
    Ok(())
}

/// 清除 Cookie
#[tauri::command]
pub async fn clear_cookie(app_handle: AppHandle) -> Result<(), String> {
    let mut config = read_config(&app_handle)?;
    config.nga_cookie = String::new();
    save_config(&app_handle, &config)?;
    Ok(())
}

/// 获取用户配置
#[tauri::command]
pub async fn get_user_config(app_handle: AppHandle) -> Result<AppConfig, String> {
    read_config(&app_handle)
}

/// 添加板块
#[tauri::command]
pub async fn add_forum(app_handle: AppHandle, request: AddForumRequest) -> Result<(), String> {
    let mut config = read_config(&app_handle)?;

    // 检查是否已存在
    if config.my_forums.iter().any(|f| f.fid == request.fid) {
        return Err("Forum already exists".to_string());
    }

    config.my_forums.push(ForumInfo {
        fid: request.fid,
        name: request.name,
        description: request.description,
    });

    save_config(&app_handle, &config)?;
    Ok(())
}

/// 删除板块
#[tauri::command]
pub async fn remove_forum(app_handle: AppHandle, request: RemoveForumRequest) -> Result<(), String> {
    let mut config = read_config(&app_handle)?;

    config.my_forums.retain(|f| f.fid != request.fid);

    // 如果删除的是当前选中的板块，清除选中状态
    if config.current_forum_fid == Some(request.fid) {
        config.current_forum_fid = None;
    }

    save_config(&app_handle, &config)?;
    Ok(())
}

/// 设置当前选中的板块
#[tauri::command]
pub async fn set_current_forum(app_handle: AppHandle, request: SetCurrentForumRequest) -> Result<(), String> {
    let mut config = read_config(&app_handle)?;
    config.current_forum_fid = request.fid;
    save_config(&app_handle, &config)?;
    Ok(())
}
