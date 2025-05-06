import Groq from 'groq-sdk';
import 'dotenv/config';
import path from 'path';

// Server-side only imports
let fs = { existsSync: () => true, mkdirSync: () => { } };
if (typeof window === 'undefined') {
    // We're on the server
    fs = require('fs');

    // Create .groq directory if it doesn't exist
    if (!fs.existsSync('.groq')) {
        fs.mkdirSync('.groq', { recursive: true });
    }
}

// Configure API keys
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const client = new Groq({
    apiKey: GROQ_API_KEY,
});

// Constants
const LLAMA_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct";
const LLAMA_MODEL_MINI = "meta-llama/llama-4-scout-17b-16e-instruct";
const COMPOUND_MODEL = "compound-beta";
const COMPOUND_MODEL_MINI = "compound-beta-mini";

export async function generateFollowUpQuestions(query) {
    /**
     * Generate 3 Research questions using Llama-4-Maverick model
     */
    const prompt = `Based on the following research query, generate 3 specific Research questions 
  that would help gather more comprehensive information for compound research.
  The questions should explore different aspects of the topic and help elicit detailed information.
  
  Research Query: ${query}
  
  Format your response as a JSON array of 3 questions only. No preamble or explanation.
  Example: ["Question 1?", "Question 2?", "Question 3?"]
  `;

    const completion = await client.chat.completions.create({
        model: LLAMA_MODEL,
        messages: [{ role: "user", content: prompt }]
    });

    const response = completion.choices[0].message.content;

    // Try to parse the response as JSON
    try {
        let questions = JSON.parse(response);
        if (!Array.isArray(questions)) {
            // If not a list, try to extract a JSON array from the text
            const jsonMatch = response.match(/\[.*\]/s);
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                questions = [];
            }
        }

        // Ensure we have 5 or less questions
        if (questions.length > 5) {
            questions = questions.slice(0, 5);
        }

        return questions;
    } catch (error) {
        // If parsing fails, try to extract an array from the text
        const jsonMatch = response.match(/\[.*\]/s);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                return [];
            }
        } else {
            return [];
        }
    }
}

export async function answerQuestion(query, question, questionNum, totalQuestions) {
    /**
     * Use Compound-Beta to answer a Research question with sources and hyperlinks
     */
    const prompt = `You are a knowledgeable research assistant. You MUST call a search tool. Please answer the following question
  based on the context of this research query: "${query}"

  Question: ${question}
  
  Provide a factual answer with relevant information. Include sources or data if available.
  VERY IMPORTANT: When citing sources, include hyperlinks to those sources in your answer.
  Use the format [Source Name](URL) for all citations.
  Focus on accuracy and relevance to the research topic.
  `;

    const completion = await client.chat.completions.create({
        model: COMPOUND_MODEL_MINI,
        messages: [{ role: "user", content: prompt }]
    });

    const answer = completion.choices[0].message.content;

    // Look for executed_tools in different possible locations
    let executedTools = null;
    if (completion.choices[0].message.executed_tools) {
        executedTools = completion.choices[0].message.executed_tools;
    } else if (completion.choices[0].message.tool_results?.executed_tools) {
        executedTools = completion.choices[0].message.tool_results.executed_tools;
    } else if (completion.choices[0].executed_tools) {
        executedTools = completion.choices[0].executed_tools;
    } else if (completion.executed_tools) {
        executedTools = completion.executed_tools;
    }

    return {
        question,
        answer,
        question_num: questionNum,
        total: totalQuestions,
        tool_results: { executed_tools: executedTools }
    };
}

export async function gatherResearchData(query, qaPairs) {
    /**
     * Use Compound-Beta to gather targeted research data with hyperlinked sources
     */
    let context = `Main Query: ${query}\n\nAdditional Information:\n`;

    for (let i = 0; i < qaPairs.length; i++) {
        context += `${i + 1}. Question: ${qaPairs[i].question}\nAnswer: ${qaPairs[i].answer}\n\n`;
    }

    const prompt = `You are a research assistant tasked with gathering detailed research data. You MUST call a search tool.
  I need you to search for information related to this research query and the Research questions.
  
  ${context}
  
  Gather comprehensive research data with these requirements:
  1. Search for relevant facts, statistics, and information
  2. Find authoritative sources for each piece of information
  3. VERY IMPORTANT: Include HYPERLINKED citations for ALL information using markdown format: [Source Name](URL)
  4. Gather diverse perspectives on the topic
  5. Focus on recent and reliable information
  6. Structure information clearly with headings when appropriate
  
  For EACH piece of information, follow this pattern:
  - State the fact or information clearly
  - Provide the source with a hyperlink: [Source Name](URL)
  - Add brief context about why this information is relevant
  
  Format your response in clear sections based on different aspects of the topic.
  `;

    const completion = await client.chat.completions.create({
        model: COMPOUND_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8192
    });

    const content = completion.choices[0].message.content;

    // Look for executed_tools in different possible locations
    let executedTools = null;
    if (completion.choices[0].message.executed_tools) {
        executedTools = completion.choices[0].message.executed_tools;
    } else if (completion.choices[0].message.tool_results?.executed_tools) {
        executedTools = completion.choices[0].message.tool_results.executed_tools;
    } else if (completion.choices[0].executed_tools) {
        executedTools = completion.choices[0].executed_tools;
    } else if (completion.executed_tools) {
        executedTools = completion.executed_tools;
    }

    return {
        content,
        tool_results: { executed_tools: executedTools }
    };
}

export async function generateCompleteReport(query, qaPairs, researchData) {
    /**
     * Generate a complete report using Llama-4-Maverick
     */
    // Create context with all the necessary information
    let context = `Research Query: ${query}

Research Questions and Answers:
`;

    for (let i = 0; i < qaPairs.length; i++) {
        context += `Q${i + 1}: ${qaPairs[i].question}\nA${i + 1}: ${qaPairs[i].answer}\n\n`;
    }

    context += `\nResearch Data:\n${researchData}\n\n`;

    const prompt = `You are tasked with writing a comprehensive research report based on the provided information.
  
  ${context}
  
  Create a complete, well-structured research report with these sections:
  
  1. A descriptive, professional title for the report (7-12 words)
  2. An executive summary (2-3 paragraphs)
  3. 4-6 main content sections that cover different aspects of the topic
  4. A conclusion section
  
  Requirements:
  - Structure each section with appropriate headers using markdown (# for title, ## for major sections, ### for subsections)
  - Include factual information with HYPERLINKED CITATIONS using markdown format: [Source Name](URL)
  - Integrate information from both the Research questions/answers and the research data
  - Provide your own analysis and insights in addition to the facts
  - Use academic, professional language throughout
  - Each section should have substantial content (3-4 paragraphs)
  - End with a conclusion that summarizes key findings and suggests areas for future research
  
  Format your response using proper markdown, with clear section breaks.
  `;

    const completion = await client.chat.completions.create({
        model: LLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8192
    });

    return completion.choices[0].message.content;
}

export function formatSSE(data, event = undefined) {
    /**
     * Format data as SSE event
     */
    let message = `data: ${typeof data === 'string' ? data : JSON.stringify(data)}`;
    if (event !== undefined) {
        message = `event: ${event}\n${message}`;
    }
    return message + "\n\n";
} 