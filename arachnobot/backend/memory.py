from typing import List, Dict, Optional
from datetime import datetime, timedelta
import threading

class MemoryStore:
    def __init__(self):
        self.memories: Dict[str, List[Dict[str, str]]] = {}
        self.last_activity: Dict[str, datetime] = {}
        self.lock = threading.Lock()
        self.timeout = timedelta(minutes=30)
    
    def add_memory(self, sender_id: str, query: str, response: str):
        with self.lock:
            if sender_id not in self.memories:
                self.memories[sender_id] = []
            
            self.memories[sender_id].append({
                "query": query,
                "response": response,
                "timestamp": datetime.now().isoformat()
            })
            
            if len(self.memories[sender_id]) > 5:
                self.memories[sender_id] = self.memories[sender_id][-5:]
            
            self.last_activity[sender_id] = datetime.now()
    
    def get_memory(self, sender_id: str) -> List[Dict[str, str]]:
        with self.lock:
            self._cleanup_old_memories()
            
            if sender_id not in self.memories:
                return []
            
            self.last_activity[sender_id] = datetime.now()
            return self.memories[sender_id]
    
    def clear_memory(self, sender_id: str):
        with self.lock:
            if sender_id in self.memories:
                del self.memories[sender_id]
            if sender_id in self.last_activity:
                del self.last_activity[sender_id]
    
    def _cleanup_old_memories(self):
        now = datetime.now()
        to_remove = []
        
        for sender_id, last_active in self.last_activity.items():
            if now - last_active > self.timeout:
                to_remove.append(sender_id)
        
        for sender_id in to_remove:
            self.clear_memory(sender_id)
