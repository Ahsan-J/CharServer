"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketRoutes = exports.connectWithSocket = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const lodash_1 = __importDefault(require("lodash"));
const router_1 = __importDefault(require("@koa/router"));
const UserSocket_1 = __importDefault(require("../aws/UserSocket"));
const ChatMessages_1 = __importDefault(require("../aws/ChatMessages"));
const chatStatus_1 = require("../helpers/chatStatus");
const ChatConversation_1 = __importDefault(require("../aws/ChatConversation"));
const shortid_1 = __importDefault(require("shortid"));
const regex_1 = require("../helpers/regex");
const utility_1 = require("../helpers/utility");
const router = new router_1.default();
let client;
let io;
exports.connectWithSocket = (appCallback) => {
    const serverWithSocket = http_1.default.createServer(appCallback);
    io = socket_io_1.default(serverWithSocket, { transports: ["polling", "websocket"], pingTimeout: 5000 });
    client = io.of(regex_1.socketNamespace);
    client.on('connection', async (socket) => {
        const phId = lodash_1.default.split(socket.nsp.name, '-')[1];
        if (phId == socket.handshake.query.myNumber) {
            UserSocket_1.default.createRecord({ userId: phId, socketId: socket.id }).catch(err => console.log(err));
        }
        socket.on('disconnect', () => {
            UserSocket_1.default.deleteRecord({ userId: phId }).catch(err => console.log(err));
        });
        const messages = await ChatMessages_1.default.getRecordsByReceiverId({ receiverId: phId, status: chatStatus_1.setUnread() });
        if (messages.Items) {
            lodash_1.default.forEach(messages.Items, message => {
                if (chatStatus_1.isRead(parseInt(message.status.S || "0"))) {
                    return;
                }
                const data = {
                    senderId: message.senderId.S || "",
                    receiverId: message.receiverId.S || "",
                    id: message.id.S || "",
                    message: message.message.S || "",
                    time: message.time.S || "",
                    status: parseInt(message.status.S || "0"),
                };
                client.to(socket.id).emit('chat-message', data);
                ChatMessages_1.default.createRecord({
                    id: message.id.S,
                    receiverId: message.receiverId.S || "",
                    senderId: message.senderId.S || "",
                    message: message.message.S,
                    time: message.message.S,
                    status: chatStatus_1.unsetUnread(chatStatus_1.setRead(parseInt(message.status.S || "0")))
                });
            });
        }
    });
    return serverWithSocket;
};
exports.registerSocketRoutes = () => {
    router.get("/", async (ctx) => {
        ctx.status = 200;
        ctx.body = "Success";
    });
    router.post('/chat/send', async (ctx) => {
        var _a, _b, _c;
        const data = (_a = ctx.request) === null || _a === void 0 ? void 0 : _a.body;
        if (!utility_1.validate(data.message)) {
            ctx.status = 400;
            const response = {
                status: 400,
                data: "The property 'message' is missing from the body request",
                message: "Success",
                code: "E/P-C/001"
            };
            return ctx.body = response;
        }
        if (!utility_1.validate(data.receiverId)) {
            ctx.status = 400;
            const response = {
                status: 400,
                data: "The property 'receiverId' is missing from the body request",
                message: "Success",
                code: "E/P-C/001"
            };
            return ctx.body = response;
        }
        if (!utility_1.validate(data.senderId)) {
            ctx.status = 400;
            const response = {
                status: 400,
                data: "The property 'senderId' is missing from the body request",
                message: "Success",
                code: "E/P-C/001"
            };
            return ctx.body = response;
        }
        try {
            const socketId = ((_b = (await UserSocket_1.default.getRecord({ userId: data.receiverId })).Item) === null || _b === void 0 ? void 0 : _b.socketId.S) || "";
            const socketNamespace = lodash_1.default.first(lodash_1.default.split(socketId, '#')) || '';
            let status = chatStatus_1.setUnread();
            data.id = shortid_1.default.generate();
            if (socketId && socketNamespace && lodash_1.default.includes(Object.keys((_c = io.nsps[socketNamespace]) === null || _c === void 0 ? void 0 : _c.connected), socketId)) {
                client.to(socketId).emit('chat-message', data);
                status = chatStatus_1.setRead(status);
            }
            await ChatMessages_1.default.createRecord({
                id: data.id,
                receiverId: data.receiverId,
                senderId: data.senderId,
                message: data.message,
                status,
            });
            await ChatConversation_1.default.createRecord({
                receiverId: data.receiverId,
                senderId: data.senderId || "",
                message: data.message,
                messageId: data.id
            });
            ctx.status = 200;
        }
        catch (e) {
            console.log(e);
            ctx.status = 500;
        }
        const response = {
            status: 200,
            data: "Message Sent",
            message: "Success",
            code: "S/P-C.S/001"
        };
        ctx.body = response;
    });
    router.post('/chat/history', async (ctx) => {
        var _a;
        const { receiverId, senderId } = ((_a = ctx.request) === null || _a === void 0 ? void 0 : _a.body) || {};
        const { pageSize, pageIndex } = ctx.request.query || {};
        if (!utility_1.validate(receiverId)) {
            ctx.status = 400;
            const response = {
                status: 400,
                data: "The property 'receiverId' is missing from the body request",
                message: "Success",
                code: "E/P-C/001"
            };
            return ctx.body = response;
        }
        if (!utility_1.validate(senderId)) {
            ctx.status = 400;
            const response = {
                status: 400,
                data: "The property 'senderId' is missing from the body request",
                message: "Success",
                code: "E/P-C/002"
            };
            return ctx.body = response;
        }
        const records = await ChatMessages_1.default.getRecordsBySenderId({
            receiverId,
            senderId
        });
        const optimizedRecords = lodash_1.default.map(records.Items, (v) => {
            return {
                id: v.id.S || "",
                senderId: v.senderId.S || "",
                receiverId: v.receiverId.S || "",
                message: v.message.S || "",
                time: v.time.S || "",
                status: parseInt(v.status.S || "0"),
            };
        });
        let data = [];
        if (pageIndex && pageSize) {
            const chunks = lodash_1.default.chunk(optimizedRecords, pageSize);
            data = chunks[pageIndex];
        }
        else {
            data = optimizedRecords;
        }
        const response = {
            status: 200,
            data,
            message: "Success",
            code: "S/G-C.H/001"
        };
        ctx.status = 200;
        ctx.body = response;
    });
    router.post('/chat', async (ctx) => {
        var _a;
        const { id } = ((_a = ctx.request) === null || _a === void 0 ? void 0 : _a.body) || {};
        if (!utility_1.validate(id)) {
            ctx.status = 400;
            return ctx.body = "The property 'id' is missing from the body request";
        }
        const records = await ChatConversation_1.default.getRecordsById(id);
        const data = lodash_1.default.map(records.Items, (v) => {
            const [tempSenderId, tempReceiverId] = ChatConversation_1.default.getIdFromConverationKey(v.conversationKey.S || "");
            return {
                senderId: v.senderId.S || "",
                receiverId: tempSenderId == (v.senderId.S || "") ? tempReceiverId : tempSenderId,
                message: v.message.S || "",
                time: v.time.S || "",
                messageId: v.messageId.S || "",
            };
        });
        const response = {
            status: 200,
            data,
            message: "Success",
            code: "S/P-C/001"
        };
        ctx.status = 200;
        ctx.body = response;
    });
    return router;
};
//# sourceMappingURL=socket.js.map