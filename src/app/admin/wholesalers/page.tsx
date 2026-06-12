'use client';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';

interface Wholesaler {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export default function WholesalersPage() {
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWholesaler, setNewWholesaler] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWholesalers = async () => {
    try {
      const res = await fetch('/api/admin/wholesalers');
      const data = await res.json();
      if (data.success) {
        setWholesalers(data.data);
      }
    } catch (e) {
      toast.error('Failed to load wholesalers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWholesalers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/wholesalers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWholesaler)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Wholesaler added successfully');
        setNewWholesaler({ name: '', email: '', phone: '' });
        fetchWholesalers();
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Error adding wholesaler');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <Toaster position="top-right" />
      <div className="flex items-center gap-4 mb-8">
        <a href="/admin/dashboard" className="text-gray-500 hover:text-indigo-600 transition-colors">
          ← Back to Dashboard
        </a>
        <h1 className="text-4xl font-extrabold text-indigo-900 drop-shadow-sm flex items-center gap-3">
          <span>🏢</span> Wholesaler Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ADD WHOLESALER FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-xl h-fit border border-gray-100 place-self-start w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Add New Wholesaler</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company / Rep Name</label>
              <input
                type="text"
                placeholder="e.g. Apex Distributors"
                required
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50 focus:bg-white"
                value={newWholesaler.name}
                onChange={e => setNewWholesaler({...newWholesaler, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="contact@apex.com"
                required
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50 focus:bg-white"
                value={newWholesaler.email}
                onChange={e => setNewWholesaler({...newWholesaler, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 234 567 890"
                required
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all outline-none bg-gray-50 focus:bg-white"
                value={newWholesaler.phone}
                onChange={e => setNewWholesaler({...newWholesaler, phone: e.target.value})}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-4 text-white py-3 rounded-xl font-bold shadow-lg transform transition-transform active:scale-95 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isSubmitting ? 'Adding...' : 'Add Wholesaler'}
            </button>
          </form>
        </div>

        {/* WHOLESALER LIST */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl h-fit border border-gray-100">
           <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">Directory</h2>
              <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {wholesalers.length} Wholesalers
              </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <p className="text-gray-500 col-span-2 text-center p-8">Loading directory...</p>
            ) : wholesalers.length === 0 ? (
               <div className="col-span-2 text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <span className="text-4xl block mb-2">🤷‍♂️</span>
                  No wholesalers added yet.
                </div>
            ) : (
               wholesalers.map(w => (
                 <a href={`/admin/wholesalers/${w.id}`} key={w.id} className="group block bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl p-5 transition-all text-left">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-700 transition-colors">{w.name}</h3>
                       <span className="text-indigo-500 bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center">→</span >
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                      <span>📧</span> {w.email}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span>📞</span> {w.phone}
                    </p>
                 </a>
               ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
