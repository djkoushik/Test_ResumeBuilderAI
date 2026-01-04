import React from 'react';
import { ATSScoreResult } from '../../services/atsService';
import { AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface ScoreCardProps {
    result: ATSScoreResult;
    onFix: () => void;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ result, onFix }) => {
    const { score, breakdown, gap_analysis, metadata } = result;

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-600 dark:text-green-400';
        if (s >= 60) return 'text-orange-500 dark:text-orange-400';
        return 'text-red-500 dark:text-red-400';
    };

    const getScoreBg = (s: number) => {
        if (s >= 80) return 'bg-green-100 dark:bg-green-900/30';
        if (s >= 60) return 'bg-orange-100 dark:bg-orange-900/30';
        return 'bg-red-100 dark:bg-red-900/30';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 max-w-4xl mx-auto border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b dark:border-gray-700">
                <div className="flex flex-col items-center mb-6 md:mb-0">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 ${getScoreBg(score)} ${getScoreColor(score)} mb-4`}>
                        <span className="text-4xl font-bold">{score}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">ATS Score</h3>
                </div>

                <div className="grid grid-cols-3 gap-6 w-full md:w-auto">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{breakdown.hard_constraints}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Experience</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{breakdown.skill_match}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Skills</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{breakdown.semantic_match}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Relevance</div>
                    </div>
                </div>
            </div>

            {metadata.experience_flag && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {metadata.experience_flag}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                    <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        <XCircle className="w-5 h-5 text-red-500 mr-2" />
                        Missing Critical Skills
                    </h4>
                    {gap_analysis.critical_missing.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {gap_analysis.critical_missing.map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-full border border-red-200 dark:border-red-800">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-green-600 dark:text-green-400 text-sm">No critical skills missing! Great job.</p>
                    )}
                </div>

                <div>
                    <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        Matched Skills
                    </h4>
                    {metadata.matched_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {metadata.matched_skills.slice(0, 10).map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-full border border-green-200 dark:border-green-800">
                                    {skill}
                                </span>
                            ))}
                            {metadata.matched_skills.length > 10 && (
                                <span className="px-3 py-1 text-gray-500 text-sm">+{metadata.matched_skills.length - 10} more</span>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No matched skills found.</p>
                    )}
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={onFix}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    Fix my resume in Builder <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default ScoreCard;
