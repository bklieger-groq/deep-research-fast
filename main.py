import gradio as gr
import os
import json
import time
import tempfile
import logging
import concurrent.futures
from groq import Groq
from dotenv import load_dotenv

os.makedirs('.groq', exist_ok=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('.groq/debug.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# Constants
LLAMA_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct"
LLAMA_MODEL_MINI="meta-llama/llama-4-scout-17b-16e-instruct" 
COMPOUND_MODEL = "compound-beta-mini"

def generate_follow_up_questions(query):
    """Generate 3 follow-up questions using Llama-4-Maverick model"""
    prompt = f"""Based on the following research query, generate 3 specific follow-up questions 
    that would help gather more comprehensive information for compound research.
    The questions should explore different aspects of the topic and help elicit detailed information.
    
    Research Query: {query}
    
    Format your response as a JSON array of 3 questions only. No preamble or explanation.
    Example: ["Question 1?", "Question 2?", "Question 3?"]
    """

    completion = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    
    response = completion.choices[0].message.content
    
    # Try to parse the response as JSON
    try:
        questions = json.loads(response)
        if not isinstance(questions, list):
            # If not a list, try to extract a JSON array from the text
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group(0))
            else:
                questions = []
    except json.JSONDecodeError:
        # If parsing fails, try to extract an array from the text
        import re
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            try:
                questions = json.loads(json_match.group(0))
            except:
                questions = []
        else:
            questions = []
    
    # Ensure we have 5 or less questions
    if len(questions) > 5:
        questions = questions[:5]
    
    return questions

def answer_question(query, question, question_num, total_questions):
    """Use Compound-Beta to answer a follow-up question with sources and hyperlinks"""
    prompt = f"""You are a knowledgeable research assistant. Please answer the following question
    based on the context of this research query: "{query}"

    Question: {question}
    
    Provide a factual answer with relevant information. Include sources or data if available.
    VERY IMPORTANT: When citing sources, include hyperlinks to those sources in your answer.
    Use the format [Source Name](URL) for all citations.
    Focus on accuracy and relevance to the research topic.
    """
    
    completion = client.chat.completions.create(
        model=COMPOUND_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    
    answer = completion.choices[0].message.content
    return {"question": question, "answer": answer, "question_num": question_num, "total": total_questions}

def gather_research_data(query, qa_pairs):
    """Use Compound-Beta to gather targeted research data with hyperlinked sources"""
    context = f"Main Query: {query}\n\nAdditional Information:\n"
    
    for i, qa in enumerate(qa_pairs, 1):
        context += f"{i}. Question: {qa['question']}\nAnswer: {qa['answer']}\n\n"
    
    prompt = f"""You are a research assistant tasked with gathering detailed research data.
    I need you to search for information related to this research query and the follow-up questions.
    
    {context}
    
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
    """
    
    completion = client.chat.completions.create(
        model=COMPOUND_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=8192
    )
    
    return completion.choices[0].message.content

def generate_complete_report(query, qa_pairs, research_data):
    """Generate a complete report using Llama-4-Maverick"""
    # Create context with all the necessary information
    context = f"""Research Query: {query}

Follow-up Questions and Answers:
"""
    
    for i, qa in enumerate(qa_pairs, 1):
        context += f"Q{i}: {qa['question']}\nA{i}: {qa['answer']}\n\n"
    
    context += f"\nResearch Data:\n{research_data}\n\n"

    prompt = f"""You are tasked with writing a comprehensive research report based on the provided information.
    
    {context}
    
    Create a complete, well-structured research report with these sections:
    
    1. A descriptive, professional title for the report (7-12 words)
    2. An executive summary (2-3 paragraphs)
    3. 4-6 main content sections that cover different aspects of the topic
    4. A conclusion section
    
    Requirements:
    - Structure each section with appropriate headers using markdown (# for title, ## for major sections, ### for subsections)
    - Include factual information with HYPERLINKED CITATIONS using markdown format: [Source Name](URL)
    - Integrate information from both the follow-up questions/answers and the research data
    - Provide your own analysis and insights in addition to the facts
    - Use academic, professional language throughout
    - Each section should have substantial content (3-4 paragraphs)
    - End with a conclusion that summarizes key findings and suggests areas for future research
    
    Format your response using proper markdown, with clear section breaks.
    """
    
    completion = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=8192
    )
    
    return completion.choices[0].message.content

def save_report_to_file(report_text):
    """Save the report to a file and return the file path"""
    try:
        # Extract title from the report (first # line)
        title_match = report_text.split('\n')[0]
        if title_match.startswith('# '):
            title = title_match[2:]
        else:
            title = "Research_Report"
        
        # Clean the title for a filename
        clean_title = title.replace(' ', '_').replace(':', '').replace('?', '').replace('!', '').replace(',', '').replace(';', '')
        filename = f"{clean_title}.md"
        
        # Create a temporary file
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, filename)
        
        logger.info(f"Saving report to: {file_path}")
        
        # Write content to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(report_text)
            
        return file_path
    except Exception as e:
        logger.error(f"Error saving report: {str(e)}")
        return None

def compound_research_process(query):
    """Generate a comprehensive research report showing only the final result"""
    try:
        # Show initial progress message
        yield "Generating research report... This may take a few minutes.", None, None
        
        # Step 1: Generate follow-up questions
        questions = generate_follow_up_questions(query)
        
        # List to store completed QA pairs
        qa_pairs = []
        qa_section = ""
        
        # Use thread pool to make API calls in parallel
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # Submit all question answering tasks
            futures = []
            for i, question in enumerate(questions, 1):
                future = executor.submit(
                    answer_question, 
                    query, 
                    question, 
                    i, 
                    len(questions)
                )
                futures.append(future)
            
            # Also submit the research data gathering task
            research_future = executor.submit(gather_research_data, query, [])
            
            # Process question answers as they complete
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                qa_pairs.append({"question": result["question"], "answer": result["answer"]})
                qa_section += f"### Q: {result['question']}\n\n{result['answer']}\n\n"
            
            # Get research data
            research_data = research_future.result()
            
            # If the research data task completed with empty qa_pairs, run it again with the full data
            if not qa_pairs:
                research_data = gather_research_data(query, qa_pairs)
        
        # Generate the complete report
        report_content = generate_complete_report(query, qa_pairs, research_data)
        
        # Add Q&A section at the end of the report
        final_report = report_content + "\n\n## Questions and Detailed Answers\n\n" + qa_section
        
        # Add footer
        final_report += "\n\n---\n*Research conducted using Groq Compound and Llama 4 Maverick*"
        
        # Generate file for download
        logger.info("Creating downloadable report file")
        report_file = save_report_to_file(final_report)
        
        # Make the download button visible with the report file
        yield final_report, final_report, report_file
        
    except Exception as e:
        logger.error(f"Error in research process: {str(e)}")
        error_message = f"# Error in Research Process\n\nAn error occurred during the research process: {str(e)}\n\nPlease try again with a different query or check your API key configuration."
        yield error_message, None, None

# Create Gradio interface
with gr.Blocks() as demo:
    gr.Markdown("# 🔬 Compound Research Assistant")
    gr.Markdown("Enter a research query to begin a comprehensive, automated research process. The system will generate a detailed report with hyperlinked sources.")
    
    # Main interface components
    query_input = gr.Textbox(
        label="Research Query", 
        placeholder="Enter your research question here...",
        lines=2
    )
    start_button = gr.Button("Start Research Process")
    
    # Output display
    output_display = gr.Markdown()
    
    # Hidden text state for storing the final report content
    report_content = gr.State()
    
    # Download button
    download_button = gr.File(label="Download Research Report")
    
    # Connect the button to the research process
    start_button.click(
        fn=compound_research_process,
        inputs=query_input,
        outputs=[output_display, report_content, download_button]
    )

if __name__ == "__main__":
    demo.launch(share=False)