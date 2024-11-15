import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const [userRegister , setUserRegister] = useState({
    name : "",
    email : "",
    password: ""
  })

  const handleChangeRegister = (e) => {
    let name = e.target.name;
    let value = e.target.value;

    setUserRegister({...userRegister , [name] : value})
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userRegister.password !== confirmPassword) {
      alert('Passwords do not match');
    } else {
      try {
          const response = await fetch('http://127.0.0.1:5001/api/user/signup', {
              method: 'POST',
              Credentials:"include",
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(userRegister)
          });
          const data = await response.json();
          
          if (response.ok) {
              alert('register successfully');
              setUserRegister({
                  name : "",
                  email : "",
                  password: ""
              })
              navigate('/auth/login')

          } else {
              alert("Register operation Unsuccessfull");
          }
      } catch (error) {
          console.error('Error:', error);
          alert('Failed to fetch');
      }
      // Proceed with form submission
      // console.log('Form submitted', { name, email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-lg z-10">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-400">Join the community</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <label className="text-sm font-bold text-gray-300 tracking-wide">
              Name
            </label>
            <div className="flex items-center mt-2">
              <FaUser className="w-5 h-5 text-gray-400 absolute ml-3" />
              <input
                className="w-full text-base px-4 py-2 pl-10 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 bg-gray-900 text-white"
                name='name'
                type="text"
                value={userRegister.name}
                onChange={handleChangeRegister}
                placeholder="John Doe"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label className="text-sm font-bold text-gray-300 tracking-wide">
              Email
            </label>
            <div className="flex items-center mt-2">
              <FaEnvelope className="w-5 h-5 text-gray-400 absolute ml-3" />
              <input
                className="w-full text-base px-4 py-2 pl-10 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 bg-gray-900 text-white"
                type="email"
                name="email"
                value={userRegister.email}
                onChange={handleChangeRegister}
                placeholder="mail@example.com"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label className="text-sm font-bold text-gray-300 tracking-wide">
              Password
            </label>
            <div className="flex items-center mt-2">
              <FaLock className="w-5 h-5 text-gray-400 absolute ml-3" />
              <input
                className="w-full text-base px-4 py-2 pl-10 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 bg-gray-900 text-white pr-10"
                name='password'
                type={showPassword ? "text" : "password"}
                value={userRegister.password}
                onChange={handleChangeRegister}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute right-3 text-gray-400 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="relative">
            <label className="text-sm font-bold text-gray-300 tracking-wide">
              Confirm Password
            </label>
            <div className="flex items-center mt-2">
              <FaLock className="w-5 h-5 text-gray-400 absolute ml-3" />
              <input
                className="w-full text-base px-4 py-2 pl-10 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 bg-gray-900 text-white pr-10"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                className="absolute right-3 text-gray-400 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l hover:from-pink-500 hover:to-purple-500 text-gray-100 p-4 rounded-full tracking-wide font-semibold shadow-lg cursor-pointer transition ease-in duration-500"
            >
              Sign Up
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between mt-4">
          <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>
          <Link to="/auth/login" className="text-xs text-center text-gray-400 uppercase hover:text-purple-500">
            or sign in
          </Link>
          <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
