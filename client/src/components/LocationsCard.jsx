import Card from './Card';

// The 3x3 grid of location cards
const LocationsCard = ({locationsArr, serverURL}) => { //destructure locationsArr from props object
    // Mock data for locations
    // const locations = Array(9).fill(0).map((_, i) => ({ id: i, name: `Loc ${i + 1}` }));
    // use socket to get real data
    const toggleOpacity = (e) => {
        e.target.classList.toggle('opacity-10');
    }

    return (
        <Card title="Locations" className="h-fit">
            <div className="grid grid-cols-3 gap-3">
                {locationsArr?.map((element) => (
                    <Card title={element.name} key={element._id}>
                        <div className="relative group">
                            <img className="w-auto h-auto object-cover" src={`${serverURL}/imgs/${encodeURIComponent(element.name)}.png`} alt={element.name} 
                            onClick={toggleOpacity}
                            />
                            {/* <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-75 transition-opacity flex justify-center items-center">
                                <div className="flex space-x-4">
                                    <button className="text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <button className="text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.324h5.372a.562.562 0 01.329.958l-4.26 3.06a.563.563 0 00-.182.557l1.527 4.922a.562.562 0 01-.868.621l-4.42-3.23a.563.563 0 00-.66 0l-4.42 3.23a.562.562 0 01-.868-.621l1.527-4.922a.563.563 0 00-.182-.557l-4.26-3.06a.562.562 0 01.329-.958h5.372a.563.563 0 00.475-.324L11.48 3.5z" />
                                        </svg>
                                    </button>
                                </div>
                            </div> */}
                        </div>
                    </Card>
                ))}
            </div>
        </Card>
    );
};

export default LocationsCard;
