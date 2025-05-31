import { extname } from "path";
import { WHATSAPP_DOCS_MIMETYPES, WHATSAPP_IMAGES_MIMETYPES } from "./constants";

/**
 * Generates a random string of a specified length using the specified mode.
 * Modes include:
 * - "alpha-numeric-caps": Uppercase letters and numbers
 * - "alpha-numeric": Uppercase and lowercase letters, and numbers
 * - "alpha": Uppercase and lowercase letters
 * - "alpha-caps": Uppercase letters only
 * - "numeric": Numbers only
 * @param length - The length of the random string to generate.
 * @param mode - The mode to use for generating the string.
 * @returns A random string of the specified length and mode.
 */
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
            break;
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

/**
 * Checks if a given date is less than a specified number of days old.
 * @param date - The Date object to check.
 * @param days - The number of days to compare against.
 * @returns - True if the date is less than the specified number of days old, false otherwise.
 */
export function isDateLessThanDaysOld(date: Date, days: number): boolean {
    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setDate(currentDate.getDate() - days);

    return date >= pastDate;
}

/**
 * Checks if a given date is less than a specified number of hours old.
 * @param date - The Date object to check.
 * @param hours - The number of hours to compare against.
 * @returns - True if the date is less than the specified number of hours old, false otherwise.
 */
export function isDateLessThanHoursOld(date: Date, hours: number): boolean {
    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setHours(currentDate.getHours() - hours);

    return date >= pastDate;
}


/**
 * Converts a Date object to a custom date string format: "DD Month YYYY".
 * @param date - The Date object to convert.
 * @return The formatted date string.
 */
export function toCustomDateString(date: Date): string {
    const dateObj = new Date(date)
    const dayOfMonth = dateObj.getDate()
    const month = numberToMonth(dateObj.getMonth())
    const year = dateObj.getFullYear()
    return `${dayOfMonth} ${month} ${year}`
}

/**
 * Converts a number (0-11) to the corresponding month name.
 * @param number - The month number (0 for January, 11 for December).
 * @return The name of the month as a string.
 */
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

/**
 * Generates a unique S3 key for storing files based on type, subfolder, and filename.
 * The key is structured as "type/subfolder/randomString.extension".
 * @param type - The type of file (e.g., "image", "document", "video").
 * @param subfolder - The subfolder where the file will be stored. - we use accountId or businessId
 * @param filename - The original filename to derive the extension.
 * @returns - A unique S3 key for the file.
 */
export function generateS3Key(type: "image" | "document" | "video", subfolder: string, filename: string): string {
    return `${type}/${subfolder}/${generateRandomString(15, "alpha")}${extname(filename)}`
}

/**
* This function crops a given text to a specified length, adding "..." if the text exceeds that length. While ensuring not to exceed the specified length.
* @param text - The text to be cropped.
* @param length - The maximum length of the text after cropping.
* @return The cropped text, or an empty string if the length is less than or equal to 0.
*/
export function cropTextToLength(text: string, length: number): string {
    const _text = text.trim();
    if (length <= 0) return "";
    if (length <= 3) return _text.slice(0, length); // Avoid returning just "..."
    return _text.length > length ? `${_text.slice(0, length - 3)}...` : _text
}

/**
 * Converts a Date object to a string in the format "YYYY-MM-DD".
 * @param date - The Date object to convert.
 * @returns - The formatted date string in "YYYY-MM-DD" format.
 */
export function getDateOnly(date: Date): string {
    return date.toISOString().split("T")[0];
}

/**
 * Returns the category of a file based on its MIME type
 * Categories include "image", "video", and "document".
 * @param mimetype - The MIME type of the file.
 * @returns - The category of the file based on its MIME type. 
 */
export function getFileCategory(mimetype: string): "image" | "video" | "document" {
    if (WHATSAPP_IMAGES_MIMETYPES.includes(mimetype)) {
      return "image";
    }
  
    if (mimetype.startsWith("video/")) {
      return "video";
    }
  
    if (WHATSAPP_DOCS_MIMETYPES.includes(mimetype)) {
      return "document";
    }

    return
}

/**
 * Generates an HTML email template with a heading and content.
 * @param heading - The heading of the email.
 * @param content - The main content of the email.
 * @returns - A string containing the HTML structure of the email.
 */
export function emailHtmlTemplate(heading: string, content: string) {
    return `<html>
                <head>
                    <style>
                        .container {
                            display: flex;
                            justify-content: center;
                            padding-top: 2em;
                            min-width: 768px;
                        }

                        .content {
                            width: 60%;
                            padding: 20px;
                            background-color: #f5f5f5;
                            /* Light gray background */
                            border-radius: 10px;
                            /* Rounded corners */
                            border: 1px solid #ccc;
                            /* Subtle border */
                            text-align: center;
                            /* Center text */
                            box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
                            /* Soft shadow */
                            font-family: Arial, sans-serif;
                        }

                        .heading {
                            padding: 1em;
                        }

                        .main {
                            text-align: left;
                            font-size: large;
                            font-weight: 500;
                            padding-left: 4em;
                            padding-right: 4em;
                        }
                        .footer {
                            margin-top: 4em;
                        }
                        @media (max-width: 1024px) { /* For tablets and smaller screens */
                            .content {
                                width: 90%; /* Fill 90% of the screen width on smaller devices */
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="content">
                            <img src="https://thuso.pfitztronic.co.bw/images/thuso-logo.png" alt="thuso logo" width="200" />
                            <h1 class="heading">${heading}</h1>
                            <div class="main">
                                ${content}
                            </div>
                            <div class="footer">
                                <p>Thuso is a product of Pfitztronic Proprietary Limited.</p>
                                <p>For more information visit our websites for <a href="https://thuso.pfitztronic.co.bw">Thuso</a> and
                                    <a href="https://www.pfitztronic.co.bw">Pfitztronic</a></p>
                                <p>You can contact us on tendai@pfitztronic.co.bw or takudzwa@pfitztronic.co.bw</p>
                            </div>
                        </div>

                    </div>
                </body>
            </html>`
}