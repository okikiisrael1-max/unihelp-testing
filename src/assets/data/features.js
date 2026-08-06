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
  Home,
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
  Building2,
  CalendarDays,
} from "lucide-react";

export const featureSections = [
  {
    title: "Academic Tools",
    icon: GraduationCap,
    items: [
      { title: "GPA Calculator", desc: "Calculate semester GPA instantly", icon: Calculator, link: "/GPA" },
      { title: "CGPA Tracker", desc: "Track academic performance", icon: Activity, link: "/CGPA" },
      { title: "Past Questions", desc: "Practice with exam materials", icon: File, link: "/questions" },
      { title: "Lecture Notes", desc: "Upload and access notes", icon: UploadCloud, link: "/lecturenotesmarketplace" },
      { title: "CBT Practice", desc: "Practice with exam materials", icon: ComputerIcon, link: "/cbt-practice" },
      { title: "Task Management", desc: "Plan assignments and deadlines", icon: Clock3, link: "/tasks" },
      { title: "Smart Timetable", desc: "Generate a balanced weekly schedule", icon: CalendarDays, link: "/smart-timetable" },
      { title: "Upload Questions", desc: "Contribute academic materials", icon: UploadCloud, link: "/uploadquestion" },
      { title: "Stories", desc: "Read and create student stories", icon: PlayCircle, link: "/stories" },
    ],
  },
  {
    title: "Marketplace",
    icon: ShoppingBag,
    items: [
      { title: "Hostel Marketplace", desc: "Find hostels around campus", icon: Home, link: "/hostelmarketplace" },
      { title: "Student Marketplace", desc: "Buy and sell student items", icon: ShoppingBag, link: "/studentmarketplace" },
      { title: "My Hostels", desc: "Manage uploaded hostel listings", icon: Building2, link: "/myhostels" },
    ],
  },
  {
    title: "Smart Features",
    icon: Sparkles,
    items: [
      { title: "AI Assistance", desc: "Ask for guided academic help", icon: Bot, link: "/ai" },
      { title: "SmartFeeds", desc: "Catch useful education updates", icon: Newspaper, link: "/newsfeed" },
      { title: "Groups", desc: "Join student communities", icon: MessageCircle, link: "/community" },
      { title: "Messenger", desc: "Chat with classmates directly", icon: MessageCircle, link: "/messages" },
      { title: "Notifications", desc: "See alerts and requests", icon: Bell, link: "/notifications" },
      { title: "Privacy Settings", desc: "Control messaging preferences", icon: Settings, link: "/community-settings" },
      { title: "Coming Soon", desc: "Preview upcoming UniHelp tools", icon: Rocket, link: "/coming-soon" },
      { title: "Announcements", desc: "Read campus and app updates", icon: RadioTower, link: "/announcements" },
      { title: "Premium", desc: "Unlock premium student features", icon: Star, link: "/premium" },
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
  {
    title: "Support",
    icon: HelpCircle,
    items: [
      { title: "FAQ", desc: "Answers to common questions", icon: HelpCircle, link: "/faq" },
      { title: "Help Center", desc: "Find guidance for UniHelp", icon: Info, link: "/help-center" },
      { title: "Contact", desc: "Reach the UniHelp team", icon: PhoneCall, link: "/contact" },
      { title: "Report", desc: "Report safety or platform issues", icon: FileWarning, link: "/report" },
      { title: "About UniHelp", desc: "Learn what UniHelp offers", icon: Info, link: "/about" },
    ],
  },
];

export const allFeatures = featureSections.flatMap((section) =>
  section.items.map((item) => ({ ...item, category: section.title }))
);

export const featuredFeatureItems = allFeatures.slice(0, 6);
