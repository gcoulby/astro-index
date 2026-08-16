import FileInput from './components/file-input'
import astroCompat from './assets/compatability-stamp.png'
import { Logo } from './components/logo'

function App() {
  return (
    <main className="flex flex-col justify-center items-center h-dvh">
      <div className="flex flex-col justify-center items-center py-20 font-powerr font-extrabold text-6xl">
        <div className="flex flex-row">
          <Logo />
          <span className="h-14">AstroIndex</span>
        </div>

        <p className="text-[12pt] text-muted-foreground">
          A digital index for the Astroprisma book
        </p>
      </div>
      <div className="flex justify-center items-center grow">
        <FileInput />
      </div>

      <img
        src={astroCompat}
        alt="astro prisma compatability"
        className="w-45"
      />
    </main>
  )
}

export default App
