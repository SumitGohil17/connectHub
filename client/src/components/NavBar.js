import React from 'react'
import { useLogin } from '../contexthelp/LoginContext';
import { Link, NavLink } from "react-router-dom";
import Cookies from 'js-cookie'
import SearchBar from './SearchBar';

function NavBar() {
    const {isLog, user} = useLogin();

    const handleLogout = () => {
        Cookies.remove("jwtToken");
    
        window.location.reload();
      };
  return (
    <header className="flex bg-black bg-opacity-50 backdrop-filter backdrop-blur-md py-4 fixed top-0 left-0 right-0 z-50">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-500 ml-[5%]">
          ConnectHub
        </h1>
        <div className="container mx-auto px-4 flex justify-end items-end right-0">
          <SearchBar />
          {isLog ? (
            <button
              onClick={handleLogout}
              className="flex items-end bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-sm mx-1"
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/auth/login">
                <button className="flex items-end bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-sm mx-1">
                  Login
                </button>
              </NavLink>
              <NavLink to="/auth/signup">
                <button className="flex items-end bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-sm">
                  Sign Up
                </button>
              </NavLink>
            </>
          )}
        </div>
      </header>
  )
}

export default NavBar