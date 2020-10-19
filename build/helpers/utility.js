"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const lodash_1 = __importDefault(require("lodash"));
exports.validate = (v) => !lodash_1.default.isUndefined(v) && !lodash_1.default.isEmpty(v) && !lodash_1.default.isNull(v);
//# sourceMappingURL=utility.js.map