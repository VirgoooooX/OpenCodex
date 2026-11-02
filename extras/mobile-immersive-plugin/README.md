# Mobile Immersive Layout V1 — OpenCodex 外部插件

独立的 OpenCodex v2 ESM 插件，不需要修改已安装 Release 的 Gateway、Electron Runner 或官方 Renderer 资源。

## 安装到现有 Release（Windows）

插件根目录与插件目录是两层：

```text
C:\Users\lonel\OpenCodex-Plugins\          ← 在 Launcher 选择这个根目录
  mobile-immersive\
    plugin.json
    dist\index.mjs
```

1. 将本目录下的 `mobile-immersive` 文件夹复制到一个**独立**的外部插件根目录（示例为 `C:\Users\lonel\OpenCodex-Plugins`）。
2. OpenCodex Launcher → 外部插件目录，选择**根目录** `C:\Users\lonel\OpenCodex-Plugins`，不要选择 `mobile-immersive` 子目录。
3. Launcher 重启 Gateway 后，在 OpenCodex 设置中确认 **沉浸式移动端布局** 插件已启用。
4. 手机上访问现有 OpenCodex URL。仅对宽度不超过 820px 且 `pointer: coarse` 的设备启用；桌面不调整。
5. 如果原版内置的「移动端侧栏优化」与新抽屉的关闭行为冲突，可在插件设置中关闭那个内置增强。

## 交互

- 原生左侧导航保留真实 DOM 和点击事件；手机端用左上角四格按钮展开/收起，点击外面关闭。
- 会话列表作为覆盖层；聊天区域不因抽屉打开而缩窄。
- 从聊天左侧向右划打开会话抽屉；在抽屉里向左划关闭；点击遮罩或选中会话关闭。
- 纵向滚动通过方向锁避免误触；位移由 `transform:translate3d` + `requestAnimationFrame` 驱动。
- SDK 负责功能按钮的挂载和插件开关；其余手势监听仅在按钮处于激活状态时安装，停用时清理 CSS、遮罩、监听器和 DOM 标记。

## 兼容边界

OpenCodex v2 的公开 SDK 暂不直接支持触摸手势和任意 CSS 生命周期，因此本插件在 SDK 声明式按钮之外使用了**可信 ESM 的浏览器 DOM API**。这不是隔离沙箱，属于实验性 UI 扩展；不写入任何 Codex 账号或会话数据。

当前版本针对既有 `.app-shell-left-panel`、`[data-app-shell-nav-rail]` 和其它官方 Renderer 选择器。若新版 Codex 调整 DOM，导航检测可能退化；需在真实设备检查后修订选择器。

## 验证状态（2026-11-02）

- 本机 `node --check dist/index.mjs`：通过
- 经 Gateway 源码 `listPluginEntries()` 验证插件 manifest 和 ESM 入口能被发现：通过
- 独立 Chrome 移动端/桌面端模拟测试：9/9 通过（含按钮、浮动菜单、手势、遮罩、关闭清理、桌面隔离）
- **未通过完整 Release + 手机端联调**：当前机器上的 Gateway 冷启动（包括未配置插件的原版 Release）仍以 `code=0` 提前退出。请先修复该问题后再启用插件测试。

## 撤销

从 Launcher 清空外部插件目录设置并重启 Gateway；插件文件不影响原版。必要时再删除外部插件目录下的 `mobile-immersive` 文件夹。

原始注入式 UI 原型仍保存在原来的 `feat/mobile-immersive-layout-v1` 分支，本插件分支与它完全独立。
