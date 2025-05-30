import { Driver, Session, driver, auth } from 'neo4j-driver';

/**
 * Configuration interface for Neo4j connection
 */
interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

/**
 * Neo4j database connector class that manages connections and provides query methods
 */
export class Neo4jConnector {
  private readonly driver: Driver;
  private readonly database: string;

  /**
   * Creates a new Neo4j connector instance
   * @param config - Neo4j connection configuration
   */
  constructor(config: Neo4jConfig) {
    this.database = config.database || 'neo4j';
    this.driver = driver(
      config.uri,
      auth.basic(config.username, config.password)
    );
  }

  /**
   * Gets a new session for executing queries
   */
  private getSession(): Session {
    return this.driver.session({ database: this.database });
  }

  /**
   * Executes a read query
   * @param cypher - The Cypher query to execute
   * @param params - Query parameters
   * @returns Query results
   */
  public async executeRead<T>(cypher: string, params: Record<string, any> = {}): Promise<T[]> {
    const session = this.getSession();
    try {
      const result = await session.executeRead(tx => 
        tx.run(cypher, params)
      );
      return result.records.map(record => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  /**
   * Executes a write query
   * @param cypher - The Cypher query to execute
   * @param params - Query parameters
   * @returns Query results
   */
  public async executeWrite<T>(cypher: string, params: Record<string, any> = {}): Promise<T[]> {
    const session = this.getSession();
    try {
      const result = await session.executeWrite(tx => 
        tx.run(cypher, params)
      );
      return result.records.map(record => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  /**
   * Executes a transaction with multiple queries
   * @param queries - Array of queries with their parameters
   * @returns Array of results for each query
   */
  public async executeTransaction<T>(
    queries: Array<{ cypher: string; params?: Record<string, any> }>
  ): Promise<T[][]> {
    const session = this.getSession();
    try {
      const results = await session.executeWrite(async tx => {
        const queryResults = [];
        for (const query of queries) {
          const result = await tx.run(query.cypher, query.params || {});
          queryResults.push(result.records.map(record => record.toObject() as T));
        }
        return queryResults;
      });
      return results;
    } finally {
      await session.close();
    }
  }

  /**
   * Closes the database connection
   */
  public async close(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Verifies the database connection
   * @throws Error if connection fails
   */
  public async verifyConnection(): Promise<void> {
    const session = this.getSession();
    try {
      await session.executeRead(tx => 
        tx.run('RETURN 1 as test')
      );
    } finally {
      await session.close();
    }
  }
}
