"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const dynamodb_1 = __importDefault(require("./dynamodb"));
class ChatConversations {
}
exports.default = ChatConversations;
ChatConversations.ChatTableInput = {
    AttributeDefinitions: [
        {
            AttributeName: 'conversationKey',
            AttributeType: 'S'
        },
        {
            AttributeName: 'type',
            AttributeType: 'S'
        },
    ],
    KeySchema: [
        {
            AttributeName: 'conversationKey',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'type',
            KeyType: 'RANGE'
        }
    ],
    BillingMode: "PAY_PER_REQUEST",
    TableName: 'ChatConversations'
};
ChatConversations.createRecord = (record) => {
    const params = {
        TableName: ChatConversations.ChatTableInput.TableName,
        Item: {
            conversationKey: { S: ChatConversations.getConversationKey(record.senderId, record.receiverId) },
            senderId: { S: record.senderId },
            messageId: { S: record.messageId },
            time: { S: record.time || moment_1.default().toISOString() },
            message: { S: record.message },
            type: { S: "conversation" }
        }
    };
    return dynamodb_1.default.putItem(params).promise();
};
ChatConversations.getRecordsById = (id) => {
    const params = {
        TableName: ChatConversations.ChatTableInput.TableName,
        ExpressionAttributeValues: {
            ':conversationKey': { S: id }
        },
        FilterExpression: 'contains (conversationKey, :conversationKey)',
    };
    return dynamodb_1.default.scan(params).promise();
};
ChatConversations.getConversationKey = (senderId, receiverId) => {
    return [senderId || "", receiverId || ""].sort((a, b) => {
        return a.localeCompare(b);
    }).join('$');
};
ChatConversations.getIdFromConverationKey = (id) => id.split('$');
//# sourceMappingURL=ChatConversation.js.map