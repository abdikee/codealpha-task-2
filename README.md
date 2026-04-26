# Social Media Platform (Chilalo)

A full-stack social media application built with React, TypeScript, Express.js, and PostgreSQL.

## Features

- 🔐 **Authentication**: Email/password and OAuth (Google, Facebook, Twitter, GitHub)
- 📝 **Posts**: Create, edit, delete posts with image support
- 💬 **Comments**: Nested comments and replies
- ❤️ **Interactions**: Like, bookmark, and share posts
- 👥 **Social**: Follow users, view profiles
- 🔔 **Notifications**: Real-time notifications with Socket.io
- 💬 **Messaging**: Direct messages between users
- 🔍 **Search**: Search users, posts, and hashtags
- #️⃣ **Hashtags**: Discover trending topics
- 📱 **Responsive**: Mobile-friendly design

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** for data fetching
- **React Router** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Socket.io Client** for real-time features

### Backend
- **Express.js** for API server
- **PostgreSQL** for database
- **JWT** for authentication
- **Passport.js** for OAuth
- **Socket.io** for real-time communication
- **bcrypt** for password hashing
- **Multer** for file uploads

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd social-media-platform
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   - Database credentials
   - JWT and Cookie secrets (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - OAuth credentials (optional)

3. **Run quick deploy script**
   ```bash
   ./quick-deploy.sh
   ```
   
   Or manually:
   
   ```bash
   # Install frontend dependencies
   npm install
   
   # Build frontend
   npm run build
   
   # Install server dependencies
   cd server
   npm install
   
   # Run production setup
   npm run setup
   
   # Start server
   pm2 start ecosystem.config.js --env production
   ```

4. **Access the application**
   - Frontend: http://localhost:8080
   - API: http://localhost:3000
   - Health Check: http://localhost:3000/health

## Development

### Frontend Development

```bash
npm run dev
```

Runs on http://localhost:8080 with hot reload.

### Backend Development

```bash
cd server
npm run dev
```

Runs on http://localhost:3000 with auto-restart on file changes.

### Database Migrations

```bash
cd server

# Run migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down

# Check migration status
npm run migrate:status
```

### Testing

```bash
# Frontend tests
npm test

# Backend tests
cd server
npm test
```

## Production Deployment

### Quick Production Checklist

- [ ] Update `.env` with production values
- [ ] Generate secure JWT_SECRET and COOKIE_SECRET
- [ ] Set up production PostgreSQL database
- [ ] Run database migrations
- [ ] Configure SSL/HTTPS
- [ ] Set up domain and DNS
- [ ] Configure OAuth providers (optional)
- [ ] Set up monitoring and backups

## Project Structure

```
.
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── lib/               # Utility functions
│   ├── contexts/          # React contexts
│   └── integrations/      # External integrations
├── server/                # Backend source code
│   ├── routes/            # API routes
│   ├── migrations/        # Database migrations
│   ├── server.js          # Express server
│   ├── auth.js            # Authentication logic
│   ├── oauth.js           # OAuth configuration
│   └── db.js              # Database connection
├── public/                # Static files
│   └── images/            # Uploaded images
├── dist/                  # Production build (generated)
└── docs/                  # Documentation
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout user
- `GET /auth/google` - Google OAuth
- `GET /auth/facebook` - Facebook OAuth
- `GET /auth/twitter` - Twitter OAuth
- `GET /auth/github` - GitHub OAuth

### Health
- `GET /health` - Server health check

## Environment Variables

See `.env.example` for all available environment variables.

### Required Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_media
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret

# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:8080
```

### Optional Variables

```env
# OAuth (configure if using social login)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
TWITTER_CONSUMER_KEY=...
TWITTER_CONSUMER_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Scripts

### Frontend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run tests
```

### Backend Scripts

```bash
npm start            # Start production server
npm run dev          # Start development server
npm run setup        # Run production setup checks
npm run migrate:up   # Run database migrations
npm run migrate:down # Rollback migrations
npm test             # Run tests
```

## Security Features

- ✅ JWT authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on API endpoints
- ✅ CORS configuration
- ✅ Security headers with Helmet
- ✅ Input validation with express-validator
- ✅ SQL injection prevention with parameterized queries
- ✅ XSS protection

## Performance Features

- ✅ Database connection pooling
- ✅ Query optimization with indexes
- ✅ PM2 cluster mode for multi-core usage
- ✅ Gzip compression
- ✅ Static asset caching
- ✅ Code splitting (frontend)

## Monitoring

### PM2 Commands

```bash
pm2 status           # Check server status
pm2 logs             # View logs
pm2 monit            # Monitor resources
pm2 restart all      # Restart server
pm2 stop all         # Stop server
pm2 delete all       # Remove from PM2
```

### Logs

- Application logs: `server/logs/`
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/` (if using Nginx)

## Troubleshooting

### Server won't start

```bash
# Check PM2 logs
pm2 logs

# Check if port is in use
sudo lsof -i :3000

# Restart server
pm2 restart all
```

### Database connection failed

```bash
# Test database connection
cd server
node -e "import('./db.js').then(db => db.testConnection())"

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Build errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.

## Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ by the Chilalo Team**
