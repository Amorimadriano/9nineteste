# Script de migração de Storage Supabase
# Uso: .\storage_migration.ps1 -FromToken <token_antigo> -ToToken <token_novo>

param(
    [string]$FromToken,
    [string]$ToToken,
    [string]$FromUrl = "https://rjcruiwlurqdwooarrpa.supabase.co",
    [string]$ToUrl = "https://gcmxhuadibdrumvqdrkc.supabase.co",
    [string]$Buckets = "logos,anexos,contador-docs,certificados-nfse,licencas-documentos"
)

$ErrorActionPreference = "Stop"
$bucketList = $Buckets -split ","

function Get-SupabaseStorageFiles {
    param($Url, $Token, $Bucket, $Path = "")
    $headers = @{ Authorization = "Bearer $Token" }
    $uri = "$Url/storage/v1/object/list/$Bucket"
    $body = @{ prefix = $Path; limit = 1000 } | ConvertTo-Json
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ContentType "application/json"
        return $resp
    } catch {
        Write-Error "Falha ao listar $Bucket/$Path`: $_"
        return @()
    }
}

function Download-SupabaseFile {
    param($Url, $Token, $Bucket, $Path, $OutFile)
    $headers = @{ Authorization = "Bearer $Token" }
    $uri = "$Url/storage/v1/object/authenticated/$Bucket/$Path"
    try {
        Invoke-RestMethod -Uri $uri -Method Get -Headers $headers -OutFile $OutFile
        return $true
    } catch {
        Write-Warning "Falha ao baixar $Bucket/$Path`: $_"
        return $false
    }
}

function Upload-SupabaseFile {
    param($Url, $Token, $Bucket, $Path, $FilePath)
    $headers = @{ Authorization = "Bearer $Token" }
    $uri = "$Url/storage/v1/object/$Bucket/$Path"
    try {
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $mime = "application/octet-stream"
        if ($Path -match "\.(jpg|jpeg)$") { $mime = "image/jpeg" }
        elseif ($Path -match "\.png$") { $mime = "image/png" }
        elseif ($Path -match "\.pdf$") { $mime = "application/pdf" }
        elseif ($Path -match "\.pfx$") { $mime = "application/x-pkcs12" }
        $headers["Content-Type"] = $mime
        Invoke-RestMethod -Uri $uri -Method Put -Headers $headers -Body $bytes
        return $true
    } catch {
        Write-Warning "Falha ao upload $Bucket/$Path`: $_"
        return $false
    }
}

foreach ($bucket in $bucketList) {
    Write-Host "Processando bucket: $bucket"
    $tempDir = Join-Path $env:TEMP "supabase-migration-$bucket"
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

    $files = Get-SupabaseStorageFiles -Url $FromUrl -Token $FromToken -Bucket $bucket
    if ($files.Count -eq 0) {
        Write-Host "  Bucket vazio ou sem acesso"
        continue
    }

    foreach ($file in $files) {
        if ($file.id -and $file.name) {
            $localPath = Join-Path $tempDir $file.name
            $downloaded = Download-SupabaseFile -Url $FromUrl -Token $FromToken -Bucket $bucket -Path $file.name -OutFile $localPath
            if ($downloaded) {
                Upload-SupabaseFile -Url $ToUrl -Token $ToToken -Bucket $bucket -Path $file.name -FilePath $localPath
            }
        }
    }
}

Write-Host "Migração de storage concluída!"
