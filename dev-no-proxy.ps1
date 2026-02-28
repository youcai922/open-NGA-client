# 临时禁用代理并启动开发服务器
$env:ALL_PROXY=""
$env:all_proxy=""
$env:HTTP_PROXY=""
$env:HTTPS_PROXY=""
$env:http_proxy=""
$env:https_proxy=""
$env:NO_PROXY="*"
$env:no_proxy="*"

pnpm tauri dev
