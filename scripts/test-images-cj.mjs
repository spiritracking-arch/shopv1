import axios from 'axios'
import { config } from 'dotenv'
config()

const tokenRes = await axios.post('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
  email: process.env.CJ_EMAIL,
  password: process.env.CJ_API_KEY
})
const token = tokenRes.data.data.accessToken

const res = await axios.get('https://developers.cjdropshipping.com/api2.0/v1/product/query', {
  headers: { 'CJ-Access-Token': token },
  params: { pid: '2054843523533021185' }
})

const product = res.data.data
console.log('productImageSet:', product?.productImageSet)
console.log('bigImage:', product?.bigImage)
