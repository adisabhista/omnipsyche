"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface AnalysisResultProps {
    markdown: string;
    isLoading: boolean;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ markdown, isLoading }) => {
    if (isLoading) {
        return (
            <div className="w-full p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-cyan-500/30 flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-r-4 border-purple-500 rounded-full animate-spin reverse"></div>
                    <div className="absolute inset-4 border-b-4 border-pink-500 rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-cyan-400 font-mono animate-pulse text-lg">
                    MENYUSUN DATA PSIKE...
                </p>
                <p className="text-xs text-gray-500 mt-2">Menghubungkan ke inti analisis</p>
            </div>
        );
    }

    if (!markdown) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full p-8 rounded-2xl bg-black/60 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)]"
        >
            <div className="prose prose-invert prose-cyan max-w-none">
                <ReactMarkdown
                    components={{
                        h1: (props) => (
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-8" {...props} />
                        ),
                        h2: (props) => (
                            <h2 className="text-2xl font-semibold text-cyan-300 mt-8 mb-4 flex items-center gap-2" {...props} />
                        ),
                        strong: (props) => (
                            <strong className="text-purple-300 font-bold" {...props} />
                        ),
                        li: (props) => (
                            <li className="text-gray-300 my-1" {...props} />
                        ),
                        p: (props) => (
                            <p className="text-gray-300 leading-relaxed mb-4" {...props} />
                        ),
                        hr: (props) => (
                            <hr className="hidden border-none" {...props} />
                        ),
                    }}
                >
                    {markdown}
                </ReactMarkdown>
            </div>
        </motion.div>
    );
};

export default AnalysisResult;
