import Card from './Card';

// The 3x3 grid of location cards
const LocationsCard = ({locationsArr, serverURL}) => { //destructure locationsArr from props object
    // locationsArr is an array of location objects { _id, name }
    const toggleOpacity = (e) => {
        e.target.classList.toggle('opacity-10');
    }

    return (
        <Card title="Locations" className="p-6 h-fit mt-6 transition duration-500">
            <div className="grid grid-cols-3 gap-3">
                {locationsArr?.map((location) => (
                    <Card title={location.name} 
                        key={location._id}>
                        <div className="relative group">
                            <img className="w-auto h-auto object-cover" src={`${serverURL}/imgs/${encodeURIComponent(location.name)}.png`} alt={location.name} 
                            onClick={toggleOpacity}
                            />
                        </div>
                    </Card>
                ))}
            </div>
        </Card>
    );
};

export default LocationsCard;
