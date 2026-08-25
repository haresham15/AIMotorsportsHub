"""
Generates embeddings for FIA regulations and upserts them into Supabase pgvector.
"""

import os
import json
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env.local")

def chunk_text(text, chunk_size=1000, overlap=100):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def generate_and_upsert_embeddings():
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if not all([gemini_api_key, supabase_url, supabase_key]):
        print("Missing required environment variables:")
        print("- GEMINI_API_KEY")
        print("- NEXT_PUBLIC_SUPABASE_URL")
        print("- SUPABASE_SERVICE_KEY")
        return
        
    genai.configure(api_key=gemini_api_key)
    supabase: Client = create_client(supabase_url, supabase_key)
    
    file_path = os.path.join('data', 'fia_regulations_2024.md')
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
        
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
        
    print("Chunking document...")
    chunks = chunk_text(text)
    
    print(f"Generating embeddings for {len(chunks)} chunks using gemini-embedding-001...")
    for i, chunk in enumerate(chunks):
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=chunk,
                task_type="retrieval_document"
            )
            embedding = result['embedding']
            
            # Upsert into Supabase
            supabase.table('documents').insert({
                'content': chunk,
                'metadata': {"source": "fia_regulations_2024", "chunk_index": i},
                'embedding': embedding
            }).execute()
            
            if (i + 1) % 10 == 0:
                print(f"Processed {i + 1}/{len(chunks)} chunks.")
                
        except Exception as e:
            print(f"Error processing chunk {i}: {e}")
            
    print("Successfully upserted all embeddings to Supabase pgvector.")

if __name__ == "__main__":
    generate_and_upsert_embeddings()
