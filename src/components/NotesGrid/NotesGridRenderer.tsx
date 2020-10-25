import React, {
  createRef,
  useCallback,
  useRef,
  useState,
  useContext,
  useEffect,
} from 'react'
import {
  Channel,
  Note,
  ChannelRenderEvent,
  SoundfontProviderContextValue,
} from '../../types/SoundFontProvider.types'
import Loader from '../shared/loader/Loader'
import { flatMap } from 'lodash'
import { SoundfontProviderContext } from '../../providers/SoundfontProvider'
import { useNotesGridController } from './NotesGridController'

import { RECT_WIDTH, RECT_SPACE, RECT_TIME, RECORDING_BAR_COLOR, BAR_COLOR, BAR_WIDTH, REC_TIME, RECT_COLOR, CANVAS_HEIGHT, CANVAS_BACKGROUND } from './constants'
import { ICoordinates, TRecordingGrid } from './NotesGrid.types'

const canvasStyle = {
  background: 'rgba(4,32,55,0.7)',
}
let rectangleHeight = 30


interface IController {
  recording: boolean;
  playing: boolean;
  resetRecording: boolean;
}
interface IControllerInput {
  recording?: boolean;
  playing?: boolean;
  resetRecording?: boolean;
}
export interface INotesGridRendererProps {
  channels: Channel[];
  currentChannel: Channel | null;
  channelColor: string
  controller: IController;
  setController: (ctrl: IControllerInput) => void;
  notes: Note[];
  midiOffset: number;
  noteDuration: number;
  recording: {
    currentTime: number;
  };
  absTime: number;
  recordingGrid: TRecordingGrid
  setRecordingGrid: (gridInput: TRecordingGrid) => void;
}

interface ICanvasSettings {
  notesListWidth: number
}


function NotesGridRenderer(props: INotesGridRendererProps) : JSX.Element {

  const {
    channels,
    currentChannel,
    controller,
    setController,
    notes,
    midiOffset,
    noteDuration,
    recording,
    setRecordingGrid,
    recordingGrid,
    channelColor
  } = props
  const canvasRef = createRef<HTMLCanvasElement>()
  const canvasBoxRef = createRef<HTMLDivElement>()
  const compositionDuration = useRef<number>(0)
  const timers = useRef<Array<number>>([])
  const recordingTimers = useRef<Array<number>>([])
  const coordinatesMapRef = useRef<Array<ICoordinates>>([])
  const [recordingTimesRemained, setRecordingTimesRemained] = 
    useState<Array<number>>([])
  const [canvasTimeUnit, setCanvasTimeUnit] = useState(RECT_TIME)
  const [lastRectangle, setLastRectangle] = useState(0)

  const soundfontCtx = useContext<SoundfontProviderContextValue>(
    SoundfontProviderContext
  )

  const { loading } = soundfontCtx

  const canvasSettings = useRef<ICanvasSettings>({
    notesListWidth: 0,
  })
  const { toggleNote } = useNotesGridController({
    canvasBoxRef,
    coordinatesMapRef,
    rectangleHeight,
    canvasTimeUnit,
    currentChannel,
    setRecordingGrid,
    offsetFirst: canvasSettings.current.notesListWidth,
    recordingGrid
  })

  const canvasSetup = useCallback((timer?: number) => {
    const { current: canvasElement } = canvasRef
    const { current: canvasBoxElement } = canvasBoxRef
    if (!canvasElement || !canvasBoxElement) {
      return
    }
    const canvasCtx = canvasElement?.getContext('2d')
    if (!canvasCtx) {
      return
    }

    const maxDuration = channels.reduce(
      (acc, curr) => (curr.duration > acc ? curr.duration : acc),
      0
    ) // find longest duration
    if (controller.recording && timer) {
      compositionDuration.current = timer// for recording
    } else {
      compositionDuration.current = maxDuration // for playing
    }
    // wierd calculation of canvas width
    const xLength =
      compositionDuration.current * canvasTimeUnit + 5 <
        window.innerWidth / (RECT_WIDTH + RECT_SPACE)
        ? window.innerWidth / (RECT_WIDTH + RECT_SPACE)
        : compositionDuration.current * canvasTimeUnit + 5

    canvasElement.width = xLength * (RECT_WIDTH + RECT_SPACE)
    canvasElement.height = canvasBoxElement.getBoundingClientRect().height - 25
    rectangleHeight =
      (canvasElement.height - RECT_SPACE * notes.length) / notes.length
    const fontSize = rectangleHeight * 0.6

    canvasSettings.current.notesListWidth = (fontSize + 5)
    return {
      canvasBoxElement,
      canvasElement,
      canvasCtx,
      xLength,
      fontSize
    }

  }, [canvasRef, canvasBoxRef, channels, controller.recording, canvasTimeUnit, notes.length])

  const renerEmptyCanvas = useCallback((canvasCtx, fontSize, xLength) => {
    const { notesListWidth } = canvasSettings.current
    coordinatesMapRef.current = []
    const { current: coordinatesMap } = coordinatesMapRef
    // draw notes to canvas
    const calculateFontYPosition = (i: number) => {
      return ((rectangleHeight / 1.3)) + (i * ((rectangleHeight + RECT_SPACE)))
      // return rectangleHeight / fontSize + 2 +
      // fontSize +
      // i * (rectangleHeight + rectangleHeight / (fontSize * 2.5))
    }
    // eslint-disable-next-line array-callback-return
    notes.filter((note: Note, i: number): void => {
      for (let j = 0; j < xLength; j++) {
        const x = j * RECT_WIDTH + notesListWidth + RECT_SPACE * j
        const y = i * rectangleHeight + RECT_SPACE * i
        if (j === 0) {
          canvasCtx.fillStyle = '#fff' //fontColor
          canvasCtx.font = `${fontSize}px Comic Sans MS`
          canvasCtx.fillText(
            note.note,
            5,
            calculateFontYPosition(i)
          )
          canvasCtx.fillStyle = CANVAS_BACKGROUND
          canvasCtx.fillRect(0, (calculateFontYPosition(i) + 6), RECT_WIDTH + notesListWidth, RECT_SPACE) // horizontal border
          canvasCtx.fillRect(RECT_WIDTH + notesListWidth, i * (rectangleHeight + RECT_SPACE), RECT_SPACE, rectangleHeight + RECT_SPACE) // vertical border
        } else {
          canvasCtx.fillStyle = RECT_COLOR
          canvasCtx.fillRect(x, y, RECT_WIDTH, rectangleHeight)
          canvasCtx.fillStyle = CANVAS_BACKGROUND
          canvasCtx.fillRect(x + RECT_WIDTH + RECT_SPACE, y, RECT_SPACE, rectangleHeight) // fill vertical spaces
          canvasCtx.fillRect(x, y + rectangleHeight + RECT_SPACE, RECT_WIDTH, RECT_SPACE) // fill horizontal spaces
          coordinatesMap.push({ midiNumber: note.midiNumber, x, y })
        }
      }
    })
  }, [notes])

  const renderTimerBar = useCallback((timer: number, canvasCtx: CanvasRenderingContext2D, 
    canvasElement: HTMLCanvasElement, canvasBoxElement: HTMLDivElement) => {
    const { notesListWidth } = canvasSettings.current
    const x =
      RECT_WIDTH +
      Math.floor(timer * RECT_WIDTH * canvasTimeUnit) +
      notesListWidth
    canvasCtx.fillStyle = controller.recording
      ? RECORDING_BAR_COLOR
      : BAR_COLOR
    canvasCtx.fillStyle = controller.playing
      ? BAR_COLOR
      : RECORDING_BAR_COLOR
    canvasCtx.clearRect(x, 0, BAR_WIDTH, canvasElement.height)
    canvasCtx.fillRect(x, 0, BAR_WIDTH, canvasElement.height)
    setLastRectangle(x)
    if (x >= canvasBoxElement.getBoundingClientRect().width - 200) {
      const y = 300
      canvasBoxElement.scroll(x + 100, y)
    }
  }, [canvasTimeUnit, controller.playing, controller.recording])

  const renderNotes = useCallback((joinedEvents: ChannelRenderEvent[], 
      canvasElement: HTMLCanvasElement, canvasCtx: CanvasRenderingContext2D) => {
    const { notesListWidth } = canvasSettings.current
console.log(joinedEvents, 'ji')
    joinedEvents.forEach((event, i) => {
      const x =
        RECT_WIDTH +
        Math.floor(compositionDuration.current * RECT_WIDTH * canvasTimeUnit) +
        notesListWidth
      const y =
        Math.floor(
          canvasElement.height -
          ((event.midiNumber - midiOffset) * rectangleHeight +
            RECT_SPACE * (event.midiNumber - midiOffset))
        ) -
        (rectangleHeight + RECT_SPACE)
      const width = Math.floor(
        event.duration * RECT_WIDTH * canvasTimeUnit
      )
      canvasCtx.fillStyle = event.color ? event.color : channelColor
      canvasCtx.clearRect(x, y, width, rectangleHeight)
      canvasCtx.fillRect(x, y, width, rectangleHeight)
    })

  }, [canvasTimeUnit, channelColor, midiOffset])

  const drawInitial = useCallback(
    (timer?: number) => {
      const settings = canvasSetup(timer)
      console.log(settings)
      if (!settings) {
        return
      }
      const { canvasCtx, canvasBoxElement, canvasElement, xLength, fontSize } = settings

      const joinedEvents = flatMap(channels, (channel: Channel) =>
        channel.notes.map((note) => ({ ...note, color: channel.color }))
      ) // join notes from all channels into a single array, + add a color field

      renerEmptyCanvas(canvasCtx, fontSize, xLength)
      if (joinedEvents.length > 0) {
        renderNotes(joinedEvents, canvasElement, canvasCtx)
      }
      if (timer) {
        renderTimerBar(timer, canvasCtx, canvasElement, canvasBoxElement)
      }
      if (lastRectangle && !timer) {
        canvasCtx.fillStyle = controller.recording
          ? RECORDING_BAR_COLOR
          : BAR_COLOR
        canvasCtx.fillStyle = controller.playing
          ? BAR_COLOR
          : RECORDING_BAR_COLOR
        canvasCtx.fillRect(lastRectangle, 0, BAR_WIDTH, canvasElement.height)
      }
    },
    [canvasSetup, channels, renerEmptyCanvas, lastRectangle, renderNotes, 
      renderTimerBar, controller.recording, controller.playing]
  )


  // stop play rendering
  const stopPlayRender = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t))
    setLastRectangle(0)
  }, [])
  // play rendering
  const renderPlay = useCallback(() => {
    if (controller.playing) return
    for (let i = 0; i < compositionDuration.current; i += 0.05 / canvasTimeUnit) {
      const t = window.setTimeout(() => {
        const count = i
        drawInitial(count)
      }, Math.ceil(i * 1000))
      timers.current = [...timers.current, t]
    }
    window.setTimeout(() => stopPlayRender(), compositionDuration.current * 1000)
  }, [
    canvasTimeUnit,
    compositionDuration,
    controller.playing,
    drawInitial,
    stopPlayRender,
  ])
  //
  const showRecordingBar = useCallback(() => {
    const timesRemained = []
    for (let i = 0; i < REC_TIME; i += 0.05 / canvasTimeUnit) {
      timesRemained.push(i)
      const t = window.setTimeout(() => {
        drawInitial(i)
      }, Math.floor(i * 1000))
      recordingTimers.current = [...recordingTimers.current, t]
    }
    setRecordingTimesRemained(timesRemained)
  }, [canvasTimeUnit, drawInitial, setRecordingTimesRemained])

  const stopRecordingBar = useCallback(
    (pause) => {
      const { currentTime } = recording
      recordingTimers.current.forEach((t) => clearTimeout(t))
      if (!pause) setLastRectangle(0)
      drawInitial(currentTime)
    },
    [drawInitial, recording]
  )

  const resetRec = useCallback(() => {
    setRecordingTimesRemained([])
  }, [setRecordingTimesRemained])

  const resumeRec = useCallback(() => {
    let start = null
    const { currentTime } = recording
    for (let i = 0; i < recordingTimesRemained.length; i++) {
      if (recordingTimesRemained[i] < currentTime) continue
      if (!start) start = recordingTimesRemained[i]
      const t = window.setTimeout(() => {
        drawInitial(recordingTimesRemained[i])
      }, Math.floor((recordingTimesRemained[i] - start) * 1000))
      recordingTimers.current.push(t)
    }
  }, [drawInitial, recording, recordingTimesRemained])

  useEffect(() => {
    if (currentChannel) {
      drawInitial()
    }
  }, [currentChannel, drawInitial])

  useEffect(() => {
    const { playing, recording, resetRecording } = controller
    if (playing) {
      renderPlay()
    } else if (!playing) {
      stopPlayRender()
    } else if (recording && resetRecording) {
      showRecordingBar()
      setController({
        resetRecording: false,
      })
    } else if (recording && !resetRecording) {
      resumeRec()
    } else if (!recording) {
      stopRecordingBar(true)
    } else if (!resetRecording) {
      stopRecordingBar(false)
      resetRec()
    }
  }, [
    controller,
    renderPlay,
    resumeRec,
    showRecordingBar,
    stopPlayRender,
    stopRecordingBar,
    resetRec,
    setController,
  ])

  useEffect(() => {
    setCanvasTimeUnit(1 / noteDuration)
  }, [noteDuration])
  useEffect(() => {
    drawInitial()
  }, [drawInitial])

  const createCanvas = useCallback(
    () =>
      <div ref={canvasBoxRef} style={{ height: CANVAS_HEIGHT, background: CANVAS_BACKGROUND }}>
        <canvas
          id="canvas"
          ref={canvasRef}
          style={canvasStyle}
          onClick={toggleNote}
        />
      </div>
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

export default NotesGridRenderer
