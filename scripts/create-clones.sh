#!/bin/bash

LANGS=("de" "es" "it" "pt" "nl")
PORT=3002

for LANG in "${LANGS[@]}"; do
  echo "Creating clone $LANG on port $PORT..."
  
  # Copie le shop
  cp -r ~/my-shop ~/shop-$LANG
  
  # Crée la base de données
  sudo -u postgres psql -c "CREATE DATABASE payloadshop_$LANG;"
  
  # Met à jour le .env
  sed -i "s|payloadshop|payloadshop_$LANG|" ~/shop-$LANG/.env
  sed -i "s|NEXT_PUBLIC_SERVER_URL=.*|NEXT_PUBLIC_SERVER_URL=http://76.13.141.69:$PORT|" ~/shop-$LANG/.env
  sed -i "s|PAYLOAD_PUBLIC_SERVER_URL=.*|PAYLOAD_PUBLIC_SERVER_URL=http://76.13.141.69:$PORT|" ~/shop-$LANG/.env
  
  # Nginx
  cat > /etc/nginx/sites-available/$LANG.zojewel.com << NGINX
server {
    listen 80;
    server_name $LANG.zojewel.com;
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
NGINX
  ln -s /etc/nginx/sites-available/$LANG.zojewel.com /etc/nginx/sites-enabled/
  
  echo "✅ Clone $LANG prêt sur port $PORT"
  PORT=$((PORT + 1))
done

nginx -t && systemctl reload nginx
echo "🎉 5 clones créés !"
