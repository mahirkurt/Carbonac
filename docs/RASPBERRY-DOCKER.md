# Raspberry Remote Runtime (Docker)

Bu dokuman, Carbonac projesindeki lokal sunucu sureclerinin Raspberry Pi uzerinde Docker ile calistirilmasi icindir.
Bu dokuman `docs/PROJE-TALIMATLARI.md` ile uyumlu olmak zorundadir.

## 1. Gereksinimler
- Raspberry Pi uzerinde Docker kurulu ve calisir.
- Yerel makinede Docker CLI kurulu.
- Tunnel kullanilacaksa cloudflared kurulu.
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
docker compose -f docker-compose.raspberry.yml up -d
```

Worker opsiyonel (profile ile):
```
docker compose -f docker-compose.raspberry.yml --profile worker up -d
```

Not: Worker icin Paged.js ve headless Chromium gereklidir. Container imajina eklenmediyse worker host uzerinden calistirilabilir.
Not: Compose dosyasi named volume kullanir; output ve temp verileri Raspberry uzerinde saklanir.
Not: Redis servisi compose icinde yoktur; `REDIS_URL` ile uzak Redis kullanilir.

## 5. Raspberry Repo Araclari (Bridge)
Raspberry repo (D:\Repositories\Raspberry) ile entegre komut calistirmak icin:

```
python scripts/raspberry/pi_bridge.py status
python scripts/raspberry/pi_bridge.py run "uname -a"
python scripts/raspberry/pi_bridge.py docker "ps -a"
python scripts/raspberry/pi_bridge.py compose --path ~/carbonac "up -d"
python scripts/raspberry/pi_bridge.py deploy-worker --path ~/carbonac --git-url <repo-url>
```

Varsayilan repo yolu `../Raspberry` olarak beklenir. Farkli ise:
```
set RASPBERRY_REPO_PATH=D:\Repositories\Raspberry
```

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
