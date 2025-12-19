import { useState } from 'react';
import Card from './Card';

const PlayerCard = ({ location, role }) => {
    const [isRoleRevealed, setIsRoleRevealed] = useState(false);
    const [isLocationRevealed, setIsLocationRevealed] = useState(false);
    const isSpy = role === 'Spy';

    return (
        <Card className="p-6 h-fit flex flex-col space-y-4 transition duration-500 items-center justify-center text-center border bg-gray-200 dark:bg-gray-800">
            <span className="text-black/50 dark:text-white/50">Hover or Click to Reveal</span>
            <div className="grid grid-cols-2 gap-4">
                <span className="col-span-1 text-xl font-light text-black dark:text-white">Your role is: </span>
                <div className="col-span-1 relative cursor-pointer"
                    onMouseEnter={() => setIsRoleRevealed(true)}
                    onMouseLeave={() => setIsRoleRevealed(false)}
                    onClick={() => setIsRoleRevealed(!isRoleRevealed)}
                >
                    <div className={`transition-all duration-300 ${isRoleRevealed ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="absolute inset-0 w-32 h-8 flex items-center justify-center bg-gray-400 dark:bg-gray-700 rounded-lg">
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ${isRoleRevealed ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        <div className="flex items-center justify-center">
                            <span className={`text-xl font-bold ml-2 ${isSpy ? 'text-red-500' : 'text-blue-500 dark:text-blue-400'}`}>
                                {role}
                            </span>
                        </div>
                    </div>
                </div>
                <span className="col-span-1 text-xl font-light text-black dark:text-white">The location is: </span>
                <div className="col-span-1 relative cursor-pointer"
                    onMouseEnter={() => setIsLocationRevealed(true)}
                    onMouseLeave={() => setIsLocationRevealed(false)}
                    onClick={() => setIsLocationRevealed(!isLocationRevealed)}
                >
                    <div className={`transition-all duration-300 ${isLocationRevealed ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="absolute inset-0 w-32 h-8 flex items-center justify-center bg-gray-400 dark:bg-gray-700 rounded-lg">
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ${isLocationRevealed ? 'opacity-100' : 'opacity-0 hidden'}`}>

                        <div className="flex items-center justify-center">
                            <span className="text-xl font-bold ml-2 text-black dark:text-white">
                                {isSpy ? "???" : location}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </Card>
    );
};

export default PlayerCard;