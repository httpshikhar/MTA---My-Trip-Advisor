import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

def search_perplexity(query: str) -> str:
    """
    Searches the web using the Perplexity API to get live information.
    """
    if not PERPLEXITY_API_KEY:
        return "Error: Perplexity API key is not set. Please set PERPLEXITY_API_KEY in your .env file."
    url = "https://api.perplexity.ai/chat/completions" # This is a placeholder, check Perplexity API docs for actual endpoint
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "sonar", # Or another suitable online model from Perplexity
        "messages": [
            {"role": "user", "content": query}
        ]
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        # Extract relevant information from the Perplexity response
        # This part might need adjustment based on actual Perplexity API response structure
        if result and result.get("choices"):
            return result["choices"][0]["message"]["content"]
        return "No relevant search results found."
    except requests.exceptions.RequestException as e:
        return f"Error during Perplexity search: {e}"

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_perplexity",
            "description": "Searches the web using the Perplexity API to get live information for trip planning.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query for Perplexity API."
                    }
                },
                "required": ["query"]
            }
        }
    }
]
