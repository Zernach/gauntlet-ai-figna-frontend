import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and related libraries
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          // Konva canvas library
          'konva-vendor': ['konva', 'react-konva'],
          // Supabase client
          'supabase-vendor': ['@supabase/supabase-js'],
          // OpenAI SDK (can be large)
          'openai-vendor': ['openai'],
        },
      },
    },
    // Increase chunk size warning limit to 600kb since we're now splitting
    chunkSizeWarningLimit: 600,
  },
})
