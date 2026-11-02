# OpenCodex Mobile Layout V1（实验性）

本分支只在 **视口宽度不超过 820px 且主指针是触摸设备** 时启用移动端布局。桌面版 Codex/ChatGPT Renderer、Gateway 协议和官方业务组件仍按原样运行。

## 变更范围

- 顶部桌面菜单区域：隐藏 `header[data-app-shell-header-edge-scroll]`。
- 左侧功能图标栏：不克隆 React 节点，直接将原 DOM 转为悬浮菜单；点击左上角四宫格按钮展开，点击外部收起。
- 项目和历史会话列表：原 `.app-shell-left-panel` 转为浮层，使用 GPU `translate3d` 控制位置。开启时有半透明背景，不减少聊天区宽度。
- 手势：关闭时从左侧区域右滑打开，打开时从抽屉内部左滑关闭；纵向手势不拦截。
- 已有的 `mobile-sidebar-auto-collapse` 插件负责关闭抽屉，而不再触发官方 React Toggle 导致组件卸载。

## 与官方版本的关系

该模块需要官方 Renderer 仍具有 `.app-shell-left-panel`，以及可以识别的左侧功能轨道。优先使用 `data-app-shell-nav-rail` 等语义属性；如果不存在，会尝试查找左边缘窄而高、拥有至少四个操作图标的元素。

若找不到功能轨道，悬浮按钮不会出现，以免点击一个无功能按钮。若完全找不到官方会话列表，不应认定手势生效。新版 ChatGPT Desktop 的具体 DOM 需要在真实设备上验收。

## 本地开发验证

```powershell
git switch feat/mobile-immersive-layout-v1
pnpm install
pnpm run build
node --test gateway/test/mobile-immersive-layout.test.cjs
pnpm test
pnpm run launcher:dev
```

Windows 安装包（从开发机自行构建）：

```powershell
pnpm run launcher:dist:win
```

## 手机实际验收清单

- Windows 桌面宽屏：顶部菜单、左功能栏、项目列表仍按原版正常显示。
- Android Chrome / WebView 竖屏：顶部桌面菜单不占高度，原侧功能栏不占宽度，主聊天区全宽。
- 点击四宫格按钮：原图标全部展开，原功能照常执行；点击外部收起。
- 左侧右滑：项目/会话抽屉从左侧覆盖聊天区；聊天内容和输入框不被压缩。
- 抽屉内部左滑、点遮罩、选择会话、新建会话：抽屉能关闭。
- 快速纵向滚动项目列表：不会被误认为横向滑动或启动拖拽。
- 连续切换会话 30 次、切换横竖屏、刷新页面：不会出现空白抽屉、菜单残留、重复按钮或卡顿恶化。
- 断线重连后：Gateway/IPC 和官方会话状态正常。

**目前还没有完成真实 ChatGPT Desktop + Android 设备验收；此分支保留为 Draft PR，测试通过前不要合并。**
