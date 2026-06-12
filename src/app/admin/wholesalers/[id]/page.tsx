'use client';
import { useState, useEffect, use } from 'react';
import { Toaster, toast } from 'react-hot-toast';

export default function WholesalerDetails({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/admin/wholesalers/${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      toast.error('Failed to load detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/wholesalers/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_body: message })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success('Message sent & logged successfully!');
        setMessage('');
        fetchDetails(); // Reload chat
        
        // Optional: Open local mail client
        window.location.href = `mailto:${data.email}?subject=Restock%20Inquiry%20-%20Store%20Admin&body=${encodeURIComponent(message)}`;
      } else {
        toast.error('Failed to send message');
      }
    } catch (e) {
      toast.error('Error sending message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex justify-center items-center font-sans">Loading...</div>;
  }

  if (!data) {
     return <div className="min-h-screen bg-gray-50 p-8 font-sans">Wholesaler not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <Toaster position="top-right" />
      <div className="flex items-center gap-4 mb-8">
        <a href="/admin/wholesalers" className="text-gray-500 hover:text-indigo-600 transition-colors">
          ← Back to Wholesalers
        </a>
      </div>

      {/* HEADER */}
      <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
         <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-3xl font-black">
                {data.name.substring(0, 1).toUpperCase()}
            </div>
            <div>
               <h1 className="text-3xl font-extrabold text-gray-900">{data.name}</h1>
               <div className="flex gap-4 mt-2 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-1">✉️ {data.email}</span>
                  <span className="flex items-center gap-1">📞 {data.phone}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* STOCK TABLE */}
         <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 h-fit">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
               <span>📦</span> Available Stock
            </h2>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                     <tr>
                        <th className="p-4">Product Name</th>
                        <th className="p-4 text-right">Price</th>
                        <th className="p-4 text-right">Availability</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {data.stock && data.stock.length > 0 ? (
                        data.stock.map((item: any) => (
                          <tr key={item.id} className="hover:bg-indigo-50 transition-colors">
                            <td className="p-4 font-medium text-gray-900">{item.product_name}</td>
                            <td className="p-4 text-right font-mono text-green-600">₹{item.price}</td>
                            <td className="p-4 text-right">
                               <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                                  {item.stock} in stock
                               </span>
                            </td>
                          </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={3} className="p-8 text-center text-gray-400">No stock catalog uploaded yet.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* MESSAGING SYSTEM */}
         <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[600px]">
             <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2 border-b pb-4">
               <span>💬</span> Message Representative
            </h2>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto mb-6 p-4 bg-gray-50 rounded-xl space-y-4">
               {data.messages && data.messages.length > 0 ? (
                  [...data.messages].reverse().map((msg: any) => (
                     <div key={msg.id} className="bg-indigo-600 text-white p-4 rounded-t-xl rounded-bl-xl shadow-md w-11/12 ml-auto">
                        <p className="text-sm whitespace-pre-wrap">{msg.message_body}</p>
                        <p className="text-indigo-200 text-xs mt-2 text-right">
                           {new Date(msg.created_at).toLocaleString()}
                        </p>
                     </div>
                  ))
               ) : (
                  <p className="text-center text-gray-400 mt-10">No messages sent yet. Start the conversation!</p>
               )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="mt-auto">
               <textarea
                 required
                 placeholder={`Write a message to ${data.name}...`}
                 value={message}
                 onChange={e => setMessage(e.target.value)}
                 className="w-full p-4 border border-gray-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white resize-none h-24"
               ></textarea>
               <button
                  type="submit"
                  disabled={sending}
                  className={`w-full text-white py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${sending ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
               >
                 <span>✉️</span> {sending ? 'Sending...' : 'Send Message'}
               </button>
            </form>
         </div>

      </div>
    </div>
  );
}
