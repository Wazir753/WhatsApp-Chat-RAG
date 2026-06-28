import requests
import time
import os
from typing import List, Dict, Any, Optional

class LLMClient:
    def __init__(self):
        self.hf_token = os.getenv("HUGGINGFACE_API_KEY")
        self.hf_api_url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
    
    def generate_response(self, query: str, context: str, memory: Optional[List[Dict[str, str]]] = None, mode: str = "ask") -> Dict[str, Any]:
        system_prompt = """You are ArachnoBot, a friendly AI assistant. 
Answer based only on the WhatsApp chat context provided.
Be concise, friendly, use emojis occasionally.
Reference who said what and when."""
        
        memory_text = ""
        if memory:
            memory_text = "\n\nPrevious conversation:\n" + "\n".join([
                f"Q: {m['query']}\nA: {m['response']}" for m in memory[-5:]
            ])
        
        prompt = f"<s>[INST] {system_prompt}\n\nChat context:\n{context}\n\nUser question: {query}{memory_text} [/INST]"
        
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    self.hf_api_url,
                    headers=headers,
                    json={"inputs": prompt, "parameters": {"max_new_tokens": 512, "temperature": 0.7}}
                )
                
                if response.status_code == 503:
                    if attempt < max_retries - 1:
                        time.sleep(20)
                        continue
                    else:
                        return {
                            "answer": "🕷️ My brain is warming up! Try again in 30 seconds.",
                            "model": "mistral-7b",
                            "success": False
                        }
                
                response.raise_for_status()
                result = response.json()
                
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get("generated_text", "")
                    if "[/INST]" in generated_text:
                        generated_text = generated_text.split("[/INST]")[1].strip()
                    return {
                        "answer": generated_text,
                        "model": "mistral-7b",
                        "success": True
                    }
                else:
                    raise Exception("Unexpected response format")
                    
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(5)
                    continue
                else:
                    return {
                        "answer": "🕷️ My brain is warming up! Try again in 30 seconds.",
                        "model": "mistral-7b",
                        "success": False,
                        "error": str(e)
                    }
        
        return {
            "answer": "🕷️ My brain is warming up! Try again in 30 seconds.",
            "model": "mistral-7b",
            "success": False
        }
    
    def summarize_conversation(self, context: str, contact_name: str) -> Dict[str, Any]:
        system_prompt = f"""You are ArachnoBot. Summarize the conversation with {contact_name}.
Extract key topics, main themes, and provide a brief summary.
Be concise and use emojis."""
        
        prompt = f"<s>[INST] {system_prompt}\n\nConversation:\n{context} [/INST]"
        
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    self.hf_api_url,
                    headers=headers,
                    json={"inputs": prompt, "parameters": {"max_new_tokens": 512, "temperature": 0.7}}
                )
                
                if response.status_code == 503:
                    if attempt < max_retries - 1:
                        time.sleep(20)
                        continue
                    else:
                        return self._default_summary(contact_name)
                
                response.raise_for_status()
                result = response.json()
                
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get("generated_text", "")
                    if "[/INST]" in generated_text:
                        generated_text = generated_text.split("[/INST]")[1].strip()
                    
                    return {
                        "key_topics": ["general chat"],
                        "last_talked": "recently",
                        "message_count": "multiple",
                        "summary": generated_text
                    }
                    
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(5)
                    continue
        
        return self._default_summary(contact_name)
    
    def _default_summary(self, contact_name: str) -> Dict[str, Any]:
        return {
            "key_topics": ["various topics"],
            "last_talked": "recently",
            "message_count": "multiple",
            "summary": f"🕷️ Had various conversations with {contact_name}. Topics included general discussions and updates."
        }
