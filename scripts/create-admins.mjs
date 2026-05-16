import axios from 'axios'
import { config } from 'dotenv'
config()

const CLONES = {
  de: 3002, it: 3004, pt: 3005, nl: 3006,
  ro: 3007, cs: 3008, hu: 3009, sv: 3010,
  da: 3011, fi: 3012, sk: 3013, bg: 3014,
  hr: 3015, el: 3016, lt: 3017, lv: 3018,
  sl: 3019, et: 3020, mt: 3021, ga: 3022
}

for (const [lang, port] of Object.entries(CLONES)) {
  try {
    const res = await axios.post('http://localhost:' + port + '/api/users', {
      email: process.env.PAYLOAD_ADMIN_EMAIL,
      password: process.env.PAYLOAD_ADMIN_PASSWORD,
      role: 'admin'
    })
    console.log('OK ' + lang + ': admin cree')
  } catch(e) {
    console.log('ERR ' + lang + ': ' + (e.response?.data?.errors?.[0]?.message || e.message))
  }
}
