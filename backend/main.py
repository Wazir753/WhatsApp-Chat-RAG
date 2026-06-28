from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
import json

from parser import WhatsAppParser
from embedder import Embedder
from retriever import Retriever
from llm import LLMClient

load_dotenv()

app = FastAPI(title="WhatsApp Chat RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

parser = WhatsAppParser()
embedder = Embedder()
retriever = Retriever()
llm_client = LLMClient()

class ChatRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    answer: str
    sources: list
    model: str
    success: bool
    error: Optional[str] = None
    fallback: Optional[bool] = False

class UploadResponse(BaseModel):
    total_messages: int
    participants: list
    date_range: Dict[str, str]
    most_active_participant: Optional[str]
    message_count_by_participant: Dict[str, int]
    message_count_by_hour: Dict[str, int]
    message_count_over_time: Dict[str, int]
    top_words: list

class StatsResponse(BaseModel):
    total_messages: int
    participants: list
    date_range: Dict[str, str]
    most_active_participant: Optional[str]
    message_count_by_participant: Dict[str, int]
    message_count_by_hour: Dict[str, int]
    message_count_over_time: Dict[str, int]
    top_words: list
    collection_count: int

global_state = {
    "messages": [],
    "chunks": [],
    "is_embedding": False,
    "embedding_progress": 0,
    "embedding_total": 0
}

@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        file_content = content.decode("utf-8")
        
        messages = parser.parse_file(file_content)
        
        if not messages:
            raise HTTPException(status_code=400, detail="No valid messages found in file")
        
        global_state["messages"] = messages
        global_state["chunks"] = []
        
        stats = parser.get_stats(messages)
        
        return UploadResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/embed")
async def embed_chunks(background_tasks: BackgroundTasks):
    try:
        if global_state["is_embedding"]:
            raise HTTPException(status_code=400, detail="Embedding already in progress")
        
        if not global_state["messages"]:
            raise HTTPException(status_code=400, detail="No messages to embed. Please upload a file first.")
        
        messages = global_state["messages"]
        chunks = parser.chunk_messages(messages)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="No chunks created from messages")
        
        global_state["chunks"] = chunks
        global_state["is_embedding"] = True
        global_state["embedding_progress"] = 0
        global_state["embedding_total"] = len(chunks)
        
        def embed_task():
            try:
                def progress_callback(current, total):
                    global_state["embedding_progress"] = current
                
                embeddings = embedder.embed_chunks(chunks, progress_callback)
                retriever.delete_collection()
                retriever.add_chunks(chunks, embeddings)
                global_state["is_embedding"] = False
            except Exception as e:
                global_state["is_embedding"] = False
                print(f"Embedding error: {str(e)}")
        
        background_tasks.add_task(embed_task)
        
        return {
            "message": "Embedding started",
            "total_chunks": len(chunks)
        }
    except HTTPException:
        raise
    except Exception as e:
        global_state["is_embedding"] = False
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

@app.get("/embed/progress")
async def get_embedding_progress():
    return {
        "is_embedding": global_state["is_embedding"],
        "progress": global_state["embedding_progress"],
        "total": global_state["embedding_total"],
        "percentage": (global_state["embedding_progress"] / global_state["embedding_total"] * 100) if global_state["embedding_total"] > 0 else 0
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if global_state["is_embedding"]:
            raise HTTPException(status_code=400, detail="Embedding in progress. Please wait.")
        
        collection_count = retriever.get_collection_count()
        if collection_count == 0:
            raise HTTPException(status_code=400, detail="No embedded data. Please upload and embed a file first.")
        
        query_embedding = embedder.embed_query(request.query)
        
        search_results = retriever.search(query_embedding, n_results=5, filters=request.filters)
        
        if not search_results["results"]:
            return ChatResponse(
                answer="No relevant messages found in the chat history.",
                sources=[],
                model="none",
                success=True
            )
        
        context = "\n\n".join([
            f"[Similarity: {result['similarity']:.2f}]\n{result['text']}"
            for result in search_results["results"]
        ])
        
        llm_response = llm_client.generate_response(request.query, context)
        
        sources = []
        for result in search_results["results"]:
            sources.append({
                "text": result["text"],
                "similarity": result["similarity"],
                "participants": result["metadata"]["participants"].split(","),
                "date_start": result["metadata"]["date_start"],
                "date_end": result["metadata"]["date_end"],
                "message_count": result["metadata"]["message_count"]
            })
        
        return ChatResponse(
            answer=llm_response["answer"] or "Failed to generate response.",
            sources=sources,
            model=llm_response["model"] or "none",
            success=llm_response["success"],
            error=llm_response.get("error"),
            fallback=llm_response.get("fallback", False)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    try:
        if not global_state["messages"]:
            raise HTTPException(status_code=400, detail="No messages loaded. Please upload a file first.")
        
        stats = parser.get_stats(global_state["messages"])
        collection_count = retriever.get_collection_count()
        
        return StatsResponse(
            collection_count=collection_count,
            **stats
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")

@app.delete("/reset")
async def reset_database():
    try:
        retriever.delete_collection()
        global_state["messages"] = []
        global_state["chunks"] = []
        global_state["is_embedding"] = False
        global_state["embedding_progress"] = 0
        global_state["embedding_total"] = 0
        
        return {"message": "Database reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "collection_count": retriever.get_collection_count(),
        "has_messages": len(global_state["messages"]) > 0,
        "is_embedding": global_state["is_embedding"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
