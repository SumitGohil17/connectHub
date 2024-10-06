import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight, FaPlay } from "react-icons/fa";

const CategorySlider = ({ category }) => {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{category.name}</h2>
        <Link to={`/category/${category.name.toLowerCase()}`} className="text-red-500 hover:text-red-600 flex items-center">
          View All <FaChevronRight className="ml-1" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {category.videos.map((video) => (
          <Link key={video.id} to={`/video/${video.id}`} className="group">
            <div className="relative overflow-hidden rounded-lg shadow-lg transition duration-300 ease-in-out transform group-hover:scale-105">
              <img src={video.thumbnailUrl} alt={video.title} className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out">
                <FaPlay className="text-3xl text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                <h3 className="font-bold text-sm">{video.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategorySlider;