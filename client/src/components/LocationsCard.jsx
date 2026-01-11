import React, { useState } from 'react';
import Card from './Card';

// The 3x3 grid of location cards
const LocationsCard = ({locationsArr, serverURL}) => { //destructure locationsArr from props object
    // locationsArr is an array of location objects { _id, name }
    const [cardOpacities, setCardOpacities] = useState({});

    const toggleLocationOpacity = (locationId) => {
        setCardOpacities(prevOpacities => ({
            ...prevOpacities,
            [locationId]: !prevOpacities[locationId]
        }));
    }

    return (
        <Card title="Locations" className="p-6 h-fit mt-6 transition duration-500">
            <div className="grid grid-cols-3 gap-3" >
                {locationsArr?.map((location) => (
                    <Card
                        title={location.name}
                        className={`hover:scale-105 transition duration-500 z-5 cursor-pointer ${cardOpacities[location._id] ? 'opacity-20' : ''}`}
                        key={location._id}
                        onClick={() => toggleLocationOpacity(location._id)}
                    >
                            <img className="w-auto h-auto object-cover" src={`${serverURL}/imgs/${encodeURIComponent(location.name)}.png`} alt={location.name} />
                    </Card>
                ))}
            </div>
        </Card>
    );
};

export default LocationsCard;
