import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import CategorySlider from "../../components/CategorySlider";
import SearchBar from "../../components/SearchBar";
import { FaPlay, FaInfoCircle, FaFire, FaClock, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import VideoJS from "../../components/Videojs";
import Cookies from "js-cookie";
import { useLogin } from "../../contexthelp/LoginContext";
import NavBar from "../../components/NavBar";

const Home = () => {
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  const {isLog, user} = useLogin();
  const API_KEY = 'AIzaSyCLXbcD352-LJDxcVuNVJfo1zOWyL9quvQ';

  useEffect(() => {
    fetchFeaturedVideo();
    fetchCategories();
    fetchTrendingVideos();
  }, []);

  const scroll = (direction) => {
    const container = document.getElementById('trending-container');
    const scrollAmount = 300;
    if (direction === 'left') {
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    } else {
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const fetchTrendingVideos = async () => {
    try {
      const response = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=12&key=${API_KEY}`
      );
      const data = await response.json();
      const formattedVideos = data.items.map(video => ({
        id: video.id,
        title: video.snippet.title,
        views: `${Math.floor(video.statistics.viewCount / 1000000)}M`,
        duration: "10:00",
        thumbnailUrl: video.snippet.thumbnails.high.url,
        channelTitle: video.snippet.channelTitle
      }));
      setTrendingVideos(formattedVideos);
    } catch (error) {
      console.error('Error fetching trending videos:', error);
    }
  };

  const fetchFeaturedVideo = async () => {
    try {
      const response = await fetch(
        `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${API_KEY}`
      );
      const data = await response.json();
      const video = data.items[0];
      setFeaturedVideo({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
        posterUrl: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high.url
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching featured video:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoryIds = ['1', '17', '10', '20', '23', '24']; // Added more categories
      const categoryData = [];

      for (const categoryId of categoryIds) {
        const response = await fetch(
          `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&videoCategoryId=${categoryId}&chart=mostPopular&maxResults=6&key=${API_KEY}`
        );
        const data = await response.json();
        
        const categoryNames = {
          '1': 'Action',
          '17': 'Sports',
          '10': 'Music',
          '20': 'Gaming',
          '23': 'Comedy',
          '24': 'Entertainment'
        };
        
        const videos = data.items.map(video => ({
          id: video.id,
          title: video.snippet.title,
          thumbnailUrl: video.snippet.thumbnails.high.url,
          channelTitle: video.snippet.channelTitle
        }));

        categoryData.push({
          name: categoryNames[categoryId],
          videos: videos
        });
      }

      setCategories(categoryData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white min-h-screen">
      <NavBar/>

      <main className="container mx-auto px-4 pt-24 pb-12">
        {featuredVideo && (
          <section className="mb-16 relative overflow-hidden rounded-3xl shadow-2xl h-[600px]">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
            <div className="relative h-full">
              <VideoJS
                options={{
                  sources: [{ src: featuredVideo.videoUrl }],
                  poster: featuredVideo.posterUrl,
                  autoplay: true,
                  muted: true, 
                  loop: true,
                }}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-black via-black/60 to-transparent">
              <h2 className="text-5xl font-bold mb-4 drop-shadow-lg">
                {featuredVideo.title}
              </h2>
              <p className="text-xl mb-8 max-w-3xl drop-shadow-md leading-relaxed">
                {featuredVideo.description.slice(0, 200)}...
              </p>
              <div className="flex space-x-6">
                <Link
                  to={`/video/${featuredVideo.id}`}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full flex items-center transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                  <FaPlay className="mr-3 text-xl" /> Watch Now
                </Link>
                <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold py-4 px-8 rounded-full flex items-center transition duration-300 ease-in-out shadow-lg">
                  <FaInfoCircle className="mr-3 text-xl" /> More Info
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mb-16 relative">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <FaFire className="mr-3 text-red-500" /> Trending Now
          </h2>
          <div className="relative">
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 p-4 rounded-full backdrop-blur-sm"
            >
              <FaChevronLeft className="text-2xl" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 p-4 rounded-full backdrop-blur-sm"
            >
              <FaChevronRight className="text-2xl" />
            </button>
            <div 
              id="trending-container"
              className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide"
              style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {trendingVideos.map((video) => (
                <Link key={video.id} to={`/video/${video.id}`} className="group flex-none w-[300px]">
                  <div className="relative overflow-hidden rounded-xl shadow-lg transition duration-300 ease-in-out transform group-hover:scale-105">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                      <FaPlay className="text-4xl" />
                    </div>
                    <div className="p-4 bg-gray-800/95">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{video.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">{video.channelTitle}</p>
                      <div className="flex items-center text-sm text-gray-300">
                        <span className="mr-3">{video.views} views</span>
                        <span className="flex items-center">
                          <FaClock className="mr-1" /> {video.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {categories.map((category) => (
          <CategorySlider key={category.name} category={category} />
        ))}
      </main>
    </div>
  );
};

export default Home;
