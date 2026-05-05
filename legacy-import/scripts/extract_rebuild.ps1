$b64 = Get-Content "C:\Users\SagFi\VERNEN\scripts\b64_rebuild.txt" -Raw
$bytes = [System.Convert]::FromBase64String($b64)
[System.IO.File]::WriteAllBytes("C:\Users\SagFi\VERNEN\rebuild_data.zip", $bytes)
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Extract annotations to src/data/annotations
$zip = [System.IO.Compression.ZipFile]::OpenRead("C:\Users\SagFi\VERNEN\rebuild_data.zip")
foreach ($entry in $zip.Entries) {
    if ($entry.Name -eq "") { continue }
    if ($entry.FullName -like "annotations/*") {
        $dest = "C:\Users\SagFi\VERNEN\src\data\annotations\$($entry.Name)"
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
        Write-Host "Extracted: $dest"
    }
    if ($entry.FullName -eq "scenario_index.json") {
        $dest = "C:\Users\SagFi\VERNEN\src\data\scenario_index.json"
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
        Write-Host "Extracted: $dest"
    }
}
$zip.Dispose()
Remove-Item "C:\Users\SagFi\VERNEN\rebuild_data.zip"
Write-Host "Done - all files extracted"
