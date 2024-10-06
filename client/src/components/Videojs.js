import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Adjust the URL as needed

const VideoJS = ({ options, roomId }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    socket.emit('join-room', { roomId });
    setReady(true);

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

        player.on('play', () => {
          socket.emit('video-action', { roomId, type: 'play' });
          console.log("Video play");
        });

        player.on('pause', () => {
          socket.emit('video-action', { roomId, type: 'pause' });
          console.log("Video pause");
        });

        player.on('timeupdate', () => {
          const currentTime = player.currentTime();
          console.log(currentTime);
          socket.emit('video-timeupdate', { roomId, time: currentTime });
        });

        socket.on('sync-video', (data) => {
          if (Math.abs(player.currentTime() - data.time) > 0.5) {
            player.currentTime(data.time);
          }
          if (data.isPlaying && player.paused()) {
            player.play();
          } else if (!data.isPlaying && !player.paused()) {
            player.pause();
          }
        });
      });

      return () => {
        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
      };
    }
  }, []);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
};

export default VideoJS;