import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@radix-ui/react-select";
import { useCreateStream } from "@vidbloq/react";
import { Video } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { getWalletAddress } from "@/utils/walletStorage";

type CreateStreamProps = {
  roomName: string;
  setRoomName: (name: string) => void;
};

const CreateStream = ({ roomName, setRoomName }: CreateStreamProps) => {
  const { createStream, isLoading } = useCreateStream();
  const navigate = useNavigate();
  const [maxParticipants, setMaxParticipants] = useState("2");
  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;

    try {
      const walletAddress = getWalletAddress();
      if (!walletAddress) {
        throw new Error("Wallet address required to create room");
      }

      // Use the Vidbloq hook to create the stream
      const result = await createStream({
        wallet: walletAddress,
        title: roomName,
        callType: "video",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        streamSessionType: "Meeting" as any,
        isPublic: false,
      });

      if (result && result.id) {
        // Navigate to the newly created room
        navigate(`/video-call/${result.name}?creator=true`);
      } else {
        throw new Error("Failed to create stream - no stream ID returned");
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      // Use the error from the hook if available, otherwise use the caught error
      const errorMessage =
        error?.message ||
        (error instanceof Error ? error.message : "Unknown error");
      alert(`Failed to create room: ${errorMessage}`);
    }
  };
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="room-name">Room Title</Label>
        <Input
          id="room-name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter room title"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-participants">Max Participants</Label>
        <Select value={maxParticipants} onValueChange={setMaxParticipants}>
          <SelectTrigger>
            <SelectValue placeholder="Select max participants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 (1:1 Call)</SelectItem>
            <SelectItem value="4">4 (Small Group)</SelectItem>
            <SelectItem value="8">8 (Medium Group)</SelectItem>
            <SelectItem value="16">16 (Large Group)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-4">
        <Button
          onClick={handleCreateRoom}
          disabled={isLoading || !roomName.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Room...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Create Room
            </div>
          )}
        </Button>
      </div>
    </>
  );
};

export default CreateStream;
