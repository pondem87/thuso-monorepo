# Thuso - Backend (deprecated)
(deprecated!) Rewriting in Java with a more matured engineering process for maintainability, reliability and improved documentation
This repository contains the NestJS microservices for Thuso services together with CICD components using Github actions and DOKS.

# Services
## Management service
- Modules: Accounts, Auth, Businesses, Products, Documents, CRM, Contacts, Promotions, Media

### Accounts
Manages accounts and users
Manages user permissions
Defines the permissions guard which is used throughout the management service for access control

#### Permissions Guard
NestJS guard applied to all controller methods where access control is required. Works together with the permissions decorator which attaches the permissions.

### Auth

### Businesses

#### WhatsApp Template services

### Products

### Documents

### CRM

### Media

## Thuso-whatsapp service
- Modules: WhatsApp, Message-processor, Whatsapp-messenger

## Thuso-ai service
- Modules: Chat-agent, Embeddings

## Subscription
- Modules: Accounts, Payments

# Messaging with RMQ
Since were are using a microservice architecture I have decided to communicate using messages for processes that dont require synchrous execution.
Even for processes within the same service or module where some process can be done asynchronously. For example sending an email after registration does not need to occur within the
request-response cycle of form submission.

## Events handlers
### Management Service
#### Accounts Module
- [] account created
- [] account updated
- [] account deleted
- [] user created
- [] user verified
- [] send email

#### Business Module
- [] template created
- [] template update webhook

### Thuso WhatsApp Service
#### Message Processor Module
- [] account created
- [] account updated
- [] business created
- [] business updated
- [] business profile created
- [] business profile updated


## Broadcast using RMQ

Nest doesnt support sending rmq messages to the exchange and use fanout therefore messages will be manually broadcast.

### Motivation
Since the project uses a microservice architecture and I have decoupled my data and avoided a net of foreign key dependancy, there needs to be a strategy for synchronisation of data.
When an account is created there many events that need to occur like sending onbording emails and creating accounts in other services like the WhatsApp service.
Broadcast messages would have been nice but I have to create helperfunctions that just send the message using multiple clients.

### Events to broadcast
#### Management Service
##### Accounts Module
- [] created account
- [] updated account
- [] deleted account
- [] created user
- [] verified user

#### Businesses Module
- [] created business
- [] updated business
- [] deleted business
- [] created business profile
- [] updated business profile
- [] deleted business profile

#### CRM Module
- [] created user
- [] updated user
