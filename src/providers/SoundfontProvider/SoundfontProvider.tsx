import React, { createContext, useCallback, useState, useEffect, useMemo, ReactElement } from 'react'
import Soundfont from 'soundfont-player'
import appConfig from '../../config'
import {
  SoundfontProviderContextValue,
  SoundfontFormat,
  SoundfontType,
  ICachedInstruments,
  TCurrentInstrument,
  
} from './SoundFontProvider.types'
import { audioContext } from '../../globals'


const hostname = appConfig.soundfont.hostname

export type SoundfontProviderProps = {
  instrumentName: string;
  format: SoundfontFormat;
  soundfont: SoundfontType;
  children: ReactElement;
};

const initialCtxValue = {
  currentInstrument: {
    name: 'acoustic_grand_piano',
    player: null
  },
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
}: SoundfontProviderProps) : JSX.Element {
  

  const [currentInstrument, setCurrentInstrument] = useState<TCurrentInstrument | null>(null)
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
        return setCurrentInstrument({name: instrumentName, player: cachedInstruments?.[instrumentName] })
      }
      const instrument = await fetchInstrument(instrumentName)
      setCurrentInstrument({
        name: instrumentName,
        player: instrument
      })
      setCachedInstruments({
        [instrumentName]: instrument,
      })
    },
    [setCurrentInstrument, setCachedInstruments, cachedInstruments, fetchInstrument]
  )

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
    [currentInstrument, cachedInstruments, loadInstrument]
  )
  return (
    <SoundfontProviderContext.Provider value= { ctxValue } >
    { children }
    </SoundfontProviderContext.Provider>
  )
}

SoundfontProvider.defaultProps = appConfig.soundFontDefaults

export default SoundfontProvider
