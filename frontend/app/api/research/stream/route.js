import {
    generateFollowUpQuestions,
    answerQuestion,
    gatherResearchData,
    generateCompleteReport,
    formatSSE
} from '../../../lib/research';
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

// Generator function for the research process
async function* researchProcessGenerator(query) {
    try {
        // Step 1: Generate Research questions
        yield encodeSSE(JSON.stringify({
            status: 'progress',
            step: 'follow_up_questions',
            message: 'Generating Research questions...'
        }));

        const questions = await generateFollowUpQuestions(query);

        // List to store completed QA pairs
        const qaPairs = [];

        // Step 2: Start answering questions (before research data)
        yield encodeSSE(JSON.stringify({
            status: 'progress',
            step: 'answering_questions',
            message: 'Starting to answer research questions...',
            progress: 0
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

            // Send progress update
            yield encodeSSE(JSON.stringify({
                status: 'progress',
                step: 'answering_questions',
                message: `Answered question ${completedQuestions}/${totalQuestions}: ${result.question}`,
                progress: completedQuestions / totalQuestions
            }));
        }

        // Step 3: Gather research data
        yield encodeSSE(JSON.stringify({
            status: 'progress',
            step: 'research_data',
            message: 'Gathering additional research data...'
        }));

        const researchData = await gatherResearchData(query, qaPairs);

        // Step 4: Generate the complete report
        yield encodeSSE(JSON.stringify({
            status: 'progress',
            step: 'final_report',
            message: 'Generating final report...'
        }));

        const reportContent = await generateCompleteReport(query, qaPairs, researchData);

        // Add Q&A section at the end of the report
        let qaSection = "\n\n## Questions and Detailed Answers\n\n";
        for (const qa of qaPairs) {
            qaSection += `### Q: ${qa.question}\n\n${qa.answer}\n\n`;
        }

        const finalReport = reportContent + qaSection;

        // Return the final result
        yield encodeSSE(JSON.stringify({
            status: 'complete',
            report: finalReport
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