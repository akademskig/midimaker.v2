import React from 'react'
import SoundfontProvider from '../providers/SoundfontProvider'
import NotesGrid from '../components/NotesGrid'

const NewMidi = () => {

    return (
        <SoundfontProvider>
           <NotesGrid></NotesGrid>
        </SoundfontProvider>
    )
}

export default NewMidi