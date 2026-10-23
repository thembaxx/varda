export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  tone: string;
  attending: number;
  today: boolean;
}

export const events: CommunityEvent[] = [
  {
    id: "shared-table",
    title: "A seat at the table",
    description:
      "Good food. Better company. Bring a dish, a story, or just yourself to our community supper.",
    date: "Today",
    time: "18:30",
    location: "The shared kitchen",
    category: "Food & friends",
    image: "/images/supper.webp",
    tone: "coral",
    attending: 12,
    today: true,
  },
  {
    id: "slow-morning",
    title: "A slower kind of morning",
    description:
      "A gentle stretch, a little fresh air, and coffee with the neighbours. All levels welcome.",
    date: "Saturday",
    time: "09:00",
    location: "Rooftop garden",
    category: "Wellbeing",
    image: "/images/garden.webp",
    tone: "sage",
    attending: 8,
    today: false,
  },
  {
    id: "vinyl-evening",
    title: "One more record",
    description:
      "From jazz classics to your latest discovery. Bring your favourite record and stay for a listen.",
    date: "Friday",
    time: "19:00",
    location: "The living room",
    category: "Culture",
    image: "/images/community-room.webp",
    tone: "yellow",
    attending: 16,
    today: false,
  },
];

export interface NeighbourPost {
  id: string;
  name: string;
  category: "All" | "Culture" | "Food & drinks" | "Outdoors" | "Work";
  title: string;
  message: string;
  initials: string;
  tone: string;
}

export const neighbourPosts: NeighbourPost[] = [
  {
    id: "post-1",
    name: "Lerato",
    category: "Culture",
    title: "Anyone for a little live jazz?",
    message:
      "Thinking of heading to the city on Friday. Would love a few familiar faces and a few new ones.",
    initials: "LM",
    tone: "coral",
  },
  {
    id: "post-2",
    name: "James",
    category: "Food & drinks",
    title: "Coffee tastes better with company.",
    message:
      "Trying the new roastery around the corner tomorrow morning. There’s always room for one more.",
    initials: "JK",
    tone: "yellow",
  },
  {
    id: "post-3",
    name: "Aisha",
    category: "Outdoors",
    title: "A little green-fingered help?",
    message:
      "Our rooftop tomatoes are looking good. Join me for a little watering and a catch-up this weekend?",
    initials: "AN",
    tone: "sage",
  },
];
