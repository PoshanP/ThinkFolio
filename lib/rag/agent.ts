import { ConfigManager, loadConfigFromEnv } from './config'
import { RAGAgent } from './rag_agent'

let ragAgent: RAGAgent | null = null

export function getRAGAgent(): RAGAgent {
  if (ragAgent) {
    return ragAgent
  }

  const configManager = new ConfigManager(loadConfigFromEnv())
  const config = configManager.get()

  ragAgent = new RAGAgent({
    openaiApiKey: config.openai.apiKey,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    chromaUrl: config.vectorStore.chromaUrl,
    vectorStoreType: config.vectorStore.type,
    modelName: config.openai.model,
    chunkSize: config.chunking.chunkSize,
    chunkOverlap: config.chunking.chunkOverlap,
  })

  return ragAgent
}
