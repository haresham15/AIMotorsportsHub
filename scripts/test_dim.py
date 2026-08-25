import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(".env.local")
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

for m in ["models/gemini-embedding-001", "models/gemini-embedding-2"]:
    try:
        res = genai.embed_content(model=m, content="Test", task_type="retrieval_document")
        print(f"{m} length: {len(res['embedding'])}")
    except Exception as e:
        print(f"{m} error: {e}")
