import { createServerClientSSR } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRequestLogger } from '@/lib/logger'
import type { Database } from '@/lib/types/database'

const logger = createRequestLogger('Database')

type TableName = keyof Database['public']['Tables']

export class DatabaseService {
  static async transaction<T>(
    callback: (client: ReturnType<typeof createAdminClient>) => Promise<T>
  ): Promise<T> {
    const client = createAdminClient()
    try {
      const result = await callback(client)
      return result
    } catch (error) {
      logger.error({ error }, 'Transaction failed')
      throw error
    }
  }

  static async batchInsert<T>(
    table: TableName,
    records: T[],
    chunkSize: number = 100
  ): Promise<void> {
    try {
      const client = createAdminClient()

      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize)

        const { error } = await client
          .from(table)
          .insert(chunk as any)

        if (error) {
          logger.error({ error, table, chunkIndex: i }, 'Batch insert failed')
          throw error
        }

        logger.info({
          table,
          inserted: Math.min(i + chunkSize, records.length),
          total: records.length
        }, 'Batch insert progress')
      }
    } catch (error) {
      logger.error({ error }, 'Batch insert error')
      throw new Error('Batch insert failed')
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const supabase = await createServerClientSSR()
      const { error } = await supabase
        .from('papers')
        .select('id')
        .limit(1)

      if (error) {
        logger.error({ error }, 'Health check failed')
        return false
      }

      return true
    } catch (error) {
      logger.error({ error }, 'Health check error')
      return false
    }
  }

  static async getConnectionStats() {
    try {
      return {
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        maxConnections: 100,
        healthy: await this.healthCheck()
      }
    } catch (error) {
      logger.error({ error }, 'Failed to get connection stats')
      return null
    }
  }
}
