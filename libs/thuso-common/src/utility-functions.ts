import { extname } from "path";

export function generateRandomString(length: number, mode: "alpha-numeric-caps" | "alpha-numeric" | "alpha" | "alpha-caps" | "numeric" = "alpha-numeric-caps"): string {
    let characters: string

    switch (mode) {
        case "alpha-numeric-caps":
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            break;
        case "alpha-numeric":
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            break;
        case "alpha":
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
            break;
        case "alpha-caps":
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            break;
        case "numeric":
            characters = '0123456789'
        default:
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            break;
    }

    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function isDateLessThanDaysOld(date: Date, days: number): boolean {
    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setDate(currentDate.getDate() - days);

    return date >= pastDate;
}

export function isDateLessThanHoursOld(date: Date, hours: number): boolean {
    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setHours(currentDate.getHours() - hours);

    return date >= pastDate;
}

export function toCustomDateString(date: Date): string {
    const dateObj = new Date(date)
    const dayOfMonth = dateObj.getDate()
    const month = numberToMonth(dateObj.getMonth())
    const year = dateObj.getFullYear()
    return `${dayOfMonth} ${month} ${year}`
}

export function numberToMonth(number: number) {
    switch (number) {
        case 0:
            return "January";
        case 1:
            return "February";
        case 2:
            return "March";
        case 3:
            return "April";
        case 4:
            return "May";
        case 5:
            return "June";
        case 6:
            return "July";
        case 7:
            return "August";
        case 8:
            return "September";
        case 9:
            return "October";
        case 10:
            return "November";
        case 11:
            return "December";
        default:
            return "Invalid month number";
    }
}

export function generateS3Key(type: "image" | "document", subfolder: string, filename: string): string {
    return `${type}/${subfolder}/${generateRandomString(15, "alpha")}${extname(filename)}`
}