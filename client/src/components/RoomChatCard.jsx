import Card from './Card';
import { React, useRef, useEffect } from 'react';

const RoomChatCard = ({roomChat, sendChatMessage}) => {
    const chatContainerRef = useRef(null);

    // function to handle sending chat message on enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            sendChatMessage(e.target.value.trim());
            e.target.value = ''; // clear input field
        }
    };

    useEffect(() => {
        //auto scroll to bottom of chat when new message arrives
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }

    }, [roomChat]);

    return (
        <Card title="Room Chat" className="p-6 mt-6 h-full flex flex-col space-y-4 transition duration-500">
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto mb-4 h-96">
                {roomChat.map((msg, index) => (
                    <div key={index} className="mb-2">
                        <span className="font-semibold text-[var(--dark)] dark:text-[var(--light)]">{msg}</span>
                    </div>
                ))}
            </div>
            <input type="text" className="font-semibold bg-[var(--light)] dark:bg-[var(--secondary-dark)] text-[var(--dark)] dark:text-[var(--light)]
                border border-[var(--secondary)] rounded-lg " placeholder=' ...' maxLength={70}
                onKeyDown={handleKeyPress} />
        </Card>
        );
}

export default RoomChatCard;
