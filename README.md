# Research Assistant

A modern research assistant app powered by Groq's AI models that generates comprehensive research reports with follow-up questions and hyperlinked sources.

## Features

- Beautiful Next.js frontend with a responsive, modern UI
- FastAPI backend with streaming support
- Real-time progress updates during research process
- Comprehensive research reports with sections, follow-up questions, and hyperlinked sources
- Download reports as Markdown files
- Fully containerized with Docker for easy deployment

## Technologies

- **Frontend**: Next.js, React, Tailwind CSS, DaisyUI
- **Backend**: FastAPI, Python
- **AI Models**: Groq LLMs (Llama-4-Maverick, Compound-Beta)
- **Containerization**: Docker, Docker Compose

## Setup & Installation

### Prerequisites

- Docker and Docker Compose
- Groq API Key (sign up at [groq.com](https://groq.com))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/research-assistant.git
   cd research-assistant
   ```

2. Create a `.env` file with your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)

## Usage

1. Enter your research query in the input field
2. Submit the form to start the research process
3. Watch real-time progress as the system:
   - Generates follow-up questions
   - Answers research questions
   - Gathers comprehensive research data
   - Compiles the final report
4. View the final report with:
   - Executive summary
   - Organized content sections
   - Sources with hyperlinks
   - Follow-up questions and answers
5. Download the report as a Markdown file

## Development

### Local Development

To run the services locally without Docker:

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## License

[MIT License](LICENSE)
