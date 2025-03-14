# 4Loki Dog Grooming Frontend

This is the frontend application for the 4Loki Dog Grooming business management system. It's built with Next.js, React, and Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Environment Variables

Create a `.env.local` file in the root of the frontend directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Adjust the URL as needed to match your API server.

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm run start
# or
yarn start
```

## Project Structure

- `src/app`: Next.js App Router pages and layouts
- `src/components`: Reusable React components
- `src/lib`: Utility functions and API services
- `src/hooks`: Custom React hooks
- `src/types`: TypeScript type definitions
- `src/styles`: Global styles and Tailwind CSS configuration
- `public`: Static assets

## Features

- Dashboard with quick access to all features
- Appointment management
- Customer management
- Dog profiles
- Invoicing
- Reporting

## Docker Integration

This frontend can be integrated with the existing Docker setup. See the main project README for details on running the full stack with Docker Compose. 