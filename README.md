# 📄 Chat With Your Documents

An AI-powered document assistant that allows users to upload PDF files, ask questions in natural language, and receive context-aware answers using Retrieval-Augmented Generation (RAG).

The application extracts text from uploaded PDFs, generates embeddings, stores them in a vector database, retrieves relevant content using semantic search, and uses a Large Language Model to generate accurate answers grounded in the document.

---

## 🚀 Features

* Upload PDF documents
* Chat with uploaded documents
* Semantic search using vector embeddings
* Retrieval-Augmented Generation (RAG)
* Persistent document storage
* View previously uploaded documents
* Delete documents and associated embeddings
* Source chunk display for transparency
* Modern chat-style user interface
* Fast AI responses powered by Groq

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Axios
* CSS

### Backend

* FastAPI
* Python

### AI & RAG

* Groq API
* Llama 3.3 70B Versatile
* Sentence Transformers
* all-MiniLM-L6-v2

### Vector Database

* ChromaDB

### Document Processing

* PyPDF

---

## ⚙️ How It Works

### 1. Upload PDF

Users upload a PDF document through the frontend.

### 2. Text Extraction

The backend extracts text from all pages of the PDF.

### 3. Chunking

The extracted text is divided into overlapping chunks to improve retrieval quality.

### 4. Embedding Generation

Each chunk is converted into vector embeddings using the Sentence Transformers model.

### 5. Vector Storage

Embeddings are stored in ChromaDB along with document metadata.

### 6. Question Processing

When a user asks a question:

* The question is converted into an embedding
* Similar chunks are retrieved from ChromaDB
* Relevant context is prepared

### 7. AI Response

The retrieved context is sent to the Llama 3.3 70B model via Groq, which generates a grounded answer.

---

## 📂 Project Structure

```bash
chat-with-documents/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── uploads/
│   ├── chroma_db/
│   ├── documents.json
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## 🔧 Installation

### Clone Repository

```bash
git clone https://github.com/ashishpanghal006/chat-with-your-document.git
cd chat-with-your-document
```

### Backend Setup

```bash
cd backend

pip install -r requirements.txt
```

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
```

Run FastAPI server:

```bash
uvicorn main:app --reload
```

---

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## 📌 API Endpoints

### Upload PDF

```http
POST /upload
```

Uploads and processes a PDF document.

---

### Ask Question

```http
POST /ask
```

Ask questions about a selected document.

---

### Get Documents

```http
GET /documents
```

Returns all previously uploaded documents.

---

### Delete Document

```http
DELETE /documents/{document_id}
```

Deletes a document, associated embeddings, and metadata.

---

### Health Check

```http
GET /
```

Returns API status.

---

## 📸 Demo

Upload a PDF, ask questions, and receive AI-generated answers grounded in the document content.

---

## ⭐ Key Learning Outcomes

* Retrieval-Augmented Generation (RAG)
* Vector Databases
* Semantic Search
* Embeddings
* FastAPI Development
* React Integration
* LLM Application Development
* End-to-End AI System Design