$path1 = "e:\projects\a-flick\src\app\[lang]\(dashboard)\(private)\admin\(transfer)\transfer\material-request-received"
$new1 = "material-received"
try {
    Rename-Item -LiteralPath $path1 -NewName $new1 -Force -ErrorAction Stop
    Write-Host "Renamed 1 Success"
} catch {
    Write-Host "Renamed 1 Failed: $_"
}

$path2 = "e:\projects\a-flick\src\app\[lang]\(dashboard)\(private)\admin\(transfer)\transfer\material-request-issued"
$new2 = "material-issued"
try {
    Rename-Item -LiteralPath $path2 -NewName $new2 -Force -ErrorAction Stop
     Write-Host "Renamed 2 Success"
} catch {
    Write-Host "Renamed 2 Failed: $_"
}
