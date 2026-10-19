# SelectSpeak launch copy / 中英文宣传包

Prepared 2026-10-20 (Asia/Shanghai). Status: **已准备 / Prepared. No posts published by this task.**

This file contains AI-assisted drafts and factual writing material. The creator must verify the final release, links, and actual demonstration before use. **Do not paste generated text into HN, r/opensource, or V2EX:** their current official rules restrict it. For those destinations, the creator should independently write the post from their own experience and the factual checklist below; light paraphrasing of these drafts is not a substitute. See [channel-checklist.md](./channel-checklist.md) for sources and channel-specific requirements.

## 1. Fact sheet / 事实卡

| Item | Approved factual description |
| --- | --- |
| Name | SelectSpeak |
| Source | https://github.com/yuehua-meng/select-speak |
| Purpose | An English selection-to-speech desktop tool for Windows, designed for use across applications. / 面向 Windows 的跨应用英文取词朗读工具。 |
| Target | Windows 10/11, x64. Do not imply macOS/Linux support. |
| Stack | Electron + TypeScript. |
| Speech | Kokoro-82M, fp32 CPU inference; offline speech synthesis. This does not by itself establish that every app component makes no network requests. |
| Desktop companion | A fluffy blue companion with large ears: single click to pet, double click to jump, drag to move, right click for its menu. |
| Version/license | v0.3.0; project source under MIT. Third-party models/dependencies retain their respective licenses. |
| Automated checks | Project handoff reports 11 passing tests. This copy task did not rerun them. Do not equate these tests with manual compatibility or performance certification. |
| Manual coverage | Full manual acceptance across Word, PDF readers, and Markdown software is still incomplete. Compatibility can vary by application, version, and document. |
| Release package | The launch plan is a Windows portable ZIP with the model included. Mention it as available only after the actual public asset is uploaded and verified. |

No claims about user counts, revenue, benchmarks, universal compatibility, zero latency, human-level voice quality, or a personal origin story are included. Public download size, CPU/RAM use, signing status, and exact timing must be measured separately before being quoted.

Stable links to use:

- Source and documentation: https://github.com/yuehua-meng/select-speak
- Releases entry point: https://github.com/yuehua-meng/select-speak/releases (verify the intended ZIP is visible before a launch post)
- Bug reports: https://github.com/yuehua-meng/select-speak/issues

The following publication drafts assume the verified ZIP is publicly downloadable. Until then, they remain preparation material and should not be used to announce availability.

## 2. English X post

SelectSpeak: offline English selection-to-speech for Windows 10/11 x64, with a fluffy blue desktop companion. Built with Electron + TypeScript and Kokoro-82M on CPU. Open source (MIT). Early testers welcome:
https://github.com/yuehua-meng/select-speak

Suggested attachment: a real screen recording of selecting English text, playing the actual synthesized audio, then petting or moving the companion. Do not present an illustration as a screenshot or simulated audio as live output.

## 3. Reddit English draft — r/SideProject

**Title:** I built SelectSpeak, an offline English selection-to-speech tool for Windows with a blue desktop companion

Hi everyone — I'm sharing SelectSpeak, a Windows desktop project that turns selected English text into speech.

The aim is to make it easier to hear English while staying in the application you're reading in. It's built with Electron and TypeScript. Speech synthesis runs locally on the CPU using Kokoro-82M; the Windows portable ZIP includes the model.

There's also a fluffy blue desktop companion with large ears. You can pet it with a click, make it jump with a double click, drag it around, or open its menu with a right click.

The current version is v0.3.0, and the project source is MIT-licensed. The target is Windows 10/11 x64. Manual testing across Word, PDF readers, and Markdown applications isn't complete yet, so I can't promise every selection workflow will work in every app.

I'd appreciate practical feedback on selection capture and the reading workflow. If you try it, a report with your Windows version, application name/version, and steps to reproduce any problem would help. Please use non-sensitive sample text in public reports.

Source and downloads: https://github.com/yuehua-meng/select-speak

### r/opensource adaptation brief — creator must independently write

Do not reuse the generated Reddit draft in r/opensource. Its rule 3 calls AI-generated content ban-worthy. If the creator decides to post a personally written account there, use the `Promotional` flair, link directly to the source, identify their role in the project, and explain the implementation and remaining compatibility work. Verify that the public repository contains its MIT `LICENSE` file. Discuss technical tradeoffs the creator can personally substantiate. Do not invent a rationale for choosing Electron, CPU inference, or the companion design.

## 4. Show HN title and first-comment reference — not a paste-ready submission

HN currently prohibits generated and AI-edited posts/comments. The following is **reference material only**. The creator must independently write the final title and comment. The creator must also have personally worked on the project and be available to discuss it.

**Title reference:** Show HN: SelectSpeak – Offline English selection-to-speech for Windows

**First-comment reference:**

SelectSpeak is a Windows 10/11 x64 desktop tool for reading selected English text aloud. It uses Electron and TypeScript, with Kokoro-82M running locally on the CPU for speech synthesis.

The portable ZIP includes the model. There's also a small blue desktop companion: click to pet it, double click to make it jump, drag to move it, and right click for the menu.

The current version is v0.3.0 and the source is MIT-licensed. Manual testing across Word, PDF readers, and Markdown applications is still incomplete. I'm interested in concrete reports about selection capture and the listening workflow, including application versions and reproducible cases.

Source and releases: https://github.com/yuehua-meng/select-speak

**Before the creator writes:** add their actual motivation and one implementation tradeoff they can explain. A product description cannot supply a personal story. Submit a directly useful repository/release link with accessible runnable software; a landing page or video alone is insufficient for this software Show HN. Do not frame this as merely “v0.3.0 is out”; ordinary version updates are generally not substantive enough. Do not solicit votes, coordinated comments, or resubmissions.

## 5. 中文长帖 — 掘金候选稿；V2EX 仅事实参考

V2EX 官方明确要求不要发送 AI 生成的内容，因此本节不可直接发布到 V2EX。作者如要在“分享创造”发帖，应根据真实使用和开发经历独立撰写；建议缩短为问题、功能、限制、源码链接四部分。掘金稿也需作者核对事实及发布界面的当期规则。

**标题：** 开源一个 Windows 英文取词朗读工具 SelectSpeak，带一只蓝色桌面伙伴

SelectSpeak 是一个面向 Windows 10/11 x64 的英文取词朗读桌面工具。它想解决的事情很具体：阅读英文时，让选中的文字可以被读出来，减少在当前软件和朗读工具之间切换的操作。

项目使用 Electron 和 TypeScript，语音合成采用 Kokoro-82M，在 CPU 上以 fp32 运行。Windows 便携 ZIP 包含模型，解压后的本地语音合成不依赖云端 TTS 服务。这里的“离线”指语音合成方式，不能据此推断所有应用组件都不会访问网络。

除了朗读，桌面上还有一只毛茸茸、长着大耳朵的蓝色伙伴。单击可以摸头，双击会跳跃，可以拖动它换个位置，也可以用右键菜单进行操作。它是这个工具的一部分；是否适合自己的阅读习惯，欢迎实际试一试。

当前版本为 v0.3.0，项目源码采用 MIT 许可证。需要说明的是，跨应用取词的实际表现还需要更多人工验证。Word、不同 PDF 阅读器和 Markdown 软件的完整兼容验收尚未完成，我暂时不会把某一类文件或某一款软件写成“全部支持”。自动测试通过也不能代替这些真实软件里的验证。

如果你有 Windows 10/11 x64 设备，欢迎试用，并反馈两个方面：一是所在软件里能否按预期取得英文选区，二是从选中到听到内容的操作是否顺手。遇到问题时，请尽量提供 Windows 版本、软件名称和版本、复现步骤，以及可以公开的非敏感示例文本。有关声音的主观感受也欢迎直接描述，不需要把它评成“真人音质”。

源码、使用说明和发布入口：
https://github.com/yuehua-meng/select-speak

问题反馈：
https://github.com/yuehua-meng/select-speak/issues

### V2EX 作者独立写作提纲

1. 用自己的话说清实际想解决的英文阅读问题；没有真实经历就不写经历。
2. 介绍 Windows x64、英文取词朗读、本地 CPU 语音与蓝色伙伴四个事实。
3. 明确软件兼容性人工验收尚未完成；给真实录屏和可试用的软件入口。
4. 附源码与许可证，提出一两个具体反馈问题；发到“分享创造”，避免长篇广告和重复顶帖。

## 6. English long-form version

**Title:** SelectSpeak: an open-source English selection-to-speech desktop tool for Windows

SelectSpeak is a Windows 10/11 x64 desktop project for reading selected English text aloud. Its focus is the small step between reading something on screen and hearing it spoken, with a workflow designed to work across applications.

The app uses Electron and TypeScript. Speech synthesis is handled locally by Kokoro-82M using fp32 CPU inference. The Windows portable ZIP includes the model, so local speech synthesis doesn't require a cloud TTS service. This describes the synthesis path; it isn't a blanket statement about every component's network behavior.

SelectSpeak also includes a fluffy blue desktop companion with large ears. A single click pets it, a double click makes it jump, dragging moves it, and a right click opens its menu. The companion provides a small interactive presence alongside the reading tool.

The current version is v0.3.0. The project source is available under the MIT license, while third-party dependencies and models keep their own licenses.

This is an early release. Full manual acceptance testing across Word, PDF readers, and Markdown applications is still unfinished. Selection behavior can vary between applications and versions, and the project doesn't claim universal compatibility. There are also no published latency or voice-quality benchmarks in this announcement.

Feedback from actual Windows workflows would be useful: Can the tool capture the English selection in your application? Is the path from selecting text to listening clear? If something fails, please include your Windows version, the application's name and version, reproducible steps, and a non-sensitive text sample. Reports about where the workflow is confusing are useful alongside bug reports.

Source, documentation, and release entry point:
https://github.com/yuehua-meng/select-speak

Issue tracker:
https://github.com/yuehua-meng/select-speak/issues

## 7. B站短视频脚本 — 约 45 秒，时长为剪辑计划

**标题：** 选中英文，听它读出来：开源 Windows 小工具 SelectSpeak

| 时间 | 真实录屏内容 | 口播 / 字幕 |
| --- | --- | --- |
| 0–5 秒 | 展示桌面、英文示例和实际选区 | 这是 SelectSpeak，一个 Windows 英文取词朗读小工具。 |
| 5–18 秒 | 完整演示实际触发动作；保留原始生成和播放过程 | 在经过演示验证的软件里选中英文，再按画面里的实际操作触发朗读。接下来听到的是程序的真实输出。 |
| 18–25 秒 | 保留原声，字幕标出示例软件及版本 | 语音采用 Kokoro-82M，在本地 CPU 上合成。 |
| 25–34 秒 | 单击摸头、双击跳跃、拖动、打开右键菜单 | 旁边这只蓝色大耳朵伙伴，还可以摸头、跳跃、拖动和打开菜单。 |
| 34–45 秒 | 项目仓库与版本页面的实际画面 | 项目开源，面向 Windows 10/11 x64。Word、PDF 和 Markdown 软件的完整兼容验收还没做完，欢迎带着软件版本来反馈。源码入口见简介。 |

**简介：** SelectSpeak v0.3.0，Windows 10/11 x64 英文取词朗读工具。Electron + TypeScript，Kokoro-82M 本地 CPU 语音合成，项目源码 MIT。兼容性人工验收仍在进行。源码及发布入口：https://github.com/yuehua-meng/select-speak 。反馈时请附系统、软件版本和复现步骤。

拍摄要求：保留一次连续的真实操作和实际语音；如有剪辑或倍速，在画面上标记，不用剪辑制造“零延迟”。仅展示实际验证过的软件，不用 Word/PDF/MD 图标拼成“全部兼容”画面。录屏未完成前，本脚本只能标为已准备。

## 8. 小红书短视频脚本 — 约 25–35 秒，时长为剪辑计划

**标题：** 这只蓝色桌面伙伴，还会读英文

**封面字：** Windows 英文取词朗读 / SelectSpeak

**口播：**

这只蓝色大耳朵伙伴，除了能摸头和跳跃，还带着一个英文取词朗读工具。它叫 SelectSpeak，面向 Windows 10 和 11 的 x64 电脑。这里选中一段英文，按实际操作触发，听到的就是它本地合成的声音。它用 Kokoro-82M 在 CPU 上运行，源码开放。现在还是早期版本，不同软件里的兼容性还在验证。想试的话，项目入口放在简介，欢迎反馈你用的软件和遇到的问题。

**画面顺序：** 蓝色伙伴近景 → 真实英文选区 → 实际触发和原声朗读 → 摸头/跳跃/拖动 → Windows x64 与兼容性说明 → 仓库入口。

**配文：** 一个带蓝色桌面伙伴的 Windows 英文朗读小工具。v0.3.0，项目源码 MIT，语音在本地 CPU 合成。不同软件中的兼容性仍需实际验证，欢迎试用反馈。项目：github.com/yuehua-meng/select-speak

**可选标签：** #开源项目 #Windows软件 #英语阅读 #桌面伙伴

外链的展示方式以发布界面实际允许的功能为准；此任务没有核实 B站、小红书或掘金的完整当期平台规则，也没有上传或发布任何内容。
