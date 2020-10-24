import React, { createContext, useCallback, useState, useEffect, useMemo, useRef } from 'react'
import Soundfont, { Player } from 'soundfont-player'
import { flatMap, uniq } from 'lodash'
import appConfig from '../config'
import {
  SoundfontProviderContextValue,
  SoundfontProviderProps,
  SoundfontFormat,
  SoundfontType,
  ICachedInstruments,
  
} from '../types/SoundFontProvider.types'
import { audioContext } from '../globals'


const hostname = appConfig.soundfont.hostname

const initialCtxValue = {
  currentInstrument: null,
  loadInstrument: () => new Promise((resolve) => resolve(null)),
  loading: true,
  cachedInstruments: {},
}

export const SoundfontProviderContext = createContext<SoundfontProviderContextValue>(initialCtxValue)

function SoundfontProvider({
  instrumentName = 'acoustic_grand_piano',
  format = SoundfontFormat.mp3,
  soundfont = SoundfontType.MusingKyte,
  children,
}: SoundfontProviderProps) {
  

  const [currentInstrument, setCurrentInstrument] = useState<Player | null>(null)
  const [cachedInstruments, setCachedInstruments] = useState<ICachedInstruments>({})
  // const activeAudioNodes = useRef<IActiveAudioNodes>({})
  const fetchInstrument = useCallback(async (instrumentName) => {
    const instrument = await Soundfont.instrument(audioContext, instrumentName, {
      format,
      soundfont,
      nameToUrl: (name: string, soundfont: string, format: string) =>
        `${hostname}/${soundfont}/${name}-${format}.js`,
    })
    return instrument
  }, [format, soundfont])

  const loadInstrument = useCallback(
    async (instrumentName) => {
      setCurrentInstrument(null)
      if (cachedInstruments?.[instrumentName]) {
        return setCurrentInstrument(cachedInstruments?.[instrumentName])
      }
      const instrument = await fetchInstrument(instrumentName)
      setCurrentInstrument(instrument)
      setCachedInstruments({
        [instrumentName]: instrument,
      })
    },
    [setCurrentInstrument, setCachedInstruments, cachedInstruments, fetchInstrument]
  )
  // const startNote = useCallback((midiNumber, instrumentName?: string) => {
  //   return audioContext.resume().then(() => {
  //     const audioNode = instrumentName ? cachedInstruments?.[instrumentName]?.play(midiNumber) : currentInstrument?.play(midiNumber)
  //     if (audioNode) {
  //       activeAudioNodes.current = ({ ...activeAudioNodes.current, [midiNumber]: audioNode })
  //     }
  //   })
  // }, [currentInstrument, cachedInstruments, activeAudioNodes])

  // const stopNote = useCallback(midiNumber => {
  //   const { current: audioNodes } = activeAudioNodes
  //   return audioContext.resume().then(() => {
  //     // @ts-ignore
  //     audioNodes && audioNodes[midiNumber] && audioNodes[midiNumber].stop()
  //     activeAudioNodes.current = ({ ...audioNodes, [midiNumber]: null })
  //   })
  // }, [])

  // const playNote = useCallback((midiNumber, duration, instrumentName) => {
  //   startNote(midiNumber, instrumentName)
  //   window.setTimeout(() => {
  //     stopNote(midiNumber)
  //   }, duration * 1000)
  // }, [startNote, stopNote])

  // const playAll = useCallback(async (channels: Array<Channel>) => {
  //   let joinedEvents: any = []
  //   if (channels.length > 0) {
  //     joinedEvents = channels.map((channel: Channel) => {
  //       return channel.notes.map((note) => {
  //         return ({ ...note, ...{ instrumentName: channel.instrumentName } })
  //       })
  //     })
  //   }
  //   const startAndEndTimes = uniq(
  //     flatMap(joinedEvents, (event) => [event.time, event.time + event.duration])
  //   )
  //   startAndEndTimes.forEach((time, i) => {
  //     scheduledEvents.push(
  //       setTimeout(() => {
  //         const currentEvents = joinedEvents.filter((event: PlayEvent) => {
  //           return event.time <= time && event.time + event.duration > time
  //         })
  //         currentEvents.forEach((ce: PlayChannelEvent) => {
  //           playNote(ce.midiNumber, ce.duration, ce.instrumentName)
  //         })
  //       }, time * 1000)
  //     )
  //   })
  // }, [scheduledEvents, playNote])

  // // Clear any residual notes that don't get called with stopNote
  // const stopAllNotes = useCallback(() => {
  //   audioContext.resume().then(() => {
  //     const activeAudioNodesValues = Object.values(activeAudioNodes.current || {})
  //     activeAudioNodesValues.forEach(node => {
  //       if (node) {
  //         node.stop()
  //       }
  //     })
  //     activeAudioNodes.current = {}
  //   })
  // }, [activeAudioNodes])

  // const stopPlayAll = useCallback(() => {
  //   scheduledEvents.forEach(scheduledEventId => {
  //     clearTimeout(scheduledEventId)
  //   })
  //   stopAllNotes()
  // }, [scheduledEvents, stopAllNotes])

  // // channelsToPlaylist = async (channels) => {
  // //   channels.forEach(async c => {
  // //     this.instruments[c.instrumentName] = await this.loadChannelInstrument(c.instrumentName)
  // //   })
  // // }


  useEffect(() => {
    loadInstrument(instrumentName)
  }, [loadInstrument, instrumentName])

  const ctxValue = useMemo(
    () => ({
      currentInstrument,
      cachedInstruments,
      loadInstrument,
      loading: !currentInstrument,
    }),
    [currentInstrument, loadInstrument, cachedInstruments]
  )
  return (
    <SoundfontProviderContext.Provider value= { ctxValue } >
    { children }
    </SoundfontProviderContext.Provider>
  )
}

SoundfontProvider.defaultProps = appConfig.soundFontDefaults

export default SoundfontProvider
