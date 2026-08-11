// dummyData.ts

export interface ITimeSlot {
  timeSlotId: string;                 // PK (misal di-UUID)
  startTime: string;                  // HH:mm
  endTime: string;                    // HH:mm
  status: "Available" | "Booked";
  bookedByUserId?: string;            // relasi ke User table (jika ada)
}

export interface IRoom {
  roomId: string;                     // PK
  sizeName: string;                   // misal: 'Small', 'Middle', 'Large'
  roomName: string;                   // misal: 'Melati', 'Mawar', dll
  capacity: number;
  image?: string;                     // opsional: url/path ke gambar
  assetList: string[];                // atau relasi ke tabel Asset
  timeSlots: ITimeSlot[];            // slot waktu terpakai/tersedia
}

export interface ITransport {
  transportId: string;               // PK
  transportName: string;             // misal: 'Kijang Innova', 'Alphard'
  capacity: string;                  // '7 seats'
  image?: string;                    // opsional
  driverName?: string;               // tambahkan field ini
  timeSlots: ITimeSlot[];            // slot waktu terpakai/tersedia
}


export interface IMeeting {
  meetingId: string;                 // PK
  meetingDate: string;               // YYYY-MM-DD
  startTime: string;                 // HH:mm
  endTime: string;                   // HH:mm
  title: string;
  roomId: string;                    // relasi ke IRoom
  isOngoing: boolean;                // true jika sedang berlangsung
  description?: string;              // opsional: deskripsi meeting
  participants?: {
    avatar: string;                  // URL atau path ke avatar pengguna
  }[];                               // daftar partisipan
}

export interface ITransportBooking {
  transportBookingId: string;        // PK
  bookingDate: string;               // YYYY-MM-DD
  startTime: string;                 // HH:mm
  endTime: string;                   // HH:mm
  title: string;
  transportId: string;               // relasi ke ITransport
  driverName?: string;               // nama driver (opsional)
  isOngoing: boolean;
  description?: string;              // opsional: deskripsi booking
  participants?: {
    avatar: string;                  // URL atau path ke avatar pengguna
  }[];                               // daftar partisipan
}

import { icons } from "@/constants";
export const assetIcons = {
  Mic: icons.mic,
  Projector: icons.projector,
  Whiteboard: icons.whiteboard,
  WiFi: icons.wifi,
  AC: icons.ac,
};

export interface ICommonTimeSlots {
  morning: string[];
  afternoon: string[];
}

export const commonTimeSlots: ICommonTimeSlots = {
  morning: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM"],
  afternoon: ["12:30 PM","01:00 PM","01:30 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM","05:00 PM","05:30 PM"]
};

export const rooms: IRoom[] = [
  {
    roomId: "R1",
    sizeName: "Small",
    roomName: "Melati",
    capacity: 3,
    image: require("@/assets/images/small-room.jpg"),
    assetList: ["Mic", "Projector", "Whiteboard"],
    timeSlots: [
      {
        timeSlotId: "TS1",
        startTime: "08:00",
        endTime: "09:00",
        status: "Booked",
        bookedByUserId: "U-MarketingTeam"
      },
      {
        timeSlotId: "TS2",
        startTime: "09:00",
        endTime: "10:00",
        status: "Booked",
        bookedByUserId: "U-MarketingTeam"
      },
      {
        timeSlotId: "TS3",
        startTime: "10:00",
        endTime: "11:00",
        status: "Booked",
        bookedByUserId: "U-MarketingTeam"
      },
      {
        timeSlotId: "TS4",
        startTime: "11:00",
        endTime: "12:00",
        status: "Booked",
        bookedByUserId: "U-MarketingTeam"
      },
      {
        timeSlotId: "TS5",
        startTime: "13:00",
        endTime: "14:00",
        status: "Booked",
        bookedByUserId: "U-MarketingTeam"
      },
      {
        timeSlotId: "TS6",
        startTime: "14:00",
        endTime: "15:00",
        status: "Booked",
        bookedByUserId: "U-HRDepartment"
      },
      {
        timeSlotId: "TS7",
        startTime: "15:00",
        endTime: "16:00",
        status: "Booked",
        bookedByUserId: "U-MarketingTeam"
      },
      {
        timeSlotId: "TS8",
        startTime: "16:00",
        endTime: "17:00",
        status: "Booked",
        bookedByUserId: "U-MarketingTeam"
      },
    ],
  },
  {
    roomId: "R2",
    sizeName: "Middle",
    roomName: "Mawar",
    capacity: 8,
    image: require("@/assets/images/middle-room.jpg"),
    assetList: ["Mic", "Projector", "WiFi"],
    timeSlots: [
      {
        timeSlotId: "TS9",
        startTime: "08:00",
        endTime: "09:00",
        status: "Booked",
        bookedByUserId: "U-ITTeam"
      },
      {
        timeSlotId: "TS10",
        startTime: "09:00",
        endTime: "10:00",
        status: "Booked",
        bookedByUserId: "U-ITTeam"
      },
      {
        timeSlotId: "TS11",
        startTime: "10:00",
        endTime: "11:00",
        status: "Available"
      },
      {
        timeSlotId: "TS12",
        startTime: "11:00",
        endTime: "12:00",
        status: "Available"
      },
      {
        timeSlotId: "TS13",
        startTime: "13:00",
        endTime: "14:00",
        status: "Booked",
        bookedByUserId: "U-FinanceTeam"
      },
      {
        timeSlotId: "TS14",
        startTime: "14:00",
        endTime: "15:00",
        status: "Booked",
        bookedByUserId: "U-FinanceTeam"
      },
      {
        timeSlotId: "TS15",
        startTime: "15:00",
        endTime: "16:00",
        status: "Available"
      },
      {
        timeSlotId: "TS16",
        startTime: "16:00",
        endTime: "17:00",
        status: "Available"
      },
    ],
  },
  {
    roomId: "R3",
    sizeName: "Big",
    roomName: "Anggrek",
    capacity: 12,
    image: require("@/assets/images/big-room.jpg"),
    assetList: ["Mic", "Projector", "AC"],
    timeSlots: [
      {
        timeSlotId: "TS17",
        startTime: "08:00",
        endTime: "09:00",
        status: "Available"
      },
      {
        timeSlotId: "TS18",
        startTime: "09:00",
        endTime: "10:00",
        status: "Available"
      },
      {
        timeSlotId: "TS19",
        startTime: "10:00",
        endTime: "11:00",
        status: "Available"
      },
      {
        timeSlotId: "TS20",
        startTime: "11:00",
        endTime: "12:00",
        status: "Booked",
        bookedByUserId: "U-BoardMeeting"
      },
      {
        timeSlotId: "TS21",
        startTime: "13:00",
        endTime: "14:00",
        status: "Booked",
        bookedByUserId: "U-BoardMeeting"
      },
      {
        timeSlotId: "TS22",
        startTime: "14:00",
        endTime: "15:00",
        status: "Available"
      },
      {
        timeSlotId: "TS23",
        startTime: "15:00",
        endTime: "16:00",
        status: "Available"
      },
      {
        timeSlotId: "TS24",
        startTime: "16:00",
        endTime: "17:00",
        status: "Available"
      },
    ],
  },
];

export const transportList: ITransport[] = [
  {
    transportId: "T1",
    transportName: "Kijang Innova Zenix",
    capacity: "7 seats",
    image: require("@/assets/images/car1.jpg"),
    driverName: "John Doe",
    timeSlots: [
      {
        timeSlotId: "TT1",
        startTime: "08:00",
        endTime: "10:00",
        status: "Booked",
        bookedByUserId: "U-SiteVisitTeam",
      },
      {
        timeSlotId: "TT2",
        startTime: "10:00",
        endTime: "12:00",
        status: "Booked",
        bookedByUserId: "U-SiteVisitTeam",
      },
      {
        timeSlotId: "TT3",
        startTime: "13:00",
        endTime: "15:00",
        status: "Booked",
        bookedByUserId: "U-SiteVisitTeam",
      },
      {
        timeSlotId: "TT4",
        startTime: "15:00",
        endTime: "17:00",
        status: "Booked",
        bookedByUserId: "U-SiteVisitTeam",
      },
    ],
  },
  {
    transportId: "T2",
    transportName: "Kijang Innova Reborn 2.4 G",
    capacity: "7 seats",
    image: require("@/assets/images/car2.jpg"),
    driverName: "Michael Brown", // contoh driver
    timeSlots: [
      {
        timeSlotId: "TT5",
        startTime: "08:00",
        endTime: "10:00",
        status: "Booked",
        bookedByUserId: "U-SalesTeam",
      },
      {
        timeSlotId: "TT6",
        startTime: "10:00",
        endTime: "12:00",
        status: "Booked",
        bookedByUserId: "U-SiteVisitTeam",
      },
      {
        timeSlotId: "TT7",
        startTime: "13:00",
        endTime: "15:00",
        status: "Booked",
        bookedByUserId: "U-ExecutiveVisit",
      },
      {
        timeSlotId: "TT8",
        startTime: "15:00",
        endTime: "17:00",
        status: "Available",
      },
    ],
  },
  {
    transportId: "T3",
    transportName: "Alphard",
    capacity: "6 seats",
    image: require("@/assets/images/car3.jpg"),
    driverName: "Jane Smith", // contoh driver
    timeSlots: [
      {
        timeSlotId: "TT9",
        startTime: "08:00",
        endTime: "10:00",
        status: "Available",
      },
      {
        timeSlotId: "TT10",
        startTime: "10:00",
        endTime: "12:00",
        status: "Booked",
        bookedByUserId: "U-VIPTransport",
      },
      {
        timeSlotId: "TT11",
        startTime: "13:00",
        endTime: "15:00",
        status: "Available",
      },
      {
        timeSlotId: "TT12",
        startTime: "15:00",
        endTime: "17:00",
        status: "Available",
      },
    ],
  },
];


export const meetings: IMeeting[] = [
  {
    meetingId: "M1",
    meetingDate: "2025-01-04",
    startTime: "09:30",
    endTime: "11:00",
    title: "Designers Meeting",
    roomId: "R1",      // Room: "Small meeting room" => 'R1'
    isOngoing: true,
    description: "Discussing the new UI/UX designs for the upcoming project.",
    participants: [
      { avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
      { avatar: "https://randomuser.me/api/portraits/women/2.jpg" },
      { avatar: "https://randomuser.me/api/portraits/men/3.jpg" },
    ],
  },
  {
    meetingId: "M2",
    meetingDate: "2025-01-21",
    startTime: "12:00",
    endTime: "14:00",
    title: "Daily Project Meeting",
    roomId: "R3",      // Room: "Big meeting room" => 'R3'
    isOngoing: false,
    description: "Daily sync-up to track project progress and address any blockers.",
    participants: [
      { avatar: "https://randomuser.me/api/portraits/women/4.jpg" },
      { avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
    ],
  },
  {
    meetingId: "M3",
    meetingDate: "2025-12-22",
    startTime: "10:00",
    endTime: "12:00",
    title: "Team Retrospective",
    roomId: "R999",    // misal: "Main Hall" => di DB ada ID lain
    isOngoing: false,
    description: "Reflecting on the last sprint to improve team performance.",
    participants: [
      { avatar: "https://randomuser.me/api/portraits/men/6.jpg" },
      { avatar: "https://randomuser.me/api/portraits/women/7.jpg" },
      { avatar: "https://randomuser.me/api/portraits/men/8.jpg" },
      { avatar: "https://randomuser.me/api/portraits/women/9.jpg" },
    ],
  },
];

export const transportBookings: ITransportBooking[] = [
  {
    transportBookingId: "TB1",
    bookingDate: "2025-01-12",
    startTime: "10:00",
    endTime: "12:00",
    title: "Airport Pickup",
    transportId: "T1",   // "Kijang Innova Zenix"
    driverName: "John Doe",
    isOngoing: false,
    description: "Pickup from airport for new hires.",
    participants: [
      { avatar: "https://randomuser.me/api/portraits/men/10.jpg" },
      { avatar: "https://randomuser.me/api/portraits/women/11.jpg" },
    ],
  },
  {
    transportBookingId: "TB2",
    bookingDate: "2025-01-10",
    startTime: "10:00",
    endTime: "12:00",
    title: "VIP Guest Tour",
    transportId: "T3",   // "Alphard"
    isOngoing: false,
  },
  {
    transportBookingId: "TB3",
    bookingDate: "2025-12-22",
    startTime: "09:00",
    endTime: "12:00",
    title: "Site Visit Team",
    transportId: "T2",   // "Kijang Innova Reborn 2.4 G"
    driverName: "Michael Brown",
    isOngoing: false,
    description: "Transport for site visit team to the new branch.",
    participants: [
      { avatar: "https://randomuser.me/api/portraits/men/15.jpg" },
      { avatar: "https://randomuser.me/api/portraits/women/16.jpg" },
      { avatar: "https://randomuser.me/api/portraits/men/17.jpg" },
      { avatar: "https://randomuser.me/api/portraits/women/18.jpg" },
    ],
  },
];

export const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const dayNames = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];


export interface INotification {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "ROOM" | "TRANSPORT";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
}

export const notifications: INotification[] = [
  {
    id: "001",
    title: "Meeting: Product Review",
    description: "Small meeting room - Workspace A",
    date: "Today, 10:00 - 11:30",
    type: "ROOM",
    status: "upcoming",
  },
  {
    id: "002",
    title: "Transport Booking",
    description: "Toyota Innova - B 1234 CD",
    date: "Today, 13:00 - 15:00",
    type: "TRANSPORT",
    status: "ongoing",
  },
  {
    id: "003",
    title: "Team Retrospective",
    description: "Large meeting room - Workspace B",
    date: "Tomorrow, 09:00 - 10:00",
    type: "ROOM",
    status: "upcoming",
  },
  {
    id: "004",
    title: "Client Meeting",
    description: "Medium meeting room - Workspace C",
    date: "Yesterday, 14:00 - 15:00",
    type: "ROOM",
    status: "completed",
  },
  {
    id: "005",
    title: "Site Visit Transportation",
    description: "Honda CR-V - B 5678 EF",
    date: "Yesterday, 09:00 - 12:00",
    type: "TRANSPORT",
    status: "cancelled",
  },
];
