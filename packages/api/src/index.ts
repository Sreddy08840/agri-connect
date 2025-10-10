import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { apiRateLimit } from './middleware/rateLimit-simple';
import { PrismaClient } from '@prisma/client';

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
import eventsRoutes from './routes/events';
import recommendationsRoutes from './routes/recommendations';
import warrantyRoutes from './routes/warranty';
import reviewsRoutes from './routes/reviews';

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,  // Allow any local network IP for mobile
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

const PORT = process.env.PORT || 8080;

// Store active support chats in memory (in production, use Redis)
const activeSupportChats = new Map();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin access to static files
}));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175', // Web app
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

// Mobile app configuration endpoint
app.get('/config', (req, res) => {
  // Get the server's host from the request
  const host = req.get('host') || 'localhost:8080';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  res.json({
    apiUrl: `${baseUrl}/api`,
    baseUrl: baseUrl,
    websocketUrl: baseUrl,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
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
app.use('/api/events', eventsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/reviews', reviewsRoutes);

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

  // Customer-specific room for notifications
  socket.on('join-customer-room', (customerId: string) => {
    socket.join(`customer:${customerId}`);
    console.log(`Socket ${socket.id} joined customer room: ${customerId}`);
  });
  socket.on('leave-customer-room', (customerId: string) => {
    socket.leave(`customer:${customerId}`);
    console.log(`Socket ${socket.id} left customer room: ${customerId}`);
  });

  // Chat-specific rooms
  socket.on('join-chat-room', (chatId: string) => {
    socket.join(`chat:${chatId}`);
    console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
  });
  socket.on('leave-chat-room', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
    console.log(`Socket ${socket.id} left chat room: ${chatId}`);
  });

  // Typing indicators
  socket.on('typing-start', (data: { chatId: string; userId: string; userName: string }) => {
    socket.to(`chat:${data.chatId}`).emit('user-typing', { userId: data.userId, userName: data.userName });
  });
  socket.on('typing-stop', (data: { chatId: string; userId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('user-stopped-typing', { userId: data.userId });
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

  // ============ LIVE SUPPORT CHAT HANDLERS ============

  // User joins support chat
  socket.on('join-support-chat', async (data: { userId: string; userName: string; userRole: string }) => {
    const chatRoomId = `support-${data.userId}`;
    socket.join(chatRoomId);
    socket.join('support-users'); // Join general support users room
    
    // Store user info
    activeSupportChats.set(data.userId, {
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      socketId: socket.id,
      isActive: true,
      lastMessage: null,
      unreadCount: 0,
    });

    console.log(`User ${data.userName} (${data.userId}) joined support chat`);

    // Notify admins of new user
    io.to('admin-support').emit('support:user-joined', {
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      isActive: true,
      unreadCount: 0,
    });

    // Load chat history from database
    try {
      const messages = await prisma.supportMessage.findMany({
        where: { chatRoomId },
        orderBy: { createdAt: 'asc' },
        take: 100, // Last 100 messages
      });
      socket.emit('support:history', messages);
    } catch (error) {
      console.error('Error loading chat history:', error);
      socket.emit('support:history', []);
    }
  });

  // User leaves support chat
  socket.on('leave-support-chat', (data: { userId: string }) => {
    const chatRoomId = `support-${data.userId}`;
    socket.leave(chatRoomId);
    socket.leave('support-users');
    
    // Update user status
    if (activeSupportChats.has(data.userId)) {
      const chatInfo = activeSupportChats.get(data.userId);
      chatInfo.isActive = false;
      activeSupportChats.set(data.userId, chatInfo);
    }

    console.log(`User ${data.userId} left support chat`);

    // Notify admins
    io.to('admin-support').emit('support:user-left', { userId: data.userId });
  });

  // User sends message to support
  socket.on('support:send-message', async (messageData: any) => {
    console.log('Support message from user:', messageData);
    
    const chatRoomId = `support-${messageData.senderId}`;
    
    try {
      // Save message to database
      const savedMessage = await prisma.supportMessage.create({
        data: {
          chatRoomId,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          senderRole: messageData.senderRole,
          body: messageData.body,
          isAdmin: messageData.senderRole === 'ADMIN',
        },
      });

      // Broadcast saved message with ID
      const messageWithId = {
        ...messageData,
        id: savedMessage.id,
        createdAt: savedMessage.createdAt.toISOString(),
      };

      io.to(chatRoomId).emit('support:message', messageWithId);
      io.to('admin-support').emit('support:message', messageWithId);

      // Update last message in active chats
      if (activeSupportChats.has(messageData.senderId)) {
        const chatInfo = activeSupportChats.get(messageData.senderId);
        chatInfo.lastMessage = messageData.body;
        activeSupportChats.set(messageData.senderId, chatInfo);
      }
    } catch (error) {
      console.error('Error saving support message:', error);
      socket.emit('support:error', { message: 'Failed to send message' });
    }
  });

  // Admin joins support system
  socket.on('admin-join-support', () => {
    socket.join('admin-support');
    console.log(`Admin ${socket.id} joined support system`);

    // Send list of active chats to admin
    const activeChatsArray = Array.from(activeSupportChats.values());
    socket.emit('support:active-chats', activeChatsArray);
  });

  // Admin leaves support system
  socket.on('admin-leave-support', () => {
    socket.leave('admin-support');
    console.log(`Admin ${socket.id} left support system`);
  });

  // Admin sends message to user
  socket.on('admin-send-message', async (data: { userId: string; message: any }) => {
    console.log('Admin message to user:', data.userId);
    
    const chatRoomId = `support-${data.userId}`;
    
    try {
      // Save admin message to database
      const savedMessage = await prisma.supportMessage.create({
        data: {
          chatRoomId,
          senderId: data.message.senderId,
          senderName: data.message.senderName,
          senderRole: 'ADMIN',
          body: data.message.body,
          isAdmin: true,
        },
      });

      // Broadcast saved message with ID
      const messageWithId = {
        ...data.message,
        id: savedMessage.id,
        createdAt: savedMessage.createdAt.toISOString(),
      };

      // Send to user's room
      io.to(chatRoomId).emit('support:message', messageWithId);
      
      // Also send back to admin room for confirmation
      io.to('admin-support').emit('support:message', messageWithId);
    } catch (error) {
      console.error('Error saving admin message:', error);
    }
  });

  // Admin requests chat history
  socket.on('admin-request-history', async (data: { userId: string }) => {
    const chatRoomId = `support-${data.userId}`;
    try {
      const messages = await prisma.supportMessage.findMany({
        where: { chatRoomId },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });
      socket.emit('support:chat-history', {
        userId: data.userId,
        messages,
      });
    } catch (error) {
      console.error('Error loading chat history for admin:', error);
      socket.emit('support:chat-history', {
        userId: data.userId,
        messages: [],
      });
    }
  });

  // User typing indicator
  socket.on('user-typing', (data: { userId: string; userName: string }) => {
    io.to('admin-support').emit('user-typing', data);
  });

  // Admin typing indicator
  socket.on('admin-typing', (data: { userId: string }) => {
    const chatRoomId = `support-${data.userId}`;
    io.to(chatRoomId).emit('admin-typing');
  });

  // ============ END SUPPORT CHAT HANDLERS ============

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up support chat if user disconnects
    for (const [userId, chatInfo] of activeSupportChats.entries()) {
      if (chatInfo.socketId === socket.id) {
        chatInfo.isActive = false;
        activeSupportChats.set(userId, chatInfo);
        io.to('admin-support').emit('support:user-left', { userId });
        break;
      }
    }
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
