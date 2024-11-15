import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import VideoJS from "../../components/Videojs";
import ChatBox from "../../components/ChatBox";
import { FaUserFriends, FaCopy } from "react-icons/fa";
import { useLogin } from "../../contexthelp/LoginContext";
import NavBar from "../../components/NavBar";

const VideoPlayer = () => {
  const { id, roomId } = useParams();
  const [video, setVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [watchPartyUrl, setWatchPartyUrl] = useState("");
  const [showChat, setShowChat] = useState(true);

  const { isLog, user } = useLogin()

  useEffect(() => {
    fetchVideo(id);
  }, [id]);

  const fetchVideo = (videoId) => {
    // Simulating API call
    setTimeout(() => {
      setVideo({
        id: videoId,
        title: "Epic Gaming Moments",
        videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
      });
      setIsLoading(false);
    }, 1000);
  };
  const chatRoomId = Math.random().toString(36).substring(2, 8);
  const startWatchParty = () => {
    const partyId = Math.random().toString(36).substring(2, 8);
    const url = `${window.location.origin}/video/${id}/${chatRoomId}`;
    setWatchPartyUrl(url);
    // Show chat component by setting a state
    setShowChat(true); // New state to control chat visibility

    fetchVideo(id);
  };

  const copyWatchPartyUrl = () => {
    navigator.clipboard.writeText(watchPartyUrl);
    alert("Watch party link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const videoJsOptions = {
    // autoplay: true,
    controls: true,
    responsive: true,
    preload: "auto",
    poster: "/action3.jpg",
    fluid: true,
    // currentTime: true,
    sources: [{
      src: video.videoUrl,
      type: 'video/mp4'
    }]
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white min-h-screen">
      <NavBar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-3/4 flex flex-col">
            {/* Ensure video is loaded before rendering VideoJS */}
            {video && (
              <div className="aspect-w-16 aspect-h-9 bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                <VideoJS options={videoJsOptions} roomId={chatRoomId} />
              </div>
            )}
            <div className="mt-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold">{video.title}</h1>
              <div>
                {watchPartyUrl ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={watchPartyUrl}
                      readOnly
                      className="bg-gray-700 text-white px-3 py-2 rounded-l-md"
                    />
                    <button
                      onClick={copyWatchPartyUrl}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r-md transition duration-300 ease-in-out"
                    >
                      <FaCopy />
                    </button>
                  </div>
                ) : (
                  <>
                    {!roomId && (
                      <button
                        onClick={startWatchParty}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 transition duration-300 ease-in-out"
                      >
                        <FaUserFriends />
                        <span>Watch with Friends</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {showChat && video && ( // Ensure video is loaded before rendering ChatBox
            <div className="bg-gray-800 rounded-lg overflow-hidden h-[calc(100vh-2rem)] lg:h-[600px] flex flex-col lg:w-1/4"> {/* Adjust width for chat */}
              {!isLog ? (
                <h2 className="flex h-full w-full px-[20px] justify-center items-center">please,Login First to join the Live Chat!!</h2>
              ) : (
                <ChatBox chatRoomId={chatRoomId} user={user.name} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VideoPlayer;