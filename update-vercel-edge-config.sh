#!/bin/bash

# 🔒 Actualizar Edge Config de Vercel para Licencia Full
# Marianella Cabrera Ahumada - Aegis QA

# Reemplazar estos valores con los reales:
EDGE_CONFIG_ID="PEGAR_AQUI_EL_EDGE_CONFIG_ID"
VERCEL_TOKEN="PEGAR_AQUI_EL_VERCEL_TOKEN"

# Datos a insertar
PAYLOAD='{
  "items": [
    {
      "operation": "upsert",
      "key": "allowed_entries",
      "value": [
        {
          "id": "BCE73D4861",
          "email": "cabreramxr@gmail.com"
        }
      ]
    }
  ]
}'

echo "🔒 Actualizando Edge Config para licencia Full..."
echo "Machine ID: BCE73D4861"
echo "Email: cabreramxr@gmail.com"
echo ""

# Ejecutar PATCH a la API de Vercel
curl -X PATCH \
  "https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}"

echo ""
echo "✅ Si el comando anterior retornó 200, la licencia Full está activada"
echo "🧪 Ahora podés probar: ./binaries/aegis.exe help (debería mostrar modo Full)"
