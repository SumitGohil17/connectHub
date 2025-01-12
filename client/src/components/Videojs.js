import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import videojs from 'video.js';

const socket = io('http://localhost:5000');

const VideoJS = ({ options, roomId, onReady }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    socket.emit('join-room', { roomId });

    return () => {
      socket.disconnect(); 
    };
  }, [roomId]);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const player = videojs(videoElement, options, () => {
        console.log('player is ready');
        playerRef.current = player;
        if (onReady) {
          onReady(player);
        }
      });

      const handlePlay = () => {
        socket.emit('video-action', { roomId, type: 'play' });
        console.log("Video play");
      };

      const handlePause = () => {
        socket.emit('video-action', { roomId, type: 'pause' });
        console.log("Video pause");
      };

      const handleTimeUpdate = () => {
        const currentTime = player.currentTime();
        console.log(currentTime);
        socket.emit('video-timeupdate', { roomId, time: currentTime });
      };

      player.on('play', handlePlay);
      player.on('pause', handlePause);
      player.on('timeupdate', handleTimeUpdate);

      socket.on('sync-video', (data) => {
        if (Math.abs(player.currentTime() - data.time) > 0.5) {
          player.currentTime(data.time);
        }
        if (data.isPlaying && player.paused) {
          player.play();
        } else if (!data.isPlaying && !player.paused) {
          player.pause();
        }
      });

      return () => {
        player.off('play', handlePlay);
        player.off('pause', handlePause);
        player.off('timeupdate', handleTimeUpdate);
      };
    }
  }, [options, roomId, onReady]);

  return (
    <div>
      <video 
        ref={videoRef}
        className="w-full h-full"
        controls
      />
    </div>
  );
};

export default VideoJS;