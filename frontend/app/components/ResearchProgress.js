'use client'

import { useEffect, useState } from 'react'
import { Brain, FileQuestion, BookOpen, FileText, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResearchProgress({ status, query }) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (status.progress) {
            setProgress(status.progress * 100)
        } else if (status.status === 'complete') {
            setProgress(100)
        }
    }, [status])

    const getStepIcon = (step) => {
        switch (step) {
            case 'follow_up_questions':
                return <FileQuestion className="text-primary-600" size={24} />
            case 'research_data':
                return <BookOpen className="text-primary-600" size={24} />
            case 'answering_questions':
                return <Brain className="text-primary-600" size={24} />
            case 'final_report':
                return <FileText className="text-primary-600" size={24} />
            default:
                return <Brain className="text-primary-600" size={24} />
        }
    }

    const getProgressColor = () => {
        if (status.status === 'error') return 'bg-red-500'
        if (status.status === 'complete') return 'bg-green-500'
        return 'bg-primary-600'
    }

    const getStatusTitle = () => {
        if (status.status === 'complete') return 'Research Complete'
        return 'Research in Progress'
    }

    // Define the correct step order and get step progress
    const stepOrder = ['follow_up_questions', 'answering_questions', 'research_data', 'final_report'];

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
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-3xl mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{getStatusTitle()}</h2>
                <p className="text-gray-600">{query}</p>
            </div>

            <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div
                    className={`h-full ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="mb-6 flex items-center gap-3">
                {getStepIcon(status.step)}
                <div className="flex-1">
                    <p className="font-medium">{status.message || 'Processing your research query...'}</p>
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
                    title="Generating Research Questions"
                    {...getStepStatus('follow_up_questions')}
                />

                <ProgressStage
                    title="Answering Research Questions"
                    {...getStepStatus('answering_questions')}
                    progress={status.step === 'answering_questions' ? progress : 0}
                />

                <ProgressStage
                    title="Gathering Additional Research Data"
                    {...getStepStatus('research_data')}
                />

                <ProgressStage
                    title="Compiling Final Report"
                    {...getStepStatus('final_report')}
                />
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
                {status.status === 'complete'
                    ? <p>Report generation complete! You can view the results below.</p>
                    : <p>This process may take several minutes to generate a comprehensive report</p>
                }
            </div>
        </div>
    )
}

function ProgressStage({ title, isActive, isDone, progress }) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${isActive ? 'border-primary-300 bg-primary-50' :
            isDone ? 'border-green-200 bg-green-50' :
                'border-gray-200'
            }`}>
            <div className={`w-6 h-6 flex items-center justify-center rounded-full ${isDone ? 'bg-green-500 text-white' :
                isActive ? 'bg-primary-500 text-white' :
                    'bg-gray-200 text-gray-500'
                }`}>
                {isDone ? (
                    <CheckCircle size={16} />
                ) : (
                    <span className="text-xs">{isActive ? <span className="animate-pulse">●</span> : ''}</span>
                )}
            </div>

            <div className="flex-1">
                <p className={`font-medium ${isDone ? 'text-green-700' :
                    isActive ? 'text-primary-700' :
                        'text-gray-500'
                    }`}>{title}</p>

                {isActive && progress > 0 && (
                    <div className="w-full bg-primary-100 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    )
} 