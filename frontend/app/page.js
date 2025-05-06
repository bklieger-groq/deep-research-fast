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
    const [eventSource, setEventSource] = useState(null)

    useEffect(() => {
        // Cleanup function to close EventSource on component unmount
        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [eventSource]);

    const startResearch = async (query) => {
        setQuery(query)
        setIsResearching(true)
        setProgressStatus({ status: 'progress', step: 'starting', message: 'Starting research process...' })
        setReport(null)
        setError(null)

        try {
            // Close any existing EventSource
            if (eventSource) {
                eventSource.close();
            }

            // Create a new POST request with SSE
            const encodedQuery = encodeURIComponent(query);
            const es = new EventSource(`/api/research/stream?query=${encodedQuery}`);
            setEventSource(es);

            // Handle SSE events
            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.status === 'progress') {
                        setProgressStatus(data);
                    } else if (data.status === 'complete') {
                        setProgressStatus({ status: 'complete' });
                        setReport(data);
                        es.close();
                        setEventSource(null);
                    } else if (data.status === 'error') {
                        setError(data.message);
                        setProgressStatus({ status: 'error', message: data.message });
                        es.close();
                        setEventSource(null);
                    }
                } catch (e) {
                    console.error('Error parsing SSE data:', e, event.data);
                }
            };

            // Handle EventSource errors
            es.onerror = (err) => {
                console.error('EventSource error:', err);
                setError('Connection error. Please try again.');
                setProgressStatus({ status: 'error', message: 'Connection error' });
                es.close();
                setEventSource(null);
                setIsResearching(false);
            };

        } catch (error) {
            console.error('Error during research:', error);
            setError(error.message);
            setProgressStatus({ status: 'error', message: error.message });
            setIsResearching(false);
        }
    }

    const resetResearch = () => {
        if (eventSource) {
            eventSource.close();
            setEventSource(null);
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
                            <h1 className="text-4xl font-bold text-gray-800 mb-3">Comprehensive Research Assistant</h1>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Enter your research query to generate a detailed report with follow-up questions, research data, and sources.
                            </p>
                        </div>
                        <ResearchForm onSubmit={startResearch} />
                    </div>
                )}

                {(isResearching || progressStatus.status === 'progress') && (
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