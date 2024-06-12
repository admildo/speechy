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


function App() {
  const audioRef = useRef(null)
  const comp = useRef(null)
  const [playing,setPlaying] = useState(false)
  const [isDraggable,setDraggable] = useState(false)
  const [duration,setDuration] = useState(0)
  const [count,setCount] = useState(0)

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  const togglePlayer = async ()=>{
    setPlaying((prev)=>!prev)
  }
 const handleDrag = async ()=>{

  setDraggable((prev)=>!prev)
  if(isDraggable){
    window.api.dragWindow()
  }else{
    window.api.stopDrag()
  }

 }
  const handle = async()=>{
   const res = await window.api.getRequest()

   const audioBlob = new Blob([res], { type: 'audio/mpeg' });
   const audioUrl = URL.createObjectURL(audioBlob);
   audioRef.current.src = audioUrl;
   setPlaying(true)
   audioRef.current.addEventListener('loadedmetadata', () => {
    setDuration(audioRef.current.duration)
   ;
    audioRef.current.play();
   
    console.log(audioRef.current.duration);
  })
   console.log(res)
  }
  
  useEffect(()=>{
    let interval 

    const handlePlay = ()=>{
       interval = setInterval(() => {
        const elapsedTime = audioRef.current.currentTime;
        setDuration(audioRef.current.duration - elapsedTime);
        setCount((prev)=>prev+1)
       
      }, 990)
    }

    const handlePause = ()=>{
      clearInterval(interval)
    }
 
  

    audioRef.current.addEventListener('ended',()=>{
      setPlaying(false)
      handlePause()
    })

    audioRef.current.addEventListener('play',handlePlay)
    audioRef.current.addEventListener('pause',handlePause)
    return () => {
      audioRef.current.removeEventListener('play', handlePlay);
      audioRef.current.removeEventListener('pause', handlePause);
      clearInterval(interval);
    }


  },[])


  useEffect(() => {
    const handleShortcut = async () => {
      audioRef.current.src=""
      console.log('Global shortcut triggered!');
      await handle()
     
    }

   
   
    window.electron.ipcRenderer.on('shortcut-triggered',handleShortcut);

    // Clean up event listener ocn unmount
    return () => {
      window.electron.ipcRenderer.removeListener('shortcut-triggered',handleShortcut)
    }
  }, [])

  useEffect(() => {
    window.electron.ipcRenderer.on('summaryShortcut', async()=>{
       await window.api.getSummary()
        await handle()
    })
  
    return () => {
      window.electron.ipcRenderer.removeListener('summaryShortcut', async()=>{
        await window.api.getSummary()
          await handle()
      })
    }
  }, [])
  


  return (
    <>
    <div className='w-full flex flex-col h-screen '>


<div ref={comp} onClick={()=> handleDrag()} className={'w-[49px] h-[220px] bg-gray-900/90 p-3 rounded-3xl flex flex-col justify-between items-center absolute self-center'}>

  <PlayAudio handlePlay={handle} togglePlayer={togglePlayer} status={playing} element={audioRef}/>

  <span className={'text-bold text-[0.60rem] text-white'}>
   {playing?formatDuration(duration):""}
   {isDraggable}
  </span>


  <button className=' hover:bg-gray-50 mb-3 cursor-pointer w-[24px] h-[24px] rounded-[100%] flex flex-row justify-center items-center'>
  <Image size="18" className='hover:text-black text-white' />
  </button>

  <button className='hover:bg-gray-50 mb-3 cursor-pointer w-[24px] h-[24px] rounded-[100%] flex flex-row justify-center items-center'>
  <Notepad size="18" className='hover:text-black text-white'/>
  </button>

 <button className='hover:bg-gray-50 mb-3 cursor-pointer w-[24px] h-[24px] rounded-[100%] flex flex-row justify-center items-center'>
  <Sound size="18" className='hover:text-black text-white'/>
  </button>

  <button className='hover:bg-gray-50 mb-3 cursor-pointer w-[24px] h-[24px] rounded-[100%] flex flex-row justify-center items-center'>
  <Setting2 size="18" className='hover:text-black text-white'/>
  </button>

  <audio controls ref={audioRef}  hidden/>

</div>

    </div>
    
    </>
  )
}

export default App

