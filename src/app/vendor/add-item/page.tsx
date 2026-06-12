'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Barcode, CheckCircle2, Hash, Image as ImageIcon, IndianRupee, Mic, MicOff, PackagePlus, Weight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AddItemPage() {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    weight: '',
    barcode: '',
    stock: '',
    image_url: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [voiceSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });
  const [listening, setListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceMessage, setVoiceMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitForm = async (overrideData?: typeof formData) => {
    setStatus('loading');
    setMessage('');

    const dataToSubmit = overrideData ?? formData;
    try {
      const payload = {
        ...dataToSubmit,
        price: parseFloat(dataToSubmit.price),
        weight: dataToSubmit.weight ? parseFloat(dataToSubmit.weight) : 0,
        stock: dataToSubmit.stock ? parseInt(dataToSubmit.stock) : 0,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage('Product added successfully!');
        setFormData({
          name: '',
          price: '',
          weight: '',
          barcode: '',
          stock: '',
          image_url: ''
        });
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to add product');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'An error occurred while adding the product.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  const parseVoiceValue = (text: string) => text.trim().replace(/^"|"$/g, '');

  const extractField = (speech: string, regex: RegExp) => {
    const match = speech.match(regex);
    return match ? parseVoiceValue(match[1]) : '';
  };

  const applyVoiceCommand = async (speech: string) => {
    const lower = speech.toLowerCase();
    const parsed: Record<string, string> = {
      name: extractField(speech, /name(?: is|:)?\s*([^,;\.]+)/i),
      price: extractField(speech, /price(?: is|:)?\s*([\d,.]+)/i),
      barcode: extractField(speech, /barcode(?: is|:)?\s*([\d\-]+)/i),
      stock: extractField(speech, /stock(?: is|:)?\s*(\d+)/i),
      weight: extractField(speech, /weight(?: is|:)?\s*([\d,.]+)/i),
      image_url: extractField(speech, /image(?: url)?(?: is|:)?\s*(https?:\/\/\S+)/i),
    };

    const nextForm = {
      ...formData,
      ...Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== ''))
    };
    setFormData(nextForm);

    if (lower.includes('submit') || lower.includes('add product') || lower.includes('save product')) {
      await submitForm(nextForm);
    }
  };

  const startVoiceListener = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) as (new () => SpeechRecognition) | null;
    if (!SpeechRecognition) {
      setVoiceMessage('Voice recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setVoiceMessage('Listening for product details...');
      setVoiceTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const speech = event.results[0][0].transcript;
      setVoiceTranscript(speech);
      applyVoiceCommand(speech);
      setVoiceMessage('Recognized text: ' + speech);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setVoiceMessage('Voice recognition error: ' + event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white font-sans overflow-hidden relative flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-8 transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: "easeOut" }}
           className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
            <div className="bg-purple-500/30 p-4 rounded-2xl">
              <PackagePlus className="w-8 h-8 text-purple-200" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Seller Portal</h1>
              <p className="text-purple-200/80 mt-1">Add new items to the ScanniMart inventory.</p>
            </div>
          </div>

          {status === 'success' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3 text-green-200">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <p>{message}</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p>{message}</p>
            </motion.div>
          )}

          <div className="mb-6 p-4 bg-white/5 rounded-3xl border border-white/10">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Voice Product Entry</p>
                <p className="text-sm text-purple-200/70">Speak product details like “name Organic Almonds, price 250, barcode 8901234567890, stock 30.”</p>
              </div>
              <button
                type="button"
                onClick={startVoiceListener}
                disabled={!voiceSupported || listening}
                className="inline-flex items-center gap-2 rounded-2xl bg-purple-500/20 border border-purple-400/30 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {listening ? 'Listening…' : voiceSupported ? 'Use voice control' : 'Voice not supported'}
              </button>
            </div>
            {voiceMessage && <p className="mt-3 text-sm text-purple-200/80">{voiceMessage}</p>}
            {voiceTranscript && <p className="mt-1 text-sm text-purple-100">Transcript: “{voiceTranscript}”</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-sm font-medium text-purple-200 ml-1 block">Product Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <PackagePlus className="h-5 w-5 text-purple-300/50" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="e.g. Organic Almonds 500g"
                  />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200 ml-1 block">Price (₹) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee className="h-5 w-5 text-purple-300/50" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="250.00"
                  />
                </div>
              </div>

              {/* Barcode */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200 ml-1 block">Barcode *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Barcode className="h-5 w-5 text-purple-300/50" />
                  </div>
                  <input
                    type="text"
                    name="barcode"
                    required
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono"
                    placeholder="8901234567890"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200 ml-1 block">Initial Stock</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-purple-300/50" />
                  </div>
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="50"
                  />
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200 ml-1 block">Weight (grams)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Weight className="h-5 w-5 text-purple-300/50" />
                  </div>
                  <input
                    type="number"
                    name="weight"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-sm font-medium text-purple-200 ml-1 block">Image URL (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ImageIcon className="h-5 w-5 text-purple-300/50" />
                  </div>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="https://example.com/image.png"
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={status === 'loading'}
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <PackagePlus className="w-5 h-5" />
                  Add Product to Inventory
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center text-purple-200/50 text-sm mt-8">
          Secure Seller Portal Module • ScanniMart System
        </p>
      </div>
    </div>
  );
}
