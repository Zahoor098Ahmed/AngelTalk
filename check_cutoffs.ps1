Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -Path ./inspect_fd

$cutOffList = @()

foreach ($f in $files) {
    try {
        $bmp = [System.Drawing.Bitmap]::FromFile($f.FullName)
        $w = $bmp.Width
        $h = $bmp.Height

        $topCut = $false
        $bottomCut = $false
        $leftCut = $false
        $rightCut = $false

        # Check top and bottom edges
        for ($x = 0; $x -lt $w; $x++) {
            $pTop = $bmp.GetPixel($x, 0)
            $pBot = $bmp.GetPixel($x, $h - 1)
            if ($pTop.R -lt 240 -or $pTop.G -lt 240 -or $pTop.B -lt 240) { $topCut = $true }
            if ($pBot.R -lt 240 -or $pBot.G -lt 240 -or $pBot.B -lt 240) { $bottomCut = $true }
        }

        # Check left and right edges
        for ($y = 0; $y -lt $h; $y++) {
            $pLeft = $bmp.GetPixel(0, $y)
            $pRight = $bmp.GetPixel($w - 1, $y)
            if ($pLeft.R -lt 240 -or $pLeft.G -lt 240 -or $pLeft.B -lt 240) { $leftCut = $true }
            if ($pRight.R -lt 240 -or $pRight.G -lt 240 -or $pRight.B -lt 240) { $rightCut = $true }
        }

        $bmp.Dispose()

        if ($topCut -or $bottomCut -or $leftCut -or $rightCut) {
            $sides = @()
            if ($topCut) { $sides += "Top" }
            if ($bottomCut) { $sides += "Bottom" }
            if ($leftCut) { $sides += "Left" }
            if ($rightCut) { $sides += "Right" }
            $cutOffList += [PSCustomObject]@{
                Name = $f.Name
                CutSides = ($sides -join ", ")
            }
        }
    } catch {
        Write-Host "Error on $($f.Name): $_"
    }
}

Write-Host "Total cut-off images: $($cutOffList.Count) out of $($files.Count)"
$cutOffList | Format-Table -AutoSize
