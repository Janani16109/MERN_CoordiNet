import Image from "next/image"
import Link from "next/link"

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="flex-center wrapper flex-between flex flex-col gap-4 p-5 text-center sm:flex-row">
        <Link href='/'>
          <Image 
<<<<<<< HEAD
            src="/assets/images/logo.svg"
            alt="logo"
=======
            src="/assets/images/logo.png"
            alt="Coordi-Net"
>>>>>>> 753218d (Pic rectified)
            width={128}
            height={38}
          />
        </Link>

        <p>2025 Coordi-Net. All Rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer