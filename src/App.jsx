import React, { useEffect, useState } from "react";

import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { auth, db } from "./firebase/config";

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import {ToastContainer} from 'react-toastify'
import { requestNotificationPermission } from "./firebaseMessaging";

/* ================= PAGES ================= */

import Dashboard from "./assets/pages/Dashboard";
import Login from "./assets/pages/Login";
import Signup from "./assets/pages/Signup";
import ResetPassword from "./assets/pages/ResetPassword";
import CGPA from "./assets/pages/CGPA";
import Profile from "./assets/pages/Profile";
import Question from "./assets/pages/Question";
import Upload from "./assets/pages/Upload";
import AiAssistance from "./assets/pages/AiAssistance";
import GPA from "./assets/pages/GPA";
import LectureNotesMarketplace from "./assets/pages/LectureNotesMarketplace";
import HostelMarketplace from "./assets/pages/HostelMarketplace";
import NewsFeed from "./assets/pages/NewsFeed";
import Community from "./assets/pages/Community";
import ManageGroup from "./assets/pages/ManageGroup";
import Messenger from "./assets/pages/Messenger";
import NotificationsCenter from "./assets/pages/NotificationsCenter";
import CommunitySettings from "./assets/pages/CommunitySettings";
import ComingSoon from "./assets/pages/ComingSoon";
import MyHostels from "./assets/pages/MyUploadedHostel";
import Contact from "./assets/pages/Contact";
import Report from "./assets/pages/Report";
import StudentMarketplace from "./assets/pages/StudentMarketplace";
import AdminPanel from "./assets/pages/AdminPanel";
import PremiumSubscriptionPage from "./assets/pages/PremiumSubscriptionPage";
import Tasks from "./assets/pages/Tasks";
import SmartTimetableBuilder from "./assets/pages/SmartTimetableBuilder";
import Announcements from "./assets/pages/Announcements";
import CBTPracticePage from "./assets/pages/CBTPracticePage";
import NotFound from "./assets/pages/NotFound";

/* ================= LAYOUTS ================= */

import DashboardLayout from "./assets/Layouts/DashboardLayout";

/* ================= COMPONENTS ================= */

import ProtectedRoute from "./assets/components/ProtectedRoutes";
import InstallPrompt from "./assets/components/InstallPrompt";
import AcademicCalculator from "./assets/components/AcademicCalculator";
import StoriesHome from "./assets/pages/stories/StoriesHome";
import StoryDetails from "./assets/pages/stories/StoryDetails";
import ReadStory from "./assets/pages/stories/ReadStory";
import CreateStory from "./assets/pages/stories/CreateStory";
import CreateChapter from './assets/pages/stories/CreateChapter';
import { listenToForegroundMessages } from "./assets/utils/notificationPermission";
import FormulaHome from "./assets/pages/formulaHub/FormulaHome";
import FormulaDetails from "./assets/pages/formulaHub/FormulaDetails";
import SubjectPage from "./assets/pages/formulaHub/SubjectPage";
import BookmarksPage from "./assets/pages/formulaHub/BookmarksPage";
import FormulaSubjectsPage from "./assets/pages/formulaHub/FormulaSubjectsPage";
import ChallengeDashboard from "./assets/pages/ChallengeDashboard";
import StreakDashboard from "./assets/pages/StreakDashboard";
import FAQPage from "./assets/pages/FAQPage";
import About from "./assets/pages/About";
import HelpCenter from "./assets/pages/HelpCenter";
import PrivacyPolicy from "./assets/pages/PrivacyPolicy";
import TermsOfService from "./assets/pages/TermsOfService";
import CompleteProfile from "./assets/pages/CompleteProfile";
import FeaturesCatalog from "./assets/pages/FeaturesCatalog";

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const [dark, setDark] = useState(() => {
    const savedTheme =
      localStorage.getItem("theme") ||
      localStorage.getItem("unihelp-theme");

    return savedTheme === "dark" || savedTheme === "true";
  });
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingRole, setLoadingRole] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  /* ================= THEME ================= */

  useEffect(() => {
    const themeValue = dark ? "dark" : "light";

    localStorage.setItem("theme", themeValue);
    localStorage.setItem("unihelp-theme", themeValue);
  }, [dark]);

  /* ================= ROUTE SCROLL RESET ================= */

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const updateUserPresence = async (user) => {
    if (!user) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          lastActive: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
          lastStudyActivityAt: serverTimestamp(),
          notificationsEnabled: true,
        },
        { merge: true }
      );
    } catch (error) {
      console.log("Presence sync failed:", error);
    }
  };

  /* ================= AUTH LISTENER ================= */

  useEffect(() => {
  let unsubRole = null;
  let unsubForeground = null;

  const unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      setCurrentUser(user);

      if (!user) {
        setLoadingRole(false);

        if (unsubRole) unsubRole();

        return;
      }

      try {
        /* ================= UPDATE LAST ACTIVE ================= */

        await updateUserPresence(user);

        /* ================= REQUEST FCM TOKEN ================= */

        try {
          const token =
            await requestNotificationPermission();

          if (token) {
            await setDoc(
              doc(db, "users", user.uid),
              {
                fcmToken: token,
                notificationsEnabled: true,
              },
              { merge: true }
            );
          }
        } catch (err) {
          console.log(
            "Notification Error:",
            err
          );
        }

        /* ================= FOREGROUND LISTENER ================= */

        unsubForeground = listenToForegroundMessages();

        /* ================= REALTIME USER ROLE ================= */

        unsubRole = onSnapshot(
          doc(db, "users", user.uid),
          () => {
            setLoadingRole(false);
          }
        );
      } catch (err) {
        console.log(err);

        setLoadingRole(false);
      }
    }
  );

    return () => {
      unsubscribe();

      if (unsubRole) unsubRole();
      if (unsubForeground) unsubForeground();
    };
}, []);

  useEffect(() => {
    if (currentUser) {
      updateUserPresence(currentUser);
    }
  }, [currentUser, location.pathname]);

  /* ================= LOADING SCREEN ================= */

  if (loadingRole) {
    return (
      <div className={`h-screen flex items-center justify-center ${ dark ? "bg-[#020617] text-white" : "bg-white text-black"}`}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-5" />
          <h2 className="text-xl font-bold">Loading UniHelp...</h2>
          <p className="opacity-70 mt-2 text-sm">Preparing your experience</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <InstallPrompt />
      <ToastContainer />

      <div className={`${dark ? "bg-[#020617] text-white" : "bg-[#f8fafc] text-black"}`}>
        <Routes>
          {/* ================= AUTH ================= */}
          <Route path="/login"  element={currentUser ? <Navigate to="/" replace /> : <Login dark={dark} />}/>
          <Route path="/register" element={ currentUser ? <Navigate to="/" replace /> : <Signup dark={dark} /> }/>
          <Route path="/reset-password" element={ currentUser ? <Navigate to="/" replace /> : <ResetPassword dark={dark} /> }/>
          <Route path="/complete-profile" element={ currentUser ? <CompleteProfile dark={dark} /> : <Navigate to="/login" replace /> }/>

        <Route element={ <DashboardLayout menuOpen={menuOpen} setMenuOpen={setMenuOpen} dark={dark} setDark={setDark}/>}>
            <Route path="/" element={ <Dashboard dark={dark} /> }/>
            <Route path="/profile" element={ <ProtectedRoute> <Profile dark={dark} toggleTheme={() => setDark(!dark)} /> </ProtectedRoute>}/>
            <Route path="/announcements" element={<ProtectedRoute><Announcements dark={dark} /> </ProtectedRoute>}/>
            <Route path="/cbt-practice" element={ <ProtectedRoute> <CBTPracticePage dark={dark} /> </ProtectedRoute>}/>
            <Route path="/faq" element={<FAQPage dark={dark} />} />
            <Route path="/about" element={<About dark={dark}/>}/>
            <Route path="/help-center" element={<HelpCenter dark={dark} />} />
            <Route path="/privacy" element={<PrivacyPolicy dark={dark} />} />
            <Route path="/terms" element={<TermsOfService dark={dark} />} />
            <Route path="/contact" element={<ProtectedRoute> <Contact dark={dark} /> </ProtectedRoute>}/>
            <Route  path="/report" element={ <ProtectedRoute> <Report dark={dark} /> </ProtectedRoute> } />
            <Route path="/formula-hub" element={<FormulaHome dark={dark} />} />
            <Route path="/formula-hub/subject/:subject" element={<SubjectPage dark={dark} />}/>
            <Route path="/formula-hub/subjects" element={<FormulaSubjectsPage dark={dark} />}/>
            <Route path="/formula-hub/:id" element={<FormulaDetails dark={dark} />} />
            <Route path="/formula-hub/bookmarks" element={<BookmarksPage dark={dark} />}/>
            <Route path="/community" element={ <ProtectedRoute> <Community dark={dark} /> </ProtectedRoute> } />
            <Route path="/community/:groupId" element={ <ProtectedRoute> <Community dark={dark} /> </ProtectedRoute>}/>
            <Route path="/community/:groupId/manage" element={ <ProtectedRoute> <ManageGroup dark={dark} /></ProtectedRoute>}/>
            <Route path="/messages" element={ <ProtectedRoute> <Messenger dark={dark} /> </ProtectedRoute> } />
            <Route path="/notifications" element={ <ProtectedRoute> <NotificationsCenter dark={dark} /> </ProtectedRoute> } />
            <Route path="/community-settings" element={ <ProtectedRoute> <CommunitySettings dark={dark} /> </ProtectedRoute>}/>
            <Route path="/coming-soon" element={ <ProtectedRoute> <ComingSoon dark={dark} /> </ProtectedRoute>} />
            <Route path="/features" element={<FeaturesCatalog dark={dark} />} />
            <Route path="/calculator" element={<ProtectedRoute><AcademicCalculator dark={dark}/></ProtectedRoute> }/>
            <Route path="/newsfeed" element={ <ProtectedRoute> <NewsFeed dark={dark} /> </ProtectedRoute> } />     
            <Route path="/premium" element={ <ProtectedRoute> <PremiumSubscriptionPage dark={dark} /> </ProtectedRoute> }/>
            <Route path="/tasks" element={ <ProtectedRoute> <Tasks dark={dark} /> </ProtectedRoute> } />
            <Route path="/challenge" element={ <ProtectedRoute> <ChallengeDashboard dark={dark} /> </ProtectedRoute> } />
            <Route path="/streak" element={ <ProtectedRoute> <StreakDashboard dark={dark} /> </ProtectedRoute> } />
            <Route path="/smart-timetable" element={ <ProtectedRoute> <SmartTimetableBuilder dark={dark} /> </ProtectedRoute> } />
            <Route path="/cgpa" element={ <ProtectedRoute> <CGPA dark={dark} /> </ProtectedRoute> } />
            <Route path="/gpa" element={ <ProtectedRoute> <GPA dark={dark} /> </ProtectedRoute> } />
            <Route path="/uploadquestion" element={ <ProtectedRoute> <Upload dark={dark} /> </ProtectedRoute> } />
            <Route path="/hostelmarketplace" element={ <ProtectedRoute> <HostelMarketplace dark={dark} /> </ProtectedRoute> } />
            <Route path="/lecturenotesmarketplace" element={ <ProtectedRoute> <LectureNotesMarketplace dark={dark} /> </ProtectedRoute> } />
            <Route path="/studentmarketplace" element={ <ProtectedRoute> <StudentMarketplace dark={dark} /> </ProtectedRoute> } />
            <Route path="/myhostels" element={ <ProtectedRoute> <MyHostels dark={dark} /> </ProtectedRoute> } />
            <Route path="/questions" element={ <ProtectedRoute> <Question dark={dark} /> </ProtectedRoute> } />
            <Route path="/stories" element={<StoriesHome dark={dark} />} />
            <Route path="/stories/:id" element={<StoryDetails dark={dark} />} />
            <Route path="/read-story/:storyId/:chapterId" element={<ReadStory />} />
            <Route path="/create-story" element={<CreateStory dark={dark} />} />
            <Route path="/create-chapter/:storyId" element={<CreateChapter dark={dark} />} />
            <Route path="/ai" element={ <ProtectedRoute> <AiAssistance dark={dark} /> </ProtectedRoute> }/>
            <Route path="/adminpanel" element={ <ProtectedRoute> <AdminPanel dark={dark} /> </ProtectedRoute> } />
          </Route>

          <Route path="*" element={<NotFound dark={dark} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
