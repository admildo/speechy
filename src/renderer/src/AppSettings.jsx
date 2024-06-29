import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useState,useRef,useEffect } from 'react'
import { Play,Pause,Setting2,Image,Notepad,Sound } from 'iconsax-react';


const PauseAudio = ({element})=>{

  const handle = ()=>{
    element.current.pause()
  }
  return (<>
   <button onClick={handle} className='bg-white mb-3 cursor-pointer w-[24px] h-[24px] rounded-[100%]  flex flex-row justify-center items-center'>
 <Pause size="18" color="rgb(17 24 39)"/>
  </button>
  </>)
}

const PlayAudio = ({element,handlePlay,togglePlayer,status})=>{

  const handle = ()=>{
    togglePlayer()
   if(element.current.duration>0){
    if(status){
      element.current.pause()
    }else{
      element.current.play()
    }
   }else{
    
     handlePlay()
   }
  }
  return (<>
   <button onClick={handle} className='bg-white mb-3 cursor-pointer w-[24px] h-[24px] rounded-[100%] flex flex-row justify-center items-center'>
{status? <Pause size="18" color="rgb(17 24 39)"/>: <Play size="18" color="rgb(17 24 39)"/>}
  </button>
  </>)
}


function AppSettings() {
  


  return (
    <>

<h1>Hello world</h1>
    
    </>
  )
}

export default AppSettings

