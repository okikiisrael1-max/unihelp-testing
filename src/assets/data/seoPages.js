const siteUrl = 'https://myunihelp.com.ng'
const organization = {
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: 'UniHelp',
  url: `${siteUrl}/`,
  logo: `${siteUrl}/logo.png`,
}
const website = {
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  name: 'UniHelp',
  url: `${siteUrl}/`,
  publisher: { '@id': organization['@id'] },
  inLanguage: 'en-NG',
}

const page = (path, title, description, type = 'WebPage') => {
  const url = `${siteUrl}${path === '/' ? '/' : path}`
  const pageSchema = {
    '@type': type,
    '@id': `${url}#page`,
    name: title,
    headline: title,
    description,
    url,
    inLanguage: 'en-NG',
    isPartOf: { '@id': website['@id'] },
    publisher: { '@id': organization['@id'] },
  }

  if (type === 'SoftwareApplication') {
    Object.assign(pageSchema, {
      applicationCategory: 'EducationalApplication',
      operatingSystem: ['Web', 'Android'],
      installUrl: 'https://play.google.com/store/apps/details?id=com.zenithdev.unihelp',
    })
  }

  const breadcrumb = path === '/' ? [] : [{
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: title, item: url },
    ],
  }]

  return {
  path,
  title,
  description,
  schema: {
    '@context': 'https://schema.org',
    '@graph': [organization, website, pageSchema, ...breadcrumb],
  },
  }
}

export const seoPages = [
  page('/', "UniHelp – Nigeria's Student Super App | Academic Tools & Student Services", 'Discover UniHelp, a student super app designed for Nigerian university students. Access academic tools, CBT practice, past questions, AI tutoring, student communities, and more.', 'SoftwareApplication'),
  page('/about', 'About UniHelp | Student Super App for Nigerian Universities', 'Learn how UniHelp helps Nigerian university students with academic tools, learning resources, campus services, and student communities.'),
  page('/features', 'UniHelp Features | Academic Tools and Student Services', 'Explore UniHelp features including GPA and CGPA tools, study resources, CBT practice, AI assistance, Formula Hub, and student communities.'),
  page('/formula-hub', 'Formula Hub | University Study Formulas by Subject | UniHelp', 'Browse UniHelp Formula Hub for study formulas organized by subject, with related flashcards and learning tools.', 'TechArticle'),
  page('/watch', 'Educational Videos and Study Tutorials | UniHelp', 'Search educational videos and tutorials in UniHelp to support your coursework, revision, and practical learning.'),
  page('/faq', 'UniHelp FAQ | Student App, Study Tools, and Account Help', 'Find answers about UniHelp accounts, academic tools, study resources, marketplace access, Premium, and student communities.'),
  page('/help-center', 'UniHelp Help Center | Account, File, and Payment Support', 'Browse UniHelp guidance for file uploads, downloads, account access, subscriptions, and common technical issues.'),
  page('/privacy', 'UniHelp Privacy Policy | Data and Account Privacy', 'Read how UniHelp handles account information, uploaded content, learning activity, and your privacy choices.'),
  page('/terms', 'UniHelp Terms of Service | Platform Terms', 'Review the terms that apply when using UniHelp academic tools, student services, and community features.'),
  page('/academic-tools', 'Academic Tools for Nigerian University Students | UniHelp', 'Explore UniHelp study resources, GPA and CGPA tools, CBT practice, Formula Hub, and study planning tools for university students in Nigeria.', 'TechArticle'),
  page('/gpa-calculator', 'GPA Calculator for Nigerian Universities | UniHelp', 'Learn how UniHelp helps students calculate semester GPA using course units and grades. Sign in to use the GPA tool and save your academic records.', 'TechArticle'),
  page('/cgpa-tracker', 'CGPA Tracker for Nigerian University Students | UniHelp', 'Track semester results and follow your cumulative GPA progress with UniHelp. Sign in to save and review your CGPA records.', 'TechArticle'),
  page('/university-cbt-practice', 'University CBT Practice for Students | UniHelp', 'Prepare with computer-based test practice in UniHelp. Explore exam materials and sign in to access the CBT practice feature.', 'TechArticle'),
  page('/past-questions', 'University Past Questions and Study Resources | UniHelp', 'Find out how UniHelp connects students with past questions, lecture notes, and course learning materials shared through its study resources.', 'TechArticle'),
  page('/ai-tutor', 'AI Tutor for University Students | UniHelp AI Assistance', 'Use UniHelp AI Assistance for guided help with coursework and study questions. Sign in to access AI support and review answers carefully.', 'TechArticle'),
  page('/student-community', 'Student Community App for Nigerian Universities | UniHelp', 'Connect with fellow students through UniHelp groups and campus discussions. Sign in to discover communities and participate.', 'TechArticle'),
  page('/student-chat', 'Student Chat App for University Communities | UniHelp', 'Use UniHelp messaging to connect with classmates and student groups. Sign in to access private chats and community conversations.', 'TechArticle'),
  page('/student-marketplace', 'Student Marketplace in Nigeria | UniHelp', 'Explore the UniHelp student marketplace for campus buying and selling. Sign in to browse listings and connect with student sellers.', 'TechArticle'),
]

export const seoPageByPath = Object.fromEntries(seoPages.map((entry) => [entry.path, entry]))
export const canonicalUrl = (path) => `${siteUrl}${path === '/' ? '/' : path}`
