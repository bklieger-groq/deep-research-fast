import Groq from 'groq-sdk';
import 'dotenv/config';
import path from 'path';

// Configure API keys
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const client = new Groq({
    apiKey: GROQ_API_KEY,
});

// Constants
const LLAMA_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct";
const COMPOUND_MODEL_MINI = "compound-beta-mini";

export async function generateFollowUpQuestions(query) {
    /**
     * Generate 3 Research questions using Llama-4-Maverick model
     */
    const prompt = `Based on the following research query, generate 3 specific research questions 
  that would help gather comprehensive information that would fully answer this question.
  The questions should explore different aspects of the topic and help elicit detailed information.
  Ensure the questions in their totality would fully answer the research query and are a little broad.
  The questions should not be too specific, but rather general and short enough to be answered with the research query.
  
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
  `;

    const completion = await client.chat.completions.create({
        model: COMPOUND_MODEL_MINI,
        messages: [{ role: "user", content: prompt }],
        search_settings: {
            include_images: true
        }
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

    // Extract and log images from search results
    let allImages = [];
    if (executedTools) {
        for (const tool of executedTools) {
            if (tool.type === 'search' && tool.search_results && tool.search_results.images) {
                allImages = [...allImages, ...tool.search_results.images];
            }
        }
    }

    return {
        question,
        answer,
        question_num: questionNum,
        total: totalQuestions,
        tool_results: {
            executed_tools: executedTools,
            images: allImages
        }
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

    // Only add research data if it exists and is not empty
    if (researchData && typeof researchData === 'string' && researchData.trim().length > 0) {
        context += `\nResearch Data:\n${researchData}\n\n`;
    }

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
  - Integrate information from the Research questions/answers
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