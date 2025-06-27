# SMM Guru

A Real Instagram SMM Panel SaaS

## Project Structure

- `apps/frontend/` – Next.js frontend
- `apps/backend/` – Node.js backend
- `packages/database/` – Shared database logic
- `packages/utils/` – Shared utilities
- `drizzle/` – Database migrations

## Getting Started

1. **Install dependencies**
   ```sh
   pnpm install
   ```
2. **Run the development server**
   ```sh
   pnpm dev
   ```

## Features
- Modern sidebar UI
- Mobile and desktop responsive
- Modular monorepo structure
- Real-time order processing
- Multi-provider SMM service integration
- Built-in wallet system
- Admin panel for service management
- API access for developers

## Documentation

### 📚 Comprehensive Documentation
- **[CODEBASE_ANALYSIS.md](./CODEBASE_ANALYSIS.md)** - Complete technical analysis of the codebase
- **[SYSTEM_DIAGRAMS.md](./SYSTEM_DIAGRAMS.md)** - Visual system architecture and flow diagrams

### 🎯 Key Features
- **SMM Panel**: Complete social media marketing service platform
- **Order Management**: Automated order processing and tracking
- **Provider Integration**: Multiple SMM service provider support
- **Financial System**: Built-in wallet with transaction management
- **Admin Dashboard**: Comprehensive admin panel for system management
- **API Access**: RESTful API for developers and integrations
- **Real-time Updates**: Live order status monitoring
- **Multi-currency Support**: Support for different currencies

### 🏗️ Architecture Highlights
- **Monorepo Structure**: Shared packages for type safety and code reuse
- **Modern Tech Stack**: Next.js 15, React 19, TypeScript, Hono, PostgreSQL
- **Background Processing**: BullMQ for reliable job processing
- **Authentication**: Better-Auth with multiple providers
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Caching**: Redis for performance optimization

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to:
1. Read the [CODEBASE_ANALYSIS.md](./CODEBASE_ANALYSIS.md) for understanding the system
2. Review the [SYSTEM_DIAGRAMS.md](./SYSTEM_DIAGRAMS.md) for visual architecture overview
3. Follow the existing code patterns and conventions
4. Update documentation when making architectural changes

## License
[MIT](LICENSE)
