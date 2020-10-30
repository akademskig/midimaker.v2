import React from 'react'
import SoundfontProvider from '../providers/SoundfontProvider/SoundfontProvider'
import NotesGrid from '../components/NotesGrid/NotesGrid'
import AudioStateProvider from '../providers/AudioStateProvider/AudioStateProvider'

const NewMidi = () => {
    return (
        <SoundfontProvider>
            <AudioStateProvider>
            <NotesGrid/>
           </AudioStateProvider>
        </SoundfontProvider>
    )
}

export default NewMidi