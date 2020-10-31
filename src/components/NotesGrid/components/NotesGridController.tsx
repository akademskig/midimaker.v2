import { MouseEvent, useCallback } from 'react'
import useAudioPlayer from '../../../controllers/AudioPlayer'
import { useNotesGridRenderer } from './NotesGridRenderer'
import { TChannel } from '../../../providers/SoundfontProvider/SoundFontProvider.types'
import { TRecordingGrid, TSetRecordingGrid } from '../../../providers/AudioStateProvider/AudioStateProvider.types'
import { useAudioController } from '../../../controllers/AudioController'

export interface INotesGridControllerProps {
  canvasTimeUnit: number,
  currentChannel: TChannel | null,
  setRecordingGrid: TSetRecordingGrid
  offsetFirst: number,
  recordingGrid: TRecordingGrid
}

export interface INotesGridController {
  toggleNote: (event: MouseEvent<HTMLCanvasElement, globalThis.MouseEvent>) => void
}

function NotesGridController(): INotesGridController {
  const { playNote } = useAudioPlayer()
  const { findNoteByGridCoordinates } = useNotesGridRenderer()
  const { handleToggleNote } = useAudioController()

  const toggleNote = useCallback(
    (event) => {
      const note = findNoteByGridCoordinates(event)
      if(!note){
        return
      }
      playNote(note)

      handleToggleNote(note)
    },
    [findNoteByGridCoordinates, playNote, handleToggleNote]
  )
  return {
    toggleNote
  }
}

export default NotesGridController

export function useNotesGridController(): INotesGridController {
  return NotesGridController()
}