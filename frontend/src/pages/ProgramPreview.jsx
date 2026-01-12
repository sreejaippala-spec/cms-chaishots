import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Globe, BookOpen, PlayCircle, FileText } from 'lucide-react';
import { api } from '../services/api';

export default function ProgramPreview() {
    const { id } = useParams();
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgram = async () => {
            try {
                const data = await api.get(`/api/cms/programs/${id}`);
                setProgram(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProgram();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading preview...</div>;
    if (!program) return <div className="flex items-center justify-center min-h-screen text-gray-500">Program not found</div>;

    const posterUrl = program.assets?.posters?.[program.language_primary]?.landscape || program.assets?.posters?.en?.landscape;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Nav */}
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <Link to={`/programs/${id}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium">
                    <ArrowLeft size={18} /> Back to Editor
                </Link>
                <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    Student Preview Mode
                </div>
            </nav>

            <main className="max-w-4xl mx-auto py-12 px-6">
                {/* Hero Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-10">
                    <div className="aspect-video bg-gray-100 relative">
                        {posterUrl ? (
                            <img src={posterUrl} alt={program.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                                <span className="font-medium">No Cover Image</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            <span className="inline-block px-3 py-1 mb-4 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium border border-white/30 text-white">
                                {program.language_primary === 'en' ? 'English' : program.language_primary === 'hi' ? 'Hindi' : 'Spanish'}
                            </span>
                            <h1 className="text-4xl font-bold mb-3 shadow-sm">{program.title}</h1>
                            <p className="text-gray-200 text-lg max-w-2xl line-clamp-2">{program.description}</p>
                        </div>
                    </div>

                    <div className="px-8 py-6 grid grid-cols-3 gap-6 divide-x divide-gray-100">
                        <div className="flex flex-col items-center justify-center text-center p-2">
                            <span className="text-3xl font-bold text-gray-900 mb-1">{program.terms?.length || 0}</span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Modules</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center p-2">
                            <div className="flex -space-x-2 mb-2">
                                {['en', 'hi', 'es'].filter(l => program.languages_available?.includes(l)).map(l => (
                                    <div key={l} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold uppercase text-gray-500">
                                        {l}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Languages</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center p-2">
                            <span className="text-3xl font-bold text-gray-900 mb-1">{program.status === 'published' ? 'Live' : 'Draft'}</span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Status</span>
                        </div>
                    </div>
                </div>

                {/* Content List */}
                <div className="space-y-8">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-blue-600" size={24} />
                        Course Content
                    </h3>

                    <div className="space-y-6">
                        {program.terms?.map((term) => (
                            <div key={term.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                        {term.term_number}
                                    </span>
                                    <h4 className="font-bold text-gray-800 text-lg">{term.title}</h4>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {term.lessons?.map((lesson) => (
                                        <div key={lesson.id} className="p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors group cursor-not-allowed opacity-80">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                {lesson.content_type === 'video' ? <PlayCircle size={20} /> : <FileText size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-medium text-gray-900 mb-1">{lesson.title}</h5>
                                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                                    <span className="capitalize">{lesson.content_type}</span>
                                                    <span>•</span>
                                                    <span>10 mins</span>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-500">
                                                Locked
                                            </div>
                                        </div>
                                    ))}
                                    {(!term.lessons || term.lessons.length === 0) && (
                                        <div className="p-6 text-center text-gray-400 text-sm">No lessons in this term yet.</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!program.terms || program.terms.length === 0) && (
                            <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                                Content coming soon.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
