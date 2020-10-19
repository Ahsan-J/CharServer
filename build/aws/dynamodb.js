"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.update({ region: 'us-east-2' });
const db = new aws_sdk_1.default.DynamoDB();
exports.default = db;
//# sourceMappingURL=dynamodb.js.map