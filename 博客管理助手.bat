@echo off
cd /d "%~dp0"
node manage_blog.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 需要安装 Node.js 才能运行此脚本。
    echo 请访问 https://nodejs.org/ 下载安装。
    pause
)
