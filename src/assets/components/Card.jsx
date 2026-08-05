import { ChevronRight } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

const Card = ({title, description, url, icon, background, dark}) => {
  return (
    <Link to={url} className={`flex w-full items-center gap-3 rounded-2xl border p-3 shadow-sm transition hover:shadow-md ${dark ? 'border-slate-700 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50' }`}>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${background} text-white`} >
        {icon}
      </div>
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='text-base font-semibold leading-tight sm:text-lg'>{title}</p>
        <p className='mt-1 text-sm leading-6 opacity-75'>{description}</p>
        <span className={`ml-auto mt-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-white font-extrabold ${background}`}><ChevronRight size={18}/></span>
      </div>
    </Link>
  )
}

export default Card
