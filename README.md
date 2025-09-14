# Route-
# Travel&Joy - AI Trip Planner

Travel&Joy is a comprehensive AI-powered trip planning application that helps users create, manage, and share detailed travel itineraries. Built with React, Node.js, and PostgreSQL, it features AI-generated itineraries, real-time weather data, flight tracking, and collaborative planning tools.

## 🌟 Features

### Core Functionality
- **AI-Powered Itinerary Generation**: Create detailed trip plans using OpenAI GPT-4
- **Interactive Trip Management**: Full CRUD operations for trips, days, and stops
- **Real-time Weather Integration**: Current weather and forecasts via OpenWeatherMap
- **Flight Status Tracking**: Real-time flight information via Aviationstack API
- **Smart Packing Lists**: Template-based packing recommendations
- **Public Trip Sharing**: Share itineraries with customizable privacy settings

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Material-UI components with professional design
- **Secure Authentication**: JWT-based authentication with persistent sessions
- **Real-time Updates**: Live data synchronization across all features
- **Export Capabilities**: Download trips as JSON or import into calendar apps (ICS)

### Technical Features
- **RESTful API**: Comprehensive backend with 9 major endpoints
- **Database Design**: PostgreSQL with optimized schema and relationships
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Error Handling**: Graceful degradation with fallback responses
- **Code Quality**: ESLint, Prettier, and comprehensive testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AvivBE-IS/Route-.git
   cd Route-
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your database and API credentials
   npm run db:migrate
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   npm start
   ```

4. **Run tests**
   ```bash
   # Backend tests
   cd server && npm test
   
   # Frontend tests  
   cd client && npm test
   
   # E2E tests
   cd tests && npm run test:e2e
   ```

### Docker Setup (Recommended)

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
Route-/
├── server/                 # Node.js/Express backend
│   ├── controllers/        # Request handlers
│   ├── routes/            # API route definitions
│   ├── models/            # Database models
│   ├── middleware/        # Custom middleware
│   ├── config/            # Configuration files
│   ├── scripts/           # Database migration scripts
│   └── __tests__/         # Backend tests
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── tests/                 # E2E tests (Playwright)
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD configuration
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/traveljoy_db
JWT_SECRET=your_super_secret_jwt_key
OPENAI_API_KEY=your_openai_api_key
WEATHER_API_KEY=your_openweathermap_api_key
AVIATIONSTACK_API_KEY=your_aviationstack_api_key
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Database Setup

1. Create PostgreSQL database
2. Run migrations: `npm run db:migrate`
3. Optional: Seed with sample data: `npm run db:seed`

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend Testing
```bash
cd client
npm test                   # Run all tests
npm run test:coverage      # Coverage report
```

### E2E Testing
```bash
cd tests
npm run test:e2e          # Run all E2E tests
npm run test:headed       # Run with browser UI
npm run test:debug        # Debug mode
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Trip Management
- `GET /api/trips` - List user trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/:id` - Get trip details
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip
- `POST /api/trips/:id/share` - Share trip publicly

### Itinerary Management
- `GET /api/days/trip/:tripId` - Get trip days
- `PUT /api/days/:id` - Update day
- `GET /api/stops/day/:dayId` - Get day stops
- `POST /api/stops` - Create stop
- `PUT /api/stops/:id` - Update stop
- `DELETE /api/stops/:id` - Delete stop

### AI & External APIs
- `POST /api/ai/generate-itinerary` - Generate AI itinerary
- `GET /api/weather/current/:location` - Current weather
- `GET /api/flights/status/:flightNumber` - Flight status
- `GET /api/packing/templates` - Packing templates

## 🔒 Security

- **Authentication**: JWT tokens with secure HTTP-only cookies
- **Authorization**: Route-level and resource-level access control
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Helmet.js for secure HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **SQL Injection**: Parameterized queries and ORM protection

## 🚢 Deployment

### Production Build
```bash
# Backend
cd server && npm run build

# Frontend  
cd client && npm run build
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-specific Configurations
- Development: Auto-reload, detailed logging, CORS enabled
- Production: Optimized builds, security headers, error logging
- Testing: Isolated database, mock external APIs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for AI-powered itinerary generation
- [OpenWeatherMap](https://openweathermap.org/) for weather data
- [Aviationstack](https://aviationstack.com/) for flight information
- [Material-UI](https://mui.com/) for React components
- [React Leaflet](https://react-leaflet.js.org/) for map integration

## 📞 Support

For support, email support@traveljoy.com or create an issue in this repository.

---

**Travel&Joy** - Making trip planning effortless with AI 🌍✈️
