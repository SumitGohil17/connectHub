import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import { FaPaperPlane, FaSmile } from 'react-icons/fa';
import { useParams } from 'react-router-dom'; // Assuming you're using react-router
const socket = io('http://localhost:5001', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

const ChatBox = ({chatRoomId, user}) => {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomId, setRoomId] = useState(chatRoomId);
  const [userName, setUserName] = useState(user);
  const [messages1, setMessages1] = useState([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  

  // const handleSendMessage = (e) => {
  //   e.preventDefault();
  //   if (inputMessage.trim()) {
  //     const newMessage = {
  //       id: Date.now(),
  //       text: inputMessage,
  //       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  //     };
  //     setMessages([...messages, newMessage]);
  //     setInputMessage('');
  //   }
  // };

  const {roomId: urlRoomId } = useParams(); // Assuming you're using react-router

  useEffect(() => {
    if (urlRoomId) {
      setRoomId(urlRoomId);
      setUserName(user); // Set a default user name if not provided
      // setTimeout(() => {
      //   joinRoom();
      // }, 2000); // Set roomId from URL
    }
  }, [urlRoomId]);

  useEffect(() => {
    if (chatRoomId && user) {
      setRoomId(chatRoomId);
      setUserName(user);
      joinRoom();
    }
  }, [chatRoomId, user]);

  const joinRoom = () => {
    if (chatRoomId && user) {
      socket.emit('joinRoom', { 
        roomId: chatRoomId, 
        userName: user 
      });
      setIsInRoom(true);
    }
  };

  // const createRoom = () => {
  //   const newRoomId = generateRandomRoomId();
  //   setRoomId(newRoomId); // Set the generated room ID
  //   alert(`Your room ID is: ${newRoomId}`); // Display the room ID to the user
  // };

  useEffect(() => {
    socket.on('chat', (msg) => {
      setMessages1((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('previousMessages', (previousMessages) => {
      setMessages1(previousMessages); // Set previous messages when joining a room
    });

    socket.on('userList', (userList) => {
      setUsers(userList);
    });

    return () => {
      socket.off('chat');
      socket.off('previousMessages');
      socket.off('userList');
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit('chat', { roomId, msg: input, userName }); // Include userName in the message
      setInput('');
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`flex flex-col ${isMinimized ? 'h-12' : 'h-full'} bg-gray-900 rounded-lg overflow-hidden transition-all duration-300`}>
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex justify-between items-center cursor-pointer" onClick={toggleMinimize}>
        <h2 className="text-xl font-bold text-white">Live Chat</h2>
        <button className="text-white">
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-grow overflow-y-auto p-4 space-y-2">
            {messages1.map((message, index) => (
              <div key={index} className={`flex  ${message.userName === userName ? 'justify-end' : 'justify-start'}`}>
                <div className="bg-purple-500 rounded-2xl rounded-tr-none px-4 py-2 max-w-xs">
                  <p className="text-white text-[8px]">{message.userName}</p>
                  <p className="text-white text-sm">{message.msg}</p>
                  <p className="text-xs text-purple-200 mt-1 text-right">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="p-4 bg-gray-800 flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="ml-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-2 transition"
            >
              <FaPaperPlane className="w-5 h-5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;