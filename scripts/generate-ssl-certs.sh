#!/bin/bash

# Script to generate self-signed SSL certificates for development
# Usage: ./scripts/generate-ssl-certs.sh

# Create directory for certificates
mkdir -p certs

# Generate private key
openssl genrsa -out certs/server.key 2048

# Generate certificate signing request
openssl req -new -key certs/server.key -out certs/server.csr -subj "/C=US/ST=State/L=City/O=AI Interview Assistant/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in certs/server.csr -signkey certs/server.key -out certs/server.crt

echo "SSL certificates generated successfully!"
echo "Certificates are located in the 'certs' directory:"
echo "  - certs/server.key (private key)"
echo "  - certs/server.crt (certificate)"
echo ""
echo "To use these certificates with your application, set the following environment variables:"
echo "  SSL_KEY=certs/server.key"
echo "  SSL_CERT=certs/server.crt"