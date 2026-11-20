$ErrorActionPreference = 'Stop'
$assetRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../assets/image-edits/verbs-b-z'))
$copiedCount = 0
foreach ($receiptFile in Get-ChildItem -LiteralPath $assetRoot -Filter 'receipts-*.json' -File) {
  foreach ($row in (Get-Content -LiteralPath $receiptFile.FullName -Raw | ConvertFrom-Json)) {
    if (-not $row.generated -or $row.slug -notmatch '^verb-[b-z]-[a-z0-9-]+$') { throw 'Invalid restoration receipt' }
    $destination = Join-Path $assetRoot ($row.slug + '-clear.png')
    if ($row.corrective -or -not (Test-Path -LiteralPath $destination)) {
      Copy-Item -LiteralPath $row.generated -Destination $destination
      $copiedCount++
      if ($copiedCount % 25 -eq 0) { Write-Output "Imported $copiedCount HD pictures" }
    }
  }
}
Write-Output "Imported $copiedCount new HD verb pictures."
