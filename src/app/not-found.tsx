import Link from "next/link"

export default function NotFound(){
    return(
        <main className="grid min-h-[100vh] place-items-center bg-[linear-gradient(135deg,#002B23_0%,#004D3C_100%)] bg-no-repeat bg-cover px-6 py-24 sm:py-32 lg:px-8">
            <div className="text-center">
                <p className="text-base font-semibold text-primary-dull">404</p>
                <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl">Page not found</h1>
                <p className="mt-6 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">Sorry, we couldn&quot;t find the page you&quot;re looking for.</p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/home" className="rounded-md bg-primary-dull px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dull">Go back home</Link>
                <Link href="/contact" className="text-sm font-semibold text-white hover:text-primary-bright">Contact support <span aria-hidden="true">&rarr;</span></Link>
            </div>
        </div>
</main>
    )
}