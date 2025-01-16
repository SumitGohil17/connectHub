import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ChatBox from "../../components/ChatBox";
import { FaUserFriends, FaCopy, FaVideo, FaKeyboard } from "react-icons/fa";
import { useLogin } from "../../contexthelp/LoginContext";
import NavBar from "../../components/NavBar";
import VideoSegments from '../../components/VideoSegments/VideoSegments';
import VideoCall from '../../components/VideoCall';
import { io } from "socket.io-client";
const socket = io('http://localhost:5001', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});



const VideoPlayer = () => {
  const { id, roomId } = useParams();
  const [video, setVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [watchPartyUrl, setWatchPartyUrl] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [playerRef, setPlayerRef] = useState(null);
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const [shortVideo, setShortVideo] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(roomId || Math.random().toString(36).substring(2, 8));

  const { isLog, user } = useLogin()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [isMeetingHost, setIsMeetingHost] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [showMeetingInfo, setShowMeetingInfo] = useState(false);
  const meetingLinkRef = useRef(null);
  const [showMeetingOptions, setShowMeetingOptions] = useState(true);
  const [meetingMode, setMeetingMode] = useState(false);
  const [isInCall, setIsInCall] = useState(true);

  useEffect(() => {
    fetchVideo(id);
  }, [id]);

  useEffect(() => {
    if (!isLog && (showChat || watchPartyUrl)) {
      setShowLoginPrompt(true);
    }
  }, [isLog, showChat, watchPartyUrl]);

  useEffect(() => {
    if (isLog) {
      socket.on("join-request", ({ userId, roomId }) => {
        console.log("Received join request:", { userId, roomId });
        setJoinRequests(prev => [...prev, { userId, roomId }]);
      });

      return () => {
        socket.off("join-request");
      };
    }
  }, [isLog]);

  useEffect(() => {
    if (roomId) {
      setChatRoomId(roomId);
      socket.emit("check-host", { roomId, userId: socket.id });
    }
  }, [roomId]);

  useEffect(() => {
    socket.on("host-status", ({ isHost }) => {
      setIsMeetingHost(isHost);
    });

    if (isLog) {
      socket.on("join-request", ({ userId, userName, roomId }) => {
        console.log("Received join request:", { userId, userName, roomId });
        setJoinRequests(prev => [...prev, { userId, userName, roomId }]);
      });
    }

    return () => {
      socket.off("join-request");
      socket.off("host-status");
    };
  }, [isLog, roomId]);

  useEffect(() => {
    const savedMeetingState = localStorage.getItem('meetingState');
    if (savedMeetingState) {
      const { 
        savedChatRoomId, 
        savedIsMeetingHost, 
        savedMeetingMode,
        savedIsInCall,
        savedUserName 
      } = JSON.parse(savedMeetingState);

      setChatRoomId(savedChatRoomId);
      setIsMeetingHost(savedIsMeetingHost);
      setMeetingMode(savedMeetingMode);
      setIsInCall(savedIsInCall);
      setShowMeetingOptions(false);

      if (savedIsMeetingHost) {
        socket.emit("request-to-join", {
          roomId: savedChatRoomId,
          userId: socket.id,
          userName: user?.name
        });
      } else {
        socket.emit('joinRoom', { 
          roomId: savedChatRoomId, 
          userName: user?.name 
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (meetingMode) {
      localStorage.setItem('meetingState', JSON.stringify({
        savedChatRoomId: chatRoomId,
        savedIsMeetingHost: isMeetingHost,
        savedMeetingMode: meetingMode,
        savedIsInCall: isInCall
      }));
    } else {
      localStorage.removeItem('meetingState');
    }
  }, [chatRoomId, isMeetingHost, meetingMode, isInCall]);

  const fetchVideo = async (videoId) => {
    try {
      const response = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.REACT_APP_YT_KEY}`
      );
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        setVideo({
          id: videoId,
          title: data.items[0].snippet.title,
          videoUrl: `https://www.youtube.com/embed/${videoId}`,
          posterUrl: data.items[0].snippet.thumbnails.maxres?.url || data.items[0].snippet.thumbnails.high.url
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching video:', error);
      setIsLoading(false);
    }
  };

  const generateShortVideo = async () => {
    setIsGeneratingShort(true);
    try {
      const audioUrl = `https://youtube-dl.org/downloads/latest/youtube-dl -x --audio-format mp3 https://www.youtube.com/watch?v=${video.id}`;
      console.log(audioUrl);

      const audioResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': '36cd8dcd2a674b78aea1123fd7498b63',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: audioUrl
        })
      });

      if (!audioResponse.ok) {
        throw new Error('Failed to upload audio');
      }

      const audioData = await audioResponse.json();

      // Then transcribe the audio file
      const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': '36cd8dcd2a674b78aea1123fd7498b63',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: audioData.upload_url,
          summarization: true,
          summary_model: 'informative',
          summary_type: 'bullets',
          format_text: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate transcription');
      }

      const transcriptData = await response.json();

      if (!transcriptData.id) {
        throw new Error('No transcript ID received');
      }

      const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`;
      let shortVideoUrl = null;
      let attempts = 0;
      const maxAttempts = 20;

      while (!shortVideoUrl && attempts < maxAttempts) {
        const pollingResponse = await fetch(pollingEndpoint, {
          headers: {
            'Authorization': '36cd8dcd2a674b78aea1123fd7498b63'
          }
        });

        if (!pollingResponse.ok) {
          throw new Error('Polling request failed');
        }

        const transcriptionResult = await pollingResponse.json();

        if (transcriptionResult.status === 'completed' && transcriptionResult.summary_timestamps?.length > 0) {
          shortVideoUrl = `${video.videoUrl}?start=${transcriptionResult.summary_timestamps[0].start}&end=${transcriptionResult.summary_timestamps[0].end}`;
          break;
        } else if (transcriptionResult.status === 'error') {
          throw new Error(transcriptionResult.error || 'Transcription failed');
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      if (!shortVideoUrl) {
        throw new Error('Timed out waiting for transcription');
      }

      setShortVideo(shortVideoUrl);
      alert("Short video generated successfully!");
    } catch (error) {
      console.error('Error generating short video:', error);
      alert(`Failed to generate short video: ${error.message}`);
    } finally {
      setIsGeneratingShort(false);
    }
  };

  const startWatchParty = () => {
    if (!isLog) {
      setShowLoginPrompt(true);
      return;
    }
    const url = `${window.location.origin}/video/${id}/${chatRoomId}`;
    setWatchPartyUrl(url);
    setShowChat(true);
  };

  const copyWatchPartyUrl = () => {
    navigator.clipboard.writeText(watchPartyUrl);
    alert("Watch party link copied to clipboard!");
  };

  const handleSegmentClick = (time) => {
    const videoElement = document.querySelector('iframe');
    if (videoElement) {
      const currentSrc = videoElement.src;
      const baseUrl = currentSrc.split('?')[0];
      videoElement.src = `${baseUrl}?start=${time}&autoplay=1`;
    }
  };

  const handleJoinRequest = (userId, accepted) => {
    console.log("Handling join request:", { userId, accepted, roomId: chatRoomId });
    socket.emit("handle-join-request", {
      roomId: chatRoomId,
      userId,
      accepted
    });
    setJoinRequests(prev => prev.filter(req => req.userId !== userId));
  };

  const createNewMeeting = () => {
    if (!isLog) {
      setShowLoginPrompt(true);
      return;
    }
    const meetingId = Math.random().toString(36).substring(2, 12);
    const url = `${window.location.origin}/video/${id}/${meetingId}`;
    setMeetingUrl(url);
    setIsMeetingHost(true);
    setShowMeetingInfo(true);
    setMeetingMode(true);
    setShowMeetingOptions(false);
    setChatRoomId(meetingId);
    
    socket.emit("create-meeting", { 
      roomId: meetingId, 
      hostId: socket.id,
      hostName: user.name 
    });

    socket.emit('joinRoom', { 
      roomId: meetingId, 
      userName: user.name 
    });

    localStorage.setItem('meetingState', JSON.stringify({
      savedChatRoomId: meetingId,
      savedIsMeetingHost: true,
      savedMeetingMode: true,
      savedIsInCall: true,
      savedUserName: user.name
    }));
  };

  const joinExistingMeeting = () => {
    if (!isLog) {
      setShowLoginPrompt(true);
      return;
    }
    setMeetingMode(true);
    setShowMeetingOptions(false);
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    alert("Meeting link copied to clipboard!");
  };

  const handleCallEnd = () => {
    setIsInCall(false);
    setMeetingMode(false);
    setShowMeetingOptions(true);
    localStorage.removeItem('meetingState'); // Clear meeting state when explicitly ending call
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white min-h-screen">
      <NavBar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {showMeetingOptions ? (
          <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Video Meeting</h1>
            <div className="space-y-6">
              <button
                onClick={createNewMeeting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex items-center justify-center gap-3"
              >
                <FaVideo />
                <span>Create New Meeting</span>
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">or</span>
                </div>
              </div>
              <button
                onClick={joinExistingMeeting}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg flex items-center justify-center gap-3"
              >
                <FaKeyboard />
                <span>Join Meeting</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-3/4 flex flex-col">
                <div className="aspect-w-16 h-[520px] bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    id="mainVideo"
                    className="w-full h-full"
                    src={video?.videoUrl}
                    title={video?.title}
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay"
                  />
                </div>
                {shortVideo && (
                  <div className="mt-4 aspect-w-16 h-[320px] bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                    <iframe
                      id="shortVideo"
                      className="w-full h-full"
                      src={shortVideo}
                      title="Short Version"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay"
                    />
                  </div>
                )}
                <div className="mt-4">
                  <h1 className="text-2xl font-bold">{video?.title}</h1>
                  <div className="mt-4 bg-gray-800 rounded-lg p-4 shadow-lg">
                    <VideoSegments
                      videoId={id}
                      onSegmentClick={handleSegmentClick}
                    />
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      {isLog && (
                        watchPartyUrl ? (
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
                        )
                      )}
                      <button
                        onClick={generateShortVideo}
                        disabled={isGeneratingShort}
                        className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 transition duration-300 ease-in-out ${isGeneratingShort ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <FaVideo />
                        <span>{isGeneratingShort ? 'Generating...' : 'Generate Short'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {showChat && video && (
                <div className="bg-gray-800 rounded-lg overflow-hidden h-[calc(100vh-2rem)] lg:h-[600px] flex flex-col lg:w-1/4">
                  {!isLog ? (
                    <div className="flex flex-col h-full justify-center items-center p-6 text-center">
                      <h2 className="text-xl font-bold mb-4">Login Required</h2>
                      <p className="mb-6">Please login to join the chat and video call.</p>
                      <Link
                        to="/login"
                        className="px-6 py-3 bg-purple-500 rounded-full hover:bg-purple-600 transition duration-300"
                      >
                        Login Now
                      </Link>
                    </div>
                  ) : (
                    <>
                      {isInCall ? (
                        <VideoCall 
                          chatRoomId={chatRoomId} 
                          user={user.name}
                          isMeetingHost={isMeetingHost}
                          onCallEnd={handleCallEnd}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-6">
                          <p className="text-xl mb-4">You left the call</p>
                          <button
                            onClick={() => setIsInCall(true)}
                            className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600"
                          >
                            Rejoin Call
                          </button>
                        </div>
                      )}
                      <ChatBox chatRoomId={chatRoomId} user={user.name} />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Meeting Info Modal */}
            {showMeetingInfo && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
                  <h2 className="text-2xl font-bold mb-6">Meeting Created</h2>
                  <div className="mb-6">
                    <p className="text-sm text-gray-300 mb-2">Share this link with others:</p>
                    <div className="flex items-center gap-2 bg-gray-700 p-3 rounded">
                      <input
                        ref={meetingLinkRef}
                        type="text"
                        value={meetingUrl}
                        readOnly
                        className="bg-transparent flex-1 outline-none"
                      />
                      <button
                        onClick={copyMeetingLink}
                        className="p-2 hover:bg-gray-600 rounded"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMeetingInfo(false)}
                    className="w-full py-3 bg-purple-500 rounded hover:bg-purple-600"
                  >
                    Start Meeting
                  </button>
                </div>
              </div>
            )}

            {/* Join Requests Modal */}
            {joinRequests.length > 0 && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                  <h2 className="text-xl font-bold mb-4">Join Requests</h2>
                  {joinRequests.map(request => (
                    <div key={request.userId} className="mb-4 p-4 bg-gray-700 rounded-lg">
                      <p className="mb-2">{request.userName} wants to join</p>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleJoinRequest(request.userId, false)}
                          className="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleJoinRequest(request.userId, true)}
                          className="px-4 py-2 bg-green-500 rounded hover:bg-green-600"
                        >
                          Admit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default VideoPlayer;