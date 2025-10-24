import { useState } from "react";
import { useParams } from "react-router-dom";
import { StreamRoom } from "@vidbloq/react";
import CreateStream from "./create-stream";
import JoinStream from "./join-stream";

const StreamContainer = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [view] = useState<"create" | "join" | "room">(
    sessionId ? "room" : "create"
  );
  const [roomName, setRoomName] = useState("");

  console.log(sessionId);
  return (
    <>
      {view === "create" && (
        <CreateStream roomName={roomName} setRoomName={setRoomName} />
      )}
      <StreamRoom roomName={sessionId as string}>
        <JoinStream setRoomName={setRoomName} />
      </StreamRoom>
    </>
  );
};

export default StreamContainer;
