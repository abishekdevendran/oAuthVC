import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import SocketContext from "../contexts/SocketContext";
import UserContext from "../contexts/UserContext";
import { MediaConnection, Peer } from "peerjs";

interface Player {
  id: number;
  uname: string;
}

const Room = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { socket } = useContext(SocketContext);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myID, setMyID] = useState("");
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const URL = window.location.hostname;
  const isSecure = import.meta.env.PROD ? true : false;
  const port = import.meta.env.PROD ? 443 : 5000;
  const [peer, setPeer] = useState<Peer>();
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream>();
  const [call, setCall] = useState<MediaConnection>();

  const roomJoinManager = () => {
    console.log(user);
    socket.emit("roomJoin", roomCode, user, (isValidSize, Splayers) => {
      if (!isValidSize) {
        toast.error("Call already in session.");
        navigate("/vc");
        return;
      }
      localStorage.removeItem("board");
      setPlayers(Splayers);
      let id = Splayers.find((player) => player.uname === user?.name).id;
      setMyID(id);
      setPeer(
        new Peer(id + "peervc", {
          secure: isSecure,
          host: URL,
          port: port,
          path: "/peerjs",
          config: {
            iceServers: [
              { url: "stun:stun01.sipphone.com" },
              { url: "stun:stun.ekiga.net" },
              { url: "stun:stunserver.org" },
              { url: "stun:stun.softjoys.com" },
              { url: "stun:stun.voiparound.com" },
              { url: "stun:stun.voipbuster.com" },
              { url: "stun:stun.voipstunt.com" },
              { url: "stun:stun.voxgratia.org" },
              { url: "stun:stun.xten.com" },
              // {
              //   url: "turn:192.158.29.39:3478?transport=udp",
              //   credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
              //   username: "28224511:1379330808",
              // },
              // {
              //   url: "turn:192.158.29.39:3478?transport=tcp",
              //   credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
              //   username: "28224511:1379330808",
              // },
            ],
          },
          // debug: 3,
        })
      );
      toast.success("Room joined successfully");
    });
  };

  useEffect(() => {
    async function func() {
      const stream = await window.navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(stream);
      console.log("stream: ", stream);
      if (localRef.current) {
        localRef.current!.srcObject = stream;
        localRef.current!.load();
        localRef.current!.play();
      }
    }
    func();
  }, [localRef]);

  useEffect(() => {
    if (roomCode) {
      roomJoinManager();
    }
  }, [roomCode]);

  useEffect(() => {
    socket.on("updatePlayers", (players) => {
      setPlayers(players);
      console.log(players);
    });

    return () => {
      socket.off("updatePlayers");
    };
  }, [players]);

  useEffect(() => {
    console.log("a");
    const call = () => {
      if (players.length === 2) {
        console.log("b");
        if (peer) {
          console.log("c");
          if (players[0].uname === user.name) {
            console.log(
              "calling: ",
              players[1].id + "peervc",
              " from: ",
              players[0].id + "peervc"
            );
            // peer.connect(players[1].id + "peervc");
            // make the call
            const call = peer.call(players[1].id + "peervc", stream!);
            setCall(call);
          } else {
            peer.on("call", async (call) => {
              console.log("getting call from: ", call.peer);
              const localStream =
                await window.navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: true,
                });
              setStream(localStream);
              console.log("stream: ", localStream);
              call.answer(localStream!);
              call.on("stream", (remoteStream) => {
                console.log("playing remote stream");
                if (remoteRef.current) {
                  remoteRef.current!.srcObject = remoteStream;
                  if (remoteRef.current.paused) {
                    remoteRef.current.autoplay = true;
                  }
                }
              });
            });
          }
        }
      }
    };
    setTimeout(call, 1000);
    return () => {
      if (peer) {
        peer.off("call");
        console.log("peer off");
      }
    };
  }, [peer, players, localRef, remoteRef]);

  useEffect(() => {
    if (call) {
      console.log("last step debugging");
      call.on("stream", (remoteStream) => {
        console.log("playing remote stream");
        if (remoteRef.current) {
          remoteRef.current!.srcObject = remoteStream;
          if (remoteRef.current.paused) {
            remoteRef.current!.autoplay = true;
          }
        }
      });
      call.on("error", (err) => {
        console.log(err);
      });
    }
    return () => {
      if (call) {
        call.off("stream");
        call.off("error");
      }
    };
  }, [call]);

  useLayoutEffect(() => {
    document.title = `Room | ${roomCode}`;
  }, []);
  return (
    <div>
      Room
      {roomCode}
      {players.map((player, index) => (
        <div key={index}>
          {player.uname}-{player.id}
        </div>
      ))}
      <div id="live">
        <video id="remote-video" ref={remoteRef}></video>
        <video id="local-video" ref={localRef}></video>
        {/* <button id="end-call" onClick={}>
          End Call
        </button> */}
      </div>
    </div>
  );
};

export default Room;
