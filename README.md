# SDN - Electric Vehicle Dealer Management System (Next.js Frontend)

A modern, full-featured frontend application built with Next.js 15, shadcn/ui, Tailwind CSS, Zustand, and Framer Motion.

## Features

- 🎨 Modern UI with shadcn/ui components
- 🌓 Light/Dark mode support
- 🔐 Role-based authentication (Dealer Staff, Manager, EVM Staff, Admin)
- 📱 Responsive design
- ⚡ Fast page transitions with Framer Motion
- 📊 Dashboard with charts and KPIs
- 🚗 Vehicle catalog and management
- 📋 Orders and Quotes management
- 👥 Customer management
- 📈 Reports and analytics

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Running SDN-BE backend server (default: http://localhost:5000)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
SDN-FE/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── vehicles/          # Vehicle pages
│   ├── orders/            # Order pages
│   ├── quotes/           # Quote pages
│   ├── customers/        # Customer pages
│   ├── login/            # Login page
│   ├── settings/         # Settings page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── layout/          # Layout components (Navbar, Sidebar)
│   └── ui/             # shadcn/ui components
├── services/           # API services
├── stores/             # Zustand stores
├── lib/               # Utilities
└── types/            # TypeScript types
```

## Role-Based Access

The application supports 4 user roles:

1. **Dealer Staff** - Sales personnel
   - View vehicles, create quotes/orders
   - Manage customers
   - View personal reports

2. **Dealer Manager** - Dealership management
   - Approve/reject orders
   - Manage staff
   - View dealer reports
   - Manage promotions

3. **EVM Staff** - Manufacturer staff
   - Manage vehicle catalog
   - Handle inventory
   - Process dealer requests
   - View analytics

4. **Admin** - System administrator
   - Manage users and dealers
   - System-wide reports
   - Full access

## API Integration

All API calls are handled through services in the `services/` directory. The API base URL is configured in `lib/api.ts` and can be overridden via `NEXT_PUBLIC_API_BASE_URL` environment variable.

## Design System

- **Primary Color**: Indigo-600
- **Accent Color**: Emerald-500
- **Border Radius**: rounded-2xl (1rem)
- **Shadows**: shadow-md
- **Fonts**: Inter (primary), Plus Jakarta Sans (fallback)

## Development

### Adding New Pages

1. Create a new page in `app/[route]/page.tsx`
2. Use the `MainLayout` component for authenticated pages
3. Add route to sidebar navigation in `components/layout/sidebar.tsx`

### Adding New Services

1. Create service file in `services/`
2. Define TypeScript interfaces for requests/responses
3. Export service functions using the `api` instance from `lib/api.ts`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

