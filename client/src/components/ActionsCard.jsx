import Card from './Card';

// In-game control panel (players and actions)
const ActionsCard = (timeLeft) => {
    const players = Array(4).fill(0).map((_, i) => ({ id: i, name: `Player ${i + 1}` }));
    // Mock data for players, replace with real data from socket
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
                        <p className="text-black">{timeLeft}</p>
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

export default ActionsCard;