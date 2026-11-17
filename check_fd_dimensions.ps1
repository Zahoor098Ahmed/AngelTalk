Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -Path ./inspect_fd

$results = @()
foreach ($f in $files) {
    try {
        $bmp = [System.Drawing.Bitmap]::FromFile($f.FullName)
        $w = $bmp.Width
        $h = $bmp.Height
        $bmp.Dispose()
        $results += [PSCustomObject]@{
            Name = $f.Name
            Width = $w
            Height = $h
            Aspect = [Math]::Round($w / $h, 2)
        }
    } catch {
        Write-Host "Error on $($f.Name): $_"
    }
}

$results | Format-Table -AutoSize
