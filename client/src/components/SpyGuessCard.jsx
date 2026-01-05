import Card from './Card';
import { useState, useContext } from 'react';
import PlayerContext from '../contexts/PlayerContext';

const SpyGuessCard = ({ locationsArr, onSpyGuessLocation, onClose }) => {
    //onSpyGuessLocation takes (roomCode, playerCode, guessedLocation)
    const playerContextObj = useContext(PlayerContext); // roomCode, playerCode, playerName, role
    const [selectedLocationID, setSelectedLocationID] = useState(null);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-10">
            <Card title="Guess the location" className="p-6 mt-6 w-fit h-fit flex flex-col space-y-4">
                <div className="space-y-6 pt-8 pb-8 border-t border-b border-[var(--secondary)]">
                    <div className="grid grid-cols-3 gap-3">
                        {locationsArr?.map((location) => (
                            <Card title={location.name}
                                key={location._id}
                                className={`cursor-pointer ${selectedLocation === location._id ? 'border-4 border-[var(--primary)]' : ''}`}
                                onClick={() => setSelectedLocationID(location._id)}>
                                <div className="relative group">
                                    <img className="w-auto h-auto object-cover" src={`${serverURL}/imgs/${encodeURIComponent(location.name)}.png`} alt={location.name}
                                        onClick={toggleOpacity}
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>
                    <button
                        disabled={!selectedLocation}
                        className={`flex items-center justify-center lg:mx-auto lg:w-1/2 gap-2 space-x-2 py-2 px-4 rounded-3xl font-medium transition text-[var(--dark)]
                        duration-200 shadow-md ${selectedLocation ? 'bg-[var(--primary)] hover:bg-[var(--primary)] hover:brightness-80 hover:cursor-pointer hover:scale-105' 
                            : 'bg-[var(--light)] dark:bg-[var(--secondary-dark)] border border-[var(--secondary)] cursor-not-allowed hover:scale-95'}`}
                        onClick={() => {
                            if (selectedLocationID) {
                                onSpyGuessLocation(playerContextObj.roomCode, playerContextObj.playerCode, selectedLocationID);
                                onClose;
                            }return;}}>
                        Submit Guess
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>

                    </button>
                    <button
                        className="flex items-center justify-center lg:mx-auto lg:w-1/2 gap-2 space-x-2 py-2 px-4 rounded-3xl font-medium transition text-[var(--dark)]
                        duration-200 shadow-md bg-[var(--light)] dark:bg-[var(--secondary-dark)] border border-[var(--secondary)] hover:scale-105"
                        onClick={()=> onClose}>
                        Cancel
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>

                    </button>
                </div>
            </Card>
        </div>
    )
};

export default SpyGuessCard;