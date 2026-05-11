# Deploy CobraPy en Oracle Cloud con Portainer

## Arquitectura
- **Oracle VM** (ARM, 4 cores, 24GB) — backend + DB + Redis + Portainer
- **Vercel** — dashboard Next.js (gratis, cero config)

---

## Parte 1 — Crear el VM en Oracle Cloud

### 1.1 Registro
1. Ir a **cloud.oracle.com** → "Start for free"
2. País: Paraguay | Región: **Brazil East (São Paulo)**
3. Verificar email y agregar tarjeta (no cobra)

### 1.2 Crear el VM
1. Menú → **Compute → Instances → Create Instance**
2. Nombre: `cobrapy-prod`
3. **Image** → Edit → **Ubuntu 22.04**
4. **Shape** → Edit → **VM.Standard.A1.Flex** → 4 OCPUs, 24 GB RAM
5. **SSH Keys** → "Generate a key pair" → descargar `ssh-key.key`
6. Click **Create**
7. Esperá 2 minutos, copiá la **IP pública** que aparece

### 1.3 Abrir puertos en Oracle (firewall de la nube)
1. Menú → **Networking → Virtual Cloud Networks**
2. Clickeá tu VCN → **Security Lists → Default Security List**
3. **Add Ingress Rules** — agregar estos 3:

| Source CIDR | Protocol | Port |
|---|---|---|
| 0.0.0.0/0 | TCP | 80 |
| 0.0.0.0/0 | TCP | 443 |
| 0.0.0.0/0 | TCP | 9000 |

---

## Parte 2 — Conectarse al VM

### En Windows (PowerShell)
```powershell
# Dar permisos al archivo de clave
icacls "C:\ruta\ssh-key.key" /inheritance:r /grant:r "$($env:USERNAME):(R)"

# Conectarse
ssh -i "C:\ruta\ssh-key.key" ubuntu@IP_DEL_VM
```

### En Mac/Linux (Terminal)
```bash
chmod 400 ssh-key.key
ssh -i ssh-key.key ubuntu@IP_DEL_VM
```

---

## Parte 3 — Setup del servidor

Ejecutar en el VM (copiar y pegar en la terminal SSH):

```bash
# Actualizar sistema
sudo apt-get update && sudo apt-get upgrade -y

# Instalar Docker
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Usar docker sin sudo
sudo usermod -aG docker ubuntu

# Abrir puertos en el firewall del OS
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 9000 -j ACCEPT
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

# Cerrar sesión para aplicar grupo docker
exit
```

Volvé a conectarte por SSH.

---

## Parte 4 — Instalar Portainer

```bash
docker volume create portainer_data

docker run -d \
  --name portainer \
  --restart always \
  -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Abrí el navegador: **http://IP_DEL_VM:9000**

1. Crear usuario admin y contraseña
2. Elegir **"Get Started"** → **Local**
3. Ya estás dentro del panel

---

## Parte 5 — Subir el código al VM

```bash
# En el VM, clonar el repo de GitHub
git clone https://github.com/TU_USUARIO/cobrapy.git
cd cobrapy
```

> Si el repo es privado, generá un Personal Access Token en GitHub (Settings → Developer settings → Tokens) y usalo como contraseña al clonar.

---

## Parte 6 — Crear el archivo .env.prod

```bash
# En el VM, dentro de la carpeta cobrapy
nano .env.prod
```

Pegar y completar con tus valores reales:

```env
DB_USER=cobrapy
DB_PASSWORD=PonerPasswordSeguro123
DB_NAME=cobrapy

DATABASE_URL=postgresql://cobrapy:PonerPasswordSeguro123@postgres:5432/cobrapy
REDIS_URL=redis://redis:6379

JWT_SECRET=UnStringMuyLargoYAleatorio64Caracteres
ADMIN_TOKEN=OtroTokenSeguroParaAdmin

SEED_ADMIN_EMAIL=admin@tuempresa.com
SEED_ADMIN_PASSWORD=AdminPass123
SEED_ADMIN_NAME=Admin CobraPy

SEED_MERCHANT_NAME=CobraPy Demo
SEED_MERCHANT_EMAIL=demo@tuempresa.com
SEED_MERCHANT_PASSWORD=DemoPass123

NODE_ENV=production
```

Guardar: `Ctrl+O` → Enter → `Ctrl+X`

---

## Parte 7 — Deploy desde Portainer

### 7.1 Crear el Stack
1. En Portainer → **Stacks → Add stack**
2. Nombre: `cobrapy`
3. Elegir **"Repository"** si el repo es público, o **"Web editor"** para pegar el compose

### 7.2 Usando Web Editor (más simple)
1. Click en **Web editor**
2. Pegar el contenido del archivo `docker-compose.prod.yml` de tu repo
3. En **Environment variables** → Load variables from .env.prod:
   - Click "Load variables from .env file"
   - O agregar una por una con el botón "Add an environment variable"
4. Click **"Deploy the stack"**

Portainer va a construir la imagen y levantar todos los servicios. Tarda 3-5 minutos la primera vez.

### 7.3 Verificar que todo esté corriendo
En Portainer → **Containers** deberías ver:
- `cobrapy_api_1` — Running
- `cobrapy_postgres_1` — Running
- `cobrapy_redis_1` — Running
- `cobrapy_nginx_1` — Running

---

## Parte 8 — Migrar la base de datos

En Portainer → **Containers** → click en `cobrapy_api_1` → **Console** → Connect

```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## Parte 9 — Verificar que el API funciona

Desde tu navegador o Postman:
```
http://IP_DEL_VM/health
http://IP_DEL_VM/api  ← Swagger UI
```

---

## Parte 10 — Deploy del Dashboard en Vercel

1. Subir el repo a GitHub (si no está)
2. Ir a **vercel.com** → New Project → importar el repo
3. **Root Directory**: `dashboard`
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `http://IP_DEL_VM`
5. Click **Deploy**

Vercel da una URL tipo `cobrapy-dashboard.vercel.app` lista para usar.

---

## Actualizar el código (deploys futuros)

### Opción A — Desde el VM
```bash
cd cobrapy
git pull
docker compose -f docker-compose.prod.yml up -d --build api
```

### Opción B — Desde Portainer
**Stacks → cobrapy → Editor** → modificar → **Update the stack**

---

## Comandos útiles

```bash
# Ver logs del backend
docker compose -f docker-compose.prod.yml logs -f api

# Reiniciar un servicio
docker compose -f docker-compose.prod.yml restart api

# Ver uso de recursos
docker stats
```
