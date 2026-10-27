"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalIps = getLocalIps;
exports.isLocalAddress = isLocalAddress;
const os_1 = require("os");
const LOCAL_IPS = new Set(['127.0.0.1', '::1', 'localhost']);
function getLocalIps() {
    const nets = (0, os_1.networkInterfaces)();
    const ips = new Set(LOCAL_IPS);
    for (const interfaces of Object.values(nets)) {
        if (!interfaces)
            continue;
        for (const iface of interfaces) {
            if (iface.address) {
                ips.add(iface.address);
            }
        }
    }
    return ips;
}
function isLocalAddress(address) {
    return LOCAL_IPS.has(address) || getLocalIps().has(address);
}
