export const dynamic = 'force-dynamic';

export async function POST(request) {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

    try {
        // Get query from request body
        const { query } = await request.json();

        // Forward the request to the backend
        const backendResponse = await fetch(`${BACKEND_URL}/api/research/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        // Check if the response was successful
        if (!backendResponse.ok) {
            return new Response(
                JSON.stringify({
                    status: 'error',
                    message: `Backend returned error: ${backendResponse.status}`
                }),
                { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Create a new TransformStream to properly handle SSE
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        // Process the backend stream
        (async () => {
            try {
                const reader = backendResponse.body.getReader();
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    // Forward the chunks directly, maintaining SSE format
                    await writer.write(value);
                }
            } catch (error) {
                console.error('Error processing stream:', error);
                // Send error as SSE event
                const errorMsg = `data: ${JSON.stringify({ status: 'error', message: error.message })}\n\n`;
                await writer.write(encoder.encode(errorMsg));
            } finally {
                await writer.close();
            }
        })();

        // Return the stream with appropriate headers for SSE
        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error in API route:', error);
        return new Response(
            JSON.stringify({ status: 'error', message: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 