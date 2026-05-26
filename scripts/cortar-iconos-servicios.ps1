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

$nombres = @("agua", "energia", "residuos", "transporte")
for ($i = 0; $i -lt 4; $i++) {
    $x = [int]($i * $cuarto)
    $srcRect = New-Object System.Drawing.Rectangle($x, 0, $cuarto, $alto)
    $dstRect = New-Object System.Drawing.Rectangle(0, 0, $cuarto, $alto)
    $crop = New-Object System.Drawing.Bitmap($cuarto, $alto)
    $g = [System.Drawing.Graphics]::FromImage($crop)
    $g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $dst = Join-Path $dstDir "$($nombres[$i]).png"
    $crop.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $crop.Dispose()
    $size = (Get-Item -LiteralPath $dst).Length
    Write-Host "  $($nombres[$i]).png  ->  $cuarto x $alto  ($size bytes)"
}
$img.Dispose()
Write-Host "OK"
