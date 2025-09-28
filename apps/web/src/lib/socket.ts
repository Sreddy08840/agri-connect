import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
      });
    }
    
    if (!this.socket.connected) {
      this.socket.connect();
    }
    
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  joinOrderRoom(orderId: string) {
    if (this.socket) {
      this.socket.emit('join-order-room', orderId);
    }
  }

  leaveOrderRoom(orderId: string) {
    if (this.socket) {
      this.socket.emit('leave-order-room', orderId);
    }
  }

  // Farmer room for product updates
  joinFarmerRoom(farmerId: string) {
    if (this.socket) {
      this.socket.emit('join-farmer-room', farmerId);
    }
  }

  leaveFarmerRoom(farmerId: string) {
    if (this.socket) {
      this.socket.emit('leave-farmer-room', farmerId);
    }
  }

  onOrderUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('order-update', callback);
    }
  }
  onProductStatus(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('product:status', callback);
    }
  }
  offProductStatus(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('product:status', callback);
    }
  }

  onNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  sendMessage(orderId: string, message: string) {
    if (this.socket) {
      this.socket.emit('send-message', { orderId, message });
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
