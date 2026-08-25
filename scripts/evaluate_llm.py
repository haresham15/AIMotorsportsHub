"""
LLM Evaluation Harness for Apexis Chatbot
Scores a golden dataset against the Chat API endpoint using exact-match and semantic similarity.
"""

import json
import os
import requests
import google.generativeai as genai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

EVAL_SET_PATH = os.path.join("data", "eval_set.json")
API_ENDPOINT = "http://localhost:3000/api/ai/chat"
OUTPUT_REPORT = "llm_evaluation_report.md"

def get_embedding(text, model="models/gemini-embedding-001"):
    try:
        result = genai.embed_content(
            model=model,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error embedding text: {e}")
        return [0] * 768

def evaluate():
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_api_key:
        print("Missing GEMINI_API_KEY. Cannot run semantic evaluation.")
        return
        
    genai.configure(api_key=gemini_api_key)
    
    if not os.path.exists(EVAL_SET_PATH):
        print(f"Eval set not found at {EVAL_SET_PATH}")
        return
        
    with open(EVAL_SET_PATH, 'r') as f:
        qa_pairs = json.load(f)
        
    results = []
    total_exact_match = 0
    total_semantic_score = 0
    
    print(f"Running evaluation on {len(qa_pairs)} questions...")
    
    for i, pair in enumerate(qa_pairs):
        question = pair["question"]
        expected_keywords = [k.lower() for k in pair["expected_answer_keywords"]]
        
        # 1. Get Model Answer
        try:
            # We mock contextData since the API requires it to fallback gracefully
            payload = {
                "prompt": question,
                "series": "f1",
                "contextData": {
                    "championship": "Max Verstappen is leading with Red Bull Racing."
                }
            }
            res = requests.post(API_ENDPOINT, json=payload)
            model_answer = res.json().get("reply", "")
        except Exception as e:
            model_answer = f"API Error: {e}"
            
        # 2. Exact/Keyword Match
        answer_lower = model_answer.lower()
        keyword_hits = sum(1 for kw in expected_keywords if kw in answer_lower)
        exact_match = keyword_hits > 0
        if exact_match:
            total_exact_match += 1
            
        # 3. Semantic Similarity
        # We embed the expected keywords joined together, and compare with model answer
        expected_text = " ".join(expected_keywords)
        emb_expected = get_embedding(expected_text)
        emb_model = get_embedding(model_answer)
        
        sim = cosine_similarity([emb_expected], [emb_model])[0][0]
        total_semantic_score += sim
        
        results.append({
            "question": question,
            "expected_keywords": expected_keywords,
            "model_answer": model_answer,
            "exact_match": exact_match,
            "semantic_similarity": round(float(sim), 3)
        })
        
        print(f"Q{i+1}: {exact_match} (Sim: {sim:.2f})")
        
    # Aggregate Metrics
    avg_exact = total_exact_match / len(qa_pairs)
    avg_semantic = total_semantic_score / len(qa_pairs)
    
    # Generate Markdown Report
    with open(OUTPUT_REPORT, 'w') as f:
        f.write("# Apexis LLM Evaluation Report\n\n")
        f.write(f"**Total Questions:** {len(qa_pairs)}\n")
        f.write(f"**Exact Keyword Match Rate:** {avg_exact * 100:.1f}%\n")
        f.write(f"**Average Semantic Similarity:** {avg_semantic:.3f}\n\n")
        f.write("## Detailed Results\n")
        
        for r in results:
            f.write(f"### Q: {r['question']}\n")
            f.write(f"- **Expected Keywords:** {', '.join(r['expected_keywords'])}\n")
            f.write(f"- **Model Answer:** {r['model_answer']}\n")
            f.write(f"- **Exact Match:** {'✅' if r['exact_match'] else '❌'}\n")
            f.write(f"- **Semantic Score:** {r['semantic_similarity']}\n\n")
            
    print(f"\nEvaluation complete. Report generated at {OUTPUT_REPORT}")

if __name__ == "__main__":
    evaluate()
