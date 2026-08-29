# Deploy em VPS sem Docker

## 1) Preparar servidor Linux

- Ubuntu 22.04 LTS ou Debian 12
- Usuário sudo
- Node.js 20+
- Nginx
- PM2

## 2) Instalar Node.js

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 3) Clonar repositório no VPS

```bash
cd /var/www
sudo git clone https://github.com/SEU_USUARIO/SEU_REPO.git privatepay
cd privatepay
```

## 4) Instalar dependências

```bash
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

## 5) Configurar ambiente

Crie um arquivo `.env` no backend com valores reais:

```env
PORT=4000
JWT_SECRET=seu_jwt_super_seguro
NODE_ENV=production
```

No frontend, crie `.env.production`:

```env
VITE_API_URL=https://api.seudominio.com
```

## 6) Rodar em produção com PM2

```bash
sudo npm install -g pm2
cd /var/www/privatepay/backend
pm2 start "npm run start" --name privatepay-api
```

Para o frontend estático, gere o build e sirva com Nginx:

```bash
cd /var/www/privatepay/frontend
sudo rm -rf /var/www/html/privatepay
sudo mkdir -p /var/www/html/privatepay
sudo cp -r dist/* /var/www/html/privatepay/
```

## 7) Configurar Nginx

Arquivo `/etc/nginx/sites-available/privatepay`:

```nginx
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name app.seudominio.com;
    root /var/www/html/privatepay;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

Ative:

```bash
sudo ln -s /etc/nginx/sites-available/privatepay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 8) Segurança e produção

- Use HTTPS com Let's Encrypt
- Configure firewall UFW
- Use variáveis sensíveis no servidor e nunca no GitHub
- Mantenha `JWT_SECRET` forte e único
- Faça backups do diretório de dados
- Monitore logs do PM2 e do Nginx

## 9) GitHub

- Push do projeto para um repositório público ou privado
- Mantenha `.env` e segredos fora do Git
- Use GitHub Actions para CI opcional
```bash
git init
git add .
git commit -m "Initial gateway setup"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```
