import React, {
  createRef,
  useCallback,
  useRef,
  useState,
  useContext,
  useEffect,
  RefObject,
  useMemo,
  ComponentType
} from 'react'
import {
  Channel,
  Note,
  PlayEvent,
  SoundfontProviderContextValue,
} from '../../types/SoundFontProvider.types'
import Loader from '../shared/loader/Loader'
import { flatMap, isEqual } from 'lodash'
import { SoundfontProviderContext } from '../../providers/SoundfontProvider'
import { useAudioPlayer } from '../controllers/AudioPlayer'

const canvasStyle = {
  background: 'rgba(4,32,55,0.7)',
}
let rectHeight = 30
const RECT_WIDTH = 30
const RECT_HEIGHT = 30
const RECT_SPACE = 0.5
const RECT_COLOR = 'rgba(4,32,55,1)'
const RECT_TIME = 5
const BAR_COLOR = '#d13a1f'
const RECORDING_BAR_COLOR = '#a0cf33'
const BAR_WIDTH = 4
const REC_TIME = 180

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
  recordingGrid: {
    events: PlayEvent[];
    currentTime: number;
  };
  setRecordingGrid: (gridInput: Record<string, unknown>) => void;
}

interface ICoordinates {
  midiNumber: number;
  x: number;
  y: number;
}

function NotesGridRenderer(props: INotesGridRendererProps) {

  const {
    channels,
    currentChannel,
    controller,
    setController,
    notes,
    midiOffset,
    noteDuration,
    recording,
    absTime,
    setRecordingGrid,
    recordingGrid,
    channelColor
  } = props
  const canvasRef = createRef<HTMLCanvasElement>()
  const canvasBoxRef = createRef<HTMLDivElement>()
  const [compositionDuration, setCompositionDuration] = useState(0)
  const timers = useRef<Array<number>>([])
  const offsetFirstRef = useRef<number>(0)
  const recordingTimers = useRef<Array<number>>([])
  const [recordingTimesRemained, setRecordingTimesRemained] = useState<
    Array<number>
  >([])
  const [canvasTimeUnit, setCanvasTimeUnit] = useState(RECT_TIME)
  const [offsetFirst, setoffsetFirst] = useState(0)
  const coordinatesMapRef = useRef<Array<ICoordinates>>([])
  const [lastRectangle, setLastRectangle] = useState(0)
  const soundfontCtx = useContext<SoundfontProviderContextValue>(
    SoundfontProviderContext
  )
  const { loading } = soundfontCtx
  const { playNote } = useAudioPlayer()
  const drawInitial = useCallback(
    (timer?: number) => {
      const { current: canvasElement } = canvasRef 
      const { current: canvasBoxElement } = canvasBoxRef 
      if(!canvasElement || !canvasBoxElement){
        return
      }
      const canvasCtx = canvasElement?.getContext('2d')
      if(!canvasCtx){
        return
      }
      const joinedEvents = flatMap(channels, (channel: Channel) =>
        channel.notes.map((note) => ({ ...note, color: channel.color }))
      ) // join notes from all channels into a single array, + add a color field
      const maxDuration = channels.reduce(
        (acc, curr) => (curr.duration > acc ? curr.duration : acc),
        0
      ) // find longest duration
      if (controller.recording && timer) {
        setCompositionDuration(timer) // for recording
      } else {
        setCompositionDuration(maxDuration) // for playing
      }
      // wierd calculation of canvas width
      const xLength =
        compositionDuration * canvasTimeUnit + 5 <
        window.innerWidth / (RECT_WIDTH + RECT_SPACE)
          ? window.innerWidth / (RECT_WIDTH + RECT_SPACE)
          : compositionDuration * canvasTimeUnit + 5
   
      canvasElement.width = xLength * (RECT_WIDTH + RECT_SPACE)
      canvasElement.height = canvasBoxElement.getBoundingClientRect().height - 25
      rectHeight =
        (canvasElement.height - RECT_SPACE * notes.length) / notes.length
      const fontSize = rectHeight * 0.8
      offsetFirstRef.current = fontSize
      const { current: offsetFirst} = offsetFirstRef
      coordinatesMapRef.current = []
      const { current: coordinatesMap } = coordinatesMapRef
      // draw notes to canvas
      notes.filter((note, i) => {
        for (let j = 0; j < xLength; j++) {
          const x = j * RECT_WIDTH + offsetFirst + RECT_SPACE * j
          const y = i * rectHeight + RECT_SPACE * i
          if (j === 0) {
            canvasCtx.fillStyle = 'white'
            canvasCtx.font = `${fontSize}12px Arial`
            canvasCtx.fillText(
              note.note,
              3,
              rectHeight / fontSize / 2 +
                fontSize +
                i * (rectHeight + rectHeight / (fontSize * 2.6))
            )
          } else {
            canvasCtx.fillStyle = RECT_COLOR
            canvasCtx.fillRect(x, y, RECT_WIDTH, rectHeight)
            coordinatesMap.push({ midiNumber: note.midiNumber, x, y })
          }
        }
      })
      // ?
      if (joinedEvents.length > 0) {
        joinedEvents.forEach((event, i) => {
          const x =
            RECT_WIDTH +
            Math.floor(compositionDuration * RECT_WIDTH * canvasTimeUnit) +
            offsetFirst
          const y =
            Math.floor(
              canvasElement.height -
                ((event.midiNumber - midiOffset) * rectHeight +
                  RECT_SPACE * (event.midiNumber - midiOffset))
            ) -
            (rectHeight + RECT_SPACE)
          const width = Math.floor(
            event.duration * RECT_WIDTH * canvasTimeUnit
          )
          canvasCtx.fillStyle = event.color ? event.color : channelColor
          canvasCtx.clearRect(x, y, width, rectHeight)
          canvasCtx.fillRect(x, y, width, rectHeight)
        })
      }
      // ?
      // this.eventsRect.forEach(eventRect => {
      //     canvasCtx.fillStyle = RECT_COLOR
      //     canvasCtx.clearRect(eventRect.x, eventRect.y, RECT_WIDTH, canvasHeight);
      //     canvasCtx.fillRect(eventRect.x, eventRect.y, RECT_WIDTH, canvasHeight);
      // })
      // fills playing or recording bar
      if (timer) {
        const x =
          RECT_WIDTH +
          Math.floor(timer * RECT_WIDTH * canvasTimeUnit) +
          offsetFirst
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
    [canvasRef, canvasBoxRef, channels, controller.recording, controller.playing, compositionDuration, canvasTimeUnit, notes, lastRectangle, midiOffset, channelColor]
  )
// stop play rendering
  const stopPlayRender = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t))
    setLastRectangle(0)
  }, [])
// play rendering
  const renderPlay = useCallback(() => {
    if (controller.playing) return
    for (let i = 0; i < compositionDuration; i += 0.05 / canvasTimeUnit) {
      const t = window.setTimeout(() => {
        const count = i
        drawInitial(count)
      }, Math.ceil(i * 1000))
      timers.current = [...timers.current, t]
    }
    window.setTimeout(() => stopPlayRender(), compositionDuration * 1000)
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
    [ drawInitial, recording]
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

  const showCoords = useCallback(
    (event) => {
      const { current: canvasBoxElement } = canvasBoxRef 
      if(!canvasBoxElement){
        return
      }
      const x = event.clientX + canvasBoxElement.scrollLeft
      const y =
        event.clientY - (canvasBoxElement.getBoundingClientRect().top + 10)
        const { current: coordinatesMap } = coordinatesMapRef
      const rect = coordinatesMap.find(
        (i) =>
          x >= i.x &&
          x <= i.x + RECT_WIDTH &&
          y >= i.y &&
          y <= i.y + rectHeight
      )
      if (!rect) return
      if (rect.x >= canvasBoxElement.getBoundingClientRect().top) {
        canvasBoxElement.scroll(rect.x + 100, rect.y)
      }

      const lastEvent = {
        midiNumber: rect.midiNumber,
        time: (rect.x - RECT_WIDTH - offsetFirst) / RECT_WIDTH / canvasTimeUnit,
        duration: 1 / canvasTimeUnit,
      }
      if (
        !currentChannel ||
        currentChannel.notes.findIndex(
          (e) =>
            isEqual(e.midiNumber, lastEvent.midiNumber) &&
            e.time === lastEvent.time
        ) === -1
      ) {
        playNote(lastEvent)
        setRecordingGrid({
          events: currentChannel
            ? currentChannel.notes.concat(lastEvent)
            : [lastEvent],
          currentTime:
            lastEvent.time + lastEvent.duration > recordingGrid.currentTime
              ? lastEvent.time + lastEvent.duration
              : recordingGrid.currentTime,
        })
      } else {
        const duplicate = currentChannel.notes.findIndex(
          (e) =>
            isEqual(e.midiNumber, lastEvent.midiNumber) &&
            e.time === lastEvent.time
        )
        if (duplicate !== -1 && currentChannel.notes.length > 0) {
          let lastTime = 0
          currentChannel.notes.splice(duplicate, 1)
          currentChannel.notes.forEach((e) => {
            if (lastTime < e.time) lastTime = e.time
          })
          setRecordingGrid({
            events: currentChannel.notes,
            currentTime:
              lastEvent.time + lastEvent.duration >= recordingGrid.currentTime
                ? lastTime + 1 / canvasTimeUnit
                : recordingGrid.currentTime,
          })
        }
      }
      drawInitial()
    },
    [canvasBoxRef, canvasTimeUnit, coordinatesMapRef, currentChannel, drawInitial, offsetFirst, playNote, recordingGrid.currentTime, setRecordingGrid]
  )

  useEffect(() => {
    if (currentChannel) {
      drawInitial()
    }
  }, [ currentChannel, drawInitial])

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
  }, [ drawInitial])

  const createCanvas = useCallback(
    () => 
    <div ref={canvasBoxRef} style={{ height: 700}}>
      <canvas
          id="canvas"
          ref={canvasRef}
          style={canvasStyle}
          onClick={showCoords}
        />
        </div>
    ,
    [canvasRef, canvasBoxRef, showCoords],
  )
  return (
    <div>
      {loading ? 
        <Loader />
       : createCanvas() }
    </div>
  )
}

export default NotesGridRenderer
