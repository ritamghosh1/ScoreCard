import { useState } from 'react';
import { PlusCircle, BarChart2, Users } from 'lucide-react';
import MatchEntry from './Components/MatchEntry';
import StatsDashboard from './Components/StatsDashboard';
import CompareDashboard from './Components/CompareDashboard';
import axios from 'axios';

// 1. Create the API instance (NAMED export, not default)
const isLocal = window.location.hostname === 'localhost';
export const API = axios.create({
  baseURL: isLocal 
    ? '' 
    : 'https://cricket-backend-5sha.onrender.com' 
});

// 2. The Main App Component (Keep as DEFAULT export)
export default function App() {
  const [activeTab, setActiveTab] = useState('entry');

  return (
    <div className="min-h-screen bg-gray-900 font-sans selection:bg-pitch selection:text-white pt-6 px-4 pb-24">
      
      {/* Header */}
      <h1 className="text-center text-xl font-black tracking-widest text-gray-500 mb-6 uppercase">
        {activeTab === 'entry' ? 'New Match' : activeTab === 'stats' ? 'Player Stats' : 'Head to Head'}
      </h1>

      {/* Dynamic Content Rendering */}
      {activeTab === 'entry' && <MatchEntry />}
      {activeTab === 'stats' && <StatsDashboard />}
      {activeTab === 'compare' && <CompareDashboard />}

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 pb-8 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          
          <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center transition-colors ${activeTab === 'stats' ? 'text-pitch' : 'text-gray-400 hover:text-gray-200'}`}>
            <BarChart2 className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">Stats</span>
          </button>

          <button onClick={() => setActiveTab('entry')} className={`flex flex-col items-center transition-all transform -translate-y-4 ${activeTab === 'entry' ? 'text-leather scale-110' : 'text-gray-400 hover:text-gray-200'}`}>
            <div className={`p-4 rounded-full shadow-lg ${activeTab === 'entry' ? 'bg-gray-700 border-2 border-leather' : 'bg-gray-800 border border-gray-600'}`}>
              <PlusCircle className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold mt-1">Add Score</span>
          </button>

          <button onClick={() => setActiveTab('compare')} className={`flex flex-col items-center transition-colors ${activeTab === 'compare' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-200'}`}>
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">Compare</span>
          </button>

        </div>
      </div>
    </div>
  );
}