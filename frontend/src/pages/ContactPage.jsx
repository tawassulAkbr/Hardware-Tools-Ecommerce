import { useState } from 'react';
import { CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { api } from '../api';

const initialForm = { type: 'SUGGESTION', name: '', email: '', subject: '', message: '' };

const ContactPage = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const result = await api('/feedback', { method: 'POST', body: JSON.stringify(form) });
      setStatus({ loading: false, error: '', success: result.message });
      setForm(initialForm);
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50 px-6 py-14 sm:px-12 lg:px-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <section className="pt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">We listen</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Help us make ToolKit better.</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-600">Share a suggestion or tell us about an issue. Every message goes to our team for review.</p>
          <div className="mt-10 flex items-start gap-4 border-t border-gray-200 pt-6">
            <MessageSquare className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
            <div><p className="font-semibold text-gray-900">Customer support</p><p className="mt-1 text-sm text-gray-500">We will use your contact details only to follow up on this message.</p></div>
          </div>
        </section>

        <form onSubmit={submit} className="border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex gap-2 border-b border-gray-200 pb-5">
            {['SUGGESTION', 'COMPLAINT'].map((type) => <label key={type} className={`flex-1 cursor-pointer border px-4 py-3 text-center text-sm font-semibold transition ${form.type === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}><input type="radio" name="type" value={type} checked={form.type === type} onChange={update} className="sr-only" />{type === 'SUGGESTION' ? 'Suggestion' : 'Complaint'}</label>)}
          </div>
          {status.success && <div className="mb-5 flex gap-2 border border-green-200 bg-green-50 p-3 text-sm text-green-700"><CheckCircle2 className="h-5 w-5 shrink-0" />{status.success}</div>}
          {status.error && <div className="mb-5 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{status.error}</div>}
          <div className="grid gap-5 sm:grid-cols-2">
            <label><span className="mb-2 block text-sm font-medium text-gray-700">Your name</span><input name="name" value={form.name} onChange={update} required maxLength="100" className="w-full border border-gray-300 px-3 py-3 outline-none focus:border-blue-600" placeholder="Your name" /></label>
            <label><span className="mb-2 block text-sm font-medium text-gray-700">Email address</span><input name="email" value={form.email} onChange={update} required type="email" maxLength="160" className="w-full border border-gray-300 px-3 py-3 outline-none focus:border-blue-600" placeholder="you@example.com" /></label>
          </div>
          <label className="mt-5 block"><span className="mb-2 block text-sm font-medium text-gray-700">Subject</span><input name="subject" value={form.subject} onChange={update} required maxLength="160" className="w-full border border-gray-300 px-3 py-3 outline-none focus:border-blue-600" placeholder="What is this about?" /></label>
          <label className="mt-5 block"><span className="mb-2 block text-sm font-medium text-gray-700">Message</span><textarea name="message" value={form.message} onChange={update} required maxLength="4000" rows="6" className="w-full resize-y border border-gray-300 px-3 py-3 outline-none focus:border-blue-600" placeholder="Tell us what happened or what you would like to see..." /></label>
          <button disabled={status.loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:bg-gray-400">{status.loading ? 'Sending...' : 'Send message'} <Send className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
