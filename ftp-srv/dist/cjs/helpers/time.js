"use strict";
// Simple time utility - replaces dayjs for FTP server date formatting
Object.defineProperty(exports, "__esModule", { value: true });
exports.Time = void 0;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function pad(n, width = 2) {
    return n.toString().padStart(width, '0');
}
class Time {
    date;
    constructor(date = new Date()) {
        this.date = date;
    }
    static now() {
        return new Time(new Date());
    }
    static from(date) {
        return new Time(date);
    }
    diff(other, unit) {
        return Math.abs((this.date.getFullYear() - other.date.getFullYear()) * 12 +
            (this.date.getMonth() - other.date.getMonth()));
    }
    format(template) {
        const d = this.date;
        return template
            .replace('MMM', MONTHS[d.getMonth()])
            .replace('DD', pad(d.getDate()))
            .replace('YYYY', d.getFullYear().toString())
            .replace('HH', pad(d.getHours()))
            .replace('mm', pad(d.getMinutes()));
    }
}
exports.Time = Time;
