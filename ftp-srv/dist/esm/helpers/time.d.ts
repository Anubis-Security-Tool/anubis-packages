export declare class Time {
    private readonly date;
    constructor(date?: Date);
    static now(): Time;
    static from(date: Date): Time;
    diff(other: Time, unit: 'month'): number;
    format(template: string): string;
}
