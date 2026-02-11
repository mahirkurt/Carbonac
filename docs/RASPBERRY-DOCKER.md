# Raspberry Remote Runtime (Docker)

Bu dokuman, Carbonac projesindeki lokal sunucu sureclerinin Raspberry Pi uzerinde Docker ile calistirilmasi icindir.
Bu dokuman `docs/PROJE-TALIMATLARI.md` ile uyumlu olmak zorundadir.

## 1. Gereksinimler
- Raspberry Pi uzerinde Docker kurulu ve calisir.
- Yerel makinede Docker CLI kurulu.
- Tunnel kullanilacaksa cloudflared kurulu.
- Kalici Cloudflare SSH icin Access service token (client id/secret) hazir.
- Alternatif olarak Tailscale opsiyonel (PI uzerinde ve komut calistiran makinada).
- SSH konfigurasyonu: `pi-remote` host alias.
- Uzak Redis URL'i `REDIS_URL` ile saglanir.

## 2. SSH Baglantisini Kalici Hale Getirme
Windows icin ornek SSH config girdisi:

```
Host pi-remote
    HostName ssh.cureonics.com
    User mahirkurt
    ProxyCommand cloudflared access ssh --hostname %h
    IdentityFile ~/.ssh/id_ed25519
```

Kurulum scripti (opsiyonel):
```
scripts/raspberry/setup-ssh.ps1
```

Baglanti testi:
```
ssh pi-remote "echo ok"
```

Kalici Cloudflare SSH (service token) icin `.env`:
```
PI_HOSTNAME=ssh.cureonics.com
CLOUDFLARE_ACCESS_CLIENT_ID=...
CLOUDFLARE_ACCESS_CLIENT_SECRET=...
PI_PROXY_COMMAND=cloudflared access ssh --hostname %h --id $CLOUDFLARE_ACCESS_CLIENT_ID --secret $CLOUDFLARE_ACCESS_CLIENT_SECRET
```

## 2.1 Baglanti Modlari (Local/Tailscale/Tunnel)
Bridge, baglanti hedeflerini su sirayla dener (varsayilan):
```
PI_SSH_TARGETS=local,tailscale,tunnel
```

Kullanilan degiskenler:
- `PI_LOCAL_IP`: yerel ag IP adresi
- `PI_TAILSCALE_IP`: Tailscale IP (opsiyonel)
- `PI_HOSTNAME`: tunnel veya public hostname
- `PI_PROXY_COMMAND`: cloudflared access ssh komutu (opsiyonel)
- `PI_SSH_TARGETS`: deneme sirasi

Not: `PI_SSH_TARGETS=tunnel` ile sadece tunnel kullanilir.

## 3. Docker Context (Kalici)
Raspberry icin Docker context olusturup varsayilan yapin:
```
scripts/raspberry/setup-docker-context.ps1
```

Kontrol:
```
docker context ls
docker ps
```

Local contexta donmek icin:
```
scripts/raspberry/use-local-context.ps1
```

## 4. Raspberry Uzerinde Compose Calistirma
Raspberry icin compose dosyasi:
```
docker-compose.raspberry.yml
```

Baslatma (API):
```
docker compose -f docker-compose.raspberry.yml --profile api up -d
```

Worker (profile ile):
```
docker compose -f docker-compose.raspberry.yml --profile worker up -d
```

API + Worker birlikte:
```
docker compose -f docker-compose.raspberry.yml --profile api --profile worker up -d
```

Not: Profil kullanildigi icin `docker compose up -d` tek basina sadece profili olmayan servisleri (redis) calistirir.
Not: Worker icin Paged.js ve headless Chromium gereklidir. `PUPPETEER_SKIP_DOWNLOAD=1` ve `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` ayarlidir.
Not: Compose dosyasi named volume kullanir; output ve temp verileri Raspberry uzerinde saklanir.
Not: Redis servisi compose icinde vardir; `REDIS_URL=redis://redis:6379` kullanilir.
Not: API/worker `.env` ile calisir (Supabase/Gemini anahtarlari dahil).

## 5. Raspberry Repo Araclari (Bridge)
Raspberry repo (D:\Repositories\Raspberry) ile entegre komut calistirmak icin:

```
python scripts/raspberry/pi_bridge.py status
python scripts/raspberry/pi_bridge.py run "uname -a"
python scripts/raspberry/pi_bridge.py docker "ps -a"
python scripts/raspberry/pi_bridge.py compose --path ~/carbonac "up -d"
python scripts/raspberry/pi_bridge.py deploy-worker --path ~/carbonac --git-url <repo-url>
python scripts/raspberry/pi_bridge.py deploy-smoke --path ~/carbonac --git-url <repo-url>
```

Varsayilan repo yolu `../Raspberry` olarak beklenir. Farkli ise:
```
set RASPBERRY_REPO_PATH=D:\Repositories\Raspberry
```

`deploy-smoke` komutu:
- Pi tarafinda `git pull` + `docker compose` ile api+worker gunceller.
- Lokal ortamda `scripts/tests/api-smoke.js` calistirir.
- Loglari `output/smoke/pi-deploy-<timestamp>.log` altina kaydeder.

## 6. Frontend Icin API Adresi
Frontend calisirken API adresi Raspberry'ye yonlendirilmelidir.
Ornek:
```
VITE_API_URL=http://raspberrypi.local:3001
```

## 7. Sorun Giderme
- SSH hatasi: `ssh -v pi-remote` ile kontrol edin.
- Docker context: `docker context use raspberry`
- Redis baglantisi: `REDIS_URL` degerini uzak Redis endpointi olarak ayarlayin.

## 8. Guncel Durum Profili
- Cloudflare tunnel + service token ile tunnel baglantisi stabil.
- Pi uzerinde Docker API/worker kurulumlari dogrulandi.

## 9. Sonraki Adimlar
- Raspberry `.env` ile Carbonac `.env` senkronu korunmali.
- Worker image rebuild ve smoke testleri periyodik calistirilmali.

## 10. Domain Deploy (carbonac.com)
Backend:
- Cloudflare tunnel ingress: `api.carbonac.com -> http://localhost:3001`
- DNS: `api.carbonac.com` icin CNAME kaydi `CLOUDFLARE_TUNNEL_ID.cfargotunnel.com`
- TLS: Cloudflare proxy (SSL/TLS mode: Full) onerilir.

Frontend (Netlify):
- `frontend/netlify.toml` icinde `VITE_API_URL=https://api.carbonac.com`
- Netlify UI'de custom domain `carbonac.com` tanimlanir ve SSL aktif edilir.

Cloudflare otomasyon (opsiyonel):
- `../Raspberry/scripts/setup_carbonac_domain.py` (zone + DNS + tunnel ingress merge)
- GoDaddy kullaniyorsaniz `GODADDY_API_KEY` ve `GODADDY_API_SECRET` ayarlayin.
