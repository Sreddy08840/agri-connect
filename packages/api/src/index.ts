import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { apiRateLimit } from './middleware/rateLimit-simple';

// Routes
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import chatRoutes from './routes/chat';
import userRoutes from './routes/users';
import uploadRoutes from './routes/upload';
import setupAdminRoutes from './routes/setup-admin';
import adminCleanupRoutes from './routes/admin/cleanup';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,  // Allow any local network IP for mobile
    ],
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:3000',  // Admin portal
    'http://192.168.30.223:5173', // Web app from network
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,  // Allow any local network IP
  ],
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimit);

// Static file serving for uploads (absolute path for reliability)
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/setup', setupAdminRoutes);
app.use('/api/admin/cleanup', adminCleanupRoutes);

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-order-room', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`Socket ${socket.id} joined order room: ${orderId}`);
  });

  socket.on('leave-order-room', (orderId: string) => {
    socket.leave(`order:${orderId}`);
    console.log(`Socket ${socket.id} left order room: ${orderId}`);
  });
                    
  // Farmer-specific room for product updates
  socket.on('join-farmer-room', (farmerId: string) => {
    socket.join(`farmer:${farmerId}`);
    console.log(`Socket ${socket.id} joined farmer room: ${farmerId}`);
  });
  socket.on('leave-farmer-room', (farmerId: string) => {
    socket.leave(`farmer:${farmerId}`);
    console.log(`Socket ${socket.id} left farmer room: ${farmerId}`);
  });

  // Admin room for moderation/metrics updates
  socket.on('join-admin-room', () => {
    socket.join('admin');
    console.log(`Socket ${socket.id} joined admin room`);
  });
  socket.on('leave-admin-room', () => {
    socket.leave('admin');
    console.log(`Socket ${socket.id} left admin room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
});

export { io };
