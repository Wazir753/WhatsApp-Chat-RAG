import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import os

class Retriever:
    def __init__(self, collection_name: str = "arachnobot_chats", persist_directory: str = "./chroma_db"):
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
        
        ids = [f"chunk_{i}_{hash(chunk['text']) % 1000000}" for i in range(len(chunks))]
        documents = [chunk["text"] for chunk in chunks]
        
        metadatas = []
        for chunk in chunks:
            metadata = {
                "contact": chunk.get("contact", "unknown"),
                "date": chunk.get("date", ""),
                "direction": chunk.get("direction", "unknown")
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
            
            if filters.get("contact"):
                conditions.append({"contact": {"$eq": filters["contact"]}})
            
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
    
    def get_all_chunks(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        where_filter = None
        
        if filters:
            if filters.get("contact"):
                where_filter = {"contact": {"$eq": filters["contact"]}}
        
        results = self.collection.get(where=where_filter)
        
        formatted_chunks = []
        if results["ids"]:
            for i in range(len(results["ids"])):
                formatted_chunks.append({
                    "id": results["ids"][i],
                    "text": results["documents"][i],
                    "metadata": results["metadatas"][i]
                })
        
        return formatted_chunks
    
    def get_all_contacts(self) -> List[Dict[str, Any]]:
        results = self.collection.get()
        
        contacts = {}
        if results["metadatas"]:
            for metadata in results["metadatas"]:
                contact = metadata.get("contact", "unknown")
                if contact not in contacts:
                    contacts[contact] = 0
                contacts[contact] += 1
        
        return [{"name": contact, "message_count": count} for contact, count in contacts.items()]
    
    def delete_chunks_by_contact(self, contact_name: str):
        where_filter = {"contact": {"$eq": contact_name}}
        results = self.collection.get(where=where_filter)
        
        if results["ids"]:
            self.collection.delete(ids=results["ids"])
    
    def get_collection_count(self) -> int:
        return self.collection.count()
    
    def delete_collection(self):
        self.client.delete_collection(name=self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
