# Git Configuration Fix

## Issue
The git repository was configured with a restricted fetch refspec that only fetched the `copilot/update-git-configuration` branch:

```
fetch = +refs/heads/copilot/update-git-configuration:refs/remotes/origin/copilot/update-git-configuration
```

This prevented the repository from fetching other branches from the remote, limiting the ability to:
- View all available branches
- Checkout other branches
- Track changes across the repository

## Solution
Updated the fetch refspec to the standard git configuration:

```
fetch = +refs/heads/*:refs/remotes/origin/*
```

This change was made using:
```bash
git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
```

## Verification
After the fix, all remote branches are now visible and accessible:
- `main`
- `copilot/add-stripe-integration`
- `copilot/review-build-check-error`
- `copilot/review-db-connection-flow`
- `copilot/update-git-configuration`

## Impact
This fix enables:
- ✅ Fetching all branches from the remote repository
- ✅ Viewing all available branches with `git branch -a`
- ✅ Checking out any branch from the remote
- ✅ Proper tracking of branch updates across the repository
- ✅ Standard git workflow operations

## Technical Details
The fetch refspec tells git which branches to fetch from the remote repository:
- `+` means force update even if not a fast-forward
- `refs/heads/*` matches all branches on the remote
- `refs/remotes/origin/*` is where those branches are stored locally

This is the standard configuration for git repositories and is automatically set when cloning a repository.
