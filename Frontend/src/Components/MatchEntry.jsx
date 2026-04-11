import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Activity, Hash, Save } from 'lucide-react';
import { API } from '../App';

export default function MatchEntry() {
    const [format, setFormat] = useState('T20');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        p1i1Runs: '', p1i1Balls: '', p1i2Runs: '', p1i2Balls: '',
        p2i1Runs: '', p2i1Balls: '', p2i2Runs: '', p2i2Balls: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const p1Innings = [{ runs: Number(formData.p1i1Runs), balls: Number(formData.p1i1Balls) }];
        const p2Innings = [{ runs: Number(formData.p2i1Runs), balls: Number(formData.p2i1Balls) }];

        if (format === 'Test') {
            p1Innings.push({ runs: Number(formData.p1i2Runs), balls: Number(formData.p1i2Balls) });
            p2Innings.push({ runs: Number(formData.p2i2Runs), balls: Number(formData.p2i2Balls) });
        }

        app.post('/api/matches', async (req, res) => {
            try {
                const { format, player1, player2 } = req.body;

                // Helper function to clean the innings data
                const cleanInnings = (inningsArray) => {
                    // 1. Filter out empty innings (where user didn't type anything)
                    const validInnings = inningsArray.filter(inn => inn.runs !== "" && inn.balls !== "");

                    // 2. Convert strings to valid Numbers and calculate Strike Rate
                    return validInnings.map(inn => {
                        const runs = Number(inn.runs) || 0;
                        const balls = Number(inn.balls) || 0;
                        // Prevent dividing by zero!
                        const strikeRate = balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : 0;

                        return { runs, balls, strikeRate };
                    });
                };

                // Clean data for both players
                const cleanedP1Innings = cleanInnings(player1.innings);
                const cleanedP2Innings = cleanInnings(player2.innings);

                // Calculate Total Runs
                const p1TotalRuns = cleanedP1Innings.reduce((sum, inn) => sum + inn.runs, 0);
                const p2TotalRuns = cleanedP2Innings.reduce((sum, inn) => sum + inn.runs, 0);

                // Determine Winner automatically
                let matchWinner = "Draw";
                if (p1TotalRuns > p2TotalRuns) matchWinner = player1.name;
                if (p2TotalRuns > p1TotalRuns) matchWinner = player2.name;

                // Create the final match object matching your Schema perfectly
                const newMatch = new matchModel({
                    format: format,
                    player1: {
                        name: player1.name,
                        innings: cleanedP1Innings,
                        totalRuns: p1TotalRuns
                    },
                    player2: {
                        name: player2.name,
                        innings: cleanedP2Innings,
                        totalRuns: p2TotalRuns
                    },
                    winner: matchWinner
                });

                // Save to MongoDB
                await newMatch.save();

                // Send success back to Frontend
                res.status(200).json({ message: "Match saved successfully!", match: newMatch });

            } catch (error) {
                console.error("🔥 POST ROUTE CRASHED:", error); // This will show in Render logs!
                res.status(500).json({ message: "Internal Server Error", error: error.message });
            }
        });

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto bg-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-700 mb-32 relative"
            >
                {/* Dynamic Header */}
                <div className="bg-gradient-to-br from-pitch via-green-700 to-green-900 p-8 text-center relative overflow-hidden">
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="absolute -top-4 -right-4 opacity-10"
                    >
                        <Trophy size={120} />
                    </motion.div>
                    <h1 className="text-4xl font-black text-white tracking-tighter italic">SCORECARD</h1>
                    <p className="text-green-200 text-xs font-bold tracking-[0.2em] mt-1 uppercase">Match Tracker Pro</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Format Selector with Tab Highlight */}
                    <div className="bg-gray-900 p-1 rounded-2xl flex relative border border-gray-700">
                        {['T20', 'ODI', 'Test'].map((f) => (
                            <button
                                key={f} type="button" onClick={() => setFormat(f)}
                                className={`flex-1 py-3 rounded-xl font-black transition-all relative z-10 ${format === f ? 'text-white' : 'text-gray-500'}`}
                            >
                                {format === f && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-leather rounded-xl shadow-lg shadow-red-900/40"
                                    />
                                )}
                                <span className="relative z-20">{f}</span>
                            </button>
                        ))}
                    </div>

                    {/* Players Section */}
                    <div className="space-y-4">
                        {[
                            { id: 'p1', name: 'Ritam', color: 'text-green-400', border: 'focus:border-pitch' },
                            { id: 'p2', name: 'Riddhiman', color: 'text-blue-400', border: 'focus:border-blue-500' }
                        ].map((player) => (
                            <motion.div
                                layout
                                key={player.id}
                                className="bg-gray-700/30 p-5 rounded-3xl border border-gray-600/50 backdrop-blur-sm"
                            >
                                <h2 className={`text-xl font-black ${player.color} mb-4 flex items-center italic uppercase`}>
                                    <Trophy className="w-5 h-5 mr-2" /> {player.name}
                                </h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <InningInput label={format === 'Test' ? 'Inn 1 Runs' : 'Runs'} val={formData[`${player.id}i1Runs`]} setter={(v) => setFormData({ ...formData, [`${player.id}i1Runs`]: v })} border={player.border} />
                                    <InningInput label={format === 'Test' ? 'Inn 1 Balls' : 'Balls'} val={formData[`${player.id}i1Balls`]} setter={(v) => setFormData({ ...formData, [`${player.id}i1Balls`]: v })} border={player.border} />

                                    <AnimatePresence>
                                        {format === 'Test' && (
                                            <>
                                                <InningInput label="Inn 2 Runs" val={formData[`${player.id}i2Runs`]} setter={(v) => setFormData({ ...formData, [`${player.id}i2Runs`]: v })} border={player.border} animate />
                                                <InningInput label="Inn 2 Balls" val={formData[`${player.id}i2Balls`]} setter={(v) => setFormData({ ...formData, [`${player.id}i2Balls`]: v })} border={player.border} animate />
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Submit Area with Physics Animation */}
                    <div className="relative pt-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-pitch to-green-700 text-white font-black py-5 rounded-2xl flex items-center justify-center shadow-xl disabled:opacity-50 tracking-widest italic"
                        >
                            {isSubmitting ? 'SMASHING IT!' : <><Save className="w-6 h-6 mr-2" /> SAVE RECORD</>}
                        </motion.button>

                        {/* CRICKET ANIMATION: THE POWER SHOT */}
                        <AnimatePresence>
                            {isSubmitting && (
                                <>
                                    {/* The Bat */}
                                    <motion.div
                                        initial={{ rotate: -45, x: -100, y: 50, opacity: 0 }}
                                        animate={{ rotate: 45, x: 20, y: -20, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute -bottom-4 left-0 text-amber-100 pointer-events-none z-50"
                                    >
                                        <svg width="60" height="100" viewBox="0 0 60 100">
                                            <rect x="25" y="0" width="10" height="40" fill="#d97706" rx="2" />
                                            <rect x="15" y="40" width="30" height="60" fill="#fcd34d" rx="4" />
                                        </svg>
                                    </motion.div>

                                    {/* The Ball */}
                                    <motion.div
                                        initial={{ x: 20, y: 10, scale: 1, opacity: 1 }}
                                        animate={{ x: 600, y: -400, scale: 0.5, rotate: 720 }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                        className="absolute bottom-20 left-10 w-6 h-6 bg-leather rounded-full border-2 border-white/20 shadow-[0_0_20px_rgba(200,75,49,0.8)] z-50 flex items-center justify-center"
                                    >
                                        <div className="w-full h-0.5 bg-white/30" />
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </form>
            </motion.div>
        );
    }

    function InningInput({ label, val, setter, border, animate }) {
        const props = animate ? {
            initial: { opacity: 0, x: -10 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: 10 }
        } : {};

        return (
            <motion.div {...props}>
                <label className="text-[10px] text-gray-500 font-black uppercase block mb-1 tracking-widest">{label}</label>
                <input
                    type="number" required
                    className={`w-full bg-gray-900/80 text-white rounded-2xl p-4 border border-gray-700 outline-none transition-all font-black text-lg shadow-inner ${border}`}
                    value={val} onChange={(e) => setter(e.target.value)}
                />
            </motion.div>
        );
    }

}