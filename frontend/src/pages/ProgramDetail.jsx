import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Image as ImageIcon, Eye, MoreVertical, FileText, Video, Trash2, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';

export default function ProgramDetail() {
    const { role } = useAuthStore();
    const { id } = useParams();
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('content');
    const [showTermModal, setShowTermModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [selectedTermId, setSelectedTermId] = useState(null);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null); // { lang, variant, currentUrl }

    const handleAssetUpdate = async (url) => {
        const { lang, variant } = selectedAsset;
        // Clone assets safely
        const newAssets = JSON.parse(JSON.stringify(program.assets || {}));
        if (!newAssets.posters) newAssets.posters = {};
        if (!newAssets.posters[lang]) newAssets.posters[lang] = {};

        newAssets.posters[lang][variant] = url;

        await handleUpdate({ assets: newAssets });
        setShowAssetModal(false);
    };

    const [allTopics, setAllTopics] = useState([]);

    const fetchProgram = useCallback(async () => {
        try {
            const [progData, topicsData] = await Promise.all([
                api.get(`/api/cms/programs/${id}`),
                api.get('/api/cms/topics')
            ]);
            setProgram(progData);
            setAllTopics(topicsData);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load program');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProgram();
    }, [fetchProgram]);

    const handleUpdate = async (updates) => {
        try {
            const updated = await api.patch(`/api/cms/programs/${id}`, updates);
            setProgram(prev => ({ ...prev, ...updated }));
            toast.success('Saved changes');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save changes');
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-500">Loading program...</div>;
    if (!program) return <div className="text-center py-20 text-gray-500">Program not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-16 bg-gray-50 z-10 py-4 -my-4 px-1">
                <div className="flex items-center gap-4">
                    <Link to="/programs" className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{program.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="uppercase font-medium bg-gray-200 px-1.5 py-0.5 rounded text-xs">
                                {program.language_primary}
                            </span>
                            <span>•</span>
                            <span className={program.status === 'published' ? 'text-green-600' : 'text-gray-500'}>
                                {program.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link to={`/preview/${id}`} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors">
                        <Eye size={18} /><span>Preview</span>
                    </Link>
                    {role !== 'viewer' && (
                        <>
                            <button
                                onClick={() => {
                                    const hasPoster = program.assets?.posters?.[program.language_primary]?.portrait;
                                    if (!hasPoster) {
                                        toast.error('Cannot publish: Missing portrait poster for primary language.');
                                        return;
                                    }
                                    handleUpdate({ status: 'published' });
                                }}
                                disabled={program.status === 'published'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-md font-medium transition-colors ${program.status === 'published' ? 'bg-green-100 text-green-700 cursor-default shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                <CheckCircle size={18} /><span>{program.status === 'published' ? 'Published' : 'Publish'}</span>
                            </button>
                            <button
                                onClick={() => handleUpdate({ status: 'archived' })}
                                disabled={program.status === 'archived'}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-medium transition-colors ${program.status === 'archived' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default' : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'}`}
                            >
                                <Trash2 size={18} />
                                <span>{program.status === 'archived' ? 'Archived' : 'Archive'}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {['content', 'assets', 'details'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'details' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Program Title</label>
                                <input
                                    type="text"
                                    defaultValue={program.title}
                                    readOnly={role === 'viewer'}
                                    onBlur={(e) => role !== 'viewer' && handleUpdate({ title: e.target.value })}
                                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${role === 'viewer' ? 'bg-gray-100 text-gray-500' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    defaultValue={program.description}
                                    readOnly={role === 'viewer'}
                                    onBlur={(e) => role !== 'viewer' && handleUpdate({ description: e.target.value })}
                                    rows={4}
                                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${role === 'viewer' ? 'bg-gray-100 text-gray-500' : ''}`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Language</label>
                                    <select
                                        defaultValue={program.language_primary}
                                        disabled={role === 'viewer'}
                                        onChange={(e) => handleUpdate({ language_primary: e.target.value })}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white ${role === 'viewer' ? 'bg-gray-100 text-gray-500' : ''}`}
                                    >
                                        <option value="en">English</option>
                                        <option value="hi">Hindi</option>
                                        <option value="es">Spanish</option>

                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Topics</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(program.topics || []).map(topic => (
                                            <span key={topic} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm border border-blue-100 flex items-center gap-1">
                                                {topic}
                                                {role !== 'viewer' && (
                                                    <button
                                                        onClick={() => {
                                                            const next = program.topics.filter(t => t !== topic);
                                                            handleUpdate({ topics: next });
                                                        }}
                                                        className="hover:text-blue-900"
                                                    >
                                                        &times;
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                    {role !== 'viewer' && (
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="Add topic..."
                                                list="topics-list"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = e.target.value.trim();
                                                        if (val && !program.topics?.includes(val)) {
                                                            handleUpdate({ topics: [...(program.topics || []), val] });
                                                            e.target.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <datalist id="topics-list">
                                                {allTopics.map(t => (
                                                    <option key={t.id} value={t.name} />
                                                ))}
                                            </datalist>
                                            <p className="text-xs text-gray-400 mt-1">Press Enter to add. New topics will be created.</p>
                                        </div>
                                    )}
                                </div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Available Languages</label>
                                <div className="flex flex-wrap gap-2">
                                    {['en', 'hi', 'es'].map(lang => (
                                        <label
                                            key={lang}
                                            className={`
                                                cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium transition-all select-none flex items-center gap-2
                                                ${program.languages_available?.includes(lang)
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }
                                                ${role === 'viewer' ? 'pointer-events-none opacity-80' : ''}
                                            `}
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={program.languages_available?.includes(lang) || false}
                                                onChange={(e) => {
                                                    const current = program.languages_available || [];
                                                    const next = e.target.checked
                                                        ? [...current, lang]
                                                        : current.filter(l => l !== lang);
                                                    handleUpdate({ languages_available: next });
                                                }}
                                            />
                                            {lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Spanish'}
                                            {program.languages_available?.includes(lang) && <CheckCircle size={14} />}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'assets' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {(program.languages_available || [program.language_primary]).map((lang) => {
                            const variants = program.assets?.posters?.[lang] || {};
                            return (
                                <div key={lang} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <span className="uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-200">{lang}</span>
                                        Marketing Assets
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        {['portrait', 'landscape', 'square'].map(variant => (
                                            <div key={variant} className="space-y-3 group">
                                                <div className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                    {variant}
                                                    {role !== 'viewer' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAsset({ lang, variant, currentUrl: variants[variant] });
                                                                setShowAssetModal(true);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 text-blue-600 hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="aspect-[3/4] data-[variant=landscape]:aspect-video data-[variant=square]:aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 hover:border-blue-400 transition-colors cursor-pointer relative overflow-hidden">
                                                    {variants[variant] ? (
                                                        <img src={variants[variant]} alt={variant} className="absolute inset-0 w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <ImageIcon className="mx-auto h-8 w-8 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                            <span className="mt-2 block text-xs text-gray-500">Upload</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Curriculum</h3>
                            {role !== 'viewer' && (
                                <button
                                    onClick={() => setShowTermModal(true)}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus size={16} /> Add Term
                                </button>
                            )}
                        </div>

                        <div className="space-y-6">
                            {program.terms?.map((term) => (
                                <div key={term.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50/80 px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                        <div className="font-semibold text-gray-900 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                                                {term.term_number}
                                            </span>
                                            {term.title}
                                        </div>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {term.lessons?.map((lesson) => (
                                            <div key={lesson.id} className="group px-6 py-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 flex justify-center">
                                                        {lesson.content_type === 'video' ? <Video size={18} className="text-blue-500" /> : <FileText size={18} className="text-orange-500" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{lesson.title}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5 capitalize flex items-center gap-2">
                                                            {lesson.lesson_number}. {lesson.content_type}
                                                            {lesson.status !== 'published' && (
                                                                <span className="bg-gray-100 text-gray-600 px-1.5 rounded text-[10px] uppercase font-bold border border-gray-200">{lesson.status}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {role !== 'viewer' && (
                                                    <Link
                                                        to={`/lessons/${lesson.id}`}
                                                        className="opacity-0 group-hover:opacity-100 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        Edit Lesson
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                        <div className="p-2">
                                            {role !== 'viewer' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedTermId(term.id);
                                                        setShowLessonModal(true);
                                                    }}
                                                    className="w-full py-3 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 font-medium"
                                                >
                                                    <Plus size={16} /> Add Lesson to {term.title}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!program.terms || program.terms.length === 0) && (
                                <div className="text-center py-16 text-gray-500 bg-white rounded-3xl border border-dashed border-gray-300">
                                    <p className="mb-4">No content yet.</p>
                                    {role !== 'viewer' && (
                                        <button
                                            onClick={() => setShowTermModal(true)}
                                            className="text-blue-600 font-medium hover:underline"
                                        >
                                            Create your first Term
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {
                showTermModal && (
                    <SimpleModal
                        title="Add New Term"
                        onClose={() => setShowTermModal(false)}
                        onSubmit={async (val) => {
                            await api.post(`/api/cms/programs/${id}/terms`, { title: val });
                            fetchProgram();
                        }}
                        placeholder="e.g. Week 1: Introduction"
                        label="Term Title"
                    />
                )
            }
            {
                showLessonModal && (
                    <SimpleModal
                        title="Add New Lesson"
                        onClose={() => setShowLessonModal(false)}
                        onSubmit={async (val) => {
                            await api.post(`/api/cms/terms/${selectedTermId}/lessons`, { title: val, content_type: 'video' });
                            fetchProgram();
                        }}
                        placeholder="e.g. Installing Node.js"
                        label="Lesson Title"
                    />
                )
            }

            {
                showAssetModal && role !== 'viewer' && (
                    <SimpleModal
                        title={`Edit ${selectedAsset?.lang} - ${selectedAsset?.variant}`}
                        onClose={() => setShowAssetModal(false)}
                        onSubmit={handleAssetUpdate}
                        placeholder="https://..."
                        label="Image URL"
                        initialValue={selectedAsset?.currentUrl}
                    />
                )
            }
        </div >
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
