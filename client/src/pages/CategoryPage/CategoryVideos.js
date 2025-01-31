import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaPlay, FaClock } from "react-icons/fa";
import NavBar from "../../components/NavBar";

const CategoryVideos = () => {
    const { categoryId, categoryName } = useParams();
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCategoryVideos();
    }, [categoryId]);

    const fetchCategoryVideos = async () => {
        try {
            const response = await fetch(
                `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics&videoCategoryId=${categoryId}&chart=mostPopular&maxResults=20&key=${process.env.REACT_APP_YT_KEY}`
            );
            const data = await response.json();

            const formattedVideos = data.items.map(video => ({
                id: video.id,
                title: video.snippet.title,
                views: `${Math.floor(video.statistics.viewCount / 1000000)}M`,
                duration: "10:00",
                thumbnailUrl: video.snippet.thumbnails.high.url
            }));
            setVideos(formattedVideos);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching category videos:', error);
            setIsLoading(false);
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
                <h1 className="text-3xl font-bold mb-8">{decodeURIComponent(categoryName)} Videos</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {videos.map((video) => (
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
                                <div className="bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
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
            </main>
        </div>
    );
};

export default CategoryVideos; 