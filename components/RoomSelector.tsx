"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface RoomSelectorProps {
  selectedRoom: string;
  selectedBed: string;
  onRoomChange: (room: string) => void;
  onBedChange: (bed: string) => void;
}

export function RoomSelector({
  selectedRoom,
  selectedBed,
  onRoomChange,
  onBedChange,
}: RoomSelectorProps) {
  const rooms = Array.from({ length: 12 }, (_, i) => (301 + i).toString());
  const beds = Array.from({ length: 4 }, (_, i) => (i + 1).toString());

  return (
    <div className="space-y-4">
      <Select value={selectedRoom} onValueChange={onRoomChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Бөлмені таңдау" />
        </SelectTrigger>
        <SelectContent>
          {rooms.map((room) => (
            <SelectItem key={room} value={room}>
              Комната {room}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedRoom && (
        <Select value={selectedBed} onValueChange={onBedChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Орынды таңдау" />
          </SelectTrigger>
          <SelectContent>
            {beds.map((bed) => (
              <SelectItem key={bed} value={bed}>
                Орын {selectedRoom}-{bed}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 