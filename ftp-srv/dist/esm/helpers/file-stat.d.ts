import type { Stats } from 'fs';
export declare function formatFileStatLs(stat: Stats & {
    name?: string;
}): string;
export declare function formatFileStatEp(stat: Stats & {
    name?: string;
}): string;
