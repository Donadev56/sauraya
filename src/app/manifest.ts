import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SAURAYA AI',
    short_name: 'SAURA',
    description: 'AN AI ASSISTANT ',
    start_url: '/',
    display: 'standalone',
    background_color: '#212121',
    theme_color: '#212121',
    icons: [
      {
        src: '/192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}