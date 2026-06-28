from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import os
from dotenv import load_dotenv
import asyncio
import json

from sync import sync_chat_history
from embedder import Embedder
from retriever import Retriever
from llm import LLMClient
from memory import MemoryStore
from stats import StatsTracker

load_dotenv()

app = FastAPI(title="ArachnoBot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embedder = Embedder()
retriever = Retriever()
llm_client = LLMClient()
memory_store = MemoryStore()
stats_tracker = StatsTracker()

class SyncRequest(BaseModel):
    messages: List[Dict[str, Any]]

class ChatRequest(BaseModel):
    query: str
    sender_id: str
    mode: str
    contact_filter: Optional[str] = None

class SummarizeRequest(BaseModel):
    contact_name: str
    days_back: int = 30

class BotSettingsRequest(BaseModel):
    bot_name: Optional[str] = None
    bot_status: Optional[str] = None
    auto_reply: Optional[bool] = None
    typing_indicator: Optional[bool] = None
    response_delay: Optional[float] = None

class ActivityEvent(BaseModel):
    type: str
    sender: str
    query: str
    response_time: float
    status: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

bot_settings = {
    "bot_name": "ArachnoBot 🕷️",
    "bot_status": "Your AI assistant — ask me anything 🧠",
    "auto_reply": True,
    "typing_indicator": True,
    "response_delay": 1.5
}

@app.post("/sync")
async def sync_endpoint(request: SyncRequest):
    try:
        result = sync_chat_history(request.messages, embedder, retriever)
        stats_tracker.update_sync_stats(result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    start_time = datetime.now()
    
    try:
        memory = memory_store.get_memory(request.sender_id)
        
        query_embedding = embedder.embed_query(request.query)
        
        filters = {}
        if request.contact_filter:
            filters["contact"] = request.contact_filter
        
        search_results = retriever.search(query_embedding, n_results=5, filters=filters)
        
        if not search_results["results"]:
            response_time = (datetime.now() - start_time).total_seconds()
            stats_tracker.record_query(request.mode, request.sender_id, request.query, response_time, "no_results")
            
            await manager.broadcast({
                "type": "message_received",
                "sender": request.sender_id,
                "query": request.query,
                "response_time": response_time,
                "status": "no_results"
            })
            
            return {
                "answer": "🕷️ Couldn't find anything matching that in your chat history.",
                "sources": []
            }
        
        context = "\n\n".join([
            f"[{result['metadata']['contact']} - {result['metadata']['date']}]\n{result['text']}"
            for result in search_results["results"]
        ])
        
        llm_response = llm_client.generate_response(request.query, context, memory, request.mode)
        
        memory_store.add_memory(request.sender_id, request.query, llm_response["answer"])
        
        sources = []
        for result in search_results["results"]:
            sources.append({
                "contact": result["metadata"]["contact"],
                "date": result["metadata"]["date"],
                "snippet": result["text"][:200] + "..." if len(result["text"]) > 200 else result["text"]
            })
        
        response_time = (datetime.now() - start_time).total_seconds()
        stats_tracker.record_query(request.mode, request.sender_id, request.query, response_time, "success")
        
        await manager.broadcast({
            "type": "message_received",
            "sender": request.sender_id,
            "query": request.query,
            "response_time": response_time,
            "status": "success"
        })
        
        return {
            "answer": llm_response["answer"],
            "sources": sources,
            "model": llm_response["model"]
        }
    except Exception as e:
        response_time = (datetime.now() - start_time).total_seconds()
        stats_tracker.record_query(request.mode, request.sender_id, request.query, response_time, "error")
        
        await manager.broadcast({
            "type": "message_received",
            "sender": request.sender_id,
            "query": request.query,
            "response_time": response_time,
            "status": "error"
        })
        
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/summarize")
async def summarize_endpoint(request: SummarizeRequest):
    try:
        filters = {"contact": request.contact_name}
        all_chunks = retriever.get_all_chunks(filters)
        
        if not all_chunks:
            raise HTTPException(status_code=404, detail="No chunks found for this contact")
        
        top_chunks = all_chunks[:20]
        context = "\n\n".join([chunk["text"] for chunk in top_chunks])
        
        summary = llm_client.summarize_conversation(context, request.contact_name)
        
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarize failed: {str(e)}")

@app.get("/stats")
async def get_stats():
    try:
        return stats_tracker.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")

@app.get("/contacts")
async def get_contacts():
    try:
        return retriever.get_all_contacts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Get contacts failed: {str(e)}")

@app.get("/contacts/{contact_name}/chunks")
async def get_contact_chunks(contact_name: str):
    try:
        filters = {"contact": contact_name}
        chunks = retriever.get_all_chunks(filters)
        return {"contact": contact_name, "chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Get chunks failed: {str(e)}")

@app.post("/contacts/{contact_name}/reindex")
async def reindex_contact(contact_name: str):
    try:
        retriever.delete_chunks_by_contact(contact_name)
        return {"message": f"Chunks for {contact_name} deleted. Re-sync needed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reindex failed: {str(e)}")

@app.get("/settings")
async def get_settings():
    return bot_settings

@app.post("/settings")
async def update_settings(request: BotSettingsRequest):
    global bot_settings
    
    if request.bot_name is not None:
        bot_settings["bot_name"] = request.bot_name
    if request.bot_status is not None:
        bot_settings["bot_status"] = request.bot_status
    if request.auto_reply is not None:
        bot_settings["auto_reply"] = request.auto_reply
    if request.typing_indicator is not None:
        bot_settings["typing_indicator"] = request.typing_indicator
    if request.response_delay is not None:
        bot_settings["response_delay"] = request.response_delay
    
    return bot_settings

@app.post("/bot/toggle")
async def toggle_bot():
    bot_settings["auto_reply"] = not bot_settings["auto_reply"]
    return {"online": bot_settings["auto_reply"]}

@app.websocket("/ws/activity")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "total_chunks": retriever.get_collection_count(),
        "bot_online": bot_settings["auto_reply"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
