import PublicNavbar from '@/components/navigation/PublicNavbar';
import PublicFooter from '@/components/navigation/PublicFooter';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Terms of Service - Looply',
  description: 'Terms and conditions governing the use of the Looply social platform and services.'
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#1E1E24] antialiased selection:bg-[#6C63FF] selection:text-white">
      <PublicNavbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
              Platform Agreement
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-[#1E1E24] tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-[#6B6B73]">
              Last Updated: November 1, 2026 &bull; Looply Core Platform
            </p>
          </div>

          <Card className="shadow-xs border-[#E7E5E0] bg-[#FFFFFF]">
            <CardHeader className="border-b border-[#E7E5E0] pb-4">
              <CardTitle className="text-lg text-[#1E1E24]">1. Agreement to Terms</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#6B6B73] leading-relaxed">
              <p>
                By registering an account or accessing Looply (&ldquo;Connect. Share. Express.&rdquo;), you agree to comply with and be bound by these Terms of Service. If you disagree with any portion of these terms, you must discontinue your use of Looply.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-[#E7E5E0] bg-[#FFFFFF]">
            <CardHeader className="border-b border-[#E7E5E0] pb-4">
              <CardTitle className="text-lg text-[#1E1E24]">2. Account Security &amp; Registration</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#6B6B73] leading-relaxed">
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6B73]">
                <li><strong className="text-[#1E1E24]">Accurate Credentials:</strong> You must supply a valid email address and legal full name. Public registrations are strictly assigned standard user permissions.</li>
                <li><strong className="text-[#1E1E24]">Security &amp; Passwords:</strong> You are responsible for preserving the confidentiality of your authentication credentials. Unauthorized access attempts, token tampering, or role-escalation exploits will trigger automatic account suspension.</li>
                <li><strong className="text-[#1E1E24]">Email Verification:</strong> Full interactive platform capabilities (posting, commenting, AI tools) require email verification before account activation is completed.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-[#E7E5E0] bg-[#FFFFFF]">
            <CardHeader className="border-b border-[#E7E5E0] pb-4">
              <CardTitle className="text-lg text-[#1E1E24]">3. Acceptable Conduct &amp; Content Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#6B6B73] leading-relaxed">
              <p>
                Looply is committed to respectful discourse. You agree not to engage in or publish:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6B73]">
                <li>Harassment, hate speech, bullying, defamation, or threats of violence.</li>
                <li>Malicious software, phishing links, prompt-injection attacks, or automated denial-of-service activities.</li>
                <li>Spamming, automated bot accounts, or fraudulent impersonation of other individuals or entities.</li>
                <li>Unlawful content or material that infringes upon third-party intellectual property rights.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-[#E7E5E0] bg-[#FFFFFF]">
            <CardHeader className="border-b border-[#E7E5E0] pb-4">
              <CardTitle className="text-lg text-[#1E1E24]">4. Content Ownership &amp; AI Assistance</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#6B6B73] leading-relaxed">
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6B73]">
                <li><strong className="text-[#1E1E24]">Ownership:</strong> You retain complete ownership of all original text, thoughts, and commentary you publish to Looply.</li>
                <li><strong className="text-[#1E1E24]">Display License:</strong> You grant Looply a non-exclusive, royalty-free license to store, format, and display your content strictly within the application ecosystem.</li>
                <li><strong className="text-[#1E1E24]">AI Authorship:</strong> Suggestions generated through the Gemini AI assistant are advisory. You maintain final editorial discretion and legal responsibility for any content you choose to publish.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-[#E7E5E0] bg-[#FFFFFF]">
            <CardHeader className="border-b border-[#E7E5E0] pb-4">
              <CardTitle className="text-lg text-[#1E1E24]">5. Moderation &amp; Enforcement</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm text-[#6B6B73] leading-relaxed">
              <p className="text-xs text-[#6B6B73]">
                Platform administrators reserve the right to review, edit, hide, or delete any content and suspend any account that violates these terms or threatens community safety. For support, contact <a href="mailto:support@looply.net" className="text-[#6C63FF] hover:underline font-medium">support@looply.net</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
