"use client";
export default function ErrorPage({reset}:{reset:()=>void}) {return <section className="container-page py-20 text-center"><h1 className="text-2xl font-bold">The catalog is temporarily unavailable</h1><p className="mt-4">Please try again or contact contact@pubsetup.com.</p><button className="mt-6 text-primary" onClick={reset}>Try again</button></section>;}
