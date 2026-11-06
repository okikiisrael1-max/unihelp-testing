import { ArrowRight, BookOpenCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { publicGuides } from '../data/publicGuides'

export default function PublicGuidePage({ guideId, dark = false }) {
  const guide = publicGuides[guideId]
  if (!guide) return null

  const text = dark ? 'text-slate-300' : 'text-slate-600'
  const surface = dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'

  return (
    <>
      <main className={dark ? 'min-h-screen bg-[#070b14] text-white' : 'min-h-screen bg-slate-50 text-slate-950'}>
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <nav aria-label="Breadcrumb" className={`mb-8 text-sm ${text}`}>
            <Link to="/" className="font-semibold text-indigo-500 hover:underline">Home</Link>
            <span aria-hidden="true"> / </span>
            <Link to="/features" className="font-semibold text-indigo-500 hover:underline">Features</Link>
          </nav>

          <header className="max-w-3xl">
            <div className={`mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-sm font-bold ${dark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              <BookOpenCheck size={16} aria-hidden="true" />
              UniHelp student guide
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">{guide.title}</h1>
            <p className={`mt-5 text-base leading-7 sm:text-lg sm:leading-8 ${text}`}>{guide.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={guide.appPath} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                Continue in UniHelp <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link to="/register" className={`inline-flex min-h-11 items-center rounded-xl border px-5 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${surface}`}>
                Create an account
              </Link>
            </div>
          </header>

          <div className="mt-12 space-y-4 sm:mt-16">
            {guide.sections.map((section) => (
              <section key={section.title} className={`rounded-2xl border p-5 sm:p-7 ${surface}`}>
                <h2 className="text-xl font-black sm:text-2xl">{section.title}</h2>
                <p className={`mt-3 max-w-3xl leading-7 ${text}`}>{section.text}</p>
                <Link to={section.link} className={`mt-4 inline-flex items-center gap-2 font-bold hover:underline ${dark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                  {section.linkLabel} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </section>
            ))}
          </div>

          <aside className={`mt-8 rounded-2xl border p-5 sm:p-7 ${surface}`}>
            <h2 className="text-xl font-black">Getting started with UniHelp</h2>
            <p className={`mt-3 leading-7 ${text}`}>
              Create an account or sign in to use account-based tools. UniHelp features are designed to support study and campus life; check your institution’s guidance for official academic requirements.
            </p>
            <Link to="/register" className={`mt-4 inline-flex min-h-10 items-center font-bold hover:underline ${dark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              Get started <ArrowRight className="ml-2" size={16} aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </main>
      <Footer dark={dark} />
    </>
  )
}
