import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { 
  FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash,
  FaDesktop, FaHandPaper, FaUserFriends, FaThumbtack,
  FaEllipsisV, FaCog
} from 'react-icons/fa';
import io from 'socket.io-client';

const socket = io('http://localhost:5001', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

const VideoCall = ({ chatRoomId, user, isMeetingHost, onCallEnd }) => {
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isWaitingForHost, setIsWaitingForHost] = useState(false);
  const previewVideo = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);

  // Preview camera before joining
  useEffect(() => {
    startPreview();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startPreview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setStream(mediaStream);
      if (previewVideo.current) {
        previewVideo.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  const joinMeeting = () => {
    setIsWaiting(true);
    console.log("Requesting to join:", { chatRoomId, socketId: socket.id, userName: user });
    
    socket.emit("request-to-join", {
      roomId: chatRoomId,
      userId: socket.id,
      userName: user
    });
  };

  // Set up socket listeners when component mounts
  useEffect(() => {
    socket.on("join-accepted", () => {
      console.log("Join request accepted");
      setIsJoined(true);
      setIsWaiting(false);
      startVideo(); // Start video after being accepted
    });

    socket.on("join-rejected", ({ reason }) => {
      console.log("Join request rejected:", reason);
      setIsWaiting(false);
      alert(reason || "Your request to join was denied");
    });

    // Cleanup listeners when component unmounts
    return () => {
      socket.off("join-accepted");
      socket.off("join-rejected");
    };
  }, []); // Empty dependency array since we want this to run once

  useEffect(() => {
    if (isMeetingHost) {
      setIsJoined(true);
      setIsWaiting(false);
      startVideo(); // Start video immediately for host
    }
  }, [isMeetingHost]);

  useEffect(() => {
    if (!isMeetingHost && chatRoomId) {
      // Non-host needs to request to join
      socket.emit("request-to-join", {
        roomId: chatRoomId,
        userId: socket.id,
        userName: user
      });
      setIsWaitingForHost(true);
    }
  }, [chatRoomId, isMeetingHost, user]);

  useEffect(() => {
    startPreview(); // Only start preview initially
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      socket.emit("join-video-room", { 
        roomId: chatRoomId, 
        userId: socket.id,
        userName: user
      });

      socket.on("all-users", users => {
        const peers = [];
        users.forEach(userId => {
          if (userId !== socket.id) {
            const peer = createPeer(userId, socket.id, stream);
            peersRef.current.push({
              peerId: userId,
              peer,
            });
            peers.push({
              peerId: userId,
              peer,
            });
          }
        });
        setPeers(peers);
      });

      socket.on("user-joined", payload => {
        const peer = addPeer(payload.signal, payload.callerId, stream);
        peersRef.current.push({
          peerId: payload.callerId,
          peer,
        });
        setPeers(peers => [...peers, { peerId: payload.callerId, peer }]);
      });

      socket.on("receiving-returned-signal", payload => {
        const item = peersRef.current.find(p => p.peerId === payload.id);
        if (item) {
          item.peer.signal(payload.signal);
        }
      });

      socket.on("user-left-video", userId => {
        const peerObj = peersRef.current.find(p => p.peerId === userId);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        const filteredPeers = peersRef.current.filter(p => p.peerId !== userId);
        peersRef.current = filteredPeers;
        setPeers(peers => peers.filter(p => p.peerId !== userId));
      });
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on("signal", signal => {
      socket.emit("sending-signal", { 
        userToSignal, 
        callerId, 
        signal 
      });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on("signal", signal => {
      socket.emit("returning-signal", { 
        signal, 
        callerId 
      });
    });

    peer.signal(incomingSignal);
    return peer;
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
        socket.emit("media-state-update", {
          roomId: chatRoomId,
          userId: socket.id,
          type: 'audio',
          enabled: !isAudioOn
        });
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
        socket.emit("media-state-update", {
          roomId: chatRoomId,
          userId: socket.id,
          type: 'video',
          enabled: !isVideoOn
        });
      }
    }
  };

  useEffect(() => {
    if (isJoined && stream) {
      socket.emit("join-video-room", {
        roomId: chatRoomId,
        userId: socket.id,
        userName: user
      });

      socket.on("all-users", users => {
        const peers = [];
        users.forEach(userId => {
          if (userId !== socket.id) {
            const peer = createPeer(userId, socket.id, stream);
            peersRef.current.push({
              peerId: userId,
              peer,
            });
            peers.push({
              peerId: userId,
              peer,
            });
          }
        });
        setPeers(peers);
      });

      socket.on("user-joined", payload => {
        const peer = addPeer(payload.signal, payload.callerId, stream);
        peersRef.current.push({
          peerId: payload.callerId,
          peer,
        });
        setPeers(peers => [...peers, { peerId: payload.callerId, peer }]);
      });

      socket.on("receiving-returned-signal", payload => {
        const item = peersRef.current.find(p => p.peerId === payload.id);
        if (item) {
          item.peer.signal(payload.signal);
        }
      });

      socket.on("user-left-video", userId => {
        const peerObj = peersRef.current.find(p => p.peerId === userId);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        const filteredPeers = peersRef.current.filter(p => p.peerId !== userId);
        peersRef.current = filteredPeers;
        setPeers(peers => peers.filter(p => p.peerId !== userId));
      });
    }

    return () => {
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
      socket.off("user-left-video");
    };
  }, [isJoined, stream]);

  const endCall = () => {
    // Stop all tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Destroy all peer connections
    peersRef.current.forEach(({ peer }) => {
      if (peer) {
        peer.destroy();
      }
    });

    // Clear peers
    setPeers([]);
    peersRef.current = [];

    // Notify server
    socket.emit("leave-video-room", {
      roomId: chatRoomId,
      userId: socket.id
    });

    setIsJoined(false);
    setStream(null);
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  useEffect(() => {
    // Handle reconnection
    const handleReconnect = async () => {
      if (stream) {
        // Notify other participants of reconnection
        socket.emit("user-reconnected", {
          roomId: chatRoomId,
          userId: socket.id,
          userName: user
        });

        // Restart video streams
        socket.emit("join-video-room", {
          roomId: chatRoomId,
          userId: socket.id,
          userName: user
        });
      }
    };

    socket.on("connect", handleReconnect);

    return () => {
      socket.off("connect", handleReconnect);
    };
  }, [chatRoomId, user, stream]);

  if (!isJoined) {
    return (
      <div className="bg-gray-900 p-6 rounded-lg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {isWaitingForHost ? 'Waiting for host to admit you...' : 'Ready to join?'}
          </h2>
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
            <video
              ref={previewVideo}
              muted
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3 rounded-full ${isVideoOn ? 'bg-green-500' : 'bg-red-500'}`}
            >
              {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
            </button>
            <button
              onClick={() => setIsAudioOn(!isAudioOn)}
              className={`p-3 rounded-full ${isAudioOn ? 'bg-green-500' : 'bg-red-500'}`}
            >
              {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
          </div>
        </div>
        {!isWaitingForHost && (
          <button
            onClick={joinMeeting}
            className="w-full py-3 px-4 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600"
          >
            Join Meeting
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Video */}
        <div className="relative">
          <video
            ref={userVideo}
            muted
            autoPlay
            playsInline
            className={`w-full rounded-lg ${!isVideoOn ? 'hidden' : ''}`}
          />
          {!isVideoOn && (
            <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-white text-xl">Camera Off</div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            You {!isAudioOn && '(Muted)'}
          </div>
        </div>

        {/* Remote Videos */}
        {peers.map((peer) => (
          <Video 
            key={peer.peerId} 
            peer={peer.peer}
            isVideoEnabled={true} // You'll need to track this per user
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${isAudioOn ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${isVideoOn ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
        </button>
        <button
          onClick={endCall}
          className="p-3 rounded-full bg-red-500 hover:bg-red-600"
        >
          End Call
        </button>
      </div>
    </div>
  );
};

// Video component for remote peers
const Video = ({ peer, isVideoEnabled }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", stream => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });

    return () => {
      if (ref.current && ref.current.srcObject) {
        ref.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [peer]);

  return (
    <div className="relative">
      <video
        ref={ref}
        autoPlay
        playsInline
        className={`w-full rounded-lg ${!isVideoEnabled ? 'hidden' : ''}`}
      />
      {!isVideoEnabled && (
        <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-white text-xl">Camera Off</div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;