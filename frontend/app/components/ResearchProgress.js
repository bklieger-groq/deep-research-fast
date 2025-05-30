'use client'

import { useEffect, useState } from 'react'
import { Brain, FileQuestion, BookOpen, FileText, CheckCircle, AlertCircle, Link, ExternalLink, Book, ChevronUp, ChevronDown } from 'lucide-react'

export default function ResearchProgress({ status, query }) {
    const [progress, setProgress] = useState(0)
    const [sources, setSources] = useState([])
    const [images, setImages] = useState([])
    const [totalDuration, setTotalDuration] = useState(null)

    useEffect(() => {
        if (status.progress) {
            setProgress(status.progress * 100)
        } else if (status.status === 'complete') {
            setProgress(100)
        }

        // Directly set sources and images from status
        if (status.sources) {
            setSources(status.sources)
        }
        if (status.images) {
            setImages(status.images)
        }

        // Update total duration if available
        if (status.timings && status.timings.total) {
            setTotalDuration(status.timings.total.duration);
        }
    }, [status])

    const getStepIcon = (step) => {
        switch (step) {
            case 'follow_up_questions':
                return <FileQuestion className="text-grey-500" size={24} strokeWidth={1.5} />
            case 'research_data':
                return <BookOpen className="text-grey-500" size={24} strokeWidth={1.5} />
            case 'answering_questions':
                return <Brain className="text-grey-500" size={24} strokeWidth={1.5} />
            case 'final_report':
                return <FileText className="text-grey-500" size={24} strokeWidth={1.5} />
            default:
                return <Brain className="text-grey-500" size={24} strokeWidth={1.5} />
        }
    }

    const getProgressColor = () => {
        if (status.status === 'error') return 'bg-red-500'
        if (status.status === 'complete') return 'bg-green-500'
        return 'bg-[#4ba8d1]'
    }

    const getStatusTitle = () => {
        if (status.status === 'complete') return 'Research Completed'
        return 'Research in Progress'
    }

    // Format duration in seconds with 1 decimal point
    const formatDuration = (ms) => {
        if (!ms) return '';
        return `${(ms / 1000).toFixed(1)} seconds`;
    };

    // Define the correct step order and get step progress
    const stepOrder = ['follow_up_questions', 'answering_questions', 'final_report'];

    const getStepStatus = (stepName) => {
        if (status.status === 'complete') {
            return { isActive: false, isDone: true };
        }

        const currentStepIndex = stepOrder.indexOf(status.step);
        const thisStepIndex = stepOrder.indexOf(stepName);

        if (currentStepIndex === -1 || thisStepIndex === -1) {
            return { isActive: false, isDone: false };
        }

        if (thisStepIndex === currentStepIndex) {
            return { isActive: true, isDone: false };
        }

        if (thisStepIndex < currentStepIndex) {
            return { isActive: false, isDone: true };
        }

        return { isActive: false, isDone: false };
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-3xl mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-xl text-gray-800 mb-2">{getStatusTitle()}</h2>
                <p className="text-gray-600">{query}</p>
                {totalDuration && (
                    <p className="text-gray-500 text-sm mt-1">Total time: {formatDuration(totalDuration)}</p>
                )}
            </div>

            <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div
                    className={`h-full ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="mb-6 flex items-center gap-3">
                <div className="ml-3">{getStepIcon(status.step)}</div>
                <div className="flex-1">
                    <p>{status.message || 'Processing your research query...'}</p>
                    {status.step === 'answering_questions' && (
                        <div className="mt-1 text-sm text-gray-500">
                            {Math.round(progress)}% complete
                        </div>
                    )}
                </div>

                {status.status === 'complete' && (
                    <CheckCircle className="text-green-500" size={24} />
                )}

                {status.status === 'error' && (
                    <AlertCircle className="text-red-500" size={24} />
                )}
            </div>

            <div className="space-y-3">
                {/* Follow the correct step order for display */}
                <ProgressStage
                    title="Stage 1: Generating Research Plan"
                    {...getStepStatus('follow_up_questions')}
                    timing={status.timings?.steps?.follow_up_questions}
                />

                <ProgressStage
                    title="Stage 2: Conducting Research (Compound Beta)"
                    {...getStepStatus('answering_questions')}
                    progress={status.step === 'answering_questions' ? progress : 0}
                    timing={status.timings?.steps?.answering_questions}
                />

                <ProgressStage
                    title="Stage 3: Compiling Final Report"
                    {...getStepStatus('final_report')}
                    timing={status.timings?.steps?.final_report}
                />
            </div>

            {/* Research Sources Section */}
            {sources.length > 0 && (
                <ResearchSources sources={sources} />
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
                {status.status === 'complete'
                    ? <p>Report generation complete! You can view the results below.</p>
                    : <p>This process may take several minutes. Just kidding, its powered by Groq. Expect results in ~10-15 seconds.</p>
                }
            </div>
        </div>
    )
}

function ProgressStage({ title, isActive, isDone, progress, timing }) {
    // Format duration in seconds with 1 decimal point
    const formatDuration = (ms) => {
        if (!ms) return '';
        return `${(ms / 1000).toFixed(1)}s`;
    };

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${isActive ? 'border-[#4ba8d1] bg-[#4ba8d1]/5' :
            isDone ? 'border-green-200 bg-green-50' :
                'border-gray-200'
            }`}>
            <div className={`w-6 h-6 flex items-center justify-center rounded-full ${isDone ? 'bg-green-500 text-white' :
                isActive ? 'bg-[#4ba8d1] text-white' :
                    'bg-gray-200 text-gray-500'
                }`}>
                {isDone ? (
                    <CheckCircle size={16} />
                ) : (
                    <span className="text-xs">{isActive ? <span className="animate-pulse">●</span> : ''}</span>
                )}
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <p className={`${isDone ? 'text-green-700' :
                        isActive ? 'text-[#4ba8d1]' :
                            'text-gray-500'
                        }`}>{title}</p>

                    {timing && timing.duration && (
                        <span className="text-xs text-gray-500">{formatDuration(timing.duration)}</span>
                    )}
                </div>

                {isActive && progress > 0 && (
                    <div className="w-full bg-[#4ba8d1]/10 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div
                            className="bg-[#4ba8d1] h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ResearchSources({ sources }) {
    const [expanded, setExpanded] = useState(false)

    // Deduplicate sources
    const uniqueSources = [...new Set(sources)];
    const displayCount = expanded ? uniqueSources.length : Math.min(3, uniqueSources.length)

    // Function to format domain from URL and ensure URL is properly formatted
    const formatDomain = (url) => {
        try {
            // Check if URL has protocol, if not add https://
            let formattedUrl = url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                formattedUrl = 'https://' + url;
            }
            const domain = new URL(formattedUrl).hostname.replace('www.', '')
            return domain
        } catch (error) {
            console.log("Error formatting URL:", url, error);
            // If URL parsing fails, just return the original string
            return url
        }
    }

    // Function to ensure URL is properly formatted for href
    const formatUrl = (url) => {
        try {
            // Check if URL has protocol, if not add https://
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return 'https://' + url;
            }
            return url;
        } catch (error) {
            console.log("Error formatting URL for href:", url, error);
            return url;
        }
    }

    // Function to get favicon URL
    const getFaviconUrl = (url) => {
        try {
            const domain = formatDomain(url);
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch (error) {
            console.log("Error getting favicon:", url, error);
            return '';
        }
    }

    return (
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-700">
                    <Book size={18} />
                    <h3>Works Consulted ({uniqueSources.length})</h3>
                </div>
                {uniqueSources.length > 3 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {uniqueSources.slice(0, displayCount).map((url, index) => (
                    <a
                        key={index}
                        href={formatUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
                    >
                        <img
                            src={getFaviconUrl(url)}
                            alt=""
                            className="w-4 h-4 flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <span className="truncate flex-1 text-gray-700">{formatDomain(url)}</span>
                        <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
                    </a>
                ))}
            </div>

            {uniqueSources.length > 3 && expanded === false && (
                <button
                    onClick={() => setExpanded(true)}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                    Show {uniqueSources.length - 3} more sources
                </button>
            )}

            {expanded && uniqueSources.length > 3 && (
                <button
                    onClick={() => setExpanded(false)}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                    Show less
                </button>
            )}
        </div>
    )
}
