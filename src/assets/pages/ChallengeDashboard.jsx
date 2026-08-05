import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import {
  Activity,
  Award,
  BookOpen,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  GraduationCap,
  Layers,
  Loader2,
  Medal,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  TrendingUp,
  Zap,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Users,
  Globe,
  School,
  Library,
  TimerReset,
  Lightbulb,
  Flag,
  CheckCheck,
  Moon,
  Sun,
  Star as StarIcon,
  ArrowLeft,
} from "lucide-react";

const CHALLENGE_CATEGORIES = [
  { id: 'daily', title: 'Daily Challenge', subtitle: 'New questions every day', icon: 'calendar', tone: '#6366F1', difficulty: 'Mixed', questionCount: 1000 },
  { id: 'weekly', title: 'Weekly Quiz', subtitle: 'Test your weekly knowledge', icon: 'trophy', tone: '#F97316', difficulty: 'Mixed', questionCount: 500 },
  { id: 'department', title: 'Department', subtitle: 'Your course materials', icon: 'library', tone: '#10B981', difficulty: 'Mixed', questionCount: 1500 },
  { id: 'level', title: 'Level', subtitle: 'Your academic level', icon: 'layers', tone: '#9333EA', difficulty: 'Mixed', questionCount: 1200 },
  { id: 'faculty', title: 'Faculty', subtitle: 'Cross-department knowledge', icon: 'users', tone: '#EC4899', difficulty: 'Mixed', questionCount: 800 },
  { id: 'speed-quiz', title: 'Speed Quiz', subtitle: 'Answer fast, score big', icon: 'timer', tone: '#EF4444', difficulty: 'Mixed', questionCount: 600 },
  { id: 'aptitude', title: 'Aptitude', subtitle: 'Logic & reasoning', icon: 'lightbulb', tone: '#14B8A6', difficulty: 'Mixed', questionCount: 700 },
  { id: 'general-knowledge', title: 'General Knowledge', subtitle: 'Current affairs & GK', icon: 'globe', tone: '#F59E0B', difficulty: 'Mixed', questionCount: 900 },
];

const ACHIEVEMENTS_LIST = [
  { id: 'first-challenge', title: 'First Challenge', icon: 'flag', target: 1, metric: 'attempts' },
  { id: 'seven-day-streak', title: '7 Day Streak', icon: 'flame', target: 7, metric: 'currentStreak' },
  { id: 'thirty-day-streak', title: '30 Day Streak', icon: 'flame', target: 30, metric: 'currentStreak' },
  { id: 'hundred-questions', title: '100 Questions', icon: 'check', target: 100, metric: 'questionsAnswered' },
  { id: 'five-hundred-questions', title: '500 Questions', icon: 'layers', target: 500, metric: 'questionsAnswered' },
  { id: 'thousand-questions', title: '1,000 Questions', icon: 'trophy', target: 1000, metric: 'questionsAnswered' },
  { id: 'daily-dedicated', title: 'Daily Dedicated', icon: 'flame', target: 30, metric: 'dailyCorrect' },
  { id: 'department-expert', title: 'Department Expert', icon: 'library', target: 50, metric: 'departmentCorrect' },
  { id: 'aptitude-ace', title: 'Aptitude Ace', icon: 'lightbulb', target: 30, metric: 'aptitudeCorrect' },
  { id: 'speed-demon', title: 'Speed Demon', icon: 'timer', target: 20, metric: 'speed-quizCorrect' },
  { id: 'weekly-warrior', title: 'Weekly Warrior', icon: 'trophy', target: 10, metric: 'weeklyCorrect' },
  { id: 'top-performer', title: 'Top Performer', icon: 'crown', target: 5000, metric: 'xp' },
  { id: 'early-bird', title: 'Early Bird', icon: 'sun', target: 3, metric: 'earlySessions' },
  { id: 'night-owl', title: 'Night Owl', icon: 'moon', target: 3, metric: 'nightSessions' },
  { id: 'perfect-score', title: 'Perfect Score', icon: 'star', target: 1, metric: 'perfectScores' },
];

const FALLBACK_QUESTIONS = [
  // ─── DAILY: Mixed Subjects ────────────────────────────────
  { id: 'daily-phys-1', category: 'daily', subject: 'Physics', difficulty: 'Medium', prompt: 'What is the SI unit of force?', answers: ['Joule', 'Newton', 'Watt', 'Pascal'], correctIndex: 1, explanation: 'Force is measured in newtons (N).' },
  { id: 'daily-chem-1', category: 'daily', subject: 'Chemistry', difficulty: 'Easy', prompt: 'Which particle has a negative charge?', answers: ['Proton', 'Neutron', 'Electron', 'Nucleus'], correctIndex: 2, explanation: 'Electrons carry negative charge.' },
  { id: 'daily-bio-1', category: 'daily', subject: 'Biology', difficulty: 'Easy', prompt: 'The basic unit of life is the:', answers: ['Tissue', 'Organ', 'Cell', 'System'], correctIndex: 2, explanation: 'Cells are the basic structural and functional units of life.' },
  { id: 'daily-maths-1', category: 'daily', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is 25% of 80?', answers: ['15', '20', '25', '30'], correctIndex: 1, explanation: '25% of 80 = (25/100) × 80 = 20.' },
  { id: 'daily-maths-2', category: 'daily', subject: 'Mathematics', difficulty: 'Medium', prompt: 'What is the area of a circle with radius 7cm? (Use π = 22/7)', answers: ['144 cm²', '154 cm²', '164 cm²', '174 cm²'], correctIndex: 1, explanation: 'Area = πr² = (22/7) × 7 × 7 = 154 cm².' },
  { id: 'daily-eng-1', category: 'daily', subject: 'English', difficulty: 'Easy', prompt: 'Which word is a noun?', answers: ['Quickly', 'Beautiful', 'Happiness', 'Run'], correctIndex: 2, explanation: '"Happiness" is a noun (a thing/feeling), while the others are adverb, adjective, and verb.' },
  { id: 'daily-eng-2', category: 'daily', subject: 'English', difficulty: 'Medium', prompt: 'What is the past tense of "sing"?', answers: ['Sang', 'Sung', 'Singed', 'Song'], correctIndex: 0, explanation: 'The simple past tense of "sing" is "sang".' },
  { id: 'daily-phys-2', category: 'daily', subject: 'Physics', difficulty: 'Easy', prompt: 'What is the unit of electric current?', answers: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctIndex: 1, explanation: 'Electric current is measured in amperes (amps).' },
  { id: 'daily-chem-2', category: 'daily', subject: 'Chemistry', difficulty: 'Medium', prompt: 'Which element has the symbol "Fe"?', answers: ['Francium', 'Iron', 'Fluorine', 'Fermium'], correctIndex: 1, explanation: 'Fe is the chemical symbol for Iron, from the Latin "ferrum".' },
  { id: 'daily-bio-2', category: 'daily', subject: 'Biology', difficulty: 'Medium', prompt: 'Which part of the plant conducts photosynthesis?', answers: ['Root', 'Stem', 'Leaf', 'Flower'], correctIndex: 2, explanation: 'Leaves contain chloroplasts that perform photosynthesis.' },
  { id: 'daily-his-1', category: 'daily', subject: 'History', difficulty: 'Easy', prompt: 'In which year did Nigeria gain independence?', answers: ['1957', '1960', '1963', '1970'], correctIndex: 1, explanation: 'Nigeria gained independence from Britain on October 1, 1960.' },
  { id: 'daily-his-2', category: 'daily', subject: 'History', difficulty: 'Medium', prompt: 'Who was the first Prime Minister of Nigeria?', answers: ['Nnamdi Azikiwe', 'Abubakar Tafawa Balewa', 'Obafemi Awolowo', 'Ahmadu Bello'], correctIndex: 1, explanation: 'Sir Abubakar Tafawa Balewa served as Nigeria\'s first Prime Minister from 1960 to 1966.' },
  { id: 'daily-geo-1', category: 'daily', subject: 'Geography', difficulty: 'Easy', prompt: 'Which continent has the largest population?', answers: ['Africa', 'Europe', 'Asia', 'North America'], correctIndex: 2, explanation: 'Asia is the most populous continent, home to over 4.6 billion people.' },
  { id: 'daily-geo-2', category: 'daily', subject: 'Geography', difficulty: 'Medium', prompt: 'What is the smallest country in the world by area?', answers: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctIndex: 1, explanation: 'Vatican City is the smallest country, with an area of about 0.44 km².' },
  { id: 'daily-sport-1', category: 'daily', subject: 'Sports', difficulty: 'Easy', prompt: 'How many players are on a football (soccer) team?', answers: ['9', '10', '11', '12'], correctIndex: 2, explanation: 'A standard football team has 11 players on the field.' },
  { id: 'daily-sport-2', category: 'daily', subject: 'Sports', difficulty: 'Medium', prompt: 'Which country has won the most FIFA World Cup titles?', answers: ['Germany', 'Argentina', 'Brazil', 'Italy'], correctIndex: 2, explanation: 'Brazil has won the FIFA World Cup a record 5 times.' },
  { id: 'daily-tech-1', category: 'daily', subject: 'Technology', difficulty: 'Easy', prompt: 'What does "CPU" stand for?', answers: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'], correctIndex: 0, explanation: 'CPU stands for Central Processing Unit, the brain of the computer.' },
  { id: 'daily-tech-2', category: 'daily', subject: 'Technology', difficulty: 'Medium', prompt: 'Who founded Microsoft?', answers: ['Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Jeff Bezos'], correctIndex: 1, explanation: 'Bill Gates co-founded Microsoft with Paul Allen in 1975.' },
  { id: 'daily-astro-1', category: 'daily', subject: 'Astronomy', difficulty: 'Easy', prompt: 'What is the closest planet to the Sun?', answers: ['Venus', 'Mercury', 'Earth', 'Mars'], correctIndex: 1, explanation: 'Mercury is the closest planet to the Sun.' },
  { id: 'daily-astro-2', category: 'daily', subject: 'Astronomy', difficulty: 'Medium', prompt: 'How many planets are in our solar system?', answers: ['7', '8', '9', '10'], correctIndex: 1, explanation: 'There are 8 recognized planets in our solar system (Pluto was reclassified as a dwarf planet).' },
  // ─── DEPARTMENT: Computer Science ─────────────────────────
  { id: 'dept-cs-1', category: 'department', subject: 'Programming', difficulty: 'Medium', prompt: 'Which data structure follows FIFO order?', answers: ['Stack', 'Queue', 'Tree', 'Graph'], correctIndex: 1, explanation: 'Queues are first-in, first-out structures.' },
  { id: 'dept-cs-2', category: 'department', subject: 'Programming', difficulty: 'Easy', prompt: 'What does HTML stand for?', answers: ['HyperText Markup Language', 'High Tech Modern Language', 'HyperTransfer Markup Language', 'Home Tool Markup Language'], correctIndex: 0, explanation: 'HTML stands for HyperText Markup Language.' },
  { id: 'dept-cs-3', category: 'department', subject: 'Programming', difficulty: 'Hard', prompt: 'Which of these is not a programming language?', answers: ['Python', 'Java', 'HTML', 'C++'], correctIndex: 2, explanation: 'HTML is a markup language, not a programming language.' },
  { id: 'dept-cs-4', category: 'department', subject: 'Computer Science', difficulty: 'Medium', prompt: 'What is the time complexity of binary search?', answers: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctIndex: 1, explanation: 'Binary search has O(log n) time complexity.' },
  { id: 'dept-cs-5', category: 'department', subject: 'Computer Science', difficulty: 'Easy', prompt: 'What is the full meaning of "RAM"?', answers: ['Read Access Memory', 'Random Access Memory', 'Read And Memory', 'Rapid Access Module'], correctIndex: 1, explanation: 'RAM stands for Random Access Memory.' },
  { id: 'dept-cs-6', category: 'department', subject: 'Programming', difficulty: 'Hard', prompt: 'Which of these is a functional programming language?', answers: ['Java', 'C++', 'Haskell', 'Python'], correctIndex: 2, explanation: 'Haskell is a purely functional programming language.' },
  { id: 'dept-cs-7', category: 'department', subject: 'Computer Science', difficulty: 'Medium', prompt: 'What does "SQL" stand for?', answers: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'Sequential Query Language'], correctIndex: 0, explanation: 'SQL stands for Structured Query Language, used for database management.' },
  { id: 'dept-cs-8', category: 'department', subject: 'Computer Science', difficulty: 'Easy', prompt: 'Which device is used to input data into a computer?', answers: ['Monitor', 'Keyboard', 'Printer', 'Speaker'], correctIndex: 1, explanation: 'A keyboard is an input device used to enter data into a computer.' },
  // ─── DEPARTMENT: Medicine ─────────────────────────────────
  { id: 'dept-med-1', category: 'department', subject: 'Anatomy', difficulty: 'Hard', prompt: 'How many bones are in the adult human body?', answers: ['106', '206', '306', '150'], correctIndex: 1, explanation: 'An adult human has 206 bones.' },
  { id: 'dept-med-2', category: 'department', subject: 'Anatomy', difficulty: 'Medium', prompt: 'Which organ filters blood in the human body?', answers: ['Liver', 'Kidney', 'Heart', 'Lungs'], correctIndex: 1, explanation: 'The kidneys filter waste products from the blood to produce urine.' },
  { id: 'dept-med-3', category: 'department', subject: 'Physiology', difficulty: 'Easy', prompt: 'What is the normal human body temperature in Celsius?', answers: ['35°C', '36°C', '37°C', '38°C'], correctIndex: 2, explanation: 'Normal human body temperature is approximately 37°C (98.6°F).' },
  { id: 'dept-med-4', category: 'department', subject: 'Anatomy', difficulty: 'Hard', prompt: 'How many chambers does the human heart have?', answers: ['2', '3', '4', '5'], correctIndex: 2, explanation: 'The human heart has four chambers: two atria and two ventricles.' },
  { id: 'dept-med-5', category: 'department', subject: 'Pharmacology', difficulty: 'Medium', prompt: 'Which drug is commonly used as a pain reliever?', answers: ['Paracetamol', 'Metformin', 'Omeprazole', 'Atorvastatin'], correctIndex: 0, explanation: 'Paracetamol (acetaminophen) is a common analgesic and antipyretic.' },
  { id: 'dept-med-6', category: 'department', subject: 'Anatomy', difficulty: 'Easy', prompt: 'What is the largest bone in the human body?', answers: ['Tibia', 'Femur', 'Humerus', 'Pelvis'], correctIndex: 1, explanation: 'The femur (thigh bone) is the longest and largest bone in the human body.' },
  // ─── DEPARTMENT: Engineering ──────────────────────────────
  { id: 'dept-eng-1', category: 'department', subject: 'Engineering', difficulty: 'Medium', prompt: 'What is the unit of electrical power?', answers: ['Volt', 'Ampere', 'Watt', 'Ohm'], correctIndex: 2, explanation: 'Electrical power is measured in watts (W).' },
  { id: 'dept-eng-2', category: 'department', subject: 'Engineering', difficulty: 'Easy', prompt: 'Which material is a good conductor of electricity?', answers: ['Rubber', 'Plastic', 'Copper', 'Wood'], correctIndex: 2, explanation: 'Copper is an excellent conductor of electricity, commonly used in wiring.' },
  { id: 'dept-eng-3', category: 'department', subject: 'Engineering', difficulty: 'Hard', prompt: 'What is the formula for Ohm\'s Law?', answers: ['V = IR', 'P = IV', 'R = V/I', 'All of the above'], correctIndex: 3, explanation: 'Ohm\'s Law relates voltage, current, and resistance: V = IR, and its variations.' },
  { id: 'dept-eng-4', category: 'department', subject: 'Engineering', difficulty: 'Medium', prompt: 'Which type of bridge uses cables suspended from towers?', answers: ['Arch bridge', 'Beam bridge', 'Suspension bridge', 'Truss bridge'], correctIndex: 2, explanation: 'A suspension bridge uses cables suspended between towers to support the deck.' },
  { id: 'dept-eng-5', category: 'department', subject: 'Engineering', difficulty: 'Easy', prompt: 'What does AC stand for in electricity?', answers: ['Alternating Current', 'Active Current', 'Absolute Current', 'Applied Current'], correctIndex: 0, explanation: 'AC stands for Alternating Current, where the flow of electric charge periodically reverses.' },
  // ─── DEPARTMENT: Law ──────────────────────────────────────
  { id: 'dept-law-1', category: 'department', subject: 'Law', difficulty: 'Easy', prompt: 'What is the supreme law of Nigeria?', answers: ['Criminal Code', 'Constitution', 'Penal Code', 'Common Law'], correctIndex: 1, explanation: 'The Constitution is the supreme law of Nigeria.' },
  { id: 'dept-law-2', category: 'department', subject: 'Law', difficulty: 'Medium', prompt: 'What does "habeas corpus" mean?', answers: ['Guilty until proven innocent', 'You shall have the body', 'Let the buyer beware', 'The state decides'], correctIndex: 1, explanation: 'Habeas corpus is a legal principle protecting against unlawful detention.' },
  { id: 'dept-law-3', category: 'department', subject: 'Law', difficulty: 'Hard', prompt: 'Which court is the highest in Nigeria?', answers: ['Court of Appeal', 'Supreme Court', 'Federal High Court', 'Sharia Court'], correctIndex: 1, explanation: 'The Supreme Court of Nigeria is the highest court in the land.' },
  { id: 'dept-law-4', category: 'department', subject: 'Law', difficulty: 'Medium', prompt: 'What is "mens rea"?', answers: ['The guilty act', 'The guilty mind', 'The innocent party', 'The legal defense'], correctIndex: 1, explanation: 'Mens rea refers to the intention or knowledge of wrongdoing in committing a crime.' },
  // ─── DEPARTMENT: Business / Commerce ──────────────────────
  { id: 'dept-com-1', category: 'department', subject: 'Commerce', difficulty: 'Medium', prompt: 'Which of these is a medium of exchange?', answers: ['Barter', 'Money', 'Labour', 'Land'], correctIndex: 1, explanation: 'Money serves as a medium of exchange in modern economies.' },
  { id: 'dept-com-2', category: 'department', subject: 'Business', difficulty: 'Easy', prompt: 'What is profit?', answers: ['Total revenue minus total cost', 'Total sales plus expenses', 'Total assets minus liabilities', 'Total income before tax'], correctIndex: 0, explanation: 'Profit = Total Revenue - Total Cost.' },
  { id: 'dept-com-3', category: 'department', subject: 'Business', difficulty: 'Medium', prompt: 'What does SWOT stand for in business analysis?', answers: ['Strengths, Weaknesses, Opportunities, Threats', 'Sales, Workforce, Operations, Technology', 'Strategy, Workflow, Objectives, Targets', 'System, Web, Online, Technology'], correctIndex: 0, explanation: 'SWOT analysis evaluates Strengths, Weaknesses, Opportunities, and Threats.' },
  { id: 'dept-com-4', category: 'department', subject: 'Commerce', difficulty: 'Hard', prompt: 'What is the law of diminishing returns?', answers: ['Adding more input eventually yields smaller output increases', 'Returns always increase with more input', 'Costs always decrease with production', 'Revenue is always proportional to effort'], correctIndex: 0, explanation: 'The law of diminishing marginal returns states that adding more of one factor of production eventually yields smaller per-unit increases.' },
  // ─── LEVEL: Mathematics ───────────────────────────────────
  { id: 'level-maths-1', category: 'level', subject: 'Mathematics', difficulty: 'Medium', prompt: 'What is the derivative of x²?', answers: ['x', '2x', 'x²', '2'], correctIndex: 1, explanation: 'The derivative of x² with respect to x is 2x.' },
  { id: 'level-maths-2', category: 'level', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is 7 × 8?', answers: ['48', '54', '56', '64'], correctIndex: 2, explanation: '7 × 8 = 56.' },
  { id: 'level-maths-3', category: 'level', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the integral of 2x dx?', answers: ['x² + C', '2x² + C', 'x + C', 'x²/2 + C'], correctIndex: 0, explanation: '∫2x dx = x² + C, where C is the constant of integration.' },
  { id: 'level-maths-4', category: 'level', subject: 'Mathematics', difficulty: 'Medium', prompt: 'If a = 3 and b = 4, what is the value of a² + b²?', answers: ['7', '12', '25', '49'], correctIndex: 2, explanation: '3² + 4² = 9 + 16 = 25.' },
  { id: 'level-maths-5', category: 'level', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is the next prime number after 7?', answers: ['8', '9', '10', '11'], correctIndex: 3, explanation: '11 is the next prime number after 7 (8, 9, and 10 are not prime).' },
  { id: 'level-maths-6', category: 'level', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the value of sin(90°)?', answers: ['0', '0.5', '1', 'Undefined'], correctIndex: 2, explanation: 'sin(90°) = 1.' },
  // ─── LEVEL: English ───────────────────────────────────────
  { id: 'level-eng-1', category: 'level', subject: 'Use of English', difficulty: 'Easy', prompt: 'Identify the correct sentence:', answers: ["She don't like coffee.", "She doesn't like coffee.", "She not like coffee.", "She no like coffee."], correctIndex: 1, explanation: '"She doesn\'t like coffee" is grammatically correct.' },
  { id: 'level-eng-2', category: 'level', subject: 'Use of English', difficulty: 'Medium', prompt: 'Which word is an adverb?', answers: ['Quick', 'Quickly', 'Quickness', 'Quicken'], correctIndex: 1, explanation: '"Quickly" is an adverb modifying a verb, adjective, or other adverb.' },
  { id: 'level-eng-3', category: 'level', subject: 'Use of English', difficulty: 'Hard', prompt: 'What is a palindrome?', answers: ['A word that reads the same forwards and backwards', 'A word with multiple meanings', 'A word that sounds like another word', 'A word with silent letters'], correctIndex: 0, explanation: 'A palindrome reads the same forwards and backwards, e.g., "radar" or "level".' },
  { id: 'level-eng-4', category: 'level', subject: 'Use of English', difficulty: 'Medium', prompt: 'Choose the correct spelling:', answers: ['Receive', 'Recieve', 'Receeve', 'Reseive'], correctIndex: 0, explanation: '"Receive" follows the rule: i before e except after c.' },
  // ─── LEVEL: Science ───────────────────────────────────────
  { id: 'level-sci-1', category: 'level', subject: 'General Science', difficulty: 'Easy', prompt: 'What is the chemical symbol for oxygen?', answers: ['Ox', 'O', 'O₂', 'Om'], correctIndex: 1, explanation: 'The chemical symbol for oxygen is O.' },
  { id: 'level-sci-2', category: 'level', subject: 'General Science', difficulty: 'Medium', prompt: 'What is the boiling point of water in Celsius?', answers: ['90°C', '100°C', '110°C', '120°C'], correctIndex: 1, explanation: 'Water boils at 100°C at standard atmospheric pressure.' },
  { id: 'level-sci-3', category: 'level', subject: 'General Science', difficulty: 'Hard', prompt: 'What is the powerhouse of the cell?', answers: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], correctIndex: 2, explanation: 'Mitochondria are known as the powerhouse of the cell, producing ATP.' },
  { id: 'level-sci-4', category: 'level', subject: 'General Science', difficulty: 'Easy', prompt: 'Which planet is known as the Red Planet?', answers: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correctIndex: 2, explanation: 'Mars is called the Red Planet due to its reddish appearance from iron oxide.' },
  // ─── FACULTY: Engineering ─────────────────────────────────
  { id: 'faculty-eng-1', category: 'faculty', subject: 'General Engineering', difficulty: 'Easy', prompt: 'The first law of thermodynamics is about:', answers: ['Entropy', 'Conservation of energy', 'Absolute zero', 'Heat transfer'], correctIndex: 1, explanation: 'The first law states that energy cannot be created or destroyed, only converted.' },
  { id: 'faculty-eng-2', category: 'faculty', subject: 'General Engineering', difficulty: 'Medium', prompt: 'What is the second law of thermodynamics?', answers: ['Energy is conserved', 'Entropy always increases', 'Absolute zero is unattainable', 'Heat flows from cold to hot'], correctIndex: 1, explanation: 'The second law states that the total entropy of an isolated system always increases over time.' },
  { id: 'faculty-eng-3', category: 'faculty', subject: 'General Engineering', difficulty: 'Hard', prompt: 'What is Young\'s modulus a measure of?', answers: ['Hardness', 'Stiffness', 'Toughness', 'Ductility'], correctIndex: 1, explanation: 'Young\'s modulus measures the stiffness of a material.' },
  { id: 'faculty-eng-4', category: 'faculty', subject: 'General Engineering', difficulty: 'Medium', prompt: 'Which of these is a renewable energy source?', answers: ['Coal', 'Natural gas', 'Solar', 'Nuclear'], correctIndex: 2, explanation: 'Solar energy is renewable, while coal, gas, and nuclear are non-renewable.' },
  // ─── FACULTY: Science ─────────────────────────────────────
  { id: 'faculty-sci-1', category: 'faculty', subject: 'General Science', difficulty: 'Easy', prompt: 'What is the most abundant gas in Earth\'s atmosphere?', answers: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], correctIndex: 2, explanation: 'Nitrogen makes up about 78% of Earth\'s atmosphere.' },
  { id: 'faculty-sci-2', category: 'faculty', subject: 'General Science', difficulty: 'Medium', prompt: 'What is the pH of a strong acid?', answers: ['Close to 0', 'Close to 7', 'Close to 14', 'Exactly 7'], correctIndex: 0, explanation: 'Strong acids have pH values close to 0.' },
  { id: 'faculty-sci-3', category: 'faculty', subject: 'General Science', difficulty: 'Hard', prompt: 'What is the half-life of Carbon-14?', answers: ['1,000 years', '3,730 years', '5,730 years', '10,000 years'], correctIndex: 2, explanation: 'Carbon-14 has a half-life of approximately 5,730 years.' },
  { id: 'faculty-sci-4', category: 'faculty', subject: 'General Science', difficulty: 'Easy', prompt: 'Which gas do plants absorb from the atmosphere?', answers: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correctIndex: 2, explanation: 'Plants absorb carbon dioxide for photosynthesis.' },
  // ─── FACULTY: Arts ────────────────────────────────────────
  { id: 'faculty-arts-1', category: 'faculty', subject: 'Arts', difficulty: 'Easy', prompt: 'Who painted the Mona Lisa?', answers: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Van Gogh'], correctIndex: 1, explanation: 'Leonardo da Vinci painted the Mona Lisa in the early 16th century.' },
  { id: 'faculty-arts-2', category: 'faculty', subject: 'Arts', difficulty: 'Medium', prompt: 'What are the primary colors?', answers: ['Red, Green, Blue', 'Red, Yellow, Blue', 'Red, White, Blue', 'Green, Yellow, Purple'], correctIndex: 1, explanation: 'The primary colors are red, yellow, and blue.' },
  { id: 'faculty-arts-3', category: 'faculty', subject: 'Arts', difficulty: 'Hard', prompt: 'Which art movement is Salvador Dalí associated with?', answers: ['Impressionism', 'Cubism', 'Surrealism', 'Realism'], correctIndex: 2, explanation: 'Salvador Dalí was a prominent surrealist artist.' },
  { id: 'faculty-arts-4', category: 'faculty', subject: 'Arts', difficulty: 'Medium', prompt: 'What is the art of paper folding called?', answers: ['Origami', 'Calligraphy', 'Sculpture', 'Collage'], correctIndex: 0, explanation: 'Origami is the Japanese art of paper folding.' },
  // ─── APTITUDE: Logical Reasoning ──────────────────────────
  { id: 'aptitude-1', category: 'aptitude', subject: 'Logical Reasoning', difficulty: 'Hard', prompt: 'All roses are flowers. Some flowers fade quickly. Which statement must be true?', answers: ['All roses fade quickly', 'Some roses fade quickly', 'Some flowers are roses', 'No roses fade quickly'], correctIndex: 2, explanation: 'If all roses are flowers, then at least some flowers are roses when roses exist.' },
  { id: 'aptitude-2', category: 'aptitude', subject: 'Logical Reasoning', difficulty: 'Medium', prompt: 'If all A are B, and all B are C, then:', answers: ['All A are C', 'All C are A', 'Some A are not C', 'No relationship exists'], correctIndex: 0, explanation: 'If all A are B and all B are C, then all A are C by transitive property.' },
  { id: 'aptitude-3', category: 'aptitude', subject: 'Logical Reasoning', difficulty: 'Easy', prompt: 'Which number comes next: 2, 4, 6, 8, ?', answers: ['9', '10', '11', '12'], correctIndex: 1, explanation: 'The sequence increases by 2 each time: 2, 4, 6, 8, 10.' },
  { id: 'aptitude-4', category: 'aptitude', subject: 'Logical Reasoning', difficulty: 'Hard', prompt: 'If you rearrange the letters "CIFAIPC", you get the name of a(n):', answers: ['City', 'Animal', 'Ocean', 'Country'], correctIndex: 2, explanation: '"CIFAIPC" rearranges to "PACIFIC" - an ocean.' },
  { id: 'aptitude-5', category: 'aptitude', subject: 'Logical Reasoning', difficulty: 'Medium', prompt: 'A clock shows 3:15. What is the angle between the hour and minute hands?', answers: ['0°', '7.5°', '15°', '30°'], correctIndex: 1, explanation: 'At 3:15, the hour hand has moved ¼ of the way between 3 and 4, which is 7.5° ahead of the minute hand.' },
  { id: 'aptitude-6', category: 'aptitude', subject: 'Logical Reasoning', difficulty: 'Easy', prompt: 'Which word does not belong? Apple, Banana, Carrot, Mango', answers: ['Apple', 'Banana', 'Carrot', 'Mango'], correctIndex: 2, explanation: 'Carrot is a vegetable, while the others are fruits.' },
  { id: 'aptitude-7', category: 'aptitude', subject: 'Numerical Reasoning', difficulty: 'Medium', prompt: 'What is 20% of 50% of 200?', answers: ['10', '20', '30', '40'], correctIndex: 1, explanation: '50% of 200 = 100. 20% of 100 = 20.' },
  { id: 'aptitude-8', category: 'aptitude', subject: 'Verbal Reasoning', difficulty: 'Hard', prompt: 'Find the odd one out:', answers: ['Triangle', 'Square', 'Circle', 'Rectangle'], correctIndex: 2, explanation: 'A circle has no straight edges, while the others are polygons.' },
  { id: 'aptitude-9', category: 'aptitude', subject: 'Logical Reasoning', difficulty: 'Medium', prompt: 'If today is Monday, what day will it be in 100 days?', answers: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], correctIndex: 1, explanation: '100 mod 7 = 2. Monday + 2 days = Wednesday.' },
  { id: 'aptitude-10', category: 'aptitude', subject: 'Numerical Reasoning', difficulty: 'Easy', prompt: 'What is the average of 10, 20, and 30?', answers: ['15', '20', '25', '30'], correctIndex: 1, explanation: 'Average = (10 + 20 + 30) / 3 = 60 / 3 = 20.' },
  // ─── GENERAL KNOWLEDGE ────────────────────────────────────
  { id: 'gk-1', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Easy', prompt: 'Which continent is Nigeria located in?', answers: ['Asia', 'Africa', 'Europe', 'South America'], correctIndex: 1, explanation: 'Nigeria is in West Africa.' },
  { id: 'gk-2', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Medium', prompt: 'Who is the current Secretary-General of the United Nations?', answers: ['Ban Ki-moon', 'António Guterres', 'Kofi Annan', 'Boutros Boutros-Ghali'], correctIndex: 1, explanation: 'António Guterres has been the UN Secretary-General since 2017.' },
  { id: 'gk-3', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Easy', prompt: 'How many countries are in Africa?', answers: ['44', '54', '64', '74'], correctIndex: 1, explanation: 'There are 54 recognized countries in Africa.' },
  { id: 'gk-4', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Hard', prompt: 'What is the currency of Japan?', answers: ['Yuan', 'Won', 'Yen', 'Ringgit'], correctIndex: 2, explanation: 'The Japanese currency is the yen (¥).' },
  { id: 'gk-5', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Medium', prompt: 'Which organization won the Nobel Peace Prize in 2023?', answers: ['WHO', 'UNICEF', 'Narges Mohammadi', 'ICRC'], correctIndex: 2, explanation: 'Narges Mohammadi won the 2023 Nobel Peace Prize for her fight against oppression in Iran.' },
  { id: 'gk-6', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Easy', prompt: 'What is the largest country in the world by area?', answers: ['China', 'USA', 'Russia', 'Canada'], correctIndex: 2, explanation: 'Russia is the largest country by area, covering about 17.1 million km².' },
  { id: 'gk-7', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Medium', prompt: 'Which year did World War II end?', answers: ['1943', '1944', '1945', '1946'], correctIndex: 2, explanation: 'World War II ended in 1945.' },
  { id: 'gk-8', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Hard', prompt: 'What is the official language of Brazil?', answers: ['Spanish', 'Portuguese', 'French', 'English'], correctIndex: 1, explanation: 'Portuguese is the official language of Brazil.' },
  { id: 'gk-9', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Easy', prompt: 'Which animal is known as the "King of the Jungle"?', answers: ['Tiger', 'Lion', 'Elephant', 'Gorilla'], correctIndex: 1, explanation: 'The lion is traditionally known as the "King of the Jungle".' },
  { id: 'gk-10', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Medium', prompt: 'What is the tallest mountain in the world?', answers: ['K2', 'Mount Everest', 'Kilimanjaro', 'Denali'], correctIndex: 1, explanation: 'Mount Everest is the tallest mountain at 8,848 meters above sea level.' },
  { id: 'gk-11', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Hard', prompt: 'Which country is known as the "Land of the Rising Sun"?', answers: ['China', 'South Korea', 'Japan', 'Thailand'], correctIndex: 2, explanation: 'Japan is called the "Land of the Rising Sun".' },
  { id: 'gk-12', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Easy', prompt: 'How many days are in a leap year?', answers: ['364', '365', '366', '367'], correctIndex: 2, explanation: 'A leap year has 366 days, with an extra day in February (29th).' },
  { id: 'gk-13', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Medium', prompt: 'What is the largest organ in the human body?', answers: ['Liver', 'Brain', 'Skin', 'Heart'], correctIndex: 2, explanation: 'The skin is the largest organ, covering about 1.5-2 square meters.' },
  { id: 'gk-14', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Easy', prompt: 'Which gas do humans breathe out?', answers: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correctIndex: 2, explanation: 'Humans exhale carbon dioxide as a waste product of respiration.' },
  { id: 'gk-15', category: 'general-knowledge', subject: 'Current Affairs', difficulty: 'Hard', prompt: 'What is the longest river in Africa?', answers: ['Congo', 'Niger', 'Nile', 'Zambezi'], correctIndex: 2, explanation: 'The Nile River is the longest river in Africa and the world.' },
  // ─── SPEED QUIZ: Quick Questions ──────────────────────────
  { id: 'speed-maths-1', category: 'speed-quiz', subject: 'Mathematics', difficulty: 'Medium', prompt: 'If 3x + 7 = 28, what is the value of x?', answers: ['5', '6', '7', '9'], correctIndex: 2, explanation: 'Subtract 7 from both sides to get 3x = 21, then divide by 3.' },
  { id: 'speed-maths-2', category: 'speed-quiz', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is 12 × 12?', answers: ['124', '134', '144', '154'], correctIndex: 2, explanation: '12 × 12 = 144.' },
  { id: 'speed-maths-3', category: 'speed-quiz', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is 100 ÷ 4?', answers: ['15', '20', '25', '30'], correctIndex: 2, explanation: '100 ÷ 4 = 25.' },
  { id: 'speed-maths-4', category: 'speed-quiz', subject: 'Mathematics', difficulty: 'Medium', prompt: 'What is 15 × 15?', answers: ['200', '215', '225', '250'], correctIndex: 2, explanation: '15 × 15 = 225.' },
  { id: 'speed-sci-1', category: 'speed-quiz', subject: 'Science', difficulty: 'Easy', prompt: 'What is H₂O commonly known as?', answers: ['Salt', 'Sugar', 'Water', 'Acid'], correctIndex: 2, explanation: 'H₂O is the chemical formula for water.' },
  { id: 'speed-sci-2', category: 'speed-quiz', subject: 'Science', difficulty: 'Easy', prompt: 'What is the freezing point of water in Celsius?', answers: ['-1°C', '0°C', '1°C', '2°C'], correctIndex: 1, explanation: 'Water freezes at 0°C.' },
  { id: 'speed-sci-3', category: 'speed-quiz', subject: 'Science', difficulty: 'Medium', prompt: 'What planet is known as the "Morning Star"?', answers: ['Mars', 'Jupiter', 'Venus', 'Mercury'], correctIndex: 2, explanation: 'Venus is often called the "Morning Star" or "Evening Star".' },
  { id: 'speed-gk-1', category: 'speed-quiz', subject: 'General Knowledge', difficulty: 'Easy', prompt: 'What color do you get by mixing red and blue?', answers: ['Green', 'Purple', 'Orange', 'Yellow'], correctIndex: 1, explanation: 'Red and blue make purple.' },
  { id: 'speed-gk-2', category: 'speed-quiz', subject: 'General Knowledge', difficulty: 'Easy', prompt: 'How many sides does a triangle have?', answers: ['2', '3', '4', '5'], correctIndex: 1, explanation: 'A triangle has three sides.' },
  { id: 'speed-gk-3', category: 'speed-quiz', subject: 'General Knowledge', difficulty: 'Medium', prompt: 'Which month has 28 days?', answers: ['February only', 'All months', 'February in leap years only', 'January'], correctIndex: 1, explanation: 'All months have at least 28 days.' },
  { id: 'speed-gk-4', category: 'speed-quiz', subject: 'General Knowledge', difficulty: 'Easy', prompt: 'What is the opposite of "hot"?', answers: ['Warm', 'Cool', 'Cold', 'Mild'], correctIndex: 2, explanation: 'The opposite of "hot" is "cold".' },
  { id: 'speed-gk-5', category: 'speed-quiz', subject: 'General Knowledge', difficulty: 'Easy', prompt: 'How many legs does a spider have?', answers: ['6', '8', '10', '12'], correctIndex: 1, explanation: 'Spiders have 8 legs.' },
  { id: 'speed-gk-6', category: 'speed-quiz', subject: 'General Knowledge', difficulty: 'Medium', prompt: 'What is the smallest prime number?', answers: ['0', '1', '2', '3'], correctIndex: 2, explanation: '2 is the smallest prime number.' },
  { id: 'speed-gk-7', category: 'speed-quiz', subject: 'General Knowledge', difficulty: 'Easy', prompt: 'Which direction does the sun rise?', answers: ['North', 'South', 'East', 'West'], correctIndex: 2, explanation: 'The sun rises in the east.' },
  { id: 'speed-gk-8', category: 'speed-quiz', subject: 'General Knowledge', difficulty: 'Medium', prompt: 'How many zeros are in one million?', answers: ['4', '5', '6', '7'], correctIndex: 2, explanation: 'One million = 1,000,000 (6 zeros).' },
];

const getTodayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const getRankForXp = (xp = 0) => {
  if (xp >= 20000) return 'Legend';
  if (xp >= 12000) return 'Diamond';
  if (xp >= 7000) return 'Platinum';
  if (xp >= 3500) return 'Gold';
  if (xp >= 1200) return 'Silver';
  return 'Bronze';
};

const calculateScore = ({ answers = [], durationSeconds = 0, totalQuestions = 1 }) => {
  const correct = answers.filter((item) => item.isCorrect).length;
  const wrong = answers.filter((item) => item.selectedIndex !== null && !item.isCorrect).length;
  const skipped = answers.filter((item) => item.selectedIndex === null).length;
  const accuracy = totalQuestions ? Math.round((correct / totalQuestions) * 100) : 0;
  const difficultyBonus = answers.reduce((sum, item) => {
    if (!item.isCorrect) return sum;
    if (item.difficulty === 'Hard') return sum + 8;
    if (item.difficulty === 'Medium') return sum + 5;
    return sum + 3;
  }, 0);
  const speedBonus = Math.max(0, 60 - Math.round(durationSeconds / Math.max(totalQuestions, 1)));
  const xpEarned = correct * 12 + difficultyBonus + Math.round(speedBonus / 2);
  const pointsEarned = correct * 100 + difficultyBonus * 5 + speedBonus;
  const isPerfect = correct === totalQuestions;
  return { correct, wrong, skipped, accuracy, xpEarned, pointsEarned, isPerfect };
};

const getCategoryIcon = (id, size = 20) => {
  const icons = {
    'calendar': <Calendar size={size} />,
    'trophy': <Trophy size={size} />,
    'school': <GraduationCap size={size} />,
    'library': <Library size={size} />,
    'layers': <Layers size={size} />,
    'users': <Users size={size} />,
    'timer': <Timer size={size} />,
    'lightbulb': <Lightbulb size={size} />,
    'globe': <Globe size={size} />,
  };
  return icons[id] || <Sparkles size={size} />;
};

const getAchievementIcon = (id, size = 24) => {
  const icons = {
    'flag': <Flag size={size} />,
    'flame': <Flame size={size} />,
    'check': <CheckCheck size={size} />,
    'layers': <Layers size={size} />,
    'trophy': <Trophy size={size} />,
    'school': <GraduationCap size={size} />,
    'library': <Library size={size} />,
    'lightbulb': <Lightbulb size={size} />,
    'timer': <Timer size={size} />,
    'crown': <Crown size={size} />,
    'sun': <Sun size={size} />,
    'moon': <Moon size={size} />,
    'star': <StarIcon size={size} />,
  };
  return icons[id] || <Award size={size} />;
};

const USERS_COLLECTION = 'challengeUsers';
const QUESTIONS_COLLECTION = 'challengeQuestions';
const ATTEMPTS_COLLECTION = 'attempts';
const COLLECTION = 'challenges';

const defaultStats = (profile = {}) => ({
  uid: auth.currentUser?.uid || profile.uid || '',
  name: profile.username || auth.currentUser?.displayName || 'Student',
  university: profile.school || '',
  department: profile.department || '',
  avatar: profile.photo || auth.currentUser?.photoURL || '',
  xp: 0,
  totalPoints: 0,
  rank: 'Bronze',
  currentStreak: 0,
  longestStreak: 0,
  weeklyStreak: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  attempts: 0,
  averageScore: 0,
  accuracy: 0,
  completionRate: 0,
  streakDates: [],
  activity: [],
  categoryStats: {},
  earlySessions: 0,
  nightSessions: 0,
  updatedAt: null,
});

export default function ChallengeDashboard({ dark = false }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [savingResult, setSavingResult] = useState(false);
  const [leaderboardScope, setLeaderboardScope] = useState('global');

  const theme = {
    bg: dark ? "bg-[#070b14] text-white" : "bg-[#f5f7fb] text-gray-900",
    card: dark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200 shadow-sm",
    soft: dark ? "bg-white/5" : "bg-gray-100",
    textSoft: dark ? "text-gray-400" : "text-gray-500",
    input: dark ? "bg-white/5 border border-white/10 text-white placeholder:text-white/40" : "bg-white border border-gray-200 text-gray-900",
  };

  const fetchStats = useCallback(async () => {
    if (!auth.currentUser?.uid) return;
    try {
      const snap = await getDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid));
      const data = snap.exists() ? { ...defaultStats(), ...snap.data(), uid: auth.currentUser.uid } : defaultStats();
      setStats(data);
      return data;
    } catch { return defaultStats(); }
  }, []);

  const fetchLeaderboard = useCallback(async (scope = 'global') => {
    try {
      const snap = await getDocs(query(collection(db, USERS_COLLECTION), orderBy('xp', 'desc'), limit(50)));
      const rows = snap.docs.map((item, index) => ({ id: item.id, ...item.data(), position: index + 1 }))
        .filter((item) => {
          if (scope === 'university') return item.university && item.university === stats?.university;
          if (scope === 'department') return item.department && item.department === stats?.department;
          return true;
        });
      setLeaderboard(rows);
    } catch { setLeaderboard([]); }
  }, [stats]);

  const fetchHistory = useCallback(async () => {
    if (!auth.currentUser?.uid) return;
    try {
      const snap = await getDocs(
        query(collection(db, USERS_COLLECTION, auth.currentUser.uid, ATTEMPTS_COLLECTION), orderBy('createdAt', 'desc'), limit(20))
      );
      setHistory(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch { setHistory([]); }
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchStats(), fetchHistory()]).then(([s]) => {
      if (s) fetchLeaderboard('global');
    }).finally(() => setLoading(false));
  }, [user, fetchStats, fetchHistory, fetchLeaderboard]);

  useEffect(() => {
    if (stats) {
      const computed = ACHIEVEMENTS_LIST.map((item) => {
        let value = 0;
        const catMatch = item.metric?.match(/^(.+?)Correct$/);
        if (catMatch) {
          value = stats.categoryStats?.[catMatch[1]]?.correct || 0;
        } else if (item.metric === 'perfectScores') {
          value = stats.perfectScores || 0;
        } else {
          value = stats[item.metric] || 0;
        }
        const progress = Math.min(1, value / item.target);
        return { ...item, value, progress, unlocked: progress >= 1 };
      });
      setAchievements(computed);
    }
  }, [stats]);

  const fetchUserProfile = async () => {
    if (!auth.currentUser?.uid) return {};
    try {
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      return snap.exists() ? snap.data() : {};
    } catch { return {}; }
  };

  const filterFallbackByProfile = (questions, category, profile = {}) => {
    const userLevel = profile?.level?.toLowerCase().replace('l', '') || '';
    const userDept = (profile?.department || profile?.departmentName || '').trim().toLowerCase();
    const userFaculty = (profile?.faculty || '').trim().toLowerCase();

    let pool = category
      ? questions.filter((item) => item.category === category)
      : [...questions];

    if (category === 'department' && userDept) {
      pool = pool.filter((q) => {
        const qDept = (q.department || q.subject || '').toLowerCase();
        return !qDept || qDept.includes(userDept) || userDept.includes(qDept);
      });
    }
    if (category === 'level' && userLevel) {
      pool = pool.filter((q) => {
        const qLevel = (q.level || '').toLowerCase().replace('l', '');
        return !qLevel || qLevel === userLevel;
      });
    }
    if (category === 'faculty' && userFaculty) {
      pool = pool.filter((q) => {
        const qFac = (q.faculty || '').toLowerCase();
        return !qFac || qFac.includes(userFaculty) || userFaculty.includes(qFac);
      });
    }
    if (category === 'speed-quiz') {
      pool = pool.filter((q) => q.difficulty !== 'Hard');
    }
    return pool;
  };

  const fetchQuestions = async (category) => {
    const profile = await fetchUserProfile();
    const userLevel = profile?.level?.toLowerCase().replace('l', '') || '';
    const userDept = (profile?.department || profile?.departmentName || '').trim().toLowerCase();
    const userFaculty = (profile?.faculty || '').trim().toLowerCase();

    try {
      let constraints = [limit(16)];
      if (category && !['daily', 'random', 'speed-quiz'].includes(category)) {
        constraints.unshift(where('category', '==', category));
      }
      const snap = await getDocs(query(collection(db, QUESTIONS_COLLECTION), ...constraints));
      let remote = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => Array.isArray(item.answers) && item.answers.length >= 2);

      if (category === 'department' && userDept) {
        remote = remote.filter((q) => {
          const qDept = (q.department || q.departmentId || q.subject || '').toLowerCase();
          return !qDept || qDept === userDept || qDept.includes(userDept) || userDept.includes(qDept);
        });
      }
      if (category === 'level' && userLevel) {
        remote = remote.filter((q) => {
          const qLevel = (q.level || '').toLowerCase().replace('l', '');
          return !qLevel || qLevel === userLevel;
        });
      }
      if (category === 'faculty' && userFaculty) {
        remote = remote.filter((q) => {
          const qFac = (q.faculty || '').toLowerCase();
          return !qFac || qFac.includes(userFaculty) || userFaculty.includes(qFac);
        });
      }
      if (category === 'speed-quiz') {
        remote = remote.filter((q) => q.difficulty !== 'Hard' || (q.answers && q.answers.length <= 4));
      }
      if (remote.length) {
        return [...remote].sort(() => Math.random() - 0.5).slice(0, 8);
      }
    } catch {}
    const filteredPool = filterFallbackByProfile(FALLBACK_QUESTIONS, category, profile);
    return [...filteredPool].sort(() => Math.random() - 0.5).slice(0, 8);
  };

  const handleStartQuiz = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    const qs = await fetchQuestions(category.id);
    setQuestions(qs);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizStarted(true);
    setQuizFinished(false);
    setQuizResult(null);
    setStartTime(Date.now());
    setLoading(false);
  };

  const handleAnswer = (index) => {
    const current = questions[currentQuestionIndex];
    const isCorrect = index === current.correctIndex;
    const newAnswers = [...answers, {
      questionId: current.id,
      selectedIndex: index,
      isCorrect,
      difficulty: current.difficulty,
    }];
    setAnswers(newAnswers);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const handleSkip = () => {
    const newAnswers = [...answers, {
      questionId: questions[currentQuestionIndex].id,
      selectedIndex: null,
      isCorrect: false,
      difficulty: questions[currentQuestionIndex].difficulty,
    }];
    setAnswers(newAnswers);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = async (finalAnswers) => {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const score = calculateScore({ answers: finalAnswers, durationSeconds, totalQuestions: questions.length });
    setQuizResult(score);
    setQuizFinished(true);

    if (!auth.currentUser?.uid) return;
    setSavingResult(true);
    try {
      const previous = await fetchStats();
      const nextXp = (previous?.xp || 0) + score.xpEarned;
      const nextRank = getRankForXp(nextXp);
      const todayKey = getTodayKey();
      const yesterdayKey = getTodayKey(new Date(Date.now() - 86400000));
      const existingDates = previous?.streakDates || [];
      const uniqueDates = [...new Set(existingDates)];
      let nextCurrent = uniqueDates.includes(yesterdayKey) ? (previous?.currentStreak || 0) + 1 : 1;
      if (uniqueDates.includes(todayKey)) nextCurrent = previous?.currentStreak || 0;
      const nextDates = uniqueDates.includes(todayKey) ? uniqueDates : [...uniqueDates, todayKey].slice(-180);
      const categoryKey = selectedCategory?.id || 'daily';
      const existingCat = previous?.categoryStats?.[categoryKey] || {};
      const totalAttempts = (previous?.attempts || 0) + 1;
      const totalQuestionsAnswered = (previous?.questionsAnswered || 0) + questions.length;
      const totalCorrect = (previous?.correctAnswers || 0) + score.correct;

      const statsUpdate = {
        uid: auth.currentUser.uid,
        name: user?.displayName || previous?.name || 'Student',
        university: previous?.university || '',
        department: previous?.department || '',
        avatar: user?.photoURL || previous?.avatar || '',
        xp: nextXp,
        totalPoints: (previous?.totalPoints || 0) + score.pointsEarned,
        rank: nextRank,
        currentStreak: nextCurrent,
        longestStreak: Math.max(previous?.longestStreak || 0, nextCurrent),
        streakDates: nextDates,
        questionsAnswered: totalQuestionsAnswered,
        correctAnswers: totalCorrect,
        wrongAnswers: (previous?.wrongAnswers || 0) + score.wrong,
        attempts: totalAttempts,
        averageScore: Math.round((((previous?.averageScore || 0) * (previous?.attempts || 0)) + score.accuracy) / totalAttempts),
        accuracy: totalQuestionsAnswered ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0,
        categoryStats: {
          ...(previous?.categoryStats || {}),
          [categoryKey]: {
            attempted: (existingCat.attempted || 0) + questions.length,
            correct: (existingCat.correct || 0) + score.correct,
          },
        },
        activity: [
          { type: 'challenge_completed', category: categoryKey, accuracy: score.accuracy, dateKey: todayKey },
          ...(previous?.activity || []),
        ].slice(0, 12),
        ...(score.isPerfect ? { perfectScores: (previous?.perfectScores || 0) + 1 } : {}),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid), statsUpdate, { merge: true });
      const attemptRef = await addDoc(collection(db, USERS_COLLECTION, auth.currentUser.uid, ATTEMPTS_COLLECTION), {
        category: categoryKey,
        score: score.correct,
        totalQuestions: questions.length,
        accuracy: score.accuracy,
        durationSeconds,
        xpEarned: score.xpEarned,
        pointsEarned: score.pointsEarned,
        status: score.accuracy >= 70 ? 'Passed' : score.accuracy >= 40 ? 'Completed' : 'Practice',
        answers: finalAnswers,
        createdAt: serverTimestamp(),
        dateKey: todayKey,
      });
      await setDoc(doc(db, COLLECTION, 'latestAttempts', 'items', attemptRef.id), {
        category: categoryKey,
        score: score.correct,
        totalQuestions: questions.length,
        accuracy: score.accuracy,
        uid: auth.currentUser.uid,
        name: statsUpdate.name,
        university: statsUpdate.university,
        department: statsUpdate.department,
      });
      await fetchStats();
      await fetchLeaderboard(leaderboardScope);
      await fetchHistory();
    } catch (err) { console.error('Failed to save result:', err); }
    setSavingResult(false);
  };

  const handleBackToDashboard = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setSelectedCategory(null);
    setQuestions([]);
    setAnswers([]);
    setQuizResult(null);
    setActiveTab('dashboard');
  };

  const getRankColor = (rank) => {
    const colors = {
      'Bronze': '#CD7F32',
      'Silver': '#C0C0C0',
      'Gold': '#FFD700',
      'Platinum': '#E5E4E2',
      'Diamond': '#B9F2FF',
      'Legend': '#FF6B35',
    };
    return colors[rank] || '#6366F1';
  };

  const getStatusColor = (accuracy) => {
    if (accuracy >= 70) return 'text-green-500';
    if (accuracy >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (accuracy) => {
    if (accuracy >= 70) return 'Passed';
    if (accuracy >= 40) return 'Completed';
    return 'Practice';
  };

  const completedToday = stats?.streakDates?.includes(getTodayKey());
  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'categories', label: 'Challenges', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'achievements', label: 'Achievements', icon: Medal },
    { id: 'history', label: 'History', icon: Clock },
  ];

  if (loading && !stats) {
    return (
      <div className={`min-h-screen md:pt-20 ${theme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-5" />
          <h2 className="text-xl font-bold">Loading Challenge Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (quizStarted && !quizFinished) {
    const current = questions[currentQuestionIndex];
    if (!current) return null;
    return (
      <div className={`min-h-screen md:pt-20 ${theme.bg} transition-all duration-300`}>
        <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={handleBackToDashboard} className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${theme.card} text-sm font-medium`}>
              ← Quit
            </button>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${theme.textSoft}`}>{currentQuestionIndex + 1}/{questions.length}</span>
              <div className="w-32 h-2 rounded-full bg-gray-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className={`${theme.card} rounded-3xl p-6 md:p-8 mb-6`}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${current.difficulty === 'Hard' ? 'bg-red-500/10 text-red-500' : current.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
                {current.difficulty}
              </span>
              <span className={`text-xs ${theme.textSoft}`}>{current.subject}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-6">{current.prompt}</h3>
            <div className="space-y-3">
              {current.answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] ${
                    dark ? 'border-white/10 hover:border-indigo-500/50 bg-white/5' : 'border-gray-200 hover:border-indigo-500 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${dark ? 'bg-white/10' : 'bg-gray-100'}`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="font-medium">{answer}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={handleSkip} className={`mt-4 px-4 py-2 rounded-2xl ${theme.soft} text-sm ${theme.textSoft}`}>
              Skip this question
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizFinished && quizResult) {
    return (
      <div className={`min-h-screen md:pt-20 ${theme.bg} transition-all duration-300`}>
        <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8 max-w-3xl mx-auto">
          <div className={`${theme.card} rounded-3xl p-6 md:p-8 text-center mb-6`}>
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
              {quizResult.isPerfect ? <Crown size={40} className="text-yellow-500" /> : <Trophy size={40} className="text-indigo-500" />}
            </div>
            <h2 className="text-3xl font-black mb-2">
              {quizResult.isPerfect ? 'Perfect Score! 🎉' : quizResult.accuracy >= 70 ? 'Great Job! 🎉' : quizResult.accuracy >= 40 ? 'Good Effort! 💪' : 'Keep Practicing! 📚'}
            </h2>
            <p className={`${theme.textSoft} mb-6`}>{selectedCategory?.title} Challenge</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`${theme.soft} rounded-2xl p-4`}>
                <p className={`text-xs ${theme.textSoft}`}>Accuracy</p>
                <p className="text-2xl font-black text-indigo-500">{quizResult.accuracy}%</p>
              </div>
              <div className={`${theme.soft} rounded-2xl p-4`}>
                <p className={`text-xs ${theme.textSoft}`}>Correct</p>
                <p className="text-2xl font-black text-green-500">{quizResult.correct}/{questions.length}</p>
              </div>
              <div className={`${theme.soft} rounded-2xl p-4`}>
                <p className={`text-xs ${theme.textSoft}`}>XP Earned</p>
                <p className="text-2xl font-black text-yellow-500">+{quizResult.xpEarned}</p>
              </div>
              <div className={`${theme.soft} rounded-2xl p-4`}>
                <p className={`text-xs ${theme.textSoft}`}>Status</p>
                <p className={`text-2xl font-black ${getStatusColor(quizResult.accuracy)}`}>{getStatusBadge(quizResult.accuracy)}</p>
              </div>
            </div>

            {savingResult && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Loader2 size={18} className="animate-spin" />
                <span className={`text-sm ${theme.textSoft}`}>Saving your results...</span>
              </div>
            )}

            <button onClick={handleBackToDashboard} className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition">
              Back to Dashboard
            </button>
          </div>

          <div className={`${theme.card} rounded-3xl p-6`}>
            <h3 className="font-bold text-lg mb-4">Question Review</h3>
            <div className="space-y-3">
              {questions.map((q, i) => {
                const ans = answers[i];
                return (
                  <div key={q.id} className={`${theme.soft} rounded-2xl p-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">Q{i + 1}: {q.prompt}</p>
                        <p className={`text-xs ${ans?.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                          {ans?.isCorrect ? '✓ Correct' : ans?.selectedIndex === null ? '— Skipped' : '✗ Incorrect'}
                        </p>
                        {!ans?.isCorrect && q.explanation && (
                          <p className={`text-xs mt-1 ${theme.textSoft}`}>{q.explanation}</p>
                        )}
                      </div>
                      <span className={`text-xs font-bold ${ans?.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                        {ans?.isCorrect ? '+1' : '+0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen md:pt-20 ${theme.bg} transition-all duration-300`}>
      <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8">
        {/* TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['dashboard', 'categories', 'leaderboard', 'achievements', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab ? 'bg-indigo-600 text-white' : theme.card
              }`}
            >
              {tab === 'dashboard' && '📊 Dashboard'}
              {tab === 'categories' && '🎯 Challenges'}
              {tab === 'leaderboard' && '🏆 Leaderboard'}
              {tab === 'achievements' && '🎖️ Achievements'}
              {tab === 'history' && '📜 History'}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            {/* Hero Stats */}
            <div className={`relative overflow-hidden rounded-4xl p-6 md:p-8 mb-8 border ${
              dark ? 'bg-linear-to-br from-indigo-950 via-[#0f172a] to-black border-white/10' : 'bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 border-indigo-400/20 text-white'
            }`}>
              <div className="absolute top-0 right-0 opacity-20"><Sparkles size={180} /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={24} className="text-orange-400" />
                  <span className="text-2xl font-black">{stats?.currentStreak || 0} Day Streak</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-white/70">Total XP</p>
                    <p className="text-2xl font-black">{stats?.xp || 0}</p>
                  </div>
                  <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-white/70">Rank</p>
                    <p className="text-2xl font-black" style={{ color: getRankColor(stats?.rank) }}>{stats?.rank || 'Bronze'}</p>
                  </div>
                  <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-white/70">Questions</p>
                    <p className="text-2xl font-black">{stats?.questionsAnswered || 0}</p>
                  </div>
                  <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-white/70">Accuracy</p>
                    <p className="text-2xl font-black">{stats?.accuracy || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-lg font-black mb-4">Quick Challenge</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {CHALLENGE_CATEGORIES.slice(0, 4).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleStartQuiz(cat)}
                    className={`${theme.card} rounded-3xl p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: cat.tone + '20', color: cat.tone }}>
                        {getCategoryIcon(cat.icon)}
                      </div>
                    </div>
                    <h4 className="font-bold text-sm">{cat.title}</h4>
                    <p className={`text-xs ${theme.textSoft} mt-1`}>{cat.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`${theme.card} rounded-3xl p-6`}>
              <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
              {history.length === 0 ? (
                <div className={`${theme.soft} rounded-2xl p-8 text-center`}>
                  <Activity size={40} className="mx-auto mb-3 opacity-50" />
                  <p className={`text-sm ${theme.textSoft}`}>No activity yet. Start a challenge!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 5).map((item) => (
                    <div key={item.id} className={`${theme.soft} rounded-2xl p-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${getStatusColor(item.accuracy)} bg-current/10`}>
                          {item.accuracy}%
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">{item.category} Challenge</p>
                          <p className={`text-xs ${theme.textSoft}`}>{item.score}/{item.totalQuestions} correct · +{item.xpEarned} XP</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${getStatusColor(item.accuracy)}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div>
            <h2 className="text-2xl font-black mb-2">Challenge Categories</h2>
            <p className={`${theme.textSoft} mb-6`}>Choose a category to start answering questions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHALLENGE_CATEGORIES.map((cat) => {
                const catStats = stats?.categoryStats?.[cat.id] || {};
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleStartQuiz(cat)}
                    className={`${theme.card} rounded-3xl p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: cat.tone + '20', color: cat.tone }}>
                        {getCategoryIcon(cat.icon, 24)}
                      </div>
                      <ArrowRight size={18} className={`${theme.textSoft}`} />
                    </div>
                    <h3 className="font-bold text-lg">{cat.title}</h3>
                    <p className={`text-sm ${theme.textSoft} mb-3`}>{cat.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${theme.textSoft}`}>{cat.questionCount.toLocaleString()} questions</span>
                      {catStats.attempted > 0 && (
                        <span className="text-xs font-bold text-indigo-500">{catStats.correct}/{catStats.attempted}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black">Leaderboard</h2>
                <p className={`${theme.textSoft} text-sm`}>Top challengers ranked by XP</p>
              </div>
              <div className="flex gap-2">
                {['global', 'university', 'department'].map((scope) => (
                  <button
                    key={scope}
                    onClick={() => { setLeaderboardScope(scope); fetchLeaderboard(scope); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                      leaderboardScope === scope ? 'bg-indigo-600 text-white' : theme.soft
                    }`}
                  >
                    {scope === 'global' ? '🌍 Global' : scope === 'university' ? '🏫 University' : '📚 Department'}
                  </button>
                ))}
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className={`${theme.card} rounded-3xl p-10 text-center`}>
                <Trophy size={50} className="mx-auto mb-4 opacity-50" />
                <h3 className="font-bold text-xl mb-2">No Rankings Yet</h3>
                <p className={`text-sm ${theme.textSoft}`}>Complete challenges to appear on the leaderboard.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((item, index) => {
                  const isMe = item.uid === auth.currentUser?.uid;
                  return (
                    <div key={item.id || index} className={`${theme.card} rounded-2xl p-4 flex items-center gap-4 ${isMe ? 'ring-2 ring-indigo-500' : ''}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-gray-400 text-white' : index === 2 ? 'bg-orange-600 text-white' : theme.soft
                      }`}>
                        {item.position || index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name || 'Student'}</p>
                        <p className={`text-xs ${theme.textSoft}`}>{item.university || ''} {item.department ? `· ${item.department}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{item.xp || 0} XP</p>
                        <p className="text-xs font-medium" style={{ color: getRankColor(item.rank) }}>{item.rank || 'Bronze'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div>
            <h2 className="text-2xl font-black mb-2">Achievements</h2>
            <p className={`${theme.textSoft} mb-6`}>Complete challenges to unlock achievements</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach) => (
                <div key={ach.id} className={`${theme.card} rounded-3xl p-5 ${ach.unlocked ? '' : 'opacity-60'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${ach.unlocked ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}>
                      {getAchievementIcon(ach.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm">{ach.title}</h4>
                      <p className={`text-xs ${theme.textSoft}`}>{ach.unlocked ? 'Unlocked 🎉' : `${ach.value}/${ach.target}`}</p>
                    </div>
                    {ach.unlocked && <CheckCircle2 size={18} className="text-green-500" />}
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10">
                    <div className={`h-full rounded-full transition-all ${ach.unlocked ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, ach.progress * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-black mb-2">Challenge History</h2>
            <p className={`${theme.textSoft} mb-6`}>Your past challenge attempts</p>
            {history.length === 0 ? (
              <div className={`${theme.card} rounded-3xl p-10 text-center`}>
                <Clock size={50} className="mx-auto mb-4 opacity-50" />
                <h3 className="font-bold text-xl mb-2">No History Yet</h3>
                <p className={`text-sm ${theme.textSoft}`}>Complete a challenge to see your history here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className={`${theme.card} rounded-3xl p-5`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.accuracy)} bg-current/10`}>
                          {item.status}
                        </span>
                        <span className="font-medium text-sm capitalize">{item.category} Challenge</span>
                      </div>
                      <span className={`text-xs ${theme.textSoft}`}>+{item.xpEarned} XP</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className={`${theme.soft} rounded-xl p-2 text-center`}>
                        <p className={`text-xs ${theme.textSoft}`}>Score</p>
                        <p className="font-bold">{item.score}/{item.totalQuestions}</p>
                      </div>
                      <div className={`${theme.soft} rounded-xl p-2 text-center`}>
                        <p className={`text-xs ${theme.textSoft}`}>Accuracy</p>
                        <p className="font-bold">{item.accuracy}%</p>
                      </div>
                      <div className={`${theme.soft} rounded-xl p-2 text-center`}>
                        <p className={`text-xs ${theme.textSoft}`}>Duration</p>
                        <p className="font-bold">{item.durationSeconds || 0}s</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
