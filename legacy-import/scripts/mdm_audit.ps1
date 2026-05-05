$enrollments = Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Enrollments' -ErrorAction SilentlyContinue
foreach ($entry in $enrollments) {
    $props = Get-ItemProperty $entry.PSPath -ErrorAction SilentlyContinue
    $guid = $entry.PSChildName
    $etype = $props.EnrollmentType
    $provider = $props.ProviderID
    $discovery = $props.DiscoveryServiceFullURL
    if ($etype -gt 1 -or $provider -or $discovery) {
        Write-Host "GUID: $guid"
        Write-Host "  EnrollmentType: $etype"
        Write-Host "  ProviderID: $provider"
        Write-Host "  DiscoveryURL: $discovery"
        Write-Host "---"
    }
}
Write-Host "`n=== Scheduled Tasks with MDM origin ==="
Get-ScheduledTask | Where-Object { $_.TaskPath -match 'Microsoft.*Enrollment|DeviceManagement|Provisioning' } | ForEach-Object {
    Write-Host ("Task: {0}{1} | State: {2}" -f $_.TaskPath, $_.TaskName, $_.State)
}
Write-Host "`n=== Recent file deletions in Recycle Bin (VERNEN_IP check) ==="
$shell = New-Object -ComObject Shell.Application
$rb = $shell.NameSpace(0xA)
$rb.Items() | Where-Object { $_.Name -match 'VERNEN' } | ForEach-Object {
    Write-Host ("Deleted: {0} | Original: {1}" -f $_.Name, $_.Path)
}
