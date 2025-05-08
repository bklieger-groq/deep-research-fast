import {
    generateFollowUpQuestions,
    answerQuestion,
    generateCompleteReport,
    formatSSE
} from './research';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper function to encode SSE messages
function encodeSSE(data, event = undefined) {
    let message = `data: ${typeof data === 'string' ? data : JSON.stringify(data)}`;
    if (event !== undefined) {
        message = `event: ${event}\n${message}`;
    }
    return message + "\n\n";
}

// Helper function to extract URLs from search-type executed_tools
function extractSearchUrls(executedTools) {
    const searchUrls = [];

    if (!executedTools || !Array.isArray(executedTools)) {
        return searchUrls;
    }

    for (const tool of executedTools) {
        if (tool.type === 'search') {
            try {
                // Extract URL from output if available
                if (tool.output) {
                    const outputString = typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output);

                    // Based on the example, each result has a Title, URL, Content, and Score pattern
                    // Extract all URLs using this format
                    const lines = outputString.split('\n');
                    let currentUrl = null;

                    for (const line of lines) {
                        if (line.startsWith('URL: ')) {
                            currentUrl = line.substring(5).trim();
                            if (currentUrl && !searchUrls.includes(currentUrl)) {
                                searchUrls.push(currentUrl);
                            }
                        }
                    }

                    // If no URLs found with direct parsing, try regex patterns
                    if (searchUrls.length === 0) {
                        // Match URL: pattern
                        const urlRegex = /URL:\s*([^\n]+)/g;
                        let match;

                        while ((match = urlRegex.exec(outputString)) !== null) {
                            const url = match[1].trim();
                            if (!searchUrls.includes(url) && url.length > 10) {
                                searchUrls.push(url);
                            }
                        }
                    }
                }

                // Also check the arguments field which may contain search query information
                if (tool.arguments && searchUrls.length === 0) {
                    let argsObj;

                    try {
                        // Arguments could be a string containing JSON
                        if (typeof tool.arguments === 'string') {
                            argsObj = JSON.parse(tool.arguments);
                        } else {
                            argsObj = tool.arguments;
                        }

                        // If we have a query in the arguments, add it as a source
                        if (argsObj.query) {
                            // For search queries, we'll create a Google search URL
                            const searchURL = `https://www.google.com/search?q=${encodeURIComponent(argsObj.query)}`;
                            if (!searchUrls.includes(searchURL)) {
                                searchUrls.push(searchURL);
                            }
                        }
                    } catch (argError) {
                        console.error("Error parsing arguments:", argError);
                    }
                }
            } catch (error) {
                console.error('Error processing search tool:', error);
            }
        }
    }

    return searchUrls;
}

// Generator function for the research process
async function* researchProcessGenerator(query) {
    try {
        // Track all research sources
        const researchSources = [];

        // Keep track of timing information
        const timings = {
            start: Date.now(),
            steps: {}
        };

        // Step 1: Generate Research questions
        const stepStartTime = Date.now();
        yield encodeSSE(JSON.stringify({
            status: 'progress',
            step: 'follow_up_questions',
            message: 'Generating Research plan...',
            sources: researchSources
        }));

        const questions = await generateFollowUpQuestions(query);

        // Record timing for this step
        timings.steps.follow_up_questions = {
            duration: Date.now() - stepStartTime,
            completed: Date.now()
        };

        // List to store completed QA pairs
        const qaPairs = [];

        // Step 2: Start answering questions (before research data)
        const answeringStartTime = Date.now();
        yield encodeSSE(JSON.stringify({
            status: 'progress',
            step: 'answering_questions',
            message: 'Conducting research with Compound Beta\'s search...',
            progress: 0,
            timings: timings,
            sources: researchSources
        }));

        // Process questions
        const totalQuestions = questions.length;
        let completedQuestions = 0;

        // Use Promise.all to run all question-answering tasks in parallel
        const questionPromises = questions.map((question, index) =>
            answerQuestion(query, question, index + 1, totalQuestions)
        );

        for (const questionPromise of questionPromises) {
            // Wait for each promise to resolve
            const result = await questionPromise;
            qaPairs.push({ question: result.question, answer: result.answer });
            completedQuestions += 1;

            if (result.tool_results && result.tool_results.executed_tools) {
                const newUrls = extractSearchUrls(result.tool_results.executed_tools);

                // Add new URLs to research sources
                for (const url of newUrls) {
                    if (!researchSources.includes(url)) {
                        researchSources.push(url);
                    }
                }

                // Send sources update if we have new ones
                if (newUrls.length > 0) {
                    yield encodeSSE(JSON.stringify({
                        status: 'sources_update',
                        sources: researchSources
                    }));
                }
            }

            // Update timing for questions answered so far
            timings.steps.answering_questions = {
                duration: Date.now() - answeringStartTime,
                completed: Date.now(),
                progress: completedQuestions / totalQuestions
            };

            // Send progress update
            yield encodeSSE(JSON.stringify({
                status: 'progress',
                step: 'answering_questions',
                message: `Answered question ${completedQuestions}/${totalQuestions}: ${result.question}`,
                progress: completedQuestions / totalQuestions,
                sources: researchSources,
                timings: timings
            }));
        }

        // Step 3: Generate the complete report
        const reportStartTime = Date.now();
        yield encodeSSE(JSON.stringify({
            status: 'progress',
            step: 'final_report',
            message: 'Generating final report...',
            sources: researchSources,
            timings: timings
        }));

        const reportContent = await generateCompleteReport(query, qaPairs, []);

        // Record timing for this step and total time
        timings.steps.final_report = {
            duration: Date.now() - reportStartTime,
            completed: Date.now()
        };

        timings.total = {
            duration: Date.now() - timings.start,
            completed: Date.now()
        };

        // Add Q&A section at the end of the report
        let qaSection = "\n\n## Questions and Detailed Answers\n\n";
        for (const qa of qaPairs) {
            qaSection += `### Q: ${qa.question}\n\n${qa.answer}\n\n`;
        }

        const finalReport = reportContent + qaSection;

        // Return the final result
        yield encodeSSE(JSON.stringify({
            status: 'complete',
            report: finalReport,
            sources: researchSources,
            timings: timings
        }));

    } catch (error) {
        console.error(`Error in research process: ${error.message}`);
        const errorMessage = `An error occurred during the research process: ${error.message}`;
        yield encodeSSE(JSON.stringify({ status: 'error', message: errorMessage }));
    }
}

export async function POST(request) {
    try {
        // Get query from request body
        const { query } = await request.json();

        // Set up streaming response
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    const generator = researchProcessGenerator(query);

                    for await (const chunk of generator) {
                        controller.enqueue(new TextEncoder().encode(chunk));
                    }

                    controller.close();
                } catch (error) {
                    console.error('Stream processing error:', error);
                    controller.enqueue(
                        new TextEncoder().encode(
                            encodeSSE(JSON.stringify({ status: 'error', message: error.message }))
                        )
                    );
                    controller.close();
                }
            }
        });

        // Return the streaming response
        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error in API route:', error);
        return NextResponse.json(
            { status: 'error', message: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        // Get query from URL parameters
        const url = new URL(request.url);
        const query = url.searchParams.get('query');

        if (!query) {
            return NextResponse.json(
                { status: 'error', message: 'Query parameter is required' },
                { status: 400 }
            );
        }

        // Set up streaming response (same as POST)
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    const generator = researchProcessGenerator(query);

                    for await (const chunk of generator) {
                        controller.enqueue(new TextEncoder().encode(chunk));
                    }

                    controller.close();
                } catch (error) {
                    console.error('Stream processing error:', error);
                    controller.enqueue(
                        new TextEncoder().encode(
                            encodeSSE(JSON.stringify({ status: 'error', message: error.message }))
                        )
                    );
                    controller.close();
                }
            }
        });

        // Return the streaming response
        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error in API route:', error);
        return NextResponse.json(
            { status: 'error', message: error.message },
            { status: 500 }
        );
    }
}