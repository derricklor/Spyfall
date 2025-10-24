import Card from './Card';

// Lobby view for joining or creating a game
const SetupCard = ({ onStartGame }) => {
    return (
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
    )
};

export default SetupCard;
