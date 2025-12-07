@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              初始化AI机器人 (仅需运行一次)                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [1/3] 检查环境...
if not exist backend (
    echo [错误] 未找到 backend 目录，请确认在项目根目录运行
    goto :error
)

echo [2/3] 进入后端目录...
cd backend

if not exist node_modules (
    echo [错误] 未找到 node_modules，请先运行: npm install
    goto :error
)

echo [3/3] 创建10个AI机器人...
echo.
npx tsx prisma/seed-ai-bots.ts

if %errorlevel% neq 0 (
    echo.
    echo [错误] 创建失败！错误代码: %errorlevel%
    echo.
    echo 可能的原因：
    echo   1. 数据库未初始化 - 请先运行: npm run db:migrate
    echo   2. 机器人已存在 - 可以忽略此错误
    echo   3. 权限问题 - 请以管理员身份运行
    goto :error
)

echo.
echo ✨ 完成！
echo.
echo 下一步：
echo   1. 在 backend\.env 中配置 DEEPSEEK_API_KEY
echo   2. 运行 "AI内容生成.bat" 生成帖子
echo.
goto :end

:error
echo.
echo ========================================
echo   初始化失败，请检查上述错误信息
echo ========================================
echo.

:end
pause
