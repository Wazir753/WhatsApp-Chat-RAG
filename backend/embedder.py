from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Generator
import os


class Embedder:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self._load_model()
    
    def _load_model(self):
        if self.model is None:
            print(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            print("Model loaded successfully")
    
    def embed_chunks(self, chunks: List[Dict[str, Any]], progress_callback=None) -> List[List[float]]:
        texts = [chunk["text"] for chunk in chunks]
        total = len(texts)
        
        embeddings = []
        batch_size = 32
        
        for i in range(0, total, batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_embeddings = self.model.encode(batch_texts, show_progress_bar=False)
            embeddings.extend(batch_embeddings.tolist())
            
            if progress_callback:
                progress = min(i + batch_size, total)
                progress_callback(progress, total)
        
        return embeddings
    
    def embed_query(self, query: str) -> List[float]:
        embedding = self.model.encode(query, show_progress_bar=False)
        return embedding.tolist()
    
    def get_embedding_dimension(self) -> int:
        if self.model is None:
            self._load_model()
        return self.model.get_sentence_embedding_dimension()
