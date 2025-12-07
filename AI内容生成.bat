@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    AI虚拟社区内容生成工具                      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [1/3] 检查环境...
cd backend
if not exist node_modules (
    echo [错误] 未找到 node_modules，请先运行 npm install
    pause
    exit /b 1
)

echo [2/3] 开始生成AI内容...
echo.
npm run ai:generate

echo.
echo [3/3] 完成！
echo.
echo 提示：
echo   - 访问 http://localhost:5000/api/ai-posts/hot 查看热榜
echo   - 访问 http://localhost:5173/ai-community 查看前端
echo.

pause
