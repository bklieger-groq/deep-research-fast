'use client'

import { useState, useEffect } from 'react'
import ResearchForm from './components/ResearchForm'
import ResearchProgress from './components/ResearchProgress'
import ResearchReport from './components/ResearchReport'

export default function Home() {
    const [query, setQuery] = useState('')
    const [isResearching, setIsResearching] = useState(false)
    const [progressStatus, setProgressStatus] = useState({ status: 'idle' })
    const [report, setReport] = useState(null)
    const [error, setError] = useState(null)
    const [abortController, setAbortController] = useState(null)

    useEffect(() => {
        // Cleanup function to abort fetch on component unmount
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [abortController]);

    const startResearch = async (query) => {
        setQuery(query)
        setIsResearching(true)
        setProgressStatus({ status: 'progress', step: 'starting', message: 'Starting research process...' })
        setReport(null)
        setError(null)

        try {
            // Abort any existing request
            if (abortController) {
                abortController.abort();
            }

            // Create a new abort controller
            const controller = new AbortController();
            setAbortController(controller);

            // Use fetch with signal from AbortController
            const response = await fetch('/api/research/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                // Decode and add to buffer
                buffer += decoder.decode(value, { stream: true });

                // Split on double newlines (SSE format)
                const events = buffer.split('\n\n');
                // Keep last potentially incomplete event in buffer
                buffer = events.pop() || '';

                for (const event of events) {
                    // Skip empty events
                    if (!event.trim()) continue;

                    // Extract data
                    const dataMatch = event.match(/^data: (.+)$/m);
                    if (dataMatch && dataMatch[1]) {
                        try {
                            const data = JSON.parse(dataMatch[1]);
                            console.log("Received update:", data);

                            if (data.status === 'progress') {
                                setProgressStatus(data);
                            } else if (data.status === 'complete') {
                                // Update progress to complete but don't set isResearching to false
                                // This ensures the progress component stays visible
                                setProgressStatus({
                                    ...data,
                                    status: 'complete',
                                    step: 'final_report',
                                    message: 'Report generation complete!'
                                });
                                setReport(data);
                            } else if (data.status === 'error') {
                                setError(data.message);
                                setProgressStatus({ status: 'error', message: data.message });
                                setIsResearching(false);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e, event);
                        }
                    }
                }
            }
        } catch (error) {
            // Don't treat aborts as errors
            if (error.name !== 'AbortError') {
                console.error('Error during research:', error);
                setError(error.message);
                setProgressStatus({ status: 'error', message: error.message });
                setIsResearching(false);
            }
        }
    }

    const resetResearch = () => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }

        setQuery('')
        setIsResearching(false)
        setProgressStatus({ status: 'idle' })
        setReport(null)
        setError(null)
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="space-y-8">
                {!isResearching && !report && (
                    <div className="mb-8">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-bold text-gray-800 mb-3">Deep Research, Fast</h1>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Using compound-beta on Groq to generate fast deep research reports by leveraging several compound-beta agents working in parallel.
                            </p>
                        </div>
                        <ResearchForm onSubmit={startResearch} />
                    </div>
                )}

                {(isResearching || progressStatus.status === 'progress' || progressStatus.status === 'complete') && (
                    <ResearchProgress status={progressStatus} query={query} />
                )}

                {report && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Research Results</h2>
                            <button
                                onClick={resetResearch}
                                className="btn btn-outline btn-primary"
                            >
                                Start New Research
                            </button>
                        </div>
                        <ResearchReport report={report} />
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <h3 className="text-lg font-semibold">Error</h3>
                        <p>{error}</p>
                        <button
                            onClick={resetResearch}
                            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
} 