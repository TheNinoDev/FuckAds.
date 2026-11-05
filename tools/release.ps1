$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw 'Run gh auth login first.' }
if ((& git status --porcelain)) { throw 'Commit and push all changes first with push.bat.' }
& git fetch origin main
if ($LASTEXITCODE -ne 0) { throw 'Could not fetch origin/main.' }
$head = (& git rev-parse HEAD).Trim()
$remote = (& git rev-parse origin/main).Trim()
if ($head -ne $remote) { throw 'The local commit must match origin/main. Run push.bat first.' }
$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
if ($manifest.version -notmatch '^\d+\.\d+\.\d+(\.\d+)?$') { throw 'Invalid manifest version.' }
$tag = 'v' + $manifest.version
$previousErrorPreference = $ErrorActionPreference
try {
 $ErrorActionPreference = 'Continue'
 $releaseCheck = @(& gh release view $tag --repo 'TheNinoDev/FuckAds.' 2>&1)
 $releaseCheckExit = $LASTEXITCODE
} finally { $ErrorActionPreference = $previousErrorPreference }
if ($releaseCheckExit -eq 0) { throw "Release $tag already exists. Increase manifest.json version first." }
if (($releaseCheck | Out-String) -notmatch '(?i)release not found') {
 throw "Could not check whether $tag already exists: $(($releaseCheck | Out-String).Trim())"
}
$stage = Join-Path ([IO.Path]::GetTempPath()) ('fuckads-release-' + [guid]::NewGuid().ToString('N'))
$zip = Join-Path $stage 'FuckAds.zip'
try {
 New-Item -ItemType Directory -Path (Join-Path $stage 'package') -Force | Out-Null
 $items = @('manifest.json','background.js','dynamic-filters.js','city-observer.js','offscreen.html','offscreen.js','domains.json','popup.css','popup.html','popup.js','progress.html','progress.js','work-bridge.js','workink.js','youtube-ads.js','adblock-cosmetic.js','adblock-frames.js','adblock-generic.js','adblock-rules.json','spoof','icons','licenses','LICENSE','THIRD_PARTY_NOTICES.md','README.md')
 foreach ($item in $items) { $source=Join-Path $root $item; if (!(Test-Path -LiteralPath $source)) { throw "Missing package item: $item" }; Copy-Item -LiteralPath $source -Destination (Join-Path $stage 'package') -Recurse -Force }
 Compress-Archive -Path (Join-Path $stage 'package\*') -DestinationPath $zip -CompressionLevel Optimal
 & gh release create $tag $zip --repo 'TheNinoDev/FuckAds.' --target $head --title "FuckAds $($manifest.version)" --generate-notes
 if ($LASTEXITCODE -ne 0) { throw 'GitHub release creation failed.' }
 Write-Host "Published $tag with FuckAds.zip."
} finally { if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force } }
