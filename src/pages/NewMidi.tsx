import React from 'react'
import SoundfontProvider from '../providers/SoundfontProvider/SoundfontProvider'
import NotesGrid from '../components/NotesGrid/NotesGrid'

const NewMidi = () => {

    return (
        <SoundfontProvider>
           <NotesGrid/>
        </SoundfontProvider>
    )
}

export default NewMidi