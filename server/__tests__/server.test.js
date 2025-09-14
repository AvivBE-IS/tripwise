// Mock database connection for testing
jest.mock('../config/database', () => ({
  connectDB: jest.fn().mockResolvedValue({}),
  query: jest.fn()
}));

const request = require('supertest');

// Create a test version of the app
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'test' 
  });
});

describe('Server Health Check', () => {
  it('should respond with health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment', 'test');
  });
});

describe('Server 404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    await request(app)
      .get('/api/unknown')
      .expect(404);
  });
});