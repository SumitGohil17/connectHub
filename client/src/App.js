import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Home from "./pages/home/Home";
import VideoPlayer from "./pages/VideoPage/VideoPlayer";

function App() {
  return (
    <main>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/" element={<Home />} />
          <Route path="/video/:id" element={<VideoPlayer />} />
          <Route path="/video/:id/:roomId" element={<VideoPlayer />} />
        </Routes>
      </BrowserRouter>
    </main>
  );
}

export default App;