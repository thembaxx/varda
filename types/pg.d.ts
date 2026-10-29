/**
 * Narrow typings for the pg operations used by Varda. The driver is kept in
 * dependencies (rather than importing a second query-builder library).
 */
declare module 'pg' {
  export interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number | null;
  }
  export interface PoolClient {
    query<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<QueryResult<T>>;
    release(): void;
  }
  export class Pool {
    constructor(options: {
      connectionString: string;
      max?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
      allowExitOnIdle?: boolean;
    });
    query<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<QueryResult<T>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    on(event: 'error', callback: (error: Error) => void): this;
  }
}
