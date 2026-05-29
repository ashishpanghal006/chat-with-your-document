import os
import uuid
import json
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import chromadb
from groq import Groq


## Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")


## FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


## create upload folder
os.makedirs("uploads", exist_ok=True)


DOCUMENTS_FILE = "documents.json"

def load_documents():
    if not os.path.exists(DOCUMENTS_FILE):
        return []
    
    with open(DOCUMENTS_FILE, "r") as f:
        return json.load(f)
    

def save_documents(documents):
    with open(DOCUMENTS_FILE, "w") as f:
        json.dump(documents, f, indent=4)



## Models and Clients
client = Groq(api_key = GROQ_API_KEY)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="documents")


## chunking function
def chunk_text(text, chunk_size=1000, overlap=200):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    
    return chunks


## Upload PDF endpoint
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        ## Validate file type
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only pdf files are allowed")
        
        document_id = str(uuid.uuid4())
        documents = load_documents()

        existing = next(
            (
                doc 
                for doc in documents
                if doc["filename"] == file.filename
            ),
            None
        )
        if existing:
            return {
                "message": "Document already exists",
                "document_id": existing["document_id"],
                "filename": existing["filename"]
            }
        
        filepath = os.path.join("uploads", f"{document_id}_{file.filename}")

        documents.append({
            "document_id": document_id,
            "filename": file.filename,
            "filepath": filepath
        })
        save_documents(documents)


        ## save file
        with open(filepath, "wb") as f:
            f.write(await file.read())

        ## read pdf
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF")
        
        ## Chunking
        chunks = chunk_text(text)

        ## store embeddings
        for idx, chunk in enumerate(chunks):
            embedding = embedding_model.encode(chunk).tolist()
            collection.add(
                ids=[str(uuid.uuid4())],
                documents=[chunk],
                embeddings=[embedding],
                metadatas=[{
                    "document_id": document_id,
                    "filename": file.filename,
                    "chunk_number": idx + 1
                }]
            )

        return {
            "message": "PDF processed successfully",
            "document_id": document_id,
            "filename": file.filename,
            "chunks": len(chunks)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/documents")
def get_documents():
    return load_documents()


## Ask question endpoint
@app.post("/ask")
async def ask_question(data: dict):
    try:
        question = data.get("question")
        document_id = data.get("document_id")

        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        if not document_id:
            raise HTTPException(status_code=400, detail="Document ID is required")
        
        question_embedding = (embedding_model.encode(question).tolist())
        results = collection.query(query_embeddings=[question_embedding], n_results=5, where={"document_id": document_id})
        retrieved_chunks = results["documents"][0]

        if not retrieved_chunks:
            return {
                "answer": "No relevant information found.",
                "sources": []
            }
        
        context = "\n\n".join(retrieved_chunks)

        prompt = f"""
        You are a helpful AI assistant.

        Answer using ONLY the provided context.

        Keep answers concise and easy to read.

        Rules:
        - For definitions, give a short explanation.
        - For lists, use bullet points.
        - Do not add information that is not present in the context.
        - If the answer is not present in the context, reply exactly:
        "I couldn't find that in the document."

        CONTEXT:
        {context}

        QUESTION:
        {question}
        """

        response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0
            )

        answer = (response.choices[0].message.content)

        return {
            "answer": answer,
            "sources": retrieved_chunks
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

## Delete endpoint
@app.delete("/documents/{document_id}")
def delete_document(document_id: str):
    try:
        documents = load_documents()
        document = next(
            (
                doc
                for doc in documents
                if doc["document_id"] == document_id
            ),
            None
        )
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete PDF file
        if os.path.exists(document["filepath"]):
            os.remove(document["filepath"])

        # Delete Embeddings from ChromaDB
        collection.delete(where={"document_id": document_id})

        # Remove from documents.json
        documents = [
            doc
            for doc in documents
            if doc["document_id"] != document_id
        ]
        save_documents(documents)

        return {"message": "Document deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


## health check endpoint
@app.get("/")
def health_check():
    return {
        "status": "running",
        "message": "Chat With Documents API"
    }