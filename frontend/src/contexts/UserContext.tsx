import { createContext, useEffect, useState } from "react";

const UserContext = createContext<any>({});

export const UserContextProvider = ({ children }) => {
  const URL = import.meta.env.PROD
    ? window.location.hostname
    : window.location.hostname + ":5000";
  const [user, setUser] = useState({name:"",isLoggedIn:false});

  // const getUser = async () => {
  //   console.log("getting user");
  //   try {
  //     const res = await fetch(`http://${URL}/api/getuser`, {
  //       credentials: "include",
  //     });
  //     const data = await res.json();
  //     console.log(data);
  //     // setUser(data);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };
  useEffect(() => {
    const dataFetch=async () => {
      try {
        const res = await fetch(`http://${URL}/api/getuser`, {
          credentials: "include",
        });
        const data = await res.json();
        console.log(data);
        if (data) {
          console.log("yes user");
          return { name: data.username, isLoggedIn: true };
        } else {
          console.log("no user");
          return { name: "", isLoggedIn: false };
        }
        // setUser(data);
      } catch (err) {
        console.log(err);
      }
    };
    dataFetch().then((data) => setUser(data!));
  }, []);

  return (
    <UserContext.Provider value={{ user: user, setUser: setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
