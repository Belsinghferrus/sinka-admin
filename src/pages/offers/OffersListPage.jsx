import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react';
import offerService from '../../services/offer.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import { ROUTES } from '../../constants.js';

export function OffersListPage() {
  const [offers, setOffers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status toggle & delete action state
  const [actionInProgress, setActionInProgress] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Active Offer preview state
  const [activePreview, setActivePreview] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Feedback message
  const [successBanner, setSuccessBanner] = useState(null);

  const fetchOffers = useCallback(async (page = 1, status = statusFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await offerService.getOffers({ page, limit: 10, status });
      setOffers(data.offers);
      setMeta(data.meta);
    } catch (err) {
      setError(err.message || 'Failed to load promotional offers.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOffers(1, statusFilter);
  }, [fetchOffers, statusFilter]);

  const handleStatusToggle = async (offer) => {
    const newStatus = !offer.isActive;
    setActionInProgress(offer.id);
    setError(null);
    try {
      await offerService.setOfferStatus(offer.id, newStatus);
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, isActive: newStatus } : o))
      );
      setSuccessBanner(`Offer "${offer.title}" ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update offer status.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setActionInProgress(deleteCandidate.id);
    setError(null);
    try {
      await offerService.deleteOffer(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccessBanner('Promotional offer deleted successfully.');
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchOffers(meta.page, statusFilter);
    } catch (err) {
      setError(err.message || 'Failed to delete offer.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePreviewActiveOffer = async () => {
    setIsPreviewLoading(true);
    setIsPreviewModalOpen(true);
    try {
      const active = await offerService.getActiveOffer();
      setActivePreview(active);
    } catch (err) {
      setError(err.message || 'Failed to load active promotional offer preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900 tracking-tight">
            Promotional Offers
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Create, manage, and curate customer promotional popups and banners.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreviewActiveOffer}
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-600 mr-1.5" />}
          >
            Preview Active Offer
          </Button>

          <Button
            to={ROUTES.OFFERS_NEW}
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5 mr-1.5" />}
          >
            Create Offer
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-4 text-xs text-red-800 space-y-2">
          <div className="flex items-center space-x-2 font-semibold text-red-900">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Error occurred</span>
          </div>
          <p className="leading-relaxed pl-6">{error}</p>
          <div className="pl-6">
            <button
              type="button"
              onClick={() => fetchOffers(meta.page, statusFilter)}
              className="text-xs font-semibold text-red-800 underline hover:text-red-950"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200">
        {[
          { key: 'all', label: 'All Offers' },
          { key: 'active', label: 'Active Only' },
          { key: 'inactive', label: 'Inactive' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              statusFilter === tab.key
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Offers Table or State */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16">
            <LoadingIndicator message="Loading promotional offers..." size="md" />
          </div>
        ) : offers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-heading font-semibold text-stone-900">
              No promotional offers found
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {statusFilter === 'all'
                ? 'Get started by creating your first promotional offer to display to storefront visitors.'
                : `There are currently no offers matching status "${statusFilter}".`}
            </p>
            <div className="mt-4">
              <Button to={ROUTES.OFFERS_NEW} variant="primary" size="sm">
                Create Offer
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Offer Details</th>
                  <th scope="col" className="px-4 py-3">CTA Destination</th>
                  <th scope="col" className="px-4 py-3">Validity Window</th>
                  <th scope="col" className="px-3 py-3 text-center">Priority</th>
                  <th scope="col" className="px-4 py-3 text-center">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {offers.map((offer) => {
                  const start = formatDate(offer.startDate);
                  const end = formatDate(offer.endDate);

                  return (
                    <tr key={offer.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Image Thumbnail & Title */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start space-x-3">
                          <img
                            src={offer.imageUrl}
                            alt=""
                            className="w-12 h-12 rounded object-cover border border-stone-200 bg-stone-100 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/100x100?text=Offer';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900 text-xs truncate max-w-xs">
                              {offer.title}
                            </p>
                            <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 max-w-sm">
                              {offer.description}
                            </p>
                            {offer.offerDetails && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600 font-mono">
                                {offer.offerDetails}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CTA */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-stone-800">{offer.ctaLabel}</p>
                        <span className="text-[11px] text-stone-500 font-mono truncate block max-w-35" title={offer.ctaUrl}>
                          {offer.ctaUrl}
                        </span>
                      </td>

                      {/* Validity Window */}
                      <td className="px-4 py-3.5 text-stone-600">
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>
                            {start || 'Immediate'} → {end || 'Indefinite'}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                          {offer.priority ?? 0}
                        </span>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(offer)}
                          disabled={actionInProgress === offer.id}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                            offer.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              offer.isActive ? 'bg-emerald-600' : 'bg-stone-400'
                            }`}
                          />
                          {offer.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            to={`/offers/${offer.id}/edit`}
                            className="p-1.5 rounded text-stone-600 hover:text-brand-primary hover:bg-stone-100 transition-colors"
                            title="Edit Offer"
                            aria-label={`Edit ${offer.title}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(offer)}
                            disabled={actionInProgress === offer.id}
                            className="p-1.5 rounded text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Offer"
                            aria-label={`Delete ${offer.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <span>
              Showing Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> (Total {meta.total} offers)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOffers(meta.page - 1, statusFilter)}
                disabled={meta.page <= 1 || isLoading}
                icon={<ChevronLeft className="w-3.5 h-3.5 mr-1" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOffers(meta.page + 1, statusFilter)}
                disabled={meta.page >= meta.totalPages || isLoading}
                rightIcon={<ChevronRight className="w-3.5 h-3.5 ml-1" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-stone-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-heading font-semibold text-stone-900">
                  Delete Promotional Offer?
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <strong>&ldquo;{deleteCandidate.title}&rdquo;</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteCandidate(null)}
                disabled={actionInProgress === deleteCandidate.id}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={actionInProgress === deleteCandidate.id}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Offer Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-stone-200 max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-md"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-base font-heading font-semibold text-stone-900">
                Storefront Active Offer Preview
              </h3>
            </div>

            {isPreviewLoading ? (
              <div className="py-12">
                <LoadingIndicator message="Querying live active offer..." size="md" />
              </div>
            ) : activePreview ? (
              <div className="space-y-4 text-left">
                <div className="rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                  <img
                    src={activePreview.imageUrl}
                    alt={activePreview.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x300?text=Preview';
                    }}
                  />
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      Winning Active Offer
                    </span>
                    <h4 className="text-base font-heading font-semibold text-stone-900">
                      {activePreview.title}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {activePreview.description}
                    </p>
                    {activePreview.offerDetails && (
                      <p className="text-xs font-semibold text-brand-secondary">
                        {activePreview.offerDetails}
                      </p>
                    )}
                    <div className="pt-2">
                      <a
                        href={activePreview.ctaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs font-semibold text-brand-primary hover:underline"
                      >
                        <span>{activePreview.ctaLabel}</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  This preview reflects the exact response returned by <code className="font-mono">GET /api/admin/offers/active</code> (and public <code className="font-mono">GET /api/offers/active</code>).
                </p>
              </div>
            ) : (
              <div className="py-8 text-center text-stone-500 text-xs">
                <p className="font-semibold text-stone-700">No Active Promotional Offer Found</p>
                <p className="mt-1">
                  Either all offers are inactive/expired, or none match the current time window.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OffersListPage;
