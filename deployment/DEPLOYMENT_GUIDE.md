# 🚀 Panduan Deployment Production Server MarsCargo Backend

Panduan ini mengatur deployment untuk **`mars-kargo-backend`** pada dua server production:
- **Proxy Server (IP: `49.128.186.84`)**: Menggunakan **Nginx** sebagai Front-end Reverse Proxy.
- **Apps Server (IP: `103.30.247.35`)**: Menggunakan **Apache2** + **PM2 (Node.js)** berjalan di **Port 7021**.

---

## 📍 Langkah 1: Setup di Apps Server (IP: `103.30.247.35`)

### 1.1 Jalankan Backend dengan PM2 di Port 7021
Masuk ke direktori projek di Apps Server, lalu jalankan:

```bash
cd /path/to/mars-kargo-backend

# Install dependencies
npm install

# Push Schema Prisma ke Database PostgreSQL (49.128.186.89:4825)
npx prisma generate
npx prisma db push

# Install PM2 jika belum ada
sudo npm install -g pm2

# Jalankan backend dengan PM2 di Port 7021
pm2 start ecosystem.config.cjs --env production

# Simpan state PM2 agar otomatis berjalan saat reboot server
pm2 save
pm2 startup
```

### 1.2 Konfigurasi Apache2 di Apps Server
1. Pastikan modul proxy Apache aktif:
```bash
sudo a2enmod proxy proxy_http headers rewrite
```

2. Tambahkan `Listen 7021` di berkas `/etc/apache2/ports.conf`:
```bash
echo "Listen 7021" | sudo tee -a /etc/apache2/ports.conf
```

3. Salin konfigurasi VirtualHost Apache:
```bash
sudo cp deployment/apache-apps-103.30.247.35.conf /etc/apache2/sites-available/mars-backend-7021.conf
```

4. Aktifkan konfigurasi site & reload Apache2:
```bash
sudo a2ensite mars-backend-7021.conf
sudo systemctl reload apache2
```

---

## 📍 Langkah 2: Setup di Proxy Server (IP: `49.128.186.84`)

### 2.1 Konfigurasi Nginx di Proxy Server
1. Salin konfigurasi Nginx ke Proxy Server:
```bash
sudo cp deployment/nginx-proxy-49.128.186.84.conf /etc/nginx/sites-available/api-marscargo.conf
```

2. Buat symlink untuk mengaktifkan site:
```bash
sudo ln -s /etc/nginx/sites-available/api-marscargo.conf /etc/nginx/sites-enabled/
```

3. Uji dan reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 2.2 Optional: Pasang SSL (HTTPS) Gratis dengan Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.marscargo.id
```

---

## 🧪 Langkah 3: Pengujian Koneksi API Production

Uji endpoint API healthcheck dari terminal atau browser:

```bash
# 1. Tes langsung ke PM2 Apps Server Port 7021
curl http://103.30.247.35:7021/api/health

# 2. Tes melalui Nginx Proxy Server (49.128.186.84)
curl http://49.128.186.84/api/health
```

Respon sukses:
```json
{
  "status": "OK",
  "service": "MarsCargo Dedicated Mobile & Web Backend API with Prisma ORM",
  "version": "1.0.0",
  "smtpUser": "admin@mscode.id",
  "database": "PostgreSQL (marskdb)"
}
```
