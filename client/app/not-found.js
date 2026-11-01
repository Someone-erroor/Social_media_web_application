import Link from 'next/link';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/brand/Logo';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Page Not Found | Looply',
  description: 'The requested page could not be found'
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080D12] text-[#F4F8FA] flex flex-col justify-center items-center px-4 py-16 text-center">
      <div className="mb-6">
        <Logo size="large" showTagline={true} href={ROUTES.PUBLIC.HOME} />
      </div>

      <div className="max-w-md w-full bg-[#151F29] p-8 rounded-2xl border border-[#263640] shadow-xl shadow-black/40 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1D2A35] border border-[#263640] flex items-center justify-center text-[#19D3E3] mx-auto shadow-sm">
          <Icon name="alertCircle" className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-[#F4F8FA] tracking-tight">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-[#9BAAB4] leading-relaxed">
          The link you followed may be broken, or the page may have been removed. Check the URL or return to the feed.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button
            href={ROUTES.USER.FEED}
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
          >
            Go to Home Feed
          </Button>

          <Button
            href={ROUTES.PUBLIC.HOME}
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
          >
            Public Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
