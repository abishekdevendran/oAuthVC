import { generateSlug } from "random-word-slugs";
import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SocketContext from "../contexts/SocketContext";
import UserContext from "../contexts/UserContext";

const Lobby = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [data, setData] = useState("");
  const {socket} = useContext(SocketContext);
  const roomCreateHandler = (e) => {
    e.preventDefault();
    let roomCode = generateSlug(2);
    navigate(`/vc/${roomCode}`);
    // navigate(0);
  };
  const roomJoinHandler = (e) => {
    if (data.length <= 2) {
      toast.error("Not a valid room code");
      return;
    }
    e.preventDefault();
    navigate(`/vc/${data}`);
    // navigate(0);
  };
  const logoutHandler = async (e) => {
    console.log("logout");
    e.preventDefault();
    const URL = import.meta.env.PROD
      ? "https://"+window.location.hostname
      : "http://"+window.location.hostname + ":5000";
    try {
      fetch(`${URL}/auth/logout`, {
        credentials: "include",
      });
      console.log("almost there");
      setUser({ name: "", isLoggedIn: false });
      navigate("/login");
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    socket.emit("clearRooms");
  }, []);
  useLayoutEffect(() => {
    document.title = `Lobby | ${user?.name}`;
  }, []);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <form
        onSubmit={roomJoinHandler}
        className="max-w-sm rounded overflow-hidden shadow-lg text-center w-5/6 bg-bg-secondary p-5 py-9"
      >
        <h1 className="text-4xl font-semibold text-primary mb-5">Lobby</h1>
        <h2 className="text-xl font-semibold text-primary mb-5">Room Code:</h2>
        <input
          required
          type="text"
          name="username"
          placeholder="ex: minister-of-fame"
          onChange={(e) => setData(e.target.value)}
          className="bg-bg-secondary border-b-2 border-brand-tertiary focus:outline-none focus:border-brand-primary focus:border-brand-primary-lg py-2 px-4 rounded text-brand-primary-lg"
        />
        <div className="mt-5 flex items-center justify-center">
          <button
            className="bg-brand-primary text-brand-tertiary font-bold py-2 px-4 rounded mx-2 h-16 hover:scale-110 transition-all"
            type="submit"
          >
            Join Room
          </button>
          <button
            onClick={roomCreateHandler}
            className="bg-brand-primary text-brand-tertiary font-bold py-2 px-4 rounded mx-2 h-16 hover:scale-110 transition-all"
          >
            Create Room
          </button>
          <button
            onClick={logoutHandler}
            className="bg-brand-primary text-brand-tertiary font-bold py-2 px-4 rounded mx-2 h-16 hover:scale-110 transition-all"
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  );
};

export default Lobby;
