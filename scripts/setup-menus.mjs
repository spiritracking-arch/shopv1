import axios from 'axios'
import { config } from 'dotenv'
config()

const CLONES = {
  fr: { port: 3001, shop: 'Boutique', account: 'Mon compte', orders: 'Commandes' },
  de: { port: 3002, shop: 'Shop', account: 'Mein Konto', orders: 'Bestellungen' },
  es: { port: 3003, shop: 'Tienda', account: 'Mi cuenta', orders: 'Pedidos' },
  it: { port: 3004, shop: 'Negozio', account: 'Il mio account', orders: 'Ordini' },
  pt: { port: 3005, shop: 'Loja', account: 'Minha conta', orders: 'Pedidos' },
  nl: { port: 3006, shop: 'Winkel', account: 'Mijn account', orders: 'Bestellingen' },
  ro: { port: 3007, shop: 'Magazin', account: 'Contul meu', orders: 'Comenzi' },
  cs: { port: 3008, shop: 'Obchod', account: 'Muj ucet', orders: 'Objednavky' },
  hu: { port: 3009, shop: 'Bolt', account: 'Fiokom', orders: 'Rendelesek' },
  sv: { port: 3010, shop: 'Butik', account: 'Mitt konto', orders: 'Bestallningar' },
  da: { port: 3011, shop: 'Butik', account: 'Min konto', orders: 'Bestillinger' },
  fi: { port: 3012, shop: 'Kauppa', account: 'Oma tili', orders: 'Tilaukset' },
  sk: { port: 3013, shop: 'Obchod', account: 'Moj ucet', orders: 'Objednavky' },
  bg: { port: 3014, shop: 'Magazin', account: 'Moyat akаunt', orders: 'Porachki' },
  hr: { port: 3015, shop: 'Trgovina', account: 'Moj racun', orders: 'Narudzbe' },
  el: { port: 3016, shop: 'Katalima', account: 'O logariasmós mou', orders: 'Paraggelies' },
  lt: { port: 3017, shop: 'Parduotuve', account: 'Mano paskyra', orders: 'Uzsakymai' },
  lv: { port: 3018, shop: 'Veikals', account: 'Mans konts', orders: 'Pasutijumi' },
  sl: { port: 3019, shop: 'Trgovina', account: 'Moj racun', orders: 'Narocila' },
  et: { port: 3020, shop: 'Pood', account: 'Minu konto', orders: 'Tellimused' },
  mt: { port: 3021, shop: 'Hanut', account: 'Il-kont tieghi', orders: 'Ordnijiet' },
  ga: { port: 3022, shop: 'Siopa', account: 'Mo chuntas', orders: 'Orduithe' }
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
    console.log('OK ' + lang)
  } catch(e) {
    console.log('ERR ' + lang + ': ' + e.message)
  }
}
