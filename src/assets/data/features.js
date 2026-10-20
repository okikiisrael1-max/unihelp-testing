import {
  Activity,
  BookOpen,
  Calculator,
  File,
  GraduationCap,
  Clock3,
  UploadCloud,
  ComputerIcon,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  Bot,
  Newspaper,
  MessageCircle,
  Bell,
  Settings,
  Rocket,
  RadioTower,
  Star,
  Library,
  Bookmark,
  Divide,
  HelpCircle,
  Info,
  PhoneCall,
  FileWarning,
  CalendarDays,
} from "lucide-react";

export const featureSections = [
  {
    title: "Academic Tools",
    icon: GraduationCap,
    items: [
      { title: "GPA Calculator", desc: "Calculate semester GPA instantly", icon: Calculator, link: "/GPA" },
      { title: "CGPA Tracker", desc: "Track academic performance", icon: Activity, link: "/CGPA" },
      { title: "Resources", desc: "Practice questions and lecture notes", icon: File, link: "/resources" },
      { title: "CBT Practice", desc: "Practice with exam materials", icon: ComputerIcon, link: "/cbt-practice" },
      { title: "Task Management", desc: "Plan assignments and deadlines", icon: Clock3, link: "/tasks" },
      { title: "Smart Timetable", desc: "Generate a balanced weekly schedule", icon: CalendarDays, link: "/smart-timetable" },
    ],
  },
  {
    title: "Marketplace",
    icon: ShoppingBag,
    items: [
      { title: "Student Marketplace", desc: "Buy and sell student items", icon: ShoppingBag, link: "/studentmarketplace" },
 
    ],
  },
  {
    title: "Smart Features",
    icon: Sparkles,
    items: [
      { title: "AI Assistance", desc: "Ask for guided academic help", icon: Bot, link: "/ai" },
      { title: "Watch Videos", desc: "Watch educational content", icon: PlayCircle, link: "/watch" },
      { title: "Groups", desc: "Join student communities", icon: MessageCircle, link: "/community" },
      { title: "Messenger", desc: "Chat with classmates directly", icon: MessageCircle, link: "/messages" },
      { title: "Feed", desc: "Share with friends around campus", icon: Newspaper, link: "/newsfeed" },
      { title: "Announcements", desc: "Read campus and app updates", icon: RadioTower, link: "/announcements" },
    ],
  },
  {
    title: "Formula Hub",
    icon: Library,
    items: [
      { title: "Formula Hub", desc: "Find formulas by topic", icon: Divide, link: "/formula-hub" },
      { title: "Formula Subjects", desc: "Browse formulas by subject", icon: Library, link: "/formula-hub/subjects" },
      { title: "Bookmarks", desc: "Open saved formulas quickly", icon: Bookmark, link: "/formula-hub/bookmarks" },
    ],
  },
];

export const allFeatures = featureSections.flatMap((section) =>
  section.items.map((item) => ({ ...item, category: section.title }))
);

export const featuredFeatureItems = allFeatures.slice(0, 6);
