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
import { MdContentCopy, MdShare, MdCallEnd } from "react-icons/md";
import { AiOutlineAudioMuted, AiOutlineAudio } from "react-icons/ai";
import {BiVideoOff, BiVideo} from "react-icons/bi";

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
  const [isMuted, setIsMuted] = useState([true, true]);
  const [isBlinded, setIsBlinded] = useState([false,false]);
  const [autoPlay, setAutoPlay] = useState(false);

  const copyManager = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Room Link copied to clipboard");
  };
  const shareManager = () => {
    navigator.share({
      title: document.title,
      text: "Come join your friends at oAuthVC!",
      url: window.location.href,
    });
  };

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
          // config: {
          //   iceServers: [
          //     { url: "stun:stun01.sipphone.com" },
          //     { url: "stun:stun.ekiga.net" },
          //     { url: "stun:stunserver.org" },
          //     { url: "stun:stun.softjoys.com" },
          //     { url: "stun:stun.voiparound.com" },
          //     { url: "stun:stun.voipbuster.com" },
          //     { url: "stun:stun.voipstunt.com" },
          //     { url: "stun:stun.voxgratia.org" },
          //     { url: "stun:stun.xten.com" },
          //     {
          //       url: "turn:192.158.29.39:3478?transport=udp",
          //       credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          //       username: "28224511:1379330808",
          //     },
          //     {
          //       url: "turn:192.158.29.39:3478?transport=tcp",
          //       credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          //       username: "28224511:1379330808",
          //     },
          //   ],
          // },
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
    const call = async () => {
      if (players.length === 2) {
        console.log("b");
        if (peer) {
          console.log("c");
          if (players[1].uname === user.name) {
            console.log(
              "calling: ",
              players[0].id + "peervc",
              " from: ",
              players[1].id + "peervc"
            );
            const localStream =
              await window.navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });
            setStream(localStream);
            // peer.connect(players[1].id + "peervc");
            // make the call
            console.log("caller stream:" + localStream!);
            // peer.connect(players[0].id + "peervc");
            const call = peer.call(players[0].id + "peervc", localStream!);
            setAutoPlay(true);
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
              console.log("localstream: ", localStream);
              setAutoPlay(true);
              call.answer(localStream!);
              setCall(call);
              call.on("stream", (remoteStream) => {
                console.log("playing remote stream");
                setAutoPlay(true);
                if (remoteRef.current) {
                  remoteRef.current!.srcObject = remoteStream;
                    remoteRef.current.autoplay = true;
                    isMuted[1] = true;
                    localRef.current!.muted = true;
                }
              });
            });
          }
        }
      }
    };
    // setTimeout(call, 1000);
    call();
  }, [peer, players, localRef, remoteRef]);

  useEffect(() => {
    if (call) {
      console.log("last step debugging");
      setAutoPlay(true);
      call.on("stream", (remoteStream) => {
        console.log("playing remote stream");
        if (remoteRef.current) {
          remoteRef.current!.srcObject = remoteStream;
            remoteRef.current!.autoplay = true;
            isMuted[1] = true;
            localRef.current!.muted = true;
        }
      });
      call.on("error", (err) => {
        console.log(err);
      });
      call.on("close", () => {
        setAutoPlay(false);
        remoteRef.current!.autoplay = false;
      });
      
    }
    return () => {
      if (call) {
        call.off("stream");
        call.off("error");
        call.off("close");
      }
    };
  }, [call]);

  useLayoutEffect(() => {
    document.title = `Room | ${roomCode}`;
  }, []);
  return (
    <div className="room flex flex-col items-center text-center justify-around h-full w-full ">
      <div className="bg-bg-secondary p-2 rounded-md">
        <div className="flex flex-row justify-around items-center mb-5">
          {navigator.share! && (
            <button
              className="copyButton bg-brand-primary text-brand-tertiary font-bold py-2 pl-2 pr-3 rounded-l-full hover:scale-110 transition-all"
              onClick={shareManager}
            >
              <MdShare />
            </button>
          )}
          <div className="copyField select-all text-center w-full bg-white h-max py-1">
            {roomCode}
          </div>
          <button
            className="copyButton bg-brand-primary text-brand-tertiary font-bold py-2 pl-2 pr-3 rounded-r-full hover:scale-110 transition-all"
            onClick={copyManager}
          >
            <MdContentCopy />
          </button>
        </div>
        {players.map((player, index) => (
          <div key={index}>
            {index + 1}){player.uname}
          </div>
        ))}
      </div>
      <div
        id="live"
        className="flex items-center justify-center bg-bg-secondary p-2 rounded-md w-11/12"
      >
        {autoPlay && (
          <>
            <div className="w-1/2 vid containers pr-1">
              <video
                id="remote-video"
                className="rounded-md w-full"
                ref={remoteRef}
              ></video>
              <div
                className="bg-white rounded-full p-2 absolute -translate-y-10 translate-x-2 cursor-pointer"
                onClick={() => {
                  console.log("clicked mute");
                  setIsMuted([!isMuted[0], isMuted[1]]);
                  if (remoteRef.current) {
                    remoteRef.current.muted = !remoteRef.current.muted;
                  }
                }}
              >
                {!isMuted[0] ? <AiOutlineAudioMuted /> : <AiOutlineAudio />}
              </div>
              <div
                className="bg-white rounded-full p-2 absolute -translate-y-10 translate-x-12 cursor-pointer"
                onClick={() => {
                  console.log("clicked blinded");
                  setIsBlinded([!isBlinded[0], isBlinded[1]]);
                  if (remoteRef.current) {
                    remoteRef.current.paused
                      ? remoteRef.current.play()
                      : remoteRef.current.pause();
                  }
                }}
              >
                {!isBlinded[0] ? <BiVideo /> : <BiVideoOff />}
              </div>
            </div>
          </>
        )}
        <div className="w-1/2 vid containers pl-1">
          <video
            id="local-video"
            className="rounded-md w-full"
            ref={localRef}
          ></video>
          <div
            className="bg-white rounded-full p-2 absolute -translate-y-10 translate-x-2 cursor-pointer"
            onClick={() => {
              console.log("clicked mute");
              setIsMuted([isMuted[0], !isMuted[1]]);
              if (localRef.current) {
                localRef.current.muted = !localRef.current.muted;
              }
            }}
          >
            {!isMuted[1] ? <AiOutlineAudioMuted /> : <AiOutlineAudio />}
          </div>
          <div
            className="bg-white rounded-full p-2 absolute -translate-y-10 translate-x-12 cursor-pointer"
            onClick={() => {
              console.log("clicked blinded");
              setIsBlinded([isBlinded[0], !isBlinded[1]]);
              if (localRef.current) {
                localRef.current.paused
                  ? localRef.current.play()
                  : localRef.current.pause();
              }
            }}
          >
            {!isBlinded[1] ? <BiVideo /> : <BiVideoOff />}
          </div>
        </div>
      </div>
      <div
        className="endcall bg-brand-primary p-8 rounded-full hover:scale-110 transition-all cursor-pointer"
        onClick={() => {
          //end call
          call?.close();
          stream?.getTracks().forEach(function (track) {
            track.stop();
          });
          navigate("/vc");
        }}
      >
        <MdCallEnd size={20} />
      </div>
    </div>
  );
};

export default Room;
