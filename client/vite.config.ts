import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [tailwindcss(), react()],
    appType: 'spa', // Enables history API fallback for React Router
    server: {
        historyApiFallback: true, // Serve index.html for all routes on refresh
    },
});
