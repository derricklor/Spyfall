
import './App.css'
import React, { useState } from 'react';

import Card from './components/Card';
import SetupCard from './components/SetupCard';
import PlayerCard from './components/PlayerCard';
import ActionsCard from './components/ActionsCard';
import LocationsCard from './components/LocationsCard';

// --- Main App Component ---
const App = () => {
    const [view, setView] = useState('lobby'); // 'lobby' or 'game'
    const [isSpy, setIsSpy] = useState(false); // Toggle for role display

    const location = 'Beach';
    const role = isSpy ? 'Spy' : 'Lifeguard';

    const onStartGame = () => setView('game');
    const onGoToLobby = () => setView('lobby');
    const onToggleRole = () => setIsSpy(prev => !prev);

    // The main layout for the game view
    const GameView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full h-full p-4 lg:p-8">
            <button
                onClick={onGoToLobby}
                className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-600 text-white 
                py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md z-10">
                Back to Lobby
            </button>
            <button
                onClick={onToggleRole}
                className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white 
                py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md z-10">
                Toggle Role
            </button>

            {/* Left Column: Player Card (Location/Role Display) */}
            <div className="lg:col-span-1 flex flex-col space-y-6">
                <PlayerCard isSpy={isSpy} location={location} role={role} />
            </div>

            {/* Middle/Right Column: action card (middle) and Locations card (right) */}
            <div className="lg:col-span-2 flex flex-col space-y-6">

                {/* In-game control panel on large screens, side-by-side with locations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <div className="flex flex-col">
                        <div className="flex-grow">
                            <ActionsCard />
                        </div>
                    </div>
                    <div className="flex-grow">
                        <LocationsCard />
                    </div>
                </div>


            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4">
            {/* Global Style and Theme Setup */}
            <style>{`
        /* Custom scrollbar for a darker theme */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1f2937; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}</style>

            <main className="w-full max-w-6xl h-[90vh] flex flex-col">


                <section className="flex-grow overflow-auto rounded-b-xl">
                    {view === 'lobby' ? (
                        <div className="p-8 h-full flex items-center justify-center">
                            <div className="w-full max-w-md">
                                <SetupCard onStartGame={onStartGame} />
                            </div>
                        </div>
                    ) : (
                        <GameView />
                    )}
                </section>
            </main>


        </div>
    );
};

export default App;

