import React, { useState, useEffect } from 'react';
import { FaPlay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const VideoSegments = ({ videoId, onSegmentClick }) => {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideoSegments();
  }, [videoId]);

  const scroll = (direction) => {
    const container = document.getElementById('segments-container');
    const scrollAmount = 300;
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  };

  const fetchVideoSegments = async () => {
    try {
      const response = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.REACT_APP_YT_KEY}`
      );
      const data = await response.json();

      // Get video duration in seconds
      const duration = convertYTDurationToSeconds(data.items[0].contentDetails.duration);
      
      // Create evenly divided segments
      const segmentCount = 5;
      const segmentDuration = duration / segmentCount;
      const segments = Array.from({length: segmentCount}, (_, i) => ({
        time: i * segmentDuration,
        title: `Part ${i + 1}`,
        thumbnail: data.items[0].snippet.thumbnails.medium.url,
        summary: `Segment ${i + 1} of the video`
      }));

      setSegments(segments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching segments:', error);
      setLoading(false);
    }
  };

  const convertYTDurationToSeconds = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-bold mb-4 text-white">Video Segments</h3>
      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 p-4 rounded-full backdrop-blur-sm"
        >
          <FaChevronLeft className="text-2xl text-white" />
        </button>
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 p-4 rounded-full backdrop-blur-sm"
        >
          <FaChevronRight className="text-2xl text-white" />
        </button>
        <div 
          id="segments-container"
          className="flex gap-4 overflow-x-auto" 
          style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {segments.map((segment, index) => (
            <div
              key={index}
              className="flex-none w-[300px] bg-gray-700 rounded-lg p-2 cursor-pointer hover:bg-gray-600 transition-colors duration-200"
              onClick={() => onSegmentClick(segment.time)}
            >
              <div className="relative w-full h-40">
                <img
                  src={segment.thumbnail}
                  alt={segment.title}
                  className="w-full h-full object-cover rounded"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <FaPlay className="text-white text-2xl" />
                </div>
                <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                  {formatTime(segment.time)}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-white font-medium">{segment.title}</h4>
                <p className="text-gray-400 text-sm mt-1">{segment.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoSegments;