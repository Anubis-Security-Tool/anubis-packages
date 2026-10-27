"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextPortFactory = getNextPortFactory;
function getNextPortFactory(hostname, minPort, maxPort = 65535) {
    let lastPort = minPort - 1;
    return async () => {
        const isLocal = hostname === '127.0.0.1' || hostname === '::1' || hostname === 'localhost';
        for (let attempt = 0; attempt < maxPort - minPort; attempt++) {
            const port = lastPort + 1 > maxPort ? minPort : lastPort + 1;
            lastPort = port;
            try {
                const server = await Promise.resolve().then(() => __importStar(require('net'))).then(net => net.createServer());
                await new Promise((resolve, reject) => {
                    server.once('error', reject);
                    server.listen(port, isLocal ? hostname : undefined, () => {
                        server.close();
                        resolve();
                    });
                });
                return port;
            }
            catch {
                continue;
            }
        }
        throw new Error('No available ports in the specified range');
    };
}
