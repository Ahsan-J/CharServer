"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDynamoDB = void 0;
const dynamodb_1 = __importDefault(require("./dynamodb"));
exports.initDynamoDB = async () => {
    try {
        console.log("Successfully created DynamoDB Tables");
    }
    catch (e) {
        console.log("DynamoDB Init error", e);
    }
    return dynamodb_1.default;
};
//# sourceMappingURL=index.js.map