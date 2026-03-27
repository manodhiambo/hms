import { Link } from 'react-router-dom';
import {
  Heart, Users, CalendarDays, Stethoscope, Pill, FlaskConical, CreditCard, BedDouble,
  Shield, BarChart3, ArrowRight, CheckCircle2, Phone, Mail, MapPin, Star
} from 'lucide-react';

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
  { name: 'Dr. Sarah Kamau', role: 'Chief Medical Officer', quote: 'Ogada Church Medical Clinic transformed how we manage patient care. The integrated clinical workflow saves us hours every day.' },
  { name: 'James Mwangi', role: 'Hospital Administrator', quote: 'The billing module alone paid for itself within months. Real-time revenue tracking is invaluable.' },
  { name: 'Nurse Grace Otieno', role: 'Head Nurse, ICU', quote: 'Managing bed assignments and nursing notes has never been easier. The ward module is exceptionally well designed.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary-600" fill="currentColor" />
            <span className="text-xl font-bold text-gray-900">Ogada Church Medical Clinic</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Features</a>
            <a href="#stats" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">About</a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Testimonials</a>
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
              Trusted by leading healthcare facilities in Kenya
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Modern Healthcare<br />
              <span className="bg-gradient-to-r from-primary-600 to-teal-500 bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
              Streamline your hospital operations with an integrated platform for patient care,
              billing, pharmacy, laboratory, and ward management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25">
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-3.5 rounded-xl text-base font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">
                Explore Features
              </a>
            </div>
          </div>

          {/* Hero Image/Visual */}
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

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Healthcare Professionals</h2>
            <p className="text-lg text-gray-500">What our users say about Ogada Church Medical Clinic</p>
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

      {/* Contact / Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-8 h-8 text-primary-400" fill="currentColor" />
                <span className="text-xl font-bold">Ogada Church Medical Clinic</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Developed and maintained by Helvino Technologies Limited. Empowering healthcare facilities across
                East Africa with cutting-edge hospital management solutions.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <Mail className="w-4 h-4" /> helvinotechltd@gmail.com
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <Phone className="w-4 h-4" /> +254 703 445 756
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
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>About Us</li>
                <li>Contact</li>
                <li>Support</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Licensing</li>
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
