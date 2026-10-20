# Public launch status

Recorded on 2026-10-20 (Asia/Shanghai). Publication status is separate from social-post drafts and from growth outcomes.

| Item | Status | Evidence |
| --- | --- | --- |
| Public product page, English/Chinese | Published | https://select-speak.able-petal-4207.chatgpt.site/ |
| Windows x64 portable preview, model included | Published | https://github.com/yuehua-meng/select-speak/releases/tag/v0.3.0 |
| Companion preview video with actual Kokoro audio | Published | https://github.com/yuehua-meng/select-speak/releases/download/v0.3.0/SelectSpeak-companion-preview.mp4 |
| English README, Chinese README, GIF, poster, audio and contribution guides | Published | https://github.com/yuehua-meng/select-speak |
| Repository English description, topics and product-page link | Applied | Repository About section |
| Bilingual launch announcement | Published | https://github.com/yuehua-meng/select-speak/discussions/1 |
| English UI contribution task | Published | https://github.com/yuehua-meng/select-speak/issues/2 |
| Versioned compatibility testing task | Published | https://github.com/yuehua-meng/select-speak/issues/3 |
| Desktop-pet curated-index submission | PR submitted; not merged | https://github.com/StaryMoon/awesome-desktop-pets/pull/3 |
| Windows CI | Passed for launch commit | https://github.com/yuehua-meng/select-speak/actions/runs/39302166411 |
| GitHub custom social-preview setting | Not applied; browser file upload failed | Poster is available at docs/media/social-preview.png; the public product page has Open Graph metadata using it |
| X / Reddit posting | Not posted | User chose to skip social-account login this round |
| HN / r/opensource / V2EX | Facts and channel notes only; not posted | Current official rules restrict AI-generated submissions; see channel-checklist.md |
| Other social/video channels | Drafts prepared; not posted | See press-kit.md; no social account was connected for publication |

## Verification

- All 11 development tests passed.
- The Windows ZIP was extracted into a new directory and launched with fresh application data. Native listener startup, offline Kokoro playback and scripted companion checks passed. This test used the development computer, not an independent clean machine.
- Desktop and 390px mobile page layouts, English/Chinese switching and the web pet interaction were checked. The page is an interactive product preview, not a browser version of the native reader.
- Product page and public checksum download returned HTTP 200. GitHub release asset digests match local SHA-256 values.
- The portable ZIP is 605,385,624 bytes. Runtime and offline model are included.
- Stars observed at the final check: 0. No growth, installs, endorsements or adoption were invented.

## Assets and source

The original mascot PNG remains unchanged. Banner and animation layouts are code-rendered; the animation preview labels its scripted interactions. Website source is mirrored under website/. Public release binaries, local user data and model weights remain excluded from Git source history.

The app remains Windows-only with a primarily Simplified Chinese UI. Word/PDF/Markdown support varies; no universal compatibility claim is made.
