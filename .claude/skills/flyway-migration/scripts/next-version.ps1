# In ra số version Flyway tiếp theo (max V hiện có + 1). Chạy từ bất kỳ đâu trong repo.
$root = git rev-parse --show-toplevel 2>$null
if (-not $root) { $root = (Get-Location).Path }
$dir = Join-Path $root 'apps/backend/src/main/resources/db/migration'
$max = 0
if (Test-Path $dir) {
  Get-ChildItem $dir -Filter 'V*__*.sql' | ForEach-Object {
    if ($_.Name -match '^V(\d+)__') { $n = [int]$Matches[1]; if ($n -gt $max) { $max = $n } }
  }
}
Write-Output ($max + 1)
