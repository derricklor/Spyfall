
import './App.css'

import React, { useState } from 'react';



// Utility components for common styling
const Card = ({ children, title, className = "" }) => (
  <div className={`p-4 bg-gray-800 border border-gray-700 rounded-xl shadow-lg ${className}`}>
    {title && <h2 className="text-lg font-semibold mb-3 text-gray-200">{title}</h2>}
    {children}
  </div>
);


// Displays the player's location and role
const PlayerCard = ({ isSpy, location, role }) => {
  const locationText = isSpy ? 'Unknown' : location;
  const roleText = role;

  return (
    <Card className="flex flex-col items-center justify-center text-center p-6 border-2 border-indigo-500">
      <p className="text-xl font-light text-gray-400">The location is:</p>
      <div className={`text-4xl font-bold mt-1 mb-4 ${isSpy ? 'text-yellow-400' : 'text-green-400'}`}>
        {locationText}
      </div>
      
      <p className="text-xl font-light text-gray-400">Your role is:</p>
      <div className={`text-4xl font-bold mt-1 ${isSpy ? 'text-red-400' : 'text-blue-400'}`}>
        {roleText}
      </div>
    </Card>
  );
};

// The 3x3 grid of location cards
const LocationsGrid = () => {
  // Mock data for locations
  const locations = Array(9).fill(0).map((_, i) => ({ id: i, name: `Loc ${i + 1}` }));
  // use axios or fetch to get real data

  return (
    <Card title="Locations" className="h-full">
      <div className="grid grid-cols-3 gap-3">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="aspect-square bg-gray-700 hover:bg-gray-600 transition duration-150 rounded-lg flex items-center justify-center p-2 text-sm text-gray-400 cursor-pointer border border-gray-600"
            style={{ minHeight: '80px' }} // Ensures cards have a decent size
          >
            {/* Mock content for the card square */}
          </div>
        ))}
      </div>
    </Card>
  );
};

// Lobby view for joining or creating a game
const SetupPanel = ({ onStartGame }) => (
  <Card title="" className="p-6 h-full flex flex-col space-y-8">
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-300 flex items-center space-x-2">
         <span>Join Game</span>
      </h3>
      <div className="grid grid-cols-4 gap-3">
        <input type="text" maxLength="6" placeholder="000000"
          className="col-span-3 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
        <button onClick={onStartGame} className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md bg-blue-400" >
        Join
        </button>
      </div>
    </div>

    <div className="space-y-4 pt-4 border-t border-gray-700">
      <h3 className="text-xl font-semibold text-gray-300 flex items-center space-x-2">
        <span>Create Game</span>
      </h3>
      <div className="grid grid-cols-4 gap-3">
        <input type="text" placeholder="Your Name"
          className="col-span-3 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
        
        <button onClick={onStartGame} 
        className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md bg-blue-400" >
        Start
        </button>
      </div>
    </div>
  </Card>
);

// In-game control panel (players and actions)
const ControlPanel = () => {
  const players = Array(4).fill(0).map((_, i) => ({ id: i, name: `Player ${i + 1}` }));

  return (
    <div className="space-y-6">
      <Card title="Players" className="p-4">
        <ul className="space-y-2">
          {players.map(player => (
            <li key={player.id} className="flex items-center justify-between text-gray-300">
              <div className="w-1/2 h-3 bg-indigo-600 rounded-full" />
              <span className="text-sm">{player.name}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Actions" className="p-4">
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Suggest a question..."
              className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            />
            <button className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md" >
              Send
            </button>
          </div>
          <button className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md" >
            Vote
          </button>
          <button className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md" >
            End
          </button>
        </div>
      </Card>
    </div>
  );
};

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

      {/* Right Column: Locations Grid (Top) and Control Panel (Bottom) */}
      <div className="lg:col-span-2 flex flex-col space-y-6">
        
           {/* In-game control panel on large screens, side-by-side with locations */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
             <div className="flex flex-col">
               <div className="flex-grow">
                 <ControlPanel />
               </div>
             </div>
             <div className="flex-grow">
               <LocationsGrid />
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
                <SetupPanel onStartGame={onStartGame} />
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

