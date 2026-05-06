# 🔒 Actualizar Edge Config de Vercel para Licencia Full
# Marianella Cabrera Ahumada - Aegis QA

# Reemplazar estos valores con los reales:
$EdgeConfigId = "PEGAR_AQUI_EL_EDGE_CONFIG_ID"
$VercelToken = "PEGAR_AQUI_EL_VERCEL_TOKEN"

# Datos a insertar
$Payload = @{
    items = @(
        @{
            operation = "upsert"
            key = "allowed_entries"
            value = @(
                @{
                    id = "BCE73D4861"
                    email = "cabreramxr@gmail.com"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "🔒 Actualizando Edge Config para licencia Full..."
Write-Host "Machine ID: BCE73D4861"
Write-Host "Email: cabreramxr@gmail.com"
Write-Host ""

# Ejecutar PATCH a la API de Vercel
try {
    $Response = Invoke-RestMethod -Uri "https://api.vercel.com/v1/edge-config/$EdgeConfigId" `
                                -Method PATCH `
                                -Headers @{
                                    "Authorization" = "Bearer $VercelToken"
                                    "Content-Type" = "application/json"
                                } `
                                -Body $Payload
    
    Write-Host "✅ Edge Config actualizado exitosamente"
    Write-Host "Response: $Response"
} catch {
    Write-Host "❌ Error al actualizar Edge Config:"
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "🧪 Ahora podés probar: .\binaries\aegis.exe help (debería mostrar modo Full)"
