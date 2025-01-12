import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ChatBox from "../../components/ChatBox";
import { FaUserFriends, FaCopy, FaVideo } from "react-icons/fa"; 
import { useLogin } from "../../contexthelp/LoginContext";
import NavBar from "../../components/NavBar";
import VideoSegments from '../../components/VideoSegments/VideoSegments';

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

  useEffect(() => {
    fetchVideo(id);
  }, [id]);

  const fetchVideo = async (videoId) => {
    try {
      const API_KEY = 'AIzaSyCLXbcD352-LJDxcVuNVJfo1zOWyL9quvQ';
      const response = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
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
      // Get audio URL using youtube-dl or similar service first
      const audioUrl = `https://youtube-dl.org/downloads/latest/youtube-dl -x --audio-format mp3 https://www.youtube.com/watch?v=${video.id}`;
      console.log(audioUrl);
      
      
      // First make request to get audio file
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
      
      // Poll for completion
      const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`;
      let shortVideoUrl = null;
      let attempts = 0;
      const maxAttempts = 20; // Prevent infinite polling
      
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