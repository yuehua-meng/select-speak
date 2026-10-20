# One curated-list candidate / 单一精选列表候选

Checked 2026-10-20. Status: **已准备；未提交、未创建 PR、未发送消息。**

Repository: [StaryMoon/awesome-desktop-pets](https://github.com/StaryMoon/awesome-desktop-pets).

## Fit and evidence

The official README explicitly invites project additions through a PR that changes both `catalog.json` and the README. It asks for the project URL, platform/framework, distinguishing note, and project type. It prefers maintained projects with readable setup instructions. Its stated scope includes productivity pets and desktop widgets. No Star minimum, project-age threshold, or required release maturity is stated in the README. [Official README: Add a Project](https://github.com/StaryMoon/awesome-desktop-pets#add-a-project).

The best section is **Catalog → Productivity Widgets with Pet Energy**, whose table is `Project | Stack | Notes`. This fits SelectSpeak as a reading utility with an interactive desktop pet, without labeling it a conversational AI companion. [Exact section](https://github.com/StaryMoon/awesome-desktop-pets#productivity-widgets-with-pet-energy).

**Assessment: suitable in scope, pending complete submission-rule verification.** The public v0.3.0 Windows release, readable setup instructions, and MIT source would support this kind of entry. An early Windows-only project is not excluded by the README. Inclusion remains the maintainer's decision.

Verification limit: the repository advertises a [CONTRIBUTING.md](https://github.com/StaryMoon/awesome-desktop-pets/blob/main/CONTRIBUTING.md), but the web reader returned cache misses for that file and [catalog.json](https://github.com/StaryMoon/awesome-desktop-pets/blob/main/catalog.json), including their official raw URLs. I could read the complete official README. I cannot certify that additional rules or catalog schema impose no other conditions. **This is a promising candidate, not a fully cleared submission target.** Read those two files before preparing any actual PR; do not invent the JSON schema or claim an acceptance guarantee.

## Proposed one-sentence description

Windows English selection-to-speech app with local Kokoro CPU synthesis and an interactive blue desktop companion.

## Proposed README row

```markdown
| [SelectSpeak](https://github.com/yuehua-meng/select-speak) | Electron / TypeScript | Windows English selection-to-speech app with local Kokoro CPU synthesis and an interactive blue desktop companion. |
```

The existing table uses a linked project name, a concise stack, and a short factual note. Do not add a Quick Picks endorsement, rewrite other entries, or claim cross-platform support. The corresponding `catalog.json` change must follow the actual upstream schema after it has been read.

## Final verification by the publishing agent

The official CONTRIBUTING.md and catalog.json were subsequently fetched through GitHub's API. They require a working project URL, readable setup instructions, visible companion/overlay behavior, a short distinguishing note, and updating both README.md and catalog.json. SelectSpeak's submission meets those documented conditions.

The two-file patch passed the list's own validator: `validated 22 catalog entries`.

Submitted PR: https://github.com/StaryMoon/awesome-desktop-pets/pull/3

Status at publication: OPEN, awaiting maintainer review; no claim of inclusion or endorsement.
