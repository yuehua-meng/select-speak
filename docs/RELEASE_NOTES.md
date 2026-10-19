# v0.3.0 — First public preview

SelectSpeak is a Windows companion for selected English read-aloud with local Kokoro CPU speech and a fluffy blue desktop character.

## Downloads

- `SelectSpeak-0.3.0-windows-x64.zip`: portable Windows x64 build with Electron, native dependencies and the pinned offline model. Extract the complete folder; run `SelectSpeak.exe`.
- `SHA256SUMS.txt`: hashes for release downloads.
- `SelectSpeak-companion-preview.mp4`: companion animation preview with an actual Kokoro audio sample. Interactions in the animation are scripted; this is not a native cross-application compatibility demonstration.

The runtime user interface is primarily Simplified Chinese. A bilingual quick-start guide is included. No Node.js, Python, GPU or API key is required to run the packaged application.

## Verification

The development suite covers text filtering, settings, monitor-bound placement, speech chunking/cache/speed, playback cancellation and companion alpha hit testing. Electron smoke tests load the packaged model, play real audio and check companion rendering and scripted interactions.

A separate extraction test runs the ZIP build from a new directory with fresh application data. This is packaging validation on the development computer; it does not replace an independent clean Windows computer test.

## Known limits

This is an unsigned preview. Windows x64 only. Selection extraction depends on the host application and document; full Word/PDF/Markdown compatibility has not been validated. Scanned or protected documents and elevated windows may not work. Clipboard fallback can affect clipboard history. English voices are intended for English. See [compatibility details](COMPATIBILITY.md).

Application source is MIT. Model and dependency licenses are retained in the bundle and listed in `THIRD_PARTY_NOTICES.md`.
