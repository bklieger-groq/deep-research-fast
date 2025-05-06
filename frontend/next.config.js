/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    async rewrites() {
        // Use BACKEND_HOST env variable, defaulting to localhost if not set
        const backendHost = process.env.BACKEND_HOST || 'http://localhost:8000';
        return [
            {
                source: '/api/:path*',
                destination: `${backendHost}/api/:path*`,
                // Add custom configuration for handling SSE streams properly
                has: [
                    {
                        type: 'header',
                        key: 'accept',
                        value: 'text/event-stream',
                    },
                ],
            },
            {
                // Regular API calls
                source: '/api/:path*',
                destination: `${backendHost}/api/:path*`,
            },
        ]
    },
}

module.exports = nextConfig