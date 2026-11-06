import { ArrowRight, BookOpen, Bot, Calculator, MessageCircle, ShoppingBag, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.zenithdev.unihelp'

const guides = [
  { title: 'Academic tools', text: 'Study resources, GPA and CGPA tools, CBT practice, Formula Hub, and planning features.', href: '/academic-tools', icon: BookOpen },
  { title: 'AI study assistance', text: 'Get guided support for study questions and coursework, then verify important answers.', href: '/ai-tutor', icon: Bot },
  { title: 'Student community', text: 'Find UniHelp groups and connect with classmates through account-based conversations.', href: '/student-community', icon: Users },
  { title: 'Student marketplace', text: 'Browse campus listings and connect with student sellers through the app.', href: '/student-marketplace', icon: ShoppingBag },
]

export default function PublicHome() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase text-indigo-600">For Nigerian university students</p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">UniHelp: Nigeria&apos;s Student Super App</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Bring study resources, academic tools, AI study assistance, and student services into one place. UniHelp is built for university students who want practical support for studying and campus life.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                Get started <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link to="/features" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                Explore features
              </Link>
              <a href={playStoreUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                Get the Android app
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">Create an account to use tools that save your study records or connect you with other students.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Calculator className="text-indigo-600" size={24} aria-hidden="true" />
              <h2 className="mt-4 text-lg font-black">Academic tools</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">GPA and CGPA tools, study resources, CBT practice, and Formula Hub.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Bot className="text-indigo-600" size={24} aria-hidden="true" />
              <h2 className="mt-4 text-lg font-black">AI study help</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Guided support for coursework and study questions.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <MessageCircle className="text-indigo-600" size={24} aria-hidden="true" />
              <h2 className="mt-4 text-lg font-black">Student connections</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Groups and private messaging for signed-in students.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <ShoppingBag className="text-indigo-600" size={24} aria-hidden="true" />
              <h2 className="mt-4 text-lg font-black">Campus marketplace</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Student listings for campus buying and selling.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black sm:text-4xl">Study and manage campus life with less friction</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Finding course materials, keeping track of grades, preparing for tests, and staying connected can involve several separate tools. UniHelp brings these student features together while keeping personal records and conversations inside your account.
          </p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {guides.map(({ title, text, href, icon: Icon }) => (
            <Link key={href} to={href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <Icon size={22} className="text-indigo-600" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-black">{title}</h3>
              <p className="mt-2 leading-6 text-slate-600">{text}</p>
              <span className="mt-4 inline-flex items-center gap-2 font-bold text-indigo-600">Learn more <ArrowRight size={16} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-black">Start using UniHelp</h2>
            <p className="mt-2 text-slate-600">Sign up to access student tools and account-based features.</p>
          </div>
          <Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
            Create your account <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  )
}
