const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

module.exports = defineConfig({
    plugins: [react()],
    root: path.resolve(__dirname),
    build: {
        outDir: path.resolve(__dirname, "../client-dist"),
        emptyOutDir: true
    },
    server: {
        port: 5173,
        proxy: {
            "/api": "http://localhost:3000",
            "/download": "http://localhost:3000"
        }
    }
});
