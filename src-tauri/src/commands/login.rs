use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

/// 在浏览器中打开 URL
#[tauri::command]
pub async fn open_url(url: String, app_handle: AppHandle) -> Result<(), String> {
  app_handle
    .opener()
    .open_url(&url, None::<&str>)
    .map_err(|e| format!("Failed to open browser: {}", e))?;

  Ok(())
}

/// 打开登录页面（在浏览器中）
#[tauri::command]
pub async fn open_login_window(app_handle: AppHandle) -> Result<(), String> {
  open_url("https://bbs.nga.cn/".to_string(), app_handle).await
}
