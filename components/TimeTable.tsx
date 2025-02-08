"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addMinutes, format, subDays, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ChevronLeft, ChevronRight, PlusIcon, X } from "lucide-react";
import { getKazakhstanTime, formatKazakhstanTime } from "@/lib/date";
import { ThemeToggle } from "@/components/theme-toggle";

const WASH_MODES = {
  delicate: { name: "Деликатная", duration: 75 },
  quick: { name: "Быстрая 30", duration: 35 },
};

const BOOKING_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFD93D",
  "#FF8E9E",
];

const WORKING_HOURS = {
  start: 8,  // 8:00
  end: 20,   // 20:00
};

// Добавим тип для сырых данных с сервера
interface BookingFromServer {
  _id: string;           // MongoDB ID
  roomBed: string;       // "301-1"
  startTime: string;     // ISO string
  endTime: string;       // ISO string
  mode: keyof typeof WASH_MODES;
  color: string;
  createdAt: string;     // ISO string
}

interface Booking {
  id: string;
  roomBed: string;
  startTime: Date;
  endTime: Date;
  mode: keyof typeof WASH_MODES;
  color: string;
  createdAt: Date;
}

export function TimeTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedMode, setSelectedMode] = useState<keyof typeof WASH_MODES>("quick");
  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedBed, setSelectedBed] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isTimeHighlighted, setIsTimeHighlighted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday' | 'twoDaysAgo'>('today');
  const [currentTime, setCurrentTime] = useState(getKazakhstanTime());
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

  // Загружаем бронирования при монтировании
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        const parsedBookings = data.map((booking: BookingFromServer) => ({
          id: booking._id,
          roomBed: booking.roomBed,
          startTime: new Date(booking.startTime),
          endTime: new Date(booking.endTime),
          mode: booking.mode,
          color: booking.color,
          createdAt: new Date(booking.createdAt)
        }));
        setBookings(parsedBookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  // Обновляем текущее время каждую минуту
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getKazakhstanTime());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const today = getKazakhstanTime();
  const yesterday = subDays(today, 1);
  const twoDaysAgo = subDays(today, 2);

  const rooms = Array.from({ length: 12 }, (_, i) => (301 + i).toString());
  const beds = Array.from({ length: 4 }, (_, i) => (i + 1).toString());

  const getDateBySelection = (selection: typeof selectedDate) => {
    switch (selection) {
      case 'today': return today;
      case 'yesterday': return yesterday;
      case 'twoDaysAgo': return twoDaysAgo;
    }
  };

  const getDateTitle = (selection: typeof selectedDate) => {
    switch (selection) {
      case 'today': return 'Бүгін';
      case 'yesterday': return 'Кеше';
      case 'twoDaysAgo': return 'Алдыңғы күні';
    }
  };

  // Функция для получения случайного цвета
  const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * BOOKING_COLORS.length);
    return BOOKING_COLORS[randomIndex];
  };

  const handleAddBooking = async () => {
    if (!selectedRoom || !selectedBed) {
      setAlertMessage("Бөлме мен орынды таңдаңыз");
      setShowAlert(true);
      return;
    }

    const startTime = getKazakhstanTime();
    startTime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
    const endTime = addMinutes(startTime, WASH_MODES[selectedMode].duration);

    // Проверка на рабочие часы
    const bookingHour = parseInt(selectedHour);
    if (bookingHour < WORKING_HOURS.start || bookingHour >= WORKING_HOURS.end) {
      setAlertMessage("Бұл уақытта жұмыс істемейді");
      setShowAlert(true);
      return;
    }

    // Проверка на прошедшее время
    const now = getKazakhstanTime();
    const isInPast = startTime < now && (
      startTime.getHours() < now.getHours() ||
      (startTime.getHours() === now.getHours() && startTime.getMinutes() < now.getMinutes())
    );

    if (isInPast) {
      setAlertMessage("Мүмкін емес");
      setShowAlert(true);
      return;
    }

    // Проверка на пересечение времени
    const hasOverlap = bookings.some((booking) => {
      // Разрешаем начало нового бронирования точно в момент окончания предыдущего
      // и окончание нового бронирования точно в момент начала следующего
      return (
        (startTime < booking.endTime && endTime > booking.startTime) && // общая проверка на пересечение
        !(
          startTime.getTime() === booking.endTime.getTime() || // разрешаем начало в момент окончания другого
          endTime.getTime() === booking.startTime.getTime()    // разрешаем окончание в момент начала другого
        )
      );
    });

    if (hasOverlap) {
      setAlertMessage("Бұл уақыт бос емес");
      setShowAlert(true);
      return;
    }

    // Проверка на время окончания
    if (endTime.getHours() >= 21) {
      setAlertMessage("Стирка должна закончиться до 21:00");
      setShowAlert(true);
      return;
    }

    const newBooking: Booking = {
      id: Math.random().toString(),
      roomBed: `${selectedRoom}-${selectedBed}`,
      startTime,
      endTime,
      mode: selectedMode,
      color: getRandomColor(),
      createdAt: new Date(),
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBooking),
      });

      if (!response.ok) throw new Error('Failed to save booking');

      const savedBooking = await response.json();

      setBookings([...bookings, {
        ...newBooking,
        id: savedBooking._id
      }]);

      if (isBookingFormOpen) {
        setIsBookingFormOpen(false);
      }
    } catch (error) {
      console.error('Failed to save booking:', error);
      setAlertMessage("Сақтау кезінде қате шықты");
      setShowAlert(true);
    }
  };

  const findNextAvailableTime = () => {
    if (!selectedRoom || !selectedBed) {
      setAlertMessage("Алдымен бөлме мен орынды таңдаңыз");
      setShowAlert(true);
      return;
    }

    if (!selectedMode) {
      setAlertMessage("Алдымен режимді таңдаңыз");
      setShowAlert(true);
      return;
    }

    const now = getKazakhstanTime();
    const currentHour = now.getHours();

    // Если текущее время меньше времени открытия
    if (currentHour < WORKING_HOURS.start) {
      setSelectedHour(WORKING_HOURS.start.toString().padStart(2, '0'));
      setSelectedMinute("00");
      setIsTimeHighlighted(true);
      setTimeout(() => setIsTimeHighlighted(false), 1000);
      return;
    }

    // Получаем все бронирования на сегодня, отсортированные по времени начала
    const todayBookings = bookings
      .filter(booking => isSameDay(booking.startTime, today))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Начинаем с текущего времени
    let startTime = new Date(now);
    startTime.setSeconds(0, 0);

    // Если сейчас раньше 8:00, начинаем с 8:00
    if (startTime.getHours() < WORKING_HOURS.start) {
      startTime.setHours(WORKING_HOURS.start, 0, 0, 0);
    }

    const requiredDuration = WASH_MODES[selectedMode].duration;

    // Проверяем каждый промежуток между бронированиями
    for (let i = 0; i <= todayBookings.length; i++) {
      const currentSlotStart = i === 0 ? startTime : todayBookings[i - 1].endTime;
      const currentSlotEnd = i === todayBookings.length
        ? new Date(today.setHours(WORKING_HOURS.end, 0, 0, 0))
        : todayBookings[i].startTime;

      // Проверяем, достаточно ли времени в текущем промежутке
      const slotDuration = (currentSlotEnd.getTime() - currentSlotStart.getTime()) / (1000 * 60);

      if (slotDuration >= requiredDuration) {
        // Если текущее время больше начала слота, используем текущее время
        const actualStartTime = startTime > currentSlotStart ? startTime : currentSlotStart;
        const proposedEndTime = addMinutes(actualStartTime, requiredDuration);

        // Проверяем, что стирка закончится до закрытия
        if (proposedEndTime.getHours() >= WORKING_HOURS.end) {
          setAlertMessage("Бүгінге бос орын жоқ");
          setShowAlert(true);
          return;
        }

        // Проверяем, что нет пересечений с другими бронированиями
        const hasOverlap = todayBookings.some(booking => {
          return (
            (actualStartTime < booking.endTime && proposedEndTime > booking.startTime) &&
            !(
              actualStartTime.getTime() === booking.endTime.getTime() ||
              proposedEndTime.getTime() === booking.startTime.getTime()
            )
          );
        });

        if (!hasOverlap) {
          // Нашли подходящий слот без пересечений
          setSelectedHour(actualStartTime.getHours().toString().padStart(2, '0'));
          setSelectedMinute(actualStartTime.getMinutes().toString().padStart(2, '0'));
          setIsTimeHighlighted(true);
          setTimeout(() => setIsTimeHighlighted(false), 1000);
          return;
        }
      }
    }

    // Если не нашли свободных слотов
    setAlertMessage("Бүгінге бос орын жоқ");
    setShowAlert(true);
  };

  const sortedBookings = [...bookings]
    .filter(booking =>
      isSameDay(booking.startTime, today) ||
      isSameDay(booking.startTime, yesterday)
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="space-y-8 relative min-h-screen">
      {/* Desktop версия */}
      <div className="hidden md:block">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold">Бүгінге жазылу</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-500">
                  Қазіргі уақыт: {formatKazakhstanTime(currentTime)}
                </div>
                <div className="text-xs text-gray-400">
                  Жұмыс күндері 15:00 - 20:00
                  <br />
                  Демалыс күндері 9:00 - 20:00
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Бөлме</label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="w-full h-12 dark:bg-zinc-800 dark:border-zinc-700">
                      <SelectValue placeholder="Бөлмені таңдаңыз" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room} value={room} className="h-11">
                          Бөлме {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRoom && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Орын</label>
                    <Select value={selectedBed} onValueChange={setSelectedBed}>
                      <SelectTrigger className="w-full h-12 dark:bg-zinc-800 dark:border-zinc-700">
                        <SelectValue placeholder="Орынды таңдаңыз" />
                      </SelectTrigger>
                      <SelectContent>
                        {beds.map((bed) => (
                          <SelectItem key={bed} value={bed} className="h-11">
                            Орын {selectedRoom}-{bed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedRoom && selectedBed && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Режим</label>
                    <Select value={selectedMode} onValueChange={(value: keyof typeof WASH_MODES) => setSelectedMode(value)}>
                      <SelectTrigger className="w-full h-12 dark:bg-zinc-800 dark:border-zinc-700">
                        <SelectValue placeholder="Режимді таңдаңыз" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WASH_MODES).map(([key, { name }]) => (
                          <SelectItem key={key} value={key} className="h-11">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={findNextAvailableTime}
                  variant="outline"
                  className="w-full h-12 text-base dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700"
                >
                  Жақын арадағы бос уақыт
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Басталу уақыты</label>
                <div className="flex gap-3">
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger
                      className={`w-[120px] h-12 transition-all duration-300 ${isTimeHighlighted ? 'ring-2 ring-offset-2 ring-primary animate-pulse' : ''
                        }`}
                    >
                      <SelectValue placeholder="Час" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 14 }, (_, i) => i + 8).map((hour) => (
                        <SelectItem
                          key={hour}
                          value={hour.toString().padStart(2, '0')}
                          className="h-11"
                        >
                          {hour.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="flex items-center text-lg">:</span>
                  <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                    <SelectTrigger
                      className={`w-[120px] transition-all h-12 dark:bg-zinc-800 dark:border-zinc-700 ${isTimeHighlighted ? 'ring-2 ring-offset-2 ring-primary animate-pulse' : ''
                        }`}
                    >
                      <SelectValue placeholder="Минуты" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                        <SelectItem
                          key={minute}
                          value={minute.toString().padStart(2, '0')}
                          className="h-11"
                        >
                          {minute.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAddBooking}
                className="w-full h-12 text-base"
              >
                Жазылу
              </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (selectedDate === 'today') setSelectedDate('yesterday');
                      else if (selectedDate === 'yesterday') setSelectedDate('twoDaysAgo');
                    }}
                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${selectedDate !== 'today' ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    disabled={selectedDate === 'twoDaysAgo'}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h4 className="text-lg font-medium">
                    {getDateTitle(selectedDate)}
                  </h4>
                  <button
                    onClick={() => {
                      if (selectedDate === 'twoDaysAgo') setSelectedDate('yesterday');
                      else if (selectedDate === 'yesterday') setSelectedDate('today');
                    }}
                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${selectedDate !== 'twoDaysAgo' ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    disabled={selectedDate === 'today'}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {format(getDateBySelection(selectedDate), "d MMMM", { locale: ru })}
                </div>
              </div>

              <div className="relative h-[1000px] bg-gray-50 dark:bg-zinc-950/50">
                {/* Горизонтальные разделители для часов */}
                <div className="absolute inset-0 left-20">
                  {Array.from({ length: 14 }, (_, i) => i + 8).map((hour, index) => (
                    <div
                      key={hour}
                      className={`absolute w-full border-t border-gray-200 dark:border-zinc-800 ${index === 0 ? 'border-t-0' : ''
                        } ${index === 13 ? 'border-b-0' : ''
                        }`}
                      style={{
                        top: `${(index * 100) / 14}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Временная шкала слева - десктопная версия */}
                <div className="absolute left-0 top-0 bottom-0 w-20">
                  {Array.from({ length: 14 }, (_, i) => i + 8).map((hour, index) => (
                    <div
                      key={hour}
                      className="absolute w-full flex items-center justify-end px-4 text-sm text-gray-500 dark:text-zinc-400"
                      style={{
                        height: `${100 / 14}%`,
                        top: `${(index * 100) / 14}%`,
                      }}
                    >
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Контейнер для бронирований */}
                <div className="absolute left-20 right-0 top-0 bottom-0">
                  {sortedBookings
                    .filter(booking =>
                      isSameDay(booking.startTime, getDateBySelection(selectedDate))
                    )
                    .map((booking) => {
                      const startHour = booking.startTime.getHours();
                      const startMinute = booking.startTime.getMinutes();
                      const durationMinutes = WASH_MODES[booking.mode].duration;

                      const totalMinutesInDay = 14 * 60;
                      const startMinutesFromEight = ((startHour - 8) * 60) + startMinute;
                      const startPosition = (startMinutesFromEight / totalMinutesInDay) * 100;
                      const height = (durationMinutes / totalMinutesInDay) * 100;

                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="absolute left-3 right-3 rounded-md shadow-sm dark:shadow-zinc-900/50"
                          style={{
                            top: `${startPosition}%`,
                            height: `${height}%`,
                            backgroundColor: booking.color,
                            zIndex: 10
                          }}
                        >
                          <div className="p-3 h-full flex items-center">
                            <div className="text-sm flex items-center gap-3 whitespace-nowrap overflow-hidden">
                              <span className="font-medium">{booking.roomBed}</span>
                              <span className="h-4 w-px bg-gray-300 dark:bg-zinc-700"></span>
                              <span>{format(booking.startTime, "HH:mm")} - {format(booking.endTime, "HH:mm")}</span>
                              <span className="h-4 w-px bg-gray-300 dark:bg-zinc-700"></span>
                              <span>{WASH_MODES[booking.mode].name}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Мобильная версия */}
      <div className="md:hidden">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedDate === 'today') setSelectedDate('yesterday');
                    else if (selectedDate === 'yesterday') setSelectedDate('twoDaysAgo');
                  }}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${selectedDate !== 'today' ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  disabled={selectedDate === 'twoDaysAgo'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h4 className="text-base font-medium">
                  {getDateTitle(selectedDate)}
                </h4>
                <button
                  onClick={() => {
                    if (selectedDate === 'twoDaysAgo') setSelectedDate('yesterday');
                    else if (selectedDate === 'yesterday') setSelectedDate('today');
                  }}
                  className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${selectedDate !== 'twoDaysAgo' ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  disabled={selectedDate === 'today'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <ThemeToggle />
              <div className="text-sm text-gray-500">
                {formatKazakhstanTime(currentTime)}
              </div>
              <div className="text-xs text-gray-400">
                Жұмыс күндері 15:00 - 20:00
                <br />
                Демалыс күндері 9:00 - 20:00
              </div>
            </div>
          </div>

          {/* Timetable для мобильной версии */}
          <div className="relative h-[1000px] bg-gray-50 dark:bg-zinc-950/50 rounded-lg">
            {/* Горизонтальные разделители для часов */}
            <div className="absolute inset-0 left-20">
              {Array.from({ length: 14 }, (_, i) => i + 8).map((hour, index) => (
                <div
                  key={hour}
                  className={`absolute w-full border-t border-gray-200 dark:border-zinc-800 ${index === 0 ? 'border-t-0' : ''
                    } ${index === 13 ? 'border-b-0' : ''
                    }`}
                  style={{
                    top: `${(index * 100) / 14}%`,
                  }}
                />
              ))}
            </div>

            {/* Временная шкала слева - мобильная версия */}
            <div className="absolute left-0 top-0 bottom-0 w-20">
              {Array.from({ length: 14 }, (_, i) => i + 8).map((hour, index) => (
                <div
                  key={hour}
                  className="absolute w-full flex items-center justify-end px-4 text-sm text-gray-500 dark:text-zinc-400"
                  style={{
                    height: `${100 / 14}%`,
                    top: `${(index * 100) / 14}%`,
                  }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Контейнер для бронирований */}
            <div className="absolute left-20 right-0 top-0 bottom-0">
              {sortedBookings
                .filter(booking =>
                  isSameDay(booking.startTime, getDateBySelection(selectedDate))
                )
                .map((booking) => {
                  const startHour = booking.startTime.getHours();
                  const startMinute = booking.startTime.getMinutes();
                  const durationMinutes = WASH_MODES[booking.mode].duration;

                  const totalMinutesInDay = 14 * 60;
                  const startMinutesFromEight = ((startHour - 8) * 60) + startMinute;
                  const startPosition = (startMinutesFromEight / totalMinutesInDay) * 100;
                  const height = (durationMinutes / totalMinutesInDay) * 100;

                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute left-3 right-3 rounded-md shadow-sm dark:shadow-zinc-900/50"
                      style={{
                        top: `${startPosition}%`,
                        height: `${height}%`,
                        backgroundColor: booking.color,
                        zIndex: 10,
                        minHeight: "2.5rem"
                      }}
                    >
                      <div className="p-2 h-full flex items-center">
                        <div className="text-xs flex items-center gap-2 whitespace-nowrap overflow-hidden">
                          <span className="font-medium">{booking.roomBed}</span>
                          <span className="h-3 w-px bg-gray-300 dark:bg-zinc-700"></span>
                          <span>{format(booking.startTime, "HH:mm")} - {format(booking.endTime, "HH:mm")}</span>
                          <span className="h-3 w-px bg-gray-300 dark:bg-zinc-700"></span>
                          <span>{WASH_MODES[booking.mode].name}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Добавляем отступ снизу для прокрутки */}
        <div className="h-[70vh]" />

        {/* Плавающая кнопка */}
        <AnimatePresence>
          {!isBookingFormOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed bottom-6 right-6 z-[100]"
              style={{ pointerEvents: "none" }}
            >
              <motion.button
                onClick={() => setIsBookingFormOpen(true)}
                className="w-14 h-14 bg-primary hover:bg-primary/90 dark:bg-primary/90 dark:hover:bg-primary rounded-full shadow-lg flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ pointerEvents: "auto" }}
              >
                <PlusIcon className="w-6 h-6 text-white dark:text-zinc-900" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Мобильная форма бронирования */}
        <AnimatePresence>
          {isBookingFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsBookingFormOpen(false);
                }
              }}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 rounded-t-xl p-6 overflow-y-auto"
                style={{
                  maxHeight: "85vh",
                  touchAction: "none"
                }}
              >
                <div className="w-12 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Жаңа жазылым</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsBookingFormOpen(false)}
                      className="dark:hover:bg-zinc-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Форма бронирования */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Бөлме</label>
                      <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                        <SelectTrigger className="w-full h-12 dark:bg-zinc-800 dark:border-zinc-700">
                          <SelectValue placeholder="Бөлмені таңдаңыз" />
                        </SelectTrigger>
                        <SelectContent position="popper" side="top" align="start">
                          {rooms.map((room) => (
                            <SelectItem key={room} value={room}>
                              Бөлме {room}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRoom && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Орын</label>
                        <Select value={selectedBed} onValueChange={setSelectedBed}>
                          <SelectTrigger className="w-full h-12 dark:bg-zinc-800 dark:border-zinc-700">
                            <SelectValue placeholder="Орынды таңдаңыз" />
                          </SelectTrigger>
                          <SelectContent position="popper" side="top" align="start">
                            {beds.map((bed) => (
                              <SelectItem key={bed} value={bed}>
                                Орын {selectedRoom}-{bed}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedRoom && selectedBed && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Режим</label>
                        <Select value={selectedMode} onValueChange={(value: keyof typeof WASH_MODES) => setSelectedMode(value)}>
                          <SelectTrigger className="w-full h-12 dark:bg-zinc-800 dark:border-zinc-700">
                            <SelectValue placeholder="Режимді таңдаңыз" />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {Object.entries(WASH_MODES).map(([key, { name }]) => (
                              <SelectItem key={key} value={key}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button
                      onClick={findNextAvailableTime}
                      variant="outline"
                      className="w-full h-12 text-base dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700"
                    >
                      Жақын арадағы бос уақыт
                    </Button>

                    <div>
                      <label className="block text-sm font-medium mb-2">Басталу уақыты</label>
                      <div className="flex gap-2">
                        <Select value={selectedHour} onValueChange={setSelectedHour}>
                          <SelectTrigger
                            className={`w-[120px] transition-all duration-300 ${isTimeHighlighted ? 'ring-2 ring-offset-2 ring-primary animate-pulse' : ''
                              }`}
                          >
                            <SelectValue placeholder="Час" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 14 }, (_, i) => i + 8).map((hour) => (
                              <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                                {hour.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="flex items-center">:</span>
                        <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                          <SelectTrigger
                            className={`w-[120px] transition-all duration-300 ${isTimeHighlighted ? 'ring-2 ring-offset-2 ring-primary animate-pulse' : ''
                              }`}
                          >
                            <SelectValue placeholder="Минуты" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                              <SelectItem
                                key={minute}
                                value={minute.toString().padStart(2, '0')}
                                className="h-11"
                              >
                                {minute.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Кнопки внизу формы */}
                    <div className="flex gap-2 sticky bottom-0 pt-4 bg-white dark:bg-zinc-800">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsBookingFormOpen(false)}
                      >
                        Болдырмау
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          handleAddBooking();
                          setIsBookingFormOpen(false);
                        }}
                      >
                        Жазылу
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Внимание</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 