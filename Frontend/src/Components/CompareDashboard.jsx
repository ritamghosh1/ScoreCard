import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { API } from '../App';

export default function CompareDashboard() {
  const [format, setFormat] = useState('T20');
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await API.get(`/api/compare?format=${format}`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching comparison:", error);
      }
    };
    fetchComparison();
  }, [format]);

  // Find specific players from the dynamically returned array
  const ritam = data?.comparison?.find(p => p.name === 'Ritam') || { totalRuns: 0, careerStrikeRate: 0, wins: 0 };
  const riddhiman = data?.comparison?.find(p => p.name === 'Riddhiman') || { totalRuns: 0, careerStrikeRate: 0, wins: 0 };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto mb-24">
      
      <div className="flex justify-center space-x-2 mb-8">
        {['T20', 'ODI', 'Test'].map(f => (
          <button key={f} onClick={() => setFormat(f)} className={`px-6 py-2 rounded-full font-bold transition-colors ${format === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-700 relative overflow-hidden">
        {/* Head to Head Title */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-2xl font-black text-green-400">Ritam</h2>
          <div className="bg-gray-900 p-3 rounded-full border border-gray-700"><Swords className="text-red-500 w-6 h-6" /></div>
          <h2 className="text-2xl font-black text-blue-400">Riddhiman</h2>
        </div>

        {/* Versus Bars */}
        <div className="space-y-6 relative z-10">
          <CompareBar title="Head-to-Head Wins" val1={ritam.wins} val2={riddhiman.wins} />
          <CompareBar title="Total Runs" val1={ritam.totalRuns} val2={riddhiman.totalRuns} />
          <CompareBar title="Career Strike Rate" val1={ritam.careerStrikeRate} val2={riddhiman.careerStrikeRate} />
        </div>
      </div>
    </motion.div>
  );
}

function CompareBar({ title, val1, val2 }) {
  const total = Number(val1) + Number(val2);
  // Default to 50% width if both are 0 to prevent visual bugs
  const pct1 = total === 0 ? 50 : (Number(val1) / total) * 100;
  const pct2 = total === 0 ? 50 : (Number(val2) / total) * 100;

  return (
    <div>
      <p className="text-center text-xs font-bold text-gray-400 mb-2 uppercase">{title}</p>
      <div className="flex justify-between text-sm font-bold text-white mb-1">
        <span>{val1}</span>
        <span>{val2}</span>
      </div>
      <div className="h-3 w-full flex rounded-full overflow-hidden bg-gray-900">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct1}%` }} transition={{ duration: 1, ease: "easeOut" }} className="bg-green-500 h-full"></motion.div>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct2}%` }} transition={{ duration: 1, ease: "easeOut" }} className="bg-blue-500 h-full"></motion.div>
      </div>
    </div>
  );
}