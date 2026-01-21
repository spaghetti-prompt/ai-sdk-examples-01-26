import { openai } from '@ai-sdk/openai'
import { generateText, Output } from 'ai'
import { z } from 'zod'

// ============================================
// 1. DATASET - Test cases for email classification
// ============================================
const dataset = [
  {
    input: 'I was charged twice for my subscription this month.',
    expected: 'billing',
    difficulty: 'easy',
  },
  {
    input: 'The app crashes when I export to CSV.',
    expected: 'technical',
    difficulty: 'easy',
  },
  {
    input: 'Love your product! Thanks for the great service.',
    expected: 'general',
    difficulty: 'easy',
  },
  {
    input: 'Payment failed but I see a pending charge. Is this a bug?',
    expected: 'billing',
    difficulty: 'hard',
  },
]

// ============================================
// 2. SCHEMA - Classification output schema
// ============================================
const ClassificationSchema = z.object({
  category: z.enum(['billing', 'technical', 'general']),
  confidence: z.number().min(0).max(1),
})

// ============================================
// 3. RUNNER - Execute classification
// ============================================
interface ClassifyEmailInput {
  email: string
}

async function classifyEmail({ email }: ClassifyEmailInput) {
  // AI SDK docs: structured outputs with Output.object + Zod schemas
  // https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
  const { output } = await generateText({
    model: openai('gpt-4o-mini'),
    output: Output.object({
      schema: ClassificationSchema,
    }),
    prompt: `Classify the following customer support email into one of three categories: "billing", "technical", or "general". 
            Return a JSON object with both "category" and "confidence" (0.0–1.0).

            Email:
            ${email}
            `,
  })

  return output
}

interface EvalResult {
  input: string
  expected: string
  actual: string
  confidence: number
  passed: boolean
  difficulty: string
}

async function runEval(): Promise<EvalResult[]> {
  const results: EvalResult[] = []

  for (const testCase of dataset) {
    console.log(`Testing: "${testCase.input.slice(0, 50)}..."`)

    const { category, confidence } = await classifyEmail({
      email: testCase.input,
    })

    const passed = category === testCase.expected

    results.push({
      input: testCase.input,
      expected: testCase.expected,
      actual: category,
      confidence,
      passed,
      difficulty: testCase.difficulty,
    })

    console.log(`  → ${passed ? '✅' : '❌'} Expected: ${testCase.expected}, Got: ${category} (confidence: ${confidence.toFixed(2)})`)
  }

  return results
}

// ============================================
// 4. SCORER - Calculate metrics
// ============================================
interface Metrics {
  accuracy: number
  totalTests: number
  passed: number
  failed: number
  byDifficulty: Record<string, { accuracy: number; total: number }>
}

function calculateMetrics(results: EvalResult[]): Metrics {
  const total = results.length
  const passed = results.filter((r) => r.passed).length
  const accuracy = total > 0 ? passed / total : 0

  // Group by difficulty
  const byDifficulty: Record<string, { passed: number; total: number }> = {}
  for (const result of results) {
    const difficulty = result.difficulty
    const entry = byDifficulty[difficulty] ?? { passed: 0, total: 0 }
    entry.total++
    if (result.passed) {
      entry.passed++
    }
    byDifficulty[difficulty] = entry
  }

  const byDifficultyMetrics: Record<string, { accuracy: number; total: number }> = {}
  for (const [difficulty, stats] of Object.entries(byDifficulty)) {
    byDifficultyMetrics[difficulty] = {
      accuracy: stats.total > 0 ? stats.passed / stats.total : 0,
      total: stats.total,
    }
  }

  return {
    accuracy,
    totalTests: total,
    passed,
    failed: total - passed,
    byDifficulty: byDifficultyMetrics,
  }
}

// ============================================
// 5. MAIN - Run the evaluation
// ============================================
async function main() {
  console.log('🧪 Running Email Classification Eval')
  console.log('=====================================')
  console.log(`Model: gpt-4o-mini`)
  console.log(`Test cases: ${dataset.length}\n`)

  const results = await runEval()

  console.log('\n=====================================')
  console.log('📊 RESULTS')
  console.log('=====================================')

  const metrics = calculateMetrics(results)

  console.log(`\nOverall Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`)
  console.log(`Passed: ${metrics.passed}/${metrics.totalTests}`)
  console.log(`Failed: ${metrics.failed}/${metrics.totalTests}`)

  console.log('\nBy Difficulty:')
  for (const [difficulty, stats] of Object.entries(metrics.byDifficulty)) {
    console.log(`  ${difficulty}: ${(stats.accuracy * 100).toFixed(1)}% (${stats.total} tests)`)
  }

  // Show failures if any
  const failures = results.filter((r) => !r.passed)
  if (failures.length > 0) {
    console.log('\n❌ Failed Tests:')
    for (const failure of failures) {
      console.log(`  Input: "${failure.input.slice(0, 60)}..."`)
      console.log(`    Expected: ${failure.expected}, Got: ${failure.actual}`)
    }
  }
}

main().catch(console.error)
