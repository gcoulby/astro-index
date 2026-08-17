import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import astroCompat from '@/assets/compatability-stamp.png'
import { Logo } from '@/components/logo'
import { ClippedPanel } from '@/components/clipped-panel'
import FileInput from '@/components/file-input'
import { cn } from '@/lib/utils'
import { useNavStore } from '@/stores/nav-store'
import { useIndexStore } from '@/stores/index-store'

const INTRO_MS = 2000
const COLLAPSE_ANIMATION_MS = 2000

const LOADING_MESSAGE: Record<string, string> = {
  hydrating: 'Checking for a saved index…',
  extracting: 'Extracting your index…',
  ready: 'Opening your index…',
}

/** Wordmark intro that collapses into either a loader (a saved index was
 * found and is being opened) or the BYOB uploader (no index yet). */
export function SplashScreen() {
  const goTo = useNavStore((s) => s.goTo)
  const { status, error, buildFromFile } = useIndexStore()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setCollapsed(true), INTRO_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!collapsed || status !== 'ready') return
    const timer = setTimeout(
      () => goTo('pageNumberSearch'),
      COLLAPSE_ANIMATION_MS,
    )
    return () => clearTimeout(timer)
  }, [collapsed, status, goTo])

  const isLoading =
    status === 'hydrating' || status === 'extracting' || status === 'ready'

  return (
    <main className="flex flex-col items-center bg-astro-black h-dvh text-astro-white">
      <header
        className={cn(
          'flex flex-col justify-center items-center font-powerr font-extrabold text-6xl transition-all duration-700 ease-in-out',
          collapsed ? 'h-[20%] py-0' : 'h-[500dvh] py-20 ',
        )}
      >
        <div className="flex flex-row items-center">
          <Logo />
        </div>

        <p
          className={cn(
            'font-mono text-astro-white/60 transition-all duration-700',
            collapsed ? 'text-[9pt]' : 'text-[12pt]',
          )}
        >
          A digital index for the Astroprisma book
        </p>
      </header>

      <section className="flex flex-col justify-center items-center gap-8 px-6 w-5/6 overflow-hidden grow">
        <div
          className={cn(
            'flex flex-col items-center gap-8 -mt-16 transition-opacity duration-700 delay-300',
            collapsed ? 'opacity-100' : 'opacity-0',
          )}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 font-mono text-astro-white/60 text-sm">
              <Loader2 className="size-6 animate-spin text-accent-pink" />
              {LOADING_MESSAGE[status]}
            </div>
          ) : (
            <>
              <ClippedPanel
                tone="ink"
                className="border border-accent-pink/40 max-w-lg astro-clip"
              >
                <h1 className="font-powerr font-extrabold text-2xl text-accent-pink">
                  Bring your own book
                </h1>
                <p className="mt-2 font-mono text-astro-white/80 text-sm leading-relaxed">
                  AstroIndex does not ship with any book data. After purchasing
                  a copy of AstroPrisma, import the single-page edition using
                  the uploader below. This will build your local index. Nothing
                  is uploaded! Extraction happens entirely in this browser and
                  your index stays on your device.
                </p>
              </ClippedPanel>

              <FileInput
                accept="application/pdf"
                onFileSelected={buildFromFile}
              />

              {status === 'error' && (
                <p className="font-mono text-sm text-accent-pink">{error}</p>
              )}
            </>
          )}
        </div>
      </section>

      <img
        src={astroCompat}
        alt="astro prisma compatability"
        className={cn(
          'transition-all duration-700',
          collapsed ? 'w-35' : 'mt-10 w-45',
        )}
      />
    </main>
  )
}
