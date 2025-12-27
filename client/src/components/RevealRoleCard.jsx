import Card from './Card';

const RevealRoleCard = ({ role, location, onContinue }) => {
    const isSpy = role === 'Spy';

    return (
        <Card title="The game is about to begin!" className="p-6 mt-6 h-full flex flex-col space-y-4">
            <div className="space-y-6 pt-8 pb-8 border-t border-b border-[var(--secondary)]">
                
                {/* Role Section */}
                <div className="text-center p-4 border border-[var(--secondary)] bg-[var(--light)] dark:bg-[var(--secondary-dark)] rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-[var(--secondary-dark)] dark:text-[var(--light)]">Your Role is</h2>
                    <h1 className={`text-5xl font-bold mt-2 ${isSpy ? 'text-[var(--danger)]' : 'text-[var(--primary-dark)] dark:text-[var(--primary)]'}`}>
                        {role}
                    </h1>
                    <p className="text-[var(--secondary-dark)] dark:text-[var(--light)] mt-3 text-sm max-w-md mx-auto">
                        {isSpy 
                            ? "Blend in, avoid detection, and figure out the secret location."
                            : "Work with others to identify the Spy before they uncover the location."}
                    </p>
                </div>

                {/* Location Section */}
                <div className="text-center p-4 border border-[var(--secondary)] bg-[var(--light)] dark:bg-[var(--secondary-dark)] rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-[var(--secondary-dark)] dark:text-[var(--light)]">The Location is</h2>
                    <h1 className={`text-5xl font-bold mt-2 ${isSpy ? 'text-[var(--danger)]' : 'text-[var(--primary-dark)] dark:text-[var(--primary)]'}`}>
                        {isSpy ? "???" : location}
                    </h1>
                    <p className="text-[var(--secondary-dark)] dark:text-[var(--light)] mt-3 text-sm max-w-md mx-auto">
                        {isSpy 
                            ? "Listen carefully to the other players to guess the location." 
                            : "Be careful not to reveal the location to the Spy!"
                        }
                    </p>
                </div>
            </div>
            <button className="flex items-center justify-center lg:mx-auto lg:w-1/2 gap-2 space-x-2 py-2 px-4 rounded-3xl font-medium transition text-[var(--dark)]
                duration-200 shadow-md bg-[var(--primary)] hover:bg-[var(--primary)] hover:brightness-80 hover:cursor-pointer hover:scale-105" 
                onClick={onContinue}>
                Continue
            </button>
        </Card>
    );
};

export default RevealRoleCard;