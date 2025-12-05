@echo off
chcp 65001 >nul
echo ==========================================
echo 正在扫描并关闭占用端口 3000 和 5000 的进程...
echo ==========================================

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host ('已终止进程 ID: ' + $_) }"

echo.
echo ==========================================
echo 所有操作已完成。
echo ==========================================
pause
