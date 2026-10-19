# Contributing to SelectSpeak

Thanks for trying this early Windows preview. Small, reproducible reports are useful contributions.

## Report a bug or compatibility result

Use the issue templates. Include Windows version, application name/version, a public sample sentence, expected behavior and what happened. Distinguish selectable text from scanned images. Mention whether clipboard fallback was enabled and whether the target application was elevated.

Avoid including private document content, clipboard history, personal paths or credentials. For logs, share only relevant lines after reviewing them.

## Develop

Use Windows x64 and Node.js 24. Follow the README setup and run `npm test` before submitting changes. Run model download and `npm run test:kokoro` for changes to synthesis. Changes to Electron windows, native selection or audio playback also need `npm run smoke` and a description of manual checks performed.

Open a focused pull request describing the user-visible problem, the change and validation. Keep generated builds, model weights and personal settings out of commits.

## Areas where help is welcome

- English UI localization, keeping existing Chinese labels available.
- Documented Word, PDF-reader, Markdown-editor and browser compatibility results.
- Portable-build testing on Windows computers without a development environment.
- Reproducible accessibility or playback problems.

## Communication

Be specific and respectful. Identify automated test results separately from manual validation. Only claim application support that was actually tested.
