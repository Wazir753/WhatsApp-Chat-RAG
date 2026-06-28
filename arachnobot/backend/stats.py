from typing import Dict, Any, List
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import threading

class StatsTracker:
    def __init__(self):
        self.queries: List[Dict[str, Any]] = []
        self.sync_stats: Dict[str, int] = {"chunks_stored": 0, "contacts_indexed": 0}
        self.start_time = datetime.now()
        self.lock = threading.Lock()
    
    def record_query(self, mode: str, sender: str, query: str, response_time: float, status: str):
        with self.lock:
            self.queries.append({
                "mode": mode,
                "sender": sender,
                "query": query,
                "response_time": response_time,
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
            
            if len(self.queries) > 1000:
                self.queries = self.queries[-1000:]
    
    def update_sync_stats(self, sync_result: Dict[str, int]):
        with self.lock:
            self.sync_stats["chunks_stored"] += sync_result["chunks_stored"]
            self.sync_stats["contacts_indexed"] = sync_result["contacts_indexed"]
    
    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            now = datetime.now()
            today = now.date()
            
            today_queries = [q for q in self.queries if datetime.fromisoformat(q["timestamp"]).date() == today]
            
            mode_counts = Counter(q["mode"] for q in self.queries)
            
            response_times = [q["response_time"] for q in self.queries if q["status"] == "success"]
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
            
            last_7_days = []
            for i in range(7):
                day = now - timedelta(days=i)
                day_queries = [q for q in self.queries if datetime.fromisoformat(q["timestamp"]).date() == day.date()]
                last_7_days.append({
                    "date": day.date().isoformat(),
                    "count": len(day_queries)
                })
            
            sender_counts = Counter(q["sender"] for q in self.queries)
            most_active_senders = sender_counts.most_common(10)
            
            uptime = (now - self.start_time).total_seconds()
            
            return {
                "total_chunks": self.sync_stats["chunks_stored"],
                "total_contacts": self.sync_stats["contacts_indexed"],
                "messages_today": len(today_queries),
                "avg_response_time": round(avg_response_time, 2),
                "uptime_seconds": uptime,
                "query_types": dict(mode_counts),
                "messages_per_day": last_7_days[::-1],
                "most_active_senders": most_active_senders,
                "total_queries": len(self.queries)
            }
