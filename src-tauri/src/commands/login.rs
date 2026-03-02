use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;
use crate::config::{read_config, save_config};
use serde::{Deserialize, Serialize};

/// 二维码登录生成的参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrLoginParams {
    pub qrkey: String,
    pub hiddenkey: String,
}

/// 二维码登录状态响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrLoginStatus {
    pub status: String,
    pub uid: Option<i64>,
    pub token: Option<String>,
    pub username: Option<String>,
    pub avatar: Option<String>,
}

/// 二维码登录结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrLoginResult {
    pub success: bool,
    pub uid: i64,
    pub token: String,
    pub username: String,
    pub avatar: String,
}

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

/// 生成二维码登录参数
#[tauri::command]
pub async fn qr_login_generate() -> Result<QrLoginParams, String> {
    log::info!("===== QR Login: Starting generate =====");
    use reqwest::Client;

    let client = Client::builder()
        .build()
        .map_err(|e| {
            log::error!("Failed to create HTTP client: {}", e);
            format!("Failed to create HTTP client: {}", e)
        })?;

    log::info!("Sending POST request to https://bbs.nga.cn/nuke.php");

    let response = client
        .post("https://bbs.nga.cn/nuke.php")
        .form(&[
            ("__lib", "login"),
            ("__act", "qrlogin_gen"),
            ("__output", "1"),
            ("__inchst", "UTF-8"),
        ])
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .header("X-USER-AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| {
            log::error!("Request failed: {}", e);
            format!("请求失败: {}", e)
        })?;

    let status = response.status();
    log::info!("Response status: {}", status);

    if !status.is_success() {
        return Err(format!("服务器返回错误: {}", status));
    }

    let body = response
        .text()
        .await
        .map_err(|e| {
            log::error!("Failed to read response: {}", e);
            format!("读取响应失败: {}", e)
        })?;

    log::info!("Response body length: {}", body.len());

    // 解析响应: window.script_muti_get_var_store={"data":{"0":"qrkey,hiddenkey"},"time":1772418160}
    let data_start = body.find("window.script_muti_get_var_store=")
        .ok_or({
            log::error!("Response format error: script_muti_get_var_store not found");
            "响应格式错误: 找不到 script_muti_get_var_store".to_string()
        })?
        + "window.script_muti_get_var_store=".len();

    let json_str = &body[data_start..];

    #[derive(Deserialize)]
    struct ScriptResponse {
        data: std::collections::HashMap<String, String>,
    }

    let script_response: ScriptResponse = serde_json::from_str(json_str)
        .map_err(|e| {
            log::error!("Failed to parse JSON: {}, json_str: {}", e, json_str);
            format!("解析 JSON 失败: {}", e)
        })?;

    // 获取 "0" 键对应的值
    let params_str = script_response.data.get("0")
        .ok_or({
            log::error!("Response data does not contain key '0'");
            "响应数据不包含键 '0'".to_string()
        })?;

    log::info!("Params string: {}", params_str);

    let parts: Vec<&str> = params_str.split(',').collect();
    if parts.len() != 2 {
        log::error!("Invalid params format: {} (expected 2 parts, got {})", params_str, parts.len());
        return Err(format!("参数格式错误: {}", params_str));
    }

    log::info!("QR login params generated successfully");

    Ok(QrLoginParams {
        qrkey: parts[0].to_string(),
        hiddenkey: parts[1].to_string(),
    })
}

/// 检查二维码登录状态
#[tauri::command]
pub async fn qr_login_check(qrkey: String, hiddenkey: String) -> Result<QrLoginStatus, String> {
    use reqwest::Client;

    let client = Client::builder()
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .post("https://bbs.nga.cn/nuke.php")
        .form(&[
            ("__lib", "login"),
            ("__act", "login"),
            ("__output", "1"),
            ("app_id", "5004"),
            ("device", ""),
            ("v2", "1"),
            ("qrkey", qrkey.as_str()),
            ("hiddenkey", hiddenkey.as_str()),
        ])
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .header("X-USER-AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        return Ok(QrLoginStatus {
            status: format!("error:{}", response.status()),
            uid: None,
            token: None,
            username: None,
            avatar: None,
        });
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    // 解析响应: window.script_muti_get_var_store={"data":{"0":"登录成功","1":uid,"2":token,...},"time":...}
    let data_start = match body.find("window.script_muti_get_var_store=") {
        Some(pos) => pos + "window.script_muti_get_var_store=".len(),
        None => {
            // 无法解析，返回 pending 状态
            return Ok(QrLoginStatus {
                status: "pending".to_string(),
                uid: None,
                token: None,
                username: None,
                avatar: None,
            });
        }
    };

    let json_str = &body[data_start..];

    #[derive(Deserialize)]
    struct ScriptResponse {
        #[serde(default)]
        data: ScriptData,
    }

    #[derive(Deserialize, Default)]
    struct ScriptData {
        #[serde(default)]
        error: std::collections::HashMap<String, String>,
        #[serde(default, rename = "0")]
        field_0: Option<String>,
        #[serde(default, rename = "1")]
        field_1: Option<i64>,
        #[serde(default, rename = "2")]
        field_2: Option<String>,
        #[serde(default, rename = "3")]
        field_3: Option<UserInfo>,
    }

    #[derive(Deserialize, Default)]
    #[allow(dead_code)]
    struct UserInfo {
        #[serde(default)]
        uid: i64,
        #[serde(default)]
        username: String,
        #[serde(default)]
        avatar: String,
        #[serde(default)]
        token: String,
    }

    let script_response: ScriptResponse = serde_json::from_str(json_str)
        .map_err(|e| format!("解析 JSON 失败: {}", e))?;

    // 检查是否有错误
    if !script_response.data.error.is_empty() {
        if let Some(error_msg) = script_response.data.error.get("0") {
            if error_msg == "未找到登录许可" {
                return Ok(QrLoginStatus {
                    status: "pending".to_string(),
                    uid: None,
                    token: None,
                    username: None,
                    avatar: None,
                });
            }
            return Ok(QrLoginStatus {
                status: format!("error:{}", error_msg),
                uid: None,
                token: None,
                username: None,
                avatar: None,
            });
        }
    }

    // 检查是否登录成功
    if let Some(msg) = script_response.data.field_0 {
        if msg == "登录成功" {
            let uid = script_response.data.field_1.unwrap_or(0);
            let token = script_response.data.field_2.unwrap_or_default();
            let user_info = script_response.data.field_3.unwrap_or_default();

            return Ok(QrLoginStatus {
                status: "success".to_string(),
                uid: Some(uid),
                token: Some(token),
                username: Some(user_info.username),
                avatar: Some(user_info.avatar),
            });
        }
    }

    Ok(QrLoginStatus {
        status: "pending".to_string(),
        uid: None,
        token: None,
        username: None,
        avatar: None,
    })
}

/// 设置登录后的 Cookie
#[tauri::command]
pub async fn qr_login_set_cookie(app_handle: AppHandle, uid: i64, token: String) -> Result<QrLoginResult, String> {
    use reqwest::Client;

    let client = Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // 第一步：调用 login_set_cookie_quick 设置基本认证 Cookie
    let response = client
        .post("https://bbs.nga.cn/nuke.php")
        .query(&[
            ("__lib", "login"),
            ("__act", "login_set_cookie_quick"),
            ("__output", "9"),
        ])
        .form(&[
            ("uid", &uid.to_string()),
            ("cid", &token),
        ])
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .header("X-USER-AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    // 收集第一步的 Set-Cookie
    let mut all_cookies = Vec::new();
    for cookie in response.headers().get_all("set-cookie").iter().filter_map(|v| v.to_str().ok()) {
        log::info!("Step 1 Set-Cookie: {}", cookie);
        // 提取 cookie 名称和值（去掉属性）
        if let Some(end) = cookie.find(';') {
            all_cookies.push(cookie[..end].to_string());
        } else {
            all_cookies.push(cookie.to_string());
        }
    }

    if all_cookies.is_empty() {
        // 备用方案：直接使用 uid 和 token
        all_cookies.push(format!("ngaPassportUid={}", uid));
        all_cookies.push(format!("ngaPassportCid={}", token));
    }

    let cookie_header = all_cookies.join("; ");
    log::info!("Cookie after step 1: {}", cookie_header);

    // 第二步：访问首页，让服务器设置额外的 Cookie
    let client2 = Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response2 = client2
        .get("https://bbs.nga.cn/")
        .header("Cookie", &cookie_header)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("请求首页失败: {}", e))?;

    // 收集第二步的 Set-Cookie
    let mut final_cookies = all_cookies.clone();
    for cookie in response2.headers().get_all("set-cookie").iter().filter_map(|v| v.to_str().ok()) {
        log::info!("Step 2 Set-Cookie: {}", cookie);
        if let Some(end) = cookie.find(';') {
            let cookie_pair = &cookie[..end];
            // 检查是否已存在同名的 Cookie
            let cookie_name = cookie_pair.split('=').next().unwrap_or("");
            if !cookie_name.is_empty() {
                // 移除同名旧 Cookie
                final_cookies.retain(|c| !c.starts_with(&format!("{}=", cookie_name)));
                final_cookies.push(cookie_pair.to_string());
            }
        }
    }

    // 组合所有 Cookie
    let final_cookie_value = final_cookies.join("; ");

    log::info!("Final cookie: {}", final_cookie_value);

    // 保存到配置
    let mut config = read_config(&app_handle)?;
    config.nga_cookie = final_cookie_value.clone();
    save_config(&app_handle, &config)?;

    log::info!("Cookie saved successfully");

    Ok(QrLoginResult {
        success: true,
        uid,
        token,
        username: String::new(),
        avatar: String::new(),
    })
}
