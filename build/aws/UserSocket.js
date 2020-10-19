"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dynamodb_1 = __importDefault(require("./dynamodb"));
const moment_1 = __importDefault(require("moment"));
class UserSocket {
}
exports.default = UserSocket;
UserSocket.UserTableInput = {
    AttributeDefinitions: [
        {
            AttributeName: 'userId',
            AttributeType: 'S'
        },
        {
            AttributeName: 'type',
            AttributeType: 'S'
        },
    ],
    KeySchema: [
        {
            AttributeName: 'userId',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'type',
            KeyType: 'RANGE'
        }
    ],
    BillingMode: "PAY_PER_REQUEST",
    TableName: 'UserSocketBindings',
};
UserSocket.createRecord = (record) => {
    const params = {
        TableName: UserSocket.UserTableInput.TableName,
        Item: {
            userId: { S: record.userId },
            type: { S: "user_socket" },
            socketId: { S: record.socketId },
            time: { S: moment_1.default().toISOString() }
        }
    };
    return dynamodb_1.default.putItem(params).promise();
};
UserSocket.deleteRecord = (record) => {
    const params = {
        TableName: UserSocket.UserTableInput.TableName,
        Key: {
            userId: { S: record.userId },
            type: { S: "user_socket" },
        }
    };
    return dynamodb_1.default.deleteItem(params).promise();
};
UserSocket.getRecord = (record) => {
    const params = {
        TableName: UserSocket.UserTableInput.TableName,
        Key: {
            userId: { S: record.userId },
            type: { S: "user_socket" },
        }
    };
    return dynamodb_1.default.getItem(params).promise();
};
//# sourceMappingURL=UserSocket.js.map