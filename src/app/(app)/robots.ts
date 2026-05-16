/* eslint-disable no-restricted-exports */
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  }
}
