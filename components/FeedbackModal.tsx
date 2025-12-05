import React, { useState } from 'react';
import { X, MessageSquarePlus, Bug, Lightbulb, Send } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<'bug' | 'feature'>('feature');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Define the destination email
    const recipient = "feedback@digitalgentry.ai";
    
    // Construct the subject line
    const subject = `Nano Feedback: ${type === 'bug' ? 'Bug Report' : 'Feature Request'}`;
    
    // Construct the email body
    const body = `Type: ${type.toUpperCase()}
User Email: ${email || 'Not provided'}

Message:
${message}

------------------------------------------------
Sent from Nano Banana AI Suite`;

    // Create mailto link
    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open user's email client
    window.location.href = mailtoLink;

    // Show local success state
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
        onClose();
      }, 2000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-amber-500" />
            Feedback
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Send className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-semibold text-white">Opening Email...</h4>
              <p className="text-slate-400">Please send the email from your client to complete the feedback.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    type === 'bug' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Bug className="w-4 h-4" />
                  Report Bug
                </button>
                <button
                  type="button"
                  onClick={() => setType('feature')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    type === 'feature' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  Suggest Feature
                </button>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  {type === 'bug' ? 'Describe the Issue' : 'Your Idea'}
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={type === 'bug' ? "What happened? Steps to reproduce..." : "I think it would be cool if..."}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[120px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!message || isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Opening Email Client...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;