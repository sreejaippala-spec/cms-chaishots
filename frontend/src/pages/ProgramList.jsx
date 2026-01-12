import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, Clock, Globe, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';

export default function ProgramList() {
    const { role } = useAuthStore();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, draft, published
    const [topicFilter, setTopicFilter] = useState('all');
    const [languageFilter, setLanguageFilter] = useState('all');
    const [topics, setTopics] = useState([]);
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            const [data, topicsData] = await Promise.all([
                api.get('/api/cms/programs'),
                api.get('/api/cms/topics')
            ]);
            setPrograms(data);
            setTopics(topicsData);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load programs');
        } finally {
            setLoading(false);
        }
    };

    const filteredPrograms = programs.filter(program => {
        const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
        const matchesTopic = topicFilter === 'all' || (program.topics && program.topics.includes(topicFilter));
        const matchesLanguage = languageFilter === 'all' || program.language_primary === languageFilter;
        return matchesSearch && matchesStatus && matchesTopic && matchesLanguage;
    });

    const statusColors = {
        draft: 'bg-gray-100 text-gray-700 border-gray-200',
        published: 'bg-green-50 text-green-700 border-green-200',
        archived: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Programs</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your learning paths and curriculum.</p>
                </div>
                {role !== 'viewer' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-sm active:transform active:scale-95 font-medium"
                    >
                        <Plus size={20} />
                        <span>New Program</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-2 max-w-3xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search programs by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent rounded-lg outline-none text-sm placeholder:text-gray-400"
                    />
                </div>
                <div className="h-6 w-px bg-gray-200 self-center hidden sm:block"></div>

                {/* Topic Filter */}
                <div className="relative">
                    <select
                        value={topicFilter}
                        onChange={(e) => setTopicFilter(e.target.value)}
                        className="h-full px-4 py-2.5 bg-transparent rounded-lg text-sm font-medium text-gray-600 outline-none cursor-pointer hover:bg-gray-50 appearance-none border-l border-gray-100 pl-4"
                    >
                        <option value="all">All Topics</option>
                        {topics.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {/* Language Filter */}
                <div className="relative border-l border-gray-100">
                    <select
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="h-full px-4 py-2.5 bg-transparent rounded-lg text-sm font-medium text-gray-600 outline-none cursor-pointer hover:bg-gray-50 appearance-none"
                    >
                        <option value="all">All Languages</option>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                    </select>
                </div>

                <div className="relative border-l border-gray-100 pl-2">
                    <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${statusFilter !== 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Filter size={18} />
                        <span>{statusFilter === 'all' ? 'Filter' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                    </button>

                    {showFilterMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95">
                            {['all', 'draft', 'published', 'archived'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setStatusFilter(status);
                                        setShowFilterMenu(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${statusFilter === status ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                                >
                                    <span className="capitalize">{status}</span>
                                    {statusFilter === status && <CheckCircle size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            {
                loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100"></div>
                        ))}
                    </div>
                ) : programs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No programs yet</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">Get started by creating your first learning program.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-6 text-blue-600 font-medium text-sm hover:underline"
                        >
                            Create Program
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPrograms.map((program) => (
                            <Link
                                to={`/programs/${program.id}`}
                                key={program.id}
                                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block h-full flex flex-col"
                            >
                                {/* Maintain aspect ratio */}
                                <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden group">
                                    {program.thumbnail ? (
                                        <img
                                            src={program.thumbnail}
                                            alt={program.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                                            {/* Placeholder Icon */}
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                                                <span className="text-xl font-bold uppercase text-gray-500">
                                                    {program.title.charAt(0)}
                                                </span>
                                            </div>
                                            <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                                                {program.language_primary} Program
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold border shadow-sm ${statusColors[program.status] || 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                            {program.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="mb-4 flex-1">
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                            {program.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm line-clamp-2">
                                            {program.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs font-medium text-gray-500">
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                            <Globe size={14} />
                                            <span className="uppercase">{program.language_primary}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} />
                                            <span>{new Date(program.updated_at || new Date()).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )
            }

            {
                showCreateModal && (
                    <CreateProgramModal
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={(newProg) => {
                            setPrograms([newProg, ...programs]);
                            setShowCreateModal(false);
                        }}
                    />
                )
            }
        </div >
    );
}

function CreateProgramModal({ onClose, onSuccess }) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [lang, setLang] = useState('en');
    const [availableLangs, setAvailableLangs] = useState(['en']);
    const [creating, setCreating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const data = await api.post('/api/cms/programs', {
                title,
                description: desc,
                language_primary: lang,
                languages_available: availableLangs.length > 0 ? availableLangs : [lang]
            });
            toast.success('Program created successfully!');
            onSuccess(data);
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to create program');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-900">Create New Program</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <span className="sr-only">Close</span>
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Program Title</label>
                        <input
                            autoFocus
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Master React in 30 Days"
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            rows="3"
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            placeholder="Brief overview of what students will learn..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Language</label>
                        <select
                            value={lang}
                            onChange={e => setLang(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="en">English (en)</option>
                            <option value="hi">Hindi (hi)</option>
                            <option value="es">Spanish (es)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Available Languages</label>
                        <div className="flex flex-wrap gap-2">
                            {['en', 'hi', 'es'].map(l => (
                                <label key={l} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium transition-all select-none flex items-center gap-2 ${availableLangs.includes(l) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={availableLangs.includes(l)}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setAvailableLangs([...availableLangs, l]);
                                            } else {
                                                setAvailableLangs(availableLangs.filter(Existing => Existing !== l));
                                            }
                                        }}
                                    />
                                    {l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : 'Spanish'}
                                    {availableLangs.includes(l) && <CheckCircle size={14} />}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {creating ? 'Creating...' : 'Create Program'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
