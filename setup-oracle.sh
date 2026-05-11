#!/bin/bash
# Script de setup para Ubuntu 22.04 en Oracle Cloud Always Free (ARM)
# Ejecutar como: bash setup-oracle.sh

set -e

echo "=== 1. Actualizar sistema ==="
sudo apt-get update && sudo apt-get upgrade -y

echo "=== 2. Instalar Docker ==="
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Usar docker sin sudo
sudo usermod -aG docker $USER

echo "=== 3. Abrir puertos en el firewall del sistema operativo ==="
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

echo "=== 4. Instalar git ==="
sudo apt-get install -y git

echo ""
echo "=== Setup completo ==="
echo "Ahora:"
echo "  1. Cerrá y volvé a conectarte por SSH para que el grupo docker tome efecto"
echo "  2. Cloná tu repo: git clone https://github.com/TU_USUARIO/cobrapy.git"
echo "  3. Copiá tu .env.prod al servidor"
echo "  4. Levantá los servicios:"
echo "     cd cobrapy"
echo "     docker compose -f docker-compose.prod.yml up -d --build"
echo "  5. Migrá la DB:"
echo "     docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy"
echo "     docker compose -f docker-compose.prod.yml exec api npx prisma db seed"
echo ""
echo "IP pública del VM: \$(curl -s ifconfig.me)"
curl -s ifconfig.me
echo ""
