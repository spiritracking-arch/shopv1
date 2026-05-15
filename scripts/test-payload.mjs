import axios from 'axios'
import { config } from 'dotenv'
config()

const PAYLOAD_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

const res = await axios.post(`${PAYLOAD_URL}/api/users/login`, {
  email: process.env.PAYLOAD_ADMIN_EMAIL,
  password: process.env.PAYLOAD_ADMIN_PASSWORD
})

console.log('✅ Connecté à Payload:', res.data.user.email)
