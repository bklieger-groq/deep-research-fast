'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Download, Share, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ResearchReport({ report }) {
    // Keep track of all expanded sections in an array
    const [expandedSections, setExpandedSections] = useState([])
    const [showQA, setShowQA] = useState(true)

    if (!report || !report.report) {
        return null
    }

    // Function to extract sections from the markdown
    const extractSections = (markdown) => {
        const lines = markdown.split('\n')
        const sections = []
        let currentSection = { title: '', content: '', level: 0 }
        let inQASection = false

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            // Check if this is a header line
            if (line.startsWith('# ')) {
                // This is the main title, not a section
                continue
            } else if (line.startsWith('## Questions and Detailed Answers')) {
                inQASection = true
                continue
            }

            if (inQASection) {
                continue // Skip the Q&A section for now
            }

            if (line.startsWith('## ')) {
                // Save the previous section if it exists
                if (currentSection.title) {
                    sections.push(currentSection)
                }

                // Start a new section
                currentSection = {
                    title: line.replace('## ', ''),
                    content: line + '\n',
                    level: 2
                }
            } else if (line.startsWith('### ') && currentSection.level <= 2) {
                // This is a subsection
                currentSection.content += line + '\n'
            } else {
                // Add to the current section's content
                currentSection.content += line + '\n'
            }
        }

        // Add the last section
        if (currentSection.title) {
            sections.push(currentSection)
        }

        return sections
    }

    // Function to extract Q&A section
    const extractQA = (markdown) => {
        const qaSection = markdown.split('## Questions and Detailed Answers')[1]
        return qaSection ? '## Questions and Detailed Answers' + qaSection : ''
    }

    // Extract sections and Q&A
    const sections = extractSections(report.report)
    const qaSection = extractQA(report.report)

    // Extract title from the report
    const title = report.report.split('\n')[0].replace('# ', '')

    // Set all sections to be expanded by default when sections array changes
    useEffect(() => {
        if (sections.length > 0) {
            const allSectionIndices = Array.from({ length: sections.length - 1 }, (_, i) => i);
            setExpandedSections(allSectionIndices);
        }
    }, [sections.length]);

    const toggleSection = (index) => {
        if (expandedSections.includes(index)) {
            setExpandedSections(expandedSections.filter(i => i !== index))
        } else {
            setExpandedSections([...expandedSections, index])
        }
    }

    const handleDownload = () => {
        if (!report.file_path) return

        const link = document.createElement('a')
        const filename = report.file_path.split('/').pop()

        // Create a blob from the markdown content
        const blob = new Blob([report.report], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)

        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const handleShare = () => {
        if (navigator.share && report.report) {
            navigator.share({
                title: title,
                text: 'Check out this research report on ' + title,
                // The actual report content is too large to share via the Web Share API
                // so we're only sharing the title
            })
                .catch(err => {
                    console.error('Error sharing:', err)
                })
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(title)
                .then(() => {
                    alert('Title copied to clipboard')
                })
                .catch(err => {
                    console.error('Could not copy text: ', err)
                })
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            {/* Report Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleDownload}
                        className="btn btn-sm btn-outline flex items-center gap-2"
                        disabled={!report.file_path}
                    >
                        <Download size={16} />
                        Download Report
                    </button>

                    <button
                        onClick={handleShare}
                        className="btn btn-sm btn-outline flex items-center gap-2"
                    >
                        <Share size={16} />
                        Share
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="markdown-container">
                {/* Render the first paragraph (summary) with full markdown */}
                <div className="markdown prose max-w-none mb-8">
                    <ReactMarkdown
                        children={sections[0]?.content || ''}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <SyntaxHighlighter
                                        children={String(children).replace(/\n$/, '')}
                                        style={atomDark}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                    />
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                )
                            }
                        }}
                    />
                </div>

                {/* Section Accordion - All expanded by default */}
                <div className="space-y-4 mb-8">
                    {sections.slice(1).map((section, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                onClick={() => toggleSection(index)}
                            >
                                <h3 className="font-semibold text-gray-800">{section.title}</h3>
                                {expandedSections.includes(index) ?
                                    <ChevronUp size={20} className="text-gray-500" /> :
                                    <ChevronDown size={20} className="text-gray-500" />
                                }
                            </button>

                            {expandedSections.includes(index) && (
                                <div className="p-4 markdown prose max-w-none">
                                    <ReactMarkdown
                                        children={section.content}
                                        components={{
                                            code({ node, inline, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        children={String(children).replace(/\n$/, '')}
                                                        style={atomDark}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        {...props}
                                                    />
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Questions and Answers Section */}
                {qaSection && (
                    <div className="mt-8">
                        <div className="markdown prose max-w-none border-t pt-4">
                            <ReactMarkdown
                                children={qaSection}
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                children={String(children).replace(/\n$/, '')}
                                                style={atomDark}
                                                language={match[1]}
                                                PreTag="div"
                                                {...props}
                                            />
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        )
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 