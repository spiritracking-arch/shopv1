import axios from 'axios'
import { config } from 'dotenv'
config()

const CLONES = {
  de: { port: 3003, shop: 'Shop', account: 'Mein Konto', orders: 'Bestellungen' },
  es: { port: 3002, shop: 'Tienda', account: 'Mi cuenta', orders: 'Pedidos' }
}

async function getToken(port) {
  const res = await axios.post('http://localhost:' + port + '/api/users/login', {
    email: process.env.PAYLOAD_ADMIN_EMAIL,
    password: process.env.PAYLOAD_ADMIN_PASSWORD
  })
  return res.data.token
}

for (const [lang, data] of Object.entries(CLONES)) {
  try {
    const token = await getToken(data.port)
    await axios.post('http://localhost:' + data.port + '/api/globals/header', {
      navItems: [
        { link: { type: 'custom', url: '/shop', label: data.shop } },
        { link: { type: 'custom', url: '/account', label: data.account } },
        { link: { type: 'custom', url: '/orders', label: data.orders } }
      ]
    }, { headers: { Authorization: 'JWT ' + token } })
    console.log('✅ ' + lang)
  } catch(e) {
    console.log('❌ ' + lang + ': ' + e.message)
  }
}
