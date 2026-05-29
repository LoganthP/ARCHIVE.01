import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical',
    priority: 'Normal',
    description: ''
  });

  useEffect(() => {
    import('../api/client').then(({ getSupportTickets }) => {
      getSupportTickets().then(setTickets).catch(console.error);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const { createSupportTicket } = await import('../api/client');
      const newTicket = await createSupportTicket(formData);
      setTickets([newTicket, ...tickets]);
      setShowForm(false);
      setFormData({ title: '', category: 'Technical', priority: 'Normal', description: '' });
      toast.success('Support ticket submitted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveTicket = async (id) => {
    try {
      const { resolveSupportTicket } = await import('../api/client');
      const updatedTicket = await resolveSupportTicket(id);
      setTickets(tickets.map(t => t.id === id ? updatedTicket : t));
      toast.success('Ticket marked as resolved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve ticket');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h2 className="font-headline-md text-4xl font-bold text-gray-900 dark:text-on-surface mb-4">Support Center</h2>
        <p className="text-gray-500 dark:text-on-surface-variant text-lg">
          Need help with Archive.01? Submit a support ticket or view your previous requests below.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="p-6 border border-gray-300 dark:border-outline-variant bg-[#F0EFEB] dark:bg-surface rounded-xl">
            <h3 className="font-headline-md text-xl font-bold text-gray-900 dark:text-on-surface mb-2">Create Ticket</h3>
            <p className="text-sm text-gray-600 dark:text-on-surface-variant mb-6">Describe your issue in detail so we can help you faster.</p>
            
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="w-full btn-secondary mb-4"
            >
              {showForm ? 'Cancel' : 'New Ticket'}
            </button>

            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-on-surface mb-1">Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2 text-sm bg-transparent border border-gray-300 dark:border-outline-variant rounded"
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-on-surface mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 text-sm bg-transparent border border-gray-300 dark:border-outline-variant rounded"
                  >
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="Technical">Technical Issue</option>
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="Billing">Billing</option>
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="Feature Request">Feature Request</option>
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-on-surface mb-1">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full p-2 text-sm bg-transparent border border-gray-300 dark:border-outline-variant rounded"
                  >
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="Low">Low</option>
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="Normal">Normal</option>
                    <option className="bg-white text-gray-900 dark:bg-surface dark:text-on-surface" value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-on-surface mb-1">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 text-sm bg-transparent border border-gray-300 dark:border-outline-variant rounded h-32 resize-none"
                    placeholder="Provide details about what went wrong..."
                  ></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full btn-outline border-gray-900 dark:border-on-surface text-gray-900 dark:text-on-surface">
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="md:w-2/3 flex flex-col gap-4">
          <h3 className="font-headline-md text-2xl font-bold text-gray-900 dark:text-on-surface mb-2">Your Tickets</h3>
          {tickets.length === 0 ? (
            <div 
              style={{
                backgroundColor: 'color-mix(in srgb, var(--surface) 50%, transparent)'
              }}
              className="p-8 text-center border border-gray-300 dark:border-outline-variant rounded-xl text-gray-500 dark:text-on-surface-variant"
            >
              You haven't submitted any support tickets yet.
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="p-5 border border-gray-300 dark:border-outline-variant bg-[#F0EFEB] dark:bg-surface rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-on-surface">{ticket.title}</h4>
                  <div className="flex items-center gap-3">
                    {ticket.status === 'Open' && (
                      <button 
                        onClick={() => handleResolveTicket(ticket.id)}
                        className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-transparent text-secondary hover:bg-secondary/10 border border-secondary transition-colors rounded"
                      >
                        Resolve Issue
                      </button>
                    )}
                    <div className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded ${ticket.status === 'Open' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                      {ticket.status}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-body-mono text-gray-500 dark:text-on-surface-variant mb-4">
                  <span>ID: #{ticket.id}</span>
                  <span>Cat: {ticket.category}</span>
                  <span>Pri: {ticket.priority}</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-on-surface-variant/80">
                  {ticket.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-16 p-8 border border-gray-300 dark:border-outline-variant bg-gradient-to-br from-[#F0EFEB] to-[#E5E4E0] dark:from-surface dark:to-surface-container-low rounded-xl flex items-center justify-between">
        <div>
          <h3 className="font-headline-md text-xl font-bold text-gray-900 dark:text-on-surface mb-2">Archive.01 Status</h3>
          <p className="text-gray-600 dark:text-on-surface-variant text-sm">All systems operational. Last updated 2 mins ago.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="font-bold text-xs uppercase tracking-wider">Systems Online</span>
        </div>
      </div>
    </div>
  );
}
