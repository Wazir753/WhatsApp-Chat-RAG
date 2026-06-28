import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
from datetime import datetime
import os


class Retriever:
    def __init__(self, collection_name: str = "whatsapp_chats", persist_directory: str = "./chroma_db"):
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.client = None
        self.collection = None
        self._initialize_client()
    
    def _initialize_client(self):
        os.makedirs(self.persist_directory, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def add_chunks(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        if not chunks or not embeddings:
            return
        
        ids = [f"chunk_{i}" for i in range(len(chunks))]
        documents = [chunk["text"] for chunk in chunks]
        
        metadatas = []
        for chunk in chunks:
            metadata = {
                "participants": ",".join(chunk["participants"]),
                "date_start": chunk["date_start"].isoformat(),
                "date_end": chunk["date_end"].isoformat(),
                "message_count": chunk["message_count"]
            }
            metadatas.append(metadata)
        
        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )
    
    def search(self, query_embedding: List[float], n_results: int = 5, 
               filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        where_filter = None
        
        if filters:
            conditions = []
            
            if filters.get("participant"):
                conditions.append({
                    "participants": {"$contains": filters["participant"]}
                })
            
            if filters.get("date_start") and filters.get("date_end"):
                conditions.append({
                    "date_start": {"$gte": filters["date_start"]},
                    "date_end": {"$lte": filters["date_end"]}
                })
            
            if filters.get("keyword"):
                conditions.append({
                    "$or": [
                        {"document": {"$contains": filters["keyword"]}}
                    ]
                })
            
            if len(conditions) == 1:
                where_filter = conditions[0]
            elif len(conditions) > 1:
                where_filter = {"$and": conditions}
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter
        )
        
        formatted_results = []
        if results["ids"] and results["ids"][0]:
            for i in range(len(results["ids"][0])):
                formatted_results.append({
                    "id": results["ids"][0][i],
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "similarity": 1 - results["distances"][0][i] if results["distances"] else 0
                })
        
        return {"results": formatted_results}
    
    def get_collection_count(self) -> int:
        return self.collection.count()
    
    def delete_collection(self):
        self.client.delete_collection(name=self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def collection_exists(self) -> bool:
        try:
            self.client.get_collection(name=self.collection_name)
            return True
        except:
            return False
