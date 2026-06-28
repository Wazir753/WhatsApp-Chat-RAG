from typing import List, Dict, Any
from datetime import datetime
from collections import defaultdict

def sync_chat_history(messages: List[Dict[str, Any]], embedder, retriever) -> Dict[str, int]:
    if not messages:
        return {"chunks_stored": 0, "contacts_indexed": 0}
    
    messages_by_contact = defaultdict(list)
    
    for msg in messages:
        contact = msg.get("contact", "unknown")
        messages_by_contact[contact].append(msg)
    
    all_chunks = []
    
    for contact, contact_messages in messages_by_contact.items():
        contact_messages.sort(key=lambda x: x["timestamp"])
        
        chunks = chunk_messages(contact_messages, contact)
        all_chunks.extend(chunks)
    
    if all_chunks:
        embeddings = embedder.embed_chunks(all_chunks)
        retriever.add_chunks(all_chunks, embeddings)
    
    return {
        "chunks_stored": len(all_chunks),
        "contacts_indexed": len(messages_by_contact)
    }

def chunk_messages(messages: List[Dict[str, Any]], contact: str, window_size: int = 10, overlap: int = 3) -> List[Dict[str, Any]]:
    if not messages:
        return []
    
    chunks = []
    step = window_size - overlap
    
    for i in range(0, len(messages), step):
        chunk_messages = messages[i:i + window_size]
        if not chunk_messages:
            continue
        
        chunk_text = "\n".join([
            f"[{msg['timestamp']}] {msg['direction']}: {msg['message']}"
            for msg in chunk_messages
        ])
        
        date_start = chunk_messages[0]["timestamp"]
        date_end = chunk_messages[-1]["timestamp"]
        
        chunks.append({
            "text": chunk_text,
            "contact": contact,
            "date": date_start,
            "direction": chunk_messages[0]["direction"]
        })
    
    return chunks
