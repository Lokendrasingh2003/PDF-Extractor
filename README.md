# AI RAG Chatbot

This project contains a full-stack AI chatbot application with:

- Backend API built with Node.js and Express
- Frontend built with React + Vite
- OpenAI-powered chat integration

## Project structure

```text
ai-rag-chatbot/
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── README.md
└── package-lock.json
```

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

## Environment variables

Create a `.env` file in the backend folder with:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=6000
```

## GitHub upload

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```
