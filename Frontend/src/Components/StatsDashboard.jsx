import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Target, Award } from 'lucide-react';
import { API } from '../App';

export default function StatsDashboard() {
  const [player, setPlayer] = useState('Ritam');
  const [format, setFormat] = useState('T20');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await API.get(`/api/stats/${player}?format=${format}`);
        setStats(response.data.stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, [player, format]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mb-24">
      
      {/* Top Controls */}
      <div className="bg-gray-800 rounded-3xl p-4 shadow-xl border border-gray-700 mb-6 flex justify-between items-center">
        <select className="bg-gray-900 text-white font-bold p-2 rounded-xl outline-none border border-gray-600 focus:border-pitch" value={player} onChange={(e) => setPlayer(e.target.value)}>
          <option value="Ritam">Ritam</option>
          <option value="Riddhiman">Riddhiman</option>
        </select>
        <div className="flex space-x-2 border border-gray-600 rounded-xl overflow-hidden">
          {['T20', 'ODI', 'Test'].map(f => (
            <button key={f} onClick={() => setFormat(f)} className={`px-4 py-2 font-bold text-sm transition-colors ${format === f ? 'bg-pitch text-white' : 'bg-gray-900 text-gray-400'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Display */}
      {stats ? (
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Runs" value={stats.totalRuns} icon={<Activity className="text-blue-400 w-6 h-6" />} delay={0.1} />
          <StatCard title="Matches" value={stats.matchesPlayed} icon={<Target className="text-purple-400 w-6 h-6" />} delay={0.2} />
          <StatCard title="Strike Rate" value={stats.careerStrikeRate} icon={<Zap className="text-yellow-400 w-6 h-6" />} delay={0.3} />
          <StatCard title="Average" value={stats.average} icon={<Award className="text-green-400 w-6 h-6" />} delay={0.4} />
          
          {/* Spans full width */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="col-span-2 bg-linear-to-r from-gray-800 to-gray-700 p-4 rounded-2xl border border-gray-600 flex justify-around">
            <div className="text-center">
              <p className="text-gray-400 text-xs font-bold uppercase">Centuries (100s)</p>
              <p className="text-3xl font-black text-white">{stats.centuries}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs font-bold uppercase">Half Centuries (50s)</p>
              <p className="text-3xl font-black text-white">{stats.half_centuries}</p>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-10 font-bold">Loading Stats...</div>
      )}
    </motion.div>
  );
}

function StatCard({ title, value, icon, delay }) {
  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay }} className="bg-gray-800 p-4 rounded-2xl border border-gray-700 flex flex-col justify-between h-28 shadow-lg">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
    </motion.div>
  );
}