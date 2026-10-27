import path from 'path';
export function escapePath(filePath) {
    return filePath.replace(/\\/g, '/');
}
export function normalizePath(filePath) {
    return path.posix.normalize(filePath.replace(/\\/g, '/'));
}
