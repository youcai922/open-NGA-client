mod commands;
mod config;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_http::init())
    .invoke_handler(tauri::generate_handler![
        commands::greet,
        commands::nga_http_request,
        // 配置相关命令
        commands::get_cookie,
        commands::set_cookie,
        commands::clear_cookie,
        commands::get_user_config,
        commands::add_forum,
        commands::remove_forum,
        commands::set_current_forum,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
