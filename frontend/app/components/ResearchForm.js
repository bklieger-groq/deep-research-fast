'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

export default function ResearchForm({ onSubmit }) {
    const [query, setQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (query.trim()) {
            onSubmit(query)
        }
    }

    return (
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Start Your Research</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className={`relative transition-all ${isFocused ? 'ring-2 ring-primary-300' : ''}`}>
                    <textarea
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 focus:outline-none transition-all resize-none min-h-[120px]"
                        placeholder="Enter your research query here..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                </div>

                <div className="flex gap-4 items-center">
                    <button
                        type="submit"
                        disabled={!query.trim()}
                        className="btn btn-primary px-6 py-3 flex items-center gap-2"
                    >
                        <Search size={18} />
                        Start Research
                    </button>

                    <div className="text-gray-500 text-sm">
                        This process may take a few minutes to generate a comprehensive report
                    </div>
                </div>
            </form>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <ExampleCard
                    title="Historical Events"
                    description="What factors led to the fall of the Roman Empire and what lessons can be drawn for modern societies?"
                    onClick={() => {
                        setQuery("What factors led to the fall of the Roman Empire and what lessons can be drawn for modern societies?")
                    }}
                />
                <ExampleCard
                    title="Scientific Research"
                    description="What are the latest developments in quantum computing and how might they impact data security?"
                    onClick={() => {
                        setQuery("What are the latest developments in quantum computing and how might they impact data security?")
                    }}
                />
                <ExampleCard
                    title="Business Analysis"
                    description="How have supply chain challenges impacted global business strategies in the last two years?"
                    onClick={() => {
                        setQuery("How have supply chain challenges impacted global business strategies in the last two years?")
                    }}
                />
            </div>
        </div>
    )
}

function ExampleCard({ title, description, onClick }) {
    return (
        <div
            className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
            onClick={onClick}
        >
            <h3 className="font-medium text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    )
} 