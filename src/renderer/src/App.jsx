import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useState,useRef,useEffect } from 'react'
import { Play,Pause,Setting2,Image,Notepad,Sound,Lock,VoiceSquare,Box } from 'iconsax-react';


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


export  default function App() {
  const audioRef = useRef(null)
  const comp = useRef(null)
  const [playing,setPlaying] = useState(false)
  const [isDraggable,setDraggable] = useState(false)
  const [duration,setDuration] = useState(0)
  const [count,setCount] = useState(0)
 const [settingsActive,setSettings]= useState(false)
  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  const togglePlayer = async ()=>{
    setPlaying((prev)=>!prev)
  }

  const toggleSettings = async () => {
    window.api.forceRedrawn()
    setSettings((val)=>!val)
    const uiPosition = {width: 615, height: 353, x: 800, y: 230}
    console.log('Sending resize request with position:', uiPosition)
    const uiPosition2 = {width:50,height:229,x:1375,y:270}
    if(settingsActive){
      const result = await window.api.resizeWindow(uiPosition2)
    }else{
      const result = await window.api.resizeWindow(uiPosition)
    }
    window.api.forceRedrawn()
    console.log('Resize request result:', result)
    
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

    <div className='w-full flex flex-col h-screen  justify-center'>
<div className={`${settingsActive?'flex row':'hidden'} w-[88%] h-[350px] bg-transparent shadow-2xl   rounded-xl    transform transition-transform duration-300 ease-in-out`}>

<div className='w-1/3 bg-[#131313] rounded-bl-2xl rounded-tl-2xl   p-2 pt-8 '>
<div className='mb-4 flex row text-gray-300 text-sm items-center rounded-md content-center p-2 hover:bg-gray-600'>
  <Lock size={'17'} className='text-gray-300' />
  <span className='ml-2 text-[0.78rem] '>System keys</span>

</div>

<div className='mb-4 flex row text-gray-300 text-sm items-center rounded-md content-center p-2 hover:bg-gray-600'>
  <Box size={'17'} className='text-gray-300' />
  <span className='ml-2 text-[0.78rem] '>Services</span>

</div>

<div className='mb-4 flex row text-gray-300 text-sm items-center rounded-md content-center p-2 hover:bg-gray-600'>
  <VoiceSquare size={'17'} className='text-gray-300' />
  <span className='ml-2 text-[0.78rem] '>Voices</span>

</div>


</div>

<div className='w-3/4 overflow-scroll rounded-tr-2xl rounded-br-2xl bg-[#181818] border-l-[0.4px] border-gray-800'>
<h1 className='font-bold text-white text-[1rem] p-8 pb-6'>System keys</h1>

<div className='pb-3 pl-8'>
  <h2 className='text-[0.75rem] font-bold mb-4 text-white'>Open AI</h2>
  <input className='w-[90%] outline-[gray] p-2 rounded-md  bg-[#272727] text-gray-400 text-[0.78rem]' placeholder='key' type="password" name="" id="" />

</div>


<div className='pb-3 pl-8 '>
  <h2 className='text-[0.75rem] font-bold mb-4 text-white'>Descript</h2>
  <input className='w-[90%] outline-[gray] p-2 rounded-md  bg-[#272727] text-gray-400 text-[0.78rem]' placeholder='key' type="password" name="" id="" />

</div>

<div className='pb-3 pl-8'>
  <h2 className='text-[0.75rem] font-bold mb-4 text-white'>Eleven Labs</h2>
  <input className='w-[90%] outline-[gray] p-2 rounded-md  bg-[#272727] text-gray-400 text-[0.78rem]' placeholder='key' type="password" name="" id="" />

</div>

</div>



</div>

<div ref={comp}  className={'w-[49px] h-[220px] bg-[#131313] p-3 rounded-3xl flex flex-col justify-between items-center ml-2 absolute self-end'}>

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

  <button  onClick={toggleSettings} className='hover:bg-gray-50 mb-3 cursor-pointer w-[24px] h-[24px] rounded-[100%] flex flex-row justify-center items-center'>
  <Setting2 size="18" className='hover:text-black text-white'/>
  </button>

  <audio controls ref={audioRef}  hidden/>

</div>

    </div>
    
    </>
  )
}



