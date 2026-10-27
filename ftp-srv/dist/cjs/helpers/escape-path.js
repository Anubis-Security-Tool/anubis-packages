"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapePath = escapePath;
exports.normalizePath = normalizePath;
const path_1 = __importDefault(require("path"));
function escapePath(filePath) {
    return filePath.replace(/\\/g, '/');
}
function normalizePath(filePath) {
    return path_1.default.posix.normalize(filePath.replace(/\\/g, '/'));
}
