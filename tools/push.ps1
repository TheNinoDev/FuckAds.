$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
& git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { throw 'This folder must be a Git checkout.' }
$remote = (& git remote get-url origin)
if ($LASTEXITCODE -ne 0 -or $remote -notmatch '^https://github\.com/TheNinoDev/FuckAds\.\.git$') { throw 'origin does not match TheNinoDev/FuckAds.' }
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw 'Run gh auth login first.' }
& git add --all
if ($LASTEXITCODE -ne 0) { throw 'Could not stage changes.' }
& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  $message = Read-Host 'Commit message'
  if ([string]::IsNullOrWhiteSpace($message)) { throw 'A commit message is required.' }
  & git commit -m $message
  if ($LASTEXITCODE -ne 0) { throw 'Commit failed.' }
} else { Write-Host 'No new changes to commit.' }
& git push origin HEAD:main
if ($LASTEXITCODE -ne 0) { throw 'Push failed. Pull and resolve any conflicts first.' }
Write-Host 'Pushed to TheNinoDev/FuckAds.'
