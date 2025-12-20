import { useState } from 'react';
import Card from './Card';

const PlayerCard = ({ location, role }) => {
    const [isRoleRevealed, setIsRoleRevealed] = useState(false);
    const [isLocationRevealed, setIsLocationRevealed] = useState(false);
    const isSpy = role === 'Spy';

    return (
        <Card className="p-6 h-fit flex flex-col space-y-4 transition duration-500 items-center justify-center text-center">
            <span className="text-[var(--dark)]/50 dark:text-[var(--light)]/50">Hover or Click to Reveal</span>
            <div className="grid grid-cols-2 gap-4">
                <span className="col-span-1 text-xl font-light text-[var(--dark)] dark:text-[var(--light)]">Your role is: </span>
                <div className="col-span-1 relative cursor-pointer"
                    onMouseEnter={() => setIsRoleRevealed(true)}
                    onMouseLeave={() => setIsRoleRevealed(false)}
                    onClick={() => setIsRoleRevealed(!isRoleRevealed)}
                >
                    <div className={`transition-all duration-300 ${isRoleRevealed ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--secondary)] dark:bg-[var(--secondary-dark)] rounded-lg">
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ${isRoleRevealed ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        <div className="flex items-center justify-center">
                            <span className={`text-xl font-bold ml-2 ${isSpy ? 'text-[var(--danger)]' : 'text-[var(--primary-dark)] dark:text-[var(--primary)]'}`}>
                                {role}
                            </span>
                        </div>
                    </div>
                </div>
                <span className="col-span-1 text-xl font-light text-[var(--dark)] dark:text-[var(--light)]">The location is: </span>
                <div className="col-span-1 relative cursor-pointer"
                    onMouseEnter={() => setIsLocationRevealed(true)}
                    onMouseLeave={() => setIsLocationRevealed(false)}
                    onClick={() => setIsLocationRevealed(!isLocationRevealed)}
                >
                    <div className={`transition-all duration-300 ${isLocationRevealed ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--secondary)] dark:bg-[var(--secondary-dark)] rounded-lg">
                        </div>
                    </div>

                    <div className={`transition-all duration-300 ${isLocationRevealed ? 'opacity-100' : 'opacity-0 hidden'}`}>

                        <div className="flex items-center justify-center">
                            <span className="text-xl font-bold ml-2 text-[var(--dark)] dark:text-[var(--light)]">
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