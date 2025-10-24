/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  usePrejoin,
  useRequirePublicKey,
  useStreamContext,
  StreamView,
} from "@vidbloq/react";
import { LogIn } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const JoinStream = ({
  setRoomName,
}: {
  setRoomName: (name: string) => void;
}) => {
  const { publicKey } = useRequirePublicKey();
  const { nickname, setNickname, joinStream } = usePrejoin({
    publicKey,
  });
  const {
    token,
    roomName,
  } = useStreamContext();
  return (
    <>
      {token ? (
        <StreamView>
          <p>You can put your meeting components here</p>
        </StreamView>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="room-id">Room ID</Label>
            <Input
              id="room-id"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room ID"
              className="w-full"
            />
          </div>
          {/* nick name */}
          <div className="space-y-2">
            <Label htmlFor="nick-name">Nick Name</Label>
            <Input
              id="nick-name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter nick name"
              className="w-full"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={joinStream}
              // disabled={!roomName.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Join Room
              </div>
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default JoinStream;
