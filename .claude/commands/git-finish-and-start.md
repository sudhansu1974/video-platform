# Finish Current Feature & Start New Branch

Commit any staged and unstaged changes in the current branch with a suitable commit message based on the code changes. Use conventional commit format: type(scope): description.

Then merge the current branch into the `$1` branch and resolve any merge conflicts.

Then create and checkout a new branch called `$2`.

Steps:
1. Run `git status` to see what changed
2. Run `git diff` and `git diff --staged` to understand the changes
3. Stage all changes with `git add .`
4. Commit with an appropriate conventional commit message
5. Switch to `$1` branch: `git checkout $1`
6. Merge the previous branch: `git merge <previous-branch>`
7. If there are conflicts, resolve them intelligently based on the code context
8. Create and switch to the new branch: `git checkout -b $2`
9. Confirm the new branch is active with `git branch --show-current`
