import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Campaign } from "./campaign.entity";

@Entity()
export class CampaignMessage {
    @PrimaryColumn("varchar")
    wamid: string;

    @Column("varchar")
    status: string

    @ManyToOne(() => Campaign, (campaign) => campaign.campaignMessages, { onDelete: "CASCADE" })
    campaign: Campaign;
}