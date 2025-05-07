/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    experimental: {
        serverComponentsExternalPackages: ['groq'],
    },
    env: {
        GROQ_API_KEY: process.env.GROQ_API_KEY
    },
    serverRuntimeConfig: {
        // Will only be available on the server side
        GROQ_API_KEY: process.env.GROQ_API_KEY,
    },
    // Add CORS headers for API routes
    async headers() {
        return [
            {
                // Matching all API routes
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
                ],
            },
        ];
    },
    // Configure webpack to resolve path aliases
    webpack(config) {
        return config;
    }
}

module.exports = nextConfig