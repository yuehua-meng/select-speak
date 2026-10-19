# Compatibility status

Target: Windows 10/11 x64. This table describes evidence, not a promise that every application supports selection extraction.

| Area | Current evidence | Still needed |
| --- | --- | --- |
| Native selection worker | Starts successfully in packaged Electron smoke tests | Native selection scenarios across applications |
| Kokoro CPU speech | Offline synthesis, voice, speed, cache, chunking and cancellation tests | Listening checks for names and ambiguous words |
| Packaged audio playback | Real playback completes in Electron smoke tests | Hardware and audio-device coverage |
| Companion | Original image loads, transparent background, scripted single/double-click animations, alpha hit-mask and position tests | Broader native mouse, display scaling and multi-monitor checks |
| Browser text selection | Implementation supports Windows accessibility and allowlisted clipboard fallback | Versioned Chrome, Edge and Firefox manual reports |
| Word and PDF readers | Targeted through accessibility and clipboard compatibility lists | Versioned manual reports; selectable and scanned PDFs separately |
| Markdown editors | Obsidian, Typora and Code are in the compatibility allowlist | Versioned manual reports |
| Fresh Windows computer | Portable bundle is provided | Independent clean-machine validation |
| macOS / Linux | Unsupported | Separate platform implementations |

## A useful manual test

1. Record Windows build, display scaling, application and version.
2. Start SelectSpeak and wait for Kokoro readiness.
3. In the target app, select `Curiosity opens the door to learning.`
4. Release the mouse and check that the speaker appears without taking focus.
5. Click the speaker, check the spoken text, then stop and select a different sentence.
6. Repeat with clipboard fallback disabled and enabled; record the difference.
7. Check companion click, double-click, drag and right-click controls separately.

Share the result through the [compatibility issue template](https://github.com/yuehua-meng/select-speak/issues/new?template=compatibility.yml). A partial failure is a useful report.
