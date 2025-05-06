# Research Assistant

A modern research assistant app powered by Groq's AI models that generates comprehensive research reports with Research questions and hyperlinked sources.

## Features

- Beautiful Next.js frontend with a responsive, modern UI
- Integrated Next.js API routes replacing the separate FastAPI backend
- Real-time progress updates during research process with Server-Sent Events (SSE)
- Comprehensive research reports with sections, Research questions, and hyperlinked sources
- Download reports as Markdown files
- Simplified deployment with a single Next.js application

## Technologies

- **Frontend**: Next.js, React, Tailwind CSS, DaisyUI
- **Backend**: Next.js API Routes
- **AI Models**: Groq LLMs (Llama-4-Maverick, Compound-Beta)
- **Containerization**: Docker (optional)

## Setup & Installation

### Prerequisites

- Node.js (v16 or newer)
- Groq API Key (sign up at [groq.com](https://groq.com))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/research-assistant.git
   cd research-assistant
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Create a `.env.local` file in the frontend directory with your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. Start the application:
   ```bash
   npm run dev
   ```

5. Access the application:
   - [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter your research query in the input field
2. Submit the form to start the research process
3. Watch real-time progress as the system:
   - Generates Research questions
   - Answers research questions
   - Gathers comprehensive research data
   - Compiles the final report
4. View the final report with:
   - Executive summary
   - Organized content sections
   - Sources with hyperlinks
   - Research questions and answers
5. Download the report as a Markdown file

## Docker Deployment (Optional)

If you prefer using Docker:

1. Build and start the container:
   ```bash
   docker build -t research-assistant ./frontend
   docker run -p 3000:3000 -e GROQ_API_KEY=your_groq_api_key_here research-assistant
   ```

2. Access the application at [http://localhost:3000](http://localhost:3000)

## License

[MIT License](LICENSE)
