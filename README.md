# 4Loki API

A RESTful API for the 4Loki dog grooming business management system.

## Features

- CRUD operations for all main entities
- MariaDB database integration
- Docker support for easy deployment
- TypeScript for type safety
- Express.js for the web framework
- Winston for logging
- Error handling middleware
- Environment-based configuration

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
3. Update the environment variables in `.env` with your configuration

## Running with Docker

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. The API will be available at `http://localhost:3000`

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Customers
- `GET /api/v1/customers` - Get all customers
- `GET /api/v1/customers/:id` - Get customer by ID
- `POST /api/v1/customers` - Create new customer
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer

### Dogs
- `GET /api/v1/dogs` - Get all dogs
- `GET /api/v1/dogs/:id` - Get dog by ID
- `POST /api/v1/dogs` - Create new dog
- `PUT /api/v1/dogs/:id` - Update dog
- `DELETE /api/v1/dogs/:id` - Delete dog

### Appointments
- `GET /api/v1/appointments` - Get all appointments
- `GET /api/v1/appointments/:id` - Get appointment by ID
- `POST /api/v1/appointments` - Create new appointment
- `PUT /api/v1/appointments/:id` - Update appointment
- `DELETE /api/v1/appointments/:id` - Delete appointment

### Invoices
- `GET /api/v1/invoices` - Get all invoices
- `GET /api/v1/invoices/:id` - Get invoice by ID
- `POST /api/v1/invoices` - Create new invoice
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice

### Services
- `GET /api/v1/services` - Get all services
- `GET /api/v1/services/:id` - Get service by ID
- `POST /api/v1/services` - Create new service
- `PUT /api/v1/services/:id` - Update service
- `DELETE /api/v1/services/:id` - Delete service

### Dog Pictures
- `GET /api/v1/dog-pictures` - Get all dog pictures
- `GET /api/v1/dog-pictures/:id` - Get dog picture by ID
- `POST /api/v1/dog-pictures` - Create new dog picture
- `PUT /api/v1/dog-pictures/:id` - Update dog picture
- `DELETE /api/v1/dog-pictures/:id` - Delete dog picture

### Additional Hours
- `GET /api/v1/additional-hours` - Get all additional hours
- `GET /api/v1/additional-hours/:id` - Get additional hour by ID
- `POST /api/v1/additional-hours` - Create new additional hour
- `PUT /api/v1/additional-hours/:id` - Update additional hour
- `DELETE /api/v1/additional-hours/:id` - Delete additional hour

### DigiBTW
- `GET /api/v1/digi-btw` - Get all DigiBTW records
- `GET /api/v1/digi-btw/:id` - Get DigiBTW record by ID
- `POST /api/v1/digi-btw` - Create new DigiBTW record
- `PUT /api/v1/digi-btw/:id` - Update DigiBTW record
- `DELETE /api/v1/digi-btw/:id` - Delete DigiBTW record

### Export Logs
- `GET /api/v1/export-logs` - Get all export logs
- `GET /api/v1/export-logs/:id` - Get export log by ID
- `POST /api/v1/export-logs` - Create new export log
- `PUT /api/v1/export-logs/:id` - Update export log
- `DELETE /api/v1/export-logs/:id` - Delete export log

### Travel Times
- `GET /api/v1/travel-times` - Get all travel times
- `GET /api/v1/travel-times/:id` - Get travel time by ID
- `POST /api/v1/travel-times` - Create new travel time
- `PUT /api/v1/travel-times/:id` - Update travel time
- `DELETE /api/v1/travel-times/:id` - Delete travel time

## Error Handling

The API uses a consistent error response format:

```json
{
  "status": "error",
  "message": "Error message here"
}
```

## Logging

Logs are stored in:
- `error.log` - Error-level logs
- `combined.log` - All logs

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 