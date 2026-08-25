/**
 * Automated LLM Evaluation Harness
 * 
 * Run this script locally to test the AI Chatbot endpoint against a suite of standard prompts.
 * This ensures we don't regress on RAG rules accuracy or function-calling logic.
 * 
 * Usage: npx ts-node scripts/eval_chatbot.ts
 */

const API_URL = 'http://localhost:3000/api/ai/chat';

interface TestCase {
  name: string;
  prompt: string;
  expectedKeywords: string[];
  mustNotContain?: string[];
}

const testCases: TestCase[] = [
  {
    name: "General knowledge / Fallback",
    prompt: "Who won the 2021 F1 Championship?",
    expectedKeywords: ["Max", "Verstappen", "2021"],
  },
  {
    name: "RAG Rules Check: Track Limits",
    prompt: "What is the penalty for exceeding track limits 4 times in F1?",
    expectedKeywords: ["5-second", "time penalty", "black-and-white"],
  },
  {
    name: "RAG Rules Check: Sprint Points",
    prompt: "How many points does P1 get in an F1 sprint race?",
    expectedKeywords: ["8", "points"],
    mustNotContain: ["25"]
  },
  {
    name: "Function Calling Check: Standings",
    prompt: "Who is currently leading the championship?",
    // Since the API requires contextData for standings or fetches from local endpoints,
    // this test will at least verify it didn't throw an error and tried to answer.
    expectedKeywords: [], 
  }
];

async function runEval() {
  console.log('🏁 Starting LLM Evaluation Harness...\n');
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`Test: ${test.name}`);
    console.log(`Prompt: "${test.prompt}"`);
    
    try {
      const start = Date.now();
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: test.prompt,
          series: 'f1',
          contextData: { championship: { leader: "Max Verstappen" } } // Mocked context
        })
      });
      
      const duration = Date.now() - start;

      if (!res.ok) {
        console.error(`❌ FAILED (HTTP ${res.status})`);
        failed++;
        continue;
      }

      const data = await res.json();
      const reply = data.reply.toLowerCase();
      console.log(`Response (${duration}ms): "${data.reply.substring(0, 80)}..."`);

      let testPassed = true;
      for (const keyword of test.expectedKeywords) {
        if (!reply.includes(keyword.toLowerCase())) {
          console.error(`❌ FAILED: Missing expected keyword "${keyword}"`);
          testPassed = false;
        }
      }

      if (test.mustNotContain) {
        for (const keyword of test.mustNotContain) {
          if (reply.includes(keyword.toLowerCase())) {
            console.error(`❌ FAILED: Found forbidden keyword "${keyword}"`);
            testPassed = false;
          }
        }
      }

      if (testPassed) {
        console.log(`✅ PASSED\n`);
        passed++;
      } else {
        console.log('');
        failed++;
      }

    } catch (e: any) {
      console.error(`❌ FAILED: Network error - ${e.message}\n`);
      failed++;
    }
  }

  console.log('-----------------------------------');
  console.log(`🏁 Evaluation Complete: ${passed} Passed, ${failed} Failed`);
}

// execute
if (require.main === module) {
  runEval();
}
