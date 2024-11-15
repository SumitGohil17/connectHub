import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import CategorySlider from "../../components/CategorySlider";
import SearchBar from "../../components/SearchBar";
import { FaPlay, FaInfoCircle, FaFire, FaClock } from "react-icons/fa";
import VideoJS from "../../components/Videojs";
import Cookies from "js-cookie";
import { useLogin } from "../../contexthelp/LoginContext";
import NavBar from "../../components/NavBar";

const Home = () => {
  // const { isLog } = useLogin();
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const {isLog, user} = useLogin();
  

  useEffect(() => {
    fetchFeaturedVideo();
    fetchCategories();
    fetchTrendingVideos();
  }, []);

  // ... fetchFeaturedVideo and fetchCategories functions remain the same

  const fetchTrendingVideos = () => {
    // Simulating API call
    setTimeout(() => {
      setTrendingVideos([
        {
          id: "t1",
          title: "Viral Sensation",
          views: "5.2M",
          duration: "10:23",
          thumbnailUrl:
            "https://cdn.sanity.io/images/7g6d2cj1/production/fa7aea4f9f9e19463f59b206ada7557063e84a51-1280x720.jpg",
        },
        {
          id: "t2",
          title: "Breaking News",
          views: "3.8M",
          duration: "15:45",
          thumbnailUrl:
            "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/animated-breaking-news-video-design-template-c020b28108c92ef72fb87316b6d48cba_screen.jpg",
        },
        {
          id: "t3",
          title: "Tech Review",
          views: "2.1M",
          duration: "8:56",
          thumbnailUrl:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7vBugM0tQtR129m1YjjAFr80xjz6Zo1YtuA&s",
        },
      ]);
    }, 1000);
  };
  const fetchFeaturedVideo = () => {
    // Simulating API call
    setTimeout(() => {
      setFeaturedVideo({
        id: "featured1",
        title: "Inception: A Mind-Bending Thriller",
        description:
          "Dream thieves plant an idea into a CEO's mind in this sci-fi masterpiece.",
        videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
        posterUrl: "/action1.jpg",
      });
      setIsLoading(false);
    }, 1000);
  };

  const fetchCategories = () => {
    // Simulating API call
    setTimeout(() => {
      setCategories([
        {
          name: "Action",
          videos: [
            {
              id: "a1",
              title: "The Dark Knight",
              thumbnailUrl: "/action1.jpg",
            },
            {
              id: "a2",
              title: "Mad Max: Fury Road",
              thumbnailUrl: "/action2.jpg",
            },
            { id: "a3", title: "John Wick", thumbnailUrl: "/action3.jpg" },
          ],
        },
        {
          name: "Comedy",
          videos: [
            {
              id: "c1",
              title: "The Grand Budapest Hotel",
              thumbnailUrl: "/comedy1.jpeg",
            },
            { id: "c2", title: "Bridesmaids", thumbnailUrl: "/comedy2.jpg" },
            { id: "c3", title: "Deadpool", thumbnailUrl: "/comedy3.jpg" },
          ],
        },
        {
          name: "Drama",
          videos: [
            {
              id: "d1",
              title: "The Shawshank Redemption",
              thumbnailUrl: "/drama1.jpg",
            },
            { id: "d2", title: "Forrest Gump", thumbnailUrl: "/drama2.jpg" },
            { id: "d3", title: "The Godfather", thumbnailUrl: "/drama3.png" },
          ],
        },
      ]);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white min-h-screen">
      <NavBar/>

      <main className="container mx-auto px-4 pt-24 pb-12">
        {featuredVideo && (
          <section className="mb-16 relative overflow-hidden rounded-3xl shadow-2xl h-full">
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
            <div className="relative flex w-full justify-center">
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
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
              <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
                {featuredVideo.title}
              </h2>
              <p className="text-lg mb-6 max-w-2xl drop-shadow-md">
                {featuredVideo.description}
              </p>
              <div className="flex space-x-4">
                <Link
                  to={`/video/${featuredVideo.id}`}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full flex items-center transition duration-300 ease-in-out transform hover:scale-105"
                >
                  <FaPlay className="mr-2" /> Play Now
                </Link>
                <button className="bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white font-bold py-3 px-6 rounded-full flex items-center transition duration-300 ease-in-out">
                  <FaInfoCircle className="mr-2" /> More Info
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <FaFire className="mr-2 text-red-500" /> Trending Now
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingVideos.map((video) => (
              <Link key={video.id} to={`/video/${video.id}`} className="group">
                <div className="relative overflow-hidden rounded-xl shadow-lg transition duration-300 ease-in-out transform group-hover:scale-105">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out">
                    <FaPlay className="text-4xl text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                    <h3 className="font-bold text-lg mb-1">{video.title}</h3>
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
        </section>

        {categories.map((category) => (
          <CategorySlider key={category.name} category={category} />
        ))}
      </main>
    </div>
  );
};

export default Home;
