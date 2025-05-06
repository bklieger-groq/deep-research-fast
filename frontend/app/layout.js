import './globals.css'

export const metadata = {
    title: 'Research Assistant',
    description: 'A comprehensive research assistant powered by Groq LLMs',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-theme="light">
            <body>
                <div className="min-h-screen flex flex-col">
                    <header className="bg-white shadow-sm">
                        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-primary-700">🔬</span>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
                                    <a href="/" rel="noopener noreferrer" className="">
                                        Deep Research, Fast
                                    </a>
                                </h1>
                            </div>
                            <nav>
                                <ul className="flex gap-4">
                                    <li>
                                        <a href="https://groq.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary-600 transition-colors">
                                            Powered by Groq
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </header>
                    <main className="flex-grow container mx-auto px-4 py-6">
                        {children}
                    </main>
                    <footer className="bg-gray-50 border-t border-gray-200">
                        <div className="container mx-auto px-4 py-4 text-center text-gray-500 text-sm">
                            <p>Research Assistant powered by Groq Compound and Llama 4 Maverick</p>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    )
} 