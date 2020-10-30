
import React, { useCallback, useContext } from 'react'
import Loader from '../shared/loader/Loader'
import { SoundfontProviderContext } from '../../providers/SoundfontProvider/SoundfontProvider'
import { useNotesGridController } from './components/NotesGridController'
import { useNotesGridRenderer } from './components/NotesGridRenderer'
import { CANVAS_BACKGROUND, CANVAS_HEIGHT } from './constants'
import { SoundfontProviderContextValue } from '../../providers/SoundfontProvider/SoundFontProvider.types'
import styled from 'styled-components'

const canvasStyle = {
    background: 'rgba(4,32,55,0.7)',
}

const SNotesGrid = styled.div`
    cursor: pointer;
`

function NotesGrid(): JSX.Element {
    const soundfontCtx = useContext<SoundfontProviderContextValue>(
        SoundfontProviderContext
    )
    const { canvasRef, canvasBoxRef } = useNotesGridRenderer()
    const { loading } = soundfontCtx
    const { toggleNote } = useNotesGridController()

    const createCanvas = useCallback(
        () =>
            <SNotesGrid ref={canvasBoxRef} style={{ height: CANVAS_HEIGHT, background: CANVAS_BACKGROUND }}>
                <canvas
                    id="canvas"
                    ref={canvasRef}
                    style={canvasStyle}
                    onClick={toggleNote}
                />
            </SNotesGrid>
        ,
        [canvasBoxRef, canvasRef, toggleNote]
    )
    return (
        <div>
            {loading ?
                <Loader />
                : createCanvas()}
        </div>
    )
}

export default NotesGrid