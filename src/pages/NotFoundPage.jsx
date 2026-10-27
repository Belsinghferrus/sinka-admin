import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import { ROUTES } from '../constants.js';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-5 bg-white p-8 rounded-lg border border-stone-200 shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200">
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Error 404
          </span>
          <h1 className="mt-1 text-2xl font-heading font-semibold text-stone-900">
            Page Not Found
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            The requested administrative resource could not be found. Please check the URL or navigate back to the dashboard.
          </p>
        </div>

        <div className="pt-2">
          <Button
            to={ROUTES.DASHBOARD}
            variant="primary"
            size="md"
            icon={<ArrowLeft className="w-4 h-4 mr-2" />}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
