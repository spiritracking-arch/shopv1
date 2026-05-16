$(cat /mnt/user-data/outputs/TRANSLATIONS_README.md)

## SSL Cloudflare Origin (ajouté le 16/05/2026)

- Mode : Full (Strict)
- Cert : /etc/ssl/cloudflare/zojewel-chain.pem
- Clé : /etc/ssl/cloudflare/zojewel.key
- Nginx : HTTPS port 443 sur tous les clones
- Redirect HTTP → HTTPS automatique
