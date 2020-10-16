import UserSocket from './UserSocket'
import db from './dynamodb';
import ChatMessage from './ChatMessages';

export const initDynamoDB = async () => {
    try {
        
        // await db.createTable(ChatMessage.ChatTableInput).promise() // Init ChatMessage Table
        // await db.createTable(UserSocket.UserTableInput).promise() // Init UserSocket Table
        console.log("Successfully created DynamoDB Tables")
    } catch (e) {
        console.log("DynamoDB Init error", e)
    }
    return db;
}