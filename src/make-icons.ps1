$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$icons = Join-Path $root "icons"
$tmp = Join-Path $env:TEMP "hardencode-fonts"
New-Item -ItemType Directory -Force -Path $icons | Out-Null
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$sgZip = Join-Path $tmp "sg-ttf.zip"
$jbZip = Join-Path $tmp "jb-ttf.zip"
Invoke-WebRequest -Uri "https://gwfh.mranftl.com/api/fonts/space-grotesk?download=zip&subsets=latin&variants=regular,700&formats=ttf" -OutFile $sgZip
Invoke-WebRequest -Uri "https://gwfh.mranftl.com/api/fonts/jetbrains-mono?download=zip&subsets=latin&variants=700&formats=ttf" -OutFile $jbZip
Expand-Archive $sgZip -DestinationPath $tmp -Force
Expand-Archive $jbZip -DestinationPath $tmp -Force

$fonts = New-Object System.Drawing.Text.PrivateFontCollection
Get-ChildItem $tmp -Filter "*.ttf" | ForEach-Object { $fonts.AddFontFile($_.FullName) }
$sgFamily = $fonts.Families | Where-Object { $_.Name -like "Space Grotesk*" } | Select-Object -First 1
$jbFamily = $fonts.Families | Where-Object { $_.Name -like "JetBrains Mono*" } | Select-Object -First 1

$middot = [string][char]0x00B7
$navy = [System.Drawing.ColorTranslator]::FromHtml("#0f172a")
$light = [System.Drawing.ColorTranslator]::FromHtml("#e2e8f0")
$mutedC = [System.Drawing.ColorTranslator]::FromHtml("#94a3b8")
$blue = [System.Drawing.ColorTranslator]::FromHtml("#3b82f6")

function New-Canvas([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = "AntiAlias"
    $g.TextRenderingHint = "AntiAliasGridFit"
    $g.Clear($navy)
    return @($bmp, $g)
}

function Draw-Segments($g, $segments, [float]$centerX, [float]$centerY) {
    $format = New-Object System.Drawing.StringFormat([System.Drawing.StringFormat]::GenericTypographic)
    $format.FormatFlags = $format.FormatFlags -bor [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces
    $total = 0.0
    foreach ($seg in $segments) {
        $size = $g.MeasureString($seg.Text, $seg.Font, [int]::MaxValue, $format)
        $seg.Width = $size.Width
        $seg.Height = $size.Height
        $total += $size.Width
    }
    $x = $centerX - ($total / 2)
    foreach ($seg in $segments) {
        $brush = New-Object System.Drawing.SolidBrush($seg.Color)
        $y = $centerY - ($seg.Height / 2)
        $g.DrawString($seg.Text, $seg.Font, $brush, $x, $y, $format)
        $x += $seg.Width
        $brush.Dispose()
    }
}

function Wordmark-Segments([float]$size) {
    $sgBold = New-Object System.Drawing.Font($sgFamily, $size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sgReg = New-Object System.Drawing.Font($sgFamily, $size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $jbBold = New-Object System.Drawing.Font($jbFamily, ($size * 0.92), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    return @(
        @{ Text = "hard"; Font = $sgBold; Color = $light },
        @{ Text = " $middot "; Font = $sgReg; Color = $mutedC },
        @{ Text = "en"; Font = $jbBold; Color = $blue },
        @{ Text = " $middot "; Font = $sgReg; Color = $mutedC },
        @{ Text = "code"; Font = $sgBold; Color = $light }
    )
}

$og = New-Canvas 1200 630
Draw-Segments $og[1] (Wordmark-Segments 118) 600 315
$og[0].Save((Join-Path $icons "og-image.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$og[1].Dispose(); $og[0].Dispose()

function Get-MonogramLayout([int]$px, $g, $sgBold, $format) {
    $size = [float]($px * 0.52)
    $dotSlot = $g.MeasureString($middot, $sgBold, [int]::MaxValue, $format)
    $hSize = $g.MeasureString("h", $sgBold, [int]::MaxValue, $format)
    $cSize = $g.MeasureString("c", $sgBold, [int]::MaxValue, $format)
    $total = $hSize.Width + $dotSlot.Width + $cSize.Width
    $hX = ($px / 2) - ($total / 2)
    $centerY = $px / 2
    $dotDiameter = [Math]::Max([float]($size * 0.26), [float]($px * 0.18))
    $dotDiameter = [Math]::Min($dotDiameter, $dotSlot.Width)
    $dotX = $hX + $hSize.Width + ($dotSlot.Width - $dotDiameter) / 2
    $dotY = $centerY - ($dotDiameter / 2)
    $cX = $hX + $hSize.Width + $dotSlot.Width
    $ringPad = [Math]::Max(1.0, [float]($px * 0.05))
    return @{
        Size = $size
        CenterY = $centerY
        H = @{ X = $hX; Y = $centerY - ($hSize.Height / 2); Height = $hSize.Height }
        Dot = @{ X = $dotX; Y = $dotY; D = $dotDiameter; Ring = $ringPad }
        C = @{ X = $cX; Y = $centerY - ($cSize.Height / 2); Height = $cSize.Height }
    }
}

function Draw-AccentDot($g, $dotX, $dotY, $dotDiameter, $ringPad) {
    $outerD = $dotDiameter + ($ringPad * 2)
    $ringBrush = New-Object System.Drawing.SolidBrush($light)
    $g.FillEllipse($ringBrush, ($dotX - $ringPad), ($dotY - $ringPad), $outerD, $outerD)
    $ringBrush.Dispose()
    $blueBrush = New-Object System.Drawing.SolidBrush($blue)
    $g.FillEllipse($blueBrush, $dotX, $dotY, $dotDiameter, $dotDiameter)
    $blueBrush.Dispose()
}

function Monogram([int]$px) {
    $c = New-Canvas $px $px
    $size = [float]($px * 0.52)
    $sgBold = New-Object System.Drawing.Font($sgFamily, $size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $format = New-Object System.Drawing.StringFormat([System.Drawing.StringFormat]::GenericTypographic)
    $format.FormatFlags = $format.FormatFlags -bor [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces
    $layout = Get-MonogramLayout $px $c[1] $sgBold $format

    $lightBrush = New-Object System.Drawing.SolidBrush($light)
    $c[1].DrawString("h", $sgBold, $lightBrush, $layout.H.X, $layout.H.Y, $format)
    Draw-AccentDot $c[1] $layout.Dot.X $layout.Dot.Y $layout.Dot.D $layout.Dot.Ring
    $c[1].DrawString("c", $sgBold, $lightBrush, $layout.C.X, $layout.C.Y, $format)
    $lightBrush.Dispose()
    $sgBold.Dispose()
    return $c
}

function Write-FaviconSvg([string]$path) {
    $px = 64
    $size = [float]($px * 0.52)
    $sgBold = New-Object System.Drawing.Font($sgFamily, $size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $format = New-Object System.Drawing.StringFormat([System.Drawing.StringFormat]::GenericTypographic)
    $format.FormatFlags = $format.FormatFlags -bor [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces
    $measureBmp = New-Object System.Drawing.Bitmap(1, 1)
    $measureG = [System.Drawing.Graphics]::FromImage($measureBmp)
    $layout = Get-MonogramLayout $px $measureG $sgBold $format
    $baselineY = [Math]::Round($layout.CenterY + ($layout.Size * 0.33), 1)
    $fontSize = [Math]::Round($layout.Size, 1)
    $dot = $layout.Dot
    $ringR = [Math]::Round(($dot.D / 2) + $dot.Ring, 1)
    $dotR = [Math]::Round($dot.D / 2, 1)
    $dotCx = [Math]::Round($dot.X + ($dot.D / 2), 1)
    $dotCy = [Math]::Round($layout.CenterY, 1)

    $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0f172a"/>
  <text x="$([Math]::Round($layout.H.X, 1))" y="$baselineY" font-family="'Space Grotesk','Segoe UI',Arial,sans-serif" font-weight="700" font-size="$fontSize" fill="#e2e8f0">h</text>
  <circle cx="$dotCx" cy="$dotCy" r="$ringR" fill="#e2e8f0"/>
  <circle cx="$dotCx" cy="$dotCy" r="$dotR" fill="#3b82f6"/>
  <text x="$([Math]::Round($layout.C.X, 1))" y="$baselineY" font-family="'Space Grotesk','Segoe UI',Arial,sans-serif" font-weight="700" font-size="$fontSize" fill="#e2e8f0">c</text>
</svg>
"@
    [System.IO.File]::WriteAllText($path, $svg.TrimStart(), [System.Text.UTF8Encoding]::new($false))
    $measureG.Dispose()
    $measureBmp.Dispose()
    $sgBold.Dispose()
}

$touch = Monogram 180
$touch[0].Save((Join-Path $icons "apple-touch-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$touch[1].Dispose(); $touch[0].Dispose()

$png192 = Monogram 192
$png192[0].Save((Join-Path $icons "icon-192.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$png192[1].Dispose(); $png192[0].Dispose()

$png512 = Monogram 512
$png512[0].Save((Join-Path $icons "icon-512.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$png512[1].Dispose(); $png512[0].Dispose()

$pngBytesList = @()
foreach ($px in @(16, 32, 48)) {
    $m = Monogram $px
    $ms = New-Object System.IO.MemoryStream
    $m[0].Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytesList += , @{ Size = $px; Bytes = $ms.ToArray() }
    $ms.Dispose(); $m[1].Dispose(); $m[0].Dispose()
}

$icoStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($icoStream)
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]$pngBytesList.Count)
$offset = 6 + (16 * $pngBytesList.Count)
foreach ($entry in $pngBytesList) {
    $writer.Write([Byte]($entry.Size % 256))
    $writer.Write([Byte]($entry.Size % 256))
    $writer.Write([Byte]0)
    $writer.Write([Byte]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]32)
    $writer.Write([UInt32]$entry.Bytes.Length)
    $writer.Write([UInt32]$offset)
    $offset += $entry.Bytes.Length
}
foreach ($entry in $pngBytesList) {
    $writer.Write($entry.Bytes)
}
$writer.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $icons "favicon.ico"), $icoStream.ToArray())
$writer.Dispose(); $icoStream.Dispose()

Write-FaviconSvg (Join-Path $icons "favicon.svg")

Write-Output "Icons written:"
Get-ChildItem $icons | Select-Object Name, Length
