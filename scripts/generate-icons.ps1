Add-Type -AssemblyName System.Drawing

$publicDir = Join-Path $PSScriptRoot "..\public"
$inputIco = Join-Path $publicDir "favicon.ico"

$icons = @(
    @{ Name = "icon-192x192.png"; Size = 192 },
    @{ Name = "icon-512x512.png"; Size = 512 },
    @{ Name = "icon-pos.png"; Size = 96 },
    @{ Name = "icon-inventory.png"; Size = 96 }
)

if (-not (Test-Path $inputIco)) {
    Write-Error "favicon.ico no encontrado en public/"
    exit 1
}

Write-Host "Generando iconos PWA desde favicon.ico..." -ForegroundColor Cyan

$original = [System.Drawing.Bitmap]::FromFile($inputIco)

foreach ($icon in $icons) {
    $outputPath = Join-Path $publicDir $icon.Name
    $size = $icon.Size

    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($original, 0, 0, $size, $size)
    $graphics.Dispose()

    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()

    Write-Host "  ✅ $($icon.Name) ($size x $size)" -ForegroundColor Green
}

$original.Dispose()
Write-Host "`nIconos PWA generados correctamente!" -ForegroundColor Cyan
