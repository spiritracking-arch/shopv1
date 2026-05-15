#!/bin/bash
LANG=$1
PORT=$2

echo "Setup clone $LANG sur port $PORT..."

cp -r ~/my-shop ~/shop-$LANG
sudo -u postgres psql -c "CREATE DATABASE payloadshop_$LANG;" 2>/dev/null
sudo -u postgres pg_dump --schema-only payloadshop | sudo -u postgres psql payloadshop_$LANG 2>/dev/null

sed -i "s|payloadshop_${LANG}_${LANG}|payloadshop_$LANG|" ~/shop-$LANG/.env
sed -i "s|payloadshop$|payloadshop_$LANG|" ~/shop-$LANG/.env
sed -i "s|NEXT_PUBLIC_SERVER_URL=.*|NEXT_PUBLIC_SERVER_URL=http://76.13.141.69:$PORT|" ~/shop-$LANG/.env
sed -i "s|PAYLOAD_PUBLIC_SERVER_URL=.*|PAYLOAD_PUBLIC_SERVER_URL=http://76.13.141.69:$PORT|" ~/shop-$LANG/.env

cd ~/shop-$LANG && npm run build && pm2 start npm --name "shop-$LANG" -- start -- -p $PORT
echo "✅ Clone $LANG prêt sur port $PORT!"
