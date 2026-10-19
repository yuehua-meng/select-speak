# 取词朗读 · SelectSpeak

Windows 10/11 x64 的跨应用英文点读原型。选中英文、松开鼠标、点击小喇叭，即可使用本地 Kokoro 神经语音朗读。

<img src="src/ui/assets/blue-companion.png" width="220" alt="取词朗读的毛绒桌面伙伴小蓝">

## 使用

GitHub 仓库包含源码、测试及小蓝图片，不包含依赖、模型权重和打包产物。首次从源码运行，请先完成下方“开发”中的安装、模型下载步骤，再运行 `npm start`；需要双击启动时，先运行 `npm run pack`。

双击根目录的 **启动取词朗读.cmd**，或者运行 `release/win-unpacked/SelectSpeak.exe`。

等待工作台显示 **Kokoro 已就绪**。模型会在启动时加载并预热，之后可以离线使用，无需账号、API Key 或额外安装 Python。

在浏览器、Word、PDF 或 Markdown 编辑器中用鼠标选中英文，点击浮动喇叭朗读；再次点击停止。关闭工作台后继续在系统托盘运行；托盘菜单可暂停监听、停止播放或退出。

声音与偏好中可以选择：

- Heart / Bella：美音女声，默认 Heart。
- Michael：美音男声。
- Emma：英音女声。
- George：英音男声。
- 速度范围：0.60×～1.40×；速度、音色和应用兼容名单均可保存。

试听按钮朗读示例短句。运行 `npm run test:kokoro` 后，`samples/` 中会生成单词和英美音 WAV 样本，可直接播放比较。`examples/` 中有划词测试用的 HTML 和 Markdown。

## 桌面小蓝

启动后，毛茸茸的小蓝显示在桌面右下角，使用选定的透明 PNG 原图。

- 单击：摸摸头的晃动反馈；双击：开心跳跃。单击会等待 Windows 双击判定时间，避免双击先触发单击。
- 按住拖动：移动位置；透明空白区域允许鼠标点击下面的软件。
- 右键：朗读最近选区、停止、切换音色、暂停划词、调整大小、固定位置、休息、打开设置或隐藏。
- 隐藏后，从系统托盘右键菜单勾选“显示小蓝”即可恢复。
- 正在生成和播放语音时，小蓝会显示对应提示和动作。单击、双击只触发互动，不会自动朗读或打断当前语音。
- 大小、位置、固定和休息偏好保存在 `data/companion.json`；本版通过原图的整体移动与缩放实现动画。

## 本地模型与播放

- 模型：Kokoro-82M v1.0 ONNX，FP32 完整精度，CPU 推理。
- 模型文件约 326 MB，随打包程序分发。SHA-256：`8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb`。
- 模型先加载和预热，在独立进程中生成音频。重复片段使用最多 32 MiB 的内存缓存，不把选中文字和生成音频写入持久缓存。
- 长文本按句子和长度分段，最多提前生成两段。超出音素上下文时再次分段，避免静默截断。
- 停止播放会立即清空已排队音频；正在进行的模型计算可能仍需完成，但结果会被丢弃。
- 运行时关闭远程模型加载，并阻止推理进程的 fetch 网络请求。模型下载只在开发准备阶段进行。

## 已知边界

Kokoro 的英语音色适合英文。中英混合选区中的中文不保证准确；单词发音、专有名词及同形异音词仍需实际听辨，选中孤立单词时没有完整语境。音色自然度不等于每个单词一定正确。

取词依赖目标软件暴露的辅助功能接口；必要时只在允许名单内模拟复制。复制兼容模式会尝试恢复剪贴板，但可能影响剪贴板历史。终端和密码管理器默认排除；图片型 PDF、受保护内容或管理员窗口可能无法取词。

本版完成了原生监听启动、Kokoro 离线合成、缓存、分段、取消后重新合成和播放器集成测试；小蓝的图片加载、透明背景、单击/双击动画已通过 Electron 冒烟测试。尚未逐项完成所有 Word/PDF/Markdown 软件与版本的人工兼容验收。

## 开发

需要 Node.js 24 和 npm。使用锁文件安装依赖：

```powershell
git clone https://github.com/yuehua-meng/select-speak.git
cd select-speak
npm ci
npm run model:download
npm test
npm run test:kokoro
npm start
npm run pack
```

`model:download` 先尝试 Hugging Face，连接不可达时使用 hf-mirror.com，所有模型和配置按固定版本及校验值验证。也可通过 `HF_ENDPOINT` 指定下载源。程序运行时不会自动下载。

如果 Electron 下载失败且本机存在对应版本缓存，可使用 `node scripts/restore-electron-cache.cjs <缓存目录>`；脚本会核对 Electron 包自带的 SHA-256。

`npm run smoke` 启动真实 Electron 窗口、载入模型并播放一句英文，报告保存在 `work/smoke/`。这一步会发出声音。

## 打包与数据

可运行文件在 `release/win-unpacked/`，依赖、音色和模型都在其中。分享时复制整个目录，不能单独复制 exe。根目录保留源码、锁文件与下载脚本。

设置和不含选中文字的诊断日志保存在 `data/`。单独移动 win-unpacked 目录后，数据保存在该目录的 `data/` 下。

应用源码为 MIT；Kokoro 模型与 kokoro-js 为 Apache-2.0。第三方依赖及运行时各自保留其许可，详情见 THIRD_PARTY_NOTICES.md 和依赖目录。
