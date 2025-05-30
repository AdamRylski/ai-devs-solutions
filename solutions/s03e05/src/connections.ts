import * as path from 'path';
import { config } from 'dotenv';
import axios from 'axios';
import { OpenAITextProcessingService } from '../../common/src/openai/OpenAITextProcessingService.js';
import { ChatCompletionMessageParam } from 'openai/resources.js';
import { CentralaApi } from '../../common/src/centrala/CentralaApi.js';
import { SqlApiConnector } from '../../common/src/database/SqlApiConnector.js';
import { Neo4jConnector } from '../../common/src/database/Neo4jConnector.js';


interface User {
    id: number;
    username: string;
    access_level: string;
    lastlog: string;
    is_active: number;
}

interface Connection {
    user1_id: number;
    user2_id: number;
}

const globalEnvPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', 'ai_devs/ai-devs-solutions/.env');
config({ path: globalEnvPath });
const DATABASE_API_URL = 'https://c3ntrala.ag3nts.org/apidb';

async function loadUsersToNeo4j(neo4jConnector: Neo4jConnector, users: User[]): Promise<void> {
    // Create constraint to ensure uniqueness of userId
    await neo4jConnector.executeWrite(
        'CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE'
    );

    // Create users in batches
    const createUserQuery = `
        UNWIND $users AS user
        MERGE (u:User {userId: user.id})
        SET u.username = user.username,
            u.accessLevel = user.access_level,
            u.lastLog = user.lastlog,
            u.isActive = user.is_active
    `;

    try {
        await neo4jConnector.executeWrite(createUserQuery, { users });
        
        // Verify data was loaded correctly
        const verifyQuery = `
            MATCH (u:User)
            WHERE u.username IS NULL
            RETURN count(u) as missingNames
        `;
        const result = await neo4jConnector.executeRead<{ missingNames: number }>(verifyQuery);
        const missingNames = result[0]?.missingNames || 0;
        
        if (missingNames > 0) {
            console.error(`Warning: ${missingNames} users are missing names`);
            
            // Log a sample user with missing name
            const sampleQuery = `
                MATCH (u:User)
                WHERE u.username IS NULL
                RETURN u LIMIT 1
            `;
            const sampleResult = await neo4jConnector.executeRead<{ u: Record<string, any> }>(sampleQuery);
            if (sampleResult.length > 0) {
                console.error('Sample user with missing username:', sampleResult[0].u);
            }
        }
    } catch (error) {
        console.error('Error loading users to Neo4j:', error);
        throw error;
    }
}

async function createConnections(neo4jConnector: Neo4jConnector, connections: Connection[]): Promise<void> {
    // First, let's verify we have the connections data
    console.log(`Creating ${connections.length} connections...`);
    console.log('Sample connection:', connections[0]);

    const createConnectionsQuery = `
        UNWIND $connections AS conn
        MATCH (u1:User {userId: toString(conn.user1_id)})
        MATCH (u2:User {userId: toString(conn.user2_id)})
        MERGE (u1)-[:KNOWS]->(u2)
    `;

    try {
        await neo4jConnector.executeWrite(createConnectionsQuery, { connections });
        
        // Verify connections were created
        const verifyQuery = `
            MATCH ()-[r:KNOWS]->()
            RETURN count(r) as connectionCount
        `;
        const result = await neo4jConnector.executeRead<{ connectionCount: number }>(verifyQuery);
        const connectionCount = result[0]?.connectionCount || 0;
        
        console.log(`Created ${connectionCount} connections in Neo4j`);

        if (connectionCount === 0) {
            // Debug: Check if we can find the users that should be connected
            const sampleConn = connections[0];
            const debugQuery = `
                MATCH (u:User)
                WHERE u.userId IN [toString($user1), toString($user2)]
                RETURN u.userId, u.username
            `;
            const debugResult = await neo4jConnector.executeRead(debugQuery, {
                user1: sampleConn.user1_id,
                user2: sampleConn.user2_id
            });
            console.log('Debug - Users that should be connected:', debugResult);
        }
    } catch (error) {
        console.error('Error creating connections:', error);
        throw error;
    }
}

async function findShortestPath(neo4jConnector: Neo4jConnector, fromName: string, toName: string): Promise<string> {
    const shortestPathQuery = `
        MATCH (start:User {username: $fromName}),
              (end:User {username: $toName}),
              path = shortestPath((start)-[:KNOWS*]-(end))
        RETURN [node IN nodes(path) | node.username] as names,
               length(path) as pathLength
    `;

    const result = await neo4jConnector.executeRead<{ names: string[]; pathLength: number }>(shortestPathQuery, { 
        fromName,
        toName
    });

    if (result.length === 0) {
        console.log(`No path found between ${fromName} and ${toName}`);
        return '';
    }

    const pathInfo = result[0];
    console.log('\nShortest path from', fromName, 'to', toName);
    console.log('Path length:', pathInfo.pathLength);
    console.log('Path:', pathInfo.names.join(' -> '));

    return pathInfo.names.join(',');
}

async function main() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    if (!process.env.AI_DEVS_API_KEY) {
        throw new Error('AI_DEVS_API_KEY is not set');
    }

    const centralaApi = new CentralaApi(process.env.AI_DEVS_API_KEY);
    // Get data from SQL database
    const sqlApiConnector = new SqlApiConnector(process.env.AI_DEVS_API_KEY, DATABASE_API_URL);
    const users: User[] = (await sqlApiConnector.executeDatabaseQuery<User>("SELECT * FROM users")).reply;
    const connections: Connection[] = (await sqlApiConnector.executeDatabaseQuery<Connection>("SELECT * FROM connections")).reply;

    // Debug: Log detailed data structure
    if (users.length > 0 && connections.length > 0) {
        const firstUser = users[0];
        const firstConnection = connections[0];
        
        console.log('\nUser data structure:');
        console.log('First user:', firstUser);
        console.log('Types of user properties:');
        console.log('id:', typeof firstUser.id);
        console.log('username:', typeof firstUser.username);
        console.log('access_level:', typeof firstUser.access_level);
        console.log('lastlog:', typeof firstUser.lastlog);
        console.log('is_active:', typeof firstUser.is_active);
        
        console.log('\nConnection data structure:');
        console.log('First connection:', firstConnection);
        console.log('Types of connection properties:');
        console.log('user1_id:', typeof firstConnection.user1_id);
        console.log('user2_id:', typeof firstConnection.user2_id);
        
        console.log('\nData counts:');
        console.log('Total users:', users.length);
        console.log('Total connections:', connections.length);
    }

    // Initialize Neo4j connection
    const neo4jConnector = new Neo4jConnector({
        uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
        username: process.env.NEO4J_USERNAME || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'yourpassword'
    });

    try {
        // Verify Neo4j connection
        await neo4jConnector.verifyConnection();
        console.log('\nConnected to Neo4j successfully');

        // Load users
        await loadUsersToNeo4j(neo4jConnector, users);
        console.log('Users loaded to Neo4j');

        // Create connections
        await createConnections(neo4jConnector, connections);

        // Find shortest path between Rafał and Barbara
        const path = await findShortestPath(neo4jConnector, "Rafał", "Barbara");
        console.log('Shortest path:', path);

        const resp = await centralaApi.sendAnswer("connections", path.toString());
        console.log('Centrala response:', resp);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await neo4jConnector.close();
    }
}

main();