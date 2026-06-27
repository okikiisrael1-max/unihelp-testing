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
import TutorialPage from "./assets/pages/Tutorials";
import MyHostels from "./assets/pages/MyUploadedHostel";
import TutorialMarketplace from "./assets/pages/TutorialMarketplace";
import Contact from "./assets/pages/Contact";
import Report from "./assets/pages/Report";
import StudentMarketplace from "./assets/pages/StudentMarketplace";
import CreateTutorial from "./assets/pages/creator/CreateTutorial";
import TutorDashboard from "./assets/pages/creator/TutorDashboard";
import TutorialDetails from "./assets/pages/TutorialDetails";
import ProtectedPdfViewer from "./assets/pages/ProtectedPdfViewer";
import TutorEarnings from "./assets/pages/creator/TutorEarnings";
import AdminWithdrawals from "./assets/pages/AdminWithdrawals";
import AdminPanel from "./assets/pages/AdminPanel";
import PremiumSubscriptionPage from "./assets/pages/PremiumSubscriptionPage";
import Tasks from "./assets/pages/Tasks";
import Announcements from "./assets/pages/Announcements";
import NotFound from "./assets/pages/NotFound";
import SelectRole from "./assets/pages/SelectRole";

/* ================= JAMB ================= */

import JambDashboard from "./assets/pages/jamb/jambDashboard";

/* ================= LAYOUTS ================= */

import DashboardLayout from "./assets/Layouts/DashboardLayout";

/* ================= COMPONENTS ================= */

import ProtectedRoute from "./assets/components/ProtectedRoutes";
import InstallPrompt from "./assets/components/InstallPrompt";
import JambLayout from "./assets/Layouts/JambLayout";
import JambSettings from "./assets/pages/jamb/JambSettings";
import StudentPurchases from "./assets/pages/StudentPurchases";
import JambSubjects from "./assets/pages/jamb/JambSubjects";
import JambStudyMaterials from "./assets/pages/jamb/JambStudyMaterial";
import SubjectDetailPage from "./assets/pages/jamb/SubjectDetailsPage";
import CBTExamPage from "./assets/pages/jamb/CBTExamPage";
import PastQuestionsSubjects from "./assets/pages/jamb/PastQuestionsSubjects";
import PastQuestionsViewer from "./assets/pages/jamb/PastQuestionViewer";
import JambSubscriptionPage from "./assets/pages/jamb/JambSubscriptionPage";
import GoalsPage from "./assets/pages/jamb/GoalsPage";
import AnalyticsPage from "./assets/pages/jamb/AnalyticsPage";
import StudyPlannerPage from "./assets/pages/jamb/StudyPlannerPage";
import JambAITutor from "./assets/pages/jamb/JambAITutor";
import JambLeaderboard from "./assets/pages/jamb/JambLeaderboard";
import Achievements from "./assets/pages/jamb/JambAchievements";
import FullMockExam from "./assets/pages/jamb/FullMockExam";
import FullMockSetup from "./assets/pages/jamb/FullMockSetup";
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
import FAQPage from "./assets/pages/FAQPage";
import About from "./assets/pages/About";
import HelpCenter from "./assets/pages/HelpCenter";
import PrivacyPolicy from "./assets/pages/PrivacyPolicy";
import TermsOfService from "./assets/pages/TermsOfService";

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "true";
  });
  const navigate = useNavigate();
  const location = useLocation();

  const [userRole, setUserRole] = useState(null);

  const [loadingRole, setLoadingRole] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  /* ================= THEME ================= */

  useEffect(() => {
    localStorage.setItem("theme", dark);
  }, [dark]);

  /* ================= ROUTE SCROLL RESET ================= */

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  /* ================= AUTH LISTENER ================= */

  useEffect(() => {
  let unsubRole = null;
  let unsubForeground = null;

  const unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      setCurrentUser(user);

      if (!user) {
        setUserRole(null);
        setLoadingRole(false);

        if (unsubRole) unsubRole();

        return;
      }

      try {
        /* ================= UPDATE LAST ACTIVE ================= */

        await setDoc(
          doc(db, "users", user.uid),
          {
            lastActive: serverTimestamp(),
          },
          { merge: true }
        );

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
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();

              setUserRole(data.role || null);
            } else {
              setUserRole(null);
            }

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

  /* ================= LOADING SCREEN ================= */

  if (loadingRole) {
    return (
      <div
        className={`h-screen flex items-center justify-center ${
          dark ? "bg-[#020617] text-white" : "bg-white text-black"
        }`}
      >
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
          <Route
            path="/login"
            element={
              currentUser ? <Navigate to="/" replace /> : <Login dark={dark} />
            }/>
          <Route
            path="/register"
            element={
              currentUser ? <Navigate to="/" replace /> : <Signup dark={dark} />
            }/>
          {/* ================= PROFILE ================= */}

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile dark={dark} />
                </ProtectedRoute>
              }
            />
             <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <Announcements dark={dark} />
                </ProtectedRoute>
              }
            />
            <Route path="/faq" element={<FAQPage dark={dark} />} />
            <Route path="/about" element={<About dark={dark}/>}/>
            <Route path="/help-center" element={<HelpCenter dark={dark} />} />
            <Route path="/privacy" element={<PrivacyPolicy dark={dark} />} />
            <Route path="/terms" element={<TermsOfService dark={dark} />} />

          {/* ================= SELECT ROLE ================= */}

          <Route
            path="/select-role"
            element={
              <ProtectedRoute>
                <SelectRole dark={dark} />
              </ProtectedRoute>
            }
          />

          <Route element={<ProtectedRoute> <JambLayout menuOpen={menuOpen} setMenuOpen={setMenuOpen} dark={dark} setDark={setDark}/></ProtectedRoute>}>
          
          {/* ================= JAMB ROUTES ================= */}
            
          {userRole === "jamb" && (
            <Route path="/" element={ <ProtectedRoute> <JambDashboard dark={dark} /> </ProtectedRoute> }/>
          )}
          <Route path="/settings" element={<ProtectedRoute><JambSettings dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/subjects" element={<ProtectedRoute><JambSubjects dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/materials" element={<ProtectedRoute><JambStudyMaterials dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/subjects/:subjectId" element={<ProtectedRoute><SubjectDetailPage dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/subjects/:subjectId/CBT" element={<ProtectedRoute><CBTExamPage dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/subjects-list" element={<ProtectedRoute><PastQuestionsSubjects   dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/past-questions/:subjectId" element={<ProtectedRoute><PastQuestionsViewer   dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/subscription" element={<ProtectedRoute><JambSubscriptionPage dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/goals" element={<ProtectedRoute><GoalsPage dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/planner" element={<ProtectedRoute><StudyPlannerPage dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/ai-tutor" element={<ProtectedRoute><JambAITutor dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/leaderboard" element={<ProtectedRoute><JambLeaderboard dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/achievements" element={<ProtectedRoute><Achievements dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/mock-exam" element={<ProtectedRoute><FullMockExam dark={dark} setDark={setDark}/></ProtectedRoute>} />

          <Route path="/mock-setup" element={<ProtectedRoute><FullMockSetup dark={dark} setDark={setDark}/></ProtectedRoute>} />

          </Route>

          <Route
              path="/contact"
              element={
                <ProtectedRoute>
                  <Contact dark={dark} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <Report dark={dark} />
                </ProtectedRoute>
              }
            />
          <Route
              path="/formula-hub"
              element={<FormulaHome dark={dark} />}
            />

            <Route
              path="/formula-hub/subject/:subject"
              element={<SubjectPage dark={dark} />}
            />

            <Route
              path="/formula-hub/subjects"
              element={<FormulaSubjectsPage dark={dark} />}
            />
            
            <Route
              path="/formula-hub/:id"
              element={<FormulaDetails dark={dark} />}
            />

            

            <Route
              path="/formula-hub/bookmarks"
              element={<BookmarksPage dark={dark} />}
            />

          

          

          {/* ================= DASHBOARD LAYOUT ================= */}
           <Route
            element={<ProtectedRoute>
              <DashboardLayout
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                dark={dark}
                setDark={setDark}
              />
            </ProtectedRoute>}>
          
          
            {/* ================= HOME REDIRECT ================= */}

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {userRole === "university" && <Dashboard dark={dark} />}
                </ProtectedRoute>
              }
            />


            {/* ================= COMMON ROUTES ================= */}

            <Route
              path="/community"
              element={
                <ProtectedRoute>
                  <Community dark={dark} />
                </ProtectedRoute>
              }
            />
            <Route path="/calculator" element={<ProtectedRoute><AcademicCalculator dark={dark}/></ProtectedRoute> }/>

            <Route
              path="/newsfeed"
              element={
                <ProtectedRoute>
                  <NewsFeed dark={dark} />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/premium"
              element={
                <ProtectedRoute>
                  <PremiumSubscriptionPage dark={dark} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks dark={dark} />
                </ProtectedRoute>
              }
            />

            {/* ================= UNIVERSITY ROUTES ================= */}

            {userRole === "university" && (
              <>
                <Route
                  path="/cgpa"
                  element={
                    <ProtectedRoute>
                      <CGPA dark={dark} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/gpa"
                  element={
                    <ProtectedRoute>
                      <GPA dark={dark} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/uploadquestion"
                  element={
                    <ProtectedRoute>
                      <Upload dark={dark} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hostelmarketplace"
                  element={
                    <ProtectedRoute>
                      <HostelMarketplace dark={dark} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/lecturenotesmarketplace"
                  element={
                    <ProtectedRoute>
                      <LectureNotesMarketplace dark={dark} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/studentmarketplace"
                  element={
                    <ProtectedRoute>
                      <StudentMarketplace dark={dark} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/myhostels"
                  element={
                    <ProtectedRoute>
                      <MyHostels dark={dark} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-purchases"
                  element={
                    <ProtectedRoute>
                      <StudentPurchases dark={dark} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/questions"
                  element={
                    <ProtectedRoute>
                      <Question dark={dark} />
                    </ProtectedRoute>
                  }
                />
                <Route path="/stories" element={<StoriesHome dark={dark} />} />

              <Route path="/stories/:id" element={<StoryDetails dark={dark} />} />

              <Route path="/read-story/:storyId/:chapterId" element={<ReadStory />} />

              <Route path="/create-story" element={<CreateStory dark={dark} />} />

              <Route path="/create-chapter/:storyId" element={<CreateChapter dark={dark} />} />
              </>

              
            )}

            {/* ================= SHARED FEATURES ================= */}

            <Route
              path="/ai"
              element={
                <ProtectedRoute>
                  <AiAssistance dark={dark} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tutorials"
              element={
                <ProtectedRoute>
                  <TutorialPage dark={dark} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tutorialmarketplace"
              element={
                <ProtectedRoute>
                  <TutorialMarketplace dark={dark} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tutorial/:id"
              element={
                <ProtectedRoute>
                  <TutorialDetails dark={dark} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pdf/:tutorialId"
              element={
                <ProtectedRoute>
                  <ProtectedPdfViewer dark={dark} />
                </ProtectedRoute>
              }
            />

            {/* ================= CREATOR ================= */}

            <Route
              path="/create-tutorial"
              element={
                <ProtectedRoute>
                  <CreateTutorial dark={dark} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tutor-dashboard"
              element={
                <ProtectedRoute>
                  <TutorDashboard dark={dark} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/earnings"
              element={
                <ProtectedRoute>
                  <TutorEarnings dark={dark} />
                </ProtectedRoute>
              }
            />

            {/* ================= ADMIN ================= */}

            <Route
              path="/adminpanel"
              element={
                <ProtectedRoute>
                  <AdminPanel dark={dark} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-withdrawals"
              element={
                <ProtectedRoute>
                  <AdminWithdrawals dark={dark} />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ================= 404 ================= */}

          <Route path="*" element={<NotFound dark={dark} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
