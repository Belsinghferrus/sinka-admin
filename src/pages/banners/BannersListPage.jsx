import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  X,
  Loader2,
} from 'lucide-react';
import bannerService from '../../services/banner.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import BannerPreviewModal from '../../components/banners/BannerPreviewModal.jsx';
import { ROUTES } from '../../constants.js';

export function BannersListPage() {
  const [banners, setBanners] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'true' | 'false'

  // Action states
  const [actionInProgress, setActionInProgress] = useState(null); // id of row toggling/reordering
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview modal state
  const [previewBanner, setPreviewBanner] = useState(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);

  const fetchBanners = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await bannerService.getBanners({
          page,
          limit: 20,
          search: appliedSearch,
          isActive: statusFilter,
          sort: 'sortOrder:asc',
        });

        // Ensure banners are sorted by sortOrder ascending
        const sorted = [...(data.banners || [])].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        );

        setBanners(sorted);
        setMeta(data.meta || { total: sorted.length, page, limit: 20, totalPages: 1 });
      } catch (err) {
        setError(err.message || 'Failed to load homepage banners.');
      } finally {
        setIsLoading(false);
      }
    },
    [appliedSearch, statusFilter]
  );

  useEffect(() => {
    fetchBanners(1);
  }, [fetchBanners]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatusFilter('all');
  };

  // Status toggle handler
  const handleToggleStatus = async (banner) => {
    const bannerId = banner.id || banner._id;
    const newStatus = !banner.isActive;
    setActionInProgress(bannerId);
    setError(null);

    try {
      await bannerService.updateBanner(bannerId, { isActive: newStatus });
      setBanners((prev) =>
        prev.map((b) => ((b.id || b._id) === bannerId ? { ...b, isActive: newStatus } : b))
      );
      setFeedback({
        type: 'success',
        message: `Banner "${banner.title || 'Image Banner #' + (banner.sortOrder ?? 0)}" is now ${newStatus ? 'active' : 'inactive'}.`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update banner status.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Reorder: Move banner Up (lower sortOrder index)
  const handleMoveUp = async (index) => {
    if (index <= 0) return;
    const current = banners[index];
    const target = banners[index - 1];
    const currentId = current.id || current._id;
    const targetId = target.id || target._id;

    const newCurrentOrder = target.sortOrder ?? (index - 1);
    const newTargetOrder = current.sortOrder ?? index;

    // Optimistic reorder
    const updated = [...banners];
    updated[index - 1] = { ...current, sortOrder: newCurrentOrder };
    updated[index] = { ...target, sortOrder: newTargetOrder };
    setBanners(updated);

    setActionInProgress(currentId);
    try {
      await bannerService.reorderBanners([
        { id: currentId, sortOrder: newCurrentOrder },
        { id: targetId, sortOrder: newTargetOrder },
      ]);
      setFeedback({
        type: 'success',
        message: `Moved "${current.title}" to position #${newCurrentOrder}.`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reorder banners. Rolling back...');
      fetchBanners(meta.page);
    } finally {
      setActionInProgress(null);
    }
  };

  // Reorder: Move banner Down (higher sortOrder index)
  const handleMoveDown = async (index) => {
    if (index >= banners.length - 1) return;
    const current = banners[index];
    const target = banners[index + 1];
    const currentId = current.id || current._id;
    const targetId = target.id || target._id;

    const newCurrentOrder = target.sortOrder ?? (index + 1);
    const newTargetOrder = current.sortOrder ?? index;

    // Optimistic reorder
    const updated = [...banners];
    updated[index + 1] = { ...current, sortOrder: newCurrentOrder };
    updated[index] = { ...target, sortOrder: newTargetOrder };
    setBanners(updated);

    setActionInProgress(currentId);
    try {
      await bannerService.reorderBanners([
        { id: currentId, sortOrder: newCurrentOrder },
        { id: targetId, sortOrder: newTargetOrder },
      ]);
      setFeedback({
        type: 'success',
        message: `Moved "${current.title}" to position #${newCurrentOrder}.`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reorder banners. Rolling back...');
      fetchBanners(meta.page);
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete banner handler
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    const candidateId = deleteCandidate.id || deleteCandidate._id;
    setIsDeleting(true);
    setError(null);

    try {
      await bannerService.deleteBanner(candidateId);
      setDeleteCandidate(null);
      setFeedback({
        type: 'success',
        message: 'Homepage banner removed successfully.',
      });
      setTimeout(() => setFeedback(null), 4000);
      fetchBanners(meta.page);
    } catch (err) {
      setError(err.message || 'Failed to delete banner.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for Schedule status pill
  const getScheduleBadge = (banner) => {
    const now = new Date();
    const start = banner.startDate ? new Date(banner.startDate) : null;
    const end = banner.endDate ? new Date(banner.endDate) : null;

    if (start && now < start) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3 mr-1 text-blue-600" />
          Scheduled
        </span>
      );
    }
    if (end && now > end) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 mr-1 text-amber-600" />
          Expired
        </span>
      );
    }
    if (banner.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
          Active Now
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
        <XCircle className="w-3 h-3 mr-1 text-stone-400" />
        Inactive
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-stone-100 text-brand-primary">
              <ImageIcon className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900 tracking-tight">
              Homepage Banners
            </h1>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Manage the storefront hero carousel and promotional banners.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to={ROUTES.BANNERS_NEW}>
            <Button variant="primary" size="md" className="inline-flex items-center space-x-2 shadow-xs">
              <Plus className="w-4 h-4" />
              <span>Add Banner</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Action Failed</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, eyebrow, subtitle, or CTA..."
              className="w-full pl-9 pr-24 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white text-stone-900 transition-colors"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setAppliedSearch('');
                  }}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <Button type="submit" variant="secondary" size="sm" className="text-xs px-2.5 py-1">
                Search
              </Button>
            </div>
          </form>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-2">
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-1">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('true')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === 'true'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('false')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === 'false'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Inactive
              </button>
            </div>

            {(appliedSearch || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
          <span>
            Showing <strong className="text-stone-800">{banners.length}</strong> of{' '}
            <strong className="text-stone-800">{meta.total}</strong> banners
          </span>
          <span className="italic text-[11px] text-stone-400">
            Use the ▲ and ▼ buttons to adjust carousel display priority
          </span>
        </div>
      </div>

      {/* Main Table or Loading/Empty state */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <LoadingIndicator size="lg" message="Loading homepage banners..." />
          </div>
        ) : banners.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900">No homepage banners found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
              {appliedSearch || statusFilter !== 'all'
                ? 'No banners match your active filters. Try adjusting your query or resetting.'
                : 'Get started by creating your first storefront hero carousel banner.'}
            </p>
            {appliedSearch || statusFilter !== 'all' ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link to={ROUTES.BANNERS_NEW}>
                <Button variant="primary" size="sm" className="inline-flex items-center space-x-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Banner</span>
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/75 border-b border-stone-200 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-20 text-center">Order</th>
                  <th className="py-3 px-4 w-40">Artwork</th>
                  <th className="py-3 px-4">Headline & Eyebrow</th>
                  <th className="py-3 px-4 w-48">Call to Action</th>
                  <th className="py-3 px-4 w-32">Schedule</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {banners.map((banner, index) => {
                  const bannerId = banner.id || banner._id;
                  const isActioning = actionInProgress === bannerId;

                  return (
                    <tr
                      key={bannerId || index}
                      className="hover:bg-stone-50/60 transition-colors group"
                    >
                      {/* Reorder / Display Order controls */}
                      <td className="py-3 px-4 text-center align-middle">
                        <div className="flex flex-col items-center justify-center space-y-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || isActioning}
                            className={`p-1 rounded transition-colors ${
                              index === 0 || isActioning
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 cursor-pointer'
                            }`}
                            title="Move Up in Carousel"
                            aria-label={`Move ${banner.title} up`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                            #{banner.sortOrder ?? index}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === banners.length - 1 || isActioning}
                            className={`p-1 rounded transition-colors ${
                              index === banners.length - 1 || isActioning
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 cursor-pointer'
                            }`}
                            title="Move Down in Carousel"
                            aria-label={`Move ${banner.title} down`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Artwork Thumbnail */}
                      <td className="py-3 px-4 align-middle">
                        <div
                          className="relative w-32 h-16 rounded-md overflow-hidden bg-stone-100 border border-stone-200 cursor-pointer group-hover:shadow-xs transition-shadow shrink-0"
                          onClick={() => setPreviewBanner(banner)}
                          title="Click to preview storefront banner"
                        >
                          {banner.image ? (
                            <img
                              src={banner.image}
                              alt={banner.altText || banner.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white drop-shadow-xs" />
                          </div>
                        </div>
                      </td>

                      {/* Headline & Eyebrow */}
                      <td className="py-3 px-4 align-middle">
                        <div className="space-y-1">
                          {banner.eyebrow && (
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-brand-primary bg-amber-50 px-1.5 py-0.5 rounded">
                              {banner.eyebrow}
                            </span>
                          )}
                          <div className="font-heading font-semibold text-stone-900 line-clamp-1">
                            {banner.title || (
                              <span className="italic text-stone-400 font-normal text-xs">
                                Pure Image Banner (No text overlay)
                              </span>
                            )}
                          </div>
                          {banner.subtitle && (
                            <p className="text-xs text-stone-500 line-clamp-1 max-w-md">
                              {banner.subtitle}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* CTA Button & URL */}
                      <td className="py-3 px-4 align-middle">
                        {banner.ctaText ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center text-xs font-medium text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                              {banner.ctaText}
                            </span>
                            <div className="text-[11px] text-stone-400 font-mono truncate max-w-44 flex items-center">
                              <span className="truncate">{banner.ctaLink || '/shop'}</span>
                              {banner.ctaLink && (
                                <a
                                  href={banner.ctaLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 text-stone-400 hover:text-stone-600 shrink-0"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs italic">— None —</span>
                        )}
                      </td>

                      {/* Schedule status */}
                      <td className="py-3 px-4 align-middle">
                        {getScheduleBadge(banner)}
                      </td>

                      {/* Active/Inactive Toggle */}
                      <td className="py-3 px-4 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(banner)}
                          disabled={isActioning}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            banner.isActive ? 'bg-emerald-600' : 'bg-stone-300'
                          } ${isActioning ? 'opacity-50 cursor-wait' : ''}`}
                          role="switch"
                          aria-checked={banner.isActive}
                          title={banner.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span className="sr-only">Toggle banner status</span>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              banner.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right align-middle">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Preview */}
                          <button
                            type="button"
                            onClick={() => setPreviewBanner(banner)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                            title="Preview Storefront Carousel Slide"
                            aria-label={`Preview ${banner.title}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <Link
                            to={ROUTES.BANNERS_EDIT.replace(':id', bannerId)}
                            className="p-1.5 text-stone-400 hover:text-brand-primary hover:bg-stone-100 rounded-md transition-colors"
                            title="Edit Banner Configuration"
                            aria-label={`Edit ${banner.title}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(banner)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Banner"
                            aria-label={`Delete ${banner.title}`}
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

        {/* Pagination bar */}
        {!isLoading && banners.length > 0 && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200 bg-stone-50/50">
            <span className="text-xs text-stone-500">
              Page <strong className="text-stone-800">{meta.page}</strong> of{' '}
              <strong className="text-stone-800">{meta.totalPages}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => fetchBanners(meta.page - 1)}
                className="text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchBanners(meta.page + 1)}
                className="text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Storefront Hero Preview Modal */}
      <BannerPreviewModal
        banner={previewBanner}
        isOpen={Boolean(previewBanner)}
        onClose={() => setPreviewBanner(null)}
      />

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-heading font-semibold text-stone-900">
                  Delete Homepage Banner
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Are you sure you want to permanently delete the banner{' '}
                  <strong className="text-stone-800 font-medium">
                    "{deleteCandidate.title || 'Image Banner #' + (deleteCandidate.sortOrder ?? 0)}"
                  </strong>?
                </p>
                <p className="text-[11px] text-stone-400 mt-2">
                  This action cannot be undone. Any unused Cloudflare R2 image file will be automatically purged.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteCandidate(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center space-x-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Banner'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BannersListPage;

