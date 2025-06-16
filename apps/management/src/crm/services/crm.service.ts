import { LoggingService } from '@lib/logging';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DeleteResult, EntityNotFoundError, Repository } from 'typeorm';
import { Logger } from 'winston';
import { Customer } from '../entities/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { EditCustomerDto } from '../dto/edit-customer.dto';
import { Preferences } from '../entities/prefs.entity';
import { CustomerQueryDto } from '../dto/customer-query.dtp';
import { CustomerRegistrationChatAgentEventPattern, CustomerRegistrationChatAgentEventPayload, getDateOnly, NewTopicLLMEventPayload, RegisterCustomerEventPayload, ResumeWhatsAppPromoEventPayload, ResumeWhatsAppUpdatesEventPayload, StopPromotionsEventPayload } from '@lib/thuso-common';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';
import { CustomerAction } from '../entities/action.entity';
import { CreateActionDto } from '../dto/create-action.dto';
import { CustomerActionType } from '../types';
import { EditActionDto } from '../dto/edit-action.dto';
import { IExternBusinessService } from '../../businesses/interfaces/iexternbusiness.service';

@Injectable()
export class CrmService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(Customer)
        private readonly customerRepo: Repository<Customer>,
        @InjectRepository(Preferences)
        private readonly prefsRepo: Repository<Preferences>,
        @InjectRepository(CustomerAction)
        private readonly actionsRepo: Repository<CustomerAction>,
        private readonly clientsService: ThusoClientProxiesService,
        @Inject("IExternBusinessService")
        private readonly businessService: IExternBusinessService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "crm",
            file: "crm.service"
        })

        this.logger.info("Initialising CRM service")
    }

    async createCustomer(accountId: string, dto: CreateCustomerDto): Promise<Customer> {
        try {
            const prefs = await this.prefsRepo.save(
                this.prefsRepo.create({
                    whatsAppPromo: true,
                    whatsAppUpdates: true,
                    emailPromo: true,
                    emailUpdates: true
                })
            )

            const customer = await this.customerRepo.save(
                this.customerRepo.create({
                    accountId,
                    ...dto,
                    whatsAppNumber: dto.whatsAppNumber.replace(/^(\+|00)/, ''),
                    prefs
                })
            )

            const businesses = await this.businessService.getAccountBusinesses(accountId)

            for (const business of businesses) {
                this.clientsService.emitLlmQueue(
                    CustomerRegistrationChatAgentEventPattern,
                    {
                        crmId: customer.id,
                        fullname: `${customer.forenames} ${customer.surname}`,
                        whatsAppNumber: customer.whatsAppNumber,
                        wabaId: business.wabaId,
                        phone_number_id: business.appNumbers.map(num => num.appNumberId)
                    } as CustomerRegistrationChatAgentEventPayload
                )
            }

            return customer
        } catch (error) {
            this.logger.error("Error while creating customer", { accountId, error })
            throw new HttpException("Error while creating customer", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async processRegisterCustomer(data: RegisterCustomerEventPayload) {
        try {
            this.logger.info("Registering ", { data })

            // check if number not already associated with our customer
            let customer = await this.customerRepo.findOneBy({ accountId: data.accountId, whatsAppNumber: data.whatsAppNumber })

            if (!customer) {
                const prefs = await this.prefsRepo.save(
                    this.prefsRepo.create({
                        whatsAppPromo: true,
                        whatsAppUpdates: true,
                        emailPromo: true,
                        emailUpdates: true
                    })
                )

                customer = await this.customerRepo.save(
                    this.customerRepo.create({
                        ...data,
                        prefs
                    })
                )
            }

            const businesses = await this.businessService.getAccountBusinesses(data.accountId)

            for (const business of businesses) {
                this.clientsService.emitLlmQueue(
                    CustomerRegistrationChatAgentEventPattern,
                    {
                        crmId: customer.id,
                        fullname: `${customer.forenames} ${customer.surname}`,
                        whatsAppNumber: customer.whatsAppNumber,
                        wabaId: business.wabaId
                    } as CustomerRegistrationChatAgentEventPayload
                )
            }

        } catch (error) {
            this.logger.error("Error while creating customer from rmq message", { error, data })
        }
    }

    async getCustomer(accountId: string, id: string): Promise<Customer> {
        try {
            return await this.customerRepo.findOneOrFail({ where: { accountId, id } })
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                throw new HttpException("Not found!", HttpStatus.NOT_FOUND)
            }
            this.logger.error("Error while getting customer", { accountId, error })
            throw new HttpException("Error while getting customer", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async listCustomers(accountId: string, searchParams?: CustomerQueryDto) {
        try {
            const where: { [key: string]: string } = {};
            where.accountId = accountId

            if (searchParams.age) {
                where.age = searchParams.age
            } else if (searchParams.ageFrom) {

            }

            return await this.customerRepo.findAndCount({ where, relations: { prefs: true }, skip: searchParams.skip, take: searchParams.take })
        } catch (error) {
            this.logger.error("Error while retrieving customer list", { accountId, error })
            throw new HttpException(`Error while retrieving customer list`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async editCustomer(accountId: string, id: string, dto: EditCustomerDto): Promise<Customer> {
        try {
            const customer = await this.customerRepo.findOne({ where: { id, accountId }, relations: { prefs: true } })
            if (!customer) {
                throw new Error("No such customer!")
            }

            for (const key of Object.keys(customer)) {
                if (dto[key]) {
                    customer[key] = dto[key]
                }
            }

            for (const key of Object.keys(customer.prefs)) {
                if (dto[key]) {
                    customer.prefs[key] = dto[key]
                }
            }

            return await this.customerRepo.save(customer)
        } catch (error) {
            this.logger.error("Error while editing customer", { accountId, error })
            throw new HttpException("Error while editing customer", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteCustomer(accountId: string, customerId: string): Promise<DeleteResult> {
        try {
            return await this.customerRepo.delete({ accountId, id: customerId })
        } catch (error) {
            this.logger.error("Error while deleting customer", { accountId, error })
            throw new HttpException("Error while deleting customer", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async stopPromotionsRequest(data: StopPromotionsEventPayload): Promise<void> {
        try {
            await this.customerRepo.update({ accountId: data.accountId, whatsAppNumber: data.whatsAppNumber }, { prefs: { whatsAppPromo: false }})
        } catch (error) {
            this.logger.error("Error while processing request to stop promotions")
        }
    }

    async resumeWhatsAppUpdates(data: ResumeWhatsAppUpdatesEventPayload) {
        try {
            await this.customerRepo.update({ accountId: data.accountId, whatsAppNumber: data.whatsAppNumber }, { prefs: { whatsAppUpdates: true }})
        } catch (error) {
            this.logger.error("Error while processing request to resume whatsapp updates")
        }
    }
    async resumeWhatsAppPromotions(data: ResumeWhatsAppPromoEventPayload) {
        try {
            await this.customerRepo.update({ accountId: data.accountId, whatsAppNumber: data.whatsAppNumber }, { prefs: { whatsAppPromo: true }})
        } catch (error) {
            this.logger.error("Error while processing request to resume whatsapp promotions")
        }
    }

    async createAction(accountId: string, customerId: string, dto: CreateActionDto): Promise<CustomerAction> {
        try {
            const customer = await this.customerRepo.findOneByOrFail({ accountId, id: customerId })
            return await this.actionsRepo.save(
                this.actionsRepo.create({
                    ...dto,
                    date: getDateOnly(new Date()),
                    actionType: CustomerActionType.USER,
                    customer
                })
            )
        } catch (error) {
            this.logger.error("Failed to create customer activity")
            throw new HttpException("Failed to create action", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async processNewChatTopic(data: NewTopicLLMEventPayload) {
        try {
            const customer = await this.customerRepo.findOneByOrFail({ id: data.crmId })
            return await this.actionsRepo.save(
                this.actionsRepo.create({
                    date: getDateOnly(new Date()),
                    actionType: CustomerActionType.SYSTEM,
                    description: `Initiated chat on "${data.topicLabel}"`,
                    customer
                })
            )
        } catch (error) {
            this.logger.error("Error while processing new topic rmq message", { error, data })
        }
    }

    async editAction(accountId: string, customerId: string, actionId: string, dto: EditActionDto): Promise<CustomerAction> {
        try {
            const activity = await this.actionsRepo.findOneByOrFail({ customer: { accountId, id: customerId }, id: actionId })
            for (const key of Object.keys(dto)) {
                activity[key] = dto[key]
            }
            return await this.actionsRepo.save(activity)
        } catch (error) {
            this.logger.error("Failed to create customer activity")
            throw new HttpException("Failed to create action", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async listActions(accountId: string, customerId: string, skip?: number, take?: number): Promise<[CustomerAction[], number]> {
        try {
            return await this.actionsRepo.findAndCount({ where: { customer: { accountId, id: customerId } }, skip, take, order: { createdAt: "DESC" } })
        } catch (error) {
            this.logger.error("Error while getting customer activity", { accountId, error })
            throw new HttpException("Error while deleting customer", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
