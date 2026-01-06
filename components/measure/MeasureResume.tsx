import React, { useState } from 'react';
import { ATSScoreResult } from '../../services/atsService';
import ScoreCard from './ScoreCard';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';

interface MeasureResumeProps {
    onBack: () => void;
    onGoToBuilder: () => void;
}

const MeasureResume: React.FC<MeasureResumeProps> = ({ onBack, onGoToBuilder }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [result, setResult] = useState<ATSScoreResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            // Validate file type
            if (!selectedFile.type.includes('pdf') && !selectedFile.type.includes('word') && !selectedFile.type.includes('document')) {
                setError('Please upload a PDF or DOCX file.');
                return;
            }
            // Validate size (4MB)
            if (selectedFile.size > 4 * 1024 * 1024) {
                setError('File size must be less than 4MB.');
                return;
            }
            setError(null);
            setFile(selectedFile);
        }
    };

    const handleSubmit = async () => {
        if (!file || !jobDescription) return;

        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jobDescription);

        try {
            const response = await fetch('/api/measure-resume', {
                method: 'POST',
                body: formData,
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON Parse Error:', e);
                console.error('Response Text:', text);
                throw new Error(`Server returned invalid JSON (Status ${response.status}): ${text.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(data.error || `Server Error ${response.status}: ${data.message || 'Unknown error'}`);
            }

            setResult(data.data);
            setStep(3);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 3 && result) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
                    <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        &larr; Start New Scan
                    </button>
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        Exit
                    </button>
                </div>
                <ScoreCard result={result} onFix={onGoToBuilder} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Measure Your Resume
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Compare your resume against a job description
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">

                    {/* Stepper */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-100' : 'border-gray-300'}`}>1</div>
                            <span className="ml-2 font-medium">Upload</span>
                        </div>
                        <div className="w-16 h-1 bg-gray-200 mx-4"></div>
                        <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-100' : 'border-gray-300'}`}>2</div>
                            <span className="ml-2 font-medium">Job Description</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-500 transition-colors">
                                <div className="space-y-1 text-center">
                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <FileText className="mx-auto h-12 w-12 text-blue-500" />
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">{file.name}</p>
                                            <button
                                                onClick={() => setFile(null)}
                                                className="mt-2 text-xs text-red-500 hover:text-red-700"
                                            >
                                                Remove file
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                    <span>Upload a file</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                PDF, DOCX up to 4MB
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => file && setStep(2)}
                                disabled={!file}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next: Add Job Description
                            </button>

                            <button onClick={onBack} className="w-full flex justify-center py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                Cancel
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="jd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Job Description
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="jd"
                                        name="jd"
                                        rows={10}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-3"
                                        placeholder="Paste the job description here (Responsibilities, Requirements, Skills)..."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    The more detailed the JD, the more accurate the score.
                                </p>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!jobDescription || jobDescription.length < 50 || isLoading}
                                    className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed items-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        'Measure My Score'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeasureResume;
