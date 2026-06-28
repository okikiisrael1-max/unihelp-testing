import React from 'react'
import PastQuestions from '../components/PastQuestions'
import { Link } from 'react-router-dom';
import { PlusCircleIcon } from 'lucide-react';

const Question = ({dark}) => {
  return (
    <div className='relative w-full p-5 mt-10 md:mt-20'>
      <PastQuestions dark={dark}/>
      <Link className='fixed cursor-pointer p-3 bg-indigo-500 rounded-full text-white right-4 bottom-30' to={'/uploadquestion'}><PlusCircleIcon size={30}/></Link>
    </div>
  )
}

export default Question
