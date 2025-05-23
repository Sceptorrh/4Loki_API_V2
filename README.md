# 4Loki API

[![API Tests](https://github.com/Sceptorrh/4Loki_API_V2/actions/workflows/test.yml/badge.svg)](https://github.com/Sceptorrh/4Loki_API_V2/actions/workflows/test.yml)

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
- OpenAPI (Swagger) documentation for all endpoints

## API Documentation

The API documentation is available in two formats:

1. **Interactive Swagger UI**: Visit `http://localhost:3000/api-docs` to explore the API documentation interactively.
2. **Downloadable OpenAPI Specification**: Access `http://localhost:3000/api-spec.json` to download the complete OpenAPI specification in JSON format. This is particularly useful for:
   - Frontend development (generate TypeScript types and API clients)
   - API testing tools (Postman, Insomnia)
   - Code generation in various languages
   - API documentation tools

To use the Swagger UI:
1. Start the server (using Docker or local development)
2. Navigate to `http://localhost:3000/api-docs` in your browser
3. Explore the available endpoints and their documentation
4. Test endpoints directly through the interactive interface

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
- `GET /api/v1/customers/table` - Get customer table data with search functionality
  - Query parameters:
    - `search` (optional): Search term to filter customers by contact person, name, email, phone, or dog name
  - Returns:
    - Contact person
    - Name
    - Email
    - Phone number
    - Contact sharing permission
    - Number of dogs
    - List of dog names
    - Days since last appointment
  - Example: `/api/v1/customers/table?search=john`

### Dogs
- `GET /api/v1/dogs` - Get all dogs
- `GET /api/v1/dogs/:id` - Get dog by ID
- `POST /api/v1/dogs` - Create new dog
- `PUT /api/v1/dogs/:id` - Update dog
- `DELETE /api/v1/dogs/:id` - Delete dog
- `GET /api/v1/dogs/table` - Get dog table data with detailed information
  - Query parameters:
    - `search` (optional): Search term to filter dogs by name, customer name, or breed
  - Returns:
    - Dog ID
    - Dog name
    - Customer contact person name
    - Dog size (readable label)
    - List of assigned dog breeds
  - Example: `/api/v1/dogs/table?search=max`

### Dog Breeds
- `GET /api/v1/dog-breeds` - Get all dog breeds
- `GET /api/v1/dog-breeds/:id` - Get dog breed by ID
- `POST /api/v1/dog-breeds` - Create new dog breed
- `PUT /api/v1/dog-breeds/:id` - Update dog breed
- `DELETE /api/v1/dog-breeds/:id` - Delete dog breed

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

### Dropdowns
- `GET /api/v1/dropdowns/dogbreeds` - Get dog breeds for dropdown (id, name)
- `GET /api/v1/dropdowns/customers` - Get customers with their dogs for dropdown (id, contactperson, list of dogs)
- `GET /api/v1/dropdowns/paymenttypes` - Get payment types for dropdown (id, label)
- `GET /api/v1/dropdowns/btwpercentages` - Get BTW percentages for dropdown (id, label, amount)
- `GET /api/v1/dropdowns/invoicecategories` - Get invoice categories for dropdown (id, label, knab)
- `GET /api/v1/dropdowns/hourtypes` - Get hour types for dropdown (id, label, defaulttext, isExport)
- `GET /api/v1/dropdowns/custominvoices` - Get custom invoices for dropdown (id, referentie)
- `GET /api/v1/dropdowns/customcolors` - Get custom colors for dropdown (color, hex, legend)

### Static Tables
- `GET /api/v1/static/appointment-statuses` - Get all appointment statuses
  - Returns: List of appointment statuses with id, label, order, is_active, and color
- `GET /api/v1/static/appointment-types` - Get all appointment types
  - Returns: List of appointment types with id, label, order, and is_active
- `GET /api/v1/static/btw-percentages` - Get all BTW percentages
  - Returns: List of BTW percentages with id, label, and amount
- `GET /api/v1/static/custom-colors` - Get all custom colors
  - Returns: List of custom colors with color, order, hex, and legend
- `GET /api/v1/static/dog-sizes` - Get all dog sizes
  - Returns: List of dog sizes with id, label, order, and is_active
- `GET /api/v1/static/hour-types` - Get all hour types
  - Returns: List of hour types with id, label, default_text, and is_export
- `GET /api/v1/static/import-export-types` - Get all import/export types
  - Returns: List of import/export types with id and label
- `GET /api/v1/static/invoice-categories` - Get all invoice categories
  - Returns: List of invoice categories with id, label, and knab
- `GET /api/v1/static/payment-types` - Get all payment types
  - Returns: List of payment types with id and label
- `GET /api/v1/static/travel-time-types` - Get all travel time types
  - Returns: List of travel time types with id and label

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

## Testing

The project uses Jest for testing. Tests are configured to run sequentially in a specific order to optimize database usage.

### Running Tests

```bash
# Run tests sequentially (default)
npm test

# Run tests in parallel (faster but may cause database conflicts)
npm run test:parallel
```

### Test Execution Order

Tests are executed in the following order:

1. `staticRoutes.test.ts` - Tests for static data routes
2. `endpoints.test.ts` - Tests for dynamic API endpoints

This order is defined in `tests/customSequencer.js` and can be modified by updating the `testOrder` array in that file.

### Test Database

The test database is initialized only once before all tests run, using the global setup in `tests/globalSetup.ts`. This prevents the database from being initialized multiple times when running tests sequentially.

## Google Maps API Setup

This application uses the Google Maps Routes API for route calculation and travel time estimation. To use this feature, you need to:

1. Obtain a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs in your Google Cloud project:
   - Routes API (for calculating travel times and distances)
   - Geocoding API (for address lookups)
   - Maps JavaScript API (for the map display)
3. Create a `secrets.json` file in the project root with the following format:
   ```json
   {
     "ROUTES_API_KEY": "YOUR_API_KEY_HERE"
   }
   ```

For detailed instructions on setting up the Google Maps API, see the [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) guide.

### Common Issues

If you see the error "REQUEST_DENIED" or "This API project is not authorized to use this API", it means:
1. The API key is invalid, or
2. The required API (Routes API) is not enabled for your project, or
3. The billing account is not set up for your Google Cloud project

Refer to the setup guide for detailed troubleshooting steps.

### Note on API Migration

As of March 1, 2025, the Distance Matrix API and Directions API will be deprecated in favor of the Routes API. This application uses the newer Routes API to ensure future compatibility.

# 4Loki Monorepo

This is a monorepo structure for the 4Loki dog grooming business application, containing both the backend API and frontend Next.js application.

## Setup

1. **Move backend files**: Move the following files and directories to the `backend/` folder:
   - `src/`
   - `configuration/`
   - `scripts/`
   - `tests/`
   - `test-results/`
   - `tsconfig.json`
   - `tsconfig.test.json`
   - `jest.config.js`
   - `nodemon.json`
   - `Dockerfile`
   - `.env.example`
   - `.env.test`
   - `docker-compose.yml`
   - `docker-compose.test.yml`
   - `01-init.sql`

2. **Install dependencies**:
```bash
# Install all dependencies for both frontend and backend
npm install

# Install concurrently if not already installed
npm install concurrently --save-dev
```

## Development

```bash
# Run both frontend and backend in development mode
npm run dev

# Run only backend
npm run dev:backend

# Run only frontend
npm run dev:frontend
```

## Building

```bash
# Build both frontend and backend
npm run build

# Build only backend
npm run build:backend

# Build only frontend
npm run build:frontend
```

## File Structure

```
4Loki_API_V2/
├── package.json        # Root package.json with workspace configuration
├── backend/            # Backend API code
│   ├── package.json    # Backend-specific dependencies
│   ├── src/            # Source code
│   ├── configuration/  # Configuration files
│   ├── scripts/        # Scripts
│   ├── tests/          # Tests
│   └── ...             # Other backend files
├── frontend/           # Frontend Next.js application
│   ├── package.json    # Frontend-specific dependencies
│   └── ...             # Frontend files
```

## Benefits of Monorepo

- Shared node_modules to reduce duplicate dependencies
- Simplified dependency management
- Easier to manage cross-project dependencies
- Unified development workflow 