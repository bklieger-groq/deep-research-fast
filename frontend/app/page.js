'use client'

import { useState } from 'react'
import ResearchForm from './components/ResearchForm'
import ResearchProgress from './components/ResearchProgress'
import ResearchReport from './components/ResearchReport'

export default function Home() {
    const [query, setQuery] = useState('')
    const [isResearching, setIsResearching] = useState(false)
    const [progressStatus, setProgressStatus] = useState({ status: 'idle' })
    const [report, setReport] = useState(null)
    const [error, setError] = useState(null)

    const startResearch = async (query) => {
        setQuery(query)
        setIsResearching(true)
        setProgressStatus({ status: 'progress', step: 'starting', message: 'Starting research process...' })
        setReport(null)
        setError(null)

        try {
            const response = await fetch('/api/research/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
                const { value, done } = await reader.read()

                if (done) {
                    break
                }

                const text = decoder.decode(value)
                const lines = text.split('\n').filter(line => line.trim() !== '')

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line)

                        if (data.status === 'progress') {
                            setProgressStatus(data)
                        } else if (data.status === 'complete') {
                            setProgressStatus({ status: 'complete' })
                            setReport(data)
                        } else if (data.status === 'error') {
                            setError(data.message)
                            setProgressStatus({ status: 'error', message: data.message })
                        }
                    } catch (e) {
                        console.error('Error parsing stream data:', e)
                    }
                }
            }
        } catch (error) {
            console.error('Error during research:', error)
            setError(error.message)
            setProgressStatus({ status: 'error', message: error.message })
        } finally {
            setIsResearching(false)
        }
    }

    const resetResearch = () => {
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