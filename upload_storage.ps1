param(
    [string]$ServiceKey = (Get-Content "service_key_new.txt" -Raw).Trim(),
    [string]$ProjectUrl = "https://gcmxhuadibdrumvqdrkc.supabase.co"
)

$ErrorActionPreference = "Stop"

$basePath = Join-Path $PSScriptRoot "storage_backup"

$files = Get-ChildItem $basePath -Recurse -File

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($basePath.Length + 1)

    # Remove o prefixo duplicado do bucket (ex: logos\logos\... -> logos\...)
    $parts = $relativePath -split '\\'
    if ($parts.Count -ge 2 -and $parts[0] -eq $parts[1]) {
        $parts = $parts[1..($parts.Count-1)]
    }

    $bucket = $parts[0]
    $objectPath = ($parts[1..($parts.Count-1)] -join '/')

    $uri = "$ProjectUrl/storage/v1/object/$bucket/$objectPath"
    $headers = @{ Authorization = "Bearer $ServiceKey" }

    $mime = "application/octet-stream"
    if ($file.Extension -match "\.(jpg|jpeg)$") { $mime = "image/jpeg" }
    elseif ($file.Extension -eq ".png") { $mime = "image/png" }
    elseif ($file.Extension -eq ".pdf") { $mime = "application/pdf" }
    elseif ($file.Extension -eq ".pfx") { $mime = "application/x-pkcs12" }

    $headers["Content-Type"] = $mime
    $headers["x-upsert"] = "true"

    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $null = Invoke-RestMethod -Uri $uri -Method Put -Headers $headers -Body $bytes
        Write-Host "OK: $bucket/$objectPath"
    } catch {
        Write-Error "Falha ao upload $bucket/$objectPath`: $_"
    }
}

Write-Host "Upload concluído!"
