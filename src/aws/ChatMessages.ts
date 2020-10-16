import aws from 'aws-sdk';
import moment from 'moment';
import shortid from 'shortid';
import { setUnread } from '../helpers/chatStatus';
import { IChatMessageRecord } from '../helpers/types';
import db from './dynamodb'

export default class ChatMessage {
  static ChatTableInput: aws.DynamoDB.CreateTableInput = {
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
    BillingMode:"PAY_PER_REQUEST",
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

  static createRecord = (record: IChatMessageRecord) => {
    const params: aws.DynamoDB.PutItemInput =  {
      TableName: ChatMessage.ChatTableInput.TableName,
      Item: {
        id: {S: record.id || shortid.generate()},
        receiverId: { S: record.receiverId},
        senderId: {S: record.senderId},
        message: {S: record.message},
        time: {S: record.time || moment().toISOString()},
        status: {S: `${record.status || setUnread()}`}
      }
    }
    return db.putItem(params).promise();
  }

  static getRecordsBySenderId = (record: IChatMessageRecord) => {

    const params : aws.DynamoDB.QueryInput = {
      TableName: ChatMessage.ChatTableInput.TableName,
      IndexName: "ChatMessageBySenderId",
      KeyConditionExpression: '#senderId = :senderId AND #receiverId = :receiverId',
      ExpressionAttributeNames: {
        "#senderId": "senderId",
        "#receiverId": "receiverId",
      },
      ExpressionAttributeValues: {
        ":senderId": {S: record.senderId},
        ":receiverId": {S: record.receiverId}
      },
      ScanIndexForward: true,
    }

    return db.query(params).promise();
  }

  static getRecordsByReceiverId = (record: IChatMessageRecord) => {

    const params : aws.DynamoDB.QueryInput = {
      TableName: ChatMessage.ChatTableInput.TableName,
      IndexName: "ChatMessageByReceiverId",
      KeyConditionExpression: '#status >= :status AND #receiverId = :receiverId',
      ExpressionAttributeNames: {
        "#status": "status",
        "#receiverId": "receiverId",
      },
      ExpressionAttributeValues: {
        ":status": {S: `${record.status}`},
        ":receiverId": {S: record.receiverId}
      },
      ScanIndexForward: true,
    }

    return db.query(params).promise();
  }

}