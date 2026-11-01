import PublicNavbar from '@/components/navigation/PublicNavbar';
import PublicFooter from '@/components/navigation/PublicFooter';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Privacy Policy - Looply',
  description: 'Understand how Looply collects, stores, and protects your personal information and application data.'
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080D12] text-[#F4F8FA] antialiased selection:bg-[#19D3E3] selection:text-[#080D12]">
      <PublicNavbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#19D3E3]">
              Data Protection &amp; Governance
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F4F8FA] tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-[#9BAAB4]">
              Effective Date: November 1, 2026 &bull; Looply Core Platform
            </p>
          </div>

          <Card className="shadow-xs border-[#263640] bg-[#151F29]">
            <CardHeader className="border-b border-[#263640] pb-4">
              <CardTitle className="text-lg text-[#F4F8FA]">1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#9BAAB4] leading-relaxed">
              <p>
                Looply collects only the essential information necessary to provide an authentic, secure social networking service:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#9BAAB4]">
                <li><strong className="text-[#F4F8FA]">Account Profile Data:</strong> Full name, email address, optional biography, and profile avatar URL.</li>
                <li><strong className="text-[#F4F8FA]">Authentication Credentials:</strong> Passwords are never stored in plaintext. Passwords are cryptographically salted and hashed using high-entropy bcrypt (<code className="text-xs bg-[#101A22] px-1 py-0.5 rounded text-[#19D3E3]">12 rounds</code>).</li>
                <li><strong className="text-[#F4F8FA]">User-Generated Content:</strong> Posts, comments, likes, and discussion interactions that you voluntarily publish.</li>
                <li><strong className="text-[#F4F8FA]">Security &amp; Audit Logs:</strong> Timestamped records of authentication events, password updates, and moderation actions for platform integrity.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-[#263640] bg-[#151F29]">
            <CardHeader className="border-b border-[#263640] pb-4">
              <CardTitle className="text-lg text-[#F4F8FA]">2. Authentication Cookies &amp; Storage</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#9BAAB4] leading-relaxed">
              <p>
                Looply utilizes a single, strictly secure authentication cookie named <code className="text-xs bg-[#101A22] px-1.5 py-0.5 rounded font-mono text-[#19D3E3]">looply_auth</code>:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#9BAAB4]">
                <li>Configured with <code className="text-xs bg-[#101A22] px-1 py-0.5 rounded text-[#19D3E3]">HttpOnly: true</code> to prevent client-side JavaScript and Cross-Site Scripting (XSS) extraction.</li>
                <li>Configured with <code className="text-xs bg-[#101A22] px-1 py-0.5 rounded text-[#19D3E3]">SameSite: Lax</code> to protect against Cross-Site Request Forgery (CSRF).</li>
                <li>Contains a cryptographically signed JSON Web Token (JWT) encapsulating your user ID and token version for instant server-side revocation on logout.</li>
                <li>We do not employ third-party tracking cookies, behavioural advertising trackers, or social pixel trackers.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-[#263640] bg-[#151F29]">
            <CardHeader className="border-b border-[#263640] pb-4">
              <CardTitle className="text-lg text-[#F4F8FA]">3. Email Verification &amp; Account Recovery</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#9BAAB4] leading-relaxed">
              <p>
                Email verification and password recovery links rely on cryptographically random 256-bit hexadecimal tokens:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#9BAAB4]">
                <li>Raw tokens are transmitted directly via transactional email (or local dev preview) and are strictly single-use.</li>
                <li>The server hashes tokens using SHA-256 before persisting them to the database; raw tokens are never written to disk or database tables.</li>
                <li>Tokens expire automatically after 24 hours. Once verified or expired, tokens are purged.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-[#263640] bg-[#151F29]">
            <CardHeader className="border-b border-[#263640] pb-4">
              <CardTitle className="text-lg text-[#F4F8FA]">4. Artificial Intelligence Processing (Google Gemini)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#9BAAB4] leading-relaxed">
              <p>
                Looply integrates Google Gemini API for post draft generation, writing improvement, and thread summarization:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#9BAAB4]">
                <li>AI processing is triggered exclusively on user demand. No background automated scraping is conducted.</li>
                <li>User inputs undergo server-side prompt-injection neutralization prior to reaching the Gemini model.</li>
                <li>Generated suggestions remain in temporary client state; they are never automatically posted to your profile without your manual review and confirmation.</li>
                <li>Your account passwords, authentication tokens, and private identifiers are never shared with the AI provider.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-[#263640] bg-[#151F29]">
            <CardHeader className="border-b border-[#263640] pb-4">
              <CardTitle className="text-lg text-[#F4F8FA]">5. Contact &amp; Privacy Requests</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#9BAAB4] leading-relaxed">
              <p className="text-xs text-[#9BAAB4]">
                For questions regarding this privacy policy or to request account deletion, contact the Looply administrative team at{' '}
                <a href="mailto:privacy@looply.net" className="text-[#19D3E3] hover:underline font-medium">privacy@looply.net</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

