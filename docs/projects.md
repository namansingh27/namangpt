# Naman Singh — Projects

---

## Project 1: StartupHub — AI-Powered Startup Job Discovery Platform

**Type:** Full Stack AI Web Application
**Role:** Solo Designer & Developer
**Tech Stack:** Next.js 16, React, Tailwind CSS, Node.js, Supabase (PostgreSQL), Claude API (Sonnet 4), SerpApi, Greenhouse ATS API, Ashby ATS API, YC Public API, Cron jobs, REST APIs
**GitHub:** https://github.com/namansingh27/TheStartupHub

### What It Does
StartupHub is an AI-powered platform that helps users discover startup jobs from YC-backed and early-stage companies. It aggregates jobs from multiple ATS platforms, provides AI-based job matching, generates personalized cover letters, predicts stealth startup roles, and helps users discover recruiter contacts for outreach.

### Problem It Solved
Finding jobs at early-stage startups is fragmented — listings are scattered across Greenhouse, Ashby, Wellfound, and company career pages. There was no single platform that aggregated, matched, and helped users act on startup jobs intelligently. StartupHub solves this with automated pipelines and AI-powered features.

### Key Features
- Job aggregation from 140+ YC-backed companies across multiple ATS platforms
- AI-powered job matching based on user profile and preferences
- Personalized cover letter generation using Claude API
- Stealth startup role prediction
- Recruiter contact discovery for direct outreach

### Naman's Role
Designed and developed the end-to-end AI job discovery workflow, including job aggregation pipelines, AI-powered matching logic, contact discovery system, and cover letter generation features. Worked on prompt engineering, API integrations, Supabase database design, and frontend implementation.

### Outcome & Impact
- Aggregated 10,000+ real startup jobs across 140+ YC companies
- Built 5 AI-powered features for job search automation
- Reduced manual startup job discovery effort through intelligent matching and outreach assistance
- Created a scalable automated pipeline with zero manual maintenance after setup

---

## Project 2: Career Explorer — AI-Powered Career & Job Search Strategy Platform

**Type:** AI Product / Research Platform
**Role:** Product & AI Research Assistant (collaborative project with a professor)

### What It Does
Career Explorer is an AI-driven career development platform designed to help students with industry research, role exploration, CV building, ATS optimization, networking, and interview preparation. The platform combines structured career workflows with AI-powered tools to guide students through the entire job search process.

### Key Features
- AI-powered career guidance and industry research
- RAG-based document analysis for CV parsing and ATS keyword matching
- Voice-enabled interview simulation with personalized feedback
- Company discovery based on industry and SIC codes
- PDF/Word export workflows for application materials

### Naman's Role
Worked closely with a professor as a Product & AI Research Assistant to design and improve the platform experience. Brainstormed and researched AI-powered features that could genuinely help students perform better during their job search. Contributed to product strategy, feature ideation, workflow design, and UI/UX improvements across the platform.

### Outcome & Impact
- Enabled students to practice interviews through AI-powered simulations with personalized feedback and voice-based interactions
- Helped users identify and research companies based on preferred industry and SIC code, making job discovery more structured
- Improved overall job search experience by combining AI-driven career guidance, application preparation, and interview readiness into a single platform

---

## Project 3: Flight Delay Prediction Using Machine Learning

**Type:** Machine Learning / Data Science
**Role:** Data Scientist & ML Engineer
**Tech Stack:** Python, Pandas, NumPy, Scikit-learn, XGBoost, LightGBM, Random Forest, Decision Trees, Gradio, Jupyter/Google Colab, NOAA weather datasets, data visualization libraries
**GitHub:** https://github.com/namansingh27/US-Flight-Delay-Prediction

### What It Does
A machine learning system that predicts whether a US flight will be delayed by more than 15 minutes using operational flight data and weather information from major US airports. Combines data preprocessing, feature engineering, exploratory analysis, and predictive modeling to identify key factors contributing to flight delays.

### Problem It Solved
Flight delays cost airlines and passengers billions annually. By predicting delays before they happen, airlines can proactively manage scheduling, resources, and passenger communication.

### Naman's Role
Worked on data preprocessing, exploratory data analysis, feature engineering, and machine learning model development. Contributed to building and evaluating predictive models, analyzing operational and weather-based delay factors, and developing the interactive Gradio dashboard for real-time predictions.

### Outcome & Impact
- Built predictive models achieving up to 0.847 ROC-AUC score using LightGBM
- Identified airport operations and airline efficiency as stronger delay predictors than weather conditions
- Enabled real-time flight delay prediction through an interactive Gradio dashboard
- Generated actionable insights for airlines on scheduling, resource allocation, and passenger communication

---

## Project 4: Airbnb Fair Price & Dynamic Pricing Analysis

**Type:** Data Analytics / Business Intelligence
**Role:** Data Analyst & Business Analyst
**Tech Stack:** Python, Excel, Log-Log Regression Modeling, Statistical Analysis, Data Cleaning & Segmentation, Dynamic Pricing Simulation, Data Visualization, Business Analytics methodologies

### What It Does
A data-driven Airbnb pricing analysis system that estimates fair listing prices and simulates dynamic pricing strategies for NYC Airbnb hosts. Uses regression modeling, market segmentation, and host behavior analysis to help hosts understand how factors like reviews, cleanliness, availability, and responsiveness impact pricing potential.

### Problem It Solved
Airbnb hosts often underprice or overprice their listings due to lack of data. This project built a Fair Price Index (FPI) to help hosts benchmark their pricing and a dynamic pricing framework to show how operational improvements could increase revenue.

### Naman's Role
Worked on data cleaning, segmentation strategy, parameter selection, dynamic pricing model design, and business insight presentation. Identified key pricing drivers, designed host pricing scenarios, built the regression-based dynamic pricing logic, and contributed to the roadmap for an interactive fair-price simulator.

### Outcome & Impact
- Analyzed 20,000+ Airbnb listings across 6 statistically significant market segments
- Built a Fair Price Index (FPI) model to identify overpriced and underpriced listings
- Developed a dynamic pricing framework showing how hosts could improve pricing through cleanliness, availability, and response rates
- Identified availability and host operational efficiency as major pricing levers
- Proposed a future interactive pricing simulator to help hosts optimize real-time pricing decisions

---

## Project 5: Text2SQL Multi-Agent System

**Type:** Personal Side Project — Full Stack AI Application
**Role:** Solo Designer & Developer
**Tech Stack:** Python, Claude API, LangChain, SQL, React/Vite frontend, Node.js/Express backend, Multi-Agent Architecture, Structured Output, Tool Calling

### What It Does
Text2SQL is an AI-powered multi-agent system that lets users write queries in plain English and get back accurate SQL queries along with actual results — no SQL knowledge required.

### How It Works
Multi-agent pipeline with specialized agents:
- Intent Agent — understands what the user is asking in plain English
- Schema Agent — maps the question to relevant database tables and columns
- SQL Generator Agent — writes accurate SQL based on intent and schema
- Execution Agent — runs the query and retrieves results
- Response Agent — formats and presents results cleanly

### Problem It Solved
Non-technical users like business analysts and PMs need data but can't write SQL. Text2SQL removes that barrier entirely.

### Key Features
- Natural language to SQL conversion using Claude API
- Multi-agent pipeline with specialized agents per task
- Structured output and tool calling for reliable SQL generation
- Handles complex queries including JOINs, aggregations, filters, subqueries

### Naman's Role
Designed and built the complete multi-agent architecture. Implemented prompt engineering for each agent, structured output schemas for reliable SQL generation, tool calling for database execution, and full-stack integration.

### Outcome & Impact
- Enabled non-technical users to query databases using plain English
- Demonstrated practical application of multi-agent AI systems
- Showcased expertise in prompt engineering, structured output, tool calling, and multi-step AI pipelines

---

## Project 6: NamanGPT — AI-Powered Personal Portfolio Chatbot

**Type:** Personal Side Project — Full Stack AI Application
**Role:** Solo Designer & Developer (built independently)
**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS, Claude API (claude-sonnet-4-5), Voyage AI (voyage-3-lite), Supabase pgvector, RAG Pipeline (custom built), Vercel (deployment)
**Live:** namangpt-one.vercel.app
**GitHub:** github.com/namansingh27/namangpt

### What It Does
NamanGPT is a conversational AI portfolio chatbot that lets anyone — recruiters, collaborators, or curious visitors — ask natural language questions about Naman Singh and get instant, accurate, grounded answers. Instead of scrolling through a static resume, users can have a conversation with Naman's portfolio.

### Problem It Solved
Traditional portfolios are passive — visitors scroll, skim, and leave. NamanGPT makes the portfolio interactive and conversational, letting recruiters ask exactly what they want to know in their own words.

### How It Works
NamanGPT uses a custom RAG (Retrieval-Augmented Generation) pipeline:
- 9 markdown knowledge documents covering resume, projects, experience, skills, achievements, education, leadership, and contact info
- Documents are chunked into 58 pieces and embedded using Voyage AI voyage-3-lite model
- User questions are embedded and compared against all 58 chunks using cosine similarity search
- Top 5 most relevant chunks are injected into Claude's context window
- Claude generates a grounded response using only the retrieved context — no hallucination

### Key Features
- Project cards on home screen for visual browsing
- RAG pipeline with 58 chunks across 9 knowledge docs
- 3-layer guardrail system blocking off-topic questions
- Streaming responses using Anthropic SDK native streaming
- Dark and light mode with localStorage persistence
- Recents sidebar with session history
- Resume download button
- Mobile responsive design
- Rate limiting (20 requests/hour per IP)
- Privacy policy page
- Deployed on Vercel with Supabase pgvector vector store

### Naman's Role
Designed and built the entire system from scratch — knowledge base creation, RAG pipeline, guardrails, streaming API, and chat UI. Made all architecture decisions including embedding model selection, chunking strategy, similarity search implementation, and deployment setup.

### Outcome & Impact
- Live at namangpt-one.vercel.app
- Featured on LinkedIn, shared with Stevens faculty
- Received positive feedback from chairperson of analytics at Stevens Institute of Technology
- Demonstrates practical application of RAG, LLMs, prompt engineering, and full-stack AI development
