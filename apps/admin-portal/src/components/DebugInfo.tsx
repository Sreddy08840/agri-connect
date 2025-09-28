import { useAuthStore } from '../stores/authStore';

export default function DebugInfo() {
  const { user } = useAuthStore();
  const adminToken = localStorage.getItem('adminAccessToken');
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-sm">
      <h4 className="font-bold mb-2">Debug Info:</h4>
      <div>User: {user ? user.name : 'Not logged in'}</div>
      <div>Role: {user ? user.role : 'N/A'}</div>
      <div>Token: {adminToken ? 'Present' : 'Missing'}</div>
      <div>Token Preview: {adminToken ? adminToken.substring(0, 20) + '...' : 'N/A'}</div>
    </div>
  );
}
