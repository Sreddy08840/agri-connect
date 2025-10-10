import { useState } from 'react';
import { X, Mail, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

interface EmailSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailSupportModal({ isOpen, onClose }: EmailSupportModalProps) {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSending(true);

    try {
      // In production, this would send to your backend API
      // For now, we'll simulate the email sending
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Construct email body
      const emailBody = `
From: ${user?.name} (${user?.email || user?.phone})
User ID: ${user?.id}
Role: ${user?.role}
Category: ${category}

Subject: ${subject}

Message:
${message}
      `.trim();

      console.log('Email Support Request:', emailBody);

      toast.success('Support request sent successfully! We\'ll respond within 24 hours.');
      
      // Reset form
      setSubject('');
      setCategory('general');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending support email:', error);
      toast.error('Failed to send support request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'product', label: 'Product Related' },
    { value: 'order', label: 'Order Issue' },
    { value: 'account', label: 'Account Management' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Email Support</h2>
              <p className="text-purple-100 text-sm">Send us a detailed message</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* User Info Display */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>From:</strong> {user?.name} ({user?.email || user?.phone})
              </p>
              <p className="text-sm text-gray-600">
                <strong>Account Type:</strong> {user?.role}
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Please provide as much detail as possible to help us assist you better.
              </p>
            </div>

            {/* Response Time Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>📧 Response Time:</strong> We typically respond within 24 hours during business days.
                For urgent matters, please use the Live Chat feature.
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSending || !subject.trim() || !message.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
