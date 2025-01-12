import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Home from "./pages/home/Home";
import VideoPlayer from "./pages/VideoPage/VideoPlayer";
import { FloatingNav } from "./components/ui/floating-navbar";
import { LoginProvider } from "./contexthelp/LoginContext";
import YtPage from "./components/YtPage";
import CategoryVideos from "./pages/CategoryPage/CategoryVideos";


function App() {
  const navItems = [
    {
      name: "Home",
      link: "/",
      // icon: <IconHome className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Sample",
      link: "/youtube",
      // icon: <IconUser className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Contact",
      link: "/contact",
      // icon: (
      //   <IconMessage className="h-4 w-4 text-neutral-500 dark:text-white" />
      // ),
    },
  ];
  return (
    <main>
      <LoginProvider>
        <BrowserRouter>
        <FloatingNav navItems={navItems} />
          <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/" element={<Home />} />
            <Route path="/video/:id" element={<VideoPlayer />} />
            <Route path="/video/:id/:roomId" element={<VideoPlayer />} />
            <Route path="/youtube" element={<YtPage />} />
            <Route path="/category/:categoryId/:categoryName" element={<CategoryVideos />} />
          </Routes>
        </BrowserRouter>
      </LoginProvider>
    </main>
  );
}

export default App;
