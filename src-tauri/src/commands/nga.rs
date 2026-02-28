use serde::{Deserialize, Serialize};
use encoding_rs::GBK;
use base64::Engine;

#[derive(Clone, Serialize, Deserialize)]
pub struct NgaResponse {
    pub success: bool,
    pub status: u16,
    pub body: String,  // 原始响应体
    pub data: Option<Vec<ForumInfo>>,  // 解析后的板块列表（如果适用）
    pub error: Option<String>,
}

/// 板块信息
#[derive(Clone, Serialize, Deserialize)]
pub struct ForumInfo {
    pub fid: i64,
    pub name: String,
    pub info: Option<String>,
    pub name_s: Option<String>,
    pub info_s: Option<String>,
    pub bit: Option<i64>,
    pub category1: Option<String>,  // 一级分类名
    pub category2: Option<String>,  // 二级分类名
}

/// 检测并转换编码
fn convert_encoding(bytes: &[u8]) -> String {
    // 尝试 UTF-8 解码
    if let Ok(text) = std::str::from_utf8(bytes) {
        // 检查是否有乱码字符
        if !text.contains('�') && !text.contains('\u{FFFD}') {
            return text.to_string();
        }
    }

    // 尝试 GBK 解码（NGA 常用编码）
    let (decoded, _, _) = GBK.decode(bytes);
    decoded.to_string()
}

/// 解析 NGA 返回的 JavaScript 变量格式，提取 JSON 数据
fn parse_nga_response(body: &str) -> Result<serde_json::Value, String> {
    log::info!("Parsing NGA response format...");

    // NGA 可能返回的格式：
    // 1. window.script_muti_get_var_store={"data":...}
    // 2. window.__SESSION = {...}; window.script_muti_get_var_store={...}
    // 3. 纯 JSON

    let trimmed = body.trim();

    // 情况1: 提取 window.script_muti_get_var_store 的值
    if let Some(start) = trimmed.find("window.script_muti_get_var_store=") {
        let json_start = start + "window.script_muti_get_var_store=".len();
        let json_str = &trimmed[json_start..];

        // 找到匹配的结束花括号（处理嵌套）
        let json_part = find_matching_braces(json_str);
        log::info!("Found script_muti_get_var_store JSON, parsing...");
        log::info!("Extracted JSON length: {} chars", json_part.len());

        match serde_json::from_str::<serde_json::Value>(&json_part) {
            Ok(value) => {
                log::info!("Successfully parsed script_muti_get_var_store JSON");
                return Ok(value);
            }
            Err(e) => {
                log::error!("Failed to parse script_muti_get_var_store JSON: {}", e);
                log::error!("JSON preview: {}", &json_part[..json_part.len().min(200)]);
            }
        }
    }

    // 情况2: 尝试直接解析整个响应为 JSON
    log::info!("Trying to parse response as direct JSON...");
    match serde_json::from_str::<serde_json::Value>(trimmed) {
        Ok(value) => {
            log::info!("Successfully parsed as direct JSON");
            return Ok(value);
        }
        Err(e) => {
            log::error!("Failed to parse as JSON: {}", e);
        }
    }

    // 情况3: 尝试提取从第一个花括号到最后一个花括号的内容
    if let Some(start) = trimmed.find('{') {
        if let Some(end) = trimmed.rfind('}') {
            let json_part = &trimmed[start..=end];
            log::info!("Trying to extract JSON from braces (first to last)...");
            log::info!("Extracted JSON length: {} chars", json_part.len());
            match serde_json::from_str::<serde_json::Value>(json_part) {
                Ok(value) => {
                    log::info!("Successfully parsed extracted JSON");
                    // 打印解析后的数据结构预览
                    if let Some(data) = value.get("data") {
                        log::info!("Parsed data has 'data' key");
                        if let Some(all) = data.get("all") {
                            log::info!("Parsed data has 'data.all' key");
                            if let Some(obj) = all.as_object() {
                                log::info!("data.all has {} categories", obj.len());
                            }
                        }
                    }
                    return Ok(value);
                }
                Err(e) => {
                    log::error!("Failed to parse extracted JSON: {}", e);
                }
            }
        }
    }

    // 都失败了，返回原始文本
    log::warn!("Could not parse as JSON, returning raw text");
    Ok(serde_json::json!({
        "raw": body
    }))
}

/// 找到匹配的结束花括号（处理嵌套）
fn find_matching_braces(s: &str) -> String {
    let mut depth = 0;
    let mut end_pos = 0;

    for (i, c) in s.chars().enumerate() {
        if c == '{' {
            depth += 1;
        } else if c == '}' {
            depth -= 1;
            if depth == 0 {
                end_pos = i;
                break;
            }
        }
    }

    s[..=end_pos].to_string()
}

/// 从 NGA 数据中提取扁平化的板块列表
fn extract_forum_list(data: &serde_json::Value) -> Vec<ForumInfo> {
    let mut forums = Vec::new();

    log::info!("=== Starting forum list extraction ===");

    // 数据结构: data -> "0" -> all -> [wow, bliz, games, ...] -> content -> [0, 1, 2...] -> content -> [板块列表]
    let all = data.get("data").and_then(|d| d.get("0")).and_then(|z| z.get("all"));

    if let Some(all) = all {
        log::info!("Found data.\"0\".all");

        if let Some(obj) = all.as_object() {
            log::info!("data.\"0\".all has {} categories", obj.len());

            for (cat1_key, cat1_value) in obj {
                let cat1_name = cat1_value.get("name").and_then(|n| n.as_str()).map(|s| s.to_string());
                log::info!("Category1: '{}' ({})", cat1_name.as_deref().unwrap_or(cat1_key), cat1_key);

                // 遍历二级分类 content
                if let Some(content) = cat1_value.get("content") {
                    if let Some(content_obj) = content.as_object() {
                        for (cat2_key, cat2_value) in content_obj {
                            let cat2_name = cat2_value.get("name").and_then(|n| n.as_str()).map(|s| s.to_string());

                            // 遍历三级 content -> 板块列表
                            if let Some(forum_content) = cat2_value.get("content") {
                                if let Some(forum_obj) = forum_content.as_object() {
                                    log::info!("  Category2 '{}' has {} forums", cat2_name.as_deref().unwrap_or(cat2_key), forum_obj.len());

                                    for (_fid_key, forum_value) in forum_obj {
                                        if let Some(fid) = forum_value.get("fid").and_then(|f| f.as_i64()) {
                                            if let Some(name) = forum_value.get("name").and_then(|n| n.as_str()) {
                                                log::info!("    Forum: fid={}, name={}", fid, name);

                                                forums.push(ForumInfo {
                                                    fid,
                                                    name: name.to_string(),
                                                    info: forum_value.get("info").and_then(|i| i.as_str()).map(|s| s.to_string()),
                                                    name_s: forum_value.get("nameS").and_then(|n| n.as_str()).map(|s| s.to_string()),
                                                    info_s: forum_value.get("infoS").and_then(|i| i.as_str()).map(|s| s.to_string()),
                                                    bit: forum_value.get("bit").and_then(|b| b.as_i64()),
                                                    category1: cat1_name.clone(),
                                                    category2: cat2_name.clone(),
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } else {
        log::info!("ERROR: Cannot find data.\"0\".all path!");
        // 打印可用的键
        if let Some(data_obj) = data.get("data") {
            if let Some(zero_obj) = data_obj.get("0") {
                log::info!("data.\"0\" keys: {:?}", zero_obj.as_object().map(|o| o.keys().collect::<Vec<_>>()));
            } else {
                log::info!("data keys: {:?}", data_obj.as_object().map(|o| o.keys().collect::<Vec<_>>()));
            }
        }
    }

    log::info!("=== Extraction complete, found {} forums ===", forums.len());
    forums
}

/// 使用 Rust 端发送 HTTP 请求，避免 Tauri HTTP 插件的问题
#[tauri::command]
pub async fn nga_http_request(url: String, cookie: String) -> Result<NgaResponse, String> {
    log::info!("=== NGA HTTP Request Start ===");
    log::info!("URL: {}", url);
    log::info!("Cookie length: {}", cookie.len());

    // 构建 HTTP 客户端
    log::info!("Building HTTP client...");
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| {
            log::error!("Failed to create HTTP client: {}", e);
            format!("Failed to create client: {}", e)
        })?;
    log::info!("HTTP client created successfully");

    // 发送请求
    log::info!("Sending HTTP GET request to {}", url);
    let response = client
        .get(&url)
        .header("Cookie", &cookie)
        .send()
        .await;

    match response {
        Ok(resp) => {
            let status = resp.status().as_u16();
            log::info!("Received HTTP response with status: {}", status);

            // 获取响应体（原始字节）
            log::info!("Reading response body bytes...");
            let body_bytes = match resp.bytes().await {
                Ok(bytes) => {
                    log::info!("Response body bytes read: {} bytes", bytes.len());
                    bytes.to_vec()
                }
                Err(e) => {
                    log::error!("Failed to read response body: {}", e);
                    let error_response = NgaResponse {
                        success: false,
                        status,
                        body: String::new(),
                        data: None,
                        error: Some(format!("Failed to read body: {}", e)),
                    };
                    log::info!("Returning error response: success={}, status={}", error_response.success, error_response.status);
                    return Ok(error_response);
                }
            };

            // 转换编码（GBK -> UTF-8）
            log::info!("Converting encoding from GBK/UTF-8...");
            let body = convert_encoding(&body_bytes);

            log::info!("Response body length after encoding: {} chars", body.len());

            // 解析 NGA 响应格式
            let parsed_data = parse_nga_response(&body);
            log::info!("NGA response parsing completed");

            // 提取扁平化的板块列表
            let forum_list = match parsed_data {
                Ok(value) => {
                    log::info!("Successfully parsed JSON, extracting forum list...");
                    Some(extract_forum_list(&value))
                }
                Err(e) => {
                    log::error!("Failed to parse NGA response: {}", e);
                    None
                }
            };

            // 构建成功响应
            let success_response = NgaResponse {
                success: status == 200,
                status,
                body,
                data: forum_list,
                error: None,
            };

            log::info!("=== Building response to return to frontend ===");
            log::info!("Response structure: success={}, status={}, forum_count={}, error={:?}",
                success_response.success,
                success_response.status,
                success_response.data.as_ref().map(|d| d.len()).unwrap_or(0),
                success_response.error
            );

            // 尝试序列化验证
            match serde_json::to_string(&success_response) {
                Ok(json) => {
                    log::info!("Response JSON serialization successful, length: {} bytes", json.len());
                    let json_preview = if json.chars().count() > 200 {
                        let safe_preview: String = json.chars().take(200).collect();
                        format!("{}...", safe_preview)
                    } else {
                        json.clone()
                    };
                    log::info!("JSON preview: {}", json_preview);
                }
                Err(e) => {
                    log::error!("Response JSON serialization failed: {}", e);
                }
            }

            log::info!("=== NGA HTTP Request End (Success) ===");
            Ok(success_response)
        }
        Err(e) => {
            log::error!("HTTP request failed: {}", e);
            let error_response = NgaResponse {
                success: false,
                status: 0,
                body: String::new(),
                data: None,
                error: Some(format!("Request failed: {}", e)),
            };
            log::info!("=== NGA HTTP Request End (Error) ===");
            log::info!("Returning error response: success={}, error={:?}", error_response.success, error_response.error);
            Ok(error_response)
        }
    }
}

/// 图片代理响应
#[derive(Clone, Serialize, Deserialize)]
pub struct ImageProxyResponse {
    pub success: bool,
    pub data_url: Option<String>,  // base64 编码的 data URL
    pub error: Option<String>,
}

/// 代理获取图片并返回 base64 编码
#[tauri::command]
pub async fn proxy_image(url: String) -> Result<ImageProxyResponse, String> {
    log::info!("=== Proxy Image Request Start ===");
    log::info!("URL: {}", url);

    // 构建 HTTP 客户端
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;

    // 发送请求，添加 Referer 头绕过防盗链
    let response = client
        .get(&url)
        .header("Referer", "https://bbs.nga.cn/")
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| {
            log::error!("Failed to fetch image: {}", e);
            format!("Failed to fetch image: {}", e)
        })?;

    let status = response.status().as_u16();
    log::info!("Received response with status: {}", status);

    if !response.status().is_success() {
        return Ok(ImageProxyResponse {
            success: false,
            data_url: None,
            error: Some(format!("HTTP {}", status)),
        });
    }

    // 读取图片字节
    let bytes = response.bytes().await
        .map_err(|e| {
            log::error!("Failed to read image bytes: {}", e);
            format!("Failed to read image: {}", e)
        })?;

    log::info!("Image size: {} bytes", bytes.len());

    // 检测 MIME 类型
    let mime_type = mime_guess::from_path(&url)
        .first()
        .map(|m| m.to_string())
        .unwrap_or_else(|| "image/png".to_string());

    // 转换为 base64
    let base64_data = base64::engine::general_purpose::STANDARD_NO_PAD.encode(&bytes);
    let data_url = format!("data:{};base64,{}", mime_type, base64_data);

    log::info!("=== Proxy Image Request End (Success) ===");
    Ok(ImageProxyResponse {
        success: true,
        data_url: Some(data_url),
        error: None,
    })
}
