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
        <ClippedPanel tone="ink" className="border border-astro-white/15">
          <h1 className="font-powerr text-xl font-extrabold">Your data</h1>
          <p className="mt-2 font-mono text-sm leading-relaxed text-astro-white/70">
            Your book index lives only in this browser. Clearing it removes
            everything AstroIndex has stored and takes you back to the
            uploader.
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button variant="destructive" className="mt-4 gap-1.5" />
              }
            >
              <Trash2 className="size-4" />
              Clear my data
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear your index?</DialogTitle>
                <DialogDescription>
                  This removes your extracted book index from this device.
                  You'll need to re-import your PDF to use AstroIndex again.
                  This can't be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button variant="destructive" onClick={() => void clearData()}>
                  Clear my data
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ClippedPanel>

        <ClippedPanel tone="ink" className="border border-astro-white/15">
          <h2 className="font-powerr text-xl font-extrabold text-accent-pink">
            Credits
          </h2>
          <dl className="mt-3 flex flex-col gap-3 font-mono text-sm text-astro-white/70">
            <div>
              <dt className="text-astro-white">Crescent Chimera</dt>
              <dd className="text-astro-white/60">
                Creators of AstroPrisma
              </dd>
            </div>
            <div>
              <dt className="text-astro-white">AstroPrisma</dt>
              <dd className="text-astro-white/60">
                The tabletop RPG this index is built for
              </dd>
            </div>
            <div>
              <dt className="text-astro-white">Graham Coulby</dt>
              <dd className="text-astro-white/60">AstroIndex, this app</dd>
            </div>
          </dl>
        </ClippedPanel>
      </div>
    </ScrollArea>
  )
}
