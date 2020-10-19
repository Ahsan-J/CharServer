"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const shortid_1 = __importDefault(require("shortid"));
const chatStatus_1 = require("../helpers/chatStatus");
const dynamodb_1 = __importDefault(require("./dynamodb"));
class ChatMessage {
}
exports.default = ChatMessage;
ChatMessage.ChatTableInput = {
    AttributeDefinitions: [
        {
            AttributeName: 'id',
            AttributeType: 'S'
        },
        {
            AttributeName: 'receiverId',
            AttributeType: 'S'
        },
        {
            AttributeName: 'senderId',
            AttributeType: 'S'
        },
        {
            AttributeName: 'status',
            AttributeType: 'S'
        },
    ],
    KeySchema: [
        {
            AttributeName: 'receiverId',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'id',
            KeyType: 'RANGE'
        }
    ],
    BillingMode: "PAY_PER_REQUEST",
    TableName: 'ChatMessageHistory',
    LocalSecondaryIndexes: [
        {
            IndexName: 'ChatMessageBySenderId',
            KeySchema: [
                {
                    AttributeName: 'receiverId',
                    KeyType: "HASH"
                },
                {
                    AttributeName: 'senderId',
                    KeyType: "RANGE"
                },
            ],
            Projection: {
                ProjectionType: "ALL"
            },
        },
        {
            IndexName: 'ChatMessageByReceiverId',
            KeySchema: [
                {
                    AttributeName: 'receiverId',
                    KeyType: "HASH"
                },
                {
                    AttributeName: 'status',
                    KeyType: "RANGE"
                },
            ],
            Projection: {
                ProjectionType: "ALL"
            },
        },
    ]
};
ChatMessage.createRecord = (record) => {
    const params = {
        TableName: ChatMessage.ChatTableInput.TableName,
        Item: {
            id: { S: record.id || shortid_1.default.generate() },
            receiverId: { S: record.receiverId },
            senderId: { S: record.senderId },
            message: { S: record.message },
            time: { S: record.time || moment_1.default().toISOString() },
            status: { S: `${record.status || chatStatus_1.setUnread()}` }
        }
    };
    return dynamodb_1.default.putItem(params).promise();
};
ChatMessage.getRecordsBySenderId = (record) => {
    const params = {
        TableName: ChatMessage.ChatTableInput.TableName,
        IndexName: "ChatMessageBySenderId",
        KeyConditionExpression: '#senderId = :senderId AND #receiverId = :receiverId',
        ExpressionAttributeNames: {
            "#senderId": "senderId",
            "#receiverId": "receiverId",
        },
        ExpressionAttributeValues: {
            ":senderId": { S: record.senderId },
            ":receiverId": { S: record.receiverId }
        },
        ScanIndexForward: true,
    };
    return dynamodb_1.default.query(params).promise();
};
ChatMessage.getRecordsByReceiverId = (record) => {
    const params = {
        TableName: ChatMessage.ChatTableInput.TableName,
        IndexName: "ChatMessageByReceiverId",
        KeyConditionExpression: '#status >= :status AND #receiverId = :receiverId',
        ExpressionAttributeNames: {
            "#status": "status",
            "#receiverId": "receiverId",
        },
        ExpressionAttributeValues: {
            ":status": { S: `${record.status}` },
            ":receiverId": { S: record.receiverId }
        },
        ScanIndexForward: true,
    };
    return dynamodb_1.default.query(params).promise();
};
//# sourceMappingURL=ChatMessages.js.map