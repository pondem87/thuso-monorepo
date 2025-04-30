"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomString = generateRandomString;
exports.isDateLessThanDaysOld = isDateLessThanDaysOld;
exports.isDateLessThanHoursOld = isDateLessThanHoursOld;
exports.toCustomDateString = toCustomDateString;
exports.numberToMonth = numberToMonth;
exports.generateS3Key = generateS3Key;
exports.cropTextToLength = cropTextToLength;
exports.getDateOnly = getDateOnly;
exports.getFileCategory = getFileCategory;
exports.emailHtmlTemplate = emailHtmlTemplate;
const path_1 = require("path");
const constants_1 = require("./constants");
function generateRandomString(length, mode = "alpha-numeric-caps") {
    let characters;
    switch (mode) {
        case "alpha-numeric-caps":
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            break;
        case "alpha-numeric":
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            break;
        case "alpha":
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            break;
        case "alpha-caps":
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            break;
        case "numeric":
            characters = '0123456789';
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
function isDateLessThanDaysOld(date, days) {
    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setDate(currentDate.getDate() - days);
    return date >= pastDate;
}
function isDateLessThanHoursOld(date, hours) {
    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setHours(currentDate.getHours() - hours);
    return date >= pastDate;
}
function toCustomDateString(date) {
    const dateObj = new Date(date);
    const dayOfMonth = dateObj.getDate();
    const month = numberToMonth(dateObj.getMonth());
    const year = dateObj.getFullYear();
    return `${dayOfMonth} ${month} ${year}`;
}
function numberToMonth(number) {
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
function generateS3Key(type, subfolder, filename) {
    return `${type}/${subfolder}/${generateRandomString(15, "alpha")}${(0, path_1.extname)(filename)}`;
}
function cropTextToLength(text, length) {
    const _text = text.trim();
    if (length <= 0)
        return "";
    if (length <= 3)
        return _text.slice(0, length);
    return _text.length > length ? `${_text.slice(0, length - 3)}...` : _text;
}
function getDateOnly(date) {
    return date.toISOString().split("T")[0];
}
function getFileCategory(mimetype) {
    if (constants_1.WHATSAPP_IMAGES_MIMETYPES.includes(mimetype)) {
        return "image";
    }
    if (mimetype.startsWith("video/")) {
        return "video";
    }
    if (constants_1.WHATSAPP_DOCS_MIMETYPES.includes(mimetype)) {
        return "document";
    }
    return;
}
function emailHtmlTemplate(heading, content) {
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
            </html>`;
}
//# sourceMappingURL=utility-functions.js.map