import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Protectedroute from "./components/Protectedroute";
import { SocketContextProvider } from "./contexts/SocketContext";
import { UserContextProvider } from "./contexts/UserContext";
import App from "./routes/App";
import Lobby from "./routes/Lobby";
import Login from "./routes/Login";
import Room from "./routes/Room";
import "./index.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <UserContextProvider>
    <SocketContextProvider>
      <BrowserRouter>
        <Toaster />
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<App />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/vc">
            <Route
              path=""
              element={
                <Protectedroute>
                  <Lobby />
                </Protectedroute>
              }
            />
            <Route
              path=":roomCode"
              element={
                <Protectedroute>
                  <Room key={location.pathname} />
                </Protectedroute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </SocketContextProvider>
  </UserContextProvider>
);
