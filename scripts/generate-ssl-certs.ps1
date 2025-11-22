# Script to generate self-signed SSL certificates for development on Windows
# Usage: .\scripts\generate-ssl-certs.ps1

# Create directory for certificates
New-Item -ItemType Directory -Force -Path certs

# Generate private key and certificate
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -KeyAlgorithm RSA -KeyLength 2048 -NotAfter (Get-Date).AddYears(1)

# Export the certificate
$certPath = "certs\server.crt"
$cert | Export-Certificate -FilePath $certPath -Type CERT

# Export the private key
$keyPath = "certs\server.key"
$securePassword = ConvertTo-SecureString -String "password" -Force -AsPlainText
$cert | Export-PfxCertificate -FilePath "certs\server.pfx" -Password $securePassword

Write-Host "SSL certificates generated successfully!"
Write-Host "Certificates are located in the 'certs' directory:"
Write-Host "  - $certPath (certificate)"
Write-Host "  - $keyPath (private key)"
Write-Host ""
Write-Host "To use these certificates with your application, set the following environment variables:"
Write-Host "  SSL_CERT=certs\server.crt"
Write-Host "  SSL_KEY=certs\server.key"