import axios from 'axios'

const CF_TOKEN = process.env.CF_TOKEN
const ZONE_ID = '743f53eb2dc29ae32e3a2ba9ef0bcd7f'
const VPS_IP = '76.13.141.69'

const langues = ['de', 'es', 'it', 'pt', 'nl', 'pl', 'ro', 'cs', 'hu', 'sv', 'da', 'fi', 'sk', 'bg', 'hr', 'el', 'lt', 'lv', 'sl', 'et', 'mt', 'ga']

for (const lang of langues) {
  const res = await axios.post('https://api.cloudflare.com/client/v4/zones/' + ZONE_ID + '/dns_records', {
    type: 'A',
    name: lang,
    content: VPS_IP,
    proxied: true
  }, {
    headers: { Authorization: 'Bearer ' + CF_TOKEN }
  })
  console.log(lang + '.zojewel.com → ' + (res.data.success ? 'OK' : 'ERREUR'))
}
