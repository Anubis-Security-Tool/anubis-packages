import { randomUUID } from 'crypto';
class LoggerImpl {
    name;
    bindings;
    constructor(name = 'app', bindings = {}) {
        this.name = name;
        this.bindings = bindings;
    }
    child(bindings) {
        return new LoggerImpl(this.name, { ...this.bindings, ...bindings });
    }
    log(level, obj, msg) {
        const entry = {
            name: this.name,
            pid: process.pid,
            time: Date.now(),
            level,
            ...this.bindings,
            ...obj,
            ...(msg ? { msg } : {}),
        };
        const output = JSON.stringify(entry);
        if (level === 'fatal' || level === 'error') {
            console.error(output);
        }
        else {
            console.log(output);
        }
    }
    trace(obj, msg) {
        this.log('trace', obj, msg);
    }
    debug(obj, msg) {
        this.log('debug', obj, msg);
    }
    info(obj, msg) {
        this.log('info', obj, msg);
    }
    warn(obj, msg) {
        this.log('warn', obj, msg);
    }
    error(obj, msg) {
        this.log('error', obj, msg);
    }
    fatal(obj, msg) {
        this.log('fatal', obj, msg);
    }
}
export function createLogger(options = {}) {
    return new LoggerImpl(options.name || randomUUID().split('-')[0]);
}
