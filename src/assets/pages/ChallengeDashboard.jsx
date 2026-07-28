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
  { id: 'jamb', title: 'JAMB Practice', subtitle: 'UTME & aptitude prep', icon: 'school', tone: '#0EA5E9', difficulty: 'Mixed', questionCount: 2000 },
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
  { id: 'jamb-master', title: 'JAMB Master', icon: 'school', target: 50, metric: 'jambCorrect' },
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
  // ─── JAMB: English ────────────────────────────────────────
  { id: 'jamb-eng-1', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Choose the correct spelling:', answers: ['Accommodation', 'Acomodation', 'Acommodation', 'Accomodation'], correctIndex: 0, explanation: '"Accommodation" has two c\'s and two m\'s.' },
  { id: 'jamb-eng-2', category: 'jamb', subject: 'English', difficulty: 'Easy', prompt: 'Choose the correct spelling:', answers: ['Necessary', 'Neccessary', 'Necesary', 'Neccesary'], correctIndex: 0, explanation: '"Necessary" has one c and two s\'s.' },
  { id: 'jamb-eng-3', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Choose the correct spelling:', answers: ['Embarrass', 'Embarass', 'Embarras', 'Embaras'], correctIndex: 0, explanation: '"Embarrass" has two r\'s and two s\'s.' },
  { id: 'jamb-eng-4', category: 'jamb', subject: 'English', difficulty: 'Hard', prompt: 'Choose the correct spelling:', answers: ['Pharaoh', 'Pharoah', 'Pharaoah', 'Pharoh'], correctIndex: 0, explanation: '"Pharaoh" is the correct spelling of the ancient Egyptian ruler.' },
  { id: 'jamb-eng-5', category: 'jamb', subject: 'English', difficulty: 'Easy', prompt: 'Which word is a synonym for "happy"?', answers: ['Sad', 'Angry', 'Joyful', 'Tired'], correctIndex: 2, explanation: '"Joyful" means feeling or expressing great happiness.' },
  { id: 'jamb-eng-6', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Which word is an antonym for "generous"?', answers: ['Kind', 'Stingy', 'Benevolent', 'Charitable'], correctIndex: 1, explanation: '"Stingy" means unwilling to give or share, opposite of generous.' },
  { id: 'jamb-eng-7', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Identify the correct sentence:', answers: ['The boy who won the prize is my brother.', 'The boy whom won the prize is my brother.', 'The boy which won the prize is my brother.', 'The boy that won the prize are my brother.'], correctIndex: 0, explanation: '"Who" is the correct relative pronoun for a person as the subject.' },
  { id: 'jamb-eng-8', category: 'jamb', subject: 'English', difficulty: 'Hard', prompt: 'Identify the figure of speech: "The world is a stage."', answers: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'], correctIndex: 1, explanation: 'A metaphor directly compares two unlike things without using "like" or "as".' },
  { id: 'jamb-eng-9', category: 'jamb', subject: 'English', difficulty: 'Easy', prompt: 'What is the plural of "child"?', answers: ['Childs', 'Childes', 'Children', 'Child\'s'], correctIndex: 2, explanation: '"Children" is the irregular plural form of "child".' },
  { id: 'jamb-eng-10', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Choose the correct preposition: "He is interested _____ learning French."', answers: ['on', 'at', 'in', 'for'], correctIndex: 2, explanation: 'The correct preposition after "interested" is "in".' },
  { id: 'jamb-eng-11', category: 'jamb', subject: 'English', difficulty: 'Hard', prompt: 'What is the meaning of the idiom "bite the bullet"?', answers: ['To eat quickly', 'To face a difficult situation bravely', 'To shoot a gun', 'To make a mistake'], correctIndex: 1, explanation: '"Bite the bullet" means to endure a painful or unpleasant situation with courage.' },
  { id: 'jamb-eng-12', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Which sentence uses the correct tense?', answers: ['I have went to the market yesterday.', 'I have gone to the market yesterday.', 'I went to the market yesterday.', 'I go to the market yesterday.'], correctIndex: 2, explanation: 'For a completed action at a specific past time, use the simple past tense "went".' },
  // ─── JAMB: Mathematics ────────────────────────────────────
  { id: 'jamb-maths-1', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'If 3x + 7 = 28, what is the value of x?', answers: ['5', '6', '7', '9'], correctIndex: 2, explanation: 'Subtract 7 from both sides to get 3x = 21, then divide by 3.' },
  { id: 'jamb-maths-2', category: 'jamb', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is 15% of 200?', answers: ['15', '20', '30', '35'], correctIndex: 2, explanation: '15% of 200 = (15/100) × 200 = 30.' },
  { id: 'jamb-maths-3', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'Simplify: 2(x + 3) - 4x', answers: ['-2x + 6', '2x + 6', '-2x + 3', '6x + 6'], correctIndex: 0, explanation: '2(x + 3) - 4x = 2x + 6 - 4x = -2x + 6.' },
  { id: 'jamb-maths-4', category: 'jamb', subject: 'Mathematics', difficulty: 'Hard', prompt: 'Solve for x: x² - 5x + 6 = 0', answers: ['x = 2 or 3', 'x = -2 or -3', 'x = 1 or 6', 'x = -1 or -6'], correctIndex: 0, explanation: 'x² - 5x + 6 = (x - 2)(x - 3) = 0, so x = 2 or x = 3.' },
  { id: 'jamb-maths-5', category: 'jamb', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is the square root of 144?', answers: ['10', '11', '12', '14'], correctIndex: 2, explanation: '12 × 12 = 144, so the square root is 12.' },
  { id: 'jamb-maths-6', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'If a triangle has angles 50° and 60°, what is the third angle?', answers: ['60°', '70°', '80°', '90°'], correctIndex: 1, explanation: 'Sum of angles in a triangle = 180°. 180 - 50 - 60 = 70°.' },
  { id: 'jamb-maths-7', category: 'jamb', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the value of log₂(32)?', answers: ['4', '5', '6', '16'], correctIndex: 1, explanation: '2⁵ = 32, so log₂(32) = 5.' },
  { id: 'jamb-maths-8', category: 'jamb', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is the perimeter of a rectangle with length 8cm and width 5cm?', answers: ['13cm', '26cm', '40cm', '20cm'], correctIndex: 1, explanation: 'Perimeter = 2(length + width) = 2(8 + 5) = 26cm.' },
  { id: 'jamb-maths-9', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'Convert 0.75 to a fraction in its simplest form.', answers: ['3/4', '7/10', '3/5', '1/2'], correctIndex: 0, explanation: '0.75 = 75/100 = 3/4.' },
  { id: 'jamb-maths-10', category: 'jamb', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the derivative of 3x² + 2x - 1?', answers: ['6x + 2', '3x + 2', '6x - 1', '3x² + 2'], correctIndex: 0, explanation: 'd/dx(3x²) = 6x, d/dx(2x) = 2, d/dx(-1) = 0. So derivative = 6x + 2.' },
  // ─── JAMB: Physics ────────────────────────────────────────
  { id: 'jamb-phys-1', category: 'jamb', subject: 'Physics', difficulty: 'Easy', prompt: 'What is the SI unit of force?', answers: ['Joule', 'Newton', 'Watt', 'Pascal'], correctIndex: 1, explanation: 'Force is measured in newtons (N).' },
  { id: 'jamb-phys-2', category: 'jamb', subject: 'Physics', difficulty: 'Medium', prompt: 'What is the speed of light in a vacuum?', answers: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'], correctIndex: 1, explanation: 'The speed of light in a vacuum is approximately 3 × 10⁸ m/s.' },
  { id: 'jamb-phys-3', category: 'jamb', subject: 'Physics', difficulty: 'Easy', prompt: 'Which of these is a scalar quantity?', answers: ['Velocity', 'Force', 'Temperature', 'Acceleration'], correctIndex: 2, explanation: 'Temperature has magnitude only, no direction, making it a scalar.' },
  { id: 'jamb-phys-4', category: 'jamb', subject: 'Physics', difficulty: 'Hard', prompt: 'What is the unit of electrical resistance?', answers: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctIndex: 2, explanation: 'Electrical resistance is measured in ohms (Ω).' },
  { id: 'jamb-phys-5', category: 'jamb', subject: 'Physics', difficulty: 'Medium', prompt: 'Which law states that energy cannot be created or destroyed?', answers: ['Newton\'s First Law', 'Law of Conservation of Energy', 'Ohm\'s Law', 'Boyle\'s Law'], correctIndex: 1, explanation: 'The Law of Conservation of Energy states energy can only be converted from one form to another.' },
  { id: 'jamb-phys-6', category: 'jamb', subject: 'Physics', difficulty: 'Easy', prompt: 'What is the acceleration due to gravity on Earth?', answers: ['5.8 m/s²', '9.8 m/s²', '12.6 m/s²', '15.2 m/s²'], correctIndex: 1, explanation: 'The standard acceleration due to gravity on Earth is 9.8 m/s².' },
  { id: 'jamb-phys-7', category: 'jamb', subject: 'Physics', difficulty: 'Medium', prompt: 'Which type of lens is used to correct short-sightedness?', answers: ['Convex lens', 'Concave lens', 'Cylindrical lens', 'Bifocal lens'], correctIndex: 1, explanation: 'A concave (diverging) lens is used to correct myopia (short-sightedness).' },
  { id: 'jamb-phys-8', category: 'jamb', subject: 'Physics', difficulty: 'Hard', prompt: 'What is the formula for calculating kinetic energy?', answers: ['mgh', '½mv²', 'mv', 'ma'], correctIndex: 1, explanation: 'Kinetic energy = ½ × mass × velocity² = ½mv².' },
  // ─── JAMB: Chemistry ──────────────────────────────────────
  { id: 'jamb-chem-1', category: 'jamb', subject: 'Chemistry', difficulty: 'Easy', prompt: 'Which particle has a negative charge?', answers: ['Proton', 'Neutron', 'Electron', 'Nucleus'], correctIndex: 2, explanation: 'Electrons carry negative charge.' },
  { id: 'jamb-chem-2', category: 'jamb', subject: 'Chemistry', difficulty: 'Medium', prompt: 'What is the chemical symbol for gold?', answers: ['Go', 'Gd', 'Au', 'Ag'], correctIndex: 2, explanation: 'Gold\'s symbol is Au, from the Latin word "aurum".' },
  { id: 'jamb-chem-3', category: 'jamb', subject: 'Chemistry', difficulty: 'Easy', prompt: 'What is the pH of pure water?', answers: ['5', '7', '9', '11'], correctIndex: 1, explanation: 'Pure water has a neutral pH of 7.' },
  { id: 'jamb-chem-4', category: 'jamb', subject: 'Chemistry', difficulty: 'Hard', prompt: 'Which gas is produced when zinc reacts with hydrochloric acid?', answers: ['Oxygen', 'Hydrogen', 'Chlorine', 'Nitrogen'], correctIndex: 1, explanation: 'Zn + 2HCl → ZnCl₂ + H₂, so hydrogen gas is produced.' },
  { id: 'jamb-chem-5', category: 'jamb', subject: 'Chemistry', difficulty: 'Medium', prompt: 'What is the atomic number of carbon?', answers: ['4', '6', '8', '12'], correctIndex: 1, explanation: 'Carbon has atomic number 6, meaning it has 6 protons.' },
  { id: 'jamb-chem-6', category: 'jamb', subject: 'Chemistry', difficulty: 'Easy', prompt: 'Which of these is a noble gas?', answers: ['Oxygen', 'Nitrogen', 'Helium', 'Chlorine'], correctIndex: 2, explanation: 'Helium is a noble gas (Group 18 element).' },
  { id: 'jamb-chem-7', category: 'jamb', subject: 'Chemistry', difficulty: 'Medium', prompt: 'What is the chemical formula for water?', answers: ['H₂O', 'CO₂', 'NaCl', 'H₂SO₄'], correctIndex: 0, explanation: 'Water consists of two hydrogen atoms and one oxygen atom: H₂O.' },
  { id: 'jamb-chem-8', category: 'jamb', subject: 'Chemistry', difficulty: 'Hard', prompt: 'Which of these is an example of a covalent bond?', answers: ['NaCl', 'H₂O', 'KCl', 'MgO'], correctIndex: 1, explanation: 'H₂O forms covalent bonds where electrons are shared between atoms.' },
  // ─── JAMB: Biology ────────────────────────────────────────
  { id: 'jamb-bio-1', category: 'jamb', subject: 'Biology', difficulty: 'Easy', prompt: 'The basic unit of life is the:', answers: ['Tissue', 'Organ', 'Cell', 'System'], correctIndex: 2, explanation: 'Cells are the basic structural and functional units of life.' },
  { id: 'jamb-bio-2', category: 'jamb', subject: 'Biology', difficulty: 'Medium', prompt: 'Which organ is responsible for pumping blood in the human body?', answers: ['Lungs', 'Liver', 'Heart', 'Kidney'], correctIndex: 2, explanation: 'The heart pumps blood throughout the circulatory system.' },
  { id: 'jamb-bio-3', category: 'jamb', subject: 'Biology', difficulty: 'Easy', prompt: 'How many bones are in the adult human body?', answers: ['106', '206', '306', '150'], correctIndex: 1, explanation: 'An adult human has 206 bones.' },
  { id: 'jamb-bio-4', category: 'jamb', subject: 'Biology', difficulty: 'Hard', prompt: 'What is the process by which plants make their own food called?', answers: ['Respiration', 'Photosynthesis', 'Digestion', 'Fermentation'], correctIndex: 1, explanation: 'Photosynthesis is the process where plants use sunlight to produce food.' },
  { id: 'jamb-bio-5', category: 'jamb', subject: 'Biology', difficulty: 'Medium', prompt: 'Which blood type is known as the universal donor?', answers: ['Type A', 'Type B', 'Type AB', 'Type O'], correctIndex: 3, explanation: 'Type O negative blood can be donated to any blood type.' },
  { id: 'jamb-bio-6', category: 'jamb', subject: 'Biology', difficulty: 'Easy', prompt: 'What is the largest organ in the human body?', answers: ['Liver', 'Brain', 'Skin', 'Heart'], correctIndex: 2, explanation: 'The skin is the largest organ, covering about 1.5-2 square meters.' },
  { id: 'jamb-bio-7', category: 'jamb', subject: 'Biology', difficulty: 'Medium', prompt: 'Which vitamin is produced when the skin is exposed to sunlight?', answers: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'], correctIndex: 3, explanation: 'Sunlight triggers vitamin D synthesis in the skin.' },
  { id: 'jamb-bio-8', category: 'jamb', subject: 'Biology', difficulty: 'Hard', prompt: 'What is the function of the mitochondria?', answers: ['Protein synthesis', 'Energy production', 'Waste elimination', 'Cell division'], correctIndex: 1, explanation: 'Mitochondria are the powerhouse of the cell, producing ATP through cellular respiration.' },
  // ─── JAMB: Government ─────────────────────────────────────
  { id: 'jamb-gov-1', category: 'jamb', subject: 'Government', difficulty: 'Easy', prompt: 'Who is the head of state in Nigeria?', answers: ['Senate President', 'Chief Justice', 'President', 'Governor'], correctIndex: 2, explanation: 'The President is both the head of state and head of government in Nigeria.' },
  { id: 'jamb-gov-2', category: 'jamb', subject: 'Government', difficulty: 'Medium', prompt: 'How many tiers of government does Nigeria operate?', answers: ['Two', 'Three', 'Four', 'Five'], correctIndex: 1, explanation: 'Nigeria operates a three-tier federal system: Federal, State, and Local Government.' },
  { id: 'jamb-gov-3', category: 'jamb', subject: 'Government', difficulty: 'Hard', prompt: 'Nigeria became a republic in which year?', answers: ['1960', '1963', '1979', '1999'], correctIndex: 1, explanation: 'Nigeria became a republic on October 1, 1963.' },
  { id: 'jamb-gov-4', category: 'jamb', subject: 'Government', difficulty: 'Easy', prompt: 'What is the upper chamber of the Nigerian National Assembly called?', answers: ['House of Representatives', 'Senate', 'House of Assembly', 'Federal Executive Council'], correctIndex: 1, explanation: 'The Senate is the upper chamber of the National Assembly.' },
  // ─── JAMB: Economics ──────────────────────────────────────
  { id: 'jamb-econ-1', category: 'jamb', subject: 'Economics', difficulty: 'Easy', prompt: 'What is the basic economic problem?', answers: ['Inflation', 'Scarcity', 'Unemployment', 'Taxation'], correctIndex: 1, explanation: 'Scarcity is the fundamental economic problem of unlimited wants with limited resources.' },
  { id: 'jamb-econ-2', category: 'jamb', subject: 'Economics', difficulty: 'Medium', prompt: 'What does GDP stand for?', answers: ['Gross Domestic Product', 'General Development Plan', 'Gross Demand Price', 'Government Debt Percentage'], correctIndex: 0, explanation: 'GDP is the total value of all goods and services produced in a country.' },
  { id: 'jamb-econ-3', category: 'jamb', subject: 'Economics', difficulty: 'Hard', prompt: 'Which type of inflation is caused by excess demand?', answers: ['Cost-push inflation', 'Demand-pull inflation', 'Hyperinflation', 'Stagflation'], correctIndex: 1, explanation: 'Demand-pull inflation occurs when aggregate demand exceeds aggregate supply.' },
  { id: 'jamb-econ-4', category: 'jamb', subject: 'Economics', difficulty: 'Medium', prompt: 'What is the law of demand?', answers: ['Price and quantity demanded are directly related', 'Price and quantity demanded are inversely related', 'Demand is always constant', 'Supply determines demand'], correctIndex: 1, explanation: 'The law of demand states that as price increases, quantity demanded decreases, and vice versa.' },
  // ─── JAMB: Literature ─────────────────────────────────────
  { id: 'jamb-lit-1', category: 'jamb', subject: 'Literature', difficulty: 'Easy', prompt: 'Who wrote "Things Fall Apart"?', answers: ['Wole Soyinka', 'Chinua Achebe', 'Chimamanda Adichie', 'Ben Okri'], correctIndex: 1, explanation: 'Chinua Achebe wrote the classic novel "Things Fall Apart" in 1958.' },
  { id: 'jamb-lit-2', category: 'jamb', subject: 'Literature', difficulty: 'Medium', prompt: 'Who is the first African Nobel Laureate in Literature?', answers: ['Chinua Achebe', 'Wole Soyinka', 'Ngũgĩ wa Thiong\'o', 'Nadine Gordimer'], correctIndex: 1, explanation: 'Wole Soyinka won the Nobel Prize in Literature in 1986.' },
  { id: 'jamb-lit-3', category: 'jamb', subject: 'Literature', difficulty: 'Hard', prompt: 'In "Things Fall Apart", who is the protagonist?', answers: ['Ikemefuna', 'Obierika', 'Okonkwo', 'Nwoye'], correctIndex: 2, explanation: 'Okonkwo is the main character and protagonist of "Things Fall Apart".' },
  { id: 'jamb-lit-4', category: 'jamb', subject: 'Literature', difficulty: 'Medium', prompt: 'Which literary device is used in "The pen is mightier than the sword"?', answers: ['Simile', 'Metaphor', 'Alliteration', 'Onomatopoeia'], correctIndex: 1, explanation: 'This is a metaphor comparing the power of writing to the power of武力.' },
  // ─── JAMB: CRK ────────────────────────────────────────────
  { id: 'jamb-crk-1', category: 'jamb', subject: 'CRK', difficulty: 'Easy', prompt: 'How many books are in the Bible?', answers: ['27', '39', '66', '73'], correctIndex: 2, explanation: 'The Bible contains 66 books: 39 in the Old Testament and 27 in the New Testament.' },
  { id: 'jamb-crk-2', category: 'jamb', subject: 'CRK', difficulty: 'Medium', prompt: 'Who built the Ark according to the Bible?', answers: ['Abraham', 'Moses', 'Noah', 'David'], correctIndex: 2, explanation: 'Noah built the Ark to survive the great flood as instructed by God.' },
  { id: 'jamb-crk-3', category: 'jamb', subject: 'CRK', difficulty: 'Easy', prompt: 'How many disciples did Jesus have?', answers: ['7', '10', '12', '14'], correctIndex: 2, explanation: 'Jesus had twelve apostles/disciples.' },
  { id: 'jamb-crk-4', category: 'jamb', subject: 'CRK', difficulty: 'Hard', prompt: 'Which book follows the Gospels in the New Testament?', answers: ['Romans', 'Acts', 'Corinthians', 'Revelation'], correctIndex: 1, explanation: 'The Book of Acts follows the four Gospels (Matthew, Mark, Luke, John).' },
  // ─── JAMB: Geography ──────────────────────────────────────
  { id: 'jamb-geo-1', category: 'jamb', subject: 'Geography', difficulty: 'Easy', prompt: 'What is the capital of Nigeria?', answers: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano'], correctIndex: 1, explanation: 'Abuja has been the capital of Nigeria since 1991.' },
  { id: 'jamb-geo-2', category: 'jamb', subject: 'Geography', difficulty: 'Medium', prompt: 'Which is the longest river in the world?', answers: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], correctIndex: 1, explanation: 'The Nile River is approximately 6,650 km long, the longest in the world.' },
  { id: 'jamb-geo-3', category: 'jamb', subject: 'Geography', difficulty: 'Hard', prompt: 'What is the largest desert in the world?', answers: ['Sahara', 'Gobi', 'Antarctic', 'Kalahari'], correctIndex: 2, explanation: 'The Antarctic Desert is the largest desert, covering about 14 million km².' },
  { id: 'jamb-geo-4', category: 'jamb', subject: 'Geography', difficulty: 'Medium', prompt: 'Which ocean is the largest?', answers: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3, explanation: 'The Pacific Ocean is the largest and deepest ocean on Earth.' },
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
  // ─── JAMB: Commerce ───────────────────────────────────────
  { id: 'jamb-com-1', category: 'jamb', subject: 'Commerce', difficulty: 'Easy', prompt: 'What is the primary function of a wholesaler?', answers: ['Retailing goods', 'Buying in bulk and distributing', 'Manufacturing goods', 'Providing services'], correctIndex: 1, explanation: 'Wholesalers buy goods in large quantities from manufacturers and sell to retailers.' },
  { id: 'jamb-com-2', category: 'jamb', subject: 'Commerce', difficulty: 'Medium', prompt: 'Which of these is a type of trade?', answers: ['Production', 'Consumption', 'Retail trade', 'Advertising'], correctIndex: 2, explanation: 'Retail trade is a type of trade involving the sale of goods to final consumers.' },
  { id: 'jamb-com-3', category: 'jamb', subject: 'Commerce', difficulty: 'Hard', prompt: 'What does "entrepreneur" mean?', answers: ['An employee', 'A person who starts a business', 'A government worker', 'A teacher'], correctIndex: 1, explanation: 'An entrepreneur is someone who starts and runs a business, taking financial risks.' },
  { id: 'jamb-com-4', category: 'jamb', subject: 'Commerce', difficulty: 'Medium', prompt: 'Which document is used to request goods from a supplier?', answers: ['Invoice', 'Receipt', 'Purchase order', 'Credit note'], correctIndex: 2, explanation: 'A purchase order is a commercial document issued by a buyer to a seller requesting goods.' },
  { id: 'jamb-com-5', category: 'jamb', subject: 'Commerce', difficulty: 'Easy', prompt: 'What is the main purpose of advertising?', answers: ['To reduce prices', 'To promote products', 'To hire workers', 'To pay taxes'], correctIndex: 1, explanation: 'Advertising aims to promote products and services to potential customers.' },
  { id: 'jamb-com-6', category: 'jamb', subject: 'Commerce', difficulty: 'Hard', prompt: 'What is a "bill of lading"?', answers: ['A type of currency', 'A shipping document', 'A bank statement', 'An insurance policy'], correctIndex: 1, explanation: 'A bill of lading is a legal document issued by a carrier to acknowledge receipt of cargo for shipment.' },
  // ─── JAMB: Accounting ─────────────────────────────────────
  { id: 'jamb-acc-1', category: 'jamb', subject: 'Accounting', difficulty: 'Easy', prompt: 'What is the basic accounting equation?', answers: ['Assets = Liabilities + Equity', 'Assets = Revenue - Expenses', 'Liabilities = Assets + Equity', 'Equity = Assets + Liabilities'], correctIndex: 0, explanation: 'The accounting equation is Assets = Liabilities + Owner\'s Equity.' },
  { id: 'jamb-acc-2', category: 'jamb', subject: 'Accounting', difficulty: 'Medium', prompt: 'What does a debit entry represent in accounting?', answers: ['An increase in liabilities', 'An increase in assets', 'A decrease in assets', 'An increase in equity'], correctIndex: 1, explanation: 'A debit entry increases asset accounts and expense accounts.' },
  { id: 'jamb-acc-3', category: 'jamb', subject: 'Accounting', difficulty: 'Hard', prompt: 'What is depreciation?', answers: ['Increase in asset value', 'Allocation of asset cost over useful life', 'Profit from asset sale', 'Tax on assets'], correctIndex: 1, explanation: 'Depreciation is the systematic allocation of the cost of a tangible asset over its useful life.' },
  { id: 'jamb-acc-4', category: 'jamb', subject: 'Accounting', difficulty: 'Medium', prompt: 'Which financial statement shows a company\'s profitability?', answers: ['Balance sheet', 'Income statement', 'Cash flow statement', 'Statement of changes in equity'], correctIndex: 1, explanation: 'The income statement (profit and loss account) shows revenues and expenses to determine profitability.' },
  { id: 'jamb-acc-5', category: 'jamb', subject: 'Accounting', difficulty: 'Easy', prompt: 'What is a liability?', answers: ['Something owned', 'Something owed', 'Revenue earned', 'Cash received'], correctIndex: 1, explanation: 'A liability is a financial obligation or debt owed by a business.' },
  { id: 'jamb-acc-6', category: 'jamb', subject: 'Accounting', difficulty: 'Hard', prompt: 'What is "goodwill" in accounting?', answers: ['A charitable donation', 'An intangible asset representing brand value', 'A type of expense', 'A current liability'], correctIndex: 1, explanation: 'Goodwill is an intangible asset that represents the excess purchase price over fair market value of acquired assets.' },
  // ─── JAMB: Agricultural Science ───────────────────────────
  { id: 'jamb-agri-1', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Easy', prompt: 'What is the primary purpose of crop rotation?', answers: ['To increase pest infestation', 'To maintain soil fertility', 'To reduce crop yield', 'To increase water usage'], correctIndex: 1, explanation: 'Crop rotation helps maintain soil fertility and reduces pest and disease buildup.' },
  { id: 'jamb-agri-2', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Medium', prompt: 'Which of these is a leguminous crop?', answers: ['Maize', 'Rice', 'Cowpea', 'Cassava'], correctIndex: 2, explanation: 'Cowpea is a leguminous crop that fixes nitrogen in the soil.' },
  { id: 'jamb-agri-3', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Hard', prompt: 'What is the process of rearing fish called?', answers: ['Agriculture', 'Aquaculture', 'Apiculture', 'Horticulture'], correctIndex: 1, explanation: 'Aquaculture is the farming of fish and other aquatic organisms.' },
  { id: 'jamb-agri-4', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Easy', prompt: 'Which animal is commonly reared for meat in Nigeria?', answers: ['Cat', 'Goat', 'Parrot', 'Lizard'], correctIndex: 1, explanation: 'Goats are commonly reared for meat (chevon) in Nigeria.' },
  { id: 'jamb-agri-5', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Medium', prompt: 'What is the main function of a tractor in farming?', answers: ['Planting seeds', 'Mechanizing farm operations', 'Irrigating crops', 'Storing produce'], correctIndex: 1, explanation: 'Tractors are used to mechanize various farm operations like plowing, harrowing, and planting.' },
  { id: 'jamb-agri-6', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Hard', prompt: 'What is "shifting cultivation"?', answers: ['Farming on the same land continuously', 'Moving to new land when soil fertility declines', 'Growing crops in greenhouses', 'Farming without using tools'], correctIndex: 1, explanation: 'Shifting cultivation involves clearing new land when the old plot loses fertility.' },
  // ─── JAMB: Further Mathematics ────────────────────────────
  { id: 'jamb-fm-1', category: 'jamb', subject: 'Further Mathematics', difficulty: 'Hard', prompt: 'What is the determinant of matrix [[2, 3], [4, 5]]?', answers: ['-2', '2', '10', '-10'], correctIndex: 0, explanation: 'det = (2×5) - (3×4) = 10 - 12 = -2.' },
  { id: 'jamb-fm-2', category: 'jamb', subject: 'Further Mathematics', difficulty: 'Hard', prompt: 'What is the value of the limit as x→0 of (sin x)/x?', answers: ['0', '1', '∞', 'Undefined'], correctIndex: 1, explanation: 'The limit of (sin x)/x as x approaches 0 is 1.' },
  { id: 'jamb-fm-3', category: 'jamb', subject: 'Further Mathematics', difficulty: 'Hard', prompt: 'What is the sum of the first 10 terms of an AP with first term 2 and common difference 3?', answers: ['155', '165', '175', '185'], correctIndex: 0, explanation: 'Sₙ = n/2[2a + (n-1)d] = 10/2[4 + 27] = 5 × 31 = 155.' },
  { id: 'jamb-fm-4', category: 'jamb', subject: 'Further Mathematics', difficulty: 'Hard', prompt: 'What is the derivative of eˣ?', answers: ['eˣ', 'xeˣ⁻¹', 'ln(x)', '1/x'], correctIndex: 0, explanation: 'The derivative of eˣ with respect to x is eˣ.' },
  // ─── JAMB: Islamic Studies (IRS) ──────────────────────────
  { id: 'jamb-irs-1', category: 'jamb', subject: 'Islamic Studies', difficulty: 'Easy', prompt: 'How many pillars of Islam are there?', answers: ['3', '5', '7', '10'], correctIndex: 1, explanation: 'There are five pillars of Islam: Shahada, Salah, Zakat, Sawm, and Hajj.' },
  { id: 'jamb-irs-2', category: 'jamb', subject: 'Islamic Studies', difficulty: 'Medium', prompt: 'What is the holy book of Islam?', answers: ['Bible', 'Torah', 'Quran', 'Hadith'], correctIndex: 2, explanation: 'The Quran is the central religious text of Islam.' },
  { id: 'jamb-irs-3', category: 'jamb', subject: 'Islamic Studies', difficulty: 'Easy', prompt: 'Which city is the holiest in Islam?', answers: ['Medina', 'Mecca', 'Jerusalem', 'Baghdad'], correctIndex: 1, explanation: 'Mecca is the holiest city in Islam, home to the Kaaba.' },
  { id: 'jamb-irs-4', category: 'jamb', subject: 'Islamic Studies', difficulty: 'Hard', prompt: 'What is "Zakat"?', answers: ['Fasting', 'Pilgrimage', 'Charitable giving', 'Prayer'], correctIndex: 2, explanation: 'Zakat is the obligatory charitable giving in Islam, one of the five pillars.' },
  // ─── JAMB: History (Nigeria) ──────────────────────────────
  { id: 'jamb-his-1', category: 'jamb', subject: 'History', difficulty: 'Easy', prompt: 'Who was the first President of Nigeria?', answers: ['Abubakar Tafawa Balewa', 'Nnamdi Azikiwe', 'Olusegun Obasanjo', 'Shehu Shagari'], correctIndex: 1, explanation: 'Nnamdi Azikiwe became the first President of Nigeria in 1963.' },
  { id: 'jamb-his-2', category: 'jamb', subject: 'History', difficulty: 'Medium', prompt: 'The Berlin Conference of 1884-85 was about:', answers: ['The abolition of slavery', 'The partition of Africa', 'World War I', 'The formation of the UN'], correctIndex: 1, explanation: 'The Berlin Conference regulated European colonization and trade in Africa.' },
  { id: 'jamb-his-3', category: 'jamb', subject: 'History', difficulty: 'Hard', prompt: 'The Amalgamation of Nigeria occurred in which year?', answers: ['1900', '1914', '1922', '1947'], correctIndex: 1, explanation: 'The Northern and Southern protectorates of Nigeria were amalgamated in 1914.' },
  { id: 'jamb-his-4', category: 'jamb', subject: 'History', difficulty: 'Medium', prompt: 'Who led the Aba Women\'s Riot of 1929?', answers: ['Funmilayo Ransome-Kuti', 'Margaret Ekpo', 'Mary Slessor', 'Queen Amina'], correctIndex: 0, explanation: 'Funmilayo Ransome-Kuti was a key leader of the Aba Women\'s Riot (Women\'s War).' },
  // ─── JAMB: Yoruba ─────────────────────────────────────────
  { id: 'jamb-yor-1', category: 'jamb', subject: 'Yoruba', difficulty: 'Easy', prompt: 'What does "Bawo ni" mean in English?', answers: ['Good morning', 'How are you', 'Thank you', 'Goodbye'], correctIndex: 1, explanation: '"Bawo ni" is Yoruba for "How are you?" or "Hello".' },
  { id: 'jamb-yor-2', category: 'jamb', subject: 'Yoruba', difficulty: 'Medium', prompt: 'Who is the supreme deity in Yoruba mythology?', answers: ['Ogun', 'Sango', 'Olodumare', 'Ifa'], correctIndex: 2, explanation: 'Olodumare is the supreme god in Yoruba belief system.' },
  { id: 'jamb-yor-3', category: 'jamb', subject: 'Yoruba', difficulty: 'Easy', prompt: 'What is "E ku ise" used to express?', answers: ['Greeting for someone working', 'Greeting for morning', 'Greeting for night', 'Farewell'], correctIndex: 0, explanation: '"E ku ise" is a Yoruba greeting for someone who is working or busy.' },
  { id: 'jamb-yor-4', category: 'jamb', subject: 'Yoruba', difficulty: 'Hard', prompt: 'The Yoruba god of thunder is:', answers: ['Ogun', 'Sango', 'Obatala', 'Esu'], correctIndex: 1, explanation: 'Sango is the Yoruba deity of thunder and lightning.' },
  // ─── JAMB: Hausa ──────────────────────────────────────────
  { id: 'jamb-hau-1', category: 'jamb', subject: 'Hausa', difficulty: 'Easy', prompt: 'What does "Sannu" mean in English?', answers: ['Goodbye', 'Hello', 'Thank you', 'Sorry'], correctIndex: 1, explanation: '"Sannu" is a common Hausa greeting meaning "Hello".' },
  { id: 'jamb-hau-2', category: 'jamb', subject: 'Hausa', difficulty: 'Medium', prompt: 'What is "Na gode" in English?', answers: ['Hello', 'Goodbye', 'Thank you', 'Please'], correctIndex: 2, explanation: '"Na gode" means "Thank you" in Hausa.' },
  { id: 'jamb-hau-3', category: 'jamb', subject: 'Hausa', difficulty: 'Easy', prompt: 'Which of these is a Hausa cultural festival?', answers: ['Eyo', 'Durbar', 'New Yam', 'Argungu'], correctIndex: 1, explanation: 'The Durbar festival is a traditional Hausa horse-riding festival.' },
  { id: 'jamb-hau-4', category: 'jamb', subject: 'Hausa', difficulty: 'Hard', prompt: 'The famous Hausa city-state known for its walls is:', answers: ['Kano', 'Lagos', 'Ibadan', 'Enugu'], correctIndex: 0, explanation: 'Kano is famous for its ancient city walls and is a major Hausa city-state.' },
  // ─── JAMB: Igbo ───────────────────────────────────────────
  { id: 'jamb-igb-1', category: 'jamb', subject: 'Igbo', difficulty: 'Easy', prompt: 'What does "Kedu" mean in English?', answers: ['Good morning', 'How are you', 'Thank you', 'Goodbye'], correctIndex: 1, explanation: '"Kedu" is Igbo for "How are you?" or "Hello".' },
  { id: 'jamb-igb-2', category: 'jamb', subject: 'Igbo', difficulty: 'Medium', prompt: 'What is "Imeela" in English?', answers: ['Hello', 'Goodbye', 'Thank you', 'Welcome'], correctIndex: 2, explanation: '"Imeela" means "Thank you" in Igbo.' },
  { id: 'jamb-igb-3', category: 'jamb', subject: 'Igbo', difficulty: 'Easy', prompt: 'The New Yam Festival is celebrated by which ethnic group?', answers: ['Yoruba', 'Hausa', 'Igbo', 'Tiv'], correctIndex: 2, explanation: 'The New Yam Festival (Iri Ji) is a major Igbo cultural festival.' },
  { id: 'jamb-igb-4', category: 'jamb', subject: 'Igbo', difficulty: 'Hard', prompt: 'Who is the central character in Chinua Achebe\'s "Things Fall Apart"?', answers: ['Ikemefuna', 'Obierika', 'Okonkwo', 'Nwoye'], correctIndex: 2, explanation: 'Okonkwo is the protagonist of "Things Fall Apart", an Igbo wrestling champion.' },
  // ─── JAMB: Insurance ──────────────────────────────────────
  { id: 'jamb-ins-1', category: 'jamb', subject: 'Insurance', difficulty: 'Easy', prompt: 'What is the main purpose of insurance?', answers: ['To make profit', 'To transfer risk', 'To save money', 'To invest'], correctIndex: 1, explanation: 'Insurance is primarily a risk transfer mechanism.' },
  { id: 'jamb-ins-2', category: 'jamb', subject: 'Insurance', difficulty: 'Medium', prompt: 'What is a premium in insurance?', answers: ['The claim amount', 'The amount paid for coverage', 'The policy document', 'The insured item'], correctIndex: 1, explanation: 'A premium is the amount paid by the insured to the insurer for coverage.' },
  { id: 'jamb-ins-3', category: 'jamb', subject: 'Insurance', difficulty: 'Hard', prompt: 'What is "underwriting" in insurance?', answers: ['Writing policies', 'Evaluating and accepting risks', 'Paying claims', 'Cancelling policies'], correctIndex: 1, explanation: 'Underwriting is the process of evaluating and accepting or rejecting insurance risks.' },
  { id: 'jamb-ins-4', category: 'jamb', subject: 'Insurance', difficulty: 'Medium', prompt: 'Which principle of insurance requires full disclosure of facts?', answers: ['Indemnity', 'Utmost good faith', 'Subrogation', 'Contribution'], correctIndex: 1, explanation: 'The principle of utmost good faith (uberrimae fidei) requires full disclosure of all material facts.' },
  // ─── JAMB: Home Economics ─────────────────────────────────
  { id: 'jamb-hec-1', category: 'jamb', subject: 'Home Economics', difficulty: 'Easy', prompt: 'Which nutrient provides the most energy?', answers: ['Vitamins', 'Fats', 'Minerals', 'Water'], correctIndex: 1, explanation: 'Fats provide the most energy per gram (9 calories per gram).' },
  { id: 'jamb-hec-2', category: 'jamb', subject: 'Home Economics', difficulty: 'Medium', prompt: 'What is the best way to preserve fresh fish?', answers: ['Boiling', 'Freezing', 'Frying', 'Roasting'], correctIndex: 1, explanation: 'Freezing is an effective method for preserving fresh fish.' },
  { id: 'jamb-hec-3', category: 'jamb', subject: 'Home Economics', difficulty: 'Easy', prompt: 'Which vitamin is found in citrus fruits?', answers: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'], correctIndex: 2, explanation: 'Citrus fruits like oranges and lemons are rich in Vitamin C.' },
  { id: 'jamb-hec-4', category: 'jamb', subject: 'Home Economics', difficulty: 'Hard', prompt: 'What is the recommended daily water intake for an adult?', answers: ['1 liter', '2 liters', '4 liters', '5 liters'], correctIndex: 1, explanation: 'The recommended daily water intake for adults is about 2 liters (8 glasses).' },
  // ─── JAMB: Music ──────────────────────────────────────────
  { id: 'jamb-mus-1', category: 'jamb', subject: 'Music', difficulty: 'Easy', prompt: 'How many notes are in a standard musical scale?', answers: ['5', '7', '8', '12'], correctIndex: 1, explanation: 'A standard diatonic scale has 7 notes (do, re, mi, fa, so, la, ti).' },
  { id: 'jamb-mus-2', category: 'jamb', subject: 'Music', difficulty: 'Medium', prompt: 'Which instrument is a percussion instrument?', answers: ['Violin', 'Flute', 'Drum', 'Trumpet'], correctIndex: 2, explanation: 'Drums are percussion instruments that produce sound by being struck.' },
  { id: 'jamb-mus-3', category: 'jamb', subject: 'Music', difficulty: 'Hard', prompt: 'What does "forte" mean in music?', answers: ['Soft', 'Loud', 'Fast', 'Slow'], correctIndex: 1, explanation: '"Forte" is an Italian musical term meaning "loud".' },
  { id: 'jamb-mus-4', category: 'jamb', subject: 'Music', difficulty: 'Medium', prompt: 'Who is known as the "King of Afrobeat"?', answers: ['Fela Kuti', 'King Sunny Ade', 'Wizkid', 'Burna Boy'], correctIndex: 0, explanation: 'Fela Kuti is the pioneer and king of Afrobeat music.' },
  // ─── JAMB: Physical & Health Education ────────────────────
  { id: 'jamb-phe-1', category: 'jamb', subject: 'Physical & Health Education', difficulty: 'Easy', prompt: 'How many players are on a basketball team?', answers: ['5', '7', '9', '11'], correctIndex: 0, explanation: 'A standard basketball team has 5 players on the court.' },
  { id: 'jamb-phe-2', category: 'jamb', subject: 'Physical & Health Education', difficulty: 'Medium', prompt: 'What is the first step in treating a minor cut?', answers: ['Apply bandage', 'Clean the wound', 'Apply ointment', 'Visit a doctor'], correctIndex: 1, explanation: 'The first step is to clean the wound with clean water and antiseptic.' },
  { id: 'jamb-phe-3', category: 'jamb', subject: 'Physical & Health Education', difficulty: 'Easy', prompt: 'Which of these is a communicable disease?', answers: ['Diabetes', 'Malaria', 'Hypertension', 'Asthma'], correctIndex: 1, explanation: 'Malaria is a communicable disease transmitted by mosquitoes.' },
  { id: 'jamb-phe-4', category: 'jamb', subject: 'Physical & Health Education', difficulty: 'Hard', prompt: 'What is the function of the warm-up before exercise?', answers: ['To cool down', 'To prepare muscles for activity', 'To build strength', 'To lose weight'], correctIndex: 1, explanation: 'Warm-up prepares the muscles and cardiovascular system for physical activity.' },
  // ─── JAMB: Additional English Questions ───────────────────
  { id: 'jamb-eng-13', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Choose the correct option: "Neither the teacher nor the students _____ present."', answers: ['was', 'were', 'is', 'has been'], correctIndex: 1, explanation: 'When "neither...nor" connects a singular and plural subject, the verb agrees with the nearest subject (students - plural).' },
  { id: 'jamb-eng-14', category: 'jamb', subject: 'English', difficulty: 'Hard', prompt: 'Identify the literary term: "A figure of speech in which what is said is the opposite of what is meant."', answers: ['Metaphor', 'Irony', 'Simile', 'Alliteration'], correctIndex: 1, explanation: 'Irony is a figure of speech where the intended meaning is opposite to the literal meaning.' },
  { id: 'jamb-eng-15', category: 'jamb', subject: 'English', difficulty: 'Easy', prompt: 'What is a synonym for "begin"?', answers: ['End', 'Start', 'Stop', 'Finish'], correctIndex: 1, explanation: '"Start" is a synonym for "begin".' },
  { id: 'jamb-eng-16', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Choose the correct spelling:', answers: ['Privilege', 'Priviledge', 'Privelege', 'Privilige'], correctIndex: 0, explanation: '"Privilege" is the correct spelling.' },
  { id: 'jamb-eng-17', category: 'jamb', subject: 'English', difficulty: 'Hard', prompt: 'What is the meaning of the idiom "burn the midnight oil"?', answers: ['To waste energy', 'To study or work late into the night', 'To start a fire', 'To get angry'], correctIndex: 1, explanation: '"Burn the midnight oil" means to work or study late at night.' },
  { id: 'jamb-eng-18', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Which sentence is grammatically correct?', answers: ['Each of the students have a book.', 'Each of the students has a book.', 'Each of the students are having a book.', 'Each of the students were having a book.'], correctIndex: 1, explanation: '"Each" is singular, so it takes the singular verb "has".' },
  // ─── JAMB: Additional Mathematics Questions ───────────────
  { id: 'jamb-maths-11', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'What is the value of 2³ × 2²?', answers: ['16', '32', '64', '128'], correctIndex: 1, explanation: '2³ × 2² = 8 × 4 = 32, or using laws of indices: 2⁵ = 32.' },
  { id: 'jamb-maths-12', category: 'jamb', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the probability of rolling a sum of 7 with two dice?', answers: ['1/6', '1/12', '1/36', '1/18'], correctIndex: 0, explanation: 'There are 6 ways to get sum 7 out of 36 total outcomes: 6/36 = 1/6.' },
  { id: 'jamb-maths-13', category: 'jamb', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is 3/4 as a decimal?', answers: ['0.25', '0.5', '0.75', '0.8'], correctIndex: 2, explanation: '3/4 = 0.75.' },
  { id: 'jamb-maths-14', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'If a car travels 120 km in 2 hours, what is its average speed?', answers: ['40 km/h', '60 km/h', '80 km/h', '100 km/h'], correctIndex: 1, explanation: 'Speed = Distance/Time = 120/2 = 60 km/h.' },
  { id: 'jamb-maths-15', category: 'jamb', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the value of 5! (5 factorial)?', answers: ['60', '120', '240', '360'], correctIndex: 1, explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120.' },
  { id: 'jamb-maths-16', category: 'jamb', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is the LCM of 6 and 8?', answers: ['12', '16', '24', '48'], correctIndex: 2, explanation: 'The least common multiple of 6 and 8 is 24.' },
  // ─── JAMB: Additional Physics Questions ───────────────────
  { id: 'jamb-phys-9', category: 'jamb', subject: 'Physics', difficulty: 'Medium', prompt: 'What is the unit of frequency?', answers: ['Second', 'Hertz', 'Meter', 'Joule'], correctIndex: 1, explanation: 'Frequency is measured in hertz (Hz), which is cycles per second.' },
  { id: 'jamb-phys-10', category: 'jamb', subject: 'Physics', difficulty: 'Easy', prompt: 'Which of these is a good conductor of heat?', answers: ['Wood', 'Plastic', 'Copper', 'Rubber'], correctIndex: 2, explanation: 'Copper is an excellent conductor of heat and electricity.' },
  { id: 'jamb-phys-11', category: 'jamb', subject: 'Physics', difficulty: 'Hard', prompt: 'What is the refractive index of a medium?', answers: ['Speed of light in vacuum / Speed of light in medium', 'Speed of light in medium / Speed of light in vacuum', 'Wavelength × Frequency', '1 / Focal length'], correctIndex: 0, explanation: 'Refractive index n = c/v, where c is speed in vacuum and v is speed in the medium.' },
  { id: 'jamb-phys-12', category: 'jamb', subject: 'Physics', difficulty: 'Medium', prompt: 'What is the principle of a lever?', answers: ['Energy is created', 'Force × Distance is constant', 'Mass is conserved', 'Momentum is conserved'], correctIndex: 1, explanation: 'The lever principle states that the effort force times its distance equals the load force times its distance.' },
  // ─── JAMB: Additional Chemistry Questions ─────────────────
  { id: 'jamb-chem-9', category: 'jamb', subject: 'Chemistry', difficulty: 'Medium', prompt: 'What is the chemical symbol for sodium?', answers: ['So', 'Sd', 'Na', 'Sm'], correctIndex: 2, explanation: 'Sodium\'s symbol is Na, from the Latin "natrium".' },
  { id: 'jamb-chem-10', category: 'jamb', subject: 'Chemistry', difficulty: 'Hard', prompt: 'What is the molar mass of water (H₂O)?', answers: ['16 g/mol', '17 g/mol', '18 g/mol', '20 g/mol'], correctIndex: 2, explanation: 'H₂O: 2(1) + 16 = 18 g/mol.' },
  { id: 'jamb-chem-11', category: 'jamb', subject: 'Chemistry', difficulty: 'Easy', prompt: 'Which gas is most abundant in the Earth\'s atmosphere?', answers: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], correctIndex: 2, explanation: 'Nitrogen makes up about 78% of the Earth\'s atmosphere.' },
  { id: 'jamb-chem-12', category: 'jamb', subject: 'Chemistry', difficulty: 'Medium', prompt: 'What is the process of converting a liquid to a gas called?', answers: ['Condensation', 'Evaporation', 'Sublimation', 'Freezing'], correctIndex: 1, explanation: 'Evaporation is the process where a liquid changes to a gas.' },
  // ─── JAMB: Additional Biology Questions ───────────────────
  { id: 'jamb-bio-9', category: 'jamb', subject: 'Biology', difficulty: 'Medium', prompt: 'What is the function of red blood cells?', answers: ['Fight infection', 'Carry oxygen', 'Clot blood', 'Produce antibodies'], correctIndex: 1, explanation: 'Red blood cells contain hemoglobin and transport oxygen throughout the body.' },
  { id: 'jamb-bio-10', category: 'jamb', subject: 'Biology', difficulty: 'Easy', prompt: 'Which system is responsible for breathing?', answers: ['Circulatory system', 'Respiratory system', 'Digestive system', 'Nervous system'], correctIndex: 1, explanation: 'The respiratory system is responsible for breathing and gas exchange.' },
  { id: 'jamb-bio-11', category: 'jamb', subject: 'Biology', difficulty: 'Hard', prompt: 'What is the scientific name for humans?', answers: ['Homo erectus', 'Homo sapiens', 'Homo habilis', 'Homo neanderthalensis'], correctIndex: 1, explanation: 'The scientific name for modern humans is Homo sapiens.' },
  { id: 'jamb-bio-12', category: 'jamb', subject: 'Biology', difficulty: 'Medium', prompt: 'Which part of the plant absorbs water and minerals?', answers: ['Stem', 'Leaf', 'Root', 'Flower'], correctIndex: 2, explanation: 'Roots absorb water and minerals from the soil.' },
  // ─── JAMB: Additional Government Questions ────────────────
  { id: 'jamb-gov-5', category: 'jamb', subject: 'Government', difficulty: 'Medium', prompt: 'What is a constitution?', answers: ['A type of law', 'The fundamental laws governing a country', 'A court judgment', 'An international treaty'], correctIndex: 1, explanation: 'A constitution is the set of fundamental principles according to which a state is governed.' },
  { id: 'jamb-gov-6', category: 'jamb', subject: 'Government', difficulty: 'Easy', prompt: 'What is democracy?', answers: ['Rule by one person', 'Rule by the people', 'Rule by the rich', 'Rule by the military'], correctIndex: 1, explanation: 'Democracy is a system of government where the people exercise power directly or through elected representatives.' },
  { id: 'jamb-gov-7', category: 'jamb', subject: 'Government', difficulty: 'Hard', prompt: 'What is the function of the judiciary?', answers: ['Make laws', 'Execute laws', 'Interpret laws', 'Campaign for elections'], correctIndex: 2, explanation: 'The judiciary interprets and applies the law in legal cases.' },
  { id: 'jamb-gov-8', category: 'jamb', subject: 'Government', difficulty: 'Medium', prompt: 'Nigeria operates which system of government?', answers: ['Unitary', 'Federal', 'Confederal', 'Parliamentary'], correctIndex: 1, explanation: 'Nigeria operates a federal system of government with three tiers: Federal, State, and Local.' },
  // ─── JAMB: Additional Economics Questions ─────────────────
  { id: 'jamb-econ-5', category: 'jamb', subject: 'Economics', difficulty: 'Medium', prompt: 'What is inflation?', answers: ['A decrease in prices', 'A general increase in prices', 'An increase in employment', 'A decrease in production'], correctIndex: 1, explanation: 'Inflation is the sustained increase in the general price level of goods and services.' },
  { id: 'jamb-econ-6', category: 'jamb', subject: 'Economics', difficulty: 'Easy', prompt: 'What is a market?', answers: ['A physical building only', 'Any place where buyers and sellers interact', 'A government office', 'A bank'], correctIndex: 1, explanation: 'A market is any arrangement where buyers and sellers interact to exchange goods and services.' },
  { id: 'jamb-econ-7', category: 'jamb', subject: 'Economics', difficulty: 'Hard', prompt: 'What is opportunity cost?', answers: ['The cost of production', 'The next best alternative forgone', 'The total cost of a good', 'The price of a good'], correctIndex: 1, explanation: 'Opportunity cost is the value of the next best alternative that is given up when making a choice.' },
  { id: 'jamb-econ-8', category: 'jamb', subject: 'Economics', difficulty: 'Medium', prompt: 'What is a monopoly?', answers: ['A market with many sellers', 'A market with a single seller', 'A market with no sellers', 'A market with government control'], correctIndex: 1, explanation: 'A monopoly is a market structure where there is only one seller of a product with no close substitutes.' },
  // ─── JAMB: Additional Literature Questions ────────────────
  { id: 'jamb-lit-5', category: 'jamb', subject: 'Literature', difficulty: 'Medium', prompt: 'Who wrote "Weep Not, Child"?', answers: ['Chinua Achebe', 'Ngũgĩ wa Thiong\'o', 'Wole Soyinka', 'Ferdinand Oyono'], correctIndex: 1, explanation: '"Weep Not, Child" was written by Kenyan author Ngũgĩ wa Thiong\'o.' },
  { id: 'jamb-lit-6', category: 'jamb', subject: 'Literature', difficulty: 'Easy', prompt: 'What is a poem?', answers: ['A type of novel', 'A piece of writing with rhythm and imagery', 'A historical document', 'A scientific paper'], correctIndex: 1, explanation: 'A poem is a piece of writing that uses rhythmic and imaginative language to express feelings or ideas.' },
  { id: 'jamb-lit-7', category: 'jamb', subject: 'Literature', difficulty: 'Hard', prompt: 'What is the climax of a story?', answers: ['The beginning', 'The turning point of highest tension', 'The ending', 'The introduction of characters'], correctIndex: 1, explanation: 'The climax is the point of highest dramatic tension in a narrative.' },
  { id: 'jamb-lit-8', category: 'jamb', subject: 'Literature', difficulty: 'Medium', prompt: 'Who wrote "The Lion and the Jewel"?', answers: ['Chinua Achebe', 'Wole Soyinka', 'Ola Rotimi', 'J.P. Clark'], correctIndex: 1, explanation: '"The Lion and the Jewel" is a play by Wole Soyinka.' },
  // ─── JAMB: Additional CRK Questions ───────────────────────
  { id: 'jamb-crk-5', category: 'jamb', subject: 'CRK', difficulty: 'Medium', prompt: 'Who led the Israelites out of Egypt?', answers: ['Abraham', 'Moses', 'Joshua', 'David'], correctIndex: 1, explanation: 'Moses led the Israelites out of slavery in Egypt.' },
  { id: 'jamb-crk-6', category: 'jamb', subject: 'CRK', difficulty: 'Easy', prompt: 'What is the first book of the Bible?', answers: ['Exodus', 'Genesis', 'Psalms', 'Proverbs'], correctIndex: 1, explanation: 'Genesis is the first book of the Bible.' },
  { id: 'jamb-crk-7', category: 'jamb', subject: 'CRK', difficulty: 'Hard', prompt: 'Who was the first king of Israel?', answers: ['David', 'Solomon', 'Saul', 'Samuel'], correctIndex: 2, explanation: 'Saul was the first king of Israel, anointed by the prophet Samuel.' },
  { id: 'jamb-crk-8', category: 'jamb', subject: 'CRK', difficulty: 'Medium', prompt: 'How many days did God take to create the world according to Genesis?', answers: ['5', '6', '7', '10'], correctIndex: 1, explanation: 'According to Genesis, God created the world in six days and rested on the seventh.' },
  // ─── JAMB: Additional Geography Questions ─────────────────
  { id: 'jamb-geo-5', category: 'jamb', subject: 'Geography', difficulty: 'Medium', prompt: 'What is the capital of Ghana?', answers: ['Kumasi', 'Accra', 'Tamale', 'Takoradi'], correctIndex: 1, explanation: 'Accra is the capital and largest city of Ghana.' },
  { id: 'jamb-geo-6', category: 'jamb', subject: 'Geography', difficulty: 'Easy', prompt: 'Which of these is a landlocked country in Africa?', answers: ['Nigeria', 'Chad', 'Ghana', 'Kenya'], correctIndex: 1, explanation: 'Chad is a landlocked country in Central Africa with no coastline.' },
  { id: 'jamb-geo-7', category: 'jamb', subject: 'Geography', difficulty: 'Hard', prompt: 'What is the highest mountain in Africa?', answers: ['Mount Kenya', 'Mount Kilimanjaro', 'Mount Stanley', 'Rwenzori Mountains'], correctIndex: 1, explanation: 'Mount Kilimanjaro in Tanzania is the highest mountain in Africa at 5,895 meters.' },
  { id: 'jamb-geo-8', category: 'jamb', subject: 'Geography', difficulty: 'Medium', prompt: 'Which river is the longest in Nigeria?', answers: ['Niger', 'Benue', 'Cross River', 'Osun'], correctIndex: 0, explanation: 'The River Niger is the longest river in Nigeria, flowing through several states.' },
  // ─── JAMB: Principles of Accounts ─────────────────────────
  { id: 'jamb-pa-1', category: 'jamb', subject: 'Principles of Accounts', difficulty: 'Easy', prompt: 'What is a journal in accounting?', answers: ['A financial statement', 'A book of original entry', 'A ledger account', 'A trial balance'], correctIndex: 1, explanation: 'A journal is the book of original entry where transactions are first recorded.' },
  { id: 'jamb-pa-2', category: 'jamb', subject: 'Principles of Accounts', difficulty: 'Medium', prompt: 'What does a trial balance check?', answers: ['Profitability', 'Arithmetic accuracy of ledger', 'Cash position', 'Asset valuation'], correctIndex: 1, explanation: 'A trial balance checks the arithmetic accuracy of the ledger by verifying that total debits equal total credits.' },
  { id: 'jamb-pa-3', category: 'jamb', subject: 'Principles of Accounts', difficulty: 'Hard', prompt: 'What is a suspense account used for?', answers: ['Recording profits', 'Temporary difference in trial balance', 'Fixed asset purchases', 'Salary payments'], correctIndex: 1, explanation: 'A suspense account temporarily holds differences in the trial balance until they are resolved.' },
  { id: 'jamb-pa-4', category: 'jamb', subject: 'Principles of Accounts', difficulty: 'Medium', prompt: 'What is double entry bookkeeping?', answers: ['Recording each transaction twice', 'Every debit has a corresponding credit', 'Two sets of books', 'Double checking entries'], correctIndex: 1, explanation: 'Double entry means every transaction has equal debit and credit entries.' },
  // ─── JAMB: Typewriting ────────────────────────────────────
  { id: 'jamb-type-1', category: 'jamb', subject: 'Typewriting', difficulty: 'Easy', prompt: 'What is the correct finger position for typing?', answers: ['Home row', 'Top row', 'Bottom row', 'Any position'], correctIndex: 0, explanation: 'The home row (ASDF for left hand, JKL; for right hand) is the correct starting position.' },
  { id: 'jamb-type-2', category: 'jamb', subject: 'Typewriting', difficulty: 'Medium', prompt: 'What is the standard typing speed measured in?', answers: ['WPM', 'CPM', 'KPH', 'SPM'], correctIndex: 0, explanation: 'Typing speed is measured in Words Per Minute (WPM).' },
  { id: 'jamb-type-3', category: 'jamb', subject: 'Typewriting', difficulty: 'Hard', prompt: 'What key is used to capitalize a letter?', answers: ['Caps Lock', 'Shift', 'Tab', 'Space bar'], correctIndex: 1, explanation: 'The Shift key is used to capitalize individual letters.' },
  { id: 'jamb-type-4', category: 'jamb', subject: 'Typewriting', difficulty: 'Medium', prompt: 'What finger is used to press the space bar?', answers: ['Index finger', 'Middle finger', 'Thumb', 'Little finger'], correctIndex: 2, explanation: 'The thumb is used to press the space bar in proper typing technique.' },
  // ─── JAMB: Food and Nutrition ─────────────────────────────
  { id: 'jamb-fn-1', category: 'jamb', subject: 'Food and Nutrition', difficulty: 'Easy', prompt: 'Which nutrient is the main source of energy for the body?', answers: ['Protein', 'Carbohydrate', 'Vitamin', 'Mineral'], correctIndex: 1, explanation: 'Carbohydrates are the body\'s main source of energy.' },
  { id: 'jamb-fn-2', category: 'jamb', subject: 'Food and Nutrition', difficulty: 'Medium', prompt: 'What is the best source of vitamin C?', answers: ['Milk', 'Bread', 'Orange', 'Fish'], correctIndex: 2, explanation: 'Oranges and other citrus fruits are excellent sources of vitamin C.' },
  { id: 'jamb-fn-3', category: 'jamb', subject: 'Food and Nutrition', difficulty: 'Hard', prompt: 'What are complete proteins?', answers: ['Proteins from plants', 'Proteins containing all essential amino acids', 'Proteins with no fat', 'Proteins in supplements'], correctIndex: 1, explanation: 'Complete proteins contain all nine essential amino acids that the body cannot produce.' },
  { id: 'jamb-fn-4', category: 'jamb', subject: 'Food and Nutrition', difficulty: 'Medium', prompt: 'What is the effect of overcooking vegetables?', answers: ['Increases nutrients', 'Destroys vitamins', 'Improves taste', 'Preserves color'], correctIndex: 1, explanation: 'Overcooking vegetables can destroy heat-sensitive vitamins like vitamin C.' },
  // ─── JAMB: Clothing and Textiles ──────────────────────────
  { id: 'jamb-ct-1', category: 'jamb', subject: 'Clothing and Textiles', difficulty: 'Easy', prompt: 'Which fabric is made from cotton?', answers: ['Polyester', 'Nylon', 'Denim', 'Rayon'], correctIndex: 2, explanation: 'Denim is a sturdy cotton fabric used for making jeans and jackets.' },
  { id: 'jamb-ct-2', category: 'jamb', subject: 'Clothing and Textiles', difficulty: 'Medium', prompt: 'What is the purpose of a seam?', answers: ['To decorate fabric', 'To join two pieces of fabric', 'To cut fabric', 'To dye fabric'], correctIndex: 1, explanation: 'A seam joins two pieces of fabric together with stitching.' },
  { id: 'jamb-ct-3', category: 'jamb', subject: 'Clothing and Textiles', difficulty: 'Hard', prompt: 'What natural fiber comes from sheep?', answers: ['Silk', 'Cotton', 'Wool', 'Linen'], correctIndex: 2, explanation: 'Wool is a natural fiber obtained from sheep and other animals.' },
  { id: 'jamb-ct-4', category: 'jamb', subject: 'Clothing and Textiles', difficulty: 'Medium', prompt: 'What is a pattern used for in sewing?', answers: ['Ironing clothes', 'Cutting fabric accurately', 'Measuring fabric', 'Storing fabric'], correctIndex: 1, explanation: 'A pattern is a template used to cut fabric pieces accurately for garment construction.' },
  // ─── JAMB: French ─────────────────────────────────────────
  { id: 'jamb-french-1', category: 'jamb', subject: 'French', difficulty: 'Easy', prompt: 'What does "Bonjour" mean in English?', answers: ['Good evening', 'Hello/Good morning', 'Goodbye', 'Good night'], correctIndex: 1, explanation: '"Bonjour" is French for "Hello" or "Good morning/afternoon".' },
  { id: 'jamb-french-2', category: 'jamb', subject: 'French', difficulty: 'Medium', prompt: 'What is "Merci" in English?', answers: ['Please', 'Sorry', 'Thank you', 'You\'re welcome'], correctIndex: 2, explanation: '"Merci" means "Thank you" in French.' },
  { id: 'jamb-arab-1', category: 'jamb', subject: 'Arabic', difficulty: 'Easy', prompt: 'What does "Assalamu Alaykum" mean?', answers: ['Praise be to God', 'Peace be upon you', 'Thank you', 'Good morning'], correctIndex: 1, explanation: '"Assalamu Alaykum" is an Arabic greeting meaning "Peace be upon you".' },
  { id: 'jamb-arab-2', category: 'jamb', subject: 'Arabic', difficulty: 'Medium', prompt: 'What is "Alhamdulillah" in English?', answers: ['God is great', 'Praise be to God', 'In the name of God', 'God willing'], correctIndex: 1, explanation: '"Alhamdulillah" means "All praise is due to God" or "Praise be to God".' },
  // ─── JAMB: Animal Husbandry ───────────────────────────────
  { id: 'jamb-ah-1', category: 'jamb', subject: 'Animal Husbandry', difficulty: 'Easy', prompt: 'What is the young of a cow called?', answers: ['Lamb', 'Calf', 'Kid', 'Foal'], correctIndex: 1, explanation: 'A young cow is called a calf.' },
  { id: 'jamb-ah-2', category: 'jamb', subject: 'Animal Husbandry', difficulty: 'Medium', prompt: 'What is the term for a female adult cattle that has given birth?', answers: ['Heifer', 'Cow', 'Bull', 'Steer'], correctIndex: 1, explanation: 'A cow is a mature female cattle that has given birth.' },
  { id: 'jamb-ah-3', category: 'jamb', subject: 'Animal Husbandry', difficulty: 'Hard', prompt: 'What disease is caused by trypanosomes in cattle?', answers: ['Foot and mouth', 'Trypanosomiasis', 'Rinderpest', 'Anthrax'], correctIndex: 1, explanation: 'Trypanosomiasis (sleeping sickness) is caused by trypanosome parasites transmitted by tsetse flies.' },
  { id: 'jamb-ah-4', category: 'jamb', subject: 'Animal Husbandry', difficulty: 'Medium', prompt: 'What is the process of giving birth in cattle called?', answers: ['Lambing', 'Kidding', 'Calving', 'Foaling'], correctIndex: 2, explanation: 'Calving is the process of giving birth in cattle.' },
  // ─── JAMB: Forestry ───────────────────────────────────────
  { id: 'jamb-for-1', category: 'jamb', subject: 'Forestry', difficulty: 'Easy', prompt: 'What is the main product from forests?', answers: ['Fruits', 'Timber', 'Vegetables', 'Grains'], correctIndex: 1, explanation: 'Timber (wood) is the main product obtained from forests.' },
  { id: 'jamb-for-2', category: 'jamb', subject: 'Forestry', difficulty: 'Medium', prompt: 'What is afforestation?', answers: ['Cutting down trees', 'Planting trees in a new area', 'Burning forests', 'Selling timber'], correctIndex: 1, explanation: 'Afforestation is the process of planting trees in an area that was not previously forested.' },
  { id: 'jamb-for-3', category: 'jamb', subject: 'Forestry', difficulty: 'Hard', prompt: 'What is deforestation?', answers: ['Planting trees', 'Clearing of forests permanently', 'Protecting forests', 'Studying forests'], correctIndex: 1, explanation: 'Deforestation is the permanent removal of forest cover for other land uses.' },
  { id: 'jamb-for-4', category: 'jamb', subject: 'Forestry', difficulty: 'Medium', prompt: 'Which of these is a forest tree species in Nigeria?', answers: ['Maize', 'Iroko', 'Rice', 'Cassava'], correctIndex: 1, explanation: 'Iroko is a valuable timber tree species found in Nigerian forests.' },
  // ─── JAMB: More English Questions ─────────────────────────
  { id: 'jamb-eng-19', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Choose the correct option: "The committee _____ divided on the issue."', answers: ['is', 'are', 'was', 'were'], correctIndex: 1, explanation: 'Collective nouns like "committee" take a plural verb when members are acting individually.' },
  { id: 'jamb-eng-20', category: 'jamb', subject: 'English', difficulty: 'Hard', prompt: 'What is the meaning of the idiom "let the cat out of the bag"?', answers: ['To adopt a pet', 'To reveal a secret', 'To make a mistake', 'To escape danger'], correctIndex: 1, explanation: '"Let the cat out of the bag" means to reveal a secret unintentionally.' },
  { id: 'jamb-eng-21', category: 'jamb', subject: 'English', difficulty: 'Easy', prompt: 'What is the opposite of "ancient"?', answers: ['Old', 'Modern', 'Historic', 'Aged'], correctIndex: 1, explanation: '"Modern" is the opposite of "ancient".' },
  { id: 'jamb-eng-22', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Choose the correct spelling:', answers: ['Miscellaneous', 'Miscelaneous', 'Miscellanous', 'Miscellaneus'], correctIndex: 0, explanation: '"Miscellaneous" is the correct spelling.' },
  { id: 'jamb-eng-23', category: 'jamb', subject: 'English', difficulty: 'Hard', prompt: 'Identify the figure of speech: "The thunder roared loudly."', answers: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'], correctIndex: 2, explanation: 'Personification gives human qualities (roared) to non-human things (thunder).' },
  { id: 'jamb-eng-24', category: 'jamb', subject: 'English', difficulty: 'Easy', prompt: 'Which word is a verb?', answers: ['Happiness', 'Beautiful', 'Quickly', 'Run'], correctIndex: 3, explanation: '"Run" is a verb (action word).' },
  { id: 'jamb-eng-25', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Choose the correct sentence:', answers: ['He go to school every day.', 'He goes to school every day.', 'He going to school every day.', 'He gone to school every day.'], correctIndex: 1, explanation: '"He goes" is the correct present tense for third person singular.' },
  { id: 'jamb-eng-26', category: 'jamb', subject: 'English', difficulty: 'Hard', prompt: 'What is a synonym for "ubiquitous"?', answers: ['Rare', 'Everywhere', 'Hidden', 'Unique'], correctIndex: 1, explanation: '"Ubiquitous" means present, appearing, or found everywhere.' },
  { id: 'jamb-eng-27', category: 'jamb', subject: 'English', difficulty: 'Easy', prompt: 'What is the past tense of "eat"?', answers: ['Eated', 'Ate', 'Eaten', 'Eating'], correctIndex: 1, explanation: 'The simple past tense of "eat" is "ate".' },
  { id: 'jamb-eng-28', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Choose the correct preposition: "She is good _____ playing the piano."', answers: ['in', 'on', 'at', 'for'], correctIndex: 2, explanation: 'We say "good at" doing something.' },
  { id: 'jamb-eng-29', category: 'jamb', subject: 'English', difficulty: 'Hard', prompt: 'What is the meaning of the word "ephemeral"?', answers: ['Eternal', 'Short-lived', 'Powerful', 'Beautiful'], correctIndex: 1, explanation: '"Ephemeral" means lasting for a very short time.' },
  { id: 'jamb-eng-30', category: 'jamb', subject: 'English', difficulty: 'Medium', prompt: 'Identify the correct sentence:', answers: ['The team are playing well today.', 'The team is playing well today.', 'The team be playing well today.', 'The team am playing well today.'], correctIndex: 1, explanation: 'In British English, "team" can be singular or plural. In standard usage, "is" is correct.' },
  // ─── JAMB: More Mathematics Questions ─────────────────────
  { id: 'jamb-maths-17', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'What is the value of 7²?', answers: ['14', '49', '77', '28'], correctIndex: 1, explanation: '7² = 7 × 7 = 49.' },
  { id: 'jamb-maths-18', category: 'jamb', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is 1/2 + 1/4?', answers: ['1/6', '2/6', '3/4', '1/8'], correctIndex: 2, explanation: '1/2 = 2/4, so 2/4 + 1/4 = 3/4.' },
  { id: 'jamb-maths-19', category: 'jamb', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the value of √169?', answers: ['11', '12', '13', '14'], correctIndex: 2, explanation: '13 × 13 = 169, so √169 = 13.' },
  { id: 'jamb-maths-20', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'If y = 3x + 2, what is y when x = 4?', answers: ['10', '12', '14', '16'], correctIndex: 2, explanation: 'y = 3(4) + 2 = 12 + 2 = 14.' },
  { id: 'jamb-maths-21', category: 'jamb', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is the sum of the angles in a triangle?', answers: ['90°', '180°', '270°', '360°'], correctIndex: 1, explanation: 'The sum of interior angles in any triangle is 180°.' },
  { id: 'jamb-maths-22', category: 'jamb', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the value of 2⁶?', answers: ['32', '64', '128', '256'], correctIndex: 1, explanation: '2⁶ = 2 × 2 × 2 × 2 × 2 × 2 = 64.' },
  { id: 'jamb-maths-23', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'What is the area of a triangle with base 10cm and height 6cm?', answers: ['30 cm²', '60 cm²', '16 cm²', '40 cm²'], correctIndex: 0, explanation: 'Area = ½ × base × height = ½ × 10 × 6 = 30 cm².' },
  { id: 'jamb-maths-24', category: 'jamb', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is 10% of 500?', answers: ['10', '50', '100', '500'], correctIndex: 1, explanation: '10% of 500 = (10/100) × 500 = 50.' },
  { id: 'jamb-maths-25', category: 'jamb', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the value of cos(0°)?', answers: ['0', '0.5', '1', 'Undefined'], correctIndex: 2, explanation: 'cos(0°) = 1.' },
  { id: 'jamb-maths-26', category: 'jamb', subject: 'Mathematics', difficulty: 'Medium', prompt: 'Simplify: 3a + 2b - a + 3b', answers: ['2a + 5b', '4a + 5b', '2a - b', '4a - b'], correctIndex: 0, explanation: '3a - a = 2a, 2b + 3b = 5b, so 2a + 5b.' },
  { id: 'jamb-maths-27', category: 'jamb', subject: 'Mathematics', difficulty: 'Easy', prompt: 'What is the product of 7 and 9?', answers: ['56', '63', '72', '81'], correctIndex: 1, explanation: '7 × 9 = 63.' },
  { id: 'jamb-maths-28', category: 'jamb', subject: 'Mathematics', difficulty: 'Hard', prompt: 'What is the value of log₁₀(1000)?', answers: ['1', '2', '3', '4'], correctIndex: 2, explanation: '10³ = 1000, so log₁₀(1000) = 3.' },
  // ─── JAMB: More Physics Questions ─────────────────────────
  { id: 'jamb-phys-13', category: 'jamb', subject: 'Physics', difficulty: 'Easy', prompt: 'What is the SI unit of mass?', answers: ['Gram', 'Kilogram', 'Pound', 'Newton'], correctIndex: 1, explanation: 'The SI unit of mass is the kilogram (kg).' },
  { id: 'jamb-phys-14', category: 'jamb', subject: 'Physics', difficulty: 'Medium', prompt: 'What is the unit of electric current?', answers: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctIndex: 1, explanation: 'Electric current is measured in amperes (A).' },
  { id: 'jamb-phys-15', category: 'jamb', subject: 'Physics', difficulty: 'Hard', prompt: 'What is the relationship between voltage, current, and resistance?', answers: ['V = I/R', 'V = IR', 'V = I + R', 'V = I - R'], correctIndex: 1, explanation: 'Ohm\'s Law states V = IR (Voltage = Current × Resistance).' },
  { id: 'jamb-phys-16', category: 'jamb', subject: 'Physics', difficulty: 'Easy', prompt: 'Which of these is a vector quantity?', answers: ['Speed', 'Distance', 'Velocity', 'Temperature'], correctIndex: 2, explanation: 'Velocity has both magnitude and direction, making it a vector.' },
  { id: 'jamb-phys-17', category: 'jamb', subject: 'Physics', difficulty: 'Medium', prompt: 'What is the unit of power?', answers: ['Joule', 'Newton', 'Watt', 'Pascal'], correctIndex: 2, explanation: 'Power is measured in watts (W), which is joules per second.' },
  { id: 'jamb-phys-18', category: 'jamb', subject: 'Physics', difficulty: 'Hard', prompt: 'What is the speed of sound in air approximately?', answers: ['340 m/s', '500 m/s', '700 m/s', '1000 m/s'], correctIndex: 0, explanation: 'The speed of sound in air at room temperature is approximately 340 m/s.' },
  { id: 'jamb-phys-19', category: 'jamb', subject: 'Physics', difficulty: 'Easy', prompt: 'What is the SI unit of time?', answers: ['Minute', 'Hour', 'Second', 'Day'], correctIndex: 2, explanation: 'The SI unit of time is the second (s).' },
  { id: 'jamb-phys-20', category: 'jamb', subject: 'Physics', difficulty: 'Medium', prompt: 'What type of energy does a moving object have?', answers: ['Potential energy', 'Kinetic energy', 'Chemical energy', 'Nuclear energy'], correctIndex: 1, explanation: 'A moving object possesses kinetic energy.' },
  { id: 'jamb-phys-21', category: 'jamb', subject: 'Physics', difficulty: 'Hard', prompt: 'What is the wavelength of a wave with frequency 50 Hz and speed 340 m/s?', answers: ['3.4 m', '6.8 m', '17 m', '34 m'], correctIndex: 1, explanation: 'Wavelength = speed/frequency = 340/50 = 6.8 m.' },
  { id: 'jamb-phys-22', category: 'jamb', subject: 'Physics', difficulty: 'Easy', prompt: 'Which of these is a non-renewable energy source?', answers: ['Solar', 'Wind', 'Coal', 'Hydroelectric'], correctIndex: 2, explanation: 'Coal is a non-renewable fossil fuel.' },
  // ─── JAMB: More Chemistry Questions ───────────────────────
  { id: 'jamb-chem-13', category: 'jamb', subject: 'Chemistry', difficulty: 'Easy', prompt: 'What is the chemical symbol for potassium?', answers: ['Po', 'Pt', 'K', 'P'], correctIndex: 2, explanation: 'Potassium\'s symbol is K, from the Latin "kalium".' },
  { id: 'jamb-chem-14', category: 'jamb', subject: 'Chemistry', difficulty: 'Medium', prompt: 'What is the chemical symbol for silver?', answers: ['Si', 'Sv', 'Ag', 'Sl'], correctIndex: 2, explanation: 'Silver\'s symbol is Ag, from the Latin "argentum".' },
  { id: 'jamb-chem-15', category: 'jamb', subject: 'Chemistry', difficulty: 'Hard', prompt: 'What is the chemical formula for sulfuric acid?', answers: ['H₂SO₃', 'H₂SO₄', 'H₂S', 'SO₄'], correctIndex: 1, explanation: 'Sulfuric acid has the formula H₂SO₄.' },
  { id: 'jamb-chem-16', category: 'jamb', subject: 'Chemistry', difficulty: 'Easy', prompt: 'What is the chemical symbol for calcium?', answers: ['C', 'Ca', 'Cl', 'Cm'], correctIndex: 1, explanation: 'Calcium\'s chemical symbol is Ca.' },
  { id: 'jamb-chem-17', category: 'jamb', subject: 'Chemistry', difficulty: 'Medium', prompt: 'What is the process of a solid changing directly to a gas called?', answers: ['Melting', 'Evaporation', 'Sublimation', 'Condensation'], correctIndex: 2, explanation: 'Sublimation is the direct transition from solid to gas.' },
  { id: 'jamb-chem-18', category: 'jamb', subject: 'Chemistry', difficulty: 'Hard', prompt: 'What is the pH of a strong base?', answers: ['Close to 0', 'Close to 7', 'Close to 14', 'Exactly 7'], correctIndex: 2, explanation: 'Strong bases have pH values close to 14.' },
  { id: 'jamb-chem-19', category: 'jamb', subject: 'Chemistry', difficulty: 'Easy', prompt: 'Which element has the symbol "O"?', answers: ['Osmium', 'Oxygen', 'Oganesson', 'Oxygenium'], correctIndex: 1, explanation: 'O is the chemical symbol for Oxygen.' },
  { id: 'jamb-chem-20', category: 'jamb', subject: 'Chemistry', difficulty: 'Medium', prompt: 'What is the chemical formula for carbon dioxide?', answers: ['CO', 'CO₂', 'C₂O', 'C₂O₂'], correctIndex: 1, explanation: 'Carbon dioxide has the formula CO₂.' },
  { id: 'jamb-chem-21', category: 'jamb', subject: 'Chemistry', difficulty: 'Hard', prompt: 'What is the atomic number of oxygen?', answers: ['6', '8', '10', '16'], correctIndex: 1, explanation: 'Oxygen has atomic number 8.' },
  { id: 'jamb-chem-22', category: 'jamb', subject: 'Chemistry', difficulty: 'Easy', prompt: 'Which of these is an acid?', answers: ['NaOH', 'HCl', 'NaCl', 'KOH'], correctIndex: 1, explanation: 'HCl (hydrochloric acid) is an acid.' },
  // ─── JAMB: More Biology Questions ─────────────────────────
  { id: 'jamb-bio-13', category: 'jamb', subject: 'Biology', difficulty: 'Easy', prompt: 'What system controls the body\'s activities?', answers: ['Circulatory system', 'Nervous system', 'Digestive system', 'Skeletal system'], correctIndex: 1, explanation: 'The nervous system controls and coordinates body activities.' },
  { id: 'jamb-bio-14', category: 'jamb', subject: 'Biology', difficulty: 'Medium', prompt: 'What is the function of the small intestine?', answers: ['Absorb water', 'Digest and absorb nutrients', 'Store food', 'Produce bile'], correctIndex: 1, explanation: 'The small intestine is where most digestion and nutrient absorption occurs.' },
  { id: 'jamb-bio-15', category: 'jamb', subject: 'Biology', difficulty: 'Hard', prompt: 'What is the study of heredity called?', answers: ['Biology', 'Genetics', 'Ecology', 'Evolution'], correctIndex: 1, explanation: 'Genetics is the study of heredity and variation in living organisms.' },
  { id: 'jamb-bio-16', category: 'jamb', subject: 'Biology', difficulty: 'Easy', prompt: 'Which part of the cell contains genetic material?', answers: ['Cytoplasm', 'Nucleus', 'Cell membrane', 'Ribosome'], correctIndex: 1, explanation: 'The nucleus contains the cell\'s genetic material (DNA).' },
  { id: 'jamb-bio-17', category: 'jamb', subject: 'Biology', difficulty: 'Medium', prompt: 'What is the main function of the kidneys?', answers: ['Pump blood', 'Filter waste from blood', 'Digest food', 'Store energy'], correctIndex: 1, explanation: 'The kidneys filter waste products from the blood to produce urine.' },
  { id: 'jamb-bio-18', category: 'jamb', subject: 'Biology', difficulty: 'Hard', prompt: 'What is the process of cell division for growth and repair called?', answers: ['Meiosis', 'Mitosis', 'Fertilization', 'Mutation'], correctIndex: 1, explanation: 'Mitosis is cell division that produces two identical daughter cells for growth and repair.' },
  { id: 'jamb-bio-19', category: 'jamb', subject: 'Biology', difficulty: 'Easy', prompt: 'What is the green pigment in plants called?', answers: ['Chlorophyll', 'Carotene', 'Xanthophyll', 'Anthocyanin'], correctIndex: 0, explanation: 'Chlorophyll is the green pigment that captures light energy for photosynthesis.' },
  { id: 'jamb-bio-20', category: 'jamb', subject: 'Biology', difficulty: 'Medium', prompt: 'Which organ produces insulin?', answers: ['Liver', 'Pancreas', 'Stomach', 'Kidney'], correctIndex: 1, explanation: 'The pancreas produces insulin to regulate blood sugar levels.' },
  { id: 'jamb-bio-21', category: 'jamb', subject: 'Biology', difficulty: 'Hard', prompt: 'What is the term for animals that eat both plants and meat?', answers: ['Herbivores', 'Carnivores', 'Omnivores', 'Detritivores'], correctIndex: 2, explanation: 'Omnivores eat both plants and animals.' },
  { id: 'jamb-bio-22', category: 'jamb', subject: 'Biology', difficulty: 'Easy', prompt: 'How many chambers does a fish heart have?', answers: ['1', '2', '3', '4'], correctIndex: 1, explanation: 'A fish heart has two chambers: one atrium and one ventricle.' },
  // ─── JAMB: More Government Questions ──────────────────────
  { id: 'jamb-gov-9', category: 'jamb', subject: 'Government', difficulty: 'Medium', prompt: 'What is the separation of powers?', answers: ['Combining all powers', 'Dividing government into three branches', 'Giving power to the military', 'Abolishing government'], correctIndex: 1, explanation: 'Separation of powers divides government into executive, legislative, and judicial branches.' },
  { id: 'jamb-gov-10', category: 'jamb', subject: 'Government', difficulty: 'Easy', prompt: 'Who is the current President of Nigeria?', answers: ['Muhammadu Buhari', 'Bola Tinubu', 'Goodluck Jonathan', 'Olusegun Obasanjo'], correctIndex: 1, explanation: 'Bola Tinubu is the current President of Nigeria.' },
  { id: 'jamb-gov-11', category: 'jamb', subject: 'Government', difficulty: 'Hard', prompt: 'What is a bicameral legislature?', answers: ['One house legislature', 'Two house legislature', 'Three house legislature', 'No legislature'], correctIndex: 1, explanation: 'A bicameral legislature has two chambers, like Nigeria\'s Senate and House of Representatives.' },
  { id: 'jamb-gov-12', category: 'jamb', subject: 'Government', difficulty: 'Medium', prompt: 'What is the function of the executive branch?', answers: ['Make laws', 'Implement laws', 'Interpret laws', 'Review laws'], correctIndex: 1, explanation: 'The executive branch implements and enforces laws.' },
  { id: 'jamb-gov-13', category: 'jamb', subject: 'Government', difficulty: 'Easy', prompt: 'What is a political party?', answers: ['A social club', 'An organization that seeks political power', 'A religious group', 'A business'], correctIndex: 1, explanation: 'A political party is an organized group that seeks to gain political power.' },
  { id: 'jamb-gov-14', category: 'jamb', subject: 'Government', difficulty: 'Hard', prompt: 'What is the rule of law?', answers: ['Rule by one person', 'No one is above the law', 'Rule by the military', 'Rule by the rich'], correctIndex: 1, explanation: 'The rule of law means that all citizens and institutions are accountable to the same laws.' },
  // ─── JAMB: More Economics Questions ───────────────────────
  { id: 'jamb-econ-9', category: 'jamb', subject: 'Economics', difficulty: 'Medium', prompt: 'What is the central bank of Nigeria?', answers: ['First Bank', 'CBN', 'Access Bank', 'UBA'], correctIndex: 1, explanation: 'The Central Bank of Nigeria (CBN) is the country\'s central bank.' },
  { id: 'jamb-econ-10', category: 'jamb', subject: 'Economics', difficulty: 'Easy', prompt: 'What is a budget?', answers: ['A bank statement', 'A financial plan for a period', 'A tax form', 'A loan application'], correctIndex: 1, explanation: 'A budget is a financial plan that estimates income and expenditure for a period.' },
  { id: 'jamb-econ-11', category: 'jamb', subject: 'Economics', difficulty: 'Hard', prompt: 'What is the difference between microeconomics and macroeconomics?', answers: ['No difference', 'Micro studies individuals, macro studies the economy as a whole', 'Micro studies government, macro studies businesses', 'Micro is theory, macro is practice'], correctIndex: 1, explanation: 'Microeconomics studies individual economic units, while macroeconomics studies the entire economy.' },
  { id: 'jamb-econ-12', category: 'jamb', subject: 'Economics', difficulty: 'Medium', prompt: 'What is a tariff?', answers: ['A subsidy', 'A tax on imports', 'A type of loan', 'A wage increase'], correctIndex: 1, explanation: 'A tariff is a tax imposed on imported goods.' },
  { id: 'jamb-econ-13', category: 'jamb', subject: 'Economics', difficulty: 'Easy', prompt: 'What is supply?', answers: ['The amount consumers want', 'The amount producers offer for sale', 'The price of goods', 'The cost of production'], correctIndex: 1, explanation: 'Supply is the quantity of a good that producers are willing to sell at a given price.' },
  { id: 'jamb-econ-14', category: 'jamb', subject: 'Economics', difficulty: 'Hard', prompt: 'What is the Phillips curve?', answers: ['Shows relationship between inflation and unemployment', 'Shows demand and supply', 'Shows tax rates', 'Shows population growth'], correctIndex: 0, explanation: 'The Phillips curve shows an inverse relationship between inflation and unemployment.' },
  // ─── JAMB: More Literature Questions ──────────────────────
  { id: 'jamb-lit-9', category: 'jamb', subject: 'Literature', difficulty: 'Medium', prompt: 'Who wrote "The Great Gatsby"?', answers: ['Ernest Hemingway', 'F. Scott Fitzgerald', 'Mark Twain', 'William Faulkner'], correctIndex: 1, explanation: 'F. Scott Fitzgerald wrote "The Great Gatsby".' },
  { id: 'jamb-lit-10', category: 'jamb', subject: 'Literature', difficulty: 'Easy', prompt: 'What is a novel?', answers: ['A short poem', 'A long fictional narrative', 'A historical document', 'A scientific paper'], correctIndex: 1, explanation: 'A novel is a long fictional narrative prose work.' },
  { id: 'jamb-lit-11', category: 'jamb', subject: 'Literature', difficulty: 'Hard', prompt: 'What is the theme of a literary work?', answers: ['The title', 'The central idea or message', 'The number of pages', 'The author\'s name'], correctIndex: 1, explanation: 'The theme is the central idea, message, or underlying meaning of a literary work.' },
  { id: 'jamb-lit-12', category: 'jamb', subject: 'Literature', difficulty: 'Medium', prompt: 'Who wrote "Half of a Yellow Sun"?', answers: ['Chinua Achebe', 'Chimamanda Ngozi Adichie', 'Wole Soyinka', 'Ben Okri'], correctIndex: 1, explanation: 'Chimamanda Ngozi Adichie wrote "Half of a Yellow Sun".' },
  { id: 'jamb-lit-13', category: 'jamb', subject: 'Literature', difficulty: 'Easy', prompt: 'What is a drama?', answers: ['A type of poem', 'A story written for performance', 'A novel', 'A biography'], correctIndex: 1, explanation: 'Drama is a literary work written to be performed by actors on stage.' },
  { id: 'jamb-lit-14', category: 'jamb', subject: 'Literature', difficulty: 'Hard', prompt: 'What is the difference between a tragedy and a comedy?', answers: ['No difference', 'Tragedy has a sad ending, comedy has a happy one', 'Tragedy is short, comedy is long', 'Tragedy is ancient, comedy is modern'], correctIndex: 1, explanation: 'Tragedy typically ends in disaster for the protagonist, while comedy ends happily.' },
  // ─── JAMB: More CRK Questions ─────────────────────────────
  { id: 'jamb-crk-9', category: 'jamb', subject: 'CRK', difficulty: 'Medium', prompt: 'Who was the mother of Jesus?', answers: ['Martha', 'Mary', 'Magdalene', 'Elizabeth'], correctIndex: 1, explanation: 'Mary was the mother of Jesus according to the Bible.' },
  { id: 'jamb-crk-10', category: 'jamb', subject: 'CRK', difficulty: 'Easy', prompt: 'What is the last book of the Bible?', answers: ['Acts', 'Revelation', 'Psalms', 'Proverbs'], correctIndex: 1, explanation: 'Revelation is the last book of the Bible.' },
  { id: 'jamb-crk-11', category: 'jamb', subject: 'CRK', difficulty: 'Hard', prompt: 'Who wrote most of the Psalms?', answers: ['Solomon', 'Moses', 'David', 'Abraham'], correctIndex: 2, explanation: 'King David is traditionally credited with writing many of the Psalms.' },
  { id: 'jamb-crk-12', category: 'jamb', subject: 'CRK', difficulty: 'Medium', prompt: 'What is the Golden Rule?', answers: ['Do unto others as they do unto you', 'Treat others as you want to be treated', 'Love only your friends', 'Help the poor'], correctIndex: 1, explanation: 'The Golden Rule is "Do unto others as you would have them do unto you."' },
  { id: 'jamb-crk-13', category: 'jamb', subject: 'CRK', difficulty: 'Easy', prompt: 'Who betrayed Jesus?', answers: ['Peter', 'John', 'Judas', 'Thomas'], correctIndex: 2, explanation: 'Judas Iscariot betrayed Jesus for thirty pieces of silver.' },
  { id: 'jamb-crk-14', category: 'jamb', subject: 'CRK', difficulty: 'Hard', prompt: 'What is the Pentateuch?', answers: ['The first five books of the Bible', 'The Psalms', 'The Gospels', 'The Epistles'], correctIndex: 0, explanation: 'The Pentateuch refers to the first five books of the Bible: Genesis, Exodus, Leviticus, Numbers, Deuteronomy.' },
  // ─── JAMB: More Geography Questions ───────────────────────
  { id: 'jamb-geo-9', category: 'jamb', subject: 'Geography', difficulty: 'Medium', prompt: 'What is the capital of France?', answers: ['London', 'Berlin', 'Paris', 'Madrid'], correctIndex: 2, explanation: 'Paris is the capital of France.' },
  { id: 'jamb-geo-10', category: 'jamb', subject: 'Geography', difficulty: 'Easy', prompt: 'Which country has the largest population in Africa?', answers: ['South Africa', 'Nigeria', 'Ethiopia', 'Egypt'], correctIndex: 1, explanation: 'Nigeria has the largest population in Africa.' },
  { id: 'jamb-geo-11', category: 'jamb', subject: 'Geography', difficulty: 'Hard', prompt: 'What is the capital of Australia?', answers: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctIndex: 2, explanation: 'Canberra is the capital of Australia.' },
  { id: 'jamb-geo-12', category: 'jamb', subject: 'Geography', difficulty: 'Medium', prompt: 'Which of these is a major river in Nigeria?', answers: ['Nile', 'Niger', 'Congo', 'Zambezi'], correctIndex: 1, explanation: 'The River Niger is one of the major rivers in Nigeria.' },
  { id: 'jamb-geo-13', category: 'jamb', subject: 'Geography', difficulty: 'Easy', prompt: 'What is the capital of the United Kingdom?', answers: ['Paris', 'Berlin', 'London', 'Rome'], correctIndex: 2, explanation: 'London is the capital of the United Kingdom.' },
  { id: 'jamb-geo-14', category: 'jamb', subject: 'Geography', difficulty: 'Hard', prompt: 'What is the deepest ocean in the world?', answers: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correctIndex: 2, explanation: 'The Pacific Ocean is the deepest ocean, containing the Mariana Trench.' },
  // ─── JAMB: More Commerce Questions ────────────────────────
  { id: 'jamb-com-7', category: 'jamb', subject: 'Commerce', difficulty: 'Medium', prompt: 'What is a cooperative society?', answers: ['A government agency', 'A business owned by members', 'A private company', 'A multinational corporation'], correctIndex: 1, explanation: 'A cooperative society is a business organization owned and operated by its members.' },
  { id: 'jamb-com-8', category: 'jamb', subject: 'Commerce', difficulty: 'Easy', prompt: 'What is the function of a retailer?', answers: ['Manufacture goods', 'Sell goods to final consumers', 'Transport goods', 'Store goods'], correctIndex: 1, explanation: 'Retailers sell goods directly to final consumers.' },
  { id: 'jamb-com-9', category: 'jamb', subject: 'Commerce', difficulty: 'Hard', prompt: 'What is a prospectus in business?', answers: ['A type of contract', 'A document inviting investment', 'A bank statement', 'An insurance policy'], correctIndex: 1, explanation: 'A prospectus is a legal document that invites the public to invest in a company.' },
  { id: 'jamb-com-10', category: 'jamb', subject: 'Commerce', difficulty: 'Medium', prompt: 'What is the role of the stock exchange?', answers: ['Lend money', 'Facilitate buying and selling of securities', 'Print currency', 'Collect taxes'], correctIndex: 1, explanation: 'A stock exchange provides a marketplace for buying and selling securities like stocks and bonds.' },
  // ─── JAMB: More Accounting Questions ──────────────────────
  { id: 'jamb-acc-7', category: 'jamb', subject: 'Accounting', difficulty: 'Medium', prompt: 'What is a balance sheet?', answers: ['A record of income', 'A statement of financial position', 'A cash flow record', 'A sales report'], correctIndex: 1, explanation: 'A balance sheet shows a company\'s assets, liabilities, and equity at a specific point in time.' },
  { id: 'jamb-acc-8', category: 'jamb', subject: 'Accounting', difficulty: 'Easy', prompt: 'What is revenue?', answers: ['Money spent', 'Money earned from sales', 'Money borrowed', 'Money saved'], correctIndex: 1, explanation: 'Revenue is the income generated from normal business operations, usually from sales.' },
  { id: 'jamb-acc-9', category: 'jamb', subject: 'Accounting', difficulty: 'Hard', prompt: 'What is the accrual concept in accounting?', answers: ['Record when cash is received', 'Record when transaction occurs regardless of cash', 'Record only at year end', 'Record only losses'], correctIndex: 1, explanation: 'The accrual concept records transactions when they occur, not when cash is exchanged.' },
  { id: 'jamb-acc-10', category: 'jamb', subject: 'Accounting', difficulty: 'Medium', prompt: 'What is working capital?', answers: ['Total assets', 'Current assets minus current liabilities', 'Total revenue', 'Net profit'], correctIndex: 1, explanation: 'Working capital = Current Assets - Current Liabilities.' },
  // ─── JAMB: More Agricultural Science Questions ────────────
  { id: 'jamb-agri-7', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Medium', prompt: 'What is the process of raising crops called?', answers: ['Animal husbandry', 'Crop production', 'Fish farming', 'Forestry'], correctIndex: 1, explanation: 'Crop production (arable farming) is the cultivation of crops for food or other uses.' },
  { id: 'jamb-agri-8', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Easy', prompt: 'What is soil erosion?', answers: ['Adding nutrients to soil', 'Removal of topsoil by wind or water', 'Planting crops', 'Irrigating fields'], correctIndex: 1, explanation: 'Soil erosion is the removal of the top layer of soil by natural forces like wind and water.' },
  { id: 'jamb-agri-9', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Hard', prompt: 'What is the function of nitrogen in plants?', answers: ['Flower formation', 'Leaf growth and green color', 'Root development', 'Fruit ripening'], correctIndex: 1, explanation: 'Nitrogen promotes leafy growth and gives plants their green color.' },
  { id: 'jamb-agri-10', category: 'jamb', subject: 'Agricultural Science', difficulty: 'Medium', prompt: 'What is irrigation?', answers: ['Draining water', 'Artificial application of water to crops', 'Removing weeds', 'Harvesting crops'], correctIndex: 1, explanation: 'Irrigation is the artificial application of water to land to assist in crop production.' },
  // ─── JAMB: More Further Mathematics Questions ─────────────
  { id: 'jamb-fm-5', category: 'jamb', subject: 'Further Mathematics', difficulty: 'Hard', prompt: 'What is the value of the integral of 1/x dx?', answers: ['x + C', 'ln|x| + C', '1/x² + C', 'eˣ + C'], correctIndex: 1, explanation: '∫(1/x) dx = ln|x| + C.' },
  { id: 'jamb-fm-6', category: 'jamb', subject: 'Further Mathematics', difficulty: 'Hard', prompt: 'What is the dot product of vectors (1,2) and (3,4)?', answers: ['10', '11', '12', '13'], correctIndex: 1, explanation: 'Dot product = (1×3) + (2×4) = 3 + 8 = 11.' },
  { id: 'jamb-fm-7', category: 'jamb', subject: 'Further Mathematics', difficulty: 'Hard', prompt: 'What is the value of i² (imaginary unit squared)?', answers: ['1', '-1', 'i', '-i'], correctIndex: 1, explanation: 'i² = -1, where i is the imaginary unit.' },
  { id: 'jamb-fm-8', category: 'jamb', subject: 'Further Mathematics', difficulty: 'Hard', prompt: 'What is the sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + ...?', answers: ['1', '1.5', '2', '3'], correctIndex: 2, explanation: 'Sum = a/(1-r) = 1/(1-1/2) = 1/(1/2) = 2.' },
  // ─── JAMB: More History Questions ─────────────────────────
  { id: 'jamb-his-5', category: 'jamb', subject: 'History', difficulty: 'Medium', prompt: 'The Trans-Atlantic slave trade involved the movement of slaves from:', answers: ['Asia to Europe', 'Africa to the Americas', 'Europe to Africa', 'America to Europe'], correctIndex: 1, explanation: 'The Trans-Atlantic slave trade involved the forced movement of Africans to the Americas.' },
  { id: 'jamb-his-6', category: 'jamb', subject: 'History', difficulty: 'Easy', prompt: 'Who was the first Prime Minister of independent Nigeria?', answers: ['Nnamdi Azikiwe', 'Abubakar Tafawa Balewa', 'Obafemi Awolowo', 'Ahmadu Bello'], correctIndex: 1, explanation: 'Sir Abubakar Tafawa Balewa became the first Prime Minister of independent Nigeria in 1960.' },
  { id: 'jamb-his-7', category: 'jamb', subject: 'History', difficulty: 'Hard', prompt: 'The Mungo Park expedition was about:', answers: ['Exploring the Nile', 'Exploring the River Niger', 'Exploring the Sahara', 'Exploring the coast'], correctIndex: 1, explanation: 'Mungo Park explored the River Niger in the late 18th and early 19th centuries.' },
  { id: 'jamb-his-8', category: 'jamb', subject: 'History', difficulty: 'Medium', prompt: 'The Sokoto Caliphate was founded by:', answers: ['Sultan Bello', 'Usman dan Fodio', 'Shehu Alimi', 'Muhammad Rumfa'], correctIndex: 1, explanation: 'Usman dan Fodio founded the Sokoto Caliphate in the early 19th century.' },
  // ─── JAMB: More Insurance Questions ───────────────────────
  { id: 'jamb-ins-5', category: 'jamb', subject: 'Insurance', difficulty: 'Medium', prompt: 'What is a policy in insurance?', answers: ['A bank statement', 'The insurance contract', 'A claim form', 'A premium receipt'], correctIndex: 1, explanation: 'An insurance policy is the legal contract between the insurer and the insured.' },
  { id: 'jamb-ins-6', category: 'jamb', subject: 'Insurance', difficulty: 'Easy', prompt: 'What is a claim in insurance?', answers: ['The premium paid', 'A request for compensation', 'The policy document', 'The insured item'], correctIndex: 1, explanation: 'A claim is a formal request by the insured for compensation for a covered loss.' },
  { id: 'jamb-ins-7', category: 'jamb', subject: 'Insurance', difficulty: 'Hard', prompt: 'What is reinsurance?', answers: ['Double insurance', 'Insurance for insurers', 'Cancelled insurance', 'Free insurance'], correctIndex: 1, explanation: 'Reinsurance is insurance purchased by an insurance company from another insurer to spread risk.' },
  { id: 'jamb-ins-8', category: 'jamb', subject: 'Insurance', difficulty: 'Medium', prompt: 'What is the principle of indemnity?', answers: ['The insured should profit from loss', 'The insured should be restored to original position', 'The insurer keeps all premiums', 'The policy never expires'], correctIndex: 1, explanation: 'Indemnity means the insured should be restored to the financial position they were in before the loss.' },
  // ─── JAMB: More Music Questions ───────────────────────────
  { id: 'jamb-mus-5', category: 'jamb', subject: 'Music', difficulty: 'Medium', prompt: 'What is the musical term for gradually getting louder?', answers: ['Diminuendo', 'Crescendo', 'Fortissimo', 'Pianissimo'], correctIndex: 1, explanation: 'Crescendo means gradually increasing in volume.' },
  { id: 'jamb-mus-6', category: 'jamb', subject: 'Music', difficulty: 'Easy', prompt: 'What is the most common time signature?', answers: ['2/4', '3/4', '4/4', '6/8'], correctIndex: 2, explanation: '4/4 (common time) is the most frequently used time signature.' },
  { id: 'jamb-mus-7', category: 'jamb', subject: 'Music', difficulty: 'Hard', prompt: 'What is a symphony?', answers: ['A solo performance', 'A large orchestral work in multiple movements', 'A type of song', 'A dance'], correctIndex: 1, explanation: 'A symphony is an extended musical composition for orchestra, typically in several movements.' },
  { id: 'jamb-mus-8', category: 'jamb', subject: 'Music', difficulty: 'Medium', prompt: 'Which Nigerian musician is known for Afrobeat?', answers: ['King Sunny Ade', 'Fela Kuti', 'Ebenezer Obey', 'Victor Uwaifo'], correctIndex: 1, explanation: 'Fela Kuti pioneered and popularized Afrobeat music.' },
  // ─── JAMB: More PHE Questions ─────────────────────────────
  { id: 'jamb-phe-5', category: 'jamb', subject: 'Physical & Health Education', difficulty: 'Medium', prompt: 'What is the main cause of malaria?', answers: ['Bacteria', 'Virus', 'Plasmodium parasite', 'Fungus'], correctIndex: 2, explanation: 'Malaria is caused by the Plasmodium parasite transmitted by female Anopheles mosquitoes.' },
  { id: 'jamb-phe-6', category: 'jamb', subject: 'Physical & Health Education', difficulty: 'Easy', prompt: 'How many players are on a volleyball team?', answers: ['5', '6', '7', '8'], correctIndex: 1, explanation: 'A standard volleyball team has 6 players on the court.' },
  { id: 'jamb-phe-7', category: 'jamb', subject: 'Physical & Health Education', difficulty: 'Hard', prompt: 'What is the function of carbohydrates in the body?', answers: ['Build muscles', 'Provide energy', 'Store vitamins', 'Transport oxygen'], correctIndex: 1, explanation: 'Carbohydrates are the body\'s primary source of energy.' },
  { id: 'jamb-phe-8', category: 'jamb', subject: 'Physical & Health Education', difficulty: 'Medium', prompt: 'What is the first aid for a burn?', answers: ['Apply butter', 'Cool with running water', 'Pop blisters', 'Apply ice directly'], correctIndex: 1, explanation: 'Cool running water should be applied to burns for at least 10 minutes.' },
  // ─── JAMB: More Principles of Accounts Questions ──────────
  { id: 'jamb-pa-5', category: 'jamb', subject: 'Principles of Accounts', difficulty: 'Medium', prompt: 'What is a ledger?', answers: ['A journal entry', 'A book of accounts', 'A financial statement', 'A receipt'], correctIndex: 1, explanation: 'A ledger is a book or collection of accounts where transactions are recorded.' },
  { id: 'jamb-pa-6', category: 'jamb', subject: 'Principles of Accounts', difficulty: 'Easy', prompt: 'What is a debit note?', answers: ['A document showing money owed', 'A receipt for payment', 'A bank statement', 'A tax form'], correctIndex: 0, explanation: 'A debit note is a document sent by a buyer to a seller indicating money owed.' },
  { id: 'jamb-pa-7', category: 'jamb', subject: 'Principles of Accounts', difficulty: 'Hard', prompt: 'What is the purpose of depreciation?', answers: ['To increase profit', 'To spread asset cost over useful life', 'To reduce taxes', 'To increase asset value'], correctIndex: 1, explanation: 'Depreciation allocates the cost of a fixed asset over its estimated useful life.' },
  { id: 'jamb-pa-8', category: 'jamb', subject: 'Principles of Accounts', difficulty: 'Medium', prompt: 'What is a cash book?', answers: ['A record of credit sales', 'A book for recording cash transactions', 'A bank statement', 'A sales ledger'], correctIndex: 1, explanation: 'A cash book records all cash receipts and payments.' },
  // ─── JAMB: More Food and Nutrition Questions ──────────────
  { id: 'jamb-fn-5', category: 'jamb', subject: 'Food and Nutrition', difficulty: 'Medium', prompt: 'What is the main function of protein in the body?', answers: ['Provide energy', 'Build and repair tissues', 'Store vitamins', 'Regulate temperature'], correctIndex: 1, explanation: 'Proteins are essential for building and repairing body tissues.' },
  { id: 'jamb-fn-6', category: 'jamb', subject: 'Food and Nutrition', difficulty: 'Easy', prompt: 'Which mineral is important for strong bones?', answers: ['Iron', 'Calcium', 'Potassium', 'Sodium'], correctIndex: 1, explanation: 'Calcium is essential for building and maintaining strong bones and teeth.' },
  { id: 'jamb-fn-7', category: 'jamb', subject: 'Food and Nutrition', difficulty: 'Hard', prompt: 'What is the recommended daily intake of fiber for adults?', answers: ['10-15g', '25-30g', '50-60g', '100g'], correctIndex: 1, explanation: 'The recommended daily fiber intake for adults is about 25-30 grams.' },
  { id: 'jamb-fn-8', category: 'jamb', subject: 'Food and Nutrition', difficulty: 'Medium', prompt: 'What is the best source of iron?', answers: ['Milk', 'Red meat', 'Bread', 'Apples'], correctIndex: 1, explanation: 'Red meat is an excellent source of heme iron, which is easily absorbed by the body.' },
  // ─── JAMB: More Animal Husbandry Questions ────────────────
  { id: 'jamb-ah-5', category: 'jamb', subject: 'Animal Husbandry', difficulty: 'Medium', prompt: 'What is the young of a sheep called?', answers: ['Calf', 'Lamb', 'Kid', 'Foal'], correctIndex: 1, explanation: 'A young sheep is called a lamb.' },
  { id: 'jamb-ah-6', category: 'jamb', subject: 'Animal Husbandry', difficulty: 'Easy', prompt: 'What is the main product from poultry farming?', answers: ['Milk', 'Eggs and meat', 'Wool', 'Leather'], correctIndex: 1, explanation: 'Poultry farming primarily produces eggs and meat.' },
  { id: 'jamb-ah-7', category: 'jamb', subject: 'Animal Husbandry', difficulty: 'Hard', prompt: 'What is the gestation period of a cow?', answers: ['5 months', '7 months', '9 months', '11 months'], correctIndex: 2, explanation: 'The gestation period of a cow is approximately 9 months (280 days).' },
  { id: 'jamb-ah-8', category: 'jamb', subject: 'Animal Husbandry', difficulty: 'Medium', prompt: 'What is the term for a male horse?', answers: ['Bull', 'Stallion', 'Ram', 'Boar'], correctIndex: 1, explanation: 'A male horse is called a stallion.' },
  // ─── JAMB: More Forestry Questions ────────────────────────
  { id: 'jamb-for-5', category: 'jamb', subject: 'Forestry', difficulty: 'Medium', prompt: 'What is the importance of forests?', answers: ['Only for timber', 'Provide oxygen, habitat, and resources', 'Cause flooding', 'Increase pollution'], correctIndex: 1, explanation: 'Forests provide oxygen, wildlife habitat, timber, and many other ecosystem services.' },
  { id: 'jamb-for-6', category: 'jamb', subject: 'Forestry', difficulty: 'Easy', prompt: 'What is a forest reserve?', answers: ['A protected forest area', 'A tree nursery', 'A logging site', 'A farm'], correctIndex: 0, explanation: 'A forest reserve is a protected area of forest managed for conservation.' },
  { id: 'jamb-for-7', category: 'jamb', subject: 'Forestry', difficulty: 'Hard', prompt: 'What is the term for the upper layer of a forest?', answers: ['Understory', 'Canopy', 'Forest floor', 'Shrub layer'], correctIndex: 1, explanation: 'The canopy is the upper layer of a forest formed by tree crowns.' },
  { id: 'jamb-for-8', category: 'jamb', subject: 'Forestry', difficulty: 'Medium', prompt: 'Which of these is a forest conservation method?', answers: ['Bush burning', 'Selective logging', 'Overgrazing', 'Deforestation'], correctIndex: 1, explanation: 'Selective logging is a sustainable forest management practice.' },
  // ─── JAMB: More Yoruba Questions ──────────────────────────
  { id: 'jamb-yor-5', category: 'jamb', subject: 'Yoruba', difficulty: 'Medium', prompt: 'What does "O daaro" mean in English?', answers: ['Good morning', 'Good afternoon', 'Good evening', 'Goodbye'], correctIndex: 2, explanation: '"O daaro" is Yoruba for "Good evening".' },
  { id: 'jamb-yor-6', category: 'jamb', subject: 'Yoruba', difficulty: 'Easy', prompt: 'What is "E seun" in English?', answers: ['Hello', 'Thank you', 'Goodbye', 'Please'], correctIndex: 1, explanation: '"E seun" means "Thank you" in Yoruba.' },
  { id: 'jamb-yor-7', category: 'jamb', subject: 'Yoruba', difficulty: 'Hard', prompt: 'The Yoruba god of iron and war is:', answers: ['Sango', 'Ogun', 'Obatala', 'Esu'], correctIndex: 1, explanation: 'Ogun is the Yoruba deity of iron, war, and labor.' },
  { id: 'jamb-yor-8', category: 'jamb', subject: 'Yoruba', difficulty: 'Medium', prompt: 'What is "Ayo" in English?', answers: ['Sadness', 'Joy', 'Anger', 'Fear'], correctIndex: 1, explanation: '"Ayo" means "joy" or "happiness" in Yoruba.' },
  // ─── JAMB: More Hausa Questions ───────────────────────────
  { id: 'jamb-hau-5', category: 'jamb', subject: 'Hausa', difficulty: 'Medium', prompt: 'What does "Ina sunanka" mean in English?', answers: ['How are you', 'What is your name', 'Where are you from', 'How old are you'], correctIndex: 1, explanation: '"Ina sunanka" means "What is your name?" in Hausa.' },
  { id: 'jamb-hau-6', category: 'jamb', subject: 'Hausa', difficulty: 'Easy', prompt: 'What is "Lafiya" in English?', answers: ['Sickness', 'Peace/Health', 'Wealth', 'Happiness'], correctIndex: 1, explanation: '"Lafiya" means "peace" or "health" in Hausa.' },
  { id: 'jamb-hau-7', category: 'jamb', subject: 'Hausa', difficulty: 'Hard', prompt: 'The famous Hausa city of learning is:', answers: ['Kano', 'Sokoto', 'Timbuktu', 'Zaria'], correctIndex: 1, explanation: 'Sokoto is historically known as a center of Islamic learning in Hausaland.' },
  { id: 'jamb-hau-8', category: 'jamb', subject: 'Hausa', difficulty: 'Medium', prompt: 'What is "Gida" in English?', answers: ['Car', 'House', 'Food', 'Water'], correctIndex: 1, explanation: '"Gida" means "house" or "home" in Hausa.' },
  // ─── JAMB: More Igbo Questions ────────────────────────────
  { id: 'jamb-igb-5', category: 'jamb', subject: 'Igbo', difficulty: 'Medium', prompt: 'What does "Daalu" mean in English?', answers: ['Hello', 'Thank you', 'Goodbye', 'Welcome'], correctIndex: 1, explanation: '"Daalu" means "Thank you" in Igbo.' },
  { id: 'jamb-igb-6', category: 'jamb', subject: 'Igbo', difficulty: 'Easy', prompt: 'What is "Nnọọ" in English?', answers: ['Goodbye', 'Welcome', 'Thank you', 'Sorry'], correctIndex: 1, explanation: '"Nnọọ" means "Welcome" in Igbo.' },
  { id: 'jamb-igb-7', category: 'jamb', subject: 'Igbo', difficulty: 'Hard', prompt: 'The Igbo traditional ruler is called:', answers: ['Oba', 'Eze', 'Emir', 'Obi'], correctIndex: 1, explanation: '"Eze" is the title for a traditional ruler in Igbo land.' },
  { id: 'jamb-igb-8', category: 'jamb', subject: 'Igbo', difficulty: 'Medium', prompt: 'What is "Mma" in English?', answers: ['Ugly', 'Beautiful', 'Big', 'Small'], correctIndex: 1, explanation: '"Mma" means "beautiful" or "good" in Igbo.' },
  // ─── JAMB: More Islamic Studies Questions ─────────────────
  { id: 'jamb-irs-5', category: 'jamb', subject: 'Islamic Studies', difficulty: 'Medium', prompt: 'What is the first pillar of Islam?', answers: ['Salah', 'Shahada', 'Zakat', 'Sawm'], correctIndex: 1, explanation: 'Shahada (declaration of faith) is the first pillar of Islam.' },
  { id: 'jamb-irs-6', category: 'jamb', subject: 'Islamic Studies', difficulty: 'Easy', prompt: 'How many times do Muslims pray daily?', answers: ['3', '5', '7', '10'], correctIndex: 1, explanation: 'Muslims pray five times daily (Salah).' },
  { id: 'jamb-irs-7', category: 'jamb', subject: 'Islamic Studies', difficulty: 'Hard', prompt: 'What is the significance of the Hijrah?', answers: ['The birth of Muhammad', 'The migration to Medina', 'The first revelation', 'The conquest of Mecca'], correctIndex: 1, explanation: 'The Hijrah was the migration of Prophet Muhammad from Mecca to Medina in 622 CE.' },
  { id: 'jamb-irs-8', category: 'jamb', subject: 'Islamic Studies', difficulty: 'Medium', prompt: 'What is the holy month of fasting in Islam?', answers: ['Muharram', 'Ramadan', 'Shawwal', 'Dhul Hijjah'], correctIndex: 1, explanation: 'Ramadan is the holy month when Muslims fast from dawn to sunset.' },
  // ─── JAMB: More French Questions ──────────────────────────
  { id: 'jamb-french-3', category: 'jamb', subject: 'French', difficulty: 'Medium', prompt: 'What does "Au revoir" mean in English?', answers: ['Hello', 'Goodbye', 'Thank you', 'Please'], correctIndex: 1, explanation: '"Au revoir" means "Goodbye" in French.' },
  { id: 'jamb-french-4', category: 'jamb', subject: 'French', difficulty: 'Easy', prompt: 'What is "S\'il vous plaît" in English?', answers: ['Thank you', 'Please', 'Sorry', 'You\'re welcome'], correctIndex: 1, explanation: '"S\'il vous plaît" means "Please" in French.' },
  { id: 'jamb-french-5', category: 'jamb', subject: 'French', difficulty: 'Hard', prompt: 'What does "Je ne sais pas" mean?', answers: ['I know', 'I don\'t know', 'I don\'t understand', 'I don\'t care'], correctIndex: 1, explanation: '"Je ne sais pas" means "I don\'t know" in French.' },
  { id: 'jamb-french-6', category: 'jamb', subject: 'French', difficulty: 'Medium', prompt: 'What is "Bonsoir" in English?', answers: ['Good morning', 'Good evening', 'Goodbye', 'Good night'], correctIndex: 1, explanation: '"Bonsoir" means "Good evening" in French.' },
  // ─── JAMB: More Arabic Questions ──────────────────────────
  { id: 'jamb-arab-3', category: 'jamb', subject: 'Arabic', difficulty: 'Medium', prompt: 'What does "Bismillah" mean?', answers: ['Praise be to God', 'In the name of God', 'God is great', 'Thank God'], correctIndex: 1, explanation: '"Bismillah" means "In the name of God (Allah)".' },
  { id: 'jamb-arab-4', category: 'jamb', subject: 'Arabic', difficulty: 'Easy', prompt: 'What is "Insha\'Allah" in English?', answers: ['Thank God', 'God willing', 'Praise be to God', 'God is great'], correctIndex: 1, explanation: '"Insha\'Allah" means "God willing" or "If God wills".' },
  { id: 'jamb-arab-5', category: 'jamb', subject: 'Arabic', difficulty: 'Hard', prompt: 'What does "Masha\'Allah" mean?', answers: ['God is great', 'God has willed it', 'Praise be to God', 'In the name of God'], correctIndex: 1, explanation: '"Masha\'Allah" is used to express appreciation or admiration for something good.' },
  { id: 'jamb-arab-6', category: 'jamb', subject: 'Arabic', difficulty: 'Medium', prompt: 'What is "Subhanallah" in English?', answers: ['God is great', 'Glory be to God', 'Thank God', 'God willing'], correctIndex: 1, explanation: '"Subhanallah" means "Glory be to God".' },
  // ─── JAMB: More Typewriting Questions ─────────────────────
  { id: 'jamb-type-5', category: 'jamb', subject: 'Typewriting', difficulty: 'Medium', prompt: 'What is the correct posture for typing?', answers: ['Slouching', 'Sitting upright with feet flat', 'Standing', 'Lying down'], correctIndex: 1, explanation: 'Proper typing posture involves sitting upright with feet flat on the floor.' },
  { id: 'jamb-type-6', category: 'jamb', subject: 'Typewriting', difficulty: 'Easy', prompt: 'What key is used to delete text to the left?', answers: ['Delete', 'Backspace', 'Space', 'Tab'], correctIndex: 1, explanation: 'The Backspace key deletes text to the left of the cursor.' },
  { id: 'jamb-type-7', category: 'jamb', subject: 'Typewriting', difficulty: 'Hard', prompt: 'What is the purpose of the Tab key?', answers: ['Delete text', 'Indent text', 'Capitalize text', 'Space text'], correctIndex: 1, explanation: 'The Tab key is used to indent text or move to the next tab stop.' },
  { id: 'jamb-type-8', category: 'jamb', subject: 'Typewriting', difficulty: 'Medium', prompt: 'What is the function of the Enter key?', answers: ['Delete text', 'Start a new line', 'Capitalize text', 'Space text'], correctIndex: 1, explanation: 'The Enter key is used to start a new line or paragraph.' },
  // ─── JAMB: More Clothing and Textiles Questions ───────────
  { id: 'jamb-ct-5', category: 'jamb', subject: 'Clothing and Textiles', difficulty: 'Medium', prompt: 'What is the process of removing color from fabric called?', answers: ['Dyeing', 'Bleaching', 'Printing', 'Weaving'], correctIndex: 1, explanation: 'Bleaching is the process of removing color from fabric.' },
  { id: 'jamb-ct-6', category: 'jamb', subject: 'Clothing and Textiles', difficulty: 'Easy', prompt: 'What is a needle used for in sewing?', answers: ['Cutting fabric', 'Stitching fabric', 'Measuring fabric', 'Ironing fabric'], correctIndex: 1, explanation: 'A needle is used for stitching fabric together with thread.' },
  { id: 'jamb-ct-7', category: 'jamb', subject: 'Clothing and Textiles', difficulty: 'Hard', prompt: 'What natural fiber comes from the silkworm?', answers: ['Cotton', 'Wool', 'Silk', 'Linen'], correctIndex: 2, explanation: 'Silk is a natural fiber produced by silkworms.' },
  { id: 'jamb-ct-8', category: 'jamb', subject: 'Clothing and Textiles', difficulty: 'Medium', prompt: 'What is the purpose of a thimble?', answers: ['Cut thread', 'Protect finger while sewing', 'Measure fabric', 'Store needles'], correctIndex: 1, explanation: 'A thimble protects the finger when pushing a needle through fabric.' },
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
    if (category === 'jamb') {
      pool = pool.filter((q) => q.category === 'jamb');
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
