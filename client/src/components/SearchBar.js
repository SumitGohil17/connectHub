import React, { useState } from "react";
import { PiMagnifyingGlassBold } from "react-icons/pi";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchTerm);
  };

  return (
    <form onSubmit={handleSearch} className="relative flex items-center">
      <input
        type="text"
        placeholder="Search videos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-gray-700 text-white rounded-full py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <button
        type="submit"
        className="absolute right-0 top-0 mt-2 mr-3 text-gray-400 hover:text-white"
      >
        <PiMagnifyingGlassBold />
      </button>
    </form>
  );
};

export default SearchBar;