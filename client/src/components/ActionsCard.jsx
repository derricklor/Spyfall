import Card from './Card';

// In-game control panel (players and actions)
const ActionsCard = ({timeLeft, playerList}) => {
    // Mock data for players, replace with real data from socket
    //const players = Array(4).fill(0).map((_, i) => ({ id: i, name: `Player ${i + 1}` }));
    return (
        <div className="space-y-6">
            <Card title="Players" className="p-4">
                <ul className="space-y-2">
                    {playerList.map((player, index) => (
                        <li key={index} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                            <span className="text-sm">{ player.isHost ? 'Host '+ player.name : player.name}</span>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card title="Actions" className="p-4">
                <div className="space-y-3">
                    <div className="flex space-x-2">
                        <p className="text-black dark:text-white">{timeLeft}</p>
                        <input
                            type="text"
                            placeholder="Suggest a question..."
                            className="flex-grow p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white text-sm"
                        />
                        <button className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md" >
                            Send
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ActionsCard;