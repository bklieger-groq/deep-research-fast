'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Download, Share, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Image } from 'lucide-react'
import { useState, useEffect } from 'react'


export default function ResearchReport({ report }) {
    // Keep track of all expanded sections in an array
    const [expandedSections, setExpandedSections] = useState([])
    const [showShareMessage, setShowShareMessage] = useState(false)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [galleryExpanded, setGalleryExpanded] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)

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

    // Function to handle image click
    const handleImageClick = (url) => {
        setSelectedImage(url);
    };

    // Function to close modal
    const handleCloseModal = () => {
        setSelectedImage(null);
    };

    const handleDownload = async () => {
        try {
            setIsGeneratingPDF(true);

            // Get the title for the filename
            const title = report.report.split('\n')[0].replace('# ', '') || 'research';

            // Create a data URL with the HTML content
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                            line-height: 1.6;
                            padding: 20px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .markdown-body { font-size: 12px; }
                        .markdown-body pre > code { white-space: pre-wrap; }
                        @media print {
                            @page { margin: 20mm; }
                            body { padding: 0; }
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                </head>
                <body class="markdown-body">
                    <div id="content"></div>
                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(report.report)});
                            setTimeout(() => {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            }, 1000);
                        });
                    </script>
                </body>
                </html>
            `;

            // Create a blob with the HTML content
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            // Open a new window with the blob URL
            const printWindow = window.open(url, '_blank');

            if (!printWindow) {
                alert('Please allow popups for PDF generation');
                setIsGeneratingPDF(false);
                URL.revokeObjectURL(url);
                return;
            }

            // Set up a listener to clean up resources when the window is closed
            const checkWindowClosed = setInterval(() => {
                if (printWindow.closed) {
                    clearInterval(checkWindowClosed);
                    URL.revokeObjectURL(url);
                    setIsGeneratingPDF(false);
                }
            }, 1000);

        } catch (error) {
            console.error('Error generating PDF:', error);
            setIsGeneratingPDF(false);
        }
    }

    const handleShare = () => {
        // Show "Coming soon!" message
        setShowShareMessage(true);
        setTimeout(() => setShowShareMessage(false), 3000); // Hide after 3 seconds
    }

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

    // Custom image component for ReactMarkdown
    const ImageComponent = ({ src, alt }) => {
        return (
            <div className="my-6">
                <img
                    src={src}
                    alt={alt || 'Research image'}
                    className="w-full rounded-lg shadow-md"
                    loading="lazy"
                />
            </div>
        )
    }

    // Custom components for ReactMarkdown
    const components = {
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
        },
        img: ImageComponent
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Report Header */}
            <div className="mb-6">
                <h1 className="text-2xl text-gray-800 mb-4">{title}</h1>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleDownload}
                        disabled={isGeneratingPDF}
                        className="btn btn-sm btn-outline flex items-center gap-2"
                    >
                        <Download size={16} />
                        {isGeneratingPDF ? 'Generating PDF...' : 'Download Report'}
                    </button>

                    <button
                        onClick={handleShare}
                        className="btn btn-sm btn-outline flex items-center gap-2 relative"
                    >
                        <Share size={16} />
                        Share
                        {showShareMessage && (
                            <div className="absolute -top-10 left-0 right-0 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-90">
                                Coming soon!
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div id="research-report-container" className="markdown-container">
                {/* Image Gallery - Before Executive Summary */}
                {report.images && report.images.length > 0 && (
                    <div className="mb-8">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Image size={18} />
                                    <h3>Images ({report.images.length})</h3>
                                </div>
                                {report.images.length > 3 && (
                                    <button
                                        onClick={() => setGalleryExpanded(!galleryExpanded)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        {galleryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {report.images.slice(0, galleryExpanded ? undefined : 3).map((url, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleImageClick(url)}
                                        className="block aspect-video rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                        <img
                                            src={url}
                                            alt={`Research image ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>

                            {report.images.length > 3 && !galleryExpanded && (
                                <button
                                    onClick={() => setGalleryExpanded(true)}
                                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Show {report.images.length - 3} more images
                                </button>
                            )}

                            {galleryExpanded && report.images.length > 3 && (
                                <button
                                    onClick={() => setGalleryExpanded(false)}
                                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Show less
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Image Modal */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
                        onClick={handleCloseModal}
                    >
                        <div className="relative max-w-4xl w-full">
                            <button
                                onClick={handleCloseModal}
                                className="absolute -top-12 right-0 text-white hover:text-gray-300"
                            >
                                <ChevronUp size={24} />
                            </button>
                            <img
                                src={selectedImage}
                                alt="Full size research image"
                                className="w-full h-auto rounded-lg"
                            />
                        </div>
                    </div>
                )}

                {/* Render the first paragraph (summary) with full markdown */}
                <div className="markdown prose max-w-none mb-8">
                    <ReactMarkdown
                        children={sections[0]?.content || ''}
                        components={components}
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
                                <h3 className="text-gray-800">{section.title}</h3>
                                {expandedSections.includes(index) ?
                                    <ChevronUp size={20} className="text-gray-500" /> :
                                    <ChevronDown size={20} className="text-gray-500" />
                                }
                            </button>

                            {expandedSections.includes(index) && (
                                <div className="p-4 markdown prose max-w-none">
                                    <ReactMarkdown
                                        children={section.content}
                                        components={components}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Questions and Answers Section */}
                {qaSection && (
                    <div className="mt-8">
                        <div className="markdown prose max-w-none border-t border-gray-200 pt-4">
                            <ReactMarkdown
                                children={qaSection}
                                components={components}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 