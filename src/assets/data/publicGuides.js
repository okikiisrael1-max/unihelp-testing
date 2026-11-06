export const publicGuides = {
  academic: {
    title: 'Academic tools for university students in Nigeria',
    intro: 'UniHelp brings together study resources, academic calculators, exam practice, Formula Hub, and planning tools for university students.',
    sections: [
      {
        title: 'Study with course resources',
        text: 'Browse lecture notes and past-question materials shared through UniHelp resources. Availability depends on what has been contributed for your school and course.',
        link: '/past-questions',
        linkLabel: 'Explore past questions and resources',
      },
      {
        title: 'Track academic progress',
        text: 'Use the GPA calculator for semester results and the CGPA tracker to save and review cumulative progress in your account.',
        link: '/gpa-calculator',
        linkLabel: 'See GPA and CGPA tools',
      },
      {
        title: 'Practice and plan',
        text: 'UniHelp includes CBT practice, Formula Hub, flashcards, tasks, and Smart Timetable to support revision and study planning.',
        link: '/cbt-practice',
        linkLabel: 'Learn about CBT practice',
      },
    ],
    appPath: '/features',
  },
  gpa: {
    title: 'GPA calculator for Nigerian universities',
    intro: 'UniHelp provides a GPA tool for students to calculate semester results from course units and grades. Check your institution’s grading scale when entering results.',
    sections: [
      {
        title: 'Calculate a semester GPA',
        text: 'Enter the courses, unit loads, and grades used by your school to calculate a semester GPA. The calculator is an academic aid; confirm grading rules with your university.',
        link: '/GPA',
        linkLabel: 'Open the GPA calculator',
      },
      {
        title: 'Keep GPA and CGPA distinct',
        text: 'GPA describes a semester’s results. For a cumulative record across semesters, UniHelp provides a separate CGPA tracker.',
        link: '/cgpa-tracker',
        linkLabel: 'See the CGPA tracker',
      },
    ],
    appPath: '/GPA',
  },
  cgpa: {
    title: 'CGPA tracker for Nigerian university students',
    intro: 'Record semester results and review your cumulative academic progress with the UniHelp CGPA tracker.',
    sections: [
      {
        title: 'Save semester records',
        text: 'The tracker lets signed-in students add CGPA records to their account and review progress over time. Your records are account data and are not public.',
        link: '/CGPA',
        linkLabel: 'Open the CGPA tracker',
      },
      {
        title: 'Use your university’s grading rules',
        text: 'Academic grading systems vary. Enter results using your institution’s rules and check important calculations against your official transcript.',
        link: '/GPA',
        linkLabel: 'Open the GPA calculator',
      },
    ],
    appPath: '/CGPA',
  },
  cbt: {
    title: 'CBT practice for university students',
    intro: 'Use UniHelp CBT practice to work through available exam materials and quizzes as part of your revision routine.',
    sections: [
      {
        title: 'Practice with available materials',
        text: 'The CBT area provides practice using materials available in UniHelp. Coverage depends on the questions and quizzes provided in the app.',
        link: '/past-questions',
        linkLabel: 'Explore past-question resources',
      },
      {
        title: 'Review and keep studying',
        text: 'Pair practice with lecture notes, Formula Hub, and flashcards. Check course requirements and official materials for your school when preparing for an exam.',
        link: '/academic-tools',
        linkLabel: 'Browse academic tools',
      },
    ],
    appPath: '/cbt-practice',
  },
  pastQuestions: {
    title: 'University past questions and study resources',
    intro: 'UniHelp gives students a place to find available past questions and lecture notes shared for study and revision.',
    sections: [
      {
        title: 'Find materials for your course',
        text: 'Browse study resources and use the school, course, year, or other filters available in the app. Results depend on materials contributed to UniHelp.',
        link: '/resources',
        linkLabel: 'Open study resources',
      },
      {
        title: 'Use resources responsibly',
        text: 'Past questions can help you practise, but they do not replace current course guidance or official instructions from your university.',
        link: '/cbt-practice',
        linkLabel: 'Learn about CBT practice',
      },
    ],
    appPath: '/resources',
  },
  aiTutor: {
    title: 'AI study assistance for university students',
    intro: 'UniHelp AI Assistance offers guided support for study questions and coursework. Use it to explore a topic, then verify important answers with trusted course materials.',
    sections: [
      {
        title: 'Ask for help with coursework',
        text: 'Signed-in users can submit study questions to UniHelp AI Assistance. The response is generated support, not a substitute for your instructor or authoritative references.',
        link: '/ai',
        linkLabel: 'Open UniHelp AI Assistance',
      },
      {
        title: 'Study with your learning materials',
        text: 'UniHelp also provides lecture notes, past-question resources, and Formula Hub for students who want to review course topics.',
        link: '/academic-tools',
        linkLabel: 'Explore academic tools',
      },
    ],
    appPath: '/ai',
  },
  community: {
    title: 'Student communities for Nigerian universities',
    intro: 'UniHelp groups give students a place to connect around campus and take part in shared discussions.',
    sections: [
      {
        title: 'Join student groups',
        text: 'Sign in to find and participate in groups. Group availability and membership depend on the communities available in UniHelp.',
        link: '/community',
        linkLabel: 'Open student communities',
      },
      {
        title: 'Keep conversations in your account',
        text: 'Community activity and messages are account-based. UniHelp does not publish private conversations as public pages.',
        link: '/student-chat',
        linkLabel: 'Learn about student chat',
      },
    ],
    appPath: '/community',
  },
  chat: {
    title: 'Private student chat and messaging | UniHelp',
    intro: 'UniHelp messaging helps signed-in students connect in direct conversations and groups. Messages are part of the private app experience.',
    sections: [
      {
        title: 'Connect with classmates',
        text: 'Use UniHelp messages to reach students and take part in group conversations. Access requires a UniHelp account.',
        link: '/messages',
        linkLabel: 'Open UniHelp messages',
      },
      {
        title: 'Explore student groups',
        text: 'Groups provide a shared space for student conversations and community activity inside UniHelp.',
        link: '/student-community',
        linkLabel: 'Learn about student communities',
      },
    ],
    appPath: '/messages',
  },
  marketplace: {
    title: 'Student marketplace in Nigeria | UniHelp',
    intro: 'UniHelp’s student marketplace lets signed-in students browse and create listings for items within the student community.',
    sections: [
      {
        title: 'Browse student listings',
        text: 'Marketplace listings can include item details, price, location, condition, availability, and seller contact information. Review listing details and make your own safety checks before arranging a transaction.',
        link: '/studentmarketplace',
        linkLabel: 'Open the student marketplace',
      },
      {
        title: 'Create a listing',
        text: 'Students can create listings from the marketplace after signing in. Listing availability and access depend on the current app experience.',
        link: '/register',
        linkLabel: 'Create a UniHelp account',
      },
    ],
    appPath: '/studentmarketplace',
  },
}

export const publicGuideRoutes = [
  { path: '/academic-tools', guide: 'academic' },
  { path: '/gpa-calculator', guide: 'gpa' },
  { path: '/cgpa-tracker', guide: 'cgpa' },
  { path: '/university-cbt-practice', guide: 'cbt' },
  { path: '/past-questions', guide: 'pastQuestions' },
  { path: '/ai-tutor', guide: 'aiTutor' },
  { path: '/student-community', guide: 'community' },
  { path: '/student-chat', guide: 'chat' },
  { path: '/student-marketplace', guide: 'marketplace' },
]
