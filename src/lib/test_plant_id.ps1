$body = @{
    images = @('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
    similar_images = $true
} | ConvertTo-Json

$headers = @{
    'Api-Key' = '948YUInEatDd5ippQ9rIiR0p0mmlBfZPsxR8G3HL5Tq30qBEBP'
    'Content-Type' = 'application/json'
}

try {
    $res = Invoke-RestMethod -Uri 'https://api.plant.id/v3/identification?details=common_names,url,description,taxonomy' -Method POST -Headers $headers -Body $body
    Write-Output "SUCCESS"
    Write-Output ($res | ConvertTo-Json -Depth 5)
} catch {
    Write-Output "ERROR: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Output $reader.ReadToEnd()
    }
}
