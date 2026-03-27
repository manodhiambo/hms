import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Users, CalendarDays, Stethoscope, Pill, FlaskConical, CreditCard, BedDouble,
  Shield, BarChart3, ArrowRight, CheckCircle2, Phone, Mail, MapPin, Star,
  Building2, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { hospitalApi } from '../../api/services';

const APP_NAME = 'Hospital Information Manager';

const features = [
  { icon: Users, title: 'Patient Management', desc: 'Complete EMR with demographics, visit history, and clinical records' },
  { icon: CalendarDays, title: 'Appointments', desc: 'Schedule, track and manage patient appointments efficiently' },
  { icon: Stethoscope, title: 'Clinical Consultations', desc: 'SOAP notes, vitals, diagnosis, and treatment planning' },
  { icon: Pill, title: 'Pharmacy', desc: 'Drug inventory, prescriptions, dispensing, and stock management' },
  { icon: FlaskConical, title: 'Laboratory', desc: 'Test ordering, sample tracking, result entry, and verification' },
  { icon: CreditCard, title: 'Billing & Payments', desc: 'Invoicing, M-Pesa, cash, card, and insurance billing' },
  { icon: BedDouble, title: 'Ward Management', desc: 'Bed mapping, admissions, discharges, and nursing notes' },
  { icon: Shield, title: 'Insurance', desc: 'Company management, claims submission, and tracking' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Financial, clinical, and operational insights' },
];

const stats = [
  { value: '50,000+', label: 'Patients Served' },
  { value: '120+', label: 'Healthcare Staff' },
  { value: '99.9%', label: 'System Uptime' },
  { value: '24/7', label: 'Support Available' },
];

const testimonials = [
  { name: 'Dr. Sarah Kamau', role: 'Chief Medical Officer', quote: 'The Hospital Information Manager transformed how we manage patient care. The integrated clinical workflow saves us hours every day.' },
  { name: 'James Mwangi', role: 'Hospital Administrator', quote: 'The billing module alone paid for itself within months. Real-time revenue tracking is invaluable.' },
  { name: 'Nurse Grace Otieno', role: 'Head Nurse, ICU', quote: 'Managing bed assignments and nursing notes has never been easier. The ward module is exceptionally well designed.' },
];

const pricingFaqs = [
  { q: 'What is included in the free trial?', a: 'Full access to all modules for 5 days. No credit card required to register.' },
  { q: 'What happens after the trial?', a: 'Your account will be paused until payment is received. Your data is preserved. Contact us via Paybill 522533, Account 8071524 (Helvino Technologies Limited).' },
  { q: 'What does the first-year fee cover?', a: 'Full system access, unlimited users, software updates, and email/phone support for 12 months.' },
  { q: 'How do I renew?', a: 'Pay the annual renewal fee (Ksh 20,000) via M-Pesa Paybill 522533, Account 8071524, then contact us at info@helvino.org to activate.' },
];

interface RegForm {
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  county: string;
  address: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

const empty: RegForm = { name: '', email: '', phone: '', contactPerson: '', county: '', address: '', adminEmail: '', adminPassword: '', adminName: '' };

export default function LandingPage() {
  const [form, setForm] = useState<RegForm>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [regError, setRegError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRegError('');
    try {
      await hospitalApi.register(form);
      setSuccess(true);
      setForm(empty);
    } catch (err: any) {
      setRegError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary-600" fill="currentColor" />
            <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Pricing</a>
            <a href="#register" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Register</a>
            <a href="#contact" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Contact</a>
          </div>
          <Link to="/login" className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <CheckCircle2 className="w-4 h-4" />
              Trusted by healthcare facilities across Kenya
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Modern Healthcare<br />
              <span className="bg-gradient-to-r from-primary-600 to-teal-500 bg-clip-text text-transparent">
                Information Manager
              </span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
              Streamline your hospital operations with an integrated platform for patient care,
              billing, pharmacy, laboratory, and ward management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#register" className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25">
                Register Your Hospital <ArrowRight className="w-5 h-5" />
              </a>
              <Link to="/login" className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-3.5 rounded-xl text-base font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">
                Sign In
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-br from-primary-500 to-teal-500 rounded-2xl p-8 md:p-12 text-white overflow-hidden relative">
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 800 400" fill="none">
                  <circle cx="200" cy="200" r="150" stroke="white" strokeWidth="2" />
                  <circle cx="600" cy="150" r="100" stroke="white" strokeWidth="2" />
                  <circle cx="400" cy="300" r="80" stroke="white" strokeWidth="2" />
                  <path d="M100 200 Q 300 50 500 200 T 800 200" stroke="white" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <div className="relative grid md:grid-cols-3 gap-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <Stethoscope className="w-10 h-10 mb-4 text-white/90" />
                  <h3 className="font-semibold text-lg mb-2">Clinical Excellence</h3>
                  <p className="text-white/75 text-sm">Complete electronic medical records with SOAP notes, vitals, and diagnosis tracking</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <CreditCard className="w-10 h-10 mb-4 text-white/90" />
                  <h3 className="font-semibold text-lg mb-2">Financial Control</h3>
                  <p className="text-white/75 text-sm">Real-time billing, M-Pesa integration, insurance claims, and revenue analytics</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <BedDouble className="w-10 h-10 mb-4 text-white/90" />
                  <h3 className="font-semibold text-lg mb-2">Resource Management</h3>
                  <p className="text-white/75 text-sm">Ward management, bed tracking, drug inventory, and staff scheduling</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A comprehensive suite of modules designed for every department in your healthcare facility
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{value}</div>
                  <div className="text-primary-200 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-500">Start with a 5-day free trial. No credit card required.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* First Year */}
            <div className="bg-white rounded-2xl border-2 border-primary-500 p-8 relative shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">RECOMMENDED</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">First Year</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-primary-600">Ksh 70,000</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">One-time first-year fee — full access, unlimited users</p>
              <ul className="space-y-3 mb-8">
                {['All modules included', 'Unlimited staff accounts', 'Software updates', 'Phone & email support', '5-day free trial'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a href="#register" className="block w-full text-center bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors">
                Start Free Trial
              </a>
            </div>
            {/* Annual Renewal */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Annual Renewal</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">Ksh 20,000</span>
                <span className="text-gray-400 text-sm mb-1">/year</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Yearly subscription after the first year</p>
              <ul className="space-y-3 mb-8">
                {['All modules included', 'Unlimited staff accounts', 'Software updates', 'Phone & email support', 'Priority assistance'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a href="#contact" className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors">
                Renew Subscription
              </a>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
            <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Payment Instructions
            </h4>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">M-Pesa Paybill</p>
                <p className="text-2xl font-bold text-gray-900">522533</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Account Number</p>
                <p className="text-2xl font-bold text-gray-900">8071524</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Beneficiary</p>
                <p className="text-sm font-bold text-gray-900">Helvino Technologies Limited</p>
              </div>
            </div>
            <p className="text-emerald-700 text-xs mt-3">
              After payment, send your transaction code to <strong>info@helvino.org</strong> or call <strong>0110421320</strong> for activation.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-10">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {pricingFaqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {faq.q}
                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-gray-600">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Healthcare Professionals</h2>
            <p className="text-lg text-gray-500">What our users say about the system</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map(({ name, role, quote }) => (
              <div key={name} className="bg-white rounded-xl p-8 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">"{quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-sm text-gray-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="register" className="py-20 px-6 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Building2 className="w-4 h-4" /> Hospital Registration
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Start Your Free 5-Day Trial</h2>
            <p className="text-primary-100">Register your hospital and get instant access to all modules. No payment required to start.</p>
          </div>

          {success ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
              <p className="text-gray-600 mb-2">Your hospital has been registered. Check your email for login credentials.</p>
              <p className="text-sm text-gray-500 mb-6">Your 5-day free trial starts now. You can log in immediately.</p>
              <Link to="/login" className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors">
                Go to Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8">
              {regError && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-5 border border-red-100">
                  <span className="text-red-400 mt-0.5">⚠</span>
                  <span>{regError}</span>
                </div>
              )}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Hospital Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                      placeholder="e.g. City General Hospital" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Hospital Email *</label>
                    <input name="email" value={form.email} onChange={handleChange} required type="email"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                      placeholder="info@hospital.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone Number *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                      placeholder="0700 000 000" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contact Person *</label>
                    <input name="contactPerson" value={form.contactPerson} onChange={handleChange} required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                      placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">County</label>
                    <input name="county" value={form.county} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                      placeholder="e.g. Nairobi" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Address</label>
                    <input name="address" value={form.address} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                      placeholder="Physical address" />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Admin Account Login Details</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Admin Name *</label>
                      <input name="adminName" value={form.adminName} onChange={handleChange} required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                        placeholder="Full name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Admin Email *</label>
                      <input name="adminEmail" value={form.adminEmail} onChange={handleChange} required type="email"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                        placeholder="admin@hospital.com" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password *</label>
                      <input name="adminPassword" value={form.adminPassword} onChange={handleChange} required type="password" minLength={6}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
                        placeholder="Min. 6 characters" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</> : 'Register & Start Free Trial'}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  By registering, you agree to our Terms of Service. Trial lasts 5 days.
                  First-year fee: Ksh 70,000. Annual renewal: Ksh 20,000.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Contact / Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-8 h-8 text-primary-400" fill="currentColor" />
                <span className="text-xl font-bold">{APP_NAME}</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Developed and maintained by Helvino Technologies Limited. Empowering healthcare facilities across
                East Africa with cutting-edge hospital management solutions.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <Mail className="w-4 h-4" /> info@helvino.org
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <Phone className="w-4 h-4" /> 0110421320
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4" /> helvino.org
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Modules</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Patient Management</li>
                <li>Billing & Payments</li>
                <li>Pharmacy</li>
                <li>Laboratory</li>
                <li>Ward Management</li>
                <li>Reports</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Phone: 0110421320</li>
                <li>Email: info@helvino.org</li>
                <li className="pt-2 font-semibold text-gray-300">Payment</li>
                <li>Paybill: 522533</li>
                <li>Account: 8071524</li>
                <li>Helvino Technologies Ltd</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Helvino Technologies Limited. All rights reserved. | helvino.org
          </div>
        </div>
      </footer>
    </div>
  );
}
