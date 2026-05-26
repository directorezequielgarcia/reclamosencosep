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

# Padding asimétrico por icono (el bleed reportado por el usuario:
# energia tiene azul del agua a la izquierda; residuos tiene violeta
# del transporte a la derecha). Aplicamos más recorte en el lado
# donde está el vecino conflictivo.
$padTop = 8
$paddings = @(
    @{ nombre = "agua";       izq = 20; der = 28 },  # extremo izq, vecino energia a la derecha
    @{ nombre = "energia";    izq = 30; der = 22 },  # tiene azul del agua a la izquierda
    @{ nombre = "residuos";   izq = 22; der = 30 },  # tiene violeta del transporte a la derecha
    @{ nombre = "transporte"; izq = 28; der = 20 }   # extremo der, vecino residuos a la izquierda
)

for ($i = 0; $i -lt 4; $i++) {
    $p = $paddings[$i]
    $padIzq = [int]$p.izq
    $padDer = [int]$p.der
    $x = [int]($i * $cuarto + $padIzq)
    $anchoUtil = [int]($cuarto - $padIzq - $padDer)
    $y = $padTop
    $altoUtil  = [int]($alto - ($padTop * 2))

    $srcRect = New-Object System.Drawing.Rectangle($x, $y, $anchoUtil, $altoUtil)
    $dstRect = New-Object System.Drawing.Rectangle(0, 0, $anchoUtil, $altoUtil)
    $crop = New-Object System.Drawing.Bitmap($anchoUtil, $altoUtil)
    $g = [System.Drawing.Graphics]::FromImage($crop)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $dst = Join-Path $dstDir "$($p.nombre).png"
    $crop.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $crop.Dispose()
    $size = (Get-Item -LiteralPath $dst).Length
    Write-Host "  $($p.nombre).png  ->  $anchoUtil x $altoUtil  ($size bytes)  desde X=$x  (padding izq=$padIzq der=$padDer)"
}
$img.Dispose()
Write-Host "OK"
