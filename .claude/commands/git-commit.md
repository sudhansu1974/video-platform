# Quick Commit

Look at all staged and unstaged changes using `git diff` and `git diff --staged` and `git status`.

Analyze the code changes and generate a suitable conventional commit message in this format:
```
type(scope): short description
```

Types: feat, fix, refactor, chore, docs, style, test
Scope: the main area changed (auth, video, player, dashboard, admin, db, ui, etc.)

Stage all changes and commit with the generated message.

If there are multiple unrelated changes, make separate commits grouping related files together.

Show the final git log entry after committing.
