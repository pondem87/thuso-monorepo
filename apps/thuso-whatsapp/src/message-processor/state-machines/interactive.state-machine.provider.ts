import { AnyActorRef, assign, createMachine, fromPromise, setup } from "xstate";
import { Logger } from "winston";
import { randomUUID } from "crypto";
import { Injectable } from "@nestjs/common";
import { LoggingService } from "@lib/logging";
import { HomeStateService } from "../machine-states/home-state.service";
import { Contact, Messages, Metadata } from "@lib/thuso-common";
import { ProductsStateService } from "../machine-states/products-state.service";

@Injectable()
export class InteractiveStateMachineProvider {
	private logger: Logger
	private interactiveStateMachine
	private executorStateMachine

	constructor(
		private readonly loggingService: LoggingService,
		private readonly homeStateService: HomeStateService,
		private readonly productsStateService: ProductsStateService
	) {
		this.logger = this.loggingService.getLogger({
			module: "message-processor",
			file: "interactive.state-machine.provider"
		})

		this.logger.info("Initialised InteractiveStateMachineProvider")

		// create child actor for state executor
		this.executorStateMachine = setup({
			types: {
				events: {} as { type: "" },
				context: {} as {
					parentRef: AnyActorRef
					parentContext: ISMContext
					executorSrc: ExecutorSrcType
					ismEvent?: ISMEventType
				},
				input: {} as {
					parentRef: AnyActorRef,
					parentContext: ISMContext,
					executorSrc: ExecutorSrcType
				},
				output: {} as ISMEventType,
				children: {} as {
					executeState: "executeState"
				}
			},
			actors: {
				executeState: fromPromise(async ({ input }: {
					input: {
						parentContext: ISMContext,
						executorSrc: ExecutorSrcType
					}
				}) => {
					return await input.executorSrc({ context: input.parentContext })
				})
			}
		}).createMachine({
			id: "executor",
			initial: "execution",
			context: ({ input }) => ({
				parentRef: input.parentRef,
				parentContext: input.parentContext,
				executorSrc: input.executorSrc
			}),
			states: {
				execution: {
					invoke: {
						id: "executeState",
						src: "executeState",
						input: ({ context }) => ({
							parentContext: context.parentContext,
							executorSrc: context.executorSrc
						}),
						onDone: {
							target: "done",
							actions: [
								assign({
									ismEvent: ({ event }) => event.output
								})
							]
						}
					}
				},
				done: {
					type: "final"
				}
			},
			output: ({ context }) => context.ismEvent
		})


		// create state machine
		this.interactiveStateMachine = createMachine(
			{
				/** @xstate-layout N4IgpgJg5mDOIC5QEsB2AXMAnAhgY3WQDcwA6ACwHsBbMAYlnRy3QFlKAjZAGzAAUcAT1oYA2gAYAuolAAHSrGSFKqGSAAeiALQBmAEwAWUgE5xOgGwGArDvHiA7AbMAaEIO0HLpAIzm-V83tAqwAOc3FzAF9I1zRMXAJiMipaBiYWdi5eAWEwMW9pJBB5RWVVIs0ELT0dIx1vY3tvHXq7YzCQ13cqgz09UhCW-Ws9P3EDA2jYjGx8QhIKGnpGZnQAMR4wdggwCUK5BSVkFTVKrQMQ-qDbPWNjcwDQqy7tYytSeyHxdr0QkPtvpMYiA4rNEgsUvQAK6ybiUHA7CAbXh7NQlI4nCraKx6d7tAw6T5-bxWKwXF49Qw+PzBewhUm4kJTEEzBLzMgAL2Q1EymxyInQdDwOFQeDA3H5eXQqKK6LKp20egipBxv0J9jJxn0xgp1U+AyGOisd3Mt0uzNBbKSpC5PM4fKEAtIKxYkowdBw1EoUIwAGUwNKpGjDvKsQgyUYrHZozV7oFdRZ+tHxN4IoEzN4Lay5tbbbzso6pc70ug3YLPd6-QHRAVg6VjuVQJUyeYBsbPIFjIYUzoE30PgSWnYdHdjBMs-Ecws8-aC7kMKQ8FQFFsA1QIHRaOh1wBhKiwPIyg71zFNxCfeykZN2WN+ey67ukQxfMyjiZ6Cdg9k27n5-iFhcl0oFdWDXSgNy3Xd90PWtZRDBsFQQRxjBVa9b3jNxtAaS9HBfEc7nfT8rWnX9Z3-ed0GdAMADkoWoDhsDoVA6IYrB-UDfZing08NHPHEnxCUwUwBaxU3vTCqm8JUn0HWxXwI3oiKnTlSKycinQPdBaPoxjmJ0tjq1g48MUbXikICEwQgmRNHEufRdRCcQZLwt9FOBS1lJ-O01LLKj0AAUWoHAeDoMAgp4dijy4k9TMqQZ+npLUNXQ8TuipDUaRNaNSSZdzs3BFTvIdCi-MC4LuFC8LuEiozopMxDjG8S9r3EFKKQeJ8AlNAI9FTBxPCUgqvL-XzZCwSgxVgWAyzoCAVDINAiEoABrBb8u-GcfIAyixomuBpu2hBFomnAyj2KK5QQsNdFuA1DV+OxHG8XUmu8D49E+bxU2sB4rPsQaNtU4qnV2yaDoo0KsHGrBSFhU6ADNKCwahSA8obNuBotQf2ssjtQJbhTOqQLu42LEBqZq0JHGlBl1Aw3oMLUWkEwJ7A1RqAeteHNgAVVheEN2FUVxWRMA+bhBESZixCtHMWxSBpQJbm8JwlU6CTdDlhXRisDLfFsMlOYWbneHFgW-Ooz16FQK3IqDODpeuxqUN6Owwh0FmaQTfVfDvFtjXMAijbIE2xf5hFFxUbnkct1IhbFbhY92e3jNDM9JIcfoSUamw-FqUZUu0A3qUy5oJgiXLpknIbQ7NiO8Cj5AY6toVG+b2gpfq66Oh8TUozJKzHofJqFcagEpJxVqAmD0ha-DiBSBt2gdzb2gN07tOzK0MSk0GCZA61cYdQ1+nSEZlo2a+gxbN1mfQ+2egwHUJRRYfjervT84LBVKT7kaQdPD3D7KQfQgQmpkhVr4Y0d9NgP2dGgKAvBRYACUcBQAfgwAMABBbg3BRawFQeg8CydOKXR4mcfQzVehWC+hqJoJJ1bdFJG9X2fgnBmHHv9PK1dvz32IfA1AiCwAoLQXA0OhCMEcHwMtAAKpQAAMsgRg79yFYWHKhD2EQxwRHEAECk+cZIfRyjYRmmZuFfi5rA-hihBFIM2BI-h3AlHrE2LAOgTjGDsCwMI1xKiyZVE+P0RmUZxB-AeufCkhg3qBBaEJXR5gpJcKrhY42VidgCKESIoh6SPEuN4G4g8vACCQFFn4mW9g7i9w9k1Xof0jT6PGD4T4HsEmmBzuOcxxEQ5pLIDYzJ9jRH8NDlgxIKg6BSLwLIhRziynd1xD4XEuI6Q0IuOYRhiAPbvF6C0Jw9NrAXFxDA3gcC+l2N4A49JwzRmoEwegQhpSU51U3mcQOTkCS4l8NYRwBJj7dGsG8motRei3EMKSI5Wx+H+iKXkiFOxbm+gQWcsAFySF1i7p-I0l5RimEcEsr6oQKRNRQlGGkFxAG9SNOCuBUKwAEFfsQ25OC8GuJRbMjFFwnyEkuNcGonhr76N6IYxwGpUy-C7DoKl-CmX4JRfCxFPjzmDJ2Gyre-yBhNTWYHC4QR1kIFMSqQS7QpLeD+LUW+zJUDEPgEUNG7I0XPKwr4EIvcc4WDlr0DC3QtDMIVjSXWpJLCCSBMkrpixaD2o-qq0JT45ZmBTKMKSBgEwcsNY0KM9IvrGBnhjOcAoI2qIQCrd4TRxi9UaGsiwVk6bGmckOS4fxGiOGzUDXNRYXSlm2vm-xDQdAfG+mWnVlak0a0JG9XCQ55JjmDSyHhuYW3qSLEBECYEIBdsQqmQSV5WmeG1GEXoD43hn1HG8Jwlx6ZjmbUVVtC5NLaVYmusMeyt0NB3WaSwegXp0ivI9UdIQi3T06Z5HNC6b0BjKjwB96cN1ZyaLYcIJbkovQaAOIYGp-kWHppeka21YbjTBmWSDZklRGAiC+uWb76a6tqJ1fwdwbC-F+FYcFddV0O3RVvL60ls4kjdfnT1Hhwi+rvN1bVLRmPzwtlbQjZxUy6z7R7Jwpo2Z-vMN7XtrC0MPD-hewDNdeYSYbqgaO1Ak7Se0FZSMfci31Fsg+f4KpFZWT-XSCVuneH6YlgvJeYAV5GabmvMzGcvCBECE5k13zh6XkDk1eNk9cRRDc5Y45xDAvb1TL2xyVkp2Kd0c8CSZImktAeDYe4fRrCSvSachVyKlVgFS7J94mXGYTBy6SQlp8Ym8cY4yD8iXUnJcq-KrJYiBnZLq2xh1GcHADFCc18u4Q9ESTVdsoFfQuzWCY317pA3elDdG3A3J+DUuCX6DiQkrV2ihL-cOtKt0mpFfobiseFXdu2Oqyi2emwRmbzIf42W8ty76EErrFr+iKmFaNGOP4ZgBpbc+zt0gNK6U9NS-UFCH01ljhaTQlwElRhOTsH4RysmS3TttUl2FZBpUstq6j+kAxHJKnaBYN4JIKT0zeqEO4jl+6tXsL16IQA */
				id: "interactive",
				types: {
					events: {} as ISMEventType,
					context: {} as ISMContext,
					output: {} as ISMEventType,
					input: {} as {
						contact: Contact,
						wabaId: string,
						metadata: Metadata
					}
				},
				context: ({ input }) => ({
					contact: input.contact,
					wabaId: input.wabaId,
					metadata: input.metadata,
					productsNav: { skip: 0, take: 8, current: 0, pages: 0 },
					nextEvent: { type: "nochange" }
				}),
				states: {
					home: {
						states: {
							ready: {
								tags: ["ready"],
								on: {
									execute: {
										target: "executing",
										actions: assign(({ event }) => ({ message: event.message }))
									}
								},
							},
							executing: {
								invoke: {
									id: randomUUID(),
									src: this.executorStateMachine,
									input: ({ context }) => ({
										parentContext: context,
										executorSrc: this.homeStateService.executeHomeState
									}),
									onDone: {
										actions: [
											assign({
												message: undefined,
												nextEvent: ({ event }) => event.output
											})
										],
										target: "executed"
									},
									onError: {
										target: "ready",
										actions: [
											({ event }) => this.logger.error(
												"Home State executor failed",
												{ error: event.error }
											),
											assign({
												message: undefined
											})
										]
									}
								}
							},
							executed: {
								tags: ["executed"]
							}
						},
						initial: "ready",
						on: {
							products: {
								target: "products"
							},
							nochange: {
								target: "home",
								reenter: true
							}
						}
					},
					products: {
						states: {
							productsMenu: {
								entry: [
									({context}) => this.productsStateService.promptProductsMenuState({context})
								],
								states: {
									ready: {
										tags: ["ready"],
										on: {
											execute: {
												target: "executing",
												actions: assign(({ event }) => ({ message: event.message}))
											}
										},
									},
									executing: {
										invoke: {
											id: randomUUID(),
											src: this.executorStateMachine,
											input: ({ context }) => ({
												parentContext: context,
												executorSrc: this.productsStateService.executeProductsMenuItem
											}),
											onDone: {
												actions: [
													assign({
														message: undefined,
														nextEvent: ({ event }) => event.output
													})
												],
												target: "executed"
											},
											onError: {
												target: "ready",
												actions: [
													({ event }) => this.logger.error(
														"PaymentMethodSelection State executor failed",
														{ error: event.error }
													),
													assign({
														message: undefined
													})
												]
											}
										}
									},
									executed: {
										tags: ["executed"]
									}
								},
								initial: "ready",
								on: {
									viewProduct: {
										target: "productView",
										actions: assign(({event}) => ({
											productId: event.productId
										}))
									},
									navigateProducts: {
										target: "productsMenu",
										actions: assign(({event}) => ({productsNav: event.nav}))
									},
									nochange: {
										target: "productsMenu",
										reenter: true
									}
								}
							},
							productView: {

							}
						},
						initial: "productsMenu",
						on: {
							exitProducts: {
								target: "home"
							},
							nochange: {
								target: "paymentMethodSelection",
								reenter: true
							}
						}
					}
				},
				initial: "home"
			})
	}

	getInteractiveStateMachine() {
		return this.interactiveStateMachine
	}

}

export type ISMEventType =
	{ type: "products" } |
	{ type: "navigateProducts"; nav: { skip: number; take: number; current: number; pages: number } } |
	{ type: "viewProduct"; productId: string } |
	{ type: "productsBackToMenu" } |
	{ type: "exitProducts" } |
	{ type: "execute", message: Messages } |
	{ type: "nochange" }

export type ExecutorSrcType = ({ context }: { context: ISMContext }) => Promise<ISMEventType>

export type ISMContext = {
	contact: Contact,
	message?: Messages,
	metadata: Metadata,
	wabaId: string
	nextEvent?: ISMEventType
	productId?: string,
	productsNav: { skip: number; take: number; current: number; pages: number }
}


