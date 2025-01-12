import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaThumbsUp, FaThumbsDown, FaShare, FaEye } from 'react-icons/fa';

function YtPage() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const API_KEY = 'AIzaSyCLXbcD352-LJDxcVuNVJfo1zOWyL9quvQ';

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=20&key=${API_KEY}`
      );
      const data = await response.json();
      setVideos(data.items);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {selectedVideo ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-xl"
                  src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                  title={selectedVideo.snippet.title}
                  allowFullScreen
                />
              </div>
              <div className="mt-4">
                <h1 className="text-xl font-bold text-white">
                  {selectedVideo.snippet.title}
                </h1>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={`https://i.ytimg.com/vi/${selectedVideo.id}/default.jpg`}
                      alt="Channel"
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="text-white font-medium">
                      {selectedVideo.snippet.channelTitle}
                    </span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-2 text-white">
                      <FaThumbsUp />
                      <span>{formatViews(selectedVideo.statistics.likeCount)}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-white">
                      <FaThumbsDown />
                    </button>
                    <button className="flex items-center space-x-2 text-white">
                      <FaShare />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex space-x-2 cursor-pointer hover:bg-gray-800 p-2 rounded-lg"
                  onClick={() => handleVideoSelect(video)}
                >
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-40 h-24 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="text-white font-medium line-clamp-2">
                      {video.snippet.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {video.snippet.channelTitle}
                    </p>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                      <FaEye className="mr-1" />
                      <span>{formatViews(video.statistics.viewCount)} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="cursor-pointer hover:transform hover:scale-105 transition-transform duration-200"
                onClick={() => handleVideoSelect(video)}
              >
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="w-full rounded-lg"
                />
                <div className="mt-2">
                  <h3 className="text-white font-medium line-clamp-2">
                    {video.snippet.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {video.snippet.channelTitle}
                  </p>
                  <div className="flex items-center text-gray-400 text-sm mt-1">
                    <FaEye className="mr-1" />
                    <span>{formatViews(video.statistics.viewCount)} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default YtPage;