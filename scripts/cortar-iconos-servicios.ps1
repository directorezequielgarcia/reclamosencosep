Add-Type -AssemblyName System.Drawing

$src = "C:\Users\gje_9\Claude\01_ENCOSEP\LOGOS AREA FISCALIZADAS.png"
$dstDir = "C:\Users\gje_9\Claude\01_ENCOSEP\reclamos-app\public\imagenes\areas"
New-Item -ItemType Directory -Force -Path $dstDir | Out-Null

$img = [System.Drawing.Bitmap]::FromFile($src)
$total = [int]$img.Width
$alto  = [int]$img.Height
$cuarto = [int]([math]::Floor($total / 4))
Write-Host "Imagen completa: $total x $alto"
Write-Host "Ancho de cada cuarto: $cuarto"

# Padding lateral interno: recortar solo el centro de cada cuarto,
# dejando un margen a izquierda y derecha que evita capturar bordes de
# los octagonos vecinos.
$padLat = 14
$padTop = 4
$anchoUtil = $cuarto - ($padLat * 2)
$altoUtil  = $alto - ($padTop * 2)
Write-Host "Recortando $anchoUtil x $altoUtil por icono (padding lat $padLat, top $padTop)"

$nombres = @("agua", "energia", "residuos", "transporte")
for ($i = 0; $i -lt 4; $i++) {
    $x = [int]($i * $cuarto + $padLat)
    $y = $padTop
    $srcRect = New-Object System.Drawing.Rectangle($x, $y, $anchoUtil, $altoUtil)
    $dstRect = New-Object System.Drawing.Rectangle(0, 0, $anchoUtil, $altoUtil)
    $crop = New-Object System.Drawing.Bitmap($anchoUtil, $altoUtil)
    $g = [System.Drawing.Graphics]::FromImage($crop)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $dst = Join-Path $dstDir "$($nombres[$i]).png"
    $crop.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $crop.Dispose()
    $size = (Get-Item -LiteralPath $dst).Length
    Write-Host "  $($nombres[$i]).png  ->  $anchoUtil x $altoUtil  ($size bytes)  desde X=$x"
}
$img.Dispose()
Write-Host "OK"
