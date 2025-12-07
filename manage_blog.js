const readline = require('readline');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI Color Codes
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function clearScreen() {
    process.stdout.write('\x1b[2J\x1b[0f');
}

function drawBanner() {
    clearScreen();
    console.log(colors.cyan + `
  ███╗   ██╗███████╗ ██████╗       ██████╗ ██╗      ██████╗  ██████╗ 
  ████╗  ██║██╔════╝██╔═══██╗      ██╔══██╗██║     ██╔═══██╗██╔════╝ 
  ██╔██╗ ██║█████╗  ██║   ██║█████╗██████╔╝██║     ██║   ██║██║  ███╗
  ██║╚██╗██║██╔══╝  ██║   ██║╚════╝██╔══██╗██║     ██║   ██║██║   ██║
  ██║ ╚████║███████╗╚██████╔╝      ██████╔╝███████╗╚██████╔╝╚██████╔╝
  ╚═╝  ╚═══╝╚══════╝ ╚═════╝       ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝ 
` + colors.reset);
    console.log(colors.bright + colors.green + "  ╔════════════════════════════════════════════════════════════════╗");
    console.log("  ║                    博客系统管理助手 v3.0 (Node.js)             ║");
    console.log("  ╚════════════════════════════════════════════════════════════════╝" + colors.reset + "\n");
}

function drawMenu() {
    console.log(colors.yellow + "  [1] " + colors.reset + "🚀 启动生产模式 (构建 + 启动)");
    console.log(colors.yellow + "  [2] " + colors.reset + "🔧 启动开发模式 (热重载)");
    console.log(colors.yellow + "  [3] " + colors.reset + "📦 仅构建前端");
    console.log(colors.yellow + "  [4] " + colors.reset + "🧪 运行自动化测试");
    console.log(colors.yellow + "  [5] " + colors.reset + "🖥️  启动测试控制台 (Web UI)");
    console.log(colors.yellow + "  [6] " + colors.reset + "🛑 停止所有服务");
    console.log("");
    console.log(colors.dim + "  [0] 退出" + colors.reset);
    console.log("");
}

function runCommand(command, args, cwd, title) {
    return new Promise((resolve, reject) => {
        console.log(colors.cyan + `\n  >>> 正在执行: ${title} ...` + colors.reset + "\n");

        // On Windows, use npm.cmd
        const cmd = process.platform === 'win32' ? `${command}.cmd` : command;

        const child = spawn(cmd, args, {
            cwd: cwd,
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            resolve(code);
        });

        child.on('error', (err) => {
            console.error(colors.red + "Error: " + err.message + colors.reset);
            resolve(1);
        });
    });
}

function openTerminal(command, cwd, title) {
    console.log(colors.green + `  >>> 在新窗口启动: ${title}` + colors.reset);
    if (process.platform === 'win32') {
        const cmd = `start "${title}" cmd /k "cd /d ${cwd} && ${command}"`;
        execSync(cmd);
    } else {
        console.log(colors.red + "  仅支持 Windows 开启新窗口" + colors.reset);
    }
}

async function handleOption(option) {
    const rootDir = __dirname;
    const frontendDir = path.join(rootDir, 'frontend');
    const backendDir = path.join(rootDir, 'backend');

    switch (option.trim()) {
        case '1': // 生产模式
            console.log(colors.cyan + "\n  [1/3] 构建前端..." + colors.reset);
            await runCommand('npm', ['run', 'build'], frontendDir, 'Frontend Build');
            console.log(colors.cyan + "\n  [2/3] 启动后端..." + colors.reset);
            openTerminal('npm run dev', backendDir, 'Blog Backend Production');
            console.log(colors.green + "\n  [3/3] 服务已启动！" + colors.reset);
            console.log(colors.cyan + "  >>> 正在打开浏览器..." + colors.reset);
            // 延迟3秒后打开浏览器，确保服务已启动
            setTimeout(() => {
                try {
                    execSync('start https://blog.crazzy.cn', { stdio: 'ignore' });
                    console.log(colors.green + "  >>> 已打开 https://blog.crazzy.cn" + colors.reset);
                } catch (e) {
                    console.log(colors.yellow + "  >>> 无法自动打开浏览器，请手动访问 https://blog.crazzy.cn" + colors.reset);
                }
            }, 3000);
            break;

        case '2': // 开发模式
            console.log(colors.cyan + "\n  [1/2] 启动后端..." + colors.reset);
            openTerminal('npm run dev', backendDir, 'Blog Backend Dev');
            console.log(colors.cyan + "\n  [2/2] 启动前端..." + colors.reset);
            setTimeout(() => {
                openTerminal('npm run dev', frontendDir, 'Blog Frontend Dev');
                console.log(colors.green + "\n  >>> 开发环境已就绪！" + colors.reset);
            }, 2000);
            break;

        case '3': // 构建前端
            await runCommand('npm', ['run', 'build'], frontendDir, 'Frontend Build');
            console.log(colors.green + "\n  >>> 构建完成！" + colors.reset);
            break;

        case '4': // 运行测试
            console.log(colors.cyan + "\n  [1/2] 后端测试..." + colors.reset);
            await runCommand('npm', ['test'], backendDir, 'Backend Tests');
            console.log(colors.cyan + "\n  [2/2] 前端测试..." + colors.reset);
            await runCommand('npx', ['vitest', 'run'], frontendDir, 'Frontend Tests');
            break;

        case '5': // 测试 UI
            console.log(colors.cyan + "\n  [1/3] 准备数据库..." + colors.reset);
            await runCommand('npm', ['run', 'pretest'], backendDir, 'DB Prep');
            console.log(colors.cyan + "\n  [2/3] 启动后端 UI..." + colors.reset);
            openTerminal('npm run test:ui', backendDir, 'Backend Test UI');
            console.log(colors.cyan + "\n  [3/3] 启动前端 UI..." + colors.reset);
            openTerminal('npm run test:ui -- --port 51205', frontendDir, 'Frontend Test UI');
            break;

        case '6': // 停止服务
            console.log(colors.red + "\n  >>> 正在停止所有 Node.js 进程..." + colors.reset);
            try {
                execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' });
            } catch (e) {
                // Ignore error if no process found
            }
            console.log(colors.green + "  >>> 服务已停止。" + colors.reset);
            break;

        case '0':
            console.log(colors.magenta + "\n  👋 再见！" + colors.reset);
            process.exit(0);
            break;

        default:
            console.log(colors.red + "\n  无效选项，请重试。" + colors.reset);
            break;
    }

    // Pause before showing menu again
    if (option.trim() !== '0') {
        rl.question(colors.dim + "\n  按回车键返回菜单..." + colors.reset, () => {
            promptMenu();
        });
    }
}

function promptMenu() {
    drawBanner();
    drawMenu();
    rl.question(colors.bright + "  请选择操作 [0-6]: " + colors.reset, (answer) => {
        handleOption(answer);
    });
}

// Check for arguments (e.g., instant start)
const args = process.argv.slice(2);
if (args.includes('--start-prod')) {
    handleOption('1');
} else {
    promptMenu();
}
