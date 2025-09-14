# Route- / Travel&Joy AI Trip Planner

Route- is an AI trip planner called "Travel&Joy" that generates visual itineraries with coordinates, images, maps, and timelines. Users can edit stops, create custom routes, get weather-adapted packing lists, track flights, and share as links/PDFs/ICS files. Built with React frontend, Node.js backend, PostgreSQL database, JWT authentication, and OpenAI integration.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Current Repository State

The repository is currently in minimal/initial state with only README.md and .gitignore files. No source code has been implemented yet, but these instructions prepare for the expected tech stack and development workflow.

## Working Effectively

### Environment Setup and Dependencies
- **Node.js**: Pre-installed v20.19.5 (no installation needed)
- **npm**: Pre-installed v10.8.2 (no installation needed)  
- **PostgreSQL**: Pre-installed v16.10 with client tools
- **Required tools**: curl, wget, git are pre-installed

### Database Setup
- Start PostgreSQL service: `sudo service postgresql start`
- Verify service: `pg_isready` (should show "accepting connections")
- Create database: `sudo -u postgres createdb route_db`
- Connect to database: `sudo -u postgres psql -d route_db`
- **Expected time**: Database operations complete in under 10 seconds

### Frontend Development (React + TypeScript)

#### Initial Setup
- Create React app: `npx create-react-app frontend --template typescript`
- **TIMING**: NEVER CANCEL - Takes ~60 seconds for package installation. Set timeout to 180+ seconds.
- Install additional dependencies: `cd frontend && npm install axios react-router-dom @types/react-router-dom`
- **Expected time**: Additional packages install in ~10 seconds

#### Development Workflow
- Start development server: `cd frontend && npm start`
- **Access**: Application runs on http://localhost:3000
- **TIMING**: Compilation completes in ~10 seconds, NEVER CANCEL
- Build production: `npm run build`  
- **TIMING**: Production build takes ~30 seconds, NEVER CANCEL. Set timeout to 120+ seconds.
- Run tests: `npm test -- --watchAll=false`
- **Expected time**: Tests complete in ~1 second

### Backend Development (Express + TypeScript)

#### Initial Setup
- Create backend directory: `mkdir backend && cd backend`
- Initialize: `npm init -y`
- Install dependencies: `npm install express cors helmet morgan bcryptjs jsonwebtoken pg dotenv`
- Install dev dependencies: `npm install --save-dev @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/pg typescript ts-node nodemon`
- **TIMING**: Backend package installation takes ~10-15 seconds

#### Development Workflow
- Start development server: `npm run dev` (with nodemon)
- **Access**: API typically runs on http://localhost:3001
- Build TypeScript: `npm run build`
- **Expected time**: TypeScript compilation completes in ~5 seconds

### Code Quality and Linting

#### Setup Linting
- **Frontend**: ESLint comes pre-configured with Create React App (no additional setup needed)
- **Prettier**: `npm install --save-dev prettier`
- **Backend**: `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
- **Expected time**: Prettier installs in ~2 seconds

#### Pre-commit Validation
- **ALWAYS run these commands before committing**:
  - Frontend linting: `cd frontend && npx eslint src/ --fix`
  - Backend linting: `cd backend && npx eslint src/ --fix`  
  - Format code: `npx prettier --write .`
- **Expected time**: Linting completes in ~5-10 seconds per project
- **Note**: Create React App includes ESLint configuration, avoid installing conflicting versions

### Testing Strategy

#### Unit Tests
- Frontend: `cd frontend && npm test -- --watchAll=false`
- Backend: `cd backend && npm test`
- **TIMING**: Test suites complete in ~5-15 seconds, NEVER CANCEL

#### Integration Tests  
- Start backend: `cd backend && npm start` (background)
- Start frontend: `cd frontend && npm start` (background)
- **Manual validation required**: Test complete user workflows after any changes

## Validation Scenarios

**CRITICAL**: After making any changes, ALWAYS run through these complete end-to-end scenarios:

### Basic Application Flow
1. **Database Connection**: Verify PostgreSQL connects and can create tables
   ```bash
   sudo service postgresql start
   pg_isready  # Should show "accepting connections"
   sudo -u postgres createdb route_db
   ```
2. **API Health Check**: GET http://localhost:3001/health should return `{"status":"healthy"}`
3. **Frontend Loading**: http://localhost:3000 should load without console errors
4. **API Integration**: Frontend should successfully call backend APIs

### Full Stack Validation
1. **Start PostgreSQL**: `sudo service postgresql start`
2. **Backend Setup**: Create and start Express server on port 3001
3. **Frontend Setup**: Create and start React app on port 3000  
4. **Cross-Origin Testing**: Verify frontend can call backend APIs (CORS configured)
5. **Manual Testing**: Both servers should respond correctly:
   - `curl http://localhost:3001/health` → JSON response
   - `curl http://localhost:3000` → HTML with React App
   
### Performance Validation
- **Frontend**: Should compile and serve in ~10 seconds
- **Backend**: Should start and respond in ~2-3 seconds  
- **Database**: Queries should complete in <100ms locally

### User Authentication Flow (when implemented)
1. User registration: Create account through frontend
2. User login: Authenticate with valid credentials  
3. Protected routes: Access authenticated pages
4. Token refresh: Verify JWT token handling

### Trip Planning Workflow (when implemented)
1. **Trip Creation**: Enter destination and preferences
2. **AI Generation**: Verify OpenAI integration generates itinerary
3. **Map Integration**: Check coordinates display on map
4. **Editing**: Modify stops and routes
5. **Export**: Generate PDF/ICS/link sharing

## Build and Deployment

### Full Application Build
- **Frontend**: `cd frontend && npm run build`
- **Backend**: `cd backend && npm run build`  
- **TIMING**: Complete build process takes ~45 seconds total, NEVER CANCEL. Set timeout to 180+ seconds.

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `OPENAI_API_KEY`: OpenAI integration key
- `AVIATIONSTACK_API_KEY`: Flight tracking integration
- Always use `.env.example` file as template

## Common File Locations

### Frontend Structure
```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components  
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API service calls
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript type definitions
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

### Backend Structure  
```
backend/
├── src/
│   ├── routes/        # Express route handlers
│   ├── controllers/   # Business logic
│   ├── models/        # Database models
│   ├── middleware/    # Express middleware
│   ├── services/      # External service integrations
│   └── utils/         # Utility functions
├── migrations/        # Database migrations
└── package.json       # Dependencies and scripts
```

### Key Configuration Files
- `frontend/tsconfig.json` - TypeScript configuration
- `backend/tsconfig.json` - Backend TypeScript config
- `.env` - Environment variables (never commit)
- `.env.example` - Environment template
- `package.json` - Project dependencies and scripts

## Troubleshooting

### Common Issues
- **PostgreSQL not starting**: Run `sudo service postgresql start`
- **Port 3000/3001 in use**: Kill existing processes or use different ports
- **npm install failures**: Clear cache with `npm cache clean --force`
- **TypeScript errors**: Ensure all @types packages are installed

### Performance Expectations (Validated)
- **Initial React setup**: `npx create-react-app` takes ~56 seconds
- **Package installation**: Additional npm packages take ~3-5 seconds
- **Production build**: `npm run build` takes ~20-30 seconds
- **Test execution**: `npm test` completes in ~1 second
- **Development startup**: React dev server starts in ~8-10 seconds
- **Backend setup**: Express + dependencies install in ~6 seconds total
- **Database operations**: PostgreSQL commands complete in <10 seconds
- **Full stack startup**: Both frontend and backend ready in ~15 seconds total

## CI/CD Integration

### GitHub Actions (when .github/workflows/ exists)
- **ALWAYS** run linting before CI: `npm run lint`  
- **ALWAYS** run tests before CI: `npm test`
- **Build verification**: `npm run build` must succeed
- **Expected CI time**: Full pipeline takes ~3-5 minutes

## Security Considerations

- **Never commit**: `.env` files, API keys, database credentials
- **Always use**: Environment variables for sensitive data
- **JWT handling**: Implement proper token expiration and refresh
- **Input validation**: Validate all user inputs on backend
- **SQL injection**: Use parameterized queries with pg library

Remember: This is an AI-powered application with external integrations (OpenAI, Aviationstack), so always test API connectivity and rate limiting when working with these services.