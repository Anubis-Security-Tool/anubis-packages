import { AxiosInstance } from 'axios';
import { Config } from './types';
export declare class HTTPError extends Error {
    status: number;
    statusText: string;
    data: Object;
    config: Config;
    constructor(status: number, statusText: string, data: Object, config: Config);
}
export declare function electermSync(axiosInstance: AxiosInstance, type: string, func: string, args: any[], token: string): Promise<any>;
