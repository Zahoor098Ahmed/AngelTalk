Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -Path ./inspect_sports
$nonWhite = @()

foreach ($f in $files) {
    try {
        $bmp = [System.Drawing.Bitmap]::FromFile($f.FullName)
        $w = $bmp.Width
        $h = $bmp.Height

        $c1 = $bmp.GetPixel(4, 4)
        $c2 = $bmp.GetPixel($w - 5, 4)
        $c3 = $bmp.GetPixel(4, $h - 5)
        $c4 = $bmp.GetPixel($w - 5, $h - 5)
        $bmp.Dispose()

        $isWhite1 = ($c1.R -ge 245 -and $c1.G -ge 245 -and $c1.B -ge 245)
        $isWhite2 = ($c2.R -ge 245 -and $c2.G -ge 245 -and $c2.B -ge 245)
        $isWhite3 = ($c3.R -ge 245 -and $c3.G -ge 245 -and $c3.B -ge 245)
        $isWhite4 = ($c4.R -ge 245 -and $c4.G -ge 245 -and $c4.B -ge 245)

        if (-not ($isWhite1 -and $isWhite2 -and $isWhite3 -and $isWhite4)) {
            $nonWhite += "$($f.Name): C1=($($c1.R),$($c1.G),$($c1.B)) C2=($($c2.R),$($c2.G),$($c2.B)) C3=($($c3.R),$($c3.G),$($c3.B)) C4=($($c4.R),$($c4.G),$($c4.B))"
        }
    } catch {
        Write-Host "Error on $($f.Name): $_"
    }
}

Write-Host "Total non-white background count: $($nonWhite.Count)"
$nonWhite | ForEach-Object { Write-Host $_ }

