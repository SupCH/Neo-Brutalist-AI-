@echo off
chcp 65001 >nul
title 博客服务启动器

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║              Neo-Brutalist 博客 一键启动                 ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM 设置项目路径
set PROJECT_PATH=D:\云端网页\风格个人博客

echo [1/2] 启动后端服务...
cd /d %PROJECT_PATH%\backend
start "Blog Backend" cmd /k "npm run dev"

echo [2/2] 启动前端服务...
timeout /t 3 /nobreak >nul
cd /d %PROJECT_PATH%\frontend
start "Blog Frontend" cmd /k "npm run dev"

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  ✓ 服务已启动！                                         ║
echo ║                                                          ║
echo ║  后端: http://localhost:5000                             ║
echo ║  前端: http://localhost:3000                             ║
echo ║                                                          ║
echo ║  关闭服务：关闭对应的命令行窗口即可                      ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
pause
