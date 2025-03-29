import { CHAR_LIMITS, cropTextToLength, InteractiveList } from "@lib/thuso-common";

export function compileMenu(
        title: string,
        description: string,
        rows: {id: string, title: string, description: string}[],
        footer: string
    ): InteractiveList {
        return {
            type: "list",
            header: {
                type: "text",
                text: title
            },
            body: {
                text: description
            },
            footer: {
                text: cropTextToLength(footer, CHAR_LIMITS.MESSAGE_FOOTER_TEXT) 
            },
            action: {
                sections: [{
                    title: "",
                    rows: rows
                }],
                button: "View Options"
            }
        }
    }