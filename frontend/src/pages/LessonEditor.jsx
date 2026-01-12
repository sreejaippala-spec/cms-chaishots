import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, VideoIcon, Calendar, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';

export default function LessonEditor() {
    const { role } = useAuthStore();
    const { id } = useParams();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchLesson = useCallback(async () => {
        try {
            const data = await api.get(`/api/cms/lessons/${id}`);
            setLesson(data);
            setHasUnsavedChanges(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load lesson');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLesson();
    }, [fetchLesson]);

    const [showAssetModal, setShowAssetModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null); // { lang, variant, currentUrl }

    // Mark as unsaved
    const handleLocalUpdate = (updates) => {
        setLesson(prev => ({ ...prev, ...updates }));
        setHasUnsavedChanges(true);
    };

    const handleAssetUpdate = (url) => {
        const { lang, variant } = selectedAsset;
        const newAssets = JSON.parse(JSON.stringify(lesson.assets || {}));
        if (!newAssets.thumbnails) newAssets.thumbnails = {};
        if (!newAssets.thumbnails[lang]) newAssets.thumbnails[lang] = {};

        newAssets.thumbnails[lang][variant] = url;
        handleLocalUpdate({ assets: newAssets });
        setShowAssetModal(false);
    };

    const handleSave = async () => {
        if (!lesson.title) return toast.error("Title is required");

        setSaving(true);
        try {
            // Send full lesson object for now
            const updated = await api.patch(`/api/cms/lessons/${id}`, {
                title: lesson.title,
                content_type: lesson.content_type,
                assets: lesson.assets,
                content_urls_by_language: lesson.content_urls_by_language,
                subtitle_urls_by_language: lesson.subtitle_urls_by_language,
                publish_at: lesson.publish_at,
                status: lesson.status // Status typically updated via publish button, but sync it 
            });
            setLesson(prev => ({ ...prev, ...updated }));
            setHasUnsavedChanges(false);
            toast.success('Saved successfully');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async (newStatus) => {
        if (hasUnsavedChanges) {
            toast.error('Please save your changes before publishing.');
            return;
        }

        if (newStatus === 'published') {
            const hasThumbnail = lesson.assets?.thumbnails?.en?.portrait; // Ensure English portrait is set
            if (!hasThumbnail) {
                toast.error('Cannot publish: Missing portrait thumbnail.');
                return;
            }
        }
        setPublishing(true);
        try {
            await api.patch(`/api/cms/lessons/${id}/status`, {
                status: newStatus,
                publish_at: newStatus === 'scheduled' ? new Date().toISOString() : null
            });
            setLesson(prev => ({ ...prev, status: newStatus }));
            toast.success(`Lesson ${newStatus}!`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to update status');
        } finally {
            setPublishing(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-500">Loading editor...</div>;
    if (!lesson) return <div className="text-center py-20 text-gray-500">Lesson not found</div>;

    return (
        <div className="h-[calc(100vh-80px)] -m-4 md:-m-8 flex flex-col bg-gray-50/50">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link to="/programs" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{lesson.title}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            {hasUnsavedChanges ? <span className="text-amber-600 font-medium">Unsaved Changes</span> : 'All changes saved'} • {lesson.status}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {role !== 'viewer' && (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving || !hasUnsavedChanges}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => handlePublish('published')}
                                disabled={publishing || lesson.status === 'published' || hasUnsavedChanges}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                                title={hasUnsavedChanges ? "Save changes first" : ""}
                            >
                                {publishing ? 'Publishing...' : (lesson.status === 'published' ? 'Published' : (lesson.status === 'scheduled' ? 'Publish Now' : 'Publish'))}
                            </button>
                        </>
                    )}
                </div>
            </div>
            {/* Main Editor View */}
            <div className="flex-1 overflow-hidden bg-gray-50 flex justify-center">
                <div className="w-full max-w-4xl h-full overflow-y-auto p-6 md:p-8 bg-white shadow-sm border-x border-gray-200">
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Lesson Details</label>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={lesson.title}
                                    readOnly={role === 'viewer'}
                                    onChange={(e) => role !== 'viewer' && handleLocalUpdate({ title: e.target.value })}
                                    className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium ${role === 'viewer' ? 'text-gray-500' : ''}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Content Type <span className="text-red-500">*</span>
                                </label>
                                <div className={`grid grid-cols-2 gap-4 ${role === 'viewer' ? 'pointer-events-none opacity-60' : ''}`}>
                                    <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${lesson.content_type === 'video' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="type"
                                            className="sr-only"
                                            checked={lesson.content_type === 'video'}
                                            onChange={() => handleLocalUpdate({ content_type: 'video' })}
                                        />
                                        <VideoIcon size={24} />
                                        <span className="font-medium text-sm">Video Lesson</span>
                                    </label>
                                    <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${lesson.content_type === 'article' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="type"
                                            className="sr-only"
                                            checked={lesson.content_type === 'article'}
                                            onChange={() => handleLocalUpdate({ content_type: 'article' })}
                                        />
                                        <FileText size={24} />
                                        <span className="font-medium text-sm">Article</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Assets & Subtitles</label>

                        {/* Thumbnails */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnails</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['portrait', 'landscape'].map(variant => {
                                    const lang = 'en'; // Default to EN for now or make it selectable
                                    const url = lesson.assets?.thumbnails?.[lang]?.[variant];
                                    return (
                                        <div key={variant} className="border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-blue-400 transition-colors cursor-pointer relative group"
                                            onClick={() => {
                                                if (role !== 'viewer') {
                                                    setSelectedAsset({ lang, variant, currentUrl: url });
                                                    setShowAssetModal(true);
                                                }
                                            }}
                                        >
                                            <div className="text-xs font-medium text-gray-500 uppercase mb-2">{variant} ({lang})</div>
                                            <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative">
                                                {url ? (
                                                    <img src={url} alt={variant} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="text-gray-300" />
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Subtitles */}
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle URL (English)</label>
                            <input
                                type="text"
                                value={lesson.subtitle_urls_by_language?.en || ''}
                                readOnly={role === 'viewer'}
                                placeholder="https://... .vtt"
                                onChange={(e) => {
                                    if (role !== 'viewer') {
                                        const urls = { ...(lesson.subtitle_urls_by_language || {}), en: e.target.value };
                                        handleLocalUpdate({ subtitle_urls_by_language: urls });
                                    }
                                }}
                                className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-gray-600 ${role === 'viewer' ? 'opacity-70' : ''}`}
                            />
                        </div>

                        {/* Media Source */}
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Video Source URL</label>
                            <input
                                type="text"
                                value={lesson.content_urls_by_language?.en || ''}
                                readOnly={role === 'viewer'}
                                placeholder="https://vimeo.com/..."
                                onChange={(e) => {
                                    if (role !== 'viewer') {
                                        const urls = { ...(lesson.content_urls_by_language || {}), en: e.target.value };
                                        handleLocalUpdate({ content_urls_by_language: urls });
                                    }
                                }}
                                className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-gray-600 ${role === 'viewer' ? 'opacity-70' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Scheduling</label>
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 flex items-start gap-3">
                            <Calendar className="text-orange-500 mt-1" size={20} />
                            <div className="flex-1">
                                <h4 className="font-semibold text-orange-900 text-sm mb-2">Publication Schedule</h4>
                                {lesson.status === 'published' ? (
                                    <div className="space-y-1">
                                        <p className="text-sm text-orange-800 font-medium">This lesson is currently published.</p>
                                        <p className="text-xs text-orange-600">Published on {new Date(lesson.published_at || Date.now()).toLocaleString()}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="datetime-local"
                                                readOnly={role === 'viewer'}
                                                value={lesson.publish_at ? (() => {
                                                    const d = new Date(lesson.publish_at);
                                                    const offset = d.getTimezoneOffset() * 60000;
                                                    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
                                                })() : ''}
                                                onChange={(e) => role !== 'viewer' && handleLocalUpdate({ publish_at: new Date(e.target.value).toISOString(), status: 'scheduled' })}
                                                className={`px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-sm text-orange-900 focus:ring-2 focus:ring-orange-500 outline-none ${role === 'viewer' ? 'pointer-events-none opacity-60' : ''}`}
                                            />
                                            {lesson.status === 'scheduled' && (
                                                <span className="text-xs text-orange-600 font-medium px-2 py-1 bg-orange-100 rounded-full">
                                                    Scheduled
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-orange-700/80 text-xs">
                                            {lesson.publish_at
                                                ? `Will automatically publish on ${new Date(lesson.publish_at).toLocaleString()}`
                                                : 'Set a date to schedule automatic publication.'}
                                        </p>
                                        {lesson.status === 'scheduled' && (
                                            <p className="text-[10px] text-orange-600/70 italic border-t border-orange-200/50 pt-1 mt-1">
                                                Note: Clicking 'Publish Now' in the header will publish immediately, overriding this schedule.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Asset Modal */}
            {
                showAssetModal && role !== 'viewer' && (
                    <SimpleModal
                        title={`Edit ${selectedAsset?.variant} thumbnail (${selectedAsset?.lang})`}
                        onClose={() => setShowAssetModal(false)}
                        onSubmit={handleAssetUpdate}
                        placeholder="https://..."
                        label="Image URL"
                        initialValue={selectedAsset?.currentUrl}
                    />
                )
            }
        </div>
    );
}

function SimpleModal({ title, onClose, onSubmit, placeholder, label, initialValue = '' }) {
    const [val, setVal] = useState(initialValue);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(val);
            toast.success('Added successfully');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Failed to add');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input
                            autoFocus
                            type="text"
                            required
                            value={val}
                            onChange={e => setVal(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        {submitting ? 'Saving...' : 'Add'}
                    </button>
                </form>
            </div>
        </div>
    );
}
