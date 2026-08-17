import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { ClippedPanel } from '@/components/clipped-panel'
import { useIndexStore } from '@/stores/index-store'
import { useNavStore } from '@/stores/nav-store'
import { Astroprisma } from '@/components/astroprisma'

/** Data controls and credits. */
export function SettingsScreen() {
  const reset = useIndexStore((s) => s.reset)
  const goTo = useNavStore((s) => s.goTo)
  const [open, setOpen] = useState(false)

  const clearData = async () => {
    await reset()
    setOpen(false)
    goTo('splash')
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-6 p-4">
        <ClippedPanel tone="ink" className="p-0 border border-accent-pink">
          <div className="relative px-4 w-full h-8 bg-accent-pink">
            <h2 className="-bottom-3 absolute font-powerr font-extrabold text-background text-3xl uppercase">
              Your data
            </h2>
          </div>
          <div className="p-4">
            <p className="font-mono text-astro-white/70 text-sm leading-relaxed mt1">
              Your book index lives only in this browser. Clearing it removes
              everything AstroIndex has stored and takes you back to the
              importer.
            </p>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="destructive"
                    className="gap-1.5 mt-4 text-white bg-accent-pink!"
                  />
                }
              >
                <Trash2 className="size-4" />
                Clear my data
              </DialogTrigger>
              <DialogContent className="bg-background p-0 rounded">
                <DialogHeader className="">
                  <DialogTitle className="relative bg-warg-red p-2 rounded-t-lg h-10 font-powerr font-extrabold text-background text-3xl uppercase">
                    <span className="-bottom-3 absolute">
                      Clear your index?
                    </span>
                  </DialogTitle>
                  <DialogDescription className="p-4">
                    This removes your extracted book index from this device.
                    You'll need to re-import your PDF to use AstroIndex again.
                    This can't be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="bg-background mx-0">
                  <DialogClose
                    render={
                      <Button variant="outline" className="bg-warg-red h-10" />
                    }
                  >
                    Cancel
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => void clearData()}
                    className="bg-warg-red! h-10 text-white"
                  >
                    Clear my data
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </ClippedPanel>

        <ClippedPanel className="p-0 border border-medusa-green">
          <div className="relative bg-medusa-green px-4 w-full h-8">
            <h2 className="-bottom-3 absolute font-powerr font-extrabold text-background text-3xl uppercase">
              Explore
            </h2>
          </div>
          <dl className="flex flex-col gap-3 mt-2 p-4 font-mono text-astro-white/70 text-sm">
            <p className="font-mono text-astro-white/70 text-sm leading-relaxed">
              This app requires you to have purchased a copy of <Astroprisma />{' '}
              and is designed to support the physical edition of the book.
            </p>
            <div>
              <dt className="text-astro-white">
                Explore the world of <Astroprisma />
              </dt>
              <dd className="text-medusa-green">
                <a
                  href="https://www.astroprisma.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.astroprisma.com/
                </a>
              </dd>
            </div>
            <div>
              <dt>
                Buy <Astroprisma />
              </dt>
              <dd className="text-medusa-green">
                <a
                  href="https://astroprismastore.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://astroprismastore.com/
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-astro-white">Graham Coulby</dt>
              <dd className="text-astro-white/60">AstroIndex, this app</dd>
            </div>
          </dl>
        </ClippedPanel>

        <ClippedPanel className="relative p-0 border border-corsair-yellow">
          <div className="relative bg-corsair-yellow px-4 w-full h-8">
            <h2 className="-bottom-3 absolute font-powerr font-extrabold text-background text-3xl uppercase">
              Credits
            </h2>
          </div>

          <dl className="flex flex-col gap-3 mt-1 p-4 font-mono text-astro-white/70 text-sm">
            <div>
              <dt className="text-astro-white">Crescent Chimera</dt>
              <dd className="text-astro-white/60">
                Creators of <Astroprisma />
              </dd>
              <dd className="text-corsair-yellow">
                <a
                  href="https://crescent-chimera.itch.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://crescent-chimera.itch.io/
                </a>
              </dd>
            </div>
            <div>
              <dt>
                <Astroprisma />
              </dt>
              <dd className="text-astro-white/60">
                The tabletop RPG this index is built for
              </dd>
              <dd className="text-corsair-yellow">
                <a
                  href="https://www.astroprisma.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.astroprisma.com/
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-astro-white">Graham Coulby</dt>
              <dd className="text-astro-white/60">
                AstroIndex <span className="italic">(this app)</span>
              </dd>
              <dd className="text-corsair-yellow">
                <a
                  href="https://www.grahamcoulby.co.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.grahamcoulby.co.uk/
                </a>
              </dd>
            </div>
          </dl>
        </ClippedPanel>
      </div>
    </ScrollArea>
  )
}
