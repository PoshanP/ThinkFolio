import { createServerClientSSR } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRequestLogger } from '@/lib/logger'

const logger = createRequestLogger('Database')

export interface QueryOptions {
  select?: string
  limit?: number
  offset?: number
  orderBy?: {
    column: string
    ascending?: boolean
  }
  filters?: Array<{
    column: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in'
    value: any
  }>
}

export class DatabaseService {
  private static queryTimeout = 30000 // 30 seconds

  static async transaction<T>(
    callback: (client: any) => Promise<T>
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

  static async query<T>(
    table: string,
    options?: QueryOptions
  ): Promise<{ data: T[]; count: number | null }> {
    try {
      const supabase = await createServerClientSSR()
      let query = supabase.from(table).select(options?.select || '*', { count: 'exact' })

      // Apply filters
      if (options?.filters) {
        for (const filter of options.filters) {
          query = (query as any)[filter.operator](filter.column, filter.value)
        }
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        })
      }

      // Apply pagination
      if (options?.limit) {
        const offset = options.offset || 0
        query = query.range(offset, offset + options.limit - 1)
      }

      const { data, count, error } = await query

      if (error) {
        logger.error({ error, table, options }, 'Query failed')
        throw error
      }

      return { data: data || [], count }
    } catch (error) {
      logger.error({ error }, 'Database query error')
      throw new Error('Database query failed')
    }
  }

  static async batchInsert<T>(
    table: string,
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
      // This would typically query pg_stat_activity in a real PostgreSQL setup
      // For Supabase, we'll return mock stats
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

  static async optimizeTable(table: string): Promise<void> {
    try {
      // In a real PostgreSQL setup, you would run VACUUM ANALYZE
      // This is a placeholder for Supabase
      logger.info({ table }, 'Table optimization requested')

      // You can implement table-specific optimizations here
      // For example, rebuilding indexes, updating statistics, etc.
    } catch (error) {
      logger.error({ error, table }, 'Table optimization failed')
      throw new Error('Failed to optimize table')
    }
  }
}

export class QueryBuilder {
  private table: string
  private options: QueryOptions = {}

  constructor(table: string) {
    this.table = table
  }

  select(columns: string): this {
    this.options.select = columns
    return this
  }

  where(column: string, operator: NonNullable<QueryOptions['filters']>[0]['operator'], value: any): this {
    if (!this.options.filters) {
      this.options.filters = []
    }
    this.options.filters!.push({ column, operator, value })
    return this
  }

  orderBy(column: string, ascending: boolean = true): this {
    this.options.orderBy = { column, ascending }
    return this
  }

  limit(limit: number): this {
    this.options.limit = limit
    return this
  }

  offset(offset: number): this {
    this.options.offset = offset
    return this
  }

  async execute<T>(): Promise<{ data: T[]; count: number | null }> {
    return DatabaseService.query<T>(this.table, this.options)
  }
}

export function createQueryBuilder(table: string): QueryBuilder {
  return new QueryBuilder(table)
}