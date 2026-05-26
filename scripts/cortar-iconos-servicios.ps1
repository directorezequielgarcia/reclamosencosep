Add-Type -AssemblyName System.Drawing

# Recorte automatico por bounding-box: para cada octagono detecto
# columnas/filas con contenido (pixel no blanco) y recorto exactamente
# ese rectangulo. Asi no hay bleed ni recorte excesivo.

$src = "C:\Users\gje_9\Claude\01_ENCOSEP\LOGOS AREA FISCALIZADAS.png"
$dstDir = "C:\Users\gje_9\Claude\01_ENCOSEP\reclamos-app\public\imagenes\areas"
New-Item -ItemType Directory -Force -Path $dstDir | Out-Null

$img = [System.Drawing.Bitmap]::FromFile($src)
$total = [int]$img.Width
$alto  = [int]$img.Height
$cuarto = [int]([math]::Floor($total / 4))
Write-Host "Imagen completa: $total x $alto. Cuarto = $cuarto"

# Umbral: pixel se considera "fondo" si todos sus canales RGB son >= 240
function Test-PixelContenido([System.Drawing.Color]$c) {
    return ($c.A -gt 30) -and ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240)
}

$nombres = @("agua", "energia", "residuos", "transporte")

for ($i = 0; $i -lt 4; $i++) {
    $xStart = [int]($i * $cuarto)
    $xEnd   = [int]([math]::Min(($i + 1) * $cuarto - 1, $total - 1))

    # Centro Y del cuarto — para inicio del sweep
    $yMid = [int]($alto / 2)

    # Busco el centro X del octagono: desde el centro del cuarto
    $xCentroCuarto = [int]($xStart + $cuarto / 2)

    # Sweep izquierdo: desde el centro, busco la columna mas a la izquierda
    # con contenido, sin pasar de xStart
    $xIzq = $xCentroCuarto
    for ($x = $xCentroCuarto; $x -ge $xStart; $x--) {
        $tiene = $false
        for ($y = 4; $y -lt $alto - 4; $y++) {
            if (Test-PixelContenido $img.GetPixel($x, $y)) {
                $tiene = $true
                break
            }
        }
        if ($tiene) { $xIzq = $x } else { break }
    }

    # Sweep derecho
    $xDer = $xCentroCuarto
    for ($x = $xCentroCuarto; $x -le $xEnd; $x++) {
        $tiene = $false
        for ($y = 4; $y -lt $alto - 4; $y++) {
            if (Test-PixelContenido $img.GetPixel($x, $y)) {
                $tiene = $true
                break
            }
        }
        if ($tiene) { $xDer = $x } else { break }
    }

    # Sweep vertical: buscar primera y ultima fila con contenido en el rango [xIzq..xDer]
    $yTop = 0
    for ($y = 0; $y -lt $alto; $y++) {
        $tiene = $false
        for ($x = $xIzq; $x -le $xDer; $x++) {
            if (Test-PixelContenido $img.GetPixel($x, $y)) {
                $tiene = $true
                break
            }
        }
        if ($tiene) { $yTop = $y; break }
    }
    $yBot = $alto - 1
    for ($y = $alto - 1; $y -ge 0; $y--) {
        $tiene = $false
        for ($x = $xIzq; $x -le $xDer; $x++) {
            if (Test-PixelContenido $img.GetPixel($x, $y)) {
                $tiene = $true
                break
            }
        }
        if ($tiene) { $yBot = $y; break }
    }

    # Pequeño padding visual de respiro (2 px) sin invadir vecinos
    $pad = 2
    $cx = [int]([math]::Max($xIzq - $pad, $xStart))
    $cy = [int]([math]::Max($yTop - $pad, 0))
    $cw = [int]([math]::Min($xDer + $pad, $xEnd) - $cx + 1)
    $ch = [int]([math]::Min($yBot + $pad, $alto - 1) - $cy + 1)

    $srcRect = New-Object System.Drawing.Rectangle($cx, $cy, $cw, $ch)
    $dstRect = New-Object System.Drawing.Rectangle(0, 0, $cw, $ch)
    $crop = New-Object System.Drawing.Bitmap($cw, $ch)
    $g = [System.Drawing.Graphics]::FromImage($crop)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $dst = Join-Path $dstDir "$($nombres[$i]).png"
    $crop.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $crop.Dispose()
    Write-Host "  $($nombres[$i]).png  ->  $cw x $ch  desde ($cx, $cy)  [bbox X $xIzq-$xDer]"
}
$img.Dispose()
Write-Host "OK"
