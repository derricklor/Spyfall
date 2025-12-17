import Card from './Card';

const RevealRoleCard = ({ role, location, onContinue }) => {
    const isSpy = role === 'Spy';

    return (
        <Card title="The game is about to begin!" className="p-6 mt-6 h-full flex flex-col space-y-4">
            <div className="space-y-6 pt-4 pb-8 border-t border-b border-gray-500 dark:border-gray-700">
                
                {/* Role Section */}
                <div className="text-center p-4 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Your Role is</h2>
                    <h1 className={`text-5xl font-bold mt-2 ${isSpy ? 'text-red-500' : 'text-blue-500 dark:text-blue-400'}`}>
                        {role}
                    </h1>
                    <p className="text-gray-700 dark:text-gray-300 mt-3 text-sm max-w-md mx-auto">
                        {isSpy 
                            ? "Blend in, avoid detection, and figure out the secret location."
                            : "Work with others to identify the Spy before they uncover the location."}
                    </p>
                </div>

                {/* Location Section */}
                <div className="text-center p-4 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">The Location is</h2>
                    <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-200 mt-2">
                        {isSpy ? "???" : location}
                    </h1>
                    <p className="text-gray-700 dark:text-gray-300 mt-3 text-sm max-w-md mx-auto">
                        {isSpy 
                            ? "Listen carefully to the other players to guess the location." 
                            : "Be careful not to reveal the location to the Spy!"
                        }
                    </p>
                </div>
            </div>
            <button className="flex items-center justify-center gap-2 space-x-2 py-2 px-4 rounded-3xl font-medium transition 
            duration-200 shadow-md bg-blue-500 hover:bg-blue-600 hover:cursor-pointer hover:scale-105" 
            onClick={onContinue}>Continue</button>


        </Card>
    );
};

export default RevealRoleCard;