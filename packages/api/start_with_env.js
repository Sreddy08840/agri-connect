#!/usr/bin/env node

/**
 * Start API server with environment variables
 */

// Load environment variables first
require('dotenv/config');

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ML_BASE_URL = process.env.ML_BASE_URL || 'http://localhost:8000';

console.log('🚀 Starting Agri-Connect API Server...');
console.log(`📍 Port: ${PORT}`);
console.log(`🌍 Environment: ${NODE_ENV}`);
console.log(`🤖 ML Service: ${ML_BASE_URL}`);
console.log(`🔗 API URL: http://localhost:${PORT}`);
console.log(`📚 Health Check: http://localhost:${PORT}/health`);
console.log('-'.repeat(50));

// Start the server
require('./src/index.ts');
