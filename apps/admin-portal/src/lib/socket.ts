import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:8080';

class AdminSocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, { autoConnect: false, withCredentials: true });
    }
    if (!this.socket.connected) {
      this.socket.connect();
    }
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
  }

  getSocket() {
    return this.socket;
  }

  joinAdminRoom() {
    this.socket?.emit('join-admin-room');
  }
  leaveAdminRoom() {
    this.socket?.emit('leave-admin-room');
  }

  onProductNew(cb: (data: any) => void) {
    this.socket?.on('product:new', cb);
  }
  offProductNew(cb: (data: any) => void) {
    this.socket?.off('product:new', cb);
  }

  onProductStatus(cb: (data: any) => void) {
    this.socket?.on('product:status', cb);
  }
  offProductStatus(cb: (data: any) => void) {
    this.socket?.off('product:status', cb);
  }

  // Optional helpers for stock alerts
  onLowStock(cb: (data: any) => void) {
    this.socket?.on('product:low-stock', cb);
  }
  offLowStock(cb: (data: any) => void) {
    this.socket?.off('product:low-stock', cb);
  }
  onOutOfStock(cb: (data: any) => void) {
    this.socket?.on('product:out-of-stock', cb);
  }
  offOutOfStock(cb: (data: any) => void) {
    this.socket?.off('product:out-of-stock', cb);
  }
}

const adminSocket = new AdminSocketService();
export default adminSocket;
