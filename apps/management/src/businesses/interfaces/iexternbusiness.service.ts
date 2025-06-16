import { WhatsAppBusiness } from "../entities/whatsapp-business.entity";

export interface IExternBusinessService {
    /**
     * Get whatsapp business with business profile and whatsapp numbers
     * @param wabaId WABA ID
     */
    getBusinessByWabaId(wabaId: string): Promise<WhatsAppBusiness|null>

    getAccountBusinesses(accountId: string): Promise<WhatsAppBusiness[]|null>
}