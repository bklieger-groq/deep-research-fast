import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Research Assistant',
    description: 'A comprehensive research assistant powered by Groq LLMs',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-theme="light">
            <body className={inter.className}>
                <div className="min-h-screen flex flex-col">
                    <header className="bg-white border-b border-gray-200">
                        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl text-primary-700"></span>
                                <h1 className="text-xl">
                                    <a href="/" rel="noopener noreferrer" className="flex items-center gap-2">
                                        <img src="/groqlabs-logo-black.png" alt="Groq Labs" className="h-6" />
                                        <span className="font-normal text-gray-600 text-lg">/ Deep Research</span>
                                    </a>
                                </h1>
                            </div>
                            <nav>
                                <ul className="flex gap-4">
                                    <li>
                                        <a href="https://github.com/bklieger/deep-research-fast" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                            </svg>
                                            Star on GitHub
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </header>
                    <main className="flex-grow container mx-auto px-4 py-6 border-x border-gray-100">
                        {children}
                    </main>
                    <footer className="bg-gray-50 border-t border-gray-200">
                        <div className="container mx-auto px-4 py-4 text-center text-gray-500 text-sm">
                            <p>Research powered by Groq Compound Beta and Llama 4 Maverick</p>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    )
} 