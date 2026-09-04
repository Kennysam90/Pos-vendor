import { useState } from 'react'
import { Shield, FileText, ArrowLeft } from 'lucide-react'

interface Props {
  onBack: () => void
}

export function PoliciesView({ onBack }: Props) {
  const [tab, setTab] = useState<'privacy' | 'terms'>('privacy')

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={onBack} className="btn-ghost mb-6 text-ink-500 hover:text-ink-700">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Legal & Policies</h1>
            <p className="text-sm text-ink-500">Last updated: September 4, 2026</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('privacy')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${tab === 'privacy' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}>
            <Shield size={16} /> Privacy Policy
          </button>
          <button onClick={() => setTab('terms')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${tab === 'terms' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}>
            <FileText size={16} /> Terms of Service
          </button>
        </div>

        <div className="card p-6 sm:p-8">
          {tab === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
        </div>
      </div>
    </div>
  )
}

function PrivacyPolicy() {
  return (
    <div className="space-y-4 text-ink-700">
      <h2 className="text-lg font-bold text-ink-900">Privacy Policy</h2>
      <p className="text-sm text-ink-600 leading-relaxed">
        This Privacy Policy describes how POS Tracker NG collects, uses, and protects your information
        when you use our application to manage your POS agent business.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">1. Information We Collect</h3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-ink-600">
        <li><strong>Account information:</strong> Your email address and display name when you create an account.</li>
        <li><strong>Business data:</strong> Transaction records, machine details, customer credit records, expenses, settlements, and invoices you log in the app.</li>
        <li><strong>Profile details:</strong> Optional phone number and business name you provide.</li>
      </ul>
      <h3 className="font-semibold text-ink-900 mt-4">2. How We Use Your Information</h3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-ink-600">
        <li>To provide and maintain the POS tracking service.</li>
        <li>To display your business analytics, reports, and dashboards.</li>
        <li>To authenticate you and secure your data.</li>
        <li>To send account-related emails (verification, security notices).</li>
      </ul>
      <h3 className="font-semibold text-ink-900 mt-4">3. Data Security</h3>
      <p className="text-sm text-ink-600 leading-relaxed">
        Your data is stored in a secure database with row-level security policies. Each user can only access their own
        data — no other user can view, edit, or delete your records. Authentication is handled through Supabase Auth
        with encrypted password storage.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">4. Data Retention</h3>
      <p className="text-sm text-ink-600 leading-relaxed">
        Your data is retained for as long as your account is active. You may delete individual records at any time.
        If you wish to delete your account and all associated data, contact us.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">5. Third-Party Services</h3>
      <p className="text-sm text-ink-600 leading-relaxed">
        We use Supabase for database hosting and authentication. We do not sell or share your data with any third parties.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">6. Your Rights</h3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-ink-600">
        <li>Access your personal data at any time through the app.</li>
        <li>Update or correct your profile information.</li>
        <li>Delete individual records or request full account deletion.</li>
      </ul>
      <h3 className="font-semibold text-ink-900 mt-4">7. Contact</h3>
      <p className="text-sm text-ink-600 leading-relaxed">
        For privacy-related questions or requests, please reach out through the app's support channels.
      </p>
    </div>
  )
}

function TermsOfService() {
  return (
    <div className="space-y-4 text-ink-700">
      <h2 className="text-lg font-bold text-ink-900">Terms of Service</h2>
      <p className="text-sm text-ink-600 leading-relaxed">
        These Terms govern your use of POS Tracker NG. By creating an account or using the app, you agree to these terms.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">1. Acceptance of Terms</h3>
      <p className="text-sm text-ink-600 leading-relaxed">By using this application, you agree to be bound by these Terms of Service.</p>
      <h3 className="font-semibold text-ink-900 mt-4">2. Description of Service</h3>
      <p className="text-sm text-ink-600 leading-relaxed">
        POS Tracker NG is a business management tool for Nigerian POS agents. It provides tools for tracking
        transactions, managing POS machines, recording customer credits, logging expenses, generating invoices,
        and viewing business analytics.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">3. User Responsibilities</h3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-ink-600">
        <li>You are responsible for the accuracy of data you enter.</li>
        <li>You must keep your login credentials secure and confidential.</li>
        <li>You agree not to use the app for any illegal or fraudulent purposes.</li>
        <li>You are responsible for maintaining accurate financial records for tax and regulatory compliance.</li>
      </ul>
      <h3 className="font-semibold text-ink-900 mt-4">4. Intellectual Property</h3>
      <p className="text-sm text-ink-600 leading-relaxed">
        The application, its design, and its code are owned by POS Tracker NG. You retain ownership of all data you enter.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">5. Limitation of Liability</h3>
      <p className="text-sm text-ink-600 leading-relaxed">
        POS Tracker NG is provided "as is" without warranties of any kind. We are not liable for any financial losses,
        data loss, or business disruptions arising from the use of this application.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">6. Termination</h3>
      <p className="text-sm text-ink-600 leading-relaxed">
        You may stop using the app and delete your account at any time. We reserve the right to suspend or terminate
        accounts that violate these Terms.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">7. Changes to Terms</h3>
      <p className="text-sm text-ink-600 leading-relaxed">
        We may update these Terms from time to time. Continued use of the app after changes constitutes acceptance.
      </p>
      <h3 className="font-semibold text-ink-900 mt-4">8. Governing Law</h3>
      <p className="text-sm text-ink-600 leading-relaxed">These Terms are governed by the laws of the Federal Republic of Nigeria.</p>
    </div>
  )
}
