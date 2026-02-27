use serde::{Deserialize, Serialize};
use encoding_rs::GBK;

#[derive(Clone, Serialize, Deserialize)]
pub struct NgaRequest {
    pub url: String,
    pub cookie: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct NgaResponse {
    pub success: bool,
    pub status: u16,
    pub body: String,
    pub error: Option<String>,
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

/// 使用 Rust 端发送 HTTP 请求，避免 Tauri HTTP 插件的问题
#[tauri::command]
pub async fn nga_http_request(request: NgaRequest) -> Result<NgaResponse, String> {
    log::info!("NGA HTTP Request: {}", request.url);
    log::info!("Cookie length: {}", request.cookie.len());

    // 构建 HTTP 客户端
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;

    // 发送请求
    let response = client
        .get(&request.url)
        .header("Cookie", &request.cookie)
        .send()
        .await;

    match response {
        Ok(resp) => {
            let status = resp.status().as_u16();
            log::info!("Response status: {}", status);

            // 获取响应体（原始字节）
            let body_bytes = match resp.bytes().await {
                Ok(bytes) => bytes.to_vec(),
                Err(e) => {
                    log::error!("Failed to read response body: {}", e);
                    return Ok(NgaResponse {
                        success: false,
                        status,
                        body: String::new(),
                        error: Some(format!("Failed to read body: {}", e)),
                    });
                }
            };

            // 转换编码（GBK -> UTF-8）
            let body = convert_encoding(&body_bytes);

            log::info!("Response body length: {}", body.len());

            // 打印响应体预览（前500个字符）
            let preview = if body.len() > 500 {
                format!("{}...", &body[..500])
            } else {
                body.clone()
            };
            log::info!("Response body preview:\n{}", preview);

            Ok(NgaResponse {
                success: status == 200,
                status,
                body,
                error: None,
            })
        }
        Err(e) => {
            log::error!("Request failed: {}", e);
            Ok(NgaResponse {
                success: false,
                status: 0,
                body: String::new(),
                error: Some(format!("Request failed: {}", e)),
            })
        }
    }
}
