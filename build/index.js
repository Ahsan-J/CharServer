"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const environment_json_1 = __importDefault(require("./environment.json"));
const socket_1 = require("./socket/socket");
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const cors_1 = __importDefault(require("@koa/cors"));
const aws_1 = require("./aws");
let app = new koa_1.default();
const port = (process.env.PORT || environment_json_1.default.port) + "";
app.use(cors_1.default());
app.use(koa_bodyparser_1.default());
app.use(socket_1.registerSocketRoutes().routes());
app.use(socket_1.registerSocketRoutes().allowedMethods());
socket_1.connectWithSocket(app.callback()).listen(parseInt(port), async () => {
    await aws_1.initDynamoDB();
    console.log("Listening at port ", port);
});
//# sourceMappingURL=index.js.map