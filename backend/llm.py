import anthropic
import requests
from typing import List, Dict, Any
import os


class LLMClient:
    def __init__(self):
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.hf_token = os.getenv("HF_TOKEN")
        self.anthropic_client = None
        self.hf_api_url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
        
        if self.anthropic_api_key:
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
    
    def generate_response_claude(self, query: str, context: str) -> str:
        if not self.anthropic_client:
            raise Exception("Anthropic API key not configured")
        
        system_prompt = """You are analyzing a WhatsApp conversation history. Answer questions based only on the provided chat context. When referencing messages, mention who said it and approximately when."""
        
        user_message = f"""Context from WhatsApp chat:
{context}

Question: {query}

Please answer based only on the provided context above."""
        
        try:
            response = self.anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )
            return response.content[0].text
        except Exception as e:
            raise Exception(f"Claude API error: {str(e)}")
    
    def generate_response_mistral(self, query: str, context: str) -> str:
        if not self.hf_token:
            raise Exception("HuggingFace token not configured")
        
        system_prompt = """You are analyzing a WhatsApp conversation history. Answer questions based only on the provided chat context. When referencing messages, mention who said it and approximately when."""
        
        prompt = f"""[INST] {system_prompt}

Context from WhatsApp chat:
{context}

Question: {query} [/INST]"""
        
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        
        try:
            response = requests.post(
                self.hf_api_url,
                headers=headers,
                json={"inputs": prompt, "parameters": {"max_new_tokens": 512, "temperature": 0.7}}
            )
            response.raise_for_status()
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get("generated_text", "")
                if "[/INST]" in generated_text:
                    generated_text = generated_text.split("[/INST]")[1].strip()
                return generated_text
            else:
                raise Exception("Unexpected response format from HuggingFace API")
        except Exception as e:
            raise Exception(f"Mistral API error: {str(e)}")
    
    def generate_response(self, query: str, context: str, use_fallback: bool = True) -> Dict[str, Any]:
        try:
            response = self.generate_response_claude(query, context)
            return {
                "answer": response,
                "model": "claude-sonnet-4-20250514",
                "success": True
            }
        except Exception as claude_error:
            if use_fallback and self.hf_token:
                try:
                    response = self.generate_response_mistral(query, context)
                    return {
                        "answer": response,
                        "model": "mistral-7b",
                        "success": True,
                        "fallback": True,
                        "error": str(claude_error)
                    }
                except Exception as mistral_error:
                    return {
                        "answer": None,
                        "model": None,
                        "success": False,
                        "error": f"Claude error: {str(claude_error)}. Mistral fallback error: {str(mistral_error)}"
                    }
            else:
                return {
                    "answer": None,
                    "model": None,
                    "success": False,
                    "error": str(claude_error)
                }
